"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth-client"

export function SignoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignout = async () => {
    setLoading(true)

    try {
      await signOut()
      // JWT token removed from httpOnly cookie by Better Auth
      router.push("/signin")
    } catch (err) {
      console.error("Signout failed:", err)
      // Still redirect even if signout fails
      router.push("/signin")
    }
  }

  return (
    <button
      onClick={handleSignout}
      disabled={loading}
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? "Signing out..." : "Sign Out"}
    </button>
  )
}
