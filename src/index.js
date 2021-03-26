const { Client, MessageEmbed } = require('discord.js')
const client = new Client()
const Reddit = require('reddit-helper')
const reddit = new Reddit()
const config = require('./config.json')

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`)
    sreddit()
})

async function sreddit() {
    reddit.setMinutes(1)
    reddit.setLogging(true)

    await reddit.sub.bulk.add(config.subreddit)

    reddit.on('ready', () => {
        console.log(`Reddit Notifier is running.`)
    })

    reddit.on('post', (sub, data) => {
        if(config.channelID) {
            client.channels.cache.get(config.channelID)
            .send(new MessageEmbed()
            .setTitle(data[0].title)
            .setImage(data[0].url)
            .setFooter(`u/${data[0].author.name} | r/${data[0].sub.name}`)
            .setURL(data[0].permalink)
            .setTimestamp()
            .setColor("RANDOM")
            )
        } else {
            return
        }
    })

    await reddit.start()
}

client.login(config.token)
