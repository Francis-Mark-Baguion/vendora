"use client";
import { getProducts, getProductsSearch } from "@/lib/supabaseQueries";
import ProductCard from "@/components/ui/product_card";
import Breadcrumbs from "@/components/breadcrumbs";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(8);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const forSearch = searchQuery !== "";

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const productsData = await getProductsSearch(searchQuery);
        if (productsData) {
          setProducts(productsData);
          // Reset to first page when search changes
          setCurrentPage(1);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [searchQuery]);

  // Get current products
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calculate total pages
  const totalPages = Math.ceil(products.length / productsPerPage);

  return (
    <Suspense>
      <div className="container mx-auto px-4 py-6 mt-24 md:mt-12 max-w-7xl min-h-screen">
        <Breadcrumbs />

        {forSearch ? (
          <div className="mb-8">
            <h1 className="text-xl md:text-2xl font-bold">
              Search Results for "{searchQuery}"
            </h1>
            <p className="text-muted-foreground mt-2 text-xs md:text-sm">
              Found {products.length}{" "}
              {products.length === 1 ? "product" : "products"} matching your
              search
            </p>
          </div>
        ) : (
          <div className="mb-8">
            <h1 className="text-xl md:text-2xl font-bold">
              Vendora's Products
            </h1>
            <p className="text-muted-foreground mt-2 text-xs md:text-sm">
              Browse our collection of high-quality products
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium">
              {forSearch
                ? "No products found for your search"
                : "No products found"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {forSearch
                ? "Try a different search term"
                : "Please check back later for our updated inventory"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {currentProducts.map((product) => (
                <div key={product.id} className="flex justify-center">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center gap-2">
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => paginate(pageNumber)}
                        className={`px-3 py-1 rounded-md min-w-[40px] ${
                          currentPage === pageNumber
                            ? "bg-primary text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                        } transition-colors`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <span className="px-2">...</span>
                  )}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <button
                      onClick={() => paginate(totalPages)}
                      className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      {totalPages}
                    </button>
                  )}

                  <button
                    onClick={() =>
                      paginate(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </Suspense>
  );
}
