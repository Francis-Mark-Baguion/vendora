"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Tag,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Footer from "@/components/ui/footer";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTwitter,
} from "react-icons/fa";
import { Toaster } from "sonner";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    {
      name: "Products",
      href: "/admin/products",
      icon: ShoppingBag,
      subItems: [
        { name: "All Products", href: "/admin/products" },
        { name: "Add Product", href: "/admin/products/new" },
        { name: "Inventory", href: "/admin/products/inventory" },
      ],
    },
    {
      name: "Categories",
      href: "/admin/categories",
      icon: Tag,
      subItems: [
        { name: "All Categories", href: "/admin/categories" },
        { name: "Add Category", href: "/admin/categories/new" },
      ],
    },
    { name: "Customers", href: "/admin/customers", icon: Users },
    {
      name: "Orders",
      href: "/admin/orders",
      icon: FileText,
      subItems: [
        { name: "All Orders", href: "/admin/orders" },
        { name: "Pending", href: "/admin/orders?status=pending" },
        { name: "Shipped", href: "/admin/orders?status=shipped" },
        { name: "Delivered", href: "/admin/orders?status=delivered" },
        { name: "Cancelled", href: "/admin/orders?status=cancelled" },
      ],
    },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  // Expanded navigation state
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  );

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  if (!isMounted) {
    return <AdminSkeleton />;
  }

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  const NavItem = ({
    item,
    mobile = false,
  }: {
    item: any;
    mobile?: boolean;
  }) => {
    const active = isActive(item.href);
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedItems[item.name];

    return (
      <>
        <div className={`${mobile ? "mb-1" : ""} `}>
          {hasSubItems ? (
            <button
              onClick={() => toggleExpand(item.name)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md ${
                active
                  ? "bg-red-50 text-red-600"
                  : "text-gray-700 hover:text-red-600 hover:bg-red-50"
              } transition-colors`}
            >
              <div className="flex items-center">
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          ) : (
            <Link
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                active
                  ? "bg-red-50 text-red-600"
                  : "text-gray-700 hover:text-red-600 hover:bg-red-50"
              } transition-colors`}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          )}
        </div>

        {/* Sub-items */}
        {hasSubItems && isExpanded && (
          <div className="ml-8 space-y-1 mt-1 mb-2">
            {item.subItems.map((subItem: any) => (
              <Link
                key={subItem.name}
                href={subItem.href}
                className={`block px-3 py-2 text-sm font-medium rounded-md ${
                  pathname === subItem.href
                    ? "bg-red-50 text-red-600"
                    : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                } transition-colors`}
              >
                {subItem.name}
              </Link>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="max-h-7xl bg-gray-50 md:mt-18 mt-12 max-w-7xl mx-auto">
      {/* Mobile sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-50"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <div className="flex h-16 items-center justify-between px-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(false)}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-4rem)] py-4 px-4">
            <nav className="space-y-1">
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} mobile />
              ))}
            </nav>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="px-3 mb-6">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </p>
                {isLoaded && user ? (
                  <div className="mt-3 flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-medium">
                        {user.firstName?.[0] || user.username?.[0] || "A"}
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {user.firstName || user.username || "Admin User"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="ml-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32 mt-1" />
                    </div>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start px-3 text-gray-700 hover:text-red-600"
                onClick={() => signOut()}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign out
              </Button>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="flex h-16 items-center justify-center border-b border-gray-200 px-4">
            <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 space-y-1 px-4 py-4">
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </nav>
            <div className="px-4 py-4 border-t border-gray-200">
              <div className="mb-6">
                <p className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </p>
                {isLoaded && user ? (
                  <div className="mt-3 flex items-center px-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-medium">
                        {user.firstName?.[0] || user.username?.[0] || "A"}
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {user.firstName || user.username || "Admin User"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center px-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="ml-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32 mt-1" />
                    </div>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start px-3 text-gray-700 hover:text-red-600"
                onClick={() => signOut()}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#fff",
              color: "#000",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              borderRadius: "8px",
              padding: "16px",
            },
          }}
        />
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8 mb-4">{children}</div>
        </main>
        <NewFooter />
      </div>
    </div>
  );
}

const NewFooter = () => {
  return (
    <footer className="bg-black text-white py-10 px-5 md:px-20">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Exclusive */}
        <div>
          <h2 className="text-lg font-semibold">Exclusive</h2>
          <p className="mt-2">Subscribe</p>
          <p className="text-gray-400 text-sm">Get 10% off your first order</p>
          <div className="mt-3 flex items-center border border-gray-600 rounded-lg overflow-hidden">
            <input
              type="email"
              placeholder="Enter your email"
              className="bg-transparent px-3 py-2 flex-grow focus:outline-none"
            />
            <button className="bg-gray-600 px-4 py-2">&rarr;</button>
          </div>
        </div>

        {/* Support */}
        <div>
          <h2 className="text-lg font-semibold">Support</h2>
          <p className="mt-2 text-gray-400 text-sm">
            Baybay City, Leyte, Philippines.
          </p>
          <p className="text-gray-400 text-sm">Vendora@gmail.com</p>
          <p className="text-gray-400 text-sm">+88015-88888-9999</p>
        </div>

        {/* Account */}
        <div>
          <h2 className="text-lg font-semibold">Account</h2>
          <ul className="mt-2 text-gray-400 text-sm space-y-1">
            <li>My Account</li>
            <li>Login / Register</li>
            <li>Cart</li>
            <li>Wishlist</li>
            <li>Shop</li>
          </ul>
        </div>

        {/* Quick Link */}
        <div>
          <h2 className="text-lg font-semibold">Quick Link</h2>
          <ul className="mt-2 text-gray-400 text-sm space-y-1">
            <li>Privacy Policy</li>
            <li>Terms Of Use</li>
            <li>FAQ</li>
            <li>Contact</li>
          </ul>
        </div>

        {/* Download App */}
        <div>
          <h2 className="text-lg font-semibold">Download App</h2>
          <p className="text-gray-400 text-sm">
            Save $3 with App New User Only
          </p>
          <div className="flex mt-2">
            <div className="w-16 h-16 bg-gray-700" />
            <div className="ml-3 flex flex-col space-y-2">
              <button className="bg-gray-700 px-4 py-2 text-sm">
                Get it on Google Play
              </button>
              <button className="bg-gray-700 px-4 py-2 text-sm">
                Download on the App Store
              </button>
            </div>
          </div>
          {/* Social Icons */}
          <div className="flex space-x-4 mt-4 text-gray-400">
            <FaFacebookF />
            <FaTwitter />
            <FaInstagram />
            <FaLinkedinIn />
          </div>
        </div>
      </div>
      <hr className="border-gray-700 my-6" />
      <p className="text-center text-gray-400 text-sm">
        &copy; Copyright Vendora 2025. All rights reserved
      </p>
    </footer>
  );
};



function AdminSkeleton() {
  return (
    <div className="min-h-7xl min-w-7xl bg-gray-50 flex max-w-7xl mx-auto">
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="h-16 flex items-center justify-center border-b border-gray-200">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex-1 p-4 space-y-2">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col lg:pl-64">
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-8 w-64 mb-6" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
            </div>
            <Skeleton className="h-96 w-full mt-6 rounded-lg" />
          </div>
        </main>
      </div>
    </div>
  );
}
