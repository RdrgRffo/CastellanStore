 import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { WishlistProvider } from './context/WishlistContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import CartSidebar from './components/layout/CartSidebar';
import ScrollToTop from './components/layout/ScrollToTop';
import PageTransition from './components/ui/PageTransition';
import HomePage from './pages/Home/HomePage';
import ShopPage from './pages/Shop/ShopPage';
import ProductPage from './pages/Product/ProductPage';
import CartPage from './pages/Cart/CartPage';
import CheckoutPage from './pages/Checkout/CheckoutPage';
import AboutPage from './pages/About/AboutPage';
import AuthPage from './pages/Auth/AuthPage';
import ShippingPage from './pages/Help/ShippingPage';
import WarrantyPage from './pages/Help/WarrantyPage';
import FAQPage from './pages/Help/FAQPage';
import ContactPage from './pages/Help/ContactPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboardPage from './pages/Admin/AdminDashboardPage';
import AdminProductsPage from './pages/Admin/AdminProductsPage';
import AdminOrdersPage from './pages/Admin/AdminOrdersPage';
import AdminCouponsPage from './pages/Admin/AdminCouponsPage';
import AdminUsersPage from './pages/Admin/AdminUsersPage';
import AdminActivityLogPage from './pages/Admin/AdminActivityLogPage';
import MyOrdersPage from './pages/Orders/MyOrdersPage';
import ProfilePage from './pages/Profile/ProfilePage';
import ComparePage from './pages/Compare/ComparePage';

function AppContent() {
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  const isAdmin = mounted && location.pathname.startsWith('/admin');

  return (
    <AuthProvider>
      <WishlistProvider>
      <CartProvider>
        <ToastProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <CartSidebar />
          <div className="flex-1">
            <PageTransition>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/sobre-nosotros" element={<AboutPage />} />
              <Route path="/envios" element={<ShippingPage />} />
              <Route path="/garantia" element={<WarrantyPage />} />
              <Route path="/preguntas-frecuentes" element={<FAQPage />} />
              <Route path="/contacto" element={<ContactPage />} />
              <Route path="/mis-pedidos" element={<MyOrdersPage />} />
              <Route path="/perfil" element={<ProfilePage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="coupons" element={<AdminCouponsPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="activity" element={<AdminActivityLogPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            </PageTransition>
          </div>
          {mounted && !isAdmin && <Footer />}
        </div>
        </ToastProvider>
      </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

export default App;
