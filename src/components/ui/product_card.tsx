import { useState, useContext } from "react";
import Link from "next/link";
import { Heart, Eye } from "lucide-react";
import { Product } from "@/models/Product";
import { CurrencyContext } from "@/context/CurrencyContext"; // ✅ Import Currency Context

const ProductCard = ({ product }: { product: Product }) => {
  const [liked, setLiked] = useState(false);
  const { currency, exchangeRate } = useContext(CurrencyContext); // ✅ Use CurrencyContext

  // Convert price based on selected currency
  const convertedPrice = (product.price * exchangeRate).toFixed(2);

  // Select the first image from the JSON array
  const productImage = Array.isArray(product.image_url) ? product.image_url[0] : product.image_url;

  return (
    <Link href={`/product/${product.id}`} className="block">
      <div className="border rounded-lg shadow-md bg-white w-64 h-96 p-4 cursor-pointer flex flex-col 
        transition-transform duration-300 ease-in-out hover:scale-105"> {/* ✅ Added hover effect */}
        
        {/* Image Container */}
        <div className="relative h-40">
          <img
            src={productImage} // ✅ Select the first image from array
            alt={product.name}
            className="w-full h-full object-cover rounded-md"
          />
          {/* Like Button */}
          <button
            className="absolute top-2 right-2 bg-white p-1 rounded-full shadow"
            onClick={(e) => {
              e.stopPropagation(); // Prevent link redirection
              setLiked(!liked);
            }}
          >
            <Heart className={liked ? "text-red-500" : "text-gray-400"} />
          </button>
          {/* Preview Button */}
          <button
            className="absolute top-10 right-2 bg-white p-1 rounded-full shadow"
            onClick={(e) => e.stopPropagation()} // Prevent redirect
          >
            <Eye className="text-gray-400" />
          </button>
        </div>

        {/* Product Details */}
        <div className="flex-grow flex flex-col justify-between mt-2">
          <div>
            <h3 className="text-lg font-semibold truncate">{product.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-2">
              {product.getShortDescription(60)}
            </p>
          </div>

          {/* Price & Stock */}
          <div>
            <div className="text-red-500 font-bold text-lg">
              {currency} {convertedPrice} {/* ✅ Display updated price */}
            </div>

            {/* Rating */}
            <div className="flex items-center mt-1">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={i < Math.round(product.rating) ? "text-yellow-500" : "text-gray-300"}>★</span>
              ))}
              <span className="text-gray-500 text-sm ml-1">
                ({product.rating.toFixed(1)})
              </span>
            </div>

            {/* Stock Indicator */}
            {product.isInStock() ? (
              <span className="text-green-500 text-sm font-medium">In Stock</span>
            ) : (
              <span className="text-red-500 text-sm font-medium">Out of Stock</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
