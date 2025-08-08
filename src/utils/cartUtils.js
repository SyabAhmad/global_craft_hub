export const addToCart = (product, quantity = 1) => {
  try {
    const cart = getCart();
    const existingItemIndex = cart.findIndex(item => item.product_id === product.product_id);
    
    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      cart[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cart.push({
        product_id: product.product_id,
        name: product.name,
        price: product.price,
        sale_price: product.sale_price,
        image_url: product.image_url,
        store_name: product.store_name,
        quantity: quantity
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Dispatch custom event to update navbar
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    
    return true;
  } catch (error) {
    console.error('Error adding to cart:', error);
    return false;
  }
};

export const removeFromCart = (productId) => {
  try {
    const cart = getCart();
    const updatedCart = cart.filter(item => item.product_id !== productId);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    
    // Dispatch custom event to update navbar
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    
    return true;
  } catch (error) {
    console.error('Error removing from cart:', error);
    return false;
  }
};

export const updateCartQuantity = (productId, quantity) => {
  try {
    const cart = getCart();
    const itemIndex = cart.findIndex(item => item.product_id === productId);
    
    if (itemIndex >= 0) {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        cart.splice(itemIndex, 1);
      } else {
        cart[itemIndex].quantity = quantity;
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
      
      // Dispatch custom event to update navbar
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating cart:', error);
    return false;
  }
};

export const getCart = () => {
  try {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error('Error getting cart:', error);
    return [];
  }
};

export const getCartCount = () => {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.quantity, 0);
};

export const clearCart = () => {
  localStorage.removeItem('cart');
  
  // Dispatch custom event to update navbar
  window.dispatchEvent(new CustomEvent('cartUpdated'));
};