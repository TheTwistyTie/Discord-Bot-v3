const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Colors, PermissionFlagsBits } = require("discord.js");
const { Sequelize } = require("sequelize");
const { addType } = require("./sAddRoleType");
const { DatabaseTables } = require("../enums");

const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'database.sqlite'
});

sequelize.sync();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addrole')
        .setDescription('Add a role to your server.')
        .addStringOption(option =>
            option.setName('roletype')
                .setDescription('The type of role you are trying to add.')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option => 
            option.setName('rolename')
                .setDescription('The name of the role you are adding.')
                .setRequired(true)   
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const roleName = interaction.options.getString('rolename');
        const roleType = interaction.options.getString('roletype');

        try {
            const database = interaction.client.database;
            
            const RoleType = await database.get('roleTypes').findOne({
                where: {guildID: interaction.guild.id, name: roleType}
            })

            if(RoleType.length == 0) {
                let message = interaction.reply({
                    content: `Role type ${roleType} doesnt exist yet. Would you like to add it?`,
                    components: [
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('addRoleType')
                                    .setLabel('Yes')
                                    .setStyle(ButtonStyle.Success),
                                new ButtonBuilder()
                                    .setCustomId('cancel')
                                    .setLabel('Cancel')
                                    .setStyle(ButtonStyle.Danger)
                            )
                    ],
                    ephemeral: true,
                    fetchReply: true
                })

                const collector = message.createMessageComponentCollector({componentType: ComponentType.Button})
                collector.on('collect', async i=> {
                    if(i.customId == 'addRoleType'){
                        await addType(roleType, interaction, {roleName: roleName})
                    }
                })
                
                return;
            }

            await this.addRole(roleName, RoleType, interaction);
            
        } catch (e) {
            console.log(e);
        }
    },
    async addRole(roleName, roleType, interaction) {
        try {
            const client = interaction.client;
            const RoleNames = await client.database.get('roles').findOne({
                where: {guildID: interaction.guild.id, name: roleName, roleTypeID: roleType.id}
            })

            if(RoleNames) {
                const roles = await interaction.guild.roles.fetch()
                const Role = roles.find(role => role.id === RoleNames.roleID)

                if(Role) {
                    return await interaction.reply(`${roleName} already exists.`)
                }

                const newRole = await interaction.guild.roles.create({
                    name: roleName,
                    reason: 'Couldnt find saved role.'
                });

                return await interaction.reply(`Refreshed ${roleName}, <@&${newRole.id}>`);
            }
            console.log(roleType.color);
            const newRole = await interaction.guild.roles.create({
                name: roleName,
                color: parseInt(roleType.color) || Colors.Blurple,
                reason: 'Adding new role.'
            })

            const role = await client.database.get('roles').create({
                guildID: interaction.guild.id,
                name: roleName,
                roleID: newRole.id,
                roleTypeID: roleType.id
            })

            await interaction.reply({
                content: `Role <@&${role.roleID}> added.`,
                ephemeral: true
            })
        } catch (error) {
            console.log(error);
            await interaction.reply({
                content: 'There was an error trying to add this role.',
                ephemeral: true
            })
        }
    }
}