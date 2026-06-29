import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import Button from './Button'
import AppIcon from './AppIcon'

const EmptyStateContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: ${props => props.theme.spacing.xxl};
  min-height: 300px;
`

const EmptyStateIconWrap = styled.div`
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  border-radius: ${props => props.theme.borderRadius.large};
  background-color: ${props => props.theme.colors.primary}15;
  color: ${props => props.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${props => props.theme.spacing.xl};
`

const emptyStateIconByType = {
  habits: 'checkbox',
  progress: 'chart-line',
  calendar: 'calendar',
  achievement: 'trophy',
  search: 'search',
  default: 'sparkles'
}

const EmptyStateIllustration = ({ type, size = 120, icon }) => {
  const iconNode = icon || (
    <AppIcon
      name={emptyStateIconByType[type] || emptyStateIconByType.default}
      size={Math.round(size * 0.48)}
      stroke={1.8}
    />
  )

  return (
    <EmptyStateIconWrap $size={size}>
      {iconNode}
    </EmptyStateIconWrap>
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
  icon,
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

  const defaultContent = getDefaultContent()
  const content = {
    title: title ?? defaultContent.title,
    description: description ?? defaultContent.description,
    actionText: actionText ?? defaultContent.actionText
  }

  return (
    <EmptyStateContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <EmptyStateIllustration type={type} size={illustrationSize} icon={icon} />
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
