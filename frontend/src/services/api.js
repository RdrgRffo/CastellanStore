/**
 * API Service — Capa de acceso a datos.
 * Usa apiClient (normalizado) para todas las llamadas.
 * Los componentes importan desde aquí, nunca desde apiClient directamente.
 */

import { get, post, put, patch, del } from './apiClient';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:9100/api/v1';

// ============================================
// PRODUCTOS (Watches)
// ============================================
export function fetchProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);
  if (params.minPrice) query.set('minPrice', params.minPrice);
  if (params.maxPrice) query.set('maxPrice', params.maxPrice);
  if (params.tag) query.set('tag', params.tag);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.page !== undefined) query.set('page', params.page);
  if (params.size) query.set('size', params.size);
  const qs = query.toString();
  return get(`/watches${qs ? `?${qs}` : ''}`);
}

export function fetchProduct(id) {
  return get(`/watches/${id}`);
}

export function fetchFeaturedProducts() {
  return get('/watches/featured');
}

export function fetchRelatedProducts(id, limit = 4) {
  return get(`/watches/${id}/related?limit=${limit}`);
}

// ============================================
// CUPONES
// ============================================
export function validateCoupon(code, subtotal, items = []) {
  return post('/coupons/validate', { code, subtotal, items });
}

// ============================================
// PEDIDOS
// ============================================
export function createOrder(orderData) {
  return post('/orders', orderData);
}

export function confirmStripeOrder(orderId, paymentIntentId) {
  return patch(`/orders/${orderId}/confirm-stripe`, { paymentIntentId });
}

export function fetchUserOrders(page = 0, size = 10) {
  const query = new URLSearchParams();
  query.set('page', page);
  query.set('size', size);
  return get(`/orders/user?${query.toString()}`);
}

export function cancelOrder(orderId) {
  return patch(`/orders/${orderId}/cancel`);
}

// ============================================
// CONTACTO
// ============================================
export function submitContact(formData) {
  return post('/contacts', formData);
}

// ============================================
// AUTENTICACIÓN
// ============================================
export function registerUser(email, password, birthDate, name = '') {
  return post('/auth/register', { email, password, birthDate, name });
}

export function loginUser(email, password) {
  return post('/auth/login', { email, password });
}

export function loginWithGoogle(idToken) {
  return post('/auth/google', { idToken });
}

export function updateProfile(birthDate) {
  return put('/auth/profile', { birthDate });
}

export function fetchProfile() {
  return get('/auth/profile');
}

// ============================================
// FACTURAS
// ============================================
export function getInvoice(orderNumber) {
  return get(`/invoices/${orderNumber}`);
}

// ============================================
// CARRITO (API)
// ============================================
export function fetchCart() {
  return get('/cart');
}

export function addToCartAPI(watchId, quantity = 1) {
  return post('/cart', { watchId, quantity });
}

export function syncCartAPI(items) {
  return post('/cart/sync', { items });
}

export function updateCartItemAPI(watchId, quantity) {
  return put(`/cart/${watchId}`, { quantity });
}

export function removeFromCartAPI(watchId) {
  return del(`/cart/${watchId}`);
}

export function clearCartAPI() {
  return del('/cart');
}

// ============================================
// ADMIN - Productos
// ============================================
export function fetchAdminProducts(search = '', page = 0, size = 20) {
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  query.set('page', page);
  query.set('size', size);
  return get(`/admin/products?${query.toString()}`);
}

export function updateProductStock(id, stock) {
  return patch(`/admin/products/${id}/stock`, { stock });
}

export function fetchAdminProduct(id) {
  return get(`/admin/products/${id}`);
}

export function createAdminProduct(data) {
  return post('/admin/products', data);
}

export function updateAdminProduct(id, data) {
  return put(`/admin/products/${id}`, data);
}

export function deleteAdminProduct(id) {
  return del(`/admin/products/${id}`);
}

export function uploadProductImage(formData) {
  return fetch(`${API_BASE}/admin/products/upload-image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: formData,
  }).then(r => r.json()).then(j => j.data);
}

export function uploadGalleryImages(formData) {
  return fetch(`${API_BASE}/admin/products/upload-gallery`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: formData,
  }).then(r => r.json()).then(j => j.data);
}

// ============================================
// ADMIN - Pedidos
// ============================================
export function fetchAdminOrders(status = '', page = 0, size = 20) {
  const query = new URLSearchParams();
  if (status) query.set('status', status);
  query.set('page', page);
  query.set('size', size);
  return get(`/admin/orders?${query.toString()}`);
}

export function fetchAdminOrder(id) {
  return get(`/admin/orders/${id}`);
}

export function updateOrderStatus(id, status) {
  return patch(`/admin/orders/${id}/status`, { status });
}

// ============================================
// ADMIN - Dashboard
// ============================================
export function fetchDashboard() {
  return get('/admin/dashboard');
}

// ============================================
// VALORACIONES Y RESEÑAS
// ============================================
export function fetchReviews(watchId, page = 0, size = 10) {
  const query = new URLSearchParams();
  query.set('page', page);
  query.set('size', size);
  return get(`/reviews/watch/${watchId}?${query.toString()}`);
}

export function createReview(data) {
  return post('/reviews', data);
}

export function updateReview(id, data) {
  return put(`/reviews/${id}`, data);
}

export function deleteReview(id) {
  return del(`/reviews/${id}`);
}

export function fetchMyReviews() {
  return get('/reviews/my-reviews');
}

// ============================================
// LISTA DE DESEOS (WISHLIST)
// ============================================
export function fetchWishlist() {
  return get('/wishlist');
}

export function addToWishlistAPI(watchId) {
  return post('/wishlist', { watchId });
}

export function removeFromWishlistAPI(watchId) {
  return del(`/wishlist/${watchId}`);
}

export function checkWishlistAPI(watchId) {
  return get(`/wishlist/check/${watchId}`);
}

// ============================================
// DIRECCIONES DE ENVÍO
// ============================================

export function fetchAddresses() {

  return get('/addresses');
}

export function createAddress(data) {
  return post('/addresses', data);
}

export function updateAddress(id, data) {
  return put(`/addresses/${id}`, data);
}

export function deleteAddress(id) {
  return del(`/addresses/${id}`);
}

export function setDefaultAddress(id) {
  return patch(`/addresses/${id}/default`);
}

// ============================================
// ADMIN - Cupones
// ============================================
export function fetchAdminCoupons(search = '', page = 0, size = 20) {
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  query.set('page', page);
  query.set('size', size);
  return get(`/admin/coupons?${query.toString()}`);
}

export function createAdminCoupon(data) {
  return post('/admin/coupons', data);
}

export function updateAdminCoupon(id, data) {
  return patch(`/admin/coupons/${id}`, data);
}

export function deleteAdminCoupon(id) {
  return del(`/admin/coupons/${id}`);
}

// ============================================
// ADMIN - Usuarios
// ============================================
export function fetchAdminUsers(search = '', page = 0, size = 20) {
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  query.set('page', page);
  query.set('size', size);
  return get(`/admin/users?${query.toString()}`);
}

export function updateUserRole(id, role) {
  return patch(`/admin/users/${id}/role`, { role });
}

export function toggleUserBlock(id) {
  return patch(`/admin/users/${id}/block`);
}

// ============================================
// ADMIN - Activity Logs
// ============================================
export function fetchActivityLogs(page = 0, size = 20) {
  const query = new URLSearchParams();
  query.set('page', page);
  query.set('size', size);
  return get(`/admin/activity-logs?${query.toString()}`);
}

export function rollbackActivityLog(id) {
  return post(`/admin/activity-logs/${id}/rollback`);
}

// ============================================
// STRIPE / PAGOS
// ============================================
export function createPaymentIntent(data) {
  return post('/payments/create-intent', data);
}

export function getStripeConfig() {
  return get('/payments/config');
}
