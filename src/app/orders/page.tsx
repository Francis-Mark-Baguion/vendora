"use client"

import { useUser } from "@clerk/nextjs"
import { useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { newFormatPrice } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CurrencyContext } from "@/context/CurrencyContext"
import { ArrowRight, ChevronDown, Eye, Filter, Package, Search, ShoppingBag } from 'lucide-react'
import { format } from "date-fns"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"

interface Order {
  id: string
  created_at: string
  status: string
  total_amount: number
  shipping_fee: number
  payment_method: string
  items: Array<{
    id: string
    product_id: string
    quantity: number
    price: number
    product: {
      name: string
      image_url: string[]
    }
  }>
}

const statusColors: Record<string, { color: string; bgColor: string }> = {
  pending: { color: "text-yellow-700", bgColor: "bg-yellow-100" },
  processing: { color: "text-blue-700", bgColor: "bg-blue-100" },
  shipped: { color: "text-purple-700", bgColor: "bg-purple-100" },
  delivered: { color: "text-green-700", bgColor: "bg-green-100" },
  cancelled: { color: "text-red-700", bgColor: "bg-red-100" },
}

export default function OrdersPage() {
  const { user } = useUser()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [timeFrame, setTimeFrame] = useState<string>("all")
  const { currency, exchangeRate } = useContext(CurrencyContext)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) return

      try {
        setLoading(true)

        // Get customer ID
        const { data: customerData, error: customerError } = await supabase
          .from("customer")
          .select("id")
          .eq("email", user?.emailAddresses.at(0)?.emailAddress)
          .single()

        if (customerError || !customerData) {
          throw new Error("Customer not found")
        }

        // Base query
        let query = supabase
          .from("order")
          .select(`
            *,
            items:order_item(
              id,
              product_id,
              quantity,
              price,
              product:product_id(
                name,
                image_url
              )
            )
          `)
          .eq("customer_id", customerData.id)

        // Apply time frame filter
        if (timeFrame !== "all") {
          const now = new Date()
          let startDate = new Date()

          switch (timeFrame) {
            case "30days":
              startDate.setDate(now.getDate() - 30)
              break
            case "6months":
              startDate.setMonth(now.getMonth() - 6)
              break
            case "year":
              startDate.setFullYear(now.getFullYear() - 1)
              break
          }

          query = query.gte("created_at", startDate.toISOString())
        }

        // Apply status filter
        if (statusFilter !== "all") {
          query = query.eq("status", statusFilter)
        }

        // Apply sorting
        if (sortBy === "newest") {
          query = query.order("created_at", { ascending: false })
        } else if (sortBy === "oldest") {
          query = query.order("created_at", { ascending: true })
        } else if (sortBy === "highest") {
          query = query.order("total_amount", { ascending: false })
        } else if (sortBy === "lowest") {
          query = query.order("total_amount", { ascending: true })
        }

        const { data, error } = await query

        if (error) throw error

        // Transform data to ensure items is always an array
        const transformedData = (data || []).map(order => ({
          ...order,
          items: order.items || []
        }))
        console.log("Fetched orders:", transformedData)

        setOrders(transformedData)
      } catch (error) {
        console.error("Error fetching orders:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user?.id, statusFilter, sortBy, timeFrame])

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    
    // Search by order ID
    if (order.id.toLowerCase().includes(searchLower)) return true
    
    // Search by product name in items
    return order.items.some(item => 
      item.product?.name?.toLowerCase().includes(searchLower)
    )
  })

  const formatOrderDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy")
  }

  const getTotalItems = (order: Order) => {
    return order.items.reduce((total, item) => total + (item.quantity || 0), 0)
  }

  const getCurrentPrice = (price: number) => {
    return price * exchangeRate
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 mt-24">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl w-full mx-auto px-4 py-8 mt-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Orders</h1>
          <p className="text-gray-500 mt-1">
            View and manage your order history
          </p>
        </div>
        <Link href="/products">
          <Button>
            <ShoppingBag className="mr-2 h-4 w-4" />
            Continue Shopping
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search orders..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter Orders</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <div className="p-2">
                  <p className="text-sm font-medium mb-2">Time Period</p>
                  <Select value={timeFrame} onValueChange={setTimeFrame}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="6months">Last 6 Months</SelectItem>
                      <SelectItem value="year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <DropdownMenuSeparator />
                
                <div className="p-2">
                  <p className="text-sm font-medium mb-2">Status</p>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
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
                
                <DropdownMenuSeparator />
                
                <div className="p-2">
                  <p className="text-sm font-medium mb-2">Sort By</p>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort orders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="highest">Highest Amount</SelectItem>
                      <SelectItem value="lowest">Lowest Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          {renderOrdersList(filteredOrders)}
        </TabsContent>
        
        <TabsContent value="active" className="mt-0">
          {renderOrdersList(
            filteredOrders.filter(order => 
              ["pending", "processing", "shipped"].includes(order.status)
            )
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0">
          {renderOrdersList(
            filteredOrders.filter(order => 
              ["delivered", "cancelled"].includes(order.status)
            )
          )}
        </TabsContent>
      </Tabs>
    </div>
  )

  function renderOrdersList(ordersList: Order[]) {
    if (ordersList.length === 0) {
      return (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No orders found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery 
              ? "Try adjusting your search or filters"
              : "You haven't placed any orders yet"}
          </p>
          {!searchQuery && (
            <Button className="mt-6" asChild>
              <Link href="/products">Start Shopping</Link>
            </Button>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Desktop view */}
        <div className="hidden md:block overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersList.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    #{order.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>{formatOrderDate(order.created_at)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`${statusColors[order.status]?.bgColor} ${statusColors[order.status]?.color} border-0`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{getTotalItems(order)}</TableCell>
                  <TableCell>
                    {newFormatPrice(getCurrentPrice(order.total_amount), currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/orders/${order.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile view */}
        <div className="md:hidden space-y-4">
          {ordersList.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">
                      Order #{order.id.slice(0, 8)}
                    </CardTitle>
                    <CardDescription>
                      {formatOrderDate(order.created_at)}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${statusColors[order.status]?.bgColor} ${statusColors[order.status]?.color} border-0`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Items:</span>
                    <span>{getTotalItems(order)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-500">Total:</span>
                    <span>{newFormatPrice(getCurrentPrice(order.total_amount), currency)}</span>
                  </div>
                </div>
                
                {order.items.length > 0 && (
                  <>
                    <Separator className="my-3" />
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex-shrink-0 w-12 h-12 relative rounded bg-gray-100">
                          {item.product?.image_url?.[0] ? (
                            <Image
                              src={item.product.image_url[0]}
                              alt={item.product.name || "Product image"}
                              fill
                              className="object-cover rounded"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          {item.quantity > 1 && (
                            <span className="absolute -top-2 -right-2 bg-gray-800 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {item.quantity}
                            </span>
                          )}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-600">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/orders/${order.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Order Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }
}