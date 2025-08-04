import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const NavContainer = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background-color: ${props => props.theme.colors.white};
  box-shadow: ${props => props.theme.shadows.medium};
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: env(safe-area-inset-bottom, 0);
  z-index: 100;
`

const NavItem = styled(motion.button)`
  background: none;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  cursor: pointer;
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.small};
  transition: all 0.2s ease;
  min-width: 60px;
  
  ${({ active, theme }) =>
    active
      ? `
          color: ${theme.colors.primary};
        `
      : `
          color: ${theme.colors.text.secondary};
        `}
  
  &:hover {
    background-color: ${props => props.theme.colors.background};
  }
  
  &:focus {
    outline: 2px solid ${props => props.theme.colors.primary};
    outline-offset: 2px;
  }
`

const NavIcon = styled.div`
  font-size: 24px;
  line-height: 1;
`

const NavLabel = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  line-height: 1;
`

const navItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    path: '/'
  },
  {
    id: 'habits',
    label: 'Habits',
    icon: '✓',
    path: '/habits'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: '📅',
    path: '/calendar'
  },
  {
    id: 'journal',
    label: 'Journal',
    icon: '📔',
    path: '/journal'
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: '📈',
    path: '/progress'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    path: '/settings'
  }
]

const BottomNavigation = ({ activeTab, onTabChange }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleTabClick = (item) => {
    onTabChange(item.id)
    navigate(item.path)
  }

  // Determine active tab based on current path
  const getActiveTab = () => {
    const currentPath = location.pathname
    const activeItem = navItems.find(item => item.path === currentPath)
    return activeItem ? activeItem.id : activeTab
  }

  const currentActiveTab = getActiveTab()

  return (
    <NavContainer>
      {navItems.map((item) => (
        <NavItem
          key={item.id}
          active={currentActiveTab === item.id}
          onClick={() => handleTabClick(item)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={item.label}
        >
          <NavIcon>{item.icon}</NavIcon>
          <NavLabel>{item.label}</NavLabel>
        </NavItem>
      ))}
    </NavContainer>
  )
}

export default BottomNavigation