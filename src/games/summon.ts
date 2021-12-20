import { hyperlink, userMention } from "@discordjs/builders";
import { ButtonInteraction, GuildMember, Message, MessageActionRow, MessageAttachment, MessageButton, Role } from "discord.js";
import { readFileSync, writeFileSync } from "fs";
import got from "got/dist/source";
import { database } from "..";
import { glitch } from "../attachments";
import { krystal, sadie } from "../clients";
import { random_from_array, say } from "../common/functions";
import { marineId, triviumGuildId } from "../common/variables";
import { burning, killing } from "../krystal/functions";

enum SUMMON_TARGETS {
  SWITCH = "491029828955537418",
  POLISHFOX = "450211081869066250",
  CAFFY = "687830651407564810",
  PC = "763194172202024980",
  TD = "299874082835529729",
  ACCHAN = "852639258690191370",
  XBOX = "171294034290016276",
}

export async function summon(msg: Message, options: string[]) {
  let summoned_creature = Math.floor(Math.random() * 21);
  if (options[1] && !isNaN(parseInt(options[1]))) summoned_creature = msg.author.id == marineId ? parseInt(options[1]) : 0;
  if (summoned_creature == 0) {
    say(sadie, msg.channel, "no");
    return;
  }
  await say(
    sadie,
    msg.channel,
    { content: "*You draw a magic circle on the ground…*", files: [new MessageAttachment(`./assets/ray/roll/${summoned_creature}.gif`, "Roll.gif")] },
    500
  );
  switch (summoned_creature) {
    case 1:
      say(
        sadie,
        msg.channel,
        'A telephone appears! It starts ringing…\nYou answer the phone. "We\'ve been trying to reach you about your vehicle’s extended warranty. Press one—"\nYou hang up the phone.',
        450
      );
      break;
    case 2:
      say(sadie, msg.channel, "You call that a ritual?", 250);
      break;
    case 3:
      say(sadie, msg.channel, "Your circle glows...\nAnd you fail miserably", 250);
      break;
    case 4:
      say(sadie, msg.channel, "Denied.", 250);
      break;
    case 5:
      await say(sadie, msg.channel, "🪑\nYou summoned... A chair?", 250);
      await say(krystal, msg.channel, { files: [await burning(undefined)] }, 250);
      await say(sadie, msg.channel, "And there it goes...", 250);
      break;
    case 6:
    case 7:
      summoned_creature = 6;
      say(sadie, msg.channel, "You fail!", 250);
      break;
    case 8:
    case 9:
      summoned_creature = 8;
      say(sadie, msg.channel, "*Crickets.*", 250);
      break;
    case 10:
    case 11:
      summoned_creature = 10;
      say(sadie, msg.channel, "Your cryptic chanting echoes unheard.", 250);
      break;
    case 12:
      say(
        sadie,
        msg.channel,
        "The fabric of the universe peels away for just a brief moment, summoning...\n\nA voidfish.\n\nIt hisses angrily at you, before blinking out of existence.",
        250
      );
      break;
    case 13:
      say(sadie, msg.channel, "It's a bird! It's a plane! It's—no it's just a plane.", 250);
      break;
    case 14:
      let mentioned = msg.mentions.members?.first()?.id;
      if (!mentioned)
        if (msg.guild?.id == triviumGuildId) mentioned = random_from_array(Object.values(SUMMON_TARGETS));
        else mentioned = msg.author.id;
      if (mentioned == msg.author.id)
        await say(
          sadie,
          msg.channel,
          "A wild " + userMention(mentioned) + " appears!\n\nWait did you just summon yourself? Is that even possible?",
          250
        );
      else await say(sadie, msg.channel, "A wild " + userMention(mentioned) + " appears!", 250);
      if (mentioned == SUMMON_TARGETS.SWITCH)
        await say(krystal, msg.channel, {
          files: [await killing(undefined, msg.author, undefined, undefined)],
          content: "We don't have permission to use Merry's art",
        });
      break;
    case 15:
      say(sadie, msg.channel, "You summoned a bird. It's not a dodo", 300);
      break;
    case 16:
    case 17:
      summoned_creature = 16;
      let bird_list: string[] = readFileSync("./birdlist.txt", "utf-8").split("\n");
      let b = Math.floor(Math.random() * bird_list.length);
      let bird = bird_list[b].match(/(?<bird>.+?) \(url: (?<url>https:\/\/en.wikipedia.org\/wiki\/.+?)\)/);
      if (!(bird?.groups && bird.groups.bird && bird.groups.url)) return;
      say(
        sadie,
        msg.channel,
        {
          content: "You summoned " + (bird.groups.bird.match(/^[aeiou]/i) ? "an " : "a ") + bird.groups.bird + "!",
          components: [
            new MessageActionRow().addComponents(
              new MessageButton().setLabel(bird.groups.bird).setStyle("LINK").setURL(bird.groups.url).setEmoji("🐦")
            ),
          ],
        },
        300
      );
      let birdpedia = database.child("birdpedia/" + msg.author.id + "/" + b);
      let bd = parseInt((await birdpedia.once("value")).val()) || 0;
      birdpedia.set(bd + 1);
      break;
    case 18:
      say(sadie, msg.channel, "You summoned a literal dodo. Aren’t they extinct?", 300);
      break;
    case 19:
      let moderators: string[] | undefined = (await msg.guild?.members.fetch())
        ?.filter((m) => !m.user.bot && m.permissions.has("KICK_MEMBERS") && !["297531251081084941", "238481145329745920"].includes(m.id))
        .map((m) => userMention(m.id));
      if (!moderators) moderators = ["[INSERT QUEENSBLADE]"];
      say(sadie, msg.channel, "You summoned a servant of Dodo!\nA wild " + random_from_array(moderators) + " appears!");
      break;
    case 20:
      random_from_array([
        async () => {
          await say(sadie, msg.channel, "You step on a poisoned lego and die before seeing what you summoned! :GMSadieTheSadist:");
        },
        async () => {
          await say(sadie, msg.channel, "A wild Ray appears!");
        },
        async () => {
          await say(sadie, msg.channel, "A wild Krystal appears!");
          await say(krystal, msg.channel, { content: "W̸̡̡̺̠̝̎̆ě̶̲́̒͒l̴̮̰̝͑́͛c̶̼̔́̿̆o̷̜̠̙̭͛͗̀͗ͅm̶̭͚̌e̵̤͕͗̒ ̸͉̺̻̔͐̉̂͐̉t̸̹͖̘̻̞́o̴̗̽͆ ̵̢̛͓̻̩̩̮̅t̴̬̯̲̍̏͗h̷̝̎͛é̷̯̤̤͗̑ ̷̡͉̙̱̲̿̓g̴͕͍͔̣̊́̀̾͝a̴̱̭͒͝m̷̢͕̜͗ȩ̶̹̈́̾̈͌ ̵̤̩̹̍͝o̷̺̎f̵̯̌͑̈́̚ ̸̡͓̞̯̩̃̏̿̚l̵̰̮̱̿́i̷͙̫̩͙̔́̀̄̕f̵̖͔̜́̾͋͘͝e̵͉͓̾̕͜!̵̛̥̓̀́͐̈́", files: [glitch] }, 250);
        },
        async () => {
          await say(sadie, msg.channel, "A wild Sadie appears!\n\nWait that's me");
        },
        async () => {
          await say(sadie, msg.channel, "A wild Eli appears!");
        },
        async () => {
          await say(sadie, msg.channel, "You summoned " + userMention("297531251081084941") + "!");
        },
      ])();
      break;
  }
  let db = database.child("summons/" + msg.guild?.id + "/" + msg.author.id + "/" + summoned_creature);
  let a = parseInt((await db.once("value")).val()) || 0;
  db.set(a + 1);
}
