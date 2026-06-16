import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchProduct } from '../../services/api';
import { getImageUrl } from '../../services/apiClient';
import Breadcrumb from '../../components/layout/Breadcrumb';
import PriceTag from '../../components/ui/PriceTag';
import Badge from '../../components/ui/Badge';
import specLabels from '../../utils/specLabels';

// Especificaciones a comparar (ordenadas)
const COMPARE_KEYS = [
  'brand',
  'price',
  'strapMaterial',
  'strapColor',
  'dialColor',
  'caseMaterial',
  'movement',
  'stock',
  'category',
];

const categoryLabels = {
  'clasicos-vestir': 'Clásicos de Vestir',
  'cronografos': 'Cronógrafos',
  'automaticos': 'Automáticos',
  'piezas-coleccion': 'Piezas de Colección',
};

const LABEL_MAP = {
  brand: 'Marca',
  price: 'Precio',
  stock: 'Stock',
  category: 'Categoría',
};

function getLabel(key) {
  return LABEL_MAP[key] || specLabels[key] || key;
}

function formatValue(key, value, product) {
  if (key === 'price') {
    return (
      <div className="flex items-center justify-center gap-2">
        <PriceTag price={product.price} originalPrice={product.oldPrice} size="small" />
      </div>
    );
  }
  if (key === 'category') {
    return categoryLabels[value] || value || '—';
  }
  if (key === 'stock') {
    return value > 0 ? `✔ ${value} uds.` : '✗ Agotado';
  }
  return value || '—';
}

export default function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Leer IDs de la URL
  const ids = searchParams.getAll('id');

  useEffect(() => {
    if (ids.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProducts([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all(ids.map(id => fetchProduct(id).catch(() => null)))
      .then(results => {
        if (!cancelled) {
          const valid = results.filter(Boolean);
          if (valid.length === 0) {
            setError('No se encontraron productos para comparar.');
          }
          setProducts(valid);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Error al cargar productos.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const removeProduct = (id) => {
    const remaining = ids.filter(i => i !== id);
    if (remaining.length === 0) {
      setSearchParams({});
    } else {
      setSearchParams(remaining.map(i => ['id', i]));
    }
  };

  if (loading) {
    return (
      <div className="container-premium py-12">
        <div className="animate-pulse">
          <div className="h-6 bg-premium-gray-light w-1/4 mb-8" />
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-premium-gray-light aspect-square" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || products.length === 0) {
    return (
      <div className="container-premium py-20 text-center">
        <h2 className="section-title mb-4">
          {error || 'No hay productos para comparar'}
        </h2>
        <p className="text-sm text-premium-gray-dark mb-6">
          Añade productos desde la ficha de producto usando el botón &ldquo;Comparar&rdquo;.
        </p>
        <Link to="/shop" className="btn-secondary inline-block">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <main>
      <div className="container-premium pb-16">
        <Breadcrumb items={[
          { label: 'Colección', path: '/shop' },
          { label: 'Comparar productos' }
        ]} />

        <h1 className="section-title mb-8">Comparar Productos</h1>

        {/* Tabla comparativa con <table> semántica */}
        <div className="overflow-x-auto pb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {/* Celda de esquina superior izquierda */}
                <th className="sticky left-0 z-10 bg-white text-left pb-4 pr-4">
                  <span className="text-xs uppercase tracking-wider text-premium-gray-dark font-medium">
                    Especificación
                  </span>
                </th>

                {/* Tarjetas de producto en el encabezado */}
                {products.map(p => (
                  <th key={p.id} className="pb-4 px-3 text-center align-top min-w-[14rem] relative">
                    {/* Botón eliminar - sobre la imagen */}
                    <button
                      onClick={() => removeProduct(p.id)}
                      className="absolute top-2 right-2 w-8 h-8 bg-premium-black text-white text-xs
                                 hover:bg-red-600 transition-colors flex items-center justify-center
                                 rounded-full shadow-md z-20"
                      title="Eliminar"
                    >
                      ✕
                    </button>
                    <Link to={`/product/${p.id}`}>
                      <div className="aspect-square bg-premium-gray-light overflow-hidden mb-3 mx-auto"
                           style={{ maxWidth: '200px' }}>
                        <img
                          src={getImageUrl(p.image || (p.gallery && p.gallery[0]) || '')}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>
                    <Link
                      to={`/product/${p.id}`}
                      className="text-sm font-medium text-premium-black hover:text-cuero-500 transition-colors block leading-tight mt-2"
                    >
                      {p.name}
                    </Link>
                    {p.tag && (
                      <div className="mt-1">
                        <Badge variant={
                          p.tag === 'Oferta' ? 'sale' :
                          p.tag === 'Bestseller' ? 'cuero' :
                          p.tag === 'Limited' || p.tag === 'Premium' ? 'cuero' : 'default'
                        }>
                          {p.tag}
                        </Badge>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {COMPARE_KEYS.map((key, idx) => (
                <tr key={key} className={idx % 2 === 0 ? 'bg-premium-gray-light/50' : ''}>
                  {/* Label de especificación (sticky) */}
                  <td className="sticky left-0 z-10 text-xs uppercase tracking-wider text-cuero-500 font-medium py-3 pr-4"
                      style={{ backgroundColor: 'inherit' }}>
                    {getLabel(key)}
                  </td>

                  {/* Valores para cada producto */}
                  {products.map(p => (
                    <td key={p.id} className={`py-3 px-3 text-center text-sm ${
                      key === 'price' ? '' : 'text-premium-gray-dark'
                    }`}>
                      {formatValue(key, p[key], p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Botón para añadir más productos */}
        <div className="mt-10 text-center">
          <Link to="/shop" className="btn-secondary inline-block">
            + Añadir más productos
          </Link>
        </div>
      </div>
    </main>
  );
}
