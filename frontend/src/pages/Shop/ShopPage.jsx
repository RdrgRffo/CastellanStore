import { useCallback, useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import ProductCard from '../../components/ui/ProductCard';
import ScrollReveal from '../../components/ui/ScrollReveal';

const CATEGORIES = [
  { value: '', label: 'Todas' },
  { value: 'clasicos-vestir', label: 'Clásicos' },
  { value: 'cronografos', label: 'Cronógrafos' },
  { value: 'automaticos', label: 'Automáticos' },
  { value: 'piezas-coleccion', label: 'Colección' },
];

const SORT_OPTIONS = [
  { value: 'default', label: 'Relevancia' },
  { value: 'price-asc', label: 'Precio: Menor a Mayor' },
  { value: 'price-desc', label: 'Precio: Mayor a Menor' },
  { value: 'name', label: 'Nombre A-Z' },
];

const TAGS = [
  { value: '', label: 'Todos' },
  { value: 'Bestseller', label: 'Bestseller' },
  { value: 'Premium', label: 'Premium' },
  { value: 'Limited', label: 'Edición Limitada' },
];

const PAGE_SIZES = [12, 24, 48];

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Leer TODOS los filtros desde la URL
  const search = searchParams.get('search') || '';
  const activeCategory = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const tag = searchParams.get('tag') || '';
  const sortBy = searchParams.get('sortBy') || 'default';
  const page = Number(searchParams.get('page')) || 0;
  const size = Number(searchParams.get('size')) || 12;

  // Estado local para inputs de precio (con debounce)
  const [minPriceInput, setMinPriceInput] = useState(minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice);
  const minPriceTimer = useRef(null);
  const maxPriceTimer = useRef(null);

  // Sincronizar estado local cuando cambian los searchParams externamente
  useEffect(() => {
    if (minPrice !== minPriceInput && !minPriceTimer.current) {
      setMinPriceInput(minPrice);
    }
  }, [minPrice, minPriceInput]);
  useEffect(() => {
    if (maxPrice !== maxPriceInput && !maxPriceTimer.current) {
      setMaxPriceInput(maxPrice);
    }
  }, [maxPrice, maxPriceInput]);

  // Actualizar un filtro en la URL (resetea page a 0 si no es page)
  const setFilter = useCallback((key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value === '' || value === 'default' || value === undefined || value === null) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      // Si el filtro no es 'page', reseteamos page a 0
      if (key !== 'page') {
        next.delete('page');
      }
      return next;
    });
  }, [setSearchParams]);

  // Handlers con debounce para inputs de precio
  const handleMinPriceChange = useCallback((e) => {
    const value = e.target.value;
    setMinPriceInput(value);
    if (minPriceTimer.current) clearTimeout(minPriceTimer.current);
    minPriceTimer.current = setTimeout(() => {
      minPriceTimer.current = null;
      setFilter('minPrice', value);
    }, 500);
  }, [setFilter]);

  const handleMaxPriceChange = useCallback((e) => {
    const value = e.target.value;
    setMaxPriceInput(value);
    if (maxPriceTimer.current) clearTimeout(maxPriceTimer.current);
    maxPriceTimer.current = setTimeout(() => {
      maxPriceTimer.current = null;
      setFilter('maxPrice', value);
    }, 500);
  }, [setFilter]);

  // Limpiar todos los filtros
  const clearFilters = useCallback(() => {
    setMinPriceInput('');
    setMaxPriceInput('');
    setSearchParams({});
  }, [setSearchParams]);

  // Construir query params para la API
  const queryParams = {
    search: search || undefined,
    category: activeCategory || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    tag: tag || undefined,
    sortBy: sortBy !== 'default' ? sortBy : undefined,
    page,
    size,
  };

  const { products, loading, totalItems, totalPages } = useProducts(queryParams);

  const categoryLabel = CATEGORIES.find(c => c.value === activeCategory)?.label || 'Colección';

  // Determinar si hay filtros activos (para mostrar "Limpiar filtros")
  const hasActiveFilters = search || activeCategory || minPrice || maxPrice || tag || sortBy !== 'default' || page > 0;

  return (
    <main>
      <div className="container-premium pt-8 md:pt-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="section-title">{categoryLabel}</h1>
            <p className="section-subtitle mt-1">
              {totalItems} {totalItems === 1 ? 'reloj' : 'relojes'} encontrados
            </p>
          </div>
        </div>

        {/* ============================================ */}
        {/* BARRA DE FILTROS */}
        {/* ============================================ */}
        <div className="bg-white border border-gray-200 p-4 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 items-end">

            {/* Búsqueda por texto */}
            <div className="xl:col-span-2">
              <label className="block text-[10px] uppercase tracking-wider text-premium-gray-dark mb-1">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Nombre, marca..."
                value={search}
                onChange={(e) => setFilter('search', e.target.value)}
                className="input-premium text-xs w-full"
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-premium-gray-dark mb-1">
                Categoría
              </label>
              <select
                value={activeCategory}
                onChange={(e) => setFilter('category', e.target.value)}
                className="input-premium text-xs uppercase tracking-wider w-full"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Tag */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-premium-gray-dark mb-1">
                Etiqueta
              </label>
              <select
                value={tag}
                onChange={(e) => setFilter('tag', e.target.value)}
                className="input-premium text-xs uppercase tracking-wider w-full"
              >
                {TAGS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Precio mínimo */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-premium-gray-dark mb-1">
                Precio mín.
              </label>
              <input
                type="number"
                min="0"
                placeholder="0 €"
                value={minPriceInput}
                onChange={handleMinPriceChange}
                className="input-premium text-xs w-full"
              />
            </div>

            {/* Precio máximo */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-premium-gray-dark mb-1">
                Precio máx.
              </label>
              <input
                type="number"
                min="0"
                placeholder="9999 €"
                value={maxPriceInput}
                onChange={handleMaxPriceChange}
                className="input-premium text-xs w-full"
              />
            </div>

            {/* Ordenar */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-premium-gray-dark mb-1">
                Ordenar
              </label>
              <select
                value={sortBy}
                onChange={(e) => setFilter('sortBy', e.target.value)}
                className="input-premium text-xs uppercase tracking-wider w-full"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Botón limpiar filtros */}
          {hasActiveFilters && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-[10px] uppercase tracking-wider text-cuero-500 hover:text-cuero-600 transition-colors"
              >
                ✕ Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* ============================================ */}
        {/* RESULTADOS */}
        {/* ============================================ */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: size > 12 ? 12 : size }, (_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-premium-gray-light aspect-square mb-4" />
                <div className="h-4 bg-premium-gray-light w-1/3 mb-2" />
                <div className="h-4 bg-premium-gray-light w-2/3 mb-2" />
                <div className="h-4 bg-premium-gray-light w-1/4" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-premium-gray-dark mb-4">No se encontraron relojes con esos filtros.</p>
            <button
              onClick={clearFilters}
              className="btn-secondary"
            >
              Ver Todos
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(product => (
                <ScrollReveal key={product._id || product.id}>
                  <ProductCard product={product} />
                </ScrollReveal>
              ))}
            </div>

            {/* Paginación: solo si hay más de 1 página */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-3 mt-10 mb-8">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setFilter('page', String(page - 1))}
                    disabled={page === 0}
                    className="btn-secondary text-xs disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setFilter('page', String(i))}
                      className={`w-8 h-8 text-xs rounded ${
                        page === i
                          ? 'bg-cuero-500 text-white'
                          : 'bg-white border border-gray-200 text-premium-gray-dark hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setFilter('page', String(page + 1))}
                    disabled={page >= totalPages - 1}
                    className="btn-secondary text-xs disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
                <p className="text-[10px] text-premium-gray-dark uppercase tracking-wider">
                  Página {page + 1} de {totalPages}
                </p>
              </div>
            )}
            {/* Selector de tamaño de página SIEMPRE visible */}
            <div className="flex items-center justify-center gap-2 mt-4 mb-8">
              <label className="text-[10px] uppercase tracking-wider text-premium-gray-dark">
                Ver
              </label>
              <select
                value={size}
                onChange={(e) => setFilter('size', e.target.value)}
                className="input-premium text-xs uppercase tracking-wider w-24"
              >
                {PAGE_SIZES.map(s => (
                  <option key={s} value={s}>{s} / pág</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
