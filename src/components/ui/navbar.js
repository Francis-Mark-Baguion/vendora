"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, Menu, ChevronDown } from "lucide-react";
import { useState, useContext } from "react";
import Link from "next/link";
import "flag-icons/css/flag-icons.min.css";
import { useCart } from "@/context/CartContext";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { CurrencyContext } from "@/context/CurrencyContext";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense } from "react";

const Navbar = () => {
  const { cartCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useUser();
  const { currency, setCurrency } = useContext(CurrencyContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  
  const isAdminPath = pathname.includes('/admin');

  const handleSearch = (e) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/products");
    }
  };

  return (
    <Suspense>
      <header className="w-full bg-white border-b border-gray-100 fixed top-0 left-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Mobile Menu Button */}
            <div className="flex items-center">
              <Link href={isAdminPath ? "/admin" : "/"} className="flex-shrink-0">
                <Image
                  src="/Vendora.png"
                  alt="Vendora Logo"
                  width={120}
                  height={40}
                  priority
                />
              </Link>
            </div>

            {/* Search Bar - Centered and Expanded */}
            {!isAdminPath && (
              <div className="flex-1 max-w-2xl mx-4 hidden md:block">
                <form onSubmit={handleSearch} className="relative">
                  <Input
                    type="text"
                    placeholder="Search for products, brands, and more..."
                    className="w-full pl-4 pr-10 py-2 rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="default"
                    size="icon"
                    className="absolute right-0 top-0 h-full rounded-l-none"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            )}

            {/* Right Side Actions */}
            <div className="flex items-center space-x-1 md:space-x-4">
              {/* Currency Selector - Hidden in admin */}
              {!isAdminPath && (
                <div className="hidden md:block space-x-2">
                  <div className="relative">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="appearance-none bg-transparent pl-8 pr-4 py-1 text-sm font-medium border border-gray-200 rounded-md hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
                    >
                      <option value="USD">$ USD&nbsp;</option>
                      <option value="EUR">€ EUR&nbsp;</option>
                      <option value="GBP">£ GBP&nbsp;</option>
                      <option value="PHP">₱ PHP&nbsp;</option>
                    </select>
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-sm">
                      {currency === "USD" && (
                        <span title="United States">🇺🇸</span>
                      )}
                      {currency === "EUR" && (
                        <span title="European Union">🇪🇺</span>
                      )}
                      {currency === "GBP" && (
                        <span title="United Kingdom">🇬🇧</span>
                      )}
                      {currency === "PHP" && <span title="Philippines">🇵🇭</span>}
                    </div>
                    <ChevronDown className="absolute ml-4 right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Orders and Cart - Hidden in admin */}
              {!isAdminPath && (
                <>
                  <Link
                    href="/orders"
                    className="p-2 rounded-md hover:bg-gray-50 relative"
                  >
                    <svg
                      className="h-5 w-5 text-gray-700"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                      />
                    </svg>
                  </Link>
                  <Link
                    href="/cart"
                    className="p-2 rounded-md hover:bg-gray-50 relative"
                  >
                    <ShoppingCart className="h-5 w-5 text-gray-700" />
                  </Link>
                </>
              )}

              {/* Auth Buttons - Simplified in admin */}
              {!isAdminPath ? (
                <>
                  <SignedOut>
                    <SignInButton>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hidden sm:inline-block"
                      >
                        Log in
                      </Button>
                    </SignInButton>
                    <SignUpButton>
                      <Button size="sm" className="hidden sm:inline-block">
                        Sign up
                      </Button>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    <UserButton />
                  </SignedIn>
                </>
              ) : (
                <SignedIn>
                  <UserButton afterSignOutUrl="/admin" />
                </SignedIn>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <Menu />
              </Button>
            </div>
          </div>

          {/* Mobile Search - Hidden on desktop and admin */}
          {!isAdminPath && (
            <div className="pb-4 px-2 md:hidden">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-4 pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                >
                  <Search className="h-5 w-5 text-gray-500" />
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-3">
            {!isAdminPath ? (
              <>
                <SignedOut>
                  <div className="grid space-y-2">
                    <SignInButton>
                      <Button variant="outline" className="w-full">
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton>
                      <Button className="w-full">Sign Up</Button>
                    </SignUpButton>
                  </div>
                </SignedOut>
                <SignedIn>
                  <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="relative">
                      <UserButton
                        afterSignOutUrl="/"
                        appearance={{
                          elements: {
                            avatarBox: "h-9 w-9",
                            userButtonPopoverCard: "shadow-lg rounded-lg",
                          },
                        }}
                      />
                    </div>
                    <div className="block">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {user?.firstName || "User"}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {user?.emailAddresses.at(0)?.emailAddress}
                      </p>
                    </div>
                  </div>
                </SignedIn>
                <div className="pt-2">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 pr-8"
                  >
                    <option value="USD">$ USD&nbsp;</option>
                    <option value="EUR">€ EUR&nbsp;</option>
                    <option value="GBP">£ GBP&nbsp;</option>
                    <option value="PHP">₱ PHP&nbsp;</option>
                  </select>
                </div>
              </>
            ) : (
              <SignedIn>
                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="relative">
                    <UserButton
                      afterSignOutUrl="/admin"
                      appearance={{
                        elements: {
                          avatarBox: "h-9 w-9",
                          userButtonPopoverCard: "shadow-lg rounded-lg",
                        },
                      }}
                    />
                  </div>
                  <div className="block">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {user?.firstName || "Admin"}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      Admin Dashboard
                    </p>
                  </div>
                </div>
              </SignedIn>
            )}
          </div>
        )}
      </header>
    </Suspense>
  );
};

export default Navbar;