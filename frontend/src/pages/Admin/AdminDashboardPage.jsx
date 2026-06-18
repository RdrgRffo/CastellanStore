import { useState, useEffect } from 'react';
import { fetchDashboard } from '../../services/api';
import DashboardStatsGrid from '../../components/dashboard/DashboardStatsGrid';
import DashboardCriticalStock from '../../components/dashboard/DashboardCriticalStock';
import DashboardTopProducts from '../../components/dashboard/DashboardTopProducts';
import DashboardOrdersByStatus from '../../components/dashboard/DashboardOrdersByStatus';
import DashboardWeeklySales from '../../components/dashboard/DashboardWeeklySales';
import DashboardRecentOrders from '../../components/dashboard/DashboardRecentOrders';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const result = await fetchDashboard();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cuero-500" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3">{error}</div>;
  }

  if (!data) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-display uppercase tracking-wider">Dashboard</h1>
          <p className="text-sm text-premium-gray-dark mt-1 font-semibold">Resumen general de la tienda</p>
        </div>
      </div>

      {/* Tarjetas */}
      <DashboardStatsGrid data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <DashboardCriticalStock data={data} />
        <DashboardTopProducts data={data} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardOrdersByStatus data={data} />
        <DashboardWeeklySales data={data} />
        <DashboardRecentOrders data={data} />
      </div>
    </div>
  );
}
