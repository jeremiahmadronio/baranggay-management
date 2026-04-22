import React from 'react'
interface AuthLayoutProps {
  children: React.ReactNode
}
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50">
      {/* Left Panel - Solid Blue Gradient (Naka-center na) */}
      <div className="lg:w-5/12 xl:w-1/2 bg-gradient-to-br from-[#1e3a5f] to-blue-700 flex flex-col justify-center items-center p-8 lg:p-20 text-white relative overflow-hidden shrink-0">
        {/* Main Text Content */}
        <div className="relative z-10 hidden lg:block max-w-md">
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Barangay Digital Governance Portal
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed">
            Efficiently manage community records, oversee administrative
            operations, and ensure data transparency with our secure management
            framework.
          </p>
        </div>
      </div>
      {/* Right Panel - Form Area */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-slate-50 relative">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
