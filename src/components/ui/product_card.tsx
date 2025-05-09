"use client";
import { useState, useContext, useEffect } from "react";
import Link from "next/link";
import { Heart, Eye } from "lucide-react";
import { Product } from "@/models/Product";
import { CurrencyContext } from "@/context/CurrencyContext";

const ProductCard = ({ product }: { product: Product }) => {
  const [liked, setLiked] = useState(false);
  const { currency, exchangeRate } = useContext(CurrencyContext);
  const [hasStock, setHasStock] = useState(true);

  // Calculate converted price based on exchange rate
  const convertedPrice = (product.price * exchangeRate).toFixed(2);

  // Select the first image from the JSON array
  const productImage = Array.isArray(product.image_url)
    ? product.image_url[0]
    : product.image_url;

  // Set stock status when component mounts
  useEffect(() => {
    setHasStock(product.stock_quantity > 0);
  }, [product.stock_quantity]);

  return (
    <Link href={`/products/${product.id}`} className="block">
      <div
        className={`border rounded-lg shadow-md bg-white w-64 h-96 p-4 cursor-pointer flex flex-col 
        transition-transform duration-300 ease-in-out hover:scale-105
        ${!hasStock ? "opacity-70" : ""}`}
      >
        {/* Out of Stock Badge */}
        {!hasStock && (
          <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
            SOLD OUT
          </div>
        )}

        {/* Image Container */}
        <div className="relative h-40">
          <img
            src={productImage}
            alt={product.name}
            className={`w-full h-full object-cover rounded-md ${
              !hasStock ? "grayscale" : ""
            }`}
          />
          {/* Quick View and Wishlist Icons */}
          
        </div>

        {/* Product Details */}
        <div className="flex-grow flex flex-col justify-between mt-2">
          <div>
            <h3 className="text-lg font-semibold truncate">{product.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-2">
              {product.description}
            </p>
          </div>

          {/* Price & Stock */}
          <div>
            <div className="text-red-500 font-bold text-lg">
              {currency} {Number(convertedPrice).toLocaleString()}
            </div>

            {/* Rating */}
            <div className="flex items-center mt-1">
              {Array.from({ length: 5 }, (_, i) => (
                <span
                  key={i}
                  className={
                    i < Math.round(product.rating)
                      ? "text-yellow-500"
                      : "text-gray-300"
                  }
                >
                  ★
                </span>
              ))}
              <span className="text-gray-500 text-sm ml-1">
                ({product.rating.toFixed(1)})
              </span>
            </div>

            {/* Stock Indicator */}
            <div className="mt-1">
              {hasStock ? (
                <span className="text-green-500 text-sm font-medium">
                  {product.stock_quantity} in stock
                </span>
              ) : (
                <span className="text-red-500 text-sm font-medium">
                  Out of Stock
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
