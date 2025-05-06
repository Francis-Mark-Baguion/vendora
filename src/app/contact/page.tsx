"use client";

import { useState } from "react";

type FormData = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted", formData);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6 mt-16">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-4xl w-full">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Contact Us
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-2 flex items-center">
              📞 Call Us
            </h3>
            <p>We are available 24/7, 7 days a week.</p>
            <p className="font-semibold mt-2">Phone: +880611112222</p>
            <hr className="my-4" />
            <h3 className="text-lg font-medium mb-2 flex items-center">
              ✉️ Write to Us
            </h3>
            <p>Fill out our form and we will contact you within 24 hours.</p>
            <p className="mt-2 font-semibold">customer@exclusive.com</p>
            <p className="font-semibold">support@exclusive.com</p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Your Name *"
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring focus:ring-blue-300"
              onChange={handleChange}
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email *"
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring focus:ring-blue-300"
              onChange={handleChange}
            />
            <input
              type="text"
              name="phone"
              placeholder="Your Phone *"
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring focus:ring-blue-300"
              onChange={handleChange}
            />
            <textarea
              name="message"
              placeholder="Your Message"
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring focus:ring-blue-300"
              onChange={handleChange}
            ></textarea>
            <button
              type="submit"
              className="w-full bg-red-500 text-white p-3 rounded-md hover:bg-red-600 transition"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
      <div className="mt-8 w-full max-w-4xl">
        <iframe
          title="Company Location"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.8354345093713!2d144.95373531531854!3d-37.81627927975144!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642af0f11fd81%3A0xf0727df7c1d3d6e9!2sMelbourne%2C%20Australia!5e0!3m2!1sen!2sph!4v1616826792749!5m2!1sen!2sph"
          width="100%"
          height="300"
          className="border-0 rounded-lg shadow-md"
          allowFullScreen
          loading="lazy"
        ></iframe>
      </div>
    </div>
  );
}