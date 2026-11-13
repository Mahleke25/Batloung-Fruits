import { useEffect, useState } from 'react';
import './App.css';

import Fruits from './pages/Fruits';
import BoxSizes from './pages/BoxSizes';
import Suppliers from './pages/suppliers';
import Vendors from './pages/vendors';
import Products from './pages/products';
import Purchases from './pages/purchases';
import Orders from './pages/Orders';
import Reports from './pages/Reports';

import {
  getFruits,
  getSuppliers,
  getVendors,
  getProducts,
  getPurchases
} from './services/api';

const navigation = [
  { id: 'dashboard', label: 'Market overview', icon: '◈', group: 'MAIN' },
  { id: 'fruits', label: 'Fruit catalogue', icon: '🍎', group: 'INVENTORY' },
  { id: 'products', label: 'Market products', icon: '▦', group: 'INVENTORY' },
  { id: 'boxsizes', label: 'Packaging sizes', icon: '▣', group: 'INVENTORY' },
  { id: 'purchases', label: 'Inventory', icon: '↙', group: 'OPERATIONS' },
  { id: 'suppliers', label: 'Our suppliers', icon: '🚚', group: 'OPERATIONS' },
  { id: 'vendors', label: 'Street vendors', icon: '🏪', group: 'OPERATIONS' },
  { id: 'orders', label: 'Customer orders', icon: '≡', group: 'OPERATIONS' },
  { id: 'reports', label: 'Business reports', icon: '↗', group: 'INSIGHTS' }
];

const emptyCounts = {
  fruits: [],
  suppliers: [],
  vendors: [],
  products: [],
  purchases: []
};

const summaryCards = [
  { key: 'fruits', label: 'Fruit varieties', color: 'lime', icon: '🍏', note: 'In the catalogue' },
  { key: 'products', label: 'Products listed', color: 'orange', icon: '🍊', note: 'Available product types' },
  { key: 'suppliers', label: 'Trusted suppliers', color: 'pink', icon: '🍓', note: 'Supply partners' },
  { key: 'vendors', label: 'Registered vendors', color: 'purple', icon: '🍇', note: 'Market customers' },
  { key: 'purchases', label: 'Stock purchases', color: 'blue', icon: '🧺', note: 'Recorded deliveries' }
];

function App() {
  const [page, setPage] = useState('dashboard');
  const [counts, setCounts] = useState(emptyCounts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  
  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      const responses = await Promise.all([
        getFruits(),
        getSuppliers(),
        getVendors(),
        getProducts(),
        getPurchases()
      ]);

      setCounts({
        fruits: Array.isArray(responses[0]) ? responses[0] : [],
        suppliers: Array.isArray(responses[1]) ? responses[1] : [],
        vendors: Array.isArray(responses[2]) ? responses[2] : [],
        products: Array.isArray(responses[3]) ? responses[3] : [],
        purchases: Array.isArray(responses[4]) ? responses[4] : []
      });
    } catch (err) {
      console.error('Unable to load market data:', err);
      setError('We could not load the latest figures. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const validPage = (value) =>
      navigation.some((item) => item.id === value);

    const startingPage = window.location.hash.slice(1);
    if (validPage(startingPage)) setPage(startingPage);

    function syncPage() {
      const requestedPage = window.location.hash.slice(1);
      setPage(validPage(requestedPage) ? requestedPage : 'dashboard');
    }

    window.addEventListener('hashchange', syncPage);
    loadDashboard();

    return () => window.removeEventListener('hashchange', syncPage);
  }, []);

  function navigate(target) {
    setPage(target);
    setMobileMenu(false);
    window.location.hash = target;
  }

  const currentPage = navigation.find((item) => item.id === page);
  const filteredNavigation = navigation.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  function renderDashboard() {
    return (
      <div className="fresh-dashboard">
        <section className="market-hero">
          <div className="hero-copy">
            <span className="eyebrow"><span className="live-dot" /> YOUR DAILY MARKET SNAPSHOT</span>
            <h1>Fresh ideas.<br /><span>Better business.</span></h1>
            <p>Your produce, partners and stock records — all in one fresh place.</p>
            <button className="hero-button" onClick={() => navigate('products')}>
              Explore products <span>↗</span>
            </button>
          </div>
          <div className="hero-art" aria-hidden="true">
            <span className="fruit-orbit orbit-one">🍊</span>
            <span className="fruit-orbit orbit-two">🍋</span>
            <span className="fruit-orbit orbit-three">🍎</span>
            <span className="fruit-orbit orbit-four">🍇</span>
            <div className="hero-fruit">🍉</div>
            <span className="art-spark spark-one">✳</span>
            <span className="art-spark spark-two">✦</span>
          </div>
          <div className="hero-index">BATLOUNG / MARKET 001</div>
        </section>

        <div className="section-heading">
          <div>
            <span className="section-kicker">THE BIG PICTURE</span>
            <h2>Your market at a glance</h2>
            <p>Live totals from your connected records.</p>
          </div>
          <button className="refresh-button" onClick={loadDashboard} disabled={loading}>
            <span>{loading ? '◌' : '↻'}</span> {loading ? 'Updating...' : 'Refresh figures'}
          </button>
        </div>

        {error && <div className="market-error">{error}</div>}

        <div className="market-stats">
          {summaryCards.map((card, index) => (
            <button
              className={`stat-card stat-${card.color}`}
              key={card.key}
              onClick={() => navigate(card.key)}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="stat-top">
                <span className="stat-icon">{card.icon}</span>
                <span className="stat-arrow">↗</span>
              </div>
              <span className="stat-label">{card.label}</span>
              <strong className="stat-number">
                {loading ? '—' : counts[card.key].length}
              </strong>
              <span className="stat-note">{card.note}</span>
              <span className="stat-decoration" />
            </button>
          ))}
        </div>

        <div className="dashboard-bottom">
          <section className="welcome-panel">
            <span className="section-kicker">A LITTLE ORGANISATION GOES A LONG WAY</span>
            <h2>Keep the market moving.</h2>
            <p>Record incoming stock, maintain your supplier details, and keep your catalogue up to date.</p>
            <div className="welcome-actions">
              <button className="action-primary" onClick={() => navigate('purchases')}>＋ Record a purchase</button>
              <button className="action-secondary" onClick={() => navigate('fruits')}>Browse fruits ↗</button>
            </div>
            <div className="panel-decoration">FRESH<br />EVERY DAY.</div>
          </section>

          <section className="activity-panel">
            <div className="activity-heading">
              <div>
                <span className="section-kicker">QUICK ACCESS</span>
                <h2>Where to next?</h2>
              </div>
              <span className="activity-symbol">✳</span>
            </div>
            {[
              ['fruits', '🍎', 'Fruit catalogue', 'Manage your fruit varieties'],
              ['suppliers', '🚚', 'Supplier directory', 'View your supply partners'],
              ['vendors', '🏪', 'Vendor directory', 'Manage registered vendors'],
              ['reports', '📊', 'Business reports', 'Review your business records']
            ].map(([id, icon, title, description]) => (
              <button className="quick-link" key={id} onClick={() => navigate(id)}>
                <span className="quick-icon">{icon}</span>
                <span className="quick-copy">
                  <strong>{title}</strong>
                  <small>{description}</small>
                </span>
                <span className="quick-arrow">↗</span>
              </button>
            ))}
          </section>
        </div>

        <footer className="market-footer">
          <span>🍃 BATLOUNG FRUITS</span>
          <span>Growing good business, one delivery at a time.</span>
        </footer>
      </div>
    );
  }

  function renderPage() {
    switch (page) {
      case 'fruits': return <Fruits />;
      case 'boxsizes': return <BoxSizes />;
      case 'suppliers': return <Suppliers />;
      case 'vendors': return <Vendors />;
      case 'products': return <Products />;
      case 'purchases': return <Purchases />;
      case 'orders': return <Orders />;
      case 'reports': return <Reports />;
      default: return renderDashboard();
    }
  }

  return (

  

    <div className="fresh-app">
      <aside className={`fresh-sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <button className="brand-lockup" onClick={() => navigate('dashboard')}>
          <span className="brand-mark">B<span>+</span></span>
          <span className="brand-words">
            <strong>Batloung<span>Fruits</span></strong>
            <small>FRESH MARKET SYSTEM</small>
          </span>
        </button>

        <div className="sidebar-market-tag">
          <span>🍃</span>
          <span><strong>Market operations</strong><small>Everything growing well.</small></span>
        </div>

        {['MAIN', 'INVENTORY', 'OPERATIONS', 'INSIGHTS'].map((group) => {
          const items = filteredNavigation.filter((item) => item.group === group);
          if (!items.length) return null;

          return (
            <div className="nav-group" key={group}>
              <p className="nav-group-label">{group}</p>
              {items.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item ${page === item.id ? 'nav-active' : ''}`}
                  onClick={() => navigate(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {page === item.id && <span className="nav-active-dot" />}
                </button>
              ))}
            </div>
          );
        })}

        <div className="sidebar-bottom">
          <div className="sidebar-fruit-art">🍓 🍋 🍇</div>
          <strong>Keep it fresh.</strong>
          <p>Good records grow good business.</p>
          <span className="version-tag">FRESH MARKET · V1.0</span>
        </div>
      </aside>

      {mobileMenu && (
        <button
          className="mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <main className="fresh-main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle navigation">☰</button>
            <div className="breadcrumb">
              <span>BATLOUNG FRUITS</span><span className="breadcrumb-slash">/</span>
              <strong>{currentPage?.label || 'Market overview'}</strong>
            </div>
          </div>
          <div className="topbar-right">
            <label className="nav-search">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Find a page..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && <button onClick={() => setSearch('')} aria-label="Clear search">×</button>}
            </label>
            <div className="market-status"><span className="live-dot" /> Market desk</div>
            <div className="profile-mark">BF</div>
          </div>
        </header>

        <div className="page-content">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;