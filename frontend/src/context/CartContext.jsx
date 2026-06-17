import { createContext, useState, useCallback, useEffect, useContext } from 'react';
import {
  getCart,
  addToCart as addToCartLocal,
  removeFromCart as removeFromCartLocal,
  updateQuantity as updateQuantityLocal,
  clearCart as clearCartLocal,
  getCartTotal,
  getCartCount,
} from '../services/cartService';
import {
  fetchCart,
  addToCartAPI,
  syncCartAPI,
  updateCartItemAPI,
  removeFromCartAPI,
  clearCartAPI,
} from '../services/api';
import { AuthContext } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => getCart());
  const [isOpen, setIsOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const { user, token } = useContext(AuthContext);
  const isLoggedIn = !!user;

  // Sincronizar carrito entre pestañas (storage event)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'castellanstore_cart') {
        try {
          const newCart = e.newValue ? JSON.parse(e.newValue) : [];
          setCart(newCart);
        } catch {
          // Si hay error al parsear, ignorar
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sincronizar carrito local con backend al iniciar sesión
  useEffect(() => {
    if (isLoggedIn && token) {
      const localCart = getCart();
      if (localCart.length > 0) {
        // Si hay items locales, sincronizar con backend
        syncCartAPI(localCart.map(item => ({
          watchId: item.id,
          quantity: item.quantity,
        })))
          .then(() => fetchCart())
          .then(apiCart => {
            if (apiCart && apiCart.items) {
              const mapped = apiCart.items.map(item => ({
                id: item.watchId?._id || item.watchId,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity,
              }));
              setCart(mapped);
              // Limpiar carrito local después de sincronizar
              clearCartLocal();
            }
          })
          .catch(() => {
            // Si falla la API, mantener carrito local
          });
      } else {
        // Si no hay carrito local, cargar desde backend
        fetchCart()
          .then(apiCart => {
            if (apiCart && apiCart.items && apiCart.items.length > 0) {
              const mapped = apiCart.items.map(item => ({
                id: item.watchId?._id || item.watchId,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity,
              }));
              setCart(mapped);
            }
          })
          .catch(() => {
            // Si falla, mantener carrito local (vacío)
          });
      }
    }
  }, [isLoggedIn, token]);

  const addToCart = useCallback((product, quantity = 1) => {
    // Siempre actualizar local primero para respuesta inmediata
    const updatedCart = addToCartLocal(product, quantity);
    setCart(updatedCart);
    setIsOpen(true);

    // Si está logueado, sincronizar con backend
    if (isLoggedIn) {
      addToCartAPI(product.id, quantity).catch(() => {
        // Si falla, el carrito local ya se actualizó
      });
    }
  }, [isLoggedIn]);

  const removeFromCart = useCallback((productId) => {
    const updatedCart = removeFromCartLocal(productId);
    setCart(updatedCart);

    if (isLoggedIn) {
      removeFromCartAPI(productId).catch(() => {});
    }
  }, [isLoggedIn]);

  const updateQuantity = useCallback((productId, quantity) => {
    const updatedCart = updateQuantityLocal(productId, quantity);
    setCart(updatedCart);

    if (isLoggedIn) {
      updateCartItemAPI(productId, quantity).catch(() => {});
    }
  }, [isLoggedIn]);

  const clearCart = useCallback(() => {
    const updatedCart = clearCartLocal();
    setCart(updatedCart);

    if (isLoggedIn) {
      clearCartAPI().catch(() => {});
    }
  }, [isLoggedIn]);

  const total = getCartTotal(cart);
  const count = getCartCount(cart);

  const discount = couponResult?.valid ? couponResult.discount : 0;

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      total,
      count,
      isOpen,
      setIsOpen,
      couponCode,
      setCouponCode,
      couponResult,
      setCouponResult,
      discount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export { CartContext };
