"use client"; // ✅ Keep this for Clerk and React hooks

import { ClerkProvider, SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import { useEffect, useState } from 'react'
import './globals.css'
import { metadata } from './metadata' // ✅ Import metadata from the new file

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <header className="flex justify-end items-center p-4 gap-4 h-16 border-b">
            <SignedIn>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-md">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-4 py-2 bg-gray-500 text-white rounded-md">Sign Up</button>
              </SignUpButton>
            </SignedOut>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
