import { MessageActionRow, MessageButton } from "discord.js";
import { testing } from "..";
import { d20 } from "../clients";
import { ignore_channels, testChannelId } from "../common/variables";
import { testCommands } from "./commandHandler";
import { countMessages } from "./function";

d20.on('messageCreate', (msg) => {
    if (!msg || !msg.author || msg.author.bot) return;
    if (msg.content.startsWith('!')) return;
    if (ignore_channels.includes(msg.channel.id)) return;
    if (testing && msg.channelId != testChannelId) return;
    else if (!testing && msg.channelId == testChannelId) return;
    countMessages(msg);
    testCommands(msg);
    /*if (testing && msg.channelId == testChannelId) msg.channel.send({
        content: 'Test',
        components: [
            new MessageActionRow()
                .addComponents([{
                    type: "BUTTON",
                    label: "Test",
                    emoji: "<:GMBelleNotificationNew:724792043880055094>",
                    style: "PRIMARY",
                    customId: "gamemastersfanrole"
                }])
        ]
    });*/
});