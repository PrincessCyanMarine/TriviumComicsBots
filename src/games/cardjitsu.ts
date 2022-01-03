import { userMention } from "@discordjs/builders";
import {
  Guild,
  GuildMember,
  Interaction,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js";
import { database, testing } from "..";
import { ray } from "../clients";
import { get_birds, get_powers } from "../common/functions";
import { testChannelId } from "../common/variables";

enum Results {
  WIN,
  LOSE,
  DRAW,
}

enum Elements {
  ICE = "ice",
  FIRE = "fire",
  WATER = "water",
}

const COLOR_CONVERT: { [color: string]: "ORANGE" | "YELLOW" | "RED" | "GREEN" | "PURPLE" | "BLUE" } = {
  orange: "ORANGE",
  yellow: "YELLOW",
  red: "RED",
  green: "GREEN",
  purple: "PURPLE",
  blue: "BLUE",
};

const table: { [element: string]: { [element: string]: Results } } = {
  ice: {
    fire: Results.LOSE,
    water: Results.WIN,
  },
  fire: {
    water: Results.LOSE,
    ice: Results.WIN,
  },
  water: {
    ice: Results.LOSE,
    fire: Results.WIN,
  },
};

class BirdJitsu {
  static games: { [id: string]: BirdJitsu } = {};
  private id: string;
  private points: { element: string; color: string; power: number }[][];
  private decks: string[][] = [];
  private hands: string[][] = [];
  private _can_play = false;
  private _header: string;
  private _round = 0;
  private _result = Results.DRAW;

  private _played: (number | undefined)[] = [];

  constructor(private _message: Message, private _players: GuildMember[], private _guild: Guild) {
    this.id = _players.map((p) => p.id).join("_") + "_" + new Date().valueOf();
    this._header = _players.map((p) => userMention(p.id)).join(" vs ") + "\n";
    this.points = _players.map((p) => []);
    if (this.id in BirdJitsu.games) return;
    BirdJitsu.games[this.id] = this;
    this.hands = [];
    _message.edit({ content: this._header, components: [] });
    for (let i = 0; i < this._players.length; i++)
      database
        .child("card_dojo/decks/" + _guild.id + "/" + _players[i].id)
        .once("value")
        .then((deck) => {
          this.decks[i] = deck.val();
          //   console.log(this.decks[i]);
          if (!this.decks[i]) {
            _message.edit(`${_players[i].displayName} has no deck`);
            delete BirdJitsu.games[this.id];
            return;
          }
          if (i == this._players.length - 1) this.send_cards();
        })
        .catch(console.error);
  }

  private get_points = () =>
    this._players.map((player, i) => {
      let p = this.points[i];
      let embed = new MessageEmbed().setTitle(`${player.displayName}`);
      if (p.length == 0) embed.setDescription("No points");
      else {
        let text = "";
        p.forEach((card) => {
          text += `${card.color} ${card.element}\n`;
        });
        embed.setDescription(text);
      }
      embed.setColor("RANDOM");
      return embed;
    });

  private async send_cards() {
    this._played = this._players.map(() => undefined);
    this.update_message();
    this._can_play = true;
    this._round++;
    for (let i = 0; i < this._players.length; i++) {
      if (!Array.isArray(this.hands[i])) this.hands[i] = [];

      let player = this._players[i];
      while (this.hands[i].length < 5) {
        let card = Math.floor(Math.random() * this.decks[i].length);
        this.hands[i].push(this.decks[i][card] + "");
        this.decks[i].splice(card, 1);
        // console.log(this.hands[i], this.decks[i]);
      }
      let powers = get_powers();
      let birds = get_birds();
      let menu = new MessageSelectMenu().setCustomId(`bj-play?game=${this.id}&player=${i}&round=${this._round}`);
      this.hands[i].forEach((card, i) => {
        let power = powers[parseInt(card)];
        let bird = birds[parseInt(card)];
        menu.addOptions({
          emoji: "🐦",
          label: bird.bird,
          value: i.toString(),
          description: `${power.color} ${power.element} ${power.power}`,
        });
      });
      let dm = await player.createDM();
      dm.sendTyping();
      dm.send({ content: `Choose a card`, components: [new MessageActionRow().addComponents(menu)] });
      await player.deleteDM();
    }
  }

  private update_message() {
    this._message.edit(
      this._header +
        this._players
          .filter((p, i) => !this._played[i])
          .map((player) => `Waiting for ${player.displayName} to make their move`)
          .join("\n")
    );
  }

  private fromHand = (player: string | number, card: string | number) =>
    get_birds()[parseInt(this.hands[parseInt(player.toString())][parseInt(card.toString())])];

  private fromHandPower = (player: string | number, card: string | number) =>
    get_powers()[parseInt(this.hands[parseInt(player.toString())][parseInt(card.toString())])];

  public play(params: { game: string; player: string; round: string }, interaction: SelectMenuInteraction) {
    let player = parseInt(params["player"]);
    let card = parseInt(interaction.values[0]);
    if (this._round != parseInt(params["round"])) {
      interaction.editReply(`That round is already over`);
      return;
    }
    if (this._played[player]) {
      interaction.editReply(`You already played`);
      return;
    }
    this._played[player] = card;
    this.update_message();
    interaction.editReply(`Played \*\*\*${this.fromHand(params["player"], card).bird}\*\*\*`);
    for (const player in this._players) if (!this._played[player]) return;
    // console.log("All players played");
    this._can_play = false;
    this.round();
    this.send_cards();
  }

  private round() {
    this._result = Results.DRAW;
    let powers: { element: string; color: string; power: number }[] = this._players.map((p, i) => this.fromHandPower(i, this._played[i]!));
    let birds = this._players.map((p, i) => this.fromHand(i, this._played[i]!));
    if (powers[0].element == powers[1].element) {
      if (powers[0].power > powers[1].power) this._result = Results.WIN;
      else if (powers[1].power > powers[0].power) this._result = Results.LOSE;
    } else this._result = table[powers[0].element][powers[1].element];

    let win_text = this._result == Results.DRAW ? "It's a draw" : `${this._players[this._result].displayName} won`;

    this._players.forEach((player) => {
      player.send(win_text);
    });

    if (this._result != Results.DRAW) {
      let card = powers[this._result];
      let points = this.points[this._result];

      points.push(card);
    }

    let embeds = [new MessageEmbed().setTitle(`Round ${this._round}`).setDescription(win_text).setColor("RANDOM")];

    this._players.forEach((player, i) => {
      let bird = birds[i];
      let power = powers[i];
      embeds.push(
        new MessageEmbed()
          .setTitle(`${player.displayName}`)
          .setDescription(`Played ${bird.bird}`)
          .addField("Element", power.element)
          .addField("Color", power.color)
          .addField("Strength", power.power.toString())
          .setColor(COLOR_CONVERT[power.color])
      );
    });

    embeds = embeds.concat(this.get_points());

    this._message.edit({ embeds });
    this._played.forEach((p, i) => {
      if (p) this.hands[i].splice(p, 1);
    });
  }

  private win() {
    let i;
    for (i = 0; i <= this._players.length; i++) {
      if (i == this._players.length) return -1;
      let elements: { [element: string]: { [color: string]: number } } = {};
      this.points[i].forEach((point) => {
        if (!(point.element in elements)) elements[point.element] = {};
        if (!(point.color in elements[point.element])) elements[point.element][point.color] = 0;
        elements[point.element][point.color]++;
      });

      console.log(elements);
    }
  }

  get can_play(): boolean {
    return this._can_play;
  }
}

ray.on("interactionCreate", async (interaction) => {
  if (!(interaction.isButton() || interaction.isSelectMenu())) return;
  if (testing && interaction.channelId != testChannelId) return;
  else if (!testing && interaction.channelId == testChannelId) return;

  if (!interaction.customId.startsWith("bj-")) return;
  interaction.customId = interaction.customId.slice(3);
  let command = interaction.customId.split("?")[0];
  let params: { [param: string]: string } = {};
  interaction.customId
    .split("?")[1]
    .split("&")
    .forEach((a) => {
      let c = a.split("=");
      params[c[0]] = c[1];
    });

  // console.log(command, params);

  switch (command) {
    case "start":
      if (!(interaction.message instanceof Message) || !interaction.guild || !interaction.message.member || !interaction.member) return;
      if (params["id"] == interaction.member.user.id) {
        interaction.reply({ ephemeral: true, content: "You can't play against yourself" });
        return;
      }
      let player_1 = await interaction.guild.members.fetch(params["id"]);
      let player_2 = await interaction.guild.members.fetch(interaction.member.user.id);
      if (!(player_1 && player_2)) return;
      new BirdJitsu(interaction.message, [player_1, player_2], interaction.guild);
      break;
    case "play":
      if (!params_for_play(params)) return;
      if (!(interaction instanceof SelectMenuInteraction)) return;
      if (!(params["game"] in BirdJitsu.games)) {
        interaction.reply("Sorry, I don't remember that game");
        return;
      }
      let game = BirdJitsu.games[params["game"]];
      if (!game.can_play) {
        interaction.reply("Sorry, I can't do that right now");
        return;
      }
      await interaction.deferReply();
      game.play(params, interaction);
      break;
  }
});

const params_for_play = (params: any): params is { game: string; player: string; round: string } =>
  "player" in params &&
  typeof params["player"] == "string" &&
  "game" in params &&
  typeof params["game"] == "string" &&
  "round" in params &&
  typeof params["round"] == "string";
