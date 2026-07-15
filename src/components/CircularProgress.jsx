import React from 'react'
import styled, { css, keyframes } from 'styled-components'
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
  stroke: ${props => props.$backgroundColor || props.theme.colors.border};
  stroke-width: ${props => props.$strokeWidth};
`

const ProgressCircle = styled(motion.circle)`
  fill: none;
  stroke: ${props => props.$color || props.theme.colors.primary};
  stroke-width: ${props => props.$strokeWidth};
  stroke-linecap: round;
  transform-origin: center;
  
  ${({ $animated }) =>
    $animated &&
    `
      filter: drop-shadow(0 0 3px currentColor);
    `}
`

const DailyIndicator = styled(motion.circle)`
  fill: none;
  stroke: ${props => props.theme.colors.border};
  stroke-width: ${props => props.$strokeWidth / 2};
  stroke-linecap: round;
  stroke-dasharray: 5 5;
  transform-origin: center;
  opacity: 0.5;
`

const ProgressText = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  ${({ $animated }) =>
    $animated &&
    css`
      animation: ${pulse} 2s infinite;
    `}
`

const PercentageText = styled.span`
  font-size: ${props => `min(${props.theme.typography.fontSize.headingLarge}, ${props.$size * 0.32}px)`};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  line-height: 1;
  color: ${props => props.theme.colors.text.primary};
`

const LabelText = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
  margin-top: ${props => props.theme.spacing.xs};
`

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
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
  animated = false,
  daily = false,
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
          $strokeWidth={strokeWidth}
          $backgroundColor={backgroundColor}
        />
        <ProgressCircle
          cx={size / 2}
          cy={size / 2}
          r={normalizedRadius}
          $strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          $color={color}
          $animated={animated}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
        
        {daily && (
          <DailyIndicator
            cx={size / 2}
            cy={size / 2}
            r={normalizedRadius}
            $strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (1 / 7) * circumference}
            animate={{ strokeDashoffset: circumference - (1 / 7) * circumference }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        )}
      </SvgContainer>
      
      {(showPercentage || label) && (
        <ProgressText $animated={animated}>
          {showPercentage && (
            <PercentageText $size={size}>{Math.round(progress)}%</PercentageText>
          )}
          {label && <LabelText>{label}</LabelText>}
        </ProgressText>
      )}
    </ProgressContainer>
  )
}

export default CircularProgress
