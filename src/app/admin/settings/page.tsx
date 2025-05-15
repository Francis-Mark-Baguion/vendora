"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CalendarDays, Construction } from "lucide-react";
import Link from "next/link";

export default function ComingSoonPage() {
  return (
    <div className=" bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-2 max-w-7xl max-h-screen mx-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-50 rounded-full">
              <Construction className="h-12 w-12 text-blue-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Under Construction
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            We're working hard to bring you this feature. Please check back
            soon!
          </p>

          <div className="flex items-center justify-center gap-3 bg-blue-50 rounded-lg p-4 mb-8">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            <span className="text-blue-600 font-medium">
              Expected launch: December 2025
            </span>
          </div>

          <div className="grid grid-cols-1  gap-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin">Back to Home</Link>
            </Button>
           
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-4">
            <span className="text-sm text-gray-500">Need help right away?</span>
            <Button variant="link" className="text-blue-600 p-0 h-auto">
              Contact Support
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mt-8 text-center"
      >
        <p className="text-gray-500 text-sm">
          We appreciate your patience while we build something amazing for you.
        </p>
      </motion.div>
    </div>
  );
}
