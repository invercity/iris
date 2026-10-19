export type OrderStatus = 'work' | 'ready' | 'togo' | 'done';

export const ORDER_STATUSES: {
  value: OrderStatus;
  label: string;
  labelEn: string;
  labelUk: string;
}[] = [
  { value: 'work', label: 'New / In Progress', labelEn: 'New / In Progress', labelUk: 'Нові' },
  { value: 'ready', label: 'Ready', labelEn: 'Ready', labelUk: 'Готові' },
  { value: 'togo', label: 'To Assemble', labelEn: 'To Assemble', labelUk: 'Можна збирати' },
  { value: 'done', label: 'Completed', labelEn: 'Completed', labelUk: 'Зібрані' },
];

export type UserRole = 'admin' | 'user';
export type TenantRole = 'owner' | 'manager';

export interface MediaSize {
  url?: string;
  width?: number;
  height?: number;
  mimeType?: string;
  filesize?: number;
  filename?: string;
}

export interface MediaDto {
  _id: string;
  alt: string;
  url: string;
  filename: string;
  mimeType?: string;
  filesize?: number;
  width?: number;
  height?: number;
  sizes?: {
    thumbnail?: MediaSize;
    card?: MediaSize;
    large?: MediaSize;
  };
  tenant?: string;
}

export interface TenantDto {
  _id: string;
  slug: string;
  name: string;
  domain?: string;
  description?: string;
  currency: string;
  phone?: string;
  logo?: MediaDto | string;
  owner?: string;
  active: boolean;
  created?: string;
}

export interface GoodImageItem {
  image: MediaDto | string;
  isPrimary?: boolean;
}

export interface GoodDto {
  _id: string;
  code: number;
  name: string;
  slug?: string;
  details: string;
  count: number;
  price: number;
  weight: number;
  unit?: string;
  country: string;
  type: string;
  images?: GoodImageItem[];
  isPublished?: boolean;
  tenant?: string | TenantDto;
  user?: string | { _id: string; displayName?: string };
  created: string;
}

export interface PlaceDto {
  _id: string;
  name: string;
  address: string;
  dates: string[];
  tenant?: string | TenantDto;
  user?: string;
  created: string;
}

export interface ClientDto {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  defaultAddress: string;
  defaultPlace?: PlaceDto | string | null;
  active: boolean;
  tenant?: string | TenantDto;
  user?: string;
  created: string;
}

export interface OrderItemDto {
  good: GoodDto | string;
  count: number;
  priceAtOrder?: number;
}

export interface OrderDto {
  _id: string;
  code: number;
  client: ClientDto;
  items: OrderItemDto[];
  place?: PlaceDto | string | null;
  placeDescription: string;
  payed: boolean;
  status: OrderStatus;
  credit: number;
  sale: number;
  extra: number;
  total: number;
  tenant?: string | TenantDto;
  user?: string | { _id: string; displayName?: string };
  created: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  count: number;
  page?: number;
  limit?: number;
}

/**
 * Calculates total order price matching legacy business logic:
 * sum(item.price * item.count) - sale + credit, floored at 0, then * (1 + extra / 100)
 */
export function calculateOrderTotal(
  items: Array<{ count: number; priceAtOrder?: number; good?: { price?: number } | string }>,
  options: { sale?: number; credit?: number; extra?: number } = {},
): number {
  let subtotal = 0;
  for (const item of items || []) {
    const price =
      typeof item.priceAtOrder === 'number'
        ? item.priceAtOrder
        : typeof item.good === 'object' && item.good !== null && typeof item.good.price === 'number'
          ? item.good.price
          : 0;
    if (price > 0 && item.count > 0) {
      subtotal += price * item.count;
    }
  }

  if (options.sale) {
    subtotal -= Number(options.sale) || 0;
  }
  if (options.credit) {
    subtotal += Number(options.credit) || 0;
  }

  const baseTotal = Math.max(0, subtotal);
  const extraPercent = Number(options.extra) || 0;
  const finalTotal = extraPercent !== 0 ? baseTotal * (1 + extraPercent / 100) : baseTotal;

  return Number(finalTotal.toFixed(2));
}

/**
 * Masks client phone number for unauthenticated public order preview
 * e.g. "+380501234567" -> "XXX XXX XX 67"
 */
export function maskClientPhone(phone?: string, isAuthenticated = false): string {
  const safePhone = (phone || 'XX').trim();
  if (isAuthenticated) {
    return safePhone;
  }
  const lastTwo = safePhone.slice(-2);
  return `XXX XXX XX ${lastTwo}`;
}

/**
 * Normalizes a username into a valid DNS subdomain / tenant slug.
 * e.g. "Vitaly_Shop!" -> "vitaly-shop"
 */
export function normalizeTenantSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'default';
}

/**
 * Extracts tenant slug from hostname (e.g. "vitaly.homee.ua" -> "vitaly", "www.homee.ua" -> null,
 * "vitaly.localhost" -> "vitaly")
 */
export function resolveTenantSlugFromHostname(
  hostname: string,
  baseDomain = 'homee.ua',
): string | null {
  if (!hostname) return null;
  const cleanHost = hostname.split(':')[0].toLowerCase().trim();

  if (cleanHost === 'localhost' || cleanHost === '127.0.0.1' || cleanHost === baseDomain || cleanHost === `www.${baseDomain}`) {
    return null;
  }

  if (cleanHost.endsWith(`.${baseDomain}`)) {
    const sub = cleanHost.slice(0, -(baseDomain.length + 1));
    if (sub && sub !== 'www' && sub !== 'api' && sub !== 'admin') {
      return sub;
    }
    return null;
  }

  if (cleanHost.endsWith('.localhost')) {
    const sub = cleanHost.slice(0, -'.localhost'.length);
    if (sub && sub !== 'www' && sub !== 'api' && sub !== 'admin') {
      return sub;
    }
    return null;
  }

  const parts = cleanHost.split('.');
  if (parts.length >= 3) {
    const sub = parts[0];
    if (sub && sub !== 'www' && sub !== 'api' && sub !== 'admin') {
      return sub;
    }
  }

  return null;
}

/**
 * Formats tenant storefront URL for a given tenant slug and base domain
 */
export function formatTenantUrl(slug: string, baseDomain = 'homee.ua', protocol = 'https'): string {
  return `${protocol}://${slug}.${baseDomain}`;
}
