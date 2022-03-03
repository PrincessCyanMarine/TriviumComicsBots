import { randomUUID } from "crypto";
import { ButtonInteraction, Interaction, Message, MessageActionRow, MessageButton, User } from "discord.js";
import { eli } from "../clients";
import { say } from "../common/functions";
import { getOperationResult } from "../eli/functions";

export class Calculator {
    private calculator_component = (id: string) => [
        new MessageActionRow().addComponents(
            new MessageButton().setCustomId(`calculator_${id}_button_1/x`).setStyle("PRIMARY").setLabel("1/x"),
            new MessageButton().setCustomId(`calculator_${id}_button_x²`).setStyle("PRIMARY").setLabel("x²"),
            new MessageButton().setCustomId(`calculator_${id}_button_√`).setStyle("PRIMARY").setLabel("√"),
            new MessageButton().setCustomId(`calculator_${id}_button_÷`).setStyle("PRIMARY").setLabel("÷"),
            new MessageButton().setCustomId(`calculator_${id}_button_%`).setStyle("PRIMARY").setLabel("%")
        ),
        new MessageActionRow().addComponents(
            new MessageButton().setCustomId(`calculator_${id}_button_7`).setStyle("PRIMARY").setLabel("7"),
            new MessageButton().setCustomId(`calculator_${id}_button_8`).setStyle("PRIMARY").setLabel("8"),
            new MessageButton().setCustomId(`calculator_${id}_button_9`).setStyle("PRIMARY").setLabel("9"),
            new MessageButton().setCustomId(`calculator_${id}_button_x`).setStyle("PRIMARY").setLabel("x"),
            new MessageButton().setCustomId(`calculator_${id}_button_CE`).setStyle("PRIMARY").setLabel("CE")
        ),
        new MessageActionRow().addComponents(
            new MessageButton().setCustomId(`calculator_${id}_button_4`).setStyle("PRIMARY").setLabel("4"),
            new MessageButton().setCustomId(`calculator_${id}_button_5`).setStyle("PRIMARY").setLabel("5"),
            new MessageButton().setCustomId(`calculator_${id}_button_6`).setStyle("PRIMARY").setLabel("6"),
            new MessageButton().setCustomId(`calculator_${id}_button_-`).setStyle("PRIMARY").setLabel("-"),
            new MessageButton().setCustomId(`calculator_${id}_button_C`).setStyle("PRIMARY").setLabel("C")
        ),
        new MessageActionRow().addComponents(
            new MessageButton().setCustomId(`calculator_${id}_button_1`).setStyle("PRIMARY").setLabel("1"),
            new MessageButton().setCustomId(`calculator_${id}_button_2`).setStyle("PRIMARY").setLabel("2"),
            new MessageButton().setCustomId(`calculator_${id}_button_3`).setStyle("PRIMARY").setLabel("3"),
            new MessageButton().setCustomId(`calculator_${id}_button_+`).setStyle("PRIMARY").setLabel("+"),
            new MessageButton().setCustomId(`calculator_${id}_button_⌫`).setStyle("PRIMARY").setLabel("⌫")
        ),
        new MessageActionRow().addComponents(
            new MessageButton().setCustomId(`calculator_${id}_button_±`).setStyle("PRIMARY").setLabel("±"),
            new MessageButton().setCustomId(`calculator_${id}_button_0`).setStyle("PRIMARY").setLabel("0"),
            new MessageButton().setCustomId(`calculator_${id}_button_.`).setStyle("PRIMARY").setLabel("."),
            new MessageButton().setCustomId(`calculator_${id}_button_=`).setStyle("PRIMARY").setLabel("="),
            new MessageButton().setCustomId(`calculator_${id}_button_π`).setStyle("PRIMARY").setLabel("π")
        ),
    ];

    constructor(msg: Message) {
        say(eli, msg.channel, { components: this.calculator_component(msg.author.id), content: "0" });
    }

    static processInteraction(interaction: ButtonInteraction, button: string) {
        //interaction.deferUpdate();
        let operations = interaction.message.content.split(" ");

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

        interaction.update({ content: operations.join(" ") });
    }
}
