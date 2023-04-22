import { Channel, GuildMember, MessageActionRow, MessageEmbed } from "discord.js";
import { database, testing } from "../..";
import { d20, krystal, mod_alert_webhook } from "../../clients";
import { colors, triviumGuildId } from "../../common/variables";
import { ActionRowBuilder, userMention } from "@discordjs/builders";
import { MessageTypes } from "discord.js/typings/enums";

d20.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (testing && interaction.channelId != "892800588469911663") return;
    else if (!testing && interaction.channelId == "892800588469911663") return;
    // console.log(interaction.customId);

    if (interaction.customId.startsWith("remove_warning")) {
        let match = interaction.customId.match(/remove_warning\?guild=(.+?)&user=(.+?)&key=(.+)/);
        if (!match) return;
        let [_, guildId, userId, key] = match;
        console.log(interaction.customId, guildId, userId, key);
        await database.child("warnings").child(guildId).child(userId).child(key).remove();

        let msg = interaction.message;
        let components = msg.components
            ?.map((_c) => {
                if (_c.type == "ACTION_ROW") {
                    let actionrow = new MessageActionRow();
                    actionrow.setComponents(_c.components.filter((c) => c.customId != interaction.customId));
                    return actionrow;
                }
                return undefined;
            })
            .filter((c) => !!c) as MessageActionRow[];
        let embeds = msg.embeds;

        embeds[embeds.length - 1] = new MessageEmbed(embeds[embeds.length - 1])
            .setColor("GREEN")
            .addFields({ name: "Resolved", value: "Warning removed by " + interaction.user.tag });
        await mod_alert_webhook(testing).editMessage(msg.id, {
            components,
            embeds,
        });
        interaction.reply(`${userMention(interaction.user.id)} removed warning with key "${key}"`);
    }
});
