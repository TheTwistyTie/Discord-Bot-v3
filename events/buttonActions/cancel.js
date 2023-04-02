const { ActionRowBuilder, ButtonBuilder } = require("@discordjs/builders")
const { ButtonStyle } = require("discord.js")

module.exports = {
    name: 'cancel',
    execute(interaction) {
        
        interaction.reply({
            content: 'Canceled.',
            ephemeral: true
        })
    }
}