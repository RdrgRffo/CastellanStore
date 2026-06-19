export default function DashboardStatsGrid({ data }) {
  const cards = [
    { label: 'Pedidos totales', value: data.totalOrders, color: 'bg-blue-600' },
    { label: 'Productos', value: data.totalProducts, color: 'bg-slate-800' },
    { label: 'Cupones', value: data.totalCoupons, color: 'bg-violet-600' },
    { label: 'Usuarios', value: data.totalUsers, color: 'bg-amber-600' },
    { label: 'Ingresos totales', value: `${Number(data.totalRevenue).toFixed(2)} €`, color: 'bg-emerald-700' },
    { label: 'Ingresos del mes', value: `${Number(data.monthRevenue).toFixed(2)} €`, color: 'bg-teal-700' },
    { label: 'Pedidos hoy', value: data.todayOrders, color: 'bg-rose-600' },
    { label: 'Stock bajo (≤5)', value: data.lowStockProducts, color: 'bg-red-600' },
    { label: 'Ticket medio', value: `${Number(data.averageOrderValue).toFixed(2)} €`, color: 'bg-indigo-600' },
    { label: 'Tasa de conversión', value: `${data.conversionRate}%`, color: 'bg-cyan-700' },
    { label: 'Sin stock', value: data.outOfStockProducts, color: 'bg-orange-600' },
    { label: 'Cupones activos', value: data.activeCoupons, color: 'bg-pink-600' },
    { label: 'Nuevos usuarios (mes)', value: data.newUsersThisMonth, color: 'bg-lime-600' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {cards.map((card) => (
        <div key={card.label} className={`${card.color} rounded p-4 text-white shadow-md`}>
          <p className="text-xs uppercase tracking-wider opacity-80 mb-1 font-medium">{card.label}</p>
          <p className="text-2xl font-display font-bold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
