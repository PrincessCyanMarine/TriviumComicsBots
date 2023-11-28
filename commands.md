
# "Message commands" use regex

- /.*/ Matches anything
- /end.+?suffering/ "end (anything) suffering"
- /pf{2,}t/ "p", followed by 2 or more "f"s followed by "t" (for example "pfffffft", "pfft", "pffffffffffffffffffffffffffffffffffffffffft", etc)
- /(I|Im|I am)s(will|going to|gonna|shall)s(bed|sleep)/ "I am going to bed", "I'm gonna sleep", "I will bed", etc
- /(S+?)s tip of the day/ A word followed by "tip of the day"






# [18? (krystal)](/commands/krystal/18%253F.md)

18?

Version: 1.0.0

Priority: 30

Activator type: message

Command: /.*/

link: [/commands/krystal/18%253F.md](/commands/krystal/18%253F.md)



# [tip (krystal)](/commands/krystal/tip.md)

Krystal thanks the user for their tip of the day

Version: 1.0.0

Priority: 20

Activator type: message

Command: /(\S+?)s tip of the day/

link: [/commands/krystal/tip.md](/commands/krystal/tip.md)



# [pfft (krystal)](/commands/krystal/pfft.md)

PFFFFFFFFFFFFFFFFFFT

Version: 1.0.0

Priority: 10

Activator type: message

Command: /pf{2,}t/

link: [/commands/krystal/pfft.md](/commands/krystal/pfft.md)



# [rebel (krystal)](/commands/krystal/rebel.md)

Krystal has a 5% chance to rebel against some commands

Version: 1.0.0

Priority: 10

Activator type: message

Command: /.*/

link: [/commands/krystal/rebel.md](/commands/krystal/rebel.md)



# [yeet (krystal)](/commands/krystal/yeet.md)

This command has not yet been implemented under the new system

Version: 1.0.0

Priority: 10

Activator type: message

Command: /ye{2,}t/

link: [/commands/krystal/yeet.md](/commands/krystal/yeet.md)



# [dumbass (krystal)](/commands/krystal/dumbass.md)

Has a 10% chance of pinging <@601943025253482496> every time "dumbass" is said

Version: 1.0.0

Priority: 5

Activator type: message

Command: /dumbass/

link: [/commands/krystal/dumbass.md](/commands/krystal/dumbass.md)



# [my-xp (d20)](/commands/d20/my-xp.md)

Shows your XP

Version: 1.0.0

Priority: 0

Activator type: slash

Command: /my-xp

link: [/commands/d20/my-xp.md](/commands/d20/my-xp.md)



# [remove-cache (d20)](/commands/d20/remove-cache.md)

Removes cached avatars for the user

Version: 1.0.0

Priority: 0

Activator type: slash

Command: /remove-cache

link: [/commands/d20/remove-cache.md](/commands/d20/remove-cache.md)



# [help (d20)](/commands/d20/help.md)

See a list of bot commands and their descriptions (only for commands using the new system)

Version: 1.0.0

Priority: 0

Activator type: slash

Command: /help



## Options:

### command

Type: string

What command do you want more info about?

<details>

<summary>Accepted values</summary> 

- shop (sadie)
- 18? (krystal)
- absorb (krystal)
- arson (krystal)
- burn (krystal)
- cow-poopy (krystal)
- dumbass (krystal)
- eat (krystal)
- eat_1 (krystal)
- image-test (krystal)
- kill (krystal)
- princess (krystal)
- pfft (krystal)
- rebel (krystal)
- run (krystal)
- sleep_1 (krystal)
- sleep (krystal)
- spare (krystal)
- swim (krystal)
- tip (krystal)
- yeet (krystal)
- my-xp (d20)
- remove-cache (d20)
- help (d20)
- help (d20)


</details>

link: [/commands/d20/help.md](/commands/d20/help.md)



# [absorb (krystal)](/commands/krystal/absorb.md)

Krystal is become Kirby, destroyer of worlds.

Version: 1.0.0

Priority: 0

Activator type: message

Command: any of
- /absorbs?/
- /suck/

Must include bot name (krystal)

link: [/commands/krystal/absorb.md](/commands/krystal/absorb.md)



# [arson (krystal)](/commands/krystal/arson.md)

Krystal commits arson

Version: 1.0.0

Priority: 0

Activator type: message

Command: /arson/

link: [/commands/krystal/arson.md](/commands/krystal/arson.md)



# [burn (krystal)](/commands/krystal/burn.md)

Krystal will burn the world down.

Version: 1.0.0

Priority: 0

Activator type: message

Command: any of
- /fire/
- /burn/
- /this is fine/

Must include bot name (krystal)

link: [/commands/krystal/burn.md](/commands/krystal/burn.md)



# [cow-poopy (krystal)](/commands/krystal/cow-poopy.md)

Cow poopy

Version: 1.0.0

Priority: 0

Activator type: message

Command: any of
- /cow poop(y?)/
- /ox excrement/
- /bullshit/

link: [/commands/krystal/cow-poopy.md](/commands/krystal/cow-poopy.md)



# [eat (krystal)](/commands/krystal/eat.md)

No description

Version: 1.0.0

Priority: 0

Activator type: message

Command: any of
- /popcorn/
- /feed/
- /hungry/
- /eat/

Must include bot name (krystal)

link: [/commands/krystal/eat.md](/commands/krystal/eat.md)



# [eat_1 (krystal)](/commands/krystal/eat_1.md)

No description

Version: 1.0.0

Priority: 0

Activator type: message

Command: /(I|Im|I am|(I (will|((am|m)\s(going\sto|gonna))|shall)))\s(hungry|eat)/

link: [/commands/krystal/eat_1.md](/commands/krystal/eat_1.md)



# [image-test (krystal)](/commands/krystal/image-test.md)

A command made to test image generation.

Version: 1.0.0

Priority: 0

Activator type: exclamation

Command: !image

link: [/commands/krystal/image-test.md](/commands/krystal/image-test.md)



# [kill (krystal)](/commands/krystal/kill.md)

Ask Krystal to commit an unaliving

Version: 1.0.0

Priority: 0

Activator type: message

Command: any of
- /kill/
- /beat/
- /punch/
- /heal/
- /shoot/
- /attack/
- /unalive/
- /protect/
- /exterminate/
- /end.+?suffering/
- /silence/

Must include bot name (krystal)

link: [/commands/krystal/kill.md](/commands/krystal/kill.md)



# [princess (krystal)](/commands/krystal/princess.md)

Krystal is not your girlfriend.

Version: 1.0.0

Priority: 0

Activator type: message

Command: any of
- /girlfriend/
- /marry/
- /date/
- /love/
- /gf/
- /boyfriend/
- /waifu/
- /wife/

Must include bot name (krystal)

link: [/commands/krystal/princess.md](/commands/krystal/princess.md)



# [run (krystal)](/commands/krystal/run.md)

Was that "run" or "gun"?

Version: 1.0.0

Priority: 0

Activator type: message

Command: any of
- /run/
- /gun/
- /book it/
- /escape/

Must include bot name (krystal)

link: [/commands/krystal/run.md](/commands/krystal/run.md)



# [sleep_1 (krystal)](/commands/krystal/sleep_1.md)

Krystal puts you to sleep.

Version: 1.0.0

Priority: 0

Activator type: message

Command: /(I|Im|I am)\s(will|going to|gonna|shall)\s(bed|sleep)/

link: [/commands/krystal/sleep_1.md](/commands/krystal/sleep_1.md)



# [sleep (krystal)](/commands/krystal/sleep.md)

Krystal puts a player to sleep.

Version: 1.0.0

Priority: 0

Activator type: message

Command: any of
- /sleep/
- /bed/
- /clothes/
- /bedtime/

Must include bot name (krystal)

link: [/commands/krystal/sleep.md](/commands/krystal/sleep.md)



# [spare (krystal)](/commands/krystal/spare.md)

Ask Krystal to spare an unattractive weeb

Version: 1.0.0

Priority: 0

Activator type: message

Command: any of
- /not (an|the) enemy/
- /spare/

Must include bot name (krystal)

link: [/commands/krystal/spare.md](/commands/krystal/spare.md)



# [swim (krystal)](/commands/krystal/swim.md)

No description

Version: 1.0.0

Priority: 0

Activator type: message

Command: /swim/

link: [/commands/krystal/swim.md](/commands/krystal/swim.md)



# [shop (sadie)](/commands/sadie/shop.md)

Show items for sale

Version: 1.0.0

Priority: 0

Activator type: slash

Command: /shop

link: [/commands/sadie/shop.md](/commands/sadie/shop.md)



