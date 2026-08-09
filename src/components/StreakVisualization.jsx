import React, { useLayoutEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { getRecentActivityDays } from '../domain/habitTracking'
import AppIcon from './AppIcon'

const StreakContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`

const StreakHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.sm};
`

const StreakTitle = styled.h3`
  min-width: 0;
  font-size: ${props => props.theme.typography.fontSize.bodyLarge};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text.primary};
  overflow-wrap: anywhere;
`

const StreakValue = styled.div`
  flex-shrink: 0;
  font-size: ${props => props.theme.typography.fontSize.headingLarge};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.primary};
`

const StreakTimeline = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: ${props => props.theme.spacing.xs};
  width: 100%;
  overflow-x: auto;
  padding: ${props => props.theme.spacing.sm} 0;
  touch-action: pan-x;
  -webkit-overflow-scrolling: touch;
  user-select: none;
  -webkit-user-select: none;
  cursor: ${props => props.$isDragging ? 'grabbing' : 'grab'};
  scrollbar-width: thin;
  scrollbar-color: ${props => props.theme.colors.border} ${props => `${props.theme.colors.border}40`};

  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background-color: ${props => `${props.theme.colors.border}40`};
    border-radius: 999px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme.colors.border};
    border-radius: 999px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: ${props => props.theme.colors.primary};
  }
`

const StreakDayItem = styled.div`
  flex: 0 0 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const StreakDay = styled(motion.div)`
  min-width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.small};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  position: relative;
  
  ${({ $completed, theme }) =>
    $completed
      ? `
          background-color: ${theme.colors.primary};
          color: ${theme.colors.white};
        `
      : `
          background-color: ${theme.colors.border};
          color: ${theme.colors.text.secondary};
        `}
  
  ${({ $isToday, theme }) =>
    $isToday &&
    `
      border: 2px solid ${theme.colors.primary};
    `}
`

const StreakDayLabel = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
  margin-top: ${props => props.theme.spacing.xs};
  text-align: center;
`

const StreakMilestone = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.medium};
  background-color: ${props => props.theme.colors.primary}10;
  border: 1px solid ${props => props.theme.colors.primary}30;
`

const MilestoneIcon = styled.div`
  display: inline-flex;
  color: ${props => props.theme.colors.primary};
`

const MilestoneText = styled.div`
  flex: 1;
`

const MilestoneTitle = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text.primary};
`

const MilestoneDescription = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
`

const StreakVisualization = ({ habit, streak }) => {
  const timelineRef = useRef(null)
  const todayRef = useRef(null)
  const dragRef = useRef({ isDragging: false, pointerId: null, startX: 0, startScrollLeft: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const handlePointerDown = event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return

    const timeline = timelineRef.current
    if (!timeline) return

    dragRef.current = {
      isDragging: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: timeline.scrollLeft
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDragging(true)
  }

  const handlePointerMove = event => {
    const drag = dragRef.current
    const timeline = timelineRef.current
    if (!drag.isDragging || drag.pointerId !== event.pointerId || !timeline) return

    event.preventDefault()
    timeline.scrollLeft = drag.startScrollLeft - (event.clientX - drag.startX)
  }

  const handlePointerUp = event => {
    const drag = dragRef.current
    if (!drag.isDragging || drag.pointerId !== event.pointerId) return

    dragRef.current.isDragging = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setIsDragging(false)
  }

  useLayoutEffect(() => {
    const timeline = timelineRef.current
    const today = todayRef.current
    if (!timeline || !today) return

    const timelineBounds = timeline.getBoundingClientRect()
    const todayBounds = today.getBoundingClientRect()
    const todayOffset = todayBounds.left - timelineBounds.left + timeline.scrollLeft
    const centeredScrollLeft = todayOffset - (timeline.clientWidth - today.offsetWidth) / 2
    const maxScrollLeft = timeline.scrollWidth - timeline.clientWidth
    timeline.scrollLeft = Math.max(0, Math.min(centeredScrollLeft, maxScrollLeft))
  }, [habit.id])

  const getRecentDays = () => {
    return getRecentActivityDays(habit, 14).map(day => ({
      ...day,
      completed: day.isCompleted
    }))
  }

  const getMilestone = () => {
    if (streak >= 30) {
      return {
        icon: 'trophy',
        title: 'Incredible!',
        description: '30+ day streak! You\'re building life-changing habits.'
      }
    }
    
    if (streak >= 21) {
      return {
        icon: 'flame',
        title: 'Amazing!',
        description: '21+ day streak! Your habit is becoming automatic.'
      }
    }
    
    if (streak >= 14) {
      return {
        icon: 'star',
        title: 'Great Job!',
        description: '14+ day streak! You\'re making real progress.'
      }
    }
    
    if (streak >= 7) {
      return {
        icon: 'circle-check',
        title: 'One Week!',
        description: '7-day streak! Keep up the great work.'
      }
    }
    
    if (streak >= 3) {
      return {
        icon: 'dumbbell',
        title: 'Getting Started!',
        description: '3-day streak! You\'re building momentum.'
      }
    }
    
    return null
  }

  const recentDays = getRecentDays()
  const milestone = getMilestone()

  return (
    <StreakContainer>
      <StreakHeader>
        <StreakTitle>{habit.name}</StreakTitle>
        <StreakValue>{streak} days</StreakValue>
      </StreakHeader>
      
      <StreakTimeline
        ref={timelineRef}
        data-testid="streak-timeline"
        $isDragging={isDragging}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {recentDays.map((day, index) => (
          <StreakDayItem
            key={day.date.toString()}
            ref={day.isToday ? todayRef : undefined}
            data-current-day={day.isToday ? 'true' : undefined}
          >
            <StreakDay
              $completed={day.completed}
              $isToday={day.isToday}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              {day.dayNumber}
            </StreakDay>
            <StreakDayLabel>{day.dayName}</StreakDayLabel>
          </StreakDayItem>
        ))}
      </StreakTimeline>
      
      {milestone && (
        <StreakMilestone>
          <MilestoneIcon>
            <AppIcon name={milestone.icon} size={24} />
          </MilestoneIcon>
          <MilestoneText>
            <MilestoneTitle>{milestone.title}</MilestoneTitle>
            <MilestoneDescription>{milestone.description}</MilestoneDescription>
          </MilestoneText>
        </StreakMilestone>
      )}
      
    </StreakContainer>
  )
}

export default StreakVisualization
