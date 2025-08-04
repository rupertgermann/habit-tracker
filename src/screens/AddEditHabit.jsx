import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import CategorySelector from '../components/CategorySelector'
import { useHabits } from '../context/HabitsContext'

const FormContainer = styled.div`
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

const FormSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
`

const SectionTitle = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.headingMedium};
  margin-bottom: ${props => props.theme.spacing.md};
`

const FormCard = styled(Card)`
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
`

const FormGroup = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`

const Label = styled.label`
  display: block;
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  margin-bottom: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.primary};
`

const Description = styled.p`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.md};
`

const FrequencyOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`

const FrequencyOption = styled.label`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ selected, theme }) =>
    selected &&
    `
      border-color: ${theme.colors.primary};
      background-color: ${theme.colors.primary}10;
    `}
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }
`

const RadioInput = styled.input`
  margin-right: ${props => props.theme.spacing.sm};
`

const FrequencyInfo = styled.div`
  flex: 1;
`

const FrequencyTitle = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  margin-bottom: ${props => props.theme.spacing.xs};
`

const FrequencyDescription = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
`

const DaysSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.md};
`

const DayButton = styled.button`
  aspect-ratio: 1;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  background: none;
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ selected, theme }) =>
    selected &&
    `
      background-color: ${theme.colors.primary};
      color: ${theme.colors.white};
      border-color: ${theme.colors.primary};
    `}
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }
`

const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: ${props => props.theme.spacing.sm};
`

const ColorOption = styled.button`
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.round};
  border: 2px solid ${props => props.theme.colors.border};
  background-color: ${props => props.color};
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ selected, theme }) =>
    selected &&
    `
      border-color: ${theme.colors.text.primary};
      transform: scale(1.1);
    `}
  
  &:hover {
    transform: scale(1.1);
  }
`

const IconGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: ${props => props.theme.spacing.sm};
`

const IconOption = styled.button`
  width: 40px;
  height: 40px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  background: none;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ selected, theme }) =>
    selected &&
    `
      background-color: ${theme.colors.primary}20;
      border-color: ${theme.colors.primary};
    `}
  
  &:hover {
    background-color: ${props => props.theme.colors.background};
  }
`

const ReminderList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`

const ReminderItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
`

const ReminderTime = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.destructive};
  cursor: pointer;
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  padding: ${props => props.theme.spacing.xs};
`

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.xxl};
`

const colorOptions = [
  '#6CC47C', // Primary green
  '#F6D860', // Secondary yellow
  '#F28A8A', // Destructive red
  '#60A5FA', // Blue
  '#A78BFA', // Purple
  '#F472B6', // Pink
  '#34D399', // Emerald
  '#FBBF24', // Amber
  '#F87171', // Red
  '#60A5FA', // Light blue
  '#C084FC', // Violet
  '#FB7185'  // Rose
]

const iconOptions = [
  '✓', '💧', '🏃', '📚', '🧘', '🎯',
  '💪', '🧠', '🌱', '⏰', '🔥', '⭐',
  '🎨', '🎵', '🍎', '💤', '🌞', '🌙'
]

const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const AddEditHabit = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addHabit, updateHabit, getHabitById } = useHabits()
  const isEditing = Boolean(id)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'daily',
    daysPerWeek: 3,
    selectedDays: [false, false, false, false, false, false, false],
    color: '#6CC47C',
    icon: '✓',
    category: 'other',
    reminders: []
  })

  useEffect(() => {
    if (isEditing && id) {
      const habit = getHabitById(id)
      if (habit) {
        setFormData({
          name: habit.name,
          description: habit.description || '',
          frequency: habit.frequency,
          daysPerWeek: habit.daysPerWeek || 3,
          selectedDays: habit.selectedDays || [false, false, false, false, false, false, false],
          color: habit.color || '#6CC47C',
          icon: habit.icon || '✓',
          category: habit.category || 'other',
          reminders: habit.reminders || []
        })
      }
    }
  }, [isEditing, id, getHabitById])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFrequencyChange = (frequency) => {
    setFormData(prev => ({
      ...prev,
      frequency
    }))
  }

  const handleDayToggle = (index) => {
    setFormData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.map((selected, i) => 
        i === index ? !selected : selected
      )
    }))
  }

  const handleColorSelect = (color) => {
    setFormData(prev => ({
      ...prev,
      color
    }))
  }

  const handleIconSelect = (icon) => {
    setFormData(prev => ({
      ...prev,
      icon
    }))
  }

  const handleCategoryChange = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      category: categoryId
    }))
  }

  const handleAddReminder = () => {
    setFormData(prev => ({
      ...prev,
      reminders: [...prev.reminders, '09:00']
    }))
  }

  const handleReminderChange = (index, time) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.map((reminder, i) => 
        i === index ? time : reminder
      )
    }))
  }

  const handleRemoveReminder = (index) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const habitData = {
      ...formData,
      createdAt: isEditing ? formData.createdAt : new Date().toISOString()
    }

    if (isEditing) {
      updateHabit(id, habitData)
    } else {
      addHabit(habitData)
    }

    navigate('/habits')
  }

  const handleCancel = () => {
    navigate('/habits')
  }

  return (
    <FormContainer>
      <Header>
        <Title>{isEditing ? 'Edit Habit' : 'New Habit'}</Title>
        <Button variant="ghost" onClick={handleCancel}>
          Cancel
        </Button>
      </Header>

      <form onSubmit={handleSubmit}>
        <FormSection>
          <SectionTitle>Basic Information</SectionTitle>
          <FormCard elevated>
            <FormGroup>
              <Label>Habit Name</Label>
              <Input
                placeholder="e.g., Drink 8 glasses of water"
                value={formData.name}
                onChange={(value) => handleInputChange('name', value)}
                required
                maxLength={50}
                showCharacterCount
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Description (Optional)</Label>
              <Input
                placeholder="Add a note about this habit"
                value={formData.description}
                onChange={(value) => handleInputChange('description', value)}
                maxLength={100}
                showCharacterCount
              />
            </FormGroup>
          </FormCard>
        </FormSection>

        <FormSection>
          <SectionTitle>Category</SectionTitle>
          <FormCard elevated>
            <CategorySelector
              selectedCategory={formData.category}
              onCategoryChange={handleCategoryChange}
            />
          </FormCard>
        </FormSection>

        <FormSection>
          <SectionTitle>Frequency</SectionTitle>
          <FormCard elevated>
            <FrequencyOptions>
              <FrequencyOption
                selected={formData.frequency === 'daily'}
                onClick={() => handleFrequencyChange('daily')}
              >
                <RadioInput
                  type="radio"
                  name="frequency"
                  checked={formData.frequency === 'daily'}
                  onChange={() => handleFrequencyChange('daily')}
                />
                <FrequencyInfo>
                  <FrequencyTitle>Daily</FrequencyTitle>
                  <FrequencyDescription>Every day of the week</FrequencyDescription>
                </FrequencyInfo>
              </FrequencyOption>
              
              <FrequencyOption
                selected={formData.frequency === 'weekly'}
                onClick={() => handleFrequencyChange('weekly')}
              >
                <RadioInput
                  type="radio"
                  name="frequency"
                  checked={formData.frequency === 'weekly'}
                  onChange={() => handleFrequencyChange('weekly')}
                />
                <FrequencyInfo>
                  <FrequencyTitle>Weekly</FrequencyTitle>
                  <FrequencyDescription>Once per week</FrequencyDescription>
                </FrequencyInfo>
              </FrequencyOption>
              
              <FrequencyOption
                selected={formData.frequency === 'custom'}
                onClick={() => handleFrequencyChange('custom')}
              >
                <RadioInput
                  type="radio"
                  name="frequency"
                  checked={formData.frequency === 'custom'}
                  onChange={() => handleFrequencyChange('custom')}
                />
                <FrequencyInfo>
                  <FrequencyTitle>Custom</FrequencyTitle>
                  <FrequencyDescription>Select specific days</FrequencyDescription>
                </FrequencyInfo>
              </FrequencyOption>
            </FrequencyOptions>

            {formData.frequency === 'custom' && (
              <>
                <Description>Which days would you like to perform this habit?</Description>
                <DaysSelector>
                  {daysOfWeek.map((day, index) => (
                    <DayButton
                      key={index}
                      type="button"
                      selected={formData.selectedDays[index]}
                      onClick={() => handleDayToggle(index)}
                    >
                      {day}
                    </DayButton>
                  ))}
                </DaysSelector>
              </>
            )}
          </FormCard>
        </FormSection>

        <FormSection>
          <SectionTitle>Appearance</SectionTitle>
          <FormCard elevated>
            <FormGroup>
              <Label>Color</Label>
              <ColorGrid>
                {colorOptions.map((color) => (
                  <ColorOption
                    key={color}
                    type="button"
                    color={color}
                    selected={formData.color === color}
                    onClick={() => handleColorSelect(color)}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </ColorGrid>
            </FormGroup>
            
            <FormGroup>
              <Label>Icon</Label>
              <IconGrid>
                {iconOptions.map((icon) => (
                  <IconOption
                    key={icon}
                    type="button"
                    selected={formData.icon === icon}
                    onClick={() => handleIconSelect(icon)}
                    aria-label={`Select icon ${icon}`}
                  >
                    {icon}
                  </IconOption>
                ))}
              </IconGrid>
            </FormGroup>
          </FormCard>
        </FormSection>

        <FormSection>
          <SectionTitle>Reminders</SectionTitle>
          <FormCard elevated>
            <Description>Get notified to complete your habit</Description>
            
            <ReminderList>
              {formData.reminders.map((reminder, index) => (
                <ReminderItem key={index}>
                  <ReminderTime>{reminder}</ReminderTime>
                  <RemoveButton
                    type="button"
                    onClick={() => handleRemoveReminder(index)}
                  >
                    Remove
                  </RemoveButton>
                </ReminderItem>
              ))}
            </ReminderList>
            
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={handleAddReminder}
            >
              Add Reminder
            </Button>
          </FormCard>
        </FormSection>

        <ActionButtons>
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            fullWidth
            disabled={!formData.name.trim()}
          >
            {isEditing ? 'Update Habit' : 'Create Habit'}
          </Button>
        </ActionButtons>
      </form>
    </FormContainer>
  )
}

export default AddEditHabit