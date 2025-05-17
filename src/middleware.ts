import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import {
  checkCustomerAccount,
  customerExist,
  getCustomerByUserId,
} from "@/lib/supabaseQueries";
import { NextResponse } from "next/server";

const protectedRoutes = [
  "/orders(.*)",
  "/cart",
  "/checkout(.*)",
  "/products/(.*)",
  "/admin(.*)",
];

const publicRoutes = [
  "/",
  "/category",
  "/products",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/info",
];

const isProtectedRoute = createRouteMatcher(protectedRoutes);
const isPublicRoute = createRouteMatcher(publicRoutes);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const { pathname } = req.nextUrl;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("url", req.url);
  console.log("Request URL:", req.url);

  // Skip all checks for public routes for unauthenticated users
  if (isPublicRoute(req) && !userId) {
    return;
  }

  // Handle admin routes
  if (isAdminRoute(req)) {
    if (!userId) {
      const authObject = await auth();
      return authObject.redirectToSignIn({ returnBackUrl: req.url });
    }

    // Check if user is admin
    const customer = await getCustomerByUserId(userId);
    const isAdmin =
      customer?.email === "johnrhuell@gmail.com" ||
      customer?.email === "forage.thesis@gmail.com";

    if (!isAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      req.headers.set("url", req.url);
      return NextResponse.redirect(url, {
        headers: requestHeaders,
      });
    }

    // If user is admin and trying to access admin routes, allow access
    return;
  }

  // Handle root path specifically
  if (pathname === "/") {
    if (userId) {
      const exists = await checkCustomerAccount(userId);
      if (!exists) {
        const url = req.nextUrl.clone();
        url.pathname = "/info";
        return NextResponse.redirect(url, {
          headers: requestHeaders,
        });
      }
    }
    return;
  }

  // Check authentication for protected routes
  if (isProtectedRoute(req)) {
    if (!userId) {
      const authObject = await auth();
      return authObject.redirectToSignIn({ returnBackUrl: req.url });
    }

    // Check customer existence for protected routes
    try {
      const customer = await getCustomerByUserId(userId);
      const exists = await checkCustomerAccount(userId);

      if (!exists && customer == null) {
        const url = req.nextUrl.clone();
        url.pathname = "/info";
        return NextResponse.redirect(url, {
          headers: requestHeaders,
        });
      }
    } catch (error) {
      console.error("Error checking customer existence:", error);
      return;
    }
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/", "/(api|trpc)(.*)"],
};