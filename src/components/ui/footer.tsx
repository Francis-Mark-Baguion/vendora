'use client';

import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';

const Footer = () => {
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
          <p className="mt-2 text-gray-400 text-sm">Baybay City, Leyte, Philippines.</p>
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
          <p className="text-gray-400 text-sm">Save $3 with App New User Only</p>
          <div className="flex mt-2">
            <div className="w-16 h-16 bg-gray-700" />
            <div className="ml-3 flex flex-col space-y-2">
              <button className="bg-gray-700 px-4 py-2 text-sm">Get it on Google Play</button>
              <button className="bg-gray-700 px-4 py-2 text-sm">Download on the App Store</button>
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
      <p className="text-center text-gray-400 text-sm">&copy; Copyright Vendora 2025. All rights reserved</p>
    </footer>
  );
};

export default Footer;
