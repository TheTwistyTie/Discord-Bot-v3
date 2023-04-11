const { DatabaseTables } = require("../enums");
const { getPageHandler } = require("../objects/pageHandler");

module.exports = {
    async viewResources(interaction, type) {
        let database = interaction.client.database;
        let typeID = type.id;

        let resources = await database.get(DatabaseTables.Resources).findAll({
            where: {guildID: interaction.guild.id, resourceTypeID: typeID, finished: true}
        })

        if(resources.length < 1) {
            interaction.reply({
                content: `Unfortunatly there are no ${type.name} yet.`,
                ephemeral: true
            })

            return;
        }

        interaction.reply({
            content: "Please continue your search in your direct messages. You'll see a message from me in the top left corner!",
            ephemeral: true
        })

        let pageHandler = getPageHandler(resources, await interaction.user.createDM(), database, "viewResources", {type: true, tags: true}, {interaction: interaction});
    }
}