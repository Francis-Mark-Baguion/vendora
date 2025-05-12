import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { getAuth } from "@clerk/nextjs/server"; // for extracting userId
import { clerkClient } from "@clerk/nextjs/server";
import { customerExist } from "@/lib/supabaseQueries";
// import your existing check function

const protectedRoutes = [
  "/orders(.*)",
  "/cart",
  "/checkout(.*)",
  "/products/(.*)",
];

const publicRoutes = [
  "/",
  "/category",
  "/products",
  "/sign-in(.*)",
  "/sign-up(.*)",
];

const isProtectedRoute = createRouteMatcher(protectedRoutes);
const isPublicRoute = createRouteMatcher(publicRoutes);

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;
  const authObject = await auth();

  console.log("Checking route:", pathname);
  console.log("Is public route:", isPublicRoute(req));
  console.log("Is protected route:", isProtectedRoute(req));

  // Public routes are always allowed
  if (isPublicRoute(req)) {
    console.log("Allowing public access to:", pathname);
    return;
  }

  // Protected route handling
  if (isProtectedRoute(req)) {
    if (!authObject.userId) {
      console.log("Redirecting to sign-in for:", pathname);
      return authObject.redirectToSignIn({ returnBackUrl: req.url });
    }

    // Additional check: does customer exist?
    try {
      const email = authObject.sessionClaims?.email;

      const exists = await customerExist(email);
      if (!exists) {
        console.log("Customer not found, redirecting to /info");
        const url = req.nextUrl.clone();
        url.pathname = "/info";
        return Response.redirect(url);
      }

      console.log("Authenticated and customer exists:", pathname);
    } catch (error) {
      console.error("Error checking customer existence:", error);
      return authObject.redirectToSignIn({ returnBackUrl: req.url });
    }
  }

  console.log("Default access to:", pathname);
  return;
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/", "/(api|trpc)(.*)"],
};
