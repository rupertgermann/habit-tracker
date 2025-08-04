import React, { createContext, useContext, useState } from 'react'
import Toast from '../components/Toast'

const ToastContext = createContext()

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = (message, options = {}) => {
    const id = Date.now()
    const newToast = {
      id,
      message,
      variant: options.variant || 'success',
      icon: options.icon,
      duration: options.duration || 3000,
    }
    
    setToasts(prev => [...prev, newToast])
    
    return id
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showSuccessToast = (message, options = {}) => {
    return addToast(message, { ...options, variant: 'success' })
  }

  const showErrorToast = (message, options = {}) => {
    return addToast(message, { ...options, variant: 'error' })
  }

  const showWarningToast = (message, options = {}) => {
    return addToast(message, { ...options, variant: 'warning' })
  }

  const value = {
    showToast: addToast,
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    hideToast: removeToast,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            variant={toast.variant}
            icon={toast.icon}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}