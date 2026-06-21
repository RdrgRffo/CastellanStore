import { Link } from 'react-router-dom';
import Breadcrumb from '../../components/layout/Breadcrumb';
import ScrollReveal from '../../components/ui/ScrollReveal';
import HeroSection from '../../components/layout/HeroSection';

export default function AboutPage() {
  return (
    <main>
      <HeroSection
        size="md"
        title="Sobre Nosotros"
        subtitle="La historia de una familia dedicada a la relojería artesanal desde 1972."
        image="https://images.unsplash.com/photo-1585123334904-845d60e97b29?w=1600"
      />

      <div className="container-premium">
        <Breadcrumb items={[{ label: 'Sobre nosotros' }]} />

        {/* Historia */}
        <ScrollReveal>
          <section className="max-w-4xl mx-auto mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="section-title mb-6">Nuestra Historia</h2>
                <div className="space-y-4 text-sm text-premium-gray-dark leading-relaxed">
                  <p>
                    <strong className="text-premium-black">Castellan</strong> nace en un pequeño taller del barrio de
                    Salamanca en Madrid, donde Don Antonio Castellan comenzó a reparar relojes de cuerda en 1972.
                    Lo que empezó como un oficio aprendido de su padre se convirtió en una pasión por la precisión
                    y la belleza de la relojería clásica.
                  </p>
                  <p>
                    Durante más de cinco décadas, hemos perfeccionado el arte de la relojería artesanal,
                    combinando técnicas tradicionales con materiales de la más alta calidad. Cada pieza que
                    sale de nuestro taller es el resultado de horas de minucioso trabajo, donde cada engranaje,
                    cada aguja y cada detalle cuenta una historia.
                  </p>
                  <p>
                    Hoy, la tercera generación de la familia Castellan continúa con la tradición,
                    seleccionando personalmente cada movimiento, diseñando cada esfera y probando cada
                    reloj antes de que llegue a tus manos.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-cuero-500/20 z-10" />
                <img
                  src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800"
                  alt="Taller de relojería"
                  loading="lazy"
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute -bottom-6 -left-6 bg-cuero-500 text-white p-6 hidden md:block z-20">
                  <span className="text-3xl font-display">50+</span>
                  <p className="text-xs uppercase tracking-wider mt-1">Años de experiencia</p>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Valores */}
        <ScrollReveal>
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="section-title">Nuestros Valores</h2>
              <p className="section-subtitle mt-2">Lo que nos define como artesanos</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="card-base text-center">
                <svg className="w-12 h-12 text-cuero-500 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <h3 className="text-sm font-medium uppercase tracking-wider mb-3">Artesanía</h3>
                <p className="text-sm text-premium-gray-dark">
                  Cada reloj es ensamblado a mano por nuestros maestros relojeros, siguiendo técnicas
                  transmitidas de generación en generación.
                </p>
              </div>
              <div className="card-base text-center">
                <svg className="w-12 h-12 text-cuero-500 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="text-sm font-medium uppercase tracking-wider mb-3">Garantía</h3>
                <p className="text-sm text-premium-gray-dark">
                  Todos nuestros relojes cuentan con 2 años de garantía. Respaldamos cada pieza con
                  nuestro compromiso de calidad.
                </p>
              </div>
              <div className="card-base text-center">
                <svg className="w-12 h-12 text-cuero-500 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-sm font-medium uppercase tracking-wider mb-3">Atemporalidad</h3>
                <p className="text-sm text-premium-gray-dark">
                  Diseñamos relojes que trascienden modas. Piezas clásicas que se convierten en
                  heredadas, para toda la vida.
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Taller */}
        <ScrollReveal>
          <section className="mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              <div className="relative order-2 md:order-1">
                <div className="absolute inset-0 bg-cuero-500/20 z-10" />
                <img
                  src="https://images.pexels.com/photos/29268609/pexels-photo-29268609.jpeg?w=800"
                  alt="Nuestro taller"
                  loading="lazy"
                  className="w-full h-[400px] object-cover"
                />
              </div>
              <div className="order-1 md:order-2">
                <h2 className="section-title mb-6">Nuestro Taller</h2>
                <p className="text-sm text-premium-gray-dark leading-relaxed mb-4">
                  En el corazón de Madrid, nuestro taller es un espacio donde el tiempo parece
                  detenerse. Entre bancos de trabajo centenarios, lupas de aumento y diminutos
                  engranajes, nuestros relojeros dan vida a cada pieza.
                </p>
                <p className="text-sm text-premium-gray-dark leading-relaxed mb-6">
                  Utilizamos movimientos suizos y alemanes de la más alta calidad, que sometemos
                  a rigurosas pruebas de precisión antes de incorporarlos a nuestros diseños.
                  Cada reloj pasa por un control de calidad de 72 horas antes de recibir el
                  sello de aprobación de Castellan.
                </p>
                <Link to="/shop" className="btn-primary inline-block">
                  Descubrir Colección
                </Link>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* CTA */}
        <section className="bg-premium-black text-white py-16 mb-20 text-center border-t border-white/10">
          <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <h2 className="text-2xl md:text-3xl font-display uppercase tracking-wider mb-4">
                ¿Hablamos?
              </h2>
              <p className="text-sm text-premium-gray mb-8">
                Si tienes alguna pregunta o simplemente quieres saber más sobre nuestro trabajo,
                estaremos encantados de escucharte.
              </p>
              <Link to="/contacto" className="inline-block bg-white text-premium-black px-8 py-3 text-sm font-medium tracking-wider uppercase hover:bg-cuero-500 hover:text-white transition-all duration-300">
                Contactar
              </Link>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </main>
  );
}
