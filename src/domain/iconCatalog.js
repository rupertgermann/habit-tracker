export const DEFAULT_HABIT_ICON = 'check'
export const DEFAULT_CATEGORY_ICON = 'pin'

export const DEFAULT_CATEGORY_ICON_IDS = {
  health: 'dumbbell',
  productivity: 'notes',
  mindfulness: 'yoga',
  learning: 'books',
  social: 'users',
  creativity: 'palette',
  other: 'pin'
}

export const LEGACY_ICON_ALIASES = {
  '✓': 'check',
  '✅': 'circle-check',
  '⭐': 'star',
  '🎯': 'target',
  '🔥': 'flame',
  '⏰': 'alarm',
  '📅': 'calendar',
  '📌': 'pin',
  '🏆': 'trophy',
  '💎': 'diamond',
  '🚀': 'rocket',
  '⚡': 'bolt',
  '🔁': 'repeat',
  '💪': 'dumbbell',
  '🏃': 'run',
  '🚶': 'walk',
  '🚴': 'bike',
  '🏊': 'swim',
  '🏋️': 'barbell',
  '🤸': 'activity',
  '🧘': 'yoga',
  '🧠': 'brain',
  '❤️': 'heart',
  '🩺': 'stethoscope',
  '💊': 'pill',
  '🦷': 'dental',
  '🧼': 'wash',
  '🧴': 'bottle',
  '🛌': 'bed',
  '💤': 'moon',
  '🌞': 'sun',
  '🌙': 'moon',
  '⚖️': 'scale',
  '💧': 'droplet',
  '☕': 'coffee',
  '🍵': 'tea',
  '🥤': 'cup',
  '🍎': 'apple',
  '🍌': 'banana',
  '🍓': 'fruit',
  '🥑': 'avocado',
  '🥗': 'salad',
  '🥦': 'vegetable',
  '🥕': 'carrot',
  '🥚': 'egg',
  '🍞': 'bread',
  '🍚': 'bowl',
  '🍽️': 'meal',
  '🧃': 'bottle',
  '📚': 'books',
  '📖': 'book',
  '✍️': 'writing',
  '📝': 'notes',
  '📓': 'notebook',
  '🧮': 'abacus',
  '🔬': 'microscope',
  '🔭': 'telescope',
  '💻': 'laptop',
  '⌨️': 'keyboard',
  '🧑‍💻': 'code',
  '🗣️': 'language',
  '🎧': 'headphones',
  '🧩': 'puzzle',
  '💡': 'bulb',
  '🧪': 'test-tube',
  '📋': 'clipboard',
  '📈': 'chart-line',
  '📊': 'chart-bar',
  '📁': 'folder',
  '📬': 'inbox',
  '📞': 'phone',
  '💬': 'message',
  '🤝': 'handshake',
  '🧾': 'receipt',
  '💰': 'coin',
  '🏦': 'bank',
  '🧹': 'brush',
  '🗂️': 'archive',
  '🔒': 'lock',
  '🛠️': 'tools',
  '🏠': 'home',
  '🛏️': 'bed',
  '🧺': 'laundry',
  '🧽': 'clean',
  '🪥': 'toothbrush',
  '🚿': 'bath',
  '🪴': 'plant',
  '🌱': 'seedling',
  '🌿': 'leaf',
  '🛒': 'shopping-cart',
  '🧑‍🍳': 'cooking',
  '🔑': 'key',
  '🧯': 'extinguisher',
  '🚗': 'car',
  '🚌': 'bus',
  '🎨': 'palette',
  '✏️': 'pencil',
  '🖌️': 'brush',
  '🎵': 'music',
  '🎸': 'guitar',
  '🎹': 'piano',
  '🎤': 'microphone',
  '📷': 'camera',
  '🎥': 'video',
  '🎬': 'movie',
  '🧵': 'sewing',
  '🧶': 'thread',
  '🎲': 'game',
  '♟️': 'chess',
  '🎮': 'gamepad',
  '🎭': 'theater',
  '👥': 'users',
  '👨‍👩‍👧': 'family',
  '💌': 'mail-heart',
  '🎁': 'gift',
  '🙏': 'pray',
  '😊': 'mood-smile',
  '🌈': 'rainbow',
  '🌍': 'world',
  '🕯️': 'candle',
  '☮️': 'peace',
  '💐': 'flower',
  '🎉': 'confetti'
}

export const iconGroups = [
  {
    id: 'essentials',
    name: 'Essentials',
    icons: [
      { icon: 'check', label: 'Check', tags: ['done', 'complete'] },
      { icon: 'circle-check', label: 'Circle Check', tags: ['done', 'complete'] },
      { icon: 'star', label: 'Star', tags: ['favorite', 'priority'] },
      { icon: 'target', label: 'Target', tags: ['focus', 'daily goal'] },
      { icon: 'flame', label: 'Flame', tags: ['streak', 'energy'] },
      { icon: 'alarm', label: 'Alarm', tags: ['time', 'routine'] },
      { icon: 'calendar', label: 'Calendar', tags: ['schedule', 'calendar period'] },
      { icon: 'pin', label: 'Pin', tags: ['remember', 'important'] },
      { icon: 'trophy', label: 'Trophy', tags: ['win', 'achievement'] },
      { icon: 'diamond', label: 'Diamond', tags: ['quality', 'premium'] },
      { icon: 'rocket', label: 'Rocket', tags: ['launch', 'progress'] },
      { icon: 'bolt', label: 'Bolt', tags: ['fast', 'energy'] },
      { icon: 'repeat', label: 'Repeat', tags: ['recurring', 'habit'] },
      { icon: 'sparkles', label: 'Sparkles', tags: ['celebrate', 'mood'] }
    ]
  },
  {
    id: 'health',
    name: 'Health',
    icons: [
      { icon: 'dumbbell', label: 'Dumbbell', tags: ['fitness', 'workout', 'strength'] },
      { icon: 'run', label: 'Run', tags: ['cardio', 'running'] },
      { icon: 'walk', label: 'Walk', tags: ['steps', 'walking'] },
      { icon: 'bike', label: 'Bike', tags: ['cycling', 'cardio'] },
      { icon: 'swim', label: 'Swim', tags: ['swimming', 'sport'] },
      { icon: 'barbell', label: 'Barbell', tags: ['gym', 'lift'] },
      { icon: 'activity', label: 'Activity', tags: ['movement', 'stretch'] },
      { icon: 'yoga', label: 'Yoga', tags: ['mindfulness', 'calm', 'meditation'] },
      { icon: 'brain', label: 'Brain', tags: ['mental', 'focus'] },
      { icon: 'heart', label: 'Heart', tags: ['health', 'love'] },
      { icon: 'stethoscope', label: 'Stethoscope', tags: ['doctor', 'checkup'] },
      { icon: 'pill', label: 'Pill', tags: ['medicine', 'medication'] },
      { icon: 'dental', label: 'Dental', tags: ['teeth', 'brush'] },
      { icon: 'wash', label: 'Wash', tags: ['clean', 'soap'] },
      { icon: 'bed', label: 'Bed', tags: ['sleep', 'rest'] },
      { icon: 'moon', label: 'Moon', tags: ['sleep', 'night'] },
      { icon: 'sun', label: 'Sun', tags: ['morning', 'daylight'] },
      { icon: 'scale', label: 'Scale', tags: ['weight', 'measure'] }
    ]
  },
  {
    id: 'food',
    name: 'Food',
    icons: [
      { icon: 'droplet', label: 'Water', tags: ['hydrate', 'drink'] },
      { icon: 'coffee', label: 'Coffee', tags: ['caffeine', 'drink'] },
      { icon: 'tea', label: 'Tea', tags: ['drink', 'calm'] },
      { icon: 'cup', label: 'Drink', tags: ['beverage', 'water'] },
      { icon: 'apple', label: 'Apple', tags: ['fruit', 'healthy'] },
      { icon: 'banana', label: 'Banana', tags: ['fruit', 'snack'] },
      { icon: 'fruit', label: 'Fruit', tags: ['fruit', 'snack'] },
      { icon: 'avocado', label: 'Avocado', tags: ['healthy', 'food'] },
      { icon: 'salad', label: 'Salad', tags: ['healthy', 'meal'] },
      { icon: 'vegetable', label: 'Vegetable', tags: ['food', 'vegetables'] },
      { icon: 'carrot', label: 'Carrot', tags: ['food', 'vegetables'] },
      { icon: 'egg', label: 'Egg', tags: ['protein', 'food'] },
      { icon: 'bread', label: 'Bread', tags: ['meal', 'food'] },
      { icon: 'bowl', label: 'Bowl', tags: ['meal', 'rice'] },
      { icon: 'meal', label: 'Meal', tags: ['plate', 'food'] },
      { icon: 'bottle', label: 'Bottle', tags: ['drink', 'beverage'] }
    ]
  },
  {
    id: 'learning',
    name: 'Learning',
    icons: [
      { icon: 'books', label: 'Books', tags: ['read', 'study'] },
      { icon: 'book', label: 'Reading', tags: ['book', 'learn'] },
      { icon: 'writing', label: 'Writing', tags: ['journal', 'notes'] },
      { icon: 'notes', label: 'Notes', tags: ['write', 'todo'] },
      { icon: 'notebook', label: 'Notebook', tags: ['journal', 'study'] },
      { icon: 'abacus', label: 'Abacus', tags: ['math', 'practice'] },
      { icon: 'microscope', label: 'Microscope', tags: ['science', 'study'] },
      { icon: 'telescope', label: 'Telescope', tags: ['science', 'space'] },
      { icon: 'laptop', label: 'Laptop', tags: ['code', 'work'] },
      { icon: 'keyboard', label: 'Keyboard', tags: ['typing', 'code'] },
      { icon: 'code', label: 'Code', tags: ['developer', 'programming'] },
      { icon: 'language', label: 'Language', tags: ['speaking', 'practice'] },
      { icon: 'headphones', label: 'Headphones', tags: ['audio', 'language'] },
      { icon: 'puzzle', label: 'Puzzle', tags: ['thinking', 'problem'] },
      { icon: 'bulb', label: 'Bulb', tags: ['learn', 'insight'] },
      { icon: 'test-tube', label: 'Test Tube', tags: ['test', 'science'] }
    ]
  },
  {
    id: 'work',
    name: 'Work',
    icons: [
      { icon: 'clipboard', label: 'Clipboard', tags: ['plan', 'tasks'] },
      { icon: 'list-check', label: 'Checklist', tags: ['todo', 'done'] },
      { icon: 'chart-line', label: 'Growth Chart', tags: ['progress', 'stats'] },
      { icon: 'chart-bar', label: 'Bar Chart', tags: ['metrics', 'stats'] },
      { icon: 'folder', label: 'Folder', tags: ['organize', 'files'] },
      { icon: 'inbox', label: 'Inbox', tags: ['email', 'messages'] },
      { icon: 'phone', label: 'Phone', tags: ['call', 'contact'] },
      { icon: 'message', label: 'Message', tags: ['chat', 'communication'] },
      { icon: 'handshake', label: 'Handshake', tags: ['meeting', 'agreement'] },
      { icon: 'receipt', label: 'Receipt', tags: ['admin', 'finance'] },
      { icon: 'coin', label: 'Coin', tags: ['budget', 'finance'] },
      { icon: 'bank', label: 'Bank', tags: ['finance', 'money'] },
      { icon: 'brush', label: 'Clean Up', tags: ['tidy', 'organize'] },
      { icon: 'archive', label: 'Archive', tags: ['files', 'organize'] },
      { icon: 'lock', label: 'Lock', tags: ['security', 'privacy'] },
      { icon: 'tools', label: 'Tools', tags: ['repair', 'maintenance'] }
    ]
  },
  {
    id: 'home',
    name: 'Home',
    icons: [
      { icon: 'home', label: 'Home', tags: ['house', 'routine'] },
      { icon: 'bed', label: 'Bedroom', tags: ['sleep', 'rest'] },
      { icon: 'laundry', label: 'Laundry', tags: ['clothes', 'wash'] },
      { icon: 'clean', label: 'Sponge', tags: ['clean', 'chores'] },
      { icon: 'toothbrush', label: 'Toothbrush', tags: ['brush', 'teeth'] },
      { icon: 'bath', label: 'Bath', tags: ['shower', 'bathroom'] },
      { icon: 'plant', label: 'Plant', tags: ['garden', 'water'] },
      { icon: 'seedling', label: 'Seedling', tags: ['grow', 'plant'] },
      { icon: 'leaf', label: 'Leaf', tags: ['plant', 'garden'] },
      { icon: 'shopping-cart', label: 'Shopping Cart', tags: ['groceries', 'errands'] },
      { icon: 'cooking', label: 'Cooking', tags: ['cook', 'meal'] },
      { icon: 'key', label: 'Key', tags: ['home', 'security'] },
      { icon: 'extinguisher', label: 'Safety', tags: ['fire', 'home'] },
      { icon: 'car', label: 'Car', tags: ['drive', 'commute'] },
      { icon: 'bus', label: 'Bus', tags: ['transit', 'commute'] }
    ]
  },
  {
    id: 'creative',
    name: 'Creative',
    icons: [
      { icon: 'palette', label: 'Palette', tags: ['art', 'paint'] },
      { icon: 'pencil', label: 'Pencil', tags: ['draw', 'sketch'] },
      { icon: 'brush', label: 'Brush', tags: ['paint', 'art'] },
      { icon: 'music', label: 'Music', tags: ['song', 'practice'] },
      { icon: 'guitar', label: 'Guitar', tags: ['music', 'instrument'] },
      { icon: 'piano', label: 'Piano', tags: ['music', 'instrument'] },
      { icon: 'microphone', label: 'Microphone', tags: ['voice', 'singing'] },
      { icon: 'camera', label: 'Camera', tags: ['photo', 'creative'] },
      { icon: 'video', label: 'Video', tags: ['film', 'camera'] },
      { icon: 'movie', label: 'Movie', tags: ['film', 'video'] },
      { icon: 'sewing', label: 'Sewing', tags: ['craft', 'thread'] },
      { icon: 'thread', label: 'Thread', tags: ['knit', 'craft'] },
      { icon: 'game', label: 'Game', tags: ['play', 'dice'] },
      { icon: 'chess', label: 'Chess', tags: ['strategy', 'game'] },
      { icon: 'gamepad', label: 'Gamepad', tags: ['play', 'controller'] },
      { icon: 'theater', label: 'Theater', tags: ['acting', 'creative'] }
    ]
  },
  {
    id: 'social',
    name: 'Social',
    icons: [
      { icon: 'users', label: 'People', tags: ['social', 'group'] },
      { icon: 'family', label: 'Family', tags: ['home', 'people'] },
      { icon: 'mail-heart', label: 'Letter', tags: ['message', 'kindness'] },
      { icon: 'gift', label: 'Gift', tags: ['giving', 'birthday'] },
      { icon: 'pray', label: 'Gratitude', tags: ['thanks', 'reflect'] },
      { icon: 'mood-smile', label: 'Smile', tags: ['mood', 'happy'] },
      { icon: 'rainbow', label: 'Rainbow', tags: ['joy', 'mood'] },
      { icon: 'world', label: 'World', tags: ['community', 'travel'] },
      { icon: 'candle', label: 'Candle', tags: ['reflect', 'calm'] },
      { icon: 'peace', label: 'Peace', tags: ['calm', 'mindful'] },
      { icon: 'flower', label: 'Flowers', tags: ['gift', 'kindness'] },
      { icon: 'confetti', label: 'Celebration', tags: ['party', 'milestone'] }
    ]
  }
]

export const allIconOptions = Array.from(
  new Map(iconGroups.flatMap(group => group.icons).map(option => [option.icon, option])).values()
)

export const iconGroupTabs = [
  { id: 'all', name: 'All' },
  ...iconGroups.map(group => ({ id: group.id, name: group.name }))
]

const iconOptionsById = new Map(allIconOptions.map(option => [option.icon, option]))

export const normalizeIconName = (icon) => {
  if (typeof icon !== 'string') return ''
  const trimmed = icon.trim()
  if (!trimmed) return ''

  const withoutPrefix = trimmed.startsWith('tabler:')
    ? trimmed.slice('tabler:'.length)
    : trimmed

  return LEGACY_ICON_ALIASES[withoutPrefix] || withoutPrefix
}

export const isKnownIconName = icon => iconOptionsById.has(normalizeIconName(icon))

export const getIconOption = icon => iconOptionsById.get(normalizeIconName(icon)) || null

export const getIconLabel = icon => getIconOption(icon)?.label || 'Icon'

export const getLegacyIconText = (icon) => {
  if (typeof icon !== 'string') return ''
  const trimmed = icon.trim()
  if (!trimmed || isKnownIconName(trimmed)) return ''
  return trimmed
}
