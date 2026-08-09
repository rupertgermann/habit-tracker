import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const ChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: ${props => props.$height || 200}px;
  width: 100%;
  position: relative;
`

const BarsContainer = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: ${props => props.$scrollable ? 'flex-start' : 'space-around'};
  flex: 1;
  padding: ${props => props.theme.spacing.md} 0;
  overflow-x: auto;
  overflow-y: hidden;
`

const BarGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: ${props => props.$interactive
    ? `0 0 ${88 + props.$spacing * 2}px`
    : '1'};
  max-width: ${props => props.$interactive
    ? `${88 + props.$spacing * 2}px`
    : `${props.$barWidth + props.$spacing}px`};
`

const BarsWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  height: ${props => props.$height - 40}px;
  position: relative;
`

const BarTarget = styled.div`
  width: ${props => props.$barWidth}px;
  height: ${props => Math.max(props.$targetHeight, 44)}px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
  margin: 0 ${props => props.$spacing / 2}px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 0.8;
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 3px solid ${props => props.theme.colors.primary};
    outline-offset: 2px;
    opacity: 0.85;
    transform: translateY(-2px);
  }
`

const BarFill = styled(motion.div)`
  width: ${props => props.$fillWidth || '100%'};
  background-color: ${props => {
    if (props.$barType === 'completed') return props.theme.colors.primary
    if (props.$barType === 'missed') return props.theme.colors.destructive
    return props.theme.colors.primary
  }};
  border-radius: ${props => props.theme.borderRadius.small} ${props => props.theme.borderRadius.small} 0 0;
  min-height: ${props => props.$value === 0 ? 2 : 0}px;
  pointer-events: none;
`

const BarLabel = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
  margin-top: ${props => props.theme.spacing.sm};
  text-align: center;
`

const ValueLabel = styled.span`
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.text.primary};
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  ${BarTarget}:hover & {
    opacity: 1;
  }
`

const Tooltip = styled.div`
  position: absolute;
  top: ${props => props.theme.spacing.xs};
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: calc(100% - ${props => props.theme.spacing.md});
  background-color: ${props => props.theme.colors.text.primary};
  color: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  white-space: normal;
  text-align: left;
  z-index: 10;
  pointer-events: none;
  box-shadow: 0 8px 24px rgb(0 0 0 / 20%);
`

const TooltipTitle = styled.strong`
  display: block;
  margin-bottom: ${props => props.theme.spacing.xs};
`

const TooltipDetails = styled.span`
  display: block;
  color: ${props => props.theme.colors.white};
`

const BarChart = ({
  data = [],
  height = 200,
  barWidth = 24,
  spacing = 8,
  showValues = true,
  showTooltips = true,
  className,
  ...props
}) => {
  const [hoveredBar, setHoveredBar] = React.useState(null)
  const barsRef = React.useRef(null)

  const maxValue = Math.max(
    ...data.map(d => Math.max(d.completed || 0, d.missed || 0, d.value || 0)),
    1
  )

  const handleBarHover = (index, type) => {
    if (showTooltips) {
      setHoveredBar({ index, type })
    }
  }

  const handleBarLeave = () => {
    setHoveredBar(null)
  }

  const getBarHeight = (value) => {
    return (value / maxValue) * (height - 40) // 40px for labels
  }

  const getHabitNames = (item, type) => {
    const habits = item[`${type}Habits`]
    return Array.isArray(habits) ? habits.map(habit => habit.name) : null
  }

  const getBarAriaLabel = (item, type) => {
    const names = getHabitNames(item, type)
    const label = item.day || item.label

    if (names) return `${label} ${type}: ${names.join(', ') || 'None'}`
    return `${label} ${type}: ${item[type] || 0}`
  }

  const activeItem = hoveredBar ? data[hoveredBar.index] : null
  const activeNames = activeItem ? getHabitNames(activeItem, hoveredBar.type) : null
  const hasInteractiveHabitBars = data.some(item =>
    Array.isArray(item.completedHabits) && Array.isArray(item.missedHabits)
  )

  React.useLayoutEffect(() => {
    const bars = barsRef.current
    const todayIndex = data.findIndex(item => item.isToday)
    const todayGroup = todayIndex >= 0 ? bars?.children[todayIndex] : null
    if (!bars || !todayGroup || bars.scrollWidth <= bars.clientWidth) return

    bars.scrollLeft = Math.max(
      0,
      Math.min(
        todayGroup.offsetLeft - (bars.clientWidth - todayGroup.offsetWidth) / 2,
        bars.scrollWidth - bars.clientWidth
      )
    )
  }, [data, hasInteractiveHabitBars])

  return (
    <ChartContainer $height={height} className={className} {...props}>
      <BarsContainer ref={barsRef} $scrollable={hasInteractiveHabitBars}>
        {data.map((item, index) => {
          const hasSeparateBars = item.completed !== undefined && item.missed !== undefined
          const hasHabitIdentity = Array.isArray(item.completedHabits) &&
            Array.isArray(item.missedHabits)
          
          return (
            <BarGroup
              key={index}
              $barWidth={barWidth}
              $spacing={spacing}
              $interactive={hasHabitIdentity}
              role={hasHabitIdentity ? undefined : 'img'}
              aria-label={!hasHabitIdentity && hasSeparateBars
                ? `${item.day || item.label}: ${item.completed} completed, ${item.missed} missed`
                : !hasHabitIdentity
                  ? `${item.label || item.day}: ${item.value || 0}`
                  : undefined}
            >
              <BarsWrapper $height={height}>
                {hasSeparateBars ? (
                  <>
                    <BarTarget
                      $barWidth={hasHabitIdentity ? 44 : barWidth / 2 - spacing / 2}
                      $spacing={spacing}
                      $targetHeight={getBarHeight(item.completed)}
                      role={hasHabitIdentity ? 'img' : undefined}
                      tabIndex={hasHabitIdentity ? 0 : undefined}
                      aria-label={hasHabitIdentity ? getBarAriaLabel(item, 'completed') : undefined}
                      onMouseEnter={() => handleBarHover(index, hasHabitIdentity ? 'completed' : 'summary')}
                      onMouseLeave={handleBarLeave}
                      onFocus={hasHabitIdentity
                        ? () => handleBarHover(index, 'completed')
                        : undefined}
                      onBlur={hasHabitIdentity ? handleBarLeave : undefined}
                    >
                      <BarFill
                        $barType="completed"
                        $value={item.completed}
                        $fillWidth={`${barWidth / 2 - spacing / 2}px`}
                        initial={{ height: 0 }}
                        animate={{ height: getBarHeight(item.completed) }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      />
                      {showValues && <ValueLabel>{item.completed}</ValueLabel>}
                    </BarTarget>
                    <BarTarget
                      $barWidth={hasHabitIdentity ? 44 : barWidth / 2 - spacing / 2}
                      $spacing={spacing}
                      $targetHeight={getBarHeight(item.missed)}
                      role={hasHabitIdentity ? 'img' : undefined}
                      tabIndex={hasHabitIdentity ? 0 : undefined}
                      aria-label={hasHabitIdentity ? getBarAriaLabel(item, 'missed') : undefined}
                      onMouseEnter={() => handleBarHover(index, hasHabitIdentity ? 'missed' : 'summary')}
                      onMouseLeave={handleBarLeave}
                      onFocus={hasHabitIdentity
                        ? () => handleBarHover(index, 'missed')
                        : undefined}
                      onBlur={hasHabitIdentity ? handleBarLeave : undefined}
                    >
                      <BarFill
                        $barType="missed"
                        $value={item.missed}
                        $fillWidth={`${barWidth / 2 - spacing / 2}px`}
                        initial={{ height: 0 }}
                        animate={{ height: getBarHeight(item.missed) }}
                        transition={{ duration: 0.5, delay: index * 0.1 + 0.05 }}
                      />
                      {showValues && <ValueLabel>{item.missed}</ValueLabel>}
                    </BarTarget>
                  </>
                ) : (
                  <>
                    <BarTarget
                      $barWidth={barWidth}
                      $spacing={spacing}
                      $targetHeight={getBarHeight(item.value || 0)}
                      onMouseEnter={() => handleBarHover(index, 'value')}
                      onMouseLeave={handleBarLeave}
                    >
                      <BarFill
                        $value={item.value || 0}
                        initial={{ height: 0 }}
                        animate={{ height: getBarHeight(item.value || 0) }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      />
                      {showValues && <ValueLabel>{item.value || 0}</ValueLabel>}
                    </BarTarget>
                  </>
                )}
                
              </BarsWrapper>
              <BarLabel>{item.day || item.label}</BarLabel>
            </BarGroup>
          )
        })}
      </BarsContainer>
      {activeItem && showTooltips && (
        <Tooltip role="tooltip">
          <TooltipTitle>
            {hoveredBar.type === 'value'
              ? activeItem.label || activeItem.day
              : hoveredBar.type === 'summary'
                ? activeItem.day || activeItem.label
              : `${hoveredBar.type === 'completed' ? 'Completed' : 'Missed'} · ${activeItem.day || activeItem.label}`}
          </TooltipTitle>
          <TooltipDetails>
            {activeNames
              ? activeNames.join(', ') || (hoveredBar.type === 'completed'
                ? 'No completed Habits'
                : 'No missed Habits')
              : hoveredBar.type === 'value'
                ? activeItem.value || 0
                : hoveredBar.type === 'summary'
                  ? `${activeItem.completed} completed, ${activeItem.missed} missed`
                : activeItem[hoveredBar.type] || 0}
          </TooltipDetails>
        </Tooltip>
      )}
    </ChartContainer>
  )
}

export default BarChart
