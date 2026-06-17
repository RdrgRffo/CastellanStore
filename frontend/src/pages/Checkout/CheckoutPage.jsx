import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCart } from '../../hooks/useCart';
import { useCheckout, SHIPPING_METHODS } from '../../hooks/useCheckout';
import { applyCoupon } from '../../services/couponService';
import { formatPrice } from '../../utils/formatPrice';
import { getImageUrl } from '../../services/apiClient';
import { fetchAddresses, createPaymentIntent, getStripeConfig, createOrder, confirmStripeOrder } from '../../services/api';
import Breadcrumb from '../../components/layout/Breadcrumb';
import spanishCities, { getProvincias } from '../../data/spanishCities';
import { FormValidator, Validator } from '../../utils/FormValidator';
import { useAuth } from '../../hooks/useAuth';

// ============================================
// Stripe Checkout Form (inner component)
// ============================================
function StripeCheckoutForm({
  finalTotal,
  shippingInfo,
  shippingMethod,
  shipping,
  cart,
  total,
  discount,
  paymentInfo,
  setPaymentInfo,
  onSuccess,
  onError,
  onBack,
  isProcessing,
  setIsProcessing,
}) {
  const stripe = useStripe();
  const elements = useElements();

  const handleStripePayment = async () => {
    if (!stripe || !elements) return;
    setIsProcessing(true);

    try {
      // 1. Crear el pedido en BD primero (status: pending, porque usamos Stripe)
      const orderData = {
        items: cart.map(item => ({
          watchId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        subtotal: total,
        discount,
        shipping,
        shippingMethod,
        total: finalTotal,
        shippingInfo,
        paymentInfo: {
          cardName: paymentInfo.cardName,
        },
        useStripe: true, // El pedido nace en 'pending', Stripe webhook lo confirma
      };

      const order = await createOrder(orderData);

      // 2. Crear PaymentIntent en Stripe
      const intentResult = await createPaymentIntent({
        amount: finalTotal,
        currency: 'eur',
        orderId: order._id || order.id,
        orderNumber: order.orderNumber,
        customerEmail: shippingInfo.email,
        metadata: {
          orderNumber: order.orderNumber,
        },
      });

      const { clientSecret } = intentResult;

      // 3. Confirmar el pago con los datos de la tarjeta
      const cardElement = elements.getElement(CardElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: paymentInfo.cardName,
            email: shippingInfo.email,
          },
        },
      });

      if (error) {
        onError(error.message || 'Error al procesar el pago');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // 4. Confirmar el pedido en el backend (cambia de 'pending' a 'confirmed'
        //    y genera la factura, sin depender del webhook de Stripe)
        try {
          await confirmStripeOrder(order._id || order.id, paymentIntent.id);
        } catch (confirmErr) {
          console.warn('[Stripe] Error al confirmar pedido en backend:', confirmErr);
          // El pago se hizo, el webhook lo confirmará después si está configurado
        }
        onSuccess(order);
      } else {
        onError(`El pago no se completó. Estado: ${paymentIntent.status}`);
        setIsProcessing(false);
      }
    } catch (err) {
      onError(err.message || 'Error al procesar el pago');
      setIsProcessing(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-sm uppercase tracking-wider font-medium mb-6">Información de Pago</h2>

      {/* Card Name */}
      <div className="mb-4">
        <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">
          Nombre en la tarjeta *
        </label>
        <input
          type="text"
          placeholder="Nombre del titular"
          value={paymentInfo.cardName}
          onChange={e => setPaymentInfo(prev => ({ ...prev, cardName: e.target.value }))}
          className="input-premium w-full"
        />
      </div>

      {/* Stripe Card Element */}
      <div className="mb-4">
        <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">
          Datos de la tarjeta *
        </label>
        <div className="border border-premium-gray p-3 rounded-sm">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '14px',
                  color: '#1a1a1a',
                  '::placeholder': { color: '#9ca3af' },
                },
                invalid: { color: '#ef4444' },
              },
              hidePostalCode: true,
            }}
          />
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <button onClick={onBack} disabled={isProcessing} className="btn-secondary">
          Volver
        </button>
        <button
          onClick={handleStripePayment}
          disabled={!stripe || isProcessing}
          className="btn-cuero"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Procesando...
            </span>
          ) : (
            `Pagar ${formatPrice(finalTotal)}`
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================
// Main Checkout Page
// ============================================
export default function CheckoutPage() {
  const { cart, total, count, clearCart, couponCode, setCouponCode, couponResult, setCouponResult, discount } = useCart();
  const navigate = useNavigate();
  const {
    currentStep, steps,
    shippingInfo, setShippingInfo,
    shippingMethod, setShippingMethod,
    paymentInfo, setPaymentInfo,
    nextStep, prevStep, resetCheckout,
  } = useCheckout();

  const shippingValidator = useMemo(() => new FormValidator()
    .field('name', [Validator.required('El nombre es obligatorio')])
    .field('email', [
      Validator.required('El email es obligatorio'),
      Validator.email('Introduce un email válido'),
    ])
    .field('address', [Validator.required('La dirección es obligatoria')])
    .field('state', [Validator.required('Selecciona una provincia')])
    .field('city', [Validator.required('Selecciona una ciudad')])
    .field('zip', [Validator.required('El código postal es obligatorio')])
  , []);

  const [applying, setApplying] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const { user } = useAuth();
  // eslint-disable-next-line no-unused-vars
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [stripePromise, setStripePromise] = useState(null);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Cargar configuración de Stripe al montar
  useEffect(() => {
    async function loadStripeConfig() {
      try {
        const config = await getStripeConfig();
        if (config.publishableKey) {
          setStripePromise(loadStripe(config.publishableKey));
        }
        setStripeLoaded(true);
      } catch {
        setStripeLoaded(true);
      }
    }
    loadStripeConfig();
  }, []);

  // Cargar direcciones guardadas si el usuario está logueado
  useEffect(() => {
    if (user && !addressesLoaded) {
      fetchAddresses()
        .then(data => {
          setSavedAddresses(data || []);
          setAddressesLoaded(true);
          // Auto-rellenar con la dirección predeterminada
          const defaultAddr = (data || []).find(a => a.isDefault);
          if (defaultAddr) {
            setShippingInfo(prev => ({
              ...prev,
              name: defaultAddr.name,
              address: defaultAddr.address,
              city: defaultAddr.city,
              state: defaultAddr.state,
              zip: defaultAddr.zip,
              country: defaultAddr.country,
              phone: defaultAddr.phone || '',
            }));
          }
        })
        .catch(() => setAddressesLoaded(true));
    }
  }, [user, addressesLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShippingChange = (field, value) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
    shippingValidator.validateField(field, value, { ...shippingInfo, [field]: value });
  };

  // eslint-disable-next-line no-unused-vars
  const handleSelectAddress = (addr) => {
    setShippingInfo(prev => ({
      ...prev,
      name: addr.name,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      country: addr.country,
      phone: addr.phone || '',
    }));
    // Limpiar validaciones
    shippingValidator.validateField('name', addr.name, addr);
    shippingValidator.validateField('email', prev => prev.email, { ...shippingInfo, ...addr });
    shippingValidator.validateField('address', addr.address, addr);
    shippingValidator.validateField('state', addr.state, addr);
    shippingValidator.validateField('city', addr.city, addr);
    shippingValidator.validateField('zip', addr.zip, addr);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplying(true);
    const result = await applyCoupon(couponCode.trim(), total, cart);
    setCouponResult(result);
    setApplying(false);
  };
  const TAX_RATE = 0.21;
  const subtotalAfterDiscount = total - discount;
  const taxAmount = subtotalAfterDiscount * TAX_RATE;

  // Calcular coste de envío según método seleccionado
  const method = SHIPPING_METHODS[shippingMethod];
  const shipping = total > 0
    ? (method.freeFrom && total >= method.freeFrom ? 0 : method.cost)
    : 0;
  const finalTotal = subtotalAfterDiscount + taxAmount + shipping;

  const handlePaymentSuccess = (order) => {
    setOrderNumber(order.orderNumber);
    setOrderPlaced(true);
    clearCart();
  };

  const handlePaymentError = (message) => {
    setPaymentError(message);
  };

  const handleNewOrder = () => {
    resetCheckout();
    setOrderPlaced(false);
    setCouponResult(null);
    setCouponCode('');
    setPaymentError('');
    navigate('/shop');
  };

  // eslint-disable-next-line no-unused-vars
  const formatCardNumber = (value) => {
    const v = value.replace(/\s/g, '').replace(/\D/g, '').slice(0, 16);
    return v.replace(/(\d{4})/g, '$1 ').trim();
  };

  const ciudadesList = useMemo(() =>
    [...new Set(spanishCities.map(c => c.ciudad))].sort(),
  []);

  const provinciasList = useMemo(() => getProvincias(), []);

  const handleCityChange = (ciudad) => {
    const cityData = spanishCities.find(c => c.ciudad === ciudad);
    if (cityData) {
      setShippingInfo(prev => ({
        ...prev,
        city: ciudad,
        state: cityData.provincia,
        zip: cityData.codigoPostal,
      }));
    } else {
      setShippingInfo(prev => ({ ...prev, city: ciudad }));
    }
  };

  const ciudadesFiltradas = useMemo(() => {
    if (!shippingInfo.state) return ciudadesList;
    return spanishCities
      .filter(c => c.provincia === shippingInfo.state)
      .map(c => c.ciudad)
      .sort();
  }, [shippingInfo.state, ciudadesList]);

  const renderError = (msg) => msg ? (
    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {msg}
    </p>
  ) : null;

  if (cart.length === 0 && !orderPlaced) {
    return (
      <main>
        <div className="container-premium">
          <Breadcrumb items={[{ label: 'Checkout' }]} />
          <div className="text-center py-20">
            <svg className="w-20 h-20 text-premium-gray mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h2 className="section-title mb-4">Tu Carrito está Vacío</h2>
            <p className="section-subtitle mb-8">Añade productos antes de proceder al pago.</p>
            <Link to="/shop" className="btn-primary inline-block">Ir a la Tienda</Link>
          </div>
        </div>
      </main>
    );
  }

  if (orderPlaced) {
    return (
      <main>
        <div className="container-premium">
          <div className="max-w-lg mx-auto text-center py-20">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="section-title mb-4">¡Pedido Confirmado!</h2>
            <p className="text-premium-gray-dark mb-2">
              Gracias por tu compra. Recibirás un email de confirmación en breve.
            </p>
            <p className="text-sm text-premium-gray-dark mb-4">
              Número de pedido: <span className="font-medium text-premium-black">#{orderNumber}</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={() => {
                  const base = import.meta.env.VITE_API_URL || 'http://localhost:9100/api/v1';
                  window.open(`${base}/invoices/${orderNumber}/pdf`, '_blank');
                }}
                className="btn-primary text-sm"
              >
                Descargar Factura (PDF)
              </button>
            </div>
            <button onClick={handleNewOrder} className="btn-primary">
              Seguir Comprando
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="container-premium">
        <Breadcrumb items={[{ label: 'Checkout' }]} />

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          <div className="flex-1 pb-12">
            <h1 className="section-title mb-8">Checkout</h1>

            {/* Progress Steps */}
            <div className="flex items-center mb-10 overflow-x-auto">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center">
                  <div className={`flex items-center gap-2 ${i <= currentStep ? 'text-premium-black' : 'text-premium-gray-dark'}`}>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors
                      ${i < currentStep ? 'bg-cuero-500 border-cuero-500 text-white' :
                        i === currentStep ? 'border-cuero-500 text-cuero-500' :
                        'border-premium-gray text-premium-gray-dark'}`}>
                      {i < currentStep ? '✓' : i + 1}
                    </span>
                    <span className="text-xs uppercase tracking-wider hidden sm:block whitespace-nowrap">{step}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-8 md:w-16 h-px mx-2 ${i < currentStep ? 'bg-cuero-500' : 'bg-premium-gray'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 0: Cart Review */}
            {currentStep === 0 && (
              <div className="animate-fade-in">
                <h2 className="text-sm uppercase tracking-wider font-medium mb-4">Revisa tu pedido</h2>
                <ul className="divide-y divide-premium-gray">
                  {cart.map(item => (
                    <li key={item.id} className="py-4 flex gap-4">
                      <img src={getImageUrl(item.image)} alt={item.name} loading="lazy" className="w-16 h-16 object-cover bg-premium-gray-light" />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium">{item.name}</h3>
                        <p className="text-xs text-premium-gray-dark">Cantidad: {item.quantity}</p>
                      </div>
                      <span className="text-sm">{formatPrice(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => nextStep()} className="btn-primary mt-6">
                  Continuar con Envío
                </button>
              </div>
            )}

            {/* Step 1: Shipping */}
            {currentStep === 1 && (
              <div className="animate-fade-in">
                <h2 className="text-sm uppercase tracking-wider font-medium mb-6">Información de Envío</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Nombre completo *"
                      value={shippingInfo.name}
                      onChange={e => handleShippingChange('name', e.target.value)}
                      className={shippingValidator.inputClass('name')}
                    />
                    {renderError(shippingValidator.error('name'))}
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email *"
                      value={shippingInfo.email}
                      onChange={e => handleShippingChange('email', e.target.value)}
                      className={shippingValidator.inputClass('email')}
                    />
                    {renderError(shippingValidator.error('email'))}
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Teléfono"
                      value={shippingInfo.phone}
                      onChange={e => handleShippingChange('phone', e.target.value)}
                      className="input-premium"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Dirección *"
                      value={shippingInfo.address}
                      onChange={e => handleShippingChange('address', e.target.value)}
                      className={shippingValidator.inputClass('address')}
                    />
                    {renderError(shippingValidator.error('address'))}
                  </div>
                  <div>
                    <select
                      value={shippingInfo.state}
                      onChange={e => {
                        const provincia = e.target.value;
                        setShippingInfo(prev => ({ ...prev, state: provincia, city: '', zip: '' }));
                        shippingValidator.validateField('state', provincia, { ...shippingInfo, state: provincia });
                      }}
                      className={shippingValidator.inputClass('state', 'input-premium text-sm')}
                    >
                      <option value="">Selecciona provincia *</option>
                      {provinciasList.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    {renderError(shippingValidator.error('state'))}
                  </div>
                  <div>
                    <select
                      value={shippingInfo.city}
                      onChange={e => {
                        handleCityChange(e.target.value);
                        shippingValidator.validateField('city', e.target.value, { ...shippingInfo, city: e.target.value });
                      }}
                      className={shippingValidator.inputClass('city', 'input-premium text-sm')}
                      disabled={!shippingInfo.state}
                    >
                      <option value="">Selecciona ciudad *</option>
                      {ciudadesFiltradas.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {renderError(shippingValidator.error('city'))}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Código Postal *"
                      value={shippingInfo.zip}
                      readOnly
                      className={shippingValidator.inputClass('zip', 'input-premium text-sm bg-premium-gray-light')}
                    />
                    {renderError(shippingValidator.error('zip'))}
                  </div>
                  <div>
                    <select
                      value={shippingInfo.country}
                      onChange={e => setShippingInfo({...shippingInfo, country: e.target.value})}
                      className="input-premium"
                    >
                      <option value="España">España</option>
                      <option value="México">México</option>
                      <option value="Argentina">Argentina</option>
                      <option value="Colombia">Colombia</option>
                      <option value="Chile">Chile</option>
                      <option value="Perú">Perú</option>
                    </select>
                  </div>
                </div>

                {/* Selector de método de envío */}
                <div className="mt-8">
                  <h3 className="text-sm uppercase tracking-wider font-medium mb-4">Método de Envío</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Object.values(SHIPPING_METHODS).map(m => {
                      const isSelected = shippingMethod === m.id;
                      const costDisplay = m.cost === 0
                        ? 'Gratis'
                        : (m.freeFrom && total >= m.freeFrom ? 'Gratis' : formatPrice(m.cost));
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setShippingMethod(m.id)}
                          className={`text-left p-4 border-2 transition-all ${
                            isSelected
                              ? 'border-cuero-500 bg-cuero-50'
                              : 'border-premium-gray hover:border-premium-gray-dark'
                          }`}
                        >
                          <p className="text-sm font-medium">{m.label}</p>
                          <p className="text-xs text-premium-gray-dark mt-1">{m.description}</p>
                          <p className={`text-sm font-medium mt-2 ${isSelected ? 'text-cuero-600' : 'text-premium-black'}`}>
                            {costDisplay}
                          </p>
                          {m.freeFrom && total < m.freeFrom && (
                            <p className="text-[10px] text-premium-gray-dark mt-1">
                              Gratis desde {formatPrice(m.freeFrom)}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button onClick={prevStep} className="btn-secondary">Volver</button>
                  <button onClick={() => {
                    if (shippingValidator.validateAll(shippingInfo)) {
                      nextStep();
                    }
                  }} className="btn-primary">Continuar al Pago</button>
                </div>
              </div>
            )}

            {/* Step 2: Payment with Stripe */}
            {currentStep === 2 && (
              <div className="animate-fade-in min-h-[60vh]">
                {!stripeLoaded ? (
                  <div className="flex items-center justify-center py-12">
                    <svg className="animate-spin h-8 w-8 text-cuero-500" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="ml-3 text-sm text-premium-gray-dark">Cargando pasarela de pago...</span>
                  </div>
                ) : stripePromise ? (
                  <Elements stripe={stripePromise}>
                    <StripeCheckoutForm
                      finalTotal={finalTotal}
                      shippingInfo={shippingInfo}
                      shippingMethod={shippingMethod}
                      shipping={shipping}
                      cart={cart}
                      total={total}
                      discount={discount}
                      paymentInfo={paymentInfo}
                      setPaymentInfo={setPaymentInfo}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      onBack={prevStep}
                      isProcessing={isProcessing}
                      setIsProcessing={setIsProcessing}
                    />
                  </Elements>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-red-500 text-sm mb-4">
                      No se pudo cargar la pasarela de pago. Stripe no está configurado.
                    </p>
                    <p className="text-xs text-premium-gray-dark mb-6">
                      Contacta con el administrador o configura las claves de Stripe en el backend.
                    </p>
                    <button onClick={prevStep} className="btn-secondary">Volver</button>
                  </div>
                )}

                {/* Payment Error */}
                {paymentError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-sm">
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {paymentError}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Confirm (ya no se usa con Stripe, pero lo mantenemos por compatibilidad) */}
            {currentStep === 3 && (
              <div className="animate-fade-in">
                <h2 className="text-sm uppercase tracking-wider font-medium mb-6">Confirmar Pedido</h2>

                <div className="border border-premium-gray p-6 mb-6">
                  <h3 className="text-xs uppercase tracking-wider text-premium-gray-dark mb-3">Dirección de Envío</h3>
                  <p className="text-sm">{shippingInfo.name}</p>
                  <p className="text-sm text-premium-gray-dark">{shippingInfo.email}</p>
                  <p className="text-sm text-premium-gray-dark">{shippingInfo.address}</p>
                  <p className="text-sm text-premium-gray-dark">{shippingInfo.city}, {shippingInfo.zip}</p>
                  <p className="text-sm text-premium-gray-dark">{shippingInfo.country}</p>
                </div>

                <div className="border border-premium-gray p-6 mb-6">
                  <h3 className="text-xs uppercase tracking-wider text-premium-gray-dark mb-3">Método de Envío</h3>
                  <p className="text-sm font-medium">{SHIPPING_METHODS[shippingMethod]?.label}</p>
                  <p className="text-xs text-premium-gray-dark">{SHIPPING_METHODS[shippingMethod]?.description}</p>
                  <p className="text-sm mt-1">{shipping === 0 ? 'Gratis' : formatPrice(shipping)}</p>
                </div>

                <div className="border border-premium-gray p-6 mb-6">
                  <h3 className="text-xs uppercase tracking-wider text-premium-gray-dark mb-3">Método de Pago</h3>
                  <p className="text-sm">Tarjeta terminada en ****</p>
                  <p className="text-sm text-premium-gray-dark">{paymentInfo.cardName}</p>
                </div>

                <div className="border border-premium-gray p-6 mb-6">
                  <h3 className="text-xs uppercase tracking-wider text-premium-gray-dark mb-3">Productos</h3>
                  <ul className="divide-y divide-premium-gray">
                    {cart.map(item => (
                      <li key={item.id} className="py-2 flex justify-between text-sm">
                        <span>{item.name} × {item.quantity}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-4">
                  <button onClick={prevStep} className="btn-secondary">Volver</button>
                  <button onClick={() => nextStep()} className="btn-cuero">
                    Confirmar y Pagar {formatPrice(finalTotal)}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:w-80 lg:sticky lg:top-24 lg:self-start pb-12">
            <div className="border border-premium-gray p-6">
              <h2 className="text-sm uppercase tracking-wider font-medium mb-6">Resumen</h2>

              <div className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Cupón"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    className="input-premium text-xs flex-1"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={applying}
                    className="px-3 py-2 bg-premium-black text-white text-xs font-medium tracking-wider uppercase
                               hover:bg-cuero-500 transition-colors disabled:opacity-50"
                  >
                    {applying ? '...' : 'OK'}
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
                  <span className="text-premium-gray-dark">Subtotal ({count})</span>
                  <span>{formatPrice(total)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-premium-gray-dark">Base imponible</span>
                  <span>{formatPrice(subtotalAfterDiscount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-premium-gray-dark">IVA (21%)</span>
                  <span>{formatPrice(taxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-premium-gray-dark">Envío</span>
                  <span>{shipping === 0 ? 'Gratis' : formatPrice(shipping)}</span>
                </div>
                <div className="border-t border-premium-gray pt-3 flex justify-between font-medium">
                  <span>Total</span>
                  <span className="text-lg">{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
