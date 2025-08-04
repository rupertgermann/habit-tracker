import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const ChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: ${props => props.height || 200}px;
  width: 100%;
  position: relative;
`

const SvgContainer = styled.svg`
  flex: 1;
  width: 100%;
  height: ${props => props.height - 40}px;
`

const GridLine = styled.line`
  stroke: ${props => props.theme.colors.border};
  stroke-width: 1;
  stroke-dasharray: 2, 2;
`

const Area = styled(motion.path)`
  fill: ${props => props.color || props.theme.colors.primary};
  fill-opacity: ${props => props.areaOpacity || 0.1};
`

const Line = styled(motion.path)`
  fill: none;
  stroke: ${props => props.color || props.theme.colors.primary};
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
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

const XAxis = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0 ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.sm};
`

const XAxisLabel = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
`

const YAxis = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  height: ${props => props.height - 40}px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.sm} 0;
`

const YAxisLabel = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
  text-align: right;
  padding-right: ${props => props.theme.spacing.sm};
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
  
  ${Dot}:hover + & {
    opacity: 1;
  }
`

const LineChart = ({
  data = [],
  height = 200,
  color,
  showDots = true,
  showArea = true,
  showGrid = true,
  showAxes = true,
  areaOpacity = 0.1,
  className,
  ...props
}) => {
  const [hoveredPoint, setHoveredPoint] = React.useState(null)
  const svgRef = React.useRef(null)
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 })

  React.useEffect(() => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect()
      setDimensions({
        width: rect.width,
        height: rect.height
      })
    }
  }, [height])

  const padding = {
    top: 20,
    right: 20,
    bottom: 20,
    left: showAxes ? 40 : 20
  }

  const chartWidth = dimensions.width - padding.left - padding.right
  const chartHeight = dimensions.height - padding.top - padding.bottom

  const maxValue = Math.max(...data.map(d => d.value || 0), 1)
  const minValue = Math.min(...data.map(d => d.value || 0), 0)

  const getXPosition = (index) => {
    return padding.left + (index / (data.length - 1)) * chartWidth
  }

  const getYPosition = (value) => {
    return padding.top + (1 - (value - minValue) / (maxValue - minValue)) * chartHeight
  }

  const handleDotHover = (point, event) => {
    setHoveredPoint({ point, event })
  }

  const handleDotLeave = () => {
    setHoveredPoint(null)
  }

  const generatePath = () => {
    if (data.length < 2) return ''

    let path = `M ${getXPosition(0)} ${getYPosition(data[0].value)}`
    
    for (let i = 1; i < data.length; i++) {
      const x1 = getXPosition(i - 1)
      const y1 = getYPosition(data[i - 1].value)
      const x2 = getXPosition(i)
      const y2 = getYPosition(data[i].value)
      
      const controlX1 = x1 + (x2 - x1) / 2
      const controlY1 = y1
      const controlX2 = x1 + (x2 - x1) / 2
      const controlY2 = y2
      
      path += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${x2} ${y2}`
    }
    
    return path
  }

  const generateAreaPath = () => {
    if (data.length < 2) return ''

    const linePath = generatePath()
    const lastX = getXPosition(data.length - 1)
    const lastY = getYPosition(data[data.length - 1].value)
    const firstX = getXPosition(0)
    const bottomY = padding.top + chartHeight
    
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`
  }

  const generateGridLines = () => {
    const lines = []
    const gridLineCount = 5
    
    for (let i = 0; i <= gridLineCount; i++) {
      const y = padding.top + (i / gridLineCount) * chartHeight
      const value = maxValue - (i / gridLineCount) * (maxValue - minValue)
      
      lines.push(
        <GridLine
          key={`grid-${i}`}
          x1={padding.left}
          y1={y}
          x2={padding.left + chartWidth}
          y2={y}
        />
      )
    }
    
    return lines
  }

  const generateYAxisLabels = () => {
    const labels = []
    const labelCount = 5
    
    for (let i = 0; i <= labelCount; i++) {
      const value = maxValue - (i / labelCount) * (maxValue - minValue)
      labels.push(
        <YAxisLabel key={`y-label-${i}`}>
          {Math.round(value)}
        </YAxisLabel>
      )
    }
    
    return labels
  }

  if (!dimensions.width) {
    return <ChartContainer height={height} className={className} {...props} />
  }

  return (
    <ChartContainer height={height} className={className} {...props}>
      <SvgContainer
        ref={svgRef}
        height={height - 40}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      >
        {showGrid && generateGridLines()}
        
        {showArea && (
          <Area
            d={generateAreaPath()}
            color={color}
            areaOpacity={areaOpacity}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          />
        )}
        
        <Line
          d={generatePath()}
          color={color}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
        
        {showDots &&
          data.map((point, index) => (
            <g key={index}>
              <Dot
                cx={getXPosition(index)}
                cy={getYPosition(point.value)}
                r={4}
                color={color}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onMouseEnter={(e) => handleDotHover(point, e)}
                onMouseLeave={handleDotLeave}
              />
              {hoveredPoint?.point === point && (
                <Tooltip
                  style={{
                    left: getXPosition(index),
                    top: getYPosition(point.value) - 40,
                    transform: 'translateX(-50%)'
                  }}
                >
                  {point.label || `Day ${point.day}`}: {point.value}
                </Tooltip>
              )}
            </g>
          ))}
      </SvgContainer>
      
      {showAxes && (
        <>
          <YAxis height={height - 40}>
            {generateYAxisLabels()}
          </YAxis>
          
          <XAxis>
            {data.map((point, index) => (
              <XAxisLabel key={index}>
                {point.label || point.day || index + 1}
              </XAxisLabel>
            ))}
          </XAxis>
        </>
      )}
    </ChartContainer>
  )
}

export default LineChart