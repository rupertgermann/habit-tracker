import React from 'react'
import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'

const slideUp = keyframes`
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`

const ToastContainer = styled(motion.div)`
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${props => {
    switch (props.variant) {
      case 'success': return props.theme.colors.primary
      case 'error': return props.theme.colors.destructive
      case 'warning': return props.theme.colors.secondary
      default: return props.theme.colors.primary
    }
  }};
  color: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.medium};
  box-shadow: ${props => props.theme.shadows.strong};
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  max-width: 90%;
  animation: ${slideUp} 0.3s ease-out;
`

const ToastIcon = styled.span`
  font-size: 20px;
  flex-shrink: 0;
`

const ToastMessage = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  line-height: ${props => props.theme.typography.lineHeight.normal};
`

const Toast = ({ 
  message, 
  variant = 'success', 
  icon,
  duration = 3000,
  onClose 
}) => {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const getIcon = () => {
    if (icon) return icon
    
    switch (variant) {
      case 'success': return '✓'
      case 'error': return '✕'
      case 'warning': return '⚠'
      default: return '✓'
    }
  }

  return (
    <ToastContainer
      variant={variant}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ToastIcon>{getIcon()}</ToastIcon>
      <ToastMessage>{message}</ToastMessage>
    </ToastContainer>
  )
}

export default Toast