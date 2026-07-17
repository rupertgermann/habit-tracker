// Preserved from design snapshot 7aec7cbf85c486775f68cb6c72fc4bc4897776b2.
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { format, getDayOfYear } from 'date-fns'
import Button from '../components/Button'
import Confetti from '../components/Confetti'
import CountStepper from '../components/CountStepper'
import EmptyState from '../components/EmptyState'
import AppIcon from '../components/AppIcon'
import { useHabits } from '../context/HabitsContext'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { useToast } from '../context/ToastContext'
import { DEFAULT_HABIT_ICON } from '../domain/iconCatalog'

const Shell=styled(motion.main)`width:min(100%,1280px);margin:0 auto;padding:clamp(22px,4vw,52px) clamp(16px,4vw,54px) 100px;`
const Header=styled.header`display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;padding-bottom:18px;border-bottom:1px solid ${p=>p.theme.colors.borderStrong};`
const Coordinates=styled.span`color:${p=>p.theme.colors.text.secondary};font-family:${p=>p.theme.typography.monoFamily};font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;`
const SystemName=styled.strong`font-family:${p=>p.theme.typography.displayFamily};font-size:1rem;letter-spacing:.04em;`

const Hero=styled.section`display:grid;grid-template-columns:minmax(320px,1fr) minmax(300px,.86fr);gap:clamp(36px,7vw,88px);align-items:center;padding:clamp(38px,7vw,78px) 0;@media(max-width:780px){grid-template-columns:1fr}`
const OrbitMap=styled.div`position:relative;width:min(100%,520px);aspect-ratio:1;margin:auto;`
const Ring=styled.span`position:absolute;inset:${p=>p.$inset};border:1px solid ${p=>p.theme.colors.borderStrong};border-radius:50%;opacity:${p=>p.$opacity||.5};&::before{content:'';position:absolute;top:50%;right:-3px;width:5px;height:5px;background:${p=>p.theme.colors.secondary};border-radius:50%;box-shadow:0 0 14px ${p=>p.theme.colors.secondary}}`
const Axis=styled.span`position:absolute;top:50%;right:4%;left:4%;height:1px;background:${p=>p.theme.colors.border};transform:rotate(${p=>p.$angle}deg);`
const Core=styled.div`
  position:absolute;inset:35%;display:grid;place-items:center;text-align:center;border-radius:50%;
  background:radial-gradient(circle,${p=>p.theme.colors.surface} 0 58%,transparent 60%),conic-gradient(${p=>p.theme.colors.primary} ${p=>p.$progress}%,${p=>p.theme.colors.surfaceAlt} 0);
  box-shadow:0 0 50px ${p=>p.theme.colors.primary}24;
  strong{display:block;font-family:${p=>p.theme.typography.displayFamily};font-size:clamp(2rem,5vw,4.3rem);line-height:.8;letter-spacing:-.07em}
  span{display:block;margin-top:10px;color:${p=>p.theme.colors.text.secondary};font-family:${p=>p.theme.typography.monoFamily};font-size:.58rem;letter-spacing:.1em;text-transform:uppercase}
`
const Marker=styled.button`
  position:absolute;top:50%;left:50%;width:${p=>p.$active?'30px':'23px'};height:${p=>p.$active?'30px':'23px'};min-height:0;margin:${p=>p.$active?'-15px':'-11.5px'};
  display:grid;place-items:center;background:${p=>p.$active?p.theme.colors.secondary:p.theme.colors.surface};color:${p=>p.theme.colors.ink};
  border:1px solid ${p=>p.theme.colors.borderStrong};border-radius:50%;box-shadow:0 0 0 7px ${p=>p.theme.colors.background}B8;
  transform:rotate(${p=>p.$angle}deg) translateX(clamp(96px,18vw,205px)) rotate(-${p=>p.$angle}deg);
  transition:width var(--duration-base),height var(--duration-base),background var(--duration-base),box-shadow var(--duration-base);
  &:hover:not(:disabled){background:${p=>p.theme.colors.secondary};box-shadow:0 0 0 7px ${p=>p.theme.colors.background}B8,0 0 28px ${p=>p.theme.colors.secondary}}
  @media(max-width:430px){transform:rotate(${p=>p.$angle}deg) translateX(38vw) rotate(-${p=>p.$angle}deg)}
`
const StaticMarker=styled(Marker)`cursor:default;`

const HeroCopy=styled.div`h1{max-width:8ch;margin:12px 0 24px;font-size:clamp(3rem,8vw,7.2rem)}p{max-width:43ch;color:${p=>p.theme.colors.text.secondary}}`
const Badge=styled.span`display:inline-flex;padding:7px 10px;background:${p=>p.theme.colors.primary}18;color:${p=>p.theme.colors.text.primary};border:1px solid ${p=>p.theme.colors.primary};font-family:${p=>p.theme.typography.monoFamily};font-size:.6rem;letter-spacing:.08em;text-transform:uppercase;`
const Telemetry=styled.dl`display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;margin-top:30px;background:${p=>p.theme.colors.border};border:1px solid ${p=>p.theme.colors.border};div{padding:16px;background:${p=>p.theme.colors.surface}}dt{color:${p=>p.theme.colors.text.secondary};font-family:${p=>p.theme.typography.monoFamily};font-size:.56rem;letter-spacing:.08em;text-transform:uppercase}dd{margin-top:5px;font-family:${p=>p.theme.typography.displayFamily};font-size:1.6rem;font-weight:600}`

const Weekly=styled.section`display:grid;grid-template-columns:auto repeat(7,minmax(34px,1fr));align-items:end;margin-bottom:clamp(46px,7vw,80px);border-top:1px solid ${p=>p.theme.colors.border};border-bottom:1px solid ${p=>p.theme.colors.border};@media(max-width:620px){grid-template-columns:repeat(7,minmax(0,1fr))}`
const WeekLabel=styled.div`align-self:stretch;display:flex;align-items:center;padding:14px 20px 14px 0;color:${p=>p.theme.colors.text.secondary};font-family:${p=>p.theme.typography.monoFamily};font-size:.6rem;letter-spacing:.09em;text-transform:uppercase;@media(max-width:620px){display:none}`
const Day=styled.div`min-width:0;min-height:94px;display:flex;flex-direction:column;justify-content:end;gap:7px;padding:10px 5px;text-align:center;border-left:1px solid ${p=>p.theme.colors.border};font-family:${p=>p.theme.typography.monoFamily};font-size:.55rem;color:${p=>p.theme.colors.text.secondary};i{height:${p=>Math.max(5,p.$level)}%;min-height:5px;background:${p=>p.$today?p.theme.colors.secondary:p.theme.colors.primary};opacity:${p=>p.$today?1:.65}}strong{color:${p=>p.theme.colors.text.primary};font-size:.7rem}`

const Section=styled.section`margin-bottom:clamp(48px,7vw,82px);`
const SectionHeader=styled.div`display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid ${p=>p.theme.colors.borderStrong};h2{text-transform:uppercase}`
const Kicker=styled.span`display:block;margin-bottom:8px;color:${p=>p.theme.colors.primary};font-family:${p=>p.theme.typography.monoFamily};font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;`
const MissionList=styled.div`display:grid;border:1px solid ${p=>p.theme.colors.borderStrong};background:${p=>p.theme.colors.surface};box-shadow:${p=>p.theme.shadows.medium};`
const Mission=styled(motion.article)`display:grid;grid-template-columns:48px minmax(0,1fr) auto;grid-template-areas:'status info control';align-items:center;gap:16px;min-height:88px;padding:14px 18px;border-bottom:1px solid ${p=>p.theme.colors.border};cursor:pointer;transition:background var(--duration-fast),transform var(--duration-fast);&:last-child{border-bottom:0}&:hover{background:${p=>p.theme.colors.surfaceAlt};transform:translateX(4px)}@media(max-width:500px){grid-template-columns:42px minmax(0,1fr);grid-template-areas:'status info' '. control';padding:13px 12px}`
const MissionStatus=styled.button`grid-area:status;width:42px;height:42px;min-height:42px;display:grid;place-items:center;background:${p=>p.$active?p.theme.colors.secondary:'transparent'};color:${p=>p.$active?'#080D18':p.theme.colors.text.primary};border:1px solid ${p=>p.theme.colors.borderStrong};border-radius:50%;font-family:${p=>p.theme.typography.monoFamily};font-size:.6rem;transition:background var(--duration-fast),box-shadow var(--duration-fast);&:hover:not(:disabled){background:${p=>p.theme.colors.secondary};color:#080D18;box-shadow:0 0 20px ${p=>p.theme.colors.secondary}70}`
const StaticStatus=styled.span`grid-area:status;width:42px;height:42px;display:grid;place-items:center;background:${p=>p.$active?p.theme.colors.secondary:'transparent'};color:${p=>p.$active?'#080D18':p.theme.colors.text.primary};border:1px solid ${p=>p.theme.colors.borderStrong};border-radius:50%;font-family:${p=>p.theme.typography.monoFamily};font-size:.6rem;`
const MissionInfo=styled.div`grid-area:info;min-width:0;display:flex;align-items:center;gap:13px;h3{overflow:hidden;margin-bottom:4px;font-family:${p=>p.theme.typography.fontFamily};font-size:1rem;font-weight:500;letter-spacing:-.02em;text-overflow:ellipsis;white-space:nowrap}`
const Glyph=styled.span`width:34px;height:34px;flex:0 0 34px;display:grid;place-items:center;color:${p=>p.$color||p.theme.colors.primary};@media(max-width:390px){display:none}`
const Meta=styled.span`color:${p=>p.theme.colors.text.secondary};font-family:${p=>p.theme.typography.monoFamily};font-size:.57rem;letter-spacing:.05em;text-transform:uppercase;`
const Control=styled.div`grid-area:control;justify-self:end;`

const Dispatch=styled.aside`display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:20px;margin-bottom:clamp(48px,7vw,82px);padding:22px;background:${p=>p.theme.colors.primary};color:${p=>p.theme.colors.onPrimary};border:1px solid ${p=>p.theme.colors.borderStrong};box-shadow:${p=>p.theme.shadows.medium};h2{margin-bottom:5px;color:inherit;font-size:1.5rem}p{margin:0;opacity:.78}.dispatch-action{color:#080D18}@media(max-width:620px){grid-template-columns:auto 1fr;.dispatch-action{grid-column:2;justify-self:start}}`
const DispatchCode=styled.span`width:44px;height:44px;display:grid;place-items:center;border:1px solid currentColor;border-radius:50%;font-family:${p=>p.theme.typography.monoFamily};font-size:.58rem;`
const PathGrid=styled.div`display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;@media(max-width:620px){grid-template-columns:1fr}`
const Path=styled.button`width:100%;min-width:0;min-height:160px;display:flex;align-items:end;justify-content:space-between;gap:20px;padding:24px;background:${p=>p.theme.colors.surface};color:${p=>p.theme.colors.text.primary};border:1px solid ${p=>p.theme.colors.borderStrong};text-align:left;transition:transform var(--duration-fast),background var(--duration-fast);strong{min-width:0;max-width:12ch;overflow-wrap:anywhere;font-family:${p=>p.theme.typography.displayFamily};font-size:1.8rem;line-height:.95;text-transform:uppercase}&:hover{background:${p=>p.theme.colors.surfaceAlt};transform:translateY(-4px)}&:active{transform:none}`
const StatePanel=styled.div`max-width:680px;margin:70px auto 0;padding:clamp(30px,6vw,62px);background:${p=>p.theme.colors.surface};border:1px solid ${p=>p.theme.colors.borderStrong};box-shadow:${p=>p.theme.shadows.medium};h2{margin:20px 0 10px;text-transform:uppercase}p{color:${p=>p.theme.colors.text.secondary}}`
const Loading=styled.div`height:12px;margin-top:28px;background:${p=>p.theme.colors.surfaceAlt};overflow:hidden;&::after{content:'';display:block;width:30%;height:100%;background:${p=>p.theme.colors.secondary};animation:calibrate 1.1s var(--ease-out) infinite alternate}@keyframes calibrate{to{transform:translateX(235%)}}`

const Dashboard=()=>{
  const navigate=useNavigate();const{dashboardHabitTracking,isLoading,hasLoaded,error}=useHabits();const{weekStartsOn}=usePreferences();const{showSuccessToast,showErrorToast}=useToast()
  const[showConfetti,setShowConfetti]=useState(false);const referenceDate=new Date()
  const{todayHabits,weeklyCompletionFacts:weeklyData,totalHabits:total,todayCompletedCount:completed,completionRate:rate,topCurrentStreak:streak}=dashboardHabitTracking.getSnapshot({referenceDate,weekStartsOn});const maxWeekly=Math.max(total,1)
  const toggle=async id=>{const habit=todayHabits.find(h=>h.id===id);if(!habit)return{ok:false};const result=await dashboardHabitTracking.toggleYesNo({habitId:id,referenceDate:new Date()});if(!result.ok){showErrorToast(`Mission update failed: "${habit.name}". Try again.`);return result}if(result.completionState==='complete'){showSuccessToast(`Signal confirmed: "${habit.name}".`);if(result.allComplete){setShowConfetti(true);showSuccessToast('Orbit stable. Every habit is complete.')}else if(result.intermediateMilestone)setShowConfetti(true)}return result}
  const dispatch=rate===100?{title:'Orbit stable.',text:'Every habit has checked in. The system can rest.'}:rate>=75?{title:'Closing trajectory.',text:'One small completion will stabilize today’s orbit.'}:streak>=7?{title:'Long-range signal.',text:`Your strongest habit has held for ${streak} days.`}:{title:'Begin transmission.',text:'Activate the easiest habit and let motion build from there.'}
  const header=<><h1 className="sr-only">Dashboard</h1><Header><SystemName>ORBIT / DAILY</SystemName><Coordinates>{format(new Date(),'yyyy.MM.dd')} · local trajectory</Coordinates></Header></>
  if(isLoading&&!hasLoaded)return<Shell aria-busy="true">{header}<StatePanel><AppIcon name="activity" size={38}/><h2>Calibrating orbit</h2><p>Your local habit record is coming into range.</p><Loading/><span className="sr-only">Loading habits</span></StatePanel></Shell>
  if(error)return<Shell>{header}<StatePanel role="alert"><AppIcon name="circle-x" size={38}/><h2>Telemetry interrupted</h2><p>Your last confirmed record is intact. Reconnect the local service to continue.</p><Button onClick={()=>window.location.reload()}>Recalibrate</Button></StatePanel></Shell>
  if(total===0)return<Shell>{header}<EmptyState type="habits" title="Launch the first habit" description="One recurring action is enough to begin a system. Add it now and give it an orbit." actionText="Add first habit" onAction={()=>navigate('/add-habit')}/></Shell>
  return<Shell initial={{opacity:0}} animate={{opacity:1}}><Confetti run={showConfetti} onComplete={()=>setShowConfetti(false)}/>{header}
    <Hero><OrbitMap role="img" aria-label={`${completed} of ${total} habit signals active`}><Axis $angle="0"/><Axis $angle="60"/><Axis $angle="120"/><Ring $inset="4%"/><Ring $inset="20%"/><Ring $inset="34%" $opacity={.75}/><Core $progress={rate}><div><strong>{rate}%</strong><span>system stable</span></div></Core>{todayHabits.map((habit,index)=>{const active=Boolean(habit.isCompleted),angle=(index/Math.max(todayHabits.length,1))*360;return habit.type==='count'?<StaticMarker as="span" key={habit.id} $active={active} $angle={angle} aria-hidden="true"/>:<Marker key={habit.id} type="button" $active={active} $angle={angle} aria-label={`${active?'Mark as incomplete':'Mark as complete'}: ${habit.name}`} onClick={()=>toggle(habit.id)}>{active&&<AppIcon name="check" size={14}/>}</Marker>})}</OrbitMap>
      <HeroCopy><Badge>Trajectory {getDayOfYear(new Date())} / 365</Badge><h1>Keep the system in motion.</h1><p>Each recurring action has gravity. Complete the next habit and today’s pattern becomes clearer.</p><Telemetry><div><dt>Signals today</dt><dd>{completed}/{total}</dd></div><div><dt>Top streak</dt><dd>{streak}d</dd></div></Telemetry></HeroCopy></Hero>
    <Weekly aria-label="Seven day completion telemetry"><WeekLabel>Previous seven transmissions</WeekLabel>{weeklyData.map(day=><Day key={day.date} $today={day.isToday} $level={Math.round((day.completed/maxWeekly)*100)} title={`${day.day}: ${day.completed} completions`}><strong>{day.completed}</strong><i/><span>{day.day.slice(0,2)}</span></Day>)}</Weekly>
    <Dispatch><DispatchCode>TX</DispatchCode><div><h2>{dispatch.title}</h2><p>{dispatch.text}</p></div><Button className="dispatch-action" variant="secondary" onClick={()=>navigate('/progress')}>Inspect pattern</Button></Dispatch>
    <Section aria-labelledby="missions-title"><SectionHeader><div><Kicker>01 / active trajectory</Kicker><h2 id="missions-title">Today’s missions</h2></div><Button variant="ghost" icon="plus" onClick={()=>navigate('/add-habit')}>Add Habit</Button></SectionHeader><MissionList>{todayHabits.map((habit,index)=>{const active=Boolean(habit.isCompleted),count=habit.type==='count';return<Mission key={habit.id} data-habit-id={habit.id} onClick={()=>navigate(`/habit/${habit.id}`)} initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} transition={{duration:.4,delay:index*.045}}>{count?<StaticStatus $active={active}>{String(index+1).padStart(2,'0')}</StaticStatus>:<MissionStatus type="button" $active={active} aria-label={`${active?'Mark as incomplete':'Mark as complete'}: ${habit.name}`} onClick={e=>{e.stopPropagation();toggle(habit.id)}}>{active?<AppIcon name="check" size={16}/>:String(index+1).padStart(2,'0')}</MissionStatus>}<MissionInfo><Glyph $color={habit.color}><AppIcon name={habit.icon} fallbackName={DEFAULT_HABIT_ICON} size={20}/></Glyph><div><h3>{habit.name}</h3><Meta>{active?'Signal active':'Awaiting signal'} · {habit.currentStreak}d streak</Meta></div></MissionInfo>{count&&<Control onClick={e=>e.stopPropagation()}><CountStepper habit={habit}/></Control>}</Mission>})}</MissionList></Section>
    <Section aria-labelledby="routes-title"><SectionHeader><div><Kicker>02 / deeper telemetry</Kicker><h2 id="routes-title">Read the orbit</h2></div></SectionHeader><PathGrid><Path type="button" onClick={()=>navigate('/calendar')}><strong>Open calendar</strong><AppIcon name="calendar" size={30}/></Path><Path type="button" onClick={()=>navigate('/journal')}><strong>Record reflection</strong><AppIcon name="notebook" size={30}/></Path></PathGrid></Section>
  </Shell>
}
export default Dashboard
