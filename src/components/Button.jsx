import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const ButtonWrapper = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  border: none;
  border-radius: ${props => props.theme.borderRadius.small};
  font-family: ${props => props.theme.typography.fontFamily};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  cursor: pointer;
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
          
          &:hover:not(:disabled) {
            background-color: ${theme.colors.primary}10;
          }
        `
      case 'destructive':
        return `
          background-color: ${theme.colors.destructive};
          color: ${theme.colors.white};
          
          &:hover:not(:disabled) {
            background-color: #F17676;
          }
        `
      default:
        return `
          background-color: ${theme.colors.primary};
          color: ${theme.colors.white};
          
          &:hover:not(:disabled) {
            background-color: #5CAD6C;
          }
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
      case 'large':
        return `
          height: 48px;
          padding: 0 ${theme.spacing.xl};
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
  
  ${({ disabled }) =>
    disabled &&
    `
      cursor: not-allowed;
      opacity: 0.5;
    `}
  
  &:focus {
    outline: 2px solid ${props => props.theme.colors.primary};
    outline-offset: 2px;
  }
  
  &:active {
    transform: scale(0.98);
  }
`

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid ${props => props.theme.colors.white};
  border-top-color: transparent;
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
  className,
  ...props
}) => {
  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      onClick(e)
    }
  }

  return (
    <ButtonWrapper
      variant={variant}
      size={size}
      disabled={disabled || loading}
      loading={loading}
      fullWidth={fullWidth}
      onClick={handleClick}
      className={className}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      {...props}
    >
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {icon && <span className="button-icon">{icon}</span>}
          {children}
        </>
      )}
    </ButtonWrapper>
  )
}

export default Button