// config database connection and models
const { Pool } = require('pg');
const config = require('../config/config');

class Database {
  constructor() {
    this.pool = new Pool({
      connectionString: config.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }

  async init(){
    const client = await this.pool.connect();
    try {
      // Create guild_activity table
      await client.query(`
        CREATE TABLE IF NOT EXISTS guild_activity (
          id SERIAL PRIMARY KEY,
          guild_id VARCHAR(20) NOT NULL,
          channel_id VARCHAR(20) NOT NULL,
          user_id VARCHAR(20) NOT NULL,
          message_count INTEGER DEFAULT 1,
          last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          activity_date DATE DEFAULT CURRENT_DATE
        );
      `);

      // Create unique constraint separately
      await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_daily_activity 
        ON guild_activity(guild_id, channel_id, user_id, activity_date);
      `);

      // Create event_history table
      await client.query(`
        CREATE TABLE IF NOT EXISTS event_history (
          id SERIAL PRIMARY KEY,
          guild_id VARCHAR(20) NOT NULL,
          channel_id VARCHAR(20) NOT NULL,
          event_type VARCHAR(50) NOT NULL,
          participants TEXT[],
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create bot_state table
      await client.query(`
        CREATE TABLE IF NOT EXISTS bot_state (
          guild_id VARCHAR(20) PRIMARY KEY,
          current_state VARCHAR(20) DEFAULT 'idle',
          last_event_at TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_activity_guild_channel 
        ON guild_activity(guild_id, channel_id, last_message_at);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_event_history_guild 
        ON event_history(guild_id, created_at);
      `);

      console.log('✅ Database initialized');
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async trackMessage(guildId, channelId, userId) {
    await this.pool.query(`
      INSERT INTO guild_activity (guild_id, channel_id, user_id, message_count, last_message_at, activity_date)
      VALUES ($1, $2, $3, 1, CURRENT_TIMESTAMP, CURRENT_DATE)
      ON CONFLICT (guild_id, channel_id, user_id, activity_date)
      DO UPDATE SET 
        message_count = guild_activity.message_count + 1,
        last_message_at = CURRENT_TIMESTAMP
    `, [guildId, channelId, userId]);
  }

  async getChannelActivity(guildId, minutesAgo = 10) {
    const result = await this.pool.query(`
      SELECT 
        channel_id,
        COUNT(DISTINCT user_id) as unique_users,
        SUM(message_count) as total_messages,
        ARRAY_AGG(DISTINCT user_id) as user_ids
      FROM guild_activity
      WHERE guild_id = $1
        AND last_message_at > NOW() - INTERVAL '${minutesAgo} minutes'
        AND activity_date = CURRENT_DATE
      GROUP BY channel_id
      HAVING COUNT(DISTINCT user_id) >= $2
      ORDER BY total_messages DESC
      LIMIT 1
    `, [guildId, config.MIN_UNIQUE_USERS]);

    return result.rows[0] || null;
  }

  async saveEvent(guildId, channelId, eventType, participants) {
    await this.pool.query(`
      INSERT INTO event_history (guild_id, channel_id, event_type, participants)
      VALUES ($1, $2, $3, $4)
    `, [guildId, channelId, eventType, participants]);
  }

  async getState(guildId) {
    const result = await this.pool.query(`
      SELECT current_state, last_event_at
      FROM bot_state
      WHERE guild_id = $1
    `, [guildId]);

    if (result.rows.length === 0) {
      await this.pool.query(`
        INSERT INTO bot_state (guild_id, current_state)
        VALUES ($1, 'idle')
      `, [guildId]);
      return { current_state: 'idle', last_event_at: null };
    }

    return result.rows[0];
  }

  async setState(guildId, state) {
    await this.pool.query(`
      INSERT INTO bot_state (guild_id, current_state, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (guild_id)
      DO UPDATE SET 
        current_state = $2,
        updated_at = CURRENT_TIMESTAMP
    `, [guildId, state]);
  }

  async setLastEventTime(guildId) {
    await this.pool.query(`
      UPDATE bot_state
      SET last_event_at = CURRENT_TIMESTAMP
      WHERE guild_id = $1
    `, [guildId]);
  }

  async getStats(guildId) {
    const activity = await this.pool.query(`
      SELECT 
        channel_id,
        COUNT(DISTINCT user_id) as unique_users,
        SUM(message_count) as total_messages
      FROM guild_activity
      WHERE guild_id = $1
        AND activity_date = CURRENT_DATE
      GROUP BY channel_id
      ORDER BY total_messages DESC
      LIMIT 5
    `, [guildId]);

    const events = await this.pool.query(`
      SELECT event_type, COUNT(*) as count
      FROM event_history
      WHERE guild_id = $1
        AND created_at > NOW() - INTERVAL '7 days'
      GROUP BY event_type
    `, [guildId]);

    return {
      topChannels: activity.rows,
      recentEvents: events.rows
    };
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = new Database();