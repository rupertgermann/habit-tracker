import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const ChartContainer = styled.div`
  width: 100%;
  height: ${props => props.height}px;
  position: relative;
  padding: ${props => props.theme.spacing.md};
`

const SvgContainer = styled.svg`
  width: 100%;
  height: 100%;
  overflow: visible;
`

const GridLine = styled.line`
  stroke: ${props => props.theme.colors.border};
  stroke-width: 1;
  stroke-dasharray: 2, 2;
`

const AxisLine = styled.line`
  stroke: ${props => props.theme.colors.text.secondary};
  stroke-width: 1;
`

const LinePath = styled(motion.path)`
  fill: none;
  stroke: ${props => props.color || props.theme.colors.primary};
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
`

const AreaPath = styled(motion.path)`
  fill: ${props => props.color || props.theme.colors.primary};
  fill-opacity: 0.1;
`

const Dot = styled(motion.circle)`
  fill: ${props => props.color || props.theme.colors.primary};
  stroke: ${props => props.theme.colors.white};
  stroke-width: 2;
  cursor: pointer;
  
  &:hover {
    r: 6;
  }
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
  white-space: nowrap;
`

const YAxisLabel = styled.text`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  fill: ${props => props.theme.colors.text.secondary};
  text-anchor: end;
`

const XAxisLabel = styled.text`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  fill: ${props => props.theme.colors.text.secondary};
  text-anchor: middle;
`

const LineChart = ({
  data,
  height = 200,
  color,
  showDots = true,
  showArea = true,
  showGrid = true,
  showTooltip = true,
  className,
  ...props
}) => {
  const [tooltip, setTooltip] = React.useState(null)

  const padding = {
    top: 20,
    right: 20,
    bottom: 30,
    left: 40
  }

  const chartWidth = 1000
  const chartHeight = height - padding.top - padding.bottom

  const maxValue = Math.max(...data.map(d => d.value), 1)
  const minValue = Math.min(...data.map(d => d.value), 0)

  const xScale = (index) => {
    return padding.left + (index / (data.length - 1)) * (chartWidth - padding.left - padding.right)
  }

  const yScale = (value) => {
    return padding.top + (1 - (value - minValue) / (maxValue - minValue)) * chartHeight
  }

  const linePath = data.reduce((path, point, index) => {
    const x = xScale(index)
    const y = yScale(point.value)
    return `${path}${index === 0 ? 'M' : 'L'} ${x} ${y} `
  }, '')

  const areaPath = `${linePath} L ${xScale(data.length - 1)} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`

  const handleDotHover = (event, point) => {
    if (!showTooltip) return

    const rect = event.currentTarget.getBoundingClientRect()
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      content: `${point.label || point.date}: ${point.value}%`
    })
  }

  const handleDotLeave = () => {
    setTooltip(null)
  }

  const gridLines = []
  if (showGrid) {
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (i / 5) * chartHeight
      gridLines.push(
        <GridLine
          key={`grid-${i}`}
          x1={padding.left}
          y1={y}
          x2={chartWidth - padding.right}
          y2={y}
        />
      )
    }
  }

  const yAxisLabels = []
  for (let i = 0; i <= 5; i++) {
    const value = minValue + (maxValue - minValue) * (1 - i / 5)
    const y = padding.top + (i / 5) * chartHeight
    yAxisLabels.push(
      <YAxisLabel
        key={`label-${i}`}
        x={padding.left - 10}
        y={y + 4}
      >
        {Math.round(value)}%
      </YAxisLabel>
    )
  }

  const xAxisLabels = data.map((point, index) => {
    const x = xScale(index)
    return (
      <XAxisLabel
        key={`x-label-${index}`}
        x={x}
        y={height - 10}
      >
        {point.label || point.day || index + 1}
      </XAxisLabel>
    )
  })

  return (
    <ChartContainer height={height} className={className} {...props}>
      <SvgContainer viewBox={`0 0 ${chartWidth} ${height}`}>
        {/* Grid lines */}
        {gridLines}
        
        {/* Axes */}
        <AxisLine
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={chartWidth - padding.right}
          y2={padding.top + chartHeight}
        />
        <AxisLine
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartHeight}
        />
        
        {/* Y-axis labels */}
        {yAxisLabels}
        
        {/* X-axis labels */}
        {xAxisLabels}
        
        {/* Area */}
        {showArea && (
          <AreaPath
            d={areaPath}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        )}
        
        {/* Line */}
        <LinePath
          d={linePath}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
        
        {/* Dots */}
        {showDots && data.map((point, index) => (
          <Dot
            key={`dot-${index}`}
            cx={xScale(index)}
            cy={yScale(point.value)}
            r={4}
            color={color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onMouseEnter={(e) => handleDotHover(e, point)}
            onMouseLeave={handleDotLeave}
          />
        ))}
      </SvgContainer>
      
      {tooltip && (
        <Tooltip
          initial={{ opacity: 0, y: tooltip.y + 5 }}
          animate={{ opacity: 1, y: tooltip.y }}
          exit={{ opacity: 0, y: tooltip.y + 5 }}
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%)'
          }}
        >
          {tooltip.content}
        </Tooltip>
      )}
    </ChartContainer>
  )
}

export default LineChart
 