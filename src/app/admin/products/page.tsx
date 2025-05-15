"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Edit,
  Trash,
  Eye,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getProducts, deleteProduct, getCategory } from "@/lib/supabaseQueries";
import { Product } from "@/models/Product";

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    // Get query parameters
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "all";
    const sort = searchParams.get("sort") || "name";
    const direction = searchParams.get("direction") || "asc";
    const page = Number.parseInt(searchParams.get("page") || "1");

    // Set state from URL parameters
    setSearchQuery(query);
    setCategoryFilter(category);
    setSortField(sort);
    setSortDirection(direction as "asc" | "desc");
    setCurrentPage(page);

    fetchProducts(query, category, sort, direction as "asc" | "desc", page);
  }, [searchParams]);

  async function fetchProducts(
    query = searchQuery,
    category = categoryFilter,
    sort = sortField,
    direction = sortDirection,
    page = currentPage
  )  {
    setLoading(true);
    try {
      // In a real app, you would pass these parameters to your API
      const data = await getProducts();

      if (Array.isArray(data) && data.length > 0) {
        // Extract unique categories
        const uniqueCategoryIds = [...new Set(data.map((item) => item.category_id))];
        const uniqueCategories = await Promise.all(
          uniqueCategoryIds.map(async (id) => {
            const category = await getCategory(id);
            return {
              id: id,
              name: category?.category_name || `Category ${id}`,
            };
          })
        );

        setCategories(uniqueCategories);

        // Filter products
        let filteredProducts = [...data];

        if (query) {
          filteredProducts = filteredProducts.filter(
            (product) =>
              product.name.toLowerCase().includes(query.toLowerCase()) ||
              product.description.toLowerCase().includes(query.toLowerCase())
          );
        }

        if (category !== "all") {
          filteredProducts = filteredProducts.filter(
            (product) => product.category_id.toString() === category
          );
        }

        // Sort products
        filteredProducts.sort((a, b) => {
          let aValue = a[sort as keyof typeof a];
          let bValue = b[sort as keyof typeof b];

          if (typeof aValue === "string") {
            aValue = aValue.toLowerCase();
            bValue = (bValue as string).toLowerCase();
          }

          if (aValue < bValue) return direction === "asc" ? -1 : 1;
          if (aValue > bValue) return direction === "asc" ? 1 : -1;
          return 0;
        });

        // Pagination
        const totalItems = filteredProducts.length;
        setTotalPages(Math.ceil(totalItems / itemsPerPage));

        const startIndex = (page - 1) * itemsPerPage;
        const paginatedProducts = filteredProducts.slice(
          startIndex,
          startIndex + itemsPerPage
        );

        // Convert to Product objects
        const productObjects = paginatedProducts.map(
          (prod) =>
            new Product(
              prod.id,
              prod.name,
              prod.description,
              prod.price,
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
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = () => {
    updateUrlAndFetch({
      q: searchQuery,
      page: "1", // Reset to first page on new search
    });
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    updateUrlAndFetch({
      category: value,
      page: "1", // Reset to first page on filter change
    });
  };

  const handleSort = (field: string) => {
    const direction =
      field === sortField && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(direction);
    updateUrlAndFetch({
      sort: field,
      direction,
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrlAndFetch({
      page: page.toString(),
    });
  };

  const updateUrlAndFetch = (params: Record<string, string>) => {
    const url = new URL(window.location.href);

    // Update search params
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });

    // Preserve existing params that aren't being updated
    if (!params.hasOwnProperty("q") && searchQuery) {
      url.searchParams.set("q", searchQuery);
    }

    if (!params.hasOwnProperty("category") && categoryFilter !== "all") {
      url.searchParams.set("category", categoryFilter);
    }

    if (!params.hasOwnProperty("sort") && sortField !== "name") {
      url.searchParams.set("sort", sortField);
    }

    if (!params.hasOwnProperty("direction") && sortDirection !== "asc") {
      url.searchParams.set("direction", sortDirection);
    }

    if (!params.hasOwnProperty("page") && currentPage !== 1) {
      url.searchParams.set("page", currentPage.toString());
    }

    // Update URL without reloading the page
    router.push(url.pathname + url.search);
  };

  const confirmDelete = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      setDeleteDialogOpen(false);
      // Refresh products
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
          Products
        </h1>
        <Link href="/admin/products/new">
          <Button className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={handleSearch} className="shrink-0">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Name
                    {sortField === "name" && (
                      <ArrowUpDown
                        className={`ml-1 h-4 w-4 ${
                          sortDirection === "desc" ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("price")}
                >
                  <div className="flex items-center">
                    Price
                    {sortField === "price" && (
                      <ArrowUpDown
                        className={`ml-1 h-4 w-4 ${
                          sortDirection === "desc" ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("stock_quantity")}
                >
                  <div className="flex items-center">
                    Stock
                    {sortField === "stock_quantity" && (
                      <ArrowUpDown
                        className={`ml-1 h-4 w-4 ${
                          sortDirection === "desc" ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </div>
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-10 w-10 rounded" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-6 w-16 mx-auto rounded-full" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 ml-auto rounded-full" />
                      </TableCell>
                    </TableRow>
                  ))
              ) : products.length > 0 ? (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="relative h-10 w-10 rounded overflow-hidden bg-gray-100">
                        <Image
                          src={Array.isArray(product.image_url) ? product.image_url[0] : product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>{product.stock_quantity}</TableCell>
                    <TableCell>
                      {categories.find((c) => c.id === product.category_id)
                        ?.name || `Category ${product.category_id}`}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.stock_quantity > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="mr-1 h-3 w-3" />
                          Out of Stock
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/product/${product.id}`}
                              className="flex items-center cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/products/edit/${product.id}`}
                              className="flex items-center cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                            onClick={() => confirmDelete(product)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-gray-500"
                  >
                    No products found. Try adjusting your search or filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="py-4 border-t">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => handlePageChange(page)}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, currentPage + 1))
                    }
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
