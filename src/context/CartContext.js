// context/CartContext.js
"use client";
import { createContext, useState, useContext } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);

  // Function to update the cart count (you can modify this as needed)
  const updateCartCount = (newCount) => {
    setCartCount(newCount);
  };

  // Function to increment the cart count (optional)
  const incrementCartCount = () => {
    setCartCount((prevCount) => prevCount + 1);
  };

  // Function to decrement the cart count (optional)
  const decrementCartCount = () => {
    setCartCount((prevCount) => (prevCount > 0 ? prevCount - 1 : 0));
  };

  return (
    <CartContext.Provider
      value={{
        cartCount,
        updateCartCount,
        incrementCartCount,
        decrementCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook for easier consumption of the context
export const useCart = () => {
  return useContext(CartContext);
};
