"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiRequest } from "@/lib/apiClient"

export default function SetupPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [enable2FA, setEnable2FA] = useState(false)
  const [secret, setSecret] = useState("")
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (enable2FA && !secret) {
      setError("2FA setup is not available yet")
      setEnable2FA(false)
    }
  }, [enable2FA, secret])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }

    try {
      await apiRequest("auth/setup", {
        method: "POST",
        data: { password },
        setLoading,
      })
      router.push("/role")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">

      {/* Card */}
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <img src="/favicon.ico" className="mx-auto h-10 mb-4" />
          <h1 className="text-2xl font-semibold text-gray-900">
            Secure your account
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Create a password to protect your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Enter password"
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Confirm password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              placeholder="Re-enter password"
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
            />
          </div>

          {/* Hint */}
          <p className="text-xs text-gray-500">
            Use at least 6 characters with a mix of letters and numbers
          </p>

          {/* 2FA Toggle */}
          <div className="flex items-center justify-between border border-gray-200 rounded-md px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-800">
                Two-Factor Authentication
              </p>
              <p className="text-xs text-gray-500">
                Add an extra layer of security
              </p>
            </div>
            <input
              type="checkbox"
              checked={enable2FA}
              onChange={(e) => setEnable2FA(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
          </div>

          {/* 2FA Section */}
          {enable2FA && (
            <div className="border border-gray-200 rounded-md p-4 space-y-3 bg-gray-50">
              <p className="text-sm text-gray-700 text-center">
                Scan this QR with Google Authenticator
              </p>

              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="mx-auto h-36 w-36 bg-white p-2 rounded-md border"
                />
              ) : (
                <p className="text-xs text-gray-500 text-center">
                  QR not available
                </p>
              )}

              {secret && (
                <div>
                  <label className="text-xs text-gray-500">
                    Manual setup key
                  </label>
                  <input
                    readOnly
                    value={secret}
                    className="mt-1 w-full text-center rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-800 bg-white"
                  />
                </div>
              )}
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
            {loading ? "Saving..." : "Continue"}
          </button>

        </form>

      </div>
    </div>
  )
}
