import React from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { getDayOfYear } from 'date-fns'
import { useNavigation } from '../context/NavigationContext'
import AppIcon from './AppIcon'

const Rail = styled.nav`
  position: fixed;
  right: 0; bottom: 0; left: 0; z-index: 100;
  height: calc(74px + env(safe-area-inset-bottom, 0px));
  display: grid; grid-template-columns: repeat(6, minmax(0, 1fr));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: ${props => props.theme.colors.surface}F5;
  border-top: 1px solid ${props => props.theme.colors.borderStrong};
  backdrop-filter: blur(18px);
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    top: 0; right: auto; bottom: 0; width: 168px; height: 100vh;
    display: flex; flex-direction: column; padding: 0;
    border-top: 0; border-right: 1px solid ${props => props.theme.colors.borderStrong};
  }
`

const Brand = styled.button`
  display: none;
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    position: relative; height: 168px; display: flex; flex-direction: column; justify-content: space-between;
    padding: 20px 16px; overflow: hidden; background: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.onPrimary}; text-align: left;
    &::after { content: ''; position: absolute; width: 106px; height: 106px; right: -42px; bottom: -40px; border: 1px solid currentColor; border-radius: 50%; opacity: .35; }
  }
`
const BrandCode = styled.span` font-family:${props => props.theme.typography.monoFamily};font-size:.58rem;letter-spacing:.12em;text-transform:uppercase; `
const BrandName = styled.strong` font-family:${props => props.theme.typography.displayFamily};font-size:1.55rem;line-height:.88;letter-spacing:-.06em; `

const NavItem = styled(motion.button)`
  position: relative; min-width: 0; min-height: 70px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  padding: 6px 2px; background: ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.$active ? props.theme.colors.onPrimary : props.theme.colors.text.secondary};
  border-right: 1px solid ${props => props.theme.colors.border};
  font-family: ${props => props.theme.typography.monoFamily};
  transition: background var(--duration-fast), color var(--duration-fast), transform var(--duration-fast);
  &::before { content:''; position:absolute; top:0; right:0; left:0; height:3px; background:${props => props.theme.colors.secondary}; transform:scaleX(${props => props.$active ? 1 : 0}); transition:transform var(--duration-base); }
  &:hover:not(:disabled){background:${props => props.$active ? props.theme.colors.primaryHover : props.theme.colors.surfaceAlt};color:${props => props.$active ? props.theme.colors.onPrimary : props.theme.colors.text.primary}}
  &:active:not(:disabled){transform:translateY(2px)}
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    width:100%; min-height:64px; display:grid; grid-template-columns:24px minmax(0,1fr) 18px; justify-items:start; gap:8px; padding:10px 14px;
    border-right:0; border-bottom:1px solid ${props => props.theme.colors.border};
    &::before{top:0;right:auto;bottom:0;left:0;width:4px;height:auto;transform:scaleY(${props => props.$active ? 1 : 0})}
    &:active:not(:disabled){transform:translateX(2px)}
  }
`
const NavLabel = styled.span` max-width:100%;overflow:hidden;font-size:clamp(.47rem,2.3vw,.61rem);font-weight:700;letter-spacing:.04em;line-height:1;text-overflow:ellipsis;text-transform:uppercase;white-space:nowrap;@media(min-width:${props => props.theme.breakpoints.tablet}){font-size:.62rem} `
const Index = styled.span` display:none;@media(min-width:${props => props.theme.breakpoints.tablet}){display:inline;justify-self:end;font-size:.52rem;opacity:.6} `
const Status = styled.div`
  display:none;
  @media(min-width:${props => props.theme.breakpoints.tablet}){margin-top:auto;display:grid;grid-template-columns:8px 1fr;align-items:center;gap:8px;padding:16px 14px;border-top:1px solid ${props => props.theme.colors.border};color:${props => props.theme.colors.text.secondary};font-family:${props => props.theme.typography.monoFamily};font-size:.55rem;letter-spacing:.06em;text-transform:uppercase;&::before{content:'';width:8px;height:8px;background:${props => props.theme.colors.secondary};border-radius:50%;box-shadow:0 0 0 4px ${props => props.theme.colors.secondary}20}}
`

const items = [
  {id:'dashboard',label:'Today',icon:'target',path:'/'},{id:'habits',label:'Habits',icon:'repeat',path:'/habits'},
  {id:'calendar',label:'Calendar',icon:'calendar',path:'/calendar'},{id:'journal',label:'Log',icon:'notebook',path:'/journal'},
  {id:'progress',label:'Patterns',icon:'chart-line',path:'/progress'},{id:'settings',label:'System',icon:'settings',path:'/settings'}
]

const BottomNavigation = () => {
  const navigate = useNavigate(); const {activeTab,setActiveTab}=useNavigation()
  const go=item=>{setActiveTab(item.id);navigate(item.path)}
  return <Rail aria-label="Primary navigation">
    <Brand type="button" onClick={()=>go(items[0])} aria-label="Go to today"><BrandCode>Trajectory {getDayOfYear(new Date())}</BrandCode><BrandName>ORBIT<br/>DAILY</BrandName></Brand>
    {items.map((item,index)=><NavItem key={item.id} type="button" $active={activeTab===item.id} onClick={()=>go(item)} aria-label={item.label} aria-current={activeTab===item.id?'page':undefined}><AppIcon name={item.icon} size={19}/><NavLabel>{item.label}</NavLabel><Index>{String(index+1).padStart(2,'0')}</Index></NavItem>)}
    <Status>Local telemetry stable</Status>
  </Rail>
}

export default BottomNavigation
