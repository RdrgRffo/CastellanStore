import { useState, useEffect, useCallback } from 'react';
import { fetchActivityLogs, rollbackActivityLog } from '../../services/api';
import AdminTable from '../../components/ui/AdminTable';
import AdminModal from '../../components/ui/AdminModal';

const ACTION_LABELS = {
  // Acciones reales de los controladores (producción)
  PRODUCT_CREATE: 'Creación de producto',
  PRODUCT_UPDATE: 'Actualización de producto',
  PRODUCT_DELETE: 'Eliminación de producto',
  COUPON_CREATE: 'Creación de cupón',
  COUPON_UPDATE: 'Actualización de cupón',
  COUPON_DELETE: 'Eliminación de cupón',
  STOCK_UPDATE: 'Actualización de stock',
  ORDER_STATUS: 'Cambio de estado',
  USER_REGISTER: 'Registro de usuario',
  ROLE_CHANGE: 'Cambio de rol',
  BLOCK: 'Bloqueo de usuario',
  UNBLOCK: 'Desbloqueo de usuario',
  REFUND: 'Reembolso',
  ROLLBACK: 'Rollback',
  // Acciones de los seeders (backend/src/index.ts)
  LOGIN: 'Inicio de sesión',
  CREATE_ORDER: 'Creación de pedido',
  UPDATE_STATUS: 'Cambio de estado',
  CREATE_PRODUCT: 'Creación de producto',
  UPDATE_PRODUCT: 'Actualización de producto',
  UPDATE_STOCK: 'Actualización de stock',
  CREATE_COUPON: 'Creación de cupón',
  UPDATE_COUPON: 'Actualización de cupón',
  DELETE_COUPON: 'Eliminación de cupón',
  UPDATE_USER_ROLE: 'Cambio de rol',
  BLOCK_USER: 'Bloqueo de usuario',
  UNBLOCK_USER: 'Desbloqueo de usuario',
  REGISTER_USER: 'Registro de usuario',
  DELETE_REVIEW: 'Eliminación de reseña',
};

const ACTION_COLORS = {
  // Acciones reales de los controladores (producción)
  PRODUCT_CREATE: 'bg-green-50 text-green-700',
  PRODUCT_UPDATE: 'bg-blue-50 text-blue-700',
  PRODUCT_DELETE: 'bg-red-50 text-red-700',
  COUPON_CREATE: 'bg-green-50 text-green-700',
  COUPON_UPDATE: 'bg-blue-50 text-blue-700',
  COUPON_DELETE: 'bg-red-50 text-red-700',
  STOCK_UPDATE: 'bg-cyan-50 text-cyan-700',
  ORDER_STATUS: 'bg-amber-50 text-amber-700',
  USER_REGISTER: 'bg-gray-50 text-gray-700',
  ROLE_CHANGE: 'bg-purple-50 text-purple-700',
  BLOCK: 'bg-red-50 text-red-700',
  UNBLOCK: 'bg-green-50 text-green-700',
  REFUND: 'bg-orange-50 text-orange-700',
  ROLLBACK: 'bg-gray-50 text-gray-700',
  // Acciones de los seeders
  LOGIN: 'bg-gray-50 text-gray-700',
  CREATE_ORDER: 'bg-green-50 text-green-700',
  UPDATE_STATUS: 'bg-amber-50 text-amber-700',
  CREATE_PRODUCT: 'bg-green-50 text-green-700',
  UPDATE_PRODUCT: 'bg-blue-50 text-blue-700',
  UPDATE_STOCK: 'bg-cyan-50 text-cyan-700',
  CREATE_COUPON: 'bg-green-50 text-green-700',
  UPDATE_COUPON: 'bg-blue-50 text-blue-700',
  DELETE_COUPON: 'bg-red-50 text-red-700',
  UPDATE_USER_ROLE: 'bg-purple-50 text-purple-700',
  BLOCK_USER: 'bg-red-50 text-red-700',
  UNBLOCK_USER: 'bg-green-50 text-green-700',
  REGISTER_USER: 'bg-gray-50 text-gray-700',
  DELETE_REVIEW: 'bg-red-50 text-red-700',
};

const ENTITY_LABELS = {
  // Producción (minúsculas)
  user: 'Usuario',
  product: 'Producto',
  order: 'Pedido',
  coupon: 'Cupón',
  // Seeders (mayúsculas)
  USER: 'Usuario',
  PRODUCT: 'Producto',
  ORDER: 'Pedido',
  COUPON: 'Cupón',
  REVIEW: 'Reseña',
};

const ROLLBACKABLE_ACTIONS = [
  // Acciones de producción
  'PRODUCT_UPDATE', 'PRODUCT_DELETE', 'COUPON_UPDATE', 'COUPON_DELETE',
  'ORDER_STATUS', 'ROLE_CHANGE', 'BLOCK', 'UNBLOCK', 'STOCK_UPDATE',
  // Acciones de seeders (mapeadas a las mismas lógicas de rollback)
  'UPDATE_PRODUCT', 'UPDATE_STOCK', 'DELETE_COUPON', 'UPDATE_COUPON',
  'UPDATE_USER_ROLE', 'BLOCK_USER', 'UNBLOCK_USER',
];

const COLUMNS = [
  { key: 'action', label: 'Acción', sortable: true, minWidth: '120px' },
  { key: 'entity', label: 'Entidad', sortable: true, minWidth: '100px' },
  { key: 'userName', label: 'Usuario', sortable: true, minWidth: '150px' },
  { key: 'details', label: 'Detalles', sortable: false, minWidth: '300px' },
  { key: 'createdAt', label: 'Fecha', sortable: true, minWidth: '160px' },
  { key: 'acciones', label: 'Acciones', sortable: false, align: 'center', minWidth: '120px' },
];

export default function AdminActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [rollbackLoading, setRollbackLoading] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Estado del modal de detalles
  const [selectedLog, setSelectedLog] = useState(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchActivityLogs(page, 20);
      setLogs(result.data || []);
      setTotalPages(result.totalPages || 0);
      setTotalItems(result.totalItems || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLogs();
  }, [loadLogs]);

  const handleRollback = async (logId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que deseas revertir esta acción?')) return;
    setRollbackLoading(logId);
    setError('');
    setSuccessMsg('');
    try {
      await rollbackActivityLog(logId);
      setSuccessMsg('Acción revertida correctamente');
      loadLogs();
    } catch (err) {
      setError(err.message);
    } finally {
      setRollbackLoading(null);
    }
  };

  const openLogDetails = (log) => {
    setSelectedLog(log);
  };

  const closeLogDetails = () => {
    setSelectedLog(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionLabel = (action) => {
    return ACTION_LABELS[action] || action;
  };

  const getActionColor = (action) => {
    return ACTION_COLORS[action] || 'bg-gray-50 text-gray-700';
  };

  const getEntityLabel = (entity) => {
    return ENTITY_LABELS[entity] || entity;
  };

  const canRollback = (log) => {
    return ROLLBACKABLE_ACTIONS.includes(log.action) && log.previousState && Object.keys(log.previousState).length > 0;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-display uppercase tracking-wider">Registro de Actividad</h1>
        </div>
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
        data={logs}
        loading={loading}
        emptyMessage="No hay registros de actividad"
        totalItems={totalItems}
        page={page}
        totalPages={totalPages}
        pageSize={20}
        onPageChange={setPage}
        onRowClick={openLogDetails}
      >
        {(sortedData) => sortedData.map((log) => (
          <tr
            key={log._id}
            className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => openLogDetails(log)}
          >
            <td className="px-5 py-4">
              <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${getActionColor(log.action)}`}>
                {getActionLabel(log.action)}
              </span>
            </td>
            <td className="px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-premium-gray-dark font-medium">
                  {getEntityLabel(log.entity)}
                </span>
                {log.entityId && (
                  <span className="text-xs text-premium-gray-dark font-mono">#{log.entityId.slice(-6)}</span>
                )}
              </div>
            </td>
            <td className="px-5 py-4 font-medium">{log.userName || '-'}</td>
            <td className="px-5 py-4 text-premium-gray-dark text-sm max-w-xs truncate">{log.details || '-'}</td>
            <td className="px-5 py-4 text-premium-gray-dark text-sm">{formatDate(log.createdAt)}</td>
            <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
              {canRollback(log) ? (
                <button
                  onClick={(e) => handleRollback(log._id, e)}
                  disabled={rollbackLoading === log._id}
                  className="px-3 py-1 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 rounded disabled:opacity-50 transition-colors"
                >
                  {rollbackLoading === log._id ? 'Revirtiendo...' : 'Revertir'}
                </button>
              ) : (
                <span className="text-xs text-premium-gray-dark">—</span>
              )}
            </td>
          </tr>
        ))}
      </AdminTable>

      {/* Modal de detalles del log */}
      <AdminModal
        isOpen={!!selectedLog}
        onClose={closeLogDetails}
        title={selectedLog ? `${getActionLabel(selectedLog.action)} - ${getEntityLabel(selectedLog.entity)}` : ''}
        badge={selectedLog ? {
          label: getActionLabel(selectedLog.action),
          className: `inline-block mt-1 px-2 py-0.5 text-xs rounded-full font-medium ${getActionColor(selectedLog.action)}`,
        } : null}
      >
        {selectedLog && (
          <>
            {/* Información general */}
            <div>
              <h3 className="text-xs uppercase tracking-wider font-medium text-premium-gray-dark mb-3">Información General</h3>
              <div className="bg-gray-50 p-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-premium-gray-dark text-xs">Acción</span>
                  <p className="font-medium">{getActionLabel(selectedLog.action)}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Entidad</span>
                  <p className="font-medium">{getEntityLabel(selectedLog.entity)}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">ID de Entidad</span>
                  <p className="font-medium text-xs font-mono">{selectedLog.entityId || '-'}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Usuario</span>
                  <p className="font-medium">{selectedLog.userName || '-'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-premium-gray-dark text-xs">Detalles</span>
                  <p className="font-medium">{selectedLog.details || '-'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-premium-gray-dark text-xs">Fecha</span>
                  <p className="font-medium">{formatDate(selectedLog.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Previous State (si existe) */}
            {selectedLog.previousState && Object.keys(selectedLog.previousState).length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wider font-medium text-premium-gray-dark mb-3">Estado Anterior</h3>
                <div className="bg-gray-50 p-4">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
                    {JSON.stringify(selectedLog.previousState, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Botón de rollback en el modal */}
            {canRollback(selectedLog) && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={(e) => handleRollback(selectedLog._id, e)}
                  disabled={rollbackLoading === selectedLog._id}
                  className="px-4 py-2 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 rounded disabled:opacity-50 transition-colors font-medium"
                >
                  {rollbackLoading === selectedLog._id ? 'Revirtiendo...' : 'Revertir esta acción'}
                </button>
              </div>
            )}
          </>
        )}
      </AdminModal>
    </div>
  );
}
