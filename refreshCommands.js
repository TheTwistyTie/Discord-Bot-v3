const {REST, Routes} = require('discord.js');
const { clientID, devGuildID, token, development } = require('./config.json');
const fs = require('node:fs');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10'}).setToken(token);

(async () => {
    try {
        console.log(`Staarted refreshing ${commands.length} application (/) commands.`);

        let route;
        if(development) {
            route = Routes.applicationGuildCommands(clientID, devGuildID);
        } else {
            route = Routes.applicationCommands(clientID);
        }

        const data = await rest.put(
            route,
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.log(error);
    }
})();