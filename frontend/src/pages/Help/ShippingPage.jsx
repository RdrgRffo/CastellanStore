import { Link } from 'react-router-dom';
import Breadcrumb from '../../components/layout/Breadcrumb';
import ScrollReveal from '../../components/ui/ScrollReveal';
import HeroSection from '../../components/layout/HeroSection';
import HelpPageCTA from '../../components/ui/HelpPageCTA';

export default function ShippingPage() {
  return (
    <main>
      <HeroSection
        size="sm"
        title="Envíos y Devoluciones"
        image="https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=1600"
      />

      <div className="container-premium">
        <Breadcrumb items={[{ label: 'Ayuda' }, { label: 'Envíos y devoluciones' }]} />

        <div className="max-w-3xl mx-auto">
          {/* Envíos */}
          <ScrollReveal>
            <section className="mb-16">
              <h2 className="section-title mb-8">Envíos</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card-base text-center">
                  <svg className="w-10 h-10 text-cuero-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="text-sm font-medium uppercase tracking-wider mb-2">España Peninsular</h3>
                  <p className="text-sm text-premium-gray-dark">24-48 horas laborables</p>
                  <p className="text-xs text-premium-gray-dark mt-1">Envío gratis en pedidos +1.000 €</p>
                </div>
                <div className="card-base text-center">
                  <svg className="w-10 h-10 text-cuero-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-sm font-medium uppercase tracking-wider mb-2">Baleares y Canarias</h3>
                  <p className="text-sm text-premium-gray-dark">48-72 horas laborables</p>
                  <p className="text-xs text-premium-gray-dark mt-1">Envío gratis en pedidos +1.000 €</p>
                </div>
                <div className="card-base text-center">
                  <svg className="w-10 h-10 text-cuero-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <h3 className="text-sm font-medium uppercase tracking-wider mb-2">Internacional</h3>
                  <p className="text-sm text-premium-gray-dark">5-10 días laborables</p>
                  <p className="text-xs text-premium-gray-dark mt-1">Consultar tarifas según destino</p>
                </div>
              </div>

              <div className="card-base bg-premium-gray-light">
                <h3 className="text-sm font-medium uppercase tracking-wider mb-3">Detalles del envío</h3>
                <ul className="space-y-3 text-sm text-premium-gray-dark">
                  <li className="flex gap-3">
                    <span className="text-cuero-500 font-medium">•</span>
                    <span>Todos los pedidos se envían con seguro y número de seguimiento.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-cuero-500 font-medium">•</span>
                    <span>Recibirás un email de confirmación con el código de seguimiento una vez enviado.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-cuero-500 font-medium">•</span>
                    <span>Los pedidos se procesan en un plazo de 24 horas laborables tras la confirmación del pago.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-cuero-500 font-medium">•</span>
                    <span>El embalaje es neutro y discreto para garantizar la privacidad y seguridad del contenido.</span>
                  </li>
                </ul>
              </div>
            </section>
          </ScrollReveal>

          {/* Devoluciones */}
          <ScrollReveal>
            <section className="mb-16">
              <h2 className="section-title mb-8">Devoluciones</h2>
              <div className="space-y-6">
                <div className="card-base">
                  <h3 className="text-sm font-medium uppercase tracking-wider mb-3">Plazo de devolución</h3>
                  <p className="text-sm text-premium-gray-dark leading-relaxed">
                    Dispones de <strong className="text-premium-black">30 días naturales</strong> desde la recepción del pedido para
                    solicitar una devolución. El reloj debe estar en perfecto estado, sin usar y con todos sus accesorios originales.
                  </p>
                </div>
                <div className="card-base">
                  <h3 className="text-sm font-medium uppercase tracking-wider mb-3">Proceso de devolución</h3>
                  <ol className="space-y-3 text-sm text-premium-gray-dark list-decimal list-inside">
                    <li>Contacta con nosotros a través del <Link to="/contacto" className="text-cuero-500 hover:underline">formulario de contacto</Link> indicando el número de pedido.</li>
                    <li>Te enviaremos una etiqueta de devolución prepagada por email.</li>
                    <li>Empaqueta el reloj de forma segura en su embalaje original.</li>
                    <li>Entrega el paquete en la oficina de Correos indicada.</li>
                    <li>Una vez recibido y verificado, procesaremos el reembolso en un plazo de 5-7 días laborables.</li>
                  </ol>
                </div>
                <div className="card-base border-l-4 border-danger-500 bg-danger-50">
                  <h3 className="text-sm font-medium uppercase tracking-wider mb-3 text-danger-700">Excepciones</h3>
                  <p className="text-sm text-danger-600 leading-relaxed">
                    Los artículos de edición limitada y los personalizados no admiten devolución salvo defecto de fabricación.
                    Los gastos de envío de ida no son reembolsables.
                  </p>
                </div>
              </div>
            </section>
          </ScrollReveal>

          <HelpPageCTA />
        </div>
      </div>
    </main>
  );
}
