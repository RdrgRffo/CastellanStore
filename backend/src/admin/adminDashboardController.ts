import { Request, Response, NextFunction } from 'express';
import Order from '../orders/Order.js';
import Watch from '../catalog/Watch.js';
import Coupon from '../coupons/Coupon.js';
import User from '../auth/User.js';
import { sendSuccess } from '../shared/utils/ApiResponse.js';

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [
      totalOrders,
      totalProducts,
      totalCoupons,
      totalUsers,
      recentOrders,
      lowStockProducts,
      criticalStockProducts,
      ordersByStatus,
      topProducts,
      weeklySales,
      activeCoupons,
      outOfStockProducts,
      newUsersThisMonth,
    ] = await Promise.all([
      Order.countDocuments(),
      Watch.countDocuments(),
      Coupon.countDocuments(),
      User.countDocuments(),
      Order.find().sort({ createdAt: -1 }).limit(5).lean(),
      Watch.find({ stock: { $lte: 5 } }).countDocuments(),
      Watch.find({ stock: { $lte: 3 } }).sort({ stock: 1 }).limit(10).lean(),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      // Top 5 productos más vendidos
      Order.aggregate([
        { $match: { status: { $ne: 'CANCELLED' } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.watchId', name: { $first: '$items.name' }, totalSold: { $sum: '$items.quantity' } } },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
      ]),
      // Ventas de los últimos 7 días
      Order.aggregate([
        { $match: { status: { $ne: 'CANCELLED' }, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$total' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      // Cupones activos (no expirados y con usos disponibles)
      Coupon.countDocuments({
        $or: [
          { expiresAt: { $gte: new Date() } },
          { expiresAt: { $exists: false } },
        ],
        $and: [
          { $or: [{ maxUses: { $exists: false } }, { $expr: { $lt: ['$usedCount', '$maxUses'] } }] },
        ],
      }),
      // Productos sin stock
      Watch.countDocuments({ stock: { $lte: 0 } }),
      // Usuarios nuevos este mes
      User.countDocuments({
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      }),
    ]);

    // Calcular ingresos totales
    const revenueResult = await Order.aggregate([
      { $match: { status: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Ingresos del mes actual
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthRevenueResult = await Order.aggregate([
      { $match: { status: { $ne: 'CANCELLED' }, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const monthRevenue = monthRevenueResult.length > 0 ? monthRevenueResult[0].total : 0;

    // Pedidos de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today },
    });

    // Average order value (ingresos totales / pedidos no cancelados)
    const nonCancelledOrders = await Order.countDocuments({ status: { $ne: 'CANCELLED' } });
    const averageOrderValue = nonCancelledOrders > 0 ? Math.round((totalRevenue / nonCancelledOrders) * 100) / 100 : 0;

    // Conversion rate (entregados / no cancelados)
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const conversionRate = nonCancelledOrders > 0 ? Math.round((deliveredOrders / nonCancelledOrders) * 10000) / 100 : 0;

    // Redondear valores monetarios a 2 decimales
    const roundedTotalRevenue = Math.round(totalRevenue * 100) / 100;
    const roundedMonthRevenue = Math.round(monthRevenue * 100) / 100;
    const roundedAverageOrderValue = Math.round(averageOrderValue * 100) / 100;

    sendSuccess(res, {
      data: {
        totalOrders,
        totalProducts,
        totalCoupons,
        totalUsers,
        totalRevenue: roundedTotalRevenue,
        monthRevenue: roundedMonthRevenue,
        todayOrders,
        lowStockProducts,
        averageOrderValue: roundedAverageOrderValue,
        conversionRate,
        outOfStockProducts,
        activeCoupons,
        newUsersThisMonth,
        criticalStock: criticalStockProducts.map((w: any) => ({
          _id: w._id,
          name: w.name,
          stock: w.stock,
          mpn: w.mpn,
          sku: w.sku,
        })),
        recentOrders,
        ordersByStatus: ordersByStatus.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        topProducts,
        weeklySales,
      },
    });
  } catch (err) {
    next(err);
  }
}
