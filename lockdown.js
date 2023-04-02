const {
  EmbedBuilder,
  ChannelType,
  PermissionsBitField,
} = require('discord.js');
const schedule = require('node-schedule');
const { lockdown } = require('./config.json');
//const { client } = require('./discord');
const { DatabaseTables } = require("./enums.js");
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

// Lock job
module.exports = {
  async execute(client) {
    schedule.scheduleJob(lockdown.time.lock, async () => {
      const Database = client.database;
    
      const channelIDs = await Database.get(DatabaseTables.LockdownChannelIDs).findAll({
        where: {guildID: {
            [Op.in]: client.guilds.cache.map(guild => guild.id)
          }
        }
      });
    
      for (let i = 0; i < channelIDs.length; i++) {
        let channelId = channelIDs[i].channelID;

        const channel = client.channels.resolve(channelId);
        if (!channel) continue;
    
        const everyoneId = channel.guild.roles.everyone.id;
        console.log(`Everyone ID: ${everyoneId}`)
    
        const permissionOverwrites = channel.permissionOverwrites;
    
        // Extract allow and deny permissions overwrite flags as array for @everyone.

        permissionOverwrites.edit(everyoneId, {
          SendMessages: false,
          Connect: false,
          Speak: false
        })
    
        // Send embed
        if (channel.type === ChannelType.GuildText) {
          lockdown.embed.color = Number(lockdown.embed.color);
          const embed = new EmbedBuilder(lockdown.embed);
          await channel.send({ embeds: [embed] });
        }
      }
    });
    
    // Unlock job
    schedule.scheduleJob(lockdown.time.unlock, async () => {
      const Database = client.database;
    
      const channelIDs = await Database.get(DatabaseTables.LockdownChannelIDs).findAll({
        where: {guildID: {
            [Op.in]: client.guilds.cache.map(guild => guild.id)
          }
        }
      });
    
      for (let i = 0; i < channelIDs.length; i++) {
        let channelId = channelIDs[i].channelID;

        const channel = client.channels.resolve(channelId);
        if (!channel) continue;
    
        const everyoneId = channel.guild.roles.everyone.id;
        console.log(`Everyone ID: ${everyoneId}`)
    
        const permissionOverwrites = channel.permissionOverwrites;
    
        // Extract allow and deny permissions overwrite flags as array for @everyone.

        permissionOverwrites.edit(everyoneId, {
          SendMessages: true,
          Connect: true,
          Speak: true
        })
    
        // Delete bot message
        if (channel.type === ChannelType.GuildText) {
          const lastMessage = (
            await channel.messages.fetch({
              limit: 1,
            })
          ).first();
    
          if (lastMessage && lastMessage.author.id === client.user.id)
            await lastMessage.delete();
        }
      }
    });
  } 
}