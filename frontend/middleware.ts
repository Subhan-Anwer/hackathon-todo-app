import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("better-auth.session_token")
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/signin", "/signup", "/", "/api/auth"]
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Protected routes (tasks, dashboard, etc.)
  const isProtectedRoute = pathname.startsWith("/tasks") || pathname.startsWith("/dashboard")

  if (isProtectedRoute && !token) {
    // Redirect to signin if accessing protected route without token
    const signinUrl = new URL("/signin", request.url)
    signinUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signinUrl)
  }

  if ((pathname === "/signin" || pathname === "/signup") && token) {
    // Redirect to tasks if already authenticated
    return NextResponse.redirect(new URL("/tasks", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
