export const command_list = {
    "Krystal": [
        "Yeet",
        "Pfft",
        "18",
        "Unalive",
        "Run",
        "Sleep",
        "Absorb",
        "Love",
        "Popcorn",
        "Swim",
        "Fire",
        "Crash",
        "Spin",
        "Pride",
        "Fly",
        "Lamp",
        "Box",
        "Moe",
        "Talk",
        "Drown",
        "Despacito",
        "Spare",
        "Expired",
        "Support",
        "Ping",
        "Cow poopy",
        "Greeting",
        "Rebel",
        "Whisper"
    ],
    "sadie": [
        "Waifu",
        "Weeb",
        "Punch",
        "DM",
        "Kick",
        "Tsundere",
        "Greeting"
    ],
    "d20": [
        "Card",
        "Card customizer",
        "Prestige",
        "Ban",
        "Kick",
        "Help"
    ],
    "multiple": [
        "Profile"
    ]
};

export const command_list_string = new RegExp('(' + command_list.Krystal.join(')|(') + '|' + command_list.sadie.join(')|(') + ')|(' + command_list.d20.join(')|(') + ')|(' + command_list.multiple.join(')|(') + ')', 'i');