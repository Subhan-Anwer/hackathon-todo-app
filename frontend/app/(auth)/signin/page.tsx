import { SigninForm } from "@/components/auth/SigninForm"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In | Todo App",
  description: "Sign in to your account",
}

export default function SigninPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Card container */}
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">
              Sign in to continue managing your tasks
            </p>
          </div>

          {/* Signin Form */}
          <SigninForm />

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer text */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Enter your credentials to access your account
        </p>
      </div>
    </div>
  )
}
