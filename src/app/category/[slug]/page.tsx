"use client"

import { useState, useEffect, useContext } from "react"
import { useParams, useRouter } from "next/navigation"
import { Filter, SlidersHorizontal } from "lucide-react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { getCategoryBySlug, getProductsByCategory } from "@/lib/supabaseQueries"
import ProductCard from "@/components/ui/product_card"
import { Product } from "@/models/Product"
import { CurrencyContext } from "@/context/CurrencyContext"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Skeleton } from "@/components/ui/skeleton"
import Breadcrumbs from "@/components/breadcrumbs";

export default function CategoryPage() {
  const params = useParams();

  const slug = params?.slug as string;

  const router = useRouter();
  const { isLoaded, user } = useUser();
  const { currency, exchangeRate } = useContext(CurrencyContext);

  const [category, setCategory] = useState<{
    id: number;
    name: string;
    description: string;
  } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState("featured");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);

  // Fetch category and products
  useEffect(() => {
    async function fetchCategoryData() {
      if (!slug) return;

      setLoading(true);
      try {
        const categoryData = await getCategoryBySlug(slug);
        if (categoryData) {
          setCategory(categoryData);

          const productsData = await getProductsByCategory(categoryData.id);
          if (Array.isArray(productsData)) {
            const productObjects = productsData.map(
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
            setFilteredProducts(productObjects);

            // Extract brands and find max price
            const brands = [
              ...new Set(productObjects.map((p) => p.name.split(" ")[0])),
            ];
            setAvailableBrands(brands);

            const highestPrice = Math.max(
              ...productObjects.map((p) => p.price),
              1000
            );
            setMaxPrice(highestPrice);
            setPriceRange([0, highestPrice]);
          }
        }
      } catch (error) {
        console.error("Error fetching category data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategoryData();
  }, [slug, exchangeRate]);

  // Apply filters and sorting
  useEffect(() => {
    if (products.length === 0) return;

    let result = [...products];

    // Apply brand filter
    if (selectedBrands.length > 0) {
      result = result.filter((product) =>
        selectedBrands.some((brand) =>
          product.name.toLowerCase().startsWith(brand.toLowerCase())
        )
      );
    }

    // Apply price range filter
    result = result.filter(
      (product) =>
        product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Apply sorting
    switch (sortOption) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        result.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "featured":
      default:
        result.sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
        break;
    }

    setFilteredProducts(result);
  }, [products, sortOption, priceRange, selectedBrands]);

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const resetFilters = () => {
    setSelectedBrands([]);
    setPriceRange([0, maxPrice]);
    setSortOption("featured");
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 mt-24 md:mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filter sidebar skeleton */}
          <div className="hidden lg:block space-y-6">
            <Skeleton className="h-8 w-32 mb-6" />
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>

          {/* Main content skeleton */}
          <div className="lg:col-span-3">
            <div className="flex justify-between mb-8">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-48" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-64 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 mt-24 md:mt-12">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="bg-red-50 p-6 rounded-full">
            <svg
              className="w-16 h-16 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            Category Not Found
          </h2>
          <p className="text-gray-600 text-center max-w-md">
            We couldn't find the category you're looking for.
          </p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 mt-24 md:mt-12">
      {/* Breadcrumb */}
      <Breadcrumbs />
      {/* <nav className="flex items-center text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-red-600 transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-gray-900">{category.name}</span>
      </nav> */}

      {/* Category Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-gray-600 max-w-3xl">{category.description}</p>
        )}
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col lg:flex-row gap-8 ">
        {/* Sidebar Filters - Desktop */}
        <div className="hidden lg:block w-64 flex-shrink-0 ">
          <div className="bg-white rounded-xl shadow-xs border  border-gray-100 p-10 sticky top-24">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Reset All
              </Button>
            </div>

            {/* Price Range Filter */}
            <div className="mb-6 ">
              <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
              <div className="px-2">
                <Slider
                  min={0}
                  max={maxPrice}
                  step={1}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="mb-4 "
                />
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {currency} {priceRange[0].toFixed(2)}
                  </span>
                  <span>
                    {currency} {priceRange[1].toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Brand Filter */}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Mobile Filter and Sort Controls */}
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden flex items-center gap-2"
                  >
                    <Filter size={16} />
                    <span>Filters</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                  <SheetHeader className="mb-4">
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>
                      Narrow down products to find exactly what you're looking
                      for
                    </SheetDescription>
                  </SheetHeader>

                  <Accordion type="single" collapsible className="w-full px-2">
                    <AccordionItem value="price">
                      <AccordionTrigger>Price Range</AccordionTrigger>
                      <AccordionContent>
                        <div className="px-2 py-4">
                          <Slider
                            min={0}
                            max={maxPrice}
                            step={1}
                            value={priceRange}
                            onValueChange={setPriceRange}
                            className="mb-4"
                          />
                          <div className="flex items-center justify-between text-sm">
                            <span>
                              {currency} {priceRange[0].toFixed(2)}
                            </span>
                            <span>
                              {currency} {priceRange[1].toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <div className="mt-6 px-2">
                    <Button
                      onClick={resetFilters}
                      variant="outline"
                      className="w-full"
                    >
                      Reset All Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <p className="text-sm text-gray-500  w-full hidden md:flex items-center justify-end">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "product" : "products"}
              </p>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 md:m-0 ml-2">
              <SlidersHorizontal size={16} className="text-gray-500" />
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-gray-50 p-6 rounded-full mb-4">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-600 max-w-md mb-6">
                Try adjusting your filters or browse other categories.
              </p>
              <Button onClick={resetFilters} variant="outline">
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}