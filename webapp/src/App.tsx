import React from 'react';
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { AdminLayout } from '@/components/layouts/AdminLayout';

import { HomePage } from '@/routes/customer/HomePage';
import { SalonsPage } from '@/routes/customer/SalonsPage';
import { SalonDetailPage } from '@/routes/customer/SalonDetailPage';
import { QueuePage } from '@/routes/customer/QueuePage';
import { MyTokenPage } from '@/routes/customer/MyTokenPage';
import { LoginPage } from '@/routes/customer/LoginPage';

import { AdminLoginPage } from '@/routes/admin/AdminLoginPage';
import { AdminDashboardPage } from '@/routes/admin/AdminDashboardPage';
import { AdminQueuePage } from '@/routes/admin/AdminQueuePage';
import { AdminCustomersPage } from '@/routes/admin/AdminCustomersPage';
import { AdminServicesPage } from '@/routes/admin/AdminServicesPage';
import { AdminSettingsPage } from '@/routes/admin/AdminSettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

interface RouterContext {
  queryClient: QueryClient;
}

function RootLayout() {
  const qc = queryClient;
  React.useEffect(() => {
    const handleSync = () => {
      qc.invalidateQueries();
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('barberq:store-change', handleSync);
    window.addEventListener('barberq:auth-change', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('barberq:store-change', handleSync);
      window.removeEventListener('barberq:auth-change', handleSync);
    };
  }, [qc]);

  return (
    <>
      <Outlet />
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />
    </>
  );
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

/* ---- Customer routes (customer layout) ---- */
const customerRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'customer-layout',
  component: CustomerLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => customerRoute,
  path: '/',
  component: HomePage,
});

const salonsRoute = createRoute({
  getParentRoute: () => customerRoute,
  path: '/salons',
  component: SalonsPage,
});

const salonDetailRoute = createRoute({
  getParentRoute: () => customerRoute,
  path: '/salon/$id',
  component: SalonDetailPage,
});

const queueRoute = createRoute({
  getParentRoute: () => customerRoute,
  path: '/queue/$id',
  component: QueuePage,
});

const myTokenRoute = createRoute({
  getParentRoute: () => customerRoute,
  path: '/my-token',
  component: MyTokenPage,
});

const loginRoute = createRoute({
  getParentRoute: () => customerRoute,
  path: '/login',
  component: LoginPage,
});

/* ---- Admin routes ---- */
const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/login',
  component: AdminLoginPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'admin-layout',
  component: AdminLayout,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/admin/dashboard',
  component: AdminDashboardPage,
});

const adminQueueRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/admin/queue',
  component: AdminQueuePage,
});

const adminCustomersRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/admin/customers',
  component: AdminCustomersPage,
});

const adminServicesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/admin/services',
  component: AdminServicesPage,
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/admin/settings',
  component: AdminSettingsPage,
});

const routeTree = rootRoute.addChildren([
  customerRoute.addChildren([
    homeRoute,
    salonsRoute,
    salonDetailRoute,
    queueRoute,
    myTokenRoute,
    loginRoute,
  ]),
  adminLoginRoute,
  adminRoute.addChildren([
    adminDashboardRoute,
    adminQueueRoute,
    adminCustomersRoute,
    adminServicesRoute,
    adminSettingsRoute,
  ]),
]);

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
