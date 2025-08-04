import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import Button from './Button'

const EmptyStateContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: ${props => props.theme.spacing.xxl};
  min-height: 300px;
`

const IllustrationContainer = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
  position: relative;
`

const EmptyStateIllustration = ({ type, size = 120 }) => {
  const getIllustration = () => {
    switch (type) {
      case 'habits':
        return (
          <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="80" fill="#f0f9ff" stroke="#0ea5e9" strokeWidth="2"/>
            <path d="M60 80L90 110L140 60" stroke="#0ea5e9" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="60" cy="80" r="6" fill="#0ea5e9"/>
            <circle cx="90" cy="110" r="6" fill="#0ea5e9"/>
            <circle cx="140" cy="60" r="6" fill="#0ea5e9"/>
          </svg>
        )
      case 'progress':
        return (
          <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="40" y="40" width="120" height="120" rx="12" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2"/>
            <path d="M60 100L80 120L120 80" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="100" cy="70" r="15" fill="#f59e0b"/>
            <path d="M100 55V85M85 70H115" stroke="white" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        )
      case 'calendar':
        return (
          <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="40" y="50" width="120" height="110" rx="8" fill="#f3e8ff" stroke="#8b5cf6" strokeWidth="2"/>
            <rect x="40" y="50" width="120" height="30" rx="8" fill="#8b5cf6"/>
            <circle cx="70" cy="65" r="4" fill="white"/>
            <circle cx="100" cy="65" r="4" fill="white"/>
            <circle cx="130" cy="65" r="4" fill="white"/>
            <rect x="60" y="100" width="20" height="20" rx="4" fill="#ddd6fe"/>
            <rect x="90" y="100" width="20" height="20" rx="4" fill="#ddd6fe"/>
            <rect x="120" y="100" width="20" height="20" rx="4" fill="#ddd6fe"/>
            <rect x="60" y="130" width="20" height="20" rx="4" fill="#ddd6fe"/>
            <rect x="90" y="130" width="20" height="20" rx="4" fill="#8b5cf6"/>
            <rect x="120" y="130" width="20" height="20" rx="4" fill="#ddd6fe"/>
          </svg>
        )
      case 'achievement':
        return (
          <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="80" fill="#fef2f2" stroke="#ef4444" strokeWidth="2"/>
            <path d="M100 60L110 85L135 85L115 100L125 125L100 110L75 125L85 100L65 85L90 85Z" fill="#ef4444"/>
            <circle cx="100" cy="40" r="15" fill="#fbbf24"/>
            <path d="M100 25V40M85 30L100 40L115 30" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )
      case 'search':
        return (
          <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="85" cy="85" r="50" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2"/>
            <circle cx="85" cy="85" r="30" fill="none" stroke="#0284c7" strokeWidth="3"/>
            <line x1="110" y1="110" x2="150" y2="150" stroke="#0284c7" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="85" cy="85" r="5" fill="#0284c7"/>
          </svg>
        )
      default:
        return (
          <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="80" fill="#f0fdf4" stroke="#22c55e" strokeWidth="2"/>
            <path d="M70 100L90 120L130 80" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
    }
  }

  return (
    <IllustrationContainer>
      {getIllustration()}
    </IllustrationContainer>
  )
}

const EmptyStateTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.headingMedium};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  margin-bottom: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.primary};
`

const EmptyStateDescription = styled.p`
  font-size: ${props => props.theme.typography.fontSize.bodyLarge};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.lg};
  max-width: 400px;
  line-height: ${props => props.theme.typography.lineHeight.relaxed};
`

const EmptyState = ({ 
  type = 'default', 
  title, 
  description, 
  action, 
  actionText, 
  onAction,
  illustrationSize = 120 
}) => {
  const getDefaultContent = () => {
    switch (type) {
      case 'habits':
        return {
          title: "No Habits Yet",
          description: "Start building better habits by creating your first one. Small steps lead to big changes!",
          actionText: "Create Your First Habit"
        }
      case 'progress':
        return {
          title: "No Progress Data",
          description: "Complete some habits to see your progress visualized here. Track your journey to success!",
          actionText: "View Habits"
        }
      case 'calendar':
        return {
          title: "No Calendar Activity",
          description: "Your calendar is empty. Start completing habits to see your activity here.",
          actionText: "Go to Habits"
        }
      case 'achievement':
        return {
          title: "No Achievements Yet",
          description: "Complete habits consistently to unlock achievements and celebrate your progress!",
          actionText: "Start Building Habits"
        }
      case 'search':
        return {
          title: "No Results Found",
          description: "We couldn't find what you're looking for. Try adjusting your search or filters.",
          actionText: "Clear Search"
        }
      default:
        return {
          title: "Nothing Here Yet",
          description: "This space is waiting for your activity. Get started to see something amazing!",
          actionText: "Get Started"
        }
    }
  }

  const content = {
    title,
    description,
    actionText,
    ...getDefaultContent()
  }

  return (
    <EmptyStateContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <EmptyStateIllustration type={type} size={illustrationSize} />
      <EmptyStateTitle>{content.title}</EmptyStateTitle>
      <EmptyStateDescription>{content.description}</EmptyStateDescription>
      {(action || onAction) && (
        <Button 
          onClick={onAction || action}
          variant="primary"
          size="medium"
        >
          {content.actionText}
        </Button>
      )}
    </EmptyStateContainer>
  )
}

export default EmptyState