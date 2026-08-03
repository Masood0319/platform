"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { apiRequest } from "@/lib/apiClient"

const roles = [
  {
    key: "investor",
    label: "Investor",
    desc: "Discover and invest in promising startups",
  },
  {
    key: "founder",
    label: "Startup Founder",
    desc: "Raise funding and connect with investors",
  },
]

export default function Page() {
  const router = useRouter()
  const [role, setRole] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const submit = async (e) => {
    e.preventDefault()
    if (!role) return

    setError("")

    try {
      await apiRequest("auth/role", {
        method: "POST",
        data: { role },
        setLoading,
      })

      // Let UserProvider handle redirects after auth state updates
      window.location.href = "/home"
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
            Select your role
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Choose how you want to use the platform
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-4">

          {/* Role Options */}
          {roles.map((r) => {
            const selected = role === r.key

            return (
              <div
                key={r.key}
                onClick={() => setRole(r.key)}
                className={`cursor-pointer rounded-lg border p-4 transition 
                ${
                  selected
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    checked={selected}
                    onChange={() => setRole(r.key)}
                    className="mt-1 accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {r.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {r.desc}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-2 rounded-md text-center">
              {error}
            </div>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={!role || loading}
            className="w-full mt-4 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 transition text-white font-medium disabled:opacity-50"
          >
            {loading ? "Continuing..." : "Continue"}
          </button>

        </form>

      </div>
    </div>
  )
}
