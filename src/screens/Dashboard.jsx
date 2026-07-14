import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import Button from '../components/Button'
import Confetti from '../components/Confetti'
import CountStepper from '../components/CountStepper'
import EmptyState from '../components/EmptyState'
import AppIcon from '../components/AppIcon'
import { useHabits } from '../context/HabitsContext'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { useToast } from '../context/ToastContext'
import {
  getHabitStreak,
  getTodayHabits,
  getTrackingStats,
  getWeeklyCompletionData,
  isCompletedOnDate,
  toDateKey
} from '../domain/habitTracking'
import { DEFAULT_HABIT_ICON } from '../domain/iconCatalog'

const Shell = styled(motion.main)`
  width: min(100%, 1180px);
  margin: 0 auto;
  padding: clamp(28px, 6vw, 72px) clamp(18px, 5vw, 64px) 112px;
`

const Header = styled.header`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`

const Brand = styled.span`
  font-family: ${props => props.theme.typography.displayFamily};
  font-size: 1.15rem;
  letter-spacing: -.025em;
`

const DateLine = styled.span`
  color: ${props => props.theme.colors.text.secondary};
  font-size: .76rem;
  letter-spacing: .08em;
  text-transform: uppercase;
`

const Hero = styled.section`
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(320px, 1.1fr);
  gap: clamp(36px, 8vw, 96px);
  align-items: end;
  padding: clamp(58px, 11vw, 124px) 0 clamp(42px, 7vw, 80px);
  @media (max-width: 760px) { grid-template-columns: 1fr; }
`

const HeroCopy = styled.div`
  p { max-width: 34ch; color: ${props => props.theme.colors.text.secondary}; }
`

const Kicker = styled.span`
  display: block;
  margin-bottom: 14px;
  color: ${props => props.theme.colors.primary};
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: .7rem;
  letter-spacing: .12em;
  text-transform: uppercase;
`

const Title = styled.h1`
  max-width: 8ch;
  margin-bottom: 24px;
  font-size: clamp(3.4rem, 10vw, 7.8rem);
  font-weight: 400;
`

const Breath = styled.div`
  display: grid;
  gap: 16px;
  padding-bottom: 8px;
`

const BreathHeadline = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 18px;
  strong { font-family: ${props => props.theme.typography.displayFamily}; font-size: clamp(2rem, 5vw, 3.8rem); font-weight: 400; line-height: 1; }
  span { color: ${props => props.theme.colors.text.secondary}; font-size: .78rem; }
`

const BeadLine = styled.div`
  position: relative;
  min-height: 36px;
  display: grid;
  grid-template-columns: repeat(${props => Math.max(props.$count, 1)}, 1fr);
  align-items: center;
  &::before { content: ''; position: absolute; right: 0; left: 0; height: 1px; background: ${props => props.theme.colors.borderStrong}; opacity: .45; }
`

const Bead = styled.span`
  position: relative;
  justify-self: center;
  width: ${props => props.$active ? '24px' : '15px'};
  height: ${props => props.$active ? '24px' : '15px'};
  background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.borderStrong};
  border-radius: 50%;
  box-shadow: 0 0 0 6px ${props => props.theme.colors.background};
  transition: width var(--duration-base) var(--ease-spring), height var(--duration-base) var(--ease-spring), background var(--duration-base);
`

const Weekly = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;
`

const WeekDay = styled.div`
  min-width: 0;
  display: grid;
  gap: 7px;
  color: ${props => props.$today ? props.theme.colors.text.primary : props.theme.colors.text.secondary};
  font-size: .66rem;
  text-align: center;
  span:first-child { height: 52px; display: flex; align-items: end; justify-content: center; }
  i { width: 100%; max-width: 22px; height: ${props => Math.max(4, props.$level)}%; display: block; background: ${props => props.$today ? props.theme.colors.secondary : props.theme.colors.primary}; border-radius: 999px 999px 3px 3px; opacity: ${props => props.$today ? 1 : .6}; }
`

const Section = styled.section` margin-bottom: clamp(48px, 8vw, 90px); `
const SectionHeader = styled.div`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid ${props => props.theme.colors.borderStrong};
  h2 { font-weight: 400; }
`

const HabitList = styled.div` display: grid; `
const HabitRow = styled(motion.article)`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas: 'toggle info control';
  align-items: center;
  gap: 18px;
  min-height: 86px;
  padding: 14px 4px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  cursor: pointer;
  transition: padding var(--duration-fast), background var(--duration-fast);
  &:hover { padding-inline: 14px; background: ${props => props.theme.colors.primary}0C; }
  @media (max-width: 520px) {
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas: 'toggle info' '. control';
  }
`

const Toggle = styled.button`
  grid-area: toggle;
  width: 48px;
  height: 48px;
  min-height: 48px;
  display: grid;
  place-items: center;
  background: ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.$active ? props.theme.colors.onPrimary : props.theme.colors.text.primary};
  border: 1px solid ${props => props.theme.colors.borderStrong};
  border-radius: 50%;
  transition: transform var(--duration-fast) var(--ease-spring), background var(--duration-fast);
  &:hover:not(:disabled) { transform: scale(1.08); background: ${props => props.theme.colors.primary}; color: ${props => props.theme.colors.onPrimary}; }
  &:active:not(:disabled) { transform: scale(.94); }
`

const StaticToggle = styled.span`
  grid-area: toggle;
  width: 48px; height: 48px; display: grid; place-items: center;
  background: ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.$active ? props.theme.colors.onPrimary : props.theme.colors.text.primary};
  border: 1px solid ${props => props.theme.colors.borderStrong}; border-radius: 50%;
`

const HabitInfo = styled.div`
  grid-area: info; min-width: 0; display: flex; align-items: center; gap: 15px;
  h3 { overflow: hidden; margin-bottom: 4px; font-family: ${props => props.theme.typography.fontFamily}; font-size: 1.05rem; font-weight: 500; letter-spacing: -.02em; text-overflow: ellipsis; white-space: nowrap; }
`
const HabitGlyph = styled.span`
  width: 38px; height: 38px; flex: 0 0 38px; display: grid; place-items: center;
  color: ${props => props.$color || props.theme.colors.primary};
  @media (max-width: 420px) { display: none; }
`
const HabitMeta = styled.span` color: ${props => props.theme.colors.text.secondary}; font-size: .72rem; `
const HabitControl = styled.div` grid-area: control; justify-self: end; `

const Reflection = styled.aside`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 22px;
  align-items: end;
  margin: 32px 0 70px clamp(0px, 10vw, 120px);
  padding: clamp(24px, 4vw, 42px);
  background: ${props => props.theme.colors.surface};
  border-radius: 44px 14px 44px 14px;
  box-shadow: ${props => props.theme.shadows.medium};
  h2 { margin-bottom: 9px; font-weight: 400; }
  p { max-width: 58ch; margin: 0; color: ${props => props.theme.colors.text.secondary}; }
  @media (max-width: 620px) { grid-template-columns: 1fr; margin-left: 0; }
`

const PathGrid = styled.div`
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px;
  @media (max-width: 620px) { grid-template-columns: 1fr; }
`
const Path = styled.button`
  min-height: 154px; display: flex; align-items: end; justify-content: space-between; gap: 20px;
  padding: 28px; background: transparent; color: ${props => props.theme.colors.text.primary};
  border: 1px solid ${props => props.theme.colors.border}; border-radius: 34px; text-align: left;
  transition: background var(--duration-fast), transform var(--duration-fast);
  strong { max-width: 12ch; font-family: ${props => props.theme.typography.displayFamily}; font-size: 1.8rem; font-weight: 400; line-height: 1; }
  &:hover { background: ${props => props.theme.colors.surface}; transform: translateY(-4px); }
  &:active { transform: translateY(0); }
`

const StatePanel = styled.div`
  max-width: 680px; margin: 70px auto 0; padding: clamp(34px, 7vw, 72px);
  background: ${props => props.theme.colors.surface}; border-radius: 48px 18px 48px 18px;
  box-shadow: ${props => props.theme.shadows.medium}; text-align: center;
  h2 { margin: 20px 0 12px; font-weight: 400; }
  p { color: ${props => props.theme.colors.text.secondary}; }
`
const LoadingLine = styled.div`
  height: 1px; margin-top: 32px; background: ${props => props.theme.colors.border};
  &::after { content: ''; display: block; width: 28%; height: 9px; background: ${props => props.theme.colors.primary}; border-radius: 50%; transform: translateY(-4px); animation: breathe-load 1.4s var(--ease-out) infinite alternate; }
  @keyframes breathe-load { to { transform: translate(255%, -4px); } }
`

const Dashboard = () => {
  const navigate = useNavigate()
  const { habits, toggleYesNoCompletion, isLoading, hasLoaded, error } = useHabits()
  const { weekStartsOn } = usePreferences()
  const { showSuccessToast, showErrorToast } = useToast()
  const [todayHabits, setTodayHabits] = useState([])
  const [weeklyData, setWeeklyData] = useState([])
  const [stats, setStats] = useState({})
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    setTodayHabits(getTodayHabits(habits))
    setWeeklyData(getWeeklyCompletionData(habits, new Date(), weekStartsOn))
    setStats(getTrackingStats(habits))
  }, [habits, weekStartsOn])

  const completionRate = stats.completionRate || 0
  const completedToday = stats.todayCompletions || 0
  const totalHabits = stats.totalHabits || 0
  const liveStreak = stats.maxStreak || 0
  const maxWeeklyHabits = Math.max(totalHabits, 1)

  const handleToggleHabit = async habitId => {
    const habit = todayHabits.find(item => item.id === habitId)
    if (!habit) return { ok: false }
    const isCompleting = !habit.isCompleted
    const result = await toggleYesNoCompletion(habitId)
    if (!result.ok) { showErrorToast(`Could not update "${habit.name}". Please try again.`); return result }
    const updated = todayHabits.map(item => item.id === habitId ? { ...result.habit, isCompleted: isCompletedOnDate(result.habit, toDateKey()) } : item)
    if (isCompleting) {
      showSuccessToast(`"${habit.name}" is complete.`)
      const count = updated.filter(item => item.isCompleted).length
      if (count === totalHabits && totalHabits > 0) { setShowConfetti(true); showSuccessToast('Every ritual is complete. Let the day settle.') }
      else if (count % 3 === 0) setShowConfetti(true)
    }
    return result
  }

  const gentleMessage = completionRate === 100
    ? { title: 'Enough for today.', text: 'Every habit is complete. Leave a little room to notice how that feels.' }
    : liveStreak >= 7
      ? { title: 'The rhythm is becoming yours.', text: `${liveStreak} days of returning. Protect the smallest version of the ritual.` }
      : completionRate >= 50
        ? { title: 'The day already has a shape.', text: 'Choose one more habit with care; momentum does not need to be rushed.' }
        : { title: 'Begin where there is least resistance.', text: 'One small completion is enough to give the day a direction.' }

  const pageHeader = <><h1 className="sr-only">Dashboard</h1><Header><Brand>Still / daily</Brand><DateLine>{format(new Date(), 'EEEE · MMMM d')}</DateLine></Header></>

  if (isLoading && !hasLoaded) return <Shell aria-busy="true">{pageHeader}<StatePanel><AppIcon name="activity" size={38} /><h2>Gathering today’s rituals</h2><p>Your private record is opening quietly.</p><LoadingLine /><span className="sr-only">Loading habits</span></StatePanel></Shell>
  if (error) return <Shell>{pageHeader}<StatePanel role="alert"><AppIcon name="circle-x" size={38} /><h2>Your record is resting.</h2><p>Nothing changed while the local service was unavailable.</p><Button onClick={() => window.location.reload()}>Try again</Button></StatePanel></Shell>
  if (habits.length === 0) return <Shell>{pageHeader}<EmptyState type="habits" title="Begin with one ritual" description="Choose a recurring behavior small enough to repeat tomorrow. It will have room to grow here." actionText="Create a habit" onAction={() => navigate('/add-habit')} /></Shell>

  return (
    <Shell initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Confetti run={showConfetti} onComplete={() => setShowConfetti(false)} />
      {pageHeader}
      <Hero>
        <HeroCopy><Kicker>A gentle plan for today</Kicker><Title>Move with intention.</Title><p>Small rituals deserve enough quiet to be noticed. Complete what matters, then let the rest wait.</p></HeroCopy>
        <Breath aria-label={`${completedToday} of ${totalHabits} habits complete`}>
          <BreathHeadline><strong>{completedToday} of {totalHabits}</strong><span>{completionRate}% complete</span></BreathHeadline>
          <BeadLine $count={totalHabits}>{Array.from({ length: totalHabits }, (_, index) => <Bead key={index} $active={index < completedToday} />)}</BeadLine>
          <Weekly aria-label="Completions over the last seven days">
            {weeklyData.map(day => <WeekDay key={day.date} $today={day.isToday} $level={Math.round((day.completed / maxWeeklyHabits) * 100)} title={`${day.day}: ${day.completed} completions`}><span><i /></span><span>{day.day.slice(0, 2)}</span></WeekDay>)}
          </Weekly>
        </Breath>
      </Hero>

      <Reflection><div><Kicker>Today’s reflection</Kicker><h2>{gentleMessage.title}</h2><p>{gentleMessage.text}</p></div><Button variant="ghost" onClick={() => navigate('/progress')}>See the pattern</Button></Reflection>

      <Section aria-labelledby="today-habits-title">
        <SectionHeader><div><Kicker>Tuesday’s rituals</Kicker><h2 id="today-habits-title">What will you return to?</h2></div><Button variant="ghost" onClick={() => navigate('/add-habit')} icon="plus">Add Habit</Button></SectionHeader>
        <HabitList>
          {todayHabits.map((habit, index) => {
            const liveHabit = habits.find(item => item.id === habit.id) || habit
            const isCountHabit = liveHabit.type === 'count'
            const isComplete = Boolean(habit.isCompleted)
            return (
              <HabitRow key={habit.id} onClick={() => navigate(`/habit/${habit.id}`)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, delay: index * .05 }}>
                {isCountHabit ? <StaticToggle $active={isComplete} aria-hidden="true"><AppIcon name={isComplete ? 'check' : 'repeat'} size={18} /></StaticToggle> : <Toggle type="button" $active={isComplete} aria-label={`${isComplete ? 'Mark as incomplete' : 'Mark as complete'}: ${habit.name}`} onClick={event => { event.stopPropagation(); handleToggleHabit(habit.id) }}>{isComplete && <AppIcon name="check" size={19} stroke={2.4} />}</Toggle>}
                <HabitInfo><HabitGlyph $color={habit.color} aria-hidden="true"><AppIcon name={habit.icon} fallbackName={DEFAULT_HABIT_ICON} size={22} /></HabitGlyph><div><h3>{habit.name}</h3><HabitMeta>{isComplete ? 'Completed today' : 'Ready when you are'} · {getHabitStreak(liveHabit)} day streak</HabitMeta></div></HabitInfo>
                {isCountHabit && <HabitControl onClick={event => event.stopPropagation()}><CountStepper habit={liveHabit} /></HabitControl>}
              </HabitRow>
            )
          })}
        </HabitList>
      </Section>

      <Section aria-labelledby="continue-title"><SectionHeader><div><Kicker>Continue gently</Kicker><h2 id="continue-title">Look back, or write forward.</h2></div></SectionHeader><PathGrid><Path type="button" onClick={() => navigate('/calendar')}><strong>Open the calendar</strong><AppIcon name="calendar" size={30} /></Path><Path type="button" onClick={() => navigate('/journal')}><strong>Write one honest line</strong><AppIcon name="notebook" size={30} /></Path></PathGrid></Section>
    </Shell>
  )
}

export default Dashboard
