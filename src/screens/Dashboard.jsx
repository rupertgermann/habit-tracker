import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { format, isToday } from 'date-fns'
import Card from '../components/Card'
import Button from '../components/Button'
import CircularProgress from '../components/CircularProgress'
import BarChart from '../components/BarChart'
import { useHabits } from '../context/HabitsContext'

const DashboardContainer = styled.div`
  padding: ${props => props.theme.spacing.lg};
  padding-bottom: ${props => props.theme.spacing.xxxl};
  max-width: 600px;
  margin: 0 auto;
`

const Header = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`

const Title = styled.h1`
  font-size: ${props => props.theme.typography.fontSize.headingLarge};
  margin-bottom: ${props => props.theme.spacing.xs};
`

const DateText = styled.p`
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  color: ${props => props.theme.colors.text.secondary};
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.lg};
`

const StatCard = styled(Card)`
  text-align: center;
  padding: ${props => props.theme.spacing.lg};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

const StatValue = styled.div`
  font-size: ${props => props.theme.typography.fontSize.headingLarge};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.color || props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.xs};
`

const StatLabel = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
`

const ProgressCard = styled(Card)`
  padding: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  flex-direction: column;
  align-items: center;
`

const ProgressTitle = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.headingMedium};
  margin-bottom: ${props => props.theme.spacing.lg};
  text-align: center;
`

const MotivationalCard = styled(Card)`
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
  color: ${props => props.theme.colors.white};
  text-align: center;
`

const MotivationalTitle = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.headingMedium};
  margin-bottom: ${props => props.theme.spacing.sm};
`

const MotivationalText = styled.p`
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  opacity: 0.9;
`

const HabitsSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
`

const SectionTitle = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.headingMedium};
`

const HabitsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`

const HabitItem = styled(Card)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.lg};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.medium};
  }
`

const HabitInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  flex: 1;
`

const HabitIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.small};
  background-color: ${props => props.color || props.theme.colors.primary}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.primary};
  font-size: 20px;
`

const HabitDetails = styled.div`
  flex: 1;
`

const HabitName = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.bodyLarge};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  margin-bottom: ${props => props.theme.spacing.xs};
`

const HabitMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`

const HabitStreak = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`

const CheckButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: ${props => props.theme.borderRadius.round};
  border: 2px solid ${props => props.checked ? props.theme.colors.primary : props.theme.colors.border};
  background-color: ${props => props.checked ? props.theme.colors.primary : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`

const CheckIcon = styled.svg`
  width: 16px;
  height: 16px;
  stroke: ${props => props.theme.colors.white};
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
`

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xxl} ${props => props.theme.spacing.lg};
`

const EmptyStateIcon = styled.div`
  font-size: 64px;
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

const Dashboard = () => {
  const navigate = useNavigate()
  const { habits, getTodayHabits, getWeeklyCompletionData, getStats } = useHabits()
  const [todayHabits, setTodayHabits] = useState([])
  const [weeklyData, setWeeklyData] = useState([])
  const [stats, setStats] = useState({})

  useEffect(() => {
    setTodayHabits(getTodayHabits())
    setWeeklyData(getWeeklyCompletionData())
    setStats(getStats())
  }, [getTodayHabits, getWeeklyCompletionData, getStats])

  const handleToggleHabit = (habitId) => {
    const updatedHabits = todayHabits.map(habit => {
      if (habit.id === habitId) {
        return { ...habit, isCompleted: !habit.isCompleted }
      }
      return habit
    })
    setTodayHabits(updatedHabits)
  }

  const getMotivationalMessage = () => {
    const { completionRate, maxStreak } = stats
    
    if (habits.length === 0) {
      return {
        title: "Start Your Journey",
        text: "Create your first habit and begin building a better you!"
      }
    }
    
    if (completionRate === 100) {
      return {
        title: "Perfect Day! 🎉",
        text: "You've completed all your habits today. Amazing work!"
      }
    }
    
    if (completionRate >= 75) {
      return {
        title: "Great Progress!",
        text: "You're almost there. Keep pushing!"
      }
    }
    
    if (maxStreak >= 7) {
      return {
        title: "On Fire! 🔥",
        text: `You're on a ${maxStreak}-day streak. Keep it up!`
      }
    }
    
    if (completionRate >= 50) {
      return {
        title: "Halfway There!",
        text: "You're making good progress. Keep going!"
      }
    }
    
    return {
      title: "Every Step Counts",
      text: "Small consistent actions lead to big results."
    }
  }

  const motivationalMessage = getMotivationalMessage()

  if (habits.length === 0) {
    return (
      <DashboardContainer>
        <Header>
          <Title>Dashboard</Title>
          <DateText>{format(new Date(), 'EEEE, MMMM d')}</DateText>
        </Header>
        
        <EmptyState>
          <EmptyStateIcon>📊</EmptyStateIcon>
          <EmptyStateTitle>Welcome to Habit Tracker</EmptyStateTitle>
          <EmptyStateText>Start building better habits by creating your first one.</EmptyStateText>
          <Button onClick={() => navigate('/add-habit')}>
            Create Your First Habit
          </Button>
        </EmptyState>
      </DashboardContainer>
    )
  }

  return (
    <DashboardContainer>
      <Header>
        <Title>Dashboard</Title>
        <DateText>{format(new Date(), 'EEEE, MMMM d')}</DateText>
      </Header>

      <StatsGrid>
        <StatCard elevated>
          <StatValue>{stats.totalHabits}</StatValue>
          <StatLabel>Total Habits</StatLabel>
        </StatCard>
        <StatCard elevated>
          <StatValue>{stats.completionRate}%</StatValue>
          <StatLabel>Today's Rate</StatLabel>
        </StatCard>
      </StatsGrid>

      <ProgressCard elevated>
        <ProgressTitle>Today's Progress</ProgressTitle>
        <CircularProgress
          progress={stats.completionRate}
          size={150}
          strokeWidth={12}
          label={`${stats.todayCompletions}/${stats.totalHabits} habits`}
        />
      </ProgressCard>

      <MotivationalCard elevated>
        <MotivationalTitle>{motivationalMessage.title}</MotivationalTitle>
        <MotivationalText>{motivationalMessage.text}</MotivationalText>
      </MotivationalCard>

      <HabitsSection>
        <SectionHeader>
          <SectionTitle>Today's Habits</SectionTitle>
          <Button variant="ghost" onClick={() => navigate('/habits')}>
            View All
          </Button>
        </SectionHeader>
        
        <HabitsList>
          {todayHabits.map((habit) => (
            <HabitItem
              key={habit.id}
              clickable
              onClick={() => navigate(`/habit/${habit.id}`)}
              elevated
            >
              <HabitInfo>
                <HabitIcon color={habit.color}>
                  {habit.icon || '✓'}
                </HabitIcon>
                <HabitDetails>
                  <HabitName>{habit.name}</HabitName>
                  <HabitMeta>
                    <HabitStreak>
                      🔥 {habit.streak || 0} days
                    </HabitStreak>
                  </HabitMeta>
                </HabitDetails>
              </HabitInfo>
              <CheckButton
                checked={habit.isCompleted}
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleHabit(habit.id)
                }}
              >
                {habit.isCompleted && (
                  <CheckIcon>
                    <polyline points="20 6 9 17 4 12" />
                  </CheckIcon>
                )}
              </CheckButton>
            </HabitItem>
          ))}
        </HabitsList>
      </HabitsSection>

      <HabitsSection>
        <SectionHeader>
          <SectionTitle>Weekly Overview</SectionTitle>
          <Button variant="ghost" onClick={() => navigate('/calendar')}>
            View Calendar
          </Button>
        </SectionHeader>
        
        <Card elevated>
          <BarChart
            data={weeklyData}
            height={200}
            barWidth={24}
            spacing={8}
            showValues={false}
          />
        </Card>
      </HabitsSection>
    </DashboardContainer>
  )
}

export default Dashboard