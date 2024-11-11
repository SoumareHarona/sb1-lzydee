import toast from 'react-hot-toast';
import type { FreightNumber, Shipment, DashboardData, Client } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }
  return response.json();
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    return handleResponse<T>(response);
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Client operations
export async function getClients(): Promise<Client[]> {
  try {
    return await apiRequest<Client[]>('/clients');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load clients';
    toast.error(message);
    throw new Error(message);
  }
}

export async function updateClient(id: string, data: Partial<Client>): Promise<Client> {
  try {
    return await apiRequest<Client>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update client';
    toast.error(message);
    throw new Error(message);
  }
}

export async function deleteClient(id: string): Promise<void> {
  try {
    await apiRequest(`/clients/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete client';
    toast.error(message);
    throw new Error(message);
  }
}

// Freight operations
export async function getFreightNumbers(): Promise<FreightNumber[]> {
  try {
    return await apiRequest<FreightNumber[]>('/freight-numbers');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load freight numbers';
    toast.error(message);
    throw new Error(message);
  }
}

export async function createFreightNumber(data: Partial<FreightNumber>): Promise<FreightNumber> {
  try {
    return await apiRequest<FreightNumber>('/freight-numbers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create freight number';
    toast.error(message);
    throw new Error(message);
  }
}

export async function updateFreightNumber(id: string, data: Partial<FreightNumber>): Promise<FreightNumber> {
  try {
    return await apiRequest<FreightNumber>(`/freight-numbers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update freight number';
    toast.error(message);
    throw new Error(message);
  }
}

export async function deleteFreightNumber(id: string): Promise<void> {
  try {
    await apiRequest(`/freight-numbers/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete freight number';
    toast.error(message);
    throw new Error(message);
  }
}

export async function updateFreightStatus(id: string, status: string): Promise<void> {
  try {
    await apiRequest(`/freight-numbers/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update status';
    toast.error(message);
    throw new Error(message);
  }
}

// Shipment operations
export async function getShipments(): Promise<Shipment[]> {
  try {
    return await apiRequest<Shipment[]>('/shipments');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load shipments';
    toast.error(message);
    throw new Error(message);
  }
}

export async function createClient(data: any): Promise<any> {
  try {
    return await apiRequest('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create client';
    toast.error(message);
    throw new Error(message);
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  try {
    return await apiRequest<DashboardData>('/dashboard');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load dashboard data';
    toast.error(message);
    throw new Error(message);
  }
}