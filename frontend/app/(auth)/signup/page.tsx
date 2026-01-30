import { SignupForm } from "@/components/auth/SignupForm"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign Up | Todo App",
  description: "Create a new account to manage your tasks",
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Card container */}
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Account
            </h1>
            <p className="text-gray-600">
              Start managing your tasks today
            </p>
          </div>

          {/* Signup Form */}
          <SignupForm />

          {/* Sign in link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer text */}
        <p className="mt-6 text-center text-xs text-gray-500">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
