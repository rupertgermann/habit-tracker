import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import EmptyState from '../components/EmptyState'
import { useHabits } from '../context/HabitsContext'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subWeeks, addWeeks } from 'date-fns'

const JournalContainer = styled.div`
  padding: ${props => props.theme.spacing.lg};
  padding-bottom: ${props => props.theme.spacing.xxxl};
  max-width: 800px;
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

const SearchContainer = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`

const WeekNavigation = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`

const WeekRange = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.headingMedium};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`

const NavButton = styled(Button)`
  padding: ${props => props.theme.spacing.sm};
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
  font-size: 18px;
`

const NoEntries = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xxl} ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.text.secondary};
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
  color: ${props => props.color || props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.xs};
`

const StatLabel = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
`

const JournalView = () => {
  const navigate = useNavigate()
  const { 
    habits, 
    journalEntries, 
    moodOptions, 
    getJournalEntriesByDateRange 
  } = useHabits()
  
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }))
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredEntries, setFilteredEntries] = useState([])
  
  useEffect(() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 })
    const entries = getJournalEntriesByDateRange(
      format(currentWeekStart, 'yyyy-MM-dd'),
      format(weekEnd, 'yyyy-MM-dd')
    )
    
    // Sort entries by date (newest first)
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    )
    
    setFilteredEntries(sortedEntries)
  }, [currentWeekStart, getJournalEntriesByDateRange])
  
  useEffect(() => {
    if (!searchTerm.trim()) {
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 })
      const entries = getJournalEntriesByDateRange(
        format(currentWeekStart, 'yyyy-MM-dd'),
        format(weekEnd, 'yyyy-MM-dd')
      )
      
      // Sort entries by date (newest first)
      const sortedEntries = [...entries].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )
      
      setFilteredEntries(sortedEntries)
      return
    }
    
    const term = searchTerm.toLowerCase()
    const filtered = journalEntries.filter(entry => {
      const habit = habits.find(h => h.id === entry.habitId)
      return (
        entry.content.toLowerCase().includes(term) ||
        (habit && habit.name.toLowerCase().includes(term))
      )
    })
    
    // Sort filtered entries by date (newest first)
    const sortedFiltered = [...filtered].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    )
    
    setFilteredEntries(sortedFiltered)
  }, [searchTerm, journalEntries, habits, currentWeekStart, getJournalEntriesByDateRange])
  
  const handlePrevWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1))
  }
  
  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1))
  }
  
  const handleToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))
  }
  
  const getHabitById = (habitId) => {
    return habits.find(habit => habit.id === habitId)
  }
  
  const getMoodById = (moodId) => {
    return moodOptions.find(mood => mood.id === moodId)
  }
  
  // Calculate mood statistics
  const moodCounts = moodOptions.reduce((acc, mood) => {
    acc[mood.id] = 0
    return acc
  }, {})
  
  filteredEntries.forEach(entry => {
    if (entry.moodId && moodCounts[entry.moodId] !== undefined) {
      moodCounts[entry.moodId]++
    }
  })
  
  const mostCommonMood = Object.entries(moodCounts).reduce((max, [moodId, count]) => {
    return count > max.count ? { moodId, count } : max
  }, { moodId: null, count: 0 })
  
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 })
  
  return (
    <JournalContainer>
      <Header>
        <Title>Journal</Title>
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
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
        <NavButton variant="ghost" onClick={handlePrevWeek}>
          ← Previous
        </NavButton>
        <WeekRange>
          {format(currentWeekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </WeekRange>
        <NavButton variant="ghost" onClick={handleNextWeek}>
          Next →
        </NavButton>
      </WeekNavigation>
      
      <Button 
        variant="ghost" 
        onClick={handleToday}
        style={{ marginBottom: '16px', width: '100%' }}
      >
        Go to This Week
      </Button>
      
      {filteredEntries.length > 0 && (
        <StatsContainer>
          <StatCard elevated>
            <StatValue>{filteredEntries.length}</StatValue>
            <StatLabel>Entries This Week</StatLabel>
          </StatCard>
          
          {mostCommonMood.moodId && (
            <StatCard elevated>
              <StatValue>
                {getMoodById(mostCommonMood.moodId)?.emoji}
              </StatValue>
              <StatLabel>Most Common Mood</StatLabel>
            </StatCard>
          )}
          
          <StatCard elevated>
            <StatValue>
              {Math.round((filteredEntries.length / 7) * 10) / 10}
            </StatValue>
            <StatLabel>Avg Entries/Day</StatLabel>
          </StatCard>
        </StatsContainer>
      )}
      
      <JournalEntriesGrid>
        {filteredEntries.length === 0 ? (
          <NoEntries>
            {searchTerm ? (
              <EmptyState
                icon="🔍"
                title="No matching entries"
                description="Try adjusting your search terms."
              />
            ) : (
              <EmptyState
                icon="📔"
                title="No journal entries this week"
                description="Start reflecting on your habits to see your entries here."
              />
            )}
          </NoEntries>
        ) : (
          filteredEntries.map((entry) => {
            const habit = getHabitById(entry.habitId)
            const mood = getMoodById(entry.moodId)
            
            return (
              <JournalEntryCard key={entry.id} elevated>
                <EntryHeader>
                  <EntryDate>
                    {format(new Date(entry.date), 'EEEE, MMMM d, yyyy')}
                  </EntryDate>
                  {mood && (
                    <EntryMood>
                      {mood.emoji} {mood.name}
                    </EntryMood>
                  )}
                </EntryHeader>
                
                <EntryContent>{entry.content}</EntryContent>
                
                {habit && (
                  <EntryHabit>
                    <HabitIcon>{habit.icon || '✓'}</HabitIcon>
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