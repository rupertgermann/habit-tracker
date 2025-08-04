import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const CardWrapper = styled(motion.div)`
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.borderRadius.medium};
  overflow: hidden;
  
  ${({ padding, theme }) => {
    switch (padding) {
      case 'none':
        return 'padding: 0;'
      case 'small':
        return `padding: ${theme.spacing.md};`
      case 'medium':
        return `padding: ${theme.spacing.lg};`
      case 'large':
        return `padding: ${theme.spacing.xl};`
      default:
        return `padding: ${theme.spacing.lg};`
    }
  }}
  
  ${({ elevated, theme }) =>
    elevated &&
    `
      box-shadow: ${theme.shadows.medium};
    `}
  
  ${({ clickable }) =>
    clickable &&
    `
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: ${props => props.theme.shadows.strong};
      }
    `}
  
  ${({ border, theme }) =>
    border &&
    `
      border: 1px solid ${theme.colors.border};
    `}
`

const Card = ({
  children,
  padding = 'medium',
  elevated = false,
  clickable = false,
  border = false,
  onClick,
  ...props
}) => {
  const cardVariants = {
    hover: clickable ? { y: -2 } : {},
    tap: clickable ? { y: 0 } : {}
  }

  return (
    <CardWrapper
      padding={padding}
      elevated={elevated}
      clickable={clickable}
      border={border}
      onClick={onClick}
      variants={cardVariants}
      whileHover={clickable ? 'hover' : undefined}
      whileTap={clickable ? 'tap' : undefined}
      {...props}
    >
      {children}
    </CardWrapper>
  )
}

export default Card