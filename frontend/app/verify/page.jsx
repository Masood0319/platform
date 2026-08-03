"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { apiRequest } from "@/lib/apiClient"

export default function VerifyPage() {
  const router = useRouter()
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [email, setEmail] = useState(
    typeof window !== "undefined" ? localStorage.getItem("email") || "" : ""
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const inputsRef = useRef([])

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      inputsRef.current[index + 1].focus()
    }
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(""))
      inputsRef.current[5].focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    const finalOtp = otp.join("")

    if (finalOtp.length !== 6) {
      setError("Enter complete 6-digit code")
      return
    }

    try {
      const res = await apiRequest("auth/verify", {
        method: "POST",
        data: { otp: finalOtp, email },
        setLoading,
      })

      
    
      localStorage.setItem("token", res.token)    

      router.push("/setup")
    } catch (err) {
      setError(err.message || "Verification failed")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">

      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <img src="/favicon.ico" className="mx-auto h-10 mb-4" />
          <h1 className="text-2xl font-semibold text-gray-900">
            Verify your email
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        {/* OTP Inputs */}
        <form onSubmit={handleSubmit} className="space-y-6">

          <div
            className="flex justify-center gap-1 sm:gap-2"
            onPaste={handlePaste}
          >
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                value={digit}
                onChange={(e) => handleChange(e.target.value, i)}
                maxLength={1}
                className="w-10 h-12 sm:w-12 sm:h-12 text-center text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            ))}
          </div>

          {/* Email fallback */}
          <div>
            <label className="text-sm text-gray-500">
              Email (if required)
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-600"
            />
          </div>

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
            className="w-full py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>

        </form>

      </div>
    </div>
  )
}
