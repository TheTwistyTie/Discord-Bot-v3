const { Events, Colors } = require("discord.js");
const { DatabaseTables } = require("../enums");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if(!interaction.isAutocomplete()) return;

        const focusedValue = interaction.options.getFocused(true); 

        let databaseName;
        switch(focusedValue.name) {
            case 'roletype':
                databaseName = DatabaseTables.RoleTypes
                break;
            default:
                interaction.respond({
                    name: 'Unknown Autocomplete',
                    value: 'null'
                })
                return;
        }

        const choices = await interaction.client.database.get(databaseName).findAll({
            where: {guildID: interaction.guild.id}
        })
        if(choices.length == 0) {
            interaction.respond([{
                name: 'No role types found.',
                value: 'addNew'
            }])
            return;
        }
        
        const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(focusedValue.value.toLowerCase()))

        if(!filtered) {
            interaction.respond([{
                name: 'No role types found.',
                value: 'addNew'
            }])
            return;
        }

        interaction.respond(
            filtered.map(choice => ({name: choice.name, value: choice.name}))
        )
    }
}