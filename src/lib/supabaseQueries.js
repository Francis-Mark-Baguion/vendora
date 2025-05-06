import { supabase } from "@/lib/supabaseClient";

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
