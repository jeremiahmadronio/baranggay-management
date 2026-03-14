import React from 'react'
import { Shield } from 'lucide-react'
interface AuthLayoutProps {
  children: React.ReactNode
}
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50">
      <div className="lg:w-5/12 xl:w-1/2 bg-gradient-to-br from-[#1e3a5f] to-blue-700 flex flex-col justify-between p-8 lg:p-16 text-white relative overflow-hidden shrink-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
          <Shield className="w-96 h-96" />
        </div>

        <div className="relative z-10 flex items-center gap-3 mb-12 lg:mb-0">
          <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm border border-white/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Barangay Ugong</h1>
            <p className="text-blue-200 text-sm font-medium">Valenzuela City</p>
          </div>
        </div>

       <div className="relative z-10 hidden lg:block max-w-md">
  <h2 className="text-4xl font-bold mb-6 leading-tight">
    Barangay Digital Governance Portal
  </h2>
  <p className="text-blue-100 text-lg leading-relaxed mb-8">
    Efficiently manage community records, oversee administrative operations, 
    and ensure data transparency with our secure management framework.
  </p>
</div>

        <div className="relative z-10 hidden lg:block text-sm text-blue-300">
         
        </div>
      </div>

      {/* Right Panel - Form Area */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-slate-50 relative">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
