"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, Menu, ChevronDown } from "lucide-react";
import { useState, useContext } from "react";
import Link from "next/link";
import "flag-icons/css/flag-icons.min.css";

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

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useUser();
  const { currency, setCurrency } = useContext(CurrencyContext);

  return (
    <header className="w-full bg-white border-b border-gray-100 fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Mobile Menu Button */}
          <div className="flex items-center">
            {/* <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button> */}

            <Link href="/" className="flex-shrink-0">
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
          <div className="flex-1 max-w-2xl mx-4 hidden md:block">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search for products, brands, and more..."
                className="w-full pl-4 pr-10 py-2 rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <Button
                variant="default"
                size="icon"
                className="absolute right-0 top-0 h-full rounded-l-none"
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/*  Currency Selector */}
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
                  {currency === "USD" && <span title="United States">🇺🇸</span>}
                  {currency === "EUR" && <span title="European Union">🇪🇺</span>}
                  {currency === "GBP" && <span title="United Kingdom">🇬🇧</span>}
                  {currency === "PHP" && <span title="Philippines">🇵🇭</span>}
                </div>
                <ChevronDown className="absolute ml-4 right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Cart */}
            <Link
              href="/cart"
              className="p-2 rounded-md hover:bg-gray-50 relative"
            >
              <ShoppingCart className="h-5 w-5 text-gray-700" />
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </Link>

            {/* Auth Buttons */}
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

            {/* Signed In State - Show User Avatar */}
            <SignedIn>
              <UserButton />
            </SignedIn>

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

          {/* Mobile Menu */}
        </div>

        {/* Mobile Search - Hidden on desktop */}
        <div className="pb-4 px-2 md:hidden">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search products..."
              className="w-full pl-4 pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-3">
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
                      avatarBox: "h-9 w-9", // Slightly smaller avatar
                      userButtonPopoverCard: "shadow-lg rounded-lg", // Better popover styling
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
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="USD">$ USD&nbsp;</option>
              <option value="EUR">€ EUR&nbsp;</option>
              <option value="GBP">£ GBP&nbsp;</option>
              <option value="PHP">₱ PHP&nbsp;</option>
            </select>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
