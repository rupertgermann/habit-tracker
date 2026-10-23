const AVATAR_SIZE = 256

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

export const createAvatarImage = async file => {
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

export const createBrowserProfilePersistence = api => ({
  async load() { return (await api.getSetting('profile')).value },
  async save(profile) { return (await api.saveSetting('profile', profile)).value }
})
