import { useEffect, useState } from 'react';
import { Ship, Plane, Package2, TrendingUp, Users, RefreshCw, Calendar, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getDashboardData } from '../lib/api';
import type { DashboardData, Shipment } from '../types';
import { toast } from 'react-hot-toast';

interface DashboardStat {
  label: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  color: string;
}

export function Dashboard() {
  const { t } = useLanguage();
  const [data, setData] = useState<DashboardData>({
    activeShipments: 0,
    airFreight: 0,
    seaFreight: 0,
    totalClients: 0,
    recentShipments: []
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dashboardData = await getDashboardData();
      
      setData({
        activeShipments: dashboardData.activeShipments,
        airFreight: dashboardData.airFreight,
        seaFreight: dashboardData.seaFreight,
        totalClients: dashboardData.totalClients,
        recentShipments: dashboardData.recentShipments
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      console.error('Error loading dashboard data:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    <div className="ml-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <RefreshCw className="h-12 w-12 text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load dashboard data</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <button
                onClick={fetchData}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('dashboard.refresh')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats: DashboardStat[] = [
    { 
      label: t('dashboard.activeShipments'), 
      value: data.activeShipments.toString(), 
      icon: Package2, 
      trend: '+12%',
      color: 'text-blue-600'
    },
    { 
      label: t('dashboard.airFreight'), 
      value: data.airFreight.toString(), 
      icon: Plane, 
      trend: '+8%',
      color: 'text-indigo-600'
    },
    { 
      label: t('dashboard.seaFreight'), 
      value: data.seaFreight.toString(), 
      icon: Ship, 
      trend: '+15%',
      color: 'text-green-600'
    },
    { 
      label: t('dashboard.totalClients'), 
      value: data.totalClients.toString(), 
      icon: Users, 
      trend: '+5%',
      color: 'text-purple-600'
    },
  ];

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">{t('dashboard.title')}</h1>
        
        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="bg-white overflow-hidden shadow-lg rounded-lg transition-all duration-200 hover:shadow-xl">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {item.label}
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {item.value}
                          </div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <TrendingUp className="self-center flex-shrink-0 h-4 w-4 text-green-500" aria-hidden="true" />
                            <span className="ml-1">{item.trend}</span>
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Shipments */}
        <div className="mt-8">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Package2 className="h-5 w-5 text-indigo-500 mr-2" />
                  {t('dashboard.recentShipments')}
                </h3>
                <button
                  onClick={fetchData}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  {t('dashboard.refresh')}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {data.recentShipments.length === 0 ? (
                <div className="text-center py-8">
                  <Package2 className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">{t('dashboard.noShipments')}</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('dashboard.trackingNumber')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('dashboard.route')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('dashboard.status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('dashboard.date')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.recentShipments.map((shipment) => (
                      <tr key={shipment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {shipment.mode === 'air' ? (
                              <Plane className="h-5 w-5 text-blue-500 mr-2" />
                            ) : (
                              <Ship className="h-5 w-5 text-blue-500 mr-2" />
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {shipment.trackingNumber}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                            {shipment.origin} → {shipment.destination}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            shipment.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : shipment.status === 'in_transit'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {t(`status.${shipment.status}`)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                            {new Date(shipment.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}