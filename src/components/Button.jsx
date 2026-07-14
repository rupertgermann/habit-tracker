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
  font-family: ${props => props.theme.typography.monoFamily};
  font-weight: 700;
  letter-spacing: 0.055em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background var(--duration-fast) ease,
    color var(--duration-fast) ease,
    border-color var(--duration-fast) ease,
    box-shadow var(--duration-fast) ease,
    transform var(--duration-fast) ease;
  position: relative;
  overflow: hidden;
  
  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'primary':
        return `
          background-color: ${theme.colors.primary};
          color: ${theme.colors.onPrimary};
          border: 1px solid ${theme.colors.borderStrong};
          box-shadow: 3px 3px 0 ${theme.colors.borderStrong};
          
          &:hover:not(:disabled) {
            background-color: ${theme.colors.primaryHover};
            transform: translate(-2px, -2px);
            box-shadow: 5px 5px 0 ${theme.colors.borderStrong};
          }
        `
      case 'secondary':
        return `
          background-color: ${theme.colors.secondary};
          color: #111411;
          border: 1px solid ${theme.colors.borderStrong};
          box-shadow: 3px 3px 0 ${theme.colors.borderStrong};
          
          &:hover:not(:disabled) {
            filter: brightness(0.95);
            transform: translate(-2px, -2px);
            box-shadow: 5px 5px 0 ${theme.colors.borderStrong};
          }
        `
      case 'ghost':
        return `
          background-color: transparent;
          color: ${theme.colors.primary};
          border: 1px solid transparent;
          
          &:hover:not(:disabled) {
            background-color: ${theme.colors.surfaceAlt};
            border-color: ${theme.colors.primary};
          }
        `
      case 'destructive':
        return `
          background-color: ${theme.colors.destructive};
          color: #FFFFFF;
          border: 1px solid ${theme.colors.borderStrong};
          
          &:hover:not(:disabled) {
            filter: brightness(0.9);
          }
        `
      default:
        return `
          background-color: ${theme.colors.primary};
          color: ${theme.colors.onPrimary};
          border: 1px solid ${theme.colors.borderStrong};
          
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
    transform: translate(1px, 1px) !important;
    box-shadow: 1px 1px 0 ${props => props.theme.colors.borderStrong};
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
  border: 2px solid currentColor;
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
