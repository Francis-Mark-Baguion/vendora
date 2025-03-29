import { useState, useContext } from "react";
import { Heart, Eye } from "lucide-react";
import { Product } from "@/models/Product";
import { CurrencyContext } from "@/context/CurrencyContext"; // ✅ Import Currency Context

const ProductCard = ({ product }: { product: Product }) => {
  const [liked, setLiked] = useState(false);
  const { currency, exchangeRate } = useContext(CurrencyContext); // ✅ Use CurrencyContext

  // Convert price based on selected currency
  const convertedPrice = (product.price * exchangeRate).toFixed(2);

  return (
    <div className="border rounded-lg p-4 shadow-md bg-white w-64">
      <div className="relative">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-40 object-cover rounded-md"
        />
        <button
          className="absolute top-2 right-2 bg-white p-1 rounded-full shadow"
          onClick={() => setLiked(!liked)}
        >
          <Heart className={liked ? "text-red-500" : "text-gray-400"} />
        </button>
        <button className="absolute top-10 right-2 bg-white p-1 rounded-full shadow">
          <Eye className="text-gray-400" />
        </button>
      </div>

      <h3 className="mt-2 font-semibold">{product.name}</h3>
      <p className="text-sm text-gray-500">{product.getShortDescription(60)}</p>

      <div className="flex items-center space-x-2 mt-1">
        <span className="text-red-500 font-bold">
          {currency} {convertedPrice} {/* ✅ Display updated price */}
        </span>
      </div>

      <div className="flex items-center mt-1">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < Math.round(product.rating) ? "text-yellow-500" : "text-gray-300"}>★</span>
        ))}
        <span className="text-gray-500 text-sm ml-1">({product.rating.toFixed(1)})</span>
      </div>

      {product.isInStock() ? (
        <span className="text-green-500 text-sm font-medium">In Stock</span>
      ) : (
        <span className="text-red-500 text-sm font-medium">Out of Stock</span>
      )}
    </div>
  );
};

export default ProductCard;
