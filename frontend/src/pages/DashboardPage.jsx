import { useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import StatCard from '../components/ui/StatCard';
import { formatCurrency, formatDate } from '../utils/helpers';
import { dashboardService } from '../services/api';
import { Package, ShoppingCart, Users, AlertTriangle, Clock } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total_sales: 0,
    total_products: 0,
    total_clients: 0,
    low_stock_count: 0,
  });
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        /*
         * CORRECCIÓN 1: se usaba api.get('/dashboard/stats') directamente,
         * pero el endpoint real definido en api.js es '/dashboard/resumen'
         * y '/dashboard/ventas-por-periodo'. Ahora se usan los servicios
         * exportados para mantener consistencia.
         *
         * CORRECCIÓN 2: el backend devuelve la estructura dentro de
         * response.data.data (wrapper ApiResponse de Laravel), por lo que
         * se lee res.data?.data ?? res.data para soportar ambos formatos.
         */
        const statsRes = await dashboardService.getStats();
        const statsPayload = statsRes.data?.data ?? statsRes.data;

        setStats({
          total_sales:     statsPayload?.total_sales     ?? 0,
          total_products:  statsPayload?.total_products  ?? 0,
          total_clients:   statsPayload?.total_clients   ?? 0,
          low_stock_count: statsPayload?.low_stock_count ?? 0,
        });

        const salesArray = Array.isArray(statsPayload?.recent_sales)
          ? statsPayload.recent_sales
          : [];

        setRecentSales(salesArray);
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <MainLayout title="Panel de Control">
      {/* Grid de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Ventas Totales"
          value={formatCurrency(stats.total_sales)}
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Productos"
          value={stats.total_products}
          icon={Package}
          color="green"
        />
        <StatCard
          title="Clientes"
          value={stats.total_clients}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Stock Bajo"
          value={stats.low_stock_count}
          icon={AlertTriangle}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tabla de Ventas Recientes */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Clock size={20} className="text-blue-600" />
              Ventas Recientes
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b">
                  <th className="pb-3 px-2">Cliente</th>
                  <th className="pb-3 px-2">Fecha</th>
                  <th className="pb-3 px-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-gray-400">
                      Cargando...
                    </td>
                  </tr>
                ) : recentSales.length > 0 ? (
                  recentSales.map((sale) => (
                    <tr key={sale.id} className="text-sm">
                      <td className="py-4 px-2">
                        {sale.client?.name || 'Venta General'}
                      </td>
                      <td className="py-4 px-2 text-gray-500">
                        {sale.created_at ? formatDate(sale.created_at) : '—'}
                      </td>
                      <td className="py-4 px-2 font-medium">
                        {formatCurrency(sale.total)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-gray-400">
                      No hay ventas recientes para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel de Avisos */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Avisos del Sistema</h3>
          <div className="space-y-4">
            {stats.low_stock_count > 0 ? (
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex items-start gap-3">
                <AlertTriangle className="text-orange-500 shrink-0" size={20} />
                <div>
                  <p className="text-sm font-semibold text-orange-800">Stock Crítico</p>
                  <p className="text-xs text-orange-600">
                    Tienes {stats.low_stock_count} producto{stats.low_stock_count !== 1 ? 's' : ''} por debajo del mínimo.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Todo está bajo control.</p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
