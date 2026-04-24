import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: string
}
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full ${maxWidth} bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]`}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 transition-colors rounded-lg p-1 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
