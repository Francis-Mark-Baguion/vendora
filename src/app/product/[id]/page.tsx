"use client";

import { useEffect, useState, useContext } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  getProductById,
  getCustomerByEmail,
  addCartProduct,
} from "@/lib/supabaseQueries";
import { Product } from "@/models/Product";
import { CurrencyContext } from "@/context/CurrencyContext";
import { ShoppingCart } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { user } = useUser();

  const { currency, exchangeRate } = useContext(CurrencyContext);
  const colorHexMap: { [key: string]: string } = {
    Black: "#000000",
    White: "#FFFFFF",
    Red: "#FF0000",
    Blue: "#0000FF",
    Green: "#00FF00",
    Yellow: "#FFFF00",
    Pink: "#FFC0CB",
    Purple: "#800080",
    Gray: "#808080",
    Orange: "#FFA500",
    Brown: "#A52A2A",
    Beige: "#F5F5DC",
    Cyan: "#00FFFF",
    Teal: "#008080",
    Maroon: "#800000",
    Navy: "#000080",
  };

  function getContrastYIQ(hexcolor: string) {
    hexcolor = hexcolor.replace("#", "");
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "black" : "white";
  }
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
            productData.price * exchangeRate,
            productData.stock_quantity,
            productData.category_id,
            productData.image_url,
            new Date(productData.created_at),
            new Date(productData.updated_at),
            productData.rating,
            productData.is_featured,
            productData.available_colors || [], // New property for available colors
            productData.available_sizes || [] // New property for available sizes
          );
          setProduct(newProduct);
          setSelectedImage(newProduct.getFirstImage());
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id, exchangeRate]);

  const handleAddToCart = async () => {
    if (!product) return;

    setIsAddingToCart(true);
    try {
      const productData = await getProductById(id as string);
      console.log("Product Data:", productData);
      // Simulate API call to add to cart
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const userData = await getCustomerByEmail(
        user?.emailAddresses[0].emailAddress || ""
      );
      if (!userData) {
        toast.error("User not found");
        return;
      }

      const cartItem = {
        customer_id: userData.id,
        product_id: productData!.id,
        quantity: quantity,
        selected_color: selectedColor,
        selected_size: selectedSize,
        price_at_addition: product.price, // Store price at time of addition
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = await addCartProduct(cartItem);
      if (!result) {
        toast.error("Failed to add item to cart");
        return;
      }

      // In a real app, you would call your addToCart API here
      // await addToCart(product.id, quantity, selectedSize, selectedColor);

      toast.success(
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-xl">🛒</div>
          <div>
            <p className="font-medium text-gray-900">Added to Cart</p>
            <p className="text-sm text-gray-600">
              {quantity} × {product.name}
            </p>
            <button
              onClick={() => {
                const router = useRouter();
                router.push("/cart");
              }}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
            >
              View Cart →
            </button>
          </div>
        </div>,
        {
          position: "bottom-right",
          duration: 4000,
          style: {
            borderLeft: "4px solid #10B981", // Green accent border
            backgroundColor: "#FFFFFF",
            color: "#1F2937",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            maxWidth: "380px",
          },
          iconTheme: {
            primary: "#10B981", // Green checkmark
            secondary: "#FFFFFF",
          },
        }
      );
    } catch (error) {
      toast.error("Failed to add item to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );

  if (!product)
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-2xl text-red-500">Product not found.</p>
      </div>
    );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-24">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 lg:gap-8 max-w-7xl mx-auto px-4">
        {/* Thumbnail Gallery - First Column */}
        <div className="md:col-span-1 p-4 flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 snap-x snap-mandatory">
          {product.image_url.map((img, index) => (
            <button
              key={index}
              className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden transition-all snap-start ${
                selectedImage === img
                  ? "ring-2 ring-red-500 scale-105 shadow-md"
                  : "ring-1 ring-gray-200 hover:ring-gray-400"
              }`}
              onClick={() => setSelectedImage(img)}
            >
              <img
                src={img}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>

        {/* Main Product Image - Spans Two Columns */}
        <div className="md:col-span-2 flex justify-start items-start bg-gray-50 rounded-xl p-8 w-full h-full min-h-[400px]">
          <img
            src={selectedImage || product.getFirstImage()}
            alt={product.name}
            className="w-full h-full max-h-[600px] object-contain rounded-lg"
            loading="eager"
          />
        </div>

        {/* Product Details - Fourth Column */}
        <div className="md:col-span-2 space-y-6 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {product.name}
            </h1>
            <div className="flex items-center mt-2">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(product.rating)
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-gray-600 ml-2 text-sm">
                ({product.rating.toFixed(1)})
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-gray-700">{product.description}</p>

            <div className=" items-center space-x-2 grid grid-cols-1 md:grid-cols-2">
              <p className="text-2xl font-bold text-red-600">
                {currency} {product.getFormattedPrice()}
              </p>
              {product.stock_quantity > 0 && (
                <span className="bg-green-100 w-1/2 rounded-md text-green-800 text-xs font-medium px-2.5 py-0.5 ">
                  In Stock ({product.stock_quantity})
                </span>
              )}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Color</h3>
            <div className="flex flex-wrap gap-3">
              {product.available_colors.map((color) => {
                const hexColor = colorHexMap[color];
                const isSelected = selectedColor === hexColor;

                return (
                  <button
                    key={color}
                    type="button"
                    className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? "ring-2 ring-offset-1 ring-gray-600"
                        : "hover:ring-1 hover:ring-gray-300"
                    }`}
                    style={{ backgroundColor: hexColor }}
                    onClick={() => setSelectedColor(hexColor)}
                    aria-label={`Select ${color} color`}
                    aria-pressed={isSelected}
                  >
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg
                          className={`w-4 h-4 ${
                            getContrastYIQ(hexColor) === "black"
                              ? "text-gray-900"
                              : "text-white"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="2.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      </span>
                    )}
                    <span className="sr-only">{color}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selection */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">Size</h3>
            <div className="flex flex-wrap gap-2">
              {product.available_sizes.map((size) => (
                <button
                  key={size}
                  className={`px-4 py-2 text-sm border rounded-md transition-all ${
                    selectedSize === size
                      ? "bg-red-600 text-white border-red-600"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">Quantity</h3>
            <div className="flex items-center border border-gray-300 rounded-md w-fit">
              <button
                onClick={() => setQuantity(quantity > 1 ? quantity - 1 : 1)}
                className="px-3 py-2 text-lg hover:bg-gray-100 transition-colors"
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="px-4 py-2 border-x border-gray-300">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 text-lg hover:bg-gray-100 transition-colors"
                disabled={quantity >= product.stock_quantity}
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={handleAddToCart}
              disabled={!product.isInStock() || isAddingToCart}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-md font-medium transition-colors ${
                product.isInStock()
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-gray-300 cursor-not-allowed text-gray-500"
              }`}
            >
              {isAddingToCart ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Adding...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </>
              )}
            </button>

            <button
              onClick={() => {}}
              disabled={!product.isInStock()}
              className={`flex-1 px-6 py-3 rounded-md font-medium transition-colors ${
                product.isInStock()
                  ? "bg-black hover:bg-gray-800 text-white shadow-md hover:shadow-lg"
                  : "bg-gray-200 cursor-not-allowed text-gray-500"
              }`}
            >
              Buy Now
            </button>
          </div>

          {/* Additional Info */}
          <div className="pt-6 space-y-4 border-t border-gray-200">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Free Delivery</p>
                <p className="text-sm text-gray-600">
                  Estimated delivery time: 2-4 business days
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Easy Returns</p>
                <p className="text-sm text-gray-600">
                  30-day return policy. No questions asked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductPage;
// "use client";

// import { useEffect, useState, useContext } from "react";
// import { useParams } from "next/navigation";
// import { getProductById } from "@/lib/supabaseQueries";
// import { Product } from "@/models/Product";
// import { CurrencyContext } from "@/context/CurrencyContext";
// import { ShoppingCart } from "lucide-react";
// import { toast } from "react-hot-toast";

// const ProductPage = () => {
//   const { id } = useParams();
//   const [product, setProduct] = useState<Product | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [quantity, setQuantity] = useState(1);
//   const [selectedColor, setSelectedColor] = useState("#000000");
//   const [selectedSize, setSelectedSize] = useState("M");
//   const [selectedImage, setSelectedImage] = useState<string | null>(null);
//   const [isAddingToCart, setIsAddingToCart] = useState(false);

//   const { currency, exchangeRate } = useContext(CurrencyContext);

//   useEffect(() => {
//     const fetchProduct = async () => {
//       if (!id) return;
//       setLoading(true);
//       try {
//         const productData = await getProductById(id as string);
//         if (productData) {
//           const newProduct = new Product(
//             productData.id,
//             productData.name,
//             productData.description,
//             productData.price * exchangeRate,
//             productData.stock_quantity,
//             productData.category_id,
//             productData.image_url,
//             new Date(productData.created_at),
//             new Date(productData.updated_at),
//             productData.rating,
//             productData.is_featured
//           );
//           setProduct(newProduct);
//           setSelectedImage(newProduct.getFirstImage());
//         } else {
//           setProduct(null);
//         }
//       } catch (error) {
//         console.error("Failed to fetch product:", error);
//       }
//       setLoading(false);
//     };

//     fetchProduct();
//   }, [id, exchangeRate]);

//   const handleAddToCart = async () => {
//     if (!product) return;

//     setIsAddingToCart(true);
//     try {
//       // Simulate API call to add to cart
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       // In a real app, you would call your addToCart API here
//       // await addToCart(product.id, quantity, selectedSize, selectedColor);

//       toast.success(`${quantity} ${product.name} added to cart!`, {
//         position: "bottom-right",
//         icon: '🛒',
//       });
//     } catch (error) {
//       toast.error("Failed to add item to cart");
//     } finally {
//       setIsAddingToCart(false);
//     }
//   };

//   if (loading) return (
//     <div className="flex justify-center items-center h-screen">
//       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
//     </div>
//   );

//   if (!product) return (
//     <div className="flex justify-center items-center h-screen">
//       <p className="text-2xl text-red-500">Product not found.</p>
//     </div>
//   );

//   return (
//     <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
//         {/* Image Gallery */}
//         <div className="lg:col-span-1 flex flex-col-reverse sm:flex-row lg:flex-col gap-4">
//           <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0">
//             {product.image_url.map((img, index) => (
//               <button
//                 key={index}
//                 className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden transition-all ${
//                   selectedImage === img ? "ring-2 ring-red-500 scale-105" : "ring-1 ring-gray-200"
//                 }`}
//                 onClick={() => setSelectedImage(img)}
//               >
//                 <img
//                   src={img}
//                   alt="thumbnail"
//                   className="w-full h-full object-cover"
//                 />
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Main Product Image */}
//         <div className="lg:col-span-1 flex justify-center bg-gray-50 rounded-lg p-4">
//           <img
//             src={selectedImage || product.getFirstImage()}
//             alt={product.name}
//             className="w-full max-h-[500px] object-contain rounded-lg"
//           />
//         </div>

//         {/* Product Details */}
//         <div className="lg:col-span-1 space-y-6">
//           <div>
//             <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{product.name}</h1>
//             <div className="flex items-center mt-2">
//               {[...Array(5)].map((_, i) => (
//                 <svg
//                   key={i}
//                   className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
//                   fill="currentColor"
//                   viewBox="0 0 20 20"
//                 >
//                   <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//                 </svg>
//               ))}
//               <span className="text-gray-600 ml-2 text-sm">({product.rating.toFixed(1)})</span>
//             </div>
//           </div>

//           <div className="space-y-4">
//             <p className="text-gray-700">{product.description}</p>

//             <div className="flex items-center space-x-2">
//               <p className="text-2xl font-bold text-red-600">
//                 {currency} {product.getFormattedPrice()}
//               </p>
//               {product.stock_quantity > 0 && (
//                 <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
//                   In Stock ({product.stock_quantity})
//                 </span>
//               )}
//             </div>
//           </div>

//           {/* Color Selection */}
//           <div className="space-y-2">
//             <h3 className="text-sm font-medium text-gray-900">Color</h3>
//             <div className="flex flex-wrap gap-2">
//               {["#000000", "#FF9999"].map((color) => (
//                 <button
//                   key={color}
//                   className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
//                     selectedColor === color ? "ring-2 ring-offset-2 ring-gray-400" : ""
//                   }`}
//                   style={{ backgroundColor: color }}
//                   onClick={() => setSelectedColor(color)}
//                 >
//                   {selectedColor === color && (
//                     <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
//                     </svg>
//                   )}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Size Selection */}
//           <div className="space-y-2">
//             <h3 className="text-sm font-medium text-gray-900">Size</h3>
//             <div className="flex flex-wrap gap-2">
//               {["XS", "S", "M", "L", "XL"].map((size) => (
//                 <button
//                   key={size}
//                   className={`px-4 py-2 text-sm border rounded-md transition-all ${
//                     selectedSize === size
//                       ? "bg-red-600 text-white border-red-600"
//                       : "border-gray-300 hover:border-gray-400"
//                   }`}
//                   onClick={() => setSelectedSize(size)}
//                 >
//                   {size}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Quantity Selector */}
//           <div className="space-y-2">
//             <h3 className="text-sm font-medium text-gray-900">Quantity</h3>
//             <div className="flex items-center border border-gray-300 rounded-md w-fit">
//               <button
//                 onClick={() => setQuantity(quantity > 1 ? quantity - 1 : 1)}
//                 className="px-3 py-2 text-lg hover:bg-gray-100 transition-colors"
//                 disabled={quantity <= 1}
//               >
//                 -
//               </button>
//               <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
//               <button
//                 onClick={() => setQuantity(quantity + 1)}
//                 className="px-3 py-2 text-lg hover:bg-gray-100 transition-colors"
//                 disabled={quantity >= product.stock_quantity}
//               >
//                 +
//               </button>
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex flex-col sm:flex-row gap-3 pt-4">
//             <button
//               onClick={handleAddToCart}
//               disabled={!product.isInStock() || isAddingToCart}
//               className={`flex items-center justify-center gap-2 px-6 py-3 rounded-md font-medium transition-colors ${
//                 product.isInStock()
//                   ? "bg-red-600 hover:bg-red-700 text-white"
//                   : "bg-gray-300 cursor-not-allowed text-gray-500"
//               }`}
//             >
//               {isAddingToCart ? (
//                 <>
//                   <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   Adding...
//                 </>
//               ) : (
//                 <>
//                   <ShoppingCart className="w-5 h-5" />
//                   Add to Cart
//                 </>
//               )}
//             </button>

//             <button className="px-6 py-3 border border-gray-300 rounded-md font-medium hover:bg-gray-50 transition-colors">
//               Buy Now
//             </button>

//             <button className="p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
//               <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
//               </svg>
//             </button>
//           </div>

//           {/* Additional Info */}
//           <div className="pt-6 space-y-4 border-t border-gray-200">
//             <div className="flex items-start gap-3">
//               <div className="mt-1">
//                 <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                 </svg>
//               </div>
//               <div>
//                 <p className="font-medium text-gray-900">Free Delivery</p>
//                 <p className="text-sm text-gray-600">Estimated delivery time: 2-4 business days</p>
//               </div>
//             </div>

//             <div className="flex items-start gap-3">
//               <div className="mt-1">
//                 <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                 </svg>
//               </div>
//               <div>
//                 <p className="font-medium text-gray-900">Easy Returns</p>
//                 <p className="text-sm text-gray-600">30-day return policy. No questions asked.</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// };

// export default ProductPage;
