export default function DashboardWeeklySales({ data }) {
  const weeklySales = data?.weeklySales || [];

  return (
    <div className="bg-white border border-gray-200 p-4">
      <h2 className="text-sm uppercase tracking-wider font-medium text-premium-black mb-4">Ventas últimos 7 días</h2>
      {weeklySales.length > 0 ? (
        <div className="space-y-2">
          {weeklySales.map((day) => (
            <div key={day._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm text-premium-gray-dark">{new Date(day._id).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              <div className="text-right">
                <span className="text-sm font-medium text-premium-black">{day.count} pedidos</span>
                <span className="text-sm text-premium-gray-dark ml-2">{Number(day.total).toFixed(2)} €</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-premium-gray-dark">No hay ventas en los últimos 7 días</p>
      )}
    </div>
  );
}
