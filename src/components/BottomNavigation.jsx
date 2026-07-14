import React from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { useNavigation } from '../context/NavigationContext'
import AppIcon from './AppIcon'

const NavContainer = styled.nav`
  position: fixed;
  right: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  left: 12px;
  z-index: 100;
  min-height: 64px;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  align-items: center;
  padding: 6px;
  background: ${props => props.theme.colors.surface}F2;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 22px;
  box-shadow: ${props => props.theme.shadows.medium};
  backdrop-filter: blur(18px);

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    position: absolute;
    top: 0; right: 0; bottom: auto; left: 0;
    min-height: 88px;
    display: flex;
    gap: 8px;
    padding: 14px clamp(24px, 5vw, 72px);
    border: 0;
    border-bottom: 1px solid ${props => props.theme.colors.border};
    border-radius: 0;
    box-shadow: none;
  }
`

const Brand = styled.button`
  display: none;
  background: transparent;
  color: ${props => props.theme.colors.text.primary};
  text-align: left;
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    min-width: 210px;
    display: grid;
    margin-right: auto;
  }
`

const BrandName = styled.strong`
  font-family: ${props => props.theme.typography.displayFamily};
  font-size: 1.3rem;
  font-weight: 500;
  letter-spacing: -.035em;
`

const BrandLine = styled.span`
  color: ${props => props.theme.colors.text.secondary};
  font-size: .72rem;
  letter-spacing: .04em;
`

const NavItem = styled(motion.button)`
  min-width: 0;
  min-height: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 5px 2px;
  background: ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.$active ? props.theme.colors.onPrimary : props.theme.colors.text.secondary};
  border-radius: 16px;
  transition: background var(--duration-fast), color var(--duration-fast), transform var(--duration-fast);
  &:hover:not(:disabled) { background: ${props => props.$active ? props.theme.colors.primaryHover : props.theme.colors.surfaceAlt}; color: ${props => props.$active ? props.theme.colors.onPrimary : props.theme.colors.text.primary}; }
  &:active:not(:disabled) { transform: scale(.95); }
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    min-height: 48px;
    flex-direction: row;
    gap: 7px;
    padding: 0 12px;
    border-radius: 999px;
  }
`

const NavLabel = styled.span`
  max-width: 100%;
  overflow: hidden;
  font-size: clamp(.46rem, 2.3vw, .64rem);
  font-weight: 500;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
  @media (min-width: ${props => props.theme.breakpoints.tablet}) { font-size: .76rem; }
`

const navItems = [
  { id: 'dashboard', label: 'Today', icon: 'sun', path: '/' },
  { id: 'habits', label: 'Habits', icon: 'seedling', path: '/habits' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar', path: '/calendar' },
  { id: 'journal', label: 'Journal', icon: 'notebook', path: '/journal' },
  { id: 'progress', label: 'Progress', icon: 'chart-line', path: '/progress' },
  { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' }
]

const BottomNavigation = () => {
  const navigate = useNavigate()
  const { activeTab, setActiveTab } = useNavigation()
  const go = item => { setActiveTab(item.id); navigate(item.path) }
  return (
    <NavContainer aria-label="Primary navigation">
      <Brand type="button" onClick={() => go(navItems[0])} aria-label="Go to today">
        <BrandName>Still / daily</BrandName>
        <BrandLine>Small rituals, clearly noticed</BrandLine>
      </Brand>
      {navItems.map(item => (
        <NavItem key={item.id} type="button" $active={activeTab === item.id} onClick={() => go(item)} aria-label={item.label} aria-current={activeTab === item.id ? 'page' : undefined} whileTap={{ scale: .95 }}>
          <AppIcon name={item.icon} size={19} stroke={1.8} aria-hidden="true" />
          <NavLabel>{item.label}</NavLabel>
        </NavItem>
      ))}
    </NavContainer>
  )
}

export default BottomNavigation
