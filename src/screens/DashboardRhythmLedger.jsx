// Preserved from design snapshot 7c9a357e5f9fb6191abb4640dd256eb8272a8b31.
import React, { useMemo, useState } from 'react'
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
import { DEFAULT_HABIT_ICON } from '../domain/iconCatalog'

const DashboardContainer = styled.div`
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: clamp(22px, 5vw, 64px) clamp(16px, 5vw, 64px) 96px;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    padding-bottom: 64px;
  }
`

const PageHeader = styled.header`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 20px;
  padding-bottom: clamp(20px, 3vw, 36px);
  border-bottom: 2px solid ${props => props.theme.colors.borderStrong};
`

const Eyebrow = styled.p`
  margin: 0 0 10px;
  color: ${props => props.theme.colors.primary};
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
`

const Title = styled.h1`
  margin: 0;
  font-size: clamp(3.25rem, 10vw, 7.5rem);
  letter-spacing: -0.075em;
`

const DateBlock = styled.div`
  min-width: 145px;
  padding-left: 18px;
  border-left: 1px solid ${props => props.theme.colors.border};

  @media (max-width: 540px) {
    display: none;
  }
`

const DateText = styled.p`
  margin: 0;
  color: ${props => props.theme.colors.text.secondary};
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  line-height: 1.6;
  text-transform: uppercase;
`

const HeroGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
  margin: clamp(22px, 4vw, 48px) 0 52px;

  @media (min-width: 800px) {
    grid-template-columns: minmax(0, 1.65fr) minmax(240px, 0.72fr);
    align-items: stretch;
  }
`

const ProgressBoard = styled(motion.section)`
  position: relative;
  overflow: hidden;
  min-height: 430px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 32px;
  padding: clamp(22px, 4vw, 44px);
  background: ${props => props.theme.colors.text.primary};
  color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.text.primary};
  box-shadow: ${props => props.theme.shadows.strong};

  &::after {
    content: '';
    position: absolute;
    width: 180px;
    height: 180px;
    right: -78px;
    top: -78px;
    border: 1px solid ${props => props.theme.colors.background}55;
    border-radius: 50%;
    box-shadow:
      0 0 0 30px ${props => props.theme.colors.background}08,
      0 0 0 60px ${props => props.theme.colors.background}06;
    pointer-events: none;
  }

  @media (min-width: 620px) {
    grid-template-columns: minmax(210px, 0.8fr) minmax(0, 1.2fr);
    align-items: center;
  }
`

const ProgressSummary = styled.div`
  position: relative;
  z-index: 1;
`

const BoardLabel = styled.p`
  margin: 0 0 18px;
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.7;
`

const ProgressDial = styled.div`
  --progress: ${props => props.$progress};
  position: relative;
  width: clamp(190px, 30vw, 280px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at center, ${props => props.theme.colors.text.primary} 0 58%, transparent 59%),
    conic-gradient(${props => props.theme.colors.primary} calc(var(--progress) * 1%), ${props => props.theme.colors.background}26 0);
  border-radius: 50%;

  &::before {
    content: '';
    position: absolute;
    inset: 12%;
    border: 1px solid ${props => props.theme.colors.background}33;
    border-radius: 50%;
  }
`

const DialText = styled.div`
  position: relative;
  text-align: center;
`

const DialValue = styled.strong`
  display: block;
  color: ${props => props.theme.colors.background};
  font-family: ${props => props.theme.typography.displayFamily};
  font-size: clamp(3rem, 8vw, 5.6rem);
  line-height: 0.9;
  letter-spacing: -0.07em;
`

const DialLabel = styled.span`
  display: block;
  margin-top: 12px;
  color: ${props => props.theme.colors.background};
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.68;
`

const RhythmArea = styled.div`
  position: relative;
  z-index: 1;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
`

const RhythmHeading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${props => props.theme.colors.background}33;
`

const RhythmTitle = styled.h2`
  margin: 0;
  color: ${props => props.theme.colors.background};
  font-size: clamp(1.65rem, 4vw, 2.8rem);
`

const RhythmHint = styled.span`
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: 0.6rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.58;
`

const RhythmRail = styled.div`
  height: 190px;
  display: grid;
  grid-template-columns: repeat(7, minmax(22px, 1fr));
  align-items: end;
  gap: clamp(5px, 1vw, 11px);
  padding-top: 24px;
  border-bottom: 1px solid ${props => props.theme.colors.background}66;
`

const RhythmDay = styled.div`
  height: 100%;
  min-width: 0;
  display: grid;
  grid-template-rows: 1fr auto;
  align-items: end;
  gap: 10px;
`

const RhythmBar = styled(motion.div)`
  width: 100%;
  min-height: 8px;
  height: ${props => Math.max(8, props.$level)}%;
  background: ${props => props.$today ? props.theme.colors.secondary : props.theme.colors.primary};
  border: 1px solid ${props => props.theme.colors.background}55;
`

const RhythmDayLabel = styled.span`
  overflow: hidden;
  color: ${props => props.$today ? props.theme.colors.secondary : props.theme.colors.background};
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-align: center;
  text-overflow: ellipsis;
  text-transform: uppercase;
`

const BoardStats = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 24px;
`

const BoardStat = styled.div`
  padding-top: 12px;
  border-top: 1px solid ${props => props.theme.colors.background}33;

  dt {
    margin-top: 4px;
    font-family: ${props => props.theme.typography.monoFamily};
    font-size: 0.58rem;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    opacity: 0.62;
  }

  dd {
    color: ${props => props.theme.colors.background};
    font-family: ${props => props.theme.typography.displayFamily};
    font-size: 2rem;
    font-weight: 800;
    line-height: 1;
  }
`

const FieldNote = styled(motion.aside)`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 300px;
  padding: clamp(24px, 4vw, 38px);
  background: ${props => props.theme.colors.secondary};
  color: #201D18;
  border: 1px solid #201D18;
  box-shadow: ${props => props.theme.shadows.medium};

  &::before {
    content: '';
    position: absolute;
    top: 16px;
    right: 16px;
    width: 13px;
    height: 13px;
    border: 1px solid #201D18;
    border-radius: 50%;
    background: ${props => props.theme.colors.background};
  }
`

const NoteNumber = styled.span`
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
`

const NoteCopy = styled.div`
  margin: 42px 0;

  h2 {
    margin: 0 0 16px;
    font-size: clamp(2rem, 5vw, 3.7rem);
    letter-spacing: -0.055em;
  }

  p {
    max-width: 30ch;
    margin: 0;
    font-size: 0.92rem;
    line-height: 1.65;
  }
`

const NoteAction = styled.button`
  align-self: flex-start;
  min-height: 44px;
  padding: 0;
  background: transparent;
  color: #201D18;
  border-bottom: 2px solid currentColor;
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.11em;
  text-transform: uppercase;

  &:hover { transform: translateX(4px); }
  &:active { transform: translateX(4px) translateY(2px); }
`

const Section = styled.section`
  margin-bottom: 56px;
`

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid ${props => props.theme.colors.borderStrong};
`

const SectionTitle = styled.h2`
  margin: 0;
`

const SectionIndex = styled.span`
  display: block;
  margin-bottom: 5px;
  color: ${props => props.theme.colors.primary};
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`

const HabitsList = styled.div`
  display: grid;
  gap: 10px;
`

const HabitItem = styled(motion.article)`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  min-height: 92px;
  padding: 15px 16px 15px 20px;
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-left: 7px solid ${props => props.$color || props.theme.colors.primary};
  box-shadow: ${props => props.theme.shadows.subtle};
  cursor: pointer;

  &:hover {
    border-color: ${props => props.theme.colors.borderStrong};
    transform: translateX(5px);
  }

  &:active { transform: translateX(5px) translateY(2px); }
  &:focus-within { border-color: ${props => props.theme.colors.focus}; }

  @media (min-width: 700px) {
    padding: 18px 22px 18px 26px;
  }
`

const HabitInfo = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 14px;
`

const HabitIcon = styled.span`
  width: 50px;
  height: 50px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  background: ${props => props.$color || props.theme.colors.primary}18;
  color: ${props => props.$color || props.theme.colors.primary};
  border: 1px solid currentColor;
`

const HabitDetails = styled.div`
  min-width: 0;
`

const HabitName = styled.h3`
  overflow: hidden;
  margin: 0 0 7px;
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: clamp(1rem, 2vw, 1.2rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const HabitMeta = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${props => props.theme.colors.text.secondary};
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: 0.66rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`

const CheckButton = styled(motion.button)`
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: ${props => props.$checked ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.$checked ? props.theme.colors.onPrimary : props.theme.colors.text.primary};
  border: 1px solid ${props => props.$checked ? props.theme.colors.primary : props.theme.colors.borderStrong};

  &:hover:not(:disabled) {
    background: ${props => props.$checked ? props.theme.colors.primaryHover : props.theme.colors.surfaceAlt};
  }
`

const UtilityGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;

  @media (min-width: 700px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

const UtilityPanel = styled.button`
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text.primary};
  border: 1px solid ${props => props.theme.colors.border};
  text-align: left;
  box-shadow: ${props => props.theme.shadows.subtle};

  &:hover {
    border-color: ${props => props.theme.colors.borderStrong};
    box-shadow: ${props => props.theme.shadows.medium};
    transform: translateY(-3px);
  }

  &:active { transform: translateY(1px); }

  span {
    font-family: ${props => props.theme.typography.monoFamily};
    font-size: 0.64rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  strong {
    max-width: 14ch;
    font-family: ${props => props.theme.typography.displayFamily};
    font-size: clamp(1.65rem, 4vw, 2.5rem);
    line-height: 1;
    letter-spacing: -0.04em;
  }
`

const StatusPanel = styled.div`
  max-width: 720px;
  margin: 64px auto 0;
  padding: clamp(28px, 6vw, 64px);
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.borderStrong};
  box-shadow: ${props => props.theme.shadows.strong};
  text-align: center;

  h2 { margin-bottom: 14px; }
  p { color: ${props => props.theme.colors.text.secondary}; }
`

const LoadingRule = styled.div`
  height: 12px;
  margin: 14px 0;
  background: linear-gradient(90deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.surfaceAlt}, ${props => props.theme.colors.primary});
  background-size: 220% 100%;
  animation: loading-rule 1.4s linear infinite;

  @keyframes loading-rule {
    to { background-position: -220% 0; }
  }
`

const entrance = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 }
}

const Dashboard = () => {
  const navigate = useNavigate()
  const {
    dashboardHabitTracking,
    isLoading,
    hasLoaded,
    error
  } = useHabits()
  const { weekStartsOn } = usePreferences()
  const { showSuccessToast, showErrorToast } = useToast()
  const [showConfetti, setShowConfetti] = useState(false)
  const referenceDate = new Date()
  const {
    todayHabits,
    weeklyCompletionFacts: weeklyData,
    totalHabits,
    todayCompletedCount: completedToday,
    completionRate,
    topCurrentStreak
  } = dashboardHabitTracking.getSnapshot({ referenceDate, weekStartsOn })
  const maxWeeklyHabits = Math.max(totalHabits, 1)

  const issueNumber = useMemo(() => format(new Date(), "II/'W'II"), [])

  const handleToggleHabit = async habitId => {
    const habit = todayHabits.find(item => item.id === habitId)
    if (!habit) return { ok: false }

    const result = await dashboardHabitTracking.toggleYesNo({
      habitId,
      referenceDate: new Date()
    })

    if (!result.ok) {
      showErrorToast(`Could not update "${habit.name}". Please try again.`)
      return result
    }

    if (result.completionState === 'complete') {
      showSuccessToast(`"${habit.name}" is in the record.`)
      if (result.allComplete) {
        setShowConfetti(true)
        showSuccessToast('The page is complete. Every habit is logged.')
      } else if (result.intermediateMilestone) {
        setShowConfetti(true)
      }
    }

    return result
  }

  const motivationalMessage = (() => {
    if (completionRate === 100) return { title: 'A full page.', text: 'Every practice made its mark today. Leave the record as proof.' }
    if (completionRate >= 75) return { title: 'Nearly inked.', text: 'The shape of the day is clear. One deliberate pass will close it.' }
    if (topCurrentStreak >= 7) return { title: 'The rhythm holds.', text: `${topCurrentStreak} days of evidence. Protect the ordinary action that keeps it alive.` }
    if (completionRate >= 50) return { title: 'Past the middle.', text: 'Enough is done to create momentum. Choose the smallest next mark.' }
    return { title: 'Begin where you are.', text: 'A useful record starts with one honest completion, not a perfect plan.' }
  })()

  if (isLoading && !hasLoaded) {
    return (
      <DashboardContainer aria-busy="true">
        <PageHeader>
          <div><Eyebrow>Opening the daily record</Eyebrow><Title>Dashboard</Title></div>
        </PageHeader>
        <StatusPanel>
          <BoardLabel>Syncing with your private ledger</BoardLabel>
          <LoadingRule />
          <LoadingRule style={{ width: '72%', marginInline: 'auto' }} />
          <span className="sr-only">Loading habits</span>
        </StatusPanel>
      </DashboardContainer>
    )
  }

  if (error) {
    return (
      <DashboardContainer>
        <PageHeader>
          <div><Eyebrow>Record unavailable</Eyebrow><Title>Dashboard</Title></div>
        </PageHeader>
        <StatusPanel role="alert">
          <AppIcon name="cloud-off" size={40} />
          <h2>The ledger is offline.</h2>
          <p>Your habits are still yours. Reconnect to the local service, then reopen today’s page.</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </StatusPanel>
      </DashboardContainer>
    )
  }

  if (totalHabits === 0) {
    return (
      <DashboardContainer>
        <PageHeader>
          <div><Eyebrow>Daily record · {issueNumber}</Eyebrow><Title>Dashboard</Title></div>
          <DateBlock><DateText>{format(new Date(), 'EEEE')}<br />{format(new Date(), 'MMMM d, yyyy')}</DateText></DateBlock>
        </PageHeader>
        <EmptyState
          type="habits"
          title="Your first mark starts here"
          description="Choose one recurring behavior worth noticing. The record grows from there."
          actionText="Create Your First Habit"
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
          <Eyebrow>Daily record · {issueNumber}</Eyebrow>
          <Title>Dashboard</Title>
        </div>
        <DateBlock>
          <DateText>{format(new Date(), 'EEEE')}<br />{format(new Date(), 'MMMM d, yyyy')}</DateText>
        </DateBlock>
      </PageHeader>

      <HeroGrid>
        <ProgressBoard
          aria-labelledby="today-progress-title"
          variants={entrance}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6 }}
        >
          <ProgressSummary>
            <BoardLabel id="today-progress-title">Today’s progress</BoardLabel>
            <ProgressDial
              $progress={completionRate}
              role="img"
              aria-label={`${completionRate}% complete, ${completedToday} of ${totalHabits} habits`}
            >
              <DialText>
                <DialValue>{completionRate}%</DialValue>
                <DialLabel>{completedToday} / {totalHabits} habits</DialLabel>
              </DialText>
            </ProgressDial>
          </ProgressSummary>

          <RhythmArea>
            <RhythmHeading>
              <RhythmTitle>Seven-day rhythm</RhythmTitle>
              <RhythmHint>Completed habits</RhythmHint>
            </RhythmHeading>
            <RhythmRail aria-label="Weekly completion rhythm">
              {weeklyData.map((day, index) => {
                const level = (day.completed / maxWeeklyHabits) * 100
                return (
                  <RhythmDay key={day.date} title={`${day.day}: ${day.completed} of ${totalHabits} habits`}>
                    <RhythmBar
                      $level={level}
                      $today={day.isToday}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(8, level)}%` }}
                      transition={{ duration: 0.55, delay: 0.08 * index }}
                    />
                    <RhythmDayLabel $today={day.isToday}>{day.day}</RhythmDayLabel>
                  </RhythmDay>
                )
              })}
            </RhythmRail>
            <BoardStats>
              <BoardStat><dd>{totalHabits}</dd><dt>Total Habits</dt></BoardStat>
              <BoardStat><dd>{topCurrentStreak}</dd><dt>Longest live streak</dt></BoardStat>
            </BoardStats>
          </RhythmArea>
        </ProgressBoard>

        <FieldNote
          variants={entrance}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6, delay: 0.12 }}
        >
          <NoteNumber>Field note · {String(completedToday + 1).padStart(2, '0')}</NoteNumber>
          <NoteCopy>
            <h2>{motivationalMessage.title}</h2>
            <p>{motivationalMessage.text}</p>
          </NoteCopy>
          <NoteAction onClick={() => navigate('/progress')}>Read the pattern →</NoteAction>
        </FieldNote>
      </HeroGrid>

      <Section aria-labelledby="todays-habits-title">
        <SectionHeader>
          <div>
            <SectionIndex>01 · The practice</SectionIndex>
            <SectionTitle id="todays-habits-title">Today’s Habits</SectionTitle>
          </div>
          <Button variant="ghost" onClick={() => navigate('/habits')}>View All</Button>
        </SectionHeader>
        <HabitsList>
          {todayHabits.map((habit, index) => {
            return (
              <HabitItem
                key={habit.id}
                data-habit-id={habit.id}
                $color={habit.color}
                onClick={() => navigate(`/habit/${habit.id}`)}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
              >
                <HabitInfo>
                  <HabitIcon $color={habit.color} aria-hidden="true">
                    <AppIcon name={habit.icon} fallbackName={DEFAULT_HABIT_ICON} size={23} />
                  </HabitIcon>
                  <HabitDetails>
                    <HabitName>{habit.name}</HabitName>
                    <HabitMeta><AppIcon name="flame" size={14} /> {habit.currentStreak} day streak</HabitMeta>
                  </HabitDetails>
                </HabitInfo>
                {habit.type === 'count' ? (
                  <CountStepper habit={habit} />
                ) : (
                  <CheckButton
                    $checked={habit.isCompleted}
                    aria-label={`${habit.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}: ${habit.name}`}
                    onClick={event => {
                      event.stopPropagation()
                      handleToggleHabit(habit.id)
                    }}
                    whileTap={{ scale: 0.92 }}
                  >
                    {habit.isCompleted ? <AppIcon name="check" size={20} stroke={2.5} /> : <AppIcon name="plus" size={18} />}
                  </CheckButton>
                )}
              </HabitItem>
            )
          })}
        </HabitsList>
      </Section>

      <Section aria-labelledby="next-pages-title">
        <SectionHeader>
          <div>
            <SectionIndex>02 · The record</SectionIndex>
            <SectionTitle id="next-pages-title">Look beyond today</SectionTitle>
          </div>
        </SectionHeader>
        <UtilityGrid>
          <UtilityPanel onClick={() => navigate('/calendar')}>
            <span>Calendar · Seven-day evidence</span>
            <strong>See where the rhythm holds.</strong>
            <AppIcon name="arrow-up-right" size={24} />
          </UtilityPanel>
          <UtilityPanel onClick={() => navigate('/journal')}>
            <span>Journal · Reflection</span>
            <strong>Put the progress into words.</strong>
            <AppIcon name="arrow-up-right" size={24} />
          </UtilityPanel>
        </UtilityGrid>
      </Section>
    </DashboardContainer>
  )
}

export default Dashboard
