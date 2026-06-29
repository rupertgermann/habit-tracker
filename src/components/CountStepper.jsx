import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { useHabits } from '../context/HabitsContext'
import { useToast } from '../context/ToastContext'
import { getCountForDate, toDateKey } from '../domain/habitTracking'
import AppIcon from './AppIcon'

const StepperWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  flex-shrink: 0;
`

const StepButton = styled(motion.button)`
  width: 32px;
  height: 32px;
  border-radius: ${props => props.theme.borderRadius.round};
  border: 2px solid ${props => props.theme.colors.primary};
  background-color: ${props => props.$variant === 'plus' ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.$variant === 'plus' ? props.theme.colors.white : props.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const CountValue = styled.div`
  min-width: 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const CountNumber = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodyLarge};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text.primary};
`

const CountTarget = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
`

const CountStepper = ({ habit, onChange }) => {
  const { incrementCompletion, decrementCompletion } = useHabits()
  const { showSuccessToast } = useToast()

  const today = toDateKey()
  const count = getCountForDate(habit, today)
  const target = habit.dailyTarget

  const handleIncrement = (e) => {
    e.stopPropagation()
    incrementCompletion(habit.id)
    const next = count + 1
    if (target && next === target) {
      showSuccessToast(`Daily goal reached for "${habit.name}"!`)
    } else {
      showSuccessToast(`"${habit.name}" logged - ${next} today`)
    }
    if (onChange) onChange(next)
  }

  const handleDecrement = (e) => {
    e.stopPropagation()
    if (count === 0) return
    decrementCompletion(habit.id)
    if (onChange) onChange(count - 1)
  }

  return (
    <StepperWrapper onClick={(e) => e.stopPropagation()}>
      <StepButton
        type="button"
        $variant="minus"
        onClick={handleDecrement}
        disabled={count === 0}
        whileHover={{ scale: count === 0 ? 1 : 1.1 }}
        whileTap={{ scale: count === 0 ? 1 : 0.9 }}
        aria-label={`Remove one from ${habit.name}`}
      >
        <AppIcon name="minus" size={18} stroke={3} />
      </StepButton>
      <CountValue>
        <CountNumber>{count}</CountNumber>
        {target ? <CountTarget>/ {target}</CountTarget> : null}
      </CountValue>
      <StepButton
        type="button"
        $variant="plus"
        onClick={handleIncrement}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label={`Add one to ${habit.name}`}
      >
        <AppIcon name="plus" size={18} stroke={3} />
      </StepButton>
    </StepperWrapper>
  )
}

export default CountStepper
