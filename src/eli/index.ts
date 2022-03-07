import { userMention } from "@discordjs/builders";
import { Message } from "discord.js";
import { testing } from "..";
import { eli } from "../clients";
import { ignore_message, msg2embed } from "../common/functions";
import { Harem } from "../common/harem";
import { ignore_channels, testChannelId } from "../common/variables";
import { Calculator } from "../games/calculator";
import { testCommands } from "./commandHandler";

eli.on("messageCreate", (msg) => {
    if (ignore_message(msg, eli)) return;
    testCommands(msg);
});

eli.on("interactionCreate", async (interaction) => {
    if (interaction.isButton()) {
        if (testing && interaction.channelId != testChannelId) return;
        if (!testing && interaction.channelId == testChannelId) return;

        let calculator_match = interaction.customId.match(/calculator_?(?<id>[0-9]+?)?_button_(?<button>.+)/);
        if (calculator_match?.groups) {
            if (calculator_match.groups.id && calculator_match.groups.id != interaction.member?.user.id) {
                interaction.reply({ ephemeral: true, content: 'To invoke a calculator, use the command "!calculator"' });
                return;
            }

            Calculator.processInteraction(interaction, calculator_match.groups.button, !calculator_match.groups.id);
        }

        if (interaction.customId.startsWith("harem")) {
            let harem_match = interaction.customId.match(/(?<=[\?\&]).+?=.+?(?=(\&|$))/gi);
            let parameters: { [key: string]: string } = {};
            harem_match?.forEach((param) => {
                let [key, value] = param.split("=");
                parameters[key] = value;
            });

            console.log(parameters);

            if (parameters.invited_id && parameters.invited_id != interaction.user.id) {
                interaction.reply({ ephemeral: true, content: "This invite is not for you" });
                return;
            }

            if (!parameters.harem_id) interaction.update({ content: "Invalid invite", components: [] });

            if (parameters.command)
                switch (parameters.command) {
                    case "accept_invite":
                        let harem = await Harem.get(interaction.guildId, interaction.user.id);
                        harem.join(parameters.harem_id);
                        interaction.update({ content: `${interaction.user} joined ${userMention(parameters.harem_id)}'s harem`, components: [] });
                        break;

                    case "reject_invite":
                        interaction.update({
                            content: `${interaction.user} rejected the invite to join ${userMention(parameters.harem_id)}'s harem`,
                            components: [],
                        });
                        break;
                }
        }
    }
});
