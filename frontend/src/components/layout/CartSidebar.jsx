import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { formatPrice } from '../../utils/formatPrice';
import { getImageUrl } from '../../services/apiClient';

export default function CartSidebar() {
  const { cart, isOpen, setIsOpen, removeFromCart, updateQuantity, total, count } = useCart();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-premium-gray">
            <h2 className="text-lg font-display uppercase tracking-wider">
              Carrito ({count})
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-premium-gray-dark hover:text-premium-black transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <svg className="w-16 h-16 text-premium-gray mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-premium-gray-dark mb-2">Tu carrito está vacío</p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-cuero-500 hover:text-cuero-600 underline"
                >
                  Seguir comprando
                </button>
              </div>
            ) : (
              <ul className="space-y-4">
                {cart.map(item => (
                  <li key={item.id} className="flex gap-4 pb-4 border-b border-premium-gray">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      loading="lazy"
                      className="w-20 h-20 object-cover bg-premium-gray-light"
                    />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-premium-black">{item.name}</h3>
                      <p className="text-sm text-premium-black mt-1">
                        {formatPrice(item.price)}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border border-premium-gray">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-1 text-xs hover:bg-premium-gray-light"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 text-xs">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-1 text-xs hover:bg-premium-gray-light"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-xs text-premium-gray-dark hover:text-red-500 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="border-t border-premium-gray p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm uppercase tracking-wider">Total</span>
                <span className="text-lg">{formatPrice(total)}</span>
              </div>
              <Link
                to="/cart"
                onClick={() => setIsOpen(false)}
                className="block w-full py-3 bg-premium-black text-white text-center text-sm font-medium tracking-wider uppercase
                           hover:bg-cuero-500 transition-colors"
              >
                Ver Carrito
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
