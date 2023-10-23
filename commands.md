
# "Message commands" use regex

- /.*/ Matches anything
- /end.+?suffering/ "end (anything) suffering"
- /pf{2,}t/ "p", followed by 2 or more "f"s followed by "t" (for example "pfffffft", "pfft", "pffffffffffffffffffffffffffffffffffffffffft", etc)
- /(I|Im|I am)s(will|going to|gonna|shall)s(bed|sleep)/ "I am going to bed", "I'm gonna sleep", "I will bed", etc
- /(S+?)s tip of the day/ A word followed by "tip of the day"






# 18? (krystal)
18?

Version: 1.0.0

Priority: 30

Activator type: message

Command: /.*/



# tip (krystal)
Krystal thanks the user for their tip of the day

Version: 1.0.0

Priority: 20

Activator type: message

Command: /(\S+?)s tip of the day/



# pfft (krystal)
PFFFFFFFFFFFFFFFFFFT

Version: 1.0.0

Priority: 10

Activator type: message

Command: /pf{2,}t/



# rebel (krystal)
Krystal has a 5% chance to rebel against some commands

Version: 1.0.0

Priority: 10

Activator type: message

Command: /.*/



# yeet (krystal)
This command has not yet been implemented under the new system

Version: 1.0.0

Priority: 10

Activator type: deactivated



# dumbass (krystal)
Has a 10% chance of pinging <@601943025253482496> every time "dumbass" is said

Version: 1.0.0

Priority: 5

Activator type: message

Command: /dumbass/



# my-xp (d20)
Shows your XP

Version: 1.0.0

Priority: 0

Activator type: slash

Command: /my-xp



# remove-cache (d20)
Removes cached avatars for the user

Version: 1.0.0

Priority: 0

Activator type: slash

Command: /remove-cache



# absorb (krystal)
Krystal is become Kirby, destroyer of worlds.

Version: 1.0.0

Priority: 0

Activator type: message

Command: any of
- /absorb/

Must include bot name (krystal)



# arson (krystal)
Krystal commits arson

Version: 1.0.0

Priority: 0

Activator type: message

Command: /arson/



# burn (krystal)
Krystal will burn the world down.

Version: 1.0.0

Priority: 0

Activator type: message

Command: any of
- /fire/
- /burn/
- /this is fine/

Must include bot name (krystal)



# cow-poopy (krystal)
Cow poopy

Version: 1.0.0

Priority: 0

Activator type: message

Command: any of
- /cow poop(y?)/
- /ox excrement/
- /bullshit/



# eat (krystal)
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



# eat_1 (krystal)
No description

Version: 1.0.0

Priority: 0

Activator type: message

Command: /(I|Im|I am|(I (will|((am|m)\s(going\sto|gonna))|shall)))\s(hungry|eat)/



# image-test (krystal)
A command made to test image generation.

Version: 1.0.0

Priority: 0

Activator type: exclamation

Command: !image



# kill (krystal)
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



# princess (krystal)
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



# run (krystal)
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



# sleep_1 (krystal)
Krystal puts you to sleep.

Version: 1.0.0

Priority: 0

Activator type: message

Command: /(I|Im|I am)\s(will|going to|gonna|shall)\s(bed|sleep)/



# sleep (krystal)
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



# spare (krystal)
Ask Krystal to spare an unattractive weeb

Version: 1.0.0

Priority: 0

Activator type: message

Command: any of
- /not (an|the) enemy/
- /spare/

Must include bot name (krystal)



# swim (krystal)
No description

Version: 1.0.0

Priority: 0

Activator type: message

Command: /swim/



# shop (sadie)
Show items for sale

Version: 1.0.0

Priority: 0

Activator type: slash

Command: /shop



