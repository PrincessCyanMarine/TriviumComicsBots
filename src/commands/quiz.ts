import { ButtonInteraction, Interaction, Message, MessageActionRow, MessageButton, TextChannel } from "discord.js";
import { addExclamationCommand } from "../common";
import { addD20ButtonCommand } from "../interactions/button/d20";
import { clients } from "../clients";
import { addKrystalButtonCommand } from "../interactions/button/krystal";
import { database } from "..";
import { userMention } from "@discordjs/builders";
import { addSadieButtonCommand } from "../interactions/button/sadie";

const quizzes: {
    question: string;
    answers: string[];
    correct: string;
    bot?: string;
}[] = [
    {
        question: 'Is the correct answer B?',
        answers: [
            'Yes',
            'No',
            'Yes',
            'Yes'
        ],
        correct: 'c',
        bot: 'krystal',
    },
    {
        question: 'Is Sadie best girl?',
        answers: [
            'Yes',
            'No',
            'Don\'t you dare not answer A',
            'I\'ll kill you if you don\'t answer A'
        ],
        correct: 'a',
        bot: 'sadie',
    },
];

const letters = ['a', 'b', 'c', 'd'];
let answers: {[guildId: string]: {
    questions: {[messageId: string]: {
        correct:  'a' | 'b' | 'c' | 'd',
        messageURL: string,
        closed?: boolean,
        answers?: { [userId: string]: {
            answer:  'a' | 'b' | 'c' | 'd',
            timestamp: number,
        } }
    }}
    points?: { [userId: string]: number } 
}} | null = null;
database.child('quiz').on('value', (data) => {
    answers = data.val();
    console.log(answers);
});

const validMoI = (moi: Message | Interaction) => {
    if (moi.guildId !== '620088019868844042') return false;
    return true;
}

addExclamationCommand('quizzes', async (msg) => {
    if (!validMoI(msg)) return;
    const content = quizzes.map(({ question }, i) => `${i}: ${question}`).join('\n');
    msg.reply(content);
})

addExclamationCommand('quiz', async (msg, args) => {
    if (!validMoI(msg)) return;
    msg.delete();
    const selectedQuiz = args[1];
    if (!selectedQuiz.trim() || isNaN(parseInt(selectedQuiz)) || parseInt(selectedQuiz) >= quizzes.length) {
        msg.reply('Please select a valid quiz');
        return
    }
    const quiz = quizzes[parseInt(selectedQuiz)];
    let content = `${quiz.question}\n\`\`\``;
    for (let i = 0; i < quiz.answers.length; i++) {
        content += `\n${letters[i].toUpperCase()}: ${quiz.answers[i]}`;
    }
    content += '\`\`\`';
    const buttons = letters.map((letter) =>
        new MessageButton().setLabel(`${letter.toUpperCase()}`).setCustomId(`answer?choice=${letter}`).setStyle('PRIMARY')
    );
    let message = msg;
    if (quiz.bot) {
        const bot = clients[quiz.bot];
        if (bot) {
            const channel = (await bot.channels.fetch(msg.channelId))
            if (!(channel instanceof TextChannel)) return;
            message = await channel.messages.fetch(msg.id);
        }
    }
    if (!message) return;
    const question = await message.channel.send('Loading...');
    await database.child('quiz').child(msg.guildId!).child('questions').child(question.id).set({
        correct: quiz.correct,
        messageURL: question.url,
    })
    question.edit({
         content,
         components: [
            new MessageActionRow().setComponents(buttons),
         ]
    });
});

addExclamationCommand('endquiz', async (msg, args) => {
    if (!validMoI(msg)) return;
    msg.delete();
    if (!answers) {
        msg.reply({ content: 'The quiz system is starting up, try again in a few seconds' });
        return;
    }
    const quizId = args[1];
    if (!quizId) {
        msg.reply({ content: 'You need to include the message id for the quiz you want to end' })
    }
    for (const [guildId, {questions}] of Object.entries(answers)) {
        if (!questions?.[quizId]) continue;
        const quiz = questions[quizId];
        if (quiz.closed) {
            msg.reply({ content: 'That quiz is already closed' })
            return;
        }

        if (!quiz.answers) {
            return;
        }
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
        }, {} as {
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
        msg.channel.send(`Quiz ${quiz.messageURL} closed!\n# The correct answer was: ${quiz.correct.toUpperCase()}\n\n## Ranking:\n${
            correct.ranking.slice(0, 5).map(({userId, timestamp}, i) => `${userMention(userId)}: +${100 - (i * 10)} points`).join('\n')
        }\n\n## Answers:\n\`\`\`${
            Object.entries(correct.votes).map(([letter, votes]) => `${letter.toUpperCase()}: ${votes} (${Math.floor((votes/totalVotes) * 100)}%)`).join('\n')
        }\`\`\``);
        if (!answers[guildId].points) answers[guildId].points = {};
        for (let i = 0; i < correct.ranking.length  && i < 10; i++) {
            const { userId } = correct.ranking[i];
            answers[guildId].points[userId] = (answers[guildId].points[userId] || 0) + (100 - i * 10);
        }
        database.child('quiz').child(guildId).child('points').set(answers[guildId].points);
        database.child('quiz').child(guildId).child('questions').child(quizId).child('closed').set(true);
        return;
    }
    msg.reply('That quiz doesn\'t exist');
});

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