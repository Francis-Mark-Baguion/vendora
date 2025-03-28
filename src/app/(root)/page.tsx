"use client";

import { ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCarouselImages, getCategories } from "@/lib/supabaseQueries"; // Adjust the import path as necessary

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<string[]>(["/default.jpg"]); // Default placeholder
  const [categories, setCategories] = useState<{name: string ; link: string }[]> ([]);

  async function fetchCategories() {
    const data = await getCategories(); // Ensure getCategories returns a properly typed array
    if (Array.isArray(data) && data.length > 0) {
      // Assuming your Supabase table has 'name' and 'slug' fields
      setCategories(data.map((category) => ({
        name: category.name,
        link: `/category/${category.link}`,
      })));
    }
  }

  useEffect(() => {
    async function fetchImagesAndCategories() {
      const images = await getCarouselImages();
      if (Array.isArray(images) && images.length > 0) {
        setSlides(images.map((img) => img.url));
      }

      await fetchCategories(); // Call the renamed function to fetch categories
    }

    fetchImagesAndCategories();
  }, []);

  useEffect(() => {
    if (slides.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [slides]); // Only run when slides change

  return (
    <div>
        <div className="flex flex-col justify-between px-6 md:px-12 lg:px-16 py-4 lg:flex-row">
        {/* Categories Section */}
        <div className="bg-white shadow-md p-4 w-full lg:w-1/4 gap-3 flex flex-col">
          {categories.map((category, index) => (
            <Link
              key={index}
              href={category.link}
              className="flex justify-between items-center py-2 text-gray-700 hover:text-black hover:font-medium transition"
            >
              {category.name}
              <ChevronRight size={18} />
            </Link>
          ))}
        </div>

        {/* Image Carousel Section */}
        <div className="relative w-full lg:w-3/4">
          {/* FIXED: Set a fixed width and height for the image container */}
          <div className="relative w-full max-w-[1400px] h-[300px] md:h-[400px] lg:h-[500px] mx-auto overflow-hidden">
            {slides.length > 0 && (
              <Image
                src={slides[currentSlide] || "/default.jpg"}
                alt="Carousel Image"
                width={1300} // Increased to match new max width
                height={500}
                className="w-full h-full object-cover" // Ensures images fit properly
              />
            )}

            {/* Navigation Dots - Stay at the bottom of the image */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentSlide === index ? "bg-red-500 scale-110" : "bg-gray-400"
                  }`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Best Selling Products Section */}
<div className="w-full mt-8 px-6 md:px-12 lg:px-16">
  <div className="flex justify-between items-center mb-4">
    <div className="flex flex-row">
      <div className="w-8 h-12 bg-red-600 mb-2 mr-3"></div>
      <h2 className="text-2xl font-bold text-red-600">This Month</h2>
    </div>
    <button className="text-red-600 hover:underline flex items-center">
      View All
      <ChevronRight size={18} className="ml-1" />
    </button>
  </div>
  
  <div className="mb-6">
    <h3 className="text-4xl font-semibold">Best Selling Products</h3>
    {/* You can add your product cards/grid here later */}
  </div>
</div>
    </div>
  );
}
