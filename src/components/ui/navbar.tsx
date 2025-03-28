"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Heart, ShoppingCart, Menu } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white shadow-md flex items-center justify-between px-8 py-4 border-b fixed top-0 left-0 z-50">
      {/* Logo */}
      <h1 className="text-xl font-bold ml-4 sm:ml-10 md:ml-15 lg:ml-30">Vendora</h1>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex space-x-6 text-gray-700">
        <Link href="/" className="font-medium hover:underline">Home</Link>
        <Link href="/contact" className="font-medium hover:underline">Contact</Link>
        <Link href="/about" className="font-medium hover:underline">About</Link>
      </nav>

      {/* Search Bar */}
      <div className="relative hidden md:flex items-center">
        <Input type="text" placeholder="What are you looking for?" className="w-64" />
        <Search className="absolute right-3 text-gray-500 w-5 h-5" />
      </div>

      {/* Icons & Auth Buttons */}
      <div className="flex items-center space-x-4">
        <Heart className="w-6 h-6 text-gray-700 cursor-pointer" />
        <ShoppingCart className="w-6 h-6 text-gray-700 cursor-pointer" />

        {/* Signed Out State - Show Login/Signup */}
        <SignedOut>
          <SignInButton>
            <Button variant="outline" size="sm">Log in</Button>
          </SignInButton>
          <SignUpButton>
            <Button size="sm">Sign up</Button>
          </SignUpButton>
        </SignedOut>

        {/* Signed In State - Show User Avatar */}
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
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

          {/* Auth Buttons in Mobile Menu */}
          <SignedOut>
            <SignInButton>
              <Button variant="outline" size="sm" className="w-full">Log in</Button>
            </SignInButton>
            <SignUpButton>
              <Button size="sm" className="w-full">Sign up</Button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      )}
    </header>
  );
};

export default Navbar;
