const { ButtonBuilder, ActionRowBuilder, SelectMenuBuilder } = require("@discordjs/builders");
const { ButtonStyle } = require("discord.js");
const { DatabaseTables } = require("../enums");
const { getResourceTags } = require("../shared/getResourceTags");
const { looseEnd } = require("../shared/looseEnd");
const { getMessageObject } = require("./pageMessageObject");

let _Resources;
let _ResourceObjs = [];
let _Channel;
let _CallBack;
let _Database;

let _HandlerType;
let _FilterOptions;

const __PageLength = 4;
let _PageCount;
let _ResourceIndexes;

let _CurrentPage = 0;

let _Filters;
let _FiltersMessage;
let _FilterCollector;

let _PageButtons;
let _PageButtonsMessage;
let _PageButtonCollector;

const __FilterTypes = [
    {
        Table: DatabaseTables.ResourceTags,
        InteractionName: "typeFilter",
        Name: "type"
    },
    {
        Table: DatabaseTables.Tags,
        InteractionName: "tagFilter",
        Name:"tag"
    }
]

let _CurrentTypeFilters = []
let _CurrentTagFilters = []

let _FilterdResoucreObjs = []

module.exports = {
    async getPageHandler(Resources, Channel, Database, HandlerType, FilterOptions = {type: false, tags: false,}, CallBack = null) {
        _CallBack = CallBack;
        _Channel = Channel;
        _Database = Database;
        _Resources = Resources;
        _HandlerType = HandlerType;
        _FilterOptions = FilterOptions;

        await getMessageObjects()

        start();

        return {
            removeAllMessages: removeAllMessages
        }
    }
}

async function start() {
    await showFilters()
    await showResourceMessages()
    await showPageButtons()

    CreateCollectors()
}

async function refresh() {
    removeAllMessages()

    await showResourceMessages();
    await showPageButtons();

    CreateCollectors()
}

async function showFilters() {
    await getFilters();

    if(_Filters.length > 0) {
        _FiltersMessage = await _Channel.send({
            content: "Filters:",
            components: _Filters,
            fetchReply: true
        })
    }
}

function showResourceMessages() {
    for(let i = _ResourceIndexes[0]; i <= _ResourceIndexes[_ResourceIndexes.length - 1]; i++) {
        _FilterdResoucreObjs[i].addMessage(_Channel);
    }
}

function removeVisibleMessages() {
    for(let i = _ResourceIndexes[0]; i , _ResourceIndexes[_ResourceIndexes.length - 1]; i++) {
        _FilterdResoucreObjs[i].removeMessage();
    }
}

function removeAllMessages() {
    for(let i = 0; i < _ResourceObjs.length; i++) {
        _ResourceObjs[i].removeMessage();
    }
}

async function showPageButtons() {
    if(_PageButtonsMessage) {
        _PageButtonsMessage.delete()
    }

    getPageButtons()

    _PageButtonsMessage = await _Channel.send({
        content: `${_CurrentPage + 1} of ${_PageCount}`,
        components: [_PageButtons],
        fetchReply: true
    })
}

function CreateCollectors() {
    if(_FiltersMessage && !_FilterCollector) {
        _FilterCollector = _FiltersMessage.createMessageComponentCollector()
    }

    _PageButtonCollector = _PageButtonsMessage.createMessageComponentCollector();

    Collect();
}

function Collect() {
    _FilterCollector.on("collect", filterInteraction => {
        let filterType = filterInteraction.customId;
        let values = filterInteraction.values;

        filter(filterType, values);

        looseEnd(filterInteraction)
    })

    _PageButtonCollector.on("collect", async pageButtonInteraction => {
        _PageButtonsMessage.delete();

        let start;
        switch(pageButtonInteraction.customId) {
            case "pageBack":
                removeVisibleMessages();

                start = _ResourceIndexes[0];
                _ResourceIndexes = [];

                for(let i = start; i > start - 4; i--) {
                    _ResourceIndexes.push(i);
                }

                _ResourceIndexes.reverse();
                _CurrentPage--;

                refresh()
                break;
            case "pageClose":
                _FiltersMessage.delete();
                removeAllMessages();
                break;
            case "pageNext":
                removeVisibleMessages();

                start = _ResourceIndexes[3];
                _ResourceIndexes = [];

                _CurrentPage++;

                for(let i = start; i < start + getPageLength(); i++) {
                    _ResourceIndexes.push(i);
                }

                refresh()
                break;
        }

        looseEnd(pageButtonInteraction)
    })
}

async function filter(type, values) {
    let filterType = __FilterTypes.filter(ft => {
        return ft.InteractionName == type
    })

    let currentFilter = filterType[0].Name == "role" ? _CurrentTypeFilters : filterType[0].Name == "tag" ? _CurrentTagFilters : null
    filterType[0].Name == "role" ? _CurrentTypeFilters = values : filterType[0].Name == "tag" ? _CurrentTagFilters =values : null

    if(!currentFilter || currentFilter.length > 0){
        _FilterdResoucreObjs = _ResourceObjs;
    }

    _FilterdResoucreObjs = await _FilterdResoucreObjs.filter(async fro => {
        return _CurrentTypeFilters.includes(fro.resourceTypeID) && await _CurrentTagFilters.some(async CTF => await fro.getTags().includes(CTF)); 
    })

    for(let i = start; i < start + getPageLength(); i++) {
        _ResourceIndexes.push(i);
    }

    setPageCount();

    refresh()
}

async function getFilters() {
    let filterRows = [];

    if(_FilterOptions.roles) {
        let types = await _Database[__FilterTypes[0].Table].findAll({
            where: {guildID: _Resources[0].guildID}
        })

        if(types.length > 0) {
            let options = [];
            for(let i = 0; i < types.length; i++) {
                options.push({
                    label: types[i].name,
                    value: types[i].id.toString()
                })
            }

            filterRows.push(
                new ActionRowBuilder()
                    .addComponents(
                        new SelectMenuBuilder()
                            .setCustomId("typeFilter")
                            .setPlaceholder("Filter by resource type")
                            .setOptions(options)
                            .setMaxValues(options.length)
                    )
            )
        }
    }

    if(_FilterOptions.tags) {
        let tags = await _Database.get(__FilterTypes[1].Table).findAll({
            where: {guildID: _Resources[0].guildID}
        })

        if(tags.length > 0) {
            let options = [];
            for(let i = 0; i < tags.length; i++) {
                options.push({
                    label: tags[i].name,
                    value: tags[i].id.toString()
                })
            }

            filterRows.push(
                new ActionRowBuilder()
                    .addComponents(
                        new SelectMenuBuilder()
                            .setCustomId("tagFilter")
                            .setPlaceholder("Filter by tag")
                            .setOptions(options)
                            .setMaxValues(options.length)
                    )
            )
        }
    }

    _Filters = filterRows;
}

async function getMessageObjects() {
    for(let i = 0; i < _Resources.length; i++) {
        _ResourceObjs.push(await getMessageObject(_Resources[i], _HandlerType, _Database, _CallBack));
    }

    _FilterdResoucreObjs = _ResourceObjs;

    setPageCount()
    
    _ResourceIndexes = [];
    for(let i = 0; i < getPageLength(); i++) {
        _ResourceIndexes.push(i)
    }
}

function setPageCount() {
    _PageCount = Math.floor(_FilterdResoucreObjs.length / __PageLength);
    _PageCount += _FilterdResoucreObjs.length % __PageLength == 0 ? 0 : 1
}

function getPageLength() {
    let pageLength = __PageLength;
    if(_CurrentPage + 1 == _PageCount) {
        pageLength = _FilterdResoucreObjs.length % __PageLength
    } 
    return pageLength
}

function getPageButtons() {
    let backButton = new ButtonBuilder()
        .setCustomId("pageBack")
        .setStyle(ButtonStyle.Primary)

    _CurrentPage == 0 ? backButton.setLabel(`<`).setDisabled(true) : backButton.setLabel(`< ${_CurrentPage}`)

    let nextButton = new ButtonBuilder()
        .setCustomId("pageNext")
        .setStyle(ButtonStyle.Primary)

    _CurrentPage == _PageCount ? nextButton.setLabel(`>`).setDisabled(true) : nextButton.setLabel(`${_CurrentPage + 2} >`)

    let closeButton = new ButtonBuilder()
        .setCustomId("pageClose")
        .setLabel("Close")
        .setStyle(ButtonStyle.Danger)

    _PageButtons = new ActionRowBuilder()
        .addComponents(
            backButton,
            closeButton,
            nextButton
        )
}