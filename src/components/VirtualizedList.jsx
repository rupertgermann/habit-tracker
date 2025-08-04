import React, { useState, useEffect, useRef, useCallback } from 'react'
import styled from 'styled-components'

const VirtualizedListContainer = styled.div`
  height: ${props => props.height || '500px'};
  overflow-y: auto;
  position: relative;
  border: ${props => props.border ? `1px solid ${props.theme.colors.border}` : 'none'};
  border-radius: ${props => props.borderRadius || props.theme.borderRadius.small};
`

const VirtualizedListContent = styled.div`
  position: relative;
`

const VirtualizedListItem = styled.div`
  position: absolute;
  width: 100%;
  left: 0;
  right: 0;
`

const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.text.secondary};
`

const VirtualizedList = ({
  items,
  renderItem,
  itemHeight = 60,
  height = '500px',
  border = true,
  borderRadius,
  loading = false,
  onEndReached,
  endReachedThreshold = 200,
  emptyMessage = 'No items found'
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 })
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef(null)
  const contentRef = useRef(null)

  // Calculate the total height of the list
  const totalHeight = items.length * itemHeight

  // Calculate how many items should be visible
  const getVisibleRange = useCallback((scrollTop) => {
    const containerHeight = containerRef.current?.clientHeight || 500
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 5 // Add buffer
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 2)
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount)
    
    return { start: startIndex, end: endIndex }
  }, [items.length, itemHeight])

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    
    const currentScrollTop = containerRef.current.scrollTop
    setScrollTop(currentScrollTop)
    
    // Update visible range
    const newRange = getVisibleRange(currentScrollTop)
    setVisibleRange(newRange)
    
    // Check if we've reached the end for infinite scrolling
    if (onEndReached) {
      const containerHeight = containerRef.current.clientHeight
      const scrollHeight = containerRef.current.scrollHeight
      
      if (currentScrollTop + containerHeight >= scrollHeight - endReachedThreshold) {
        onEndReached()
      }
    }
  }, [getVisibleRange, onEndReached, endReachedThreshold])

  // Set up scroll event listener
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Update visible range when items change
  useEffect(() => {
    const newRange = getVisibleRange(scrollTop)
    setVisibleRange(newRange)
  }, [items.length, getVisibleRange, scrollTop])

  // Render visible items
  const renderItems = () => {
    const itemsToRender = []
    
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (i >= 0 && i < items.length) {
        const item = items[i]
        const top = i * itemHeight
        
        itemsToRender.push(
          <VirtualizedListItem
            key={item.id || i}
            style={{ top: `${top}px`, height: `${itemHeight}px` }}
          >
            {renderItem(item, i)}
          </VirtualizedListItem>
        )
      }
    }
    
    return itemsToRender
  }

  if (loading && items.length === 0) {
    return (
      <VirtualizedListContainer
        ref={containerRef}
        height={height}
        border={border}
        borderRadius={borderRadius}
      >
        <LoadingIndicator>Loading...</LoadingIndicator>
      </VirtualizedListContainer>
    )
  }

  if (items.length === 0) {
    return (
      <VirtualizedListContainer
        ref={containerRef}
        height={height}
        border={border}
        borderRadius={borderRadius}
      >
        <LoadingIndicator>{emptyMessage}</LoadingIndicator>
      </VirtualizedListContainer>
    )
  }

  return (
    <VirtualizedListContainer
      ref={containerRef}
      height={height}
      border={border}
      borderRadius={borderRadius}
    >
      <VirtualizedListContent
        ref={contentRef}
        style={{ height: `${totalHeight}px` }}
      >
        {renderItems()}
        {loading && (
          <LoadingIndicator>
            Loading more...
          </LoadingIndicator>
        )}
      </VirtualizedListContent>
    </VirtualizedListContainer>
  )
}

export default VirtualizedList