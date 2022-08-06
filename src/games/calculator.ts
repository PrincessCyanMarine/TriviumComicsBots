import { randomUUID } from "crypto";
import {
    ButtonInteraction,
    Client,
    GuildMember,
    Interaction,
    Message,
    MessageActionRow,
    MessageButton,
    MessageButtonStyle,
    MessageButtonStyleResolvable,
    User,
} from "discord.js";
import { eli, ray } from "../clients";
import { msg2embed, say } from "../common/functions";
import { getOperationResult } from "../eli/functions";
import { followup } from "../interactions/slash/common";

const messages: { [interaction: string]: { [bot: string]: Message } } = {};

export class Calculator {
    private calculator_component = (id: string, pub: boolean) => {
        let indentifier = pub ? "calculator" : `calculator_${id}`;
        let style: MessageButtonStyleResolvable = pub ? "SUCCESS" : "PRIMARY";
        return [
            new MessageActionRow().addComponents(
                new MessageButton().setCustomId(`${indentifier}_button_1/x`).setStyle(style).setLabel("1/x"),
                new MessageButton().setCustomId(`${indentifier}_button_x²`).setStyle(style).setLabel("x²"),
                new MessageButton().setCustomId(`${indentifier}_button_√`).setStyle(style).setLabel("√"),
                new MessageButton().setCustomId(`${indentifier}_button_÷`).setStyle(style).setLabel("÷"),
                new MessageButton().setCustomId(`${indentifier}_button_%`).setStyle(style).setLabel("%")
            ),
            new MessageActionRow().addComponents(
                new MessageButton().setCustomId(`${indentifier}_button_7`).setStyle(style).setLabel("7"),
                new MessageButton().setCustomId(`${indentifier}_button_8`).setStyle(style).setLabel("8"),
                new MessageButton().setCustomId(`${indentifier}_button_9`).setStyle(style).setLabel("9"),
                new MessageButton().setCustomId(`${indentifier}_button_x`).setStyle(style).setLabel("x"),
                new MessageButton().setCustomId(`${indentifier}_button_CE`).setStyle(style).setLabel("CE")
            ),
            new MessageActionRow().addComponents(
                new MessageButton().setCustomId(`${indentifier}_button_4`).setStyle(style).setLabel("4"),
                new MessageButton().setCustomId(`${indentifier}_button_5`).setStyle(style).setLabel("5"),
                new MessageButton().setCustomId(`${indentifier}_button_6`).setStyle(style).setLabel("6"),
                new MessageButton().setCustomId(`${indentifier}_button_-`).setStyle(style).setLabel("-"),
                new MessageButton().setCustomId(`${indentifier}_button_C`).setStyle(style).setLabel("C")
            ),
            new MessageActionRow().addComponents(
                new MessageButton().setCustomId(`${indentifier}_button_1`).setStyle(style).setLabel("1"),
                new MessageButton().setCustomId(`${indentifier}_button_2`).setStyle(style).setLabel("2"),
                new MessageButton().setCustomId(`${indentifier}_button_3`).setStyle(style).setLabel("3"),
                new MessageButton().setCustomId(`${indentifier}_button_+`).setStyle(style).setLabel("+"),
                new MessageButton().setCustomId(`${indentifier}_button_⌫`).setStyle(style).setLabel("⌫")
            ),
            new MessageActionRow().addComponents(
                new MessageButton().setCustomId(`${indentifier}_button_±`).setStyle(style).setLabel("±"),
                new MessageButton().setCustomId(`${indentifier}_button_0`).setStyle(style).setLabel("0"),
                new MessageButton().setCustomId(`${indentifier}_button_.`).setStyle(style).setLabel("."),
                new MessageButton().setCustomId(`${indentifier}_button_=`).setStyle(style).setLabel("="),
                new MessageButton().setCustomId(`${indentifier}_button_π`).setStyle(style).setLabel("π")
            ),
        ];
    };

    constructor(msg: Message, pub: boolean) {
        say(eli, msg.channel, {
            components: this.calculator_component(msg.author.id, pub),
            content: "0",
            reply: { messageReference: msg, failIfNotExists: false },
        });
    }

    static processInteraction(interaction: ButtonInteraction, button: string, pub: boolean) {
        //interaction.deferUpdate();
        let operations = interaction.message.content.split("\n")[0].split(" ");

        let index = operations.length - 1;

        if (isNaN(parseFloat(operations[index])) || !isFinite(parseFloat(operations[index]))) operations[index] = "0";

        switch (button) {
            case "1/x":
                operations = getOperationResult(operations);
                operations[0] = (1 / parseFloat(operations[0])).toString();
                break;

            case "x²":
                operations = getOperationResult(operations);
                operations[0] = Math.pow(parseFloat(operations[0]), 2).toString();
                break;

            case "√":
                operations[index] = Math.sqrt(parseFloat(operations[index])).toString();
                break;

            case "%":
                let percentage = parseFloat(operations[index]) / 100;
                if (!operations[index - 1] || ["÷", "x"].includes(operations[index - 1])) {
                    operations[index] = percentage.toString();
                } else {
                    operations[index] = (percentage * parseFloat(operations[index - 2])).toString();
                }
                break;

            case "CE":
                operations[index] = "0";
                break;

            case "C":
                operations = ["0"];
                break;

            case "⌫":
                if (operations[index] == "0") {
                    if (operations.length == 1) break;
                    operations = operations.slice(0, index - 1);
                } else {
                    if (operations[index].length == 1) operations[index] = "0";
                    else operations[index] = operations[index].substring(0, operations[index].length - 1);
                }
                break;

            case "±":
                if (operations[index] == "0") break;
                if (operations[index].startsWith("-")) operations[index] = operations[index].substring(1, operations[index].length);
                else operations[index] = "-" + operations[index];
                break;

            case "=":
                operations = getOperationResult(operations);
                break;

            case "÷":
            case "x":
            case "-":
            case "+": {
                operations = getOperationResult(operations);
                if (operations[index] == "0" && operations[index - 1]) operations[operations.length - 2] = button;
                else operations.push(button, "0");
                break;
            }

            default: {
                if (button == "π") button = Math.PI.toString();
                if (button != "." && operations[index] == "0") operations[index] = button;
                else operations[index] += button;
                break;
            }
        }

        let content = operations.join(" ");

        // let url = `https://www.webtoons.com/en/challenge/0/0l/viewer?title_no=237252&episode_no=${ep}&webtoonType=CHALLENGE`;

        if (interaction.channel) {
            if (content === "420") this.joke(interaction, eli, "Look dad it's the good cush");
            else if (content === "69") this.joke(interaction, ray, "Nice");
            else {
                let e = content.match(/e\+([0-9]+)/);
                if (e?.[1])
                    this.joke(
                        interaction,
                        ray,
                        `https://www.webtoons.com/en/challenge/0/0/viewer?title_no=237252&episode_no=${e[1]}&webtoonType=CHALLENGE`
                    );
            }
        }

        if (pub && interaction.member)
            content += "\n" + (interaction.member instanceof GuildMember ? interaction.member.displayName : interaction.member.user.username);

        interaction.update({ content });
    }

    static joke(interaction: ButtonInteraction, bot: Client, content: string) {
        if (!interaction.channel) return;
        let reply = interaction.message instanceof Message ? { messageReference: interaction.message } : undefined;
        let interactionId = interaction.message.id;
        let botId = bot.user!.id;
        if (!messages[interactionId]?.[botId])
            say(bot, interaction.channel, content, undefined, reply).then((message) => {
                if (!messages[interactionId]) messages[interactionId] = {};
                messages[interactionId][botId] = message;
            });
        else messages[interactionId][botId].edit(content);
    }
}
