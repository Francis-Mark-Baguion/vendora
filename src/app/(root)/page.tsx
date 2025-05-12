"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { customerExist } from "@/lib/supabaseQueries";
import {
  getCarouselImages,
  getCategories,
  getProducts,
} from "@/lib/supabaseQueries";
import ProductCard from "@/components/ui/product_card";
import { Product } from "@/models/Product";
import { CurrencyContext } from "@/context/CurrencyContext";

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<string[]>(["/default.jpg"]);
  const [categories, setCategories] = useState<
    { name: string; link: string }[]
  >([]);
  const [products, setProducts] = useState<Product[]>([]);
  const { isLoaded, user } = useUser();
  const { redirectToSignIn } = useClerk();
  const router = useRouter();
  const { currency, exchangeRate } = useContext(CurrencyContext);

  async function checkAndRedirect() {
    if (!isLoaded) return;

    if (!user) {
      redirectToSignIn();
      return;
    }

    try {
      const exists = await customerExist(
        user.primaryEmailAddress?.emailAddress || ""
      );
      if (!exists) {
        router.push("/info");
      }
    } catch (error) {
      console.error("Error checking customer:", error);
    }
  }

  async function fetchCategories() {
    const data = await getCategories();
    if (Array.isArray(data) && data.length > 0) {
      setCategories(
        data.map((category) => ({
          name: category.name,
          link: `/category/${category.link}`,
        }))
      );
    }
  }

  async function fetchProducts() {
    const data = await getProducts();
    if (Array.isArray(data) && data.length > 0) {
      const productObjects = data.map(
        (prod) =>
          new Product(
            prod.id,
            prod.name,
            prod.description,
            prod.price * exchangeRate,
            prod.stock_quantity,
            prod.category_id,
            prod.image_url,
            new Date(prod.created_at),
            new Date(prod.updated_at),
            prod.rating,
            prod.is_featured
          )
      );
      setProducts(productObjects);
    }
  }

  useEffect(() => {
    checkAndRedirect();

    async function fetchData() {
      const images = await getCarouselImages();
      if (Array.isArray(images) && images.length > 0) {
        setSlides(images.map((img) => img.url));
      }
      await fetchCategories();
      await fetchProducts();
    }

    fetchData();
  }, [isLoaded, user, exchangeRate]);

  useEffect(() => {
    if (slides.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [slides]);

  const LoadingState = () => {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 mt-24 md:mt-12">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="relative w-24 h-24">
            {/* Animated spinner */}
            <div className="absolute inset-0 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin"></div>
            {/* Optional logo */}
            <div className="absolute inset-4 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeWidth="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-medium text-gray-700">
            Loading product...
          </h2>
          <p className="text-gray-500 text-sm">
            Just a moment while we prepare everything
          </p>
        </div>
      </div>
    );
  };

  if (!isLoaded) {
    return <LoadingState />;
  }

  return (
    <div className=" max-w-7xl mx-auto mt-24">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
          {/* Categories Section - Modern Sidebar */}
          <div className="lg:sticky lg:top-6 lg:h-full lg:overflow-y-auto w-full lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 h-full">
              <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                Shop Categories
              </h3>
              <div className="space-y-1.5">
                {categories.map((category, index) => (
                  <Link
                    key={index}
                    href={category.link}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-red-50 transition-colors duration-200 group"
                  >
                    <span className="text-gray-700 group-hover:text-red-600 font-medium transition-colors">
                      {category.name}
                    </span>
                    <ChevronRight
                      size={16}
                      className="text-gray-400 group-hover:text-red-500 transition-colors"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Carousel Section - Hero Area */}
          <div className="flex-1">
            <div className="relative w-full aspect-[16/7] rounded-xl overflow-hidden shadow-xs">
              {slides.length > 0 && (
                <Image
                  src={slides[currentSlide] || "/default.jpg"}
                  alt="Carousel Image"
                  fill
                  className="object-cover transition-opacity duration-300"
                  priority
                />
              )}

              {/* Navigation Controls */}
              {slides.length > 1 && (
                <>
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {slides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          currentSlide === index
                            ? "bg-white scale-125 shadow-xs"
                            : "bg-white/50 hover:bg-white/80"
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentSlide(
                        currentSlide - 1 < 0 ? 0 : currentSlide - 1
                      )
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-xs backdrop-blur-sm transition-all"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft size={20} className="text-gray-700" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentSlide((currentSlide + 1) % slides.length)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-xs backdrop-blur-sm transition-all"
                    aria-label="Next slide"
                  >
                    <ChevronRight size={20} className="text-gray-700" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Best Selling Products Section */}
      <div className="w-full mt-8 px-6 md:px-12 lg:px-16">
        <div className="mb-12">
          {/* Section Header */}
          <div className="flex justify-between items-end mb-8">
            <div>
              <div className="flex items-center mb-2">
                <div className="w-3 h-8 bg-red-600 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-red-600 uppercase tracking-wider">
                  Trending Now
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Best Selling Products
              </h2>
            </div>
            <Link
              href="/products"
              className="flex items-center text-gray-600 hover:text-red-600 transition-colors group"
            >
              <span className="font-medium">View All</span>
              <ChevronRight
                size={18}
                className="ml-1 transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>

          {/* Product Grid */}
          <div className="grid mx-auto grid-cols-1 md:grid-cols-2 lg:grid-cols-4  gap-4 md:gap-6">
            {products.length > 0
              ? products.map((product) => (
                  <div className="hover:shadow-sm transition-shadow duration-200 mx-auto">
                    <ProductCard key={product.id} product={product} />
                  </div>
                ))
              : // Skeleton Loaders
                Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl overflow-hidden border border-gray-100 animate-pulse"
                  >
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-100 rounded-full w-3/4"></div>
                      <div className="h-3 bg-gray-100 rounded-full w-full"></div>
                      <div className="h-3 bg-gray-100 rounded-full w-2/3"></div>
                      <div className="pt-4">
                        <div className="h-5 bg-gray-200 rounded-full w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
