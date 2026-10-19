import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOrderTotal,
  formatTenantUrl,
  maskClientPhone,
  normalizeTenantSlug,
  ORDER_STATUSES,
  resolveTenantSlugFromHostname,
} from '@iris/shared';

describe('Iris Shared Domain Logic & Multi-Tenancy Tests', () => {
  it('resolves tenant slug from subdomain on homee.ua and localhost', () => {
    assert.equal(resolveTenantSlugFromHostname('vitaly.homee.ua', 'homee.ua'), 'vitaly');
    assert.equal(resolveTenantSlugFromHostname('olena.homee.ua:3000', 'homee.ua'), 'olena');
    assert.equal(resolveTenantSlugFromHostname('www.homee.ua', 'homee.ua'), null);
    assert.equal(resolveTenantSlugFromHostname('homee.ua', 'homee.ua'), null);
    assert.equal(resolveTenantSlugFromHostname('vitaly.localhost:5173', 'homee.ua'), 'vitaly');
    assert.equal(resolveTenantSlugFromHostname('localhost:5173', 'homee.ua'), null);
  });

  it('normalizes legacy usernames into valid subdomain slugs', () => {
    assert.equal(normalizeTenantSlug('Vitaly'), 'vitaly');
    assert.equal(normalizeTenantSlug('  user_name.123 '), 'user-name-123');
    assert.equal(normalizeTenantSlug(''), 'default');
  });

  it('formats tenant storefront URLs properly', () => {
    assert.equal(formatTenantUrl('vitaly', 'homee.ua'), 'https://vitaly.homee.ua');
    assert.equal(formatTenantUrl('olena', 'custom.com', 'http'), 'http://olena.custom.com');
  });

  it('calculates order total with sale, credit, and extra percentage matching legacy formula', () => {
    const items = [
      { good: { price: 100 }, count: 2 }, // 200
      { good: { price: 50 }, count: 3 },  // 150
    ];
    // 350 - 30 (sale) + 20 (credit) = 340, + 10% extra = 374
    const total = calculateOrderTotal(items, { sale: 30, credit: 20, extra: 10 });
    assert.equal(total, 374);
  });

  it('handles empty cart or zero items calculation cleanly', () => {
    const total = calculateOrderTotal([], { sale: 10, credit: 0, extra: 0 });
    assert.equal(total, 0);
  });

  it('masks client phone number for public order view', () => {
    assert.equal(maskClientPhone('+380501234567', false), 'XXX XXX XX 67');
    assert.equal(maskClientPhone('+380501234567', true), '+380501234567');
  });

  it('provides bilingual labels for order workflow statuses', () => {
    assert.equal(ORDER_STATUSES.length, 4);
    for (const status of ORDER_STATUSES) {
      assert.ok(status.value);
      assert.ok(status.labelEn);
      assert.ok(status.labelUk);
    }
  });
});
