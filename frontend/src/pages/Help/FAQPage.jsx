import { useState } from 'react';
import Breadcrumb from '../../components/layout/Breadcrumb';
import ScrollReveal from '../../components/ui/ScrollReveal';
import HeroSection from '../../components/layout/HeroSection';
import HelpPageCTA from '../../components/ui/HelpPageCTA';

const faqs = [
  {
    category: 'Pedidos',
    questions: [
      { q: '¿Cómo puedo realizar un pedido?', a: 'Simplemente navega por nuestra colección, añade los productos que te gusten al carrito y sigue el proceso de checkout. No es necesario registrarse para comprar.' },
      { q: '¿Puedo modificar o cancelar mi pedido?', a: 'Puedes modificar o cancelar tu pedido siempre que no haya sido procesado aún. Contacta con nosotros lo antes posible a través del formulario de contacto.' },
      { q: '¿Qué métodos de pago aceptáis?', a: 'Aceptamos tarjetas de crédito/débito (Visa, Mastercard, American Express) y transferencia bancaria. Todos los pagos son procesados de forma segura.' },
    ],
  },
  {
    category: 'Envíos',
    questions: [
      { q: '¿Cuánto tarda en llegar mi pedido?', a: 'Para España peninsular, 24-48 horas laborables. Para Baleares y Canarias, 48-72 horas. Para envíos internacionales, de 5 a 10 días laborables.' },
      { q: '¿El envío es gratuito?', a: 'Sí, para pedidos superiores a 1.000 €. Para pedidos inferiores, el coste de envío es de 25 € para España peninsular.' },
      { q: '¿Puedo hacer seguimiento de mi pedido?', a: 'Sí, una vez enviado tu pedido recibirás un email con el número de seguimiento para que puedas consultar el estado en todo momento.' },
    ],
  },
  {
    category: 'Producto',
    questions: [
      { q: '¿Los relojes son originales?', a: 'Todos nuestros relojes son piezas originales de Castellan, fabricadas artesanalmente con materiales de la más alta calidad.' },
      { q: '¿Cómo cuido mi reloj?', a: 'Recomendamos evitar el contacto con agua, productos químicos y campos magnéticos fuertes. Limpia la correa con un paño suave y seco. Para una limpieza más profunda, acude a nuestro taller.' },
      { q: '¿Tienen servicio de ajuste de correa?', a: 'Sí, ofrecemos ajuste gratuito de correa en nuestro taller de Madrid. También puedes hacerlo tú mismo siguiendo las instrucciones que incluye cada reloj.' },
    ],
  },
  {
    category: 'Garantía',
    questions: [
      { q: '¿Cuánto dura la garantía?', a: 'Todos nuestros relojes tienen una garantía de 2 años contra defectos de fabricación. Cubre el movimiento, la esfera, las agujas y el cristal.' },
      { q: '¿Qué no cubre la garantía?', a: 'La garantía no cubre el desgaste natural de la correa, daños por golpes o caídas, exposición al agua en modelos no sumergibles, ni manipulaciones por terceros no autorizados.' },
      { q: '¿Cómo activo la garantía?', a: 'La garantía se activa automáticamente con tu compra. Te recomendamos conservar la factura o el comprobante de compra para cualquier gestión futura.' },
    ],
  },
];

function AccordionItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="card-base !p-0 overflow-hidden">
      <button
        className="w-full flex justify-between items-center p-5 text-left hover:bg-premium-gray-light/50 transition-colors"
        onClick={onToggle}
      >
        <span className="text-sm font-medium text-premium-black pr-4">{question}</span>
        <svg
          className={`w-4 h-4 text-premium-gray-dark flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <p className="px-5 pb-5 text-sm text-premium-gray-dark leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <main>
      <HeroSection
        size="sm"
        title="Preguntas Frecuentes"
        image="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600"
      />

      <div className="container-premium">
        <Breadcrumb items={[{ label: 'Ayuda' }, { label: 'FAQ' }]} />

        <div className="max-w-3xl mx-auto">
          {faqs.map((category, catIndex) => (
            <ScrollReveal key={category.category}>
              <section className="mb-12">
                <h2 className="section-title mb-6">{category.category}</h2>
                <div className="space-y-1">
                  {category.questions.map((faq, qIndex) => {
                    const globalIndex = faqs
                      .slice(0, catIndex)
                      .reduce((acc, cat) => acc + cat.questions.length, 0) + qIndex;
                    return (
                      <AccordionItem
                        key={qIndex}
                        question={faq.q}
                        answer={faq.a}
                        isOpen={openIndex === globalIndex}
                        onToggle={() => toggleFaq(globalIndex)}
                      />
                    );
                  })}
                </div>
              </section>
            </ScrollReveal>
          ))}

          <HelpPageCTA text="¿No encuentras lo que buscas?" />
        </div>
      </div>
    </main>
  );
}
