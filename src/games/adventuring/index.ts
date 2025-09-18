import { ButtonBuilder } from "@discordjs/builders";
import { addExclamationCommand } from "../../common";
import Entity, { AttackInfo, PlayerEntity } from "./entity/Entity";
import Route from "./Route";
import { ButtonInteraction, Message, MessageActionRow, MessageButton } from "discord.js";
import InteractionId, { AttackData, COMMANDS } from "./InteractionId";
import { MessageButtonStyles } from "discord.js/typings/enums";
import { addD20ButtonCommand } from "../../interactions/button/d20";
import { Inventory } from "../../model/inventory";
import { marineId } from "../../common/variables";
import { getStamina, useStamina } from "../../common/functions";
const COST = 5;

const sendMessage = async (moi: Message | ButtonInteraction, encounter: Entity, player: PlayerEntity, route: Route) => {
    const stamina = (await getStamina(moi));
    const content = [`You encountered a wild ${encounter} while exploring the ${route}\nstamina: ${Math.floor(stamina.value)}/${Math.floor(stamina.max)}`];
    const buildInfo = (entity: Entity) => `(${entity.hp}/${entity.maxHp}) ${entity}\nAttack: ${entity.attack}\nDefense: ${entity.defense}\nDamage: ${entity.damage.map((d) => typeof d === 'number' ? d : d.join('d')).join(' + ')}`
    content.push(buildInfo(encounter));
    content.push('\n');
    content.push(buildInfo(player));
    const author = moi instanceof Message ? moi.author : moi.user;

    const components = [
        new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId(InteractionId.objectToCustomId<AttackData>({
                    command: COMMANDS.ATTACK,
                    id: author.id,
                    eId: encounter.id,
                    ehp: encounter.hp + '',
                    php: player.hp + ''
                }))
                .setLabel(`ATTACK`)
                .setStyle(MessageButtonStyles.DANGER),
            ),
    ];

    return {
        content: content.join('\n'),
        components
    };
}

addExclamationCommand('battle', async (msg, args) => {
    try {
        const inventory = await Inventory.get(msg);
        const hasTestStick = inventory.items.find((item) => item.id === Inventory.ITEM_DICT['The test stick'] && item.equipped);
        const stamina = (await getStamina(msg));
        if (!hasTestStick && stamina.value < COST) {
            msg.reply({content: `Not enough stamina (${Math.floor(stamina.value)}/${Math.floor(stamina.max)})\nYou need at least ${COST} stamina`, components: [goAgainButton(msg)]})
            return;
        }
        msg.channel.sendTyping();
        const route = new Route('forest', msg)
        const player = await PlayerEntity.spawn(msg);
        let enemy = await route.encounter();
        if (msg.author.id === marineId && args[1]) {
            console.debug('parseInt(args[2])', parseInt(args[2]));
            const hp = args[2] && !isNaN(parseInt(args[2])) ? parseInt(args[2]) : undefined;
            enemy = await Entity.spawn(msg, args[1], hp);
        }
        if (!hasTestStick) await useStamina(msg, COST);
        msg.reply(await sendMessage(msg, enemy, player, route));
    } catch(err) {
        console.error(err);
        msg.reply('An error has ocurred. Please try again');
    }
});
addD20ButtonCommand(COMMANDS.BATTLE, async (interaction) => {
    try {
        const data = InteractionId.customIdToObject<AttackData>(interaction.customId);
        if (data.id !== interaction.user.id) {
            await interaction.reply({ content: 'You can\'t press other people\'s buttons', ephemeral: true });
            return;
        }
        const inventory = await Inventory.get(interaction);
        const hasTestStick = inventory.items.find((item) => item.id === Inventory.ITEM_DICT['The test stick'] && item.equipped);
        const stamina = (await getStamina(interaction));
        const cost = COST;
        if (!hasTestStick && stamina.value < cost) {
            await interaction.update({content: `Not enough stamina (${Math.floor(stamina.value)}/${Math.floor(stamina.max)})\nYou need at least ${COST} stamina`, components: [goAgainButton(interaction)]})
            return;
        }
        const route = new Route('forest', interaction)
        const player = await PlayerEntity.spawn(interaction);
        let enemy = await route.encounter();
        if (!hasTestStick) await useStamina(interaction, COST);
        await interaction.update(await sendMessage(interaction, enemy, player, route));
    } catch(err) {
        console.error(err);
        // interaction.reply({ content: 'An error has ocurred. Please try again', ephemeral: true });
    }
});
addD20ButtonCommand(COMMANDS.ATTACK, async (interaction) => {
    try {
        const data = InteractionId.customIdToObject<AttackData>(interaction.customId);
        if (data.id !== interaction.user.id) {
            interaction.reply({ content: 'You can\'t press other people\'s buttons', ephemeral: true });
            return;
        }
        console.debug(data);
        const route = new Route('forest', interaction);
        const enemy = await Entity.spawn(interaction, data.eId, parseInt(data.ehp));
        const player = await PlayerEntity.spawn(interaction, undefined, parseInt(data.php));

        const playerAttack = player.attackEntity(enemy);
        if (tryResolve(interaction, player, enemy, route)) return;
        const enemyAttack = enemy.attackEntity(player);
        if (tryResolve(interaction, player, enemy, route)) return;

        const actions: string[] = [];
        const populateActions = (entity: Entity, target: Entity, info: AttackInfo) => {
            let damage = `${info.damage} damage`;
            if (info.hit) damage += ` (${info.rolled.map((rolled) => rolled[1]).join(' + ')})`
            actions.push(`${entity}`);
            actions.push(`[${info.roll} + ${entity.attack}] ${damage}`);
            if (info.crit) actions.push('***CRITICAL!!!***');
            else if (info.critFail) actions.push('***CRITICAL FAIL!!!***');
        }

        populateActions(player, enemy, playerAttack);
        actions.push('\n')
        populateActions(enemy, player, enemyAttack);

        const msg = await sendMessage(interaction, enemy, player, route);
        msg.content += `\n\n\n\n`;
        msg.content += actions.join('\n');
        await interaction.update(msg);
    } catch(err) {
        console.error(err);
        // interaction.reply({ content: 'An error has ocurred. Please try again', ephemeral: true });
    }
})

const win = (interaction: ButtonInteraction, player: PlayerEntity, enemy: Entity, route: Route) => {
    const drops = enemy.rollDrops();
    const gold = enemy.rollGold()
    drops.forEach((item) => Inventory.give(interaction, item, item.count || 1));
    Inventory.addGold(interaction, gold);
    const res = [];
    if (drops.length > 0) res.push(`${player} received ${drops.length} items`);
    if (gold > 0) res.push(`${player} received ${gold} gold`);
    return res.join('\n');
}

const lose = (interaction: ButtonInteraction, player: PlayerEntity, enemy: Entity, route: Route) => {
    const gold = enemy.rollGold()
    Inventory.addGold(interaction, -gold);
    const res = [];
    if (gold > 0) res.push(`${player} lost ${gold} gold`);
    return res.join('\n');
}

const tryResolve = (interaction: ButtonInteraction, player: PlayerEntity, enemy: Entity, route: Route): Boolean => {
    const resolve = (winner: Entity, loser: Entity, append?: string) => {
        let msg = `${winner} won against ${loser} on ${route}`;
        if (append) msg += '\n' + append;
        interaction.update({
            content: msg,
            components: [goAgainButton(interaction)],
        });
        return true;
    }
    if (enemy.dead) {
        return resolve(player, enemy, win(interaction, player, enemy, route));
    }
    if (player.dead) return resolve(enemy, player, lose(interaction, player, enemy, route));
    return false;
};
const goAgainButton = (moi: Message | ButtonInteraction) => new MessageActionRow().addComponents(
    new MessageButton()
        .setCustomId(InteractionId.objectToCustomId({
            command: COMMANDS.BATTLE,
            id: moi instanceof Message ? moi.author.id : moi.user.id,
        }))
        .setLabel(`BATTLE (${COST} stamina)`)
        .setEmoji('🔃')
        .setStyle(MessageButtonStyles.PRIMARY),
);