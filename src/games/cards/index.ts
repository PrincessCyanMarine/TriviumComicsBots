import { MessageAttachment } from "discord.js";
import { database } from "../..";
import { addExclamationCommand } from "../../common";
import { addCommandToGuild } from "../../interactions/slash/common";
import { Canvas, createCanvas, Image, loadImage } from "canvas";
import { writeFileSync } from "fs";

var runningGames: any | null = {};

const cards = {
    ray: {
        stardust: 5,
        power: 3000,
        mana: 1,
    },
};

const rotate = (degrees: number, image: Image | Canvas) => {
    const biggest = Math.max(image.width, image.height);
    const rotatedCanvas = createCanvas(biggest, biggest);
    const rotatedCtx = rotatedCanvas.getContext('2d');

    rotatedCtx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
    rotatedCtx.rotate(degrees * Math.PI / 180);
    rotatedCtx.drawImage(image, -rotatedCanvas.width / 2, -rotatedCanvas.height / 2);
    return rotatedCanvas;
}

const rotateOpponent = (card: Image | Canvas) => rotate(180, card);
const rotateKneeling = (card: Image | Canvas) => rotate(90, card);

const drawGame = async (playerCardName: string, opponentCardName: string) => {
    const playerCard = await loadImage(`./assets/cards/${playerCardName}.png`);
    const opponentCard = rotateOpponent(await loadImage(`./assets/cards/${opponentCardName}.png`));

    if (!playerCard || !opponentCard) throw 'Something went wrong';

    const canvas = createCanvas(5120, 2880);
    const ctx = canvas.getContext('2d');

    ctx.drawImage((playerCard), (canvas.width / 2) - (playerCard.width / 2), canvas.height - playerCard.height - 10);
    ctx.drawImage((opponentCard), (canvas.width / 2)- (opponentCard.width / 2), 10);

    return canvas.toBuffer('image/png');
}

addExclamationCommand("tccard", async (msg) => {
    if (!runningGames) {
        msg.reply('This command is still initializing, please try again in a bit');
        return;
    }
    if (!msg.guildId) {
        msg.reply('This command must be used in a server');
        return;
    }
    if (runningGames[msg.guildId]?.[msg.author.id]) {
        msg.reply(`You already have an ongoing game ${runningGames[msg.guildId]?.[msg.author.id].link}`);
        return;
    }
    const game = await drawGame('Krystal', 'Sadie');
    writeFileSync('./assets/cards/test.png', game);
    msg.reply({
        files: [new MessageAttachment(game, 'game.png')],
    })
});