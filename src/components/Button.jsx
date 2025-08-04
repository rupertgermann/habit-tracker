import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const ButtonWrapper = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.small};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  
  ${({ variant, theme }) => {
    switch (variant) {
      case 'primary':
        return `
          background-color: ${theme.colors.primary};
          color: ${theme.colors.white};
          &:hover:not(:disabled) {
            background-color: #5CAD6C;
          }
        `
      case 'secondary':
        return `
          background-color: ${theme.colors.secondary};
          color: ${theme.colors.text.primary};
          &:hover:not(:disabled) {
            background-color: #F4D04A;
          }
        `
      case 'ghost':
        return `
          background-color: transparent;
          color: ${theme.colors.primary};
          border: 1px solid ${theme.colors.primary};
          &:hover:not(:disabled) {
            background-color: ${theme.colors.primary}10;
          }
        `
      case 'destructive':
        return `
          background-color: ${theme.colors.destructive};
          color: ${theme.colors.white};
          &:hover:not(:disabled) {
            background-color: #F07A7A;
          }
        `
      default:
        return `
          background-color: ${theme.colors.primary};
          color: ${theme.colors.white};
        `
    }
  }}
  
  ${({ size, theme }) => {
    switch (size) {
      case 'small':
        return `
          height: 32px;
          padding: 0 ${theme.spacing.sm};
          font-size: ${theme.typography.fontSize.bodySmall};
        `
      case 'medium':
        return `
          height: 40px;
          padding: 0 ${theme.spacing.md};
          font-size: ${theme.typography.fontSize.bodyMedium};
        `
      case 'large':
        return `
          height: 48px;
          padding: 0 ${theme.spacing.lg};
          font-size: ${theme.typography.fontSize.bodyLarge};
        `
      default:
        return `
          height: 40px;
          padding: 0 ${theme.spacing.md};
          font-size: ${theme.typography.fontSize.bodyMedium};
        `
    }
  }}
  
  ${({ fullWidth }) =>
    fullWidth &&
    `
      width: 100%;
    `}
  
  ${({ loading }) =>
    loading &&
    `
      color: transparent;
      pointer-events: none;
    `}
`

const Spinner = styled.div`
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  onClick,
  ...props
}) => {
  const buttonVariants = {
    hover: { scale: 1.02 },
    tap: { scale: 0.98 }
  }

  return (
    <ButtonWrapper
      variant={variant}
      size={size}
      disabled={disabled || loading}
      loading={loading}
      fullWidth={fullWidth}
      onClick={onClick}
      variants={buttonVariants}
      whileHover={!disabled && !loading ? 'hover' : undefined}
      whileTap={!disabled && !loading ? 'tap' : undefined}
      {...props}
    >
      {loading && <Spinner />}
      {icon && !loading && <span>{icon}</span>}
      {children}
    </ButtonWrapper>
  )
}

export default Button