const {token} = require('./config.json');

const fs = require('node:fs');
const path = require('node:path');
const Sequelize = require('sequelize');

const {Client, Collection, Events, GatewayIntentBits} = require('discord.js');
const { getAllDirectoryFiles } = require('./shared/getAllDirectoryFiles');
const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildBans ]}); //, GatewayIntentBits.MessageContent

const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'database.sqlite'
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else{
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
    }
}

const tablesPath = path.join(__dirname, 'Tables');
const tablesFiles = fs.readdirSync(tablesPath).filter(file => file.endsWith('.js'));
client.database = new Collection();

let Tables = []
tablesFiles.forEach(file => {
    const tablePath = path.join(tablesPath, file);
    const tableObj = require(tablePath);

    let Table = tableObj.initialize(sequelize);
    Tables.push({
        Table: Table,
        Name: tableObj.data.name
    });
});

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if(event.once) {
        client.once(event.name, (...args) => event.execute(...args, Tables));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

const buttonActionsPath = path.join(__dirname, 'events', 'buttonActions')
const buttonActionsFiles = getAllDirectoryFiles(buttonActionsPath).filter(file => file.endsWith('.js'))

client.buttonEvents = new Collection();
for (const file of buttonActionsFiles) {
    const action = require(file);
    client.buttonEvents.set(action.name, action);
}

for(const key in client.database){
    if('link' in client.database[key]) {
        client.database[key].link(client.database);
    }

    if(('classify' in database[key])){
        client.database[key].classify(client.database);
    } else {
        console.log(`[WARNING] ${key} does not have a classify property.`)
    }
}

const prompt = require('prompt-sync')({sigint: true});

client.login(token);