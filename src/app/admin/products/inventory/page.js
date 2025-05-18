"use client";

import { useState, useEffect, useContext, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getProducts,
  updateProductStock,
  bulkUpdateStock,
  getCategory,
} from "@/lib/supabaseQueries";

import { CurrencyContext } from "@/context/CurrencyContext";
function ShoppingBag(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

export default function InventoryPage() {
  const router = useRouter();

  const { currency, exchangeRate } = useContext(CurrencyContext);
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [stockChanges, setStockChanges] = useState({});
  const [bulkUpdateAmount, setBulkUpdateAmount] = useState(0);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const handleCurrencyChange = (newCurrency) => {
    // Update the currency in the context
    switch (newCurrency) {
      case "USD":
        setCurrencySymbol("$");
        break;
      case "EUR":
        setCurrencySymbol("€");
        break;
      case "PHP":
        setCurrencySymbol("₱");
        break;
      default:
        setCurrencySymbol("$");
    }
  };
  const itemsPerPage = 10;
  useEffect(() => {
    // Re-fetch products when currency or exchange rate changes
    handleCurrencyChange(currency);
    fetchProducts();
  }, [currency, exchangeRate]);
  useEffect(() => {
    // Get query parameters
    const query = searchParams.get("q") || "";
    const stock = searchParams.get("stock") || "all";
    const category = searchParams.get("category") || "all";
    const sort = searchParams.get("sort") || "name";
    const direction = searchParams.get("direction") || "asc";
    const page = Number.parseInt(searchParams.get("page") || "1");

    // Set state from URL parameters
    setSearchQuery(query);
    setStockFilter(stock);
    setCategoryFilter(category);
    setSortField(sort);
    setSortDirection(direction);
    setCurrentPage(page);

    fetchProducts(query, stock, category, sort, direction, page);
  }, [searchParams]);

  async function fetchProducts(
    query = searchQuery,
    stock = stockFilter,
    category = categoryFilter,
    sort = sortField,
    direction = sortDirection,
    page = currentPage
  ) {
    setLoading(true);
    try {
      const data = await getProducts();

      if (Array.isArray(data) && data.length > 0) {
        // Extract unique categories
        const uniqueCategoryIds = [
          ...new Set(data.map((item) => item.category_id)),
        ];
        const uniqueCategories = await Promise.all(
          uniqueCategoryIds.map(async (id) => {
            const category = await getCategory(id);
            return {
              id: id,
              name: category?.name || `Category ${id}`,
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

        if (stock !== "all") {
          if (stock === "out") {
            filteredProducts = filteredProducts.filter(
              (product) => product.stock_quantity === 0
            );
          } else if (stock === "low") {
            filteredProducts = filteredProducts.filter(
              (product) =>
                product.stock_quantity > 0 && product.stock_quantity <= 5
            );
          } else if (stock === "in") {
            filteredProducts = filteredProducts.filter(
              (product) => product.stock_quantity > 5
            );
          }
        }

        if (category !== "all") {
          filteredProducts = filteredProducts.filter(
            (product) => product.category_id.toString() === category
          );
        }

        // Sort products
        filteredProducts.sort((a, b) => {
          let aValue = a[sort];
          let bValue = b[sort];

          if (typeof aValue === "string") {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
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

        setProducts(paginatedProducts);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load inventory data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = () => {
    updateUrlAndFetch({
      q: searchQuery,
      page: "1",
    });
  };

  const handleStockFilterChange = (value) => {
    setStockFilter(value);
    updateUrlAndFetch({
      stock: value,
      page: "1",
    });
  };

  const handleCategoryChange = (value) => {
    setCategoryFilter(value);
    updateUrlAndFetch({
      category: value,
      page: "1",
    });
  };

  const handleSort = (field) => {
    const direction =
      field === sortField && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(direction);
    updateUrlAndFetch({
      sort: field,
      direction,
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    updateUrlAndFetch({
      page: page.toString(),
    });
  };

  const updateUrlAndFetch = (params) => {
    const url = new URL(window.location.href);

    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });

    if (!params.hasOwnProperty("q") && searchQuery) {
      url.searchParams.set("q", searchQuery);
    }

    if (!params.hasOwnProperty("stock") && stockFilter !== "all") {
      url.searchParams.set("stock", stockFilter);
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

    router.push(url.pathname + url.search);
  };

  const toggleEditMode = () => {
    if (editMode && hasChanges) {
      if (
        window.confirm(
          "You have unsaved changes. Are you sure you want to exit edit mode?"
        )
      ) {
        setEditMode(false);
        setStockChanges({});
      }
    } else {
      setEditMode(!editMode);
      setStockChanges({});
    }
  };

  const handleStockChange = (productId, newValue) => {
    const numValue = Number.parseInt(newValue, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setStockChanges((prev) => ({
        ...prev,
        [productId]: numValue,
      }));
    }
  };

  const incrementStock = (productId) => {
    const currentProduct = products.find((p) => p.id === productId);
    if (!currentProduct) return;

    const currentStock =
      stockChanges[productId] !== undefined
        ? stockChanges[productId]
        : currentProduct.stock_quantity;
    setStockChanges((prev) => ({
      ...prev,
      [productId]: currentStock + 1,
    }));
  };

  const decrementStock = (productId) => {
    const currentProduct = products.find((p) => p.id === productId);
    if (!currentProduct) return;

    const currentStock =
      stockChanges[productId] !== undefined
        ? stockChanges[productId]
        : currentProduct.stock_quantity;
    if (currentStock > 0) {
      setStockChanges((prev) => ({
        ...prev,
        [productId]: currentStock - 1,
      }));
    }
  };

  const saveChanges = async () => {
    if (!hasChanges) return;

    setSavingChanges(true);
    try {
      const updatePromises = Object.entries(stockChanges).map(
        ([productId, newStock]) => {
          return updateProductStock(Number.parseInt(productId, 10), newStock);
        }
      );

      await Promise.all(updatePromises);

      setProducts((prevProducts) =>
        prevProducts.map((product) => {
          if (stockChanges[product.id] !== undefined) {
            return {
              ...product,
              stock_quantity: stockChanges[product.id],
            };
          }
          return product;
        })
      );

      toast.success(
        `Successfully updated stock for ${
          Object.keys(stockChanges).length
        } product(s).`
      );

      setStockChanges({});
      setEditMode(false);
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Failed to update stock. Please try again.");
    } finally {
      setSavingChanges(false);
    }
  };

  const toggleSelectProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((product) => product.id));
    }
  };

  const applyBulkUpdate = async (operation) => {
    if (selectedProducts.length === 0 || bulkUpdateAmount < 0) return;

    setSavingChanges(true);
    try {
      const updates = selectedProducts
        .map((productId) => {
          const product = products.find((p) => p.id === productId);
          if (!product) return null;

          let newStock;
          switch (operation) {
            case "set":
              newStock = bulkUpdateAmount;
              break;
            case "add":
              newStock = product.stock_quantity + bulkUpdateAmount;
              break;
            case "subtract":
              newStock = Math.max(0, product.stock_quantity - bulkUpdateAmount);
              break;
            default:
              newStock = product.stock_quantity;
          }

          return {
            productId,
            newStock,
          };
        })
        .filter(Boolean);

      await bulkUpdateStock(updates);

      setProducts((prevProducts) =>
        prevProducts.map((product) => {
          const update = updates.find((u) => u.productId === product.id);
          if (update) {
            return {
              ...product,
              stock_quantity: update.newStock,
            };
          }
          return product;
        })
      );

      toast.success(
        `Successfully updated stock for ${selectedProducts.length} product(s).`
      );

      setSelectedProducts([]);
      setBulkUpdateAmount(0);
    } catch (error) {
      console.error("Error performing bulk update:", error);
      toast.error("Failed to perform bulk update. Please try again.");
    } finally {
      setSavingChanges(false);
    }
  };

  const exportInventory = () => {
    const headers = [
      "ID",
      "Product Name",
      "SKU",
      "Category",
      "Price",
      "Stock Quantity",
      "Status",
    ];
    const rows = products.map((product) => [
      product.id,
      product.name,
      `SKU-${product.id}`,
      categories.find((c) => c.id === product.category_id)?.name ||
        `Category ${product.category_id}`,
      product.price.toFixed(2),
      product.stock_quantity,
      product.stock_quantity === 0
        ? "Out of Stock"
        : product.stock_quantity <= 5
        ? "Low Stock"
        : "In Stock",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `inventory-export-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const inventoryStats = useMemo(() => {
    if (products.length === 0)
      return { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 };

    const stats = products.reduce(
      (acc, product) => {
        if (product.stock_quantity === 0) {
          acc.outOfStock += 1;
        } else if (product.stock_quantity <= 5) {
          acc.lowStock += 1;
        } else {
          acc.inStock += 1;
        }
        return acc;
      },
      { total: products.length, inStock: 0, lowStock: 0, outOfStock: 0 }
    );

    return stats;
  }, [products]);

  const hasChanges = Object.keys(stockChanges).length > 0;

  const getStockStatus = (quantity) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (quantity <= 5) {
      return (
        <Badge
          variant="warning"
          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
        >
          Low Stock
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 hover:bg-green-200"
        >
          In Stock
        </Badge>
      );
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
          Inventory Management
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant={editMode ? "default" : "outline"}
            onClick={toggleEditMode}
            disabled={savingChanges}
          >
            {editMode ? "Cancel Editing" : "Edit Stock Levels"}
          </Button>
          {editMode && hasChanges && (
            <Button onClick={saveChanges} disabled={savingChanges}>
              {savingChanges && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          )}
          <Button variant="outline" onClick={exportInventory}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Products
                </p>
                <h3 className="text-2xl font-bold">{inventoryStats.total}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <ShoppingBag className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">In Stock</p>
                <h3 className="text-2xl font-bold">{inventoryStats.inStock}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Low Stock</p>
                <h3 className="text-2xl font-bold">
                  {inventoryStats.lowStock}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Out of Stock
                </p>
                <h3 className="text-2xl font-bold">
                  {inventoryStats.outOfStock}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <XCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
            <Select value={stockFilter} onValueChange={handleStockFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Stock Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock Levels</SelectItem>
                <SelectItem value="in">In Stock &gt;5</SelectItem>
                <SelectItem value="low">Low Stock 1-5</SelectItem>
                <SelectItem value="out">Out of Stock 0</SelectItem>
              </SelectContent>
            </Select>
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

      {selectedProducts.length > 0 && (
        <div className="bg-white p-4 rounded-lg border mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-none">
              <Badge variant="outline" className="px-3 py-1">
                {selectedProducts.length} product
                {selectedProducts.length !== 1 ? "s" : ""} selected
              </Badge>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={bulkUpdateAmount}
                  onChange={(e) =>
                    setBulkUpdateAmount(
                      Math.max(0, Number.parseInt(e.target.value) || 0)
                    )
                  }
                  className="w-24"
                  placeholder="Amount"
                />
                <Tabs defaultValue="set" className="w-auto">
                  <TabsList>
                    <TabsTrigger
                      value="set"
                      onClick={() => applyBulkUpdate("set")}
                      disabled={savingChanges}
                    >
                      Set to
                    </TabsTrigger>
                    <TabsTrigger
                      value="add"
                      onClick={() => applyBulkUpdate("add")}
                      disabled={savingChanges}
                    >
                      Add
                    </TabsTrigger>
                    <TabsTrigger
                      value="subtract"
                      onClick={() => applyBulkUpdate("subtract")}
                      disabled={savingChanges}
                    >
                      Subtract
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            <div className="flex-none">
              <Button
                variant="outline"
                onClick={() => setSelectedProducts([])}
                disabled={savingChanges}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {editMode && (
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={
                        selectedProducts.length === products.length &&
                        products.length > 0
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Product
                    {sortField === "name" && (
                      <ArrowUpDown
                        className={`ml-1 h-4 w-4 ${
                          sortDirection === "desc" ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </div>
                </TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
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
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <TableRow key={i}>
                      {editMode && (
                        <TableCell>
                          <Skeleton className="h-4 w-4" />
                        </TableCell>
                      )}
                      <TableCell>
                        <Skeleton className="h-10 w-10 rounded overflow-hidden bg-gray-100" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </TableCell>
                    </TableRow>
                  ))
              ) : products.length > 0 ? (
                products.map((product) => {
                  const currentStock =
                    stockChanges[product.id] !== undefined
                      ? stockChanges[product.id]
                      : product.stock_quantity;
                  return (
                    <TableRow key={product.id}>
                      {editMode && (
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() =>
                              toggleSelectProduct(product.id)
                            }
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="relative h-10 w-10 rounded overflow-hidden bg-gray-100">
                          <Image
                            src={
                              Array.isArray(product.image_url)
                                ? product.image_url[0]
                                : product.image_url
                            }
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        SKU-{product.id}
                      </TableCell>
                      <TableCell>
                        {categories.find((c) => c.id === product.category_id)
                          ?.name || `Category ${product.category_id}`}
                      </TableCell>
                      <TableCell>
                        {currencySymbol}{" "}
                        {(product.price * exchangeRate).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {editMode ? (
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => decrementStock(product.id)}
                              disabled={currentStock <= 0}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              value={currentStock}
                              onChange={(e) =>
                                handleStockChange(product.id, e.target.value)
                              }
                              className="w-16 h-8 text-center"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => incrementStock(product.id)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span
                            className={
                              currentStock === 0
                                ? "text-red-600 font-medium"
                                : currentStock <= 5
                                ? "text-yellow-600 font-medium"
                                : ""
                            }
                          >
                            {currentStock}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getStockStatus(currentStock)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={editMode ? 8 : 7}
                    className="text-center py-8 text-gray-500"
                  >
                    No products found. Try adjusting your search or filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

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
    </div>
  );
}
