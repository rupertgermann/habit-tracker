import React from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { useNavigation } from '../context/NavigationContext'
import AppIcon from './AppIcon'

const NavContainer = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background-color: ${props => props.theme.colors.white};
  box-shadow: ${props => props.theme.shadows.medium};
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  align-items: center;
  gap: 0;
  padding: 0 ${props => props.theme.spacing.xs};
  padding-bottom: env(safe-area-inset-bottom, 0);
  z-index: 100;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    top: 0;
    bottom: auto;
    height: 64px;
    display: flex;
    justify-content: center;
    gap: ${props => props.theme.spacing.sm};
    padding: 0 ${props => props.theme.spacing.lg};
    border-bottom: 1px solid ${props => props.theme.colors.border};
  }
`

const NavItem = styled(motion.button)`
  background: none;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  cursor: pointer;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.small};
  transition: all 0.2s ease;
  min-width: 0;
  width: 100%;
  
  ${({ $active, theme }) =>
    $active
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

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    width: auto;
    min-width: 92px;
    flex-direction: row;
    justify-content: center;
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  }
`

const NavIcon = styled.div`
  width: 24px;
  height: 24px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`

const NavLabel = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  line-height: 1;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 360px) {
    display: none;
  }
`

const navItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'chart-bar',
    path: '/'
  },
  {
    id: 'habits',
    label: 'Habits',
    icon: 'checkbox',
    path: '/habits'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: 'calendar',
    path: '/calendar'
  },
  {
    id: 'journal',
    label: 'Journal',
    icon: 'notebook',
    path: '/journal'
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: 'chart-line',
    path: '/progress'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    path: '/settings'
  }
]

const BottomNavigation = () => {
  const navigate = useNavigate()
  const { activeTab, setActiveTab } = useNavigation()

  const handleTabClick = (item) => {
    setActiveTab(item.id)
    navigate(item.path)
  }

  return (
    <NavContainer aria-label="Primary navigation">
      {navItems.map((item) => (
        <NavItem
          key={item.id}
          $active={activeTab === item.id}
          onClick={() => handleTabClick(item)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={item.label}
        >
          <NavIcon>
            <AppIcon name={item.icon} size={24} />
          </NavIcon>
          <NavLabel>{item.label}</NavLabel>
        </NavItem>
      ))}
    </NavContainer>
  )
}

export default BottomNavigation
