import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import AppIcon from '../components/AppIcon'
import SelectDropdown, { SELECT_DROPDOWN_CONTROL_WIDTH } from '../components/SelectDropdown'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { useHabits } from '../context/HabitsContext'
import { habitsApi } from '../api/habitsApi'
import { isCompletedOnDate, toDateKey } from '../domain/habitTracking'
import { usePreferences, WEEK_START_OPTIONS } from '../context/PreferencesContext.jsx'

const DEFAULT_PROFILE_NAME = 'User Name'
const PROFILE_NAME_STORAGE_KEY = 'habitTracker.profileName'
const PROFILE_SETTINGS_KEY = 'profile'
const AVATAR_SIZE = 256
const CLOCK_ICON_MASK = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'9\'/%3E%3Cpath d=\'M12 7v5l3 2\'/%3E%3C/svg%3E")'

const isProfileSettings = value => value && typeof value === 'object' && !Array.isArray(value)

const readImageFile = file => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = () => reject(new Error('Unable to read image file'))
  reader.readAsDataURL(file)
})

const loadImage = src => new Promise((resolve, reject) => {
  const image = new Image()
  image.onload = () => resolve(image)
  image.onerror = () => reject(new Error('Unable to load image file'))
  image.src = src
})

const createAvatarImage = async file => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file')
  }

  const dataUrl = await readImageFile(file)
  const image = await loadImage(dataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE

  const context = canvas.getContext('2d')
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight)
  const sourceX = (image.naturalWidth - sourceSize) / 2
  const sourceY = (image.naturalHeight - sourceSize) / 2

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE
  )

  return canvas.toDataURL('image/jpeg', 0.88)
}

const SettingsContainer = styled.div`
  width: 100%;
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
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.xl};

  @media (max-width: 360px) {
    gap: ${props => props.theme.spacing.md};
    padding: ${props => props.theme.spacing.lg};
  }
`

const Avatar = styled.div`
  width: 80px;
  height: 80px;
  flex: 0 0 80px;
  border-radius: ${props => props.theme.borderRadius.round};
  background: ${props => props.$hasImage
    ? props.theme.colors.background
    : `linear-gradient(135deg, ${props.theme.colors.primary}, ${props.theme.colors.secondary})`};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: ${props => props.theme.colors.white};
  font-size: 32px;
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  line-height: 1;

  @media (max-width: 360px) {
    width: 64px;
    height: 64px;
    flex-basis: 64px;
    font-size: 28px;
  }
`

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
`

const AvatarInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`

const ProfileInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const ProfileName = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.headingMedium};
  margin-bottom: ${props => props.theme.spacing.xs};
  overflow-wrap: anywhere;
`

const ProfileEmail = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  margin-bottom: 0;
  overflow-wrap: anywhere;
`

const ProfileNameInput = styled(Input)`
  width: 100%;
  max-width: 100%;
  margin-bottom: ${props => props.theme.spacing.xs};
`

const ProfileActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.sm};
  flex: 0 0 auto;
  margin-left: auto;
`

const ProfileEditActions = styled(ProfileActions)`
  justify-content: flex-start;
  flex-wrap: wrap;
  margin-top: ${props => props.theme.spacing.sm};
  margin-left: 0;
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
  overflow: visible;
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
  min-width: 0;
  flex: 1 1 auto;
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
`

const SettingInfo = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`

const SettingTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.bodyLarge};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  margin-bottom: ${props => props.theme.spacing.xs};
`

const SettingDescription = styled.p`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
  overflow-wrap: anywhere;
`

const SettingRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  flex: 0 0 auto;
`

const ReminderTimeInput = styled(Input)`
  width: ${SELECT_DROPDOWN_CONTROL_WIDTH};
  flex: 0 0 ${SELECT_DROPDOWN_CONTROL_WIDTH};

  > div {
    position: relative;
  }

  > div::after {
    content: "";
    position: absolute;
    top: 50%;
    right: ${props => props.theme.spacing.md};
    width: 18px;
    height: 18px;
    pointer-events: none;
    transform: translateY(-50%);
    background-color: ${props => props.theme.colors.text.secondary};
    mask: ${CLOCK_ICON_MASK} center / contain no-repeat;
    -webkit-mask: ${CLOCK_ICON_MASK} center / contain no-repeat;
  }

  input {
    min-width: 0;
    padding-right: ${props => props.theme.spacing.xxl};
    font-variant-numeric: tabular-nums;
  }

  input::-webkit-calendar-picker-indicator {
    cursor: pointer;
    opacity: 0;
  }
`

const SettingValue = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  color: ${props => props.theme.colors.text.secondary};
`

const ChevronIcon = styled.span`
  display: inline-flex;
  color: ${props => props.theme.colors.text.secondary};
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
  flex-wrap: wrap;
  justify-content: center;
  gap: ${props => props.theme.spacing.lg};
`

const AppLink = styled(Link)`
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
  text-align: center;
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  
  &:hover {
    text-decoration: underline;
  }

  &:focus {
    outline: 2px solid ${props => props.theme.colors.primary};
    outline-offset: 2px;
  }
`

const DangerButton = styled(Button)`
  margin-top: ${props => props.theme.spacing.lg};
`

const Settings = () => {
  const { isDarkMode, toggleTheme } = useTheme()
  const { weekStartsOn, setWeekStartsOn } = usePreferences()
  const { showToast } = useToast()
  const { habits, categories, journalEntries } = useHabits()
  const avatarInputRef = useRef(null)
  const [profileName, setProfileName] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_PROFILE_NAME
    return window.localStorage.getItem(PROFILE_NAME_STORAGE_KEY) || DEFAULT_PROFILE_NAME
  })
  const [draftProfileName, setDraftProfileName] = useState(profileName)
  const [profileAvatarImage, setProfileAvatarImage] = useState(null)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingAvatar, setIsSavingAvatar] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState('09:00')

  useEffect(() => {
    let cancelled = false

    habitsApi.getSetting(PROFILE_SETTINGS_KEY)
      .then(({ value }) => {
        if (cancelled || !isProfileSettings(value)) return

        const nextProfileName = typeof value.name === 'string' && value.name.trim()
          ? value.name.trim()
          : profileName

        setProfileName(nextProfileName)
        setDraftProfileName(nextProfileName)
        setProfileAvatarImage(typeof value.avatarImage === 'string' ? value.avatarImage : null)
      })
      .catch(() => {
        // The local default profile remains usable if the API is unavailable.
      })

    return () => {
      cancelled = true
    }
  }, [])

  const saveProfileSettings = (profile) => {
    return habitsApi.saveSetting(PROFILE_SETTINGS_KEY, profile)
  }

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

  const handleReminderTimeChange = (time) => {
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
        const today = toDateKey()
        const incompleteHabits = habits.filter(habit => !isCompletedOnDate(habit, today))

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
      
      const exportFileDefaultName = `habit-tracker-export-${toDateKey()}.json`
      
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
      const exportFileDefaultName = `habit-tracker-export-${toDateKey()}.csv`
      
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
          profile: {
            name: profileName,
            avatarImage: profileAvatarImage
          },
          theme: localStorage.getItem('theme'),
          notifications: localStorage.getItem('notifications')
        },
        backupDate: new Date().toISOString(),
        version: '1.0.0'
      }
      
      const dataStr = JSON.stringify(data, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      
      const exportFileDefaultName = `habit-tracker-backup-${toDateKey()}.json`
      
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
                journalEntries: Array.isArray(data.journalEntries) ? data.journalEntries : [],
                settings: data.settings && typeof data.settings === 'object' ? data.settings : {}
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

  const handleEditProfile = () => {
    setDraftProfileName(profileName)
    setIsEditingProfile(true)
  }

  const handleCancelProfileEdit = () => {
    setDraftProfileName(profileName)
    setIsEditingProfile(false)
  }

  const handleSaveProfile = async () => {
    const nextProfileName = draftProfileName.trim()

    if (!nextProfileName) {
      showToast('Please enter a username', 'error')
      return
    }

    setIsSavingProfile(true)

    try {
      await saveProfileSettings({
        name: nextProfileName,
        avatarImage: profileAvatarImage
      })

      setProfileName(nextProfileName)
      setDraftProfileName(nextProfileName)
      window.localStorage.setItem(PROFILE_NAME_STORAGE_KEY, nextProfileName)
      setIsEditingProfile(false)
      showToast('Username updated', 'success')
    } catch {
      showToast('Failed to save username', 'error')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleProfileNameKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSaveProfile()
    } else if (event.key === 'Escape') {
      handleCancelProfileEdit()
    }
  }

  const handleSelectAvatar = () => {
    avatarInputRef.current?.click()
  }

  const handleAvatarFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    setIsSavingAvatar(true)

    try {
      const nextAvatarImage = await createAvatarImage(file)

      await saveProfileSettings({
        name: profileName,
        avatarImage: nextAvatarImage
      })

      setProfileAvatarImage(nextAvatarImage)
      showToast('Avatar updated', 'success')
    } catch (error) {
      showToast(error.message || 'Failed to save avatar', 'error')
    } finally {
      setIsSavingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setIsSavingAvatar(true)

    try {
      await saveProfileSettings({
        name: profileName,
        avatarImage: null
      })

      setProfileAvatarImage(null)
      showToast('Avatar removed', 'success')
    } catch {
      showToast('Failed to remove avatar', 'error')
    } finally {
      setIsSavingAvatar(false)
    }
  }

  const avatarInitial = profileName.trim().charAt(0).toUpperCase() || 'U'

  const settings = [
    {
      icon: 'bell',
      title: 'Notifications',
      description: 'Daily reminders and achievements',
      type: 'toggle',
      value: notificationsEnabled,
      onChange: handleNotificationsToggle
    },
    {
      icon: 'clock',
      title: 'Reminder Time',
      description: 'When to send daily reminders',
      type: 'time',
      value: reminderTime,
      onChange: handleReminderTimeChange
    },
    {
      icon: 'calendar-week',
      title: 'Week Starts On',
      description: 'First day used in calendar and journal weeks',
      type: 'select',
      value: weekStartsOn,
      options: WEEK_START_OPTIONS,
      onChange: setWeekStartsOn
    },
    {
      icon: 'moon',
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
        <Avatar $hasImage={Boolean(profileAvatarImage)}>
          {profileAvatarImage ? (
            <AvatarImage src={profileAvatarImage} alt={`${profileName} avatar`} />
          ) : (
            avatarInitial
          )}
        </Avatar>
        <AvatarInput
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          aria-label="Avatar image"
          onChange={handleAvatarFileChange}
        />
        <ProfileInfo>
          {isEditingProfile ? (
            <ProfileNameInput
              aria-label="Username"
              value={draftProfileName}
              onChange={setDraftProfileName}
              onKeyDown={handleProfileNameKeyDown}
              maxLength={40}
              autoFocus
            />
          ) : (
            <ProfileName>{profileName}</ProfileName>
          )}
          <ProfileEmail>user@example.com</ProfileEmail>
          {isEditingProfile && (
            <ProfileEditActions>
              <Button
                type="button"
                size="small"
                onClick={handleSaveProfile}
                loading={isSavingProfile}
                disabled={!draftProfileName.trim()}
              >
                Save
              </Button>
              <Button
                type="button"
                size="small"
                variant="ghost"
                onClick={handleCancelProfileEdit}
                disabled={isSavingProfile}
              >
                Cancel
              </Button>
            </ProfileEditActions>
          )}
        </ProfileInfo>
        {!isEditingProfile && (
          <ProfileActions>
            <Button
              type="button"
              variant="ghost"
              onClick={handleSelectAvatar}
              loading={isSavingAvatar}
            >
              Photo
            </Button>
            {profileAvatarImage && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleRemoveAvatar}
                loading={isSavingAvatar}
              >
                Remove Photo
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={handleEditProfile}
              disabled={isSavingAvatar}
            >
              Edit
            </Button>
          </ProfileActions>
        )}
      </ProfileSection>

      <SettingsGroup>
        <GroupTitle>Preferences</GroupTitle>
        <SettingsCard elevated>
          {settings.map((setting, index) => (
            <SettingItem key={index}>
              <SettingLeft>
                <SettingIcon>
                  <AppIcon name={setting.icon} size={22} />
                </SettingIcon>
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
                  <ReminderTimeInput
                    type="time"
                    value={setting.value}
                    onChange={setting.onChange}
                    aria-label={setting.title}
                  />
                ) : setting.type === 'select' ? (
                  <SelectDropdown
                    ariaLabel={setting.title}
                    value={setting.value}
                    options={setting.options}
                    onChange={setting.onChange}
                  />
                ) : (
                  <>
                    {setting.value && <SettingValue>{setting.value}</SettingValue>}
                    <ChevronIcon>
                      <AppIcon name="chevron-right" size={20} />
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
              <SettingIcon>
                <AppIcon name="upload" size={22} />
              </SettingIcon>
              <SettingInfo>
                <SettingTitle>Export Data (JSON)</SettingTitle>
                <SettingDescription>Download your habit data as JSON</SettingDescription>
              </SettingInfo>
            </SettingLeft>
            <ChevronIcon>
              <AppIcon name="chevron-right" size={20} />
            </ChevronIcon>
          </SettingItem>
          <SettingItem onClick={handleExportCSV}>
            <SettingLeft>
              <SettingIcon>
                <AppIcon name="file-spreadsheet" size={22} />
              </SettingIcon>
              <SettingInfo>
                <SettingTitle>Export Data (CSV)</SettingTitle>
                <SettingDescription>Download your habit data as CSV</SettingDescription>
              </SettingInfo>
            </SettingLeft>
            <ChevronIcon>
              <AppIcon name="chevron-right" size={20} />
            </ChevronIcon>
          </SettingItem>
          <SettingItem onClick={handleBackupData}>
            <SettingLeft>
              <SettingIcon>
                <AppIcon name="download" size={22} />
              </SettingIcon>
              <SettingInfo>
                <SettingTitle>Backup Data</SettingTitle>
                <SettingDescription>Save a backup of your data</SettingDescription>
              </SettingInfo>
            </SettingLeft>
            <ChevronIcon>
              <AppIcon name="chevron-right" size={20} />
            </ChevronIcon>
          </SettingItem>
          <SettingItem onClick={handleRestoreData}>
            <SettingLeft>
              <SettingIcon>
                <AppIcon name="restore" size={22} />
              </SettingIcon>
              <SettingInfo>
                <SettingTitle>Restore Data</SettingTitle>
                <SettingDescription>Restore from a backup file</SettingDescription>
              </SettingInfo>
            </SettingLeft>
            <ChevronIcon>
              <AppIcon name="chevron-right" size={20} />
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
          <AppLink to="/privacy">Privacy Policy</AppLink>
          <AppLink to="/terms">Terms of Service</AppLink>
          <AppLink to="/support">Support</AppLink>
        </AppLinks>
      </AppInfo>
    </SettingsContainer>
  )
}

export default Settings
