import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const ChartContainer = styled.div`
  width: 100%;
  height: ${props => props.height}px;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  padding: ${props => props.theme.spacing.md} 0;
  position: relative;
`

const BarGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  flex: 1;
  max-width: ${props => props.barWidth + props.spacing * 2}px;
`

const BarsContainer = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: ${props => props.spacing}px;
  height: ${props => props.height - 40}px;
  width: 100%;
`

const Bar = styled(motion.div)`
  width: ${props => props.barWidth}px;
  background-color: ${props => props.color};
  border-radius: ${props => props.theme.borderRadius.small} ${props => props.theme.borderRadius.small} 0 0;
  position: relative;
  
  ${({ isToday, theme }) =>
    isToday &&
    `
      &::after {
        content: '';
        position: absolute;
        top: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 6px;
        height: 6px;
        background-color: ${theme.colors.primary};
        border-radius: 50%;
      }
    `}
`

const BarLabel = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`

const BarValue = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.primary};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
`

const Tooltip = styled(motion.div)`
  position: absolute;
  background-color: ${props => props.theme.colors.text.primary};
  color: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  pointer-events: none;
  z-index: 10;
  box-shadow: ${props => props.theme.shadows.medium};
  
  ${({ x, y }) => `
    left: ${x}px;
    top: ${y}px;
    transform: translateX(-50%);
  `}
`

const BarChart = ({
  data,
  height = 200,
  barWidth = 24,
  spacing = 8,
  showValues = false,
  showTooltip = true,
  className,
  ...props
}) => {
  const [tooltip, setTooltip] = React.useState(null)

  const maxValue = Math.max(
    ...data.map(d => Math.max(d.completed || 0, d.missed || 0)),
    1 // Ensure we don't divide by zero
  )

  const handleBarHover = (event, dataPoint) => {
    if (!showTooltip) return

    const rect = event.currentTarget.getBoundingClientRect()
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      content: `${dataPoint.day}: ${dataPoint.completed} completed, ${dataPoint.missed} missed`
    })
  }

  const handleBarLeave = () => {
    setTooltip(null)
  }

  return (
    <ChartContainer height={height} className={className} {...props}>
      {data.map((item, index) => (
        <BarGroup key={index}>
          <BarsContainer height={height - 40} spacing={spacing}>
            {item.completed > 0 && (
              <Bar
                barWidth={barWidth}
                height={(item.completed / maxValue) * (height - 40)}
                color="#6CC47C"
                initial={{ height: 0 }}
                animate={{ height: (item.completed / maxValue) * (height - 40) }}
                transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.05 }}
                onMouseEnter={(e) => handleBarHover(e, item)}
                onMouseLeave={handleBarLeave}
                isToday={item.isToday}
              >
                {showValues && (
                  <BarValue>{item.completed}</BarValue>
                )}
              </Bar>
            )}
            {item.missed > 0 && (
              <Bar
                barWidth={barWidth}
                height={(item.missed / maxValue) * (height - 40)}
                color="#F28A8A"
                initial={{ height: 0 }}
                animate={{ height: (item.missed / maxValue) * (height - 40) }}
                transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.05 + 0.1 }}
                onMouseEnter={(e) => handleBarHover(e, item)}
                onMouseLeave={handleBarLeave}
                isToday={item.isToday}
              >
                {showValues && (
                  <BarValue>{item.missed}</BarValue>
                )}
              </Bar>
            )}
          </BarsContainer>
          <BarLabel>{item.day}</BarLabel>
        </BarGroup>
      ))}
      
      {tooltip && (
        <Tooltip
          x={tooltip.x}
          y={tooltip.y}
          initial={{ opacity: 0, y: tooltip.y + 5 }}
          animate={{ opacity: 1, y: tooltip.y }}
          exit={{ opacity: 0, y: tooltip.y + 5 }}
        >
          {tooltip.content}
        </Tooltip>
      )}
    </ChartContainer>
  )
}

export default BarChart