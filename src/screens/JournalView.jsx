import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import SelectDropdown from '../components/SelectDropdown'
import EmptyState from '../components/EmptyState'
import AppIcon from '../components/AppIcon'
import { useHabits } from '../context/HabitsContext'
import { useToast } from '../context/ToastContext'
import { format, startOfWeek, subWeeks, addWeeks, parseISO } from 'date-fns'
import { getJournalTimeline } from '../domain/journalTimeline'
import { getJournalComposerState } from '../domain/journalComposer'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { DEFAULT_HABIT_ICON } from '../domain/iconCatalog'

const JournalContainer = styled.div`
  width: 100%;
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

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  flex-wrap: wrap;
  justify-content: flex-end;
`

const SearchContainer = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`

const WeekNavigation = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};

  @media (max-width: 479px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      'range range'
      'previous next';
    gap: ${props => props.theme.spacing.sm};

    > button:first-child {
      grid-area: previous;
      justify-self: start;
    }

    > button:last-child {
      grid-area: next;
      justify-self: end;
    }
  }
`

const WeekRange = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.headingMedium};
  font-weight: ${props => props.theme.typography.fontWeight.medium};

  @media (max-width: 479px) {
    grid-area: range;
    text-align: center;
  }
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
  display: inline-flex;
  color: ${props => props.$color || props.theme.colors.primary};
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
  color: ${props => props.$color || props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.xs};
`

const StatLabel = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
`

const ComposerForm = styled(Card)`
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`

const ComposerFields = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.md};
  align-items: end;
`

const FieldLabel = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.text.primary};
`

const MoodSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
  gap: ${props => props.theme.spacing.sm};
`

const MoodOption = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.small};
  border: 2px solid ${props => props.$selected ? props.theme.colors.primary : props.theme.colors.border};
  background-color: ${props => props.$selected ? `${props.theme.colors.primary}10` : props.theme.colors.white};
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 72px;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }
`

const MoodEmoji = styled.span`
  font-size: 24px;
  margin-bottom: ${props => props.theme.spacing.xs};
`

const MoodLabel = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.primary};
`

const ComposerNotice = styled.p`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
`

const ComposerActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
`

const emptyDraft = { habitId: '', date: '', content: '', moodId: null }

const JournalView = () => {
  const navigate = useNavigate()
  const { weekStartsOn } = usePreferences()
  const {
    habits,
    journalEntries,
    moodOptions,
    addJournalEntry,
    updateJournalEntry
  } = useHabits()
  const { showSuccessToast, showErrorToast } = useToast()

  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn }))
  const [searchTerm, setSearchTerm] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)
  const [isSaving, setIsSaving] = useState(false)

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

  const composer = getJournalComposerState({ habits, journalEntries, draft })

  const updateDraft = (changes) => setDraft(current => ({ ...current, ...changes }))

  // Editing an existing habit/date combination starts from the committed entry
  React.useEffect(() => {
    const existingEntry = composer.existingEntry
    if (!existingEntry) return

    setDraft(current => current.content.trim()
      ? current
      : {
          ...current,
          content: existingEntry.content || '',
          moodId: existingEntry.moodId || null
        })
  }, [composer.existingEntry])

  const handleStartComposing = () => {
    setDraft({ ...emptyDraft, date: composer.defaultDate })
    setIsComposing(true)
  }

  const handleCancelComposing = () => {
    setDraft(emptyDraft)
    setIsComposing(false)
  }

  const handleSaveDraft = async () => {
    if (!composer.canSave || isSaving) return

    const isUpdating = composer.mode === 'update'
    setIsSaving(true)

    try {
      const result = isUpdating
        ? await updateJournalEntry(composer.existingEntry.id, composer.entryData)
        : await addJournalEntry(composer.entryData)

      if (!result.ok) {
        showErrorToast(
          isUpdating
            ? 'Failed to update journal entry. Please try again.'
            : 'Failed to add journal entry. Please try again.'
        )
        return
      }

      setCurrentWeekStart(startOfWeek(parseISO(composer.entryData.date), { weekStartsOn }))
      setDraft(emptyDraft)
      setIsComposing(false)
      showSuccessToast(
        isUpdating
          ? 'Journal entry updated successfully!'
          : 'Journal entry added successfully!'
      )
    } catch {
      showErrorToast(
        isUpdating
          ? 'Failed to update journal entry. Please try again.'
          : 'Failed to add journal entry. Please try again.'
      )
    } finally {
      setIsSaving(false)
    }
  }
  
  return (
    <JournalContainer>
      <Header>
        <Title>Journal</Title>
        <HeaderActions>
          {!isComposing && (
            <Button
              onClick={handleStartComposing}
              disabled={composer.habitOptions.length === 0}
            >
              <AppIcon name="plus" size={16} />
              Add Entry
            </Button>
          )}
          <Button variant="ghost" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </HeaderActions>
      </Header>

      {composer.habitOptions.length === 0 && (
        <ComposerNotice>{composer.notice}</ComposerNotice>
      )}

      {isComposing && (
        <ComposerForm elevated>
          <ComposerFields>
            <FieldLabel as="div">
              Habit
              <SelectDropdown
                ariaLabel="Journal entry habit"
                value={draft.habitId}
                options={[
                  { value: '', label: 'Select a habit' },
                  ...composer.habitOptions
                ]}
                onChange={(habitId) => updateDraft({ habitId })}
                fullWidth
              />
            </FieldLabel>

            <Input
              label="Date"
              aria-label="Journal entry date"
              type="date"
              value={draft.date}
              onChange={(date) => updateDraft({ date })}
              error={composer.dateError}
              max={composer.maxDate}
              disabled={isSaving}
            />
          </ComposerFields>

          <MoodSelector>
            {moodOptions.map((mood) => (
              <MoodOption
                key={mood.id}
                type="button"
                $selected={draft.moodId === mood.id}
                onClick={() => updateDraft({ moodId: mood.id })}
                disabled={isSaving}
              >
                <MoodEmoji>{mood.emoji}</MoodEmoji>
                <MoodLabel>{mood.name}</MoodLabel>
              </MoodOption>
            ))}
          </MoodSelector>

          <Input
            label="Reflection"
            placeholder="Reflect on your experience, challenges, or achievements..."
            value={draft.content}
            onChange={(content) => updateDraft({ content })}
            disabled={isSaving}
            multiline
            rows={4}
            maxLength={500}
            showCharacterCount
          />

          {composer.notice && <ComposerNotice>{composer.notice}</ComposerNotice>}

          <ComposerActions>
            <Button
              type="button"
              onClick={handleSaveDraft}
              disabled={!composer.canSave}
              loading={isSaving}
              fullWidth
            >
              {composer.mode === 'update' ? 'Update Entry' : 'Save Entry'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancelComposing}
              disabled={isSaving}
              fullWidth
            >
              Cancel
            </Button>
          </ComposerActions>
        </ComposerForm>
      )}

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
          <AppIcon name="chevron-left" size={16} />
          Previous
        </NavButton>
        <WeekRange>
          {format(currentWeekStart, 'MMM d')} - {format(timeline.weekEnd, 'MMM d, yyyy')}
        </WeekRange>
        <NavButton variant="ghost" onClick={handleNextWeek}>
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
                {timeline.stats.mostCommonMood.emoji}
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
                title="No matching entries"
                description="Try adjusting your search terms."
              />
            ) : (
              <EmptyState
                icon={<AppIcon name="notebook" size={64} />}
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
                      {mood.emoji} {mood.name}
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
