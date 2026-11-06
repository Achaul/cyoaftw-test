/**
 * INTIMACY SYSTEM - SEX ACT DEFINITIONS
 * Pre-defined intimacy actions with metadata
 * Version: 2026-10-28-002
 * Deduped: removed first (shadowed) copies of enter/thrust/fuck/pound_anus and 7 unreferenced duplicate acts
 * Every act now carries a canonical `menuSection` (one of: Clothing, Head,
 * Upper Body, Midsection, Lower Body, Requests). The menu builder reads it
 * directly — no more id/label keyword sniffing or legacy section mapping.
 */

// Version identifier for debugging cached files
if (typeof window !== "undefined") {
    window.INTIMACY_ACTS_VERSION = "2026-10-28-002";
    console.log("[Intimacy Acts] Loaded v2026-10-28-002 - canonical menuSection on every act; removed 4 duplicate id definitions and 7 unreferenced duplicate acts (rub_cock_on_face, rub_penis_against_butt{,ocks}, press_penis_against_anus, rub_pussy_against_butt, request_give_oral, request_give_cunnilingus)");
}

// ============================================================================
// CONSTANTS
// ============================================================================

var ACT_TYPES = {
    TEASE: "tease",           // Non-penetrative, builds arousal
    PENETRATE: "penetrate",   // Initial penetration
    CONTINUE: "continue",     // Continues existing penetration
    END: "end",               // Ends the encounter
    CLOTHING: "clothing",     // Clothing removal/adjustment
    IMPACT: "impact",         // Causes sensation/pain
    WATERSPORT: "watersport"  // Urination on/around the partner
};

var CLOTHING_REQUIREMENTS = {
    ANY: "any",           // Works clothed or nude
    TOP_OFF: "top_off",   // Requires top to be off
    BOTTOM_OFF: "bottom_off", // Requires bottom to be off
    NUDE: "nude",         // Requires fully nude
    TOP_ON: "top_on",     // Requires top to be on
    BOTTOM_ON: "bottom_on"  // Requires bottom to be on
};

var VIRGINITY_TYPES = {
    VAGINAL: "vaginal",
    ANAL: "anal"
};

// ============================================================================
// PRONOUN SYSTEM
// ============================================================================

var PRONOUNS = {
    male: {
        possessive: "his",
        object: "him",
        subject: "he",
        reflexive: "himself",
        vaginal: "pussy",
        penis: "cock",
        testicles: "balls",
        chest: "chest"
    },
    female: {
        possessive: "her",
        object: "her",
        subject: "she",
        reflexive: "herself",
        vaginal: "pussy",
        penis: "cock",
        testicles: "balls",
        chest: "breasts"
    },
    other: {
        possessive: "their",
        object: "them",
        subject: "they",
        reflexive: "themself",
        vaginal: "pussy",
        penis: "cock",
        testicles: "balls",
        chest: "chest"
    }
};

function getPronouns(gender) {
    const normalizedGender = String(gender || "").toLowerCase();
    // Check female first with exact or prefix match to avoid "male" matching before "female"
    if (normalizedGender === "female" || normalizedGender === "f" || 
        normalizedGender.includes(" woman") || normalizedGender.includes(" girl") ||
        normalizedGender.includes("female ") || normalizedGender.startsWith("female")) {
        return PRONOUNS.female;
    } else if (normalizedGender === "male" || normalizedGender === "m" || 
               normalizedGender.includes(" man") || normalizedGender.includes(" boy") ||
               normalizedGender.includes("male ") || normalizedGender.startsWith("male")) {
        return PRONOUNS.male;
    }
    return PRONOUNS.other;
}

/**
 * Whether an NPC belongs to a cloaca-bearing species (reptilian-kin).
 * Reads the hydrated `npc.cloaca` flag, falling back to the species template
 * (via window.getSpeciesTemplate) when the flag has not been set yet.
 */
function _npcHasCloaca(npc) {
    if (!npc) return false;
    if (npc.cloaca === true) return true;
    if (npc.cloaca === false) return false;
    if (npc.species && typeof window !== "undefined" && typeof window.getSpeciesTemplate === "function") {
        const tpl = window.getSpeciesTemplate(npc.species);
        return !!(tpl && tpl.cloaca === true);
    }
    return false;
}

/**
 * Whether an NPC belongs to a tailed species (Dragonborn, Lizardfolk,
 * Kobold). Reads an explicit npc.hasTail flag first (if a hydration pass
 * ever sets one), then the species template's hasTail.
 */
function _actNpcHasTail(npc) {
    if (!npc) return false;
    if (npc.hasTail === true) return true;
    if (npc.hasTail === false) return false;
    if (npc.species && typeof getSpeciesTemplate === "function") {
        const tpl = getSpeciesTemplate(npc.species);
        return !!(tpl && tpl.hasTail === true);
    }
    if (npc.species && typeof window !== "undefined" && typeof window.getSpeciesTemplate === "function") {
        const tpl = window.getSpeciesTemplate(npc.species);
        return !!(tpl && tpl.hasTail === true);
    }
    return false;
}

/**
 * Replace an un-prefixed genital token possessive-aware:
 *   "your {token}"  -> "your <playerWord>"   (player-owned)
 *   "their {token}" -> "their <npcWord>"      (NPC-owned)
 *   bare "{token}"  -> <npcWord>             (default: NPC-owned)
 */
function _replaceGenitalToken(label, token, npcWord, playerWord) {
    if (!label || label.indexOf("{" + token + "}") === -1) return label;
    // Player-owned first (preceded by "your "), then everything else is NPC-owned.
    label = label.replace(new RegExp("(your\\s)\\{" + token + "\\}", "gi"), "$1" + playerWord);
    label = label.replace(new RegExp("\\{" + token + "\\}", "gi"), npcWord);
    return label;
}

/**
 * Body parts that should have possessive pronouns added automatically
 */
const BODY_PARTS_REQUIRING_POSSESSIVE = [
    "lips", "cheek", "neck", "face", "hair", "arm", "hand",
    "mouth", "chest", "breasts", "nipples", "stomach", "hips", "waist",
    "buttocks", "butt", "anus", "ass", "thighs", "thigh", "leg", "legs",
    "vagina", "pussy", "clitoris", "clit", "penis", "cock",
    "testicles", "balls", "groin", "body", "skin", "back", "shoulders",
    "tail"
];

/**
 * Gender an arbitrary piece of act text (label or description tooltip).
 * Replaces placeholders like {npcPossessive}, {npcObject}, {playerPossessive}, etc.
 * Also auto-adds possessive pronouns to body part targets (e.g., "Kiss lips" -> "Kiss her lips"),
 * relabels cloaca anatomy, and neutralizes player genital words for non-binary players.
 */
function getGenderedText(text, act, npc, player) {
    if (!act || !text) return text;
    
    const npcGender = (npc && npc.gender) ? String(npc.gender).toLowerCase() : "female";
    // Player gender lives at the player object root (G.player.gender); the
    // stats copy is a legacy location kept for old saves. Resolve both.
    const playerGender = String((player && (player.gender || (player.stats && player.stats.gender))) || "male").toLowerCase();
    
    const npcPronouns = getPronouns(npcGender);
    const playerPronouns = getPronouns(playerGender);

    // Non-binary players use neutral genital wording ("genitals") instead of
    // gendered terms, matching their both-genitals anatomy (see
    // ensurePlayerIntimacyAnatomy / genitalGateForGender in the engine).
    const playerIsNonBinary = playerGender === "non-binary" || playerGender === "nonbinary";
    const playerGenitalWords = playerIsNonBinary
        ? { vaginal: "genitals", penis: "genitals", testicles: "genitals" }
        : { vaginal: playerPronouns.vaginal, penis: playerPronouns.penis, testicles: playerPronouns.testicles };

    // Cloaca-bearing NPCs (reptilian-kin) have a single cloacal vent instead
    // of separate genitals. Females resolve to "cloaca"; males keep a distinct
    // "hemipenis" (housed within the vent) so penetration narration reads
    // naturally. The player (assumed non-cloaca) keeps normal anatomy words.
    const npcIsCloaca = _npcHasCloaca(npc);
    const npcGenitals = npcIsCloaca
        ? { vaginal: "cloaca", penis: "hemipenis", testicles: "" }
        : { vaginal: npcPronouns.vaginal, penis: npcPronouns.penis, testicles: npcPronouns.testicles };

    let label = text;

    // Replace NPC pronouns. Menu captions and tooltips use neutral
    // "their/them/they" for the NPC regardless of gender: the base
    // descriptions are written that way, hardcoded labels like
    // "Deepthroat their cock" assume it, and it keeps wording uniform
    // across NPCs. (Narration stays gendered — this path only feeds the
    // action menu captions, tooltips, and AI action phrasing.)
    // Genital tokens use the cloaca-aware words above; chest is unaffected.
    label = label.replace(/\{npcPossessive\}/gi, "their");
    label = label.replace(/\{npcObject\}/gi, "them");
    label = label.replace(/\{npcSubject\}/gi, "they");
    label = label.replace(/\{npcPussy\}/gi, npcGenitals.vaginal);
    label = label.replace(/\{npcCock\}/gi, npcGenitals.penis);
    label = label.replace(/\{npcBalls\}/gi, npcGenitals.testicles);
    label = label.replace(/\{npcChest\}/gi, npcPronouns.chest);
    label = label.replace(/\{npcBreasts\}/gi, npcPronouns.chest);

    // Replace player pronouns (player is assumed human / non-cloaca)
    label = label.replace(/\{playerPossessive\}/gi, playerPronouns.possessive);
    label = label.replace(/\{playerObject\}/gi, playerPronouns.object);
    label = label.replace(/\{playerSubject\}/gi, playerPronouns.subject);
    label = label.replace(/\{playerPussy\}/gi, playerGenitalWords.vaginal);
    label = label.replace(/\{playerCock\}/gi, playerGenitalWords.penis);
    label = label.replace(/\{playerBalls\}/gi, playerGenitalWords.testicles);
    label = label.replace(/\{playerChest\}/gi, playerPronouns.chest);

    // Replace body part placeholders (without npc/player prefix).
    // These appear in NATURAL_LABELS like "Touch their {pussy}" or "Let them suck your {nipples}".
    // Genital tokens are possessive-aware: "your {pussy}" belongs to the player,
    // "their {pussy}" (or anything else) belongs to the NPC. Without this split,
    // a cloaca NPC would turn player-side labels like "your {pussy}" into "your cloaca".
    label = _replaceGenitalToken(label, "pussy", npcGenitals.vaginal, playerGenitalWords.vaginal);
    label = _replaceGenitalToken(label, "vagina", npcGenitals.vaginal, playerGenitalWords.vaginal);
    label = _replaceGenitalToken(label, "cock", npcGenitals.penis, playerGenitalWords.penis);
    label = _replaceGenitalToken(label, "penis", npcGenitals.penis, playerGenitalWords.penis);
    label = _replaceGenitalToken(label, "dick", npcGenitals.penis, playerGenitalWords.penis);
    label = _replaceGenitalToken(label, "balls", npcGenitals.testicles, playerGenitalWords.testicles);
    label = _replaceGenitalToken(label, "testicles", npcGenitals.testicles, playerGenitalWords.testicles);
    label = label.replace(/\{clit\}/gi, "clitoris");
    label = label.replace(/\{clitoris\}/gi, "clitoris");
    label = label.replace(/\{nipples\}/gi, "nipples");
    // Anus is possessive-aware for cloaca NPCs: "their {anus}" -> NPC's cloaca,
    // "your {anus}" -> player's anus (player is never cloaca).
    label = _replaceGenitalToken(label, "anus", npcIsCloaca ? "cloaca" : "anus", "anus");
    label = label.replace(/\{buttocks\}/gi, "buttocks");
    label = label.replace(/\{butt\}/gi, "buttocks");
    label = label.replace(/\{ass\}/gi, "ass");
    label = label.replace(/\{chest\}/gi, npcPronouns.chest);
    label = label.replace(/\{breasts\}/gi, "breasts");
    label = label.replace(/\{groin\}/gi, "groin");
    label = label.replace(/\{thighs\}/gi, "thighs");
    label = label.replace(/\{thigh\}/gi, "thigh");
    label = label.replace(/\{legs\}/gi, "legs");
    label = label.replace(/\{feet\}/gi, "feet");
    label = label.replace(/\{stomach\}/gi, "stomach");
    label = label.replace(/\{hips\}/gi, "hips");
    label = label.replace(/\{waist\}/gi, "waist");
    
    // Auto-add possessive pronoun to body parts if not already present
    // Pattern: Verb + body part (e.g., "Kiss lips", "Caress face")
    // This handles cases where labels are just verb+noun without possessive
    // SKIP for receive actions (playerIsBottom = true) which use "your" perspective
    // Also skip if label already contains possessive pronouns or "your"
    if (act.target && !act.playerIsBottom) {
        const targetLower = act.target.toLowerCase();
        if (BODY_PARTS_REQUIRING_POSSESSIVE.includes(targetLower)) {
            // Check if label is just verb + target (e.g., "Kiss lips")
            const labelLower = label.toLowerCase();
            const targetWord = targetLower;
            
            // Skip if label already has any possessive form (including "your" for receive actions)
            const hasPossessive = labelLower.includes("her ") || 
                                 labelLower.includes("his ") || 
                                 labelLower.includes("their ") ||
                                 labelLower.includes("your ") ||
                                 labelLower.includes("'s ");
            
            if (!hasPossessive) {
                // Pattern: label ends with the target word
                const targetRegex = new RegExp(`(^|\\s)${targetWord}$`);
                if (targetRegex.test(labelLower)) {
                    // Add possessive pronoun before the target — always the
                    // neutral "their" so captions stay uniform (see above).
                    label = label.replace(
                        new RegExp(`(${targetWord})$`, 'i'),
                        `their $1`
                    );
                }
            }
        }
    }

    // Final cloaca pass: for cloaca-bearing NPCs, replace NPC-owned literal
    // "anus" (preceded by an NPC possessive: her/his/their) with "cloaca".
    // This catches raw act labels like "Touch anus" -> "Touch her anus" that
    // bypass the {anus} token path. Player-owned "your anus" is left alone.
    if (npcIsCloaca) {
        label = label.replace(/\b(her|his|their)\s+anus\b/gi, "$1 cloaca");
    }

    // Final non-binary pass: raw act labels like "Ask them to suck your cock"
    // are hardcoded (not tokenized), so the player genital word survives the
    // token replacement above. Swap player-owned gendered genital words for
    // the neutral "genitals". NPC-owned words are untouched (NPCs are only
    // male/female/none).
    if (playerIsNonBinary) {
        label = label.replace(/\byour\s+(cock|penis|dick|balls|testicles|pussy|vagina|clit(?:oris)?)\b/gi, "your genitals");
    }

    return label;
}

/**
 * Get a gender-appropriate label for an intimacy action.
 * Replaces placeholders like {npcPossessive}, {npcObject}, {playerPossessive}, etc.
 * Also auto-adds possessive pronouns to body part targets (e.g., "Kiss lips" -> "Kiss her lips")
 */
function getGenderedLabel(act, npc, player) {
    if (!act || !act.label) return act.label;
    return getGenderedText(act.label, act, npc, player);
}

/**
 * Get a gender-appropriate description (tooltip) for an intimacy action.
 * Runs act.desc through the same token replacement, cloaca relabelling and
 * non-binary neutral-wording as labels, so tooltips match menu wording.
 */
function getGenderedDesc(act, npc, player) {
    if (!act) return undefined;
    return getGenderedText(act.desc, act, npc, player);
}

// ============================================================================
// CLOTHING DEFINITIONS
// ============================================================================

var INTIMACY_CLOTHING_ITEMS = {
    top: {
        label: "Top",
        covers: ["chest", "nipples", "shoulders", "upper back"],
        removalActions: ["remove", "pull down", "lift", "move aside"],
        description: "Upper body clothing"
    },
    bottom: {
        label: "Bottom",
        covers: ["groin", "hips", "buttocks", "anus", "vagina", "penis", "clitoris", "testicles"],
        removalActions: ["remove", "pull down", "push down", "move aside"],
        description: "Lower body clothing"
    },
    undergarments: {
        label: "Undergarments",
        covers: ["groin", "buttocks", "anus", "vagina", "penis", "clitoris", "testicles"],
        removalActions: ["remove", "pull down", "push aside"],
        description: "Underwear"
    }
};

var DEFAULT_CLOTHING_STATE = {
    player: { top: true, bottom: true, undergarments: true },
    npc: { top: true, bottom: true, undergarments: true }
};

// ============================================================================
// SEX ACT DEFINITIONS
// ============================================================================

// Compact act definition format:
// { id, tool, target, verb, type, label, description, arousal, positions, reqClothing, ... }

var SEX_ACTS = {
    // ===== STAGE 1: CLOTHED ACTIONS =====
    kiss_lips: { id: "kiss_lips", menuSection: "Head", tool: "mouth", target: "lips", verb: "kiss", type: ACT_TYPES.TEASE, label: "Kiss lips", desc: "Kiss them on the lips", arousal: { p: 5, n: 5 }, pos: ["Standing", "Perched", "Astride Lap", "Missionary", "Against Wall", "Kneeling", "Kneeling Over", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.ANY, sleepingSafe: true, objectDialogueTags: ["being kissed"] },
    kiss_cheek: { id: "kiss_cheek", menuSection: "Head", tool: "mouth", target: "cheek", verb: "kiss", type: ACT_TYPES.TEASE, label: "Kiss cheek", desc: "Give a gentle kiss on the cheek", arousal: { p: 3, n: 3 }, pos: ["Standing", "Perched", "Astride Lap", "Missionary", "Against Wall", "Kneeling", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.ANY, sleepingSafe: true, objectDialogueTags: ["being kissed"] },
    kiss_neck: { id: "kiss_neck", menuSection: "Head", tool: "mouth", target: "neck", verb: "kiss", type: ACT_TYPES.TEASE, label: "Kiss neck", desc: "Kiss their neck", arousal: { p: 5, n: 8 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Against Wall", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.ANY, sleepingSafe: true, objectDialogueTags: ["being kissed"] },
    
    caress_face: { id: "caress_face", menuSection: "Head", tool: "hand", target: "face", verb: "caress", type: ACT_TYPES.TEASE, label: "Caress face", desc: "Gently caress their face", arousal: { p: 4, n: 6 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap"], reqCloth: CLOTHING_REQUIREMENTS.ANY, sleepingSafe: true, objectDialogueTags: ["being caressed"] },
    stroke_hair: { id: "stroke_hair", menuSection: "Head", tool: "hand", target: "hair", verb: "stroke", type: ACT_TYPES.TEASE, label: "Stroke hair", desc: "Run your fingers through their hair", arousal: { p: 3, n: 5 }, pos: ["Standing", "Perched", "Astride Lap", "Missionary", "Kneeling", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.ANY, sleepingSafe: true, objectDialogueTags: ["hair stroked"] },
    slap_face: { id: "slap_face", menuSection: "Head", tool: "hand", target: "face", verb: "slap", type: ACT_TYPES.IMPACT, label: "Slap face", desc: "Slap their face", arousal: { p: 5, n: 15 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Against Wall"], reqCloth: CLOTHING_REQUIREMENTS.ANY, requiresConsent: true, requiresDemeanorMode: ["dominant"] },
    spit_in_mouth: { id: "spit_in_mouth", menuSection: "Head", tool: "mouth", target: "mouth", verb: "spit", type: ACT_TYPES.IMPACT, label: "Spit in mouth", desc: "Spit into their mouth", arousal: { p: 0, n: -10 }, pos: ["Standing", "Perched", "Missionary", "Against Wall", "Astride Lap", "Kneeling", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.ANY, requiresConsent: true, requiresDemeanorMode: ["dominant"] },
    
    grope_breasts_clothed: { id: "grope_breasts_clothed", menuSection: "Upper Body", tool: "hand", target: "breasts", verb: "grope", type: ACT_TYPES.TEASE, label: "Grope breasts (over clothes)", desc: "Squeeze their breasts over their clothes", arousal: { p: 10, n: 15 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Against Wall"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    squeeze_butt_clothed: { id: "squeeze_butt_clothed", menuSection: "Midsection", tool: "hand", target: "butt", verb: "squeeze", type: ACT_TYPES.TEASE, label: "Squeeze butt", desc: "Squeeze their buttocks over clothes", arousal: { p: 8, n: 18 }, pos: ["Standing", "Standing From Behind", "Perched", "Doggy", "Bent Over", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    
    stroke_arm: { id: "stroke_arm", menuSection: "Upper Body", tool: "hand", target: "arm", verb: "stroke", type: ACT_TYPES.TEASE, label: "Stroke arm", desc: "Stroke their arm", arousal: { p: 2, n: 3 }, pos: ["Standing", "Perched", "Missionary"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    hold_hand: { id: "hold_hand", menuSection: "Upper Body", tool: "hand", target: "hand", verb: "hold", type: ACT_TYPES.TEASE, label: "Hold hand", desc: "Hold their hand", arousal: { p: 2, n: 2 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    
    hug: { id: "hug", menuSection: "Upper Body", tool: "hand", target: "body", verb: "hug", type: ACT_TYPES.TEASE, label: "Hug their body", desc: "Embrace them", arousal: { p: 5, n: 5 }, pos: ["Standing", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.ANY, sleepingSafe: true },
    embrace: { id: "embrace", menuSection: "Upper Body", tool: "hand", target: "body", verb: "embrace", type: ACT_TYPES.TEASE, label: "Embrace their body", desc: "Wrap your arms around them from behind", arousal: { p: 6, n: 8 }, pos: ["Standing From Behind", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    
    // ===== STAGE 2: CLOTHING REMOVAL =====
    remove_player_top: { id: "remove_player_top", menuSection: "Clothing", type: ACT_TYPES.CLOTHING, label: "Remove your top", desc: "Take off your top", clothingItem: "top", target: "player", arousal: { p: 0, n: 5 }, pos: ["Standing", "Perched", "Missionary"], reqCloth: CLOTHING_REQUIREMENTS.TOP_ON, sleepingSafe: true },
    remove_player_bottom: { id: "remove_player_bottom", menuSection: "Clothing", type: ACT_TYPES.CLOTHING, label: "Remove your bottom", desc: "Take off your bottom clothing", clothingItem: "bottom", target: "player", arousal: { p: 5, n: 10 }, pos: ["Standing", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_ON, sleepingSafe: true },
    undress_player: { id: "undress_player", menuSection: "Clothing", type: ACT_TYPES.CLOTHING, label: "Undress completely", desc: "Remove all your clothing", target: "player", arousal: { p: 10, n: 15 }, pos: ["Standing"], reqCloth: CLOTHING_REQUIREMENTS.ANY, sleepingSafe: true },
    
    remove_npc_top: { id: "remove_npc_top", menuSection: "Clothing", type: ACT_TYPES.CLOTHING, label: "Remove their top", desc: "Take off their top", clothingItem: "top", target: "npc", arousal: { p: 5, n: 0 }, pos: ["Standing", "Perched", "Missionary"], reqCloth: CLOTHING_REQUIREMENTS.TOP_ON, sleepingSafe: true },
    remove_npc_bottom: { id: "remove_npc_bottom", menuSection: "Clothing", type: ACT_TYPES.CLOTHING, label: "Remove their bottom", desc: "Take off their bottom clothing", clothingItem: "bottom", target: "npc", arousal: { p: 10, n: 5 }, pos: ["Standing", "Standing From Behind", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_ON, sleepingSafe: true },
    undress_npc: { id: "undress_npc", menuSection: "Clothing", type: ACT_TYPES.CLOTHING, label: "Undress them completely", desc: "Remove all their clothing", target: "npc", arousal: { p: 15, n: 10 }, pos: ["Standing"], reqCloth: CLOTHING_REQUIREMENTS.ANY, sleepingSafe: true },
    
    move_top_aside: { id: "move_top_aside", menuSection: "Clothing", type: ACT_TYPES.CLOTHING, label: "Move top aside", desc: "Move your top to the side", clothingAction: "move_aside", clothingItem: "top", target: "player", arousal: { p: 0, n: 10 }, pos: ["Standing", "Perched", "Missionary"], reqCloth: CLOTHING_REQUIREMENTS.TOP_ON, sleepingSafe: true },
    pull_down_bottom: { id: "pull_down_bottom", menuSection: "Clothing", type: ACT_TYPES.CLOTHING, label: "Pull down bottom", desc: "Pull your bottom down", clothingAction: "pull_down", clothingItem: "bottom", target: "player", arousal: { p: 5, n: 15 }, pos: ["Standing", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_ON, sleepingSafe: true },
    
    move_npc_top_aside: { id: "move_npc_top_aside", menuSection: "Clothing", type: ACT_TYPES.CLOTHING, label: "Move their top aside", desc: "Move their top to expose their chest", clothingAction: "move_aside", clothingItem: "top", target: "npc", arousal: { p: 10, n: 0 }, pos: ["Standing", "Perched", "Missionary"], reqCloth: CLOTHING_REQUIREMENTS.TOP_ON, sleepingSafe: true },
    pull_down_npc_bottom: { id: "pull_down_npc_bottom", menuSection: "Clothing", type: ACT_TYPES.CLOTHING, label: "Pull down their bottom", desc: "Pull their bottom down", clothingAction: "pull_down", clothingItem: "bottom", target: "npc", arousal: { p: 15, n: 5 }, pos: ["Standing", "Standing From Behind"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_ON, sleepingSafe: true },
    
    // ===== STAGE 3: NUDE FOREPLAY - BREASTS/NIPPLES =====
    grope_breasts: { id: "grope_breasts", menuSection: "Upper Body", tool: "hand", target: "breasts", verb: "grope", type: ACT_TYPES.TEASE, label: "Grope breasts", desc: "Squeeze and knead their bare breasts", arousal: { p: 10, n: 25 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Against Wall", "Doggy", "Bent Over", "Spooning", "Cowgirl", "Reverse Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF, objectDialogueTags: ["breasts groped"] },
    squeeze_breasts: { id: "squeeze_breasts", menuSection: "Upper Body", tool: "hand", target: "breasts", verb: "squeeze", type: ACT_TYPES.TEASE, label: "Squeeze breasts", desc: "Firmly squeeze their breasts", arousal: { p: 12, n: 30 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Spooning", "Cowgirl", "Reverse Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF, objectDialogueTags: ["breasts groped"] },
    caress_breasts: { id: "caress_breasts", menuSection: "Upper Body", tool: "hand", target: "breasts", verb: "caress", type: ACT_TYPES.TEASE, label: "Caress breasts", desc: "Gently caress their breasts", arousal: { p: 8, n: 10 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Cowgirl", "Reverse Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF, objectDialogueTags: ["breasts touched"] },
    
    tease_nipples: { id: "tease_nipples", menuSection: "Upper Body", tool: "hand", target: "nipples", verb: "tease", type: ACT_TYPES.TEASE, label: "Tease nipples", desc: "Tease their nipples with your fingers", arousal: { p: 10, n: 30 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning", "Cowgirl", "Reverse Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF },
    pinch_nipples: { id: "pinch_nipples", menuSection: "Upper Body", tool: "fingers", target: "nipples", verb: "pinch", type: ACT_TYPES.TEASE, label: "Pinch nipples", desc: "Pinch their nipples", arousal: { p: 10, n: 35 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Cowgirl", "Reverse Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF },
    flick_nipples: { id: "flick_nipples", menuSection: "Upper Body", tool: "fingers", target: "nipples", verb: "flick", type: ACT_TYPES.TEASE, label: "Flick nipples", desc: "Flick their nipples with your fingertips", arousal: { p: 8, n: 30 }, pos: ["Standing", "Perched", "Missionary"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF },
    
    kiss_nipples: { id: "kiss_nipples", menuSection: "Upper Body", tool: "mouth", target: "nipples", verb: "kiss", type: ACT_TYPES.TEASE, label: "Kiss nipples", desc: "Kiss their nipples", arousal: { p: 10, n: 30 }, pos: ["Standing", "Perched", "Astride Lap", "Missionary", "Kneeling Over", "Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF },
    lick_nipples: { id: "lick_nipples", menuSection: "Upper Body", tool: "mouth", target: "nipples", verb: "lick", type: ACT_TYPES.TEASE, label: "Lick nipples", desc: "Lick their nipples with your tongue", arousal: { p: 10, n: 35 }, pos: ["Standing", "Perched", "Astride Lap", "Missionary", "Kneeling Over", "Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF },
    suck_nipples: { id: "suck_nipples", menuSection: "Upper Body", tool: "mouth", target: "nipples", verb: "suck", type: ACT_TYPES.TEASE, label: "Suck nipples", desc: "Suck on their nipples", arousal: { p: 12, n: 40 }, pos: ["Standing", "Perched", "Astride Lap", "Missionary", "Kneeling Over", "Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF },
    bite_nipples: { id: "bite_nipples", menuSection: "Upper Body", tool: "mouth", target: "nipples", verb: "bite", type: ACT_TYPES.IMPACT, label: "Bite nipples", desc: "Gently bite their nipples", arousal: { p: 10, n: 35 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF, requiresConsent: true },
    
    // Body touching
    caress_stomach: { id: "caress_stomach", menuSection: "Upper Body", tool: "hand", target: "stomach", verb: "caress", type: ACT_TYPES.TEASE, label: "Caress stomach", desc: "Run your hand over their stomach", arousal: { p: 6, n: 10 }, pos: ["Standing", "Perched", "Missionary"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF, sleepingSafe: true },
    stroke_back: { id: "stroke_back", menuSection: "Upper Body", tool: "hand", target: "back", verb: "stroke", type: ACT_TYPES.TEASE, label: "Stroke back", desc: "Stroke their back", arousal: { p: 5, n: 10 }, pos: ["Standing From Behind", "Spooning", "Doggy", "Bent Over"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    massage_shoulders: { id: "massage_shoulders", menuSection: "Upper Body", tool: "hand", target: "shoulders", verb: "massage", type: ACT_TYPES.TEASE, label: "Massage shoulders", desc: "Massage their shoulders", arousal: { p: 4, n: 8 }, pos: ["Standing", "Standing From Behind", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    caress_tail: { id: "caress_tail", menuSection: "Midsection", tool: "hand", target: "tail", verb: "caress", type: ACT_TYPES.TEASE, label: "Caress tail", desc: "Caress their tail with your hand", arousal: { p: 4, n: 8 }, pos: [], reqCloth: CLOTHING_REQUIREMENTS.ANY, requiresNpcTail: true, objectDialogueTags: ["tail caressed"] },
    pull_tail: { id: "pull_tail", menuSection: "Midsection", tool: "hand", target: "tail", verb: "pull", type: ACT_TYPES.TEASE, label: "Pull tail", desc: "Pull on their tail", arousal: { p: 6, n: 10 }, pos: [], reqCloth: CLOTHING_REQUIREMENTS.ANY, requiresNpcTail: true, objectDialogueTags: ["tail pulled"] },
    
    // Groin/Thigh
    tease_groin: { id: "tease_groin", menuSection: "Midsection", tool: "hand", target: "groin", verb: "tease", type: ACT_TYPES.TEASE, label: "Tease groin", desc: "Tease their groin with your hand", arousal: { p: 15, n: 25 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Doggy", "Bent Over", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    grip_hips: { id: "grip_hips", menuSection: "Midsection", tool: "hand", target: "hips", verb: "grip", type: ACT_TYPES.TEASE, label: "Grip hips", desc: "Grip their hips firmly", arousal: { p: 8, n: 15 }, pos: ["Standing", "Standing From Behind", "Doggy", "Bent Over", "Missionary"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    stroke_thighs: { id: "stroke_thighs", menuSection: "Lower Body", tool: "hand", target: "thighs", verb: "stroke", type: ACT_TYPES.TEASE, label: "Stroke thighs", desc: "Stroke their inner thighs", arousal: { p: 10, n: 20 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Doggy"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    
    // ===== VAGINAL ACTIONS =====
    rub_pussy: { id: "rub_pussy", menuSection: "Midsection", tool: "hand", target: "vagina", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub pussy", desc: "Rub their pussy", arousal: { p: 10, n: 40 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning", "Against Wall", "Against Wall From Behind", "Kneeling Over", "Cowgirl", "Reverse Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcFemale: true },
    tease_pussy: { id: "tease_pussy", menuSection: "Midsection", tool: "hand", target: "vagina", verb: "tease", type: ACT_TYPES.TEASE, label: "Tease pussy", desc: "Tease their pussy with your fingers", arousal: { p: 12, n: 45 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning", "Cowgirl", "Reverse Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcFemale: true },
    press_pussy: { id: "press_pussy", menuSection: "Midsection", tool: "hand", target: "vagina", verb: "press", type: ACT_TYPES.TEASE, label: "Press pussy", desc: "Press against their pussy", arousal: { p: 10, n: 35 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Doggy", "Bent Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcFemale: true },
    spread_pussy: { id: "spread_pussy", menuSection: "Midsection", tool: "hand", target: "vagina", verb: "spread", type: ACT_TYPES.TEASE, label: "Spread pussy lips", desc: "Spread their pussy lips apart", arousal: { p: 15, n: 50 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcFemale: true },
    
    // ===== NEW: Priority 1 Actions from COT =====
    // Pull/Push actions for pussy
    pull_hand_to_pussy: { id: "pull_hand_to_pussy", menuSection: "Requests", tool: "vagina", target: "hand", verb: "pull", type: ACT_TYPES.TEASE, label: "Pull hand to pussy", desc: "Guide their hand to your pussy", arousal: { p: 40, n: 10 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning", "Against Wall", "Against Wall From Behind", "Cowgirl", "Reverse Cowgirl", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true, requiresPlayerFemale: true },
    
    // Rub clit (more direct than rub_pussy)
    rub_clit: { id: "rub_clit", menuSection: "Midsection", tool: "hand", target: "clitoris", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub clit", desc: "Rub their clitoris", arousal: { p: 10, n: 50 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning", "Against Wall", "Against Wall From Behind", "Kneeling Over", "Cowgirl", "Reverse Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcFemale: true },
    
    finger_pussy: { id: "finger_pussy", menuSection: "Midsection", tool: "fingers", target: "vagina", verb: "finger", type: ACT_TYPES.TEASE, label: "Finger pussy", desc: "Slide a finger into their pussy", arousal: { p: 15, n: 50 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning", "Cowgirl", "Reverse Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcFemale: true, objectDialogueTags: ["pussy fingered"] },
    enter_pussy_finger: { id: "enter_pussy_finger", menuSection: "Midsection", tool: "fingers", target: "vagina", verb: "enter", type: ACT_TYPES.PENETRATE, label: "Finger deeply", desc: "Insert fingers deeply into their pussy", arousal: { p: 15, n: 60 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Doggy", "Bent Over", "Spooning", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresLube: true, requiresNpcFemale: true, objectDialogueTags: ["pussy penetrated"] },
    finger_pussy_fast: { id: "finger_pussy_fast", menuSection: "Midsection", tool: "fingers", target: "vagina", verb: "finger", type: ACT_TYPES.CONTINUE, label: "Finger fast", desc: "Finger their pussy quickly", arousal: { p: 15, n: 55 }, pos: ["Standing", "Perched", "Missionary", "Doggy", "Bent Over", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresLube: true, requiresNpcFemale: true, objectDialogueTags: ["pussy fingered"] },
    
    // Hump Hand - thrusting vagina onto hand (player on bottom)
    hump_hand: { id: "hump_hand", menuSection: "Requests", tool: "vagina", target: "hand", verb: "hump", type: ACT_TYPES.CONTINUE, label: "Hump hand", desc: "Grind your pussy against their hand", arousal: { p: 45, n: 10 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning", "Against Wall", "Against Wall From Behind", "Cowgirl", "Reverse Cowgirl", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true, requiresPlayerFemale: true, objectDialogueTags: ["cock in pussy"] },
    
    kiss_pussy: { id: "kiss_pussy", menuSection: "Midsection", tool: "mouth", target: "vagina", verb: "kiss", type: ACT_TYPES.TEASE, label: "Kiss pussy", desc: "Kiss their pussy", arousal: { p: 10, n: 40 }, pos: ["Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Kneeling Before", "Kneeling By Face", "Standing From Behind"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcFemale: true, objectDialogueTags: ["pussy kissed"] },
    lick_pussy: { id: "lick_pussy", menuSection: "Midsection", tool: "mouth", target: "vagina", verb: "lick", type: ACT_TYPES.TEASE, label: "Lick pussy", desc: "Lick their pussy", arousal: { p: 12, n: 50 }, pos: ["Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Kneeling Before", "Kneeling By Face", "Standing From Behind"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcFemale: true, objectDialogueTags: ["pussy licked"] },
    tongue_pussy: { id: "tongue_pussy", menuSection: "Midsection", tool: "tongue", target: "vagina", verb: "penetrate", type: ACT_TYPES.TEASE, label: "Tongue fuck", desc: "Penetrate their pussy with your tongue", arousal: { p: 15, n: 65 }, pos: ["Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Kneeling Before", "Kneeling By Face", "Standing From Behind"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcFemale: true },
    suck_clit: { id: "suck_clit", menuSection: "Midsection", tool: "mouth", target: "clitoris", verb: "suck", type: ACT_TYPES.TEASE, label: "Suck clit", desc: "Suck on their clitoris", arousal: { p: 10, n: 60 }, pos: ["Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Kneeling Before", "Kneeling By Face", "Standing From Behind"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcFemale: true },
    nibble_pussy: { id: "nibble_pussy", menuSection: "Midsection", tool: "mouth", target: "vagina", verb: "nibble", type: ACT_TYPES.TEASE, label: "Nibble pussy", desc: "Gently nibble on their pussy", arousal: { p: 10, n: 45 }, pos: ["Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Kneeling Before", "Kneeling By Face", "Standing From Behind"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcFemale: true, objectDialogueTags: ["pussy nibbled"] },
    nibble_clit: { id: "nibble_clit", menuSection: "Midsection", tool: "mouth", target: "clitoris", verb: "nibble", type: ACT_TYPES.TEASE, label: "Nibble clit", desc: "Gently nibble on their clitoris", arousal: { p: 12, n: 50 }, pos: ["Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Kneeling Before", "Kneeling By Face", "Standing From Behind"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcFemale: true, objectDialogueTags: ["clit nibbled"] },
    bury_nose_in_pussy: { id: "bury_nose_in_pussy", menuSection: "Midsection", tool: "nose", target: "vagina", verb: "bury", type: ACT_TYPES.TEASE, label: "Bury nose in pussy", desc: "Bury your nose in their pussy", arousal: { p: 15, n: 40 }, pos: ["Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Kneeling Before", "Kneeling By Face", "Standing From Behind"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcFemale: true },
    press_nose_against_anus: { id: "press_nose_against_anus", menuSection: "Midsection", tool: "nose", target: "anus", verb: "press", type: ACT_TYPES.TEASE, label: "Press nose against anus", desc: "Press your nose against their anus", arousal: { p: 10, n: 35 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Spooning", "Missionary", "Cowgirl", "Reverse Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    
    // NEW: Priority 2 - Ride Face (oral service position)
    ride_face: { id: "ride_face", menuSection: "Head", tool: "vagina", target: "mouth", verb: "ride", type: ACT_TYPES.PENETRATE, label: "Ride face", desc: "Sit on their face for oral service", arousal: { p: 30, n: 40 }, pos: ["Riding Face", "Sixty-Nine", "Oral Service", "Prone Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: false, femaleOnly: true },
    
    press_penis_pussy: { id: "press_penis_pussy", menuSection: "Midsection", tool: "penis", target: "vagina", verb: "press", type: ACT_TYPES.TEASE, label: "Press against pussy", desc: "Press your penis against their pussy", arousal: { p: 20, n: 50 }, pos: ["Standing", "Standing From Behind", "Missionary", "Doggy", "Bent Over", "Against Wall", "Against Wall From Behind", "Cowgirl", "Reverse Cowgirl", "Perched", "Astride Lap", "Spooning", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, maleOnly: true, requiresNpcFemale: true },
    enter_pussy: { id: "enter_pussy", menuSection: "Midsection", tool: "penis", target: "vagina", verb: "enter", type: ACT_TYPES.PENETRATE, label: "Enter pussy", desc: "Enter their pussy", arousal: { p: 30, n: 80 }, pos: ["Standing", "Standing From Behind", "Missionary", "Doggy", "Bent Over", "Against Wall", "Against Wall From Behind", "Cowgirl", "Reverse Cowgirl", "Perched", "Astride Lap", "Spooning", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, takesVirginity: [VIRGINITY_TYPES.VAGINAL], maleOnly: true, requiresNpcFemale: true, objectDialogueTags: ["pussy penetrated"] },
    thrust_pussy: { id: "thrust_pussy", menuSection: "Midsection", tool: "penis", target: "vagina", verb: "thrust", type: ACT_TYPES.CONTINUE, label: "Thrust into pussy", desc: "Thrust your penis into their pussy", arousal: { p: 25, n: 70 }, pos: ["Standing", "Standing From Behind", "Missionary", "Doggy", "Bent Over", "Against Wall", "Against Wall From Behind", "Cowgirl", "Reverse Cowgirl", "Perched", "Astride Lap", "Spooning", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, maleOnly: true, requiresNpcFemale: true, objectDialogueTags: ["pussy penetrated"] },
    pump_pussy: { id: "pump_pussy", menuSection: "Midsection", tool: "penis", target: "vagina", verb: "pump", type: ACT_TYPES.CONTINUE, label: "Pump into pussy", desc: "Pump in and out of their pussy", arousal: { p: 25, n: 75 }, pos: ["Standing", "Standing From Behind", "Missionary", "Doggy", "Bent Over", "Against Wall", "Against Wall From Behind", "Cowgirl", "Reverse Cowgirl", "Perched", "Astride Lap", "Spooning", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, intensity: "medium", maleOnly: true, requiresNpcFemale: true, objectDialogueTags: ["pussy penetrated"] },
    fuck_pussy: { id: "fuck_pussy", menuSection: "Midsection", tool: "penis", target: "vagina", verb: "fuck", type: ACT_TYPES.CONTINUE, label: "Fuck pussy", desc: "Fuck their pussy", arousal: { p: 30, n: 80 }, pos: ["Standing", "Standing From Behind", "Missionary", "Doggy", "Bent Over", "Against Wall", "Against Wall From Behind", "Cowgirl", "Reverse Cowgirl", "Perched", "Astride Lap", "Spooning", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, intensity: "hard", maleOnly: true, requiresNpcFemale: true, objectDialogueTags: ["pussy penetrated"] },
    pound_pussy: { id: "pound_pussy", menuSection: "Midsection", tool: "penis", target: "vagina", verb: "pound", type: ACT_TYPES.CONTINUE, label: "Pound pussy", desc: "Pound into their pussy hard", arousal: { p: 35, n: 85 }, pos: ["Doggy", "Bent Over", "Standing From Behind", "Against Wall From Behind", "Cowgirl", "Reverse Cowgirl", "Perched", "Astride Lap"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, intensity: "hard", maleOnly: true, requiresNpcFemale: true, objectDialogueTags: ["pussy penetrated"] },
    
    grind_pussy: { id: "grind_pussy", menuSection: "Midsection", tool: "groin", target: "vagina", verb: "grind", type: ACT_TYPES.TEASE, label: "Grind against pussy", desc: "Grind your groin against their pussy", arousal: { p: 20, n: 45 }, pos: ["Standing", "Perched", "Astride Lap", "Missionary"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcFemale: true, objectDialogueTags: ["pussy rubbed"] },
    rub_penis_against_pussy_lips: { id: "rub_penis_against_pussy_lips", menuSection: "Midsection", tool: "penis", target: "vagina", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub against pussy lips", desc: "Rub your cock against their pussy lips", arousal: { p: 30, n: 50 }, pos: ["Standing", "Standing From Behind", "Missionary", "Doggy", "Bent Over", "Against Wall", "Against Wall From Behind", "Cowgirl", "Reverse Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, maleOnly: true, requiresNpcFemale: true },
    
    // Anal penetration actions
    grind_anus: { id: "grind_anus", menuSection: "Midsection", tool: "penis", target: "anus", verb: "grind", type: ACT_TYPES.TEASE, label: "Grind against anus", desc: "Grind your cock against their anus", arousal: { p: 25, n: 45 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Against Wall From Behind", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, maleOnly: true },
    
    // V on P
    impale_penis: { id: "impale_penis", menuSection: "Requests", tool: "vagina", target: "penis", verb: "impale", type: ACT_TYPES.PENETRATE, label: "Impale on penis", desc: "Impale yourself on their penis", arousal: { p: 25, n: 70 }, pos: ["Cowgirl", "Reverse Cowgirl", "Astride Lap"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, takesVirginity: [VIRGINITY_TYPES.VAGINAL], playerIsBottom: true, requiresPlayerFemale: true, requiresNpcMale: true },
    ride_penis: { id: "ride_penis", menuSection: "Midsection", tool: "vagina", target: "penis", verb: "ride", type: ACT_TYPES.CONTINUE, label: "Ride penis", desc: "Ride their penis", arousal: { p: 25, n: 75 }, pos: ["Cowgirl", "Reverse Cowgirl", "Astride Lap"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, requiresPlayerFemale: true, requiresNpcMale: true },
    bounce_penis: { id: "bounce_penis", menuSection: "Midsection", tool: "vagina", target: "penis", verb: "bounce", type: ACT_TYPES.CONTINUE, label: "Bounce on penis", desc: "Bounce up and down on their penis", arousal: { p: 30, n: 80 }, pos: ["Cowgirl", "Reverse Cowgirl", "Astride Lap"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, intensity: "medium", requiresPlayerFemale: true, requiresNpcMale: true },
    grind_penis: { id: "grind_penis", menuSection: "Midsection", tool: "vagina", target: "penis", verb: "grind", type: ACT_TYPES.CONTINUE, label: "Grind on penis", desc: "Grind your hips on their penis", arousal: { p: 20, n: 65 }, pos: ["Cowgirl", "Reverse Cowgirl", "Astride Lap"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, requiresPlayerFemale: true, requiresNpcMale: true },
    
    // NEW: Priority 2 - Vaginal on penis continue action
    squeeze_cock: { id: "squeeze_cock", menuSection: "Midsection", tool: "vagina", target: "penis", verb: "squeeze", type: ACT_TYPES.CONTINUE, label: "Squeeze cock", desc: "Squeeze their cock with your pussy", arousal: { p: 30, n: 70 }, pos: ["Cowgirl", "Reverse Cowgirl", "Astride Lap", "Missionary", "Standing", "Standing From Behind"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, intensity: "medium", femaleOnly: true, requiresNpcMale: true },
    
    // NEW: Titfuck / assjob — rubbing penis between breasts or buttocks
    // These are tease-type actions that use the penis as tool but target
    // breasts/buttocks. They're not penetration — the penis slides between
    // the body parts rather than entering an orifice. Male player only.
    titfuck: { id: "titfuck", menuSection: "Upper Body", tool: "penis", target: "breasts", verb: "fuck", type: ACT_TYPES.TEASE, label: "Fuck their tits", desc: "Slide your penis between their breasts", arousal: { p: 20, n: 35 }, pos: ["Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Kneeling Over", "Prone Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF, maleOnly: true, requiresNpcFemale: true, objectDialogueTags: ["breasts fucked"] },
    assjob: { id: "assjob", menuSection: "Midsection", tool: "penis", target: "buttocks", verb: "rub", type: ACT_TYPES.TEASE, label: "Hotdog their ass", desc: "Rub your penis between their butt cheeks", arousal: { p: 15, n: 25 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Spooning", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, maleOnly: true },
    
    // ===== ANAL ACTIONS =====
    grope_ass: { id: "grope_ass", menuSection: "Midsection", tool: "hand", target: "buttocks", verb: "grope", type: ACT_TYPES.TEASE, label: "Grope ass", desc: "Grope their ass", arousal: { p: 8, n: 20 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Doggy", "Bent Over", "Spooning", "Cowgirl", "Reverse Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    squeeze_ass: { id: "squeeze_ass", menuSection: "Midsection", tool: "hand", target: "buttocks", verb: "squeeze", type: ACT_TYPES.TEASE, label: "Squeeze ass", desc: "Squeeze their ass cheeks", arousal: { p: 8, n: 22 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Doggy", "Bent Over", "Spooning", "Cowgirl", "Reverse Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    slap_ass: { id: "slap_ass", menuSection: "Midsection", tool: "hand", target: "buttocks", verb: "slap", type: ACT_TYPES.IMPACT, label: "Slap ass", desc: "Slap their ass", arousal: { p: 10, n: 25 }, pos: ["Standing", "Standing From Behind", "Doggy", "Bent Over", "Spooning", "Cowgirl", "Reverse Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresConsent: true },
    spread_cheeks: { id: "spread_cheeks", menuSection: "Midsection", tool: "hand", target: "buttocks", verb: "spread", type: ACT_TYPES.TEASE, label: "Spread cheeks", desc: "Spread their ass cheeks apart", arousal: { p: 12, n: 30 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    
    touch_anus: { id: "touch_anus", menuSection: "Midsection", tool: "hand", target: "anus", verb: "touch", type: ACT_TYPES.TEASE, label: "Touch anus", desc: "Lightly touch their anus", arousal: { p: 10, n: 35 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Spooning", "Missionary", "Cowgirl", "Reverse Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    press_anus: { id: "press_anus", menuSection: "Midsection", tool: "hand", target: "anus", verb: "press", type: ACT_TYPES.TEASE, label: "Press anus", desc: "Press against their anus", arousal: { p: 10, n: 40 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Spooning", "Missionary", "Cowgirl", "Reverse Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    rub_anus: { id: "rub_anus", menuSection: "Midsection", tool: "hand", target: "anus", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub anus", desc: "Rub their anus", arousal: { p: 12, n: 45 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Spooning", "Missionary", "Cowgirl", "Reverse Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    
    finger_anus: { id: "finger_anus", menuSection: "Midsection", tool: "fingers", target: "anus", verb: "finger", type: ACT_TYPES.TEASE, label: "Finger anus", desc: "Tease their anus with your finger", arousal: { p: 15, n: 50 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Spooning", "Missionary", "Cowgirl", "Reverse Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresLube: true },
    enter_anus_finger: { id: "enter_anus_finger", menuSection: "Midsection", tool: "fingers", target: "anus", verb: "enter", type: ACT_TYPES.PENETRATE, label: "Finger anus deeply", desc: "Insert your finger into their anus", arousal: { p: 15, n: 60 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Spooning", "Missionary", "Cowgirl", "Reverse Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresLube: true, takesVirginity: [VIRGINITY_TYPES.ANAL] },
    finger_anus_fast: { id: "finger_anus_fast", menuSection: "Midsection", tool: "fingers", target: "anus", verb: "finger", type: ACT_TYPES.CONTINUE, label: "Finger anus fast", desc: "Finger their anus quickly", arousal: { p: 15, n: 55 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Spooning", "Missionary", "Cowgirl", "Reverse Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresLube: true },
    
    kiss_anus: { id: "kiss_anus", menuSection: "Midsection", tool: "mouth", target: "anus", verb: "kiss", type: ACT_TYPES.TEASE, label: "Kiss anus", desc: "Kiss their anus", arousal: { p: 8, n: 40 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Spooning", "Sixty-Nine", "Kneeling Over", "Riding Face", "Prone Oral Service", "Kneeling Before", "Kneeling By Face"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    lick_anus: { id: "lick_anus", menuSection: "Midsection", tool: "mouth", target: "anus", verb: "lick", type: ACT_TYPES.TEASE, label: "Lick anus", desc: "Lick their anus", arousal: { p: 10, n: 50 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Spooning", "Sixty-Nine", "Kneeling Over", "Riding Face", "Prone Oral Service", "Kneeling Before", "Kneeling By Face"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    suck_anus: { id: "suck_anus", menuSection: "Midsection", tool: "mouth", target: "anus", verb: "suck", type: ACT_TYPES.TEASE, label: "Suck anus", desc: "Suck on their anus", arousal: { p: 10, n: 55 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Spooning", "Sixty-Nine", "Kneeling Over", "Riding Face", "Prone Oral Service", "Kneeling Before", "Kneeling By Face"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    rim_anus: { id: "rim_anus", menuSection: "Midsection", tool: "mouth", target: "anus", verb: "rim", type: ACT_TYPES.TEASE, label: "Rim anus", desc: "Rim their anus with your tongue", arousal: { p: 15, n: 60 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Spooning", "Sixty-Nine", "Kneeling Over", "Riding Face", "Prone Oral Service", "Kneeling Before", "Kneeling By Face"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    tongue_anus: { id: "tongue_anus", menuSection: "Midsection", tool: "tongue", target: "anus", verb: "penetrate", type: ACT_TYPES.TEASE, label: "Tongue anus", desc: "Penetrate their anus with your tongue", arousal: { p: 15, n: 65 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Spooning", "Sixty-Nine", "Kneeling Over", "Riding Face", "Prone Oral Service", "Kneeling Before", "Kneeling By Face"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    
    // NEW: Priority 2 - Stretch Butthole (anal preparation)
    stretch_butthole: { id: "stretch_butthole", menuSection: "Midsection", tool: "fingers", target: "anus", verb: "stretch", type: ACT_TYPES.TEASE, label: "Stretch butthole", desc: "Stretch their anal opening with your fingers", arousal: { p: 15, n: 55 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Spooning", "Missionary", "Cowgirl", "Reverse Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresLube: true },
    
    // Cocktease With Ass - tease cock with anus (reverse penetration tease)
    cocktease_with_ass: { id: "cocktease_with_ass", menuSection: "Midsection", tool: "anus", target: "penis", verb: "tease", type: ACT_TYPES.TEASE, label: "Tease cock with ass", desc: "Tease their cock with your anus", arousal: { p: 25, n: 50 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Missionary", "Spooning", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcMale: true },
    
    press_penis_anus: { id: "press_penis_anus", menuSection: "Midsection", tool: "penis", target: "anus", verb: "press", type: ACT_TYPES.TEASE, label: "Press against anus", desc: "Press your penis against their anus", arousal: { p: 20, n: 50 }, pos: ["Standing From Behind", "Against Wall From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Cowgirl", "Reverse Cowgirl", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, maleOnly: true },
    enter_anus: { id: "enter_anus", menuSection: "Midsection", tool: "penis", target: "anus", verb: "enter", type: ACT_TYPES.PENETRATE, label: "Enter anus", desc: "Enter their anus", arousal: { p: 30, n: 70 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Against Wall From Behind", "Cowgirl", "Reverse Cowgirl", "Perched", "Astride Lap", "Missionary", "Spooning", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, takesVirginity: [VIRGINITY_TYPES.ANAL], maleOnly: true },
    thrust_anus: { id: "thrust_anus", menuSection: "Midsection", tool: "penis", target: "anus", verb: "thrust", type: ACT_TYPES.CONTINUE, label: "Thrust into anus", desc: "Thrust your penis into their anus", arousal: { p: 25, n: 65 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Against Wall From Behind", "Cowgirl", "Reverse Cowgirl", "Perched", "Astride Lap", "Missionary", "Spooning", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, maleOnly: true },
    pound_anus: { id: "pound_anus", menuSection: "Midsection", tool: "penis", target: "anus", verb: "pound", type: ACT_TYPES.CONTINUE, label: "Pound anus", desc: "Pound into their anus hard", arousal: { p: 35, n: 75 }, pos: ["Doggy", "Bent Over", "Standing From Behind", "Against Wall From Behind", "Cowgirl", "Reverse Cowgirl", "Perched", "Astride Lap"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, intensity: "hard", maleOnly: true },
    fuck_anus: { id: "fuck_anus", menuSection: "Midsection", tool: "penis", target: "anus", verb: "fuck", type: ACT_TYPES.CONTINUE, label: "Fuck anus", desc: "Fuck their anus", arousal: { p: 30, n: 80 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Against Wall From Behind", "Cowgirl", "Reverse Cowgirl", "Perched", "Astride Lap", "Missionary", "Spooning", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, intensity: "hard", maleOnly: true },
    
    accept_penis_anus: { id: "accept_penis_anus", menuSection: "Requests", tool: "anus", target: "penis", verb: "accept", type: ACT_TYPES.PENETRATE, label: "Ask them to enter your anus", desc: "Ask them to enter your anus", arousal: { p: 40, n: 25 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, takesVirginity: [VIRGINITY_TYPES.ANAL], playerIsBottom: true, requiresNpcMale: true },
    take_penis_anus: { id: "take_penis_anus", menuSection: "Midsection", tool: "anus", target: "penis", verb: "take", type: ACT_TYPES.CONTINUE, label: "Take penis in anus", desc: "Take their penis deeper into your anus", arousal: { p: 35, n: 30 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, requiresNpcMale: true },
    
    // NEW: Priority 2 - Hump Ass Back Onto Cock (reverse anal penetration)
    hump_ass_back_onto_cock: { id: "hump_ass_back_onto_cock", menuSection: "Requests", tool: "anus", target: "penis", verb: "hump", type: ACT_TYPES.PENETRATE, label: "Hump ass onto cock", desc: "Back your ass onto their cock", arousal: { p: 40, n: 30 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, takesVirginity: [VIRGINITY_TYPES.ANAL], playerIsBottom: true, requiresNpcMale: true },
    
    // ===== NEW: Priority 2 - LEG/THIGH ACTIONS ===== 
    // Pussy against leg
    rub_pussy_against_leg: { id: "rub_pussy_against_leg", menuSection: "Lower Body", tool: "vagina", target: "thighs", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub {playerPussy} against leg", desc: "Rub your pussy against their leg", arousal: { p: 20, n: 25 }, pos: ["Standing", "Standing From Behind", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, femaleOnly: true, playerIsBottom: false },
    rub_leg_against_pussy: { id: "rub_leg_against_pussy", menuSection: "Midsection", tool: "thighs", target: "vagina", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub leg against pussy", desc: "Rub your leg against their pussy", arousal: { p: 15, n: 20 }, pos: ["Standing", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcFemale: true },
    
    // Cock against leg
    rub_cock_against_leg: { id: "rub_cock_against_leg", menuSection: "Lower Body", tool: "penis", target: "thighs", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub {playerCock} against leg", desc: "Rub your penis against their leg", arousal: { p: 20, n: 25 }, pos: ["Standing", "Standing From Behind", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, maleOnly: true, playerIsBottom: false },
    rub_leg_against_cock: { id: "rub_leg_against_cock", menuSection: "Midsection", tool: "thighs", target: "penis", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub leg against cock", desc: "Rub your leg against their penis", arousal: { p: 15, n: 20 }, pos: ["Standing", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcMale: true },
    
    // ===== PENIS ACTIONS (NPC has penis) =====
    stroke_penis: { id: "stroke_penis", menuSection: "Midsection", tool: "hand", target: "penis", verb: "stroke", type: ACT_TYPES.TEASE, label: "Stroke penis", desc: "Stroke their penis", arousal: { p: 15, n: 30 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Cowgirl", "Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcMale: true },
    grip_penis: { id: "grip_penis", menuSection: "Midsection", tool: "hand", target: "penis", verb: "grip", type: ACT_TYPES.TEASE, label: "Grip penis", desc: "Grip their penis firmly", arousal: { p: 12, n: 25 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Cowgirl", "Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcMale: true },
    squeeze_penis: { id: "squeeze_penis", menuSection: "Midsection", tool: "hand", target: "penis", verb: "squeeze", type: ACT_TYPES.TEASE, label: "Squeeze penis", desc: "Squeeze their penis", arousal: { p: 10, n: 20 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Cowgirl", "Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcMale: true },
    
    // NEW: Priority 2 - Testicles (balls) hand actions
    fondle_balls: { id: "fondle_balls", menuSection: "Midsection", tool: "hand", target: "testicles", verb: "fondle", type: ACT_TYPES.TEASE, label: "Fondle balls", desc: "Fondle their testicles", arousal: { p: 15, n: 25 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Cowgirl", "Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcMale: true },
    tease_cock_with_fingers: { id: "tease_cock_with_fingers", menuSection: "Midsection", tool: "fingers", target: "penis", verb: "tease", type: ACT_TYPES.TEASE, label: "Tease cock with fingers", desc: "Tease their penis with your fingers", arousal: { p: 15, n: 30 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Cowgirl", "Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcMale: true },
    
    kiss_penis: { id: "kiss_penis", menuSection: "Midsection", tool: "mouth", target: "penis", verb: "kiss", type: ACT_TYPES.TEASE, label: "Kiss penis", desc: "Kiss their penis", arousal: { p: 10, n: 25 }, pos: ["Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Kneeling Before", "Mounted On X-Cross Oral Service", "Kneeling By Face", "Standing From Behind"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcMale: true },
    lick_penis: { id: "lick_penis", menuSection: "Midsection", tool: "mouth", target: "penis", verb: "lick", type: ACT_TYPES.TEASE, label: "Lick penis", desc: "Lick their penis", arousal: { p: 12, n: 30 }, pos: ["Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Kneeling Before", "Mounted On X-Cross Oral Service", "Kneeling By Face", "Standing From Behind"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcMale: true },
    suck_penis: { id: "suck_penis", menuSection: "Midsection", tool: "mouth", target: "penis", verb: "suck", type: ACT_TYPES.TEASE, label: "Suck penis", desc: "Suck their penis", arousal: { p: 15, n: 40 }, pos: ["Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Kneeling Before", "Mounted On X-Cross Oral Service", "Kneeling By Face", "Standing From Behind"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcMale: true },
    deepthroat_penis: { id: "deepthroat_penis", menuSection: "Midsection", tool: "mouth", target: "penis", verb: "deepthroat", type: ACT_TYPES.PENETRATE, label: "Deepthroat penis", desc: "Deepthroat their penis", arousal: { p: 20, n: 60 }, pos: ["Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Kneeling Before", "Mounted On X-Cross Oral Service", "Kneeling By Face", "Standing From Behind"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcMale: true },
    
    // Male player receiving oral
    accept_penis_mouth: { id: "accept_penis_mouth", menuSection: "Requests", tool: "mouth", target: "penis", verb: "accept", type: ACT_TYPES.PENETRATE, label: "Ask them to put it in your mouth", desc: "Ask them to put their penis in your mouth", arousal: { p: 25, n: 40 }, pos: ["Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true, requiresNpcMale: true },
    deepthroat_penis_player: { id: "deepthroat_penis_player", menuSection: "Requests", tool: "mouth", target: "penis", verb: "deepthroat", type: ACT_TYPES.CONTINUE, label: "Deepthroat their cock", desc: "Deepthroat their penis", arousal: { p: 30, n: 60 }, pos: ["Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true, requiresNpcMale: true },
    deepthroat_mouth: { id: "deepthroat_mouth", menuSection: "Head", tool: "penis", target: "mouth", verb: "deepthroat", type: ACT_TYPES.PENETRATE, label: "Deepthroat them", desc: "Drive your cock into their throat", arousal: { p: 30, n: 35 }, pos: ["Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, maleOnly: true, objectDialogueTags: ["cock in mouth"] },
    throat_fuck: { id: "throat_fuck", menuSection: "Head", tool: "penis", target: "mouth", verb: "thrust", type: ACT_TYPES.CONTINUE, label: "Throatfuck them", desc: "Drive your cock down their throat in hard strokes", arousal: { p: 35, n: 25 }, pos: ["Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, intensity: "hard", maleOnly: true, objectDialogueTags: ["cock in mouth"] },
    self_deepthroat: { id: "self_deepthroat", menuSection: "Requests", tool: "mouth", target: "penis", verb: "swallow", type: ACT_TYPES.CONTINUE, label: "Let them swallow you whole", desc: "Let them take you down their throat on their own", arousal: { p: 40, n: 30 }, pos: ["Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true, requiresPlayerMale: true },

    
    // NEW: Priority 2 - Testicles (balls) oral actions
    lick_balls: { id: "lick_balls", menuSection: "Midsection", tool: "mouth", target: "testicles", verb: "lick", type: ACT_TYPES.TEASE, label: "Lick balls", desc: "Lick their testicles", arousal: { p: 12, n: 30 }, pos: ["Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Kneeling Before", "Mounted On X-Cross Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcMale: true },
    suck_balls: { id: "suck_balls", menuSection: "Midsection", tool: "mouth", target: "testicles", verb: "suck", type: ACT_TYPES.TEASE, label: "Suck balls", desc: "Suck on their testicles", arousal: { p: 15, n: 35 }, pos: ["Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Kneeling Before", "Mounted On X-Cross Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcMale: true },
    
    // Fuck Mouth - active face fucking (continue action)
    fuck_mouth: { id: "fuck_mouth", menuSection: "Head", tool: "penis", target: "mouth", verb: "fuck", type: ACT_TYPES.CONTINUE, label: "Fuck mouth", desc: "Fuck their mouth with your penis", arousal: { p: 50, n: 10 }, pos: ["Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, maleOnly: true, objectDialogueTags: ["cock in mouth"] },
    
    // ===== ORAL ON PLAYER =====
    kiss_player_mouth: { id: "kiss_player_mouth", menuSection: "Requests", tool: "mouth", target: "mouth", verb: "kiss", type: ACT_TYPES.TEASE, label: "Ask them to kiss your lips", desc: "Ask them to kiss your lips", arousal: { p: 5, n: 5 }, pos: ["Standing", "Perched", "Astride Lap", "Missionary", "Against Wall", "Kneeling", "Kneeling Over", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.ANY, playerIsBottom: true },
    suck_player_nipples: { id: "suck_player_nipples", menuSection: "Requests", tool: "mouth", target: "nipples", verb: "suck", type: ACT_TYPES.TEASE, label: "Ask them to suck your nipples", desc: "Ask them to suck on your nipples", arousal: { p: 40, n: 12 }, pos: ["Standing", "Perched", "Astride Lap", "Missionary", "Against Wall", "Kneeling", "Kneeling Over", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF, playerIsBottom: true },
    lick_player_pussy: { id: "lick_player_pussy", menuSection: "Requests", tool: "mouth", target: "vagina", verb: "lick", type: ACT_TYPES.TEASE, label: "Ask them to lick your pussy", desc: "Ask them to lick your pussy", arousal: { p: 50, n: 12 }, pos: ["Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true, requiresPlayerFemale: true },
    suck_player_clit: { id: "suck_player_clit", menuSection: "Requests", tool: "mouth", target: "clitoris", verb: "suck", type: ACT_TYPES.TEASE, label: "Ask them to suck your clit", desc: "Ask them to suck on your clitoris", arousal: { p: 55, n: 12 }, pos: ["Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true, requiresPlayerFemale: true },
    suck_player_penis: { id: "suck_player_penis", menuSection: "Requests", tool: "mouth", target: "penis", verb: "suck", type: ACT_TYPES.TEASE, label: "Ask them to suck your cock", desc: "Ask them to suck your penis", arousal: { p: 40, n: 15 }, pos: ["Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true, requiresPlayerMale: true },
    stroke_player_penis: { id: "stroke_player_penis", menuSection: "Requests", tool: "hand", target: "penis", verb: "stroke", type: ACT_TYPES.TEASE, label: "Ask them to stroke your cock", desc: "Ask them to stroke your penis with their hand", arousal: { p: 25, n: 10 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Cowgirl", "Reverse Cowgirl", "Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true, requiresPlayerMale: true },
    titjob_player: { id: "titjob_player", menuSection: "Requests", tool: "breasts", target: "penis", verb: "stroke", type: ACT_TYPES.TEASE, label: "Ask them to wrap their breasts around your cock", desc: "Ask them to press their breasts around your penis", arousal: { p: 45, n: 25 }, pos: ["Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Kneeling Over", "Prone Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true, requiresPlayerMale: true, requiresNpcFemale: true },
    deepthroat_player_penis: { id: "deepthroat_player_penis", menuSection: "Requests", tool: "mouth", target: "penis", verb: "deepthroat", type: ACT_TYPES.TEASE, label: "Ask them to deepthroat you", desc: "Ask them to deepthroat your penis", arousal: { p: 60, n: 20 }, pos: ["Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true, requiresPlayerMale: true },
    lick_player_balls: { id: "lick_player_balls", menuSection: "Requests", tool: "mouth", target: "testicles", verb: "lick", type: ACT_TYPES.TEASE, label: "Ask them to lick your balls", desc: "Ask them to lick your testicles", arousal: { p: 30, n: 15 }, pos: ["Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true, requiresPlayerMale: true },
    suck_player_balls: { id: "suck_player_balls", menuSection: "Requests", tool: "mouth", target: "testicles", verb: "suck", type: ACT_TYPES.TEASE, label: "Ask them to suck your balls", desc: "Ask them to suck on your testicles", arousal: { p: 35, n: 20 }, pos: ["Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true, requiresPlayerMale: true },
    lick_player_anus: { id: "lick_player_anus", menuSection: "Requests", tool: "mouth", target: "anus", verb: "lick", type: ACT_TYPES.TEASE, label: "Ask them to lick your anus", desc: "Ask them to lick your anus", arousal: { p: 50, n: 10 }, pos: ["Doggy", "Bent Over", "Standing From Behind", "Sixty-Nine"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true },
    rim_player_anus: { id: "rim_player_anus", menuSection: "Requests", tool: "mouth", target: "anus", verb: "rim", type: ACT_TYPES.TEASE, label: "Ask them to rim your anus", desc: "Ask them to rim your anus", arousal: { p: 60, n: 15 }, pos: ["Doggy", "Bent Over", "Standing From Behind", "Sixty-Nine"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true },
    
    // ===== PLAYER GENITAL INTERACTIONS AGAINST FACE/NECK =====
    // Female player: Rub pussy against NPC face/head parts
    rub_pussy_against_face: { id: "rub_pussy_against_face", menuSection: "Requests", tool: "vagina", target: "face", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub pussy against face", desc: "Rub your pussy against their face", arousal: { p: 35, n: 30 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over", "Riding Face"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresPlayerFemale: true, playerIsBottom: true },
    rub_pussy_against_mouth: { id: "rub_pussy_against_mouth", menuSection: "Requests", tool: "vagina", target: "mouth", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub pussy against mouth", desc: "Rub your pussy against their mouth", arousal: { p: 40, n: 35 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over", "Riding Face", "Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresPlayerFemale: true, playerIsBottom: true },
    rub_pussy_against_lips: { id: "rub_pussy_against_lips", menuSection: "Requests", tool: "vagina", target: "lips", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub pussy against lips", desc: "Rub your pussy against their lips", arousal: { p: 38, n: 32 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over", "Riding Face"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresPlayerFemale: true, playerIsBottom: true },
    rub_pussy_against_nose: { id: "rub_pussy_against_nose", menuSection: "Requests", tool: "vagina", target: "nose", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub pussy against nose", desc: "Rub your pussy against their nose", arousal: { p: 35, n: 30 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over", "Riding Face"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresPlayerFemale: true, playerIsBottom: true },
    rub_pussy_against_cheek: { id: "rub_pussy_against_cheek", menuSection: "Requests", tool: "vagina", target: "cheek", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub pussy against cheek", desc: "Rub your pussy against their cheek", arousal: { p: 32, n: 28 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over", "Riding Face"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresPlayerFemale: true, playerIsBottom: true },
    rub_pussy_against_neck: { id: "rub_pussy_against_neck", menuSection: "Requests", tool: "vagina", target: "neck", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub pussy against neck", desc: "Rub your pussy against their neck", arousal: { p: 30, n: 25 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over", "Riding Face"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresPlayerFemale: true, playerIsBottom: true },
    
    // Male player: Rub cock against NPC face/head parts
    rub_penis_against_face: { id: "rub_penis_against_face", menuSection: "Head", tool: "penis", target: "face", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub cock against face", desc: "Rub your cock against their face", arousal: { p: 35, n: 30 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresPlayerMale: true, playerIsBottom: false },
    rub_penis_against_mouth: { id: "rub_penis_against_mouth", menuSection: "Head", tool: "penis", target: "mouth", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub cock against mouth", desc: "Rub your cock against their mouth", arousal: { p: 40, n: 35 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over", "Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresPlayerMale: true, playerIsBottom: false },
    rub_penis_against_lips: { id: "rub_penis_against_lips", menuSection: "Head", tool: "penis", target: "lips", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub cock against lips", desc: "Rub your cock against their lips", arousal: { p: 38, n: 32 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresPlayerMale: true, playerIsBottom: false },
    rub_penis_against_cheek: { id: "rub_penis_against_cheek", menuSection: "Head", tool: "penis", target: "cheek", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub cock against cheek", desc: "Rub your cock against their cheek", arousal: { p: 32, n: 28 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresPlayerMale: true, playerIsBottom: false },
    rub_penis_against_neck: { id: "rub_penis_against_neck", menuSection: "Head", tool: "penis", target: "neck", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub cock against neck", desc: "Rub your cock against their neck", arousal: { p: 30, n: 25 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresPlayerMale: true, playerIsBottom: false },
    
    // ===== BUTTOCKS/ANUS INTERACTIONS =====
    // Player male: Penis against buttocks and anus
    
    // Player female: Vagina against buttocks and anus (tribadism style)
    rub_pussy_against_buttocks: { id: "rub_pussy_against_buttocks", menuSection: "Requests", tool: "vagina", target: "buttocks", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub pussy against buttocks", desc: "Rub your pussy against their buttocks", arousal: { p: 30, n: 30 }, pos: ["Standing", "Standing From Behind", "Doggy", "Bent Over", "Against Wall From Behind", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresPlayerFemale: true, playerIsBottom: true },
    press_pussy_against_anus: { id: "press_pussy_against_anus", menuSection: "Requests", tool: "vagina", target: "anus", verb: "press", type: ACT_TYPES.TEASE, label: "Press pussy against anus", desc: "Press your pussy against their anus", arousal: { p: 25, n: 35 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Against Wall From Behind", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresPlayerFemale: true, playerIsBottom: true },
    
    // ===== FEET INTERACTIONS =====
    // Player actions on NPC feet
    kiss_feet: { id: "kiss_feet", menuSection: "Lower Body", tool: "mouth", target: "feet", verb: "kiss", type: ACT_TYPES.TEASE, label: "Kiss feet", desc: "Kiss their feet", arousal: { p: 3, n: 5 }, pos: ["Kneeling", "Kneeling Before", "Kneeling By Face", "Squatting Before"], reqCloth: CLOTHING_REQUIREMENTS.ANY, sleepingSafe: true, objectDialogueTags: ["feet kissed"] },
    lick_feet: { id: "lick_feet", menuSection: "Lower Body", tool: "mouth", target: "feet", verb: "lick", type: ACT_TYPES.TEASE, label: "Lick feet", desc: "Lick their feet", arousal: { p: 5, n: 8 }, pos: ["Kneeling", "Kneeling Before", "Kneeling By Face", "Squatting Before"], reqCloth: CLOTHING_REQUIREMENTS.ANY, objectDialogueTags: ["feet licked"] },
    caress_feet: { id: "caress_feet", menuSection: "Lower Body", tool: "hand", target: "feet", verb: "caress", type: ACT_TYPES.TEASE, label: "Caress feet", desc: "Caress their feet with your hands", arousal: { p: 4, n: 6 }, pos: ["Kneeling", "Kneeling Before", "Kneeling By Face", "Squatting Before", "Standing", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    massage_feet: { id: "massage_feet", menuSection: "Lower Body", tool: "hand", target: "feet", verb: "massage", type: ACT_TYPES.TEASE, label: "Massage feet", desc: "Massage their feet", arousal: { p: 5, n: 8 }, pos: ["Kneeling", "Kneeling Before", "Kneeling By Face", "Squatting Before", "Standing", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.ANY, objectDialogueTags: ["feet massaged"] },
    stroke_feet: { id: "stroke_feet", menuSection: "Lower Body", tool: "hand", target: "feet", verb: "stroke", type: ACT_TYPES.TEASE, label: "Stroke feet", desc: "Stroke their feet", arousal: { p: 3, n: 5 }, pos: ["Kneeling", "Kneeling Before", "Kneeling By Face", "Squatting Before", "Standing", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    suck_toes: { id: "suck_toes", menuSection: "Lower Body", tool: "mouth", target: "toes", verb: "suck", type: ACT_TYPES.TEASE, label: "Suck toes", desc: "Suck on their toes", arousal: { p: 5, n: 8 }, pos: ["Kneeling", "Kneeling Before", "Kneeling By Face", "Squatting Before"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    rub_cock_against_foot: { id: "rub_cock_against_foot", menuSection: "Lower Body", tool: "penis", target: "foot", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub cock against foot", desc: "Rub your cock against their foot", arousal: { p: 30, n: 25 }, pos: ["Standing", "Perched", "Kneeling", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, maleOnly: true, playerIsBottom: false },
    rub_pussy_against_foot: { id: "rub_pussy_against_foot", menuSection: "Lower Body", tool: "vagina", target: "foot", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub pussy against foot", desc: "Rub your pussy against their foot", arousal: { p: 25, n: 20 }, pos: ["Standing", "Perched", "Kneeling", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, femaleOnly: true, playerIsBottom: false },
    
    // ===== VARIED REQUEST ACTIONS =====
    request_sit_on_face: { id: "request_sit_on_face", menuSection: "Requests", tool: "mouth", target: "face", verb: "request", type: ACT_TYPES.TEASE, label: "Request they sit on your face", desc: "Ask them to sit on your face", arousal: { p: 30, n: 20 }, pos: ["Standing", "Kneeling", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true },
    request_lick_feet: { id: "request_lick_feet", menuSection: "Requests", tool: "mouth", target: "feet", verb: "request", type: ACT_TYPES.TEASE, label: "Request they lick your feet", desc: "Ask them to lick your feet", arousal: { p: 20, n: 10 }, pos: ["Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.ANY, playerIsBottom: true },
    request_lick_pussy: { id: "request_lick_pussy", menuSection: "Requests", tool: "mouth", target: "vagina", verb: "request", type: ACT_TYPES.TEASE, label: "Request they lick your pussy", desc: "Ask them to lick your pussy", arousal: { p: 40, n: 12 }, pos: ["Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Kneeling Over", "Prone Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true, requiresPlayerFemale: true },
    request_suck_cock: { id: "request_suck_cock", menuSection: "Requests", tool: "mouth", target: "penis", verb: "request", type: ACT_TYPES.TEASE, label: "Request they suck your cock", desc: "Ask them to suck your cock", arousal: { p: 45, n: 15 }, pos: ["Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Kneeling Over", "Prone Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true, requiresPlayerMale: true },
    request_lick_anus: { id: "request_lick_anus", menuSection: "Requests", tool: "mouth", target: "anus", verb: "request", type: ACT_TYPES.TEASE, label: "Request they lick your anus", desc: "Ask them to lick your anus", arousal: { p: 45, n: 10 }, pos: ["Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Kneeling Over", "Prone Oral Service", "Doggy", "Bent Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true },
    request_kiss: { id: "request_kiss", menuSection: "Requests", tool: "mouth", target: "mouth", verb: "request", type: ACT_TYPES.TEASE, label: "Request a kiss", desc: "Ask them to kiss you", arousal: { p: 10, n: 5 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling", "Kneeling Over", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.ANY, playerIsBottom: true },
    request_fondle: { id: "request_fondle", menuSection: "Requests", tool: "hand", target: "body", verb: "request", type: ACT_TYPES.TEASE, label: "Request they fondle you", desc: "Ask them to touch and fondle your body", arousal: { p: 25, n: 10 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling", "Kneeling Over", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.ANY, playerIsBottom: true },
    request_grope: { id: "request_grope", menuSection: "Requests", tool: "hand", target: "breasts", verb: "request", type: ACT_TYPES.TEASE, label: "Request they grope you", desc: "Ask them to grope your breasts", arousal: { p: 30, n: 12 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling", "Kneeling Over", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF, playerIsBottom: true, requiresPlayerFemale: true },
    
    // Submissive demeanor request actions - only available when player is in submissive demeanor mode
    request_step_on_face: { id: "request_step_on_face", menuSection: "Requests", tool: "foot", target: "face", verb: "request", type: ACT_TYPES.TEASE, label: "Request they step on your face", desc: "Ask them to step on your face", arousal: { p: 25, n: 20 }, pos: ["Kneeling", "Kneeling Before", "Prone"], reqCloth: CLOTHING_REQUIREMENTS.ANY, playerIsBottom: true, requiresDemeanorMode: ["submissive"] },
    request_step_on_chest: { id: "request_step_on_chest", menuSection: "Requests", tool: "foot", target: "chest", verb: "request", type: ACT_TYPES.TEASE, label: "Request they step on your chest", desc: "Ask them to step on your chest", arousal: { p: 20, n: 15 }, pos: ["Prone"], reqCloth: CLOTHING_REQUIREMENTS.ANY, playerIsBottom: true, requiresDemeanorMode: ["submissive"] },
    request_squeeze_balls: { id: "request_squeeze_balls", menuSection: "Requests", tool: "hand", target: "testicles", verb: "request", type: ACT_TYPES.TEASE, label: "Request they squeeze your balls", desc: "Ask them to squeeze your testicles", arousal: { p: 25, n: 20 }, pos: ["Standing", "Perched", "Kneeling", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true, requiresDemeanorMode: ["submissive"], requiresPlayerMale: true },
    request_spanking: { id: "request_spanking", menuSection: "Requests", tool: "hand", target: "butt", verb: "request", type: ACT_TYPES.IMPACT, label: "Request a spanking", desc: "Ask them to spank your butt", arousal: { p: 20, n: 15 }, pos: ["Bent Over", "Doggy", "Standing From Behind", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.ANY, playerIsBottom: true, requiresDemeanorMode: ["submissive"] },
    
    // Beg actions for submissive demeanor
    beg_for_touch: { id: "beg_for_touch", menuSection: "Requests", tool: "hand", target: "body", verb: "beg", type: ACT_TYPES.TEASE, label: "Beg for their touch", desc: "Plead with them to touch you", arousal: { p: 20, n: 10 }, pos: ["Standing", "Perched", "Kneeling", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.ANY, playerIsBottom: true, requiresDemeanorMode: ["submissive"] },
    beg_for_attention: { id: "beg_for_attention", menuSection: "Requests", tool: "body", target: "body", verb: "beg", type: ACT_TYPES.TEASE, label: "Beg for their attention", desc: "Plead with them to pay attention to you", arousal: { p: 15, n: 5 }, pos: ["Standing", "Perched", "Kneeling", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.ANY, playerIsBottom: true, requiresDemeanorMode: ["submissive"] },
    beg_for_use: { id: "beg_for_use", menuSection: "Requests", tool: "body", target: "body", verb: "beg", type: ACT_TYPES.TEASE, label: "Beg to be used", desc: "Plead with them to use you as they please", arousal: { p: 25, n: 15 }, pos: ["Standing", "Kneeling", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.ANY, playerIsBottom: true, requiresDemeanorMode: ["submissive"] },
    beg_for_praise: { id: "beg_for_praise", menuSection: "Requests", tool: "voice", target: "mind", verb: "beg", type: ACT_TYPES.TEASE, label: "Beg for praise", desc: "Plead with them to praise you", arousal: { p: 10, n: 5 }, pos: ["Standing", "Perched", "Kneeling", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.ANY, playerIsBottom: true, requiresDemeanorMode: ["submissive"] },
    
    // Dominant demeanor command actions - only available when player is in dominant demeanor mode
    // These require domination checks and use NPC stats for resistance
    order_kneel: { id: "order_kneel", menuSection: "Requests", tool: "voice", target: "body", verb: "order", type: ACT_TYPES.TEASE, label: "Order them to kneel", desc: "Command them to kneel before you", arousal: { p: 20, n: 15 }, pos: ["Standing", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.ANY, playerIsBottom: false, requiresDemeanorMode: ["dominant"], requiresDominateCheck: true, resistanceStat: "willpower" },
    command_undress: { id: "command_undress", menuSection: "Clothing", tool: "voice", target: "body", verb: "command", type: ACT_TYPES.CLOTHING, label: "Command them to undress", desc: "Order them to remove their clothing", arousal: { p: 15, n: 10 }, pos: ["Standing", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.ANY, playerIsBottom: false, requiresDemeanorMode: ["dominant"], requiresDominateCheck: true, resistanceStat: "willpower" },
    demand_serve: { id: "demand_serve", menuSection: "Requests", tool: "voice", target: "body", verb: "demand", type: ACT_TYPES.TEASE, label: "Demand they serve you", desc: "Demand they serve you as their master", arousal: { p: 25, n: 20 }, pos: ["Standing", "Perched", "Kneeling", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.ANY, playerIsBottom: false, requiresDemeanorMode: ["dominant"], requiresDominateCheck: true, resistanceStat: "willpower" },
    demand_worship: { id: "demand_worship", menuSection: "Requests", tool: "voice", target: "body", verb: "demand", type: ACT_TYPES.TEASE, label: "Demand they worship you", desc: "Command them to show worship and devotion", arousal: { p: 20, n: 15 }, pos: ["Standing", "Perched", "Kneeling", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.ANY, playerIsBottom: false, requiresDemeanorMode: ["dominant"], requiresDominateCheck: true, resistanceStat: "willpower" },
    command_mouth: { id: "command_mouth", menuSection: "Requests", tool: "voice", target: "mouth", verb: "command", type: ACT_TYPES.TEASE, label: "Command their mouth", desc: "Order them to use their mouth on you", arousal: { p: 30, n: 25 }, pos: ["Standing", "Perched", "Kneeling", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.ANY, playerIsBottom: false, requiresDemeanorMode: ["dominant"], requiresDominateCheck: true, resistanceStat: "willpower", },
    demand_obey: { id: "demand_obey", menuSection: "Requests", tool: "voice", target: "body", verb: "demand", type: ACT_TYPES.TEASE, label: "Demand they obey", desc: "Demand their complete obedience to your commands", arousal: { p: 20, n: 15 }, pos: ["Standing", "Perched", "Kneeling", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.ANY, playerIsBottom: false, requiresDemeanorMode: ["dominant"], requiresDominateCheck: true, resistanceStat: "willpower" },
    force_kneel: { id: "force_kneel", menuSection: "Requests", tool: "hand", target: "body", verb: "force", type: ACT_TYPES.TEASE, label: "Force them to their knees", desc: "Physically guide them to kneel before you", arousal: { p: 25, n: 20 }, pos: ["Standing", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.ANY, playerIsBottom: false, requiresDemeanorMode: ["dominant"], requiresDominateCheck: true, resistanceStat: "physicalProwess" },
    
    // ===== END ACTIONS =====
    stop: { id: "stop", menuSection: "Requests", type: ACT_TYPES.END, label: "Stop", desc: "Stop intimate actions", arousal: { p: 0, n: 0 }, pos: ["Standing", "Perched", "Astride Lap", "Missionary", "Against Wall", "Standing From Behind", "Against Wall From Behind", "Spooning", "Doggy", "Bent Over", "Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Cowgirl", "Reverse Cowgirl", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    pause: { id: "pause", menuSection: "Requests", type: ACT_TYPES.END, label: "Pause", desc: "Pause and take a break", arousal: { p: -5, n: -5 }, pos: ["Standing", "Perched", "Astride Lap", "Missionary", "Against Wall", "Standing From Behind", "Against Wall From Behind", "Spooning", "Doggy", "Bent Over", "Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Cowgirl", "Reverse Cowgirl", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    
    // NEW: End fingering actions from COT
    stop_fingering: { id: "stop_fingering", menuSection: "Requests", type: ACT_TYPES.END, label: "Stop fingering", desc: "Remove your fingers from their pussy", arousal: { p: 0, n: 0 }, pos: ["Standing", "Perched", "Astride Lap", "Missionary", "Against Wall", "Standing From Behind", "Against Wall From Behind", "Spooning", "Doggy", "Bent Over", "Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Cowgirl", "Reverse Cowgirl", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcFemale: true },
    pull_off_of_finger: { id: "pull_off_of_finger", menuSection: "Requests", type: ACT_TYPES.END, label: "Pull off finger", desc: "Pull your pussy off their fingers", arousal: { p: 0, n: 0 }, pos: ["Standing", "Perched", "Astride Lap", "Missionary", "Against Wall", "Standing From Behind", "Against Wall From Behind", "Spooning", "Doggy", "Bent Over", "Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Cowgirl", "Reverse Cowgirl", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true, requiresPlayerFemale: true },
    
    // NEW: End PIV/Penetration actions from COT
    pull_out: { id: "pull_out", menuSection: "Requests", type: ACT_TYPES.END, label: "Pull Away", desc: "Pull your penis out of their pussy", arousal: { p: 0, n: 0 }, pos: ["Standing", "Perched", "Astride Lap", "Missionary", "Against Wall", "Standing From Behind", "Against Wall From Behind", "Spooning", "Doggy", "Bent Over", "Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Cowgirl", "Reverse Cowgirl", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, maleOnly: true },
    pull_off: { id: "pull_off", menuSection: "Requests", type: ACT_TYPES.END, label: "Pull off", desc: "Pull your pussy off their penis", arousal: { p: 0, n: 0 }, pos: ["Standing", "Perched", "Astride Lap", "Missionary", "Against Wall", "Standing From Behind", "Against Wall From Behind", "Spooning", "Doggy", "Bent Over", "Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Cowgirl", "Reverse Cowgirl", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, playerIsBottom: true, requiresPlayerFemale: true, requiresNpcMale: true },
    
    // NEW: End oral actions from COT
    release_cock: { id: "release_cock", menuSection: "Requests", type: ACT_TYPES.END, label: "Release cock", desc: "Release their penis from your hand", arousal: { p: 0, n: 0 }, pos: ["Standing", "Perched", "Astride Lap", "Missionary", "Against Wall", "Standing From Behind", "Against Wall From Behind", "Spooning", "Doggy", "Bent Over", "Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Cowgirl", "Reverse Cowgirl", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcMale: true },
    pull_out_of_mouth: { id: "pull_out_of_mouth", menuSection: "Requests", type: ACT_TYPES.END, label: "Pull Away from mouth", desc: "Pull your penis out of their mouth", arousal: { p: 0, n: 0 }, pos: ["Standing", "Perched", "Astride Lap", "Missionary", "Against Wall", "Standing From Behind", "Against Wall From Behind", "Spooning", "Doggy", "Bent Over", "Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Cowgirl", "Reverse Cowgirl", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, maleOnly: true },

    // Generic pull-out: works for any active penetration regardless of orifice.
    // The label/desc are dynamic — the engine updates them based on what's
    // currently being penetrated. Always available when penetration is active.
    pull_out_generic: { id: "pull_out_generic", menuSection: "Requests", type: ACT_TYPES.END, label: "Pull Out", desc: "Withdraw from current penetration", arousal: { p: 0, n: 0 }, pos: ["Standing", "Perched", "Astride Lap", "Missionary", "Against Wall", "Standing From Behind", "Against Wall From Behind", "Spooning", "Doggy", "Bent Over", "Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service", "Riding Face", "Cowgirl", "Reverse Cowgirl", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.ANY },

    // ===== NEW: Priority 2 - SPECIAL PAIRING ACTIONS =====
    // M2M: Frot (cock-to-cock rubbing)
    frot: { id: "frot", menuSection: "Midsection", tool: "penis", target: "penis", verb: "frot", type: ACT_TYPES.TEASE, label: "Frot", desc: "Rub your cock against their cock", arousal: { p: 25, n: 25 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, maleOnly: true, requiresNpcMale: true },
    
    // F2F: Trib (vulva-to-vulva rubbing)
    trib: { id: "trib", menuSection: "Midsection", tool: "vagina", target: "vagina", verb: "trib", type: ACT_TYPES.TEASE, label: "Trib", desc: "Rub your pussy against their pussy", arousal: { p: 25, n: 25 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, femaleOnly: true, requiresNpcFemale: true },

    // ===== CLIMAX/EJACULATION ACTIONS =====
    // Male climax inside (vaginal)
    ejaculate_in_vagina: { id: "ejaculate_in_vagina", menuSection: "Midsection", tool: "penis", target: "vagina", verb: "ejaculate", type: ACT_TYPES.CONTINUE, label: "Ejaculate inside", desc: "Release inside their pussy", arousal: { p: 50, n: 100 }, pos: ["Standing", "Standing From Behind", "Missionary", "Doggy", "Bent Over", "Against Wall", "Against Wall From Behind", "Cowgirl", "Reverse Cowgirl", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, triggersClimax: true, maleOnly: true, requiresNpcFemale: true, consequence: "internal_semen" },
    
    // Male climax inside (anal)
    ejaculate_in_anus: { id: "ejaculate_in_anus", menuSection: "Midsection", tool: "penis", target: "anus", verb: "ejaculate", type: ACT_TYPES.CONTINUE, label: "Ejaculate inside anus", desc: "Release inside their anus", arousal: { p: 50, n: 100 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, triggersClimax: true, maleOnly: true, consequence: "internal_semen" },
    
    // Male climax inside (cloaca) - for reptilian/amorphous species
    ejaculate_in_cloaca: { id: "ejaculate_in_cloaca", menuSection: "Midsection", tool: "penis", target: "cloaca", verb: "ejaculate", type: ACT_TYPES.CONTINUE, label: "Ejaculate inside cloaca", desc: "Release inside their vent", arousal: { p: 50, n: 100 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, triggersClimax: true, maleOnly: true, requiresNpcCloaca: true, consequence: "internal_semen" },
    
    // Male climax on cloaca (external)
    ejaculate_on_cloaca: { id: "ejaculate_on_cloaca", menuSection: "Midsection", tool: "penis", target: "cloaca", verb: "ejaculate on", type: ACT_TYPES.CONTINUE, label: "Ejaculate on vent", desc: "Release on their cloaca", arousal: { p: 35, n: 70 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, triggersClimax: true, maleOnly: true, requiresNpcCloaca: true, consequence: "external_semen" },
    
    // Male climax inside (mouth)
    ejaculate_in_mouth: { id: "ejaculate_in_mouth", menuSection: "Head", tool: "penis", target: "mouth", verb: "ejaculate", type: ACT_TYPES.CONTINUE, label: "Ejaculate in mouth", desc: "Release in their mouth", arousal: { p: 40, n: 80 }, pos: ["Perched", "Missionary", "Astride Lap", "Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Kneeling Over", "Sixty-Nine", "Prone Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, triggersClimax: true, maleOnly: true, consequence: "oral_semen" },
    
    // Male climax on body parts
    ejaculate_on_face: { id: "ejaculate_on_face", menuSection: "Head", tool: "penis", target: "face", verb: "ejaculate on", type: ACT_TYPES.CONTINUE, label: "Ejaculate on face", desc: "Release on their face", arousal: { p: 35, n: 70 }, pos: ["Perched", "Missionary", "Astride Lap", "Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Kneeling Over", "Sixty-Nine", "Prone Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, triggersClimax: true, maleOnly: true, consequence: "external_semen" },
    ejaculate_on_chest: { id: "ejaculate_on_chest", menuSection: "Upper Body", tool: "penis", target: "chest", verb: "ejaculate on", type: ACT_TYPES.CONTINUE, label: "Ejaculate on {npcChest}", desc: "Release on their chest", arousal: { p: 35, n: 70 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over", "Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF, triggersClimax: true, maleOnly: true, consequence: "external_semen" },
    ejaculate_on_breasts: { id: "ejaculate_on_breasts", menuSection: "Upper Body", tool: "penis", target: "breasts", verb: "ejaculate on", type: ACT_TYPES.CONTINUE, label: "Ejaculate on {npcBreasts}", desc: "Release on their breasts", arousal: { p: 35, n: 70 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over", "Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF, triggersClimax: true, maleOnly: true, consequence: "external_semen" },
    ejaculate_on_stomach: { id: "ejaculate_on_stomach", menuSection: "Upper Body", tool: "penis", target: "stomach", verb: "ejaculate on", type: ACT_TYPES.CONTINUE, label: "Ejaculate on stomach", desc: "Release on their stomach", arousal: { p: 35, n: 70 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over", "Cowgirl", "Mounted On X-Cross Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF, triggersClimax: true, maleOnly: true, consequence: "external_semen" },
    ejaculate_on_butt: { id: "ejaculate_on_butt", menuSection: "Midsection", tool: "penis", target: "buttocks", verb: "ejaculate on", type: ACT_TYPES.CONTINUE, label: "Ejaculate on butt", desc: "Release on their buttocks", arousal: { p: 35, n: 70 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Spooning", "Cowgirl", "Reverse Cowgirl", "Riding Face", "Against Wall From Behind", "Prone Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, triggersClimax: true, maleOnly: true, consequence: "external_semen" },
    ejaculate_on_pussy: { id: "ejaculate_on_pussy", menuSection: "Midsection", tool: "penis", target: "vagina", verb: "ejaculate on", type: ACT_TYPES.CONTINUE, label: "Ejaculate on pussy", desc: "Release on their pussy", arousal: { p: 35, n: 70 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Doggy", "Bent Over", "Cowgirl", "Reverse Cowgirl", "Riding Face", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, triggersClimax: true, maleOnly: true, consequence: "external_semen" },
    ejaculate_on_back: { id: "ejaculate_on_back", menuSection: "Upper Body", tool: "penis", target: "back", verb: "ejaculate on", type: ACT_TYPES.CONTINUE, label: "Ejaculate on back", desc: "Release on their back", arousal: { p: 35, n: 70 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Spooning", "Reverse Cowgirl", "Riding Face", "Against Wall From Behind", "Prone Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.ANY, triggersClimax: true, maleOnly: true, consequence: "external_semen" },
    ejaculate_on_legs: { id: "ejaculate_on_legs", menuSection: "Lower Body", tool: "penis", target: "legs", verb: "ejaculate on", type: ACT_TYPES.CONTINUE, label: "Ejaculate on legs", desc: "Release on their legs", arousal: { p: 30, n: 60 }, pos: ["Standing", "Standing From Behind", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.ANY, triggersClimax: true, maleOnly: true, consequence: "external_semen" },
    ejaculate_on_feet: { id: "ejaculate_on_feet", menuSection: "Lower Body", tool: "penis", target: "feet", verb: "ejaculate on", type: ACT_TYPES.CONTINUE, label: "Ejaculate on feet", desc: "Release on their feet", arousal: { p: 30, n: 60 }, pos: ["Standing", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.ANY, triggersClimax: true, maleOnly: true, consequence: "external_semen" },
    
    // Female ejaculation/squirting
    female_ejaculate: { id: "female_ejaculate", menuSection: "Midsection", tool: "vagina", target: "vagina", verb: "ejaculate", type: ACT_TYPES.CONTINUE, label: "Squirt", desc: "Experience intense release from stimulation", arousal: { p: 45, n: 90 }, pos: ["Standing", "Standing From Behind", "Against Wall", "Against Wall From Behind", "Perched", "Astride Lap", "Missionary", "Doggy", "Bent Over", "Spooning", "Kneeling", "Kneeling Over", "Cowgirl", "Reverse Cowgirl", "Sixty-Nine", "Oral Service", "Prone Oral Service", "Squatting Before", "Riding Face", "Kneeling By Face", "Mounted On X-Cross Oral Service", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, triggersClimax: true, femaleOnly: true, consequence: "female_ejaculate" },
    // Plain female-player orgasm: the "Succumb to the pressure" climax —
    // no squirt, no penetration requirement. Works in any stimulation
    // context (oral, manual, penetration) as the female counterpart to
    // the male ejaculation buttons.
    player_orgasm: { id: "player_orgasm", menuSection: "Midsection", tool: "vagina", target: "vagina", verb: "climax", type: ACT_TYPES.CONTINUE, label: "Succumb to the pressure", desc: "Let the pressure crest and come", arousal: { p: 45, n: 90 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Cowgirl", "Reverse Cowgirl", "Doggy", "Bent Over", "Spooning", "Kneeling", "Kneeling Over", "Sixty-Nine", "Oral Service", "Prone Oral Service", "Squatting Before", "Riding Face", "Against Wall", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, triggersClimax: true, femaleOnly: true },
    
    // Mutual climax (both partners)
    mutual_climax: { id: "mutual_climax", menuSection: "Midsection", tool: "body", target: "body", verb: "climax together", type: ACT_TYPES.CONTINUE, label: "Climax together", desc: "Both reach orgasm simultaneously", arousal: { p: 50, n: 100 }, pos: ["Standing", "Standing From Behind", "Missionary", "Doggy", "Bent Over", "Cowgirl", "Reverse Cowgirl", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, triggersClimax: true, consequence: "mutual_climax" },

    // ===== WATERSPORTS =====
    // Player urinates on accessible body parts. Requires BOTTOM_OFF for the
    // player (clothing must be out of the way). Targets must be accessible
    // from the position. NPC reactions are mostly negative (disgust, anger)
    // with rare positive exceptions for very bold/forward temperaments at
    // high arousal. Player gender determines the tool (penis or vagina).
    pee_on_face: { id: "pee_on_face", menuSection: "Head", tool: "penis", target: "face", verb: "pee on", type: ACT_TYPES.WATERSPORT, label: "Pee on face", desc: "Urinate on their face", arousal: { p: 0, n: -15 }, pos: ["Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, maleOnly: true, consequence: "urine" },
    pee_on_chest: { id: "pee_on_chest", menuSection: "Upper Body", tool: "penis", target: "chest", verb: "pee on", type: ACT_TYPES.WATERSPORT, label: "Pee on chest", desc: "Urinate on their chest", arousal: { p: 0, n: -10 }, pos: ["Standing", "Missionary", "Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, maleOnly: true, consequence: "urine" },
    pee_on_breasts: { id: "pee_on_breasts", menuSection: "Upper Body", tool: "penis", target: "breasts", verb: "pee on", type: ACT_TYPES.WATERSPORT, label: "Pee on breasts", desc: "Urinate on their breasts", arousal: { p: 0, n: -10 }, pos: ["Standing", "Missionary", "Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF, maleOnly: true, consequence: "urine" },
    pee_on_stomach: { id: "pee_on_stomach", menuSection: "Upper Body", tool: "penis", target: "stomach", verb: "pee on", type: ACT_TYPES.WATERSPORT, label: "Pee on stomach", desc: "Urinate on their stomach", arousal: { p: 0, n: -8 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over", "Prone Oral Service", "Mounted On X-Cross Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, maleOnly: true, consequence: "urine" },
    pee_on_butt: { id: "pee_on_butt", menuSection: "Midsection", tool: "penis", target: "buttocks", verb: "pee on", type: ACT_TYPES.WATERSPORT, label: "Pee on butt", desc: "Urinate on their buttocks", arousal: { p: 0, n: -8 }, pos: ["Standing From Behind", "Against Wall From Behind", "Doggy", "Bent Over", "Spooning", "Riding Face"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, maleOnly: true, consequence: "urine" },
    pee_on_back: { id: "pee_on_back", menuSection: "Upper Body", tool: "penis", target: "back", verb: "pee on", type: ACT_TYPES.WATERSPORT, label: "Pee on back", desc: "Urinate on their back", arousal: { p: 0, n: -5 }, pos: ["Standing From Behind", "Against Wall From Behind", "Doggy", "Bent Over", "Spooning", "Riding Face"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, maleOnly: true, consequence: "urine" },
    pee_on_thighs: { id: "pee_on_thighs", menuSection: "Lower Body", tool: "penis", target: "thighs", verb: "pee on", type: ACT_TYPES.WATERSPORT, label: "Pee on thighs", desc: "Urinate on their thighs", arousal: { p: 0, n: -5 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, maleOnly: true, consequence: "urine" },
    pee_on_pussy: { id: "pee_on_pussy", menuSection: "Midsection", tool: "penis", target: "vagina", verb: "pee on", type: ACT_TYPES.WATERSPORT, label: "Pee on pussy", desc: "Urinate on their pussy", arousal: { p: 0, n: -12 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Doggy", "Bent Over", "Kneeling Over", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, maleOnly: true, consequence: "urine" },
    pee_on_feet: { id: "pee_on_feet", menuSection: "Lower Body", tool: "penis", target: "feet", verb: "pee on", type: ACT_TYPES.WATERSPORT, label: "Pee on feet", desc: "Urinate on their feet", arousal: { p: 0, n: -5 }, pos: ["Standing", "Kneeling"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, maleOnly: true, consequence: "urine" },

    // Female player version (uses vagina as tool)
    pee_on_face_f: { id: "pee_on_face_f", menuSection: "Head", tool: "vagina", target: "face", verb: "pee on", type: ACT_TYPES.WATERSPORT, label: "Pee on face", desc: "Urinate on their face", arousal: { p: 0, n: -15 }, pos: ["Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Sixty-Nine", "Kneeling Over", "Prone Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, femaleOnly: true, consequence: "urine" },
    pee_on_chest_f: { id: "pee_on_chest_f", menuSection: "Upper Body", tool: "vagina", target: "chest", verb: "pee on", type: ACT_TYPES.WATERSPORT, label: "Pee on chest", desc: "Urinate on their chest", arousal: { p: 0, n: -10 }, pos: ["Standing", "Missionary", "Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, femaleOnly: true, consequence: "urine" },
    pee_on_breasts_f: { id: "pee_on_breasts_f", menuSection: "Upper Body", tool: "vagina", target: "breasts", verb: "pee on", type: ACT_TYPES.WATERSPORT, label: "Pee on breasts", desc: "Urinate on their breasts", arousal: { p: 0, n: -10 }, pos: ["Standing", "Missionary", "Kneeling", "Oral Service", "Kneeling By Face", "Squatting Before", "Mounted On X-Cross Oral Service", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF, femaleOnly: true, consequence: "urine" },
    pee_on_stomach_f: { id: "pee_on_stomach_f", menuSection: "Upper Body", tool: "vagina", target: "stomach", verb: "pee on", type: ACT_TYPES.WATERSPORT, label: "Pee on stomach", desc: "Urinate on their stomach", arousal: { p: 0, n: -8 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over", "Prone Oral Service", "Mounted On X-Cross Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, femaleOnly: true, consequence: "urine" },
    pee_on_butt_f: { id: "pee_on_butt_f", menuSection: "Midsection", tool: "vagina", target: "buttocks", verb: "pee on", type: ACT_TYPES.WATERSPORT, label: "Pee on butt", desc: "Urinate on their buttocks", arousal: { p: 0, n: -8 }, pos: ["Standing From Behind", "Against Wall From Behind", "Doggy", "Bent Over", "Spooning", "Riding Face"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, femaleOnly: true, consequence: "urine" },
    pee_on_back_f: { id: "pee_on_back_f", menuSection: "Upper Body", tool: "vagina", target: "back", verb: "pee on", type: ACT_TYPES.WATERSPORT, label: "Pee on back", desc: "Urinate on their back", arousal: { p: 0, n: -5 }, pos: ["Standing From Behind", "Against Wall From Behind", "Doggy", "Bent Over", "Spooning", "Riding Face"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, femaleOnly: true, consequence: "urine" },
    pee_on_thighs_f: { id: "pee_on_thighs_f", menuSection: "Lower Body", tool: "vagina", target: "thighs", verb: "pee on", type: ACT_TYPES.WATERSPORT, label: "Pee on thighs", desc: "Urinate on their thighs", arousal: { p: 0, n: -5 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, femaleOnly: true, consequence: "urine" },
    pee_on_pussy_f: { id: "pee_on_pussy_f", menuSection: "Midsection", tool: "vagina", target: "vagina", verb: "pee on", type: ACT_TYPES.WATERSPORT, label: "Pee on pussy", desc: "Urinate on their pussy", arousal: { p: 0, n: -12 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Doggy", "Bent Over", "Kneeling Over", "Kneeling Before"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, femaleOnly: true, consequence: "urine" },
    pee_on_feet_f: { id: "pee_on_feet_f", menuSection: "Lower Body", tool: "vagina", target: "feet", verb: "pee on", type: ACT_TYPES.WATERSPORT, label: "Pee on feet", desc: "Urinate on their feet", arousal: { p: 0, n: -5 }, pos: ["Standing", "Kneeling"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, femaleOnly: true, consequence: "urine" },

    // ── SPIT (saliva) ────────────────────────────────────────────────────
    // One-shot utility acts: slick a part with spit (vagina/anus gain lube
    // via handleLubeFromAction) or spit on the chest/cock. They never
    // occupy an engaged-act slot (oneShot); in the menu they live in the
    // body-part section of the zone they slick (menuSection), not in a
    // separate utility group.
    spit_on_vagina: { id: "spit_on_vagina", menuSection: "Midsection", tool: "mouth", target: "vagina", verb: "spit on", type: ACT_TYPES.TEASE, label: "Spit on pussy", desc: "Spit on their pussy to slick it up", arousal: { p: 4, n: 8 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning", "Kneeling Over", "Cowgirl", "Reverse Cowgirl", "Against Wall", "Sixty-Nine", "Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcFemale: true, oneShot: true, objectDialogueTags: ["spat on"] },
    spit_on_anus: { id: "spit_on_anus", menuSection: "Midsection", tool: "mouth", target: "anus", verb: "spit on", type: ACT_TYPES.TEASE, label: "Spit on anus", desc: "Spit on their anus to slick it up", arousal: { p: 3, n: 6 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning", "Kneeling Over", "Cowgirl", "Reverse Cowgirl", "Against Wall", "Against Wall From Behind", "Sixty-Nine", "Oral Service"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, oneShot: true, objectDialogueTags: ["spat on"] },
    spit_on_cock: { id: "spit_on_cock", menuSection: "Midsection", tool: "mouth", target: "penis", verb: "spit on", type: ACT_TYPES.TEASE, label: "Spit on cock", desc: "Spit on their cock to slick it up", arousal: { p: 4, n: 6 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling", "Kneeling Over", "Cowgirl", "Reverse Cowgirl", "Sixty-Nine", "Oral Service", "Squatting Before"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresNpcMale: true, oneShot: true, objectDialogueTags: ["spat on"] },
    spit_on_breasts: { id: "spit_on_breasts", menuSection: "Upper Body", tool: "mouth", target: "breasts", verb: "spit on", type: ACT_TYPES.TEASE, label: "Spit on breasts", desc: "Spit on their bare breasts", arousal: { p: 3, n: 5 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Against Wall", "Doggy", "Bent Over", "Spooning", "Kneeling", "Kneeling Over", "Cowgirl"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF, oneShot: true, objectDialogueTags: ["spat on"] },

    // ===== UNCONSCIOUS BODY ACTIONS =====
    // Actions performed on an unconscious NPC. These are one-sided actions
    // where the NPC cannot participate or resist. All actions succeed automatically.
    // Key properties: unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true

    // Kissing - unconscious
    kiss_mouth_unconscious: { id: "kiss_mouth_unconscious", menuSection: "Head", tool: "mouth", target: "lips", verb: "kiss", type: ACT_TYPES.TEASE, label: "Kiss mouth (unconscious)", desc: "Kiss their slack, unresponsive lips", arousal: { p: 2, n: 0 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling", "Kneeling Over", "Unconscious On Back", "Unconscious On Face", "Unconscious On Side", "Unconscious Doggy"], reqCloth: CLOTHING_REQUIREMENTS.ANY, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, objectDialogueTags: ["being kissed"] },
    kiss_cheek_unconscious: { id: "kiss_cheek_unconscious", menuSection: "Head", tool: "mouth", target: "cheek", verb: "kiss", type: ACT_TYPES.TEASE, label: "Kiss cheek (unconscious)", desc: "Kiss their cheek as they lie motionless", arousal: { p: 1, n: 0 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling", "Kneeling Before", "Unconscious On Back", "Unconscious On Face", "Unconscious On Side"], reqCloth: CLOTHING_REQUIREMENTS.ANY, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, sleepingSafe: true },

    // Breast interactions - unconscious
    grope_breasts_unconscious: { id: "grope_breasts_unconscious", menuSection: "Upper Body", tool: "hand", target: "breasts", verb: "grope", type: ACT_TYPES.TEASE, label: "Grope breasts (unconscious)", desc: "Handle their bare, limp breasts at will", arousal: { p: 8, n: 0 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning", "Cowgirl", "Reverse Cowgirl", "Unconscious On Back", "Unconscious On Face", "Unconscious On Side", "Unconscious Doggy"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, objectDialogueTags: ["breasts groped"] },
    lick_nipples_unconscious: { id: "lick_nipples_unconscious", menuSection: "Upper Body", tool: "tongue", target: "nipples", verb: "lick", type: ACT_TYPES.TEASE, label: "Lick nipples (unconscious)", desc: "Lap at their unmoving nipples with your tongue", arousal: { p: 6, n: 0 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning", "Cowgirl", "Reverse Cowgirl", "Unconscious On Back", "Unconscious On Face", "Unconscious On Side", "Unconscious Doggy"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true },

    // Genital licking - unconscious (species-aware)
    lick_vagina_unconscious: { id: "lick_vagina_unconscious", menuSection: "Midsection", tool: "tongue", target: "vagina", verb: "lick", type: ACT_TYPES.TEASE, label: "Lick vagina (unconscious)", desc: "Lap at their bare sex as the limp body offers no response", arousal: { p: 12, n: 0 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning", "Kneeling Over", "Unconscious On Back", "Unconscious On Face", "Unconscious On Side", "Unconscious Doggy"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, requiresNpcFemale: true, objectDialogueTags: ["cunnilingus"] },
    lick_cloaca_unconscious: { id: "lick_cloaca_unconscious", menuSection: "Midsection", tool: "tongue", target: "cloaca", verb: "lick", type: ACT_TYPES.TEASE, label: "Lick cloacal vent (unconscious)", desc: "Lick the smooth-scaled vent of the unconscious reptilian", arousal: { p: 10, n: 0 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning", "Kneeling Over", "Unconscious On Back", "Unconscious On Face", "Unconscious On Side", "Unconscious Doggy"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, requiresNpcCloaca: true, objectDialogueTags: ["anilingus"] },
    lick_anus_unconscious: { id: "lick_anus_unconscious", menuSection: "Midsection", tool: "tongue", target: "anus", verb: "lick", type: ACT_TYPES.TEASE, label: "Lick anus (unconscious)", desc: "Circle their unmoving pucker with your tongue", arousal: { p: 8, n: 0 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning", "Kneeling Over", "Unconscious On Back", "Unconscious On Face", "Unconscious On Side", "Unconscious Doggy"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, objectDialogueTags: ["anilingus"] },

    // Male genital interactions - unconscious
    stroke_cock_unconscious: { id: "stroke_cock_unconscious", menuSection: "Midsection", tool: "hand", target: "penis", verb: "stroke", type: ACT_TYPES.TEASE, label: "Stroke cock (unconscious)", desc: "Work their soft, slack cock in your hand - it stiffens only by reflex", arousal: { p: 10, n: 0 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning", "Kneeling Over", "Unconscious On Back", "Unconscious On Face", "Unconscious On Side", "Unconscious Doggy"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, requiresNpcMale: true, objectDialogueTags: ["cock stroked"] },
    ride_cock_unconscious: { id: "ride_cock_unconscious", menuSection: "Midsection", tool: "vagina", target: "penis", verb: "ride", type: ACT_TYPES.CONTINUE, label: "Ride cock (unconscious)", desc: "Lower yourself onto their reflexively stiff cock as they lie motionless", arousal: { p: 25, n: 0 }, pos: ["Cowgirl", "Reverse Cowgirl", "Astride Lap", "Unconscious Doggy"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, requiresNpcMale: true, requiresPlayerFemale: true, playerIsBottom: false, takesVirginity: [VIRGINITY_TYPES.VAGINAL] },

    // Finger penetration - unconscious (species-aware)
    finger_vagina_unconscious: { id: "finger_vagina_unconscious", menuSection: "Midsection", tool: "fingers", target: "vagina", verb: "finger", type: ACT_TYPES.TEASE, label: "Finger vagina (unconscious)", desc: "Penetrate their unresisting sex with your fingers", arousal: { p: 15, n: 0 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning", "Kneeling Over", "Unconscious On Back", "Unconscious On Face", "Unconscious On Side", "Unconscious Doggy"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, requiresNpcFemale: true, objectDialogueTags: ["fingered"] },
    finger_cloaca_unconscious: { id: "finger_cloaca_unconscious", menuSection: "Midsection", tool: "fingers", target: "cloaca", verb: "finger", type: ACT_TYPES.TEASE, label: "Finger cloaca (unconscious)", desc: "Work your fingers into their tight, unyielding vent", arousal: { p: 12, n: 0 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning", "Kneeling Over", "Unconscious On Back", "Unconscious On Face", "Unconscious On Side", "Unconscious Doggy"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, requiresNpcCloaca: true, objectDialogueTags: ["fingered"] },
    finger_anus_unconscious: { id: "finger_anus_unconscious", menuSection: "Midsection", tool: "fingers", target: "anus", verb: "finger", type: ACT_TYPES.TEASE, label: "Finger anus (unconscious)", desc: "Force your fingers past their tight, unresisting sphincter", arousal: { p: 15, n: 0 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning", "Kneeling Over", "Unconscious On Back", "Unconscious On Face", "Unconscious On Side", "Unconscious Doggy"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, objectDialogueTags: ["fingered"] },

    // Oral penetration - unconscious
    fuck_mouth_unconscious: { id: "fuck_mouth_unconscious", menuSection: "Head", tool: "penis", target: "mouth", verb: "fuck", type: ACT_TYPES.CONTINUE, label: "Fuck mouth (unconscious)", desc: "Thrust into their slack, unresisting mouth", arousal: { p: 25, n: 0 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over", "Unconscious On Back", "Unconscious On Face"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, maleOnly: true, objectDialogueTags: ["oral sex"] },
    thrust_mouth_unconscious: { id: "thrust_mouth_unconscious", menuSection: "Head", tool: "penis", target: "mouth", verb: "thrust", type: ACT_TYPES.CONTINUE, label: "Thrust in mouth (unconscious)", desc: "Pump your hips into their limp, drooling mouth", arousal: { p: 20, n: 0 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over", "Unconscious On Back", "Unconscious On Face"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, maleOnly: true, objectDialogueTags: ["oral sex"] },

    // Vaginal penetration - unconscious
    enter_vagina_unconscious: { id: "enter_vagina_unconscious", menuSection: "Midsection", tool: "penis", target: "vagina", verb: "enter", type: ACT_TYPES.PENETRATE, label: "Enter vagina (unconscious)", desc: "Penetrate their unresisting sex as they lie limp beneath you", arousal: { p: 30, n: 0 }, pos: ["Missionary", "Astride Lap", "Doggy", "Bent Over", "Standing From Behind", "Against Wall From Behind", "Spooning", "Cowgirl", "Reverse Cowgirl", "Unconscious On Back", "Unconscious On Face", "Unconscious Doggy"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, maleOnly: true, takesVirginity: [VIRGINITY_TYPES.VAGINAL], requiresLube: false },
    thrust_vagina_unconscious: { id: "thrust_vagina_unconscious", menuSection: "Midsection", tool: "penis", target: "vagina", verb: "thrust", type: ACT_TYPES.CONTINUE, label: "Thrust in vagina (unconscious)", desc: "Thrust into their motionless body, meeting no resistance or participation", arousal: { p: 25, n: 0 }, pos: ["Missionary", "Astride Lap", "Doggy", "Bent Over", "Standing From Behind", "Against Wall From Behind", "Spooning", "Cowgirl", "Reverse Cowgirl", "Unconscious On Back", "Unconscious On Face", "Unconscious Doggy"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, maleOnly: true, objectDialogueTags: ["penetrated"] },
    fuck_vagina_unconscious: { id: "fuck_vagina_unconscious", menuSection: "Midsection", tool: "penis", target: "vagina", verb: "fuck", type: ACT_TYPES.CONTINUE, label: "Fuck vagina (unconscious)", desc: "Take their unresisting body with hard, one-sided thrusts", arousal: { p: 35, n: 0 }, pos: ["Missionary", "Doggy", "Bent Over", "Standing From Behind", "Against Wall From Behind", "Unconscious On Face", "Unconscious Doggy"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, maleOnly: true, intensity: "hard", objectDialogueTags: ["penetrated"] },

    // Cloacal penetration - unconscious
    enter_cloaca_unconscious: { id: "enter_cloaca_unconscious", menuSection: "Midsection", tool: "penis", target: "cloaca", verb: "enter", type: ACT_TYPES.PENETRATE, label: "Enter cloaca (unconscious)", desc: "Force entry into their tight, unyielding reptilian vent", arousal: { p: 28, n: 0 }, pos: ["Missionary", "Astride Lap", "Doggy", "Bent Over", "Standing From Behind", "Against Wall From Behind", "Spooning", "Unconscious On Back", "Unconscious On Face", "Unconscious On Side", "Unconscious Doggy"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, maleOnly: true, requiresNpcCloaca: true, requiresLube: true },
    thrust_cloaca_unconscious: { id: "thrust_cloaca_unconscious", menuSection: "Midsection", tool: "penis", target: "cloaca", verb: "thrust", type: ACT_TYPES.CONTINUE, label: "Thrust in cloaca (unconscious)", desc: "Work your cock in their passive, uncooperative vent", arousal: { p: 25, n: 0 }, pos: ["Missionary", "Astride Lap", "Doggy", "Bent Over", "Standing From Behind", "Against Wall From Behind", "Spooning", "Unconscious On Back", "Unconscious On Face", "Unconscious Doggy"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, maleOnly: true, requiresNpcCloaca: true, objectDialogueTags: ["penetrated"] },

    // Anal penetration - unconscious
    enter_anus_unconscious: { id: "enter_anus_unconscious", menuSection: "Midsection", tool: "penis", target: "anus", verb: "enter", type: ACT_TYPES.PENETRATE, label: "Enter anus (unconscious)", desc: "Force your cock past their tight, unresisting sphincter", arousal: { p: 30, n: 0 }, pos: ["Doggy", "Bent Over", "Standing From Behind", "Against Wall From Behind", "Spooning", "Missionary", "Astride Lap", "Cowgirl", "Reverse Cowgirl", "Unconscious On Face", "Unconscious Doggy"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, maleOnly: true, takesVirginity: [VIRGINITY_TYPES.ANAL], requiresLube: true },
    thrust_anus_unconscious: { id: "thrust_anus_unconscious", menuSection: "Midsection", tool: "penis", target: "anus", verb: "thrust", type: ACT_TYPES.CONTINUE, label: "Thrust in anus (unconscious)", desc: "Pump into their tight, unyielding back passage", arousal: { p: 25, n: 0 }, pos: ["Doggy", "Bent Over", "Standing From Behind", "Against Wall From Behind", "Spooning", "Missionary", "Astride Lap", "Cowgirl", "Reverse Cowgirl", "Unconscious On Face", "Unconscious Doggy"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, maleOnly: true, objectDialogueTags: ["penetrated"] },
    pound_anus_unconscious: { id: "pound_anus_unconscious", menuSection: "Midsection", tool: "penis", target: "anus", verb: "pound", type: ACT_TYPES.CONTINUE, label: "Pound anus (unconscious)", desc: "Pound into their unresisting backside with hard, relentless thrusts", arousal: { p: 35, n: 0 }, pos: ["Doggy", "Bent Over", "Standing From Behind", "Against Wall From Behind", "Unconscious On Face", "Unconscious Doggy"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, maleOnly: true, intensity: "hard", objectDialogueTags: ["penetrated"] },

    // Climax actions - unconscious
    climax_inside_unconscious: { id: "climax_inside_unconscious", menuSection: "Midsection", tool: "penis", target: "body", verb: "climax", type: ACT_TYPES.END, label: "Climax inside (unconscious)", desc: "Finish deep inside their unresisting body", arousal: { p: 0, n: 0 }, pos: ["Missionary", "Doggy", "Bent Over", "Standing From Behind", "Against Wall From Behind", "Spooning", "Astride Lap", "Cowgirl", "Reverse Cowgirl", "Unconscious On Back", "Unconscious On Face", "Unconscious On Side", "Unconscious Doggy"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, maleOnly: true, orgasm: true, consequence: "ejaculation" },
    climax_on_body_unconscious: { id: "climax_on_body_unconscious", menuSection: "Midsection", tool: "penis", target: "body", verb: "climax", type: ACT_TYPES.END, label: "Climax on body (unconscious)", desc: "Finish on their motionless body", arousal: { p: 0, n: 0 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning", "Kneeling Over", "Unconscious On Back", "Unconscious On Face", "Unconscious On Side"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, maleOnly: true, orgasm: true, consequence: "ejaculation" },

    // Repositioning - unconscious (utility action, no arousal)
    reposition_unconscious: { id: "reposition_unconscious", menuSection: "Upper Body", tool: "hand", target: "body", verb: "reposition", type: ACT_TYPES.TEASE, label: "Reposition body", desc: "Roll or shift their limp, dead-weight body into a different position", arousal: { p: 0, n: 0 }, pos: ["Standing", "Perched", "Missionary", "Doggy", "Bent Over", "Spooning", "Unconscious On Back", "Unconscious On Face", "Unconscious On Side", "Unconscious Doggy"], reqCloth: CLOTHING_REQUIREMENTS.ANY, unconsciousOnly: true, sleepingSafe: true, nonConsensual: false, oneShot: true },

    // Degradation - unconscious
    spit_on_body_unconscious: { id: "spit_on_body_unconscious", menuSection: "Upper Body", tool: "mouth", target: "body", verb: "spit on", type: ACT_TYPES.IMPACT, label: "Spit on body (unconscious)", desc: "Spit on their unresponsive flesh", arousal: { p: 0, n: -5 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning", "Unconscious On Back", "Unconscious On Face", "Unconscious On Side", "Unconscious Doggy"], reqCloth: CLOTHING_REQUIREMENTS.ANY, unconsciousOnly: true, sleepingSafe: true, nonConsensual: true, sleepingSafe: true, oneShot: true, }
};

// ============================================================================
// AROUSAL CONFIGURATION
// ============================================================================

var AROUSAL_CONFIG = {
    MINOR_AROUSAL: 100,
    MODERATE_AROUSAL: 300,
    HIGH_AROUSAL: 500,
    ORGASM_THRESHOLD: 800,
    DECAY_RATE: 10,
    PERSONALITY_MULTIPLIERS: {
        shy: 0.8,
        bold: 1.2,
        submissive: 1.1,
        dominant: 0.9,
        romantic: 1.3,
        lustful: 1.4
    }
};

// ============================================================================
// INTIMACY STAGES
// ============================================================================

var INTIMACY_STAGES = {
    CLOTHED: 1,
    PARTIAL: 2,
    NUDE: 3
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Dynamic acts (inventory-driven, e.g. sex toys / lube bought from a
 * merchant) live in a side registry so the static SEX_ACTS table stays
 * untouched. getAct/hasAct consult it, so dynamic acts flow through the
 * whole pipeline (menu, validation, arousal, narration) like built-ins.
 */
var DYNAMIC_SEX_ACTS = {};

function registerDynamicAct(act) {
    if (act && act.id) DYNAMIC_SEX_ACTS[act.id] = act;
    return act;
}

function unregisterDynamicAct(actId) {
    if (actId) delete DYNAMIC_SEX_ACTS[actId];
}

function clearDynamicSexActs(prefix) {
    // Always delete in place so window.DYNAMIC_SEX_ACTS stays the same object.
    Object.keys(DYNAMIC_SEX_ACTS).forEach(function (id) {
        if (!prefix || id.indexOf(prefix) === 0) delete DYNAMIC_SEX_ACTS[id];
    });
}

/**
 * Get act by ID
 */
function getAct(actId) {
    return SEX_ACTS[actId] || DYNAMIC_SEX_ACTS[actId];
}

/**
 * Check if act exists
 */
function hasAct(actId) {
    return SEX_ACTS.hasOwnProperty(actId) || DYNAMIC_SEX_ACTS.hasOwnProperty(actId);
}

/**
 * Get all act IDs
 */
function getAllActIds() {
    return Object.keys(SEX_ACTS);
}

/**
 * Get acts by type
 */
function getActsByType(type) {
    const acts = [];
    for (const [id, act] of Object.entries(SEX_ACTS)) {
        if (act.type === type) {
            acts.push(id);
        }
    }
    return acts;
}

/**
 * Get acts by clothing requirement
 */
function getActsByClothingRequirement(req) {
    const acts = [];
    for (const [id, act] of Object.entries(SEX_ACTS)) {
        if (act.reqCloth === req) {
            acts.push(id);
        }
    }
    return acts;
}

/**
 * Determine current intimacy stage based on clothing
 */
function getIntimacyStage(clothingState) {
    const playerNude = !clothingState.player.top && !clothingState.player.bottom && !clothingState.player.undergarments;
    const npcNude = !clothingState.npc.top && !clothingState.npc.bottom && !clothingState.npc.undergarments;
    
    if (playerNude && npcNude) {
        return INTIMACY_STAGES.NUDE;
    } else if (!clothingState.player.top || !clothingState.player.bottom || 
               !clothingState.npc.top || !clothingState.npc.bottom) {
        return INTIMACY_STAGES.PARTIAL;
    } else {
        return INTIMACY_STAGES.CLOTHED;
    }
}

/**
 * Check if fully nude
 */
function isFullyNude(clothingState, target = null) {
    if (target === "player") {
        return !clothingState.player.top && !clothingState.player.bottom && !clothingState.player.undergarments;
    } else if (target === "npc") {
        return !clothingState.npc.top && !clothingState.npc.bottom && !clothingState.npc.undergarments;
    }
    return !clothingState.player.top && !clothingState.player.bottom && 
           !clothingState.npc.top && !clothingState.npc.bottom;
}

/**
 * Check if action is valid for current state
 */
function isActionValid(actId, npc, player, positionId, clothingState) {
    const act = getAct(actId);
    if (!act) return false;
    
    // Check position
    if (act.pos && act.pos.length > 0) {
        if (!act.pos.includes(positionId)) {
            return false;
        }
    }
    
    // Check clothing
    if (act.reqCloth) {
        // For clothing actions, use the explicit target from the action
        const targetOverride = act.type === ACT_TYPES.CLOTHING ? act.target : null;
        if (!checkClothingRequirement(act.reqCloth, clothingState, act.playerIsBottom, targetOverride)) {
            return false;
        }
    }
    
    // Check if character has clothing for clothing removal actions
    // Use intimacy clothing state if available, otherwise check equipped items
    if (act.type === ACT_TYPES.CLOTHING) {
        // For undress actions, check if target has clothing that can be removed
        if (act.id === "undress_player" || act.id === "undress_npc" || act.clothingItem || act.clothingAction) {
            const targetIsPlayer = act.target === "player";
            const targetKey = targetIsPlayer ? "player" : "npc";
            
            // If we have intimacy clothing state, use it
            if (clothingState && clothingState[targetKey]) {
                const targetClothing = clothingState[targetKey];
                
                // For complete undress, check if target has any clothing
                if (act.id === "undress_player" || act.id === "undress_npc") {
                    if (!targetClothing.top && !targetClothing.bottom && !targetClothing.undergarments) {
                        console.log(`[DEBUG] isActionValid: ${act.id} rejected - target already fully undressed`);
                        return false; // Already fully undressed
                    }
                }
                // For specific clothing items, check if that item is worn
                else if (act.clothingItem) {
                    if (!targetClothing[act.clothingItem]) {
                        console.log(`[DEBUG] isActionValid: ${act.id} rejected - ${act.clothingItem} not worn (${JSON.stringify(targetClothing)})`);
                        return false; // That specific clothing item is not worn
                    }
                    console.log(`[DEBUG] isActionValid: ${act.id} PASSED - ${act.clothingItem} is worn`);
                }
            }
            // Fallback: check if character has any clothing equipped
            else {
                const target = targetIsPlayer ? player : npc;
                if (!hasClothingEquipped(target)) {
                    console.log(`[DEBUG] isActionValid: ${act.id} rejected - no clothing equipped`);
                    return false;
                }
                console.log(`[DEBUG] isActionValid: ${act.id} PASSED - clothing equipped`);
            }
        }
    }
    
    // Check if "over clothes" actions should be hidden when the clothing
    // covering the target body part has been removed.
    if (act.id && act.id.includes("_clothed")) {
        // Determine target from action
        const isPlayerTarget = act.target === "player" || act.playerIsBottom === false;
        const targetKey = isPlayerTarget ? "player" : "npc";
        const targetClothing = clothingState && clothingState[targetKey];

        if (targetClothing) {
            // Fully nude — hide all _clothed actions
            if (!targetClothing.top && !targetClothing.bottom && !targetClothing.undergarments) {
                return false;
            }
            // Target-specific: if the clothing covering the target body part
            // is off, the _clothed action is redundant
            var targetLower = String(act.target || "").toLowerCase();
            if ((targetLower === "breasts" || targetLower === "chest") && !targetClothing.top) {
                return false;
            }
            if ((targetLower === "butt" || targetLower === "buttocks" || targetLower === "ass") && !targetClothing.bottom) {
                return false;
            }
            if ((targetLower === "groin" || targetLower === "vagina" || targetLower === "pussy" || targetLower === "penis" || targetLower === "cock") && !targetClothing.bottom) {
                return false;
            }
        }
    }
    
    // Tail-targeted acts (caress/pull tail) require a tailed species
    if (act.requiresNpcTail && !_actNpcHasTail(npc)) return false;

    // Check gender requirements
    // Non-binary players have both genitals (ensurePlayerIntimacyAnatomy in
    // the engine), so they pass either player-side gate; NPC-side gates stay
    // binary (NPCs are only male/female/none).
    if (act.maleOnly || act.femaleOnly || act.requiresNpcMale || act.requiresNpcFemale || act.requiresActorMale || act.requiresActorFemale || act.requiresPlayerMale || act.requiresPlayerFemale) {
        const playerGender = String((player && (player.gender || (player.stats && player.stats.gender))) || "male").toLowerCase();
        const playerGateMale = playerGender === "male" || playerGender === "non-binary" || playerGender === "nonbinary";
        const playerGateFemale = playerGender === "female" || playerGender === "non-binary" || playerGender === "nonbinary";
        const npcGender = (npc.gender || "female").toLowerCase();
        
        const actorIsPlayer = !act.playerIsBottom;
        
        // Legacy support for maleOnly/femaleOnly (checks actor)
        if (act.maleOnly) {
            if (actorIsPlayer && !playerGateMale) return false;
            if (!actorIsPlayer && npcGender !== "male") return false;
        }
        if (act.femaleOnly) {
            if (actorIsPlayer && !playerGateFemale) return false;
            if (!actorIsPlayer && npcGender !== "female") return false;
        }
        
        // New explicit properties
        if (act.requiresActorMale) {
            if (actorIsPlayer && !playerGateMale) return false;
            if (!actorIsPlayer && npcGender !== "male") return false;
        }
        if (act.requiresActorFemale) {
            if (actorIsPlayer && !playerGateFemale) return false;
            if (!actorIsPlayer && npcGender !== "female") return false;
        }
        if (act.requiresNpcMale && npcGender !== "male") return false;
        if (act.requiresNpcFemale && npcGender !== "female") return false;
        if (act.requiresPlayerMale && !playerGateMale) return false;
        if (act.requiresPlayerFemale && !playerGateFemale) return false;
    }
    
    // Check if prior actions are required
    if (act.requiresPrior && act.requiresPrior.length > 0) {
        const intimacy = npc && npc.intimacy;
        const actionHistory = intimacy && intimacy.actionHistory ? intimacy.actionHistory : [];
        
        // Check if any of the required prior actions have been performed
        const hasPriorAction = act.requiresPrior.some(priorActId => {
            return actionHistory.some(historyEntry => historyEntry.actId === priorActId);
        });
        
        if (!hasPriorAction) {
            return false;
        }
    }
    
    // Check if lube is required
    if (act.requiresLube) {
        const intimacy = npc && npc.intimacy;
        const hasLube = intimacy && intimacy.hasLube;
        if (!hasLube) {
            return false;
        }
    }
    
    // Check if consent is required
    if (act.requiresConsent) {
        // For now, just check if NPC has high enough attraction/lust
        // In a real implementation, this would check a consent flag
        const npcAttraction = (npc.relationship && npc.relationship.attraction) || 0;
        const npcLust = (npc.relationship && npc.relationship.lust) || 0;
        if (npcAttraction < 50 || npcLust < 30) {
            return false;
        }
    }
    
    // More checks can be added here (skills, etc.)
    
    return true;
}

/**
 * Check if character has clothing equipped in relevant equipment slots
 * Clothing slots: head, upper, lower, hands, feet
 */
function hasClothingEquipped(character) {
    if (!character || !character.equipped) return false;
    
    const clothingSlots = ["head", "upper", "lower", "hands", "feet"];
    
    for (const slot of clothingSlots) {
        if (character.equipped[slot]) {
            return true;
        }
    }
    
    return false;
}

/**
 * Check clothing requirement
 * For clothing actions with explicit target, check that target's clothing
 * When playerIsBottom is true, the player is the target (receiving), so check player's clothing
 * When playerIsBottom is false/undefined, the NPC is the target, so check NPC's clothing
 */
function checkClothingRequirement(requirement, clothingState, isPlayerBottom, targetOverride = null) {
    // If targetOverride is provided (e.g., from action.target for clothing actions), use it
    const target = targetOverride || (isPlayerBottom ? "player" : "npc");
    const targetClothing = clothingState && clothingState[target];
    
    if (!targetClothing) return true; // If no clothing state, allow the action
    
    switch (requirement) {
        case CLOTHING_REQUIREMENTS.ANY:
            return true;
        case CLOTHING_REQUIREMENTS.TOP_OFF:
            return !targetClothing.top;
        case CLOTHING_REQUIREMENTS.BOTTOM_OFF:
            return !targetClothing.bottom;
        case CLOTHING_REQUIREMENTS.NUDE:
            return !targetClothing.top && !targetClothing.bottom && !targetClothing.undergarments;
        case CLOTHING_REQUIREMENTS.TOP_ON:
            return targetClothing.top;
        case CLOTHING_REQUIREMENTS.BOTTOM_ON:
            return targetClothing.bottom;
        default:
            return true;
    }
}

/**
 * Get action category for menu organization
 */
function getActionCategory(actId, npc) {
    const act = getAct(actId);
    if (!act) return "Other";
    
    // Separate passive actions (player is receiving) into "Receive" category
    if (act.playerIsBottom === true) {
        return "Receive";
    }
    
    if (act.type === ACT_TYPES.CLOTHING) {
        return "Clothing";
    }
    
    if (act.type === ACT_TYPES.END) {
        return "End";
    }
    
    if (act.type === ACT_TYPES.IMPACT) {
        return "Impact";
    }

    if (act.type === ACT_TYPES.WATERSPORT) {
        return "Watersports";
    }

    // Categorize by body area first, then action type
    const actIdLower = (act.id || "").toLowerCase();
    const labelLower = (act.label || "").toLowerCase();
    const target = (act.target || "").toLowerCase();
    const tool = (act.tool || "").toLowerCase();
    
    // TOOL-BASED CATEGORIES: If tool is mouth/tongue on genitals, return genital category
    // For non-genital targets, let the target-based checks below handle categorization
    if (tool === "mouth" || tool === "tongue") {
        // Oral on genital parts -> return specific genital category
        const penisTargets = ["penis", "cock", "dick"];
        const vaginaTargets = ["vagina", "pussy", "clitoris", "clit"];
        const anusTargets = ["anus", "buttocks", "butt", "ass", "cloaca"];
        const testicleTargets = ["testicles", "balls"];
        
        if (penisTargets.includes(target) || testicleTargets.includes(target)) {
            return "Cock";
        }
        if (vaginaTargets.includes(target)) {
            return "Pussy";
        }
        if (anusTargets.includes(target)) {
            return _npcHasCloaca(npc) ? "Cloaca" : "Anus";
        }
        // For non-genital targets (mouth, lips, face, neck, cheek, hair, feet, etc.),
        // fall through to the target-based checks below
    }
    
    // First check target - this takes priority over action type
    // Feet/legs/thighs actions
    if (target === "feet" || target === "foot" || target === "legs" || target === "leg" ||
        target === "thighs" || target === "thigh" || target === "toes" || target === "toe") {
        return "Legs";
    }
    
    // Mouth/Lips/Face/Neck actions
    if (target === "mouth" || target === "lips" || target === "face" || target === "neck" || target === "cheek") {
        return "Mouth & Lips";
    }
    
    // Hair
    if (target === "hair") {
        return "Hair";
    }
    
    // Breasts/Nipples
    if (target === "nipples" || target === "breasts" || target === "chest") {
        return "Breasts";
    }
    
    // Vagina/Pussy/Clitoris
    if (target === "vagina" || target === "pussy" || target === "clitoris" || target === "clit") {
        return "Pussy";
    }
    
    // Penis/Cock
    if (target === "penis" || target === "cock" || target === "dick") {
        return "Cock";
    }
    
    // Testicles/Balls
    if (target === "testicles" || target === "balls") {
        return "Cock";
    }
    
    // Anus/Buttocks
    if (target === "anus" || target === "buttocks" || target === "butt" || target === "ass" || target === "sphincter" || target === "cloaca") {
        // Cloaca-bearing NPCs (reptilian-kin) have a cloacal vent instead of
        // a separate anus, so the section is labelled "Cloaca" for them.
        return _npcHasCloaca(npc) ? "Cloaca" : "Anus";
    }
    
    // Tail (tailed species only — the acts are hidden without one)
    if (target === "tail") {
        return "Tail";
    }
    
    // Body (general) - includes shoulders, back, stomach, arms, hands, groin, hips
    if (target === "shoulders" || target === "back" || target === "stomach" || 
        target === "arms" || target === "hands" || target === "groin" || target === "hips") {
        return "Body";
    }
    
    // Now check action ID and label for actions that don't have a specific target
    // Mouth/Lips/Face/Neck actions (by action ID/label, for actions without explicit target)
    if (actIdLower.includes("kiss") || labelLower.includes("kiss") ||
        actIdLower.includes("mouth") || actIdLower.includes("oral") ||
        labelLower.includes("mouth") || labelLower.includes("oral") ||
        actIdLower.includes("lips") || labelLower.includes("lips")) {
        return "Mouth & Lips";
    }
    
    // Hair (by action ID/label)
    if (actIdLower.includes("hair") || labelLower.includes("hair")) {
        return "Hair";
    }
    
    // Breasts/Nipples (by action ID/label)
    if (actIdLower.includes("breast") || actIdLower.includes("nipple") || 
        labelLower.includes("breast") || labelLower.includes("nipple") ||
        labelLower.includes("tit")) {
        return "Breasts";
    }
    
    // Vagina/Pussy/Clitoris (by action ID/label)
    if (actIdLower.includes("pussy") || actIdLower.includes("vagina") || actIdLower.includes("clitoris") ||
        labelLower.includes("pussy") || labelLower.includes("vagina") || labelLower.includes("clitoris") ||
        actIdLower.includes("clit") || labelLower.includes("clit") ||
        actIdLower.includes("fold") || labelLower.includes("fold")) {
        return "Pussy";
    }
    
    // Penis/Cock (by action ID/label)
    if (actIdLower.includes("cock") || actIdLower.includes("penis") ||
        labelLower.includes("cock") || labelLower.includes("penis") ||
        actIdLower.includes("dick") || labelLower.includes("dick")) {
        return "Cock";
    }
    
    // Anus/Buttocks (by action ID/label)
    if (actIdLower.includes("anal") || actIdLower.includes("anus") || actIdLower.includes("butt") || actIdLower.includes("ass") ||
        labelLower.includes("anal") || labelLower.includes("anus") || labelLower.includes("butt") || labelLower.includes("ass")) {
        return _npcHasCloaca(npc) ? "Cloaca" : "Anus";
    }
    
    // Tail (by action ID/label)
    if (actIdLower.includes("tail") || labelLower.includes("tail")) {
        return "Tail";
    }
    
    // Body parts by action ID/label
    if (actIdLower.includes("groin") || actIdLower.includes("thigh") ||
        labelLower.includes("groin") || labelLower.includes("thigh") ||
        actIdLower.includes("shoulders") || actIdLower.includes("back") ||
        actIdLower.includes("stomach") || actIdLower.includes("belly") ||
        labelLower.includes("shoulders") || labelLower.includes("back") ||
        labelLower.includes("stomach") || labelLower.includes("belly")) {
        return "Body";
    }
    
    // Tail (tailed species only — the acts are hidden without one)
    if (target === "tail" ||
        actIdLower.includes("tail") || labelLower.includes("tail")) {
        return "Tail";
    }
    
    // Now handle action types for actions that don't have a specific body target
    if (act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE) {
        if (act.triggersClimax) return "Climax";
        // For penetration, try to infer from action ID
        if (actIdLower.includes("pussy") || actIdLower.includes("vagina") || actIdLower.includes("clit")) return "Pussy";
        if (actIdLower.includes("anus") || actIdLower.includes("anal") || actIdLower.includes("butt") || actIdLower.includes("ass")) return "Anus";
        if (actIdLower.includes("cock") || actIdLower.includes("penis") || actIdLower.includes("dick")) return "Cock";
        if (actIdLower.includes("mouth") || actIdLower.includes("kiss") || actIdLower.includes("oral")) return "Mouth & Lips";
        return "Penetration";
    }
    
    // Impact actions (spanking, etc.)
    if (act.type === ACT_TYPES.IMPACT) {
        return "Impact";
    }
    
    return "Other";
}

// Export for Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ACT_TYPES,
        CLOTHING_REQUIREMENTS,
        VIRGINITY_TYPES,
        INTIMACY_CLOTHING_ITEMS,
        DEFAULT_CLOTHING_STATE,
        SEX_ACTS,
        AROUSAL_CONFIG,
        INTIMACY_STAGES,
        PRONOUNS,
        getAct,
        hasAct,
        getAllActIds,
        getActsByType,
        getActsByClothingRequirement,
        getIntimacyStage,
        isFullyNude,
        isActionValid,
        hasClothingEquipped,
        checkClothingRequirement,
        getActionCategory,
        getPronouns,
        getGenderedLabel,
        getGenderedText,
        getGenderedDesc
    };
}

// Assign to window for browser use
if (typeof window !== 'undefined') {
    window.ACT_TYPES = ACT_TYPES;
    window.CLOTHING_REQUIREMENTS = CLOTHING_REQUIREMENTS;
    window.VIRGINITY_TYPES = VIRGINITY_TYPES;
    window.INTIMACY_CLOTHING_ITEMS = INTIMACY_CLOTHING_ITEMS;
    window.DEFAULT_CLOTHING_STATE = DEFAULT_CLOTHING_STATE;
    window.SEX_ACTS = SEX_ACTS;
    window.AROUSAL_CONFIG = AROUSAL_CONFIG;
    window.INTIMACY_STAGES = INTIMACY_STAGES;
    window.PRONOUNS = PRONOUNS;
    window.getAct = getAct;
    window.hasAct = hasAct;
    window.registerDynamicAct = registerDynamicAct;
    window.unregisterDynamicAct = unregisterDynamicAct;
    window.clearDynamicSexActs = clearDynamicSexActs;
    window.DYNAMIC_SEX_ACTS = DYNAMIC_SEX_ACTS;
    window.getAllActIds = getAllActIds;
    window.getIntimacyStage = getIntimacyStage;
    window.isActionValid = isActionValid;
    window.hasClothingEquipped = hasClothingEquipped;
    window.getActionCategory = getActionCategory;
    window.getPronouns = getPronouns;
    window.getGenderedLabel = getGenderedLabel;
    window.getGenderedText = getGenderedText;
    window.getGenderedDesc = getGenderedDesc;
}
