import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-premium-black text-white">

      <div className="container-premium py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-display uppercase tracking-normal mb-4">Castellan</h3>
            <p className="text-sm text-premium-gray-dark leading-relaxed">
              Relojería clásica de precisión. Cada pieza cuenta una historia de artesanía y tradición.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs uppercase tracking-wider mb-4 text-premium-gray">Explorar</h4>
            <ul className="space-y-2">
              <li><Link to="/shop" className="text-sm text-premium-gray-dark hover:text-white transition-colors">Colección</Link></li>
              <li><Link to="/shop?category=cronografos" className="text-sm text-premium-gray-dark hover:text-white transition-colors">Cronógrafos</Link></li>
              <li><Link to="/shop?category=automaticos" className="text-sm text-premium-gray-dark hover:text-white transition-colors">Automáticos</Link></li>
              <li><Link to="/shop?category=edicion-limitada" className="text-sm text-premium-gray-dark hover:text-white transition-colors">Edición Limitada</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-xs uppercase tracking-wider mb-4 text-premium-gray">La Marca</h4>
            <ul className="space-y-2">
              <li><Link to="/sobre-nosotros" className="text-sm text-premium-gray-dark hover:text-white transition-colors">Sobre Nosotros</Link></li>
              <li><Link to="/contacto" className="text-sm text-premium-gray-dark hover:text-white transition-colors">Contacto</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs uppercase tracking-wider mb-4 text-premium-gray">Ayuda</h4>
            <ul className="space-y-2">
              <li><Link to="/envios" className="text-sm text-premium-gray-dark hover:text-white transition-colors">Envíos y devoluciones</Link></li>
              <li><Link to="/garantia" className="text-sm text-premium-gray-dark hover:text-white transition-colors">Garantía</Link></li>
              <li><Link to="/preguntas-frecuentes" className="text-sm text-premium-gray-dark hover:text-white transition-colors">Preguntas frecuentes</Link></li>
              <li><Link to="/contacto" className="text-sm text-premium-gray-dark hover:text-white transition-colors">Contacto</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs uppercase tracking-wider mb-4 text-premium-gray">Contacto</h4>
            <ul className="space-y-2">
              <li className="text-sm text-premium-gray-dark break-words">hola@castellanstore.com</li>
              <li className="text-sm text-premium-gray-dark">+34 91 123 45 67</li>
              <li className="text-sm text-premium-gray-dark">Madrid, España</li>
            </ul>
          </div>
        </div>


        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-premium-gray-dark">
            &copy; {new Date().getFullYear()} Castellan Store. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <span className="text-xs text-premium-gray-dark hover:text-white transition-colors cursor-pointer">Instagram</span>
            <span className="text-xs text-premium-gray-dark hover:text-white transition-colors cursor-pointer">Facebook</span>
            <span className="text-xs text-premium-gray-dark hover:text-white transition-colors cursor-pointer">Twitter</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
