const { Colors } = require("discord.js");
const { Op } = require("sequelize");

module.exports = {
    getColorOptions() {
        let options = [];
        const colorKeys = Object.getOwnPropertyNames(Colors)

        for(let i = 0; i < colorKeys.length; i++){
            options.push({
                name: colorKeys[i],
                value: Colors[colorKeys[i]].toString()
            })
        }

        const blacklist = [
            Colors.DarkButNotBlack.toString(),
            Colors.NotQuiteBlack.toString(),
            Colors.DarkGrey.toString(),
            Colors.DarkerGrey.toString(),
            Colors.Default.toString()
        ]

        let filtered = options.filter(option => (!blacklist.includes(option.value)))
        return filtered;
    }
}