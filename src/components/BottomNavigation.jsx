import React from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { useNavigation } from '../context/NavigationContext'
import AppIcon from './AppIcon'

const NavContainer = styled.nav`
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 100;
  height: calc(76px + env(safe-area-inset-bottom, 0px));
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  align-items: stretch;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: ${props => props.theme.colors.surface};
  border-top: 2px solid ${props => props.theme.colors.borderStrong};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    top: 0;
    right: auto;
    bottom: 0;
    width: 184px;
    height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 0;
    border-top: 0;
    border-right: 2px solid ${props => props.theme.colors.borderStrong};
  }
`

const Brand = styled.div`
  display: none;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    height: 184px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 22px 18px 18px;
    background: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.onPrimary};
    border-bottom: 2px solid ${props => props.theme.colors.borderStrong};
  }
`

const BrandCode = styled.span`
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.78;
`

const BrandName = styled.strong`
  color: inherit;
  font-family: ${props => props.theme.typography.displayFamily};
  font-size: 2.05rem;
  line-height: 0.82;
  letter-spacing: -0.08em;
  text-transform: uppercase;
`

const NavList = styled.div`
  display: contents;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    display: grid;
    gap: 0;
    padding: 16px 0;
  }
`

const NavItem = styled(motion.button)`
  position: relative;
  min-width: 0;
  min-height: 74px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 7px 2px;
  overflow: hidden;
  background: ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.$active ? props.theme.colors.onPrimary : props.theme.colors.text.secondary};
  border-right: 1px solid ${props => props.theme.colors.border};
  font-family: ${props => props.theme.typography.monoFamily};
  transition:
    background var(--duration-fast) ease,
    color var(--duration-fast) ease,
    transform var(--duration-fast) ease;

  &:last-child { border-right: 0; }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: 4px;
    background: ${props => props.theme.colors.secondary};
    transform: scaleX(${props => props.$active ? 1 : 0});
    transform-origin: left;
    transition: transform var(--duration-base) var(--ease-out);
  }

  &:hover:not(:disabled) {
    background: ${props => props.$active ? props.theme.colors.primaryHover : props.theme.colors.surfaceAlt};
    color: ${props => props.$active ? props.theme.colors.onPrimary : props.theme.colors.text.primary};
  }

  &:active:not(:disabled) {
    transform: translateY(2px);
  }

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    width: 100%;
    min-height: 62px;
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr) 16px;
    justify-items: start;
    gap: 10px;
    padding: 10px 16px;
    border-right: 0;
    border-bottom: 1px solid ${props => props.theme.colors.border};

    &::after {
      top: 0;
      right: auto;
      bottom: 0;
      left: 0;
      width: 5px;
      height: auto;
      transform: scaleY(${props => props.$active ? 1 : 0});
      transform-origin: bottom;
    }

    &:active:not(:disabled) { transform: translateX(2px); }
  }
`

const NavIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
`

const NavLabel = styled.span`
  max-width: 100%;
  overflow: hidden;
  font-size: clamp(0.5rem, 2.4vw, 0.62rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;

  @media (max-width: 345px) {
    font-size: 0.48rem;
  }

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 0.66rem;
    letter-spacing: 0.035em;
  }
`

const StopNumber = styled.span`
  display: none;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    display: inline;
    justify-self: end;
    font-size: 0.56rem;
    opacity: 0.6;
  }
`

const RailStatus = styled.div`
  display: none;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    margin-top: auto;
    display: grid;
    grid-template-columns: 9px 1fr;
    align-items: center;
    gap: 9px;
    padding: 16px 18px;
    border-top: 1px solid ${props => props.theme.colors.border};
    color: ${props => props.theme.colors.text.secondary};
    font-family: ${props => props.theme.typography.monoFamily};
    font-size: 0.58rem;
    letter-spacing: 0.08em;
    line-height: 1.4;
    text-transform: uppercase;

    &::before {
      content: '';
      width: 9px;
      height: 9px;
      background: ${props => props.theme.colors.secondary};
      border: 1px solid ${props => props.theme.colors.borderStrong};
      box-shadow: 0 0 0 3px ${props => props.theme.colors.secondary}22;
    }
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
      <Brand aria-hidden="true">
        <BrandCode>Daily signal / 01</BrandCode>
        <BrandName>Habit<br />Control</BrandName>
      </Brand>
      <NavList>
        {navItems.map((item, index) => (
          <NavItem
            key={item.id}
            type="button"
            $active={activeTab === item.id}
            onClick={() => handleTabClick(item)}
            aria-label={item.label}
            aria-current={activeTab === item.id ? 'page' : undefined}
          >
            <NavIcon aria-hidden="true"><AppIcon name={item.icon} size={20} stroke={2} /></NavIcon>
            <NavLabel>{item.label}</NavLabel>
            <StopNumber>{String(index + 1).padStart(2, '0')}</StopNumber>
          </NavItem>
        ))}
      </NavList>
      <RailStatus>Local record online</RailStatus>
    </NavContainer>
  )
}

export default BottomNavigation
