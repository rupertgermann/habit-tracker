import React from 'react'
import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'
import { lightTheme } from '../styles/theme'
import AppIcon from './AppIcon'

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

const getColor = (theme, key, fallbackKey = key) =>
  theme?.colors?.[key] ?? lightTheme.colors[fallbackKey]

const getTextColor = (theme, key) =>
  theme?.colors?.text?.[key] ?? lightTheme.colors.text[key]

const getToastBackgroundColor = (theme, variant) => {
  switch (variant) {
    case 'success':
      return getColor(theme, 'primary')
    case 'error':
    case 'destructive':
      return getColor(theme, 'destructive')
    case 'warning':
      return getColor(theme, 'secondary')
    case 'info':
      return getTextColor(theme, 'secondary')
    default:
      return getColor(theme, 'primary')
  }
}

const getToastTextColor = (theme, variant) =>
  variant === 'warning' ? '#111411' : (theme?.colors?.onPrimary ?? '#FFFFFF')

const ToastContainer = styled(motion.div)`
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${props => getToastBackgroundColor(props.theme, props.$variant)};
  color: ${props => getToastTextColor(props.theme, props.$variant)};
  padding: ${props => {
    const theme = props.theme?.spacing ? props.theme : lightTheme
    return `${theme.spacing.md} ${theme.spacing.lg}`
  }};
  border-radius: ${props => (props.theme?.borderRadius ? props.theme : lightTheme).borderRadius.medium};
  border: 2px solid ${props => getTextColor(props.theme, 'primary')};
  box-shadow: ${props => (props.theme?.shadows ? props.theme : lightTheme).shadows.strong};
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: ${props => (props.theme?.spacing ? props.theme : lightTheme).spacing.sm};
  max-width: 90%;
  animation: ${slideUp} 0.3s ease-out;
`

const ToastIcon = styled.span`
  display: inline-flex;
  flex-shrink: 0;
`

const ToastMessage = styled.div`
  font-size: ${props => (props.theme?.typography ? props.theme : lightTheme).typography.fontSize.bodyMedium};
  font-weight: ${props => (props.theme?.typography ? props.theme : lightTheme).typography.fontWeight.medium};
  line-height: ${props => (props.theme?.typography ? props.theme : lightTheme).typography.lineHeight.normal};
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
    if (React.isValidElement(icon)) return icon
    if (typeof icon === 'string' && icon) return <AppIcon name={icon} size={20} />
    
    switch (variant) {
      case 'success': return <AppIcon name="check" size={20} />
      case 'error': return <AppIcon name="x" size={20} />
      case 'warning': return <AppIcon name="alarm" size={20} />
      default: return <AppIcon name="check" size={20} />
    }
  }

  return (
    <ToastContainer
      $variant={variant}
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
