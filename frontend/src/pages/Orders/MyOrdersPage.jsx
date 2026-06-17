import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchUserOrders, cancelOrder } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { formatPrice } from '../../utils/formatPrice';
import { getImageUrl } from '../../services/apiClient';

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS = {
  PENDING: 'text-yellow-600 bg-yellow-50',
  CONFIRMED: 'text-blue-600 bg-blue-50',
  SHIPPED: 'text-purple-600 bg-purple-50',
  DELIVERED: 'text-green-600 bg-green-50',
  CANCELLED: 'text-red-600 bg-red-50',
};

// eslint-disable-next-line no-unused-vars
const STATUS_ORDER = ['pending', 'confirmed', 'shipped', 'delivered'];

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [error, setError] = useState('');

  const loadOrders = () => {
    if (!user) return;
    setLoading(true);
    setError('');
    fetchUserOrders(page, 10)
      .then(data => {
        setOrders(data.orders || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => {
        setOrders([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders();
  }, [user, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancelOrder = async (orderId) => {
    setCancellingId(orderId);
    setError('');
    try {
      await cancelOrder(orderId);
      setConfirmCancelId(null);
      loadOrders();
    } catch (err) {
      setError(err?.message || 'Error al cancelar el pedido');
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-display text-premium-black mb-4">Inicia sesión para ver tus pedidos</h1>
        <Link to="/auth" className="btn-cuero inline-block">
          Iniciar Sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="container-premium py-12">
      <h1 className="text-3xl font-display text-premium-black mb-8">Mis Pedidos</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-cuero-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-premium-gray-dark">Cargando pedidos...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 border border-premium-gray">
          <p className="text-premium-gray-dark mb-4">No tienes pedidos todavía</p>
          <Link to="/shop" className="btn-cuero inline-block">
            Ver Colección
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order._id} className="border border-premium-gray p-6">
              {/* Cabecera del pedido */}
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs text-premium-gray-dark uppercase tracking-wider mb-1">
                    Pedido #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-sm text-premium-gray-dark">
                    {new Date(order.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 text-xs font-medium uppercase tracking-wider ${STATUS_COLORS[order.status] || 'text-gray-600 bg-gray-50'}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                  <p className="text-lg font-sans font-semibold tracking-tight text-premium-black mt-2">{formatPrice(order.total)}</p>
                </div>
              </div>

              {/* Tracking number */}
              {order.trackingNumber && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200">
                  <p className="text-xs uppercase tracking-wider text-purple-700 mb-1">Código de Seguimiento</p>
                  <p className="text-sm font-medium text-purple-900">{order.trackingNumber}</p>
                </div>
              )}

              {/* Productos */}
              {order.items && order.items.length > 0 && (
                <div className="border-t border-premium-gray pt-4">
                  <p className="text-xs uppercase tracking-wider text-premium-gray-dark mb-3">Productos</p>
                  <div className="space-y-2">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        {item.image && (
                          <img src={getImageUrl(item.image)} alt={item.name} className="w-10 h-10 object-cover" />
                        )}
                        <span className="flex-1 text-premium-black">{item.name}</span>
                        <span className="text-premium-gray-dark">x{item.quantity}</span>
                        <span className="text-premium-black font-medium">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-premium-gray-dark">+{order.items.length - 3} productos más</p>
                    )}
                  </div>
                </div>
              )}

              {/* Historial de estados */}
              {order.statusHistory && order.statusHistory.length > 0 && (
                <div className="border-t border-premium-gray pt-4 mt-4">
                  <p className="text-xs uppercase tracking-wider text-premium-gray-dark mb-3">Historial de Estados</p>
                  <div className="space-y-2">
                    {order.statusHistory.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          entry.status === 'cancelled' ? 'bg-red-500' :
                          entry.status === 'delivered' ? 'bg-green-500' :
                          entry.status === 'shipped' ? 'bg-purple-500' :
                          entry.status === 'confirmed' ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`} />
                        <span className="text-premium-black font-medium capitalize">
                          {STATUS_LABELS[entry.status] || entry.status}
                        </span>
                        <span className="text-premium-gray-dark text-xs">
                          {new Date(entry.changedAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {entry.changedBy && entry.changedBy !== 'system' && (
                          <span className="text-premium-gray-dark text-xs">
                            — por {entry.changedBy === user?.id ? 'ti' : 'admin'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => {
                    const base = import.meta.env.VITE_API_URL || 'http://localhost:9100/api/v1';
                    window.open(`${base}/invoices/${order.orderNumber}/pdf`, '_blank');
                  }}
                  className="text-xs uppercase tracking-wider text-cuero-500 hover:text-cuero-600 transition-colors"
                >
                  Ver Factura →
                </button>

                {order.status === 'pending' && (
                  <>
                    {confirmCancelId === order._id ? (
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs text-red-600">¿Cancelar pedido?</span>
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={cancellingId === order._id}
                          className="px-3 py-1 text-xs uppercase tracking-wider bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {cancellingId === order._id ? 'Cancelando...' : 'Sí, Cancelar'}
                        </button>
                        <button
                          onClick={() => setConfirmCancelId(null)}
                          className="px-3 py-1 text-xs uppercase tracking-wider border border-premium-gray hover:bg-premium-gray-light transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmCancelId(order._id)}
                        className="text-xs uppercase tracking-wider text-red-500 hover:text-red-600 transition-colors ml-auto"
                      >
                        Cancelar Pedido
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 text-xs uppercase tracking-wider border border-premium-gray disabled:opacity-50 hover:bg-premium-gray-light transition-colors"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-xs text-premium-gray-dark">
                Página {page + 1} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 text-xs uppercase tracking-wider border border-premium-gray disabled:opacity-50 hover:bg-premium-gray-light transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
