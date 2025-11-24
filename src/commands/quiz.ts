import { ButtonInteraction, Client, Interaction, Message, MessageActionRow, MessageButton, TextChannel } from "discord.js";
import { addD20ButtonCommand } from "../interactions/button/d20";
import { clients, d20 } from "../clients";
import { addKrystalButtonCommand } from "../interactions/button/krystal";
import { database } from "..";
import { SlashCommandBuilder, SlashCommandIntegerOption, SlashCommandStringOption, SlashCommandSubcommandBuilder, time, TimestampStyles, userMention } from "@discordjs/builders";
import { addSadieButtonCommand } from "../interactions/button/sadie";
import { addD20SlashCommand } from "../interactions/slash/d20";
import { botNames } from "../model/botData";
import { readdirSync, readFileSync, rm, rmSync, writeFileSync } from "fs";
import { dodoId, TIME } from "../common/variables";

const quizzes: {[id: string]: {
    question: string;
    answers: string[];
    correct: string;
    bot: string;
}} = {};

const timers: { [id: string]: NodeJS.Timeout } = {};

readdirSync('./quiz').forEach((file) => {
    quizzes[file.split('.')[0]] = (JSON.parse(readFileSync(`./quiz/${file}`, 'utf-8')));
});

const mods: {[id: string]: boolean} = {};
const getMembers = async () => {
    console.debug('d20 READY klrh jnkfdhbkjn')
    const guild = await d20.guilds.fetch('562429293364248587');
    console.debug('guild', guild.id);
    const role = await guild.roles.fetch('609593848448155668');
    role?.members.map(member => member.id).concat([dodoId]).forEach(id => {
        mods[id] = true;
    })
};

if (d20.isReady()) getMembers();
else (d20 as Client<false>).on('ready', getMembers);

const letters = ['a', 'b', 'c', 'd'];
let answers: {[guildId: string]: {
    questions: {[messageId: string]: {
        correct:  'a' | 'b' | 'c' | 'd',
        messageURL: string,
        channelId: string,
        closed?: boolean,
        answers?: { [userId: string]: {
            answer:  'a' | 'b' | 'c' | 'd',
            timestamp: number,
        } }
        startTimestamp?: number,
        endTimestamp?: number
    }}
    points?: { [userId: string]: number } 
}} | null = null;
database.child('quiz').on('value', async (data) => {
    answers = data.val();
    // console.log(answers);
    if (!answers) return;
    for (const [guildId, answer] of Object.entries(answers)) {
        const guild = await d20.guilds.fetch(guildId);
        for (const [messageId, question] of Object.entries(answer.questions)) {
            if (question.closed) continue;
            if (question.endTimestamp) {
                const channel = await guild.channels.fetch(question.channelId);
                if (!(channel instanceof TextChannel)) continue;
                setTimer(messageId, channel, question.endTimestamp)
            }
        }
    }
});

const endQuiz = (quizId: string, channel: TextChannel) => {
    if (!answers) {
        return ({ content: 'The quiz system is starting up, try again in a few seconds', ephemeral: true });
    }
    for (const [guildId, {questions}] of Object.entries(answers)) {
        if (!questions?.[quizId]) continue;
        const quiz = questions[quizId];
        if (quiz.closed) {
            return ({ content: 'That quiz is already closed', ephemeral: true });
        }

        if (!quiz.answers) quiz.answers = {}
        const correct = Object.entries(quiz.answers).reduce((pv, [userId, { answer, timestamp }]) => {
            const ranking = pv.ranking ? [ ...pv.ranking ] : [];
            if (answer === quiz.correct) ranking.push({ userId, timestamp });
            return {
                ranking,
                votes: {
                    ...pv.votes,
                    [answer]: (pv.votes?.[answer] || 0) + 1,
                }
            };
        }, {
            ranking: [],
            votes: {a: 0, b: 0, c: 0, d: 0}
        } as {
            ranking: {
                userId: string,
                timestamp: number,
            }[],
            votes: {
                a: number,
                b: number,
                c: number,
                d: number,
            }
        });
        correct.ranking.sort((a, b) => a.timestamp - b.timestamp);
        console.debug(correct);
        const totalVotes = Object.keys(quiz.answers).length;
        channel.send(`Quiz ${quiz.messageURL} closed!\n# The correct answer was: ${quiz.correct.toUpperCase()}\n\n## Ranking:\n${
            correct.ranking.slice(0, 5).map(({userId, timestamp}, i) => `${userMention(userId)}: +${100 - (i * 10)} points`).join('\n')
        }\n\n## Answers:\n\`\`\`${
            Object.entries(correct.votes).map(([letter, votes]) => `${letter.toUpperCase()}: ${votes} (${totalVotes === 0 ? 0 : Math.floor((votes/totalVotes) * 100)}%)`).join('\n')
        }\`\`\``);
        if (!answers[guildId].points) answers[guildId].points = {};
        for (let i = 0; i < correct.ranking.length  && i < 10; i++) {
            const { userId } = correct.ranking[i];
            answers[guildId].points[userId] = (answers[guildId].points[userId] || 0) + (100 - i * 10);
        }
        database.child('quiz').child(guildId).child('points').set(answers[guildId].points);
        database.child('quiz').child(guildId).child('questions').child(quizId).child('closed').set(true);
        return ({ content: 'Quiz closed', ephemeral: true });
    }
    return ({
        content: 'Please select a valid quizz\'s message id',
        ephemeral: true,
    });
}
const setTimer = (questionId: string, channel: TextChannel, endTimestamp: number) => {
    if (timers[questionId]) return;
    const remaining = endTimestamp - new Date().valueOf();
    console.debug(`${questionId} will be closed in ${remaining}ms`);
    if (remaining < 0) {
        const res = endQuiz(questionId, channel)
        if (res) console.debug(res);
    }
    else timers[questionId] = setTimeout(() => {
        console.debug(`closing ${questionId}`);
        const res = endQuiz(questionId, channel)
        if (res) console.debug(res);
    }, remaining);
}

const validMoI = (moi: Message | Interaction) => {
    // if (moi.guildId !== '620088019868844042') return false;
    return true;
}

const answerFunction = async (interaction: ButtonInteraction) => {
    if (!validMoI(interaction)) return;
    if (!answers) {
        interaction.reply({
            content: 'The quiz system is starting up, try again in a few seconds',
            ephemeral: true,
        });
        return;
    }
    const answer = interaction.customId.match('choice=(.+?)($|&)')?.[1];
    if (!answer) {
        interaction.update({ content: 'Something went wrong', components: [] });
        return;
    }
    const questionAnswers = answers?.[interaction.guildId!]?.questions?.[interaction.message.id];

    if (!questionAnswers || questionAnswers.closed) {
        interaction.reply({
            content: 'That quiz is already over',
            ephemeral: true,
        })
        return;
    }
    {
        let userAnswer;
        if ((userAnswer = questionAnswers.answers?.[interaction.user.id]?.answer)) {
            interaction.reply({
                content: `You have already voted for answer ${userAnswer.toUpperCase()}`,
                ephemeral: true,
            });
            return;
        }
    }
    await database.child('quiz').child(interaction.guildId!).child('questions').child(interaction.message.id).child('answers').child(interaction.user.id).set({
        answer, timestamp: new Date().valueOf()
    });
    interaction.reply({
        content: 'Your answer has been registered',
        ephemeral: true,
    });
};

addKrystalButtonCommand('answer', answerFunction);
addD20ButtonCommand('answer', answerFunction);
addSadieButtonCommand('answer', answerFunction);


const botsOptionRequired = new SlashCommandStringOption()
        .setName('bot')
        .setDescription('Sets which bot should ask the question')
        .addChoices(...botNames.filter((b) => !['common'].includes(b)).map((bn) => ({ name: bn, value: bn })))
        .setRequired(true);
const botsOptionNotRequired = new SlashCommandStringOption()
        .setName('bot')
        .setDescription('Sets which bot should ask the question')
        .addChoices(...botNames.filter((b) => !['common'].includes(b)).map((bn) => ({ name: bn, value: bn })))
        .setRequired(false);

const quizAddSubcommand = new SlashCommandSubcommandBuilder()
    .setName('add')
    .setDescription('Adds a new quiz question')
    .addStringOption(botsOptionRequired)
    .addStringOption(new SlashCommandStringOption()
        .setName('question')
        .setDescription('The question')
        .setRequired(true)
    )
    .addStringOption(new SlashCommandStringOption()
        .setName('option_a')
        .setDescription('Option A')
        .setRequired(true)
    )
    .addStringOption(new SlashCommandStringOption()
        .setName('option_b')
        .setDescription('Option B')
        .setRequired(true)
    )
    .addStringOption(new SlashCommandStringOption()
        .setName('option_c')
        .setDescription('Option C')
        .setRequired(true)
    )
    .addStringOption(new SlashCommandStringOption()
        .setName('option_d')
        .setDescription('Option D')
        .setRequired(true)
    )
    .addStringOption(new SlashCommandStringOption()
        .addChoices({name: 'a', value:'a'},{name: 'b', value:'b'},{name: 'c', value:'c'},{name: 'd', value:'d'})
        .setName('correct')
        .setRequired(true)
        .setDescription('Sets the correct option')
    )
const quizEditSubcommand = new SlashCommandSubcommandBuilder()
    .setName('edit')
    .setDescription('Edits a new quiz question')
    .addStringOption(new SlashCommandStringOption()
        .setName('id')
        .setDescription('The id of the question being edited')
        .setRequired(true)
    )
    .addStringOption(botsOptionNotRequired)
    .addStringOption(new SlashCommandStringOption()
        .setName('question')
        .setDescription('The question')
        .setRequired(false)
    )
    .addStringOption(new SlashCommandStringOption()
        .setName('option_a')
        .setDescription('Option A')
        .setRequired(false)
    )
    .addStringOption(new SlashCommandStringOption()
        .setName('option_b')
        .setDescription('Option B')
        .setRequired(false)
    )
    .addStringOption(new SlashCommandStringOption()
        .setName('option_c')
        .setDescription('Option C')
        .setRequired(false)
    )
    .addStringOption(new SlashCommandStringOption()
        .setName('option_d')
        .setDescription('Option D')
        .setRequired(false)
    )
    .addStringOption(new SlashCommandStringOption()
        .addChoices({name: 'a', value:'a'},{name: 'b', value:'b'},{name: 'c', value:'c'},{name: 'd', value:'d'})
        .setName('correct')
        .setRequired(false)
        .setDescription('Sets the correct option')
    )

const quizRemoveSubcommand = new SlashCommandSubcommandBuilder()
    .setName('remove')
    .setDescription('Removes a quiz question')
    .addStringOption(new SlashCommandStringOption()
        .setName('id')
        .setDescription('The id of the question to be removed')
        .setRequired(true)
    )

const quizListSubCommand = new SlashCommandSubcommandBuilder()
    .setName('list')
    .setDescription('Lists quiz questions')

const quizStartSubCommand = new SlashCommandSubcommandBuilder()
    .setName('start')
    .setDescription('Starts a quiz')
    .addStringOption(new SlashCommandStringOption()
        .setName('id')
        .setDescription('The id of the question')
        .setRequired(true)
    )
    .addIntegerOption(new SlashCommandIntegerOption()
        .setName('duration')
        .setDescription('How long should the quiz be opened for')
        .setChoices(
            { name: '10 seconds (testing)', value: TIME.SECONDS * 10 },
            { name: '1 hour', value: TIME.HOURS },
            { name: '4 hour', value: 4 * TIME.HOURS },
            { name: '8 hour', value: 8 * TIME.HOURS },
            { name: '24 hour', value: 24 * TIME.HOURS },
            { name: '3 days', value: 3 * TIME.DAYS },
            { name: '1 week', value: TIME.WEEKS },
            { name: '2 weeks', value: 2 * TIME.WEEKS },
            { name: 'manual', value: 0 }
        )
        .setRequired(true)
    )

const quizEndSubCommand = new SlashCommandSubcommandBuilder()
    .setName('end')
    .setDescription('Ends a quiz')
    .addStringOption(new SlashCommandStringOption()
        .setName('id')
        .setDescription('The id of the quiz message')
        .setRequired(true)
    )


const quizCommand = new SlashCommandBuilder()
    .setName('quiz')
    .setDescription('Commands relating to the quiz system');

quizCommand
    .addSubcommand(quizAddSubcommand)
    .addSubcommand(quizEditSubcommand)
    .addSubcommand(quizRemoveSubcommand)
    .addSubcommand(quizListSubCommand)
    .addSubcommand(quizStartSubCommand)
    .addSubcommand(quizEndSubCommand)
;

addD20SlashCommand(quizCommand, async (interaction) => {
    if (!mods[interaction.user.id]) {
        interaction.reply({
            ephemeral: true,
            content: 'Only Queensblade can use the /quiz command',
        });
        return;
    }
    if (!(interaction.channel instanceof TextChannel)) {
        interaction.reply('This is not a valid channel');
        return;
    }
    switch(interaction.options.getSubcommand()) {
        case 'add': {
            const bot = interaction.options.getString('bot', true);
            const question = interaction.options.getString('question', true);
            const option_a = interaction.options.getString('option_a', true);
            const option_b = interaction.options.getString('option_b', true);
            const option_c = interaction.options.getString('option_c', true);
            const option_d = interaction.options.getString('option_d', true);
            const correct = interaction.options.getString('correct', true) as 'a' | 'b' | 'c' | 'd';
            const id = new Date().valueOf().toString();
            const quiz = {
                question,
                answers: [option_a, option_b, option_c, option_d],
                correct,
                bot,
                id,
            };
            quizzes[id] = quiz;
            writeFileSync(`./quiz/${id}.json`, JSON.stringify(quiz, null, 4));
            interaction.reply({ content: `Question ${id} added`});
            return;
        }
        case 'remove': {
            const id = interaction.options.getString('id', true);
            if (!quizzes[id]) {
                interaction.reply({ ephemeral: true, content: 'There is no question with that id'});
                return;
            }
            delete quizzes[id];
            rmSync(`./quiz/${id}.json`);
            interaction.reply(`Question ${id} removed`);
            return;
        }
        case 'edit': {
            const id = interaction.options.getString('id', true);
            if (!quizzes[id]) {
                interaction.reply({ ephemeral: true, content: 'There is no question with that id'});
                return;
            }
            const current = quizzes[id];
            const bot = interaction.options.getString('bot', false) || current.bot;
            const question = interaction.options.getString('question', false) || current.question;
            const option_a = interaction.options.getString('option_a', false) || current.answers[0];
            const option_b = interaction.options.getString('option_b', false) || current.answers[1];
            const option_c = interaction.options.getString('option_c', false) || current.answers[2];
            const option_d = interaction.options.getString('option_d', false) || current.answers[3];
            const correct = (interaction.options.getString('correct', false) || current.correct) as 'a' | 'b' | 'c' | 'd';
            const quiz = { question: question, answers: [option_a, option_b, option_c, option_d], correct, bot, id, };
            quizzes[id] = quiz;
            writeFileSync(`./quiz/${id}.json`, JSON.stringify(quiz, null, 4));
            interaction.reply({ content: `Question ${id} edited`});
            return;
        }
        case 'list': {
            interaction.reply({
                content: Object.entries(quizzes).map(([id, { question }]) => `${id}: ${question}`).join('\n'),
                ephemeral: true,
            });
            return
        }
        case 'start': {
            const selectedQuiz = interaction.options.getString('id', true);
            const duration = interaction.options.getInteger('duration', true);
            const startTimestamp = duration === 0 ? null : new Date().valueOf();
            const endTimestamp = startTimestamp ? startTimestamp + duration : null;
            if (!quizzes[selectedQuiz]) {
                interaction.reply('Please select a valid quiz');
                return
            }
            const quiz = quizzes[selectedQuiz];
            let content = `${quiz.question}\n\`\`\``;
            for (let i = 0; i < quiz.answers.length; i++) {
                content += `\n${letters[i].toUpperCase()}: ${quiz.answers[i]}`;
            }
            content += '\`\`\`';
            if (endTimestamp) {
                const endDate = new Date(endTimestamp);
                content += `\n\nCloses: ${time(endDate, TimestampStyles.RelativeTime)}`
            }
            const buttons = letters.map((letter) =>
                new MessageButton().setLabel(`${letter.toUpperCase()}`).setCustomId(`answer?choice=${letter}`).setStyle('PRIMARY')
            );
            const bot = clients[quiz.bot];
            let channel = (await bot.channels.fetch(interaction.channelId));
            if (!(channel instanceof TextChannel)) return;
            // message = await channel.messages.fetch(msg.id);
            const question = await channel.send('Loading...');
            await database.child('quiz').child(channel.guildId!).child('questions').child(question.id).set({
                correct: quiz.correct,
                messageURL: question.url,
                channelId: channel.id,
                startTimestamp: startTimestamp,
                endTimestamp: endTimestamp,
            })
            if (endTimestamp) setTimer(question.id, interaction.channel, endTimestamp);
            question.edit({
                content,
                components: [
                    new MessageActionRow().setComponents(buttons),
                ]
            });
            interaction.reply({ content: 'Quiz started', ephemeral: true });
            return;
        }
        case 'end': {
            const res = endQuiz(interaction.options.getString('id', true), interaction.channel);
            if (res) interaction.reply(res);
            return;
        }
    }
    interaction.reply({ ephemeral: true, content: 'Quiz command received' });
});