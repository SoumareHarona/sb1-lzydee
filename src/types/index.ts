export type Language = 'en' | 'fr';
export type FreightMode = 'air' | 'sea' | 'gp';
export type Country = 'Senegal' | 'Mali' | 'Gambia' | 'France';
export type Currency = 'EUR' | 'XOF';
export type ShipmentStatus = 'pending' | 'in_transit' | 'delivered' | 'cancelled';

export interface FreightNumber {
  id: string;
  number: string;
  mode: FreightMode;
  origin: Country;
  destination: Country;
  status: ShipmentStatus;
  createdAt: string;
}

export interface PackageDetails {
  description: string;
  quantity: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

export interface Payment {
  baseAmount: number;
  baseAmountXOF: number;
  advanceAmount: number;
  advanceAmountXOF: number;
  remainingAmount: number;
  remainingAmountXOF: number;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  freightNumber: string;
  mode: FreightMode;
  origin: Country;
  destination: Country;
  status: ShipmentStatus;
  sender: {
    name: string;
    phone: string;
  };
  recipient: {
    name: string;
    phone: string;
  };
  weights?: {
    food?: number;
    nonFood?: number;
    hn7?: number;
    total?: number;
  };
  packaging?: string;
  payment?: Payment;
  qrCode?: string;
  createdAt: string;
}

export interface DashboardData {
  activeShipments: number;
  airFreight: number;
  seaFreight: number;
  totalClients: number;
  recentShipments: Shipment[];
}