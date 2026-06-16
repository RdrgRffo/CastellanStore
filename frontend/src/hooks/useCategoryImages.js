import { useState, useEffect } from 'react';
import { fetchProducts } from '../services/api';

const CATEGORIES = [
  { name: 'Clásicos', slug: 'clasicos-vestir' },
  { name: 'Cronógrafos', slug: 'cronografos' },
  { name: 'Automáticos', slug: 'automaticos' },
  { name: 'Colección', slug: 'piezas-coleccion' },
];

export function useCategoryImages() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const results = await Promise.all(
          CATEGORIES.map(async (cat) => {
            try {
              const data = await fetchProducts({ category: cat.slug, size: 1 });
              // La respuesta puede venir como { data: [...] } o como array plano
              const products = Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                  ? data.data
                  : [];
              const product = products[0];
              const img = product?.image || product?.gallery?.[0] || '';
              return { ...cat, img };
            } catch {
              return { ...cat, img: '' };
            }
          })
        );

        if (!cancelled) setCategories(results);
      } catch {
        if (!cancelled) setCategories(CATEGORIES.map(c => ({ ...c, img: '' })));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { categories, loading };
}
