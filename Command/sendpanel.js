const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton, Permissions } = require('discord.js');
const { QuickDB } = require("quick.db")
const db = new QuickDB

module.exports = {
    data: new SlashCommandBuilder()
        .setName('send-panel')
        .setDescription('Send the ticket panel.'),
        permissions: [ Permissions.FLAGS.ADMINISTRATOR ],
    async execute(interaction, client) {
          let channelv = db.get(`ticketPanel_${interaction.guild.id}`);
          let category = db.get(`parentCategory_${interaction.guild.id}`);

          if(!interaction.member.permissions.has('ADMINISTRATOR')) return interaction.reply({ content: "You don't have the permissions to do this you need the *ADMINISTRATOR* permission!", ephemeral: true })

          let replyEmbed = new MessageEmbed()
          .setAuthor('Ticket >> Ticket Panel Sent!', interaction.guild.iconURL())
          .setDescription(`${interaction.user}, ticket panel has sent to <#${channelv}>`)
          interaction.reply({ embeds: [replyEmbed], ephemeral: true })

          const embed = new MessageEmbed()
          .setAuthor('Ticket Support', client.user.displayAvatarURL())
          .setDescription('Press the button to create a ticket.\n**__Rules__**\n*Dont spam open tickets you will get punished for this.\nDont open a ticket and not respond*\n**Open a ticket means you have accepted the rules and they wont get broken in the process!**')
          .setFooter(client.user.username, client.user.displayAvatarURL())
           const row = new MessageActionRow()
          .addComponents(
            new MessageButton()
            .setCustomId('create-ticket')
            .setLabel('Create ticket')
            .setEmoji('📩')
            .setStyle('PRIMARY'),
          )
          const message = await interaction.channel.send({ embeds: [embed], components: [row] })
    }
}
