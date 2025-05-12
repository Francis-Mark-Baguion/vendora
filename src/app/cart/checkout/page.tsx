"use client";

import type React from "react";

import { useUser } from "@clerk/nextjs";
import { useContext, useEffect, useState } from "react";
import { getCartItems, getShippingFee, getAddressByCustomerId } from "../../../lib/supabaseQueries";
import { newFormatPrice } from "../../../lib/utils";
import Link from "next/link";
import { Button } from "../../../components/ui/button"; // Adjusted path based on likely folder structure
import { ArrowLeft, CreditCard, Plus } from "lucide-react";
import Image from "next/image";
import { supabase } from "../../../lib/supabaseClient";
import toast from "react-hot-toast";
import { CurrencyContext } from "../../../context/CurrencyContext";
import { useCart } from "../../../context/CartContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group";
import { Separator } from "../../../components/ui/separator";
import { Textarea } from "../../../components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../components/ui/accordion";
import { get } from "http";
import Breadcrumbs from "@/components/breadcrumbs";

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

interface Address {
  id: string;
  full_name: string;
  landmark: string | null;
  barangay: string;
  city: string;
  province: string;
  zip_code: string;
  country: string;
  phone_number: string;
  is_default: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  last4: string;
  icon: React.ReactNode;
}

const CheckoutPage = () => {
  const { user } = useUser();
  const [isBuyNowFlow, setIsBuyNowFlow] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);

  const [shippingFee, setShippingFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState(false);
  const { currency, exchangeRate } = useContext(CurrencyContext);
  const { cartCount, setCartCount, updateCartCount } = useCart();
  const [newAddressOpen, setNewAddressOpen] = useState(false);
  const [newAddress, setNewAddress] = useState<
    Omit<Address, "id" | "customer_id" | "is_default">
  >({
    full_name: "",
    landmark: null,
    barangay: "",
    city: "",
    province: "",
    zip_code: "",
    country: "",
    phone_number: "",
  });

  // Mock payment methods (in a real app, these would come from your payment provider)
  const paymentMethods: PaymentMethod[] = [
    {
      id: "card1",
      name: "Visa",
      last4: "4242",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      id: "card2",
      name: "Mastercard",
      last4: "5555",
      icon: <CreditCard className="h-5 w-5" />,
    },
  ];

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

  const fetchCartItems = async (customerId: string) => {
    try {
      const cartData = await getCartItems(customerId);
      setCartItems(
        cartData.map((item: any) => ({
          ...item,
          product: Array.isArray(item.product) ? item.product[0] : item.product,
        }))
      );
    } catch (error) {
      toast.error("Error fetching cart items. Please try again.");
      console.error("Error fetching cart items:", error);
    }
  };

  const fetchAddresses = async (customerId: string) => {
    try {
      const { data: customerData, error: customerError } = await supabase
        .from("customer")
        .select("*")
        .eq("id", customerId)
        .single();

      if (customerError || !customerData) {
        throw new Error("Customer not found");
      }

      const addressesData: Address[] = [];
      for (const addressId of customerData.address_ids || []) {
        const { data: address, error } = await supabase
          .from("address")
          .select("*")
          .eq("id", addressId)
          .single();

        if (!error && address) {
          addressesData.push(address);
        }
      }

      setAddresses(addressesData);

      // Set default address as selected
      const defaultAddress = addressesData.find((addr) => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else if (addressesData.length > 0) {
        setSelectedAddressId(addressesData[0].id);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Failed to load your addresses");
    }
  };

  const handleAddNewAddress = async () => {
    if (!user?.id) return;

    try {
      // Validate required fields
      const requiredFields = [
        "full_name",
        "landmark",
        "barangay",
        "city",
        "province",
        "zip_code",
        "country",
      ];
      const missingFields = requiredFields.filter(
        (field) => !newAddress[field as keyof typeof newAddress]
      );

      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields`);
        return;
      }

      const { data: customerData } = await supabase
        .from("customer")
        .select("*")
        .eq("email", user?.emailAddresses.at(0)?.emailAddress)
        .single();

      if (!customerData) {
        throw new Error("Customer not found");
      }

      // Set as default if it's the first address
      const isDefault = addresses.length === 0;

      const { data, error } = await supabase
        .from("address")
        .insert({
          ...newAddress,
          is_default: isDefault,
        })
        .select()
        .single();

      await supabase
        .from("customer")
        .update({
          address_ids: [...(customerData.address_ids || []), data.id],
        })
        .eq("id", customerData.id);

      if (error) throw error;

      // Refresh addresses and select the new one
      await fetchAddresses(customerData.id);
      setSelectedAddressId(data.id);
      setNewAddressOpen(false);

      // Reset form
      setNewAddress({
        full_name: "",
        landmark: "",
        barangay: "",
        city: "",
        province: "",
        zip_code: "",
        country: "",
        phone_number: "",
      });

      toast.success("Address added successfully");
    } catch (error) {
      console.error("Error adding address:", error);
      toast.error("Failed to add address");
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!user?.id) return;

    try {
      const { data: customerData } = await supabase
        .from("customer")
        .select("*")
        .eq("email", user?.emailAddresses.at(0)?.emailAddress)
        .single();

      if (!customerData) {
        throw new Error("Customer not found");
      }

      // Update all addresses to non-default first
      for (const addr of addresses) {
        await supabase
          .from("address")
          .update({ is_default: false })
          .eq("id", addr.id);
      }

      // Then set the selected address as default
      await supabase
        .from("address")
        .update({ is_default: true })
        .eq("id", addressId);

      // Refresh addresses and update selection
      await fetchAddresses(customerData.id);
      setSelectedAddressId(addressId);
      toast.success("Default address updated");
    } catch (error) {
      console.error("Error setting default address:", error);
      toast.error("Failed to update default address");
    }
  };
  const placeOrder = async () => {
    if (!user?.id || !selectedAddressId || !selectedPaymentMethod) {
      toast.error("Please select an address and payment method");
      return;
    }

    try {
      setProcessingOrder(true);

      const { data: customerData } = await supabase
        .from("customer")
        .select("id")
        .eq("email", user?.emailAddresses.at(0)?.emailAddress)
        .single();

      if (!customerData) {
        throw new Error("Customer not found");
      }

      const orderItems = isBuyNowFlow
        ? cartItems.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price_at_addition,
            selected_color: item.selected_color,
            selected_size: item.selected_size,
          }))
        : // For regular checkout, use all items
          cartItems.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price_at_addition,
            selected_color: item.selected_color,
            selected_size: item.selected_size,
          }));
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from("order")
        .insert({
          customer_id: customerData.id,
          address_id: selectedAddressId,
          total_amount: totalPriceWithShipFee * exchangeRate, // Store in base currency
          status: "pending",
          payment_method: selectedPaymentMethod,
          shipping_fee: shippingFee * exchangeRate, // Store in base currency
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const { error: orderItemsError } = await supabase
        .from("order_item")
        .insert(
          orderItems.map((item) => ({
            ...item,
            order_id: orderData.id,
          }))
        );

      if (orderItemsError) throw orderItemsError;

      // Clear cart only if this was a buy now flow
      if (isBuyNowFlow) {
        const { error: clearCartError } = await supabase
          .from("cart")
          .delete()
          .eq("customer_id", customerData.id);

        if (clearCartError) throw clearCartError;
      }

      // Reset cart count if buy now flow
      if (isBuyNowFlow) {
        updateCartCount(0);
      }

      toast.success("Order placed successfully!");
      window.location.href = `/orders/${orderData.id}/confirmation`;
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setProcessingOrder(false);
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    setIsBuyNowFlow(queryParams.get("buy_now") === "true");

    const fetchData = async () => {
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

        // Fetch shipping fee
        const fee = await getShippingFee();
        setShippingFee(fee.shipping_amount * exchangeRate);

        // Fetch cart items and addresses in parallel
        await Promise.all([
          fetchCartItems(customerData.id),
          fetchAddresses(customerData.id),
        ]);

        // Set default payment method if available
        if (paymentMethods.length > 0) {
          setSelectedPaymentMethod(paymentMethods[0].id);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, exchangeRate]);

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
    <div className="max-w-7xl mx-auto px-4 py-8 mt-24">
      <div className="flex justify-between mb-8">
        <Breadcrumbs />
        {/* <Link
          href="/cart"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Back to cart</span>
        </Link> */}
        <h1 className="text-2xl font-bold  pt-2 hidden md:block ">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Shipping & Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
              <CardDescription>
                Select where you want your order delivered
              </CardDescription>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">
                    You don't have any saved addresses
                  </p>
                  <Dialog
                    open={newAddressOpen}
                    onOpenChange={setNewAddressOpen}
                  >
                    <DialogTrigger asChild>
                      <Button>Add New Address</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Add New Address</DialogTitle>
                        <DialogDescription>
                          Enter your shipping address details below
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input
                            id="full_name"
                            value={newAddress.full_name}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                full_name: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="landmark">Landmark</Label>
                          <Input
                            id="landmark"
                            value={newAddress.landmark || ""}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                landmark: e.target.value || "",
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="barangay">Barangay</Label>
                          <Input
                            id="barangay"
                            value={newAddress.barangay}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                barangay: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={newAddress.city}
                              onChange={(e) =>
                                setNewAddress({
                                  ...newAddress,
                                  city: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="province">State/Province</Label>
                            <Input
                              id="province"
                              value={newAddress.province}
                              onChange={(e) =>
                                setNewAddress({
                                  ...newAddress,
                                  province: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="zip_code">Postal Code</Label>
                            <Input
                              id="zip_code"
                              value={newAddress.zip_code}
                              onChange={(e) =>
                                setNewAddress({
                                  ...newAddress,
                                  zip_code: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              value={newAddress.country}
                              onChange={(e) =>
                                setNewAddress({
                                  ...newAddress,
                                  country: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="phone_number">Phone Number</Label>
                          <Input
                            id="phone_number"
                            value={newAddress.phone_number}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                phone_number: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" onClick={handleAddNewAddress}>
                          Save Address
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="space-y-4">
                  <RadioGroup
                    value={selectedAddressId || ""}
                    onValueChange={setSelectedAddressId}
                    className="space-y-3"
                  >
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className="flex items-start space-x-3 border rounded-lg p-4 hover:border-gray-400 transition-colors"
                      >
                        <RadioGroupItem
                          value={address.id}
                          id={`address-${address.id}`}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={`address-${address.id}`}
                            className="flex items-center cursor-pointer"
                          >
                            <span className="font-medium">
                              {address.full_name}
                            </span>
                            {address.is_default && (
                              <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                                Default
                              </span>
                            )}
                          </Label>
                          <div className="text-sm text-gray-600 mt-1">
                            <p>{address.barangay}</p>
                            {address.landmark && <p>{address.landmark}</p>}
                            <p>
                              {address.city}, {address.province}{" "}
                              {address.zip_code}
                            </p>
                            <p>{address.country}</p>
                            <p className="mt-1">{address.phone_number}</p>
                          </div>
                          {!address.is_default &&
                            selectedAddressId === address.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() =>
                                  handleSetDefaultAddress(address.id)
                                }
                              >
                                Set as default
                              </Button>
                            )}
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                  <Dialog
                    open={newAddressOpen}
                    onOpenChange={setNewAddressOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" className="mt-4 w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Address
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Add New Address</DialogTitle>
                        <DialogDescription>
                          Enter your shipping address details below
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input
                            id="full_name"
                            value={newAddress.full_name}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                full_name: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="landmark">Landmark</Label>
                          <Input
                            id="landmark"
                            value={newAddress.landmark || ""}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                landmark: e.target.value || null,
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="barangay">Brangay</Label>
                          <Input
                            id="barangay"
                            value={newAddress.barangay}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                barangay: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={newAddress.city}
                              onChange={(e) =>
                                setNewAddress({
                                  ...newAddress,
                                  city: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="province">State/Province</Label>
                            <Input
                              id="prvovince"
                              value={newAddress.province}
                              onChange={(e) =>
                                setNewAddress({
                                  ...newAddress,
                                  province: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="zip_code">Postal Code</Label>
                            <Input
                              id="zip_code"
                              value={newAddress.zip_code}
                              onChange={(e) =>
                                setNewAddress({
                                  ...newAddress,
                                  zip_code: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              value={newAddress.country}
                              onChange={(e) =>
                                setNewAddress({
                                  ...newAddress,
                                  country: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="phone_number">Phone Number</Label>
                          <Input
                            id="phone_number"
                            value={newAddress.phone_number}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                phone_number: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" onClick={handleAddNewAddress}>
                          Save Address
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Select how you want to pay</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedPaymentMethod || undefined}
                onValueChange={setSelectedPaymentMethod}
                className="space-y-3"
              >
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center space-x-3 border rounded-lg p-4 hover:border-gray-400 transition-colors"
                  >
                    <RadioGroupItem
                      value={method.id}
                      id={`payment-${method.id}`}
                    />
                    <Label
                      htmlFor={`payment-${method.id}`}
                      className="flex items-center cursor-pointer flex-1"
                    >
                      <div className="flex items-center">
                        {method.icon}
                        <span className="ml-2 font-medium">{method.name}</span>
                        <span className="ml-2 text-sm text-gray-500">
                          •••• {method.last4}
                        </span>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() =>
                  toast.error(
                    "This app does not support adding new payment methods"
                  )
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            </CardContent>
          </Card>

          {/* Order Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Order Notes (Optional)</CardTitle>
              <CardDescription>
                Add any special instructions for your order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Special delivery instructions, gift notes, etc."
                className="resize-none"
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Accordion type="single" collapsible defaultValue="items">
                  <AccordionItem value="items">
                    <AccordionTrigger className="text-sm font-medium">
                      {isBuyNowFlow
                        ? "1 item"
                        : `${cartItems.length} ${
                            cartItems.length === 1 ? "item" : "items"
                          }`}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 mt-2">
                        {isBuyNowFlow && cartItems.length > 1 ? (
                          // In buy now flow but somehow got multiple items, show only first
                          <div className="flex gap-3">
                            <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-50">
                              <Image
                                src={
                                  cartItems[0].product.image_url?.[0] ||
                                  "/placeholder-product.jpg"
                                }
                                alt={cartItems[0].product.name}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">
                                {cartItems[0].product.name}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {hexColorMap[cartItems[0].selected_color]}
                                {cartItems[0].selected_size &&
                                  ` • ${cartItems[0].selected_size}`}
                              </p>
                              <div className="flex justify-between mt-1">
                                <span className="text-xs text-gray-500">
                                  Qty: {cartItems[0].quantity}
                                </span>
                                <span className="text-sm font-medium">
                                  {newFormatPrice(
                                    getCurrentPrice(
                                      cartItems[0].price_at_addition
                                    ) * cartItems[0].quantity,
                                    currency
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          cartItems.map((item) => (
                            <div key={item.id} className="flex gap-3">
                              <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-50">
                                <Image
                                  src={
                                    item.product.image_url?.[0] ||
                                    "/placeholder-product.jpg"
                                  }
                                  alt={item.product.name}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {item.product.name}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">
                                  {hexColorMap[item.selected_color]}
                                  {item.selected_size &&
                                    ` • ${item.selected_size}`}
                                </p>
                                <div className="flex justify-between mt-1">
                                  <span className="text-xs text-gray-500">
                                    Qty: {item.quantity}
                                  </span>
                                  <span className="text-sm font-medium">
                                    {newFormatPrice(
                                      getCurrentPrice(item.price_at_addition) *
                                        item.quantity,
                                      currency
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="space-y-3 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">
                      {newFormatPrice(totalPrice, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">
                      {newFormatPrice(shippingFee, currency)}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-medium">
                    {newFormatPrice(totalPriceWithShipFee, currency)}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full h-12"
                  onClick={placeOrder}
                  disabled={
                    !selectedAddressId ||
                    !selectedPaymentMethod ||
                    processingOrder
                  }
                >
                  {processingOrder ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    "Place Order"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
