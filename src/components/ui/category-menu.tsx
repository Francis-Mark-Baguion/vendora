"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

// Add proper TypeScript interface for the props
interface Category {
  name: string
  link: string
}

interface CategoryMenuProps {
  categories: Category[]
}

const CategoryMenu = ({ categories }: CategoryMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="lg:sticky lg:top-6 lg:h-full lg:overflow-y-auto w-full lg:w-72 flex-shrink-0">
      {/* Clickable header for mobile */}
      <div
        className="lg:hidden bg-white rounded-xl shadow-xs border border-gray-100 p-5 mb-2 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-xl font-bold text-gray-900 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Shop Categories
          </div>
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isOpen ? "M6 18L18 6M6 6l12 12" : "M19 9l-7 7-7-7"}
            />
          </svg>
        </h3>
      </div>

      {/* Menu content - hidden on mobile unless isOpen is true */}
      <div
        className={`${
          isOpen ? "block" : "hidden"
        } lg:block bg-white rounded-xl shadow-xs border border-gray-100 p-5 h-full`}
      >
        {/* Desktop heading - only shown on desktop */}
        <h3 className="hidden lg:flex text-xl font-bold text-gray-900 mb-5 items-center">
          <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Shop Categories
        </h3>
        <div className="space-y-1.5">
          {categories && categories.length > 0 ? (
            categories.map((category, index) => (
              <Link
                key={index}
                href={category.link}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-red-50 transition-colors duration-200 group"
              >
                <span className="text-gray-700 group-hover:text-red-600 font-medium transition-colors">
                  {category.name}
                </span>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-red-500 transition-colors" />
              </Link>
            ))
          ) : (
            <p className="text-gray-500 text-sm py-2">No categories available</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default CategoryMenu
