import React, { useEffect, useMemo, useState } from 'react';
import {
  calculateOrderTotal,
  ORDER_STATUSES,
  type TenantDto,
  type GoodDto,
  type PlaceDto,
  type OrderDto,
  type OrderStatus,
  type MediaDto,
} from '@iris/shared';
import { irisApi, detectTenantSlug, setTenantSlugOverride } from './api';
import { translations, getInitialLocale, type Locale } from './i18n';

type ViewTab = 'storefront' | 'orders' | 'order-preview';

interface CartItem {
  good: GoodDto;
  count: number;
}

function getGoodImageUrl(good: GoodDto): string | null {
  if (!good.images || good.images.length === 0) return null;
  const primary = good.images.find((i) => i.isPrimary) || good.images[0];
  if (!primary || !primary.image) return null;
  if (typeof primary.image === 'string') return null;
  const media = primary.image as MediaDto;
  return media.sizes?.card?.url || media.sizes?.thumbnail?.url || media.url || null;
}

export function App() {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const t = translations[locale];

  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [currentTenant, setCurrentTenant] = useState<TenantDto | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('storefront');
  const [previewOrderId, setPreviewOrderId] = useState<string | null>(null);
  const [previewOrder, setPreviewOrder] = useState<OrderDto | null>(null);

  // Storefront state
  const [goods, setGoods] = useState<GoodDto[]>([]);
  const [places, setPlaces] = useState<PlaceDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);

  // Cart & Checkout state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [placeDescription, setPlaceDescription] = useState('');
  const [createdOrder, setCreatedOrder] = useState<OrderDto | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Orders Management state
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [ordersCount, setOrdersCount] = useState(0);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilterPayed, setOrderFilterPayed] = useState<'unpaid' | 'paid' | 'all'>('unpaid');
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('');
  const [orderFilterPlace, setOrderFilterPlace] = useState<string>('');

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('iris_locale', newLocale);
    }
  };

  // Check URL path for `/orders/:orderId` public preview
  useEffect(() => {
    const match = window.location.pathname.match(/^\/orders\/([a-fA-F0-9]{24})/);
    if (match) {
      setPreviewOrderId(match[1]);
      setActiveTab('order-preview');
    }
  }, []);

  const loadTenantAndCatalog = async () => {
    setLoading(true);
    try {
      const [tenantsRes, resolvedTenant] = await Promise.all([
        irisApi.getTenants().catch(() => ({ items: [], count: 0 })),
        irisApi.getCurrentTenant().catch(() => null),
      ]);
      setTenants(tenantsRes.items || []);

      if (resolvedTenant && !detectTenantSlug()) {
        setTenantSlugOverride(resolvedTenant.slug);
      }
      setCurrentTenant(resolvedTenant);

      const [goodsRes, placesRes] = await Promise.all([
        irisApi.getGoods({ limit: 200 }),
        irisApi.getPlaces(),
      ]);
      setGoods(goodsRes.items || []);
      setPlaces(placesRes.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenantAndCatalog();
  }, []);

  useEffect(() => {
    if (activeTab === 'order-preview' && previewOrderId) {
      irisApi
        .getPublicOrder(previewOrderId)
        .then(setPreviewOrder)
        .catch(() => setPreviewOrder(null));
    }
  }, [activeTab, previewOrderId]);

  const loadOrders = async () => {
    const payedParam =
      orderFilterPayed === 'unpaid' ? false : orderFilterPayed === 'paid' ? true : undefined;
    const res = await irisApi.getOrders({
      q: orderSearch,
      payed: payedParam,
      status: orderFilterStatus || undefined,
      place: orderFilterPlace || undefined,
      limit: 50,
    });
    setOrders(res.items || []);
    setOrdersCount(res.count || 0);
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    }
  }, [activeTab, orderSearch, orderFilterPayed, orderFilterStatus, orderFilterPlace, currentTenant]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const g of goods) {
      if (g.type && g.type.trim()) set.add(g.type.trim());
    }
    return Array.from(set);
  }, [goods]);

  const filteredGoods = useMemo(() => {
    return goods.filter((g) => {
      if (selectedCategory && g.type !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = g.name?.toLowerCase().includes(q);
        const matchDetails = g.details?.toLowerCase().includes(q);
        const matchCode = String(g.code).includes(q);
        return matchName || matchDetails || matchCode;
      }
      return true;
    });
  }, [goods, selectedCategory, searchQuery]);

  const currency = currentTenant?.currency || '₴';

  const addToCart = (good: GoodDto) => {
    setCreatedOrder(null);
    setCart((prev) => {
      const existing = prev.find((i) => i.good._id === good._id);
      if (existing) {
        if (existing.count >= good.count) return prev;
        return prev.map((i) =>
          i.good._id === good._id ? { ...i, count: i.count + 1 } : i,
        );
      }
      return [...prev, { good, count: 1 }];
    });
  };

  const updateCartCount = (goodId: string, count: number) => {
    if (count <= 0) {
      setCart((prev) => prev.filter((i) => i.good._id !== goodId));
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.good._id === goodId
          ? { ...i, count: Math.min(i.good.count, count) }
          : i,
      ),
    );
  };

  const cartTotal = useMemo(
    () =>
      calculateOrderTotal(
        cart.map((i) => ({ good: i.good, count: i.count })),
      ),
    [cart],
  );

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (!clientFirstName.trim() || !clientPhone.trim()) {
      setCheckoutError(t.validationRequired);
      return;
    }
    if (cart.length === 0) {
      setCheckoutError(t.cartEmptyError);
      return;
    }

    setSubmittingOrder(true);
    try {
      const order = await irisApi.createOrder({
        client: {
          firstName: clientFirstName.trim(),
          lastName: clientLastName.trim(),
          phone: clientPhone.trim(),
        },
        items: cart.map((i) => ({
          good: i.good._id,
          count: i.count,
          priceAtOrder: i.good.price,
        })),
        place: selectedPlaceId || null,
        placeDescription: placeDescription.trim(),
      });
      setCreatedOrder(order);
      setCart([]);
      await loadTenantAndCatalog();
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : t.orderError);
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleTenantSwitch = async (slug: string) => {
    setTenantSlugOverride(slug);
    setCart([]);
    await loadTenantAndCatalog();
  };

  const handlePayOrder = async (orderId: string) => {
    if (!window.confirm(t.payConfirm)) return;
    await irisApi.updateOrder(orderId, { payed: true });
    await loadOrders();
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    await irisApi.updateOrder(orderId, { status });
    await loadOrders();
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm(t.deleteConfirm)) return;
    await irisApi.deleteOrder(orderId);
    await loadOrders();
    await loadTenantAndCatalog();
  };

  const handleReplenishStock = async (good: GoodDto) => {
    const promptMsg = t.stockPrompt.replace('{name}', good.name);
    const input = window.prompt(promptMsg, '10');
    if (!input) return;
    const delta = Number(input);
    if (Number.isNaN(delta) || delta === 0) return;
    await irisApi.addGoodStock(good._id, Math.max(0, good.count + delta));
    await loadTenantAndCatalog();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString(locale === 'ua' ? 'uk-UA' : 'en-US');
  };

  return (
    <div>
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-block">
            <div className="brand-badge">
              {(currentTenant?.name || 'H').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="brand-title">
                {currentTenant?.name || t.brandSubtitle}
              </h1>
              {currentTenant && (
                <span className="subdomain-pill">
                  {currentTenant.domain || `${currentTenant.slug}.homee.ua`}
                </span>
              )}
            </div>
          </div>

          <div className="nav-controls">
            {tenants.length > 1 && (
              <select
                className="select"
                value={currentTenant?.slug || ''}
                onChange={(e) => handleTenantSwitch(e.target.value)}
                title={t.switchStore}
              >
                {tenants.map((tItem) => (
                  <option key={tItem._id} value={tItem.slug}>
                    {tItem.name} ({tItem.slug}.homee.ua)
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              className={`btn ${activeTab === 'storefront' ? 'btn-accent' : ''}`}
              onClick={() => {
                if (window.location.pathname !== '/') {
                  window.history.pushState({}, '', '/');
                }
                setActiveTab('storefront');
              }}
            >
              {t.storefrontTab} ({goods.length})
            </button>

            <button
              type="button"
              className={`btn ${activeTab === 'orders' ? 'btn-accent' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              {t.ordersTab}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setCreatedOrder(null);
                setIsCartOpen(true);
              }}
            >
              {t.cartButton} ({cart.reduce((acc, i) => acc + i.count, 0)}) • {cartTotal} {currency}
            </button>

            {/* Language Switcher EN / UA */}
            <div className="lang-switcher" title="Switch Language">
              <button
                type="button"
                className={`lang-btn ${locale === 'en' ? 'active' : ''}`}
                onClick={() => handleLocaleChange('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={`lang-btn ${locale === 'ua' ? 'active' : ''}`}
                onClick={() => handleLocaleChange('ua')}
              >
                UA
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container">
        {activeTab === 'order-preview' && (
          <div className="panel-card" style={{ maxWidth: 680, margin: '0 auto' }}>
            {!previewOrder ? (
              <p>{t.orderPreviewLoading}</p>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2>{t.orderPreviewTitle.replace('{code}', String(previewOrder.code))}</h2>
                  <span className={`status-pill ${previewOrder.payed ? 'status-paid' : 'status-unpaid'}`}>
                    {previewOrder.payed ? t.statusPaidBadge : t.statusPending}
                  </span>
                </div>
                <p style={{ color: 'var(--muted)', margin: '6px 0' }}>
                  {t.createdDate} {formatDate(previewOrder.created)}
                </p>
                <p style={{ margin: '6px 0' }}>
                  <strong>{t.customer}</strong> {previewOrder.client?.firstName} {previewOrder.client?.lastName}
                </p>
                <p style={{ margin: '6px 0' }}>
                  <strong>{t.phone}</strong> {previewOrder.client?.phone}
                </p>
                <p style={{ margin: '6px 0 18px' }}>
                  <strong>{t.pickupAddress}</strong>{' '}
                  {typeof previewOrder.place === 'object' && previewOrder.place
                    ? `${previewOrder.place.name} (${previewOrder.place.address})`
                    : previewOrder.placeDescription || '—'}
                </p>

                <h4>{t.tableProduct}:</h4>
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t.tableProduct}</th>
                      <th>{t.tableQty}</th>
                      <th>{t.tablePrice}</th>
                      <th>{t.tableTotal}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewOrder.items.map((item, idx) => {
                      const goodObj = typeof item.good === 'object' ? item.good : null;
                      const price = item.priceAtOrder ?? goodObj?.price ?? 0;
                      return (
                        <tr key={idx}>
                          <td>{goodObj?.name || 'Product'}</td>
                          <td>{item.count}</td>
                          <td>
                            {price} {currency}
                          </td>
                          <td>
                            {(price * item.count).toFixed(2)} {currency}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {Boolean(previewOrder.sale || previewOrder.credit) && (
                  <div style={{ marginTop: 12 }}>
                    {previewOrder.sale > 0 && (
                      <p>
                        {t.discount} -{previewOrder.sale} {currency}
                      </p>
                    )}
                    {previewOrder.credit > 0 && (
                      <p>
                        {t.debt} +{previewOrder.credit} {currency}
                      </p>
                    )}
                  </div>
                )}

                <h3 style={{ marginTop: 16 }}>
                  {t.totalToPay} {previewOrder.total} {currency}
                </h3>
              </div>
            )}
          </div>
        )}

        {activeTab === 'storefront' && (
          <>
            {currentTenant?.description && (
              <div className="panel-card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <strong>{currentTenant.name}</strong> — {currentTenant.description}
                  </div>
                  {currentTenant.phone && (
                    <span style={{ color: 'var(--muted)', fontSize: 14 }}>
                      {t.phone} <strong>{currentTenant.phone}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="toolbar">
              <input
                type="search"
                className="input input-grow"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <select
                className="select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">{t.allCategories}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <p>{t.loadingCatalog}</p>
            ) : filteredGoods.length === 0 ? (
              <div className="panel-card">
                <p>{t.noGoodsFound}</p>
              </div>
            ) : (
              <div className="goods-grid">
                {filteredGoods.map((good) => {
                  const imgUrl = getGoodImageUrl(good);
                  const inCart = cart.find((c) => c.good._id === good._id)?.count || 0;
                  return (
                    <div key={good._id} className="good-card">
                      <div className="good-img-wrap">
                        {imgUrl ? (
                          <img src={imgUrl} alt={good.name} />
                        ) : (
                          <span style={{ fontSize: 44 }} role="img" aria-label="Product">
                            🧺
                          </span>
                        )}
                        {good.type && <span className="good-type-tag">{good.type}</span>}
                      </div>

                      <div className="good-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <h3 className="good-title">{good.name}</h3>
                          <span className={`stock-badge ${good.count <= 0 ? 'stock-empty' : ''}`}>
                            {good.count > 0
                              ? `${t.inStock} ${good.count} ${good.unit || 'pcs'}`
                              : t.outOfStock}
                          </span>
                        </div>

                        <p className="good-details">
                          {good.details || t.defaultStoreDesc}
                        </p>

                        <div className="good-footer">
                          <div>
                            <div className="good-price">
                              {good.price} {currency}
                            </div>
                            <small style={{ color: 'var(--muted)' }}>{t.code} #{good.code}</small>
                          </div>

                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              className="btn"
                              title={t.addToStock}
                              onClick={() => handleReplenishStock(good)}
                            >
                              {t.addToStock}
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={good.count <= 0 || inCart >= good.count}
                              onClick={() => addToCart(good)}
                            >
                              {inCart > 0 ? `${t.inCart} (${inCart})` : t.buy}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'orders' && (
          <div className="orders-layout">
            <aside className="panel-card" style={{ height: 'fit-content' }}>
              <h3 style={{ marginTop: 0 }}>{t.orderFilters}</h3>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>{t.searchOrder}</label>
                <input
                  type="text"
                  className="input"
                  style={{ width: '100%' }}
                  placeholder={t.searchOrderPlaceholder}
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>{t.paymentStatus}</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className={`btn ${orderFilterPayed === 'unpaid' ? 'btn-accent' : ''}`}
                    onClick={() => setOrderFilterPayed('unpaid')}
                  >
                    {t.statusNew}
                  </button>
                  <button
                    type="button"
                    className={`btn ${orderFilterPayed === 'paid' ? 'btn-accent' : ''}`}
                    onClick={() => setOrderFilterPayed('paid')}
                  >
                    {t.statusPaid}
                  </button>
                  <button
                    type="button"
                    className={`btn ${orderFilterPayed === 'all' ? 'btn-accent' : ''}`}
                    onClick={() => setOrderFilterPayed('all')}
                  >
                    {t.statusAll}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>{t.orderStatus}</label>
                <select
                  className="select"
                  style={{ width: '100%' }}
                  value={orderFilterStatus}
                  onChange={(e) => setOrderFilterStatus(e.target.value)}
                >
                  <option value="">{t.allStatuses}</option>
                  {ORDER_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {locale === 'ua' ? s.labelUk : s.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>{t.pickupPlace}</label>
                <select
                  className="select"
                  style={{ width: '100%' }}
                  value={orderFilterPlace}
                  onChange={(e) => setOrderFilterPlace(e.target.value)}
                >
                  <option value="">{t.allPlaces}</option>
                  {places.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </aside>

            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 style={{ margin: 0 }}>{t.ordersListTitle} ({ordersCount})</h2>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setActiveTab('storefront');
                    setIsCartOpen(true);
                  }}
                >
                  {t.newOrderBtn}
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="panel-card">
                  <p>{t.noOrdersFound}</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order._id} className="panel-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <strong style={{ fontSize: 18 }}>#{order.code}</strong>
                        <span className={`status-pill ${order.payed ? 'status-paid' : 'status-unpaid'}`}>
                          {order.payed ? t.statusPaidBadge : t.statusPending}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <select
                          className="select"
                          value={order.status || 'work'}
                          onChange={(e) => handleStatusChange(order._id, e.target.value as OrderStatus)}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {locale === 'ua' ? s.labelUk : s.labelEn}
                            </option>
                          ))}
                        </select>

                        {!order.payed && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => handlePayOrder(order._id)}
                          >
                            {t.payOrderBtn}
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn"
                          onClick={() => {
                            setPreviewOrderId(order._id);
                            setActiveTab('order-preview');
                          }}
                        >
                          {t.previewBtn}
                        </button>

                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => handleDeleteOrder(order._id)}
                        >
                          {t.deleteBtn}
                        </button>
                      </div>
                    </div>

                    <p style={{ margin: '10px 0 6px' }}>
                      <strong>{t.customer}</strong> {order.client?.firstName} {order.client?.lastName}, {t.phone}{' '}
                      <a href={`tel:${order.client?.phone}`}>{order.client?.phone}</a>
                    </p>

                    <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <span>
                        <strong>{t.pickupAddress}</strong>{' '}
                        {typeof order.place === 'object' && order.place
                          ? order.place.name
                          : order.placeDescription || '—'}
                      </span>
                      <span>
                        <strong>{t.subtotal}</strong> {order.total} {currency} •{' '}
                        <strong>{t.createdDate}</strong> {formatDate(order.created)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
        )}
      </main>

      {isCartOpen && (
        <div className="modal-backdrop" onClick={() => setIsCartOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>{t.cartAndCheckout}</h2>
              <button type="button" className="btn" onClick={() => setIsCartOpen(false)}>
                ✕
              </button>
            </div>

            {createdOrder ? (
              <div>
                <div className="panel-card" style={{ background: '#d1e7dd', borderColor: '#badbcc' }}>
                  <h3 style={{ marginTop: 0, color: '#0f5132' }}>
                    {t.orderCreatedSuccess.replace('{code}', String(createdOrder.code))}
                  </h3>
                  <p>
                    {t.totalToPay} <strong>{createdOrder.total} {currency}</strong>
                  </p>
                  <p style={{ fontSize: 13 }}>
                    {t.orderUrl}{' '}
                    <a
                      href={`/orders/${createdOrder._id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setIsCartOpen(false);
                        setPreviewOrderId(createdOrder._id);
                        setActiveTab('order-preview');
                      }}
                    >
                      {window.location.origin}/orders/{createdOrder._id}
                    </a>
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setCreatedOrder(null);
                    setIsCartOpen(false);
                  }}
                >
                  {t.backToStore}
                </button>
              </div>
            ) : cart.length === 0 ? (
              <p>{t.emptyCart}</p>
            ) : (
              <form onSubmit={handleCheckoutSubmit}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t.tableProduct}</th>
                      <th>{t.tableStock}</th>
                      <th>{t.tableQty}</th>
                      <th>{t.tableTotal}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.good._id}>
                        <td>{item.good.name}</td>
                        <td>{item.good.count}</td>
                        <td>
                          <input
                            type="number"
                            className="input"
                            style={{ width: 72 }}
                            min={1}
                            max={item.good.count}
                            value={item.count}
                            onChange={(e) => updateCartCount(item.good._id, Number(e.target.value))}
                          />
                        </td>
                        <td>
                          {(item.good.price * item.count).toFixed(2)} {currency}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => updateCartCount(item.good._id, 0)}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 style={{ textAlign: 'right' }}>
                  {t.subtotal} {cartTotal} {currency}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>{t.clientFirstName}</label>
                    <input
                      type="text"
                      className="input"
                      style={{ width: '100%' }}
                      required
                      value={clientFirstName}
                      onChange={(e) => setClientFirstName(e.target.value)}
                      placeholder={t.clientFirstNamePlaceholder}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>{t.clientLastName}</label>
                    <input
                      type="text"
                      className="input"
                      style={{ width: '100%' }}
                      value={clientLastName}
                      onChange={(e) => setClientLastName(e.target.value)}
                      placeholder={t.clientLastNamePlaceholder}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>{t.clientPhone}</label>
                  <input
                    type="tel"
                    className="input"
                    style={{ width: '100%' }}
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder={t.clientPhonePlaceholder}
                  />
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>{t.pickupPlace}</label>
                  <select
                    className="select"
                    style={{ width: '100%' }}
                    value={selectedPlaceId}
                    onChange={(e) => setSelectedPlaceId(e.target.value)}
                  >
                    <option value="">{t.pickupManual}</option>
                    {places.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.address})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
                    {t.deliveryAddressOrNote}
                  </label>
                  <textarea
                    className="textarea"
                    style={{ width: '100%' }}
                    rows={3}
                    value={placeDescription}
                    onChange={(e) => setPlaceDescription(e.target.value)}
                    placeholder={t.deliveryAddressPlaceholder}
                  />
                </div>

                {checkoutError && (
                  <p style={{ color: 'var(--danger)', fontWeight: 600 }}>{checkoutError}</p>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                  <button type="button" className="btn" onClick={() => setIsCartOpen(false)}>
                    {t.cancel}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submittingOrder}>
                    {submittingOrder ? t.submitting : t.submitOrder}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
