// context/CartContext.js
"use client";
import { createContext, useState, useContext } from "react";
import { useUser } from "@clerk/nextjs";
import { getCustomerByEmail } from "@/lib/supabaseQueries";
import { supabase } from "@/lib/supabaseClient";
export const CartContext = createContext();
import { useEffect } from "react";

export const CartProvider = ({ children }) => {
  const { user } = useUser();
  const [customer, setCustomer] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  // Fetch customer data and cart count
  useEffect(() => {
    const getCustomerAndCart = async () => {
      try {
        if (!user?.email) return; // Check if user has email

        // 1. Get customer data
        const customerData = await getCustomerByEmail(user.email);
        if (!customerData) return;
        setCustomer(customerData);

        // 2. Get cart quantity
        const { data, error } = await supabase
          .from("cart")
          .select("quantity")
          .eq("customer_id", customerData.id);

        if (error) throw error;

        // Sum all quantities if multiple items exist
        const totalQuantity = data.reduce(
          (sum, item) => sum + (item.quantity || 0),
          0
        );
        setCartCount(totalQuantity);
        console.log("Cart count:", totalQuantity);
      } catch (error) {
        console.error("Error fetching cart data:", error);
        setCartCount(0); // Reset to 0 on error
      }
    };

    getCustomerAndCart();
  }, [user]); // Re-run when user changes

  // Function to update the cart count (you can modify this as needed)
  const updateCartCount = (newCount) => {
    setCartCount(newCount);
  };

  // Function to increment the cart count (optional)
  const incrementCartCount = () => {
    console.log("Incrementing cart count");
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
