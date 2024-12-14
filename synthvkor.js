// ---------------------- actual synthv stuff!!!!!! ---------------------- 

function getClientInfo() {
    return {
        name: "synthvkor",
        category: "Scripting",
        author: "Victicraft",
        versionNumber: 1,
        minEditorVersion: 65537
    };
}

function main() {

    var mainEditor = SV.getMainEditor();
    var currentTrack = mainEditor.getCurrentTrack();


    var noteGroupReferences = new Array();
    var noteGroups = new Array();
    var numOfGroups = currentTrack.getNumGroups();

    var numOfNotes;
    var currentNote;

    var entireLyrics = '';

    for (i = 0; i < numOfGroups; i++) {

        noteGroupReferences[i] = currentTrack.getGroupReference(i);
        noteGroups[i] = noteGroupReferences[i].getTarget();

        numOfNotes = noteGroups[i].getNumNotes();

        for (j = 0; j < numOfNotes; j++) {
            currentNote = noteGroups[i].getNote(j);

            var lyrics = currentNote.getLyrics();
            lyrics = lyrics.trim();
            if (lyrics) {

                if (/^[a-zA-Z+\-']+$/.test(lyrics)) {

                    if (entireLyrics && !entireLyrics.endsWith(' ')) {
                        entireLyrics += ' ';
                    }
                    entireLyrics += lyrics;
                } else if (/^[\uAC00-\uD7A3]+$/.test(lyrics)) {
                    if (/^[a-zA-Z+\-']+$/.test(entireLyrics.slice(-1)))
                        entireLyrics += ' ';

                    entireLyrics += lyrics;
                }
                else {

                    entireLyrics += lyrics;
                }
            }
        }

        entireLyrics = entireLyrics.trim();

        const phonemeData = getAllPhonemes(entireLyrics);

        for (j = 0; j < numOfNotes; j++) {
            currentNote = noteGroups[i].getNote(j);

            const phoneme = phonemeData[j];  // Get the phoneme corresponding to the note's index
            // Skip the note if the phoneme is null
            if (phoneme) {
                currentNote.setPhonemes(phoneme.phoneme); // Apply the phoneme to the note
            }

        }
    }

    SV.showMessageBox("Success", "Phonemes assigned to all notes!");
}


// ---------------------- the horrors (i wish synthv allowed me to split that in multiple files. save me) ---------------------- 

// borrowed this from https://github.com/stannam/hangul_to_ipa and adapted it into javascript. 
// (kinda. theirs is much better but does ipa and not synthv phonemes)

var GA_CODE = 44032;
var ONSET = 588;
var CODA = 28;
// ONSET LIST. 00 -- 18
var ONSET_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
// VOWEL LIST. 00 -- 20
var VOWEL_LIST = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
// CODA LIST. 00 -- 27 + 1 (0 for open syllable)
var CODA_LIST = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

function hangeulToJamos(hangeul) {
    var syllables = [];
    var regexKorean = /[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF]/g;
    var words = hangeul.split(" ");
    words.forEach(function (word) {
        if (word.match(regexKorean)) {
            var jamos_1 = word.split('');
            jamos_1.forEach(function (jamo) {
                syllables.push(jamo);
            });
        }
        else {
            syllables.push(word);
        }
    });
    var jamos = [];
    syllables.forEach(function (letter) {
        var syllable = '';
        if (letter.match('^[가-힣]')) {
            var chr_code = letter.charCodeAt(0) - GA_CODE;
            var onset = Math.floor(chr_code / ONSET);
            var vowel = Math.floor((chr_code - (ONSET * onset)) / CODA);
            var coda = Math.floor((chr_code - (ONSET * onset) - (CODA * vowel)));
            syllable = "".concat(ONSET_LIST[onset]).concat(VOWEL_LIST[vowel]).concat(CODA_LIST[coda]);
        }
        else {
            syllable = letter;
        }
        jamos.push(syllable);
    });
    return jamos;
};

// now that's stuff i did yippee

function hangeulToJamoList(text) {
    var regexKorean = /[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF]/g;
    var syllables = hangeulToJamos(text);
    var splitSyllables = [];
    syllables.forEach(function (syllable) {
        if (syllable.match(regexKorean))
            splitSyllables.push(syllable.split(''));
        else
            splitSyllables.push([syllable]);
    });
    return (splitSyllables);
};

function getPhonemes(jamos) {

    var c = jamos[0];
    var v = jamos[1];
    var b = jamos[2];

    // return input if vowel is undefined (latin characters)

    if (!v) {
        return;
    }
    var _loop_1 = function (possibleVPhoneme) {
        var vPhoneme = possibleVPhoneme.phoneme;
        var vPhonemeLanguage = possibleVPhoneme.language;

        // check for a matching consonant
        if (phonemeData.consonants[c]) {
            var possibleCPhonemes = phonemeData.consonants[c];
            var matchingCPhoneme = null;

            for (var i = 0; i < possibleCPhonemes.length; i++) {
                if (possibleCPhonemes[i].language === vPhonemeLanguage) {
                    matchingCPhoneme = possibleCPhonemes[i];
                    break;
                }
            }

            if (matchingCPhoneme) {
                var cPhoneme = matchingCPhoneme.phoneme;

                // check for a matching batchim (final consonant)
                if (phonemeData.batchim[b]) {
                    var possibleBPhonemes = phonemeData.batchim[b];
                    var matchingBPhoneme = null;

                    for (var j = 0; j < possibleBPhonemes.length; j++) {
                        if (possibleBPhonemes[j].language === vPhonemeLanguage) {
                            matchingBPhoneme = possibleBPhonemes[j];
                            break;
                        }
                    }

                    if (matchingBPhoneme) {
                        var bPhoneme = matchingBPhoneme.phoneme;
                        return { value: { "phoneme": cPhoneme + " " + vPhoneme + " " + bPhoneme, "language": vPhonemeLanguage } };
                    }
                }
                return { value: { "phoneme": cPhoneme + " " + vPhoneme, "language": vPhonemeLanguage } };
            }
        }
    };

    // iterate through the possible vowel phonemes
    for (var _i = 0, _a = phonemeData.vowels[v] || []; _i < _a.length; _i++) {
        var possibleVPhoneme = _a[_i];
        var state_1 = _loop_1(possibleVPhoneme);
        if (typeof state_1 === "object")
            return state_1.value;
    }

    SV.showMessageBox("Error", "No valid phoneme combination found");
    return;
};


function getAllPhonemes(hangeul) {
    var jamoList = hangeulToJamoList(hangeul);
    var newJamosList = treatJamoList(jamoList);
    var phonemes = [];
    newJamosList.forEach(function (jamos) {
        jamoPhoneme = getPhonemes(jamos);
        if (jamoPhoneme) {
            phonemes.push(jamoPhoneme);
        } else {
            phonemes.push(undefined)
        }
    });
    return phonemes;
};

function treatJamoList(jamoList) {
    var newJamosList = jamoList;
    jamoList.forEach((function (jamos, index) {
        var b = jamos[2];
        var nextJamos;
        if (index + 1 < jamoList.length) {
            nextJamos = jamoList[index + 1];
        }

        if (b && b.match(/[ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ]/)) {
            if (nextJamos[0] === 'ㅇ') {
                newJamosList[index].splice(2, 1);
                newJamosList[index + 1][0] = b;
            }
        }

        if (b && b.match(/[ㄳㄵㄶㄺㄻㄼㄽㄾㄿㅀㅄ]/)) {
            var split = splitDoubleConsonant(b);
            newJamosList[index][2] = split[0]
            if (nextJamos[0] === 'ㅇ') {
                newJamosList[index + 1][0] = split[1];

            }
        }
    }));
    return newJamosList
};

const doubleConsonantMap = {
    'ㄳ': ['ㄱ', 'ㅅ'],
    'ㄵ': ['ㄴ', 'ㅈ'],
    'ㄶ': ['ㄴ', 'ㅎ'],
    'ㄺ': ['ㄹ', 'ㄱ'],
    'ㄻ': ['ㄹ', 'ㅁ'],
    'ㄼ': ['ㄹ', 'ㅂ'],
    'ㄽ': ['ㄹ', 'ㅅ'],
    'ㄾ': ['ㄹ', 'ㅌ'],
    'ㄿ': ['ㄹ', 'ㅍ'],
    'ㅀ': ['ㄹ', 'ㅎ'],
    'ㅄ': ['ㅂ', 'ㅅ']
};

function splitDoubleConsonant(jamo) {
    if (doubleConsonantMap.hasOwnProperty(jamo)) {
        return doubleConsonantMap[jamo];
    }
    return [jamo];
}


// i am. so sorry. i literally do not have a choice. if someone knows how to import a .json file in synthv. PLEASE.


var phonemeData = {
    "consonants": {
        "ㄱ": [
            {
                "phoneme": "g",
                "language": "english"
            },
            {
                "phoneme": "k",
                "language": "mandarin"
            },
            {
                "phoneme": "g",
                "language": "japanese"
            },
            {
                "phoneme": "k",
                "language": "cantonese"
            }
        ],
        "ㄲ": [
            {
                "phoneme": "cl g",
                "language": "english"
            },
            {
                "phoneme": "cl k",
                "language": "mandarin"
            },
            {
                "phoneme": "cl g",
                "language": "japanese"
            },
            {
                "phoneme": "cl k",
                "language": "cantonese"
            }
        ],
        "ㄴ": [
            {
                "phoneme": "n",
                "language": "english"
            },
            {
                "phoneme": "n",
                "language": "mandarin"
            },
            {
                "phoneme": "n",
                "language": "japanese"
            },
            {
                "phoneme": "n",
                "language": "cantonese"
            }
        ],
        "ㄷ": [
            {
                "phoneme": "d",
                "language": "english"
            },
            {
                "phoneme": "t",
                "language": "mandarin"
            },
            {
                "phoneme": "d",
                "language": "japanese"
            },
            {
                "phoneme": "t",
                "language": "cantonese"
            }
        ],
        "ㄸ": [
            {
                "phoneme": "cl d",
                "language": "english"
            },
            {
                "phoneme": "cl t",
                "language": "mandarin"
            },
            {
                "phoneme": "cl d",
                "language": "japanese"
            },
            {
                "phoneme": "cl t",
                "language": "cantonese"
            }
        ],
        "ㄹ": [
            {
                "phoneme": "dx",
                "language": "english"
            },
            {
                "phoneme": "r",
                "language": "japanese"
            },
            {
                "phoneme": "l",
                "language": "mandarin"
            },
            {
                "phoneme": "l",
                "language": "cantonese"
            }
        ],
        "ㅁ": [
            {
                "phoneme": "m",
                "language": "english"
            },
            {
                "phoneme": "m",
                "language": "mandarin"
            },
            {
                "phoneme": "m",
                "language": "japanese"
            },
            {
                "phoneme": "m",
                "language": "cantonese"
            }
        ],
        "ㅂ": [
            {
                "phoneme": "b",
                "language": "english"
            },
            {
                "phoneme": "p",
                "language": "mandarin"
            },
            {
                "phoneme": "b",
                "language": "japanese"
            },
            {
                "phoneme": "p",
                "language": "cantonese"
            }
        ],
        "ㅃ": [
            {
                "phoneme": "cl b",
                "language": "english"
            },
            {
                "phoneme": "cl p",
                "language": "mandarin"
            },
            {
                "phoneme": "cl b",
                "language": "japanese"
            },
            {
                "phoneme": "cl p",
                "language": "cantonese"
            }
        ],
        "ㅅ": [
            {
                "phoneme": "s",
                "language": "english"
            },
            {
                "phoneme": "s",
                "language": "mandarin"
            },
            {
                "phoneme": "s",
                "language": "japanese"
            },
            {
                "phoneme": "s",
                "language": "cantonese"
            }
        ],
        "ㅆ": [
            {
                "phoneme": "cl s",
                "language": "english"
            },
            {
                "phoneme": "cl s",
                "language": "mandarin"
            },
            {
                "phoneme": "cl s",
                "language": "japanese"
            },
            {
                "phoneme": "cl s",
                "language": "cantonese"
            }
        ],
        "ㅇ": [
            {
                "phoneme": "",
                "language": "english"
            },
            {
                "phoneme": "",
                "language": "mandarin"
            },
            {
                "phoneme": "",
                "language": "japanese"
            },
            {
                "phoneme": "",
                "language": "cantonese"
            }
        ],
        "ㅈ": [
            {
                "phoneme": "jh",
                "language": "english"
            },
            {
                "phoneme": "j",
                "language": "japanese"
            },
            {
                "phoneme": "ts\\",
                "language": "mandarin"
            }
        ],
        "ㅉ": [
            {
                "phoneme": "cl jh",
                "language": "english"
            },
            {
                "phoneme": "cl j",
                "language": "japanese"
            },
            {
                "phoneme": "cl ts\\",
                "language": "mandarin"
            }
        ],
        "ㅊ": [
            {
                "phoneme": "ch",
                "language": "english"
            },
            {
                "phoneme": "ch",
                "language": "japanese"
            },
            {
                "phoneme": "ts`",
                "language": "mandarin"
            }
        ],
        "ㅋ": [
            {
                "phoneme": "k",
                "language": "english"
            },
            {
                "phoneme": "kh",
                "language": "mandarin"
            },
            {
                "phoneme": "k",
                "language": "japanese"
            },
            {
                "phoneme": "kh",
                "language": "cantonese"
            }
        ],
        "ㅌ": [
            {
                "phoneme": "t",
                "language": "english"
            },
            {
                "phoneme": "th",
                "language": "mandarin"
            },
            {
                "phoneme": "t",
                "language": "japanese"
            },
            {
                "phoneme": "th",
                "language": "cantonese"
            }
        ],
        "ㅍ": [
            {
                "phoneme": "p",
                "language": "english"
            },
            {
                "phoneme": "ph",
                "language": "mandarin"
            },
            {
                "phoneme": "p",
                "language": "japanese"
            },
            {
                "phoneme": "ph",
                "language": "cantonese"
            }
        ],
        "ㅎ": [
            {
                "phoneme": "hh",
                "language": "english"
            },
            {
                "phoneme": "h",
                "language": "japanese"
            },
            {
                "phoneme": "h",
                "language": "cantonese"
            },
            {
                "phoneme": "x",
                "language": "cantonese"
            }
        ]
    },
    "vowels": {
        "ㅏ": [
            {
                "phoneme": "a",
                "language": "japanese"
            },
            {
                "phoneme": "a",
                "language": "mandarin"
            },
            {
                "phoneme": "a",
                "language": "cantonese"
            }
        ],
        "ㅐ": [
            {
                "phoneme": "E",
                "language": "cantonese"
            },
            {
                "phoneme": "eh",
                "language": "english"
            }
        ],
        "ㅑ": [
            {
                "phoneme": "y a",
                "language": "japanese"
            },
            {
                "phoneme": "j a",
                "language": "mandarin"
            },
            {
                "phoneme": "j a",
                "language": "cantonese"
            }
        ],
        "ㅒ": [
            {
                "phoneme": "j E",
                "language": "cantonese"
            },
            {
                "phoneme": "y eh",
                "language": "english"
            }
        ],
        "ㅓ": [
            {
                "phoneme": "6",
                "language": "cantonese"
            },
            {
                "phoneme": "ao",
                "language": "english"
            }
        ],
        "ㅔ": [
            {
                "phoneme": "e",
                "language": "japanese"
            },
            {
                "phoneme": "e",
                "language": "mandarin"
            },
            {
                "phoneme": "e",
                "language": "cantonese"
            }
        ],
        "ㅕ": [
            {
                "phoneme": "j 6",
                "language": "cantonese"
            },
            {
                "phoneme": "y ao",
                "language": "english"
            }
        ],
        "ㅖ": [
            {
                "phoneme": "y e",
                "language": "japanese"
            },
            {
                "phoneme": "j e",
                "language": "mandarin"
            },
            {
                "phoneme": "j e",
                "language": "cantonese"
            }
        ],
        "ㅗ": [
            {
                "phoneme": "o",
                "language": "japanese"
            },
            {
                "phoneme": "o",
                "language": "mandarin"
            },
            {
                "phoneme": "o",
                "language": "cantonese"
            }
        ],
        "ㅘ": [
            {
                "phoneme": "w a",
                "language": "japanese"
            },
            {
                "phoneme": "ua",
                "language": "mandarin"
            },
            {
                "phoneme": "w a",
                "language": "cantonese"
            }
        ],
        "ㅙ": [
            {
                "phoneme": "w E",
                "language": "cantonese"
            },
            {
                "phoneme": "w e",
                "language": "japanese"
            },
            {
                "phoneme": "yE",
                "language": "mandarin"
            }
        ],
        "ㅚ": [
            {
                "phoneme": "y :\\i",
                "language": "mandarin"
            },
            {
                "phoneme": "w i",
                "language": "japanese"
            },
            {
                "phoneme": "w i",
                "language": "cantonese"
            }
        ],
        "ㅛ": [
            {
                "phoneme": "y o",
                "language": "japanese"
            },
            {
                "phoneme": "j o",
                "language": "mandarin"
            },
            {
                "phoneme": "j o",
                "language": "cantonese"
            }
        ],
        "ㅜ": [
            {
                "phoneme": "u",
                "language": "japanese"
            },
            {
                "phoneme": "u",
                "language": "mandarin"
            },
            {
                "phoneme": "u",
                "language": "cantonese"
            }
        ],
        "ㅝ": [
            {
                "phoneme": "w 6",
                "language": "cantonese"
            },
            {
                "phoneme": "uA",
                "language": "mandarin"
            }
        ],
        "ㅞ": [
            {
                "phoneme": "w e",
                "language": "japanese"
            },
            {
                "phoneme": "ue",
                "language": "mandarin"
            },
            {
                "phoneme": "w e",
                "language": "cantonese"
            }
        ],
        "ㅟ": [
            {
                "phoneme": "w i",
                "language": "japanese"
            },
            {
                "phoneme": "w i",
                "language": "cantonese"
            },
            {
                "phoneme": "y :\\i",
                "language": "mandarin"
            }
        ],
        "ㅠ": [
            {
                "phoneme": "y u",
                "language": "japanese"
            },
            {
                "phoneme": "j u",
                "language": "mandarin"
            },
            {
                "phoneme": "j u",
                "language": "cantonese"
            }
        ],
        "ㅡ": [
            {
                "phoneme": "i\\",
                "language": "mandarin"
            },
            {
                "phoneme": "ih",
                "language": "english"
            }
        ],
        "ㅣ": [
            {
                "phoneme": "i",
                "language": "japanese"
            },
            {
                "phoneme": "i",
                "language": "mandarin"
            },
            {
                "phoneme": "i",
                "language": "cantonese"
            }
        ],
        "ㅢ": [
            {
                "phoneme": "i\\ :\\i",
                "language": "mandarin"
            }
        ]
    },
    "batchim": {
        "ㄱ": [
            {
                "phoneme": "k",
                "language": "english"
            },
            {
                "phoneme": "kh",
                "language": "mandarin"
            },
            {
                "phoneme": "k",
                "language": "japanese"
            },
            {
                "phoneme": ":k_}",
                "language": "cantonese"
            }
        ],
        "ㄲ": [
            {
                "phoneme": "cl k",
                "language": "english"
            },
            {
                "phoneme": "cl kh",
                "language": "mandarin"
            },
            {
                "phoneme": "cl k",
                "language": "japanese"
            },
            {
                "phoneme": "cl :k_}",
                "language": "cantonese"
            }
        ],
        "ㄴ": [
            {
                "phoneme": "n",
                "language": "english"
            },
            {
                "phoneme": ":n",
                "language": "mandarin"
            },
            {
                "phoneme": "n",
                "language": "japanese"
            },
            {
                "phoneme": ":n",
                "language": "cantonese"
            }
        ],
        "ㄷ": [
            {
                "phoneme": "cl",
                "language": "english"
            },
            {
                "phoneme": "cl",
                "language": "mandarin"
            },
            {
                "phoneme": "cl",
                "language": "japanese"
            },
            {
                "phoneme": ":t_}",
                "language": "cantonese"
            }
        ],
        "ㄸ": [
            {
                "phoneme": "cl",
                "language": "english"
            },
            {
                "phoneme": "cl",
                "language": "mandarin"
            },
            {
                "phoneme": "cl",
                "language": "japanese"
            },
            {
                "phoneme": ":t_}",
                "language": "cantonese"
            }
        ],
        "ㄹ": [
            {
                "phoneme": "l",
                "language": "english"
            },
            {
                "phoneme": "l",
                "language": "mandarin"
            },
            {
                "phoneme": "r",
                "language": "japanese"
            },
            {
                "phoneme": "l",
                "language": "cantonese"
            }
        ],
        "ㅁ": [
            {
                "phoneme": "m",
                "language": "english"
            },
            {
                "phoneme": "m",
                "language": "mandarin"
            },
            {
                "phoneme": "m",
                "language": "japanese"
            },
            {
                "phoneme": "m",
                "language": "cantonese"
            }
        ],
        "ㅂ": [
            {
                "phoneme": "p",
                "language": "english"
            },
            {
                "phoneme": "ph",
                "language": "mandarin"
            },
            {
                "phoneme": "p",
                "language": "japanese"
            },
            {
                "phoneme": ":p_}",
                "language": "cantonese"
            }
        ],
        "ㅃ": [
            {
                "phoneme": "cl p",
                "language": "english"
            },
            {
                "phoneme": "cl ph",
                "language": "mandarin"
            },
            {
                "phoneme": "cl p",
                "language": "japanese"
            },
            {
                "phoneme": "cl :p_}",
                "language": "cantonese"
            }
        ],
        "ㅅ": [
            {
                "phoneme": "cl",
                "language": "english"
            },
            {
                "phoneme": "cl",
                "language": "mandarin"
            },
            {
                "phoneme": "cl",
                "language": "japanese"
            },
            {
                "phoneme": ":t_}",
                "language": "cantonese"
            }
        ],
        "ㅆ": [
            {
                "phoneme": "cl",
                "language": "english"
            },
            {
                "phoneme": "cl",
                "language": "mandarin"
            },
            {
                "phoneme": "cl",
                "language": "japanese"
            },
            {
                "phoneme": ":t_}",
                "language": "cantonese"
            }
        ],
        "ㅇ": [
            {
                "phoneme": "ng",
                "language": "english"
            },
            {
                "phoneme": "N",
                "language": "mandarin"
            },
            {
                "phoneme": "N h",
                "language": "japanese"
            },
            {
                "phoneme": "N",
                "language": "cantonese"
            }
        ],
        "ㅈ": [
            {
                "phoneme": "cl",
                "language": "english"
            },
            {
                "phoneme": "cl",
                "language": "mandarin"
            },
            {
                "phoneme": "cl",
                "language": "japanese"
            },
            {
                "phoneme": ":t_}",
                "language": "cantonese"
            }
        ],
        "ㅉ": [
            {
                "phoneme": "cl",
                "language": "english"
            },
            {
                "phoneme": "cl",
                "language": "mandarin"
            },
            {
                "phoneme": "cl",
                "language": "japanese"
            },
            {
                "phoneme": ":t_}",
                "language": "cantonese"
            }
        ],
        "ㅊ": [
            {
                "phoneme": "cl",
                "language": "english"
            },
            {
                "phoneme": "cl",
                "language": "mandarin"
            },
            {
                "phoneme": "cl",
                "language": "japanese"
            },
            {
                "phoneme": ":t_}",
                "language": "cantonese"
            }
        ],
        "ㅋ": [
            {
                "phoneme": "k",
                "language": "english"
            },
            {
                "phoneme": "kh",
                "language": "mandarin"
            },
            {
                "phoneme": "k",
                "language": "japanese"
            },
            {
                "phoneme": ":k_}",
                "language": "cantonese"
            }
        ],
        "ㅌ": [
            {
                "phoneme": "cl",
                "language": "english"
            },
            {
                "phoneme": "cl",
                "language": "mandarin"
            },
            {
                "phoneme": "cl",
                "language": "japanese"
            },
            {
                "phoneme": ":t_}",
                "language": "cantonese"
            }
        ],
        "ㅍ": [
            {
                "phoneme": "p",
                "language": "english"
            },
            {
                "phoneme": "ph",
                "language": "mandarin"
            },
            {
                "phoneme": "p",
                "language": "japanese"
            },
            {
                "phoneme": ":p_}",
                "language": "cantonese"
            }
        ],
        "ㅎ": [
            {
                "phoneme": "cl",
                "language": "english"
            },
            {
                "phoneme": "cl",
                "language": "mandarin"
            },
            {
                "phoneme": "cl",
                "language": "japanese"
            },
            {
                "phoneme": ":t_}",
                "language": "cantonese"
            }
        ]
    }
}