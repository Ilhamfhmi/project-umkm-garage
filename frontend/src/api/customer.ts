import client from './client';

export interface Customer {
  id: string;
  nama: string;
  no_hp: string | null;
  alamat: string | null;
  tipe: 'umum' | 'mitra';
}

export interface CustomerPayload {
  nama: string;
  no_hp?: string | null;
  alamat?: string | null;
  tipe: 'umum' | 'mitra';
}

export async function getCustomers(search?: string): Promise<Customer[]> {
  const { data } = await client.get<Customer[]>('/customers', {
    params: search ? { search } : {},
  });
  return data;
}

export async function createCustomer(payload: CustomerPayload) {
  const { data } = await client.post('/customers', payload);
  return data;
}

export async function updateCustomer(id: string, payload: CustomerPayload) {
  const { data } = await client.put(`/customers/${id}`, payload);
  return data;
}

export async function deleteCustomer(id: string) {
  await client.delete(`/customers/${id}`);
}