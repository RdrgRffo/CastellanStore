const CART_KEY = 'castellanstore_cart';

export function getCart() {
  try {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || (product.gallery && product.gallery[0]) || '',
      quantity,
    });
  }

  saveCart(cart);
  return cart;
}

export function removeFromCart(productId) {
  const cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);
  return cart;
}

export function updateQuantity(productId, quantity) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }
    item.quantity = quantity;
    saveCart(cart);
  }
  return cart;
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  return [];
}

export function getCartTotal(cart) {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function getCartCount(cart) {
  return cart.reduce((count, item) => count + item.quantity, 0);
}
