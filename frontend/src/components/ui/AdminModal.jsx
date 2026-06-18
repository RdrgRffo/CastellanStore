/**
 * AdminModal — Modal reutilizable para mostrar detalles de registros en el panel de administración.
 * Mismo estilo que el modal de pedidos: fondo semi-transparente, cabecera sticky, scroll.
 */

export default function AdminModal({ isOpen, onClose, title, badge, children, loading, error }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Cabecera del modal */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-display font-bold uppercase tracking-wider">
              {title}
            </h2>
            {badge && (
              <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${badge.className || 'bg-gray-50 text-gray-500'}`}>
                {badge.label}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-premium-gray-dark hover:text-premium-black text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center text-premium-gray-dark">Cargando detalles...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : (
          <div className="p-6 space-y-6">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
