import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { format, subDays, isSameDay, parseISO } from 'date-fns'

const StreakContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`

const StreakHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
`

const StreakTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.bodyLarge};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text.primary};
`

const StreakValue = styled.div`
  font-size: ${props => props.theme.typography.fontSize.headingLarge};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.primary};
`

const StreakTimeline = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  overflow-x: auto;
  padding: ${props => props.theme.spacing.sm} 0;
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
  
  ${({ completed, theme }) =>
    completed
      ? `
          background-color: ${theme.colors.primary};
          color: ${theme.colors.white};
        `
      : `
          background-color: ${theme.colors.border};
          color: ${theme.colors.text.secondary};
        `}
  
  ${({ isToday, theme }) =>
    isToday &&
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
  font-size: 24px;
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

const StreakVisualization = ({ habit, streak, longestStreak }) => {
  const getRecentDays = () => {
    const days = []
    const today = new Date()
    
    // Show last 14 days
    for (let i = 13; i >= 0; i--) {
      const day = subDays(today, i)
      const dayStr = format(day, 'yyyy-MM-dd')
      const completed = habit.completions.some(c => c.date === dayStr)
      
      days.push({
        date: day,
        dayNumber: format(day, 'd'),
        dayName: format(day, 'EEE'),
        completed,
        isToday: isSameDay(day, today)
      })
    }
    
    return days
  }

  const getMilestone = () => {
    if (streak >= 30) {
      return {
        icon: '🏆',
        title: 'Incredible!',
        description: '30+ day streak! You\'re building life-changing habits.'
      }
    }
    
    if (streak >= 21) {
      return {
        icon: '🔥',
        title: 'Amazing!',
        description: '21+ day streak! Your habit is becoming automatic.'
      }
    }
    
    if (streak >= 14) {
      return {
        icon: '⭐',
        title: 'Great Job!',
        description: '14+ day streak! You\'re making real progress.'
      }
    }
    
    if (streak >= 7) {
      return {
        icon: '👏',
        title: 'One Week!',
        description: '7-day streak! Keep up the great work.'
      }
    }
    
    if (streak >= 3) {
      return {
        icon: '💪',
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
        <StreakTitle>Current Streak</StreakTitle>
        <StreakValue>{streak} days</StreakValue>
      </StreakHeader>
      
      <StreakTimeline>
        {recentDays.map((day, index) => (
          <div key={day.date.toString()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <StreakDay
              completed={day.completed}
              isToday={day.isToday}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              {day.dayNumber}
            </StreakDay>
            <StreakDayLabel>{day.dayName}</StreakDayLabel>
          </div>
        ))}
      </StreakTimeline>
      
      {milestone && (
        <StreakMilestone>
          <MilestoneIcon>{milestone.icon}</MilestoneIcon>
          <MilestoneText>
            <MilestoneTitle>{milestone.title}</MilestoneTitle>
            <MilestoneDescription>{milestone.description}</MilestoneDescription>
          </MilestoneText>
        </StreakMilestone>
      )}
      
      {longestStreak > 0 && (
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>
            Longest streak: {longestStreak} days
          </div>
        </div>
      )}
    </StreakContainer>
  )
}

export default StreakVisualization