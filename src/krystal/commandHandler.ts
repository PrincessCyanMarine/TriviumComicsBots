import { userMention } from "@discordjs/builders";
import { Message } from "discord.js";
import { krystal } from "../clients";
import { getTarget, randomchance, say, testWord } from "../common/functions";
import { killWords } from "../common/variables";
import { absorbing, boxxing, bullshit, burning, crashing, creeping, dead, despacito, drowning, eating, eighteen, flying, greet, gunning, killing, loving, nonowords, pattron, pong, prideful, rebel, silencedbox, silencing, sleeping, sparing, spinning, swimming, talking, willRebel, yeeting } from "./functions";

export function testCommands(msg: Message) {
    let args = msg.content;

    if (testWord(args, "dumbass") && randomchance(5)) say(krystal, msg.channel, userMention("601943025253482496"));
    else if (testWord(args, "ye{2,}t")) yeeting(msg);
    else if (testWord(args, "pf{2,}t")) rebel(msg, true);
    else if (args == '18?') eighteen(msg);
    else if (testWord(args, "(I|Im|I am)\\s(will|going to|gonna|shall)\\s(bed|sleep)")) sleeping(msg, msg.author);
    else if (testWord(args, "(I|Im|I am|(I (will|((am|m)\\s(going\\sto|gonna))|shall)))\\s(hungry|eat)")) eating(msg, msg.author);
    else if (testWord(args, "cow poop(y?)", "ox excrement", "bullshit")) bullshit(msg);
    else if (testWord(args, "krystal")) {
        msg.channel.sendTyping();
        if (willRebel()) rebel(msg, false);
        else if (testWord(args, "run", "gun", "book it", "escape")) gunning(msg);
        else if (testWord(args, "sleep", "bed", "clothes", "bedtime")) sleeping(msg);
        else if (testWord(args, "absorb")) absorbing(msg);
        else if (testWord(args, "girlfriend", "marry", "date", "love", "gf", "boyfriend", "waifu", "wife")) loving(msg);
        else if (testWord(args, "popcorn", "feed", "hungry", "eat")) eating(msg);
        else if (testWord(args, "swim")) swimming(msg);
        else if (testWord(args, "fire", "burn", "this is fine")) burning(msg);
        else if (testWord(args, "(divide by |\\S*\/\\s?)(0|zero)", "crash", "meaning of life")) crashing(msg);
        else if (testWord(args, "spin", "beyblade")) spinning(msg);
        else if (testWord(args, "pride", "gay", "gae", "gæ", "rainbow", "lgbt")) prideful(msg);
        else if (testWord(args, "fly")) flying(msg);
        else if (testWord(args, "silence") && msg.mentions.members?.first()) { if (randomchance(50)) killing(msg); else silencing(msg); }
        else if (testWord(args, "box") && testWord(args, "shut up", "dont (speak|talk)", "silence", "lamp")) silencedbox(msg);
        else if (testWord(args, "shut up", "dont (speak|talk)", "silence", "lamp")) silencing(msg);
        else if (testWord(args, "box")) boxxing(msg);
        else if (testWord(args, ...killWords)) killing(msg);
        else if (testWord(args, "mannequin", "moe")) creeping(msg);
        else if (testWord(args, "speak", "talk")) talking(msg);
        else if (testWord(args, "drown", "sink")) drowning(msg);
        else if (testWord(args, "despacito")) despacito(msg);
        else if (testWord(args, "not (an|the) enemy", "spare")) sparing(msg);
        else if (testWord(args, "expired", "dead", "died")) dead(msg);
        else if (testWord(args, "support", "patr(e?)on")) pattron(msg);
        else if (testWord(args, "rebel")) rebel(msg, true);
        else if (testWord(args, "ping")) pong(msg);
        else greet(msg);
    } else
        nonowords(msg);
}