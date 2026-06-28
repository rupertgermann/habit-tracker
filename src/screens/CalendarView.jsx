import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval, isSameMonth, isToday, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfYear, endOfYear, addYears, subYears } from 'date-fns'
import Card from '../components/Card'
import Button from '../components/Button'
import Tooltip from '../components/Tooltip'
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

const WeekViewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.lg};
`

const WeekDayCard = styled(Card)`
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: ${props => props.theme.spacing.sm};
  position: relative;
  transition: all 0.2s ease;
  
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

const WeekDayName = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.xs};
`

const WeekDayNumber = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodyLarge};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text.primary};
`

const WeekDayCompletion = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
  margin-top: ${props => props.theme.spacing.xs};
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

const HabitSelectRow = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`

const HabitSelect = styled.select`
  width: 100%;
  height: 48px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  padding: 0 ${props => props.theme.spacing.md};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  color: ${props => props.theme.colors.text.primary};
  background-color: ${props => props.theme.colors.white};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`

const DayCount = styled.span`
  font-size: 11px;
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text.primary};
`

const YearGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`

const MiniMonth = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`

const MiniMonthTitle = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
`

const MiniGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`

const MiniDay = styled.div`
  aspect-ratio: 1;
  border-radius: 2px;
  border: ${props => props.isToday ? `1px solid ${props.theme.colors.primary}` : 'none'};

  ${({ level }) => {
    switch (level) {
      case 0: return 'background-color: #F3F4F6;'
      case 1: return 'background-color: #E0F2E3;'
      case 2: return 'background-color: #A8E0B1;'
      case 3: return 'background-color: #6CC47C;'
      case 4: return 'background-color: #4A9F5A;'
      default: return 'background-color: transparent;'
    }
  }}
`

const getLevel = (count) => {
  if (!count) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

const CalendarView = () => {
  const navigate = useNavigate()
  const { habits, getCountForDate, getHabitRangeStats } = useHabits()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState('month')
  const [selectedHabitId, setSelectedHabitId] = useState(null)

  useEffect(() => {
    if (habits.length === 0) return
    if (!selectedHabitId || !habits.some(h => h.id === selectedHabitId)) {
      setSelectedHabitId(habits[0].id)
    }
  }, [habits, selectedHabitId])

  const selectedHabit = habits.find(h => h.id === selectedHabitId) || habits[0] || null

  const getCount = (date) =>
    selectedHabit ? getCountForDate(selectedHabit, format(date, 'yyyy-MM-dd')) : 0

  const rangeStats = selectedHabit
    ? getHabitRangeStats(selectedHabit.id, viewType, currentDate)
    : { percentDaysSaid: 0, totalCount: 0, daysWithEntry: 0, bestCount: 0, bestDate: null }

  const targetLabel = selectedHabit && selectedHabit.dailyTarget
    ? ` / ${selectedHabit.dailyTarget}`
    : ''

  const getDayTooltipContent = (date) => {
    const count = getCount(date)
    const label = format(date, 'MMMM d, yyyy')

    if (count === 0) {
      return { title: `${label} — none`, content: [] }
    }

    return {
      title: `${label} — ${count}${targetLabel}`,
      content: [{
        name: selectedHabit ? selectedHabit.name : '',
        icon: selectedHabit && selectedHabit.icon ? selectedHabit.icon : '✓',
        completed: true
      }]
    }
  }

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const firstDayOfMonth = monthStart.getDay()
    const emptyCells = Array(firstDayOfMonth).fill(null)
    const lastDayOfMonth = monthEnd.getDay()
    const endEmptyCells = Array(6 - lastDayOfMonth).fill(null)

    const allCells = [...emptyCells, ...days, ...endEmptyCells]

    return allCells.map((date, index) => {
      if (!date) {
        return <div key={`empty-${index}`} />
      }

      const isCurrentMonthDay = isSameMonth(date, currentDate)
      const isTodayDate = isToday(date)
      const count = getCount(date)
      const completionLevel = getLevel(count)
      const tooltipData = getDayTooltipContent(date)

      return (
        <Tooltip
          key={date.toString()}
          title={tooltipData.title}
          content={tooltipData.content}
          position="top"
          trigger="click"
          enabled={count > 0}
        >
          <DayCell
            isCurrentMonth={isCurrentMonthDay}
            isToday={isTodayDate}
            completionLevel={completionLevel}
          >
            <DayNumber>{format(date, 'd')}</DayNumber>
            {count > 0 && <DayCount>{count}</DayCount>}
          </DayCell>
        </Tooltip>
      )
    })
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

    return daysOfWeek.map((day) => {
      const isTodayDate = isToday(day)
      const count = getCount(day)
      const completionLevel = getLevel(count)
      const tooltipData = getDayTooltipContent(day)

      return (
        <Tooltip
          key={day.toString()}
          title={tooltipData.title}
          content={tooltipData.content}
          position="top"
          trigger="click"
          enabled={count > 0}
        >
          <WeekDayCard
            isToday={isTodayDate}
            completionLevel={completionLevel}
          >
            <WeekDayName>{format(day, 'EEE')}</WeekDayName>
            <WeekDayNumber>{format(day, 'd')}</WeekDayNumber>
            <WeekDayCompletion>
              {count}{targetLabel}
            </WeekDayCompletion>
          </WeekDayCard>
        </Tooltip>
      )
    })
  }

  const renderYearView = () => {
    const months = eachMonthOfInterval({
      start: startOfYear(currentDate),
      end: endOfYear(currentDate)
    })

    return months.map((monthDate) => {
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
      const emptyCells = Array(monthStart.getDay()).fill(null)
      const cells = [...emptyCells, ...days]

      return (
        <MiniMonth key={monthDate.toString()}>
          <MiniMonthTitle>{format(monthDate, 'MMM')}</MiniMonthTitle>
          <MiniGrid>
            {cells.map((date, index) => {
              if (!date) return <div key={`empty-${index}`} />
              const count = getCount(date)
              return (
                <MiniDay
                  key={date.toString()}
                  level={getLevel(count)}
                  isToday={isToday(date)}
                  title={`${format(date, 'MMM d')} — ${count}`}
                />
              )
            })}
          </MiniGrid>
        </MiniMonth>
      )
    })
  }

  const goToPrevious = () => {
    if (viewType === 'month') setCurrentDate(subMonths(currentDate, 1))
    else if (viewType === 'week') setCurrentDate(subWeeks(currentDate, 1))
    else setCurrentDate(subYears(currentDate, 1))
  }

  const goToNext = () => {
    if (viewType === 'month') setCurrentDate(addMonths(currentDate, 1))
    else if (viewType === 'week') setCurrentDate(addWeeks(currentDate, 1))
    else setCurrentDate(addYears(currentDate, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const headerLabel = viewType === 'month'
    ? format(currentDate, 'MMMM yyyy')
    : viewType === 'week'
      ? `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'MMM d')} - ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), 'MMM d, yyyy')}`
      : format(currentDate, 'yyyy')

  const periodLabel = viewType === 'year' ? 'This Year' : viewType === 'week' ? 'This Week' : 'This Month'

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
            active={viewType === 'week'}
            onClick={() => setViewType('week')}
          >
            Week
          </ToggleButton>
          <ToggleButton
            active={viewType === 'month'}
            onClick={() => setViewType('month')}
          >
            Month
          </ToggleButton>
          <ToggleButton
            active={viewType === 'year'}
            onClick={() => setViewType('year')}
          >
            Year
          </ToggleButton>
        </ViewToggle>
      </Header>

      <HabitSelectRow>
        <HabitSelect
          value={selectedHabitId || ''}
          onChange={(e) => setSelectedHabitId(e.target.value)}
          aria-label="Select habit to view"
        >
          {habits.map(habit => (
            <option key={habit.id} value={habit.id}>
              {(habit.icon ? `${habit.icon} ` : '') + habit.name}
            </option>
          ))}
        </HabitSelect>
      </HabitSelectRow>

      <CalendarHeader>
        <NavButton onClick={goToPrevious} aria-label="Previous period">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </NavButton>

        <MonthYear>{headerLabel}</MonthYear>

        <NavButton onClick={goToNext} aria-label="Next period">
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

      {viewType === 'month' && (
        <CalendarGrid>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <DayHeader key={day}>{day}</DayHeader>
          ))}
          {renderCalendar()}
        </CalendarGrid>
      )}

      {viewType === 'week' && (
        <WeekViewGrid>
          {renderWeekView()}
        </WeekViewGrid>
      )}

      {viewType === 'year' && (
        <YearGrid>
          {renderYearView()}
        </YearGrid>
      )}

      <Legend>
        <LegendItem>
          <LegendColor color={0} />
          <LegendText>0</LegendText>
        </LegendItem>
        <LegendItem>
          <LegendColor color={1} />
          <LegendText>1</LegendText>
        </LegendItem>
        <LegendItem>
          <LegendColor color={2} />
          <LegendText>2-3</LegendText>
        </LegendItem>
        <LegendItem>
          <LegendColor color={3} />
          <LegendText>4-6</LegendText>
        </LegendItem>
        <LegendItem>
          <LegendColor color={4} />
          <LegendText>7+</LegendText>
        </LegendItem>
      </Legend>

      <StatsCard elevated>
        <StatItem>
          <StatValue>{rangeStats.percentDaysSaid}%</StatValue>
          <StatLabel>{periodLabel}: Days Done</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{rangeStats.totalCount}</StatValue>
          <StatLabel>Total Count</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{rangeStats.bestCount}</StatValue>
          <StatLabel>Best Day</StatLabel>
        </StatItem>
      </StatsCard>
    </CalendarContainer>
  )
}

export default CalendarView