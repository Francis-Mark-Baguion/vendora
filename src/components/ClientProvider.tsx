"use client"; // 👈 Marks this as a client component

import { ClerkProvider } from "@clerk/nextjs";

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider 
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      afterSignOutUrl="/" // ✅ Move afterSignOutUrl here
    >
      {children}
    </ClerkProvider>
  );
}
