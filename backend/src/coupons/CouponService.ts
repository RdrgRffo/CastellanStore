import Coupon from './Coupon.js';
import UserCoupon from '../loyalty/UserCoupon.js';
import Watch from '../catalog/Watch.js';

/**
 * Calcula el subtotal elegible para descuento (solo productos sin descuento previo).
 * Si algún producto tiene oldPrice (está rebajado), se excluye del cálculo del cupón.
 */
async function getEligibleSubtotal(items?: { watchId: string; price: number; quantity: number }[]): Promise<number> {
  if (!items || items.length === 0) return 0;

  const watchIds = items.map(item => item.watchId);
  const watches = await Watch.find({ _id: { $in: watchIds } }).select('_id oldPrice price').lean();

  const watchMap = new Map(watches.map(w => [w._id.toString(), w]));

  let eligibleTotal = 0;
  for (const item of items) {
    const watch = watchMap.get(item.watchId);
    // Si el producto NO tiene oldPrice (no está rebajado), es elegible para cupón
    if (watch && !watch.oldPrice) {
      eligibleTotal += item.price * item.quantity;
    }
  }

  return eligibleTotal;
}

export async function validate(
  code: string,
  subtotal: number,
  userId?: string,
  items?: { watchId: string; price: number; quantity: number }[]
) {
  // Calcular subtotal elegible (solo productos sin descuento)
  const eligibleSubtotal = items ? await getEligibleSubtotal(items) : subtotal;

  // Si no hay productos elegibles, el cupón no puede aplicarse
  if (eligibleSubtotal <= 0 && items && items.length > 0) {
    return {
      valid: false,
      discount: 0,
      message: 'Este cupón no puede aplicarse a productos que ya están rebajados',
    };
  }

  // 1. Buscar primero en cupones globales (Coupon)
  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    active: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gte: new Date() } },
    ],
  });

  if (coupon) {
    if (subtotal < coupon.minAmount) {
      return {
        valid: false,
        discount: 0,
        message: `Pedido mínimo de ${coupon.minAmount} € para este cupón`,
      };
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return { valid: false, discount: 0, message: 'Este cupón ha alcanzado su límite de usos' };
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      // El porcentaje se aplica SOLO sobre el subtotal elegible (productos sin descuento)
      discount = eligibleSubtotal * (coupon.discount / 100);
    } else {
      discount = coupon.discount;
    }

    coupon.usedCount += 1;
    await coupon.save();

    return {
      valid: true,
      discount: Math.min(discount, subtotal),
      code: coupon.code,
      message: `¡Cupón aplicado! Descuento: ${discount.toFixed(2)} €`,
    };
  }

  // 2. Buscar en cupones personalizados de usuario (UserCoupon)
  if (userId) {
    const userCoupon = await UserCoupon.findOne({
      userId,
      code: code.toUpperCase(),
      isUsed: false,
      expiresAt: { $gte: new Date() },
    });

    if (userCoupon) {
      // El porcentaje se aplica SOLO sobre el subtotal elegible
      const discount = eligibleSubtotal * (userCoupon.discountPercent / 100);

      userCoupon.isUsed = true;
      await userCoupon.save();

      return {
        valid: true,
        discount: Math.min(discount, subtotal),
        code: userCoupon.code,
        message: `¡Cupón de bienvenida aplicado! Descuento: ${discount.toFixed(2)} €`,
      };
    }
  }

  return { valid: false, discount: 0, message: 'Código de cupón inválido' };
}
