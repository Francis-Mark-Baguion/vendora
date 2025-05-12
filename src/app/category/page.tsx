"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ChevronRight, Grid3X3, List } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { getCategories } from "@/lib/supabaseQueries"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Breadcrumbs from "@/components/breadcrumbs"

interface Category {
  id: string
  name: string
  link: string
  description?: string
  image_url?: string
}

export default function Category() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const router = useRouter()
  const { isLoaded } = useUser()

  // Detect if mobile for initial view mode
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode("list")
      } else {
        setViewMode("grid")
      }
    }

    // Set initial value
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Clean up
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    async function fetchCategories() {
      setLoading(true)
      try {
        const data = await getCategories()
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 mt-24 md:mt-12">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin"></div>
            <div className="absolute inset-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-medium text-gray-700">Loading categories...</h2>
          <p className="text-gray-500 text-sm">Just a moment while we prepare everything</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 mt-24 md:mt-12">
          {/* Breadcrumb */}
          <Breadcrumbs/>
      {/* <div className="flex items-center text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-red-600 transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-gray-900">Categories</span>
      </div> */}

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3">Shop by Category</h1>
        <p className="text-gray-600 max-w-3xl text-md md:text-lg">
          Browse our wide selection of products organized by category to find exactly what you're looking for.
        </p>
      </div>

     

      {/* Categories Display */}
      {categories.length > 0 ? (
        <>
          {/* Grid View - Default for Desktop */}
          <div className={`${viewMode === "grid" ? "block" : "hidden"} md:block`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.link}`}
                  className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="relative h-48 w-full bg-gray-100">
                    <Image
                      src={
                        category.image_url ||
                        `/placeholder.svg?height=300&width=400&text=${encodeURIComponent(category.name)}`
                      }
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-xl font-bold text-white">{category.name}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {category.description || `Explore our collection of ${category.name.toLowerCase()} products.`}
                    </p>
                    <div className="flex items-center text-red-600 font-medium text-sm group-hover:text-red-700">
                      <span>Shop Now</span>
                      <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* List View - For Mobile */}
          <div
            className={`${viewMode === "list" || window.innerWidth < 768 ? "block" : "hidden"} md:${viewMode === "list" ? "block" : "hidden"}`}
          >
            <div className="space-y-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.link}`}
                  className="flex items-center bg-white rounded-lg border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all duration-300"
                >
                  <div className="relative h-16 w-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={
                        category.image_url ||
                        `/placeholder.svg?height=100&width=100&text=${encodeURIComponent(category.name[0])}`
                      }
                      alt={category.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-1">
                      {category.description || `Explore our collection of ${category.name.toLowerCase()} products.`}
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-gray-50 p-6 rounded-full mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No categories found</h3>
          <p className="text-gray-600 max-w-md mb-6">
            We couldn't find any categories. Please check back later or contact support if this issue persists.
          </p>
          <Button onClick={() => router.push("/")} variant="outline">
            Return to Home
          </Button>
        </div>
      )}
    </div>
  )
}
