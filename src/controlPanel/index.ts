import { config } from "dotenv";
config();

import express from "express";
import { readFileSync } from "fs";
import { getGuilds, getUser } from "../discordAuth";
import { Channel, Client, Guild, Intents, Message, PartialMessage, TextBasedChannel, TextChannel } from "discord.js";
import { ElementBuilder } from "./ElementBuilder";
import { createServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { createDecipher, createDecipheriv } from "crypto";
const { request } = require('undici');


const intents = [
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MESSAGES,
  Intents.FLAGS.GUILD_INTEGRATIONS,
  Intents.FLAGS.GUILD_MEMBERS,
  Intents.FLAGS.GUILD_PRESENCES,
  Intents.FLAGS.GUILD_MESSAGE_TYPING,
];

export var krystal = new Client({ intents }),
    sadie = new Client({ intents }),
    ray = new Client({ intents }),
    eli = new Client({ intents }),
    d20 = new Client({ intents }),
    cerby = new Client({ intents }),
    sieg = new Client({ intents }),
    odod = new Client({ intents });
  
const bots = { krystal, sadie, ray, eli, d20, cerby, sieg, odod };

krystal.login(process.env.BOT_KRYSTAL_TOKEN);
sadie.login(process.env.BOT_SADIE_TOKEN);
ray.login(process.env.BOT_RAY_TOKEN);
eli.login(process.env.BOT_ELI_TOKEN);
d20.login(process.env.BOT_D20_TOKEN);
cerby.login(process.env.BOT_CERBY_TOKEN);
sieg.login(process.env.BOT_SIEG_TOKEN);
odod.login(process.env.BOT_ODOD_TOKEN);


const port = 4000;
const app = express();
const server = createServer(app);

const wss = new WebSocketServer({ server });

const socketsListening = new Map<WebSocket, Channel>();
const channelsBeingListenedTo = new Map<Channel, WebSocket[]>();
const publicKeys = new Map<WebSocket, string>();

var sockets = 0;

wss.on('connection', function connection(ws) {
  const socketId = sockets++;
  // console.log("New connection", socketId);
  function removeWsListener() {
    if (socketsListening.has(ws)) {
      const oldChannel = socketsListening.get(ws)!;
      if (channelsBeingListenedTo.has(oldChannel)) {
        const oldChannelListeners = channelsBeingListenedTo.get(oldChannel)!;
        channelsBeingListenedTo.set(oldChannel, oldChannelListeners.filter((listener) => listener !== ws));
      }
      socketsListening.delete(ws);
    }
    if (publicKeys.has(ws)) publicKeys.delete(ws);   
  }
  
  ws.on('error', console.error);

  ws.on('close', async (data) => {
    // console.log('closed', socketId);
    try {
      removeWsListener();
    } catch (err) {
      console.error(err);
    };
  });

  ws.on('message', async (data) => {
    try {
      console.log('received: %s', data);
      const parsedData = JSON.parse(data.toString());
      if (parsedData?.type) {
        switch (parsedData.type) {
          case 'SELECT_CHANNEL': {
            const { token, channelId } = parsedData;
            if (!token) throw new Error('No token provided');
            const { user } = await getUser(...(token.split(' ') as [string, string]));
            if (!user) throw new Error('User not found');
            let channel;
            if (channelId){
              for (const bot of Object.values(bots)) {
                try {
                  channel = await bot.channels.fetch(channelId);
                  if (channel) break;
                } catch(err) {};
              }
              if (!channel) throw new Error('Channel not found');
              if (!(channel instanceof TextChannel)) throw new Error('Channel is not a text channel');
            }
            const member = await channel?.guild.members.fetch(user.id);
            if (channelId && channel && !member?.permissions.has("KICK_MEMBERS")) throw new Error('You do not have permission to view this channel');
            removeWsListener();
            if (channelId && channel) {
              socketsListening.set(ws, channel);
              console.log('socketsListening', socketsListening)
              const listeners = channelsBeingListenedTo.get(channel) || [];
              channelsBeingListenedTo.set(channel, [...listeners, ws]);
            }
            break;
          }
          case 'START_AUTH': {
            ws.send(JSON.stringify({ type: 'AUTH_URL', url: `https://discord.com/oauth2/authorize?${toURL({ client_id: process.env.D20_CLIENT_ID!, redirect_uri: `http://192.168.18.5:${port}/auth/finish`, response_type: 'token', scope: 'identify guilds' })}` }));
            break;
          }
          case 'KEY': {
            const { key } = parsedData;
            publicKeys.set(ws, key);
            break;
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  });
});
{
  const botValues = Object.values(bots);
  for (let i = 0; i < botValues.length; i++) {
    const bot = botValues[i];
    const prevBot = i > 0 ? botValues[i - 1] : null;
    bot.on('message', (msg) => {
      const { channel } = msg;
      if (!(channel instanceof TextChannel)) return;
      if (prevBot?.user?.id && channel.members.has(prevBot.user.id)) return;
      const listeners = channelsBeingListenedTo.get(channel) || [];
      for (const listener of listeners) {
        listener.send(JSON.stringify({ type: 'MESSAGE', message: serializeMessage(msg) }));
      }
    });
    bot.on('messageDelete', (msg) => {
      const { channel } = msg;
      if (!(channel instanceof TextChannel)) return;
      if (prevBot?.user?.id && channel.members.has(prevBot.user.id)) return;
      const listeners = channelsBeingListenedTo.get(channel) || [];
      for (const listener of listeners) {
        listener.send(JSON.stringify({ type: 'MESSAGE_DELETED', messageId: msg.id }));
      }
    });
    bot.on('messageUpdate', (oldMsg, newMsg) => {
      const { channel } = newMsg;
      if (!(channel instanceof TextChannel)) return;
      if (prevBot?.user?.id && channel.members.has(prevBot.user.id)) return;
      const listeners = channelsBeingListenedTo.get(channel) || [];
      for (const listener of listeners) {
        listener.send(JSON.stringify({ type: 'MESSAGE_UPDATED', message: serializeMessage(newMsg) }));
      }
    });
  }
}

app.use(express.json());

app.get('/auth/finish', async (req, res) => {
  res.send(`
    <script>
      const urlParams = new URLSearchParams(window.location.hash.split('#')[1]);
      const token = urlParams.get('access_token');
      const tokenType = urlParams.get('token_type');
      document.write(\`\${tokenType} \${token}\`)
    </script>
  `)
});

app.get("/", (req, res) => {
  res.send(`${readFileSync("./controlPanel/index.html", "utf-8")}`);
});

app.get("/auth", (req, res) => {
  res.send(`${readFileSync("./controlPanel/auth.html", "utf-8")}`);
});

function toURL(data: Record<string, string | number | boolean>): string {
  return Object.keys(data)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join('&');
}

app.post('/user', async ({ body }, res) => {
		try {
      // console.log(body);
      const { token } = body;
      if (!token) throw new Error('No token provided');
      const user = await getUser(...(token.split(' ') as [string, string]));
      // console.log(user);
    
      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).send(error instanceof Error ? error.message : typeof error === 'string' ? error : 'An error occurred');
    }
});

app.post('/guilds', async ({ body }, res) => {
  console.log('guilds', body)
  try {
    // console.log(body);
    const { token, userId } = body;
    if (!token) throw new Error('No token provided');
    const userGuilds = await getGuilds(...(token.split(' ') as [string, string]));
    const { user } = await getUser(...(token.split(' ') as [string, string]));
    const botGuilds: Record<string, any> = {};
    for (const botName in bots) {
      const bot = bots[botName as keyof typeof bots];
      if (!bot.isReady) throw new Error(`${botName} is not ready`);
      const guilds = await bot.guilds.fetch();
      for (const g of guilds.values()) {
        const userGuild = userGuilds.find((userGuild) => userGuild.id === g.id);
        if (userGuild) {
          const guild = await g.fetch();
          const member = await guild.members.fetch(user.id);
          if (!member.permissions.has('KICK_MEMBERS')) continue;
          const cached = bot.guilds.cache.get(guild.id);
          const me = bot.user ? await cached?.members.fetch(bot.user.id) : undefined;
          const serializableBot = {
            key: botName,
            name: me?.displayName || bot.user?.username,
            id: bot.user?.id,
            avatar: me?.displayAvatarURL() || bot.user?.displayAvatarURL(),
          };
          if (!botGuilds[guild.id]) {
            botGuilds[guild.id] = userGuild as any;
            botGuilds[guild.id].iconURL = guild.iconURL({ dynamic: true });
            botGuilds[guild.id].initials = guild.name.split(' ').map((word) => word[0]).join('');
            botGuilds[guild.id].bots = [serializableBot];
          } else botGuilds[guild.id].bots.push(serializableBot);
        }
      }
    }

  
    res.json(botGuilds);
  } catch (error) {
    console.error(error);
    res.status(500).send(error instanceof Error ? error.message : typeof error === 'string' ? error : 'An error occurred');
  }
});

app.post('/channels', async ({ body }, res) => {
  console.log('channels', body)
  try {
    // console.log(body);
    const { token, guildId } = body;
    // console.log('AAA')
    if (!token) throw new Error('No token provided');
    if (!guildId) throw new Error('No guildId provided');
    const { user } = await getUser(...(token.split(' ') as [string, string]));
    // console.log('BBB')

    let guild;
    for (const bot of Object.values(bots)) {
      try {
        guild = await bot.guilds.fetch(guildId);
        if (guild) break;
      } catch(err) {};
    }
    // console.log('CCC')
    if (!guild) throw new Error('Guild not found');
    const member = await guild.members.fetch(user.id);
    if (!member.permissions.has("KICK_MEMBERS")) throw new Error('You do not have permission to view this guild');
    // console.log('DDD')
    const channels = (await guild.channels.fetch()).filter((channel) => (channel && (channel instanceof TextChannel) && channel.members.has(user.id) && Object.values(bots).some(bot => bot.user?.id && channel.members.has(bot.user.id))) || false) as unknown as TextChannel[];
    const serializableChannels = channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      type: channel.type,
      bots: Object.fromEntries(Object.entries(bots).filter(([_, bot]) => bot.user?.id && channel.members.has(bot.user.id)).map(([botName, bot]) => [bot.user?.id, botName]))
    }));
    // console.log('EEE')
    // console.log(serializableChannels);
    // console.log(guild.id);
    res.json({ channels: serializableChannels, guildId: guild.id });
  } catch (error) {
    console.error(error);
    res.status(500).send(error instanceof Error ? error.message : typeof error === 'string' ? error : 'An error occurred');
  } 
});

const serializeMessage = (message: Message | PartialMessage) => ({
  id: message.id,
  content: message.content,
  attachments: message.attachments.map((attachment) => ({
    url: attachment.url,
    type: attachment.contentType,
    width: attachment.width,
    height: attachment.height,
    name: attachment.name,
  })),
  author: {
    id: message.author?.id,
    username: message.member?.displayName || message.author?.username || 'Unknown User',
    avatar: (message.member || message.author)?.displayAvatarURL() || '',
    bot: message.author?.bot || false,
  }
});

app.post('/messages', async ({ body }, res) => {
  console.log('messages', body)
  const { token, channelId } = body;
  if (!token) throw new Error('No token provided');
  if (!channelId) throw new Error('No channelId provided');
  let channel;
  for (const bot of Object.values(bots)) {
    try {
      channel = await bot.channels.fetch(channelId);
      if (channel) break;
    } catch(err) {};
  }
  if (!channel) throw new Error('Channel not found');
  if (!(channel instanceof TextChannel)) throw new Error('Channel is not a text channel');
  const { user } = await getUser(...(token.split(' ') as [string, string]));
  if (!channel.members.has(user.id)) throw new Error('You do not have permission to view this channel');
  const member = await channel.guild.members.fetch(user.id);
  if (!member.permissions.has("KICK_MEMBERS")) throw new Error('You do not have permission to view this channel');
  const messages = await channel.messages.fetch();
  const serializableMessages = messages.map((message) => serializeMessage(message));
console.log(serializableMessages)
  res.json({messages: serializableMessages, channelId: channel.id });
});

app.post('/message/edit', async ({ body }, res) => {
  try {
    // console.log(body);
    const { token, messageId, channelId, content, botName } = body;
    if (!token) throw new Error('No token provided');
    if (!messageId) throw new Error('No messageId provided');
    if (!channelId) throw new Error('No channelId provided');
    if (!content) throw new Error('No content provided');
    if (!botName) throw new Error('No botName provided');
    const bot = bots[botName as keyof typeof bots];
    if (!bot) throw new Error('Bot not found');
    const { user } = await getUser(...(token.split(' ') as [string, string]));
    const channel = await bot.channels.fetch(channelId);
    if (!channel) throw new Error('Channel not found');
    if (!(channel instanceof TextChannel)) throw new Error('Channel is not a text channel');
    if (!channel.members.has(user.id)) throw new Error('You do not have permission to view this channel');
    const member = await channel.guild.members.fetch(user.id);
    if (!member.permissions.has("KICK_MEMBERS")) throw new Error('You do not have permission to view this channel');
    const message = await channel.messages.fetch(messageId);
    if (!message) throw new Error('Message not found');
    if (message.author.id !== bot.user?.id) throw new Error('You do not have permission to edit this message');
    const newMessage = await message.edit(content);
    res.json(serializeMessage(newMessage));
  } catch (error) {
    console.error(error);
    res.status(500).send(error instanceof Error ? error.message : typeof error === 'string' ? error : 'An error occurred');
  }
});

app.post('/message/delete', async ({ body }, res) => {
  try {
    // console.log(body);
    const { token, messageId, channelId, botName } = body;
    if (!token) throw new Error('No token provided');
    if (!messageId) throw new Error('No messageId provided');
    if (!channelId) throw new Error('No channelId provided');
    if (!botName) throw new Error('No botName provided');
    const bot = bots[botName as keyof typeof bots];
    if (!bot) throw new Error('Bot not found');
    const { user } = await getUser(...(token.split(' ') as [string, string]));
    const channel = await bot.channels.fetch(channelId);
    if (!channel) throw new Error('Channel not found');
    if (!(channel instanceof TextChannel)) throw new Error('Channel is not a text channel');
    if (!channel.members.has(user.id)) throw new Error('You do not have permission to view this channel');
    const member = await channel.guild.members.fetch(user.id);
    if (!member.permissions.has("KICK_MEMBERS")) throw new Error('You do not have permission to view this channel');
    const message = await channel.messages.fetch(messageId);
    if (!message) throw new Error('Message not found');
    if (message.author.id !== bot.user?.id) throw new Error('You do not have permission to edit this message');
    const newMessage = await message.delete();
    res.json(serializeMessage(newMessage));
  } catch (error) {
    console.error(error);
    res.status(500).send(error instanceof Error ? error.message : typeof error === 'string' ? error : 'An error occurred');
  }
});

app.post('/message/send', async ({ body }, res) => {
  const { token, channelId, content, botName } = body;
  if (!token) throw new Error('No token provided');
  if (!channelId) throw new Error('No channelId provided');
  if (!content) throw new Error('No content provided');
  if (!botName) throw new Error('No botName provided');
  const bot = bots[botName as keyof typeof bots];
  if (!bot) throw new Error('Bot not found');
  const { user } = await getUser(...(token.split(' ') as [string, string]));
  const channel = await bot.channels.fetch(channelId);
  if (!channel) throw new Error('Channel not found');
  if (!(channel instanceof TextChannel)) throw new Error('Channel is not a text channel');
  if (!channel.members.has(user.id)) throw new Error('You do not have permission to view this channel');
  const member = await channel.guild.members.fetch(user.id);
  if (!member.permissions.has("KICK_MEMBERS")) throw new Error('You do not have permission to view this channel');
  const message = await channel.send(content);
  res.json(serializeMessage(message));
});

app.get('/elementBuilder', (req, res) => {
  res.send(`${readFileSync("./controlPanel/ElementBuilder.js", "utf-8")}`);
});


server.listen(port, () => {
  // console.log("Server is listening on http://localhost:" + port);
});