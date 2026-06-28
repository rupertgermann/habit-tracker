import React, { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import CategorySelector from '../components/CategorySelector'
import { useHabits } from '../context/HabitsContext'

const FormContainer = styled.div`
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
  
  ${({ $selected, theme }) =>
    $selected &&
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
  
  ${({ $selected, theme }) =>
    $selected &&
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
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: ${props => props.theme.spacing.md};
`

const ColorOption = styled.button`
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.round};
  border: 2px solid ${props => props.theme.colors.border};
  background-color: ${props => props.$color};
  cursor: pointer;
  transition: all 0.2s ease;
  justify-self: center;
  
  ${({ $selected, theme }) =>
    $selected &&
    `
      border-color: ${theme.colors.text.primary};
      transform: scale(1.1);
      box-shadow: 0 0 0 3px ${theme.colors.primary}40;
    `}
  
  &:hover {
    transform: scale(1.1);
  }
`

const IconPickerControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
`

const IconSearch = styled.input`
  width: 100%;
  height: 40px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  padding: 0 ${props => props.theme.spacing.md};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  color: ${props => props.theme.colors.text.primary};
  background-color: ${props => props.theme.colors.white};

  &::placeholder {
    color: ${props => props.theme.colors.text.secondary};
  }

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}20;
  }
`

const IconGroupTabs = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  overflow-x: auto;
  padding-bottom: ${props => props.theme.spacing.xs};
`

const IconGroupTab = styled.button`
  flex: 0 0 auto;
  min-height: 32px;
  padding: 0 ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.small};
  border: 1px solid ${props => props.$selected ? props.theme.colors.primary : props.theme.colors.border};
  background-color: ${props => props.$selected ? `${props.theme.colors.primary}20` : 'transparent'};
  color: ${props => props.$selected ? props.theme.colors.primary : props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  font-weight: ${props => props.$selected ? props.theme.typography.fontWeight.medium : props.theme.typography.fontWeight.regular};
  cursor: pointer;
`

const IconGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: ${props => props.theme.spacing.sm};
  max-height: 280px;
  overflow-y: auto;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.xs} ${props => props.theme.spacing.xs} 0;
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
  justify-self: center;
  
  ${({ $selected, theme }) =>
    $selected &&
    `
      background-color: ${theme.colors.primary}20;
      border-color: ${theme.colors.primary};
    `}
  
  &:hover {
    background-color: ${props => props.theme.colors.background};
  }
`

const NoIconResults = styled.div`
  grid-column: 1 / -1;
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  padding: ${props => props.theme.spacing.sm} 0;
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
  { name: 'Leaf', value: '#6CC47C' },
  { name: 'Lime', value: '#84CC16' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Coral', value: '#FF6B6B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Rose', value: '#E11D48' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Fuchsia', value: '#D946EF' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Violet', value: '#7C3AED' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Sky', value: '#0EA5E9' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Slate', value: '#64748B' },
  { name: 'Graphite', value: '#374151' }
]

const iconGroups = [
  {
    id: 'essentials',
    name: 'Essentials',
    icons: [
      { icon: '✓', label: 'Check', tags: ['done', 'complete'] },
      { icon: '⭐', label: 'Star', tags: ['favorite', 'priority'] },
      { icon: '🎯', label: 'Target', tags: ['goal', 'focus'] },
      { icon: '🔥', label: 'Fire', tags: ['streak', 'energy'] },
      { icon: '⏰', label: 'Alarm', tags: ['time', 'routine'] },
      { icon: '📅', label: 'Calendar', tags: ['schedule', 'date'] },
      { icon: '📌', label: 'Pin', tags: ['remember', 'important'] },
      { icon: '🏆', label: 'Trophy', tags: ['win', 'achievement'] },
      { icon: '💎', label: 'Diamond', tags: ['quality', 'premium'] },
      { icon: '🚀', label: 'Rocket', tags: ['launch', 'progress'] },
      { icon: '⚡', label: 'Lightning', tags: ['fast', 'energy'] },
      { icon: '🔁', label: 'Repeat', tags: ['recurring', 'loop'] }
    ]
  },
  {
    id: 'health',
    name: 'Health',
    icons: [
      { icon: '💪', label: 'Strength', tags: ['fitness', 'workout'] },
      { icon: '🏃', label: 'Running', tags: ['run', 'cardio'] },
      { icon: '🚶', label: 'Walking', tags: ['walk', 'steps'] },
      { icon: '🚴', label: 'Cycling', tags: ['bike', 'cardio'] },
      { icon: '🏊', label: 'Swimming', tags: ['swim', 'sport'] },
      { icon: '🏋️', label: 'Weightlifting', tags: ['gym', 'lift'] },
      { icon: '🤸', label: 'Stretching', tags: ['mobility', 'movement'] },
      { icon: '🧘', label: 'Meditation', tags: ['mindfulness', 'calm'] },
      { icon: '🧠', label: 'Brain', tags: ['mental', 'focus'] },
      { icon: '❤️', label: 'Heart', tags: ['health', 'love'] },
      { icon: '🩺', label: 'Checkup', tags: ['doctor', 'health'] },
      { icon: '💊', label: 'Medicine', tags: ['medication', 'pill'] },
      { icon: '🦷', label: 'Teeth', tags: ['dental', 'brush'] },
      { icon: '🧼', label: 'Soap', tags: ['wash', 'clean'] },
      { icon: '🧴', label: 'Skincare', tags: ['care', 'lotion'] },
      { icon: '🛌', label: 'Bed', tags: ['sleep', 'rest'] },
      { icon: '💤', label: 'Sleep', tags: ['rest', 'bed'] },
      { icon: '🌞', label: 'Sun', tags: ['morning', 'daylight'] },
      { icon: '🌙', label: 'Moon', tags: ['night', 'evening'] },
      { icon: '⚖️', label: 'Balance', tags: ['weight', 'measure'] }
    ]
  },
  {
    id: 'food',
    name: 'Food',
    icons: [
      { icon: '💧', label: 'Water', tags: ['hydrate', 'drink'] },
      { icon: '☕', label: 'Coffee', tags: ['caffeine', 'drink'] },
      { icon: '🍵', label: 'Tea', tags: ['drink', 'calm'] },
      { icon: '🥤', label: 'Drink', tags: ['beverage', 'water'] },
      { icon: '🍎', label: 'Apple', tags: ['fruit', 'healthy'] },
      { icon: '🍌', label: 'Banana', tags: ['fruit', 'snack'] },
      { icon: '🍓', label: 'Strawberry', tags: ['fruit', 'snack'] },
      { icon: '🥑', label: 'Avocado', tags: ['healthy', 'food'] },
      { icon: '🥗', label: 'Salad', tags: ['healthy', 'meal'] },
      { icon: '🥦', label: 'Broccoli', tags: ['vegetables', 'food'] },
      { icon: '🥕', label: 'Carrot', tags: ['vegetables', 'food'] },
      { icon: '🥚', label: 'Egg', tags: ['protein', 'food'] },
      { icon: '🍞', label: 'Bread', tags: ['meal', 'food'] },
      { icon: '🍚', label: 'Rice', tags: ['meal', 'food'] },
      { icon: '🍽️', label: 'Meal', tags: ['plate', 'food'] },
      { icon: '🧃', label: 'Juice', tags: ['drink', 'beverage'] }
    ]
  },
  {
    id: 'learning',
    name: 'Learning',
    icons: [
      { icon: '📚', label: 'Books', tags: ['read', 'study'] },
      { icon: '📖', label: 'Reading', tags: ['book', 'learn'] },
      { icon: '✍️', label: 'Writing', tags: ['journal', 'notes'] },
      { icon: '📝', label: 'Notes', tags: ['write', 'todo'] },
      { icon: '📓', label: 'Notebook', tags: ['journal', 'study'] },
      { icon: '🧮', label: 'Abacus', tags: ['math', 'practice'] },
      { icon: '🔬', label: 'Science', tags: ['lab', 'study'] },
      { icon: '🔭', label: 'Astronomy', tags: ['science', 'space'] },
      { icon: '💻', label: 'Laptop', tags: ['code', 'work'] },
      { icon: '⌨️', label: 'Keyboard', tags: ['typing', 'code'] },
      { icon: '🧑‍💻', label: 'Coding', tags: ['developer', 'programming'] },
      { icon: '🗣️', label: 'Speaking', tags: ['language', 'practice'] },
      { icon: '🎧', label: 'Listening', tags: ['audio', 'language'] },
      { icon: '🧩', label: 'Puzzle', tags: ['thinking', 'problem'] },
      { icon: '💡', label: 'Idea', tags: ['learn', 'insight'] },
      { icon: '🧪', label: 'Experiment', tags: ['test', 'science'] }
    ]
  },
  {
    id: 'work',
    name: 'Work',
    icons: [
      { icon: '📋', label: 'Clipboard', tags: ['plan', 'tasks'] },
      { icon: '✅', label: 'Checklist', tags: ['todo', 'done'] },
      { icon: '📈', label: 'Growth Chart', tags: ['progress', 'stats'] },
      { icon: '📊', label: 'Bar Chart', tags: ['metrics', 'stats'] },
      { icon: '📁', label: 'Folder', tags: ['organize', 'files'] },
      { icon: '📬', label: 'Inbox', tags: ['email', 'messages'] },
      { icon: '📞', label: 'Call', tags: ['phone', 'contact'] },
      { icon: '💬', label: 'Message', tags: ['chat', 'communication'] },
      { icon: '🤝', label: 'Handshake', tags: ['meeting', 'agreement'] },
      { icon: '🧾', label: 'Receipt', tags: ['admin', 'finance'] },
      { icon: '💰', label: 'Money', tags: ['budget', 'finance'] },
      { icon: '🏦', label: 'Bank', tags: ['finance', 'money'] },
      { icon: '🧹', label: 'Clean Up', tags: ['tidy', 'organize'] },
      { icon: '🗂️', label: 'Files', tags: ['archive', 'organize'] },
      { icon: '🔒', label: 'Lock', tags: ['security', 'privacy'] },
      { icon: '🛠️', label: 'Tools', tags: ['repair', 'maintenance'] }
    ]
  },
  {
    id: 'home',
    name: 'Home',
    icons: [
      { icon: '🏠', label: 'Home', tags: ['house', 'routine'] },
      { icon: '🛏️', label: 'Bedroom', tags: ['bed', 'sleep'] },
      { icon: '🧺', label: 'Laundry', tags: ['clothes', 'wash'] },
      { icon: '🧽', label: 'Sponge', tags: ['clean', 'chores'] },
      { icon: '🪥', label: 'Toothbrush', tags: ['brush', 'teeth'] },
      { icon: '🚿', label: 'Shower', tags: ['wash', 'bathroom'] },
      { icon: '🪴', label: 'Plant', tags: ['garden', 'water'] },
      { icon: '🌱', label: 'Seedling', tags: ['grow', 'plant'] },
      { icon: '🌿', label: 'Herb', tags: ['plant', 'garden'] },
      { icon: '🛒', label: 'Shopping Cart', tags: ['groceries', 'errands'] },
      { icon: '🧑‍🍳', label: 'Cooking', tags: ['cook', 'meal'] },
      { icon: '🔑', label: 'Key', tags: ['home', 'security'] },
      { icon: '🧯', label: 'Safety', tags: ['fire', 'home'] },
      { icon: '🚗', label: 'Car', tags: ['drive', 'commute'] },
      { icon: '🚌', label: 'Transit', tags: ['bus', 'commute'] }
    ]
  },
  {
    id: 'creative',
    name: 'Creative',
    icons: [
      { icon: '🎨', label: 'Palette', tags: ['art', 'paint'] },
      { icon: '✏️', label: 'Pencil', tags: ['draw', 'sketch'] },
      { icon: '🖌️', label: 'Brush', tags: ['paint', 'art'] },
      { icon: '🎵', label: 'Music', tags: ['song', 'practice'] },
      { icon: '🎸', label: 'Guitar', tags: ['music', 'instrument'] },
      { icon: '🎹', label: 'Piano', tags: ['music', 'instrument'] },
      { icon: '🎤', label: 'Singing', tags: ['voice', 'music'] },
      { icon: '📷', label: 'Camera', tags: ['photo', 'creative'] },
      { icon: '🎥', label: 'Video', tags: ['film', 'camera'] },
      { icon: '🎬', label: 'Clapperboard', tags: ['film', 'video'] },
      { icon: '🧵', label: 'Sewing', tags: ['craft', 'thread'] },
      { icon: '🧶', label: 'Yarn', tags: ['knit', 'craft'] },
      { icon: '🎲', label: 'Dice', tags: ['game', 'play'] },
      { icon: '♟️', label: 'Chess', tags: ['strategy', 'game'] },
      { icon: '🎮', label: 'Game', tags: ['play', 'controller'] },
      { icon: '🎭', label: 'Theater', tags: ['acting', 'creative'] }
    ]
  },
  {
    id: 'social',
    name: 'Social',
    icons: [
      { icon: '👥', label: 'People', tags: ['social', 'group'] },
      { icon: '👨‍👩‍👧', label: 'Family', tags: ['home', 'people'] },
      { icon: '💌', label: 'Letter', tags: ['message', 'kindness'] },
      { icon: '🎁', label: 'Gift', tags: ['giving', 'birthday'] },
      { icon: '🙏', label: 'Gratitude', tags: ['thanks', 'reflect'] },
      { icon: '😊', label: 'Smile', tags: ['mood', 'happy'] },
      { icon: '🌈', label: 'Rainbow', tags: ['joy', 'mood'] },
      { icon: '🌍', label: 'World', tags: ['community', 'travel'] },
      { icon: '🕯️', label: 'Candle', tags: ['reflect', 'calm'] },
      { icon: '☮️', label: 'Peace', tags: ['calm', 'mindful'] },
      { icon: '💐', label: 'Flowers', tags: ['gift', 'kindness'] },
      { icon: '🎉', label: 'Celebration', tags: ['party', 'milestone'] }
    ]
  }
]

const allIconOptions = Array.from(
  new Map(iconGroups.flatMap(group => group.icons).map(option => [option.icon, option])).values()
)

const iconGroupTabs = [
  { id: 'all', name: 'All' },
  ...iconGroups.map(group => ({ id: group.id, name: group.name }))
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
    type: 'binary',
    dailyTarget: '',
    frequency: 'daily',
    daysPerWeek: 3,
    selectedDays: [false, false, false, false, false, false, false],
    color: '#6CC47C',
    icon: '✓',
    category: 'other',
    reminders: []
  })
  const [activeIconGroup, setActiveIconGroup] = useState('all')
  const [iconSearchTerm, setIconSearchTerm] = useState('')

  const visibleColorOptions = useMemo(() => {
    const hasSelectedColor = colorOptions.some(option => option.value === formData.color)
    if (hasSelectedColor || !formData.color) {
      return colorOptions
    }

    return [
      { name: 'Current', value: formData.color },
      ...colorOptions
    ]
  }, [formData.color])

  const visibleIconOptions = useMemo(() => {
    const source = activeIconGroup === 'all'
      ? allIconOptions
      : iconGroups.find(group => group.id === activeIconGroup)?.icons || allIconOptions
    const normalizedTerm = iconSearchTerm.trim().toLowerCase()
    const filteredOptions = normalizedTerm
      ? source.filter(option => {
          const haystack = [
            option.icon,
            option.label,
            ...(option.tags || [])
          ].join(' ').toLowerCase()
          return haystack.includes(normalizedTerm)
        })
      : source

    const selectedIconIsAvailable = allIconOptions.some(option => option.icon === formData.icon)
    if (selectedIconIsAvailable || !formData.icon || activeIconGroup !== 'all' || normalizedTerm) {
      return filteredOptions
    }

    return [
      { icon: formData.icon, label: 'Current icon', tags: ['current'] },
      ...filteredOptions
    ]
  }, [activeIconGroup, formData.icon, iconSearchTerm])

  useEffect(() => {
    if (isEditing && id) {
      const habit = getHabitById(id)
      if (habit) {
        setFormData({
          name: habit.name,
          description: habit.description || '',
          type: habit.type || 'binary',
          dailyTarget: habit.dailyTarget != null ? String(habit.dailyTarget) : '',
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
      dailyTarget: formData.type === 'count' && formData.dailyTarget !== ''
        ? Number(formData.dailyTarget)
        : null,
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
          <SectionTitle>Tracking Type</SectionTitle>
          <FormCard elevated>
            <FrequencyOptions>
              <FrequencyOption
                $selected={formData.type === 'binary'}
                onClick={() => handleInputChange('type', 'binary')}
              >
                <RadioInput
                  type="radio"
                  name="type"
                  checked={formData.type === 'binary'}
                  onChange={() => handleInputChange('type', 'binary')}
                />
                <FrequencyInfo>
                  <FrequencyTitle>Yes / No</FrequencyTitle>
                  <FrequencyDescription>Mark done once per day</FrequencyDescription>
                </FrequencyInfo>
              </FrequencyOption>

              <FrequencyOption
                $selected={formData.type === 'count'}
                onClick={() => handleInputChange('type', 'count')}
              >
                <RadioInput
                  type="radio"
                  name="type"
                  checked={formData.type === 'count'}
                  onChange={() => handleInputChange('type', 'count')}
                />
                <FrequencyInfo>
                  <FrequencyTitle>Count</FrequencyTitle>
                  <FrequencyDescription>Log how many times per day (e.g. how often you say “love you”)</FrequencyDescription>
                </FrequencyInfo>
              </FrequencyOption>
            </FrequencyOptions>

            {formData.type === 'count' && (
              <FormGroup style={{ marginTop: '16px', marginBottom: 0 }}>
                <Label>Daily Goal (Optional)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 3 times per day"
                  value={formData.dailyTarget}
                  onChange={(value) => handleInputChange('dailyTarget', value)}
                  min={1}
                />
              </FormGroup>
            )}
          </FormCard>
        </FormSection>

        <FormSection>
          <SectionTitle>Category</SectionTitle>
          <FormCard elevated>
            <CategorySelector
              selectedCategory={formData.category}
              onCategoryChange={handleCategoryChange}
              showLabel={false}
            />
          </FormCard>
        </FormSection>

        <FormSection>
          <SectionTitle>Frequency</SectionTitle>
          <FormCard elevated>
            <FrequencyOptions>
              <FrequencyOption
                $selected={formData.frequency === 'daily'}
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
                $selected={formData.frequency === 'weekly'}
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
                $selected={formData.frequency === 'custom'}
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
                      $selected={formData.selectedDays[index]}
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
                {visibleColorOptions.map((color) => (
                  <ColorOption
                    key={color.value}
                    type="button"
                    $color={color.value}
                    $selected={formData.color === color.value}
                    onClick={() => handleColorSelect(color.value)}
                    aria-label={`Select color ${color.name}`}
                    aria-pressed={formData.color === color.value}
                  />
                ))}
              </ColorGrid>
            </FormGroup>
            
            <FormGroup>
              <Label>Icon</Label>
              <IconPickerControls>
                <IconSearch
                  type="search"
                  placeholder="Search icons"
                  value={iconSearchTerm}
                  onChange={(event) => setIconSearchTerm(event.target.value)}
                  aria-label="Search icons"
                />
                <IconGroupTabs role="tablist" aria-label="Icon groups">
                  {iconGroupTabs.map((group) => (
                    <IconGroupTab
                      key={group.id}
                      type="button"
                      role="tab"
                      $selected={activeIconGroup === group.id}
                      aria-selected={activeIconGroup === group.id}
                      onClick={() => setActiveIconGroup(group.id)}
                    >
                      {group.name}
                    </IconGroupTab>
                  ))}
                </IconGroupTabs>
              </IconPickerControls>
              <IconGrid>
                {visibleIconOptions.length > 0 ? (
                  visibleIconOptions.map((icon) => (
                    <IconOption
                      key={icon.icon}
                      type="button"
                      $selected={formData.icon === icon.icon}
                      onClick={() => handleIconSelect(icon.icon)}
                      aria-label={`Select icon ${icon.label}`}
                      aria-pressed={formData.icon === icon.icon}
                      title={icon.label}
                    >
                      {icon.icon}
                    </IconOption>
                  ))
                ) : (
                  <NoIconResults>No matching icons</NoIconResults>
                )}
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
