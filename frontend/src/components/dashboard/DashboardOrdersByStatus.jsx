const statusLabels = { pending: 'Pendiente', confirmed: 'Confirmado', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado' };
const statusColors = { pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800', shipped: 'bg-purple-100 text-purple-800', delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800' };

export default function DashboardOrdersByStatus({ data }) {
  const ordersByStatus = data?.ordersByStatus || {};

  return (
    <div className="bg-white border border-gray-200 p-4">
      <h2 className="text-sm uppercase tracking-wider font-medium text-premium-black mb-4">Pedidos por estado</h2>
      {Object.keys(ordersByStatus).length > 0 ? (
        <div className="space-y-3">
          {Object.entries(ordersByStatus).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between">
              <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                {statusLabels[status] || status}
              </span>
              <span className="text-sm font-medium text-premium-black">{count}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-premium-gray-dark">No hay pedidos</p>
      )}
    </div>
  );
}
