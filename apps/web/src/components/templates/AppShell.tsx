import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { Box, ArrowUpRight, Menu, X, Layers, UserRound, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useMe } from '../../lib/hooks';
import { useRegisterSW } from 'virtual:pwa-register/react';
export function AppShell() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  const [menu, setMenu] = useState(false),
    [online, setOnline] = useState(navigator.onLine);
  const location = useLocation();
  const { data: me } = useMe();
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  const studio = location.pathname.startsWith('/studio') || location.pathname === '/room-planner';
  return (
    <>
      <header className="site-header">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Box size={22} strokeWidth={1.8} />
          </span>
          3D<span>Mantap</span>
          <span className="brand-dot">®</span>
        </Link>
        <nav className={menu ? 'open' : ''} onClick={() => setMenu(false)}>
          <Link to="/catalog/$studio" params={{ studio: 'fashion' }}>
            Fashion Studio
          </Link>
          <Link to="/catalog/$studio" params={{ studio: 'interior' }}>
            Interior Studio
          </Link>
          <Link to="/room-planner">Room Planner</Link>
          <Link to="/library">Desain Saya</Link>
          {me?.role === 'admin' && <Link to="/admin">CMS</Link>}
        </nav>
        <div className="header-actions">
          <Link to={me?.user ? '/library' : '/login'} className="account-link">
            <UserRound size={18} />
            <span>{me?.user ? me.user.name.split(' ')[0] : 'Masuk'}</span>
          </Link>
          <Link
            to="/catalog/$studio"
            params={{ studio: 'fashion' }}
            className="button primary header-cta"
          >
            Mulai desain <ArrowUpRight size={16} />
          </Link>
          <button
            className="menu-toggle icon-button"
            aria-label="Buka navigasi"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {!online && (
        <div className="offline-banner">
          <WifiOff size={14} /> Kamu sedang offline. Draft lokal tetap tersimpan; submit memerlukan
          koneksi.
        </div>
      )}
      <>
        {needRefresh && (
          <div className="pwa-update">
            <span>Versi baru 3DMantap tersedia. Simpan draft, lalu perbarui.</span>
            <button onClick={() => void updateServiceWorker(true)}>Perbarui</button>
            <button onClick={() => setNeedRefresh(false)}>Nanti</button>
          </div>
        )}
      </>
      <main className={studio ? 'workspace-main' : ''}>
        <Outlet />
      </main>
      {!studio && (
        <footer className="site-footer">
          <div>
            <Link to="/" className="brand">
              <span className="brand-mark">
                <Box size={20} />
              </span>
              3DMantap
            </Link>
            <p>Desainmu. Caramu. Dibuat untukmu.</p>
          </div>
          <div className="footer-links">
            <Link to="/catalog/$studio" params={{ studio: 'fashion' }}>
              Fashion
            </Link>
            <Link to="/catalog/$studio" params={{ studio: 'interior' }}>
              Interior
            </Link>
            <Link to="/room-planner">Room Planner</Link>
            <Link to="/library">
              <Layers size={14} /> Pustaka desain
            </Link>
          </div>
          <small>© {new Date().getFullYear()} 3DMantap · Studio custom Indonesia</small>
        </footer>
      )}
    </>
  );
}
