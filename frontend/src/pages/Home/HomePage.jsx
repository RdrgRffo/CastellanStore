import { Link } from 'react-router-dom';
import { useFeaturedProducts } from '../../hooks/useProducts';
import { useCategoryImages } from '../../hooks/useCategoryImages';
import ProductCard from '../../components/ui/ProductCard';
import ScrollReveal from '../../components/ui/ScrollReveal';
import HeroSection from '../../components/layout/HeroSection';
import { getImageUrl } from '../../services/apiClient';

export default function HomePage() {
  const { products: featured, loading } = useFeaturedProducts();
  const { categories: categoryList, loading: catLoading } = useCategoryImages();

  return (
    <main>
      <HeroSection
        size="lg"
        title="Castellan Store"
        image="https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=1600"
        gradient={false}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-premium-black/80 to-transparent z-10" />
        <div className="absolute inset-0 z-20 flex items-center">
          <div className="container-premium">
            <div className="max-w-xl animate-fade-in">
              <p className="text-cuero-400 text-sm uppercase tracking-[0.3em] mb-4">
                Nueva Colección 2026
              </p>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-semibold uppercase tracking-wider text-white leading-tight">

                La Precisión<br />
                <span className="text-cuero-400">del Tiempo</span>
              </h1>
              <p className="text-premium-gray text-sm md:text-base mt-4 max-w-md leading-relaxed">
                Relojería clásica de precisión suiza. Cada pieza es una obra maestra de artesanía y tradición.
              </p>
              <div className="flex gap-4 mt-6">
                <Link
                  to="/shop"
                  className="inline-block bg-cuero-500 text-white px-8 py-3 text-sm font-medium tracking-wider uppercase
                             hover:bg-cuero-600 transition-all duration-300"
                >
                  Explorar Colección
                </Link>
                <Link
                  to="/shop?category=piezas-coleccion"
                  className="inline-block border-2 border-white text-white px-8 py-3 text-sm font-medium tracking-wider uppercase
                             hover:bg-white hover:text-premium-black transition-all duration-300"
                >
                  Piezas de Colección
                </Link>
              </div>

            </div>
          </div>
        </div>
      </HeroSection>

      {/* Featured Products */}
      <section className="py-12 md:py-16">
        <div className="container-premium">
          <ScrollReveal>
            <div className="text-center mb-8 md:mb-10">
              <h2 className="section-title">Destacados</h2>
              <p className="section-subtitle mt-2">Las piezas más exclusivas de nuestra colección</p>
            </div>
          </ScrollReveal>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="bg-premium-gray-light aspect-square mb-4" />
                  <div className="h-4 bg-premium-gray-light w-1/3 mb-2" />
                  <div className="h-4 bg-premium-gray-light w-2/3 mb-2" />
                  <div className="h-4 bg-premium-gray-light w-1/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((product) => (
                <ScrollReveal key={product.id}>
                  <ProductCard product={product} />
                </ScrollReveal>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/shop"
              className="btn-secondary inline-block"
            >
              Ver Todos los Relojes
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24 bg-premium-gray-light">
        <div className="container-premium">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="section-title">Categorías</h2>
              <p className="section-subtitle mt-2">Explora por tipo de reloj</p>
            </div>
          </ScrollReveal>

          {catLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse aspect-square bg-premium-gray" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {categoryList.map((cat) => (
                <ScrollReveal key={cat.slug}>
                  <Link
                    to={`/shop?category=${cat.slug}`}
                    className="group relative block aspect-square overflow-hidden bg-premium-black"
                  >
                    <img
                      src={getImageUrl(cat.img)}
                      alt={cat.name}
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/600x600/1A1A1A/FFFFFF?text=' + encodeURIComponent(cat.name);
                      }}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-lg md:text-xl font-display uppercase tracking-wider">
                        {cat.name}
                      </span>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 md:py-24 bg-premium-black">
        <div className="container-premium">
          <ScrollReveal>
            <div className="max-w-xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-display font-semibold uppercase tracking-wider text-white">
                Mantente al Día
              </h2>
              <p className="text-premium-gray text-sm mt-2 mb-8 leading-relaxed">
                Suscríbete para recibir novedades, lanzamientos exclusivos y ofertas especiales.
              </p>
              <form className="flex gap-2 max-w-md mx-auto" onSubmit={e => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Tu email"
                  className="flex-1 bg-white/10 border border-premium-gray/30 text-white placeholder-premium-gray px-4 py-3 text-sm focus:outline-none focus:border-cuero-500 transition-colors"
                />
                <button
                  type="submit"
                  className="whitespace-nowrap bg-cuero-500 text-white px-8 py-3 text-xs font-medium tracking-wider uppercase
                             hover:bg-cuero-600 transition-all duration-300"
                >
                  Suscribirse
                </button>
              </form>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </main>
  );
}
