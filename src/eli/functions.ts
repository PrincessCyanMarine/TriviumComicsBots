import { GuildMember, Message } from "discord.js";
import { pfft } from "../attachments";
import { eli, krystal, ray, sadie } from "../clients";
import { random_from_array, say } from "../common/functions";
import { killing } from "../krystal/functions";

export function dodoOnline(msg: Message) {
    const success = (dodo: GuildMember) => {
        // console.log(dodo.presence?.status);
        if (!dodo.presence || dodo.presence?.status == "offline") {
            fail();
            return;
        }
        random_from_array([
            () => {
                say(krystal, msg.channel, "Dodad is home! :GMKrystal:");
            },
            () => {
                say(ray, msg.channel, "Oh no... :GMRayinternalscreaming:");
            },
            () => {
                say(sadie, msg.channel, "Hey there, Dodo! :GMSadieExcited:");
            },
            () => {
                say(krystal, msg.channel, "Okaerinasai, Dodo-sama");
            },
        ])();
    };

    const fail = () => {
        random_from_array([
            async () => {
                say(krystal, msg.channel, { content: "Fake news :GMKrystalTongue:", files: [pfft] });
            },
            async () => {
                say(krystal, msg.channel, {
                    content: "I will now unalive this propaganda spreader :GMKrystalDevious:",
                    files: [await killing(undefined, msg.author)],
                });
            },
        ])();
    };

    msg.guild?.members.fetch("297531251081084941").then(success).catch(fail);
}

export function calculate(math_exp: RegExpMatchArray) {
    console.log(math_exp);
}

export function getOperationResult(operations: string[]) {
    if (["9 + 10", "10 + 9"].includes(operations.join(" "))) return ["21"];
    let result = parseFloat(operations[0]);
    for (let i = 1; i < operations.length; i++) {
        let symbol = operations[i];
        if (["÷", "/", "*", "x", "-", "+"].includes(symbol)) continue;
        let num = parseFloat(symbol);
        let operation_type = operations[i - 1];
        switch (operation_type) {
            case "÷":
            case "/":
                result /= num;
                break;

            case "x":
            case "*":
                result *= num;
                break;

            case "-":
                result -= num;
                break;

            case "+":
                result += num;
                break;
        }
    }

    return [result.toString()];
}
