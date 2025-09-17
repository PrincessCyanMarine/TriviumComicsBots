import { ButtonBuilder } from "@discordjs/builders";
import { addExclamationCommand } from "../../common";
import Entity, { AttackInfo, PlayerEntity } from "./entity/Entity";
import Route from "./Route";
import { ButtonInteraction, Message, MessageActionRow, MessageButton } from "discord.js";
import InteractionId, { AttackData, COMMANDS } from "./InteractionId";
import { MessageButtonStyles } from "discord.js/typings/enums";
import { addD20ButtonCommand } from "../../interactions/button/d20";

const sendMessage = async (moi: Message | ButtonInteraction, encounter: Entity, player: PlayerEntity, route: Route) => {
    const content = [`You encountered a wild ***${encounter}*** while exploring the ***${route}***`];
    const buildInfo = (entity: Entity) => `(${entity.hp}/${entity.maxHp}) ***${entity}***\nAttack: ${entity.attack}\nDefense: ${entity.defense}\nDamage: ${entity.damage.map((d) => typeof d === 'number' ? d : d.join('d')).join(' + ')}`
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
    msg.channel.sendTyping();
    const route = new Route('forest', msg)
    const player = await PlayerEntity.spawn(msg);
    msg.reply(await sendMessage(msg, await route.encounter(), player, route));
});

addD20ButtonCommand('attack', async (interaction) => {
    const data = InteractionId.customIdToObject<AttackData>(interaction.customId);
    if (data.id !== interaction.user.id) return;
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
        actions.push(`***${entity}***`);
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
    interaction.update(msg);
})

const tryResolve = (interaction: ButtonInteraction, player: PlayerEntity, enemy: Entity, route: Route): Boolean => {
    const resolve = (winner: Entity, loser: Entity) => {
        interaction.update({
            content: `${winner} won against ${loser} on ${route}`,
            components: [],
        });
        return true;
    }
    if (enemy.dead) return resolve(player, enemy);
    if (player.dead) return resolve(enemy, player);
    return false;
};