import client from './client';
import type { LoginResponse, User } from '../types';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await client.post<LoginResponse>('/login', { email, password });
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await client.get<User>('/me');
  return data;
}

export async function logout(): Promise<void> {
  await client.post('/logout');
}