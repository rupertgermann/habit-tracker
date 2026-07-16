import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import Card from '../components/Card'
import Button from '../components/Button'
import CircularProgress from '../components/CircularProgress'
import BarChart from '../components/BarChart'
import Confetti from '../components/Confetti'
import CountStepper from '../components/CountStepper'
import EmptyState from '../components/EmptyState'
import AppIcon from '../components/AppIcon'
import { useHabits } from '../context/HabitsContext'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { useToast } from '../context/ToastContext'
import { DEFAULT_HABIT_ICON } from '../domain/iconCatalog'

const DashboardContainer = styled.div`
  width: 100%;
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
  color: ${props => props.$color || props.theme.colors.primary};
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
  background-color: ${props => props.$color || props.theme.colors.primary}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.primary};
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

const CheckButton = styled(motion.button)`
  width: 32px;
  height: 32px;
  border-radius: ${props => props.theme.borderRadius.round};
  border: 2px solid ${props => props.$checked ? props.theme.colors.primary : props.theme.colors.border};
  background-color: ${props => props.$checked ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.theme.colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`

const StatusCard = styled(Card)`
  max-width: 680px;
  margin: ${props => props.theme.spacing.xxl} auto 0;
  padding: ${props => props.theme.spacing.xxl};
  text-align: center;

  h2 {
    margin-bottom: ${props => props.theme.spacing.sm};
  }

  p {
    margin-bottom: ${props => props.theme.spacing.lg};
    color: ${props => props.theme.colors.text.secondary};
  }
`

const Dashboard = () => {
  const navigate = useNavigate()
  const {
    dashboardHabitTracking,
    isLoading,
    hasLoaded,
    error
  } = useHabits()
  const { weekStartsOn } = usePreferences()
  const { showSuccessToast, showErrorToast } = useToast()
  const [showConfetti, setShowConfetti] = useState(false)
  const referenceDate = new Date()
  const {
    todayHabits,
    weeklyCompletionFacts: weeklyData,
    totalHabits,
    todayCompletedCount,
    completionRate,
    topCurrentStreak
  } = dashboardHabitTracking.getSnapshot({ referenceDate, weekStartsOn })

  const handleToggleHabit = async (habitId) => {
    const habit = todayHabits.find(h => h.id === habitId)
    if (!habit) return { ok: false }

    const result = await dashboardHabitTracking.toggleYesNo({
      habitId,
      referenceDate: new Date()
    })
    if (!result.ok) {
      showErrorToast(`Could not update "${habit.name}". Please try again.`)
      return result
    }

    // Show toast notification
    if (result.completionState === 'complete') {
      showSuccessToast(`Great job! "${habit.name}" completed!`)
      
      // Show confetti for milestone completions
      if (result.allComplete) {
        // All habits completed
        setShowConfetti(true)
        showSuccessToast('Perfect day! All habits completed!')
      } else if (result.intermediateMilestone) {
        // Every 3 habits completed
        setShowConfetti(true)
      }
    }

    return result
  }

  const getMotivationalMessage = () => {
    if (totalHabits === 0) {
      return {
        title: "Start Your Journey",
        text: "Create your first habit and begin building a better you!"
      }
    }
    
    if (completionRate === 100) {
      return {
        title: "Perfect Day!",
        text: "You've completed all your habits today. Amazing work!"
      }
    }
    
    if (completionRate >= 75) {
      return {
        title: "Great Progress!",
        text: "You're almost there. Keep pushing!"
      }
    }
    
    if (topCurrentStreak >= 7) {
      return {
        title: "On Fire!",
        text: `You're on a ${topCurrentStreak}-day streak. Keep it up!`
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

  if (isLoading && !hasLoaded) {
    return (
      <DashboardContainer aria-busy="true">
        <Header>
          <Title>Dashboard</Title>
          <DateText>{format(referenceDate, 'EEEE, MMMM d')}</DateText>
        </Header>
        <StatusCard elevated>
          <h2>Loading today&apos;s habits</h2>
          <p>Your private habit record is opening.</p>
          <span className="sr-only">Loading habits</span>
        </StatusCard>
      </DashboardContainer>
    )
  }

  if (error) {
    return (
      <DashboardContainer>
        <Header>
          <Title>Dashboard</Title>
          <DateText>{format(referenceDate, 'EEEE, MMMM d')}</DateText>
        </Header>
        <StatusCard elevated role="alert">
          <h2>Could not load your habits</h2>
          <p>Your saved data has not changed. Reconnect to the local service and try again.</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </StatusCard>
      </DashboardContainer>
    )
  }

  if (totalHabits === 0) {
    return (
      <DashboardContainer>
        <Header>
          <Title>Dashboard</Title>
          <DateText>{format(referenceDate, 'EEEE, MMMM d')}</DateText>
        </Header>
        
        <EmptyState
          type="habits"
          title="Welcome to Habit Tracker"
          description="Start building better habits by creating your first one. Small steps lead to big changes!"
          actionText="Create Your First Habit"
          onAction={() => navigate('/add-habit')}
        />
      </DashboardContainer>
    )
  }

  return (
    <DashboardContainer>
      <Confetti run={showConfetti} onComplete={() => setShowConfetti(false)} />
      <Header>
        <Title>Dashboard</Title>
        <DateText>{format(referenceDate, 'EEEE, MMMM d')}</DateText>
      </Header>

      <StatsGrid>
        <StatCard elevated>
          <StatValue>{totalHabits}</StatValue>
          <StatLabel>Total Habits</StatLabel>
        </StatCard>
        <StatCard elevated>
          <StatValue>{completionRate}%</StatValue>
          <StatLabel>Today's Rate</StatLabel>
        </StatCard>
      </StatsGrid>

      <ProgressCard elevated>
        <ProgressTitle>Today's Progress</ProgressTitle>
        <CircularProgress
          progress={completionRate}
          size={150}
          strokeWidth={12}
          label={`${todayCompletedCount}/${totalHabits} habits`}
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
              data-habit-id={habit.id}
              clickable
              onClick={() => navigate(`/habit/${habit.id}`)}
              elevated
            >
              <HabitInfo>
                <HabitIcon $color={habit.color}>
                  <AppIcon name={habit.icon} fallbackName={DEFAULT_HABIT_ICON} size={22} />
                </HabitIcon>
                <HabitDetails>
                  <HabitName>{habit.name}</HabitName>
                  <HabitMeta>
                    <HabitStreak>
                      <AppIcon name="flame" size={14} /> {habit.currentStreak} days
                    </HabitStreak>
                  </HabitMeta>
                </HabitDetails>
              </HabitInfo>
              {habit.type === 'count' ? (
                <CountStepper habit={habit} />
              ) : (
                <CheckButton
                  $checked={habit.isCompleted}
                  aria-label={`${habit.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}: ${habit.name}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleHabit(habit.id)
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {habit.isCompleted && (
                    <AppIcon name="check" size={18} stroke={3} />
                  )}
                </CheckButton>
              )}
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

      <HabitsSection>
        <SectionHeader>
          <SectionTitle>Journal</SectionTitle>
          <Button variant="ghost" onClick={() => navigate('/journal')}>
            View All
          </Button>
        </SectionHeader>
        
        <Card elevated>
          <div style={{
            padding: '16px',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <AppIcon name="notebook" size={48} />
            </div>
            <p>Reflect on your habits and track your mood</p>
            <Button
              style={{ marginTop: '16px' }}
              onClick={() => navigate('/journal')}
            >
              View Journal
            </Button>
          </div>
        </Card>
      </HabitsSection>
    </DashboardContainer>
  )
}

export default Dashboard
