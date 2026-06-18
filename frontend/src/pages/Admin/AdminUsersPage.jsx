import { useState, useEffect, useCallback } from 'react';
import { fetchAdminUsers, updateUserRole, toggleUserBlock } from '../../services/api';
import AdminTable from '../../components/ui/AdminTable';
import AdminModal from '../../components/ui/AdminModal';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);

  // Estado del modal de detalle
  const [selectedUser, setSelectedUser] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchAdminUsers(search, page, 20);
      setUsers(result.users || []);
      setTotalPages(result.totalPages || 0);
      setTotalItems(result.totalItems || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    loadUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(userId);
    setError('');
    setSuccessMsg('');
    try {
      await updateUserRole(userId, newRole);
      setSuccessMsg('Rol actualizado correctamente');
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleBlock = async (userId) => {
    setActionLoading(userId);
    setError('');
    setSuccessMsg('');
    try {
      const result = await toggleUserBlock(userId);
      setSuccessMsg(result.message || 'Estado actualizado correctamente');
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    { key: 'name', label: 'Usuario', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'provider', label: 'Proveedor', sortable: true, align: 'center' },
    { key: 'role', label: 'Rol', sortable: true, align: 'center' },
    { key: 'blocked', label: 'Estado', sortable: true, align: 'center' },
    { key: 'createdAt', label: 'Registro', sortable: true },
    { key: 'actions', label: 'Acciones', align: 'center' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-display uppercase tracking-wider">Usuarios</h1>
        </div>
      </div>

      {/* Búsqueda */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-premium flex-1"
        />
        <button type="submit" className="btn-primary text-xs">Buscar</button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(''); setPage(0); }}
            className="btn-secondary text-xs"
          >
            Limpiar
          </button>
        )}
      </form>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 mb-4">{error}</div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-600 text-sm p-3 mb-4">{successMsg}</div>
      )}

      {/* Tabla */}
      <AdminTable
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="No se encontraron usuarios"
        totalItems={totalItems}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRowClick={(user) => setSelectedUser(user)}
      >
        {(sortedData) => sortedData.map((user) => (
          <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
            <td className="px-5 py-4">
              <div className="flex items-center gap-3">
                {user.picture ? (
                  <img src={user.picture} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-cuero-100 flex items-center justify-center text-cuero-700 text-xs font-medium">
                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="font-medium text-premium-black">{user.name || 'Sin nombre'}</span>
              </div>
            </td>
            <td className="px-5 py-4 text-premium-gray-dark">{user.email}</td>
            <td className="px-5 py-4 text-center">
              <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                user.provider === 'GOOGLE' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'
              }`}>
                {user.provider}
              </span>
            </td>
            <td className="px-5 py-4 text-center">
              <select
                value={user.role}
                onChange={(e) => {
                  e.stopPropagation();
                  handleRoleChange(user._id, e.target.value);
                }}
                disabled={actionLoading === user._id}
                className="text-xs border border-gray-200 rounded px-2 py-1 bg-white disabled:opacity-50"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="ROLE_USER">Usuario</option>
                <option value="ROLE_MANAGER">Manager</option>
              </select>
            </td>
            <td className="px-5 py-4 text-center">
              <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                user.blocked ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
              }`}>
                {user.blocked ? 'Bloqueado' : 'Activo'}
              </span>
            </td>
            <td className="px-5 py-4 text-premium-gray-dark text-xs">{formatDate(user.createdAt)}</td>
            <td className="px-5 py-4 text-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleBlock(user._id);
                }}
                disabled={actionLoading === user._id}
                className={`px-3 py-1.5 text-xs font-medium rounded uppercase tracking-wider transition-colors disabled:opacity-50 ${
                  user.blocked
                    ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                    : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                }`}
              >
                {actionLoading === user._id ? '...' : user.blocked ? 'Desbloquear' : 'Bloquear'}
              </button>
            </td>
          </tr>
        ))}
      </AdminTable>

      {/* Modal de detalle de usuario */}
      <AdminModal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.name || 'Detalle de Usuario'}
        badge={{
          label: selectedUser?.role === 'ROLE_MANAGER' ? 'Manager' : 'Usuario',
          className: selectedUser?.role === 'ROLE_MANAGER' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700',
        }}
      >
        {selectedUser && (
          <>
            {/* Información básica */}
            <div>
              <h3 className="text-xs uppercase tracking-wider font-medium text-premium-gray-dark mb-3">Información del Usuario</h3>
              <div className="bg-gray-50 p-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-premium-gray-dark text-xs">Nombre</span>
                  <p className="font-medium">{selectedUser.name || 'Sin nombre'}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Email</span>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Proveedor</span>
                  <p className="font-medium">{selectedUser.provider || 'LOCAL'}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Rol</span>
                  <p className="font-medium">{selectedUser.role === 'ROLE_MANAGER' ? 'Manager' : 'Usuario'}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Estado</span>
                  <p className={`font-medium ${selectedUser.blocked ? 'text-red-600' : 'text-green-600'}`}>
                    {selectedUser.blocked ? 'Bloqueado' : 'Activo'}
                  </p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">ID</span>
                  <p className="font-medium text-xs font-mono">{selectedUser._id}</p>
                </div>
              </div>
            </div>

            {/* Fechas */}
            <div>
              <h3 className="text-xs uppercase tracking-wider font-medium text-premium-gray-dark mb-3">Fechas</h3>
              <div className="bg-gray-50 p-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-premium-gray-dark text-xs">Registro</span>
                  <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Última actualización</span>
                  <p className="font-medium">{formatDate(selectedUser.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Avatar */}
            {selectedUser.picture && (
              <div>
                <h3 className="text-xs uppercase tracking-wider font-medium text-premium-gray-dark mb-3">Avatar</h3>
                <div className="bg-gray-50 p-4">
                  <img src={selectedUser.picture} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                </div>
              </div>
            )}
          </>
        )}
      </AdminModal>
    </div>
  );
}
