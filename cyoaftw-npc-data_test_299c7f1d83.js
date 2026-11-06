// Mausoleum keepers, vigil tenders and paired bier bearers: routines and workplace ties.
// NPC Life W1/W2: bounded short-term/entity memory, delivered-reply annotations and compatible behavior syntax. Shared species appearance retained.
// ── cyoaftw-npc-data.js v2026-10-23-001 ── Sleeping posture and physical distinguishing-feature prose filtering; portrait identity retained. Previous: Warm rapport options (gaze, company, tease, free evening, see you again) and NPC curiosity questions; social answers with a clean identity phrase, a real "living" answer and a named creditor, voiced by the AI from stored facts; reactive options (offer help, push for answers, sharp question, listen closely, repeat greeting) only show when the last reply fits; greetings treat walking together or a few story turns as the same conversation; before that: "Ask them to join you for good" conversation topic for session followers (offered while they follow and are not a held captive; the answer is a roll from how much they like you, with a cooldown after a decline - see askFollowerToJoinParty in the engine); before that: Player tastes can now be set for Looks, Chest and Butt (matched against gender / NPC anatomy when present); Teacher asks (magic, faith, quiet arts) only show when a teacher exists in the zone; Married NPCs shrug off flirting unless disinhibited; NPC ties (family, friends, workmates; same species only); NPC social sheet (society, rank, standing, need/liking/worry/secret) and five reveal options; Innkeeper "rent a room" option; Catalogue cull: 23 options with no stored fact, mechanic or faith effect removed; guide menu simplified
// Version identifier for debugging cached files
if (typeof window !== "undefined") {
    window.NPC_DATA_VERSION = "2026-11-01-001";
    console.log("[NPC Data] Loaded v" + window.NPC_DATA_VERSION);
}

// ── DATA ARRAYS ──────────────────────────────────────────────────

const ARCHETYPES = [
    "schemer", "hero", "outsider", "sage", "guardian",
    "scoundrel", "romantic", "explorer", "martyr",
    "trickster", "caretaker", "destroyer"
];

const PERSONALITY_TRAITS = [
    "bold", "cautious", "curious", "loyal", "suspicious",
    "cheerful", "moody", "serious", "joker", "flirt",
    "grump", "studious", "helpful", "aloof", "dramatic",
    "sarcastic", "excitable", "shy", "calm", "paranoid",
    "proud", "humble", "reckless", "patient", "bitter",
    "promiscuous",
    // Bathhouse-specific traits
    "professional", "flirty", "dominant"
];

const QUIRKS = [
    "talks to themselves quietly",
    "always fidgets with something",
    "avoids eye contact when lying",
    "laughs at their own jokes",
    "refers to themselves in third person occasionally",
    "taps their foot when nervous",
    "always has a strong opinion about food",
    "hums while working",
    "mistrusts anyone who smiles too much",
    "collects small trinkets",
    "always sits with their back to the wall",
    "repeats the last word of sentences twice",
    "sniffs unfamiliar things before touching them",
    "cracks knuckles before any serious conversation",
    "gives everyone a nickname"
];

const temperaments = [
    "friendly", "neutral", "wary", "hostile",
    "curious", "skittish", "bold", "aggressive"
];

const NPC_SPEECH_PROFILES = {
    common: {
        sample: "Yeah, I noticed. Two travelers came through before dusk and kept moving.",
        sentenceLength: "short to medium",
        vocabulary: "plain everyday words",
        cadence: "answers the question first, then adds one useful detail",
        tone: "neutral and conversational",
        styleDescription: "ordinary, unremarkable speech",
        languageNotes: "speaks the common tongue naturally",
        cues: ["speaks plainly", "keeps the point clear", "does not dress up simple facts"],
        avoid: ["poetic imagery", "dramatic pauses", "mysterious tavern-sage lines"]
    },
    direct: {
        sample: "If you need an answer, ask straight. I don't waste time.",
        sentenceLength: "short",
        vocabulary: "blunt practical words",
        cadence: "gets to the point immediately",
        tone: "firm and commanding",
        styleDescription: "aggressive, no-nonsense delivery",
        languageNotes: "uses simplified, forceful language",
        cues: ["uses firm statements", "sounds decisive", "cuts off rambling"],
        avoid: ["flowery phrasing", "soft hedging", "long explanations"]
    },
    gruff: {
        sample: "Saw them, yes. Kept their heads down and paid in full.",
        sentenceLength: "short to medium",
        vocabulary: "rough practical words",
        cadence: "dry and matter-of-fact",
        tone: "low and gravelly",
        styleDescription: "work-hardened, sparing with words",
        languageNotes: "uses rough dialect, drops pleasantries",
        cues: ["keeps sentences tight", "sounds worn or work-hardened", "shows warmth sparingly"],
        avoid: ["courtly language", "pretty metaphors", "theatrical threats"]
    },
    formal: {
        sample: "I did notice them. They arrived late and spoke to no one for long.",
        sentenceLength: "medium",
        vocabulary: "precise but readable words",
        cadence: "measured and controlled",
        tone: "composed and measured",
        styleDescription: "elegant, careful word choice",
        languageNotes: "uses refined language, may include archaic phrasing",
        cues: ["chooses words carefully", "sounds composed", "may use titles when appropriate"],
        avoid: ["purple prose", "archaic filler", "grand speeches"]
    },
    guarded: {
        sample: "Maybe. Depends on why you're asking.",
        sentenceLength: "short",
        vocabulary: "plain careful words",
        cadence: "gives partial answers before trust is earned",
        tone: "flat and noncommittal",
        styleDescription: "evasive, testing the listener",
        languageNotes: "uses minimal language, withholds detail",
        cues: ["holds something back", "tests the listener first", "keeps tone restrained"],
        avoid: ["rambling", "open confession", "needless scene description"]
    },
    folksy: {
        sample: "Could be something to it. This road carries more trouble than wagons lately.",
        sentenceLength: "short to medium",
        vocabulary: "casual conversational words",
        cadence: "friendly and lightly colored by local habit",
        tone: "warm and unhurried",
        styleDescription: "friendly, down-to-earth delivery",
        languageNotes: "uses local sayings, comfortable colloquialisms",
        cues: ["sounds approachable", "may use a plain saying now and then", "keeps the mood human and readable"],
        avoid: ["cutesy chatter", "thick dialect spelling", "storybook whimsy"]
    },
    clipped: {
        sample: "Yes. Near the gate. After dark.",
        sentenceLength: "very short",
        vocabulary: "lean functional words",
        cadence: "fragmented but clear",
        tone: "sharp and high-pitched",
        styleDescription: "manic, fast-paced delivery with nervous energy",
        languageNotes: "uses simplified language, drops articles and fillers, may use a harsh guttural dialect",
        cues: ["answers in compact beats", "drops filler", "keeps emotion tucked in"],
        avoid: ["long setup", "speechifying", "decorative wording"]
    },
    nervous: {
        sample: "I saw something, I think. Hard to be sure, but it felt wrong.",
        sentenceLength: "short to medium",
        vocabulary: "simple uncertain words",
        cadence: "hesitates and self-corrects",
        tone: "quavering and uncertain",
        styleDescription: "anxious, second-guessing delivery",
        languageNotes: "uses hedging language, trails off mid-sentence",
        cues: ["second-guesses details", "sounds alert to danger", "watches for reactions"],
        avoid: ["confident lectures", "poetic dread", "slick sarcasm"]
    },
    boisterous: {
        sample: "Aye, I saw them, and they looked like trouble from ten paces off.",
        sentenceLength: "medium",
        vocabulary: "plain emphatic words",
        cadence: "energetic and open",
        tone: "loud and hearty",
        styleDescription: "larger-than-life, enthusiastic delivery",
        languageNotes: "uses emphatic language, may include rowdy exclamations",
        cues: ["sounds larger than life without losing clarity", "speaks with confidence", "lets attitude show"],
        avoid: ["long monologues", "fancy ornament", "endless shouting"]
    },
    wry: {
        sample: "I noticed. Trouble rarely bothers to wear a sign, but that came close.",
        sentenceLength: "short to medium",
        vocabulary: "plain words with a dry edge",
        cadence: "understated and pointed",
        tone: "dry and sardonic",
        styleDescription: "understated, pointed delivery with dry humor",
        languageNotes: "uses ironic wordplay, understatement",
        cues: ["uses dry humor sparingly", "sounds unimpressed", "lands the point cleanly"],
        avoid: ["constant snark", "florid irony", "riddle-talk"]
    },
    broken: {
        sample: "Seen them. Bad smell. Bad dark. Stay away.",
        sentenceLength: "very short",
        vocabulary: "simple concrete words",
        cadence: "broken or primitive but understandable",
        tone: "guttural and harsh",
        styleDescription: "primitive, fragmented delivery",
        languageNotes: "uses simplified pidgin language, drops articles and complex grammar, tribal dialect",
        cues: ["keeps grammar simple", "uses direct warning language", "focuses on immediate facts"],
        avoid: ["eloquent phrasing", "complex syntax", "abstract reflection"]
    },
    mimic: {
        sample: "\"Two travelers, before dusk.\" Click. \"Mind the step!\" Caw. \"Two. Two.\"",
        sentenceLength: "very short, borrowed fragments",
        vocabulary: "only phrases heard before, in other people's words",
        cadence: "whole borrowed phrases, then a click, caw, croak or chirp; sometimes only sounds",
        tone: "borrowed and flat, with sudden shifts of voice",
        styleDescription: "mimic speech built from remembered phrases and bird sounds",
        languageNotes: "never forms an original sentence; picks the closest remembered phrase and may repeat the player's own words back; click, caw, croak, chirp, trill, clack and rattle fill the gaps; feeling is carried by the body (wings, head, tail, posture) more than by words",
        cues: ["repeats a phrase the player just said", "tilts the head and clicks the beak when curious or wary", "droops or tucks the wings when sad or submissive, flaps or fluffs them when excited", "fans the tail and stiffens when threatening or afraid"],
        avoid: ["fluent original sentences", "explaining in their own words", "long speeches", "spelling the sounds with apostrophes or odd letters"]
    },
    whisper: {
        sample: "Keep your voice down. Yes, I saw them, and I don't want them hearing this.",
        sentenceLength: "short to medium",
        vocabulary: "plain quiet words",
        cadence: "low and controlled",
        tone: "hushed and faint",
        styleDescription: "ethereal, barely-audible delivery",
        languageNotes: "uses minimal language, may include archaic or mournful phrasing",
        cues: ["sounds hushed", "stays concise", "treats silence as useful"],
        avoid: ["stagey suspense", "breathy seduction", "atmospheric rambling"]
    },
    // ========================================================================
    // BATHHOUSE-SPECIFIC SPEECH STYLES
    // Used by bathhouse staff and regulars for context-appropriate dialogue
    // ========================================================================
    bathhouse_professional: {
        sample: "Yes, we offer that service. The private chamber is available now if you'd like to book.",
        sentenceLength: "medium",
        vocabulary: "precise service-oriented words",
        cadence: "measured and courteous",
        tone: "polite and businesslike",
        styleDescription: "polished, service-focused delivery",
        languageNotes: "uses courteous professional language, refers to services and appointments",
        cues: ["maintains professional boundaries", "speaks with quiet confidence", "uses service terminology"],
        avoid: ["overly familiar language", "crude suggestions", "personal opinions"]
    },
    bathhouse_flirty: {
        sample: "Oh, I'm sure we could find something to ease your tension... the oils are warm today.",
        sentenceLength: "medium",
        vocabulary: "playful suggestive words",
        cadence: "teasing and inviting",
        tone: "warm and flirtatious",
        styleDescription: "playful, inviting delivery with subtle suggestion",
        languageNotes: "uses innuendo and playful teasing, maintains plausible deniability",
        cues: ["smiles often", "uses warm tones", "makes the guest feel welcome"],
        avoid: ["explicit language", "overt propositions", "vulgarity"]
    },
    bathhouse_dominant: {
        sample: "You'll do as I say in my chamber. Remove your clothes and lie on the bench.",
        sentenceLength: "medium",
        vocabulary: "direct authoritative words",
        cadence: "commanding and confident",
        tone: "firm and controlling",
        styleDescription: "assertive, controlling delivery",
        languageNotes: "uses imperative language, expects obedience, maintains professional detachment",
        cues: ["gives clear instructions", "speaks with authority", "maintains control"],
        avoid: ["hesitation", "apologies", "uncertainty"]
    }
};

// ── NATIVE SPEECH BY SPECIES ─────────────────────────────────────
// Everyone speaks the common tongue; there are no invented languages. What
// differs by species is idiom, cadence and what they talk about, and that is
// applied on top of the role/temperament style above for every NPC (see
// getNPCSpeechProfile). `line` is the species' general manner; `kin` is added
// when the NPC is talking to a player of the same species. Mobs that do not
// talk (rat, skeleton, ghost) have no entry.
const NPC_SPECIES_NATIVE_SPEECH = {
    human: {
        line: "plain common-tongue speech with trade and guild turns of phrase (fair coin, a good name); varies more by region and trade than by blood",
        kin: ""
    },
    elf: {
        line: "measured, unhurried and precise; thinks in seasons and years, remembers old oaths and grudges, prefers understatement to exclamation, rarely raises their voice",
        kin: "with another elf they relax their formality a notch and speak of shared years and old houses"
    },
    dwarf: {
        line: "blunt and economical; uses stone, forge and ledger images (solid, load-bearing, paid in full), counts costs, honours contracts and clan debts, praises sparingly",
        kin: "with another dwarf they speak of clan, hall and craft as if to family"
    },
    halfling: {
        line: "warm, chatty and domestic; hearth, table and favour images, friendly diminutives, offers food, keeps a cheerful tally of favours owed",
        kin: "with another halfling they gossip freely and trade family names and favours"
    },
    orc: {
        line: "direct and concrete, short declarative sentences, articulate and not broken; strength, blood-kin and honour fairly won; bluntness and a challenge count as courtesy",
        kin: "with another orc they speak of clan and rank and test each other's mettle"
    },
    dragonborn: {
        line: "formal and proud; speaks of house, line, oath and honour in declarative sentences, a touch condescending toward lesser blood, never casual and never grovelling",
        kin: "with another dragonborn they speak of house and bloodline, status first"
    },
    goblin: {
        line: "quick, sly and sing-song; always working out what is useful, flatters and plays modest, fond of scraps and tricks, jumpy around magic; clipped but not broken",
        kin: "with another goblin they trade gossip about the tribe and who is useful to whom"
    },
    lizardfolk: {
        line: "terse, literal and in the present tense; hunting, land, water and shared food; no flattery and little small talk; says 'we' for the tribe",
        kin: "with another lizardfolk they speak as one family, of land and the hunt"
    },
    kobold: {
        line: "anxious, eager and quick to defer; speaks of masters, dragons and the clan, calls itself 'we', trap-wise and wary; grovels to dragonborn and spits at everyone else",
        kin: "with another kobold they whisper about masters and who is in favour"
    },
    catfolk: {
        line: "smooth, unhurried and a little sly; speaks in bargains, favours and half-hints, answers a question with a question when it suits, curious about everything and committed to nothing, a purr of amusement under dry remarks; owes nobody and keeps careful account",
        kin: "with another catfolk they swap road-news, troupe gossip and who owes whom, and drop the bargaining"
    },
    wolfkin: {
        line: "low, plain and sparing; short sentences, speaks of the pack, the hunt and the land, says 'we' for the pack, trusts slowly and watches before answering; loyalty is stated, not flattered; blunt without cruelty",
        kin: "with another wolfkin they speak of pack, den and range, and whether the other is pack or stranger"
    },
    harefolk: {
        line: "quick, warm and chatty; sentences tumble over each other, often trailing off into a worried aside; speaks of the warren, the larder, the weather and who is kin to whom; startles at loud noises and glances at the exits; gossips freely and trades news for news; never quite finishes a sentence they are nervous about",
        kin: "with another harefolk they speak in half-sentences and shared worries, and relax their ears"
    },
    ratfolk: {
        line: "quick, clipped and wheedling; every sentence is a small deal, quotes a price or a favour, talks about salvage, debts, the nest and what a thing is really worth; flatters when it helps and counts everything; touchy about being called vermin; speaks low when talking business",
        kin: "with another ratfolk they drop the haggling and speak of the nest, who owes whom and where the good scrap is"
    },
    kenku: {
        line: "cannot form words of their own; speaks only by repeating whole phrases they have heard, in the borrowed manner of whoever said them: pieces of what the player has said in this conversation, and stock phrases from markets and taverns; chooses the borrowed phrase that fits best, often out of order or with the wrong emphasis; very short lines; between phrases and in place of them uses bird sounds written plainly as click, click-click, caw, croak, chirp, trill, clack or rattle; understands far more than they can say; shows feeling through the body, so every reply includes a gesture beat in the narration: wing flaps, droops or tucks for excitement, sadness or submission; head tilts, beak clicks and sharp eye movements for curiosity, suspicion or attention; posture and a fanned or lowered tail for dominance or fear",
        kin: "with another kenku they pass remembered sentences back and forth like coins, each in the voice it was first heard in, and need far fewer sounds",
        rules: "plain common tongue only, and only phrases they could have heard; no invented words, no apostrophe names, no phonetic accent spelling; the only non-words allowed are bird sounds written as click, caw, croak, chirp, trill, clack or rattle"
    },
    satyr: {
        line: "bright, playful and quick; lilting patter full of jokes, music and wine, teases everyone, never quite serious and never quite lying; fond of a dare, allergic to solemnity, flatters and needles in the same breath",
        kin: "with another satyr they trade pranks, gossip about revels and who is owed a cup"
    }
};
const NPC_NATIVE_SPEECH_RULES = "plain common tongue only: no invented words, no apostrophe names, no phonetic accent spelling";

// A compact line for the prompt: the species' manner, plus the kin note when
// the player is the same species. Empty for species with no entry.
function getNPCNativeSpeech(npc) {
    if (!npc) return "";
    const key = String(npc.species || "").toLowerCase();
    const entry = NPC_SPECIES_NATIVE_SPEECH[key];
    if (!entry) return "";
    let text = entry.line;
    const playerKey = typeof getPlayerSpeciesKey === "function" ? getPlayerSpeciesKey() : "";
    if (entry.kin && playerKey && playerKey === key && !npc.isPlayer) text += "; " + entry.kin;
    if (key === "kenku" && typeof getKenkuHeardPhrases === "function") text += "; phrases this kenku already knows and may repeat exactly (each in the voice it was heard in): " + getKenkuHeardPhrases(npc).join(" / ");
    return text + " (" + (entry.rules || NPC_NATIVE_SPEECH_RULES) + ")";
}

// Stock phrases a kenku has picked up in markets, taverns and gates. Each kenku
// carries a stable handful of them (by id hash); the AI is told it may repeat
// these, plus anything said in the current conversation, and nothing else.
const NPC_KENKU_STOCK_PHRASES = [
    "Fresh bread, hot from the oven!", "Halt! Who goes there?", "Two coppers, no less.", "Mind the step.",
    "Last orders!", "Don't you dare.", "Come in, come in, out of the cold.", "Thief! Stop that thief!",
    "Shh, shh, quiet now.", "Is that gold?", "Look sharp!", "Not today, friend.", "Sweet dreams, little one.",
    "Move along.", "I never said that.", "Careful, it's hot!", "Well met!", "Hold the door!", "Hush now.",
    "What a day.", "Who left this here?", "That'll be five.", "Keep your voice down.", "Welcome, welcome!"
];
function getKenkuHeardPhrases(npc) {
    let h = 0;
    const id = String((npc && (npc.id || npc.name)) || "");
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    const out = [];
    for (let n = 0; n < 4; n++) {
        const phrase = NPC_KENKU_STOCK_PHRASES[(h + n * 7) % NPC_KENKU_STOCK_PHRASES.length];
        if (out.indexOf(phrase) < 0) out.push('"' + phrase + '"');
    }
    return out;
}

// The species' characteristic fallback style: applied ONLY when role, room,
// temperament and traits have all left the neutral human "common" style in
// place. A common-speaking dwarf still sounds like a dwarf; an elf
// shopkeeper does not sound like a halfling one. Roles with a strong style
// of their own (a guard's "direct") are untouched.
const NPC_SPECIES_SPEECH_STYLE_BIAS = {
    elf: "formal",
    dwarf: "gruff",
    halfling: "folksy",
    goblin: "clipped",
    orc: "direct",
    dragonborn: "formal",
    lizardfolk: "clipped",
    kobold: "nervous",
    catfolk: "wry",
    wolfkin: "direct",
    satyr: "boisterous",
    harefolk: "folksy",
    ratfolk: "clipped",
    kenku: "mimic"
};

// One in-character sample per conversable species (humans keep the style
// samples). Fed to the AI instead of the generic style sample so the one
// concrete voice it mimics belongs to the species, not to a human
// template. Same information shape as the style samples (answering "did
// you see two travelers pass?") so the difference is voice, not content.
const NPC_SPECIES_SPEECH_SAMPLES = {
    elf: [
        "Two came through before dusk, and neither lingered. An old road remembers such passings; ask me in a year and I will still recall their faces.",
        "I saw them. There was a patience to the way they walked that I did not care for. We will know their purpose soon enough."
    ],
    dwarf: [
        "Aye, two of them, before the light went. Paid for nothing, took nothing. That kind of accounting always comes due eventually.",
        "Seen them. Two travelers, heads down, boots worn thin. A day's honest work would fix those boots faster than gossip fixes anything."
    ],
    halfling: [
        "Oh aye, two came through just past supper - didn't stop for a bite, which tells you plenty. Folk who refuse a warm meal are usually in a hurry about the wrong thing.",
        "Two travelers, before dusk. I offered bread; they waved me off. No one has ever regretted taking my bread, mind you."
    ],
    goblin: [
        "Two? Two-two, quick-quick past the door, yes. Nothing on them worth the grabbing... probably. Maybe. Ask again nicer and I remember more.",
        "Saw them, saw them! Slim pickings, those two - but useful, useful to know which way they went, eh? That knowledge might be worth something."
    ],
    orc: [
        "Two strangers passed before dusk. They kept their eyes down and their hands easy. That is wise, in a town like this.",
        "I saw them. They walked like they had a debt to settle somewhere. Good posture. Bad reason."
    ],
    dragonborn: [
        "Two travelers crossed before nightfall. I noted them, as one notes weather that may yet turn. Their errand is none of my house's concern - yet.",
        "They passed. My grandfather's oath does not extend to accounting for every drifter, but this town holds a debt of mine, and I watch what comes for it."
    ],
    lizardfolk: [
        "We saw two. They came with the dusk and left with it. They took no water and left no meat. Strange, for travelers.",
        "Two walked the road. The road is ours to watch. They did not hunt; they did not stay. This is what we know."
    ],
    kobold: [
        "We- I- yes, two of them, before dark! Big ones, walking soft. Soft-walkers spring traps, you know. Not that- not that there are traps. But we watched them.",
        "Oh, we saw them, yes! They did not look for us, so we looked for them. That is the proper order of things."
    ],
    catfolk: [
        "Two, yes, with the dusk. One walked like a debtor. The other walked like a creditor. I had a thought to ask what price they put on that information, but I am feeling generous. Which way were you hoping they went?",
        "Mm. Two travellers, about the hour the shadows get long. I do not give away what I see for free, but you have a pleasant face. What can you offer?"
    ],
    wolfkin: [
        "Two. At dusk. They kept to the road and did not look at the trees. That is how you know someone has been hunted before.",
        "I scented them before I saw them. Two travellers, wary, no meat on them. They did not stay. Whatever they run from, it is not near."
    ],
    harefolk: [
        "Two, yes, two! Hopped past just before dusk, quick quick, didn't stop to say hello. Ears up, both of them, nervous sort. I would have followed, but my cousin says never follow. Which way did you want them gone?",
        "Oh, I saw them, I did, and I told the whole warren, and the warren told the next warren, so by now half the countryside knows. Two travellers. One limping. Mind you, I only saw them from behind a hedge."
    ],
    ratfolk: [
        "Two? Saw two, yes. Skinny, quick, nothing worth the nicking, and I looked. Might know where they went. Might. What is the knowing worth to you, friend?",
        "Two came through the lower drains, yes. Left a trail a blind pup could follow. Free advice: do not follow it. Paid advice: I know a better way."
    ],
    kenku: [
        "\"Two travelers, before dusk.\" Click. \"Mind the step!\" Caw. \"Two. Two.\"",
        "Chirp. \"Halt! Who goes there?\" Click-click. \"Two coppers, no less.\" Rattle."
    ],
    satyr: [
        "Two? Two! Ha, I saw them, I did - one stumbling, the other pretending not to be. Poor souls, no song between them. I offered a cup and they ran. Their loss, my gain, and a good cup it was!",
        "Oh, I saw them, friend, I saw them. Two travellers, long faces, nary a smile. I tried a joke. It did not land. I will think of a better one by midnight."
    ]
};

// The species voice sample for this NPC, or "" for humans and unknowns.
// The pick is stable per NPC (hash of id/name) so the prompt does not vary
// between builds.
function getNPCSpeciesSpeechSample(npc) {
    if (!npc) return "";
    const key = String(npc.species || "").toLowerCase();
    const samples = NPC_SPECIES_SPEECH_SAMPLES[key];
    if (!Array.isArray(samples) || !samples.length) return "";
    let h = 0;
    const id = String(npc.id || npc.name || "");
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return samples[h % samples.length];
}

const SPEECH_STYLE_ALIASES = {
    archaic: "formal",
    boisterous: "boisterous",
    broken: "broken",
    chattery: "clipped",
    clipped: "clipped",
    common: "common",
    commanding: "direct",
    direct: "direct",
    eloquent: "formal",
    formal: "formal",
    gagged: "broken",
    growl: "broken",
    gruff: "gruff",
    guttural: "broken",
    hiss: "broken",
    majestic: "formal",
    mechanical: "clipped",
    mimic: "mimic",
    mimicry: "mimic",
    murmur: "guarded",
    nervous: "nervous",
    none: "broken",
    poetic: "formal",
    rambling: "folksy",
    sarcastic: "wry",
    serene: "guarded",
    shout: "direct",
    snarl: "broken",
    squeak: "broken",
    whisper: "whisper",
    whispered: "whisper",
    // Bathhouse-specific aliases
    bathhouse_professional: "bathhouse_professional",
    bathhouse_flirty: "bathhouse_flirty",
    bathhouse_dominant: "bathhouse_dominant",
    professional: "bathhouse_professional",
    flirty: "bathhouse_flirty",
    dominant: "bathhouse_dominant"
};

const SPEECH_STYLES = Object.keys(NPC_SPEECH_PROFILES);

const NPC_DISTINGUISHING_MARKS = [
    "a small scar near one eye",
    "weathered hands",
    "a chipped tooth",
    "old travel stains",
    "a guarded stare",
    "a restless posture",
    "a careful way of watching exits",
    "a faint herbal smell",
    "a worn charm tied to their gear",
    "patched clothing",
    "a voice that drops when strangers come close"
];

const NPC_BACKGROUNDS = [
    { background: "grew up in a border trading town", dialectFlavor: "peppers speech with quick trade-cant shorthand" },
    { background: "born and raised in an isolated mountain clan", dialectFlavor: "carries old-fashioned, formal turns of phrase" },
    { background: "spent years with a traveling caravan", dialectFlavor: "cadence is a patchwork picked up from a dozen different places" },
    { background: "grew up in a coastal fishing village", dialectFlavor: "unhurried, sing-song cadence with maritime turns of phrase" },
    { background: "orphaned young, raised by whoever would take them in", dialectFlavor: "no single clear origin - habits borrowed from everywhere" },
    { background: "spent time in a monastery or temple school", dialectFlavor: "measured, deliberate phrasing with the occasional formal or archaic word" },
    { background: "grew up on the road with no fixed home", dialectFlavor: "speaks plainly and efficiently, with little patience for ornament" },
    { background: "raised within these city walls, rarely traveling far", dialectFlavor: "speaks with unselfconscious local familiarity, assuming shared context" }
];

const NPC_HUMANOID_MOTIVES = [
    "earn enough coin to feel secure",
    "avoid becoming involved in someone else's trouble",
    "find out what strangers know",
    "protect a personal secret",
    "win a little respect",
    "get through the day without losing face",
    "locate a missing contact",
    "turn a rumor into advantage"
];

const NPC_CREATURE_MOTIVES = [
    "guard its territory",
    "search for food or warmth",
    "avoid a stronger threat nearby",
    "obey an old instinct",
    "watch for a chance to flee",
    "protect a hidden nest or resting place"
];

const NPC_ACTION_RELATION_WEIGHTS = {
    greeting: 1,
    help: 2,
    "offer-help": 3,
    "ask-background": 1,
    "ask-place": 0,
    "ask-work": 1,
    "ask-watch": 0,
    "ask-seen": 0,
    "ask-need": 2,
    "ask-people": 1,
    "ask-rumor": 0,
    "ask-talk": 0,
    "ask-rumor-source": 0,
    "ask-rumor-proof": 1,
    "ask-family": 1,
    "ask-work-hardest": 1,
    "ask-seen-who": 0,
    "press-topic": 0,
    "ask-event": 0,
    "typed-warm": 1,
    "typed-rude": -2,
    "typed-threat": -3,
    question: 0,
    calm: 2,
    "keep-calm": 2,
    compliment: 2,
    apology: 2,
    comfort: 2,
    "comfort-rebuffed": -1,
    flirt: 0,
    "flirt-tentative": 1,
    "flirt-received": 2,
    "flirt-rejected": -2,
    tease: 0,
    "tease-playful": 1,
    "tease-backfire": -2,
    "misread-flirt": -2,
    "taken-deflect": -1,
    threat: -3,
    "sharp-question": -3,
    goodbye: 0,
    talk: 0,
    gift: 3,
    "generous-trade": 3,
    "fair-trade": 1,
    "hard-bargain": -1,
    "refused-trade": -2,
    "attacked-by-player": -6,
    "surrender-attempt": 0,
    "mercy-shown": 4,
    "mercy-refused": -5,
    "woken-after-defeat": 2
};

function _npcRand(arr) {
    if (!Array.isArray(arr) || !arr.length) return "";
    return arr[Math.floor(Math.random() * arr.length)];
}

function _npcRandInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function _npcUniquePicks(arr, count) {
    const pool = Array.isArray(arr) ? arr.slice() : [];
    const picks = [];
    while (pool.length && picks.length < count) {
        const index = Math.floor(Math.random() * pool.length);
        picks.push(pool.splice(index, 1)[0]);
    }
    return picks;
}

function _npcJoinList(parts) {
    const clean = (Array.isArray(parts) ? parts : []).filter(Boolean);
    if (!clean.length) return "";
    if (clean.length === 1) return clean[0];
    if (clean.length === 2) return clean[0] + " and " + clean[1];
    return clean.slice(0, -1).join(", ") + ", and " + clean[clean.length - 1];
}

function _npcGetSpeciesTemplate(species) {
    if (typeof getSpeciesTemplate === "function") {
        return getSpeciesTemplate(species);
    }
    return null;
}

function formatNPCActionTag(tag) {
    const key = String(tag || "").trim();
    if (!key) return "";

    const labels = {
        greeting: "greeted you politely",
        help: "offered help",
        "offer-help": "offered help",
        "ask-background": "asked what brought you here",
        "ask-place": "asked about the area",
        "ask-work": "asked about your work",
        "ask-watch": "asked who you were watching for",
        "ask-seen": "asked what you had seen",
        "ask-need": "asked what you needed most",
        "ask-people": "asked about your people",
        "ask-rumor": "asked for rumors",
        "ask-talk": "asked what people were saying",
        question: "asked questions",
        calm: "tried to keep things calm",
        "keep-calm": "tried to keep things calm",
        compliment: "offered a sincere compliment",
        apology: "apologized",
        comfort: "tried to reassure you",
        "comfort-rebuffed": "pushed comfort at the wrong time",
        "misread-flirt": "misread the mood",
        "taken-deflect": "flirted with someone who is spoken for",
        "flirt-tentative": "tested the waters gently",
        "flirt-received": "flirted warmly",
        "flirt-rejected": "pushed flirtation too far",
        tease: "teased lightly",
        "tease-playful": "teased playfully",
        "tease-backfire": "teased at the wrong moment",
        threat: "threatened you",
        "sharp-question": "pressed you harshly",
        goodbye: "left politely",
        gift: "gave you something",
        "generous-trade": "traded generously",
        "fair-trade": "traded fairly",
        "hard-bargain": "drove a hard bargain",
        "refused-trade": "pushed a bad trade",
        "attacked-by-player": "attacked you",
        "surrender-attempt": "tried to force surrender",
        "mercy-shown": "showed mercy",
        "mercy-refused": "refused mercy",
        "woken-after-defeat": "woke you carefully after the fight"
    };

    if (labels[key]) return labels[key];
    return key.replace(/[-_]/g, " ");
}

function getNPCActionTags(npc, limit = 12) {
    if (!npc || !npc.memory) return [];
    const primary = Array.isArray(npc.memory.playerActionTags) ? npc.memory.playerActionTags : [];
    const fallback = Array.isArray(npc.memory.playerActions) ? npc.memory.playerActions : [];
    const raw = primary.length ? primary : fallback;
    return raw
        .map(tag => String(tag || "").trim())
        .filter(tag => Object.prototype.hasOwnProperty.call(NPC_ACTION_RELATION_WEIGHTS, tag))
        .slice(-limit);
}

function getNPCRelationshipMomentum(npc) {
    const tags = getNPCActionTags(npc, 8);
    if (!tags.length) return 0;

    let total = 0;
    for (let i = 0; i < tags.length; i++) {
        const recencyWeight = 0.6 + ((i + 1) / tags.length) * 0.8;
        total += (NPC_ACTION_RELATION_WEIGHTS[tags[i]] || 0) * recencyWeight;
    }
    return Math.round(total);
}

function getNPCRelationshipSpeechGuidance(npc) {
    if (!npc) {
        return {
            baseline: "neutral",
            direction: "steady",
            cue: "keep the tone even and readable",
            instruction: "Default to a neutral, conversational tone."
        };
    }

    ensureNPCRelationshipState(npc);

    const favor = npc.memory.favorability ?? 0;
    const hostility = npc.hostility ?? 0;
    const momentum = getNPCRelationshipMomentum(npc);
    const score = favor - Math.round(hostility * 0.7) + momentum * 3;

    let baseline = "neutral";
    let instruction = "Default to a neutral, conversational tone.";
    let cue = "keep the tone even and readable";

    if (score >= 70) {
        baseline = "openly warm";
        instruction = "Default to a warm tone. Answer more openly and volunteer one small helpful detail when it fits.";
        cue = "the answer comes easier and carries a little extra warmth";
    } else if (score >= 35) {
        baseline = "warming";
        instruction = "Default to a friendly tone. Be less guarded than before and let a little warmth show.";
        cue = "some of the stiffness is gone";
    } else if (score >= 10) {
        baseline = "cautiously receptive";
        instruction = "Default to a mildly receptive tone. Answer directly and allow a small sign of trust.";
        cue = "they offer one extra useful detail without making a show of it";
    } else if (score <= -70) {
        baseline = "hostile";
        instruction = "Default to a hostile or openly resistant tone. Keep answers terse, skeptical, or refusing.";
        cue = "their patience is thin";
    } else if (score <= -35) {
        baseline = "defensive";
        instruction = "Default to a defensive tone. Stay guarded, skeptical, and sparing with details.";
        cue = "they answer like they expect trouble";
    } else if (score <= -10) {
        baseline = "reserved";
        instruction = "Default to a reserved tone. Be polite if needed, but keep distance and avoid sounding open.";
        cue = "the reply stays tight and measured";
    }

    let direction = "steady";
    if (momentum >= 6) direction = "improving";
    else if (momentum >= 2) direction = "softening";
    else if (momentum <= -6) direction = "deteriorating";
    else if (momentum <= -2) direction = "cooling";

    if (direction === "improving") {
        cue = baseline === "hostile" || baseline === "defensive"
            ? "despite the guard, they give slightly more than they would have before"
            : "they sound a little more at ease than before";
    } else if (direction === "softening") {
        cue = baseline === "reserved"
            ? "a little of the caution lifts"
            : "they let a bit more warmth show";
    } else if (direction === "deteriorating") {
        cue = baseline === "warming" || baseline === "openly warm"
            ? "there is a new edge under the politeness"
            : "they sound more brittle and less patient";
    } else if (direction === "cooling") {
        cue = baseline === "neutral"
            ? "the reply is a touch cooler than before"
            : "they keep a little more distance in the answer";
    }

    return { baseline, direction, cue, instruction };
}

function _npcNormalizeList(value) {
    if (value == null) return [];
    const raw = Array.isArray(value) ? value : [value];
    return raw
        .map(item => String(item || "").toLowerCase().trim())
        .filter(Boolean);
}

function _npcValueInList(value, options) {
    const list = _npcNormalizeList(options);
    if (!list.length) return false;
    const key = String(value || "").toLowerCase().trim();
    return !!key && list.includes(key);
}

function _npcTextIncludesAny(text, options) {
    const list = _npcNormalizeList(options);
    if (!list.length) return false;
    const haystack = String(text || "").toLowerCase();
    return list.some(entry => haystack.includes(entry));
}

function _npcActionTagsInclude(tags, required) {
    const active = new Set(_npcNormalizeList(tags));
    const needed = _npcNormalizeList(required);
    return needed.every(tag => active.has(tag));
}

function _npcResolveConversationValue(value, npc, ctx) {
    return typeof value === "function" ? value(npc, ctx) : value;
}

function _npcLowercaseFirst(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    return text.charAt(0).toLowerCase() + text.slice(1);
}

// ensureNPCConversationState: single canonical definition further below
// (state lives at npc.memory.conversationState). An older duplicate that
// wrote to npc.conversationState was removed — the later declaration always
// overrode it, so it was dead code that split state across two paths.

function _npcBuildPlayerConversationText(label, action) {
    const text = String(label || "").trim();
    if (!text) return action ? "" : "You act.";

    const lower = text.toLowerCase();
    if (lower === "say goodbye") return "You say goodbye and step away.";
    if (lower === "trade") return "You open trade.";
    if (lower === "tease playfully") return "You tease them playfully.";
    if (lower === "flirt lightly") return "You flirt lightly.";
    if (lower === "keep things calm") return "You try to keep things calm.";
    if (lower === "offer help") return "You offer help.";
    if (lower === "compliment them") return "You compliment them.";
    if (lower === "comfort them") return "You try to comfort them.";
    if (lower === "apologize") return "You apologize.";

    return `You ${_npcLowercaseFirst(text)}.`;
}

function ensureNPCConversationState(npc) {
    if (!npc) return null;
    npc.memory = npc.memory || {};

    const state = npc.memory.conversationState && typeof npc.memory.conversationState === "object"
        ? npc.memory.conversationState
        : {};

    if (!Array.isArray(state.usedOptionIds)) state.usedOptionIds = [];
    if (!Array.isArray(state.sessionUsedOptionIds)) state.sessionUsedOptionIds = [];
    if (!state.lastVariantByOption || typeof state.lastVariantByOption !== "object") state.lastVariantByOption = {};
    if (!state.optionUsage || typeof state.optionUsage !== "object" || Array.isArray(state.optionUsage)) state.optionUsage = {};
    if (typeof state.interactionCount !== "number") state.interactionCount = 0;
    if (typeof state.sessionInteractionCount !== "number") state.sessionInteractionCount = 0;
    if (typeof state.sessionNumber !== "number") state.sessionNumber = 0;
    if (typeof state.lastOptionId !== "string") state.lastOptionId = "";
    if (typeof state.lastTopic !== "string") state.lastTopic = "";
    if (typeof state.lastLoreFactId !== "string") state.lastLoreFactId = "";

    npc.memory.conversationState = state;
    return state;
}

function resetNPCConversationSession(npc) {
    const state = ensureNPCConversationState(npc);
    if (!state) return null;

    state.sessionUsedOptionIds = [];
    if (npc && npc.memory) npc.memory.pendingResponse = null;
    state.sessionInteractionCount = 0;
    state.sessionNumber += 1;
    state.lastOptionId = "";
    return state;
}

function recordNPCConversationChoice(npc, choice) {
    if (!npc || !choice) return null;
    const state = ensureNPCConversationState(npc);
    if (!state) return null;

    // Remember when and where in the player's travels this last happened, so a
    // repeat greeting can tell "still here" from "back after a while".
    if (npc.memory && typeof G === "object" && G && G.player) {
        npc.memory.lastTalkMoveSeq = G.player.moveSeq || 0;
        npc.memory.lastTalkTurn = typeof getCurrentStoryTurn === "function" ? getCurrentStoryTurn() : 0;
    }

    const optionId = String(choice.id || "").trim();
    // Typed / canned replies ("respond-...") are free-form: keep them out of
    // the used-option lists so they cannot push real option ids (like the
    // session greeting) out of the capped history. lastOptionId still moves,
    // so "right after X" follow-ups (press-topic) do not linger after a reply.
    if (optionId && optionId.indexOf("respond-") === 0) {
        state.lastOptionId = optionId;
    } else if (optionId) {
        state.usedOptionIds.push(optionId);
        state.usedOptionIds = state.usedOptionIds.slice(-60);
        state.sessionUsedOptionIds.push(optionId);
        state.sessionUsedOptionIds = state.sessionUsedOptionIds.slice(-30);
        state.lastOptionId = optionId;
        // A lore option: this NPC has now told that fact (never repeats it),
        // the world's "heard" count rises, and a follow-up can refer to it.
        if (choice.loreFactId && typeof ensureWorldLore === "function") {
            const loreState = ensureWorldLore();
            loreState.heard[choice.loreFactId] = (loreState.heard[choice.loreFactId] || 0) + 1;
            if (!npc.memory.loreTold || typeof npc.memory.loreTold !== "object") npc.memory.loreTold = {};
            npc.memory.loreTold[choice.loreFactId] = true;
            state.lastLoreFactId = choice.loreFactId;
        }
        // A "what are people saying" option: that deed has now been told, and she will
        // not bring it up again (see markRenownDeedTold in the engine).
        if (choice.deedTalkId && typeof markRenownDeedTold === "function") markRenownDeedTold(npc, choice.deedTalkId);
        // Greeting someone who admires something you did: they may press a small gift on you.
        if (String(choice.intent || "").toLowerCase() === "greeting" && typeof maybeGiveRenownGift === "function") maybeGiveRenownGift(npc);
        // A guide option moves the opening story along (e.g. "plan" marks the
        // guide as having oriented the player).
        if (choice.guideBeat && typeof onGuideBeat === "function") onGuideBeat(npc, choice.guideBeat);
        // ask-about-topic labels read "Ask about <topic>"; remember the topic
        // so a follow-up ("press-topic") can refer to it.
        if (optionId === "ask-about-topic" && typeof choice.label === "string") {
            state.lastTopic = choice.label.replace(/^Ask about\s+/i, "").trim();
        }

        const usage = state.optionUsage[optionId] && typeof state.optionUsage[optionId] === "object"
            ? state.optionUsage[optionId]
            : {};
        usage.count = typeof usage.count === "number" ? usage.count + 1 : 1;
        usage.sessionCount = usage.sessionNumber === state.sessionNumber && typeof usage.sessionCount === "number"
            ? usage.sessionCount + 1
            : 1;
        usage.sessionNumber = state.sessionNumber || 0;
        usage.lastUsedTurn = typeof getCurrentStoryTurn === "function"
            ? getCurrentStoryTurn()
            : state.interactionCount;
        usage.lastUsedEventCounter = typeof G === "object" && G && G.story && typeof G.story.eventCounter === "number"
            ? G.story.eventCounter
            : 0;
        state.optionUsage[optionId] = usage;
    }

    state.interactionCount += 1;
    state.sessionInteractionCount += 1;
    // Durable memory of what the player did (see NPC MEMORY). Never lets a
    // memory problem break a conversation.
    try { if (typeof recordNPCConversationMemory === "function") recordNPCConversationMemory(npc, choice); } catch (memErr) { console.warn("[NPC Memory] record failed", memErr); }
    return state;
}

// ── NPC TAGS AND FACT SELECTOR ───────────────────────────────────────
// One closed tag vocabulary shared by memories and facts. A reply is steered by
// "wanted" tags worked out from what the player chose or typed plus the
// situation; the selector then sends only the few records that match, inside a
// small budget, instead of everything the NPC knows. Nothing here calls the AI.
//   topic tags       what the line is about (work, money, family, food, ...)
//   relation tags    how the NPC stands to the player or others (kin, friend, ...)
//   memory kinds     what happened between them (told, gift, insult, debt, ...)
//   situation tags   the moment (time:night, hurt, fight-here, mood:*)
// Records are { id, tags[], text, weight, always }. A record scores
//   3 x topic tags matched + 1.5 x situation tags matched + 3 x keyword hits + weight
// and is only sent when it matches something (or the line is generic and the
// record has weight); `always` records (a marriage rule, what was already told)
// are always sent. When nothing matches, no facts are sent and the reply prompt
// tells the speaker to say they do not know rather than invent.
const NPC_TOPIC_KEYWORDS = {
    work: ["job", "work", "working", "trade", "wage", "wages", "employ", "employer", "hire", "hired", "shop", "craft", "apprentice", "labor", "labour", "boss", "customer", "business", "duty", "duties", "profession", "living"],
    money: ["coin", "coins", "pay", "paid", "price", "prices", "cost", "gold", "silver", "copper", "rent", "debt", "owe", "owed", "afford", "cheap", "expensive", "sell", "buy", "bargain", "fee", "wealth", "rich", "poor", "purse"],
    home: ["home", "house", "live", "lodging", "lodge", "bed", "roof", "neighbor", "neighbour", "village", "hearth", "shelter"],
    family: ["family", "wife", "husband", "brother", "sister", "mother", "father", "son", "daughter", "kin", "child", "children", "parent", "parents", "married", "spouse", "cousin", "uncle", "aunt"],
    food: ["eat", "food", "hungry", "hunger", "meal", "drink", "ale", "wine", "bread", "stew", "cook", "supper", "breakfast", "dinner", "tavern", "thirsty", "mug"],
    faith: ["god", "gods", "pray", "prayer", "shrine", "temple", "priest", "faith", "deity", "blessing", "holy", "divine", "patron", "worship"],
    law: ["guard", "guards", "crime", "steal", "stole", "thief", "theft", "bounty", "law", "jail", "wanted", "murder", "prison", "crown", "justice"],
    danger: ["danger", "dangerous", "fight", "monster", "bandit", "bandits", "attack", "safe", "threat", "dungeon", "kill", "killed", "wounded", "hurt", "blood", "war", "beast", "afraid", "fear"],
    rumor: ["rumor", "rumors", "rumour", "news", "heard", "gossip", "happening", "happened", "story", "stories", "tale", "lately", "whisper"],
    place: ["where", "town", "road", "north", "south", "east", "west", "direction", "directions", "street", "building", "map", "nearby", "find", "far", "zone", "place"],
    self: ["yourself", "background", "past", "born", "grew", "name", "life", "age", "species", "race", "people", "kind"],
    looks: ["look", "looks", "face", "hair", "eyes", "tall", "short", "scar", "beautiful", "handsome", "pretty", "ugly", "wear", "wearing", "dress", "clothes", "strong", "muscles", "tattoo", "skin"],
    routine: ["daily", "routine", "schedule", "usual", "usually", "typical", "morning", "evening", "midday", "everyday"],
    leisure: ["hobby", "hobbies", "pastime", "pastimes", "leisure", "spare", "fun", "relax", "unwind", "amuse", "enjoy"],
    love: ["love", "kiss", "flirt", "lover", "romance", "romantic", "marry", "date", "darling", "sweetheart", "charming", "desire", "attracted", "adore"]
};
const NPC_RELATION_TAGS = ["kin", "mate", "friend", "colleague", "packmate", "master", "stranger"];
const NPC_MEMORY_KIND_TAGS = ["told", "learned", "gift", "help", "insult", "debt", "promise", "betrayal", "said"];
const NPC_SITUATION_TAGS = ["time:dawn", "time:day", "time:dusk", "time:night", "at:home", "at:work", "hurt", "fight-here", "rel:friend", "rel:stranger", "rel:acquaintance"];
const NPC_TAG_VOCAB = Object.keys(NPC_TOPIC_KEYWORDS).concat(NPC_RELATION_TAGS, NPC_MEMORY_KIND_TAGS, NPC_SITUATION_TAGS);

// What each conversation option is about. An option id not listed falls back to
// keywords in its label. Memory kinds (debt, insult, ...) are listed where an
// option should also bring back an old memory of that kind.
const NPC_OPTION_TAGS = {
    "ask-name": ["self"],
    "ask-teacher-arcane": ["work"],
    "ask-teacher-faith": ["faith", "work"],
    "ask-teacher-roguery": ["work", "law"],
    "accept-share-offer": ["food"],
    "decline-share-offer": ["food"],
    "join-their-table": ["food"],
    "meal-leave-table": ["food"],
    "offer-to-buy-drink": ["food", "money"],
    "offer-to-buy-both-drinks": ["food", "money"],
    "bar-order-refused": ["food", "money"],
    "bar-ask-cellar": ["work", "place"],
    "ask-about-work": ["work", "money", "debt", "promise"],
    "ask-about-event": ["rumor", "danger"],
    "ask-about-lore": ["rumor", "place"],
    "ask-lore-source": ["rumor"],
    "ask-rumor": ["rumor"],
    "ask-talk": ["rumor", "law", "danger", "help"],
    "offer-help": ["work", "help", "debt"],
    "keep-calm": ["danger"],
    "ask-standing": ["self", "work"],
    "ask-companion-fighting": ["self", "danger", "work"],
    "ask-need": ["money", "work", "help"],
    "ask-worry": ["self", "danger"],
    "ask-liking": ["self", "food"],
    "ask-secret": ["self", "law", "betrayal"],
    "ask-ties": ["family", "friend", "colleague"],
    "rent-room": ["home", "money"],
    "browse-wares": ["money", "work"],
    "trade": ["money", "work", "debt"],
    "ask-deity": ["faith"],
    "ask-their-deity": ["faith"],
    "compliment": ["looks", "love"],
    "win-them-over": ["looks", "love"],
    "tease": ["looks", "love"],
    "apologize": ["insult", "betrayal"],
    "comfort": ["self", "help"],
    "insult": ["insult"],
    "sharp-question": ["rumor"],
    "listen-closely": ["self"],
    "push-for-answers": ["rumor"],
    "steady-nerve": ["danger"],
    "pressure-what": ["law", "money"],
    "pressure-pay": ["money", "debt"],
    "pressure-report": ["law"],
    "pressure-time": ["law"],
    "pressure-ready": ["law"],
    "pressure-refuse": ["law"],
    "guide-first-step": ["place", "work"],
    "guide-ask-question": ["self"],
    "guide-lead-shrine": ["place"],
    "lead-stage-ask": ["place", "rumor"],
    "ask-directions": ["place"],
    "offer-drink": ["food", "money"],
    "party-loot-revisit": ["money"]
};
// Memory kinds a conversation intent leaves behind.
const NPC_INTENT_MEMORY_KINDS = { insult: ["insult"], aggression: ["insult"], help: ["help"], apology: ["insult"] };

const NPC_TAG_SUFFIX = /^(s|es|ed|er|ers|ing|ly|'s)$/;
// Option ids that come in families (one per drink, say) share tags by prefix.
const NPC_OPTION_TAG_PREFIXES = [["bar-order-", ["food", "money"]], ["bar-round-", ["food", "money"]]];
const NPC_FACT_BUDGET = { maxLines: 5, maxChars: 800 };
const NPC_TURN_PHASES = [[6, "dawn"], [24, "day"], [30, "dusk"], [Infinity, "night"]];

function _npcTagTokens(text) {
    return String(text || "").toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean);
}

// Topic tags for free text: a word matches a tag's keyword when equal, or when
// it is the keyword plus a plain ending (so "brothers" matches "brother" but
// "shortcake" does not match "short").
function getNPCTagsForText(text) {
    const tokens = _npcTagTokens(text);
    const out = [];
    if (!tokens.length) return out;
    Object.keys(NPC_TOPIC_KEYWORDS).forEach(function (tag) {
        const kws = NPC_TOPIC_KEYWORDS[tag];
        const hit = tokens.some(function (tok) {
            return kws.some(function (kw) { return tok === kw || (kw.length >= 3 && tok.indexOf(kw) === 0 && NPC_TAG_SUFFIX.test(tok.slice(kw.length))); });
        });
        if (hit) out.push(tag);
    });
    return out;
}

function getNPCOptionTags(optionId) {
    const id = String(optionId || "");
    if (Object.prototype.hasOwnProperty.call(NPC_OPTION_TAGS, id)) return NPC_OPTION_TAGS[id].slice();
    for (let i = 0; i < NPC_OPTION_TAG_PREFIXES.length; i++) {
        if (id.indexOf(NPC_OPTION_TAG_PREFIXES[i][0]) === 0) return NPC_OPTION_TAG_PREFIXES[i][1].slice();
    }
    return [];
}

function getNPCTurnPhase(turnOfDay) {
    for (let i = 0; i < NPC_TURN_PHASES.length; i++) {
        if (turnOfDay < NPC_TURN_PHASES[i][0]) return NPC_TURN_PHASES[i][1];
    }
    return "day";
}

// Tags for the moment: time of day, the NPC's mood, a visibly hurt player, a
// fight in this room, and how the NPC stands to the player (rel:friend,
// rel:stranger, kept apart from the relation tags records use for the people in
// the NPC's own life).
function getNPCSituationTags(npc, room) {
    const tags = [];
    if (typeof getTurnOfDay === "function") tags.push("time:" + getNPCTurnPhase(getTurnOfDay()));
    const mood = npc && ((npc.currentState && npc.currentState.mood) || (npc.memory && npc.memory.lastMood));
    const moodWord = String(mood || "").toLowerCase().split(/[^a-z]+/)[0];
    if (moodWord && moodWord !== "neutral") tags.push("mood:" + moodWord);
    if (typeof G === "object" && G) {
        if (G.player && typeof getHealthBandIndex === "function" && getHealthBandIndex(G.player) >= 2) tags.push("hurt");
        if (typeof G._lastCombatTurn === "number" && room && G._lastCombatRoom === (room.id || room.name || "") &&
            typeof getCurrentStoryTurn === "function" && getCurrentStoryTurn() - G._lastCombatTurn <= 6) tags.push("fight-here");
    }
    const mem = npc && npc.memory ? npc.memory : {};
    const favor = typeof mem.favorability === "number" ? mem.favorability : 0;
    if (npc && (npc.isGuide || npc._inParty || favor >= 40)) tags.push("rel:friend");
    else if (!mem.metPlayer) tags.push("rel:stranger");
    else tags.push("rel:acquaintance");
    // Where they are: at their own home, or at the building they work in.
    if (npc && room) {
        if (typeof isNPCHomeRoom === "function" && isNPCHomeRoom(room)) tags.push("at:home");
        else if (room.buildingName && typeof NPC_TIE_WORK_ROLES !== "undefined" && NPC_TIE_WORK_ROLES.indexOf(npc.role) >= 0) tags.push("at:work");
    }
    return tags;
}

// Works out what a reply is about. choices: the option objects (or one) the
// reply answers, each with id, label, promptText / text, typedText, contextNote.
// Returns { topic: tags from the options and their words, keywords: content
// words for overlap scoring, situation: tags for the moment }.
function getWantedNPCTags(npc, choices, room) {
    const list = Array.isArray(choices) ? choices : (choices ? [choices] : []);
    const topic = [];
    const texts = [];
    function add(tag) { if (tag && topic.indexOf(tag) < 0) topic.push(tag); }
    list.forEach(function (c) {
        if (!c) return;
        getNPCOptionTags(c.id).forEach(add);
        const typed = String(c.id || "").indexOf("respond-") === 0;
        const said = String(c.typedText || (typed ? c.promptText : "") || "");
        // A menu option's label and a typed line say what it is about; plain
        // menu options with a table entry are already tagged by id.
        if (said) { texts.push(said); getNPCTagsForText(said).forEach(add); }
        if (!getNPCOptionTags(c.id).length && c.label && !typed) { texts.push(String(c.label)); getNPCTagsForText(c.label).forEach(add); }
        if (c.contextNote) { texts.push(String(c.contextNote)); getNPCTagsForText(c.contextNote).forEach(add); }
    });
    const keywords = typeof _npcFactWords === "function" ? _npcFactWords(texts.join(" ")) : [];
    return { topic: topic, keywords: keywords, situation: getNPCSituationTags(npc, room) };
}

function _npcFactRecord(id, tags, text, weight, always) {
    return { id: id, tags: _npcMemoryTags(tags), text: String(text || ""), weight: typeof weight === "number" ? weight : 0, always: always === true };
}

// Turns the data an NPC already has into tagged records. Hidden facts are never
// included (only what the player has been told, or what is public).
// ── NPC PROFILE FACETS (looks, trade, home, people, values, lover) ────
// Turns the profile data an NPC already carries into tagged fact records, so
// the selector sends a facet only when the player's line is about it. In
// conversation prompts the persona block no longer sends the bulky ones (see
// buildNPCPersonaBlock, options.conversation), so nothing is sent twice.
const NPC_FACET_MAX = { looks: 320, kind: 240, values: 160 };

function _npcClipText(text, max) {
    const s = String(text || "").replace(/\s+/g, " ").trim();
    return s.length > max ? s.slice(0, max - 1).replace(/[ ,;]+$/, "") + "…" : s;
}

function _npcWithArticle(word) {
    const w = String(word || "").trim();
    return w ? (/^[aeiou]/i.test(w) ? "an " : "a ") + w : "";
}

// ── NPC ROUTINE FACETS (what a day is like: work, pay, meals, free hours) ──
// Descriptive only: nobody moves because of it (see the NPC Life design, step 4).
// Each role has duties, how it is paid (never a number), a shift for each part
// of the day [dawn, day, dusk, night] and a pastime. Roles not listed fall back
// to NPC_ROUTINE_DEFAULT; "home" in a shift means they would be at home or abed.
const NPC_ROUTINE_DEFAULT = {
    duties: "odd jobs and whatever honest work turns up",
    pay: "small coin for each job, or a meal and a roof",
    shifts: ["rising and finding the day's work", "working wherever there is work", "finishing up and looking for supper", "home"],
    pastime: "resting, and swapping news with neighbours"
};
const NPC_ROUTINES = {
    "Keeper of the Quiet": { duties: "keeping the mausoleum's register, identifying the departed, overseeing the vaults and commissioning memorial plaques", pay: "a settlement stipend and fees for engraved memorial plaques", shifts: ["checking the register and opening the receiving hall", "attending the receiving counter and keeping burial records", "checking the vaults and settling the day's records", "home"], pastime: "copying old names so they will not be forgotten" },
    "Vigil Tender": { duties: "tending the memorial gallery, cleaning the laying-out room, preparing shrouds and helping mourners", pay: "wages from the mausoleum keeper", shifts: ["cleaning the gallery and preparing linen", "tending lamps and helping visitors", "laying fresh coverings and trimming the vigil lamps", "home"], pastime: "tending a small pot of rosemary" },
    "Bier Bearer": { duties: "collecting the dead with a work partner, carrying the bier back to the mausoleum and laying the departed in numbered burial niches", pay: "a settlement stipend through the mausoleum keeper", shifts: ["checking the bier and straps before the first collection round", "collecting the dead and bringing them to the burial vaults together", "finishing the last collection and cleaning the carrying equipment", "home"], pastime: "sharing a quiet meal with a workmate" },
    Bathkeeper: { duties: "running the bathhouse, tending hot water and linen, offering washes and shoulder and back massage, and supervising practical trials", pay: "customer fees, with wages paid to attendants and qualified practitioners", shifts: ["warming water and setting out clean linen", "serving bathers and supervising staff", "finishing treatments and washing linen", "home"], pastime: "a quiet cup of herbal tea and news from travelers" },
    Matron: { duties: "running the bathhouse, tending hot water and linen, offering washes and shoulder and back massage, and supervising practical trials", pay: "customer fees, with wages paid to attendants and qualified practitioners", shifts: ["warming water and setting out clean linen", "serving bathers and supervising staff", "finishing treatments and washing linen", "home"], pastime: "a quiet cup of herbal tea and news from travelers" },
    Innkeeper: { duties: "running the inn: rooms, the common room, the cellar and keeping order", pay: "what guests pay for rooms and meals; you answer for the till", shifts: ["lighting the fires and starting the cooking", "settling rooms and keeping stock", "the common room fills and you keep the peace", "closing up, then bed"], pastime: "talking with regulars and tallying the week's takings" },
    Bartender: { duties: "pouring drinks, keeping the bar clean and watching the room", pay: "wages from the house plus whatever tips come over the bar", shifts: ["home", "cleaning and stocking the bar", "pouring for the evening crowd", "last pours, then clearing up"], pastime: "listening to the room's gossip" },
    Cook: { duties: "cooking for the house and keeping the pantry stocked", pay: "wages and your own meals from the kitchen", shifts: ["baking and prepping", "cooking the midday meal", "the supper rush", "scrubbing pots, then home"], pastime: "trying small changes to old recipes" },
    Servant: { duties: "carrying, cleaning, fetching and serving", pay: "a small wage, with meals and a bed", shifts: ["up first to light fires", "cleaning and fetching", "serving the evening meal", "banking the fires, then sleep"], pastime: "a quiet rest when the work lets you" },
    Clothier: { duties: "selling clothing, repairing wear, altering designs and reinforcing cloth and leather", pay: "clothing sales and quoted commissions paid in coin, with materials supplied by customers", shifts: ["setting out garments and dye pots at the market stall", "fitting customers and working on commissions", "finishing seams and tallying receipts", "home"], pastime: "studying dyes, fabrics and clever stitching" },
    Blacksmith: { duties: "forging, mending and sharpening iron and steel for the town", pay: "coin from customers and commissions, with ore bought as needed", shifts: ["lighting the forge", "at the anvil on orders and repairs", "banking the forge", "home"], pastime: "admiring good steel and arguing over it" },
    Shopkeeper: { duties: "keeping the shop, buying and selling goods and watching for thieves", pay: "the margin between what you buy and sell", shifts: ["opening up and checking stock", "serving customers", "tallying the day's sales", "home"], pastime: "haggling for the sport of it" },
    Vendor: { duties: "selling goods from a stall or a corner of the market", pay: "whatever your goods sell for, day by day", shifts: ["setting out the stall", "calling for customers", "packing up unsold stock", "home"], pastime: "watching the crowd go by" },
    Merchant: { duties: "buying and selling goods, and keeping accounts", pay: "profit on what you trade", shifts: ["checking the books", "dealing with buyers and sellers", "settling the day's accounts", "home"], pastime: "counting coin and comparing prices" },
    Trader: { duties: "carrying goods between places and selling them at a profit", pay: "profit on what you carry", shifts: ["loading up", "on the road or at the counter", "making camp or settling accounts", "resting"], pastime: "swapping road news" },
    "Wandering Merchant": { duties: "travelling with goods from place to place", pay: "profit on what you carry", shifts: ["breaking camp", "on the road or selling", "making camp", "resting by a fire"], pastime: "road stories" },
    "Shady Merchant": { duties: "moving goods that are easier to sell after dark than in daylight", pay: "a cut of every quiet sale", shifts: ["daylight hours spent out of sight", "slipping through back alleys at dusk", "hawking stock from the shadows at night", "gone by morning"], pastime: "counting coin where no one can see" },
    Healer: { duties: "tending the sick and the hurt, and preparing salves and herbs", pay: "coin or goods from patients, and charity where you must", shifts: ["gathering and preparing herbs", "seeing patients", "checking on the worst cases", "on call at the infirmary, dozing between patients"], pastime: "studying herbs" },
    Priest: { duties: "keeping the shrine, leading prayers and blessing those who ask", pay: "offerings and donations, and little else", shifts: ["morning prayers", "tending the shrine and counselling", "evening prayers", "keeping an all-night vigil at the shrine"], pastime: "quiet prayer and reading" },
    Archivist: { duties: "keeping records and books and helping those who come to read them", pay: "a stipend, and fees for searches", shifts: ["opening the stacks", "cataloguing and fetching", "closing the stacks", "home"], pastime: "reading what is not on the shelf" },
    Guildmaster: { duties: "running the guild: dues, contracts, members and quarrels", pay: "dues and a cut of contracts", shifts: ["reviewing the day's contracts", "meeting members and clients", "settling disputes", "home"], pastime: "scheming for the guild's good name" },
    Enchanter: { duties: "working enchantments on goods and gear", pay: "commissions paid in coin", shifts: ["preparing materials", "working on commissions", "cleaning up residues", "home"], pastime: "studying odd magic" },
    Arcanist: { duties: "studying and practising the arcane arts", pay: "commissions and patrons", shifts: ["reading", "experiments and commissions", "recording results", "late study"], pastime: "arguing theory" },
    Reliquarian: { duties: "keeping, appraising and trading sacred and odd relics", pay: "fees and sales", shifts: ["checking the cases", "appraising and selling", "locking up", "home"], pastime: "reading old inscriptions" },
    "Town Guard": { duties: "keeping the peace, watching the gates and answering complaints", pay: "a guard's wage from the town, paid in coin and grain", shifts: ["relieving the night watch", "patrolling and answering complaints", "walking the evening round", "off duty, or the night watch"], pastime: "dice and bad wine off duty" },
    "Stone Guard": { duties: "holding the gates and watching the ways in", pay: "keep and a wage from the city", shifts: ["relieving the night watch", "standing the gate", "the evening round", "off duty, or the night watch"], pastime: "polishing gear and grumbling" },
    Mason: { duties: "mending doors, walls and broken passages around the settlement, in timber and in stone", pay: "a settlement stipend, plus coin from anyone who wants their own repair done first", shifts: ["walking the streets to see what has cracked or been broken", "repairing doors and walls", "putting the tools away and noting what still needs doing", "home"], pastime: "arguing about mortar and timber over a drink" },
    Miner: { duties: "digging ore and stone and shoring the tunnels", pay: "a share of what the crew brings up", shifts: ["heading down", "digging", "hauling up and weighing the day's take", "home"], pastime: "drinking with the crew" },
    Scout: { duties: "watching the roads and reporting what moves on them", pay: "keep, and coin when the reports are good", shifts: ["checking the trails", "ranging out", "returning with news", "a cold camp or home"], pastime: "reading tracks" },
    Scavenger: { duties: "picking over ruins and wrecks for anything that sells", pay: "whatever you find and can sell", shifts: ["setting out", "searching", "hauling finds to sell", "hiding somewhere safe to sleep"], pastime: "sorting the day's finds" },
    Raider: { duties: "raiding for loot and keeping your band fed", pay: "your share of the plunder", shifts: ["planning the day's raid", "raiding or lying in wait", "dividing the spoils", "camp"], pastime: "boasting and gambling" },
    Cultist: { duties: "serving the cult's secret rites", pay: "no coin; the cult keeps you and promises more", shifts: ["private prayers", "quiet errands", "rites at dusk", "night rites"], pastime: "whispering with the faithful" },
    Pilgrim: { duties: "travelling to holy places and giving offerings", pay: "no wage; you live on alms and savings", shifts: ["breaking camp", "walking the road", "praying and finding a bed", "sleeping at a shrine or camp"], pastime: "prayer and old hymns" },
    Patron: { duties: "none; you are here to drink, eat and talk", pay: "you pay your own way", shifts: ["home", "about your own business", "at the tavern", "home or at the tavern"], pastime: "drinking and talk" },
    Guest: { duties: "none; you are passing through", pay: "you pay for your own room and meals", shifts: ["breakfast", "seeing the town", "supper", "your room"], pastime: "resting from the road" },
    Mercenary: { duties: "fighting for hire", pay: "coin per contract", shifts: ["checking gear", "looking for a contract", "drinking the day's earnings", "a bunk"], pastime: "dice and war stories" },
    Adventurer: { duties: "taking on dangerous jobs and bounties and delving for treasure", pay: "bounties and loot, which come irregularly", shifts: ["checking gear and the job board", "out on a job", "selling loot, then a drink at the tavern", "a bed at the inn"], pastime: "swapping tall tales" },
    Delver: { duties: "delving old ruins, vaults and tombs for relics and anything that sells", pay: "whatever the ruins give up, sold on quietly", shifts: ["checking rope, lamps and picks", "down in the ruins", "selling finds, then a drink", "a cheap bed or a cold camp"], pastime: "cleaning and appraising finds" },
    Scholar: { duties: "studying, copying and arguing over texts", pay: "a stipend or a patron's coin", shifts: ["reading before the day starts", "in the stacks", "talking the day's reading over with a drink", "candlelit reading, then bed"], pastime: "arguing over footnotes" },
    Wanderer: { duties: "drifting from place to place and taking odd work", pay: "odd coin for odd jobs", shifts: ["breaking camp", "walking or working", "at the tavern for supper and a drink", "a rough bed"], pastime: "road songs and stories" },
    Townsfolk: { duties: "everyday work in the town, whatever trade the day brings", pay: "a day's wage for a day's work, nothing more", shifts: ["rising and doing chores", "at your day's work", "at the tavern with neighbours, if you feel like a drink", "home"], pastime: "a drink and chat with neighbours at the tavern" },
    Villager: { duties: "everyday work in the village, tending animals, crops and home", pay: "you live on what you grow and sell", shifts: ["chores and feeding animals", "at the day's work", "at the tavern with neighbours, if you feel like a drink", "home"], pastime: "a drink and chat with neighbours" },
    // ========================================================================
    // BATHHOUSE WORKER ROLES
    // ========================================================================
    BathhouseAttendant: { duties: "assisting bathers, maintaining cleanliness, preparing oils and linens, and guiding guests to treatments", pay: "wages from bathhouse fees plus occasional tips from satisfied customers", shifts: ["preparing clean linens and fresh oils", "attending to bathers and maintaining facilities", "assisting with treatments and cleaning up", "home"], pastime: "relaxing with herbal tea and listening to traveler's stories" },
    BathhousePractitioner: { duties: "providing specialized treatments, massage, and private services to bathhouse guests", pay: "a percentage of service fees plus generous tips from regulars", shifts: ["preparing treatment chambers and oils", "providing services to booked guests", "resting between appointments", "home"], pastime: "studying anatomy and new techniques, or socializing with bathhouse regulars" }
};
// What each people eats, in a few plain words.
const NPC_SPECIES_FOOD = {
    Human: "bread, stew, cheese and ale",
    Elf: "bread, fruit, greens and light wine",
    Dwarf: "hearty stew, mushrooms, roast meat and strong ale",
    Halfling: "pies, bread, cheese and many small meals a day",
    Orc: "roast meat, hard bread and thick brews",
    Goblin: "scraps, stews of whatever is to hand and sour drink",
    Lizardfolk: "fish, raw or roasted meat and little else",
    Kobold: "scraps, grubs, roasted rats and whatever they can steal",
    Dragonborn: "roast meat, spiced dishes and strong drink",
    Catfolk: "fish, cream, small game and sweet pastries",
    Wolfkin: "rare meat, bone-broth and hard bread shared round the fire",
    Satyr: "wine, cheese, ripe fruit and whatever bread is left over",
    Harefolk: "clover, greens, root vegetables, seed-cake and sweet herb tea",
    Ratfolk: "grain, cheese rinds, roasted nuts and whatever the market throws out",
    Kenku: "seeds, nuts, beetles, tavern leftovers and anything shiny they swear is edible"
};

function _npcRoutineFor(npc) {
    return NPC_ROUTINES[npc && npc.role] || NPC_ROUTINE_DEFAULT;
}

// What this NPC would normally be doing at this hour: { phase, activity, where }.
// where is "home" or "out" (work, road or town). Descriptive; nobody is moved.
function getNPCRoutineNow(npc, turnOfDay) {
    const turn = typeof turnOfDay === "number" ? turnOfDay : (typeof getTurnOfDay === "function" ? getTurnOfDay() : 12);
    const phase = typeof getNPCTurnPhase === "function" ? getNPCTurnPhase(turn) : "day";
    const idx = { dawn: 0, day: 1, dusk: 2, night: 3 }[phase];
    const routine = _npcRoutineFor(npc);
    const activity = routine.shifts[idx] || NPC_ROUTINE_DEFAULT.shifts[idx];
    return { phase: phase, activity: activity, where: activity === "home" || /^home\b|a bed|your room|a bunk|rough bed|sleep/.test(activity) ? "home" : "out" };
}

function getNPCRoutineRecords(npc) {
    const records = [];
    if (!npc || npc.isHumanoid !== true || npc.isGuide) return records;
    const r = _npcRoutineFor(npc);
    const now = getNPCRoutineNow(npc);
    const names = ["dawn", "day", "dusk", "night"];
    records.push(_npcFactRecord("facet:duties", ["work", "money"],
        "- Your work: " + r.duties + ". How you are paid: " + r.pay + ". Never name a sum you were not given.", 0, false));
    const day = r.shifts.map(function (s, i) { return names[i] + ": " + (s === "home" ? "at home" : s); }).join("; ");
    records.push(_npcFactRecord("facet:day", ["routine"],
        "- A usual day for you (" + day + "). Right now it is " + now.phase + ", when you would usually be " + (now.activity === "home" ? "at home" : now.activity) + ".", 0, false));
    const food = NPC_SPECIES_FOOD[npc.species] || "plain food";
    records.push(_npcFactRecord("facet:meals", ["food"], "- What you eat: " + food + ".", 0, false));
    records.push(_npcFactRecord("facet:pastime", ["leisure"], "- In your free hours: " + r.pastime + ".", 0, false));
    return records;
}

function getNPCFacetRecords(npc, ctx, room) {
    const records = [];
    if (!npc) return records;
    const enr = npc.enrichment && typeof npc.enrichment === "object" ? npc.enrichment : {};
    const rm = room || (ctx && ctx.room) || null;

    // Looks and body: what they look like and how they move.
    const looks = [];
    const physicalTraits = buildNPCPhysicalSummary(npc);
    if (physicalTraits) looks.push(physicalTraits);
    const anatomy = npc.anatomy && typeof npc.anatomy === "object" ? npc.anatomy : {};
    const bodyBits = [];
    if (anatomy.size) bodyBits.push("size " + anatomy.size);
    if (anatomy.movement) bodyBits.push(anatomy.movement);
    if (bodyBits.length) looks.push(bodyBits.join(", "));
    if (looks.length) {
        records.push(_npcFactRecord("facet:looks", ["looks", "self"],
            "- Your looks (describe them only if asked or natural, and stay consistent): " + _npcClipText(looks.join("; "), NPC_FACET_MAX.looks), 0, false));
    }

    // Their people.
    const lore = npc.loreNotes || enr.speciesLore || "";
    if (lore) {
        records.push(_npcFactRecord("facet:kind", ["self", "kin"],
            "- Your people (" + (npc.species || "your kind") + "): " + _npcClipText(lore, NPC_FACET_MAX.kind), 0, false));
    }

    // What they value.
    const values = Array.isArray(enr.values) ? enr.values : [];
    if (values.length) {
        records.push(_npcFactRecord("facet:values", ["self"],
            "- What you value: " + _npcClipText(values.join(", "), NPC_FACET_MAX.values), 0, false));
    }

    // Trade and place of work. Names the building only while they stand in it.
    if (npc.isHumanoid === true && !npc.isGuide && npc.role) {
        const atWork = rm && rm.buildingName && typeof NPC_TIE_WORK_ROLES !== "undefined" && NPC_TIE_WORK_ROLES.indexOf(npc.role) >= 0;
        records.push(_npcFactRecord("facet:trade", ["work", "money"],
            "- Your trade: you are " + _npcWithArticle(String(npc.role).toLowerCase()) + (atWork ? " at " + rm.buildingName : "") + ". Speak about the work from experience, never with numbers you were not given.",
            0, false));
    }

    // Home.
    if (npc.isHumanoid === true && !npc.isGuide && npc._homeCoords && typeof G === "object" && G && G.roomMap && G.roomMap[npc._homeCoords]) {
        const homeRoom = G.roomMap[npc._homeCoords];
        records.push(_npcFactRecord("facet:home", ["home"],
            "- Your home: you keep a modest place of your own" + (homeRoom.zone ? " in " + homeRoom.zone : "") + " and go back to it to rest.", 0, false));
    }

    // Off duty at home: the shop or work is closed until they are back at their post.
    if (typeof isNPCOffDuty === "function" && isNPCOffDuty(npc, room || (ctx && ctx.room))) {
        records.push(_npcFactRecord("facet:hours", ["work", "money", "home"],
            "- You are at home and off duty; your work is shut until you are back at your post. If asked to trade, buy, sell or for your services, say it waits until then.", 1, false));
    }

    // An evening out: someone off the clock at a taproom or an inn's common room.
    const evRoom = room || (ctx && ctx.room) || null;
    if (typeof isPastimeNPC === "function" && isPastimeNPC(npc) && evRoom && typeof isPastimeRoom === "function" && isPastimeRoom(evRoom) &&
        typeof getTurnOfDay === "function" && getTurnOfDay() >= NPC_PASTIME_START) {
        records.push(_npcFactRecord("facet:evening", ["food", "leisure"],
            "- It is evening and you are here for a drink and company, off the clock; keep it easy and sociable.", 0.5, false));
    }

    // Daily routine: duties and pay, a usual day, meals, free hours.
    getNPCRoutineRecords(npc).forEach(function (r) { records.push(r); });

    // A lover who is not a spouse; shrugs off flirting the same way a spouse does.
    if (typeof getNPCLover === "function" && getNPCLover(npc)) {
        const lover = getNPCLover(npc);
        const shrug = typeof npcShrugsOffRomance === "function" && npcShrugsOffRomance(npc);
        records.push(_npcFactRecord("facet:lover", ["love", "mate"],
            "- You have a lover (" + (_npcWithArticle(String(lover.role || "someone").toLowerCase())) + ")." + (shrug
                ? " You politely turn aside flirting and do not respond to it."
                : " Drink or mood has loosened you; you may respond to flirting, awkwardly."), 3, true));
    }
    return records;
}

function getNPCFactRecords(npc, ctx, room, words) {
    const records = [];
    if (!npc) return records;

    // Their place in society, and what they have already told the player.
    if (typeof getNPCSocialPromptLines === "function") {
        String(getNPCSocialPromptLines(npc) || "").split("\n").forEach(function (line) {
            if (!line) return;
            const told = line.indexOf("already told the player") >= 0;
            records.push(told
                ? _npcFactRecord("social-told", ["told", "self"], line, 2, true)
                : _npcFactRecord("social-place", ["self", "work", "family"], line, 2, false));
        });
    }
    if (npc.tiesKnown && typeof getNPCTiesAnswer === "function") {
        const ties = getNPCTiesAnswer(npc);
        if (ties) records.push(_npcFactRecord("ties", ["family", "friend", "colleague", "kin", "work"], "- You have already told the player about the people in your life: " + String(ties).slice(0, 220), 0, false));
    }
    if (typeof getNPCPartner === "function" && getNPCPartner(npc)) {
        records.push(_npcFactRecord("partner", ["love", "family", "mate"], typeof npcShrugsOffRomance === "function" && npcShrugsOffRomance(npc)
            ? "You are married. You politely turn aside flirting and do not respond to it."
            : "You are married, but drink or mood has loosened you; you may respond to flirting, awkwardly.", 3, true));
    }

    // What the player has overheard in taverns (G.player.rumours, flagged lines
    // only). Weight 0: it only comes up when the talk is about rumours or news.
    const heardRumours = typeof G !== "undefined" && G && G.player && Array.isArray(G.player.rumours) ? G.player.rumours : [];
    if (heardRumours.length) {
        const recent = heardRumours.slice(-2).map(function (r) { return "\"" + String(r.text).slice(0, 120) + "\""; });
        records.push(_npcFactRecord("facet:overheard", ["rumor"],
            "- The player has mentioned overhearing in a tavern: " + recent.join(" and ") + ". You may know more, or know better; do not claim to have been there.", 0, false));
    }

    // Signed board notes this NPC actually read; a claim, not firsthand knowledge.
    const noticeNotes = npc.memory && Array.isArray(npc.memory.noticeNotes) ? npc.memory.noticeNotes : [];
    noticeNotes.forEach(function (note) {
        if (!note || !note.text) return;
        records.push(_npcFactRecord("notice:" + note.id, ["rumor"].concat(getNPCTagsForText(note.text)),
            "- You read a note at " + note.place + ", signed " + note.author + ": " + JSON.stringify(note.text) + ". This is the author's claim, not something you witnessed or verified.", 1, false));
    });

    // Local knowledge: lore this NPC knows.
    if (ctx && typeof getNPCKnownLoreFacts === "function" && typeof getWorldLoreFactText === "function") {
        const lore = typeof ensureWorldLore === "function" ? ensureWorldLore() : null;
        const seed = lore ? lore.seed : null;
        const told = npc.memory && npc.memory.loreTold ? npc.memory.loreTold : {};
        const known = getNPCKnownLoreFacts(npc, ctx);
        let anyOverlap = false;
        known.forEach(function (entry) {
            const text = getWorldLoreFactText(entry.fact, seed, entry.distorted);
            if (!text) return;
            const overlap = _npcFactOverlap(words, String(entry.fact.topic || "") + " " + text);
            if (overlap > 0) anyOverlap = true;
            const tags = ["rumor"].concat(getNPCTagsForText(String(entry.fact.topic || "") + " " + text));
            records.push(_npcFactRecord("lore:" + entry.fact.id, tags,
                "- Local knowledge (" + (entry.firsthand ? "knows firsthand" : "only heard secondhand") + "): " + String(text).slice(0, 260),
                (entry.firsthand ? 1 : 0.5) - (told[entry.fact.id] ? 2 : 0), false));
        });
        // With nothing matching the player's words, one fact they might ask about.
        if (!anyOverlap && typeof pickNPCLoreFact === "function") {
            const fallback = pickNPCLoreFact(npc, ctx, "topic");
            if (fallback) {
                const text = getWorldLoreFactText(fallback.fact, seed, fallback.distorted);
                if (text) records.push(_npcFactRecord("lore-fallback", ["rumor", "place"],
                    "- Local knowledge (" + (fallback.firsthand ? "knows firsthand" : "only heard secondhand") + "): " + String(text).slice(0, 260), 0.8, false));
            }
        }
    }

    // Recent events this speaker plausibly saw or heard about.
    if (typeof getNPCAwareStoryEvents === "function") {
        getNPCAwareStoryEvents(npc, { room: room || (ctx && ctx.room) }).slice(0, 3).forEach(function (ev, i) {
            const tags = ["rumor", "danger"].concat(ev.here ? ["fight-here"] : [], getNPCTagsForText(ev.text));
            records.push(_npcFactRecord("event:" + i, tags,
                "- Recent event (" + (ev.here ? "happened here" : "word has reached them") + "): " + String(ev.text || "").slice(0, 160), ev.here ? 1.5 : 1, false));
        });
    }

    // Profile facets: looks, people, values, trade, home, lover.
    if (typeof getNPCFacetRecords === "function") {
        try { getNPCFacetRecords(npc, ctx, room).forEach(function (r) { records.push(r); }); } catch (facetErr) { console.warn("[NPC Facets] failed", facetErr); }
    }

    // Who else is here, by name and trade.
    const rm = room || (ctx && ctx.room) || null;
    if (rm && Array.isArray(rm.creatures)) {
        const others = rm.creatures.filter(function (c) {
            return c && c !== npc && !c.dead && !c.unconscious && c.isHumanoid === true && (c.name || c.descriptorName);
        }).slice(0, 3).map(function (c) { return (c.name || c.descriptorName) + (c.role ? " (" + c.role + ")" : ""); });
        if (others.length) records.push(_npcFactRecord("others", ["place"], "- Others here: " + others.join(", "), 0.6, false));
    }
    return records;
}

// Ranks records against the wanted tags and keeps the best few inside the
// budget. Returns [{ rec, score, matched }] in the order they should be sent
// (always-records first); everything not sent is in .dropped for debugging.
function selectNPCFacts(records, wanted, budget) {
    const b = budget || NPC_FACT_BUDGET;
    const topicWanted = wanted && Array.isArray(wanted.topic) ? wanted.topic : [];
    const sitWanted = wanted && Array.isArray(wanted.situation) ? wanted.situation : [];
    const words = wanted && Array.isArray(wanted.keywords) ? wanted.keywords : [];
    const specific = topicWanted.length > 0 || words.length > 0;
    const scored = (records || []).map(function (rec) {
        let overlap = 0;
        let sit = 0;
        (rec.tags || []).forEach(function (t) {
            if (topicWanted.indexOf(t) >= 0) overlap += 1;
            if (sitWanted.indexOf(t) >= 0) sit += 1;
        });
        const kw = typeof _npcFactOverlap === "function" ? _npcFactOverlap(words, rec.text) : 0;
        // The speaker's own facts (facet:*) outrank hearsay and lore once their topic is asked about.
        const facetBonus = overlap > 0 && String(rec.id).indexOf("facet:") === 0 ? 4 : 0;
        return { rec: rec, score: overlap * 3 + sit * 1.5 + kw * 3 + rec.weight + facetBonus, matched: overlap > 0 || kw > 0 || sit > 0 };
    });
    const picked = scored.filter(function (s) { return s.rec.always; });
    let chars = picked.reduce(function (sum, s) { return sum + s.rec.text.length; }, 0);
    const rest = scored.filter(function (s) { return !s.rec.always && (s.matched || (!specific && s.rec.weight > 0)); })
        .sort(function (a, c) { return c.score - a.score; });
    let lines = 0;
    rest.forEach(function (s) {
        if (lines >= b.maxLines || chars + s.rec.text.length > b.maxChars) return;
        picked.push(s);
        lines += 1;
        chars += s.rec.text.length;
    });
    picked.dropped = scored.filter(function (s) { return picked.indexOf(s) < 0; });
    return picked;
}

// The whole pipeline: wanted tags -> records -> selection. Returns
// { wanted, picked, lines } so callers (and tests) can see why.
function getNPCFactSelection(npc, ctx, room, choices, playerTexts) {
    const wanted = getWantedNPCTags(npc, choices, room);
    if (!wanted.keywords.length && Array.isArray(playerTexts) && playerTexts.length && typeof _npcFactWords === "function") {
        wanted.keywords = _npcFactWords(playerTexts.join(" "));
        getNPCTagsForText(playerTexts.join(" ")).forEach(function (t) { if (wanted.topic.indexOf(t) < 0) wanted.topic.push(t); });
    }
    const records = getNPCFactRecords(npc, ctx, room, wanted.keywords);
    const picked = selectNPCFacts(records, wanted, NPC_FACT_BUDGET);
    return { wanted: wanted, picked: picked, lines: picked.map(function (s) { return s.rec.text; }) };
}

// ── NPC MEMORY (tagged, importance-ranked, capped) ───────────────────
// Durable per-NPC memory of the player, kept in npc.memory.memoryEntries.
// Each entry: { id, tags[], text, importance 1-10, turn, pinned, count }.
//   - Over the cap, the lowest-importance entry is dropped (oldest first among
//     equals). The newest NPC_MEMORY_PROTECT_NEWEST entries cannot be evicted,
//     so fresh small talk is not purged the moment it is written.
//   - The same id again merges into the existing entry (count + 1) instead of
//     adding a new one; a repeated act gains importance at 3 and 6 repeats.
//   - Pinned entries (the guide's told ledger) sit outside the cap.
//   - Entries tagged "told" form the told ledger: what this NPC has already
//     said, so it is not repeated as if new.
// The cap grows with the relationship (stranger < acquaintance < close) and
// never shrinks once earned. Mobs and other non-humanoids remember nothing.
// Callers go through addNPCMemory / getNPCRelevantMemories / getNPCToldMemories
// only, so the storage can later move behind a server without touching them.
const NPC_MEMORY_CAPS = { stranger: 10, acquaintance: 18, close: 32 };
const NPC_MEMORY_TIER_ORDER = ["stranger", "acquaintance", "close"];
const NPC_MEMORY_PROTECT_NEWEST = 3;
const NPC_MEMORY_PINNED_MAX = 40;
const NPC_MEMORY_TEXT_MAX = 140;
const NPC_MEMORY_IMPORTANCE_DEFAULT = 3;
// Verbatim recent lines (npc.memory.recentLines) expire by story turns, not
// real minutes, so a pause or a walk away does not wipe the conversation.
const NPC_RECENT_LINE_TURNS = 30;
const NPC_MEMORY_INTENT_PHRASES = {
    flattery: "flattered you",
    insult: "insulted you",
    aggression: "pressed you sharply",
    empathy: "showed you kindness",
    help: "offered you help",
    calm: "tried to calm you",
    apology: "apologised to you",
    curious: "asked you something",
    bold: "spoke boldly to you",
    introduction: "asked who you are",
    tease: "teased you"
};
let _npcMemoryTypedSeq = 0;

function _npcMemoryNow() {
    return typeof getCurrentStoryTurn === "function" ? getCurrentStoryTurn() : 0;
}

function _npcMemoryClip(text, max) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    return clean.length > max ? clean.slice(0, Math.max(0, max - 1)).trim() + "…" : clean;
}

function _npcMemoryTags(list) {
    const out = [];
    (Array.isArray(list) ? list : []).forEach(function (tag) {
        const t = String(tag || "").toLowerCase().trim();
        if (t && out.indexOf(t) < 0 && out.length < 8) out.push(t);
    });
    return out;
}

function ensureNPCMemoryEntries(npc) {
    if (!npc) return null;
    if (!npc.memory || typeof npc.memory !== "object") npc.memory = {};
    if (!Array.isArray(npc.memory.memoryEntries)) npc.memory.memoryEntries = [];
    return npc.memory.memoryEntries;
}

// "none" (remembers nothing), "stranger", "acquaintance" or "close". The tier
// is a high-water mark: a friend who falls out of favour keeps their room.
function getNPCMemoryTier(npc) {
    if (!npc || npc.isHumanoid !== true) return "none";
    const mem = npc.memory && typeof npc.memory === "object" ? npc.memory : {};
    const favor = typeof mem.favorability === "number" ? mem.favorability : 0;
    let tier = "stranger";
    if (npc.isGuide || npc._inParty || favor >= 40) tier = "close";
    else if (mem.metPlayer === true && Math.abs(favor) >= 10) tier = "acquaintance";
    const earned = NPC_MEMORY_TIER_ORDER.indexOf(mem.memoryTier);
    if (earned > NPC_MEMORY_TIER_ORDER.indexOf(tier)) tier = NPC_MEMORY_TIER_ORDER[earned];
    return tier;
}

function getNPCMemoryCap(npc) {
    const tier = getNPCMemoryTier(npc);
    return NPC_MEMORY_CAPS[tier] || 0;
}

function _npcMemoryEvict(npc, list) {
    const cap = NPC_MEMORY_CAPS[npc.memory.memoryTier] || 0;
    let pinned = list.filter(function (e) { return e && e.pinned; });
    while (pinned.length > NPC_MEMORY_PINNED_MAX) {
        list.splice(list.indexOf(pinned[0]), 1);
        pinned = pinned.slice(1);
    }
    for (;;) {
        const free = list.filter(function (e) { return e && !e.pinned; });
        if (free.length <= cap) break;
        const candidates = free.slice(0, Math.max(0, free.length - NPC_MEMORY_PROTECT_NEWEST));
        if (!candidates.length) break;
        let victim = candidates[0];
        for (let i = 1; i < candidates.length; i++) {
            if (candidates[i].importance < victim.importance) victim = candidates[i];
        }
        list.splice(list.indexOf(victim), 1);
    }
}

// W1: bounded recent recollections alongside the unchanged long-term API.
const NPC_SHORT_MEMORY_MAX = 50;
const NPC_MEMORY_HALF_LIFE = 40;
const NPC_ENTITY_MEMORY_MAX = 12; // other NPCs; the player has a reserved slot
const npcMemoryLifeValidated = new WeakSet();

function getNPCMemoryWeight(entry, now) {
    const turn = typeof now === "number" ? now : _npcMemoryNow();
    return (Number(entry && entry.importance) || 1) - Math.max(0, turn - (Number(entry && entry.turn) || 0)) / NPC_MEMORY_HALF_LIFE;
}

function npcMemorySubjectId(subject) {
    if (!subject || typeof G === "undefined" || subject === G.player) return "player";
    return subject.id && subject.isHumanoid === true ? "npc:" + String(subject.id).slice(0, 80) : "";
}

function npcMemoryLifeEntry(entry) {
    if (!entry || typeof entry.text !== "string" || !entry.text.trim()) return null;
    const id = typeof entry.id === "string" ? entry.id.slice(0, 60) : "";
    if (!id) return null;
    return { id: id, subjectId: entry.subjectId === "player" || /^npc:.{1,80}$/.test(entry.subjectId || "") ? entry.subjectId : "player",
        text: _npcMemoryClip(entry.text, 140), tags: _npcMemoryTags(entry.tags).map(function (t) { return t.slice(0, 24); }),
        importance: Math.max(1, Math.min(10, Math.round(Number(entry.importance)) || 2)),
        turn: Math.max(0, Math.min(_npcMemoryNow(), Number(entry.turn) || 0)),
        count: Math.max(1, Math.min(1000000, Math.round(Number(entry.count)) || 1)),
        references: Math.max(0, Math.min(1000000, Math.round(Number(entry.references)) || 0)) };
}

function ensureNPCMemoryLife(npc) {
    if (!npc || npc.isHumanoid !== true) return null;
    ensureNPCMemoryEntries(npc);
    const m = npc.memory;
    if (npcMemoryLifeValidated.has(m) && Array.isArray(m.shortTerm) && m.entities && typeof m.entities === "object") return m;
    m.shortTerm = (Array.isArray(m.shortTerm) ? m.shortTerm : []).slice(-50).map(npcMemoryLifeEntry).filter(Boolean);
    const old = m.entities && typeof m.entities === "object" && !Array.isArray(m.entities) ? m.entities : {};
    m.entities = Object.create(null);
    const keys = Object.keys(old).filter(function (key) { return /^npc:.{1,80}$/.test(key); }).slice(0, 12);
    if (Object.prototype.hasOwnProperty.call(old, "player")) keys.unshift("player");
    keys.forEach(function (key) {
        const r = old[key];
        if (!r || typeof r !== "object" || Array.isArray(r)) return;
        m.entities[key] = { id: key, label: typeof r.label === "string" ? _npcMemoryClip(r.label, 80) : "someone",
            timesMet: Math.max(0, Math.min(1000000, Math.round(Number(r.timesMet)) || 0)),
            firstTurn: Math.max(0, Math.min(_npcMemoryNow(), Number(r.firstTurn) || 0)),
            lastTurn: Math.max(0, Math.min(_npcMemoryNow(), Number(r.lastTurn) || 0)),
            nameKnown: r.nameKnown === true, openPromises: key === "player" && typeof getNPCOpenCommitmentIds === "function" ? getNPCOpenCommitmentIds(npc) : [],
            summary: typeof r.summary === "string" ? _npcMemoryClip(r.summary, 300) : "",
            notable: (Array.isArray(r.notable) ? r.notable : []).filter(function (s) { return typeof s === "string" && s.trim(); }).slice(0, 4).map(function (s) { return _npcMemoryClip(s, 80); }),
            feeling: ["warm", "friendly", "neutral", "wary", "cold", "hostile"].indexOf(r.feeling) >= 0 ? r.feeling : "neutral",
            revision: Math.max(0, Math.min(1000000, Math.round(Number(r.revision)) || 0)),
            encounterKey: typeof r.encounterKey === "string" ? r.encounterKey.slice(0, 80) : "" };
    });
    m.memoryLifeSeq = Math.max(0, Math.min(1000000000, Math.round(Number(m.memoryLifeSeq)) || 0));
    m.memoryLifeSeen = m.memoryLifeSeen === true || m.metPlayer === true;
    m.memoryLifeVersion = 1;
    npcMemoryLifeValidated.add(m);
    return m;
}

function ensureNPCEntityMemory(npc, subject) {
    const m = ensureNPCMemoryLife(npc), id = npcMemorySubjectId(subject);
    if (!m || !id || subject === npc) return null;
    if (!m.entities[id]) {
        const others = Object.keys(m.entities).filter(function (key) { return key !== "player"; });
        if (id !== "player" && others.length >= NPC_ENTITY_MEMORY_MAX) {
            others.sort(function (a, b) { return m.entities[a].lastTurn - m.entities[b].lastTurn; });
            const forgotten = others[0];
            // Drop the least recently encountered person's bounded history.
            // This bound applies to recollections, never to engine commitments.
            m.shortTerm = m.shortTerm.filter(function (entry) { return entry.subjectId !== forgotten; });
            delete m.entities[forgotten];
        }
        m.entities[id] = { id: id, label: id === "player" ? "the player" : _npcMemoryClip(subject.name || "someone", 80),
            timesMet: 0, firstTurn: _npcMemoryNow(), lastTurn: _npcMemoryNow(), nameKnown: false, openPromises: [],
            summary: "", notable: [], feeling: "neutral", revision: 0, encounterKey: "" };
    }
    return m.entities[id];
}

function recordNPCEntityEncounter(npc, subject, options) {
    const r = ensureNPCEntityMemory(npc, subject);
    if (!r) return null;
    const o = options || {};
    const key = typeof o.encounterKey === "string" ? o.encounterKey.slice(0, 80) : "turn:" + _npcMemoryNow();
    if (r.encounterKey !== key) { r.timesMet = Math.min(1000000, r.timesMet + 1); r.encounterKey = key; }
    r.lastTurn = _npcMemoryNow();
    if (o.nameKnown === true) { r.nameKnown = true; r.label = _npcMemoryClip(subject && subject.name || r.label, 80); }
    r.revision += 1;
    return r;
}

function foldNPCEntityMemory(npc, subjectId, entries) {
    const m = ensureNPCMemoryLife(npc);
    const r = m && m.entities[subjectId];
    if (!r || !Array.isArray(entries) || !entries.length) return null;
    const ordered = entries.filter(function (e) { return e && typeof e.text === "string"; }).map(function (e, index) { return { entry: e, index: index }; }).sort(function (a, b) {
        return b.entry.turn - a.entry.turn || b.index - a.index;
    }).map(function (row) { return row.entry; });
    if (!ordered.length) return r;
    const fresh = ordered.slice(0, 2).map(function (e) { return e.text; }).join(" ");
    r.summary = _npcMemoryClip(fresh + (r.summary && r.summary.indexOf(fresh) !== 0 ? " Earlier: " + r.summary : ""), 300);
    const important = ordered.filter(function (e) { return e.importance >= 5 || e.count >= 3 || e.references >= 2; })
        .sort(function (a, b) { return b.importance - a.importance || b.turn - a.turn; }).map(function (e) { return _npcMemoryClip(e.text, 80); });
    r.notable = important.concat(r.notable).filter(function (s, i, all) { return all.indexOf(s) === i; }).slice(0, 4);
    if (subjectId === "player") {
        const favor = npc.memory.favorability || 0, hostility = npc.hostility || 0;
        r.feeling = hostility >= 70 ? "hostile" : hostility >= 45 ? "wary" : favor <= -20 ? "cold" : favor >= 40 ? "warm" : favor >= 10 ? "friendly" : "neutral";
    }
    r.revision += 1;
    return r;
}

function forgetNPCShortTermEntries(npc, entries, force) {
    const groups = Object.create(null);
    entries.forEach(function (entry) { (groups[entry.subjectId] || (groups[entry.subjectId] = [])).push(entry); });
    Object.keys(groups).forEach(function (id) {
        foldNPCEntityMemory(npc, id, groups[id]); // durable fallback before any AI work
        if (typeof queueNPCMemoryFold === "function") queueNPCMemoryFold(npc, id, groups[id], force === true);
    });
}

function promoteNPCShortTermMemory(npc, entry) {
    if (entry.importance < 7 && entry.count < 3 && entry.references < 2) return;
    if (npc.memory.memoryEntries.some(function (e) { return e.id === entry.id; })) return;
    addNPCMemory(npc, { id: "life:" + entry.id, text: entry.text, tags: entry.tags,
        importance: Math.max(4, entry.importance), shortTerm: false });
}

function addNPCShortTermMemory(npc, entry) {
    if (!npc || !entry || npc.isHumanoid !== true || !npc.memory || !(npc.memory.metPlayer || npc.memory.memoryLifeSeen || entry.conversation === true)) return null;
    const m = ensureNPCMemoryLife(npc), r = ensureNPCEntityMemory(npc, entry.subject);
    if (!r) return null;
    m.memoryLifeSeen = true;
    const clean = npcMemoryLifeEntry(Object.assign({}, entry, { id: entry.id || "recent-" + (++m.memoryLifeSeq), subjectId: r.id, turn: _npcMemoryNow() }));
    if (!clean) return null;
    r.lastTurn = _npcMemoryNow(); r.revision += 1;
    const existing = m.shortTerm.find(function (e) { return e.subjectId === clean.subjectId && (e.id === clean.id || e.text === clean.text); });
    if (existing) {
        existing.text = clean.text; existing.turn = clean.turn;
        existing.count = Math.min(1000000, existing.count + 1);
        existing.importance = Math.max(existing.importance, clean.importance);
        existing.tags = _npcMemoryTags(existing.tags.concat(clean.tags));
        m.shortTerm.splice(m.shortTerm.indexOf(existing), 1); m.shortTerm.push(existing);
        if (entry.promote !== false) promoteNPCShortTermMemory(npc, existing);
        return existing;
    }
    m.shortTerm.push(clean);
    if (entry.promote !== false) promoteNPCShortTermMemory(npc, clean);
    while (m.shortTerm.length > NPC_SHORT_MEMORY_MAX) {
        let victim = m.shortTerm[0];
        m.shortTerm.forEach(function (e) { if (getNPCMemoryWeight(e) < getNPCMemoryWeight(victim)) victim = e; });
        m.shortTerm.splice(m.shortTerm.indexOf(victim), 1);
        forgetNPCShortTermEntries(npc, [victim], false);
    }
    return clean;
}

function getNPCShortTermMemories(npc, wantedTags, max, subjectIds) {
    const list = npc && npc.memory && Array.isArray(npc.memory.shortTerm) ? npc.memory.shortTerm : [];
    const wanted = Array.isArray(wantedTags) ? wantedTags : [];
    const subjects = Array.isArray(subjectIds) ? subjectIds : ["player"];
    return list.filter(function (e) { return e && e.text && subjects.indexOf(e.subjectId || "player") >= 0; }).slice().sort(function (a, b) {
        const score = function (e) { return getNPCMemoryWeight(e) + (e.tags || []).filter(function (t) { return wanted.indexOf(t) >= 0; }).length * 3; };
        return score(b) - score(a) || b.turn - a.turn;
    }).slice(0, typeof max === "number" ? max : 4);
}

function referenceNPCShortTermMemory(npc, tags) {
    if (!npc || !npc.memory || !Array.isArray(npc.memory.shortTerm) || !Array.isArray(tags) || !tags.length) return;
    const entry = getNPCShortTermMemories(npc, tags, 1)[0];
    if (entry && (entry.tags || []).some(function (t) { return tags.indexOf(t) >= 0; })) {
        entry.references = Math.min(1000000, (entry.references || 0) + 1);
        promoteNPCShortTermMemory(npc, entry);
    }
}

function trimNPCShortTermMemory(npc) {
    if (!npc || !npc.memory || !Array.isArray(npc.memory.shortTerm) || !npc.memory.shortTerm.length) return;
    const m = ensureNPCMemoryLife(npc), entries = m.shortTerm.slice();
    m.shortTerm.length = 0;
    forgetNPCShortTermEntries(npc, entries, true);
}

// Adds or merges one memory. Returns the stored entry, or null when this NPC
// cannot remember (not humanoid, or the entry is empty).
function addNPCMemory(npc, entry) {
    if (!npc || !entry) return null;
    const id = String(entry.id || "").trim().slice(0, 60);
    const text = _npcMemoryClip(entry.text, NPC_MEMORY_TEXT_MAX);
    if (!id || !text) return null;
    const tier = getNPCMemoryTier(npc);
    if (tier === "none") return null;
    const list = ensureNPCMemoryEntries(npc);
    npc.memory.memoryTier = tier;

    const turn = _npcMemoryNow();
    const rawImportance = Math.round(Number(entry.importance));
    const importance = Math.min(10, Math.max(1, isNaN(rawImportance) ? NPC_MEMORY_IMPORTANCE_DEFAULT : rawImportance));
    const tags = _npcMemoryTags(entry.tags);
    if (entry.shortTerm !== false) addNPCShortTermMemory(npc, { id: id, text: text, importance: importance, tags: tags, subject: entry.subject, promote: false });

    const at = list.findIndex(function (e) { return e && e.id === id; });
    if (at >= 0) {
        const existing = list.splice(at, 1)[0];
        existing.count = (typeof existing.count === "number" ? existing.count : 1) + 1;
        existing.turn = turn;
        existing.text = text;
        existing.importance = Math.max(existing.importance || 1, importance);
        if ((existing.count === 3 || existing.count === 6) && existing.importance < 8) existing.importance += 1;
        existing.tags = _npcMemoryTags((existing.tags || []).concat(tags));
        if (entry.pinned === true) existing.pinned = true;
        list.push(existing);
        return existing;
    }

    const created = { id: id, tags: tags, text: text, importance: importance, turn: turn, pinned: entry.pinned === true, count: 1 };
    list.push(created);
    _npcMemoryEvict(npc, list);
    return created;
}

// The told ledger: "I told them about X". Pinned for the guide, capped like any
// other memory for everyone else.
function registerNPCToldMemory(npc, key, text, opts) {
    const o = opts || {};
    return addNPCMemory(npc, {
        id: "told:" + key,
        tags: ["told"].concat(o.tags || []),
        text: text,
        importance: typeof o.importance === "number" ? o.importance : 4,
        pinned: o.pinned === true,
        shortTerm: o.shortTerm
    });
}

// Best memories for a reply. wantedTags (optional) steers the pick: an entry
// that shares no tag is skipped unless it is important (6+). Told-ledger
// entries are excluded (see getNPCToldMemories) unless includeTold is set.
function getNPCRelevantMemories(npc, wantedTags, opts) {
    const o = opts || {};
    const list = npc && npc.memory && Array.isArray(npc.memory.memoryEntries) ? npc.memory.memoryEntries : [];
    if (!list.length) return [];
    const wanted = _npcMemoryTags(wantedTags);
    const max = typeof o.max === "number" ? o.max : 4;
    const minImportance = typeof o.minImportance === "number" ? o.minImportance : 0;
    const now = _npcMemoryNow();
    const scored = [];
    list.forEach(function (e) {
        if (!e || !e.text) return;
        const isTold = (e.tags || []).indexOf("told") >= 0;
        if (isTold && o.includeTold !== true) return;
        if (e.importance < minImportance) return;
        let overlap = 0;
        (e.tags || []).forEach(function (t) { if (wanted.indexOf(t) >= 0) overlap += 1; });
        if (wanted.length && !overlap && e.importance < 6) return;
        const recency = now > 0 ? Math.min(1, (e.turn || 0) / now) : 0;
        scored.push({ entry: e, score: overlap * 3 + e.importance + Math.min(e.count || 1, 5) * 0.2 + recency });
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, max).map(function (s) { return s.entry; });
}

// What this NPC has already told the player, oldest first.
function getNPCToldMemories(npc, max) {
    const list = npc && npc.memory && Array.isArray(npc.memory.memoryEntries) ? npc.memory.memoryEntries : [];
    const told = list.filter(function (e) { return e && e.text && (e.tags || []).indexOf("told") >= 0; });
    return told.slice(-(typeof max === "number" ? max : 8));
}

function serializeNPCMemory(npc) {
    const list = npc && npc.memory && Array.isArray(npc.memory.memoryEntries) ? npc.memory.memoryEntries : [];
    const data = { tier: npc && npc.memory ? npc.memory.memoryTier || "" : "", entries: list };
    if (npc && npc.memory && npc.memory.memoryLifeVersion) {
        const m = ensureNPCMemoryLife(npc);
        data.life = { version: 1, seen: m.memoryLifeSeen, seq: m.memoryLifeSeq, shortTerm: m.shortTerm, entities: m.entities };
    }
    return JSON.parse(JSON.stringify(data));
}

function loadNPCMemory(npc, data) {
    if (!npc || !data || !Array.isArray(data.entries)) return false;
    const list = ensureNPCMemoryEntries(npc);
    list.length = 0;
    data.entries.forEach(function (e) {
        if (!e || !e.id || !e.text) return;
        list.push({
            id: String(e.id), tags: _npcMemoryTags(e.tags), text: _npcMemoryClip(e.text, NPC_MEMORY_TEXT_MAX),
            importance: Math.min(10, Math.max(1, Math.round(Number(e.importance)) || NPC_MEMORY_IMPORTANCE_DEFAULT)),
            turn: typeof e.turn === "number" ? e.turn : 0, pinned: e.pinned === true,
            count: typeof e.count === "number" ? e.count : 1
        });
    });
    if (NPC_MEMORY_TIER_ORDER.indexOf(data.tier) >= 0) npc.memory.memoryTier = data.tier;
    ["shortTerm", "entities", "memoryLifeSeq", "memoryLifeSeen", "memoryLifeVersion"].forEach(function (key) { delete npc.memory[key]; });
    npcMemoryLifeValidated.delete(npc.memory);
    if (data.life && data.life.version === 1) {
        npc.memory.shortTerm = data.life.shortTerm; npc.memory.entities = data.life.entities;
        npc.memory.memoryLifeSeq = data.life.seq; npc.memory.memoryLifeSeen = data.life.seen === true;
        ensureNPCMemoryLife(npc);
    }
    return true;
}

function _npcMemoryImportanceFromImpact(impact) {
    const src = impact && typeof impact === "object" ? impact : {};
    const m = Math.max(Math.abs(Number(src.favor) || 0), Math.abs(Number(src.hostility) || 0));
    let value = m >= 8 ? 6 : m >= 5 ? 5 : m >= 3 ? 4 : m >= 1 ? 3 : 2;
    if (Number(src.aggression) >= 1) value += 1;
    return Math.min(8, value);
}

// Writes a memory for a conversation choice, from its id, intent and impact -
// no AI call. Catalogue entries may carry memory: { importance, tags, text,
// skip }. Greetings and farewells are not worth remembering (metPlayer already
// covers them). Intimacy and encounter options belong to the nsfw layer, which
// writes its own memories, so they are ignored here. Internal calls with no
// label or text (guide and social-fact handlers) write their own told entries.
function recordNPCConversationMemory(npc, choice) {
    if (!npc || !choice) return null;
    if (choice.action === "intimacy" || choice.startEncounter || choice.intimacyAction) return null;
    const optionId = String(choice.id || "").trim();
    if (!optionId) return null;
    const intent = String(choice.intent || "").toLowerCase();
    if (intent === "greeting" || intent === "goodbye" || optionId.indexOf("greet") === 0 || optionId === "goodbye") return null;
    const spec = choice.memory && typeof choice.memory === "object" ? choice.memory : {};
    if (spec.skip === true) return null;

    const typed = optionId.indexOf("respond-typed-") === 0 || optionId.indexOf("respond-canned-") === 0;
    if (typed) {
        const said = String(choice.typedText || choice.promptText || "").trim();
        if (!said) return null;
        _npcMemoryTypedSeq += 1;
        return addNPCMemory(npc, {
            id: "said-" + _npcMemoryNow() + "-" + _npcMemoryTypedSeq,
            tags: ["said"].concat(getNPCTagsForText(said)),
            text: "The player said: \"" + _npcMemoryClip(said, 100) + "\"",
            importance: typeof spec.importance === "number" ? spec.importance : 2, shortTerm: false
        });
    }

    const label = String(choice.label || choice.promptText || choice.text || "").trim();
    if (!label) return null;
    const phrase = NPC_MEMORY_INTENT_PHRASES[intent] || "said something to you";
    const text = typeof spec.text === "string" && spec.text
        ? spec.text
        : "The player " + phrase + ": \"" + _npcMemoryClip(label, 80) + "\"";
    return addNPCMemory(npc, {
        id: "did-" + (typeof spec.id === "string" && spec.id ? spec.id : optionId),
        tags: [intent || "talk"].concat(Array.isArray(spec.tags) ? spec.tags : [], getNPCOptionTags(optionId), NPC_INTENT_MEMORY_KINDS[intent] || []),
        text: text,
        importance: typeof spec.importance === "number" ? spec.importance : _npcMemoryImportanceFromImpact(choice.relationshipImpact), shortTerm: false
    });
}

// Annotations from an ordinary reply that was actually spoken. These describe
// conversation, never settled world facts or completed offers. The engine owns
// validation/execution of future commitments; offer/agree are deliberately unused.
function recordNPCReplyMemory(npc, choice, extras, playerInput, responseText) {
    if (!npc || !choice || !extras || !responseText) return;
    if (choice.action === "intimacy" || choice.startEncounter || choice.intimacyAction) return;
    if (choice.memory && choice.memory.skip === true) return;
    const tags = extras.mem && Array.isArray(extras.mem.tags) ? extras.mem.tags.slice(0, 3) : [];
    const topics = typeof getNPCTagsForText === "function" ? getNPCTagsForText(playerInput) : [];
    referenceNPCShortTermMemory(npc, topics);
    const session = npc.memory && npc.memory.conversationState;
    const player = typeof G !== "undefined" && G.player;
    const playerName = player && typeof player.name === "string" ? player.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";
    const introduced = playerName && new RegExp("\\b(?:my name is|i am|i'm|call me)\\s+" + playerName + "(?=$|[\\s,.!?])", "i").test(String(playerInput || ""));
    recordNPCEntityEncounter(npc, player, { encounterKey: session ? "talk:" + session.sessionNumber : "turn:" + _npcMemoryNow(), nameKnown: !!introduced });
    addNPCShortTermMemory(npc, { conversation: true, text: "Player: " + _npcMemoryClip(playerInput, 60) + " / Replied: " + _npcMemoryClip(responseText, 60),
        tags: ["said"].concat(tags.length ? tags : topics), importance: extras.mem ? extras.mem.importance : 2 });
    if (Array.isArray(extras.told)) extras.told.slice(0, 2).forEach(function (text) {
        if (typeof text !== "string" || !text.trim()) return;
        const clean = _npcMemoryClip(text, 140);
        // Stable compact key: the same summary survives cache/save round trips
        // as one told entry instead of growing an unbounded fact dictionary.
        const canonical = clean.toLowerCase().replace(/[.!?]+$/, "").trim();
        let hash = 2166136261;
        for (let i = 0; i < canonical.length; i++) hash = Math.imul(hash ^ canonical.charCodeAt(i), 16777619);
        registerNPCToldMemory(npc, "reply-" + (hash >>> 0).toString(36), "Said: " + clean, { importance: 4, tags: tags, shortTerm: false });
    });
    if (extras.mem && typeof extras.mem.importance === "number" && Number.isFinite(extras.mem.importance)) {
        const list = ensureNPCMemoryEntries(npc);
        let id;
        do { id = "reply-" + _npcMemoryNow() + "-" + (++_npcMemoryTypedSeq); }
        while (list.some(function (entry) { return entry.id === id; }));
        addNPCMemory(npc, { id: id, importance: extras.mem.importance, tags: ["said"].concat(tags), shortTerm: false,
            text: "Player: " + _npcMemoryClip(playerInput, 60) + " / Replied: " + _npcMemoryClip(responseText, 60) });
    }
}

function _npcHasNamedFlags(source, required) {
    const names = _npcNormalizeList(required);
    if (!names.length) return true;
    const map = source && typeof source === "object" ? source : {};
    return names.every(name => !!map[name]);
}

function _npcHasAnyNamedFlags(source, required) {
    const names = _npcNormalizeList(required);
    if (!names.length) return false;
    const map = source && typeof source === "object" ? source : {};
    return names.some(name => !!map[name]);
}

function _npcNormalizeEventNames(value) {
    return _npcNormalizeList(value);
}

function _npcNormalizeStoryEvents(events) {
    return Array.isArray(events) ? events.filter(Boolean) : [];
}

function _npcRecentEventMatches(events, options = {}, afterCounter = 0) {
    const normalizedEvents = _npcNormalizeStoryEvents(events);
    if (!normalizedEvents.length) return false;

    const types = _npcNormalizeEventNames(options.types);
    const tags = _npcNormalizeEventNames(options.tags);

    return normalizedEvents.some(event => {
        const eventCounter = typeof event.eventCounter === "number" ? event.eventCounter : 0;
        if (eventCounter <= afterCounter) return false;

        const eventType = String(event.type || "").toLowerCase();
        const eventTags = _npcNormalizeList(event.tags);
        const typeMatch = !types.length || types.includes(eventType);
        const tagMatch = !tags.length || tags.some(tag => eventTags.includes(tag));
        return typeMatch && tagMatch;
    });
}

function _npcPickConversationVariant(npc, optionId, variants, fallback, ctx) {
    const resolvedFallback = _npcResolveConversationValue(fallback, npc, ctx);
    const pool = (Array.isArray(variants) ? variants : [])
        .map(entry => _npcResolveConversationValue(entry, npc, ctx))
        .filter(Boolean);

    if (!pool.length) return resolvedFallback;

    const state = ensureNPCConversationState(npc);
    const last = state && state.lastVariantByOption
        ? String(state.lastVariantByOption[optionId] || "")
        : "";
    const candidates = pool.length > 1 && last
        ? pool.filter(entry => entry !== last)
        : pool.slice();
    const pickFrom = candidates.length ? candidates : pool;
    const pick = pickFrom[Math.floor(Math.random() * pickFrom.length)];

    if (state && state.lastVariantByOption) {
        state.lastVariantByOption[optionId] = pick;
    }

    return pick;
}

// ── CONTEXTUAL CONVERSATION TOPICS ──────────────────────────────
// Short topic phrases (same register as species culture.topics, e.g.
// ["recent trouble", "work", "weather", "rumors"]) keyed by NPC role and
// by room type. Used by the "ask-about-topic" catalogue entry below to
// surface a topic that fits who the NPC is and where the conversation is
// happening, instead of the same generic questions everywhere. Keys are
// lowercase to match ctx.role / ctx.roomType, which are already lowercased
// by getNPCConversationContext().

const NPC_ROLE_TOPIC_POOLS = {
    "town guard": ["patrol routes", "recent troublemakers", "who's passed through"],
    "stone guard": ["tunnel security", "cave-ins", "who's recently been seen"],
    "vendor": ["prices", "best sellers", "where goods come from"],
    "shopkeeper": ["stock", "customers", "competition"],
    "wandering merchant": ["the road", "other towns", "rare finds"],
    "blacksmith": ["commissions", "materials", "local smithing reputation"],
    "clothier": ["clothing designs", "repairs and reinforcement", "dyes and fabrics", "tailoring commissions"],
    "innkeeper": ["guests", "rooms", "town happenings"],
    "bartender": ["drinks", "regulars", "overheard gossip"],
    "cook": ["ingredients", "the kitchen", "complaints about the food"],
    "servant": ["chores", "their employer", "what they overhear"],
    "priest": ["faith", "omens", "donations"],
    "archivist": ["old records", "forbidden texts", "the library's condition"],
    "scholar": ["research", "theories", "rare knowledge"],
    "pilgrim": ["their journey", "what they're seeking", "the shrine"],
    "townsfolk": ["daily life", "neighbors", "local news"],
    "villager": ["daily life", "neighbors", "local news"],
    "guest": ["why they're visiting", "the inn", "travel plans"],
    "patron": ["why they're here", "the tavern", "local talk"],
    "wanderer": ["the road", "where they've been", "having no fixed home"],
    "adventurer": ["recent jobs", "dangers ahead", "their gear"],
    "scout": ["the terrain", "threats they've spotted", "safe routes"],
    "miner": ["the tunnels", "ore veins", "cave-ins"],
    "raider": ["their territory", "targets", "rival raiders"],
    "scavenger": ["salvage", "safe pickings", "close calls"],
    "cultist": ["the cause", "secrecy", "outsiders"],
    "delver": ["loot", "traps", "competitors"]
};

const NPC_LOCATION_TOPIC_POOLS = (function () {
    const townSpine = ["foot traffic", "local news", "who's been seen around"];
    const townLandmark = ["town business", "arrivals and departures", "watch activity"];
    const tavern = ["drinks", "gossip", "the regulars"];
    const inn = ["travelers", "the rooms", "comings and goings"];
    const dungeonSpine = ["echoes", "structural danger", "what's further in"];
    const dungeonLandmark = ["what this place was", "old dangers", "relics"];
    const dungeonInterior = ["hazards", "weapons", "past intruders"];
    const ruinsSpine = ["decay", "old architecture", "who's been through"];
    const ruinsLandmark = ["history", "old rituals", "the view from up here"];
    const undergroundLandmark = ["the city below", "who controls access", "the dangers down here"];
    const swamp = ["the water", "what's sunk here", "survival"];

    return {
        "street": townSpine,
        "avenue": townSpine,
        "alleyway": townSpine,
        "square": townLandmark,
        "gate": townLandmark,
        "tavern": tavern,
        "taproom": tavern,
        "inn": inn,
        "inn common": inn,
        "guest room": inn,
        "kitchen": ["food", "supplies", "the cook"],
        "cellar": ["storage", "what's kept down here", "pests"],
        "passage": dungeonSpine,
        "corridor": dungeonSpine,
        "tunnel": dungeonSpine,
        "chamber": dungeonLandmark,
        "shrine": dungeonLandmark,
        "trap": dungeonInterior,
        "armory": dungeonInterior,
        "hallway": ruinsSpine,
        "ruins passage": ruinsSpine,
        "altar": ruinsLandmark,
        "tower": ruinsLandmark,
        "library": ["old texts", "lost knowledge", "the dust and decay"],
        "cavern": undergroundLandmark,
        "smithy": ["good steel", "ore and prices", "the forge"],
        "deep forge": ["the old smiths", "ore from the deep seams", "good steel"],
        "mine shaft": ["the ore seams", "the shift", "cave-ins"],
        "collapsed gallery": dungeonInterior,
        "underground gate": undergroundLandmark,
        "vault": ["valuables", "security", "who built this place"],
        "underground hallway": ["echoes", "the tunnel network", "traffic"],
        "marsh": swamp,
        "broken ground": swamp,
        "swamp camp": swamp,
        "submerged ruin": swamp
    };
})();

// Merges role topics + location topics + the NPC's species-flavor topics
// (npc.preferredTopics, set once by generateNPCEnrichment) into one deduped
// candidate list, role/location first since those are the more specific,
// context-relevant fit; species topics remain as a fallback so the pool is
// essentially never empty.
function getContextualNPCTopics(npc, ctx) {
    const rolePool = NPC_ROLE_TOPIC_POOLS[ctx && ctx.role] || [];
    const locationPool = NPC_LOCATION_TOPIC_POOLS[ctx && ctx.roomType] || [];
    const speciesPool = Array.isArray(npc && npc.preferredTopics) ? npc.preferredTopics : [];

    const merged = [];
    const seen = {};
    rolePool.concat(locationPool, speciesPool).forEach(function (topic) {
        const key = String(topic || "").trim().toLowerCase();
        if (!key || seen[key]) return;
        seen[key] = true;
        merged.push(topic);
    });
    return merged;
}

// Picks one topic for this build of the "ask-about-topic" option and
// stashes it on ctx so the label and the text template agree on the same
// topic. buildConversationOption() resolves label before text/playerText,
// so by the time text runs the pick is already on ctx. The pick itself
// goes through _npcPickConversationVariant so it also gets the "don't
// repeat what was just shown" rotation every other conversation option uses.
function _npcPickAskAboutTopic(npc, ctx) {
    if (ctx && ctx.__askAboutTopicPick) return ctx.__askAboutTopicPick;
    const topics = getContextualNPCTopics(npc, ctx);
    const topic = _npcPickConversationVariant(npc, "ask-about-topic:topic", topics, "what's on their mind", ctx);
    if (ctx) ctx.__askAboutTopicPick = topic;
    return topic;
}

// ── STORY AWARENESS ─────────────────────────────────────────────
// G.story.recentEvents is dominated by "movement" and "conversation" noise, so
// anything that wants to react to what has actually happened has to skip
// those. An NPC is treated as aware of an event when it happened in their
// room, mentions them by name, or (for civilised NPCs) is recent news of the
// kind that travels (trouble, deaths, rising tension).
const NPC_NOISE_EVENT_TYPES = ["movement", "conversation", "start"];
const NPC_NEWS_EVENT_TYPES = ["combat", "death", "act-shift"];
const NPC_EVENT_LOCAL_WINDOW = 20;   // story turns an in-room / involving-them event stays relevant
const NPC_EVENT_NEWS_WINDOW = 8;     // story turns recent news keeps travelling

// Newest first (rememberStoryEvent unshifts). Each entry is the raw story
// event plus `here` (happened in this room) and `age` (story turns ago).
function getNPCAwareStoryEvents(npc, opts) {
    if (!npc) return [];
    const options = opts || {};
    const story = typeof G === "object" && G && G.story ? G.story : null;
    if (!story || !Array.isArray(story.recentEvents)) return [];

    const turnNow = typeof story.turnCounter === "number" ? story.turnCounter : 0;
    const room = options.room || (typeof G === "object" && G ? G.activeRoom : null);
    const roomName = room ? String(room.displayName || room.name || "") : "";
    const npcName = String(npc.name || "").toLowerCase();
    const civilised = npc.isHumanoid === true;

    const out = [];
    story.recentEvents.forEach(function (ev) {
        if (!ev) return;
        const type = String(ev.type || "").toLowerCase();
        if (NPC_NOISE_EVENT_TYPES.indexOf(type) >= 0) return;
        if (_npcNormalizeList(ev.tags).indexOf("item-discovery") >= 0) return; // private to the player
        const age = turnNow - (typeof ev.turn === "number" ? ev.turn : turnNow);
        const here = !!roomName && ev.room === roomName;
        const involvesNpc = !!npcName && String(ev.text || "").toLowerCase().indexOf(npcName) >= 0;

        let aware = false;
        if (here || involvesNpc) aware = age <= NPC_EVENT_LOCAL_WINDOW;
        else if (civilised && NPC_NEWS_EVENT_TYPES.indexOf(type) >= 0) aware = age <= NPC_EVENT_NEWS_WINDOW;
        if (aware) out.push(Object.assign({}, ev, { here: here, age: age }));
    });
    return out;
}
if (typeof window !== "undefined") window.getNPCAwareStoryEvents = getNPCAwareStoryEvents;

// Picks the newest aware event we can turn into a menu topic and describes it:
// { event, label, phrase, note, sig } or null. Memoized on ctx so the label,
// text and note of one menu build all agree.
// The renown deed this NPC could tell about right now (see getRenownTalkFor in the
// engine), or null. Memoized on ctx like _npcEventTopic.
function _npcDeedTalk(npc, ctx) {
    if (ctx && ctx.__deedTalk !== undefined) return ctx.__deedTalk;
    const talk = ctx && ctx.room && typeof getRenownTalkFor === "function" ? getRenownTalkFor(npc, ctx.room) : null;
    if (ctx) ctx.__deedTalk = talk;
    return talk;
}

function _npcEventTopic(npc, ctx) {
    if (ctx && ctx.__eventTopic !== undefined) return ctx.__eventTopic;
    let topic = null;
    const events = getNPCAwareStoryEvents(npc, { room: ctx && ctx.room });
    for (let i = 0; i < events.length && !topic; i++) {
        const ev = events[i];
        const type = String(ev.type || "").toLowerCase();
        const tags = _npcNormalizeList(ev.tags);
        let label = "";
        let phrase = "";
        if (type === "combat") {
            label = ev.here ? "Ask about the trouble here" : "Ask about the recent trouble";
            phrase = ev.here ? "the trouble that just happened here" : "the trouble people have been talking about";
        } else if (type === "death") {
            label = "Ask about what just happened";
            phrase = "what just happened";
        } else if (type === "lore" || type === "faith") {
            label = "Ask about the gods";
            phrase = tags.indexOf("deity-lore") >= 0 ? "what you have been learning of the gods" : "faith and the gods";
        } else if (type === "exploration") {
            if (!ev.here) continue;
            label = "Ask about what turned up";
            phrase = "what turned up when you searched around here";
        } else if (type === "act-shift") {
            label = "Ask about the mood lately";
            phrase = "the mood around here lately";
        } else {
            continue;
        }
        topic = {
            event: ev,
            label: label,
            phrase: phrase,
            sig: String(ev.eventCounter || 0),
            note: "Something the speaker knows about (" + (ev.here ? "it happened here" : "word has reached them") +
                "): " + String(ev.text || "").slice(0, 200) +
                " Answer from the speaker's own point of view and do not invent details that contradict this."
        };
    }
    if (ctx) ctx.__eventTopic = topic;
    return topic;
}

// ── WORLD LORE: WHAT THIS NPC KNOWS ─────────────────────────────
// Facts live in WORLD_LORE_FACTS (cyoaftw-world-data.js). Which of them an
// NPC knows is decided here from role, species and place, with a stable
// per-NPC dice roll so the same NPC always knows (and slants) the same things.
// No AI calls: the chosen fact reaches the prompt only as an option's
// contextNote, so it costs a couple of lines for one reply.

function _loreHash(text) {
    let h = 2166136261;
    const s = String(text || "");
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % 100;
}

function _loreNpcKey(npc) {
    return String((npc && (npc.id || npc.givenName || npc.name)) || "npc");
}

// Knowledge tiers an NPC can draw on, from role and species.
const NPC_LORE_ROLE_TIERS = [
    { match: ["guard", "scout", "watch", "raider", "adventurer", "soldier", "mercenary", "guildmaster"], tiers: ["military", "local"] },
    { match: ["priest", "pilgrim", "cultist"], tiers: ["faith", "local"] },
    { match: ["archivist", "scholar", "librarian"], tiers: ["scholar", "faith"] },
    { match: ["vendor", "shopkeeper", "clothier", "merchant", "trader", "bartender", "innkeeper", "cook", "servant"], tiers: ["trade", "local"] },
    { match: ["blacksmith", "smith", "miner", "stone guard"], tiers: ["deep", "trade"] },
    { match: ["townsfolk", "villager", "guest", "patron", "wanderer", "healer"], tiers: ["local"] },
    { match: ["scavenger", "delver"], tiers: ["deep", "military"] }
];

const NPC_LORE_SPECIES_TIERS = {
    "dwarf": ["deep"],
    "elf": ["scholar"],
    "human": ["local"],
    "halfling": ["local", "trade"],
    "dragonborn": ["military"],
    "goblin": ["military", "deep"],
    "orc": ["military"],
    "kobold": ["deep", "military"],
    "lizardfolk": ["swamp"],
    "skeleton": ["military"],
    "ghost": ["military", "faith", "secret"],
    "catfolk": ["trade", "local"],
    "wolfkin": ["deep", "military"],
    "satyr": ["local", "trade"],
    "harefolk": ["local", "trade"],
    "ratfolk": ["deep", "secret"],
    "kenku": ["local", "secret"]
};

function getNPCLoreTiers(npc, ctx) {
    const role = String((ctx && ctx.role) || (npc && npc.role) || "").toLowerCase();
    const species = String((ctx && ctx.species) || (npc && npc.species) || "").toLowerCase();
    const tiers = { common: true };
    NPC_LORE_ROLE_TIERS.forEach(function (row) {
        if (_npcTextIncludesAny(role, row.match)) row.tiers.forEach(function (t) { tiers[t] = true; });
    });
    (NPC_LORE_SPECIES_TIERS[species] || []).forEach(function (t) { tiers[t] = true; });
    // Secrets are for the trusted, the faithful and the dead.
    const favor = ctx && typeof ctx.favor === "number" ? ctx.favor : 0;
    const hostility = ctx && typeof ctx.hostility === "number" ? ctx.hostility : 0;
    if ((favor >= 20 && hostility < 40) || species === "ghost") tiers.secret = true;
    else delete tiers.secret;
    return tiers;
}

// Zone distance over the zone-link graph (ZONE_LINKS, engine). Unknown -> 1.
function _loreZoneDistance(fromZone, toZone) {
    const a = String(fromZone || "").toLowerCase();
    const b = String(toZone || "").toLowerCase();
    if (!a || !b) return 1;
    if (a === b) return 0;
    if (typeof ZONE_LINKS === "undefined" || !Array.isArray(ZONE_LINKS)) return 1;
    const seen = {};
    seen[a] = 0;
    const queue = [a];
    while (queue.length) {
        const cur = queue.shift();
        for (let i = 0; i < ZONE_LINKS.length; i++) {
            const link = ZONE_LINKS[i];
            if (!link) continue;
            const from = String(link.from || "").toLowerCase();
            const to = String(link.to || "").toLowerCase();
            let next = "";
            if (from === cur) next = to;
            else if (to === cur) next = from;
            if (next && seen[next] === undefined) {
                seen[next] = seen[cur] + 1;
                if (next === b) return seen[next];
                queue.push(next);
            }
        }
    }
    return 3;
}

// Which side an NPC leans toward: "crown", "banners" or "neutral". Stable.
function getNPCLoreLeaning(npc, ctx) {
    const species = String((ctx && ctx.species) || (npc && npc.species) || "").toLowerCase();
    const role = String((ctx && ctx.role) || (npc && npc.role) || "").toLowerCase();
    if (species === "skeleton") return "crown";
    if (species === "ghost") return "neutral";
    const seed = ensureWorldLore().seed;
    let crown = 20, banners = 20;
    if (seed.townOrigin === "crown") crown += 12; else banners += 12;
    if (species === "goblin" || species === "orc" || species === "kobold") banners += 30;
    if (species === "dwarf" || species === "lizardfolk") { crown -= 15; banners -= 15; }
    if (_npcTextIncludesAny(role, ["guard", "town hall"])) crown += 10;
    if (_npcTextIncludesAny(role, ["raider", "scavenger", "delver"])) banners += 15;
    if (_npcTextIncludesAny(role, ["priest", "pilgrim"])) { crown -= 10; banners -= 10; }
    const roll = _loreHash(_loreNpcKey(npc) + ":lean");
    if (roll < crown) return "crown";
    if (roll >= 100 - banners) return "banners";
    return "neutral";
}

// Every fact this NPC knows: [{ fact, firsthand, distorted }]. Memoized on ctx.
function getNPCKnownLoreFacts(npc, ctx) {
    if (!npc || typeof WORLD_LORE_FACTS === "undefined") return [];
    if (ctx && ctx.__loreKnown) return ctx.__loreKnown;
    const tiers = getNPCLoreTiers(npc, ctx);
    const key = _loreNpcKey(npc);
    const zone = ctx && ctx.zoneName ? ctx.zoneName : "";
    const out = [];
    // Named buildings of the town (see getPlaceLoreFacts in
    // cyoaftw-world-data.js) join the fixed facts.
    let allFacts = typeof getPlaceLoreFacts === "function"
        ? WORLD_LORE_FACTS.concat(getPlaceLoreFacts())
        : WORLD_LORE_FACTS;
    // First-lead facts from the player's backstory (see getBackstoryLoreFacts in
    // cyoaftw-world-data.js): what the guide hints at is what asking around finds.
    if (typeof getBackstoryLoreFacts === "function") {
        allFacts = allFacts.concat(getBackstoryLoreFacts());
    }
    // Strangers asking after the player (see getPressureLoreFacts in
    // cyoaftw-world-data.js): gossip from the first warning on.
    if (typeof getPressureLoreFacts === "function") {
        allFacts = allFacts.concat(getPressureLoreFacts());
    }
    // Wanted thieves (see getCrimeLoreFacts in the engine) are live gossip.
    // A fact carrying aboutId is never told by the person it is about.
    if (typeof getCrimeLoreFacts === "function") {
        allFacts = allFacts.concat(getCrimeLoreFacts().filter(function (f) { return !f.aboutId || f.aboutId !== npc.id; }));
    }
    // Who rules the zone (see getZoneBossLoreFacts in the engine): known to
    // the ruler's own species in that zone, and only to them.
    if (typeof getZoneBossLoreFacts === "function") {
        allFacts = allFacts.concat(getZoneBossLoreFacts().filter(function (f) { return !f.aboutId || f.aboutId !== npc.id; }));
    }
    const speciesKey = String((ctx && ctx.species) || (npc && npc.species) || "").toLowerCase();
    const here = ctx && ctx.room && ctx.room.buildingId ? ctx.room.buildingId : null;
    allFacts.forEach(function (fact) {
        // Species-gated facts: known firsthand by that species in the fact's
        // zones, unknown to everyone else.
        if (Array.isArray(fact.species) && fact.species.length) {
            if (fact.species.indexOf(speciesKey) < 0) return;
            if ((fact.zones || []).length && fact.zones.map(function (z) { return String(z).toLowerCase(); }).indexOf(String(zone).toLowerCase()) < 0) return;
            out.push({ fact: fact, firsthand: true, distorted: false });
            return;
        }
        // Someone working inside a building knows it firsthand.
        const ownBuilding = !!(here && fact.buildingId === here);
        const own = fact.tiers.filter(function (t) { return tiers[t] && t !== "common"; });
        const firsthand = own.length > 0 || ownBuilding;
        const commonOnly = fact.tiers.indexOf("common") >= 0;
        if (!firsthand && !commonOnly) return;
        if (fact.tiers.indexOf("secret") >= 0 && !tiers.secret) return;
        let chance = ownBuilding ? 100 : (typeof fact.know === "number" ? fact.know : 50);
        // Distance only matters for things that are not common knowledge.
        let dist = 0;
        if (!commonOnly || firsthand) {
            dist = 3;
            (fact.zones || []).forEach(function (z) { dist = Math.min(dist, _loreZoneDistance(zone, z)); });
            if ((fact.zones || []).length === 0) dist = 0;
        }
        if (!commonOnly) chance = chance * (dist === 0 ? 1 : (dist === 1 ? 0.7 : 0.35));
        if (!firsthand) chance = Math.min(chance, 70); // hearsay only
        if (_loreHash(key + ":" + fact.id) >= chance) return;
        const garbled = !firsthand && !!fact.distorted && _loreHash(key + ":" + fact.id + ":garble") < 45;
        out.push({ fact: fact, firsthand: firsthand, distorted: garbled });
    });
    if (ctx) ctx.__loreKnown = out;
    return out;
}

// Picks the fact to offer now: facts this NPC has not told yet, least-heard first, filtered by purpose ("rumor"
// keeps rumor-flagged facts), nearest to this NPC's place first, with a stable
// per-NPC tiebreak so the same menu keeps the same fact until it is heard.
function pickNPCLoreFact(npc, ctx, purpose) {
    const memoKey = "__lorePick:" + (purpose || "topic");
    if (ctx && ctx[memoKey] !== undefined) return ctx[memoKey];
    const lore = ensureWorldLore();
    const zone = ctx && ctx.zoneName ? ctx.zoneName : "";
    const key = _loreNpcKey(npc);
    // The rumor option and the topic option must not offer the same fact.
    const topicPick = purpose === "rumor" ? pickNPCLoreFact(npc, ctx, "topic") : null;
    let pool = getNPCKnownLoreFacts(npc, ctx).filter(function (entry) {
        if (topicPick && topicPick.fact.id === entry.fact.id) return false;
        if (npc.memory && npc.memory.loreTold && npc.memory.loreTold[entry.fact.id]) return false;
        if (purpose === "rumor" && !entry.fact.rumor) return false;
        return true;
    });
    pool = pool.map(function (entry) {
        let dist = 3;
        (entry.fact.zones || []).forEach(function (z) { dist = Math.min(dist, _loreZoneDistance(zone, z)); });
        return { entry: entry, score: (entry.firsthand ? 0 : 2) + dist + (lore.heard[entry.fact.id] || 0) * 1.5 + _loreHash(key + ":pick:" + entry.fact.id) / 100 };
    }).sort(function (a, b) { return a.score - b.score; });
    const pick = pool.length ? pool[0].entry : null;
    if (ctx) ctx[memoKey] = pick;
    return pick;
}

function _loreLeaningLine(leaning) {
    if (leaning === "crown") return " The speaker sympathizes with the Crown and tells it with that slant, without lying outright.";
    if (leaning === "banners") return " The speaker sympathizes with the Free Banners and tells it with that slant, without lying outright.";
    return " The speaker takes no side in the war.";
}

function buildNPCLoreNote(npc, ctx, entry, mode) {
    if (!entry) return "";
    const seed = ensureWorldLore().seed;
    const text = getWorldLoreFactText(entry.fact, seed, entry.distorted);
    if (mode === "source") {
        return "Something the speaker told the player: \"" + text + "\" Now the player asks how they know it. " +
            (entry.firsthand
                ? "Say it comes from their own work or experience, and how sure they are."
                : "Say plainly it is only what they heard from others, and they cannot vouch for it.") +
            " Do not add new events or names.";
    }
    return "Local history the speaker " + (entry.firsthand ? "knows firsthand" : "has only heard secondhand") + ": \"" + text + "\"" +
        (entry.distorted ? " (They believe this version.)" : "") +
        " Answer from the speaker's own point of view in their own words, and do not invent other events or names." +
        _loreLeaningLine(getNPCLoreLeaning(npc, ctx));
}

// ── CONVERSATION FACT SHEET ─────────────────────────────────────
// A short list of real things this speaker can talk about, attached once per
// reply prompt (see buildConversationBatchInstruction in the engine) so typed
// and canned replies, and menu options with no fact of their own, have
// something concrete to draw on instead of improvising. Facts are ranked by
// word overlap with what the player just said; with no overlap, one local fact
// still comes through so the reply is not generic. No AI call happens here.
const NPC_FACT_STOPWORDS = ["the", "and", "are", "was", "who", "how", "why", "can", "for", "but", "not", "any", "has", "had", "his", "her", "its", "our", "out", "one", "did", "got", "get", "let", "may", "own", "too", "yes", "now", "about", "after", "again", "also", "around", "because", "been", "before", "could", "does", "from", "have", "here", "into", "just", "know", "like", "more", "much", "only", "really", "say", "should", "some", "tell", "than", "that", "them", "then", "there", "they", "this", "were", "what", "when", "where", "which", "while", "will", "with", "would", "your", "you"];

function _npcFactWords(text) {
    const seen = {};
    const out = [];
    String(text || "").toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).forEach(function (w) {
        if (w.length > 2 && NPC_FACT_STOPWORDS.indexOf(w) < 0 && !seen[w]) { seen[w] = true; out.push(w); }
    });
    return out;
}

function _npcFactOverlap(words, text) {
    if (!words.length) return 0;
    const hay = " " + String(text || "").toLowerCase().replace(/[^a-z0-9' ]+/g, " ") + " ";
    let hits = 0;
    words.forEach(function (w) { if (hay.indexOf(" " + w) >= 0) hits += 1; });
    return hits;
}

// Returns a multi-line string ("" when there is nothing to offer).
// playerTexts: the player's lines this prompt answers (array of strings).
function buildNPCConversationFactSheet(npc, ctx, playerTexts, room, choices) {
    if (!npc) return "";
    // Which facts reach the prompt is decided by tags and a small budget
    // (see NPC TAGS AND FACT SELECTOR). choices: the options this reply answers.
    return getNPCFactSelection(npc, ctx, room, choices, playerTexts).lines.join("\n");
}
if (typeof window !== "undefined") window.buildNPCConversationFactSheet = buildNPCConversationFactSheet;

function _loreLastHeardEntry(npc, ctx) {
    const state = npc && npc.memory && npc.memory.conversationState ? npc.memory.conversationState : null;
    const id = ctx && ctx.lastLoreFactId ? ctx.lastLoreFactId : (state ? state.lastLoreFactId : "");
    if (!id) return null;
    const known = getNPCKnownLoreFacts(npc, ctx);
    for (let i = 0; i < known.length; i++) if (known[i].fact.id === id) return known[i];
    return null;
}

// True when the NPC's last reply said it expects an answer (the reply JSON's
// "responseNeeded" flag, stored by npcRespond in the engine).
function _npcResponseIsPending(npc) {
    const pending = npc && npc.memory ? npc.memory.pendingResponse : null;
    return !!(pending && pending.needed === true);
}

// ── TYPED REPLY TONE ────────────────────────────────────────────
// Free-typed replies ("Respond..." in the engine) have no catalogue entry, so
// their relationship effect comes from the tone of the words. The AI judges it
// in the NPC's reply JSON (playerTone: warm | neutral | rude | threatening,
// "how the words land on this speaker"); when it is missing, a small keyword
// pass supplies a fallback so typed text is never consequence-free.
const NPC_TYPED_TONES = ["warm", "neutral", "rude", "threatening"];

const NPC_TYPED_TONE_IMPACTS = {
    // intent matters: canImproveMood() makes warm words land far weaker on an
    // NPC at hostility 70+ ("calm"), and a refusal to be won over is the same
    // rule every other friendly option already follows.
    warm:        { mood: 1,  favor: 3,  hostility: -1, aggression: 0, intent: "calm",       actionTag: "typed-warm" },
    rude:        { mood: -1, favor: -4, hostility: 3,  aggression: 0, intent: "insult",     actionTag: "typed-rude" },
    threatening: { mood: -1, favor: -6, hostility: 7,  aggression: 1, intent: "aggression", actionTag: "typed-threat" }
};

function classifyTypedTone(text) {
    const t = " " + String(text || "").toLowerCase().replace(/[^a-z' ]+/g, " ").replace(/\s+/g, " ") + " ";
    const has = function (list) { return list.some(function (w) { return t.indexOf(w) >= 0; }); };
    if (has([" kill you", " gut you", " cut you", " hurt you", " break your", " burn this", " or else", " you'll regret", " you will regret", " you're dead", " you are dead", " make you bleed", " draw my", " end you"])) return "threatening";
    if (has([" shut up", " idiot", " stupid", " moron", " fool ", " useless", " pathetic", " piss off", " get lost", " out of my way", " don't care", " who cares", " go away", " waste of"])) return "rude";
    if (has([" thank", " please", " sorry", " apolog", " appreciate", " my friend", " kind of you", " much obliged", " no offense", " no offence", " forgive"])) return "warm";
    return "neutral";
}

// Builds the impact for a typed reply, or null for a neutral one. Warm words
// have diminishing returns (two warm replies in the last three halve the
// gain) so a stream of flattery cannot farm favor; rude and threatening
// words are never dampened.
function buildTypedToneImpact(npc, tone, text) {
    const key = NPC_TYPED_TONES.indexOf(String(tone || "").toLowerCase()) >= 0
        ? String(tone).toLowerCase()
        : classifyTypedTone(text);

    if (npc && npc.memory) {
        if (!Array.isArray(npc.memory.typedTones)) npc.memory.typedTones = [];
    }
    const recent = npc && npc.memory ? npc.memory.typedTones.slice(-3) : [];
    if (npc && npc.memory) {
        npc.memory.typedTones.push(key);
        npc.memory.typedTones = npc.memory.typedTones.slice(-6);
    }

    const base = NPC_TYPED_TONE_IMPACTS[key];
    if (!base) return null;
    const impact = Object.assign({ markMet: true }, base);
    if (key === "warm" && recent.filter(function (x) { return x === "warm"; }).length >= 2) {
        impact.mood = 0;
        impact.favor = Math.max(1, Math.round(impact.favor / 2));
        impact.hostility = 0;
    }
    return impact;
}
if (typeof window !== "undefined") {
    window.classifyTypedTone = classifyTypedTone;
    window.buildTypedToneImpact = buildTypedToneImpact;
}

// ── RELEVANCE HELPERS ───────────────────────────────────────────
// Used by catalogue conditions below so reactive options (apologize, comfort)
// only show when there is something to react to.
const NPC_FRICTION_OPTION_IDS = ["insult", "sharp-question", "push-for-answers"];
const NPC_FRICTION_ACTION_TAGS = [
    "threat", "sharp-question", "tease-backfire", "misread-flirt", "flirt-rejected",
    "comfort-rebuffed", "hard-bargain", "refused-trade", "attacked-by-player", "mercy-refused"
];

// True when the player has recently given this NPC a reason to be upset.
function _npcPlayerCausedFriction(ctx) {
    if (!ctx) return false;
    if (ctx.favor < 0 || ctx.hostility >= 35) return true;
    const session = Array.isArray(ctx.sessionUsedOptionIds) ? ctx.sessionUsedOptionIds : [];
    if (NPC_FRICTION_OPTION_IDS.some(function (id) { return session.indexOf(id) >= 0; })) return true;
    const tags = Array.isArray(ctx.actionTags) ? ctx.actionTags.slice(-6) : [];
    return NPC_FRICTION_ACTION_TAGS.some(function (tag) { return tags.indexOf(tag) >= 0; });
}

// ── CONVERSATION CONTEXT (what was just said) ────────────────────────────
// The engine notes a small record after every NPC reply (npcNoteReplyMeta, from
// npcRespond): was it to a question, did the NPC dodge it, did they hint at
// trouble. Reactive options use it so they only appear when they make sense:
// "Push for a straight answer" after a dodge, "Offer help" after the NPC
// mentions a problem, no second "hello" in the middle of a chat.
const NPC_EVASIVE_RE = /\b(don'?t know|do not know|no idea|can'?t say|cannot say|won'?t say|will not say|none of your|not my place|couldn'?t say|wouldn'?t know|can'?t tell you|cannot tell you|nothing to say|rather not|not telling|ask someone else|can'?t help you with that|that is not for)\b/i;
const NPC_TROUBLE_RE = /\b(trouble|problem|worr|struggl|behind on|short of|short on|can'?t afford|cannot afford|in debt|a debt|owe |lost|stolen|robbed|afraid|scared|hurt|sick|alone|desperate|don'?t know what to do|could use)/i;
const NPC_QUESTION_START_RE = /^(who|what|where|why|how|when|which|do you|are you|did you|have you|can you|could you|is there|was there|will you|would you)\b/i;
const NPC_REPLY_LIVE_TURNS = 2;

function npcLooksLikeQuestion(text, id, intent) {
    const t = String(text || "").replace(/^you (say|ask),?\s*/i, "").replace(/^["'<(]+/, "").trim();
    if (/^ask-|^rapport-evening|^press-topic|^ask-about/.test(String(id || ""))) return true;
    if (["curious", "rumor", "introduction"].indexOf(String(intent || "")) >= 0 && !/^respond-/.test(String(id || ""))) return true;
    return /\?\s*["'>)]*$/.test(t) || NPC_QUESTION_START_RE.test(t) || /^you ask\b/i.test(String(text || ""));
}

// Called by npcRespond after each reply (and safe to call with no choice).
function npcNoteReplyMeta(npc, choice, replyText, affirmative) {
    if (!npc || !npc.memory) return;
    const text = String(replyText || "");
    npc.memory.lastReplyMeta = {
        turn: typeof getCurrentStoryTurn === "function" ? getCurrentStoryTurn() : 0,
        optionId: choice && choice.id ? String(choice.id) : "",
        asked: !!choice && npcLooksLikeQuestion(choice.typedText || choice.promptText || choice.text, choice.id, choice.intent),
        negative: affirmative === false,
        evasive: NPC_EVASIVE_RE.test(text),
        trouble: NPC_TROUBLE_RE.test(text)
    };
}

// The record of the last reply, only while the conversation is still live.
function _npcLiveReplyMeta(npc, ctx) {
    const m = npc && npc.memory ? npc.memory.lastReplyMeta : null;
    if (!m || typeof m.turn !== "number") return null;
    const now = ctx && typeof ctx.storyTurn === "number" ? ctx.storyTurn : (typeof getCurrentStoryTurn === "function" ? getCurrentStoryTurn() : 0);
    return (now - m.turn) <= NPC_REPLY_LIVE_TURNS ? m : null;
}

// The player asked something and the NPC dodged, refused or did not know.
function _npcDodgedQuestion(npc, ctx) {
    const m = _npcLiveReplyMeta(npc, ctx);
    return !!(m && m.asked && (m.evasive || m.negative));
}

// The NPC just mentioned a problem or opened up about something.
function _npcOpenedUp(npc, ctx) {
    const m = _npcLiveReplyMeta(npc, ctx);
    if (m && m.trouble) return true;
    const last = ctx ? String(ctx.lastOptionId || "") : "";
    return ["ask-need", "ask-worry", "ask-secret", "ask-standing"].indexOf(last) >= 0 && !!m;
}

// A second "hello" in the middle of a chat reads oddly; hide it while a reply
// is fresh (a first greeting this session is never hidden).
function _npcMidConversation(npc, ctx) {
    const used = ctx && Array.isArray(ctx.sessionUsedOptionIds) ? ctx.sessionUsedOptionIds : [];
    const greeted = used.indexOf("greet-known") >= 0 || used.indexOf("greet-intro") >= 0;
    return greeted && !!_npcLiveReplyMeta(npc, ctx);
}

// True when the NPC looks like they could use comforting: hurt, rattled by
// something recent, surrendered, or in a sour mood.
function _npcNeedsComfort(npc, ctx) {
    if (!npc || !ctx) return false;
    if (npc.surrendered) return true;
    const hpMax = npc.hpMax || 0;
    if (hpMax > 0 && typeof npc.hp === "number" && npc.hp > 0 && npc.hp < hpMax * 0.6) return true;
    if (["wary", "angry", "furious"].indexOf(ctx.mood) >= 0) return true;
    if (_npcPlayerCausedFriction(ctx)) return true;
    return _npcRecentEventMatches(ctx.storyRecentEvents, { types: ["combat", "danger", "death"] });
}

// Gate for the warm-rapport options: an adult humanoid, on duty, not a guide,
// and (for the romantic-leaning ones) not spoken for.
function _npcRapportOpen(npc, ctx, romantic) {
    if (!npc || !ctx || !ctx.isHumanoid || npc.isGuide || npc.guide || ctx.offDuty) return false;
    if (typeof isRomanceEligibleNPC === "function" && !isRomanceEligibleNPC(npc)) return false;
    if (romantic && typeof npcShrugsOffRomance === "function" && npcShrugsOffRomance(npc)) return false;
    return true;
}

// Menu ranking + cap. Only entries from the base catalogue are re-ranked or
// capped; entries merged in from window.NPC_NSFW_CONVERSATION_CATALOGUE are
// passed through untouched so that half of the menu behaves exactly as before.
const NPC_MAX_TOPIC_OPTIONS = 7;

function _npcEntryIsBase(entry) {
    return NPC_CONVERSATION_CATALOGUE.indexOf(entry) >= 0;
}

// Lower rank sorts first. Follow-ups to something just said, role-specific
// topics and story-driven topics float above generic ones.
function _npcEntryRank(entry) {
    let rank = entry && typeof entry.priority === "number" ? entry.priority : 0;
    if (!_npcEntryIsBase(entry)) return rank;
    const c = entry.conditions || {};
    if (typeof entry.rankBoost === "number") rank -= entry.rankBoost;
    if (c.requiredSessionOptionIds) rank -= 60;
    if (c.roleIncludes) rank -= 15;
    if (c.requiredStoryFlags || c.requiredStoryEventTypes || c.requiredStoryEventTags) rank -= 20;
    if (c.hasOwnDeity) rank -= 10;
    return rank;
}

// Returns a filter that keeps at most NPC_MAX_TOPIC_OPTIONS base-catalogue
// topic entries (call AFTER sorting by rank). Hidden topics surface later as
// the shown ones are used up (most are repeat: "session").
function _npcMakeTopicCap(npc, ctx) {
    let kept = 0;
    return function (entry) {
        if (!_npcEntryIsBase(entry)) return true;
        const kind = _npcDeriveOptionKind(entry, _npcResolveConversationValue(entry.intent, npc, ctx), npc, ctx);
        if (kind !== "topic") return true;
        kept += 1;
        return kept <= NPC_MAX_TOPIC_OPTIONS;
    };
}

// A warm, unthreatened NPC introduces themselves by name when greeted,
// without being asked. Used by the greeting entries (contextNote + reveal).
function _npcWillIntroduce(npc, ctx) {
    if (!npc || !ctx || ctx.nameKnown) return false;
    return ctx.favor >= 25 && ctx.hostility <= 35;
}
// Extra steer for a repeat greeting: the player never left (just spoke a moment
// ago) versus coming back after being away.
const NPC_SAME_CONVERSATION_TURNS = 4;

// Following the player (leading them, a session follower or a party member).
function _npcWalkingWithPlayer(npc) {
    if (!npc || typeof G !== "object" || !G) return false;
    if (npc._guiding || npc._inParty) return true;
    return Array.isArray(G.sessionFollowers) && G.sessionFollowers.indexOf(npc) >= 0;
}

// Still the same conversation as the last time they spoke: no room change, or
// walking together, or only a few story turns have passed.
function _npcSameConversation(npc) {
    const m = npc && npc.memory;
    if (!m || typeof m.lastTalkMoveSeq !== "number" || typeof G !== "object" || !G || !G.player) return false;
    if (m.lastTalkMoveSeq === (G.player.moveSeq || 0)) return true;
    if (_npcWalkingWithPlayer(npc)) return true;
    if (typeof m.lastTalkTurn === "number" && typeof getCurrentStoryTurn === "function") {
        return (getCurrentStoryTurn() - m.lastTalkTurn) <= NPC_SAME_CONVERSATION_TURNS;
    }
    return false;
}
function _npcCanResumeConversation(npc, ctx) {
    const state = npc && npc.memory && npc.memory.conversationState;
    return !!(ctx.stayedSinceLastTalk && (npc.memory.everGreeted || state && state.usedOptionIds.some(id => /^greet-/.test(id))));
}

function _npcGreetRepeatNote(npc, ctx) {
    if (!ctx || !npc || !npc.memory || typeof npc.memory.lastTalkMoveSeq !== "number") return "";
    if (ctx.walkingTogether) {
        return " You are travelling with the player and were talking moments ago. This is the same conversation: greet them as a companion mid-journey would, lightly. Do NOT say it has been a while, do not say you have not seen them, and do not re-introduce yourself.";
    }
    if (ctx.stayedSinceLastTalk) {
        return " The player has not left (or only just stepped away); you were talking with them moments ago. React to the quick repeat greeting lightly, with patience, humor or mild puzzlement as suits you. Do not re-introduce yourself and do not act as if you had not seen them for a while.";
    }
    return " You have not seen the player for a little while. Greet them like someone returning, and you may briefly note the time apart.";
}
function _npcIntroNote(npc, ctx) {
    if (!_npcWillIntroduce(npc, ctx)) return "";
    return "You have warmed to the player. Introduce yourself by name in this reply, naturally and in your own voice: your name is " + getNPCSelfName(npc) + ". Do not invent a different name.";
}

// ── GUIDE HELPERS ───────────────────────────────────────────────
// The guide is the NPC who joins the player after character creation (see
// startGuideArrival in the engine and PLAYER_ARCHETYPES in
// cyoaftw-world-data.js). Their menu entries below are gated on npc.guide and
// read the player's backstory, so what they say follows the player's own
// answers. All wording comes from AI replies steered by these notes; the
// facts in them are the only ones the guide is told to use.
// The past's emissary (npc.isPressureEmissary): the one who comes to settle
// the player's backstory in "Settle it" mode. State lives in the engine.
function _npcIsPressureEmissary(npc) {
    return !!(npc && npc.isPressureEmissary);
}

function _npcPressureMenu() {
    return typeof getPressureMenuState === "function" ? getPressureMenuState() : {};
}

function _npcIsGuide(npc) {
    return !!(npc && npc.guide && npc.guide.active);
}

// True once the guide has laid out the first step or asked about the party.
function _guideOrientedOrOffered() {
    const bs = typeof getPlayerBackstory === "function" ? getPlayerBackstory() : null;
    return !!(bs && bs.guide && (bs.guide.state === "oriented" || bs.guide.partyOffered));
}

// The current lead stage if this NPC (not the guide) is in that stage's
// building and the guide's plan has been heard; otherwise null. Pass null for
// npc to skip the NPC checks (used by the prompt note).
function _leadStageFor(npc) {
    const bs = typeof getPlayerBackstory === "function" ? getPlayerBackstory() : null;
    if (!bs || !bs.guide || bs.guide.state !== "oriented") return null;
    if (typeof window.getCurrentLeadStage !== "function") return null;
    const st = window.getCurrentLeadStage(bs);
    if (!st || !st.building) return null;
    if (npc) {
        if (npc.guide || npc.isHumanoid === false) return null;
        const room = typeof G !== "undefined" ? G.activeRoom : null;
        if (!room || room.buildingId !== st.building.id) return null;
    }
    return st;
}

// The guide's party question is on screen (its canned replies are showing).
function _guideOfferPending(npc) {
    const p = npc && npc.memory ? npc.memory.pendingResponse : null;
    return !!(p && p.needed && Array.isArray(p.options) && p.options.some(function (o) { return o && o.guideParty; }));
}

function _guideNote(kind) {
    const bs = typeof getPlayerBackstory === "function" ? getPlayerBackstory() : null;
    if (!bs) return "";
    if (kind === "plan") {
        const plan = typeof getGuidePlanText === "function" ? getGuidePlanText(bs) : "";
        return "You are the player's guide. Tell them plainly what to do first, in your own voice: " + plan +
            " Name the place, give one reason, and keep it to a few sentences. Do not invent other named people or places.";
    }
    if (kind === "past") {
        return "The player asks how the two of you came to be here. Recount, briefly and in your own voice, this shared history without adding new facts or names: " + bs.text;
    }
    if (kind === "town") {
        const places = typeof getGuideTownSummary === "function" ? getGuideTownSummary() : "";
        return "The player asks what you make of the town. Give an honest first impression in your own voice, mentioning only places that really exist here" +
            (places ? " (" + places + ")" : "") + ". Do not invent other named places or people.";
    }
    if (kind === "trust") {
        const plan = typeof getGuidePlanText === "function" ? getGuidePlanText(bs) : "";
        return "The player asks how sure you are about the lead (" + plan + "). Be honest in your own voice: say what you actually know and what is only a hunch or hearsay. Do not invent new facts.";
    }
    return "";
}

// Conversation entries for ordering from a barkeeper (one per menu drink) and
// for buying a round for a table companion. Labels show the live price.
function _barOrderEntry(tplId, priority) {
    return {
        id: "bar-order-" + tplId,
        priority: priority,
        repeat: "always",
        kind: "action",
        label: (npc, ctx) => typeof getBarOrderLabel === "function" ? getBarOrderLabel(npc, tplId) : "Order a drink",
        textVariants: [
            () => "You ask for " + (typeof getBarDrinkPhrase === "function" ? getBarDrinkPhrase(tplId) : "a drink") + ".",
            () => "You slide a coin across and order " + (typeof getBarDrinkPhrase === "function" ? getBarDrinkPhrase(tplId) : "a drink") + "."
        ],
        intent: "talk",
        conditions: {
            custom: (npc, ctx) => typeof canOrderBarDrink === "function" && canOrderBarDrink(npc, tplId)
        },
        action: (npc) => {
            if (typeof orderBarDrink === "function") orderBarDrink(npc, tplId);
        }
    };
}

function _barRoundEntry(tplId, priority) {
    return {
        id: "bar-round-" + tplId,
        priority: priority,
        repeat: "always",
        kind: "action",
        label: (npc, ctx) => typeof getBarRoundLabel === "function" ? getBarRoundLabel(tplId) : "Buy the next round",
        text: "You order another round.",
        intent: "gift",
        conditions: {
            custom: (npc, ctx) => typeof canOrderBarRound === "function" && canOrderBarRound(npc, tplId)
        },
        action: (npc) => {
            if (typeof orderBarRound === "function") orderBarRound(npc, tplId);
        }
    };
}

// CATALOGUE RULE: every option must earn its place. It stays only if it
//   (1) REVEALS a fact that is stored and used later (a need, a preference, a
//       lead, a lore or story fact),
//   (2) CHANGES something durable (an unlock, a quest, an item, standing, faith),
//   (3) ROUTES into a mechanic (trade, work, teacher, directions, party, bar).
// Tone options (compliment, comfort, push-for-answers...) count because they
// feed the faith table (ACTION_FAITH_EFFECTS) and the relationship model. An
// option that only makes the AI invent a paragraph and nudges favor by one
// does not belong here. See claude/guide-simplification-notes.md.
const NPC_CONVERSATION_CATALOGUE = [
    {
        id: "greet-intro",
        priority: 10,
        repeat: "never",
        label: "Greet them",
        textVariants: [
            "You offer a simple greeting and leave room for them to answer however they like.",
            "You start the conversation with a polite greeting and wait to see what tone they choose.",
            "You open with a measured greeting and give them space to respond."
        ],
        intent: "greeting",
        relationshipImpact: { mood: 1, favor: 4, hostility: -1, intent: "greeting", markMet: true, actionTag: "greeting" },
        contextNote: _npcIntroNote,
        revealsName: _npcWillIntroduce,
        cacheSig: (npc, ctx) => _npcWillIntroduce(npc, ctx) ? "intro" : "",
        // The guide opens the conversation themselves (see startGuideArrival);
        // a generic greeting would read as a second meeting.
        conditions: { metPlayer: false, custom: (npc) => !(npc && npc.guide) }
    },
    {
        id: "greet-known",
        priority: 15,
        repeat: "session",
        resetTimer: { turns: 3 },
        label: (npc, ctx) => {
            if (ctx.hostility >= 70) return "Acknowledge them carefully";
            if (ctx.favor >= 35 || ctx.relationship === "trusted" || ctx.relationship === "friendly") {
                return "Greet them warmly";
            }
            if (ctx.sessionUsedOptionIds.includes("greet-known")) return "Check in with them again";
            return "Greet them again";
        },
        textVariants: [
            (npc, ctx) => ctx.hostility >= 70
                ? "You acknowledge them without crowding them and keep your tone careful."
                : "You greet them like someone you have already spoken with and leave the tone open.",
            (npc, ctx) => ctx.hostility >= 70
                ? "You offer a measured acknowledgment instead of pretending the tension is gone."
                : "You offer a familiar greeting and watch how they receive it this time.",
            (npc, ctx) => ctx.favor >= 35
                ? "You greet them with easy familiarity, as though picking up a conversation already in motion."
                : "You greet them again without making it sound like a first introduction.",
            (npc, ctx) => ctx.stayedSinceLastTalk && ctx.hostility < 70
                ? "You greet them again even though you only just spoke, with a half smile that admits it."
                : "",
            (npc, ctx) => ctx.stayedSinceLastTalk && ctx.hostility < 70
                ? "You say hello once more, as if starting over, though you never left the room."
                : ""
        ],
        intent: "greeting",
        relationshipImpact: (npc, ctx) => ctx.hostility >= 70
            ? { mood: 0, favor: 1, hostility: -1, intent: "greeting", markMet: true, actionTag: "greeting" }
            : { mood: 1, favor: 2, hostility: -1, intent: "greeting", markMet: true, actionTag: "greeting" },
        contextNote: (npc, ctx) => _npcIntroNote(npc, ctx) + _npcGreetRepeatNote(npc, ctx),
        revealsName: _npcWillIntroduce,
        cacheSig: (npc, ctx) => (_npcWillIntroduce(npc, ctx) ? "intro" : "") + (ctx.walkingTogether ? "walk" : (ctx.stayedSinceLastTalk ? "stay" : "away")),
        conditions: {
            metPlayer: true,
            // The guide's opening line and a door-answerer's "Yes? Can I help
            // you?" already are the greeting for this conversation.
            custom: (npc, ctx) => !(npc && npc.guide) && !_npcCanResumeConversation(npc, ctx) && !(ctx.sessionUsedOptionIds.includes("greet-knock-answer") || ctx.sessionUsedOptionIds.includes("greet-guide-opening")) && !_npcMidConversation(npc, ctx)
        }
    },
    {
        id: "resume-conversation", priority: 14, repeat: "session", kind: "action", action: "resume-conversation",
        label: "Resume conversation", conditions: { metPlayer: true, custom: (npc, ctx) => _npcCanResumeConversation(npc, ctx) && !_npcMidConversation(npc, ctx) }
    },
    {
        id: "ask-name",
        priority: 18,
        repeat: "never",
        label: "Ask their name",
        textVariants: [
            "You ask their name in a straightforward, polite way.",
            "You ask what you should call them and give them room to answer in their own way.",
            "You ask them to introduce themselves properly."
        ],
        intent: "introduction",
        relationshipImpact: { mood: 0, favor: 2, hostility: -1, intent: "introduction", markMet: true, actionTag: "ask-name" },
        // The greeting gate hides everything but greetings until the session
        // greeting, and greeting sets metPlayer, so the old "metPlayer: false"
        // condition meant this option could never be shown. Offer it until the
        // name has been asked once (repeat: "never" tracks that), unless the
        // NPC is too hostile to bother introducing themselves.
        conditions: { maxHostility: 70, nameKnown: false },
        contextNote: (npc, ctx) => "Your name is " + getNPCSelfName(npc) + ". Tell the player your name in this reply, in your own voice (you may grudgingly or warmly, depending on your mood). Do not invent a different name."
    },
    {
        // Offering a drink (any alcohol in the player's inventory - see
        // TAVERN_DRINK_TEMPLATES / offerDrinkToNPC in cyoaftw-engine-CORE.js)
        // is a scripted action, not an AI turn: the engine consumes the
        // drink, stacks the NPC's "drunk" status effect and loosens their
        // inhibitions (memory.disinhibition - the same pool the
        // min/maxDisinhibition conditions above read). The function-action
        // path in chooseChatOption fires the action and shows its own chat
        // lines, skipping npcRespond.
        id: "offer-drink",
        priority: 26,
        repeat: "session",
        resetTimer: { turns: 4 },
        label: "Offer them a drink",
        textVariants: [
            "You offer them something to drink.",
            "You hold out a drink for them.",
            "You suggest sharing a drink together."
        ],
        intent: "gift",
        conditions: {
            maxHostility: 60,
            custom: (npc, ctx) =>
                ctx.isHumanoid &&
                typeof playerHasAlcohol === "function" &&
                playerHasAlcohol()
        },
        action: (npc) => {
            if (typeof offerDrinkToNPC === "function") offerDrinkToNPC(npc);
        }
    },
    {
        // A follower who has just said they are leaving (see tickFollowerAutonomy
        // in the engine) can be asked to stay, once. Scripted, no AI turn.
        id: "follower-ask-stay",
        priority: 1,
        repeat: "always",
        label: "Ask them to stay",
        text: "You ask them to stay a while longer.",
        intent: "help",
        conditions: {
            custom: (npc, ctx) =>
                typeof getFollowerLeaving === "function" &&
                !!getFollowerLeaving(npc) &&
                !getFollowerLeaving(npc).asked
        },
        action: (npc) => {
            if (typeof askFollowerToStay === "function") askFollowerToStay(npc);
        }
    },
    {
        id: "ask-companion-fighting",
        priority: 42,
        rankBoost: 30,
        repeat: "always",
        kind: "action",
        label: "Ask about their fighting",
        text: "You ask about their fighting experience.",
        playerText: "How much fighting have you done?",
        intent: "curious",
        conditions: { maxHostility: 59, custom: (npc, ctx) => ctx.isHumanoid && typeof npcFightingInquiryBlock === "function" && !npcFightingInquiryBlock(npc) },
        action: (npc) => { if (typeof describeNPCFighting === "function") return describeNPCFighting(npc); }
    },
    {
        id: "npc-travel-party",
        priority: 2,
        repeat: "always",
        label: "Ask about travelling companions",
        text: "You ask about their travelling companions.",
        intent: "talk",
        conditions: { custom: (npc) => typeof getNPCPartyPublicInfo === "function" && !!getNPCPartyPublicInfo(npc) },
        action: (npc) => { if (typeof describeNPCTravelParty === "function") describeNPCTravelParty(npc); }
    },
    {
        // A session follower (someone already travelling with you, this
        // session) can be asked to make it permanent and join the party
        // proper. Scripted, no AI turn: the answer is a roll from how much
        // they like you (see askFollowerToJoinParty in the engine), and a no
        // means a cooldown (FOLLOWER_JOIN_ASK_COOLDOWN) before the question
        // can be put again. Held captives never get it - they have the rope
        // collar path instead.
        id: "follower-join-party",
        priority: 1,
        repeat: "always",
        label: "Ask them to join you for good",
        text: "You ask if they would travel with you for good.",
        intent: "talk",
        conditions: {
            custom: (npc, ctx) =>
                typeof canAskFollowerToJoinParty === "function" &&
                canAskFollowerToJoinParty(npc)
        },
        action: (npc) => {
            if (typeof askFollowerToJoinParty === "function") askFollowerToJoinParty(npc);
        }
    },
    {
        // A party member can be asked to settle the loot rule again (engine:
        // "LOOSE ENDS"). Scripted, no AI turn.
        id: "party-loot-revisit",
        priority: 27,
        repeat: "session",
        resetTimer: { turns: 40 },
        label: "Talk again about splitting loot",
        text: "You suggest it is time to talk again about how the party splits loot.",
        intent: "talk",
        conditions: {
            custom: (npc, ctx) =>
                typeof canReopenPartyLootVote === "function" && canReopenPartyLootVote(npc)
        },
        action: (npc) => {
            if (typeof reopenPartyLootVote === "function") reopenPartyLootVote(npc);
        }
    },
    {
        // Someone who walked out on the party (over loot, a crime, a fight, or
        // just boredom) can be asked about it once. Scripted, no AI turn.
        id: "departed-acknowledge",
        priority: 26,
        repeat: "always",
        label: "Bring up why they left",
        text: "You bring up why they left.",
        intent: "talk",
        conditions: {
            maxHostility: 60,
            custom: (npc, ctx) =>
                typeof getDepartedKind === "function" && !!getDepartedKind(npc)
        },
        action: (npc) => {
            if (typeof acknowledgeDepartedNPC === "function") acknowledgeDepartedNPC(npc);
        }
    },
    // ---- Finding a teacher (engine: "FINDING TEACHERS") ----
    // Scripted, no AI turn. The NPC names a real trainer in town and where to
    // find them, and the player's sheet remembers it. Hidden once that class
    // is at Adept or better (your own class always is), and when no teacher of
    // that class is known in this zone (canNPCPointToTeacher in the engine).
    {
        id: "ask-teacher-arcane",
        priority: 29,
        repeat: "session",
        resetTimer: { turns: 30 },
        label: "Ask where you could learn magic",
        text: "You ask whether anyone in town could teach you magic.",
        intent: "talk",
        conditions: {
            maxHostility: 60,
            custom: (npc, ctx) =>
                ctx.isHumanoid &&
                typeof askNPCAboutTeacher === "function" &&
                typeof G !== "undefined" && !!G.player &&
                getClassSkillRank(G.player, "wizard") < 3 &&
                typeof canNPCPointToTeacher === "function" &&
                canNPCPointToTeacher(npc, "wizard")
        },
        action: (npc) => {
            if (typeof askNPCAboutTeacher === "function") askNPCAboutTeacher(npc, "wizard");
        }
    },
    {
        id: "ask-teacher-faith",
        priority: 29,
        repeat: "session",
        resetTimer: { turns: 30 },
        label: "Ask who could teach you the faith",
        text: "You ask who in town could teach you the faith.",
        intent: "talk",
        conditions: {
            maxHostility: 60,
            custom: (npc, ctx) =>
                ctx.isHumanoid &&
                typeof askNPCAboutTeacher === "function" &&
                typeof G !== "undefined" && !!G.player &&
                getClassSkillRank(G.player, "cleric") < 3 &&
                typeof canNPCPointToTeacher === "function" &&
                canNPCPointToTeacher(npc, "cleric")
        },
        action: (npc) => {
            if (typeof askNPCAboutTeacher === "function") askNPCAboutTeacher(npc, "cleric");
        }
    },
    {
        id: "ask-teacher-roguery",
        priority: 29,
        repeat: "session",
        resetTimer: { turns: 30 },
        label: "Ask who could teach you the quiet arts",
        text: "You ask, quietly, who could teach you the quiet arts.",
        intent: "talk",
        conditions: {
            maxHostility: 60,
            custom: (npc, ctx) =>
                ctx.isHumanoid &&
                typeof askNPCAboutTeacher === "function" &&
                typeof G !== "undefined" && !!G.player &&
                getClassSkillRank(G.player, "rogue") < 3 &&
                typeof canNPCPointToTeacher === "function" &&
                canNPCPointToTeacher(npc, "rogue")
        },
        action: (npc) => {
            if (typeof askNPCAboutTeacher === "function") askNPCAboutTeacher(npc, "rogue");
        }
    },
    // ---- Sharing food and drink (engine: "SHARING FOOD AND DRINK") ----
    // An NPC with a reason (friendly, has coin, in a tavern, or plain warmth)
    // may offer to stand the player a drink or a meal when a chat opens, and
    // an NPC seen eating or drinking can be joined. Accepting or joining opens
    // a short "sharing a table" window in which the options below appear.
    // Everything is guarded so the catalogue still works if the engine block
    // is absent.
    {
        id: "accept-share-offer",
        priority: 2,
        repeat: "always",
        label: (npc) => {
            const o = typeof getNPCShareOffer === "function" ? getNPCShareOffer(npc) : null;
            return o && o.kind === "meal" ? "Accept the meal" : "Accept the drink";
        },
        text: "You accept the offer gladly.",
        intent: "gift",
        conditions: {
            custom: (npc, ctx) => typeof getNPCShareOffer === "function" && !!getNPCShareOffer(npc)
        },
        action: (npc) => {
            if (typeof acceptNPCShareOffer === "function") acceptNPCShareOffer(npc);
        }
    },
    {
        id: "decline-share-offer",
        priority: 3,
        repeat: "always",
        label: "Decline politely",
        text: "You thank them, but decline.",
        intent: "calm",
        conditions: {
            custom: (npc, ctx) => typeof getNPCShareOffer === "function" && !!getNPCShareOffer(npc)
        },
        action: (npc) => {
            if (typeof declineNPCShareOffer === "function") declineNPCShareOffer(npc);
        }
    },
    {
        id: "join-their-table",
        priority: 5,
        repeat: "always",
        label: (npc) => {
            const m = typeof getNPCMealActivity === "function" ? getNPCMealActivity(npc) : null;
            return m && m.kind === "meal" ? "Join them for a meal" : "Join them for a drink";
        },
        text: "You walk over and ask if the seat beside them is taken.",
        intent: "talk",
        conditions: {
            maxHostility: 40,
            custom: (npc, ctx) =>
                typeof getNPCMealActivity === "function" &&
                !!getNPCMealActivity(npc) &&
                !(typeof getNPCShareOffer === "function" && getNPCShareOffer(npc)) &&
                !(typeof getNPCSharing === "function" && getNPCSharing(npc))
        },
        action: (npc) => {
            if (typeof joinNPCMeal === "function") joinNPCMeal(npc);
        }
    },
    // Bar service (see BAR SERVICE in cyoaftw-engine-CORE.js). Orders come out
    // of the barkeeper's real stock; rounds are for the table and need a tavern
    // or inn room. All guarded with typeof so the file stands alone.
    ...["mug-of-ale", "cheap-wine", "house-spirits"].map((tplId, i) => _barOrderEntry(tplId, 14 + i * 0.1)),
    ...["mug-of-ale", "cheap-wine", "house-spirits"].map((tplId, i) => _barRoundEntry(tplId, 9 + i * 0.1)),
    {
        id: "offer-to-buy-drink",
        priority: 12,
        repeat: "always",
        kind: "action",
        label: (npc, ctx) => typeof getBuyDrinkOfferLabel === "function" ? getBuyDrinkOfferLabel(npc) : "Offer to buy them a drink",
        textVariants: [
            "You offer to buy them a drink.",
            "You nod toward the bar and offer to stand them a drink.",
            "You ask whether they would let you buy them a drink."
        ],
        // The NPC's own reply decides: the engine reads the reply's
        // `affirmative` flag (see resolveBuyDrinkOffer).
        contextNote: (npc) => typeof getBuyDrinkOfferNote === "function" ? getBuyDrinkOfferNote(npc) : "",
        cacheSig: (npc) => typeof getBuyDrinkOfferSig === "function" ? getBuyDrinkOfferSig(npc) : "",
        intent: "talk",
        conditions: {
            custom: (npc, ctx) => typeof canOfferToBuyDrink === "function" && canOfferToBuyDrink(npc)
        }
    },
    {
        id: "offer-to-buy-both-drinks",
        priority: 12.5,
        repeat: "always",
        kind: "action",
        label: (npc, ctx) => typeof getBuyDrinkOfferLabel === "function" ? getBuyDrinkOfferLabel(npc, true) : "Offer to buy you both a drink",
        textVariants: [
            "You offer to buy the two of you a drink.",
            "You suggest having a drink together, your treat.",
            "You nod toward the bar and offer to buy the two of you a drink."
        ],
        contextNote: (npc) => typeof getBuyDrinkOfferNote === "function" ? getBuyDrinkOfferNote(npc, true) : "",
        cacheSig: (npc) => typeof getBuyDrinkOfferSig === "function" ? getBuyDrinkOfferSig(npc, true) : "",
        intent: "talk",
        conditions: {
            custom: (npc, ctx) => typeof canOfferToBuyDrink === "function" && canOfferToBuyDrink(npc, true)
        }
    },
    {
        id: "bar-order-refused",
        priority: 13,
        repeat: "always",
        kind: "action",
        label: "Ask for another drink",
        textVariants: [
            "You ask for another drink, a little too loudly.",
            "You lean on the bar and ask for one more.",
            "You wave for another round and nearly miss the counter."
        ],
        contextNote: (npc) => typeof getBarCutoffNote === "function" ? getBarCutoffNote(npc) : "",
        cacheSig: (npc) => "bar-cutoff-" + (npc && npc._barVerdict ? npc._barVerdict.until : 0),
        intent: "talk",
        conditions: {
            custom: (npc, ctx) => typeof isBarRefusing === "function" && isBarRefusing(npc)
        }
    },
    {
        id: "bar-ask-cellar",
        priority: 17,
        repeat: "always",
        kind: "action",
        label: "Ask them to fetch more from the cellar",
        textVariants: [
            "You ask whether there is more in the cellar.",
            "You point out that the casks look low and ask them to fetch more."
        ],
        intent: "talk",
        conditions: {
            custom: (npc, ctx) => typeof needsBarRestock === "function" && needsBarRestock(npc) &&
                !(typeof isBarRefusing === "function" && isBarRefusing(npc))
        },
        action: (npc) => {
            if (typeof askBarkeepRestock === "function") askBarkeepRestock(npc);
        }
    },
    // Jobs and quests (see JOBS AND QUESTS in cyoaftw-engine-CORE.js). One entry
    // opens a small menu (showWorkMenu) listing the work and bounties this
    // speaker can give, pay owed, and trophies to hand in. No AI call.
    {
        id: "ask-about-work",
        priority: 46,
        repeat: "always",
        kind: "action",
        label: (npc, ctx) => typeof getWorkMenuLabel === "function" ? getWorkMenuLabel(npc) : "Ask about work",
        action: "workmenu",
        intent: "talk",
        conditions: {
            maxHostility: 40,
            custom: (npc, ctx) => typeof hasWorkTopics === "function" && hasWorkTopics(npc)
        }
    },
    {
        id: "meal-leave-table",
        priority: 10,
        repeat: "always",
        label: "Thank them and leave the table",
        text: "You thank them and push back from the table.",
        intent: "goodbye",
        conditions: {
            custom: (npc, ctx) => typeof getNPCSharing === "function" && !!getNPCSharing(npc)
        },
        action: (npc) => {
            if (typeof endNPCSharing === "function") endNPCSharing(npc);
        }
    },
    {
        id: "ask-about-event",
        priority: 28,
        rankBoost: 20,
        repeat: "session",
        // A new noteworthy event reopens it; the same event is only asked once.
        resetOnStoryEventTypes: ["combat", "death", "lore", "faith", "exploration", "act-shift"],
        label: (npc, ctx) => { const t = _npcEventTopic(npc, ctx); return t ? t.label : ""; },
        textVariants: [
            (npc, ctx) => { const t = _npcEventTopic(npc, ctx); return t ? `You ask what they make of ${t.phrase}.` : ""; },
            (npc, ctx) => { const t = _npcEventTopic(npc, ctx); return t ? `You bring up ${t.phrase} and let them tell it their way.` : ""; },
            (npc, ctx) => { const t = _npcEventTopic(npc, ctx); return t ? `You ask what they saw or heard about ${t.phrase}.` : ""; }
        ],
        // Facts passed to the AI so the reply is about the real event.
        contextNote: (npc, ctx) => { const t = _npcEventTopic(npc, ctx); return t ? t.note : ""; },
        // Cached replies for this option are dropped when this changes.
        cacheSig: (npc, ctx) => { const t = _npcEventTopic(npc, ctx); return t ? t.sig : ""; },
        // Remember each event talked about, so a later reply stays consistent.
        memory: (npc, ctx) => {
            const t = _npcEventTopic(npc, ctx);
            if (!t || !t.event) return undefined;
            return {
                id: "ask-event-" + t.sig,
                importance: 6,
                tags: ["event", "told"],
                text: "You talked with the player about this (keep your account the same): " + String(t.event.text || "").slice(0, 160)
            };
        },
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 1, intent: "curious", markMet: true, actionTag: "ask-event" },
        replaces: ["ask-seen"],
        conditions: {
            metPlayer: true,
            maxHostility: 70,
            custom: (npc, ctx) => !!_npcEventTopic(npc, ctx)
        }
    },
    {
        id: "ask-about-lore",
        priority: 44,
        rankBoost: 18,
        repeat: "session",
        resetTimer: { turns: 5 },
        label: (npc, ctx) => { const e = pickNPCLoreFact(npc, ctx, "topic"); return e ? `Ask about ${e.fact.topic}` : ""; },
        textVariants: [
            (npc, ctx) => { const e = pickNPCLoreFact(npc, ctx, "topic"); return e ? `You ask what they know about ${e.fact.topic}.` : ""; },
            (npc, ctx) => { const e = pickNPCLoreFact(npc, ctx, "topic"); return e ? `You bring up ${e.fact.topic} and let them tell it their way.` : ""; },
            (npc, ctx) => { const e = pickNPCLoreFact(npc, ctx, "topic"); return e ? `You ask what people around here say about ${e.fact.topic}.` : ""; }
        ],
        loreFact: (npc, ctx) => { const e = pickNPCLoreFact(npc, ctx, "topic"); return e ? e.fact.id : ""; },
        contextNote: (npc, ctx) => buildNPCLoreNote(npc, ctx, pickNPCLoreFact(npc, ctx, "topic"), "tell"),
        cacheSig: (npc, ctx) => { const e = pickNPCLoreFact(npc, ctx, "topic"); return e ? e.fact.id + (e.distorted ? "d" : "") : ""; },
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 1, intent: "curious", markMet: true, actionTag: "ask-world-lore" },
        conditions: {
            metPlayer: true,
            maxHostility: 60,
            minFavor: -20,
            custom: (npc, ctx) => ctx.isHumanoid && !!pickNPCLoreFact(npc, ctx, "topic")
        }
    },
    {
        id: "ask-lore-source",
        priority: 43,
        rankBoost: 40,
        repeat: "session",
        label: "Ask how they know that",
        textVariants: [
            "You ask how they came to know that.",
            "You ask whether that is something they saw or only heard.",
            "You ask who told them, and whether they trust it."
        ],
        contextNote: (npc, ctx) => buildNPCLoreNote(npc, ctx, _loreLastHeardEntry(npc, ctx), "source"),
        cacheSig: (npc, ctx) => ctx.lastLoreFactId || "",
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 1, intent: "curious", markMet: true, actionTag: "ask-lore-source" },
        replaces: ["ask-about-lore", "ask-rumor"],
        conditions: {
            maxHostility: 59,
            custom: (npc, ctx) => (ctx.lastOptionId === "ask-about-lore" || ctx.lastOptionId === "ask-rumor") && !!_loreLastHeardEntry(npc, ctx)
        }
    },
    {
        id: "ask-about-nectar",
        priority: 45,
        repeat: "session",
        label: "Ask about moonbloom nectar",
        textVariants: [
            "You ask if they know anything about moonbloom nectar and where to find it.",
            "You bring up moonbloom nectar and ask what they think of it.",
            "You ask if they have ever tried moonbloom nectar or know where it comes from."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 1, intent: "curious", markMet: true, actionTag: "ask-nectar" },
        conditions: {
            metPlayer: true,
            maxHostility: 50,
            custom: (npc, ctx) => ctx.isHumanoid
        }
    },
    {
        id: "ask-nectar-buy",
        priority: 40,
        repeat: "session",
        label: "Ask where to buy nectar",
        textVariants: [
            "You ask if they know where you might buy some moonbloom nectar.",
            "You ask if there is a shop nearby that sells moonbloom nectar.",
            "You ask if they have seen nectar for sale and where."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 0, intent: "curious", markMet: true, actionTag: "ask-nectar-buy" },
        conditions: {
            metPlayer: true,
            maxHostility: 50,
            custom: (npc, ctx) => ctx.isHumanoid && (npc.role === "Trader" || npc.role === "Merchant" || npc.role === "Alchemist" || npc.role === "Innkeeper")
        }
    },
    {
        id: "mention-slime-nectar",
        priority: 35,
        repeat: "session",
        label: "Mention slimes and nectar",
        textVariants: [
            "You mention that you heard slimes love moonbloom nectar and ask if it is true.",
            "You ask if it is true that slimes go crazy for nectar.",
            "You bring up the strange fact that slimes seem drawn to nectar and ask if they have noticed it too."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 0, intent: "curious", markMet: true, actionTag: "mention-slime-nectar" },
        conditions: {
            metPlayer: true,
            maxHostility: 50,
            custom: (npc, ctx) => ctx.isHumanoid && ctx.room && ctx.room.creatures && ctx.room.creatures.some(c => c && String(c.species || "").toLowerCase() === "slime")
        }
    },
    {
        id: "offer-help",
        priority: 50,
        repeat: "session",
        label: "Offer help",
        textVariants: [
            "You offer help and let them decide how much to reveal.",
            "You make it clear you are willing to help if they need it.",
            "You give them an opening to ask for help without pressing."
        ],
        intent: "help",
        relationshipImpact: { mood: 1, favor: 5, hostility: -1, intent: "help", markMet: true, actionTag: "offer-help" },
        // Only once there is something to help with: they mentioned a problem,
        // opened up, or look hurt or rattled.
        conditions: { custom: (npc, ctx) => _npcOpenedUp(npc, ctx) || _npcNeedsComfort(npc, ctx) }
    },
    {
        id: "keep-calm",
        priority: 60,
        repeat: "session",
        label: "Keep things calm",
        textVariants: [
            "You keep your tone even and try to keep the conversation from turning ugly.",
            "You slow things down and make it clear you are not looking for a fight.",
            "You give them room while trying to settle the tension."
        ],
        intent: "calm",
        relationshipImpact: { mood: 1, favor: 2, hostility: -2, intent: "calm", markMet: true, actionTag: "keep-calm" },
        conditions: {
            any: [
                { minHostility: 60 },
                { maxFavor: -21 }
            ]
        }
    },
    {
        id: "ask-rumor",
        priority: 70,
        repeat: "session",
        resetTimer: { turns: 6 },
        label: "Ask for a rumor",
        textVariants: [
            (npc, ctx) => {
                const role = (ctx && ctx.role) || "";
                if (role.includes("guard")) return "You ask if there's been any trouble worth watching for.";
                if (role.includes("healer")) return "You ask if anything's been going around that has people worried.";
                if (role.includes("priest") || role.includes("archivist")) return "You ask if they've noticed any ill omens lately.";
                if (["vendor", "shopkeeper", "clothier", "merchant", "trader", "bartender", "innkeeper", "blacksmith"].some(tag => role.includes(tag))) {
                    return "You ask if trade's been good, or if something's been eating into it.";
                }
                return "You ask whether they have heard anything worth knowing.";
            },
            (npc, ctx) => {
                const role = (ctx && ctx.role) || "";
                if (role.includes("guard")) return "You ask what's been keeping the watch busy lately.";
                if (role.includes("healer")) return "You ask what ailments have kept them busiest this season.";
                if (role.includes("priest") || role.includes("archivist")) return "You ask what the old stories say about times like these.";
                if (["vendor", "shopkeeper", "clothier", "merchant", "trader", "bartender", "innkeeper", "blacksmith"].some(tag => role.includes(tag))) {
                    return "You ask what's been moving through the market lately, good or bad.";
                }
                return "You nudge the conversation toward rumors and loose talk.";
            },
            "You invite them to share whispers, gossip, or anything people are not saying openly."
        ],
        intent: "rumor",
        // A real piece of local history this NPC would plausibly have heard.
        loreFact: (npc, ctx) => { const e = pickNPCLoreFact(npc, ctx, "rumor"); return e ? e.fact.id : ""; },
        contextNote: (npc, ctx) => buildNPCLoreNote(npc, ctx, pickNPCLoreFact(npc, ctx, "rumor"), "tell"),
        cacheSig: (npc, ctx) => { const e = pickNPCLoreFact(npc, ctx, "rumor"); return e ? e.fact.id + (e.distorted ? "d" : "") : ""; },
        relationshipImpact: { mood: 0, favor: 2, intent: "curious", markMet: true, actionTag: "ask-rumor" },
        rankBoost: 25,
        conditions: {
            maxHostility: 59,
            minFavor: -20
        }
    },
    // WHAT PEOPLE ARE SAYING: only a gossiper (women of a nervous or nosy temperament, and
    // staff working in an inn or tavern) who knows an untold, weighty deed about the player
    // offers it, once per deed. The label is neutral; whether she knows it is you, and how
    // she says it, is in the contextNote (see describeRenownTalk in the engine).
    {
        id: "ask-talk",
        priority: 66,
        rankBoost: 30,
        repeat: "always",
        label: "Ask what people are saying",
        textVariants: [
            "You ask what folk have been saying lately.",
            "You ask if there is any talk worth hearing.",
            "You lean in and ask what the gossip is."
        ],
        deedTalk: (npc, ctx) => { const t = _npcDeedTalk(npc, ctx); return t ? t.id : ""; },
        contextNote: (npc, ctx) => { const t = _npcDeedTalk(npc, ctx); return t ? t.note : ""; },
        cacheSig: (npc, ctx) => { const t = _npcDeedTalk(npc, ctx); return t ? t.sig : ""; },
        intent: "rumor",
        relationshipImpact: { mood: 0, favor: 0, intent: "curious", markMet: true, actionTag: "ask-talk" },
        memory: { skip: true },
        replaces: ["ask-rumor"],
        conditions: {
            metPlayer: true,
            maxHostility: 59,
            minFavor: -20,
            custom: (npc, ctx) => ctx.isHumanoid && !ctx.offDuty && !!_npcDeedTalk(npc, ctx)
        }
    },
    // SOCIAL FACTS: each reveals one stored fact from the NPC's social sheet
    // (see generateNPCSocial). Scripted, no AI call. Each shows once, only when
    // the NPC has that fact and trusts the player enough; the engine handler is
    // handleSocialFact. Mobs and the guide have no sheet, so none show.
    {
        id: "ask-standing",
        priority: 46,
        rankBoost: 30,
        repeat: "always",
        label: (npc) => getSocialFactLabel(npc, "standing"),
        action: "socialfact",
        socialFact: "standing",
        intent: "curious",
        conditions: {
            metPlayer: true,
            custom: (npc, ctx) => ctx.isHumanoid && socialFactAvailable(npc, "standing")
        }
    },
    {
        id: "ask-need",
        priority: 47,
        rankBoost: 30,
        repeat: "always",
        label: (npc) => getSocialFactLabel(npc, "need"),
        action: "socialfact",
        socialFact: "need",
        intent: "curious",
        conditions: {
            metPlayer: true,
            custom: (npc, ctx) => ctx.isHumanoid && socialFactAvailable(npc, "need")
        }
    },
    {
        id: "ask-worry",
        priority: 45,
        rankBoost: 30,
        repeat: "always",
        label: (npc) => getSocialFactLabel(npc, "worry"),
        action: "socialfact",
        socialFact: "worry",
        intent: "curious",
        conditions: {
            metPlayer: true,
            custom: (npc, ctx) => ctx.isHumanoid && socialFactAvailable(npc, "worry")
        }
    },
    {
        id: "ask-liking",
        priority: 40,
        rankBoost: 30,
        repeat: "always",
        label: (npc) => getSocialFactLabel(npc, "liking"),
        action: "socialfact",
        socialFact: "liking",
        intent: "curious",
        conditions: {
            metPlayer: true,
            custom: (npc, ctx) => ctx.isHumanoid && socialFactAvailable(npc, "liking")
        }
    },
    {
        id: "ask-secret",
        priority: 48,
        rankBoost: 30,
        repeat: "always",
        label: (npc) => getSocialFactLabel(npc, "secret"),
        action: "socialfact",
        socialFact: "secret",
        intent: "curious",
        conditions: {
            metPlayer: true,
            custom: (npc, ctx) => ctx.isHumanoid && socialFactAvailable(npc, "secret")
        }
    },
    {
        id: "ask-ties",
        priority: 39,
        rankBoost: 25,
        repeat: "always",
        label: (npc) => getSocialFactLabel(npc, "ties"),
        action: "socialfact",
        socialFact: "ties",
        intent: "curious",
        conditions: {
            metPlayer: true,
            custom: (npc, ctx) => ctx.isHumanoid && socialFactAvailable(npc, "ties")
        }
    },
    // Lodging: the innkeeper lets guest rooms by the week (see showRentRoomMenu
    // in the engine). Everyone but the nobles rents; the rent goes to whichever
    // House holds the land. Routes to a mechanic (a persistent room and key).
    {
        id: "rent-room",
        priority: 84,
        repeat: "always",
        kind: "action",
        service: "rooms",
        label: "Inquire about rooms (weekly rental)",
        action: "rentroom",
        intent: "curious",
        conditions: {
            roleIncludes: ["innkeeper"],
            maxHostility: 79,
            minFavor: -69,
            custom: (npc) => typeof getNPCServiceOptions === "function" && getNPCServiceOptions(npc).some(o => o.service === "rooms")
        }
    },
    {
        id: "browse-wares",
        priority: 85,
        repeat: "always",
        kind: "action",
        service: "wares",
        label: "See wares",
        action: "trade",
        conditions: {
            roleIncludes: ["vendor", "shopkeeper", "clothier", "merchant", "trader", "bartender", "innkeeper", "blacksmith"],
            maxHostility: 79,
            minFavor: -69,
            custom: (npc, ctx) => !ctx.offDuty && typeof getNPCServiceOptions === "function" && getNPCServiceOptions(npc).some(o => o.service === "wares")
        }
    },
    // Obvious public services can start a conversation without a greeting.
    // The engine owns role eligibility and the existing service handlers.
    ...[
        ["drinks", "Order a drink"],
        ["menu", "Ask for the menu"],
        ["healing", "Ask about healing supplies"],
        ["forge", "Ask about forge services"],
        ["enchanting", "Ask about enchanting services"],
        ["tailoring", "Ask about tailoring services"],
        ["baths", "Bathhouse services"]
    ].map(([service, label], index) => ({
        id: "service-" + service,
        service,
        priority: 84.1 + index * 0.1,
        repeat: "always",
        kind: "action",
        label,
        action: "service",
        conditions: {
            custom: npc => typeof getNPCServiceOptions === "function" && getNPCServiceOptions(npc).some(o => o.service === service)
        }
    })),
    {
        id: "ask-deity",
        priority: 95,
        repeat: "session",
        label: "Ask about the old gods",
        contextNote: npc => typeof getNPCFaithContext === "function" ? getNPCFaithContext(npc) : "Use the established deities only.",
        textVariants: [
            "You ask which of the old gods still hold sway around here.",
            "You ask what they know of the gods people still pray to.",
            "You ask if any deity's name comes up more than the others."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 2, intent: "curious", markMet: true, actionTag: "ask-deity" },
        conditions: {
            roleIncludes: ["priest", "archivist", "cultist"],
            maxHostility: 70,
            excludedActionTags: ["ask-deity"]
        }
    },
    // Personal devotion, including an honest no-patron answer. The engine
    // assigns faith once and owns the reply; generic deity lore is separate.
    {
        id: "ask-their-deity",
        priority: 96,
        repeat: "session",
        label: "Ask who they pray to",
        contextNote: npc => typeof getNPCFaithContext === "function" ? getNPCFaithContext(npc) : "Use the NPC's stored patron only.",
        cacheSig: npc => String((typeof getNPCFaithPatron === "function" ? getNPCFaithPatron(npc) : npc.deity) || "none"),
        textVariants: [
            "You ask which god or spirit they personally hold to.",
            "You ask who they kneel before when no one else is watching.",
            "You ask, plainly, who they pray to."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 2, intent: "curious", markMet: true, actionTag: "ask-their-deity" },
        conditions: {
            isHumanoid: true,
            minFavor: 10,
            maxHostility: 70,
            excludedActionTags: ["ask-their-deity"]
        }
    },
    {
        id: "compliment",
        priority: 120,
        repeat: "session",
        label: "Compliment them",
        textVariants: [
            "You offer a sincere compliment and watch how they take it.",
            "You try to put them at ease with a genuine compliment.",
            "You offer a few kind words and leave the rest unforced."
        ],
        intent: "flattery",
        relationshipImpact: { mood: 1, favor: 6, hostility: -1, attraction: 3, arousal: 1, intent: "flattery", markMet: true, actionTag: "compliment" }
    },
    // WARM RAPPORT (SFW): gentle, chaste ways to build on mutual interest. They
    // open only once the NPC is attracted to the player (attraction already
    // reflects orientation and the player's appeal), likes them and is not
    // hostile, and never for an NPC who is spoken for. Nothing explicit: a
    // look, a kind word, curiosity, wanting to talk again. Anything stronger
    // lives in the NSFW catalogue. Building favour here is how a spark turns
    // into friendship; the NPC may also start asking the player questions back
    // (see getNPCCuriosityLines in the engine).
    {
        id: "rapport-harefolk-listen",
        priority: 122,
        repeat: "session",
        resetTimer: { turns: 10 },
        label: "Sit quietly and listen with them",
        textVariants: [
            "You sit beside them without a word and listen to the room the way they do, ears and all.",
            "You go still next to them and let them keep their watch, glad to share the quiet."
        ],
        intent: "flirt",
        contextNote: "The player sits quietly beside you and listens with you, sharing your watchfulness. For a harefolk this is a gentle, chaste sign of trust and fondness: someone who does not startle you and does not rush you. React as your feelings and temperament would: ears slowly relaxing, a nervous little laugh, a shy step closer, or reserve. Keep it light and non-explicit.",
        relationshipImpact: { mood: 1, favor: 3, hostility: -1, attraction: 2, intent: "flirt", markMet: true, actionTag: "rapport-harefolk-listen" },
        conditions: {
            metPlayer: true,
            species: ["harefolk"],
            minAttraction: 12,
            minFavor: 5,
            maxHostility: 35,
            custom: (npc, ctx) => _npcRapportOpen(npc, ctx, true)
        }
    },
    {
        id: "rapport-ratfolk-split",
        priority: 122,
        repeat: "session",
        resetTimer: { turns: 10 },
        label: "Offer them a fair split of a find",
        textVariants: [
            "You pull out something useful, say it is more than you need, and offer them an even half.",
            "You slide a small find across to them and say there is no price on it, this once."
        ],
        intent: "flirt",
        contextNote: "The player offers you an even share of something with no strings attached. For a ratfolk, who trades everything, this is a gentle, chaste sign of trust and fondness: being given something with no price on it. React as your feelings and temperament would: suspicion that melts, a shy chitter, a counter-gift, or reserve. Keep it light and non-explicit.",
        relationshipImpact: { mood: 1, favor: 3, hostility: -1, attraction: 2, intent: "flirt", markMet: true, actionTag: "rapport-ratfolk-split" },
        conditions: {
            metPlayer: true,
            species: ["ratfolk"],
            minAttraction: 12,
            minFavor: 5,
            maxHostility: 35,
            custom: (npc, ctx) => _npcRapportOpen(npc, ctx, true)
        }
    },
    {
        id: "rapport-kenku-trinket",
        priority: 122,
        repeat: "session",
        resetTimer: { turns: 10 },
        label: "Offer a bright trinket and say their words back",
        textVariants: [
            "You hold out something small and bright, and carefully repeat the last thing they said to you, in their own voice.",
            "You set a shiny trinket down between you and say one of their own phrases back, slowly, like a gift."
        ],
        intent: "flirt",
        contextNote: "The player gives you a bright trinket and repeats your own words back to you, kindly. For a kenku this is a gentle, chaste sign of trust and fondness: someone who kept your words. React as your feelings and temperament would, in bird sounds, borrowed phrases and body language: fluffed feathers, a wing half-open, a head tilt, a beak click, a hop closer, or reserve. Keep it light and non-explicit.",
        relationshipImpact: { mood: 1, favor: 3, hostility: -1, attraction: 2, intent: "flirt", markMet: true, actionTag: "rapport-kenku-trinket" },
        conditions: {
            metPlayer: true,
            species: ["kenku"],
            minAttraction: 12,
            minFavor: 5,
            maxHostility: 35,
            custom: (npc, ctx) => _npcRapportOpen(npc, ctx, true)
        }
    },
    {
        id: "rapport-catfolk-sunspot",
        priority: 122,
        repeat: "session",
        resetTimer: { turns: 10 },
        label: "Share a warm, sunny spot with them",
        textVariants: [
            "You settle onto the warmest patch of stone beside them and say nothing, just offering the company.",
            "You find the sunny spot they favour and sit close enough to share it, easy and quiet."
        ],
        intent: "flirt",
        contextNote: "The player sits close beside you in a warm spot, quietly sharing it. For a catfolk this is a gentle, chaste sign of trust and fondness. React as your feelings and temperament would: a purr, a flick of the tail, teasing, or reserve. Keep it light and non-explicit.",
        relationshipImpact: { mood: 1, favor: 3, hostility: -1, attraction: 2, intent: "flirt", markMet: true, actionTag: "rapport-catfolk-sunspot" },
        conditions: {
            metPlayer: true,
            species: ["catfolk"],
            minAttraction: 12,
            minFavor: 5,
            maxHostility: 35,
            custom: (npc, ctx) => _npcRapportOpen(npc, ctx, true)
        }
    },
    {
        id: "rapport-wolfkin-pack",
        priority: 122,
        repeat: "session",
        resetTimer: { turns: 10 },
        label: "Offer to walk their boundary with them",
        textVariants: [
            "You offer to walk the edge of their ground with them, shoulder to shoulder, and keep the watch.",
            "You say you would be glad to share their watch for an hour, and fall in beside them."
        ],
        intent: "flirt",
        contextNote: "The player offers to walk your boundary and share your watch. For a wolfkin this is a gentle, chaste sign of trust, the way a stranger starts to be counted as pack. React as your feelings and temperament would: guarded warmth, a quiet nod, or reserve. Keep it light and non-explicit.",
        relationshipImpact: { mood: 1, favor: 3, hostility: -1, attraction: 2, intent: "flirt", markMet: true, actionTag: "rapport-wolfkin-pack" },
        conditions: {
            metPlayer: true,
            species: ["wolfkin"],
            minAttraction: 12,
            minFavor: 5,
            maxHostility: 35,
            custom: (npc, ctx) => _npcRapportOpen(npc, ctx, true)
        }
    },
    {
        id: "rapport-satyr-toast",
        priority: 122,
        repeat: "session",
        resetTimer: { turns: 10 },
        label: "Propose a toast, just the two of you",
        textVariants: [
            "You raise an imaginary cup and propose a toast to the two of you, and to whatever mischief comes next.",
            "You grin and offer a toast, just the pair of you, to good company and bad ideas."
        ],
        intent: "flirt",
        contextNote: "The player proposes a playful toast to the two of you. For a satyr, a shared cup and a bit of banter is a warm, chaste way of showing fondness. React as your feelings and temperament would: laughing, teasing back, a flourish, or reserve. Keep it light and non-explicit.",
        relationshipImpact: { mood: 1, favor: 3, hostility: -1, attraction: 2, intent: "flirt", markMet: true, actionTag: "rapport-satyr-toast" },
        conditions: {
            metPlayer: true,
            species: ["satyr"],
            minAttraction: 12,
            minFavor: 5,
            maxHostility: 35,
            custom: (npc, ctx) => _npcRapportOpen(npc, ctx, true)
        }
    },
    {
        id: "rapport-gaze",
        priority: 121,
        repeat: "session",
        resetTimer: { turns: 8 },
        label: "Hold their gaze a moment",
        textVariants: [
            "You let your eyes meet theirs a moment longer than you need to, and smile.",
            "You hold their gaze and let a quiet smile say what you have not.",
            "You look at them a beat too long, easy and unhurried."
        ],
        intent: "flirt",
        contextNote: "The player is giving you a long, warm look and a smile. It is gentle and chaste. React as your feelings and temperament would: pleased, shy, amused, or reserved. Keep it light and non-explicit.",
        relationshipImpact: { mood: 1, favor: 2, hostility: -1, attraction: 3, intent: "flirt", markMet: true, actionTag: "rapport-gaze" },
        conditions: {
            metPlayer: true,
            minAttraction: 15,
            minFavor: 5,
            maxHostility: 35,
            custom: (npc, ctx) => _npcRapportOpen(npc, ctx, true)
        }
    },
    {
        id: "rapport-company",
        priority: 123,
        repeat: "session",
        resetTimer: { turns: 8 },
        label: "Say you enjoy their company",
        textVariants: [
            "You tell them, plainly and warmly, that you are enjoying their company.",
            "You admit that talking with them has been the best part of the day.",
            "You say it is a pleasure to have someone like them to talk to."
        ],
        intent: "flattery",
        contextNote: "The player says they enjoy your company. It is sincere and gentle. Answer honestly in your own manner, warm if you feel it, and you may say something about what you enjoy of theirs.",
        relationshipImpact: { mood: 1, favor: 4, hostility: -1, attraction: 2, intent: "flattery", markMet: true, actionTag: "rapport-company" },
        conditions: {
            metPlayer: true,
            minAttraction: 15,
            minFavor: 10,
            maxHostility: 35,
            custom: (npc, ctx) => _npcRapportOpen(npc, ctx, true)
        }
    },
    {
        id: "rapport-tease",
        priority: 124,
        repeat: "session",
        resetTimer: { turns: 10 },
        label: "Ask what they make of you",
        textVariants: [
            "You ask, with a half smile, what they have made of you so far.",
            "You wonder aloud what first impression you gave them, and wait with a grin.",
            "You ask what they think of you, lightly, daring them to be honest."
        ],
        intent: "tease",
        contextNote: "The player playfully asks what you make of them. Answer honestly and specifically from what you have actually seen of them (their looks, manner or deeds), with the playfulness your temperament allows. Gentle and non-explicit.",
        relationshipImpact: { mood: 1, favor: 2, hostility: 0, attraction: 2, intent: "tease", markMet: true, actionTag: "rapport-tease" },
        conditions: {
            metPlayer: true,
            minAttraction: 20,
            minFavor: 10,
            maxHostility: 35,
            custom: (npc, ctx) => _npcRapportOpen(npc, ctx, true)
        }
    },
    {
        id: "rapport-evening",
        priority: 126,
        rankBoost: 25,
        repeat: "session",
        resetTimer: { turns: 8 },
        label: "Ask how they spend a free evening",
        textVariants: [
            "You ask what they like to do when the work is done and an evening is their own.",
            "You ask how they spend a free evening, and what they would do with one.",
            "You ask what a good evening looks like to them."
        ],
        intent: "curious",
        contextNote: "The player asks how you like to spend a free evening. Answer from your own life, habits and pastimes, in a friendly, personal way. You may ask them something small in return.",
        relationshipImpact: { mood: 1, favor: 3, hostility: -1, attraction: 1, intent: "curious", markMet: true, actionTag: "rapport-evening" },
        conditions: {
            metPlayer: true,
            minAttraction: 12,
            minFavor: 10,
            maxHostility: 35,
            custom: (npc, ctx) => _npcRapportOpen(npc, ctx, false)
        }
    },
    {
        id: "rapport-again",
        priority: 128,
        rankBoost: 25,
        repeat: "session",
        resetTimer: { turns: 12 },
        label: "Say you hope to see them again",
        textVariants: [
            "You tell them you hope your paths cross again, and that you mean it.",
            "You say you would like to talk with them again, whenever they have the time.",
            "You say you would be glad to see them again, and let it sit there."
        ],
        intent: "curious",
        contextNote: "The player says they hope to see you again. It is a friendly, open offer of friendship that may carry some warmth. Answer as you honestly feel: glad, shy, careful or teasing, and you may name a time or place you can usually be found.",
        relationshipImpact: { mood: 1, favor: 4, hostility: -1, attraction: 2, intent: "curious", markMet: true, actionTag: "rapport-again" },
        conditions: {
            metPlayer: true,
            minAttraction: 18,
            minFavor: 15,
            maxHostility: 30,
            custom: (npc, ctx) => _npcRapportOpen(npc, ctx, false)
        }
    },
    {
        id: "apologize",
        priority: 130,
        repeat: "session",
        label: "Apologize",
        textVariants: [
            "You apologize and try to smooth things over without making a bigger scene of it.",
            "You own your part in the tension and try to ease it.",
            "You offer a simple apology and let them decide what to do with it."
        ],
        intent: "apology",
        // Only offered when there is something to apologize for.
        conditions: {
            custom: (npc, ctx) => _npcPlayerCausedFriction(ctx)
        }
    },
    {
        id: "comfort",
        priority: 140,
        repeat: "session",
        label: "Comfort them",
        textVariants: [
            "You try to reassure them in a calm, steady way.",
            "You offer a little comfort without crowding them.",
            "You speak gently and try to give them something steady to hold onto."
        ],
        intent: "comfort",
        // Needs both a reason (hurt, rattled, sour mood, recent trouble) and
        // an NPC who is not too hostile to accept it.
        conditions: {
            any: [
                { minFavor: 5 },
                { maxHostility: 55 }
            ],
            custom: (npc, ctx) => _npcNeedsComfort(npc, ctx)
        }
    },

    // Intimidation (see INTIMIDATION in the engine): shown only when there is a demand
    // that makes sense with this NPC (lower prices, serve anyway, tell what they know).
    {
        id: "intimidate",
        priority: 156,
        repeat: "always",
        label: "Intimidate them...",
        action: "intimidate",
        intent: "aggression",
        conditions: {
            custom: (npc, ctx) => typeof canIntimidateNPC === "function" && canIntimidateNPC(npc)
        }
    },
    {
        id: "insult",
        priority: 155,
        repeat: "session",
        label: "Insult them",
        textVariants: [
            "You let a barbed remark slip, aimed right where it'll sting.",
            "You cut them down with a few well-chosen words.",
            "You don't bother being kind about it and say exactly what you think."
        ],
        intent: "insult",
        relationshipImpact: { mood: -2, favor: -8, hostility: 6, aggression: 1, attraction: -3, intent: "insult", markMet: true, actionTag: "insult" }
    },
    {
        id: "tease",
        priority: 160,
        repeat: "session",
        label: "Tease playfully",
        textVariants: [
            "You tease them lightly and see whether they play along.",
            "You try a playful jab to test the mood between you.",
            "You add a bit of playful pressure and watch for their answer."
        ],
        intent: "tease",
        conditions: {
            romanceEligible: true,
            any: [
                { minFavor: 10 },
                { maxHostility: 45 },
                { minAttraction: 15 }
            ]
        }
    },
    {
        id: "trade",
        priority: 170,
        repeat: "always",
        label: "Trade",
        action: "trade",
        conditions: { tradeAvailable: true }
    },
    {
        id: "sharp-question",
        priority: 180,
        repeat: "session",
        label: (npc, ctx) => ctx.hostility >= 55 ? "Warn them sharply" : "Question them sharply",
        textVariants: [
            (npc, ctx) => ctx.hostility >= 55
                ? "You make it clear you will not tolerate trouble."
                : "You press them for a straighter answer.",
            (npc, ctx) => ctx.hostility >= 55
                ? "You answer their edge with one of your own."
                : "You cut through the pleasantries and push for the point.",
            (npc, ctx) => ctx.hostility >= 55
                ? "You give them a sharp warning and leave no doubt you mean it."
                : "You challenge them to stop circling and answer plainly."
        ],
        intent: "aggression",
        relationshipImpact: { mood: -1, favor: -5, hostility: 5, aggression: 1, intent: "aggression", markMet: true, actionTag: "sharp-question" },
        // A warning when they are already hostile; otherwise only after they
        // dodged a question you asked.
        conditions: { custom: (npc, ctx) => ctx.hostility >= 55 || _npcDodgedQuestion(npc, ctx) }
    },
    // ===== PLAYER-PERSONALITY OPTIONS =====
    // Gated on the traits tallied from the character-creation questions
    // (setupPage3 / selectPersonality -> G.player.traits). minPlayerTraits
    // requires that trait to have been picked in both of its two
    // opportunities, so this reflects a clearly established personality
    // rather than a single coin-flip answer.
    {
        id: "listen-closely",
        priority: 184,
        repeat: "session",
        resetTimer: { turns: 5 },
        label: "Listen closely",
        textVariants: [
            "You set your own agenda aside and really listen to what they are saying.",
            "You give them your full attention and let them lead the conversation.",
            "You hold back your own questions and just listen for a while."
        ],
        intent: "empathy",
        relationshipImpact: { mood: 1, favor: 4, hostility: -2, intent: "empathy", markMet: true, actionTag: "listen-closely" },
        conditions: {
            metPlayer: true,
            maxHostility: 75,
            minPlayerTraits: { empathy: 2 },
            custom: (npc, ctx) => _npcOpenedUp(npc, ctx) || _npcNeedsComfort(npc, ctx),
            excludedActionTags: ["listen-closely"]
        }
    },
    {
        id: "push-for-answers",
        priority: 186,
        repeat: "session",
        resetTimer: { turns: 5 },
        label: "Push for a straight answer",
        textVariants: [
            "You hold your ground and push for a straight answer, no dodging.",
            "You refuse to let the question slide and press them to answer plainly.",
            "You stand firm and make it clear you are not leaving without an answer."
        ],
        intent: "bold",
        relationshipImpact: (npc, ctx) => ctx.hostility >= 50
            ? { mood: -1, favor: -3, hostility: 4, intent: "bold", markMet: true, actionTag: "push-for-answers" }
            : { mood: 0, favor: 3, hostility: 1, intent: "bold", markMet: true, actionTag: "push-for-answers" },
        conditions: {
            metPlayer: true,
            minPlayerTraits: { boldness: 2 },
            custom: (npc, ctx) => _npcDodgedQuestion(npc, ctx),
            excludedActionTags: ["push-for-answers"]
        }
    },
    // -- Stat-gated options (minStats / maxStats conditions) --------------
    // Examples of the stat thresholds: the player's live stat (base + status
    // effects + gear/hygiene for charisma) must meet the threshold for the
    // option to appear at all. Kept chaste - anything beyond a friendly
    // charm belongs in the NSFW catalogue.
    {
        id: "steady-nerve",
        priority: 187,
        repeat: "session",
        resetTimer: { turns: 6 },
        label: "Hold their gaze and stay steady",
        textVariants: [
            "You hold their gaze without flinching and let the silence settle.",
            "You don't give an inch. Your voice stays level and your eyes stay on theirs.",
            "You stand your ground, calm and unhurried, and wait for them to blink first."
        ],
        intent: "bold",
        relationshipImpact: { mood: 0, favor: 1, hostility: -2, intent: "bold", markMet: true, actionTag: "steady-nerve", statXP: { willpower: 1 } },
        conditions: {
            minHostility: 50,
            minStats: { willpower: 5 },
            excludedActionTags: ["steady-nerve"]
        }
    },
    {
        id: "win-them-over",
        priority: 188,
        repeat: "session",
        resetTimer: { turns: 6 },
        label: "Turn on the charm",
        textVariants: [
            "You lean on an easy smile and a few warm words, and watch them loosen up.",
            "You turn on your most disarming charm and let it do the work.",
            "You pitch your tone friendly and unforced, and they seem to soften."
        ],
        intent: "flattery",
        relationshipImpact: { mood: 1, favor: 5, hostility: -1, attraction: 4, intent: "flattery", markMet: true, actionTag: "win-them-over" },
        // Rolled at click time (see classifyConversationChoice). Average or
        // low Charisma, a grubby appearance, or not being their type all make
        // this land less often.
        socialCheck: {
            baseDC: 12,
            success: { mood: 1, favor: 5, hostility: -1, attraction: 4, intent: "flattery", markMet: true, actionTag: "win-them-over" },
            failure: { mood: 0, favor: 0, intent: "flattery", markMet: true, actionTag: "charm-fell-flat" },
            critFail: { mood: -1, favor: -2, hostility: 1, intent: "awkward", markMet: true, actionTag: "charm-backfired" }
        },
        conditions: {
            maxHostility: 49,
            minStats: { charisma: 5 },
            excludedActionTags: ["win-them-over"]
        }
    },
    // ===== BACKSTORY PRESSURE EMISSARY =====
    // Only the NPC who comes to settle the player's past (npc.isPressureEmissary).
    {
        id: "pressure-what",
        priority: 1,
        rankBoost: 95,
        repeat: "always",
        label: "What do you want from me?",
        action: "pressure",
        pressureAction: "what",
        intent: "curious",
        conditions: { custom: (npc) => _npcIsPressureEmissary(npc) && !!_npcPressureMenu().what }
    },
    {
        id: "pressure-pay",
        priority: 1,
        rankBoost: 92,
        repeat: "always",
        label: () => { const m = _npcPressureMenu(); return "Pay what you can (" + (m.pay || 0) + " coins)"; },
        action: "pressure",
        pressureAction: "pay",
        intent: "friendly",
        conditions: { custom: (npc) => _npcIsPressureEmissary(npc) && _npcPressureMenu().pay > 0 }
    },
    {
        id: "pressure-report",
        priority: 2,
        rankBoost: 88,
        repeat: "always",
        label: "Tell them what you have done",
        action: "pressure",
        pressureAction: "report",
        intent: "friendly",
        conditions: { custom: (npc) => _npcIsPressureEmissary(npc) && !!_npcPressureMenu().report }
    },
    {
        id: "pressure-time",
        priority: 2,
        rankBoost: 85,
        repeat: "always",
        label: "Ask for more time",
        action: "pressure",
        pressureAction: "time",
        intent: "friendly",
        conditions: { custom: (npc) => _npcIsPressureEmissary(npc) && !!_npcPressureMenu().time }
    },
    {
        id: "pressure-ready",
        priority: 3,
        rankBoost: 82,
        repeat: "always",
        label: "Say you are ready",
        action: "pressure",
        pressureAction: "ready",
        intent: "aggressive",
        conditions: { custom: (npc) => _npcIsPressureEmissary(npc) && !!_npcPressureMenu().ready }
    },
    {
        id: "pressure-refuse",
        priority: 4,
        rankBoost: 80,
        repeat: "always",
        label: "Refuse to deal with them",
        action: "pressure",
        pressureAction: "refuse",
        intent: "aggressive",
        conditions: { custom: (npc) => _npcIsPressureEmissary(npc) && !!_npcPressureMenu().refuse }
    },
    // ===== GUIDE =====
    // Only the opening-guide NPC (npc.guide) gets these. They float to the top
    // of the menu (rankBoost) until the player has what they need.
    {
        id: "guide-first-step",
        priority: 1,
        rankBoost: 90,
        repeat: "always",
        label: "What should I do next?",
        text: "You ask what you should do next.",
        textVariants: ["You ask what you should do next."],
        action: "guideanswer",
        guideAnswer: "next",
        guideBeat: "plan",
        intent: "curious",
        relationshipImpact: { mood: 1, favor: 2, intent: "curious", markMet: true, actionTag: "guide-plan" },
        conditions: { custom: (npc) => _npcIsGuide(npc) }
    },
    // Opens a list of suggested questions (see showGuideQuestionMenu in the
    // engine). The player can also type any question; a keyword match gets the
    // same scripted answer (see submitTypedResponse). No AI call for answers.
    {
        id: "guide-ask-question",
        priority: 2,
        rankBoost: 75,
        repeat: "always",
        label: "Ask a question",
        action: "guidemenu",
        intent: "curious",
        conditions: { custom: (npc) => _npcIsGuide(npc) }
    },
    // Offered until the newcomer's blessing is taken: the guide leads the
    // player to the nearest shrine with the Follow mechanism (see
    // findNearestShrineDest / askNPCToLeadYou in the engine).
    {
        id: "guide-lead-shrine",
        priority: 1,
        rankBoost: 92,
        repeat: "always",
        label: "Ask them to take you to the shrine",
        action: "guideshrine",
        intent: "curious",
        conditions: {
            custom: (npc) => _npcIsGuide(npc)
                && typeof G !== "undefined" && G && G.player
                && typeof getNewcomerProtectionState === "function" && getNewcomerProtectionState(G.player) === "none"
                && typeof findNearestShrineDest === "function" && !!findNearestShrineDest()
        }
    },
    // Lead payoff: with the guide's plan heard, asking the current lead's
    // question of someone in that lead's building moves the opening arc along
    // (see ARCHETYPE_LEADS in cyoaftw-world-data.js, onLeadPayoff in the
    // engine). Any civil local can answer; the reveal text is the only fact
    // they are told to give.
    {
        id: "lead-stage-ask",
        priority: 1,
        rankBoost: 95,
        repeat: "session",
        resetTimer: { turns: 6 },
        label: (npc, ctx) => { const st = _leadStageFor(npc); return st ? st.ask : "Ask around"; },
        textVariants: [
            "You ask what you came here to find out.",
            "You lower your voice and ask what you came to ask.",
            "You say you were told this was the place to ask."
        ],
        guideBeat: "lead",
        contextNote: () => { const st = _leadStageFor(null); return st ? "The player asks something you can answer. Answer in your own voice, briefly: " + st.reveal : ""; },
        cacheSig: () => { const st = _leadStageFor(null); return "lead" + (st ? st.idx : "x"); },
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 1, intent: "curious", markMet: true, actionTag: "lead-ask" },
        conditions: { maxHostility: 49, custom: (npc, ctx) => !!_leadStageFor(npc) }
    },
    // Party: the guide asks once after the first step (see maybeOfferGuideParty
    // in the engine); these two are the standing way to change your mind. Both
    // are answered by scripted lines (handleGuidePartyChoice).
    {
        id: "guide-join-party",
        priority: 6,
        rankBoost: 65,
        repeat: "always",
        label: "Ask them to come along",
        text: "You ask whether they would travel with you.",
        textVariants: ["You ask whether they would travel with you."],
        guideParty: "accept",
        intent: "talk",
        relationshipImpact: { mood: 1, favor: 2, intent: "talk", markMet: true, actionTag: "guide-party" },
        conditions: { custom: (npc) => _npcIsGuide(npc) && !npc._inParty && _guideOrientedOrOffered() && !_guideOfferPending(npc) }
    },
    {
        id: "guide-leave-party",
        priority: 7,
        rankBoost: 5,
        kind: "action",
        repeat: "always",
        label: "Ask them to wait here",
        text: "You ask them to wait here until you come back.",
        textVariants: ["You ask them to wait here until you come back."],
        guideParty: "leave",
        intent: "talk",
        relationshipImpact: { mood: 0, favor: 0, intent: "talk", markMet: true, actionTag: "guide-party" },
        conditions: { custom: (npc) => _npcIsGuide(npc) && !!npc._inParty }
    },
    {
        id: "offer-hug",
        priority: 46,
        repeat: "always",
        kind: "action",
        label: "Offer a hug",
        action: "contact-hug",
        conditions: {
            custom: npc => typeof socialActionBlock === "function" && !socialActionBlock(npc)
        }
    },
    // Directions: opens a list of buildings this speaker knows and answers with a
    // real route over the map (see showDirectionsMenu in the engine). No AI call.
    {
        id: "ask-directions",
        priority: 47,
        repeat: "always",
        label: "Ask for directions",
        action: "directions",
        intent: "curious",
        conditions: {
            metPlayer: true,
            maxHostility: 60,
            minFavor: -20,
            custom: (npc, ctx) => ctx.isHumanoid && typeof getGuideDestinations === "function" && getGuideDestinations(npc, ctx).length > 0
        }
    },
    // Free-text bridge. When the NPC's last line expects an answer the engine
    // shows this as "Respond..." (kind "reply", with any canned replies from the
    // reply JSON next to it); otherwise it stays available as a quiet
    // "Say something..." action. The engine handles action "respond" by
    // swapping the menu for a text box. Not subject to the topic cap.
    {
        id: "respond-free",
        priority: 5,
        repeat: "always",
        kind: (npc, ctx) => _npcResponseIsPending(npc) ? "reply" : "action",
        label: (npc, ctx) => _npcResponseIsPending(npc) ? "Respond..." : "Say something...",
        action: "respond",
        conditions: { metPlayer: true }
    },
    {
        id: "goodbye",
        priority: 190,
        label: "Say goodbye",
        text: "You say goodbye and step away.",
        action: "disengage",
        intent: "goodbye",
        relationshipImpact: { mood: 0, favor: 1, intent: "goodbye", markMet: true, actionTag: "goodbye" }
    },
    
    // ===== SUBMISSIVE DEMEANOR REQUESTS =====
    // These requests appear when player selects Submissive demeanor mode in intimacy
    // They allow the player to make submissive roleplay requests to the NPC
    {
        id: "request-step-on-face",
        priority: 160,
        repeat: "always",
        label: "Request they step on your face",
        textVariants: [
            "You look up at them with a submissive expression, asking if they would be willing to step on your face.",
            "You kneel and gaze up, requesting the honor of them placing their foot on your face.",
            "With a humble tone, you ask if they'd please step on your face."
        ],
        intent: "intimacy",
        action: "intimacy",
        intimacyAction: "request_step_on_face",
        startEncounter: true,
        conditions: {
            intimacyActive: true,
            demeanorMode: ["submissive"]
        },
        contextNote: (npc, ctx) => `Player is in submissive demeanor mode and requests that ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")} step on their face. Respond in character.`
    },
    {
        id: "request-step-on-chest",
        priority: 160,
        repeat: "always",
        label: "Request they step on your chest",
        textVariants: [
            "You position yourself on the ground and ask if they would step on your chest.",
            "With a submissive posture, you request that they place their foot on your chest.",
            "You look up at them and humbly ask if they'd step on your chest."
        ],
        intent: "intimacy",
        action: "intimacy",
        intimacyAction: "request_step_on_chest",
        startEncounter: true,
        conditions: {
            intimacyActive: true,
            demeanorMode: ["submissive"]
        },
        contextNote: (npc, ctx) => `Player is in submissive demeanor mode and requests that ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")} step on their chest. Respond in character.`
    },
    {
        id: "request-squeeze-balls",
        priority: 160,
        repeat: "always",
        label: "Request they squeeze your balls",
        textVariants: [
            "You take a deep breath and ask if they would be willing to squeeze your testicles.",
            "With a submissive tone, you request that they apply pressure to your balls.",
            "You look at them with trust and ask if they'd please squeeze your balls."
        ],
        intent: "intimacy",
        action: "intimacy",
        intimacyAction: "request_squeeze_balls",
        startEncounter: true,
        conditions: {
            intimacyActive: true,
            demeanorMode: ["submissive"]
        },
        contextNote: (npc, ctx) => `Player is in submissive demeanor mode and requests that ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")} squeeze their balls. Respond in character.`
    },
    {
        id: "request-spanking",
        priority: 160,
        repeat: "always",
        label: "Request a spanking",
        textVariants: [
            "You bend over slightly and ask if they would give you a spanking.",
            "With a submissive expression, you request that they spank you.",
            "You position yourself and humbly ask for a spanking."
        ],
        intent: "intimacy",
        action: "intimacy",
        intimacyAction: "request_spanking",
        startEncounter: true,
        conditions: {
            intimacyActive: true,
            demeanorMode: ["submissive"]
        },
        contextNote: (npc, ctx) => `Player is in submissive demeanor mode and requests that ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")} spank them. Respond in character.`
    },
    {
        id: "beg-for-touch",
        priority: 160,
        repeat: "always",
        label: "Beg for their touch",
        textVariants: [
            "You look at them with pleading eyes, begging them to please touch you.",
            "With a desperate, submissive tone, you beg them to touch you.",
            "You kneel before them and beg for the gift of their touch."
        ],
        intent: "intimacy",
        action: "intimacy",
        intimacyAction: "beg_for_touch",
        startEncounter: true,
        conditions: {
            intimacyActive: true,
            demeanorMode: ["submissive"]
        },
        contextNote: (npc, ctx) => `Player is in submissive demeanor mode and begs ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")} for their touch. Respond in character.`
    },
    {
        id: "beg-for-attention",
        priority: 160,
        repeat: "always",
        label: "Beg for their attention",
        textVariants: [
            "You look up at them with a needy expression, begging for their attention.",
            "With a submissive plea, you beg them to please pay attention to you.",
            "You position yourself humbly and beg for them to focus on you."
        ],
        intent: "intimacy",
        action: "intimacy",
        intimacyAction: "beg_for_attention",
        startEncounter: true,
        conditions: {
            intimacyActive: true,
            demeanorMode: ["submissive"]
        },
        contextNote: (npc, ctx) => `Player is in submissive demeanor mode and begs ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")} for their attention. Respond in character.`
    },
    {
        id: "beg-for-use",
        priority: 160,
        repeat: "always",
        label: "Beg to be used",
        textVariants: [
            "You kneel before them with a submissive expression, begging them to use you as they please.",
            "With a desperate tone, you beg them to please use you.",
            "You look up at them with complete submission, begging to be used for their pleasure."
        ],
        intent: "intimacy",
        action: "intimacy",
        intimacyAction: "beg_for_use",
        startEncounter: true,
        conditions: {
            intimacyActive: true,
            demeanorMode: ["submissive"]
        },
        contextNote: (npc, ctx) => `Player is in submissive demeanor mode and begs ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")} to use them as they please. Respond in character.`
    },
    {
        id: "beg-for-praise",
        priority: 160,
        repeat: "always",
        label: "Beg for praise",
        textVariants: [
            "You look at them with hope, begging them to tell you that you're good.",
            "With a submissive voice, you beg them to please praise you.",
            "You kneel and plead with them to give you their approval and praise."
        ],
        intent: "intimacy",
        action: "intimacy",
        intimacyAction: "beg_for_praise",
        startEncounter: true,
        conditions: {
            intimacyActive: true,
            demeanorMode: ["submissive"]
        },
        contextNote: (npc, ctx) => `Player is in submissive demeanor mode and begs ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")} for praise. Respond in character.`
    },
    
    // ===== DOMINANT DEMEANOR REQUESTS =====
    // These commands appear when player selects Dominant demeanor mode in intimacy
    // They allow the player to make dominant roleplay commands to the NPC
    {
        id: "order-kneel",
        priority: 160,
        repeat: "always",
        label: "Order them to kneel",
        textVariants: [
            "You command them with authority to kneel before you.",
            "You give them a firm order to drop to their knees.",
            "With a dominant tone, you tell them to kneel."
        ],
        intent: "intimacy",
        action: "intimacy",
        intimacyAction: "order_kneel",
        startEncounter: true,
        conditions: {
            intimacyActive: true,
            demeanorMode: ["dominant"]
        },
        contextNote: (npc, ctx) => `Player is in dominant demeanor mode and orders ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")} to kneel. Respond in character.`
    },
    {
        id: "command-undress",
        priority: 160,
        repeat: "always",
        label: "Command them to undress",
        textVariants: [
            "You command them to remove their clothing.",
            "With authority, you order them to strip for you.",
            "You tell them firmly to take off their clothes."
        ],
        intent: "intimacy",
        action: "intimacy",
        intimacyAction: "command_undress",
        startEncounter: true,
        conditions: {
            intimacyActive: true,
            demeanorMode: ["dominant"]
        },
        contextNote: (npc, ctx) => `Player is in dominant demeanor mode and commands ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")} to undress. Respond in character.`
    },
    {
        id: "demand-serve",
        priority: 160,
        repeat: "always",
        label: "Demand they serve you",
        textVariants: [
            "You demand they serve you with a commanding tone.",
            "With authority, you tell them their place is to serve you.",
            "You assert your dominance and command them to serve."
        ],
        intent: "intimacy",
        action: "intimacy",
        intimacyAction: "demand_serve",
        startEncounter: true,
        conditions: {
            intimacyActive: true,
            demeanorMode: ["dominant"]
        },
        contextNote: (npc, ctx) => `Player is in dominant demeanor mode and demands ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")} serve them. Respond in character.`
    },
    {
        id: "demand-worship",
        priority: 160,
        repeat: "always",
        label: "Demand they worship you",
        textVariants: [
            "You demand they worship you, asserting your superiority.",
            "With a commanding voice, you order them to show worship.",
            "You tell them firmly that they should worship you."
        ],
        intent: "intimacy",
        action: "intimacy",
        intimacyAction: "demand_worship",
        startEncounter: true,
        conditions: {
            intimacyActive: true,
            demeanorMode: ["dominant"]
        },
        contextNote: (npc, ctx) => `Player is in dominant demeanor mode and demands ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")} worship them. Respond in character.`
    },
    {
        id: "assert-dominance",
        priority: 160,
        repeat: "always",
        label: "Assert your dominance",
        textVariants: [
            "You assert your dominance over them with a firm command.",
            "You make it clear who is in charge with your tone and posture.",
            "With authority, you establish your dominance over them."
        ],
        intent: "intimacy",
        action: "intimacy",
        intimacyAction: "assert_dominance",
        startEncounter: true,
        conditions: {
            intimacyActive: true,
            demeanorMode: ["dominant"]
        },
        contextNote: (npc, ctx) => `Player is in dominant demeanor mode and asserts dominance over ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")}. Respond in character.`
    },
    {
        id: "command-mouth",
        priority: 160,
        repeat: "always",
        label: "Command their mouth",
        textVariants: [
            "You command them to use their mouth on you.",
            "With authority, you order them to put their mouth to work.",
            "You tell them firmly what to do with their mouth."
        ],
        intent: "intimacy",
        action: "intimacy",
        intimacyAction: "command_mouth",
        startEncounter: true,
        conditions: {
            intimacyActive: true,
            demeanorMode: ["dominant"]
        },
        contextNote: (npc, ctx) => `Player is in dominant demeanor mode and commands ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")} to use their mouth. Respond in character.`
    },
    {
        id: "demand-obey",
        priority: 160,
        repeat: "always",
        label: "Demand they obey",
        textVariants: [
            "You demand their complete obedience.",
            "You command them to obey your every word.",
            "With authority, you make it clear they must obey you."
        ],
        intent: "intimacy",
        action: "intimacy",
        intimacyAction: "demand_obey",
        startEncounter: true,
        conditions: {
            intimacyActive: true,
            demeanorMode: ["dominant"]
        },
        contextNote: (npc, ctx) => `Player is in dominant demeanor mode and demands ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")} obey them. Respond in character.`
    },
    {
        id: "force-kneel",
        priority: 160,
        repeat: "always",
        label: "Force them to their knees",
        textVariants: [
            "You force them down to their knees with your command.",
            "With authority, you push them to kneel before you.",
            "You physically guide them to their knees as you command it."
        ],
        intent: "intimacy",
        action: "intimacy",
        intimacyAction: "force_kneel",
        startEncounter: true,
        conditions: {
            intimacyActive: true,
            demeanorMode: ["dominant"]
        },
        contextNote: (npc, ctx) => `Player is in dominant demeanor mode and forces ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")} to their knees. Respond in character.`
    },
    // ========================================================================
    // DOMINATION OPTIONS FROM CONVERSATION (for surrendered NPCs)
    // These allow dominant actions and eventually intimacy when NPC has surrendered
    // ========================================================================
    {
        id: "assert-dominance-from-surrender",
        priority: 160,
        repeat: "always",
        label: "Assert your dominance",
        textVariants: [
            "You decide to physically assert your dominance over them.",
            "You prepare to demonstrate who is in charge.",
            "With authority, you consider how to remind them of their place."
        ],
        intent: "aggression",
        action: "dominance-menu",
        menuType: "dominance",
        conditions: {
            defeatedOrSurrendered: true
        },
        contextNote: (npc, ctx) => `Player wants to assert dominance over ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")} who has surrendered. This will open a menu of dominance actions.`
    },
    {
        id: "command-from-surrender",
        priority: 159,
        repeat: "always",
        label: "Command them",
        textVariants: [
            "You decide to issue a command to your defeated foe.",
            "You prepare to give them an order they must obey.",
            "As their conqueror, you consider what to command of them."
        ],
        intent: "aggression",
        action: "command-menu",
        menuType: "command",
        conditions: {
            defeatedOrSurrendered: true
        },
        contextNote: (npc, ctx) => `Player wants to command ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")} who has surrendered. This will open a menu of command actions.`
    },
    {
        id: "use-as-i-please-from-surrender",
        priority: 158,
        repeat: "always",
        label: "Use them as I please",
        textVariants: [
            "You make it clear you will use them as you please, now that they've surrendered.",
            "You declare your intent to use their body as you see fit.",
            "With a dominant tone, you let them know they exist for your pleasure now."
        ],
        intent: "intimacy",
        action: "intimacy",
        startEncounter: true,
        conditions: {
            surrenderedToPlayer: true
        },
        onSelect: function(npc, ctx) {
            // Set dominant demeanor for the encounter
            if (!npc.intimacy) npc.intimacy = {};
            npc.intimacy._demeanorMode = "dominant";
        },
        contextNote: (npc, ctx) => `Player declares they will use ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "NPC")} as they please. Respond as someone who has surrendered control.`
    },
    // ========================================================================
    // DOMINANCE ACTIONS (for surrendered NPCs - conversation stage, not intimacy yet)
    // These are shown when player selects "Assert your dominance" or "Command them"
    // They execute dominance actions and get AI response, but do NOT start intimacy encounter
    // ========================================================================
    {
        id: "dominance-chokehold",
        priority: 155,
        repeat: "always",
        label: "Hold them in chokehold",
        textVariants: [
            "You grab them by the throat and pull them close, holding them in a firm chokehold to assert your control.",
            "With a commanding grip, you seize their throat and hold them in a chokehold, making your dominance clear.",
            "You wrap your arm around their throat and squeeze slightly, demonstrating who is in charge."
        ],
        intent: "aggression",
        action: "dominance-action",
        dominanceAction: "chokehold",
        conditions: {
            defeatedOrSurrendered: true
        },
        relationshipImpact: { mood: -2, favor: -3, hostility: 2, intent: "aggression", markMet: true, actionTag: "dominance-asserted" },
        contextNote: (npc, ctx) => `Player has ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")} in a chokehold after they surrendered. They are showing their submission. Respond in character based on your temperament (bold NPCs may challenge, meek NPCs may whimper, etc.).`
    },
    {
        id: "dominance-grab-hair",
        priority: 155,
        repeat: "always",
        label: "Grab a handful of their hair",
        textVariants: [
            "You grab a handful of their hair and pull their head back, forcing them to look up at you.",
            "With a firm grip, you seize their hair and yank their head back, establishing your control.",
            "You take hold of their hair and pull, making them gasp as you assert your dominance."
        ],
        intent: "aggression",
        action: "dominance-action",
        dominanceAction: "grab_hair",
        conditions: {
            defeatedOrSurrendered: true
        },
        relationshipImpact: { mood: -2, favor: -3, hostility: 2, intent: "aggression", markMet: true, actionTag: "dominance-asserted" },
        contextNote: (npc, ctx) => `Player has grabbed ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")}'s hair and pulled their head back after surrender. Respond in character based on your temperament.`
    },

    // ========================================================================
    // COMMAND ACTIONS (for surrendered NPCs - conversation stage, not intimacy yet)
    // These are shown when player selects "Command them"
    // ========================================================================
    {
        id: "command-kneel",
        priority: 154,
        repeat: "always",
        label: "Command them to kneel",
        textVariants: [
            "You command them to drop to their knees before you.",
            "With authority, you order them to kneel in submission.",
            "You point to the ground and command them to kneel, reminding them of their defeated state."
        ],
        intent: "aggression",
        action: "command-action",
        commandType: "kneel",
        conditions: {
            defeatedOrSurrendered: true
        },
        relationshipImpact: { mood: -1, favor: -2, hostility: 1, intent: "aggression", markMet: true, actionTag: "command-given" },
        contextNote: (npc, ctx) => `Player has commanded ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")} to kneel after they surrendered. They must obey. Respond in character as someone who has accepted defeat, based on your temperament.`
    },
    {
        id: "command-serve",
        priority: 154,
        repeat: "always",
        label: "Command them to serve you",
        textVariants: [
            "You command them to begin serving you in whatever way you require.",
            "With a firm voice, you order them to attend to your needs as their conqueror.",
            "You make it clear that their purpose now is to serve you, and they must obey."
        ],
        intent: "aggression",
        action: "command-action",
        commandType: "serve",
        conditions: {
            defeatedOrSurrendered: true
        },
        relationshipImpact: { mood: -1, favor: -2, hostility: 1, intent: "aggression", markMet: true, actionTag: "command-given" },
        contextNote: (npc, ctx) => `Player has commanded ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")} to serve them after surrender. Respond in character as someone compelled to obey, based on your temperament.`
    },
    {
        id: "command-strip",
        priority: 154,
        repeat: "always",
        label: "Command them to strip",
        textVariants: [
            "You command them to remove all their clothing.",
            "With authority, you order them to strip completely for your inspection.",
            "You tell them to take off their clothes, leaving them vulnerable before you."
        ],
        intent: "aggression",
        action: "command-action",
        commandType: "strip",
        conditions: {
            defeatedOrSurrendered: true
        },
        relationshipImpact: { mood: -2, favor: -3, hostility: 2, intent: "aggression", markMet: true, actionTag: "command-given" },
        contextNote: (npc, ctx) => `Player has commanded ${ctx.nameKnown ? npc.name || "them" : "the " + (npc.epithet || npc.name || npc.epithet || "them")} to strip after they surrendered. Respond in character as someone who must obey despite the humiliation, based on your temperament.`
    },

    // ========================================================================
    // BATHHOUSE SERVICES - SFW CONVERSATION OPTIONS
    // ========================================================================
    {
        id: "ask_about_private_services",
        priority: 35,
        repeat: "session",
        resetTimer: { turns: 10 },
        label: (npc, ctx) => {
            if (npc && npc.role === "BathhouseAttendant") return "Ask about private services";
            if (npc && npc.role === "BathhousePractitioner") return "Ask about private treatments";
            if (npc && npc.role === "Bathkeeper") return "Inquire about special services";
            return "Ask about private bathhouse services";
        },
        textVariants: [
            "You subtly ask if they offer any... private services beyond the regular baths.",
            "You inquire about special treatments, wondering if there are services not on the public menu.",
            "You carefully ask about private bathhouse services, keeping your tone discreet."
        ],
        intent: "inquiry",
        isInquiry: true,
        kind: "topic",
        action: "bathhouse_inquire_private",

        relationshipImpact: { mood: 0, favor: 0, hostility: 0, intent: "inquiry" },
        conditions: {
            custom: function(npc, ctx) {
                // Only show if NPC is bathhouse staff and player has reputation
                if (!npc) return false;
                if (npc.role !== "BathhouseAttendant" && npc.role !== "BathhousePractitioner" && npc.role !== "Bathkeeper") {
                    return false;
                }
                // Check if player has established reputation (5 services + tipped)
                if (!ctx.bathhouseReputation) return false;
                return true;
            }
        },
        contextNote: (npc, ctx) => {
            let note = "This NPC works at the bathhouse. ";
            
            // Determine NPC gender for appropriate response
            const gender = String(npc.gender || "female").toLowerCase();
            const isAttracted = ctx && ctx.attraction > 50;
            const role = String(npc.role || "");
            
            // Check if NPC is currently in a bathhouse room
            const inBathhouse = ctx && ctx.room && typeof isBathhouseRoom === "function" && isBathhouseRoom(ctx.room);
            
            // Context: first time vs returning client
            if (ctx && ctx.player && ctx.player.bathhouseServiceCount) {
                note += "This is a returning client with " + ctx.player.bathhouseServiceCount + " previous bathhouse service(s). ";
            } else {
                note += "This is a first-time client for private services. ";
            }
            
            note += "They have a ";
            if (npc.traits && (npc.traits.includes("professional") || npc.traits.includes("flirty") || npc.traits.includes("dominant"))) {
                note += (npc.traits.includes("dominant") ? "firm, controlling manner" : npc.traits.includes("flirty") ? "playful, teasing manner" : "professional, courteous manner") + ". ";
            } else {
                note += "neutral demeanor. ";
            }
            
            // Add location context
            if (!inBathhouse) {
                note += "You are NOT currently at the bathhouse. Respond that they should ask you when you are on duty at the bathhouse.";
                return note;
            }
            
            // Add guidance for AI response based on attraction
            if (isAttracted) {
                note += "The player has established reputation and you are attracted to them. ";
                note += "Respond flirtatiously with character-appropriate hints: hesitate and glance at the door, then lean close with warm breath, whisper suggestions about special treatment, and mention you can work something out. Keep it SFW - implication and suggestion only, no explicit physical descriptions. ";
                note += "Species: " + (npc.species || "human") + ". Gender: " + gender + ". ";
                note += "End your response with a clear indication that you are locking the door.";
            } else {
                note += "The player has established reputation but you're not particularly attracted. ";
                note += "Respond professionally: \"You should speak to the Matron about this.\" or \"The Bathkeeper handles those arrangements.\"";
            }
            
            note += " Answer in character. Use narrative style appropriate to the situation.";
            return note;
        }
    },
    // ========================================================================
    // BATHKEEPER/MATRON - ARRANGE PRIVATE SERVICE (business-like flow)
    // ========================================================================
    {
        id: "arrange_private_service",
        priority: 35,
        repeat: "session",
        label: (npc, ctx) => {
            return "Arrange private service";
        },
        textVariants: [
            "You ask the Bathkeeper/Matron to arrange a private service with one of their attendants."
        ],
        intent: "service",
        action: "bathhouse_arrange_private",
        conditions: {
            custom: function(npc, ctx) {
                // Only show for Bathkeeper (Matron is an alias for Bathkeeper)
                if (!npc) return false;
                const role = String(npc.role || "");
                if (role !== "Bathkeeper" && role !== "Matron") {
                    return false;
                }
                // Player must have established reputation
                if (!ctx.bathhouseReputation) return false;
                // Check if we're in a bathhouse room
                if (ctx && ctx.room && typeof isBathhouseRoom === "function" && !isBathhouseRoom(ctx.room)) {
                    return false;
                }
                return true;
            }
        },
        contextNote: (npc, ctx) => {
            return "You are asking the Bathkeeper/Matron to arrange a private service. " +
                   "List the available bathhouse workers (BathhouseAttendant, BathhousePractitioner) in this building " +
                   "with their name, gender, and species. " +
                   "For each worker, show their price and available services. " +
                   "Present this as a professional business arrangement. " +
                   "Mention that the Matron will call the selected worker, who will then arrive, nod to the player, and lead them to a private room.";
        }
    },
    // ========================================================================
    // PLAYER AS BATHHOUSE PROVIDER - SERVICE REQUESTS
    // ========================================================================
    {
        id: "offer_bathhouse_service",
        priority: 40,
        repeat: "session",
        label: (npc, ctx) => {
            // Only show when NPC wants to request service from player
            if (npc._bathhouseRequestToPlayer) {
                const request = npc._bathhouseRequestToPlayer;
                return "Accept " + (request.serviceName || "service request") + " - " + (typeof getBathhouseServiceCost === 'function' ? getBathhouseServiceCost(request.serviceId) : '?') + " gold";
            }
            return "Offer bathhouse service";
        },
        textVariants: [
            (npc, ctx) => {
                const request = npc._bathhouseRequestToPlayer;
                if (request) {
                    return "You accept " + (npc.name || "their") + " request for " + (request.serviceName || "a private service") + " at " + request.finalPrice + " gold.";
                }
                return "You offer your services as a bathhouse provider.";
            }
        ],
        intent: "service",
        action: "bathhouse_accept",
        conditions: {
            custom: function(npc, ctx) {
                // Only show if NPC has a pending request to player
                if (!npc || !npc._bathhouseRequestToPlayer) return false;
                const request = npc._bathhouseRequestToPlayer;
                // Check if player can accept
                if (ctx.player) {
                    return canPlayerAcceptBathhouseRequest(ctx.player, request);
                }
                return true;
            }
        },
        contextNote: (npc, ctx) => {
            const request = npc._bathhouseRequestToPlayer;
            if (!request) return "This NPC has requested a bathhouse service from you.";
            return "NPC " + (npc.name || "") + " is requesting " + request.serviceName + 
                   " service. Price: " + request.finalPrice + " gold. " +
                   "As the provider, describe your professional acceptance and preparation. " +
                   "Mention your manner (" + request.providerStyle + ") and any preparation needed.";
        }
    },
    {
        id: "decline_bathhouse_service",
        priority: 40,
        repeat: "session",
        label: (npc, ctx) => {
            if (npc._bathhouseRequestToPlayer) {
                return "Decline the service request";
            }
            return "Decline service";
        },
        textVariants: [
            (npc, ctx) => {
                const request = npc._bathhouseRequestToPlayer;
                if (request) {
                    return "You politely decline " + (npc.name || "their") + " request for " + (request.serviceName || "service") + ".";
                }
                return "You decline to provide services at this time.";
            }
        ],
        intent: "refusal",
        action: "bathhouse_decline",
        conditions: {
            custom: function(npc, ctx) {
                // Only show if NPC has a pending request to player
                return !!(npc && npc._bathhouseRequestToPlayer);
            }
        },
        relationshipImpact: { mood: -1, favor: -2, hostility: +1, intent: "refusal" },
        contextNote: (npc, ctx) => {
            const request = npc._bathhouseRequestToPlayer;
            if (!request) return "This NPC has requested a service from you.";
            return "NPC " + (npc.name || "") + " requested " + request.serviceName + 
                   " service. Respond to their request with a polite refusal. " +
                   "Mention your reason (busy, tired, not interested) in character.";
        }
    },
    {
        id: "negotiate_bathhouse_price",
        priority: 38,
        repeat: "session",
        label: (npc, ctx) => {
            if (npc._bathhouseRequestToPlayer) {
                return "Negotiate the price";
            }
            return "Negotiate price";
        },
        textVariants: [
            (npc, ctx) => {
                const request = npc._bathhouseRequestToPlayer;
                if (request) {
                    return "You attempt to negotiate the price for " + (request.serviceName || "the service") + ".";
                }
                return "You discuss pricing for services.";
            }
        ],
        intent: "negotiation",
        action: "bathhouse_negotiate",
        conditions: {
            custom: function(npc, ctx) {
                // Only show if NPC has a pending request and player has high charisma
                if (!npc || !npc._bathhouseRequestToPlayer) return false;
                if (ctx.player && ctx.player.stats && ctx.player.stats.CHA >= 12) {
                    return true;
                }
                return false;
            }
        },
        contextNote: (npc, ctx) => {
            const request = npc._bathhouseRequestToPlayer;
            if (!request) return "Negotiate the price for services.";
            return "NPC " + (npc.name || "") + " is offering " + request.finalPrice + " gold for " +
                   request.serviceName + ". As a skilled negotiator (high charisma), " +
                   "attempt to secure a better price. Describe your persuasion in character.";
        }
    },
    // Bathhouse - hint about earning more with private services (shown to qualified providers)
    {
        id: "hint_bathhouse_earn_more",
        priority: 35,
        repeat: "session",
        label: (npc, ctx) => {
            if (npc.role === "Bathkeeper") {
                return "Ask about higher earning opportunities";
            }
            return "Inquire about private service earnings";
        },
        textVariants: [
            "You subtly ask if there are ways to earn more as a provider here.",
            "You wonder aloud about private service opportunities and their pay.",
            "You inquire about the most lucrative services offered at the bathhouse."
        ],
        intent: "inquiry",
        isInquiry: true,
        kind: "topic",
        conditions: {
            custom: function(npc, ctx) {
                // Only show to bathhouse staff/qualified providers
                if (!npc || !ctx || !ctx.player) return false;
                
                // NPC must be bathhouse staff
                if (!["Bathkeeper", "BathhouseAttendant", "BathhousePractitioner"].includes(npc.role)) {
                    return false;
                }
                
                // Player must be qualified for at least manual services
                const player = ctx.player;
                if (!player.bathhouseProvider && !player.bathhouseTraining) {
                    return false;
                }
                
                // Check if player has passed the trial or worked before
                const hasExperience = player.bathhouseTraining && Object.keys(player.bathhouseTraining).length > 0;
                const hasWorked = player.bathhouseServicesProvided && player.bathhouseServicesProvided > 0;
                
                // Only show hint if player has some experience
                return hasExperience || hasWorked;
            }
        },
        contextNote: (npc, ctx) => {
            let note = "This NPC works at the bathhouse. ";
            if (npc.role === "Bathkeeper") {
                note += "As the matron, they know all about service tiers and earnings. ";
            } else if (npc.role === "BathhousePractitioner") {
                note += "As a practitioner, they earn well from private treatments. ";
            } else {
                note += "As an attendant, they may know about advancement opportunities. ";
            }
            note += "Answer in character about how providers can earn more through private services. " +
                    "Mention that qualified practitioners can offer massage, oral, and intercourse services " +
                    "for higher fees (50-200 gold), with the bathhouse taking a 30% cut. " +
                    "Encourage the player to pass their trial if they haven't already.";
            return note;
        }
    },
    // Bathhouse - player asks how to become a qualified provider
    {
        id: "ask_bathhouse_qualification",
        priority: 34,
        repeat: "session",
        label: "Ask how to become a qualified provider",
        textVariants: [
            "You ask what it takes to offer the more lucrative private services.",
            "You inquire about the qualification process for higher-tier services.",
            "You wonder how one becomes a massage practitioner with full service privileges."
        ],
        intent: "inquiry",
        isInquiry: true,
        kind: "topic",
        conditions: {
            custom: function(npc, ctx) {
                // Only show to bathhouse staff when player is NOT yet qualified
                if (!npc || !ctx || !ctx.player) return false;
                
                // NPC must be bathhouse staff
                if (!["Bathkeeper", "BathhouseAttendant", "BathhousePractitioner"].includes(npc.role)) {
                    return false;
                }
                
                const player = ctx.player;
                // Player should not already be qualified
                const isQualified = player.bathhouseTraining && 
                    Object.values(player.bathhouseTraining).some(t => t.qualified);
                
                return !isQualified;
            }
        },
        contextNote: (npc, ctx) => {
            let note = "This NPC works at the bathhouse. ";
            if (npc.role === "Bathkeeper") {
                note += "As the matron, they oversee qualifications. ";
            } else if (npc.role === "BathhousePractitioner") {
                note += "As a practitioner, they can share their experience. ";
            }
            note += "Answer in character: to offer massage and private services, the player must " +
                    "pass a practical trial (Flexibility check, DC 11) supervised by the bathkeeper. " +
                    "Once qualified, they can provide all service tiers. Attendants can only do manual services " +
                    "(40-60 gold) while practitioners can do all tiers (up to 200 gold). Encourage them to speak to the keeper.";
            return note;
        }
    },
    
    // ===== NSFW OPTIONS =====
    // NSFW catalogue entries (flirt / seduce / touch_intimately /
    // start_intimacy) live in cyoaftw-npc-data-nsfw.js and are merged into the
    // active catalogue at query time via window.NPC_NSFW_CONVERSATION_CATALOGUE.
    // Do NOT re-inline them here; keeping them out keeps this file readable by
    // SFW-only tooling.
];

// Export catalogue to window immediately after definition for NSFW system access
if (typeof window !== "undefined") {
    window.NPC_CONVERSATION_CATALOGUE = NPC_CONVERSATION_CATALOGUE;
}

// Player's live stat values (base + status effects + gear/hygiene for
// charisma, via getSetupStat in cyoaftw-engine-CORE.js) for the minStats /
// maxStats conditions. Guarded with typeof so this file keeps working when
// loaded standalone or before the engine payload exposes getSetupStat.
function _npcGetPlayerStats() {
    var out = {};
    if (typeof getSetupStat !== "function") return out;
    ["physicalProwess", "flexibility", "willpower", "endurance", "charisma"].forEach(function (statKey) {
        out[statKey] = getSetupStat(statKey, 3);
    });
    return out;
}

function getNPCConversationContext(npc, extraContext = {}) {
    if (!npc) return null;
    ensureNPCRelationshipState(npc);
    const conversationState = ensureNPCConversationState(npc);

    const room = extraContext.room || (typeof G === "object" ? G.activeRoom : null) || null;
    const actionTags = getNPCActionTags(npc, 20);
    const story = typeof ensureStoryStateShape === "function"
        ? ensureStoryStateShape(typeof G === "object" ? G.story : null)
        : ((typeof G === "object" && G && G.story && typeof G.story === "object") ? G.story : null);
    const externalState = extraContext.externalState && typeof extraContext.externalState === "object"
        ? extraContext.externalState
        : {};

    return {
        npc,
        player: (typeof G === "object" && G && G.player) ? G.player : null,
        room,
        role: String(npc.role || "").toLowerCase(),
        species: String(npc.species || "").toLowerCase(),
        temperament: String(npc.temperament || "").toLowerCase(),
        favor: npc.memory && typeof npc.memory.favorability === "number" ? npc.memory.favorability : 0,
        hostility: typeof npc.hostility === "number" ? npc.hostility : 0,
        // Single stat pool: npc.memory.* (see migrateNPCRelationshipPool —
        // the old NSFW-side npc.relationship.* values are folded in once,
        // and every writer now targets memory.*).
        attraction: (npc.memory && typeof npc.memory.attraction === "number" ? npc.memory.attraction : 0),
        lust: (npc.memory && typeof npc.memory.lust === "number" ? npc.memory.lust : 0),
        arousal: (npc.memory && typeof npc.memory.arousal === "number" ? npc.memory.arousal : 0),
        disinhibition: (npc.memory && typeof npc.memory.disinhibition === "number" ? npc.memory.disinhibition : 0),
        orientation: String((npc.memory && npc.memory.orientation) || "bi").toLowerCase(),
        actDisinhibition: (npc.memory && npc.memory.actDisinhibition && typeof npc.memory.actDisinhibition === "object" ? npc.memory.actDisinhibition : {}),
        metPlayer: !!(npc.memory && npc.memory.metPlayer),
        nameKnown: !!(npc.memory && npc.memory.nameKnown),
        everGreeted: !!(npc.memory && npc.memory.everGreeted),
        // True while this is still the same conversation: the player has not
        // changed rooms since last talking to this NPC, OR the NPC is walking
        // with the player (follower, guide, party), OR it was only a few story
        // turns ago. Used so a greeting never says "it has been a while" mid-chat.
        stayedSinceLastTalk: _npcSameConversation(npc),
        walkingTogether: _npcWalkingWithPlayer(npc),
        mood: String(npc.memory && npc.memory.lastMood || "neutral").toLowerCase(),
        disposition: typeof getCurrentNPCDisposition === "function"
            ? String(getCurrentNPCDisposition(npc) || "").toLowerCase()
            : "neutral",
        relationship: typeof getRelationshipLabel === "function"
            ? String(getRelationshipLabel(npc) || "").toLowerCase()
            : "neutral",
        isHumanoid: npc.isHumanoid === true,
        // True when the NPC follows a deity: a shrine devotee, any cleric, or
        // a civilized NPC with a saved one-time devotion result
        // (ensureNPCDeity in cyoaftw-engine-CORE.js).
        hasOwnDeity: !!(typeof getNPCFaithPatron === "function" ? getNPCFaithPatron(npc) : typeof ensureNPCDeity === "function" ? ensureNPCDeity(npc) : npc.deity),
        romanceEligible: typeof isAdultHumanoidNPC === "function" ? isAdultHumanoidNPC(npc) : false,
        tradeAvailable: typeof shouldShowPostReplyTradeAction === "function" ? shouldShowPostReplyTradeAction(npc) : false,
        // Staff who have gone home are off duty (see SHOP HOURS in the engine).
        offDuty: typeof isNPCOffDuty === "function" ? isNPCOffDuty(npc, room) : false,
        actionTags,
        roomType: String(room && room.type || "").toLowerCase(),
        roomRole: String(room && room.role || "").toLowerCase(),
        zoneName: String(room && room.zone || "").toLowerCase(),
        aggressionCount: npc.memory && typeof npc.memory.aggressionCount === "number" ? npc.memory.aggressionCount : 0,
        usedOptionIds: Array.isArray(conversationState && conversationState.usedOptionIds)
            ? conversationState.usedOptionIds.slice()
            : [],
        sessionUsedOptionIds: Array.isArray(conversationState && conversationState.sessionUsedOptionIds)
            ? conversationState.sessionUsedOptionIds.slice()
            : [],
        interactionCount: conversationState && typeof conversationState.interactionCount === "number"
            ? conversationState.interactionCount
            : 0,
        sessionInteractionCount: conversationState && typeof conversationState.sessionInteractionCount === "number"
            ? conversationState.sessionInteractionCount
            : 0,
        lastOptionId: conversationState && typeof conversationState.lastOptionId === "string"
            ? conversationState.lastOptionId
            : "",
        lastTopic: conversationState && typeof conversationState.lastTopic === "string"
            ? conversationState.lastTopic
            : "",
        lastLoreFactId: conversationState && typeof conversationState.lastLoreFactId === "string"
            ? conversationState.lastLoreFactId
            : "",
        optionUsage: conversationState && conversationState.optionUsage && typeof conversationState.optionUsage === "object"
            ? { ...conversationState.optionUsage }
            : {},
        storyTurn: story && typeof story.turnCounter === "number" ? story.turnCounter : 0,
        storyEventCounter: story && typeof story.eventCounter === "number" ? story.eventCounter : 0,
        storyFlags: story && story.flags && typeof story.flags === "object" ? story.flags : {},
        storyRecentEvents: story && Array.isArray(story.recentEvents) ? story.recentEvents.slice() : [],
        externalState,
        // Player personality profile from the character-creation questions
        // (see getPlayerTraitCounts/getPlayerDominantTrait in cyoaftw-engine-CORE.js).
        // Guarded with typeof so this file keeps working even if loaded
        // standalone or before the engine payload defines those helpers.
        playerTraits: typeof getPlayerTraitCounts === "function" ? getPlayerTraitCounts() : {},
        playerDominantTrait: typeof getPlayerDominantTrait === "function"
            ? String(getPlayerDominantTrait() || "").toLowerCase()
            : "",
        // Live player stat values for minStats/maxStats conditions.
        playerStats: _npcGetPlayerStats(),
        // Intimacy demeanor mode (consentual/submissive/dominant) for roleplay-specific options
        demeanorMode: (npc.intimacy && npc.intimacy._demeanorMode) ? String(npc.intimacy._demeanorMode).toLowerCase() : "consentual",
        // Whether an intimacy encounter is currently active
        intimacyActive: !!(npc.intimacy && npc.intimacy.encounter && npc.intimacy.encounter.active),
        // Whether NPC has surrendered to the player and it's still valid
        surrenderedToPlayer: typeof isNPCSurrenderedToPlayer === "function" && isNPCSurrenderedToPlayer(npc, G.player),
        // Bathhouse reputation: has player used services 5+ times and tipped
        bathhouseReputation: !!(typeof G === "object" && G && G.player && G.player.bathhouseServiceCount >= 5 && G.player.bathhouseTipped),
        // Whether NPC is defeated or has surrendered to the player
        defeatedOrSurrendered: typeof isNPCDefeatedOrSurrendered === "function" && isNPCDefeatedOrSurrendered(npc, G.player)
    };
}

function conversationConditionMatches(conditions, ctx) {
    if (!conditions) return true;
    if (!ctx) return false;

    if (Array.isArray(conditions.all) && !conditions.all.every(entry => conversationConditionMatches(entry, ctx))) {
        return false;
    }

    if (Array.isArray(conditions.any) && conditions.any.length &&
        !conditions.any.some(entry => conversationConditionMatches(entry, ctx))) {
        return false;
    }

    if (conditions.not && conversationConditionMatches(conditions.not, ctx)) {
        return false;
    }

    if (typeof conditions.metPlayer === "boolean" && ctx.metPlayer !== conditions.metPlayer) return false;
    if (typeof conditions.nameKnown === "boolean" && ctx.nameKnown !== conditions.nameKnown) return false;
    if (typeof conditions.isHumanoid === "boolean" && ctx.isHumanoid !== conditions.isHumanoid) return false;
    if (typeof conditions.romanceEligible === "boolean" && ctx.romanceEligible !== conditions.romanceEligible) return false;
    if (typeof conditions.hasOwnDeity === "boolean" && ctx.hasOwnDeity !== conditions.hasOwnDeity) return false;
    if (typeof conditions.tradeAvailable === "boolean" && ctx.tradeAvailable !== conditions.tradeAvailable) return false;

    if (conditions.species && !_npcValueInList(ctx.species, conditions.species)) return false;
    if (conditions.excludeSpecies && _npcValueInList(ctx.species, conditions.excludeSpecies)) return false;
    if (conditions.temperaments && !_npcValueInList(ctx.temperament, conditions.temperaments)) return false;
    if (conditions.excludeTemperaments && _npcValueInList(ctx.temperament, conditions.excludeTemperaments)) return false;
    if (conditions.relationships && !_npcValueInList(ctx.relationship, conditions.relationships)) return false;
    if (conditions.dispositions && !_npcValueInList(ctx.disposition, conditions.dispositions)) return false;
    if (conditions.requiredPlayerTraits && !_npcValueInList(ctx.playerDominantTrait, conditions.requiredPlayerTraits)) return false;
    if (conditions.excludedPlayerTraits && _npcValueInList(ctx.playerDominantTrait, conditions.excludedPlayerTraits)) return false;
    if (conditions.roomTypes && !_npcValueInList(ctx.roomType, conditions.roomTypes)) return false;
    if (conditions.roomRoles && !_npcValueInList(ctx.roomRole, conditions.roomRoles)) return false;
    if (conditions.zoneNames && !_npcValueInList(ctx.zoneName, conditions.zoneNames)) return false;

    if (conditions.roles && !_npcValueInList(ctx.role, conditions.roles)) return false;
    if (conditions.excludeRoles && _npcValueInList(ctx.role, conditions.excludeRoles)) return false;
    if (conditions.roleIncludes && !_npcTextIncludesAny(ctx.role, conditions.roleIncludes)) return false;
    if (conditions.excludeRoleIncludes && _npcTextIncludesAny(ctx.role, conditions.excludeRoleIncludes)) return false;
    if (conditions.requiredStoryFlags && !_npcHasNamedFlags(ctx.storyFlags, conditions.requiredStoryFlags)) return false;
    if (conditions.excludedStoryFlags && _npcHasAnyNamedFlags(ctx.storyFlags, conditions.excludedStoryFlags)) return false;
    if (conditions.requiredExternalFlags && !_npcHasNamedFlags(ctx.externalState, conditions.requiredExternalFlags)) return false;
    if (conditions.excludedExternalFlags && _npcHasAnyNamedFlags(ctx.externalState, conditions.excludedExternalFlags)) return false;
    if (conditions.requiredStoryEventTypes && !_npcRecentEventMatches(ctx.storyRecentEvents, {
        types: conditions.requiredStoryEventTypes
    })) {
        return false;
    }
    if (conditions.requiredStoryEventTags && !_npcRecentEventMatches(ctx.storyRecentEvents, {
        tags: conditions.requiredStoryEventTags
    })) {
        return false;
    }
    if (conditions.requiredOptionIds && !_npcActionTagsInclude(ctx.usedOptionIds, conditions.requiredOptionIds)) return false;
    if (conditions.requiredSessionOptionIds && !_npcActionTagsInclude(ctx.sessionUsedOptionIds, conditions.requiredSessionOptionIds)) return false;
    if (conditions.excludedOptionIds && _npcNormalizeList(conditions.excludedOptionIds)
        .some(id => _npcActionTagsInclude(ctx.usedOptionIds, [id]))) {
        return false;
    }
    if (conditions.excludedSessionOptionIds && _npcNormalizeList(conditions.excludedSessionOptionIds)
        .some(id => _npcActionTagsInclude(ctx.sessionUsedOptionIds, [id]))) {
        return false;
    }

    if (typeof conditions.minFavor === "number" && ctx.favor < conditions.minFavor) return false;
    if (typeof conditions.maxFavor === "number" && ctx.favor > conditions.maxFavor) return false;
    if (typeof conditions.minHostility === "number" && ctx.hostility < conditions.minHostility) return false;
    if (typeof conditions.maxHostility === "number" && ctx.hostility > conditions.maxHostility) return false;
    if (typeof conditions.minLust === "number" && ctx.lust < conditions.minLust) return false;
    if (typeof conditions.maxLust === "number" && ctx.lust > conditions.maxLust) return false;
    if (typeof conditions.minAttraction === "number" && ctx.attraction < conditions.minAttraction) return false;
    if (typeof conditions.maxAttraction === "number" && ctx.attraction > conditions.maxAttraction) return false;
    if (typeof conditions.minArousal === "number" && ctx.arousal < conditions.minArousal) return false;
    if (typeof conditions.maxArousal === "number" && ctx.arousal > conditions.maxArousal) return false;
    if (typeof conditions.minDisinhibition === "number" && ctx.disinhibition < conditions.minDisinhibition) return false;
    if (typeof conditions.maxDisinhibition === "number" && ctx.disinhibition > conditions.maxDisinhibition) return false;
    if (conditions.minActDisinhibition && typeof conditions.minActDisinhibition === "object") {
        var actMap = ctx.actDisinhibition || {};
        for (var k in conditions.minActDisinhibition) {
            if (!Object.prototype.hasOwnProperty.call(conditions.minActDisinhibition, k)) continue;
            var need = conditions.minActDisinhibition[k];
            if (typeof need !== "number") continue;
            var have = typeof actMap[k] === "number" ? actMap[k] : 0;
            if (have < need) return false;
        }
    }
    if (conditions.maxActDisinhibition && typeof conditions.maxActDisinhibition === "object") {
        var actMapMax = ctx.actDisinhibition || {};
        for (var kMax in conditions.maxActDisinhibition) {
            if (!Object.prototype.hasOwnProperty.call(conditions.maxActDisinhibition, kMax)) continue;
            var cap = conditions.maxActDisinhibition[kMax];
            if (typeof cap !== "number") continue;
            var haveMax = typeof actMapMax[kMax] === "number" ? actMapMax[kMax] : 0;
            if (haveMax > cap) return false;
        }
    }
    if (typeof conditions.minAggressionCount === "number" && ctx.aggressionCount < conditions.minAggressionCount) return false;
    if (typeof conditions.maxAggressionCount === "number" && ctx.aggressionCount > conditions.maxAggressionCount) return false;
    if (typeof conditions.minInteractionCount === "number" && ctx.interactionCount < conditions.minInteractionCount) return false;
    if (typeof conditions.maxInteractionCount === "number" && ctx.interactionCount > conditions.maxInteractionCount) return false;
    if (typeof conditions.minSessionInteractionCount === "number" && ctx.sessionInteractionCount < conditions.minSessionInteractionCount) return false;
    if (typeof conditions.maxSessionInteractionCount === "number" && ctx.sessionInteractionCount > conditions.maxSessionInteractionCount) return false;

    // Player personality thresholds, e.g. { curiosity: 2 } requires the
    // player to have picked "curiosity" at least twice during setup.
    if (conditions.minPlayerTraits && typeof conditions.minPlayerTraits === "object") {
        const playerTraits = ctx.playerTraits || {};
        const meetsAll = Object.keys(conditions.minPlayerTraits).every(function (traitKey) {
            const need = conditions.minPlayerTraits[traitKey];
            const have = typeof playerTraits[traitKey] === "number" ? playerTraits[traitKey] : 0;
            return have >= need;
        });
        if (!meetsAll) return false;
    }

    // Player stat thresholds, e.g. { charisma: 5 } requires the player's
    // current (gear/status-adjusted) Charisma to be at least 5. minStats and
    // maxStats are checked independently, so both can be used together for a
    // band. A stat missing from ctx.playerStats reads as the default 3.
    if (conditions.minStats && typeof conditions.minStats === "object") {
        const statsNow = ctx.playerStats || {};
        const meetsMinStats = Object.keys(conditions.minStats).every(function (statKey) {
            const need = conditions.minStats[statKey];
            if (typeof need !== "number") return true;
            const have = typeof statsNow[statKey] === "number" ? statsNow[statKey] : 3;
            return have >= need;
        });
        if (!meetsMinStats) return false;
    }
    if (conditions.maxStats && typeof conditions.maxStats === "object") {
        const statsNowMax = ctx.playerStats || {};
        const meetsMaxStats = Object.keys(conditions.maxStats).every(function (statKey) {
            const cap = conditions.maxStats[statKey];
            if (typeof cap !== "number") return true;
            const have = typeof statsNowMax[statKey] === "number" ? statsNowMax[statKey] : 3;
            return have <= cap;
        });
        if (!meetsMaxStats) return false;
    }

    if (conditions.requiredActionTags && !_npcActionTagsInclude(ctx.actionTags, conditions.requiredActionTags)) return false;
    if (conditions.excludedActionTags && _npcNormalizeList(conditions.excludedActionTags)
        .some(tag => _npcActionTagsInclude(ctx.actionTags, [tag]))) {
        return false;
    }

    // Demeanor mode conditions for intimacy roleplay
    if (conditions.demeanorMode && !_npcValueInList(ctx.demeanorMode, _npcNormalizeList(conditions.demeanorMode))) return false;
    if (conditions.excludeDemeanorMode && _npcValueInList(ctx.demeanorMode, _npcNormalizeList(conditions.excludeDemeanorMode))) return false;
    if (typeof conditions.intimacyActive === "boolean" && ctx.intimacyActive !== conditions.intimacyActive) return false;
    if (typeof conditions.surrenderedToPlayer === "boolean" && ctx.surrenderedToPlayer !== conditions.surrenderedToPlayer) return false;
    if (typeof conditions.defeatedOrSurrendered === "boolean" && ctx.defeatedOrSurrendered !== conditions.defeatedOrSurrendered) return false;

    if (typeof conditions.custom === "function" && conditions.custom(ctx.npc, ctx) === false) return false;

    // Phase 2 conditions: location and privacy checks
    if (conditions.locationCheck === "private") {
      const room = ctx.room;
      if (!room) return false;
      if (typeof isPrivateLocation === "function") {
        if (!isPrivateLocation(room)) return false;
      } else {
        const privateTypes = ["Guest Room", "Inn", "Inn Common", "Bedroom", "Cellar", "Dark Alleyway", "Vault", "Chamber", "Tower"];
        const roomType = room.type || room.displayName || "";
        const roomRole = room.role || "";
        const isPrivate = privateTypes.some(t => 
          roomType.toLowerCase().includes(t.toLowerCase()) ||
          roomRole.toLowerCase().includes(t.toLowerCase())
        );
        if (!isPrivate) return false;
      }
    }

    if (conditions.aloneWithTarget === true) {
      const room = ctx.room;
      if (!room) return false;
      if (!room.creatures) return false;
      
      if (typeof isAloneWithTarget === "function") {
        if (!isAloneWithTarget(room, ctx.npc)) return false;
      } else {
        let othersPresent = 0;
        for (const creature of room.creatures) {
          if (creature.isPlayer) continue;
          if (creature === ctx.npc) continue;
          if (creature.isHumanoid || creature.humanoid) {
            othersPresent++;
          }
        }
        if (othersPresent > 0) return false;
      }
    }

    if (conditions.intimacyActive !== undefined) {
      const isActive = ctx.npc.intimacy && ctx.npc.intimacy.encounter && ctx.npc.intimacy.encounter.active;
      if (conditions.intimacyActive !== isActive) return false;
    }

    return true;
}

function conversationOptionResetAvailable(entry, ctx, usage) {
    if (!entry || !ctx || !usage) return false;

    const resetConfig = entry.resetTimer != null ? entry.resetTimer : entry.decay;
    if (resetConfig == null && !entry.resetOnStoryFlags && !entry.resetOnStoryEventTypes &&
        !entry.resetOnStoryEventTags && !entry.resetOnExternalFlags && typeof entry.resetWhen !== "function") {
        return false;
    }

    const normalizedReset = typeof resetConfig === "number"
        ? { turns: resetConfig }
        : (resetConfig && typeof resetConfig === "object" ? resetConfig : {});

    if (typeof normalizedReset.turns === "number" && typeof usage.lastUsedTurn === "number") {
        if ((ctx.storyTurn - usage.lastUsedTurn) >= normalizedReset.turns) return true;
    }

    const storyFlagNames = normalizedReset.storyFlags || entry.resetOnStoryFlags;
    if (storyFlagNames && _npcHasAnyNamedFlags(ctx.storyFlags, storyFlagNames)) return true;

    const externalFlagNames = normalizedReset.externalFlags || entry.resetOnExternalFlags;
    if (externalFlagNames && _npcHasAnyNamedFlags(ctx.externalState, externalFlagNames)) return true;

    const eventTypes = normalizedReset.storyEventTypes || entry.resetOnStoryEventTypes;
    const eventTags = normalizedReset.storyEventTags || entry.resetOnStoryEventTags;
    if ((eventTypes || eventTags) && _npcRecentEventMatches(ctx.storyRecentEvents, {
        types: eventTypes,
        tags: eventTags
    }, usage.lastUsedEventCounter || 0)) {
        return true;
    }

    if (typeof entry.resetWhen === "function" && entry.resetWhen(ctx.npc, ctx, usage) === true) {
        return true;
    }

    return false;
}

function conversationRepeatAvailable(entry, ctx) {
    const repeat = String(entry && entry.repeat || "always").toLowerCase();
    const optionId = String(entry && entry.id || "").trim();
    if (!optionId) return true;
    const usage = ctx && ctx.optionUsage && typeof ctx.optionUsage === "object"
        ? ctx.optionUsage[optionId]
        : null;

    // Greeting-gate self-heal: greet-intro is "never" repeatable on the
    // assumption that using it sets metPlayer. If the NPC's memory lost that
    // flag (old save, regenerated memory, impact that never landed), the
    // intro must come back — otherwise the greeting gate leaves the player
    // with nothing but "Say goodbye" for the rest of the game.
    if (optionId === "greet-intro" && ctx && ctx.metPlayer === false) {
        return true;
    }

    if (repeat === "never") {
        if (!ctx.usedOptionIds.includes(optionId)) return true;
        return conversationOptionResetAvailable(entry, ctx, usage);
    }

    if (repeat === "session") {
        if (!ctx.sessionUsedOptionIds.includes(optionId)) return true;
        return conversationOptionResetAvailable(entry, ctx, usage);
    }

    return true;
}

// Menu grouping for the chat UI. Entries may set `kind` explicitly
// ("topic" | "social" | "action" | "exit"); otherwise it is derived:
//   exit   - disengage actions (goodbye)
//   action - anything that does something mechanical (trade, follow, intimacy
//            passthroughs, function actions)
//   social - tone options aimed at the NPC's feelings (compliment, apologize...)
//   topic  - everything else (questions / conversation subjects)
// `tone` ("hostile" | "friendly") only matters for social options.
const NPC_SOCIAL_INTENTS = [
    "flattery", "apology", "comfort", "calm", "empathy", "help", "tease",
    "flirt", "aggression", "insult", "bold", "awkward", "greeting"
];
const NPC_HOSTILE_INTENTS = ["aggression", "insult", "bold"];

function _npcDeriveOptionKind(entry, intent, npc, ctx) {
    if (entry && typeof entry.kind === "function") {
        const resolved = entry.kind(npc, ctx);
        if (typeof resolved === "string" && resolved) return resolved;
    }
    if (entry && typeof entry.kind === "string" && entry.kind) return entry.kind;
    if (!entry) return "topic";
    if (entry.action === "disengage" || entry.id === "goodbye") return "exit";
    if (entry.action || entry.intimacyAction || entry.startEncounter) return "action";
    if (NPC_SOCIAL_INTENTS.indexOf(String(intent || "").toLowerCase()) >= 0) return "social";
    return "topic";
}

function _npcDeriveOptionTone(entry, intent) {
    if (entry && typeof entry.tone === "string" && entry.tone) return entry.tone;
    return NPC_HOSTILE_INTENTS.indexOf(String(intent || "").toLowerCase()) >= 0 ? "hostile" : "friendly";
}

function buildConversationOption(entry, npc, ctx) {
    const optionId = String(entry.id || "").trim();
    const label = _npcPickConversationVariant(npc, `${optionId}:label`, entry.labelVariants, entry.label, ctx);
    // Do NOT resolve the action property via _npcResolveConversationValue —
    // if it's a function (like ask-to-follow/stop-following), we
    // need to pass it through as a function reference so it fires on click,
    // not during menu rendering. String actions ("trade", "intimacy", etc.)
    // pass through unchanged.
    const action = typeof entry.action === "function" ? entry.action : _npcResolveConversationValue(entry.action, npc, ctx);
    const promptText = _npcPickConversationVariant(npc, `${optionId}:text`, entry.textVariants, entry.text, ctx);
    const playerText = _npcPickConversationVariant(
        npc,
        `${optionId}:playerText`,
        entry.playerTextVariants,
        entry.playerText || _npcBuildPlayerConversationText(label, action),
        ctx
    );

    if (!label || (!playerText && !action)) return null;

    const impact = _npcResolveConversationValue(entry.relationshipImpact, npc, ctx);
    const isInquiry = entry.isInquiry === true;
    // Options whose content depends on live state (e.g. a specific story
    // event) can set cacheSig; when it changes, any reply cached for this
    // option id belongs to the old state and is discarded before the menu's
    // prefetch check runs.
    if (entry.cacheSig !== undefined && npc && npc.memory) {
        const sig = String(_npcResolveConversationValue(entry.cacheSig, npc, ctx));
        if (!npc.memory.cachedReplySigs || typeof npc.memory.cachedReplySigs !== "object") npc.memory.cachedReplySigs = {};
        if (npc.memory.cachedReplySigs[optionId] !== sig) {
            if (typeof removeCachedConversationReply === "function") removeCachedConversationReply(npc, optionId);
            npc.memory.cachedReplySigs[optionId] = sig;
        }
    }
    const resolvedIntent = _npcResolveConversationValue(entry.intent, npc, ctx);
    return {
        id: entry.id,
        kind: _npcDeriveOptionKind(entry, resolvedIntent, npc, ctx),
        tone: _npcDeriveOptionTone(entry, resolvedIntent),
        label,
        text: playerText,
        promptText: promptText || playerText,
        contextNote: String(_npcResolveConversationValue(entry.contextNote, npc, ctx) || ""),
        // World-lore fact this option tells (recorded once chosen, see recordNPCConversationChoice).
        loreFactId: entry.loreFact ? String(_npcResolveConversationValue(entry.loreFact, npc, ctx) || "") : "",
        // Renown deed this option tells (marked told once chosen, see recordNPCConversationChoice).
        deedTalkId: entry.deedTalk ? String(_npcResolveConversationValue(entry.deedTalk, npc, ctx) || "") : "",
        revealsName: entry.revealsName !== undefined ? _npcResolveConversationValue(entry.revealsName, npc, ctx) === true : false,
        action,
        service: entry.service,
        intent: resolvedIntent,
        className: _npcResolveConversationValue(entry.className, npc, ctx),
        relationshipImpact: impact && typeof impact === "object" ? { ...impact } : impact,
        isInquiry: isInquiry,
        onAccept: entry.onAccept,
        onReject: entry.onReject,
        resetTimer: entry.resetTimer,
        // Resolved at click time by classifyConversationChoice (engine).
        socialCheck: entry.socialCheck,
        // Intimacy system additions
        intimacyAction: entry.intimacyAction,
        startEncounter: entry.startEncounter,
        // How an encounter-starting option opens the scene (see
        // handleIntimacyConversationChoice in the engine): tone flavors the
        // opening narration, arousalBoost starts both meters above zero.
        encounterStart: entry.encounterStart,
        // Bold escalation after a rebuffed advance: the reply prompt leans
        // toward responsive desire and only a clear refusal holds the scene
        // off (see the _pendingIntimacyStart handoff in npcRespond).
        responsiveDesire: entry.responsiveDesire,
        // Backstory pressure emissary menu (see handlePressureChoice in the engine).
        pressureAction: entry.pressureAction,
        phase: entry.phase,
        // Opening-guide story beat (see onGuideBeat in the engine).
        guideBeat: entry.guideBeat,
        guideParty: entry.guideParty,
        guideAnswer: entry.guideAnswer,
        socialFact: entry.socialFact,
        // Optional memory hints: { id, importance, tags, text, skip } (see recordNPCConversationMemory).
        // May be a function (npc, ctx) like other catalogue fields.
        memory: _npcResolveConversationValue(entry.memory, npc, ctx)
    };
}

function queryConversationCatalogue(npc, extraContext = {}) {
    console.log("[NPC Data] queryConversationCatalogue called with NPC:", npc ? npc.name || npc.id : "null");
    if (!npc) return [];

    // Self-heal a half-updated state BEFORE the context snapshot: everGreeted
    // implies metPlayer. If an old save or a failed impact left everGreeted
    // true but metPlayer false, greet-known (conditions: metPlayer) would
    // never show.
    if (npc.memory && npc.memory.everGreeted === true && npc.memory.metPlayer !== true) {
        npc.memory.metPlayer = true;
    }

    const ctx = getNPCConversationContext(npc, extraContext);
    if (!ctx) return [];

    const everGreeted = npc.memory && npc.memory.everGreeted === true;
    const greetedThisSession = ctx.sessionUsedOptionIds && (
        ctx.sessionUsedOptionIds.includes("greet-intro") ||
        ctx.sessionUsedOptionIds.includes("greet-known") ||
        ctx.sessionUsedOptionIds.includes("service-opened") ||
        ctx.sessionUsedOptionIds.includes("resume-conversation") ||
        ctx.sessionUsedOptionIds.some(id => typeof id === "string" && id.indexOf("greet-") === 0)
    );
    
    // Merge local SFW catalogue with the NSFW catalogue (loaded by
    // cyoaftw-npc-data-nsfw.js into window.NPC_NSFW_CONVERSATION_CATALOGUE).
    // Deduplicate by ID, giving priority to the NSFW catalogue options.
    // Keep this merge intact: it is the link that lets SFW tooling edit the
    // base catalogue without touching NSFW content.
    const windowCatalogue = window.NPC_NSFW_CONVERSATION_CATALOGUE || [];
    console.log("[NPC Data] Window catalogue size:", windowCatalogue.length, "options:", windowCatalogue.map(o => o.id));
    console.log("[NPC Data] Base catalogue size:", NPC_CONVERSATION_CATALOGUE.length, "options:", NPC_CONVERSATION_CATALOGUE.map(o => o.id));
    const fullCatalogue = [...NPC_CONVERSATION_CATALOGUE];
    
    // Add window catalogue options, overwriting duplicates
    for (const windowOption of windowCatalogue) {
        const existingIndex = fullCatalogue.findIndex(o => o.id === windowOption.id);
        if (existingIndex >= 0) {
            fullCatalogue[existingIndex] = windowOption;
        } else {
            fullCatalogue.push(windowOption);
        }
    }
    
    // Public services may open the conversation alongside greetings.
    let filtered = fullCatalogue;
    if (!greetedThisSession) {
        filtered = fullCatalogue.filter(entry => {
            const isGreeting = entry.intent === "greeting" || 
                entry.id === "greet-intro" || 
                entry.id === "greet-known";
            const isDisengage = entry.action === "disengage" || entry.id === "goodbye";
            // "stop-following" is companion management, not small talk — an
            // NPC who is actively following can always be dismissed, even
            // before the session greeting. Same for asking a follower to
            // join the party for good.
            const isCompanionManagement = entry.id === "stop-following" || entry.id === "follower-ask-stay" || entry.id === "follower-join-party";
            return isGreeting || isDisengage || isCompanionManagement || entry.id === "resume-conversation" || !!entry.service;
        });
    }

    const result = filtered
        .filter(entry => conversationRepeatAvailable(entry, ctx))
        .filter(entry => conversationConditionMatches(entry.conditions, ctx))
        .filter(entry => {
          if (entry.id === "follow-seduction-suggestion") {
            return npc && npc._pendingSeductionDestination;
          }
          // Filter out intimacy actions that don't start an encounter
          // These should only appear in the intimacy action menu, not in conversation
          if (entry.action === "intimacy" && !entry.startEncounter) {
            return false;
          }
          return true;
        })
        // `replaces`: a follow-up that is currently available hides the
        // parent(s) it lists, so a chain swaps one button for the next.
        .filter((entry, idx, list) => {
            const entryId = String(entry.id || "").toLowerCase();
            return !list.some(other => other !== entry && other.replaces &&
                _npcNormalizeList(other.replaces).indexOf(entryId) >= 0);
        })
        .sort((a, b) => _npcEntryRank(a) - _npcEntryRank(b))
        .filter(_npcMakeTopicCap(npc, ctx))
        .map(entry => buildConversationOption(entry, npc, ctx))
        .filter(Boolean);
    
    console.log("[NPC Data] queryConversationCatalogue returning", result.length, "options:", result.map(o => o.id));

    // Fallback invariant: while the greeting gate is closed, the menu MUST
    // contain a greeting option — without one the player can only say
    // goodbye and the conversation can never open. If every greet entry
    // was filtered out (unexpected conditions, repeat state, catalogue
    // changes), synthesize a plain greeting.
    if (!greetedThisSession && !result.some(o => o && (o.intent === "greeting" || o.id === "resume-conversation"))) {
        console.warn("[NPC Data] Greeting gate closed with no greeting option — injecting fallback.");
        const fallback = buildConversationOption({
            id: "greet-fallback",
            priority: 12,
            label: "Greet them",
            text: "You offer a simple greeting and wait to see how they answer.",
            intent: "greeting",
            relationshipImpact: { mood: 1, favor: 3, hostility: -1, intent: "greeting", markMet: true, actionTag: "greeting" }
        }, npc, ctx);
        if (fallback) result.unshift(fallback);
    }

    return result;
}

function normalizeSpeechStyle(style) {
    const key = String(style || "common").toLowerCase().trim();
    if (SPEECH_STYLE_ALIASES[key]) return SPEECH_STYLE_ALIASES[key];
    if (NPC_SPEECH_PROFILES[key]) return key;
    return "common";
}

function getSpeechProfile(style) {
    return NPC_SPEECH_PROFILES[normalizeSpeechStyle(style)] || NPC_SPEECH_PROFILES.common;
}

function determineNPCSpeechStyle(npc, room, zoneTemplate) {
    if (!npc) return "common";

    const template = _npcGetSpeciesTemplate(npc.species) || {};
    const role = String(npc.role || "").toLowerCase();
    const temperament = String(npc.temperament || "").toLowerCase();
    const ageCategory = String(npc.ageCategory || "").toLowerCase();
    const roomType = String((room && room.type) || "").toLowerCase();
    const zoneName = String((zoneTemplate && zoneTemplate.name) || (room && room.zone) || "").toLowerCase();
    const traits = Array.isArray(npc.personalityTraits) && npc.personalityTraits.length
        ? npc.personalityTraits
        : (Array.isArray(npc.personalityProfile && npc.personalityProfile.traits) ? npc.personalityProfile.traits : []);

    let style = normalizeSpeechStyle(template.speechStyle || npc.speechStyle || npc.speech || "common");

    if (role.includes("guard")) style = "direct";
    else if (role.includes("blacksmith") || role.includes("miner")) style = "gruff";
    else if (role.includes("innkeeper") || role.includes("bartender") || role.includes("shopkeeper")) style = "folksy";
    else if (role.includes("healer") || role.includes("priest") || role.includes("archivist")) style = "formal";
    else if (role.includes("scout") || role.includes("thief") || role.includes("raider")) style = "guarded";

    if (roomType.includes("gate") && style === "common") style = "guarded";
    if ((roomType.includes("tavern") || roomType.includes("inn")) && ["common", "guarded"].includes(style)) style = "folksy";
    if ((zoneName.includes("dungeon") || zoneName.includes("ruin")) && ["common", "folksy"].includes(style)) style = "guarded";

    if (temperament === "aggressive" || temperament === "hostile" || temperament === "bold") {
        if (style === "formal") style = "direct";
        else if (style === "common") style = "gruff";
    } else if (temperament === "wary" || temperament === "skittish" || temperament === "paranoid") {
        if (!["broken", "whisper", "guarded", "nervous"].includes(style)) style = "guarded";
    } else if (temperament === "friendly" || temperament === "curious") {
        if (style === "common") style = "folksy";
        if (style === "direct") style = "common";
    }

    if (traits.includes("sarcastic")) style = "wry";
    else if (traits.includes("shy") || traits.includes("paranoid")) style = "nervous";
    else if (traits.includes("grump") || traits.includes("bitter")) style = "gruff";
    else if (traits.includes("studious")) style = "formal";
    else if (traits.includes("cheerful") || traits.includes("helpful")) {
        if (["common", "guarded"].includes(style)) style = "folksy";
    }

    if (ageCategory === "elderly" && ["common", "direct"].includes(style)) style = "formal";
    if (ageCategory === "young" && style === "formal" && !role.includes("priest") && !role.includes("archivist")) style = "common";

    // Species native cadence: when everything above has left the neutral
    // human "common" style in place, a non-human speaks like their people
    // instead. (A strong role or temperament style above is untouched - a
    // dwarf guard stays "direct"; this only replaces the generic default.)
    const speciesKey = String((npc.species || "")).toLowerCase();
    if (style === "common" && NPC_SPECIES_SPEECH_STYLE_BIAS[speciesKey]) {
        style = NPC_SPECIES_SPEECH_STYLE_BIAS[speciesKey];
    }

    // A kenku cannot speak in a voice of its own, whatever its role or mood.
    if (speciesKey === "kenku") return "mimic";

    return normalizeSpeechStyle(style);
}

function getNPCSpeechProfile(npc, room, zoneTemplate) {
    const style = determineNPCSpeechStyle(npc, room, zoneTemplate);
    const profile = getSpeechProfile(style);
    return {
        style,
        sample: profile.sample,
        sentenceLength: profile.sentenceLength,
        vocabulary: profile.vocabulary,
        cadence: profile.cadence,
        tone: profile.tone || "",
        styleDescription: profile.styleDescription || "",
        languageNotes: profile.languageNotes || "",
        nativeSpeech: getNPCNativeSpeech(npc),
        speciesSample: getNPCSpeciesSpeechSample(npc),
        cues: Array.isArray(profile.cues) ? profile.cues.slice() : [],
        avoid: Array.isArray(profile.avoid) ? profile.avoid.slice() : []
    };
}

function syncNPCSpeechProfile(npc, room, zoneTemplate) {
    if (!npc) return null;
    const speechProfile = getNPCSpeechProfile(npc, room, zoneTemplate);
    npc.speechStyle = speechProfile.style;
    npc.speechProfile = {
        style: speechProfile.style,
        sample: speechProfile.sample,
        sentenceLength: speechProfile.sentenceLength,
        vocabulary: speechProfile.vocabulary,
        cadence: speechProfile.cadence,
        tone: speechProfile.tone,
        styleDescription: speechProfile.styleDescription,
        languageNotes: speechProfile.languageNotes,
        nativeSpeech: speechProfile.nativeSpeech || "",
        speciesSample: speechProfile.speciesSample || "",
        cues: speechProfile.cues.slice(0, 3),
        avoid: speechProfile.avoid.slice(0, 3)
    };
    return speechProfile;
}

function getSpeechTicsForStyle(style, voice) {
    const profile = getSpeechProfile(style);
    const tics = Array.isArray(profile.cues) && profile.cues.length
        ? profile.cues.slice(0, 3)
        : ["speaks plainly"];
    if (voice) tics.unshift("has a " + voice + " voice");
    return tics.slice(0, 3);
}

function generateNPCMotivation(npc, template, room) {
    const isHumanoid = npc && npc.isHumanoid === true;
    const culture = template && template.culture ? template.culture : {};
    const values = Array.isArray(culture.values) ? culture.values : [];
    const base = isHumanoid ? NPC_HUMANOID_MOTIVES : NPC_CREATURE_MOTIVES;
    const roomType = room && room.type ? String(room.type).toLowerCase() : "";
    let motive = _npcRand(base);

    if (values.length && Math.random() < 0.45) {
        motive = "act according to " + _npcRand(values);
    }
    if (roomType.indexOf("tavern") >= 0 || roomType.indexOf("inn") >= 0) {
        motive = isHumanoid ? _npcRand(["hear useful gossip", "make a quiet bargain", "rest without being bothered"]) : motive;
    }
    if (roomType.indexOf("gate") >= 0) {
        motive = isHumanoid ? _npcRand(["judge who is entering town", "avoid trouble at the gate", "watch for suspicious travelers"]) : motive;
    }
    if (roomType.indexOf("dungeon") >= 0 || roomType.indexOf("ruin") >= 0 || roomType.indexOf("vault") >= 0) {
        motive = isHumanoid ? _npcRand(["survive the dangerous place", "claim something valuable before others do", "keep outsiders away from a secret"]) : _npcRand(NPC_CREATURE_MOTIVES);
    }

    return motive;
}

// ── SOMATOTYPE (BODY TYPE) ──────────────────────────────────────
// A simple, tracked body-frame trait on NPCs/creatures and the player:
// "ectomorph" (slight, narrow frame), "mesomorph" (muscular, athletic frame),
// "endomorph" (soft, heavy, rounder frame). Stored as `somatotype` (NPCs:
// npc.somatotype; player: player.appearance.somatotype). It is separate from
// the free-text `build` / `bodyType` descriptor ("lean", "stout", ...), which
// stays purely descriptive. No mechanical effect yet - this is the hook for
// future systems (stamina, carry weight, heat/cold, attraction, descriptions).
const SOMATOTYPES = ["ectomorph", "mesomorph", "endomorph"];
const SOMATOTYPE_INFO = {
    ectomorph: { label: "Ectomorph", plain: "slight", blurb: "Slender and light-framed; narrow shoulders, little bulk." },
    mesomorph: { label: "Mesomorph", plain: "muscular", blurb: "Athletic and well-muscled; broad shoulders, solid frame." },
    endomorph: { label: "Endomorph", plain: "heavyset", blurb: "Soft and sturdy; a rounder, heavier frame that carries weight easily." }
};

function isValidSomatotype(value) {
    return SOMATOTYPES.indexOf(String(value || "").toLowerCase()) >= 0;
}

// Best-guess somatotype from a free-text build word ("wiry", "stout",
// "athletic"...). Returns "" when the word gives no hint.
function inferSomatotypeFromBuild(build) {
    var b = String(build || "").toLowerCase();
    if (!b) return "";
    if (/soft(?!-featured)|round(?!-faced)|heavy|heavyset|stout|thickset|plump|portly|stocky/.test(b)) return "endomorph";
    if (/lean|slight|slender|willowy|lithe|graceful|narrow|wiry|thin|scrawny|bony|bare-boned|sinewy|elegant|fragile|faint|mist|tattered|tiny|small|knobby|scrappy|sleek|nimble|quick/.test(b)) return "ectomorph";
    if (/athletic|sturdy|broad|powerful|muscular|imposing|tall|scarred|weathered|reptilian|compact/.test(b)) return "mesomorph";
    return "";
}

// Pick a somatotype for a newly generated NPC/creature, steered by the build
// word that was just rolled so the two never contradict each other.
function rollNPCSomatotype(build) {
    var inferred = inferSomatotypeFromBuild(build);
    if (inferred) return inferred;
    return SOMATOTYPES[Math.floor(Math.random() * SOMATOTYPES.length)];
}

function rollNPCSpeciesBuild(profile, isHumanoid) {
    const builds = Array.isArray(profile.builds) ? profile.builds : [];
    const weights = profile.buildWeights;
    if (weights && builds.length) {
        const values = builds.map(build => typeof weights[build] === "number" && weights[build] >= 0 ? weights[build] : 1);
        const total = values.reduce((sum, value) => sum + value, 0);
        if (total > 0) {
            let roll = Math.random() * total;
            for (let i = 0; i < builds.length; i++) {
                roll -= values[i];
                if (roll < 0) return builds[i];
            }
        }
    }
    return _npcRand(builds) || (isHumanoid ? "average" : "lean");
}

// Fullness is independent of skeletal frame and muscularity. Only generation
// rolls it; reading a profile or loading an older NPC never changes their body.
function generateNPCBodyCondition(npc, profile) {
    if (profile.bodyFatEligible === false) return "normal";
    if (npc.bodyCondition === "normal" || npc.bodyCondition === "overweight") return npc.bodyCondition;
    if (getEntityBodyCondition(npc) === "overweight") return "overweight";
    return profile.bodyFatEligible === true && Math.random() < 0.05 ? "overweight" : "normal";
}

// Sets npc.somatotype if missing/invalid (also migrates older saves). Safe to
// call repeatedly. Returns the somatotype.
function ensureNPCSomatotype(npc) {
    if (!npc || typeof npc !== "object") return "";
    if (isValidSomatotype(npc.somatotype)) return npc.somatotype;
    var build = (npc.anatomy && npc.anatomy.build) || npc.bodyType || npc.build || "";
    npc.somatotype = rollNPCSomatotype(build);
    return npc.somatotype;
}

function getNPCSomatotype(npc) {
    return ensureNPCSomatotype(npc);
}

function getSomatotypeLabel(value) {
    var info = SOMATOTYPE_INFO[String(value || "").toLowerCase()];
    return info ? info.label : "";
}

window.SOMATOTYPES = SOMATOTYPES;
if (typeof window !== "undefined") {
    window.generateNPCSocial = generateNPCSocial;
    window.ensureNPCSocial = ensureNPCSocial;
    window.socialFactAvailable = socialFactAvailable;
    window.getSocialFactLabel = getSocialFactLabel;
    window.getSocialFactAnswer = getSocialFactAnswer;
    window.getSocialFactQuestion = getSocialFactQuestion;
    window.getSocialIdentity = getSocialIdentity;
    window.npcNoteReplyMeta = npcNoteReplyMeta;
    window.getSocialFactBrief = getSocialFactBrief;
    window.getNPCSocialPromptLines = getNPCSocialPromptLines;
    window.pickNPCTies = pickNPCTies;
    window.finalizeNPCTies = finalizeNPCTies;
    window.describeNPCTie = describeNPCTie;
    window.getNPCTiesAnswer = getNPCTiesAnswer;
window.getNPCPartner = getNPCPartner;
window.npcShrugsOffRomance = npcShrugsOffRomance;
window.getNPCLover = getNPCLover;
window.getNPCRoutineNow = getNPCRoutineNow;
window.getNPCRoutineRecords = getNPCRoutineRecords;
window.getNPCFacetRecords = getNPCFacetRecords;
}
window.SOMATOTYPE_INFO = SOMATOTYPE_INFO;
window.isValidSomatotype = isValidSomatotype;
window.inferSomatotypeFromBuild = inferSomatotypeFromBuild;
window.rollNPCSomatotype = rollNPCSomatotype;
window.ensureNPCSomatotype = ensureNPCSomatotype;
window.getNPCSomatotype = getNPCSomatotype;
window.getSomatotypeLabel = getSomatotypeLabel;

function generateNPCEnrichment(npc, room, zoneTemplate) {
    if (!npc) return null;

    ensureNPCHeightCm(npc);

    const template = _npcGetSpeciesTemplate(npc.species) || {};
    const profile = template.anatomyProfile || {};
    const culture = template.culture || {};
    const isHumanoid = npc.isHumanoid === true;
    const speechProfile = syncNPCSpeechProfile(npc, room, zoneTemplate) || getNPCSpeechProfile(npc, room, zoneTemplate);

    const surfaceType = profile.surfaceType || (isHumanoid ? "skin" : "hide");
    const surfaceColor = _npcRand(profile.skinTones) || "unremarkable";
    
    const bodyCondition = generateNPCBodyCondition(npc, profile);
    const isOverweight = bodyCondition === "overweight";
    const build = rollNPCSpeciesBuild(profile, isHumanoid);
    
    const eyeColor = isSlimeNPC(npc) ? "" : _npcRand(profile.eyeColors) || "";
    const hairColors = Array.isArray(profile.hairColors) ? profile.hairColors : [];
    const hairColor = isHumanoid ? _npcRand(hairColors) : "";
    const hairStyle = hairColor && hairColor !== "none" && hairColor !== "shaved"
        ? _npcRand(profile.hairStyles) : "";
    const features = _npcUniquePicks(profile.features, isHumanoid ? 2 : 3);
    const marks = _npcUniquePicks(NPC_DISTINGUISHING_MARKS, isHumanoid ? _npcRandInt(1, 2) : 1);
    const movement = _npcRand(profile.movements);
    const voice = _npcRand(profile.voices);
    
    // Add overweight-specific body features
    if (isOverweight) {
        // For humanoids, add gender-appropriate overweight descriptors
        if (isHumanoid) {
            const gender = String(npc.gender || "").toLowerCase();
            if (gender === "female") {
                // Add large/droopy breast descriptor
                if (!features.some(f => /breast|bust|chest/i.test(f))) {
                    features.push(_npcRand([
                        "large drooping breasts",
                        "heavy pendulous breasts", 
                        "full sagging bosom",
                        "ample soft chest"
                    ]));
                }
                // Add big ass descriptor
                if (!features.some(f => /ass|butt|rear|hind/i.test(f))) {
                    features.push(_npcRand([
                        "a large round ass",
                        "a wide soft backside",
                        "a plump rear",
                        "a generous bottom"
                    ]));
                }
                // Add general weight descriptor
                if (!features.some(f => /soft|plump|round|heavy|weight/i.test(f))) {
                    features.push(_npcRand([
                        "soft rounded curves",
                        "a comfortably plump figure",
                        "a full well-padded frame",
                        "a generously proportioned body"
                    ]));
                }
            } else {
                // Male overweight descriptors
                if (!features.some(f => /belly|gut|paunch|soft|round/i.test(f))) {
                    features.push(_npcRand([
                        "a round soft belly",
                        "a prominent paunch",
                        "a comfortably full midsection",
                        "a generously rounded gut"
                    ]));
                }
                // Add big ass descriptor for males too
                if (!features.some(f => /ass|butt|rear|hind/i.test(f))) {
                    features.push(_npcRand([
                        "a broad soft ass",
                        "a wide fleshy backside",
                        "a substantial rear",
                        "a thick bottom"
                    ]));
                }
                // Add general weight descriptor
                if (!features.some(f => /stocky|heavy|barrel/i.test(f))) {
                    features.push(_npcRand([
                        "a stocky heavy build",
                        "a barrel-chested frame",
                        "a solid thickset form",
                        "a powerfully built body"
                    ]));
                }
            }
        } else {
            // Non-humanoid overweight (rare)
            features.push(_npcRand([
                "a surprisingly heavy build",
                "a thick rounded form",
                "a plump appearance"
            ]));
        }
    }
    const values = _npcUniquePicks(culture.values, 2);
    const preferredTopics = _npcUniquePicks(culture.topics, 3);
    const tabooTopics = _npcUniquePicks(culture.taboos, 2);
    const speechTics = getSpeechTicsForStyle(speechProfile.style, voice);
    const backgroundEntry = _npcRand(NPC_BACKGROUNDS) || {};

    const anatomy = {
        size: template.size || "medium",
        build,
        body: {
            surfaceType,
            color: surfaceColor,
            // Add weight class for overweight NPCs
            weightClass: isOverweight ? "overweight" : null
        },
        eyes: eyeColor ? { color: eyeColor } : null,
        features,
        marks,
        movement,
        voice
    };

    if (hairColor && hairColor !== "none" && hairColor !== "shaved") {
        anatomy.hair = {
            color: hairColor,
            style: hairStyle || "unstyled"
        };
    }

    if (Array.isArray(profile.surfaceRegions)) {
        anatomy.body.regions = profile.surfaceRegions.map(region => ({
            region: region.region,
            surfaceType: region.surfaceType,
            color: Array.isArray(region.colors) ? _npcRand(region.colors) : surfaceColor
        }));
    }

    const enrichment = {
        speciesLore: template.lore || "",
        articulation: template.articulation || "",
        voice,
        background: backgroundEntry.background || "",
        dialectFlavor: backgroundEntry.dialectFlavor || "",
        values,
        preferredTopics,
        tabooTopics,
        speechTics,
        speechProfile: {
            style: speechProfile.style,
            sample: speechProfile.sample,
            sentenceLength: speechProfile.sentenceLength,
            vocabulary: speechProfile.vocabulary,
            cadence: speechProfile.cadence,
            cues: speechProfile.cues.slice(0, 3),
            avoid: speechProfile.avoid.slice(0, 3)
        },
        currentMotive: generateNPCMotivation(npc, template, room),
        mannerisms: [
            movement,
            voice ? "speaks in a " + voice + " voice" : ""
        ].filter(Boolean),
        reactionNotes: [
            values.length ? "responds well to " + _npcJoinList(values) : "",
            tabooTopics.length ? "bristles at " + _npcJoinList(tabooTopics) : ""
        ].filter(Boolean)
    };

    npc.anatomy = anatomy;
    npc.bodyCondition = bodyCondition;
    npc.enrichment = enrichment;
    npc.size = anatomy.size;
    npc.bodyType = build;
    npc.somatotype = rollNPCSomatotype(build);
    npc.skinTone = surfaceType === "skin" ? surfaceColor : "";
    npc.furColor = surfaceType === "fur" ? surfaceColor : "";
    npc.featherColor = surfaceType === "feathers" ? surfaceColor : "";
    npc.scaleColor = surfaceType === "scales" ? surfaceColor : "";
    npc.surfaceType = surfaceType;
    npc.surfaceColor = surfaceColor;
    npc.eyeColor = eyeColor;
    npc.hairColor = hairColor && hairColor !== "none" && hairColor !== "shaved" ? hairColor : "";
    npc.hairStyle = hairStyle;
    npc.specialTraits = features.concat(marks).filter(Boolean);
    npc.physicalTraits = buildNPCPhysicalSummary(npc);
    npc.appearanceHighlights = buildNPCAppearanceHighlights(npc);
    npc.loreNotes = enrichment.speciesLore;
    npc.articulation = enrichment.articulation;
    npc.voice = enrichment.voice;
    npc.background = enrichment.background;
    npc.dialectFlavor = enrichment.dialectFlavor;
    npc.preferredTopics = preferredTopics;
    npc.tabooTopics = tabooTopics;
    npc.currentMotive = enrichment.currentMotive;
    npc.speechProfile = enrichment.speechProfile;
    npc.social = generateNPCSocial(npc, room, zoneTemplate);

    return enrichment;
}

// ============================================================================
// NPC SOCIAL SHEET (see SOCIETY_SHEETS in cyoaftw-world-data.js)
// npc.social = { society, group, rank, tier, status?, caste?, standing,
//                need, liking, worry, secret: { id, kind?, text, known } }
// Mobs (non-humanoids) and the opening guide get none. Generated with the NPC,
// or lazily for NPCs from older saves (ensureNPCSocial).
// ============================================================================
const SOCIAL_FACT_QUESTIONS = {
    standing: { label: "Ask about their place in {group}", ask: "Tell me about your place in {group}." },
    need: { label: "Ask if they need help", ask: "Do you need any help?" },
    worry: { label: "Ask what is weighing on them", ask: "You look troubled. What is weighing on you?" },
    liking: { label: "Ask what they enjoy", ask: "What do you enjoy, when you have the time?" },
    secret: { label: "Ask what they are not saying", ask: "I think you are holding something back. Tell me." },
    ties: { label: "Ask about the people in their life", ask: "Who are the people in your life?" }
};
const SOCIAL_FACT_MIN_FAVOR = { standing: -20, need: 0, worry: 5, liking: -20, secret: 40, ties: 5 };
const SOCIAL_NOBLE_FACTS = {
    needs: [
        { kind: "help", text: "A matter of the House I cannot be seen to handle myself. Discretion would be rewarded." },
        { kind: "news", text: "I am waiting on a grant from the Crown. Tell me anything you hear of the court." },
        { kind: "item", text: "A gift worthy of a rival House, to smooth a quarrel that has gone on too long." }
    ],
    likings: ["Being addressed properly.", "A good hunt, a better table.", "Old songs of the House."],
    worries: ["A rival House gaining the Crown's ear.", "Debts that the family name hides.", "The commons grumbling about rent."],
    secrets: [
        { text: "The House is deeper in debt than anyone knows. The land is mortgaged to a merchant." },
        { text: "I would give up the title for a quieter life. I can say it to no one." }
    ]
};

function _socialFill(text, fill) {
    return String(text || "").replace(/\{(\w+)\}/g, function (m, k) { return fill[k] !== undefined ? fill[k] : m; });
}

function _socialWeightedPick(list) {
    let total = 0;
    list.forEach(function (e) { total += e.weight || 1; });
    let roll = Math.random() * total;
    for (let i = 0; i < list.length; i++) {
        roll -= list[i].weight || 1;
        if (roll <= 0) return list[i];
    }
    return list[list.length - 1];
}

function _socialPickFact(list, status, fill, kind) {
    const usable = (list || []).filter(function (e) {
        const entry = typeof e === "string" ? { text: e } : e;
        return !entry.only || (status && entry.only.indexOf(status) >= 0);
    });
    if (!usable.length) return null;
    const pick = usable[_npcRandInt(0, usable.length - 1)];
    const entry = typeof pick === "string" ? { text: pick } : pick;
    return { id: kind, kind: entry.kind || "", text: _socialFill(entry.text, fill), known: false };
}

function generateNPCSocial(npc, room, zoneTemplate) {
    if (!npc || npc.isHumanoid !== true || npc.isGuide) return null;
    if (typeof SOCIETY_BY_SPECIES === "undefined" || typeof SOCIETY_SHEETS === "undefined") return null;
    const society = SOCIETY_BY_SPECIES[npc.species];
    const sheet = society ? SOCIETY_SHEETS[society] : null;
    if (!sheet) return null;

    const zone = (room && room.zone) || (zoneTemplate && zoneTemplate.name) || "";
    const fill = { zone: zone, place: (room && room.buildingName) || zone || "this place", group: "", rank: "", house: "", landlord: "", creditor: "" };
    const social = { society: society, group: "", rank: "", tier: 0, standing: "" };
    let standingList = sheet.standings || [];
    let factSource = sheet;
    let status = null;

    const kin = npc._kinSocial && npc._kinSocial.society === society ? npc._kinSocial : null;
    if (society === "orc-clan" || society === "goblin-tribe" || society === "lizardfolk-tribe" || society === "dragonborn-house" || society === "catfolk-troupe" || society === "wolfkin-pack" || society === "satyr-revel" || society === "harefolk-warren" || society === "ratfolk-nest" || society === "kenku-flock") {
        const name = sheet.groupNames[_npcRandInt(0, sheet.groupNames.length - 1)];
        social.group = kin ? kin.group : (sheet.groupPrefix || "") + name + (society === "harefolk-warren" ? " warren" : society === "ratfolk-nest" ? " nest" : society === "kenku-flock" ? " flock" : society === "lizardfolk-tribe" ? " tribe" : (society === "wolfkin-pack" ? " pack" : (society === "satyr-revel" ? " revel" : (society === "catfolk-troupe" ? " troupe" : ""))));
        if (kin && society === "dragonborn-house") fill.house = kin.group;
        const rank = _socialWeightedPick(sheet.ranks);
        social.rank = rank.label; social.tier = rank.tier; social.rankKey = rank.key;
        if (society === "dragonborn-house" && !kin) fill.house = name;
    } else if (society === "kobold") {
        const hasDragonborn = zone === "Underground City" || !!(zoneTemplate && Array.isArray(zoneTemplate.allowedSpecies) && zoneTemplate.allowedSpecies.indexOf("Dragonborn") >= 0);
        const roll = Math.random();
        if (kin && kin.status) status = kin.status;
        else if (hasDragonborn) status = roll < 0.55 ? "bonded" : (roll < 0.8 ? "feral" : (roll < 0.9 ? "tribute" : "runaway"));
        else status = roll < 0.25 ? "feral" : (roll < 0.6 ? "tribute" : (roll < 0.8 ? "runaway" : "worshipper"));
        const st = sheet.statuses[status];
        fill.house = kin && kin.master ? kin.master : DRAGONBORN_HOUSES[_npcRandInt(0, DRAGONBORN_HOUSES.length - 1)];
        social.status = status;
        social.group = _socialFill(st.group, fill);
        social.rank = st.label; social.tier = st.tier;
        if (status === "bonded") social.master = fill.house;
        standingList = [st.standing];
    } else if (society === "realm") {
        const staff = (typeof REALM_MASTER_ROLES !== "undefined" && REALM_MASTER_ROLES.indexOf(npc.role) >= 0);
        const noble = kin ? kin.caste === "noble" : (!staff && zone === "Town" && (npc.species === "Human" || npc.species === "Elf") && Math.random() < 0.06);
        if (noble) {
            const kinHouse = kin ? NOBLE_HOUSES.filter(function (h) { return h.name === kin.group; })[0] : null;
            const house = kinHouse || NOBLE_HOUSES[_npcRandInt(0, NOBLE_HOUSES.length - 1)];
            const rank = _socialWeightedPick(sheet.castes.noble);
            social.caste = "noble"; social.group = house.name; social.rank = rank.label; social.tier = rank.tier;
            fill.house = house.name; fill.landlord = "";
            standingList = sheet.standingsByCaste.noble;
            factSource = { needs: SOCIAL_NOBLE_FACTS.needs, likings: SOCIAL_NOBLE_FACTS.likings, worries: SOCIAL_NOBLE_FACTS.worries, secrets: SOCIAL_NOBLE_FACTS.secrets };
        } else {
            social.caste = "commoner";
            const holder = (room && room.buildingId && typeof getBuildingLandholder === "function")
                ? getBuildingLandholder(room.buildingId, room.buildingType)
                : (typeof getBuildingLandholder === "function" ? getBuildingLandholder(npc.id || npc.name, "House") : null);
            fill.landlord = kin && kin.landlord ? kin.landlord : (holder ? holder.name : "the landlord");
            social.landlord = fill.landlord;
            let r = sheet.castes.wage;
            if (REALM_MASTER_ROLES.indexOf(npc.role) >= 0) r = sheet.castes.master;
            else if (REALM_TRADE_ROLES.indexOf(npc.role) >= 0) r = sheet.castes.tradesperson;
            else if (["Wanderer", "Pilgrim", "Delver", "Cultist", "Adventurer"].indexOf(npc.role) >= 0) r = sheet.castes.drifter;
            social.rank = r.label; social.tier = r.tier;
            // The group is where they work, never the bare role ("wage-earner of Townsfolk").
            social.workplace = (room && room.buildingName) ? room.buildingName : "";
            social.group = social.workplace || "the town";
            const creditors = ["a moneylender in the market streets", "a merchant who fronted me coin", "the guild", fill.landlord && fill.landlord !== "the landlord" ? fill.landlord : "my landlord"];
            fill.creditor = creditors[_npcRandInt(0, creditors.length - 1)];
            social.creditor = fill.creditor;
            standingList = sheet.standingsByCaste.commoner;
        }
    }

    fill.group = social.group; fill.rank = social.rank;
    social.standing = standingList.length ? _socialFill(standingList[_npcRandInt(0, standingList.length - 1)], fill) : "";
    social.need = _socialPickFact(factSource.needs, status, fill, "need");
    social.liking = _socialPickFact(factSource.likings, status, fill, "liking");
    social.worry = _socialPickFact(factSource.worries, status, fill, "worry");
    social.secret = _socialPickFact(factSource.secrets, status, fill, "secret");
    social.standingKnown = false;
    return social;
}

// Lazily builds the sheet for an NPC that has none (older saves, late spawns).
function ensureNPCSocial(npc) {
    if (!npc || npc.isHumanoid !== true || npc.isGuide) return null;
    if (npc.social === undefined) {
        const room = (typeof G === "object" && G && G.roomMap && npc.coords) ? G.roomMap[npc.coords] : (typeof G === "object" && G ? G.activeRoom : null);
        npc.social = generateNPCSocial(npc, room, null);
    }
    return npc.social || null;
}

// Is this fact available to ask about right now? (has the fact, not told yet,
// the NPC trusts the player enough, and is not hostile.)
function socialFactAvailable(npc, key) {
    const social = ensureNPCSocial(npc);
    if (!social || !SOCIAL_FACT_QUESTIONS[key]) return false;
    if (key === "need" && typeof ensureNPCNeeds === "function" && typeof commitmentSceneBlock === "function") return !commitmentSceneBlock(npc) && (ensureNPCNeeds(npc).some(function(n){return /^(offered|accepted)$/.test(n.state);}) || (G.commitments||[]).some(function(c){return c.state==="accepted" && c.personId===npc.id;}));
    if (key === "standing") { if (social.standingKnown || !social.group) return false; }
    else if (key === "ties") { if (npc.tiesKnown || !npc.ties || !npc.ties.length || !getNPCTiesAnswer(npc)) return false; }
    else if (!social[key] || social[key].known) return false;
    const memory = npc.memory || {};
    const favor = typeof memory.favorability === "number" ? memory.favorability : 0;
    if (favor < SOCIAL_FACT_MIN_FAVOR[key]) return false;
    if ((npc.hostility || 0) >= (key === "secret" ? 40 : 60)) return false;
    return true;
}

// The standing question reads differently by society.
function _socialStandingPhrase(social) {
    if (!social) return { label: "Ask about their place", ask: "Tell me about your place here." };
    if (social.society === "kobold") return { label: "Ask who they serve", ask: "Who do you serve?" };
    if (social.caste === "commoner") return { label: "Ask about their trade and station", ask: "How do you make your living here?" };
    if (social.caste === "noble") return { label: "Ask about their House", ask: "Tell me about your House." };
    return { label: "Ask about their place in " + social.group, ask: "Tell me about your place in " + social.group + "." };
}

function getSocialFactLabel(npc, key) {
    const social = ensureNPCSocial(npc);
    const q = SOCIAL_FACT_QUESTIONS[key];
    if (key === "need" && typeof ensureNPCNeeds === "function") return "Ask if they need help";
    if (key === "standing") return _socialStandingPhrase(social).label;
    return q ? q.label : "";
}

// Who they are, as a phrase ("a wage-earner at the Rusty Flagon", "a captain of
// Clan Ashhide"). A commoner is placed at their workplace, never "of <role>";
// older saves stored the group as "<Role> at <Building>" or the bare role, so
// those are cleaned up here.
function getSocialIdentity(npc) {
    const social = ensureNPCSocial(npc);
    if (!social || !social.rank) return "";
    const lead = _npcWithArticle(social.rank);
    if (social.caste === "commoner") {
        let place = social.workplace || "";
        if (!place && social.group) {
            const m = String(social.group).match(/^.+? at (.+)$/);
            if (m) place = m[1];
            else if (social.group !== (npc && npc.role) && social.group !== "the town") place = social.group;
        }
        return lead + (place ? " at " + place : " here in town");
    }
    return lead + (social.group ? " of " + social.group : "");
}

// A commoner's living in plain first person: role, pay (when it reads cleanly), place in town.
function getSocialLivingAnswer(npc) {
    const social = ensureNPCSocial(npc);
    if (!social) return "";
    const r = _npcRoutineFor(npc);
    const parts = ["I am " + getSocialIdentity(npc) + "."];
    if (r.duties && !/^none/i.test(r.duties)) parts.push("My days go to " + r.duties.replace(/\byour\b/g, "my").replace(/\byou\b/g, "I") + ".");
    if (r.pay && !/\byou\b/i.test(r.pay) && !/^no /i.test(r.pay)) parts.push("Pay is " + r.pay + ".");
    if (social.standing) parts.push(social.standing);
    return parts.join(" ");
}

// What the NPC says (scripted fallback, and the canonical record of what was told).
function getNPCSocialFactRecord(npc, key) {
    const social=ensureNPCSocial(npc);if(!social)return null;
    if(key==="need" && Array.isArray(social.need))return social.need.find(function(n){return n && /^(offered|accepted)$/.test(n.state);}) || social.need[0] || social.legacyNeed || null;
    return social[key] || null;
}
function getSocialFactAnswer(npc, key) {
    const social = ensureNPCSocial(npc);
    if (!social) return "";
    if (key === "ties") return getNPCTiesAnswer(npc);
    if (key === "standing") {
        if (social.caste === "commoner") return getSocialLivingAnswer(npc);
        return "I am " + getSocialIdentity(npc) + "." + (social.standing ? " " + social.standing : "");
    }
    const record=getNPCSocialFactRecord(npc,key);
    return record ? record.text : "";
}

// The facts handed to the live AI so it can voice a social answer in the
// speaker's own words. Nothing here is shown as written.
function getSocialFactBrief(npc, key) {
    const social = ensureNPCSocial(npc);
    if (!social) return "";
    const canon = getSocialFactAnswer(npc, key);
    if (!canon) return "";
    if (key === "standing" && social.caste === "commoner") {
        const r = _npcRoutineFor(npc);
        const bits = ["You are " + getSocialIdentity(npc) + "."];
        if (r.duties && !/^none/i.test(r.duties)) bits.push("Your work: " + r.duties + ".");
        if (r.pay) bits.push("How you are paid: " + r.pay + ".");
        if (social.standing) bits.push("Your own circumstance: " + social.standing);
        return bits.join(" ") + " Answer how you earn your living first (what the work is, how it pays), then work in that one circumstance. Speak as yourself; do not recite your station label, and never say 'of Townsfolk' or any bare role as if it were a group. Keep any names and debts exactly as given.";
    }
    return "Say this in your own words and your own manner, keeping every name, number and detail exactly: " + canon;
}

function getSocialFactQuestion(npc, key) {
    const social = ensureNPCSocial(npc);
    const q = SOCIAL_FACT_QUESTIONS[key];
    if (key === "standing") return _socialStandingPhrase(social).ask;
    return q ? q.ask : "";
}

// Two short prompt lines for the AI: the NPC's place, and facts the player has
// already been told (so replies stay consistent). Hidden facts are not sent.
function getNPCSocialPromptLines(npc) {
    const social = npc && npc.isHumanoid === true && !npc.isGuide ? ensureNPCSocial(npc) : null;
    if (!social) return "";
    const lines = [];
    if (social.rank) lines.push("- Your place: " + getSocialIdentity(npc) + (social.master ? " (bonded to " + social.master + ")" : "") + (social.standing ? ". In your own words: \"" + social.standing + "\"" : ""));
    const told = ["need", "worry", "liking", "secret"].filter(function (k) { const record=getNPCSocialFactRecord(npc,k);return record && record.known; }).slice(0, 2)
        .map(function (k) { return k + ": " + getNPCSocialFactRecord(npc,k).text; });
    if (told.length) lines.push("- You have already told the player (stay consistent): " + told.join(" | "));
    return lines.join("\n");
}

// ============================================================================
// NPC TIES - base-level relationships (family, friends, workmates)
// npc.ties = [{ type, id }] where type is one of spouse, lover, parent, child, sibling,
// friend, coworker, employer, employee (the tie as seen FROM this NPC).
// Ties are same-species only (cross-species ties are taboo here), match age and
// job, and are made when an NPC is created by linking it to NPCs that already
// exist in the world (see pickNPCTies / finalizeNPCTies, called from createNPC).
// Kin share a group: a kobold's family shares a master, a dragonborn's a House,
// a clan member's a clan (see generateNPCSocial, which reads npc._kinSocial).
// Family members also share a surname. Ties are revealed by the "ask about the
// people in their life" option (social fact "ties").
// ============================================================================
const NPC_TIE_MAX = 3;
const NPC_TIE_FAMILY_CHANCE = 0.16;
const NPC_TIE_WORK_CHANCE = 0.55;
const NPC_TIE_FRIEND_CHANCE = 0.18;
const NPC_TIE_LOVER_CHANCE = 0.10;
const NPC_TIE_RECIPROCAL = { spouse: "spouse", parent: "child", child: "parent", sibling: "sibling", friend: "friend", coworker: "coworker", employer: "employee", employee: "employer", lover: "lover" };
const NPC_TIE_FAMILY = ["spouse", "parent", "child", "sibling"];
// Roles that are staff of the building they stand in (a place of work).
const NPC_TIE_WORK_ROLES = ["Mason", "Keeper of the Quiet", "Vigil Tender", "Bier Bearer", "Bathkeeper", "BathhouseAttendant", "BathhousePractitioner", "Innkeeper", "Bartender", "Cook", "Servant", "Blacksmith", "Clothier", "Shopkeeper", "Vendor", "Healer", "Priest", "Archivist", "Guildmaster", "Merchant", "Trader", "Enchanter", "Arcanist", "Reliquarian"];
// Employers in a building and who they plausibly employ there.
const NPC_TIE_EMPLOYER_ROLES = ["Keeper of the Quiet", "Bathkeeper", "Innkeeper", "Blacksmith", "Clothier", "Shopkeeper", "Merchant", "Guildmaster", "Healer", "Archivist"];
const NPC_TIE_EMPLOYEE_ROLES = ["Vigil Tender", "Bier Bearer", "Servant", "Cook", "Bartender", "Vendor", "Villager", "Townsfolk", "BathhouseAttendant", "BathhousePractitioner"];
// Roles that work in teams across a zone rather than in one building.
const NPC_TIE_TEAM_ROLES = ["Bier Bearer", "Town Guard", "Stone Guard", "Miner", "Scout", "Raider", "Scavenger", "Cultist"];

function _tieCount(npc, type) {
    return (npc.ties || []).filter(function (t) { return !type || t.type === type; }).length;
}

function _tieHas(npc, otherId) {
    return (npc.ties || []).some(function (t) { return t.id === otherId; });
}

function _tieRoomOf(npc) {
    return (typeof G === "object" && G && G.roomMap && npc.coords) ? G.roomMap[npc.coords] : null;
}

// Existing, living, same-species NPCs a new NPC could be tied to.
function listNPCTieCandidates(npc, room) {
    const out = [];
    if (typeof G !== "object" || !G || !G.roomMap) return out;
    const zone = room ? room.zone : null;
    Object.keys(G.roomMap).forEach(function (key) {
        const r = G.roomMap[key];
        if (!r || !Array.isArray(r.creatures)) return;
        if (zone && r.zone !== zone) return;
        r.creatures.forEach(function (c) {
            if (!c || c === npc || c.isHumanoid !== true || c.isGuide || c.dead || c.objectType === "body") return;
            if (c.species !== npc.species || typeof c.age !== "number") return;
            if (!c.social || _tieCount(c) >= NPC_TIE_MAX || _tieHas(c, npc.id)) return;
            out.push({ npc: c, room: r });
        });
    });
    return out;
}

// Which family tie (from npc's side) fits this pair, by age and gender.
// Returns an array of possible types.
function _familyTypesFor(npc, c) {
    const types = [];
    const diff = npc.age - c.age;
    const g1 = npc.gender, g2 = c.gender;
    if (Math.abs(diff) <= 12 && npc.age >= 22 && c.age >= 22 && g1 && g2 && g1 !== g2 && g1 !== "none" && g2 !== "none" &&
        _tieCount(c, "spouse") === 0 && _tieCount(npc, "spouse") === 0) types.push("spouse");
    if (Math.abs(diff) <= 14) types.push("sibling");
    // npc is the parent of c
    if (diff >= 18 && diff <= 45 && _tieCount(c, "parent") < 2 && _tieCount(npc, "child") < 3) types.push("parent");
    // npc is the child of c
    if (-diff >= 18 && -diff <= 45 && _tieCount(npc, "parent") < 2 && _tieCount(c, "child") < 3) types.push("child");
    return types;
}

function _workTypeFor(npc, c, npcRoom, cRoom) {
    if (npcRoom && cRoom && npcRoom.buildingId && npcRoom.buildingId === cRoom.buildingId) {
        const a = npc.role, b = c.role;
        if (NPC_TIE_EMPLOYER_ROLES.indexOf(a) >= 0 && NPC_TIE_EMPLOYEE_ROLES.indexOf(b) >= 0) return "employer";
        if (NPC_TIE_EMPLOYER_ROLES.indexOf(b) >= 0 && NPC_TIE_EMPLOYEE_ROLES.indexOf(a) >= 0) return "employee";
        if (NPC_TIE_WORK_ROLES.indexOf(a) >= 0 && NPC_TIE_WORK_ROLES.indexOf(b) >= 0) return "coworker";
    }
    if (NPC_TIE_TEAM_ROLES.indexOf(npc.role) >= 0 && npc.role === c.role) return "coworker";
    return null;
}

// Chooses ties for a NEW npc (not yet placed) from existing NPCs. Sets
// npc._pendingTies and, for a family tie, npc._kinSocial so the social sheet
// inherits the kin's group. Call before generateNPCEnrichment.
function pickNPCTies(npc, room) {
    if (!npc || npc.isHumanoid !== true || npc.isGuide) return;
    if (typeof SOCIETY_BY_SPECIES === "undefined" || !SOCIETY_BY_SPECIES[npc.species]) return;
    if (typeof npc.age !== "number") return;
    const cands = listNPCTieCandidates(npc, room);
    if (!cands.length) return;
    const pending = [];
    const used = {};
    const shuffled = cands.slice().sort(function () { return Math.random() - 0.5; });

    // Family: one family tie at most for a new NPC.
    if (Math.random() < NPC_TIE_FAMILY_CHANCE) {
        for (let i = 0; i < shuffled.length; i++) {
            const types = _familyTypesFor(npc, shuffled[i].npc);
            if (!types.length) continue;
            const type = types[_npcRandInt(0, types.length - 1)];
            pending.push({ type: type, other: shuffled[i].npc });
            used[shuffled[i].npc.id] = true;
            npc._kinSocial = shuffled[i].npc.social;
            break;
        }
    }
    // Lover: an unmarried adult of the same species and near age, never kin of the
    // family tie picked above and never someone already married or taken.
    const pendingSpouse = pending.some(function (p) { return p.type === "spouse"; });
    if (!pendingSpouse && npc.age >= 22 && Math.random() < NPC_TIE_LOVER_CHANCE) {
        const famOther = pending.length ? pending[0].other : null;
        for (let i = 0; i < shuffled.length; i++) {
            const c = shuffled[i].npc;
            if (used[c.id] || typeof c.age !== "number" || c.age < 22 || Math.abs(c.age - npc.age) > 15) continue;
            if (!npc.gender || !c.gender || npc.gender === "none" || c.gender === "none" || npc.gender === c.gender) continue;
            if (_tieCount(c, "spouse") > 0 || _tieCount(c, "lover") > 0) continue;
            if (famOther && (c === famOther || _tieHas(c, famOther.id))) continue;
            pending.push({ type: "lover", other: c });
            used[c.id] = true;
            break;
        }
    }
    // Work: someone in the same building or team.
    if (Math.random() < NPC_TIE_WORK_CHANCE) {
        for (let i = 0; i < shuffled.length; i++) {
            const c = shuffled[i];
            if (used[c.npc.id]) continue;
            const type = _workTypeFor(npc, c.npc, room, c.room);
            if (type) { pending.push({ type: type, other: c.npc }); used[c.npc.id] = true; break; }
        }
    }
    // Friend: a peer in age, same zone, anyone.
    if (pending.length < 2 && Math.random() < NPC_TIE_FRIEND_CHANCE) {
        for (let i = 0; i < shuffled.length; i++) {
            const c = shuffled[i];
            if (used[c.npc.id] || Math.abs(c.npc.age - npc.age) > 20) continue;
            pending.push({ type: "friend", other: c.npc });
            used[c.npc.id] = true;
            break;
        }
    }
    npc._pendingTies = pending;
}

// A family shares a surname. Changes only the NEW npc's name unless the other
// has none yet and has not been named to the player.
function _shareSurname(a, b) {
    if (typeof ensureNPCGivenName !== "function" || typeof NPC_GIVEN_NAME_POOLS === "undefined") return;
    ensureNPCGivenName(a); ensureNPCGivenName(b);
    const pool = NPC_GIVEN_NAME_POOLS[a.species];
    if (!pool || !pool.surnames || !a.givenName || !b.givenName) return;
    const partsA = a.givenName.split(" ");
    const partsB = b.givenName.split(" ");
    let surname = partsA.length > 1 ? partsA[partsA.length - 1] : "";
    if (!surname) {
        if (a.memory && a.memory.nameKnown) return;
        surname = pool.surnames[_npcRandInt(0, pool.surnames.length - 1)];
        a.givenName = partsA[0] + " " + surname;
    }
    b.givenName = partsB[0] + " " + surname;
}

// Writes the picked ties onto both NPCs (reciprocally). Call after creation.
function finalizeNPCTies(npc) {
    const pending = npc && npc._pendingTies;
    delete npc._pendingTies;
    delete npc._kinSocial;
    if (!pending || !pending.length) return;
    npc.ties = npc.ties || [];
    pending.forEach(function (p) {
        const other = p.other;
        if (!other || _tieHas(npc, other.id)) return;
        npc.ties.push({ type: p.type, id: other.id });
        other.ties = other.ties || [];
        other.ties.push({ type: NPC_TIE_RECIPROCAL[p.type], id: npc.id });
        if (NPC_TIE_FAMILY.indexOf(p.type) >= 0) _shareSurname(other, npc);
    });
}

// How each society says spouse and lover (the realm uses the common words).
const NPC_SOCIETY_TIE_WORDS = {
    "orc-clan": { spouse: "bonded mate", lover: "lover" },
    "goblin-tribe": { spouse: "mate", lover: "lover" },
    "lizardfolk-tribe": { spouse: "clutch-mate", lover: "lover" },
    "kobold": { spouse: "mate", lover: "lover" },
    "catfolk-troupe": { spouse: "troupe-mate", lover: "lover" },
    "wolfkin-pack": { spouse: "pack-mate", lover: "lover" },
    "satyr-revel": { spouse: "consort", lover: "fling" },
    "harefolk-warren": { spouse: "warren-mate", lover: "lover" },
    "ratfolk-nest": { spouse: "nest-mate", lover: "lover" },
    "kenku-flock": { spouse: "roost-mate", lover: "lover" },
    "dragonborn-house": { spouse: "consort", lover: "paramour" }
};

function _tieRelationWord(type, otherGender, species) {
    const male = otherGender === "male", female = otherGender === "female";
    const societyId = typeof SOCIETY_BY_SPECIES !== "undefined" && species ? SOCIETY_BY_SPECIES[species] : "";
    const special = NPC_SOCIETY_TIE_WORDS[societyId];
    if (special && special[type]) return special[type];
    if (type === "lover") return "lover";
    if (type === "spouse") return male ? "husband" : (female ? "wife" : "partner");
    if (type === "parent") return male ? "father" : (female ? "mother" : "parent");
    if (type === "child") return male ? "son" : (female ? "daughter" : "child");
    if (type === "sibling") return male ? "brother" : (female ? "sister" : "sibling");
    return "";
}

function _tieAnOrA(word) { return /^[aeiou]/i.test(word) ? "an " : "a "; }

// One tie as the NPC would say it, in first person ("" if the other is gone).
function describeNPCTie(npc, tie) {
    const other = typeof findNPCById === "function" ? findNPCById(tie.id) : null;
    if (!other || other.dead) return "";
    const r = _tieRoomOf(other);
    const where = r && (r.buildingName || (r.isNPCHome ? "their home" : "")) ? (r.buildingName ? " at " + r.buildingName : "") : "";
    const role = other.role ? String(other.role).toLowerCase() : "";
    const roleBit = role ? _tieAnOrA(role) + role : "someone";
    const t = tie.type;
    if (NPC_TIE_FAMILY.indexOf(t) >= 0 || t === "lover") {
        const word = _tieRelationWord(t, other.gender, npc.species);
        return "My " + word + " is " + roleBit + (where || "") + ".";
    }
    if (t === "coworker") return "I work alongside " + roleBit + (where || "") + ".";
    if (t === "employer") return "I work for " + roleBit + (where || "") + ".";
    if (t === "employee") return roleBit.charAt(0).toUpperCase() + roleBit.slice(1) + (where || "") + " works for me.";
    if (t === "friend") return "I count " + roleBit + (where || "") + " as a friend.";
    return "";
}

// The reveal line: up to two ties, family first.
function getNPCTiesAnswer(npc) {
    function tieRank(t) { return NPC_TIE_FAMILY.indexOf(t.type) >= 0 ? 2 : (t.type === "lover" ? 1 : 0); }
    const ties = (npc.ties || []).slice().sort(function (a, b) { return tieRank(b) - tieRank(a); });
    const lines = [];
    for (let i = 0; i < ties.length && lines.length < 2; i++) {
        const l = describeNPCTie(npc, ties[i]);
        if (l) lines.push(l);
    }
    return lines.join(" ");
}

// A partnered NPC (living spouse) is not moved by flirting or teasing unless
// their inhibitions are down (drink, or heavy earlier charm). Returns the
// spouse NPC, or null if the NPC is free or the spouse is gone.
const NPC_PARTNER_DISINHIBITION_MIN = 40;
function getNPCPartner(npc) {
    if (!npc || !npc.ties) return null;
    for (let i = 0; i < npc.ties.length; i++) {
        if (npc.ties[i].type !== "spouse") continue;
        const other = typeof findNPCById === "function" ? findNPCById(npc.ties[i].id) : null;
        if (other && !other.dead) return other;
    }
    return null;
}

// A living lover (a tie of type "lover"), or null. A lover is not a spouse: no
// shared surname and no family tie, but flirting is turned aside the same way.
function getNPCLover(npc) {
    if (!npc || !npc.ties) return null;
    for (let i = 0; i < npc.ties.length; i++) {
        if (npc.ties[i].type !== "lover") continue;
        const other = typeof findNPCById === "function" ? findNPCById(npc.ties[i].id) : null;
        if (other && !other.dead) return other;
    }
    return null;
}

function npcShrugsOffRomance(npc) {
    if (!getNPCPartner(npc) && !getNPCLover(npc)) return false;
    const d = npc.memory && typeof npc.memory.disinhibition === "number" ? npc.memory.disinhibition : 0;
    return d < NPC_PARTNER_DISINHIBITION_MIN;
}

// Slimes have neither a face nor limbs, including in older saved records.
function isSlimeNPC(npc) {
    return !!npc && String(npc.species || "").trim().toLowerCase() === "slime";
}

// Resolve public species anatomy live: older saves gain baseline ears/feet
// without rerolling their recorded individual traits. Explicit overrides win.
function getEntityAnatomyProfile(entity) {
    const species = entity && (entity.species || (entity.appearance && entity.appearance.species));
    const template = species && typeof getSpeciesTemplate === "function" ? getSpeciesTemplate(species) : null;
    return template && template.anatomyProfile || {};
}

function getEntityMorphology(entity) {
    const profile = getEntityAnatomyProfile(entity);
    const anatomy = entity && entity.anatomy || {}, appearance = entity && entity.appearance || {};
    const source = Object.assign({}, profile.morphology || {}, anatomy.morphology || appearance.morphology || {});
    const morphology = {};
    ["ears", "face", "bodyPlan", "hands", "feet", "tail", "wings"].forEach(key => {
        if (typeof source[key] === "string" && source[key].trim()) morphology[key] = source[key].trim();
    });
    if (Array.isArray(source.absent)) morphology.absent = source.absent.filter(value => typeof value === "string" && value.trim());
    return morphology;
}

function getSpeciesAppearanceTraits(entity) {
    const morphology = getEntityMorphology(entity);
    // The slime's live pile/mimic description owns its current public outline.
    if (String(entity && (entity.species || (entity.appearance && entity.appearance.species)) || "").toLowerCase() === "slime") return [];
    return ["ears", "face", "bodyPlan", "hands", "feet", "tail", "wings"].map(key => morphology[key]).filter(Boolean);
}

function getEntityBodyCondition(entity) {
    if (!entity) return "normal";
    if (getEntityAnatomyProfile(entity).bodyFatEligible === false) return "normal";
    const anatomy = entity.anatomy || {}, appearance = entity.appearance || {};
    const condition = entity.bodyCondition || appearance.bodyCondition || anatomy.bodyCondition || (anatomy.body && anatomy.body.weightClass);
    if (condition === "normal" || condition === "overweight") return condition;
    const build = anatomy.build || entity.bodyType || entity.build || appearance.build || "";
    return /\b(?:overweight|fat|obese|corpulent)\b/i.test(build) ? "overweight" : "normal";
}

function getEntityBuildText(entity) {
    const anatomy = entity && entity.anatomy || {}, appearance = entity && entity.appearance || {};
    if (getEntityBodyCondition(entity) === "overweight") return "fat and round-bodied";
    return String(anatomy.build || (entity && (entity.bodyType || entity.build)) || appearance.build || "");
}

function getEntitySurfaceParts(entity) {
    const anatomy = entity && entity.anatomy || {}, appearance = entity && entity.appearance || {};
    const body = anatomy.body || {}, profile = getEntityAnatomyProfile(entity);
    const color = body.color || (entity && (entity.surfaceColor || entity.skinTone || entity.furColor || entity.scaleColor || entity.featherColor)) || appearance.skinTone || "";
    const regions = Array.isArray(body.regions) ? body.regions : profile.surfaceRegions;
    if (Array.isArray(regions) && regions.length) {
        return regions.map(region => {
            const recorded = region.color || (!Array.isArray(region.colors) ? color : "");
            return [recorded, region.surfaceType, region.region ? "on " + region.region : ""].filter(Boolean).join(" ");
        }).filter(Boolean);
    }
    const surface = body.surfaceType || (entity && entity.surfaceType) || profile.surfaceType ||
        (entity && (entity.skinTone ? "skin" : entity.furColor ? "fur" : entity.scaleColor ? "scales" : entity.featherColor ? "feathers" : ""));
    return color && surface ? [color + " " + surface] : [];
}

// Reader-facing species anatomy. anatomyProfile.morphology stays the precise
// record for AI prompts, portraits and checks; anatomyProfile.look holds the
// short phrases a player reads ("" leaves an unremarkable part out). An
// individual override (anatomy.morphology) wins and is lightly tidied.
function _npcTidyMorphologyPhrase(text) {
    return String(text || "").replace(/^\s*one pair of\s+/i, "")
        .replace(/\s+(?:on|projecting from) the sides of the head\b/i, "").replace(/\s+/g, " ").trim();
}

function getSpeciesLookParts(entity) {
    if (String(entity && (entity.species || (entity.appearance && entity.appearance.species)) || "").toLowerCase() === "slime") return [];
    const profile = getEntityAnatomyProfile(entity);
    const anatomy = entity && entity.anatomy || {}, appearance = entity && entity.appearance || {};
    const overrides = anatomy.morphology || appearance.morphology || {};
    const look = profile.look || {};
    const morphology = getEntityMorphology(entity);
    const parts = [];
    ["ears", "face", "bodyPlan", "hands", "feet", "tail", "wings"].forEach(key => {
        let text;
        if (Object.prototype.hasOwnProperty.call(overrides, key)) text = _npcTidyMorphologyPhrase(overrides[key]);
        else if (Object.prototype.hasOwnProperty.call(look, key)) text = String(look[key] || "").trim();
        else text = _npcTidyMorphologyPhrase(morphology[key]);
        if (text && parts.indexOf(text) < 0) parts.push(text);
    });
    return parts;
}

function getSpeciesLookText(entity) {
    return _npcJoinList(getSpeciesLookParts(entity));
}

function getSpeciesAppearanceText(entity, forPrompt) {
    const traits = getSpeciesAppearanceTraits(entity);
    if (forPrompt) {
        const morphology = getEntityMorphology(entity);
        if (Array.isArray(morphology.absent) && morphology.absent.length) traits.push("no " + morphology.absent.join(", no "));
        if (String(entity && (entity.species || (entity.appearance && entity.appearance.species)) || "").toLowerCase() === "slime") {
            traits.unshift("a faceless, eyeless, limbless gelatinous body; a recorded temporary mimic shape can change its outline only");
        }
        if (getEntityBodyCondition(entity) === "overweight") traits.push("an overweight body with visible body fat and rounded contours; preserve the species anatomy");
    }
    return traits.join(", ");
}

function getPublicAppearanceFacts(entity) {
    return {
        species: String(entity && (entity.species || (entity.appearance && entity.appearance.species)) || ""),
        morphology: getEntityMorphology(entity),
        build: getEntityBuildText(entity),
        bodyCondition: getEntityBodyCondition(entity),
        surfaces: getEntitySurfaceParts(entity)
    };
}

function entityHasAppearancePart(entity, part) {
    const absent = getEntityMorphology(entity).absent || [];
    return absent.indexOf(part) < 0;
}

function getPortraitAppearanceNegatives(entity, negatives) {
    const anatomy = entity && entity.anatomy || {}, appearance = entity && entity.appearance || {};
    const overrides = anatomy.morphology || appearance.morphology || {};
    const terms = String(negatives || "").split(",").map(term => term.trim()).filter(term => term &&
        !(Object.prototype.hasOwnProperty.call(overrides, "ears") && /ears?/i.test(term)));
    if (getEntityBodyCondition(entity) !== "overweight") return terms.join(", ");
    return terms.filter(term => !/^(?:stocky|heavyset|fat|overweight|plump|round(?:ed)? face|full cheeks)$/i.test(term)).join(", ");
}

function getNPCVisibleEyeColor(npc) {
    if (!npc || isSlimeNPC(npc) || !entityHasAppearancePart(npc, "eyes")) return "";
    const anatomy = npc.anatomy || {};
    const colour = String(npc.eyeColor || (anatomy.eyes && anatomy.eyes.color) || "").trim();
    return /^(?:none|no eyes|eyeless|n[/]a)$/i.test(colour) ? "" : colour;
}

function getSlimeBodyDescription(npc) {
    if (typeof window.getSlimeVisibleState === "function") window.getSlimeVisibleState(npc);
    const body = npc.anatomy && npc.anatomy.body || {};
    const colour = body.color || npc.surfaceColor || "";
    const still = npc.dead || npc.unconscious || npc.isUnconsciousBody || (npc.currentState && npc.currentState.sleeping);
    const bond = npc._slimeBond;
    const clock = typeof getStatusClock === "function" ? getStatusClock() : 0;
    if (!still && bond && bond.mimic && clock < bond.mimic.until && bond.reserve >= 24 && (npc.hostility || 0) < 60) {
        return [colour, "gel holding the shape of " + bond.mimic.shape].filter(Boolean).join(" ");
    }
    return [colour, (bond && bond.growth > 0 ? "broad, heavy gelatinous pile" : "gelatinous pile"), still ? "" : "slowly moving across the floor"].filter(Boolean).join(" ");
}

function getNPCVisibleAction(npc) {
    if (npc && npc.currentState && npc.currentState.sleeping && !npc.dead && !npc.unconscious && !npc.isUnconsciousBody) {
        const spot = npc._npcRestSpot;
        const surface = spot && /^(bed|cot|floor)$/.test(spot.type) ? spot.type : "";
        return "is lying asleep" + (surface ? " on " + (surface === "floor" ? "the floor" : "a " + surface) : "");
    }
    return String(npc && npc.action || "is standing nearby").trim();
}

function getNPCVisibleBehavior(npc) {
    if (npc && npc.currentState && npc.currentState.sleeping) return getNPCVisibleAction(npc);
    if (!isSlimeNPC(npc)) return String(npc && npc.behavior || "");
    if (npc.dead || npc.unconscious || npc.isUnconsciousBody) return "";
    if (typeof window.getSlimeVisibleState === "function") return window.getSlimeVisibleState(npc);
    return (npc.hostility || 0) >= 60 ? "Looks ready to attack" : "Quivers gently";
}

function buildNPCAppearanceHighlights(npc, forPortrait, forReader) {
    if (!npc) return [];
    const anatomy = npc.anatomy || {};
    const body = anatomy.body || {};
    const highlights = [];

    const build = getEntityBuildText(npc);
    if (build) highlights.push(build + " build");
    if (forReader) highlights.push(...getSpeciesLookParts(npc));
    else {
        const speciesTraits = getSpeciesAppearanceText(npc);
        if (speciesTraits) highlights.push(speciesTraits);
    }
    
    if (isSlimeNPC(npc)) highlights.push(getSlimeBodyDescription(npc));
    else highlights.push(...getEntitySurfaceParts(npc));
    const eyes = getNPCVisibleEyeColor(npc);
    if (eyes) highlights.push(eyes + " eyes");
    if (npc.hairColor && entityHasAppearancePart(npc, "hair")) {
        highlights.push((npc.hairStyle ? npc.hairStyle + " " : "") + npc.hairColor + " hair");
    }
    // Species anatomy above is public; optional marks/features remain portrait-only.
    // Keep every baseline/color/eye/hair fact before budgeting optional details.
    const requiredCount = highlights.length;
    if (forPortrait) {
        if (Array.isArray(anatomy.features)) highlights.push(...anatomy.features);
        if (Array.isArray(anatomy.marks) && anatomy.marks.length && highlights.length < 6) highlights.push(anatomy.marks[0]);
    }

    return highlights.slice(0, Math.max(6, requiredCount));
}

function buildNPCPhysicalSummary(npc) {
    if (!npc) return "";
    const highlights = buildNPCAppearanceHighlights(npc);
    const ageDesc = typeof getNPCAgeDescriptor === "function" ? getNPCAgeDescriptor(npc) : null;
    const ageWord = ageDesc ? String(ageDesc.label).toLowerCase() : "";
    const identity = [ageWord, npc.gender && npc.gender !== "none" ? npc.gender : "", npc.species || ""]
        .filter(Boolean).join(" ");

    if (!identity && !highlights.length) return "";
    if (!highlights.length) return identity + ".";
    if (!identity) return _npcJoinList(highlights) + ".";
    return identity + " with " + _npcJoinList(highlights) + ".";
}

function getNPCObservationDetail(npc) {
    if (!npc) return "";
    // Rebuild from live facts rather than legacy cached feature lists.
    // A glance: build, the two most telling species parts, then colouring.
    const look = getSpeciesLookParts(npc).slice(2);
    const highlights = buildNPCAppearanceHighlights(npc, false, true).filter(h => look.indexOf(h) < 0).slice(0, 4);
    if (!highlights.length) return "";
    return "with " + _npcJoinList(highlights);
}

// Standing adult height ranges for this setting, in centimetres. These are
// shared by NPC generation and the player's species-average fallback. Actual
// recorded heights win; anatomyProfile.heightRangeCm can override a range.
const NPC_HEIGHT_RANGES_CM = {
    human: [150, 200], elf: [160, 205], dwarf: [115, 145],
    halfling: [85, 115], goblin: [95, 130], orc: [185, 230],
    dragonborn: [185, 225], lizardfolk: [165, 210], kobold: [70, 105],
    catfolk: [150, 190], wolfkin: [170, 210], satyr: [150, 190],
    harefolk: [145, 180], ratfolk: [70, 105], kenku: [145, 175]
};
const NPC_HEIGHT_LEVEL_TOLERANCE_CM = 8;

function getSpeciesHeightRangeCm(species) {
    const key = String(species || "").toLowerCase();
    const template = _npcGetSpeciesTemplate(species) || {};
    const configured = template.anatomyProfile && template.anatomyProfile.heightRangeCm;
    if (Array.isArray(configured) && configured.length === 2 &&
        configured.every(function (n) { return typeof n === "number" && isFinite(n) && n > 0; }) && configured[1] >= configured[0]) return configured;
    if (NPC_HEIGHT_RANGES_CM[key]) return NPC_HEIGHT_RANGES_CM[key];
    return { tiny: [70, 105], small: [100, 145], medium: [150, 200], large: [185, 230] }[template.size] || null;
}

function ensureNPCHeightCm(npc) {
    if (!npc || npc.isHumanoid !== true) return null;
    if (typeof npc.heightCm === "number" && isFinite(npc.heightCm) && npc.heightCm > 0) return npc.heightCm;
    const recorded = npc.anatomy && npc.anatomy.heightCm;
    if (typeof recorded === "number" && isFinite(recorded) && recorded > 0) {
        npc.heightCm = recorded;
        return recorded;
    }
    if (typeof npc.age === "number" && npc.age < 18) return null;
    const range = getSpeciesHeightRangeCm(npc.species);
    if (!range) return null;
    // A generated ID already contains randomness. Hashing it also migrates
    // older saves consistently, without rerolling height on each inspection.
    const seed = [npc.species, npc.id || npc.name || "", npc.gender || ""].join("|");
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i++) hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619);
    npc.heightCm = range[0] + (hash >>> 0) % (range[1] - range[0] + 1);
    return npc.heightCm;
}

function getPlayerHeightCm(player) {
    if (!player) return null;
    const appearance = player.appearance || {};
    const recorded = [appearance.heightCm, player.heightCm];
    for (let i = 0; i < recorded.length; i++) {
        if (typeof recorded[i] === "number" && isFinite(recorded[i]) && recorded[i] > 0) return recorded[i];
    }
    const range = getSpeciesHeightRangeCm(appearance.species || player.species || "human");
    return range ? (range[0] + range[1]) / 2 : null;
}

function getNPCHeightView(npc) {
    const player = typeof G === "object" && G && G.player;
    const height = ensureNPCHeightCm(npc);
    const playerHeight = getPlayerHeightCm(player);
    if (height === null || playerHeight === null || npc.unconscious ||
        (npc.currentState && npc.currentState.sleeping)) return "";
    const difference = height - playerHeight;
    if (Math.abs(difference) <= NPC_HEIGHT_LEVEL_TOLERANCE_CM) return "";
    return difference > 0 ? "up" : "down";
}

function getNPCInspectionDetail(npc) {
    if (!npc) return "";
    const p = _npcInspectionPronouns(npc);
    const anatomy = npc.anatomy || {};
    const body = anatomy.body || {};
    const paragraphs = [];
    const age = getNPCAgeDescriptor(npc);
    const identity = [age && age.label.toLowerCase(), npc.gender !== "none" && npc.gender, String(npc.species || "").toLowerCase()]
        .filter(Boolean).join(" ");
    const first = [];
    const heightView = getNPCHeightView(npc);
    const opening = heightView ? "You look " + heightView + " at" : p.subject + " " + p.be;
    if (identity) first.push(opening + " " + _npcInspectionArticle(identity) + " " + identity + ".");
    const build = _npcInspectionText(getEntityBuildText(npc));
    if (build) first.push(p.subject + " " + p.have + " " + _npcInspectionArticle(build) + " " + build + " build.");
    const speciesTraits = getSpeciesLookText(npc);
    if (speciesTraits) first.push(p.subject + " " + p.have + " " + speciesTraits + ".");
    const colouring = [];
    const surface = body.surfaceType || npc.surfaceType || (npc.skinTone ? "skin" : npc.furColor ? "fur" : npc.featherColor ? "feathers" : npc.scaleColor ? "scales" : "");
    const colour = body.color || npc.surfaceColor || npc.skinTone || npc.furColor || npc.featherColor || npc.scaleColor;
    if (isSlimeNPC(npc)) {
        const pile = getSlimeBodyDescription(npc);
        first.push("It is " + _npcInspectionArticle(pile) + " " + pile + ".");
    } else colouring.push(...getEntitySurfaceParts(npc));
    const eyes = getNPCVisibleEyeColor(npc);
    if (eyes) colouring.push(eyes + " eyes");
    if (colouring.length) first.push(p.subject + " " + p.have + " " + _npcJoinList(colouring) + ".");
    const hair = anatomy.hair || {};
    const hairColour = npc.hairColor || hair.color;
    if (hairColour && hairColour !== "none" && hairColour !== "shaved" && entityHasAppearancePart(npc, "hair")) {
        const length = _npcInspectionText(npc.hairLength || hair.length);
        const style = _npcInspectionText(npc.hairStyle || hair.style);
        const styles = { cropped: "cropped close", short: "cut short", long: "worn long", loose: "worn loose", flowing: "flowing freely", curly: "curly", messy: "tousled", unstyled: "unstyled" };
        const hairSubject = p.possessive.charAt(0).toUpperCase() + p.possessive.slice(1);
        first.push(hairSubject + " " + [length, hairColour, "hair"].filter(Boolean).join(" ") +
            (style ? " is " + (styles[style] || style) : "") + ".");
    }
    if (first.length) paragraphs.push(first.join(" "));

    // Read equipment each time: inventory, weapons and removed garments are not clothing.
    const slots = ["head", "upper", "chest", "lower", "legs", "feet", "hands", "cloak", "back", "neck", "ring"];
    const clothing = npc.intimacy && npc.intimacy.encounter && npc.intimacy.encounter.active && npc.intimacy.clothing && npc.intimacy.clothing.npc;
    const worn = [];
    slots.forEach(function (slot) {
        if (clothing && ((clothing.top === false && (slot === "upper" || slot === "chest")) ||
            (clothing.bottom === false && (slot === "lower" || slot === "legs")))) return;
        const item = npc.equipped && npc.equipped[slot];
        const rawName = typeof getNPCLookItemName === "function" ? getNPCLookItemName(item) : _npcInspectionText(typeof item === "string" ? item : item && item.name);
        const name = rawName && typeof withIndefiniteArticle === "function" ? withIndefiniteArticle(rawName) : rawName;
        if (name && worn.indexOf(name) < 0) worn.push(name);
    });
    if (worn.length) paragraphs.push(p.subject + " " + p.be + " wearing " + _npcJoinList(worn) + ".");

    // Broad silhouette only; never include hidden genital/nipple details.
    if (isAdultHumanoidNPC(npc)) {
        const shapes = { ectomorph: "slender", mesomorph: "toned", endomorph: "soft" };
        const shape = shapes[String(npc.somatotype || "").toLowerCase()] || "";
        const sizeWords = { medium: "medium-sized", small: "small", large: "large", "very large": "very large" };
        const breastSize = _npcBodySize(npc, "breasts");
        const buttSize = _npcBodySize(npc, "buttocks");
        const parts = [];
        if (sizeWords[breastSize]) parts.push([shape, sizeWords[breastSize], "breasts"].filter(Boolean).join(" "));
        if (breastSize === "flat") parts.push("a flat chest");
        if (sizeWords[buttSize]) {
            const words = [shape, sizeWords[buttSize], "butt"].filter(Boolean).join(" ");
            parts.push(_npcInspectionArticle(words) + " " + words);
        }
        if (parts.length) paragraphs.push(p.subject + " " + p.have + " " + _npcJoinList(parts) + ".");
    }

    // Physical distinguishing features/marks are deliberately omitted from inspection.
    // Keep their underlying authored data; it may have mechanical uses.
    const accessories = [];
    if (Array.isArray(npc.piercings)) {
        npc.piercings.forEach(function (piercing) {
            const description = _npcInspectionText(piercing);
            if (description) accessories.push(p.subject + " " + p.have + " " + description + ".");
        });
    }
    const fashion = _npcInspectionText(npc.fashionStyle);
    if (fashion) accessories.push(p.possessive.charAt(0).toUpperCase() + p.possessive.slice(1) + " fashion sense is " + fashion + ".");
    if (accessories.length) paragraphs.push(accessories.join(" "));

    const taste = getPlayerTasteForNPC(npc);
    if (taste.label) paragraphs.push(describePlayerTasteSentence(npc, taste, p));
    return paragraphs.join("\n\n");
}

function _npcInspectionText(value) {
    if (value && typeof value === "object") value = value.description;
    return typeof value === "string" ? value.trim().replace(/[.!]+$/, "") : "";
}

function _npcInspectionArticle(value) {
    return /^[aeiou]/i.test(value) ? "an" : "a";
}

function _npcInspectionPronouns(npc) {
    const gender = String(npc.gender || "").toLowerCase();
    if (gender === "female") return { subject: "She", possessive: "her", object: "her", be: "is", have: "has" };
    if (gender === "male") return { subject: "He", possessive: "his", object: "him", be: "is", have: "has" };
    if (npc.isHumanoid === false) return { subject: "It", possessive: "its", object: "it", be: "is", have: "has" };
    return { subject: "They", possessive: "their", object: "them", be: "are", have: "have" };
}

function getBaseHostilityForTemperament(temperament) {
    const key = String(temperament || "neutral").toLowerCase();
    const ranges = {
        aggressive: [72, 92],
        hostile: [62, 86],
        wary: [36, 58],
        skittish: [28, 52],
        neutral: [24, 46],
        curious: [18, 38],
        bold: [22, 48],
        calm: [14, 34],
        friendly: [6, 24]
    };
    const [min, max] = ranges[key] || ranges.neutral;
    return _npcRandInt(min, max);
}

function getBaseFavorabilityForTemperament(temperament) {
    const key = String(temperament || "neutral").toLowerCase();
    if (key === "aggressive" || key === "hostile") return -60;
    if (key === "wary") return -20;
    if (key === "skittish") return -10;
    if (key === "friendly") return 18;
    if (key === "curious") return 8;
    if (key === "calm") return 10;
    return 0;
}

// ── LORE-DRIVEN TEMPERAMENT ──────────────────────────────────────────
// An NPC's temperament (and so its starting hostility and favour, see
// getBaseHostilityForTemperament) is a weighted pick, not a coin toss. Layers:
//   1. ROLE: what they do. Keepers, priests and healers are settled and civil,
//      guards are watchful, raiders and cultists are dangerous.
//   2. SPECIES: the confirmed cultures (orcs love a fight, goblins are sneaky
//      and fear magic, lizardfolk guard territory, kobolds are timid, dragonborn
//      are proud). Realm species are left alone.
//   3. SOCIETY (second pass, once the social sheet exists): rank, status and
//      standing. A feral kobold is hostile, a bonded one is not; an orc
//      chieftain is bold, an outcast is wary; an oathless dragonborn is on edge.
//   4. ZONE: hostile areas raise the odds of hostile and aggressive for
//      everyone except staff and guards.
//   5. MOBS: skeletons are always aggressive, rats are skittish (or feral in a
//      hostile area), ghosts are on edge.
// Town keeps a small pool of troublemakers (rowdy patrons, drifters, thieves).
// Weights are relative; keys not listed count as 0.
const NPC_TEMPER_KEYS = ["friendly", "neutral", "curious", "bold", "wary", "skittish", "hostile", "aggressive"];

const NPC_ROLE_TEMPER_CLASS = {
    "Keeper of the Quiet": "staff", "Vigil Tender": "staff", "Bier Bearer": "staff",
    "Bathkeeper": "staff",
    "Innkeeper": "staff", "Bartender": "staff", "Cook": "staff", "Shopkeeper": "staff", "Vendor": "staff",
    "Wandering Merchant": "staff", "Blacksmith": "staff", "Clothier": "staff", "Healer": "staff", "Priest": "staff", "Archivist": "staff",
    "Scholar": "staff", "Enchanter": "staff", "Arcanist": "staff", "Reliquarian": "staff", "Servant": "staff",
    "Town Guard": "law", "Stone Guard": "law", "Scout": "law", "Guildmaster": "law",
    "Townsfolk": "common", "Villager": "common", "Patron": "common", "Guest": "common", "Miner": "common",
    "Pilgrim": "pilgrim",
    "Adventurer": "adventurer", "Delver": "adventurer",
    "Wanderer": "wanderer",
    "Scavenger": "scavenger",
    "Raider": "raider",
    "Cultist": "cultist",
    "Shady Merchant": "shady"
};

const NPC_TEMPER_BY_CLASS = {
    staff:      { friendly: 5, neutral: 5, curious: 2, bold: 1, wary: 1, skittish: 1, hostile: 0.1 },
    law:        { friendly: 1, neutral: 5, curious: 1, bold: 3, wary: 4, hostile: 0.3, aggressive: 0.1 },
    common:     { friendly: 3, neutral: 5, curious: 3, bold: 1, wary: 2, skittish: 1, hostile: 0.9, aggressive: 0.4 },
    pilgrim:    { friendly: 4, neutral: 4, curious: 3, wary: 2, skittish: 1, hostile: 0.1 },
    adventurer: { friendly: 2, neutral: 3, curious: 3, bold: 4, wary: 2, skittish: 0.5, hostile: 1.6, aggressive: 0.6 },
    wanderer:   { friendly: 2, neutral: 3, curious: 2, bold: 1, wary: 4, skittish: 2, hostile: 1.2, aggressive: 0.5 },
    scavenger:  { neutral: 2, wary: 4, skittish: 2, bold: 1, hostile: 2.5, aggressive: 0.6 },
    raider:     { neutral: 0.5, bold: 2, wary: 1, hostile: 5, aggressive: 5 },
    cultist:    { neutral: 1, curious: 1, bold: 1, wary: 3, hostile: 4, aggressive: 2 },
    shady:      { neutral: 3, wary: 5, skittish: 3, distrustful: 2, curious: 1, hostile: 1 }
};

// Multipliers for a species' nature. Realm species (human, elf, dwarf, halfling)
// have none: their society is the ordinary one.
const NPC_SPECIES_TEMPER_TINT = {
    orc:        { bold: 2, aggressive: 2.5, hostile: 2, friendly: 0.4, curious: 0.6 },
    goblin:     { wary: 2.5, skittish: 1.5, hostile: 1.5, friendly: 0.4, bold: 0.6 },
    lizardfolk: { wary: 2, hostile: 2, aggressive: 1.5, friendly: 0.5, curious: 0.7 },
    kobold:     { skittish: 2, wary: 1.5, friendly: 0.7, bold: 0.5 },
    dragonborn: { bold: 1.8, friendly: 0.6, skittish: 0.3, curious: 0.8 },
    catfolk:    { curious: 2, skittish: 1.2, wary: 1.2, bold: 0.8, aggressive: 0.7 },
    wolfkin:    { wary: 2, bold: 1.5, friendly: 0.6, hostile: 1.3, skittish: 0.5 },
    satyr:      { friendly: 1.8, curious: 1.8, bold: 1.5, wary: 0.5, aggressive: 0.5 },
    harefolk:   { skittish: 2, friendly: 1.5, curious: 1.3, wary: 1.2, bold: 0.5, aggressive: 0.3, hostile: 0.4 },
    ratfolk:    { wary: 2, curious: 1.5, skittish: 1.3, friendly: 0.8, bold: 0.7, hostile: 1.0 },
    kenku:      { curious: 2, wary: 1.8, skittish: 1.2, friendly: 0.7, aggressive: 0.6, hostile: 0.8 }
};

// Keyed "society:rank-or-status". `replace` is the whole weight table (used for
// everyone except staff and guards); `mult` multiplies the role's table (the
// only thing staff and guards take from their society).
const NPC_SOCIETY_TEMPER = {
    "orc-clan:chieftain":   { replace: { bold: 5, aggressive: 3, hostile: 1, neutral: 1 } },
    "orc-clan:war-leader":  { replace: { bold: 4, aggressive: 3, hostile: 2, neutral: 1 } },
    "orc-clan:champion":    { replace: { bold: 5, aggressive: 2, hostile: 1, neutral: 2 } },
    "orc-clan:warrior":     { mult: { bold: 2, aggressive: 2.5, hostile: 2, friendly: 0.4, curious: 0.6 } },
    "orc-clan:whelp":       { mult: { bold: 2.5, curious: 1.5, aggressive: 1.5, skittish: 0.5 } },
    "orc-clan:outcast":     { replace: { wary: 4, hostile: 3, skittish: 2, neutral: 2, bold: 1 } },
    "goblin-tribe:chieftain": { replace: { bold: 3, hostile: 3, aggressive: 2, wary: 2 } },
    "goblin-tribe:shaman":    { replace: { wary: 4, curious: 3, neutral: 2, hostile: 1 } },
    "goblin-tribe:boss":      { replace: { aggressive: 4, hostile: 4, bold: 3 } },
    "goblin-tribe:sneak":     { replace: { wary: 5, hostile: 3, skittish: 1, neutral: 1, curious: 1 } },
    "goblin-tribe:scrounger": { replace: { skittish: 4, wary: 4, neutral: 2, hostile: 1 } },
    "goblin-tribe:runt":      { replace: { skittish: 6, wary: 3, hostile: 1 } },
    "lizardfolk-tribe:elder":       { replace: { neutral: 4, wary: 4, bold: 1, curious: 1 } },
    "lizardfolk-tribe:hunt-leader": { replace: { hostile: 3, wary: 4, bold: 3 } },
    "lizardfolk-tribe:warden":      { replace: { hostile: 4, wary: 4, aggressive: 2 } },
    "lizardfolk-tribe:hunter":      { replace: { wary: 5, hostile: 3, neutral: 2, bold: 1 } },
    "lizardfolk-tribe:forager":     { replace: { neutral: 4, wary: 3, curious: 2, friendly: 1 } },
    "lizardfolk-tribe:hatch-tender":{ replace: { wary: 4, neutral: 3, hostile: 2, friendly: 1 } },
    "dragonborn-house:head":     { replace: { bold: 4, neutral: 3, wary: 2 } },
    "dragonborn-house:pure":     { replace: { bold: 4, neutral: 3, wary: 2, hostile: 0.5 } },
    "dragonborn-house:thin":     { replace: { neutral: 4, wary: 3, bold: 2, curious: 1 } },
    "dragonborn-house:mixed":    { replace: { neutral: 4, wary: 3, curious: 2, friendly: 1, skittish: 1 } },
    "dragonborn-house:oathless": { replace: { wary: 4, hostile: 2, bold: 2, neutral: 1 } },
    "kobold:bonded":     { replace: { wary: 4, skittish: 4, neutral: 2, curious: 1 } },
    "kobold:feral":      { replace: { hostile: 7, aggressive: 2, wary: 1 } },
    "kobold:runaway":    { replace: { skittish: 5, wary: 4, hostile: 1 } },
    "kobold:tribute":    { replace: { wary: 4, neutral: 3, skittish: 2, hostile: 1 } },
    "kobold:worshipper": { replace: { curious: 3, neutral: 3, wary: 3, bold: 1 } },
    "catfolk-troupe:troupe-elder": { replace: { neutral: 4, wary: 3, curious: 2, bold: 1 } },
    "catfolk-troupe:pathfinder":   { replace: { curious: 3, neutral: 3, bold: 2, wary: 2 } },
    "catfolk-troupe:peddler":      { replace: { friendly: 3, neutral: 3, curious: 3, wary: 1 } },
    "catfolk-troupe:nimble":       { replace: { curious: 3, neutral: 2, wary: 3, skittish: 2, hostile: 0.5 } },
    "catfolk-troupe:dreamer":      { replace: { neutral: 4, curious: 3, friendly: 2, skittish: 1 } },
    "catfolk-troupe:stray":        { replace: { wary: 4, skittish: 3, neutral: 2, hostile: 1 } },
    "harefolk-warren:warren-elder": { replace: { neutral: 4, friendly: 3, wary: 2, curious: 2, skittish: 1 } },
    "harefolk-warren:tunnel-warden": { replace: { wary: 4, neutral: 3, bold: 2, skittish: 1 } },
    "harefolk-warren:forager":     { replace: { friendly: 3, neutral: 3, curious: 2, skittish: 2, wary: 1 } },
    "harefolk-warren:runner":      { replace: { skittish: 3, curious: 3, friendly: 2, neutral: 2, wary: 1 } },
    "harefolk-warren:kit-minder":  { replace: { friendly: 4, neutral: 3, skittish: 2, wary: 1 } },
    "harefolk-warren:wanderer":    { replace: { wary: 4, skittish: 3, neutral: 2, curious: 2 } },
    "ratfolk-nest:nest-boss":      { replace: { bold: 3, neutral: 3, wary: 3, hostile: 1 } },
    "ratfolk-nest:fixer":          { replace: { curious: 3, neutral: 3, wary: 3, friendly: 1 } },
    "ratfolk-nest:scrounger":      { replace: { wary: 3, neutral: 3, curious: 3, skittish: 1, hostile: 0.5 } },
    "ratfolk-nest:tunnel-runner":  { replace: { skittish: 3, wary: 3, curious: 2, neutral: 2 } },
    "ratfolk-nest:tinker":         { replace: { curious: 4, neutral: 3, wary: 2, friendly: 1 } },
    "ratfolk-nest:outcast":        { replace: { wary: 4, hostile: 2, skittish: 2, neutral: 2 } },
    "kenku-flock:flock-caller":    { replace: { neutral: 3, wary: 3, bold: 2, curious: 2, hostile: 1 } },
    "kenku-flock:voice-keeper":    { replace: { curious: 4, neutral: 3, wary: 2, friendly: 1 } },
    "kenku-flock:trader":          { replace: { curious: 3, neutral: 3, friendly: 2, wary: 2 } },
    "kenku-flock:lookout":         { replace: { wary: 4, curious: 3, skittish: 2, neutral: 2 } },
    "kenku-flock:fledgling":       { replace: { curious: 4, skittish: 3, friendly: 2, neutral: 1 } },
    "kenku-flock:unflocked":       { replace: { wary: 4, skittish: 3, neutral: 2, hostile: 1 } },
    "wolfkin-pack:alpha":          { replace: { bold: 4, neutral: 3, wary: 3, hostile: 1 } },
    "wolfkin-pack:warden":         { replace: { wary: 4, bold: 3, neutral: 2, hostile: 2 } },
    "wolfkin-pack:hunter":         { replace: { wary: 4, bold: 3, neutral: 2, hostile: 2, aggressive: 0.5 } },
    "wolfkin-pack:scout":          { replace: { wary: 4, neutral: 3, curious: 2, hostile: 1.5, skittish: 1 } },
    "wolfkin-pack:cub-keeper":     { replace: { wary: 4, neutral: 3, friendly: 1, hostile: 2 } },
    "wolfkin-pack:lone":           { replace: { wary: 4, hostile: 3, skittish: 2, neutral: 2, aggressive: 1 } },
    "satyr-revel:master-of-revels": { replace: { friendly: 4, bold: 3, curious: 2, neutral: 1 } },
    "satyr-revel:piper":            { replace: { friendly: 3, curious: 3, neutral: 2, bold: 2 } },
    "satyr-revel:cup-bearer":       { replace: { friendly: 4, curious: 3, neutral: 2 } },
    "satyr-revel:troublemaker":     { replace: { curious: 3, bold: 3, friendly: 2, neutral: 2, hostile: 1.2, aggressive: 0.3 } },
    "satyr-revel:reveller":         { replace: { friendly: 4, curious: 3, neutral: 2, bold: 1 } },
    "satyr-revel:sulker":           { replace: { wary: 3, neutral: 3, hostile: 2, skittish: 1 } },
    "realm:noble":       { replace: { neutral: 4, bold: 3, wary: 2, friendly: 1, curious: 1 } }
};

// Zone pressure on everyone who is not staff or a guard.
const NPC_HOSTILE_ZONE_TEMPER_MULT = { hostile: 2.5, aggressive: 3, wary: 1.4, friendly: 0.5, curious: 0.8 };

// The society key for an NPC's social sheet, or "" when none applies.
function getNPCSocietyTemperKey(npc) {
    const s = npc && npc.social;
    if (!s || !s.society) return "";
    let key = "";
    if (s.society === "kobold") key = s.status ? "kobold:" + s.status : "";
    else if (s.society === "realm") key = s.caste === "noble" ? "realm:noble" : "";
    else key = s.rankKey ? s.society + ":" + s.rankKey : "";
    return NPC_SOCIETY_TEMPER[key] ? key : "";
}

function _npcTemperScale(weights, mult) {
    Object.keys(mult).forEach(function (k) {
        if (typeof weights[k] === "number") weights[k] *= mult[k];
    });
}

// A weighted temperament for an NPC-like object: { species, isHumanoid, role,
// social? }. Pass the room and zone template for the zone layer.
function getLoreTemperament(npc, room, zoneTemplate) {
    const hostileArea = !!(zoneTemplate && zoneTemplate.hostileArea);
    const species = String((npc && npc.species) || "").toLowerCase();
    let w;
    if (npc && npc.isHumanoid === false) {
        if (species === "skeleton") return "aggressive";
        if (species === "rat") w = hostileArea ? { aggressive: 5, hostile: 3, wary: 2, skittish: 2 } : { skittish: 5, wary: 3, aggressive: 1 };
        else if (species === "ghost") w = { hostile: 4, aggressive: 3, wary: 3, skittish: 1 };
        else if (species === "slime") w = { aggressive: 6, hostile: 3, neutral: 1 };
        else w = hostileArea ? { aggressive: 6, hostile: 3, wary: 1 } : { wary: 4, skittish: 3, neutral: 2, curious: 1, hostile: 0.5 };
    } else {
        const cls = NPC_ROLE_TEMPER_CLASS[String((npc && npc.role) || "")] || "common";
        const protectedRole = cls === "staff" || cls === "law";
        w = Object.assign({}, NPC_TEMPER_BY_CLASS[cls]);
        const key = getNPCSocietyTemperKey(npc);
        const entry = key ? NPC_SOCIETY_TEMPER[key] : null;
        if (entry && entry.replace && !protectedRole) {
            w = Object.assign({}, entry.replace);
        } else if (entry && entry.mult) {
            _npcTemperScale(w, entry.mult);
        } else if (NPC_SPECIES_TEMPER_TINT[species]) {
            _npcTemperScale(w, NPC_SPECIES_TEMPER_TINT[species]);
        }
        if (hostileArea && !protectedRole) _npcTemperScale(w, NPC_HOSTILE_ZONE_TEMPER_MULT);
    }
    let total = 0;
    NPC_TEMPER_KEYS.forEach(function (k) { total += w[k] || 0; });
    if (total <= 0) return "neutral";
    let roll = Math.random() * total;
    for (let i = 0; i < NPC_TEMPER_KEYS.length; i++) {
        roll -= w[NPC_TEMPER_KEYS[i]] || 0;
        if (roll < 0) return NPC_TEMPER_KEYS[i];
    }
    return "neutral";
}
if (typeof window !== "undefined") {
    window.getLoreTemperament = getLoreTemperament;
    window.getNPCSocietyTemperKey = getNPCSocietyTemperKey;
}

// ── GIVEN NAMES ─────────────────────────────────────────────────────
// Every NPC is named at creation (npc.givenName) but the player does not
// know it yet: npc.name stays the descriptor ("a female Elf") until the name
// is learned (asked, or revealNPCName called), at which point npc.name
// becomes the given name and the descriptor is kept in npc.descriptorName.
const NPC_GIVEN_NAME_POOLS = {
    Human: {
        male: ["Aldric", "Bram", "Corwin", "Dunstan", "Edmund", "Garrick", "Hale", "Osric", "Tobias", "Wystan", "Marcus", "Perrin"],
        female: ["Adela", "Brenna", "Cecily", "Edda", "Isolde", "Maren", "Nessa", "Rowena", "Tamsin", "Wilma", "Lyra", "Hester"],
        surnames: ["Thatcher", "Marsh", "Fletcher", "Holloway", "Crane", "Ashby", "Penn", "Redd"]
    },
    Elf: {
        male: ["Aelar", "Caelith", "Erevan", "Faelen", "Ilyan", "Lorien", "Sylvar", "Thalion", "Varis"],
        female: ["Aelira", "Caelyn", "Elowen", "Ilaria", "Liriel", "Nyssa", "Sariel", "Thessaly", "Vaelis"]
    },
    Dwarf: {
        male: ["Baldrek", "Dorin", "Gorm", "Hargrim", "Korgan", "Thrain", "Orsik", "Brogar", "Dural"],
        female: ["Bruna", "Dagny", "Gunnhild", "Helga", "Kathra", "Morda", "Sigrun", "Torvi", "Vilma"],
        surnames: ["Ironbrow", "Stonefist", "Deepdelver", "Coalbeard", "Anvilhand", "Rockbiter"]
    },
    Halfling: {
        male: ["Perry", "Milo", "Garret", "Finnan", "Cade", "Osborn", "Wendel", "Tolly"],
        female: ["Rosie", "Lidda", "Merry", "Poppy", "Sunny", "Tilda", "Wren", "Bessie"],
        surnames: ["Goodbarrel", "Brushgather", "Underbough", "Tealeaf", "Greenbottle"]
    },
    Dragonborn: {
        male: ["Arjhan", "Balasar", "Donaar", "Kriv", "Medrash", "Torinn", "Rhogar"],
        female: ["Akra", "Biri", "Daar", "Harann", "Kava", "Sora", "Thava", "Nala"]
    },
    Goblin: {
        any: ["Snik", "Grizzle", "Nob", "Krag", "Mizzit", "Zug", "Blotch", "Skritch", "Wazzle", "Pogg"]
    },
    Orc: {
        male: ["Grukk", "Dorag", "Mogrash", "Thokk", "Urzul", "Vargo", "Kargath"],
        female: ["Baggi", "Shagra", "Ulgra", "Yagra", "Mogra", "Volen", "Draka"]
    },
    Skeleton: {
        any: ["Old Marrow", "Rattle", "Tibia", "Clavicus", "Grim", "Femur", "Sorrel", "Brittle", "Oswin"]
    },
    Rat: {
        any: ["Nibbles", "Whisker", "Scratch", "Gnaw", "Squeak", "Mange", "Tatter"]
    },
    Ghost: {
        any: ["Edith", "Alaric", "Mourne", "Veyra", "Cormac", "Isabeau", "Hollis", "Wren"]
    },
    Lizardfolk: {
        any: ["Ssaren", "Thessik", "Kuruss", "Vessa", "Zhiss", "Rasskel", "Ixtli", "Sethra"]
    },
    Kobold: {
        any: ["Yip", "Dink", "Rik", "Skrib", "Tamp", "Zik", "Nubb", "Pip"]
    },
    Catfolk: {
        male: ["Tamsin", "Rurrik", "Sable", "Mirro", "Jinx", "Brindle", "Cassel", "Fenn"],
        female: ["Mirri", "Saffra", "Nyla", "Tabbi", "Velvet", "Ember", "Pallo", "Sorrel"],
        surnames: ["Quietpaw", "Softstep", "Lanternfoot", "Silkwhisker", "Duskpelt"]
    },
    Wolfkin: {
        male: ["Garrok", "Fenrik", "Rurik", "Vask", "Haldor", "Torgrim", "Kael", "Brannoch"],
        female: ["Varra", "Skadi", "Lyssa", "Ysolt", "Hedra", "Maera", "Torva", "Kaida"],
        surnames: ["Greyfang", "Ashmane", "Ridgehowl", "Frostpaw", "Stonetrail"]
    },
    Satyr: {
        male: ["Pip", "Bromius", "Tivo", "Corin", "Lyssander", "Merrick", "Dorrin", "Fennick"],
        female: ["Thessa", "Melia", "Daphnis", "Lilla", "Rosalind", "Vinia", "Calla", "Ione"],
        surnames: ["Goatsong", "Reedpipe", "Wineleaf", "Crookhorn", "Hoofbeat"]
    },
    Harefolk: {
        male: ["Bracken", "Tuck", "Hob", "Thistle", "Wick", "Dandy", "Barley", "Burdock"],
        female: ["Clover", "Pimpernel", "Hazel", "Bryony", "Tansy", "Meadow", "Willa", "Primrose"],
        surnames: ["Longear", "Quickfoot", "Thistledown", "Burrowdeep", "Cloverfield"]
    },
    Ratfolk: {
        male: ["Scratch", "Nibb", "Grub", "Tack", "Sniv", "Cog", "Rasp", "Pinch"],
        female: ["Mags", "Nettle", "Dross", "Sootie", "Biddy", "Ratch", "Lint", "Mothe"],
        surnames: ["Gutterling", "Pennyscrape", "Gnawbone", "Cinderdrain", "Lowlamp"]
    },
    Kenku: {
        any: ["Clack", "Tink", "Creak", "Krik", "Rattle", "Hinge", "Clatter", "Chime", "Scrawk", "Latch", "Bell", "Tap"]
    },
    Slime: {
        any: ["Blob", "Gloop", "Ooze", "Squelch", "Glob", "Drip"]
    },
};

function generateNPCGivenName(species, gender) {
    const pool = NPC_GIVEN_NAME_POOLS[species] || NPC_GIVEN_NAME_POOLS[String(species || "")];
    if (!pool) return "Stranger";
    var list = null;
    if (gender === "male" && pool.male) list = pool.male;
    else if (gender === "female" && pool.female) list = pool.female;
    else if (pool.any) list = pool.any;
    else list = (pool.male || []).concat(pool.female || []);
    if (!list.length) return "Stranger";
    var name = list[Math.floor(Math.random() * list.length)];
    if (pool.surnames && Math.random() < 0.5) {
        name += " " + pool.surnames[Math.floor(Math.random() * pool.surnames.length)];
    }
    return name;
}

// Gives the NPC a hidden given name if it has none (new NPCs and old saves).
function ensureNPCGivenName(npc) {
    if (!npc || npc.givenName) return npc;
    if (npc.dead || npc.objectType === "body") return npc;
    npc.descriptorName = npc.descriptorName || npc.name || "";
    npc.givenName = generateNPCGivenName(npc.species, npc.gender);
    if (!npc.memory) npc.memory = {};
    if (typeof npc.memory.nameKnown !== "boolean") npc.memory.nameKnown = false;
    return npc;
}

function npcNameIsKnown(npc) {
    return !!(npc && npc.memory && npc.memory.nameKnown === true);
}

// What the NPC calls itself - used in prompts. Always the real name.
function getNPCSelfName(npc) {
    if (!npc) return "someone";
    return npc.givenName || npc.name || "someone";
}

// Player learns the name: the displayed name switches from the descriptor to
// the given name everywhere (chat labels, narration, story events).
function revealNPCName(npc) {
    if (!npc) return npc;
    ensureNPCGivenName(npc);
    if (!npc.givenName) return npc;
    if (!npc.memory) npc.memory = {};
    npc.memory.nameKnown = true;
    npc.descriptorName = npc.descriptorName || npc.name || "";
    npc.name = (npc.boss && npc.boss.epithet) ? npc.givenName + " " + npc.boss.epithet : npc.givenName;
    return npc;
}

function ensureNPCRelationshipState(npc) {
    if (!npc) return npc;

    npc.memory = npc.memory || {};
    if (typeof npc.memory.nameKnown !== "boolean") npc.memory.nameKnown = false;
    ensureNPCGivenName(npc);
    if (!Array.isArray(npc.memory.playerActions)) npc.memory.playerActions = [];
    if (!Array.isArray(npc.memory.playerActionTags)) npc.memory.playerActionTags = [];
    if (!Array.isArray(npc.memory.recentLines)) npc.memory.recentLines = [];
    if (!Array.isArray(npc.memory.memoryEntries)) npc.memory.memoryEntries = [];
    if (typeof npc.memory.metPlayer !== "boolean") npc.memory.metPlayer = false;
    if (typeof npc.memory.aggressionCount !== "number") npc.memory.aggressionCount = 0;
    if (typeof npc.memory.lastSpokenTo !== "number") npc.memory.lastSpokenTo = 0;

    if (typeof npc.hostility !== "number") {
        npc.hostility = getBaseHostilityForTemperament(npc.temperament);
    }

    if (typeof npc.memory.favorability !== "number") {
        npc.memory.favorability = getBaseFavorabilityForTemperament(npc.temperament);
    }

    if (!npc.memory.lastMood) npc.memory.lastMood = "neutral";
    if (typeof npc.memory.attraction !== "number") npc.memory.attraction = 0;
    if (typeof npc.memory.lust !== "number") npc.memory.lust = 0;
    if (typeof npc.memory.arousal !== "number") npc.memory.arousal = 0;
    if (typeof npc.memory.disinhibition !== "number") npc.memory.disinhibition = 0;
    if (!npc.memory.actDisinhibition || typeof npc.memory.actDisinhibition !== "object") {
        npc.memory.actDisinhibition = {};
    }
    Object.keys(npc.memory.actDisinhibition).forEach(function (actKey) {
        var v = npc.memory.actDisinhibition[actKey];
        if (typeof v !== "number" || isNaN(v)) v = 0;
        npc.memory.actDisinhibition[actKey] = Math.max(0, Math.min(100, Math.round(v)));
    });

    npc.hostility = Math.max(0, Math.min(100, Math.round(npc.hostility)));
    npc.memory.favorability = Math.max(-100, Math.min(100, Math.round(npc.memory.favorability)));
    npc.memory.attraction = Math.max(0, Math.min(100, Math.round(npc.memory.attraction)));
    npc.memory.arousal = Math.max(0, Math.min(100, Math.round(npc.memory.arousal)));
    npc.memory.disinhibition = Math.max(0, Math.min(100, Math.round(npc.memory.disinhibition)));

    if (!isAdultHumanoidNPC(npc)) {
        npc.memory.attraction = 0;
        npc.memory.arousal = 0;
        npc.memory.disinhibition = 0;
        npc.memory.actDisinhibition = {};
    }

    // Fold the legacy NSFW-side npc.relationship.* pool into memory.* once.
    migrateNPCRelationshipPool(npc);

    return npc;
}

function isAdultHumanoidNPC(npc) {
    return !!(
        npc &&
        npc.isHumanoid === true &&
        typeof npc.age === "number" &&
        npc.age >= 18
    );
}

// -- STAT POOL MERGE + ATTRACTION RECOMPUTE -----------------------------------
// Historically the SFW engine tracked romance stats on npc.memory.* while the
// NSFW system tracked them on npc.relationship.* — and the condition reader
// preferred relationship.*, which masked every SFW gain (first impression,
// compliments, charm) once the NSFW system had initialized an NPC. The pools
// are now merged: memory.* is the single source of truth, relationship.* is a
// legacy object that nothing reads or writes anymore.

// One-time merge of the old NSFW pool into the memory pool (sum — each side
// only accumulated from its own sources). Also seeds attractionEarned from
// whatever attraction history exists above the currently computed base, so
// the next recompute preserves it.
function migrateNPCRelationshipPool(npc) {
    if (!npc) return npc;
    const memory = npc.memory = npc.memory || {};
    if (memory._relationshipPoolMerged) return npc;
    memory._relationshipPoolMerged = true;

    const rel = npc.relationship;
    const relAttraction = (rel && typeof rel.attraction === "number") ? rel.attraction : 0;
    const relLust = (rel && typeof rel.lust === "number") ? rel.lust : 0;
    const relOrientation = (rel && rel.orientation) ? String(rel.orientation) : "";

    if (typeof memory.attraction !== "number") memory.attraction = 0;
    if (typeof memory.lust !== "number") memory.lust = 0;
    memory.attraction = Math.max(0, Math.min(100, memory.attraction + relAttraction));
    memory.lust = Math.max(0, Math.min(100, memory.lust + relLust));

    ensureNPCOrientation(npc);
    if (relOrientation && !memory.orientation) memory.orientation = relOrientation;

    // Seed earned from whatever attraction history exists above the computed
    // base — but never overwrite an existing earned history (e.g. a save that
    // already tracks it).
    if (typeof memory.attractionEarned !== "number") {
        memory.attractionEarned = Math.max(0, memory.attraction - computeNPCAttractionBase(npc));
    }
    return npc;
}

// Sexual orientation: seeded deterministically from the NPC's id so it is
// stable across saves and sessions (~70% straight / 20% bi / 10% gay).
function ensureNPCOrientation(npc) {
    if (!npc) return "bi";
    const memory = npc.memory = npc.memory || {};
    if (memory.orientation) return memory.orientation;
    const seedSource = String(npc.id || npc.name || npc.type || "npc");
    let hash = 0;
    for (let i = 0; i < seedSource.length; i++) {
        hash = (hash * 31 + seedSource.charCodeAt(i)) >>> 0;
    }
    const roll = hash % 100;
    memory.orientation = roll < 70 ? "straight" : (roll < 90 ? "bi" : "gay");
    return memory.orientation;
}

// Orientation mismatch is a heavy penalty on the computed base, not a block:
// flirts and other actions still earn attraction on top (see design notes).
const NPC_ORIENTATION_MISMATCH_FACTOR = 0.25;

function _npcGetOrientationFactor(npc) {
    const orientation = String(ensureNPCOrientation(npc) || "bi").toLowerCase();
    if (orientation === "bi") return 1;
    const npcGender = String(npc.gender || "").toLowerCase();
    const playerGender = (typeof G === "object" && G && G.player && G.player.stats && G.player.stats.gender)
        ? String(G.player.stats.gender).toLowerCase()
        : "male";
    const npcLikes = orientation === "straight"
        ? (npcGender === "female" ? "male" : "female")
        : (npcGender === "female" ? "female" : "male");
    return npcLikes === playerGender ? 1 : NPC_ORIENTATION_MISMATCH_FACTOR;
}

// The computed half of attraction: live Charisma (gear, hygiene and potions
// included via getSetupStat), type match, orientation, and — when the player
// is unclothed — a situational term. Re-derived on every interaction start
// so equipping better clothes or cleaning up shifts it.

// Unclothed term: the player wearing nothing registers with the NPC either
// as enticing or as off-putting. It is only a POSITIVE contribution when the
// NPC has enough disinhibition, matches the player's type, matches their
// orientation, and the player's Charisma is above a floor; otherwise it is
// a small penalty (embarrassment/discomfort).
const NPC_UNCLOTHED_BONUS = 8;
const NPC_UNCLOTHED_PENALTY = 5;
const NPC_UNCLOTHED_MIN_DISINHIBITION = 20;
const NPC_UNCLOTHED_MIN_CHARISMA = 5;

// Player unclothed = no top AND no bottom coverage, using the same slot
// mapping as getClothingStateForCharacter in the intimacy system
// (upper/head/chest = top, lower/feet/legs = bottom).
function _npcIsPlayerUnclothed() {
    const player = (typeof G === "object" && G && G.player) ? G.player : null;
    if (!player || !player.equipped) return false;
    const eq = player.equipped;
    const hasTop = !!(eq.upper || eq.head || eq.chest);
    const hasBottom = !!(eq.lower || eq.feet || eq.legs);
    return !hasTop && !hasBottom;
}

function _npcGetUnclothedAttractionTerm(npc, charisma) {
    if (!_npcIsPlayerUnclothed()) return 0;
    const disinhibition = npc.memory && typeof npc.memory.disinhibition === "number"
        ? npc.memory.disinhibition : 0;
    const typeMatch = typeof getNPCTypeMatchScore === "function" ? getNPCTypeMatchScore(npc) : 0;
    const orientationMatch = _npcGetOrientationFactor(npc) === 1;
    const receptive = disinhibition >= NPC_UNCLOTHED_MIN_DISINHIBITION &&
        typeMatch > 0 &&
        orientationMatch &&
        charisma >= NPC_UNCLOTHED_MIN_CHARISMA;
    return receptive ? NPC_UNCLOTHED_BONUS : -NPC_UNCLOTHED_PENALTY;
}

function computeNPCAttractionBase(npc) {
    if (!isAdultHumanoidNPC(npc)) return 0;
    const hostility = typeof npc.hostility === "number" ? npc.hostility : 0;
    if (hostility >= NPC_FIRST_IMPRESSION.hostilityCutoff) return 0;
    const charisma = typeof getSetupStat === "function" ? getSetupStat("charisma", 3) : 3;
    const typeScore = typeof getNPCTypeMatchScore === "function" ? getNPCTypeMatchScore(npc) : 0;
    const orientationFactor = _npcGetOrientationFactor(npc);
    const raw = NPC_FIRST_IMPRESSION.base +
        (typeScore * NPC_FIRST_IMPRESSION.perMatchPoint * orientationFactor) +
        ((charisma - 3) * NPC_FIRST_IMPRESSION.perCharisma);
    const capped = Math.max(0, Math.min(NPC_FIRST_IMPRESSION.max, Math.round(raw)));
    // Situational unclothed term rides on top of the capped base (a naked
    // charmer can exceed the normal first-impression ceiling).
    return capped + _npcGetUnclothedAttractionTerm(npc, charisma);
}

// -- NUDITY REACTIONS (walking into a populated room unclothed) ----------
// The engine's applyNudityReaction runs this per NPC on room entry. An NPC
// whose "type" the player matches exactly (with a compatible orientation)
// is intrigued instead of offended: attraction and lust rise, and a
// sufficiently disinhibited one may call out something appreciative.
// Everyone else civilized bristles — public indecency costs favor and
// earns hostility. Uncivilized humanoids skip the offense (they don't
// care about indecency) unless they match the player's type, in which case
// the intrigued branch above still applies.

const NUDITY_EXACT_MATCH_SCORE = 1.5;   // both type prefs line up
const NUDITY_OFFENDED_HOSTILITY = 7;
const NUDITY_OFFENDED_FAVOR = -3;
const NUDITY_INTRIGUED_ATTRACTION = 4;
const NUDITY_INTRIGUED_LUST = 3;
const NUDITY_CATCALL_MIN_DISINHIBITION = 30;

function _npcPickLine(arr) {
    if (!Array.isArray(arr) || !arr.length) return "";
    return arr[Math.floor(Math.random() * arr.length)];
}

function _npcNudityOffendedLines() {
    return [
        "gasps and looks away, scandalized",
        "splutters, \"Have you no shame?\"",
        "chokes on their drink, staring",
        "mutters, \"For mercy's sake, put something on!\"",
        "raises a hand to shield their eyes",
        "bristles, \"Not in here! Out with you!\""
    ];
}

function _npcNudityFlusteredLines() {
    return [
        "quietly averts their eyes, ears burning",
        "goes very red and studies the floor",
        "coughs and pretends nothing is out of the ordinary"
    ];
}

function _npcNudityCatcallLines(npc) {
    var temperament = String((npc && npc.temperament) || "").toLowerCase();
    var bold = temperament === "bold" || temperament === "forward" ||
        temperament === "lustful" || temperament === "dominant";
    return bold ? [
        "\"Well now — not much left to the imagination, is there?\"",
        "\"Now THAT'S a sight. Careful, you'll cause a scene.\"",
        "\"Looking for attention? Consider it gotten.\"",
        "\"Gods above — you could stop traffic dressed like that. Or not dressed.\""
    ] : [
        "\"I, um — wow. You look... wow.\"",
        "\"You're, uh... really not shy, are you?\"",
        "\"That's... quite the entrance you just made.\""
    ];
}

// One NPC's reaction to the unclothed player entering. Returns
// { stance: "intrigued" | "offended" | "flustered", catcall, line } or null
// when this NPC doesn't react. Stat changes are applied here so the engine
// hook stays a thin narration assembler.
function getNudityReactionForNPC(npc) {
    if (!npc || !isAdultHumanoidNPC(npc)) return null;
    if (!_npcIsPlayerUnclothed()) return null;
    ensureNPCRelationshipState(npc);

    const typeScore = getNPCTypeMatchScore(npc);
    const orientationMatch = _npcGetOrientationFactor(npc) === 1;

    // Exact type match with a compatible orientation: intrigued, not
    // offended — attraction and lust rise, scaled by the player's appeal.
    if (typeScore >= NUDITY_EXACT_MATCH_SCORE && orientationMatch) {
        const appeal = getPlayerAppealMultiplier(npc);
        const attractionGain = Math.max(1, Math.round(NUDITY_INTRIGUED_ATTRACTION * appeal));
        npc.memory.attractionEarned = (typeof npc.memory.attractionEarned === "number" ? npc.memory.attractionEarned : 0) + attractionGain;
        npc.memory.attraction = Math.max(0, Math.min(100, (npc.memory.attraction || 0) + attractionGain));
        npc.memory.lust = Math.max(0, Math.min(100, (npc.memory.lust || 0) + NUDITY_INTRIGUED_LUST));
        const disinhibition = typeof npc.memory.disinhibition === "number" ? npc.memory.disinhibition : 0;
        const willCatcall = disinhibition >= NUDITY_CATCALL_MIN_DISINHIBITION;
        if (willCatcall && typeof rememberStoryEvent === "function") {
            rememberStoryEvent("social", `${npc.name || "Someone"} cat-called ${G.player.name} on sight for walking in unclothed.`, 3);
        }
        return {
            stance: "intrigued",
            catcall: willCatcall,
            line: willCatcall ? _npcPickLine(_npcNudityCatcallLines(npc)) : null
        };
    }

    // Uncivilized creatures don't care about public indecency.
    const civilized = typeof getSpeciesIsCivilized === "function" ? getSpeciesIsCivilized(npc.species) : true;
    if (!civilized) return null;

    // Most civilized onlookers take offense; a few just fluster.
    if (Math.random() < 0.8) {
        npc.hostility = Math.max(0, Math.min(100, (npc.hostility || 0) + NUDITY_OFFENDED_HOSTILITY));
        npc.memory.favorability = Math.max(-100, Math.min(100, (npc.memory.favorability || 0) + NUDITY_OFFENDED_FAVOR));
        return { stance: "offended", catcall: false, line: _npcPickLine(_npcNudityOffendedLines()) };
    }
    return { stance: "flustered", catcall: false, line: _npcPickLine(_npcNudityFlusteredLines()) };
}

// Fresh per-engagement variance, rolled every time the player clicks the
// NPC: a d20 (the engine's own dice when available) mapped to roughly
// -4..+5, plus the NPC's current mood on the engine mood scale (-3..+3,
// furious to affectionate). Represents how receptive they happen to feel
// right now; the deterministic base and the earned history are unchanged.
function _npcRollEngagementSwing(npc) {
    let roll;
    if (typeof G === "object" && G && typeof rollD20 === "function") {
        roll = rollD20(G.player);
    } else {
        roll = 1 + Math.floor(Math.random() * 20);
    }
    let moodMod = 0;
    const mood = String((npc.memory && npc.memory.lastMood) || "neutral").toLowerCase();
    if (typeof getMoodScale === "function") {
        const scale = getMoodScale();
        const idx = scale.indexOf(mood);
        if (idx >= 0) moodMod = idx - 3;
    }
    return Math.round((roll - 10) / 2) + moodMod;
}

// Recompute attraction at interaction start: attraction = computed base +
// action-earned history + a fresh engagement swing. Run from selectNPC in
// the engine.
function recomputeNPCAttraction(npc) {
    if (!npc || !isAdultHumanoidNPC(npc)) return npc;
    migrateNPCRelationshipPool(npc);
    const memory = npc.memory;
    if (typeof memory.attractionEarned !== "number") memory.attractionEarned = 0;
    const base = computeNPCAttractionBase(npc);
    // A hostile NPC (base 0) gets no swing - a lucky roll must not warm
    // someone up who currently can't stand the player.
    const swing = base > 0 ? _npcRollEngagementSwing(npc) : 0;
    memory.attractionSwing = swing;
    memory.attraction = Math.max(0, Math.min(100, base + memory.attractionEarned + swing));
    return npc;
}

// -- NPC "TYPE" (who an NPC is drawn to) -----------------------------------
// Each adult humanoid NPC gets two stable preferences ("type") drawn from
// things the game actually knows about the player: dominant personality
// trait, outward bearing (stat impression), presentation (clothing/hygiene),
// and the build/hair/eyes picked at character creation. How well the player
// matches scales how much attraction their actions earn (see
// getPlayerAppealMultiplier, applied in applyNPCRelationshipImpact) - a match
// helps, a mismatch dampens, and the player's Charisma softens mismatches and
// slightly boosts matches. It never blocks anything outright and never makes
// attraction negative on its own. Cosmetic/SFW only: it is a multiplier on
// existing attraction gains, not new content.
const NPC_TYPE_AXES = ["trait", "bearing", "presentation", "build", "hairColor", "hairStyle", "eyeColor"];
const NPC_TYPE_TRAIT_VALUES = ["curiosity", "empathy", "boldness"];
const NPC_TYPE_BEARING_STAT = { imposing: "physicalProwess", nimble: "flexibility", steady: "willpower", hardy: "endurance" };
const NPC_TYPE_PRESENTATION_VALUES = ["polished", "unfussy"];
// Mirrors the character-creation <select> options in cyoaftw-engine-CORE.html.
const NPC_TYPE_PHYSICAL_VALUES = {
    build: ["lean", "athletic", "sturdy", "broad", "soft", "slight"],
    hairColor: ["black", "dark brown", "brown", "auburn", "red", "blond", "gray", "white"],
    hairStyle: ["cropped", "short", "loose", "long", "braided", "tied back", "curly", "messy"],
    eyeColor: ["brown", "hazel", "green", "blue", "gray", "amber"]
};
const NPC_TYPE_SCORE_STEP = 0.15;       // multiplier change per point of match score
const NPC_TYPE_MULTIPLIER_MIN = 0.6;
const NPC_TYPE_MULTIPLIER_MAX = 1.4;
const NPC_TYPE_CHARISMA_SOFTEN_PER_POINT = 0.1;  // mismatch reduction per CHA above 3
const NPC_TYPE_CHARISMA_SOFTEN_MAX = 0.6;
const NPC_TYPE_CHARISMA_BOOST_PER_POINT = 0.05;  // match boost per CHA above 3
const NPC_TYPE_CHARISMA_BOOST_MAX = 0.5;

function _npcTypeHash(text) {
    var h = 2166136261;
    var str = String(text || "");
    for (var i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

// Small seeded PRNG (mulberry32) so an NPC's type is stable across saves and
// visits without needing to be rolled at creation time.
function _npcTypeRng(seed) {
    var a = seed >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        var t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function _npcTypePick(list, rng) {
    return list[Math.floor(rng() * list.length) % list.length];
}

function _npcTypeValuesForAxis(axis, rng) {
    if (axis === "trait") return [_npcTypePick(NPC_TYPE_TRAIT_VALUES, rng)];
    if (axis === "bearing") return [_npcTypePick(Object.keys(NPC_TYPE_BEARING_STAT), rng)];
    if (axis === "presentation") return [_npcTypePick(NPC_TYPE_PRESENTATION_VALUES, rng)];
    var pool = NPC_TYPE_PHYSICAL_VALUES[axis].slice();
    var first = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    var second = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    return [first, second];
}

// A personality-driven lead preference: archetype first, then role, then
// temperament. Returns an axis/value or null (then the lead is random).
function _npcTypeLeadHint(npc, rng) {
    var archetype = String(npc.archetype || "").toLowerCase();
    var role = String(npc.role || "").toLowerCase();
    var temperament = String(npc.temperament || "").toLowerCase();
    var archetypeHints = {
        hero: { axis: "trait", values: ["boldness"] },
        destroyer: { axis: "trait", values: ["boldness"] },
        scoundrel: { axis: "trait", values: ["boldness"] },
        trickster: { axis: "trait", values: ["boldness"] },
        sage: { axis: "trait", values: ["curiosity"] },
        explorer: { axis: "trait", values: ["curiosity"] },
        caretaker: { axis: "trait", values: ["empathy"] },
        romantic: { axis: "trait", values: ["empathy"] },
        martyr: { axis: "trait", values: ["empathy"] },
        guardian: { axis: "bearing", values: ["steady"] },
        schemer: { axis: "presentation", values: ["polished"] }
    };
    if (archetypeHints[archetype]) return archetypeHints[archetype];

    var roleHints = [
        { words: ["scholar", "sage", "mage", "wizard", "alchemist", "scribe", "librarian"], axis: "trait", values: ["curiosity"] },
        { words: ["healer", "priest", "cleric", "herbalist", "innkeeper", "bartender"], axis: "trait", values: ["empathy"] },
        { words: ["guard", "soldier", "mercenary", "raider", "bandit", "hunter", "scout", "blacksmith", "miner"], axis: "bearing", values: [_npcTypePick(["imposing", "steady", "hardy", "nimble"], rng)] }
    ];
    for (var i = 0; i < roleHints.length; i++) {
        var hint = roleHints[i];
        if (hint.words.some(function (word) { return role.indexOf(word) !== -1; })) return hint;
    }

    var temperamentHints = {
        bold: { axis: "trait", values: ["boldness"] },
        aggressive: { axis: "trait", values: ["boldness"] },
        curious: { axis: "trait", values: ["curiosity"] },
        friendly: { axis: "trait", values: ["empathy"] },
        calm: { axis: "bearing", values: ["steady"] }
    };
    return temperamentHints[temperament] || null;
}

// Lazily seeds npc.typePrefs (so existing saves and already-spawned NPCs get
// a type too). Two preferences on different axes; stable per NPC.
function ensureNPCTypePreferences(npc) {
    if (!npc) return [];
    if (Array.isArray(npc.typePrefs)) return npc.typePrefs;

    var rng = _npcTypeRng(_npcTypeHash((npc.id || "") + "|" + (npc.name || "") + "|" + (npc.role || "")));
    var prefs = [];
    var lead = _npcTypeLeadHint(npc, rng);
    if (lead) {
        prefs.push({ axis: lead.axis, values: lead.values.slice() });
    } else {
        var leadAxis = _npcTypePick(NPC_TYPE_AXES, rng);
        prefs.push({ axis: leadAxis, values: _npcTypeValuesForAxis(leadAxis, rng) });
    }
    var remaining = NPC_TYPE_AXES.filter(function (axis) { return axis !== prefs[0].axis; });
    var secondAxis = _npcTypePick(remaining, rng);
    prefs.push({ axis: secondAxis, values: _npcTypeValuesForAxis(secondAxis, rng) });

    npc.typePrefs = prefs;
    return prefs;
}

// What the game knows about the player right now, for matching. Every source
// is typeof-guarded so this file keeps working before the engine payload
// exposes its helpers.
function _npcGetPlayerTypeProfile() {
    var trait = "";
    if (typeof getPlayerDominantTrait === "function") {
        trait = String(getPlayerDominantTrait() || "").toLowerCase();
        if (trait && typeof getPlayerTraitValue === "function" && getPlayerTraitValue(trait) < 2) trait = "";
    }
    return {
        trait: trait,
        stats: _npcGetPlayerStats(),
        presentation: typeof getPlayerPresentationScore === "function" ? getPlayerPresentationScore() : 0,
        appearance: typeof getPlayerAppearance === "function" ? getPlayerAppearance() : null
    };
}

// +1 match, 0 neutral, negative for a clear mismatch (see per-axis notes).
function _npcEvaluateTypePref(pref, profile) {
    if (!pref || !profile) return 0;
    var values = Array.isArray(pref.values) ? pref.values : [];
    if (pref.axis === "trait") {
        if (!profile.trait) return 0;
        return values.indexOf(profile.trait) !== -1 ? 1 : -0.5;
    }
    if (pref.axis === "bearing") {
        var statKey = NPC_TYPE_BEARING_STAT[values[0]];
        var statValue = statKey && typeof profile.stats[statKey] === "number" ? profile.stats[statKey] : 3;
        if (statValue >= 5) return 1;
        if (statValue <= 2) return -1;
        return 0;
    }
    if (pref.axis === "presentation") {
        if (values[0] === "polished") {
            if (profile.presentation >= 2) return 1;
            if (profile.presentation < 0) return -1;
            return 0;
        }
        // "unfussy": at ease with plain, practical looks; put off by overdone ones.
        if (profile.presentation >= 5) return -0.5;
        if (profile.presentation >= -1 && profile.presentation <= 1) return 0.5;
        return 0;
    }
    var appearance = profile.appearance;
    if (!appearance || typeof appearance[pref.axis] !== "string") return 0;
    if (values.indexOf(appearance[pref.axis]) !== -1) return 1;
    // Fur, mane and species build words (ginger, silver, lithe, rangy...) are
    // read as their nearest human-pool word; a word with no near match is
    // neutral, never a mismatch.
    var near = _npcNearTypeValue(pref.axis, appearance[pref.axis]);
    var pool = NPC_TYPE_PHYSICAL_VALUES[pref.axis] || [];
    if (near === null) return pool.indexOf(appearance[pref.axis]) !== -1 ? -0.5 : 0;
    return values.indexOf(near) !== -1 ? 1 : -0.5;
}

var NPC_TYPE_NEAR_WORDS = {
    hairColor: { ginger: "red", russet: "red", copper: "red", auburn: "auburn", cream: "blond", tawny: "blond", straw: "blond", golden: "blond", silver: "gray", grey: "gray", "silver-grey": "gray", "dark grey": "gray", "timber-grey": "gray", ash: "gray", "tabby brown": "brown", chestnut: "brown", tan: "brown", dark: "black", "dark brown": "dark brown" },
    build: { lithe: "slight", slender: "slight", sleek: "lean", wiry: "lean", rangy: "lean", springy: "lean", compact: "sturdy", stocky: "sturdy", powerful: "athletic", muscular: "athletic", "broad-shouldered": "broad", wolfish: "athletic", sturdy: "sturdy", lean: "lean" },
    hairStyle: { "a short mane": "short", "a long shaggy mane": "long", "a wild mane": "messy", "shaggy curls": "curly", "a wild mop": "messy", "a loose tangle": "messy", "unkempt waves": "loose", "a sleek short cut": "short", "a close-cropped pelt": "cropped", "a braided tuft": "braided", "a braided scruff": "braided", "a braided top-knot": "tied back", "a topknot": "tied back", "a loose ruff": "loose", "a thick ruff": "loose" },
    eyeColor: { gold: "amber", yellow: "amber", copper: "amber", "pale blue": "blue", "dark brown": "brown" }
};
function _npcNearTypeValue(axis, value) {
    var table = NPC_TYPE_NEAR_WORDS[axis];
    var key = String(value || "").toLowerCase();
    return table && table[key] ? table[key] : null;
}

// Raw match score (before charisma), summed over the NPC's preferences.
function getNPCTypeMatchScore(npc) {
    var prefs = ensureNPCTypePreferences(npc);
    if (!prefs.length) return 0;
    var profile = _npcGetPlayerTypeProfile();
    return prefs.reduce(function (sum, pref) { return sum + _npcEvaluateTypePref(pref, profile); }, 0);
}

// Multiplier on the attraction an NPC gains from the player's actions.
// Charisma (above 3) softens a mismatch and slightly boosts a match. Shared
// helper, also exposed on window so the NSFW lust scaling can adopt it.
function getPlayerAppealMultiplier(npc) {
    if (!npc) return 1;
    var score = getNPCTypeMatchScore(npc);
    var charisma = typeof getSetupStat === "function" ? getSetupStat("charisma", 3) : 3;
    var edge = Math.max(0, charisma - 3);
    if (score < 0) {
        score = score * (1 - Math.min(NPC_TYPE_CHARISMA_SOFTEN_MAX, edge * NPC_TYPE_CHARISMA_SOFTEN_PER_POINT));
    } else if (score > 0) {
        score = score * (1 + Math.min(NPC_TYPE_CHARISMA_BOOST_MAX, edge * NPC_TYPE_CHARISMA_BOOST_PER_POINT));
    }
    var multiplier = 1 + score * NPC_TYPE_SCORE_STEP;
    return Math.max(NPC_TYPE_MULTIPLIER_MIN, Math.min(NPC_TYPE_MULTIPLIER_MAX, multiplier));
}

function _npcDescribeTypePref(pref) {
    var values = Array.isArray(pref.values) ? pref.values : [];
    var first = values[0] || "";
    switch (pref.axis) {
        case "trait":
            return { curiosity: "curious, inquisitive people", empathy: "warm, caring people", boldness: "bold, direct people" }[first] || "";
        case "bearing":
            return { imposing: "an imposing, powerful presence", nimble: "light-footed, agile people", steady: "steady, unshakable people", hardy: "hardy, resilient people" }[first] || "";
        case "presentation":
            return first === "polished" ? "people who take care over their appearance" : "unfussy, down-to-earth people";
        case "build":
            return values.join(" or ") + " builds";
        case "hairColor":
            return values.join(" or ") + " hair";
        case "hairStyle":
            return values.join(" or ") + " hair";
        case "eyeColor":
            return values.join(" or ") + " eyes";
        default:
            return "";
    }
}

// For the NPC prompt (adult humanoids only): what they are drawn to, and how
// the player lines up. label is "" when the player is neither a clear match
// nor a clear mismatch, so the prompt stays quiet for the middling case.
function getNPCTypeSummary(npc) {
    if (!isAdultHumanoidNPC(npc)) return { typeText: "", label: "" };
    var prefs = ensureNPCTypePreferences(npc);
    var typeText = prefs.map(_npcDescribeTypePref).filter(Boolean).join("; ");
    var score = getNPCTypeMatchScore(npc);
    var label = "";
    if (score >= 1) label = "match";
    else if (score <= -1) label = "mismatch";
    return { typeText: typeText, label: label };
}

// How an NPC's type gets revealed to the player in the side panel: the lead
// preference after a few conversations (or once they are curious about the
// player), the second after more (or real interest). Purely derived from
// existing counters, so it needs no saved state. Adult humanoids only.
const NPC_TYPE_REVEAL_FIRST = { interactions: 3, attraction: 15 };
const NPC_TYPE_REVEAL_SECOND = { interactions: 7, attraction: 35 };

function getNPCRevealedTypeHints(npc) {
    if (!isAdultHumanoidNPC(npc)) return [];
    var prefs = ensureNPCTypePreferences(npc);
    var convo = npc.memory && npc.memory.conversationState ? npc.memory.conversationState : null;
    var interactions = convo && typeof convo.interactionCount === "number" ? convo.interactionCount : 0;
    var attraction = npc.memory && typeof npc.memory.attraction === "number" ? npc.memory.attraction : 0;

    var revealed = 0;
    if (interactions >= NPC_TYPE_REVEAL_FIRST.interactions || attraction >= NPC_TYPE_REVEAL_FIRST.attraction) revealed = 1;
    if (interactions >= NPC_TYPE_REVEAL_SECOND.interactions || attraction >= NPC_TYPE_REVEAL_SECOND.attraction) revealed = 2;
    return prefs.slice(0, revealed).map(_npcDescribeTypePref).filter(Boolean);
}

// -- THE PLAYER'S OWN TASTE (likes & dislikes -> "you find them attractive") ----
// The reverse of the NPC "type" above: the player picked likes and dislikes at
// character creation (G.player.preferences, optional). Each liked trait an NPC
// has scores +1, each disliked one -1, over species, age, gender, build, hair color, hair
// style and eye color. The NPC's own Charisma shapes the result: charming NPCs
// amplify what you like about them and soften what you dislike; low-Charisma
// ones do the opposite. Only a clear result is reported - neutral returns
// label "" so the panel stays quiet. Cosmetic only (no stat changes).
const PLAYER_TASTE_THRESHOLD = 1.5;          // |adjusted score| needed to show anything
const PLAYER_TASTE_CHARISMA_STEP = 0.15;     // scale change per NPC Charisma point from 3
const PLAYER_TASTE_SCALE_MIN = 0.4;
const PLAYER_TASTE_SCALE_MAX = 1.7;

// Generic age bracket for display and for the player's likes/dislikes:
// "young", "middle-aged" or "old" ("" when the NPC has no numeric age).
// NPC ages are generated 18-80 for every humanoid species, read as a life
// stage relative to the species (see NPC_AGE_DESCRIPTORS).
const NPC_AGE_YOUNG_MAX = 35;
const NPC_AGE_MIDDLE_MAX = 55;
const NPC_AGE_LABELS = { "young": "Young", "middle-aged": "Middle-aged", "old": "Old" };

// How each bracket reads in the panel, in descriptions and in portraits.
// The numeric age is a LIFE STAGE on a human-equivalent scale for every
// species (an "old" elf or dragonborn is old for their kind), so the number is
// never shown to the player or the AI - only these descriptors are.
const NPC_AGE_DESCRIPTORS = {
    "young":       { label: "Young",       look: "looks young",               portrait: "young adult",             portraitNegatives: "elderly, wrinkled, aged" },
    "middle-aged": { label: "Middle-aged", look: "is middle-aged",            portrait: "middle-aged, mature",     portraitNegatives: "" },
    "old":         { label: "Old",         look: "is old, well on in years",  portrait: "elderly, aged, weathered", portraitNegatives: "youthful, smooth skin, young" }
};

function getNPCAgeBracket(npc) {
    if (!npc || typeof npc.age !== "number") return "";
    if (npc.age <= NPC_AGE_YOUNG_MAX) return "young";
    if (npc.age <= NPC_AGE_MIDDLE_MAX) return "middle-aged";
    return "old";
}

function getNPCAgeDescriptor(npc) {
    var bracket = getNPCAgeBracket(npc);
    return bracket ? NPC_AGE_DESCRIPTORS[bracket] : null;
}

// Looks (feminine / masculine / androgynous): an explicit npc.looks wins,
// otherwise it follows the NPC's gender.
var NPC_LOOKS_BY_GENDER = { female: "feminine", male: "masculine", "non-binary": "androgynous" };

// Size words for the chest / butt tastes, read from whatever size or
// description text the NPC's anatomy part carries (anatomy.breasts,
// anatomy.buttocks). Longest phrases first so "very large" beats "large".
// NPCs without that anatomy simply return "" and never match.
var NPC_BODY_SIZE_WORDS = [
    ["very large", ["very large", "huge", "massive", "enormous", "immense"]],
    ["large", ["large", "big", "ample", "generous", "heavy", "full", "plump"]],
    ["small", ["small", "petite", "modest", "slight", "little"]],
    ["flat", ["flat", "tiny", "washboard"]],
    ["medium", ["medium", "average", "moderate", "shapely"]]
];
function _npcBodySize(npc, partKey) {
    var part = npc && npc.anatomy && npc.anatomy[partKey];
    if (!part && npc && npc.nsfwTraits && npc.nsfwTraits.anatomy) part = npc.nsfwTraits.anatomy[partKey];
    if (!part) return "";
    // Generated anatomy uses sizeCategory; an explicit size wins over the
    // species' generic prose (e.g. a medium chest described as a modest bust).
    var explicit = typeof part === "object" ? String(part.sizeCategory || part.size || "").toLowerCase() : "";
    if (["flat", "small", "medium", "large", "very large"].indexOf(explicit) >= 0) return explicit;
    var text = typeof part === "string" ? part : explicit + " " + String(part.description || "");
    text = text.toLowerCase();
    for (var i = 0; i < NPC_BODY_SIZE_WORDS.length; i++) {
        var words = NPC_BODY_SIZE_WORDS[i][1];
        for (var j = 0; j < words.length; j++) {
            if (text.indexOf(words[j]) !== -1) return NPC_BODY_SIZE_WORDS[i][0];
        }
    }
    return "";
}

// Penis size taste (small / medium / large). Reads anatomy.genitals through the
// same size words as the chest / butt tastes, but only for NPCs that actually
// have a penis: never female NPCs, and a non-binary NPC only when their
// genitals carry no clitoris. No genital anatomy (or no size word) -> "" and
// the taste never matches.
function _npcPenisSize(npc) {
    var g = String(npc && npc.gender || "").toLowerCase();
    if (g === "female") return "";
    var gen = npc && npc.anatomy ? npc.anatomy.genitals : null;
    if (!gen || typeof gen !== "object") return "";
    if (g !== "male" && gen.clitoris) return "";
    var size = _npcBodySize(npc, "genitals");
    if (size === "very large") return "large";
    if (size === "flat") return "small";
    return size;
}

// Fur and scale tastes match colour FAMILIES (a liked "grey" coat matches
// silver-grey, timber-grey, ashen grey...). Read from the same surface and
// colour the look description shows, so the taste agrees with the text.
var NPC_FUR_COLOR_FAMILIES = [
    ["patterned", ["tabby", "calico", "tortoiseshell", "mottled", "brindle", "spotted", "striped", "dappled"]],
    ["black", ["black", "charcoal", "jet"]],
    ["white", ["white", "cream", "snow", "ivory"]],
    ["grey", ["grey", "gray", "silver", "smoky", "ashen", "slate"]],
    ["red", ["ginger", "russet", "red", "rust", "auburn", "copper"]],
    ["golden", ["golden", "gold", "tawny", "honey", "sandy", "fawn"]],
    ["brown", ["brown", "chestnut", "umber", "chocolate"]]
];
var NPC_SCALE_COLOR_FAMILIES = [
    ["green", ["green", "emerald", "moss", "olive", "jade"]],
    ["blue", ["blue", "frost", "azure", "teal"]],
    ["gold", ["gold", "bronze", "copper", "brass"]],
    ["red", ["red", "crimson", "rust", "orange", "scarlet"]],
    ["black", ["black", "jet", "obsidian"]],
    ["brown", ["brown", "tan", "umber"]],
    ["grey", ["grey", "gray", "slate", "stone", "silver"]],
    ["purple", ["purple", "violet", "plum"]]
];
var NPC_FEATHER_COLOR_FAMILIES = [
    ["black", ["black", "jet", "raven", "crow", "soot", "midnight", "charcoal"]],
    ["white", ["white", "snow", "ivory", "cream", "alabaster"]],
    ["grey", ["grey", "gray", "slate", "silver", "ashen", "smoky"]],
    ["brown", ["brown", "chestnut", "umber", "tan", "russet", "chocolate"]]
];
function _npcColorFamily(colour, families) {
    var text = String(colour || "").toLowerCase();
    if (!text) return "";
    for (var i = 0; i < families.length; i++) {
        var words = families[i][1];
        for (var j = 0; j < words.length; j++) if (text.indexOf(words[j]) !== -1) return families[i][0];
    }
    return "";
}
// { surface: "fur" | "scales" | "skin" | ..., colour } as the look text shows it.
function _npcSurfaceLook(npc) {
    var body = npc && npc.anatomy && npc.anatomy.body || {};
    var surface = String(body.surfaceType || npc.surfaceType || (npc.skinTone ? "skin" : npc.furColor ? "fur" : npc.featherColor ? "feathers" : npc.scaleColor ? "scales" : "")).toLowerCase();
    var colour = String(body.color || npc.surfaceColor || npc.skinTone || npc.furColor || npc.featherColor || npc.scaleColor || "").toLowerCase();
    return { surface: surface, colour: colour };
}

function _npcTasteValue(npc, axis) {
    if (axis === "furColor" || axis === "scaleColor" || axis === "featherColor") {
        var look = _npcSurfaceLook(npc);
        if (axis === "furColor") return look.surface === "fur" ? _npcColorFamily(look.colour, NPC_FUR_COLOR_FAMILIES) : "";
        if (axis === "featherColor") return look.surface === "feathers" ? _npcColorFamily(look.colour, NPC_FEATHER_COLOR_FAMILIES) : "";
        return look.surface === "scales" ? _npcColorFamily(look.colour, NPC_SCALE_COLOR_FAMILIES) : "";
    }
    if (axis === "penis") return _npcPenisSize(npc);
    if (axis === "gender") return String(npc.gender || "").toLowerCase();
    if (axis === "looks") return String(npc.looks || NPC_LOOKS_BY_GENDER[String(npc.gender || "").toLowerCase()] || "").toLowerCase();
    if (axis === "chest") return _npcBodySize(npc, "breasts");
    if (axis === "butt") return _npcBodySize(npc, "buttocks");
    if (axis === "age") return getNPCAgeBracket(npc);
    if (axis === "species") return String(npc.species || "").toLowerCase();
    if (axis === "build") return String(npc.bodyType || npc.build || "").toLowerCase();
    return String(npc[axis] || "").toLowerCase();
}

function getPlayerTasteForNPC(npc) {
    var result = { raw: 0, score: 0, label: "" };
    if (!isAdultHumanoidNPC(npc)) return result;
    var player = (typeof G === "object" && G) ? G.player : null;
    // Display preference only: shared by the panel, look prose and text/TTS
    // inspection. Legacy saves without orientation keep their existing scope.
    var orientation = String(player && player.orientation || "bi").toLowerCase();
    if (orientation === "none") return result;
    if (String(player && player.gender || "").toLowerCase() === "male") {
        var gender = String(npc.gender || "").toLowerCase();
        if (orientation === "straight" && gender !== "female") return result;
        if (orientation === "gay" && gender !== "male") return result;
    }
    var prefs = player ? player.preferences : null;
    if (!prefs) return result;
    var likes = Array.isArray(prefs.likes) ? prefs.likes : [];
    var dislikes = Array.isArray(prefs.dislikes) ? prefs.dislikes : [];
    if (!likes.length && !dislikes.length) return result;

    // Species gate: a non-human NPC can only read as attractive if the player
    // actually picked their species as a like (so a charismatic dragonborn
    // does not trigger by accident on eye color or build alone). Humans are
    // the default. Dislikes always count.
    var species = _npcTasteValue(npc, "species");
    var speciesOpen = !species || species === "human" || likes.some(function (p) {
        return p.axis === "species" && String(p.value).toLowerCase() === species;
    });

    var raw = 0;
    result.liked = [];
    result.disliked = [];
    likes.forEach(function (p) {
        if (!speciesOpen) return;
        var v = _npcTasteValue(npc, p.axis);
        if (v && v === String(p.value).toLowerCase()) { raw += 1; result.liked.push({ axis: p.axis, value: v }); }
    });
    dislikes.forEach(function (p) {
        var v = _npcTasteValue(npc, p.axis);
        if (v && v === String(p.value).toLowerCase()) { raw -= 1; result.disliked.push({ axis: p.axis, value: v }); }
    });
    result.raw = raw;
    if (!raw) return result;

    var charisma = (npc.stats && typeof npc.stats.charisma === "number") ? npc.stats.charisma : 3;
    var edge = charisma - 3;
    var scale = raw > 0 ? 1 + edge * PLAYER_TASTE_CHARISMA_STEP : 1 - edge * PLAYER_TASTE_CHARISMA_STEP;
    scale = Math.max(PLAYER_TASTE_SCALE_MIN, Math.min(PLAYER_TASTE_SCALE_MAX, scale));
    result.score = raw * scale;
    if (result.score >= PLAYER_TASTE_THRESHOLD) result.label = "attractive";
    else if (result.score <= -PLAYER_TASTE_THRESHOLD) result.label = "unattractive";
    // What stands out most: visible features first, broad traits last.
    // Gender and penis size are never named.
    var source = result.label === "attractive" ? result.liked : (result.label === "unattractive" ? result.disliked : []);
    result.focus = source.filter(function (m) { return PLAYER_TASTE_FOCUS_ORDER.indexOf(m.axis) >= 0; })
        .sort(function (a, b) { return PLAYER_TASTE_FOCUS_ORDER.indexOf(a.axis) - PLAYER_TASTE_FOCUS_ORDER.indexOf(b.axis); })
        .slice(0, 2);
    return result;
}

var PLAYER_TASTE_FOCUS_ORDER = ["eyeColor", "furColor", "scaleColor", "hairColor", "hairStyle", "build", "looks", "chest", "butt", "age", "species"];

// "her green eyes", "his golden tabby coat", "their catfolk features"...
function describePlayerTasteFocus(npc, match, possessive) {
    if (!npc || !match) return "";
    var pre = possessive === "" ? "" : (possessive || "their") + " ";
    var look = _npcSurfaceLook(npc);
    switch (match.axis) {
        case "eyeColor": { var eyes = typeof getNPCVisibleEyeColor === "function" ? getNPCVisibleEyeColor(npc) : npc.eyeColor; return eyes ? pre + eyes + " eyes" : ""; }
        case "furColor": return look.colour ? pre + look.colour + " coat" : pre + "coat";
        case "scaleColor": return look.colour ? pre + look.colour + " scales" : pre + "scales";
        case "hairColor": return npc.hairColor ? pre + npc.hairColor + " hair" : "";
        case "hairStyle": return pre + match.value + " hair";
        case "build": return pre + match.value + " build";
        case "looks": return pre + match.value + " looks";
        case "chest":
        case "butt": return pre + "figure";
        case "age": return pre + ({ "young": "youthful look", "middle-aged": "mature look", "old": "seasoned look" }[match.value] || "age");
        case "species": return pre + String(npc.species || "").toLowerCase() + " features";
    }
    return "";
}

// The final line of the look text: "You find her attractive, especially her
// green eyes." Without a nameable focus it stays "You find her attractive."
function describePlayerTasteSentence(npc, taste, pronouns) {
    if (!taste || !taste.label) return "";
    var p = pronouns || _npcInspectionPronouns(npc);
    var phrases = [];
    (taste.focus || []).forEach(function (m) {
        var phrase = describePlayerTasteFocus(npc, m, p.possessive);
        if (phrase && phrases.indexOf(phrase) < 0) phrases.push(phrase); // chest + butt are both "her figure"
    });
    if (phrases.length === 2 && phrases[0].split(" ")[0] === phrases[1].split(" ")[0]) {
        phrases[1] = phrases[1].split(" ").slice(1).join(" "); // "her green eyes and auburn hair"
    }
    var base = "You find " + p.object + " " + (Math.abs(taste.score) < 3 ? "mildly " : "") + taste.label;
    if (!phrases.length) return base + ".";
    return base + (taste.label === "attractive" ? ", especially " : ", mostly because of ") + phrases.join(" and ") + ".";
}
if (typeof window !== "undefined") {
    window.describePlayerTasteSentence = describePlayerTasteSentence;
    window.describePlayerTasteFocus = describePlayerTasteFocus;
}

// -- FIRST IMPRESSION + TYPE-ALIGNED ACTIONS -----------------------------------
// First encounter: an adult humanoid NPC starts with some attraction (or none)
// based on how well the player fits their type and the player's CURRENT
// Charisma - which already folds in clothing quality and hygiene/grime, so
// meeting someone while filthy genuinely starts you behind. One-time per NPC
// (npc.memory.firstImpressionDone). Hostile NPCs start at 0, and the result is
// capped so nobody begins past "curious".
const NPC_FIRST_IMPRESSION = { base: 6, perMatchPoint: 6, perCharisma: 1.5, max: 22, hostilityCutoff: 60 };

// -- SPECIES FIRST REACTION ---------------------------------------------------
// One-time favour shift when a humanoid NPC first deals with the player, from
// the player's CURRENT species (player.appearance.species, so a Shapeshifter
// form counts, and the memory flag is cleared when relationships reset). Kin
// warm to kin; civilized folk can be wary of frightening or imposing forms;
// individual species pairs have their own shades. Already-hostile NPCs skip the
// favour shift (hostility still shifts).
// The table lives on PLAYER_SPECIES[...].social in the engine.
const NPC_SPECIES_REACTION_HOSTILITY_CUTOFF = 60;
// The same table also shifts HOSTILITY on that first meeting: every point of
// favour shift moves hostility the opposite way by this many points (wary folk
// bristle, kin and friendly pairs ease), capped per NPC. "Meaningful" tuning:
// the worst civilized pairing is roughly +30, still under the ambush bar for a
// calm townsperson, so species colours encounters without starting fights alone.
const NPC_SPECIES_HOSTILITY_PER_FAVOR = 4;
const NPC_SPECIES_HOSTILITY_MAX_SHIFT = 30;
// Same-species NPCs get a flat hostility drop on first meeting, so kin start
// calm in most cases. Aggressive-temperament NPCs are exempt. Favour is not
// touched by this.
const NPC_SPECIES_KIN_HOSTILITY_DROP = 50;

function applyNPCSpeciesReaction(npc) {
    if (!npc || npc.isHumanoid === false) return npc;
    npc.memory = npc.memory || {};
    if (npc.memory.speciesReactionDone) return npc;
    npc.memory.speciesReactionDone = true;
    if (typeof getPlayerSpeciesDef !== "function") return npc;
    var def = getPlayerSpeciesDef();
    if (!def || !def.social) return npc;
    var hostility = typeof npc.hostility === "number" ? npc.hostility : 0;
    var playerKey = getPlayerSpeciesKey();
    var npcKey = String(npc.species || "").toLowerCase();
    var tpl = typeof getSpeciesTemplate === "function" ? getSpeciesTemplate(npc.species) : null;
    var delta = 0;
    var isKin = !!(npcKey && npcKey === playerKey);
    if (isKin && String(npc.temperament || "").toLowerCase() !== "aggressive") {
        hostility = Math.max(0, hostility - NPC_SPECIES_KIN_HOSTILITY_DROP);
        npc.hostility = hostility;
    }
    if (isKin) delta += def.social.kin || 0;
    else if (tpl && tpl.isCivilized) delta += def.social.civilized || 0;
    if (def.social.bySpecies && def.social.bySpecies[npcKey]) delta += def.social.bySpecies[npcKey];
    if (!delta) return npc;
    // Favour only moves for NPCs who are not already hostile; hostility itself
    // shifts for everyone (kin can calm a hostile creature, wariness can sour
    // a calm one).
    if (hostility < NPC_SPECIES_REACTION_HOSTILITY_CUTOFF) {
        npc.memory.favorability = Math.max(-100, Math.min(100, (npc.memory.favorability || 0) + delta));
    }
    var hostShift = Math.max(-NPC_SPECIES_HOSTILITY_MAX_SHIFT, Math.min(NPC_SPECIES_HOSTILITY_MAX_SHIFT, -delta * NPC_SPECIES_HOSTILITY_PER_FAVOR));
    if (hostShift) npc.hostility = Math.max(0, Math.min(100, hostility + hostShift));
    return npc;
}
if (typeof window !== "undefined") window.applyNPCSpeciesReaction = applyNPCSpeciesReaction;

// Apply the species reaction to everyone in a room as the player arrives, so
// hostility is already adjusted before any ambush or greeting check. One-time
// per NPC (memory.speciesReactionDone); skips the dead, hidden and downed.
function applyNPCSpeciesReactionToRoom(room) {
    if (!room || !Array.isArray(room.creatures)) return;
    room.creatures.forEach(function (npc) {
        if (!npc || npc.hp <= 0 || npc.hidden || npc.isHidden || npc.unconscious || npc.isUnconsciousBody) return;
        if (npc._inParty) return;
        if (typeof hydrateNPCSpeciesFlags === "function") hydrateNPCSpeciesFlags(npc);
        applyNPCSpeciesReaction(npc);
    });
}
if (typeof window !== "undefined") window.applyNPCSpeciesReactionToRoom = applyNPCSpeciesReactionToRoom;

function applyNPCFirstImpression(npc) {
    applyNPCSpeciesReaction(npc);
    if (!isAdultHumanoidNPC(npc)) return npc;
    npc.memory = npc.memory || {};
    if (npc.memory.firstImpressionDone) return npc;
    npc.memory.firstImpressionDone = true;

    var hostility = typeof npc.hostility === "number" ? npc.hostility : 0;
    if (hostility >= NPC_FIRST_IMPRESSION.hostilityCutoff) return npc;

    var charisma = typeof getSetupStat === "function" ? getSetupStat("charisma", 3) : 3;
    var raw = NPC_FIRST_IMPRESSION.base +
        getNPCTypeMatchScore(npc) * NPC_FIRST_IMPRESSION.perMatchPoint +
        (charisma - 3) * NPC_FIRST_IMPRESSION.perCharisma;
    var gain = Math.max(0, Math.min(NPC_FIRST_IMPRESSION.max, Math.round(raw)));
    npc.memory.attraction = Math.max(0, Math.min(100, (npc.memory.attraction || 0) + gain));
    return npc;
}

// Acting in line with what an NPC is drawn to earns a small attraction bump:
// a curious question for someone who likes curious people, a bold stand for
// someone who likes bold ones, kindness for someone who likes empathy. Only
// for non-hostile actions, and capped per NPC so repeating an option cannot
// farm it. Returns the bonus to add to this impact's attraction.
const NPC_INTENT_TRAIT = { curious: "curiosity", help: "empathy", empathy: "empathy", comfort: "empathy", bold: "boldness" };
const NPC_TYPE_ALIGNMENT_GAIN = 1;
const NPC_TYPE_ALIGNMENT_CAP = 10;

function getNPCTypeAlignmentBonus(npc, impact) {
    if (!isAdultHumanoidNPC(npc) || !impact) return 0;
    var trait = NPC_INTENT_TRAIT[String(impact.intent || "").toLowerCase()];
    if (!trait) return 0;
    if ((impact.hostility || 0) > 0 || (impact.favor || 0) < 0) return 0;
    if ((npc.memory.typeAlignmentGain || 0) >= NPC_TYPE_ALIGNMENT_CAP) return 0;
    var prefs = ensureNPCTypePreferences(npc);
    var aligned = prefs.some(function (pref) {
        return pref.axis === "trait" && Array.isArray(pref.values) && pref.values[0] === trait;
    });
    if (!aligned) return 0;
    npc.memory.typeAlignmentGain = (npc.memory.typeAlignmentGain || 0) + NPC_TYPE_ALIGNMENT_GAIN;
    return NPC_TYPE_ALIGNMENT_GAIN;
}

if (typeof window !== "undefined") {
    window.getPlayerAppealMultiplier = getPlayerAppealMultiplier;
    window.applyNPCFirstImpression = applyNPCFirstImpression;
    window.getNPCTypeMatchScore = getNPCTypeMatchScore;
    window.isPlayerUnclothed = _npcIsPlayerUnclothed;
    window.getNudityReactionForNPC = getNudityReactionForNPC;
    window.ensureNPCTypePreferences = ensureNPCTypePreferences;
    window.getNPCTypeSummary = getNPCTypeSummary;
    window.getNPCRevealedTypeHints = getNPCRevealedTypeHints;
    window.getPlayerTasteForNPC = getPlayerTasteForNPC;
    window.getNPCAgeBracket = getNPCAgeBracket;
    window.getNPCAgeDescriptor = getNPCAgeDescriptor;
    window.NPC_AGE_LABELS = NPC_AGE_LABELS;
    window.migrateNPCRelationshipPool = migrateNPCRelationshipPool;
    window.ensureNPCOrientation = ensureNPCOrientation;
    window.computeNPCAttractionBase = computeNPCAttractionBase;
    window.recomputeNPCAttraction = recomputeNPCAttraction;
}

function getMoodScale() {
    return ["furious", "angry", "wary", "neutral", "friendly", "warm", "affectionate"];
}

function canImproveMood(npc, intent) {
    ensureNPCRelationshipState(npc);

    const key = String(intent || "").toLowerCase();
    if (npc.surrendered) return key === "mercy" ? 1.2 : 1;
    if (npc.hostility >= 70) {
        if (["surrender", "plead", "bribe", "gift", "mercy", "apology", "calm", "comfort", "help", "greeting"].includes(key)) return 0.25;
        return false;
    }
    if (npc.hostility >= 50) return 0.5;
    if (["friendly", "calm"].includes(String(npc.temperament || "").toLowerCase())) return 1.25;
    if (["hostile", "aggressive"].includes(String(npc.temperament || "").toLowerCase())) return 0.75;
    return 1;
}

function getCurrentNPCDisposition(npc) {
    ensureNPCRelationshipState(npc);

    const mood = String(npc.memory.lastMood || "neutral").toLowerCase();
    if (mood && mood !== "neutral") return mood;

    const hostility = npc.hostility ?? 50;
    const favorability = npc.memory.favorability ?? 0;

    if (hostility >= 85) return "hostile";
    if (hostility >= 65) {
        if (favorability <= -40) return "hostile";
        if (favorability < 0) return "unfriendly";
        return "wary";
    }
    if (hostility >= 40) {
        if (favorability <= -60) return "hostile";
        if (favorability <= -30) return "unfriendly";
        if (favorability < 0) return "wary";
        if (favorability > 60) return "friendly";
        return "neutral";
    }
    if (favorability <= -75) return "hateful";
    if (favorability <= -40) return "unfriendly";
    if (favorability <= -10) return "cool";
    if (favorability >= 90) return "devoted";
    if (favorability >= 60) return "warm";
    if (favorability >= 30) return "friendly";
    return "neutral";
}

function getRelationshipLabel(npc) {
    if (!npc) return "unknown";
    ensureNPCRelationshipState(npc);

    const disposition = getCurrentNPCDisposition(npc);
    const favor = npc.memory.favorability ?? 0;

    if (favor >= 95) return "devoted";
    if (favor <= -90) return "hateful";

    switch (disposition) {
        case "furious":
        case "hostile":
            return "hostile";
        case "hateful":
            return "hateful";
        case "unfriendly":
        case "angry":
            return "unfriendly";
        case "wary":
        case "suspicious":
        case "cool":
            return "guarded";
        case "friendly":
            return "friendly";
        case "warm":
        case "affectionate":
            return "very friendly";
        case "devoted":
            return "devoted";
        default:
            return "neutral";
    }
}

function getAttractionLabel(npc) {
    if (!npc || !isAdultHumanoidNPC(npc)) return "none";
    ensureNPCRelationshipState(npc);

    const attraction = npc.memory.attraction ?? 0;
    if (attraction >= 85) return "captivated";
    if (attraction >= 60) return "strongly interested";
    if (attraction >= 35) return "interested";
    if (attraction >= 15) return "curious";
    return "none";
}

function getArousalLabel(npc) {
    if (!npc || !isAdultHumanoidNPC(npc)) return "calm";
    ensureNPCRelationshipState(npc);

    const arousal = npc.memory.arousal ?? 0;
    if (arousal >= 80) return "flustered";
    if (arousal >= 55) return "heated";
    if (arousal >= 30) return "stirred";
    if (arousal >= 10) return "alert";
    return "calm";
}

function adjustNPCMood(npc, delta = 0, favorDelta = 0, intent = null) {
    ensureNPCRelationshipState(npc);

    const scale = delta > 0 || favorDelta > 0 ? canImproveMood(npc, intent) : 1;
    if (scale === false) return npc;

    const moodScale = getMoodScale();
    const currentMood = npc.memory.lastMood || "neutral";
    let moodIndex = moodScale.indexOf(currentMood);
    if (moodIndex < 0) moodIndex = moodScale.indexOf("neutral");

    const scaledDelta = Math.round((delta || 0) * (scale || 1));
    const scaledFavor = Math.round((favorDelta || 0) * (scale || 1));

    if (scaledDelta !== 0) {
        moodIndex = Math.max(0, Math.min(moodScale.length - 1, moodIndex + scaledDelta));
        npc.memory.lastMood = moodScale[moodIndex];
    }

    npc.memory.favorability = Math.max(-100, Math.min(100, (npc.memory.favorability || 0) + scaledFavor));

    if (String(npc.temperament || "").toLowerCase() === "hostile") {
        npc.memory.favorability = Math.min(npc.memory.favorability, 50);
    } else if (String(npc.temperament || "").toLowerCase() === "friendly") {
        npc.memory.favorability = Math.max(npc.memory.favorability, -50);
    }

    return npc;
}

function applyNPCRelationshipImpact(npc, impact = {}) {
    ensureNPCRelationshipState(npc);
    if (!npc) return npc;
    // Idempotent: normally already applied when the NPC was first opened.
    applyNPCFirstImpression(npc);

    const {
        mood = 0,
        favor = 0,
        hostility = 0,
        aggression = 0,
        attraction = 0,
        arousal = 0,
        disinhibition = 0,
        intent = null,
        moodOverride = null,
        markMet = false,
        actionTag = ""
    } = impact || {};

    adjustNPCMood(npc, mood, favor, intent);

    if (typeof hostility === "number" && hostility !== 0) {
        npc.hostility = Math.max(0, Math.min(100, (npc.hostility || 0) + hostility));
    }
    if (typeof aggression === "number" && aggression !== 0) {
        npc.memory.aggressionCount = Math.max(0, (npc.memory.aggressionCount || 0) + aggression);
    }
    if (isAdultHumanoidNPC(npc)) {
        // A small bonus when the action fits what this NPC is drawn to.
        const attractionDelta = (typeof attraction === "number" ? attraction : 0) +
            getNPCTypeAlignmentBonus(npc, impact);
        if (attractionDelta !== 0) {
            // Player charisma scales how attractive the NPC finds them -
            // same multiplier shape as the lust scaling in the NSFW system
            // (0.8 + CHA * 0.02), so both pipelines agree. Worn-clothing
            // bonuses flow in through getSetupStat/getEntityStatValue.
            const charismaMultiplier = typeof getSetupStat === "function"
                ? (0.8 + (getSetupStat("charisma", 3) * 0.02))
                : 1;
            // NPC "type": how well the player matches what this NPC is drawn
            // to (see getPlayerAppealMultiplier). Only scales gains - a
            // negative attraction change (an insult) is left as-is.
            const appealMultiplier = attractionDelta > 0
                ? getPlayerAppealMultiplier(npc)
                : 1;
            const attractionGain = Math.round(attractionDelta * charismaMultiplier * appealMultiplier);
            // Track the action-earned share separately from the computed
            // base so recomputeNPCAttraction (interaction start) preserves
            // it while re-deriving the base from live stats.
            npc.memory.attractionEarned = (typeof npc.memory.attractionEarned === "number" ? npc.memory.attractionEarned : 0) + attractionGain;
            npc.memory.attraction = Math.max(0, Math.min(100, (npc.memory.attraction || 0) + attractionGain));
        }
        if (typeof arousal === "number" && arousal !== 0) {
            npc.memory.arousal = Math.max(0, Math.min(100, (npc.memory.arousal || 0) + arousal));
        }
        if (typeof disinhibition === "number" && disinhibition !== 0) {
            npc.memory.disinhibition = Math.max(0, Math.min(100, (npc.memory.disinhibition || 0) + disinhibition));
        }
    }
    if (moodOverride) npc.memory.lastMood = moodOverride;
    if (markMet) npc.memory.metPlayer = true;
    if (actionTag) {
        npc.memory.playerActionTags.push(actionTag);
        npc.memory.playerActionTags = npc.memory.playerActionTags.slice(-20);
        npc.memory.playerActions.push(actionTag);
        npc.memory.playerActions = npc.memory.playerActions.slice(-12);
    }

    return npc;
}

function applyActDisinhibitionDelta(npc, actKey, delta, reason) {
    if (!npc || !npc.memory) return npc;
    if (typeof actKey !== "string" || !actKey) return npc;
    if (typeof delta !== "number" || delta === 0) return npc;
    ensureNPCRelationshipState(npc);
    if (!isAdultHumanoidNPC(npc)) return npc;
    if (!npc.memory.actDisinhibition || typeof npc.memory.actDisinhibition !== "object") {
        npc.memory.actDisinhibition = {};
    }
    var current = typeof npc.memory.actDisinhibition[actKey] === "number"
        ? npc.memory.actDisinhibition[actKey] : 0;
    var next = Math.max(0, Math.min(100, Math.round(current + delta)));
    npc.memory.actDisinhibition[actKey] = next;
    if (typeof reason === "string" && reason && typeof rememberStoryEvent === "function") {
        rememberStoryEvent("intimacy", reason);
    }
    return npc;
}

function getActDisinhibition(npc, actKey) {
    if (!npc || !npc.memory || !npc.memory.actDisinhibition) return 0;
    if (typeof actKey !== "string" || !actKey) return 0;
    var v = npc.memory.actDisinhibition[actKey];
    return typeof v === "number" && !isNaN(v) ? Math.max(0, Math.min(100, v)) : 0;
}

function shouldNPCAttack(npc) {
    if (!npc) return false;
    ensureNPCRelationshipState(npc);
    if (npc.surrendered || npc.unconscious || npc.hidden || npc.isHidden) return false;

    const lastMood = String(npc.memory.lastMood || "").toLowerCase();
    if (["afraid", "subdued", "friendly", "warm", "affectionate"].includes(lastMood)) return false;
    if ((npc.hostility || 0) >= 75) return true;
    if ((npc.memory.favorability || 0) <= -75) return true;
    return ["furious", "angry", "hateful"].includes(lastMood);
}

function decayNPCAffect(npc, steps = 1) {
    if (!npc) return npc;
    ensureNPCRelationshipState(npc);
    if (!isAdultHumanoidNPC(npc)) return npc;

    const amount = Math.max(1, Math.floor(steps || 1));
    npc.memory.arousal = Math.max(0, (npc.memory.arousal || 0) - amount * 4);
    return npc;
}

// Update fertility/heat cycles for NPCs with biological cycles
// Called from the engine's advanceStoryTurn
function updateNPCFertilityCycles(roomMap, steps = 1) {
    if (!roomMap || typeof roomMap !== "object") return;
    
    const stepCount = Math.max(1, Math.floor(steps || 1));
    
    Object.values(roomMap).forEach(room => {
        if (!room || !Array.isArray(room.creatures)) return;
        
        room.creatures.forEach(npc => {
            if (!npc) return;
            
            // Initialize fertility tracking if needed
            if (!npc._fertility) {
                npc._fertility = { counter: 0, inCycle: false, cycleTurns: 0 };
            }
            
            // Get species template to check for fertility cycle
            const species = npc.species;
            if (!species) return;
            
            const template = typeof getSpeciesTemplate === "function" 
                ? getSpeciesTemplate(species) 
                : null;
            
            if (!template || !template.fertilityCycle || !template.fertilityCycle.hasCycle) {
                // No fertility cycle for this species
                return;
            }
            
            const cycle = template.fertilityCycle;
            
            // Skip if NPC is too young (if age tracking exists)
            if (cycle.minAge && typeof npc.age === "number") {
                const ageInMonths = npc.age; // Assuming age is in months for these species
                if (ageInMonths < cycle.minAge) {
                    return;
                }
            }
            
            // Only process humanoids or creatures with fertility cycles
            // (non-humanoids like rats, humanoids like wolfkin/catfolk)
            if (npc.isHumanoid === false && !cycle.hasCycle) {
                return;
            }
            
            // Advance the cycle counter
            npc._fertility.counter += stepCount;
            
            // Check if entering cycle phase
            if (!npc._fertility.inCycle && npc._fertility.counter >= cycle.cycleLength) {
                npc._fertility.counter = 0;
                npc._fertility.inCycle = true;
                npc._fertility.cycleTurns = cycle.duration;
                
                // Only set arousal if NPC has memory (some creatures might not)
                if (npc.memory) {
                    ensureNPCRelationshipState(npc);
                    npc.memory.arousal = Math.min(100, (npc.memory.arousal || 0) + cycle.arousalBoost);
                }
            }
            
            // If in cycle, count down duration
            if (npc._fertility.inCycle) {
                npc._fertility.cycleTurns -= stepCount;
                
                if (npc._fertility.cycleTurns <= 0) {
                    npc._fertility.inCycle = false;
                    // Optional: Add a small cooldown or just let it continue to next cycle
                }
            }
        });
    });
}

// Apply environmental arousal based on room tags and conditions
// Called from the engine's advanceStoryTurn
function applyEnvironmentalArousal(roomMap) {
    if (!roomMap || typeof roomMap !== "object") return;
    
    Object.values(roomMap).forEach(room => {
        if (!room || !room.tags || !Array.isArray(room.creatures)) return;
        
        const tags = room.tags || [];
        const hasHeat = tags.includes("heat");
        const hasSocial = tags.includes("social");
        const creatureCount = room.creatures ? room.creatures.length : 0;
        
        room.creatures.forEach(npc => {
            if (!npc || !npc.isHumanoid || !npc.memory) return;
            
            ensureNPCRelationshipState(npc);
            
            let arousalChange = 0;
            
            // Heat sources: forges, fireplaces, hearths increase arousal for warm-blooded creatures
            if (hasHeat) {
                // Base arousal from heat
                arousalChange += 1;
                
                // Extra for species that are particularly affected by warmth
                const species = (npc.species || "").toLowerCase();
                if (species === "catfolk" || species === "ratfolk" || species === "rat") {
                    arousalChange += 1;
                }
            }
            
            // Social environments: taverns, gathering places
            if (hasSocial && creatureCount > 1) {
                // More NPCs = more social stimulation
                const socialBoost = Math.floor((creatureCount - 1) / 3);
                arousalChange += Math.min(socialBoost, 3); // Cap at 3
                
                // Extra for social species
                const species = (npc.species || "").toLowerCase();
                if (species === "halfling" || species === "harefolk" || species === "satyr") {
                    arousalChange += 1;
                }
            }
            
            // Apply the change if any
            if (arousalChange > 0 && Math.random() < 0.4) { // 40% chance to apply
                npc.memory.arousal = Math.min(100, (npc.memory.arousal || 0) + arousalChange);
            }
        });
    });
}

// Check if an NPC is inhibited from romantic/social advances
// Returns true if the NPC is too inhibited to act on arousal
function isNPCInhibited(npc) {
    if (!npc || !npc.memory) return true;
    
    // Check for promiscuous trait - bypasses inhibition
    const traits = npc.personalityTraits || [];
    if (traits.includes("promiscuous")) return false;
    
    // Check disinhibition level - high disinhibition overcomes inhibition
    const disinhibition = npc.memory.disinhibition || 0;
    if (disinhibition >= 70) return false; // Very disinhibited
    if (disinhibition >= 40) return Math.random() < 0.5; // Moderately disinhibited, 50% chance
    
    // Default: inhibited if disinhibition is low
    return disinhibition < 20;
}

// Check if NPC1 finds NPC2 attractive based on various factors
function doesNPCFindAttractive(npc1, npc2) {
    if (!npc1 || !npc2) return false;
    if (!npc1.isHumanoid || !npc2.isHumanoid) return false; // Only humanoids have preferences
    
    // Check sexual orientation compatibility
    const orient1 = (npc1.relationship && npc1.relationship.orientation) || "bi";
    const orient2 = (npc2.relationship && npc2.relationship.orientation) || "bi";
    const gender2 = (npc2.gender || "").toLowerCase();
    
    // Simple orientation check
    if (orient1 === "straight" && gender2 !== "female" && gender2 !== "male") return false;
    if (orient1 === "gay") {
        const gender1 = (npc1.gender || "").toLowerCase();
        if (gender1 === gender2) return true;
        return false;
    }
    // bi or any other value: assume compatible
    
    // Check species compatibility
    const species1 = (npc1.species || "").toLowerCase();
    const species2 = (npc2.species || "").toLowerCase();
    
    // Same species bonus
    if (species1 === species2) return true;
    
    // Compatible species pairs
    const compatiblePairs = [
        ["catfolk", "ratfolk"], ["catfolk", "harefolk"],
        ["wolfkin", "harefolk"], ["wolfkin", "ratfolk"],
        ["wolfkin", "catfolk"], ["satyr", "catfolk"],
        ["satyr", "harefolk"], ["ratfolk", "harefolk"]
    ];
    
    if (compatiblePairs.some(pair => 
        (pair[0] === species1 && pair[1] === species2) ||
        (pair[0] === species2 && pair[1] === species1))) {
        return true;
    }
    
    // Personality trait compatibility
    const traits1 = npc1.personalityTraits || [];
    const traits2 = npc2.personalityTraits || [];
    
    if (traits1.includes("flirt") || traits2.includes("flirt")) return true;
    if (traits1.includes("promiscuous") || traits2.includes("promiscuous")) return true;
    
    // Default: 30% chance for any humanoid pairing
    return Math.random() < 0.3;
}

// Check if NPC1 would initiate with NPC2 (gender-specific logic)
function wouldNPCInitiate(npc1, npc2) {
    if (!npc1 || !npc2) return false;
    if (!npc1.memory || !npc2.memory) return false;
    
    const gender1 = (npc1.gender || "").toLowerCase();
    const gender2 = (npc2.gender || "").toLowerCase();
    
    // Check if NPC2 is bound and eligible
    const targetBound = npc2.bound === true;
    
    // For bound NPC scenarios: different logic for male vs female initiators
    if (targetBound) {
        // Male initiator: less picky, will take advantage if orientation matches
        if (gender1 === "male") {
            const orient1 = (npc1.relationship && npc1.relationship.orientation) || "bi";
            
            // Check orientation compatibility
            if (orient1 === "straight" && gender2 !== "female") return false;
            if (orient1 === "gay" && gender2 !== "male") return false;
            
            // Male is aroused and disinhibited enough
            if ((npc1.memory.arousal || 0) >= 30 && !isNPCInhibited(npc1)) {
                return true;
            }
            return false;
        }
        
        // Female initiator: needs to be more selective
        if (gender1 === "female") {
            // Female needs: aroused, bold (not shy), finds target attractive
            const traits = npc1.personalityTraits || [];
            const temperament = (npc1.temperament || "").toLowerCase();
            
            if (temperament === "shy" && !traits.includes("promiscuous")) return false;
            
            if ((npc1.memory.arousal || 0) < 50) return false;
            
            if (!doesNPCFindAttractive(npc1, npc2)) return false;
            
            if (isNPCInhibited(npc1)) return false;
            
            return true;
        }
    }
    
    // Normal interaction (not bound target)
    // Both NPCs must not be inhibited
    if (isNPCInhibited(npc1)) return false;
    
    // Check arousal levels
    if ((npc1.memory.arousal || 0) < 20) return false;
    if ((npc2.memory.arousal || 0) < 20) return false;
    
    // Check mutual attraction
    if (!doesNPCFindAttractive(npc1, npc2)) return false;
    if (!doesNPCFindAttractive(npc2, npc1)) return false;
    
    // Check relationship status
    // If NPC1 has a partner/established relationship, less likely to initiate with others
    if (npc1.memory.partnerId && !traits.includes("promiscuous")) {
        if (npc1.memory.partnerId !== npc2.id) return false;
    }
    
    return true;
}

// Process bound NPC scenarios where free NPCs take advantage
function processBoundNPCScenarios(room) {
    if (!room || !Array.isArray(room.creatures)) return [];
    
    const lines = [];
    const boundNPCs = room.creatures.filter(n => n && n.bound === true && n.isHumanoid);
    
    boundNPCs.forEach(boundNPC => {
        // Find potential initiators
        const potentialInitiators = room.creatures.filter(n => 
            n && !n.bound && n.isHumanoid && n !== boundNPC && 
            wouldNPCInitiate(n, boundNPC)
        );
        
        if (potentialInitiators.length === 0) return;
        
        // Pick a random initiator
        const initiator = potentialInitiators[Math.floor(Math.random() * potentialInitiators.length)];
        const gender1 = (initiator.gender || "").toLowerCase();
        const gender2 = (boundNPC.gender || "").toLowerCase();
        
        // Generate appropriate text
        let line = "";
        if (gender1 === "male") {
            // Male taking advantage - more direct
            const verb = Math.random() < 0.5 ? "uses" : "takes advantage of";
            line = `${initiator.name || "The " + initiator.species} ${verb} ${boundNPC.name || "the bound " + boundNPC.species} for their own satisfaction.`;
        } else {
            // Female - more selective
            const verb = Math.random() < 0.5 ? "releases" : "helps";
            line = `${initiator.name || "The " + initiator.species} ${verb} ${boundNPC.name || "the bound " + boundNPC.species} from their bonds, taking a moment for themselves.`;
        }
        
        lines.push(line);
        
        // Apply state changes
        initiator.memory.arousal = Math.min(100, (initiator.memory.arousal || 0) + 15);
        boundNPC.memory.arousal = Math.min(100, (boundNPC.memory.arousal || 0) + 10);
        
        // Increase disinhibition for both
        initiator.memory.disinhibition = Math.min(100, (initiator.memory.disinhibition || 0) + 5);
        boundNPC.memory.disinhibition = Math.min(100, (boundNPC.memory.disinhibition || 0) + 3);
        
        // Track this interaction
        if (!initiator.memory.partners) initiator.memory.partners = [];
        if (!boundNPC.memory.partners) boundNPC.memory.partners = [];
        
        // Only track if they don't have many partners already (unless promiscuous)
        const traits = initiator.personalityTraits || [];
        if (traits.includes("promiscuous") || initiator.memory.partners.length < 3) {
            if (!initiator.memory.partners.includes(boundNPC.id)) {
                initiator.memory.partners.push(boundNPC.id);
            }
            if (!boundNPC.memory.partners.includes(initiator.id)) {
                boundNPC.memory.partners.push(initiator.id);
            }
        }
    });
    
    return lines;
}

// Process NPC-to-NPC social/romantic interactions in a room
function processNPCToNPCInteractions(room) {
    if (!room || !Array.isArray(room.creatures)) return [];
    
    const lines = [];
    const humanoids = room.creatures.filter(n => n && n.isHumanoid && !n.bound && !n.dead && !n.unconscious);
    
    if (humanoids.length < 2) return lines;
    
    // Shuffle for randomness
    for (let i = humanoids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [humanoids[i], humanoids[j]] = [humanoids[j], humanoids[i]];
    }
    
    // Try to form pairs
    for (let i = 0; i < humanoids.length - 1; i++) {
        for (let j = i + 1; j < humanoids.length; j++) {
            const npc1 = humanoids[i];
            const npc2 = humanoids[j];
            
            // Skip if already processed
            if (npc1._interactionPartner || npc2._interactionPartner) continue;
            
            // Check if they would interact
            if (!wouldNPCInitiate(npc1, npc2)) continue;
            
            // Mark them as paired
            npc1._interactionPartner = npc2.id;
            npc2._interactionPartner = npc1.id;
            
            // Generate interaction text
            const traits1 = npc1.personalityTraits || [];
            const traits2 = npc2.personalityTraits || [];
            const hasPromiscuous = traits1.includes("promiscuous") || traits2.includes("promiscuous");
            
            let line;
            if (hasPromiscuous) {
                line = `${npc1.name || "The " + npc1.species} and ${npc2.name || "the " + npc2.species} share an intimate moment together.`;
            } else {
                const verbs = ["flirt", "chat closely", "whisper to", "share a smile with"];
                const verb = verbs[Math.floor(Math.random() * verbs.length)];
                line = `${npc1.name || "The " + npc1.species} ${verb} ${npc2.name || "the " + npc2.species}.`;
            }
            
            lines.push(line);
            
            // Apply state changes based on interaction intensity
            const arousalGain = hasPromiscuous ? 8 : 4;
            const disinhibitionGain = hasPromiscuous ? 4 : 2;
            
            npc1.memory.arousal = Math.min(100, (npc1.memory.arousal || 0) + arousalGain);
            npc2.memory.arousal = Math.min(100, (npc2.memory.arousal || 0) + arousalGain);
            
            npc1.memory.disinhibition = Math.min(100, (npc1.memory.disinhibition || 0) + disinhibitionGain);
            npc2.memory.disinhibition = Math.min(100, (npc2.memory.disinhibition || 0) + disinhibitionGain);
            
            // Track relationship
            if (!npc1.memory.attractionTo || typeof npc1.memory.attractionTo !== "object") {
                npc1.memory.attractionTo = {};
            }
            if (!npc2.memory.attractionTo || typeof npc2.memory.attractionTo !== "object") {
                npc2.memory.attractionTo = {};
            }
            
            npc1.memory.attractionTo[npc2.id] = Math.min(100, (npc1.memory.attractionTo[npc2.id] || 0) + 5);
            npc2.memory.attractionTo[npc1.id] = Math.min(100, (npc2.memory.attractionTo[npc1.id] || 0) + 5);
            
            break; // Move to next NPC after finding a pair
        }
    }
    
    return lines;
}

// Main function to process all NPC-to-NPC arousal scenarios
function processNPCArousalInteractions(roomMap) {
    if (!roomMap || typeof roomMap !== "object") return [];
    
    const allLines = [];
    
    Object.values(roomMap).forEach(room => {
        if (!room || !room.creatures || !Array.isArray(room.creatures)) return;
        
        // Process bound NPC scenarios first (more urgent)
        const boundLines = processBoundNPCScenarios(room);
        allLines.push(...boundLines);
        
        // Process normal NPC-to-NPC interactions
        const interactionLines = processNPCToNPCInteractions(room);
        allLines.push(...interactionLines);
    });
    
    return allLines;
}

function decayNPCStatesInWorld(roomMap, steps = 1) {
    const map = roomMap && typeof roomMap === "object" ? roomMap : {};
    Object.values(map).forEach(room => {
        if (!room || !Array.isArray(room.creatures)) return;
        room.creatures.forEach(npc => decayNPCAffect(npc, steps));
    });
}

// Process slime cum blob absorption for all slimes in the world
// Called from the engine's advanceStoryTurn via typeof guard
function settleSlimeCumAbsorptionInWorld(roomMap) {
    const map = roomMap && typeof roomMap === "object" ? roomMap : {};
    Object.values(map).forEach(room => {
        if (!room || !Array.isArray(room.creatures)) return;
        room.creatures.forEach(npc => {
            if (npc && typeof window.settleSlimeCumAbsorption === "function") {
                const lines = window.settleSlimeCumAbsorption(npc);
                if (Array.isArray(lines) && lines.length > 0) {
                    if (typeof queueTurnNote === "function") {
                        lines.forEach(line => queueTurnNote(line));
                    }
                }
            }
        });
    });
}

// ── GET RANDOM PERSONALITY PROFILE ──────────────────────────────

function getRandomPersonalityProfile(options = {}) {
    function _rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function _randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    const temperament = options.baseTemperament && temperaments.includes(options.baseTemperament)
        ? options.baseTemperament
        : _rand(temperaments);

    const archetype = _rand(ARCHETYPES);

    // 2-3 unique traits
    const traits = [];
    let availableTraits = PERSONALITY_TRAITS.slice();
    while (traits.length < 3) {
        const pick = _rand(availableTraits);
        if (!traits.includes(pick)) {
            traits.push(pick);
            availableTraits = availableTraits.filter(t => t !== pick);
        }
    }

    // 1-2 quirks
    const quirks = [];
    let availableQuirks = QUIRKS.slice();
    const quirkCount = _randInt(1, 2);
    while (quirks.length < quirkCount) {
        const pick = _rand(availableQuirks);
        if (!quirks.includes(pick)) {
            quirks.push(pick);
            availableQuirks = availableQuirks.filter(q => q !== pick);
        }
    }

    // Big Five by archetype
    const bigFiveMap = {
        schemer:   { openness: 8, conscientiousness: 7, extraversion: 4, agreeableness: 3, neuroticism: 5 },
        hero:      { openness: 6, conscientiousness: 8, extraversion: 7, agreeableness: 6, neuroticism: 2 },
        outsider:  { openness: 7, conscientiousness: 4, extraversion: 2, agreeableness: 4, neuroticism: 7 },
        sage:      { openness: 9, conscientiousness: 7, extraversion: 4, agreeableness: 7, neuroticism: 3 },
        guardian:  { openness: 5, conscientiousness: 9, extraversion: 5, agreeableness: 7, neuroticism: 3 },
        scoundrel: { openness: 6, conscientiousness: 3, extraversion: 8, agreeableness: 2, neuroticism: 5 },
        romantic:  { openness: 7, conscientiousness: 5, extraversion: 7, agreeableness: 8, neuroticism: 6 },
        explorer:  { openness: 9, conscientiousness: 4, extraversion: 6, agreeableness: 5, neuroticism: 4 },
        martyr:    { openness: 6, conscientiousness: 8, extraversion: 4, agreeableness: 9, neuroticism: 7 },
        trickster: { openness: 8, conscientiousness: 3, extraversion: 8, agreeableness: 4, neuroticism: 4 },
        caretaker: { openness: 6, conscientiousness: 8, extraversion: 5, agreeableness: 9, neuroticism: 5 },
        destroyer: { openness: 4, conscientiousness: 3, extraversion: 6, agreeableness: 2, neuroticism: 7 }
    };

    const base = bigFiveMap[archetype] || 
        { openness: 5, conscientiousness: 5, extraversion: 5, agreeableness: 5, neuroticism: 5 };

    const bigFive = {
        openness:          Math.max(1, Math.min(10, base.openness          + _randInt(-2, 2))),
        conscientiousness: Math.max(1, Math.min(10, base.conscientiousness + _randInt(-2, 2))),
        extraversion:      Math.max(1, Math.min(10, base.extraversion      + _randInt(-2, 2))),
        agreeableness:     Math.max(1, Math.min(10, base.agreeableness     + _randInt(-2, 2))),
        neuroticism:       Math.max(1, Math.min(10, base.neuroticism       + _randInt(-2, 2)))
    };

    return {
        temperament,
        archetype,
        traits,
        quirks,
        bigFive
    };
}

// ── GET RANDOM AGE ───────────────────────────────────────────────

function getRandomAge(category = null) {
    function _randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    if (category === "young")       return _randInt(18, 25);
    if (category === "adult")       return _randInt(26, 45);
    if (category === "middle-aged") return _randInt(46, 60);
    if (category === "elderly")     return _randInt(61, 80);
    return _randInt(18, 80);
}

// ── GET AGE CATEGORY BY ROLE ─────────────────────────────────────

function getAgeCategoryForRole(role, archetype) {
    if (["Innkeeper", "Healer", "Blacksmith", "Clothier", "Priest", "Archivist", "Shopkeeper"].includes(role) ||
        ["sage", "caretaker", "guardian"].includes(archetype)) {
        return ["adult", "middle-aged", "elderly"][Math.floor(Math.random() * 3)];
    }
    if (["Adventurer", "Bartender", "Patron", "Guest", "Scout", "Delver"].includes(role) ||
        ["hero", "romantic", "scoundrel"].includes(archetype)) {
        return ["young", "adult"][Math.floor(Math.random() * 2)];
    }
    if (["Town Guard", "Stone Guard", "Raider", "Scavenger", "Miner", "Cultist"].includes(role)) {
        return ["young", "adult", "middle-aged"][Math.floor(Math.random() * 3)];
    }
    return ["young", "adult", "middle-aged"][Math.floor(Math.random() * 3)];
}

// ── GENERATE NPC BEHAVIOR ────────────────────────────────────────

function generateNPCBehavior(npc) {
    if (isSlimeNPC(npc)) return getNPCVisibleBehavior(npc);
    function _rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    ensureNPCRelationshipState(npc);

    const hostility   = npc.hostility == null ? 50 : npc.hostility;
    const mood        = npc.memory && npc.memory.lastMood || "neutral";
    const favor       = npc.memory && npc.memory.favorability != null ? npc.memory.favorability : 0;
    const attraction  = npc.memory && npc.memory.attraction != null ? npc.memory.attraction : 0;
    const arousal     = npc.memory && npc.memory.arousal != null ? npc.memory.arousal : 0;
    const disposition = getCurrentNPCDisposition(npc);
    const traits      = npc.personalityProfile && npc.personalityProfile.traits || npc.personalityTraits || ["neutral"];

    const behaviorMatrix = {
        calm:       ["Appears calm", "Appears collected", "Is relaxed", "Seems at ease"],
        friendly:   ["Seems friendly", "Smiles at you", "Appears welcoming", "Greets you warmly"],
        aggressive: ["Is glaring at you", "Is ready to lunge", "Eyes you with hostility", "Seems like they want to fight"],
        hostile:    ["Appears agitated", "Looks ready to attack", "Seems on edge", "Is glaring at you"],
        neutral:    ["Seems indifferent", "Is observing you", "Appears neutral"],
        curious:    ["Is eyeing you curiously", "Seems intrigued", "Appears to be examining you"],
        skittish:   ["Looks nervous", "Appears skittish", "Flinches at sudden movements"],
        wary:       ["Is on edge", "Seems cautious", "Keeps a close eye on you"]
    };

    const personalityFlairs = {
        bold:       ["Stands tall with confidence", "Locks eyes without hesitation"],
        joker:      ["Grins mischievously", "Flashes a sly smile"],
        flirt:      ["Smirks playfully", "Gives you a suggestive glance"],
        grump:      ["Scowls and mutters under their breath", "Looks perpetually unimpressed"],
        serious:    ["Keeps a firm focused expression", "Maintains strict posture"],
        studious:   ["Seems lost in thought", "Peers at a notebook"],
        helpful:    ["Looks eager to assist", "Nods as if awaiting your request"],
        aloof:      ["Glances past you disinterestedly", "Keeps their distance"],
        moody:      ["Sighs heavily", "Shifts moodily from foot to foot"],
        cheerful:   ["Beams with cheerful energy", "Grins ear to ear"],
        shy:        ["Avoids eye contact", "Keeps a low profile"],
        dramatic:   ["Strikes a theatrical pose", "Sighs dramatically"],
        sarcastic:  ["Rolls their eyes", "Raises an eyebrow skeptically"],
        suspicious: ["Eyes you with mistrust", "Keeps one hand on their purse"],
        excitable:  ["Bounces on their toes", "Talks with rapid enthusiasm"],
        neutral:    ["Watches you with a neutral expression"]
    };

    // Determine base tone
    let baseTone = "neutral";
    if (["furious", "hateful"].includes(disposition) || hostility >= 80) baseTone = "aggressive";
    else if (["hostile", "angry", "unfriendly"].includes(disposition) || hostility >= 60) baseTone = "hostile";
    else if (["affectionate", "warm", "devoted"].includes(disposition) || favor >= 75) baseTone = "friendly";
    else if (["friendly"].includes(disposition) || favor >= 40) baseTone = "calm";
    else if (["wary", "guarded", "cool"].includes(disposition) || favor >= -20) baseTone = "wary";
    else baseTone = "neutral";

    const behaviorOptions = behaviorMatrix[baseTone] || behaviorMatrix["neutral"];

    let behavior = "";
    if      (mood === "furious")                              behavior = behaviorOptions[behaviorOptions.length - 1];
    else if (mood === "angry")                                behavior = behaviorOptions[Math.min(2, behaviorOptions.length - 1)];
    else if (["friendly","warm","affectionate"].includes(mood)) behavior = behaviorOptions[0];
    else                                                      behavior = _rand(behaviorOptions);

    // Add personality flair
    const chosenTrait = Array.isArray(traits) && traits.length ? _rand(traits) : "neutral";
    const flairOptions = personalityFlairs[chosenTrait] || [];
    if (flairOptions.length && Math.random() < 0.8) {
        behavior += `. ${_rand(flairOptions)}`;
    }

    // Older saves may still contain the former feature-to-mannerism template.
    // A physical feature is already described as appearance, not an action.
    const mannerisms = npc.enrichment && Array.isArray(npc.enrichment.mannerisms)
        ? npc.enrichment.mannerisms.filter(function (text) {
            return typeof text === "string" && text.trim() && !/^(?:(?:she|he|they|it)\s+)?draws?\s+attention\s+to\b/i.test(text.trim());
        }) : [];
    if (mannerisms.length && Math.random() < 0.45) {
        behavior += `. ${_rand(mannerisms)}`;
    }

    if (isAdultHumanoidNPC(npc)) {
        if (attraction >= 60 && hostility < 50 && favor >= 10 && Math.random() < 0.35) {
            behavior += ". Their attention lingers on you a little longer than it should.";
        } else if (attraction >= 40 && hostility >= 55 && Math.random() < 0.3) {
            behavior += ". Something in their expression turns tense and conflicted.";
        } else if (arousal >= 55 && Math.random() < 0.35) {
            behavior += ". They look momentarily flustered before steadying themselves.";
        }
    }

    return behavior;
}

// ── GENERATE POSTURE OR ACTION ───────────────────────────────────

function generatePostureOrAction(temperament) {
    function _rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    const behaviorMatrix = {
        calm:       ["is breathing steadily", "is sitting calmly", "is standing peacefully"],
        friendly:   ["is smiling warmly", "is giving you a friendly nod", "is standing in an inviting posture"],
        aggressive: ["is clenching their fists", "is pacing like a predator", "is flexing aggressively"],
        hostile:    ["is baring their teeth", "is glaring intensely", "is standing in a threatening stance"],
        neutral:    ["is standing idly", "is observing the surroundings", "is doing nothing in particular"],
        curious:    ["is tilting their head inquisitively", "is studying you closely", "is watching with interest"],
        skittish:   ["is flinching at sounds", "is shifting nervously", "is backing away slightly"],
        wary:       ["is watching cautiously", "is stepping lightly", "is keeping a safe distance"]
    };

    const actions = behaviorMatrix[String(temperament || "").toLowerCase()]
        || behaviorMatrix["neutral"];

    return _rand(actions);
}

// ============================================================================
// BATHHOUSE PROCEDURAL REGULARS AND RUMORS SYSTEM
// ============================================================================

// Bathhouse regular frequency patterns (how often they visit)
const BATHHOUSE_REGULAR_FREQUENCY = [
    { id: "daily", label: "Daily", chance: 0.15, daysBetween: 1, description: "visits every day" },
    { id: "every_other_day", label: "Every Other Day", chance: 0.25, daysBetween: 2, description: "visits every 2 days" },
    { id: "twice_weekly", label: "Twice Weekly", chance: 0.30, daysBetween: 3, description: "visits twice a week" },
    { id: "weekly", label: "Weekly", chance: 0.20, daysBetween: 7, description: "visits once a week" },
    { id: "biweekly", label: "Bi-weekly", chance: 0.10, daysBetween: 14, description: "visits every 2 weeks" }
];

// Bathhouse regular service preferences (what services they typically request)
const BATHHOUSE_REGULAR_PREFERENCES = [
    { id: "massage_only", label: "Massage Only", chance: 0.20, services: ["bath_manual_stress", "bath_manual_oil", "bath_manual_tension"], description: "prefers therapeutic massage services" },
    { id: "manual_only", label: "Manual Stimulation", chance: 0.15, services: ["bath_manual_stress", "bath_manual_oil", "bath_manual_tension"], description: "enjoys hand-based tension relief" },
    { id: "oral_enthusiast", label: "Oral Enthusiast", chance: 0.20, services: ["bath_oral_deep", "bath_oral_comprehensive", "bath_oral_traveler"], description: "loves oral services" },
    { id: "full_experience", label: "Full Experience", chance: 0.25, services: ["bath_intercourse_full", "bath_intercourse_evening", "bath_intercourse_adventurer"], description: "prefers complete intercourse services" },
    { id: "mixed_tier2", label: "Mixed Tier 2", chance: 0.10, services: ["bath_manual_oil", "bath_oral_deep", "bath_oral_comprehensive"], description: "enjoys both manual and oral" },
    { id: "mixed_all", label: "All Services", chance: 0.10, services: ["bath_manual_stress", "bath_oral_deep", "bath_intercourse_full"], description: "takes advantage of everything available" }
];

// Bathhouse rumor types for word-of-mouth discovery
const BATHHOUSE_RUMOR_TYPES = [
    { id: "heard_from_friend", chance: 0.40, text: "heard from a friend", credibility: 0.8 },
    { id: "overheard_tavern", chance: 0.30, text: "overheard at the tavern", credibility: 0.6 },
    { id: "seen_people_coming", chance: 0.20, text: "seen people looking relaxed after visiting", credibility: 0.7 },
    { id: "traveler_recommendation", chance: 0.10, text: "recommended by a traveler", credibility: 0.9 }
];

// Generate a bathhouse regular profile for an NPC
function generateBathhouseRegularProfile(npc) {
    if (!npc) return null;
    
    // Determine if this NPC should be a regular (about 30% of eligible NPCs)
    if (Math.random() < 0.7) return null;
    
    // Select frequency
    const frequency = selectByChance(BATHHOUSE_REGULAR_FREQUENCY);
    
    // Select preferences based on NPC temperament
    let preference = selectByChance(BATHHOUSE_REGULAR_PREFERENCES);
    
    // Adjust preferences based on traits
    if (npc.traits) {
        if (npc.traits.includes("promiscuous")) {
            // More likely to prefer full services
            preference = BATHHOUSE_REGULAR_PREFERENCES.find(p => p.id === "full_experience") || preference;
        }
        if (npc.traits.includes("professional")) {
            // More likely to prefer massage
            preference = BATHHOUSE_REGULAR_PREFERENCES.find(p => p.id === "massage_only") || preference;
        }
        if (npc.traits.includes("flirty")) {
            // More likely to prefer oral or mixed
            const flirtyPrefs = BATHHOUSE_REGULAR_PREFERENCES.filter(p => 
                p.id === "oral_enthusiast" || p.id === "mixed_tier2" || p.id === "mixed_all");
            preference = flirtyPrefs.length ? flirtyPrefs[Math.floor(Math.random() * flirtyPrefs.length)] : preference;
        }
        if (npc.traits.includes("dominant")) {
            // More likely to prefer full control (intercourse)
            preference = BATHHOUSE_REGULAR_PREFERENCES.find(p => p.id === "full_experience") || preference;
        }
    }
    
    // Generate a stable ID for this regular
    const regularId = "regular-" + (npc.id || npc.name || Math.random().toString(36).slice(2, 8));
    
    return {
        id: regularId,
        npcId: npc.id || npc.name,
        frequency: frequency.id,
        frequencyLabel: frequency.label,
        daysBetween: frequency.daysBetween,
        preference: preference.id,
        preferenceLabel: preference.label,
        preferredServices: preference.services,
        lastVisitTurn: 0,
        totalVisits: 0,
        tipPercentage: Math.floor(Math.random() * 16) + 5, // 5-20%
        // Personality when at bathhouse
        bathhousePersonality: getBathhouseRegularPersonality(npc)
    };
}

// Select an item from an array based on chance weights
function selectByChance(array) {
    if (!array || !array.length) return null;
    
    const total = array.reduce((sum, item) => sum + (item.chance || 0), 0);
    if (total <= 0) return array[0];
    
    let random = Math.random() * total;
    for (const item of array) {
        random -= item.chance || 0;
        if (random <= 0) return item;
    }
    return array[0];
}

// Get personality descriptor for bathhouse regulars
function getBathhouseRegularPersonality(npc) {
    if (!npc) return "quiet and discrete";
    
    const personalities = [
        "quiet and discrete",
        "friendly and chatty",
        "businesslike and efficient",
        "relaxed and content",
        "appreciative and generous",
        "shy but curious",
        "experienced and knowing",
        "playful and teasing",
        "serious and focused",
        "grateful and polite"
    ];
    
    // Adjust based on traits
    if (npc.traits) {
        if (npc.traits.includes("flirty")) return "playful and teasing";
        if (npc.traits.includes("professional")) return "businesslike and efficient";
        if (npc.traits.includes("dominant")) return "experienced and knowing";
        if (npc.traits.includes("shy")) return "shy but curious";
    }
    
    return personalities[Math.floor(Math.random() * personalities.length)];
}

// Generate bathhouse rumor for an NPC to discover services
function generateBathhouseRumor(npc, ctx) {
    if (!npc) return null;
    
    // Check if NPC already knows about bathhouse
    if (npc.bathhouseAware) return null;
    
    // Determine if this NPC should learn about bathhouse (based on social connections)
    const chance = 0.05; // 5% chance per eligible interaction
    if (Math.random() >= chance) return null;
    
    // Select rumor type
    const rumorType = selectByChance(BATHHOUSE_RUMOR_TYPES);
    
    // Determine who told them (if applicable)
    let source = null;
    if (rumorType.id === "heard_from_friend" && ctx && ctx.room && ctx.room.creatures) {
        // Find a potential source NPC who already knows
        const potentialSources = ctx.room.creatures.filter(c => 
            c && c !== npc && c.bathhouseAware && !c.dead && c.hp > 0);
        if (potentialSources.length) {
            source = potentialSources[Math.floor(Math.random() * potentialSources.length)];
        }
    }
    
    return {
        id: "rumor-" + (npc.id || npc.name || "") + "-" + Date.now(),
        type: rumorType.id,
        typeLabel: rumorType.text,
        credibility: rumorType.credibility,
        source: source ? { id: source.id, name: source.name } : null,
        turnDiscovered: ctx && ctx.storyTurn ? ctx.storyTurn : 0,
        roomId: ctx && ctx.room ? ctx.room.coords : null
    };
}

// Check if NPC should visit bathhouse today
function shouldNPCVisitBathhouseToday(npc, currentTurn) {
    if (!npc || !npc.bathhouseRegular) return false;
    
    const regular = npc.bathhouseRegular;
    const lastVisit = regular.lastVisitTurn || 0;
    const daysBetween = regular.daysBetween || 7;
    
    // Check if enough time has passed
    const daysSinceLastVisit = currentTurn - lastVisit;
    if (daysSinceLastVisit < daysBetween) return false;
    
    // Additional random chance to visit even if not due (for variety)
    if (Math.random() < 0.2) return true;
    
    return true;
}

// Mark NPC as having visited bathhouse today
function markBathhouseVisit(npc, currentTurn) {
    if (!npc || !npc.bathhouseRegular) return;
    
    npc.bathhouseRegular.lastVisitTurn = currentTurn;
    npc.bathhouseRegular.totalVisits = (npc.bathhouseRegular.totalVisits || 0) + 1;
}

// ============================================================================
// NPC-to-NPC BATHHOUSE SERVICE REQUESTS & PLAYER AS PROVIDER
// ============================================================================

// Service provider types
const BATHHOUSE_PROVIDER_TYPES = {
    STAFF: "staff",           // BathhouseAttendant, BathhousePractitioner, Bathkeeper
    PLAYER: "player",         // Player working at bathhouse
    FREELANCE: "freelance"   // NPC providing services independently
};

// Service request states
const BATHHOUSE_REQUEST_STATES = {
    PENDING: "pending",       // Request made, waiting for response
    ACCEPTED: "accepted",     // Provider accepted, service in progress
    DECLINED: "declined",     // Provider declined
    COMPLETED: "completed",   // Service finished
    CANCELLED: "cancelled"   // Request cancelled
};

// Generate a service request from one NPC to another (or player)
function generateBathhouseServiceRequest(requester, provider, ctx) {
    if (!requester || !provider) return null;
    
    // Determine if requester can make this request
    if (!canNPCRequestBathhouseService(requester)) return null;
    
    // Determine if provider can accept requests
    if (!canNPCProvideBathhouseService(provider)) return null;
    
    // Select appropriate service based on preferences
    const service = selectServiceForNPC(requester, provider);
    if (!service) return null;
    
    // Generate request ID
    const requestId = "bath-request-" + (requester.id || requester.name || "req") + "-" + 
                      (provider.id || provider.name || "prov") + "-" + (ctx.storyTurn || 0);
    
    // Determine price (provider may have different rates)
    const basePrice = getBathhouseServiceCost(service);
    const finalPrice = applyProviderPriceModifier(provider, basePrice);
    
    return {
        id: requestId,
        requesterId: requester.id || requester.name,
        requesterName: requester.name,
        requesterGender: requester.gender,
        requesterSpecies: requester.species,
        providerId: provider.id || provider.name,
        providerName: provider.isPlayer ? "You" : (provider.name || "Someone"),
        providerType: getProviderType(provider),
        serviceId: service,
        serviceName: getBathhouseServiceName(service),
        basePrice: basePrice,
        finalPrice: finalPrice,
        bathhouseCut: Math.round(finalPrice * 0.30), // 30% to bathhouse
        providerEarnings: finalPrice - Math.round(finalPrice * 0.30), // 70% to provider
        state: BATHHOUSE_REQUEST_STATES.PENDING,
        turnCreated: ctx.storyTurn || 0,
        turnAccepted: 0,
        turnCompleted: 0,
        location: ctx.room ? ctx.room.coords : null,
        tipAmount: 0,
        tipPercentage: 0,
        // Personality context for narration
        requesterMood: getRequesterMood(requester),
        providerStyle: getProviderStyle(provider),
        // Gender/orientation compatibility
        isCompatible: checkServiceCompatibility(requester, provider, service),
        compatibilityNote: getCompatibilityNote(requester, provider, service)
    };
}

// Check if NPC can request bathhouse services
function canNPCRequestBathhouseService(npc) {
    if (!npc || npc.dead || npc.hp <= 0 || npc.unconscious) return false;
    
    // Must be humanoid
    if (npc.isHumanoid !== true) return false;
    
    // Must have arousal/need (or be a regular)
    if (npc.bathhouseRegular) return true;
    if (npc.bathhouseAware) return true;
    
    // Check if they have high arousal or need for release
    if (npc.arousal && npc.arousal >= 50) return true;
    
    // Check if they have tension/stress that could use massage
    if (npc.stress || npc.tension) return true;
    
    return false;
}

// Check if NPC can provide bathhouse services
function canNPCProvideBathhouseService(npc) {
    if (!npc) return false;
    
    // Player is always a potential provider if qualified
    if (npc.isPlayer) {
        // Player must be qualified or working at bathhouse
        return true; // Will be checked more specifically in engine
    }
    
    // Must be humanoid and alive
    if (npc.isHumanoid !== true || npc.dead || npc.hp <= 0 || npc.unconscious) return false;
    
    // Staff roles can always provide
    if (npc.role === "BathhouseAttendant" || npc.role === "BathhousePractitioner" || npc.role === "Bathkeeper") {
        return true;
    }
    
    // Freelance providers (marked as such)
    if (npc.bathhouseProvider === true) return true;
    
    // NPCs with relevant traits might provide independently
    if (npc.traits && (npc.traits.includes("promiscuous") || npc.traits.includes("flirty"))) {
        return Math.random() < 0.5; // 50% chance they provide services
    }
    
    return false;
}

// Select appropriate service for NPC based on preferences
function selectServiceForNPC(requester, provider) {
    // If requester has regular profile, use their preferences
    if (requester.bathhouseRegular && requester.bathhouseRegular.preferredServices) {
        const preferred = requester.bathhouseRegular.preferredServices;
        const available = getAvailableServices(provider);
        
        // Find intersection of preferred and available
        const matching = preferred.filter(s => available.includes(s));
        if (matching.length) return matching[Math.floor(Math.random() * matching.length)];
    }
    
    // Fall back to random available service from provider
    const available = getAvailableServices(provider);
    if (available.length) return available[Math.floor(Math.random() * available.length)];
    
    return null;
}

// Get services available from a provider
function getAvailableServices(provider) {
    // All bathhouse services
    const allServices = [
        "bath_manual_stress", "bath_manual_oil", "bath_manual_tension",
        "bath_oral_deep", "bath_oral_comprehensive", "bath_oral_traveler",
        "bath_intercourse_full", "bath_intercourse_evening", "bath_intercourse_adventurer"
    ];
    
    // Staff can provide all services
    if (provider.role === "BathhousePractitioner" || provider.role === "Bathkeeper") {
        return allServices;
    }
    
    // Attendants can only provide manual services
    if (provider.role === "BathhouseAttendant") {
        return ["bath_manual_stress", "bath_manual_oil", "bath_manual_tension"];
    }
    
    // Player can provide based on their training/qualification
    if (provider.isPlayer) {
        // Check if player is qualified for massage
        const qualified = typeof bathhouseQualified === "function" ? bathhouseQualified(provider.currentRoom) : false;
        if (qualified) {
            return allServices;
        }
        return ["bath_manual_stress", "bath_manual_oil", "bath_manual_tension"];
    }
    
    // Freelance providers - limit based on their skills
    return allServices.slice(0, 3); // Only manual services for non-staff
}

// Get provider type
function getProviderType(provider) {
    if (!provider) return BATHHOUSE_PROVIDER_TYPES.FREELANCE;
    
    if (provider.isPlayer) return BATHHOUSE_PROVIDER_TYPES.PLAYER;
    
    if (provider.role === "BathhouseAttendant" || provider.role === "BathhousePractitioner" || 
        provider.role === "Bathkeeper") {
        return BATHHOUSE_PROVIDER_TYPES.STAFF;
    }
    
    return BATHHOUSE_PROVIDER_TYPES.FREELANCE;
}

// Get service cost (placeholder - will use actual function if available)
function getBathhouseServiceCost(serviceId) {
    if (typeof window !== "undefined" && typeof window.getBathhouseServiceCost === "function") {
        return window.getBathhouseServiceCost(serviceId);
    }
    
    // Default prices matching NSFW definitions
    const prices = {
        bath_manual_stress: 40,
        bath_manual_oil: 50,
        bath_manual_tension: 60,
        bath_oral_deep: 100,
        bath_oral_comprehensive: 120,
        bath_oral_traveler: 130,
        bath_intercourse_full: 150,
        bath_intercourse_evening: 170,
        bath_intercourse_adventurer: 200
    };
    return prices[serviceId] || 100;
}

// Get service name
function getBathhouseServiceName(serviceId) {
    const names = {
        bath_manual_stress: "Dungeon Delver's Rub",
        bath_manual_oil: "Herbal Oil Release",
        bath_manual_tension: "Adventurer's Ease",
        bath_oral_deep: "Delver's Deep Relief",
        bath_oral_comprehensive: "Full Exploration",
        bath_oral_traveler: "Road-Worn Solace",
        bath_intercourse_full: "Complete Unburdening",
        bath_intercourse_evening: "Moonlit Respite",
        bath_intercourse_adventurer: "Adventurer's Respite"
    };
    return names[serviceId] || serviceId;
}

// Apply provider's price modifier
function applyProviderPriceModifier(provider, basePrice) {
    if (!provider) return basePrice;
    
    // Staff follow standard pricing
    if (provider.role === "BathhouseAttendant" || provider.role === "BathhousePractitioner" || 
        provider.role === "Bathkeeper") {
        return basePrice;
    }
    
    // Player might charge differently based on charisma
    if (provider.isPlayer && provider.stats) {
        const charisma = provider.stats.CHA || 10;
        if (charisma >= 15) return Math.round(basePrice * 1.10); // 10% premium for high charisma
        if (charisma <= 8) return Math.round(basePrice * 0.90); // 10% discount for low charisma
    }
    
    // Freelance providers might adjust prices
    if (provider.bathhouseProvider === true) {
        // Random variation: 80-120% of base
        return Math.round(basePrice * (0.8 + Math.random() * 0.4));
    }
    
    return basePrice;
}

// Get requester mood description
function getRequesterMood(npc) {
    if (!npc) return "polite";
    
    const arousal = npc.arousal || 0;
    const tension = npc.tension || npc.stress || 0;
    
    if (arousal >= 80) return "urgent and needy";
    if (arousal >= 60) return "eager and flushed";
    if (arousal >= 40) return "interested and curious";
    if (tension >= 70) return "tense and stressed";
    if (tension >= 40) return "weary and sore";
    
    return "polite and casual";
}

// Get provider style description
function getProviderStyle(provider) {
    if (!provider) return "professional";
    
    if (provider.traits) {
        if (provider.traits.includes("dominant")) return "firm and commanding";
        if (provider.traits.includes("flirty")) return "playful and teasing";
        if (provider.traits.includes("professional")) return "polished and businesslike";
    }
    
    if (provider.role === "BathhousePractitioner" || provider.role === "Bathkeeper") {
        return "skilled and experienced";
    }
    
    return "welcoming and warm";
}

// Check service compatibility (gender/orientation aware)
function checkServiceCompatibility(requester, provider, serviceId) {
    if (!requester || !provider) return true;
    
    const service = getBathhouseServiceDefinition(serviceId);
    if (!service) return true;
    
    // Manual services are always compatible
    if (service.tier === 'manual') return true;
    
    // For oral and intercourse, check gender compatibility
    if (service.compatibleWith) {
        const gender = String(requester.gender || "male").toLowerCase();
        if (!service.compatibleWith.includes(gender)) {
            return false;
        }
    }
    
    // Check anatomy and orientation if NSFW system available
    if (typeof window !== "undefined" && typeof window.isServiceCompatible === "function") {
        const result = window.isServiceCompatible(serviceId, requester, provider);
        return result.compatible;
    }
    
    // SFW fallback: assume compatible
    return true;
}

// Get detailed compatibility check with reasons
function getServiceCompatibilityDetails(serviceId, requester, provider) {
    if (!requester || !provider) {
        return { compatible: true, reason: "no_data", narration: "" };
    }
    
    const service = getBathhouseServiceDefinition(serviceId);
    if (!service) {
        return { compatible: false, reason: "unknown_service", narration: "Unknown service." };
    }
    
    // Manual services are always compatible
    if (service.tier === 'manual') {
        return { compatible: true, reason: "manual_service", narration: "" };
    }
    
    // Check gender compatibility
    if (service.compatibleWith) {
        const gender = String(requester.gender || "male").toLowerCase();
        if (!service.compatibleWith.includes(gender)) {
            return {
                compatible: false,
                reason: "gender_incompatible",
                narration: requester.name + "'s gender is not suitable for this service."
            };
        }
    }
    
    // Use NSFW compatibility if available
    if (typeof window !== "undefined" && typeof window.getServiceCompatibilityDetails === "function") {
        return window.getServiceCompatibilityDetails(serviceId, requester, provider);
    }
    
    return { compatible: true, reason: "compatible", narration: "" };
}

// Get bathhouse service definition
function getBathhouseServiceDefinition(serviceId) {
    // Try to get from window first (NSFW loaded)
    if (typeof window !== "undefined" && window.BATHHOUSE_SERVICES && window.BATHHOUSE_SERVICES[serviceId]) {
        return window.BATHHOUSE_SERVICES[serviceId];
    }
    
    // Fallback to local definition
    const localServices = {
        bath_manual_stress: { tier: 'manual', compatibleWith: ['male', 'female', 'neutral', 'nonbinary'] },
        bath_manual_oil: { tier: 'manual', compatibleWith: ['male', 'female', 'neutral', 'nonbinary'] },
        bath_manual_tension: { tier: 'manual', compatibleWith: ['male', 'female', 'neutral', 'nonbinary'] },
        bath_oral_deep: { tier: 'oral', compatibleWith: ['male', 'female', 'neutral', 'nonbinary'] },
        bath_oral_comprehensive: { tier: 'oral', compatibleWith: ['male', 'female', 'neutral', 'nonbinary'] },
        bath_oral_traveler: { tier: 'oral', compatibleWith: ['male', 'female', 'neutral', 'nonbinary'] },
        bath_intercourse_full: { tier: 'intercourse', compatibleWith: ['male', 'female', 'neutral', 'nonbinary'] },
        bath_intercourse_evening: { tier: 'intercourse', compatibleWith: ['male', 'female', 'neutral', 'nonbinary'] },
        bath_intercourse_adventurer: { tier: 'intercourse', compatibleWith: ['male', 'female', 'neutral', 'nonbinary'] }
    };
    
    return localServices[serviceId] || null;
}

// Get compatibility note for narration
function getCompatibilityNote(requester, provider, serviceId) {
    const details = getServiceCompatibilityDetails(serviceId, requester, provider);
    if (!details.compatible) {
        return details.narration;
    }
    return "";
}

// ============================================================================
// BATHHOUSE REPUTATION AND CLIENT RELATIONSHIP SYSTEM
// ============================================================================

// Bathhouse reputation levels
const BATHHOUSE_REPUTATION_LEVELS = {
    UNKNOWN: { id: 'unknown', label: 'Unknown', value: 0, description: 'Has not visited yet' },
    NEWCOMER: { id: 'newcomer', label: 'Newcomer', value: 1, description: 'First visit' },
    REGULAR: { id: 'regular', label: 'Regular', value: 2, description: 'Visits occasionally' },
    FREQUENT: { id: 'frequent', label: 'Frequent Guest', value: 3, description: 'Visits often' },
    PREFERRED: { id: 'preferred', label: 'Preferred Client', value: 4, description: 'Frequent visitor, gets priority' },
    VIP: { id: 'vip', label: 'VIP', value: 5, description: 'Very important patron' }
};

// Client satisfaction levels
const CLIENT_SATISFACTION_LEVELS = {
    DISSATISFIED: { id: 'dissatisfied', label: 'Dissatisfied', value: 1, mood: -10, description: 'Very unhappy with service' },
    UNSATISFIED: { id: 'unsatisfied', label: 'Unsatisfied', value: 2, mood: -5, description: 'Not happy with service' },
    NEUTRAL: { id: 'neutral', label: 'Neutral', value: 3, mood: 0, description: 'Service was adequate' },
    SATISFIED: { id: 'satisfied', label: 'Satisfied', value: 4, mood: 5, description: 'Happy with service' },
    VERY_SATISFIED: { id: 'very_satisfied', label: 'Very Satisfied', value: 5, mood: 10, description: 'Extremely pleased' }
};

// Get reputation level from value
function getReputationLevel(value) {
    const levels = Object.values(BATHHOUSE_REPUTATION_LEVELS);
    for (let i = levels.length - 1; i >= 0; i--) {
        if (value >= levels[i].value) {
            return levels[i];
        }
    }
    return BATHHOUSE_REPUTATION_LEVELS.UNKNOWN;
}

// Get satisfaction level from value
function getSatisfactionLevel(value) {
    const levels = Object.values(CLIENT_SATISFACTION_LEVELS);
    for (let i = levels.length - 1; i >= 0; i--) {
        if (value >= levels[i].value) {
            return levels[i];
        }
    }
    return CLIENT_SATISFACTION_LEVELS.NEUTRAL;
}

// Update client reputation and satisfaction after service
function updateClientRelationship(npc, provider, serviceId, satisfactionRating) {
    if (!npc || !provider) return;
    
    // Initialize bathhouse profile if doesn't exist
    npc.bathhouseProfile = npc.bathhouseProfile || {};
    
    // Update visit count
    npc.bathhouseProfile.totalVisits = (npc.bathhouseProfile.totalVisits || 0) + 1;
    
    // Update reputation based on visits
    const visits = npc.bathhouseProfile.totalVisits;
    if (visits === 1) {
        npc.bathhouseProfile.reputation = BATHHOUSE_REPUTATION_LEVELS.NEWCOMER.value;
    } else if (visits >= 2 && visits < 5) {
        npc.bathhouseProfile.reputation = BATHHOUSE_REPUTATION_LEVELS.REGULAR.value;
    } else if (visits >= 5 && visits < 10) {
        npc.bathhouseProfile.reputation = BATHHOUSE_REPUTATION_LEVELS.FREQUENT.value;
    } else if (visits >= 10 && visits < 20) {
        npc.bathhouseProfile.reputation = BATHHOUSE_REPUTATION_LEVELS.PREFERRED.value;
    } else if (visits >= 20) {
        npc.bathhouseProfile.reputation = BATHHOUSE_REPUTATION_LEVELS.VIP.value;
    }
    
    // Update satisfaction rating
    const currentSatisfaction = npc.bathhouseProfile.satisfaction || CLIENT_SATISFACTION_LEVELS.NEUTRAL.value;
    const satisfaction = Math.min(5, Math.max(1, currentSatisfaction + (satisfactionRating || 0)));
    npc.bathhouseProfile.satisfaction = satisfaction;
    
    // Track provider-specific relationship
    if (!provider.isPlayer) {
        // For NPC providers, track on the client
        npc.bathhouseProfile.providerRelationships = npc.bathhouseProfile.providerRelationships || {};
        const providerId = provider.id || provider.name;
        npc.bathhouseProfile.providerRelationships[providerId] = {
            visits: (npc.bathhouseProfile.providerRelationships[providerId]?.visits || 0) + 1,
            satisfaction: satisfaction,
            lastService: serviceId,
            lastVisit: npc.bathhouseProfile.lastVisit || 0
        };
    } else {
        // For player provider, track separately
        npc.bathhouseProfile.playerProvider = {
            visits: (npc.bathhouseProfile.playerProvider?.visits || 0) + 1,
            satisfaction: satisfaction,
            lastService: serviceId,
            lastVisit: npc.bathhouseProfile.lastVisit || 0
        };
    }
    
    // Update last visit
    npc.bathhouseProfile.lastVisit = getCurrentStoryTurn ? getCurrentStoryTurn() : 0;
    
    // Apply mood bonus based on satisfaction
    const satisfactionLevel = getSatisfactionLevel(satisfaction);
    if (satisfactionLevel.mood) {
        // Apply temporary mood boost
        if (npc.memory) {
            npc.memory.mood = Math.max(0, Math.min(100, (npc.memory.mood || 50) + satisfactionLevel.mood));
        }
    }
}

// Get client discount based on reputation
function getClientDiscount(npc) {
    if (!npc || !npc.bathhouseProfile) return 0;
    
    const reputation = npc.bathhouseProfile.reputation || 0;
    const satisfaction = npc.bathhouseProfile.satisfaction || 3;
    
    // Reputation-based discount
    let discount = 0;
    if (reputation >= BATHHOUSE_REPUTATION_LEVELS.PREFERRED.value) {
        discount = 10; // 10% discount for preferred/VIP
    } else if (reputation >= BATHHOUSE_REPUTATION_LEVELS.FREQUENT.value) {
        discount = 5; // 5% discount for frequent guests
    }
    
    // Satisfaction bonus
    if (satisfaction >= CLIENT_SATISFACTION_LEVELS.VERY_SATISFIED.value) {
        discount += 5; // Additional 5% for very satisfied clients
    }
    
    return Math.min(20, discount); // Cap at 20%
}

// Get service with client discount applied
function getDiscountedServicePrice(serviceId, npc) {
    const basePrice = getBathhouseServiceCost(serviceId);
    const discount = getClientDiscount(npc);
    return Math.round(basePrice * (1 - discount / 100));
}

// Get client preference description
function getClientPreferenceDescription(npc) {
    if (!npc || !npc.bathhouseProfile) return "";
    
    const profile = npc.bathhouseProfile;
    const reputation = getReputationLevel(profile.reputation);
    const satisfaction = getSatisfactionLevel(profile.satisfaction);
    
    const desc = [];
    desc.push("Reputation: " + reputation.label);
    desc.push("Satisfaction: " + satisfaction.label);
    
    if (profile.totalVisits) {
        desc.push("Total Visits: " + profile.totalVisits);
    }
    
    return desc.join(", ");
}

// Check if client gets priority service
function clientGetsPriority(npc) {
    if (!npc || !npc.bathhouseProfile) return false;
    
    const reputation = npc.bathhouseProfile.reputation || 0;
    const satisfaction = npc.bathhouseProfile.satisfaction || 3;
    
    // VIP or preferred clients with high satisfaction get priority
    return reputation >= BATHHOUSE_REPUTATION_LEVELS.PREFERRED.value &&
           satisfaction >= CLIENT_SATISFACTION_LEVELS.SATISFIED.value;
}

// ============================================================================
// BATHHOUSE STAFF SCHEDULING SYSTEM
// ============================================================================

// Staff shift types
const BATHHOUSE_SHIFT_TYPES = {
    MORNING: { id: 'morning', label: 'Morning Shift', startHour: 6, endHour: 12, description: '6 AM to 12 PM' },
    AFTERNOON: { id: 'afternoon', label: 'Afternoon Shift', startHour: 12, endHour: 18, description: '12 PM to 6 PM' },
    EVENING: { id: 'evening', label: 'Evening Shift', startHour: 18, endHour: 24, description: '6 PM to 12 AM' },
    NIGHT: { id: 'night', label: 'Night Shift', startHour: 0, endHour: 6, description: '12 AM to 6 AM' }
};

// Staff work status
const STAFF_STATUS = {
    OFF_DUTY: 'off_duty',
    ON_DUTY: 'on_duty',
    ON_BREAK: 'on_break',
    BUSY: 'busy'
};

// Initialize staff schedule for NPC
function initializeBathhouseStaffSchedule(npc) {
    if (!npc || !isBathhouseStaff(npc)) return null;
    
    // Generate schedule based on role
    const schedule = generateStaffSchedule(npc);
    
    // Set initial status
    npc.bathhouseSchedule = schedule;
    npc.bathhouseOnDuty = false;
    npc.bathhouseStatus = STAFF_STATUS.OFF_DUTY;
    
    return schedule;
}

// Check if NPC is bathhouse staff
function isBathhouseStaff(npc) {
    if (!npc) return false;
    return npc.role === "Bathkeeper" || 
           npc.role === "BathhouseAttendant" || 
           npc.role === "BathhousePractitioner" ||
           npc.bathhouseProvider === true;
}

// Generate staff schedule
function generateStaffSchedule(npc) {
    if (!npc) return null;
    
    // Staff work different shifts based on role
    let shifts = [];
    
    if (npc.role === "Bathkeeper") {
        // Bathkeeper works all day
        shifts = [
            { day: 0, shift: BATHHOUSE_SHIFT_TYPES.MORNING.id, onDuty: true },
            { day: 0, shift: BATHHOUSE_SHIFT_TYPES.AFTERNOON.id, onDuty: true },
            { day: 0, shift: BATHHOUSE_SHIFT_TYPES.EVENING.id, onDuty: true },
            { day: 1, shift: BATHHOUSE_SHIFT_TYPES.MORNING.id, onDuty: true },
            { day: 1, shift: BATHHOUSE_SHIFT_TYPES.AFTERNOON.id, onDuty: true },
            { day: 1, shift: BATHHOUSE_SHIFT_TYPES.EVENING.id, onDuty: true },
            { day: 2, shift: BATHHOUSE_SHIFT_TYPES.MORNING.id, onDuty: false } // Day off
        ];
    } else if (npc.role === "BathhousePractitioner") {
        // Practitioners work specific shifts
        const startDay = Math.floor(Math.random() * 3); // Random start day
        shifts = [];
        for (let day = 0; day < 3; day++) {
            const dayOfWeek = (startDay + day) % 3;
            shifts.push(
                { day: dayOfWeek, shift: BATHHOUSE_SHIFT_TYPES.AFTERNOON.id, onDuty: true },
                { day: dayOfWeek, shift: BATHHOUSE_SHIFT_TYPES.EVENING.id, onDuty: true }
            );
        }
    } else {
        // Attendants work varied shifts
        shifts = [];
        for (let day = 0; day < 7; day++) {
            const shiftType = Object.values(BATHHOUSE_SHIFT_TYPES)[Math.floor(Math.random() * 3)];
            shifts.push({ day: day % 3, shift: shiftType.id, onDuty: Math.random() < 0.7 }); // 70% chance on duty
        }
    }
    
    return { shifts: shifts, lastUpdated: 0 };
}

// Check if staff is on duty at current time
function isStaffOnDuty(npc, turnOfDay) {
    if (!npc || !npc.bathhouseSchedule || !isBathhouseStaff(npc)) return false;
    
    // Get current day and shift
    const day = getCurrentDayFromTurn(turnOfDay);
    const shift = getCurrentShiftFromTurn(turnOfDay);
    
    // Check schedule
    const scheduleEntry = npc.bathhouseSchedule.shifts.find(
        entry => entry.day === day && entry.shift === shift
    );
    
    return !!(scheduleEntry && scheduleEntry.onDuty);
}

// Get current day (0-2 for 3-day cycle)
function getCurrentDayFromTurn(turn) {
    if (typeof getTurnOfDay === "function") {
        const turnOfDay = typeof turn === "number" ? turn : getTurnOfDay();
        // Simplified: 0-7 = day 0, 8-15 = day 1, 16-23 = day 2
        return Math.floor((turnOfDay || 0) / 8) % 3;
    }
    return Math.floor((turn || 0) / 8) % 3;
}

// Get current shift from turn of day
function getCurrentShiftFromTurn(turn) {
    const turnOfDay = typeof turn === "number" ? turn : (typeof getTurnOfDay === "function" ? getTurnOfDay() : 12);
    
    if (turnOfDay >= 6 && turnOfDay < 12) return BATHHOUSE_SHIFT_TYPES.MORNING.id;
    if (turnOfDay >= 12 && turnOfDay < 18) return BATHHOUSE_SHIFT_TYPES.AFTERNOON.id;
    if (turnOfDay >= 18 && turnOfDay < 24) return BATHHOUSE_SHIFT_TYPES.EVENING.id;
    return BATHHOUSE_SHIFT_TYPES.NIGHT.id;
}

// Update staff duty status
function updateStaffDutyStatus(npc, turnOfDay) {
    if (!npc || !isBathhouseStaff(npc)) return;
    
    const onDuty = isStaffOnDuty(npc, turnOfDay);
    npc.bathhouseOnDuty = onDuty;
    npc.bathhouseStatus = onDuty ? STAFF_STATUS.ON_DUTY : STAFF_STATUS.OFF_DUTY;
    
    return onDuty;
}

// Get staff availability description
function getStaffAvailabilityDescription(npc) {
    if (!npc || !isBathhouseStaff(npc)) return "";
    
    if (!npc.bathhouseSchedule) {
        initializeBathhouseStaffSchedule(npc);
    }
    
    const schedule = npc.bathhouseSchedule;
    const onDuty = npc.bathhouseOnDuty;
    
    if (onDuty) {
        return "Currently on duty at the bathhouse.";
    }
    
    return "Currently off duty from the bathhouse.";
}

// Get staff schedule description
function getStaffScheduleDescription(npc) {
    if (!npc || !isBathhouseStaff(npc) || !npc.bathhouseSchedule) return "";
    
    const schedule = npc.bathhouseSchedule;
    const days = ['First Day', 'Second Day', 'Third Day'];
    
    const desc = [];
    desc.push(npc.name + "'s Bathhouse Schedule:");
    
    schedule.shifts.forEach(entry => {
        const dayName = days[entry.day] || "Day " + entry.day;
        const shift = BATHHOUSE_SHIFT_TYPES[entry.shift] || { label: entry.shift };
        const status = entry.onDuty ? "On Duty" : "Off Duty";
        desc.push("  " + dayName + " " + shift.label + ": " + status);
    });
    
    return desc.join("\n");
}

// Check if player has bathhouse experience (qualified or worked before)
function hasBathhouseExperience(player) {
    if (!player) return false;
    
    // Check if player is already a qualified provider
    if (player.bathhouseProvider === true) return true;
    
    // Check if player has passed any trial
    if (player.bathhouseTraining && typeof player.bathhouseTraining === "object") {
        const hasQualification = Object.values(player.bathhouseTraining).some(
            record => record && record.qualified === true
        );
        if (hasQualification) return true;
    }
    
    // Check if player has worked any shifts
    if (player.bathhouseServicesProvided && player.bathhouseServicesProvided > 0) {
        return true;
    }
    
    return false;
}

// Player as bathhouse provider mechanics
function setupPlayerAsBathhouseProvider(player) {
    if (!player) return false;
    
    // Mark player as bathhouse provider
    player.bathhouseProvider = true;
    player.bathhouseProviderRole = "practitioner"; // or "attendant" based on qualification
    player.bathhouseEarnings = player.bathhouseEarnings || 0;
    player.bathhouseServicesProvided = player.bathhouseServicesProvided || 0;
    player.bathhouseTipsReceived = player.bathhouseTipsReceived || 0;
    
    return true;
}

// Record player earnings from bathhouse service
function recordBathhouseEarnings(player, amount, serviceId, isTip) {
    if (!player) return;
    
    if (isTip) {
        player.bathhouseTipsReceived = (player.bathhouseTipsReceived || 0) + amount;
    } else {
        player.bathhouseEarnings = (player.bathhouseEarnings || 0) + amount;
    }
    player.bathhouseServicesProvided = (player.bathhouseServicesProvided || 0) + 1;
    
    // Track last service for narration context
    player.lastBathhouseService = serviceId;
    player.lastBathhouseServiceTurn = player.storyTurn || 0;
}

// Check if player can accept a service request
function canPlayerAcceptBathhouseRequest(player, request) {
    if (!player || !request) return false;
    
    // Must be alive and conscious
    if (player.dead || player.hp <= 0 || player.unconscious) return false;
    
    // Must be qualified for the service tier
    const serviceTier = getServiceTier(request.serviceId);
    if (serviceTier === "manual") return true; // All providers can do manual
    if (serviceTier === "oral" || serviceTier === "intercourse") {
        // Need qualification check
        if (typeof bathhouseQualified === "function") {
            return bathhouseQualified(player.currentRoom);
        }
        return false;
    }
    
    return true;
}

// Get service tier
function getServiceTier(serviceId) {
    if (serviceId.startsWith("bath_manual_")) return "manual";
    if (serviceId.startsWith("bath_oral_")) return "oral";
    if (serviceId.startsWith("bath_intercourse_")) return "intercourse";
    return "manual";
}

// Export function to window for NSFW system access (catalogue already exported above)
if (typeof window !== "undefined") {
    window.queryConversationCatalogue = queryConversationCatalogue;
    // Slime cum absorption processing
    window.settleSlimeCumAbsorptionInWorld = settleSlimeCumAbsorptionInWorld;
    // Per-act disinhibition helpers, used by intimacy-system.js to gate and
    // progress intimacy acts by body category. See applyActDisinhibitionDelta /
    // getActDisinhibition above for the storage shape.
    window.applyActDisinhibitionDelta = applyActDisinhibitionDelta;
    window.getActDisinhibition = getActDisinhibition;
    // NPC memory (see NPC MEMORY above).
    window.addNPCMemory = addNPCMemory;
    window.registerNPCToldMemory = registerNPCToldMemory;
    window.getNPCRelevantMemories = getNPCRelevantMemories;
    window.getNPCToldMemories = getNPCToldMemories;
    window.getNPCMemoryTier = getNPCMemoryTier;
    window.getNPCMemoryCap = getNPCMemoryCap;
    window.serializeNPCMemory = serializeNPCMemory;
    window.loadNPCMemory = loadNPCMemory;
    window.recordNPCConversationMemory = recordNPCConversationMemory;
    window.NPC_RECENT_LINE_TURNS = NPC_RECENT_LINE_TURNS;
    // NPC tags and fact selector (see NPC TAGS AND FACT SELECTOR above).
    window.NPC_TAG_VOCAB = NPC_TAG_VOCAB;
    window.NPC_OPTION_TAGS = NPC_OPTION_TAGS;
    window.getNPCTagsForText = getNPCTagsForText;
    window.getNPCOptionTags = getNPCOptionTags;
    window.getNPCSituationTags = getNPCSituationTags;
    window.getWantedNPCTags = getWantedNPCTags;
    window.getNPCFactRecords = getNPCFactRecords;
    window.selectNPCFacts = selectNPCFacts;
    window.getNPCFactSelection = getNPCFactSelection;
    // Bathhouse system exports
    window.generateBathhouseRegularProfile = generateBathhouseRegularProfile;
    window.generateBathhouseRumor = generateBathhouseRumor;
    window.shouldNPCVisitBathhouseToday = shouldNPCVisitBathhouseToday;
    window.markBathhouseVisit = markBathhouseVisit;
    window.BATHHOUSE_REGULAR_FREQUENCY = BATHHOUSE_REGULAR_FREQUENCY;
    window.BATHHOUSE_REGULAR_PREFERENCES = BATHHOUSE_REGULAR_PREFERENCES;
    // NPC-to-NPC service requests and player as provider
    window.generateBathhouseServiceRequest = generateBathhouseServiceRequest;
    window.canNPCRequestBathhouseService = canNPCRequestBathhouseService;
    window.canNPCProvideBathhouseService = canNPCProvideBathhouseService;
    window.selectServiceForNPC = selectServiceForNPC;
    window.getAvailableServices = getAvailableServices;
    window.getBathhouseServiceCost = getBathhouseServiceCost;
    window.getBathhouseServiceName = getBathhouseServiceName;
    window.getProviderType = getProviderType;
    window.getRequesterMood = getRequesterMood;
    window.getProviderStyle = getProviderStyle;
    window.checkServiceCompatibility = checkServiceCompatibility;
    window.getCompatibilityNote = getCompatibilityNote;
    window.setupPlayerAsBathhouseProvider = setupPlayerAsBathhouseProvider;
    window.recordBathhouseEarnings = recordBathhouseEarnings;
    window.canPlayerAcceptBathhouseRequest = canPlayerAcceptBathhouseRequest;
    window.getServiceTier = getServiceTier;
    window.hasBathhouseExperience = hasBathhouseExperience;
    window.BATHHOUSE_PROVIDER_TYPES = BATHHOUSE_PROVIDER_TYPES;
    window.BATHHOUSE_REQUEST_STATES = BATHHOUSE_REQUEST_STATES;
    // Reputation and client relationship system
    window.BATHHOUSE_REPUTATION_LEVELS = BATHHOUSE_REPUTATION_LEVELS;
    window.CLIENT_SATISFACTION_LEVELS = CLIENT_SATISFACTION_LEVELS;
    window.getReputationLevel = getReputationLevel;
    window.getSatisfactionLevel = getSatisfactionLevel;
    window.updateClientRelationship = updateClientRelationship;
    window.getClientDiscount = getClientDiscount;
    window.getDiscountedServicePrice = getDiscountedServicePrice;
    window.getClientPreferenceDescription = getClientPreferenceDescription;
    window.clientGetsPriority = clientGetsPriority;
    // Staff scheduling system
    window.BATHHOUSE_SHIFT_TYPES = BATHHOUSE_SHIFT_TYPES;
    window.STAFF_STATUS = STAFF_STATUS;
    window.initializeBathhouseStaffSchedule = initializeBathhouseStaffSchedule;
    window.isBathhouseStaff = isBathhouseStaff;
    window.generateStaffSchedule = generateStaffSchedule;
    window.isStaffOnDuty = isStaffOnDuty;
    window.getCurrentDayFromTurn = getCurrentDayFromTurn;
    window.getCurrentShiftFromTurn = getCurrentShiftFromTurn;
    window.updateStaffDutyStatus = updateStaffDutyStatus;
    window.getStaffAvailabilityDescription = getStaffAvailabilityDescription;
    window.getStaffScheduleDescription = getStaffScheduleDescription;
}

// ============================================================================
// NPC NEED TEMPLATES (2026-10-28)
// An NPC asks for help only when the engine finds a real reason in their own
// state (see commitmentCandidates in the engine): a wound, hunger, an empty
// shop, a missing tool, a hurt relative, a theft, an unsafe shelter. Each entry
// here is the authored voice for one reason: `reason` is the plain fact shown
// in terms, `attention` finishes "<name> ..." in the narration when they try to
// catch the player's eye, and `lines` are first-person asks by tone (warm /
// plain / gruff). Placeholders: {item} {person} {place}. The AI may reword a
// line but never change its facts. Add a template by adding a key; the engine
// decides when it applies.
// ============================================================================
const NPC_NEED_TEMPLATES = {
    bleeding: {
        reason: "They are bleeding and need to bind the wound",
        attention: "presses a hand to a bleeding wound and tries to catch your eye.",
        lines: {
            warm: ["Oh, thank goodness. I am bleeding and cannot make it stop. Could you spare {item}?", "Please, I have cut myself badly. If you have {item}, I would be so grateful."],
            plain: ["I have cut myself badly and it will not stop bleeding. Do you have {item} you could spare?", "This wound will not close. {item} would help, if you can spare it."],
            gruff: ["Bleeding. Need it bound. Got {item}?", "Cut myself open. If you have {item}, hand it over."]
        }
    },
    hurt: {
        reason: "Their wounds need a healing supply",
        attention: "winces and tries to catch your eye.",
        lines: {
            warm: ["I took a bad knock and I am still hurting. Could you spare {item} to help me mend?", "I am not well, I am afraid. {item} might set me right, if you can spare it."],
            plain: ["I am hurt, and it is not mending on its own. {item} would help, if you can spare it.", "These hurts are slow to heal. Do you have {item}?"],
            gruff: ["Hurt. Need patching up. Got {item}?", "Not mending. {item}, if you have it."]
        }
    },
    hungry: {
        reason: "They need food to recover their strength",
        attention: "looks worn thin and tries to catch your eye.",
        lines: {
            warm: ["I have not eaten properly in too long. Could you spare {item}?", "I am worn right down. Would you have {item} to share?"],
            plain: ["I am running on empty. Do you have {item} to spare?", "It has been a long day without a proper meal. {item} would help."],
            gruff: ["Haven't eaten. {item}, if you have it.", "Running on nothing. Spare {item}?"]
        }
    },
    tool: {
        reason: "They lack a tool needed for daily work",
        attention: "turns a worn tool over in their hands and tries to catch your eye.",
        lines: {
            warm: ["My work has stalled for want of {item}. Could you find me one?", "I cannot do my day's work without {item}. Might you bring me one?"],
            plain: ["I am short of {item} and cannot finish my work. Could you bring me one?", "My work is stuck without {item}. Can you find one for me?"],
            gruff: ["Can't work without {item}. Find me one.", "Need {item}. Work is standing still."]
        }
    },
    stock: {
        reason: "Their shop has run out of ordinary stock",
        attention: "eyes the empty shelves and tries to catch your eye.",
        lines: {
            warm: ["My shelves are nearly bare. If you could bring me {item}, I could open trade again.", "I have run out of stock. Would you bring me {item}? It would help me no end."],
            plain: ["I am out of stock. Bring me {item} and I can sell again.", "My shelves are empty. Could you find {item} for me?"],
            gruff: ["Nothing left to sell. Get me {item}.", "Shelves are bare. {item}, if you can."]
        }
    },
    broke: {
        reason: "They are short of money for daily expenses",
        attention: "counts a few coins and tries to catch your eye.",
        lines: {
            warm: ["Things have been tight lately. Could you spare a coin? I will not forget it.", "I am short of money this week. A coin would go a long way."],
            plain: ["I am short of coin right now. Could you spare one?", "Money is tight. Would you spare a coin?"],
            gruff: ["Short on coin. Spare one?", "Pockets are empty. A coin, if you can."]
        }
    },
    kinHurt: {
        reason: "Someone close to them is badly hurt",
        lines: {
            warm: ["{person} is badly hurt, and I am sick with worry. Would you tell them I am asking after them?", "Have you seen {person}? They are hurt. Please let them know I am thinking of them."],
            plain: ["{person} is badly hurt. Would you pass on that I am asking after them?", "I heard {person} is hurt. Will you tell them I would like to know how they are?"],
            gruff: ["{person} is hurt. Tell them I asked.", "Heard {person} is hurt. Go tell them I want to know how they are."]
        }
    },
    kinWorried: {
        reason: "They are concerned about someone close to them",
        lines: {
            warm: ["I have been worried about {person}. Would you tell them I would love to hear from them?", "I have not heard from {person} in a while. Would you let them know I am thinking of them?"],
            plain: ["I am worried about {person}. Would you let them know I would like to hear from them?", "Could you tell {person} I would like a word?"],
            gruff: ["Tell {person} I want a word.", "{person} owes me news. Pass that on."]
        }
    },
    kinFind: {
        reason: "They are concerned about someone close to them",
        lines: {
            warm: ["I am worried about {person}. Could you find them and make sure they are well?", "Would you look for {person}? I would feel better knowing they are all right."],
            plain: ["Could you find {person} and see that they are all right?", "I would like to know {person} is safe. Could you look for them?"],
            gruff: ["Find {person}. Make sure they are all right.", "Go look for {person}. Tell me they are well."]
        }
    },
    parcel: {
        reason: "They have something meant for a person close to them",
        lines: {
            warm: ["I have something meant for {person}, and I cannot make the trip myself. Would you carry it for me?", "This parcel is for {person}. Could you take it to them?"],
            plain: ["I have a parcel for {person} and cannot deliver it. Will you take it?", "Could you carry this to {person} for me?"],
            gruff: ["Parcel for {person}. Can't take it myself. You do it.", "Take this to {person}."]
        }
    },
    courier: {
        reason: "They carry a parcel they cannot deliver themselves",
        lines: {
            warm: ["I am behind on my rounds. Could you carry this parcel to {person} for me?", "I cannot get this to {person} in time. Would you take it?"],
            plain: ["I cannot make this delivery in time. Will you take this parcel to {person}?", "Could you deliver this to {person}? I am held up."],
            gruff: ["Behind on my rounds. Take this to {person}.", "Deliver this to {person}. I am stuck here."]
        }
    },
    robbed: {
        reason: "They discovered that possessions were stolen",
        attention: "pats down their belongings and tries to catch your eye.",
        lines: {
            warm: ["I have been robbed. Someone took my things. Would you report it to {person}?", "My belongings are gone. Please, would you tell {person}?"],
            plain: ["I have been robbed. Would you report it to {person}?", "Someone has taken my things. Will you tell {person} for me?"],
            gruff: ["Robbed. Tell {person}.", "Someone cleaned me out. Report it to {person}."]
        }
    },
    shelter: {
        reason: "Their usual shelter is unsafe",
        attention: "glances about uneasily and tries to catch your eye.",
        lines: {
            warm: ["It is not safe where I sleep tonight. Would you meet me at {place}? I would feel safer.", "I cannot stay where I am. Could you meet me at {place}?"],
            plain: ["My usual place is not safe right now. Will you meet me at {place}?", "I need somewhere safe. Meet me at {place}?"],
            gruff: ["Can't stay put. Meet me at {place}.", "Not safe here. {place}. Come find me."]
        }
    },
    fallenCare: {
        reason: "A visible unconscious person needs care",
        lines: {
            warm: ["There is someone lying hurt not far from here. Would you ask {person} to help them?", "Someone needs care, and I cannot manage it alone. Please fetch {person}."],
            plain: ["Someone is down and needs care. Ask {person} to help them.", "A person is lying hurt. Could you ask {person} to see to them?"],
            gruff: ["Someone's down. Get {person} to look at them.", "Hurt person. Ask {person}."]
        }
    },
    fallenReport: {
        reason: "Report what can actually be established, without naming a culprit",
        lines: {
            warm: ["A person has fallen and I do not like it. Would you look them over and tell {person} what you find?", "Someone has died here. Could you examine them and report to {person}?"],
            plain: ["A person has fallen. Examine them and report to {person}.", "Someone is dead. Look them over and tell {person} what you find."],
            gruff: ["Body. Look it over. Report to {person}.", "Someone's dead. Tell {person} what you find."]
        }
    },
    comfort: {
        reason: "They would appreciate a small comfort or gift",
        lines: {
            warm: ["A small comfort would lift my spirits. If you happen to have {item}, I would treasure it.", "I would love {item}, if you can spare one. It would cheer me."],
            plain: ["A small comfort would do me good, such as {item}, if you can spare it.", "I would be glad of {item}, if you have one."],
            gruff: ["Wouldn't say no to {item}.", "{item}, if you have it."]
        }
    }
};
// Spoken when the player asks what they can help with and the NPC has no real need.
const NPC_NEED_NONE_LINES = {
    warm: ["Nothing I can think of, but thank you for asking. That is kind of you.", "I am all right for now. It is good of you to ask."],
    plain: ["Nothing right now. I am managing.", "I do not need anything at the moment, but thank you."],
    gruff: ["Nothing. I can handle my own business.", "Don't need a thing. Go bother someone else."]
};
if (typeof window !== "undefined") { window.NPC_NEED_TEMPLATES = NPC_NEED_TEMPLATES; window.NPC_NEED_NONE_LINES = NPC_NEED_NONE_LINES; }
