const client = require('..');
const Discord = require('discord.js');
const { MessageEmbed, MessageActionRow, MessageButton, MessageAttachment } = require("discord.js");
const { QuickDB } = require("quick.db")
const db = new QuickDB
const discordTranscripts = require('discord-html-transcripts');
const moment = require('moment');

client.on('interactionCreate', async interaction => {
	if (!interaction.isButton()) return;
  
  let channel = db.get(`ticketPanel_${interaction.guildId}`);
  let staff = db.get(`staffs_${interaction.guild.id}`);
  let category = db.get(`parentCategory_${interaction.guildId}`);

  let Data = db.get(`ticketCount_${interaction.guildId}`)
  if(Data == null) Data = 0;

  if(interaction.customId === 'create-ticket') {
    await interaction.reply({ content: `Creating ticket, please wait...`, ephemeral: true })
    
      const ticket = await interaction.guild.channels.create(`ticket-${interaction.user.username}`, {
        parent: category,
        permissionOverwrites: [
          {
            id: interaction.user.id,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: interaction.guild.roles.everyone,
            deny: ['VIEW_CHANNEL'],
          },
        ],
        type: 'text',
      });

    db.add(`ticketCount_${interaction.guildId}`, 1)
    db.set(`ticket-${ticket.id}_${interaction.guild.id}`, {
      userid: interaction.user.id,
      closed: false
    })
    await interaction.editReply({ content: `Ticket created ${ticket}`, ephemeral: true })


    const welcomeTicket = new MessageEmbed()
    .setAuthor('Ticket Support', client.user.displayAvatarURL())
    .setDescription('Support will be with you shortly.\nTo delete this ticket react with 🔒')
    .setFooter(client.user.username, client.user.displayAvatarURL())
    const closeButton = new MessageActionRow()
    .addComponents(
      new MessageButton()
      .setCustomId('close-ticket')
      .setLabel('Delete')
      .setEmoji('🔒')
      .setStyle('DANGER'),
    )
    const welcome = await client.channels.cache.get(ticket.id).send({ content: `${interaction.user} Welcome`, embeds: [welcomeTicket], components: [closeButton] })
  }


  if(interaction.customId === 'close-ticket') {
    let closed = db.get(`ticket-${interaction.channel.id}_${interaction.guild.id}`)
    if(closed.closed == true) {
      return interaction.reply({ content: `Ticket has already closed...`, ephemeral: true })
    }
    const closeTicket = new MessageEmbed()
    .setDescription(`Ticket Closed by ${interaction.user}`)
    const closeButton = {
        'type': 1,
        'components': [
          {
            'type': 2,
            'style': 'SECONDARY',
            'custom_id': 'transcript',
            'emoji': '📑',
            'label': 'Transcript',
          },
          {
            'type': 2,
            'style': 'SECONDARY',
            'custom_id': 'open',
            'emoji': '🔓',
            'label': 'Open',
          },
          {
            'type': 2,
            'style': 'SECONDARY',
            'custom_id': 'delete',
            'emoji': '⛔',
            'label': 'Delete',
          },
        ]
      }
    
      interaction.channel.id, {
        permissionOverwrites: [
          {
            id: interaction.user.id,
            deny: ['VIEW_CHANNEL'],
          },
          {
            id: interaction.guild.roles.everyone,
            deny: ['VIEW_CHANNEL'],
          },
        ],
      };

      interaction.channel.id, {
        permissionOverwrites: [
        {
          id: closed.userid,
          deny: ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY', 'ATTACH_FILES', 'SEND_MESSAGES'],
        },
      ],
    };

    db.set(`ticket-${interaction.channel.id}_${interaction.guild.id}`, {
      closed: true,
    })

  }


  if(interaction.customId === 'open') {
    let closed = await db.get(`ticket-${interaction.channel.id}_${interaction.guild.id}`)
    if(closed.closed == false) {
      return interaction.reply({ content: `Ticket has already opened...`, ephemeral: true })
    }

    
    let reopen = new MessageEmbed()
    .setDescription(`Ticket Opened by ${interaction.user}`)
    interaction.reply({ embeds: [reopen] })
    interaction.channel.id, {
      permissionOverwrites: [
      {
        id: closed.userid,
        deny: ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY', 'ATTACH_FILES', 'SEND_MESSAGES'],
      },
    ],
  };

  db.set(`ticket-${interaction.channel.id}_${interaction.guild.id}`, {
    ticketclosed: false,
  })
  }


  if(interaction.customId === 'close-ticket') {
    interaction.channel.send({ embeds: [
      new MessageEmbed()
      .setTitle(`Ticket Deleted by ${interaction.user}`)
      .setDescription('Ticket will be deleted in a few seconds')
    ]})

    setTimeout(() => {
      interaction.channel.delete();
    }, 5000)
    db.delete(`ticket-${interaction.channel.id}_${interaction.guild.id}`)
    
    const transcriptType = await db.get(`transcriptType_${interaction.guild.id}`);
    const transcriptChannel = await db.get(`ticketTranscript_${interaction.guild.id}`);
    
    if(transcriptType === 'html') {
    const attachment = await discordTranscripts.createTranscript(interaction.channel);
    await client.channels.cache.get(transcriptChannel).send({ content: `**Ticket Transcript - ${interaction.channel.name}**`, files: [attachment] });
    } else if(transcriptType === 'text') {
        let messages = await interaction.channel.messages.fetch();
        messages = messages.map(m => moment(m.createdTimestamp).format("YYYY-MM-DD hh:mm:ss") +" | "+ m.author.tag + ": " + m.cleanContent).join("\n") || "No messages were in the ticket/Failed logging transcript!";
        const txt = new MessageAttachment(Buffer.from(messages), `transcript_${interaction.channel.id}.txt`)
       client.channels.cache.get(transcriptChannel).send({ content: `**Ticket Transcript - ${interaction.channel.name}**`, files: [txt] })
    } else {
      return;
    }
    
  }


  if(interaction.customId === 'close-ticket') {
    const transcriptType = await db.get(`transcriptType_${interaction.guild.id}`);
    const transcriptChannel = await db.get(`ticketTranscript_${interaction.guild.id}`);
    if(transcriptType === 'html') {
    const attachment = await discordTranscripts.createTranscript(interaction.channel);
    await client.channels.cache.get(transcriptChannel).send({ content: `**Ticket Transcript - ${interaction.channel.name}**`, files: [attachment] });
        interaction.reply({ embeds: [
          new MessageEmbed()
          .setDescription(`Ticket transcript sent to <#${transcriptChannel}>!`)
        ] });
    } else if(transcriptType === 'text') {
        let messages = await interaction.channel.messages.fetch();
        messages = messages.map(m => moment(m.createdTimestamp).format("YYYY-MM-DD hh:mm:ss") +" | "+ m.author.tag + ": " + m.cleanContent).join("\n") || "No messages were in the ticket/Failed logging transcript!";
        const txt = new MessageAttachment(Buffer.from(messages), `transcript_${interaction.channel.id}.txt`)
       client.channels.cache.get(transcriptChannel).send({ content: `**Ticket Transcript - ${interaction.channel.name}**`, files: [txt] })
       interaction.reply({ embeds: [
          new MessageEmbed()
          .setDescription(`Ticket transcript sent to <#${transcriptChannel}>!`)
        ] });
    } else {
      return;
    }

  }
});
