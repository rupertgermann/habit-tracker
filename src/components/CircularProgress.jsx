import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const ProgressContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
`

const SvgContainer = styled.svg`
  transform: rotate(-90deg);
`

const BackgroundCircle = styled.circle`
  fill: none;
  stroke: ${props => props.backgroundColor || props.theme.colors.border};
  stroke-width: ${props => props.strokeWidth};
`

const ProgressCircle = styled(motion.circle)`
  fill: none;
  stroke: ${props => props.color || props.theme.colors.primary};
  stroke-width: ${props => props.strokeWidth};
  stroke-linecap: round;
  transform-origin: center;
`

const ProgressText = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

const PercentageText = styled.span`
  font-size: ${props => props.theme.typography.fontSize.headingLarge};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text.primary};
`

const LabelText = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
  margin-top: ${props => props.theme.spacing.xs};
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
  const normalizedRadius = (size - strokeWidth) / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <ProgressContainer className={className} {...props}>
      <SvgContainer width={size} height={size}>
        <BackgroundCircle
          cx={size / 2}
          cy={size / 2}
          r={normalizedRadius}
          strokeWidth={strokeWidth}
          backgroundColor={backgroundColor}
        />
        <ProgressCircle
          cx={size / 2}
          cy={size / 2}
          r={normalizedRadius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          color={color}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      </SvgContainer>
      
      {(showPercentage || label) && (
        <ProgressText>
          {showPercentage && (
            <PercentageText>{Math.round(progress)}%</PercentageText>
          )}
          {label && <LabelText>{label}</LabelText>}
        </ProgressText>
      )}
    </ProgressContainer>
  )
}

export default CircularProgress