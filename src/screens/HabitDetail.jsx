import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { format, parseISO } from 'date-fns'
import Card from '../components/Card'
import Button from '../components/Button'
import CircularProgress from '../components/CircularProgress'
import Confetti from '../components/Confetti'
import JournalEntry from '../components/JournalEntry'
import CountStepper from '../components/CountStepper'
import AppIcon from '../components/AppIcon'
import { useHabits } from '../context/HabitsContext'
import { useToast } from '../context/ToastContext'
import {
  getCountForDate,
  getHabitById,
  getHabitStreak,
  getRecentActivityDays,
  toDateKey
} from '../domain/habitTracking'
import { DEFAULT_HABIT_ICON } from '../domain/iconCatalog'

const HabitDetailContainer = styled.div`
  width: 100%;
  padding: ${props => props.theme.spacing.lg};
  padding-bottom: ${props => props.theme.spacing.xxxl};
  max-width: 600px;
  margin: 0 auto;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  flex-wrap: wrap;
  margin-bottom: ${props => props.theme.spacing.lg};
`

const Title = styled.h1`
  font-size: ${props => props.theme.typography.fontSize.headingLarge};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  min-width: 0;
  overflow-wrap: anywhere;
`

const HabitIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.small};
  background-color: ${props => props.$color || props.theme.colors.primary}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$color || props.theme.colors.primary};
  flex: 0 0 auto;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.lg};
`

const StatCard = styled(Card)`
  text-align: center;
  padding: ${props => props.theme.spacing.lg};
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

const Section = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
`

const SectionTitle = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.headingMedium};
  margin-bottom: ${props => props.theme.spacing.md};
`

const TimelineContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(44px, 1fr));
  overflow-x: visible;
  padding: ${props => props.theme.spacing.md} 0;
  gap: ${props => props.theme.spacing.sm};
`

const TimelineItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  min-width: 0;
`

const DayCircle = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${props => props.theme.borderRadius.round};
  background-color: ${props => props.$completed ? props.theme.colors.primary : props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$completed ? props.theme.colors.onPrimary : props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  position: relative;
  
  ${({ $isToday, theme }) =>
    $isToday &&
    `
      border: 2px solid ${theme.colors.primary};
    `}
`

const DayLabel = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
  white-space: nowrap;
`

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`

const ActionError = styled.div`
  margin-bottom: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.destructive};
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
`

const HabitInfo = styled(Card)`
  margin-bottom: ${props => props.theme.spacing.lg};
`

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.sm} 0;
  
  &:not(:last-child) {
    border-bottom: 1px solid ${props => props.theme.colors.border};
  }
`

const InfoLabel = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  color: ${props => props.theme.colors.text.secondary};
`

const InfoValue = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.text.primary};
`

const CompletionChart = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: ${props => props.theme.spacing.lg} 0;
`

const StreakIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.primary};
`

const FireIcon = styled.span`
  display: inline-flex;
  align-items: center;
`

const CountActionPanel = styled(Card)`
  padding: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing.md};
`

const CountActionText = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`

const CountActionTitle = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodyLarge};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.text.primary};
`

const CountActionHint = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
`

const HabitDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { habits, hasLoaded, mutationError, deleteHabit, toggleYesNoCompletion } = useHabits()
  const { showSuccessToast } = useToast()
  const [showConfetti, setShowConfetti] = useState(false)
  const [actionError, setActionError] = useState('')

  const habit = id ? getHabitById(habits, id) : null
  const streak = habit ? getHabitStreak(habit) : 0
  const recentDays = habit ? getRecentActivityDays(habit) : []
  const visibleActionError = actionError || (
    mutationError && mutationError.habitId === habit?.id ? mutationError.message : ''
  )

  useEffect(() => {
    if (id && hasLoaded && !habit) {
      navigate('/habits')
    }
  }, [id, habit, hasLoaded, navigate])

  const handleToggleCompletion = async () => {
    if (!habit) return { ok: false }

    const isCompleting = !recentDays.find(day => day.isToday)?.isCompleted
    setActionError('')
    const result = await toggleYesNoCompletion(habit.id)
    if (!result.ok) {
      setActionError(`Could not update "${habit.name}". Please try again.`)
      return result
    }

    if (isCompleting) {
      showSuccessToast(`Great job! "${habit.name}" completed!`)

      const updatedStreak = getHabitStreak(result.habit)
      if (updatedStreak > 0 && updatedStreak % 7 === 0) {
        setShowConfetti(true)
        showSuccessToast(`${updatedStreak} day streak! Keep it up!`)
      }
    }

    return result
  }

  const handleEdit = () => {
    navigate(`/edit-habit/${id}`)
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
      setActionError('')
      const result = await deleteHabit(id)
      if (!result.ok) {
        setActionError(`Could not delete "${habit.name}". Please try again.`)
        return result
      }

      showSuccessToast(`"${habit.name}" deleted.`)
      navigate('/habits')
      return result
    }

    return { ok: false, cancelled: true }
  }

  const getCompletionRate = () => {
    if (!habit || habit.completions.length === 0) return 0
    
    const totalDays = 30 // Last 30 days
    const completedDays = recentDays.filter(day => day.isCompleted).length
    return Math.round((completedDays / totalDays) * 100)
  }

  const getFrequencyText = () => {
    if (!habit) return ''
    
    switch (habit.frequency) {
      case 'daily':
        return 'Every day'
      case 'weekly':
        return 'Every week'
      case 'custom':
        return `${habit.daysPerWeek} days per week`
      default:
        return 'Every day'
    }
  }

  const getCreatedDate = () => {
    if (!habit?.createdAt) return 'Not recorded'

    const createdDate = parseISO(habit.createdAt)
    if (Number.isNaN(createdDate.getTime())) return 'Not recorded'

    return format(createdDate, 'MMMM d, yyyy')
  }

  if (!habit) {
    return <div>Loading...</div>
  }

  const completionRate = getCompletionRate()
  const isCountHabit = habit.type === 'count'
  const todayDate = toDateKey()
  const todayCount = getCountForDate(habit, todayDate)
  const isCompletedToday = isCountHabit
    ? todayCount > 0
    : recentDays.find(day => day.isToday)?.isCompleted || false

  return (
    <HabitDetailContainer>
      <Confetti run={showConfetti} onComplete={() => setShowConfetti(false)} />
      <Header>
        <Title>
          <HabitIcon $color={habit.color}>
            <AppIcon name={habit.icon} fallbackName={DEFAULT_HABIT_ICON} size={24} />
          </HabitIcon>
          {habit.name}
        </Title>
        <Button
          variant="ghost"
          onClick={handleEdit}
        >
          Edit
        </Button>
      </Header>

      <StatsGrid>
        <StatCard elevated>
          <StatValue>{streak}</StatValue>
          <StatLabel>Current Streak</StatLabel>
        </StatCard>
        <StatCard elevated>
          <StatValue>{habit.completions.length}</StatValue>
          <StatLabel>{isCountHabit ? 'Total Logs' : 'Total Completions'}</StatLabel>
        </StatCard>
        <StatCard elevated>
          <StatValue>{completionRate}%</StatValue>
          <StatLabel>Success Rate</StatLabel>
        </StatCard>
      </StatsGrid>

      <HabitInfo elevated>
        <InfoRow>
          <InfoLabel>Frequency</InfoLabel>
          <InfoValue>{getFrequencyText()}</InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>Created</InfoLabel>
          <InfoValue>{getCreatedDate()}</InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>Today</InfoLabel>
          <InfoValue>
            <StreakIndicator>
              {isCompletedToday ? 'Completed' : 'Not completed'}
              {isCountHabit && ` (${todayCount} today)`}
              {isCompletedToday && (
                <FireIcon>
                  <AppIcon name="flame" size={18} />
                </FireIcon>
              )}
            </StreakIndicator>
          </InfoValue>
        </InfoRow>
      </HabitInfo>

      <Section>
        <SectionTitle>Progress Overview</SectionTitle>
        <CompletionChart>
          <CircularProgress
            progress={completionRate}
            size={150}
            strokeWidth={10}
            label="30-day rate"
          />
        </CompletionChart>
      </Section>

      <Section>
        <SectionTitle>Recent Activity</SectionTitle>
        <TimelineContainer>
          {recentDays.map((day, index) => (
            <TimelineItem key={index}>
              <DayCircle
                $completed={day.isCompleted}
                $isToday={day.isToday}
              >
                {day.dayNumber}
              </DayCircle>
              <DayLabel>{day.day}</DayLabel>
            </TimelineItem>
          ))}
        </TimelineContainer>
      </Section>

      <Section>
        <SectionTitle>Journal</SectionTitle>
        <JournalEntry
          habitId={habit.id}
          date={todayDate}
          habitName={habit.name}
        />
      </Section>

      <Section>
        <SectionTitle>Actions</SectionTitle>
        {visibleActionError && <ActionError role="alert">{visibleActionError}</ActionError>}
        <ActionButtons>
          {isCountHabit ? (
            <CountActionPanel elevated>
              <CountActionText>
                <CountActionTitle>Today's count</CountActionTitle>
                <CountActionHint>Add or remove one log for today.</CountActionHint>
              </CountActionText>
              <CountStepper habit={habit} />
            </CountActionPanel>
          ) : (
            <Button
              variant={isCompletedToday ? "secondary" : "primary"}
              fullWidth
              onClick={handleToggleCompletion}
              bounceOnClick={true}
            >
              {isCompletedToday ? 'Mark as Incomplete' : 'Mark as Complete'}
            </Button>
          )}
          <Button
            variant="ghost"
            fullWidth
            onClick={handleEdit}
          >
            Edit Habit
          </Button>
          <Button
            variant="destructive"
            fullWidth
            onClick={handleDelete}
          >
            Delete Habit
          </Button>
        </ActionButtons>
      </Section>
    </HabitDetailContainer>
  )
}

export default HabitDetail
