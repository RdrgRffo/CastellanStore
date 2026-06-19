import { useState } from 'react';

const ITEMS_PER_PAGE = 5;

export default function DashboardCriticalStock({ data }) {
  const [page, setPage] = useState(0);
  const items = data?.criticalStock || [];
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const paginated = items.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  return (
    <div className="bg-white border border-gray-200 p-4">
      <h2 className="text-sm uppercase tracking-wider font-medium text-premium-black mb-4">
        Stock crítico (≤3 unidades)
      </h2>
      {items.length > 0 ? (
        <>
          <div className="space-y-2">
            {paginated.map((w) => (
              <div key={w._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-premium-black">{w.name}</p>
                  <p className="text-xs text-premium-gray-dark font-mono">{w.mpn} / {w.sku}</p>
                </div>
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">{w.stock} uds.</span>
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
        <p className="text-sm text-premium-gray-dark">No hay productos con stock crítico</p>
      )}
    </div>
  );
}
