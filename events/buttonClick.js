const { Events } = require("discord.js");
const { create } = require("./buttonActions/spawnMenu");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if(!interaction.isButton()) return;

        const event = interaction.client.buttonEvents.get(interaction.customId);

        if(!event) {
            return;
        }

        try {
            await event.execute(interaction);
        } catch (error) {
            console.log(error);
            await interaction.reply({content: `There was an error when trying to click this button. Please inform @TheTwistytie.`, ephemeral: true});
        }
    }
}