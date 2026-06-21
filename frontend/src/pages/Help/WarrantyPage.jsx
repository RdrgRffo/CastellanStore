import { Link } from 'react-router-dom';
import Breadcrumb from '../../components/layout/Breadcrumb';
import ScrollReveal from '../../components/ui/ScrollReveal';
import HeroSection from '../../components/layout/HeroSection';
import HelpPageCTA from '../../components/ui/HelpPageCTA';

export default function WarrantyPage() {
  return (
    <main>
      <HeroSection
        size="sm"
        title="Garantía"
        image="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1600"
      />

      <div className="container-premium">
        <Breadcrumb items={[{ label: 'Ayuda' }, { label: 'Garantía' }]} />

        <div className="max-w-3xl mx-auto">

          {/* Cobertura */}
          <ScrollReveal>
            <section className="mb-16">
              <h2 className="section-title mb-8">Cobertura de Garantía</h2>
              <div className="bg-premium-black p-8 text-center mb-8">
                <span className="text-5xl font-display text-white">2</span>
                <span className="text-xl font-display text-white ml-2">años</span>
                <p className="text-sm text-premium-gray mt-2">de garantía en todos nuestros relojes</p>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-base border-l-4 border-success-500 bg-success-50">
                  <h3 className="text-sm font-medium uppercase tracking-wider text-success-700 mb-3">✓ Cubierto</h3>
                  <ul className="space-y-2 text-sm text-success-600">
                    <li>• Defectos de fabricación del movimiento</li>
                    <li>• Fallos en el mecanismo de cuerda</li>
                    <li>• Problemas de precisión (±20 seg/día)</li>
                    <li>• Defectos en la esfera o agujas</li>
                    <li>• Rotura del cristal por defecto de fábrica</li>
                  </ul>
                </div>
                <div className="card-base border-l-4 border-danger-500 bg-danger-50">
                  <h3 className="text-sm font-medium uppercase tracking-wider text-danger-700 mb-3">✗ No cubierto</h3>
                  <ul className="space-y-2 text-sm text-danger-600">
                    <li>• Desgaste natural de la correa</li>
                    <li>• Daños por golpes o caídas</li>
                    <li>• Exposición al agua (modelos no sumergibles)</li>
                    <li>• Manipulación por terceros no autorizados</li>
                    <li>• Desgaste normal del uso diario</li>
                  </ul>
                </div>
              </div>
            </section>
          </ScrollReveal>

          {/* Cómo activar */}
          <ScrollReveal>
            <section className="mb-16">
              <h2 className="section-title mb-8">Activar tu Garantía</h2>
              <div className="space-y-4">
                <div className="card-base flex gap-4 items-start">
                  <span className="w-8 h-8 bg-premium-black text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">1</span>
                  <div>
                    <h3 className="text-sm font-medium uppercase tracking-wider mb-1">Registra tu reloj</h3>
                    <p className="text-sm text-premium-gray-dark">Completa el formulario de registro con el número de serie y la fecha de compra.</p>
                  </div>
                </div>
                <div className="card-base flex gap-4 items-start">
                  <span className="w-8 h-8 bg-premium-black text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">2</span>
                  <div>
                    <h3 className="text-sm font-medium uppercase tracking-wider mb-1">Conserva tu factura</h3>
                    <p className="text-sm text-premium-gray-dark">Guarda el comprobante de compra. Será necesario para cualquier gestión de garantía.</p>
                  </div>
                </div>
                <div className="card-base flex gap-4 items-start">
                  <span className="w-8 h-8 bg-premium-black text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">3</span>
                  <div>
                    <h3 className="text-sm font-medium uppercase tracking-wider mb-1">Disfruta con tranquilidad</h3>
                    <p className="text-sm text-premium-gray-dark">Tu reloj está protegido. Si surge cualquier incidencia, estaremos aquí para ayudarte.</p>
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>

          {/* Proceso de reparación */}
          <ScrollReveal>
            <section className="mb-16">
              <h2 className="section-title mb-8">Proceso de Reparación</h2>
              <div className="card-base">
                <ol className="space-y-4 text-sm text-premium-gray-dark list-decimal list-inside">
                  <li><strong className="text-premium-black">Contacta con nosotros</strong> a través del <Link to="/contacto" className="text-cuero-500 hover:underline">formulario de contacto</Link> describiendo el problema.</li>
                  <li><strong className="text-premium-black">Evaluación gratuita</strong> — Te indicaremos si está cubierto por la garantía y los pasos a seguir.</li>
                  <li><strong className="text-premium-black">Envío del reloj</strong> — Te proporcionaremos una etiqueta de envío prepagada para que nos lo remitas.</li>
                  <li><strong className="text-premium-black">Reparación</strong> — Nuestros relojeros expertos realizarán la reparación en un plazo de 7-15 días laborables.</li>
                  <li><strong className="text-premium-black">Devolución</strong> — Te enviaremos el reloj reparado con seguimiento y seguro incluido.</li>
                </ol>
              </div>
            </section>
          </ScrollReveal>

          <HelpPageCTA text="¿Necesitas asistencia con tu garantía?" buttonText="Solicitar Asistencia" />
        </div>
      </div>
    </main>
  );
}
