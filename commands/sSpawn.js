const { ButtonBuilder } = require("@discordjs/builders");
const { SlashCommandBuilder, ChannelType, ActionRowBuilder, ButtonStyle, PermissionFlagsBits, Colors } = require("discord.js");
const { DatabaseTables } = require("../enums");
const { execute } = require("./sEcho");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spawn')
        .setDescription('Spawns the start button')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The Channel to add the start object to.')
                .addChannelTypes(ChannelType.GuildText)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel') ?? interaction.channel;

        let settings = await interaction.client.database.get(DatabaseTables.Settings).findOne({
            where: {guildID: interaction.guild.id}
        });

        if(!settings) {
            let modRole = await interaction.guild.roles.create({
                name: `${interaction.client.user.username} Moderator`,
                color: Colors.DarkGrey
            })

            let editorRole = await interaction.guild.roles.create({
                name: "Resource Editor",
                color: Colors.DarkButNotBlack
            })

            let modCreateRowCount = await interaction.client.database.get(DatabaseTables.Roles).create({
                guildID: interaction.guild.id,
                name: "Moderator",
                roleID: modRole.id,
                roleTypeID: -1,
                canEditResources: true,
                isMod: true
            })

            let editorCreateRowCount = await interaction.client.database.get(DatabaseTables.Roles).create({
                guildID: interaction.guild.id,
                name: "Resource Editor",
                roleID: editorRole.id,
                roleTypeID: -1,
                canEditResources: true,
                isMod: false
            })

            if(modCreateRowCount && editorCreateRowCount) {
                let rowCount = await interaction.client.database.get(DatabaseTables.Settings).create({
                    guildID: interaction.guild.id,
                    initialized: true
                })

                console.log(`Inizialized ${interaction.guild.name}`)
            } else {
                console.log("Seems like a required role was not added.")
                console.log(editorCreateRowCount);
                console.log(modCreateRowCount);
            }
        }

        await channel.send({
            content: 'Click the button to open the menu.',
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('spawnMenu')
                        .setLabel('Menu')
                        .setStyle(ButtonStyle.Primary)
                )
            ]
        })

        interaction.reply({
            content: 'Spawned.',
            ephemeral: true
        })
    }
}