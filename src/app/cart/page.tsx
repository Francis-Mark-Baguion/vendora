"use client";

import { useUser } from "@clerk/nextjs";
import { use, useContext, useEffect, useState } from "react";
import { getCartItems } from "@/lib/supabaseQueries";
import { newFormatPrice } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Image from "next/image";
import { getShippingFee, getProductById } from "@/lib/supabaseQueries";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { CurrencyContext } from "@/context/CurrencyContext";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  selected_color: string;
  selected_size: string;
  price_at_addition: number;
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
  };
}

const CartPage = () => {
  const { user } = useUser();
  const [shippingFee, setShippingFee] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { currency, exchangeRate } = useContext(CurrencyContext);

  const hexColorMap: { [key: string]: string } = {
    "#000000": "Black",
    "#FFFFFF": "White",
    "#FF0000": "Red",
    "#0000FF": "Blue",
    "#00FF00": "Green",
    "#FFFF00": "Yellow",
    "#FFC0CB": "Pink",
    "#800080": "Purple",
    "#808080": "Gray",
    "#FFA500": "Orange",
    "#A52A2A": "Brown",
    "#F5F5DC": "Beige",
    "#00FFFF": "Cyan",
    "#008080": "Teal",
    "#800000": "Maroon",
    "#000080": "Navy",
  };

  const fetchCartItems = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data: customerData, error: customerError } = await supabase
        .from("customer")
        .select("id")
        .eq("email", user?.emailAddresses.at(0)?.emailAddress)
        .single();

      if (customerError || !customerData) {
        throw new Error("Customer not found");
      }
      const cartData = await getCartItems(customerData.id);
      setCartItems(
        cartData.map((item: any) => ({
          ...item,
          product: Array.isArray(item.product) ? item.product[0] : item.product,
        }))
      );
      setLoading(false);
    } catch (error) {
      toast.error("Error fetching cart items. Please try again.");
      console.error("Error fetching cart items:", error);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from("cart").delete().eq("id", itemId);

      if (error) throw error;
      await fetchCartItems();
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      // Validate input
      if (newQuantity < 1) {
        toast.error("Quantity must be at least 1");
        return;
      }

      // Get current cart item and product info
      const { data: cartItem, error: cartItemError } = await supabase
        .from("cart")
        .select("product_id, quantity")
        .eq("id", itemId)
        .single();

      if (cartItemError || !cartItem) {
        throw new Error(cartItemError?.message || "Cart item not found");
      }

      const { data: product, error: productError } = await supabase
        .from("product")
        .select("stock_quantity")
        .eq("id", cartItem.product_id)
        .single();

      if (productError || !product) {
        throw new Error(productError?.message || "Product not found");
      }

      // Calculate stock difference
      const quantityDifference = newQuantity - cartItem.quantity;
      const newStock = product.stock_quantity - quantityDifference;

      // Validate stock availability
      if (newStock < 0) {
        toast.error(`Only ${product.stock_quantity} items available in stock`);
        return;
      }

      const { error: updateError } = await supabase
        .from("cart")
        .update({ quantity: newQuantity })
        .eq("id", itemId);
      if (updateError) throw updateError;

      const { error: stockError } = await supabase
        .from("product")
        .update({ stock_quantity: newStock })
        .eq("id", cartItem.product_id);
      if (stockError) throw stockError;

      // Refresh data
      await fetchCartItems();
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update quantity"
      );
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        // Fetch both in parallel
        const [fee, items] = await Promise.all([
          getShippingFee(),
          fetchCartItems(), // Your existing cart items function
        ]);

        console.log("Shipping fee:", fee);

        // Apply currency conversion
        setShippingFee(fee.shipping_amount * exchangeRate);
        console.log("Shipping fee after conversion:", shippingFee);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [user?.id, exchangeRate]); // Re-fetch when either changes

  // Calculate the current price based on exchange rate
  const getCurrentPrice = (price: number) => {
    return price * exchangeRate;
  };

  const totalPrice = cartItems.reduce(
    (total, item) =>
      total + getCurrentPrice(item.price_at_addition) * item.quantity,
    0
  );
  const totalPriceWithShipFee = totalPrice + shippingFee;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 mt-24">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <h2 className="text-2xl font-medium text-gray-900">
          Your cart is empty
        </h2>
        <Link href="/products">
          <Button>Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl w-full md:w-1/2 mx-auto px-4 py-8">
      {/* Cart Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Your Cart</h1>
        <span className="text-sm text-gray-500">
          {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
        </span>
      </div>

      {/* Cart Items */}
      <div className="divide-y divide-gray-100">
        {cartItems.map((item) => (
          <div key={item.id} className="py-6 flex gap-4">
            {/* Product Image */}
            <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
              <Image
                src={item.product.image_url?.[0] || "/placeholder-product.jpg"}
                alt={item.product.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>

            {/* Product Details */}
            <div className="flex-1">
              <div className="flex justify-between">
                <Link href={`/products/${item.product.id}`} className="group">
                  <h3 className="font-medium text-gray-900 group-hover:underline">
                    {item.product.name}
                  </h3>
                </Link>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Remove item"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Variant Info */}
              {item.selected_size != "" && (
                <p className="mt-1 text-sm text-gray-500">
                  {hexColorMap[item.selected_color]} • {item.selected_size}
                </p>
              )}
              {item.selected_size == "" && (
                <p className="mt-1 text-sm text-gray-500">
                  {hexColorMap[item.selected_color]}
                </p>
              )}

              {/* Quantity and Price */}
              <div className="mt-3 flex items-end justify-between">
                {/* Quantity Selector */}
                <div className="flex items-center border border-gray-200 rounded-md">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="px-2.5 py-1 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="px-3 py-1 text-sm border-x border-gray-200">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="px-2.5 py-1 text-gray-500 hover:bg-gray-50 transition-colors"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {/* Price */}
                <p className="font-medium text-gray-900">
                  {newFormatPrice(
                    getCurrentPrice(item.price_at_addition) * item.quantity,
                    currency
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Order Summary
        </h2>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">
              {newFormatPrice(totalPrice, currency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping</span>
            <span className="text-gray-900">
              {newFormatPrice(shippingFee, currency)}
            </span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between">
          <span className="text-base font-medium text-gray-900">Total</span>
          <span className="text-base font-medium text-gray-900">
            {newFormatPrice(totalPriceWithShipFee, currency)}
          </span>
        </div>

        <Button className="w-full mt-6 h-12">Proceed to Checkout</Button>

        <div className="mt-4 flex justify-center">
          <Link
            href="/products"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
