module.exports = {
    looseEnd(interaction) {
        let message = interaction.reply("Clicked");
        interaction.deleteReply();
    }
}

