# TriviumComicsBots
This is the repository for the code of the bots from [Trivium comics' official discord server](https://discord.com/invite/sF6Hupjf8S)

**Rewrite not finished, expect bugs**

> I don't know why you would do that, but you are free to use this for your own bots if you want to. You can even modify it!
> 
> In that case, I just ask that you at least link to this repository and use the same license (what also means making it open source so be careful with tokens and stuff).


# Enviroment Variables
Create a file called `.env` at the root of the project and fill the following values accordingly

## REQUIRED
```
# [BOT TOKENS]
BOT_CERBY_TOKEN
BOT_D20_TOKEN
BOT_ELI_TOKEN
BOT_KRYSTAL_TOKEN
BOT_RAY_TOKEN
BOT_SADIE_TOKEN
BOT_SIEG_TOKEN
BOT_ODOD_TOKEN

# [FIREBASE]
DATABASE_URL
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
FIREBASE_PROJECT_ID


# [WEBHOOKS] (You can set just WEBHOOK_TESTING_CHANNEL and WEBHOOK_LOGS_CHANNEL as long as TESTING is "true" but its easier to just do all 4 even if they are all the same value)
WEBHOOK_ALERT_CHANNEL
WEBHOOK_TESTING_CHANNEL
WEBHOOK_LOGGING_CHANNEL
WEBHOOK_LOGS_CHANNEL
```

## Optional
```
TESTING (defaults to false if the value is not exactly equal to "true")
```

### (Certain values on the `variables.ts` file also need to be redefined (big oversight on my part))


# Commands
The command system is currently being rewritten, for commands implemented under the new system, check [this list](https://github.com/PrincessCyanMarine/TriviumComicsBots/blob/master/commands.md)


# (OLD LIST)
## Krystal commands (in order of priority)
- Yeet
- Pfft (won't rebel to it)
- 18?
- [Unalive][Unalive]
- Run
- Sleep
- Absorb
- Love
- Popcorn
- Swim
- Fire
- Crash
- Spin
- Pride
- Fly
- Lamp (without silencing)
- Box (Only without the lamp)
- Moe
- Talk
- Drown
- Despacito
- [Spare][Spare]
- Expired
- Support
- Ping
- Cow poopy
- Greeting
- *Rebel*
#### Slash commands
- Whisper

## Sadie commands (in order of priority)
- Waifu
- Weeb
- Punch
- DM
- Kick
- Tsundere (like/love)
- Greeting

## Ray commands
- [Roll][Roll]

## Eli commands
- [Guild][Guild]

## D20 commands
- *Message counter*
- Card
- Card customizer
- Prestige
#### Slash commands
- Ban
- Kick
- Prestige
- Card
- Help
- [Warn][Warn]
- [Warnings][Warnings]

## Commands with no specific bot
- Profile
- Roll


# Author
Made by [CyanMarine](https://cyanmarine.net "My website")

Discord: CyanMarine#2627

Reddit: [u/CyanMarine](https://www.reddit.com/user/CyanMarine "Reddit")

Github: [@PrincessCyanMarine](https://github.com/PrincessCyanMarine "Here!")


# Copyright
Copyright (C) 2021 CyanMarine

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.





[spare]: https://github.com/PrincessCyanMarine/TriviumComicsBotsTypeScript/wiki/Spare "Open on wiki"

[unalive]: https://github.com/PrincessCyanMarine/TriviumComicsBotsTypeScript/wiki/Unalive "Open on wiki"

[guild]: https://github.com/PrincessCyanMarine/TriviumComicsBotsTypeScript/wiki/Guild "Open on wiki"

[roll]: https://github.com/PrincessCyanMarine/TriviumComicsBotsTypeScript/wiki/Roll "Open on wiki"

[warn]: https://github.com/PrincessCyanMarine/TriviumComicsBotsTypeScript/wiki/Warn "Open on wiki"
[warnings]: https://github.com/PrincessCyanMarine/TriviumComicsBotsTypeScript/wiki/Warnings "Open on wiki"
