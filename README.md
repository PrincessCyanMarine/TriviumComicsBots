# TriviumComicsBots
This is the repository for the code of the bots from [Trivium comics' official discord server](https://discord.com/invite/sF6Hupjf8S)

**Rewrite not finished, expect bugs**

> I don't know why you would do that, but you are free to use this for your own bots if you want to. You can even modify it!
> 
> In that case, I just ask that you at least link to this repository and use the same license (what also means making it open source so be careful with tokens and stuff).

# How to run the bots
Assuming you are on Windows because if you are on Linux you don't need this tutorial
## Step 1: Download and install VSCode (you can use other text editors, but I'm going to assume you are using VSCode for this "tutorial")
[https://code.visualstudio.com/](https://code.visualstudio.com/)

## Step 2: Download and install GIT
[https://git-scm.com/downloads](https://git-scm.com/downloads)

## Step 3: Download and install Node.JS
~~[https://nodejs.org/en](https://nodejs.org/en)~~

Install nvm
[https://github.com/nvm-sh/nvm](https://github.com/nvm-sh/nvm)

Then run `nvm install 16` on a terminal
This will install de nodejs version used to run the bots

I'd also recommend already running
```
nvm use 16
npm i -g typescript nodemon pm2
```
since that will be needed for when you actually start the bots up

## Step 4: Clone the repository using GIT
- Using windows explorer, open the folder where you want the bots' folder to go (try to avoid spaces on the file path)
- Click on the empty space on the file path, something like this ↓ should happen
  - ![image](https://github.com/user-attachments/assets/642f63b0-dfa0-4df7-ac1a-c05f5a7dbf8c)
- Type "cmd" and press enter
- Copy and paste the commands bellow on the command prompt that has appeared (you may need to press enter for the last one to run)
```bash
git clone https://github.com/PrincessCyanMarine/TriviumComicsBots.git
cd TriviumComicsBots
npm i
touch .env

```
- Wait
- Open the folder `TriviumComicBots`
- 
## Step 5: create 1-8 discord bots (yes 8 (you can have just 1 do the functions for all of the bots no problem, just use the same token for all of the bots on the .env))
[https://discordjs.guide/preparations/setting-up-a-bot-application.html](https://discordjs.guide/preparations/setting-up-a-bot-application.html)
Then paste their TOKENS on the `.env` file using the names shown under `# [BOT TOKENS]` on the [`required enviroment variables` section of this page](https://github.com/PrincessCyanMarine/TriviumComicsBots/tree/master?tab=readme-ov-file#required) like `BOT_NAME_TOKEN=TOKEN_YOU_GOT_FROM_THE_DISCORD_JS_GUIDE`

# (to be completed)
## Step 6: Create a firebase account and fill the values on the .env file
## Step 7: Create 1-4 Discord webhooks and fill the values on the .env file

# Enviroment Variables
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

## Running
On a terminal, type
```bash
nvm use 16
tsc
pm2 start ecosystem.config.js
```
This will build and run the bots for production/testing

### Tho, for development my suggested approach is:

Run
```bash
nvm use 16
npm i -g nodemon typescript
tsc -w
```
in a terminal and
```bash
nvm use 16
nodemon .
```
in another

# How to use the (incomplete) `New Command System™`
This system was heavily inspired by Minecraft Datapack system

So if you already know how Datapacks work, you are going to have an easy time with this

- Go to the `data` folder
- Create, or open a folder with the name of the bot you want to add a command for
- Inside that, create a file ending on `.botmeta`\*. That file may be placed inside a folder (look at Krystal's data folder for examples)
`.botmeta` files can represent commands or activators
### Commands
They define actions to be taken by the bots such as sending messages/images or even choosing a random command to call next

Commands follow the following general structure
```json
{
  "dataType": "command";
  "name": string;
  "description": string;
  "bot": "sadie" | "krystal" | "ray" | "eli" | "cerberus" | "siegfried" | "d20";
  "type": "string" | "boolean" | "function" | "command" | "message" | "array" | "conditional" | "get-variable" | "percentage" | "targeted" | "sequence" | "random" | "random-weighted" | "set-variable"
}
```
Tho for more detailed information about the structure of a command, please check the CommandType typescript type defined on `src/model/botData.ts`

### Activators
They call commands upon specific actions such as a message being sent on a server or a discord slash command being used

Activators follow the following general structure
```json
{
  "dataType": "activator";
  "name": string;
  "description": string;
  "bot": "sadie" | "krystal" | "ray" | "eli" | "cerberus" | "siegfried" | "d20";
  "method": "slash" | "message" | "reaction" | "exclamation"
  "type": "command"
}
```
Tho for more detailed information about the structure of a command, please check the CommandType typescript type defined on `src/model/botData.ts`

\*This `.botmeta` file is basically just a renamed `.json` so the structure is the same

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
