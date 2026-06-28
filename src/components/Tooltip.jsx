import React, { useState, useRef, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const TooltipContainer = styled(motion.div)`
  position: absolute;
  background-color: ${props => props.theme.colors.white};
  color: ${props => props.theme.colors.text.primary};
  border-radius: ${props => props.theme.borderRadius.medium};
  box-shadow: ${props => props.theme.shadows.strong};
  padding: ${props => props.theme.spacing.md};
  z-index: 1000;
  min-width: 200px;
  max-width: 300px;
  animation: ${fadeIn} 0.2s ease-out;
  
  ${({ position }) => {
    switch (position) {
      case 'top':
        return 'bottom: 100%; left: 50%; transform: translateX(-50%); margin-bottom: 8px;'
      case 'bottom':
        return 'top: 100%; left: 50%; transform: translateX(-50%); margin-top: 8px;'
      case 'left':
        return 'right: 100%; top: 50%; transform: translateY(-50%); margin-right: 8px;'
      case 'right':
        return 'left: 100%; top: 50%; transform: translateY(-50%); margin-left: 8px;'
      default:
        return 'top: 100%; left: 50%; transform: translateX(-50%); margin-top: 8px;'
    }
  }}
  
  &::after {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border-style: solid;
    
    ${({ position }) => {
      switch (position) {
        case 'top':
          return `
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            border-width: 8px 8px 0 8px;
            border-color: ${props => props.theme.colors.white} transparent transparent transparent;
          `
        case 'bottom':
          return `
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            border-width: 0 8px 8px 8px;
            border-color: transparent transparent ${props => props.theme.colors.white} transparent;
          `
        case 'left':
          return `
            right: -8px;
            top: 50%;
            transform: translateY(-50%);
            border-width: 8px 0 8px 8px;
            border-color: transparent transparent transparent ${props => props.theme.colors.white};
          `
        case 'right':
          return `
            left: -8px;
            top: 50%;
            transform: translateY(-50%);
            border-width: 8px 8px 8px 0;
            border-color: transparent ${props => props.theme.colors.white} transparent transparent;
          `
        default:
          return `
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            border-width: 0 8px 8px 8px;
            border-color: transparent transparent ${props => props.theme.colors.white} transparent;
          `
      }
    }}
  }
`

const TooltipTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  margin-bottom: ${props => props.theme.spacing.sm};
`

const TooltipContent = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
`

const TooltipList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`

const TooltipListItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.xs};
  
  &:last-child {
    margin-bottom: 0;
  }
`

const HabitStatus = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`

const HabitIcon = styled.span`
  font-size: 16px;
`

const HabitName = styled.span`
  flex: 1;
`

const CompletionStatus = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.$completed ? props.theme.colors.primary : props.theme.colors.text.secondary};
`

const Tooltip = ({ 
  children, 
  content, 
  title,
  position = 'bottom',
  trigger = 'click',
  enabled = true 
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const tooltipRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target) &&
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        setIsVisible(false)
      }
    }

    if (isVisible && trigger === 'click') {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVisible, trigger])

  const handleTrigger = () => {
    if (enabled) {
      setIsVisible(!isVisible)
    }
  }

  const renderContent = () => {
    if (typeof content === 'string') {
      return <TooltipContent>{content}</TooltipContent>
    }
    
    if (Array.isArray(content)) {
      return (
        <TooltipList>
          {content.map((item, index) => (
            <TooltipListItem key={index}>
              <HabitStatus>
                <HabitIcon>{item.icon || '✓'}</HabitIcon>
                <HabitName>{item.name}</HabitName>
                <CompletionStatus $completed={item.completed}>
                  {item.completed ? '✓' : '✗'}
                </CompletionStatus>
              </HabitStatus>
            </TooltipListItem>
          ))}
        </TooltipList>
      )
    }
    
    return content
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={triggerRef}>
      <div 
        onClick={trigger === 'click' ? handleTrigger : undefined}
        onMouseEnter={trigger === 'hover' ? () => setIsVisible(true) : undefined}
        onMouseLeave={trigger === 'hover' ? () => setIsVisible(false) : undefined}
      >
        {children}
      </div>
      
      {isVisible && enabled && (
        <TooltipContainer
          ref={tooltipRef}
          position={position}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.2 }}
        >
          {title && <TooltipTitle>{title}</TooltipTitle>}
          {renderContent()}
        </TooltipContainer>
      )}
    </div>
  )
}

export default Tooltip
