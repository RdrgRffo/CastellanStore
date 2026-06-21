import { useState, useMemo } from 'react';
import Breadcrumb from '../../components/layout/Breadcrumb';
import ScrollReveal from '../../components/ui/ScrollReveal';
import HeroSection from '../../components/layout/HeroSection';
import { FormValidator, Validator } from '../../utils/FormValidator';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const validator = useMemo(() => new FormValidator()
    .field('name', [
      Validator.required('El nombre es obligatorio'),
    ])
    .field('email', [
      Validator.required('El email es obligatorio'),
      Validator.email('Introduce un email válido'),
    ])
    .field('subject', [
      Validator.required('Selecciona un asunto'),
    ])
    .field('message', [
      Validator.required('El mensaje no puede estar vacío'),
      Validator.minLength(10, 'El mensaje debe tener al menos 10 caracteres'),
    ])
  , []);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    validator.validateField(field, value, { ...form, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validator.validateAll(form)) return;
    // Simulación de envío
    setSent(true);
    setForm({ name: '', email: '', subject: '', message: '' });
    validator.reset();
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <main>
      <HeroSection
        size="sm"
        title="Contacto"
        image="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600"
      />

      <div className="container-premium">
        <Breadcrumb items={[{ label: 'Ayuda' }, { label: 'Contacto' }]} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto mb-16">

          {/* Formulario */}
          <ScrollReveal>
            <section>
              <h2 className="section-title mb-6">Envíanos un mensaje</h2>
              <p className="text-sm text-premium-gray-dark mb-8">
                Estaremos encantados de ayudarte. Responderemos en menos de 24 horas laborables.
              </p>

              {sent ? (
                <div className="bg-green-50 border border-green-200 p-6 text-center">
                  <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-sm font-medium text-green-700 uppercase tracking-wider mb-2">¡Mensaje enviado!</h3>
                  <p className="text-sm text-green-600">Te responderemos a la mayor brevedad posible.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Nombre *"
                        value={form.name}
                        onChange={e => handleChange('name', e.target.value)}
                        className={validator.inputClass('name')}
                      />
                      {validator.error('name') && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {validator.error('name')}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Email *"
                        value={form.email}
                        onChange={e => handleChange('email', e.target.value)}
                        className={validator.inputClass('email')}
                      />
                      {validator.error('email') && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {validator.error('email')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <select
                      value={form.subject}
                      onChange={e => handleChange('subject', e.target.value)}
                      className={validator.inputClass('subject')}
                    >
                      <option value="">Selecciona un asunto *</option>
                      <option value="consulta">Consulta general</option>
                      <option value="pedido">Información sobre mi pedido</option>
                      <option value="devolucion">Devolución</option>
                      <option value="garantia">Garantía</option>
                      <option value="reparacion">Reparación</option>
                      <option value="otro">Otro</option>
                    </select>
                    {validator.error('subject') && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {validator.error('subject')}
                      </p>
                    )}
                  </div>
                  <div>
                    <textarea
                      placeholder="Mensaje *"
                      rows={5}
                      value={form.message}
                      onChange={e => handleChange('message', e.target.value)}
                      className={`${validator.inputClass('message')} resize-none`}
                    />
                    {validator.error('message') && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {validator.error('message')}
                      </p>
                    )}
                  </div>
                  <button type="submit" className="btn-primary w-full">
                    Enviar Mensaje
                  </button>
                </form>
              )}
            </section>
          </ScrollReveal>

          {/* Información de contacto */}
          <ScrollReveal>
            <section>
              <h2 className="section-title mb-6">Información de Contacto</h2>

              <div className="space-y-6">
                <div className="flex gap-4 items-start border border-premium-gray p-6">
                  <svg className="w-6 h-6 text-cuero-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium uppercase tracking-wider mb-1">Email</h3>
                    <p className="text-sm text-premium-gray-dark">hola@castellanstore.com</p>
                    <p className="text-xs text-premium-gray-dark mt-1">Respondemos en menos de 24h</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start border border-premium-gray p-6">
                  <svg className="w-6 h-6 text-cuero-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium uppercase tracking-wider mb-1">Teléfono</h3>
                    <p className="text-sm text-premium-gray-dark">+34 91 123 45 67</p>
                    <p className="text-xs text-premium-gray-dark mt-1">Lun–Vie, 10:00–14:00 y 16:00–19:00</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start border border-premium-gray p-6">
                  <svg className="w-6 h-6 text-cuero-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium uppercase tracking-wider mb-1">Dirección</h3>
                    <p className="text-sm text-premium-gray-dark">Calle del Relojero, 12</p>
                    <p className="text-sm text-premium-gray-dark">28001 Madrid, España</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start border border-premium-gray p-6">
                  <svg className="w-6 h-6 text-cuero-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium uppercase tracking-wider mb-1">Horario</h3>
                    <p className="text-sm text-premium-gray-dark">Lunes a viernes: 10:00 – 14:00 / 16:00 – 19:00</p>
                    <p className="text-sm text-premium-gray-dark">Sábados: 10:00 – 14:00</p>
                    <p className="text-sm text-premium-gray-dark">Domingos: Cerrado</p>
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>
        </div>
      </div>
    </main>
  );
}
