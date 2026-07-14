import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import Card from '../components/Card'
import BarChart from '../components/BarChart'
import LineChart from '../components/LineChart'
import CircularProgress from '../components/CircularProgress'
import StreakVisualization from '../components/StreakVisualization'
import AppIcon from '../components/AppIcon'
import { useHabits } from '../context/HabitsContext'
import { usePreferences } from '../context/PreferencesContext.jsx'
import {
  getHabitStreak,
  getMonthlyCompletionData,
  getTrackingStats,
  getWeeklyCompletionData
} from '../domain/habitTracking'

const ProgressContainer = styled.div`
  width: 100%;
  padding: ${props => props.theme.spacing.lg};
  padding-bottom: ${props => props.theme.spacing.xxxl};
  max-width: 600px;
  margin: 0 auto;

  @media (max-width: ${props => props.theme.breakpoints.narrow}) {
    padding: ${props => props.theme.spacing.md} 14px ${props => props.theme.spacing.xxxl};
  }
`

const Header = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};

  @media (max-width: ${props => props.theme.breakpoints.narrow}) {
    margin-bottom: ${props => props.theme.spacing.sm};
  }
`

const Title = styled.h1`
  font-size: ${props => props.theme.typography.fontSize.headingLarge};
  margin-bottom: ${props => props.theme.spacing.sm};

  @media (max-width: ${props => props.theme.breakpoints.narrow}) {
    font-size: 2rem;
  }
`

const TimePeriodSelector = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.lg};
`

const PeriodButton = styled.button`
  background: none;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.text.secondary};
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ $active, theme }) =>
    $active &&
    `
      background-color: ${theme.colors.primary};
      color: ${theme.colors.onPrimary};
      border-color: ${theme.colors.primary};
    `}
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};

  @media (max-width: ${props => props.theme.breakpoints.narrow}) {
    gap: ${props => props.theme.spacing.xs};
    margin-bottom: ${props => props.theme.spacing.sm};
  }
`

const ProgressCard = styled(Card)`
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
  display: flex;
  flex-direction: column;
  align-items: center;

  svg { width: 112px; height: 112px; }

  @media (max-width: ${props => props.theme.breakpoints.narrow}) {
    padding: ${props => props.theme.spacing.md};
    margin-bottom: ${props => props.theme.spacing.sm};

    svg {
      width: 112px;
      height: 112px;
    }
  }
`

const ProgressTitle = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.headingMedium};
  margin-bottom: ${props => props.theme.spacing.sm};
  text-align: center;

  @media (max-width: ${props => props.theme.breakpoints.narrow}) {
    margin-bottom: ${props => props.theme.spacing.sm};
    font-size: 1.2rem;
  }
`

const StreakSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
`

const StatCard = styled(Card)`
  text-align: center;
  padding: ${props => props.theme.spacing.md};

  @media (max-width: ${props => props.theme.breakpoints.narrow}) {
    min-width: 0;
    padding: ${props => props.theme.spacing.sm} 5px;
  }
`

const StatValue = styled.div`
  font-size: ${props => props.theme.typography.fontSize.headingLarge};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.$color || props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.xs};

  @media (max-width: ${props => props.theme.breakpoints.narrow}) {
    font-size: 1.55rem;
  }
`

const StatLabel = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
`

const ChartSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
`

const ChartTitle = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.headingMedium};
  margin-bottom: ${props => props.theme.spacing.md};
`

const InsightsSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`

const InsightsCard = styled(Card)`
  padding: ${props => props.theme.spacing.lg};
`

const InsightItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md} 0;
  
  &:not(:last-child) {
    border-bottom: 1px solid ${props => props.theme.colors.border};
  }
`

const InsightIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.small};
  background-color: ${props => props.$color || props.theme.colors.primary}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$color || props.theme.colors.primary};
  flex-shrink: 0;
`

const InsightContent = styled.div`
  flex: 1;
`

const InsightTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.bodyLarge};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  margin-bottom: ${props => props.theme.spacing.xs};
`

const InsightDescription = styled.p`
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  color: ${props => props.theme.colors.text.secondary};
  line-height: ${props => props.theme.typography.lineHeight.normal};
`

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xxl} ${props => props.theme.spacing.lg};
`

const EmptyStateIcon = styled.div`
  display: flex;
  justify-content: center;
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.lg};
`

const EmptyStateTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.headingMedium};
  margin-bottom: ${props => props.theme.spacing.sm};
`

const EmptyStateText = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.lg};
`

const ProgressStats = () => {
  const { habits } = useHabits()
  const { weekStartsOn } = usePreferences()
  const [timePeriod, setTimePeriod] = useState('week')
  const [weeklyData, setWeeklyData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [stats, setStats] = useState({})

  useEffect(() => {
    setWeeklyData(getWeeklyCompletionData(habits, new Date(), weekStartsOn))
    setMonthlyData(getMonthlyCompletionData(habits))
    setStats(getTrackingStats(habits))
  }, [habits, weekStartsOn])

  const getInsights = () => {
    const insights = []
    
    if (stats.completionRate === 100 && stats.totalHabits > 0) {
      insights.push({
        icon: 'target',
        title: 'Perfect Day!',
        description: 'You completed all your habits today. Keep up the amazing work!',
        color: '#6CC47C'
      })
    }
    
    if (stats.maxStreak >= 7) {
      insights.push({
        icon: 'flame',
        title: 'Week Long Streak',
        description: `You're on a ${stats.maxStreak}-day streak! Consistency is building strong habits.`,
        color: '#F6D860'
      })
    }
    
    if (stats.totalCompletions >= 50) {
      insights.push({
        icon: 'trophy',
        title: 'Milestone Reached',
        description: `You've completed ${stats.totalCompletions} habits total. Every completion counts!`,
        color: '#6CC47C'
      })
    }
    
    if (stats.totalHabits === 0) {
      insights.push({
        icon: 'seedling',
        title: 'Start Your Journey',
        description: 'Create your first habit to begin building a better you.',
        color: '#6CC47C'
      })
    }
    
    if (stats.completionRate < 50 && stats.totalHabits > 0) {
      insights.push({
        icon: 'dumbbell',
        title: 'Room to Grow',
        description: 'Focus on consistency rather than perfection. Small steps lead to big changes.',
        color: '#F6D860'
      })
    }
    
    return insights
  }

  const insights = getInsights()

  if (habits.length === 0) {
    return (
      <ProgressContainer>
        <Header>
          <Title>Progress</Title>
        </Header>
        
        <EmptyState>
          <EmptyStateIcon>
            <AppIcon name="chart-bar" size={64} />
          </EmptyStateIcon>
          <EmptyStateTitle>No progress yet</EmptyStateTitle>
          <EmptyStateText>Create your first habit to start tracking your progress.</EmptyStateText>
        </EmptyState>
      </ProgressContainer>
    )
  }

  return (
    <ProgressContainer>
      <Header>
        <Title>Progress</Title>
      </Header>

      <ProgressCard elevated>
        <ProgressTitle>Today's Progress</ProgressTitle>
        <CircularProgress
          progress={stats.completionRate}
          size={150}
          strokeWidth={12}
          label={`${stats.todayCompletions}/${stats.totalHabits} habits`}
        />
      </ProgressCard>

      <StatsGrid>
        <StatCard elevated>
          <StatValue>{stats.totalHabits}</StatValue>
          <StatLabel>Total Habits</StatLabel>
        </StatCard>
        <StatCard elevated>
          <StatValue>{stats.completionRate}%</StatValue>
          <StatLabel>Today's Rate</StatLabel>
        </StatCard>
        <StatCard elevated>
          <StatValue>{stats.maxStreak || 0}</StatValue>
          <StatLabel>Top Current Streak</StatLabel>
        </StatCard>
      </StatsGrid>

      {habits.length > 0 && (
        <StreakSection>
          <ChartTitle>Current Streaks</ChartTitle>
          {habits.map(habit => {
            const streak = getHabitStreak(habit)
            
            return (
              <Card key={habit.id} elevated padding="small" style={{ marginBottom: '16px' }}>
                <StreakVisualization
                  habit={habit}
                  streak={streak}
                />
              </Card>
            )
          })}
        </StreakSection>
      )}

      <ChartSection>
        <ChartTitle>Weekly Overview</ChartTitle>
        <Card elevated>
          <BarChart
            data={weeklyData}
            height={200}
            barWidth={24}
            spacing={8}
            showValues={false}
          />
        </Card>
      </ChartSection>

      <ChartSection>
        <ChartTitle>Monthly Trend</ChartTitle>
        <Card elevated>
          <LineChart
            data={monthlyData.map(d => ({
              ...d,
              value: d.percentage,
              label: d.day.toString()
            }))}
            height={200}
            showDots={true}
            showArea={true}
          />
        </Card>
      </ChartSection>

      {insights.length > 0 && (
        <InsightsSection>
          <ChartTitle>Insights</ChartTitle>
          <InsightsCard elevated>
            {insights.map((insight, index) => (
              <InsightItem key={index}>
                <InsightIcon $color={insight.color}>
                  <AppIcon name={insight.icon} size={22} />
                </InsightIcon>
                <InsightContent>
                  <InsightTitle>{insight.title}</InsightTitle>
                  <InsightDescription>{insight.description}</InsightDescription>
                </InsightContent>
              </InsightItem>
            ))}
          </InsightsCard>
        </InsightsSection>
      )}
    </ProgressContainer>
  )
}

export default ProgressStats
