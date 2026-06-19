import { useState } from 'react';

const ITEMS_PER_PAGE = 5;

const statusLabels = { pending: 'Pendiente', confirmed: 'Confirmado', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado' };
const statusColors = { pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800', shipped: 'bg-purple-100 text-purple-800', delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800' };

export default function DashboardRecentOrders({ data }) {
  const [page, setPage] = useState(0);
  const items = data?.recentOrders || [];
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const paginated = items.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  return (
    <div className="bg-white border border-gray-200 p-4 lg:col-span-2">
      <h2 className="text-sm uppercase tracking-wider font-medium text-premium-black mb-4">Pedidos recientes</h2>
      {items.length > 0 ? (
        <>
          <div className="space-y-2">
            {paginated.map((order) => (
              <div key={order._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-mono font-medium text-premium-black">{order.orderNumber}</p>
                  <p className="text-sm text-premium-gray-dark">{order.shippingInfo?.name || '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{Number(order.total).toFixed(2)} €</p>
                  <span className={`inline-block px-1.5 py-0.5 text-xs rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="text-xs px-2 py-1 border border-gray-200 rounded disabled:opacity-50 hover:bg-gray-50">Anterior</button>
              <span className="text-xs text-premium-gray-dark">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="text-xs px-2 py-1 border border-gray-200 rounded disabled:opacity-50 hover:bg-gray-50">Siguiente</button>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-premium-gray-dark">No hay pedidos recientes</p>
      )}
    </div>
  );
}
