import { supabase } from "@/lib/supabaseClient";
import { create } from "domain";

const DEFAULT_IMAGE = "/default.jpg"; // Path to your default image in `public/` folder

export async function getCarouselImages() {
  let { data, error } = await supabase.storage
    .from("carousel")
    .list(null, { limit: 4 });
  if (error) {
    console.error("Error fetching images:", error);

    return [{ name: "default", url: DEFAULT_IMAGE }]; // Return default image if error
  }

  if (!data || data.length === 0) {
    return [{ name: "default", url: DEFAULT_IMAGE }]; // Return default image if bucket is empty
  }

  // Generate public URLs for each image
  const images = data.map((file) => ({
    name: file.name,
    url: supabase.storage.from("carousel").getPublicUrl(file.name).data
      .publicUrl,
  }));
  console.log("Fetched images:");
  return images;
}

export async function getCartItems(customerId) {
  const { data, error } = await supabase
    .from("cart")
    .select(
      `
            id,
            product_id,
            quantity,
            selected_color,
            selected_size,
            price_at_addition,
            product:product_id (
              id,
              name,
              description,
              price,
              image_url
            )
          `
    )
    .eq("customer_id", customerId);

  if (error) throw error; // Fetch cart items for the given customer ID
  return data; // Returns an array of cart items
}

export async function getCategories() {
  let { data, error } = await supabase.from("category").select("*");

  if (error) {
    console.error("Error fetching categories:", error);
    return []; // Return an empty array if an error occurs
  }

  console.log("Fetched categories:", data);
  return data; // Returns an array of category objects
}
export async function createNewAddress(
  landmark,
  barangay,
  city,
  province,
  country,
  zip_code
) {
  const { data, error } = await supabase
    .from("address")
    .insert([
      {
        landmark,
        barangay,
        city,
        province,
        country,
        zip_code,
      },
    ])
    .select("*")
    .single(); // return the inserted row as a single object

  if (error) {
    console.error("Error creating new address:", error.message);
    return null;
  }

  console.log("Created new address:", data);
  return data;
}

export async function checkProductInCart(
  customerId,
  productId,
  selected_size,
  selected_color
) {
  const { data, error } = await supabase
    .from("cart")
    .select("*")
    .eq("customer_id", customerId)
    .eq("product_id", productId)
    .eq("selected_size", selected_size)
    .eq("selected_color", selected_color)
    .single(); // Fetch a single row

  if (error) {
    return false; // Return null if an error occurs
  }

  console.log("Product in cart:", data);
  return data; // Return the cart item object if it exists, otherwise null
}

export async function getCartItem(
  customerId,
  productId,
  selected_size,
  selected_color
) {
  const { data, error } = await supabase
    .from("cart")
    .select("*")
    .eq("customer_id", customerId)
    .eq("product_id", productId)
    .eq("selected_size", selected_size)
    .eq("selected_color", selected_color)
    .single(); // Fetch a single row

  if (error) {
    console.error("Error fetching cart item:", error);
    return null; // Return null if an error occurs
  }

  console.log("Fetchedsss cart item:", data);

  return data; // Return the cart item object if it exists, otherwise null
}

export async function updateCartProduct(cartItem) {
  const quantity = await getCartItem(
    cartItem.customer_id,
    cartItem.product_id,
    cartItem.selected_size,
    cartItem.selected_color
  );
  if (quantity) {
    cartItem.quantity = quantity.quantity + cartItem.quantity; // Update quantity
  } else {
    console.error("Cart item not found for update:", cartItem);
    // Return null if cart item not found
  }

  const { data, error } = await supabase
    .from("cart")
    .update({
      quantity: cartItem.quantity,
      updated_at: new Date().toISOString(), // Set updated_at to current date and time
    })
    .eq("customer_id", cartItem.customer_id)
    .eq("product_id", cartItem.product_id)
    .eq("selected_size", cartItem.selected_size)
    .eq("selected_color", cartItem.selected_color)
    .select("*")
    .single(); // return the updated row as a single object

  if (error) {
    console.error("Error updating product in cart:", error.message);
    return null;
  }

  console.log("Updated product in cart:", data);
  return data;
}

export async function getShippingFee() {
  const { data, error } = await supabase
    .from("shipping_fee")
    .select("*")
    .single(); // Fetch a single row

  if (error) {
    console.error("Error fetching shipping fee:", error);
    return null; // Return null if an error occurs
  }

  console.log("Fetched shipping fee:", data);
  return data; // Return the shipping fee object
}

export async function getCategory(categoryId) {
  const { data, error } = await supabase
    .from("category")
    .select("*")
    .eq("id", categoryId)
    .single(); // Fetch a single row

  if (error) {
    console.error("Error fetching category:", error);
    return null; // Return null if an error occurs
  }

  console.log("Fetched category:", data);
  return data; // Return the category object
}

export async function addCartProduct(cartItem) {
  if (
    await checkProductInCart(
      cartItem.customer_id,
      cartItem.product_id,
      cartItem.selected_size,
      cartItem.selected_color
    )
  ) {
    console.log("Product already in cart, updating quantity...");
    return await updateCartProduct(cartItem);
  }
  const { data, error } = await supabase
    .from("cart")
    .insert([
      {
        customer_id: cartItem.customer_id,
        product_id: cartItem.product_id,
        quantity: cartItem.quantity,
        selected_color: cartItem.selected_color,
        selected_size: cartItem.selected_size,
        price_at_addition: cartItem.price_at_addition,
        created_at: new Date().toISOString(), // Set created_at to current date and time
        updated_at: new Date().toISOString(), // Set updated_at to current date and time
      },
    ])
    .select("*")
    .single(); // return the inserted row as a single object

  if (error) {
    console.error("Error adding product to cart:", error.message);
    return null;
  }

  console.log("Added product to cart:", data);
  return data;
}

export async function getCustomerByEmail(email) {
  let { data, error } = await supabase
    .from("customer")
    .select("*")
    .eq("email", email)
    .single(); // Fetch a single row

  if (error) {
    console.error("Error fetching customer:", error);
    return null; // Return null if an error occurs
  }

  console.log("Fetched customer:", data);
  return data; // Return the customer object
}

export async function createNewCustomer(
  firstName,
  lastName,
  email,
  phoneNumber,
  addressId
) {
  const { data, error } = await supabase
    .from("customer")
    .insert([
      {
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phoneNumber,
        address_ids: [addressId],
      },
    ])
    .select("*")
    .single(); // return the inserted row as a single object

  if (error) {
    console.error("Error creating new customer:", error.message);
    return null;
  }

  console.log("Created new customer:", data);
  return data;
}

export async function customerExist(email) {
  let { data, error } = await supabase
    .from("customer")
    .select("id")
    .eq("email", email)
    .single(); // Fetch a single row

  if (error) {
    console.error("Error checking customer existence:", error);
    return false; // Return false if an error occurs
  }

  console.log("Customer exists:", data);
  return !!data; // Returns true if customer exists, false otherwise
}

export async function getProducts() {
  let { data, error } = await supabase
    .from("product")
    .select(
      "id, name, description, price, stock_quantity, category_id, image_url, created_at, updated_at, rating, is_featured, available_colors, available_sizes"
    ); // Fetch only necessary columns

  if (error) {
    console.error("Error fetching products:", error);
    return []; // Return an empty array if an error occurs
  }

  console.log("Fetched products:", data);
  return data; // Returns an array of product objects
}

export async function getProductsSearch(searchQuery) {
  let { data, error } = await supabase
    .from("product")
    .select(
      "id, name, description, price, stock_quantity, category_id, image_url, created_at, updated_at, rating, is_featured, available_colors, available_sizes"
    ); // Fetch only necessary columns

  if (error) {
    console.error("Error fetching products:", error);
    return []; // Return an empty array if an error occurs
  }

  console.log("Fetched products:", data);
  for (let i = 0; i < data.length; i++) {
    if (!data[i].name.toLowerCase().includes(searchQuery.toLowerCase())) {
      data.splice(i, 1);
      i--;
    }
  }
  return data; // Returns an array of product objects
}

export async function getAddressByCustomerId(customerId) {
  let { data, error } = await supabase
    .from("address")
    .select("*")
    .eq("id", customerId)
    .single(); // Fetch a single row

  if (error) {
    console.error("Error fetching address by customer ID:", error);
    return null; // Return null if an error occurs
  }

  return data; // Return the address object
}

export async function getProductById(productId) {
  let { data, error } = await supabase
    .from("product")
    .select(
      "id, name, description, price, stock_quantity, category_id, image_url, created_at, updated_at, rating, is_featured, available_colors, available_sizes"
    )
    .eq("id", productId) // Filter by product ID
    .single(); // Fetch a single row

  if (error) {
    console.error(`Error fetching product with ID ${productId}:`, error);
    return null; // Return null if an error occurs
  }

  console.log("Fetched product:", data);
  return data; // Return the product object
}
