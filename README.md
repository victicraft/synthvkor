# Script for the Synthesizer V Pro program

for context i coded this on impulse on a friday night until 2am. the software it's intended for doesn't support scripts that use es6 or nodejs. i'm pretty sure it is nausea inducing. whatever. it (kinda) works.

## Initial problem

SynthV doesn't support Korean. It does, however support English, Japanese, Mandarin Chinese and Cantonese Chinese, which together, cover 99% of Korean phonetics. So, to synthesize Korean singing, I started editing manually each note to be in a different language depending on the phonemes needed. Which is long, boring, and most importantly completely insane because I had to teach myself [X-SAMPA](https://en.wikipedia.org/wiki/X-SAMPA), [IPA](https://en.wikipedia.org/wiki/International_Phonetic_Alphabet), [ARPABET](https://en.wikipedia.org/wiki/ARPABET) and [hangeul](https://en.wikipedia.org/wiki/Hangul). So yeah. Automating it sounds like a good idea.

## What the script does

When executed, it selects all notes in the current track, and if any of them contains Korean lyrics written in hangeul, it assigns the closest fitting phonemes to the note. That's it.

## TO-DO

### Possible

- ~~add double batchim to json object (i forgot)~~
- ~~batchim context~~
- ~~palatalization~~
- nasalization
- liquidization

### Impossible???

- change language depending on set of phonemes used (api doesn't expose the attribute "languageOverride" so i don't think i can edit it on the go. someone prove me wrong)
