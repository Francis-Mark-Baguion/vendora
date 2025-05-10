"use client";

import { useUser } from "@clerk/nextjs";
import { useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { newFormatPrice } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CurrencyContext } from "@/context/CurrencyContext";
import { ArrowLeft, ExternalLink, Package, Truck } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import toast from "react-hot-toast";
import Breadcrumbs from "@/components/breadcrumbs";


interface OrderDetailsProps {
  params: {
    id: string;
  };
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
}

interface OrderDetails {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  shipping_fee: number;
  payment_method: string;
  address: {
    full_name: string;
    landmark?: string | null;
    barangay?: string;
    city: string;
    province: string;
    zip_code: string;
    country: string;
    phone_number: string;
  };
  items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    selected_color: string;
    selected_size: string;
    product: {
      id: string;
      name: string;
      image_url: string[];
    };
  }>;
}

const statusColors: Record<string, { color: string; bgColor: string }> = {
  pending: { color: "text-yellow-700", bgColor: "bg-yellow-100" },
  processing: { color: "text-blue-700", bgColor: "bg-blue-100" },
  shipped: { color: "text-purple-700", bgColor: "bg-purple-100" },
  delivered: { color: "text-green-700", bgColor: "bg-green-100" },
  cancelled: { color: "text-red-700", bgColor: "bg-red-100" },
};

const hexColorMap: Record<string, string> = {
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

export default function OrderDetailsPage({ params }: OrderDetailsProps) {
  const { id } = params;
  const { user } = useUser();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currency, exchangeRate } = useContext(CurrencyContext);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Get customer ID
        const { data: customerData, error: customerError } = await supabase
          .from("customer")
          .select("id")
          .eq("email", user?.emailAddresses.at(0)?.emailAddress)
          .single();

        if (customerError || !customerData) {
          throw new Error("Customer not found");
        }

        // Get order with address
        const { data: orderData, error: orderError } = await supabase
          .from("order")
          .select(
            `
            *,
            address:address_id(
              full_name,
              landmark,
              barangay,
              city,
              province,
              zip_code,
              country,
              phone_number
            )
          `
          )
          .eq("id", id)
          .eq("customer_id", customerData.id)
          .single();

        if (orderError || !orderData) {
          throw new Error("Order not found");
        }

        // Get order items with products
        const { data: orderItems, error: itemsError } = await supabase
          .from("order_item")
          .select(
            `
            *,
            product:product_id(
              id,
              name,
              image_url
            )
          `
          )
          .eq("order_id", id);

        if (itemsError) {
          throw new Error("Failed to fetch order items");
        }

        setOrder({
          ...orderData,
          address: {
            full_name: orderData.address?.full_name || "",
            landmark: orderData.address?.landmark || null,
            barangay: orderData.address?.barangay || "",
            city: orderData.address?.city || "",
            province: orderData.address?.province || "",
            zip_code: orderData.address?.zip_code || "",
            country: orderData.address?.country || "",
            phone_number: orderData.address?.phone_number || "",
          },
          items: orderItems || [],
        });
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load order details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, user?.id]);

  const getCurrentPrice = (price: number) => {
    return price * exchangeRate;
  };

  const formatOrderDate = (dateString: string) => {
    return format(new Date(dateString), "MMMM d, yyyy 'at' h:mm a");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 mt-24">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
            <Breadcrumbs />
        <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
        <p className="text-gray-600 mb-6">
          {error || "We couldn't find the order you're looking for."}
        </p>
        <Link href="/orders">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    );
  }

  return (
      <div className="max-w-4xl mx-auto px-4 py-8 mt-24">
          <Breadcrumbs />
      {/* <div className="flex items-center mb-8">
        <Link
          href="/orders"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Back to Orders</span>
        </Link>
      </div> */}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Order #{id.slice(0, 8)}
          </h1>
          <p className="text-gray-500 mt-1">
            Placed on {formatOrderDate(order.created_at)}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`${statusColors[order.status]?.bgColor} ${
            statusColors[order.status]?.color
          } border-0 text-sm px-3 py-1`}
        >
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </div>

      {/* Order Progress */}
      {order.status !== "cancelled" && (
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Order Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="flex justify-between mb-2">
                {["confirmed", "processing", "shipped", "delivered"].map(
                  (stage, index) => {
                    const isCompleted =
                      (stage === "confirmed" && order.status !== "pending") ||
                      (stage === "processing" &&
                        ["processing", "shipped", "delivered"].includes(
                          order.status
                        )) ||
                      (stage === "shipped" &&
                        ["shipped", "delivered"].includes(order.status)) ||
                      (stage === "delivered" && order.status === "delivered");

                    const isCurrent =
                      (stage === "confirmed" && order.status === "pending") ||
                      (stage === "processing" &&
                        order.status === "processing") ||
                      (stage === "shipped" && order.status === "shipped") ||
                      (stage === "delivered" && order.status === "delivered");

                    return (
                      <div key={stage} className="text-center flex-1">
                        <div
                          className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                            isCompleted
                              ? "bg-green-100 text-green-700"
                              : isCurrent
                              ? stage === "processing"
                                ? "bg-blue-100 text-blue-700"
                                : stage === "shipped"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-gray-100 text-gray-700"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {isCompleted ? "✓" : index + 1}
                        </div>
                        <p className="text-xs mt-1 capitalize">{stage}</p>
                      </div>
                    );
                  }
                )}
              </div>

              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width:
                      order.status === "pending"
                        ? "0%"
                        : order.status === "processing"
                        ? "33%"
                        : order.status === "shipped"
                        ? "66%"
                        : "100%",
                  }}
                ></div>
              </div>
            </div>

            {order.status === "shipped" && (
              <div className="mt-6 flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <Truck className="h-5 w-5 text-purple-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium">
                      Your order is on the way!
                    </p>
                    <p className="text-xs text-gray-500">
                      Estimated delivery: 3-5 business days
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  <ExternalLink className="h-3 w-3 mr-1" onClick={() => toast.error("Sorry! This feature is not yet implemented.")} />
                  Track
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>
                {order.items.length}{" "}
                {order.items.length === 1 ? "item" : "items"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                      {item.product?.image_url?.[0] ? (
                        <Image
                          src={item.product.image_url[0]}
                          alt={item.product.name || "Product image"}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Link
                        href={`/products/${item.product.id}`}
                        className="font-medium text-gray-900 hover:underline"
                      >
                        {item.product?.name || "Unknown Product"}
                      </Link>

                      <div className="mt-1 text-sm text-gray-500">
                        {item.selected_color && (
                          <span>
                            Color:{" "}
                            {hexColorMap[item.selected_color] ||
                              item.selected_color}
                          </span>
                        )}
                        {item.selected_size && (
                          <span> • Size: {item.selected_size}</span>
                        )}
                      </div>

                      <div className="mt-2 flex justify-between">
                        <span className="text-sm text-gray-500">
                          Qty: {item.quantity} ×{" "}
                          {newFormatPrice(
                            getCurrentPrice(item.price),
                            currency
                          )}
                        </span>
                        <span className="font-medium">
                          {newFormatPrice(
                            getCurrentPrice(item.price) * item.quantity,
                            currency
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            {order.status === "delivered" && (
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Buy Again
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* Order Summary & Shipping */}
        <div className="md:col-span-1 space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>
                    {newFormatPrice(
                      getCurrentPrice(order.total_amount - order.shipping_fee),
                      currency
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span>
                    {newFormatPrice(
                      getCurrentPrice(order.shipping_fee),
                      currency
                    )}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>
                  {newFormatPrice(
                    getCurrentPrice(order.total_amount),
                    currency
                  )}
                </span>
              </div>

              <div className="text-xs text-gray-500 pt-2">
                <p>
                  Payment Method:{" "}
                  {order.payment_method.includes("card")
                    ? "Credit Card"
                    : order.payment_method}
                </p>
                {order.payment_method.includes("card") && (
                  <p>•••• {order.payment_method.split("card")[1]}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p className="font-medium">{order.address.full_name}</p>
                {order.address.landmark && <p>{order.address.landmark}</p>}
                {order.address.barangay && <p>{order.address.barangay}</p>}
                <p>
                  {order.address.city}, {order.address.province}{" "}
                  {order.address.zip_code}
                </p>
                <p>{order.address.country}</p>
                <p className="mt-1">{order.address.phone_number}</p>
              </div>
            </CardContent>
          </Card>

          {/* Need Help */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
              {order.status !== "delivered" &&
                order.status !== "cancelled" &&
                order.status !== "shipped" &&(
                    <Button
                      variant="outline"
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Cancel Order
                    </Button>
                  )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
