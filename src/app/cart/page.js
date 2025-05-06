"use client";

import Link from "next/link";
import { Hourglass } from "lucide-react";

const CartPage = () => {
  return (
    <main className="max-w-3xl mx-auto p-10 mt-30 text-center">
      <div className="flex flex-col items-center justify-center bg-white p-10 rounded-2xl shadow-xl border">
        <Hourglass className="w-16 h-16 text-yellow-500 mb-6 animate-pulse" />
        <h1 className="text-3xl font-bold mb-2">Coming Soon</h1>
        <p className="text-gray-600 text-lg mb-6">
          This part is yet to be implemented. Stay tuned!
        </p>
        <Link
          href="/"
          className="inline-block mt-4 text-red-500 hover:text-red-600 font-medium underline"
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  );
};

export default CartPage;
