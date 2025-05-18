"use client";

import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";
import { usePathname } from "next/navigation";

const Footer = () => {
  const pathname = usePathname();
  const isAdminRoute = pathname?.includes("/admin");

  if (isAdminRoute) {
    return null;
  }

  return (
    <footer className="bg-black text-white py-10 px-5 md:px-20">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
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
            <li><a href="#">My Account</a></li>
            <li><a href="#">Login / Register</a></li>
            <li><a href="#">Cart</a></li>
            <li><a href="#">Wishlist</a></li>
            <li><a href="#">Shop</a></li>
          </ul>
        </div>

        {/* Quick Link */}
        <div>
          <h2 className="text-lg font-semibold">Quick Link</h2>
          <ul className="mt-2 text-gray-400 text-sm space-y-1">
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms Of Use</a></li>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
      </div>

      {/* Social Icons */}
      <div className="flex justify-center space-x-6 mt-8 text-gray-400 text-2xl">
        <FaFacebookF />
        <FaTwitter />
        <FaInstagram />
        <FaLinkedinIn />
      </div>

      <hr className="border-gray-700 my-6" />
      <p className="text-center text-gray-400 text-sm">
        &copy; Copyright Vendora 2025. All rights reserved
      </p>
    </footer>
  );
};

export default Footer;
