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

const ChartScroller = styled.div`
  flex: 1;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
`

const ChartCanvas = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: ${props => props.$width}px;
  min-width: 100%;
  height: 100%;
`

const SvgContainer = styled.svg`
  flex: 1;
  width: 100%;
  height: ${props => props.$height - 40}px;
`

const GridLine = styled.line`
  stroke: ${props => props.theme.colors.border};
  stroke-width: 1;
  stroke-dasharray: 2, 2;
`

const Area = styled(motion.path)`
  fill: ${props => props.$color || props.theme.colors.primary};
  fill-opacity: ${props => props.$areaOpacity || 0.1};
`

const Line = styled(motion.path)`
  fill: none;
  stroke: ${props => props.$color || props.theme.colors.primary};
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
`

const Dot = styled(motion.circle)`
  fill: ${props => props.$color || props.theme.colors.primary};
  stroke: ${props => props.theme.colors.white};
  stroke-width: ${props => props.$active ? 4 : 2};
  r: ${props => props.$active ? 6 : 4}px;
  pointer-events: none;
`

const PointTarget = styled.rect`
  fill: transparent;
  cursor: pointer;

  &:focus {
    outline: none;
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
  height: ${props => props.$height - 40}px;
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
  width: max-content;
  max-width: calc(100% - ${props => props.theme.spacing.md});
  background-color: ${props => props.theme.colors.text.primary};
  color: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  line-height: ${props => props.theme.typography.lineHeight.normal};
  white-space: pre-line;
  text-align: left;
  z-index: 10;
  pointer-events: none;
  box-shadow: 0 8px 24px rgb(0 0 0 / 20%);
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
  ariaLabel = 'Line chart',
  className,
  ...props
}) => {
  const [hoveredPoint, setHoveredPoint] = React.useState(null)
  const containerRef = React.useRef(null)
  const scrollerRef = React.useRef(null)
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 })

  React.useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const updateDimensions = () => {
      const availableWidth = container.getBoundingClientRect().width
      const minimumPointWidth = showDots && data.length > 1
        ? (data.length - 1) * 52 + 64
        : 0
      const nextDimensions = {
        width: Math.max(availableWidth, minimumPointWidth),
        height: Math.max(height - 40, 0)
      }

      setDimensions(currentDimensions => {
        if (
          currentDimensions.width === nextDimensions.width &&
          currentDimensions.height === nextDimensions.height
        ) {
          return currentDimensions
        }

        return nextDimensions
      })
    }

    updateDimensions()

    if (typeof ResizeObserver === 'undefined') return undefined

    const observer = new ResizeObserver(updateDimensions)
    observer.observe(container)

    return () => observer.disconnect()
  }, [data.length, height, showDots])

  const padding = {
    top: 20,
    right: 24,
    bottom: 20,
    left: showAxes ? 40 : 20
  }

  const chartWidth = dimensions.width - padding.left - padding.right
  const chartHeight = dimensions.height - padding.top - padding.bottom

  const plottedData = data
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => Number.isFinite(point.value))
  const plottedValues = plottedData.map(({ point }) => point.value)
  const maxValue = Math.max(...plottedValues, 1)
  const minValue = Math.min(...plottedValues, 0)
  const segments = data.reduce((currentSegments, point, index) => {
    if (!Number.isFinite(point.value)) return currentSegments

    const previousPoint = data[index - 1]
    if (index === 0 || !Number.isFinite(previousPoint?.value)) {
      currentSegments.push([])
    }
    currentSegments.at(-1).push({ point, index })
    return currentSegments
  }, [])

  const getXPosition = (index) => {
    return padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth
  }

  const getYPosition = (value) => {
    return padding.top + (1 - (value - minValue) / (maxValue - minValue)) * chartHeight
  }

  React.useLayoutEffect(() => {
    const scroller = scrollerRef.current
    const todayIndex = data.findIndex(point => point.isToday)
    if (!scroller || todayIndex < 0 || dimensions.width <= scroller.clientWidth) return

    const todayX = getXPosition(todayIndex)
    scroller.scrollLeft = Math.max(
      0,
      Math.min(todayX - scroller.clientWidth / 2, dimensions.width - scroller.clientWidth)
    )
  }, [data, dimensions.width])

  const getPointTargetBounds = (index, value) => {
    const x = getXPosition(index)
    const targetHeight = Math.min(Math.max(chartHeight, 0), 44)
    const y = Math.min(
      Math.max(getYPosition(value) - targetHeight / 2, padding.top),
      padding.top + Math.max(chartHeight - targetHeight, 0)
    )

    return {
      x: x - 22,
      y,
      width: 44,
      height: targetHeight
    }
  }

  const handleDotHover = (point, index) => {
    setHoveredPoint({ point, index })
  }

  const handleDotLeave = () => {
    setHoveredPoint(null)
  }

  const generatePath = (segment) => {
    if (segment.length === 0) return ''

    let path = `M ${getXPosition(segment[0].index)} ${getYPosition(segment[0].point.value)}`
    
    for (let i = 1; i < segment.length; i++) {
      const previous = segment[i - 1]
      const current = segment[i]
      const x1 = getXPosition(previous.index)
      const y1 = getYPosition(previous.point.value)
      const x2 = getXPosition(current.index)
      const y2 = getYPosition(current.point.value)
      
      const controlX1 = x1 + (x2 - x1) / 2
      const controlY1 = y1
      const controlX2 = x1 + (x2 - x1) / 2
      const controlY2 = y2
      
      path += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${x2} ${y2}`
    }
    
    return path
  }

  const generateAreaPath = (segment) => {
    if (segment.length < 2) return ''

    const linePath = generatePath(segment)
    const lastX = getXPosition(segment.at(-1).index)
    const firstX = getXPosition(segment[0].index)
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

  return (
    <ChartContainer ref={containerRef} $height={height} className={className} {...props}>
      <ChartScroller ref={scrollerRef} data-testid="line-chart-scroller">
        <ChartCanvas $width={dimensions.width}>
          <SvgContainer
            $height={height}
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            role="group"
            aria-label={ariaLabel}
          >
            {showGrid && generateGridLines()}

            {showArea && segments
              .filter(segment => segment.length > 1)
              .map((segment, index) => (
                <Area
                  key={`area-${index}`}
                  d={generateAreaPath(segment)}
                  $color={color}
                  $areaOpacity={areaOpacity}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, ease: 'easeInOut' }}
                />
              ))}

            {segments.map((segment, index) => (
              <Line
                key={`line-${index}`}
                d={generatePath(segment)}
                $color={color}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: 'easeInOut' }}
              />
            ))}

            {showDots &&
              plottedData.map(({ point, index }) => {
                const targetBounds = getPointTargetBounds(index, point.value)
                const isActive = hoveredPoint?.index === index

                return (
                  <g key={index}>
                    <Dot
                      cx={getXPosition(index)}
                      cy={getYPosition(point.value)}
                      $active={isActive}
                      $color={color}
                      aria-hidden="true"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    />
                    <PointTarget
                      {...targetBounds}
                      role="img"
                      tabIndex={0}
                      aria-label={point.ariaLabel || `${point.label || `Day ${point.day}`}: ${point.value}`}
                      onMouseEnter={() => handleDotHover(point, index)}
                      onMouseLeave={handleDotLeave}
                      onFocus={() => handleDotHover(point, index)}
                      onBlur={handleDotLeave}
                    />
                  </g>
                )
              })}
          </SvgContainer>

          {showAxes && (
            <XAxis>
              {data.map((point, index) => (
                <XAxisLabel key={index}>
                  {point.label || point.day || index + 1}
                </XAxisLabel>
              ))}
            </XAxis>
          )}
        </ChartCanvas>
      </ChartScroller>

      {hoveredPoint && (
        <Tooltip
          role="tooltip"
          style={{
            left: '50%',
            top: Math.max(getYPosition(hoveredPoint.point.value) - 84, 4),
            transform: 'translateX(-50%)'
          }}
        >
          {hoveredPoint.point.tooltip ||
            `${hoveredPoint.point.label || `Day ${hoveredPoint.point.day}`}: ${hoveredPoint.point.value}`}
        </Tooltip>
      )}
      
      {showAxes && (
        <YAxis $height={height}>
          {generateYAxisLabels()}
        </YAxis>
      )}
    </ChartContainer>
  )
}

export default LineChart
