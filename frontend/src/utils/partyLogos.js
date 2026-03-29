// Indian Political Party Colors and Symbols
export const partyInfo = {
  'BJP': {
    name: 'Bharatiya Janata Party',
    color: '#FF9933',
    symbol: '🪷', // Lotus
    gradient: 'from-orange-500 to-orange-600'
  },
  'INC': {
    name: 'Indian National Congress',
    color: '#19AAED',
    symbol: '✋', // Hand
    gradient: 'from-blue-500 to-blue-600'
  },
  'AAP': {
    name: 'Aam Aadmi Party',
    color: '#0066B3',
    symbol: '🧹', // Broom
    gradient: 'from-blue-600 to-blue-700'
  },
  'TMC': {
    name: 'Trinamool Congress',
    color: '#20C4A5',
    symbol: '🌸', // Flower
    gradient: 'from-teal-500 to-teal-600'
  },
  'Shiv Sena': {
    name: 'Shiv Sena',
    color: '#F37021',
    symbol: '🏹', // Bow and Arrow
    gradient: 'from-orange-600 to-orange-700'
  },
  'SP': {
    name: 'Samajwadi Party',
    color: '#FF2222',
    symbol: '🚲', // Bicycle
    gradient: 'from-red-500 to-red-600'
  },
  'BSP': {
    name: 'Bahujan Samaj Party',
    color: '#0000FF',
    symbol: '🐘', // Elephant
    gradient: 'from-blue-700 to-blue-800'
  },
  'CPI(M)': {
    name: 'Communist Party of India (Marxist)',
    color: '#FF0000',
    symbol: '⚒️', // Hammer and Sickle
    gradient: 'from-red-600 to-red-700'
  },
  'NCP': {
    name: 'Nationalist Congress Party',
    color: '#00B2A9',
    symbol: '⏰', // Clock
    gradient: 'from-cyan-600 to-cyan-700'
  },
  'DMK': {
    name: 'Dravida Munnetra Kazhagam',
    color: '#FF0000',
    symbol: '🌅', // Rising Sun
    gradient: 'from-red-500 to-red-600'
  }
};

export const getPartyInfo = (partyCode) => {
  return partyInfo[partyCode] || {
    name: partyCode,
    color: '#6366f1',
    symbol: '🗳️',
    gradient: 'from-indigo-500 to-indigo-600'
  };
};
