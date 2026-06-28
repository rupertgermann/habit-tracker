import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { useHabits } from '../context/HabitsContext'
import { habitsApi } from '../api/habitsApi'

const SettingsContainer = styled.div`
  padding: ${props => props.theme.spacing.lg};
  padding-bottom: ${props => props.theme.spacing.xxxl};
  max-width: 600px;
  margin: 0 auto;
`

const Header = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
`

const Title = styled.h1`
  font-size: ${props => props.theme.typography.fontSize.headingLarge};
`

const ProfileSection = styled(Card)`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.xl};
`

const Avatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: ${props => props.theme.borderRadius.round};
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.white};
  font-size: 32px;
  font-weight: ${props => props.theme.typography.fontWeight.bold};
`

const ProfileInfo = styled.div`
  flex: 1;
`

const ProfileName = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.headingMedium};
  margin-bottom: ${props => props.theme.spacing.xs};
`

const ProfileEmail = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
`

const SettingsGroup = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
`

const GroupTitle = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.headingMedium};
  margin-bottom: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const SettingsCard = styled(Card)`
  padding: 0;
`

const SettingItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.lg};
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.background};
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid ${props => props.theme.colors.border};
  }
`

const SettingLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`

const SettingIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.small};
  background-color: ${props => props.theme.colors.background};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.text.primary};
  font-size: 20px;
`

const SettingInfo = styled.div`
  display: flex;
  flex-direction: column;
`

const SettingTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.bodyLarge};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  margin-bottom: ${props => props.theme.spacing.xs};
`

const SettingDescription = styled.p`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
`

const SettingRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`

const SettingValue = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  color: ${props => props.theme.colors.text.secondary};
`

const ChevronIcon = styled.svg`
  width: 20px;
  height: 20px;
  stroke: ${props => props.theme.colors.text.secondary};
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
`

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 28px;
`

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
`

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.theme.colors.border};
  transition: 0.3s;
  border-radius: 28px;
  
  &::before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
  
  ${ToggleInput}:checked + & {
    background-color: ${props => props.theme.colors.primary};
  }
  
  ${ToggleInput}:checked + &::before {
    transform: translateX(20px);
  }
`

const AppInfo = styled(Card)`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  margin-top: ${props => props.theme.spacing.xl};
`

const AppVersion = styled.p`
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.md};
`

const AppLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: ${props => props.theme.spacing.lg};
`

const AppLink = styled.a`
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  
  &:hover {
    text-decoration: underline;
  }
`

const DangerButton = styled(Button)`
  margin-top: ${props => props.theme.spacing.lg};
`

const Settings = () => {
  const { isDarkMode, toggleTheme } = useTheme()
  const { showToast } = useToast()
  const { habits, categories, journalEntries } = useHabits()
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState('09:00')

  // Check notification permission & (re) schedule on mount
  useEffect(() => {
    if (!('Notification' in window)) return

    setNotificationsEnabled(Notification.permission === 'granted')

    if (Notification.permission === 'granted') {
      scheduleReminder(reminderTime)
    }

    // Cleanup on unmount
    return () => {
      if (window.reminderTimeout) clearTimeout(window.reminderTimeout)
    }
  }, [])

  const handleNotificationsToggle = async () => {
    if (!('Notification' in window)) {
      showToast('Notifications are not supported in your browser', 'error')
      return
    }

    if (Notification.permission === 'granted') {
      setNotificationsEnabled(false)
      showToast('Notifications disabled', 'info')
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setNotificationsEnabled(true)
        showToast('Notifications enabled', 'success')
      } else {
        setNotificationsEnabled(false)
        showToast('Notifications permission denied', 'error')
      }
    }
  }

  const handleReminderTimeChange = (e) => {
    const time = e.target.value
    setReminderTime(time)
    
    // Schedule reminder
    if (notificationsEnabled) {
      scheduleReminder(time)
    }
  }

  const scheduleReminder = (time) => {
    // Clear any existing reminders
    if (window.reminderTimeout) {
      clearTimeout(window.reminderTimeout)
    }

    // Calculate time until reminder
    const [hours, minutes] = time.split(':').map(Number)
    const now = new Date()
    const reminderTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
    
    // If reminder time has passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1)
    }

    const timeUntilReminder = reminderTime - now

    // Schedule the reminder
    window.reminderTimeout = setTimeout(() => {
      if (Notification.permission === 'granted') {
        const incompleteHabits = habits.filter(habit => {
          const today = new Date().toISOString().split('T')[0]
          return !habit.completions.some(c => c.date === today)
        })

        new Notification('Habit Tracker Reminder', {
          body: `You have ${incompleteHabits.length} habits to complete today!`,
          icon: '/favicon.ico'
        })
      }
      
      // Schedule next day's reminder
      scheduleReminder(time)
    }, timeUntilReminder)
  }

  const handleExportData = () => {
    try {
      const data = {
        habits,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      }
      
      const dataStr = JSON.stringify(data, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      
      const exportFileDefaultName = `habit-tracker-export-${new Date().toISOString().split('T')[0]}.json`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
      
      showToast('Data exported successfully', 'success')
    } catch (error) {
      showToast('Failed to export data', 'error')
    }
  }

  const handleExportCSV = () => {
    try {
      let csvContent = "Habit Name,Date,Completed\n"
      
      const escape = (str) => `"${str.replace(/"/g, '""')}"`

      habits.forEach(habit => {
        habit.completions.forEach(completion => {
          csvContent += `${escape(habit.name)},${completion.date},Yes\n`
        })
      })
      
      const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvContent)
      const exportFileDefaultName = `habit-tracker-export-${new Date().toISOString().split('T')[0]}.csv`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
      
      showToast('CSV exported successfully', 'success')
    } catch (error) {
      showToast('Failed to export CSV', 'error')
    }
  }

  const handleBackupData = () => {
    try {
      const data = {
        habits,
        categories,
        journalEntries,
        settings: {
          theme: localStorage.getItem('theme'),
          notifications: localStorage.getItem('notifications')
        },
        backupDate: new Date().toISOString(),
        version: '1.0.0'
      }
      
      const dataStr = JSON.stringify(data, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      
      const exportFileDefaultName = `habit-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
      
      showToast('Backup created successfully', 'success')
    } catch (error) {
      showToast('Failed to create backup', 'error')
    }
  }

  const handleRestoreData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return
      
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result)
          
          if (data.habits && Array.isArray(data.habits)) {
            if (window.confirm('This will replace all your current data. Are you sure you want to continue?')) {
              // Restore data to the SQLite-backed API
              habitsApi.restore({
                habits: data.habits,
                categories: Array.isArray(data.categories) ? data.categories : [],
                journalEntries: Array.isArray(data.journalEntries) ? data.journalEntries : []
              })
                .then(() => {
                  // Restore UI preferences if available
                  if (data.settings) {
                    if (data.settings.theme) {
                      localStorage.setItem('theme', data.settings.theme)
                    }
                    if (data.settings.notifications) {
                      localStorage.setItem('notifications', data.settings.notifications)
                    }
                  }

                  showToast('Data restored successfully', 'success')
                  setTimeout(() => {
                    window.location.reload()
                  }, 1500)
                })
                .catch(() => showToast('Failed to restore data', 'error'))
            }
          } else {
            showToast('Invalid backup file', 'error')
          }
        } catch (error) {
          showToast('Failed to restore data', 'error')
        }
      }
      
      reader.readAsText(file)
    }
    
    input.click()
  }

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      habitsApi.clearAll()
        .then(() => {
          localStorage.clear()
          window.location.reload()
        })
        .catch(() => showToast('Failed to clear data', 'error'))
    }
  }

  const settings = [
    {
      icon: '🔔',
      title: 'Notifications',
      description: 'Daily reminders and achievements',
      type: 'toggle',
      value: notificationsEnabled,
      onChange: handleNotificationsToggle
    },
    {
      icon: '⏰',
      title: 'Reminder Time',
      description: 'When to send daily reminders',
      type: 'time',
      value: reminderTime,
      onChange: handleReminderTimeChange
    },
    {
      icon: '🌙',
      title: 'Dark Mode',
      description: 'Easier on the eyes at night',
      type: 'toggle',
      value: isDarkMode,
      onChange: toggleTheme
    }
  ]

  return (
    <SettingsContainer>
      <Header>
        <Title>Settings</Title>
      </Header>

      <ProfileSection elevated>
        <Avatar>U</Avatar>
        <ProfileInfo>
          <ProfileName>User Name</ProfileName>
          <ProfileEmail>user@example.com</ProfileEmail>
        </ProfileInfo>
        <Button variant="ghost">Edit</Button>
      </ProfileSection>

      <SettingsGroup>
        <GroupTitle>Preferences</GroupTitle>
        <SettingsCard elevated>
          {settings.map((setting, index) => (
            <SettingItem key={index}>
              <SettingLeft>
                <SettingIcon>{setting.icon}</SettingIcon>
                <SettingInfo>
                  <SettingTitle>{setting.title}</SettingTitle>
                  <SettingDescription>{setting.description}</SettingDescription>
                </SettingInfo>
              </SettingLeft>
              <SettingRight>
                {setting.type === 'toggle' ? (
                  <ToggleSwitch>
                    <ToggleInput
                      type="checkbox"
                      checked={setting.value}
                      onChange={setting.onChange}
                    />
                    <ToggleSlider />
                  </ToggleSwitch>
                ) : setting.type === 'time' ? (
                  <Input
                    type="time"
                    value={setting.value}
                    onChange={setting.onChange}
                    style={{ width: '100px' }}
                  />
                ) : (
                  <>
                    {setting.value && <SettingValue>{setting.value}</SettingValue>}
                    <ChevronIcon>
                      <polyline points="9 18 15 12 9 6" />
                    </ChevronIcon>
                  </>
                )}
              </SettingRight>
            </SettingItem>
          ))}
        </SettingsCard>
      </SettingsGroup>

      <SettingsGroup>
        <GroupTitle>Data</GroupTitle>
        <SettingsCard elevated>
          <SettingItem onClick={handleExportData}>
            <SettingLeft>
              <SettingIcon>📤</SettingIcon>
              <SettingInfo>
                <SettingTitle>Export Data (JSON)</SettingTitle>
                <SettingDescription>Download your habit data as JSON</SettingDescription>
              </SettingInfo>
            </SettingLeft>
            <ChevronIcon>
              <polyline points="9 18 15 12 9 6" />
            </ChevronIcon>
          </SettingItem>
          <SettingItem onClick={handleExportCSV}>
            <SettingLeft>
              <SettingIcon>📊</SettingIcon>
              <SettingInfo>
                <SettingTitle>Export Data (CSV)</SettingTitle>
                <SettingDescription>Download your habit data as CSV</SettingDescription>
              </SettingInfo>
            </SettingLeft>
            <ChevronIcon>
              <polyline points="9 18 15 12 9 6" />
            </ChevronIcon>
          </SettingItem>
          <SettingItem onClick={handleBackupData}>
            <SettingLeft>
              <SettingIcon>💾</SettingIcon>
              <SettingInfo>
                <SettingTitle>Backup Data</SettingTitle>
                <SettingDescription>Save a backup of your data</SettingDescription>
              </SettingInfo>
            </SettingLeft>
            <ChevronIcon>
              <polyline points="9 18 15 12 9 6" />
            </ChevronIcon>
          </SettingItem>
          <SettingItem onClick={handleRestoreData}>
            <SettingLeft>
              <SettingIcon>🔄</SettingIcon>
              <SettingInfo>
                <SettingTitle>Restore Data</SettingTitle>
                <SettingDescription>Restore from a backup file</SettingDescription>
              </SettingInfo>
            </SettingLeft>
            <ChevronIcon>
              <polyline points="9 18 15 12 9 6" />
            </ChevronIcon>
          </SettingItem>
        </SettingsCard>
      </SettingsGroup>

      <DangerButton
        variant="destructive"
        fullWidth
        onClick={handleClearData}
      >
        Clear All Data
      </DangerButton>

      <AppInfo elevated>
        <AppVersion>Habit Tracker v1.0.0</AppVersion>
        <AppLinks>
          <AppLink href="#">Privacy Policy</AppLink>
          <AppLink href="#">Terms of Service</AppLink>
          <AppLink href="#">Support</AppLink>
        </AppLinks>
      </AppInfo>
    </SettingsContainer>
  )
}

export default Settings