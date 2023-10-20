// import {
//     ButtonInteraction,
//     Message,
//     MessageActionRow,
//     MessageButton,
//     MessageButtonStyleResolvable,
//     MessageSelectMenu,
//     SelectMenuInteraction,
// } from "discord.js";
// import { testing } from "..";
// import { ray } from "../clients";
// import { getCharacterEmoji, say } from "./functions";
// import { command_list, testChannelId } from "./variables";

// export class Help {
//     static async processInteraction(interaction: ButtonInteraction | SelectMenuInteraction) {
//         if (testing) {
//             if (interaction.channelId != testChannelId) return;
//         } else if (interaction.channelId == testChannelId) return;
//         //interaction.update({ fetchReply: true });
//         if (interaction.isButton()) this.processButtonInteraction(interaction);
//         else this.processSelectMenuInteraction(interaction);
//     }

//     public static components = {
//         main_menu: () => [
//             new MessageActionRow().addComponents(
//                 new MessageSelectMenu()
//                     .addOptions(
//                         ...Object.keys(command_list).map((character) => ({
//                             label: character,
//                             value: character,
//                             // emoji: getCharacterEmoji(character),
//                         }))
//                     )
//                     .setCustomId("help_main_menu")
//                     .setPlaceholder("Select a character")
//             ),
//         ],
//         pageButton: (character: string, page: number, tittle: string, style: MessageButtonStyleResolvable = "PRIMARY") =>
//             new MessageButton()
//                 .setCustomId("help_page_" + character + "_" + page)
//                 .setLabel(tittle)
//                 .setStyle(style),
//         // .setEmoji(getCharacterEmoji(character)),
//     };

//     public static getMainMenu() {
//         return Help.components.main_menu();
//     }

//     public static processSelectMenuInteraction(interaction: SelectMenuInteraction) {
//         if (interaction.customId.match("help_main_menu")) this.getPage(interaction, interaction.values[0], 0);
//     }

//     public static processButtonInteraction(interaction: ButtonInteraction) {
//         let page_details = interaction.customId.match(/help_page_(?<character>.+?)_(?<page>[0-9]+?)/);
//         if (this.correctPageDetails(page_details)) this.getPage(interaction, page_details.groups.character, parseInt(page_details.groups.page));
//     }

//     private static correctPageDetails(
//         page_details: RegExpMatchArray | null
//     ): page_details is RegExpMatchArray & { groups: { character: string; page: string } } {
//         return (
//             !!page_details &&
//             !!page_details.groups &&
//             "character" in page_details.groups &&
//             typeof page_details.groups["character"] == "string" &&
//             "page" in page_details.groups &&
//             typeof page_details.groups["page"] == "string" &&
//             !isNaN(parseInt(page_details.groups["page"])) &&
//             isFinite(parseInt(page_details.groups["page"]))
//         );
//     }

//     public static async getPage(interaction: ButtonInteraction | SelectMenuInteraction, character: string, page: number) {
//         if (!(interaction.message instanceof Message)) return;

//         let commands = Object.entries(command_list[character])
//             .filter((a) => typeof a[1] == "string")
//             .map(([command_name, description]) => command_name + ": " + description);

//         let content = commands
//             .slice(page * 10, page * 10 + 10)
//             .join("\n")
//             .trim();
//         if (!content) content = "There's nothing here";
//         //let components = this.components.main_menu;
//         let extraButtons = new MessageActionRow();

//         if (page > 0) extraButtons.addComponents(this.components.pageButton(character, page - 1, "Previous page", "DANGER"));
//         if (commands.length > page * 10 + 10) extraButtons.addComponents(this.components.pageButton(character, page + 1, "Next page"));

//         //if (extraButtons.components.length > 0) components.unshift(extraButtons);

//         let components: MessageActionRow[] = extraButtons.components.length > 0 ? [extraButtons] : [];
//         components = components.concat(this.getMainMenu());

//         let data = { content: character + "\n\n" + content, components };
//         try {
//             interaction.update(data);
//         } catch (error) {
//             console.error("Error");
//         }
//         //else interaction.update(data);
//     }

//     constructor(msg: Message) {
//         say(ray, msg.channel, { components: Help.getMainMenu() }, undefined, { messageReference: msg, failIfNotExists: false });
//     }
// }
