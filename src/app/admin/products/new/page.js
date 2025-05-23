"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ChevronLeft, Loader2, Upload, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReactSelect from "react-select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { getCategories, createProduct } from "@/lib/supabaseQueries";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

import { CurrencyContext } from "@/context/CurrencyContext";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const productSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Product name must be at least 2 characters." }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters." }),
  price: z.coerce
    .number()
    .positive({ message: "Price must be a positive number." })
    .transform((val) => parseFloat(val.toFixed(2))),
  stock_quantity: z.coerce
    .number()
    .int()
    .nonnegative({ message: "Stock quantity must be a non-negative integer." }),
  category_id: z.string().min(1, { message: "Please select a category." }),
  is_featured: z.boolean().default(false),
  available_colors: z.array(z.string()).optional(),
  available_sizes: z.array(z.string()).optional(),
  default_rating: z.coerce
    .number()
    .min(0)
    .max(5, { message: "Rating must be between 0 and 5." }),
  additional_images: z.array(z.any()).optional(),
});

export default function NewProductPage() {
  const router = useRouter();
  const [additionalImages, setAdditionalImages] = useState([]);
  const [additionalPreviews, setAdditionalPreviews] = useState([]);
  const { currency, exchangeRate } = useContext(CurrencyContext);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasSize, setHasSize] = useState(false);

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock_quantity: 1,
      category_id: "",
      is_featured: false,
      available_colors: [],
      available_sizes: [],
      rating: 0,
    },
  });

  const handleCurrencyChange = (newCurrency) => {
    // Update the currency in the context
    switch (newCurrency) {
      case "USD":
        setCurrencySymbol("$");
        break;
      case "EUR":
        setCurrencySymbol("€");
        break;
      case "PHP":
        setCurrencySymbol("₱");
        break;
      default:
        setCurrencySymbol("$");
    }
  };

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await getCategories();
        if (Array.isArray(data)) {
          setCategories(data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("No categories loaded", {
          description: "Failed to load categories. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  useEffect(() => {
    handleCurrencyChange(currency);
  }, [currency, exchangeRate]);

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate files
    const validFiles = files.filter((file) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error("Invalid file type", {
          description: `${file.name} is not a valid image type (JPEG, PNG, WEBP).`,
        });
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File too large", {
          description: `${file.name} exceeds the 5MB limit.`,
        });
        return false;
      }
      return true;
    });

    // Update state
    setAdditionalImages((prev) => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAdditionalPreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAdditionalImage = (index) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
    setAdditionalPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (files) => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `additional/${fileName}`;

      const { error } = await supabase.storage
        .from("product")
        .upload(filePath, file);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("product").getPublicUrl(filePath);

      return publicUrl;
    });

    return Promise.all(uploadPromises);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      console.log("Invalid file type:", file.type);
      toast.error("Invalid file type", {
        description: "Please upload a JPEG, PNG, or WEBP image.",
      });

      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      console.log("File too large:", file.size);
      toast.error("File too large", {
        description: "Image must be less than 5MB",
      });

      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
      .from("product")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("product").getPublicUrl(filePath);

    return publicUrl;
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    let imageUrl = null;

    try {
      if (!imageFile) {
        toast.error("Main image required", {
          description: "Please upload a main product image.",
        });
        return;
      }

      // Validate at least one additional image exists
      if (additionalImages.length === 0) {
        toast.error("Additional images required", {
          description: "Please upload at least one additional product image.",
        });
        return;
      }
      let initPrice = data.price;
      if (currencySymbol !== "$") {
        initPrice = (data.price / exchangeRate).toFixed(2);
      }

      imageUrl = await uploadImage(imageFile);

      if (!imageUrl) {
        toast.error("Image uplaod failed", {
          description: "Please upload a valid image.",
        });

        return;
      }

      setUploadProgress(10);
      const mainImageUrl = await uploadImage(imageFile);

      // Upload additional images
      setUploadProgress(30);
      const additionalImageUrls =
        additionalImages.length > 0 ? await uploadImages(additionalImages) : [];
      setUploadProgress(100);

      // Process available colors
      const availableColors = data.available_colors
        ? data.available_colors
        : [];

        const productData = {
          name: data.name,
          description: data.description,
          price:
            currencySymbol !== "$"
              ? (data.price / exchangeRate).toFixed(2)
              : data.price,
          stock_quantity: data.stock_quantity,
          category_id: data.category_id,
          is_featured: Boolean(data.is_featured),
          image_url: [mainImageUrl, ...additionalImageUrls], // Combine all images here
          available_colors:
            data.available_colors?.length > 0
              ? availableColors.map((color) => color.value)
              : [],
          available_sizes: data.available_sizes,
          rating: data.default_rating,
        };

        await createProduct(productData);
        toast.success("Success", {
          description: "Product created successfully!",
        });

      router.push("/admin/products");
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Error", {
        description: "Failed to create product. Please try again.",
      });
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/admin/products" className="mr-4">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Add New Product</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter product description"
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price ({currencySymbol})</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stock_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="default_rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Rating</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            max="5"
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            const selected = categories.find(
                              (cat) => cat.id.toString() === value
                            );
                            setHasSize(selected?.has_size ?? false);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loading ? (
                              <div className="flex items-center justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Loading categories...</span>
                              </div>
                            ) : categories.length > 0 ? (
                              categories.map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id.toString()}
                                >
                                  {category.name}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-center text-sm text-gray-500">
                                No categories found
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="available_colors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Colors</FormLabel>
                        <FormControl>
                          <ReactSelect
                            isMulti
                            options={[
                              { value: "Red", label: "Red" },
                              { value: "Blue", label: "Blue" },
                              { value: "Green", label: "Green" },
                              { value: "White", label: "White" },
                              { value: "Yellow", label: "Yellow" },
                              { value: "Black", label: "Black" },
                              { value: "Purple", label: "Purple" },
                              { value: "Pink", label: "Pink" },
                              { value: "Orange", label: "Orange" },
                              { value: "Gray", label: "Gray" },
                              { value: "Brown", label: "Brown" },
                              { value: "Beige", label: "Beige" },
                              { value: "Cyan", label: "Cyan" },
                              { value: "Teal", label: "Teal" },
                              { value: "Navy", label: "Navy" },
                              { value: "Maroon", label: "Maroon" },
                            ]}
                            value={
                              field.value?.map((val) => ({
                                value: val,
                                label:
                                  val.charAt(0).toUpperCase() + val.slice(1),
                              })) || []
                            }
                            onChange={(selected) =>
                              field.onChange(selected.map((opt) => opt.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {hasSize && (
                    <FormField
                      control={form.control}
                      name="available_sizes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available Sizes</FormLabel>
                          <FormControl>
                            <ReactSelect
                              isMulti
                              options={[
                                { value: "XS", label: "Extra Small" },
                                { value: "S", label: "Small" },
                                { value: "M", label: "Medium" },
                                { value: "L", label: "Large" },
                                { value: "XL", label: "Extra Large" },
                                { value: "XXL", label: "Double Extra Large" },
                                { value: "XXXL", label: "Triple Extra Large" },
                                { value: "28", label: "28" },
                                { value: "30", label: "30" },
                                { value: "32", label: "32" },
                                { value: "34", label: "34" },
                                { value: "36", label: "36" },
                                { value: "38", label: "38" },
                                { value: "40", label: "40" },
                                { value: "42", label: "42" },
                                { value: "44", label: "44" },
                                { value: "46", label: "46" },
                                { value: "48", label: "48" },
                                { value: "50", label: "50" },
                                { value: "52", label: "52" },
                                { value: "54", label: "54" },
                                { value: "56", label: "56" },
                                { value: "58", label: "58" },
                                { value: "60", label: "60" },
                                { value: "ONE SIZE", label: "One Size" },
                              ]}
                              value={
                                field.value?.map((val) => ({
                                  value: val,
                                  label:
                                    val.charAt(0).toUpperCase() + val.slice(1),
                                })) || []
                              }
                              onChange={(selected) =>
                                field.onChange(selected.map((opt) => opt.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="is_featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Featured Product
                          </FormLabel>
                          <FormDescription>
                            Featured products will be highlighted on the
                            homepage
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/admin/products")}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Product"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Image Upload */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Product Image</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload a high-quality product image
                  </p>
                </div>

                {imagePreview ? (
                  <div className="relative rounded-md overflow-hidden border aspect-square">
                    <Image
                      src={imagePreview}
                      alt="Product preview"
                      fill
                      className="object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center aspect-square bg-gray-50">
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 text-center mb-4">
                      Drag and drop an image, or click to browse
                    </p>
                    <Button variant="outline" asChild>
                      <label className="cursor-pointer">
                        Select Image
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                    </Button>
                  </div>
                )}

                {uploadProgress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-primary h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  <p>Recommended: 1000x1000px</p>
                  <p>Max size: 5MB</p>
                  <p>Formats: JPEG, PNG, WEBP</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">
                    Additional Product Images
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Upload supporting images (max 5)
                  </p>
                </div>

                {additionalPreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {additionalPreviews.map((preview, index) => (
                      <div
                        key={index}
                        className="relative rounded-md overflow-hidden border aspect-square"
                      >
                        <Image
                          src={preview}
                          alt={`Additional preview ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 rounded-full"
                          onClick={() => removeAdditionalImage(index)}
                        >
                          <X className="h-1 w-1" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Button variant="outline" asChild>
                  <label className="cursor-pointer">
                    Add More Images
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAdditionalImagesChange}
                      multiple
                    />
                  </label>
                </Button>

                <div className="text-sm text-muted-foreground">
                  <p>Recommended: 1000x1000px</p>
                  <p>Max size per image: 5MB</p>
                  <p>Formats: JPEG, PNG, WEBP</p>
                  <p>Max 5 additional images</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add this below your main image upload card */}
      </div>
    </div>
  );
}
