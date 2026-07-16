import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import Card from './Card'
import Button from './Button'
import Input from './Input'
import { useHabits } from '../context/HabitsContext'
import { useToast } from '../context/ToastContext'
import { format } from 'date-fns'

const JournalContainer = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`

const JournalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
`

const JournalTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.bodyLarge};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.text.primary};
`

const JournalDate = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
`

const JournalForm = styled(Card)`
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.md};
`

const MoodSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
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
    transform: translateY(-2px);
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

const JournalEntryCard = styled(Card)`
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.sm};
  position: relative;
`

const EntryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
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
`

const EntryTime = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
`

const EntryActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.md};
`

const EmptyJournal = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.text.secondary};
  font-style: italic;
`

const JournalEntry = ({ habitId, date, habitName }) => {
  const { 
    moodOptions, 
    getJournalEntryForHabit, 
    addJournalEntry, 
    updateJournalEntry,
    deleteJournalEntry 
  } = useHabits()
  const { showSuccessToast, showErrorToast } = useToast()
  
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState('')
  const [selectedMood, setSelectedMood] = useState(null)
  const [existingEntry, setExistingEntry] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const persistedEntry = getJournalEntryForHabit(habitId, date)
  
  useEffect(() => {
    if (persistedEntry) {
      setExistingEntry(persistedEntry)
      setContent(persistedEntry.content || '')
      setSelectedMood(persistedEntry.moodId || null)
      setIsEditing(false)
    } else {
      setExistingEntry(null)
      setContent('')
      setSelectedMood(null)
      setIsEditing(true)
    }
  }, [habitId, date, persistedEntry])
  
  const handleSaveEntry = async () => {
    if (isSaving) return

    const isUpdating = Boolean(existingEntry)
    setIsSaving(true)

    try {
      const entryData = {
        habitId,
        date,
        content,
        moodId: selectedMood
      }

      const result = isUpdating
        ? await updateJournalEntry(existingEntry.id, entryData)
        : await addJournalEntry(entryData)

      if (!result.ok) {
        showErrorToast(
          isUpdating
            ? 'Failed to update journal entry. Please try again.'
            : 'Failed to add journal entry. Please try again.'
        )
        return
      }

      setExistingEntry(result.entry)
      setContent(result.entry.content || '')
      setSelectedMood(result.entry.moodId || null)
      setIsEditing(false)
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
  
  const handleEditEntry = () => {
    setIsEditing(true)
  }
  
  const handleDeleteEntry = async () => {
    if (!existingEntry || isDeleting) return

    setIsDeleting(true)
    try {
      const result = await deleteJournalEntry(existingEntry.id)
      if (!result.ok) {
        showErrorToast('Failed to delete journal entry. Please try again.')
        return
      }

      setExistingEntry(null)
      setContent('')
      setSelectedMood(null)
      setIsEditing(true)
      showSuccessToast('Journal entry deleted successfully!')
    } catch {
      showErrorToast('Failed to delete journal entry. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }
  
  const getMoodById = (moodId) => {
    return moodOptions.find(mood => mood.id === moodId) || null
  }
  
  const selectedMoodData = getMoodById(selectedMood)
  
  return (
    <JournalContainer>
      <JournalHeader>
        <JournalTitle>Journal Reflection</JournalTitle>
        <JournalDate>{format(new Date(date), 'MMM d, yyyy')}</JournalDate>
      </JournalHeader>
      
      {isEditing ? (
        <JournalForm elevated>
          <MoodSelector>
            {moodOptions.map((mood) => (
              <MoodOption
                key={mood.id}
                type="button"
                $selected={selectedMood === mood.id}
                onClick={() => setSelectedMood(mood.id)}
                disabled={isSaving}
              >
                <MoodEmoji>{mood.emoji}</MoodEmoji>
                <MoodLabel>{mood.name}</MoodLabel>
              </MoodOption>
            ))}
          </MoodSelector>
          
          <Input
            label="How did you feel about this habit today?"
            placeholder="Reflect on your experience, challenges, or achievements..."
            value={content}
            onChange={(value) => setContent(value)}
            disabled={isSaving}
            multiline
            rows={4}
            maxLength={500}
            showCharacterCount
          />
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <Button
              type="button"
              onClick={handleSaveEntry}
              disabled={!content.trim()}
              loading={isSaving}
              fullWidth
            >
              Save Entry
            </Button>
            {existingEntry && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                fullWidth
              >
                Cancel
              </Button>
            )}
          </div>
        </JournalForm>
      ) : existingEntry ? (
        <JournalEntryCard elevated>
          <EntryHeader>
            <EntryMood>
              {getMoodById(existingEntry.moodId)?.emoji} {getMoodById(existingEntry.moodId)?.name}
            </EntryMood>
            <EntryTime>
              {format(new Date(existingEntry.createdAt), 'h:mm a')}
            </EntryTime>
          </EntryHeader>
          
          <EntryContent>{existingEntry.content}</EntryContent>
          
          <EntryActions>
            <Button
              type="button"
              size="small"
              variant="ghost"
              onClick={handleEditEntry}
              disabled={isDeleting}
            >
              Edit
            </Button>
            <Button
              type="button"
              size="small"
              variant="destructive"
              onClick={handleDeleteEntry}
              loading={isDeleting}
            >
              Delete
            </Button>
          </EntryActions>
        </JournalEntryCard>
      ) : (
        <EmptyJournal>
          No journal entry for this habit today. Add your reflections!
        </EmptyJournal>
      )}
    </JournalContainer>
  )
}

export default JournalEntry
