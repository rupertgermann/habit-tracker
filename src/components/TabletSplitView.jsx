import React, { useState } from 'react'
import styled from 'styled-components'
import { useNavigate, useLocation } from 'react-router-dom'
import HabitsList from '../screens/HabitsList'
import HabitDetail from '../screens/HabitDetail'
import { useHabits } from '../context/HabitsContext'
import AppIcon from './AppIcon'

const SplitViewContainer = styled.div`
  display: flex;
  height: calc(100vh - 64px);
  overflow: hidden;
`

const ListPanel = styled.div`
  width: 40%;
  border-right: 1px solid ${props => props.theme.colors.border};
  overflow-y: auto;
  height: 100%;
`

const DetailPanel = styled.div`
  width: 60%;
  overflow-y: auto;
  height: 100%;
  background-color: ${props => props.theme.colors.background};
`

const EmptyDetailPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: ${props => props.theme.spacing.xxl};
  text-align: center;
`

const EmptyIcon = styled.div`
  display: flex;
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.lg};
  opacity: 0.5;
`

const EmptyTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.headingMedium};
  margin-bottom: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.secondary};
`

const EmptyText = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  max-width: 300px;
`

const TabletSplitView = () => {
  const navigate = useNavigate()
  const location = useLocation()
  useHabits()
  const [selectedHabitId, setSelectedHabitId] = useState(null)

  // Check if we're currently viewing a habit detail
  const isViewingHabit = location.pathname.startsWith('/habit/')
  
  // Extract habit ID from URL if viewing a habit
  React.useEffect(() => {
    if (isViewingHabit) {
      const habitId = location.pathname.split('/habit/')[1]
      setSelectedHabitId(habitId)
    } else {
      setSelectedHabitId(null)
    }
  }, [location.pathname, isViewingHabit])

  const handleHabitSelect = (habitId) => {
    setSelectedHabitId(habitId)
    navigate(`/habit/${habitId}`)
  }

  return (
    <SplitViewContainer>
      <ListPanel>
        <HabitsList 
          onHabitSelect={handleHabitSelect}
          selectedHabitId={selectedHabitId}
          isTabletView={true}
        />
      </ListPanel>
      <DetailPanel>
        {selectedHabitId ? (
          <HabitDetail />
        ) : (
          <EmptyDetailPanel>
            <EmptyIcon>
              <AppIcon name="clipboard" size={64} />
            </EmptyIcon>
            <EmptyTitle>Select a Habit</EmptyTitle>
            <EmptyText>
              Choose a habit from the list to view its details, progress, and statistics.
            </EmptyText>
          </EmptyDetailPanel>
        )}
      </DetailPanel>
    </SplitViewContainer>
  )
}

export default TabletSplitView
