import { useState } from 'react';

const STEPS = ['Carrito', 'Envío', 'Pago', 'Confirmar', 'Completado'];

// Métodos de envío disponibles
export const SHIPPING_METHODS = {
  standard: { id: 'standard', label: 'Estándar', description: 'Entrega en 3-5 días laborables', cost: 25, freeFrom: 1000 },
  express: { id: 'express', label: 'Exprés', description: 'Entrega en 24-48 horas laborables', cost: 35, freeFrom: null },
  pickup: { id: 'pickup', label: 'Recogida en Taller', description: 'Recoge en nuestro taller de Madrid (C/ Mayor, 15)', cost: 0, freeFrom: null },
};

export function useCheckout() {
  const [currentStep, setCurrentStep] = useState(0);
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'España',
  });
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
  });
  const [errors, setErrors] = useState({});

  const validateShipping = () => {
    const newErrors = {};
    if (!shippingInfo.name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!shippingInfo.email.trim()) newErrors.email = 'El email es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(shippingInfo.email)) newErrors.email = 'Email inválido';
    if (!shippingInfo.address.trim()) newErrors.address = 'La dirección es obligatoria';
    if (!shippingInfo.city.trim()) newErrors.city = 'La ciudad es obligatoria';
    if (!shippingInfo.zip.trim()) newErrors.zip = 'El código postal es obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePayment = () => {
    const newErrors = {};
    if (!paymentInfo.cardNumber.replace(/\s/g, '').match(/^\d{16}$/)) {
      newErrors.cardNumber = 'Número de tarjeta inválido';
    }
    if (!paymentInfo.cardName.trim()) newErrors.cardName = 'El nombre es obligatorio';
    if (!paymentInfo.expiry.match(/^\d{2}\/\d{2}$/)) newErrors.expiry = 'Formato MM/AA';
    if (!paymentInfo.cvv.match(/^\d{3,4}$/)) newErrors.cvv = 'CVV inválido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateShipping()) return false;
    if (currentStep === 2 && !validatePayment()) return false;
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    return true;
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const resetCheckout = () => {
    setCurrentStep(0);
    setShippingInfo({ name: '', email: '', phone: '', address: '', city: '', state: '', zip: '', country: 'España' });
    setShippingMethod('standard');
    setPaymentInfo({ cardNumber: '', cardName: '', expiry: '', cvv: '' });
    setErrors({});
  };

  return {
    currentStep,
    steps: STEPS,
    shippingInfo,
    setShippingInfo,
    shippingMethod,
    setShippingMethod,
    paymentInfo,
    setPaymentInfo,
    errors,
    nextStep,
    prevStep,
    resetCheckout,
  };
}
