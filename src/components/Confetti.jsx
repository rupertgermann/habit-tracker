import React, { useState, useEffect } from 'react'
import Confetti from 'react-confetti'

const HabitConfetti = ({ run, onComplete, recycle = false }) => {
  const [windowDimension, setWindowDimension] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })
  const [confettiKey, setConfettiKey] = useState(0)

  const detectSize = () => {
    setWindowDimension({
      width: window.innerWidth,
      height: window.innerHeight,
    })
  }

  useEffect(() => {
    window.addEventListener('resize', detectSize)
    return () => {
      window.removeEventListener('resize', detectSize)
    }
  }, [])

  useEffect(() => {
    if (run) {
      setConfettiKey(prev => prev + 1)
      
      if (!recycle && onComplete) {
        const timer = setTimeout(() => {
          onComplete()
        }, 5000) // Confetti runs for 5 seconds
        
        return () => clearTimeout(timer)
      }
    }
  }, [run, recycle, onComplete])

  return (
    <Confetti
      key={confettiKey}
      width={windowDimension.width}
      height={windowDimension.height}
      recycle={recycle}
      numberOfPieces={run ? 200 : 0}
      gravity={0.1}
    />
  )
}

export default HabitConfetti