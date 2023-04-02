const { Events } = require('discord.js');
const lockdown = require('../lockdown');
const {development, clearDB, clearRoles} = require('../config.json');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client, Tables) {
        let SyncOptions = {
            alter: development,
            force: clearDB
        }

        for(let i = 0; i < Tables.length; i++) {
            Tables[i].Table.sync(SyncOptions);
            client.database.set(Tables[i].Name, Tables[i].Table);
        }

        

        lockdown.execute(client);

        console.log(`Ready! Logged in as ${client.user.tag}`);
    },
};