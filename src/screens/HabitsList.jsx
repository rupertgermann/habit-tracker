import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import Card from '../components/Card'
import Button from '../components/Button'
import Confetti from '../components/Confetti'
import CountStepper from '../components/CountStepper'
import EmptyState from '../components/EmptyState'
import AppIcon from '../components/AppIcon'
import { useHabits } from '../context/HabitsContext'
import { useToast } from '../context/ToastContext'
import { getHabitStreak, getTodayHabits } from '../domain/habitTracking'
import { DEFAULT_CATEGORY_ICON, DEFAULT_HABIT_ICON } from '../domain/iconCatalog'

const HabitsListContainer = styled.div`
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

const FilterTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`

const CategoryFilter = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.lg};
`

const CategoryChip = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  min-height: 40px;
  border-radius: ${props => props.theme.borderRadius.small};
  background: none;
  border: 1px solid ${props => props.theme.colors.border};
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
  line-height: ${props => props.theme.typography.lineHeight.tight};
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ $active, theme, $color }) =>
    $active &&
    `
      background-color: ${$color || theme.colors.primary}20;
      border-color: ${$color || theme.colors.primary};
      color: ${$color || theme.colors.primary};
      font-weight: ${theme.typography.fontWeight.medium};
    `}
  
  &:hover {
    border-color: ${props => props.$color || props.theme.colors.primary};
  }
`

const CategoryIconText = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  flex-shrink: 0;
`

const CategoryLabelText = styled.span`
  min-width: 0;
`

const FilterTab = styled.button`
  background: none;
  border: none;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.text.secondary};
  cursor: pointer;
  position: relative;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background-color: ${props => props.theme.colors.primary};
    transform: scaleX(${props => props.$active ? 1 : 0});
    transition: transform 0.2s ease;
  }


  @media (max-width: ${props => props.theme.breakpoints.narrow}) {
    flex: 1 1 0;
    min-width: 0;
    padding-right: ${props => props.theme.spacing.sm};
    padding-left: ${props => props.theme.spacing.sm};
  }
`

const HabitsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`

const HabitCard = styled(Card)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.lg};
  cursor: pointer;
  transition: all 0.2s ease;
  border: ${props => props.$selected ? `2px solid ${props.theme.colors.primary}` : 'none'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.medium};
  }
`

const HabitInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  flex: 1;
`

const HabitIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${props => props.theme.borderRadius.small};
  background-color: ${props => props.$color || props.theme.colors.primary}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$color || props.theme.colors.primary};
`

const HabitDetails = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`

const HabitName = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.bodyLarge};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  margin-bottom: ${props => props.theme.spacing.xs};
`

const HabitMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.md};
  align-items: center;
`

const HabitStreak = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`

const HabitFrequency = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
`

const CategoryBadge = styled.span`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: 0;
  color: ${props => props.$color || props.theme.colors.primary};
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`

const CheckButton = styled(motion.button)`
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.round};
  border: 2px solid ${props => props.$checked ? props.theme.colors.primary : props.theme.colors.border};
  background-color: ${props => props.$checked ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.theme.colors.onPrimary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  
  &:hover {
    transform: scale(1.1);
  }
`

const FloatingActionButton = styled(motion.button)`
  position: fixed;
  bottom: 100px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: ${props => props.theme.borderRadius.round};
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.onPrimary};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: ${props => props.theme.shadows.medium};
  z-index: 50;
  
  &:hover {
    background-color: ${props => props.theme.colors.primaryHover};
  }
`

const HabitsList = ({ onHabitSelect, selectedHabitId, isTabletView }) => {
  const navigate = useNavigate()
  const { habits, categories, toggleYesNoCompletion } = useHabits()
  const { showSuccessToast, showErrorToast } = useToast()
  const [filter, setFilter] = useState('all')
  const [filteredHabits, setFilteredHabits] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [todayHabits, setTodayHabits] = useState([])
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    setTodayHabits(getTodayHabits(habits))
  }, [habits])

  useEffect(() => {
    let filtered = [...habits]
    
    if (filter === 'active') {
      filtered = filtered.filter(habit => !habit.isArchived)
    } else if (filter === 'completed') {
      const completedIds = new Set(todayHabits.filter(habit => habit.isCompleted).map(habit => habit.id))
      filtered = filtered.filter(habit => completedIds.has(habit.id))
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(habit => habit.category === selectedCategory)
    }
    
    setFilteredHabits(filtered)
  }, [habits, filter, selectedCategory, todayHabits])

  const handleCategoryFilter = (id) => {
    setSelectedCategory(prev => (prev === id ? null : id))
  }

  const handleToggleHabit = async (habitId, e) => {
    e.stopPropagation()
    const habit = habits.find(h => h.id === habitId)
    const todayHabit = todayHabits.find(h => h.id === habitId)
    if (!habit || !todayHabit) return { ok: false }

    const isCompleting = !todayHabit?.isCompleted

    const result = await toggleYesNoCompletion(habitId)
    if (!result.ok) {
      showErrorToast(`Could not update "${habit.name}". Please try again.`)
      return result
    }
    
    if (isCompleting) {
      showSuccessToast(`Great job! "${habit.name}" completed!`)
      
      // Show confetti for milestone completions
      const completedCount = todayHabits.filter(h => h.id === habitId ? true : h.isCompleted).length
      if (completedCount % 5 === 0) {
        setShowConfetti(true)
      }
    }

    return result
  }

  const handleHabitClick = (habitId) => {
    if (isTabletView && onHabitSelect) {
      onHabitSelect(habitId)
    } else {
      navigate(`/habit/${habitId}`)
    }
  }

  const getHabitStatus = (habit) => {
    const todayHabit = todayHabits.find(h => h.id === habit.id)
    return todayHabit ? todayHabit.isCompleted : false
  }

  const getCategoryInfo = (categoryId) => {
    return categories.find(cat => cat.id === categoryId) || { id: 'other', name: 'Other', color: '#6B7280', icon: DEFAULT_CATEGORY_ICON }
  }

  const getFrequencyText = (habit) => {
    switch (habit.frequency) {
      case 'daily':
        return 'Daily'
      case 'weekly':
        return 'Weekly'
      case 'custom':
        return `${habit.daysPerWeek} days/week`
      default:
        return 'Daily'
    }
  }

  return (
    <HabitsListContainer>
      <Confetti run={showConfetti} onComplete={() => setShowConfetti(false)} />
      <Header>
        <Title>Habits</Title>
        <Button
          variant="ghost"
          onClick={() => navigate('/add-habit')}
        >
          Add New
        </Button>
      </Header>

      <FilterTabs>
        <FilterTab
          $active={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          All ({habits.length})
        </FilterTab>
        <FilterTab
          $active={filter === 'active'}
          onClick={() => setFilter('active')}
        >
          Active ({habits.filter(h => !h.isArchived).length})
        </FilterTab>
        <FilterTab
          $active={filter === 'completed'}
          onClick={() => setFilter('completed')}
        >
          Completed ({todayHabits.filter(h => h.isCompleted).length})
        </FilterTab>
      </FilterTabs>

      <CategoryFilter>
        <CategoryChip
          $active={!selectedCategory}
          onClick={() => setSelectedCategory(null)}
        >
          All Categories
        </CategoryChip>
        {categories.map((category) => (
          <CategoryChip
            key={category.id}
            $active={selectedCategory === category.id}
            $color={category.color}
            onClick={() => handleCategoryFilter(category.id)}
          >
            <CategoryIconText aria-hidden="true">
              <AppIcon name={category.icon} fallbackName={DEFAULT_CATEGORY_ICON} size={16} />
            </CategoryIconText>
            <CategoryLabelText>{category.name}</CategoryLabelText>
          </CategoryChip>
        ))}
      </CategoryFilter>

      {filteredHabits.length === 0 ? (
        <EmptyState
          type={filter === 'completed' ? 'progress' : 'habits'}
          title={filter === 'all' ? "No Habits Yet" :
                  filter === 'active' ? "No Active Habits" :
                  "No Habits Completed Today"}
          description={filter === 'all' ? "Start building better habits by creating your first one. Small steps lead to big changes!" :
                      filter === 'active' ? "All your habits are archived. Unarchive some habits to see them here." :
                      "No habits completed today yet. Keep going to build your streak!"}
          actionText={filter === 'all' ? "Create Your First Habit" :
                      filter === 'active' ? "View Archived Habits" :
                      "Go to Habits"}
          onAction={() => filter === 'all' ? navigate('/add-habit') :
                     filter === 'active' ? navigate('/habits') :
                     navigate('/habits')}
        />
      ) : (
        <HabitsGrid>
          {filteredHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              clickable
              onClick={() => handleHabitClick(habit.id)}
              elevated
              $selected={selectedHabitId === habit.id}
            >
              <HabitInfo>
                <HabitIcon $color={habit.color}>
                  <AppIcon name={habit.icon} fallbackName={DEFAULT_HABIT_ICON} size={24} />
                </HabitIcon>
                <HabitDetails>
                  <HabitName>{habit.name}</HabitName>
                  <HabitMeta>
                    <HabitStreak>
                      <AppIcon name="flame" size={14} /> {getHabitStreak(habit)} days
                    </HabitStreak>
                    <HabitFrequency>
                      {getFrequencyText(habit)}
                    </HabitFrequency>
                    <CategoryBadge $color={getCategoryInfo(habit.category).color}>
                      <CategoryIconText aria-hidden="true">
                        <AppIcon
                          name={getCategoryInfo(habit.category).icon}
                          fallbackName={DEFAULT_CATEGORY_ICON}
                          size={14}
                        />
                      </CategoryIconText>
                      <CategoryLabelText>
                        {getCategoryInfo(habit.category).name}
                      </CategoryLabelText>
                    </CategoryBadge>
                  </HabitMeta>
                </HabitDetails>
              </HabitInfo>
              {habit.type === 'count' ? (
                <CountStepper habit={habit} />
              ) : (
                <CheckButton
                  $checked={getHabitStatus(habit)}
                  onClick={(e) => handleToggleHabit(habit.id, e)}
                  aria-label={`${getHabitStatus(habit) ? 'Mark as incomplete' : 'Mark as complete'}: ${habit.name}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {getHabitStatus(habit) && (
                    <AppIcon name="check" size={20} stroke={3} />
                  )}
                </CheckButton>
              )}
            </HabitCard>
          ))}
        </HabitsGrid>
      )}

      <FloatingActionButton
        onClick={() => navigate('/add-habit')}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Add new habit"
      >
        <AppIcon name="plus" size={24} stroke={3} />
      </FloatingActionButton>
    </HabitsListContainer>
  )
}

export default HabitsList
