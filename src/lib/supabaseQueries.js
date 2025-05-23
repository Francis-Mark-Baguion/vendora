import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@clerk/nextjs";

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
  full_name,
  phone_number,
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
        full_name,
        phone_number,
        is_default: true, // Set is_default to true
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

export async function getCustomerByUserId(userId) {
  let { data, error } = await supabase
    .from("customer")
    .select("*")
    .eq("clerk_user_id", userId) // Use the user ID from Clerk
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
  addressId,
  userId // Use the user ID from Clerk
) {
  const isExist = await checkCustomerAccount(userId); // Check if customer account exists
  if (isExist) {
    console.error("Customer account already exists for this user ID:", userId);
    return null; // Return null if customer account already exists
  }
  const { data, error } = await supabase
    .from("customer")
    .insert([
      {
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phoneNumber,
        address_ids: [addressId],
        clerk_user_id: userId, // Use the user ID from Clerk
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
export async function checkCustomerAccount(userId) {
  if (!userId) {
    console.error("No user ID provided");
    return null;
  }

  const { data, error } = await supabase
    .from("customer")
    .select("*")
    .eq("clerk_user_id", userId)
    .maybeSingle(); // Use maybeSingle instead of single to handle null cases

   
  if (error) {
    console.error("Error checking customer account:", error);
    return null;
  }
  if (data === null) {
    console.log("No customer account found for user ID:", userId);
    return null; // Return null if no customer account is found
  }
  return data;
}
export async function customerExist(email) {
  console.log(email);
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

export async function emailExist(email) {
  let { data, error } = await supabase
    .from("customer")
    .select("id")
    .eq("email", email)
    .single(); // Fetch a single row

  if (error) {
    console.error("Error checking email existence:", error);
    return false; // Return false if an error occurs
  }
  console.log("Email exists:", data);
  return !!data; // Returns true if email exists, false otherwise
}

export async function createCategory(categoryData) {
  const { data, error } = await supabase
    .from("category")
    .insert([
      {
        name: categoryData.name,
        description: categoryData.description,
        link: "/" + categoryData.name.toLowerCase().replace(/\s+/g, "-"), // Create a slug from the name
        image_url: categoryData.image_url,
        has_size: categoryData.has_size,
      },
    ])
    .select("*")
    .single(); // return the inserted row as a single object

  if (error) {
    console.error("Error creating new category:", error.message);
    return null;
  }

  console.log("Created new category:", data);
  return data;
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

export async function getFeaturedProducts(searchQuery) {
  let { data, error } = await supabase
    .from("product")
    .select(
      "id, name, description, price, stock_quantity, category_id, image_url, created_at, updated_at, rating, is_featured, available_colors, available_sizes"
    )
    .eq("is_featured", true); // Only get featured products // Fetch only necessary columns
  console.log("Featured products:", data);
  if (error) {
    console.error("Error fetching products:", error);
    return []; // Return an empty array if an error occurs
  }

  console.log("Fetched featured products:", data);

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

export async function getCategoryBySlug(slug) {
  slug = "/" + slug; // Add '+' to the beginning of the slug
  const { data, error } = await supabase
    .from("category")
    .select("id, name, description")
    .eq("link", slug)
    .single();

  console.log("Fetched category by slug:", data);

  if (error) {
    console.error("Error fetching category by slug:", error);
    return null;
  }

  return data;
}

export async function getProductsByCategory(categoryId) {
  const { data, error } = await supabase
    .from("product")
    .select("*")
    .eq("category_id", categoryId);

  if (error) {
    console.error("Error fetching products by category:", error);
    return [];
  }

  return data;
}

export async function getProductsNumberByCategory(categoryId) {
  const { data, error } = await supabase
    .from("product")
    .select("*")
    .eq("category_id", categoryId);

  if (error) {
    console.error("Error fetching products by category:", error);
    return 0;
  }

  return data.length; // Return the number of products in the category
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

// Admin Dashboard Queries
export async function getOrderStats(timeframe = "week") {
  // Calculate date range based on timeframe
  const now = new Date();
  let fromDate = new Date();

  if (timeframe === "day") {
    fromDate.setDate(now.getDate() - 1);
  } else if (timeframe === "week") {
    fromDate.setDate(now.getDate() - 7);
  } else if (timeframe === "month") {
    fromDate.setMonth(now.getMonth() - 1);
  } else {
    fromDate.setDate(now.getDate() - 7); // default to week
  }

  // Get order count
  const { count } = await supabase
    .from("order")
    .select("*", { count: "exact", head: true })
    .gte("created_at", fromDate.toISOString());

  // Get total revenue
  const { data: revenueData } = await supabase
    .from("order")
    .select("total_amount")
    .gte("created_at", fromDate.toISOString())
    .eq("status", "delivered");

  const revenue =
    revenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

  // Compare with previous period for trend
  const prevFromDate = new Date(fromDate);
  prevFromDate.setDate(
    fromDate.getDate() -
      (timeframe === "day" ? 1 : timeframe === "week" ? 7 : 30)
  );

  const { count: prevCount } = await supabase
    .from("order")
    .select("*", { count: "exact", head: true })
    .gte("created_at", prevFromDate.toISOString())
    .lte("created_at", fromDate.toISOString());

  const { data: prevRevenueData } = await supabase
    .from("order")
    .select("total_amount")
    .gte("created_at", prevFromDate.toISOString())
    .lte("created_at", fromDate.toISOString())
    .eq("status", "delivered");

  const prevRevenue =
    prevRevenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

  // Calculate trends
  const countTrend =
    count && prevCount ? ((count - prevCount) / prevCount) * 100 : 0;
  const revenueTrend =
    revenue && prevRevenue ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;

  return {
    count: count || 0,
    revenue: revenue,
    trend: countTrend >= 0 ? "up" : "down",
    trendValue: `${Math.abs(Math.round(countTrend))}%`,
    revenueTrend: revenueTrend >= 0 ? "up" : "down",
    revenueTrendValue: `${Math.abs(Math.round(revenueTrend))}%`,
  };
}

export async function getProductStats() {
  // Get total product count
  const { count } = await supabase
    .from("product")
    .select("*", { count: "exact", head: true });

  // Get out of stock products
  const { count: outOfStockCount } = await supabase
    .from("product")
    .select("*", { count: "exact", head: true })
    .lte("stock_quantity", 0);

  return {
    count: count || 0,
    outOfStock: outOfStockCount || 0,
    // Note: For trends you'd need historical data to compare
    trend: "up", // You'd calculate this based on your business logic
    trendValue: "0%", // You'd calculate this based on your business logic
  };
}

export async function getCustomerStats(timeframe = "week") {
  // Calculate date range
  const now = new Date();
  let fromDate = new Date();
  fromDate.setDate(
    now.getDate() - (timeframe === "day" ? 1 : timeframe === "week" ? 7 : 30)
  );

  // Get total customer count
  const { count } = await supabase
    .from("customer")
    .select("*", { count: "exact", head: true });

  // Get new customers in timeframe
  const { count: newCustomers } = await supabase
    .from("customer")
    .select("*", { count: "exact", head: true })
    .gte("created_at", fromDate.toISOString());

  // Compare with previous period for trend
  const prevFromDate = new Date(fromDate);
  prevFromDate.setDate(
    fromDate.getDate() -
      (timeframe === "day" ? 1 : timeframe === "week" ? 7 : 30)
  );

  const { count: prevNewCustomers } = await supabase
    .from("customer")
    .select("*", { count: "exact", head: true })
    .gte("created_at", prevFromDate.toISOString())
    .lte("created_at", fromDate.toISOString());

  const trend =
    newCustomers && prevNewCustomers
      ? ((newCustomers - prevNewCustomers) / prevNewCustomers) * 100
      : 0;

  return {
    count: count || 0,
    new: newCustomers || 0,
    trend: trend >= 0 ? "up" : "down",
    trendValue: `${Math.abs(Math.round(trend))}%`,
  };
}

export async function getRecentOrders(limit = 5) {
  const { data: orders, error } = await supabase
    .from("order")
    .select(
      `
      id,
      total_amount,
      status,
      created_at,
      customer:customer_id (
        first_name,
        last_name
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent orders:", error);
    return [];
  }

  return orders.map((order) => ({
    id: order.id,
    customer_name: `${order.customer?.first_name} ${order.customer?.last_name}`,
    created_at: order.created_at,
    total_amount: order.total_amount,
    status: order.status,
  }));
}

// Admin Products Queries
export async function deleteProduct(id) {
  const { error } = await supabase.from("product").delete().eq("id", id);

  if (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Admin Categories Queries
export async function deleteCategory(id) {
  // First check if any products are using this category
  const { count } = await supabase
    .from("product")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id);

  if (count && count > 0) {
    return {
      success: false,
      error: "Cannot delete category with associated products",
    };
  }

  const { error } = await supabase.from("category").delete().eq("id", id);

  if (error) {
    console.error("Error deleting category:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Admin Orders Queries
export async function getOrders() {
  const { data: orders, error } = await supabase
    .from("order")
    .select(
      `
      id,
      total_amount,
      status,
      created_at,
      updated_at,
      payment_method,
      customer:customer_id (
        first_name,
        last_name,
        email
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }

  const ordersWithItems = await Promise.all(
    orders.map(async (order) => {
      const { count, error: itemsError } = await supabase
        .from("order_item")
        .select("*", { count: "exact", head: true })
        .eq("order_id", order.id);

      if (itemsError) {
        console.error(
          `Error counting items for order ${order.id}:`,
          itemsError
        );
        return { ...order, items_count: 0 };
      }

      return { ...order, items_count: count || 0 };
    })
  );

  return ordersWithItems.map((order) => ({
    id: order.id,
    customer_name: `${order.customer?.first_name} ${order.customer?.last_name}`,
    customer_email: order.customer?.email,
    created_at: order.created_at,
    updated_at: order.updated_at,
    total_amount: order.total_amount,
    status: order.status,
    items_count: order.items_count,
    payment_method: order.payment_method,
  }));
}

export async function getCategoryByName(name) {
  const { data, error } = await supabase
    .from("category")
    .select("*")
    .eq("name", name)
    .single(); // Fetch a single row

  if (error) {
    console.error("Error fetching category by name:", error);
    return null; // Return null if an error occurs
  }

  console.log("Fetched category by name:", data);
  return data; // Return the category object
}

export async function createProduct(product) {
  const cat = await getCategory(product.category_id);
  const { data, error } = await supabase
    .from("product")
    .insert([
      {
        name: product.name,
        description: product.description,
        price: product.price,
        stock_quantity: product.stock_quantity,
        category_id: product.category_id,
        image_url: product.image_url,
        rating: product.rating,
        is_featured: product.is_featured,
        available_colors: product.available_colors,
        available_sizes: product.available_sizes,
        category_id: cat.id,
      },
    ])
    .select("*")
    .single(); // return the inserted row as a single object

  if (error) {
    console.error("Error creating new product:", error.message);
    return null;
  }

  console.log("Created new product:", data);
  return data;
}

export async function getDefaultAddress(customerId) {
  const { data, error } = await supabase
    .from("address")
    .select("*")
    .eq("customer_id", customerId)
    .eq("is_default", true)
    .single(); // Fetch a single row

  if (error) {
    console.error("Error fetching default address:", error);
    return null; // Return null if an error occurs
  }

  console.log("Fetched default address:", data);
  return data; // Return the default address object
}

// Admin Customers Queries
export async function getCustomers() {
  const { data: customers, error } = await supabase
    .from("customer")
    .select(
      `
      id,
      first_name,
      last_name,
      email,
      phone_number,
      created_at,
      address_ids
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching customers:", error);
    return [];
  }

  // Get order stats for each customer
  const customersWithStats = await Promise.all(
    customers.map(async (customer) => {
      const { count: ordersCount } = await supabase
        .from("order")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", customer.id);

      const { data: ordersData } = await supabase
        .from("order")
        .select("total_amount")
        .eq("customer_id", customer.id)
        .eq("status", "delivered");

      const totalSpent =
        ordersData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

      const defaultAddress = await getDefaultAddress(customer.id);
      return {
        id: customer.id,
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        phone: customer.phone_number,
        address: defaultAddress
          ? `${defaultAddress.barangay}, ${defaultAddress.city}, ${defaultAddress.province} ${defaultAddress.zip_code}`
          : undefined,
        created_at: customer.created_at,
        orders_count: ordersCount || 0,
        total_spent: totalSpent,
      };
    })
  );

  return customersWithStats;
}

export async function updateProductStock(productId, newStock) {
  // This is a mock implementation
  // In a real app, you would update the product stock in your database

  console.log(`Updating stock for product ${productId} to ${newStock}`);

  const { data, error } = await supabase
    .from("product")
    .update({ stock_quantity: newStock })
    .eq("id", productId)
    .select("*")
    .single(); // return the updated row as a single object

  return data;
}

// Bulk update stock for multiple products
export async function bulkUpdateStock(updates) {
  // This is a mock implementation
  // In a real app, you would update multiple products in your database

  console.log(`Bulk updating stock for ${updates.length} products:`, updates);

  for (var i = 0; i < updates.length; i++) {
    const { productId, newStock } = updates[i];
    const { data, error } = await supabase
      .from("product")
      .update({ stock_quantity: newStock })
      .eq("id", productId)
      .select("*")
      .single(); // return the updated row as a single object

    if (error) {
      console.error(`Error updating stock for product ${productId}:`, error);
    } else {
      console.log(`Updated stock for product ${productId}:`, data);
    }
  }
  return updates;
}

export async function updateOrderStatus(orderId, newStatus) {
  const { data, error } = await supabase
    .from("order")
    .update({ status: newStatus })
    .eq("id", orderId)
    .select("*") // Optional: include if you want the updated order returned
    .single(); // Optional: return a single object instead of array

  if (error) {
    console.error(`Error updating status for order ${orderId}:`, error.message);
    return { success: false, error: error.message };
  }

  console.log(`Order ${orderId} status updated to ${newStatus}`);
  return { success: true, order: data };
}
