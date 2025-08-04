import React, { useMemo, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const ChartContainer = styled.div`
  width: 100%;
  height: ${props => props.height || '300px'};
  position: relative;
`

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.destructive};
  text-align: center;
  padding: ${props => props.theme.spacing.lg};
`

const DataPointLimitMessage = styled.div`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
  margin-top: ${props => props.theme.spacing.sm};
  font-style: italic;
`

const OptimizedChart = ({
  type = 'line',
  data,
  height = 300,
  loading = false,
  error = null,
  dataPointLimit = 100,
  showDataPointLimit = true,
  ...chartProps
}) => {
  const containerRef = useRef(null)
  
  // Optimize data for performance
  const optimizedData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    // If data is within limit, return as is
    if (data.length <= dataPointLimit) return data
    
    // Otherwise, sample the data to reduce points
    const step = Math.ceil(data.length / dataPointLimit)
    const sampledData = []
    
    for (let i = 0; i < data.length; i += step) {
      sampledData.push(data[i])
    }
    
    // Always include the last data point
    if (sampledData[sampledData.length - 1] !== data[data.length - 1]) {
      sampledData.push(data[data.length - 1])
    }
    
    return sampledData
  }, [data, dataPointLimit])
  
  // Memoize chart props to prevent unnecessary re-renders
  const memoizedChartProps = useMemo(() => ({
    ...chartProps,
    data: optimizedData
  }), [optimizedData, chartProps])
  
  // Handle window resize efficiently
  useEffect(() => {
    const handleResize = () => {
      // Force re-render on resize
      if (containerRef.current) {
        containerRef.current.style.width = '100%'
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  if (error) {
    return (
      <ChartContainer height={height} ref={containerRef}>
        <ErrorMessage>{error}</ErrorMessage>
      </ChartContainer>
    )
  }
  
  if (loading) {
    return (
      <ChartContainer height={height} ref={containerRef}>
        <LoadingOverlay>Loading chart data...</LoadingOverlay>
      </ChartContainer>
    )
  }
  
  if (!data || data.length === 0) {
    return (
      <ChartContainer height={height} ref={containerRef}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          color: 'var(--text-secondary)'
        }}>
          No data available
        </div>
      </ChartContainer>
    )
  }
  
  const renderChart = () => {
    const commonProps = {
      width: '100%',
      height: '100%',
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }
    
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer>
            <BarChart data={optimizedData} {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="value" 
                fill="#6CC47C" 
                animationDuration={300}
                isAnimationActive={false}
                {...memoizedChartProps}
              />
            </BarChart>
          </ResponsiveContainer>
        )
      
      case 'line':
      default:
        return (
          <ResponsiveContainer>
            <LineChart data={optimizedData} {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#6CC47C" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                animationDuration={300}
                isAnimationActive={false}
                {...memoizedChartProps}
              />
            </LineChart>
          </ResponsiveContainer>
        )
    }
  }
  
  return (
    <ChartContainer height={height} ref={containerRef}>
      {renderChart()}
      {showDataPointLimit && data.length > dataPointLimit && (
        <DataPointLimitMessage>
          Showing {optimizedData.length} of {data.length} data points for better performance
        </DataPointLimitMessage>
      )}
    </ChartContainer>
  )
}

export default OptimizedChart