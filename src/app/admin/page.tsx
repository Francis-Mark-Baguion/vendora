"use client";

import type React from "react";

import { useState, useEffect, useContext } from "react";
import {
  ShoppingBag,
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  getRecentOrders,
  getOrderStats,
  getProductStats,
  getCustomerStats,
} from "@/lib/supabaseQueries";

import { CurrencyContext } from "@/context/CurrencyContext";

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral" | string;
  trendValue?: string;
  loading?: boolean;
}

const StatsCard = ({
  title,
  value,
  description,
  icon,
  trend = "neutral",
  trendValue,
  loading = false,
}: StatsCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-28 mb-1" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center mt-1">
          {trend === "up" && (
            <div className="text-emerald-500 flex items-center text-xs font-medium">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              {trendValue}
            </div>
          )}
          {trend === "down" && (
            <div className="text-rose-500 flex items-center text-xs font-medium">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              {trendValue}
            </div>
          )}
          <p className="text-xs text-gray-500 ml-1">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};

interface RecentOrderProps {
  id: string;
  customer: string;
  date: string;
  amount: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
}

const RecentOrder = ({
  id,
  customer,
  date,
  amount,
  status,
}: RecentOrderProps) => {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="flex items-center py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{customer}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Order #{id} • {date}
        </p>
      </div>
      <div className="ml-4 flex-shrink-0 flex items-center">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        <span className="ml-4 text-sm font-medium text-gray-900">{amount}</span>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { currency, exchangeRate } = useContext(CurrencyContext);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("week");
  const [orderStats, setOrderStats] = useState({
    total: 0,
    revenue: 0,
    trend: "neutral" as "up" | "down" | "neutral",
    trendValue: "0%",
  });
  const [productStats, setProductStats] = useState({
    total: 0,
    outOfStock: 0,
    trend: "neutral" as "up" | "down" | "neutral",
    trendValue: "0%",
  });
  const [customerStats, setCustomerStats] = useState({
    total: 0,
    new: 0,
    trend: "neutral" as "up" | "down" | "neutral",
    trendValue: "0%",
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        // Fetch stats based on timeframe
        const orders = await getOrderStats(timeframe);
        const products = await getProductStats();
        const customers = await getCustomerStats(timeframe);
        const recent = await getRecentOrders(5);

        if (orders) {
          setOrderStats({
            total: orders.count || 0,
            revenue: orders.revenue || 0,
            trend: (["up", "down", "neutral"].includes(orders.trend)
              ? orders.trend
              : "neutral") as "up" | "down" | "neutral",
            trendValue: orders.trendValue || "0%",
          });
        }

        if (products) {
          setProductStats({
            total: products.count || 0,
            outOfStock: products.outOfStock || 0,
            trend: (["up", "down", "neutral"].includes(products.trend)
              ? products.trend
              : "neutral") as "up" | "down" | "neutral",
            trendValue: products.trendValue || "0%",
          });
        }

        if (customers) {
          setCustomerStats({
            total: customers.count || 0,
            new: customers.new || 0,
            trend: (["up", "down", "neutral"].includes(customers.trend)
              ? customers.trend
              : "neutral") as "up" | "down" | "neutral",
            trendValue: customers.trendValue || "0%",
          });
        }

        if (recent && Array.isArray(recent)) {
          setRecentOrders(recent);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [timeframe]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Tabs value={timeframe} onValueChange={setTimeframe} className="w-auto">
          <TabsList>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="year">This Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Total Orders"
          value={loading ? "..." : orderStats.total.toString()}
          description="from previous period"
          icon={<ShoppingBag className="h-5 w-5" />}
          trend={orderStats.trend}
          trendValue={orderStats.trendValue}
          loading={loading}
        />
        <StatsCard
          title="Revenue"
          value={
            loading
              ? "..."
              : `${currency} ${Number(
                  (orderStats.revenue * exchangeRate).toFixed(2)
                ).toLocaleString()}`
          }
          description="from previous period"
          icon={
            currency === "USD" ? (
              <DollarSign className="h-5 w-5" />
            ) : (
              <CreditCard className="h-5 w-5" />
            )
          }
          trend={orderStats.trend}
          trendValue={orderStats.trendValue}
          loading={loading}
        />
        <StatsCard
          title="Products"
          value={
            loading
              ? "..."
              : `${productStats.total} (${productStats.outOfStock} out of stock)`
          }
          description="total products"
          icon={<ShoppingBag className="h-5 w-5" />}
          loading={loading}
        />
        <StatsCard
          title="Customers"
          value={
            loading
              ? "..."
              : `${customerStats.total} (${customerStats.new} new)`
          }
          description="from previous period"
          icon={<Users className="h-5 w-5" />}
          trend={customerStats.trend}
          trendValue={customerStats.trendValue}
          loading={loading}
        />
      </div>

      {/* Recent Orders */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link href="/admin/orders">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <CardDescription>Latest customer orders</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex items-center py-3">
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="flex items-center">
                        <Skeleton className="h-6 w-16 rounded-full mr-4" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                  ))}
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <RecentOrder
                    key={order.id}
                    id={order.id}
                    customer={order.customer_name || "Customer"}
                    date={new Date(order.created_at).toLocaleDateString()}
                    amount={`${currency} ${Number(
                      (order.total_amount * exchangeRate).toFixed(2)
                    ).toLocaleString()}`}
                    status={order.status}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500 text-sm">No recent orders found</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-between">
            <div className="text-sm text-gray-500">
              Showing {recentOrders.length} of {orderStats.total} orders
            </div>
          </CardFooter>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <Link href="/admin/products/new">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-3">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Add New Product</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Create a new product listing
                    </div>
                  </div>
                </div>
              </Button>
            </Link>
            <Link href="/admin/categories/new">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Add New Category</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Create a new product category
                    </div>
                  </div>
                </div>
              </Button>
            </Link>
            <Link href="/admin/orders?status=pending">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 mr-3">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Pending Orders</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      View and process pending orders
                    </div>
                  </div>
                </div>
              </Button>
            </Link>
            <Link href="/admin/products/inventory">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-3">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Inventory Management</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Update stock levels and pricing
                    </div>
                  </div>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
