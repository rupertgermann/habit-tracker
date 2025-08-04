import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import Card from '../components/Card'
import Button from '../components/Button'
import { useHabits } from '../context/HabitsContext'

const HabitsListContainer = styled.div`
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
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`

const FilterTab = styled.button`
  background: none;
  border: none;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.text.secondary};
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
    transform: scaleX(${props => props.active ? 1 : 0});
    transition: transform 0.2s ease;
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
  background-color: ${props => props.color || props.theme.colors.primary}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.color || props.theme.colors.primary};
  font-size: 24px;
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

const CheckButton = styled(motion.button)`
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.round};
  border: 2px solid ${props => props.checked ? props.theme.colors.primary : props.theme.colors.border};
  background-color: ${props => props.checked ? props.theme.colors.primary : 'transparent'};
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

const CheckIcon = styled.svg`
  width: 20px;
  height: 20px;
  stroke: ${props => props.theme.colors.white};
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
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

const FloatingActionButton = styled(motion.button)`
  position: fixed;
  bottom: 100px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: ${props => props.theme.borderRadius.round};
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.white};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: ${props => props.theme.shadows.medium};
  z-index: 50;
  
  &:hover {
    background-color: #5CAD6C;
  }
`

const PlusIcon = styled.svg`
  width: 24px;
  height: 24px;
  stroke: ${props => props.theme.colors.white};
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
`

const HabitsList = () => {
  const navigate = useNavigate()
  const { habits, toggleHabitCompletion, getTodayHabits } = useHabits()
  const [filter, setFilter] = useState('all')
  const [filteredHabits, setFilteredHabits] = useState([])
  const [todayHabits, setTodayHabits] = useState([])

  useEffect(() => {
    setTodayHabits(getTodayHabits())
  }, [getTodayHabits])

  useEffect(() => {
    let filtered = [...habits]
    
    if (filter === 'active') {
      filtered = filtered.filter(habit => !habit.isArchived)
    } else if (filter === 'completed') {
      const today = new Date().toISOString().split('T')[0]
      filtered = filtered.filter(habit => 
        habit.completions.some(completion => completion.date === today)
      )
    }
    
    setFilteredHabits(filtered)
  }, [habits, filter])

  const handleToggleHabit = (habitId, e) => {
    e.stopPropagation()
    toggleHabitCompletion(habitId)
    setTodayHabits(getTodayHabits())
  }

  const getHabitStatus = (habit) => {
    const todayHabit = todayHabits.find(h => h.id === habit.id)
    return todayHabit ? todayHabit.isCompleted : false
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
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          All ({habits.length})
        </FilterTab>
        <FilterTab
          active={filter === 'active'}
          onClick={() => setFilter('active')}
        >
          Active ({habits.filter(h => !h.isArchived).length})
        </FilterTab>
        <FilterTab
          active={filter === 'completed'}
          onClick={() => setFilter('completed')}
        >
          Completed ({todayHabits.filter(h => h.isCompleted).length})
        </FilterTab>
      </FilterTabs>

      {filteredHabits.length === 0 ? (
        <EmptyState>
          <EmptyStateIcon>📋</EmptyStateIcon>
          <EmptyStateTitle>No habits found</EmptyStateTitle>
          <EmptyStateText>
            {filter === 'all' 
              ? "Start building better habits by creating your first one."
              : filter === 'active'
              ? "All your habits are archived."
              : "No habits completed today yet."
            }
          </EmptyStateText>
          {filter === 'all' && (
            <Button onClick={() => navigate('/add-habit')}>
              Create Your First Habit
            </Button>
          )}
        </EmptyState>
      ) : (
        <HabitsGrid>
          {filteredHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              clickable
              onClick={() => navigate(`/habit/${habit.id}`)}
              elevated
            >
              <HabitInfo>
                <HabitIcon color={habit.color}>
                  {habit.icon || '✓'}
                </HabitIcon>
                <HabitDetails>
                  <HabitName>{habit.name}</HabitName>
                  <HabitMeta>
                    <HabitStreak>
                      🔥 {habit.streak || 0} days
                    </HabitStreak>
                    <HabitFrequency>
                      {getFrequencyText(habit)}
                    </HabitFrequency>
                  </HabitMeta>
                </HabitDetails>
              </HabitInfo>
              <CheckButton
                checked={getHabitStatus(habit)}
                onClick={(e) => handleToggleHabit(habit.id, e)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {getHabitStatus(habit) && (
                  <CheckIcon>
                    <polyline points="20 6 9 17 4 12" />
                  </CheckIcon>
                )}
              </CheckButton>
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
        <PlusIcon>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </PlusIcon>
      </FloatingActionButton>
    </HabitsListContainer>
  )
}

export default HabitsList