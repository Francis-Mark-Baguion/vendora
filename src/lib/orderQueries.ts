// lib/orderQueries.ts
import { abortOnSynchronousPlatformIOAccess } from "next/dist/server/app-render/dynamic-rendering";
import { supabase } from "./supabaseClient";

export async function getOrderItems(orderId: string) {
  try {
    const { data, error } = await supabase
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
      .eq("order_id", orderId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching order items:", error);
    return null;
  }
}

export async function getOrderDetails(orderId: string) {
  try {
    const { data, error } = await supabase
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
        ),
        items:order_item(
          *,
          product:product_id(
            id,
            name,
            image_url
          )
        )
      `
      )
      .eq("id", orderId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching order details:", error);
    return null;
  }
}

export async function getOrderWithAddress(orderId: string, customerId: string) {
  try {
    const { data, error } = await supabase
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
      .eq("id", orderId)
      .eq("customer_id", customerId)
      .single();
      console.log("Order with address data:", data);
    if (error) throw error;
    console.log("Order with address error:", error);
    return data;
  } catch (error) {
    console.error("Error fetching order with address:", error);
    return null;
  }
}
