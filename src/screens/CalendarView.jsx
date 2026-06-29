import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval, isSameMonth, isToday, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfYear, endOfYear, addYears, subYears } from 'date-fns'
import Card from '../components/Card'
import Button from '../components/Button'
import Tooltip from '../components/Tooltip'
import AppIcon from '../components/AppIcon'
import { useHabits } from '../context/HabitsContext'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { DEFAULT_HABIT_ICON, getLegacyIconText } from '../domain/iconCatalog'

const getDayHeaders = (weekStartsOn) =>
  weekStartsOn === 1
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const getLeadingEmptyCellCount = (date, weekStartsOn) =>
  (date.getDay() - weekStartsOn + 7) % 7

const filledTileTextColor = '#102016'

const getCompletionLevelStyles = (level, theme) => {
  switch (level) {
    case 0:
      return `
        background-color: ${theme.colors.white};
        border-color: ${theme.colors.border};
      `
    case 1:
      return `
        background-color: ${theme.colors.primary}20;
        border-color: ${theme.colors.primary}40;
      `
    case 2:
      return `
        background-color: ${theme.colors.primary}50;
        border-color: ${theme.colors.primary}70;
      `
    case 3:
      return `
        background-color: ${theme.colors.primary}90;
        border-color: ${theme.colors.primary};
      `
    case 4:
      return `
        background-color: ${theme.colors.primary};
        border-color: ${theme.colors.primary};
      `
    default:
      return `
        background-color: ${theme.colors.white};
        border-color: ${theme.colors.border};
      `
  }
}

const getHeatmapTextColor = (level, theme) =>
  level >= 4 ? filledTileTextColor : theme.colors.text.primary

const getHeatmapMutedTextColor = (level, theme) =>
  level >= 4 ? filledTileTextColor : theme.colors.text.secondary

const CalendarContainer = styled.div`
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
`

const ViewToggle = styled.div`
  display: flex;
  flex-wrap: wrap;
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
  color: ${props => props.$active ? props.theme.colors.text.primary : props.theme.colors.text.secondary};
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ $active, theme }) =>
    $active &&
    `
      background-color: ${theme.colors.white};
      box-shadow: ${theme.shadows.subtle};
    `}
`

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.lg};
`

const MonthYear = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.headingMedium};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  min-width: 0;
  text-align: center;
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
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: ${props => props.theme.spacing.xs};
  margin-bottom: ${props => props.theme.spacing.lg};
`

const WeekViewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: ${props => props.theme.spacing.xs};
  margin-bottom: ${props => props.theme.spacing.lg};
`

const WeekDayCard = styled(Card)`
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  position: relative;
  border: 1px solid transparent;
  transition: all 0.2s ease;

  ${({ $completionLevel, theme }) => getCompletionLevelStyles($completionLevel, theme)}

  ${({ $isToday, theme }) =>
    $isToday &&
    `
      border: 2px solid ${theme.colors.primary};
    `}

  ${({ $isSelected, theme }) =>
    $isSelected &&
    `
      outline: 3px solid ${theme.colors.secondary};
      outline-offset: 2px;
    `}

  &:hover {
    transform: scale(1.05);
    box-shadow: ${props => props.theme.shadows.medium};
  }
`

const WeekDayName = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => getHeatmapMutedTextColor(props.$completionLevel, props.theme)};
  margin-bottom: ${props => props.theme.spacing.xs};
`

const WeekDayNumber = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodyLarge};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => getHeatmapTextColor(props.$completionLevel, props.theme)};
`

const WeekDayCompletion = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => getHeatmapMutedTextColor(props.$completionLevel, props.theme)};
  margin-top: ${props => props.theme.spacing.xs};
  line-height: ${props => props.theme.typography.lineHeight.tight};
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
  border: 1px solid transparent;
  transition: all 0.2s ease;

  ${({ $completionLevel, theme }) => getCompletionLevelStyles($completionLevel, theme)}

  ${({ $isCurrentMonth, theme }) =>
    !$isCurrentMonth &&
    `
      opacity: 0.3;
    `}
  
  ${({ $isToday, theme }) =>
    $isToday &&
    `
      border: 2px solid ${theme.colors.primary};
    `}

  ${({ $isSelected, theme }) =>
    $isSelected &&
    `
      outline: 3px solid ${theme.colors.secondary};
      outline-offset: 2px;
    `}

  &:hover {
    transform: scale(1.05);
    box-shadow: ${props => props.theme.shadows.medium};
  }
`

const DayNumber = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => getHeatmapTextColor(props.$completionLevel, props.theme)};
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
  border: 1px solid transparent;

  ${({ $level, theme }) => getCompletionLevelStyles($level, theme)}
`

const LegendText = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
`

const StatsCard = styled(Card)`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${props => props.theme.spacing.md};
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

const SelectedDateCard = styled(Card)`
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
`

const SelectedDateHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
`

const SelectedDateInfo = styled.div`
  min-width: 0;
`

const SelectedDateTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.bodyLarge};
  margin-bottom: ${props => props.theme.spacing.xs};
  overflow-wrap: anywhere;
`

const SelectedDateMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
  overflow-wrap: anywhere;
`

const SelectedHabitIcon = styled.span`
  display: inline-flex;
  color: ${props => props.$color || props.theme.colors.primary};
`

const SelectedDateCount = styled.div`
  flex-shrink: 0;
  min-width: 64px;
  text-align: right;
  font-size: ${props => props.theme.typography.fontSize.headingMedium};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.primary};
`

const SelectedDateActions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${props => props.theme.spacing.sm};
`

const DayCount = styled.span`
  font-size: 11px;
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => getHeatmapTextColor(props.$completionLevel, props.theme)};
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
  border: 1px solid transparent;

  ${({ $level, theme }) => getCompletionLevelStyles($level, theme)}

  ${({ $isToday, theme }) =>
    $isToday &&
    `
      border-color: ${theme.colors.primary};
    `}
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
  const { weekStartsOn } = usePreferences()
  const {
    habits,
    getCountForDate,
    getHabitRangeStats,
    toggleHabitCompletion,
    incrementCompletion,
    decrementCompletion
  } = useHabits()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState('month')
  const [selectedHabitId, setSelectedHabitId] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const weekOptions = { weekStartsOn }
  const dayHeaders = getDayHeaders(weekStartsOn)

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
    : { percentDaysSaid: 0, percentDaysMissed: 0, totalCount: 0, daysWithEntry: 0, daysWithoutEntry: 0, bestCount: 0, bestDate: null }

  const targetLabel = selectedHabit && selectedHabit.dailyTarget
    ? ` / ${selectedHabit.dailyTarget}`
    : ''

  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd')
  const selectedDateCount = selectedHabit ? getCountForDate(selectedHabit, selectedDateKey) : 0
  const isCountHabit = selectedHabit?.type === 'count'
  const selectedDateLabel = format(selectedDate, 'MMMM d, yyyy')

  const isSelectedDate = (date) => format(date, 'yyyy-MM-dd') === selectedDateKey

  const handleSelectDate = (date) => {
    setSelectedDate(date)
  }

  const handleDateKeyDown = (event, date) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    handleSelectDate(date)
  }

  const handleToggleSelectedDate = () => {
    if (!selectedHabit) return
    toggleHabitCompletion(selectedHabit.id, selectedDate)
  }

  const handleIncrementSelectedDate = () => {
    if (!selectedHabit) return
    incrementCompletion(selectedHabit.id, selectedDate)
  }

  const handleDecrementSelectedDate = () => {
    if (!selectedHabit || selectedDateCount === 0) return
    decrementCompletion(selectedHabit.id, selectedDate)
  }

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
        icon: selectedHabit && selectedHabit.icon ? selectedHabit.icon : DEFAULT_HABIT_ICON,
        completed: true
      }]
    }
  }

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const firstDayOfMonth = getLeadingEmptyCellCount(monthStart, weekStartsOn)
    const emptyCells = Array(firstDayOfMonth).fill(null)
    const lastDayOfMonth = getLeadingEmptyCellCount(monthEnd, weekStartsOn)
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
      const isSelected = isSelectedDate(date)

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
            $isCurrentMonth={isCurrentMonthDay}
            $isToday={isTodayDate}
            $completionLevel={completionLevel}
            $isSelected={isSelected}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`Select ${format(date, 'MMMM d, yyyy')}`}
            onClick={() => handleSelectDate(date)}
            onKeyDown={(event) => handleDateKeyDown(event, date)}
          >
            <DayNumber $completionLevel={completionLevel}>{format(date, 'd')}</DayNumber>
            {count > 0 && <DayCount $completionLevel={completionLevel}>{count}</DayCount>}
          </DayCell>
        </Tooltip>
      )
    })
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, weekOptions)
    const weekEnd = endOfWeek(currentDate, weekOptions)
    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

    return daysOfWeek.map((day) => {
      const isTodayDate = isToday(day)
      const count = getCount(day)
      const completionLevel = getLevel(count)
      const tooltipData = getDayTooltipContent(day)
      const isSelected = isSelectedDate(day)

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
            $isToday={isTodayDate}
            $completionLevel={completionLevel}
            $isSelected={isSelected}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`Select ${format(day, 'MMMM d, yyyy')}`}
            onClick={() => handleSelectDate(day)}
            onKeyDown={(event) => handleDateKeyDown(event, day)}
          >
            <WeekDayName $completionLevel={completionLevel}>{format(day, 'EEE')}</WeekDayName>
            <WeekDayNumber $completionLevel={completionLevel}>{format(day, 'd')}</WeekDayNumber>
            <WeekDayCompletion $completionLevel={completionLevel}>
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
      const emptyCells = Array(getLeadingEmptyCellCount(monthStart, weekStartsOn)).fill(null)
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
                  $level={getLevel(count)}
                  $isToday={isToday(date)}
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
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const headerLabel = viewType === 'month'
    ? format(currentDate, 'MMMM yyyy')
    : viewType === 'week'
      ? `${format(startOfWeek(currentDate, weekOptions), 'MMM d')} - ${format(endOfWeek(currentDate, weekOptions), 'MMM d, yyyy')}`
      : format(currentDate, 'yyyy')

  const periodLabel = viewType === 'year' ? 'This Year' : viewType === 'week' ? 'This Week' : 'This Month'

  if (habits.length === 0) {
    return (
      <CalendarContainer>
        <Header>
          <Title>Calendar</Title>
        </Header>
        
        <EmptyState>
          <EmptyStateIcon>
            <AppIcon name="calendar" size={64} />
          </EmptyStateIcon>
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
            $active={viewType === 'week'}
            onClick={() => setViewType('week')}
          >
            Week
          </ToggleButton>
          <ToggleButton
            $active={viewType === 'month'}
            onClick={() => setViewType('month')}
          >
            Month
          </ToggleButton>
          <ToggleButton
            $active={viewType === 'year'}
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
              {(getLegacyIconText(habit.icon) ? `${getLegacyIconText(habit.icon)} ` : '') + habit.name}
            </option>
          ))}
        </HabitSelect>
      </HabitSelectRow>

      <CalendarHeader>
        <NavButton onClick={goToPrevious} aria-label="Previous period">
          <AppIcon name="chevron-left" size={24} />
        </NavButton>

        <MonthYear>{headerLabel}</MonthYear>

        <NavButton onClick={goToNext} aria-label="Next period">
          <AppIcon name="chevron-right" size={24} />
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
          {dayHeaders.map(day => (
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

      <SelectedDateCard elevated>
        <SelectedDateHeader>
          <SelectedDateInfo>
            <SelectedDateTitle>{selectedDateLabel}</SelectedDateTitle>
            <SelectedDateMeta>
              <SelectedHabitIcon $color={selectedHabit.color}>
                <AppIcon name={selectedHabit.icon} fallbackName={DEFAULT_HABIT_ICON} size={16} />
              </SelectedHabitIcon>
              {selectedHabit.name}
            </SelectedDateMeta>
          </SelectedDateInfo>
          <SelectedDateCount>
            {selectedDateCount}{targetLabel}
          </SelectedDateCount>
        </SelectedDateHeader>

        <SelectedDateActions>
          {isCountHabit ? (
            <>
              <Button
                variant="secondary"
                onClick={handleDecrementSelectedDate}
                disabled={selectedDateCount === 0}
              >
                Remove one
              </Button>
              <Button onClick={handleIncrementSelectedDate}>
                Add log
              </Button>
            </>
          ) : (
            <Button
              variant={selectedDateCount > 0 ? 'secondary' : 'primary'}
              onClick={handleToggleSelectedDate}
            >
              {selectedDateCount > 0 ? 'Mark Incomplete' : 'Mark Complete'}
            </Button>
          )}
        </SelectedDateActions>
      </SelectedDateCard>

      <Legend>
        <LegendItem>
          <LegendColor $level={0} />
          <LegendText>0</LegendText>
        </LegendItem>
        <LegendItem>
          <LegendColor $level={1} />
          <LegendText>1</LegendText>
        </LegendItem>
        <LegendItem>
          <LegendColor $level={2} />
          <LegendText>2-3</LegendText>
        </LegendItem>
        <LegendItem>
          <LegendColor $level={3} />
          <LegendText>4-6</LegendText>
        </LegendItem>
        <LegendItem>
          <LegendColor $level={4} />
          <LegendText>7+</LegendText>
        </LegendItem>
      </Legend>

      <StatsCard elevated>
        <StatItem>
          <StatValue>{rangeStats.percentDaysSaid}%</StatValue>
          <StatLabel>{periodLabel}: Days Said</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{rangeStats.percentDaysMissed}%</StatValue>
          <StatLabel>{periodLabel}: Days Not Said</StatLabel>
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
