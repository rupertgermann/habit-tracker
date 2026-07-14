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

const DashboardContainer = styled(motion.main)`
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: clamp(18px, 4vw, 54px) clamp(14px, 4vw, 56px) 96px;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    padding-bottom: 64px;
  }
`

const PageHeader = styled(motion.header)`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 20px;
  padding: 0 0 clamp(22px, 4vw, 38px);
  border-bottom: 2px solid ${props => props.theme.colors.borderStrong};
  animation: signal-in var(--duration-slow) var(--ease-out) both;

  &::after {
    content: '';
    position: absolute;
    right: 0;
    bottom: -2px;
    width: clamp(64px, 14vw, 180px);
    height: 7px;
    background: ${props => props.theme.colors.secondary};
    border-left: 2px solid ${props => props.theme.colors.borderStrong};
  }
`

const Eyebrow = styled.p`
  margin: 0 0 12px;
  color: ${props => props.theme.colors.primary};
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.17em;
  text-transform: uppercase;
`

const Title = styled.h1`
  margin: 0;
  font-size: clamp(3rem, 9vw, 7.5rem);
  letter-spacing: -0.085em;
`

const DateBlock = styled.div`
  min-width: 148px;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: end;
  gap: 10px;
  padding: 12px 0 2px 18px;
  border-left: 1px solid ${props => props.theme.colors.borderStrong};

  @media (max-width: 560px) {
    display: none;
  }
`

const DateNumber = styled.strong`
  font-family: ${props => props.theme.typography.displayFamily};
  font-size: 3.4rem;
  line-height: 0.75;
  letter-spacing: -0.08em;
`

const DateMeta = styled.span`
  color: ${props => props.theme.colors.text.secondary};
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1.55;
  text-transform: uppercase;
`

const SummaryGrid = styled(motion.section)`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  margin: clamp(20px, 4vw, 42px) 0 clamp(40px, 7vw, 74px);
  border: 2px solid ${props => props.theme.colors.borderStrong};
  box-shadow: ${props => props.theme.shadows.strong};
  animation: signal-in var(--duration-slow) var(--ease-out) 80ms both;

  @media (min-width: 760px) {
    grid-template-columns: minmax(260px, 0.72fr) minmax(0, 1.28fr);
  }
`

const ScorePanel = styled.div`
  position: relative;
  min-height: 310px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(24px, 4vw, 42px);
  overflow: hidden;
  background: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.onPrimary};
  border-bottom: 2px solid ${props => props.theme.colors.borderStrong};

  &::before {
    content: '${props => String(props.$completed || 0).padStart(2, '0')}';
    position: absolute;
    right: -0.05em;
    bottom: -0.28em;
    color: ${props => props.theme.colors.onPrimary}0F;
    font-family: ${props => props.theme.typography.displayFamily};
    font-size: 15rem;
    font-weight: 800;
    line-height: 1;
    pointer-events: none;
  }

  @media (min-width: 760px) {
    border-right: 2px solid ${props => props.theme.colors.borderStrong};
    border-bottom: 0;
  }
`

const ConsoleLabel = styled.p`
  position: relative;
  z-index: 1;
  margin: 0;
  color: inherit;
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  opacity: 0.78;
`

const Score = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin: 34px 0 28px;
`

const ScoreValue = styled.strong`
  color: inherit;
  font-family: ${props => props.theme.typography.displayFamily};
  font-size: clamp(5.8rem, 15vw, 10rem);
  line-height: 0.67;
  letter-spacing: -0.105em;
`

const ScoreUnit = styled.span`
  padding-bottom: 4px;
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`

const Meter = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
`

const MeterCell = styled.span`
  height: 16px;
  background: ${props => props.$active ? props.theme.colors.secondary : props.theme.colors.onPrimary}26;
  border: 1px solid ${props => props.theme.colors.onPrimary}4D;
`

const PulsePanel = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 34px;
  padding: clamp(24px, 4vw, 42px);
  background: ${props => props.theme.colors.surface};
`

const PulseHeading = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 18px;

  h2 {
    max-width: 10ch;
    margin: 0;
    font-size: clamp(2rem, 5vw, 4rem);
    text-transform: uppercase;
  }
`

const PulseStats = styled.dl`
  display: grid;
  gap: 8px;
  text-align: right;

  div { display: grid; }

  dt {
    color: ${props => props.theme.colors.text.secondary};
    font-family: ${props => props.theme.typography.monoFamily};
    font-size: 0.56rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  dd {
    font-family: ${props => props.theme.typography.displayFamily};
    font-size: 1.65rem;
    font-weight: 800;
    line-height: 1;
  }
`

const WeekSignal = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(28px, 1fr));
  border-top: 1px solid ${props => props.theme.colors.borderStrong};
  border-left: 1px solid ${props => props.theme.colors.borderStrong};
`

const DaySignal = styled.div`
  position: relative;
  min-width: 0;
  min-height: 112px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10px 6px 8px;
  overflow: hidden;
  background:
    linear-gradient(
      to top,
      ${props => props.$today ? props.theme.colors.secondary : props.theme.colors.primary} 0 ${props => props.$level}%,
      transparent ${props => props.$level}% 100%
    );
  color: ${props => props.$level > 56 ? (props.$today ? '#111411' : props.theme.colors.onPrimary) : props.theme.colors.text.primary};
  border-right: 1px solid ${props => props.theme.colors.borderStrong};
  border-bottom: 1px solid ${props => props.theme.colors.borderStrong};
  transition: background var(--duration-base) var(--ease-out);

  strong {
    font-family: ${props => props.theme.typography.monoFamily};
    font-size: 0.58rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  span {
    font-family: ${props => props.theme.typography.displayFamily};
    font-size: clamp(1rem, 3vw, 1.55rem);
    font-weight: 800;
    line-height: 1;
  }
`

const Broadcast = styled(motion.aside)`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: clamp(14px, 3vw, 28px);
  margin-bottom: clamp(40px, 7vw, 74px);
  padding: clamp(18px, 3vw, 28px);
  background: ${props => props.theme.colors.secondary};
  color: #111411;
  border: 2px solid ${props => props.theme.colors.borderStrong};
  box-shadow: ${props => props.theme.shadows.medium};
  animation: signal-in var(--duration-slow) var(--ease-out) 150ms both;

  @media (max-width: 620px) {
    grid-template-columns: auto minmax(0, 1fr);
  }
`

const BroadcastIndex = styled.span`
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  background: #111411;
  color: ${props => props.theme.colors.secondary};
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: 0.68rem;
  font-weight: 700;
`

const BroadcastCopy = styled.div`
  h2 {
    margin: 0 0 5px;
    color: #111411;
    font-size: clamp(1.25rem, 3vw, 2rem);
    letter-spacing: -0.04em;
  }

  p {
    max-width: 64ch;
    margin: 0;
    font-size: 0.86rem;
    line-height: 1.5;
  }
`

const BroadcastAction = styled.button`
  min-height: 44px;
  padding: 0 12px;
  background: transparent;
  color: #111411;
  border: 1px solid #111411;
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  &:hover { background: #111411; color: ${props => props.theme.colors.secondary}; }
  &:active { transform: translateY(2px); }

  @media (max-width: 620px) {
    grid-column: 2;
    justify-self: start;
  }
`

const Section = styled(motion.section)`
  margin-bottom: clamp(44px, 7vw, 76px);
  animation: signal-in var(--duration-slow) var(--ease-out) 220ms both;
`

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 18px;
  margin-bottom: 22px;
  padding-bottom: 14px;
  border-bottom: 2px solid ${props => props.theme.colors.borderStrong};
`

const SectionTitle = styled.h2`
  margin: 0;
  font-size: clamp(2rem, 5vw, 4.2rem);
  text-transform: uppercase;
`

const SectionKicker = styled.span`
  display: block;
  margin-bottom: 7px;
  color: ${props => props.theme.colors.primary};
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
`

const CircuitList = styled.div`
  position: relative;
  display: grid;
  gap: 0;
  border: 2px solid ${props => props.theme.colors.borderStrong};
  background: ${props => props.theme.colors.surface};
  box-shadow: ${props => props.theme.shadows.medium};
`

const Station = styled(motion.article)`
  position: relative;
  min-width: 0;
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) auto;
  grid-template-areas: 'marker info control';
  align-items: center;
  gap: 16px;
  min-height: 96px;
  padding: 14px 18px 14px 12px;
  background: ${props => props.$complete ? `${props.theme.colors.secondary}12` : props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.borderStrong};
  cursor: pointer;
  transition: background var(--duration-fast) ease, color var(--duration-fast) ease;

  &:last-child { border-bottom: 0; }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 38px;
    width: 5px;
    background: ${props => props.$complete ? props.theme.colors.secondary : props.theme.colors.surfaceAlt};
    border-right: 1px solid ${props => props.theme.colors.borderStrong};
    border-left: 1px solid ${props => props.theme.colors.borderStrong};
  }

  &:hover {
    background: ${props => props.theme.colors.surfaceAlt};
  }

  &:focus-within {
    background: ${props => props.theme.colors.surfaceAlt};
  }

  @media (max-width: 430px) {
    grid-template-columns: 46px minmax(0, 1fr);
    grid-template-areas:
      'marker info'
      '. control';
    gap: 10px 12px;
    padding: 14px 12px 14px 8px;

    &::before { left: 30px; }
  }
`

const StationMarker = styled.button`
  position: relative;
  z-index: 1;
  grid-area: marker;
  width: 44px;
  height: 44px;
  min-height: 44px;
  display: grid;
  place-items: center;
  background: ${props => props.$complete ? props.theme.colors.secondary : props.theme.colors.surface};
  color: ${props => props.$complete ? '#111411' : props.theme.colors.text.primary};
  border: 2px solid ${props => props.theme.colors.borderStrong};
  border-radius: 50%;
  transition: background var(--duration-fast) ease, transform var(--duration-fast) var(--ease-spring);

  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.secondary};
    color: #111411;
    transform: scale(1.08);
  }

  &:active:not(:disabled) { transform: scale(0.94); }
`

const StaticMarker = styled.span`
  position: relative;
  z-index: 1;
  grid-area: marker;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  background: ${props => props.$complete ? props.theme.colors.secondary : props.theme.colors.surface};
  color: ${props => props.$complete ? '#111411' : props.theme.colors.text.primary};
  border: 2px solid ${props => props.theme.colors.borderStrong};
  border-radius: 50%;
`

const StationInfo = styled.div`
  grid-area: info;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 14px;
`

const HabitIcon = styled.span`
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: grid;
  place-items: center;
  background: ${props => props.$color || props.theme.colors.primary}18;
  color: ${props => props.$color || props.theme.colors.primary};
  border: 1px solid currentColor;

  @media (max-width: 430px) { display: none; }
`

const HabitCopy = styled.div`
  min-width: 0;
`

const HabitName = styled.h3`
  overflow: hidden;
  margin: 0 0 6px;
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: clamp(1rem, 2vw, 1.2rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const HabitMeta = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  color: ${props => props.theme.colors.text.secondary};
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: 0.6rem;
  letter-spacing: 0.055em;
  text-transform: uppercase;
`

const StationControl = styled.div`
  grid-area: control;
  justify-self: end;
`

const UtilityGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;

  @media (min-width: 680px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

const UtilityPanel = styled.button`
  position: relative;
  min-height: 190px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 22px;
  padding: clamp(22px, 4vw, 34px);
  background: ${props => props.$signal ? props.theme.colors.primary : props.theme.colors.surface};
  color: ${props => props.$signal ? props.theme.colors.onPrimary : props.theme.colors.text.primary};
  border: 2px solid ${props => props.theme.colors.borderStrong};
  box-shadow: ${props => props.theme.shadows.medium};
  text-align: left;
  transition: transform var(--duration-fast) ease, box-shadow var(--duration-fast) ease;

  &::before {
    content: '${props => props.$index}';
    position: absolute;
    top: 18px;
    left: 22px;
    font-family: ${props => props.theme.typography.monoFamily};
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.12em;
  }

  strong {
    max-width: 11ch;
    color: inherit;
    font-family: ${props => props.theme.typography.displayFamily};
    font-size: clamp(1.9rem, 4vw, 3.1rem);
    line-height: 0.92;
    letter-spacing: -0.055em;
    text-transform: uppercase;
  }

  &:hover {
    transform: translate(-4px, -4px);
    box-shadow: ${props => props.theme.shadows.strong};
  }

  &:active { transform: translate(0, 0); box-shadow: ${props => props.theme.shadows.subtle}; }
`

const StatusPanel = styled.div`
  max-width: 720px;
  margin: 56px auto 0;
  padding: clamp(26px, 6vw, 58px);
  background: ${props => props.theme.colors.surface};
  border: 2px solid ${props => props.theme.colors.borderStrong};
  box-shadow: ${props => props.theme.shadows.strong};

  h2 { margin: 20px 0 12px; text-transform: uppercase; }
  p { color: ${props => props.theme.colors.text.secondary}; }
`

const LoadingTrack = styled.div`
  height: 18px;
  margin-top: 26px;
  overflow: hidden;
  background: ${props => props.theme.colors.surfaceAlt};
  border: 1px solid ${props => props.theme.colors.borderStrong};

  &::after {
    content: '';
    display: block;
    width: 34%;
    height: 100%;
    background: ${props => props.theme.colors.primary};
    animation: scan 1.1s var(--ease-out) infinite alternate;
  }

  @keyframes scan { to { transform: translateX(194%); } }
`

const Dashboard = () => {
  const navigate = useNavigate()
  const {
    habits,
    toggleYesNoCompletion,
    isLoading,
    hasLoaded,
    error
  } = useHabits()
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
  const meterLevel = Math.round(completionRate / 10)
  const maxWeeklyHabits = Math.max(totalHabits, 1)

  const handleToggleHabit = async habitId => {
    const habit = todayHabits.find(item => item.id === habitId)
    if (!habit) return { ok: false }

    const isCompleting = !habit.isCompleted
    const result = await toggleYesNoCompletion(habitId)
    if (!result.ok) {
      showErrorToast(`Could not update "${habit.name}". Please try again.`)
      return result
    }

    const updatedHabits = todayHabits.map(todayHabit => (
      todayHabit.id === habitId
        ? { ...result.habit, isCompleted: isCompletedOnDate(result.habit, toDateKey()) }
        : todayHabit
    ))

    if (isCompleting) {
      showSuccessToast(`Signal received: "${habit.name}" completed.`)
      const completedCount = updatedHabits.filter(item => item.isCompleted).length
      if (completedCount === stats.totalHabits && stats.totalHabits > 0) {
        setShowConfetti(true)
        showSuccessToast('All stations active. Today’s circuit is complete.')
      } else if (completedCount % 3 === 0) {
        setShowConfetti(true)
      }
    }

    return result
  }

  const signalMessage = (() => {
    if (completionRate === 100) return { title: 'Full signal.', text: 'Every habit is active. Let the finished circuit stand; there is nothing more to prove today.' }
    if (completionRate >= 75) return { title: 'The circuit is nearly live.', text: 'Momentum is already carrying the load. Choose the quietest remaining station and close the loop.' }
    if (liveStreak >= 7) return { title: 'The rhythm is holding.', text: `${liveStreak} consecutive days are transmitting. Protect the ordinary action that keeps the signal clean.` }
    if (completionRate >= 50) return { title: 'Past the midpoint.', text: 'The day has a clear direction now. One deliberate completion will make the pattern visible.' }
    return { title: 'Send the first signal.', text: 'Start with the action that asks for the least negotiation. A live circuit begins at one station.' }
  })()

  if (isLoading && !hasLoaded) {
    return (
      <DashboardContainer aria-busy="true">
        <PageHeader>
          <div><Eyebrow>Signal room / synchronizing</Eyebrow><Title>Dashboard</Title></div>
        </PageHeader>
        <StatusPanel>
          <AppIcon name="activity" size={40} />
          <h2>Opening today’s circuit</h2>
          <p>Your local habit record is coming online.</p>
          <LoadingTrack />
          <span className="sr-only">Loading habits</span>
        </StatusPanel>
      </DashboardContainer>
    )
  }

  if (error) {
    return (
      <DashboardContainer>
        <PageHeader>
          <div><Eyebrow>Signal room / interrupted</Eyebrow><Title>Dashboard</Title></div>
        </PageHeader>
        <StatusPanel role="alert">
          <AppIcon name="activity" size={40} />
          <h2>The local signal is offline</h2>
          <p>Your record has not been changed. Reconnect the local service, then try the circuit again.</p>
          <Button onClick={() => window.location.reload()}>Reconnect</Button>
        </StatusPanel>
      </DashboardContainer>
    )
  }

  if (habits.length === 0) {
    return (
      <DashboardContainer>
        <PageHeader>
          <div><Eyebrow>Signal room / {format(new Date(), 'yyyy · MM · dd')}</Eyebrow><Title>Dashboard</Title></div>
          <DateBlock><DateNumber>{format(new Date(), 'dd')}</DateNumber><DateMeta>{format(new Date(), 'MMM')}<br />{format(new Date(), 'EEE · yyyy')}</DateMeta></DateBlock>
        </PageHeader>
        <EmptyState
          type="habits"
          title="Build your first circuit"
          description="Add one recurring behavior worth noticing. Its station will appear here each day, ready for a clear signal."
          actionText="Add First Habit"
          onAction={() => navigate('/add-habit')}
        />
      </DashboardContainer>
    )
  }

  return (
    <DashboardContainer>
      <Confetti run={showConfetti} onComplete={() => setShowConfetti(false)} />
      <PageHeader>
        <div>
          <Eyebrow>Signal room / {format(new Date(), 'yyyy · MM · dd')}</Eyebrow>
          <Title>Dashboard</Title>
        </div>
        <DateBlock>
          <DateNumber>{format(new Date(), 'dd')}</DateNumber>
          <DateMeta>{format(new Date(), 'MMM')}<br />{format(new Date(), 'EEE · yyyy')}</DateMeta>
        </DateBlock>
      </PageHeader>

      <SummaryGrid aria-labelledby="daily-score-title">
        <ScorePanel $completed={completedToday}>
          <ConsoleLabel id="daily-score-title">Daily signal strength</ConsoleLabel>
          <Score><ScoreValue>{completionRate}</ScoreValue><ScoreUnit>% live</ScoreUnit></Score>
          <Meter aria-label={`${completionRate}% complete`}>
            {Array.from({ length: 10 }, (_, index) => <MeterCell key={index} $active={index < meterLevel} />)}
          </Meter>
        </ScorePanel>
        <PulsePanel>
          <PulseHeading>
            <h2>Seven-day frequency</h2>
            <PulseStats>
              <div><dd>{completedToday}/{totalHabits}</dd><dt>Active today</dt></div>
              <div><dd>{liveStreak}</dd><dt>Top streak</dt></div>
            </PulseStats>
          </PulseHeading>
          <WeekSignal aria-label="Weekly habit completion signal">
            {weeklyData.map(day => {
              const level = Math.max(5, Math.round((day.completed / maxWeeklyHabits) * 100))
              return (
                <DaySignal key={day.date} $level={level} $today={day.isToday} title={`${day.day}: ${day.completed} completed`}>
                  <strong>{day.day}</strong>
                  <span>{day.completed}</span>
                </DaySignal>
              )
            })}
          </WeekSignal>
        </PulsePanel>
      </SummaryGrid>

      <Broadcast>
        <BroadcastIndex aria-hidden="true">TX</BroadcastIndex>
        <BroadcastCopy><h2>{signalMessage.title}</h2><p>{signalMessage.text}</p></BroadcastCopy>
        <BroadcastAction type="button" onClick={() => navigate('/progress')}>Inspect pattern</BroadcastAction>
      </Broadcast>

      <Section aria-labelledby="habit-circuit-title">
        <SectionHeader>
          <div><SectionKicker>Route 01 / live controls</SectionKicker><SectionTitle id="habit-circuit-title">Today’s circuit</SectionTitle></div>
          <Button variant="ghost" onClick={() => navigate('/add-habit')} icon="plus">Add Habit</Button>
        </SectionHeader>
        <CircuitList>
          {todayHabits.map((habit, index) => {
            const liveHabit = habits.find(item => item.id === habit.id) || habit
            const isCountHabit = liveHabit.type === 'count'
            const isComplete = Boolean(habit.isCompleted)
            const stationLabel = String(index + 1).padStart(2, '0')

            return (
              <Station
                key={habit.id}
                $complete={isComplete}
                onClick={() => navigate(`/habit/${habit.id}`)}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.42, delay: index * 0.055 }}
              >
                {isCountHabit ? (
                  <StaticMarker $complete={isComplete} aria-hidden="true">{stationLabel}</StaticMarker>
                ) : (
                  <StationMarker
                    type="button"
                    $complete={isComplete}
                    aria-label={`${isComplete ? 'Mark as incomplete' : 'Mark as complete'}: ${habit.name}`}
                    onClick={event => {
                      event.stopPropagation()
                      handleToggleHabit(habit.id)
                    }}
                  >
                    {isComplete ? <AppIcon name="check" size={19} stroke={3} /> : stationLabel}
                  </StationMarker>
                )}
                <StationInfo>
                  <HabitIcon $color={habit.color} aria-hidden="true">
                    <AppIcon name={habit.icon} fallbackName={DEFAULT_HABIT_ICON} size={21} />
                  </HabitIcon>
                  <HabitCopy>
                    <HabitName>{habit.name}</HabitName>
                    <HabitMeta><span>{isComplete ? 'Signal active' : 'Awaiting signal'}</span><span>·</span><span>{getHabitStreak(liveHabit)} day streak</span></HabitMeta>
                  </HabitCopy>
                </StationInfo>
                {isCountHabit && <StationControl onClick={event => event.stopPropagation()}><CountStepper habit={liveHabit} /></StationControl>}
              </Station>
            )
          })}
        </CircuitList>
      </Section>

      <Section aria-labelledby="deeper-signal-title">
        <SectionHeader>
          <div><SectionKicker>Route 02 / context</SectionKicker><SectionTitle id="deeper-signal-title">Read the signal</SectionTitle></div>
        </SectionHeader>
        <UtilityGrid>
          <UtilityPanel type="button" $index="A / CAL" onClick={() => navigate('/calendar')}>
            <strong>Open the calendar</strong><AppIcon name="calendar" size={34} />
          </UtilityPanel>
          <UtilityPanel type="button" $signal $index="B / LOG" onClick={() => navigate('/journal')}>
            <strong>Capture a reflection</strong><AppIcon name="notebook" size={34} />
          </UtilityPanel>
        </UtilityGrid>
      </Section>
    </DashboardContainer>
  )
}

export default Dashboard
