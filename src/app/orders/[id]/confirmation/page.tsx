// app/orders/[id]/confirmation/page.tsx
import { OrderConfirmationClient } from "./OrderConfirmationClient";
import { getOrderDetails } from "@/lib/orderQueries";

interface PageProps {
  params: { id: string };
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  // Fetch order data on the server
  const orderData = await getOrderDetails(params.id);

  return (
    <OrderConfirmationClient orderId={params.id} initialOrderData={orderData} />
  );
}

export async function generateMetadata({ params }: PageProps) {
  return {
    title: `Order Confirmation #${params.id.slice(0, 8)}`,
    description: "Your order confirmation details",
  };
}
// "use client";

// import { useEffect, useState } from "react";
// import { useUser } from "@clerk/nextjs";
// import { supabase } from "@/lib/supabaseClient";
// import { newFormatPrice } from "@/lib/utils";
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Check, Package } from "lucide-react";
// import { useContext } from "react";
// import { CurrencyContext } from "@/context/CurrencyContext";

// type PageParams = Promise<{ id: string }>;

// interface OrderDetails {
//   id: string;
//   created_at: string;
//   status: string;
//   total_amount: number;
//   shipping_fee: number;
//   payment_method: string;
//   address: {
//     full_name: string;
//     landmark?: string | null;
//     barangay?: string;
//     city: string;
//     province: string;
//     zip_code: string;
//     country: string;
//     phone_number: string;
//   };
//   items: Array<{
//     id: string;
//     product_id: string;
//     quantity: number;
//     price: number;
//     selected_color: string;
//     selected_size: string;
//     product: {
//       name: string;
//       image_url: string[];
//     };
//   }>;
// }

// export default async function OrderConfirmationPage({
//   params,
// }: {
//   params: PageParams;
// }) {
//   // Await the params promise
//   const { id } = await params;
//   const { user } = useUser();
//   const [order, setOrder] = useState<OrderDetails | null>(null);
//   const [loading, setLoading] = useState(true);
//   const { currency, exchangeRate } = useContext(CurrencyContext);

//   useEffect(() => {
//     const fetchOrderDetails = async () => {
//       if (!user?.id) return;

//       try {
//         setLoading(true);

//         // Get customer ID
//         const { data: customerData } = await supabase
//           .from("customer")
//           .select("id")
//           .eq("email", user?.emailAddresses.at(0)?.emailAddress)
//           .single();

//         if (!customerData) {
//           throw new Error("Customer not found");
//         }

//         // Get order with address
//         const { data: orderData, error: orderError } = await supabase
//           .from("order")
//           .select(
//             `
//             *,
//             address:address_id(
//               full_name,
//               landmark,
//               barangay,
//               city,
//               province,
//               zip_code,
//               country,
//               phone_number
//             )
//           `
//           )
//           .eq("id", id)
//           .eq("customer_id", customerData.id)
//           .single();

//         if (orderError || !orderData) {
//           throw new Error("Order not found");
//         }

//         // Get order items with products
//         const { data: orderItems, error: itemsError } = await supabase
//           .from("order_item")
//           .select(
//             `
//             *,
//             product:product_id(
//               name,
//               image_url
//             )
//           `
//           )
//           .eq("order_id", id);

//         if (itemsError) {
//           throw new Error("Failed to fetch order items");
//         }

//         setOrder({
//           ...orderData,
//           address: {
//             full_name: orderData.address?.full_name || "",
//             landmark: orderData.address?.landmark || null,
//             barangay: orderData.address?.barangay || "",
//             city: orderData.address?.city || "",
//             province: orderData.address?.province || "",
//             zip_code: orderData.address?.zip_code || "",
//             country: orderData.address?.country || "",
//             phone_number: orderData.address?.phone_number || "",
//           },
//           items: orderItems || [],
//         });
//       } catch (error) {
//         console.error("Error fetching order details:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrderDetails();
//   }, [id, user?.id]);

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64 mt-24">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
//       </div>
//     );
//   }

//   if (!order) {
//     return (
//       <div className="max-w-md mx-auto px-4 py-12 text-center">
//         <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
//         <p className="text-gray-600 mb-6">
//           We couldn't find the order you're looking for.
//         </p>
//         <Link href="/products">
//           <Button>Continue Shopping</Button>
//         </Link>
//       </div>
//     );
//   }

//   // Format date
//   const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });

//   return (
//     <div className="max-w-7xl md:w-1/2 w-full  mx-auto px-4 py-12  md:mt-12 mt-24">
//       <div className="text-center mb-8">
//         <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
//           <Check className="h-8 w-8 text-green-600" />
//         </div>
//         <h1 className="text-3xl font-bold">Order Confirmed!</h1>
//         <p className="text-gray-600 mt-2">
//           Thank you for your purchase. Your order has been received.
//         </p>
//       </div>

//       <Card className="mb-8">
//         <CardHeader>
//           <CardTitle>Order #{id.slice(0, 8)}</CardTitle>
//           <CardDescription>Placed on {orderDate}</CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <h3 className="font-medium mb-2">Shipping Address</h3>
//               <div className="text-sm text-gray-600">
//                 <p>{order.address.full_name}</p>
//                 {order.address.landmark && <p>{order.address.landmark}</p>}
//                 {order.address.barangay && <p>{order.address.barangay}</p>}
//                 <p>
//                   {order.address.city}, {order.address.province}{" "}
//                   {order.address.zip_code}
//                 </p>
//                 <p>{order.address.country}</p>
//                 <p className="mt-1">{order.address.phone_number}</p>
//               </div>
//             </div>
//             <div>
//               <h3 className="font-medium mb-2">Order Summary</h3>
//               <div className="space-y-2 text-sm">
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Subtotal</span>
//                   <span>
//                     {newFormatPrice(
//                       (order.total_amount - order.shipping_fee) * exchangeRate,
//                       currency
//                     )}
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Shipping</span>
//                   <span>
//                     {newFormatPrice(
//                       order.shipping_fee * exchangeRate,
//                       currency
//                     )}
//                   </span>
//                 </div>
//                 <div className="flex justify-between font-medium pt-2 border-t">
//                   <span>Total</span>
//                   <span>
//                     {newFormatPrice(
//                       order.total_amount * exchangeRate,
//                       currency
//                     )}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div>
//             <h3 className="font-medium mb-3">Items</h3>
//             <div className="space-y-4">
//               {order.items.map((item) => (
//                 <div key={item.id} className="flex items-center gap-4">
//                   <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
//                     {item.product.image_url?.[0] ? (
//                       <img
//                         src={item.product.image_url[0] || "/placeholder.svg"}
//                         alt={item.product.name}
//                         className="w-full h-full object-cover rounded-md"
//                       />
//                     ) : (
//                       <Package className="h-6 w-6 text-gray-400" />
//                     )}
//                   </div>
//                   <div className="flex-1">
//                     <h4 className="font-medium">{item.product.name}</h4>
//                     <div className="flex justify-between mt-1 text-sm text-gray-600">
//                       <div>
//                         <span>Qty: {item.quantity}</span>
//                         {item.selected_size && (
//                           <span> • Size: {item.selected_size}</span>
//                         )}
//                       </div>
//                       <span>
//                         {newFormatPrice(
//                           item.price * exchangeRate * item.quantity,
//                           currency
//                         )}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </CardContent>
//         <CardFooter className="flex flex-col sm:flex-row gap-4 items-center">
//           <Link href="/orders" className="w-full sm:w-auto">
//             <Button variant="outline" className="w-full">
//               View All Orders
//             </Button>
//           </Link>
//           <Link href="/products" className="w-full sm:w-auto">
//             <Button className="w-full">Continue Shopping</Button>
//           </Link>
//         </CardFooter>
//       </Card>

//       <div className="text-center text-sm text-gray-500">
//         <p>A confirmation email has been sent to your email address.</p>
//         <p className="mt-1">
//           If you have any questions, please contact our{" "}
//           <Link href="/contact" className="text-primary underline">
//             customer support
//           </Link>
//           .
//         </p>
//       </div>
//     </div>
//   );
// }
