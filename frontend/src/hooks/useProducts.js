import { useState, useEffect } from 'react';
import { fetchProducts, fetchProduct, fetchFeaturedProducts, fetchRelatedProducts } from '../services/api';

export function useProducts(params = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchProducts(params)
      .then(data => {
        if (!cancelled) {
          // Si el backend devuelve paginación { data, page, size, totalItems, totalPages }
          if (data && Array.isArray(data.data)) {
            setProducts(data.data);
            setTotalItems(data.totalItems || 0);
            setTotalPages(data.totalPages || 0);
          } else if (Array.isArray(data)) {
            // Fallback: respuesta plana (sin paginación)
            setProducts(data);
            setTotalItems(data.length);
            setTotalPages(1);
          } else {
            setProducts([]);
          }
        }
      })
      .catch(err => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  return { products, loading, error, totalItems, totalPages };
}

export function useProduct(id) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchProduct(id)
      .then(data => { if (!cancelled) setProduct(data); })
      .catch(err => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  return { product, loading, error };
}

export function useFeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchFeaturedProducts()
      .then(data => { if (!cancelled) setProducts(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { products, loading };
}

export function useRelatedProducts(id, limit = 4) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchRelatedProducts(id, limit)
      .then(data => {
        if (!cancelled) {
          if (Array.isArray(data)) {
            setProducts(data);
          } else if (data && Array.isArray(data.data)) {
            setProducts(data.data);
          } else {
            setProducts([]);
          }
        }
      })
      .catch(() => { if (!cancelled) setProducts([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, limit]);

  return { relatedProducts: products, loading };
}
