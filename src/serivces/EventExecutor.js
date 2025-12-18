const EventTypes = require('../events/EventTypes');
const db = require('../database/Database');

class EventExecutor {
  static async execute(channel, onlineMembers, guildId) {
    const event = EventTypes.selectEvent();
    
    console.log(`🎮 Executing event: ${event.type} in ${channel.name}`);
    
    try {
      const participants = await event.execute(channel, onlineMembers);
      await db.saveEvent(guildId, channel.id, event.type, participants);
      return true;
    } catch (error) {
      console.error('Error executing event:', error);
      return false;
    }
  }
}

module.exports = EventExecutor;