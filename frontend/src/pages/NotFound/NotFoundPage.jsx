import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="flex-1 flex items-center justify-center">
      <div className="container-premium">
        <div className="max-w-lg mx-auto text-center py-16 md:py-24">
          <span className="block text-8xl md:text-9xl font-display text-premium-gray tracking-wider leading-none mb-4">
            404
          </span>
          <h1 className="text-xl md:text-2xl font-display uppercase tracking-wider text-premium-black mb-3">
            Página no encontrada
          </h1>
          <p className="text-sm text-premium-gray-dark leading-relaxed mb-8 max-w-sm mx-auto">
            La página que buscas no existe o ha sido movida.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="btn-primary text-xs">
              Volver al Inicio
            </Link>
            <Link to="/shop" className="btn-secondary text-xs">
              Ir a la Colección
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
