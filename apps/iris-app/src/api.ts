/// <reference types="vite/client" />
import {
  resolveTenantSlugFromHostname,
  type TenantDto,
  type GoodDto,
  type PlaceDto,
  type ClientDto,
  type OrderDto,
  type OrderStatus,
  type PaginatedResponse,
} from '@iris/shared';

const API_BASE = import.meta.env.VITE_API_URL || '';
const BASE_DOMAIN = import.meta.env.VITE_BASE_DOMAIN || 'homee.ua';

let activeTenantOverride: string | null = null;

export function detectTenantSlug(): string | null {
  if (activeTenantOverride) return activeTenantOverride;
  if (typeof window === 'undefined') return null;

  const fromSubdomain = resolveTenantSlugFromHostname(window.location.hostname, BASE_DOMAIN);
  if (fromSubdomain) return fromSubdomain;

  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('tenant');
  if (fromQuery) return fromQuery.trim().toLowerCase();

  return localStorage.getItem('iris_tenant_slug');
}

export function setTenantSlugOverride(slug: string | null) {
  activeTenantOverride = slug;
  if (typeof window !== 'undefined') {
    if (slug) {
      localStorage.setItem('iris_tenant_slug', slug);
    } else {
      localStorage.removeItem('iris_tenant_slug');
    }
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const tenantSlug = detectTenantSlug();
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (tenantSlug) {
    headers.set('x-tenant-slug', tenantSlug);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Помилка запиту (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export const irisApi = {
  getTenants: () => request<PaginatedResponse<TenantDto>>('/api/tenants'),
  getCurrentTenant: () => request<TenantDto | null>('/api/tenants/current'),

  getGoods: (params: { q?: string; type?: string; excludeEmpty?: boolean; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.type) qs.set('type', params.type);
    if (params.excludeEmpty) qs.set('excludeEmpty', 'true');
    if (params.page) qs.set('page', String(params.page));
    qs.set('limit', String(params.limit || 100));
    return request<PaginatedResponse<GoodDto>>(`/api/goods?${qs.toString()}`);
  },

  addGoodStock: (goodId: string, newCount: number) =>
    request<GoodDto>(`/api/goods/${goodId}`, {
      method: 'PUT',
      body: JSON.stringify({ count: newCount }),
    }),

  getPlaces: (q = '') => {
    const qs = new URLSearchParams({ limit: '100' });
    if (q) qs.set('q', q);
    return request<PaginatedResponse<PlaceDto>>(`/api/places?${qs.toString()}`);
  },

  getClients: (q = '') => {
    const qs = new URLSearchParams({ limit: '100' });
    if (q) qs.set('q', q);
    return request<PaginatedResponse<ClientDto>>(`/api/clients?${qs.toString()}`);
  },

  getOrders: (params: {
    q?: string;
    place?: string;
    good?: string;
    status?: string;
    payed?: boolean;
    page?: number;
    limit?: number;
  } = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.place) qs.set('place', params.place);
    if (params.good) qs.set('good', params.good);
    if (params.status) qs.set('status', params.status);
    if (params.payed !== undefined) qs.set('payed', String(params.payed));
    if (params.page) qs.set('page', String(params.page));
    qs.set('limit', String(params.limit || 20));
    return request<PaginatedResponse<OrderDto>>(`/api/orders?${qs.toString()}`);
  },

  getPublicOrder: (orderId: string) => request<OrderDto>(`/api/orders/${orderId}/public`),

  createOrder: (payload: {
    client: { _id?: string; firstName: string; lastName?: string; phone: string };
    items: Array<{ good: string; count: number; priceAtOrder?: number }>;
    place?: string | null;
    placeDescription?: string;
    sale?: number;
    credit?: number;
    extra?: number;
  }) =>
    request<OrderDto>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateOrder: (
    orderId: string,
    payload: Partial<{
      payed: boolean;
      status: OrderStatus;
      sale: number;
      credit: number;
      extra: number;
    }>,
  ) =>
    request<OrderDto>(`/api/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteOrder: (orderId: string) =>
    request<OrderDto>(`/api/orders/${orderId}`, {
      method: 'DELETE',
    }),
};
