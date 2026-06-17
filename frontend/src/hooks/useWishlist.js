/**
 * Hook de wishlist — ahora usa WishlistContext para estado global compartido.
 * Los imports existentes (import { useWishlist } from '../../hooks/useWishlist')
 * siguen funcionando sin cambios.
 */
export { useWishlist } from '../context/WishlistContext';
