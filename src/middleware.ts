import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { checkCustomerAccount, customerExist } from "@/lib/supabaseQueries";

const protectedRoutes = [
  "/orders(.*)",
  "/cart",
  "/checkout(.*)",
  "/products/(.*)", // This will match all product pages
];

const publicRoutes = [
  "/",
  "/category",
  "/products", // This is just the listing page
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/info", // Explicitly add info to public routes
];

const isProtectedRoute = createRouteMatcher(protectedRoutes);
const isPublicRoute = createRouteMatcher(publicRoutes);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const { pathname } = req.nextUrl;

  // Skip all checks for public routes for unauthenticated users
  if (isPublicRoute(req) && !userId) {
    return;
  }

  // Handle root path specifically
  if (pathname === "/") {
    if (userId) {
      console.log("User ID:", userId);
      const exists = await checkCustomerAccount(userId);
      console.log("User exists:", exists);
      if (!exists) {
        const url = req.nextUrl.clone();
        url.pathname = "/info";
        return Response.redirect(url);
      }
    }
    return;
  }

  // Check authentication for protected routes
  if (isProtectedRoute(req)) {
    if (!userId) {
      const objectAuth = await auth();
      return objectAuth.redirectToSignIn({ returnBackUrl: req.url });
    }

    // Check customer existence for protected routes
    try {
      const exists = await checkCustomerAccount(userId);
      if (!exists) {
        const url = req.nextUrl.clone();
        url.pathname = "/info";
        return Response.redirect(url);
      }
    } catch (error) {
      console.error("Error checking customer existence:", error);
      // In case of error, allow access to avoid infinite loops
      return;
    }
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/", "/(api|trpc)(.*)"],
};
