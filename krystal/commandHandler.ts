import { Message } from "discord.js";
import { testWord } from "../common/functions";
import { killWords } from "../common/variables";
import { absorbing, boxxing, bullshit, burning, crashing, creeping, dead, despacito, drowning, eating, eighteen, flying, greet, gunning, killing, loving, padoru, pattron, pong, prideful, rebel, silencing, sleeping, sparing, spinning, swimming, talking, willRebel, yeeting } from "./functions";

export function testCommands(msg: Message) {
    let args = msg.content;

    if (!!msg.content.match(/ye{2,}t/gi)) yeeting(msg);
    else if (!!msg.content.match(/pf{2,}t/gi)) rebel(msg, true);
    else if (args == '18?') eighteen(msg);
    else if (testWord(args, "krystal", "crystal")) {
        if (willRebel()) rebel(msg, false);
        if (testWord(args, ...killWords)) killing(msg);
        else if (testWord(args, "run", "gun", "book it", "escape")) gunning(msg);
        else if (testWord(args, "sleep", "bed", "clothes", "(I|I'm|I am).+(will|going to|gonna|shall).+(bed|sleep)", "bedtime")) sleeping(msg);
        else if (testWord(args, "padoru")) padoru(msg);
        else if (testWord(args, "absorb")) absorbing(msg);
        else if (testWord(args, "girlfriend", "marry", "date", "love", "gf", "boyfriend", "waifu", "wife")) loving(msg);
        else if (testWord(args, "popcorn", "feed", "hungry")) eating(msg);
        else if (testWord(args, "swim")) swimming(msg);
        else if (testWord(args, "fire", "burn", "this is fine")) burning(msg);
        else if (testWord(args, "(divide by |\/)(0|zero)", "crash", "meaning of life")) crashing(msg);
        else if (testWord(args, "spin", "beyblade")) spinning(msg);
        else if (testWord(args, "pride", "gay", "gae", "gæ", "rainbow", "lgbt")) prideful(msg);
        else if (testWord(args, "fly")) flying(msg);
        else if (testWord(args, "shut up", "dont (speak|talk)", "silence", "lamp")) silencing(msg);
        else if (testWord(args, "box")) boxxing(msg);
        else if (testWord(args, "mannequin", "moe")) creeping(msg);
        else if (testWord(args, "speak", "talk")) talking(msg);
        else if (testWord(args, "drown", "sink")) drowning(msg);
        else if (testWord(args, "despacito")) despacito(msg);
        else if (testWord(args, "not (an|the) enemy", "spare")) sparing(msg);
        else if (testWord(args, "expired", "dead", "died")) dead(msg);
        else if (testWord(args, "support", "patr(e?)on")) pattron(msg);
        else if (testWord(args, "ping")) pong(msg);
        else if (testWord(args, "cow poop", "ox excrement", "bullshit")) bullshit(msg);
        else greet(msg);
    }
}