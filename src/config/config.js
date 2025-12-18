require('dotenv').config();

module.exports = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  DATABASE_URL: process.env.DATABASE_URL,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  REQUIRED_ROLE_NAME: process.env.REQUIRED_ROLE_NAME,
  ADMIN_USER_IDS: (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean),
  
  // Activity Analysis
  MIN_UNIQUE_USERS: parseInt(process.env.MIN_UNIQUE_USERS) || 3,
  MIN_MESSAGES_WINDOW: parseInt(process.env.MIN_MESSAGES_WINDOW) || 10,
  ANALYSIS_MINUTES: parseInt(process.env.ANALYSIS_MINUTES) || 10,
  
  // Event Management
  EVENT_COOLDOWN_HOURS: parseInt(process.env.EVENT_COOLDOWN_HOURS) || 2,
  CHECK_INTERVAL_MINUTES: parseInt(process.env.CHECK_INTERVAL_MINUTES) || 5,
  
  // State Machine
  STATES: {
    IDLE: 'idle',
    ANALYZING: 'analyzing',
    PREPARING: 'preparing',
    ACTIVE: 'active',
    COOLDOWN: 'cooldown'
  }
};