import { useEffect, useState } from 'react';
import { Package2, Search, User, Box, MapPin, Calendar, CreditCard, ChevronDown, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { Shipment, FreightNumber } from '../types';
import { getShipments, getFreightNumbers } from '../lib/api';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

interface ShipmentGroup {
  freightNumber: FreightNumber;
  shipments: Shipment[];
}

function PaymentStatus({ payment }: { payment?: Shipment['payment'] }) {
  if (!payment) return null;

  const isCompleted = payment.advanceAmount >= payment.baseAmount;
  const isPartial = !isCompleted && payment.advanceAmount > 0;

  return (
    <div className={clsx(
      'flex items-center text-sm',
      isCompleted ? 'text-green-600' : isPartial ? 'text-blue-600' : 'text-gray-600'
    )}>
      {isCompleted ? (
        <>
          <CheckCircle className="h-4 w-4 mr-1" />
          <span>Paid</span>
        </>
      ) : isPartial ? (
        <>
          <CreditCard className="h-4 w-4 mr-1" />
          <span>Partial Payment</span>
        </>
      ) : (
        <>
          <Clock className="h-4 w-4 mr-1" />
          <span>Pending</span>
        </>
      )}
    </div>
  );
}

function PaymentDetails({ payment }: { payment?: Shipment['payment'] }) {
  if (!payment) return null;

  const formatAmount = (amount: number) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="mt-2 flex items-center justify-end">
      <div className="flex items-center text-sm">
        <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
        <div className="flex flex-col items-end">
          <span className="font-medium text-gray-900">
            {payment.remainingAmount > 0 ? 'Remaining:' : 'Total:'}
          </span>
          <div className="text-gray-500">
            <span className="font-medium">
              €{formatAmount(payment.remainingAmount)}
            </span>
            <span className="mx-1">/</span>
            <span className="font-medium">
              {formatAmount(payment.remainingAmountXOF)} XOF
            </span>
          </div>
          {payment.advanceAmount > 0 && (
            <span className="text-xs text-green-600">
              Payment: €{formatAmount(payment.advanceAmount)} / 
              {formatAmount(payment.advanceAmountXOF)} XOF
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ShipmentList() {
  const { t } = useLanguage();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [freightNumbers, setFreightNumbers] = useState<FreightNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedFreightId, setSelectedFreightId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [shipmentsData, freightData] = await Promise.all([
          getShipments(),
          getFreightNumbers()
        ]);
        setShipments(Array.isArray(shipmentsData) ? shipmentsData : []);
        setFreightNumbers(Array.isArray(freightData) ? freightData : []);
        setError(null);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load shipments');
        toast.error('Failed to load shipments');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const toggleGroup = (freightId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(freightId)) {
        next.delete(freightId);
      } else {
        next.add(freightId);
      }
      return next;
    });
  };

  const groupedShipments = shipments.reduce<ShipmentGroup[]>((groups, shipment) => {
    const freightNumber = freightNumbers.find(f => f.number === shipment.freightNumber);
    if (!freightNumber) return groups;

    const existingGroup = groups.find(g => g.freightNumber.number === shipment.freightNumber);
    if (existingGroup) {
      existingGroup.shipments.push(shipment);
    } else {
      groups.push({
        freightNumber,
        shipments: [shipment]
      });
    }
    return groups;
  }, []);

  const filteredGroups = groupedShipments
    .filter(group => {
      if (selectedFreightId && group.freightNumber.id !== selectedFreightId) {
        return false;
      }

      return group.shipments.some(shipment => {
        const matchesSearch = !searchTerm || 
          shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          shipment.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          shipment.recipient.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      });
    })
    .sort((a, b) => new Date(b.freightNumber.createdAt).getTime() - new Date(a.freightNumber.createdAt).getTime());

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white shadow rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Package2 className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Shipments</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Package2 className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">{t('nav.shipments')}</h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md py-2 pl-3 pr-10 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Freight Numbers Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedFreightId(null)}
              className={clsx(
                'px-4 py-2 rounded-full text-sm font-medium',
                !selectedFreightId 
                  ? 'bg-indigo-100 text-indigo-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              All
            </button>
            {freightNumbers.map(freight => (
              <button
                key={freight.id}
                onClick={() => setSelectedFreightId(freight.id)}
                className={clsx(
                  'px-4 py-2 rounded-full text-sm font-medium',
                  selectedFreightId === freight.id
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {freight.number}
              </button>
            ))}
          </div>
        </div>

        {filteredGroups.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center text-gray-500">
            No shipments found
          </div>
        ) : (
          <div className="space-y-6">
            {filteredGroups.map(group => (
              <div key={group.freightNumber.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                {/* Freight Number Header */}
                <div 
                  className="px-4 py-5 sm:px-6 bg-gray-50 cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleGroup(group.freightNumber.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {expandedGroups.has(group.freightNumber.id) ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Freight N° {group.freightNumber.number}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {group.freightNumber.origin} → {group.freightNumber.destination} 
                          ({group.shipments.length} shipment{group.shipments.length > 1 ? 's' : ''})
                        </p>
                      </div>
                    </div>
                    <span className={clsx(
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                      {
                        'bg-green-100 text-green-800': group.freightNumber.status === 'delivered',
                        'bg-blue-100 text-blue-800': group.freightNumber.status === 'in_transit',
                        'bg-yellow-100 text-yellow-800': group.freightNumber.status === 'pending',
                        'bg-red-100 text-red-800': group.freightNumber.status === 'cancelled'
                      }
                    )}>
                      {t(`status.${group.freightNumber.status}`)}
                    </span>
                  </div>
                </div>

                {/* Shipments List */}
                {expandedGroups.has(group.freightNumber.id) && (
                  <ul role="list" className="divide-y divide-gray-200">
                    {group.shipments.map((shipment) => (
                      <li key={shipment.id} className="hover:bg-gray-50">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Package2 className="h-5 w-5 text-gray-400" />
                              <p className="ml-2 text-sm font-medium text-indigo-600">
                                {shipment.trackingNumber}
                              </p>
                            </div>
                            <div className="ml-2 flex-shrink-0 flex items-center space-x-4">
                              <PaymentStatus payment={shipment.payment} />
                              <p className={clsx(
                                'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                                {
                                  'bg-green-100 text-green-800': shipment.status === 'delivered',
                                  'bg-blue-100 text-blue-800': shipment.status === 'in_transit',
                                  'bg-yellow-100 text-yellow-800': shipment.status === 'pending',
                                  'bg-red-100 text-red-800': shipment.status === 'cancelled'
                                }
                              )}>
                                {t(`status.${shipment.status}`)}
                              </p>
                            </div>
                          </div>

                          <PaymentDetails payment={shipment.payment} />

                          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="flex items-start">
                              <User className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div className="ml-2">
                                <p className="text-sm font-medium text-gray-900">Sender</p>
                                <p className="text-sm text-gray-500">{shipment.sender.name}</p>
                                <p className="text-sm text-gray-500">{shipment.sender.phone}</p>
                              </div>
                            </div>

                            <div className="flex items-start">
                              <User className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div className="ml-2">
                                <p className="text-sm font-medium text-gray-900">Recipient</p>
                                <p className="text-sm text-gray-500">{shipment.recipient.name}</p>
                                <p className="text-sm text-gray-500">{shipment.recipient.phone}</p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center space-x-6">
                            {shipment.packaging && (
                              <div className="flex items-center text-sm text-gray-500">
                                <Box className="h-4 w-4 mr-1" />
                                <span>Package: {shipment.packaging}</span>
                              </div>
                            )}
                            {shipment.weights && (
                              <div className="text-sm text-gray-500">
                                <span>
                                  Total Weight: {shipment.weights.total} kg
                                  {shipment.weights.food > 0 && ` (Food: ${shipment.weights.food} kg)`}
                                  {shipment.weights.nonFood > 0 && ` (Non-food: ${shipment.weights.nonFood} kg)`}
                                  {shipment.weights.hn7 > 0 && ` (HN7: ${shipment.weights.hn7} kg)`}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 flex items-center justify-between text-sm">
                            <div className="flex items-center text-gray-500">
                              <MapPin className="h-4 w-4 mr-1" />
                              {shipment.origin} → {shipment.destination}
                            </div>
                            <div className="flex items-center text-gray-500">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(shipment.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}