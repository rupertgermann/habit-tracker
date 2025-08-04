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
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
  overflow-x: auto;
  padding-bottom: ${props => props.theme.spacing.sm};
`

const MoodOption = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.medium};
  border: 2px solid ${props => props.selected ? props.theme.colors.primary : props.theme.colors.border};
  background-color: ${props => props.selected ? `${props.theme.colors.primary}10` : props.theme.colors.white};
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 70px;
  
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

const EditButton = styled(Button)`
  position: absolute;
  top: ${props => props.theme.spacing.md};
  right: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
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
  
  useEffect(() => {
    const entry = getJournalEntryForHabit(habitId, date)
    if (entry) {
      setExistingEntry(entry)
      setContent(entry.content || '')
      setSelectedMood(entry.moodId || null)
      setIsEditing(false)
    } else {
      setExistingEntry(null)
      setContent('')
      setSelectedMood(null)
      setIsEditing(true)
    }
  }, [habitId, date, getJournalEntryForHabit])
  
  const handleSaveEntry = () => {
    try {
      const entryData = {
        habitId,
        date,
        content,
        moodId: selectedMood
      }
      
      if (existingEntry) {
        updateJournalEntry(existingEntry.id, entryData)
        showSuccessToast('Journal entry updated successfully!')
      } else {
        addJournalEntry(entryData)
        showSuccessToast('Journal entry added successfully!')
      }
      
      setIsEditing(false)
    } catch (error) {
      showErrorToast('Failed to save journal entry. Please try again.')
    }
  }
  
  const handleEditEntry = () => {
    setIsEditing(true)
  }
  
  const handleDeleteEntry = () => {
    if (existingEntry) {
      deleteJournalEntry(existingEntry.id)
      setExistingEntry(null)
      setContent('')
      setSelectedMood(null)
      setIsEditing(true)
      showSuccessToast('Journal entry deleted successfully!')
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
                selected={selectedMood === mood.id}
                onClick={() => setSelectedMood(mood.id)}
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
            multiline
            rows={4}
            maxLength={500}
            showCharacterCount
          />
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <Button
              onClick={handleSaveEntry}
              disabled={!content.trim()}
              fullWidth
            >
              Save Entry
            </Button>
            {existingEntry && (
              <Button
                variant="ghost"
                onClick={() => setIsEditing(false)}
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
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <EditButton
              variant="ghost"
              onClick={handleEditEntry}
            >
              Edit
            </EditButton>
            <EditButton
              variant="destructive"
              onClick={handleDeleteEntry}
            >
              Delete
            </EditButton>
          </div>
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