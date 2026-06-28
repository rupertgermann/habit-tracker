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
  justify-content: space-around;
  flex: 1;
  padding: ${props => props.theme.spacing.md} 0;
`

const BarGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: ${props => props.$barWidth + props.$spacing}px;
`

const BarsWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  height: ${props => props.$height - 40}px;
  position: relative;
`

const Bar = styled(motion.div)`
  width: ${props => props.$barWidth}px;
  background-color: ${props => {
    if (props.$barType === 'completed') return props.theme.colors.primary
    if (props.$barType === 'missed') return props.theme.colors.destructive
    return props.theme.colors.primary
  }};
  border-radius: ${props => props.theme.borderRadius.small} ${props => props.theme.borderRadius.small} 0 0;
  margin: 0 ${props => props.$spacing / 2}px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 0.8;
    transform: translateY(-2px);
  }
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
  
  ${Bar}:hover & {
    opacity: 1;
  }
`

const Tooltip = styled.div`
  position: absolute;
  background-color: ${props => props.theme.colors.text.primary};
  color: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  ${Bar}:hover & {
    opacity: 1;
  }
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

  const maxValue = Math.max(
    ...data.map(d => Math.max(d.completed || 0, d.missed || 0, d.value || 0)),
    1
  )

  const handleBarHover = (index, event) => {
    if (showTooltips) {
      setHoveredBar({ index, event })
    }
  }

  const handleBarLeave = () => {
    setHoveredBar(null)
  }

  const getBarHeight = (value) => {
    return (value / maxValue) * (height - 40) // 40px for labels
  }

  return (
    <ChartContainer $height={height} className={className} {...props}>
      <BarsContainer>
        {data.map((item, index) => {
          const hasSeparateBars = item.completed !== undefined && item.missed !== undefined
          
          return (
            <BarGroup key={index} $barWidth={barWidth} $spacing={spacing}>
              <BarsWrapper $height={height}>
                {hasSeparateBars ? (
                  <>
                    <Bar
                      $barType="completed"
                      $barWidth={barWidth / 2 - spacing / 2}
                      $spacing={spacing}
                      initial={{ height: 0 }}
                      animate={{ height: getBarHeight(item.completed) }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      onMouseEnter={(e) => handleBarHover(index, e)}
                      onMouseLeave={handleBarLeave}
                    />
                    <Bar
                      $barType="missed"
                      $barWidth={barWidth / 2 - spacing / 2}
                      $spacing={spacing}
                      initial={{ height: 0 }}
                      animate={{ height: getBarHeight(item.missed) }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.05 }}
                      onMouseEnter={(e) => handleBarHover(index, e)}
                      onMouseLeave={handleBarLeave}
                    />
                    {showValues && (
                      <>
                        <ValueLabel>
                          {item.completed}
                        </ValueLabel>
                        <ValueLabel style={{ left: '75%' }}>
                          {item.missed}
                        </ValueLabel>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Bar
                      $barWidth={barWidth}
                      $spacing={spacing}
                      initial={{ height: 0 }}
                      animate={{ height: getBarHeight(item.value || 0) }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      onMouseEnter={(e) => handleBarHover(index, e)}
                      onMouseLeave={handleBarLeave}
                    />
                    {showValues && (
                      <ValueLabel>
                        {item.value || 0}
                      </ValueLabel>
                    )}
                  </>
                )}
                
                {hoveredBar?.index === index && showTooltips && (
                  <Tooltip
                    style={{
                      bottom: `${Math.max(
                        getBarHeight(hasSeparateBars ? item.completed : (item.value || 0)),
                        getBarHeight(hasSeparateBars ? item.missed : 0)
                      ) + 20}px`,
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}
                  >
                    {hasSeparateBars ? (
                      `${item.day}: ${item.completed} completed, ${item.missed} missed`
                    ) : (
                      `${item.label || item.day}: ${item.value || 0}`
                    )}
                  </Tooltip>
                )}
              </BarsWrapper>
              <BarLabel>{item.day || item.label}</BarLabel>
            </BarGroup>
          )
        })}
      </BarsContainer>
    </ChartContainer>
  )
}

export default BarChart
