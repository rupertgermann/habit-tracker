import React from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { useNavigation } from '../context/NavigationContext'
import AppIcon from './AppIcon'

const NavContainer = styled.nav`
  position: fixed;
  left: 10px;
  right: 10px;
  bottom: calc(10px + env(safe-area-inset-bottom, 0px));
  z-index: 100;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  min-height: 68px;
  padding: 5px;
  background: ${props => props.theme.colors.text.primary};
  color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.text.primary};
  box-shadow: ${props => props.theme.shadows.strong};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    inset: 0 auto 0 0;
    width: 112px;
    min-height: 100vh;
    grid-template-columns: 1fr;
    grid-template-rows: 112px repeat(6, minmax(72px, 1fr)) 72px;
    gap: 2px;
    padding: 0 10px 16px;
    border: 0;
    border-right: 1px solid ${props => props.theme.colors.border};
    box-shadow: none;
  }
`

const BrandMark = styled.div`
  display: none;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: ${props => props.theme.colors.background};
    border-bottom: 1px solid ${props => props.theme.colors.background}33;
  }
`

const BrandMonogram = styled.span`
  font-family: ${props => props.theme.typography.displayFamily};
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.08em;
`

const BrandCaption = styled.span`
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: 0.56rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
`

const NavItem = styled(motion.button)`
  position: relative;
  min-width: 0;
  min-height: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 6px 2px;
  background: ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.$active ? props.theme.colors.onPrimary : props.theme.colors.background};
  transition:
    background var(--duration-fast) ease,
    color var(--duration-fast) ease,
    transform var(--duration-fast) var(--ease-out);

  &::before {
    content: '';
    position: absolute;
    inset: 4px;
    border: 1px solid currentColor;
    opacity: ${props => props.$active ? 0.42 : 0};
    pointer-events: none;
  }

  &:hover:not(:disabled) {
    background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.surfaceAlt};
    color: ${props => props.$active ? props.theme.colors.onPrimary : '#201D18'};
  }

  &:active:not(:disabled) {
    transform: translateY(2px);
  }

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    min-height: 72px;
    width: 100%;
    padding: 8px 4px;

    &::after {
      content: '';
      position: absolute;
      right: -10px;
      top: 18%;
      bottom: 18%;
      width: 4px;
      background: ${props => props.$active ? props.theme.colors.secondary : 'transparent'};
    }
  }
`

const NavIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
`

const NavLabel = styled.span`
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.035em;
  line-height: 1;
  text-transform: uppercase;

  @media (max-width: 370px) {
    display: none;
  }
`

const navItems = [
  { id: 'dashboard', label: 'Today', icon: 'chart-bar', path: '/' },
  { id: 'habits', label: 'Habits', icon: 'checkbox', path: '/habits' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar', path: '/calendar' },
  { id: 'journal', label: 'Journal', icon: 'notebook', path: '/journal' },
  { id: 'progress', label: 'Progress', icon: 'chart-line', path: '/progress' },
  { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' }
]

const BottomNavigation = () => {
  const navigate = useNavigate()
  const { activeTab, setActiveTab } = useNavigation()

  const handleTabClick = item => {
    setActiveTab(item.id)
    navigate(item.path)
  }

  return (
    <NavContainer aria-label="Primary navigation">
      <BrandMark aria-hidden="true">
        <BrandMonogram>R/7</BrandMonogram>
        <BrandCaption>Rhythm log</BrandCaption>
      </BrandMark>
      {navItems.map(item => {
        const isActive = activeTab === item.id
        return (
          <NavItem
            key={item.id}
            $active={isActive}
            onClick={() => handleTabClick(item)}
            aria-label={item.label === 'Today' ? 'Dashboard' : item.label}
            aria-current={isActive ? 'page' : undefined}
            whileTap={{ scale: 0.96 }}
          >
            <NavIcon aria-hidden="true">
              <AppIcon name={item.icon} size={22} stroke={1.8} />
            </NavIcon>
            <NavLabel>{item.label}</NavLabel>
          </NavItem>
        )
      })}
    </NavContainer>
  )
}

export default BottomNavigation
