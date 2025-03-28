import { supabase } from "@/lib/supabaseClient";

const DEFAULT_IMAGE = "/default.jpg"; // Path to your default image in `public/` folder

export async function getCarouselImages() {
  let { data, error } = await supabase.storage.from("carousel").list(null, { limit: 4 });
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
    url: supabase.storage.from("carousel").getPublicUrl(file.name).data.publicUrl,
  }));
  console.log("Fetched images:");
  return images;
}

export async function getCategories() {
    let { data, error } = await supabase.from("category").select("name, link"); // Fetch only needed columns
  
    if (error) {
      console.error("Error fetching categories:", error);
      return []; // Return an empty array if an error occurs
    }
  
    console.log("Fetched categories:", data);
    return data; // Returns an array of category objects
  }
