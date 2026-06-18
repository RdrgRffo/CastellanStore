import { useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', end: true },
  { path: '/admin/products', label: 'Productos', end: false },
  { path: '/admin/orders', label: 'Pedidos', end: false },
  { path: '/admin/coupons', label: 'Cupones', end: false },
  { path: '/admin/users', label: 'Usuarios', end: false },
  { path: '/admin/activity', label: 'Actividad', end: false },
];

export default function AdminLayout() {
  const { user, isManager, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!user || !isManager)) {
      navigate('/auth');
    }
  }, [user, isManager, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cuero-500" />
      </div>
    );
  }

  if (!user || !isManager) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <h2 className="text-sm uppercase tracking-wider font-medium text-premium-black">
              Panel Admin
            </h2>
            <p className="text-xs text-premium-gray-dark mt-1">{user?.email}</p>
          </div>
          <nav className="px-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.end
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-4 py-2.5 text-xs uppercase tracking-wider rounded transition-colors ${
                    isActive
                      ? 'bg-cuero-50 text-cuero-700 font-medium'
                      : 'text-premium-gray-dark hover:bg-gray-50 hover:text-premium-black'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
