const { Client, GatewayIntentBits, EmbedBuilder, PresenceUpdateStatus } = require('discord.js');
const cron = require('node-cron');
const config = require('./config/config');
const db = require('./database/Database');
const PermissionService = require('./services/PermissionService');
const EventExecutor = require('./services/EventExecutor');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
  ]
});

// ============= MAIN LOGIC =============
async function analyzeAndCreateEvent(guildId) {
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    // Check permissions
    const hasPermission = await PermissionService.checkPermissions(guild, client);
    if (!hasPermission.hasPermission) {
      console.log(`⚠️ No permission in ${guild.name}`);
      return;
    }

    // Check state
    const state = await db.getState(guildId);
    if (state.current_state !== config.STATES.IDLE) {
      console.log(`⏸️ Guild ${guild.name} is in state: ${state.current_state}`);
      return;
    }

    // Check cooldown
    if (state.last_event_at) {
      const hoursSinceLastEvent = (Date.now() - new Date(state.last_event_at)) / (1000 * 60 * 60);
      if (hoursSinceLastEvent < config.EVENT_COOLDOWN_HOURS) {
        console.log(`⏳ Cooldown active for ${guild.name}`);
        return;
      }
    }

    // Get hottest channel with unique users
    const activity = await db.getChannelActivity(guildId, config.ANALYSIS_MINUTES);
    
    if (!activity) {
      console.log(`📊 No activity in ${guild.name}`);
      return;
    }

    console.log(`🔥 Hot channel: ${activity.channel_id}, Users: ${activity.unique_users}, Messages: ${activity.total_messages}`);

    // Get channel and online members
    const channel = guild.channels.cache.get(activity.channel_id);
    if (!channel) return;

    const onlineMembers = [];
    for (const userId of activity.user_ids) {
      try {
        const member = await guild.members.fetch(userId);
        if (member && member.presence?.status === 'online') {
          onlineMembers.push(userId);
        }
      } catch (err) {
        // Member not found or can't fetch presence
      }
    }

    if (onlineMembers.length < 2) {
      console.log(`👥 Not enough online members (${onlineMembers.length})`);
      return;
    }

    console.log(`✅ Creating event with ${onlineMembers.length} online members`);

    // Set state to preparing
    await db.setState(guildId, config.STATES.PREPARING);

    // Random delay (jitter) to avoid race conditions
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5000));

    // Execute event
    await db.setState(guildId, config.STATES.ACTIVE);
    const success = await EventExecutor.execute(channel, onlineMembers, guildId);

    if (success) {
      await db.setLastEventTime(guildId);
      await db.setState(guildId, config.STATES.COOLDOWN);
      
      // Auto return to IDLE after cooldown
      setTimeout(async () => {
        await db.setState(guildId, config.STATES.IDLE);
        console.log(`🔄 ${guild.name} returned to IDLE`);
      }, config.EVENT_COOLDOWN_HOURS * 60 * 60 * 1000);
      
      console.log(`🎉 Event created successfully in ${guild.name}`);
    } else {
      await db.setState(guildId, config.STATES.IDLE);
    }

  } catch (error) {
    console.error(`Error in analyzeAndCreateEvent for guild ${guildId}:`, error);
    await db.setState(guildId, config.STATES.IDLE);
  }
}

// ============= EVENT HANDLERS =============
client.once('ready', async () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} servers`);
  
  // Initialize database
  await db.init();
  
  // Check permissions for all guilds
  for (const [, guild] of client.guilds.cache) {
    await PermissionService.notifyMissingPermissions(guild, client);
  }
  
  // Schedule event checker
  const cronPattern = `*/${config.CHECK_INTERVAL_MINUTES} * * * *`;
  console.log(`⏰ Scheduler: Every ${config.CHECK_INTERVAL_MINUTES} minutes`);
  
  cron.schedule(cronPattern, async () => {
    console.log('🔍 Checking for event opportunities...');
    for (const [guildId] of client.guilds.cache) {
      await analyzeAndCreateEvent(guildId);
    }
  });
});

client.on('guildCreate', async (guild) => {
  console.log(`➕ Joined new server: ${guild.name}`);
  await PermissionService.notifyMissingPermissions(guild, client);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  
  // Track message for analytics
  await db.trackMessage(message.guild.id, message.channel.id, message.author.id);
  
  // Admin-only stats command
  if (message.content === '!botstats' && config.ADMIN_USER_IDS.includes(message.author.id)) {
    const state = await db.getState(message.guild.id);
    const stats = await db.getStats(message.guild.id);
    const activity = await db.getChannelActivity(message.guild.id, config.ANALYSIS_MINUTES);
    
    const embed = new EmbedBuilder()
      .setTitle('🤖 Bot Statistics (Admin Only)')
      .addFields(
        { name: '⚙️ Current State', value: state.current_state.toUpperCase(), inline: true },
        { name: '🕐 Last Event', value: state.last_event_at ? `<t:${Math.floor(new Date(state.last_event_at).getTime() / 1000)}:R>` : 'None', inline: true },
        { name: '🔥 Hot Channel Now', value: activity ? `<#${activity.channel_id}> (${activity.unique_users} users, ${activity.total_messages} msgs)` : 'None' },
        { name: '📊 Top Channels Today', value: stats.topChannels.slice(0, 3).map(c => `<#${c.channel_id}>: ${c.unique_users} users, ${c.total_messages} msgs`).join('\n') || 'No data' },
        { name: '🎮 Recent Events (7 days)', value: stats.recentEvents.map(e => `${e.event_type}: ${e.count}x`).join('\n') || 'No events yet' }
      )
      .setColor('#2ECC71')
      .setFooter({ text: `Check interval: ${config.CHECK_INTERVAL_MINUTES}min | Cooldown: ${config.EVENT_COOLDOWN_HOURS}h` })
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
});

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

client.on('error', (error) => {
  console.error('Discord client error:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down...');
  await db.close();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down...');
  await db.close();
  client.destroy();
  process.exit(0);
});

// Start bot
client.login(config.DISCORD_TOKEN);