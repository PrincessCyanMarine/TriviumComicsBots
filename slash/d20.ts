import { DiscordAPIError, GuildMember, Interaction, InteractionCollector } from "discord.js";
import { d20 } from "../clients";
import { ignore_channels } from "../common/variables";
import { reply } from "./common";

d20.on('ready', async () => {
    console.log("D20 is processing slash commands");
})
d20.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    if (ignore_channels.includes(interaction.channelId)) return;

    switch (interaction.commandName) {
        case "ban":
            let target = interaction.options.get('player')?.member;
            let reason = interaction.options.get('reason')?.value;
            let days = interaction.options.get('days')?.value;

            if (!target || !interaction.guild || !(target instanceof GuildMember)) { reply(interaction, 'Something went wrong'); return; };
            if (!reason || typeof reason != 'string') reason = '';
            if (!days || typeof days != 'number') days = 0;
            days = Math.min(7, Math.max(0, days));

            let author = await interaction.guild.members.fetch(interaction.user.id);

            if (!author.permissions.has("BAN_MEMBERS")) { reply(interaction, 'You don\' have permission to do that...', true); return; };
            target.ban({ reason: reason, days: days })
                .then(() => {
                    if (!(target instanceof GuildMember)) return;
                    reply(interaction, `Successfully banned ${target.displayName}!\nDuration: ${days == 0 ? `${days} days` : 'forever'}${reason != '' ? `\nBecause \"${reason}\"` : ''}`);
                })
                .catch((er) => {
                    if (!(target instanceof GuildMember)) return;
                    if (er instanceof DiscordAPIError) er = er.message;
                    reply(interaction, `Failed to ban ${target.displayName}...\nReason: ${er}`, true);
                });

            break;
    }
});

// switch (command) {
//     case "ban":
//         banUser(args["player"], interaction, args["reason"], args["days"]);
//         break;
//     case "kick":
//         kickUser(args["player"], interaction, args["reason"]);
//         break;
//     case "warn":
//         warning(args["player"], interaction, args["reason"]);
//         break;
//     case "unwarn":
//         unwarn(args["player"], interaction, args["position"]);
//         break;
//     case 'warnings':
//         let targetId = args["player"] ? args["player"] : interaction.member.user.id;
//         getWarnings(targetId, interaction);
//         break;
//     case 'mute':
//         mute(args["player"], interaction, args["time"], args["timedef"]);
//         break;
// }


function banUser(userId: string, interaction: Interaction, reason: string, days: number) {
    // if (!interaction.guild || !interaction.member || !interaction.isCommand()) return;
    // let guild = interaction.guild;
    // let permissions = parseInt('' + interaction.member.permissions.valueOf(), 16);
    // console.log(permissions);
    // console.log((permissions & 0x40) == 0x40);
    /*
        guild.members.fetch(interaction.member.user.id).then(author => {
            if (!author.permissions.has("BAN_MEMBERS")) return reply(D20, interaction, `You have no permission to ban`, true);
            guild.members.fetch(userId).then(member => {
                if (member.permissions.has("BAN_MEMBERS")) return reply(D20, interaction, `You have no permission to ban this user`, true);
                if (!reason) reason = 'No reason given';
                if (!days || days < 0) days = 0;
                if (days > 7) days = 7;
                member.ban({
                    reason: reason,
                    days: days
                }).then(() => {
                    reply(D20, interaction, `${member.displayName} has been banned for ${days} days\nReason: ${reason}`, false)

                    let possibleReactions = [
                        ["eli", interaction.channel_id, "They were one of Trap's alts"],
                        ["ray", interaction.channel_id, "There goes Longshot133"],
                        ["ray", interaction.channel_id, "They were with the chair cult"],
                        ["sadie", interaction.channel_id, `They never paid rent!`]
                    ];

                    setTimeout(() => {
                        say(...possibleReactions[Math.floor(Math.random() * possibleReactions.length)]);
                    }, 1000);

                }).catch(err => {
                    console.error(err);
                    reply(D20, interaction, `Couldn't ban ${member}\n reason: ${err}`, true);
                });
            }).catch(sendError)
        }).catch(sendError)*/
}

// function kickUser(userId, interaction, reason) {
//     D20.guilds.fetch(interaction.guild_id).then(guild => {
//         guild.members.fetch(interaction.member.user.id).then(author => {
//             if (!author.permissions.has("KICK_MEMBERS")) return reply(D20, interaction, `You have no permission to kick`, true);
//             guild.members.fetch(userId).then(member => {
//                 if (member.permissions.has("KICK_MEMBERS")) return reply(D20, interaction, `You have no permission to kick this user`, true);
//                 if (!reason) reason = 'No reason given';
//                 member.kick(reason).then(() => {
//                     reply(D20, interaction, `${member.displayName} has been kicked\nReason: ${reason}`, false)
//                 }).catch(err => {
//                     console.error(err);
//                     reply(D20, interaction, `Couldn't kick ${member}\n reason: ${err}`, true);
//                 });
//             }).catch(sendError)
//         }).catch(sendError);
//     }).catch(sendError)
// }

// function mute(target, interaction, time, timedef) {
//     if (interaction.guild_id != "562429293364248587") return console.log("Mute command isued at another guild");
//     D20.guilds.fetch(interaction.guild_id).then(guild => {
//         guild.members.fetch(interaction.member.user.id).then(author => {
//             if (!author.permissions.has("KICK_MEMBERS")) return reply(D20, interaction, `You have no permission to mute`, true);
//             guild.members.fetch(target).then(member => {
//                 if (member.permissions.has("KICK_MEMBERS")) return reply(D20, interaction, `You have no permission to mute this user`, true);
//                 var totalMiliseconds = 0;
//                 if (timedef == 'minutes') totalMiliseconds = time * 60000;
//                 else if (timedef == 'hours') totalMiliseconds = time * 360000;
//                 else if (timedef == 'days') totalMiliseconds = time * 86400000;
//                 else if (timedef == 'weeks') totalMiliseconds = time * 604800000;
//                 else return console.error('What?');
//                 var now = new Date(Date()).valueOf();
//                 var newTime = now + totalMiliseconds;
//                 member.roles.add('806648884754382889').then(() => {
//                     database.child('muted').child(member.id).set(newTime);
//                     reply(D20, interaction, `Muted ${member.displayName} for ${time} ${timedef}`, false);
//                 }).catch(sendError);
//             }).catch(sendError);
//         }).catch(sendError);
//     }).catch(sendError);
// }

// function sendError(err) {
//     console.error(err);
//     reply(D20, interaction, `Error: ${err}`, true);
// }

// function warning(userId, interaction, reason) {
//     D20.guilds.fetch(interaction.guild_id).then(guild => {
//         guild.members.fetch(interaction.member.user.id).then(author => {
//             if (!author.permissions.has("KICK_MEMBERS")) return reply(D20, interaction, `You have no permission to warn`, true);
//             guild.members.fetch(userId).then(target => {
//                 database.child('warnings').child(guild.id).child(target.id).once('value').then(w => {
//                     var warnings = w.val();
//                     if (!warnings) warnings = [];
//                     warnings[warnings.length] = reason;
//                     reply(D20, interaction, `${target.displayName} has ${warnings.length} warning(s)`, false);
//                     database.child('warnings').child(guild.id).child(target.id).set(warnings);
//                 }).catch(sendError);
//             }).catch(sendError);
//         }).catch(sendError);
//     }).catch(sendError);
// }

// function unwarn(userId, interaction, position) {
//     D20.guilds.fetch(interaction.guild_id).then(guild => {
//         guild.members.fetch(interaction.member.user.id).then(author => {
//             if (!author.permissions.has("KICK_MEMBERS")) return reply(D20, interaction, `You have no permission to warn`, true);
//             guild.members.fetch(userId).then(target => {
//                 database.child('warnings').child(guild.id).child(target.id).once('value').then(w => {
//                     var warnings = w.val();
//                     if (!warnings || warnings.length == 0) return reply(D20, interaction, "This user already has no warnings", true);
//                     if (!position || position <= 0 || position > warnings.length) warnings = [];
//                     else warnings.splice((position - 1), 1);
//                     reply(D20, interaction, `${target.displayName} now has ${warnings.length} warning(s)`, false);
//                     database.child('warnings').child(guild.id).child(target.id).set(warnings);
//                 }).catch(sendError);
//             }).catch(sendError);
//         }).catch(sendError);
//     }).catch(sendError);
// }

// function getWarnings(userId, interaction) {
//     D20.guilds.fetch(interaction.guild_id).then(guild => {
//         guild.members.fetch(interaction.member.user.id).then(author => {
//             guild.members.fetch(userId).then(target => {
//                 database.child('warnings').child(guild.id).child(target.id).once('value').then(w => {
//                     let warnings = w.val();
//                     if (!warnings) warnings = [];
//                     let warning_text = '';
//                     let i = 0;
//                     warnings.forEach(warn => {
//                         i++;
//                         warning_text += `${i}: ${warn}\n`;
//                     })
//                     reply(D20, interaction, `${target} has ${i} warnings\n\n${warning_text}`, false);
//                 }).catch(sendError);
//             }).catch(sendError);
//         }).catch(sendError);
//     }).catch(sendError);
// }