import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import EmptyState from '../components/EmptyState'
import AppIcon from '../components/AppIcon'
import { useHabits } from '../context/HabitsContext'
import { format, startOfWeek, subWeeks, addWeeks } from 'date-fns'
import { getJournalTimeline } from '../domain/journalTimeline'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { DEFAULT_HABIT_ICON } from '../domain/iconCatalog'

const JournalContainer = styled.div`
  width: 100%;
  padding: clamp(22px, 5vw, 48px);
  padding-bottom: ${props => props.theme.spacing.xxxl};
  max-width: 800px;
  margin: 0 auto;

  @media (max-width: ${props => props.theme.breakpoints.narrow}) {
    padding: ${props => props.theme.spacing.md};
    padding-bottom: ${props => props.theme.spacing.xxxl};
  }
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xl};
  padding-bottom: ${props => props.theme.spacing.md};
  border-bottom: 2px solid ${props => props.theme.colors.borderStrong};

  @media (max-width: ${props => props.theme.breakpoints.narrow}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${props => props.theme.spacing.sm};
    margin-bottom: ${props => props.theme.spacing.md};
    padding-bottom: ${props => props.theme.spacing.md};

    button {
      width: 100%;
    }
  }
`

const Title = styled.h1`
  font-size: ${props => props.theme.typography.fontSize.headingLarge};
`

const SearchContainer = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};

  @media (max-width: ${props => props.theme.breakpoints.narrow}) {
    margin-bottom: ${props => props.theme.spacing.md};
  }
`

const WeekNavigation = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas: 'previous range next';
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};

  @media (max-width: ${props => props.theme.breakpoints.narrow}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-areas:
      'range range'
      'previous next';
    gap: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    margin-bottom: ${props => props.theme.spacing.md};
  }
`

const WeekRange = styled.h2`
  grid-area: range;
  margin: 0;
  font-size: ${props => props.theme.typography.fontSize.headingMedium};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  text-align: center;

  @media (max-width: ${props => props.theme.breakpoints.narrow}) {
    font-size: 1.25rem;
    line-height: 1.15;
    white-space: nowrap;
  }
`

const NavButton = styled(Button)`
  grid-area: ${props => props.$area};
  padding: ${props => props.theme.spacing.sm};
  justify-self: ${props => props.$area === 'previous' ? 'start' : 'end'};
`

const JournalEntriesGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`

const JournalEntryCard = styled(Card)`
  padding: ${props => props.theme.spacing.lg};
`

const EntryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme.spacing.sm};

  @media (max-width: ${props => props.theme.breakpoints.narrow}) {
    flex-direction: column;
    gap: ${props => props.theme.spacing.xs};
  }
`

const EntryDate = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.text.primary};
`

const EntryMood = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
`

const EntryContent = styled.p`
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  color: ${props => props.theme.colors.text.primary};
  line-height: ${props => props.theme.typography.lineHeight.relaxed};
  white-space: pre-wrap;
  margin-bottom: ${props => props.theme.spacing.sm};
`

const EntryHabit = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
`

const HabitIcon = styled.span`
  display: inline-flex;
  color: ${props => props.$color || props.theme.colors.primary};
`

const NoEntries = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xxl} ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.text.secondary};

  @media (max-width: ${props => props.theme.breakpoints.narrow}) {
    padding: 0;

    > div {
      width: 100%;
      min-height: 280px;
      margin-top: ${props => props.theme.spacing.lg};
      padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.md};
    }
  }
`

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.lg};
`

const StatCard = styled(Card)`
  padding: ${props => props.theme.spacing.md};
  text-align: center;
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

const JournalView = () => {
  const navigate = useNavigate()
  const { weekStartsOn } = usePreferences()
  const { 
    habits, 
    journalEntries, 
    moodOptions
  } = useHabits()
  
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn }))
  const [searchTerm, setSearchTerm] = useState('')

  React.useEffect(() => {
    setCurrentWeekStart(prev => startOfWeek(prev, { weekStartsOn }))
  }, [weekStartsOn])

  const timeline = useMemo(() => getJournalTimeline({
    journalEntries,
    habits,
    moodOptions,
    searchTerm,
    weekStart: currentWeekStart,
    weekStartsOn
  }), [currentWeekStart, habits, journalEntries, moodOptions, searchTerm, weekStartsOn])
  
  const handlePrevWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1))
  }
  
  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1))
  }
  
  const handleToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn }))
  }
  
  return (
    <JournalContainer>
      <Header>
        <Title>Journal</Title>
        <Button variant="ghost" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </Header>
      
      <SearchContainer>
        <Input
          placeholder="Search journal entries..."
          value={searchTerm}
          onChange={(value) => setSearchTerm(value)}
          clearable
        />
      </SearchContainer>
      
      <WeekNavigation>
        <NavButton $area="previous" variant="ghost" onClick={handlePrevWeek}>
          <AppIcon name="chevron-left" size={16} />
          Previous
        </NavButton>
        <WeekRange>
          {format(currentWeekStart, 'MMM d')} - {format(timeline.weekEnd, 'MMM d, yyyy')}
        </WeekRange>
        <NavButton $area="next" variant="ghost" onClick={handleNextWeek}>
          Next
          <AppIcon name="chevron-right" size={16} />
        </NavButton>
      </WeekNavigation>
      
      <Button 
        variant="ghost" 
        onClick={handleToday}
        style={{ marginBottom: '16px', width: '100%' }}
      >
        Go to This Week
      </Button>
      
      {timeline.entries.length > 0 && (
        <StatsContainer>
          <StatCard elevated>
            <StatValue>{timeline.stats.entryCount}</StatValue>
            <StatLabel>{timeline.stats.entryCountLabel}</StatLabel>
          </StatCard>
          
          {timeline.stats.mostCommonMood && (
            <StatCard elevated>
              <StatValue>
                <AppIcon name={timeline.stats.mostCommonMood.icon} size={32} />
              </StatValue>
              <StatLabel>Most Common Mood</StatLabel>
            </StatCard>
          )}
          
          <StatCard elevated>
            <StatValue>
              {timeline.stats.avgEntriesPerDay}
            </StatValue>
            <StatLabel>Avg Entries/Day</StatLabel>
          </StatCard>
        </StatsContainer>
      )}
      
      <JournalEntriesGrid>
        {timeline.entries.length === 0 ? (
          <NoEntries>
            {searchTerm ? (
              <EmptyState
                icon={<AppIcon name="search" size={64} />}
                illustrationSize={96}
                title="No matching entries"
                description="Try adjusting your search terms."
              />
            ) : (
              <EmptyState
                icon={<AppIcon name="notebook" size={64} />}
                illustrationSize={96}
                title="No journal entries this week"
                description="Start reflecting on your habits to see your entries here."
              />
            )}
          </NoEntries>
        ) : (
          timeline.entries.map(({ entry, habit, mood }) => {
            return (
              <JournalEntryCard key={entry.id} elevated>
                <EntryHeader>
                  <EntryDate>
                    {format(new Date(entry.date), 'EEEE, MMMM d, yyyy')}
                  </EntryDate>
                  {mood && (
                    <EntryMood>
                      <AppIcon name={mood.icon} size={16} /> {mood.name}
                    </EntryMood>
                  )}
                </EntryHeader>
                
                <EntryContent>{entry.content}</EntryContent>
                
                {habit && (
                  <EntryHabit>
                    <HabitIcon $color={habit.color}>
                      <AppIcon name={habit.icon} fallbackName={DEFAULT_HABIT_ICON} size={18} />
                    </HabitIcon>
                    {habit.name}
                  </EntryHabit>
                )}
                
                <div style={{ 
                  fontSize: '12px', 
                  color: 'var(--text-secondary)', 
                  marginTop: '8px' 
                }}>
                  Added {format(new Date(entry.createdAt), 'h:mm a')}
                </div>
              </JournalEntryCard>
            )
          })
        )}
      </JournalEntriesGrid>
    </JournalContainer>
  )
}

export default JournalView
