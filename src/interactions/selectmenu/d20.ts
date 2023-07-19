import { Channel, GuildMember, InteractionUpdateOptions, MessageActionRow, MessageEmbed, Permissions } from "discord.js";
import { database, testing } from "../..";
import { d20, krystal, mod_alert_webhook } from "../../clients";
import { colors, triviumGuildId } from "../../common/variables";
import { ActionRowBuilder, userMention } from "@discordjs/builders";
import { MessageTypes } from "discord.js/typings/enums";
import { getCardStyle, sendCardCustomizationMessage, setCardStyle } from "../../common/functions";
import { isCardCustomizationMessageFromUser } from "../../d20/functions";

d20.on("interactionCreate", async (interaction) => {
    if (!interaction.isSelectMenu()) return;
    if (testing && interaction.channelId != "892800588469911663") return;
    else if (!testing && interaction.channelId == "892800588469911663") return;

    switch (interaction.customId) {
        case "card_xpbar":
            if (isCardCustomizationMessageFromUser(interaction)) return;
            let type = interaction.values[0];
            let style = await getCardStyle(interaction.user.id);
            await setCardStyle(interaction.user.id, { type });
            await sendCardCustomizationMessage(interaction, false, style);
            break;
    }

    if (interaction.customId.startsWith("unwarn")) {
        if (!interaction.member) return interaction.reply({ content: "You must be in a server to use this button", ephemeral: true });
        if (!interaction.memberPermissions?.has(Permissions.FLAGS.KICK_MEMBERS))
            return interaction.reply({ content: "You must have kick members permission to use this button", ephemeral: true });

        let match = interaction.customId.match(/unwarn\?guild=(.+?)&user=(.+)/);
        if (!match) return;
        let [_, guildId, userId] = match;

        let key = interaction.values[0];

        // console.log(interaction.customId, guildId, userId, key);
        let warning = await database.child("warnings").child(guildId).child(userId).child(key).once("value");
        // console.log(warning.val());
        await database.child("warnings").child(guildId).child(userId).child(key).remove();

        let msg = interaction.message;
        // console.log(msg.type);
        if (msg.type == "APPLICATION_COMMAND") {
            msg.edit({
                components: [],
                content: 'Warning "' + warning.val() + '" removed from ' + userMention(userId) + " by " + userMention(interaction.user.id),
            });
        }
        // let components = msg.components
        //     ?.map((_c) => {
        //         if (_c.type == "ACTION_ROW") {
        //             let actionrow = new MessageActionRow();
        //             actionrow.setComponents(_c.components.filter((c) => c.customId != interaction.customId));
        //             return actionrow;
        //         }
        //         return undefined;
        //     })
        //     .filter((c) => !!c) as MessageActionRow[];
        // let embeds = msg.embeds;

        // embeds[embeds.length - 1] = new MessageEmbed(embeds[embeds.length - 1])
        //     .setColor("GREEN")
        //     .addFields({ name: "Resolved", value: "Warning removed by " + interaction.user.tag });
        // await mod_alert_webhook(testing).editMessage(msg.id, {
        //     components,
        //     embeds,
        // });
        // interaction.reply(`${userMention(interaction.user.id)} removed this warning`);
    }
});
