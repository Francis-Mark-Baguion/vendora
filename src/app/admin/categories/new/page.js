"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ChevronLeft, Loader2, Upload, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
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
import { Card, CardContent } from "@/components/ui/card";
import { createCategory } from "@/lib/supabaseQueries";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabaseClient";

// Define the form schema with Zod
const categorySchema = z.object({
  name: z
    .string()
    .min(2, { message: "Category name must be at least 2 characters." }),
  description: z.string().optional(),
  link: z
    .string()
    .min(2, { message: "Slug must be at least 2 characters." })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug can only contain lowercase letters, numbers, and hyphens.",
    }),
  has_size: z.boolean().default(false),
});

export default function NewCategoryPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      link: "",
      has_size: false,
    },
  });

  // Auto-generate slug from name
  const autoGenerateSlug = (name) => {
    const slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .trim();

    form.setValue("link", slug);
  };

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error(
        "Invalid file type. Please upload an image file (JPEG, PNG, etc.)"
      );
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Image size should be less than 5MB");
      return;
    }

    setImageFile(file);

    // Create preview
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
      .from("product") // Make sure this matches your bucket name
      .upload(filePath, file);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("product").getPublicUrl(filePath);

    return publicUrl;
  };

  // Form submission handler
  const onSubmit = async (data) => {
    setSubmitting(true);

    try {
      // Simulate image upload progress
      if (imageFile) {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setUploadProgress(Math.min(progress, 90));
          if (progress >= 90) clearInterval(interval);
        }, 200);

        // In a real app, you would upload the image to your storage service here
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate upload delay
        clearInterval(interval);
        setUploadProgress(100);
      }

      // Create the category
      const categoryData = {
        ...data,
        image_url: await uploadImage(imageFile),
      };

      await createCategory(categoryData);

      toast.success(`${data.name} has been added successfully.`);

      // Redirect to categories list
      router.push("/admin/categories");
    } catch (error) {
      console.log("Error creating category:", error);
      toast.error("Failed to create category. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/admin/categories" className="mr-4">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Add New Category</h1>
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
                        <FormLabel>Category Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter category name"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              if (!form.getValues("link")) {
                                autoGenerateSlug(e.target.value);
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          The name of your category as it will appear to
                          customers.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter category description"
                            className="min-h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a brief description of this category.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                              /category/
                            </span>
                            <Input
                              className="rounded-l-none"
                              placeholder="category-slug"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          The URL-friendly version of the name. Used in the URL
                          for the category page.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="has_size"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Product Size
                          </FormLabel>
                          <FormDescription>
                            Enable if products in this category have sizes (S,
                            M, L, XL).
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

                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/admin/categories")}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {submitting ? "Creating..." : "Create Category"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Image Upload */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Category Image</h3>
                  <p className="text-sm text-gray-500">
                    Upload an image to represent this category.
                  </p>
                </div>

                {imagePreview ? (
                  <div className="relative rounded-md overflow-hidden border aspect-square">
                    <Image
                      src={imagePreview || "/placeholder.svg"}
                      alt="Category preview"
                      fill
                      className="object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-90"
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

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-red-600 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  <p>Recommended image size: 800x600px</p>
                  <p>Max file size: 5MB</p>
                  <p>Supported formats: JPEG, PNG</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}