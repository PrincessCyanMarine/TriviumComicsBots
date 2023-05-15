import { GuildMember } from "discord.js";
import { database, testing } from "../..";
import { krystal } from "../../clients";
import { colors, isRestarting, triviumGuildId } from "../../common/variables";
import { restart, stop, update } from "../../common/functions";

krystal.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (testing && interaction.channelId != "892800588469911663") return;
    else if (!testing && interaction.channelId == "892800588469911663") return;
    // console.log(interaction.customId);
    if (["restart", "update", "stop"].includes(interaction.customId)) {
        if (isRestarting()) {
            interaction.reply({ content: "Already restarting", ephemeral: true });
            return;
        }
        interaction.reply({ content: { restart: "Restarting", update: "Updating", stop: "Stopping" }[interaction.customId], ephemeral: true });
        let act = {
            restart,
            update,
            stop,
        };
        act[interaction.customId as "restart" | "update" | "stop"]();
    }

    if (interaction.customId.startsWith("colors")) {
        const match = interaction.customId.match(/colors\?id=([0-9]+)/);
        if (!match) return;
        const id = match[1];

        if (!(interaction.member instanceof GuildMember)) return;
        try {
            for (const [name, color, roleId, emoji, necessaryIds] of colors) {
                if (interaction.member.roles.cache.has(roleId)) {
                    interaction.member.roles.remove(roleId);
                    if (roleId === id) {
                        interaction.reply({ content: "Removed the " + color + " role", ephemeral: true });
                        break;
                    }
                }

                let mod = interaction.member.permissions.has("MANAGE_ROLES");

                if (id === roleId) {
                    let hasRole = false;
                    for (const necessary of necessaryIds)
                        if (mod || interaction.member.roles.cache.has(necessary)) {
                            hasRole = true;

                            interaction.member.roles.add(roleId);
                            interaction.reply({ content: "You have been given the " + color + " role", ephemeral: true });
                            break;
                        }
                    if (!hasRole) interaction.reply({ content: "You don't have the necessary role", ephemeral: true });
                }
            }
        } catch (e) {
            interaction.reply({ content: "Something went wrong", ephemeral: true });
            console.error(e);
        }
    }
});
