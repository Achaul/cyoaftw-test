// Bathhouses use quiet, professional recovery context.
// Shared species appearance: explicit morphology, regional surfaces and saved NPC fullness.
// cyoaftw-context-builder.js v2026-10-23-003 — Bounded NPC Life short-term/entity recollections, personality and sleeping context.
// Version identifier for debugging cached files.
if (typeof window !== "undefined") {
    window.CONTEXT_BUILDER_VERSION = "2026-10-30-001";
    console.log("[Context Builder] Loaded v" + window.CONTEXT_BUILDER_VERSION);
}

// ── DERIVE ROOM CONTEXT ──────────────────────────────────────────
function deriveRoomContext(room) {
    const ctx = {
        privacy: "public",
        noise: "moderate",
        danger: "safe",
        socialExpectation: "casual",
        function: "transit"
    };

    if (!room) return ctx;

    const type = String(room.type || "").toLowerCase();
    const zones = Array.isArray(room.allowedZones) ? room.allowedZones.map(z => z.toLowerCase()) : [];
    const cluster = Array.isArray(room.parentCluster) ? room.parentCluster.map(c => c.toLowerCase()) : [];
    const isConnector = !!room.isConnector;

    const is = (v) => type.includes(v);
    const inZone = (v) => zones.includes(v);
    const inCluster = (v) => cluster.includes(v);

    if (is("gate") || is("street") || is("avenue")) {
        ctx.privacy = "public";
        ctx.noise = "moderate";
        ctx.socialExpectation = is("gate") ? "formal" : "casual";
        ctx.function = "transit";
        ctx.danger = is("gate") ? "tense" : "safe";
    }

    if (is("square") || is("market")) {
        ctx.privacy = "public";
        ctx.noise = "loud";
        ctx.function = "social";
    }

    if (is("tavern") || is("taproom") || inCluster("tavern")) {
        ctx.privacy = "semi-private";
        ctx.noise = "loud";
        ctx.function = "social";
    }

    if (is("bathhouse") || is("bathing room") || is("massage room")) {
        ctx.privacy = "semi-private";
        ctx.noise = "quiet";
        ctx.socialExpectation = "professional";
        ctx.function = "rest";
    }

    if (is("back room") || is("private") || is("parlour")) {
        ctx.privacy = "private";
        ctx.noise = "quiet";
        ctx.socialExpectation = "intimate";
    }

    if (is("inn") || inCluster("inn")) {
        ctx.privacy = is("common") ? "semi-private" : "private";
        ctx.noise = is("common") ? "moderate" : "quiet";
        ctx.function = "rest";
    }

    // Rooms behind the Town Hall's and Smithy's front rooms (see
    // BUILDING_BLUEPRINTS in cyoaftw-world-data.js).
    if (is("bedroom")) {
        ctx.privacy = "private";
        ctx.noise = "quiet";
        ctx.function = "rest";
    }

    if (is("quarters")) {
        ctx.privacy = "private";
        ctx.noise = "quiet";
        ctx.function = "rest";
    }

    if (is("council chamber") || is("records office") || is("hall corridor") || is("portal chamber")) {
        ctx.privacy = "semi-private";
        ctx.noise = "quiet";
        ctx.socialExpectation = "formal";
        ctx.function = "work";
    }

    if (is("guild") || is("quest board") || inCluster("guild")) {
        ctx.socialExpectation = "formal";
        ctx.function = "work";
    }

    if (is("watch") || is("barracks")) {
        ctx.socialExpectation = "formal";
        ctx.danger = "tense";
        ctx.function = "work";
    }

    if (is("training yard")) {
        ctx.privacy = "public";
        ctx.noise = "loud";
        ctx.socialExpectation = "casual";
        ctx.function = "training";
    }

    if (is("chapel") || is("vestry")) {
        ctx.privacy = is("vestry") ? "private" : "semi-private";
        ctx.noise = "quiet";
        ctx.socialExpectation = "formal";
        ctx.function = is("chapel") ? "ritual" : "work";
    }

    if (is("shrine") || is("library")) {
        ctx.privacy = "private";
        ctx.noise = "quiet";
        ctx.socialExpectation = "formal";
        ctx.function = is("shrine") ? "ritual" : "work";
    }

    if (inZone("dungeon") || inZone("ruins") || is("trap") || is("tunnel") || is("cavern")) {
        ctx.danger = "hostile";
        ctx.noise = "quiet";
        ctx.socialExpectation = "formal";
        ctx.function = "transit";
    }

    if (is("cell") || is("vault")) {
        ctx.privacy = "private";
        ctx.noise = "quiet";
    }

    if (isConnector) {
        ctx.function = "transit";
    }

    // Behind a building's front door is not the street: interior rooms are at
    // least semi-private (see BUILDING_BLUEPRINTS). Rooms with their own door
    // off a hallway (guest rooms) stay as private as set above.
    if (room.isBuildingRoom && !room.isEntrance && ctx.privacy === "public") {
        ctx.privacy = "semi-private";
    }

    return ctx;
}

// ── BUILD LOCATION NARRATIVE CONTEXT ────────────────────────────
function buildLocationNarrativeContext(room) {
    if (!room) return null;

    const ctx = deriveRoomContext(room);

    const creatures = Array.isArray(room.creatures)
        ? room.creatures.filter(n => n && !n.unconscious)
        : [];

    if (typeof ensureRoomFixtureState === "function") ensureRoomFixtureState(room);
    // Concealed fixtures (see FIXTURE_CONCEALMENT_RULES in the engine) stay
    // out of the AI scene until a search reveals them.
    const structural = Array.isArray(room.structural)
        ? room.structural.filter(s => s && (typeof isFixtureVisible === "function" ? isFixtureVisible(s, room) : (!s.concealed || s.revealed === true)))
        : [];

    const items = Array.isArray(room.items)
        ? room.items.filter(i => i && !i.unconscious && !i.isUnconsciousBody)
        : [];

    const rolesPresent = {};
    const speciesPresent = {};

    for (const npc of creatures) {
        if (npc.role) rolesPresent[npc.role] = (rolesPresent[npc.role] || 0) + 1;
        if (npc.species) speciesPresent[npc.species] = (speciesPresent[npc.species] || 0) + 1;
    }

    const anchoredInteractions = creatures
        .filter(n => n.memory && n.memory.anchorObjectId)
        .map(n => ({ role: n.role, anchor: n.memory.anchorObjectId }));

    // Visible doors/archways on this room's exits, as plain compass phrases.
    const doorNames = { door: "a door", arch: "an archway" };
    const dirWords = { N: "north", S: "south", E: "east", W: "west", NE: "northeast", NW: "northwest", SE: "southeast", SW: "southwest", U: "up", D: "down" };
    const doors = room.doors && typeof room.doors === "object"
        ? Object.keys(room.doors)
            .filter(dir => room.exits && room.exits[dir] && doorNames[room.doors[dir]])
            .map(dir => {
                const lock = room.locks && room.locks[dir];
                const locked = !!(lock && lock.state === "locked");
                return `${locked ? "a locked door" : doorNames[room.doors[dir]]} to the ${dirWords[dir] || dir}`;
            })
        : [];

    return {
        building: room.buildingName || null,
        doors: doors,
        room: {
            type: room.type,
            role: room.role,
            name: room.displayName || room.name || room.type,
            baseDescription: room.baseDescription || null,
            description: room.description || null
        },
        environment: {
            privacy: ctx.privacy,
            noise: ctx.noise,
            danger: ctx.danger,
            function: ctx.function,
            socialExpectation: ctx.socialExpectation
        },
        structure: structural.map(s => ({
            id: s.id,
            name: s.name,
            tags: s.tags || []
        })),
        npcs: {
            count: creatures.length,
            roles: rolesPresent,
            species: speciesPresent,
            anchored: anchoredInteractions
        },
        items: {
            count: items.length
        }
    };
}

// ── SERIALIZE SCENE BLOCK ────────────────────────────────────────
function serializeSceneBlock(locCtx) {
    if (!locCtx) return "";

    const room = locCtx.room;
    const env = locCtx.environment;
    const npcs = locCtx.npcs;
    const items = locCtx.items;
    const structure = locCtx.structure;

    const lines = [];

    lines.push(`LOCATION: ${room.name} (${room.type})`);

    if (locCtx.building) {
        lines.push(`BUILDING: ${locCtx.building}`);
    }
    if (Array.isArray(locCtx.doors) && locCtx.doors.length > 0) {
        lines.push(`DOORS: ${locCtx.doors.join("; ")}`);
    }

    if (room.baseDescription) {
        lines.push(`DESCRIPTION: ${room.baseDescription}`);
    }

    lines.push(`ATMOSPHERE: ${env.privacy}, ${env.noise}, ${env.danger}, ${env.function}, ${env.socialExpectation}`);

    if (npcs.count > 0) {
        const roleList = Object.entries(npcs.roles)
            .map(([role, count]) => `${count} ${role}`)
            .join(", ");
        const speciesList = Object.entries(npcs.species)
            .map(([species, count]) => `${count} ${species}`)
            .join(", ");
        lines.push(`PRESENT: ${roleList} (${speciesList})`);
    } else {
        lines.push(`PRESENT: nobody else is here`);
    }

    if (structure.length > 0) {
        lines.push(`OBJECTS: ${structure.map(s => s.name).join(", ")}`);
    }

    if (items.count > 0) {
        lines.push(`ITEMS: ${items.count} item(s) visible`);
    }

    return lines.join("\n");
}

// ── SERIALIZE STORY DIRECTOR BLOCK ──────────────────────────────
function serializeStoryDirectorBlock(story) {
    if (!story) return "";

    const lines = [
        `STORY STATE: act ${story.act || 1}, tension ${story.tension || 0}/100`
    ];

    const threads = Array.isArray(story.activeThreads)
        ? story.activeThreads.filter(t => t && t.status !== "resolved").slice(0, 4)
        : [];

    if (threads.length) {
        lines.push("ACTIVE THREADS:");
        threads.forEach(thread => {
            const lastBeat = Array.isArray(thread.beats) && thread.beats.length
                ? thread.beats[thread.beats.length - 1].text
                : "new thread";
            lines.push(`- ${thread.title || thread.id}: ${lastBeat} (intensity ${thread.intensity || 0}/100)`);
        });
    }

    const facts = Array.isArray(story.discoveredFacts)
        ? story.discoveredFacts.slice(-5)
        : [];
    if (facts.length) {
        lines.push(`KNOWN FACTS: ${facts.join("; ")}`);
    }

    const questions = Array.isArray(story.unresolvedQuestions)
        ? story.unresolvedQuestions.slice(-4)
        : [];
    if (questions.length) {
        lines.push(`UNRESOLVED QUESTIONS: ${questions.join("; ")}`);
    }

    // recentEvents is mostly "movement" / "conversation" chatter; lead with
    // the events that actually matter and only pad with chatter when there
    // is almost nothing else, so the prompt is not spent on room-hopping.
    const NOISE_TYPES = ["movement", "conversation", "start"];
    const allEvents = Array.isArray(story.recentEvents) ? story.recentEvents : [];
    const meaningful = allEvents.filter(e => e && NOISE_TYPES.indexOf(String(e.type || "").toLowerCase()) < 0).slice(0, 5);
    const events = meaningful.length >= 2
        ? meaningful
        : meaningful.concat(allEvents.filter(e => e && meaningful.indexOf(e) < 0).slice(0, 2 - meaningful.length));
    if (events.length) {
        lines.push("RECENT EVENTS:");
        events.forEach(event => lines.push(`- ${event.text}`));
    }

    return lines.join("\n");
}

// ── NPC AWARENESS BLOCK ─────────────────────────────────────────
// Story events this particular NPC plausibly saw or heard about (see
// getNPCAwareStoryEvents in cyoaftw-npc-data.js). Gives the model something
// real to draw on instead of improvising what "has been happening".
function serializeNPCAwarenessBlock(npc) {
    if (!npc || typeof window.getNPCAwareStoryEvents !== "function") return "";
    const events = window.getNPCAwareStoryEvents(npc, {}).slice(0, 3);
    if (!events.length) return "";
    const lines = ["WHAT THE SPEAKER KNOWS ABOUT RECENT EVENTS (mention only if it fits what the player says; never contradict it):"];
    events.forEach(ev => {
        const where = ev.here ? "happened here" : "word has reached them";
        lines.push(`- ${ev.text} (${where})`);
    });
    return lines.join("\n");
}

// ── BUILD NPC PERSONA BLOCK ──────────────────────────────────────
// A recent line expires with the story (NPC_RECENT_LINE_TURNS story turns), not
// the clock. Lines saved before turns were recorded keep the old 10-minute rule.
function isRecentNPCLine(line, now, turnNow) {
    if (!line || !line.text) return false;
    if (typeof line.turn === "number" && turnNow !== null) {
        const limit = typeof NPC_RECENT_LINE_TURNS === "number" ? NPC_RECENT_LINE_TURNS : 30;
        return (turnNow - line.turn) <= limit;
    }
    return !!(line.timestamp && (now - line.timestamp) < 10 * 60 * 1000);
}

// Durable memory: what this NPC has already told the player (so it is not
// repeated as new) plus the few most notable things the player did. See NPC
// MEMORY in cyoaftw-npc-data.js. wantedTags (options.memoryTags) will steer the
// pick once the tag selector is wired in.
function buildNPCMemoryBlock(npc, wantedTags, maxNotable = 4, maxTold = 6) {
    if (!npc || !npc.memory) return "";
    if (npc.memory.memoryLifeVersion && typeof ensureNPCMemoryLife === "function") ensureNPCMemoryLife(npc);
    // Settled facts (fights, surrender, mercy): always shown, newest last.
    const facts = (Array.isArray(npc.memory.memoryEntries) ? npc.memory.memoryEntries : []).filter(e => e && e.text && (e.tags || []).indexOf("fact") >= 0).slice(-6);
    const told = typeof getNPCToldMemories === "function" ? getNPCToldMemories(npc, maxTold) : [];
    const notable = (typeof getNPCRelevantMemories === "function"
        ? getNPCRelevantMemories(npc, wantedTags || [], { max: maxNotable + facts.length, minImportance: wantedTags && wantedTags.length ? 3 : 4 })
        : []).filter(e => facts.indexOf(e) < 0).slice(0, maxNotable);
    const options = arguments[4] || {};
    const subjects = getNPCMemoryContextSubjects(npc, options);
    if (subjects.indexOf("player") < 0) subjects.unshift("player");
    const recent = (Array.isArray(npc.memory.shortTerm) ? npc.memory.shortTerm : []).filter(function (e) { return e && e.text && subjects.indexOf(e.subjectId) >= 0; }).slice(-2);
    const selected = typeof getNPCShortTermMemories === "function" ? getNPCShortTermMemories(npc, wantedTags || [], 2, subjects) : [];
    const shortTerm = recent.concat(selected).filter(function (e, i, all) { return all.indexOf(e) === i; }).slice(0, 4);
    const entityLines = buildNPCEntityMemoryLines(npc, options);
    const worldMemory = [typeof buildNPCWorldReactionMemory === "function" ? buildNPCWorldReactionMemory(npc) : "", typeof buildNPCSocialMemory === "function" ? buildNPCSocialMemory(npc, options) : ""].filter(Boolean).join("\n");
    if (!facts.length && !told.length && !notable.length && !shortTerm.length && !entityLines.length) return worldMemory;
    const lines = ["WHAT YOU REMEMBER ABOUT THE PLAYER:"];
    if (facts.length) {
        lines.push("- These things happened between you. Never deny, forget or contradict them: " +
            facts.map(e => e.text.replace(/[.!]+$/, "") + (e.count > 1 ? " (" + e.count + " times)" : "")).join("; ") + ".");
    }
    if (told.length) {
        lines.push("- Already told them (do not repeat these as if new): " + told.map(e => e.text.replace(/[.!]+$/, "")).join("; "));
    }
    notable.forEach(e => {
        lines.push("- " + e.text + (e.count > 1 ? " (" + e.count + " times)" : ""));
    });
    if (shortTerm.length) lines.push("- Recent recollections (not settled world facts): " + shortTerm.map(function (e) { return e.text; }).join("; "));
    lines.push.apply(lines, entityLines);
    if (worldMemory) lines.push(worldMemory);
    return lines.join("\n");
}

function getNPCMemoryContextSubjects(npc, options) {
    const records = npc.memory && npc.memory.entities;
    if (!records || typeof records !== "object") return [];
    const room = options && options.room;
    const present = (room && Array.isArray(room.creatures) ? room.creatures : []).filter(function (n) { return n && !n.hidden && !n.isHidden; }).map(function (n) { return "npc:" + n.id; });
    const text = String(options && options.mentionedText || "").toLowerCase();
    return Object.keys(records).filter(function (id) {
        if (id === "player") return true;
        const r = records[id];
        if (!/^npc:/.test(id) || !r || typeof r.label !== "string") return false;
        if (present.indexOf(id) >= 0) return true;
        const label = r.label.toLowerCase();
        const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return label.length >= 3 && new RegExp("(^|[^a-z0-9])" + escaped + "($|[^a-z0-9])").test(text);
    }).sort(function (a, b) { return a === "player" ? -1 : b === "player" ? 1 : records[b].lastTurn - records[a].lastTurn; }).slice(0, 3);
}

function buildNPCEntityMemoryLines(npc, options) {
    const records = npc.memory && npc.memory.entities;
    return getNPCMemoryContextSubjects(npc, options).map(function (id) {
        const r = records[id];
        return "- Memory of " + (id === "player" ? "the player" : r.label) + ": met " + r.timesMet + " time(s), first turn " + r.firstTurn + ", last turn " + r.lastTurn + "; name " + (r.nameKnown ? "known" : "not learned") +
            (r.summary ? ". Subjective recollection: " + r.summary : "") +
            (r.notable && r.notable.length ? ". Notable recollections: " + r.notable.join("; ") : "") + ". Feeling: " + r.feeling + ". Recollections cannot establish game effects or promises.";
    });
}

function buildNPCRecentExchangeBlock(npc, maxTurns = 4) {
    if (!npc || !npc.memory || !Array.isArray(npc.memory.recentLines) || !npc.memory.recentLines.length) {
        return "";
    }

    const now = Date.now();
    const turnNow = typeof getCurrentStoryTurn === "function" ? getCurrentStoryTurn() : null;
    const lines = npc.memory.recentLines
        .slice(-maxTurns)
        .filter(line => isRecentNPCLine(line, now, turnNow))
        .map(line => {
            const speaker = line.speaker === "player" ? "Player" : (npc.name || "NPC");
            return `- ${speaker}: ${String(line.text).replace(/\s+/g, " ").trim()}`;
        });

    if (!lines.length) return "";

    return [
        "RECENT EXCHANGE:",
        ...lines
    ].join("\n");
}

// Lines this NPC didn't take part in but was standing there for - another
// NPC's exchange with the player, picked up passively while sharing a room.
// Kept separate from RECENT EXCHANGE so it's never confused with something
// this NPC actually said or was said to them directly.
function buildNPCOverheardBlock(npc, maxEntries = 3) {
    if (!npc || !npc.memory || !Array.isArray(npc.memory.overheardLines) || !npc.memory.overheardLines.length) {
        return "";
    }

    const now = Date.now();
    const lines = npc.memory.overheardLines
        .slice(-maxEntries)
        .filter(entry => entry && entry.text && entry.timestamp && (now - entry.timestamp) < 10 * 60 * 1000)
        .map(entry => {
            const who = entry.speaker === "player" ? "the newcomer" : (entry.aboutName || "someone");
            return `- Overheard ${who} say: "${String(entry.text).replace(/\s+/g, " ").trim()}"`;
        });

    if (!lines.length) return "";

    return [
        "OVERHEARD NEARBY:",
        ...lines
    ].join("\n");
}

// ── DELIVERY NOTE ────────────────────────────────────────────────
// One short line on HOW the NPC speaks right now, built from mood, warmth,
// what they were doing and whether a fight just happened. It never makes an
// NPC say more or speak first; it only colors the reply. Returns "" when
// nothing stands out. Guarded so this file works without the engine.
const DELIVERY_MOOD_RULES = [
    { re: /tired|weary|exhaust|drained|sleepy/, text: "words come slowly, with the odd sigh or a trailing-off" },
    { re: /angry|furious|irritat|annoy|agitat|resent|bitter/, text: "short, clipped sentences with an edge" },
    { re: /nervous|anxious|afraid|fear|scared|uneasy|jumpy|worried/, text: "quick and a little halting, eyes drifting to the door" },
    { re: /cheer|happy|joy|content|upbeat|amused|merry|playful|jovial/, text: "lighter and quicker, ready to smile or joke" },
    { re: /sad|grief|melanchol|gloom|sorrow|dejected|mourn/, text: "quiet and flat, with long pauses" },
    { re: /suspicious|wary|guarded|distrust/, text: "guarded and measured, answering carefully" },
    { re: /curious|intrigued|eager|interested/, text: "leaning in, ready to ask a small question back" },
    { re: /bored|distracted|impatient|restless/, text: "half-attentive, plainly wanting to get on" }
];

function buildNPCDeliveryNote(npc, room, mood, favorability) {
    if (!npc) return "";
    const parts = [];
    const moodText = String(mood || "").toLowerCase();
    for (let i = 0; i < DELIVERY_MOOD_RULES.length; i++) {
        if (DELIVERY_MOOD_RULES[i].re.test(moodText)) { parts.push(DELIVERY_MOOD_RULES[i].text); break; }
    }
    if (!parts.length) {
        if (favorability >= 60) parts.push("easy familiarity, a comfortable turn of phrase");
        else if (favorability <= -20) parts.push("cool and minimal, giving little away");
    }

    const G = window.G;
    const action = npc.currentState && npc.currentState.sleeping ? (typeof getNPCVisibleAction === "function" ? getNPCVisibleAction(npc) : "is lying asleep") : String((npc.currentState && npc.currentState.gesture) || npc.action || "").trim();
    // Bound captive: the ropes color how the words come out.
    if (npc.bound) {
        parts.push(npc.captiveProne
            ? "you are hog-tied and prone, so every word comes out twisted toward your captor"
            : "your wrists are lashed together, so you can neither gesture nor fend anything off");
    }
    const sharing = typeof window.getNPCSharing === "function" && window.getNPCSharing(npc);
    if (action && !sharing && /^(is|was) /.test(action) && !/(waiting|idle|standing|here)\b/.test(action)) {
        parts.push("you were just " + action.replace(/^(is|was) /, "") + ", so attention may stray back to it");
    }

    if (G && typeof G._lastCombatTurn === "number" && typeof getCurrentStoryTurn === "function" &&
        room && G._lastCombatRoom === (room.id || room.name || "") &&
        getCurrentStoryTurn() - G._lastCombatTurn <= 6) {
        parts.push("fighting broke out in this room moments ago, so you are still a little keyed up");
    }

    if (!parts.length) return "";
    let line = "- Delivery right now: " + parts.join("; ") + ". Let this show in rhythm and word choice only; do not announce it.";
    if (Math.random() < 0.25) line += " You may add one brief physical beat (a glance, a gesture) if it fits; skip it most replies.";
    return line;
}

function buildNPCPersonalityManner(profile) {
    const p = profile || {};
    const archetypes = {
        schemer: "plans ahead and weighs what to reveal", hero: "takes responsibility and speaks with conviction",
        outsider: "keeps some distance and notices what others miss", sage: "reflects before offering advice",
        guardian: "values duty and looks out for others", scoundrel: "looks for an advantage and tests boundaries",
        romantic: "speaks personally and values close connections", explorer: "is drawn to unfamiliar places and ideas",
        martyr: "puts others first, sometimes at a personal cost", trickster: "enjoys teasing and surprising people",
        caretaker: "notices others' practical needs", destroyer: "is impatient with obstacles and quick to challenge"
    };
    const words = [];
    if (Object.prototype.hasOwnProperty.call(archetypes, p.archetype)) words.push(archetypes[p.archetype]);
    const five = p.bigFive || {};
    const scales = [
        ["openness", "curious about new ideas", "prefers familiar ways"],
        ["conscientiousness", "careful and dependable", "spontaneous and informal"],
        ["extraversion", "outgoing and talkative", "reserved and quiet"],
        ["agreeableness", "cooperative and considerate", "blunt and skeptical"],
        ["neuroticism", "easily unsettled", "steady under pressure"]
    ];
    scales.forEach(function (scale) {
        const value = five[scale[0]];
        if (typeof value !== "number" || !Number.isFinite(value) || value < 1 || value > 10) return;
        if (value >= 7) words.push(scale[1]);
        else if (value <= 3) words.push(scale[2]);
    });
    return words.length ? "- Personality in practice: " + words.join("; ") + ". Use as tendencies; current events and mood still matter." : "";
}

function buildNPCPersonaBlock(npc, title = "SPEAKER CONTEXT", options = {}) {
    if (!npc) return "";
    const config = options && typeof options === "object" ? options : {};

    const gender = (npc.gender || "unknown").toLowerCase();
    let pronoun = "they";
    // Check female first, then male, with prefix matching for race+gender combinations
    if (gender === "female" || gender === "f" || 
        gender.includes(" woman") || gender.includes(" girl") ||
        gender.includes("female ") || gender.startsWith("female")) {
        pronoun = "she";
    } else if (gender === "male" || gender === "m" || 
               gender.includes(" man") || gender.includes(" boy") ||
               gender.includes("male ") || gender.startsWith("male")) {
        pronoun = "he";
    }

    const profile = npc.personalityProfile || {};
    const temperament = profile.temperament || npc.temperament || "neutral";
    const archetype = profile.archetype || "";
    const traits = Array.isArray(profile.traits) && profile.traits.length
        ? profile.traits
        : [];

    const quirks = Array.isArray(profile.quirks) && profile.quirks.length
        ? profile.quirks : [];
    // Standing traits belong in live replies too. Keep them deterministic and
    // brief; the instruction controls frequency instead of randomly omitting them.
    const standingQuirks = quirks.filter(function (text) { return typeof text === "string" && text.trim(); })
        .slice(0, 2).map(function (text) { return text.replace(/\s+/g, " ").trim().slice(0, 100); });
    const quirksLine = standingQuirks.length ? "- Standing quirks: " + standingQuirks.join("; ") + " (use rarely and naturally; never repeat every line)" : "";

    const persona = npc.persona || null;
    const currentState = npc.currentState || null;
    const mood = (currentState && currentState.mood)
        ? currentState.mood
        : (npc.memory && npc.memory.lastMood ? npc.memory.lastMood : npc.mood || "neutral");
    const metPlayer = !!(npc.memory && npc.memory.metPlayer);
    const favorability = npc.memory && typeof npc.memory.favorability === "number"
        ? npc.memory.favorability : 0;
    const hostility = typeof npc.hostility === "number"
        ? npc.hostility : 0;
    const relationship = typeof getRelationshipLabel === "function"
        ? getRelationshipLabel(npc)
        : "neutral";
    const recentPlayerActions = typeof getNPCActionTags === "function"
        ? getNPCActionTags(npc, 4)
        : (npc.memory && Array.isArray(npc.memory.playerActions)
            ? npc.memory.playerActions.slice(-4)
            : []);
    const relationshipGuidance = typeof getNPCRelationshipSpeechGuidance === "function"
        ? getNPCRelationshipSpeechGuidance(npc)
        : null;
    // Player personality profile from the character-creation questions
    // (G.player.traits, tallied by selectPersonality in cyoaftw-engine-CORE.js).
    // Only surfaced once a trait is clearly established (picked in both of
    // its two opportunities) so this doesn't add noise on a 50/50 split.
    const playerDominantTrait = typeof getPlayerDominantTrait === "function"
        ? String(getPlayerDominantTrait() || "").toLowerCase()
        : "";
    const playerDominantTraitValue = playerDominantTrait && typeof getPlayerTraitValue === "function"
        ? getPlayerTraitValue(playerDominantTrait)
        : 0;
    const PLAYER_TRAIT_DEMEANOR = {
        curiosity: "curious and observant - tends to notice details, ask questions, and dig rather than let things go",
        empathy: "empathetic and people-focused - tends to check on others and offer help before anything else",
        boldness: "bold and direct - tends to hold their ground, push back, and act rather than wait"
    };
    const playerDemeanorLine = (playerDominantTraitValue >= 2 && PLAYER_TRAIT_DEMEANOR[playerDominantTrait])
        ? PLAYER_TRAIT_DEMEANOR[playerDominantTrait]
        : "";

    // How the player physically comes across, from their live stats (base +
    // status effects + gear/hygiene for charisma, via getSetupStat). Only the
    // two most extreme stats are mentioned, and only when clearly high (>= 6)
    // or low (<= 2), so a middling character adds no prompt noise. Phrased as
    // outward impressions an NPC could plausibly pick up on, not as numbers.
    const PLAYER_STAT_PRESENCE = {
        physicalProwess: { high: "powerfully built and physically imposing", low: "slight and unimposing" },
        flexibility: { high: "light on their feet and quick in their movements", low: "stiff and awkward in their movements" },
        willpower: { high: "steady and hard to rattle", low: "visibly easy to rattle" },
        endurance: { high: "hardy, with the look of someone who rarely tires", low: "easily winded and frail-looking" },
        charisma: { high: "magnetic and easy to warm to", low: "off-putting, with a presence that puts people ill at ease" }
    };
    const playerPresenceNotes = [];
    if (typeof getSetupStat === "function") {
        Object.keys(PLAYER_STAT_PRESENCE).forEach(function (statKey) {
            const value = getSetupStat(statKey, 3);
            if (value >= 6) {
                playerPresenceNotes.push({ weight: value - 3, text: PLAYER_STAT_PRESENCE[statKey].high });
            } else if (value <= 2) {
                playerPresenceNotes.push({ weight: 3 - value, text: PLAYER_STAT_PRESENCE[statKey].low });
            }
        });
    }
    // Hygiene is part of Charisma already, but an unwashed player is something
    // an NPC would notice directly, so it gets its own (high-priority) note.
    if (typeof getPlayerHygienePenalty === "function") {
        const hygienePenalty = getPlayerHygienePenalty();
        if (hygienePenalty < 0) {
            playerPresenceNotes.push({
                weight: 1 - hygienePenalty,
                text: hygienePenalty <= -2 ? "visibly filthy and unwashed" : "a bit grimy and unwashed"
            });
        }
    }
    const playerPresenceLine = playerPresenceNotes
        .sort(function (a, b) { return b.weight - a.weight; })
        .slice(0, 2)
        .map(function (note) { return note.text; })
        .join("; ");

    // The player's chosen looks (build/hair/eyes from character creation), so
    // NPCs describe them consistently instead of the model inventing details.
    // Absent on older saves; guarded so this file works without the engine.
    const playerAppearanceText = typeof getPlayerAppearanceText === "function"
        ? getPlayerAppearanceText()
        : "";

    // Who this NPC is drawn to and how the player lines up (adult humanoids
    // only; empty otherwise). See getNPCTypeSummary in cyoaftw-npc-data.js.
    const npcTypeSummary = typeof getNPCTypeSummary === "function"
        ? getNPCTypeSummary(npc)
        : { typeText: "", label: "" };

    const attraction = npc.memory && typeof npc.memory.attraction === "number"
        ? npc.memory.attraction : 0;
    const arousal = npc.memory && typeof npc.memory.arousal === "number"
        ? npc.memory.arousal : 0;
    const disinhibition = npc.memory && typeof npc.memory.disinhibition === "number"
        ? npc.memory.disinhibition : 0;
    const actDisinhibition = npc.memory && npc.memory.actDisinhibition && typeof npc.memory.actDisinhibition === "object"
        ? npc.memory.actDisinhibition : {};
    const actDisinhibitionEntries = Object.keys(actDisinhibition)
        .filter(function (k) { return typeof actDisinhibition[k] === "number"; })
        .map(function (k) { return k + " " + actDisinhibition[k] + "/100"; });
    const actDisinhibitionLine = actDisinhibitionEntries.length
        ? "- Act disinhibition: " + actDisinhibitionEntries.join(", ")
        : "";
    const attractionLabel = typeof getAttractionLabel === "function"
        ? getAttractionLabel(npc)
        : "none";
    const arousalLabel = typeof getArousalLabel === "function"
        ? getArousalLabel(npc)
        : "calm";

    function favorLabel(v) {
        if (v >= 80) return "trusted";
        if (v >= 60) return "liked";
        if (v >= 40) return "neutral";
        if (v >= 20) return "untrusted";
        return "disliked";
    }
    function hostLabel(v) {
        if (v >= 80) return "angry";
        if (v >= 60) return "upset";
        if (v >= 40) return "wary";
        if (v >= 20) return "somewhat wary";
        return "neutral";
    }

    const speechProfile = typeof getNPCSpeechProfile === "function"
        ? getNPCSpeechProfile(npc, window.G ? window.G.activeRoom : null)
        : null;
    const speechStyle = speechProfile ? speechProfile.style : (npc.speechStyle || profile.speechStyle || "");
    const enrichment = npc.enrichment || {};
    const appearanceHighlights = typeof buildNPCAppearanceHighlights === "function" ? buildNPCAppearanceHighlights(npc) :
        (Array.isArray(npc.appearanceHighlights) ? npc.appearanceHighlights : []);
    const physicalTraits = typeof buildNPCPhysicalSummary === "function" ? buildNPCPhysicalSummary(npc) : (npc.physicalTraits || "");
    const speciesAppearance = typeof getSpeciesAppearanceText === "function" ? getSpeciesAppearanceText(npc, true) : "";
    const anatomy = npc.anatomy || {};
    const anatomyBody = anatomy.body || {};
    const anatomyBits = [];
    if (anatomy.size) anatomyBits.push(`size ${anatomy.size}`);
    const appearanceBuild = typeof getEntityBuildText === "function" ? getEntityBuildText(npc) : anatomy.build;
    if (appearanceBuild) anatomyBits.push(`${appearanceBuild} build`);
    if (typeof getEntitySurfaceParts === "function") anatomyBits.push(...getEntitySurfaceParts(npc));
    else if (anatomyBody.color && anatomyBody.surfaceType) {
        anatomyBits.push(`${anatomyBody.color} ${anatomyBody.surfaceType}`);
    }
    if (anatomy.movement) anatomyBits.push(anatomy.movement);

    const lore = npc.loreNotes || enrichment.speciesLore || "";
    const articulation = npc.articulation || enrichment.articulation || "";
    const voice = npc.voice || enrichment.voice || anatomy.voice || "";
    const background = npc.background || enrichment.background || "";
    const dialectFlavor = npc.dialectFlavor || enrichment.dialectFlavor || "";
    const temperamentInflection = typeof getTemperamentInflection === "function"
        ? getTemperamentInflection(temperament, { favorability, hostility })
        : "";
    const motive = (currentState && currentState.motive)
        ? currentState.motive
        : (npc.currentMotive || enrichment.currentMotive || "");
    const values = Array.isArray(enrichment.values) ? enrichment.values : [];
    const speechTics = speechProfile && Array.isArray(speechProfile.cues) && speechProfile.cues.length
        ? speechProfile.cues
        : (Array.isArray(enrichment.speechTics) ? enrichment.speechTics : []);
    const speechAvoid = speechProfile && Array.isArray(speechProfile.avoid) ? speechProfile.avoid : [];
    const preferredTopics = Array.isArray(npc.preferredTopics) && npc.preferredTopics.length
        ? npc.preferredTopics
        : (Array.isArray(enrichment.preferredTopics) ? enrichment.preferredTopics : []);
    const tabooTopics = Array.isArray(npc.tabooTopics) && npc.tabooTopics.length
        ? npc.tabooTopics
        : (Array.isArray(enrichment.tabooTopics) ? enrichment.tabooTopics : []);
    const reactionNotes = Array.isArray(enrichment.reactionNotes) ? enrichment.reactionNotes : [];

    // Lingering scent notes (set NSFW-side by addSmellMark on whoever
    // received; the display text is authored there and only passed through
    // here). Surfaced on ~half of prompt builds so it colors reactions
    // occasionally instead of dominating every reply.
    const smellLines = [];
    if (Math.random() < 0.5 && typeof window.getActiveSmellNotes === "function") {
        const npcSmellNotes = window.getActiveSmellNotes(npc);
        if (npcSmellNotes.length) {
            smellLines.push(`- Your own unwashed scent: ${npcSmellNotes.map(note => note.text).join("; ")} (others may notice; only bring it up when natural)`);
        }
        const playerSmellNotes = window.G && window.G.player
            ? window.getActiveSmellNotes(window.G.player)
            : [];
        if (playerSmellNotes.length) {
            smellLines.push(`- The player's noticeable scent: ${playerSmellNotes.map(note => note.text).join("; ")} (react naturally; only bring it up when it fits)`);
        }
    }


    const facetsViaSelector = !!config.conversation && typeof getNPCFacetRecords === "function";

    const lines = [
        `${title}:`,
        `- Name: ${npc.givenName || npc.name || "Unknown"}${npc.givenName && !(npc.memory && npc.memory.nameKnown) ? " (the player has NOT learned this name; never say it unless they ask or you are told to introduce yourself, and never invent a different name)" : " (the player knows this name; never use any other)"}`,
        `- Role: ${npc.role || "unknown"}`,
        typeof getNPCFaithContext === "function" ? getNPCFaithContext(npc) : "",
        typeof getNPCPartyDescription === "function" && getNPCPartyDescription(npc) ? `- ${getNPCPartyDescription(npc)} They form their own travelling group, separate from the player.` : "",
        `- Species: ${npc.species || "unknown"}, ${gender} (pronoun: ${pronoun})`,
        speciesAppearance ? `- Anatomy constraints: ${speciesAppearance}. Keep incidental gestures consistent; mention appearance only when natural. These facts override generic fantasy assumptions.` : "",
        npc.age ? `- Age: ${typeof getNPCAgeDescriptor === "function" && getNPCAgeDescriptor(npc) ? getNPCAgeDescriptor(npc).label.toLowerCase() + " for their kind (never state a number of years)" : npc.age + " (" + (npc.ageCategory || "") + ")"}` : "",
        `- Temperament: ${temperament}`,
        temperamentInflection ? `- ${temperamentInflection}` : "",
        persona && persona.summary ? `- Persona: ${persona.summary}` : "",
        persona && persona.verbalFingerprint ? `- Verbal fingerprint (occasional, never every line): ${persona.verbalFingerprint}` : "",
        persona && persona.topicPull ? `- Conversational pull: ${persona.topicPull}` : "",
        persona && persona.voiceDescriptor ? `- Voice descriptor: ${persona.voiceDescriptor}` : "",
        archetype ? `- Archetype: ${archetype}` : "",
        buildNPCPersonalityManner(profile),
        traits.length ? `- Traits: ${traits.join(", ")}` : "",
        quirksLine,
        background ? `- Background: ${background}${dialectFlavor ? ` - ${dialectFlavor}` : ""}` : "",
        speechStyle ? `- Speech style: ${speechStyle}` : "",
        speechProfile ? `- Speech guide: ${speechProfile.sentenceLength} sentences, ${speechProfile.vocabulary}, ${speechProfile.cadence}` : "",
        // The concrete sample the AI mimics: the species voice when the NPC
        // is non-human (humans keep the generic style sample). This is the
        // strongest "sounds like their people" signal in the prompt.
        speechProfile
            ? `- Speech sample (${speechProfile.speciesSample ? "this character's own species voice" : "style"} only, never copy its words): "${speechProfile.speciesSample || speechProfile.sample}"`
            : "",
        speechProfile && speechProfile.nativeSpeech ? `- Native manner of speaking (their own people, in the common tongue; shape word choice and rhythm, never invented words; this species manner takes precedence over the generic style guide where they differ): ${speechProfile.nativeSpeech}` : "",
        speechTics.length ? `- Speech cues (use rarely, not in most lines): ${speechTics.join("; ")}` : "",
        speechAvoid.length ? `- Avoid in speech: ${speechAvoid.join("; ")}` : "",
        voice ? `- Voice: ${voice}` : "",
        articulation ? `- Articulation: ${articulation}` : "",
        // In conversation prompts these arrive as tagged facets when the player's
        // line is about them (getNPCFacetRecords), so they are not sent every time.
        !facetsViaSelector && physicalTraits ? `- Appearance: ${physicalTraits}` : "",
        !facetsViaSelector && appearanceHighlights.length ? `- Notable details: ${appearanceHighlights.join(", ")}` : "",
        !facetsViaSelector && anatomyBits.length ? `- Anatomy/movement: ${anatomyBits.join(", ")}` : "",
        !facetsViaSelector && lore ? `- Species lore: ${String(lore).slice(0, 240)}` : "",
        !facetsViaSelector && values.length ? `- Values: ${values.join(", ")}` : "",
        preferredTopics.length ? `- Comfortable topics: ${preferredTopics.join(", ")}` : "",
        tabooTopics.length ? `- Sensitive topics: ${tabooTopics.join(", ")}` : "",
        reactionNotes.length ? `- Reaction biases: ${reactionNotes.join("; ")}` : "",
        motive ? `- Current motive: ${motive}` : "",
        `- Mood: ${mood}`,
        typeof window.getSlimeTamingContext === "function" ? window.getSlimeTamingContext(npc) : "",
        (npc && npc.boss) ? (typeof getBossRankNote === "function" ? getBossRankNote(npc) : `- Rank: you are known as ${npc.boss.epithet || "the ruler"}, ruler of this area. Your power comes from a magical relic (${npc.boss.relicName || "relic"}) you carry; you are proud, dangerous and aware of it.${npc.boss.demeanor ? " Demeanor: " + npc.boss.demeanor + "." : ""}${npc.boss.quirk ? " Quirk: " + npc.boss.quirk + "." : ""}`) : "",
        (npc && !npc.boss && typeof getZoneRulerNoteForNPC === "function") ? getZoneRulerNoteForNPC(npc, window.G && window.G.activeRoom ? window.G.activeRoom.zone : "") : "",
        buildNPCDeliveryNote(npc, window.G ? window.G.activeRoom : null, mood, favorability),
        `- Familiarity with player: ${metPlayer ? "already acquainted; do not treat this as a first introduction" : "first meeting or not yet properly introduced"}`,
        `- Relationship to player: ${relationship}`,
        playerDemeanorLine ? `- Player's general demeanor: ${playerDemeanorLine}` : "",
        playerAppearanceText ? `- Player's appearance: ${playerAppearanceText} (only mention if natural; stay consistent with these details)` : "",
        playerPresenceLine ? `- How the player comes across: ${playerPresenceLine} (let this color your reaction only where natural; do not mention stats)` : "",
        relationshipGuidance ? `- Default attitude toward player: ${relationshipGuidance.baseline} (${relationshipGuidance.direction})` : "",
        relationshipGuidance ? `- Subtle reaction cue: ${relationshipGuidance.cue}` : "",
        recentPlayerActions.length ? `- Recent player actions toward you: ${recentPlayerActions.map(action => typeof formatNPCActionTag === "function" ? formatNPCActionTag(action) : action).join(", ")}` : "",
        `- Favorability toward player: ${favorability}/100 (${favorLabel(favorability)})`,
        `- Hostility toward player: ${hostility}/100 (${hostLabel(hostility)})`,
        npcTypeSummary.typeText ? `- Who you are drawn to (your type): ${npcTypeSummary.typeText} (hint at this only through natural remarks; never state it as a rule)` : "",
        npcTypeSummary.label === "match" ? "- The player fits what you are drawn to, so warmth comes a little more easily." : "",
        npcTypeSummary.label === "mismatch" ? "- The player is not really your type; interest has to be earned slowly." : "",
        typeof isAdultHumanoidNPC === "function" && isAdultHumanoidNPC(npc)
            ? `- Attraction toward player: ${attraction}/100 (${attractionLabel})`
            : "",
        typeof isAdultHumanoidNPC === "function" && isAdultHumanoidNPC(npc)
            ? `- Current romantic tension/arousal: ${arousal}/100 (${arousalLabel})`
            : "",
        typeof isAdultHumanoidNPC === "function" && isAdultHumanoidNPC(npc)
            ? `- Disinhibition: ${disinhibition}/100`
            : "",
        typeof isAdultHumanoidNPC === "function" && isAdultHumanoidNPC(npc) && actDisinhibitionLine
            ? actDisinhibitionLine
            : "",
        ...smellLines,
        "- Conversation rules: answer the player directly, stay conversational, and do not volunteer atmospheric description unless it matters.",
        npc.backstory ? `- Backstory: ${String(npc.backstory).slice(0, 200)}` : "",
        // The opening guide also knows the player's own backstory (engine:
        // getGuideContextLine). Returns "" for every other NPC.
        typeof window.getGuideContextLine === "function" ? window.getGuideContextLine(npc) : "",
        (currentState && currentState.gesture) || npc.action
            ? `- Currently: ${currentState && currentState.sleeping ? (typeof getNPCVisibleAction === "function" ? getNPCVisibleAction(npc) : "is lying asleep") : (currentState && currentState.gesture) || npc.action}`
            : "",
        // A rope-bound captive is never unaware of the ropes: the AI must
        // play the restraint (no standing up, gesturing, fighting or leaving)
        // instead of answering like a free bystander.
        npc.bound
            ? `- Restrained: you are the player's captive, ${npc.captiveProne
                ? "hog-tied and prone on the ground, wrists lashed to your ankles"
                : npc._boundCaptiveFollower
                    ? "wrists lashed to a rope lead around your neck"
                    : "wrists bound with rope"}. You cannot leave, fight back or use your hands; speak from within the ropes - fear, anger, bargaining or sullen defiance as suits your temperament. Never narrate yourself standing up, moving freely or attacking.`
            : "",
        // Aftermath of being used while unconscious (wording authored on the
        // NSFW side; typeof-guarded no-op when NSFW is absent, same pattern
        // as the smell notes). Colors their replies until it is washed away.
        typeof window.nsfwGetUseContextNote === "function"
            ? window.nsfwGetUseContextNote(npc)
            : ""
    ].filter(Boolean);

    return lines.join("\n");
}

// ── PLAYER STANDING BLOCK ────────────────────────────────────────
// What the world knows about the player right now: a bounty, a jail
// sentence, hiding, or a poisoned blade. Every engine call is guarded so this
// file still works without the engine. Returns "" when nothing applies.
function buildPlayerStandingBlock(room, npc) {
    const G = window.G;
    if (!G || !G.player) return "";
    const player = G.player;
    const lines = [];
    const isGuard = !!(npc && typeof isGuardNPC === "function" && isGuardNPC(npc));
    const zone = room && room.zone ? room.zone : "";

    if (typeof isPlayerJailed === "function" && isPlayerJailed()) {
        const jail = player.jail || {};
        let left = "";
        if (typeof getCurrentStoryTurn === "function" && typeof jail.releaseTurn === "number") {
            left = ` (about ${Math.max(0, jail.releaseTurn - getCurrentStoryTurn())} turns of the sentence remain)`;
        }
        lines.push(`- The player is a prisoner, locked up in a jail cell${left}. Their weapons and lockpicks were taken. Treat them as a prisoner, not a free traveller.`);
        if (isGuard) lines.push("- You are a guard on duty: stay professional, stern and unbribable, and make no promises you cannot keep.");
    } else if (zone && isGuard && typeof getGuardBounty === "function") {
        const bounty = getGuardBounty(npc, zone);
        const wantedAt = typeof BOUNTY_WANTED === "number" ? BOUNTY_WANTED : 40;
        const attackAt = typeof BOUNTY_ATTACK === "number" ? BOUNTY_ATTACK : 100;
        if (bounty >= attackAt) {
            lines.push(`- You personally know an unsettled report identifying the player as a violent criminal in ${zone}, with a ${bounty} coin bounty.`);
        } else if (bounty >= wantedAt) {
            lines.push(`- The player is wanted in ${zone} for crimes, with a ${bounty} coin bounty.`);
        }
        if (bounty >= wantedAt) {
            lines.push("- You are a guard and personally know the bounty. Be stern and suspicious, and expect the player to pay it or submit. You may mention the amount.");
        }
    }

    // How hurt the player looks: anyone looking at them can see it.
    if (typeof describePlayerVisibleCondition === "function") {
        const condition = describePlayerVisibleCondition(player);
        if (condition) {
            lines.push(`- The player is ${condition}. Anyone looking at them can see it; react as someone who sees it would, if it fits, and never quote HP numbers.`);
        }
    }

    if (typeof isPlayerHidden === "function" && isPlayerHidden()) {
        lines.push("- The player is hiding and has not been noticed. Do not address or acknowledge them unless you have just noticed them.");
    }

    const weapon = player.equipped && player.equipped.weapon ? player.equipped.weapon : null;
    if (weapon && weapon.poisonHits > 0 && weapon.poison) {
        lines.push("- The player's blade is coated with a poison (a faint, bitter smell). Only a perceptive or knowing speaker, such as a healer or a guard, would notice, and only if it fits.");
    }

    // Wanted NPCs: the speaker may be one, or a guard may know of them.
    if (npc && typeof isNPCWanted === "function" && isNPCWanted(npc)) {
        const rec = npc._wanted;
        const what = typeof describeWantedCrime === "function" ? describeWantedCrime(rec) : "theft";
        lines.push(`- You are wanted by the guards in ${rec.zone || zone || "the district"} for ${what}. You are wary of guards and of anyone who might report you. Do not confess unless it truly fits.`);
    }
    if (isGuard && zone && typeof getActiveWantedNPCs === "function") {
        const wanted = getActiveWantedNPCs(zone).filter(function (e) { return e.npc !== npc; }).slice(0, 3);
        if (wanted.length) {
            const list = wanted.map(function (e) {
                return `${e.npc.name || "someone"} (${typeof describeWantedCrime === "function" ? describeWantedCrime(e.rec) : "theft"}, reward ${e.rec.reward} coins)`;
            }).join("; ");
            lines.push(`- Wanted notices your post carries: ${list}. You may mention one if it fits. Do not invent other wanted people.`);
        }
    }

    // Fame and infamy as THIS speaker knows them (only deeds they saw or were told named
    // the player); someone who has heard nothing gets no line.
    if (npc && typeof getRenownStandingNote === "function") {
        const renownNote = getRenownStandingNote(npc);
        if (renownNote) lines.push(renownNote);
    }

    if (!lines.length) return "";
    return "PLAYER STANDING:\n" + lines.join("\n");
}

// Only public, visible object properties. Contents, IDs, hidden inventory,
// action DCs and private fixture state do not enter a narration prompt.
function serializeWorldObjectContext(room) {
    if (typeof worldObjectEntries !== "function" || typeof G === "undefined" || G.activeRoom !== room) return "";
    const objects = worldObjectEntries().slice(0, 20).map(function (entry) {
        const definition = worldObjectDefinition(entry.object, entry.kind), physical = definition && calculateWorldObjectPhysics(definition);
        const estimated = !entry.object.physicalDefinition || entry.object.physicalDefinitionOrigin === "inferred";
        if (estimated && physical && physical.template === "item") return null;
        return physical ? { name: entry.object.name, location: entry.location, material: physical.material, dimensionsCm: physical.dimensionsCm,
            emptyMassKg: physical.dryMassKg, estimated: estimated, secured: worldObjectSecured(entry) } : null;
    }).filter(Boolean);
    const obstructions = typeof worldDoorObstructionPublic === "function" ? worldDoorObstructionPublic(room) : [];
    return objects.length || obstructions.length ? "PHYSICAL OBJECTS: " + JSON.stringify(objects) + "\nDOOR BRACES: " + JSON.stringify(obstructions) + "\nEstimated properties are template defaults, not measurements. A door brace blocks passage independently of locks. Describe known facts consistently. An attempted action is not a completed effect; engine results determine changes. Mentioning an object never creates it." : "";
}

// ── MASTER PROMPT BUILDER ────────────────────────────────────────
function buildPrompt(room, npc, instruction, options = {}) {
    const locCtx = buildLocationNarrativeContext(room);
    let sceneBlock = serializeSceneBlock(locCtx);
    // An NPC who answered a knock stands beyond an open door, not in this
    // room (see engageKnockAnswerer in the engine). Say so while that holds.
    if (npc && npc._doorwayNote && room && Array.isArray(room.creatures) && room.creatures.indexOf(npc) < 0) {
        sceneBlock += "\nDOORWAY: " + npc._doorwayNote;
    }
    // Conversation replies stay on the player's question: the story block and
    // recent-news block pull unrelated events into answers, so they are only
    // included when an option carries its own fact (keepAwareness).
    const convoOnly = !!(options && options.conversation);
    const storyBlock = convoOnly ? "" : serializeStoryDirectorBlock(window.G ? window.G.story : null);
    const awarenessBlock = npc && (!convoOnly || options.keepAwareness) ? serializeNPCAwarenessBlock(npc) : "";
    const npcBlock = npc ? buildNPCPersonaBlock(npc, "SPEAKER CONTEXT", options) : "";
    const standingBlock = buildPlayerStandingBlock(room, npc);
    const recentExchangeBlock = npc ? buildNPCRecentExchangeBlock(npc) : "";
    const memoryBlock = npc ? buildNPCMemoryBlock(npc, options && options.memoryTags, 4, 6, { room: room, mentionedText: options && options.memoryText }) : "";
    const overheardBlock = npc ? buildNPCOverheardBlock(npc) : "";

    return [
        sceneBlock,
        serializeWorldObjectContext(room),
        storyBlock,
        awarenessBlock,
        npcBlock,
        standingBlock,
        memoryBlock,
        recentExchangeBlock,
        overheardBlock,
        `INSTRUCTION: ${instruction}`
    ].filter(Boolean).join("\n\n");
}
