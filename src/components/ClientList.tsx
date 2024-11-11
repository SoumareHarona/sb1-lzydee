import { useState, useEffect } from 'react';
import { Users, Search, Phone, Package2, CreditCard, Calendar, MapPin, ChevronDown, ChevronRight, Truck, Plane, Ship, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { Shipment } from '../types';
import { getShipments } from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';
import { calculatePrice } from '../lib/pricing';
import { PaymentStatus } from './PaymentStatus';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

interface Client {
  id: string;
  name: string;
  phone: string;
  role: 'sender' | 'recipient';
  shipments: Shipment[];
  totalDueEUR: number;
  totalDueXOF: number;
  totalPaidShipments: number;
}

const TransportIcon = ({ mode }: { mode: string }) => {
  switch (mode) {
    case 'air':
      return <Plane className="h-5 w-5 text-blue-500" />;
    case 'sea':
      return <Ship className="h-5 w-5 text-blue-500" />;
    case 'gp':
      return <Truck className="h-5 w-5 text-blue-500" />;
    default:
      return <Package2 className="h-5 w-5 text-blue-500" />;
  }
};

export function ClientList() {
  const { t } = useLanguage();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedShipments, setExpandedShipments] = useState<Set<string>>(new Set());
  const [expandedSenders, setExpandedSenders] = useState<Set<string>>(new Set());
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        const shipments = await getShipments();
        
        const clientMap = new Map<string, Client>();

        shipments.forEach(shipment => {
          // Add recipient
          const recipientKey = `${shipment.recipient.phone}-recipient`;
          if (!clientMap.has(recipientKey)) {
            clientMap.set(recipientKey, {
              id: recipientKey,
              name: shipment.recipient.name,
              phone: shipment.recipient.phone,
              role: 'recipient',
              shipments: [],
              totalDueEUR: 0,
              totalDueXOF: 0,
              totalPaidShipments: 0
            });
          }
          
          const client = clientMap.get(recipientKey)!;
          client.shipments.push(shipment);

          // Calculate payment status for this shipment
          const price = calculatePrice(
            shipment.mode,
            {
              food: shipment.weights?.food || 0,
              nonFood: shipment.weights?.nonFood || 0,
              hn7: shipment.weights?.hn7 || 0
            },
            shipment.mode === 'sea' ? {
              length: shipment.volume?.length || 0,
              width: shipment.volume?.width || 0,
              height: shipment.volume?.height || 0
            } : undefined,
            {
              amount: shipment.payment?.advanceAmount?.toString() || '0',
              currency: 'EUR'
            }
          );

          if (price.paymentStatus === 'completed') {
            client.totalPaidShipments++;
          } else {
            client.totalDueEUR += price.remainingEUR;
            client.totalDueXOF += price.remainingXOF;
          }
        });

        setClients(Array.from(clientMap.values()));
      } catch (error) {
        console.error('Error loading clients:', error);
        toast.error('Failed to load clients');
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  const filteredClients = clients.filter(client => {
    const searchLower = debouncedSearch.toLowerCase();
    
    if (
      client.name.toLowerCase().includes(searchLower) ||
      client.phone.includes(searchLower)
    ) {
      return true;
    }

    return client.shipments.some(shipment => 
      shipment.trackingNumber.toLowerCase().includes(searchLower)
    );
  });

  const toggleShipmentDetails = (shipmentId: string) => {
    setExpandedShipments(prev => {
      const next = new Set(prev);
      if (next.has(shipmentId)) {
        next.delete(shipmentId);
      } else {
        next.add(shipmentId);
      }
      return next;
    });
  };

  const toggleSenderDetails = (shipmentId: string) => {
    setExpandedSenders(prev => {
      const next = new Set(prev);
      if (next.has(shipmentId)) {
        next.delete(shipmentId);
      } else {
        next.add(shipmentId);
      }
      return next;
    });
  };

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

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 mb-6">
          <Users className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900">{t('nav.clients')}</h2>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, phone number, or tracking number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        {filteredClients.length > 0 ? (
          <div className="space-y-4">
            {filteredClients.map((client) => (
              <div key={client.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {client.name}
                        </h3>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <Phone className="h-4 w-4 mr-1" />
                          {client.phone}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">
                        {client.shipments.length} shipment{client.shipments.length > 1 ? 's' : ''}
                        {client.totalPaidShipments > 0 && (
                          <span className="ml-2 text-green-600">
                            ({client.totalPaidShipments} paid)
                          </span>
                        )}
                      </div>
                      {client.totalDueEUR > 0 ? (
                        <div className="text-sm font-medium">
                          <span className="text-red-600">
                            Remaining: {client.totalDueEUR.toFixed(2)} EUR
                          </span>
                          <span className="text-gray-500 mx-1">/</span>
                          <span className="text-red-600">
                            {Math.round(client.totalDueXOF).toLocaleString()} XOF
                          </span>
                        </div>
                      ) : client.shipments.length > 0 && (
                        <div className="text-sm font-medium text-green-600">
                          All shipments paid
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {client.shipments.map((shipment) => {
                    const price = calculatePrice(
                      shipment.mode,
                      {
                        food: shipment.weights?.food || 0,
                        nonFood: shipment.weights?.nonFood || 0,
                        hn7: shipment.weights?.hn7 || 0
                      },
                      shipment.mode === 'sea' ? {
                        length: shipment.volume?.length || 0,
                        width: shipment.volume?.width || 0,
                        height: shipment.volume?.height || 0
                      } : undefined,
                      {
                        amount: shipment.payment?.advanceAmount?.toString() || '0',
                        currency: 'EUR'
                      }
                    );
                    
                    const isExpanded = expandedShipments.has(shipment.id);
                    const isSenderExpanded = expandedSenders.has(shipment.id);
                    
                    return (
                      <div key={shipment.id} className="p-4 hover:bg-gray-50">
                        <div className="space-y-4">
                          <div 
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleShipmentDetails(shipment.id)}
                          >
                            <div className="flex items-center space-x-3">
                              <TransportIcon mode={shipment.mode} />
                              <div>
                                <span className="text-sm font-medium text-indigo-600">
                                  {shipment.trackingNumber}
                                </span>
                                <div className="text-sm text-gray-500">
                                  <MapPin className="h-4 w-4 inline mr-1" />
                                  {shipment.origin} → {shipment.destination}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <PaymentStatus
                                status={price.paymentStatus}
                                baseAmount={price.baseAmountEUR}
                                advanceAmount={price.advanceAmountEUR}
                                remainingAmount={price.remainingEUR}
                                showRemainingOnly
                              />
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSenderDetails(shipment.id);
                                      }}
                                      className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                                    >
                                      {isSenderExpanded ? (
                                        <ChevronDown className="h-4 w-4 mr-1" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 mr-1" />
                                      )}
                                      Show sender
                                    </button>
                                    {isSenderExpanded && (
                                      <div className="mt-2 pl-5 text-sm">
                                        <div className="font-medium">{shipment.sender.name}</div>
                                        <div className="text-gray-500">{shipment.sender.phone}</div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="text-sm">
                                    <div className="text-gray-500">Package</div>
                                    <div className="font-medium">
                                      {shipment.packaging}
                                      {shipment.weights && (
                                        <span className="ml-2 text-gray-500">
                                          ({shipment.weights.total} kg)
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-sm">
                                    <Calendar className="h-4 w-4 inline mr-1 text-gray-400" />
                                    {new Date(shipment.createdAt).toLocaleDateString()}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <PaymentStatus
                                    status={price.paymentStatus}
                                    baseAmount={price.baseAmountEUR}
                                    advanceAmount={price.advanceAmountEUR}
                                    remainingAmount={price.remainingEUR}
                                    currency="EUR"
                                  />
                                  <PaymentStatus
                                    status={price.paymentStatus}
                                    baseAmount={price.baseAmountXOF}
                                    advanceAmount={price.advanceAmountXOF}
                                    remainingAmount={price.remainingXOF}
                                    currency="XOF"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try searching with a different name, phone number, or tracking number.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}