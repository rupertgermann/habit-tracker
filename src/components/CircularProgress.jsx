import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const ProgressContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  
  ${({ size }) => `
    width: ${size}px;
    height: ${size}px;
  `}
`

const ProgressBackground = styled.circle`
  fill: none;
  stroke: ${props => props.theme.colors.border};
  stroke-width: ${props => props.strokeWidth}px;
`

const ProgressForeground = styled(motion.circle)`
  fill: none;
  stroke: ${props => props.color || props.theme.colors.primary};
  stroke-width: ${props => props.strokeWidth}px;
  stroke-linecap: round;
  transform-origin: center;
  transform: rotate(-90deg);
`

const ProgressText = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  .percentage {
    font-size: ${props => props.theme.typography.fontSize.headingLarge};
    font-weight: ${props => props.theme.typography.fontWeight.bold};
    color: ${props => props.theme.colors.text.primary};
  }
  
  .label {
    font-size: ${props => props.theme.typography.fontSize.bodySmall};
    color: ${props => props.theme.colors.text.secondary};
    margin-top: ${props => props.theme.spacing.xs};
  }
`

const CircularProgress = ({
  progress = 0,
  size = 120,
  strokeWidth = 8,
  color,
  backgroundColor,
  showPercentage = true,
  label,
  className,
  ...props
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const progressVariants = {
    initial: { strokeDashoffset: circumference },
    animate: { strokeDashoffset }
  }

  return (
    <ProgressContainer size={size} className={className} {...props}>
      <svg width={size} height={size}>
        <ProgressBackground
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <ProgressForeground
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          variants={progressVariants}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </svg>
      {showPercentage && (
        <ProgressText>
          <span className="percentage">{Math.round(progress)}%</span>
          {label && <span className="label">{label}</span>}
        </ProgressText>
      )}
    </ProgressContainer>
  )
}

export default CircularProgress