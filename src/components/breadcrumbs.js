"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { useEffect, useState } from "react"
import { getProductById } from "@/lib/supabaseQueries"

export default function Breadcrumbs() {
  const pathname = usePathname()
  const [productNames, setProductNames] = useState({})

  // Skip rendering breadcrumbs on homepage
  if (pathname === "/") return null

  // Create breadcrumb items from the current path
  const pathSegments = pathname.split("/").filter((segment) => segment)

  useEffect(() => {
    // Find all product IDs in the path
    const productIds = pathSegments
      .map((segment, index) => {
        if (index > 0 && pathSegments[index - 1] === "products" && segment) {
         
          return segment
        }
        return null
      })
      .filter(Boolean)

    if (productIds.length > 0) {
      // Fetch product names for all found product IDs
      const fetchProductNames = async () => {
        const names = {}
          for (var id of productIds) {
          
          try {
            const product = await getProductById(id)
            if (product && product.name) {
              names[id] = product.name
              console.log(product.name);
            }
          } catch (error) {
            console.error(`Error fetching product ${id}:`, error)
            names[id] = null
          }
        }
        setProductNames(names)
      }
      fetchProductNames()
    }
  }, [pathname])

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm text-muted-foreground py-4">
      <ol className="flex items-center space-x-2">
        <li>
          <Link href="/" className="flex items-center hover:text-foreground">
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {pathSegments.map((segment, index) => {
          // Create the path for this breadcrumb
          const path = `/${pathSegments.slice(0, index + 1).join("/")}`
          const isLast = index === pathSegments.length - 1

          // Check if this is a product ID (preceded by "product")
          const isProductId = index > 0 && pathSegments[index - 1] === "products"
          
          // Get display text - use product name if available, otherwise format the segment
          let displayText
          if (isProductId && productNames[segment]) {
            displayText = productNames[segment]
          } else {
            displayText = segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
          }

          return (
            <li key={path} className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-1" />
              {isLast ? (
                <span aria-current="page" className="font-medium text-foreground overflow-ellipsis ellipsis">
                  {displayText}
                </span>
              ) : (
                <Link href={path} className="hover:text-foreground overflow-ellipsis ellipsis">
                  {displayText}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}