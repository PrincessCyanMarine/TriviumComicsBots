console.log('Initializing controlPanel')
import { config } from "dotenv";
config();

import express from "express";
import { createServer } from "http";
// import { WebSocketServer } from "ws";
import { cerby, d20, eli, krystal, ray, sadie, sieg } from "../clients";
import { ExtendedError, Server, Socket } from "socket.io";
import { getGuilds, getUser, User } from "../discordAuth";
import { Guild } from "discord.js";
import { database } from "..";
import { TIME } from "../common/variables";
import { createXpBar, defaultstyle } from "../d20/functions";
import { getActivators } from "../common/functions";



const port = 4000;
const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const doAuth = (auth: Object) => {
  if (!('code' in auth) || !auth.code || !(typeof auth.code === 'string')) {
    return new Error('No code received');
  }
  const { code } = auth;
  console.debug('code', code);

  const token = code;
  return token;
}


type Role = {
    icon: string | null;
    unicodeEmoji: string | null;
    id: string;
    name: string;
    color: string;
    moderator: boolean
};
var guildRoles: { [guild_id: string]: Role[] }  = { }
var botGuilds: { [guild_id: string]: Guild } = {};
const updateBotGuilds = () => new Promise<void>((resolve) => d20.guilds.fetch().then(guilds => {
  const _guilds = guilds.map(g=>g);
  botGuilds = _guilds.reduce((acc, cv) => ({ ...acc, [cv.id]: cv }) as typeof botGuilds, {} as typeof botGuilds)
  Object.entries(botGuilds).forEach(async ([key, g]) => {
    const guild = await d20.guilds.fetch(g.id);
    const moderatorRoles = (await database.child('guild_moderator_roles').child(key).once('value')).val();
    console.debug('moderatorRoles', moderatorRoles);
    guildRoles[key] = (await guild.roles.fetch()).map(role => ({
      icon: role.iconURL(),
      unicodeEmoji: role.unicodeEmoji,
      id: role.id,
      name: role.name,
      color: role.hexColor,
      moderator: moderatorRoles?.includes(role.id),
    })) as Role[];
    resolve();
  });
}));
updateBotGuilds();
setInterval(updateBotGuilds, TIME.MINUTES * 10)

var adminList = [] as string[];

database.child('admin').on('value', (data) => {
  adminList = data.val();
});

const getData = async (auth: string, next: (err?: ExtendedError) => void) => {
  console.debug('Getting data', auth);
  const data = await Promise.all([getUser('Bearer', auth), getGuilds('Bearer', auth)]);
  if (!data[1] || !Array.isArray(data[1])) {
    console.debug('ERROR');
    return next(new Error('RATE LIMITED'));
  }
  const guilds = data[1]?.filter((guild) => botGuilds[guild.id]).map((guild) => ({
    ...guild,
    iconURL: botGuilds[guild.id].iconURL(),
    roles: guildRoles[guild.id],
  }));
  const { user } = data[0];
  const discordUser = (await (await d20.guilds.fetch(guilds[0].id)).members.fetch(user.id)).user;

  const userRoles = (await Promise.all((guilds).map((guild) => new Promise<[string, string[]]>(async (resolve) => {
    (await d20.guilds.fetch(guild.id)).members.fetch(discordUser.id).then(user => {
      resolve([guild.id, user.roles.cache.map(role => role.id)]);
    });
  })))).reduce((acc, [key, roles]) => ({
    ...acc,
    [key]: roles,
  }), {} as {[key: string]: string[]});
  console.debug('userRoles', userRoles);

  const res = {
    guilds: guilds.map(guild => ({
      ...guild,
      userRoles: userRoles[guild.id],
      moderator: !!guildRoles[guild.id].find((role) => role.moderator && userRoles[guild.id].includes(role.id)),
      admin: !!(guild.permissions & 0x0000000000000008),
    })),
    user: {
      ...user,
      avatarURL: discordUser.avatarURL(),
      admin: adminList.includes(user.id),
    }
  }

  console.log(res.guilds.map((guild) => ({
    name: guild.name,
    admin: guild.admin,
    moderator: guild.moderator
  })));
  return res;
}

const sendUpdatedData = async (socket: Socket) => {
  const auth = doAuth(socket.handshake.auth);
  if (typeof auth === 'string') {
    try {
      const data = await getData(auth, (err) => { throw err });
      if (data) {
        socket.emit('guilds', data.guilds);
        socket.emit('user', data.user);
        socket.handshake.auth.user = data.user;
        socket.handshake.auth.guilds = data.guilds;
      }
    } catch (err) {
      throw err;
    };
  } else {
    throw auth;
  }
}

io.use(async (socket, next) => {
  const auth = doAuth(socket.handshake.auth);
  if (typeof auth === 'string') {
    socket.handshake.auth.token = auth;
    const data = await getData(auth, next);
    if (data) {
      socket.handshake.auth.guilds = data.guilds;
      socket.handshake.auth.user = data.user;
      next();
    }
  } else next(auth);
});

type DataType =
  { type: 'guilds', guilds: any } |
  { type: 'user', user: User }


async function generateMessageReport(guildId: string) {
  console.debug('Getting message report for', guildId);
  const val: {[id: string]: number} = (await database.child('lvl').child(guildId).once("value")).val();
  if (!val) return null;
  const guild = await d20.guilds.fetch(guildId);
  const data = await Promise.all(Object.entries(val).sort(([_, a], [__, b]) => {
    return b - a;
  }));
  console.debug('Getting members for message report for', guildId);
  try {
    const guildMembers = await guild.members.fetch({
      force: true,
    });
    const members = await Promise.all(data.map(([id]) => guildMembers.find(member => member.id === id)));
    return data.map(([id, messages]) => {
      const member = members.find((member) => member?.id === id);
      return {
        displayName: member?.displayName,
        avatar: member?.displayAvatarURL(),
        messages: messages,
      }
    }).filter((member) => member.displayName !== undefined);
  } catch(err) {
    console.error(err);
  }
}

async function saveCommandData(guilId: string, userId: string, commandData: any)  {
  await database.child('card').child(userId).set(commandData.card);
}

async function getCommands(guildId?: string) {
  const res = {} as any;
  res.activators = getActivators();
  res.deactivatedGeneral = (await database.child('deactivated-commands').child('general').once('value')).val() || [];
  if (guildId) res.deactivatedGuild = (await database.child('deactivated-commands').child(guildId).once('value')).val() || [];


  res.bots = Object.fromEntries(Object.entries({
    krystal,
    d20,
    ray,
    sadie,
    eli,
    cerby,
    sieg
  }).map(([name, bot]) => ([name, {
    avatar: bot.user!.avatarURL(),
  }])));
  return res;
}

async function getCommandData(guilId: string, userId: string) {
  const cardData = (await database.child('card').child(userId).once('value')).val();
  return {
    card: cardData ? {...defaultstyle, ...cardData} : defaultstyle,
    xpBars: [
      'dual',
      'dualb',
      'normal',
      'stripes',
      'stripes2'
    ],
  }
}

type CommandUsageReport = {[key: string]: number}
function generateCommandUsageReport(guildId?: string) {
  type GuildStats = { [userId: string]: { [statKey: string]: number } };
  const addValues = <T extends Record<string, number>>(obj1: T, obj2: T) => {
    const keys = Object.keys(obj1).concat(Object.keys(obj2)).filter((v, i, a) => a.indexOf(v) === i) as (keyof T)[]
    const res = {} as T;
    for (const key of keys) res[key] = ((obj1[key] || 0) + (obj2[key] || 0)) as T[keyof T];
    return res;
  }
  const calculateForGuild = (val: GuildStats) => 
    Object.values(Object.values(val).map((stats) => {
      const res = Object.entries(stats).reduce((acc, [key, value]) => {
        return {
          ...acc,
          [key]: value + (acc[key] || 0),
        };
      }, {} as CommandUsageReport);
      return res;
    })).reduce(addValues, {} as CommandUsageReport);
  return new Promise<CommandUsageReport | null>(async (resolve) => {
    let child = database.child('stats');
    if (guildId) child = child.child(guildId);
    const val = (await child.once('value')).val() as GuildStats | { [guildId: string]: GuildStats };
    if (!val) {
      resolve(null);
      return;
    }
    if (guildId) {
      resolve(calculateForGuild(val as GuildStats));
      return;
    }
    const res = Object.values(val).map((stats) => calculateForGuild(stats));
    resolve(res.reduce((acc, stats) => {
      return addValues(acc, stats);
    }, {} as CommandUsageReport));
  });
}

const sockets = {} as {[id: string]: Socket};

io.on('connection', socket => {
  const sendData = (name: string, data: DataType) => socket.emit(name, JSON.stringify(data));

  sendData('guilds', socket.handshake.auth.guilds);
  sendData('user', socket.handshake.auth.user);

  socket.on('command-usage-report', async (guildId, callback) => {
    const user = socket.handshake.auth.user;
    const guild = guildId ? (socket.handshake.auth.guilds as any[]).find(guild => guild.id === guildId) : null;
    if (guildId ? !guild?.admin && !guild?.moderator : !user.admin) return;
    const report = await generateCommandUsageReport(guildId);
    callback(report);
  });

  socket.on('command-data', async (guildId, callback) => {
    const user = socket.handshake.auth.user;
    const commandData = await getCommandData(guildId, user.id);
    callback(commandData);
  });
  socket.on('save-command-data', async (guildId, commandData) => {
    const user = socket.handshake.auth.user;
    await saveCommandData(guildId, user.id, commandData);
  });


  socket.on('get-commands', async (guildId, callback) => {
    const user = socket.handshake.auth.user;
    const guild = guildId ? (socket.handshake.auth.guilds as any[]).find(guild => guild.id === guildId) : null;
    if (guildId ? !guild?.admin && !guild?.moderator : !user.admin) return;
    const commandList = await getCommands(guildId);
    callback(commandList);
  });

  socket.on('set-disabled-commands', async (commands, guildId, callback) => {
    const user = socket.handshake.auth.user;
    const guild = guildId ? (socket.handshake.auth.guilds as any[]).find(guild => guild.id === guildId) : null;
    if (guildId ? !guild?.admin && !guild?.moderator : !user.admin) return;
    
    database.child('deactivated-commands').child(guildId || 'general').set(commands);

    const commandList = await getCommands(guildId);
    callback(commandList);
  });


  socket.on('message-report', async (guildId, callback) => {
    // const user = socket.handshake.auth.user;
    // const guild = guildId ? (socket.handshake.auth.guilds as any[]).find(guild => guild.id === guildId) : null;
    // if (guildId ? !guild?.admin && !guild?.moderator : !user.admin) return;
    const report = await generateMessageReport(guildId);
    console.debug('message-report', report);
    callback(report);
    // socket.emit('message-report', guildId, report);
  });

  socket.on('get-xpbar', async (style, color_a, color_b, callback) => {
    callback((await createXpBar(style, color_a, color_b)).toDataURL('image/png'))
  })

  socket.on('set-guild-moderator-roles', async (guildId, moderatorRoles, callback) => {
    const user = socket.handshake.auth.user;
    const guild = guildId ? (socket.handshake.auth.guilds as any[]).find(guild => guild.id === guildId) : null;
    if (guildId ? !guild?.admin && !guild?.moderator : !user.admin) return;
    await database.child('guild_moderator_roles').child(guildId).set(moderatorRoles);
    await updateBotGuilds();
    Object.values(sockets).forEach((s) => {
      sendUpdatedData(s).catch(err => {
        console.error(`Error sending updated data to ${s.id}`, err)
      });
    })
    callback();
  });

  socket.on('disconnect', () => {
    console.debug(`Socket ${socket.id} disconnected`);
    delete sockets[socket.id];
  })

  sockets[socket.id] = socket;
});

app.get('/*', (req, res) => {
  res.send('ok');
})

app.use(express.json());

setTimeout(() => {
  server.listen(port, () => {
    console.log("Server is listening on http://localhost:" + port);
  });
}, 1000);