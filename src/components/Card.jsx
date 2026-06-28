import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const CardWrapper = styled(motion.div)`
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.borderRadius.medium};
  box-shadow: ${props => {
    if (props.$elevated) return props.theme.shadows.medium
    if (props.$border) return 'none'
    return props.theme.shadows.subtle
  }};
  border: ${props => props.$border ? `1px solid ${props.theme.colors.border}` : 'none'};
  overflow: hidden;
  transition: all 0.2s ease;
  
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
        transform: translateY(-2px);
        box-shadow: ${theme.shadows.medium};
      }
      
      &:active {
        transform: translateY(0);
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </CardWrapper>
  )
}

export default Card
