import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { applyCoupon } from '../../services/couponService';
import { formatPrice } from '../../utils/formatPrice';
import { getImageUrl } from '../../services/apiClient';
import Breadcrumb from '../../components/layout/Breadcrumb';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, total, count, clearCart, couponCode, setCouponCode, couponResult, setCouponResult, discount } = useCart();
  const [applying, setApplying] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplying(true);
    const result = await applyCoupon(couponCode.trim(), total, cart);
    setCouponResult(result);
    setApplying(false);
  };
  const shipping = total > 0 ? (total >= 1000 ? 0 : 25) : 0;
  const finalTotal = total - discount + shipping;

  if (cart.length === 0) {
    return (
      <main>
        <div className="container-premium">
          <Breadcrumb items={[{ label: 'Carrito' }]} />
          <div className="text-center py-20">
            <svg className="w-20 h-20 text-premium-gray mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h2 className="section-title mb-4">Tu Carrito está Vacío</h2>
            <p className="section-subtitle mb-8">Explora nuestra colección y encuentra el reloj perfecto.</p>
            <Link to="/shop" className="btn-primary inline-block">Explorar Colección</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="container-premium">
        <Breadcrumb items={[{ label: 'Carrito' }]} />

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Cart Items */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h1 className="section-title">Carrito ({count})</h1>
              <button
                onClick={clearCart}
                className="text-xs text-premium-gray-dark hover:text-red-500 uppercase tracking-wider transition-colors"
              >
                Vaciar Carrito
              </button>
            </div>

            <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-premium-gray text-xs uppercase tracking-wider text-premium-gray-dark">
              <div className="col-span-6">Producto</div>
              <div className="col-span-2 text-center">Precio</div>
              <div className="col-span-2 text-center">Cantidad</div>
              <div className="col-span-2 text-right">Subtotal</div>
            </div>

            <ul className="divide-y divide-premium-gray">
              {cart.map(item => (
                <li key={item.id} className="py-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Product */}
                    <div className="md:col-span-6 flex gap-4">
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        loading="lazy"
                        className="w-20 h-20 md:w-24 md:h-24 object-cover bg-premium-gray-light"
                      />
                      <div>
                        <h3 className="text-sm font-medium text-premium-black">{item.name}</h3>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-xs text-premium-gray-dark hover:text-red-500 transition-colors mt-2"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="md:col-span-2 text-center">
                      <span className="text-sm">{formatPrice(item.price)}</span>
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-2 flex justify-center">
                      <div className="flex items-center border border-premium-gray">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1.5 text-xs hover:bg-premium-gray-light transition-colors"
                        >
                          -
                        </button>
                        <span className="px-3 py-1.5 text-xs min-w-[2.5rem] text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1.5 text-xs hover:bg-premium-gray-light transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="md:col-span-2 text-right">
                      <span className="text-sm">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Order Summary */}
          <div className="lg:w-96">
            <div className="border border-premium-gray p-6 sticky top-24">
              <h2 className="text-sm uppercase tracking-wider font-medium mb-6">Resumen del Pedido</h2>

              {/* Coupon */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Código de cupón"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="input-premium text-xs flex-1"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={applying}
                    className="px-4 py-3 bg-premium-black text-white text-xs font-medium tracking-wider uppercase
                               hover:bg-cuero-500 transition-colors disabled:opacity-50"
                  >
                    {applying ? '...' : 'Aplicar'}
                  </button>
                </div>
                {couponResult && (
                  <p className={`text-xs mt-2 ${couponResult.valid ? 'text-green-600' : 'text-red-500'}`}>
                    {couponResult.message}
                  </p>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-premium-gray-dark">Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-premium-gray-dark">Envío</span>
                  <span className="font-display">
                    {shipping === 0 ? 'Gratis' : formatPrice(shipping)}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-premium-gray-dark">Envío gratis en pedidos desde {formatPrice(1000)}</p>
                )}
                <div className="border-t border-premium-gray pt-3 flex justify-between font-medium">
                  <span>Total</span>
                  <span className="text-lg">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <Link
                to="/checkout"
                className="block w-full mt-6 btn-primary text-center"
              >
                Proceder al Pago
              </Link>

              <Link
                to="/shop"
                className="block w-full mt-3 py-3 text-center text-xs text-premium-gray-dark hover:text-premium-black uppercase tracking-wider transition-colors"
              >
                Seguir Comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
