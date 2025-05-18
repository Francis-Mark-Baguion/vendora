"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { createNewAddress, createNewCustomer } from "@/lib/supabaseQueries";
import Image from "next/image";
import { toast } from "sonner"; // or your preferred toast library

export default function CustomerInfoPage() {
  const { user } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: {
      landmark: "",
      barangay: "",
      city: "",
      province: "",
      country: "Philippines",
      zipCode: "",
    },
  });

  // Validate Philippine phone number (starts with 09, 11 digits)
  const validatePhoneNumber = (phone: string): boolean => {
    const regex = /^09\d{9}$/;
    return regex.test(phone);
  };

  // Validate Philippine ZIP code (4 digits)
  const validateZipCode = (zip: string): boolean => {
    const regex = /^\d{4}$/;
    return regex.test(zip);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required field validation
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    
    // Phone number validation
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid Philippine phone number (09XXXXXXXXX)";
    }

    // Address validation
    if (!formData.address.barangay.trim()) newErrors["address.barangay"] = "Barangay is required";
    if (!formData.address.city.trim()) newErrors["address.city"] = "City is required";
    if (!formData.address.province.trim()) newErrors["address.province"] = "Province is required";
    
    // ZIP code validation
    if (!formData.address.zipCode.trim()) {
      newErrors["address.zipCode"] = "ZIP code is required";
    } else if (!validateZipCode(formData.address.zipCode)) {
      newErrors["address.zipCode"] = "Please enter a valid Philippine ZIP code (4 digits)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Phone number formatting (auto-format to 09XXXXXXXXX)
    if (name === "phoneNumber") {
      const cleaned = value.replace(/\D/g, '').slice(0, 11);
      const formatted = cleaned.startsWith('09') ? cleaned : '09' + cleaned.slice(2);
      setFormData(prev => ({ ...prev, [name]: formatted }));
      return;
    }
    
    // ZIP code formatting (only allow numbers, max 4 digits)
    if (name === "address.zipCode") {
      const cleaned = value.replace(/\D/g, '').slice(0, 4);
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, zipCode: cleaned }
      }));
      return;
    }

    if (name.includes("address.")) {
      const addressField = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      const addressData = await createNewAddress(
        formData.firstName,
        formData.phoneNumber,
        formData.address.landmark,
        formData.address.barangay,
        formData.address.city,
        formData.address.province,
        formData.address.country,
        formData.address.zipCode
      );
      
      if (!addressData) {
        throw new Error("Failed to create address data");
      }

      const customerData = await createNewCustomer(
        formData.firstName,
        formData.lastName,
        user?.primaryEmailAddress?.emailAddress,
        formData.phoneNumber,
        addressData.id,
        user?.id
      );
      
      if (!customerData) {
        throw new Error("Failed to create customer data");
      }

      toast.success("Profile completed successfully!");
      router.push("/");
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to save information. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get error message
  const getError = (fieldName: string): string | undefined => {
    return errors[fieldName] || errors[`address.${fieldName}`];
  };

  return (
    <div className="min-h-screen mt-24 w-full py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl w-full md:w-1/2 mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8">
        <div className="text-center mb-8">
          <Image
            src="/Vendora.png"
            alt="Vendora Logo"
            width={140}
            height={60}
            priority
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900">
            Complete Your Profile
          </h1>
          <p className="mt-2 text-gray-600">
            We need some additional information to serve you better
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700"
              >
                First Name
              </label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="mt-1"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700"
              >
                Last Name
              </label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="mt-1"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700"
            >
              Phone Number
            </label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              required
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="09XXXXXXXXX"
              className="mt-1"
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">
              Default Address
            </h3>

            <div>
              <label
                htmlFor="address.landmark"
                className="block text-sm text-gray-700"
              >
                Landmark/Nearby Place
              </label>
              <Input
                id="address.landmark"
                name="address.landmark"
                type="text"
                value={formData.address.landmark}
                onChange={handleChange}
                className="mt-1"
              />
            </div>

            <div>
              <label
                htmlFor="address.barangay"
                className="block text-sm text-gray-700"
              >
                Barangay
              </label>
              <Input
                id="address.barangay"
                name="address.barangay"
                type="text"
                required
                value={formData.address.barangay}
                onChange={handleChange}
                className="mt-1"
              />
              {errors["address.barangay"] && (
                <p className="mt-1 text-sm text-red-600">{errors["address.barangay"]}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="address.city"
                  className="block text-sm text-gray-700"
                >
                  City
                </label>
                <Input
                  id="address.city"
                  name="address.city"
                  type="text"
                  required
                  value={formData.address.city}
                  onChange={handleChange}
                  className="mt-1"
                />
                {errors["address.city"] && (
                  <p className="mt-1 text-sm text-red-600">{errors["address.city"]}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="address.province"
                  className="block text-sm text-gray-700"
                >
                  Province
                </label>
                <Input
                  id="address.province"
                  name="address.province"
                  type="text"
                  required
                  value={formData.address.province}
                  onChange={handleChange}
                  className="mt-1"
                />
                {errors["address.province"] && (
                  <p className="mt-1 text-sm text-red-600">{errors["address.province"]}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="address.country"
                  className="block text-sm text-gray-700"
                >
                  Country
                </label>
                <Input
                  id="address.country"
                  name="address.country"
                  type="text"
                  required
                  value={formData.address.country}
                  onChange={handleChange}
                  className="mt-1"
                  disabled
                />
              </div>
              <div>
                <label
                  htmlFor="address.zipCode"
                  className="block text-sm text-gray-700"
                >
                  ZIP Code
                </label>
                <Input
                  id="address.zipCode"
                  name="address.zipCode"
                  type="text"
                  required
                  value={formData.address.zipCode}
                  onChange={handleChange}
                  placeholder="e.g. 1600"
                  className="mt-1"
                />
                {errors["address.zipCode"] && (
                  <p className="mt-1 text-sm text-red-600">{errors["address.zipCode"]}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Information"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}