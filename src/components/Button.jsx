import React from 'react'
import styled, { css, keyframes } from 'styled-components'
import { motion } from 'framer-motion'
import AppIcon from './AppIcon'

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
  letter-spacing: 0.025em;
  transition: transform var(--duration-fast) var(--ease-out), background var(--duration-fast) ease, color var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
  position: relative;
  overflow: hidden;
  
  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'primary':
        return `
          background-color: ${theme.colors.primary};
          color: ${theme.colors.onPrimary};
          box-shadow: 3px 3px 0 ${theme.colors.borderStrong};
          
          &:hover:not(:disabled) {
            background-color: ${theme.colors.primaryHover};
            transform: translate(-1px, -1px);
            box-shadow: 5px 5px 0 ${theme.colors.borderStrong};
          }
        `
      case 'secondary':
        return `
          background-color: ${theme.colors.secondary};
          color: ${theme.colors.text.primary};
          
          &:hover:not(:disabled) {
            filter: brightness(0.94);
          }
        `
      case 'ghost':
        return `
          background-color: transparent;
          color: ${theme.colors.primary};
          border-bottom: 1px solid currentColor;
          
          &:hover:not(:disabled) {
            background-color: ${theme.colors.primary}10;
          }
        `
      case 'destructive':
        return `
          background-color: ${theme.colors.destructive};
          color: ${theme.colors.onPrimary};
          
          &:hover:not(:disabled) {
            background-color: #F17676;
          }
        `
      default:
        return `
          background-color: ${theme.colors.primary};
          color: ${theme.colors.onPrimary};
          box-shadow: 3px 3px 0 ${theme.colors.borderStrong};
          
          &:hover:not(:disabled) {
            background-color: ${theme.colors.primaryHover};
          }
        `
    }
  }}
  
  ${({ $size, theme }) => {
    switch ($size) {
      case 'small':
        return `
          min-height: 36px;
          padding: 0 ${theme.spacing.sm};
          font-size: ${theme.typography.fontSize.bodySmall};
        `
      case 'large':
        return `
          min-height: 50px;
          padding: 0 ${theme.spacing.xl};
          font-size: ${theme.typography.fontSize.bodyLarge};
        `
      default:
        return `
          min-height: 44px;
          padding: 0 ${theme.spacing.md};
          font-size: ${theme.typography.fontSize.bodyMedium};
        `
    }
  }}
  
  ${({ $fullWidth }) =>
    $fullWidth &&
    `
      width: 100%;
    `}
  
  ${({ disabled }) =>
    disabled &&
    `
      cursor: not-allowed;
      opacity: 0.5;
    `}
  
  &:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }
  
  ${({ $isBouncing }) =>
    $isBouncing &&
    css`
      animation: ${bounce} 0.6s ease;
    `}
`

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid ${props => props.theme.colors.onPrimary};
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
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
  bounceOnClick = false,
  ariaLabel,
  ...props
}) => {
  const [isBouncing, setIsBouncing] = React.useState(false)

  const renderIcon = () => {
    if (!icon) return null
    if (React.isValidElement(icon)) return icon
    return <AppIcon name={icon} size={16} />
  }
  
  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      if (bounceOnClick) {
        setIsBouncing(true)
        setTimeout(() => setIsBouncing(false), 600)
      }
      onClick(e)
    }
  }

  return (
    <ButtonWrapper
      $variant={variant}
      $size={size}
      disabled={disabled || loading}
      $fullWidth={fullWidth}
      onClick={handleClick}
      className={className}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      $isBouncing={isBouncing}
      {...props}
    >
      {loading ? (
        <LoadingSpinner aria-label="Loading" />
      ) : (
        <>
          {icon && <span className="button-icon" aria-hidden="true">{renderIcon()}</span>}
          {children}
        </>
      )}
    </ButtonWrapper>
  )
}

export default Button
