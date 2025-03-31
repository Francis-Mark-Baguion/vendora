"use client";

import { useEffect, useState, useContext } from "react";
import { useParams } from "next/navigation";
import { getProductById } from "@/lib/supabaseQueries";
import { Product } from "@/models/Product";
import { CurrencyContext } from "@/context/CurrencyContext"; // ✅ Import the Currency Context

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // ✅ State for main image

  const { currency, exchangeRate } = useContext(CurrencyContext); // ✅ Use global currency

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const productData = await getProductById(id as string);
        if (productData) {
          const newProduct = new Product(
            productData.id,
            productData.name,
            productData.description,
            productData.price * exchangeRate, // ✅ Convert price based on exchange rate
            productData.stock_quantity,
            productData.category_id,
            productData.image_url,
            new Date(productData.created_at),
            new Date(productData.updated_at),
            productData.rating,
            productData.is_featured
          );
          setProduct(newProduct);
          setSelectedImage(newProduct.getFirstImage()); // ✅ Set first image as default
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id, exchangeRate]); // ✅ Re-fetch when currency changes

  if (loading) return <p className="mt-20 text-center text-lg">Loading product details...</p>;
  if (!product) return <p className="mt-20 text-center text-2xl text-red-500">Product not found.</p>;

  return (
    <main className="max-w-7xl mx-auto p-10 grid grid-cols-3 gap-12 mt-20">
      {/* Image Gallery */}
      <div className="col-span-1 flex flex-col items-center">
        <div className="flex flex-col space-y-3">
          {product.image_url.map((img, index) => (
            <img
              key={index}
              src={img}
              alt="thumbnail"
              className={`w-24 h-24 object-cover rounded-md cursor-pointer border-2 transition-all ${
                selectedImage === img ? "border-red-500 scale-105" : "border-gray-300"
              }`}
              onClick={() => setSelectedImage(img)} // ✅ Change main image on click
            />
          ))}
        </div>
      </div>

      {/* Main Product Image */}
      <div className="col-span-1 flex justify-center">
        <img src={selectedImage || product.getFirstImage()} alt={product.name} className="w-full h-96 object-cover rounded-lg shadow-lg" />
      </div>

      {/* Product Details */}
      <div className="col-span-1">
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="text-gray-600 mt-2">{product.getShortDescription()}</p>
        <p className="text-red-500 text-2xl font-bold mt-4">
          {currency} {product.getFormattedPrice()}
        </p>
        <p className={`text-sm font-medium ${product.isInStock() ? "text-green-500" : "text-red-500"}`}>
          {product.isInStock() ? "In Stock" : "Out of Stock"}
        </p>

        {/* Color Selection */}
        <div className="mt-4">
          <p className="font-semibold">Colours:</p>
          <div className="flex space-x-2 mt-2">
            {["#000000", "#FF9999"].map((color) => (
              <button
                key={color}
                className={`w-6 h-6 rounded-full border-2 ${selectedColor === color ? "border-black" : "border-gray-300"}`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
        </div>

        {/* Size Selection */}
        <div className="mt-4">
          <p className="font-semibold">Size:</p>
          <div className="flex space-x-2 mt-2">
            {["XS", "S", "M", "L", "XL"].map((size) => (
              <button
                key={size}
                className={`px-4 py-2 border ${selectedSize === size ? "bg-red-500 text-white" : "border-gray-300"}`}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity Selector & Buy Button */}
        <div className="mt-6 flex items-center space-x-4">
          <div className="flex items-center border px-4 py-2">
            <button onClick={() => setQuantity(quantity > 1 ? quantity - 1 : 1)} className="px-3">-</button>
            <span className="px-5">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-3">+</button>
          </div>
          <button className="bg-red-500 text-white px-6 py-3 rounded-md text-lg font-semibold">Buy Now</button>
          <button className="border p-3 rounded-md text-lg">❤️</button>
        </div>

        {/* Delivery Info */}
        <div className="mt-6 border-t pt-4">
          <p className="font-semibold text-lg">🚚 Free Delivery</p>
          <p className="text-sm text-gray-600">Enter your postal code for Delivery Availability</p>
        </div>
        <div className="mt-2 border-t pt-4">
          <p className="font-semibold text-lg">🔄 Return Policy</p>
          <p className="text-sm text-gray-600">Free 30 Days Delivery Returns.</p>
        </div>
      </div>
    </main>
  );
};

export default ProductPage;
