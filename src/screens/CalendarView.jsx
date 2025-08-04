import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns'
import Card from '../components/Card'
import Button from '../components/Button'
import { useHabits } from '../context/HabitsContext'

const CalendarContainer = styled.div`
  padding: ${props => props.theme.spacing.lg};
  padding-bottom: ${props => props.theme.spacing.xxxl};
  max-width: 600px;
  margin: 0 auto;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`

const Title = styled.h1`
  font-size: ${props => props.theme.typography.fontSize.headingLarge};
`

const ViewToggle = styled.div`
  display: flex;
  background-color: ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  padding: 4px;
`

const ToggleButton = styled.button`
  background: none;
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.active ? props.theme.colors.text.primary : props.theme.colors.text.secondary};
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ active, theme }) =>
    active &&
    `
      background-color: ${theme.colors.white};
      box-shadow: ${theme.shadows.subtle};
    `}
`

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`

const MonthYear = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.headingMedium};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
`

const NavButton = styled.button`
  background: none;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.round};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${props => props.theme.colors.text.primary};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.border};
  }
`

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${props => props.theme.spacing.xs};
  margin-bottom: ${props => props.theme.spacing.lg};
`

const DayHeader = styled.div`
  text-align: center;
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.text.secondary};
  padding: ${props => props.theme.spacing.sm} 0;
`

const DayCell = styled(Card)`
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  position: relative;
  transition: all 0.2s ease;
  
  ${({ isCurrentMonth, theme }) =>
    !isCurrentMonth &&
    `
      opacity: 0.3;
    `}
  
  ${({ isToday, theme }) =>
    isToday &&
    `
      border: 2px solid ${theme.colors.primary};
    `}
  
  ${({ completionLevel, theme }) => {
    switch (completionLevel) {
      case 0:
        return 'background-color: #F3F4F6;'
      case 1:
        return 'background-color: #E0F2E3;'
      case 2:
        return 'background-color: #A8E0B1;'
      case 3:
        return 'background-color: #6CC47C;'
      case 4:
        return 'background-color: #4A9F5A;'
      default:
        return 'background-color: #F3F4F6;'
    }
  }}
  
  &:hover {
    transform: scale(1.05);
    box-shadow: ${props => props.theme.shadows.medium};
  }
`

const DayNumber = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.text.primary};
`

const CompletionIndicator = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  border-radius: ${props => props.theme.borderRadius.round};
  background-color: ${props => props.theme.colors.primary};
`

const Legend = styled(Card)`
  display: flex;
  justify-content: space-around;
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`

const LegendColor = styled.div`
  width: 16px;
  height: 16px;
  border-radius: ${props => props.theme.borderRadius.small};
  
  ${({ color }) => {
    switch (color) {
      case 0:
        return 'background-color: #F3F4F6;'
      case 1:
        return 'background-color: #E0F2E3;'
      case 2:
        return 'background-color: #A8E0B1;'
      case 3:
        return 'background-color: #6CC47C;'
      case 4:
        return 'background-color: #4A9F5A;'
      default:
        return 'background-color: #F3F4F6;'
    }
  }}
`

const LegendText = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
`

const StatsCard = styled(Card)`
  display: flex;
  justify-content: space-around;
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
`

const StatItem = styled.div`
  text-align: center;
`

const StatValue = styled.div`
  font-size: ${props => props.theme.typography.fontSize.headingLarge};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.xs};
`

const StatLabel = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
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

const CalendarView = () => {
  const navigate = useNavigate()
  const { habits, getMonthlyCompletionData } = useHabits()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState('month')
  const [monthlyData, setMonthlyData] = useState([])

  useEffect(() => {
    setMonthlyData(getMonthlyCompletionData())
  }, [getMonthlyCompletionData])

  const getCompletionLevel = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayData = monthlyData.find(d => d.date === dateStr)
    
    if (!dayData || dayData.completions === 0) return 0
    if (dayData.percentage <= 25) return 1
    if (dayData.percentage <= 50) return 2
    if (dayData.percentage <= 75) return 3
    return 4
  }

  const getMonthStats = () => {
    const totalDays = monthlyData.length
    const completedDays = monthlyData.filter(d => d.completions > 0).length
    const perfectDays = monthlyData.filter(d => d.percentage === 100).length
    const totalCompletions = monthlyData.reduce((sum, d) => sum + d.completions, 0)
    
    return {
      totalDays,
      completedDays,
      perfectDays,
      totalCompletions,
      completionRate: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0
    }
  }

  const monthStats = getMonthStats()

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    
    // Add empty cells for days before the first day of the month
    const firstDayOfMonth = monthStart.getDay()
    const emptyCells = Array(firstDayOfMonth).fill(null)
    
    // Add empty cells for days after the last day of the month
    const lastDayOfMonth = monthEnd.getDay()
    const endEmptyCells = Array(6 - lastDayOfMonth).fill(null)
    
    const allCells = [...emptyCells, ...days, ...endEmptyCells]
    
    return allCells.map((date, index) => {
      if (!date) {
        return <div key={`empty-${index}`} />
      }
      
      const isCurrentMonthDay = isSameMonth(date, currentDate)
      const isTodayDate = isToday(date)
      const completionLevel = getCompletionLevel(date)
      
      return (
        <DayCell
          key={date.toString()}
          isCurrentMonth={isCurrentMonthDay}
          isToday={isTodayDate}
          completionLevel={completionLevel}
          onClick={() => {
            // Could navigate to a day detail view
          }}
        >
          <DayNumber>{format(date, 'd')}</DayNumber>
          {completionLevel > 0 && <CompletionIndicator />}
        </DayCell>
      )
    })
  }

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  if (habits.length === 0) {
    return (
      <CalendarContainer>
        <Header>
          <Title>Calendar</Title>
        </Header>
        
        <EmptyState>
          <EmptyStateIcon>📅</EmptyStateIcon>
          <EmptyStateTitle>No habits to track</EmptyStateTitle>
          <EmptyStateText>Create your first habit to see your progress on the calendar.</EmptyStateText>
          <Button onClick={() => navigate('/add-habit')}>
            Create Habit
          </Button>
        </EmptyState>
      </CalendarContainer>
    )
  }

  return (
    <CalendarContainer>
      <Header>
        <Title>Calendar</Title>
        <ViewToggle>
          <ToggleButton
            active={viewType === 'month'}
            onClick={() => setViewType('month')}
          >
            Month
          </ToggleButton>
          <ToggleButton
            active={viewType === 'week'}
            onClick={() => setViewType('week')}
          >
            Week
          </ToggleButton>
        </ViewToggle>
      </Header>

      <CalendarHeader>
        <NavButton onClick={goToPreviousMonth}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </NavButton>
        
        <MonthYear>{format(currentDate, 'MMMM yyyy')}</MonthYear>
        
        <NavButton onClick={goToNextMonth}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </NavButton>
      </CalendarHeader>

      <Button
        variant="ghost"
        fullWidth
        onClick={goToToday}
        style={{ marginBottom: '16px' }}
      >
        Go to Today
      </Button>

      <CalendarGrid>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <DayHeader key={day}>{day}</DayHeader>
        ))}
        {renderCalendar()}
      </CalendarGrid>

      <Legend>
        <LegendItem>
          <LegendColor color={0} />
          <LegendText>No habits</LegendText>
        </LegendItem>
        <LegendItem>
          <LegendColor color={1} />
          <LegendText>0-25%</LegendText>
        </LegendItem>
        <LegendItem>
          <LegendColor color={2} />
          <LegendText>26-50%</LegendText>
        </LegendItem>
        <LegendItem>
          <LegendColor color={3} />
          <LegendText>51-75%</LegendText>
        </LegendItem>
        <LegendItem>
          <LegendColor color={4} />
          <LegendText>76-100%</LegendText>
        </LegendItem>
      </Legend>

      <StatsCard elevated>
        <StatItem>
          <StatValue>{monthStats.completionRate}%</StatValue>
          <StatLabel>Completion Rate</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{monthStats.perfectDays}</StatValue>
          <StatLabel>Perfect Days</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{monthStats.totalCompletions}</StatValue>
          <StatLabel>Total Completions</StatLabel>
        </StatItem>
      </StatsCard>
    </CalendarContainer>
  )
}

export default CalendarView