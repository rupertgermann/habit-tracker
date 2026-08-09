export const createBrowserClockAdapter = (windowObject = window) => ({
  now: () => new Date(),
  setTimeout: (callback, delay) => windowObject.setTimeout(callback, delay),
  clearTimeout: timerId => windowObject.clearTimeout(timerId)
})

export const createBrowserNotificationAdapter = (windowObject = window) => {
  const getNotificationApi = () => windowObject.Notification

  return {
    isSupported: () => typeof getNotificationApi() === 'function',
    getPermission: () => getNotificationApi()?.permission || 'unsupported',
    requestPermission: () => getNotificationApi().requestPermission(),
    show: (title, options) => {
      const NotificationApi = getNotificationApi()
      return new NotificationApi(title, options)
    }
  }
}
