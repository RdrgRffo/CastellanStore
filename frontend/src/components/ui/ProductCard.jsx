import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import PriceTag from './PriceTag';
import Badge from './Badge';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { getImageUrl } from '../../services/apiClient';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isLoggedIn = !!localStorage.getItem('token');
  // Estado local optimista para el corazón: si es null, usa el valor del contexto
  const [optimisticWishlist, setOptimisticWishlist] = useState(null);
  // Ref para evitar múltiples clics rápidos
  const togglingRef = useRef(false);

  // Determinar si está en wishlist: prioriza el estado optimista, luego el contexto
  const inWishlist = optimisticWishlist !== null ? optimisticWishlist : isInWishlist(product._id);

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (togglingRef.current) return;
    togglingRef.current = true;

    const newState = !inWishlist;
    // Actualización optimista inmediata
    setOptimisticWishlist(newState);

    try {
      await toggleWishlist(product._id);
      // Después de la respuesta exitosa, sincronizar con el contexto
      // (el contexto ya debería tener el estado correcto)
      setOptimisticWishlist(null);
    } catch {
      // Si falla, revertir al estado del contexto
      setOptimisticWishlist(null);
    } finally {
      togglingRef.current = false;
    }
  };


  // Mapeo de tag a variante de Badge
  const badgeVariant = product.tag === 'Oferta' ? 'sale' :
    product.tag === 'Bestseller' ? 'cuero' :
    product.tag === 'Limited' || product.tag === 'Premium' ? 'cuero' :
    product.tag === 'New' ? 'default' : 'default';

  // Usar image como imagen principal, o gallery[0] si existe
  const mainImage = product.image || (product.gallery && product.gallery[0]) || '';

  return (
    <div className="group card-hover shadow-[4px_4px_12px_rgba(0,0,0,0.08)]">
      <Link to={`/product/${product._id}`} className="block">
        <div className="relative overflow-hidden bg-premium-gray-light aspect-square">

          <img
            src={getImageUrl(mainImage)}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {product.tag && (
            <div className="absolute top-3 left-3">
              <Badge variant={badgeVariant}>{product.tag}</Badge>
            </div>
          )}
          {product.discount > 0 && (
            <div className="absolute top-3 right-3">
              <Badge variant="sale">-{product.discount}%</Badge>
            </div>
          )}

          {/* Botón de lista de deseos */}
          {isLoggedIn && (
            <button
              onClick={handleToggleWishlist}
              className={`absolute bottom-3 right-3 w-9 h-9 flex items-center justify-center
                         rounded-full shadow-md transition-all duration-300
                         hover:scale-110 active:scale-95
                         ${inWishlist
                           ? 'bg-cuero-500 text-white'
                           : 'bg-white/90 text-premium-gray-dark hover:text-cuero-500'
                         }`}
              title={inWishlist ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
              <svg className="w-5 h-5" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}
        </div>
      </Link>


      <div className="px-3 pt-4 pb-3">
        <p className="text-xs text-premium-gray-dark uppercase tracking-wider mb-1">{product.brand}</p>
        <Link to={`/product/${product._id}`}>
          <h3 className="text-sm font-medium text-premium-black hover:text-cuero-500 transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2">
          <PriceTag price={product.price} originalPrice={product.oldPrice} size="small" />
        </div>
      </div>

      <div className="px-3 pb-3">
        <button
          onClick={() => {
            if ((product.stock || 0) <= 0) return;
            addToCart(product);
          }}
          disabled={(product.stock || 0) <= 0}
          className={`w-full py-2.5 text-xs font-medium tracking-wider uppercase
                     shadow-md hover:shadow-lg active:scale-[0.98]
                     transition-all duration-300
                     ${(product.stock || 0) <= 0
                       ? 'bg-premium-gray text-premium-gray-dark cursor-not-allowed'
                       : 'bg-premium-black text-white hover:bg-cuero-500'
                     }`}
        >
          {(product.stock || 0) <= 0 ? 'Agotado' : 'Añadir al Carrito'}
        </button>



      </div>
    </div>
  );
}
