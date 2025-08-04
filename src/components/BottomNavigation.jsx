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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.xs};
  background: none;
  border: none;
  cursor: pointer;
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.small};
  min-width: 60px;
  transition: all 0.2s ease;
  
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
`

const NavIcon = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
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
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    path: '/'
  },
  {
    id: 'habits',
    label: 'Habits',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
    path: '/habits'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    path: '/calendar'
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    path: '/progress'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
        <path d="M20.5 7.5L16 12l4.5 4.5M3.5 7.5L8 12l-4.5 4.5" />
      </svg>
    ),
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
    return activeItem ? activeItem.id : 'dashboard'
  }

  const currentActiveTab = activeTab || getActiveTab()

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
          <NavIcon>
            {React.cloneElement(item.icon, {
              strokeWidth: currentActiveTab === item.id ? 2.5 : 2
            })}
          </NavIcon>
          <NavLabel>{item.label}</NavLabel>
        </NavItem>
      ))}
    </NavContainer>
  )
}

export default BottomNavigation