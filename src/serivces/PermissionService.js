const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config');

class PermissionService {
  static REQUIRED_PERMISSIONS = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.AddReactions,
    PermissionFlagsBits.MentionEveryone
  ];

  static async checkPermissions(guild, client) {
    const botMember = await guild.members.fetch(client.user.id);
    const requiredRole = guild.roles.cache.find(r => r.name === config.REQUIRED_ROLE_NAME);
    
    if (!requiredRole) {
      return {
        hasPermission: false,
        reason: `❌ Chưa có vai trò "${config.REQUIRED_ROLE_NAME}"\n\n**Hướng dẫn:**\n1. Server Settings → Roles → Create Role\n2. Tên: "${config.REQUIRED_ROLE_NAME}"\n3. Quyền: View Channels, Send Messages, Read Message History, Add Reactions, Mention Everyone\n4. Gán role cho bot`
      };
    }
    
    if (!botMember.roles.cache.has(requiredRole.id)) {
      return {
        hasPermission: false,
        reason: `❌ Bot chưa có role "${config.REQUIRED_ROLE_NAME}"\n\nClick phải vào bot → Roles → Chọn "${config.REQUIRED_ROLE_NAME}"`
      };
    }
    
    return { hasPermission: true };
  }

  static async notifyMissingPermissions(guild, client) {
    const check = await this.checkPermissions(guild, client);
    if (!check.hasPermission) {
      try {
        const owner = await guild.fetchOwner();
        await owner.send({
          embeds: [new EmbedBuilder()
            .setTitle('🚫 Bot Cần Quyền')
            .setDescription(check.reason)
            .setColor('#FF0000')
            .setFooter({ text: guild.name })]
        });
      } catch (err) {
        // Không gửi được DM, thử gửi vào channel
        const channel = guild.channels.cache.find(c => 
          c.isTextBased() && 
          c.permissionsFor(botMember)?.has(PermissionFlagsBits.SendMessages)
        );
        
        if (channel) {
          await channel.send({
            embeds: [new EmbedBuilder()
              .setTitle('🚫 Bot Cần Quyền Để Hoạt Động')
              .setDescription(check.reason)
              .setColor('#FF0000')]
          });
        }
      }
    }
    return check.hasPermission;
  }
}

module.exports = PermissionService;