import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchWishlist, addToWishlistAPI, removeFromWishlistAPI } from '../services/api';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));
  // Usar un contador de versión para forzar re-renders cuando cambie la wishlist
  const [version, setVersion] = useState(0);
  const wishlistIdsRef = useRef(wishlistIds);

  // Sincronizar ref con estado
  useEffect(() => {
    wishlistIdsRef.current = wishlistIds;
  }, [wishlistIds]);

  // Escuchar cambios de autenticación (login/logout)
  useEffect(() => {
    const checkToken = () => {
      const hasToken = !!localStorage.getItem('token');
      setLoggedIn(hasToken);
    };
    window.addEventListener('user-updated', checkToken);
    window.addEventListener('auth-changed', checkToken);
    const interval = setInterval(checkToken, 2000);
    return () => {
      window.removeEventListener('user-updated', checkToken);
      window.removeEventListener('auth-changed', checkToken);
      clearInterval(interval);
    };
  }, []);

  const loadWishlist = useCallback(async () => {
    const hasToken = !!localStorage.getItem('token');
    if (!hasToken) {
      setWishlist([]);
      setWishlistIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const data = await fetchWishlist();
      const items = data?.items || [];
      setWishlist(items);
      const ids = new Set(items.map(item => {
        return typeof item.watchId === 'object' && item.watchId !== null ? item.watchId._id : item.watchId;
      }));
      setWishlistIds(ids);
      // Incrementar versión para forzar re-render
      setVersion(v => v + 1);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar wishlist al montar y cuando cambie loggedIn
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadWishlist();
  }, [loggedIn, loadWishlist]);

  // Escuchar eventos de recarga
  useEffect(() => {
    const handleRefresh = () => loadWishlist();
    window.addEventListener('wishlist-refresh', handleRefresh);
    window.addEventListener('user-updated', handleRefresh);
    return () => {
      window.removeEventListener('wishlist-refresh', handleRefresh);
      window.removeEventListener('user-updated', handleRefresh);
    };
  }, [loadWishlist]);

  const addToWishlist = useCallback(async (watchId) => {
    if (!loggedIn) return;
    try {
      await addToWishlistAPI(watchId);
      // Actualización optimista inmediata
      setWishlistIds(prev => new Set([...prev, watchId]));
      setVersion(v => v + 1);
      // Recargar desde backend para tener datos completos
      await loadWishlist();
    } catch {
      loadWishlist();
    }
  }, [loggedIn, loadWishlist]);

  const removeFromWishlist = useCallback(async (watchId) => {
    if (!loggedIn) return;
    try {
      await removeFromWishlistAPI(watchId);
      // Actualización optimista inmediata
      setWishlistIds(prev => {
        const next = new Set(prev);
        next.delete(watchId);
        return next;
      });
      setWishlist(prev => prev.filter(item => {
        const itemId = typeof item.watchId === 'object' && item.watchId !== null ? item.watchId._id : item.watchId;
        return itemId !== watchId;
      }));
      setVersion(v => v + 1);
    } catch {
      loadWishlist();
    }
  }, [loggedIn, loadWishlist]);

  const toggleWishlist = useCallback(async (watchId) => {
    if (!loggedIn) return;
    const currentIds = wishlistIdsRef.current;
    if (currentIds.has(watchId)) {
      await removeFromWishlist(watchId);
    } else {
      await addToWishlist(watchId);
    }
  }, [loggedIn, addToWishlist, removeFromWishlist]);

  // isInWishlist ahora usa el ref para siempre tener el valor más actualizado
  // y depende de version para que React sepa que debe reevaluarse
  const isInWishlist = useCallback((watchId) => {
    return wishlistIdsRef.current.has(watchId);
  }, [version]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(() => ({
    wishlist,
    loading,
    wishlistIds,
    loadWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
  }), [wishlist, loading, wishlistIds, loadWishlist, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist debe usarse dentro de un WishlistProvider');
  }
  return ctx;
}


