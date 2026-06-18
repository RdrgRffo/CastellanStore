import { useState, useMemo } from 'react';

/**
 * AdminTable — Componente reutilizable para tablas CRUD del panel de administración.
 * Proporciona: paginación (20 registros), ordenamiento por columnas, diseño homogéneo.
 *
 * Uso:
 *   <AdminTable
 *     columns={[{ key: 'name', label: 'Nombre', sortable: true }, ...]}
 *     data={items}
 *     loading={loading}
 *     emptyMessage="No hay datos"
 *     totalItems={total}
 *     page={page}
 *     totalPages={totalPages}
 *     onPageChange={setPage}
 *     renderRow={(item) => <tr>...</tr>}
 *   />
 */

const SORT_ICONS = {
  asc: ' ▲',
  desc: ' ▼',
  none: '',
};

export default function AdminTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No se encontraron registros',
  totalItems = 0,
  page = 0,
  totalPages = 0,
  pageSize = 20, // eslint-disable-line no-unused-vars
  onPageChange = () => {},
  renderRow = null,
  onRowClick = null,
  children,
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string') {
        const cmp = aVal.localeCompare(bVal, 'es');
        return sortDir === 'asc' ? cmp : -cmp;
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [data, sortKey, sortDir]);

  return (
    <div>
      {/* Contador */}
      <p className="text-sm text-premium-gray-dark mb-4">{totalItems} registros en total</p>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-5 py-4 uppercase tracking-wider font-medium text-premium-gray-dark ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    } ${col.sortable ? 'cursor-pointer select-none hover:text-premium-black transition-colors' : ''}`}
                    onClick={() => col.sortable && handleSort(col.key)}
                    style={{ minWidth: col.minWidth || 'auto' }}
                  >
                    {col.label}
                    {col.sortable && (
                      <span className="text-xs ml-1">
                        {sortKey === col.key ? SORT_ICONS[sortDir] : SORT_ICONS.none}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-8 text-premium-gray-dark">
                    Cargando...
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-8 text-premium-gray-dark">
                    {emptyMessage}
                  </td>
                </tr>
              ) : children ? (
                children(sortedData)
              ) : renderRow ? (
                sortedData.map((item, idx) => (
                  <tr
                    key={item._id || idx}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => onRowClick && onRowClick(item)}
                  >
                    {renderRow(item)}
                  </tr>
                ))
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => onPageChange(Math.max(0, page - 1))}
            disabled={page === 0}
            className="btn-secondary text-xs disabled:opacity-50"
          >
            Anterior
          </button>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            // Mostrar ventana de páginas alrededor de la actual
            const start = Math.max(0, Math.min(page - 4, totalPages - 10));
            const pageNum = start + i;
            if (pageNum >= totalPages) return null;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 text-xs rounded ${
                  page === pageNum
                    ? 'bg-cuero-500 text-white'
                    : 'bg-white border border-gray-200 text-premium-gray-dark hover:bg-gray-50'
                }`}
              >
                {pageNum + 1}
              </button>
            );
          })}
          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="btn-secondary text-xs disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
