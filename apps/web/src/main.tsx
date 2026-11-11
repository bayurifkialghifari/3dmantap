import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { AppShell } from './components/templates/AppShell';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { Product } from './pages/Product';
import { Studio } from './pages/Studio';
import { RoomPlanner } from './pages/RoomPlanner';
import { Auth } from './pages/Auth';
import { Library } from './pages/Library';
import { Inquiry, Preview } from './pages/Inquiry';
import { Admin } from './pages/Admin';
import './styles.css';
const root = createRootRoute({
  component: AppShell,
  notFoundComponent: () => (
    <div className="empty">
      <h1>Halaman belum ditemukan.</h1>
      <a href="/">Kembali ke beranda</a>
    </div>
  ),
});
const routes = [
  createRoute({ getParentRoute: () => root, path: '/', component: Home }),
  createRoute({ getParentRoute: () => root, path: '/catalog/$studio', component: Catalog }),
  createRoute({ getParentRoute: () => root, path: '/product/$id', component: Product }),
  createRoute({ getParentRoute: () => root, path: '/studio/$id', component: Studio }),
  createRoute({ getParentRoute: () => root, path: '/room-planner', component: RoomPlanner }),
  createRoute({ getParentRoute: () => root, path: '/login', component: Auth }),
  createRoute({ getParentRoute: () => root, path: '/library', component: Library }),
  createRoute({ getParentRoute: () => root, path: '/inquiry/$id', component: Inquiry }),
  createRoute({ getParentRoute: () => root, path: '/preview/$id', component: Preview }),
  createRoute({ getParentRoute: () => root, path: '/share/$id', component: Preview }),
  createRoute({ getParentRoute: () => root, path: '/admin', component: Admin }),
];
const router = createRouter({
  routeTree: root.addChildren(routes),
  defaultPreload: 'intent',
  scrollRestoration: true,
});
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
const client = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);
