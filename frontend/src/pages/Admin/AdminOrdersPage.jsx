import { useState, useEffect, useCallback } from 'react';
import { fetchAdminOrders, fetchAdminOrder, updateOrderStatus } from '../../services/api';
import { getImageUrl } from '../../services/apiClient';
import AdminTable from '../../components/ui/AdminTable';
import AdminModal from '../../components/ui/AdminModal';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
];

const STATUS_BADGES = {
  pending: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-blue-50 text-blue-700',
  shipped: 'bg-purple-50 text-purple-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

const STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const COLUMNS = [
  { key: 'orderNumber', label: 'Pedido', sortable: true, minWidth: '120px' },
  { key: 'cliente', label: 'Cliente', sortable: true, minWidth: '150px' },
  { key: 'email', label: 'Email', sortable: false, minWidth: '200px' },
  { key: 'total', label: 'Total', sortable: true, align: 'right', minWidth: '100px' },
  { key: 'status', label: 'Estado', sortable: true, align: 'center', minWidth: '120px' },
  { key: 'createdAt', label: 'Fecha', sortable: true, minWidth: '160px' },
  { key: 'acciones', label: 'Acciones', sortable: false, align: 'center', minWidth: '200px' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Estado del modal de detalles
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchAdminOrders(statusFilter, page, 20);
      setOrders(result.data || []);
      setTotalPages(result.totalPages || 0);
      setTotalItems(result.totalItems || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId, newStatus, e) => {
    if (e) e.stopPropagation();
    setActionLoading(orderId);
    setError('');
    setSuccessMsg('');
    try {
      await updateOrderStatus(orderId, newStatus);
      setSuccessMsg(`Pedido actualizado a "${STATUS_LABELS[newStatus] || newStatus}"`);
      loadOrders();
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openOrderDetails = async (order) => {
    setModalLoading(true);
    setModalError('');
    try {
      const fullOrder = await fetchAdminOrder(order._id);
      setSelectedOrder(fullOrder);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setModalError('');
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return `${Number(amount).toFixed(2)} €`;
  };

  // Mapeamos los datos para incluir campos planos para ordenamiento
  const tableData = orders.map((o) => ({
    ...o,
    cliente: o.shippingInfo?.name || '-',
    email: o.shippingInfo?.email || '-',
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-display uppercase tracking-wider">Pedidos</h1>
        </div>
      </div>

      {/* Filtro por estado */}
      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="input-premium text-xs uppercase tracking-wider w-auto"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 mb-4">{error}</div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-600 text-xs p-3 mb-4">{successMsg}</div>
      )}

      {/* Tabla */}
      <AdminTable
        columns={COLUMNS}
        data={tableData}
        loading={loading}
        emptyMessage="No se encontraron pedidos"
        totalItems={totalItems}
        page={page}
        totalPages={totalPages}
        pageSize={20}
        onPageChange={setPage}
        onRowClick={openOrderDetails}
      >
        {(sortedData) => sortedData.map((order) => (
          <tr
            key={order._id}
            className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => openOrderDetails(order)}
          >
            <td className="px-5 py-4">
              <span className="font-mono text-premium-black font-medium">
                {order.orderNumber}
              </span>
            </td>
            <td className="px-5 py-4">{order.cliente}</td>
            <td className="px-5 py-4 text-premium-gray-dark">{order.email}</td>
            <td className="px-5 py-4 text-right font-medium">{formatCurrency(order.total)}</td>
            <td className="px-5 py-4 text-center">
              <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${STATUS_BADGES[order.status] || 'bg-gray-50 text-gray-500'}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </td>
            <td className="px-5 py-4 text-premium-gray-dark">{formatDate(order.createdAt)}</td>
            <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-center gap-1">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={(e) => handleStatusChange(order._id, 'confirmed', e)}
                      disabled={actionLoading === order._id}
                      className="px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded disabled:opacity-50"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={(e) => handleStatusChange(order._id, 'cancelled', e)}
                      disabled={actionLoading === order._id}
                      className="px-2 py-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 rounded disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </>
                )}
                {order.status === 'confirmed' && (
                  <button
                    onClick={(e) => handleStatusChange(order._id, 'shipped', e)}
                    disabled={actionLoading === order._id}
                    className="px-2 py-1 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 rounded disabled:opacity-50"
                  >
                    Marcar Enviado
                  </button>
                )}
                {order.status === 'shipped' && (
                  <button
                    onClick={(e) => handleStatusChange(order._id, 'delivered', e)}
                    disabled={actionLoading === order._id}
                    className="px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded disabled:opacity-50"
                  >
                    Marcar Entregado
                  </button>
                )}
                {order.status === 'delivered' && (
                  <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700 font-medium">
                    Entregado
                  </span>
                )}
                {order.status === 'cancelled' && (
                  <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-red-50 text-red-700 font-medium">
                    Cancelado
                  </span>
                )}
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>

      {/* Modal de detalles del pedido */}
      <AdminModal
        isOpen={!!selectedOrder}
        onClose={closeOrderDetails}
        title={selectedOrder ? `Pedido ${selectedOrder.orderNumber}` : ''}
        badge={selectedOrder ? {
          label: STATUS_LABELS[selectedOrder.status] || selectedOrder.status,
          className: `inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${STATUS_BADGES[selectedOrder.status] || 'bg-gray-50 text-gray-500'}`,
        } : null}
        loading={modalLoading}
        error={modalError}
      >
        {selectedOrder && (
          <>
            {/* Información del cliente */}
            <div>
              <h3 className="text-xs uppercase tracking-wider font-medium text-premium-gray-dark mb-3">Información del Cliente</h3>
              <div className="bg-gray-50 p-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-premium-gray-dark text-xs">Nombre</span>
                  <p className="font-medium">{selectedOrder.shippingInfo?.name || '-'}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Email</span>
                  <p className="font-medium">{selectedOrder.shippingInfo?.email || '-'}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Teléfono</span>
                  <p className="font-medium">{selectedOrder.shippingInfo?.phone || '-'}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Usuario ID</span>
                  <p className="font-medium text-xs font-mono">{selectedOrder.userId || '-'}</p>
                </div>
              </div>
            </div>

            {/* Dirección de envío */}
            <div>
              <h3 className="text-xs uppercase tracking-wider font-medium text-premium-gray-dark mb-3">Dirección de Envío</h3>
              <div className="bg-gray-50 p-4 text-sm">
                <p className="font-medium">{selectedOrder.shippingInfo?.name}</p>
                <p>{selectedOrder.shippingInfo?.address}</p>
                <p>{selectedOrder.shippingInfo?.city}, {selectedOrder.shippingInfo?.state || ''} {selectedOrder.shippingInfo?.zip}</p>
                <p>{selectedOrder.shippingInfo?.country}</p>
              </div>
            </div>

            {/* Información de pago */}
            <div>
              <h3 className="text-xs uppercase tracking-wider font-medium text-premium-gray-dark mb-3">Información de Pago</h3>
              <div className="bg-gray-50 p-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-premium-gray-dark text-xs">Titular de la tarjeta</span>
                  <p className="font-medium">{selectedOrder.paymentInfo?.cardName || '-'}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Últimos 4 dígitos</span>
                  <p className="font-medium font-mono">{selectedOrder.paymentInfo?.cardLastFour ? `**** ${selectedOrder.paymentInfo.cardLastFour}` : '-'}</p>
                </div>
                {selectedOrder.paymentInfo?.stripePaymentIntentId && (
                  <div className="col-span-2">
                    <span className="text-premium-gray-dark text-xs">PaymentIntent ID (Stripe)</span>
                    <p className="font-medium font-mono text-xs break-all">{selectedOrder.paymentInfo.stripePaymentIntentId}</p>
                  </div>
                )}
                {selectedOrder.paymentInfo?.stripeRefundId && (
                  <div className="col-span-2">
                    <span className="text-premium-gray-dark text-xs">Refund ID (Stripe)</span>
                    <p className="font-medium font-mono text-xs break-all">{selectedOrder.paymentInfo.stripeRefundId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Productos */}
            <div>
              <h3 className="text-xs uppercase tracking-wider font-medium text-premium-gray-dark mb-3">Productos ({selectedOrder.items?.length || 0})</h3>
              <div className="border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-premium-gray-dark">Producto</th>
                      <th className="text-center px-4 py-3 text-xs uppercase tracking-wider font-medium text-premium-gray-dark">Cant.</th>
                      <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-premium-gray-dark">Precio</th>
                      <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-premium-gray-dark">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.image && (
                              <img src={getImageUrl(item.image)} alt={item.name} className="w-10 h-10 object-cover rounded" />
                            )}
                            <span className="font-medium">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resumen de totales */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-premium-gray-dark">Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento</span>
                    <span>-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-premium-gray-dark">Envío</span>
                  <span>{selectedOrder.shipping > 0 ? formatCurrency(selectedOrder.shipping) : 'Gratis'}</span>
                </div>
                {selectedOrder.couponCode && (
                  <div className="flex justify-between text-xs">
                    <span className="text-premium-gray-dark">Cupón</span>
                    <span className="font-mono">{selectedOrder.couponCode}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Tracking */}
            {selectedOrder.trackingNumber && (
              <div>
                <h3 className="text-xs uppercase tracking-wider font-medium text-premium-gray-dark mb-3">Número de Seguimiento</h3>
                <div className="bg-gray-50 p-4 text-sm">
                  <p className="font-mono font-medium">{selectedOrder.trackingNumber}</p>
                </div>
              </div>
            )}

            {/* Historial de estados */}
            <div>
              <h3 className="text-xs uppercase tracking-wider font-medium text-premium-gray-dark mb-3">Historial de Estados</h3>
              <div className="space-y-2">
                {selectedOrder.statusHistory?.length > 0 ? (
                  selectedOrder.statusHistory.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm bg-gray-50 p-3">
                      <span className={`w-2 h-2 rounded-full ${STATUS_BADGES[entry.status] ? 'bg-current' : 'bg-gray-300'}`} />
                      <span className={`font-medium ${STATUS_BADGES[entry.status]?.split(' ')[1] || 'text-gray-700'}`}>
                        {STATUS_LABELS[entry.status] || entry.status}
                      </span>
                      <span className="text-premium-gray-dark text-xs ml-auto">
                        {formatDate(entry.changedAt)}
                      </span>
                      {entry.changedBy && (
                        <span className="text-premium-gray-dark text-xs">
                          por {entry.changedBy}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-premium-gray-dark">Sin historial disponible</p>
                )}
              </div>
            </div>

            {/* Fecha del pedido */}
            <div className="text-xs text-premium-gray-dark text-right">
              Pedido realizado el {formatDate(selectedOrder.createdAt)}
            </div>
          </>
        )}
      </AdminModal>
    </div>
  );
}
