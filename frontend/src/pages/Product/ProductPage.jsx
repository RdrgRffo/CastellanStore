import { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProduct, useRelatedProducts } from '../../hooks/useProducts';
import { useReviews } from '../../hooks/useReviews';
import { useWishlist } from '../../hooks/useWishlist';
import { useCart } from '../../hooks/useCart';
import Breadcrumb from '../../components/layout/Breadcrumb';

import PriceTag from '../../components/ui/PriceTag';
import Badge from '../../components/ui/Badge';
import ScrollReveal from '../../components/ui/ScrollReveal';
import specLabels from '../../utils/specLabels';
import { getImageUrl } from '../../services/apiClient';


export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { product, loading } = useProduct(id);
  const { relatedProducts: suggested } = useRelatedProducts(id, 4);
  const { reviews, averageRating, totalReviews, loading: reviewsLoading, addReview, removeReview } = useReviews(id);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [selectedImage, setSelectedImage] = useState(0);
  // Estado optimista para el corazón en la página de producto
  const [optimisticWishlist, setOptimisticWishlist] = useState(null);
  const togglingRef = useRef(false);
  const inWishlist = optimisticWishlist !== null ? optimisticWishlist : isInWishlist(id);

  const handleToggleWishlist = async () => {
    if (togglingRef.current) return;
    togglingRef.current = true;
    const newState = !inWishlist;
    setOptimisticWishlist(newState);
    try {
      await toggleWishlist(id);
      setOptimisticWishlist(null);
    } catch {
      setOptimisticWishlist(null);
    } finally {
      togglingRef.current = false;
    }
  };

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [addedToCart, setAddedToCart] = useState(false);

  // Estado para el formulario de reseña
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isLoggedIn = !!localStorage.getItem('token');

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError(null);
    setReviewSubmitting(true);
    try {
      await addReview({
        watchId: id,
        rating: reviewRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
      });
      setReviewSuccess(true);
      setShowReviewForm(false);
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err) {
      setReviewError(err.message || 'Error al enviar la reseña');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('¿Eliminar esta reseña?')) return;
    try {
      await removeReview(reviewId);
    } catch {
      // ignore
    }
  };


  const handleCompare = () => {
    const compareIds = JSON.parse(sessionStorage.getItem('compareIds') || '[]');
    if (!compareIds.includes(id)) {
      compareIds.push(id);
    }
    sessionStorage.setItem('compareIds', JSON.stringify(compareIds));
    navigate(`/compare?id=${compareIds.join('&id=')}`);
  };

  if (loading) {
    return (
      <div className="container-premium py-12">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-premium-gray-light aspect-square" />
          <div>
            <div className="h-6 bg-premium-gray-light w-1/4 mb-4" />
            <div className="h-8 bg-premium-gray-light w-3/4 mb-4" />
            <div className="h-6 bg-premium-gray-light w-1/3 mb-6" />
            <div className="h-20 bg-premium-gray-light mb-6" />
            <div className="h-12 bg-premium-gray-light w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-premium py-20 text-center">
        <h2 className="section-title mb-4">Producto no encontrado</h2>
        <Link to="/shop" className="btn-secondary inline-block">Volver a la tienda</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    const maxStock = product.stock || 0;
    const qty = Math.min(quantity, maxStock);
    if (qty <= 0) return;
    addToCart(product, qty);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // Construir array de imágenes desde image + gallery (máximo 3)
  const allImages = [product.image, ...(product.gallery || [])].filter(Boolean).slice(0, 3);

  // Mapeo de tag a variante de Badge
  const badgeVariant = product.tag === 'Oferta' ? 'sale' :
    product.tag === 'Bestseller' ? 'cuero' :
    product.tag === 'Limited' || product.tag === 'Premium' ? 'cuero' : 'default';

  // Detalles del reloj para mostrar (etiquetas traducidas desde specLabels)
  const specKeys = ['strapMaterial', 'strapColor', 'dialColor', 'caseMaterial', 'movement'];
  const watchDetails = specKeys
    .map(key => ({ label: specLabels[key], value: product[key] }))
    .filter(d => d.value);

  return (
    <main>
      <div className="container-premium">
        <Breadcrumb items={[
          { label: 'Colección', path: '/shop' },
          { label: product.name }
        ]} />

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr] gap-8 md:gap-12 mb-16">
          {/* Gallery */}
          <div className="md:max-w-md">
            <div className="relative aspect-square bg-premium-gray-light overflow-hidden mb-4 shadow-[3px_3px_12px_rgba(0,0,0,0.06)]">
              <img
                src={getImageUrl(allImages[selectedImage])}
                alt={product.name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              {product.tag && (
                <div className="absolute top-4 left-4">
                  <Badge variant={badgeVariant}>{product.tag}</Badge>
                </div>
              )}
              {product.discount > 0 && (
                <div className="absolute top-4 right-4">
                  <Badge variant="sale">-{product.discount}%</Badge>
                </div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 md:w-20 md:h-20 bg-premium-gray-light overflow-hidden border-2 transition-colors flex-shrink-0 shadow-[2px_2px_8px_rgba(0,0,0,0.05)]
                      ${i === selectedImage ? 'border-cuero-500' : 'border-transparent'}`}
                  >
                    <img src={getImageUrl(img)} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

          </div>

          {/* Info */}
          <div className="flex flex-col">
            <p className="text-xs text-premium-gray-dark uppercase tracking-wider mb-2">{product.brand}</p>
            <h1 className="text-2xl md:text-3xl font-display uppercase tracking-wider text-premium-black mb-4">
              {product.name}
            </h1>

            <div className="mb-6">
              <PriceTag price={product.price} originalPrice={product.oldPrice} size="large" />
              {product.discount > 0 && (
                <p className="text-xs text-green-600 mt-1">Ahorras {product.discount}%</p>
              )}
            </div>

            <p className="text-sm text-premium-gray-dark leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Detalles del reloj — tabla editorial */}
            <div className="mb-8">
              <h3 className="text-xs uppercase tracking-wider text-premium-black mb-3">Detalles</h3>
              <div className="divide-y divide-premium-gray">
                {watchDetails.map((d, i) => (
                  <div key={i} className="flex items-baseline justify-between py-2.5">
                    <span className="text-xs text-cuero-500 uppercase tracking-wider">{d.label}</span>
                    <span className="text-sm text-premium-gray-dark">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>


            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center border border-premium-gray">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 text-sm hover:bg-premium-gray-light transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-3 text-sm min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock || 0, quantity + 1))}
                  disabled={quantity >= (product.stock || 0)}
                  className="px-4 py-3 text-sm hover:bg-premium-gray-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className={`flex-1 py-3 text-sm font-medium tracking-wider uppercase transition-all duration-300
                  shadow-md hover:shadow-lg active:scale-[0.98]
                  ${addedToCart
                    ? 'bg-green-600 text-white'
                    : 'btn-primary'
                  }`}
              >
                {addedToCart ? '✓ Añadido' : 'Añadir al Carrito'}
              </button>


            </div>

            <p className="text-xs text-premium-gray-dark">
              {product.stock > 0 ? `✔ En stock (${product.stock} uds.)` : '✗ Agotado'}
            </p>

            {/* Botón Comparar */}
            <button
              onClick={handleCompare}
              className="mt-4 w-full py-2.5 text-xs font-medium tracking-wider uppercase transition-all duration-300
                         bg-premium-black text-white hover:bg-cuero-500 shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              ⚖ Comparar
            </button>

            {/* Botón Lista de Deseos */}
            {isLoggedIn && (
              <button
                onClick={handleToggleWishlist}
                className={`mt-2 w-full py-2.5 text-xs font-medium tracking-wider uppercase transition-all duration-300
                           shadow-md hover:shadow-lg active:scale-[0.98]
                           ${inWishlist
                             ? 'bg-cuero-500 text-white hover:bg-cuero-600'
                             : 'bg-premium-black text-white hover:bg-cuero-500'
                           }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {inWishlist ? 'En Favoritos' : 'Añadir a Favoritos'}
                </span>
              </button>
            )}
          </div>

        </div>

        {/* Tabs: Description / Details / Reviews */}
        <div className="mb-16">
          <div className="flex border-b border-premium-gray mb-8">
            {['description', 'details', 'reviews'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-xs uppercase tracking-wider transition-colors border-b-2 -mb-[1px]
                  ${activeTab === tab
                    ? 'border-premium-black text-premium-black'
                    : 'border-transparent text-premium-gray-dark hover:text-premium-black'
                  }`}
              >
                {tab === 'description' ? 'Descripción' : tab === 'details' ? 'Características' : `Reseñas (${totalReviews})`}
              </button>
            ))}
          </div>

          {activeTab === 'description' ? (
            <ScrollReveal>
              <div className="max-w-3xl">
                <p className="text-sm text-premium-gray-dark leading-relaxed">{product.description}</p>
              </div>
            </ScrollReveal>
          ) : activeTab === 'details' ? (
            <ScrollReveal>
              <div className="max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {watchDetails.map((d, i) => (
                    <div key={i} className="border border-premium-gray p-4">
                      <p className="text-xs text-premium-gray-dark uppercase tracking-wider mb-1">{d.label}</p>
                      <p className="text-sm font-medium text-premium-black">{d.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ) : (
            /* === SECCIÓN DE RESEÑAS === */
            <ScrollReveal>
              <div className="max-w-4xl">
                {/* Cabecera con valoración media */}
                {totalReviews > 0 && (
                  <div className="flex items-center gap-4 mb-8 p-6 bg-premium-gray-light/50 border border-premium-gray">
                    <div className="text-center">
                      <span className="text-4xl font-display text-premium-black">{averageRating.toFixed(1)}</span>
                      <div className="flex items-center justify-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star} className={`text-sm ${star <= Math.round(averageRating) ? 'text-amber-400' : 'text-premium-gray'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-premium-gray-dark mt-1">{totalReviews} reseña{totalReviews !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )}

                {/* Botón para escribir reseña */}
                {isLoggedIn && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="mb-8 btn-primary text-xs"
                  >
                    Escribir una reseña
                  </button>
                )}

                {/* Mensaje de éxito */}
                {reviewSuccess && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-sm">
                    ✓ Reseña publicada correctamente
                  </div>
                )}

                {/* Formulario de reseña */}
                {showReviewForm && (
                  <form onSubmit={handleSubmitReview} className="mb-8 p-6 border border-premium-gray bg-white">
                    <h3 className="text-sm font-medium text-premium-black uppercase tracking-wider mb-4">Tu reseña</h3>

                    {/* Estrellas */}
                    <div className="mb-4">
                      <label className="block text-xs text-premium-gray-dark uppercase tracking-wider mb-2">Puntuación</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className={`text-2xl transition-colors ${star <= reviewRating ? 'text-amber-400' : 'text-premium-gray hover:text-amber-300'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Título */}
                    <div className="mb-4">
                      <label className="block text-xs text-premium-gray-dark uppercase tracking-wider mb-2">Título</label>
                      <input
                        type="text"
                        value={reviewTitle}
                        onChange={e => setReviewTitle(e.target.value)}
                        placeholder="Resumen de tu experiencia"
                        maxLength={100}
                        className="w-full border border-premium-gray px-4 py-2.5 text-sm text-premium-black
                                   focus:outline-none focus:border-premium-black transition-colors"
                        required
                      />
                    </div>

                    {/* Comentario */}
                    <div className="mb-4">
                      <label className="block text-xs text-premium-gray-dark uppercase tracking-wider mb-2">Comentario</label>
                      <textarea
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        placeholder="Comparte tu opinión sobre este producto..."
                        rows={4}
                        maxLength={500}
                        className="w-full border border-premium-gray px-4 py-2.5 text-sm text-premium-black
                                   focus:outline-none focus:border-premium-black transition-colors resize-y"
                        required
                      />
                    </div>

                    {/* Error */}
                    {reviewError && (
                      <p className="text-xs text-red-600 mb-4">{reviewError}</p>
                    )}

                    {/* Acciones */}
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="btn-primary text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {reviewSubmitting ? 'Publicando...' : 'Publicar reseña'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowReviewForm(false); setReviewError(null); }}
                        className="btn-secondary text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}

                {/* Lista de reseñas */}
                {reviewsLoading ? (
                  <div className="animate-pulse space-y-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="border border-premium-gray p-6">
                        <div className="h-4 bg-premium-gray-light w-1/4 mb-3" />
                        <div className="h-3 bg-premium-gray-light w-1/3 mb-3" />
                        <div className="h-3 bg-premium-gray-light w-full mb-2" />
                        <div className="h-3 bg-premium-gray-light w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-12 border border-premium-gray">
                    <p className="text-sm text-premium-gray-dark mb-2">Este producto aún no tiene reseñas</p>
                    {isLoggedIn ? (
                      <p className="text-xs text-premium-gray-dark">Sé el primero en opinar</p>
                    ) : (
                      <Link to="/auth?mode=login" className="text-xs text-cuero-500 hover:underline">
                        Inicia sesión para escribir una reseña
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map(review => (
                      <div key={review.id || review._id} className="border border-premium-gray p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-premium-black">{review.userName || 'Usuario'}</span>
                              {review.verified && (
                                <span className="text-[10px] text-green-600 border border-green-200 bg-green-50 px-1.5 py-0.5 uppercase tracking-wider">
                                  Compra verificada
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <span key={star} className={`text-xs ${star <= review.rating ? 'text-amber-400' : 'text-premium-gray'}`}>
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                          {/* Botón eliminar (solo si es el dueño) */}
                          {user && (user.id === review.userId || user._id === review.userId) && (
                            <button
                              onClick={() => handleDeleteReview(review.id || review._id)}
                              className="text-xs text-premium-gray-dark hover:text-red-500 transition-colors"
                              title="Eliminar reseña"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        {review.title && (
                          <h4 className="text-sm font-medium text-premium-black mb-1">{review.title}</h4>
                        )}
                        {review.comment && (
                          <p className="text-sm text-premium-gray-dark leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollReveal>
          )}
        </div>


        {/* Productos Sugeridos */}
        {suggested.length > 0 && (
          <section className="mb-16">
            <ScrollReveal>
              <h2 className="section-title mb-8">Productos Sugeridos</h2>
            </ScrollReveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {suggested.map(p => (
                <ScrollReveal key={p.id}>
                  <div className="group card-hover shadow-[3px_3px_10px_rgba(0,0,0,0.06)]">

                    <Link to={`/product/${p.id}`} className="block">
                      <div className="relative overflow-hidden bg-premium-gray-light aspect-square">
                        <img
                          src={getImageUrl(p.image || (p.gallery && p.gallery[0]) || '')}
                          alt={p.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    </Link>
                    <div className="pt-3 pb-1.5 px-2">
                      <Link to={`/product/${p.id}`}>
                        <h3 className="text-xs font-medium text-premium-black hover:text-cuero-500 transition-colors leading-tight">
                          {p.name}
                        </h3>
                      </Link>
                      <div className="mt-1">
                        <PriceTag price={p.price} originalPrice={p.oldPrice} size="small" />
                      </div>
                    </div>
                    <Link
                      to={`/product/${p.id}`}
                      className="block w-full py-2 text-xs font-medium tracking-wider uppercase text-center btn-primary"
                    >
                      Ver Producto
                    </Link>



                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
