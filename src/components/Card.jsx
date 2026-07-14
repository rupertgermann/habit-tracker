import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const CardWrapper = styled(motion.div)`
  position: relative;
  background-color: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.medium};
  box-shadow: ${props => {
    if (props.$elevated) return props.theme.shadows.medium
    if (props.$border) return 'none'
    return props.theme.shadows.subtle
  }};
  border: 1px solid ${props => props.$elevated ? props.theme.colors.borderStrong : props.theme.colors.border};
  overflow: hidden;
  transition:
    border-color var(--duration-fast) ease,
    box-shadow var(--duration-fast) ease,
    transform var(--duration-fast) ease;
  
  ${({ $padding, theme }) => {
    switch ($padding) {
      case 'none':
        return 'padding: 0;'
      case 'small':
        return `padding: ${theme.spacing.md};`
      case 'large':
        return `padding: ${theme.spacing.xl};`
      default:
        return `padding: ${theme.spacing.lg};`
    }
  }}
  
  ${({ $clickable, theme }) =>
    $clickable &&
    `
      cursor: pointer;
      
      &:hover {
        transform: translate(-3px, -3px);
        border-color: ${theme.colors.primary};
        box-shadow: ${theme.shadows.medium};
      }
      
      &:active {
        transform: translate(0, 0);
        box-shadow: ${theme.shadows.subtle};
      }
    `}
`

const Card = ({ 
  children, 
  padding = 'medium', 
  elevated = false, 
  clickable = false, 
  border = false,
  className,
  ...props 
}) => {
  return (
    <CardWrapper
      $padding={padding}
      $elevated={elevated}
      $clickable={clickable}
      $border={border}
      className={className}
      initial={false}
      {...props}
    >
      {children}
    </CardWrapper>
  )
}

export default Card
