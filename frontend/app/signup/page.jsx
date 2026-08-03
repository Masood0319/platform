"use client"

import React, { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { apiRequest } from "@/lib/apiClient"

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const oauthError = searchParams.get("error")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState("")

  useEffect(() => {
    if (oauthError) {
      setError("OAuth signup failed. Please try again.")
    }
  }, [oauthError])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setInfo("")

    try {
      const data = await apiRequest("auth/signup", {
        method: "POST",
        data: { email },
        setLoading,
      })

      if (data?.data?.otpSent === false && data?.data?.devOtp) {
        setInfo(`Email not configured. Use OTP: ${data.data.devOtp}`)
      }
      if (data?.data?.otpSent) {
        localStorage.setItem("email", email);
        router.push("/verify");
      }
    } catch (err) {
      console.error(err)
      const message = err?.message || "Something went wrong. Please try again"
      setError(message.includes("Email already registered") ? "Email already registered. Please log in instead." : message)
    }
  }

  const startOAuth = (provider) => {
    setOauthLoading(provider)
    setError("")
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    const normalized = base.replace(/\/+$/, "")
    window.location.href = `${normalized}/api/auth/${provider}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">

      {/* Card */}
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <img src="/favicon.ico" className="mx-auto h-10 mb-4" />
          <h1 className="text-2xl font-semibold text-gray-900">
            Create your account
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Join and start connecting with opportunities
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
            />
          </div>

          {/* Info */}
          {info && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm p-2 rounded-md text-center">
              {info}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-2 rounded-md text-center">
              {error}
            </div>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 transition text-white font-medium disabled:opacity-50"
          >
            {loading ? "Sending code..." : "Continue"}
          </button>

        </form>

        {/* OAUTH */}
        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={() => startOAuth("google")}
            disabled={oauthLoading === "google"}
            className="w-full rounded-lg border border-gray-200 bg-white hover:bg-gray-50 py-2 text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            <span className="h-4 w-4">
              <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.6 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 6 .9 8.4 2.6l5.7-5.7C34.7 6.3 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.1 19 12 24 12c3.1 0 6 .9 8.4 2.6l5.7-5.7C34.7 6.3 29.6 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z" />
                <path fill="#4CAF50" d="M24 44c5.1 0 9.9-1.9 13.4-5.1l-6.2-5.2C29 35.5 26.6 36 24 36c-5.1 0-9.4-3.3-10.9-7.9l-6.6 5.1C9.6 39.7 16.4 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-1.1 3-3.2 5.4-6 6.7l6.2 5.2C39.6 36.3 44 30.7 44 24c0-1.3-.1-2.7-.4-3.9z" />
              </svg>
            </span>
            {oauthLoading === "google" ? "Redirecting..." : "Continue with Google"}
          </button>

          <button
            type="button"
            onClick={() => startOAuth("linkedin")}
            disabled={oauthLoading === "linkedin"}
            className="w-full rounded-lg border border-gray-200 bg-white hover:bg-gray-50 py-2 text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            <span className="h-4 w-4">
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path fill="#0A66C2" d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.05-1.86-3.05-1.86 0-2.15 1.45-2.15 2.95v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.86 3.38-1.86 3.62 0 4.29 2.38 4.29 5.47v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.55V9h3.57v11.45z" />
              </svg>
            </span>
            {oauthLoading === "linkedin" ? "Redirecting..." : "Continue with LinkedIn"}
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-6">
          We’ll send a one-time verification code to your email
        </p>

      </div>
    </div>
  )
}
