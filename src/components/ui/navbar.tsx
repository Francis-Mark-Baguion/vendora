'use client';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Heart, ShoppingCart, Menu } from "lucide-react";
import { useState, useContext } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { CurrencyContext } from "@/context/CurrencyContext"; // ✅ Import the Currency Context

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { currency, setCurrency } = useContext(CurrencyContext); // ✅ Use the global currency context

  return (
    <header className="w-full bg-white shadow-md flex items-center justify-between px-4 sm:px-6 md:px-8 py-4 border-b fixed top-0 left-0 z-50">
      {/* Logo */}
      <Image src="/Vendora.png" alt="Vendora Logo" width={150} height={50} className="ml-4 sm:ml-10 md:ml-15 lg:ml-30" />

      {/* Desktop Navigation */}
      <nav className="hidden md:flex space-x-6 text-gray-700">
        <Link href="/" className="font-medium hover:underline">Home</Link>
        <Link href="/contact" className="font-medium hover:underline">Contact</Link>
        <Link href="/about" className="font-medium hover:underline">About</Link>
      </nav>

      {/* Search Bar & Currency Dropdown */}
      <div className="hidden md:flex items-center space-x-4">
        <div className="relative">
          <Input type="text" placeholder="What are you looking for?" className="w-40 sm:w-64 pr-10" />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
        </div>

        {/* Currency Dropdown */}
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)} // ✅ Update global currency
          className="bg-white border border-gray-300 rounded-md px-3 py-1 text-gray-700 focus:outline-none"
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="PHP">PHP</option>
        </select>
      </div>

      {/* Icons & Auth Buttons */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <Heart className="w-5 sm:w-6 h-5 sm:h-6 text-gray-700 cursor-pointer" />
        <ShoppingCart className="w-5 sm:w-6 h-5 sm:h-6 text-gray-700 cursor-pointer" />

        {/* Signed Out State - Show Login/Signup */}
        <SignedOut>
          <SignInButton>
            <Button variant="outline" size="sm" className="hidden sm:inline-block">Log in</Button>
          </SignInButton>
          <SignUpButton>
            <Button size="sm" className="hidden sm:inline-block">Sign up</Button>
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
      {menuOpen && (
        <div className="absolute top-16 left-0 w-full bg-white shadow-md p-4 flex flex-col space-y-3 md:hidden">
          <Link href="/" className="font-medium hover:underline">Home</Link>
          <Link href="/contact" className="font-medium hover:underline">Contact</Link>
          <Link href="/about" className="font-medium hover:underline">About</Link>
          <Input type="text" placeholder="Search..." className="w-full mt-2" />

          {/* Currency Dropdown in Mobile */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)} // ✅ Update global currency
            className="bg-white border border-gray-300 rounded-md px-3 py-1 text-gray-700 focus:outline-none w-full"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="PHP">PHP</option>
          </select>
        </div>
      )}
    </header>
  );
};

export default Navbar;
