# Navigation Fix Plan

## Problem Analysis

The current implementation has two main issues:

1. **Bottom Navigation Disappearing**: The bottom navigation is visible for a split second on page reload and then disappears.
2. **Navigation State Not Synchronized**: The active tab in the bottom navigation doesn't update when navigating directly to a route (e.g., typing `/settings` in the URL).

## Root Cause

1. The `activeTab` state in `App.jsx` is initialized to 'dashboard' and only updated when clicking on navigation items.
2. When navigating directly to a route or reloading the page, the `activeTab` state doesn't reflect the current route.
3. The bottom navigation is conditionally rendered based on screen size but doesn't properly handle route changes.

## Solution Plan

### 1. Create a Navigation Context

Create a `NavigationContext` to manage the navigation state globally. This will allow all components to access and update the current navigation state.

**File**: `src/context/NavigationContext.jsx`

```jsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const NavigationContext = createContext()

export const NavigationProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const location = useLocation()

  // Update active tab based on current location
  useEffect(() => {
    const path = location.pathname
    const navItems = [
      { id: 'dashboard', path: '/' },
      { id: 'habits', path: '/habits' },
      { id: 'calendar', path: '/calendar' },
      { id: 'journal', path: '/journal' },
      { id: 'progress', path: '/progress' },
      { id: 'settings', path: '/settings' }
    ]
    
    const activeItem = navItems.find(item => item.path === path)
    if (activeItem) {
      setActiveTab(activeItem.id)
    }
  }, [location.pathname])

  const value = {
    activeTab,
    setActiveTab
  }

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export const useNavigation = () => {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}
```

### 2. Update App.jsx

Remove the local `activeTab` state and use the `NavigationContext` instead.

**Changes to `src/App.jsx`**:
1. Import and use the `NavigationProvider`
2. Remove the `activeTab` state from `AppContent`
3. Use the `useNavigation` hook in `BottomNavigation`

### 3. Update BottomNavigation.jsx

Update the `BottomNavigation` component to use the `useNavigation` hook and remove the `activeTab` prop.

**Changes to `src/components/BottomNavigation.jsx`**:
1. Import and use the `useNavigation` hook
2. Remove the `activeTab` prop from the component
3. Use the `activeTab` and `setActiveTab` from the context

### 4. Ensure Proper Conditional Rendering

Make sure the bottom navigation is always visible on mobile devices, regardless of the route.

**Changes to `src/App.jsx`**:
1. Ensure the conditional rendering logic for tablet/mobile is working correctly
2. Make sure the bottom navigation is always rendered on mobile devices

## Implementation Steps

1. Create the `NavigationContext` file
2. Update `App.jsx` to use the `NavigationProvider`
3. Update `BottomNavigation.jsx` to use the `useNavigation` hook
4. Test the navigation on different routes and after page reload

## Benefits

1. **Consistent Navigation State**: The active tab will always reflect the current route, even after page reload.
2. **Global Access**: Any component can access and update the navigation state if needed.
3. **Cleaner Code**: Removes the need to pass down the `activeTab` and `onTabChange` props through multiple components.
4. **Better User Experience**: Users will always see the correct active tab in the bottom navigation.

## Testing

1. Test navigation by clicking on bottom navigation items
2. Test navigation by directly accessing routes (e.g., `/settings`)
3. Test page reload on different routes to ensure the correct tab is active
4. Test on both mobile and tablet devices to ensure proper rendering