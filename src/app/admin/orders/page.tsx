"use client";

import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Download,
  Printer,
  Clock,
  CheckCircle,
  Truck,
  Package,
  XCircle,
  ChevronDown,
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
import { Badge } from "@/components/ui/badge";
import { getOrders, updateOrderStatus } from "@/lib/supabaseQueries";
import { toast } from "sonner";
import { CurrencyContext } from "@/context/CurrencyContext";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  created_at: string;
  updated_at: string;
  items_count: number;
  payment_method: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const { currency, exchangeRate } = useContext(CurrencyContext);
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currencySymbol, setCurrencySymbol] = useState("$");

  const itemsPerPage = 10;

  const handleCurrencyChange = (newCurrency: string) => {
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

  useEffect(() => {
    handleCurrencyChange(currency);
    fetchOrders();
  }, [currency, exchangeRate]);

  useEffect(() => {
    const query = searchParams.get("q") || "";
    const status = searchParams.get("status") || "all";
    const sort = searchParams.get("sort") || "created_at";
    const direction = searchParams.get("direction") || "desc";
    const page = Number.parseInt(searchParams.get("page") || "1");

    setSearchQuery(query);
    setStatusFilter(status);
    setSortField(sort);
    setSortDirection(direction as "asc" | "desc");
    setCurrentPage(page);

    fetchOrders(query, status, sort, direction as "asc" | "desc", page);
  }, [searchParams]);

  async function fetchOrders(
    query = searchQuery,
    status = statusFilter,
    sort = sortField,
    direction = sortDirection,
    page = currentPage
  ) {
    setLoading(true);
    try {
      const data = await getOrders();

      if (Array.isArray(data) && data.length > 0) {
        let filteredOrders = [...data];

        if (query) {
          filteredOrders = filteredOrders.filter(
            (order) =>
              order.id.toLowerCase().includes(query.toLowerCase()) ||
              order.customer_name.toLowerCase().includes(query.toLowerCase()) ||
              order.customer_email.toLowerCase().includes(query.toLowerCase())
          );
        }

        if (status !== "all") {
          filteredOrders = filteredOrders.filter(
            (order) => order.status === status
          );
        }

        filteredOrders.sort((a, b) => {
          let aValue = a[sort as keyof typeof a];
          let bValue = b[sort as keyof typeof b];

          if (sort === "created_at" || sort === "updated_at") {
            return direction === "asc"
              ? new Date(aValue as string).getTime() -
                  new Date(bValue as string).getTime()
              : new Date(bValue as string).getTime() -
                  new Date(aValue as string).getTime();
          }

          if (typeof aValue === "string") {
            aValue = aValue.toLowerCase();
            bValue = (bValue as string).toLowerCase();
          }

          if (aValue < bValue) return direction === "asc" ? -1 : 1;
          if (aValue > bValue) return direction === "asc" ? 1 : -1;
          return 0;
        });

        const totalItems = filteredOrders.length;
        setTotalPages(Math.ceil(totalItems / itemsPerPage));

        const startIndex = (page - 1) * itemsPerPage;
        const paginatedOrders = filteredOrders.slice(
          startIndex,
          startIndex + itemsPerPage
        );

        setOrders(paginatedOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: Order["status"]) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      toast.success(`Order #${orderId} status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };

  const handleSearch = () => {
    updateUrlAndFetch({
      q: searchQuery,
      page: "1",
    });
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    updateUrlAndFetch({
      status: value,
      page: "1",
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

    if (!params.hasOwnProperty("status") && statusFilter !== "all") {
      url.searchParams.set("status", statusFilter);
    }

    if (!params.hasOwnProperty("sort") && sortField !== "created_at") {
      url.searchParams.set("sort", sortField);
    }

    if (!params.hasOwnProperty("direction") && sortDirection !== "desc") {
      url.searchParams.set("direction", sortDirection);
    }

    if (!params.hasOwnProperty("page") && currentPage !== 1) {
      url.searchParams.set("page", currentPage.toString());
    }

    router.push(url.pathname + url.search);
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "processing":
        return <Package className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (order: Order) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      processing: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      shipped: "bg-purple-100 text-purple-800 hover:bg-purple-200",
      delivered: "bg-green-100 text-green-800 hover:bg-green-200",
      cancelled: "bg-red-100 text-red-800 hover:bg-red-200",
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center">
            <Badge
              variant="outline"
              className={`flex items-center gap-1 font-normal ${variants[order.status]} cursor-pointer`}
            >
              {getStatusIcon(order.status)}
              <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
              <ChevronDown className="h-3 w-3 ml-1" />
            </Badge>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuItem 
            onClick={() => handleStatusUpdate(order.id, "pending")}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4 text-yellow-600" />
            <span>Pending</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleStatusUpdate(order.id, "processing")}
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4 text-blue-600" />
            <span>Processing</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleStatusUpdate(order.id, "shipped")}
            className="flex items-center gap-2"
          >
            <Truck className="h-4 w-4 text-purple-600" />
            <span>Shipped</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleStatusUpdate(order.id, "delivered")}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Delivered</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => handleStatusUpdate(order.id, "cancelled")}
            className="flex items-center gap-2"
          >
            <XCircle className="h-4 w-4 text-red-600" />
            <span>Cancel</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
          Orders
        </h1>
      </div>

      <div className="bg-white p-4 rounded-lg border mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search by order ID, customer name or email..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={handleSearch} className="shrink-0">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("id")}
                >
                  <div className="flex items-center">
                    Order ID
                    {sortField === "id" && (
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
                  onClick={() => handleSort("customer_name")}
                >
                  <div className="flex items-center">
                    Customer
                    {sortField === "customer_name" && (
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
                  onClick={() => handleSort("created_at")}
                >
                  <div className="flex items-center">
                    Date
                    {sortField === "created_at" && (
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
                  onClick={() => handleSort("total_amount")}
                >
                  <div className="flex items-center">
                    Total
                    {sortField === "total_amount" && (
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
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Status
                    {sortField === "status" && (
                      <ArrowUpDown
                        className={`ml-1 h-4 w-4 ${
                          sortDirection === "desc" ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                     <TableRow key={`skeleton-${i}`}>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 ml-auto rounded-full" />
                      </TableCell>
                    </TableRow>
                  ))
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-xs text-gray-500">
                          {order.customer_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {currencySymbol}
                      {(order.total_amount * exchangeRate).toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(order)}</TableCell>
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
                              href={`/admin/orders/${order.id}`}
                              className="flex items-center cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center cursor-pointer">
                            <Printer className="mr-2 h-4 w-4" />
                            Print Invoice
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="flex items-center cursor-pointer">
                            <Download className="mr-2 h-4 w-4" />
                            Download Invoice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-gray-500"
                  >
                    No orders found. Try adjusting your search or filters.
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