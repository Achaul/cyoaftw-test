/**
 * INTIMACY SYSTEM - MAIN IMPLEMENTATION
 * Core functionality for the NSFW intimacy action menu
 *
 * Version: 2026-11-02-003
 * Gate-suppressed NPC-response beats skip the live AI call (template returned immediately; roll computed once, hoisted before generation)
 * Phase C: NPC response is now LIVE AI-first (8s race) for sexual acts; caches are fallback-only, template is last resort. _source reports live-ai/cached-ai/template
 * Continuation beats (same act repeated/continued) are always AI-written via generateContinuationNarrative + buildContinuationPrompt (quality prose, supplied-anatomy only)
 * Prompts: SUPPLIED ANATOMY whitelist (buildAnatomyWhitelist) + KNOWN FACTS block (buildFactsBlock) — AI must never invent anatomy not supplied; buildActionContext now carries descriptors through
 * Phase B: menu sections are now canonical — every act carries menuSection (intimacy-data-acts.js v2026-10-28-001)
 * getMenuSection reduced to the canonical field + small fallbacks (240-line heuristic cascade removed)
 * RESTORED: full action validation pipeline (generateValidActions gates + executeIntimacyAction validation)
 * Fixed: sleeping-action check ran for AWAKE NPCs and rejected every non-sleepingSafe act (the "nothing is valid" deadlock)
 * Fixed: mouth/lips kissing deadlocked on its own disinhibition category - now petting-tier (0)
 * Fixed: hasNPCTail now honors the hydrated npc.hasTail flag (consistent with intimacy-data-acts)
 * Dominant mode: bypass now covers disinhibition, arousal consent, requiresConsent and lube; bypassed acts carry act._dominantBypass (reset per evaluation) and render with a red border
 * Menu: body sections with no entries are hidden instead of always shown
 * Adds: impact play tolerance system (size + temperament based), skin color progression (pink→red→welted), pain/protest past tolerance, NPC can slap back, clear spanking narration
 * Fixed: getActionCategory now returns proper categories for oral on genitals (Cock/Pussy/Anus instead of all Anus)
 * This system provides:
 * - LOT (Tool-Verb-Target) based action generation
 * - Staged intimacy (Clothed -> Partial -> Nude)
 * - Position-aware accessibility
 * - Clothing state tracking
 * - One-at-a-time AI response generation
 * - Gender filtering and pronoun system
 */
window.__INTIMACY_SYSTEM_VERSION = "2026-11-02-003";


// ============================================================================
// INVENTORY-DRIVEN DYNAMIC ACTS (sex toys, lube)
// ============================================================================
// Items carried by the player OR the NPC (e.g. bought from the Shady
// Merchant) become usable intimacy options. Each one is registered as a
// dynamic act (DYNAMIC_SEX_ACTS in intimacy-data-acts.js) so the standard
// pipeline — menu sectioning, validation, arousal, narration — treats it
// like a built-in act. Toys offer a Head-tab (mouth) and a Midsection-tab
// (groin) variant; lube offers a Midsection (groin) and a Head (lips) one.
// Nothing is consumed: toys stay reusable, lube stays in the pack.

function _intimacyItemKey(item) {
    return String((item && (item._uid || item.id)) || "").replace(/[^a-z0-9_-]/gi, "");
}

function _isToyItem(item) {
    if (!item || item.hidden || item.isHidden || item.broken || item.ruined) return false;
    const types = [].concat(item.type || []);
    return types.indexOf("adult-toy") >= 0;
}

function _isLubeItem(item) {
    if (!item || item.hidden || item.isHidden || item.broken || item.ruined) return false;
    const types = [].concat(item.type || []);
    if (types.indexOf("nsfw") < 0 && types.indexOf("consumable") < 0) return false;
    return /lube|lubricant/i.test(String(item.id || "") + " " + String(item.name || ""));
}

function collectIntimacyItemActs(npc, player) {
    if (typeof clearDynamicSexActs !== "function" || typeof registerDynamicAct !== "function") return [];
    clearDynamicSexActs("toy_");
    clearDynamicSexActs("lube_");
    const acts = [];
    const owners = [player, npc];
    for (let o = 0; o < owners.length; o++) {
        const owner = owners[o];
        if (!owner || !Array.isArray(owner.inventory)) continue;
        for (const item of owner.inventory) {
            if (!item) continue;
            const key = _intimacyItemKey(item);
            if (!key) continue;
            const name = String(item.name || "item");
            const lower = name.toLowerCase();
            if (_isToyItem(item)) {
                acts.push(registerDynamicAct({
                    id: "toy_" + key + "_head", menuSection: "Head", tool: "toy", target: "mouth", verb: "use",
                    type: ACT_TYPES.TEASE, label: "Use " + name + " on their mouth",
                    desc: "Use your " + lower + " on their mouth and lips",
                    arousal: { p: 6, n: 14 }, pos: [], reqCloth: CLOTHING_REQUIREMENTS.ANY, sleepingSafe: true,
                    itemUid: item._uid || item.id, itemName: name, itemKind: "toy"
                }));
                acts.push(registerDynamicAct({
                    id: "toy_" + key + "_mid", menuSection: "Midsection", tool: "toy", target: "groin", verb: "use",
                    type: ACT_TYPES.TEASE, label: "Use " + name + " on their groin",
                    desc: "Press your " + lower + " against their groin and genitals",
                    arousal: { p: 8, n: 18 }, pos: [], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF,
                    itemUid: item._uid || item.id, itemName: name, itemKind: "toy"
                }));
            } else if (_isLubeItem(item)) {
                acts.push(registerDynamicAct({
                    id: "lube_" + key + "_mid", menuSection: "Midsection", tool: "lubricant", target: "groin", verb: "apply",
                    type: ACT_TYPES.TEASE, label: "Apply " + name,
                    desc: "Rub " + lower + " over their groin and genitals",
                    arousal: { p: 4, n: 8 }, pos: [], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF,
                    itemUid: item._uid || item.id, itemName: name, itemKind: "lube"
                }));
                acts.push(registerDynamicAct({
                    id: "lube_" + key + "_head", menuSection: "Head", tool: "lubricant", target: "lips", verb: "apply",
                    type: ACT_TYPES.TEASE, label: "Apply " + name + " to their lips",
                    desc: "Coat their lips with a little " + lower,
                    arousal: { p: 3, n: 6 }, pos: [], reqCloth: CLOTHING_REQUIREMENTS.ANY, sleepingSafe: true,
                    itemUid: item._uid || item.id, itemName: name, itemKind: "lube"
                }));
            }
        }
    }
    return acts.map(function (a) { return a.id; });
}

// Push the currently-registered item acts into the flat menu list, marking
// them disabled (with the validity reason as hint) when the current state
// does not allow them — same treatment as built-in acts.
function injectIntimacyItemActs(flatActions, npc, player, positionId) {
    const ids = collectIntimacyItemActs(npc, player);
    if (!ids.length) return;
    const clothingState = npc && npc.intimacy && npc.intimacy.clothing;
    for (const id of ids) {
        const act = (typeof getAct === "function") ? getAct(id) : null;
        if (!act) continue;
        const check = (typeof checkActionValidity === "function")
            ? checkActionValidity(id, npc, player, positionId, clothingState)
            : { valid: true };
        if (check.hidden) continue;
        flatActions.push({
            id: id,
            label: act.label,
            description: act.desc,
            type: act.type,
            disabled: !check.valid,
            disabledHint: check.valid ? null : (check.reason || "Not available now")
        });
    }
}


// ============================================================================
// PLAYER GENDER RESOLUTION
// ============================================================================
// The engine stores the player's gender at the player object root
// (G.player.gender, set in beginAdventure); player.stats has no gender key.
// The gates below historically read player.stats.gender only, which is
// undefined for engine-created players and silently defaulted EVERY player
// to "male" - a female player was offered penis acts ("Ask them to suck your
// cock") and denied vagina acts. Resolve both locations.

function getPlayerGenderForGates(player) {
    const raw = (player && (player.gender || (player.stats && player.stats.gender))) || "male";
    return String(raw).toLowerCase();
}

// Non-binary players have both genitals (see ensurePlayerIntimacyAnatomy and
// genitalGateForGender in the engine: non-binary -> "both"), so they pass
// either player-side gate. NPC-side gates stay binary - NPCs are only
// male/female/none.
function playerGateMale(playerGender) {
    return playerGender === "male" || playerGender === "non-binary";
}

function playerGateFemale(playerGender) {
    return playerGender === "female" || playerGender === "non-binary";
}

// Cloaca check for gating: prefer the hydrated npc.cloaca flag (set by the
// engine at NPC creation / hydrateNPCSpeciesFlags), falling back to the
// species template so NPCs from old saves without the flag still gate
// correctly. Mirrors _npcHasCloaca in intimacy-data-acts.js.
function npcHasCloacaFlag(npc) {
    if (!npc) return false;
    if (npc.cloaca === true) return true;
    if (npc.cloaca === false) return false;
    if (npc.species && typeof getSpeciesTemplate === "function") {
        const tpl = getSpeciesTemplate(npc.species);
        return !!(tpl && tpl.cloaca === true);
    }
    if (npc.species && typeof window !== "undefined" && typeof window.getSpeciesTemplate === "function") {
        const tpl = window.getSpeciesTemplate(npc.species);
        return !!(tpl && tpl.cloaca === true);
    }
    return false;
}

/**
 * Check if a gender string represents female. Handles various formats
 * like "female", "f", "woman", "girl", "Female Elf", etc.
 * Mirrors the female check in getPronouns from intimacy-data-acts.js.
 */
function isGenderFemale(gender) {
    const normalizedGender = String(gender || "").toLowerCase();
    // Check female first with exact or prefix match to avoid "male" matching before "female"
    if (normalizedGender === "female" || normalizedGender === "f" || 
        normalizedGender.includes(" woman") || normalizedGender.includes(" girl") ||
        normalizedGender.includes("female ") || normalizedGender.startsWith("female")) {
        return true;
    }
    return false;
}

/**
 * Check if a gender string represents male. Handles various formats
 * like "male", "m", "man", "boy", "Male Elf", etc.
 * Mirrors the male check in getPronouns from intimacy-data-acts.js.
 */
function isGenderMale(gender) {
    const normalizedGender = String(gender || "").toLowerCase();
    if (normalizedGender === "male" || normalizedGender === "m" || 
        normalizedGender.includes(" man") || normalizedGender.includes(" boy") ||
        normalizedGender.includes("male ") || normalizedGender.startsWith("male")) {
        return true;
    }
    return false;
}


// Cloaca narration wording: reptilian-kin have a single vent instead of a
// separate anus, so canned anal narrative swaps its mammalian nouns for vent
// wording. "Ring" and "muscle" stay - the vent has those too. Only used for
// acts that target the hole itself (anus/ass/butthole), never cheeks.
function _cloacaAnalWording(text) {
    if (!text) return text;
    return String(text)
        .replace(/\bwrinkled skin\b/g, "smooth scales")
        .replace(/\bwrinkled flesh\b/g, "scaled seam")
        .replace(/\b(asshole|ass|anus|butthole|hole|rim|pucker|sphincter|entrance|crack|bowels)\b/g, "vent");
}

// IMPORTS / DEPENDENCIES
// ============================================================================

// Load data files
// Note: In browser environment, these will be loaded as separate script tags
// In Node.js, use require()
if (typeof require !== 'undefined') {
    const positionsData = require('./intimacy-data-positions.js');
    const matrixData = require('./intimacy-data-matrix.js');
    const actsData = require('./intimacy-data-acts.js');
    const contextData = require('./intimacy-data-context.js');
    
    // Export everything
    module.exports = { ...positionsData, ...matrixData, ...actsData, ...contextData, ...module.exports };
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Climax and cooldown constants
var CLIMAX_CONFIG = {
    // Cooldown periods in milliseconds (for males only)
    MALE_COOLDOWN_SHORT: 30000,      // 30 seconds - quick recovery
    MALE_COOLDOWN_NORMAL: 300000,    // 5 minutes - average
    MALE_COOLDOWN_LONG: 600000,      // 10 minutes - exhausted
    MALE_COOLDOWN_EXHAUSTED: 1800000, // 30 minutes - completely spent
    
    // Female recovery (much shorter, can have multiple orgasms)
    FEMALE_COOLDOWN: 60000,          // 1 minute
    
    // Fertility tracking
    FERTILE_WINDOW_DAYS: 5,           // Days around ovulation
    PREGNANCY_CHANCE_BASE: 0.05,     // 5% base chance per internal ejaculation
    PREGNANCY_CHANCE_FERTILE: 0.25,  // 25% during fertile window
    
    // Consequence types
    CONSEQUENCE_TYPES: {
        INTERNAL_SEMEN: "internal_semen",
        ORAL_SEMEN: "oral_semen", 
        EXTERNAL_SEMEN: "external_semen",
        FEMALE_EJACULATE: "female_ejaculate",
        MUTUAL_CLIMAX: "mutual_climax",
        URINE: "urine"
    }
};

// ============================================================================
// LLM NARRATIVE ENHANCEMENT SYSTEM
// ============================================================================

/**
 * LLM Enhancement Configuration
 * Controls the optional LLM-based narrative refinement system
 */
var LLM_ENHANCEMENT_CONFIG = {
    // Tools that qualify as sexual for LLM enhancement
    SEXUAL_TOOLS: new Set(["mouth", "tongue", "fingers", "hand", "penis", "vagina"]),
    
    // Targets that are genital/erotic (for additional filtering)
    SEXUAL_TARGETS: new Set(["vagina", "pussy", "clitoris", "clit", "penis", "cock", "anus", "ass", "buttocks", "butt", "mouth", "lips", "tongue", "breasts", "nipples", "testicles", "balls", "groin"]),
    
    // Maximum cache size per encounter
    MAX_CACHE_SIZE: 50,
    
    // LLM enhancement is enabled
    ENABLED: true
};

/**
 * Check if an action qualifies for LLM enhancement (sexual act)
 * @param {Object} act - The intimacy action object
 * @returns {boolean} - True if this is a sexual act that should be enhanced
 */
function isSexualAct(act) {
    if (!act || !LLM_ENHANCEMENT_CONFIG.ENABLED) return false;
    
    const tool = (act.tool || "").toLowerCase();
    const target = (act.target || "").toLowerCase();
    
    // Check if tool is sexual
    if (LLM_ENHANCEMENT_CONFIG.SEXUAL_TOOLS.has(tool)) {
        return true;
    }
    
    // Also check if target is sexual (catches cases like hand tool on vagina target)
    if (LLM_ENHANCEMENT_CONFIG.SEXUAL_TARGETS.has(target)) {
        return true;
    }
    
    return false;
}

/**
 * Detect the "unnatural act with an uncivilized species" cases that have
 * canned species verbiage (watersports, or anal penetration with a
 * non-reptilian uncivilized species — mirrors the gating in
 * buildWatersportResponse and the uncivilized block of
 * buildPenetrationResponse). For these acts the canned template text is a
 * SAMPLE for the AI to rewrite in the NPC's own voice, not a script to
 * polish verbatim (see the sample mode in buildIntimacyPrompt).
 */
function isUnnaturalUncivilizedAct(npc, act) {
    if (!npc || !act) return false;
    var species = String(npc.species || "");
    if (!species || typeof isCivilizedSpecies !== "function" || isCivilizedSpecies(species)) return false;
    var type = act.type;
    var isWatersport = type === "watersport" || (typeof ACT_TYPES !== "undefined" && type === ACT_TYPES.WATERSPORT);
    var targetLower = String(act.target || "").toLowerCase();
    var actIdLower = String(act.id || "").toLowerCase();
    var isAnalPenetration = (targetLower === "anus" || targetLower === "ass" || targetLower === "butthole" || actIdLower.indexOf("anal") >= 0)
        && (type === "penetrate" || type === "continue"
            || (typeof ACT_TYPES !== "undefined" && (type === ACT_TYPES.PENETRATE || type === ACT_TYPES.CONTINUE)));
    // Reptilian species have a cloaca — anal isn't unusual to them and the
    // canned verbiage skips them, so AI sample mode should too.
    if (isAnalPenetration && typeof getNPCAnatomyType === "function" && getNPCAnatomyType(npc) === "reptilian") {
        isAnalPenetration = false;
    }
    return isWatersport || isAnalPenetration;
}

/**
 * Initialize LLM enhancement cache and queue for an intimacy state
 * @param {Object} intimacy - The intimacy state object
 */
function initializeLLMEnhancement(intimacy) {
    if (!intimacy) return;
    
    if (!intimacy.llmEnhancement) {
        intimacy.llmEnhancement = {
            cache: new Map(),
            pendingPromise: null,
            active: false
        };
    } else {
        // Ensure cache exists and is a Map
        if (!intimacy.llmEnhancement.cache || !(intimacy.llmEnhancement.cache instanceof Map)) {
            intimacy.llmEnhancement.cache = new Map();
        }
        if (intimacy.llmEnhancement.pendingPromise === undefined) {
            intimacy.llmEnhancement.pendingPromise = null;
        }
        if (intimacy.llmEnhancement.active === undefined) {
            intimacy.llmEnhancement.active = false;
        }
    }
}

/**
 * Clear LLM enhancement cache (called on position change or encounter end)
 * @param {Object} intimacy - The intimacy state object
 */
function clearLLMEnhancementCache(intimacy) {
    if (intimacy && intimacy.llmEnhancement) {
        if (intimacy.llmEnhancement.cache && intimacy.llmEnhancement.cache instanceof Map) {
            intimacy.llmEnhancement.cache.clear();
        }
        intimacy.llmEnhancement.active = false;
        intimacy.llmEnhancement.pendingPromise = null;
    }
    // Also clear player narrative cache
    if (intimacy && intimacy.playerNarrativeCache && intimacy.playerNarrativeCache instanceof Map) {
        intimacy.playerNarrativeCache.clear();
    }
    // Also clear clothing reveal cache
    if (intimacy && intimacy.clothingRevealCache && intimacy.clothingRevealCache instanceof Map) {
        intimacy.clothingRevealCache.clear();
    }
}

/**
 * Build context object for LLM enhancement
 * @param {Object} npc - The NPC
 * @param {Object} act - The intimacy action
 * @param {Object} intimacy - The intimacy state
 * @param {string} baseNarrative - The system-generated narrative
 * @returns {Object} - Context for LLM
 */
function buildLLMEnhancementContext(npc, act, intimacy, baseNarrative) {
    const context = {
        baseNarrative: baseNarrative,
        actionType: act.id || "",
        position: (intimacy.position && intimacy.position.player) || "Unknown"
    };
    
    // Add NPC traits
    if (npc) {
        context.npc = {
            species: npc.species || "",
            gender: npc.gender || "",
            civilizationLevel: npc.civilizationLevel || "",
            skinColor: npc.skinColor || npc.skin || "",
            personality: npc.personality || npc.personalityProfile?.summary || "",
            speechPattern: npc.speechPattern || npc.speechStyle || ""
        };
        
        // Add anatomy traits for relevant body parts
        // For over-clothes actions (id ends with "_clothed"), suppress anatomy
        // for the covered target body part(s) so the LLM does not reveal hidden
        // physical characteristics (e.g. breast size, nipple details) through
        // clothing in the enhanced narration.
        if (npc.anatomy) {
            context.npc.anatomy = {};
            const sexualParts = ["vagina", "anus", "penis", "breasts", "nipples", "pubicHair", "buttocks"];

            // Determine which anatomy parts to suppress for clothed actions
            var suppressedParts = [];
            if (act.id && act.id.includes("_clothed")) {
                var targetLower = String(act.target || "").toLowerCase();
                if (targetLower === "breasts" || targetLower === "chest") {
                    suppressedParts = ["breasts", "nipples"];
                } else if (targetLower === "butt" || targetLower === "buttocks" || targetLower === "ass") {
                    suppressedParts = ["buttocks"];
                }
            }

            sexualParts.forEach(part => {
                if (npc.anatomy[part] && suppressedParts.indexOf(part) === -1) {
                    context.npc.anatomy[part] = npc.anatomy[part];
                }
            });

            // Add a clothing note so the LLM knows not to describe bare anatomy
            if (suppressedParts.length > 0) {
                context.npc.clothingNote = "The target body part is covered by clothing. Do not describe or imply its bare appearance, size, shape, or other hidden physical characteristics.";
            }
        }
    }
    
    return context;
}

/**
 * Get cached LLM-enhanced narrative for an action
 * @param {Object} intimacy - The intimacy state
 * @param {string} actionType - The action ID
 * @param {string} position - The current position
 * @returns {string|null} - Cached enhanced narrative or null
 */
function getCachedLLMEnhancement(intimacy, actionType, position) {
    if (!intimacy?.llmEnhancement) return null;
    
    // Ensure cache is initialized and is a Map
    if (!intimacy.llmEnhancement.cache) {
        intimacy.llmEnhancement.cache = new Map();
    }
    
    // If cache is not a Map (e.g., loaded from old save), convert it
    if (!(intimacy.llmEnhancement.cache instanceof Map)) {
        // If it's a plain object, try to preserve its data
        if (intimacy.llmEnhancement.cache && typeof intimacy.llmEnhancement.cache === 'object') {
            const oldCache = intimacy.llmEnhancement.cache;
            intimacy.llmEnhancement.cache = new Map();
            // Convert old cache entries to Map (if it was a plain object with keys)
            for (const key in oldCache) {
                if (oldCache.hasOwnProperty(key)) {
                    intimacy.llmEnhancement.cache.set(key, oldCache[key]);
                }
            }
        } else {
            intimacy.llmEnhancement.cache = new Map();
        }
    }
    
    const cacheKey = `${actionType}||${position}`;
    return intimacy.llmEnhancement.cache.get(cacheKey) || null;
}

/**
 * Delete a cached LLM enhancement (purge after use so it doesn't repeat).
 */
function purgeCachedLLMEnhancement(intimacy, actionType, position) {
    if (!intimacy?.llmEnhancement?.cache || !(intimacy.llmEnhancement.cache instanceof Map)) return;
    var cacheKey = actionType + "||" + position;
    intimacy.llmEnhancement.cache.delete(cacheKey);
}

/**
 * Store LLM-enhanced narrative in cache
 * @param {Object} intimacy - The intimacy state
 * @param {string} actionType - The action ID
 * @param {string} position - The current position
 * @param {string} enhancedNarrative - The LLM-enhanced narrative
 */
function cacheLLMEnhancement(intimacy, actionType, position, enhancedNarrative) {
    if (!intimacy?.llmEnhancement) return;
    
    // Ensure cache is initialized
    if (!intimacy.llmEnhancement.cache || !(intimacy.llmEnhancement.cache instanceof Map)) {
        intimacy.llmEnhancement.cache = new Map();
    }
    
    const cacheKey = `${actionType}||${position}`;
    
    // Enforce max cache size
    if (intimacy.llmEnhancement.cache.size >= LLM_ENHANCEMENT_CONFIG.MAX_CACHE_SIZE) {
        // Delete the first entry (FIFO)
        const firstKey = intimacy.llmEnhancement.cache.keys().next().value;
        intimacy.llmEnhancement.cache.delete(firstKey);
    }
    
    intimacy.llmEnhancement.cache.set(cacheKey, enhancedNarrative);
}

// ============================================================================
// PLAYER NARRATIVE CACHE (AI-polished player action descriptions)
// ============================================================================

/**
 * Get a cached AI-polished player narrative.
 * Keyed by actId||position (same pattern as NPC response caches).
 */
function getCachedPlayerNarrative(intimacy, actId, position) {
    if (!intimacy || !intimacy.playerNarrativeCache) return null;
    if (!(intimacy.playerNarrativeCache instanceof Map)) return null;
    var key = actId + "||" + position;
    return intimacy.playerNarrativeCache.get(key) || null;
}

/**
 * Store an AI-polished player narrative in the cache.
 */
function cachePlayerNarrative(intimacy, actId, position, narrative) {
    if (!intimacy) return;
    if (!intimacy.playerNarrativeCache || !(intimacy.playerNarrativeCache instanceof Map)) {
        intimacy.playerNarrativeCache = new Map();
    }
    var key = actId + "||" + position;
    intimacy.playerNarrativeCache.set(key, narrative);
}

/**
 * Purge a cached player narrative after use.
 */
function purgeCachedPlayerNarrative(intimacy, actId, position) {
    if (!intimacy || !intimacy.playerNarrativeCache || !(intimacy.playerNarrativeCache instanceof Map)) return;
    var key = actId + "||" + position;
    intimacy.playerNarrativeCache.delete(key);
}

// ============================================================================
// CLOTHING REVEAL CACHE (AI-enriched clothing removal narration)
// ============================================================================

/**
 * Get a cached AI-enriched clothing reveal narrative.
 * Keyed by a descriptor snapshot so the same action produces different
 * lines for different NPC body types.
 */
function getCachedClothingReveal(intimacy, cacheKey) {
    if (!intimacy || !intimacy.clothingRevealCache) return null;
    if (!(intimacy.clothingRevealCache instanceof Map)) return null;
    return intimacy.clothingRevealCache.get(cacheKey) || null;
}

/**
 * Store an AI-enriched clothing reveal narrative in the cache.
 */
function cacheClothingReveal(intimacy, cacheKey, narrative) {
    if (!intimacy) return;
    if (!intimacy.clothingRevealCache || !(intimacy.clothingRevealCache instanceof Map)) {
        intimacy.clothingRevealCache = new Map();
    }
    // Enforce max size (FIFO), same as other caches
    if (intimacy.clothingRevealCache.size >= 20) {
        var firstKey = intimacy.clothingRevealCache.keys().next().value;
        intimacy.clothingRevealCache.delete(firstKey);
    }
    intimacy.clothingRevealCache.set(cacheKey, narrative);
}

/**
 * Purge a cached clothing reveal after use so it doesn't repeat.
 */
function purgeCachedClothingReveal(intimacy, cacheKey) {
    if (!intimacy || !intimacy.clothingRevealCache || !(intimacy.clothingRevealCache instanceof Map)) return;
    intimacy.clothingRevealCache.delete(cacheKey);
}

/**
 * Build a stable cache key for a clothing reveal action.
 * Key: clothingAction||clothingItem||target||<descriptor-snapshot>
 * The descriptor snapshot is derived from stable NPC physical traits
 * (species, skin, build, breast size) so the same action yields different
 * enriched lines for different NPC appearances.
 */
function buildClothingRevealKey(npc, act) {
    var action = act.clothingAction || "remove";
    var item = act.clothingItem || "all";
    var target = act.target || "npc";

    // Descriptor snapshot from stable NPC traits
    var nsfwAnatomy = (npc && npc.nsfwTraits && npc.nsfwTraits.anatomy) || {};
    var baseAnatomy = (npc && npc.anatomy) || {};
    var species = (npc && npc.species || "").toLowerCase();
    var skinTone = String(npc.skinTone || npc.surfaceColor || "").toLowerCase();
    var build = String(baseAnatomy.build || npc.bodyType || "").toLowerCase();
    var size = String(baseAnatomy.size || npc.size || "").toLowerCase();
    var breastSize = "";
    if (nsfwAnatomy.breasts && nsfwAnatomy.breasts.sizeCategory) {
        breastSize = String(nsfwAnatomy.breasts.sizeCategory).toLowerCase();
    }
    var snap = [species, skinTone, build, size, breastSize].join("+");

    return action + "||" + item + "||" + target + "||" + snap;
}

/**
 * Map a clothing item to the anatomy parts it reveals.
 * Used to feed the prompt the anatomy of the body part being uncovered.
 */
function getRevealedAnatomyParts(clothingItem) {
    if (clothingItem === "top") return ["breasts", "nipples"];
    if (clothingItem === "bottom") return ["buttocks", "vagina", "penis", "pubicHair"];
    if (clothingItem === "undergarments") return ["vagina", "penis", "pubicHair"];
    return [];
}

/**
 * Build the AI prompt for enriching a clothing removal narration.
 * Seeds with visible physical descriptors (species, skin, build, hair)
 * plus the anatomy of the body part being revealed. Neutral to arousal.
 */
function buildClothingRevealPrompt(npc, act, player, templateResponse) {
    var clothingItem = act.clothingItem || "clothing";
    var clothingAction = act.clothingAction || "remove";
    var target = act.target || "npc";
    var npcName = (npc && npc.name) || "the NPC";
    var species = (npc && npc.species) || "Human";
    var gender = (npc && npc.gender) || "female";

    // Visible descriptors (already-visible traits, not hidden anatomy)
    var skinDesc = "";
    if (typeof getSkinDescription === "function") {
        skinDesc = getSkinDescription(npc) || "";
    }
    var sizeContext = "";
    if (typeof getSizeContext === "function") {
        sizeContext = getSizeContext(player, npc) || "";
    }
    var baseAnatomy = (npc && npc.anatomy) || {};
    var build = baseAnatomy.build || npc.bodyType || "";
    var size = baseAnatomy.size || npc.size || "";
    var hairDesc = "";
    if (npc.hairColor) {
        hairDesc = npc.hairColor + (npc.hairStyle ? " " + npc.hairStyle + " hair" : " hair");
    }

    // Species note for non-human NPCs
    var _species = species.toLowerCase();
    var _isUncivilized = _species && !isCivilizedSpecies(_species);
    var _speciesNote = _isUncivilized
        ? "\nThe NPC is an uncivilized " + species + ". Describe their body in raw, animal terms — coarse hair, rough skin, non-human features where relevant."
        : (species && species !== "Human")
            ? "\nThe NPC is a " + species + ". Include species-appropriate physical details (skin texture, features)."
            : "";

    // Reveal anatomy — the body parts exposed by removing this garment.
    // This is the OPPOSITE of the clothed-action suppression: for removal,
    // we WANT the anatomy so the narration can describe the reveal.
    var nsfwAnatomy = (npc && npc.nsfwTraits && npc.nsfwTraits.anatomy) || {};
    var revealedParts = getRevealedAnatomyParts(clothingItem);
    var revealDesc = "";
    if (revealedParts.length > 0) {
        var parts = [];
        for (var i = 0; i < revealedParts.length; i++) {
            var partName = revealedParts[i];
            var partData = nsfwAnatomy[partName];
            if (partData) {
                parts.push(partName + ": " + JSON.stringify(partData));
            }
        }
        if (parts.length > 0) {
            revealDesc = "\nREVEALED ANATOMY (the body parts exposed by removing this garment):\n" + parts.join("\n");
        }
    }

    // Determine the garment label
    var garmentLabel = clothingItem;
    if (clothingItem === "top") garmentLabel = "top/shirt";
    if (clothingItem === "bottom") garmentLabel = "bottom/pants/skirt";
    if (clothingItem === "undergarments") garmentLabel = "underwear/undergarments";

    // Action verb
    var actionVerb = "remove";
    if (clothingAction === "pull_down") actionVerb = "pull down";
    if (clothingAction === "lift") actionVerb = "lift";
    if (clothingAction === "move_aside") actionVerb = "move aside";
    if (!act.clothingItem && !act.clothingAction) actionVerb = "undress completely";

    var whose = target === "player" ? "your" : ((typeof getPossessivePronoun === "function" ? getPossessivePronoun(npc) : "their"));

    var prompt = [
"You are writing the narration for a clothing removal moment in a text adventure game.",
"The NPC is " + npcName + ", a " + species + " " + gender + "." +
    (build ? " Build: " + build + "." : "") +
    (size ? " Size: " + size + "." : "") +
    (skinDesc ? " Skin: " + skinDesc + "." : "") +
    (hairDesc ? " Hair: " + hairDesc + "." : ""),
"",
"INSTRUCTIONS:",
"- The player is " + actionVerb + "ing " + whose + " " + garmentLabel + ".",
"- Describe the player helping " + (target === "player" ? "themselves" : npcName) + " " + actionVerb + " " + (target === "player" ? "their" : whose) + " " + garmentLabel + ".",
"- Then describe what body is being revealed as the garment comes off. Be specific and sensory.",
"- Use the REVEALED ANATOMY data below to describe the exposed body parts accurately (breast size, nipple texture, areola color, pubic hair, etc.).",
"- Write in second person (\"You help her pull...\"). This is the player's perspective.",
"- Use direct, literal language: \"pull\", \"slide\", \"lift\", \"expose\", \"bare\". No metaphors.",
"- Keep it to 1-2 sentences. This is a moment of undressing, not a sex act.",
"- Do NOT describe sexual arousal, lubrication, or climax. This is a neutral reveal of the body.",
"- Do NOT add NPC dialogue or speech. This is only narration.",
"- Do NOT invent new body parts or features not in the revealed anatomy data.",
"",
"STYLE:",
"- RIGHT: \"You help her pull her red shirt off, exposing her petite breasts, the brown areolas hardening in the cool air.\"",
"- RIGHT: \"You slide her panties down her thighs, baring the dark curls of her pubic hair and the smooth fold of her vulva.\"",
"- WRONG: \"Your fingers dance across the silken fabric, revealing the temple of her desire.\"",
"- WRONG: \"She moans with pleasure as you expose her heaving bosom to the night air.\"",
"",
"ACTION: " + actionVerb + " " + whose + " " + garmentLabel,
_speciesNote ? _speciesNote : "",
sizeContext ? sizeContext : "",
revealDesc ? revealDesc : "",
"",
"BASE TEXT (the plain template — enrich this into a vivid reveal narration):",
"\"" + (templateResponse || "") + "\"",
"",
"IMPORTANT: Output ONLY the enriched narration text. No explanations, no commentary, no meta-discussion. Just output the final narration.",
"",
"RESPOND with only the enriched text, nothing else:"
    ].filter(function(l) { return l !== ""; }).join("\n");

    return prompt;
}

/**
 * Prefetch AI-enriched clothing reveal narrations for the NPC-targeted
 * clothing actions that are currently available given the clothed state.
 * Called at encounter start so the enriched lines are cached before the
 * player clicks. Non-blocking — mirrors the penetration prefetch pattern.
 */
function prefetchClothingReveals(npc, player, intimacy) {
    if (!npc || !intimacy) return;
    if (typeof ai !== "function" && (typeof window === "undefined" || typeof window.ai !== "function")) return;

    var _ai = (typeof window !== "undefined" && typeof window.ai === "function") ? window.ai : (typeof ai === "function" ? ai : null);
    if (!_ai) return;

    var clothingState = intimacy.clothing;
    if (!clothingState || !clothingState.npc) return;

    // Only prefetch if the NPC is still clothed (at least one item on)
    var npcCloth = clothingState.npc;
    var anyOn = npcCloth.top || npcCloth.bottom || npcCloth.undergarments;
    if (!anyOn) return;

    // Find NPC-targeted clothing actions valid for the current clothing state
    var allActIds = typeof getAllActIds === "function" ? getAllActIds() : Object.keys(window.SEX_ACTS || {});
    if (!allActIds || !allActIds.length) return;

    var currentPosition = (intimacy.position && intimacy.position.player) || "Unknown";

    allActIds.forEach(function(actId) {
        var act = typeof getAct === "function" ? getAct(actId) : null;
        if (!act) return;
        if (act.type !== ACT_TYPES.CLOTHING) return;
        // Only NPC-targeted actions (player undressing has less anatomy data)
        if (act.target !== "npc") return;

        // Check if the action is valid for the current clothing state
        if (!clothingState.npc[act.clothingItem]) return;

        // Build cache key and skip if already cached or pending
        var cacheKey = buildClothingRevealKey(npc, act);
        if (intimacy.clothingRevealCache && intimacy.clothingRevealCache instanceof Map && intimacy.clothingRevealCache.has(cacheKey)) return;
        if (!intimacy._pendingClothingPrefetch) intimacy._pendingClothingPrefetch = {};
        if (intimacy._pendingClothingPrefetch[cacheKey]) return;
        intimacy._pendingClothingPrefetch[cacheKey] = true;

        // Build the template response (plain narration) to enrich
        var templateResponse = buildClothingNarration(act, npc, player);

        (async function() {
            try {
                var prompt = buildClothingRevealPrompt(npc, act, player, templateResponse);
                console.log("[Intimacy Clothing] Background reveal prefetch for", actId);
                var result = await _ai({
                    instruction: prompt,
                    startWith: "",
                    endButtons: "none",
                    generatorName: "cyoaftw-engine-core"
                });
                var enriched = result && (result.text || result);
                if (enriched && enriched.trim()) {
                    var _isMeta = /since the base|please provide|I cannot|I'm unable|as an ai|i'll polish|here is the|here's the/i.test(enriched.trim());
                    if (_isMeta) {
                        console.log("[Intimacy Clothing] Reveal rejected (meta-commentary) for", actId);
                    } else {
                        cacheClothingReveal(intimacy, cacheKey, enriched.trim());
                        console.log("[Intimacy Clothing] Cached reveal for", actId, "(" + enriched.substring(0, 60) + "...)");
                    }
                }
            } catch (e) {
                console.warn("[Intimacy Clothing] Reveal prefetch failed for", actId, e);
            } finally {
                delete intimacy._pendingClothingPrefetch[cacheKey];
            }
        })();
    });
}

/**
 * Build the AI prompt for polishing the PLAYER narrative (the "You..." action description).
 * Separate from the NPC response prompt — this polishes the player's action text.
 */
function buildPlayerNarrativePrompt(context) {
    var npc = context.npc;
    var player = context.player;
    var action = context.action;
    var position = context.position;
    var templateResponse = context.templateResponse; // The template player narrative

    var _species = (npc.species || "Human").toLowerCase();
    var _isUncivilized = _species && !isCivilizedSpecies(_species);
    var _speciesNote = _isUncivilized
        ? "\nThe NPC is an uncivilized " + npc.species + ". Describe their body in raw, animal terms — coarse hair, rough skin, non-human features where relevant."
        : (npc.species && npc.species !== "Human")
            ? "\nThe NPC is a " + npc.species + ". Include species-appropriate physical details (skin color, texture, features)."
            : "";

    var _skinDesc = "";
    if (typeof getSkinDescription === "function") {
        _skinDesc = getSkinDescription(npc);
    }
    var _sizeContext = "";
    if (typeof getSizeContext === "function") {
        _sizeContext = getSizeContext(player, npc) || "";
    }

    var actTypeName = action.type === "penetrate" ? "penetration (entering)" :
                 action.type === "continue" ? "continued penetration (thrusting)" :
                 action.type === "tease" ? "teasing/touching" :
                 action.type === "impact" ? "impact (spanking/slapping)" :
                 "intimate action";

    var prompt = [
"You are polishing the PLAYER'S action description from a sex scene in a text adventure game.",
"The NPC is " + (npc.name || "the NPC") + ", a " + (npc.species || "Human") + " " + (npc.gender || "female") + "." + (npc.temperament ? " Temperament: " + npc.temperament + "." : ""),
"",
"INSTRUCTIONS:",
"- Polish the BASE TEXT below. Fix grammar, refine the sentence, make it more vivid and erotic.",
"- If the base text is a system-generated FRAGMENT (no main verb, e.g. \"Your mouth sucking her teats...\"), rewrite it as a complete, clear sentence with proper grammar.",
"- Keep the same meaning, the same act, and the same physical details. Do NOT invent new actions or body parts.",
"- The act: " + action.tool + " " + action.verb + " " + action.target + " (" + actTypeName + ").",
"- Write in second person (\"You press...\"). This is the player's perspective.",
"- Use direct, literal language: \"press\", \"push\", \"slide\", \"grip\", \"clench\". No metaphors.",
"- Match the length of the base text. If the base text is a multi-sentence staged passage (slow inch-by-inch insertion or withdrawal), keep every sentence and the progression intact — do not compress it into one sentence.",
"- If the base text mentions sphincter, wrinkled skin, tight ring, scent, difficulty, or size — keep those details.",
"- If the base text describes blocked/failed insertion — keep that. Do NOT make it succeed if the base says it failed.",
"- Do NOT add NPC dialogue or speech. This is only the player's action description.",
"- Do NOT add narration, inner monologue, or atmospheric description. Stay on the body.",
"",
"STYLE:",
"- RIGHT: \"You push the head of your hard cock against her anus, the wrinkled sphincter clenching tight. You push slowly, the wrinkled flesh pulling taut as you force the ring open.\"",
"- RIGHT: \"You press your cock against her wrinkled sphincter, but the tight ring refuses to yield. You can't get it in.\"",
"- WRONG: \"Your fingers remain anchored to the heat of her flushed backside.\"",
"- WRONG: \"Forcing her glutes wide, you lay bare the dusky ring of her anus, the velvet skin stretching taut.\"",
"",
"ACT: " + action.tool + " " + action.verb + " " + action.target + " (" + actTypeName + ")",
"Position: " + (position.label || "Unknown") + "." + (position.promptNote ? " Geometry: " + position.promptNote : ""),
_speciesNote ? _speciesNote : "",
_skinDesc ? "NPC skin: " + _skinDesc : "",
_sizeContext ? _sizeContext : "",
getBodyUseDescriptor(npc, action.target)
    ? "NPC's " + action.target + " state: " + getBodyUseDescriptor(npc, action.target) + " (reflect this in the polish where relevant - an already-used hole should read wetter, looser, easier to enter than a fresh one)"
    : "",
"",
"BASE TEXT (polish this — fix grammar, refine, make more erotic, keep same meaning and details):",
"\"" + (templateResponse || "") + "\"",
"",
"IMPORTANT: Output ONLY the polished text. No explanations, no commentary, no meta-discussion. Just output the final polished sentence.",
"",
"RESPOND with only the polished text, nothing else:"
    ].filter(function(l) { return l !== ""; }).join("\n");

    return prompt;
}

// ============================================================================
// PENETRATION PREFETCH SYSTEM
// ============================================================================

/**
 * Get a cached penetration response for a specific act+position+depth.
 * The penetration response cache is stored on intimacy.penetrationCache (a Map)
 * separate from the LLM enhancement cache. Keys are `actId||position||depth`.
 */
function getCachedPenetrationResponse(intimacy, actId, position, depth) {
    if (!intimacy || !intimacy.penetrationCache) return null;
    if (!(intimacy.penetrationCache instanceof Map)) {
        // Convert from plain object if needed
        var old = intimacy.penetrationCache;
        intimacy.penetrationCache = new Map();
        if (old && typeof old === 'object') {
            for (var k in old) { if (old.hasOwnProperty(k)) intimacy.penetrationCache.set(k, old[k]); }
        }
        return null;
    }
    var key = actId + "||" + position + "||" + (depth || 0);
    return intimacy.penetrationCache.get(key) || null;
}

/**
 * Delete a cached penetration response (purge after use so it doesn't repeat).
 */
function purgeCachedPenetrationResponse(intimacy, actId, position, depth) {
    if (!intimacy || !intimacy.penetrationCache || !(intimacy.penetrationCache instanceof Map)) return;
    var key = actId + "||" + position + "||" + (depth || 0);
    intimacy.penetrationCache.delete(key);
}

/**
 * Store a penetration response in cache.
 */
function cachePenetrationResponse(intimacy, actId, position, depth, text) {
    if (!intimacy) return;
    if (!intimacy.penetrationCache || !(intimacy.penetrationCache instanceof Map)) {
        intimacy.penetrationCache = new Map();
    }
    var key = actId + "||" + position + "||" + (depth || 0);
    // Enforce max size (FIFO)
    if (intimacy.penetrationCache.size >= 30) {
        var firstKey = intimacy.penetrationCache.keys().next().value;
        intimacy.penetrationCache.delete(firstKey);
    }
    intimacy.penetrationCache.set(key, text);
}

/**
 * Prefetch continue responses for a penetration act.
 * Called when a penetration act starts (enter/thrust/fuck/etc.). Generates 3
 * AI responses for the continue variations of that act at depths 1, 2, and 3
 * in the background, so the player's next "Continue" click gets a cached
 * AI response instantly.
 *
 * @param {Object} npc - The NPC
 * @param {Object} act - The penetration act that just started
 * @param {Object} intimacy - The intimacy state
 * @param {Object} player - The player
 */
function prefetchPenetrationContinue(npc, act, intimacy, player) {
    if (!npc || !act || !intimacy) return;
    if (typeof ai !== 'function' && typeof window.ai !== 'function') return;
    if (act.type !== "penetrate" && act.type !== "continue") return;

    var position = (intimacy.position && intimacy.position.player) || "Unknown";

    // Find continue variants for this penetration target+tool
    // e.g. if act is "enter_pussy", continues are thrust_pussy, pump_pussy, fuck_pussy, pound_pussy
    var target = (act.target || "").toLowerCase();
    var tool = (act.tool || "").toLowerCase();
    var continueActIds = [];

    // Find all CONTINUE-type acts with the same target and tool
    if (typeof getAct !== 'function') return;
    var allActIds = typeof getAllActIds === 'function' ? getAllActIds() : Object.keys(window.SEX_ACTS || {});

    allActIds.forEach(function(id) {
        var candidate = getAct(id);
        if (!candidate) return;
        if (candidate.type !== "continue") return;
        if ((candidate.target || "").toLowerCase() !== target) return;
        if ((candidate.tool || "").toLowerCase() !== tool) return;
        continueActIds.push(id);
    });

    // If no specific continues found, use the act itself as continue
    if (!continueActIds.length) {
        continueActIds = [act.id];
    }

    // Pick up to 3 continue variants to prefetch
    var toPrefetch = continueActIds.slice(0, 3);

    toPrefetch.forEach(function(continueActId, index) {
        var depth = index + 1; // prefetch for depths 1, 2, 3
        var cacheKey = continueActId + "||" + position + "||" + depth;

        // Skip if already cached
        if (intimacy.penetrationCache && intimacy.penetrationCache instanceof Map && intimacy.penetrationCache.has(cacheKey)) return;
        // Skip if already being prefetched
        if (!intimacy._pendingPenetrationPrefetch) intimacy._pendingPenetrationPrefetch = {};
        if (intimacy._pendingPenetrationPrefetch[cacheKey]) return;
        intimacy._pendingPenetrationPrefetch[cacheKey] = true;

        // Build the context for this continue act
        var continueAct = getAct(continueActId);
        if (!continueAct) { delete intimacy._pendingPenetrationPrefetch[cacheKey]; return; }

        var context = buildActionContext(npc, player, continueAct, intimacy, position);
        var prompt = buildIntimacyPrompt(context);

        // Fire non-blocking AI call
        (async function() {
            try {
                var result = await (typeof window !== "undefined" && typeof window.ai === "function" ? window.ai : ai)({
                    instruction: prompt,
                    startWith: "",
                    endButtons: "none",
                    generatorName: "cyoaftw-engine-core"
                });
                var text = result && (result.text || result);
                if (text && typeof text === 'string' && text.trim()) {
                    cachePenetrationResponse(intimacy, continueActId, position, depth, text);
                    console.log("[Intimacy Prefetch] Cached continue response for", continueActId, "depth", depth);
                }
            } catch (e) {
                console.warn("[Intimacy Prefetch] Failed for", continueActId, "depth", depth, e);
            } finally {
                delete intimacy._pendingPenetrationPrefetch[cacheKey];
            }
        })();
    });
}

/**
 * Request LLM enhancement for a narrative (non-blocking)
 * Only queues one request at a time per encounter
 * @param {Object} npc - The NPC
 * @param {Object} act - The intimacy action
 * @param {Object} intimacy - The intimacy state
 * @param {string} baseNarrative - The system-generated narrative
 * @returns {Promise<string|null>} - Resolves with enhanced narrative or null if failed
 */
async function requestLLMEnhancement(npc, act, intimacy, baseNarrative) {
    if (!LLM_ENHANCEMENT_CONFIG.ENABLED || !npc || !act || !intimacy) {
        return Promise.resolve(null);
    }
    
    // Check if we already have a cached version
    const position = (intimacy.position && intimacy.position.player) || "Unknown";
    const cached = getCachedLLMEnhancement(intimacy, act.id, position);
    if (cached) {
        return Promise.resolve(cached);
    }
    
    // Initialize enhancement system if needed
    initializeLLMEnhancement(intimacy);
    
    // If there's already a pending request, wait for it to complete first
    if (intimacy.llmEnhancement.pendingPromise) {
        try {
            await intimacy.llmEnhancement.pendingPromise;
        } catch (e) {
            // Previous request failed, continue anyway
            console.warn(`[Intimacy LLM] Previous enhancement request failed:`, e);
        }
    }
    
    // Build context
    const context = buildLLMEnhancementContext(npc, act, intimacy, baseNarrative);
    
    // Create the promise and store it
    const enhancementPromise = (async () => {
        try {
            // Only proceed if AI function is available
            var _ai = (typeof window !== 'undefined' && typeof window.ai === 'function') ? window.ai : (typeof ai === 'function' ? ai : null);
            if (!_ai) {
                return null;
            }
            
            // Check if action involves verbal response (for speech pattern)
            const hasVerbal = act.objectDialogueTags || act.dialogueTags || act.tags;
            
            // Build the prompt
            const prompt = buildLLMEnhancementPrompt(context, hasVerbal);
            
            const result = await _ai({
                instruction: prompt,
                startWith: "",
                endButtons: "none",
                generatorName: "cyoaftw-engine-core"
            });
            
            const enhancedText = result && (result.text || result);
            
            if (enhancedText && typeof enhancedText === 'string' && enhancedText.trim()) {
                // Cache the result
                cacheLLMEnhancement(intimacy, act.id, position, enhancedText);
                return enhancedText;
            }
            
            return null;
        } catch (error) {
            console.error(`[Intimacy LLM] Enhancement failed:`, error);
            return null;
        } finally {
            // Clear the pending promise
            if (intimacy.llmEnhancement) {
                intimacy.llmEnhancement.pendingPromise = null;
            }
        }
    })();
    
    // Store the promise so subsequent calls wait
    intimacy.llmEnhancement.pendingPromise = enhancementPromise;
    intimacy.llmEnhancement.active = true;
    
    return enhancementPromise;
}

/**
 * Build the LLM enhancement prompt
 * @param {Object} context - The context object
 * @param {boolean} includeSpeech - Whether to include speech pattern guidance
 * @returns {string} - The prompt for LLM
 */
function buildLLMEnhancementPrompt(context, includeSpeech = false) {
    const promptParts = [
        "Enhance this erotic intimacy narrative with more vivid, varied, and descriptive language.",
        "Keep all the same facts, actions, and context from the base narrative.",
        "Use explicit, anatomical terminology where appropriate.",
        "Maintain the same perspective (second person 'you' for player, third person for NPC).",
        "Do not add new actions, body parts, or contextual elements that aren't in the base.",
        ""
    ];
    
    if (context.npc) {
        promptParts.push(`NPC Context:`);
        promptParts.push(`- Species: ${context.npc.species}`);
        promptParts.push(`- Gender: ${context.npc.gender}`);
        promptParts.push(`- Civilization: ${context.npc.civilizationLevel}`);
        promptParts.push(`- Skin: ${context.npc.skinColor}`);
        promptParts.push(`- Personality: ${context.npc.personality}`);
        
        if (includeSpeech && context.npc.speechPattern) {
            promptParts.push(`- Speech pattern: ${context.npc.speechPattern}`);
        }
        
        if (context.npc.anatomy) {
            promptParts.push(`- Anatomy traits: ${JSON.stringify(context.npc.anatomy)}`);
        }
        if (context.npc.clothingNote) {
            promptParts.push(`- ${context.npc.clothingNote}`);
        }
        promptParts.push("");
    }
    
    promptParts.push(`Action: ${context.actionType}`);
    promptParts.push(`Position: ${context.position}`);
    promptParts.push("");
    promptParts.push(`Base Narrative: "${context.baseNarrative}"`);
    promptParts.push("");
    promptParts.push(`Output only the enhanced narrative text. Keep roughly the base length — 1-3 sentences for a short base; a staged multi-beat passage keeps every beat. Do not add explanations, disclaimers, or formatting.`);
    
    return promptParts.join("\n");
}

// ============================================================================
// PRONOUN HELPERS
// ============================================================================

/**
 * Get possessive pronoun for an NPC based on gender
 * Returns: her, his, their
 */
function getPossessivePronoun(npc) {
    if (!npc) return "their";
    
    const gender = (npc.gender || "").toLowerCase();
    // Check female first with exact or prefix match to avoid "male" matching "female"
    if (gender === "female" || gender === "f" || 
        gender.includes(" woman") || gender.includes(" girl") ||
        gender.includes("female ") || gender.startsWith("female")) {
        return "her";
    }
    if (gender === "male" || gender === "m" || 
        gender.includes(" man") || gender.includes(" boy") ||
        gender.includes("male ") || gender.startsWith("male")) {
        return "his";
    }
    return "their";
}

/**
 * Get subject pronoun for an NPC based on gender
 * Returns: She, He, They
 */
function getSubjectPronoun(npc) {
    if (!npc) return "They";
    
    const gender = (npc.gender || "").toLowerCase();
    // Check female first with exact or prefix match to avoid "male" matching "female"
    if (gender === "female" || gender === "f" || 
        gender.includes(" woman") || gender.includes(" girl") ||
        gender.includes("female ") || gender.startsWith("female")) {
        return "She";
    }
    if (gender === "male" || gender === "m" || 
        gender.includes(" man") || gender.includes(" boy") ||
        gender.includes("male ") || gender.startsWith("male")) {
        return "He";
    }
    return "They";
}

/**
 * Get object pronoun for an NPC based on gender
 * Returns: her, him, them
 */
function getObjectPronoun(npc) {
    if (!npc) return "them";
    const gender = (npc.gender || "female").toLowerCase();
    // Check female first, then male, with prefix matching for race+gender combinations
    if (gender === "female" || gender === "f" || 
        gender.includes(" woman") || gender.includes(" girl") ||
        gender.includes("female ") || gender.startsWith("female")) return "her";
    if (gender === "male" || gender === "m" || 
        gender.includes(" man") || gender.includes(" boy") ||
        gender.includes("male ") || gender.startsWith("male")) return "him";
    return "them";
}

// ============================================================================
// INTIMACY STATE MANAGEMENT
// ============================================================================

/**
 * Initialize intimacy state for an NPC
 */
/**
 * Convert character equipment to intimacy clothing state format
 * Maps equipment slots to intimacy clothing categories (top, bottom, undergarments)
 */
function getClothingStateForCharacter(character) {
    if (!character) return { top: true, bottom: true };
    
    // Default to clothed - most characters wear clothes by default
    const defaultState = { top: true, bottom: true };
    
    // If character has equipped items, use them to determine clothing state
    if (character.equipped) {
        // Map equipment slots to intimacy clothing
        const hasTop = !!character.equipped.upper || !!character.equipped.head || !!character.equipped.chest;
        const hasBottom = !!character.equipped.lower || !!character.equipped.feet || !!character.equipped.legs;
        
        return {
            top: hasTop,
            bottom: hasBottom
        };
    }
    
    // If no equipped property, assume fully clothed
    return defaultState;
}

function initializeIntimacyState(npc) {
    if (!npc) return null;
    
    // Determine gender for tracking
    const npcGender = (npc.gender || "female").toLowerCase();
    
    // Initialize clothing state based on actual equipped items if available
    // Use global G if available, otherwise default to clothed
    const player = typeof G !== 'undefined' ? G.player : null;
    const playerClothing = getClothingStateForCharacter(player);
    const npcClothing = getClothingStateForCharacter(npc);
    
    // If intimacy state already exists, ensure all required properties are present
    if (npc.intimacy) {
        // Check if clothing state exists and is valid
        if (!npc.intimacy.clothing || 
            !npc.intimacy.clothing.npc || 
            !npc.intimacy.clothing.player) {
            console.log(`[Intimacy] Fixing missing clothing state`);
            npc.intimacy.clothing = {
                player: playerClothing,
                npc: npcClothing
            };
        } else {
            // Clothing state exists - this is normal, no need to log
        }
        
        // Ensure position object exists
        if (!npc.intimacy.position) {
            npc.intimacy.position = {
                player: DEFAULT_POSITION,
                npc: DEFAULT_POSITION
            };
        }
        
        // Ensure encounter object exists
        if (!npc.intimacy.encounter) {
            npc.intimacy.encounter = {
                active: false,
                startedAt: null,
                lastActivityAt: null
            };
        }
        
        // Ensure actionHistory array exists
        if (!npc.intimacy.actionHistory) {
            npc.intimacy.actionHistory = [];
        }
        
        // Ensure engagedActs array exists
        if (!npc.intimacy.engagedActs) {
            npc.intimacy.engagedActs = [];
        }
        
        // Ensure arousal object exists
        if (!npc.intimacy.arousal) {
            npc.intimacy.arousal = {
                player: 0,
                npc: 0
            };
        }
        
        // Ensure penetration object exists
        if (!npc.intimacy.penetration) {
            npc.intimacy.penetration = {
                active: false,
                tool: null,
                target: null,
                depth: 0,
                playerIsBottom: false
            };
        }
        
        // Ensure lube object exists
        if (!npc.intimacy.lube) {
            npc.intimacy.lube = {
                vagina: { hasLube: false, level: 0 },
                anus: { hasLube: false, level: 0 },
                mouth: { hasLube: false, level: 0 },
                general: { hasLube: false, level: 0 }
            };
        }
        
        return npc.intimacy;
    }
    
    console.log(`[Intimacy] Initializing clothing state - NPC: ${JSON.stringify(npcClothing)}, Player: ${JSON.stringify(playerClothing)}`);
    
    npc.intimacy = {
        // Clothing state
        clothing: {
            player: playerClothing,
            npc: npcClothing
        },
        // Current positions
        position: {
            player: DEFAULT_POSITION,
            npc: DEFAULT_POSITION
        },
        // Arousal tracking
        arousal: {
            player: 0,
            npc: 0
        },
        // Lube state - tracked per body part
        lube: {
            vagina: { hasLube: false, level: 0 },
            anus: { hasLube: false, level: 0 },
            mouth: { hasLube: false, level: 0 },
            general: { hasLube: false, level: 0 }
        },
        // Legacy global lube for backwards compatibility
        hasLube: false,
        lubeLevel: 0,
        // Virginity tracking
        virginity: {
            vaginal: true,
            anal: true
        },
        // Last action for continuity
        lastAction: null,
        // Action history (for context)
        actionHistory: [],
        // Current penetration state
        penetration: {
            active: false,
            tool: null,
            target: null,
            depth: 0,
            playerIsBottom: false
        },
        // Encounter state
        encounter: {
            active: false,
            startedAt: null,
            lastActivityAt: null
        },
        // Climax and cooldown tracking
        climax: {
            playerOrgasms: 0,
            npcOrgasms: 0,
            lastPlayerClimax: null,
            lastNPCClimax: null,
            // Male-only cooldown
            playerCooldownUntil: null,
            npcCooldownUntil: npcGender === "male" ? null : null,
            // Track internal ejaculation for semen drip narratives
            lastInternalEjaculation: null,  // e.g., "vagina", "anus"
            hasInternalEjaculation: false
        },
        // Encounter tracking for special events
        encounterFlags: {
            hasAnalPee: false  // Track if accidental peeing occurred this encounter
        },
        // Fertility and pregnancy tracking
        fertility: {
            // Only track for female NPCs
            isFertile: npcGender === "female" ? false : null,
            fertileUntil: npcGender === "female" ? null : null,
            // Pregnancy state
            isPregnant: npcGender === "female" ? false : null,
            pregnancyWeek: npcGender === "female" ? 0 : null,
            pregnancyStartDate: npcGender === "female" ? null : null
        },
        // Fluid/consequence tracking from current encounter
        fluids: {
            internalSemen: false,
            oralSemen: false,
            externalSemen: false,
            femaleEjaculate: false,
            urine: false,
            penisSaliva: false,
            penisSemen: false
        },
        // LLM enhancement system
        llmEnhancement: {
            cache: new Map(),
            pendingPromise: null,
            active: false
        }
    };
    
    return npc.intimacy;
}

/**
 * Reset intimacy state for an NPC
 */
function resetIntimacyState(npc) {
    if (!npc || !npc.intimacy) return;
    
    const npcGender = (npc.gender || "female").toLowerCase();
    
    npc.intimacy = {
        clothing: { ...DEFAULT_CLOTHING_STATE },
        position: { player: DEFAULT_POSITION, npc: DEFAULT_POSITION },
        arousal: { player: 0, npc: 0 },
        lube: {
            vagina: { hasLube: false, level: 0 },
            anus: { hasLube: false, level: 0 },
            mouth: { hasLube: false, level: 0 },
            general: { hasLube: false, level: 0 }
        },
        hasLube: false,
        lubeLevel: 0,
        virginity: { vaginal: true, anal: true },
        lastAction: null,
        actionHistory: [],
        penetration: { active: false, tool: null, target: null, depth: 0, playerIsBottom: false },
        encounter: { active: false, startedAt: null, lastActivityAt: null },
        climax: {
            playerOrgasms: 0,
            npcOrgasms: 0,
            lastPlayerClimax: null,
            lastNPCClimax: null,
            playerCooldownUntil: null,
            npcCooldownUntil: npcGender === "male" ? null : null,
            // Track internal ejaculation for semen drip narratives
            lastInternalEjaculation: null,
            hasInternalEjaculation: false
        },
        // Encounter tracking for special events
        encounterFlags: {
            hasAnalPee: false,
            impactCount: 0,
            impactToleranceReached: false,
            nipplePlayCount: 0,
            analEjaculationCount: 0
        },
        fertility: {
            isFertile: npcGender === "female" ? false : null,
            fertileUntil: npcGender === "female" ? null : null,
            isPregnant: npcGender === "female" ? false : null,
            pregnancyWeek: npcGender === "female" ? 0 : null,
            pregnancyStartDate: npcGender === "female" ? null : null
        },
        fluids: {
            internalSemen: false,
            oralSemen: false,
            externalSemen: false,
            femaleEjaculate: false,
            urine: false,
            penisSaliva: false,
            penisSemen: false
        },
        // LLM enhancement system
        llmEnhancement: {
            cache: new Map(),
            pendingPromise: null,
            active: false
        },
        // Cache for AI-polished player narratives (separate from NPC response cache)
        playerNarrativeCache: new Map()
    };
}

/**
 * Start an intimate encounter
 */
/**
 * Materialize player.anatomy from the character-creation profile saved by
 * the SFW setup form (G.player.appearance): skinTone, species, and the
 * genital size picks (penisSize / vaginaSize, gated by gender - male gets
 * penis only, female gets vagina only, non-binary gets both). Narrative
 * code reads player.anatomy.penis / .vagina / .size / .genitalSize.sizeCategory;
 * old saves without profile fields get medium defaults. Safe to call
 * repeatedly - existing anatomy is left alone.
 */
function ensurePlayerIntimacyAnatomy(player) {
    if (!player) return;
    if (player.anatomy) return;
    const appearance = (player.appearance && typeof player.appearance === "object") ? player.appearance : {};
    const genderRaw = player.gender || (player.stats && player.stats.gender) || "male";
    const gender = String(genderRaw).toLowerCase();
    const hasPenis = gender === "male" || gender === "non-binary";
    const hasVagina = gender === "female" || gender === "non-binary";

    const penisSize = appearance.penisSize || "medium";
    const vaginaSize = appearance.vaginaSize || "medium";
    const vaginaTightness = { small: "tight", medium: "snug", large: "loose" }[vaginaSize] || "snug";
    const penisDescription = { small: "small penis", medium: "penis", large: "large penis" }[penisSize] || "penis";
    const vaginaDescription = { small: "small vagina", medium: "vagina", large: "loose vagina" }[vaginaSize] || "vagina";

    player.anatomy = {
        species: appearance.species || "human",
        size: "medium", // Human-sized
        genitalSize: {
            sizeCategory: hasPenis ? penisSize : vaginaSize,
            description: "natural proportions",
            status: [],
            health: 100
        }
    };
    if (appearance.skinTone) player.anatomy.skinTone = appearance.skinTone;
    if (hasPenis) {
        player.anatomy.penis = { sizeCategory: penisSize, size: penisSize, description: penisDescription, status: [], health: 100 };
    }
    if (hasVagina) {
        player.anatomy.vagina = { sizeCategory: vaginaSize, size: vaginaTightness, description: vaginaDescription, status: [], health: 100 };
    }
}
window.ensurePlayerIntimacyAnatomy = ensurePlayerIntimacyAnatomy;

function startIntimacyEncounter(npc, player, positionId = null) {
    if (!npc) return false;

    // Materialize player.anatomy from the character-creation profile so
    // size-aware narratives have data to read. No-op if already present.
    ensurePlayerIntimacyAnatomy(player);
    
    // Only initialize if state doesn't already exist
    if (!npc.intimacy) {
        initializeIntimacyState(npc);
    }
    
    // Ensure position object exists
    if (!npc.intimacy.position) {
        npc.intimacy.position = {
            player: DEFAULT_POSITION,
            npc: DEFAULT_POSITION
        };
    }
    
    // Ensure clothing object exists
    if (!npc.intimacy.clothing) {
        npc.intimacy.clothing = {
            player: {},
            npc: {}
        };
    }
    
    // Ensure encounter object exists
    if (!npc.intimacy.encounter) {
        npc.intimacy.encounter = {
            active: false,
            startedAt: null,
            lastActivityAt: null
        };
    }
    
    // Set position
    const pos = positionId || DEFAULT_POSITION;
    npc.intimacy.position.player = pos;
    npc.intimacy.position.npc = pos;

    // Refresh the clothing mirrors from REAL equipment state — clothes may
    // have been dropped to the floor in a previous encounter (and picked
    // back up), or gear changed since. The mirrors are what the act gating
    // reads, so they must match reality at the start of each encounter.
    npc.intimacy.clothing.player = getClothingStateForCharacter(player);
    npc.intimacy.clothing.npc = getClothingStateForCharacter(npc);
    
    // Mark encounter as active
    npc.intimacy.encounter.active = true;
    npc.intimacy.encounter.startedAt = Date.now();
    npc.intimacy.encounter.lastActivityAt = Date.now();
    
    // Set game mode to intimacy
    if (typeof G !== "undefined") {
        G.activeNPCMode = "intimacy";
    }
    
    console.log(`[Intimacy] Started encounter with ${npc.name || 'NPC'} in position: ${pos}`);

    // Prefetch AI-enriched clothing reveal narrations for NPC-targeted
    // clothing actions that are currently available. Non-blocking — the
    // enriched lines land in the cache before the player clicks "Remove".
    if (typeof prefetchClothingReveals === "function") {
        prefetchClothingReveals(npc, player, npc.intimacy);
    }

    return true;
}

/**
 * End an intimate encounter
 */
function endIntimacyEncounter(npc) {
    if (!npc || !npc.intimacy) return false;
    
    // Ensure encounter object exists
    if (!npc.intimacy.encounter) {
        npc.intimacy.encounter = {
            active: false,
            startedAt: null,
            lastActivityAt: null
        };
    }
    
    npc.intimacy.encounter.active = false;
    npc.intimacy.encounter.startedAt = null;
    npc.intimacy.encounter.lastActivityAt = null;

    // Hide the opt-in second portrait with the scene (SFW engine feature,
    // typeof-guarded no-op when the engine doesn't provide it).
    if (typeof window.hideIntimacyPortrait === "function") window.hideIntimacyPortrait();
    
    // Restore left panel to normal state
    if (typeof window.restoreLeftPanelAfterIntimacy === "function") {
        window.restoreLeftPanelAfterIntimacy();
    }
    
    // Stop any NPC-led pleasure loop (engine-side oral/stroke loop)
    if (npc.intimacy.npcPleasureLoop) npc.intimacy.npcPleasureLoop = null;
    
    // Reset penetration state
    npc.intimacy.penetration = { active: false, tool: null, target: null, depth: 0 };
    npc.intimacy.lastPenetration = null;
    npc.intimacy.engagedActs = [];
    
    // Reset encounter tracking flags (impact count, nipple play count, etc.)
    npc.intimacy.encounterFlags = {
        hasAnalPee: false,
        impactCount: 0,
        impactToleranceReached: false,
        nipplePlayCount: 0,
        analEjaculationCount: 0
    };
    
    // Clear last action and history so the next encounter starts fresh
    // (no stale "continue" button or transition narration from a previous session)
    npc.intimacy.lastAction = null;
    npc.intimacy.actionHistory = [];
    npc.intimacy.engagedActs = [];
    
    // Clear sensory fragment anti-repetition tracker and recent scene beats
    if (npc.intimacy._recentNarratives) delete npc.intimacy._recentNarratives;
    if (npc.intimacy._recentScene) delete npc.intimacy._recentScene;
    
    // Clear penetration cache. After a save/load cycle this can be a plain
    // object (JSON has no Map representation), so migrate it instead of
    // calling .clear() — the raw call threw "penetrationCache.clear is not
    // a function" and aborted the rest of the encounter teardown (mode
    // reset and UI restore never ran).
    if (npc.intimacy.penetrationCache) {
        if (npc.intimacy.penetrationCache instanceof Map) {
            npc.intimacy.penetrationCache.clear();
        } else {
            npc.intimacy.penetrationCache = new Map();
        }
    }
    
    // Clear LLM enhancement cache
    clearLLMEnhancementCache(npc.intimacy);
    
    // Reset game mode
    if (typeof G !== "undefined") {
        G.activeNPCMode = null;
        G.activeNPC = null;
    }
    
    // Restore UI state for intimacy mode
    if (typeof document !== "undefined") {
        const roomDescEl = document.getElementById("roomDescEl");
        if (roomDescEl) roomDescEl.style.display = "";
        const narrationEl = document.getElementById("narrationEl");
        if (narrationEl) narrationEl.style.display = "";
        const placeholderEl = document.getElementById("npcPlaceholderEl");
        const detailEl = document.getElementById("npcDetailEl");
        if (placeholderEl) placeholderEl.style.display = "";
        if (detailEl) detailEl.classList.remove("active");
        // Remove position container
        const positionContainer = document.getElementById("intimacyPositionContainer");
        if (positionContainer) positionContainer.remove();
    }
    
    console.log(`[Intimacy] Ended encounter with ${npc.name || 'NPC'}`);
    
    return true;
}

/**
 * Update last activity timestamp
 */
function updateLastActivity(npc) {
    if (!npc || !npc.intimacy) return;
    
    // Ensure encounter object exists
    if (!npc.intimacy.encounter) {
        npc.intimacy.encounter = {
            active: false,
            startedAt: null,
            lastActivityAt: null
        };
    }
    
    npc.intimacy.encounter.lastActivityAt = Date.now();
}

// ============================================================================
// ACTION MENU GENERATION
// ============================================================================

/**
 * Generate valid actions for current state
 */
function generateValidActions(npc, player, positionId = null) {
    if (!npc || !player) return [];
    
    // Always call initializeIntimacyState to ensure all properties exist
    const intimacy = initializeIntimacyState(npc);
    const clothingState = intimacy.clothing;
    const currentPosition = positionId || intimacy.position.player;
    const stage = getIntimacyStage(clothingState);
    
    const validActions = [];
    const actionIds = getAllActIds();

    for (const actId of actionIds) {
        const act = getAct(actId);
        if (!act) continue;
        
        // Full gate pipeline: anatomy (cloaca/tail/hemipenis), gender,
        // demeanor, position, clothing and the disinhibition ladder all
        // live in checkActionValidity. Dominant-mode bypass is decided there
        // (act._dominantBypass) so the menu can draw the red border.
        if (isActionValid(actId, npc, player, currentPosition, clothingState)) {
            // Determine if player is the actor (true) or NPC is the actor (false)
            // playerIsBottom means player is receiving, so NPC is actor
            const isPlayerActor = !act.playerIsBottom;
            
            // For CLOTHING, END, and WATERSPORT actions, skip tool/target
            // accessibility check. Clothing only needs clothing validation.
            // END actions don't need accessibility. Watersports use penis/
            // vagina as tools on body parts that need special validation.
            if (act.type === ACT_TYPES.CLOTHING || act.type === ACT_TYPES.END || act.type === ACT_TYPES.WATERSPORT) {
                validActions.push({ ...act, actId });
            }
            // For actions that work regardless of clothing (reqCloth: ANY), also skip accessibility check
            // This allows "over clothes" actions like grope_breasts_clothed
            else if (act.reqCloth === CLOTHING_REQUIREMENTS.ANY) {
                validActions.push({ ...act, actId });
            }
            // For other actions, check position accessibility for tool-target
            else if (checkToolTargetAccessibility(act.tool, act.target, currentPosition, clothingState, isPlayerActor)) {
                validActions.push({ ...act, actId });
            }
        }
    }
    
    // Add stage-specific filtering first (before categorizing)
    const filteredActions = applyStageFilteringToArray(validActions, stage);

    // Sort actions by category for menu organization
    const categorizedActions = {};
    for (const action of filteredActions) {
        const category = getActionCategory(action.actId);
        if (!categorizedActions[category]) {
            categorizedActions[category] = [];
        }
        categorizedActions[category].push(action);
    }
    
    // Flatten back to array for consistency
    const result = [];
    for (const category in categorizedActions) {
        result.push(...categorizedActions[category]);
    }
    
    return result;
}

/**
 * Check if action is valid (simple boolean version)
 */
function isActionValid(actId, npc, player, positionId, clothingState) {
    const result = checkActionValidity(actId, npc, player, positionId, clothingState);
    return result.valid;
}

/**
 * Per-act disinhibition threshold (0-100) by act type. Acts at/above this
 * threshold require the NPC's per-body-category disinhibition (raised by
 * successfully performing lower-intensity acts in the same category via
 * executeIntimacyAction → applyActDisinhibitionDelta) to have been built up.
 * TEASE/CLOTHING/END acts always return 0 — they are always available and
 * are the acts that build the disinhibition needed to unlock the rest.
 */
/**
 * Per-act disinhibition threshold (0-100) — the natural-progression ladder.
 * The score it is compared against is the NPC's per-body-category
 * disinhibition (npc.memory.actDisinhibition, raised by successfully
 * performing lower-intensity acts in the same category via
 * executeIntimacyAction → applyActDisinhibitionDelta). TEASE acts always
 * return a tier and are how the ladder is climbed.
 *
 * Tease-type acts are not all equal — a kiss and oral sex share the TEASE
 * type — so tease thresholds escalate by target area and tool:
 *   0  — petting (hair/neck-face/body touching), mouth/lips kissing,
 *         and _clothed variants
 *   5  — chest/butt contact
 *   10 — groping (hand on genitals)
 *   15 — fingering (fingers on genitals)
 *   20 — oral (mouth on genitals, or a genital tool on their face)
 * Penetration then escalates by target: deep oral 25, vaginal 30, anal 40.
 * Kink acts gate broadly: impact 50, watersports 60 (highest).
 *
 * Exposure discount (_effectiveActDisinhibitionThreshold): an act whose
 * reqCloth proves the target zone is already bare (top_off/bottom_off/nude)
 * gets EXPOSURE_DISCOUNT off its tier — undressing is itself escalation.
 * Bare-zone kissing/touching becomes available immediately; oral and
 * penetration rungs drop by the same credit.
 */
const TEASE_INTIMATE_TARGETS = ["vagina", "pussy", "clitoris", "clit", "penis", "cock", "dick", "anus", "ass", "groin", "testicles", "balls"];
const TEASE_CHEST_TARGETS = ["breasts", "breast", "nipples", "nipple", "chest", "butt", "buttocks", "rear"];
const TEASE_GENITAL_TOOLS = ["penis", "cock", "dick", "vagina", "pussy"];

function _teaseDisinhibitionThreshold(act) {
    const target = String(act.target || "").toLowerCase();
    const tool = String(act.tool || "").toLowerCase();
    // Over-clothes touching (_clothed variants) is petting-tier: a mild
    // first move while still dressed.
    if (act.id && String(act.id).indexOf("_clothed") !== -1) return 0;
    // A genital tool is intimate contact wherever it lands (e.g. rubbing a
    // cock on their face is not "petting") — tier it with oral.
    if (TEASE_GENITAL_TOOLS.indexOf(tool) !== -1 &&
        (target === "face" || target === "mouth" || target === "lips" || target === "neck")) {
        return 20;
    }
    if (TEASE_INTIMATE_TARGETS.indexOf(target) !== -1) {
        if (tool === "mouth" || tool === "tongue" || tool === "lips") return 20; // oral
        if (tool === "fingers") return 15;                                       // fingering
        return 10;                                                              // groping
    }
    if (TEASE_CHEST_TARGETS.indexOf(target) !== -1) return 5;                    // chest/butt contact
    // Mouth/lips kissing is petting-tier (0), not 5: lips are never
    // clothed, so no exposure discount can ever apply, and the only acts
    // that build the "Mouth & Lips" disinhibition category are the kissing
    // acts themselves — gating them on their own category deadlocks the
    // very first kiss on a fresh NPC.
    return 0;                                                                    // petting/kissing
}

// Penetration ladder: deep oral < vaginal < anal.
function _penetrationDisinhibitionThreshold(act) {
    const target = String(act.target || "").toLowerCase();
    if (target === "vagina" || target === "pussy") return 40;
    if (target === "anus" || target === "ass") return 50;
    if (target === "mouth" || target === "lips") return 25;
    return 35;
}

// Exposure discount: an act whose own clothing requirement proves its target
// zone is already BARE (top_off / bottom_off / nude) has already banked the
// escalation the player invested in undressing. Exposing a body part opens
// its mild acts immediately (touching/kissing an exposed zone -> 0) and
// lowers the sexual rungs (oral, penetration) by the same credit.
const EXPOSURE_DISCOUNT = 10;

function _effectiveActDisinhibitionThreshold(act) {
    if (!act) return 0;
    const tier = _actDisinhibitionThreshold(act);
    if (tier <= 0 || !act.reqCloth) return tier;
    const rc = String(act.reqCloth).toLowerCase();
    if (rc === "top_off" || rc === "bottom_off" || rc === "nude") {
        return Math.max(0, tier - EXPOSURE_DISCOUNT);
    }
    return tier;
}

function _actDisinhibitionThreshold(act) {
    if (!act || !act.type) return 0;
    if (act.type === ACT_TYPES.TEASE) return _teaseDisinhibitionThreshold(act);
    switch (act.type) {
        case ACT_TYPES.PENETRATE:
        case ACT_TYPES.CONTINUE:
            return _penetrationDisinhibitionThreshold(act);
        // Kink acts (impact, watersports) sit at the top of the ladder and
        // gate on BROAD comfort — see checkActionValidity: their own
        // category score cannot build from lower-tier acts, so gating them
        // against it would deadlock. Broad bodily comfort is the gate.
        case ACT_TYPES.IMPACT:
            return 50;
        case ACT_TYPES.WATERSPORT:
            return 60;
        default:
            return 0;
    }
}

// Highest per-category disinhibition the NPC has built anywhere — proxy for
// general bodily comfort (used for WATERSPORT gating).
function _getMaxCategoryDisinhibition(npc) {
    const map = npc && npc.memory && npc.memory.actDisinhibition;
    if (!map || typeof map !== "object") return 0;
    let max = 0;
    for (const key in map) {
        if (!Object.prototype.hasOwnProperty.call(map, key)) continue;
        const v = map[key];
        if (typeof v === "number" && v > max) max = v;
    }
    return max;
}

/**
 * Per-act disinhibition grant delta by act type. Lower-intensity acts grant
 * more (they're how comfort is built); higher-intensity acts still grant a
 * little to keep advancing once unlocked. Returns 0 for acts that don't
 * model the NPC's body comfort (CLOTHING/END).
 */
function _actDisinhibitionGrantDelta(act) {
    if (!act || !act.type) return 0;
    switch (act.type) {
        case ACT_TYPES.TEASE:
            return 5;
        case ACT_TYPES.PENETRATE:
        case ACT_TYPES.CONTINUE:
            return 6;
        case ACT_TYPES.IMPACT:
            return 4;
        case ACT_TYPES.WATERSPORT:
            return 3;
        default:
            return 0;
    }
}

/**
 * Generate wake-up reaction for a sleeping NPC who was disturbed
 * Returns reaction object with narration, reaction type, and whether to end encounter
 */
function generateSleepingWakeUpReaction(npc, player, actId) {
    if (!npc) {
        return { 
            narration: "They wake up!", 
            reaction: "startled", 
            shouldEndEncounter: true 
        };
    }
    
    const act = getAct(actId);
    const actName = act ? act.label || actId : actId;
    const npcName = npc.name || "the NPC";
    const playerName = player.name || "you";
    
    // Determine reaction based on act intensity and NPC personality
    let reactionType = "startled";
    let shouldEnd = true;
    let baseNarration = "";
    
    // Categorize act by intensity
    const isGentleAct = act && (act.type === ACT_TYPES.TEASE || act.type === ACT_TYPES.CLOTHING);
    const isIntimateAct = act && (act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE);
    const isImpactAct = act && act.type === ACT_TYPES.IMPACT;
    
    // Determine NPC disposition
    const favor = npc.memory && typeof npc.memory.favorability === "number" ? npc.memory.favorability : 0;
    const hostility = typeof npc.hostility === "number" ? npc.hostility : 0;
    const disinhibition = npc.intimacy && npc.intimacy.disinhibition ? npc.intimacy.disinhibition : 0;
    
    // Roll for reaction
    const reactionRoll = Math.random();
    
    // Intoxicated NPCs are more disinhibited
    const isIntoxicated = (npc.intimacy && npc.intimacy.encounter && npc.intimacy.encounter._isIntoxicated) || 
                         (typeof getDrunkTier === "function" ? getDrunkTier(npc) >= 2 : false);
    
    // Determine if NPC goes with it or resists
    const goWithItChance = Math.min(0.9, 0.1 + (favor / 200) + (disinhibition / 200) + (isIntoxicated ? 0.3 : 0));
    const goesWithIt = reactionRoll < goWithItChance;
    
    if (isGentleAct) {
        if (goesWithIt) {
            reactionType = "accepting";
            shouldEnd = false;
            baseNarration = `${npcName} stirs and mumbles sleepily, but doesn't fully wake. Their eyes flutter as ${playerName} ${actName.toLowerCase()}, a small smile playing on their lips.`;
        } else {
            reactionType = favor > 30 ? "surprised" : "annoyed";
            shouldEnd = true;
            baseNarration = `${npcName} wakes with a start, blinking in confusion. "W-what are you...?" They ${favor > 30 ? "rub their eyes" : "pull away"}, ${favor > 50 ? "smiling" : favor > 0 ? "frowning" : "glancing around angrily"}.`;
        }
    } else if (isIntimateAct) {
        if (goesWithIt) {
            reactionType = "aroused";
            shouldEnd = false;
            baseNarration = `${npcName} gasps as they wake, their body responding before their mind catches up. "Mmm..." they murmur, arching into ${playerName}'s touch, their sleep-addled mind slow to protest.`;
        } else {
            reactionType = hostility > 50 ? "angry" : favor > 20 ? "shocked" : "furious";
            shouldEnd = true;
            baseNarration = `${npcName} wakes with a shout, pushing ${playerName} away! "Get off!" They scramble back, ${hostility > 50 ? "drawing a weapon" : favor > 20 ? "looking startled" : "eyes wide with outrage"}.`;
        }
    } else if (isImpactAct) {
        reactionType = Math.random() < 0.8 ? "angry" : "shocked";
        shouldEnd = true;
        baseNarration = `${npcName} jolts awake with a cry! "Ow! What the-?" They ${reactionType === "angry" ? "leap to their feet, ready to fight" : "stare in disbelief"} at ${playerName}.`;
    } else {
        reactionType = goesWithIt ? "accepting" : "startled";
        shouldEnd = !goesWithIt;
        baseNarration = `${npcName} wakes up, ${goesWithIt ? "yawning and stretching" : "bolting upright"} as ${playerName} ${actName.toLowerCase()}.`;
    }
    
    // Add flavor based on intoxication
    if (isIntoxicated) {
        baseNarration = baseNarration.replace("wakes", "groggily stirs").replace("wake", "stir");
        if (goesWithIt) {
            baseNarration += " Their drunk haze makes them slow to realize what's happening.";
        } else {
            baseNarration += " Even through their drunk fog, they sense something is wrong.";
        }
    }
    
    return {
        narration: baseNarration,
        reaction: reactionType,
        shouldEndEncounter: shouldEnd
    };
}

/**
 * Check if action is valid and return reason if not
 * Returns { valid: boolean, reason?: string } for an action
 */
/**
 * True while the engine-side NPC-led pleasure loop is running (she is
 * servicing the player beat after beat, aiming for his ejaculation).
 */
function _npcPleasureLoopActive(npc) {
    var loop = npc && npc.intimacy && npc.intimacy.npcPleasureLoop;
    return !!(loop && loop.active);
}

/**
 * True while the pleasure loop is servicing the player with her mouth —
 * his penis is in her mouth for climax-act gating purposes even though
 * the receive acts never set the penetration state.
 */
function _npcPleasureLoopMouthActive(npc) {
    var loop = npc && npc.intimacy && npc.intimacy.npcPleasureLoop;
    if (!loop || !loop.active) return false;
    return ["suck_player_penis", "deepthroat_player_penis", "self_deepthroat", "suck_player_balls"]
        .indexOf(String(loop.actId || "")) !== -1;
}

function _playerPussyOralActive(npc) {
    var la = npc && npc.intimacy && npc.intimacy.lastAction;
    return !!(la && ["lick_player_pussy", "suck_player_clit"].indexOf(String(la.actId || "")) !== -1);
}

/**
 * Whether the dominant-mode bypass is active for this NPC: gates
 * (disinhibition, arousal consent, requiresConsent, lube) do not hide the
 * act; it is offered with a red border instead (act._dominantBypass).
 * Unconscious / sleeping / surrendered / bound NPCs default to dominant.
 */
function _dominantBypassActive(npc) {
    if (!npc) return false;
    var isUnconscious = (typeof window.isNPCUnconscious === "function" && window.isNPCUnconscious(npc)) ||
        (npc.bodyState === "unconscious" || npc.isUnconsciousBody === true || npc.unconscious === true);
    var isSleeping = (typeof window.isNPCSleeping === "function" && window.isNPCSleeping(npc)) ||
        (npc.currentState && npc.currentState.sleeping);
    var demeanor = (npc.intimacy && npc.intimacy._demeanorMode)
        ? String(npc.intimacy._demeanorMode).toLowerCase()
        : ((isUnconscious || isSleeping || npc.surrendered || npc.bound) ? "dominant" : "consentual");
    return demeanor === "dominant";
}

/**
 * True when the NPC cannot speak or react consciously — unconscious or
 * fast asleep. All verbal NPC output (dialogue, moans, requests, demands)
 * is suppressed while this is true; only involuntary physical reflexes
 * may be narrated.
 */
function npcCannotSpeak(npc) {
    if (!npc) return false;
    if (typeof window.isNPCUnconscious === "function" && window.isNPCUnconscious(npc)) return true;
    if (npc.bodyState === "unconscious" || npc.isUnconsciousBody === true || npc.unconscious === true) return true;
    if (typeof window.isNPCSleeping === "function" && window.isNPCSleeping(npc)) return true;
    if (npc.currentState && npc.currentState.sleeping === true) return true;
    return false;
}

/**
 * Unwrap <...> speech markers to plain narration. Used for NPCs who cannot
 * speak: the display layer turns <...> into quoted dialogue, so reflexive
 * reaction lines must have their brackets stripped to stay non-verbal.
 */
function stripSpeechFromText(text) {
    if (!text || typeof text !== "string") return text;
    return text.replace(/<([^>]*)>/g, "$1").replace(/<|>/g, "");
}

function checkActionValidity(actId, npc, player, positionId, clothingState) {
    const act = getAct(actId);
    if (!act) return { valid: false, reason: "unknown action" };
    // Reset the dominant-bypass marker each evaluation: it is set below by
    // whichever gate (disinhibition/arousal/consent/lube) the dominant-mode
    // bypass actually skipped, and read by the menu for the red border.
    // Resetting keeps it fresh instead of leaking across turns or modes.
    act._dominantBypass = false;

    // UNCONSCIOUS ACTION CHECK
    // Check if NPC is unconscious
    const isUnconscious = (typeof window.isNPCUnconscious === "function" && window.isNPCUnconscious(npc)) ||
                       (npc && (npc.bodyState === "unconscious" || npc.isUnconsciousBody === true || npc.unconscious === true));
    
    // Check if NPC is sleeping
    const isSleeping = (typeof window.isNPCSleeping === "function" && window.isNPCSleeping(npc)) ||
                     (npc && npc.currentState && npc.currentState.sleeping);
    
    // If this is an unconscious-only action, verify the NPC is unconscious
    if (act.unconsciousOnly === true) {
        if (!isUnconscious) {
            return { valid: false, reason: "not unconscious", hidden: true };
        }
    }
    
    // If NPC is unconscious or sleeping, hide all NPC-actor actions (playerIsBottom: true)
    // since the unconscious/sleeping NPC cannot participate or respond
    if ((isUnconscious || isSleeping) && act.playerIsBottom === true) {
        return { valid: false, reason: isUnconscious ? "NPC is unconscious" : "NPC is sleeping", hidden: true };
    }
    
    // For unconscious NPCs: allow ALL player-actor actions (they can't resist)
    // For sleeping NPCs: allow all player-actor actions too (they can't resist while asleep)
    // Only filter by position and clothing requirements below
    if (isUnconscious || isSleeping) {
        // No additional filtering for unconscious/sleeping - all player actions are allowed
        // Position and clothing checks still apply below
    } else if ((npc.intimacy && npc.intimacy.encounter && npc.intimacy.encounter.isSleepingEncounter === true)) {
        // SLEEPING ACTION CHECK (legacy - for a sleeping-encounter NPC that
        // is asleep but not flagged unconscious). This must NOT run for
        // ordinary awake NPCs: it previously sat in the plain else branch
        // and rejected every non-sleepingSafe act ("act not safe for
        // sleeping NPC") for fully awake partners, deadlocking the ladder.
        const intimacyState = npc.intimacy || {};
        const encounter = intimacyState.encounter || {};
        const isIntoxicated = encounter._isIntoxicated === true;
        const isExhausted = encounter._isExhausted === true;
        
        // For player-actor actions on sleeping NPCs:
        // - If act is marked as safe for sleeping (sleepingSafe: true), allow it
        // - If NPC is intoxicated, allow all player-actor actions (lower inhibition)
        // - If NPC is exhausted, allow all player-actor actions (treats like unconscious initially)
        // - Otherwise, only allow sleeping-safe acts
        if (act.sleepingSafe !== true && !isIntoxicated && !isExhausted) {
            return { valid: false, reason: "act not safe for sleeping NPC", hidden: true };
        }
    }

    // Demeanor mode check - actions with requiresDemeanorMode only appear in that demeanor
    if (act.requiresDemeanorMode) {
        // Default to dominant for unconscious/sleeping/surrendered/bound NPCs
        const isUnconscious = (typeof window.isNPCUnconscious === "function" && window.isNPCUnconscious(npc)) ||
                           (npc && (npc.bodyState === "unconscious" || npc.isUnconsciousBody === true || npc.unconscious === true));
        const isSleeping = (typeof window.isNPCSleeping === "function" && window.isNPCSleeping(npc)) ||
                         (npc && npc.currentState && npc.currentState.sleeping);
        const isSurrenderedOrBound = npc && (npc.surrendered || npc.bound);
        const defaultDemeanor = (isUnconscious || isSleeping || isSurrenderedOrBound) ? "dominant" : "consentual";
        const demeanorMode = (npc.intimacy && npc.intimacy._demeanorMode) ? String(npc.intimacy._demeanorMode).toLowerCase() : defaultDemeanor;
        const allowedModes = Array.isArray(act.requiresDemeanorMode) ? act.requiresDemeanorMode.map(m => String(m).toLowerCase()) : [String(act.requiresDemeanorMode).toLowerCase()];
        if (!allowedModes.includes(demeanorMode)) {
            return { valid: false, reason: "wrong demeanor mode", hidden: true };
        }
    }

    // Cloaca-bearing NPC checks — these must run before clothing/position
    // checks so hidden actions never surface as disabled entries (which
    // would keep their category heading alive in the menu).

    // Cloaca-bearing NPCs have no external testes, so actions targeting
    // the NPC's testicles are hidden entirely.
    if (npcHasCloacaFlag(npc) && act.target === "testicles" && act.requiresNpcMale) {
        return { valid: false, reason: "no external testes (cloaca)", hidden: true };
    }

    // Tail-targeted acts (caress/pull tail) require a tailed species
    // (Dragonborn, Lizardfolk, Kobold). Hidden entirely — not disabled — so
    // the Tail category heading never surfaces for tailless NPCs.
    if (act.requiresNpcTail && !hasNPCTail(npc)) {
        return { valid: false, reason: "no tail", hidden: true };
    }

    // Cloaca-specific acts require NPC to have cloaca
    if (act.requiresNpcCloaca && !npcHasCloacaFlag(npc)) {
        return { valid: false, reason: "no cloaca", hidden: true };
    }

    // Cloaca-bearing NPCs have a single cloacal vent instead of separate
    // vaginal and anal openings. Vaginal/clitoral actions are hidden — the
    // Cloaca (formerly Anus) category with cloaca relabelling handles it.
    // Player-owned vaginal actions (playerIsBottom) and the player self-climax
    // (female_ejaculate) are kept, since the player's anatomy is unaffected.
    if (npcHasCloacaFlag(npc) && !act.playerIsBottom && act.id !== "female_ejaculate" &&
        (act.target === "vagina" || act.target === "pussy" || act.target === "clitoris")) {
        return { valid: false, reason: "cloaca replaces vagina", hidden: true };
    }

    // Player-anatomy gate (hard, hidden): when the player is the actor the
    // act's TOOL is the player's body part; when receiving (playerIsBottom)
    // the TARGET is the player's body part. Either way the player must
    // actually have that anatomy — the guarantee behind "tools reflect the
    // player's anatomy" (no "impale your cloaca" for a player with none).
    // Runs before position/clothing so an anatomy mismatch always hides.
    if (player) {
        if (typeof ensurePlayerIntimacyAnatomy === "function") ensurePlayerIntimacyAnatomy(player);
        const pAnat = player.anatomy || {};
        const playerPart = String(act.playerIsBottom === true ? act.target : act.tool || "").toLowerCase();
        if (["penis", "cock", "dick"].indexOf(playerPart) !== -1 && !pAnat.penis) {
            return { valid: false, reason: "player has no penis", hidden: true };
        }
        if (["vagina", "pussy"].indexOf(playerPart) !== -1 && !pAnat.vagina) {
            return { valid: false, reason: "player has no vagina", hidden: true };
        }
    }

    // Check position requirement
    // Clothing (undressing) acts are exempt from the position requirement:
    // valid in every position while the relevant item is still worn (the
    // reqCloth / worn checks below enforce that).
    if (act.type !== ACT_TYPES.CLOTHING && act.pos && act.pos.length > 0 && !act.pos.includes(positionId)) {
        return { valid: false, reason: "no position" };
    }
    
    // Check clothing requirement
    if (act.reqCloth) {
        const targetOverride = act.type === ACT_TYPES.CLOTHING ? act.target : null;
        if (!checkClothingRequirement(act.reqCloth, clothingState, act.playerIsBottom, targetOverride)) {
            return { valid: false, reason: "clothed" };
        }
    }
    
    // Check clothing for clothing actions
    if (act.type === ACT_TYPES.CLOTHING) {
        if (act.id === "undress_player" || act.id === "undress_npc" || act.clothingItem || act.clothingAction) {
            const targetIsPlayer = act.target === "player";
            const targetKey = targetIsPlayer ? "player" : "npc";
            if (clothingState && clothingState[targetKey]) {
                const targetClothing = clothingState[targetKey];
                if (act.id === "undress_player" || act.id === "undress_npc") {
                    if (!targetClothing.top && !targetClothing.bottom && !targetClothing.undergarments) {
                        return { valid: false, reason: "already nude" };
                    }
                } else if (act.clothingItem) {
                    if (!targetClothing[act.clothingItem]) {
                        return { valid: false, reason: "not worn" };
                    }
                }
            }
        }
    }
    
    // Check "over clothes" actions: hide them when the clothing covering the
    // target body part has been removed. e.g. grope_breasts_clothed should be
    // hidden once the top is off (use grope_breasts instead); squeeze_butt_clothed
    // should be hidden once the bottom is off.
    if (act.id && act.id.includes("_clothed")) {
        const isPlayerTarget = act.target === "player" || act.playerIsBottom === false;
        const targetKey = isPlayerTarget ? "player" : "npc";
        const targetClothing = clothingState && clothingState[targetKey];
        if (targetClothing) {
            // Fully nude — hide all _clothed actions
            if (!targetClothing.top && !targetClothing.bottom && !targetClothing.undergarments) {
                return { valid: false, reason: "clothed" };
            }
            // Target-specific check: if the clothing item covering the target
            // body part is off, the _clothed action is redundant
            var targetLower = String(act.target || "").toLowerCase();
            if ((targetLower === "breasts" || targetLower === "chest") && !targetClothing.top) {
                return { valid: false, reason: "clothed" };
            }
            if ((targetLower === "butt" || targetLower === "buttocks" || targetLower === "ass") && !targetClothing.bottom) {
                return { valid: false, reason: "clothed" };
            }
            if ((targetLower === "groin" || targetLower === "vagina" || targetLower === "pussy" || targetLower === "penis" || targetLower === "cock") && !targetClothing.bottom) {
                return { valid: false, reason: "clothed" };
            }
        }
    }
    
    // Check gender requirements
    if (act.maleOnly || act.femaleOnly || act.requiresNpcMale || act.requiresNpcFemale || act.requiresActorMale || act.requiresActorFemale || act.requiresPlayerMale || act.requiresPlayerFemale) {
        const playerGender = getPlayerGenderForGates(player);
        const npcGenderRaw = npc.gender || "female";
        const actorIsPlayer = !act.playerIsBottom;
        
        if (act.maleOnly) {
            if (actorIsPlayer && !playerGateMale(playerGender)) return { valid: false, reason: "wrong gender" };
            if (!actorIsPlayer && !isGenderMale(npcGenderRaw)) return { valid: false, reason: "wrong gender" };
        }
        if (act.femaleOnly) {
            if (actorIsPlayer && !playerGateFemale(playerGender)) return { valid: false, reason: "wrong gender" };
            if (!actorIsPlayer && !isGenderFemale(npcGenderRaw)) return { valid: false, reason: "wrong gender" };
        }
        if (act.requiresActorMale) {
            if (actorIsPlayer && !playerGateMale(playerGender)) return { valid: false, reason: "wrong gender" };
            if (!actorIsPlayer && !isGenderMale(npcGenderRaw)) return { valid: false, reason: "wrong gender" };
        }
        if (act.requiresActorFemale) {
            if (actorIsPlayer && !playerGateFemale(playerGender)) return { valid: false, reason: "wrong gender" };
            if (!actorIsPlayer && !isGenderFemale(npcGenderRaw)) return { valid: false, reason: "wrong gender" };
        }
        if (act.requiresNpcMale && !isGenderMale(npcGenderRaw)) return { valid: false, reason: "wrong gender" };
        if (act.requiresNpcFemale && !isGenderFemale(npcGenderRaw)) return { valid: false, reason: "wrong gender" };
        if (act.requiresPlayerMale && !playerGateMale(playerGender)) return { valid: false, reason: "wrong gender" };
        if (act.requiresPlayerFemale && !playerGateFemale(playerGender)) return { valid: false, reason: "wrong gender" };
    }

    // Check prior actions
    if (act.requiresPrior && act.requiresPrior.length > 0) {
        const intimacy = npc && npc.intimacy;
        const actionHistory = intimacy && intimacy.actionHistory ? intimacy.actionHistory : [];
        const hasPriorAction = act.requiresPrior.some(priorActId => {
            return actionHistory.some(historyEntry => historyEntry.actId === priorActId);
        });
        if (!hasPriorAction) {
            return { valid: false, reason: "prior required" };
        }
    }

    // Check penetration conflict: cannot start penetration in different orifice without pulling out first
    // Climax acts (triggersClimax) are exempt: they are release beats,
    // not tool insertions — their tool/target are narrative labels.
    if ((act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE) && !act.triggersClimax) {
        const intimacy = npc && npc.intimacy;
        if (intimacy && intimacy.penetration && intimacy.penetration.active) {
            const currentTarget = intimacy.penetration.target;
            const currentTool = intimacy.penetration.tool;
            const newTarget = act.target;
            const newTool = act.tool;

            // Switching to a different orifice is allowed — handlePenetrationAction
            // auto-pulls-out of the current orifice (with narration) before the
            // new penetration starts. Compatible transitions (vagina <-> clit,
            // anus <-> ass, mouth <-> lips) need no pull-out.

            // If the same tool is penetrating but the new act uses a different
            // tool for the same target, block it (e.g. penis is in vagina,
            // can't switch to fingers without pulling out first).
            if (currentTool && newTool && currentTool !== newTool && currentTarget === newTarget) {
                return { valid: false, reason: "pull out first" };
            }
        }
    }

    // ── CONSENT GATE ─────────────────────────────────────────────
    // Disinhibition is long-term comfort; arousal is in-the-moment
    // willingness. Intercourse needs BOTH: a freshly stripped NPC cannot
    // be penetrated seconds later no matter how much skin is showing.
    // Her arousal is built by the consent-hint beats and foreplay acts.
    // Consent gate: vaginal penetration requires NPC arousal
    // Anal penetration only requires lube (not arousal)
    if (!act.playerIsBottom && act.type === ACT_TYPES.PENETRATE) {
        var _cgTarget = String(act.target || "").toLowerCase();
        if (_cgTarget === "vagina" || _cgTarget === "pussy") {
            var _cgArousal = (npc && npc.intimacy && npc.intimacy.arousal) ? npc.intimacy.arousal.npc : 0;
            if (_cgArousal < NPC_CONSENT_AROUSAL) {
                // Dominant mode (and non-resisting NPCs, whose default
                // demeanor is dominant) bypasses the arousal gate too — the
                // act is offered with a red border instead of being hidden,
                // mirroring the disinhibition bypass further up.
                if (_dominantBypassActive(npc)) {
                    act._dominantBypass = true; // red border: bypassing arousal readiness
                } else {
                    return { valid: false, reason: "not aroused enough" };
                }
            }
        }
        // Note: anus/ass penetration is NOT gated by arousal - only by lube
    }

    // ── PENETRATION GATING ───────────────────────────────────────
    // Gate penetration-related actions based on the current penetration state:
    // 1. CONTINUE actions require an active penetration of the same target+tool
    // 2. PENETRATE (enter) actions are blocked if that tool is already penetrating
    // 3. Non-penetrative actions using the penis are blocked while the penis
    //    is penetrating (fingers/tongue/mouth remain free)
    var _intimacy = npc && npc.intimacy;
    if (_intimacy && _intimacy.penetration && _intimacy.penetration.active) {
        var _penTool = _intimacy.penetration.tool;
        var _penTarget = _intimacy.penetration.target;

        // 1. CONTINUE actions: must match the current penetration target+tool
        //    Climax acts are exempt (release beats, see above).
        if (act.type === ACT_TYPES.CONTINUE && !act.triggersClimax) {
            if (act.target !== _penTarget && act.tool !== _penTool) {
                return { valid: false, reason: "not penetrating this" };
            }
            // Also check tool match — can't thrust with penis if fingers are in
            if (act.tool === _penTool && act.target !== _penTarget) {
                return { valid: false, reason: "wrong orifice" };
            }
        }


        // 2. PENETRATE (enter) actions: blocked if same tool+target already active
        //    (you're already inside — use continue actions instead)
        if (act.type === ACT_TYPES.PENETRATE) {
            if (act.tool === _penTool && act.target === _penTarget) {
                return { valid: false, reason: "already inside" };
            }
        }

        // 3. Non-penetrative actions using the penis are blocked while penis
        //    is penetrating. Fingers, tongue, mouth, hand remain free.
        if (act.type !== ACT_TYPES.CONTINUE && act.type !== ACT_TYPES.END &&
            act.type !== ACT_TYPES.CLOTHING && act.type !== ACT_TYPES.WATERSPORT) {
            if (act.tool === "penis" && _penTool === "penis") {
                // The penis is busy penetrating — block non-penetration uses of it
                // unless it's targeting the same orifice (which would be a continue,
                // already handled above).
                if (act.target !== _penTarget) {
                    return { valid: false, reason: "tool in use" };
                }
            }
        }
    } else {
        // No active penetration: CONTINUE actions are not available.
        // External climax acts (ejaculate_on_*, consequence "external_semen")
        // are exempt — they are release beats performed right after pulling
        // out, when penetration is deliberately no longer active.
        if (act.type === ACT_TYPES.CONTINUE && act.consequence !== "external_semen" &&
            // Loop-routed climax acts are the release beat of the NPC-led
            // pleasure loop: valid without the penetration state that the
            // receive acts never set (external_semen is already exempt).
            // The female player's climax acts are release beats too:
            // Succumb works in any context, and Squirt is valid while
            // the NPC's mouth is on her pussy even without penetration.
            !(act.triggersClimax && (_npcPleasureLoopActive(npc) ||
                actId === "player_orgasm" ||
                (actId === "female_ejaculate" && _playerPussyOralActive(npc))))) {
            return { valid: false, reason: "not penetrated" };
        }
    }

    // Check END actions - must match corresponding start/continue action from lastAction
    if (act.type === ACT_TYPES.END) {
        const intimacy = npc && npc.intimacy;
        const lastAction = intimacy && intimacy.lastAction ? intimacy.lastAction.actId : null;

        // Generic pull-out: only valid when penetration is active
        if (actId === "pull_out_generic") {
            if (intimacy && intimacy.penetration && intimacy.penetration.active) {
                return { valid: true };
            }
            return { valid: false, reason: "not penetrating" };
        }

        // Pull-out END actions for the penis are valid whenever penis
        // penetration is active, even after a climax action (e.g.
        // ejaculate_in_vagina) set lastAction to a value not in
        // END_ACTION_MAPPING. The real precondition for pulling out is
        // "currently penetrating with the penis", not "last action was a
        // thrust". Fingering end actions stay gated by lastAction below.
        var PENIS_PULL_OUT_END_ACTIONS = ["pull_out", "pull_off", "pull_out_of_mouth"];
        if (PENIS_PULL_OUT_END_ACTIONS.indexOf(actId) !== -1) {
            if (intimacy && intimacy.penetration && intimacy.penetration.active &&
                intimacy.penetration.tool === "penis") {
                return { valid: true };
            }
        }

        if (!lastAction) {
            // No prior action, only allow generic end actions
            if (actId !== "stop" && actId !== "pause") {
                return { valid: false, reason: "no active action" };
            }
        } else {
            // Define mapping of END actions to their corresponding start/continue actions
            const END_ACTION_MAPPING = {
                // Fingering end actions (vaginal and anal)
                stop_fingering: ["finger_pussy", "finger_pussy_fast", "enter_pussy_finger", "finger_anus", "finger_anus_fast", "enter_anus_finger"],
                pull_off_of_finger: ["finger_pussy", "finger_pussy_fast", "enter_pussy_finger", "finger_anus", "finger_anus_fast", "enter_anus_finger"],
                
                // Vaginal/Anal penetration end actions
                pull_out: ["enter_pussy", "thrust_pussy", "enter_anus", "thrust_anus"],
                pull_off: ["enter_pussy", "thrust_pussy", "enter_anus", "thrust_anus"],
                
                // Hand job end actions
                release_cock: ["stroke_penis", "grip_penis"],
                
                // Oral end actions
                pull_out_of_mouth: ["deepthroat_penis", "suck_penis", "fuck_mouth", "deepthroat_penis_player", "accept_penis_mouth"]
            };
            
            const requiredStartActions = END_ACTION_MAPPING[actId];
            if (requiredStartActions && !requiredStartActions.includes(lastAction)) {
                return { valid: false, reason: "no active action" };
            }
        }
    }
    
    // Check lube - now checks per-body-part lube
    if (act.requiresLube) {
        const intimacy = npc && npc.intimacy;
        if (!intimacy || !intimacy.lube) {
            if (_dominantBypassActive(npc)) {
                act._dominantBypass = true; // red border: bypassing lube requirement
            } else {
                return { valid: false, reason: "no lube" };
            }
        }
        
        // Map action target to lube body part
        const target = act.target || "";
        const actIdLower = (act.id || "").toLowerCase();
        let lubePart = "general";
        
        if (target === "vagina" || target === "pussy" || target === "clitoris" ||
            actIdLower.includes("pussy") || actIdLower.includes("vagina") || actIdLower.includes("clitoris") ||
            actIdLower.includes("clit") || actIdLower.includes("fold")) {
            lubePart = "vagina";
        } else if (target === "anus" || target === "buttocks" || target === "butt" || target === "ass" ||
                   actIdLower.includes("anal") || actIdLower.includes("anus") || actIdLower.includes("butt") || actIdLower.includes("ass")) {
            lubePart = "anus";
        } else if (target === "mouth" || target === "lips" || target === "face" ||
                   actIdLower.includes("mouth") || actIdLower.includes("oral") || actIdLower.includes("kiss")) {
            lubePart = "mouth";
        }
        
        const partLube = intimacy.lube[lubePart];
        if (!partLube || !partLube.hasLube) {
            if (_dominantBypassActive(npc)) {
                act._dominantBypass = true; // red border: bypassing lube requirement
            } else {
                return { valid: false, reason: "no lube" };
            }
        }
        
        // Also update legacy flag for backwards compatibility
        intimacy.hasLube = true;
    }
    
    // Check climax context: climax actions should only be available when appropriate
    if (act.triggersClimax) {
        const intimacy = npc && npc.intimacy;
        if (!intimacy) return { valid: true }; // Can't validate, allow
        
        const currentPenetration = intimacy.penetration || {};
        const playerGender = getPlayerGenderForGates(player);
        const npcGender = (npc.gender || "female").toLowerCase();
        
        // For internal ejaculation (inside vagina/anus/mouth), player must be:
        // 1. Male
        // 2. Currently penetrating that specific body part with their penis
        if (actId === "ejaculate_in_vagina") {
            if (!playerGateMale(playerGender)) {
                return { valid: false, reason: "wrong gender" };
            }
            // Must be penetrating vagina with penis (player -> NPC)
            if (!currentPenetration.active || currentPenetration.target !== "vagina" || currentPenetration.tool !== "penis") {
                return { valid: false, reason: "no access" };
            }
        }
        
        if (actId === "ejaculate_in_anus") {
            if (!playerGateMale(playerGender)) {
                return { valid: false, reason: "wrong gender" };
            }
            // Must be penetrating anus with penis (player -> NPC)
            if (!currentPenetration.active || currentPenetration.target !== "anus" || currentPenetration.tool !== "penis") {
                return { valid: false, reason: "no access" };
            }
        }
        
        if (actId === "ejaculate_in_mouth") {
            if (!playerGateMale(playerGender)) {
                return { valid: false, reason: "wrong gender" };
            }
            // Must be penetrating mouth with penis (player -> NPC mouth)
            // Or NPC is penetrating player's mouth with their mouth (receiving oral)
            const validMouthPenetration = currentPenetration.active && 
                ((currentPenetration.target === "mouth" && currentPenetration.tool === "penis") ||
                 (currentPenetration.target === "penis" && currentPenetration.tool === "mouth")) ||
                // NPC-led pleasure loop: her mouth is on his cock.
                _npcPleasureLoopMouthActive(npc);
            if (!validMouthPenetration) {
                return { valid: false, reason: "no access" };
            }
        }
        
        // For female ejaculation (squirting), player must be:
        // 1. Female
        // 2. Receiving vaginal penetration or penetrating with vagina
        if (actId === "female_ejaculate") {
            if (!playerGateFemale(playerGender)) {
                return { valid: false, reason: "wrong gender" };
            }
            // Player can squirt if:
            // - Player's vagina is being penetrated (playerIsBottom, target=vagina)
            // - Player is penetrating with vagina (tool=vagina)
            // - The NPC's mouth is on the player's pussy (receiving oral —
            //   receive acts never set penetration state)
            const validVaginalContext =
                (currentPenetration.active &&
                    ((currentPenetration.target === "vagina" && currentPenetration.playerIsBottom) ||
                     (currentPenetration.tool === "vagina"))) ||
                _playerPussyOralActive(npc);
            if (!validVaginalContext) {
                return { valid: false, reason: "no access" };
            }
        }
        
        // For external ejaculation (on body parts), player must be male
        if (actId.startsWith("ejaculate_on_")) {
            if (!playerGateMale(playerGender)) {
                return { valid: false, reason: "wrong gender" };
            }
            // These are always available for males, regardless of penetration state
            // The position will determine where the ejaculation lands
        }
        
        // Mutual climax can happen in any penetration context
        if (actId === "mutual_climax") {
            // Both must be in a state where climax is possible
            if (!currentPenetration.active) {
                return { valid: false, reason: "no access" };
            }
        }
    }
    
    // Check consent
    if (act.requiresConsent) {
        const npcAttraction = (npc.memory && npc.memory.attraction) || 0;
        const npcLust = (npc.memory && npc.memory.lust) || 0;
        if (npcAttraction < 50 || npcLust < 30) {
            // Dominant mode (and non-resisting NPCs, whose default demeanor
            // is dominant) bypasses the consent gate — the act shows with a
            // red border instead of being hidden, mirroring the arousal and
            // disinhibition bypasses.
            if (_dominantBypassActive(npc)) {
                act._dominantBypass = true; // red border: bypassing consent
            } else {
                return { valid: false, reason: "no consent" };
            }
        }
    }
    
    // Check tool/target accessibility for non-clothing, non-END, non-ANY, non-WATERSPORT actions
    const isPlayerActor = !act.playerIsBottom;
    // Climax acts whose tool/target are narrative labels (the player's own
    // orgasm, or a shared body climax) skip contact-accessibility: their
    // climax-section gates define validity. Male ejaculation acts keep it.
    var _isNarrativeClimaxAct = ["player_orgasm", "female_ejaculate", "mutual_climax"].indexOf(actId) !== -1;
    if (act.type !== ACT_TYPES.CLOTHING && act.type !== ACT_TYPES.END && act.type !== ACT_TYPES.WATERSPORT && act.reqCloth !== CLOTHING_REQUIREMENTS.ANY && !_isNarrativeClimaxAct) {
        if (!checkToolTargetAccessibility(act.tool, act.target, positionId, clothingState, isPlayerActor)) {
            return { valid: false, reason: "no access" };
        }
    }

    // ── PER-ACT DISINHIBITION GATING ───────────────────────────
    // The NPC's comfort with escalating acts on their body, tracked per body
    // category in npc.memory.actDisinhibition. Only gates acts where the
    // player is the actor (the NPC is the target): "Receive" acts (NPC acting
    // on the player) are not gated by the NPC's own body disinhibition. The
    // threshold comes from the act type; the current score is read via the
    // SFW-side getActDisinhibition helper (exposed on window). Lower-intensity
    // acts (TEASE) have threshold 0 and raise the score, so repeated teasing
    // in a category progressively unlocks penetration/impact there.
    if (isPlayerActor) {
        // Exposure-aware tier (see _effectiveActDisinhibitionThreshold): acts
        // on an already-bare zone get the undressing credited against the
        // ladder.
        var _disinhibThreshold = _effectiveActDisinhibitionThreshold(act);
        
        // Get current demeanor mode - default to dominant for unconscious/sleeping/surrendered/bound
        const isUnconscious = (typeof window.isNPCUnconscious === "function" && window.isNPCUnconscious(npc)) ||
                           (npc && (npc.bodyState === "unconscious" || npc.isUnconsciousBody === true || npc.unconscious === true));
        const isSleeping = (typeof window.isNPCSleeping === "function" && window.isNPCSleeping(npc)) ||
                         (npc && npc.currentState && npc.currentState.sleeping);
        const isSurrenderedOrBound = npc && (npc.surrendered || npc.bound);
        const demeanorMode = (npc.intimacy && npc.intimacy._demeanorMode) 
            ? String(npc.intimacy._demeanorMode).toLowerCase() 
            : ((isUnconscious || isSleeping || isSurrenderedOrBound) ? "dominant" : "consentual");
        
        // A collared slave (npc.enslaved) or a bound captive does as they
        // are told: the disinhibition ladder does not gate commanded acts.
        // DOMINANT MODE: Player in dominant demeanor can do whatever they want
        // to the NPC - all disinhibition-gated acts are unlocked with red border
        // For unconscious/sleeping/surrendered/bound NPCs, always use dominant mode
        if (npc && (npc.enslaved || (npc.bound && npc.surrendered) || demeanorMode === "dominant" || isUnconscious || isSleeping || isSurrenderedOrBound)) {
            // Bypass disinhibition gating but mark the action as bypassed for red border
            if (demeanorMode === "dominant" && _disinhibThreshold > 0) {
                // Mark this action as dominant-bypass in the act object for later use
                act._dominantBypass = true;
            }
            _disinhibThreshold = 0;
        }
        
        if (_disinhibThreshold > 0 && typeof window !== "undefined" &&
            typeof window.getActDisinhibition === "function" &&
            typeof window.getActionCategory === "function") {
            if (act.type === ACT_TYPES.WATERSPORT || act.type === ACT_TYPES.IMPACT) {
                // Kink acts gate on broad comfort: their own category score
                // cannot build from lower-tier acts, so the effective score
                // is the higher of their own category (impact play already
                // done) and the NPC's most-developed body category.
                var _kinkCatKey = window.getActionCategory(actId, npc);
                var _ownScore = (_kinkCatKey && _kinkCatKey !== "Other")
                    ? window.getActDisinhibition(npc, _kinkCatKey)
                    : 0;
                if (Math.max(_ownScore, _getMaxCategoryDisinhibition(npc)) < _disinhibThreshold) {
                    return { valid: false, reason: "not disinhibited" };
                }
            } else {
                var _catKey = window.getActionCategory(actId, npc);
                if (_catKey && _catKey !== "Other" &&
                    window.getActDisinhibition(npc, _catKey) < _disinhibThreshold) {
                    return { valid: false, reason: "not disinhibited" };
                }
            }
        }
    }

    return { valid: true };
}

/**
 * Get user-friendly hint for disabled action reason
 */
function getDisabledHintForReason(reason, npc, player, act) {
    // Position mismatch: name positions where the act IS possible, so the
    // player knows a position change is what unlocks it (and to where).
    if (reason === "no position" && act) {
        const ids = resolvePositionFor(act.id);
        if (ids.length) {
            const labels = ids.slice(0, 3).map(id => {
                const p = getPosition(id);
                return p && p.label ? p.label : id;
            });
            return ids.length <= 3
                ? "Change position - works in " + labels.join(", ")
                : "Change position - e.g. " + labels.join(", ");
        }
    }
    const hintMap = {
        "pull out first": "Pull out first",
        "no position": "Wrong position",
        "clothed": "Remove clothes first",
        "no access": "No access",
        "no lube": "Needs lubrication",
        "wrong gender": "Wrong gender",
        "no consent": "Needs more attraction",
        "already nude": "Already undressed",
        "not worn": "Not wearing",
        "prior required": "Action requires prior step",
        "no active action": "No active action",
        "not disinhibited": "Not yet comfortable with this",
        "unknown action": "Unknown action"
    };
    return hintMap[reason] || reason;
}

/**
 * Generate all actions with validity status for displaying disabled actions with hints
 */
function generateAllActionsWithStatus(npc, player, positionId = null) {
    if (!npc || !player) return { valid: [], invalid: [] };
    
    // SIMPLIFIED: Return all actions without filtering
    // This ensures we see all possible actions in the menu for debugging
    const actionIds = getAllActIds();
    const allActions = [];
    
    for (const actId of actionIds) {
        const act = getAct(actId);
        if (!act) continue;
        allActions.push({ ...act, actId, disabled: false });
    }
    
    return { valid: allActions, invalid: [] };
}

/**
 * Apply stage filtering to a single action
 */
function applyStageFilteringToSingleAction(action, stage) {
    // Clothing actions are always allowed
    if (action.type === ACT_TYPES.CLOTHING) return true;
    
    // END actions are always allowed
    if (action.type === ACT_TYPES.END) return true;
    
    // Stage 1: Clothed - only external actions
    if (stage === INTIMACY_STAGES.CLOTHED) {
        if (action.type === ACT_TYPES.PENETRATE || action.type === ACT_TYPES.CONTINUE) return false;
    }
    
    // Stage 2: Partial - still hide full penetration
    if (stage === INTIMACY_STAGES.PARTIAL) {
        if (action.type === ACT_TYPES.PENETRATE || action.type === ACT_TYPES.CONTINUE) return false;
    }
    
    return true;
}

/**
 * Apply stage-specific filtering to actions array
 * Note: Clothing accessibility is already handled by checkToolTargetAccessibility,
 * so we only filter by action type here.
 */
function applyStageFilteringToArray(actions, stage) {
    return actions.filter(action => {
        // Clothing actions are always allowed
        if (action.type === ACT_TYPES.CLOTHING) return true;
        
        // END actions are always allowed
        if (action.type === ACT_TYPES.END) return true;
        
        // Stage 1: Clothed - allow all non-penetrative actions
        if (stage === INTIMACY_STAGES.CLOTHED) {
            // Remove penetration and continue actions until partially undressed
            if (action.type === ACT_TYPES.PENETRATE || action.type === ACT_TYPES.CONTINUE) return false;
        }
        
        // Stage 2: Partial - allow all except full penetration
        if (stage === INTIMACY_STAGES.PARTIAL) {
            // Still hide full penetration until fully nude
            if (action.type === ACT_TYPES.PENETRATE || action.type === ACT_TYPES.CONTINUE) return false;
        }
        
        // Stage 3: Nude - allow all actions
        // No filtering needed
        
        return true;
    });
}

/**
 * Apply stage-specific filtering to actions (legacy - for categorized object)
 */
function applyStageFiltering(categorizedActions, stage) {
    const filtered = { ...categorizedActions };
    
    // Stage 1: Clothed - only external actions
    if (stage === INTIMACY_STAGES.CLOTHED) {
        // Remove penetration and continue actions (now categorized by body area)
        // These will be in Midsection, Head categories
        delete filtered.Penetration;
        
        // Remove genital actions that require nudity
        // Map old section names to new ones for filtering
        const sectionMap = {
            "Pussy": "Midsection",
            "Cock": "Midsection",
            "Anal": "Midsection",
            "Anus": "Midsection",
            "Face": "Head",
            "Breasts": "Upper Body",
            "Hair": "Head",
            "Cloaca": "Midsection"
        };
        
        for (const [oldSection, newSection] of Object.entries(sectionMap)) {
            const actions = filtered[oldSection] || filtered[newSection];
            if (actions) {
                if (newSection === "Midsection") {
                    // Filter genital actions
                    filtered[newSection] = actions.filter(a => a.reqCloth === CLOTHING_REQUIREMENTS.ANY);
                } else if (newSection === "Head") {
                    // Filter face actions
                    filtered[newSection] = actions.filter(a => a.reqCloth === CLOTHING_REQUIREMENTS.ANY);
                } else if (newSection === "Upper Body") {
                    // Filter breast actions
                    filtered[newSection] = actions.filter(a => a.reqCloth === CLOTHING_REQUIREMENTS.ANY);
                }
            }
        }
    }
    
    // Stage 2: Partial - allow clothing removal and some exposure
    if (stage === INTIMACY_STAGES.PARTIAL) {
        // Still hide full penetration until nude
        delete filtered.Penetration;
    }
    
    return filtered;
}

/**
 * Check if a tool can access a target in current position and clothing state
 */
/**
 * Where can this act be performed? The act's pos allowlist is the single
 * source of truth for position choreography (an empty list means valid in
 * every position - see isActionValid). Returns the position ids where the
 * act works; used by the disabled-action hint so a blocked act names the
 * positions that unlock it instead of a bare "Wrong position".
 */
function resolvePositionFor(actId) {
    const act = getAct(actId);
    if (!act) return [];
    if (!Array.isArray(act.pos) || act.pos.length === 0) {
        return typeof getAllPositionIds === "function" ? getAllPositionIds() : [];
    }
    return act.pos.filter(id => typeof hasPosition === "function" ? hasPosition(id) : !!getPosition(id));
}

function checkToolTargetAccessibility(tool, target, positionId, clothingState, isPlayerAction) {
    const position = getPosition(positionId);
    if (!position) return false;
    
    // Check if tool is valid for this position
    if (!position.validTools.includes(tool)) return false;
    
    // Check if target is accessible in this position
    // The target belongs to the RECEIVER (person being acted upon)
    const receiverKey = isPlayerAction ? "npc" : "player";
    const accessibleTargets = position.accessibleTargets[receiverKey] || [];

    // Anal targets (anus/ass) use the position's analFriendly flag rather
    // than the accessibleTargets list, since "anus" isn't listed there but
    // positions marked analFriendly should allow anal access.
    var targetLower = String(target || "").toLowerCase();
    var isAnalTarget = targetLower === "anus" || targetLower === "ass" || targetLower === "butthole";
    if (isAnalTarget) {
        if (position.analFriendly === false) return false;
        // analFriendly positions allow anal access
    } else {
        if (!accessibleTargets.includes(target)) return false;
    }
    
    // Check clothing - target must be exposed
    // The target belongs to the RECEIVER (person being acted upon), not the actor
    const receiverClothing = clothingState[receiverKey];
    
    // If no clothing state for receiver, allow the action
    if (!receiverClothing) return true;
    
    const targetCovers = getTargetCoveredParts(target);
    
    for (const part of targetCovers) {
        const partClothing = getClothingForBodyPart(part);
        for (const item of partClothing) {
            if (receiverClothing[item] === true) {
                // Target is covered by clothing
                return false;
            }
        }
    }
    
    return true;
}

/**
 * Get clothing items that cover a body part
 */
function getClothingForBodyPart(part) {
    const covering = [];
    for (const [item, info] of Object.entries(INTIMACY_CLOTHING_ITEMS)) {
        if (info.covers.includes(part)) {
            covering.push(item);
        }
    }
    return covering;
}

/**
 * Get body parts covered by a target
 */
function getTargetCoveredParts(target) {
    // Map targets to the body parts they represent
    const targetToParts = {
        face: ["face"],
        mouth: ["mouth"],
        lips: ["mouth"],
        neck: ["neck"],
        hair: ["hair"],
        chest: ["chest"],
        nipples: ["nipples"],
        shoulders: ["shoulders"],
        stomach: ["stomach"],
        back: ["back"],
        hips: ["hips"],
        groin: ["groin"],
        buttocks: ["buttocks"],
        anus: ["anus"],
        vagina: ["vagina"],
        clitoris: ["clitoris"],
        penis: ["penis"],
        testicles: ["testicles"],
        thighs: ["thighs"],
        legs: ["legs"],
        feet: ["feet"],
        hand: ["hand"],
        arm: ["arm"]
    };
    return targetToParts[target] || [target];
}

// ============================================================================
// ACTION EXECUTION
// ============================================================================

/**
 * Grant progression for a successful intimacy action:
 *  - Player charisma XP (intimacy is the charisma-leveling path, parallel to
 *    combat leveling physicalProwess/endurance), via the engine's
 *    trackCombatSkillGain (exposed as a global/window function).
 *  - NPC per-body-category disinhibition delta, via the SFW-side
 *    applyActDisinhibitionDelta (exposed on window from cyoaftw-npc-data.js).
 *    Only granted for acts where the player is the actor (the NPC is the
 *    target), since disinhibition models the NPC's comfort with what is done
 *    to their body. This is the write side of the gating in checkActionValidity.
 */
function _grantIntimacyProgression(npc, player, act) {
    if (!act) return;
    if (player && typeof window !== "undefined" &&
        typeof window.trackCombatSkillGain === "function") {
        window.trackCombatSkillGain(player, { statKey: "charisma", statAmount: 2 });
    }
    if (npc && !act.playerIsBottom && typeof window !== "undefined" &&
        typeof window.applyActDisinhibitionDelta === "function" &&
        typeof window.getActionCategory === "function") {
        var catKey = window.getActionCategory(act.id, npc);
        var delta = _actDisinhibitionGrantDelta(act);
        if (catKey && catKey !== "Other" && delta !== 0) {
            window.applyActDisinhibitionDelta(npc, catKey, delta,
                "intimacy: " + act.id + " (" + catKey + ") +" + delta);
        }
    }
}

/**
 * Execute an intimacy action
 */
// ============================================================================
// LUST PROGRESSION (relationship stat: npc.memory.lust, 0-100)
// ============================================================================

// Kink acts (impact, watersports, anal) only BUILD lust once the NPC is
// broadly comfortable. 60 lines up with the watersport gate in
// checkActionValidity: at 50-59 an impact act is already performable, but
// the NPC is not comfortable enough for it to raise lust yet.
const LUST_KINK_DISINHIBITION_MIN = 60;
// How much a kink act LOWERS lust when performed below that comfort level.
const LUST_KINK_PENALTY = 1.0;

function _intimacyActIsAnal(act) {
    const target = String((act && act.target) || "").toLowerCase();
    const id = String((act && act.id) || "").toLowerCase();
    return target === "anus" || id.indexOf("anal") !== -1 || id.indexOf("anus") !== -1;
}

function _intimacyActInvolvesPenis(act) {
    if (!act) return false;
    const tool = String(act.tool || "").toLowerCase();
    const target = String(act.target || "").toLowerCase();
    return tool === "penis" || tool === "cock" || tool === "dick" ||
        target === "penis" || target === "cock" || target === "dick";
}

// Male-rate profile for male NPCs; penis-bearing others (futanari) follow
// the male rates too, everyone else the female rates. Female is checked
// first so "female" never matches the male branch.
function _intimacyLustProfile(npc) {
    const gender = String((npc && npc.gender) || "").toLowerCase();
    if (gender === "female" || gender === "f" || gender.startsWith("female")) return "female";
    if (gender === "male" || gender === "m" || gender.startsWith("male")) return "male";
    if (npc && npc.anatomy && (npc.anatomy.penis || npc.anatomy.cock)) return "male";
    return "female";
}

/**
 * Gender-based npc.memory.lust delta for one executed intimacy act:
 * - female profile: foreplay (non-penetrative acts) +1.25,
 *   intercourse (PENETRATE/CONTINUE) +0.75
 * - male profile: penis-involving acts +1.5, anything else +0.6
 * - impact / watersports / anal acts only ADD lust when the NPC's broad
 *   disinhibition is at least LUST_KINK_DISINHIBITION_MIN; below that they
 *   SUBTRACT LUST_KINK_PENALTY instead.
 * Clothing and END acts return 0 (no lust effect).
 */
// ── NPC INITIATIVE: asking for intercourse ──────────────────────────────
// After a foreplay act, a sufficiently lustful NPC can take the lead and
// ask the player to fuck her. Vaginal for female NPCs, anal for any NPC
// (male NPCs only ever ask for anal) — gated by the SAME checks the act
// menu uses, so she only ever asks for something the player can actually
// do right now (disinhibition, gender, position, clothing, lube).
// Placeholders: {npcS} subject, {npcs} lowercase subject, {npcp} possessive.
var NPC_INTERCOURSE_REQUEST_SAMPLES = {
    vagina: {
        shy: [
            "{npcS} shifts against your touch, breath unsteady. \"I want to feel you inside me,\" {npcs} breathes, not quite meeting your eyes.",
            "A flush crawls up {npcp} chest, but {npcp} eyes hold yours. \"I... I want you. Inside. Please.\"",
            "{npcS} presses {npcp} forehead to your shoulder. \"Don't make me say it twice,\" {npcs} whispers. \"I need you in me.\""
        ],
        bold: [
            "{npcS} grabs your hand and presses it flat against {npcp} belly. \"Enough of that,\" {npcs} says. \"Fuck me.\"",
            "{npcS} pulls you closer, voice rough. \"Stop teasing me. I need you inside me. Now.\"",
            "\"Enough of that,\" {npcs} growls, dragging your hips hard against {npcp} own. \"Fuck me already.\""
        ],
        neutral: [
            "{npcS} arches into your touch, then stills your hand. \"I want you inside me,\" {npcs} says, low and certain.",
            "{npcS} wraps {npcp} legs around you and pulls tight. \"Enough foreplay. Fuck me.\"",
            "\"I want to feel you inside me,\" {npcs} murmurs against your ear, hips tilting toward you in open invitation.",
        ],
        crude: [
            "{npcS} grabs your hips and drags you hard against {npcp}. \"Now,\" {npcs} grunts. \"Put it in.\"",
            "{npcS} pulls your hand between {npcp} legs and rocks on it, eyes locked on yours. \"Want you inside. Bad.\"",
            "{npcS} shoves you onto your back and climbs over you, reaching down to line your cock up. \"Now,\" {npcs} growls. \"Fuck. Now.\""
        ]
    },
    anus: {
        shy: [
            "{npcS} hides {npcp} face against you, voice barely audible. \"In my ass,\" {npcs} mumbles. \"Please. I've been thinking about it.\"",
            "{npcS} reaches back hesitantly, spreading {npcp} cheeks. \"I want you... there,\" {npcs} whispers, cheeks burning."
        ],
        bold: [
            "{npcS} reaches back and spreads {npcp} cheeks in open invitation. \"My ass,\" {npcs} says plainly. \"I want you there.\"",
            "{npcS} presses {npcp} hips back against your cock, breath catching. \"Enough of that. Put it in my ass.\"",
            "\"I want you inside me — in my ass,\" {npcs} says, looking back over {npcp} shoulder. \"Don't make me wait.\""
        ],
        neutral: [
            "{npcS} presses back against you, guiding your cock to {npcp} other opening. \"Here,\" {npcs} says simply. \"I want you in my ass.\"",
            "{npcS} looks back over {npcp} shoulder, cheeks flushed. \"In my ass. Now.\"",
        ],
        crude: [
            "{npcS} turns and spreads {npcp} cheeks, looking back at you over {npcp} own shoulder. \"Here,\" {npcs} grunts, tapping {npcp} own hole. \"Want it here.\"",
            "{npcS} presses {npcp} ass back against your cock and grinds. \"Back door,\" {npcs} grunts. \"Now.\"",
            "{npcS} shoves your hand onto {npcp} ass and holds it there. \"In me,\" {npcs} says, short and rough. \"Here.\""
        ]
    }
};

/**
 * Roll for an NPC-initiated intercourse request after a foreplay act.
 * Returns a dialogue line (already pronoun-resolved) or null.
 * Conditions: TEASE-type foreplay on the NPC (not receive acts), player
 * male with a working cock (no climax cooldown), NPC lust >= 45 and
 * worked-up arousal, no penetration currently active, and the target
 * entry act actually valid right now (this is the disinhibition/gender/
 * clothing/position gate). Anti-spam: 45s minimum gap, 3 asks max per
 * encounter, 35% roll.
 */
// ── CONSENT HINTS ───────────────────────────────────────────────────────
// In-scene willingness beats: the NPC visibly reacts to intimate
// touches — hesitant when barely touched, warming as she is worked
// up, openly welcoming when ready. Fires on the first intimate
// touch of the scene, the first touch of each body category, and
// each arousal band crossing — beats, not spam. Together with the
// arousal consent gate above, this paces progression: the player
// SEES her hesitancy melt instead of skipping straight to
// intercourse on a stripped body.
var NPC_CONSENT_AROUSAL = 250;

var CONSENT_HINT_POOLS = {
    0: { // barely touched - hesitant
        neutral: [
            "{npcS} goes still under your touch, a held breath slowly releasing.",
            "{npcS} tenses for a heartbeat, then makes {npcp}self stay put for it."
        ],
        shy: [
            "{npcS} bites {npcp} lip, letting you continue but not quite meeting your eyes.",
            "A small, nervous sound escapes {npcp} throat; {npcs} doesn't pull away, but {npcs} doesn't breathe either."
        ],
        bold: [
            "{npcS} huffs a small laugh, covering {npcp} flinch. \"Bold,\" {npcs} murmurs — but {npcs} doesn't stop you.",
            "{npcS} holds {npcp} ground, watching your hand with open, curious attention."
        ]
    },
    1: { // warming up
        neutral: [
            "{npcS} exhales, {npcp} shoulders easing under your hand.",
            "A little sound escapes {npcp} throat; {npcs} shifts closer instead of away."
        ],
        shy: [
            "{npcS} flushes, but {npcp} hips tilt minutely toward your touch.",
            "{npcS} hides {npcp} face a little — but {npcp} body leans into your palm."
        ],
        bold: [
            "\"Mm,\" {npcs} hums, pressing into your hand without pretense.",
            "{npcS} makes no effort to hide that {npcs} likes it, {npcp} breath already deeper."
        ]
    },
    2: { // welcoming
        neutral: [
            "{npcS} melts into the touch, {npcp} breath deepening.",
            "{npcp} back arches faintly, chasing your hand as it moves."
        ],
        shy: [
            "{npcS} shivers, eyes closing, giving in to the warmth spreading through {npcp}.",
            "The last of the tension drains out of {npcp}; {npcs} is soft and pliant under you now."
        ],
        bold: [
            "\"Don't stop,\" {npcs} breathes, hips pressing up into your touch.",
            "{npcS} grips your wrist — not to pull it away, but to hold it exactly where it is."
        ]
    },
    3: { // eager, ready for more
        neutral: [
            "{npcS} is trembling with it now, {npcp} body asking for more than your hands.",
            "{npcp} breath comes in short, wanting bursts — {npcs} is past ready."
        ],
        shy: [
            "{npcS} can't hold {npcp} sounds in anymore, each touch drawing something soft and desperate.",
            "{npcS} is flushed from {npcp} chest to {npcp} ears, trembling on the edge of asking."
        ],
        bold: [
            "{npcS} is slick and aching under your touch, well past patience — {npcs} wants more, and {npcs} isn't subtle about it.",
            "\"More,\" {npcs} demands, {npcp} hips rolling against your hand. \"Now.\""
        ]
    }
};

/**
 * One consent-hint line for an intimate foreplay beat, or null.
 * Fires on: first intimate touch of the encounter, first touch of a
 * body category, or an arousal band crossing.
 */
// ── FULL-DEPTH MOANS ─────────────────────────────────────────────────────
// Bottoming out draws sound out of her: pounding is loud and raw,
// thrusting groans, fucking hums. Fires on continue acts at depth 5,
// with variety (pickUnique) and a skip chance so it stays a beat,
// not wallpaper.
var FULL_DEPTH_MOAN_POOLS = {
    pound: [
        "{npcS} is loud with it now — wailing into every full-depth slam, all composure gone.",
        "A raw, ragged moan tears out of {npcp} with each pounding stroke, {npcp} voice breaking on the deepest ones.",
        "{npcS} cries out at every bottoming-out slam, the sound bouncing off the walls."
    ],
    thrust: [
        "Deep, throaty moans punch out of {npcp} each time you sink to the root.",
        "{npcS} groans shamelessly at every hilt-deep thrust, {npcp} hips tilting to take more.",
        "Each full-length stroke drags a wanton moan up out of {npcp} chest."
    ],
    fuck: [
        "A soft moan escapes {npcp} each time you fill {npcp} completely.",
        "{npcS} sighs into your rhythm, humming a gentle moan at the deepest point of each stroke.",
        "{npcp} breath catches and melts into a moan whenever you press flush against {npcp}."
    ]
};

function maybeFullDepthMoan(npc, act, intimacy) {
    if (!npc || !act || !intimacy) return null;
    if (npcCannotSpeak(npc)) return null; // unconscious/sleeping NPCs make no vocal sounds
    if (act.playerIsBottom === true) return null;
    if (act.type !== ACT_TYPES.CONTINUE) return null;
    var pen = intimacy.penetration;
    if (!pen || !pen.active || (pen.depth || 0) < 5) return null;
    var target = String(pen.target || "").toLowerCase();
    if (target !== "vagina" && target !== "pussy" && target !== "anus" && target !== "ass") return null;
    var verb = String(act.verb || "").toLowerCase();
    var pool = FULL_DEPTH_MOAN_POOLS[verb];
    if (!pool) return null;
    if (Math.random() > 0.65) return null;
    return applyNPCPronouns(npc, pickUnique(pool, intimacy, "full-depth-moan-" + verb));
}

function maybeConsentHint(npc, act, intimacy) {
    if (!npc || !act || !intimacy) return null;
    if (npcCannotSpeak(npc)) return null; // unconscious/sleeping NPCs give no consent cues
    if (act.playerIsBottom === true) return null;
    if (act.type !== ACT_TYPES.TEASE) return null;
    var target = String(act.target || "").toLowerCase();
    var intimate = ["vagina", "pussy", "anus", "ass", "breasts", "nipples", "penis", "cock", "neck", "buttocks"].indexOf(target) !== -1;
    if (!intimate) return null;
    if (!intimacy.encounterFlags) intimacy.encounterFlags = {};
    var hints = intimacy.encounterFlags.consentHints;
    if (!hints) hints = intimacy.encounterFlags.consentHints = { cats: {}, band: -1, touched: false };
    var cat = (target === "vagina" || target === "pussy") ? "vagina"
        : (target === "anus" || target === "ass") ? "anus"
        : (target === "breasts" || target === "nipples") ? "breasts"
        : (target === "penis" || target === "cock") ? "penis" : "other";
    var arousal = intimacy.arousal ? intimacy.arousal.npc : 0;
    var band = arousal < 150 ? 0 : arousal < 300 ? 1 : arousal < 500 ? 2 : 3;
    var firstTouchOfCat = !hints.cats[cat];
    hints.cats[cat] = true;
    var bandCrossed = band > hints.band;
    if (bandCrossed) hints.band = band;
    var firstTouch = !hints.touched;
    if (!firstTouch && !firstTouchOfCat && !bandCrossed) return null;
    hints.touched = true;
    var temperament = String(npc.temperament || "").toLowerCase();
    var register = (temperament === "forward" || temperament === "bold" || temperament === "lustful") ? "bold"
        : (temperament === "shy" || temperament === "timid" || temperament === "reserved") ? "shy"
        : "neutral";
    var pool = (CONSENT_HINT_POOLS[band] && CONSENT_HINT_POOLS[band][register]) ||
        (CONSENT_HINT_POOLS[band] && CONSENT_HINT_POOLS[band].neutral) || [];
    if (!pool.length) return null;
    return applyNPCPronouns(npc, pickRandom(pool));
}

function maybeNpcIntercourseRequest(npc, player, act, intimacy) {
    if (!npc || !act || !intimacy) return null;
    if (npcCannotSpeak(npc)) return null; // an unconscious/sleeping NPC cannot ask for anything
    // Only after foreplay on HER body — she asks while being worked up.
    if (act.type !== ACT_TYPES.TEASE) return null;
    if (act.playerIsBottom === true) return null;
    // Already being fucked — nothing to ask for.
    if (intimacy.penetration && intimacy.penetration.active) return null;
    // She wants the player inside her: he needs a working cock.
    var playerGender = getPlayerGenderForGates(player);
    if (playerGender !== "male" && !(player && player.anatomy && player.anatomy.penis)) return null;
    var climaxState = intimacy.climax || {};
    if (playerGender === "male" && climaxState.playerCooldownUntil && Date.now() < climaxState.playerCooldownUntil) return null;
    // "Enough lust" + genuinely worked up.
    var lust = (npc.memory && typeof npc.memory.lust === "number") ? npc.memory.lust : 0;
    // Long-term lust OR in-the-moment heat: a thoroughly worked-up NPC
    // asks for it even if the relationship stat is still low — the
    // in-scene consent is what matters here.
    if (lust < 45 && scaleArousal(intimacy.arousal ? intimacy.arousal.npc : 0) < 50) return null;
    if (scaleArousal(intimacy.arousal ? intimacy.arousal.npc : 0) < 35) return null;
    // Anti-spam: gap, per-encounter cap.
    if (!intimacy.encounterFlags) intimacy.encounterFlags = {};
    var _req = intimacy.encounterFlags.npcSexRequest || null;
    if (_req && _req.count >= 3) return null;
    if (_req && _req.at && (Date.now() - _req.at) < 45000) return null;
    // The pleasure loop is her servicing the player — a different agenda.
    if (_npcPleasureLoopActive(npc)) return null;

    // Candidate targets in preference order: vagina (female NPCs first),
    // then anus (any NPC). Validity is the full menu gate — disinhibition,
    // gender, position, clothing, lube.
    
    // Ensure position object exists
    if (!intimacy.position) {
        intimacy.position = {
            player: DEFAULT_POSITION,
            npc: DEFAULT_POSITION
        };
    }
    
    var position = (intimacy.position && intimacy.position.player) || null;
    var clothing = intimacy.clothing || null;
    var candidates = [];
    var npcGender = String(npc.gender || "").toLowerCase();
    if (npcGender === "female" || npcGender === "f" || npcGender.startsWith("female")) {
        candidates.push({ target: "vagina", actId: "enter_pussy" });
    }
    candidates.push({ target: "anus", actId: "enter_anus" });
    var chosen = null;
    for (var i = 0; i < candidates.length; i++) {
        if (checkActionValidity(candidates[i].actId, npc, player, position, clothing).valid) {
            chosen = candidates[i];
            break;
        }
    }
    if (!chosen) return null;
    if (Math.random() > 0.35) return null;

    var temperament = String(npc.temperament || "").toLowerCase();
    var register = (temperament === "forward" || temperament === "bold" || temperament === "lustful") ? "bold"
        : (temperament === "shy" || temperament === "timid" || temperament === "reserved") ? "shy"
        : "neutral";
    // Uncivilized species speak in simple, broken, gesture-heavy lines —
    // the articulate registers would read wrong for them (see the
    // species speech notes in buildIntimacyPrompt).
    var _species = String(npc.species || "").toLowerCase();
    if (typeof isCivilizedSpecies === "function" && !isCivilizedSpecies(_species)) {
        register = "crude";
    }
    var pool = NPC_INTERCOURSE_REQUEST_SAMPLES[chosen.target][register] ||
        NPC_INTERCOURSE_REQUEST_SAMPLES[chosen.target].neutral;
    var line = applyNPCPronouns(npc, pickRandom(pool));

    intimacy.encounterFlags.npcSexRequest = {
        at: Date.now(),
        target: chosen.target,
        count: (_req ? (_req.count || 0) : 0) + 1
    };
    return line;
}

// NEGLECT DEMAND (SotB-style NPC initiative): beats that are all about
// the player's pleasure (receive acts, near-zero arousal
// gain for the NPC) extend a neglect streak. A worked-up NPC who has been
// neglected too long pulls away and demands attention - the turn-based
// equivalent of SotB's real-time hercooldown/lchangeup.
var NPC_NEGLECT_DEMAND_SAMPLES = {
    bold: [
        "{npcS} pulls back, breathing hard. <That's enough of me spoiling you. My turn now - and you'd better make it worth my while.>",
        "{npcS} plants a hand flat on your chest and stops you. <I've been doing all the work here, {player}. Time you returned the favor.>",
        "{npcS} pushes you down, eyes blazing. <You've had your fun. Now get to work on me.>"
    ],
    shy: [
        "{npcS} eases away, cheeks flushed. <C-could you... touch me too? Please. I've been... I need it.>",
        "{npcS} catches your hand and guides it lower, barely meeting your eyes. <It's... it's my turn, isn't it?>"
    ],
    neutral: [
        "{npcS} draws back with a frustrated sigh. <My turn now. Fair is fair.>",
        "{npcS} stills your hips and gives you a pointed look. <You're not the only one who wants attention here.>"
    ],
    crude: [
        "{npcS} shoves you back and growls. <Me now. You do me.>",
        "{npcS} grabs your hand, pressing it where {npcp} wants it. <There. Work.>"
    ]
};

function updateNeglectStreak(npc, act, intimacy, arousalGainN, hadNpcClimax) {
    if (!intimacy) return;
    if (!intimacy.encounterFlags) intimacy.encounterFlags = {};
    if (hadNpcClimax || (typeof arousalGainN === "number" && arousalGainN >= 20)) {
        intimacy.encounterFlags.neglectStreak = 0;
        return;
    }
    if (act && (act.playerIsBottom === true || (typeof arousalGainN === "number" && arousalGainN <= 10))) {
        intimacy.encounterFlags.neglectStreak = (intimacy.encounterFlags.neglectStreak || 0) + 1;
    }
}

// SLAVE SUBMISSION FLAVOR: with a collared slave (npc.enslaved) the
// player's acts are commands. Compliance is voiced per temperament -
// HOW they submit varies, WHETHER they submit does not.
var NPC_SLAVE_SUBMISSION_SAMPLES = {
    bold: [
        "{npcS} holds your gaze while {npcp} obeys, something defiant burning under the compliance. <As you wish... master.>",
        "{npcS} does exactly as ordered, slow and deliberate, making you watch. <Happy now?>"
    ],
    shy: [
        "{npcS} trembles but does not resist, eyes lowered. <Y-yes... as you command.>",
        "{npcS} whimpers softly and yields completely, waiting for the next order."
    ],
    neutral: [
        "{npcS} nods once and complies without protest. <Understood.>",
        "{npcS} submits to the order, breath quickening, offering no resistance."
    ],
    crude: [
        "{npcS} grunts and obeys, palms flat, waiting.",
        "{npcS} bares and holds still. <Yes. Do.>"
    ]
};

function buildSlaveSubmissionLine(npc) {
    var temperament = String(npc.temperament || "").toLowerCase();
    var register = (temperament === "forward" || temperament === "bold" || temperament === "lustful") ? "bold"
        : (temperament === "shy" || temperament === "timid" || temperament === "reserved") ? "shy"
        : "neutral";
    var _species = String(npc.species || "").toLowerCase();
    if (typeof isCivilizedSpecies === "function" && !isCivilizedSpecies(_species)) {
        register = "crude";
    }
    var pool = NPC_SLAVE_SUBMISSION_SAMPLES[register] || NPC_SLAVE_SUBMISSION_SAMPLES.neutral;
    return applyNPCPronouns(npc, pickUnique(pool, npc.intimacy, "slave-submission"));
}

// EARLY-ANAL RESISTANCE: a cold attempt at anal penetration is not
// something an NPC just accepts. She needs coaxing - prep beats this
// encounter (fingers, mouth, lube), very high arousal with a bold
// temperament, long-term lust, or an already-experienced anatomy.
// SPECIES ANAL ADAPTATION: the discomfort-to-pleasure transition during
// anal penetration is voiced in character per species - how each race
// endures the initial stretch (enter) and how they signal once the
// muscles relax (ease). Species without an entry fall back to the generic
// pain/discomfort pools in the penetration templates. Dragonborn have a
// separate anus (not a cloaca - see SPECIES_TEMPLATES); Lizardfolk and
// Kobolds keep the cloacal vent.
var NPC_ANAL_ADAPTATION_SAMPLES = {
    human: {
        // The "wait it out" approach; aware of the awkwardness mid-pain.
        enter: [
            "winces, then forces a slow breath. <Ow—okay, just... breathe. I'm trying to let you in.>",
            "holds up a hand, cheeks going red. <It's stretching... hold still for a second so I can adjust.>",
            "lets out a strained laugh that's more embarrassment than pain. <Sorry—sorry. Just... let me get used to it.>"
        ],
        ease: [
            "exhales, the tension draining out of {npcP} shoulders. <Okay... it's fading into warmth now. Keep going, just slow.>",
            "shifts {npcP} hips, testing. <Oh. Okay. That's... actually nice now. Don't stop.>"
        ]
    },
    elf: {
        // Breath and mental control; they endure the barrier gracefully.
        enter: [
            "hisses a breath through {npcP} teeth, spine going rigid. <A sharp intrusion... but my body is learning your shape.>",
            "closes {npcP} eyes, breath measured and slow. <Pain is temporary. Trust me to guide you through the tightness.>",
            "bears down with deliberate control. <I am yielding. Do not force it; wait for me to open.>"
        ],
        ease: [
            "breathes out, the last of the resistance melting away. <There. You see? The body obeys, given time.>",
            "rocks back to meet you, unhurried. <The tightness has passed. Now we can enjoy this.>"
        ],
        // Shy/reserved elves: surprise and doubt — the taboo register
        // lives here now, flustered and elegant rather than pained.
        shy: [
            "stiffens with a scandalised gasp, the flush creeping up to the tips of {npcP} ears. <We should not— this is not proper. And yet... wait. Do not move.>",
            "bites {npcP} lip, torn between pulling away and pressing back. <I was raised better than this... but it aches in a way I cannot name.>",
            "glances back with wide, doubting eyes. <You are certain it fits? It is... improper. And still I want you to continue.>",
            "hides {npcP} burning face behind {npcP} hair, voice a mortified whisper. <If the elders ever learned of this... do not tell them. And do not stop.>"
        ]
    },
    dwarf: {
        // Gritted teeth; the pain is a challenge or a minor injury to endure.
        enter: [
            "grits {npcP} teeth with a muffled curse. <Gah! Tight as a vault door. Just... give me a sec to loosen up.>",
            "plants {npcP} stance wider and endures it, jaw set. <It bites. But I'm used to pressure. Keep going.>",
            "slaps a hand back against your hip - holding you in place, not pushing you off. <Don't pull out now! You're halfway in. Ride it out.>"
        ],
        ease: [
            "huffs through {npcP} nose, finally loosening. <There. The door's open. Now get on with it.>",
            "rolls {npcP} shoulders and settles in. <Pressure's just weight now. Give me all of it.>"
        ]
    },
    orc: {
        // Raw aggression against the pain; the burn is strength.
        enter: [
            "tenses hard, then deliberately relaxes with a low growl. <Fuck! It's clamping down hard. Break through it!>",
            "snarls, pushing back against the burn. <It burns! Good. Now that it's stretched, it feels huge.>",
            "bares {npcP} teeth over {npcP} shoulder. <Stop waiting! I'm open now! Hit me!>"
        ],
        ease: [
            "roars as the resistance finally gives way. <That's it! All the way in. Don't you dare hold back now.>",
            "grins through the last of the sting. <The burn's fuel now. Faster.>"
        ]
    },
    halfling: {
        // Vocal and expressive; yelps and nervous giggles, smaller and sensitive.
        enter: [
            "yelps, whole body jolting. <Eep! Okay, okay—give me a second, it's wide!>",
            "giggles nervously, cheeks bright pink. <That was a pinch! Just hold still while I get used to it, okay?>",
            "buries {npcP} face against the nearest thing. <Oh gods, oh gods... okay. Okay. I think it's fitting.>"
        ],
        ease: [
            "wriggles back with a delighted squeak. <Oh! That's actually really nice now. Don't stop!>",
            "sighs, patting {npcP} belly. <My tummy hurts a bit... but it feels so full. Keep going.>"
        ]
    },
    dragonborn: {
        // Controlled tension; the strain shows (nostrils, tail) before it eases.
        enter: [
            "goes utterly still, nostrils flaring with a thin curl of smoke. <The heat rises... but the muscle yields. I am ready.>",
            "flares {npcP} nostrils, tail snapping stiff behind {npcP}. <It is a tight seal. You must earn the opening.>",
            "holds {npcP} breath, scales prickling as the stretch settles. <Hold... the sting is passing. Do not stop midway.>"
        ],
        ease: [
            "releases a long plume of smoke, the last of the tension gone. <The sting is gone. Now we begin.>",
            "rolls {npcP} hips once, testing, and rumbles low in approval. <The seal is broken. Take what is yours.>"
        ]
    },
    kobold: {
        // Quick to panic, quick to adapt; trembly, then eager.
        enter: [
            "trembles, tail tucking tight, then freezes as the head slips in. <Yip! It's big... wait, it fits! It fits!>",
            "hides {npcP} face behind both hands, peeking between the fingers. <I was scared it would hurt forever... k-keep going, just slow?>",
            "chirps and squirms, half panic, half curiosity. <Hnn—okay! Okay. It's warm. It's really warm.>"
        ],
        ease: [
            "peeks back over {npcP} shoulder, eyes shining. <Shiny! It's warm inside now. Don't stop!>",
            "whines happily, pushing back to meet you. <It stopped hurting! It just feels... really, really good?>"
        ]
    },
    goblin: {
        // Immediate reaction, no patience for waiting; loud until it turns good.
        enter: [
            "squirms and swats at you, all noisy protest. <Ouchie! Hey! ...Wait. Wait, do that bit again.>",
            "wriggles impatiently, huffing. <It's weirdly tight! Just shove it in already!>",
            "complains loudly right up until the stretch eases - then goes very quiet. <Okay, okay, no more hurting! Let's go!>"
        ],
        ease: [
            "kicks {npcP} little heels, suddenly all enthusiasm. <There! Right there! See, told you it'd get good!>",
            "grins wide and shameless. <Knew it! Hurts first, then it's great. Go faster!>"
        ]
    }
};

function getSpeciesAnalAdaptationPool(npc) {
    var key = String((npc && npc.species) || "").toLowerCase();
    return NPC_ANAL_ADAPTATION_SAMPLES[key] || null;
}

var NPC_ANAL_REBUFF_SAMPLES = {
    bold: [
        "{npcS} tenses as you press against {npcp} asshole, then reaches back and pushes your hip away. <Nope. Not yet. Work me open first - fingers, mouth, patience. Then we talk.>",
        "{npcS} glances back at you, unimpressed. <Nobody just walks through the back door, {player}. Coax me first or forget it.>"
    ],
    shy: [
        "{npcS} flinches forward with a sharp gasp as you nudge against {npcp} tense hole. <I... I can't - not like that. You have to... go slow. Warm me up first...>",
        "{npcS} pulls away, cheeks burning. <Th-that's too much, too fast... please, not yet.>"
    ],
    neutral: [
        "{npcS} tenses hard as you press against {npcp} tightly puckered hole, and {npcp} hand firmly pushes you back. <Not there. Not yet - you need to get me ready first.>",
        "{npcS} shifts {npcp} hips away from you, breathing tense. <Slow down. That needs... more than you're giving it.>"
    ],
    crude: [
        "{npcS} jerks away and growls. <No. Hole closed. You open first.>",
        "{npcS} slaps your hand away. <Wrong hole. You work first.>"
    ]
};

function analReadinessPassed(npc, act, intimacy) {
    if (!npc || !intimacy) return true;
    var temperament = String(npc.temperament || "").toLowerCase();
    var anusAnat = (npc.anatomy && npc.anatomy.anus) || {};
    if (["supple", "loose", "stretchy", "gaping"].indexOf(anusAnat.size) !== -1) return true;
    var lust = (npc.memory && typeof npc.memory.lust === "number") ? npc.memory.lust : 0;
    if (lust >= 70) return true;
    var herArousal = intimacy.arousal ? intimacy.arousal.npc : 0;
    if (herArousal >= 550 && (temperament === "forward" || temperament === "bold" || temperament === "lustful")) return true;
    // Otherwise count anal prep beats from this encounter: tease acts on
    // her anus/ass (fingers, mouth, tongue, spit, hotdog).
    var prep = 0;
    if (Array.isArray(intimacy.actionHistory)) {
        for (var i = 0; i < intimacy.actionHistory.length; i++) {
            var h = intimacy.actionHistory[i];
            if (!h || !h.actId) continue;
            if (act && h.actId === act.id) continue;
            var ha = (typeof getAct === "function") ? getAct(h.actId) : null;
            if (!ha || ha.playerIsBottom === true) continue;
            if (ha.type !== ACT_TYPES.TEASE) continue;
            var aid = String(h.actId).toLowerCase();
            if (aid.indexOf("anus") !== -1 || aid.indexOf("ass") !== -1 || aid === "hotdog") prep++;
        }
    }
    var hasLube = intimacy.lube && intimacy.lube.anus && intimacy.lube.anus.hasLube;
    return prep >= 2 || (prep >= 1 && hasLube);
}

function buildAnalRebuffLine(npc, player, intimacy) {
    var temperament = String(npc.temperament || "").toLowerCase();
    var register = (temperament === "forward" || temperament === "bold" || temperament === "lustful") ? "bold"
        : (temperament === "shy" || temperament === "timid" || temperament === "reserved") ? "shy"
        : "neutral";
    var _species = String(npc.species || "").toLowerCase();
    if (typeof isCivilizedSpecies === "function" && !isCivilizedSpecies(_species)) {
        register = "crude";
    }
    var pool = NPC_ANAL_REBUFF_SAMPLES[register] || NPC_ANAL_REBUFF_SAMPLES.neutral;
    var line = applyNPCPronouns(npc, pickUnique(pool, intimacy, "anal-rebuff"));
    var _pname = (player && player.name) ? String(player.name).trim() : "";
    if (_pname) {
        line = line.split("{player}").join(_pname);
    } else {
        line = line.split("{player},").join(" ").split("{player}").join(" you");
        line = line.split(" ").filter(function (w) { return w.length > 0; }).join(" ").trim();
    }
    return line;
}

function maybeNpcNeglectDemand(npc, player, intimacy) {
    if (!npc || !intimacy) return null;
    if (npcCannotSpeak(npc)) return null; // an unconscious/sleeping NPC cannot demand attention
    if (!intimacy.encounterFlags) intimacy.encounterFlags = {};
    var flags = intimacy.encounterFlags;
    var streak = flags.neglectStreak || 0;
    var herArousal = intimacy.arousal ? intimacy.arousal.npc : 0;
    if (streak < 3 || herArousal < 350) return null;
    var demand = flags.neglectDemand || null;
    if (demand && (demand.count || 0) >= 2) return null;
    if (demand && demand.at && (Date.now() - demand.at) < 90000) return null;
    // Being penetrated IS attention; never fire mid-penetration or while
    // she is servicing the player in the pleasure loop.
    if (intimacy.penetration && intimacy.penetration.active) return null;
    if (_npcPleasureLoopActive(npc)) return null;

    flags.neglectDemand = { at: Date.now(), count: (demand ? (demand.count || 0) : 0) + 1 };
    flags.neglectStreak = 0;

    var temperament = String(npc.temperament || "").toLowerCase();
    var register = (temperament === "forward" || temperament === "bold" || temperament === "lustful") ? "bold"
        : (temperament === "shy" || temperament === "timid" || temperament === "reserved") ? "shy"
        : "neutral";
    var _species = String(npc.species || "").toLowerCase();
    if (typeof isCivilizedSpecies === "function" && !isCivilizedSpecies(_species)) {
        register = "crude";
    }
    var pool = NPC_NEGLECT_DEMAND_SAMPLES[register] || NPC_NEGLECT_DEMAND_SAMPLES.neutral;
    var line = applyNPCPronouns(npc, pickRandom(pool));
    var _pname = (player && player.name) ? String(player.name).trim() : "";
    if (_pname) {
        line = line.split("{player}").join(_pname);
    } else {
        line = line.replace(new RegExp("[" + String.fromCharCode(92, 115) + "]*[{]player[}],?[" + String.fromCharCode(92, 115) + "]*", "g"), " ").replace(new RegExp("[" + String.fromCharCode(92, 115) + "]+"), " ").trim();
    }
    return line;
}

/**
 * Assemble this NPC's speech/voice facts (speechProfile, speech
 * pattern, enrichment articulation/voice/dialect, synthesized persona
 * fingerprint, temperament inflection) into a prompt block. Used by
 * the AI voicing pass for NPC-initiated lines so their established
 * speech patterns survive into intimacy beats.
 */
function buildNpcVoiceContextBlock(npc) {
    if (!npc) return "";
    var lines = [];
    var speechProfile = npc.speechProfile || {};
    var speechPattern = npc.speechPattern || npc.speechStyle || "";
    if (speechProfile.tone || speechProfile.styleDescription || speechProfile.languageNotes) {
        lines.push("- SPEECH STYLE: tone " + (speechProfile.tone || speechPattern || "neutral") +
            "; style: " + (speechProfile.styleDescription || "") +
            "; language: " + (speechProfile.languageNotes || "") + ".");
    } else if (speechPattern) {
        lines.push("- SPEECH: this NPC speaks with a " + speechPattern + " pattern.");
    }
    var enrichment = npc.enrichment || {};
    if (enrichment.articulation) lines.push("- Physical speech constraint: " + enrichment.articulation);
    if (enrichment.voice) lines.push("- Voice quality: " + enrichment.voice);
    if (enrichment.dialectFlavor) lines.push("- Dialect: " + enrichment.dialectFlavor);
    var persona = npc.persona || {};
    if (persona.voiceDescriptor) lines.push("- Voice: " + persona.voiceDescriptor);
    if (persona.verbalFingerprint) lines.push("- Verbal tic / habitual phrase: " + persona.verbalFingerprint);
    if (typeof window !== "undefined" && typeof window.getTemperamentInflection === "function" && npc.temperament) {
        lines.push(window.getTemperamentInflection(npc.temperament));
    }
    if (!lines.length) return "";
    return "VOICE (how this NPC speaks — the line MUST stay consistent with all of it):\n" + lines.join("\n");
}

function buildIntercourseRequestPrompt(npc, target, canned) {
    var subj = (typeof getSubjectPronoun === "function" ? getSubjectPronoun(npc) : "They") || "They";
    var pos = (typeof getPossessivePronoun === "function" ? getPossessivePronoun(npc) : "their") || "their";
    var what = (target === "anus")
        ? "anal sex — the player's cock in their ass"
        : "vaginal sex — the player's cock in their pussy";
    var voiceBlock = buildNpcVoiceContextBlock(npc);
    return [
        "You are voicing ONE line for an NPC in a sex scene in a text adventure game.",
        "The NPC is " + ((npc && npc.name) || "the NPC") + ", a " + ((npc && npc.species) || "Human") + " " + ((npc && npc.gender) || "female") + ". Temperament: " + ((npc && npc.temperament) || "neutral") + ".",
        "SITUATION: the player has been pleasuring them with foreplay; they are breaking the rhythm to ask the player for " + what + ".",
        voiceBlock,
        "",
        "INSTRUCTIONS:",
        "- Rewrite the REQUEST below in this NPC's OWN voice: same meaning and intent, their exact vocabulary, dialect, rhythm, and verbal habits.",
        "- Keep it SHORT: one or two sentences total, at most one quoted line of dialogue.",
        "- Third person; dialogue in double quotes; never use their name — pronouns only (" + subj.toLowerCase() + "/" + pos + ").",
        "- The player is 'you' (your cock, your hips) — never 'him' or 'his'.",
        "- Match the VOICE block exactly. Do NOT change their speech style. Do NOT use words like: I cannot, as an AI.",
        "",
        "REQUEST (the meaning to keep, not the phrasing):",
        String(canned || "")
    ].filter(Boolean).join("\n");
}

/**
 * AI voicing pass for an NPC intercourse request: rewrites the canned
 * line in the NPC's established speech patterns. Same contract as
 * generateReceiveAgreement — 4s timeout race, meta/player-perspective
 * rejection, falls back to the canned line (which is already
 * register/species-appropriate). Returns a string.
 */
async function voiceNpcIntercourseRequest(npc, target, canned) {
    var fallback = String(canned || "");
    try {
        var _ai = (typeof window !== "undefined" && typeof window.ai === "function")
            ? window.ai : (typeof ai === "function" ? ai : null);
        if (!_ai) return fallback;
        var prompt = buildIntercourseRequestPrompt(npc, target, fallback);
        var result = await Promise.race([
            _ai({ instruction: prompt, startWith: "", endButtons: "none", generatorName: "cyoaftw-engine-core" }),
            new Promise(function (resolve) { setTimeout(function () { resolve(null); }, 4000); })
        ]);
        var text = result && (result.text || result);
        if (!text || !String(text).trim()) return fallback;
        var trimmed = String(text).trim();
        var isMeta = /since the base|please provide|I cannot|I'm unable|as an ai|i'll polish|here is the|here's the/i.test(trimmed);
        if (isMeta) return fallback;
        if (/^you(r|rs)?\s/i.test(trimmed)) return fallback;
        if (trimmed.length > 300) return fallback;
        trimmed = trimmed.replace(/<([^>]*)>/g, '"$1"').replace(/<|>/g, "");
        trimmed = trimmed.replace(/["\u201C\u201D\u201E\u201F\u00AB\u00BB]{2,}/g, '"');
        trimmed = trimmed.trim();
        return trimmed || fallback;
    } catch (e) {
        console.warn("[Intimacy] Request voicing failed, using canned line:", e);
        return fallback;
    }
}

function getIntimacyLustDelta(npc, act) {
    if (!npc || !act || !act.type) return 0;
    if (act.type === ACT_TYPES.CLOTHING || act.type === ACT_TYPES.END) return 0;

    const isKinkAct = act.type === ACT_TYPES.IMPACT ||
        act.type === ACT_TYPES.WATERSPORT ||
        _intimacyActIsAnal(act);
    if (isKinkAct && _getMaxCategoryDisinhibition(npc) < LUST_KINK_DISINHIBITION_MIN) {
        return -LUST_KINK_PENALTY;
    }

    if (_intimacyLustProfile(npc) === "male") {
        return _intimacyActInvolvesPenis(act) ? 1.5 : 0.6;
    }
    const isIntercourse = act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE;
    return isIntercourse ? 0.75 : 1.25;
}

/**
 * Apply the gender-based lust delta for an executed act to npc.memory.lust
 * (clamped 0-100; fractional deltas accumulate as floats and displays floor).
 */
function applyIntimacyLustGain(npc, act) {
    if (!npc || !npc.memory) return;
    const delta = getIntimacyLustDelta(npc, act);
    if (!delta) return;
    if (typeof npc.memory.lust !== "number") npc.memory.lust = 0;
    npc.memory.lust = Math.max(0, Math.min(100, npc.memory.lust + delta));
}

// ============================================================================
// ENGAGED ACT SLOTS (multi-act simultaneity)
// ============================================================================
// The player can be engaged in several acts at once: one mouth act (kissing,
// licking), one hand act (groping, fingering) and one genital act
// (penetration, grinding), tracked in intimacy.engagedActs. Choosing a new
// act in an occupied slot disengages the previous one; the action menu
// highlights engaged acts with a border and "Continue" continues every
// engaged act. One-shot acts (impact, watersports, climax) and receive acts
// (the NPC acting on the player, which run through the paced receive flow)
// do not occupy slots, but impact play frees the hand slot and watersports
// frees the genitals slot when performed. Only one genital act can be
// engaged at a time, so
// the single intimacy.penetration depth state stays safe.

function getIntimacyActSlot(act) {
    if (!act || !act.type) return null;
    if (act.playerIsBottom === true) return null;
    if (act.triggersClimax) return null;
    // One-shot utility acts (spit-on, etc.) never occupy a slot.
    if (act.oneShot === true) return null;
    if (act.type !== ACT_TYPES.TEASE &&
        act.type !== ACT_TYPES.PENETRATE &&
        act.type !== ACT_TYPES.CONTINUE) return null;
    const tool = String(act.tool || "").toLowerCase();
    if (tool === "mouth" || tool === "tongue" || tool === "lips") return "mouth";
    if (tool === "hand" || tool === "fingers") return "hand";
    if (tool === "penis" || tool === "cock" || tool === "dick" ||
        tool === "groin" || tool === "vagina" || tool === "pussy") return "genitals";
    return "other";
}

function getEngagedActs(npc) {
    const intimacy = npc && npc.intimacy;
    if (!intimacy) return [];
    if (!Array.isArray(intimacy.engagedActs)) intimacy.engagedActs = [];
    return intimacy.engagedActs;
}

function getEngagedActIds(npc) {
    return getEngagedActs(npc).map(e => e && e.actId).filter(Boolean);
}

function isActEngaged(npc, actId) {
    return getEngagedActIds(npc).indexOf(actId) !== -1;
}

// Slot-specific disengage for END acts (pull out, stop fingering, ...).
// Generic stops clear everything; unknown END acts clear everything too.
function _clearEngagedActsForEndAct(npc, act) {
    if (!getEngagedActs(npc).length) return;
    const id = String((act && act.id) || "").toLowerCase();
    if (id === "stop" || id === "pause" || id === "step_away") {
        npc.intimacy.engagedActs = [];
        return;
    }
    let slot = null;
    if (id.indexOf("finger") !== -1) slot = "hand";
    else if (id.indexOf("pull_out") !== -1 || id.indexOf("pull_off") !== -1) slot = "genitals";
    if (slot) {
        npc.intimacy.engagedActs = npc.intimacy.engagedActs.filter(e => e.slot !== slot);
    } else {
        npc.intimacy.engagedActs = [];
    }
}

// Update engaged-act tracking for a freshly executed act: disengage the
// previous act occupying the same slot (if any), then engage this one.
function _updateEngagedActsForAct(npc, act) {
    if (!npc || !npc.intimacy || !act) return;
    if (act.type === ACT_TYPES.END) {
        _clearEngagedActsForEndAct(npc, act);
        return;
    }
    // Impact play needs a free hand: disengage any hand-slot act first.
    // Climax acts typed IMPACT (ejaculate_on_*) are release beats, not
    // rough play, and do NOT free the hand.
    if (act.type === ACT_TYPES.IMPACT && !act.triggersClimax) {
        npc.intimacy.engagedActs = getEngagedActs(npc).filter(e => e.slot !== "hand");
        return;
    }
    // Watersports needs the genitals free: disengage any genital act first.
    if (act.type === ACT_TYPES.WATERSPORT) {
        npc.intimacy.engagedActs = getEngagedActs(npc).filter(e => e.slot !== "genitals");
        return;
    }
    const slot = getIntimacyActSlot(act);
    if (!slot) return;
    const engaged = getEngagedActs(npc);
    npc.intimacy.engagedActs = engaged.filter(e => e.slot !== slot || e.actId === act.id);
    if (!isActEngaged(npc, act.id)) {
        npc.intimacy.engagedActs.push({ actId: act.id, slot: slot });
    }
}

async function executeIntimacyAction(npc, player, actId, positionId = null) {
    // Rebuild inventory-driven dynamic acts (toys/lube) first so their ids
    // resolve even if the menu was not re-rendered since the inventory changed.
    if (typeof collectIntimacyItemActs === "function") collectIntimacyItemActs(npc, player);
    if (!npc || !player || !hasAct(actId)) return null;
    
    const act = getAct(actId);
    // Always call initializeIntimacyState to ensure all properties exist
    const intimacy = initializeIntimacyState(npc);
    if (!intimacy) return null;
    
    const clothingState = intimacy.clothing;
    const currentPosition = positionId || intimacy.position.player;

    // Capture the previous act and depth BEFORE intimacy.lastAction and
    // intimacy.penetration are updated further down, so the NPC-response
    // gate can tell a fresh act (or act change) from plain continuation,
    // and can detect bottoming out (depth reaching the 5 cap this turn).
    var _prevActId = intimacy && intimacy.lastAction ? intimacy.lastAction.actId : null;
    var _prevDepth = (intimacy && intimacy.penetration) ? (intimacy.penetration.depth || 0) : 0;

    // Get encounter state for non-resisting checks
    const encounter = intimacy.encounter || {};

    // Bypass validation for non-resisting NPCs (unconscious/sleeping/bound)
    // All actions are allowed when the NPC cannot resist
    if (encounter.unconsciousIntimacy === true || encounter.isSleepingEncounter === true || 
        (npc.bound === true) || (npc._prisoner === true) || (npc._boundCaptiveFollower === true)) {
        // Skip action validation - all actions permitted
    } else {
        // Validate action
        if (!isActionValid(actId, npc, player, currentPosition, clothingState)) {
            console.warn(`[Intimacy] Action ${actId} is not valid in current state`);
            return null;
        }
    }
    
    // WAKE-UP ROLL FOR SLEEPING NPCS
    // Check if this is a sleeping encounter and roll for wake-up chance
    const isSleeping = encounter.isSleepingEncounter === true;
    
    if (isSleeping && act.type !== ACT_TYPES.CLOTHING && act.type !== ACT_TYPES.END) {
        // Determine wake-up chance based on NPC state
        let wakeUpChance = 0.7; // 70% base chance to wake from an act
        
        // Modify chance based on NPC state
        if (encounter._isIntoxicated === true) {
            wakeUpChance = 0.3; // 30% chance if intoxicated (drunk)
            console.log(`[Intimacy] Intoxicated sleeping NPC - reduced wake-up chance to ${wakeUpChance}`);
        }
        if (encounter._isExhausted === true) {
            wakeUpChance = 0.15; // 15% chance if exhausted (no stamina)
            console.log(`[Intimacy] Exhausted sleeping NPC - reduced wake-up chance to ${wakeUpChance}`);
        }
        
        // Roll for wake-up
        const rolledWakeUp = Math.random() < wakeUpChance;
        
        if (rolledWakeUp) {
            console.log(`[Intimacy] Sleeping NPC WAKE-UP! (rolled ${Math.random().toFixed(2)} < ${wakeUpChance})`);
            
            // NPC wakes up - end the sleeping encounter
            encounter.isSleepingEncounter = false;
            encounter.active = false;
            
            // Clear sleeping state from NPC
            if (npc.currentState) {
                npc.currentState.sleeping = false;
            }
            
            // Generate wake-up reaction based on NPC personality
            const reaction = generateSleepingWakeUpReaction(npc, player, actId);
            
            // Return a special result that includes the wake-up narration
            return {
                action: actId,
                type: "wakeup",
                responseText: reaction.narration,
                npcWokeUp: true,
                npcReaction: reaction.reaction,
                shouldEndEncounter: reaction.shouldEndEncounter
            };
        } else {
            console.log(`[Intimacy] Sleeping NPC stays asleep (rolled ${Math.random().toFixed(2)} >= ${wakeUpChance})`);
            
            // Add stamina recovery for exhausted NPCs during acts
            if (encounter._isExhausted === true && typeof npc.stamina === "number") {
                // Recover a bit of stamina each act
                const staminaRecovered = Math.min(5, Math.ceil(npc.staminaMax * 0.05));
                npc.stamina = Math.min(npc.staminaMax, npc.stamina + staminaRecovered);
                console.log(`[Intimacy] Exhausted NPC recovered ${staminaRecovered} stamina`);
                
                // If stamina recovers above 0, they're no longer exhausted
                if (npc.stamina > 0 && typeof isEntityExhausted === "function" && !isEntityExhausted(npc)) {
                    encounter._isExhausted = false;
                    console.log(`[Intimacy] NPC no longer exhausted - stamina recovered`);
                }
            }
        }
    }
    
    // Check cooldown for male characters (penetration and ejaculation actions)
    // Note: Oral penetration (mouth/lips) can continue even during cooldown
    const isOralTarget = act.target === "mouth" || act.target === "lips";
    const shouldCheckCooldown = (act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE || act.triggersClimax) && !isOralTarget;
    
    if (shouldCheckCooldown) {
        if (!checkCooldownForAction(npc, player, act)) {
            console.warn(`[Intimacy] Action ${actId} blocked: actor is on cooldown`);
            return null;
        }
    }
    
    // Update last activity
    updateLastActivity(npc);
    
    // Store last action for continuity (skip clothing and watersport actions —
    // they're not continuable, and setting lastAction to them causes the
    // Continue button to reference an invalid action).
    if (act.type !== ACT_TYPES.CLOTHING && act.type !== ACT_TYPES.WATERSPORT) {
        intimacy.lastAction = { actId, timestamp: Date.now() };
    }
    
    // Add to history (keep last 20 actions for prior action checking)
    intimacy.actionHistory.push({ actId, timestamp: Date.now() });
    if (intimacy.actionHistory.length > 20) {
        intimacy.actionHistory.shift();
    }
    
    // Track nipple play count for erection state progression
    var actTargetLower = String(act.target || "").toLowerCase();
    if (actTargetLower === "nipples" || actTargetLower === "breasts") {
        if (!intimacy.encounterFlags) intimacy.encounterFlags = {};
        intimacy.encounterFlags.nipplePlayCount = (intimacy.encounterFlags.nipplePlayCount || 0) + 1;
    }
    
    // Multi-act engagement: track which acts are ongoing (per body-tool
    // slot) so the menu can highlight them and Continue can continue them
    // all. See getIntimacyActSlot.
    _updateEngagedActsForAct(npc, act);

    // Lust progression: gender-based npc.memory.lust gain (or loss for
    // impact/watersports/anal below the disinhibition threshold).
    // See getIntimacyLustDelta.
    applyIntimacyLustGain(npc, act);

    // Handle clothing actions
    if (act.type === ACT_TYPES.CLOTHING) {
        const result = handleClothingAction(npc, player, act, clothingState);
        // Save the updated clothing state back to the NPC
        if (result && result.clothingState) {
            intimacy.clothing = result.clothingState;
        }
        return result;
    }
    
    // Handle end actions
    if (act.type === ACT_TYPES.END) {
        // Generic pull-out: withdraw from current penetration with narration
        if (actId === "pull_out_generic") {
            // Pull-out is a first-class beat, like penetration: an
            // AI-authored version (cached per position+target) is used
            // when available, and a fresh one is prefetched for the next
            // withdrawal. The canned endPenetrationWithNarration text is
            // the base.
            var _pullPosition = positionId || (intimacy && intimacy.position && intimacy.position.player) || "Unknown";
            var _pullSnapshot = buildPullOutSnapshot(npc, player, intimacy);
            var _pullCacheKey = (_pullSnapshot.tool || "none") + "||" + (_pullSnapshot.target || "none");
            var _cachedPullOut = getCachedPenetrationResponse(intimacy, "pull_out_generic", _pullPosition, _pullCacheKey);
            if (_cachedPullOut) {
                purgeCachedPenetrationResponse(intimacy, "pull_out_generic", _pullPosition, _pullCacheKey);
            }
            var pullOutNarrative = _cachedPullOut
                ? endPenetrationWithNarration(npc, player, intimacy, "pull out", { narrative: _cachedPullOut })
                : endPenetrationWithNarration(npc, player, intimacy, "pull out");
            if (pullOutNarrative) {
                prefetchPullOutEnhancement(npc, player, intimacy, _pullPosition, _pullSnapshot, pullOutNarrative);
                return { action: actId, type: "end", responseText: pullOutNarrative };
            }
            // No active penetration — nothing to pull out from
            return { action: actId, type: "end", responseText: "" };
        }
        if (actId === "stop") {
            endIntimacyEncounter(npc);
        }
        var endResponse = generateEndResponse(npc, player, act);
        // Pull-out end acts report penetrationEnded — actually clear the
        // penetration state here. generateEndResponse only sets the flag;
        // leaving intimacy.penetration active after a pull-out kept the
        // menu offering pull-out/continue and made later acts (and the
        // auto pull-out switch logic) think the player was still inside.
        if (endResponse && endResponse.penetrationEnded && intimacy && intimacy.penetration) {
            intimacy.lastPenetration = { tool: intimacy.penetration.tool, target: intimacy.penetration.target, at: Date.now() };
            intimacy.penetration.active = false;
            intimacy.penetration.tool = null;
            intimacy.penetration.target = null;
            intimacy.penetration.depth = 0;
        }
        return endResponse;
    }

    // Handle watersports actions
    if (act.type === ACT_TYPES.WATERSPORT) {
        // Watersports early-returns below, so record the room puddle here:
        // the piss lands in this room and persists ~20 turns.
        if (act.playerIsBottom !== true && typeof G !== "undefined" && G.activeRoom && String(act.consequence || "") === "urine") {
            addRoomMess(G.activeRoom, "urine");
        }
        // Update arousal (negative for NPC)
        updateArousal(npc, player, act.arousal);
        // Track fluid consequence
        if (act.consequence) {
            handleFluidConsequence(npc, player, act.consequence, intimacy);
        }
        // Generate NPC response (mostly negative)
        const response = await generateActionResponse(npc, player, act, intimacy, currentPosition);
        return response;
    }

    // Physical acts cost the player a little stamina (see
    // spendIntimacyStamina near getPlayerCockSize). Raging Bull makes it
    // free via the engine-side guard in spendEntityStamina - no
    // special-casing needed here.
    spendIntimacyStamina(player, INTIMACY_STAMINA_COST_PER_ACT, true);

    // Handle penetration actions
    if (act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE || act.type === ACT_TYPES.END) {
        // EARLY-ANAL RESISTANCE: a cold attempt at anal sex is rebuffed
        // with a tense push-back instead of quiet acceptance. Coaxing
        // (prep beats, lube, very high arousal, experience) lifts the
        // gate. Finger/tongue entry is itself prep, so only the cock
        // is gated.
        var _toolLower = String(act.tool || "").toLowerCase();
        var _targetLower = String(act.target || "").toLowerCase();
        if (act.type === ACT_TYPES.PENETRATE && act.playerIsBottom !== true &&
            (_toolLower === "penis" || _toolLower === "cock") &&
            (_targetLower === "anus" || _targetLower === "ass") &&
            !analReadinessPassed(npc, act, intimacy) &&
            // A bound captive cannot push back; an unconscious/sleeping NPC
            // cannot either. The rebuff gate is for free, conscious NPCs
            // who need coaxing.
            !(npc.bound && npc.surrendered) && !npcCannotSpeak(npc)) {
            if (!intimacy.encounterFlags) intimacy.encounterFlags = {};
            intimacy.encounterFlags.analRebuffCount = (intimacy.encounterFlags.analRebuffCount || 0) + 1;
            // The failed attempt is not continuable and not engaged.
            intimacy.lastAction = null;
            if (Array.isArray(intimacy.engagedActs)) {
                intimacy.engagedActs = intimacy.engagedActs.filter(function (e) { return e && e.actId !== actId; });
            }
            // Pushing again after she has said no sours the mood a little.
            if (intimacy.encounterFlags.analRebuffCount > 1 && intimacy.arousal) {
                intimacy.arousal.npc = Math.max(0, (intimacy.arousal.npc || 0) - 20);
            }
            var _rebuff = buildAnalRebuffLine(npc, player, intimacy);
            if (!Array.isArray(intimacy._recentScene)) intimacy._recentScene = [];
            intimacy._recentScene.push(String(_rebuff).trim());
            intimacy._recentScene = intimacy._recentScene.slice(-4);
            return { action: actId, type: act.type, responseText: _rebuff };
        }
        handlePenetrationAction(npc, player, act, intimacy, actId);
        
        // Check for accidental peeing during anal (only once per encounter, after first penetration)
        if (act.target === "anus" || act.target === "ass" || actId.includes("anus") || actId.includes("anal")) {
            const penetrationDepth = intimacy.penetration ? intimacy.penetration.depth : 0;
            const hasPeeAlready = intimacy.encounterFlags && intimacy.encounterFlags.hasAnalPee;
            const shouldAccidentalPee = penetrationDepth > 0 && !hasPeeAlready && Math.random() < 0.12;
            
            if (shouldAccidentalPee) {
                // Set the flag so it only happens once per encounter
                if (!intimacy.encounterFlags) intimacy.encounterFlags = {};
                intimacy.encounterFlags.hasAnalPee = true;
                
                // Store pee event to be added to response
                if (!intimacy.pendingEvents) intimacy.pendingEvents = [];
                intimacy.pendingEvents.push({ type: "analPee", actId });
            }
        }
    }
    
    // Handle virginity loss
    var wasVirgin = false;
    if (act.takesVirginity) {
        // Check virginity BEFORE losing it so the response knows
        if (npc.intimacy && npc.intimacy.virginity) {
            for (const vtype of act.takesVirginity) {
                if (vtype === VIRGINITY_TYPES.VAGINAL && npc.intimacy.virginity.vaginal) wasVirgin = true;
                if (vtype === VIRGINITY_TYPES.ANAL && npc.intimacy.virginity.anal) wasVirgin = true;
            }
        }
        handleVirginityLoss(npc, act.takesVirginity);
    }
    
    // Handle lube mechanics: certain actions add lube to specific body parts
    handleLubeFromAction(npc, act);

    // Adjust NPC arousal for anal actions: females generally get less pleasure
    // from anal, and shouldn't climax from it unless they have bold/forward
    // temperament AND some anal experience (anus size is supple/loose/stretchy).
    var adjustedArousal = act.arousal;
    if (act.target === "anus" || act.target === "ass" || actId.includes("anal") || actId.includes("anus")) {
        var npcGender = (npc.gender || "female").toLowerCase();
        var temperament = String(npc.temperament || "").toLowerCase();
        var isBold = temperament === "forward" || temperament === "bold" || temperament === "lustful";
        var anusAnat = (npc.anatomy && npc.anatomy.anus) || {};
        var hasAnalExperience = anusAnat.size === "supple" || anusAnat.size === "loose" || anusAnat.size === "stretchy" || anusAnat.size === "gaping";
        // Female NPCs: reduce anal arousal to 30% of normal. Bold + experienced:
        // 60%. Bold + inexperienced: 40%. Non-female: no reduction.
        if (npcGender === "female" || npcGender.includes("female")) {
            var analMultiplier = isBold && hasAnalExperience ? 0.6 : isBold ? 0.4 : 0.3;
            adjustedArousal = {
                p: (act.arousal.p || 0),
                n: Math.floor((act.arousal.n || 0) * analMultiplier)
            };
        }
    }

    // Update arousal
    // ── NPC-LED PLEASURE LOOP ─────────────────────────────────────────
    // While the NPC services the player (engine-side oral/stroke loop),
    // every beat aims him at climax: a growing arousal bonus rides on top
    // of the act's base player arousal so the scene builds to
    // ejaculation within a handful of beats instead of ~15.
    if (intimacy.npcPleasureLoop && intimacy.npcPleasureLoop.active) {
        var _pleasureLoopBonus = 70 + 45 * Math.min((intimacy.npcPleasureLoop.beats || 0), 8);
        adjustedArousal = { p: (adjustedArousal.p || 0) + _pleasureLoopBonus, n: (adjustedArousal.n || 0) };
    }

    const arousalResult = updateArousal(npc, player, adjustedArousal);
    
    // Check for climax triggers (either from act or from arousal threshold)
    let climaxResult = null;
    if (act.triggersClimax || arousalResult.playerClimax || arousalResult.npcClimax) {
        climaxResult = handleClimax(npc, player, act, intimacy);
    }
    
    // Handle fluid/consequence from act
    if (act.consequence) {
        handleFluidConsequence(npc, player, act.consequence, intimacy);
    }
    
    // Player mouth on the NPC penis: saliva for part portraits.
    // requiresNpcMale separates NPC-penis acts from player-penis acts.
    if (act.tool === "mouth" && act.target === "penis" && act.requiresNpcMale && intimacy.fluids) {
        intimacy.fluids.penisSaliva = true;
    }
    // Generate response
    // Store virginity flag so buildPenetrationResponse can use it
    if (wasVirgin) intimacy._wasVirgin = true;
    // Decide the NPC-response gate BEFORE generating, so a suppressed beat
    // skips the live AI call entirely (the template is cheap; the AI call is
    // not). The gate block further below reuses these precomputed values —
    // the Math.random() roll must happen exactly once.
    var _gateForceNarrate = act.playerIsBottom === true || !!(intimacy && intimacy._autoBeatNarrate);
    var _gateIsNewAct = _prevActId !== act.id;
    var _gateIsFirstPen = act.type === ACT_TYPES.PENETRATE;
    var _gateBottomedOut = act.type === ACT_TYPES.CONTINUE
        && (intimacy.penetration ? (intimacy.penetration.depth || 0) : 0) >= 5
        && _prevDepth < 5;
    var _gateRoll = Math.random() < 0.2;
    var _gateRespond = _gateForceNarrate || _gateIsNewAct || _gateIsFirstPen || _gateBottomedOut || _gateRoll;
    const response = await generateActionResponse(npc, player, act, intimacy, currentPosition, {
        suppressResponse: !!climaxResult === false && !_gateRespond
    });
    if (intimacy._wasVirgin) delete intimacy._wasVirgin;

    // Prepend any pending pull-out narrative from an auto-pull-out triggered by
    // an orifice switch (set in handlePenetrationAction). The pull-out happens
    // before the new penetration, so it leads the response.
    if (intimacy.pendingPullOutNarrative) {
        response.responseText = intimacy.pendingPullOutNarrative + ' ' + (response.responseText || '');
        delete intimacy.pendingPullOutNarrative;
    }

    // Add climax info to response if applicable
    if (climaxResult) {
        response.climax = climaxResult;
        
        // Integrate NPC climax reaction into response text (skipped when the
        // NPC cannot speak — an unconscious climax is purely physical)
        if (climaxResult.npcReaction && !npcCannotSpeak(npc) && !response.responseText.includes(climaxResult.npcReaction)) {
            // Append NPC reaction to the response
            const separator = response.responseText && !response.responseText.endsWith('.') ? '. ' : ' ';
            response.responseText = (response.responseText || '') + separator + climaxResult.npcReaction;
        }
        
        // Add player climax notification if applicable
        if (climaxResult.playerClimax) {
            const playerGender = getPlayerGenderForGates(player);
            if (playerGender === "male" || playerGender.includes("male")) {
                if (!response.responseText.includes("You climax") && !response.responseText.includes("you climax")) {
                    var _maleClimaxBeat = buildMaleClimaxNarration(npc, player, act, intimacy);
                    if (_maleClimaxBeat) {
                        response.responseText = (response.responseText || '') + ' ' + _maleClimaxBeat;
                    } else {
                        response.responseText = (response.responseText || '') + " You climax intensely.";
                    }
                }
            } else {
                // Female player: her organic climax (arousal crossing
                // the cap without a climax button) draws a full release
                // beat from the plain orgasm pools — building and
                // release, in her stimulation context. Squirting never
                // happens here; it is her explicit choice ("Squirt") only.
                if (!response.responseText.includes("You climax") && !response.responseText.includes("you climax")) {
                    var _organicBeat = buildPlayerOrgasmNarration(npc, player, { id: "player_orgasm" }, intimacy);
                    if (_organicBeat) {
                        response.responseText = (response.responseText || '') + ' ' + _organicBeat;
                    } else {
                        response.responseText = (response.responseText || '') + " You reach a powerful orgasm.";
                    }
                }
            }
        }
    }

    // ── NPC RESPONSE GATE ─────────────────────────────────────────────
    // The NPC shouldn't visibly react to every single click. Reactions land
    // on act changes and first penetration; plain continuation of the same
    // act (hammering the same button) only draws a reaction on notable
    // beats — bottoming out this turn, a climax — or an occasional
    // one-in-five filler. END/pull-out acts return before this point, and
    // climax reactions are exempt, so withdrawal narratives and climax
    // beats never get swallowed by the gate.
    if (response.responseText && !climaxResult) {
        // Receive acts and auto-continue beats ALWAYS narrate. The receive
        // flow's performance beat IS the scene — a suppressed beat there is
        // a silent no-op click (no ask, no lead-in, nothing printed). An
        // auto-chained beat exists precisely to extend the scene. The
        // anti-spam suppression below stays for manual repeats in the
        // generic flow, where the player's action line still prints.
        // _gateRespond was computed before generateActionResponse so a
        // suppressed beat never paid for a live AI call.
        if (intimacy && intimacy._autoBeatNarrate) delete intimacy._autoBeatNarrate;
        if (!_gateRespond) {
            response.responseText = "";
            response._npcResponseSuppressed = true;
        }
    }

    // Progression: grant player charisma XP and raise the NPC's per-body-
    // category disinhibition so this act counts toward unlocking more
    // advanced acts in the same category. See _grantIntimacyProgression.
    _grantIntimacyProgression(npc, player, act);

    // An unconscious/sleeping NPC cannot speak: skip every verbal beat
    // (submission lines, consent hints, moans, requests, demands).
    var _cannotSpeak = npcCannotSpeak(npc);

    // SLAVE SUBMISSION FLAVOR: the player's acts on a collared slave
    // are commands; compliance is voiced per temperament. Fired at half
    // frequency so it seasons the scene rather than wallpapering it.
    if (!_cannotSpeak && npc.enslaved && act.playerIsBottom !== true && Math.random() < 0.5) {
        var _submission = buildSlaveSubmissionLine(npc);
        if (_submission && response) {
            response.responseText = ((response.responseText || "") + " " + _submission).trim();
        }
    }

    // ── ROOM MESS: puddles persist where they land ───────────────────
    // Watersports, external finishes and squirting leave a puddle in the
    // room for ~20 turns (see addRoomMess); internal loads surface when
    // they leak back out (endPenetrationWithNarration).
    if (act.playerIsBottom !== true && typeof G !== "undefined" && G.activeRoom) {
        var _messKind = null;
        var _messC = String(act.consequence || "");
        if (_messC === "urine") _messKind = "urine";
        else if (_messC === "external_semen") _messKind = "semen";
        else if (_messC === "female_ejaculate") _messKind = "squirt";
        if (_messKind) addRoomMess(G.activeRoom, _messKind);
    }

    // ── CONSENT HINTS ─────────────────────────────────────────────────
    // Her visible reaction to intimate touching - hesitant, warming,
    // welcoming - paced to fire on first touches and band crossings.
    var _consentHint = _cannotSpeak ? null : maybeConsentHint(npc, act, intimacy);
    if (_consentHint && response) {
        response.responseText = ((response.responseText || "") + " " + _consentHint).trim();
    }
    // Bottomed-out thrusts/fucks/pounds draw moans out of her.
    var _depthMoan = _cannotSpeak ? null : maybeFullDepthMoan(npc, act, intimacy);
    if (_depthMoan && response) {
        response.responseText = ((response.responseText || "") + " " + _depthMoan).trim();
    }

    // ── NPC INITIATIVE ─────────────────────────────────────────────
    // After foreplay, a lustful NPC may ask the player for intercourse
    // (see maybeNpcIntercourseRequest). Appended AFTER the response gate
    // so the request plays even on suppressed beats — her asking is the
    // beat, and a suppressed reaction followed by "fuck me" reads as
    // her breaking the rhythm on purpose.
    var _sexRequest = _cannotSpeak ? null : maybeNpcIntercourseRequest(npc, player, act, intimacy);
    if (_sexRequest && response) {
        // Voice the request in her established speech patterns (AI pass,
        // canned-register fallback), then append and record it so later
        // beats' prompts know she asked.
        var _reqTarget = (intimacy.encounterFlags && intimacy.encounterFlags.npcSexRequest)
            ? intimacy.encounterFlags.npcSexRequest.target : null;
        _sexRequest = await voiceNpcIntercourseRequest(npc, _reqTarget, _sexRequest);
        response.responseText = ((response.responseText || "") + " " + _sexRequest).trim();
        if (!Array.isArray(intimacy._recentScene)) intimacy._recentScene = [];
        intimacy._recentScene.push(String(_sexRequest).trim());
        intimacy._recentScene = intimacy._recentScene.slice(-4);
    }
    // NEGLECT DEMAND (SotB-style NPC initiative): track beats where her
    // pleasure is ignored; at high arousal she pulls away and demands
    // attention. Appended after the response gate so the demand plays
    // even on suppressed beats.
    updateNeglectStreak(npc, act, intimacy, (adjustedArousal && adjustedArousal.n) || 0, !!(climaxResult && climaxResult.npcClimax));
    var _neglectDemand = _cannotSpeak ? null : maybeNpcNeglectDemand(npc, player, intimacy);
    if (_neglectDemand && response) {
        response.responseText = ((response.responseText || "") + " " + _neglectDemand).trim();
        if (!Array.isArray(intimacy._recentScene)) intimacy._recentScene = [];
        intimacy._recentScene.push(String(_neglectDemand).trim());
        intimacy._recentScene = intimacy._recentScene.slice(-4);
    }

    // Grime + smell for the messy acts. Ejaculation, watersports and anal
    // penetration add a HIGH tier of grime (see the GRIME/HYGIENE block in
    // cyoaftw-engine-CORE.js), and mark whoever RECEIVED - the NPC for
    // regular acts, the player for playerIsBottom "Receive" acts - with a
    // lingering smell note (addSmellMark below) that surfaces in the AI
    // conversation context and the NPC detail panel until it fades or is
    // washed off. typeof-guarded no-op if the engine hook is absent.
    const smellKey = getIntimacySmellKey(act);
    if (typeof window.addIntimacyActGrime === "function") {
        window.addIntimacyActGrime(player, { highTier: smellKey !== null });
    }
    if (smellKey) {
        addSmellMark(act.playerIsBottom === true ? player : npc, smellKey);
    }

    // Per-part body-use record for the receiving NPC: a hole that was
    // recently fucked reads differently in later insertion descriptors
    // (see getBodyUseDescriptor/recordBodyUse above). Internal/oral semen
    // and urine count as a lingering load on the part.
    // Spit acts are lubrication, not use of the hole - recording them
    // made the target read as orally used on the next act.
    var _isSpitAct = String(act.verb || "").toLowerCase() === "spit on" ||
        String(act.id || "").indexOf("spit_on") === 0;
    if (act.playerIsBottom !== true && !_isSpitAct) {
        const bodyPart = normalizeBodyUsePart(act.target);
        if (bodyPart) {
            const consequence = String(act.consequence || "");
            const loadKey = (consequence === "internal_semen" || consequence === "oral_semen")
                ? "semen"
                : (consequence === "urine" ? "urine" : null);
            recordBodyUse(npc, bodyPart, { loadKey: loadKey, useKind: getIntimacyUseKind(act) });
        }
    }

    return response;
}

/**
 * Handle clothing removal/adjustment actions
 */
function handleClothingAction(npc, player, act, clothingState) {
    if (!act.clothingItem && !act.clothingAction) {
        // Bulk undress
        if (act.target === "player") {
            clothingState.player = { top: false, bottom: false };
        } else if (act.target === "npc") {
            clothingState.npc = { top: false, bottom: false };
        }
    } else {
        // Specific item action
        const targetClothing = act.target === "player" ? clothingState.player : clothingState.npc;
        
        if (act.clothingAction === "move_aside" || act.clothingAction === "lift" || act.clothingAction === "pull_down") {
            // These are adjustment actions - clothing stays on but is moved
            // For now, we'll treat them as removing the item
            targetClothing[act.clothingItem] = false;
        } else {
            // Remove action
            targetClothing[act.clothingItem] = false;
        }
        // Underwear does not map to a real equipment slot — the undergarments
        // layer comes off together with the bottom (remove or pull down), so
        // the NUDE clothing requirement stays reachable without a separate
        // underwear act.
        if (act.clothingItem === "bottom") {
            targetClothing.undergarments = false;
        }
    }
    
    // Real undressing: removal acts drop the actual worn item into the
    // current room so the clothes land on the floor and can be picked up
    // again. Adjustment acts (move_aside/lift/pull_down) keep the garment
    // ON the body, so they drop nothing.
    if (typeof window !== "undefined" && typeof window.dropWornClothingToRoom === "function") {
        var _who = act.target === "player" ? player : npc;
        if (_who) {
            var _slotMap = { top: "upper", bottom: "lower" };
            var _slots = [];
            if (!act.clothingItem && !act.clothingAction) {
                // Bulk undress: everything worn, feet included
                _slots = ["upper", "lower", "feet"];
            } else if (!act.clothingAction && _slotMap[act.clothingItem]) {
                _slots = [_slotMap[act.clothingItem]];
            }
            _slots.forEach(function (slot) {
                var dropped = window.dropWornClothingToRoom(_who, slot);
                if (dropped && dropped.name) {
                    console.log("[Intimacy Clothing] dropped", dropped.name, "into the room");
                }
            });
        }
    }

    return {
        action: act.id,
        type: "clothing",
        clothingState: { ...clothingState }
        // No text field: the engine's generateIntimacyNarrative already builds
        // the player narration (via buildClothingNarration). Returning text
        // here causes duplicate narration when the engine combines them.
    };
}

/**
 * Handle penetration state changes
 */
function handlePenetrationAction(npc, player, act, intimacy, actId) {
    if (act.type === ACT_TYPES.PENETRATE) {
        // Start penetration
        // playerIsBottom indicates if player is receiving penetration
        const playerIsBottom = act.playerIsBottom || false;
        
        // Check if already penetrating a different orifice - if so, need to pull out first
        // (This should be caught by checkActionValidity, but add safety check here)
        if (intimacy.penetration.active) {
            const currentTarget = intimacy.penetration.target;
            const newTarget = act.target;
            
            // Allow compatible targets (vagina/pussy, anus/ass, etc.)
            const compatibleTargets = {
                vagina: ["pussy", "clitoris", "clit"],
                pussy: ["vagina", "clitoris", "clit"],
                anus: ["ass", "butthole"],
                ass: ["anus", "butthole"],
                mouth: ["lips"],
                lips: ["mouth"]
            };
            
            const isCompatible = currentTarget && newTarget && 
                (currentTarget === newTarget || 
                 (compatibleTargets[currentTarget] && compatibleTargets[currentTarget].includes(newTarget)));
            
            // If switching to an incompatible orifice, auto-pull-out with narration
            // before starting the new penetration. The narrative is stashed on
            // intimacy.pendingPullOutNarrative so executeIntimacyAction can prepend
            // it to the response text.
            if (!isCompatible) {
                console.log(`[Intimacy] Auto pull-out from ${currentTarget} before switching to ${newTarget}`);
                var switchPullOut = endPenetrationWithNarration(npc, player, intimacy, "forced switch");
                if (switchPullOut) {
                    intimacy.pendingPullOutNarrative = switchPullOut;
                }
                // endPenetrationWithNarration clears intimacy.lastAction; restore it
                // so the new penetration becomes the continuable last action.
                intimacy.lastAction = { actId: actId, timestamp: Date.now() };
            }
        }
        
        intimacy.penetration = {
            active: true,
            tool: act.tool,
            target: act.target,
            depth: 1,
            startedAt: Date.now(),
            playerIsBottom: playerIsBottom,
            actId: actId
        };
        // A new penetration starts: any previous pull-out aftermath is stale.
        intimacy.lastPenetration = null;
        
        // Consume lube when penetration starts
        consumeLubeForPenetration(npc, act);
    } else if (act.type === ACT_TYPES.CONTINUE) {
        // Continue penetration
        if (intimacy.penetration.active) {
            intimacy.penetration.depth = Math.min(intimacy.penetration.depth + 1, 5);
            
            // Consume lube for continued penetration
            consumeLubeForPenetration(npc, act);
        }
    }
}

/**
 * Handle virginity loss
 */
function handleVirginityLoss(npc, virginityTypes) {
    if (!npc.intimacy) return;
    
    for (const type of virginityTypes) {
        if (type === VIRGINITY_TYPES.VAGINAL) {
            npc.intimacy.virginity.vaginal = false;
        } else if (type === VIRGINITY_TYPES.ANAL) {
            npc.intimacy.virginity.anal = false;
        }
    }
    
    console.log(`[Intimacy] ${npc.name || 'NPC'} lost virginity: ${virginityTypes.join(', ')}`);
}

/**
 * Handle lube addition from specific actions
 * Licking/rimming and ejaculating on body parts adds lubrication
 */
function handleLubeFromAction(npc, act) {
    if (!npc || !act) return;
    
    // Actions that add lube to vagina
    const vaginaLubeActions = [
        "lick_pussy", "tongue_pussy", "suck_clit",
        "lick_player_pussy", "suck_player_clit", "spit_on_vagina"
    ];
    
    // Actions that add lube to anus
    const anusLubeActions = [
        "lick_anus", "suck_anus", "rim_anus", "tongue_anus",
        "lick_player_anus", "rim_player_anus", "spit_on_anus"
    ];
    
    // Actions that add lube to mouth
    const mouthLubeActions = [
        "lick_penis", "suck_penis", "deepthroat_penis",
        "lick_balls", "suck_balls", "accept_penis_mouth"
    ];
    
    // Ejaculation actions - add lube to the target body part
    const ejaculationActions = {
        "ejaculate_on_face": "general",
        "ejaculate_on_chest": "general",
        "ejaculate_on_stomach": "general",
        "ejaculate_on_butt": "anus",
        "ejaculate_on_back": "general",
        "ejaculate_on_legs": "general",
        "ejaculate_on_feet": "general",
        "ejaculate_in_vagina": "vagina",
        "ejaculate_in_anus": "anus",
        "ejaculate_in_mouth": "mouth",
        "fuck_mouth": "mouth"
    };
    
    // Check for vagina lube actions
    if (vaginaLubeActions.includes(act.id)) {
        addLube(npc, "vagina", 50);
    }
    
    // Check for anus lube actions
    if (anusLubeActions.includes(act.id)) {
        addLube(npc, "anus", 50);
    }
    
    // Check for mouth lube actions
    if (mouthLubeActions.includes(act.id)) {
        addLube(npc, "mouth", 50);
    }
    
    // Check for ejaculation actions
    if (ejaculationActions[act.id]) {
        const targetPart = ejaculationActions[act.id];
        addLube(npc, targetPart, 80);
    }
    
    // Add natural lubrication based on arousal and stimulation
    handleNaturalLubrication(npc, act);
}

/**
 * Consume lube for penetration actions
 * Determines which body part needs lube based on the penetration target
 */
function consumeLubeForPenetration(npc, act) {
    if (!npc || !npc.intimacy || !npc.intimacy.lube) return;
    
    const target = act.target || "";
    const tool = act.tool || "";
    const actIdLower = (act.id || "").toLowerCase();
    
    // Determine which body part's lube to consume
    let lubePart = "general";
    
    // For penetration, the target is what's being penetrated
    if (target === "vagina" || target === "pussy" || target === "clitoris" ||
        actIdLower.includes("pussy") || actIdLower.includes("vagina") || actIdLower.includes("clitoris") ||
        actIdLower.includes("clit") || actIdLower.includes("fold")) {
        lubePart = "vagina";
    } else if (target === "anus" || target === "buttocks" || target === "butt" || target === "ass" ||
               actIdLower.includes("anal") || actIdLower.includes("anus") || actIdLower.includes("butt") || actIdLower.includes("ass")) {
        lubePart = "anus";
    } else if (target === "mouth" || target === "lips" || target === "face" ||
               actIdLower.includes("mouth") || actIdLower.includes("oral") || actIdLower.includes("kiss")) {
        lubePart = "mouth";
    }
    
    // Consume lube from the appropriate body part
    useLube(npc, lubePart, 5);
    
    console.log(`[Intimacy] Consumed lube from ${lubePart} for penetration`);
}

/**
 * Handle climax/organism for player and/or NPC
 * Returns info about what happened
 */
function handleClimax(npc, player, act, intimacy) {
    if (!npc.intimacy) return null;
    
    const result = {
        playerClimax: false,
        npcClimax: false,
        cooldownApplied: false,
        pregnancyRisk: false,
        pregnancyRolled: false,
        pregnant: false
    };
    
    // Determine gender
    const playerGender = getPlayerGenderForGates(player);
    const npcGender = (npc.gender || "female").toLowerCase();
    
    // Check if player climaxed
    if (intimacy.arousal.player >= AROUSAL_CONFIG.ORGASM_THRESHOLD) {
        result.playerClimax = true;
        intimacy.arousal.player = Math.max(0, intimacy.arousal.player - (AROUSAL_CONFIG.ORGASM_THRESHOLD * 0.7));
        intimacy.climax.playerOrgasms++;
        intimacy.climax.lastPlayerClimax = Date.now();
        spendIntimacyStamina(player, INTIMACY_STAMINA_COST_CLIMAX, true);
        
        // Apply cooldown for males
        if (playerGender === "male") {
            const cooldownDuration = determineMaleCooldown(intimacy.climax.playerOrgasms);
            intimacy.climax.playerCooldownUntil = Date.now() + cooldownDuration;
            result.cooldownApplied = true;
            result.playerCooldownUntil = intimacy.climax.playerCooldownUntil;
        }
    }
    
    // Check if NPC climaxed
    if (intimacy.arousal.npc >= AROUSAL_CONFIG.ORGASM_THRESHOLD) {
        result.npcClimax = true;
        intimacy.arousal.npc = Math.max(0, intimacy.arousal.npc - (AROUSAL_CONFIG.ORGASM_THRESHOLD * 0.7));
        intimacy.climax.npcOrgasms++;
        intimacy.climax.lastNPCClimax = Date.now();
        // NPC with a penis climaxed: semen left on their own penis (part portraits)
        if ((npcGender === "male" || (npc.anatomy && (npc.anatomy.penis || npc.anatomy.cock))) && intimacy.fluids) intimacy.fluids.penisSemen = true;
        spendIntimacyStamina(npc, INTIMACY_STAMINA_COST_CLIMAX, false);
        
        // Apply cooldown for male NPCs
        if (npcGender === "male") {
            const cooldownDuration = determineMaleCooldown(intimacy.climax.npcOrgasms);
            intimacy.climax.npcCooldownUntil = Date.now() + cooldownDuration;
            result.cooldownApplied = true;
        }
    }
    
    // Check for pregnancy risk if internal ejaculation occurred
    if (act.consequence === CLIMAX_CONFIG.CONSEQUENCE_TYPES.INTERNAL_SEMEN) {
        if (npcGender === "female" && playerGender === "male") {
            result.pregnancyRisk = checkPregnancyRisk(npc);
            if (result.pregnancyRisk) {
                result.pregnancyRolled = true;
                result.pregnant = attemptPregnancy(npc);
            }
        }
        // Track internal ejaculation target for semen drip narratives
        // Extract target from action ID (e.g., "ejaculate_in_vagina" -> "vagina")
        const ejaculationTarget = act.id ? act.id.replace("ejaculate_in_", "").replace("ejaculate_on_", "") : null;
        if (ejaculationTarget && (ejaculationTarget === "vagina" || ejaculationTarget === "anus")) {
            intimacy.climax.lastInternalEjaculation = ejaculationTarget;
            intimacy.climax.hasInternalEjaculation = true;
            result.internalEjaculation = ejaculationTarget;
            // Track anal ejaculation count for "full bowels" effects
            if (ejaculationTarget === "anus") {
                if (!intimacy.encounterFlags) intimacy.encounterFlags = {};
                intimacy.encounterFlags.analEjaculationCount = (intimacy.encounterFlags.analEjaculationCount || 0) + 1;
            }
        }
    } else if (act.consequence === CLIMAX_CONFIG.CONSEQUENCE_TYPES.ORAL_SEMEN) {
        // Track oral ejaculation target for semen drip narratives on pull-out
        const ejaculationTarget = act.id ? act.id.replace("ejaculate_in_", "").replace("ejaculate_on_", "") : null;
        if (ejaculationTarget === "mouth") {
            intimacy.climax.lastInternalEjaculation = "mouth";
            intimacy.climax.hasInternalEjaculation = true;
            result.internalEjaculation = "mouth";
        }
    }
    
    // Generate NPC climax reaction
    if (result.npcClimax) {
        result.npcReaction = generateNPCClimaxReaction(npc, npcGender, intimacy);
    }
    
    console.log(`[Intimacy] Climax: Player=${result.playerClimax}, NPC=${result.npcClimax}, Cooldown=${result.cooldownApplied}, PregnancyCheck=${result.pregnancyRolled}`);
    
    return result;
}

/**
 * Determine male cooldown duration based on orgasm count
 */
function determineMaleCooldown(orgasmCount) {
    if (orgasmCount >= 5) return CLIMAX_CONFIG.MALE_COOLDOWN_EXHAUSTED;
    if (orgasmCount >= 3) return CLIMAX_CONFIG.MALE_COOLDOWN_LONG;
    if (orgasmCount >= 2) return CLIMAX_CONFIG.MALE_COOLDOWN_NORMAL;
    return CLIMAX_CONFIG.MALE_COOLDOWN_SHORT;
}

/**
 * Handle fluid/consequence from climax actions
 */
function handleFluidConsequence(npc, player, consequenceType, intimacy) {
    if (!npc.intimacy || !CLIMAX_CONFIG.CONSEQUENCE_TYPES[consequenceType]) return;
    
    // Track what happened in this encounter
    switch (consequenceType) {
        case CLIMAX_CONFIG.CONSEQUENCE_TYPES.INTERNAL_SEMEN:
            intimacy.fluids.internalSemen = true;
            break;
        case CLIMAX_CONFIG.CONSEQUENCE_TYPES.ORAL_SEMEN:
            intimacy.fluids.oralSemen = true;
            break;
        case CLIMAX_CONFIG.CONSEQUENCE_TYPES.EXTERNAL_SEMEN:
            intimacy.fluids.externalSemen = true;
            break;
        case CLIMAX_CONFIG.CONSEQUENCE_TYPES.FEMALE_EJACULATE:
            intimacy.fluids.femaleEjaculate = true;
            break;
        case CLIMAX_CONFIG.CONSEQUENCE_TYPES.URINE:
            intimacy.fluids.urine = true;
            break;
    }
    
    console.log(`[Intimacy] Fluid consequence: ${consequenceType}`);
}

/**
 * Check if actor is on cooldown for a specific action
 * Only applies to male characters
 */
function checkCooldownForAction(npc, player, act) {
    const playerGender = getPlayerGenderForGates(player);
    const npcGender = (npc.gender || "female").toLowerCase();
    
    // Only males have cooldown
    if (playerGender !== "male" && npcGender !== "male") return true;
    
    const isPlayerActor = !act.playerIsBottom;
    
    if (isPlayerActor && playerGender === "male") {
        // Player is male actor - check player cooldown
        if (npc.intimacy && npc.intimacy.climax && npc.intimacy.climax.playerCooldownUntil) {
            if (Date.now() < npc.intimacy.climax.playerCooldownUntil) {
                return false;
            }
        }
    } else if (!isPlayerActor && npcGender === "male") {
        // NPC is male actor - check NPC cooldown
        if (npc.intimacy && npc.intimacy.climax && npc.intimacy.climax.npcCooldownUntil) {
            if (Date.now() < npc.intimacy.climax.npcCooldownUntil) {
                return false;
            }
        }
    }
    
    return true;
}

/**
 * Check if a specific character (player or NPC) is on cooldown
 */
function isOnCooldown(npc, player, isPlayer = true) {
    if (!npc || !npc.intimacy || !npc.intimacy.climax) return false;
    
    const cooldownUntil = isPlayer ? 
        npc.intimacy.climax.playerCooldownUntil : 
        npc.intimacy.climax.npcCooldownUntil;
    
    if (!cooldownUntil) return false;
    return Date.now() < cooldownUntil;
}

/**
 * Get remaining cooldown time in milliseconds
 */
function getRemainingCooldown(npc, player, isPlayer = true) {
    if (!npc || !npc.intimacy || !npc.intimacy.climax) return 0;
    
    const cooldownUntil = isPlayer ? 
        npc.intimacy.climax.playerCooldownUntil : 
        npc.intimacy.climax.npcCooldownUntil;
    
    if (!cooldownUntil) return 0;
    return Math.max(0, cooldownUntil - Date.now());
}

/**
 * Format cooldown time as readable string
 */
function formatCooldownTime(ms) {
    if (ms <= 0) return "Ready";
    
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
}

/**
 * Check if pregnancy is possible (NPC is female, fertile, not already pregnant)
 */
function checkPregnancyRisk(npc) {
    if (!npc.intimacy || !npc.intimacy.fertility) return false;
    
    const fertility = npc.intimacy.fertility;
    
    // Already pregnant
    if (fertility.isPregnant) return false;
    
    // Not female
    if (fertility.isFertile === null) return false;
    
    // Not currently fertile
    if (!fertility.isFertile) return false;
    
    return true;
}

/**
 * Attempt pregnancy with random chance
 * Returns true if pregnancy occurred
 */
function attemptPregnancy(npc) {
    if (!npc.intimacy || !npc.intimacy.fertility) return false;
    
    const fertility = npc.intimacy.fertility;
    const isFertile = fertility.isFertile || false;
    
    // Determine chance based on fertility
    const chance = isFertile ? CLIMAX_CONFIG.PREGNANCY_CHANCE_FERTILE : CLIMAX_CONFIG.PREGNANCY_CHANCE_BASE;
    
    // Roll the dice
    const rolled = Math.random() < chance;
    
    if (rolled) {
        fertility.isPregnant = true;
        fertility.pregnancyWeek = 1;
        fertility.pregnancyStartDate = Date.now();
        fertility.isFertile = false;
        fertility.fertileUntil = null;
        
        console.log(`[Intimacy] ${npc.name || 'NPC'} is now PREGNANT! (Week 1)`);
    }
    
    return rolled;
}

/**
 * Update arousal levels
 * Returns info about whether climax was triggered
 */
function updateArousal(npc, player, arousalChange) {
    if (!npc.intimacy) return { playerClimax: false, npcClimax: false };
    
    const p = arousalChange.p || 0;
    const n = arousalChange.n || 0;
    
    const oldPlayerArousal = npc.intimacy.arousal.player;
    const oldNpcArousal = npc.intimacy.arousal.npc;
    
    npc.intimacy.arousal.player = Math.max(0, Math.min(AROUSAL_CONFIG.ORGASM_THRESHOLD, npc.intimacy.arousal.player + p));
    npc.intimacy.arousal.npc = Math.max(0, Math.min(AROUSAL_CONFIG.ORGASM_THRESHOLD, npc.intimacy.arousal.npc + n));
    
    // Check if threshold was crossed
    const playerClimax = oldPlayerArousal < AROUSAL_CONFIG.ORGASM_THRESHOLD && 
                         npc.intimacy.arousal.player >= AROUSAL_CONFIG.ORGASM_THRESHOLD;
    const npcClimax = oldNpcArousal < AROUSAL_CONFIG.ORGASM_THRESHOLD && 
                     npc.intimacy.arousal.npc >= AROUSAL_CONFIG.ORGASM_THRESHOLD;
    
    return { playerClimax, npcClimax };
}

/**
 * Generate response for an action
 * Uses CoT-style template system for rich, context-aware responses
 */
async function generateActionResponse(npc, player, act, intimacy, positionId, opts) {
    // opts.suppressResponse: the caller's NPC-response gate decided this
    // beat will not display — skip the live AI call and return the cheap
    // template (the gate clears it anyway).
    const _suppress = !!(opts && opts.suppressResponse);
    // Build context for AI
    const context = buildActionContext(npc, player, act, intimacy, positionId);

    // First, try to build a rich response using our template system
    // This gives consistent, anatomy-aware, context-aware responses
    const templateResponse = buildIntimacyResponse(npc, player, act, intimacy);

    // Unconscious/sleeping NPCs never get an AI-voiced reaction: the
    // template is already reflexive-only (buildUnconsciousReaction), and an
    // AI pass could invent speech. Return it directly, with <...> markers
    // unwrapped so the display layer does not quote them as dialogue.
    if (npcCannotSpeak(npc)) {
        return {
            action: act.id,
            type: act.type,
            responseText: stripSpeechFromText(templateResponse),
            context: context,
            _source: "template",
            _npcCannotSpeak: true
        };
    }

    // Gate-suppressed beat: the caller's NPC-response gate will discard this
    // text, so don't pay for a live AI call or even a cache lookup — return
    // the cheap template right away.
    if (_suppress) {
        return {
            action: act.id,
            type: act.type,
            responseText: templateResponse,
            context: context,
            _source: "template",
            _npcResponseSuppressed: true
        };
    }

    // Check for LLM enhancement (for sexual acts only)
    let finalResponse = templateResponse;
    const currentPosition = (intimacy && intimacy.position && intimacy.position.player) || positionId || "Unknown";

    // Consumed-cache flag: set when a cached AI response is used this turn.
    // The prefetch block at the bottom uses it to re-arm the cache (the old
    // code early-returned here and never re-prefetched, so polished text
    // only appeared every OTHER time the player repeated the same act).
    var _consumedCache = false;
    // Live-AI flag: set when this turn's response came from a fresh AI call.
    var _liveUsed = false;

    var _ai = (typeof window !== 'undefined' && typeof window.ai === 'function') ? window.ai : (typeof ai === 'function' ? ai : null);

    // ── LIVE AI RESPONSE (primary path) ───────────────────────────
    // Per design the NPC response is ALWAYS AI-generated when the AI is
    // reachable: do a blocking call (short timeout) FIRST, so the player
    // sees fresh AI prose this beat rather than a template or last turn's
    // cache. The caches below are only fallbacks for a slow/unavailable AI.
    if (_ai && isSexualAct(act) && intimacy && !_suppress) {
        try {
            var _livePrompt = buildIntimacyPrompt(context);
            var _liveTimeout = new Promise(function (resolve) { setTimeout(function () { resolve(null); }, 8000); });
            var _liveResult = await Promise.race([
                _ai({ instruction: _livePrompt, startWith: "", endButtons: "none", generatorName: "cyoaftw-engine-core" }),
                _liveTimeout
            ]);
            var _liveText = _liveResult && (_liveResult.text || _liveResult);
            var _liveTrimmed = _liveText ? String(_liveText).trim() : "";
            var _liveMeta = /since the base|please provide|I cannot|I'm unable|as an ai|i'll polish|here is the|here's the/i.test(_liveTrimmed);
            if (_liveTrimmed && !_liveMeta && _liveTrimmed.length <= 600) {
                finalResponse = _liveTrimmed;
                _liveUsed = true;
                // Re-arm the cache so a later slow-AI beat still has text
                initializeLLMEnhancement(intimacy);
                if (act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE) {
                    var _liveDepth = intimacy.penetration ? (intimacy.penetration.depth || 1) : 1;
                    cachePenetrationResponse(intimacy, act.id, currentPosition, _liveDepth, _liveTrimmed);
                } else {
                    cacheLLMEnhancement(intimacy, act.id, currentPosition, _liveTrimmed);
                }
            }
        } catch (e) {
            console.warn("[Intimacy AI] Live response failed, falling back to cache/template:", e);
        }
    }

    // ── PENETRATION CACHE CHECK ───────────────────────────────────
    // For penetration/continue acts, check the penetration response cache
    // first — but only when the live AI call did not already produce text.
    // The cache is keyed by actId||position||depth, so each depth
    // level gets its own unique AI response. Prefetched by
    // prefetchPenetrationContinue when the penetration started.
    if ((act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE) && intimacy && finalResponse === templateResponse) {
        var depth = intimacy.penetration ? (intimacy.penetration.depth || 1) : 1;
        var cached = getCachedPenetrationResponse(intimacy, act.id, currentPosition, depth);
        if (cached) {
            console.log("[Intimacy Cache] Using cached response for", act.id, "depth", depth);
            // Purge after use so it doesn't repeat
            purgeCachedPenetrationResponse(intimacy, act.id, currentPosition, depth);
            finalResponse = cached;
            _consumedCache = true;
        }
    }

    // ── CACHED RESPONSE CHECK ─────────────────────────────────────
    // Check LLM enhancement cache for non-penetration sexual acts.
    // Penetration acts already checked above (penetration cache).
    // Purge after use so responses don't repeat.
    // NPC-led pleasure-loop beats are EXEMPT: the cache is keyed per
    // act+position, so back-to-back loop beats of the same act kept
    // replaying one polished line instead of rotating the varied
    // canned samples. The loop plays on the canned pool directly.
    var _isPleasureLoopBeat = !!(intimacy && intimacy.npcPleasureLoop && intimacy.npcPleasureLoop.active);
    if (!_isPleasureLoopBeat && isSexualAct(act) && intimacy && finalResponse === templateResponse) {
        initializeLLMEnhancement(intimacy);
        const cachedEnhancement = getCachedLLMEnhancement(intimacy, act.id, currentPosition);
        if (cachedEnhancement) {
            finalResponse = cachedEnhancement;
            purgeCachedLLMEnhancement(intimacy, act.id, currentPosition);
            _consumedCache = true;
        }
    }

    // ── NON-BLOCKING AI PREFETCH ──────────────────────────────────
    // Fire a single non-blocking AI call to polish the template response.
    // The result is cached for the NEXT time the player does the same act
    // at the same position/depth, so a slow-AI beat still has AI text.
    // (The live call at the top is now the primary path; this prefetch
    // only re-arms the fallback cache.)
    // _ai is already declared above.

    // ── UNNATURAL-ACT BLOCKING GENERATION ──────────────────────────
    // For uncivilized species + watersports/anal penetration, the canned
    // template text is a SAMPLE, not the final output. Ask the AI to rewrite
    // it live in this NPC's voice (short timeout; fall back to the canned
    // sample if the AI is slow or unavailable). The result is cached so
    // repeat acts at the same position/depth reuse it.
    if (_ai && isSexualAct(act) && intimacy && finalResponse === templateResponse && !_suppress && isUnnaturalUncivilizedAct(npc, act)) {
        try {
            var _uPrompt = buildIntimacyPrompt(context);
            var _uTimeout = new Promise(function (resolve) { setTimeout(function () { resolve(null); }, 8000); });
            var _uResult = await Promise.race([
                _ai({ instruction: _uPrompt, startWith: "", endButtons: "none", generatorName: "cyoaftw-engine-core" }),
                _uTimeout
            ]);
            var _uText = _uResult && (_uResult.text || _uResult);
            var _uTrimmed = _uText ? String(_uText).trim() : "";
            var _uMeta = /since the base|please provide|I cannot|I'm unable|as an ai|i'll polish|here is the|here's the polished/i.test(_uTrimmed);
            if (_uTrimmed && !_uMeta) {
                finalResponse = _uTrimmed;
                initializeLLMEnhancement(intimacy);
                if (act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE) {
                    var _uDepth = intimacy.penetration ? (intimacy.penetration.depth || 1) : 1;
                    cachePenetrationResponse(intimacy, act.id, currentPosition, _uDepth, _uTrimmed);
                } else {
                    cacheLLMEnhancement(intimacy, act.id, currentPosition, _uTrimmed);
                }
            } else {
                console.log("[Intimacy AI] Unnatural-act generation unavailable, using canned sample");
            }
        } catch (e) {
            console.warn("[Intimacy AI] Unnatural-act generation failed, using canned sample:", e);
        }
    }

    // Fire the prefetch both when we just showed a raw template (normal case)
    // AND when we just consumed a cached AI response, so the cache is re-armed
    // for the next occurrence instead of leaving the act to alternate between
    // polished and raw output.
    if (_ai && !_isPleasureLoopBeat && isSexualAct(act) && intimacy && (finalResponse === templateResponse || _consumedCache)) {
        (async function() {
            try {
                var prompt = buildIntimacyPrompt(context);
                console.log("[Intimacy AI] Background prefetch for", act.id, "depth:", intimacy.penetration ? intimacy.penetration.depth : 0);
                var result = await _ai({
                    instruction: prompt,
                    startWith: "",
                    endButtons: "none",
                    generatorName: "cyoaftw-engine-core"
                });
                var responseText = result && (result.text || result);
                if (responseText && responseText.trim()) {
                    // Reject meta-commentary (AI talking about the task instead
                    // of returning polished text)
                    var _trimmed = responseText.trim();
                    var _isMeta = /since the base|please provide|I cannot|I'm unable|as an ai|i'll polish|here is the|here's the polished/i.test(_trimmed);
                    if (_isMeta) {
                        console.log("[Intimacy AI] Response rejected (meta-commentary) for", act.id, ":", _trimmed.substring(0, 80));
                    } else if (act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE) {
                        var d = intimacy.penetration ? (intimacy.penetration.depth || 1) : 1;
                        cachePenetrationResponse(intimacy, act.id, currentPosition, d, responseText);
                    } else {
                        cacheLLMEnhancement(intimacy, act.id, currentPosition, responseText);
                    }
                    console.log("[Intimacy AI] Cached response for", act.id, "(", responseText.substring(0, 60), "...)");
                } else {
                    console.log("[Intimacy AI] Response rejected (empty) for", act.id);
                }
            } catch (e) {
                console.warn("[Intimacy AI] Background prefetch failed for", act.id, e);
            }
        })();
    }

    // Ladder-aware prefetch: warm the likely NEXT acts (same body category
    // as this one) so first-time clicks hit a cached authored response
    // instead of a raw template. Capped at 2 extra AI calls per action, and
    // only for slots that are still cold.
    if (_ai && isSexualAct(act) && intimacy && !act.playerIsBottom &&
        act.type !== ACT_TYPES.CLOTHING && act.type !== ACT_TYPES.END) {
        (async function() {
            try {
                if (typeof generateValidActions !== "function" || typeof getActionCategory !== "function") return;
                var _catKey = getActionCategory(act.id, npc);
                if (!_catKey || _catKey === "Other" || _catKey === "Receive") return;
                var _candidates = generateValidActions(npc, player, currentPosition).filter(function (a) {
                    if (!a || a.actId === act.id) return false;
                    var a2 = typeof getAct === "function" ? getAct(a.actId) : null;
                    if (!a2 || a2.playerIsBottom === true) return false;
                    if (a2.type === ACT_TYPES.CLOTHING || a2.type === ACT_TYPES.END || a2.type === ACT_TYPES.WATERSPORT) return false;
                    return getActionCategory(a.actId, npc) === _catKey;
                });
                var _warmed = 0;
                for (var i = 0; i < _candidates.length && _warmed < 2; i++) {
                    var candAct = typeof getAct === "function" ? getAct(_candidates[i].actId) : null;
                    if (!candAct) continue;
                    if (getCachedLLMEnhancement(intimacy, candAct.id, currentPosition)) continue;
                    var candContext = buildActionContext(npc, player, candAct, intimacy, currentPosition);
                    var candPrompt = buildIntimacyPrompt(candContext);
                    _warmed++;
                    try {
                        console.log("[Intimacy AI] Ladder prefetch for", candAct.id);
                        var r2 = await _ai({ instruction: candPrompt, startWith: "", endButtons: "none", generatorName: "cyoaftw-engine-core" });
                        var t2 = r2 && (r2.text || r2);
                        if (t2 && t2.trim()) {
                            var _m2 = /since the base|please provide|I cannot|I'm unable|as an ai|i'll polish|here is the|here's the/i.test(t2.trim());
                            if (!_m2) cacheLLMEnhancement(intimacy, candAct.id, currentPosition, t2.trim());
                        }
                    } catch (e2) {
                        console.warn("[Intimacy AI] Ladder prefetch failed for", candAct.id, e2);
                    }
                }
            } catch (e) {
                console.warn("[Intimacy AI] Ladder prefetch setup failed:", e);
            }
        })();
    }

    // Record this beat for author-mode continuation prompts (see
    // buildIntimacyPrompt's RECENT BEATS section) — the last few narrated
    // reactions, so repeated/continuing acts progress instead of rephrasing.
    if (finalResponse && typeof finalResponse === "string" && finalResponse.trim()) {
        if (!Array.isArray(intimacy._recentScene)) intimacy._recentScene = [];
        intimacy._recentScene.push(finalResponse.trim());
        intimacy._recentScene = intimacy._recentScene.slice(-4);
    }

    // Return template response immediately — no blocking
    return {
        action: act.id,
        type: act.type,
        responseText: finalResponse,
        context: context,
        _source: finalResponse === templateResponse ? "template" : (_liveUsed ? "live-ai" : "cached-ai")
    };
}

/**
 * Build context object for AI generation
 */
function buildActionContext(npc, player, act, intimacy, positionId) {
    const position = getPosition(positionId);
    const clothingState = intimacy.clothing;

    // Get NPC personality info
    const personality = npc.personalityProfile || {};
    const traits = npc.personalityTraits || [];
    const temperament = npc.temperament || "neutral";

    // Get player gender for pronoun handling
    const playerGender = getPlayerGenderForGates(player);

    // Build clothing description
    const clothingDesc = buildClothingDescription(clothingState, act.playerIsBottom ? "npc" : "player");

    // Build anatomy context for the AI (same as LLM enhancement path)
    var anatomyContext = {};
    if (npc.anatomy) {
        var sexualParts = ["vagina", "anus", "penis", "breasts", "nipples", "pubicHair", "buttocks"];
        var suppressedParts = [];
        if (act.id && act.id.includes("_clothed")) {
            var targetLower = String(act.target || "").toLowerCase();
            if (targetLower === "breasts" || targetLower === "chest") {
                suppressedParts = ["breasts", "nipples"];
            } else if (targetLower === "butt" || targetLower === "buttocks" || targetLower === "ass") {
                suppressedParts = ["buttocks"];
            }
        }
        sexualParts.forEach(function(part) {
            if (npc.anatomy[part] && suppressedParts.indexOf(part) === -1) {
                anatomyContext[part] = npc.anatomy[part];
            }
        });
    }

    return {
        npc: {
            name: npc.name || npc.epithet || "them",
            species: npc.species || "Human",
            gender: npc.gender || "female",
            temperament: temperament,
            traits: traits,
            personality: personality,
            arousal: intimacy.arousal.npc,
            virginity: { ...intimacy.virginity },
            speechPattern: npc.speechPattern || npc.speechStyle || "",
            anatomy: anatomyContext,
            // Physical descriptors so the prompt's KNOWN FACTS block can use
            // them for beat-to-beat variety (see buildFactsBlock)
            skinColor: npc.skinColor || "",
            hairColor: npc.hairColor || "",
            hairStyle: npc.hairStyle || "",
            eyeColor: npc.eyeColor || "",
            appearance: npc.appearance || null,
            persona: npc.persona || null,
            hasTail: typeof hasNPCTail === "function" ? hasNPCTail(npc) : undefined,
            cloaca: typeof npcHasCloacaFlag === "function" ? npcHasCloacaFlag(npc) : undefined,
            // Preserve the cannot-speak state on the prompt copy (the copy
            // drops bodyState/unconscious, so buildIntimacyPrompt reads this)
            cannotSpeak: npcCannotSpeak(npc)
        },
        player: {
            gender: playerGender,
            arousal: intimacy.arousal.player,
            // Player anatomy (materialized from the character-creation
            // profile by ensurePlayerIntimacyAnatomy) and the raw profile,
            // so the AI prompt can weave in size and color flavor.
            anatomy: player.anatomy || null,
            appearance: player.appearance || null,
            skinColor: player.skinColor || ""
        },
        action: {
            actId: act.id,
            type: act.type,
            tool: act.tool,
            target: act.target,
            verb: act.verb,
            label: act.label,
            description: act.desc,
            playerIsBottom: act.playerIsBottom || false
        },
        position: {
            id: positionId,
            label: position ? position.label : positionId,
            description: position ? position.description : ""
        },
        clothing: clothingState,
        clothingDesc: clothingDesc,
        history: intimacy.actionHistory.slice(-3).map(a => getAct(a.actId)),
        stage: getIntimacyStage(clothingState),
        isPenetrating: intimacy.penetration.active,
        penetrationDepth: intimacy.penetration ? (intimacy.penetration.depth || 0) : 0,
        hasLube: intimacy.hasLube,
        lubeLevel: intimacy.lubeLevel,
        // Template-generated response to feed the AI so it can enhance rather
        // than generate from scratch. This gives the AI the template's audio
        // cues, anatomy descriptions, and depth effects as a base.
        templateResponse: buildIntimacyResponse(npc, player, act, intimacy),
        intimacy: intimacy
    };
}

/**
 * Build clothing state description
 */
function buildClothingDescription(clothingState, actor) {
    const target = actor === "npc" ? "npc" : "player";
    const cs = clothingState[target];
    
    const parts = [];
    if (cs.top) parts.push("top");
    if (cs.bottom) parts.push("bottom");
    if (cs.undergarments) parts.push("underwear");
    
    if (parts.length === 0) {
        return `${actor === "npc" ? "They are" : "You are"} completely nude.`;
    } else if (parts.length === 3) {
        return `${actor === "npc" ? "They are" : "You are"} fully clothed.`;
    } else {
        return `${actor === "npc" ? "They have" : "You have"} ${parts.join(" and ")} on.`;
    }
}

/**
 * Build AI prompt for intimacy action response
 */
/**
 * SUPPLIED ANATOMY whitelist for prompts: the ONLY body parts/tools that
 * exist in this scene, derived from the actual NPC/player anatomy flags.
 * The AI must never invent, imply, or name anything not listed here or in
 * the act's own tool/target (this is what stops "impale your cloaca"-style
 * mismatches in generated prose).
 */
function buildAnatomyWhitelist(npc, player, act) {
    if (player && typeof ensurePlayerIntimacyAnatomy === "function") ensurePlayerIntimacyAnatomy(player);
    const nAnat = (npc && ((npc.nsfwTraits && npc.nsfwTraits.anatomy) || npc.anatomy)) || {};
    const nGender = String((npc && npc.gender) || "female").toLowerCase();
    const npcParts = [];
    if (typeof npcHasCloacaFlag === "function" && npcHasCloacaFlag(npc)) {
        npcParts.push("cloaca (a single vent serving as both vaginal and anal opening — never a separate vagina or anus)");
        if (nAnat.penis || nAnat.hemipenis || nGender === "male") npcParts.push("hemipenis (housed within the vent)");
    } else {
        if (nAnat.vagina || nAnat.pussy || nGender === "female" || nGender === "non-binary") npcParts.push("vagina/pussy/clitoris");
        if (nAnat.penis || nAnat.cock || nGender === "male" || nGender === "non-binary") npcParts.push("penis");
        npcParts.push("anus");
        if (nAnat.testicles || nAnat.balls) npcParts.push("testicles");
    }
    if (nAnat.breasts) npcParts.push("breasts/nipples");
    if (typeof hasNPCTail === "function" && hasNPCTail(npc)) npcParts.push("tail");
    npcParts.push("mouth/lips/tongue, hands/fingers, arms, chest, stomach, back, buttocks, thighs, legs, feet, face/neck/hair");

    const pAnat = (player && player.anatomy) || {};
    const playerParts = [];
    if (pAnat.penis) playerParts.push("penis (" + (pAnat.penis.sizeCategory || pAnat.penis.size || "medium") + ")");
    if (pAnat.vagina) playerParts.push("vagina (" + (pAnat.vagina.sizeCategory || pAnat.vagina.size || "medium") + ")");
    playerParts.push("hands/fingers, mouth/lips/tongue");

    return [
        "SUPPLIED ANATOMY — the ONLY body parts that exist in this scene:",
        "- NPC (" + ((npc && npc.species) || "human") + "): " + (npcParts.join("; ") || "standard humanoid body"),
        "- Player: " + (playerParts.join("; ") || "standard humanoid body"),
        "- This act uses the player's " + (act && act.tool) + " on the NPC's " + (act && act.target) + ".",
        "ANATOMY RULE: never invent, name, or imply any body part, organ, fluid, or feature NOT in this list. If the NPC has no penis, no penis exists — do not describe one. If the player has no vagina, none exists for them."
    ].join("\n");
}

/**
 * KNOWN FACTS block: true descriptors of the two bodies (skin, hair, eyes,
 * build, scent) that the AI may draw on for variety beat-to-beat. Facts
 * only — the AI must never contradict them.
 */
function buildFactsBlock(npc, player) {
    const lines = [];
    const na = (npc && (npc.appearance || npc.persona)) || {};
    if (npc && npc.skinColor) lines.push("- NPC skin: " + npc.skinColor);
    if (npc && npc.hairColor) lines.push("- NPC hair: " + npc.hairColor + (npc.hairStyle ? ", " + npc.hairStyle : ""));
    if (npc && npc.eyeColor) lines.push("- NPC eyes: " + npc.eyeColor);
    if (na.build) lines.push("- NPC build: " + na.build);
    if (na.scent) lines.push("- NPC scent: " + na.scent);
    const pa = (player && (player.appearance || player.persona)) || {};
    if (player && player.skinColor) lines.push("- Player skin: " + player.skinColor);
    if (pa.build) lines.push("- Player build: " + pa.build);
    if (!lines.length) return "";
    return "KNOWN FACTS (true descriptors of these bodies — you MAY use any of them for variety; never contradict them):\n" + lines.join("\n");
}

function buildIntimacyPrompt(context) {
    const { npc, player, action, position, clothing, clothingDesc, history, stage, isPenetrating, penetrationDepth, hasLube, templateResponse, intimacy: ctxIntimacy } = context;

    // Determine who is acting
    const actorIsPlayer = !action.playerIsBottom;
    const actor = actorIsPlayer ? "You" : (npc.name || "They");
    const receiver = actorIsPlayer ? (npc.name || "them") : "You";

    // Build the action description
    let actionDesc = action.label;
    if (actorIsPlayer) {
        actionDesc = `You ${action.verb} ${action.target} with your ${action.tool}`;
    } else {
        actionDesc = `${npc.name || "They"} ${action.verb}s your ${action.target} with their ${action.tool}`;
    }

    // Build continuity context
    const continuity = buildContinuityContext(history, action);

    // Build position context
    const positionContext = `Position: ${position.label}.${position.promptNote ? " Geometry: " + position.promptNote : ""}`;

    // Build clothing context
    const clothingContext = `Clothing: ${clothingDesc}`;

    // Build arousal context
    const arousalContext = `Arousal: ${describeArousalLevel(npc.arousal)} (NPC), ${describeArousalLevel(player.arousal)} (Player).`;

    // Build personality context
    const personalityContext = buildPersonalityContext(npc);

    // Build speech pattern context
    const speechContext = npc.speechPattern
        ? `Speech pattern: ${npc.speechPattern}`
        : "";

    // Build anatomy context — a whitelist of the ONLY parts that exist,
    // derived from actual anatomy flags (see buildAnatomyWhitelist)
    var anatomyContext = buildAnatomyWhitelist(npc, player, action);

    // Known physical facts the AI may use for beat-to-beat variety
    var factsContext = buildFactsBlock(npc, player);

    // Build lube context
    const lubeContext = hasLube ? "There is lubrication available." : "There is no lubrication.";

    // Build penetration context with depth
    const penetrationContext = isPenetrating
        ? `Currently penetrating: ${context.penetration ? context.penetration.tool : action.tool} in ${context.penetration ? context.penetration.target : action.target}. Depth: ${penetrationDepth || 1}/5.`
        : "Not currently penetrating.";

    // Build clothing guard for over-clothes actions
    const isClothedAction = action.actId && action.actId.includes("_clothed");
    const clothingGuard = isClothedAction
        ? "- This action is performed OVER clothing. Do NOT describe or imply the bare appearance, size, shape, or other hidden physical characteristics of the covered body part. Describe only sensations felt through the fabric."
        : "";

    // Sample mode: for uncivilized species + watersports/anal penetration the
    // canned template text is a species-flavored SAMPLE, not a script. The AI
    // rewrites it in this NPC's own voice instead of polishing it verbatim.
    var _sampleMode = typeof isUnnaturalUncivilizedAct === "function"
        && isUnnaturalUncivilizedAct(npc, action);
    // Extended oral beats (oral service on the player): the NPC works
    // the player through several distinct steps - allow longer,
    // progressive narration and invented in-character dialogue.
    var _isExtendedOral = (typeof isExtendedOralAction === "function") && isExtendedOralAction(action);
    var _baseLabel = _sampleMode
        ? "SAMPLE REACTION (a canned example of how this species might react - treat it as an IDEA for tone and content, not a script to preserve)"
        : "BASE RESPONSE (the FACTS of this beat — take the facts, not the phrasing)";
    // Unconscious/sleeping NPCs cannot speak or react consciously — the AI
    // must not write any dialogue or vocalization for them, only involuntary
    // physical reflexes. context.npc is a sanitized copy, so read the
    // cannotSpeak flag it carries (set in buildActionContext).
    var _cannotSpeak = (npc && npc.cannotSpeak === true) || npcCannotSpeak(npc);
    var _unconsciousState = _cannotSpeak
        ? "\nSTATE OVERRIDE: the NPC is UNCONSCIOUS (or fast asleep). They cannot speak, consent, resist, or act on their own initiative. Write NO dialogue and NO vocalized sounds — not even moans in <angle brackets>. Only involuntary physical reflexes: a twitch, a slack jaw, a reflexive clench, a breath hitching."
        : "";
    var _dialogueRule = _cannotSpeak
        ? "- The NPC is UNCONSCIOUS: NO dialogue, NO speech, NO sounds in <angle brackets>. Physical reflexes only."
        : (_sampleMode
            ? "- Rewrite the sample entirely in THIS NPC's own voice: apply the SPECIES NOTE, SPEECH STYLE, and temperament above. Keep the same underlying reaction (confused, uncertain, disgusted, or curious-but-consenting - whatever the sample conveys) and the same physical facts, but the wording and any dialogue must be freshly written for this character. You may replace the sample's dialogue with lines that fit better. Keep speech simple, direct, possibly broken - do not make an uncivilized NPC speak eloquently."
            : (_isExtendedOral
                ? "- You MAY write short in-character dialogue for the NPC (mark it with <angle brackets>). Keep it consistent with their temperament, speech style, and the moment - one line is plenty."
                : "- Do NOT invent new dialogue or speech. Keep existing speech if present, do not add new lines of dialogue."));
    var _sampleModeLines = _sampleMode
        ? "- Mark any spoken dialogue with <angle brackets> and keep physical reactions outside them, so the engine can tell speech from narration.\n- Base the reaction on this NPC's actual temperament and arousal, not just the sample: a shy one hesitates, a bold one is direct, a lustful one may enjoy it.\n- Core fact: this act is UNNATURAL for their kind. They are surprised or confused by it, though still consenting. Derive every word of the reaction from their temperament, species note and speech style above - the sample is a tone hint only, never wording to keep."
        : "";
    var _extendedOralLines = (_isExtendedOral && !_sampleMode)
        ? "- Mark any spoken dialogue with <angle brackets> and keep physical reactions outside them, so the engine can tell speech from narration."
        : "";
    // Extended-beat step list, by act family: cunnilingus builds
    // differently from fellatio (approach and anticipation first, then
    // contact, then rhythm, then the receiver climbing).
    var _oralSteps = ["vagina", "pussy", "clitoris", "clit"].indexOf(String(action.target || "").toLowerCase()) !== -1
        ? "approach and anticipation, first contact, taste her, find the rhythm, build her pleasure, ease off and look up"
        : "tease, taste, take, work, pull back, look up";

    var _lengthRule = _isExtendedOral
        ? "- Four to eight complete, grammatical sentences. This act is an EXTENDED beat: progress through distinct steps (" + _oralSteps + ") in order, and end on a beat that invites the player's next move."
        : "- One to three complete, grammatical sentences — never fragments. Under 45 words. This is a reaction beat, not a paragraph.";

    // Cunnilingus acts (either direction): physical technique guidance
    // for the AI - anticipation before contact, varied mouth work,
    // hands doing their share, and the receiver visibly building.
    var _cunnilingusNote = _isExtendedOral && ["vagina", "pussy", "clitoris", "clit"].indexOf(String(action.target || "").toLowerCase()) !== -1
        ? "CUNNILINGUS TECHNIQUE: build the beat physically. Anticipation first - kisses up the inner thigh, warm breath on bare skin before contact. First contact is a slow lick through her folds, then the mouth settles over her clit. Vary the mouth: broad flat strokes of the tongue, pointed circles, and soft suction - but the clit is a small nub, so sucking means lips sealed around it in gentle, steady pressure, never hollowed cheeks (that suction belongs to a cock). Use hands too - parting her folds, fingers curling inside, a palm pinning her hips. Show her building: hips lifting, thighs trembling or clamping shut, breath going ragged, the pressure winding tight low in her belly. Stay on the bodies; concrete verbs, no metaphors."
        : "";


    // Build template response context — feed the system-generated response
    // to the AI so it can enhance it rather than generating from scratch.
    const templateContext = templateResponse
        ? `Base response (enhance this, keep the same facts but make it more vivid and in-character):\n"${templateResponse}"`
        : "";

    // Build the full act description — be explicit about what's happening
    var actTypeName = action.type === "penetrate" ? "penetration (entering)" :
                 action.type === "continue" ? "continued penetration (thrusting)" :
                 action.type === "tease" ? "teasing/touching" :
                 action.type === "impact" ? "impact (spanking/slapping)" :
                 action.type === "clothing" ? "clothing removal" :
                 action.type === "watersport" ? "watersports" :
                 "intimate action";
    // Climax acts read as release beats in the prompt, not thrusting.
    if (action.triggersClimax) actTypeName = "climax (orgasm release)";

    var actDescription = `The player is using their ${action.tool} to ${action.verb} the NPC's ${action.target}. This is a ${actTypeName} act. The NPC's reaction should be about the sensation of ${action.tool} on ${action.target}, NOT about vaginal sex or penetration unless the act IS penetration. The act is FIXED for this beat: only ${action.tool} on ${action.target} - never describe a different act, tool, or body part.`;

    // Female player climax beats: describe HER orgasm, not a tool-on-target act.
    if (action.id === "player_orgasm" || action.id === "female_ejaculate") {
        actDescription = `The player is climaxing${action.id === "female_ejaculate" ? " — and squirting" : ""}. The reaction should be the crest and release of HER orgasm: her body, her sounds, the NPC riding it out with her. This is not a penetration beat.`;
    }

    // Construct the full prompt
    var _pos = (typeof getPossessivePronoun === "function" && npc) ? getPossessivePronoun(npc) : "their";
    var _species = (npc.species || "Human").toLowerCase();
    var _isUncivilized = _species && !isCivilizedSpecies(_species);
    var _speechPattern = npc.speechPattern || npc.speechStyle || "";
    var _speechProfile = npc.speechProfile || {};
    var _speciesContext = "";
    if (_isUncivilized) {
        _speciesContext = "\nSPECIES NOTE: This NPC is uncivilized (" + npc.species + "). Their speech is simple, direct, and possibly broken. They may use grunts, gestures, or crude words instead of refined language. Do NOT make them speak eloquently. If the base response has no dialogue, do NOT add dialogue for an uncivilized NPC — use body language instead.";
    } else if (npc.species && npc.species !== "Human") {
        _speciesContext = "\nSPECIES NOTE: This NPC is a " + npc.species + ". Keep their reactions consistent with their species characteristics if apparent.";
    }
    // Add anatomy type note for reptilian and mixed species
    var _anatomyType = (typeof getNPCAnatomyType === "function") ? getNPCAnatomyType(npc) : "humanoid";
    if (_anatomyType === "reptilian") {
        _speciesContext += "\nANATOMY NOTE: This species has reptilian anatomy — a cloaca (single opening) instead of separate vagina and anus. Use \"cloaca\" or \"vent\" in descriptions, not \"vagina\" or \"anus\". The opening is smooth-scaled and muscular, not mammalian.";
    } else if (_anatomyType === "mixed" || _anatomyType === "furry" || _anatomyType === "scaled") {
        // Get surface description (real colour + surface, never a placeholder)
        var surfaceDesc = (typeof getNPCSurfaceTextureDesc === "function") ? getNPCSurfaceTextureDesc(npc) : "skin";
        if (_anatomyType === "furry" && surfaceDesc === "skin") surfaceDesc = "fur";
        if (_anatomyType === "scaled" && surfaceDesc === "skin") surfaceDesc = "scales";

        _speciesContext += "\nANATOMY NOTE: This species has " + _anatomyType + " anatomy — HUMANOID GENITALS (separate vagina and anus, NOT a cloaca or vent). Body surface: " + surfaceDesc + ". Use standard body part names (vagina/pussy, anus/ass) and match the relevant body part's surface in descriptions. NEVER use 'vent' or 'cloaca' for this species.";
    }
    // Add tail note if applicable
    if (typeof hasNPCTail === "function" && hasNPCTail(npc)) {
        _speciesContext += "\nThis NPC has a tail. When the player is behind them, mention the tail in descriptions (brushing, curling, wrapping, twitching).";
    }
    // Build speech context from the full profile if available
    var _speechContext = "";
    if (_speechProfile.tone || _speechProfile.styleDescription || _speechProfile.languageNotes) {
        _speechContext = "\nSPEECH STYLE: Tone: " + (_speechProfile.tone || _speechPattern || "neutral") +
            ". Style: " + (_speechProfile.styleDescription || "") +
            ". Language: " + (_speechProfile.languageNotes || "") +
            ". Match this in any dialogue. Do NOT change their speech style.";
    } else if (_speechPattern) {
        _speechContext = "\nSPEECH: This NPC speaks with a " + _speechPattern + " pattern. Match this in any dialogue. Do NOT change their speech style.";
    }
    // Add temperament inflection if available
    var _temperamentInflection = "";
    if (npc.temperament && typeof window !== "undefined" && typeof window.getTemperamentInflection === "function") {
        _temperamentInflection = "\n" + window.getTemperamentInflection(npc.temperament);
    }

    // Recent scene beats + continuation guidance: repeated and continuing
    // acts must PROGRESS the scene rather than rephrase the previous beat.
    // Beats are recorded in executeIntimacyAction (intimacy._recentScene).
    var _recentBeats = (ctxIntimacy && Array.isArray(ctxIntimacy._recentScene))
        ? ctxIntimacy._recentScene.slice(-3) : [];
    var _isContinuation = action.type === "continue" ||
        (ctxIntimacy && ctxIntimacy.lastAction && ctxIntimacy.lastAction.actId === (action.actId || action.id));
    // Repetition-based tempo escalation (SotB-style): the Nth performance
    // of the same act should read faster/harder than the first.
    var _repeatCount = 0;
    if (ctxIntimacy && Array.isArray(ctxIntimacy.actionHistory) && action) {
        var _rid = action.actId || action.id;
        if (_rid) {
            for (var i = 0; i < ctxIntimacy.actionHistory.length; i++) {
                if (ctxIntimacy.actionHistory[i] && ctxIntimacy.actionHistory[i].actId === _rid) _repeatCount++;
            }
        }
    }
    var _repeatBlock = _repeatCount > 1
        ? "REPETITION: the player has performed this exact act " + _repeatCount + " times this encounter. Vary the beat - never restate the previous one: 2nd time slow and savouring, 3rd steady, 4th and beyond faster and more vocal. THE ACT NEVER CHANGES WITH REPETITION: every repeat is still the same act - the same tool on the same body part (" + (action.tool || "") + " on " + (action.target || "") + "). Escalating means tempo, pressure and voice only. NEVER escalate into a different act: no penetration or intercourse, no different tool, no different body part, unless this act itself is a penetration act."
        : "";
    var _playerName = (player && player.name) ? String(player.name).trim() : "";
    var _nameBlock = _playerName
        ? "PLAYER NAME: " + _playerName + ". At high arousal the NPC may cry out or moan the player's name in dialogue (<angle brackets>) - sparingly, at most once, never in narration."
        : "";
    var _slaveBlock = (npc.enslaved)
        ? "OWNERSHIP: the NPC is the player's collared slave. The player's acts are commands the slave obeys. Temperament flavors HOW they submit (defiant, eager, frightened, resigned) - never whether. Dialogue may address the player as master/mistress."
        : ((npc.bound && npc.surrendered)
            ? "CAPTIVE: the NPC is the player's bound captive. They are helpless and compliance is not optional; fear, resentment or wary curiosity flavor the reaction."
            : "");
    var _recentSceneBlock = "";
    if (_recentBeats.length) {
        _recentSceneBlock = "RECENT BEATS (what was just narrated — do NOT reuse their imagery or phrasing):\n" +
            _recentBeats.map(function (b) { return "- " + b; }).join("\n");
        if (_isContinuation) {
            _recentSceneBlock += "\nThis is a CONTINUATION of the ongoing act: progress the scene — deeper, faster, more intense, or a new sensation, per the STATE. Never restate a recent beat.";
        }
    }

    const prompt = `
You are writing an NPC's immediate reaction in a sex scene in a text adventure game.
The NPC is ${npc.name || "the NPC"}, a ${npc.species || "Human"} ${npc.gender || "female"}.${npc.temperament ? ` Temperament: ${npc.temperament}.` : ""}${npc.personalityTraits && npc.personalityTraits.length ? ` Traits: ${npc.personalityTraits.join(", ")}.` : ""}${_speciesContext}${_speechContext}${_temperamentInflection}

INSTRUCTIONS:
${_sampleMode ? "- Rewrite the SAMPLE REACTION below in this NPC's own voice. Make it read like clean, well-written prose in a published novel — not a rough draft." : "- AUTHOR " + _pos + " reaction fresh from the STATE below. The BASE RESPONSE lists the FACTS of this beat (what " + _pos + " body does, sounds, sensations) — take the facts, NOT the phrasing. Write it in " + _pos + " own voice, as clean novel prose."}
- Stay consistent with the facts: same act, same body parts, same sensations as the BASE RESPONSE. You may add vivid physical detail drawn from the ANATOMY and STATE context, but never contradict it.
- The act: ${action.tool} ${action.verb} ${action.target} (${actTypeName}).${actDescription.includes("NOT about vaginal sex") ? " Do NOT describe penetration or vaginal sex unless the base response describes it." : ""}
- Do NOT invent new body parts, actions, or context not in the base response. Use ONLY the SUPPLIED ANATOMY list below — anything not listed does not exist in this scene.
- NEVER refer to the NPC by name. Use pronouns only (she/her or he/his, matching the NPC's gender).
- Do NOT write narration, inner monologue, or atmospheric description. Stay on the body.
${_dialogueRule}
${_sampleModeLines}${_extendedOralLines ? "\n" + _extendedOralLines : ""}${_cunnilingusNote ? "\n" + _cunnilingusNote : ""}
- Your output is ONLY the NPC's immediate REACTION to the act: ${_pos} body, ${_pos} sounds, ${_pos} face, ${_pos} words. The player's action is described separately — do NOT re-narrate it. Cut any "as you push/slide/fill" clause that describes what the PLAYER does.
${_lengthRule}
- If the base response includes a sound (grunt, gasp, squeal), keep that reaction.
- Dialogue must fit the speaker: when the player is the actor, the NPC speaks only about their own body and sensations - never the player's perspective ("you're so tight" said BY the NPC is wrong; that is the player's line).
- If the base response mentions depth, pressure, or a specific body part, keep that detail.

STYLE — write clear, direct, grammatically correct English:
- Use proper sentence structure. Subject, verb, object. Complete sentences. No fragments, no run-ons.
- Describe what the body does and feels. Use literal language: "press", "grip", "slide", "clench", "yield".
- Do NOT use metaphors or abstract imagery. No "anchored to the heat", no "drowning in sensation".
- Do NOT use flowery or poetic language. No "garden of delights", no "temple of desire".
- Write in the same perspective as the base response. If it's second person ("You spread..."), keep it second person. If it's third person ("She arches..."), keep it third person.
- RIGHT: "You press your cock against her slick folds, the wet heat parting around your tip."
- RIGHT: "She clenches around your shaft, the tight ring of muscle gripping you with each thrust."
- WRONG: "Your fingers remain anchored to the heat of her flushed backside."
- WRONG: "Forcing her glutes wide, you lay bare the dusky ring of her anus, the velvet skin stretching taut and translucent under the pressure of your grip."
- Be raw. Be direct. Use the body part names, the tool names, the action verbs. Nothing more.
- Anatomy does not act on its own: the rectum, bowels and sphincter react to what you do - they grip, clench, squeeze, relax, yield - but never act with intent. No "milking", no "sucking you in", no "pulling you deeper".
- No pulsing, rippling or quivering innards either: keep internal sensation simple - tight, hot, slick. The NPC's body can shudder and tremble; the insides stay hot and tight. Shuddering, trembling and clenching belong to the NPC's body, not to the organs.
- No atmospheric filler about musk, the air, the room, or "their joined bodies".
- BANNED phrase: "steady and unhurried" (and close variants like "slow and unhurried"). Never write it - it is canned template filler; pick concrete rhythm words instead.
- Never imply the scene is ending: no "one last time", no "one final thrust", no "final stroke", no "last orgasm". The encounter continues until the player ends it - stamina allows multiple rounds. Describe THIS beat only. Stay on the two bodies and the act; only mention scent when the STATE gives a smell note.
${clothingGuard ? clothingGuard + "\n" : ""}

ACT: ${action.tool} ${action.verb} ${action.target} (${actTypeName})
${positionContext} | ${clothingContext} | ${arousalContext} | ${penetrationContext}
${anatomyContext ? "\n" + anatomyContext + "\n" : ""}${factsContext ? "\n" + factsContext + "\n" : ""}
${getSizeContext(player, npc) ? "\n" + getSizeContext(player, npc) : ""}
${getColorSizeContext(player, npc, action) ? "\n" + getColorSizeContext(player, npc, action) : ""}
${_recentSceneBlock ? "\n" + _recentSceneBlock + "\n" : ""}${_repeatBlock ? "\n" + _repeatBlock + "\n" : ""}${_cannotSpeak ? "" : (_nameBlock ? "\n" + _nameBlock + "\n" : "")}${_slaveBlock ? "\n" + _slaveBlock + "\n" : ""}${_unconsciousState ? "\n" + _unconsciousState + "\n" : ""}

${_baseLabel}:
"${templateResponse || ""}"

IMPORTANT: Output ONLY the reaction text. No explanations, no commentary, no meta-discussion. Just the final text.

${(() => {
    var _intimacy = ctxIntimacy || context.intimacy || null;
    if (!_intimacy) return "";
    var _arousal = (_intimacy.arousal && _intimacy.arousal.npc) || 0;
    var _isAroused = _arousal > 400;
    var _isWet = _arousal > 480;
    var _flavor = (typeof buildHiddenFlavorContext === 'function') ? buildHiddenFlavorContext(npc, action.target, _intimacy, { isAroused: _isAroused, isWet: _isWet, hasLube: hasLube, tool: action.tool, isInsertive: (action.type === "penetrate" || action.type === "continue" || (String(action.tool || "").toLowerCase() === "fingers" && ["finger", "enter"].includes(String(action.verb || "").toLowerCase())) || (["mouth", "tongue"].includes(String(action.tool || "").toLowerCase()) && String(action.verb || "").toLowerCase() === "penetrate")) }) : "";
    return _flavor ? "\n" + _flavor + "\n" : "";
})()}
RESPOND with only the polished text, nothing else:`;


    return prompt;
}

/**
 * Continuation-beat prompt: the NEXT beat of an ongoing physical act
 * (player repeating/continuing the same act). The response line is
 * generated separately — this prompt is ONLY the physical continuation,
 * written as quality prose with proper grammar, using only the supplied
 * anatomy.
 */
function buildContinuationPrompt(npc, player, act, intimacy, context) {
    const position = (context && context.position) || { label: (intimacy && intimacy.position && intimacy.position.player) || "Unknown" };
    const recent = (intimacy && Array.isArray(intimacy._recentScene)) ? intimacy._recentScene.slice(-3) : [];
    let repeatCount = 0;
    if (intimacy && Array.isArray(intimacy.actionHistory) && act) {
        for (let i = 0; i < intimacy.actionHistory.length; i++) {
            if (intimacy.actionHistory[i] && intimacy.actionHistory[i].actId === (act.actId || act.id)) repeatCount++;
        }
    }
    const isPen = act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE ||
        (intimacy && intimacy.penetration && intimacy.penetration.active);
    const depth = intimacy && intimacy.penetration ? (intimacy.penetration.depth || 1) : 1;
    return `
You are writing the NEXT BEAT of an ongoing sex act in a text adventure game — the continuation of the SAME physical action. Not a new act. Not the NPC's reaction or dialogue (that is generated separately).
NPC: ${npc.name || "the NPC"}, a ${npc.species || "Human"} ${npc.gender || "female"}${npc.temperament ? `, temperament: ${npc.temperament}` : ""}. Player: ${player && player.name ? player.name : "the player"}.

${buildAnatomyWhitelist(npc, player, act)}
${buildFactsBlock(npc, player) ? buildFactsBlock(npc, player) + "\n" : ""}
POSITION: ${position.label}.${position.promptNote ? " Geometry: " + position.promptNote : ""}
AROUSAL: NPC ${describeArousalLevel((intimacy && intimacy.arousal && intimacy.arousal.npc) || 0)}, player ${describeArousalLevel((intimacy && intimacy.arousal && intimacy.arousal.player) || 0)}.
${recent.length ? "RECENT BEATS (do NOT reuse their imagery, phrasing, or sensations):\n" + recent.map(function (b) { return "- " + b; }).join("\n") + "\n" : ""}
THE ACT (unchanged — this is a continuation): the player's ${act.tool} keeps ${act.verb}ing the NPC's ${act.target}.${isPen ? ` Penetration is ongoing at depth ${depth}/5 — describe the continued pressure and thrusting at that depth.` : ""}${repeatCount > 1 ? ` This exact act has been performed ${repeatCount} times this encounter — escalate tempo/pressure, never restate an earlier beat, and never drift into a different act.` : ""}

INSTRUCTIONS:
- Write 2-4 complete, grammatical sentences in second person ("You ..."), continuing the SAME act: same tool, same body part.
- Quality sexy prose: concrete verbs, literal body-part names, proper grammar, complete sentences. No fragments, no metaphors, no poetic abstractions, no atmospheric filler (no room/musk/air unless a KNOWN FACT gives a scent).
- Use ONLY the SUPPLIED ANATOMY above — never invent any body part, organ, or feature not listed there.
- Do NOT write the NPC's reaction, face, or dialogue — that is a separate output. Do NOT narrate a different or new act. Do NOT imply the scene is ending.
- Progress the beat: deeper, faster, harder, or a new sensation.

OUTPUT: only the continuation text, nothing else.`;
}

/**
 * AI continuation narrative for a repeated/continued act. Continuation
 * beats are ALWAYS AI-written when the AI is reachable (per design); the
 * system template is only the fallback when the AI is unavailable or slow.
 * Returns a string (never null — falls back to the template).
 */
async function generateContinuationNarrative(npc, player, actId, intimacy) {
    const act = typeof getAct === "function" ? getAct(actId) : null;
    if (!act) return null;
    const template = generateIntimacyNarrative(npc, actId, { player: player, intimacy: intimacy, isContinueAction: true });
    // Unconscious/sleeping NPCs: template only (reflexive, non-verbal) —
    // never ask the AI for a continuation beat, which could invent speech.
    if (npcCannotSpeak(npc)) return stripSpeechFromText(template);
    var _ai = (typeof window !== 'undefined' && typeof window.ai === 'function') ? window.ai : (typeof ai === 'function' ? ai : null);
    if (!_ai || !isSexualAct(act)) return template;
    try {
        const positionId = (intimacy && intimacy.position && intimacy.position.player) || null;
        const context = buildActionContext(npc, player, act, intimacy, positionId);
        const prompt = buildContinuationPrompt(npc, player, act, intimacy, context);
        const timeout = new Promise(function (resolve) { setTimeout(function () { resolve(null); }, 8000); });
        const result = await Promise.race([
            _ai({ instruction: prompt, startWith: "", endButtons: "none", generatorName: "cyoaftw-engine-core" }),
            timeout
        ]);
        const text = result && (result.text || result);
        const trimmed = text ? String(text).trim() : "";
        const isMeta = /since the base|please provide|I cannot|I'm unable|as an ai|i'll polish|here is the|here's the/i.test(trimmed);
        if (trimmed && !isMeta && trimmed.length <= 600) {
            return trimmed.replace(/<([^>]*)>/g, '"$1"').replace(/<|>/g, "");
        }
    } catch (e) {
        console.warn("[Intimacy AI] Continuation generation failed, using template:", e);
    }
    return template;
}
window.generateContinuationNarrative = generateContinuationNarrative;
window.buildContinuationPrompt = buildContinuationPrompt;
window.buildAnatomyWhitelist = buildAnatomyWhitelist;
// No-system mode prompt (engine sidebar checkbox "No system"): the engine
// sends the ENTIRE system-generated beat — the player's action narration
// plus the NPC's reaction — as a description/sample, and the AI writes the
// full scene from it. context is the per-act context returned by
// generateActionResponse (may be null for combined multi-act beats, where
// only the NPC is known).
window.buildNoSystemScenePrompt = function(npc, sampleText, context) {
    if (!npc || !sampleText) return "";
    const action = (context && context.action) || {};
    const ctxIntimacy = (context && context.intimacy) || (npc.intimacy || null);
    const position = (context && context.position) || null;
    const playerIsBottom = action.playerIsBottom === true;
    const player = (context && context.player) || null;
    var _isPenetrationBeat = (String(action.type || "").toLowerCase() === "penetrate" ||
        String(action.type || "").toLowerCase() === "continue" ||
        !!(ctxIntimacy && ctxIntimacy.penetration && ctxIntimacy.penetration.active));
    // Insertive tease acts (fingers sliding in, tongue parting the
    // opening) get the same slow-motion treatment - the act itself
    // described in physical detail, not just the reaction. Mirrors the
    // isInsertive logic in buildIntimacyPrompt.
    var _isInsertiveTease = (!_isPenetrationBeat &&
        ((String(action.tool || "").toLowerCase() === "fingers" &&
            ["finger", "enter"].indexOf(String(action.verb || "").toLowerCase()) !== -1) ||
        (["mouth", "tongue"].indexOf(String(action.tool || "").toLowerCase()) !== -1 &&
            String(action.verb || "").toLowerCase() === "penetrate")));
    var _pos = (typeof getPossessivePronoun === "function" && npc) ? getPossessivePronoun(npc) : "their";

    // Unconscious/sleeping NPCs cannot speak: no dialogue or vocalized
    // sounds may be written for them — only involuntary physical reflexes.
    var _cannotSpeak = npcCannotSpeak(npc);
    var _unconsciousState = _cannotSpeak
        ? "\nSTATE OVERRIDE: the NPC is UNCONSCIOUS (or fast asleep). They cannot speak, consent, resist, or act on their own initiative. Write NO dialogue and NO vocalized sounds — not even moans in <angle brackets>. Only involuntary physical reflexes: a twitch, a slack jaw, a reflexive clench, a breath hitching."
        : "";

    var _species = String(npc.species || "Human");
    var _speciesLower = _species.toLowerCase();
    var _isUncivilized = _speciesLower && typeof isCivilizedSpecies === "function" && !isCivilizedSpecies(_speciesLower);
    var _speciesContext = "";
    if (_isUncivilized) {
        _speciesContext = "\nSPECIES NOTE: This NPC is uncivilized (" + _species + "). Their speech is simple, direct, possibly broken. Prefer body language over eloquent dialogue; do NOT make them speak eloquently.";
    } else if (_speciesLower && _speciesLower !== "human") {
        _speciesContext = "\nSPECIES NOTE: This NPC is a " + _species + ". Keep their reactions consistent with their species characteristics.";
    }
    var _anatomyType = (typeof getNPCAnatomyType === "function") ? getNPCAnatomyType(npc) : "humanoid";
    if (_anatomyType === "reptilian") {
        _speciesContext += "\nANATOMY NOTE: This species has reptilian anatomy — a cloaca (single opening) instead of separate vagina and anus. Use \"cloaca\" or \"vent\" in descriptions, not \"vagina\" or \"anus\".";
    } else if (_anatomyType === "mixed" || _anatomyType === "furry" || _anatomyType === "scaled") {
        // Get surface description (real colour + surface, never a placeholder)
        var surfaceDesc = (typeof getNPCSurfaceTextureDesc === "function") ? getNPCSurfaceTextureDesc(npc) : "skin";
        if (_anatomyType === "furry" && surfaceDesc === "skin") surfaceDesc = "fur";
        if (_anatomyType === "scaled" && surfaceDesc === "skin") surfaceDesc = "scales";

        _speciesContext += "\nANATOMY NOTE: This species has " + _anatomyType + " anatomy — HUMANOID GENITALS (separate vagina and anus, NOT a cloaca or vent). Body surface: " + surfaceDesc + ". Use standard body part names (vagina/pussy, anus/ass) and match the relevant body part's surface in descriptions. NEVER use 'vent' or 'cloaca' for this species.";
    }
    if (typeof hasNPCTail === "function" && hasNPCTail(npc)) {
        _speciesContext += "\nThis NPC has a tail. Mention it in descriptions when relevant (brushing, curling, twitching).";
    }

    var _arousalNpc = (ctxIntimacy && ctxIntimacy.arousal && ctxIntimacy.arousal.npc) || 0;
    var _arousalPlayer = (ctxIntimacy && ctxIntimacy.arousal && ctxIntimacy.arousal.player) || 0;
    var _arousalContext = "Arousal: " + describeArousalLevel(_arousalNpc) + " (NPC), " + describeArousalLevel(_arousalPlayer) + " (Player).";
    var _positionContext = position && position.label
        ? "Position: " + position.label + "." + (position.promptNote ? " Geometry: " + position.promptNote : "")
        : "";
    var _pen = (ctxIntimacy && ctxIntimacy.penetration) || null;
    var _penetrationContext = (_pen && _pen.active)
        ? "Currently penetrating: " + (_pen.tool || "") + " in " + (_pen.target || "") + ". Depth: " + (_pen.depth || 1) + "/5."
        : "Not currently penetrating.";
    var _anatomyContext = (npc.anatomy && Object.keys(npc.anatomy).length)
        ? "Anatomy: " + JSON.stringify(npc.anatomy)
        : "";
    var _recentBeats = (ctxIntimacy && Array.isArray(ctxIntimacy._recentScene))
        ? ctxIntimacy._recentScene.slice(-3) : [];
    var _recentBlock = _recentBeats.length
        ? "RECENT BEATS (what was just narrated — do NOT reuse their imagery or phrasing):\n" +
          _recentBeats.map(function (b) { return "- " + b; }).join("\n") +
          "\nThis beat should PROGRESS the scene, not restate a recent beat."
        : "";
    var _playerSizeContext = "";
    var _playerFitContext = "";
    if (player) {
        try {
            if (typeof getSizeContext === "function") _playerSizeContext = getSizeContext(player, npc) || "";
            if (typeof getColorSizeContext === "function") _playerFitContext = getColorSizeContext(player, npc, action) || "";
        } catch (e) { _playerSizeContext = ""; _playerFitContext = ""; }
    }
    var _repeatCount = 0;
    if (ctxIntimacy && Array.isArray(ctxIntimacy.actionHistory) && action) {
        var _rid = action.actId || action.id;
        if (_rid) {
            for (var i = 0; i < ctxIntimacy.actionHistory.length; i++) {
                if (ctxIntimacy.actionHistory[i] && ctxIntimacy.actionHistory[i].actId === _rid) _repeatCount++;
            }
        }
    }
    var _repeatBlock = _repeatCount > 1
        ? "REPETITION: the player has performed this exact act " + _repeatCount + " times this encounter. Vary the beat - never restate the previous one: 2nd time slow and savouring, 3rd steady, 4th and beyond faster and more vocal. THE ACT NEVER CHANGES WITH REPETITION: every repeat is still the same act - the same tool on the same body part (" + (action.tool || "") + " on " + (action.target || "") + "). Escalating means tempo, pressure and voice only. NEVER escalate into a different act: no penetration or intercourse, no different tool, no different body part, unless this act itself is a penetration act."
        : "";
    var _playerName = (player && player.name) ? String(player.name).trim() : "";
    var _nameBlock = _playerName
        ? "PLAYER NAME: " + _playerName + ". At high arousal the NPC may cry out or moan the player's name in dialogue (<angle brackets>) - sparingly, at most once, never in narration."
        : "";
    var _slaveBlock = (npc.enslaved)
        ? "OWNERSHIP: the NPC is the player's collared slave. The player's acts are commands the slave obeys. Temperament flavors HOW they submit (defiant, eager, frightened, resigned) - never whether. Dialogue may address the player as master/mistress."
        : ((npc.bound && npc.surrendered)
            ? "CAPTIVE: the NPC is the player's bound captive. They are helpless and compliance is not optional; fear, resentment or wary curiosity flavor the reaction."
            : "");
    var _detailBlock = "";
    if (_isPenetrationBeat) {
        _detailBlock = playerIsBottom
            ? "\nPENETRATION DETAIL - the NPC's cock is entering YOU; spend most of the beat on the act itself:\n- Show the mechanics physically and concretely: the entry, the stretch, the grip, the drag on each withdrawal - what both bodies are actually doing.\n- Vary the camera between beats: your body's response, the depth and rhythm, the sound and feel of it.\n- NEVER name raw stats in prose - no size or color labels like \"medium\" or \"deep brown\". If size or color matter, convey them naturally (\"thick\", \"dark skin\") or not at all.\n- Do NOT reuse any phrase from these instructions or from the sample. Every beat is worded fresh.\n- DIALOGUE: During active penetration, NPC speech is limited to moans, grunts, gasps, and broken phrases interspersed with heavy breathing. Full sentences are unlikely - focus on vocalizations like <ah!>, <nngh!>, <hah...>, <so... full...>, <right... there...>. Save coherent speech for non-penetration contexts."
            : "\nPENETRATION DETAIL - spend most of the beat on the act itself:\n- Show the mechanics physically and concretely: depth on each stroke, speed, grip, drag, friction, flesh against flesh - what both bodies are actually doing.\n- Vary the camera between beats: sometimes your cock and their grip, sometimes their body's response, sometimes the rhythm or the sound of it.\n- NEVER name raw stats in prose - no size or color labels like \"medium\" or \"deep brown\". If size or color matter, convey them naturally (\"thick\", \"dark skin\") or not at all.\n- Do NOT reuse any phrase from these instructions or from the sample. Every beat is worded fresh.\n- DIALOGUE: During active penetration, NPC speech is limited to moans, grunts, gasps, and broken phrases interspersed with heavy breathing. Full sentences are unlikely - focus on vocalizations like <ah!>, <nngh!>, <hah...>, <so... full...>, <right... there...>. Save coherent speech for non-penetration contexts.";
    } else if (_isInsertiveTease) {
        _detailBlock = "\nINSERTION DETAIL - spend most of the beat on the insertion itself:\n- Show it physically and concretely: the push past the resistance, the grip closing around your fingers or tongue, how their flesh yields and spreads.\n- Vary the camera between beats - the opening, their reaction, your view of it.\n- Do NOT reuse any phrase from these instructions or from the sample. Every beat is worded fresh.\n- DIALOGUE: During insertion, NPC speech may be slightly more coherent than full penetration, but still limited. Use short phrases, gasps, and broken sentences with heavy breathing. Prefer vocalizations like <ah!>, <mmm...>, <there...> over full sentences.";
    }

    var _lengthRule = (_isPenetrationBeat || _isInsertiveTease)
        ? "- Four to eight complete, grammatical sentences. Spend most of the beat describing the act itself in physical, concrete detail. Up to 140 words."
        : "- Three to six complete, grammatical sentences. Under 90 words.";
    var _useState = (typeof getBodyUseDescriptor === "function" && action.target)
        ? getBodyUseDescriptor(npc, action.target) : null;
    var _useStateLine = _useState
        ? ("NPC'S " + String(action.target).toUpperCase() + " CURRENT STATE: " + _useState + ". MATCH THIS STATE: an already-used hole reads wetter, looser, easier to enter - never tight, resisting or narrow.")
        : "";
    var _actLine = action && action.tool
        ? "ACT: " + action.tool + " " + (action.verb || "") + " " + (action.target || "") +
          (playerIsBottom ? " (the NPC acts on the player)" : "") +
          " - THIS EXACT ACT, NOTHING ELSE: do not escalate it into a different act (no penetration unless the act IS penetration, no other tool, no other body part)."
        : "";

    const prompt = `
You are writing ONE beat of an ongoing sex scene in a text adventure game.
The NPC is ${npc.name || "the NPC"}, a ${_species} ${npc.gender || "female"}.${npc.temperament ? " Temperament: " + npc.temperament + "." : ""}${npc.personalityTraits && npc.personalityTraits.length ? " Traits: " + npc.personalityTraits.join(", ") + "." : ""}${_speciesContext}

The SYSTEM DESCRIPTION below is a canned outline of this beat: the player's action and the NPC's reaction. Keep its FACTS — the same act, the same body parts, the same sensations and the same outcome — but write the whole beat fresh, as clean prose in a published novel. This is a rewrite for QUALITY, not a summary: the output must read better than the input - more concrete, more physical, better rhythm - while keeping exactly the same facts.

INSTRUCTIONS:
- Write the FULL scene beat: what the player does (second person, "You ...") and how the NPC reacts (third person, pronouns only).${playerIsBottom ? "\n- In this beat the NPC is the one acting on the player: narrate their action on you, then your sensation." : ""}
- NEVER refer to the NPC by name. Use pronouns only (she/her or he/his, matching the NPC's gender).
- Stay consistent with the sample: same act, same body parts, same sensations and outcome. You may add vivid physical detail drawn from the ANATOMY and STATE, but never contradict it and do not invent new acts.
- Do NOT copy the sample's phrasing. Every sentence must be freshly written - if a phrase from the sample survives unchanged, rewrite it. The sample is a factual outline, not prose to preserve.
- BANNED phrase: "steady and unhurried" (and close variants like "slow and unhurried"). Never write it - it is canned template filler. Pick concrete rhythm words instead ("in a slow, even rhythm").
- The sample can stack overlapping canned fragments (an ongoing-motion line plus a body descriptor that repeats the same motion). MERGE overlapping content into one flowing passage - describe each motion and body part ONCE per beat, never twice.
${_cannotSpeak ? "- The NPC is UNCONSCIOUS: NO dialogue, NO speech, NO sounds in <angle brackets>. Physical reflexes only." : "- Mark any spoken dialogue with <angle brackets> and keep physical reactions outside them."}
${_lengthRule}${_detailBlock}
- Literal, physical language: concrete anatomy ("sphincter", "pucker", "cheeks", "the root"), never abstractions like "clenching heat" or "her warmth".
- NEVER write stat words in prose: no "medium", no size labels as adjectives, no color-word stacks ("deep brown cock"). Convey size or color naturally ("thick", "dark skin") or leave it out.
- No adverb pairs or mechanic-speak ("frantic, rougher speed"). Pick the vivid concrete detail over the generic one every time.
- Vary sentence openings and rhythm between beats - never start two beats the same way.
- Dialogue must fit the speaker: when the player is the actor, the NPC speaks only about their own body and sensations ("so full...", "right there...") - never the player's perspective ("you're so tight" said BY the NPC is wrong in that moment - that is the player's line, and the player's lines are not written).
- QUALITY BAR - match this register:
  RIGHT: "You bottom out on every stroke and hold there for a beat, the vise-like heat gripping your full length, ${_pos} puffy sphincter dragging at your root."
  RIGHT: "You hammer ${_pos} ass in full strokes, your thighs slapping ${_pos} cheeks with each drive, the ring pinching tight behind your crown on every withdrawal."
  WRONG: "You drive your medium deep brown cock into ${_pos} clenching heat with a frantic, rougher speed."
    Wrong means: stacked adjectives, stat words, adverb pairs, abstract nouns where anatomy belongs.
- Anatomy does not act on its own: the rectum, bowels and sphincter react to what you do - they grip, clench, squeeze, relax, yield - but never act with intent. No "milking", no "sucking you in", no "pulling you deeper".
- No pulsing, rippling or quivering innards either: keep internal sensation simple - tight, hot, slick. The NPC's body can shudder and tremble; the insides stay hot and tight. Shuddering, trembling and clenching belong to the NPC's body, not to the organs acting independently.
- No atmospheric filler about musk, the air, the room, or "their joined bodies".
- Never imply the scene is ending: no "one last time", no "one final thrust", no "final stroke", no "last orgasm". The encounter continues until the player ends it - stamina allows multiple rounds. Describe THIS beat only. Stay on the two bodies and the act. Only mention scent when the STATE gives a smell note.

STATE:
${_positionContext} ${_arousalContext} ${_penetrationContext}
${_anatomyContext}
${_playerSizeContext}
${_playerFitContext}
${_recentBlock}
${_repeatBlock}
${_cannotSpeak ? "" : _nameBlock}
${_slaveBlock}
${_useStateLine}
${_unconsciousState}

${_actLine}

SYSTEM DESCRIPTION (facts to keep, phrasing to rewrite):
"${sampleText}"

Output ONLY the scene text — no explanations, no commentary, no meta-discussion.`;
    return prompt;
};

/**
 * Build continuity context from action history
 */
function buildContinuityContext(history, currentAction) {
    if (!history || history.length === 0) {
        return "This is the first action in this encounter.";
    }
    
    const prevAction = history[history.length - 1];
    
    // Check if same type of action
    if (prevAction.tool === currentAction.tool && prevAction.target === currentAction.target) {
        return `PREVIOUS ACTION: You ${prevAction.verb}ed their ${prevAction.target} with your ${prevAction.tool}. Continue the same motion naturally - the same act, same tool, same body part; the act does not become a different one.`;
    }
    
    return `PREVIOUS ACTION: You ${prevAction.verb}ed their ${prevAction.target} with your ${prevAction.tool}.`;
}

/**
 * Build personality context
 */
function buildPersonalityContext(npc) {
    const traits = npc.traits || [];
    const temperament = npc.temperament || "neutral";
    const personality = npc.personality || {};
    
    let context = `\nPERSONALITY:`;
    context += `\n- Temperament: ${temperament}`;
    context += `\n- Traits: ${traits.join(", ") || "none"}`;
    
    if (personality.archetype) {
        context += `\n- Archetype: ${personality.archetype}`;
    }
    
    return context;
}

/**
 * Describe arousal level
 */
function describeArousalLevel(level) {
    if (level < AROUSAL_CONFIG.MINOR_AROUSAL) return "slightly aroused";
    if (level < AROUSAL_CONFIG.MODERATE_AROUSAL) return "aroused";
    if (level < AROUSAL_CONFIG.HIGH_AROUSAL) return "very aroused";
    if (level >= AROUSAL_CONFIG.ORGASM_THRESHOLD) return "at climax";
    return "extremely aroused";
}

/**
 * Build fallback response if AI fails
 * Now uses the CoT-style template system for rich responses
 */
function buildFallbackResponse(npc, player, act, intimacy) {
    // If we have intimacy state, use the full template system
    if (intimacy) {
        return buildIntimacyResponse(npc, player, act, intimacy);
    }
    
    // Simple fallback without intimacy context
    const subjectPronoun = getSubjectPronoun(npc) || "They";
    const possessivePronoun = getPossessivePronoun(npc) || "their";
    const objectPronoun = getObjectPronoun(npc) || "them";
    
    const responses = {
        tease: [
            `<lets out a soft moan.>`,
            `<sighs with pleasure.>`,
            `<responds enthusiastically.>`,
            `<enjoys the attention.>`
        ],
        penetrate: [
            `<gasps.>`,
            `<moans loudly with pleasure.>`,
            `<welcomes you inside.>`,
            `<arches ${possessivePronoun} back.>`
        ],
        continue: [
            `<moans with each thrust.>`,
            `<grips you tightly.>`,
            `<matches your rhythm.>`,
            `<encourages you to continue.>`
        ],
        impact: [
            `<yelps in surprise and pleasure.>`,
            `<gasps at the sensation.>`,
            `<reacts to the sudden contact.>`,
            `<enjoys the firm touch.>`
        ],
        clothing: [
            `<watches as you undress.>`,
            `<helps you with your clothing.>`,
            `<smiles as the clothing comes off.>`,
            `<anticipates what comes next.>`
        ],
        end: [
            `<nods in acknowledgment.>`,
            `<takes a deep breath.>`,
            `<smiles contentedly.>`,
            `<looks at you expectantly.>`
        ]
    };
    
    const category = act.type || "tease";
    const options = responses[category] || responses.tease;
    return options[Math.floor(Math.random() * options.length)];
}

// ============================================================================
// COT-STYLE NARRATIVE RESPONSE SYSTEM
// ============================================================================

/**
 * Arousal level descriptors for context-aware responses
 */
var INTIMACY_AROUSAL_DESCRIPTORS = {
    low: { desc: "slightly aroused", threshold: 0, max: 20 },
    mild: { desc: "warming up", threshold: 21, max: 40 },
    moderate: { desc: "aroused", threshold: 41, max: 60 },
    high: { desc: "very aroused", threshold: 61, max: 80 },
    extreme: { desc: "extremely aroused", threshold: 81, max: 100 },
    climax: { desc: "at the edge of climax", threshold: 95, max: 100 }
};

/**
 * Get arousal descriptor based on level
 */
function getArousalDescriptor(level) {
    if (!level) return INTIMACY_AROUSAL_DESCRIPTORS.low.desc;
    
    for (const key in INTIMACY_AROUSAL_DESCRIPTORS) {
        const desc = INTIMACY_AROUSAL_DESCRIPTORS[key];
        if (level >= desc.threshold && level <= desc.max) {
            return desc.desc;
        }
    }
    return INTIMACY_AROUSAL_DESCRIPTORS.extreme.desc;
}

/**
 * Build reflexive-only reaction for unconscious NPC
 * Unconscious bodies cannot give conscious verbal responses - only physical reflexes.
 * Reactions are purely involuntary: muscle twitches, breathing changes, etc.
 */
function buildUnconsciousReaction(npc, player, act, intimacy) {
    if (!npc || !act) return "";
    
    const target = (act.target || "").toLowerCase();
    const tool = (act.tool || "").toLowerCase();
    const subjectPronoun = getSubjectPronoun(npc) || "They";
    const possessivePronoun = getPossessivePronoun(npc) || "their";
    
    // Define reflexive reaction pools by body part/target
    const UNCONSCIOUS_REACTIONS = {
        // Oral actions
        mouth: [
            `<drops ${possessivePronoun} jaw slackly, drooling slightly.>`,
            `<makes a soft, involuntary gagging sound.>`,
            `<swallows reflexively, ${possessivePronoun} throat working on its own.>`,
            `<lets out a quiet, unresponsive exhale through ${possessivePronoun} nose.>`,
            `<lies still, mouth hanging open slightly.>`
        ],
        lips: [
            `<part ${possessivePronoun} lips slightly under pressure but offer no response.>`,
            `<stay motionless, lips slack and unresponsive.>`,
            `<breath shallowly through ${possessivePronoun} nose.>`
        ],
        // Breast/nipple actions
        breasts: [
            `<breathe slowly, ${possessivePronoun} chest rising and falling with each unconscious breath.>`,
            `<have ${possessivePronoun} nipples stiffen slightly from the stimulation.>`,
            `<lie still, ${possessivePronoun} breasts heavy and limp.>`
        ],
        nipples: [
            `<have ${possessivePronoun} nipples pebble and harden under attention.>`,
            `<twitch slightly as ${possessivePronoun} nipples respond reflexively.>`,
            `<breathe with faint changes in rhythm from the nipple stimulation.>`
        ],
        // Female genital actions
        vagina: [
            `<have a faint clench around the intrusion, purely reflexive.>`,
            `<show a slight hip twitch, the only response from ${possessivePronoun} limp body.>`,
            `<grow slightly flush under prolonged attention, an involuntary response.>`,
            `<lie completely still, offering no resistance or participation.>`
        ],
        pussy: [
            `<have a faint clench around the intrusion, purely reflexive.>`,
            `<show a slight hip twitch, the only response from ${possessivePronoun} limp body.>`,
            `<grow slightly flush under prolonged attention, an involuntary response.>`
        ],
        clitoris: [
            `<have a subtle twitch at the contact, pure reflex.>`,
            `<show a faint clitoral response, the only sign of sensation.>`
        ],
        clit: [
            `<have a subtle twitch at the contact, pure reflex.>`,
            `<show a faint response, the only sign of sensation.>`
        ],
        // Cloaca actions (reptilian species)
        cloaca: [
            `<have ${possessivePronoun} vent clench tightly, resisting entry.>`,
            `<show a faint slickening under prolonged stimulation.>`,
            `<twitch slightly as the vent is stimulated.>`,
            `<lie still, the smooth-scaled opening offering no cooperation.>`
        ],
        // Male genital actions
        penis: [
            `<have ${possessivePronoun} cock stiffen slightly, pure reflex.>`,
            `<twitch once or twice as ${possessivePronoun} hips buck involuntarily.>`,
            `<lie slack, only ${possessivePronoun} cock showing any response.>`
        ],
        cock: [
            `<have ${possessivePronoun} cock stiffen slightly, pure reflex.>`,
            `<twitch once or twice as ${possessivePronoun} hips buck involuntarily.>`
        ],
        testicles: [
            `<have ${possessivePronoun} balls tighten slightly, a reflexive protection.>`,
            `<show no conscious response, only instinctive muscle tension.>`
        ],
        balls: [
            `<have ${possessivePronoun} balls tighten slightly, a reflexive protection.>`
        ],
        // Anal actions
        anus: [
            `<clench tightly, the sphincter resisting involuntarily.>`,
            `<show a faint twitch from the stimulation, pure reflex.>`,
            `<offer no relaxation, the body staying tense and unresisting.>`,
            `<grip the intrusion with a reflexive clench.>`
        ],
        ass: [
            `<clench slightly at the contact, pure reflex.>`,
            `<show a faint muscle response, the only reaction.>`
        ],
        buttocks: [
            `<stay limp and unresponsive under the touch.>`,
            `<show no conscious tension, only the weight of ${possessivePronoun} unconscious body.>`
        ],
        butt: [
            `<stay limp and unresponsive under the touch.>`
        ],
        // General/body actions
        body: [
            `<lie completely still, a dead weight.>`,
            `<show no reaction whatsoever.>`,
            `<breathe slowly and regularly, oblivious to the touch.>`,
            `<remain utterly limp and unresponsive.>`
        ],
        general: [
            `<show no conscious response.>`,
            `<lie still, completely unaware.>`,
            `<breathe slowly, the only sign of life.>`
        ]
    };
    
    // Get reactions for this target, or fall back to general
    const reactions = UNCONSCIOUS_REACTIONS[target] || UNCONSCIOUS_REACTIONS.general;
    return pickRandom(reactions);
}

/**
 * Convert arousal from 0-800 scale to 0-100 scale.
 * The intimacy system stores arousal on a 0-800 scale (ORGASM_THRESHOLD=800),
 * but the reaction/dialogue helper functions use 0-100 thresholds.
 */
function scaleArousal(arousalLevel) {
    if (typeof arousalLevel !== 'number') return 0;
    return Math.min(100, Math.max(0, Math.round(arousalLevel / 8)));
}

/**
 * Get body part reaction intensity based on arousal
 */
function getReactionIntensity(arousalLevel) {
    if (arousalLevel < 20) return "softly";
    if (arousalLevel < 40) return "with interest";
    if (arousalLevel < 60) return "with pleasure";
    if (arousalLevel < 80) return "enthusiastically";
    return "passionately";
}

/**
 * Get random reaction from a set, weighted by arousal
 */
function getWeightedReaction(reactions, arousalLevel, maxTier) {
    if (!reactions || reactions.length === 0) {
        return "responds";
    }

    // Determine which tiers are available, capped by maxTier
    // Tier order: mild < moderate < high < intense
    var tierOrder = ["mild", "moderate", "high", "intense"];
    var maxIndex = maxTier ? tierOrder.indexOf(maxTier) : 3;
    if (maxIndex < 0) maxIndex = 3;

    // For high arousal, prefer more intense reactions (capped by maxTier)
    if (arousalLevel > 80 && maxIndex >= 3 && reactions.intense) {
        return pickRandom(reactions.intense);
    } else if (arousalLevel > 60 && maxIndex >= 2 && reactions.high) {
        return pickRandom(reactions.high || reactions.intense || reactions.moderate || reactions);
    } else if (arousalLevel > 40 && maxIndex >= 1 && reactions.moderate) {
        return pickRandom(reactions.moderate || reactions);
    } else if (arousalLevel > 20 && reactions.mild) {
        return pickRandom(reactions.mild || reactions);
    }

    // Default (low arousal, or no tier matched): pick from any tier at or
    // below the cap. reactions is usually a tiered object ({mild, moderate,
    // high, intense}) here, and pickRandom on a non-array returns "" — which
    // produced broken lines like "She  at the sensation." in output.
    var pool = [];
    for (var i = 0; i <= maxIndex; i++) {
        var tier = reactions[tierOrder[i]];
        if (Array.isArray(tier) && tier.length) pool = pool.concat(tier);
    }
    if (pool.length) return pickRandom(pool);
    return "responds";
}

/**
 * Pick a random element from array
 */
function pickRandom(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return "";
    // Template pools contain conditional entries that can evaluate to
    // null/undefined — never return one.
    const clean = arr.filter(function (x) { return x != null; });
    if (!clean.length) return "";
    return clean[Math.floor(Math.random() * clean.length)];
}

/**
 * Anti-repetition pickRandom: avoids returning the same result as the
 * last N outputs. Stores recent picks on intimacy._recentNarratives.
 */
function pickUnique(arr, intimacy, key) {
    if (!Array.isArray(arr) || arr.length === 0) return "";
    // Template pools contain conditional entries that can evaluate to
    // null/undefined — filter them out before picking.
    arr = arr.filter(function (x) { return x != null; });
    if (!arr.length) return "";
    if (!intimacy) return pickRandom(arr);
    if (!intimacy._recentNarratives) intimacy._recentNarratives = {};
    if (!intimacy._recentNarratives[key]) intimacy._recentNarratives[key] = [];

    var recent = intimacy._recentNarratives[key];
    var pool = arr.filter(function(item) { return recent.indexOf(item) === -1; });
    if (pool.length === 0) {
        // Recent list covered the whole pool - reset it, but still never
        // allow an immediate repeat of the last pick.
        var _lastPick = recent[recent.length - 1];
        recent.length = 0;
        pool = arr.slice();
        if (_lastPick && pool.length > 1) {
            pool = pool.filter(function(item) { return item !== _lastPick; });
        }
    }
    var pick = pool[Math.floor(Math.random() * pool.length)];
    recent.push(pick);
    if (recent.length > 3) recent.shift();
    return pick;
}

// ============================================================================
// SENSORY DETAIL FRAGMENT POOLS
// Injected into templates at random to add variety and erotic detail.
// Each fragment is appended to the base narrative sentence.
// ============================================================================

/**
 * Resolve {npcP}/{npcS}/{npcO} placeholders in template text to the
 * NPC's actual pronouns, so flavor and reaction templates reflect
 * the actor's gender instead of assuming a female NPC.
 * {npcP} = possessive (her/his/their), {npcS} = subject (she/he/they),
 * {npcO} = object (her/him/them).
 */
function applyNPCPronouns(npc, text) {
    if (text === null || text === undefined) return text;
    var p = (typeof getPossessivePronoun === "function" && npc) ? getPossessivePronoun(npc) : "their";
    var s = (typeof getSubjectPronoun === "function" && npc) ? getSubjectPronoun(npc) : "They";
    var o = (typeof getObjectPronoun === "function" && npc) ? getObjectPronoun(npc) : "them";
    return String(text)
        .replace(/\{npcP\}/g, p)
        .replace(/\{npcS\}/g, s)
        .replace(/\{npcO\}/g, o)
        .replace(/\{npcp\}/g, p)
        .replace(/\{npcs\}/g, s.toLowerCase())
        .replace(/\{npo\}/g, o);
}

var SENSORY_FRAGMENTS = {
    // Friction/sensation — varies by body part
    friction: {
        vagina: [
            ", the slick heat enveloping you",
            ", {npcP} hot, tight grip with each stroke",
            ", the wet friction pulling at your {yourTool}",
            ", {npcP} depths gripping you with each thrust",
            ", the soft wet flesh yielding around you"
        ],
        anus: [
            ", the tight ring gripping your {yourTool}",
            ", the dry friction giving way to slickness",
            ", the muscular walls clamping hot and tight",
            ", the tight friction sending sparks through you",
            ", the ring pinching tight behind your crown with every stroke",
            ", the grip so snug every stroke turns to friction-heat",
            ", her heat sealing around you, tight enough to ache",
            ", the tight drag building heat where the ring grips hardest",
        ],
        mouth: [
            ", the wet warmth of {npcP} mouth enveloping you",
            ", {npcP} tongue working against the underside",
            ", the suction pulling at your tip",
            ", the slick pressure of {npcP} cheeks hollowing around you",
            ", the wet heat of {npcP} throat pulsing"
        ],
        breasts: [
            ", the soft flesh yielding under your touch",
            ", the warm skin pressing against your palm",
            ", the firm weight filling your hand"
        ],
        buttocks: [
            ", the firm flesh dimpling under your grip",
            ", the warm curves filling your palms",
            ", the soft skin stretching taut as you squeeze"
        ],
        general: [
            ", the warmth of {npcP} body against yours",
            ", the soft skin beneath your touch",
            ", the heat radiating from {npcP} body"
        ]
    },

    // Fluid descriptors — only when aroused/lubricated
    fluids: {
        vagina: [
            ", {npcP} arousal coating your {yourTool}",
            ", the slick sounds of {npcP} wetness filling the air",
            ", a thread of {npcP} juices stretching between you",
            ", {npcP} slick folds parting easily for you",
            ", the wet heat of {npcP} arousal soaking your skin"
        ],
        anus: [
            ", the lube easing your passage",
            ", the slick channel accepting you smoothly",
            ", the slickness letting you glide deeper"
        ],
        mouth: [
            ", saliva dripping from the corners of {npcP} mouth",
            ", the wet sounds of {npcP} mouth working you"
        ],
        general: [
            ", {npcP} body slick with arousal",
            ", the wet heat between you growing"
        ]
    },

    // Skin/pigmentation — from NPC anatomy
    skin: {
        vagina: [
            ", {npcP} {interiorColor} folds parting for you",
            ", the {skinTone} skin flushing with heat",
            ", the {interiorColor} of {npcP} inner lips glistening"
        ],
        anus: [
            ", the {skinTone} ring of muscle stretching around you",
            ", the darkened skin puckering with each movement",
            ", the {skinTone} flesh clenching tight"
        ],
        breasts: [
            ", {npcP} {skinTone} skin warm under your hands",
            ", the {skinTone} curves flushed with arousal"
        ],
        general: [
            ", {npcP} {skinTone} skin glowing with heat",
            ", the {skinTone} flush spreading across {npcP} body"
        ]
    },

    // Pubic hair — from NPC anatomy
    pubic: {
        vagina: [
            ", parting {npcP} {pubicDesc} to reach {npcP} depths",
            ", pressing through {npcP} {pubicDesc}",
            ", {npcP} {pubicDesc} brushing against your skin"
        ],
        anus: [
            ", the {pubicDesc} around {npcP} hole tickling your {yourTool}",
            ", {npcP} {pubicDesc} brushing against you"
        ],
        general: []
    },

    // Partial withdrawal mini-narratives (penetration only, 10% chance)
    partialWithdrawal: [
        " You pull back until only your tip remains inside, then drive back in.",
        " You withdraw halfway, the suction tugging at your shaft, before sinking deep again.",
        " You slide almost fully out, the cool air hitting your wet shaft, then plunge back in.",
        " You pull back slowly, feeling every inch drag against {npcP} walls, before thrusting home."
    ],

    // Size difference descriptors — only injected when player and NPC differ
    // in size. Uses {frameDesc} placeholder replaced with the relative size phrase.
    sizeDifference: {
        "player-larger": [
            ", {npcP} small frame dwarfed beneath you",
            ", {npcP} petite body struggling to take your full size",
            ", {npcP} snug depths stretched tight around your girth, every inch a tight fit",
            ", the size difference making {npcP} gasp with each thrust"
        ],
        "player-much-larger": [
            ", {npcP} tiny body barely able to accommodate your girth",
            ", the sheer size difference stretching {npcP} to {npcP} limit",
            ", {npcP} small frame shaking as your cock fills {npcP} completely",
            ", {npcP} diminutive body trembling under your much larger frame"
        ],
        "npc-larger": [
            ", {npcP} larger body enveloping you with warmth",
            ", {npcP} ample frame pressing against you with weight and heat",
            ", {npcP} loose, easy depths taking your whole length without resistance",
            ", {npcP} soft, puffy heat swallowing your cock with room to spare, {npcP} size making you feel small inside {npcP}"
        ],
        "npc-much-larger": [
            ", {npcP} massive frame dwarfing you beneath {npcP}",
            ", {npcP} enormous body engulfing your cock with ease",
            ", the size difference making you feel small inside {npcP}",
            ", {npcP} towering body pressing you down with its weight"
        ]
    },

    // Species/skin color descriptors — injected when NPC has non-human skin
    // or a distinctive skin tone. Uses {skinDesc} replaced at runtime.
    species: {
        nonHuman: [
            ", {npcP} {skinDesc} skin warm beneath your hands",
            ", the {skinDesc} of {npcP} body pressed against you",
            ", the exotic {skinDesc} of {npcP} flesh yielding to your touch",
            ", running your hands over {npcP} {skinDesc} skin"
        ],
        distinctTone: [
            ", {npcP} {skinDesc} complexion flushing with heat",
            ", the {skinDesc} of {npcP} skin glistening with a light sheen",
            ", {npcP} {skinDesc} body warm and alive under your touch"
        ]
    }
};

/**
 * Body word for the acting tool, used to fill the {yourTool} placeholder in
 * the sensory pools. Cock-driven acts keep the original "shaft" wording;
 * finger and mouth/tongue acts read as fingers/tongue instead, so a rim job
 * no longer "tickles your shaft".
 */
function getSensoryToolWord(tool) {
    var t = String(tool || "").toLowerCase();
    if (t === "fingers" || t === "finger" || t === "hand" || t === "hands") return "fingers";
    if (t === "mouth" || t === "tongue") return "tongue";
    return "shaft";
}

/**
 * Get a sensory fragment for the current act. Each fragment type has
 * an independent chance of appearing.
 * @param {Object} npc - The NPC
 * @param {string} target - The body part being targeted
 * @param {Object} intimacy - The intimacy state (for anti-repetition)
 * @param {Object} options - { isAroused, isWet, hasLube, isPenetration, isInsertive, tool }
 */
function getSensoryFragment(npc, target, intimacy, options) {
    if (!npc || !target) return "";
    options = options || {};
    var toolWord = getSensoryToolWord(options.tool);
    var applyTool = function (frag) {
        return String(frag).replace(/\{yourTool\}/g, toolWord);
    };
    // Whether the act actually puts the tool INSIDE the target. Friction and
    // fluids pools describe the interior ("her depths gripping you", "the
    // slick channel accepting you") — they read as penetration when the act
    // is only external (press, rub, tease, spread). Callers compute this
    // from act type + tool + verb.
    var isInsertive = (options.isInsertive === undefined) ? options.isPenetration : options.isInsertive;

    var targetKey = "general";
    var targetLower = String(target).toLowerCase();
    if (targetLower === "vagina" || targetLower === "pussy") targetKey = "vagina";
    else if (targetLower === "anus" || targetLower === "ass") targetKey = "anus";
    else if (targetLower === "mouth" || targetLower === "lips") targetKey = "mouth";
    else if (targetLower === "breasts" || targetLower === "nipples") targetKey = "breasts";
    else if (targetLower === "buttocks" || targetLower === "butt" || targetLower === "ass") targetKey = "buttocks";

    // Two fragment kinds, spliced differently by the caller:
    //  - clauses: ", ..." tails that slot in before the final period
    //  - sentences: " You ..." full mini-narratives appended AFTER the
    //    base text (partial withdrawal). Splicing sentences in front of
    //    the period produced "…taking every bit of you You pull back…in.."
    var clauses = [];
    var sentences = [];

    // Friction (30% chance, insertive acts only — the pool describes the interior)
    if (isInsertive && Math.random() < 0.30) {
        var pool = SENSORY_FRAGMENTS.friction[targetKey] || SENSORY_FRAGMENTS.friction.general;
        if (pool.length) clauses.push(applyTool(pickUnique(pool, intimacy, "friction")));
    }

    // Fluids (25% chance, only when aroused/wet/lubed AND insertive —
    // "the slick channel accepting you smoothly" claims entry)
    if (isInsertive && Math.random() < 0.25 && (options.isAroused || options.isWet || options.hasLube)) {
        var fluidPool = SENSORY_FRAGMENTS.fluids[targetKey] || SENSORY_FRAGMENTS.fluids.general;
        if (fluidPool.length) clauses.push(applyTool(pickUnique(fluidPool, intimacy, "fluids")));
    }

    // Skin/pigmentation (20% chance)
    if (Math.random() < 0.20) {
        var skinTone = getSkinDescription(npc) || "";
        var interiorColor = "";
        if (targetKey === "vagina") interiorColor = getVaginalInteriorColor(npc) || "";
        else if (targetKey === "anus") interiorColor = getAnalInteriorColor(npc) || "";

        var skinPool = SENSORY_FRAGMENTS.skin[targetKey] || SENSORY_FRAGMENTS.skin.general;
        if (skinPool.length && (skinTone || interiorColor)) {
            var skinFrag = pickUnique(skinPool, intimacy, "skin");
            skinFrag = skinFrag.replace(/\{skinTone\}/g, skinTone || "flushed");
            skinFrag = skinFrag.replace(/\{interiorColor\}/g, interiorColor || "pink");
            clauses.push(skinFrag);
        }
    }

    // Pubic hair (15% chance, only for genital targets)
    if (Math.random() < 0.15 && (targetKey === "vagina" || (targetKey === "anus" && !npcHasCloacaFlag(npc)))) {
        var pubicDesc = getPubicDescription(npc) || "";
        var pubicPool = SENSORY_FRAGMENTS.pubic[targetKey] || [];
        if (pubicPool.length && pubicDesc) {
            var pubicFrag = applyTool(pickUnique(pubicPool, intimacy, "pubic"));
            pubicFrag = pubicFrag.replace(/\{pubicDesc\}/g, pubicDesc);
            clauses.push(pubicFrag);
        }
    }

    // Partial withdrawal (10% chance, cock penetration only - the fragments
    // say "tip"/"shaft", which reads wrong for finger and tongue acts).
    // Full sentences: appended after the base text, not spliced mid-sentence.
    if (Math.random() < 0.10 && options.isPenetration && toolWord === "shaft") {
        sentences.push(pickUnique(SENSORY_FRAGMENTS.partialWithdrawal, intimacy, "withdrawal"));
    }

    // Size difference (25% chance, only when sizes differ)
    if (options.player) {
        var rel = getRelativeSize(options.player, npc);
        if (rel && SENSORY_FRAGMENTS.sizeDifference[rel]) {
            if (Math.random() < 0.25) {
                clauses.push(pickUnique(SENSORY_FRAGMENTS.sizeDifference[rel], intimacy, "size"));
            }
        }
    }

    // Species/skin color (20% chance for non-human, 10% for distinctive human tone)
    var skinDesc = getSkinDescription(npc) || "";
    var surfaceType = String(npc.surfaceType || "skin").toLowerCase();
    if (skinDesc) {
        var isNonHuman = surfaceType !== "skin" && surfaceType !== "";
        var chance = isNonHuman ? 0.20 : 0.10;
        if (Math.random() < chance) {
            var speciesPool = isNonHuman
                ? SENSORY_FRAGMENTS.species.nonHuman
                : SENSORY_FRAGMENTS.species.distinctTone;
            if (speciesPool && speciesPool.length) {
                var speciesFrag = pickUnique(speciesPool, intimacy, "species");
                speciesFrag = speciesFrag.replace(/\{skinDesc\}/g, skinDesc);
                clauses.push(speciesFrag);
            }
        }
    }

    var result = {};
    if (clauses.length) result.clauses = applyNPCPronouns(npc, clauses.join(""));
    if (sentences.length) result.sentences = applyNPCPronouns(npc, sentences.join(" "));
    return (result.clauses || result.sentences) ? result : "";
}

/**
 * Build hidden flavor context for the AI polish prompt. These are
 * sensory details the AI can optionally weave into its polished response
 * but are NOT part of the visible template (so the template stays clean).
 */
function buildHiddenFlavorContext(npc, target, intimacy, options) {
    if (!npc || !target) return "";
    options = options || {};

    var targetKey = "general";
    var targetLower = String(target).toLowerCase();
    if (targetLower === "vagina" || targetLower === "pussy") targetKey = "vagina";
    else if (targetLower === "anus" || targetLower === "ass") targetKey = "anus";
    else if (targetLower === "mouth" || targetLower === "lips") targetKey = "mouth";

    var flavors = [];
    var toolWord = getSensoryToolWord(options.tool);
    var applyTool = function (frag) {
        return String(frag).replace(/\{yourTool\}/g, toolWord);
    };
    // Interior-flavored lines (friction/fluids) only fit acts that actually
    // put the tool inside; external acts default to TRUE only when the
    // caller doesn't say — new callers pass isInsertive explicitly.
    var isInsertive = (options.isInsertive === undefined) ? true : options.isInsertive;
    var skinTone = getSkinDescription(npc) || "";
    var pubicDesc = getPubicDescription(npc) || "";
    var interiorColor = "";
    if (targetKey === "vagina") interiorColor = getVaginalInteriorColor(npc) || "";
    else if (targetKey === "anus") interiorColor = getAnalInteriorColor(npc) || "";

    // Friction
    var frictionPool = isInsertive
        ? (SENSORY_FRAGMENTS.friction[targetKey] || SENSORY_FRAGMENTS.friction.general)
        : [];
    if (frictionPool.length) flavors.push("Friction: " + applyTool(pickRandom(frictionPool)).replace(/^,\s*/, ""));

    // Fluids
    if (isInsertive && (options.isAroused || options.isWet || options.hasLube)) {
        var fluidPool = SENSORY_FRAGMENTS.fluids[targetKey] || SENSORY_FRAGMENTS.fluids.general;
        if (fluidPool.length) flavors.push("Fluids: " + applyTool(pickRandom(fluidPool)).replace(/^,\s*/, ""));
    }

    // Skin
    if (skinTone || interiorColor) {
        var skinPool = SENSORY_FRAGMENTS.skin[targetKey] || SENSORY_FRAGMENTS.skin.general;
        if (skinPool.length) {
            var skinFrag = pickRandom(skinPool).replace(/^,\s*/, "");
            skinFrag = skinFrag.replace(/\{skinTone\}/g, skinTone || "flushed");
            skinFrag = skinFrag.replace(/\{interiorColor\}/g, interiorColor || "pink");
            flavors.push("Skin: " + skinFrag);
        }
    }

    // Pubic hair
    if (pubicDesc && (targetKey === "vagina" || targetKey === "anus")) {
        var pubicPool = SENSORY_FRAGMENTS.pubic[targetKey] || [];
        if (pubicPool.length) {
            var pubicFrag = applyTool(pickRandom(pubicPool)).replace(/^,\s*/, "");
            pubicFrag = pubicFrag.replace(/\{pubicDesc\}/g, pubicDesc);
            flavors.push("Pubic hair: " + pubicFrag);
        }
    }

    // Species/skin color
    var fullSkinDesc = getSkinDescription(npc) || "";
    var _surfaceType = String(npc.surfaceType || "skin").toLowerCase();
    if (fullSkinDesc) {
        var _isNonHuman = _surfaceType !== "skin" && _surfaceType !== "";
        var speciesLine = _isNonHuman
            ? "Species: the NPC has " + fullSkinDesc + " — weave this detail into the polish"
            : "Skin: " + fullSkinDesc + " skin — weave this detail into the polish";
        flavors.push(speciesLine);
    }

    if (!flavors.length) return "";
    return applyNPCPronouns(npc, "HIDDEN FLAVOR (optional — weave 1-2 of these into your polish if they fit):\n" + flavors.join("\n"));
}

/**
 * Body part-specific reaction templates
 * Organized by target body part for context-aware responses
 */
var BODY_PART_REACTIONS = {
    // Hair
    hair: {
        mild: ["tilts {npcP} head", "closes {npcP} eyes briefly", "smiles softly", "sighs contentedly"],
        moderate: ["lets out a soft moan", "nuzzles into your touch", "murmurs", "arches slightly"],
        high: ["gasps softly", "presses {npcP} head against your hand", "whispers your name", "shivers"],
        intense: ["moans with delight", "grinds {npcP} head against you", "begs for more", "trembles"]
    },
    
    // Breasts/Nipples
    breasts: {
        mild: ["breathes a little faster", "lets out a soft sigh", "glances at you shyly", "bites {npcP} lip"],
        moderate: ["lets out a soft moan", "shifts closer to you", "presses into your touch", "gasps softly"],
        high: ["moans", "leans into your hands", "whispers encouragement", "shivers"],
        intense: ["gasps and moans loudly", "pushes {npcP} chest toward you", "begs you not to stop", "trembles"]
    },
    nipples: {
        mild: ["lets out a tiny gasp", "shivers slightly", "bits {npcP} lip", "tenses slightly"],
        moderate: ["lets out a soft moan", "arches {npcP} back", "gasps", "presses into your touch"],
        high: ["moans loudly", "twitches", "whispers your name", "grinds against you"],
        intense: ["screams with pleasure", "begs for more", "trembles uncontrollably", "digs {npcP} nails into you"]
    },
    
    // Vagina/Pussy
    vagina: {
        mild: ["lets out a soft sigh", "shifts slightly", "glances at you", "smiles warmly"],
        moderate: ["lets out a soft moan", "spreads {npcP} legs slightly", "gasps", "presses against your hand"],
        high: ["moans loudly", "grinds against your hand", "whispers encouragement", "shivers"],
        intense: ["gasps and moans", "bucks {npcP} hips", "begs for more", "drips with arousal"]
    },
    pussy: {
        mild: ["lets out a soft sigh", "shifts slightly", "glances at you", "smiles warmly"],
        moderate: ["lets out a soft moan", "spreads {npcP} legs slightly", "gasps", "presses against your hand"],
        high: ["moans loudly", "grinds against your hand", "whispers encouragement", "shivers"],
        intense: ["gasps and moans", "bucks {npcP} hips", "begs for more", "drips with arousal"]
    },
    clitoris: {
        mild: ["lets out a tiny gasp", "shivers", "bits {npcP} lip", "tenses"],
        moderate: ["lets out a soft moan", "presses against your fingers", "gasps sharply", "arches {npcP} back"],
        high: ["moans loudly", "grinds against you", "whispers please don't stop", "trembles with pleasure"],
        intense: ["screams with pleasure", "bucks wildly", "begs desperately", "nearly climaxing"]
    },
    
    // Buttocks/Anus
    buttocks: {
        mild: ["lets out a soft sigh", "shifts {npcP} weight", "glances back at you", "smiles"],
        moderate: ["lets out a soft moan", "presses back against you", "gasps with pleasure", "arches slightly"],
        high: ["moans loudly", "grinds back against you", "whispers encouragement", "shivers with arousal"],
        intense: ["gasps and moans", "pushes back", "begs for more", "trembles with need"]
    },
    anus: {
        mild: ["tenses slightly", "lets out a soft sigh", "shifts nervously", "glances back"],
        moderate: ["lets out a soft moan", "presses back against your touch", "gasps at the sensation", "relaxes slightly"],
        high: ["moans with pleasure", "pushes back against you", "whispers yes", "shivers with arousal"],
        intense: ["gasps and moans loudly", "pushes back eagerly", "begs to be filled", "trembles with need"]
    },
    
    // Penis
    penis: {
        mild: ["lets out a soft sigh", "shifts slightly", "glances at you", "tenses"],
        moderate: ["lets out a soft moan", "hardens further", "gasps with pleasure", "presses into your touch"],
        high: ["moans loudly", "thrusts into your hand", "whispers your name", "shivers with arousal"],
        intense: ["gasps and moans", "bucks his hips", "begs for more", "nearly climaxing"]
    },
    cock: {
        mild: ["lets out a soft sigh", "shifts slightly", "glances at you", "tenses"],
        moderate: ["lets out a soft moan", "hardens further", "gasps with pleasure", "presses into your touch"],
        high: ["moans loudly", "thrusts into your hand", "whispers your name", "shivers with arousal"],
        intense: ["gasps and moans", "bucks his hips", "begs for more", "nearly climaxing"]
    },
    testicles: {
        mild: ["lets out a soft sigh", "shifts slightly", "glances at you", "tenses"],
        moderate: ["lets out a soft moan", "gasps at your touch", "presses into your hand", "shivers slightly"],
        high: ["moans with pleasure", "whispers your name", "shivers with arousal", "tenses with pleasure"],
        intense: ["gasps loudly", "trembles with pleasure", "begs for more", "nearly climaxing"]
    },
    balls: {
        mild: ["lets out a soft sigh", "shifts slightly", "glances at you", "tenses"],
        moderate: ["lets out a soft moan", "gasps at your touch", "presses into your hand", "shivers slightly"],
        high: ["moans with pleasure", "whispers your name", "shivers with arousal", "tenses with pleasure"],
        intense: ["gasps loudly", "trembles with pleasure", "begs for more", "nearly climaxing"]
    },
    
    // General
    general: {
        mild: ["responds", "reacts", "acknowledges", "sighs softly"],
        moderate: ["lets out a soft moan", "sighs with pleasure", "responds enthusiastically", "enjoys the attention"],
        high: ["moans with pleasure", "responds passionately", "whispers encouragement", "shivers with arousal"],
        intense: ["gasps and moans", "responds with desperate need", "begs for more", "trembles with pleasure"]
    }
};

// ============================================================================
// BOUND CAPTIVE VOCAL REACTIONS
// ============================================================================
// Vocal reactions for bound/conscious captives. These are spoken lines that
// express the NPC's feelings about being used while restrained.
// Reactions vary by:
// - Temperament: gruff (resistant/angry), plain (neutral), warm (pleading/accepting)
// - Species: Some species like orcs respect strength and may be excited/aroused
//   by being taken by a stronger opponent after a proper fight
// - Demeanor mode: dominant/submissive/consentual affects tone
//
// Structure: { temperament: { actionType: [reactions] } }
// Action types: "general", "tease", "penetrate", "continue", "climax"

var BOUND_CAPTIVE_REACTIONS = {
    // GRUFF temperament - angry, resistant, threatening
    gruff: {
        general: [
            `"Get your hands off me!"`,
            `"Unhand me, you bastard!"`,
            `"I'll make you pay for this!"`,
            `"When I get free, you die!"`,
            `"This doesn't change anything!"`
        ],
        tease: [
            `"Stop that!"`,
            `"Don't you dare!"`,
            `"I'll kill you for this!"`,
            `"This is an outrage!"`
        ],
        penetrate: [
            `"NO! Get out! GET OUT!"`,
            `"You'll regret this!"`,
            `"I swear I'll end you!"`,
            `"Fuck you! Fuck you!"`
        ],
        continue: [
            `"Stop... please stop..."`,
            `"I hate you... I hate you..."`,
            `"This changes nothing!"`,
            `"I'll remember this..."`
        ],
        climax: [
            `"..."`,
            `"I hope you rot..."`,
            `"This means nothing..."`
        ]
    },
    // PLAIN temperament - neutral, matter-of-fact
    plain: {
        general: [
            `"What do you think you're doing?"`,
            `"This is unnecessary."`,
            `"I don't appreciate this."`,
            `"Please, just let me go."`
        ],
        tease: [
            `"That's... that's not appropriate."`,
            `"I'd rather you didn't."`,
            `"This isn't right."`
        ],
        penetrate: [
            `"Oh... oh no..."`,
            `"Please don't..."`,
            `"This isn't... this isn't what I wanted..."`
        ],
        continue: [
            `"It... it feels..."`,
            `"I can't... I can't stop you..."`,
            `"Please, just finish..."`
        ],
        climax: [
            `"...it's over?"`,
            `"That's... that's that then."`
        ]
    },
    // WARM temperament - pleading, accepting, submissive
    warm: {
        general: [
            `"Please, don't do this..."`,
            `"I'll be good, I promise!"`,
            `"Please, have mercy..."`,
            `"I'm scared... please don't hurt me..."`
        ],
        tease: [
            `"That's... please, don't..."`,
            `"I don't want this..."`,
            `"Please, just let me go..."`
        ],
        penetrate: [
            `"NO! Please no!"`,
            `"It hurts... please stop..."`,
            `"I'm begging you... don't..."`
        ],
        continue: [
            `"Please... please be gentle..."`,
            `"I can't... I can't fight..."`,
            `"Just... just get it over with..."`
        ],
        climax: [
            `"...it's done..."`,
            `"Please... please untie me now..."`
        ]
    }
};

// Species-specific overrides for bound captive reactions
// Some species have different cultural attitudes toward being taken/captured
var BOUND_CAPTIVE_SPECIES_REACTIONS = {
    // Orcs and similar strength-respecting species: being taken by a stronger
    // opponent after a proper fight is a sign of respect, even exciting
    orc: {
        gruff: {
            general: [
                `"Hah! Strong arm!"`,
                `"Good fight... now prove you can handle me!"`,
                `"A worthy opponent takes what they win!"`,
                `"Show me your strength, then!"`
            ],
            tease: [
                `"Teasing? Take me properly if you dare!"`,
                `"Is that all you've got?"`,
                `"Hmph. Not afraid of a little touch."`
            ],
            penetrate: [
                `"HAAH! There it is!"`,
                `"About time! Show me you earned this!"`,
                `"Take me then! Prove your victory!"`
            ],
            continue: [
                `"Yes! Like that!"`,
                `"Don't hold back! You won fair and square!"`,
                `"More! I want to feel the strength that beat me!"`
            ],
            climax: [
                `"HAH! Good... good!"`,
                `"A proper ending to a proper fight!"`,
                `"Well taken... well taken..."`
            ]
        },
        plain: {
            general: [
                `"You fought well... I respect that."`,
                `"A strong arm deserves its reward."`,
                `"I yield. Do as you will."`
            ],
            penetrate: [
                `"A fair victory... I accept this."`,
                `"The strong take what they earn."`
            ],
            continue: [
                `"Mmm... yes..."`,
                `"Strength... feels good..."`
            ],
            climax: [
                `"A fine ending..."`,
                `"Well done, warrior..."`
            ]
        },
        warm: {
            general: [
                `"Please... be strong for me..."`,
                `"I want to feel... the strength that defeated me..."`
            ],
            penetrate: [
                `"Yes! Take me! I want to feel your victory!"`,
                `"Mmm... so strong... so powerful..."`
            ],
            continue: [
                `"More... please more..."`,
                `"You're so strong... I can't resist..."`,
                `"Yes! Claim your prize!"`
            ],
            climax: [
                `"Ahhh... so good..."`,
                `"I... I'm yours..."`
            ]
        }
    },
    // Similar for other strength-based species
    goblin: {
        gruff: {
            general: [
                `"Sneaky bastard!"`,
                `"Cheap trick! But... I respect cunning too."`,
                `"Fine! Take what you won!"`
            ],
            penetrate: [
                `"Hah! You got me! Now prove you can keep me!"`
            ]
        },
        warm: {
            general: [
                `"Please... be nice..."`,
                `"I surrender... do what you want..."`
            ],
            penetrate: [
                `"Mmm... strong..."`
            ]
        }
    }
};

// Temperament helper - map NPC temperament to reaction pool
function getCaptiveReactionTemperament(npc) {
    if (!npc) return "plain";
    const temp = (npc.temperament || "").toLowerCase();
    if (temp.includes("gruff") || temp.includes("aggressive") || temp.includes("angry") || temp.includes("hostile")) {
        return "gruff";
    }
    if (temp.includes("warm") || temp.includes("friendly") || temp.includes("kind") || temp.includes("gentle")) {
        return "warm";
    }
    return "plain";
}

// Get vocal reaction for a bound captive
function getBoundCaptiveVocalReaction(npc, act, actionType = null) {
    if (!npc || !act) return "";
    
    // Don't vocalize for unconscious actions
    if (act.unconsciousOnly === true || act.nonConsensual === true) {
        return "";
    }
    
    // Check if NPC is bound and surrendered (conscious captive)
    if (!(npc.bound && npc.surrendered)) return "";
    
    // Determine action type from act
    const type = actionType || act.type || "general";
    
    // Get base temperament
    const temperament = getCaptiveReactionTemperament(npc);
    
    // Get species
    const species = (npc.species || "").toLowerCase();
    
    // Check for species-specific reactions first
    const speciesReactions = BOUND_CAPTIVE_SPECIES_REACTIONS[species];
    if (speciesReactions && speciesReactions[temperament] && speciesReactions[temperament][type]) {
        return pickRandom(speciesReactions[temperament][type]);
    }
    
    // Fall back to temperament-based reactions
    const baseReactions = BOUND_CAPTIVE_REACTIONS[temperament];
    if (baseReactions && baseReactions[type]) {
        return pickRandom(baseReactions[type]);
    }
    
    // Final fallback
    if (baseReactions && baseReactions.general) {
        return pickRandom(baseReactions.general);
    }
    
    return "";
}

/**
 * Build a CoT-style narrative response for an intimacy action
 * Incorporates:
 * - NPC anatomy and traits
 * - Current arousal level
 * - Action type and target
 * - Dialogue tags from action definition
 * - Personality context
 */
var PLAYER_ORGASM_SAMPLES = {
    // NPC's mouth on the player's pussy
    oral: {
        plain: [
            "The pressure {npcs} has been winding tighter finally crests, and you stop holding it back. Your hips press up into {npcp} mouth as the first wave rolls through you, thighs clamping around {npcp} head. {npcS} moans against you and keeps {npcp} lips exactly where they are, riding out every shudder until you go still. You climax so hard your vision spots, and {npcs} gentles you through the last of it with slow, soft licks.",
            "You succumb to the pressure all at once — no warning you could have given — your back bowing as the orgasm breaks over you. {npcS} seals {npcp} lips around your clit and sucks you through it, hands holding your shaking thighs apart. You climax in long, rolling waves, each one softer than the last, and {npcs} only pulls back when your body finally goes limp beneath {npcO}.",
            "{npcS} feels you start to tremble under {npcp} mouth and doubles down, tongue working faster, and that is what pushes you over. You climax with a broken gasp, fingers tangling in {npcp} hair to hold {npcO} there while your hips grind against {npcp} face. {npcS} groans into you like {npcs} is the one being rewarded, and {npcs} does not stop until the last aftershock stills you.",
            "The pleasure climbs with every pass of {npcp} tongue, a wave cresting higher and higher until you cannot hold it back anymore. You climax with a cry, your body spasming with the force of it, and {npcs} holds your hips steady and keeps {npcp} mouth on you, drawing out every last pulse until you are left gasping.",
            "You feel yourself getting closer and closer to the edge, legs trembling with the effort of staying still — and then {npcs} flicks {npcp} tongue just right and the edge takes you. You climax with a sob, the tension that coiled so tight in your belly letting go all at once, and {npcs} works you through every wave of it."
        ],
        squirt: [
            "The pressure crests and you let go, and this time it does not stay inside you — you squirt against {npcp} mouth, a hot rush that stripes {npcp} chin and soaks the sheets. {npcS} gasps, then presses {npcp} lips back over you to catch the next wave. You climax in messy pulses, hips jerking with every one, and {npcs} rides out each spasm with {npcp} mouth sealed to you.",
            "You break with a cry, your release spurting over {npcp} lips and cheeks as your pussy pulses with it. {npcS} does not flinch — {npcs} groans at the taste of you and keeps {npcp} tongue moving through each aftershock. You climax so long and so hard that your legs will not hold you afterward."
        ]
    },
    // Something inside the player (vaginal penetration, either direction)
    penetration: {
        plain: [
            "The pressure that has been gathering with every stroke finally crests, and you stop fighting it. Your inner walls clamp down on what is filling you, hips stuttering, and the orgasm rolls through you in long, clenching waves. You climax with a low, helpless sound, and {npcs} holds you steady through it, growling praise into your ear as you shudder around {npcO}.",
            "One more movement is all it takes. The pressure breaks, and your whole body draws tight — thighs locking, breath stopping, back arching — before the wave lets go of you and you melt. You climax in rough pulses, your hips working on instinct, and {npcs} keeps moving to draw every last ripple out of you.",
            "You can feel it building — the pressure coiling tighter and tighter low in your belly with every stroke — and when it finally crests there is no holding back. Your orgasm crashes over you like a wave, and you climax gasping, your body clenching hard around {npcO}, while {npcs} groans at the grip of you and does not dare stop."
        ],
        squirt: [
            "You feel it building past the point of no return — a pressure that needs out — and when it breaks, it breaks wet. You squirt around {npcO} in a hot gush that floods where your bodies meet, your body gripping {npcO} through every pulse. {npcS} groans at the sudden flood and keeps moving, dragging your climax out until you are too sensitive to take more.",
            "The crest hits and you let go completely, a rush of wetness spurting out around {npcO} as your hips jerk helplessly. {npcS} stills to feel you clench and gush around {npcp}, murmuring filth against your neck, and you climax until your thighs are shaking and everything beneath you is soaked."
        ]
    },
    // Manual, grinding, or plain surrender — no penetration, no mouth
    general: {
        plain: [
            "You succumb to the pressure at last — no act, no warning, just the pleasure finally overtaking you. Your hips lift, every muscle drawing tight, and then release: long, rolling waves that leave you gasping. You climax with {npcp} name on your lips, and {npcs} watches you come apart with dark, satisfied eyes, {npcp} hands never stopping their steady work.",
            "It has been building for too long to stop. You let the pressure crest and break, your body taking over — thighs snapping shut, back arching, a breath caught halfway between a gasp and a moan. You climax in wave after wave that leave you flushed and trembling, and {npcs} holds you through it, pressing kisses to whatever skin {npcs} can reach.",
            "It builds the way a wave builds — higher and higher with every breath, until the effort of holding still makes your legs tremble — and then it breaks. You climax hard, crying out, your body convulsing through it in long waves, and {npcs} watches every second of it with {npcp} hands braced on your shaking thighs."
        ],
        squirt: [
            "When you finally let go, your body gives back more than you expected: you squirt, a hot rush soaking your thighs and everything under you as the orgasm tears through. You climax in hard, messy pulses, hips jerking with each one, and {npcs} makes a low, awed sound and presses {npcp} palm flat against you through the rest of it.",
            "The pressure crests and you break wet — a gush that splashes over {npcp} hand and wrist as your pussy pulses with it. You climax so hard your ears ring, hips bucking into the feeling, and {npcs} works you through every last spasm until you beg {npcO} to stop."
        ]
    }
};

// Male player climax samples - context-aware like PLAYER_ORGASM_SAMPLES
// Keyed by what the player's cock is doing at the moment of climax
var PLAYER_MALE_CLIMAX_SAMPLES = {
    // Inside NPC's mouth (fellatio)
    oral: [
        "Your cock swells and you cannot hold back any longer. With a groan you bury yourself deep in {npcp} throat and come, thick spurts of cum flooding {npcp} mouth. {npcS} gurgles around your shaft, swallowing as you pulse, {npcp} tongue working the underside of your cock to draw out every last drop as you climax intensely.",
        "The pressure crests and you push deep, seating yourself to the root in {npcp} mouth. Your orgasm tears through you as you empty yourself down {npcp} throat, {npcs} lips sealed tight around the base of your shaft. You climax with a broken groan, hips jerking as {npcs} continues to suck you through each wave.",
        "You feel the heat building in your balls with every stroke of {npcp} tongue, and then it breaks. You thrust deep and come hard, filling {npcp} mouth with your release. {npcS} moans around your cock, {npcp} throat working as you climax, {npcp} hands gripping your hips to keep you buried deep.",
        "With a sharp cry you climax, driving your cock into {npcp} mouth as the first wave hits. {npcS} doesn't pull back — {npcs} takes it all, {npcp} lips pressed against your skin, {npcp} tongue massaging your shaft as you spill your cum in hot pulses.",
        "The pleasure coils tighter and tighter until it snaps. You groan and thrust deep into {npcp} mouth, coming hard as {npcs} swallows around you. Your climax rolls through you in waves, {npcp} hands holding your hips steady as you empty yourself between {npcp} lips."
    ],
    // Inside NPC's vagina
    vaginal: [
        "The pressure that has been building with every stroke finally peaks, and you slam home one last time. You climax deep inside {npcp} pussy, your cock pulsing as you fill {npcp} with your cum. {npcS} cries out at the sudden heat flooding {npcp}, {npcp} inner walls clamping down on your shaft as you ride out the last waves of your orgasm.",
        "You drive in hard and the dam breaks. With a guttural groan you bury yourself to the hilt and come, your release flooding {npcp} depths. {npcS} gasps and clenches around you, {npcp} body milking your cock as you climax, the tight grip drawing out every last spurt.",
        "The pleasure climbs with every thrust until it crests all at once. You press deep and let go, spilling your seed into {npcp} welcoming heat. {npcS} moans beneath you, {npcp} hips lifting to take you deeper as you climax, {npcp} body shuddering around your pulsing cock.",
        "One final, desperate thrust and you're over the edge. You climax with a roar, emptying yourself deep inside {npcp}, the slick walls of {npcp} pussy gripping your shaft as you pulse. {npcS} wraps {npcp} legs around you, holding you tight as the last aftershocks ripple through you.",
        "The tension snaps and you slam into {npcp} with a final, deep thrust. Your orgasm tears through you as you come inside {npcp}, the hot flood of your release filling {npcp} completely. {npcS} whimpers and clings to you, {npcp} body trembling around your cock as you finish."
    ],
    // Inside NPC's anus
    anal: [
        "The tight heat of {npcp} ass finally pushes you over the edge. You thrust deep and come hard, filling {npcp} bowels with your release. {npcS} cries out at the sudden fullness, {npcp} ring clamping down on your shaft as you climax, {npcp} body struggling to contain your thick load.",
        "The pressure builds until it's unbearable, and you drive in deep one last time. You climax in {npcp} tight ass, your cock pulsing as you spill your cum inside {npcO}. {npcS} gasps and clenches around you, {npcp} body gripping your shaft as you ride out the waves of pleasure.",
        "With a groan you bottom out in {npcp} ass and let go. Your release floods {npcp} depths, the tight channel milking every drop from your cock. {npcS} moans and pushes back against you, {npcp} hips grinding as you climax together, the intense pressure drawing out your orgasm.",
        "The pleasure crashes over you and you bury yourself to the root. You come hard in {npcp} ass, thick spurts of cum filling {npcp} tight passage. {npcS} whimpers and bears down, {npcp} body taking your release as you pulse deep inside {npcO}.",
        "You can't hold back any longer. You thrust deep into {npcp} ass and climax with a shout, your cock jerking as you spill your seed. {npcS} groans beneath you, {npcp} tight heat clenching around your shaft as you finish, drawing out the last of your orgasm."
    ],
    // On NPC's body (external finish)
    external: [
        "The pleasure finally crests and you pull back, stroking yourself as the first wave hits. You climax hard, painting {npcp} {target} with thick ropes of cum. {npcS} watches with dark, satisfied eyes as you spend yourself across {npcp} skin, {npcp} breath catching as the hot streaks land.",
        "With a groan you pull out at the last moment and come, thick spurts of cum splattering across {npcp} {target}. {npcS} gasps as the warm fluid hits {npcp} skin, {npcp} fingers reaching out to catch some of your release as you climax, your cock jerking in your hand.",
        "The pressure peaks and you cannot hold it back. You pull away and climax, your cum arcing through the air to land on {npcp} {target}. {npcS} moans at the sight, {npcp} tongue darting out to taste the droplets that land on {npcp} lips as you finish with a shudder.",
        "The tension finally snaps and you withdraw, your cock throbbing in your grip. You climax with a cry, thick jets of cum painting {npcp} {target} in warm streaks. {npcS} shivers as the fluid touches {npcp} skin, {npcp} eyes locked on your cock as you spend yourself.",
        "You feel the orgasm building and pull back just in time. You come hard, your release splashing across {npcp} {target} in messy ropes. {npcS} watches avidly as you climax, {npcp} hand reaching out to catch some of your cum as it lands, spreading it across {npcp} skin with a hungry smile."
    ],
    // Hands or general stimulation (no specific target)
    general: [
        "The pressure finally breaks and you groan, your cock throbbing in your grip. You climax hard, thick spurts of cum splattering across your hand and the space between you. {npcS} watches with intense focus as you spend yourself, {npcp} breath catching at the sight of your release.",
        "With a shout you come, your body tensing as the orgasm rolls through you. Your cock jerks violently, cum shooting across the space between you. {npcS} gasps and leans in, {npcp} tongue catching a droplet of your release as you finish with a shudder.",
        "The pleasure builds until it's unbearable, and then it breaks. You climax with a broken cry, your cock pulsing as you spill your cum. {npcS} watches every second, {npcp} eyes dark with arousal as {npcs} takes in the sight of your release.",
        "Your balls draw up tight and you know it's coming. With a groan you climax, thick ropes of cum painting the air between you. {npcS} reaches out, {npcp} fingers catching some of your release and bringing it to {npcp} mouth, {npcp} tongue tasting your cum as you finish.",
        "The tension snaps and you come hard, your cock jerking in your hand as thick spurts of cum spray out. {npcS} moans at the sight, {npcp} hand joining yours on your shaft, helping you milk out the last drops as you climax together."
    ]
};

/**
 * True while the NPC's mouth is working the player's pussy — the climax
 * context for the female receive-oral acts. They never set penetration
 * state, so the climax gates read the last action instead.
 */
function _playerPussyOralActive(npc) {
    var la = npc && npc.intimacy && npc.intimacy.lastAction;
    return !!(la && ["lick_player_pussy", "suck_player_clit"].indexOf(String(la.actId || "")) !== -1);
}

/**
 * Player climax beats (player_orgasm "Succumb to the pressure",
 * female_ejaculate "Squirt"): the female player's release narrated in
 * second person, with the NPC's reaction woven in. Keyed by stimulation
 * context (oral on her pussy / penetration / general) and plain vs
 * squirt, drawn anti-repeated and pronoun-resolved like the servicing
 * pools. Every beat contains "You climax" verbatim so the generic
 * climax-notification line in executeIntimacyAction is suppressed.
 */
function buildPlayerOrgasmNarration(npc, player, act, intimacy) {
    var pen = intimacy && intimacy.penetration;
    var ctx = "general";
    if (_playerPussyOralActive(npc)) {
        ctx = "oral";
    } else if (pen && pen.active &&
        ((pen.target === "vagina" && pen.playerIsBottom) || pen.tool === "vagina")) {
        ctx = "penetration";
    }
    var squirt = act && act.id === "female_ejaculate";
    var pool = PLAYER_ORGASM_SAMPLES[ctx] || PLAYER_ORGASM_SAMPLES.general;
    var beats = squirt ? pool.squirt : pool.plain;
    if (!beats || !beats.length) beats = PLAYER_ORGASM_SAMPLES.general.plain;
    return applyNPCPronouns(npc, pickUnique(beats, intimacy, "player-orgasm-" + ctx + (squirt ? "-squirt" : "-plain")));
}

/**
 * Build male player climax narration
 * Determines context based on where the player's cock is at the moment of climax:
 * - oral: NPC's mouth on player's cock (fellatio)
 * - vaginal: player's cock inside NPC's vagina
 * - anal: player's cock inside NPC's anus
 * - external: finishing on NPC's body (target specified)
 * - general: other/unknown context
 * Returns a descriptive climax narration with NPC reaction
 */
function buildMaleClimaxNarration(npc, player, act, intimacy) {
    var pen = intimacy && intimacy.penetration;
    var target = act ? (act.target || (act.consequence === "internal_semen" ? "vagina" : "")) : "";
    var ctx = "general";
    
    // Determine context based on penetration state and action
    if (pen && pen.active && pen.tool === "penis") {
        if (pen.target === "mouth" || pen.target === "lips") {
            ctx = "oral";
        } else if (pen.target === "vagina" || pen.target === "pussy" || pen.target === "clitoris" || pen.target === "clit") {
            ctx = "vaginal";
        } else if (pen.target === "anus" || pen.target === "ass" || pen.target === "buttocks" || pen.target === "butt") {
            ctx = "anal";
        }
    } else if (act && act.consequence === "internal_semen") {
        // Internal ejaculation climax action
        if (target === "vagina" || target === "pussy") ctx = "vaginal";
        else if (target === "anus" || target === "ass") ctx = "anal";
        else if (target === "mouth") ctx = "oral";
    } else if (act && act.consequence === "external_semen") {
        // External finish - use the target or default to general
        ctx = "external";
    }
    
    var pool = PLAYER_MALE_CLIMAX_SAMPLES[ctx] || PLAYER_MALE_CLIMAX_SAMPLES.general;
    var beats = pool;
    if (!beats || !beats.length) beats = PLAYER_MALE_CLIMAX_SAMPLES.general;
    
    // Pick a unique beat and apply NPC pronouns
    var beat = pickUnique(beats, intimacy, "player-male-climax-" + ctx);
    if (!beat) beat = pickRandom(beats);
    return applyNPCPronouns(npc, beat);
}

function buildIntimacyResponse(npc, player, act, intimacy) {
    if (!npc || !act) {
        return pickRandom(BODY_PART_REACTIONS.general.moderate);
    }
    
    // ── UNCONSCIOUS ACTIONS ────────────────────────────────────
    // Unconscious/sleeping NPCs cannot give conscious reactions - only
    // reflexive physical responses are possible. Use dedicated reflexive
    // reaction pool for ANY act on a cannot-speak NPC (not just the
    // unconsciousOnly acts, so bound-captive vocal lines can't leak through).
    if (npcCannotSpeak(npc) || act.unconsciousOnly === true || act.nonConsensual === true) {
        return buildUnconsciousReaction(npc, player, act, intimacy);
    }
    
    // ── BOUND CAPTIVE VOCAL REACTIONS ──────────────────────────
    // Bound captives who are conscious can speak - they yell, insult, plead,
    // or (for some species) express excitement at being taken by a stronger foe.
    // Check if NPC is bound and surrendered (conscious captive)
    if (npc.bound && npc.surrendered && !act.unconsciousOnly) {
        const vocalReaction = getBoundCaptiveVocalReaction(npc, act, act.type);
        if (vocalReaction) {
            // Return vocal reaction, which may be combined with physical reaction
            return vocalReaction;
        }
    }
    
    // ── RECEIVE ACTIONS (playerIsBottom) ───────────────────────
    // For receive actions, the NPC is the actor performing the action on
    // the player. The response should reflect the NPC's compliance or
    // enthusiasm based on temperament, not a body-part reaction.
    if (act.playerIsBottom) {
        return buildReceiveResponse(npc, player, act, intimacy);
    }
    // ── PLAYER CLIMAX ACTS ─────────────────────────────────────────
    // Succumb to the pressure / Squirt: the female player's climax
    // beats get dedicated narration, not the penetration-continue path.
    if (act.id === "player_orgasm" || act.id === "female_ejaculate") {
        return buildPlayerOrgasmNarration(npc, player, act, intimacy);
    }
    
    const npcName = npc.name || "They";
    const isProperName = !/^(a |an |the )/i.test(npcName);
    const subjectPronoun = getSubjectPronoun(npc) || "They";
    const possessivePronoun = getPossessivePronoun(npc) || "their";
    const objectPronoun = getObjectPronoun(npc) || "them";
    
    // Get context
    const arousalLevel = intimacy ? intimacy.arousal.npc : 0;
    const arousalDesc = getArousalDescriptor(arousalLevel);
    const intensity = getReactionIntensity(arousalLevel);
    const target = act.target || "general";
    const tool = act.tool || "hand";
    const verb = act.verb || "touch";
    
    // Check cooldown state for player
    const playerGender = getPlayerGenderForGates(player);
    const isPlayerOnCooldown = playerGender === "male" && intimacy && intimacy.climax && intimacy.climax.playerCooldownUntil && Date.now() < intimacy.climax.playerCooldownUntil;
    const isNPConCooldown = npc.gender && (npc.gender.toLowerCase() === "male" || npc.gender.toLowerCase().includes("male")) && intimacy && intimacy.climax && intimacy.climax.npcCooldownUntil && Date.now() < intimacy.climax.npcCooldownUntil;
    
    // Get body part-specific reactions
    const bodyReactions = BODY_PART_REACTIONS[target] || BODY_PART_REACTIONS.general;

    // Cap reaction intensity by body part sensitivity. Even at high arousal,
    // non-erogenous or mildly erogenous zones shouldn't produce "screams with
    // pleasure" — that's reserved for direct contact with primary erogenous
    // zones (genitals, nipples, anus). Kissing a cheek at 85 arousal shouldn't
    // elicit the same reaction as touching someone's clitoris.
    var SENSITIVITY_TIERS = {
        // Primary erogenous zones — can reach "intense"
        nipples: "intense", clitoris: "intense", clit: "intense",
        vagina: "intense", pussy: "intense",
        anus: "intense", penis: "intense", cock: "intense",
        testicles: "intense", balls: "intense",
        // Secondary erogenous zones — cap at "high"
        breasts: "high", buttocks: "high", ass: "high", butt: "high",
        thighs: "high", "inner thighs": "high",
        groin: "high", neck: "high", stomach: "high",
        // Mildly erogenous / social — cap at "moderate"
        hair: "moderate", face: "moderate", cheek: "moderate", cheeks: "moderate",
        lips: "moderate", mouth: "moderate", back: "moderate",
        shoulders: "moderate", arms: "moderate", hands: "moderate",
        legs: "moderate", feet: "moderate"
    };
    var maxTier = SENSITIVITY_TIERS[target.toLowerCase()] || "high";
    const reaction = applyNPCPronouns(npc, getWeightedReaction(bodyReactions, scaleArousal(arousalLevel), maxTier));
    
    // Get anatomy descriptions
    let anatomyDesc = "";
    let bodyPartDesc = target;
    
    // Try to get actual anatomy description
    if (typeof getNPCTrait === "function") {
        anatomyDesc = getNPCTrait(npc, target) || "";
        if (anatomyDesc && anatomyDesc !== target) {
            bodyPartDesc = anatomyDesc;
        }
    }
    
    // Get dialogue tags from action (CoT-style)
    // Priority: objectDialogueTags (object perspective) > dialogueTags > tags
    const dialogueTags = act.objectDialogueTags || act.dialogueTags || act.tags || [];
    
    // Build response based on action type
    switch (act.type) {
        case ACT_TYPES.TEASE:
            return buildTeaseResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc, reaction, dialogueTags);
            
        case ACT_TYPES.PENETRATE:
            return buildPenetrationResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc, reaction, "enter", dialogueTags);
            
        case ACT_TYPES.CONTINUE:
            return buildPenetrationResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc, reaction, "continue", dialogueTags);
            
        case ACT_TYPES.IMPACT:
            return buildImpactResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc, reaction, dialogueTags);

        case ACT_TYPES.WATERSPORT:
            return buildWatersportResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc);
            
        case ACT_TYPES.END:
            return pickRandom([
                `nods contentedly.`,
                `takes a deep breath and relaxes.`,
                `smiles warmly at you.`,
                `looks at you with warm eyes.`
            ]);
            
        default:
            return buildGenericResponse(npc, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, reaction, dialogueTags);
    }
}

/**
 * Build response for tease actions
 * Note: Don't include subject pronoun - it's added by formatIntimacyNPCResponse
 * Note: Don't repeat the action - just describe the NPC's reaction
 * Now uses CoT-style dialogue tags for verbal responses
 */
function buildTeaseResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc, reaction, dialogueTags = []) {
    const verb = act.verb || "touch";
    const tool = act.tool || "hand";
    const target = act.target || "body";

    // Determine foreplay intensity from the act's arousal impact.
    // Low-n acts (cheek kiss: n=3, hair stroke: n=5) are "light foreplay" —
    // they should produce subdued reactions (smiles, sighs, leans in).
    // High-n acts (squeeze ass: n=22, spread cheeks: n=30) are "heavy foreplay" —
    // they can produce moans, gasps, arching.
    var npcArousalGain = (act.arousal && act.arousal.n) || 5;
    var isLightForeplay = npcArousalGain <= 10;
    var isHeavyForeplay = npcArousalGain >= 20;

    // Get descriptors based on arousal (scale 0-800 to 0-100 for helper functions)
    var scaledArousal = scaleArousal(arousalLevel);
    const tempDesc = getTemperatureDescriptor(scaledArousal);
    const intensity = getReactionIntensity(scaledArousal);
    const vocalization = getVocalization(scaledArousal);

    // Cap dialogue intensity by foreplay intensity — gentle acts shouldn't
    // produce extreme verbal responses even at high arousal.
    var maxDialogueTier = isLightForeplay ? "mild" : isHeavyForeplay ? "high" : "moderate";

    // Get dialogue from tags (CoT-style) — lower chance for light foreplay
    let dialogueLine = null;
    var dialogueChance = isLightForeplay ? 0.10 : isHeavyForeplay ? 0.35 : 0.25;
    if (Math.random() < dialogueChance && dialogueTags && dialogueTags.length > 0) {
        dialogueLine = getDialogueFromTags(dialogueTags, arousalLevel, npc, maxDialogueTier);
    }

    // Build template pool based on foreplay intensity
    var templates;

    if (isLightForeplay) {
        // Light foreplay: subdued, gentle reactions. No moans, no arching,
        // no loud sounds. Just soft, warm, appreciative responses.
        templates = [
            `smiles softly.`,
            `leans into your touch.`,
            `sighs contentedly.`,
            `${reaction} at your touch.`,
            `closes ${possessivePronoun} eyes for a moment.`,
            `lets out a quiet breath.`,
            `relaxes beneath your touch.`,
            `${reaction} softly.`,
            `turns toward you slightly.`
        ];
    } else if (isHeavyForeplay) {
        // Heavy foreplay: can have moans, gasps, arching — but still
        // not as extreme as penetration-level reactions.
        templates = [
            `${reaction} at your touch.`,
            `${reaction}, ${tempDesc}.`,
            `${reaction} at the sensation.`,
            `lets out a ${vocalization}.`,
            `shivers ${intensity}.`,
            `${reaction}, breathing ${intensity}.`,
            `${reaction} and bites ${possessivePronoun} lip.`
        ];
    } else {
        // Medium foreplay: moderate reactions
        templates = [
            `${reaction} at your touch.`,
            `${reaction}, ${tempDesc}.`,
            `${reaction} at the sensation.`,
            `lets out a ${vocalization}.`,
            `shivers ${intensity}.`,
            `${reaction}.`,
            `${reaction}, breathing ${intensity}.`
        ];
    }

    // Oral service on the player (kiss/lick/suck on the penis): an
    // EXTENDED, progressive beat. The NPC works the player's cock through
    // several distinct steps instead of a single short reaction - matching
    // the multi-beat sample style the AI is prompted with for these acts
    // (isExtendedOralAction / buildIntimacyPrompt).
    const isOralServiceAct = (target === "penis" || target === "cock") &&
        (tool === "mouth" || tool === "lips" || tool === "tongue");
    if (isOralServiceAct) {
        var _oTemp = String((npc && npc.temperament) || "").toLowerCase();
        var _oIsEager = ["forward", "bold", "lustful", "playful"].indexOf(_oTemp) !== -1;
        var _oIsShy = ["shy", "timid", "reserved", "innocent"].indexOf(_oTemp) !== -1;
        // Cock flavor from the player's profile (size/color words) - the
        // same source the penetration flavor reads.
        var _oralTool = "cock";
        if (player && player.anatomy && !act.playerIsBottom) {
            var _oSize = (typeof getPlayerCockSize === "function") ? getPlayerCockSize(player) : "medium";
            var _oColor = (typeof getPlayerCockColorWord === "function") ? getPlayerCockColorWord(player) : "";
            if (_oSize === "large") _oralTool = ("thick " + _oColor + " cock").replace(/\s+/g, " ").trim();
            else if (_oSize === "small") _oralTool = ("slender " + _oColor + " cock").replace(/\s+/g, " ").trim();
            else if (_oColor) _oralTool = (_oColor + " cock").replace(/\s+/g, " ").trim();
        }
        if (_oIsEager) {
            templates = [
                `licks a slow stripe up the length of your ${_oralTool} before swallowing you down in one smooth motion, ${possessivePronoun} throat working around your girth. ${subjectPronoun} bobs with wanton enthusiasm, saliva running down your shaft, pausing only to swirl ${possessivePronoun} tongue around the head. ${subjectPronoun} pulls off with an obscene pop and grins up at you, lips glistening. <You like that, hmm? Tell me how much.>`,
                `wraps a hand around the base of your ${_oralTool} and mouths the head like ${subjectPronoun.toLowerCase()}'s savoring it, tongue swirling slow circles before ${subjectPronoun.toLowerCase()} takes you in deep pulls. ${subjectPronoun} hums approval around your girth with every stroke, cheeks hollowing, ${possessivePronoun} free hand cupping your balls and kneading them in time with ${possessivePronoun} mouth. When ${subjectPronoun} surfaces for breath, ${subjectPronoun} strokes the wet length of you and smirks. <Mmm... want me to go slower, or are you going to make me hurry?>`
            ];
        } else if (_oIsShy) {
            templates = [
                `tentatively licks the tip of your ${_oralTool} before pressing a small kiss to it. ${subjectPronoun} opens ${possessivePronoun} mouth and breathes warm air over your shaft before taking just the head in, alternating gentle sucks with slightly firmer ones. ${subjectPronoun} slides ${possessivePronoun} lips a little further down, suckling softly, then pulls back until ${possessivePronoun} teeth graze your shaft and the cool air makes your balls tighten. ${subjectPronoun} looks up at you with wide, hopeful eyes. <Could I have another taste... please?>`,
                `holds your ${_oralTool} with both hands like something precious, ${possessivePronoun} breath ghosting over the tip as ${subjectPronoun.toLowerCase()} works up the nerve. ${subjectPronoun} starts with tiny, careful licks, then gathers courage and takes the head between ${possessivePronoun} lips, suckling softly. ${possessivePronoun} rhythm is hesitant, stopping to peek up at you after every few pulls, a pink blush spreading across ${possessivePronoun} cheeks. <I-Is this... right? Am I doing it right?>`
            ];
        } else {
            templates = [
                `settles between your legs and strokes your ${_oralTool} with a slow, curious hand, watching your face. ${subjectPronoun} leans in and licks a slow circle around the head, then slides ${possessivePronoun} lips down over you, taking you in inch by inch. ${possessivePronoun} mouth is hot and unhurried, ${possessivePronoun} tongue cradling the underside of your shaft on every pass. When ${subjectPronoun} pulls back for breath, ${possessivePronoun} hand keeps moving, wet and steady. ${subjectPronoun} glances up through ${possessivePronoun} lashes, waiting to see if you'll say anything.`,
                `dips ${possessivePronoun} head and lays ${possessivePronoun} tongue flat against the base of your ${_oralTool}, dragging upward in one long, deliberate stroke. ${subjectPronoun} takes the head between ${possessivePronoun} lips and works with quiet focus, hollowing ${possessivePronoun} cheeks in slow, even pulls. Saliva gathers at the corner of ${possessivePronoun} mouth as ${subjectPronoun.toLowerCase()} finds a rhythm, neither rushed nor teasing, one hand steadying your hip. ${subjectPronoun} only pulls off to catch a breath before returning to the wet heat of ${possessivePronoun} mouth.`
            ];
        }
    }

    let response = pickUnique(templates, intimacy, "tease-" + String(act.id || act.target || "x"));

    // Add verbal dialog from tags (CoT-style) - skipped for oral-service
    // samples, which already carry their own in-character dialogue.
    if (dialogueLine && !isOralServiceAct) {
        if (dialogueLine.isNonVerbal) {
            if (Math.random() < 0.5) {
                response = `${response} ${dialogueLine.text}`;
            }
        } else if (dialogueLine.isVerbal) {
            if (Math.random() < 0.6) {
                response = `says "${dialogueLine.text}"`;
            } else {
                response = `${response} "${dialogueLine.text}"`;
            }
        }
    }

    return response;
}

/**
 * Build response for penetration actions
 * Now uses CoT-style dialogue tags for verbal responses
 */
function buildPenetrationResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc, reaction, phase, dialogueTags = []) {
    const verb = act.verb || "enter";
    let tool = act.tool || "penis";
    const target = (act.target || "vagina").toLowerCase();
    // Local shorthand used in depth-based effects below
    var posPronoun = possessivePronoun || (typeof getPossessivePronoun === 'function' ? getPossessivePronoun(npc) : "their");
    
    // Get more descriptive vocabulary based on arousal
    const vocalization = getVocalization(arousalLevel);
    const pleasureIntensity = getPleasureIntensity(arousalLevel);

    // Check cooldown state for player
    const playerGender = getPlayerGenderForGates(player);
    const isPlayerOnCooldown = playerGender === "male" && intimacy && intimacy.climax && intimacy.climax.playerCooldownUntil && Date.now() < intimacy.climax.playerCooldownUntil;
    
    // Get penis state descriptor based on cooldown
    const toolState = isPlayerOnCooldown ? pickRandom(['limp', 'flaccid', 'soft', 'spent']) : pickRandom(['hard', 'rigid', 'throbbing', 'engorged']);
    
    // Apply state descriptor to penis/cock tool
    if (tool === 'penis' || tool === 'cock') {
        var _flavorTool = `${toolState} ${tool}`;
        // Color and size flavor from the player's character-creation picks
        // (anatomy materialized by ensurePlayerIntimacyAnatomy). Only the
        // player's own tool is flavored - when the NPC is the penetrating
        // party (playerIsBottom acts) the player's profile doesn't apply.
        if (!act.playerIsBottom && player && player.anatomy) {
            var _flavorSize = (typeof getPlayerCockSize === "function") ? getPlayerCockSize(player) : "medium";
            var _flavorColor = (typeof getPlayerCockColorWord === "function") ? getPlayerCockColorWord(player) : "";
            if (_flavorSize === "large") {
                _flavorTool = `${toolState} ${pickRandom(["thick", "girthy"])} ${_flavorColor} ${tool}`;
            } else if (_flavorSize === "small") {
                _flavorTool = `${toolState} ${pickRandom(["slender", "thin"])} ${_flavorColor} ${tool}`;
            } else if (_flavorColor) {
                _flavorTool = `${toolState} ${_flavorColor} ${tool}`;
            }
            _flavorTool = _flavorTool.replace(/\s+/g, " ").trim();
        }
        tool = _flavorTool;
    }

    // Color & size fit flavor: how the player's cock (profile) matches the
    // NPC's orifice, plus the NPC's skin color/texture words (e.g. "green
    // mottled skin"). Used by the fit-flavored template variants below and
    // mirrored into the AI prompt by getColorSizeContext().
    var _fit = (!act.playerIsBottom && typeof getPenetrationFit === "function") ? getPenetrationFit(player, npc, target) : "";
    var _skinWords = (typeof getNPCSkinFlavorWords === "function") ? getNPCSkinFlavorWords(npc) : null;
    var _skinPhrase = (_skinWords && _skinWords.color) ? `${_skinWords.color}${_skinWords.texture ? " " + _skinWords.texture : ""} skin` : "";

    // Deepthroat modes: top-led (the player drives their cock into the
    // throat), bottom-led (the NPC swallows the player down on their own),
    // and the legacy player-gives acts (deepthroat_penis / _player). Each
    // mode has its own template set, with gagging, slobber, coughing and
    // tears scaled by whoever's cock is being swallowed.
    var _dtId = String(act.id || "").toLowerCase();
    var _dtMode = (_dtId === "deepthroat_mouth" || _dtId === "throat_fuck") ? "top"
        : (_dtId === "self_deepthroat") ? "bottom"
        : (_dtId === "deepthroat_penis" || _dtId === "deepthroat_penis_player") ? "give" : "";
    var _dtCockSize = "medium";
    if (_dtMode === "top" && player && typeof getPlayerCockSize === "function") {
        _dtCockSize = getPlayerCockSize(player);
    } else if (_dtMode === "give") {
        var _dtAnat = (npc && npc.anatomy) || {};
        _dtCockSize = String((_dtAnat.genitalSize && _dtAnat.genitalSize.sizeCategory) || "medium").toLowerCase();
    }

    // Check if this is anal penetration with an uncivilized NPC
    const isAnalPenetration = target === "anus" || target === "ass";
    const isVaginalPenetration = target === "vagina" || target === "pussy";
    const isOralPenetration = target === "mouth" || target === "lips";
    const isUncivilized = npc && npc.species && !isCivilizedSpecies(npc.species);
    // For continue phase with anal penetration, replace "closed" descriptors with more appropriate ones
    // Since the anus is already penetrated, it shouldn't be described as "closed" or "resistant"
    if (phase === "continue" && isAnalPenetration) {
        // Replace problematic descriptors
        bodyPartDesc = bodyPartDesc
            .replace(/firmly closed/i, "tightly clenching")
            .replace(/resistant/i, "clenching")
            .replace(/shyly guarded/i, "gripping")
            .replace(/tense and shut/i, "tight")
            .replace(/tightly squeezed/i, "clenching");
    }
    
    // Get anatomy details for specialized responses
    const anatomy = (npc.nsfwTraits && npc.nsfwTraits.anatomy) || (npc.anatomy || {});
    const anusAnatomy = anatomy.anus || {};
    const anusSize = anusAnatomy.size || "snug";
    const hasLube = intimacy && intimacy.lube && intimacy.lube.anus && intimacy.lube.anus.hasLube;
    const lubeLevel = intimacy && intimacy.lube && intimacy.lube.anus ? intimacy.lube.anus.level : 0;
    
    // Get penetration depth for anal-specific narratives
    const penetrationDepth = intimacy && intimacy.penetration ? intimacy.penetration.depth : 0;
    const isDeepPenetration = penetrationDepth >= 3;
    
    // Tight anal sizes that may cause pulling away
    const isTightAnal = anusSize === "tight" || anusSize === "snug" || anusSize === "firm";
    
    // Check if last action was also anal (no pause = continuing same action)
    const lastActionId = intimacy && intimacy.lastAction ? intimacy.lastAction.actId : null;
    const lastWasAnal = lastActionId && (lastActionId.toLowerCase().includes('anus') || lastActionId.toLowerCase().includes('ass'));
    
    // Check for internal ejaculation - semen drip narratives
    const hasInternalEjaculation = intimacy && intimacy.climax && intimacy.climax.hasInternalEjaculation;
    const ejaculationTarget = intimacy && intimacy.climax ? intimacy.climax.lastInternalEjaculation : null;
    const matchingEjaculation = ejaculationTarget && ((isVaginalPenetration && ejaculationTarget === "vagina") || (isAnalPenetration && ejaculationTarget === "anus"));
    // Cum in cavity: 50% chance for cum-specific descriptions during continue
    const shouldSemenDrip = matchingEjaculation && Math.random() < 0.50;

    // Track anal ejaculation count for "full bowels" / "distended stomach" effects
    const analCumCount = (intimacy && intimacy.encounterFlags && intimacy.encounterFlags.analEjaculationCount) || 0;
    const isBowelsFull = isAnalPenetration && analCumCount >= 5;
    const isBowelsStuffed = isAnalPenetration && analCumCount >= 10;
    
    // Arousal level for climax approach narratives
    const npcArousal = intimacy ? intimacy.arousal.npc : 0;
    const playerArousal = intimacy ? intimacy.arousal.player : 0;
    const maxArousal = Math.max(npcArousal, playerArousal);
    
    // Climax approach: only show at 90%+ of orgasm threshold AND only 30%
    // of the time (so it doesn't repeat every turn). Previously triggered at
    // HIGH_AROUSAL (500/800 = 62%) which was far too frequent.
    var climaxApproachThreshold = Math.floor(AROUSAL_CONFIG.ORGASM_THRESHOLD * 0.9);
    const isNearClimax = maxArousal >= climaxApproachThreshold && maxArousal < AROUSAL_CONFIG.ORGASM_THRESHOLD && Math.random() < 0.3;
    const isAtClimaxThreshold = maxArousal >= AROUSAL_CONFIG.ORGASM_THRESHOLD;
    
    // Get arousal descriptors
    const npcArousalDesc = describeArousalLevel(npcArousal);
    const playerArousalDesc = describeArousalLevel(playerArousal);
    
    // Chance for receiver to pull away (higher if tight and no lube)
    const shouldPullAway = isAnalPenetration && Math.random() < 0.15 && isTightAnal;
    
    // Chance for trapped air/fart (only after several rounds without changing action)
    // Size affects frequency and sound: small = squeaky/embarrassing, large = loud/deep/vulgar
    var npcSize = (typeof getNPCSize === "function") ? getNPCSize(npc) : "medium";
    var isSmallNpc = npcSize === "tiny" || npcSize === "small";
    var isLargeNpc = npcSize === "large" || npcSize === "huge";
    var shouldFart = isAnalPenetration && isDeepPenetration && lastWasAnal && Math.random() < (isLargeNpc ? 0.30 : isSmallNpc ? 0.15 : 0.20);
    
    // Anal pee - check if pending from executeIntimacyAction
    const hasPendingPee = intimacy && intimacy.pendingEvents && 
        intimacy.pendingEvents.some(e => e.type === "analPee");
    
    // Clean up pending event after checking
    if (hasPendingPee && intimacy.pendingEvents) {
        intimacy.pendingEvents = intimacy.pendingEvents.filter(e => e.type !== "analPee");
    }
    
    // For uncivilized species doing anal - they're confused/surprised but consenting
    // BUT skip for reptilian species (cloaca = same hole, not unusual to them)
    var _anatomyType = (typeof getNPCAnatomyType === "function") ? getNPCAnatomyType(npc) : "humanoid";
    if (isAnalPenetration && isUncivilized && _anatomyType !== "reptilian") {
        var _species = (npc.species || "").toLowerCase();
        var _uncivEnterResponses = [];
        var _uncivContinueResponses = [];

        if (_species === "goblin") {
            _uncivEnterResponses = [
                `twists around, sharp face scrunched up, large ears twitching. <Wrong hole! You... sure?>`,
                `lets out a sharp chitter, squinting at you over their shoulder. <Okay! Okay! Goblin... try.>`
            ];
            _uncivContinueResponses = [
                `shifts side to side, chittering softly, breathing heavily. <Hah... hah... mmm...>`,
                `glances back with a toothy grimace, half doubt, half willingness, letting out a soft "ngh".`
            ];
        } else if (_species === "orc") {
            _uncivEnterResponses = [
                `grunts, looking over their shoulder with a raised brow. <Wrong... hole. You... know that... right?>`,
                `snorts through wide nostrils, tusks catching the light. <Sure... about this? ...Hmph.>`
            ];
            _uncivContinueResponses = [
                `rumbles low in their chest, breathing heavily. <Hah... keep going. Orc... can take it.>`,
            ];
        } else if (_species === "lizardfolk") {
            _uncivEnterResponses = [
                `their head swivels, tongue flicking rapidly, frilled crest twitching. <Wrong... hole. Not... for breeding. ...You... sure?>`,
                `they bare their teeth in confusion, tail thumping once. <Sss... odd. Odd... odd.>`
            ];
            _uncivContinueResponses = [
                `a wet hiss, body coiling slightly, adjusting. <Sss... hah... mmm...>`,
                `their tongue darts out, tasting the air, uncertain but willing, letting out a low "ngh".`
            ];
        } else if (_species === "kobold") {
            _uncivEnterResponses = [
                `spins around, tail puffing up. <What?! That... not breeding hole! That... other hole! ...Okay. Kobold... try.>`,
                `a high-pitched squeak of confusion, ears flattening. <Okay... maybe yes. Kobold... trust you.>`
            ];
            _uncivContinueResponses = [
                `a rapid chitter, tail curling tight, settling into it. <Hah... hah... mmm...>`,
                `yips softly, looking back, uncertain but going along, letting out a soft "eep".`
            ];
        } else if (_species === "skeleton") {
            _uncivEnterResponses = [
                `its jaw clacks, head turning with a dry creak. <...not... where... the... living... go...>`,
                `it pauses, empty sockets staring. <...you... are... sure...?...>`
            ];
            _uncivContinueResponses = [
                `a dry whisper, bones creaking. <...hah... strange...>`,
                `its ribcage rattles softly, patient and unbothered. <...mmm...>`
            ];
        } else {
            // Generic uncivilized fallback
            _uncivEnterResponses = [
                `looks confused. <What are you...? That's... okay. Fine.>`,
                `frowns. <That goes... where? ...I'll try.>`,
                `seems uncertain. <This... isn't normal. But... alright.>`,
                `gives you a puzzled look. <Are you... sure? If you... say so.>`
            ];
            _uncivContinueResponses = [
                `shifts uncomfortably, breathing heavily. <Mmm... keep... going...>`,
                `grunts softly. <Hah... different... but... mmm...>`,
                `lets out a low sound, adjusting. <Nngh... interesting...>`,
                `takes a deep breath. <Ahh... alright... keep...>`
            ];
        }

        if (phase === "continue") {
            return pickRandom(_uncivContinueResponses);
        } else {
            return pickRandom(_uncivEnterResponses);
        }
    }
    
    // Get dialogue from tags (CoT-style) - 50% chance for penetration
    let dialogueLine = null;
    if (Math.random() < 0.50 && dialogueTags && dialogueTags.length > 0) {
        dialogueLine = getDialogueFromTags(dialogueTags, arousalLevel, npc);
    }
    
    // Type-specific penetration templates
    const vaginalTemplates = {
        enter: [
            // Virginity-specific — only fires on first vaginal penetration
            (intimacy && intimacy._wasVirgin) ? `winces as you push your ${tool} into ${possessivePronoun} pussy, the resistance giving way with a sharp sting. You've taken ${possessivePronoun} virginity.` : null,
            (intimacy && intimacy._wasVirgin) ? `gasps and grips you tightly as you push the head of your ${tool} into ${possessivePronoun} vagina, the tight warmth enveloping you for the first time. ${subjectPronoun} is no longer a virgin.` : null,
            // Normal enter templates
            isNearClimax ? `gasps as you enter ${possessivePronoun} vagina, ${subjectPronoun.toLowerCase()} teetering on the edge of climax.` : 
            (shouldSemenDrip ? `gasps as you enter ${possessivePronoun} vagina, your previous load squirting out around your ${tool}.` : 
            `gasps as you fill ${possessivePronoun} vagina.`),
            isNearClimax ? `trembles with impending release as you sink into ${possessivePronoun} warm, wet depths, clenching around your ${tool}.` :
            (shouldSemenDrip ? `${possessivePronoun} warm, wet depths clench around your ${tool} as you enter, your semen dripping out.` : 
            `sighs as you slide into ${possessivePronoun} warmth, ${possessivePronoun} depths clenching around your ${tool}.`),
            isNearClimax ? `moans softly as you sink into ${possessivePronoun} tight heat, ${subjectPronoun.toLowerCase()} is so close to the peak ${subjectPronoun.toLowerCase()} can barely contain it.` : 
            (shouldSemenDrip ? `moans softly as you sink into ${possessivePronoun} tight heat, your earlier release leaking out with each movement.` : 
            `moans softly as you sink into ${possessivePronoun} tight heat.`),
            isNearClimax ? `arches ${possessivePronoun} back, ${possessivePronoun} body enveloping you in liquid warmth, ${subjectPronoun.toLowerCase()} is nearly there.` : 
            `arches ${possessivePronoun} back, ${possessivePronoun} body enveloping you in liquid warmth.`,
            isNearClimax ? `takes you in deeply, ${possessivePronoun} slick folds greedy for more, ${subjectPronoun.toLowerCase()} is right on the brink.` : 
            (shouldSemenDrip ? `takes you in deeply, your semen seeping out as ${possessivePronoun} slick folds greedy for more.` : 
            `takes you in deeply, ${possessivePronoun} slick folds greedy for more.`),
            `gasps as you ${verb} ${objectPronoun}, ${possessivePronoun} hips rising to meet you.`,
            `clutches at you as you enter ${possessivePronoun}, ${possessivePronoun} hot, tight grip around your ${tool}.`,
            // Style notes from published adult-fiction pacing: mechanics first
            // (entrance, stretch, grip, depth), camera shifts between shaft /
            // her body / sounds, breathless broken dialogue in <angle brackets>.
            `presses the head of your ${tool} against ${possessivePronoun} slick entrance, rocking in slow shallow strokes until ${possessivePronoun} folds part around you with a wet sound, then drives you in to the root in one motion.`,
            `aligns your ${tool} at ${possessivePronoun} opening, your tip slick with pre-cum smeared across ${possessivePronoun} slit, and pushes home; ${possessivePronoun} walls clench and ripple around your shaft as ${subjectPronoun.toLowerCase()} takes you all at once.`,
            `grabs ${possessivePronoun} hips and hauls ${objectPronoun} down onto your ${tool}, bottoming out hard - ${possessivePronoun} body goes rigid around you at the stretch, then loosens into a shuddering sigh.`,
            `teases the tip against ${possessivePronoun} dripping entrance until ${subjectPronoun.toLowerCase()} is bucking up on ${possessivePronoun} own, then sinks in deep; ${possessivePronoun} hot walls grip and milk with every inch. <Nngh - there... deeper...>`,
            `fucks ${objectPronoun} shallow at first, letting ${possessivePronoun} adjust to your girth, then ${subjectPronoun.toLowerCase()} wraps ${possessivePronoun} legs around your waist and pulls you fully inside. <ah - fuck - >`,
            // Color & size flavor variants (player profile vs NPC anatomy)
            (_fit === "resistance") ? `stiffens as your ${tool} presses against ${possessivePronoun} slick entrance, the snug heat resisting your girth - only the head pushes past${_skinPhrase ? `, sweat beading on ${possessivePronoun} ${_skinPhrase}` : ""}.` : null,
            (_fit === "stretched") ? `inhales sharply as your ${tool} stretches ${possessivePronoun} open inch by inch${_skinPhrase ? `, ${possessivePronoun} ${_skinPhrase} flushing hot` : ""}.` : null,
            (_fit === "easy") ? `sighs as your ${tool} slides in with ease, ${possessivePronoun} wet warmth taking you without resistance${_skinPhrase ? `, ${possessivePronoun} ${_skinPhrase} warm beneath your hands` : ""}.` : null
        ].filter(Boolean),
        continue: [
            isNearClimax ? `moans with each thrust into ${possessivePronoun}, ${possessivePronoun} vagina gripping you in wet heat, ${subjectPronoun.toLowerCase()} is so close to climax ${subjectPronoun.toLowerCase()} can't last much longer.` : 
            (shouldSemenDrip ? `moans with each thrust into ${possessivePronoun}, ${possessivePronoun} vagina gripping you in wet heat, your semen dripping out with every movement.` : 
            `moans with each thrust into ${possessivePronoun}, ${possessivePronoun} vagina gripping you in wet heat.`),
            isNearClimax ? `matches your rhythm, ${possessivePronoun} slick channel clenching desperately around your ${tool}, ${subjectPronoun.toLowerCase()} is right on the edge.` : 
            (shouldSemenDrip ? `matches your rhythm, ${possessivePronoun} slick channel clenching around your ${tool}, your earlier ejaculation leaking out.` : 
            `matches your rhythm, ${possessivePronoun} slick channel clenching and releasing around your ${tool}.`),
            isNearClimax ? `grinds back against you, ${possessivePronoun} wet warmth taking you deeper, ${subjectPronoun.toLowerCase()} is trembling with the need to climax.` : 
            `grinds back against you, ${possessivePronoun} wet warmth taking you deeper.`,
            isNearClimax ? `whispers encouragement mixed with desperation as you continue, ${subjectPronoun.toLowerCase()} is at the peak of arousal.` : 
            `whispers encouragement as you continue, ${possessivePronoun} desire evident in every movement.`,
            isNearClimax ? `${possessivePronoun} hot, tight sheath clamped around your shaft with each thrust, ${subjectPronoun.toLowerCase()} is so close to release.` : 
            (shouldSemenDrip ? `${possessivePronoun} hot, tight sheath around your shaft with each thrust, squeezing out traces of your semen.` : 
            `${possessivePronoun} hot, tight sheath around your shaft with each thrust.`),
            `raises ${possessivePronoun} hips to meet your thrusts, drawing you in deeper.`,
            (_fit === "resistance") ? `groans as your ${tool} works against the stubborn grip of ${possessivePronoun} body, every inch of progress hard-won${_skinPhrase ? `, ${possessivePronoun} ${_skinPhrase} sheened with sweat` : ""}.` : null,
            (_fit === "easy") ? `moves with you freely, ${possessivePronoun} slick warmth taking your ${tool} to the root with ease.` : null,
            // Rhythm beats: punishing pace, pelvic grind on the clit, wet
            // sounds, matching/bucking hips, voice breaking into pleas.
            `sets a punishing rhythm, hips pistoning against yours, your pelvis grinding into ${possessivePronoun} clit on every bottoming-out thrust while the wet slap of skin fills the room.`,
            `matches your thrusts stroke for stroke, ${possessivePronoun} pussy clenching in ripples around your ${tool}, juices slicking ${possessivePronoun} inner thighs with each pass.`,
            `grinds down hard on your ${tool}, ${possessivePronoun} slick walls milking you as ${subjectPronoun.toLowerCase()} works ${objectPronoun} against you, breath coming in ragged hitches. <harder... fuck...>`,
            `buries you deeper with each thrust until ${possessivePronoun} is trembling all over, ${possessivePronoun} heat clamping around your shaft in waves, ${possessivePronoun} voice breaking into short broken pleas.`
        ]
    };
    
    
    // Random chance for gag reflex in oral
    const hasGagReflex = Math.random() < 0.25;
    
    // Anal penetration templates
    // Anal is NEVER as easy or comfortable as vaginal. Even experienced NPCs
    // feel intensity/discomfort. Difficulty scales with size difference and
    // preparation (lube, dilation, experience).
    var _analSize = (typeof getRelativeSize === "function" && player) ? getRelativeSize(player, npc) : "";
    var _isSmallNpc = (typeof getNPCSize === "function") ? ["tiny", "small"].includes(getNPCSize(npc)) : false;
    var _npcTemperament = String(npc.temperament || "").toLowerCase();
    var _isBold = _npcTemperament === "forward" || _npcTemperament === "bold" || _npcTemperament === "lustful";
    var _anusAnat = (npc.anatomy && npc.anatomy.anus) || {};
    var _isDilated = _anusAnat.size === "loose" || _anusAnat.size === "stretchy" || _anusAnat.size === "gaping";
    var _hasLubeForAnal = intimacy && intimacy.lube && intimacy.lube.anus && intimacy.lube.anus.hasLube;
    var _isExperienced = _isDilated || _hasLubeForAnal;
    var _isLooseOrGaping = _anusAnat.size === "loose" || _anusAnat.size === "gaping";

    // The anal sphincter does not rhythmically "grip and release" during sex.
    // It is either a tight vice (unprepared), slick and easy to move (lubed /
    // dilated, still very hot), or loose/gaping (large / well-used, easy to
    // gape with a puffy sphincter). Pick the descriptor by preparation state.
    var _analAssDesc = _isLooseOrGaping
        ? "loose, well-used ass"
        : (_isExperienced
            ? "slick, dilated ass"
            : "tight, hot ass");
    var _analGripDesc = _isLooseOrGaping
        ? `gapes easy around your ${tool}, the puffy sphincter stretched wide`
        : (_isExperienced
            ? `clings hot and easy around your ${tool}`
            : `grips your ${tool} like a vice`);

    // Build pain/discomfort descriptors based on size and experience.
    // Species adaptation pools (see NPC_ANAL_ADAPTATION_SAMPLES) win over
    // the generic registers below — the size-mismatch branch still
    // overrides them, since a much larger player is a mechanical problem
    // no species voice talks its way around.
    var _speciesAdaptation = getSpeciesAnalAdaptationPool(npc);
    var _painEnter = "";
    var _painContinue = "";
    if (_isSmallNpc || _analSize === "player-larger" || _analSize === "player-much-larger") {
        // Small NPC or player is larger — painful, needs to go slow
        _painEnter = pickRandom([
            `hisses through clenched teeth, a sharp burn crossing ${possessivePronoun} face. <Slow... fuck, go slow.>`,
            `tenses hard, a pained grunt escaping. <Ah—shit. That burns. Give me a second.>`,
            `flinches, fingers gripping whatever's nearby. <Ow. Ow. Okay. Okay. Just... slow.>`,
            `sucks in a sharp breath, body clenching involuntarily. <Fuck, that's tight. You're too big for this. Go slow.>`
        ]);
        _painContinue = pickRandom([
            `lets out a strained hiss with each thrust. <Nnh... still getting used to it. Don't go faster.>`,
            `grunts, face tight with discomfort even as ${subjectPronoun.toLowerCase()} adjusts. <Keep it slow. It's a lot.>`,
            `winces slightly but doesn't pull away. <Okay... okay. It's intense. But keep going, just slow.>`
        ]);
    } else if (_speciesAdaptation) {
        // Species-voiced stretch-then-ease: discomfort shifts into
        // pleasure once the muscles relax (see NPC_ANAL_ADAPTATION_SAMPLES).
        // Shy/reserved NPCs of a species with a `shy` sub-pool sometimes
        // react with surprise and doubt instead — the taboo register,
        // voiced in character rather than hardcoded for everyone.
        var _isShyTemperament = ["shy", "timid", "reserved"].indexOf(_npcTemperament) !== -1;
        var _shyAnalPool = (_isShyTemperament && _speciesAdaptation.shy) ? _speciesAdaptation.shy : null;
        _painEnter = applyNPCPronouns(npc, pickRandom(
            (_shyAnalPool && Math.random() < 0.6) ? _shyAnalPool : _speciesAdaptation.enter
        ));
        _painContinue = applyNPCPronouns(npc, pickRandom(_speciesAdaptation.ease));
    } else if (_isExperienced && _isBold) {
        // Experienced + bold — can handle it, even excited by it
        _painEnter = pickRandom([
            `groans, pushing back with a grunt. <Fuck yes. That's intense. Keep going.>`,
            `lets out a sharp exhale, then a wicked grin. <Mmm. That's the burn I like. Go.>`,
            `rocks back onto you, greedy for more. <Every inch. I can take it.>`
        ]);
        _painContinue = pickRandom([
            `grunts with something between pain and pleasure. <Fuck... that's deep. Don't stop.>`,
            `pants, pressing back into you. <It's intense. It's so fucking intense. Keep going.>`,
            `shivers, the intensity written across ${possessivePronoun} face. <God. That's... that's something. More.>`
        ]);
    } else {
        // Same size, no lube/dilation — uncomfortable burning, needs to warm up
        _painEnter = pickRandom([
            `tenses with a sharp hiss, a burning sensation clearly hitting. <Ah... go slow. That burns.>`,
            `sucks in a breath, body resisting. <Nnh. Give me... give me a second. That's intense.>`,
            `winces, clenching involuntarily. <Ow. Okay. Slow. Just slow.>`,
            `grits ${possessivePronoun} teeth, a strained exhale. <Fuck. That's... a lot. Go slow, yeah?>`
        ]);
        _painContinue = pickRandom([
            `shifts, still adjusting. <It's... getting better. Keep it slow though.>`,
            `exhales shakily with each thrust. <Nnh. It's intense. Not bad, just... intense. Slow.>`,
            `winces occasionally but doesn't stop you. <Okay... it's okay. Just don't go fast.>`,
            `pants, the burning fading slowly. <Getting there. Fuck, that's a stretch. Keep it steady.>`
        ]);
    }

    const analTemplates = {
        enter: [
            // Virginity-specific — only fires on first anal penetration
            (intimacy && intimacy._wasVirgin) ? `breathes shallowly, eyes wide as you push your ${tool} into ${possessivePronoun} ass, the tight ring of muscle yielding for the first time. You've taken ${possessivePronoun} anal virginity.` : null,
            (intimacy && intimacy._wasVirgin) ? `tenses up with a sharp inhale as you push the head of your ${tool} into ${possessivePronoun} anus, then slowly, carefully, you fill ${possessivePronoun} ass. ${subjectPronoun} is no longer an anal virgin.` : null,
            // Size-difficulty — NPC pulls away or struggles when player is large
            (player && (getRelativeSize(player, npc) === "player-larger" || getRelativeSize(player, npc) === "player-much-larger")) ? `flinches and pulls away as you press against ${possessivePronoun} anus, ${posPronoun} small body tensing. "You're too big... go slow."` : null,
            (player && getRelativeSize(player, npc) === "player-much-larger") ? `lets out a pained squeak as the head of your ${tool} stretches ${possessivePronoun} sphincter open, ${posPronoun} face scrunching up. "I don't know if I can..."` : null,
            // Pain/discomfort responses — anal is never as easy as vaginal
            _painEnter,
            // Normal enter templates — simple, direct, CoT-style
            isNearClimax ? `grits ${possessivePronoun} teeth as you push your ${tool} into ${possessivePronoun} ass, ${subjectPronoun.toLowerCase()} trembling on the edge of climax.` : 
            (shouldSemenDrip ? `gasps as you push your ${tool} into ${possessivePronoun} ass, your previous load squelching out around you.` : 
            `gasps as you push your ${tool} into ${possessivePronoun} ass, the tight heat enveloping you.`),
            isNearClimax ? `trembles as you push into ${possessivePronoun} anus, ${subjectPronoun.toLowerCase()} nearly there.` : 
            `tenses around you as you push the head of your ${tool} into ${possessivePronoun} anus, then slowly fill ${possessivePronoun} ass.`,
            `pushes back against you as you enter, ${possessivePronoun} ass gripping your ${tool}.`,
            `lets out a muffled sound as you push the tip of your ${tool} against ${possessivePronoun} anus, then slowly thrust in, filling ${possessivePronoun} ass.`,
            `groans deeply as you push your ${tool} slowly into ${possessivePronoun} ass.`,
            // Color & size flavor variants (player profile vs NPC anatomy)
            (_fit === "resistance") ? `grunts as your ${tool} presses against ${possessivePronoun} wrinkled sphincter, the muscular ring fighting your girth until the head finally lodges past it${_skinPhrase ? `, ${possessivePronoun} ${_skinPhrase} prickling with sweat` : ""}.` : null,
            (_fit === "easy") ? `exhales as your ${tool} sinks into ${possessivePronoun} relaxed hole with ease, the practiced warmth accepting you to the hilt${_skinPhrase ? `, ${possessivePronoun} ${_skinPhrase} loose and unresisting` : ""}.` : null
        ].filter(Boolean),
        continue: [
            // Pain/discomfort continues — even warmed up, anal is intense
            (_isSmallNpc || (_analSize === "player-larger" || _analSize === "player-much-larger")) ? _painContinue : null,
            (_speciesAdaptation && Math.random() < 0.4) ? _painContinue : null,
            (!(_isExperienced && _isBold) && Math.random() < 0.3) ? _painContinue : null,
            isNearClimax ? `clenches desperately, ${subjectPronoun.toLowerCase()} so close to climax ${subjectPronoun.toLowerCase()} can't hold back, ${possessivePronoun} ass gripping your ${tool} tightly.` : 
            (shouldSemenDrip ? `clenches, ${possessivePronoun} cum-filled ass squelching around your ${tool}, your semen bubbling out with each thrust.` : 
            `clenches, ${possessivePronoun} ass gripping your ${tool} tightly.`),
            isNearClimax ? `matches your rhythm, ${possessivePronoun} ${_analAssDesc} clenching around your ${tool}, ${subjectPronoun.toLowerCase()} right on the edge.` :
            (shouldSemenDrip ? `matches your rhythm, your cum frothing inside ${possessivePronoun} ${_analAssDesc} around your ${tool}.` :
            `matches your rhythm, ${possessivePronoun} ${_analAssDesc} ${_analGripDesc}.`),
            isNearClimax ? `grunts with each thrust, ${subjectPronoun.toLowerCase()} so close ${subjectPronoun.toLowerCase()} can't last, your ${tool} buried deep in ${possessivePronoun} ass.` : 
            (shouldSemenDrip ? `grunts with each thrust, your earlier load squelching and dripping from ${possessivePronoun} stretched hole.` :
            `grunts with each thrust, taking you in deep.`),
            isNearClimax ? `pulses around your shaft with each movement, ${subjectPronoun.toLowerCase()} so close to release.` : 
            (shouldSemenDrip ? `pulses around your shaft, cum squeezing out around your ${tool} with each movement.` : 
            `pulses around your shaft with each movement.`),
            shouldSemenDrip ? `takes you in deep, the mess of cum and lube making ${possessivePronoun} ass slick and easy, your shaft sliding through your own load.` :
            `takes you in deep with each thrust, ${possessivePronoun} ass clenching around your ${tool}.`,
            `rocks ${possessivePronoun} hips to meet your rhythm, working ${possessivePronoun} ass on your ${tool}.`,
            (_fit === "resistance") ? `strains as your ${tool} forces its slow way deeper, the stubborn ring of muscle clamping down around your girth${_skinPhrase ? `, ${possessivePronoun} ${_skinPhrase} flushed with effort` : ""}.` : null,
            (_fit === "easy") ? `takes your ${tool} to the root with ease, ${possessivePronoun} practiced hole slick and unresisting around you.` : null
        ].filter(Boolean)
    };
    
    const oralTemplates = {
        enter: [
            // Explicit oral sex descriptions with physical reactions
            isNearClimax ? `parts ${possessivePronoun} lips eagerly, ${subjectPronoun} desperate to please you as ${subjectPronoun} nears bringing you to climax, saliva dripping from ${possessivePronoun} lips.` : 
            (hasGagReflex ? `opens ${possessivePronoun} mouth wide, gagging slightly as you press past ${possessivePronoun} throat, a string of saliva connecting ${possessivePronoun} lips to your shaft.` : 
            `opens ${possessivePronoun} mouth wide to take your cock, ${possessivePronoun} cheeks hollowing in anticipation.`),
            isNearClimax ? `wraps ${possessivePronoun} lips around your ${tool} with eager hunger, ${subjectPronoun} trembling with the effort to bring you to release, ${possessivePronoun} teeth gently brushing your shaft.` : 
            (hasGagReflex ? `tries to take you deep but gags, ${possessivePronoun} eyes watering briefly, drool escaping ${possessivePronoun} lips as ${subjectPronoun} recovers and adjusts.` : 
            `wraps ${possessivePronoun} lips around your ${tool}, ${possessivePronoun} tongue already swirling, saliva glistening at the corners of ${possessivePronoun} mouth.`),
            isNearClimax ? `takes your cock between ${possessivePronoun} lips, ${possessivePronoun} warm mouth working frantically as ${subjectPronoun} works to bring you to the peak, ${possessivePronoun} cheeks flushed with the effort.` : 
            (hasGagReflex ? `chokes as you enter ${possessivePronoun} throat, ${possessivePronoun} reflexes kicking in, ${subjectPronoun} breathing heavily through ${possessivePronoun} nose.` : 
            `takes you between ${possessivePronoun} lips, ${possessivePronoun} warm mouth enveloping your cockhead, saliva beginning to drip.`),
            isNearClimax ? `takes your cock with eager enthusiasm, the vibration of ${possessivePronoun} mumbled sounds adding to the stimulation as ${subjectPronoun.toLowerCase()} is hovering at the peak, barely able to contain ${possessivePronoun} excitement.` : 
            (hasGagReflex ? `gags as you hit the back of ${possessivePronoun} throat, but ${subjectPronoun} quickly adjusts, a thin line of drool escaping and continues taking you in.` : 
            `parts ${possessivePronoun} lips and accepts your cock, ${possessivePronoun} mouth hot and wet around your shaft, saliva already pooling.`),
            isNearClimax ? `takes you in deeply, ${possessivePronoun} tongue pressing urgently against the underside of your cock, ${subjectPronoun.toLowerCase()} is right on the edge, drool dripping down ${possessivePronoun} chin.` : 
            (hasGagReflex ? `struggles briefly with ${possessivePronoun} gag reflex as you enter, then relaxes ${possessivePronoun} throat, ${possessivePronoun} lips stretched taut around your girth.` : 
            `takes you in, ${possessivePronoun} tongue pressing against the underside, saliva beginning to spill.`),
            // Extended multi-beat oral samples (progressive service)
            `starts with a slow lick along the underside of your ${tool}, then breathes warm air across the wet trail before sealing ${possessivePronoun} lips over the head. ${subjectPronoun} bobs shallow at first, then deeper, ${possessivePronoun} cheeks hollowing, one hand braced on your thigh. When ${subjectPronoun} pulls back, a thin string of saliva links ${possessivePronoun} lower lip to your tip before it breaks. ${subjectPronoun} looks up at you, mouth still open. <Say when, and I'll take it all.>`,
            `mouths at the head of your ${tool} in small, greedy kisses, tongue flicking the slit before ${subjectPronoun.toLowerCase()} takes the first few inches properly. ${subjectPronoun} works in slow pulls, each one a little deeper than the last, drool slicking your shaft. ${subjectPronoun} hums around you, low in ${possessivePronoun} throat, cheeks pink. Then ${subjectPronoun} slides off, wipes ${possessivePronoun} chin, and smiles up at you. <Mmm... ready for more?>`,
            // Deep-throat build: swallow inch by inch, throat working, drool strings.
            `takes the head of your ${tool} into ${possessivePronoun} mouth, tongue flat and warm underneath, then swallows inch by inch until ${possessivePronoun} nose brushes your stomach and ${possessivePronoun} throat works around you.`,
            `licks one long stripe from base to tip first, then seals ${possessivePronoun} lips around you and sucks, cheeks hollowing as drool strings from ${possessivePronoun} chin with each deeper pull.`
        ],
        continue: [
            // Continue with oral - show NPC is actively giving oral and aroused by performing
            isNearClimax ? `works you desperately with ${possessivePronoun} mouth, ${subjectPronoun} determined to bring you to climax, ${possessivePronoun} lips gliding frantically along your shaft, drool slick on ${possessivePronoun} chin.` : 
            (hasGagReflex && Math.random() < 0.5 ? `works you with ${possessivePronoun} mouth, ${possessivePronoun} throat twitching as ${subjectPronoun} suppresses another gag, strings of saliva connecting ${possessivePronoun} lips to your cock.` : 
            `works you with ${possessivePronoun} mouth, ${possessivePronoun} lips gliding along your shaft, saliva dripping steadily.`),
            isNearClimax ? `bobs ${possessivePronoun} head urgently, taking you deeper with each frantic pass, ${subjectPronoun} working eagerly to bring you to the peak, ${possessivePronoun} cheeks hollowing with each movement.` : 
            (hasGagReflex && Math.random() < 0.5 ? `bobs ${possessivePronoun} head carefully, fighting back ${possessivePronoun} gag reflex as you go deeper, ${possessivePronoun} eyes watering but ${subjectPronoun} persists.` : 
            `bobs ${possessivePronoun} head, taking you deeper with each pass, ${possessivePronoun} throat working your cock, saliva dripping from ${possessivePronoun} lips.`),
            isNearClimax ? `uses ${possessivePronoun} tongue with desperate skill as ${subjectPronoun} nears bringing you to climax, moving urgently along your ${tool}, ${possessivePronoun} mumbled sounds vibrating against your shaft.` : 
            (hasGagReflex ? `uses ${possessivePronoun} tongue skillfully despite the occasional gag as ${subjectPronoun} moves along your ${tool}, drool glistening on ${possessivePronoun} chin.` : 
            `uses ${possessivePronoun} tongue skillfully as ${subjectPronoun} moves along your ${tool}, saliva pooling in ${possessivePronoun} mouth.`),
            isNearClimax ? `maintains a frantic rhythm, ${subjectPronoun} eager to bring you to release, ${possessivePronoun} lips tight around your shaft as ${subjectPronoun} works toward your climax, ${possessivePronoun} cheeks flushed with arousal from the act.` : 
            (hasGagReflex && Math.random() < 0.5 ? `maintains a steady rhythm despite ${possessivePronoun} gagging, ${possessivePronoun} lips tight around your shaft, drool dripping freely.` : 
            `maintains a steady rhythm, ${possessivePronoun} mouth warm and tight around your shaft, saliva beginning to drip down ${possessivePronoun} chin.`),
            isNearClimax ? `hollows ${possessivePronoun} cheeks urgently, creating intense suction as ${subjectPronoun} continues working you toward climax, ${possessivePronoun} mumbled sounds encouraging you on.` : 
            `hollows ${possessivePronoun} cheeks, creating delicious suction as ${subjectPronoun} continues, saliva dripping from the corners of ${possessivePronoun} mouth.`,
            // Extended multi-beat oral samples (progressive service)
            `keeps a steady rhythm, ${possessivePronoun} lips gliding down your ${tool} and back up with practiced ease, tongue cradling the underside on every pass. ${subjectPronoun} pauses at the top to swirl around the head, then sinks down until ${possessivePronoun} nose brushes your body. ${possessivePronoun} eyes water but ${subjectPronoun} doesn't pull away, throat fluttering around you once, twice. ${subjectPronoun} comes up for air with a gasp, strings of saliva clinging. <Don't stop me... I want to hear you.>`,
            `alternates deep and shallow, taking you to the root until ${possessivePronoun} throat squeezes the head, then retreating to nurse gently at the tip. ${possessivePronoun} hand works what ${possessivePronoun} mouth doesn't, wet and warm in tandem. ${subjectPronoun} moans around your ${tool}, the vibration buzzing up your spine, ${possessivePronoun} free hand rolling your balls with a careful touch. When ${subjectPronoun} glances up, ${possessivePronoun} eyes are heavy-lidded. <Am I doing well? Tell me I'm doing well.>`,
            // Steady wet rhythm, humming vibration, alternating deep/shallow with a hand in tandem.
            `works your ${tool} with steady wet pulls, tongue swirling the underside on every pass, humming low so the vibration runs up your spine; ${subjectPronoun} only pauses to gasp, saliva clinging to ${possessivePronoun} lips.`,
            `alternates deep sucks with shallow teases at the tip, ${possessivePronoun} hand wrapped around your base working in tandem, eyes locked on yours the whole time. <tell me when...>`
        ]
    };
    
    // Deepthroat template sets - one per mode, size-scaled: a large cock
    // chokes and streaks tears; a medium one gags and waters the eyes; a
    // small one goes down smooth. Bottom-led is the NPC's own rhythm.
    var deepthroatTemplates = null;
    if (_dtMode) {
        if (_dtMode === "top") {
            deepthroatTemplates = _dtCockSize === "large" ? {
                enter: [
                    `gags hard the moment your ${tool} pushes past ${possessivePronoun} soft palate — a wet, convulsive retch that clamps ${possessivePronoun} throat around your crown. ${possessivePronoun} eyes flood, tears spilling down ${possessivePronoun} cheeks, and ropes of slobber instantly string from ${possessivePronoun} stretched lips.`,
                    `chokes as you feed your ${tool} into ${possessivePronoun} throat, ${possessivePronoun} neck bulging faintly around your girth. ${subjectPronoun} slaps ${possessivePronoun} palm against your thigh — not quite pushing you off — while spit froths out around your shaft.`,
                    `shudders, throat spasming in retch after retch as your ${tool} stretches ${possessivePronoun} open. Drool runs down ${possessivePronoun} chin and ${possessivePronoun} watering eyes have ruined whatever composure ${subjectPronoun.toLowerCase()} had left.`
                ],
                continue: [
                    `gurgles around your ${tool} with every drive into ${possessivePronoun} throat, tears streaming properly now, ${possessivePronoun} chin and chest slicked with slobber. The only sounds left are retches, glugs, and your hips meeting ${possessivePronoun} face.`,
                    `coughs violently when you pull back to let ${objectPronoun} breathe — a raw, throaty sound — but before ${subjectPronoun.toLowerCase()} catches a full breath you push home again, and ${possessivePronoun} eyes roll as ${possessivePronoun} throat milks you on reflex.`,
                    `gags and sputters, hands fisted in whatever ${subjectPronoun.toLowerCase()} can grab, throat convulsing around your ${tool} each time you bottom out in it. Slobber froths from the corners of ${possessivePronoun} mouth.`
                ]
            } : _dtCockSize === "small" ? {
                enter: [
                    `takes your ${tool} past ${possessivePronoun} tongue and into ${possessivePronoun} throat without a single gag — the whole length slides home with ease. ${subjectPronoun} looks up at you from around your base, almost smug about it.`,
                    `hums around your ${tool} as you settle fully into ${possessivePronoun} throat, barely a flutter. ${possessivePronoun} lips rest flush against you, unhurried and untroubled.`
                ],
                continue: [
                    `rides your strokes smoothly, lips gliding to your base and back, throat quiet around your ${tool}. ${subjectPronoun} hums contentedly with every push.`,
                    `keeps ${possessivePronoun} rhythm unhurried, swallowing around the head of your ${tool} each time you press deep. No gag, no fuss — just warm, practiced depth.`
                ]
            } : {
                enter: [
                    `gags softly as your ${tool} nudges into ${possessivePronoun} throat, ${possessivePronoun} eyes watering at the intrusion. ${subjectPronoun} breathes hard through ${possessivePronoun} nose and holds still, throat fluttering around you.`,
                    `glugs wetly as you sink deeper, a muffled sound humming around your ${tool}. A thick line of drool escapes the corner of ${possessivePronoun} stretched mouth and swings.`
                ],
                continue: [
                    `takes your rhythm with muffled glugs, ${possessivePronoun} throat fluttering around the head of your ${tool} at the top of each stroke. ${possessivePronoun} watering eyes leave shiny streaks down ${possessivePronoun} cheeks.`,
                    `works ${possessivePronoun} throat around you as you fuck it, swallowing on instinct each time you push deep, drool running freely down ${possessivePronoun} chin.`
                ]
            };
        } else if (_dtMode === "bottom") {
            // Bottom-led: the NPC swallows the player down on their own —
            // self-gagging, messy, teary, and proud of it.
            deepthroatTemplates = {
                enter: [
                    `swallows you down to the root in one long, determined push, gagging hard when your ${tool} fills ${possessivePronoun} throat. ${subjectPronoun} holds there, eyes streaming — then pulls off with a loud, wet cough and strings of spit, and immediately dives back down.`,
                    `takes you deep on ${possessivePronoun} own, throat working in slow, deliberate swallows. Every few strokes ${subjectPronoun.toLowerCase()} comes up coughing, chin dripping, eyes wet — grins at you through the tears — and does it again.`,
                    `sets ${possessivePronoun} own pace: deep, messy, shameless. ${subjectPronoun} gags herself on your ${tool} again and again, slobber running down ${possessivePronoun} knuckles, tears cutting lines down ${possessivePronoun} cheeks — and never once stops moving.`
                ],
                continue: [
                    `picks up ${possessivePronoun} own pace, driving ${possessivePronoun} nose into you with each swallow. ${subjectPronoun} gags, coughs once mid-stroke, and keeps going anyway, wet sounds spilling out of ${possessivePronoun} along with the drool.`,
                    `comes off your ${tool} with a ragged cough, tears and spit hanging off ${possessivePronoun} chin — then swallows you straight back down to the root without being asked. ${possessivePronoun} throat flutters through the retch and stays put.`,
                    `fucks ${possessivePronoun} own throat on you, cheeks hollow, eyes streaming, humming through the gags like they are nothing.`
                ]
            };
        } else {
            // Player-gives: the NPC's reaction to being deepthroated.
            deepthroatTemplates = _dtCockSize === "large" ? {
                enter: [
                    `moans as you fight ${possessivePronoun} girth down, ${possessivePronoun} hand firm in your hair. <Fuck — you're really taking it all. Good.> ${possessivePronoun} hips twitch, feeding you another inch.`,
                    `watches ${possessivePronoun} own cock vanish down your throat with a strangled groan, thighs shaking. <Gods, your throat — don't stop.>`
                ],
                continue: [
                    `rocks up into your throat in small, helpless pushes, swearing under ${possessivePronoun} breath each time you swallow around the crown.`,
                    `holds your head steady and shivers, ${possessivePronoun} girth throbbing deep in your throat. <Just like that — take all of it.>`
                ]
            } : _dtCockSize === "small" ? {
                enter: [
                    `shivers as you swallow ${possessivePronoun} whole with ease, watching you with wide, hungry eyes. <You make that look so easy.>`,
                    `lets out a shaky sigh as your nose presses to ${possessivePronoun} base, ${possessivePronoun} whole body going soft.`
                ],
                continue: [
                    `pets your hair as you work, murmuring praise between breaths. <Good — so good — just like that.>`,
                    `twitches with every deep pull of your throat, ${possessivePronoun} voice fraying at the edges.`
                ]
            } : {
                enter: [
                    `gasps as your nose presses to ${possessivePronoun} base, ${possessivePronoun} whole body going rigid. <Gods — your throat—> ${possessivePronoun} voice breaks off in a groan.`,
                    `moans low as you take ${objectPronoun} to the root, hips jerking once before ${subjectPronoun.toLowerCase()} steadies them.`
                ],
                continue: [
                    `pants above you, hips rocking in small pushes, throbbing deep in your throat. <Just like that — don't stop.>`,
                    `tangles ${possessivePronoun} fingers in your hair and groans with every swallow, ${possessivePronoun} composure slipping.`
                ]
            };
        }
    }

    // External climax (ejaculate_on_*): a release beat on the body, not
    // a penetration thrust — its own reaction set, never the hole templates.
    const isExternalClimax = act.triggersClimax === true && String(act.consequence || "") === "external_semen";
    // Select templates based on penetration type
    let templates;
    if (_dtMode) {
        templates = deepthroatTemplates;
    } else if (isExternalClimax) {
        templates = {
            enter: [
                `gasps as your ${tool} twitches, hot spurts landing on ${possessivePronoun} ${bodyPartDesc}.`,
                `shivers as your release splashes across ${possessivePronoun} ${bodyPartDesc}.`,
                `watches you with wide eyes as you spend yourself on ${possessivePronoun} ${bodyPartDesc}.`
            ],
            continue: [
                `lies still as your seed drips down ${possessivePronoun} ${bodyPartDesc}, breath slowing.`,
                `smirks up at you, ${possessivePronoun} ${bodyPartDesc} glistening with your spend.`,
                `runs a finger through the warmth on ${possessivePronoun} ${bodyPartDesc}, cheeks flushed.`
            ]
        };
    } else if (isVaginalPenetration) {
        templates = vaginalTemplates;
    } else if (isAnalPenetration) {
        templates = analTemplates;
    } else if (isOralPenetration) {
        templates = oralTemplates;
    } else {
        // Fallback to generic templates
        templates = {
            enter: [
                `gasps as ${possessivePronoun} ${bodyPartDesc} accepts you.`,
                `gasps as you enter ${possessivePronoun} ${bodyPartDesc}, ${possessivePronoun} depths clenching around your ${tool}.`,
                `moans softly as you fill ${possessivePronoun} ${bodyPartDesc}.`
            ],
            continue: [
                `moans with each thrust, ${possessivePronoun} ${bodyPartDesc} gripping you tightly.`,
                `matches your rhythm, ${possessivePronoun} ${bodyPartDesc} clenching around your ${tool}.`,
                `grinds back against you, taking you deeper.`
            ]
        };
    }
    
    let response = pickUnique(templates[phase] || templates.enter, intimacy, "pen-" + String(act.id || "x") + "-" + phase);

    // ── SIZE-AWARE AUDIO CUES ────────────────────────────────────
    // Non-bold/forward NPCs produce involuntary sounds during penetration.
    // Tight/small anatomy → more sounds (squeals, winces, sharp inhales).
    // Loose/experienced → fewer sounds, more grunts and heavy breathing.
    // Bold/forward/dominant NPCs are excluded — they're composed.
    var npcTemperament = String(npc.temperament || "").toLowerCase();
    var isBoldNpc = npcTemperament === "forward" || npcTemperament === "bold" || npcTemperament === "lustful" || npcTemperament === "dominant";
    var isShy = npcTemperament === "shy" || npcTemperament === "submissive" || npcTemperament === "nervous";

    // Determine size category for the penetrated body part
    var partSize = "medium";
    if (isAnalPenetration) {
        partSize = ["tight", "snug"].includes(anusSize) ? "small" :
                   ["supple", "stretchy"].includes(anusSize) ? "medium" :
                   ["loose", "gaping"].includes(anusSize) ? "large" : "medium";
    } else if (isVaginalPenetration) {
        var vagAnat = anatomy.vagina || anatomy.genitals || {};
        var vagSize = vagAnat.size || vagAnat.sizeCategory || "medium";
        partSize = ["tight", "snug", "small"].includes(vagSize) ? "small" :
                   ["loose", "gaping", "large", "stretched"].includes(vagSize) ? "large" : "medium";
    }

    if (!isBoldNpc) {
        // Base chance depends on phase and size
        var audioChance;
        if (phase === "enter") {
            audioChance = partSize === "small" ? 0.85 : partSize === "large" ? 0.30 : 0.60;
            if (isAnalPenetration) audioChance += 0.15; // anal always more likely
        } else {
            audioChance = partSize === "small" ? 0.35 : partSize === "large" ? 0.10 : 0.20;
            // Hard acts (fuck/pound) produce more sounds during continue
            if (act.intensity === "hard" && isAnalPenetration) {
                audioChance += partSize === "small" ? 0.30 : 0.15;
            }
        }
        audioChance = Math.min(audioChance, 0.95);

        if (Math.random() < audioChance) {
            var audioCues;
            if (isAnalPenetration && phase === "enter") {
                if (partSize === "small") {
                    // Tight anal entry: pain/surprise sounds
                    audioCues = isShy ? [
                        "lets out a small squeal, ", "winces with a stifled cry, ",
                        "gives a sharp gasp, ", "whimpers sharply, "
                    ] : [
                        "grunts loudly at the intrusion, ", "hisses through clenched teeth, ",
                        "lets out a pained yelp, ", "exhales with a sharp grunt, "
                    ];
                } else {
                    // Looser anal: grunts, heavy breathing
                    audioCues = [
                        "grunts as you push in, ", "exhales heavily, ",
                        "lets out a low grunt, ", "breathes out in a huff, "
                    ];
                }
            } else if (phase === "enter") {
                if (partSize === "small") {
                    audioCues = isShy ? [
                        "gives a tiny squeak, ", "lets out a shaky breath, ",
                        "inhales sharply, ", "gives a small whimper, "
                    ] : [
                        "grunts as you push in, ", "exhales sharply, ",
                        "lets out a quick gasp, ", "hisses softly, "
                    ];
                } else {
                    audioCues = [
                        "exhales deeply, ", "lets out a soft sigh, ",
                        "breathes out slowly, ", "gives a low grunt, "
                    ];
                }
            } else {
                // Continue phase — differentiate by act intensity and anal experience
                var actIntensity = act.intensity || "medium";
                var isHardAct = actIntensity === "hard";
                if (isAnalPenetration) {
                    if (isHardAct) {
                        // Hard anal (fuck/pound): grunts, sharp exhales, pained sounds
                        audioCues = partSize === "small" ? [
                            isShy ? "squeaks with each hard thrust, " : "grunts sharply with each thrust, ",
                            "lets out a pained huff, ",
                            "exhales in sharp bursts, ",
                            "winces and grunts, ",
                            "lets out a strangled sound with each pounding, "
                        ] : [
                            "grunts loudly with each thrust, ",
                            "exhales hard, ",
                            "lets out a rough grunt, ",
                            "breathes in sharp bursts, ",
                            "hisses through gritted teeth, "
                        ];
                    } else {
                        // Steady anal (thrust/pump): grunts, heavy breathing
                        audioCues = partSize === "small" ? [
                            "lets out small grunts, ",
                            "breathes heavily, ",
                            "gives a quiet huff with each thrust, ",
                            "exhales slowly, "
                        ] : [
                            "exhales steadily, ",
                            "breathes evenly, ",
                            "lets out a low grunt, ",
                            "sighs heavily, "
                        ];
                    }
                } else {
                    // Non-anal continue
                    audioCues = partSize === "small" ? [
                        "lets out a small huff, ", "grunts with each thrust, ",
                        "breathes heavily, ", "gives a quiet squeak, "
                    ] : [
                        "exhales slowly, ", "breathes steadily, ",
                        "lets out a low grunt, ", "sighs heavily, "
                    ];
                }
            }
            response = pickRandom(audioCues) + response;
        }
    }

    // ── DEPTH-BASED EFFECTS (continue phase) ─────────────────────
    // As penetration depth increases, add physical effects:
    // - Depth 3-4: slapping/clapping sounds from thighs/bodies
    // - Depth 5 (bottomed out): exclamation from NPC
    if (phase === "continue" && penetrationDepth >= 3) {
        var depthSuffix = "";

        // Slapping/clapping sounds at depth 3+
        if (Math.random() < 0.40) {
            var slappingSounds = [
                ", the sound of skin meeting skin filling the air",
                ", your hips slapping against " + posPronoun + " body with each thrust",
                ", the rhythmic slap of flesh against flesh echoing between you"
            ];
            if (isAnalPenetration) {
                slappingSounds.push(
                    ", your thighs clapping against " + posPronoun + " backside with each thrust",
                    ", the sound of your hips striking " + posPronoun + " cheeks echoing loudly"
                );
            }
            depthSuffix += pickRandom(slappingSounds);
        }

        // Bottoming out at depth 5: NPC exclamation
        if (penetrationDepth >= 5 && Math.random() < 0.50) {
            var bottomOutCues;
            if (isAnalPenetration) {
                bottomOutCues = [
                    ` ${subjectPronoun} lets out a sharp gasp as you bottom out inside ${objectPronoun},`,
                    ` ${subjectPronoun} grunts loudly as you reach full depth,`,
                    ` ${subjectPronoun} winces as you bury yourself to the hilt,`
                ];
            } else if (isVaginalPenetration) {
                bottomOutCues = [
                    ` ${subjectPronoun} cries out as you press against ${possessivePronoun} cervix, the deep pressure sending a jolt through ${objectPronoun},`,
                    ` ${subjectPronoun} yelps sharply as you hit the back of ${possessivePronoun} passage, grinding against ${possessivePronoun} cervix,`,
                    ` ${subjectPronoun} gasps loudly as your tip butts against ${possessivePronoun} deepest point, the pressure intense,`,
                    ` ${subjectPronoun} lets out a pained moan as you bottom out against ${possessivePronoun} cervix, ${possessivePronoun} body tensing,`
                ];
            } else if (isOralPenetration) {
                bottomOutCues = [
                    ` ${subjectPronoun} gags hard as you push in to the hilt, ${possessivePronoun} throat spasming around you,`,
                    ` ${subjectPronoun} chokes and coughs as you bury yourself fully in ${possessivePronoun} mouth,`,
                    ` ${subjectPronoun} gags, eyes watering as you hit the back of ${possessivePronoun} throat,`
                ];
            } else {
                bottomOutCues = [
                    " She gags as you push in to the hilt,",
                    " She lets out a muffled sound as you reach full depth,"
                ];
            }
            // Use possessive pronoun for the NPC gender
            var pronoun = posPronoun;
            bottomOutCues = bottomOutCues.map(function(s) {
                return s.replace(/\bher\b/g, pronoun).replace(/\bShe\b/g, subjectPronoun);
            });
            // Replace the trailing comma with a period — the suffix should be
            // a separate sentence after the main response.
            var _bottomOut = pickRandom(bottomOutCues).replace(/,$/, ".");
            // bottomOutCues are separate sentences (" She..."); close any open
            // slapping clause before starting the new sentence.
            if (depthSuffix && !/[.!?]$/.test(depthSuffix)) depthSuffix += ".";
            depthSuffix += _bottomOut;
        }

        // Oral coughing at depth 3+ (25% chance): throat irritation from deep thrusts
        if (isOralPenetration && penetrationDepth >= 3 && !isAtClimaxThreshold && Math.random() < 0.25) {
            if (depthSuffix && !/[.!?]$/.test(depthSuffix)) depthSuffix += ".";
            depthSuffix += " " + subjectPronoun + " coughs, spittle flying from " + posPronoun + " lips.";
        }

        if (depthSuffix) {
            // Slapping-sound clauses (", ...") continue the base sentence, so
            // drop the trailing period; new-sentence suffixes (" She...") keep
            // it as the sentence break.
            if (depthSuffix.charAt(0) === ",") {
                response = response.replace(/\.$/, "") + depthSuffix;
            } else {
                response = response + depthSuffix;
            }
            if (!/[.!?]$/.test(response)) response += ".";
        }
    }

    // Scent descriptors are now added in the player narrative builder functions
    // to avoid double insertion, so we skip adding them here

    // ── FULL BOWELS / DISTENDED STOMACH (anal, continue phase) ────
    // When cummed into 5+ times, describe fullness. At 10+, describe visible
    // stomach distension. These append to the existing response.
    if (isBowelsStuffed && phase === "continue" && Math.random() < 0.50) {
        if (!/[.!?]$/.test(response)) response += ".";
        response = response + pickRandom([
            ` ${posPronoun} stomach bulges visibly, round and distended from the sheer amount of cum packed into ${posPronoun} bowels.`,
            ` You can see ${posPronoun} belly swelling, the skin taut and rounded — stuffed full of your loads.`,
            ` ${posPronoun} distended gut presses against the surface beneath ${posPronoun}, heavy and full with all the cum you've pumped inside.`
        ]);
    } else if (isBowelsFull && phase === "continue" && Math.random() < 0.40) {
        if (!/[.!?]$/.test(response)) response += ".";
        response = response + pickRandom([
            ` ${posPronoun} bowels feel heavy and full, packed with ${analCumCount} loads of your cum.`,
            ` "So full," ${subjectPronoun.toLowerCase()} murmurs, ${posPronoun} stomach heavy with the cum you've left inside.`,
            ` You can feel the slick mess of ${analCumCount} loads squelching inside ${posPronoun} with each thrust.`
        ]);
    }

    // ── TRAPPED AIR / FART EFFECTS (anal, continue phase) ─────────
    // Trapped air from deep anal penetration escapes, producing sounds
    // that vary by NPC size: small = squeaky, medium = normal, large = loud/deep
    if (shouldFart && phase === "continue") {
        var airLine;
        var _fartSound1 = pickRandom(["fart", "burst of air"]);
        var _fartSound2 = pickRandom(["whistle", "squeak"]);
        var _fartSound3 = pickRandom(["pfffft", "squeak"]);
        var _fartSound4 = pickRandom(["fart", "burst of trapped air"]);
        var _fartSound5 = pickRandom(["brap", "blorp", "rrrt"]);
        var _fartSound6 = pickRandom(["fart", "blast of air"]);
        var _fartSound7 = pickRandom(["pfffft", "squelch", "fart"]);
        var _fartSound8 = pickRandom(["brap", "pft"]);
        if (isSmallNpc) {
            airLine = pickRandom([
                " A small, squeaky " + _fartSound1 + " escapes from " + posPronoun + " ass as you thrust in, and " + posPronoun + " face goes red with embarrassment.",
                " Trapped air squeaks out of " + posPronoun + " stretched hole with a high-pitched " + _fartSound2 + ", and " + posPronoun + " burys " + posPronoun + " face in shame.",
                " A tiny, embarrassing " + _fartSound3 + " escapes from between " + posPronoun + " cheeks, the sound impossibly small and lewd."
            ]);
        } else if (isLargeNpc) {
            airLine = pickRandom([
                " A loud, deep " + _fartSound4 + " erupts from " + posPronoun + " ass as you pound in, the sound echoing obscenely off the walls.",
                " Trapped air escapes with a vulgar, rumbling " + _fartSound5 + " that reverberates through " + posPronoun + " large frame.",
                " A deep, guttural " + _fartSound6 + " thunders out of " + posPronoun + " well-fucked hole, loud and unladylike. " + subjectPronoun + " doesn't seem to notice."
            ]);
        } else {
            airLine = pickRandom([
                " Trapped air escapes from " + posPronoun + " ass with a lewd " + _fartSound7 + ", the sound punctuating the rhythm of your thrusts.",
                " A wet " + _fartSound1 + " slips out of " + posPronoun + " stretched hole, and " + posPronoun + " cheeks flush with embarrassment.",
                " Air trapped inside escapes with a sharp " + _fartSound8 + " as you pull back, the sound filling the silence between thrusts."
            ]);
        }
        if (!/[.!?]$/.test(response)) response += ".";
        response = response + airLine;
    }

    // ── PULL AWAY (tight anal, continue phase) ────────────────────
    // NPC occasionally pulls away from tight anal, especially small NPCs
    if (shouldPullAway && phase === "continue") {
        var pullAwayLine = pickRandom([
            ` ${subjectPronoun} pulls forward, wincing as you slip partway out. "Slow down... it's too much."`,
            ` ${subjectPronoun} tenses and shifts away from you, gasping. "Give me a second."`,
            ` ${subjectPronoun} clenches tight and pulls forward, forcing you out with a pained grunt.`
        ]);
        if (!/[.!?]$/.test(response)) response += ".";
        response = response + pullAwayLine;
    }

    // Add verbal dialog from tags (CoT-style)
    if (dialogueLine) {
        // Only add if not already a verbal response
        if (!response.includes('"')) {
            if (dialogueLine.isNonVerbal) {
                // For non-verbal NPCs, add the sound without quotes
                if (Math.random() < 0.5) {
                    response = `${response} ${dialogueLine.text}`;
                }
            } else if (dialogueLine.isVerbal) {
                // For verbal NPCs, add quoted speech
                if (Math.random() < 0.5) {
                    response = `${response} "${dialogueLine.text}"`;
                }
            }
        }
    }
    
    return response;
}

/**
 * Generate NPC climax reaction
 * Creates appropriate response based on NPC gender and personality
 */
function generateNPCClimaxReaction(npc, npcGender, intimacy) {
    if (!npc) return null;

    // Unconscious/sleeping NPCs climax without any conscious vocalization —
    // only involuntary physical reflexes, never cries, words, or pleading.
    if (npcCannotSpeak(npc)) {
        const subj = getSubjectPronoun(npc) || "She";
        const poss = getPossessivePronoun(npc) || "her";
        return pickRandom([
            `${subj} shudders through ${poss} limp body, muscles locking and releasing in involuntary spasms.`,
            `${poss} breath hitches and ${subj.toLowerCase()} goes rigid, the climax passing through ${poss} unconscious frame as pure reflex.`,
            `${subj} twitches and trembles, ${poss} body convulsing without a sound.`,
            `${poss} limbs jerk once, twice, then fall still again, breathing slow and shallow.`
        ]);
    }

    const subjectPronoun = getSubjectPronoun(npc) || "She";
    const possessivePronoun = getPossessivePronoun(npc) || "her";
    const objectPronoun = getObjectPronoun(npc) || "them";
    const vocalization = getVocalization(100); // Max arousal vocalization
    
    // Get personality-based intensity
    const personality = npc.temperament || npc.personality || "neutral";
    const isShy = personality.includes("shy");
    const isBold = personality.includes("bold");
    const isSubmissive = personality.includes("submissive");
    const isDominant = personality.includes("dominant");
    
    // Gender-specific climax reactions
    // Use anatomy-aware descriptions based on what the NPC actually has
    const anatomy = (npc.anatomy || {});
    const nsfwAnatomy = (npc.nsfwTraits && npc.nsfwTraits.anatomy) || {};
    const mergedAnatomy = { ...anatomy, ...nsfwAnatomy };
    const hasPenis = mergedAnatomy.penis || mergedAnatomy.cock || mergedAnatomy.dick;
    const hasVagina = mergedAnatomy.vagina || mergedAnatomy.pussy;
    
    const maleClimaxTemplates = [
        `groans deeply, ${possessivePronoun} body tensing as ${subjectPronoun.toLowerCase()} reaches ${possessivePronoun} peak.`,
        `lets out a guttural cry, ${possessivePronoun} hips bucking involuntarily with release.`,
        hasPenis ? `shudders violently, ${possessivePronoun} ${hasPenis.description || 'cock'} pulsing as ${subjectPronoun.toLowerCase()} climaxes.` :
                   `shudders violently, ${possessivePronoun} body convulsing as ${subjectPronoun.toLowerCase()} climaxes.`,
        `throws ${possessivePronoun} head back with a groan, ${possessivePronoun} orgasm crashing over ${objectPronoun}.`,
        `grunts rhythmically, ${possessivePronoun} body rigid with the intensity of ${possessivePronoun} release.`
    ];

    const femaleClimaxTemplates = [
        `cries out, ${possessivePronoun} body arching as waves of pleasure crash over ${objectPronoun}.`,
        hasVagina ? `whimpers and trembles through ${possessivePronoun} orgasm.` :
                   `whimpers and trembles, ${possessivePronoun} body shaking with ${possessivePronoun} orgasm.`,
        `gasps and clutches at you, ${possessivePronoun} climax overwhelming ${objectPronoun}.`,
        `moans loudly, ${possessivePronoun} hips gyrating uncontrollably as ${subjectPronoun.toLowerCase()} comes.`,
        `bites ${possessivePronoun} lip and shudders, ${possessivePronoun} body consumed by pleasure.`
    ];

    // Gender-neutral/climax templates (for non-binary, androgynous, etc.)
    const neutralClimaxTemplates = [
        `cries out, ${possessivePronoun} body trembling with the force of ${possessivePronoun} climax.`,
        `shudders violently, overwhelmed by waves of pleasure.`,
        `lets out a loud ${vocalization}, ${possessivePronoun} entire body tensing with release.`,
        `clings to you desperately, ${possessivePronoun} climax crashing over ${objectPronoun}.`
    ];
    
    // Select templates based on gender and anatomy
    let templates;
    if ((npcGender === "male" || npcGender.includes("male")) && hasPenis) {
        templates = maleClimaxTemplates;
    } else if ((npcGender === "female" || npcGender.includes("female")) && hasVagina) {
        templates = femaleClimaxTemplates;
    } else {
        // Fallback to neutral or based on anatomy
        if (hasPenis) {
            templates = maleClimaxTemplates;
        } else if (hasVagina) {
            templates = femaleClimaxTemplates;
        } else {
            templates = neutralClimaxTemplates;
        }
    }
    
    // Repeat climaxes read differently: her body is more sensitive and
    // each further orgasm hits harder (SotB-style "coming again" beats).
    var _orgasmCount = (intimacy && intimacy.climax && typeof intimacy.climax.npcOrgasms === "number")
        ? intimacy.climax.npcOrgasms : 1;
    if (_orgasmCount > 1) {
        var repeatClimaxTemplates = [
            `comes again, ${possessivePronoun} oversensitive body seizing harder than before as another climax tears through ${objectPronoun}.`,
            `shakes through yet another orgasm, ${possessivePronoun} spent body trembling harder with every wave.`,
            `cries out once more, the repeat release ripping through ${objectPronoun} with doubled force.`
        ];
        return pickRandom(repeatClimaxTemplates);
    }
    return pickRandom(templates);
}

/**
 * Build response for impact actions
 * Now uses CoT-style dialogue tags for verbal responses
 */
function buildImpactResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc, reaction, dialogueTags = []) {
    const verb = act.verb || "slap";
    const vocalization = getVocalization(arousalLevel);
    var target = act.target || "buttocks";

    // Track impact count on encounter flags
    if (!intimacy) intimacy = {};
    if (!intimacy.encounterFlags) intimacy.encounterFlags = {};
    intimacy.encounterFlags.impactCount = (intimacy.encounterFlags.impactCount || 0) + 1;
    var impactCount = intimacy.encounterFlags.impactCount;

    // Determine tolerance based on NPC size
    var npcSize = getNPCSize(npc);
    var tolerance = npcSize === "small" || npcSize === "tiny" ? 3 :
                   npcSize === "large" || npcSize === "huge" ? 8 : 5;

    // Bold/forward NPCs tolerate more
    var temperament = String(npc.temperament || "").toLowerCase();
    if (temperament === "bold" || temperament === "forward" || temperament === "dominant") {
        tolerance += 2;
    }
    // Shy/submissive NPCs tolerate less
    if (temperament === "shy" || temperament === "submissive" || temperament === "nervous") {
        tolerance = Math.max(2, tolerance - 1);
    }

    // Check if tolerance is reached
    var overTolerance = impactCount > tolerance;
    if (overTolerance) {
        intimacy.encounterFlags.impactToleranceReached = true;
    }

    // Build skin color progression: pink → red → welted
    var skinState = "pink";
    if (impactCount >= 5) skinState = "red";
    if (impactCount >= 8) skinState = "welted";
    if (impactCount >= 3) skinState = "rosy";

    var skinDesc = "";
    if (skinState === "rosy") skinDesc = ", the skin flushing pink where you struck";
    else if (skinState === "red") skinDesc = ", the skin reddening under the repeated slaps";
    else if (skinState === "welted") skinDesc = ", the skin welted and tender from the repeated strikes";

    // Get dialogue from tags
    let dialogueLine = null;
    if (Math.random() < 0.20 && dialogueTags && dialogueTags.length > 0) {
        dialogueLine = getDialogueFromTags(dialogueTags, arousalLevel, npc);
    }

    var templates;

    if (overTolerance) {
        // Past tolerance — pain, not excitement. NPC protests or pulls away.
        templates = [
            `cries out, pulling away from your hand. <Stop, that hurts!>`,
            `flinches hard, ${possessivePronoun} body tensing. <Enough, it stings!>`,
            `twists away, ${possessivePronoun} voice sharp. <I said that's enough!>`,
            `shoves your hand away, ${possessivePronoun} eyes flashing. <I'm not enjoying that anymore.>`,
            `pulls back, rubbing ${possessivePronoun} ${target}. <That's too much. Stop.>`
        ];
        // 30% chance the NPC slaps back
        if (Math.random() < 0.30) {
            return pickRandom(templates) + ` She slaps you across the face.`;
        }
        return pickRandom(templates);
    }

    if (impactCount >= tolerance - 1) {
        // Approaching tolerance — the sting is becoming uncomfortable
        templates = [
            `winces, the ${skinState === "welted" ? "welted skin" : "reddened skin"} stinging. <That's starting to really hurt...>`,
            `hisses, ${possessivePronoun} ${target} tender from the repeated slaps${skinDesc}.`,
            `tenses, the sting mixing with the heat${skinDesc}. <Maybe... maybe give it a rest?>`
        ];
    } else if (impactCount >= 3) {
        // Multiple slaps — skin coloring, stinging but still exciting
        templates = [
            `yelps, the slap ringing loud${skinDesc}.`,
            `gasps at the sharp crack of your hand${skinDesc}.`,
            `jumps at the contact, ${possessivePronoun} ${target} stinging warmly${skinDesc}.`,
            `lets out a sharp cry, the impact echoing${skinDesc}.`,
            `${reaction} at the impact, the ${skinState} flush spreading across ${possessivePronoun} skin.`
        ];
    } else {
        // Early slaps — surprise, excitement
        templates = [
            `yelps at the sharp crack of the slap.`,
            `gasps, the loud smack echoing in the air.`,
            `jumps, ${possessivePronoun} ${target} stinging from the impact.`,
            `cries out at the sudden, sharp contact.`,
            `${reaction} at the loud slap.`
        ];
    }

    let response = pickUnique(templates, intimacy, "impact-" + String(act.id || "x"));

    // Add verbal dialog from tags (CoT-style) — only when not over tolerance
    if (dialogueLine && !response.includes('"')) {
        if (dialogueLine.isNonVerbal) {
            if (Math.random() < 0.5) {
                response = `${response} ${dialogueLine.text}`;
            }
        } else if (dialogueLine.isVerbal) {
            if (Math.random() < 0.5) {
                response = `${response} "${dialogueLine.text}"`;
            }
        }
    }

    return response;
}

/**
 * Build generic response
 * Now uses CoT-style dialogue tags for verbal responses
 */
/**
 * Build response for watersports actions
 * NPC reactions are mostly negative (disgust, anger, shock).
 * Rare positive reactions only for very forward/bold NPCs at very high
 * arousal (80+), and even then only 25% chance — the other 75% are still
 * negative. Uncivilized NPCs may be confused rather than disgusted.
 */
function buildWatersportResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc) {
    const target = act.target || "body";
    const temperament = String(npc.temperament || "").toLowerCase();
    const isBold = temperament === "forward" || temperament === "bold";
    // Species-based check (same gate the anal-penetration verbiage block
    // uses). npc.civilizationLevel is never populated, so the old gate never
    // fired and uncivilized species got the fluent civilized-disgust lines.
    const isUncivilized = npc.civilizationLevel === "uncivilized" || npc.civilizationLevel === "feral"
        || (npc.species && typeof isCivilizedSpecies === "function" && !isCivilizedSpecies(npc.species));
    const isVeryAroused = arousalLevel >= 80;

    // Very bold NPCs at very high arousal: 25% chance of a (reluctantly)
    // positive reaction. Otherwise falls through to negative.
    if (isBold && isVeryAroused && Math.random() < 0.25) {
        return pickRandom([
            `gasps, then lets out a breathless laugh. <You're disgusting... I love it.>`,
            `shivers, ${possessivePronoun} eyes darkening with something beyond disgust. <Don't you dare stop.>`,
            `moans despite ${objectPronoun}self, ${possessivePronoun} body reacting against ${possessivePronoun} better judgment. <Gods, why does that feel...>`
        ]);
    }

    // Uncivilized NPCs: confused rather than disgusted
    if (isUncivilized) {
        return pickRandom([
            `flinches away, making a startled noise. <What... what you doing?>`,
            `wrinkles ${possessivePronoun} nose, clearly confused by the wet warmth. <This... strange. Why you do this?>`,
            `freezes, unsure how to react to the sensation. <This not... normal.>`,
            `shifts away, wiping at ${possessivePronoun} ${target} with a puzzled expression. <You mark me? Like animal?>`
        ]);
    }

    // Default: negative reactions scaled by severity of the target
    // Face is the most offensive target, feet/back the mildest
    var targetLower = String(target || "").toLowerCase();
    var isFaceTarget = targetLower === "face" || targetLower === "mouth" || targetLower === "lips";
    var isIntimateTarget = targetLower === "vagina" || targetLower === "pussy" || targetLower === "breasts" || targetLower === "chest";

    if (isFaceTarget) {
        return pickRandom([
            `jerk away in shock, ${possessivePronoun} face twisting in disgust. <What the fuck is wrong with you?!>`,
            `sputters and wipes furiously at ${possessivePronoun} face, ${possessivePronoun} eyes blazing. <You disgusting piece of—stop!>`,
            `turns ${possessivePronoun} head away, sputtering. <Are you insane?! Stop pissing on me!>`,
            `shoves you back hard, wiping ${possessivePronoun} face. <What is wrong with you?>`
        ]);
    }

    if (isIntimateTarget) {
        return pickRandom([
            `tenses up, ${possessivePronoun} expression shifting to revulsion. <No. No, that's... don't do that.>`,
            `pulls away, looking down at ${possessivePronoun} ${target} in disbelief. <That's... that's disgusting. Stop.>`,
            `wrinkles ${possessivePronoun} nose, pushing you away. <Seriously? On my ${target}? That's gross.>`,
            `shivers with revulsion, wiping at ${possessivePronoun} ${target}. <Stop. Just... stop.>`
        ]);
    }

    // Milder targets (back, thighs, feet, stomach, buttocks)
    return pickRandom([
        `shifts uncomfortably, wrinkling ${possessivePronoun} nose. <Really? That's... not okay.>`,
        `flinches at the warmth, pulling away slightly. <Hey—what are you doing? Stop that.>`,
        `gives you a sharp look of disapproval. <That's disgusting. Knock it off.>`,
        `moves away from the stream, wiping at ${possessivePronoun} ${target}. <Did you just... ugh. No.>`,
        `sighs in irritation, wiping ${possessivePronoun} ${target}. <You could have at least warned me. Gross.>`
    ]);
}

function buildGenericResponse(npc, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, reaction, dialogueTags = []) {
    const vocalization = getVocalization(arousalLevel);
    const tempDesc = getTemperatureDescriptor(arousalLevel);
    
    // Get dialogue from tags (CoT-style) - 20% chance
    let dialogueLine = null;
    if (Math.random() < 0.20 && dialogueTags && dialogueTags.length > 0) {
        dialogueLine = getDialogueFromTags(dialogueTags, arousalLevel, npc);
    }
    
    const templates = [
        `${reaction}.`,
        `${reaction} with pleasure.`,
        `${reaction} enthusiastically.`,
        `${reaction}, ${tempDesc}.`,
        `lets out a ${vocalization}.`
    ];
    
    let response = pickUnique(templates, intimacy, "ws-" + String(act.id || "x"));
    
    // Add verbal dialog from tags (CoT-style)
    if (dialogueLine) {
        if (dialogueLine.isNonVerbal) {
            // For non-verbal NPCs, add the sound without quotes as part of the physical reaction
            if (Math.random() < 0.5) {
                response = `${response} ${dialogueLine.text}`;
            }
        } else if (dialogueLine.isVerbal) {
            // For verbal NPCs, add quoted speech
            if (Math.random() < 0.5) {
                response = `says "${dialogueLine.text}"`;
            } else {
                response = `${response} "${dialogueLine.text}"`;
            }
        }
    }
    
    return response;
}

/**
 * Verbal dialog lines for CoT-style responses
 * These are occasional spoken interjections based on arousal and personality
 */
var VERBAL_DIALOG = {
    low: [
        "That feels nice",
        "Mmm, that's good",
        "You're gentle",
        "Keep going",
        "Don't stop"
    ],
    mild: [
        "Yes, just like that",
        "That feels amazing",
        "You're so good at this",
        "More, please",
        "I love that",
        "Right there"
    ],
    moderate: [
        "Oh yes, that's perfect",
        "I need more",
        "Please don't stop",
        "You're making me feel so good",
        "Harder, yes",
        "Just like that"
    ],
    high: [
        "Yes! Yes! Just like that!",
        "I'm so close",
        "Please, I need more",
        "You're incredible",
        "Fuck, that's good",
        "I can't take much more"
    ],
    intense: [
        "YES! FUCK YES!",
        "I'm going to cum!",
        "Please, make me cum",
        "Fuck me harder!",
        "Don't you dare stop!",
        "I'm yours, all yours"
    ]
};

/**
 * Get verbal dialog based on arousal level
 */
function getVerbalDialog(arousalLevel) {
    if (arousalLevel < 20) return pickRandom(VERBAL_DIALOG.low);
    if (arousalLevel < 40) return pickRandom(VERBAL_DIALOG.mild);
    if (arousalLevel < 60) return pickRandom(VERBAL_DIALOG.moderate);
    if (arousalLevel < 80) return pickRandom(VERBAL_DIALOG.high);
    return pickRandom(VERBAL_DIALOG.intense);
}

/**
 * Get vocalization based on arousal level
 * Fixed grammar issues (e.g., "a loud moans" -> "a loud moan")
 */
function getVocalization(arousalLevel) {
    if (arousalLevel < 20) return pickRandom(["sigh", "soft sound", "murmur"]);
    if (arousalLevel < 40) return pickRandom(["soft moan", "sigh of pleasure", "murmur"]);
    if (arousalLevel < 60) return pickRandom(["moan", "gasp", "sigh of pleasure"]);
    if (arousalLevel < 80) return pickRandom(["loud moan", "gasp of pleasure", "whimper"]);
    return pickRandom(["loud moan", "cry of pleasure", "passionate gasp", "desperate whimper"]);
}

/**
 * Get pleasure intensity descriptor
 */
function getPleasureIntensity(arousalLevel) {
    if (arousalLevel < 20) return pickRandom(["mild interest", "slight pleasure", "contentment"]);
    if (arousalLevel < 40) return pickRandom(["growing pleasure", "enjoyment", "warmth"]);
    if (arousalLevel < 60) return pickRandom(["obvious pleasure", "growing arousal", "delight"]);
    if (arousalLevel < 80) return pickRandom(["intense pleasure", "strong arousal", "passion"]);
    return pickRandom(["extreme pleasure", "overwhelming arousal", "desperate need", "climax-building tension"]);
}

/**
 * Get temperature descriptor
 */
function getTemperatureDescriptor(arousalLevel) {
    if (arousalLevel < 20) return pickRandom(["warm", "slightly flushed"]);
    if (arousalLevel < 40) return pickRandom(["warm and flushed", "heated", "growing warm"]);
    if (arousalLevel < 60) return pickRandom(["hot", "flushed with arousal", "heated with desire"]);
    if (arousalLevel < 80) return pickRandom(["very hot", "burning with desire", "trembling with heat"]);
    return pickRandom(["feverish with need", "on fire with passion", "aching with heat"]);
}

// ============================================================================
// COT-STYLE DIALOGUE TAG SYSTEM
// ============================================================================

/**
 * Dialogue database organized by OBJECT-PERSPECTIVE tags (like CoT)
 * These are what the NPC (receiver/object) would say
 * Each tag has dialogue lines at different arousal levels
 * Structure: { tag: { low: [...], mild: [...], moderate: [...], high: [...], intense: [...] } }
 */
// Simplified dialogue for uncivilized species (limited vocabulary)
var UNCIVILIZED_DIALOGUE = {
    low: ["Good", "Nice", "Mmm", "Yes"],
    mild: ["More", "Yes, good", "Like that", "Keep going"],
    moderate: ["Yes! More!", "That good", "Don't stop", "Harder"],
    high: ["YES! MORE!", "Need more", "Good, good!", "Please, continue"],
    intense: ["YES! YES! YES!", "MORE! HARDER!", "DON'T STOP!", "ALMOST THERE!"]
};

// Non-verbal sounds only (grunts, moans, etc.)
var NONVERBAL_REACTIONS = {
    low: ["Mmm", "Hmm", "Unh", "Ahh"],
    mild: ["Mmmph", "Nnngh", "Uhn", "Ahhh"],
    moderate: ["Mmmm!", "Uhn!", "Ahh!", "Nnngh!"],
    high: ["UNH! UNH!", "MMMPH! MMMPH!", "AH! AH!", "NNNGH! NNNGH!"],
    intense: ["UNHHH! UNHHH!", "FUCK! FUCK!", "MMMPHHH!", "AAAAH! AAAAH!"]
};

var DIALOGUE_DATABASE = {
    // ==== KISSING (NPC being kissed) ====
    "being kissed": {
        low: ["That feels nice", "Mmm", "Nice"],
        mild: ["That's nice", "I like that", "Kiss me more"],
        moderate: ["Yes, just like that", "Kiss me deeper", "Don't stop"],
        high: ["Fuck, that's good", "I need more of that", "Please don't stop"],
        intense: ["YES! More!", "I need you so much", "Please, kiss me harder"]
    },
    
    // ==== FACE/HAIR (NPC being touched) ====
    "being caressed": {
        low: ["That feels nice", "Mmm", "Gentle"],
        mild: ["That's nice", "I like that", "Touch me more"],
        moderate: ["Yes, just like that", "Caress me", "Don't stop"],
        high: ["Fuck, that's good", "I need more", "Please, continue"],
        intense: ["YES! More!", "I need that", "Don't stop"]
    },
    "hair stroked": {
        low: ["That feels nice", "Mmm", "Nice"],
        mild: ["That's relaxing", "I like that", "More, please"],
        moderate: ["Yes, just like that", "Stroke my hair", "Don't stop"],
        high: ["Fuck, that's good", "I need more", "Yes, please"],
        intense: ["YES! More!", "That feels amazing", "Don't stop"]
    },
    
    // ==== BREASTS (NPC's breasts being touched) ====
    "breasts groped": {
        low: ["That feels good", "Mmm", "Gentle"],
        mild: ["Yes, like that", "Squeeze them", "More pressure"],
        moderate: ["Harder, please", "I love that", "Don't stop touching me there"],
        high: ["Fuck yes!", "Pinch them harder", "I need more"],
        intense: ["YES! Play with them!", "Harder! Please!", "I'm so close"]
    },
    "breasts touched": {
        low: ["That feels nice", "Mmm", "Gentle touch"],
        mild: ["That's nice", "I like that", "Keep doing that"],
        moderate: ["That feels good", "Softer, just like that", "Your hands are warm"],
        high: ["That's wonderful", "I love your touch", "Keep going"],
        intense: ["Yes, just like that", "Don't stop touching me", "That's amazing"]
    },
    
    // ==== PUSSY/VAGINA (NPC's pussy being stimulated) ====
    "pussy kissed": {
        low: ["That feels nice", "Mmm", "Gentle"],
        mild: ["That's the spot", "Yes, right there", "More, please"],
        moderate: ["Oh yes, just like that", "Touch me there", "Don't stop"],
        high: ["Fuck, that's good", "I need more", "Please, keep going"],
        intense: ["YES! Right there!", "I'm going to cum", "Fuck me, please!"]
    },
    "pussy licked": {
        low: ["That feels nice", "Mmm", "Gentle"],
        mild: ["That's amazing", "Yes, right there", "More, please"],
        moderate: ["Oh yes, lick me there", "Don't stop", "That's perfect"],
        high: ["Fuck, that's incredible", "I need more", "Yes, just like that"],
        intense: ["YES! LICK ME HARDER!", "I'm going to cum", "Don't stop, please!"]
    },
    "pussy fingered": {
        low: ["That feels nice", "Mmm", "Gentle"],
        mild: ["Yes, just like that", "Deeper, please", "More fingers"],
        moderate: ["Oh yes, fuck me with your fingers", "Harder", "Don't stop"],
        high: ["Fuck yes! Deeper!", "I need more", "Fuck me with your hand"],
        intense: ["YES! FUCK ME!", "I'm cumming!", "Don't stop, I'm so close"]
    },
    "pussy rubbed": {
        low: ["That feels nice", "Mmm", "Gentle"],
        mild: ["Yes, right there", "Grind harder", "More pressure"],
        moderate: ["Oh yes, just like that", "Rub me there", "Don't stop"],
        high: ["Fuck, that's good", "I need more", "Yes, please"],
        intense: ["YES! RIGHT THERE!", "I'm going to cum", "Harder, please!"]
    },
    "pussy penetrated": {
        low: ["You're inside me", "Mmm", "Yes"],
        mild: ["That feels amazing", "Yes, just like that", "More, please"],
        moderate: ["Oh yes! Fuck me", "Deeper, please", "Harder"],
        high: ["FUCK YES! Fuck me harder", "I need more", "Don't stop"],
        intense: ["YES! FUCK ME HARDER!", "I'm cumming! FUCK YES!", "Please, fuck me, don't stop"]
    },
    
    // ==== COCK/PENIS (NPC's cock being stimulated) ====
    "cock in pussy": {
        low: ["That feels nice", "Mmm", "Gentle"],
        mild: ["Yes, just like that", "Hump me", "More, please"],
        moderate: ["Oh yes, right there", "Take my cock", "Don't stop"],
        high: ["Fuck yes! Take it all", "I need more", "Yes, just like that"],
        intense: ["YES! FUCK ME!", "I'm going to cum", "Don't stop, please!"]
    },
    
    // ==== MOUTH (NPC's mouth being used) ====
    // Note: NPC cannot speak clearly with a cock in their mouth
    // They can only garble words or make muffled sounds
    // Arousal comes from PERFORMING the act (giving oral), not receiving
    "cock in mouth": {
        low: ["Mmm", "Mmph", "Uhn", "Nnngh", "Mmmph"],
        mild: ["Mmph yeah", "Nnngh mmm", "Mmm-hmm", "Mm-fine", "Ph-mm good", "Mph-yep"],
        moderate: ["Mmph! G-g-good", "Nnngh! M-more", "Mmmph! L-l-like th-that", "Mmm! K-keep g-goin'", "Mmph! D-don't s-stop", "Nnngh! Th-that's g-good", "Mmph! F-feels n-nice", "Mmph! L-love d-doing th-this", "Nnngh! W-want m-more"] ,
        high: ["MMMPH! Y-YES!" , "NNNGH! N-NEED M-MORE", "MMPH! D-DON'T ST-STOP", "MMM-GOOD! K-KEEP G-GOING", "MPHHH! C-CAN'T S-STOP", "MMMPH! L-Like th-that!" , "NNNGH! H-Harder!" , "MMPH! T-Take it d-deep", "MMMPH! L-Love s-sucking y-you", "NNNGH! M-Make m-me c-cum"],
        intense: ["MMMPHHH! Y-YES! Y-YES!" , "NNNNGH! I-I'M C-CUMMING!" , "MMMPHHH! D-DON'T S-STOP! P-PLEASE!" , "MMMMMMPH! T-TOO M-MUCH! N-NOT G-GONNA L-LAST", "NNGHHH! F-FUCK! K-KEEP G-GOING!", "MMMPHHH! G-GONNA C-CUM!" , "NNNNGH! I-I C-CAN'T! S-STOP!" , "MMMMMPH! F-FILL M-ME!" , "NNGHHH! T-TAKE IT ALL!", "MMMPH! I-I'M C-CUMM-PH-PHIN'!" , "NNNGH! C-CAN'T B-BREATHE!" , "MPHHH! M-MAKE M-ME!" , "MMMPH! S-STOP! N-NO! K-KEEP G-GOING!"]
    },
    
    // ==== GENERIC ====
    "general": {
        low: ["That feels nice", "Mmm", "Good"],
        mild: ["Yes, just like that", "I like that", "More, please"],
        moderate: ["Oh yes, that's perfect", "Don't stop", "Right there"],
        high: ["Fuck, that's good", "I need more", "Please, continue"],
        intense: ["YES! More!", "Don't stop", "I'm so close"]
    }
};

/**
 * Get dialogue line based on tags and arousal level
 * Mimics CoT's system: action has dialogue tags -> lookup in database -> select based on arousal
 * Respects NPC speech capabilities (non-verbal, uncivilized, civilized)
 * Returns an object with: { text: string, isVerbal: boolean, isNonVerbal: boolean }
 */
function getDialogueFromTags(tags, arousalLevel, npc, maxTier) {
    if (!tags || tags.length === 0) return null;
    
    // Scale arousal from 0-800 to 0-100 for the tier thresholds
    var scaled = scaleArousal(arousalLevel);
    
    // Cap the maximum dialogue tier (e.g. "moderate" for gentle acts)
    var tierOrder = ["low", "mild", "moderate", "high", "intense"];
    var maxIndex = maxTier ? tierOrder.indexOf(maxTier) : 4;
    if (maxIndex < 0) maxIndex = 4;
    
    // Get NPC dialogue style
    const dialogueStyle = getNPCDialogueStyle(npc);
    
    // Non-verbal NPCs can only make sounds - return special marker
    if (dialogueStyle === 'nonverbal') {
        const sound = getArousalBasedReaction(NONVERBAL_REACTIONS, arousalLevel);
        return { text: sound, isVerbal: false, isNonVerbal: true };
    }
    
    // Uncivilized NPCs have limited vocabulary - return as verbal but simplified
    if (dialogueStyle === 'uncivilized') {
        const text = getArousalBasedReaction(UNCIVILIZED_DIALOGUE, arousalLevel);
        return { text: text, isVerbal: true, isNonVerbal: false };
    }
    
    // Civilized NPCs use full dialogue database
    // Try each tag in order, pick first one that exists in database
    for (const tag of tags) {
        const tagDialogue = DIALOGUE_DATABASE[tag];
        if (tagDialogue) {
            // Get arousal-based lines, capped by maxTier
            let text;
            if (scaled < 20 && maxIndex >= 0 && tagDialogue.low) {
                text = pickRandom(tagDialogue.low);
            } else if (scaled < 40 && maxIndex >= 1 && tagDialogue.mild) {
                text = pickRandom(tagDialogue.mild);
            } else if (scaled < 60 && maxIndex >= 2 && tagDialogue.moderate) {
                text = pickRandom(tagDialogue.moderate);
            } else if (scaled < 80 && maxIndex >= 3 && tagDialogue.high) {
                text = pickRandom(tagDialogue.high);
            } else if (maxIndex >= 4 && tagDialogue.intense) {
                text = pickRandom(tagDialogue.intense);
            } else {
                // Fallback: pick from the highest available tier at or below maxIndex
                for (var i = Math.min(maxIndex, 4); i >= 0; i--) {
                    var tierName = tierOrder[i];
                    if (tagDialogue[tierName]) {
                        text = pickRandom(tagDialogue[tierName]);
                        break;
                    }
                }
                if (!text) text = pickRandom(Object.values(tagDialogue).flat());
            }
            // Special case: cock in mouth is always non-verbal
            const isNonVerbalTag = tag === "cock in mouth";
            return { text: text, isVerbal: !isNonVerbalTag, isNonVerbal: isNonVerbalTag };
        }
    }
    
    // Fallback to general dialogue
    return getDialogueFromTags(["general"], arousalLevel, npc, maxTier);
}

/**
 * Get a reaction based on arousal level from a simple reactions object
 */
function getArousalBasedReaction(reactions, arousalLevel) {
    var scaled = scaleArousal(arousalLevel);
    if (scaled < 20 && reactions.low) {
        return pickRandom(reactions.low);
    } else if (scaled < 40 && reactions.mild) {
        return pickRandom(reactions.mild);
    } else if (scaled < 60 && reactions.moderate) {
        return pickRandom(reactions.moderate);
    } else if (scaled < 80 && reactions.high) {
        return pickRandom(reactions.high);
    } else if (reactions.intense) {
        return pickRandom(reactions.intense);
    }
    // Fallback to any available
    return pickRandom(Object.values(reactions).flat());
}

/**
 * Get pronoun for object
 */
function getObjectPronoun(npc) {
    if (!npc) return "them";
    const gender = (npc.gender || "female").toLowerCase();
    // Check female first, then male, with prefix matching for race+gender combinations
    if (gender === "female" || gender === "f" || 
        gender.includes(" woman") || gender.includes(" girl") ||
        gender.includes("female ") || gender.startsWith("female")) return "her";
    if (gender === "male" || gender === "m" || 
        gender.includes(" man") || gender.includes(" boy") ||
        gender.includes("male ") || gender.startsWith("male")) return "him";
    return "them";
}

/**
 * Generate end response
 */
function generateEndResponse(npc, player, act) {
    const subjectPronoun = getSubjectPronoun(npc) || "They";
    const possessivePronoun = getPossessivePronoun(npc) || "their";
    const objectPronoun = getObjectPronoun(npc) || "them";
    const npcName = npc.name || "They";
    
    // Check if player has ejaculated internally
    const intimacy = npc.intimacy || {};
    const hasInternalEjaculation = intimacy.climax && intimacy.climax.hasInternalEjaculation;
    const lastEjaculationTarget = intimacy.climax ? intimacy.climax.lastInternalEjaculation : null;
    const ejaculationInVagina = lastEjaculationTarget === "vagina" || lastEjaculationTarget === "pussy";
    const ejaculationInAnus = lastEjaculationTarget === "anus" || lastEjaculationTarget === "ass";
    const ejaculationInMouth = lastEjaculationTarget === "mouth";
    
    // Check NPC species for civilized/uncivilized behavior
    const isUncivilized = npc && npc.species && !isCivilizedSpecies(npc.species);
    
    // Get player gender
    const playerGender = getPlayerGenderForGates(player);
    const playerHasPenis = playerGender === "male" || playerGender.includes("male");
    
    // Handle pull-out actions
    if (act.id === "pull_out") {
        // Determine if this is vaginal or anal pull-out based on last penetration target
        const lastPenetrationTarget = intimacy.penetration ? intimacy.penetration.target : null;
        const isAnalPullOut = lastPenetrationTarget === "anus" || lastPenetrationTarget === "ass";
        const tool = (intimacy.penetration && intimacy.penetration.tool) || "cock";

        // Lead the response with an erotic description of the penis sliding out
        // of the orifice, before the NPC reaction and ejaculation/scent details.
        const analWithdrawalLead = pickRandom([
            `You slide your ${tool} out of ${possessivePronoun} stretched ass inch by inch, the swollen ring gripping your shaft the whole way out, the drag friction-hot against the rim. The head tugs at the rim a moment, then pops free with a soft sound.`,
            `You withdraw your ${tool} from ${possessivePronoun} depths one slow inch at a time, the tight ring dragging along your length with a wet suck, the friction of it burning around your crown. The muscle clamps down hard behind you, slow to let go.`,
            `You ease your ${tool} free of ${possessivePronoun} ass, the heat peeling off you in layers until the crown stretches the rim wide and slips out. The loosened ring twitches in the open air.`,
            `You pull back until only the head of your ${tool} remains clamped in ${possessivePronoun} ring, pausing there, then draw it out with one last stretch and a quiet pop.`
        ]);
        const vaginalWithdrawalLead = pickRandom([
            `You slide your ${tool} out of ${possessivePronoun} pussy inch by inch, the slick folds clinging to your shaft on the whole slow ride out. A string of arousal connects you to ${possessivePronoun} entrance before it snaps.`,
            `You pull your ${tool} free from ${possessivePronoun} wet depths one careful inch at a time, letting ${objectPronoun} feel every ridge of the withdrawal. The swollen lips drag along your length and slowly press back together behind you.`,
            `You withdraw your ${tool} from ${possessivePronoun} pussy in short pulls, the entrance gripping and releasing with each inch that clears it.`,
            `You ease back until only the head of your ${tool} sits inside ${possessivePronoun}, then slip that out too, ${possessivePronoun} lips flushed and clinging wet as they close.`
        ]);

        // Set flag that pull-out just occurred and track what was penetrated
        if (!intimacy.encounterFlags) intimacy.encounterFlags = {};
        intimacy.encounterFlags.justPulledOut = true;
        intimacy.encounterFlags.lastPullOutTarget = isAnalPullOut ? "anus" : "vagina";

        if (isAnalPullOut) {
            // Pulling out of anus
            if (ejaculationInAnus) {
                // With ejaculation - anal-specific mechanics
                const anusSize = (npc.anatomy && npc.anatomy.anus && npc.anatomy.anus.size) || "snug";
                const isTight = ["tight", "snug", "firm"].includes(anusSize);
                const isLoose = ["loose", "gaping", "stretchy", "experienced"].includes(anusSize);
                
                let ejaculationDesc = "";
                if (isTight) {
                    // Tight anus - semen squirts or farts out
                    const hasFart = Math.random() < 0.4;
                    if (hasFart) {
                        ejaculationDesc = pickRandom([
                            "your seed trapped in the tight passage suddenly squirting out with a wet fart",
                            "a wet fart escaping as your semen is forced out by the clamping ring",
                            "your cum squirting out with a lewd noise as the tight muscle releases"
                        ]);
                    } else {
                        ejaculationDesc = pickRandom([
                            "your seed squeezed out by the tight ring",
                            "your cum oozing out slowly from the well-used hole",
                            "thick semen dripping from the stretched opening"
                        ]);
                    }
                } else if (isLoose) {
                    // Loose anus - semen drops out
                    ejaculationDesc = pickRandom([
                        "your seed dripping out freely from the loose passage",
                        "your cum leaking out with a messy squelch",
                        "semen drooling from the gaping hole"
                    ]);
                } else {
                    // Medium/unknown - generic
                    ejaculationDesc = pickRandom([
                        "your seed dripping from the well-used opening",
                        "your cum leaking out as you pull away"
                    ]);
                }
                
                // Pungent scent for anal
                const scentDesc = pickRandom([
                    "a pungent, musky scent",
                    "the raw, animalistic aroma",
                    "a strong, intimate fragrance",
                    "the thick scent of mating"
                ]);
                
                return {
                    action: "pull_out",
                    type: "end",
                    responseText: `${analWithdrawalLead} ${subjectPronoun.toLowerCase()} clenches, ${ejaculationDesc}, ${scentDesc} filling the air.`,
                    penetrationEnded: true
                };
            } else {
                // Anal pull-out without ejaculation
                return {
                    action: "pull_out",
                    type: "end",
                    responseText: `${analWithdrawalLead} ${subjectPronoun.toLowerCase()} tightens, the muscular ring resisting your withdrawal.`,
                    penetrationEnded: true
                };
            }
        } else {
            // Pulling out of vagina
            if (ejaculationInVagina) {
                // With ejaculation - describe dripping semen and scents
                const scentDesc = isUncivilized && Math.random() < 0.5 
                    ? pickRandom(["a pungent musk", "a strong, animalistic scent", "the raw smell of mating", "a primal aroma"])
                    : pickRandom(["the scent of sex", "a warm, intimate fragrance", "the musky perfume of lovemaking", "the scent of passion"]);
                
                const urineDesc = isUncivilized && Math.random() < 0.3
                    ? `, a warm trickle of urine escaping as ${subjectPronoun.toLowerCase()} loses control`
                    : "";
                
                return {
                    action: "pull_out",
                    type: "end",
                    responseText: `${vaginalWithdrawalLead} ${subjectPronoun.toLowerCase()} gasps, thick semen dripping from ${possessivePronoun} well-used vagina${urineDesc}, ${scentDesc} filling the air.`,
                    penetrationEnded: true
                };
            } else {
                // Without ejaculation
                return {
                    action: "pull_out",
                    type: "end",
                    responseText: `${vaginalWithdrawalLead} ${subjectPronoun.toLowerCase()} sighs, ${possessivePronoun} inner walls clenching at the sudden emptiness.`,
                    penetrationEnded: true
                };
            }
        }
    }
    
    if (act.id === "pull_off") {
        // Female player pulling off penis
        const npcTool = (intimacy.penetration && intimacy.penetration.tool) || "cock";
        const pullOffLead = pickRandom([
            `You lift yourself off ${possessivePronoun} ${npcTool}, your slick folds clinging to it as you rise.`,
            `You ease yourself up, ${possessivePronoun} ${npcTool} sliding out of you with a wet sound as your pussy lets it go.`,
            `You pull away, ${possessivePronoun} ${npcTool} dragging free of your clenching warmth an inch at a time.`
        ]);
        // Set flag that pull-out just occurred
        if (!intimacy.encounterFlags) intimacy.encounterFlags = {};
        intimacy.encounterFlags.justPulledOut = true;
        intimacy.encounterFlags.lastPullOutTarget = "vagina";

        if (ejaculationInVagina) {
            const scentDesc = isUncivilized && Math.random() < 0.5
                ? pickRandom(["a pungent musk", "a strong, animalistic scent"])
                : pickRandom(["the scent of sex", "a warm, intimate fragrance"]);

            const urineDesc = isUncivilized && Math.random() < 0.3
                ? ", a warm trickle escaping as you lose control"
                : "";

            return {
                action: "pull_off",
                type: "end",
                responseText: `${pullOffLead} ${subjectPronoun.toLowerCase()} gasps, semen dripping from your well-used vagina${urineDesc}, ${scentDesc} filling the air.`,
                penetrationEnded: true
            };
        } else {
            return {
                action: "pull_off",
                type: "end",
                responseText: `${pullOffLead} ${subjectPronoun.toLowerCase()} sighs, your inner walls clenching at the sudden emptiness.`,
                penetrationEnded: true
            };
        }
    }
    
    if (act.id === "pull_out_of_mouth") {
        // Pulling out of mouth - recipient can swallow
        const mouthTool = (intimacy.penetration && intimacy.penetration.tool) || "cock";
        const mouthWithdrawalLead = pickRandom([
            `You slide your ${mouthTool} out of ${possessivePronoun} mouth, the wet heat releasing you inch by inch.`,
            `You withdraw your ${mouthTool} from between ${possessivePronoun} lips, a strand of saliva stretching between you.`,
            `You ease your ${mouthTool} free of ${possessivePronoun} mouth, ${possessivePronoun} lips dragging along your shaft until the head pops free.`
        ]);
        // Set flag that pull-out just occurred
        if (!intimacy.encounterFlags) intimacy.encounterFlags = {};
        intimacy.encounterFlags.justPulledOut = true;
        intimacy.encounterFlags.lastPullOutTarget = "mouth";

        if (ejaculationInMouth) {
            // Check if NPC swallows (50% chance if they're verbal)
            const swallows = Math.random() < 0.5 && npc && !npc.verbalDisabled;

            if (swallows) {
                return {
                    action: "pull_out_of_mouth",
                    type: "end",
                    responseText: `${mouthWithdrawalLead} ${subjectPronoun.toLowerCase()} swallows your release with a satisfied expression, licking ${possessivePronoun} lips clean.`,
                    penetrationEnded: true
                };
            } else {
                return {
                    action: "pull_out_of_mouth",
                    type: "end",
                    responseText: `${mouthWithdrawalLead} ${subjectPronoun.toLowerCase()} lets your seed drip from ${possessivePronoun} lips, a thick string connecting your ${mouthTool} to ${possessivePronoun} mouth for a moment.`,
                    penetrationEnded: true
                };
            }
        } else {
            return {
                action: "pull_out_of_mouth",
                type: "end",
                responseText: `${mouthWithdrawalLead} ${subjectPronoun.toLowerCase()} releases you with a wet pop, strings of saliva connecting your shaft to ${possessivePronoun} lips.`,
                penetrationEnded: true
            };
        }
    }
    
    if (act.id === "stop_fingering" || act.id === "pull_off_of_finger") {
        // Pulling fingers out of vagina
        if (ejaculationInVagina) {
            const scentDesc = pickRandom(["the scent of arousal", "a warm, intimate fragrance"]);
            return {
                action: act.id,
                type: "end",
                responseText: `shivers as you withdraw your fingers, semen dripping from ${possessivePronoun} slick folds, ${scentDesc} in the air.`,
                penetrationEnded: true
            };
        } else {
            return {
                action: act.id,
                type: "end",
                responseText: `sighs as you slowly withdraw your fingers from ${possessivePronoun} warmth.`,
                penetrationEnded: true
            };
        }
    }
    
    if (act.id === "release_cock") {
        // Releasing cock from hand
        return {
            action: "release_cock",
            type: "end",
            responseText: `cock springs free from your grip, glistening with ${possessivePronoun} arousal.`,
            penetrationEnded: false
        };
    }
    
    if (act.id === "stop") {
        return {
            action: "stop",
            type: "end",
            responseText: `${subjectPronoun} <nods.> The intimate moment ends.`,
            encounterEnded: true
        };
    }
    
    if (act.id === "pause") {
        return {
            action: "pause",
            type: "end",
            responseText: `${subjectPronoun} <takes a deep breath and pauses.>`
        };
    }
    
    // Default end response
    return {
        action: act.id || "end",
        type: "end",
        responseText: `${subjectPronoun} <pauses, the moment ending.>`
    };
}

// ============================================================================
// MENU ORGANIZATION
// ============================================================================

/**
 * Organize actions into menu categories
 */
function organizeActionsForMenu(validActions, npc) {
    const categorized = {};

    for (const action of validActions) {
        const category = getActionCategory(action.actId, npc);
        if (!categorized[category]) {
            categorized[category] = [];
        }
        categorized[category].push(action);
    }
    
    // Debug: log categories and counts
    if (window.DEBUG_INTIMACY) {
        console.log("[DEBUG] organizeActionsForMenu categories:", Object.keys(categorized).map(k => `${k}:${categorized[k].length}`).join(", "));
    }
    
    return categorized;
}

/**
 * Get menu-ready action list with phase-based filtering
 * Now includes disabled actions with hints for better UX
 * @param {Object} npc - The NPC
 * @param {Object} player - The player
 * @param {Object} room - Current room (for context detection)
 * @param {string} positionId - Current position
 */
/**
 * Accent styling for intimacy action buttons. Differentiates rough/impact
 * play (orange), watersports (yellow), and climax/ejaculation acts (white,
 * bold) from the default button color. Returns null for ordinary acts.
 */
function getIntimacyActionAccent(actId) {
    const act = getAct(actId);
    if (!act) return null;
    if (act.triggersClimax) return { color: "#ffffff", bold: true };
    if (act.type === ACT_TYPES.WATERSPORT) return { color: "#f2c94c" };
    if (act.type === ACT_TYPES.IMPACT) return { color: "#ff8c42" };
    return null;
}

function getMenuActions(npc, player, room = null, positionId = null) {
    // Determine current intimacy phase based on context
    const phase = room ? getCurrentIntimacyPhase(room, npc, npc) : INTIMACY_PHASES.SOCIAL;
    
    // Generate all valid actions for current state
    let validActions = generateValidActions(npc, player, positionId);

    // Pull-out acts never render in the standard list. The single
    // context-aware Pull Out button below is the only way out - having
    // both a menu-top "Pull Away" and a list "Pull Out" produced two
    // different code paths that did not share state (see the pull-out
    // unification in executeIntimacyAction / endPenetrationWithNarration).
    validActions = validActions.filter(a => !/^pull_(out|off)/.test(a.actId || ""));
    
    // Debug: log valid action count
    if (npc && npc.name) {
        const clothingActions = validActions.filter(a => a.type === ACT_TYPES.CLOTHING);
        console.log(`[DEBUG] Generated ${validActions.length} valid actions for ${npc.name}, ${clothingActions.length} clothing actions`);
    }
    
    // Filter by phase (removes actions not appropriate for current context)
    validActions = filterActionsByPhase(validActions, phase);
    
    // Debug: log after phase filtering
    if (npc && npc.name) {
        const clothingActions = validActions.filter(a => a.type === ACT_TYPES.CLOTHING);
        console.log(`[DEBUG] After phase filter: ${validActions.length} actions for ${npc.name}, ${clothingActions.length} clothing actions, phase=${phase}`);
    }
    
    // Also get disabled actions with their reasons for showing hints
    const allActionsWithStatus = generateAllActionsWithStatus(npc, player, positionId);

    // Filter disabled actions by phase as well
    const filteredDisabledActions = allActionsWithStatus.invalid.filter(action => {
        // Pull-out acts are excluded - the context-aware Pull Out button
        // owns withdrawal (see the validActions filter above).
        if (/^pull_(out|off)/.test(action.actId || "")) return false;
        // Create a mock action object for phase filtering
        const mockAction = { ...action, actId: action.actId };
        return filterActionsByPhase([mockAction], phase).length > 0;
    });
    
    // Convert to menu format with natural labels, grouped into progression
    // sections: Undress first (undressing opens up everything else), then
    // Foreplay (kissing, touching, teasing — escalating up the disinhibition
    // ladder), then Penetration (entry and thrusting), then Climax (release
    // acts), then Other (end-of-flow
    // and specialty acts). Within a section, entries keep the natural
    // progression order. Valid actions show by default; disabled ones
    // (blocked by position, clothing, or the disinhibition gate) keep their
    // hint and only appear through the "Show all" toggle.
    const menu = [];
    const flatActions = [];

    const seenActIds = new Set();
    for (const a of validActions) {
        if (seenActIds.has(a.actId)) continue;
        seenActIds.add(a.actId);
        flatActions.push({
            id: a.actId,
            label: getNaturalLabel(a.actId, npc, player),
            description: (typeof getGenderedDesc === "function") ? getGenderedDesc(a, npc, player) : a.desc,
            type: a.type,
            disabled: false
        });
    }
    for (const a of filteredDisabledActions) {
        if (seenActIds.has(a.actId)) continue;
        seenActIds.add(a.actId);
        flatActions.push({
            id: a.actId,
            label: getNaturalLabel(a.actId, npc, player),
            description: (typeof getGenderedDesc === "function") ? getGenderedDesc(a, npc, player) : a.desc,
            type: a.type,
            disabled: true,
            disabledHint: a.disabledHint
        });
    }

    // Inventory-driven acts (toys / lube carried by player or NPC): they
    // land in the Head and Midsection tabs via their menuSection field.
    injectIntimacyItemActs(flatActions, npc, player, positionId);

    // Intensity rank for ordering: act type first (tease, clothing, then
    // escalating types), the disinhibition tier within a type (a kiss before
    // chest contact before hand/fingers/mouth on genitals), and "Receive"
    // acts (the NPC acting on the player) after the player-actor ones.
    const FLAT_TYPE_ORDER = {};
    FLAT_TYPE_ORDER[ACT_TYPES.TEASE] = 0;
    FLAT_TYPE_ORDER[ACT_TYPES.CLOTHING] = 1;
    FLAT_TYPE_ORDER[ACT_TYPES.PENETRATE] = 2;
    FLAT_TYPE_ORDER[ACT_TYPES.CONTINUE] = 3;
    FLAT_TYPE_ORDER[ACT_TYPES.IMPACT] = 5;
    FLAT_TYPE_ORDER[ACT_TYPES.WATERSPORT] = 6;
    FLAT_TYPE_ORDER[ACT_TYPES.END] = 7;

    const flatMenuRank = function (entry) {
        const act = getAct(entry.id) || {};
        let order = FLAT_TYPE_ORDER.hasOwnProperty(entry.type) ? FLAT_TYPE_ORDER[entry.type] : 4;
        if (act.playerIsBottom === true) order += 10;
        const tier = _effectiveActDisinhibitionThreshold(act);
        return order * 1000 + tier;
    };

    flatActions.sort(function (a, b) {
        const rankDiff = flatMenuRank(a) - flatMenuRank(b);
        if (rankDiff !== 0) return rankDiff;
        return String(a.label).localeCompare(String(b.label));
    });

    // ============================================================================
    // NEW BODY-PART BASED MENU SYSTEM
    // ============================================================================
    
    // Helper functions to determine if NPC has specific body parts
    // These check both gender and anatomy to determine which body parts exist
    
    /**
     * Check if NPC has a head (all NPCs have this)
     */
    const npcHasHead = function(npc) {
        return true; // All NPCs have a head
    };
    
    /**
     * Check if NPC has upper body (all NPCs have this)
     */
    const npcHasUpperBody = function(npc) {
        return true; // All NPCs have upper body
    };
    
    /**
     * Check if NPC has midsection (genitals/anus/tail area)
     */
    const npcHasMidsection = function(npc) {
        if (!npc) return false;
        // All NPCs have this area, but specific parts vary
        return true;
    };
    
    /**
     * Check if NPC has lower body (thighs/legs/feet)
     */
    const npcHasLowerBody = function(npc) {
        return true; // All NPCs have lower body
    };
    
    /**
     * Check if NPC has breasts
     */
    const npcHasBreasts = function(npc) {
        if (!npc) return false;
        // Check gender - females and non-binary typically have breasts
        const gender = (npc.gender || "female").toLowerCase();
        if (gender === "male") return false;
        // Check anatomy
        const anatomy = (npc.nsfwTraits && npc.nsfwTraits.anatomy) || (npc.anatomy || {});
        if (anatomy.breasts) return true;
        // Default based on gender
        return (gender === "female" || gender === "non-binary");
    };
    
    /**
     * Check if NPC has a penis/cock
     */
    const npcHasPenis = function(npc) {
        if (!npc) return false;
        const gender = (npc.gender || "female").toLowerCase();
        const anatomy = (npc.nsfwTraits && npc.nsfwTraits.anatomy) || (npc.anatomy || {});
        // Check anatomy first
        if (anatomy.penis || anatomy.cock || anatomy.dick) return true;
        // Check gender
        return (gender === "male" || gender === "non-binary");
    };
    
    /**
     * Check if NPC has a vagina/pussy
     */
    const npcHasVagina = function(npc) {
        if (!npc) return false;
        const gender = (npc.gender || "female").toLowerCase();
        const anatomy = (npc.nsfwTraits && npc.nsfwTraits.anatomy) || (npc.anatomy || {});
        // Check anatomy first
        if (anatomy.vagina || anatomy.pussy) return true;
        // Check gender
        return (gender === "female" || gender === "non-binary");
    };
    
    /**
     * Check if NPC has an anus (most have this, except cloaca species)
     */
    const npcHasAnus = function(npc) {
        if (!npc) return false;
        // Cloaca species have a vent instead of separate anus
        if (typeof getNPCAnatomyType === "function" && getNPCAnatomyType(npc) === "reptilian") {
            return false;
        }
        return true;
    };
    
    /**
     * Check if NPC has a cloaca
     */
    const npcHasCloaca = function(npc) {
        return npcHasCloacaFlag(npc);
    };
    
    /**
     * Check if NPC has a tail
     */
    const npcHasTail = function(npc) {
        if (!npc) return false;
        if (typeof hasNPCTail === "function") return hasNPCTail(npc);
        // Fallback check
        const anatomy = (npc.nsfwTraits && npc.nsfwTraits.anatomy) || (npc.anatomy || {});
        if (anatomy.tail) return true;
        const species = npc.species || "";
        if (typeof getSpeciesTemplate === "function") {
            const template = getSpeciesTemplate(species);
            if (template && template.hasTail) return true;
        }
        return false;
    };
    
    /**
     * Check if player has binding materials (rope or rope belts)
     * Returns true if player has: one full rope, OR two or more rope belts
     */
    const playerHasBindingMaterials = function(player) {
        if (!player || !Array.isArray(player.inventory)) return false;
        
        let fullRopeCount = 0;
        let ropeBeltCount = 0;
        
        for (const item of player.inventory) {
            if (!item || item.hidden || item.isHidden || item.broken || item.ruined) continue;
            if (Array.isArray(item.packed) && item.packed.length) continue;
            
            const id = String(item.id || "").trim().toLowerCase();
            const name = String(item.name || "").trim().toLowerCase();
            
            // Full rope (capacity 2)
            if (id === "rope" || id.indexOf("rope-") === 0 || name === "rope") {
                fullRopeCount++;
            }
            // Rope belt (capacity 1)
            else if (/\brope[\s-]+belt\b/.test(name) || /^rope-belt(?:-|$)/.test(id)) {
                ropeBeltCount++;
            }
        }
        
        // Has at least one full rope, OR at least two rope belts
        return (fullRopeCount >= 1) || (ropeBeltCount >= 2);
    };
    
    // ============================================================================
    // ACTION BORDER COLOR CODING
    // ============================================================================
    
    /**
     * Get border color for an action based on its type/purpose
     * @param {Object} act - The action object
     * @param {Object} entry - The menu entry
     * @param {Object} npc - The NPC for mode checking
     * @returns {string} - CSS color string or null
     */
    const getActionBorderColor = function(act, entry, npc) {
        if (!act) act = getAct(entry.id) || {};
        if (!act) return null;
        
        const actIdLower = (act.id || "").toLowerCase();
        const labelLower = (act.label || "").toLowerCase();
        const target = act.target || "";
        const type = act.type || "";
        
        // Check if this action is available due to Dominant mode bypass
        // In Dominant mode, actions gated by disinhibition are unlocked with red border
        const demeanorMode = (npc && npc.intimacy && npc.intimacy._demeanorMode) 
            ? String(npc.intimacy._demeanorMode).toLowerCase() 
            : "consentual";
        
        if (demeanorMode === "dominant") {
            // Authoritative marker: set by checkActionValidity for whichever
            // gate the dominant bypass actually skipped (disinhibition,
            // arousal, consent, or lube). Red border = "bypassing a normal
            // condition".
            if (act._dominantBypass === true) {
                return "#ff0000"; // Red border for dominant-bypass actions
            }
            // Check if this action would normally be gated by disinhibition
            const _disinhibThreshold = _effectiveActDisinhibitionThreshold(act);
            
            if (_disinhibThreshold > 0 && typeof window !== "undefined" &&
                typeof window.getActDisinhibition === "function" &&
                typeof window.getActionCategory === "function") {
                
                const _catKey = window.getActionCategory(entry.id || act.id, npc);
                let isGated = false;
                
                if (type === ACT_TYPES.WATERSPORT || type === ACT_TYPES.IMPACT) {
                    const _kinkCatKey = _catKey;
                    const _ownScore = (_kinkCatKey && _kinkCatKey !== "Other")
                        ? window.getActDisinhibition(npc, _kinkCatKey)
                        : 0;
                    const maxScore = typeof _getMaxCategoryDisinhibition === "function" 
                        ? _getMaxCategoryDisinhibition(npc) 
                        : 0;
                    if (Math.max(_ownScore, maxScore) < _disinhibThreshold) {
                        isGated = true;
                    }
                } else if (_catKey && _catKey !== "Other") {
                    if (window.getActDisinhibition(npc, _catKey) < _disinhibThreshold) {
                        isGated = true;
                    }
                }
                
                // If this action would be gated but is available due to Dominant mode, use red border
                if (isGated) {
                    return "#ff0000"; // Red border for dominant-bypass actions
                }
            }
        }
        
        // Pussy/Vagina targeted actions (pink)
        if (target === "vagina" || target === "pussy" || target === "clitoris" ||
            actIdLower.includes("pussy") || actIdLower.includes("vagina") ||
            actIdLower.includes("clit") || labelLower.includes("pussy") ||
            labelLower.includes("vagina") || labelLower.includes("clitoris")) {
            return "#ff99cc"; // Pink
        }
        
        // Anal targeted actions (brown)
        if (target === "anus" || target === "butt" || target === "buttocks" || target === "ass" ||
            actIdLower.includes("anal") || actIdLower.includes("anus") ||
            actIdLower.includes("butt") || actIdLower.includes("ass") ||
            labelLower.includes("anal") || labelLower.includes("anus") ||
            labelLower.includes("butt") || labelLower.includes("ass")) {
            return "#8B4513"; // Brown
        }
        
        // Penis/Cock targeted actions (purple)
        if (target === "penis" || target === "cock" ||
            actIdLower.includes("cock") || actIdLower.includes("penis") ||
            actIdLower.includes("dick") || labelLower.includes("cock") ||
            labelLower.includes("penis") || labelLower.includes("dick")) {
            return "#9933ff"; // Purple
        }
        
        // Climax actions (white)
        if (act.triggersClimax || actIdLower.includes("climax") || actIdLower.includes("orgasm") ||
            actIdLower.includes("cum") || actIdLower.includes("ejaculate") ||
            labelLower.includes("climax") || labelLower.includes("orgasm")) {
            return "#ffffff"; // White
        }
        
        // Impact actions (red)
        if (type === ACT_TYPES.IMPACT || actIdLower.includes("slap") || actIdLower.includes("spank") ||
            actIdLower.includes("hit") || actIdLower.includes("smack") ||
            labelLower.includes("slap") || labelLower.includes("spank")) {
            return "#ff0000"; // Red
        }
        
        // Watersports actions (yellow)
        if (type === ACT_TYPES.WATERSPORT || actIdLower.includes("pee") || actIdLower.includes("piss") ||
            actIdLower.includes("urinate") || actIdLower.includes("water") ||
            labelLower.includes("pee") || labelLower.includes("piss")) {
            return "#ffff00"; // Yellow
        }
        
        // Fingering/Tease actions with fingers (green)
        if (type === ACT_TYPES.TEASE &&
            (target === "vagina" || target === "pussy" || target === "anus" ||
             actIdLower.includes("finger") || actIdLower.includes("hand") ||
             labelLower.includes("finger"))) {
            return "#00ff00"; // Green
        }
        
        // Oral/Mouth actions (orange)
        if (target === "mouth" || target === "lips" || actIdLower.includes("mouth") ||
            actIdLower.includes("oral") || actIdLower.includes("kiss") ||
            actIdLower.includes("suck") || actIdLower.includes("blow") ||
            labelLower.includes("mouth") || labelLower.includes("oral") ||
            labelLower.includes("kiss")) {
            return "#ffa500"; // Orange
        }
        
        // General/Other actions (gray or null)
        return null;
    };
    
    // ============================================================================
    // BODY PART SECTION DEFINITION
    // ============================================================================
    
    // Define the new body-part-only sections in order
    const BODY_PART_SECTIONS = [
        { id: "Clothing", label: "Clothing", isSpecial: true, bgColor: "#3a2a1a" },
        { id: "Head", label: "Head", isSpecial: false, bgColor: null },
        { id: "Upper Body", label: "Upper Body", isSpecial: false, bgColor: null },
        { id: "Midsection", label: "Midsection", isSpecial: false, bgColor: null },
        { id: "Lower Body", label: "Lower Body", isSpecial: false, bgColor: null },
        { id: "Requests", label: "Requests", isSpecial: true, bgColor: null }
    ];
    
    // Get menu section: the canonical per-act menuSection field (see
    // intimacy-data-acts.js) is the single source of truth. The fallback
    // below only covers acts that predate the field.
    const getMenuSection = function (entry, npc) {
        const act = getAct(entry.id) || {};
        const actType = act.type || entry.type;
        
        if (act.menuSection) return act.menuSection;
        
        // Fallbacks for acts without a menuSection field
        if (actType === ACT_TYPES.CLOTHING) return "Clothing";
        if (act.playerIsBottom === true || actType === ACT_TYPES.END) return "Requests";
        if (String(act.tool || "").toLowerCase() === "voice") return "Requests";
        
        // Body-zone fallback from the act target
        const TARGET_SECTION = {
            face: "Head", mouth: "Head", lips: "Head", cheek: "Head", neck: "Head", hair: "Head", nose: "Head", ear: "Head", eyes: "Head", head: "Head",
            breasts: "Upper Body", breast: "Upper Body", nipples: "Upper Body", chest: "Upper Body", shoulders: "Upper Body", shoulder: "Upper Body",
            stomach: "Upper Body", belly: "Upper Body", bellybutton: "Upper Body", back: "Upper Body", arms: "Upper Body", arm: "Upper Body", hands: "Upper Body", hand: "Upper Body",
            groin: "Midsection", hips: "Midsection", waist: "Midsection", penis: "Midsection", vagina: "Midsection", pussy: "Midsection", clitoris: "Midsection", clit: "Midsection",
            anus: "Midsection", butt: "Midsection", buttocks: "Midsection", ass: "Midsection", cloaca: "Midsection", tail: "Midsection", testicles: "Midsection", balls: "Midsection", hemipenis: "Midsection",
            thighs: "Lower Body", thigh: "Lower Body", legs: "Lower Body", leg: "Lower Body", feet: "Lower Body", foot: "Lower Body", toes: "Lower Body", toe: "Lower Body"
        };
        const byTarget = TARGET_SECTION[String(act.target || "").toLowerCase()];
        if (byTarget) return byTarget;
        if (actType === ACT_TYPES.PENETRATE) return "Midsection";
        return "Upper Body";
    };


    const sectionedActions = {};
    for (const entry of flatActions) {
        const section = getMenuSection(entry, npc);
        if (!sectionedActions[section]) sectionedActions[section] = [];
        sectionedActions[section].push(entry);
    }

    // Add sections in order, filtering by NPC anatomy and enabled actions
    for (const sectionDef of BODY_PART_SECTIONS) {
        const sectionId = sectionDef.id;
        const sectionLabel = sectionDef.label;
        const isSpecial = sectionDef.isSpecial;
        const bgColor = sectionDef.bgColor;
        
        const actions = sectionedActions[sectionId] || [];
        
        // Always include body part sections (Clothing, Head, Upper Body, Midsection, Lower Body, Requests)
        // even if they have no actions or all actions are disabled
        const isBodyPartSection = ["Clothing", "Head", "Upper Body", "Midsection", "Lower Body", "Requests"].includes(sectionId);
        
        // Hide sections that have no entries at all (neither valid actions
        // nor disabled-with-hint ones): empty tabs are clutter, not
        // information. Sections that only hold disabled entries stay
        // visible so their unlock hints remain reachable through the
        // "Show all" toggle.
        if (!actions || !actions.length) continue;
        
        // For body part sections, check NPC anatomy relevance
        if (isBodyPartSection) {
            // For Midsection, check if NPC has any relevant anatomy
            if (sectionId === "Midsection") {
                const hasRelevantAnatomy = npcHasMidsection(npc) && 
                    (npcHasPenis(npc) || npcHasVagina(npc) || npcHasAnus(npc) || npcHasCloaca(npc) || npcHasTail(npc));
                if (!hasRelevantAnatomy) continue;
            }
        }
        
        // Build the actions with color coding
        const menuActions = actions.map(entry => {
            const act = getAct(entry.id) || {};
            const borderColor = getActionBorderColor(act, entry, npc);
            
            return {
                id: entry.id,
                label: entry.label,
                description: entry.description,
                disabled: entry.disabled,
                disabledHint: entry.disabledHint,
                borderColor: borderColor
            };
        });
        
        // Add rope bondage action to Clothing section if player has binding materials
        if (sectionId === "Clothing" && playerHasBindingMaterials(player)) {
            // Check if NPC is already bound
            const isAlreadyBound = npc.bound && npc.surrendered;
            
            menuActions.push({
                id: "bind_npc_intimacy",
                label: isAlreadyBound ? "NPC is bound" : "Bind NPC with rope",
                description: isAlreadyBound 
                    ? "The NPC is already bound and surrendered to you"
                    : "Use rope or rope belts to bind the NPC, allowing you to do as you please",
                disabled: isAlreadyBound,
                disabledHint: isAlreadyBound ? "NPC is already bound" : null,
                borderColor: "#ff0000" // Red border for bondage action
            });
        }
        
        // Build section object with color info
        const sectionObj = {
            type: "section",
            label: sectionLabel,
            actions: menuActions,
            isSpecial: isSpecial,
            bgColor: bgColor
        };
        
        menu.push(sectionObj);
    }
    
    // Multi-act Continue: with acts engaged in several slots (kissing +
    // fingering + penetration), a single Continue button continues them all
    // (continueAll flag; the engine runs each engaged act). Falls back to
    // the legacy single lastAction continue when nothing is engaged.
    const engagedIds = getEngagedActIds(npc);

    // Add Continue and Pull out/Pull Away buttons if there's a last action
    const lastAction = npc && npc.intimacy && npc.intimacy.lastAction;
    const intimacy = npc.intimacy || {};
    const encounterFlags = intimacy.encounterFlags || {};
    
    // Check if we just pulled out and player is near climax - replace Continue with ejaculation options
    const justPulledOut = encounterFlags.justPulledOut;
    const lastPullOutTarget = encounterFlags.lastPullOutTarget;
    const playerArousal = intimacy.arousal && intimacy.arousal.player ? intimacy.arousal.player : 0;
    const isNearClimax = playerArousal > 70;
    const playerHasPenis = player && player.anatomy && (player.anatomy.penis || player.anatomy.cock);
    
    if (lastAction && lastAction.actId) {
        // Find the action details for the last action
        const allValidActions = generateValidActions(npc, player, positionId);
        const lastActionDetails = allValidActions.find(a => a.actId === lastAction.actId);
        
        if (lastActionDetails) {
            // Check if the last action is still valid for current phase
            const filteredLastAction = filterActionsByPhase([lastActionDetails], phase);
            if (filteredLastAction.length > 0) {
                // Defined in this block so lastActionDetails is in scope for
                // the legacy single-action Continue fallback.
                const pushContinueButton = function () {
                    if (engagedIds.length > 0) {
                        menu.unshift({
                            type: "continue",
                            label: engagedIds.length === 1
                                ? `Continue (${getNaturalLabel(engagedIds[0], npc, player)})`
                                : `Continue (${engagedIds.length} acts)`,
                            actionId: engagedIds[engagedIds.length - 1],
                            continueAll: true,
                            description: engagedIds.length === 1
                                ? `Continue ${getNaturalLabel(engagedIds[0], npc, player)}`
                                : "Continue all engaged acts"
                        });
                        return;
                    }
                    if (!lastAction || !lastAction.actId) return;
                    menu.unshift({
                        type: "continue",
                        label: `Continue (${getNaturalLabel(lastAction.actId, npc, player)})`,
                        actionId: lastAction.actId,
                        description: `Continue ${lastActionDetails.desc || 'the previous action'}`
                    });
                };
                // Check if we should show ejaculation options instead of Continue
                if (justPulledOut && isNearClimax && playerHasPenis) {
                    // Determine which ejaculation options to show based on what was penetrated
                    const ejaculationOptions = [];
                    
                    // Get all valid actions to check if ejaculation actions are available
                    const allValidActionsMap = {};
                    allValidActions.forEach(a => {
                        allValidActionsMap[a.actId] = a;
                    });
                    
                    // Get ejaculation actions for current position
                    const candidateActions = [];
                    if (lastPullOutTarget === "mouth") {
                        // For oral: face, chest, breasts
                        candidateActions.push("ejaculate_on_face", "ejaculate_on_chest");
                        if (npc.anatomy && npc.anatomy.breasts) {
                            candidateActions.push("ejaculate_on_breasts");
                        }
                    } else if (lastPullOutTarget === "anus") {
                        // For anal: ass, pussy (vulva area), stomach
                        candidateActions.push("ejaculate_on_butt", "ejaculate_on_stomach");
                        if (npc.gender && (npc.gender.toLowerCase() === "female" || npc.gender.toLowerCase() === "f")) {
                            candidateActions.push("ejaculate_on_pussy");
                        }
                    } else {
                        // For vaginal or unknown: ass, stomach, pussy
                        candidateActions.push("ejaculate_on_butt", "ejaculate_on_stomach");
                        if (npc.gender && (npc.gender.toLowerCase() === "female" || npc.gender.toLowerCase() === "f")) {
                            candidateActions.push("ejaculate_on_pussy");
                        }
                    }
                    
                    // Check which candidate actions are valid for current position
                    // Use positionId from function parameter, or fall back to intimacy position
                    const checkPosition = positionId || (intimacy.position ? intimacy.position.player : null);
                    
                    candidateActions.forEach(actId => {
                        const act = allValidActionsMap[actId];
                        if (act) {
                            // If the action is already in validActions, it passed position/clothing checks
                            // We just need to verify it's still valid
                            const actDetails = getAct(actId);
                            if (actDetails) {
                                ejaculationOptions.push({
                                    actionId: actId,
                                    label: getNaturalLabel(actId, npc, player),
                                    desc: (typeof getGenderedDesc === "function" && actDetails.desc)
                                        ? getGenderedDesc(actDetails, npc, player)
                                        : (actDetails.desc || "Release on body")
                                });
                            }
                        }
                    });
                    
                    // If we have valid ejaculation options, show them instead of Continue
                    if (ejaculationOptions.length > 0) {
                        // Add ejaculation options at the beginning of the menu
                        ejaculationOptions.forEach(opt => {
                            menu.unshift({
                                type: "continue",
                                label: opt.label,
                                actionId: opt.actionId,
                                description: opt.desc
                            });
                        });
                    } else {
                        // Fall back to Continue button if no ejaculation options are valid
                        pushContinueButton();
                    }
                    
                    // Clear the justPulledOut flag after processing (only once per pull-out)
                    if (encounterFlags.justPulledOut) {
                        delete encounterFlags.justPulledOut;
                        delete encounterFlags.lastPullOutTarget;
                    }
                } else {
                    // Add Continue button at the beginning of the menu
                    pushContinueButton();
                }
                
                // ONE pull-out button, computed from the live penetration
                // state instead of lastAction string matching. Every
                // withdrawal routes through pull_out_generic so there is a
                // single code path (endPenetrationWithNarration) that owns
                // the narration, the post-pull-out climax flags, and the AI
                // enhancement caching - the same treatment penetration gets.
                const livePen = intimacy.penetration;
                if (livePen && livePen.active) {
                    let pullLabel = "Pull Out";
                    let pullDesc = "Withdraw from the current penetration";
                    if (!livePen.playerIsBottom && (livePen.target === "mouth" || livePen.target === "lips")) {
                        pullLabel = "Pull Out of Mouth";
                        pullDesc = "Slip free of their mouth";
                    } else if (livePen.playerIsBottom) {
                        pullLabel = (livePen.tool === "penis" || livePen.tool === "cock") ? "Pull Off" : "Pull Away";
                        pullDesc = "Pull yourself free";
                    }
                    // Pull Away: full act reset WITHOUT ending the
                    // encounter. Engine-side (pull_away_acts) it clears
                    // every engaged act and plays the pull_out_generic
                    // withdrawal narration when the player's penis is
                    // currently inside. Unshifted first so the pull-out
                    // button stays above it in the menu.
                    menu.unshift({
                        type: "end",
                        label: "Pull Away",
                        actionId: "pull_away_acts",
                        description: "Stop all current actions without ending the encounter"
                    });
                    menu.unshift({
                        type: "end",
                        label: pullLabel,
                        actionId: "pull_out_generic",
                        description: pullDesc
                    });
                } else {
                    // Engaged but not penetrated (fingering, receiving
                    // oral, grinding): a full act reset that keeps the
                    // encounter going, plus the session ender.
                    menu.unshift({
                        type: "end",
                        label: "End session",
                        actionId: "stop",
                        description: "Stop and end the intimacy session"
                    });
                    menu.unshift({
                        type: "end",
                        label: "Pull Away",
                        actionId: "pull_away_acts",
                        description: "Stop all current actions without ending the encounter"
                    });
                }
            }
        }
    }

    // Add phase information to menu for UI display
    return {
        menu: menu,
        phase: phase,
        phaseName: getPhaseName(phase),
        isPrivate: room ? isPrivateLocation(room) : false,
        isAlone: room ? isAloneWithTarget(room, npc) : false,
        hasContinue: !!lastAction
    };
}

/**
 * Get hint text for disabled actions
 */
function getDisabledHintText(reason) {
    if (!reason) return "";
    
    const reasonMappings = {
        "unknown action": "(unknown)",
        "no position": "(no position)",
        "clothed": "(clothed)",
        "already nude": "(already nude)",
        "not worn": "(not worn)",
        "wrong gender": "(wrong gender)",
        "prior required": "(requires prior action)",
        "no lube": "(no lube)",
        "not aroused enough": "(she is not ready — more foreplay)",
        "": ""
    };
    
    return reasonMappings[reason] || `(${reason})`;
}

/**
 * Get the minimum phase required for an action
 */
function getMinimumPhaseForAction(actId) {
    const act = getAct(actId);
    if (!act) return INTIMACY_PHASES.SOCIAL;
    
    // Climax actions require intimate phase
    if (act.triggersClimax) return INTIMACY_PHASES.INTIMATE;
    
    // Penetration requires private phase minimum
    if (act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE) {
        return INTIMACY_PHASES.PRIVATE;
    }
    
    // Clothing removal requires private phase
    if (act.type === ACT_TYPES.CLOTHING) return INTIMACY_PHASES.PRIVATE;

    // Watersports require intimate phase (deep intimacy established)
    if (act.type === ACT_TYPES.WATERSPORT) return INTIMACY_PHASES.INTIMATE;

    // Tease actions require private phase
    if (act.type === ACT_TYPES.TEASE) return INTIMACY_PHASES.PRIVATE;
    
    // Default to social
    return INTIMACY_PHASES.SOCIAL;
}

/**
 * Get readable phase name
 */
function getPhaseName(phase) {
    const names = {
        [INTIMACY_PHASES.SOCIAL]: "Social",
        [INTIMACY_PHASES.PRIVATE]: "Private",
        [INTIMACY_PHASES.INTIMATE]: "Intimate"
    };
    return names[phase] || "Unknown";
}

// ============================================================================
// LUBE SYSTEM
// ============================================================================

/**
 * Add lube to a specific body part
 * @param {Object} npc - The NPC
 * @param {string} bodyPart - The body part (vagina, anus, mouth, general)
 * @param {number} amount - Amount of lube to add (default: 100)
 */
function addLube(npc, bodyPart = "general", amount = 100) {
    if (!npc || !npc.intimacy) return false;
    
    // Initialize lube tracking if not present
    if (!npc.intimacy.lube) {
        npc.intimacy.lube = {
            vagina: { hasLube: false, level: 0 },
            anus: { hasLube: false, level: 0 },
            mouth: { hasLube: false, level: 0 },
            general: { hasLube: false, level: 0 }
        };
    }
    
    const part = npc.intimacy.lube[bodyPart];
    if (!part) return false;
    
    part.hasLube = true;
    part.level = Math.min(100, part.level + amount);
    
    // Update legacy global lube for backwards compatibility
    npc.intimacy.hasLube = true;
    npc.intimacy.lubeLevel = Math.min(100, npc.intimacy.lubeLevel + amount);
    
    console.log(`[Intimacy] Added lube to ${bodyPart}. Level: ${part.level}`);
    return true;
}

/**
 * Use lube from a specific body part (consume some)
 * @param {Object} npc - The NPC
 * @param {string} bodyPart - The body part (vagina, anus, mouth, general)
 * @param {number} amount - Amount of lube to use (default: 10)
 */
function useLube(npc, bodyPart = "general", amount = 10) {
    if (!npc || !npc.intimacy || !npc.intimacy.lube) return false;
    
    const part = npc.intimacy.lube[bodyPart];
    if (!part || !part.hasLube) return false;
    
    part.level = Math.max(0, part.level - amount);
    
    if (part.level <= 0) {
        part.hasLube = false;
    }
    
    // Update legacy global lube
    npc.intimacy.lubeLevel = Math.max(0, npc.intimacy.lubeLevel - amount);
    if (npc.intimacy.lubeLevel <= 0) {
        npc.intimacy.hasLube = false;
    }
    
    console.log(`[Intimacy] Used lube from ${bodyPart}. Level: ${part.level}`);
    return true;
}

/**
 * Handle natural lubrication accumulation
 * Adds lube based on arousal levels and direct stimulation:
 * - Vaginal: Self-lubrication from arousal (precum mechanics) and direct stimulation
 * - Anal: Does NOT self-lubricate (per user requirement)
 * - Mouth: Always considered lubricated (saliva)
 * 
 * Natural lube thresholds:
 * - Vagina: Starts at 30% arousal, increases with arousal level
 * - Direct vaginal stimulation: Adds extra lube faster
 */
function handleNaturalLubrication(npc, act) {
    if (!npc || !npc.intimacy || !npc.intimacy.arousal) return;
    
    const intimacy = npc.intimacy;
    const npcArousal = intimacy.arousal.npc || 0;
    
    // Ensure lube object and all its properties exist
    if (!intimacy.lube) {
        intimacy.lube = {};
    }
    
    // Initialize each lube part if missing
    const lubeParts = ["vagina", "anus", "mouth", "general"];
    for (const part of lubeParts) {
        if (!intimacy.lube[part]) {
            intimacy.lube[part] = { hasLube: false, level: 0 };
        }
    }
    
    // Mouth is always lubricated (saliva) - no need to track
    // Mark it as having lube if not already set
    if (!intimacy.lube.mouth.hasLube) {
        addLube(npc, "mouth", 100);
    }
    
    // VAGINAL NATURAL LUBRICATION
    // Self-lube from arousal (precum mechanics)
    // Starts at 30% of orgasm threshold (240/800)
    const VAGINAL_LUBE_THRESHOLD = 240;  // 30% of 800
    const MAX_NATURAL_VAGINAL_LUBE = 80; // Can accumulate up to 80 from arousal alone
    
    // Check if vaginal lube needs updating based on arousal
    if (!intimacy.lube.vagina.hasLube || intimacy.lube.vagina.level < MAX_NATURAL_VAGINAL_LUBE) {
        if (npcArousal >= VAGINAL_LUBE_THRESHOLD) {
            // Calculate lube amount based on arousal level
            // 240-400: 20-40 lube
            // 400-600: 40-60 lube  
            // 600-800: 60-80 lube
            let naturalLube = 0;
            if (npcArousal >= 600) {
                naturalLube = 80;
            } else if (npcArousal >= 400) {
                naturalLube = 40 + Math.floor((npcArousal - 400) / 200 * 40);
            } else if (npcArousal >= 240) {
                naturalLube = Math.floor((npcArousal - 240) / 160 * 40);
            }
            
            // Only update if we have more lube to add
            if (naturalLube > intimacy.lube.vagina.level) {
                addLube(npc, "vagina", naturalLube - intimacy.lube.vagina.level);
            }
        }
    }
    
    // DIRECT VAGINAL STIMULATION - adds extra lube faster
    // Teasing/fingering/rubbing the vagina/pussy/clitoris adds lube
    if (act && !act.playerIsBottom) { // Player is the actor
        const target = (act.target || "").toLowerCase();
        const isVaginalStimulation = target === "vagina" || target === "pussy" || 
                                     target === "clitoris" || target === "clit";
        
        // Don't add for penetration acts (they consume lube, don't add it)
        const isPenetration = act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE;
        
        if (isVaginalStimulation && !isPenetration) {
            // Add lube based on action intensity
            const arousalGain = (act.arousal && act.arousal.n) || 0;
            // More intimate actions add more lube
            let lubeToAdd = Math.floor(arousalGain / 5); // 5 arousal = 1 lube
            if (lubeToAdd > 0) {
                addLube(npc, "vagina", lubeToAdd);
            }
        }
    }
    
    // ANAL DOES NOT SELF-LUBRICATE per user requirement
    // Anal lube must come from explicit actions (licking, spitting, etc.)
}

/**
 * Check if lube is available for a specific body part
 * @param {Object} npc - The NPC
 * @param {string} bodyPart - The body part (vagina, anus, mouth, general, or any)
 */
function hasLube(npc, bodyPart = "any") {
    if (!npc || !npc.intimacy) return false;
    
    // Check specific body part
    if (bodyPart !== "any" && bodyPart !== "general") {
        const part = npc.intimacy.lube && npc.intimacy.lube[bodyPart];
        if (part) {
            return part.hasLube && part.level > 0;
        }
        return false;
    }
    
    // Legacy global check
    if (npc.intimacy.hasLube && npc.intimacy.lubeLevel > 0) {
        return true;
    }
    
    // Check any part has lube
    if (npc.intimacy.lube) {
        for (const partName in npc.intimacy.lube) {
            const part = npc.intimacy.lube[partName];
            if (part.hasLube && part.level > 0) {
                return true;
            }
        }
    }
    
    return false;
}

// ============================================================================
// POSITION CHANGE
// ============================================================================

/**
 * Change position
 */
function changePosition(npc, player, newPositionId, options = {}) {
    if (!npc || !npc.intimacy) return { success: false, error: "No intimacy state" };
    if (!hasPosition(newPositionId)) return { success: false, error: "Invalid position" };

    // A non-resisting NPC (unconscious/sleeping) can only be placed into
    // positions the player can physically arrange a limp body into —
    // lying/receiving "bottom" positions, never standing, kneeling, or
    // NPC-on-top positions where the NPC would have to support itself.
    if (npcCannotSpeak(npc) && typeof isPositionPlaceableForNonResisting === "function"
        && !isPositionPlaceableForNonResisting(newPositionId)) {
        return { success: false, error: "A non-resisting NPC cannot be placed in that position" };
    }

    // Ensure position object exists
    if (!npc.intimacy.position) {
        npc.intimacy.position = {
            player: DEFAULT_POSITION,
            npc: DEFAULT_POSITION
        };
    }
    
    const oldPosition = npc.intimacy.position.player;
    const oldPositionObj = getPosition(oldPosition);
    const newPositionObj = getPosition(newPositionId);
    
    // Store old position for narration
    const positionChangeInfo = {
        oldPosition: oldPosition,
        oldPositionLabel: oldPositionObj ? oldPositionObj.label || oldPosition : oldPosition,
        newPosition: newPositionId,
        newPositionLabel: newPositionObj ? newPositionObj.label || newPositionId : newPositionId
    };
    
    // Check if penetration is active - if so, need to pull out before changing position
    const wasPenetrating = npc.intimacy.penetration && npc.intimacy.penetration.active;
    
    if (wasPenetrating) {
        // End current penetration with pull-out narration
        const pullOutNarrative = endPenetrationWithNarration(npc, player, npc.intimacy, "position change");
        if (pullOutNarrative) {
            positionChangeInfo.pullOutNarrative = pullOutNarrative;
            positionChangeInfo.penetrationEnded = true;
            console.log(`[Intimacy] Auto-pulled out before position change`);
        }
    }

    npc.intimacy.position.player = newPositionId;
    npc.intimacy.position.npc = newPositionId;
    
    // Clear last action so the next action after position change doesn't
    // build a transition narration referencing the pre-change action.
    // Position change also resets every engaged act (multi-act slots) —
    // kissing, fingering etc. all stop when the bodies move.
    npc.intimacy.engagedActs = [];
    npc.intimacy.lastAction = null;
    
    // Clear LLM enhancement cache on position change
    clearLLMEnhancementCache(npc.intimacy);
    
    console.log(`[Intimacy] Position changed from ${oldPosition} to ${newPositionId}`);
    
    // Check if new position supports the current tool (for edge cases where penetration wasn't cleared)
    const position = getPosition(newPositionId);
    if (position && npc.intimacy.penetration && npc.intimacy.penetration.actId) {
        const act = getAct(npc.intimacy.penetration.actId);
        if (act && !position.validTools.includes(act.tool)) {
            // Position doesn't support the tool - ensure penetration is inactive
            npc.intimacy.penetration.active = false;
            positionChangeInfo.penetrationEnded = true;
            console.log(`[Intimacy] Penetration not supported in new position`);
        }
    }
    
    return { success: true, ...positionChangeInfo };
}

/**
 * End penetration with proper pull-out narration
 * Called when switching positions or orifices
 */
function endPenetrationWithNarration(npc, player, intimacy, reason = "transition", options = {}) {
    if (!intimacy || !intimacy.penetration || !intimacy.penetration.active) {
        return null;
    }

    const penetration = intimacy.penetration;
    const tool = penetration.tool || "unknown";
    const target = penetration.target || "unknown";
    const playerIsBottom = penetration.playerIsBottom || false;
    const depth = penetration.depth || 0;

    // Tool classification: the elaborate pull-out-of-orifice prose is
    // penis-only. Finger/tongue/pussy withdrawals get short, tool-accurate
    // lines instead - narrating a cock where none is involved reads as a
    // false penetration flag.
    var _toolLower = String(tool).toLowerCase();
    var _toolIsPenis = _toolLower === "penis" || _toolLower === "cock" || _toolLower === "dick";
    var _toolIsPlural = _toolLower === "fingers";
    var _vSlides = _toolIsPlural ? "slide" : "slides";
    var _vPulls = _toolIsPlural ? "pull" : "pulls";
    var _vWithdraws = _toolIsPlural ? "withdraw" : "withdraws";
    var _vSlips = _toolIsPlural ? "slip" : "slips";
    var _vDrags = _toolIsPlural ? "drag" : "drags";

    // Arm the post-pull-out flow: near-climax players get the
    // ejaculation options (face/chest/pussy) instead of a bare Continue.
    // This used to be set only by the legacy pull_out act path, so the
    // generic act never triggered it - the pull-out "wasn't respected".
    if (!intimacy.encounterFlags) intimacy.encounterFlags = {};
    intimacy.encounterFlags.justPulledOut = true;
    intimacy.encounterFlags.lastPullOutTarget = (target === "mouth" || target === "lips") ? "mouth" : target;

    // Remember what was just withdrawn from, so the scene-portrait
    // aftermath (fluids, gaping ring, penis outside) stays available after
    // the pull-out. Cleared when a new penetration starts or the encounter
    // ends.
    intimacy.lastPenetration = { tool: tool, target: target, at: Date.now() };

    // Clear the live penetration state up front; the narration below
    // works from the captured values.
    intimacy.penetration.active = false;
    intimacy.penetration.tool = null;
    intimacy.penetration.target = null;
    intimacy.penetration.depth = 0;

    // The caller already has narration (cached AI version): do the
    // state bookkeeping only.
    if (options.narrative) {
        if (intimacy.lastAction && intimacy.lastAction.actId) {
            delete intimacy.lastAction.actId;
        }
        return options.narrative;
    }

    const posPronoun = typeof getPossessivePronoun === 'function' ? getPossessivePronoun(npc) : "their";
    const subjPronoun = (typeof getSubjectPronoun === "function" ? getSubjectPronoun(npc) : "She") || "She";
    const subjLower = subjPronoun.toLowerCase();

    // Withdrawal feel - the same size/fit sources the penetration
    // flavor uses, plus how deep the act went. A big cock in a tight
    // hole fights its way out; a slender one slips free; a shallow dip
    // never leaves a gape; a bottomed-out pull might.
    var fit = (!playerIsBottom && player && typeof getPenetrationFit === "function") ? getPenetrationFit(player, npc, target) : "";
    var isDeep = depth >= 4;
    var isShallow = depth <= 2;
    var climaxState = intimacy.climax || {};
    var hasCreampie = !!(climaxState.hasInternalEjaculation && climaxState.lastInternalEjaculation === target);
    // The leaking load leaves a persistent puddle in the room (oral
    // loads are swallowed, not dripped - no mess for those).
    if (hasCreampie && target !== "mouth" && typeof G !== "undefined" && G.activeRoom) {
        addRoomMess(G.activeRoom, "semen");
    }
    var analCum = (intimacy.encounterFlags && intimacy.encounterFlags.analEjaculationCount) || 0;

    var pullOutNarrative = null;

    if (playerIsBottom) {
        // ── PLAYER RECEIVES: the NPC's tool withdraws from the player ──
        if (target === "vagina" || target === "pussy") {
            pullOutNarrative = pickRandom([
                `${posPronoun} ${tool} ${_vSlides} out of your pussy, the sudden emptiness leaving you gasping.`,
                `You lift yourself off ${posPronoun} ${tool}, your slick folds clinging as you pull free.`,
                `${posPronoun} ${tool} ${_vWithdraws} from you with a wet sound, leaving your pussy flushed and wanting.`,
                isDeep ? `${posPronoun} ${tool} ${_vDrags} out of you inch by inch, your walls gripping the whole long way before finally letting go.` : `${posPronoun} ${tool} ${_vSlips} free with ease, your body barely marking that it was there.`
            ]);
        } else if (target === "anus" || target === "ass") {
            pullOutNarrative = pickRandom([
                `${posPronoun} ${tool} ${_vPulls} out of your ass, the ring of muscle clenching shut behind it.`,
                `You pull yourself off ${posPronoun} ${tool}, your stretched hole slowly puckering closed.`,
                `${posPronoun} ${tool} ${_vWithdraws} from you, leaving a lingering ache${isDeep ? " and a gape that slowly closes" : " and a tightness that snaps quickly shut"}.`
            ]);
        } else if (target === "mouth" || target === "lips") {
            pullOutNarrative = pickRandom([
                `${posPronoun} ${tool} ${_vSlips} from your mouth, a strand of saliva briefly connecting you.`,
                `You release ${posPronoun} ${tool} from your lips, taking a deep breath.`,
                `${posPronoun} ${tool} ${_vPulls} free from your mouth, leaving the taste lingering.`
            ]);
        } else {
            pullOutNarrative = `${posPronoun} ${tool} ${_vPulls} out from you.`;
        }
    } else {
        // ── PLAYER PENETRATES: the player's tool withdraws from the NPC ──
        if (!_toolIsPenis) {
            // Non-penis tools (fingers, tongue, pussy on a face): a brief,
            // tool-accurate withdrawal. The cock-framed pull-out-of-orifice
            // templates below (crown, shaft, fit, gape) describe a penis and
            // must not play for other tools.
            if (target === "vagina" || target === "pussy") {
                pullOutNarrative = pickRandom([
                    `You ease your ${tool} out of ${posPronoun} pussy, her hot, tight grip easing as you withdraw.`,
                    `You slip your ${tool} free of ${posPronoun} slick folds, leaving her flushed and empty.`,
                    `You draw your ${tool} back out of ${posPronoun} slowly, her hips chasing you for one more moment before settling.`
                ]);
                if (hasCreampie) {
                    pullOutNarrative += pickRandom([
                        ` A slow trickle of your earlier load follows your ${tool} out, dribbling down toward her ass.`,
                        ` Her entrance flutters as you withdraw, squeezing a thin ribbon of your earlier load out after your ${tool}.`
                    ]);
                }
            } else if (target === "anus" || target === "ass") {
                pullOutNarrative = pickRandom([
                    `You slip your ${tool} out of ${posPronoun} ass, the tight ring of muscle cinching shut behind it.`,
                    `You withdraw your ${tool} from ${posPronoun} depths, and ${subjLower} exhales as the stretch eases.`
                ]);
            } else if (target === "mouth" || target === "lips") {
                // Riding a face and similar: the NPC's mouth/tongue was
                // serving the player's tool - the giver is the passive party.
                pullOutNarrative = pickRandom([
                    `You lift yourself away from ${posPronoun} mouth, and ${subjLower} pulls back, lips and chin glistening, giving you one last slow lick.`,
                    `You ease your ${tool} back from ${posPronoun} mouth; ${subjLower} gasps for breath, tongue trailing off, and presses a parting kiss to your inner thigh.`,
                    `You rise off of ${subjLower}, the wet warmth of ${subjPronoun.toLowerCase() === "she" ? "her" : "their"} mouth leaving you cool and aching in the open air.`
                ]);
            } else {
                pullOutNarrative = `You withdraw your ${tool} from ${posPronoun} ${target}.`;
            }
        } else if (target === "vagina" || target === "pussy") {
            if (fit === "resistance") {
                pullOutNarrative = pickRandom([
                    isDeep
                        ? `You drag your ${tool} out of ${posPronoun} tight pussy a slow inch at a time, the grip clinging to every ridge of you. ${posPronoun[0].toUpperCase() + posPronoun.slice(1)} rim stretches around your crown, resists, then releases with a soft pop, and ${subjLower} trembles as her hole flutters hard, trying to close.`
                        : `You pull back, but ${posPronoun} snug entrance grips your crown, reluctant to let it go. One firm draw pops you free, and ${subjLower} clenches shut almost immediately behind you with a small, startled sound.`
                    ,
                    `Your ${tool} fights its way out of ${posPronoun} - the wet heat drags at your shaft the whole way, and when the head finally tugs loose, ${subjLower} winks shut around nothing, flushed and swollen.`
                ]);
            } else if (fit === "easy") {
                pullOutNarrative = pickRandom([
                    isDeep
                        ? `Your ${tool} slides from ${posPronoun} well-practiced depths with barely any resistance at all, the warmth peeling away until you slip free. ${subjPronoun} gives one soft, satisfied clench in your wake, barely disturbed.`
                        : `You slip out of ${posPronoun} easily, barely a wet sound marking your exit. ${subjPronoun} settles warm and loose as you withdraw, her body barely acknowledging the loss.`
                ]);
            } else {
                pullOutNarrative = pickRandom([
                    `You pull out from ${posPronoun} pussy inch by inch, the wet folds clinging to your ${tool} the whole way. The rim of your crown drags at her entrance on the way out, then slips free with a soft, wet sound, and her lips slowly press back together.`,
                    `You slide your ${tool} free from ${posPronoun} slick depths one slow inch at a time, letting her feel every ridge of your withdrawal. A string of arousal briefly connects you to her entrance before it snaps, and her pussy flutters at the sudden emptiness.`,
                    isShallow
                        ? `You draw out of ${posPronoun}, having barely breached her - her flushed lips part around your tip and then settle closed again, warm and slick and nearly unchanged.`
                        : `You ease your ${tool} out from where it was buried, her swollen lips hugging your shaft from base to tip on the long slide out. The head tugs free with a quiet squelch, and her well-stretched entrance slowly settles closed, flushed and slick.`
                ]);
            }
            if (hasCreampie) {
                pullOutNarrative += pickRandom([
                    ` The moment you slip free, a thick trickle of cum dribbles from ${posPronoun} well-used pussy, running down her inner thigh. ${subjPronoun} shivers at the sudden gush.`,
                    ` Her pussy clamps down as you pull out, squeezing a slow ribbon of your load out after your cock - it drools down her folds while ${subjLower} whimpers at the loss.`,
                    ` Cum leaks from her entrance as you withdraw, the slick mess pooling beneath her and dripping slowly down her legs.`,
                    ` Your crown pops free and her hole winks once, pushing out a warm glob of your seed that slides wetly toward her ass.`,
                    fit === "resistance"
                        ? ` Her snug walls keep their grip even as you leave - your load stays mostly plugged, only a thin thread escaping down her folds as her hole twitches around the emptiness.`
                        : ` The withdrawal unstoppers her - your load seeps out in a lazy, obscene gush, frothing lightly where your cock left it.`
                ]);
            }
        } else if (target === "anus" || target === "ass") {
            // Gape is EARNED, not automatic: a deep withdrawal, a size
            // mismatch, or a big load make it likely; a shallow or easy
            // exit closes fast.
            var gapeChance = (isDeep ? 0.45 : 0.15) + (fit === "resistance" ? 0.25 : 0) + (fit === "stretched" ? 0.15 : 0) + (analCum >= 3 ? 0.15 : 0);
            var leavesGape = Math.random() < Math.min(gapeChance, 0.85);
            var gapeDesc = leavesGape
                ? pickRandom([
                    ` The loosened ring stays open a moment - a round gape that clenches in weak twitches as it slowly remembers its shape.`,
                    ` Her sphincter is left open, puffy and slack, winking each time it tries to pucker shut.`,
                    ` A gape remains where you were, the stretched rim quivering in the open air before it finally begins to close.`
                ])
                : ((isDeep || fit === "resistance" || fit === "stretched")
                    ? pickRandom([
                        ` Her hole snaps shut behind you, tight again almost at once.`,
                        ` The ring cinches closed immediately, winking once as if in apology.`
                    ])
                    : pickRandom([
                        ` Her hole snaps shut behind you, tight again almost at once.`,
                        ` The ring cinches closed immediately, winking once as if in apology.`,
                        ` Her entrance puckers back to normal within a heartbeat, barely marked by your visit.`
                    ]));
            if (fit === "resistance") {
                pullOutNarrative = pickRandom([
                    `You drag your ${tool} out of ${posPronoun} tight ass a stubborn inch at a time, the ring gripping you like a fist the whole way. The crown stretches her rim wide, holds, then pops loose with an audible release.`,
                    `${posPronoun[0].toUpperCase() + posPronoun.slice(1)} ass fights your exit - the muscle drags along your shaft, refusing to let go, until you wrench the head free and her hole clenches hard at the sudden emptiness.`
                ]) + gapeDesc;
            } else if (fit === "easy") {
                pullOutNarrative = pickRandom([
                    `Your ${tool} slides from ${posPronoun} relaxed, practiced ass with almost no resistance at all - her body simply lets you go, the heat peeling away around your shaft until you are free.`,
                    `You withdraw from her loose hole in one smooth pull; she is so soft around you that you glide out, and her ass settles warm and slack in your wake.`
                ]);
            } else {
                pullOutNarrative = pickRandom([
                    `You pull out from ${posPronoun} anus inch by inch, the stretched ring gripping your ${tool} on the whole slow ride out. The swollen rim clings to your crown, stretches, then releases it with a soft pop.`,
                    `You withdraw your ${tool} from her depths one careful inch at a time, the friction-heat sliding off you in layers. Her ring grips and cinches as each inch clears it, the drag along your length almost burning, and when the head finally tugs free, the muscle clamps shut behind you.`,
                    isShallow
                        ? `You ease out of ${posPronoun} ass after only the first few inches - her rim drags lightly at your crown, then puckers quickly closed as you go.`
                        : `You drag your ${tool} back out of the depths you had reached, her rim stretched wide and clinging the entire way until the crown pops loose at last.`
                ]) + gapeDesc;
            }
            // ── CUM OVERFLOW: messy release scaled by volume ──
            if (analCum >= 10) {
                pullOutNarrative += pickRandom([
                    ` The moment you pull free, a flood of cum gushes from her gaping hole, thick rivers of it running down her thighs and pooling on the floor below. ${subjPronoun} groans, her stomach visibly distended from the sheer volume inside her.`,
                    ` Cum pours out of her ruined ass in thick, white streams, splattering the ground beneath. Her belly is rounded and swollen with the load you have left inside. ${subjPronoun} whimpers, barely able to stay upright.`
                ]);
            } else if (analCum >= 5) {
                pullOutNarrative += pickRandom([
                    ` As you withdraw, a thick stream of cum dribbles from her stretched hole, running down her thighs. ${subjPronoun} lets out a shaky breath. "So full..."`,
                    ` Your cum leaks from her loosened sphincter in a steady trickle, pooling between her legs. ${subjPronoun} shivers, bowels full and heavy with your load.`
                ]);
            } else if (analCum >= 2) {
                // Well-bred hole: two-plus loads come back out in a
                // messy gush - the regular pull-out earns its filthy
                // finish, with variations.
                pullOutNarrative += pickRandom([
                    ` The moment you pull free, ${posPronoun} well-bred ass gives the loads back — a thick, glutting squirt that splatters ${posPronoun} cheeks and thighs, followed by cum bubbling out in loud, wet gurgles as the loosened ring fails to clench shut.`,
                    ` Your withdrawal unstoppers ${posPronoun}: the packed loads escape in one obscene gush, streaking ${posPronoun} crack, and ${subjLower} groans as the mess keeps coming — bubbling and farting lewdly out of ${posPronoun} overworked rim.`,
                    ` Cum follows your cock out in ropes, then in a flood — ${posPronoun} puffy rim twitching uselessly as the overflow pools beneath ${posPronoun}, and ${subjLower} can only moan at the wet, obscene sounds of it draining.`,
                    ` Her ass surrenders the loads in messy waves — first a hot squirt across the bedding, then a slow, bubbling ooze that keeps coming long after you are out, leaving a soiled puddle beneath ${posPronoun} hips.`,``
                ]);
            } else if (hasCreampie) {
                var anusAnat = (npc.anatomy && npc.anatomy.anus) || {};
                var isTightAnus = ["tight", "snug"].indexOf(anusAnat.size) !== -1;
                var isLooseAnus = ["loose", "gaping", "stretchy"].indexOf(anusAnat.size) !== -1;
                if (isTightAnus) {
                    pullOutNarrative += pickRandom([
                        ` Her tight ring clamps shut the instant you clear it - your seed stays mostly plugged inside, only a stubborn bead of cum squeezing free as the muscle twitches.`,
                        ` The clench of her snug hole squeezes a thin squirt of your cum out after you, with a soft, lewd sound that colors her cheeks.`
                    ]);
                } else if (isLooseAnus) {
                    pullOutNarrative += pickRandom([
                        ` Cum drools out of her relaxed hole freely the moment you leave, a lazy white ribbon sliding down toward her pussy.`,
                        ` With nothing left plugging her, your load bubbles and squelches out of her loosened ass in slow globs.`
                    ]);
                } else {
                    pullOutNarrative += pickRandom([
                        ` A trickle of your seed escapes her hole as it closes, running warm down her skin.`,
                        ` As you slip free, a modest dribble of cum follows your cock out, marking her rim before it drips away.`
                    ]);
                }
            }
            // ── CLOACA WORDING ──
            // Cloaca-bearing NPCs have a single vent instead of a separate
            // anus: swap the mammalian anal nouns for vent wording on the
            // finished narrative. "Ring" stays - the vent has a muscular
            // ring too.
            if (npcHasCloacaFlag(npc)) {
                pullOutNarrative = String(pullOutNarrative)
                    .replace(/\b(ass|anus|hole|rim|entrance|sphincter|crack|bowels)\b/g, "vent");
            }
        } else if (target === "mouth" || target === "lips") {
            // ── ORAL PULL-OUT: the giver is the active party. She
            // controls the release - working the last inches, deciding
            // when to let go, and often chasing the cock for one last
            // taste. ──
            pullOutNarrative = pickRandom([
                `${subjPronoun} decides when you are done: she works the last few inches with slow, sucking pulls, then finally lets your ${tool} slip from her lips. A bridge of saliva swings and breaks; she gasps, mouth shining, and presses a parting kiss to the tip.`,
                `You draw back, but ${subjLower} follows an inch before releasing you - her cheeks hollow around the head, and then your ${tool} pops from her mouth, trailing strings of spit that snap against her chin. She looks up at you, lips swollen and slick, breathing hard.`,
                `${subjPronoun} releases you one taste at a time: a slow pull to the crown, a swirl of her tongue across the tip, and then she lets your cock bob free in the cool air, her breath hot on the wet skin while she watches your face.`,
                `${subjPronoun} gives you one last bob, deep and deliberate, then draws off with a wet gasp - saliva strands clinging from her lower lip to your shaft before they break. She steadies your ${tool} with two fingers, plants a soft, wet kiss on the head, and lets her hand fall away.`
            ]);
            if (hasCreampie) {
                pullOutNarrative += pickRandom([
                    ` Her mouth is still brimming with your load when she lets you go - she holds your gaze as she works it over her tongue, then swallows with an exaggerated, satisfied gulp.`,
                    ` As you slip free, cum strings from her lips to your crown; she catches it with two fingers and licks them clean, cheeks hollowing shamelessly.`,
                    ` The withdrawal spills some of your seed past her lips - a white trickle runs down her chin, and she wipes it with her thumb before sucking the thumb dry.`,
                    ` She releases your cock with a gasp, keeps the load in her mouth, and tilts her head back to show it to you before swallowing. "All of it," she murmurs, throat working.`
                ]);
            }
        } else {
            pullOutNarrative = `You withdraw from ${posPronoun} ${target}.`;
        }
    }

    // Clear the act tracking
    if (intimacy.lastAction && intimacy.lastAction.actId) {
        delete intimacy.lastAction.actId;
    }

    return pullOutNarrative;
}

/**
 * Capture the withdrawal context before the penetration state is
 * cleared: fit, depth, and creampie presence feed both the canned
 * narration and the AI enhancement prompt.
 */
function buildPullOutSnapshot(npc, player, intimacy) {
    var p = (intimacy && intimacy.penetration) || {};
    return {
        tool: p.tool || "penis",
        target: p.target || "",
        playerIsBottom: !!p.playerIsBottom,
        depth: p.depth || 0,
        // Fit is a player-cock-vs-orifice comparison; it is meaningless
        // (and misdescribes the withdrawal) for fingers/tongue tools.
        fit: (!p.playerIsBottom && (String(p.tool || "").toLowerCase() === "penis" || String(p.tool || "").toLowerCase() === "cock" || String(p.tool || "").toLowerCase() === "dick") && typeof getPenetrationFit === "function") ? getPenetrationFit(player, npc, p.target) : "",
        hasCreampie: !!(intimacy && intimacy.climax && intimacy.climax.hasInternalEjaculation && intimacy.climax.lastInternalEjaculation === p.target)
    };
}

/**
 * Build the AI prompt for polishing a withdrawal beat. The canned
 * endPenetrationWithNarration text is the base; the AI re-authors it
 * with the same color/size/fit facts the penetration prompts use.
 */
function buildPullOutPrompt(npc, player, intimacy, position, snapshot, baseNarrative) {
    var posPronoun = (typeof getPossessivePronoun === "function") ? getPossessivePronoun(npc) : "their";
    var target = snapshot.target || "vagina";
    var targetLabel = (target === "vagina" || target === "pussy") ? "pussy" :
        (target === "anus" || target === "ass") ? "ass" :
        (target === "mouth" || target === "lips") ? "mouth" : target;
    var lines = [];
    var _toolIsPenis = ["penis", "cock", "dick"].indexOf(String(snapshot.tool || "").toLowerCase()) !== -1;
    if (_toolIsPenis && !snapshot.playerIsBottom && player && player.anatomy) {
        var size = (typeof getPlayerCockSize === "function") ? getPlayerCockSize(player) : "medium";
        var color = (typeof getPlayerCockColorWord === "function") ? getPlayerCockColorWord(player) : "";
        if (size !== "medium" || color) {
            lines.push("- The player's cock: " + (size === "large" ? "large and thick" : size === "small" ? "small and slender" : "average-sized") + (color ? ", " + color + "-skinned" : "") + ". Name its size and color when it appears in the narration.");
        }
    }
    var skin = (typeof getNPCSkinFlavorWords === "function") ? getNPCSkinFlavorWords(npc) : null;
    if (skin && skin.color) {
        lines.push("- The NPC's skin: " + skin.color + (skin.texture ? ", " + skin.texture : "") + ". Mention their skin when their body is described.");
    }
    if (_toolIsPenis && snapshot.fit) {
        var fitDesc = snapshot.fit === "resistance" ? "the orifice is small relative to the player's girth - the withdrawal drags, clings, and ends with a pop" :
            snapshot.fit === "stretched" ? "the player's girth stretched the orifice open - it closes slowly" :
            "the orifice is roomy relative to the player's slender cock - the withdrawal is easy and it closes right up";
        lines.push("- Fit: " + fitDesc + ".");
    }
    lines.push("- Depth before withdrawal: " + (snapshot.depth >= 4 ? "bottomed out / very deep" : snapshot.depth >= 3 ? "deep" : "shallow - only the first inches were inside") + ".");
    if (snapshot.hasCreampie) {
        lines.push("- The player ejaculated inside this " + targetLabel + " earlier: describe the aftermath leaving it - a trickle, a gush, a winking push-out, the mess following you out.");
    }
    var flavorBlock = lines.length ? "\nFACTS:\n" + lines.join("\n") : "";
    return "You are polishing a WITHDRAWAL beat in a sex scene in a text adventure game.\n" +
        "The player is pulling their " + (snapshot.tool || "cock") + " out of " + (npc && npc.name ? npc.name : "the NPC") + "'s " + targetLabel + "." + (npc && npc.species ? " The NPC is a " + npc.species + "." : "") + "\n" +
        "BASE NARRATIVE (the FACTS of this beat - take the facts, not the phrasing):\n" +
        "\"" + baseNarrative + "\"" + flavorBlock + "\n" +
        "INSTRUCTIONS:\n" +
        (!_toolIsPenis
            ? "- The tool being withdrawn is the player's " + (snapshot.tool || "body part") + " - NOT a penis. Never mention a cock or use cock phrasing (crown, shaft, head). Describe the " + (snapshot.tool || "body part") + " withdrawing, and the orifice closing around the space it leaves.\n"
            : "") +
        "- Rewrite the base narrative as clean novel prose in second person (\"You...\"). Three to five sentences.\n" +
        "- The withdrawal must respect the physical FACTS above: a size mismatch fights its way free with clinging grip and an audible release; a matched fit slides; a shallow exit leaves the body nearly unchanged; a deep one leaves it stretched and slow to close. Never invent a gape the facts do not support.\n" +
        "- Write the NPC's reactions with " + posPronoun + " pronouns — NEVER by name. Do NOT invent dialogue unless the base narrative has it.\n" +
        "- No metaphors, no fragments. Literal, physical, direct.\n" +
        "Output ONLY the polished text, nothing else.";
}

/**
 * Non-blocking AI polish for a withdrawal beat, mirroring the
 * penetration prefetch pattern: the canned text shows now, and the
 * AI-authored version is cached for the next pull-out from the same
 * target+position.
 */
function prefetchPullOutEnhancement(npc, player, intimacy, position, snapshot, baseNarrative) {
    if (!intimacy || !baseNarrative) return;
    if (typeof ai !== 'function' && typeof window.ai !== 'function') return;
    if (!intimacy._pendingPullOutPrefetch) intimacy._pendingPullOutPrefetch = {};
    var key = "pull_out_generic||" + position + "||" + ((snapshot.tool || "none") + "||" + (snapshot.target || "none"));
    if (intimacy.penetrationCache && intimacy.penetrationCache instanceof Map && intimacy.penetrationCache.has(key)) return;
    if (intimacy._pendingPullOutPrefetch[key]) return;
    intimacy._pendingPullOutPrefetch[key] = true;
    (async function() {
        try {
            var prompt = buildPullOutPrompt(npc, player, intimacy, position, snapshot, baseNarrative);
            var result = await (typeof window !== "undefined" && typeof window.ai === "function" ? window.ai : ai)({
                instruction: prompt,
                startWith: "",
                endButtons: "none",
                generatorName: "cyoaftw-engine-core"
            });
            var text = result && (result.text || result);
            if (text && typeof text === 'string' && text.trim()) {
                cachePenetrationResponse(intimacy, "pull_out_generic", position, (snapshot.tool || "none") + "||" + (snapshot.target || "none"), text.trim());
                console.log("[Intimacy PullOut] Cached AI withdrawal for", snapshot.target, "at", position);
            }
        } catch (e) {
            console.warn("[Intimacy PullOut] AI enhancement failed:", e);
        } finally {
            delete intimacy._pendingPullOutPrefetch[key];
        }
    })();
}

/**
 * Check if trying to start a new penetration that conflicts with current state
 * Returns true if the action requires pulling out first
 */
function requiresPullOutFirst(npc, act, intimacy) {
    if (!npc || !act || !intimacy) return false;
    
    const currentPenetration = intimacy.penetration;
    
    // If no active penetration, no need to pull out
    if (!currentPenetration || !currentPenetration.active) return false;
    
    // Check if new action is also a penetration action
    const newIsPenetration = act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE;
    
    // If not a penetration action, no conflict
    if (!newIsPenetration) return false;
    
    // If penetrating the same target, no need to pull out (can continue)
    if (currentPenetration.target === act.target) return false;
    
    // Different penetration targets - need to pull out first
    return true;
}

/**
 * Build position change narration for player
 */
function buildPositionChangeNarration(npc, positionChangeInfo) {
    if (!positionChangeInfo) return null;
    
    const { oldPosition, oldPositionLabel, newPosition, newPositionLabel, pullOutNarrative } = positionChangeInfo;
    
    // Get pronouns for the NPC
    var posPronoun = (typeof getPossessivePronoun === 'function' ? getPossessivePronoun(npc) : "her") || "her";
    var subjPronoun = (typeof getSubjectPronoun === 'function' ? getSubjectPronoun(npc) : "She") || "she";
    var objPronoun = (typeof getObjectPronoun === 'function' ? getObjectPronoun(npc) : "her") || "her";
    var subjLower = subjPronoun.toLowerCase();
    
    // Get position objects for role info
    var newPosObj = (typeof getPosition === 'function') ? getPosition(newPosition) : null;
    var oldPosObj = (typeof getPosition === 'function') ? getPosition(oldPosition) : null;
    var newDesc = newPosObj ? newPosObj.description : newPositionLabel;
    
    // Build the choreography narration for the new position
    var choreography = getPositionChoreography(newPosition, posPronoun, subjPronoun, objPronoun, subjLower);
    
    // If there was a pull-out, prepend it
    if (pullOutNarrative) {
        return `${pullOutNarrative} ${choreography}`;
    }
    
    return choreography;
}

/**
 * Get rich choreography narration for a position transition.
 * Describes the arrangement of the new position, not the full motion.
 */
function getPositionChoreography(newPosition, posPronoun, subjPronoun, objPronoun, subjLower) {
    // Tail fragment for tailed species in behind-positions
    var _tailFragment = "";
    // Note: npc is not passed to this function, so we check window.G.activeNPC
    var _npc = (typeof G !== "undefined" && G.activeNPC) ? G.activeNPC : null;
    if (_npc && typeof hasNPCTail === "function" && hasNPCTail(_npc)) {
        var _behindPositions = ["Standing From Behind", "Against Wall From Behind", "Doggy", "Bent Over", "Spooning", "Reverse Cowgirl"];
        if (_behindPositions.indexOf(newPosition) !== -1) {
            _tailFragment = pickRandom([
                posPronoun + " tail brushes against your thigh as you press close",
                posPronoun + " thick tail curls to the side, clearing the way",
                posPronoun + " tail wraps loosely around your wrist for a moment",
                posPronoun + " tail swishes against your hip"
            ]);
        }
    }

    // Each position has 2-3 varied templates describing the final arrangement
    var templates = {
        "Standing": [
            `You draw ${objPronoun} up to stand face to face with you, ${posPronoun} body warm against yours.`,
            `You guide ${objPronoun} to ${posPronoun} feet, standing together, your bodies pressed close.`,
            `You stand facing each other, ${posPronoun} breath warm on your neck as ${subjLower} settles against you.`
        ],
        "Standing From Behind": [
            `You move behind ${objPronoun}, pressing your chest against ${posPronoun} back, your arms reaching around ${posPronoun} waist.`,
            `You step around behind ${objPronoun}, pulling ${posPronoun} hips back against yours, ${posPronoun} back pressed to your chest.`,
            `You guide ${objPronoun} to face away from you, closing the distance until your body is flush against ${posPronoun} backside.`
        ],
        "Against Wall": [
            `${subjPronoun} presses you back against the wall, pinning you there with ${posPronoun} weight, ${posPronoun} eyes dark with intent.`,
            `You find your back against the wall as ${subjLower} crowds into you, ${posPronoun} body a warm, heavy pressure pinning you in place.`,
            `${subjPronoun} backs you up against the wall, caging you with ${posPronoun} arms, ${posPronoun} face inches from yours.`
        ],
        "Against Wall From Behind": [
            `You press ${objPronoun} against the wall, ${posPronoun} back to the surface, your body holding ${objPronoun} in place from behind.`,
            `You guide ${objPronoun} forward until ${posPronoun} hands meet the wall, then press yourself against ${posPronoun} back, pinning ${objPronoun} there.`,
            `You walk ${objPronoun} to the wall and press ${posPronoun} against it, your chest flush to ${posPronoun} back, ${posPronoun} cheek against the cool surface.`
        ],
        "Perched": [
            `You settle into a seat and draw ${objPronoun} onto your lap, ${posPronoun} thighs parting to straddle you, ${posPronoun} weight warm and close.`,
            `You sit and pull ${objPronoun} down onto your thighs, ${posPronoun} knees bracketing your hips, facing you.`,
            `You ease back and guide ${objPronoun} onto your lap, ${posPronoun} settling between your thighs with ${posPronoun} legs draped over yours.`
        ],
        "Astride Lap": [
            `You straddle ${posPronoun} lap, sinking down to sit on ${posPronoun} thighs, your weight settling against ${objPronoun}.`,
            `You swing a leg over and settle astride ${posPronoun} lap, facing ${objPronoun}, your hips flush against ${posPronoun}.`,
            `You climb into ${posPronoun} lap, knees on either side of ${posPronoun} hips, your bodies pressed together.`
        ],
        "Missionary": [
            `You ease ${objPronoun} down onto ${posPronoun} back and settle over ${objPronoun}, your weight braced on your arms, ${posPronoun} legs parting beneath you.`,
            `You lower ${objPronoun} to the surface and follow ${objPronoun} down, covering ${posPronoun} body with yours, face to face.`,
            `You lay ${objPronoun} back and position yourself above ${objPronoun}, ${posPronoun} thighs spreading to receive you, your hips settling between ${posPronoun}.`
        ],
        "Doggy": [
            `You guide ${objPronoun} onto all fours, positioning yourself behind ${objPronoun}, your hands on ${posPronoun} hips.`,
            `You turn ${objPronoun} around and ease ${objPronoun} down onto hands and knees, kneeling behind ${objPronoun} with your palms on ${posPronoun} waist.`,
            `${subjPronoun} drops to all fours and you kneel behind ${objPronoun}, your body aligned with ${posPronoun} upturned rear.`
        ],
        "Bent Over": [
            `You bend ${objPronoun} over the nearest surface, pressing ${posPronoun} down with one hand, stepping behind ${objPronoun}.`,
            `You guide ${objPronoun} forward until ${posPronoun} is bent at the waist, hands braced on the surface, ${posPronoun} backside presented to you.`,
            `You press ${objPronoun} down over the edge, ${posPronoun} hips tilted up, and step between ${posPronoun} spread legs.`
        ],
        "Spooning": [
            `You lower ${objPronoun} onto ${posPronoun} side and curl up behind ${objPronoun}, your chest flush to ${posPronoun} back, your arm draped over ${posPronoun} waist.`,
            `You settle onto your side behind ${objPronoun}, pulling ${posPronoun} back against your chest, your bodies nesting together.`,
            `You lie down and draw ${objPronoun} into the curve of your body, ${posPronoun} back pressed to your front, your knees behind ${posPronoun}.`
        ],
        "Kneeling": [
            `You guide ${objPronoun} down to ${posPronoun} knees before you, standing over ${objPronoun}, looking down at ${objPronoun} upturned face.`,
            `${subjPronoun} kneels at your feet, looking up at you, ${posPronoun} hands resting on your thighs.`,
            `You stand as ${subjLower} sinks to ${posPronoun} knees in front of you, ${posPronoun} face level with your hips.`
        ],
        "Kneeling Over": [
            `You lie back as ${subjLower} kneels over you, ${posPronoun} knees on either side of your hips, looking down at you.`,
            `You settle onto your back and ${subjLower} straddles you on ${posPronoun} knees, hovering above you.`,
            `You stretch out beneath ${objPronoun} as ${subjLower} kneels over your body, ${posPronoun} weight poised above you.`
        ],
        "Cowgirl": [
            `You lie back and ${subjLower} straddles you, sinking down onto your hips, ${posPronoun} hands braced on your chest, looking down at you.`,
            `You settle onto your back as ${subjLower} swings a leg over and seats ${posPronoun}self astride you, ${posPronoun} weight settling on your lap.`,
            `${subjPronoun} pushes you down and climbs on top, straddling your hips, ${posPronoun} thighs gripping your sides.`
        ],
        "Reverse Cowgirl": [
            `You lie back and ${subjLower} straddles you facing away, ${posPronoun} back to you, ${posPronoun} weight settling on your hips.`,
            `${subjPronoun} turns around and lowers ${posPronoun}self onto your lap, ${posPronoun} back facing you, your view of ${posPronoun} rear unobstructed.`,
            `You stretch out as ${subjLower} mounts you in reverse, ${posPronoun} shoulders and back the last thing you see before ${posPronoun} hips settle against yours.`
        ],
        "Sixty-Nine": [
            `You lie on your back and ${subjLower} lowers ${posPronoun}self over you in the opposite direction, ${posPronoun} hips above your face, ${posPronoun} mouth at your waist.`,
            `You arrange ${objPronoun} so ${posPronoun} body mirrors yours, head to toe, each of you with access to the other's hips.`,
            `You guide ${objPronoun} into position above you, your mouths at opposite ends, your bodies aligned in reverse.`
        ],
        "Oral Service": [
            `You position yourself above ${objPronoun} as ${subjLower} settles beneath you, ${posPronoun} face turned up toward your hips.`,
            `You stand or kneel over ${objPronoun}, ${posPronoun} mouth at your groin, ${posPronoun} hands on your thighs.`,
            `${subjPronoun} lies back and opens ${posPronoun} mouth for you as you guide yourself into position above ${posPronoun} face.`
        ],
        "Prone Oral Service": [
            `You lie back as ${subjLower} settles between your legs, ${posPronoun} face hovering over your lap, ${posPronoun} elbows resting on your thighs.`,
            `You stretch out and ${subjLower} positions ${posPronoun}self face-down between your legs, ${posPronoun} mouth at your groin.`,
            `${subjPronoun} lowers ${posPronoun}self over your hips, lying against you, ${posPronoun} breath warm against you.`
        ],
        "Kneeling By Face": [
            `You stand before ${objPronoun} as ${subjLower} kneels at your feet, ${posPronoun} face level with your hips, looking up at you.`,
            `${subjPronoun} drops to ${posPronoun} knees in front of you, ${posPronoun} mouth at the right height, ${posPronoun} eyes on yours.`,
            `You step close as ${subjLower} kneels before you, ${posPronoun} face turned up, ${posPronoun} hands on your thighs.`
        ],
        "Squatting Before": [
            `You stand over ${objPronoun} as ${subjLower} squats at your feet, ${posPronoun} thighs spread, ${posPronoun} face level with your hips.`,
            `${subjPronoun} squats in front of you, ${posPronoun} weight on ${posPronoun} heels, looking up at you from below.`,
            `You step forward as ${subjLower} squats before you, ${posPronoun} mouth at the right height, ${posPronoun} knees wide.`
        ],
        "Riding Face": [
            `${subjPronoun} straddles your face, ${posPronoun} knees on either side of your head, ${posPronoun} hips above your mouth.`,
            `You lie back as ${subjLower} lowers ${posPronoun}self over your face, ${posPronoun} thighs bracketing your head.`,
            `${subjPronoun} settles ${posPronoun}self over your mouth, gripping your head between ${posPronoun} knees, ${posPronoun} body poised above you.`
        ],
        "Mounted On X-Cross Oral Service": [
            `${subjPronoun} is restrained on the X-cross, arms and legs spread, ${posPronoun} mouth at hip level as you step before ${objPronoun}.`,
            `You approach ${objPronoun} on the cross, ${posPronoun} limbs splayed and bound, ${posPronoun} face turned toward your hips.`,
            `${subjPronoun} hangs from the X-cross, restrained and waiting, as you position yourself in front of ${posPronoun} mouth.`
        ],
        // Unconscious positions: the PLAYER arranges the limp, dead-weight
        // body — the NPC never participates or holds the position itself.
        "Unconscious On Back": [
            `You roll ${objPronoun} onto ${posPronoun} back, their limp limbs falling open as their weight settles flat against the floor.`,
            `You drag ${objPronoun} into a flat, face-up sprawl, arranging ${posPronoun} unresisting arms and legs where you need them.`,
            `You lower ${objPronoun} down on ${posPronoun} back, ${subjLower} lying heavy and motionless as you settle over ${objPronoun}.`
        ],
        "Unconscious On Face": [
            `You flip ${objPronoun} face-down, their chest and knees taking the weight while their legs splay open, limp and exposed.`,
            `You press ${objPronoun} down flat on ${posPronoun} stomach, lifting ${posPronoun} hips so ${posPronoun} rear rests raised and unresisting.`,
            `You arrange ${objPronoun} face-down with ${posPronoun} cheeks spread and ${posPronoun} head turned to the side, the whole body slack under you.`
        ],
        "Unconscious On Side": [
            `You roll ${objPronoun} onto ${posPronoun} side, one arm flopping out beneath ${objPronoun}, the top leg falling forward with the weight of it.`,
            `You settle ${objPronoun} down sideways, their limp body curling slightly as gravity pulls ${posPronoun} limbs into place.`,
            `You lay ${objPronoun} on ${posPronoun} side and step in behind ${objPronoun}, ${posPronoun} back unresisting against your front.`
        ],
        "Unconscious Doggy": [
            `You prop ${objPronoun} up on ${posPronoun} hands and knees, their arms barely holding the weight, and spread ${posPronoun} knees wide.`,
            `You lift ${objPronoun} into a slumped all-fours pose, ${posPronoun} chest sagging low, ${posPronoun} rear raised and completely unresisting.`,
            `You arrange ${objPronoun} on all fours and kneel in behind ${objPronoun}, their limp frame offering no resistance as you settle against ${posPronoun} raised rear.`
        ]
    };
    
    var pool = templates[newPosition];
    if (!pool) {
        // Fallback: use the position description
        var newPosObj = (typeof getPosition === 'function') ? getPosition(newPosition) : null;
        var desc = newPosObj ? newPosObj.description : newPosition;
        return `You reposition until ${subjLower} is ${desc.toLowerCase()}.`;
    }

    var result = pickRandom(pool);
    // Append tail fragment if applicable
    if (_tailFragment) {
        result = result.replace(/\.$/, "") + ", " + _tailFragment + ".";
    }
    return result;
}

/**
 * Build NPC response for position change (CoT-style)
 */
function buildPositionChangeNPCResponse(npc, positionChangeInfo) {
    if (!npc || !positionChangeInfo) return null;

    // Unconscious/sleeping NPCs do not react to being moved — no verbal or
    // conscious response, only the physical repositioning narration.
    if (npcCannotSpeak(npc)) return null;

    const { newPosition, newPositionLabel, penetrationEnded } = positionChangeInfo;
    const subjectPronoun = typeof getSubjectPronoun === 'function' ? getSubjectPronoun(npc) : "They";
    const possessivePronoun = typeof getPossessivePronoun === 'function' ? getPossessivePronoun(npc) : "their";
    
    const position = getPosition(newPosition);
    const positionDesc = position ? position.description || newPositionLabel : newPositionLabel;
    
    // Check for internal ejaculation that would cause messy drips when standing
    const intimacy = npc.intimacy || {};
    const hasInternalEjaculation = intimacy.climax && intimacy.climax.hasInternalEjaculation;
    const lastEjaculationTarget = intimacy.climax ? intimacy.climax.lastInternalEjaculation : null;
    
    // Check if moving to a standing position after internal ejaculation
    const isStandingPosition = newPositionLabel && /standing/i.test(newPositionLabel);
    const hasSemenToDrip = hasInternalEjaculation && lastEjaculationTarget && (lastEjaculationTarget === "anus" || lastEjaculationTarget === "vagina");
    
    // Generate semen drip narrative if applicable
    let semenDripNarrative = "";
    if (hasSemenToDrip && isStandingPosition) {
        const target = lastEjaculationTarget;
        if (target === "anus") {
            // Cloaca-bearing NPCs: the load was left in the vent.
            var dripWord = npcHasCloacaFlag(npc) ? "vent" : target;
            semenDripNarrative = pickRandom([
                `, your semen immediately beginning to drip from ${possessivePronoun} well-used ${dripWord}, running down ${possessivePronoun} thighs in thick streaks`,
                `, the change in position causing your cum to sluice out of ${possessivePronoun} stretched ${dripWord}, making a messy trail down ${possessivePronoun} legs`,
                `, your release gushing out of ${possessivePronoun} gaping ${dripWord} as gravity takes hold, the warm fluid pooling at ${possessivePronoun} feet`,
                `, a thick glob of semen sliding out from ${possessivePronoun} relaxed ${dripWord}, splattering against ${possessivePronoun} inner thighs`
            ]);
        } else if (target === "vagina") {
            semenDripNarrative = pickRandom([
                `, your cum immediately beginning to leak from ${possessivePronoun} soaked ${target}, trickling down ${possessivePronoun} thighs`,
                `, the change in angle causing your seed to drip from ${possessivePronoun} well-fucked ${target}, warm fluid running down ${possessivePronoun} legs`,
                `, a thick drizzle of semen escaping ${possessivePronoun} ${target}, pooling between ${possessivePronoun} thighs as ${subjectPronoun} stands`,
                `, your release seeping out of ${possessivePronoun} used ${target}, the slick trail evidence of your coupling`
            ]);
        }
    }
    
    // Determine reaction based on position and NPC personality
    const arousalLevel = npc.intimacy ? (npc.intimacy.arousal || 0) : 0;
    const arousalAdjective = arousalLevel > 70 ? pickRandom(["eagerly", "hungrily", "with anticipation"]) :
                            arousalLevel > 40 ? pickRandom(["willingly", "with interest"]) :
                            pickRandom(["patiently", "calmly", "with a nod"]);
    
    // Build appropriate reaction based on position type
    const positionType = position ? position.playerRole || newPosition : newPosition;
    
    let reaction;
    if (penetrationEnded) {
        reaction = pickRandom([
            `lets out a soft sound as you shift positions.`,
            `adjusts ${possessivePronoun} stance, following your lead.`,
            `watches you with interest as the position changes.`
        ]);
    } else if (positionType.includes("standing") || positionType.includes("against") || positionType.includes("pinned")) {
        reaction = pickRandom([
            `stands ${arousalAdjective}, ready for the new angle.`,
            `positions ${possessivePronoun}self ${arousalAdjective} against you.`,
            `shifts to match your stance, ${arousalAdjective}.`
        ]);
    } else if (positionType.includes("lap") || positionType.includes("seated") || positionType.includes("astride")) {
        reaction = pickRandom([
            `settles onto your lap ${arousalAdjective}.`,
            `straddles you ${arousalAdjective}, finding a comfortable position.`,
            `perches on your lap, ${arousalAdjective}.`
        ]);
    } else if (positionType.includes("missionary") || positionType.includes("lying") || positionType.includes("reclining")) {
        reaction = pickRandom([
            `lies back ${arousalAdjective}, welcoming you.`,
            `reclines ${arousalAdjective}, ready for you.`,
            `stretches out beneath you ${arousalAdjective}.`
        ]);
    } else if (positionType.includes("behind") || positionType.includes("doggy") || positionType.includes("bent")) {
        reaction = pickRandom([
            `presents ${possessivePronoun}self to you ${arousalAdjective}.`,
            `turns away from you ${arousalAdjective}, ready for access.`,
            `gets into position ${arousalAdjective}.`
        ]);
    } else {
        reaction = pickRandom([
            `adjusts to the new position ${arousalAdjective}.`,
            `shifts comfortably ${arousalAdjective}.`,
            `follows your lead ${arousalAdjective}.`
        ]);
    }
    
    // Append semen drip narrative if applicable
    if (semenDripNarrative) {
        reaction = reaction + semenDripNarrative;
    }
    
    return reaction;
}

// ============================================================================
// ANATOMY DESCRIBER HELPER
// Rich, varied descriptions for intimate body parts using NPC traits
// ============================================================================

/**
 * Master anatomy describer - generates rich, varied descriptions for body parts
 * @param {Object} npc - The NPC being described
 * @param {string} target - The body part to describe (vagina, penis, breasts, etc.)
 * @param {Object} options - Additional context (action, arousalLevel, isAroused, etc.)
 * @returns {string} - A rich description of the anatomy
 */
function describeAnatomy(npc, target, options = {}) {
    if (!npc || !target) return target;
    
    const { action, arousalLevel = 0, isAroused = false, isWet = false, isErect = false, possessivePronoun = null, isOnCooldown = false } = options;
    
    // Get the anatomy object - check nsfwTraits first (sexual anatomy), then fallback to regular anatomy
    const nsfwAnatomy = (npc.nsfwTraits && npc.nsfwTraits.anatomy) || {};
    const regularAnatomy = npc.anatomy || {};
    const anatomy = { ...regularAnatomy, ...nsfwAnatomy };
    
    const gender = (npc.gender || "").toLowerCase();
    const isFemale = gender === "female" || gender.includes("female");
    const isMale = gender === "male" || gender.includes("male");
    
    const posPronoun = possessivePronoun || (typeof getPossessivePronoun === 'function' ? getPossessivePronoun(npc) : "their");
    
    // Get arousal descriptors
    const arousalDescriptors = getArousalDescriptors(arousalLevel, isAroused, isWet, isErect, isOnCooldown);
    
    // Get anatomy type and surface descriptors to prevent AI from hallucinating wrong features
    var anatomyType = (typeof getNPCAnatomyType === "function") ? getNPCAnatomyType(npc) : "humanoid";
    var surfaceDesc = "";
    if (anatomyType === "reptilian" || anatomyType === "scaled") {
        surfaceDesc = "scaled ";
    } else if (anatomyType === "furry" || anatomyType === "furred") {
        surfaceDesc = "fur-covered ";
    } else if (anatomyType === "feathered" || anatomyType === "avian") {
        surfaceDesc = "feathered ";
    } else {
        surfaceDesc = "smooth "; // mammalian/skin default
    }
    var effectiveTarget = target;
    if (anatomyType === "reptilian") {
        var targetLower = target.toLowerCase();
        if (targetLower === "vagina" || targetLower === "pussy" || targetLower === "clitoris" || targetLower === "clit" ||
            targetLower === "anus" || targetLower === "ass" || targetLower === "butt" || targetLower === "buttocks") {
            // For reptilian anatomy, vagina and anus are the same opening (cloaca)
            effectiveTarget = "cloaca";
        }
    }

    switch (effectiveTarget.toLowerCase()) {
        case "cloaca":
            return describeCloaca(npc, anatomy, posPronoun, arousalDescriptors);
        case "vagina":
        case "pussy":
            return describeVagina(npc, anatomy, posPronoun, arousalDescriptors);
        
        case "penis":
        case "cock":
        case "dick":
            return describePenis(npc, anatomy, posPronoun, arousalDescriptors);
        
        case "testicles":
        case "balls":
            return describeTesticles(npc, anatomy, posPronoun, arousalDescriptors);
        
        case "breasts":
        case "boobs":
        case "tits":
            return describeBreasts(npc, anatomy, posPronoun, arousalDescriptors);
        
        case "nipples":
        case "nipple":
            return describeNipples(npc, anatomy, posPronoun, arousalDescriptors);
        
        case "anus":
            return describeAnus(npc, anatomy, posPronoun, arousalDescriptors);
        
        case "ass":
        case "butt":
        case "buttocks":
            return describeButtocks(npc, anatomy, posPronoun, arousalDescriptors);
        
        case "mouth":
        case "lips":
            return describeMouth(npc, anatomy, posPronoun, arousalDescriptors);
        
        case "thighs":
        case "thigh":
            return describeThighs(npc, anatomy, posPronoun, arousalDescriptors);
        
        default:
            return target;
    }
}

/**
 * Get arousal state descriptors
 */
function getArousalDescriptors(arousalLevel, isAroused, isWet, isErect, isOnCooldown = false) {
    const highArousal = arousalLevel > 70;
    const mediumArousal = arousalLevel > 40;
    
    // For cooldown state, override with limp/flaccid descriptors
    if (isOnCooldown) {
        return {
            wetness: null,
            engorgement: pickRandom(["limp", "flaccid", "soft", "spent"]),
            state: pickRandom(["spent", "recovering", "resting", "subsided"]),
            coloration: null
        };
    }
    
    return {
        wetness: isWet ? pickRandom(["slick", "dripping", "glistening", "soaked", "sodden"]) : 
                 highArousal ? pickRandom(["damp", "moist", "dewy", "slightly wet"]) : null,
        
        engorgement: isErect ? pickRandom(["fully engorged", "throbbing", "rigid", "stiff", "hard"]) :
                      highArousal ? pickRandom(["semi-engorged", "swollen", "plump", "firm"]) :
                      mediumArousal ? pickRandom(["slightly swollen", "turgid", "full"]) : null,
        
        state: isAroused || highArousal ? pickRandom(["aroused", "needy", "pulsing", "aching", "throbbing"]) :
               mediumArousal ? pickRandom(["stirred", "warm", "tingling"]) : null,
        
        coloration: isAroused || highArousal ? pickRandom(["deepened in color", "flushed dark", "rosy and swollen", "darkened with desire"]) :
                    mediumArousal ? pickRandom(["slightly pink", "warm-toned", "faintly flushed"]) : null
    };
}

/**
 * Describe vagina/pussy with rich detail
 */
function describeVagina(npc, anatomy, posPronoun, arousalDescriptors) {
    const pubicHair = anatomy.pubicHair || {};
    const genitals = anatomy.genitals || {};
    const genitalSize = anatomy.genitalSize || {};
    const size = genitalSize.sizeCategory || "medium";
    const hairColor = pubicHair.color || "dark";
    const hairStyle = pubicHair.style || "natural";
    const genitalDesc = genitals.description || "vagina";
    const pigmentation = genitals.pigmentation || "natural";
    
    const descriptions = [];
    
    // Pubic hair: only skin-covered mammalian anatomy has a pubicHair
    // profile (the nsfw anatomy generator omits the key for scaled, furred,
    // feathered and chitinous species). Never invent hair from the defaults
    // below - describe the mound by its actual surface instead, so the
    // text always matches the anatomy.
    const body = anatomy.body || {};
    const surfaceType = body.surfaceType || "skin";
    const anatomyType = (typeof getNPCAnatomyType === "function") ? getNPCAnatomyType(npc) : "humanoid";
    if (surfaceType !== "skin") {
        const surfaceColor = body.color || "";
        const surface = surfaceColor ? surfaceColor + " " + surfaceType : surfaceType;
        if (surfaceType === "scales") {
            descriptions.push(pickRandom([
                "smooth " + surface + " mound, the plates finer and lighter here",
                "bare scaled mound, no hair",
                "hairless " + surface + " mound"
            ]));
        } else if (surfaceType === "fur") {
            descriptions.push(pickRandom([
                "soft " + surface + " mound",
                "fur-covered " + surface + " mound",
                "" + surface + " mound"
            ]));
        } else if (surfaceType === "feathers") {
            descriptions.push(pickRandom([
                "feathered " + surface + " mound",
                "soft " + surface + " mound covered in down",
                "" + surface + " mound"
            ]));
        } else {
            descriptions.push(surface + " mound");
        }
    } else if (hairStyle !== "smooth" && hairStyle !== "none") {
        const hairAdjectives = {
            dark: ["dark", "ebony", "raven", "jet black", "deep brown"],
            brown: ["chestnut", "auburn", "caramel", "cinnamon"],
            black: ["inky", "obsidian", "coal-black", "midnight"],
            blonde: ["golden", "honey", "sun-kissed", "pale"],
            auburn: ["fiery", "copper", "russet", "burnished"],
            grey: ["silver", "steel", "pepper-and-salt", "frosted"]
        };
        const hairAdj = hairAdjectives[hairColor] ? pickRandom(hairAdjectives[hairColor]) : hairColor;
        
        const styleDescriptions = {
            "neatly trimmed": ["neatly trimmed", "closely cropped", "manicured"],
            "natural": ["a natural bush of", "a thick patch of", "a wild tangle of"],
            "thick": ["a thick thatch of", "a dense forest of", "a lush growth of"],
            "a messy natural": ["a wild growth of", "an unkempt thicket of", "a tangled bush of"],
            "a unkept and thick": ["a wild, unkempt thicket of", "a dense, untamed growth of"],
            "smooth": ["smooth and bare", "shaven clean", "hairless"],
            "long thick and wild": ["a wild mane of", "an untamed thicket of", "a luxuriant growth of"]
        };
        const styleDesc = styleDescriptions[hairStyle] ? pickRandom(styleDescriptions[hairStyle]) : hairStyle;
        
        descriptions.push(`${styleDesc} ${hairAdj} pubic hair`);
    } else {
        descriptions.push(pickRandom(["smooth and bare skin", "shaven clean flesh", "hairless mound"]));
    }
    
    // Labia/vulva description
    const labiaDescriptors = {
        small: ["tight", "delicate", "petite", "dainty"],
        medium: ["plump", "well-formed", "soft", "firm"],
        large: ["meaty", "full", "ample", "thick", "voluptuous"]
    };
    const labiaAdj = labiaDescriptors[size] ? pickRandom(labiaDescriptors[size]) : pickRandom(["soft", "warm"]);
    
    const vulvaTerms = pickRandom(["labia", "lips", "folds", "petals", "velvet folds"]);
    
    // Add arousal state - use at most one wetness/engorgement descriptor to avoid overloading
    const wetDesc = arousalDescriptors.wetness ? `${arousalDescriptors.wetness} ` : "";
    const engorgedDesc = arousalDescriptors.engorgement ? `${arousalDescriptors.engorgement} ` : "";
    const arousalDesc = wetDesc || engorgedDesc; // Use at most one
    
    // Build the description - avoid chaining multiple descriptors
    const baseDesc = arousalDesc ? pickRandom([
        `${posPronoun} ${arousalDesc}${genitalDesc}`,
        `${posPronoun} ${arousalDesc}${labiaAdj} ${vulvaTerms}`
    ]) : pickRandom([
        `${posPronoun} ${genitalDesc}`,
        `${posPronoun} ${labiaAdj} ${vulvaTerms}`,
        `${posPronoun} ${labiaAdj} ${genitalDesc}`
    ]);
    
    return pickRandom([
        `${posPronoun} ${descriptions[0]}, parting to reveal ${baseDesc}`,
        `through ${posPronoun} ${descriptions[0]} to ${baseDesc}`,
        `${baseDesc}, framed by ${posPronoun} ${descriptions[0]}`,
        `${posPronoun} ${labiaAdj} ${vulvaTerms}`
    ]);
}

/**
 * Describe penis/cock with rich detail
 */
function describePenis(npc, anatomy, posPronoun, arousalDescriptors) {
    const genitals = anatomy.genitals || {};
    const genitalSize = anatomy.genitalSize || {};
    const size = genitalSize.sizeCategory || "medium";
    const genitalDesc = genitals.description || "cock";
    const pigmentation = genitals.pigmentation || "natural";
    
    const sizeDescriptors = {
        small: ["modest", "petite", "compact", "trim"],
        medium: ["respectable", "well-proportioned", "solid", "sturdy"],
        large: ["impressive", "thick", "girthy", "heavy", "substantial"]
    };
    const sizeAdj = sizeDescriptors[size] ? pickRandom(sizeDescriptors[size]) : "";
    
    const stateDesc = arousalDescriptors.engorgement ? arousalDescriptors.engorgement : 
                     arousalDescriptors.state ? arousalDescriptors.state : "";
    
    const descriptions = [
        `${posPronoun} ${sizeAdj} ${genitalDesc}`,
        `${posPronoun} ${sizeAdj} ${genitalDesc}`,
        `${posPronoun} ${stateDesc} ${sizeAdj} ${genitalDesc}`
    ];
    
    return pickRandom(descriptions);
}

/**
 * Describe testicles/balls with rich detail
 */
function describeTesticles(npc, anatomy, posPronoun, arousalDescriptors) {
    const genitalSize = anatomy.genitalSize || {};
    const size = genitalSize.sizeCategory || "medium";
    
    const sizeDescriptors = {
        small: ["tight", "compact", "neat"],
        medium: ["full", "heavy", "well-hung"],
        large: ["weighty", "swinging", "substantial", "pendulous"]
    };
    const sizeAdj = sizeDescriptors[size] ? pickRandom(sizeDescriptors[size]) : "";
    
    const stateDesc = arousalDescriptors.engorgement ? arousalDescriptors.engorgement : 
                     arousalDescriptors.state ? arousalDescriptors.state : "";
    
    return pickRandom([
        `${posPronoun} ${sizeAdj} balls`,
        `${posPronoun} ${stateDesc} ${sizeAdj} testicles`,
        `${posPronoun} ${sizeAdj} ${pickRandom(["sack", "scrotum"])}`,
        `${posPronoun} ${pickRandom(["heavy", "full"])} ${sizeAdj} balls`
    ]);
}

/**
 * Describe breasts with rich detail
 */
function describeBreasts(npc, anatomy, posPronoun, arousalDescriptors) {
    const breasts = anatomy.breasts || {};
    const size = breasts.sizeCategory || (npc.gender === "female" ? "medium" : "flat");
    const breastDesc = breasts.description || "chest";
    const nipples = breasts.nipples || {};
    const areolas = breasts.areolas || {};
    
    const sizeDescriptors = {
        flat: ["small", "modest", "petite", "boyish"],
        medium: ["perky", "round", "firm", "shapely"],
        large: ["full", "ample", "generous", "heavy", "voluptuous"]
    };
    const sizeAdj = sizeDescriptors[size] ? pickRandom(sizeDescriptors[size]) : "";
    
    const nippleDescriptors = {
        small: ["delicate", "tiny", "dainty", "pert"],
        average: ["perky", "prominent", "defined"],
        prominent: ["thick", "puffy", "distended", "protruding"]
    };
    const nippleAdj = nippleDescriptors[nipples.size] ? pickRandom(nippleDescriptors[nipples.size]) : "";
    const nippleTexture = nipples.texture || "smooth";
    
    const areolaSize = areolas.size || "average";
    const areolaPigment = areolas.pigmentation || "softly tinted";
    
    const stateDesc = arousalDescriptors.engorgement ? arousalDescriptors.engorgement : 
                     arousalDescriptors.state ? arousalDescriptors.state : "";
    
    const baseDescs = [
        `${posPronoun} ${sizeAdj ? sizeAdj + " " : ""}${breastDesc}`,
        `the ${sizeAdj ? sizeAdj + " " : ""}swell of ${posPronoun} ${breastDesc}`,
        `${posPronoun} ${stateDesc ? stateDesc + " " : ""}${sizeAdj ? sizeAdj + " " : ""}breasts`
    ];

    const detailedDescs = [
        `${posPronoun} ${sizeAdj ? sizeAdj + " " : ""}${breastDesc}, topped with ${nippleAdj ? nippleAdj + " " : ""}${nippleTexture} ${pickRandom(["nipples", "teats", "buds"])}`,
        `the ${sizeAdj ? sizeAdj + " " : ""}mounds of ${posPronoun} ${breastDesc}, crowned with ${areolaPigment} ${areolaSize} areolas`,
        `${posPronoun} ${stateDesc ? stateDesc + " " : ""}${sizeAdj ? sizeAdj + " " : ""}breasts, the ${nippleAdj ? nippleAdj + " " : ""}nipples standing proudly`
    ];

    return pickRandom([...baseDescs, ...detailedDescs].map(function(s) { return s.replace(/\s+/g, ' ').trim(); }));
}

/**
 * Get nipple erection state based on play count and arousal.
 * Nipples progress from soft/normal → stiffening → fully erect as they're
 * played with. When erect, the areola wrinkles and the skin tightens.
 * Returns an object with state descriptors for use in narration.
 */
function getNippleState(npc, arousalLevel) {
    var intimacy = npc.intimacy || {};
    var flags = intimacy.encounterFlags || {};
    var playCount = flags.nipplePlayCount || 0;
    // Arousal scale is 0-800 (ORGASM_THRESHOLD). Read from npc.intimacy
    // if arousalLevel not provided or out of range.
    var arousal = (typeof arousalLevel === "number" && arousalLevel > 0) ? arousalLevel :
                  (intimacy.arousal && intimacy.arousal.npc) ? intimacy.arousal.npc : 0;
    var highArousal = arousal > 480;   // ~60% of threshold
    var mediumArousal = arousal > 240; // ~30% of threshold

    // Determine erection state: play count drives progression, arousal
    // accelerates it. First touch = soft/normal. 2-3 touches = stiffening.
    // 4+ touches = fully erect. High arousal can skip ahead.
    var erection;
    if (playCount >= 4 || (playCount >= 2 && highArousal)) {
        erection = "erect";
    } else if (playCount >= 2 || (playCount >= 1 && mediumArousal)) {
        erection = "stiffening";
    } else {
        erection = "soft";
    }

    // State-specific descriptors
    var budDesc, areolaTexture, sensation;
    if (erection === "erect") {
        budDesc = pickRandom([
            "hard, tight buds",
            "stiff, puckered peaks",
            "erect, straining nubs",
            "firmly peaked nipples"
        ]);
        areolaTexture = pickRandom([
            "the skin wrinkling around the base",
            "the areola tightening into small, puckered ridges",
            "the surrounding skin drawn taut and crinkled",
            "the areola contracting into tiny goosebumps"
        ]);
        sensation = pickRandom([
            "the stiff peaks sensitive to every brush",
            "each touch sending a sharp jolt through the hardened flesh",
            "the tight buds aching under the pressure",
            "the peaked nipples exquisitely responsive"
        ]);
    } else if (erection === "stiffening") {
        budDesc = pickRandom([
            "stiffening buds",
            "slowly hardening nipples",
            "firming peaks",
            "growing nubs"
        ]);
        areolaTexture = pickRandom([
            "the areola beginning to pucker",
            "the skin tightening around the base",
            "the surrounding skin starting to crinkle",
            "the areola slowly contracting"
        ]);
        sensation = pickRandom([
            "the hardening buds growing more sensitive",
            "each touch making them stiffen further",
            "the firming nipples responding eagerly",
            "the awakening buds tingling under your fingers"
        ]);
    } else {
        budDesc = pickRandom([
            "soft, flat buds",
            "smooth, relaxed nipples",
            "gentle, unaroused nubs",
            "soft, quiet peaks"
        ]);
        areolaTexture = pickRandom([
            "the smooth areola",
            "the flat, soft surrounding skin",
            "the untroubled skin around each bud",
            "the relaxed areola"
        ]);
        sensation = pickRandom([
            "the soft buds beginning to stir",
            "the gentle contact sending a faint warmth through them",
            "the quiet nipples just starting to respond",
            "the soft flesh yielding to your touch"
        ]);
    }

    return {
        erection: erection,
        budDesc: budDesc,
        areolaTexture: areolaTexture,
        sensation: sensation
    };
}

/**
 * Describe nipples with rich detail
 */
function describeNipples(npc, anatomy, posPronoun, arousalDescriptors) {
    const breasts = anatomy.breasts || {};
    const nipples = breasts.nipples || {};
    const areolas = breasts.areolas || {};
    
    const nippleDescriptors = {
        small: ["delicate", "tiny", "dainty", "pert"],
        average: ["perky", "prominent", "defined", "firm"],
        prominent: ["thick", "puffy", "distended", "protruding", "erect"]
    };
    const nippleAdj = nippleDescriptors[nipples.size] ? pickRandom(nippleDescriptors[nipples.size]) : "";
    const nippleTexture = nipples.texture || "smooth";
    const areolaPigment = areolas.pigmentation || "softly tinted";
    const areolaSize = areolas.size || "average";
    
    const stateDesc = arousalDescriptors.engorgement ? arousalDescriptors.engorgement : 
                     arousalDescriptors.state ? arousalDescriptors.state : "";

    // Get nipple erection state from play history (reads arousal from npc.intimacy)
    var nippleState = (typeof getNippleState === 'function') ? getNippleState(npc) : null;
    var erectDesc = nippleState ? nippleState.budDesc : "";
    var areolaTex = nippleState ? nippleState.areolaTexture : "";
    
    return pickRandom([
        `${posPronoun} ${nippleAdj ? nippleAdj + " " : ""}${pickRandom(["nipples", "teats", "buds", "peaks"])}`,
        `${posPronoun} ${nippleAdj ? nippleAdj + " " : ""}${nippleTexture} ${pickRandom(["nipples", "nubs"])}`,
        `${stateDesc ? posPronoun + " " + stateDesc + " " : ""}${nippleAdj ? nippleAdj + " " : ""}nipples, surrounded by ${areolaPigment} ${areolaSize} areolas`,
        erectDesc ? `${posPronoun} ${erectDesc}, ${areolaTex}` : `${posPronoun} ${nippleAdj ? nippleAdj + " " : ""}nipples`,
        `${posPronoun} ${nippleAdj ? nippleAdj + " " : ""}nipples`
    ].map(function(s) { return s.replace(/\s+/g, ' ').trim(); }));
}

/**
 * Describe cloaca (reptilian anatomy — single opening for both
 * vaginal and anal functions). Used for lizardfolk, kobolds, and
 * other reptilian species. Scaled, muscular, different from mammalian
 * anatomy.
 */
function describeCloaca(npc, anatomy, posPronoun, arousalDescriptors) {
    var skinDesc = (typeof getSkinDescription === "function") ? getSkinDescription(npc) : "";
    var sizeAdj = pickRandom(["tight", "smooth-scaled", "muscular", "slick"]);
    var cloacaTerm = pickRandom(["cloaca", "vent", "slit", "opening"]);
    // Adjectival skin form so the descriptor reads "her deep orange scaled
    // slit" rather than the broken "her deep orange scales slit".
    var skinAdj = String(skinDesc || "").replace(/\s+scales$/i, " scaled").replace(/\s+skin$/i, "").replace(/\s+fur$/i, " furred").trim();

    var candidates = [
        posPronoun + " " + sizeAdj + " " + skinAdj + " " + cloacaTerm,
        posPronoun + " " + skinAdj + " " + cloacaTerm + ", the smooth scales glistening faintly",
        posPronoun + " scaled " + cloacaTerm + ", a single vertical seam"
    ];

    // Arousal affects the cloaca — it gapes/widens when aroused
    var stateDesc = arousalDescriptors.engorgement ? pickRandom(["widening", "gaping slightly", "dilated", "relaxing open"]) : "";
    if (stateDesc) {
        candidates.push(posPronoun + " " + stateDesc + " " + skinAdj + " " + cloacaTerm + ", the scales pulling apart with arousal");
    }

    return pickRandom(candidates).replace(/\s+/g, ' ').trim();
}

/**
 * Describe anus with rich detail
 * Uses anatomical terms: star, rosebud, pucker, ring, etc.
 */
function describeAnus(npc, anatomy, posPronoun, arousalDescriptors, anatomyType, surfaceDesc) {
    const anus = anatomy.anus || {};
    const size = anus.size || "snug";
    const sphincter = anus.sphincter || "tight";
    const desc = anus.description || "anus";
    const pigmentation = anus.pigmentation || null;

    // NOTE: The anus does not engorge, throb, or become "aroused" like genitals.
    // Do NOT use engorgement/state/wetness from arousalDescriptors. Instead,
    // use physical texture descriptors (wrinkled, puckered, hair-dusted) and
    // raw/musky sensory descriptors that are appropriate for the anus.

    // Anatomical terms — avoid overly romanticized words like "rosebud" which
    // sound odd in raw context. Use more direct, physical terms.
    const anusTerms = pickRandom([
        "pucker", "hole", "opening", "entrance", "sphincter"
    ]);

    const sizeDescriptors = {
        tight: ["tight", "constricted", "narrow", "virgin"],
        snug: ["snug", "firm", "tight"],
        firm: ["firm", "muscular", "controlled", "toned"],
        supple: ["supple", "yielding", "soft", "pliant", "flexible"],
        loose: ["loose", "relaxed", "experienced", "used", "accommodating"],
        gaping: ["gaping", "stretched", "wide", "open"],
        stretchy: ["stretchy", "accommodating", "flexible", "pliable"]
    };
    const sizeAdj = sizeDescriptors[size] ? pickRandom(sizeDescriptors[size]) : size;

    // Texture descriptors — wrinkly/puckered skin is the anus's natural state
    const sphincterDescriptors = {
        tight: ["clenched", "tense and shut", "tightly squeezed", "wrinkled tight"],
        snug: ["puckered", "wrinkled", "firm", "tightly furled", "crinkled"],
        firm: ["controlled", "clenched", "puckered", "muscular", "ridged"],
        supple: ["yielding", "receptive", "soft", "wrinkled", "loose-skinned"],
        loose: ["open", "parted", "experienced", "stretched", "relaxed"]
    };
    const sphincterDesc = sphincterDescriptors[sphincter] ? pickRandom(sphincterDescriptors[sphincter]) : sphincter;

    // Hair descriptors — the anal area often has hair, add raw detail
    // For scaled species, use scale texture instead of hair
    // Use actual surface type from anatomy.body to prevent hallucinating wrong features
    const body = anatomy.body || {};
    const actualSurfaceType = (body && String(body.surfaceType || "").trim().toLowerCase()) || "skin";
    var hairDesc = "";
    if (actualSurfaceType === "scales") {
        if (Math.random() < 0.3) {
            hairDesc = pickRandom([
                "ringed with fine smooth scales", "smooth-scaled"
            ]);
        }
    } else {
        const hasHair = anatomy.pubicHair && anatomy.pubicHair.description;
        hairDesc = hasHair && Math.random() < 0.4
            ? pickRandom([
                  "hair-dusted", "downy-haired", "furred",
                  "ringed with coarse hair", "surrounded by soft hair"
              ])
            : "";
    }

    // Pigmentation
    const pigmentDesc = pigmentation && pigmentation !== "natural" && pigmentation !== "natural toned"
        ? pigmentation
        : "";

    // Build description: pick one texture descriptor + the term, optionally
    // with hair or pigmentation. Never use arousal descriptors (engorgement/
    // state) since the anus doesn't engorge or become "aroused".
    const candidates = [sizeAdj, sphincterDesc, hairDesc, pigmentDesc].filter(Boolean);
    const singleDesc = pickRandom(candidates) || sizeAdj;

    // Occasionally combine texture + hair for richer description
    if (hairDesc && Math.random() < 0.3 && singleDesc !== hairDesc) {
        return `${posPronoun} ${singleDesc}, ${hairDesc} ${anusTerms}`.replace(/\s+/g, ' ').trim();
    }

    return `${posPronoun} ${singleDesc} ${anusTerms}`.replace(/\s+/g, ' ').trim();
}

/**
 * Describe buttocks with rich detail
 * Uses terms like: cheeks, globes, mounds, rounded, firm, plump, etc.
 */
function describeButtocks(npc, anatomy, posPronoun, arousalDescriptors) {
    const buttocks = anatomy.buttocks || {};
    const size = buttocks.sizeCategory || "medium";
    const desc = buttocks.description || "buttocks";
    const hips = anatomy.hips || {};
    const hipSize = hips.sizeCategory || "average";
    
    const sizeDescriptors = {
        small: ["small", "petite", "compact", "tight"],
        medium: ["rounded", "shapely", "firm", "well-formed"],
        large: ["full", "ample", "generous", "plump", "voluptuous"]
    };
    const sizeAdj = sizeDescriptors[size] ? pickRandom(sizeDescriptors[size]) : "shapely";
    
    const hipDescriptors = {
        narrow: ["narrow", "slender"],
        average: ["curved", "graceful"],
        wide: ["wide", "generous"]
    };
    const hipAdj = hipDescriptors[hipSize] ? pickRandom(hipDescriptors[hipSize]) : "curved";
    
    // Add arousal-based descriptors
    const { wetness, engorgement, state } = arousalDescriptors;
    const arousedDesc = state ? pickRandom(["flushed", "warm", "tingling", "needy"]) : "";
    
    // Various ways to describe buttocks
    const cheekTerms = pickRandom(["cheeks", "globes", "mounds", "orbs", "spheres"]);
    const buttTerms = pickRandom(["butt", "rear", "backside", "posterior"]);
    
    // Use at most one descriptor to avoid chaining (e.g., "needy shapely buttocks")
    const singleDesc = pickRandom([sizeAdj, arousedDesc, hipAdj].filter(Boolean)) || sizeAdj;
    
    return pickRandom([
        `${posPronoun} ${singleDesc} ${cheekTerms}`,
        `${posPronoun} ${singleDesc} ${buttTerms}`,
        `${posPronoun} ${singleDesc} ${cheekTerms}, ${hipAdj} hips`,
        `${posPronoun} ${singleDesc} buttocks`,
        `${posPronoun} ${singleDesc} backside`
    ]);
}

/**
 * Describe mouth/lips with rich detail
 */
function describeMouth(npc, anatomy, posPronoun, arousalDescriptors) {
    const body = anatomy.body || {};
    const surfaceType = body.surfaceType || "skin";
    
    return pickRandom([
        `${posPronoun} ${pickRandom(["soft", "warm", "inviting", "parted", "pouty"])} lips`,
        `${posPronoun} ${pickRandom(["sweet", "warm", "soft", "moist"])} mouth`,
        `${posPronoun} ${pickRandom(["full", "plump", "sensual", "kissable"])} lips`
    ]);
}

/**
 * Describe thighs with rich detail
 */
function describeThighs(npc, anatomy, posPronoun, arousalDescriptors) {
    const buttocks = anatomy.buttocks || {};
    const size = buttocks.sizeCategory || "medium";
    
    const descriptors = {
        small: ["slender", "lean", "delicate"],
        medium: ["shapely", "firm", "well-formed"],
        large: ["thick", "ample", "generous", "full"]
    };
    const sizeAdj = descriptors[size] ? pickRandom(descriptors[size]) : "soft";
    
    return pickRandom([
        `${posPronoun} ${sizeAdj} thighs`,
        `${posPronoun} ${sizeAdj} inner thighs`,
        `${posPronoun} ${pickRandom(["smooth", "soft", "warm"])} ${sizeAdj} thighs`,
        `${posPronoun} ${sizeAdj} thighs`
    ]);
}

/**
 * Get possessive pronoun helper for the describer
 */
function getPossessiveForDescriber(npc) {
    return typeof getPossessivePronoun === 'function' ? getPossessivePronoun(npc) : "their";
}

/**
 * Enhance action label with rich anatomy descriptions
 * Replaces generic body part references with detailed, sensual descriptions
 * @param {Object} npc - The NPC
 * @param {string} label - The action label (e.g., "Lick vagina", "Touch breasts")
 * @param {Object} context - Additional context (arousalLevel, action type, etc.)
 * @returns {string} - Enhanced label with rich anatomy descriptions
 */
function enhanceActionLabel(npc, label, context = {}) {
    if (!npc || !label) return label;
    
    const { arousalLevel = 0, actionType, actId } = context;
    // Check nsfwTraits first (sexual anatomy), then fallback to regular anatomy
    const nsfwAnatomy = (npc.nsfwTraits && npc.nsfwTraits.anatomy) || {};
    const regularAnatomy = npc.anatomy || {};
    const anatomy = { ...regularAnatomy, ...nsfwAnatomy };
    const gender = (npc.gender || "").toLowerCase();
    const isFemale = gender === "female" || gender.includes("female");
    
    // Body parts that can be enhanced
    const bodyPartPatterns = [
        // Vagina/pussy
        { patterns: [/\bpussy\b/i, /\bvagina\b/i, /\bclitoris\b/i, /\bclit\b/i, /\blabia\b/i], target: "vagina" },
        // Penis
        { patterns: [/\bpenis\b/i, /\bcock\b/i, /\bdick\b/i, /\bshaft\b/i], target: "penis" },
        // Testicles
        { patterns: [/\bballs\b/i, /\btesticles\b/i, /\btestes\b/i, /\bsac\b/i], target: "testicles" },
        // Breasts
        { patterns: [/\bbreasts\b/i, /\bboobs\b/i, /\btits\b/i, /\bbust\b/i, /\bchest\b/i], target: "breasts" },
        // Nipples
        { patterns: [/\bnipples\b/i, /\bnipple\b/i, /\bteats\b/i, /\bpeaks\b/i], target: "nipples" },
        // Anus/Butt
        { patterns: [/\banus\b/i, /\bass\b/i, /\bbuttocks\b/i, /\bbutt\b/i, /\brear\b/i], target: "anus" },
        // Mouth/Lips
        { patterns: [/\blips\b/i, /\bmouth\b/i], target: "mouth" },
        // Thighs
        { patterns: [/\bthighs\b/i, /\bthigh\b/i], target: "thighs" }
    ];
    
    let enhancedLabel = label;
    const posPronoun = typeof getPossessivePronoun === 'function' ? getPossessivePronoun(npc) : "their";

    // Check if this is a "receive" action (player is bottom)
    const act = typeof getAct === 'function' ? getAct(actId || label) : null;
    const isPlayerBottom = act && act.playerIsBottom === true;

    // Over-clothes actions: do NOT enhance body part references with rich
    // anatomy descriptions, since that would reveal hidden physical
    // characteristics (breast size, nipple details) through clothing.
    if (actId && actId.includes("_clothed")) {
        return label;
    }

    // Determine arousal state based on context
    const isAroused = arousalLevel > 50;
    const isWet = arousalLevel > 60 || (isFemale && arousalLevel > 40);
    const isErect = (isFemale && arousalLevel > 50) || (!isFemale && arousalLevel > 30);
    
    for (const { patterns, target } of bodyPartPatterns) {
        for (const pattern of patterns) {
            if (pattern.test(enhancedLabel)) {
                // Only enhance if the body part is not already described in a rich way
                // Skip if it's part of a longer descriptive phrase
                const match = enhancedLabel.match(pattern);
                if (match) {
                    const described = describeAnatomy(npc, target, {
                        arousalLevel,
                        isAroused,
                        isWet,
                        isErect,
                        possessivePronoun: posPronoun
                    });
                    
                    // Replace the match with the rich description
                    // But only if it's a standalone reference, not part of a larger word
                    enhancedLabel = enhancedLabel.replace(pattern, described);
                }
            }
        }
    }
    
    return enhancedLabel;
}

/**
 * Get suggested positions for current state
 */
function getSuggestedPositions(npc) {
    if (!npc || !npc.intimacy) return [];
    
    // Ensure position object exists
    if (!npc.intimacy.position) {
        npc.intimacy.position = {
            player: DEFAULT_POSITION,
            npc: DEFAULT_POSITION
        };
    }
    
    const currentPosition = npc.intimacy.position.player;
    const allPositions = getAllPositionIds();
    
    // Filter out current position
    const otherPositions = allPositions.filter(p => p !== currentPosition);
    
    // Limit to 3-5 suggestions
    return otherPositions.slice(0, 5);
}

// ============================================================================
// EXPORT
// ============================================================================

// Export all functions and data
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // From data files
        ...(typeof INTIMACY_POSITIONS !== 'undefined' ? { INTIMACY_POSITIONS } : {}),
        ...(typeof DEFAULT_POSITION !== 'undefined' ? { DEFAULT_POSITION } : {}),
        ...(typeof getPosition !== 'undefined' ? { getPosition } : {}),
        ...(typeof INTIMACY_MATRIX !== 'undefined' ? { INTIMACY_MATRIX } : {}),
        ...(typeof ACT_TYPES !== 'undefined' ? { ACT_TYPES } : {}),
        ...(typeof CLOTHING_REQUIREMENTS !== 'undefined' ? { CLOTHING_REQUIREMENTS } : {}),
        ...(typeof VIRGINITY_TYPES !== 'undefined' ? { VIRGINITY_TYPES } : {}),
        ...(typeof SEX_ACTS !== 'undefined' ? { SEX_ACTS } : {}),
        ...(typeof AROUSAL_CONFIG !== 'undefined' ? { AROUSAL_CONFIG } : {}),
        ...(typeof INTIMACY_STAGES !== 'undefined' ? { INTIMACY_STAGES } : {}),
        ...(typeof CLIMAX_CONFIG !== 'undefined' ? { CLIMAX_CONFIG } : {}),
        
        // State management
        initializeIntimacyState,
        resetIntimacyState,
        startIntimacyEncounter,
        endIntimacyEncounter,
        updateLastActivity,
        
        // Action generation
        generateValidActions,
        applyStageFiltering,
        checkToolTargetAccessibility,
        getClothingForBodyPart,
        getTargetCoveredParts,
        isActionValid,
        checkActionValidity,
        generateAllActionsWithStatus,
        applyStageFilteringToSingleAction,
        getDisabledHintText,
        
        // Action execution
        executeIntimacyAction,
        handleClothingAction,
        handlePenetrationAction,
        handleVirginityLoss,
        updateArousal,
        generateActionResponse,
        buildActionContext,
        buildClothingDescription,
        buildIntimacyPrompt,
        buildContinuityContext,
        buildPersonalityContext,
        describeArousalLevel,
        buildFallbackResponse,
        generateEndResponse,
        
        // Climax and consequences
        handleClimax,
        determineMaleCooldown,
        handleFluidConsequence,
        checkPregnancyRisk,
        attemptPregnancy,
        checkCooldownForAction,
        isOnCooldown,
        getRemainingCooldown,
        formatCooldownTime,
        
        // Menu
        organizeActionsForMenu,
        getMenuActions,
        getIntimacyActionAccent,
        getIntimacyLustDelta,
        applyIntimacyLustGain,
        getIntimacyActSlot,
        getEngagedActs,
        getEngagedActIds,
        isActEngaged,
        getActionCategory,
        getMinimumPhaseForAction,
        getPhaseName,
        
        // Lube
        addLube,
        useLube,
        hasLube,
        handleLubeFromAction,
        consumeLubeForPenetration,
        
        // Position
        changePosition,
        getSuggestedPositions,
        buildPositionChangeNarration,
        buildPositionChangeNPCResponse,
        getClothingStateForCharacter,
        
        // Narrative
        buildIntimacyResponse,
        getPossessivePronoun,
        getSubjectPronoun,
        getObjectPronoun,
        
        // Anatomy Describer
        describeAnatomy,
        getArousalDescriptors,
        enhanceActionLabel,
        describeVagina,
        describePenis,
        describeTesticles,
        describeBreasts,
        describeNipples,
        describeAnus,
        describeButtocks,
        describeMouth,
        describeThighs,
        
        // Narrative Generator
        generateIntimacyNarrative,
        buildActionNarratives,
        verbConjugation,
        buildVaginaNarratives,
        buildPenisNarratives,
        buildTesticlesNarratives,
        buildBreastNarratives,
        buildAnusNarratives,
        buildButtockNarratives,
        buildMouthNarratives,
        buildThighNarratives,
        getPubicDescription,
        getSkinDescription,
        getVaginalInteriorColor,
        getAnalInteriorColor,
        isAnalEntryEasy,
        isCivilizedSpecies,
        canNPCSpeak,
        getNPCDialogueStyle,
        getMergedAnatomy
    };
}

// ── SMELL NOTES ──────────────────────────────────────────────────────────
// Lingering scent marks for the messy acts (ejaculation / watersports / anal
// - see getIntimacySmellKey). Whoever RECEIVED gets stamped with a note; the
// note's display text is authored here (NSFW side) and only passed through by
// the SFW files (context builder prompt lines, NPC detail panel). Notes fade
// after SMELL_NOTE_TURNS story turns, refresh on a repeat mark, and wash off
// at water/hygiene room objects (washAtRoomObject clears the player's).
var SMELL_NOTE_TEXTS = {
    semen: "the unmistakable musk of fresh semen",
    urine: "the sharp ammonia sting of urine",
    anal: "the raw, lingering musk of anal sex"
};
var SMELL_NOTE_TURNS = 50;

function addSmellMark(entity, key) {
    if (!entity || !Object.prototype.hasOwnProperty.call(SMELL_NOTE_TEXTS, key)) return;
    if (!Array.isArray(entity.smellNotes)) entity.smellNotes = [];
    var turn = (typeof window.getCurrentStoryTurn === "function") ? window.getCurrentStoryTurn() : 0;
    for (var i = 0; i < entity.smellNotes.length; i++) {
        if (entity.smellNotes[i] && entity.smellNotes[i].key === key) {
            entity.smellNotes[i].turn = turn; // repeat mark refreshes the clock
            return;
        }
    }
    entity.smellNotes.push({ key: key, text: SMELL_NOTE_TEXTS[key], turn: turn });
}

// Prune expired notes on read so the expiry needs no tick loop of its own.
function getActiveSmellNotes(entity) {
    if (!entity || !Array.isArray(entity.smellNotes) || !entity.smellNotes.length) return [];
    var now = (typeof window.getCurrentStoryTurn === "function") ? window.getCurrentStoryTurn() : 0;
    var active = entity.smellNotes.filter(function (note) {
        return note && (now - (note.turn || 0)) < SMELL_NOTE_TURNS;
    });
    if (active.length !== entity.smellNotes.length) entity.smellNotes = active;
    return active.slice();
}

// Which lingering smell (if any) an act leaves on its receiver. Returns null
// for ordinary acts. Semen takes precedence over anal (ejaculate_in_anus is
// both - the semen is the dominant note).
function getIntimacySmellKey(act) {
    if (!act) return null;
    var consequence = String(act.consequence || "");
    if (consequence === "internal_semen" || consequence === "oral_semen" || consequence === "external_semen") return "semen";
    if (consequence === "urine") return "urine";
    // Anal penetration with a penis, either direction: the bottom carries the
    // telltale musk afterwards. Fingers/tongue don't mark the same way.
    if ((act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE) &&
        ((String(act.tool) === "penis" && String(act.target) === "anus") ||
         (String(act.tool) === "anus" && String(act.target) === "penis"))) {
        return "anal";
    }
    return null;
}

// ── BODY-USE STATE ────────────────────────────────────────────────────────
// Per-part recent-use record for the receiving character (live NPC or
// unconscious body object), so a recently-used hole reads differently from a
// fresh one in part descriptors - insertion narrations especially. Recorded
// by the encounter path (executeIntimacyAction) and the unconscious-body
// path (nsfw-system.js); read back by getBodyUseDescriptor wherever part
// descriptions are built or polished. Turn-stamped; recency tiers decide
// how strong the descriptor reads, and it fades to null on its own.
var BODY_USE_FRESH_TURNS = 40;
var BODY_USE_STALE_TURNS = 80;

var BODY_USE_PART_MAP = {
    vagina: "vagina", pussy: "vagina", cloaca: "vagina",
    anus: "anus", butthole: "anus",
    mouth: "mouth", lips: "mouth", face: "mouth",
    breasts: "breasts", chest: "breasts",
    // Their cock: stroked/handled or ridden - reads as used, never as a
    // "fucked hole" (part-aware wording in getBodyUseDescriptor).
    penis: "penis", cock: "penis"
};

function normalizeBodyUsePart(part) {
    return BODY_USE_PART_MAP[String(part || "").toLowerCase()] || null;
}

// What kind of use an act counts as, for descriptor wording. Cock
// penetration is a "fucking"; fingers and mouth/tongue are softer use that
// shouldn't read as "recently fucked" or "stretched" in later descriptors.
function getIntimacyUseKind(act) {
    if (!act) return null;
    var tool = String(act.tool || "").toLowerCase();
    var type = act.type;
    if ((type === ACT_TYPES.PENETRATE || type === ACT_TYPES.CONTINUE) && tool === "penis") return "penetrate";
    if (tool === "fingers" || tool === "finger" || tool === "hand" || tool === "hands") return "finger";
    if (tool === "mouth" || tool === "tongue") return "mouth";
    return null;
}

function recordBodyUse(entity, part, options) {
    part = normalizeBodyUsePart(part);
    if (!entity || !part) return;
    var turn = (typeof window.getCurrentStoryTurn === "function") ? window.getCurrentStoryTurn() : 0;
    if (!entity.bodyUse || typeof entity.bodyUse !== "object") entity.bodyUse = {};
    var state = entity.bodyUse[part];
    if (!state) state = entity.bodyUse[part] = {};
    state.usedTurn = turn;
    state.useCount = (state.useCount || 0) + 1;
    var kind = options && options.useKind;
    if (kind) {
        // A recorded fucking outranks softer use: a later finger/lick on the
        // same part refreshes recency but must not downgrade the descriptor
        // from "recently fucked" to "recently touched".
        if (!state.useKind || state.useKind === kind || kind === "penetrate" || state.useKind !== "penetrate") {
            state.useKind = kind;
        }
    }
    if (options && options.loadKey) {
        state.loadKey = options.loadKey;
        state.loadTurn = turn;
        // Volume tracking: repeated internal finishes tier the
        // narration (a single load reads very differently from bowels
        // packed with three).
        state.loadCount = (state.loadCount || 0) + 1;
    }
}

// Recency-tiered descriptor for a part, or null when it reads unused.
// Loads (semen/urine) DRY over time but never disappear on their own - the
// ladder is wet -> tacky -> crusted/flaky, and only a wash resets it (the
// unconscious-body "Clean them up" action, or the player washing at a
// basin/fountain for their own state). Use-only records (no load) still
// fade out entirely, since muscle tone recovers. Display text is authored
// here (NSFW side); callers only pass it through.
function getBodyUseDescriptor(entity, part) {
    part = normalizeBodyUsePart(part);
    var state = entity && entity.bodyUse && entity.bodyUse[part];
    if (!state) return null;
    var now = (typeof window.getCurrentStoryTurn === "function") ? window.getCurrentStoryTurn() : 0;
    var sinceUse = now - (state.usedTurn || 0);
    var sinceLoad = now - (state.loadTurn || 0);

    if (state.loadKey) {
        if (sinceLoad <= BODY_USE_FRESH_TURNS) {
            return state.loadKey === "urine"
                ? "still slick and wet with urine from earlier"
                : "stretched open and sloppy, your earlier load still drooling back out of it";
        }
        if (sinceLoad <= BODY_USE_STALE_TURNS) {
            return state.loadKey === "urine"
                ? "damp and clammy, the piss slowly drying on it"
                : "stretched and tacky, your earlier load gone thick and clumpy inside it";
        }
        // Dried loads persist indefinitely until washed off.
        return state.loadKey === "urine"
            ? "marked with a faint dried crust of old urine"
            : "chafed and crusty, flakes of your long-dried load clinging around the stretched opening";
    }
    if (sinceUse <= BODY_USE_FRESH_TURNS) {
        // Kind-aware wording: only cock penetration reads as "fucked".
        // Finger and mouth/tongue use leaves the part slick and sensitive,
        // not stretched - the AI polish prompt and the post-encounter notes
        // both feed from this text.
        var kind = state.useKind || "penetrate"; // legacy records predate useKind
        if (kind === "finger") return "still slick and sensitive from your recent fingering";
        if (kind === "mouth") return "wet and sensitive from your recent oral attention";
        if (kind === "hand") return "stiff and slick from your recent handling";
        // A recorded use of their penis reads as used/stiff, never as
        // a "fucked hole" (that wording is anatomically wrong there).
        if (part === "penis") return "slick and stiff from its recent use";
        return "stretched and slick from a recent fucking, easy to enter";
    }
    if (sinceUse <= BODY_USE_STALE_TURNS) {
        var staleKind = state.useKind || "penetrate";
        if (staleKind === "finger") return "faintly sensitive from your earlier fingering";
        if (staleKind === "mouth") return "faintly sensitive from your earlier oral attention";
        if (staleKind === "hand") return "faintly sensitive from your earlier handling";
        if (part === "penis") return "faintly slick from its earlier use";
        return "noticeably loosened, though the recent use is fading";
    }
    return null;
}

// Raw per-part use state (turn-stamped), or null.
function getPartBodyUseState(entity, part) {
    var p = normalizeBodyUsePart(part);
    return (entity && entity.bodyUse && p) ? entity.bodyUse[p] : null;
}

// True when the part still carries a FRESH load (semen/urine from the
// last few turns) - the sloppy-seconds case where re-entry squeezes the
// mess back out. Staler loads are read via getBodyUseDescriptor instead.
function hasFreshLoadIn(entity, part) {
    var st = getPartBodyUseState(entity, part);
    if (!st || !st.loadKey) return false;
    var now = (typeof window.getCurrentStoryTurn === "function") ? window.getCurrentStoryTurn() : 0;
    return (now - (st.loadTurn || 0)) <= BODY_USE_FRESH_TURNS;
}

// Entry-mode gate: is this hole "used" - loaded, or fucked within the
// fresh window - so a re-entry narrates completely differently from a
// first penetration. Consumed by the vaginal staged entry ("used" mode)
// and the anal entry pools.
function isHoleUsedForEntry(npc, part) {
    var st = getPartBodyUseState(npc, part);
    if (!st) return false;
    var now = (typeof window.getCurrentStoryTurn === "function") ? window.getCurrentStoryTurn() : 0;
    if (st.loadKey && (now - (st.loadTurn || 0)) <= BODY_USE_STALE_TURNS) return true;
    if (st.useKind === "penetrate" && (now - (st.usedTurn || 0)) <= BODY_USE_FRESH_TURNS) return true;
    return false;
}

// Flavor-word pool for a used hole. Loads make it messy/drenched, repeat
// fucking leaves it swollen/puffy/red, a hard session sweaty, lingering
// smell notes pungent; the baseline is just slick.
function getUsedHoleDescriptors(npc, part, arousalLevel) {
    var st = getPartBodyUseState(npc, part);
    if (!st) return ["slick"];
    var now = (typeof window.getCurrentStoryTurn === "function") ? window.getCurrentStoryTurn() : 0;
    var out = [];
    if (st.loadKey && (now - (st.loadTurn || 0)) <= BODY_USE_FRESH_TURNS) {
        out.push("messy", "drenched");
    } else if (st.loadKey) {
        out.push("sticky");
    }
    if ((st.useCount || 0) >= 2) out.push("swollen");
    if ((st.useCount || 0) >= 3) out.push("puffy", "red");
    if ((arousalLevel || 0) > 60 || (st.useCount || 0) >= 3) out.push("sweaty");
    if (typeof getActiveSmellNotes === "function" && getActiveSmellNotes(npc).length) out.push("pungent");
    if (!out.length) out.push("slick");
    return out;
}

// Assign to window for browser use
if (typeof window !== 'undefined') {
    window.initializeIntimacyState = initializeIntimacyState;
    window.addSmellMark = addSmellMark;
    window.getActiveSmellNotes = getActiveSmellNotes;

// ── ROOM MESS MARKS ──────────────────────────────────────────────────────
// Pee and cum puddles persist where they were made: wet and spreading
// for the first dozen turns, tacky and drying until MESS_TURNS, then
// gone. Stored on the room object (saved with the game state); the
// display text is authored here (NSFW side) and the engine only renders
// it through getRoomMessNotes.
var MESS_TURNS = 20;
var MESS_WET_TURNS = 12;

function addRoomMess(room, kind) {
    if (!room || typeof room !== "object") return;
    kind = String(kind || "").toLowerCase();
    if (["semen", "urine", "squirt"].indexOf(kind) === -1) return;
    var turn = (typeof window.getCurrentStoryTurn === "function") ? window.getCurrentStoryTurn() : 0;
    if (!Array.isArray(room.messMarks)) room.messMarks = [];
    // Same-kind mess in the same turn merges into a bigger puddle.
    for (var i = 0; i < room.messMarks.length; i++) {
        if (room.messMarks[i].kind === kind && room.messMarks[i].turn === turn) {
            room.messMarks[i].count = (room.messMarks[i].count || 1) + 1;
            return;
        }
    }
    room.messMarks.push({ kind: kind, turn: turn, count: 1 });
}

function _roomMessSurface(room) {
    // A bed fixture means the mess soaked the bedding, not the floor.
    try {
        var structural = (room && Array.isArray(room.structural)) ? room.structural : [];
        for (var i = 0; i < structural.length; i++) {
            if (structural[i] && /bed/i.test(String(structural[i].name || structural[i].label || ""))) {
                return "the bedding";
            }
        }
    } catch (e) {}
    return "the floor";
}

// Prune expired marks on read, then describe the survivors.
function getRoomMessNotes(room) {
    if (!room || !Array.isArray(room.messMarks) || !room.messMarks.length) return [];
    var now = (typeof window.getCurrentStoryTurn === "function") ? window.getCurrentStoryTurn() : 0;
    var active = room.messMarks.filter(function (m) { return (now - m.turn) < MESS_TURNS; });
    if (active.length !== room.messMarks.length) room.messMarks = active;
    if (!active.length) return [];
    var surface = _roomMessSurface(room);
    var out = [];
    active.forEach(function (m) {
        var since = now - m.turn;
        var big = (m.count || 1) >= 2;
        if (m.kind === "semen") {
            out.push(since <= MESS_WET_TURNS
                ? (big
                    ? "Broad puddles of fresh cum glisten on " + surface + ", still slowly spreading."
                    : "A white puddle of fresh cum stains " + surface + ".")
                : (big
                    ? "Tacky, half-dried streaks of cum darken " + surface + "."
                    : "A faint, dried cum-stain marks " + surface + "."));
        } else if (m.kind === "urine") {
            out.push(since <= MESS_WET_TURNS
                ? (big
                    ? "Dark puddles of piss spread across " + surface + ", sharp-smelling."
                    : "A dark puddle of piss spreads across " + surface + ", its smell sharp.")
                : (big
                    ? "Faint, mostly-dried piss-stains darken " + surface + "."
                    : "A faint, dried piss-stain marks " + surface + "."));
        } else if (m.kind === "squirt") {
            out.push(since <= MESS_WET_TURNS
                ? "A splattered patch of wetness soaks " + surface + "."
                : "A dried patch of wetness marks " + surface + ".");
        }
    });
    return out;
}

    window.addRoomMess = addRoomMess;
    window.getRoomMessNotes = getRoomMessNotes;
    window.getIntimacySmellKey = getIntimacySmellKey;
    window.normalizeBodyUsePart = normalizeBodyUsePart;
    window.recordBodyUse = recordBodyUse;
    window.getBodyUseDescriptor = getBodyUseDescriptor;
    window.buildEngagedActContinueSentence = buildEngagedActContinueSentence;
    window.resetIntimacyState = resetIntimacyState;
    window.startIntimacyEncounter = startIntimacyEncounter;
    window.endIntimacyEncounter = endIntimacyEncounter;
    window.updateArousal = updateArousal;
    window.handleClimax = handleClimax;
    window.executeIntimacyAction = executeIntimacyAction;
    window.getMenuActions = getMenuActions;
    window.collectIntimacyItemActs = collectIntimacyItemActs;
    window.injectIntimacyItemActs = injectIntimacyItemActs;
    window.getIntimacyActionAccent = getIntimacyActionAccent;
    window.getIntimacyLustDelta = getIntimacyLustDelta;
    window.applyIntimacyLustGain = applyIntimacyLustGain;
    window.getIntimacyActSlot = getIntimacyActSlot;
    window.getEngagedActs = getEngagedActs;
    window.getEngagedActIds = getEngagedActIds;
    window.isActEngaged = isActEngaged;
    window.CLIMAX_CONFIG = CLIMAX_CONFIG;
    window.checkActionValidity = checkActionValidity;
    window.generateAllActionsWithStatus = generateAllActionsWithStatus;
    window.applyStageFilteringToSingleAction = applyStageFilteringToSingleAction;
    window.getDisabledHintText = getDisabledHintText;
    window.buildIntimacyResponse = buildIntimacyResponse;
    window.getPossessivePronoun = getPossessivePronoun;
    window.getSubjectPronoun = getSubjectPronoun;
    window.getObjectPronoun = getObjectPronoun;
    window.changePosition = changePosition;
    window.npcCannotSpeak = npcCannotSpeak;
    window.stripSpeechFromText = stripSpeechFromText;
    window.buildPositionChangeNarration = buildPositionChangeNarration;
    window.buildPositionChangeNPCResponse = buildPositionChangeNPCResponse;
    window.describeAnatomy = describeAnatomy;
    window.getArousalDescriptors = getArousalDescriptors;
    window.enhanceActionLabel = enhanceActionLabel;
    window.generateIntimacyNarrative = generateIntimacyNarrative;
    window.buildReceiveLeadIn = buildReceiveLeadIn;
    window.generateReceiveAgreement = generateReceiveAgreement;
    window.getSkinDescription = getSkinDescription;
    window.getVaginalInteriorColor = getVaginalInteriorColor;
    window.getAnalInteriorColor = getAnalInteriorColor;
    window.getScentDescriptor = getScentDescriptor;
    window.isAnalEntryEasy = isAnalEntryEasy;
    window.getNPCSize = getNPCSize;
    window.getPlayerSize = getPlayerSize;
    window.getRelativeSize = getRelativeSize;
    window.getSizeContext = getSizeContext;
    window.getNippleState = getNippleState;
    window.scaleArousal = scaleArousal;
    window.canCompleteAnalInsertion = canCompleteAnalInsertion;
    window.getNPCAnatomyType = getNPCAnatomyType;
    window.hasNPCTail = hasNPCTail;
    window.isCivilizedSpecies = isCivilizedSpecies;
    window.canNPCSpeak = canNPCSpeak;
    window.getNPCDialogueStyle = getNPCDialogueStyle;
    window.UNCIVILIZED_DIALOGUE = UNCIVILIZED_DIALOGUE;
    window.NONVERBAL_REACTIONS = NONVERBAL_REACTIONS;
    window.LLM_ENHANCEMENT_CONFIG = LLM_ENHANCEMENT_CONFIG;
    window.isSexualAct = isSexualAct;
    window.clearLLMEnhancementCache = clearLLMEnhancementCache;
    window.buildPlayerNarrativePrompt = buildPlayerNarrativePrompt;
    window.getCachedPlayerNarrative = getCachedPlayerNarrative;
    window.cachePlayerNarrative = cachePlayerNarrative;
    window.purgeCachedPlayerNarrative = purgeCachedPlayerNarrative;
    window.prefetchPenetrationContinue = prefetchPenetrationContinue;
    window.getCachedPenetrationResponse = getCachedPenetrationResponse;
    window.cachePenetrationResponse = cachePenetrationResponse;
    window.prefetchClothingReveals = prefetchClothingReveals;
    window.buildClothingRevealPrompt = buildClothingRevealPrompt;
    window.buildClothingRevealKey = buildClothingRevealKey;
    window.getCachedClothingReveal = getCachedClothingReveal;
    window.cacheClothingReveal = cacheClothingReveal;
    window.purgeCachedClothingReveal = purgeCachedClothingReveal;
}

// ============================================================================
// NARRATIVE GENERATOR
// Creates flowing, sensual action narratives with rich anatomy descriptions
// ============================================================================

/**
 * Build custom narrative for actions on bound/captive NPCs
 * Describes forceful actions on a physically restrained NPC
 */
function buildCaptiveNarrative(npc, act, player) {
    if (!npc || !act) return null;
    
    const npcName = npc.name || "them";
    const tool = act.tool || "hand";
    let target = act.target || "body";
    const verb = act.verb || "touch";
    
    // Replace special targets with appropriate body parts for narrative
    if (target === "npc" || target === "player") {
        target = "body";
    }
    
    // Oral penetration on bound captive
    if (target === "mouth" || target === "lips" || act.id.toLowerCase().includes("mouth") || act.id.toLowerCase().includes("oral")) {
        if (tool === "penis" || tool === "cock" || tool === "dick") {
            return `With ${npcName} securely bound and unable to resist, you force your cock into their mouth, thrusting past their helpless lips.`;
        }
    }
    
    // Vaginal penetration on bound captive
    if (target === "vagina" || target === "pussy" || act.id.toLowerCase().includes("vagina") || act.id.toLowerCase().includes("pussy")) {
        if (tool === "penis" || tool === "cock" || tool === "dick") {
            return `You position yourself over ${npcName}, their bound body unable to resist as you push your cock into their ${target}.`;
        }
    }
    
    // Anal penetration on bound captive
    if (target === "anus" || target === "ass" || act.id.toLowerCase().includes("anal") || act.id.toLowerCase().includes("anus")) {
        if (tool === "penis" || tool === "cock" || tool === "dick") {
            return `With ${npcName} bound and helpless, you spread their cheeks and force your cock into their tight entrance.`;
        }
    }
    
    // Generic for bound NPC
    return `You take advantage of ${npcName}'s bound state, ${verb}ing their ${target} as they struggle vainly against their restraints.`;
}

/**
 * Build custom narrative for actions on submissive/meek NPCs
 * Describes consensual but dominant actions on a willing subordinate
 */
function buildSubmissiveNarrative(npc, act, player) {
    if (!npc || !act) return null;
    
    const npcName = npc.name || "them";
    const tool = act.tool || "hand";
    let target = act.target || "body";
    
    // Replace special targets with appropriate body parts for narrative
    if (target === "npc" || target === "player") {
        target = "body";
    }
    const verb = act.verb || "touch";
    
    // Oral on submissive
    if (target === "mouth" || target === "lips" || act.id.toLowerCase().includes("mouth") || act.id.toLowerCase().includes("oral")) {
        if (tool === "penis" || tool === "cock" || tool === "dick") {
            return `${npcName} opens their mouth obediently, willingly taking your cock between their lips as you guide yourself in.`;
        }
    }
    
    // Vaginal on submissive
    if (target === "vagina" || target === "pussy" || act.id.toLowerCase().includes("vagina") || act.id.toLowerCase().includes("pussy")) {
        if (tool === "penis" || tool === "cock" || tool === "dick") {
            return `${npcName} spreads their legs for you, eagerly accepting your cock into their ${target} with a submissive moan.`;
        }
    }
    
    // Anal on submissive
    if (target === "anus" || target === "ass" || act.id.toLowerCase().includes("anal") || act.id.toLowerCase().includes("anus")) {
        if (tool === "penis" || tool === "cock" || tool === "dick") {
            return `${npcName} presents themselves for you, willingly taking your cock into their back passage.`;
        }
    }
    
    // Generic for submissive
    return `You ${verb} ${npcName}'s ${target}, their submissive nature evident as they willingly accept your attention.`;
}

/**
 * Build custom narrative for actions on unconscious NPCs
 * Since they can't resist or react, the narrative describes forceful/non-consensual actions
 */
function buildUnconsciousNarrative(npc, act, player) {
    if (!npc || !act) return null;

    const subj = (typeof getSubjectPronoun === "function" ? getSubjectPronoun(npc) : null) || "She";
    const subjLower = subj.toLowerCase();
    const poss = (typeof getPossessivePronoun === "function" ? getPossessivePronoun(npc) : null) || "her";
    const obj = (typeof getObjectPronoun === "function" ? getObjectPronoun(npc) : null) || "her";
    const tool = act.tool || "hand";
    let target = act.target || "body";
    const verb = act.verb || "touch";

    // Replace special targets with appropriate body parts for narrative
    if (target === "npc" || target === "player") {
        target = "body"; // Use generic "body" for clothing removal actions on self/other
    }

    // Custom narratives for specific actions
    const actId = act.id || "";

    // Oral penetration on unconscious NPC
    // Only match actual penetration acts (fuck, thrust, deepthroat, etc.) not tease/rub acts
    const isPenetrativeVerb = ["fuck", "thrust", "deepthroat", "penetrate", "enter"].includes(verb.toLowerCase());
    if (isPenetrativeVerb && (target === "mouth" || target === "lips")) {
        if (tool === "penis" || tool === "cock" || tool === "dick") {
            return `You plug ${poss} nose and ${subjLower} instinctively gasps for air, ${poss} mouth falling open. You push your cock past ${poss} slack lips and deep into ${poss} unresisting throat.`;
        }
    }

    // Vaginal penetration on unconscious NPC
    if (target === "vagina" || target === "pussy" || actId.toLowerCase().includes("vagina") || actId.toLowerCase().includes("pussy")) {
        if (tool === "penis" || tool === "cock" || tool === "dick") {
            return `With ${subjLower} completely limp, you position yourself and press your cock into ${poss} ${target}. ${subj.charAt(0).toUpperCase() + subj.slice(1)} offers no resistance as you push deep inside.`;
        }
        if (tool === "fingers" || tool === "hand" || tool === "digit") {
            return `You spread ${poss} legs and slide your fingers into ${poss} unresisting ${target}, ${poss} body completely limp.`;
        }
    }

    // Anal penetration on unconscious NPC
    if (target === "anus" || target === "ass" || target === "butt" || actId.toLowerCase().includes("anal") || actId.toLowerCase().includes("anus")) {
        if (tool === "penis" || tool === "cock" || tool === "dick") {
            return `You lift ${poss} hips and press your cock against ${poss} tight entrance. With no resistance, you push forward, your cock sinking into ${poss} back passage.`;
        }
        if (tool === "fingers" || tool === "hand") {
            return `You probe at ${poss} back entrance with your fingers, ${poss} limp body offering no resistance as you push inside.`;
        }
    }

    // Breast/tits actions on unconscious NPC
    if (target === "breasts" || target === "tits" || target === "nipples" || actId.toLowerCase().includes("breast") || actId.toLowerCase().includes("nipple")) {
        return `You handle ${poss} bare, limp breasts at will, squeezing and kneading ${poss} unresisting flesh.`;
    }

    // Repositioning a dead-weight body
    if (verb === "reposition" || actId === "reposition_unconscious") {
        return `You grip ${obj} under the arms and drag ${poss} limp body around until ${subjLower} lies where you want ${obj}, heavy and unresisting the whole way.`;
    }

    // Generic penetration/insertion
    if (verb === "penetrate" || verb === "enter" || verb === "insert" || verb === "thrust" || verb === "pound") {
        return `You take advantage of ${poss} unconscious state and ${verb} ${obj} without resistance, ${poss} body completely at your mercy.`;
    }

    // Generic action - describe the act on an unresisting body
    return `You ${verb} ${poss} ${target} as ${subjLower} lies motionless, ${poss} body completely unresisting to your touch.`;
}

/**
 * Generate a rich narrative for an intimacy action
 * Creates flowing sentences like: "You part her brown pubs and expose her meaty vagina, sliding your tongue between her engorged labia..."
 * @param {Object} npc - The NPC
 * @param {string} actionId - The action ID (e.g., "lick_pussy", "touch_breasts")
 * @param {Object} context - Additional context (arousalLevel, player, etc.)
 * @returns {string} - A rich narrative sentence
 */
function generateIntimacyNarrative(npc, actionId, context = {}) {
    if (!npc || !actionId) return null;
    
    const { player, arousalLevel = 0, isAroused = false, isWet = false, isErect = false, isOnCooldown = false, isContinueAction = false, intimacy = null } = context;
    const act = typeof getAct === 'function' ? getAct(actionId) : null;
    if (!act) return null;
    
    // Check if NPC is unconscious/sleeping - use custom unconscious narratives
    const isUnconscious = (typeof window.isNPCUnconscious === "function" && window.isNPCUnconscious(npc)) ||
                       (npc && (npc.bodyState === "unconscious" || npc.isUnconsciousBody === true || npc.unconscious === true));
    const isSleeping = (typeof window.isNPCSleeping === "function" && window.isNPCSleeping(npc)) ||
                     (npc && npc.currentState && npc.currentState.sleeping);
    
    if (isUnconscious || isSleeping) {
        const unconsciousNarrative = buildUnconsciousNarrative(npc, act, player);
        if (unconsciousNarrative) return unconsciousNarrative;
    }
    
    // Check if NPC is bound/captive - use custom captive narratives
    if (npc && (npc.bound || (npc._surrenderData && !npc._surrenderData.voluntary))) {
        const captiveNarrative = buildCaptiveNarrative(npc, act, player);
        if (captiveNarrative) return captiveNarrative;
    }
    
    // Check if NPC is submissive/meek (voluntarily surrendered) - use custom submissive narratives
    if (npc && npc._surrenderData && npc._surrenderData.voluntary) {
        const submissiveNarrative = buildSubmissiveNarrative(npc, act, player);
        if (submissiveNarrative) return submissiveNarrative;
    }
    
    const { verb, target, tool, label } = act;
    const posPronoun = typeof getPossessivePronoun === 'function' ? getPossessivePronoun(npc) : "their";
    const subjectPronoun = typeof getSubjectPronoun === 'function' ? getSubjectPronoun(npc) : "They";
    const objPronoun = typeof getObjectPronoun === 'function' ? getObjectPronoun(npc) : "them";
    
    // ── RECEIVE ACTIONS (playerIsBottom) ───────────────────────
    // For receive actions, the NPC is the actor and the player is the
    // target. Use dedicated narrative builder that describes the NPC
    // acting on the player's body (using "your" for player parts).
    if (act.playerIsBottom) {
        var receiveNarratives = buildReceiveNarrative(npc, act, { isContinueAction });
        var receiveNarrative = pickUnique(receiveNarratives, intimacy, "narrative");
        return receiveNarrative || receiveNarratives[0];
    }
    
    // Build transition narrative if switching from a different action or for first action
    let transitionNarrative = "";
    if (intimacy && !isContinueAction) {
        const lastActId = intimacy.lastAction ? intimacy.lastAction.actId : null;
        
        // If there's a last action and it's different from current
        if (lastActId && lastActId !== actionId) {
            const lastAct = typeof getAct === 'function' ? getAct(lastActId) : null;
            if (lastAct) {
                transitionNarrative = buildTransitionNarration(npc, lastAct, act, { posPronoun, objPronoun }, player);
            }
        } else if (!lastActId) {
            // First action in encounter - add initial contact description
            transitionNarrative = buildInitialContactNarration(npc, act, { posPronoun }, player);
        }
    }
    
    // Determine action category and generate appropriate narrative
    const narratives = buildActionNarratives(npc, actionId, act, { ...context, isContinueAction });

    // Pick a narrative, avoiding recent repeats (anti-repetition)
    let finalNarrative = pickUnique(narratives, intimacy, "narrative");

    // Inject sensory fragments (friction, fluids, skin, pubic hair, partial withdrawal)
    // These add variety and erotic detail to otherwise repetitive templates.
    if (finalNarrative) {
        // Insertive acts put the tool inside: penetration/continue acts, finger
        // entry, and tongue penetration. External acts (press, rub, tease,
        // spread) never get interior-flavored fragments like "the slick
        // channel accepting you smoothly" — that read as penetration during
        // a press and confused the act being performed.
        var _toolLc = String(act.tool || "").toLowerCase();
        var _verbLc = String(act.verb || "").toLowerCase();
        var _isInsertiveAct = act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE
            || (_toolLc === "fingers" && (_verbLc === "finger" || _verbLc === "enter"))
            || ((_toolLc === "mouth" || _toolLc === "tongue") && _verbLc === "penetrate");
        var sensory = getSensoryFragment(npc, act.target, intimacy, {
            player: player,
            isAroused: isAroused,
            isWet: isWet,
            hasLube: intimacy ? intimacy.hasLube : false,
            isPenetration: act.type === "penetrate" || act.type === "continue",
            isInsertive: _isInsertiveAct,
            tool: act.tool
        });
        if (sensory) {
            // Clause fragments slot in before the final period.
            if (sensory.clauses) {
                finalNarrative = finalNarrative.replace(/\.$/, sensory.clauses + ".");
            }
            // Sentence fragments (partial withdrawal) are appended after the
            // base text as their own sentences — splicing them in front of
            // the final period produced "…bit of you You pull back…in..".
            if (sensory.sentences) {
                var _senBase = finalNarrative.replace(/\s+$/, "");
                if (!/[.!?…]$/.test(_senBase)) _senBase += ".";
                finalNarrative = _senBase + " " + sensory.sentences.trim();
            }
        }
    }

    // When we have a transition/initial-contact narrative, use ONLY that as
    // the player narration. The transition already describes the action
    // (e.g. "You lean in and kiss her cheek"), so appending the action
    // narrative ("Your mouth kisses her cheek") produces redundant repetition.
    // EXCEPTION: penetration entry acts. Their staged inch-by-inch entry
    // narrative is far richer than the one-line contact description
    // ("You position yourself, guiding your cock to her vagina"), so for
    // those the entry narrative wins.
    var _isEntryAct = act.type === "penetrate" || (typeof ACT_TYPES !== "undefined" && act.type === ACT_TYPES.PENETRATE);
    // Climax acts are exempt too: their full staged narrative (mouth
    // gulping, internal release) must not be flattened into a
    // one-line transition ("You ejaculate onto their stomach...").
    var _isClimaxAct = !!act.triggersClimax;
    // Spit acts too: their dedicated pool (buildSpitOnNarratives) reads
    // far better than the initial-contact line, and "your mouth spit on
    // her anus" confused the act with oral.
    var _isSpitOnAct = String(act.verb || "").toLowerCase() === "spit on";
    if (transitionNarrative && !_isEntryAct && !_isClimaxAct && !_isSpitOnAct) {
        var t = transitionNarrative.trim();
        if (!t.match(/[.!?]$/)) t += ".";
        finalNarrative = t;
    }

    // ── CLOTHING REVEAL AI ENRICHMENT ─────────────────────────────
    // For NPC-targeted clothing actions, check the clothing reveal
    // cache for an AI-enriched narration. If cached, use + purge it.
    // If not cached, fire a background prefetch for next time.
    // This is the clothing equivalent of the player narrative polish
    // below — it replaces the plain "You remove her top." with a vivid
    // reveal narration seeded by the NPC's visible descriptors and
    // the anatomy of the body part being uncovered.
    if (intimacy && act.type === ACT_TYPES.CLOTHING && act.target === "npc") {
        var _clAi = (typeof window !== 'undefined' && typeof window.ai === 'function') ? window.ai : (typeof ai === 'function' ? ai : null);
        var _revealKey = buildClothingRevealKey(npc, act);

        var cachedReveal = getCachedClothingReveal(intimacy, _revealKey);
        if (cachedReveal) {
            console.log("[Intimacy Clothing] Using cached reveal for", actionId);
            purgeCachedClothingReveal(intimacy, _revealKey);
            return cachedReveal;
        }

        // Fire background AI to enrich the clothing reveal for next time
        if (_clAi) {
            (async function() {
                try {
                    var _templateResp = finalNarrative || buildClothingNarration(act, npc, context.player);
                    var _prompt = buildClothingRevealPrompt(npc, act, context.player, _templateResp);
                    console.log("[Intimacy Clothing] Background reveal prefetch for", actionId);
                    var _result = await _clAi({
                        instruction: _prompt,
                        startWith: "",
                        endButtons: "none",
                        generatorName: "cyoaftw-engine-core"
                    });
                    var _enriched = _result && (_result.text || _result);
                    if (_enriched && _enriched.trim()) {
                        var _isMeta = /since the base|please provide|I cannot|I'm unable|as an ai|i'll polish|here is the|here's the/i.test(_enriched.trim());
                        if (_isMeta) {
                            console.log("[Intimacy Clothing] Reveal rejected (meta-commentary) for", actionId);
                        } else {
                            cacheClothingReveal(intimacy, _revealKey, _enriched.trim());
                            console.log("[Intimacy Clothing] Cached reveal for", actionId, "(" + _enriched.substring(0, 60) + "...)");
                        }
                    }
                } catch (e) {
                    console.warn("[Intimacy Clothing] Reveal prefetch failed for", actionId, e);
                }
            })();
        }
    }

    // ── PLAYER NARRATIVE AI POLISH ────────────────────────────────
    // Check if we have a cached AI-polished player narrative for this
    // act+position. If so, use it AND re-arm the cache with a fresh
    // background polish, so repeated acts show polished text every time
    // instead of alternating between polished and raw template output.
    // Same non-blocking pattern as the NPC response cache.
    if (intimacy && !act.playerIsBottom) {
        var _ai = (typeof window !== 'undefined' && typeof window.ai === 'function') ? window.ai : (typeof ai === 'function' ? ai : null);
        var _currentPosition = (intimacy.position && intimacy.position.player) || "Unknown";
        // Keep the raw template for the prefetch — polishing an
        // already-polished cache hit compounds rewrites.
        var _templateNarrative = finalNarrative;

        // Check player narrative cache first
        var cachedPlayerNarr = getCachedPlayerNarrative(intimacy, actionId, _currentPosition);
        if (cachedPlayerNarr) {
            console.log("[Intimacy AI] Using cached player narrative for", actionId);
            purgeCachedPlayerNarrative(intimacy, actionId, _currentPosition);
            finalNarrative = cachedPlayerNarr;
        }

        // Fire background AI to polish the template narrative for next time
        if (_ai && isSexualAct(act)) {
            (async function() {
                try {
                    var posObj = (typeof getPosition === 'function') ? getPosition(_currentPosition) : null;
                    var playerContext = {
                        npc: npc,
                        player: player,
                        action: act,
                        position: posObj || { label: _currentPosition },
                        templateResponse: _templateNarrative
                    };
                    var prompt = buildPlayerNarrativePrompt(playerContext);
                    console.log("[Intimacy AI] Background player narrative prefetch for", actionId);
                    var result = await _ai({
                        instruction: prompt,
                        startWith: "",
                        endButtons: "none",
                        generatorName: "cyoaftw-engine-core"
                    });
                    var polished = result && (result.text || result);
                    if (polished && polished.trim()) {
                        // Reject meta-commentary
                        var _isMeta = /since the base|please provide|I cannot|I'm unable|as an ai|i'll polish|here is the|here's the polished/i.test(polished.trim());
                        if (_isMeta) {
                            console.log("[Intimacy AI] Player narrative rejected (meta-commentary) for", actionId);
                        } else {
                            cachePlayerNarrative(intimacy, actionId, _currentPosition, polished.trim());
                            console.log("[Intimacy AI] Cached player narrative for", actionId, "(" + polished.substring(0, 60) + "...)");
                        }
                    }
                } catch (e) {
                    console.warn("[Intimacy AI] Player narrative prefetch failed for", actionId, e);
                }
            })();
        }
    }

    // Cloaca-bearing NPCs: acts that target the hole narrate the vent, never
    // a mammalian anus (scaled, no wrinkled rim, no coarse hair). Cheek acts
    // (buttocks targets) keep their wording.
    var _cloacaTgtLc = String(act.target || "").toLowerCase();
    if (finalNarrative && !act.playerIsBottom && npcHasCloacaFlag(npc) &&
        (_cloacaTgtLc === "anus" || _cloacaTgtLc === "ass" || _cloacaTgtLc === "butthole")) {
        finalNarrative = _cloacaAnalWording(finalNarrative);
    }

    return finalNarrative;
}

/**
 * Build initial contact narration for the first action in an encounter
 */
/**
 * Build pronoun-correct narration for clothing removal/adjustment actions.
 * Uses act.target (player/npc), act.clothingItem (top/bottom/underwear),
 * and act.clothingAction (move_aside/lift/pull_down) to produce:
 *   "You remove her top." / "You remove your bottom." / "You undress her completely."
 *   "You move her top aside." / "You pull down her bottom." / "You lift your skirt."
 */
/**
 * Helper to get just the target body part with possessive pronoun (not the
 * full verb label). e.g. "Suck her nipples" → "her nipples".
 * This is what the transition/contact templates expect — a noun, not a
 * verb phrase, so we don't get "You move to her Suck her nipples".
 * Shared between buildInitialContactNarration and buildTransitionNarration.
 */

function getTargetNoun(actObj, posPronoun, npc) {
    var t = actObj && actObj.target ? actObj.target : "body";
    // For receive actions (playerIsBottom), the target is the player's body part
    if (actObj && actObj.playerIsBottom) {
        return "your " + t;
    }
    // Cloaca-bearing NPCs have a single vent instead of a separate anus:
    // anal narration reads "her cloaca", never "her anus" (mirrors the menu
    // relabelling in getGenderedLabel).
    if (npc && typeof npcHasCloacaFlag === "function" && npcHasCloacaFlag(npc) &&
        String(t).toLowerCase() === "anus") {
        return (posPronoun || "their") + " cloaca";
    }
    return (posPronoun || "their") + " " + t;
}

// Resolve the actual equipped garment name for a clothing key, so undressing
// narrates the real item ("her red shirt") instead of a generic "top".
function _getWornGarmentName(character, clothingKey) {
    var slotMap = { top: "upper", bottom: "lower" };
    var slot = slotMap[clothingKey];
    var eq = character && character.equipped;
    if (!slot || !eq) return null;
    var item = eq[slot];
    if (!item || Array.isArray(item)) return null;
    if (typeof item === "string") return item;
    return item.name ? String(item.name) : null;
}

// Classify a garment by its name to pick natural removal verbs (armor is
// unbuckled and peeled, a skirt pools at the feet, trousers slide down...).
function _garmentClass(name) {
    var n = String(name || "").toLowerCase();
    if (!n) return "generic";
    if (/(scale|chain)?mail|breastplate|plate|cuirass|armor|armour|jerkin|harness|greaves/.test(n)) return "armor";
    if (/dress|gown|robe/.test(n)) return "dress";
    if (/skirt|kilt/.test(n)) return "skirt";
    if (/shirt|tunic|blouse|sweater|vest|coat|bodice|corset/.test(n)) return "top";
    if (/legging|trouser|pant|breech|hose|tights/.test(n)) return "bottom";
    return "generic";
}

function buildClothingNarration(act, npc, player) {
    if (!act) return "You adjust their clothing.";

    var target = act.target || "npc";
    var clothingItem = act.clothingItem || "";
    var clothingAction = act.clothingAction || "";

    var isPlayer = target === "player";
    var character = isPlayer ? player : npc;
    var whose = isPlayer ? "your"
        : (typeof getPossessivePronoun === 'function' ? getPossessivePronoun(npc) : "their");

    var gender = String((character && (character.gender || (character.stats && character.stats.gender))) || "").toLowerCase();
    var isFemale = gender === "female" || gender === "f";

    // The real worn garment, when equipment knows it
    var garment = _getWornGarmentName(character, clothingItem);
    var gclass = _garmentClass(garment);

    // Gender- and owner-aware body references
    var chestRef = isPlayer ? (isFemale ? "your breasts" : "your chest") : (isFemale ? whose + " breasts" : whose + " chest");
    var legsRef = isPlayer ? "your legs" : whose + " legs";
    var headRef = isPlayer ? "your head" : whose + " head";

    // Bulk undress (no specific clothingItem)
    if (!clothingItem && !clothingAction) {
        if (isPlayer) {
            return pickRandom([
                "You strip out of your clothes piece by piece, dropping each one to the floor until nothing is left.",
                "You shed everything you are wearing, the last garment landing in a heap on the floor."
            ]);
        }
        return pickRandom([
            "You undress " + whose + " piece by piece, each garment joining the pile on the floor until nothing is left.",
            "You peel " + whose + " clothes away one item at a time and let them fall, leaving " + whose + " bare."
        ]);
    }

    // Adjustment actions: the garment stays on, just moved
    if (clothingAction === "move_aside") {
        var asideRef = garment ? whose + " " + garment : (isPlayer ? "your top" : whose + " top");
        return "You pull " + asideRef + " aside, baring " + chestRef + ".";
    }
    if (clothingAction === "pull_down") {
        var pullRef = garment ? whose + " " + garment : (isPlayer ? "your bottom" : whose + " bottoms");
        return "You tug " + pullRef + " down around " + (isPlayer ? "your thighs" : whose + " thighs") + ".";
    }

    // Removal actions: name the real garment where equipment knows it
    var gRef = garment ? whose + " " + garment
        : (clothingItem === "top" ? (isPlayer ? "your top" : whose + " top")
        : (clothingItem === "bottom" ? (isPlayer ? "your bottoms" : whose + " bottoms")
        : (isFemale ? (isPlayer ? "your panties" : whose + " panties") : (isPlayer ? "your underwear" : whose + " underwear"))));

    // Underwear (not tracked as a real equipment item)
    if (clothingItem === "underwear" || clothingItem === "undergarments") {
        if (isPlayer) {
            return pickRandom([
                "You slide " + (isFemale ? "your panties" : "your underwear") + " down " + legsRef + " and step out of them.",
                "You peel off " + (isFemale ? "your panties" : "your underwear") + " and let them drop to the floor."
            ]);
        }
        return pickRandom([
            "You slide " + (isFemale ? whose + " panties" : whose + " underwear") + " down " + legsRef + " and away entirely.",
            "You peel " + (isFemale ? whose + " panties" : whose + " underwear") + " down " + legsRef + ", leaving " + (isFemale ? whose + " sex bare" : whose + " cock bare") + "."
        ]);
    }

    // Top removal — over the head, over the chest; armor is unbuckled instead
    if (clothingItem === "top") {
        if (gclass === "armor") {
            return pickRandom([
                "You unbuckle " + gRef + " strap by strap and peel it away from " + chestRef + ".",
                "You work " + gRef + " loose and lift it clear, letting it fall to the floor with a thud."
            ]);
        }
        if (gclass === "dress") {
            return "You pull " + gRef + " up over " + headRef + ", letting it fall to the floor.";
        }
        if (isFemale) {
            return pickRandom([
                "You pull " + gRef + " up over " + chestRef + " and off " + headRef + " entirely, letting it fall to the floor.",
                "You slide " + gRef + " up " + (isPlayer ? "your body" : whose + " body") + " and over " + headRef + ", " + chestRef + " swaying free as it drops away.",
                "You work " + gRef + " off over " + headRef + ", baring " + chestRef + " completely."
            ]);
        }
        return pickRandom([
            "You pull " + gRef + " up over " + headRef + " and off entirely, letting it fall to the floor.",
            "You tug " + gRef + " off over " + headRef + ", baring " + chestRef + "."
        ]);
    }

    // Bottom removal — down the legs; skirts pool at the feet
    if (clothingItem === "bottom") {
        if (gclass === "armor") {
            return "You unbuckle " + gRef + " and pull it free of " + legsRef + ".";
        }
        if (gclass === "skirt") {
            return "You unfasten " + gRef + " and let it pool at " + (isPlayer ? "your feet" : whose + " feet") + ".";
        }
        return pickRandom([
            "You slide " + gRef + " down " + legsRef + " and off entirely, letting it fall to the floor.",
            "You peel " + gRef + " down over " + (isPlayer ? "your hips" : whose + " hips") + " and " + legsRef + ", leaving them in a heap on the floor.",
            "You work " + gRef + " down " + legsRef + " and " + (isPlayer ? "step out of them" : "pull them free") + "."
        ]);
    }

    // Default: remove action
    return "You remove " + gRef + ".";
}

function buildInitialContactNarration(npc, act, pronouns = {}, player = null) {
    const { posPronoun = "their" } = pronouns;
    const { target, tool, verb } = act;

    // Clothing actions: build a pronoun-correct sentence using the act's
    // target (player/npc) and clothingItem (top/bottom/underwear).
    // e.g. "You remove her top." / "You remove your top." / "You undress her completely."
    if (act.type === "clothing" || (typeof ACT_TYPES !== "undefined" && act.type === ACT_TYPES.CLOTHING)) {
        return buildClothingNarration(act, npc, player);
    }

    // Watersports actions: simple narration, no anatomy-based templates.
    if (act.type === "watersport" || (typeof ACT_TYPES !== "undefined" && act.type === ACT_TYPES.WATERSPORT)) {
        return "You release a stream of warm urine onto " + posPronoun + " " + (target || "body") + ".";
    }

    // Normalize for comparison
    const normalize = (str) => (str || "").toLowerCase().trim();
    const targetNorm = normalize(target);
    const toolNorm = normalize(tool);
    const verbNorm = normalize(verb);
    
    // Helper to get natural label
    const getLabel = (actId) => {
        return typeof getNaturalLabel === 'function' ? getNaturalLabel(actId, npc, player) : (act.label || actId);
    };

    const isKissing = ['kiss', 'lick'].includes(verbNorm);
    const isTouching = ['touch', 'caress', 'stroke', 'rub', 'grope', 'squeeze', 'massage'].includes(verbNorm);
    const isPenetrating = ['fuck', 'thrust', 'pound', 'enter', 'penetrate', 'bury', 'slide', 'grind'].includes(verbNorm);
    const isOral = (t) => ['mouth', 'lips', 'tongue'].includes(normalize(t));
    const isGenital = (t) => ['vagina', 'pussy', 'clitoris', 'clit'].includes(normalize(t));
    const isAnal = (t) => ['anus', 'butt', 'butthole', 'ass'].includes(normalize(t));
    const isBreast = (t) => ['breast', 'breasts', 'chest', 'nipple', 'nipples'].includes(normalize(t));

    // Over-clothes actions: build a clean initial-contact line that references
    // the clothed surface instead of bare anatomy. Avoids revealing hidden
    // physical characteristics and avoids the raw label (e.g. "Grope breasts
    // (over clothes)") leaking into narration.
    if (act.id && act.id.includes("_clothed")) {
        let clothedTarget = posPronoun + " " + (target || "body");
        if (isBreast(targetNorm)) clothedTarget = posPronoun + " chest";
        else if (isAnal(targetNorm)) clothedTarget = posPronoun + " backside";
        else if (isGenital(targetNorm)) clothedTarget = posPronoun + " groin";
        const verbIngForm = typeof verbConjugation === 'function' ? verbConjugation(verbNorm, 'ing') : verbNorm + "ing";
        return `You reach out, your ${toolNorm} ${verbIngForm} ${clothedTarget} over ${posPronoun} clothes.`;
    }

    // Kissing
    if (isKissing) {
        if (targetNorm === 'lips' || targetNorm === 'mouth') {
            return `You lean in, parting your lips as you press them to ${getTargetNoun(act, posPronoun, npc)}`;
        }
        return `You lean in and bring your lips to ${getTargetNoun(act, posPronoun, npc)}`;
    }

    // Touching face/lips
    if (isTouching && (isOral(targetNorm) || targetNorm === 'face' || targetNorm === 'cheek')) {
        return `You reach out and gently ${verbNorm} ${getTargetNoun(act, posPronoun, npc)}`;
    }

    // Touching genitals
    if (isTouching && (isGenital(targetNorm) || isAnal(targetNorm))) {
        if (targetNorm === 'vagina' || targetNorm === 'pussy') {
            return `You reach down, your ${toolNorm} finding ${getTargetNoun(act, posPronoun, npc)}`;
        }
        if (isAnal(targetNorm)) {
            return `You reach around, your ${toolNorm} tracing ${getTargetNoun(act, posPronoun, npc)}`;
        }
        return `You reach out, your ${toolNorm} finding ${getTargetNoun(act, posPronoun, npc)}`;
    }

    // Penetration
    if (isPenetrating) {
        if (targetNorm === 'vagina' || targetNorm === 'pussy') {
            return `You position yourself, guiding your ${toolNorm} to ${getTargetNoun(act, posPronoun, npc)}`;
        }
        if (isAnal(targetNorm)) {
            return `You guide your ${toolNorm} into position at ${getTargetNoun(act, posPronoun, npc)}`;
        }
        if (isOral(targetNorm)) {
            return `You bring your ${toolNorm} to ${getTargetNoun(act, posPronoun, npc)}`;
        }
    }

    // Default initial contact: a direct act line ("You grope her breasts") —
    // hand-based acts get the reach-out opening move ("You reach out to grope
    // her breasts") instead of the old odd "You make contact, your hand grope
    // her breasts".
    if (toolNorm === 'hand' || toolNorm === 'hands' || toolNorm === 'fingers') {
        return `You reach out to ${verbNorm} ${getTargetNoun(act, posPronoun, npc)}`;
    }
    return `You ${verbNorm} ${getTargetNoun(act, posPronoun, npc)}`;
}

/**
 * Build transition narration when switching between different actions
 */
function buildTransitionNarration(npc, lastAct, currentAct, pronouns = {}, player = null) {
    const { posPronoun = "their", objPronoun = "them" } = pronouns;
    const { target: lastTarget, tool: lastTool, verb: lastVerb } = lastAct;
    const { target, tool, verb } = currentAct;

    // Clothing actions: build a pronoun-correct sentence.
    if (currentAct.type === "clothing" || (typeof ACT_TYPES !== "undefined" && currentAct.type === ACT_TYPES.CLOTHING)) {
        return buildClothingNarration(currentAct, npc, player);
    }

    // Watersports actions: simple narration.
    if (currentAct.type === "watersport" || (typeof ACT_TYPES !== "undefined" && currentAct.type === ACT_TYPES.WATERSPORT)) {
        return "You release a stream of warm urine onto " + posPronoun + " " + (target || "body") + ".";
    }

    // Normalize for comparison
    const normalize = (str) => (str || "").toLowerCase().trim();
    const lastTargetNorm = normalize(lastTarget);
    const currentTargetNorm = normalize(target);
    const lastToolNorm = normalize(lastTool);
    const currentToolNorm = normalize(tool);


    // CONTINUE acts never "move" anywhere - they keep the ongoing motion,
    // so they never produce a transition line.
    if (currentAct.type === "continue" || (typeof ACT_TYPES !== "undefined" && currentAct.type === ACT_TYPES.CONTINUE)) {
        return "";
    }

    // Body-area normalization: different words name the same area
    // (butt/buttocks/ass, vagina/pussy/clit, breasts/chest/nipples), so two
    // acts on the same area with the same kind of tool mean the contact is
    // already there - no "you move your hand to..." transition needed. This
    // also covers a bare act following its own _clothed variant.
    const normBodyArea = (t) => {
        const n = normalize(t);
        if (['anus', 'butt', 'butthole', 'ass', 'buttocks', 'cheeks'].includes(n)) return 'ass';
        if (['vagina', 'pussy', 'clit', 'clitoris', 'fold', 'folds'].includes(n)) return 'vagina';
        if (['breast', 'breasts', 'chest', 'nipple', 'nipples'].includes(n)) return 'breasts';
        if (['cock', 'penis', 'dick'].includes(n)) return 'penis';
        if (['mouth', 'lips', 'tongue'].includes(n)) return 'mouth';
        return n;
    };
    const normToolKind = (t) => {
        const n = normalize(t);
        if (n === 'hand' || n === 'hands' || n === 'fingers' || n === 'finger') return 'hand';
        if (n === 'cock' || n === 'penis' || n === 'dick') return 'penis';
        if (n === 'pussy' || n === 'vagina') return 'vagina';
        return n;
    };
    if (normToolKind(lastToolNorm) === normToolKind(currentToolNorm) &&
        normBodyArea(lastTargetNorm) === normBodyArea(currentTargetNorm)) {
        return "";
    }

    // Determine categories for smarter transitions
    const isTouching = (v) => ['touch', 'caress', 'stroke', 'rub', 'grope', 'squeeze', 'massage'].includes(normalize(v));
    const isKissing = (v) => ['kiss', 'lick'].includes(normalize(v));
    const isPenetrating = (v) => ['fuck', 'thrust', 'pound', 'enter', 'penetrate', 'bury', 'slide', 'grind', 'pump'].includes(normalize(v));
    const isFingering = (v) => normalize(v) === 'finger';
    const isOral = (t) => ['mouth', 'lips', 'tongue'].includes(normalize(t));
    const isGenital = (t) => ['vagina', 'pussy', 'penis', 'cock', 'clitoris', 'clit'].includes(normalize(t));
    const isAnal = (t) => ['anus', 'butt', 'butthole', 'ass'].includes(normalize(t));
    const isBreast = (t) => ['breast', 'breasts', 'chest', 'nipple', 'nipples'].includes(normalize(t));

    const lastVerbNorm = normalize(lastVerb);

    const currentVerbNorm = normalize(verb);
    // Spreading takes both hands - pluralize the tool word for spread acts.
    const currentToolWord = (currentVerbNorm === 'spread' && (currentToolNorm === 'hand' || currentToolNorm === 'hands')) ? 'hands' : currentToolNorm;

    // ── WITHDRAWAL FROM PENETRATION ──────────────────────────────
    // If the previous action was a penetration and the current action targets
    // a different body part or uses a different tool, describe the withdrawal
    // first — including physical aspects like gape, slickness, or the muscle
    // relaxing — then transition to the new action.
    var wasPenetrating = isPenetrating(lastVerbNorm) || isFingering(lastVerbNorm);
    var isContinuingPenetration = isPenetrating(currentVerbNorm) && lastTargetNorm === currentTargetNorm;

    if (wasPenetrating && !isContinuingPenetration && lastTargetNorm) {
        var withdrawPart = "";
        var withdrawDetail = "";

        if (isAnal(lastTargetNorm)) {
            withdrawPart = posPronoun + (npcHasCloacaFlag(npc) ? " cloaca" : " anus");
            withdrawDetail = pickRandom([
                ", the stretched rim slowly clenching shut",
                ", the ring of muscle clamping down, still hot from the friction",
                ", leaving a gape that slowly puckers back",
                ", the loosened sphincter twitching in the open air",
                ", the slick entrance slowly tightening"
            ]);
        } else if (isGenital(lastTargetNorm)) {
            withdrawPart = posPronoun + " " + (lastTargetNorm === 'vagina' || lastTargetNorm === 'pussy' ? 'pussy' : lastTargetNorm);
            withdrawDetail = pickRandom([
                ", the wet flesh clinging as you pull free",
                ", the slick folds parting then slowly closing",
                ", a string of slick connecting you for a moment",
                ", the swollen lips slowly pressing back together"
            ]);
        } else if (isOral(lastTargetNorm)) {
            withdrawPart = posPronoun + " mouth";
            withdrawDetail = pickRandom([
                ", a thin strand of saliva briefly connecting you",
                ", " + posPronoun + " lips clinging to your " + lastToolNorm + " before releasing",
                ", leaving a wet sheen on your " + lastToolNorm,
                ", " + posPronoun + " jaw working as " + posPronoun + " mouth adjusts"
            ]);
        } else {
            withdrawPart = posPronoun + " " + lastTargetNorm;
            withdrawDetail = "";
        }

        var withdrawSentence = "You withdraw from " + withdrawPart + withdrawDetail + ".";

        // Now describe the transition to the new action
        var transitionSentence = "";
        if (isPenetrating(currentVerbNorm) || isFingering(currentVerbNorm)) {
            if (isAnal(currentTargetNorm)) {
                transitionSentence = " You shift and press your " + currentToolNorm + " against " + getTargetNoun(currentAct, posPronoun, npc);
            } else if (isGenital(currentTargetNorm)) {
                transitionSentence = " You reposition and guide your " + currentToolNorm + " to " + getTargetNoun(currentAct, posPronoun, npc);
            } else if (isOral(currentTargetNorm)) {
                transitionSentence = " You move your " + currentToolNorm + " to " + getTargetNoun(currentAct, posPronoun, npc);
            } else {
                transitionSentence = " You move to " + getTargetNoun(currentAct, posPronoun, npc);
            }
        } else if (isTouching(currentVerbNorm)) {
            transitionSentence = " You reach out and " + currentVerbNorm + " " + getTargetNoun(currentAct, posPronoun, npc);
        } else if (isKissing(currentVerbNorm)) {
            transitionSentence = " You lean in and " + currentVerbNorm + " " + getTargetNoun(currentAct, posPronoun, npc);
        } else {
            transitionSentence = " You move to " + getTargetNoun(currentAct, posPronoun, npc);
        }

        return withdrawSentence + transitionSentence;
    }

    // Get gender-specific pronouns for NPC
    const npcGender = (npc.gender || "").toLowerCase();
    const heShe = npcGender.includes("male") ? "he" : npcGender.includes("female") ? "she" : "they";
    const himHer = npcGender.includes("male") ? "him" : npcGender.includes("female") ? "her" : "them";
    const hisHer = npcGender.includes("male") ? "his" : npcGender.includes("female") ? "her" : "their";
    
    // Helper to get natural label
    const getLabel = (actId) => {
        return typeof getNaturalLabel === 'function' ? getNaturalLabel(actId, npc, player) : (currentAct.label || actId);
    };
    
    // Case 1: Transition to kissing from non-kissing
    if (isKissing(currentVerbNorm) && !isKissing(lastVerbNorm) && !isOral(lastTargetNorm)) {
        if (currentTargetNorm === 'lips' || currentTargetNorm === 'mouth') {
            return `You lean in and press your lips to ${getTargetNoun(currentAct, posPronoun, npc)}`;
        }
        return `You lean in and kiss ${getTargetNoun(currentAct, posPronoun, npc)}`;
    }
    
    // Case 2: Moving from kissing to something else
    if (isKissing(lastVerbNorm) && !isKissing(currentVerbNorm)) {
        if (isTouching(currentVerbNorm)) {
            return `You pull back from the kiss and reach out, ${currentVerbNorm} ${getTargetNoun(currentAct, posPronoun, npc)}`;
        }
        if (isPenetrating(currentVerbNorm) && currentTargetNorm === 'vagina') {
            return `You break from the kiss and position yourself, pressing your ${currentToolWord} against ${getTargetNoun(currentAct, posPronoun, npc)}`;
        }
        if (currentTargetNorm === 'anus' || currentTargetNorm === 'butt') {
            return `You pull away from the kiss and guide ${objPronoun} into position, pressing against ${getTargetNoun(currentAct, posPronoun, npc)}`;
        }
    }
    
    // Case 3: Moving from touching to penetration
    if (isTouching(lastVerbNorm) && isPenetrating(currentVerbNorm)) {
        if (currentTargetNorm === 'vagina' || currentTargetNorm === 'pussy') {
            return `You move from teasing to penetration, pressing your ${currentToolWord} against ${getTargetNoun(currentAct, posPronoun, npc)}`;
        }
        if (currentTargetNorm === 'anus' || currentTargetNorm === 'butt') {
            return `You shift your approach, positioning your ${currentToolWord} at ${getTargetNoun(currentAct, posPronoun, npc)}`;
        }
        if (isOral(currentTargetNorm)) {
            return `You move your ${currentToolWord} to ${getTargetNoun(currentAct, posPronoun, npc)}`;
        }
    }
    
    // Case 4: Moving from one body part to another
    if (lastTargetNorm !== currentTargetNorm && !isPenetrating(currentVerbNorm)) {
        // From face/breast to genital
        if ((isOral(lastTargetNorm) || isBreast(lastTargetNorm)) && (isGenital(currentTargetNorm) || isAnal(currentTargetNorm))) {
            return `You move your attention downward, bringing your ${currentToolWord} to ${getTargetNoun(currentAct, posPronoun, npc)}`;
        }
        // From genital to face/breast
        if ((isGenital(lastTargetNorm) || isAnal(lastTargetNorm)) && (isOral(currentTargetNorm) || isBreast(currentTargetNorm))) {
            return `You pull back and move upward, ${currentVerbNorm} ${getTargetNoun(currentAct, posPronoun, npc)}`;
        }
        // From breast to genital
        if (isBreast(lastTargetNorm) && (isGenital(currentTargetNorm) || isAnal(currentTargetNorm))) {
            return `Your hands slide lower, your ${currentToolWord} finding ${getTargetNoun(currentAct, posPronoun, npc)}`;
        }
        // From genital to breast
        if ((isGenital(lastTargetNorm) || isAnal(lastTargetNorm)) && isBreast(currentTargetNorm)) {
            return `You move upward, your ${currentToolWord} exploring ${getTargetNoun(currentAct, posPronoun, npc)}`;
        }
    }
    
    // Case 5: Tool change (e.g., fingers to penis)
    if (lastToolNorm !== currentToolNorm && lastToolNorm && currentToolNorm) {
        if ((lastToolNorm === 'finger' || lastToolNorm === 'fingers') && (currentToolNorm === 'penis' || currentToolNorm === 'cock')) {
            return `You withdraw your fingers and position your ${currentToolWord}, pressing against ${getTargetNoun(currentAct, posPronoun, npc)}`;
        }
        if ((currentToolNorm === 'finger' || currentToolNorm === 'fingers') && (lastToolNorm === 'penis' || lastToolNorm === 'cock')) {
            return `You pull back and use your fingers instead, ${currentVerbNorm} ${getTargetNoun(currentAct, posPronoun, npc)}`;
        }
        if (isOral(currentTargetNorm) && (currentToolNorm === 'penis' || currentToolNorm === 'cock')) {
            return `You guide your ${currentToolWord} to ${getTargetNoun(currentAct, posPronoun, npc)}`;
        }
    }
    
    // Case 6: Starting penetration
    if (isPenetrating(currentVerbNorm) && !isPenetrating(lastVerbNorm)) {
        if (currentTargetNorm === 'vagina' || currentTargetNorm === 'pussy') {
            return `You position yourself and press your ${currentToolWord} against ${getTargetNoun(currentAct, posPronoun, npc)}`;
        }
        if (currentTargetNorm === 'anus' || currentTargetNorm === 'butt') {
            return `You guide ${objPronoun} into position and press your ${currentToolWord} against ${getTargetNoun(currentAct, posPronoun, npc)}`;
        }
        if (isOral(currentTargetNorm)) {
            return `You move your ${currentToolWord} to ${getTargetNoun(currentAct, posPronoun, npc)}`;
        }
    }
    
    // Case 7: Moving to face/head with cock
    if ((currentTargetNorm === 'face' || currentTargetNorm === 'cheek' || currentTargetNorm === 'lips') && (currentToolNorm === 'penis' || currentToolNorm === 'cock')) {
        return `You pull back and rub your ${currentToolWord} against ${getTargetNoun(currentAct, posPronoun, npc)}`;
    }
    
    // Default transition
    if (lastTargetNorm !== currentTargetNorm) {
        return `You move to ${getTargetNoun(currentAct, posPronoun, npc)}`;
    }
    
    if (lastToolNorm !== currentToolNorm) {
        return `You switch to using your ${currentToolWord} on ${getTargetNoun(currentAct, posPronoun, npc)}`;
    }
    
    return "";
}

/**
 * Build narrative for "receive" actions (playerIsBottom = true).
 * The player asks the NPC to do something — the narrative is the "asking"
 * part. The actual action description is in buildReceiveResponse.
 */
function buildReceiveNarrative(npc, act, context) {
    var verb = act.verb || "touch";
    var target = act.target || "body";
    var subjPronoun = (typeof getSubjectPronoun === 'function' ? getSubjectPronoun(npc) : "She") || "she";
    var subjLower = subjPronoun.toLowerCase();
    var posPronoun = (typeof getPossessivePronoun === 'function' ? getPossessivePronoun(npc) : "her") || "her";
    var objPronoun = (typeof getObjectPronoun === 'function' ? getObjectPronoun(npc) : "her") || "her";
    var isContinueAction = context.isContinueAction || false;

    var verbIng = verbConjugation(verb, 'ing');

    // Map target to a player-perspective phrase
    var playerTarget = "your " + target;
    if (target === "penis" || target === "cock") playerTarget = "your cock";
    else if (target === "testicles" || target === "balls") playerTarget = "your balls";
    else if (target === "vagina" || target === "pussy") playerTarget = "your pussy";
    else if (target === "nipples") playerTarget = "your nipples";
    else if (target === "anus") playerTarget = "your ass";
    else if (target === "mouth" || target === "lips") playerTarget = "your lips";

    // For continue actions, the NPC is already doing it
    if (isContinueAction) {
        return [
            `You hold still, letting ${subjLower} keep ${verbIng} ${playerTarget}.`,
            `You press ${playerTarget} toward ${objPronoun}, urging ${objPronoun} to keep going.`,
            `You guide ${subjLower} back to ${playerTarget}, ${posPronoun} mouth resuming its work.`
        ];
    }

    // First action: the player asks/tells the NPC what to do
    var shortDesc = (act.desc || act.label || "").replace(/^Ask them to\s+/i, "").replace(/^Ask them\s+/i, "");
    // The act descriptions are gender-neutral ("...with their hand") — swap
    // the neutral pronouns for this NPC's so the ask line reads grammatically
    // ("asking her to stroke your penis with her hand", not "...with their
    // hand", and never "asking she to").
    shortDesc = shortDesc.replace(/\btheir\b/gi, posPronoun).replace(/\bthem\b/gi, objPronoun);

    return [
        `You ask ${objPronoun} to ${shortDesc}.`,
        `You tell ${objPronoun} you want ${objPronoun} to ${shortDesc}.`,
        `You lean close and murmur your request — you want ${objPronoun} to ${shortDesc}.`,
        `You make your desires clear, asking ${objPronoun} to ${shortDesc}.`
    ];
}

/**
 * Build NPC response for "receive" actions — the NPC is the actor, so
 * the response combines their compliance/hesitation (temperament-based)
 * with the actual action description.
 */
// Receive acts whose performance beats draw from the rich oral-servicing
// sample pool (NPC mouth working the player's cock).
var NPC_ORAL_SERVICING_ACT_IDS = ["suck_player_penis", "deepthroat_player_penis", "self_deepthroat"];

/**
 * Rich performance-beat samples for the NPC servicing the player's cock.
 * These carry the whole beat (multi-sentence, physically specific) and
 * feed both the manual receive flow and the NPC-led pleasure loop's
 * back-to-back beats, so the pool is deep and anti-repeated (pickUnique).
 * Placeholders: {npcS} subject ("She"), {npcs} lowercase ("she"),
 * {npcP}/{npcp} possessive ("her"), {npcO}/{npo} object ("her"/"them").
 * The player is always "you/your" — second person.
 */
var NPC_ORAL_SERVICING_SAMPLES = {
    base: [
        "{npcS} wraps both hands around your shaft and slowly sucks on your head. {npcS} bobs {npcp} head, rubbing your cockhead against {npcp} palate while sucking vigorously, before releasing you slowly. {npcS} maintains a steady rhythm, and you can feel your balls tighten in anticipation.",
        "{npcS} cups your balls with one hand while holding the top of your shaft with the other, pressing {npcp} mouth against {npcp} fist and rapidly sliding your tip in and out of {npcp} mouth, {npcp} tongue swirling around your glans intermittently.",
        "{npcS} caresses the length of your shaft with one hand, then bows {npcp} head to your base, licking your balls once before opening {npcp} jaw and grazing your shaft with {npcp} teeth up its length. {npcS} wraps {npcp} lips around your glans and takes you into {npcp} warm mouth, tilting {npcp} head to let your cock slide toward the back of {npcp} throat before pulling back with a firm suck until your cock pops free of {npcp} mouth, covered in saliva, the cool air contrasting with the hot warmth of {npcp} mouth a moment ago.",
        "{npcS} holds your cock at the base and breathes warm air across the tip before sealing {npcp} lips just past the crown. {npcS} works {npcp} tongue flat against the underside in slow strokes, cheeks hollowing each time {npcs} draws back, until the pull of {npcp} mouth has your hips shifting on their own.",
        "{npcS} sinks {npcp} mouth down over your cock in one long, unhurried descent, stopping with {npcp} nose pressed to your belly. {npcp} throat flexes around your length once, twice, and then {npcs} retreats just as slowly, dragging the tight ring of {npcp} lips up your shaft until only your cockhead remains between them.",
        "{npcS} sets a slow, rolling pace, {npcp} tongue pressed hard along the underside so every bob drags it from root to crown. {npcS} hums around you, the vibration running straight up your spine, and cups your balls, weighing them gently in {npcp} palm as {npcs} works."
    ],
    // Appended to the pool when the NPC's own arousal is high — hungrier,
    // sloppier, more urgent beats.
    high: [
        "{npcS} loses the rhythm entirely and simply takes you: fast, sloppy strokes of {npcp} mouth, spit slicking your shaft as {npcp} fist and lips work you in tandem, {npcp} moans muffled around the head of your cock.",
        "{npcS} pulls off just long enough to catch {npcp} breath, then plunges back down until {npcp} lips meet {npcp} fingers, swallowing over and over while {npcp} throat milks you, drool escaping the corners of {npcp} mouth as {npcs} takes you as deep as {npcs} can.",
        "{npcS} bobs {npcp} head with hungry, desperate speed, {npcp} fist twisting counter to {npcp} mouth and {npcp} tongue lashing your glans on every pull — {npcs} wants your release and {npcs} is not being patient about it."
    ]
};

/**
 * Hand-technique servicing beats (stroke_player_penis): the NPC's hands
 * work the player's cock. Same placeholder/anti-repetition conventions as
 * NPC_ORAL_SERVICING_SAMPLES.
 */
var NPC_HAND_SERVICING_SAMPLES = {
    base: [
        "{npcS} wraps {npcp} hand around your shaft and strokes you with slow, twisting pulls, {npcp} grip snug at the base and lighter at the crown. {npcS} spreads the beading pre-cum down your length with {npcp} thumb until your whole cock is slick.",
        "{npcS} pumps your cock in long, deliberate strokes, {npcp} other hand cradling your balls and tugging them gently in counterpoint. {npcS} pauses at the top of every stroke to twist {npcp} wrist over the crown.",
        "{npcS} holds your shaft in both hands, one stacked above the other, and works them in alternating waves so the grip never leaves your length. {npcS} leans in close, {npcp} breath hot on your glans.",
        "{npcS} strokes you with a loose fist gliding over your tip and a tight one at your base, swapping the rhythm whenever your hips start to move with {npcp}.",
        "{npcS} milks your cock with slow, full strokes from base to tip, pausing at the top to swirl {npcp} palm over your drooling cockhead before sliding all the way back down.",
        "{npcS} wraps both hands around you and twists them in opposite directions as {npcs} strokes, the opposing spirals dragging along every inch of your cock."
    ],
    high: [
        "{npcS} strokes you fast and tight, {npcp} fist flying over your slick shaft while {npcp} other hand works your balls, {npcp} eyes fixed on the way your cock twitches in {npcp} grip.",
        "{npcS} jerks your cock in quick, urgent pulls, twisting {npcp} wrist over your cockhead on every stroke, coaxing you toward the edge with both hands."
    ]
};

/**
 * Mouth-on-balls servicing beats (lick_player_balls, suck_player_balls).
 */
var NPC_BALLS_SERVICING_SAMPLES = {
    base: [
        "{npcS} licks a slow, wet stripe up each of your balls, then takes one gently into {npcp} mouth, rolling it against {npcp} tongue with careful suction. {npcS} hums around you and lets the vibration travel up through your sack.",
        "{npcS} noses into the crease of your thighs and lathers your balls with slow laps of {npcp} tongue, sucking one and then the other into the wet heat of {npcp} mouth, {npcp} hand idly stroking your shaft above.",
        "{npcS} cups your sack in {npcp} palm and weighs it, then lowers {npcp} mouth over your balls, mouthing them one at a time with soft, deliberate pulls that leave your skin shining.",
        "{npcS} presses flat kisses up the seam of your sack before opening wide and sucking gently, {npcp} tongue tracing lazy circles while {npcp} fingers keep a slow grip on your cock."
    ],
    high: [
        "{npcS} sucks your balls hungrily, one and then both, {npcp} mouth hot and relentless while {npcp} fist pumps your slick cock in a hard, fast rhythm.",
        "{npcS} buries {npcp} face under your shaft and sucks {npcp} mouth full of your sack, moaning around the mouthful while {npcp} hand churns your slick cock, {npcp} fingers slippery with pre-cum."
    ]
};

/**
 * Pussy-servicing beats (lick_player_pussy, suck_player_clit): the NPC's
 * mouth works the player's pussy. Same placeholder/anti-repetition
 * conventions as NPC_ORAL_SERVICING_SAMPLES. Placeholders: {npcS} subject
 * ("She"), {npcs} lowercase ("she"), {npcP}/{npcp} possessive ("her"),
 * {npcO}/{npo} object ("her"/"them"). The player is always "you/your" —
 * second person.
 */
var NPC_PUSSY_SERVICING_ACT_IDS = ["lick_player_pussy", "suck_player_clit"];

var NPC_PUSSY_SERVICING_SAMPLES = {
    base: [
        "{npcS} parts your folds with both thumbs and licks one long, flat stripe from your opening up to your clit, slow enough that you feel every inch of {npcp} tongue. {npcS} does it again and again, each pass a little firmer, until your hips are tilting up to meet {npcp} mouth on their own.",
        "{npcS} presses soft, open-mouthed kisses along your inner lips, taking {npcp} time with each one the way {npcs} would kiss your mouth. Then {npcp} tongue slides between your folds and finds your clit, tracing unhurried circles around it — close, warm, never quite on it — until you arch up seeking more and {npcs} lets you have it.",
        "{npcS} seals {npcp} lips around your clit and suckles, gentle and rhythmic, {npcp} tongue flicking the underside on every pull. {npcS} keeps the pace maddeningly even, and when your thighs start to tremble {npcs} slides both hands under them and holds you open for {npcp} mouth.",
        "{npcS} dips {npcp} tongue into you and fucks you with it in shallow, curling strokes, {npcp} nose pressed to your mound and {npcp} chin slick with your wetness. {npcS} groans at the taste, and the vibration of it runs straight through your core.",
        "{npcS} licks you in slow, broad laps like {npcs} has all the time in the world, {npcp} tongue soft and flat against your whole sex before narrowing to a point that circles your clit and dips back down. {npcS} hums lazily between your legs, and you feel the sound more than hear it.",
        "{npcS} wraps {npcp} arms around your thighs and buries {npcp} mouth against you, alternating long strokes of {npcp} tongue with slow, suctioning kisses to your clit. When {npcp} fingers curl up inside you and stroke that aching spot, {npcp} mouth never loses its rhythm.",
        "{npcS} starts with soft, open-mouthed kisses along your inner thigh, each one placed a little higher than the last, and makes you wait for it. Your hips lift off the bed in invitation; {npcs} pins them down with one flat palm and keeps {npcp} unhurried pace, lips grazing skin that has no business being this sensitive, until you are holding your breath.",
        "{npcS} parts your folds with {npcp} thumbs and simply breathes on you first — warm, slow, deliberate — and the anticipation alone makes you clench around nothing. Then {npcp} tongue slides through your folds in one long, unhurried stroke, gathering your wetness, and {npcs} groans low at the taste before pressing {npcp} mouth closer.",
        "Your fingers find {npcp} hair without deciding to, tangling in it to hold {npcs} where you need {npcO}. {npcS} lets you steer the pace, moaning against you when you pull tighter, and the sound runs straight through you. Your whole world narrows to {npcp} mouth — the wet sounds, the heat, the flat of {npcp} tongue dragging over your clit in strokes that keep time with your pulse.",
        "{npcS} is relentless once {npcs} finds the rhythm that makes your back arch: lips sucking, tongue working, {npcp} mouth never leaving you even to breathe. You can feel the pressure building, the tension winding tighter and tighter low in your belly, and {npcs} reads it in every tremble of your thighs and gives you exactly the stroke you need, over and over, without ever letting up.",
        "{npcS} latches onto your clit and sucks hard, {npcp} tongue flicking the underside, until your thighs start to tremble on their own; {npcp} hums against you and the vibration runs straight through your core. <ah - there - >",
        "{npcS} works you with slow, wet laps down your whole sex before narrowing to sharp flicks on your clit, making you arch and gasp; by the time {npcs} looks up at you, {npcp} chin is slick with your wetness."
    ],
    // Appended to the pool when the NPC's own arousal is high — hungrier,
    // sloppier, more urgent beats.
    high: [
        "{npcS} eats you like {npcs} is starving for it — face pressed deep, mouth wide open, tongue working you in fast, messy strokes while {npcp} chin drips with you. {npcS} moans into your pussy between laps, gripping your hips to hold you against {npcp} mouth.",
        "{npcS} flicks {npcp} tongue over your clit in a quick, relentless rhythm, two fingers pumping into you and curling against the front of you with every stroke. {npcS} looks up your body to watch you come apart, and does not slow down.",
        "{npcS} locks {npcp} mouth over your clit and sucks hard, hard enough to make your back bow off the bed, riding out every buck of your hips without letting go until the pull of {npcp} mouth has you seeing white.",
        "{npcS} eats you like {npcs} cannot wait another second — mouth wide, tongue pushing into you between strokes over your clit, {npcp} fingers digging into your thighs to hold you open. When your thighs start to shake, {npcs} doubles down, working you faster, rougher, until the only words you have left are the ones you are begging with.",
        "{npcS} feels how close you are and locks {npcp} lips around your clit, sucking in a hard, steady rhythm that drags you right to the edge and holds you there. Your thighs clamp around {npcp} head, your hips strain against {npcp} mouth, and {npcs} rides out every buck without letting go, moaning into you until you come apart completely."
    ]
};

/**
 * Breast-servicing beats (titjob_player), keyed by the NPC's breast size
 * category: what her chest can do with a cock changes completely between
 * a flat/small bust and a heavy one. `high` is shared across sizes.
 */
var NPC_TITJOB_SERVICING_SAMPLES = {
    small: [
        "{npcS} presses {npcp} small tits around your cock, not quite able to wrap them around your shaft, holding herself snug with a hand on each breast. {npcS} blushes in self-deprecation and leans forward to lick the tip of your shaft. {npcS} pulls away for a moment and takes your cock into {npcp} mouth before impaling {npcp} throat on your member, {npcp} teeth grazing your shaft; {npcs} pulls back with a cough and slobbers all over your shaft before resuming the position, your cock sliding effortlessly in the slick mess now covering {npcp} small breasts.",
        "{npcS} traps your cock in the shallow valley of {npcp} small chest and strokes you with what little {npcs} has to work with, {npcp} chin tipped down so {npcs} can drool on your cockhead every time it pokes free of {npcp} cleavage.",
        "{npcS} drapes {npcp} little chest over your cock and grinds the flat of {npcp} sternum along your length, skin soft even where {npcs} cannot squeeze. {npcS} makes up the difference with {npcp} mouth, licking and kissing your cockhead every time it nudges up between {npcp} collarbones.",
        "{npcS} knows {npcp} small tits cannot hold you alone, so {npcs} uses everything else: {npcp} hands, {npcp} spit-slick fingers curling around your tip, and {npcp} flicking tongue, everything pressed into the shallow warmth of {npcp} chest while {npcs} watches you strain for more."
    ],
    medium: [
        "{npcS} presses {npcp} firm tits together around your shaft and works them up and down, {npcp} skin warm and slightly slick with sweat. {npcS} spits into {npcp} cleavage to help the glide, watching your face as {npcs} sets {npcp} pace.",
        "{npcS} wraps {npcp} round breasts around your cock and strokes with tight, even pressure, pausing to rub your drooling tip across one stiff nipple on every upstroke.",
        "{npcS} traps your cock between {npcp} round tits and pumps {npcp} shoulders in a steady tempo, {npcp} skin hot and smooth around you. {npcS} pauses now and then to drool into {npcp} own cleavage, keeping the slide wet and filthy.",
        "{npcS} brackets your shaft with {npcp} perky tits and rocks {npcp} whole torso in one smooth motion, so your cock rides the warm seam of {npcp} chest from base to crown and back on every stroke."
    ],
    large: [
        "{npcS} buries your cock between {npcp} large, soft breasts, completely enveloping you. {npcS} grips each heavy tit, lifting them and tilting {npcp} body; your cock is wrapped in warm, pillowing skin, the tip appearing briefly here and there as {npcs} keeps up steady strokes along your whole length.",
        "{npcS} squeezes {npcp} heavy breasts around your cock and rocks {npcp} shoulders in a slow rhythm, the soft mass swallowing you whole. {npcS} dips {npcp} chin to lick at your cockhead each time it pushes up through {npcp} cleavage.",
        "{npcS} hugs {npcp} big, soft breasts against the sides of your cock and lets {npcp} body do the work, rolling {npcp} chest in slow waves that squeeze and release your length from base to tip. {npcS} catches your eye and deliberately pinches {npcp} own nipples as {npcs} works you.",
        "{npcS} plants your cock in the deep valley between {npcp} heavy tits and presses them together until you disappear completely, only your slick tip peeking out on each stroke. {npcS} speeds up, the soft slap of {npcp} chest against your hips filling the room."
    ],
    high: [
        "{npcS} abandons the slow pace and squeezes {npcp} tits hard around you, working your cock with {npcp} chest in quick, greedy strokes, {npcp} tongue straining to catch the head every time it surfaces.",
        "{npcS} squeezes {npcp} tits around you and pumps hard and fast, {npcp} chest slick with spit and sweat, {npcp} mouth hanging open as {npcs} watches your cock swell between {npcp} breasts, chasing your release."
    ]
};

/**
 * Map the NPC's breast sizeCategory to a titjob sample bucket.
 */
function _breastServicingBucket(npc) {
    var anat = npc && npc.anatomy && npc.anatomy.breasts;
    var cat = String((anat && (anat.sizeCategory || anat.size)) || "").toLowerCase();
    if (["flat", "small", "tiny", "petite", "modest"].indexOf(cat) !== -1) return "small";
    if (["large", "huge", "massive", "voluptuous", "heavy", "full", "ample", "generous"].indexOf(cat) !== -1) return "large";
    return "medium";
}

/**
 * Shared servicing-beat picker: base pool plus the high-arousal extras,
 * drawn anti-repeated and pronoun-resolved.
 */
function _pickServicingBeat(npc, intimacy, pool, highPool, highArousal, key) {
    var all = Array.isArray(pool) ? pool.slice() : [];
    if (highArousal && Array.isArray(highPool) && highPool.length) all = all.concat(highPool);
    if (!all.length) return "";
    return applyNPCPronouns(npc, pickUnique(all, intimacy, key));
}

function buildReceiveResponse(npc, player, act, intimacy) {
    var subjPronoun = (typeof getSubjectPronoun === 'function' ? getSubjectPronoun(npc) : "She") || "she";
    var subjLower = subjPronoun.toLowerCase();
    var posPronoun = (typeof getPossessivePronoun === 'function' ? getPossessivePronoun(npc) : "her") || "her";
    var objPronoun = (typeof getObjectPronoun === 'function' ? getObjectPronoun(npc) : "her") || "her";

    var temperament = String(npc.temperament || "").toLowerCase();
    var isBold = temperament === "forward" || temperament === "bold" || temperament === "lustful";
    var isShy = temperament === "shy" || temperament === "timid" || temperament === "reserved";

    var arousalLevel = intimacy ? intimacy.arousal.npc : 0;
    var scaledArousal = scaleArousal(arousalLevel);
    var highArousal = scaledArousal > 60;

    // ── RICH SERVICING BEATS ────────────────────────────────────────────
    // The cock-servicing receive acts draw from deep sample pools instead
    // of the generic one-liner templates below: these beats ARE the
    // performance (and the NPC-led pleasure loop replays them back to
    // back), so they need to be long, varied, and non-repeating. Titjob
    // beats are selected by the NPC's breast size category.
    var _servicingBeat = "";
    if (NPC_ORAL_SERVICING_ACT_IDS.indexOf(act.id) !== -1) {
        _servicingBeat = _pickServicingBeat(npc, intimacy,
            NPC_ORAL_SERVICING_SAMPLES.base, NPC_ORAL_SERVICING_SAMPLES.high,
            highArousal, "receive-oral-servicing");
    } else if (NPC_PUSSY_SERVICING_ACT_IDS.indexOf(act.id) !== -1) {
        _servicingBeat = _pickServicingBeat(npc, intimacy,
            NPC_PUSSY_SERVICING_SAMPLES.base, NPC_PUSSY_SERVICING_SAMPLES.high,
            highArousal, "receive-pussy-servicing");

    } else if (act.id === "stroke_player_penis") {
        _servicingBeat = _pickServicingBeat(npc, intimacy,
            NPC_HAND_SERVICING_SAMPLES.base, NPC_HAND_SERVICING_SAMPLES.high,
            highArousal, "receive-hand-servicing");
    } else if (act.id === "lick_player_balls" || act.id === "suck_player_balls") {
        _servicingBeat = _pickServicingBeat(npc, intimacy,
            NPC_BALLS_SERVICING_SAMPLES.base, NPC_BALLS_SERVICING_SAMPLES.high,
            highArousal, "receive-balls-servicing");
    } else if (act.id === "titjob_player") {
        _servicingBeat = _pickServicingBeat(npc, intimacy,
            NPC_TITJOB_SERVICING_SAMPLES[_breastServicingBucket(npc)],
            NPC_TITJOB_SERVICING_SAMPLES.high,
            highArousal, "receive-titjob-servicing");
    }
    if (_servicingBeat) return _servicingBeat;

    var verb = act.verb || "touch";
    var verbThird = verbConjugation(verb, 'third');
    var verbIng = verbConjugation(verb, 'ing');

    var target = act.target || "body";
    var playerTarget = "your " + target;
    if (target === "penis" || target === "cock") playerTarget = "your cock";
    else if (target === "testicles" || target === "balls") playerTarget = "your balls";
    else if (target === "vagina" || target === "pussy") playerTarget = "your pussy";
    else if (target === "nipples") playerTarget = "your nipples";
    else if (target === "anus") playerTarget = "your ass";
    else if (target === "mouth" || target === "lips") playerTarget = "your lips";

    // Build action description (the physical act, with proper grammar)
    var actionDesc;
    if (verb === "kiss") {
        actionDesc = pickRandom([
            `pressing ${posPronoun} lips to ${playerTarget}`,
            `${verbIng} ${playerTarget}, ${posPronoun} mouth warm and soft`
        ]);
    } else if (verb === "suck") {
        // "Your clit" is a small nub — gentle, steady pressure, not the
        // hollowed-cheek suction a cock gets.
        if (target === "clitoris" || target === "clit") {
            actionDesc = pickRandom([
                `taking ${playerTarget} into ${posPronoun} mouth, ${verbIng} you with slow, deliberate pulls`,
                `sealing ${posPronoun} lips around ${playerTarget}, keeping gentle, steady pressure`,
                `drawing ${playerTarget} in, ${posPronoun} mouth warm and wet around you`
            ]);
        } else {
            actionDesc = pickRandom([
                `taking ${playerTarget} into ${posPronoun} mouth, ${verbIng} you with slow, deliberate pulls`,
                `wrapping ${posPronoun} lips around ${playerTarget}, ${posPronoun} cheeks hollowing`,
                `drawing ${playerTarget} in, ${posPronoun} mouth warm and wet around you`
            ]);
        }
    } else if (verb === "lick") {
        actionDesc = pickRandom([
            `running ${posPronoun} tongue over ${playerTarget}, ${verbIng} you slowly`,
            `${verbIng} ${playerTarget}, ${posPronoun} tongue warm and wet against you`
        ]);
    } else if (verb === "deepthroat") {
        actionDesc = pickRandom([
            `taking ${playerTarget} deep into ${posPronoun} throat, swallowing around you`,
            `sinking ${posPronoun} mouth down ${playerTarget}, ${posPronoun} throat gripping you tightly`
        ]);
    } else if (verb === "rim") {
        actionDesc = pickRandom([
            `${verbIng} ${playerTarget}, ${posPronoun} tongue circling the sensitive skin`,
            `pressing ${posPronoun} face to ${playerTarget}, ${posPronoun} tongue wet and probing`
        ]);
    } else if (verb === "eat") {
        actionDesc = pickRandom([
            `burying ${posPronoun} face between your legs, ${verbIng} ${playerTarget} eagerly`,
            `${verbIng} ${playerTarget}, ${posPronoun} mouth working against you`
        ]);
    } else {
        actionDesc = `${verbIng} ${playerTarget}`;
    }

    // Build the performance beat: the ACT in progress, with temperament as
    // flavor. The agreement/compliance is narrated separately now (the
    // receive flow's AI lead-in beat), so these lines must not re-narrate
    // her deciding to do it ("nods and moves to comply") — only her doing
    // it, in her own rhythm.
    var responses;
    if (isShy) {
        responses = [
            `${subjPronoun} ${verbThird} ${playerTarget} with quiet focus, ${posPronoun} movements careful and unhurried.`,
            `${subjPronoun} keeps ${posPronoun} eyes lowered, ${actionDesc}.`,
            `${subjPronoun} works ${playerTarget} slowly, a soft flush creeping up ${posPronoun} neck.`
        ];
        if (highArousal) {
            responses.push(
                `${subjPronoun} ${verbThird} ${playerTarget} a little faster, ${posPronoun} shyness melting into focus.`,
                `${subjPronoun} loses a little of ${posPronoun} hesitation, ${actionDesc} with quiet confidence.`
            );
        }
    } else if (isBold) {
        responses = [
            `${subjPronoun} ${verbThird} ${playerTarget} with bold, shameless strokes of ${posPronoun} own rhythm.`,
            `${subjPronoun} takes ${playerTarget} eagerly, ${actionDesc}, ${posPronoun} eyes locked on yours.`,
            `${subjPronoun} works ${playerTarget} hard and hungry, ${posPronoun} pace set entirely by ${posPronoun} own need.`
        ];
        if (highArousal) {
            responses.push(
                `${subjPronoun} ${verbThird} ${playerTarget} faster now, ${posPronoun} breath coming shorter against you.`,
                `${subjPronoun} loses all restraint, ${actionDesc} with open hunger.`
            );
        }
    } else {
        // Neutral temperament
        responses = [
            `${subjPronoun} ${verbThird} ${playerTarget} in a steady rhythm, ${posPronoun} attention fixed on your reaction.`,
            `${subjPronoun} keeps going, ${actionDesc}.`,
            `${subjPronoun} settles into ${posPronoun} rhythm, ${posPronoun} touch deliberate and warm.`
        ];
        if (highArousal) {
            responses.push(
                `${subjPronoun} ${verbThird} ${playerTarget} faster now, ${posPronoun} breath coming shorter against you.`,
                `${subjPronoun} loses a little of ${posPronoun} composure, ${actionDesc} with growing hunger.`
            );
        }
    }

    return pickRandom(responses);
}

/**
 * Lead-in beat for a receive act the NPC agreed to: she takes the lead —
 * agreement, positioning herself, ready to act. This is the beat BETWEEN the
 * player's ask and the performance itself (buildReceiveResponse), so the
 * sequence reads: ask -> she takes position -> she acts.
 * Returns "" when nothing fits (caller falls back to the performance only).
 */
function buildReceiveLeadIn(npc, act, isRepeat) {
    if (!npc || !act) return "";
    var subj = (typeof getSubjectPronoun === 'function' ? getSubjectPronoun(npc) : "She") || "She";
    var lower = subj.toLowerCase();
    var pos = (typeof getPossessivePronoun === 'function' ? getPossessivePronoun(npc) : "her") || "her";
    var target = String(act.target || "").toLowerCase();
    var tool = String(act.tool || "").toLowerCase();
    var temperament = String(npc.temperament || "").toLowerCase();
    var isShy = temperament === "shy" || temperament === "timid" || temperament === "reserved";

    var lines = [];
    var agreement = isRepeat
        ? [`${subj} keeps the lead, settling back into ${pos} rhythm.`]
        : [
            isShy ? `${subj} hesitates only a breath before agreeing, moving to take charge of you.` : `${subj} agrees with a slow smile, taking the lead from you.`,
            isShy ? `"Okay,\" ${lower} breathes, gathering ${pos} nerve to take over.` : `${subj} doesn't wait to be told twice — ${lower} takes over.`
        ];

    var positioning = null;
    if (target === "penis" || target === "cock") {
        if (tool === "hand") {
            positioning = [
                `${subj} wraps ${pos} fingers around your cock, giving it one slow stroke as ${lower} decides the pace.`,
                `${subj} takes your cock in hand and settles in close, setting ${pos} own tempo.`
            ];
        } else if (tool === "breasts") {
            positioning = [
                `${subj} cups ${pos} breasts and leans over you, pressing them snug around your cock.`,
                `${subj} moves with a knowing look, trapping your cock between ${pos} soft breasts.`
            ];
        } else {
            positioning = [
                `${subj} eases you back and settles between your legs, ${pos} breath warm against your cock.`,
                `${subj} sinks down on ${pos} own, lips parting around the head of your cock as ${lower} sets ${pos} pace.`
            ];
        }
    } else if (target === "vagina" || target === "pussy") {
        positioning = [
            `${subj} guides you down and kneels between your thighs, pulling them apart with ${pos} hands.`,
            `${subj} settles ${pos}self between your legs, ${pos} mouth hovering a breath away from your pussy.`
        ];
    } else if (target === "testicles" || target === "balls") {
        positioning = [
            `${subj} lowers ${pos}elf, ${pos} mouth finding your balls as ${lower} takes control of your pleasure.`
        ];
    } else if (target === "anus" || target === "ass") {
        if (tool === "mouth") {
            positioning = [
                `${subj} guides you into position and spreads you gently, ${pos} tongue tracing a slow line.`
            ];
        } else {
            positioning = [
                `${subj} guides you into position and presses against you, letting you feel ${pos} readiness before ${lower} takes you.`,
                `${subj} takes hold of you and backs onto you at ${pos} own pace, controlling every inch.`
            ];
        }
    } else if (target === "mouth" || target === "lips") {
        positioning = [
            `${subj} leans in and claims your lips, tilting your chin up with ${pos} fingers.`
        ];
    } else if (target === "nipples") {
        positioning = [
            `${subj} bows ${pos} head to your chest, ${pos} lips closing around your nipple.`
        ];
    } else {
        positioning = [
            `${subj} moves to take charge of you, positioning ${pos}elf to please you ${pos} own way.`
        ];
    }

    lines.push(pickRandom(agreement) + " " + pickRandom(positioning));
    return lines[0];
}

/**
 * Prompt for the AI-narrated agreement/refusal beat of a receive request.
 * The DECISION is stat-based (engine); this only writes the NPC's answer in
 * her own voice — personality, species and mood aware.
 */
function buildReceiveAgreementPrompt(npc, act, player, accepted, template) {
    var npcName = (npc && npc.name) || "the NPC";
    var species = (npc && npc.species) || "Human";
    var gender = (npc && npc.gender) || "female";
    var temperament = (npc && npc.temperament) || "neutral";
    var mood = (npc && npc.memory && npc.memory.lastMood) || "neutral";
    var traits = (Array.isArray(npc && npc.personalityTraits) && npc.personalityTraits.length)
        ? npc.personalityTraits.join(", ") : "";
    var subj = (typeof getSubjectPronoun === "function" ? getSubjectPronoun(npc) : "They") || "They";
    var pos = (typeof getPossessivePronoun === "function" ? getPossessivePronoun(npc) : "their") || "their";
    var shortDesc = String((act && (act.desc || act.label)) || "please you").replace(/^Ask them to\s+/i, "");

    var _species = String(species).toLowerCase();
    var speciesNote = _species && _species !== "human"
        ? "The NPC is a " + species + " — let species-appropriate features and speech habits show."
        : "";

    return [
        "You are writing an NPC's in-character reaction in a text adventure game.",
        "The NPC is " + npcName + ", a " + species + " " + gender + ". Temperament: " + temperament + "." +
            (traits ? " Personality: " + traits + "." : "") + " Current mood: " + mood + ".",
        speciesNote,
        "",
        "INSTRUCTIONS:",
        "- The player has just asked " + npcName + " to " + shortDesc + ".",
        accepted
            ? "- " + subj + " AGREES. Write " + subj.toLowerCase() + " agreeing in character — optionally one short line of dialogue in angle brackets <like this> — and clearly taking the lead."
            : "- " + subj + " DECLINES. Write " + subj.toLowerCase() + " refusing in character — kind but firm, true to " + pos + " temperament.",
        "- Third person, 1-2 sentences. No narration of the act itself — this is only " + (accepted ? pos + " answer and taking charge." : pos + " answer."),
        "- The player is 'you' — when " + subj.toLowerCase() + " touches or takes hold of them, say 'your' (her hand closes around YOUR...), never 'him/his/her'.",
        "- Match personality, species and mood. A shy halfling speaks differently from a bold orc.",
        "- Never use " + npcName + "'s name in the response — pronouns only (" + subj.toLowerCase() + "/" + pos + ").",
        "- Do NOT use words like: I cannot, I'm unable, as an AI.",
        "",
        "BASE TEXT (a plain template — enrich it into an in-character response):",
        String(template || "")
    ].filter(Boolean).join("\n");
}

/**
 * AI-narrated agreement/refusal for a receive request. Falls back to the
 * provided template when the AI is unavailable, slow (4s timeout), or
 * returns unusable text (meta-commentary, player-perspective). Returns the
 * enriched third-person response.
 */
async function generateReceiveAgreement(npc, act, player, accepted, template) {
    var fallback = String(template || "");
    try {
        var _ai = (typeof window !== "undefined" && typeof window.ai === "function")
            ? window.ai : (typeof ai === "function" ? ai : null);
        if (!_ai) return fallback;
        var prompt = buildReceiveAgreementPrompt(npc, act, player, accepted, fallback);
        var result = await Promise.race([
            _ai({ instruction: prompt, startWith: "", endButtons: "none", generatorName: "cyoaftw-engine-core" }),
            new Promise(function (resolve) { setTimeout(function () { resolve(null); }, 4000); })
        ]);
        var text = result && (result.text || result);
        if (!text || !String(text).trim()) return fallback;
        var trimmed = String(text).trim();
        var isMeta = /since the base|please provide|I cannot|I'm unable|as an ai|i'll polish|here is the|here's the/i.test(trimmed);
        if (isMeta) return fallback;
        // The response is the NPC reacting — reject player-perspective text.
        if (/^you(r|rs)?\s/i.test(trimmed)) return fallback;
        if (trimmed.length > 400) return fallback;
        // Convert angle-bracket speech markers to quotes (the narration
        // convention elsewhere); strip stray brackets; collapse doubled
        // quote artifacts ("" or mixed smart-quote pairs) from the AI output.
        trimmed = trimmed.replace(/<([^>]*)>/g, '"$1"').replace(/<|>/g, "");
        trimmed = trimmed.replace(/["\u201C\u201D\u201E\u201F\u00AB\u00BB]{2,}/g, '"');
        trimmed = trimmed.trim();
        return trimmed || fallback;
    } catch (e) {
        console.warn("[Intimacy] Receive agreement generation failed, using template:", e);
        return fallback;
    }
}

/**
 * Build multiple narrative options for an action
 */
/**
 * One ongoing-action sentence for an engaged act during a multi-act
 * Continue - "You continue kissing her peaches-and-cream skin, your
 * lips pressed against her anus." / "Your finger slides in and out of
 * her sphincter." The generic narrative builders phrase tease acts as
 * fresh contact ("You lean in and kiss...") and penetration acts as a
 * full staged entry, both of which read as a scene restart inside a
 * combined continue beat. Returns null when no pattern matches so the
 * caller can fall back to generateIntimacyNarrative. Receive acts
 * (playerIsBottom) are excluded - buildReceiveNarrative already has
 * continue flavor.
 */
function buildEngagedActContinueSentence(npc, actId, intimacy, arousalLevel) {
    var act = typeof getAct === "function" ? getAct(actId) : null;
    if (!act || act.playerIsBottom === true) return null;
    var verb = String(act.verb || "").toLowerCase();
    var tool = String(act.tool || "").toLowerCase();
    var target = String(act.target || "").toLowerCase();
    var posPronoun = (typeof getPossessivePronoun === "function") ? getPossessivePronoun(npc) : "her";
    var anatomyDesc = (typeof describeAnatomy === "function")
        ? describeAnatomy(npc, target, { arousalLevel: arousalLevel || 0, isAroused: (arousalLevel || 0) > 50, isWet: (arousalLevel || 0) > 60, possessivePronoun: posPronoun })
        : null;
    var plain = posPronoun + " " + (target || "body");
    var skinDesc = (typeof getSkinDescription === "function") ? (getSkinDescription(npc) || "") : "";
    // describeVagina sometimes returns a "through her..." pubic-hair
    // construction built for spread-style phrasing. Only the spread
    // branch below absorbs it; plain verbs (lick, kiss, suck, thrust)
    // read broken after it, so they use safeDesc and fall back to the
    // possessive target instead.
    var safeDesc = (anatomyDesc && /^(through|to|between|across|over|past)\b/i.test(anatomyDesc)) ? null : anatomyDesc;

    // Fingering - the ongoing in-and-out motion.
    if (verb === "finger" || (tool === "fingers" && (verb === "enter" || verb === "slide"))) {
        if (target === "vagina" || target === "pussy" || target === "clitoris" || target === "clit") {
            return pickRandom([
                `Your finger slides in and out of ${posPronoun} slick folds.`,
                `You keep fingering ${safeDesc || plain}, your fingers curling inside ${posPronoun} with each pass.`
            ]);
        }
        if (target === "anus" || target === "ass" || target === "butthole") {
            return pickRandom([
                `Your finger slides in and out of ${posPronoun} sphincter.`,
                `You keep working your finger into ${posPronoun} tight ring, in and out in a slow rhythm.`
            ]);
        }
    }

    // Kissing - continuous contact.
    if (verb === "kiss") {
        var kissTarget = safeDesc || plain;
        return pickRandom([
            skinDesc
                ? `You continue kissing ${posPronoun} ${skinDesc}, your lips pressed against ${kissTarget}.`
                : `You continue kissing ${kissTarget}, the contact unbroken.`,
            `Your lips stay pressed to ${kissTarget}, the kiss going on.`
        ]);
    }

    // Oral - licking and sucking keep going.
    if (verb === "lick") {
        return pickRandom([
            `You keep licking ${safeDesc || plain}, your tongue moving in slow strokes.`,
            `Your tongue keeps working over ${safeDesc || plain}, unhurried and steady.`
        ]);
    }
    if (verb === "suck") {
        // The clit is a small nub: lips sealed around it in gentle,
        // steady pressure — hollowed cheeks (cock suction) never fit it.
        if (target === "clitoris" || target === "clit") {
            // Clit descriptions carry a possessive ("her clitoris") even
            // when describeAnatomy returns the bare target word.
            var clitDesc = (safeDesc && !/^(her|his|their|its)\b/i.test(safeDesc))
                ? posPronoun + " " + safeDesc
                : (safeDesc || plain);
            return pickRandom([
                `Your mouth stays sealed around ${clitDesc}, keeping gentle, steady pressure.`,
                `You keep suckling ${clitDesc}, your lips sealed soft around the little nub.`
            ]);
        }
        return pickRandom([
            `Your mouth stays sealed around ${safeDesc || plain}, sucking steady.`,
            `You keep sucking ${safeDesc || plain}, cheeks hollowed around it.`
        ]);
    }

    // Hand teasing - groping, stroking, rubbing.

    if (tool === "hand" || tool === "hands") {
        var ing = (typeof verbConjugation === "function") ? verbConjugation(verb, "ing") : (verb + "ing");
        // Spreading takes both hands.
        if (verb === "spread") {
            return pickRandom([
                `Your hands keep ${ing} ${anatomyDesc || plain} apart.`,
                `You keep ${ing} ${anatomyDesc || plain} apart with both hands.`
            ]);
        }
        return pickRandom([
            `Your hand keeps ${ing} ${safeDesc || plain}.`,
            `You keep ${ing} ${safeDesc || plain}, steady and unhurried.`
        ]);
    }

    // Penetration - the ongoing thrust, not a staged re-entry.
    if (act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE) {
        return pickRandom([
            `You keep thrusting into ${safeDesc || plain}.`,
            `Your cock keeps moving inside ${safeDesc || plain} in deep, steady strokes.`,
            `You keep fucking ${safeDesc || plain}, your rhythm never breaking.`
        ]);
    }

    // Grinding and other bodily contact.
    if (verb === "grind" || verb === "press" || verb === "rub") {
        return `You keep ${verb === "press" ? "pressing against" : verb + "ing against"} ${safeDesc || plain}.`;
    }

    return null;
}

function buildActionNarratives(npc, actionId, act, context) {
    const { verb, target, tool, playerIsBottom } = act;
    const { arousalLevel = 0, isAroused = false, isWet = false, isErect = false, isOnCooldown = false, intimacy = null, player = null, isContinueAction = false } = context;
    const anatomy = npc.anatomy || {};
    const gender = (npc.gender || "").toLowerCase();
    const isFemale = gender === "female" || gender.includes("female");
    
    const posPronoun = (typeof getPossessivePronoun === 'function' ? getPossessivePronoun(npc) : "their") || "her";
    const subjectPronoun = (typeof getSubjectPronoun === 'function' ? getSubjectPronoun(npc) : "They") || "she";
    // For penetration verbs, use penis as tool unless explicitly using fingers
    let actualTool = tool;
    const verbBase = verb || actionId.split("_")[0] || "touch";
    const isFingerAction = verbBase === 'finger' || actionId.toLowerCase().includes('finger');
    const isPenetrationVerb = ['fuck', 'thrust', 'pound', 'penetrate', 'enter', 'bury', 'slide', 'grind', 'pump', 'bottom out'].includes(verbBase);
    if (isPenetrationVerb && !isFingerAction && context.player) {
        const playerGender = (context.player.gender || "male").toLowerCase();
        if (playerGender === "male" || playerGender.includes("male")) {
            actualTool = "penis";
        } else if (playerGender === "female" || playerGender.includes("female")) {
            actualTool = "strap-on";
        }
    }
    
    const narratives = [];

    // Clothing actions: return a simple clothing narration.
    if (act.type === "clothing" || (typeof ACT_TYPES !== "undefined" && act.type === ACT_TYPES.CLOTHING)) {
        return [buildClothingNarration(act, npc, context.player)];
    }

    // Watersports actions: build a simple narration describing the act.
    if (act.type === "watersport" || (typeof ACT_TYPES !== "undefined" && act.type === ACT_TYPES.WATERSPORT)) {
        var peeTarget = target || "body";
        var whose = posPronoun;
        var targetPhrase = whose + " " + peeTarget;
        if (peeTarget === "face") targetPhrase = whose + " face";
        else if (peeTarget === "buttocks") targetPhrase = whose + " buttocks";
        return [
            "You release a stream of warm urine onto " + targetPhrase + ".",
            "You let go, the warm stream trickling down " + targetPhrase + ".",
            "You aim and pee onto " + targetPhrase + ", the warmth spreading across " + whose + " skin.",
            "You relax and let the stream flow, the warm wetness splashing over " + targetPhrase + ".",
            "The pressure releases, your piss arcing out onto " + targetPhrase + " in a steady flow."
        ];
    }

    // END actions (including pull_out_generic): return empty — the narration
    // is handled by endPenetrationWithNarration / generateEndResponse, not
    // by buildActionNarratives. Without this guard, target.toLowerCase()
    // throws since END acts have no target.
    if (act.type === "end" || (typeof ACT_TYPES !== "undefined" && act.type === ACT_TYPES.END)) {
        return [];
    }

    // Get rich anatomy description
    let anatomyDesc = describeAnatomy(npc, target, { arousalLevel, isAroused, isWet, isErect, possessivePronoun: posPronoun, isOnCooldown }) || target || "";

    // For over-clothes actions (id ends with "_clothed"), replace the rich
    // anatomy description with a clothing-appropriate generic term so hidden
    // physical characteristics (breast size, nipple details, etc.) are not
    // revealed through clothing. The narration should reference the clothed
    // surface, not bare anatomy.
    if (actionId && actionId.includes("_clothed")) {
        const targetLower = String(target || "").toLowerCase();
        let clothedTerm = "";
        if (targetLower === "breasts" || targetLower === "chest") {
            clothedTerm = posPronoun + " chest through " + posPronoun + " clothes";
        } else if (targetLower === "butt" || targetLower === "buttocks" || targetLower === "ass") {
            clothedTerm = posPronoun + " backside through " + posPronoun + " clothes";
        } else if (targetLower === "groin" || targetLower === "vagina" || targetLower === "pussy" || targetLower === "penis" || targetLower === "cock") {
            clothedTerm = posPronoun + " groin through " + posPronoun + " clothes";
        } else {
            clothedTerm = posPronoun + " " + (target || "body") + " through " + posPronoun + " clothes";
        }
        anatomyDesc = clothedTerm;
    }
    
    // For continue actions with anal penetration, replace "closed" descriptors with more appropriate ones
    // Since the anus is already penetrated, it shouldn't be described as "closed" or "shut"
    if (isContinueAction && (target === "anus" || target === "ass")) {
        anatomyDesc = anatomyDesc
            .replace(/firmly closed/i, "tightly clenching")
            .replace(/resistant/i, "clenching")
            .replace(/shyly guarded/i, "gripping")
            .replace(/tense and shut/i, "tight")
            .replace(/tightly squeezed/i, "clenching")
            .replace(/shut/i, "tight");
    }
    
    // Create modified act with corrected tool for penetration actions
    const modifiedAct = isPenetrationVerb && !isFingerAction && actualTool !== tool ? { ...act, tool: actualTool } : act;
    // Verb tense adjustments
    const verbPresent = verbConjugation(verbBase, 'present');
    const verbIng = verbConjugation(verbBase, 'ing');
    
    // For continue actions on penetration acts, DON'T prepend "continue to" —
    // the player is already inside. The verb should describe ongoing
    // intercourse, not a re-entry. "You thrust into her" is correct for both
    // first thrust and continued thrusting. "Continue to thrust" sounds
    // like the player paused and is starting again.
    var continueVerbPresent;
    if (isContinueAction && (act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE)) {
        // Penetration continue: use the verb as-is (no "continue to" prefix)
        continueVerbPresent = verbPresent;
    } else {
        // Non-penetration continue: keep "continue to" prefix
        continueVerbPresent = isContinueAction ? `continue to ${verbPresent}` : verbPresent;
    }
    
    // Spit-on acts have dedicated templates — the generic per-target
    // builders slot the phrasal verb into slots built for single-word
    // verbs, which reads stiff. These also serve as the BASE RESPONSE
    // facts the AI response polisher enriches.
    if (verbBase === "spit on") {
        narratives.push(...buildSpitOnNarratives(npc, target, posPronoun, subjectPronoun, context));
        return narratives;
    }

    // Generate narratives based on action type and target
    switch (target.toLowerCase()) {
        case "vagina":
        case "pussy":
        case "clitoris":
        case "clit":
            narratives.push(...buildVaginaNarratives(npc, verbBase, continueVerbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, modifiedAct));
            break;
            
        case "penis":
        case "cock":
        case "dick":
            narratives.push(...buildPenisNarratives(npc, verbBase, continueVerbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, modifiedAct));
            break;
            
        case "testicles":
        case "balls":
            narratives.push(...buildTesticlesNarratives(npc, verbBase, continueVerbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, modifiedAct));
            break;
            
        case "breasts":
        case "nipples":
            narratives.push(...buildBreastNarratives(npc, verbBase, continueVerbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, modifiedAct));
            break;
            
        case "anus":
            narratives.push(...buildAnusNarratives(npc, verbBase, continueVerbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, modifiedAct));
            break;
            
        case "butt":
        case "buttocks":
        case "ass":
            narratives.push(...buildButtockNarratives(npc, verbBase, continueVerbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, modifiedAct));
            break;
            
        case "mouth":
        case "lips":
            narratives.push(...buildMouthNarratives(npc, verbBase, continueVerbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, modifiedAct));
            break;
            
        case "thighs":
        case "thigh":
            narratives.push(...buildThighNarratives(npc, verbBase, continueVerbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, modifiedAct));
            break;
            
        default:
            // Generic narrative for other targets
            const genericTool = tool || "hand";
            const genericToolVerb = getVerbForTool(verbBase, genericTool);
            
            // Helper function to ensure possessive pronoun is added to anatomy description
            const ensurePossessive = (desc) => {
                if (!desc) return posPronoun || "her";
                const trimmedDesc = String(desc).trim();
                const trimmedPronoun = posPronoun ? posPronoun.trim() : "her";
                // Check if description already starts with possessive pronoun
                if (trimmedPronoun && (trimmedDesc.startsWith(trimmedPronoun + ' ') || trimmedDesc === trimmedPronoun)) {
                    return trimmedDesc;
                }
                // Remove leading articles if present
                const withoutArticle = trimmedDesc.replace(/^(a |an |the )/i, '').trim();
                return trimmedPronoun ? `${trimmedPronoun} ${withoutArticle}` : withoutArticle;
            };
            
            // Handle ejaculation on body parts
            if (verbBase === 'ejaculate' || verbBase === 'ejaculate on') {
                // For external ejaculation, use "on" preposition
                // Ensure possessive pronoun is included in anatomy description
                const fullTarget = ensurePossessive(anatomyDesc);
                
                // Get penis state descriptor based on cooldown
                const penisState = isOnCooldown ? pickRandom(['limp', 'flaccid', 'soft', 'spent']) : pickRandom(['hard', 'rigid', 'throbbing', 'engorged']);
                
                narratives.push(
                    `You ejaculate on ${fullTarget}, coating it with your hot cum.`,
                    `You release on ${fullTarget}, your thick seed splattering across the surface.`,
                    `Your ${penisState} penis ejaculates on ${fullTarget}, jets of cum landing on the warm skin.`,
                    `You climax on ${fullTarget}, your cum painting it with sticky warmth.`
                );
            } else {
                // For generic body parts (face, neck, cheek, etc.), ensure possessive pronoun is included
                const fullAnatomyDesc = ensurePossessive(anatomyDesc);
                narratives.push(
                    `You ${continueVerbPresent} ${fullAnatomyDesc}.`,
                    `Your ${genericTool} ${genericToolVerb} ${fullAnatomyDesc}.`,
                    `You reach out and ${continueVerbPresent} ${fullAnatomyDesc}.`,
                    `You lean in close and ${continueVerbPresent} ${fullAnatomyDesc}, taking your time.`,
                    `Your ${genericTool} ${genericToolVerb} ${fullAnatomyDesc} with slow, deliberate movements.`
                );
            }
    }
    
    return narratives;
}

/**
 * Get the correct verb form based on tool (singular vs plural)
 * @param {string} verb - The base verb
 * @param {string} tool - The tool being used
 * @returns {string} - The properly conjugated verb
 */
function getVerbForTool(verb, tool) {
    // Special case: "finger" verb with fingers tool sounds awkward
    // Use "enter" or keep as is based on context
    if (verb === 'finger' && tool === 'fingers') {
        return verbConjugation('enter', 'present'); // "enter" for plural fingers
    }
    
    // Plural tools use base verb form
    const pluralTools = new Set(['fingers', 'hands', 'palms', 'testicles', 'balls', 'lips', 'teeth']);
    
    if (pluralTools.has(tool)) {
        return verbConjugation(verb, 'present'); // Base form for plural
    } else {
        return verbConjugation(verb, 'third'); // Third person singular for singular tools
    }
}

/**
 * Conjugate verbs for narrative
 */
function verbConjugation(verb, form) {
    if (!verb) return form === 'ing' ? 'doing' : form === 'present' ? 'do' : 'does';
    const irregulars = {
        touch: { present: "touch", ing: "touching", third: "touches" },
        kiss: { present: "kiss", ing: "kissing", third: "kisses" },
        lick: { present: "lick", ing: "licking", third: "licks" },
        suck: { present: "suck", ing: "sucking", third: "sucks" },
        stroke: { present: "stroke", ing: "stroking", third: "strokes" },
        rub: { present: "rub", ing: "rubbing", third: "rubs" },
        squeeze: { present: "squeeze", ing: "squeezing", third: "squeezes" },
        tease: { present: "tease", ing: "teasing", third: "teases" },
        grope: { present: "grope", ing: "groping", third: "gropes" },
        finger: { present: "finger", ing: "fingering", third: "fingers" },
        fuck: { present: "fuck", ing: "fucking", third: "fucks" },
        thrust: { present: "thrust", ing: "thrusting", third: "thrusts" },
        enter: { present: "enter", ing: "entering", third: "enters" },
        penetrate: { present: "penetrate", ing: "penetrating", third: "penetrates" },
        caress: { present: "caress", ing: "caressing", third: "caresses" },
        massage: { present: "massage", ing: "massaging", third: "massages" },
        pinch: { present: "pinch", ing: "pinching", third: "pinches" },
        spread: { present: "spread", ing: "spreading", third: "spreads" },
        press: { present: "press", ing: "pressing", third: "presses" },
        grind: { present: "grind", ing: "grinding", third: "grinds" },
        bite: { present: "bite", ing: "biting", third: "bites" },
        nibble: { present: "nibble", ing: "nibbling", third: "nibbles" },
        flick: { present: "flick", ing: "flicking", third: "flicks" },
        slap: { present: "slap", ing: "slapping", third: "slaps" },
        rim: { present: "rim", ing: "rimming", third: "rims" },
        circle: { present: "circle", ing: "circling", third: "circles" },
        "spit on": { present: "spit on", ing: "spitting on", third: "spits on" }
    };
    
    const conjugated = irregulars[verb.toLowerCase()];
    if (conjugated && conjugated[form]) {
        return conjugated[form];
    }
    
    // Default conjugation
    if (form === 'ing') {
        if (verb.endsWith('e')) return verb.slice(0, -1) + 'ing';
        if (verb.endsWith('ie')) return verb.slice(0, -2) + 'ying';
        if (verb.match(/[^aeiou]e$/)) return verb + 'ing';
        return verb + 'ing';
    }
    if (form === 'third') {
        // Third person singular: add 's' or 'es' as appropriate
        if (verb.endsWith('s') || verb.endsWith('sh') || verb.endsWith('ch') || verb.endsWith('x') || verb.endsWith('z') || verb.endsWith('o')) {
            return verb + 'es';
        }
        if (verb.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(verb.charAt(verb.length - 2))) {
            return verb.slice(0, -1) + 'ies';
        }
        return verb + 's';
    }
    return verb;
}

/**
 * Staged, beat-by-beat narration for the first press of a cock against a
 * vagina — the vaginal counterpart of buildStagedAnalEntry. Mode-keyed:
 * "virgin" (maidenhead), "big" (player much larger), "easy" (open, slick
 * or highly aroused) and "tight" (default first entry). Each passage walks
 * the entry in stages — contact, slicking the head through her folds, the
 * slow stretch, the crown popping past the entrance, the accommodation
 * pause, the slide, and sometimes a fullness protest or a partial
 * withdrawal — with random beat variants so repeat encounters read fresh.
 */
function buildStagedVaginalEntry(npc, o) {
    var she = String(o.subjectPronoun || "She");
    var sheLower = she.toLowerCase();
    var her = String(o.posPronoun || "her");
    var cockState = o.cockState || "hard";
    var opening = pickRandom(["entrance", "opening", "little hole", "slit"]);
    var mode = o.mode || "tight";
    var beats = [];
    var advanceTail = (o.getSound ? o.getSound() : "") + (o.scentDesc ? ", " + o.scentDesc : "") + ".";

    if (mode === "virgin") {
        beats.push(pickRandom([
            `You guide the head of your ${cockState} cock to ${o.anatomyDesc}, pressing softly against ${her} untried entrance.`,
            `You ease the tip of your ${cockState} cock into ${o.anatomyDesc}, finding ${her} untouched opening.`
        ]));
        beats.push(`The folds part around your tip, slick but snug, and ${she} tenses all over.`);
        beats.push(pickRandom([
            `You meet the thin resistance of ${her} maidenhead and push past it in one slow, deliberate stroke — an inch, then two.`,
            `You press until you feel the fragile barrier give way, sinking the first careful inches into heat that has never known this.`
        ]));
        beats.push(pickRandom([
            `${she} lets out a sharp cry, ${her} nails digging into you.`,
            `${she} whimpers and grips you tight, ${her} breath coming in shudders.`
        ]));
        beats.push(pickRandom([
            `You stop there, half inside, and let ${her} body learn your shape, murmuring against ${her} ear until the clenching eases.`,
            `You hold still above ${her}, half-buried, waiting out the sting in slow, gentle rolls.`
        ]));
        beats.push(`You sink the rest of the way in by slow inches, ${her} rippling grip enveloping your shaft${advanceTail} ${she} clings to you, stretched and full for the first time.`);
        return beats.join(" ");
    }

    if (mode === "big") {
        beats.push(pickRandom([
            `You notch the head of your ${cockState} cock at ${o.anatomyDesc} and push.`,
            `You set the crown of your ${cockState} cock against ${o.anatomyDesc} and lean in with your hips.`
        ]));
        beats.push(`${she} exhales hard at the first stretch as the crown wedges into ${her} ${opening}.`);
        beats.push(pickRandom([
            `You feed it in by degrees, tiny rolls of your hips gaining a slow, straining inch.`,
            `You work the head in with small, patient rocks, ${her} small frame pinned open around your girth.`
        ]));
        beats.push(pickRandom([
            `Halfway in you stop and let ${her} adjust, stuffed open on you and breathing in shallow bursts.`,
            `You pause at half your length, feeling ${her} walls clamp down around you, the grip so tight it borders on burning.`
        ]));
        if (Math.random() < 0.6) {
            beats.push(pickRandom([
                `"I can't — you're too big," ${sheLower} pants, though ${her} hips keep tilting up for more.`,
                `"It won't fit..." ${sheLower} whimpers, even as ${her} body swallows another inch.`
            ]));
        }
        beats.push(`You rock the last inches home one at a time, until your hips finally meet ${her} skin${advanceTail}`);
        return beats.join(" ");
    }

    // "used" - sloppy seconds: the hole was already fucked (and
    // possibly filled) recently, so the entry is a completely different
    // scene from a first penetration: no resistance, wet squelch, the
    // residue of earlier rounds, matted pubic hair. Flavor words come
    // in via o.usedDescriptors (swollen/puffy/red/sweaty/pungent/
    // messy/slick/drenched).
    if (mode === "used") {
        var uDescs = (o.usedDescriptors && o.usedDescriptors.length) ? o.usedDescriptors : ["slick"];
        var uPhrase = uDescs.length >= 2 ? uDescs.slice(0, 2).join(" and ") : uDescs[0];
        var uHair = o.hasPubicHair ? String(o.pubicDesc || "bush") : "";
        beats.push(pickRandom([
            `You set the head of your ${cockState} cock at ${o.anatomyDesc} and push - and ${her} well-used entrance offers no resistance at all.`,
            `You guide the crown to ${o.anatomyDesc}, already ${uPhrase} from the rounds before, and it sinks in on the first press.`
        ]));
        if (o.hasFreshLoad) {
            beats.push(pickRandom([
                `The first inch slides through your own spend - the wet heat squelches around you, and a pearly ribbon of it wells up along your shaft, drooling back out over ${her} rim.`,
                `You slide back into the mess you left, ${her} hole pushing a gurgle of spent cum out around your shaft as it re-opens.`
            ]));
        } else {
            beats.push(pickRandom([
                `${her} folds part loose and easy, ${uPhrase} and still remembering your shape.`,
                `The entrance gives with a practiced ease - ${uPhrase}, well-opened from the fucking before, and it swallows the crown without a catch.`
            ]));
        }
        if (uHair) {
            if (o.hasFreshLoad) {
                beats.push(pickRandom([
                    `Your dried load has matted ${her} ${uHair} into stiff, dark tangles that drag and smear across your shaft as you push deeper.`,
                    `${her} ${uHair} is clumped with the residue of earlier, and it smears wet again as you grind against it.`
                ]));
            } else {
                beats.push(pickRandom([
                    `Dried slickness stiffens the hair of ${her} ${uHair}, and your shaft re-wets it as it passes.`,
                    `The mess of the earlier rounds clings in ${her} ${uHair} until your motion works it back to a slick, sticky sheen.`
                ]));
            }
        }
        beats.push(pickRandom([
            `${she} groans at the easy fullness, ${her} body taking you like it never stopped.`,
            `${she} shivers and presses back onto you with a low, shameless sound - ${her} used hole too open to grip the way it did the first time.`
        ]));
        beats.push(`You glide home in one long stroke, right to the root, the sloppy sounds of it loud in the quiet${advanceTail}`);
        if (Math.random() < 0.5) {
            beats.push(pickRandom([
                `You draw back until only the head remains, and the mess strings out after you - slick and dripping - before you plunge back in.`,
                `A slow pull out, then one hard thrust back in, and the wet slap of it makes ${sheLower} gasp.`
            ]));
        }
        return beats.join(" ");
    }

    if (mode === "easy") {
        beats.push(pickRandom([
            `You slide the head of your ${cockState} cock up along ${o.anatomyDesc} until it catches at ${her} entrance.`,
            `You drag the head through ${o.anatomyDesc}, slicking the crown in ${her} wetness, then seat it at ${her} opening.`
        ]));
        beats.push(pickRandom([
            `One smooth push and the crown slips in, the first inch swallowed easy.`,
            `The entrance gives on the first press, parting around the crown like it was waiting for it.`
        ]));
        beats.push(pickRandom([
            `${she} lets out a low, satisfied moan.`,
            `${she} hums and settles around you, ${her} hips shifting to take more.`
        ]));
        beats.push(`The rest glides home in a single slow stroke, ${her} slick heat molding around every inch of you.`);
        beats.push(`You settle deep and hold, ${her} hot, tight depths around your shaft${advanceTail}`);
        if (Math.random() < 0.4) {
            beats.push(`You draw back until only the crown stays inside, then slide home again, deeper and smoother than the first pass.`);
        }
        return beats.join(" ");
    }

    // "tight" — the default first-entry scene.
    beats.push(pickRandom([
        `You press the head of your ${cockState} cock against ${o.anatomyDesc} and apply pressure.`,
        `You set the head of your ${cockState} cock at ${her} ${opening} and lean in with your hips.`,
        `You nestle the head of your ${cockState} cock into ${o.anatomyDesc}, letting it rest hot against ${her} entrance.`
    ]));
    if (Math.random() < 0.7) {
        beats.push(pickRandom([
            `You drag the head up and down ${her} slit first, coating the crown in ${her} wetness.`,
            `You work the head through ${her} outer lips, gathering slick before you try for more.`
        ]));
    }
    beats.push(pickRandom([
        `The folds part around your tip, slick but snug, and the first push only gains a fraction.`,
        `You push, and ${her} lips dent inward around the crown, stubborn and hot.`,
        `The entrance resists the first press, tight and clenching under the head.`
    ]));
    beats.push(pickRandom([
        `${she} lets a sharp hiss out through clenched teeth.`,
        `${she} sucks in a breath and holds it, ${her} thighs tightening.`,
        `${she} tenses all over, a thin whimper escaping ${her} lips.`
    ]));
    beats.push(pickRandom([
        `You keep steady pressure on, and ${her} entrance gives slowly, widening around the crown until the head pops past and the grip slides shut behind it.`,
        `You keep the pressure on and feel ${her} body yield by degrees, the snug ring hugging the crown until it finally relaxes and lets the head in.`
    ]));
    if (Math.random() < 0.7) {
        beats.push(pickRandom([
            `"Fuck," ${sheLower} exhales.`,
            `"Oh, fuck," ${sheLower} breathes.`,
            `"Nngh—" ${sheLower} grinds out, ${her} knuckles going white.`
        ]));
    }
    beats.push(pickRandom([
        `You wait a moment for ${her} body to accommodate you, your ${cockState} shaft still entirely outside, ${her} lips sealed around your cockhead like a hot little kiss.`,
        `You hold still and let ${her} adjust, ${her} entrance clamped just behind the crown while the rest of you waits.`
    ]));
    if (!o.hasLube && !o.isWet) {
        beats.push(pickRandom([
            `You spit on your fingers and work the wetness into ${her} folds, slicking the way.`,
            `You gather spit on your fingertips and smear it over ${her} entrance, the only slickness on offer.`
        ]));
    } else if (o.isWet) {
        beats.push(pickRandom([
            `${she} is wet enough already — ${her} own slickness coats the crown where it rests inside ${her}.`,
            `Slick already smears down your shaft where it waits against ${her}.`
        ]));
    }
    beats.push(pickRandom([
        `You press forward again and this time you gain traction, the first inches of shaft sinking into ${her} clenching heat.`,
        `You lean in and start to gain ground, your shaft beginning to slide in, and ${sheLower} grunts.`,
        `You rock forward and feel ${her} give way, inch after inch of you dragging through the snug grip.`
    ]));
    beats.push(`You keep the pressure steady, your cock disappearing into ${her} inch by inch, ${her} rippling heat enveloping your shaft as you press forward${advanceTail}`);
    if (Math.random() < 0.45) {
        beats.push(pickRandom([
            `"Ugh... so full," ${sheLower} breathes, pressing a hand against your thigh to slow you.`,
            `"No more — it's too much," ${sheLower} pants, ${her} palm flat on your thigh, though ${her} hips push back a little anyway.`
        ]));
    }
    if (Math.random() < 0.5) {
        beats.push(pickRandom([
            `You draw back until ${her} entrance drags at your crown, then push home again a little deeper.`,
            `You pull out until only the head remains caught in ${her}, then sink back in, smoother this time.`
        ]));
    }
    return beats.join(" ");
}

/**
 * Build vagina/pussy action narratives
 */
/**
 * Narratives for the spit-on acts (spit_on_vagina / _cock / _anus /
 * _breasts). One-shot utility beats — slicking a part with saliva
 * (lube on vagina/anus) or a rougher splash on the chest — so they get
 * hand-written variety instead of the generic verb templates. The AI
 * polisher also receives these as the beat's base facts.
 */
function buildSpitOnNarratives(npc, target, posPronoun, subjectPronoun, context) {
    const targetLower = String(target || "").toLowerCase();
    const subjLower = String(subjectPronoun || "they").toLowerCase();
    let options = [];
    if (targetLower === "vagina" || targetLower === "pussy" || targetLower === "clitoris" || targetLower === "clit") {
        options = [
            `You gather saliva and let it fall onto ${posPronoun} pussy, the glistening strand sliding between ${posPronoun} folds.`,
            `You spit onto ${posPronoun} pussy, the warm wetness dripping down ${posPronoun} slit.`,
            `Working up a mouthful, you drool it over ${posPronoun} pussy, slicking ${posPronoun} lips until they shine.`,
            `You hawk and spit a thick wad right onto ${posPronoun} entrance, the wet slap making ${subjLower} flinch.`,
            `You lean over ${posPronoun} bare pussy and let a long thread of spit drop onto it, the slickness spreading slowly.`
        ];
    } else if (targetLower === "anus" || targetLower === "ass") {
        // Cloaca-bearing NPCs: the spit lands on the vent, not a mammalian anus.
        if (npcHasCloacaFlag(npc)) {
            options = [
                `You spit on ${posPronoun} vent, the wetness trailing down over the scaled seam.`,
                `You gather a mouthful and let it drip onto ${posPronoun} vent, watching the spit pool at its tight ring.`,
                `You lean in close and spit directly onto ${posPronoun} vent, the slick warmth coating the muscular opening.`,
                `A thick wad lands square on ${posPronoun} vent, slowly sliding along the scaled seam.`
            ];
        } else {
        options = [
            `You spit on ${posPronoun} ass, the wetness trailing down over ${posPronoun} tight pucker.`,
            `You gather a mouthful and let it drip onto ${posPronoun} ass, watching the spit pool around ${posPronoun} rim.`,
            `You lean in close and spit directly onto ${posPronoun} asshole, the slick warmth coating the tight ring.`,
            `A thick wad lands square on ${posPronoun} back entrance, slowly sliding into ${posPronoun} crack.`
        ];
        }
    } else if (targetLower === "penis" || targetLower === "cock" || targetLower === "dick") {
        options = [
            `You spit onto ${posPronoun} cock, the warm wetness running down ${posPronoun} shaft.`,
            `You gather saliva and drool it over ${posPronoun} cock, slicking it from tip to base.`,
            `You hawk and spit on ${posPronoun} shaft, the wet sheen catching the light.`,
            `A thick glob lands on ${posPronoun} cock, and you watch the spit slide down ${posPronoun} length.`
        ];
    } else if (targetLower === "breasts" || targetLower === "breast" || targetLower === "nipples" || targetLower === "chest") {
        options = [
            `You spit on ${posPronoun} bare chest, the wetness sliding down between ${posPronoun} breasts.`,
            `You let a long thread of saliva drop onto ${posPronoun} breasts, watching it trail across ${posPronoun} nipple.`,
            `You gather a mouthful and drool it over ${posPronoun} tits, leaving ${posPronoun} skin slick and shining.`,
            `A thick wad lands on ${posPronoun} breast, the spit slowly dripping down the curve.`
        ];
    } else {
        options = [
            `You gather saliva and spit on ${posPronoun} ${targetLower || "skin"}, the wetness glistening as it spreads.`,
            `You hawk and let a thick wad land on ${posPronoun} ${targetLower || "skin"}.`
        ];
    }
    return options;
}

function buildVaginaNarratives(npc, verbBase, verbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, act = {}) {
    const { arousalLevel = 0, player = null, isOnCooldown = false, isContinueAction = false, isWet = false } = context;
    const { tool = null } = act;
    const highArousal = arousalLevel > 70;
    const mediumArousal = arousalLevel > 40;

    // Get player gender for tool-specific narratives
    const playerGender = player ? (player.gender || "").toLowerCase() : "male";
    const playerHasPenis = player && player.anatomy && (player.anatomy.penis || player.anatomy.cock);
    const playerHasVagina = player && player.anatomy && (player.anatomy.vagina || player.anatomy.pussy);
    
    // Get skin tone for occasional references
    const skinDesc = npc ? getSkinDescription(npc) : "";
    const includeSkin = skinDesc && Math.random() < 0.3; // 30% chance to mention skin
    
    // Get scent descriptor (handled by getScentDescriptor function)
    const scentDesc = getScentDescriptor(npc, 'vagina', false);
    
    // Check if vagina is well-used for lewd sound descriptors
    const vaginaAnatomy = (npc.anatomy && npc.anatomy.vagina) || {};
    const vaginaSize = vaginaAnatomy.size || "snug";
    const isVaginaOpen = vaginaSize === "loose" || vaginaSize === "gaping" || vaginaSize === "stretchy";
    
    // Check for lube/cum to make sounds more likely
    const intimacy = context.intimacy || {};
    const hasLube = intimacy.lube && intimacy.lube.vagina && intimacy.lube.vagina.hasLube;
    const hasInternalEjaculation = intimacy.climax && intimacy.climax.hasInternalEjaculation && intimacy.climax.lastInternalEjaculation === "vagina";
    const isSlick = hasLube || hasInternalEjaculation;
    
    // Lewd sound descriptor for well-used, slick vaginas during intercourse
    const getVaginalSound = () => {
        if (!isVaginaOpen || !isSlick) return "";
        return pickRandom([
            " with wet squelching sounds",
            " the slick sloshing filling the air",
            " the messy, wet sounds echoing between you",
            " with obscene squelching noises"
        ]);
    };
    
    // Helper to extract just the vagina part (without pubic hair prefix)
    // This handles various formats from describeVagina:
    // - "through a wild tangle of jet black pubic hair to her glistening plump vagina" → "her glistening plump vagina"
    // - "a wild tangle of jet black pubic hair, parting to reveal her glistening plump vagina" → "her glistening plump vagina"
    // - "her glistening plump vagina, framed by a wild tangle of jet black pubic hair" → "her glistening plump vagina"
    // - "the plump labia of her vagina" → "the plump labia of her vagina"
    const getVaginaOnlyDesc = () => {
        // Try to extract what comes after "reveal" (for "X, parting to reveal Y" format)
        // Check this first because "to reveal" could match the /to/ pattern
        const revealMatch = anatomyDesc.match(/reveal\s+([^,.]+)/i);
        if (revealMatch) return revealMatch[1];
        
        // Try to extract what comes before "framed by" (for "X, framed by Y" format)
        const framedMatch = anatomyDesc.match(/^([^,]+),\s*framed by/i);
        if (framedMatch) return framedMatch[1];
        
        // Try to extract what comes after "to" (for "through X to Y" format)
        // Only match if "to" is not followed by "reveal"
        const toMatch = anatomyDesc.match(/to\s+([^,]+)/i);
        if (toMatch && !anatomyDesc.includes('reveal')) return toMatch[1];
        
        // If it starts with possessive pronoun, use as is
        if (anatomyDesc.startsWith(posPronoun)) return anatomyDesc;
        
        // Otherwise use the full description
        return anatomyDesc;
    };
    
    // Get clean anatomy description (removes pubic hair prefix for general use)
    const cleanAnatomyDesc = getVaginaOnlyDesc();
    
    // Get penis state descriptor based on cooldown
    const penisState = isOnCooldown ? pickRandom(['limp', 'flaccid', 'soft', 'spent']) : pickRandom(['hard', 'rigid', 'throbbing', 'engorged']);
    const cockState = isOnCooldown ? pickRandom(['limp', 'flaccid', 'soft', 'spent']) : pickRandom(['hard', 'rigid', 'throbbing', 'engorged']);
    const shaftState = isOnCooldown ? pickRandom(['soft', 'limp', 'flaccid']) : pickRandom(['hard', 'rigid', 'throbbing']);
    
    const narratives = [];
    const pubicDesc = getPubicDescription(npc);
    
    // Gentle touching - occasionally include skin tone
    // Use actual tool from act, or default to fingers for backward compatibility
    const actualTool = tool || 'fingers';
    const toolVerb = getVerbForTool(verbBase, actualTool);
    
    // For penetration verbs, use "into" preposition and specify tool
    const penetrationVerbs = ['fuck', 'thrust', 'pound', 'penetrate', 'enter', 'bury', 'slide', 'grind', 'pump', 'bottom out'];
    const isPenetrationVerb = penetrationVerbs.includes(verbBase);
    
    narratives.push(
        // For penetration, use "with your [tool]" pattern for clarity
        isPenetrationVerb && actualTool ? `You ${verbPresent} ${cleanAnatomyDesc} with your ${actualTool}.` : `You ${verbPresent} ${cleanAnatomyDesc}.`,
        // Also include the "Your [tool] [verb] into..." variant
        isPenetrationVerb && actualTool ? `Your ${actualTool} ${toolVerb} into ${cleanAnatomyDesc}.` : `Your ${actualTool} ${toolVerb} ${cleanAnatomyDesc}.`
    );
    
    // Spreading/parting - improved to avoid awkward phrasing
    // When parting labia, include skin tone and interior color for richness
    const interiorColor = npc ? getVaginalInteriorColor(npc) : "";
    const skinPhrase = includeSkin ? `${skinDesc} ` : "";
    
    if (verbBase === 'part' || verbBase === 'spread') {
        narratives.push(
            `You part ${posPronoun} ${pubicDesc} and ${verbPresent} ${cleanAnatomyDesc}.`,
            `You part ${posPronoun} ${pubicDesc}, ${verbPresent} ${cleanAnatomyDesc}.`,
            // Enhanced with skin tone
            `You part ${posPronoun} ${skinPhrase}${pubicDesc}, revealing the ${interiorColor} folds within.`,
            `Spreading ${posPronoun} legs, you part ${posPronoun} ${skinPhrase}${pubicDesc} to expose ${interiorColor} labia.`
        );
    } else {
        // For non-part/spread verbs, the "part pubic hair and verb" pattern
        // only makes sense for first contact. For continue actions, skip the
        // parting description and just describe the action directly.
        if (!isContinueAction) {
            narratives.push(
                `You part ${posPronoun} ${pubicDesc} and ${verbPresent} ${cleanAnatomyDesc}.`,
                `You part ${posPronoun} ${pubicDesc}, ${verbPresent} ${cleanAnatomyDesc}.`
            );
        }
    }
    
    // Licking specific
    if (verbBase === 'lick') {
        narratives.push(
            `Your tongue ${verbIng} ${cleanAnatomyDesc}, tasting ${posPronoun} ${highArousal ? 'sweet nectar' : 'warm essence'}.`,
            `You trace your tongue along ${cleanAnatomyDesc}, savoring every ${highArousal ? 'dripping' : 'moist'} inch.`
        );
    }
    
    // Finger penetration — dedicated templates for fingering that avoid
    // "her her" duplication and produce varied, vivid descriptions
    if (verbBase === 'finger' || verbBase === 'penetrate') {
        // cleanAnatomyDesc may already start with posPronoun ("her plump labia")
        // so don't prepend another posPronoun before it
        narratives.push(
            `You slide your fingers into ${cleanAnatomyDesc}, ${posPronoun} ${highArousal ? 'slick walls gripping you' : 'warm channel tightening around you'}.`,
            `You curl your fingers inside ${cleanAnatomyDesc}, pressing against ${posPronoun} ${highArousal ? 'swollen front wall' : 'inner ridge'}.`,
            `Your fingers pump into ${cleanAnatomyDesc}, the wet sounds filling the air.`
        );
        if (highArousal) {
            narratives.push(
                `You thrust your fingers deep into ${cleanAnatomyDesc}, ${posPronoun} juices coating your hand.`
            );
        }
    }

    // Teasing
    if (verbBase === 'tease') {
        narratives.push(
            `You ${verbPresent} ${cleanAnatomyDesc}, drawing ${highArousal ? 'soft moans' : 'gentle gasps'} from ${posPronoun} lips.`,
            `You ${verbPresent} ${cleanAnatomyDesc} in slow circles, ${posPronoun} hips shifting toward your touch.`,
            `You ${verbPresent} ${cleanAnatomyDesc} with featherlight strokes, smiling as ${subjectPronoun.toLowerCase()} ${highArousal ? 'whimpers for more' : 'squirms at the contact'}.`
        );
    }
    
    // Rubbing
    if (verbBase === 'rub') {
        narratives.push(
            `You ${verbPresent} ${cleanAnatomyDesc}, creating delicious friction against ${posPronoun} ${highArousal ? 'soaked' : 'dampening'} folds.`,
            `You ${verbPresent} ${cleanAnatomyDesc} with the pad of your fingers, ${highArousal ? posPronoun + ' slickness coating your skin' : 'warmth building under your touch'}.`,
            `Your palm ${verbIng} ${cleanAnatomyDesc} in a steady rhythm, pressing ${highArousal ? 'firm and insistent' : 'gently at first'} against the heat.`
        );
    }
    
    // Penetration/enter - staged, beat-by-beat initial insertion via
    // buildStagedVaginalEntry. Keyed on virginity, relative size, and
    // wetness/lube/openness so the same act reads differently on different
    // NPCs. The staged scene REPLACES the one-liner pool for entry acts —
    // the first press should read as a full beat sequence, never "You
    // enter her vagina."
    if (verbBase === 'enter' || verbBase === 'penetrate') {
        if (actualTool === 'penis' || actualTool === 'cock') {
            const _vIsVirgin = !!(npc.intimacy && npc.intimacy.virginity && npc.intimacy.virginity.vaginal);
            const _vRel = (typeof getRelativeSize === 'function' && player) ? getRelativeSize(player, npc) : "";
            const _vPlayerBig = (_vRel === "player-larger" || _vRel === "player-much-larger");
            const _vOpen = isVaginaOpen;

            // "used" - sloppy seconds: a recently-fucked (or filled)
            // hole narrates a completely different entry from a fresh
            // one. Virgin still wins; used beats the size-mismatch
            // mode - a cum-slicked hole swallows even a big cock
            // without the struggle beats.
            var _vUsed = isHoleUsedForEntry(npc, "vagina");
            var _vMode = _vIsVirgin ? "virgin"
                : (_vUsed ? "used"
                : (_vPlayerBig ? "big"
                : ((_vOpen || isSlick || highArousal) ? "easy" : "tight")));
            var _vPubicHair = String(pubicDesc || "");
            var _vOpts = {
                mode: _vMode,
                cockState: cockState,
                posPronoun: posPronoun,
                subjectPronoun: subjectPronoun,
                anatomyDesc: cleanAnatomyDesc,
                pubicDesc: pubicDesc,
                scentDesc: scentDesc,
                getSound: getVaginalSound,
                isWet: isWet,
                hasLube: hasLube,
                highArousal: highArousal,
                hasFreshLoad: hasFreshLoadIn(npc, "vagina"),
                usedDescriptors: _vUsed ? getUsedHoleDescriptors(npc, "vagina", arousalLevel) : [],
                hasPubicHair: !!(_vPubicHair && !/smooth|bare|shaven|vent|scaled/i.test(_vPubicHair))
            };
            narratives.length = 0;
            narratives.push(buildStagedVaginalEntry(npc, _vOpts), buildStagedVaginalEntry(npc, _vOpts));
            return narratives;
        } else if (actualTool === 'mouth' || actualTool === 'tongue') {
            narratives.push(
                `Your tongue presses into ${cleanAnatomyDesc}, working past ${posPronoun} folds and into ${posPronoun} heat${scentDesc ? ', ' + scentDesc : ''}.`
            );
        } else {
            narratives.push(
                `You ${verbPresent} ${cleanAnatomyDesc}, feeling ${posPronoun} warmth close around your ${actualTool}${scentDesc ? ', ' + scentDesc : ''}.`
            );
        }
    }
    
    // Intercourse actions - already inside, describe the feeling.
    // Depth-aware: shallow (1-2), half (3), deep (4), hilted (5) so
    // repeated Continue clicks read as a progression, not a loop.
    if (verbBase === 'fuck' || verbBase === 'thrust' || verbBase === 'pound' || verbBase === 'grind' || verbBase === 'slide') {
        narratives.push(
            `You ${verbPresent} ${cleanAnatomyDesc}, ${posPronoun} slick channel ${highArousal ? 'clenching your shaft desperately' : 'gripping your shaft tightly'}${getVaginalSound()}${scentDesc ? ', ' + scentDesc : ''}.`
        );
        const _d = (intimacy.penetration && intimacy.penetration.depth) || 1;
        if (_d >= 5) {
            narratives.push(
                `You ${verbPresent} into ${posPronoun} hilt, hips meeting ${posPronoun} skin with every stroke, the root of your shaft buried in ${posPronoun} clenching heat${getVaginalSound()}.`,
                `You drive the full length home again and again, bottoming out inside ${posPronoun} depths while ${subjectPronoun.toLowerCase()} shakes with each impact${getVaginalSound()}.`
            );
        } else if (_d >= 3) {
            narratives.push(
                `You ${verbPresent} in long, deep strokes, half your length dragging out and pushing back in, ${posPronoun} hot, tight grip on every pull${getVaginalSound()}.`,
                `You work deeper with each thrust, seating more of yourself inside ${cleanAnatomyDesc} until ${subjectPronoun.toLowerCase()} gasps at the fullness${getVaginalSound()}.`
            );
        } else {
            narratives.push(
                `You ${verbPresent} in shallow strokes, keeping just the first few inches moving inside ${posPronoun}, letting ${posPronoun} feel every ridge of you${getVaginalSound()}.`,
                `You rock against ${cleanAnatomyDesc}, unhurried, barely pulling out before sinking back in${getVaginalSound()}.`
            );
        }
    }
    
    // Press verb - gender and tool aware
    if (verbBase === 'press') {
        if (tool === 'penis' || tool === 'cock') {
            // Player pressing their penis/cock against the NPC's vagina
            const cockPart = pickRandom(['cockhead', 'cock', 'shaft', 'tip']);
            narratives.push(
                `You press your ${cockState} ${cockPart} against ${cleanAnatomyDesc}.`,
                `You press your ${cockState} ${cockPart} to ${cleanAnatomyDesc}, feeling the ${highArousal ? 'hot, wet' : 'warm, welcoming'} flesh.`,
                `Positioning yourself, you press your ${cockState} ${cockPart} against ${cleanAnatomyDesc}.`,
                `You guide your ${cockState} ${cockPart} to ${cleanAnatomyDesc}, both of you ${highArousal ? 'aching with need' : 'eager for more'}.`
            );
        } else {
            // Hand/fingers pressing
            const handPart = pickRandom(['fingers', 'hand', 'palm', 'touch']);
            if (handPart === 'touch') {
                narratives.push(`You press your ${handPart} to ${cleanAnatomyDesc}.`);
            } else {
                narratives.push(
                    `You press your ${handPart} against ${cleanAnatomyDesc}.`,
                    `You press your ${handPart} to ${cleanAnatomyDesc}, feeling the ${highArousal ? 'dripping wet' : 'warm'} heat.`,
                    `You apply gentle pressure with your ${handPart} to ${cleanAnatomyDesc}.`
                );
            }
        }
    }
    
    // Check if this is ejaculation - needs special handling with prepositions
    const isEjaculation = verbBase === 'ejaculate' || verbBase === 'ejaculate on';
    
    // For ejaculation, use proper prepositions and enhanced descriptors
    if (isEjaculation) {
        // Get player gender for tool-specific narratives
        const playerGender = player ? (player.gender || "").toLowerCase() : "male";
        const playerHasPenis = player && player.anatomy && (player.anatomy.penis || player.anatomy.cock);
        
        // Check if there has been internal ejaculation before (for semen drip narratives)
        const intimacy = context.intimacy || {};
        const hasInternalEjaculation = intimacy.climax && intimacy.climax.hasInternalEjaculation;
        const lastEjaculationTarget = intimacy.climax ? intimacy.climax.lastInternalEjaculation : null;
        const isMultipleEjaculation = lastEjaculationTarget === "vagina";
        
        // For multiple ejaculations, always include sloshing/sound descriptors
        const sloshingSound = isMultipleEjaculation ? pickRandom([
            'with wet squelching sounds',
            'the slick sloshing filling the air',
            'lewd noises escaping with each movement',
            'the messy, wet sounds of your release'
        ]) : '';
        // Sound suffix needs its own comma — splicing it in with a bare
        // space produced "deep within , musky scent" style broken punctuation.
        const soundSuffix = isMultipleEjaculation && sloshingSound ? ', ' + sloshingSound : '';
        
        // Check vagina state - if it's been well-used, describe it as such
        const vaginaAnatomy = (npc.anatomy && npc.anatomy.vagina) || {};
        const vaginaSize = vaginaAnatomy.size || "snug";
        const isVaginaOpen = vaginaSize === "loose" || vaginaSize === "gaping" || vaginaSize === "stretchy";
        
        // Adjust channel description based on state
        const channelDesc = isVaginaOpen ? pickRandom(['well-used channel', 'stretched passage', 'yielding sheath', 'soaked depths']) : pickRandom(['tight channel', 'clenching sheath', 'snug passage', 'gripping depths']);
        
        narratives.push(
            `You ejaculate into ${cleanAnatomyDesc}, filling ${posPronoun} ${channelDesc} with ${isMultipleEjaculation ? 'another thick deposit, mixing with the slick pool already there' : 'your hot cum, the warm fluid spreading deep within'}${soundSuffix}${scentDesc ? ', ' + scentDesc : ''}.`,
            `You release deep inside ${cleanAnatomyDesc}, ${isMultipleEjaculation ? 'adding more to the growing pool of semen in ' : 'pumping your seed into '}${posPronoun} warm, welcoming ${channelDesc} with a wet sound${scentDesc ? ', ' + scentDesc : ''}.`,
            `You climax inside ${cleanAnatomyDesc}, your ejaculation ${isMultipleEjaculation ? 'joining the previous load with a lewd squelch, ' + posPronoun + ' depths struggling to contain it all' : 'filling ' + posPronoun + ' ' + channelDesc + ', the slick walls clenching around your release'}${scentDesc ? ', ' + scentDesc : ''}.`,
            `Your ${penisState} penis ejaculates into ${cleanAnatomyDesc}, ${isMultipleEjaculation ? 'more semen joining the existing pool, dripping out around your shaft with each pulse as ' : 'thick spurts of cum coating '}${posPronoun} inner walls${isMultipleEjaculation ? ' clench tight' : ' as they clench tight'}${scentDesc ? ', ' + scentDesc : ''}.`,
            `You fill ${cleanAnatomyDesc} with your seed, ${isVaginaOpen ? 'the relaxed folds accepting' : 'the slick folds greedily drawing in'} your ${isMultipleEjaculation ? 'additional' : 'hot'} release, the warmth spreading through ${posPronoun} core${scentDesc ? ', ' + scentDesc : ''}.`,
            `Your ${cockState} cock pulses into ${cleanAnatomyDesc}, ${isMultipleEjaculation ? 'another load of cum adding to the mess inside ' + posPronoun + ' ' + channelDesc + ', some squirting out around your shaft with each thrust' : 'hot jets of semen flooding ' + posPronoun + ' ' + channelDesc}${scentDesc ? ', ' + scentDesc : ''}.`
        );
    }
    
    return narratives.filter(Boolean);
}

/**
 * Build penis/cock action narratives
 */
function buildPenisNarratives(npc, verbBase, verbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, act = {}) {
    const { arousalLevel = 0, intimacy = null, isContinueAction = false } = context;
    const highArousal = arousalLevel > 70;
    const actualTool = act.tool || pickRandom(['hand', 'fingers', 'palm']);
    const toolVerb = getVerbForTool(verbBase, actualTool);
    
    // Check if NPC is male and on cooldown
    const npcGender = (npc.gender || "").toLowerCase();
    const isNPConCooldown = (npcGender === "male" || npcGender.includes("male")) && intimacy && intimacy.climax && intimacy.climax.npcCooldownUntil && Date.now() < intimacy.climax.npcCooldownUntil;
    
    return [
        `You ${verbPresent} ${anatomyDesc}.`,
        `Your ${actualTool} ${toolVerb} ${anatomyDesc}.`,
        verbBase === 'stroke' ? `You ${verbPresent} the length of ${anatomyDesc}, feeling the ${highArousal ? 'pulsing heat' : 'warm weight'} in your palm.` : null,
        verbBase === 'suck' || verbBase === 'lick' ? `Your ${actualTool === 'mouth' ? 'mouth' : 'tongue'} ${verbIng} ${anatomyDesc}, ${highArousal ? 'taking the full length' : 'exploring the shaft'}.` : null,
        verbBase === 'squeeze' ? `You ${verbPresent} ${anatomyDesc}, massaging the ${highArousal ? 'throbbing' : 'firm'} shaft.` : null,
        `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'feeling the throbbing heat' : 'savoring the firm weight'}.`
    ].filter(Boolean);
}

/**
 * Build testicles action narratives
 */
function buildTesticlesNarratives(npc, verbBase, verbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, act = {}) {
    const { arousalLevel = 0, isContinueAction = false } = context;
    const highArousal = arousalLevel > 70;
    const actualTool = act.tool || 'fingers';
    const toolVerb = getVerbForTool(verbBase, actualTool);
    
    return [
        `You ${verbPresent} ${anatomyDesc}.`,
        `Your ${actualTool} ${toolVerb} ${anatomyDesc}.`,
        verbBase === 'squeeze' ? `You gently ${verbPresent} ${anatomyDesc}, ${highArousal ? 'feeling them draw up tight against ' + (typeof getObjectPronoun === "function" ? getObjectPronoun(npc) : "them") : 'feeling their warm weight in your palm'}.` : null,
        verbBase === 'cupp' || verbBase === 'cup' ? `You cup ${anatomyDesc} in your palm, massaging the heavy orbs.` : null,
        verbBase === 'fondle' ? `You fondle ${anatomyDesc}, rolling them gently in your ${pickRandom(['hand', 'palm', 'fingers'])}.` : null,
        `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'feeling them shift in your hand' : 'enjoying the texture'}.`
    ].filter(Boolean);
}

/**
 * Build breast/nipple action narratives
 */
function buildBreastNarratives(npc, verbBase, verbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, act = {}) {
    const { arousalLevel = 0, isContinueAction = false } = context;
    const highArousal = arousalLevel > 70;
    const actualTool = verbBase === 'bite' ? 'teeth' : (verbBase === 'pinch' ? 'fingers' : (act.tool || pickRandom(['hands', 'palms', 'fingers'])));
    const toolVerb = getVerbForTool(verbBase, actualTool);

    // Get nipple erection state for nipple-targeted acts
    var nippleState = (typeof getNippleState === 'function' && (act.target === 'nipples' || verbBase === 'pinch' || verbBase === 'flick' || verbBase === 'bite')) ? getNippleState(npc, arousalLevel) : null;
    var nBudDesc = nippleState ? nippleState.budDesc : "";
    var nAreolaTex = nippleState ? nippleState.areolaTexture : "";
    var nSensation = nippleState ? nippleState.sensation : "";
    var nErection = nippleState ? nippleState.erection : "";

    return [
        `You ${verbPresent} ${anatomyDesc}.`,
        `Your ${actualTool} ${toolVerb} ${anatomyDesc}.`,
        verbBase === 'squeeze' ? `You ${verbPresent} ${anatomyDesc}, feeling the ${highArousal ? 'firm, needy' : 'soft, warm'} flesh yield under your touch.` : null,
        verbBase === 'kiss' ? `You press your lips to ${anatomyDesc}, ${highArousal ? 'tracing the soft curves with your tongue' : 'exploring the warm surface'}.` : null,
        verbBase === 'lick' ? `Your tongue ${verbIng} ${anatomyDesc}, ${highArousal ? 'tracing the soft curves' : 'exploring the warm surface'}.` : null,
        verbBase === 'suck' ? `Your mouth ${verbIng} ${anatomyDesc}, ${highArousal ? 'drawing them firmly between your lips' : 'wrapping your lips around them'}.` : null,
        // Pinch — uses fingers, not "hand". References areola texture and nipple
        // erection state. Pinch is a firm, targeted squeeze of the nipple
        // between fingertips — distinct from the lighter "flick" action.
        verbBase === 'pinch' ? `You ${verbPresent} ${nBudDesc ? nBudDesc : anatomyDesc} between your fingertips, ${nAreolaTex ? nAreolaTex + ', ' : ''}${nSensation || 'rolling the firm bud with deliberate pressure'}.` : null,
        verbBase === 'pinch' ? `Your fingers close around ${nBudDesc ? nBudDesc : anatomyDesc}, ${nErection === 'erect' ? 'the stiff flesh resistant between your grip' : nErection === 'stiffening' ? 'the hardening bud firming under your touch' : 'the soft bud yielding to your pressure'}.` : null,
        verbBase === 'pinch' ? `You trap ${nBudDesc ? nBudDesc : anatomyDesc} between thumb and finger, ${nAreolaTex || 'pinching gently'}, ${nSensation || 'the sensitive flesh responding to the pressure'}.` : null,
        verbBase === 'pinch' ? `Your fingertips ${verbPresent} ${nBudDesc ? nBudDesc : anatomyDesc}, ${highArousal ? 'tugging with firm, deliberate pressure' : 'squeezing with careful, measured force'}.` : null,
        verbBase === 'pinch' ? `You ${verbPresent} ${anatomyDesc}, feeling the ${highArousal ? 'stiff peaks harden' : 'buds tighten'} under your grip${nAreolaTex ? ', ' + nAreolaTex : ''}.` : null,
        // Flick — lighter than pinch, fingertip tap
        verbBase === 'flick' ? `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'the firm peaks bouncing under the impact' : 'the soft buds twitching at the tap'}.` : null,
        verbBase === 'flick' ? `Your fingertip ${toolVerb} ${nBudDesc ? nBudDesc : anatomyDesc}, ${nSensation ? nSensation : 'a quick, sharp tap that makes them stiffen'}.` : null,
        verbBase === 'tease' ? `You ${verbPresent} ${anatomyDesc}, circling but never quite touching the ${highArousal ? 'hard, aching' : 'perky'} tips.` : null,
        // Bite/nibble — uses teeth, not "mouth biting". Alternate between
        // gentle nibble and slightly firmer bite. Never too hard.
        verbBase === 'bite' ? `Your teeth graze ${anatomyDesc}, nibbling gently at the ${highArousal ? 'stiff peaks' : 'sensitive buds'}.` : null,
        verbBase === 'bite' ? `You ${verbPresent} ${anatomyDesc} with your teeth, a careful pinch of pressure that makes ${posPronoun} breath catch.` : null,
        verbBase === 'bite' ? `You nibble at ${anatomyDesc}, your teeth barely closing around the ${highArousal ? 'swollen' : 'firm'} nub before releasing.` : null,
        verbBase === 'bite' ? `Your teeth close softly around ${anatomyDesc}, the gentle pressure sending a shiver through ${posPronoun} chest.` : null,
        verbBase === 'bite' ? `You nip at ${anatomyDesc}, a fleeting pinch of teeth that makes ${posPronoun} ${highArousal ? 'stiff nipples' : 'buds'} tighten instinctively.` : null,
        verbBase === 'bite' ? `Your teeth trace the edge of ${anatomyDesc}, nibbling in tiny, deliberate increments until ${posPronoun} breath hitches.` : null,
        verbBase === 'bite' || verbBase === 'pinch' || verbBase === 'flick' ? null : `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'feeling the warm flesh giving way' : 'enjoying the soft texture'}.`
    ].filter(Boolean);
}

/**
 * Build anus action narratives
 */
/**
 * Staged, beat-by-beat narration for the first press of a cock against an
 * anus — the slow-entry scene, assembled from random beat variants so
 * repeat encounters read differently: contact, the failed first press,
 * repositioning, working the head, her hiss, the slow stretch, the pop
 * past the sphincter, the accommodation pause, improvised lube, the slide,
 * and sometimes a fullness protest or a partial withdrawal. Blocked entries
 * stop early and read as a failure. This mirrors the authored sample style:
 * mechanical, physical, told one step at a time.
 */
function buildStagedAnalEntry(npc, o) {
    var she = String(o.subjectPronoun || "She");
    var sheLower = she.toLowerCase();
    var her = String(o.posPronoun || "her");
    var cockState = o.cockState || "hard";
    var opening = pickRandom(["pucker", "little star", "tight ring", "small puckered entrance"]);
    var isDifficult = o.canInsert === "difficult";
    var beats = [];

    // Blocked: press, slip, press again, failure. Short by design.
    if (o.canInsert === "blocked") {
        var blocked = `You press the head of your ${cockState} cock against ${o.anatomyDesc} and apply pressure, but your cockhead slides to the side — the tight entrance unyielding. You reposition, seating the crown squarely on ${her} ${opening}, and push until the wrinkled skin pulls taut, but the ring refuses to open. `;
        blocked += o.playerLarger
            ? `You're simply too big for ${her} small body — ${sheLower} pulls away with a sharp intake of breath.`
            : `You push harder, but the muscle won't give, and you can't get it in.`;
        if (o.scentDesc) {
            var _scent = o.scentDesc.replace(/^and\s+/i, "").replace(/^./, function (c) { return c.toUpperCase(); });
            blocked += " " + _scent + ".";
        }
        return blocked;
    }

    // Beat 1 — contact.
    beats.push(pickRandom([
        `You press the head of your ${cockState} cock against ${o.anatomyDesc} and apply pressure.`,
        `You set the head of your ${cockState} cock against ${o.anatomyDesc} and lean into it with your hips.`,
        `You nestle the head of your ${cockState} cock into the warm crease of ${her} ass, finding ${her} ${opening} and guiding the tip against it.`
    ]));

    // Beat 2 — the first press fails (always when difficult, usually otherwise).
    if (isDifficult || Math.random() < 0.6) {
        beats.push(pickRandom([
            `Your cockhead slides to the side, the tight entrance unyielding.`,
            `The crown skids off the clenched muscle instead of digging in — too dry, too tight.`,
            `The ring dimples under you but won't part, and your cockhead slips loose.`
        ]));
        // Beat 3 — reposition and work the head.
        beats.push(pickRandom([
            `You reposition, seating the crown squarely on ${her} ${opening}, and push until the wrinkled skin pulls taut around it.`,
            `You line yourself up again, pressing dead center on ${her} ${opening} until the wrinkled flesh goes smooth and taut under the head.`
        ]));
        beats.push(pickRandom([
            `You grip your shaft and wiggle the cockhead against ${her} hole, smearing precum over the clenched muscle until it starts to give.`,
            `You take your shaft in hand and work the head against the ring in slow circles, the smear of precum slicking ${her} pucker until the stranglehold of the muscle begins to ease.`,
            `You hold the crown against the resisting ring and rock your hips, working precum into ${her} pucker until it loosens a fraction.`
        ]));
    }

    // Beat 4 — her reaction as the stretch begins.
    beats.push(pickRandom([
        `${she} lets a sharp hiss out through clenched teeth.`,
        `${she} sucks in a breath and holds it, ${her} cheeks clenching under you.`,
        `${she} tenses all over, a thin whimper escaping ${her} lips.`
    ]));

    // Beat 5 — the slow stretch.
    beats.push(isDifficult
        ? `You keep the pressure on and ${her} pucker gives only grudgingly, widening a millimeter at a time around your cockhead.`
        : `You keep the pressure on, and ${her} pucker widens slowly, the ring dilating around your cockhead until it starts to slide into ${her} ass.`);

    // Beat 6 — past the sphincter.
    beats.push(isDifficult
        ? `A final, straining push gets you past the sphincter — your cockhead lodges just inside ${her} asshole, the vise-like muscle clamping down behind the crown, the heat of ${her} insides startling against your glans.`
        : `You get past the sphincter with one last push, your cockhead now lodged just inside ${her} asshole, the vise-like muscle sealed behind the crown, ${her} inner heat warm on your glans.`);

    // Beat 7 — a short vocal, sometimes.
    if (Math.random() < 0.7) {
        beats.push(pickRandom([
            `"Fuck," ${sheLower} exhales.`,
            `"Oh, fuck," ${sheLower} breathes.`,
            `"Nngh—" ${sheLower} grinds out, ${her} knuckles going white.`
        ]));
    }

    // Beat 8 — the accommodation pause.
    beats.push(pickRandom([
        `You wait a moment for ${her} body to accommodate you, your ${cockState} shaft still entirely outside, ${her} ass impaled on nothing but your cockhead, the tight ring holding you in place like a suction cup.`,
        `You hold still and let ${her} body adjust, ${her} sphincter clamped around your cockhead like a suction cup while the rest of you waits outside.`
    ]));

    // Beat 9 — improvised lube when none was applied.
    if (!o.hasLube) {
        if (o.isFemale && o.isWet) {
            beats.push(pickRandom([
                `You spit on ${her} asshole and rub the spit around with your fingers, then plunge a finger into ${her} hot folds and work it in and out a few strokes before pulling it out and smearing her juices along your shaft.`,
                `You dribble spit onto ${her} pucker and massage it in with a fingertip, then dip the finger into ${her} wet heat a few times, painting your shaft with her slickness.`
            ]));
        } else {
            beats.push(pickRandom([
                `You spit into your palm and slick your shaft with it, working the moisture over the taut skin until it shines.`,
                `You gather spit on your fingers and smear it over ${her} pucker and your shaft alike, the only lubricant on offer.`
            ]));
        }
    }

    // Beat 10 — the slide begins.
    beats.push(pickRandom([
        `You lean in and start to gain traction, your shaft beginning to slide in, and ${sheLower} grunts.`,
        `You press forward again and this time you gain traction, the first inches of shaft sinking into ${her} clenching heat.`,
        `You rock forward and feel the ring give way, inch after inch of you dragging through the snug grip.`
    ]));

    // Beat 11 — the slow advance, closing with sound and scent.
    beats.push((isDifficult
        ? `You keep the pressure steady and ${her} heat swallows you by grudging inches, every one hard-won as ${her} body clamps down on you`
        : `You keep the pressure steady, your cock disappearing into ${her} ass inch by inch, ${her} burning heat enveloping your shaft as you press forward`)
        + (o.getSound ? o.getSound() : "")
        + (o.scentDesc ? ", " + o.scentDesc : "")
        + ".");

    // Beat 12 — a fullness protest, sometimes.
    if (Math.random() < 0.45) {
        beats.push(pickRandom([
            `"Ugh... so full," ${sheLower} breathes, pressing a hand against your thigh to slow you.`,
            `"No more — it's too much," ${sheLower} pants, ${her} palm flat on your thigh, though ${her} hips push back a little anyway.`
        ]));
    }

    // Beat 13 — a partial withdrawal and re-entry, sometimes.
    if (Math.random() < 0.5) {
        beats.push(pickRandom([
            `You draw back slowly, ${her} stretched pucker dragging along your shaft like a suction cup, then push back in.`,
            `You pull out to the crown, drawing a ragged gasp from ${her} at the drag, then slide home again a little deeper than before.`
        ]));
    }

    var text = beats.join(" ");
    if (o.deterrenceDesc) text += " " + o.deterrenceDesc + ".";
    return text;
}

function buildAnusNarratives(npc, verbBase, verbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, act = {}) {
    const { arousalLevel = 0, player = null, isOnCooldown = false, isContinueAction = false, isWet = false } = context;
    const entryNpcFemale = String(npc.gender || "").toLowerCase() === "female" || String(npc.gender || "").toLowerCase().includes("female");
    const highArousal = arousalLevel > 70;
    const verbThird = verbConjugation(verbBase, 'third');
    
    // Get scent descriptor for anal acts (handled by getScentDescriptor function)
    const scentDesc = getScentDescriptor(npc, 'anus', true);

    // For uncivilized species, add visual deterrence descriptors for anal
    // — coarse hair, unwashed appearance, unappealing visuals
    var npcSpecies = (npc.species || "").toLowerCase();
    var isUncivAnal = npcSpecies && !isCivilizedSpecies(npcSpecies) && (verbBase === 'penetrate' || verbBase === 'finger' || verbBase === 'enter' || verbBase === 'fuck' || verbBase === 'thrust' || verbBase === 'pound');
    var deterrenceDesc = "";
    var isDirtyBlock = false; // can't complete due to filth
    if (isUncivAnal) {
        // 10% chance: the area is too dirty to proceed
        if (Math.random() < 0.10 && (verbBase === 'penetrate' || verbBase === 'enter')) {
            isDirtyBlock = true;
            deterrenceDesc = pickRandom([
                "The area is unwashed and filthy — you pull back, unwilling to put your cock there",
                "The smell of filth and unwashed skin is too strong. You can't bring yourself to do it",
                "You get close enough to see the state of things back there and reconsider. It's not clean",
                "The rank, sour stench of an unwashed ass makes you recoil. You pull away"
            ]);
        } else if (Math.random() < 0.35) {
            // Scaled species have no coarse hair back there — deterrence
            // reads on the unwashed state, not hair. Check actual surface type.
            var body = npc.anatomy && npc.anatomy.body;
            var surfaceType = body && String(body.surfaceType || "");
            var isScaled = surfaceType === "scales" || 
                (typeof getNPCAnatomyType === "function" && getNPCAnatomyType(npc) === "reptilian");
            deterrenceDesc = isScaled ? pickRandom([
                "The rough, unwashed scales back there give you a moment of doubt",
                "The unwashed state of the area makes you think twice"
            ]) : pickRandom([
                "The wiry hair around the hole makes you pause for a second",
                "The rough, unwashed skin back there gives you a moment of doubt",
                "The wild, unkempt hair framing the entrance catches you off guard",
                "The unwashed state of the area makes you think twice",
                "Thick, coarse hair covers everything back here — more animal than human"
            ]);
        }
    }

    // Check if anal entry should be easy (based on prior use or size advantage)
    const analEasy = isAnalEntryEasy(npc, player);
    
    // Check if anus is well-used for lewd sound descriptors
    const intimacy = context.intimacy || {};
    const anusAnatomy = (npc.anatomy && npc.anatomy.anus) || {};
    const anusSize = anusAnatomy.size || "snug";
    const isAnusOpen = anusSize === "loose" || anusSize === "gaping" || anusSize === "stretchy";
    const hasLube = intimacy.lube && intimacy.lube.anus && intimacy.lube.anus.hasLube;
    const hasInternalEjaculation = intimacy.climax && intimacy.climax.hasInternalEjaculation && intimacy.climax.lastInternalEjaculation === "anus";
    const isSlick = hasLube || hasInternalEjaculation;

    // Lewd sound descriptor for slick anus during intercourse.
    // Cum in the cavity produces distinctive sounds: bubbling, squelching,
    // squirting out. Lube alone produces smoother sliding sounds.
    const getAnalSound = () => {
        if (hasInternalEjaculation) {
            // Cum in the cavity: messy, bubbling, squirting sounds
            return pickRandom([
                " with wet, squelching sounds as your cum bubbles out around your shaft",
                " the cum-filled cavity squelching obscenely with each thrust",
                " with messy sounds as your earlier load squirts and bubbles around your cock",
                " the slick cum frothing inside as you pump in and out",
                " with lewd slurping sounds as cum squeezes out around your shaft with each thrust",
                " the mess of cum and sweat making wet, slapping sounds between you"
            ]);
        }
        if (!isAnusOpen || !isSlick) return "";
        // Lube only (no cum): smoother sliding sounds
        return pickRandom([
            " with wet squelching sounds",
            " the slick cavity sloshing with each movement",
            " with smooth, wet sounds as you slide in and out"
        ]);
    };
    
    // Get the actual tool from the act, default to hand for backward compatibility
    const actualTool = act.tool || "hand";
    const toolVerb = getVerbForTool(verbBase, actualTool);

    // Check if this is ejaculation - needs special handling with prepositions
    const isEjaculation = verbBase === 'ejaculate' || verbBase === 'ejaculate on';

    // When the penis is already inside and in motion (continued intercourse or
    // ejaculation into the anus), describe the interior — bowels/cavity/channel
    // — rather than the external pucker/sphincter, which only makes sense at
    // first contact. Finger, tease, lick, and initial-entry actions keep the
    // external description.
    if (isEjaculation || (isContinueAction && ['fuck','thrust','pound','penetrate','enter','bury','slide','grind','pump','bottom out'].includes(verbBase))) {
        anatomyDesc = posPronoun + " " + (isAnusOpen
            ? pickRandom(['well-used bowels', 'open cavity', 'stretched channel', 'yielding depths'])
            : pickRandom(['tight bowels', 'clenching cavity', 'narrow channel', 'gripping depths']));
    }

    // For ejaculation, use proper prepositions and enhanced descriptors
    if (isEjaculation) {
        // Get player gender for tool-specific narratives
        const playerGender = player ? (player.gender || "").toLowerCase() : "male";
        const playerHasPenis = player && player.anatomy && (player.anatomy.penis || player.anatomy.cock);
        
        // Get penis state descriptor based on cooldown
        const penisState = isOnCooldown ? pickRandom(['limp', 'flaccid', 'soft', 'spent']) : pickRandom(['hard', 'rigid', 'throbbing', 'engorged']);
        
        // Check if there has been internal ejaculation before (for semen drip narratives)
        const intimacy = context.intimacy || {};
        const hasInternalEjaculation = intimacy.climax && intimacy.climax.hasInternalEjaculation;
        const lastEjaculationTarget = intimacy.climax ? intimacy.climax.lastInternalEjaculation : null;
        const isMultipleEjaculation = lastEjaculationTarget === "anus";
        
        // Check anus state - if it's been stretched open, it's no longer "closed"
        const anusAnatomy = (npc.anatomy && npc.anatomy.anus) || {};
        const anusSize = anusAnatomy.size || "snug";
        const isAnusOpen = anusSize === "loose" || anusSize === "gaping" || anusSize === "stretchy";
        
        // For multiple ejaculations, always include sloshing/sound descriptors
        const sloshingSound = isMultipleEjaculation ? pickRandom([
            'with obscene squelching sounds',
            'the cavity sloshing wetly with each movement',
            'lewd sloshing noises escaping from within',
            'the slick, wet sounds filling the air'
        ]) : '';
        // Sound suffix needs its own comma — splicing it in with a bare
        // space produced "heavy with semen the cavity sloshing" and
        // "unseen depths , musky scent" style broken punctuation.
        const soundSuffix = isMultipleEjaculation && sloshingSound ? ', ' + sloshingSound : '';
        
        // Adjust cavity description based on whether it's been opened
        const cavityDesc = isAnusOpen ? pickRandom(['well-used passage', 'stretched channel', 'yielding depths', 'open bowels']) : pickRandom(['tight channel', 'gripping passage', 'snug depths', 'tight bowels']);
        
        return [
            `You ejaculate into ${anatomyDesc}, filling ${posPronoun} ${cavityDesc} with ${isMultipleEjaculation ? 'another thick deposit, the cavity already swollen and heavy with semen' : 'your hot seed, the viscous fluid filling the unseen depths'}${soundSuffix}${scentDesc ? ', ' + scentDesc : ''}.`,
            `You release into ${anatomyDesc}, ${isMultipleEjaculation ? 'adding to the growing pool of semen already sloshing in ' : 'pumping your thick cum into '}${posPronoun} ${cavityDesc} with a wet squelch${scentDesc ? ', ' + scentDesc : ''}.`,
            `You climax inside ${anatomyDesc}, your ejaculation ${isMultipleEjaculation ? 'joining the previous deposits with a lewd gurgle, ' + posPronoun + ' bowels struggling to contain the growing volume' : 'filling ' + posPronoun + ' ' + cavityDesc + ', the slick sounds of release echoing from within'}${scentDesc ? ', ' + scentDesc : ''}.`,
            `Your ${penisState} penis ejaculates into ${anatomyDesc}, ${isMultipleEjaculation ? 'more semen forcing its way into the already-full cavity, a wet squelch escaping with each pulse, filling ' : 'releasing deep into '}${posPronoun} hot, clenching ${cavityDesc}${scentDesc ? ', ' + scentDesc : ''}.`,
            `You fill ${anatomyDesc} with your seed, ${isAnusOpen ? 'the relaxed ring accepting' : 'the tight ring clamped around you while you pump'} your ${isMultipleEjaculation ? 'remaining' : 'thick'} cum into ${posPronoun} depths as the cavity makes wet, obscene sounds${scentDesc ? ', ' + scentDesc : ''}.`,
            `Your ${penisState} cock pumps into ${anatomyDesc}, ${isMultipleEjaculation ? 'another load of semen adding to the slick, sloshing mess inside, ' + posPronoun + ' bowels gurgling with the overflow' : 'hot spurt after spurt coating ' + posPronoun + ' ' + cavityDesc + ' with glistening warmth'}${scentDesc ? ', ' + scentDesc : ''}.`
        ];
    }
    
    // Get penis state descriptor based on cooldown
    const penisState = isOnCooldown ? pickRandom(['limp', 'flaccid', 'soft', 'spent']) : pickRandom(['hard', 'rigid', 'throbbing', 'engorged']);
    const cockState = isOnCooldown ? pickRandom(['limp', 'flaccid', 'soft', 'spent']) : pickRandom(['hard', 'rigid', 'throbbing', 'engorged']);
    const shaftState = isOnCooldown ? pickRandom(['soft', 'limp', 'flaccid']) : pickRandom(['hard', 'rigid', 'throbbing']);

    // First entry with a cock: the staged scene (or the easy-entry variants)
    // REPLACES the generic one-liner pool, so the first press into the ass
    // always reads as a full staged beat sequence — never "You enter her
    // anus." A dirty-blocked entry bails out with the deterrence line only.
    if ((verbBase === 'enter' || verbBase === 'penetrate') && (actualTool === 'penis' || actualTool === 'cock')) {
        if (isDirtyBlock) {
            return [deterrenceDesc + "."];
        }
        // Sloppy seconds: an ass that was fucked (and possibly filled)
        // recently reads completely differently from a first anal entry
        // - the ring already broken in, and a fresh load squeezes back
        // out around the shaft. Takes priority over the generic
        // easy-entry pool.
        if (isHoleUsedForEntry(npc, "anus")) {
            var _aNPool = getUsedHoleDescriptors(npc, "anus", arousalLevel);
            var _aNPhrase = _aNPool.length >= 2 ? _aNPool.slice(0, 2).join(" and ") : _aNPool[0];
            if (hasFreshLoadIn(npc, "anus")) {
                return [
                    `You press the head of your ${cockState} cock to ${anatomyDesc} and it gives almost at once - the ring already broken open, ${_aNPhrase}. You feed the length in through your own spend, and the mess squelches back out around your shaft in a warm rush, dripping down over ${posPronoun} taint. ${subjectPronoun} groans at the re-entry, too used to do anything but take it${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.${deterrenceDesc ? ' ' + deterrenceDesc + '.' : ''}`,
                    `You slide back into the ass you already ruined. There is no resistance worth the name - just heat, slickness, and the thick squelch of the load you left, forced out around your cock as you bury yourself to the root. ${posPronoun} pucker is ${_aNPhrase} around you, drooling your earlier cum down ${posPronoun} crack while you settle deep${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.${deterrenceDesc ? ' ' + deterrenceDesc + '.' : ''}`,
                    `One slow push takes you all the way in. The muscle yields without much fight - it knows your shape by now, wrapping you in one long, sweltering clench - and the mess inside greets you, cum welling up around your ${cockState} shaft and matting everything it touches. ${subjectPronoun} lets out a shaky breath, ${_aNPhrase} and utterly open${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.${deterrenceDesc ? ' ' + deterrenceDesc + '.' : ''}`
                ];
            }
            return [
                `The head of your ${cockState} cock finds ${anatomyDesc} already loosened - ${_aNPhrase} from the fucking before - and the ring parts around you with a practiced ease. You sink in by unhurried inches, meeting none of the fight it put up the first time, until your hips rest flush against ${posPronoun} skin. ${subjectPronoun} exhales and opens for you${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.${deterrenceDesc ? ' ' + deterrenceDesc + '.' : ''}`,
                `You push into ${anatomyDesc} and it swallows you without ceremony, the sphincter stretching around your ${cockState} girth like it is still holding the shape of the last time. ${_aNPhrase} and sensitive, the rim clenches once and then gives up, letting you glide to the root${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.${deterrenceDesc ? ' ' + deterrenceDesc + '.' : ''}`
            ];
        }
        if (analEasy) {
            return [
                `You push the head of your ${cockState} cock against ${anatomyDesc}, and the slickened ring gives on the first press. The crown pops past the clench, then the shaft follows inch by inch, ${posPronoun} heat swallowing you to the root in one slow glide. ${subjectPronoun} lets out a low, shaky breath as you settle deep${scentDesc ? ', ' + scentDesc : ''}.${deterrenceDesc ? ' ' + deterrenceDesc + '.' : ''}`,
                `You nudge ${anatomyDesc} with the head of your ${cockState} cock until the muscle slackens around you, then feed the length in by degrees — an inch, a pause, another inch — until your hips rest flush against ${posPronoun} skin. ${subjectPronoun} relaxes around you in slow ripples, taking every bit of you${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.${deterrenceDesc ? ' ' + deterrenceDesc + '.' : ''}`,
                `You slide into ${anatomyDesc} with one unhurried push, the prepared ring parting easy around your ${cockState} girth. You keep going until you're buried to the root, then hold there, letting ${subjectPronoun.toLowerCase()} adjust to the fullness before you draw back${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.${deterrenceDesc ? ' ' + deterrenceDesc + '.' : ''}`
            ];
        }
        var _entryRel = player ? getRelativeSize(player, npc) : "";
        var _entryOpts = {
            canInsert: canCompleteAnalInsertion(npc, player),
            playerLarger: (_entryRel === "player-larger" || _entryRel === "player-much-larger"),
            cockState: cockState,
            posPronoun: posPronoun,
            subjectPronoun: subjectPronoun,
            anatomyDesc: anatomyDesc,
            scentDesc: scentDesc,
            deterrenceDesc: deterrenceDesc,
            getSound: getAnalSound,
            hasLube: hasLube,
            isWet: isWet,
            isFemale: entryNpcFemale
        };
        return [buildStagedAnalEntry(npc, _entryOpts), buildStagedAnalEntry(npc, _entryOpts)];
    }

    // Determine preposition based on verb
    const getPreposition = () => {
        if (['fuck', 'thrust', 'pound', 'penetrate', 'enter', 'bury', 'slide', 'grind'].includes(verbBase)) {
            return 'into';
        }
        if (['press', 'rub', 'stroke', 'tease', 'kiss', 'lick', 'suck', 'rim', 'circle', 'spread'].includes(verbBase)) {
            return actualTool === 'mouth' || actualTool === 'tongue' ? 'on' : 'against';
        }
        return '';
    };
    
    const preposition = getPreposition();
    const prepositionText = preposition ? ` ${preposition} ` : ' ';

    return [
        `You ${verbPresent}${prepositionText}${anatomyDesc}.`,
        // For mouth/tongue tools, use "tongue" instead of "mouth" — mouths
        // don't lick, tongues do. Also skip the "on" preposition for licking.
        (actualTool === 'mouth' || actualTool === 'tongue') && (verbBase === 'lick' || verbBase === 'rim')
            ? `Your tongue ${verbConjugation(verbBase, 'third')} ${anatomyDesc}${scentDesc ? ', ' + scentDesc : ''}.`
            : `Your ${actualTool} ${toolVerb}${prepositionText}${anatomyDesc}.`,
        // Penetration/fingering - first entry, with difficulty, scent, and deterrence
        verbBase === 'finger' ?
            `You push your finger into ${anatomyDesc}, the tight sphincter gripping your digit${scentDesc ? ', ' + scentDesc : ''}.` : null,
        (verbBase === 'penetrate' || verbBase === 'enter') && (actualTool === 'mouth' || actualTool === 'tongue') ?
            `Your tongue presses into ${anatomyDesc}, working past the resistant ring${scentDesc ? ', ' + scentDesc : ''}.` : null,
        verbBase === 'tease' || verbBase === 'circle' ?
            `You ${verbPresent} ${anatomyDesc}, tracing the tight rim${scentDesc ? ', ' + scentDesc : ''}.` : null,
        verbBase === 'spread' ?
            `You ${verbPresent} ${anatomyDesc}, exposing the tight entrance${scentDesc ? ', ' + scentDesc : ''}.` : null,
        verbBase === 'lick' || verbBase === 'rim' ?
            `Your tongue ${verbConjugation(verbBase, 'third')} ${anatomyDesc}, wetting the sensitive skin with slow strokes${scentDesc ? ', ' + scentDesc : ''}.` : null,
        // Intercourse - already inside, keep it simple
        verbBase === 'fuck' || verbBase === 'thrust' || verbBase === 'pound' || verbBase === 'grind' || verbBase === 'slide' ?
            (function() {
                var _ad = (intimacy.penetration && intimacy.penetration.depth) || 1;
                if (_ad >= 5) return pickRandom([
                    `You ${verbPresent} into ${posPronoun} ass to the hilt, your hips hammering ${posPronoun} cheeks, the root of your ${shaftState} shaft ground by ${posPronoun} stretched ring${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.`,
                    `You pound the full length home with every stroke, bottoming out in ${posPronoun} bowels while ${subjectPronoun.toLowerCase()} grunts at each impact${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.`,
                    `You bottom out on every stroke and hold there a beat, marveling at the vise-like heat gripping your full length, ${posPronoun} sphincter slightly puffy where it drags at your root. ${subjectPronoun} lets out a squeal each time your hips slap home${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.`,
                    `You hammer ${posPronoun} ass in full strokes, your thighs slapping ${posPronoun} cheeks with each drive, ${posPronoun} stretched pucker dragging along your shaft like a suction cup on every withdrawal${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.`,
                    `You sheathe yourself to the root on every stroke and pound into ${posPronoun} rectum, each slam punching deep into ${posPronoun} bowels${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.`
                ]);
                if (_ad >= 3) return pickRandom([
                    `You ${verbPresent} in long, deep strokes, withdrawing until only the head stays clamped in ${posPronoun} ring, then driving back in${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.`,
                    `You work deeper with each thrust, ${posPronoun} heat loosening around you as more of your ${shaftState} shaft slides in${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.`,
                    `You take ${posPronoun} ass in slow, deliberate strokes, gaining a little more depth each time as ${posPronoun} inner walls give way around you. "So full..." ${subjectPronoun.toLowerCase()} breathes, planting a hand on your thigh to slow you${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.`,
                    `You hold ${posPronoun} hips steady and ${verbPresent} with growing confidence, ${posPronoun} loosening ring easing open a fraction more with every pass${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.`,
                    `You ${verbPresent} with steady pressure, ${posPronoun} ring gripping you in a slow burn each time you sink home, the friction building heat where the tightness drags hardest${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.`,
                    `You work the full length of your ${shaftState} shaft through ${posPronoun} rectum in long strokes, ${posPronoun} bowels clenching around you with every pass${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.`
                ]);
                return pickRandom([
                    `You ${verbPresent} into ${posPronoun} ass, the tight heat gripping your ${shaftState} shaft${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.`,
                    `You keep to shallow strokes, just the first few inches moving in ${posPronoun} clenching passage, opening ${posPronoun} up bit by bit${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.`,
                    `You hold most of your length back and ${verbPresent} carefully, the freshly-stretched ring clamping hot and tight around your crown each time you press a little deeper${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.`,
                    `You work just the head of your ${shaftState} shaft past ${posPronoun} rim and stroke shallowly, letting ${posPronoun} warm hole cling to you on each stroke${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.`
                ]);
            })() : null,
        verbBase === 'ejaculate' || verbBase === 'ejaculate on' ?
            `You ${verbPresent} into ${anatomyDesc}, filling ${posPronoun} ass with your cum.` : null,
        // Generic fallback
        (verbBase !== 'penetrate' && verbBase !== 'finger' && verbBase !== 'tease' && verbBase !== 'circle' && verbBase !== 'spread' && verbBase !== 'lick' && verbBase !== 'rim' && verbBase !== 'fuck' && verbBase !== 'thrust' && verbBase !== 'pound' && verbBase !== 'grind' && verbBase !== 'slide' && verbBase !== 'ejaculate' && verbBase !== 'ejaculate on') ?
            `You ${verbPresent} ${anatomyDesc}.` : null
    ].filter(Boolean);
}

/**
 * Build buttocks action narratives
 * For actions like spread, squeeze, grope, slap targeting buttocks/cheeks/ass
 */
function buildButtockNarratives(npc, verbBase, verbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, act = {}) {
    const { arousalLevel = 0, isOnCooldown = false, isContinueAction = false } = context;
    const highArousal = arousalLevel > 70;
    
    // Get penis state descriptor based on cooldown
    const shaftState = isOnCooldown ? pickRandom(['soft', 'limp', 'flaccid']) : pickRandom(['hard', 'rigid', 'throbbing']);
    const actualTool = act.tool || pickRandom(['hand', 'hands', 'palm', 'palms', 'fingers']);
    const toolVerb = getVerbForTool(verbBase, actualTool);
    
    // Get additional descriptions for spread actions
    const skinDesc = npc ? getSkinDescription(npc) : "";
    const includeSkin = skinDesc && Math.random() < 0.3;
    const anusDesc = npc ? describeAnatomy(npc, 'anus', {}) : "tight entrance";
    const analInterior = npc ? getAnalInteriorColor(npc) : "";
    const pubicDesc = npc ? getPubicDescription(npc) : "";
    
    return [
        // Generic
        `You ${verbPresent} ${anatomyDesc}.`,
        `Your ${actualTool} ${toolVerb} ${anatomyDesc}.`,
        
        // Spread - enhanced with anus and hair visibility
        verbBase === 'spread' ? `You ${verbPresent} ${anatomyDesc}, revealing the ${highArousal ? 'glistening' : 'tight'} cleft between ${posPronoun} cheeks.` : null,
        verbBase === 'spread' ? `You part ${anatomyDesc}, exposing the ${highArousal ? 'moist' : 'hidden'} valley.` : null,
        // Enhanced spread with anus visibility
        verbBase === 'spread' ? `You spread ${posPronoun} ${pubicDesc} cheeks apart, revealing ${includeSkin ? skinDesc + ' ' : ''}${anusDesc} with its ${analInterior} interior.` : null,
        verbBase === 'spread' ? `Parting ${posPronoun} buttocks, you expose the ${analInterior} pucker nestled between ${posPronoun} cheeks.` : null,
        
        // Squeeze
        verbBase === 'squeeze' ? `You ${verbPresent} ${anatomyDesc}, feeling the ${highArousal ? 'warm, yielding' : 'firm, resistant'} flesh.` : null,
        verbBase === 'squeeze' ? `You grip ${anatomyDesc}, massaging the ${highArousal ? 'pliant' : 'firm'} globes.` : null,
        
        // Grope
        verbBase === 'grope' ? `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'kneading the soft flesh' : 'exploring the curves'}.` : null,
        verbBase === 'grope' ? `Your ${actualTool} ${verbIng} ${anatomyDesc}, ${highArousal ? 'gripping the soft flesh' : 'exploring the firm curves'}` : null,
        
        // Slap — clear spanking with sound, skin coloring, flesh reaction
        verbBase === 'slap' ? `You slap ${anatomyDesc}, the crack of your palm echoing sharply.` : null,
        verbBase === 'slap' ? `Your hand comes down hard on ${anatomyDesc}, the flesh rippling from the impact.` : null,
        verbBase === 'slap' ? `You spank ${anatomyDesc}, the loud smack ringing out as the skin reddens under your hand.` : null,
        verbBase === 'slap' ? `You bring your palm down on ${anatomyDesc} with a sharp crack, the sting blooming ${highArousal ? 'across the flushed skin' : 'warm across the surface'}.` : null,
        
        // Kiss
        verbBase === 'kiss' ? `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'trailing your lips across the soft skin' : 'pressing a gentle kiss'}.` : null,
        
        // Generic
        `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'feeling the warm flesh' : 'enjoying the firm texture'}.`
    ].filter(Boolean);
}

/**
 * Build mouth/lips action narratives
 */
function buildMouthNarratives(npc, verbBase, verbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, act = {}) {
    const { arousalLevel = 0, isOnCooldown = false, isContinueAction = false } = context;
    const highArousal = arousalLevel > 70;
    const actualTool = act.tool || pickRandom(['lips', 'mouth']);
    const toolVerb = getVerbForTool(verbBase, actualTool);
    
    // Get penis state descriptor based on cooldown
    const penisState = isOnCooldown ? pickRandom(['limp', 'flaccid', 'soft', 'spent']) : pickRandom(['hard', 'rigid', 'throbbing', 'engorged']);
    const cockState = isOnCooldown ? pickRandom(['limp', 'flaccid', 'soft', 'spent']) : pickRandom(['hard', 'rigid', 'throbbing', 'engorged']);
    
    // Get scent descriptor (handled by getScentDescriptor function)
    const scentDesc = getScentDescriptor(npc, 'mouth', false);
    
    // Check for lube/saliva for oral sound descriptors
    const intimacy = context.intimacy || {};
    const hasLube = intimacy.lube && intimacy.lube.mouth && intimacy.lube.mouth.hasLube;
    const hasInternalEjaculation = intimacy.climax && intimacy.climax.hasInternalEjaculation && intimacy.climax.lastInternalEjaculation === "mouth";
    const isSlick = hasLube || hasInternalEjaculation || highArousal; // High arousal = more saliva
    
    // Lewd sound descriptor for slick oral sex
    const getMouthSound = () => {
        if (!isSlick) return "";
        return pickRandom([
            " with wet, sloppy sounds",
            " the obscene slurping noises filling the air",
            " with messy, drooling sounds",
            " the slick, wet sounds of oral pleasure between you",
            " your movements punctuated by lewd suction noises"
        ]);
    };
    
    // Check if this is ejaculation - needs special handling with prepositions
    const isEjaculation = verbBase === 'ejaculate' || verbBase === 'ejaculate on';
    
    // For ejaculation, use proper prepositions and enhanced descriptors
    if (isEjaculation) {
        // Get player gender for tool-specific narratives
        const player = context.player || {};
        const playerGender = player ? (player.gender || "").toLowerCase() : "male";
        
        // Check if there has been internal ejaculation before
        const intimacy = context.intimacy || {};
        const hasInternalEjaculation = intimacy.climax && intimacy.climax.hasInternalEjaculation;
        const lastEjaculationTarget = intimacy.climax ? intimacy.climax.lastInternalEjaculation : null;
        const isMultipleEjaculation = lastEjaculationTarget === "mouth";
        
        return [
            `You ejaculate into ${anatomyDesc}, filling ${posPronoun} mouth with ${isMultipleEjaculation ? 'another thick load, the warm fluid overflowing past ' + posPronoun + ' lips' : 'your hot cum, the salty fluid coating ' + posPronoun + ' tongue'}${scentDesc ? ', ' + scentDesc : ''}.`,
            `You release into ${anatomyDesc}, ${isMultipleEjaculation ? 'adding more to what is already there, some dripping from the corners of ' + posPronoun + ' mouth' : 'pumping your seed into ' + posPronoun + ' waiting mouth'} with wet, sloppy sounds${scentDesc ? ', ' + scentDesc : ''}.`,
            `You climax in ${anatomyDesc}, your ejaculation ${isMultipleEjaculation ? 'joining what is already there, the thick mixture pooling on ' + posPronoun + ' tongue' : 'coating ' + posPronoun + ' tongue and throat'}, the taste of your release filling ${posPronoun} mouth${scentDesc ? ', ' + scentDesc : ''}.`,
            `Your ${penisState} penis ejaculates into ${anatomyDesc}, ${isMultipleEjaculation ? 'more semen mixing with the existing pool, ' + posPronoun + ' throat working to swallow it all down' : 'thick spurts of cum filling ' + posPronoun + ' oral cavity'}, the warm fluid slick on ${posPronoun} palate${scentDesc ? ', ' + scentDesc : ''}.`,
            `You fill ${anatomyDesc} with your seed, ${posPronoun} ${isMultipleEjaculation ? 'struggling to contain the growing volume, some spilling past ' + posPronoun + ' lips' : 'gulping down your release, ' + posPronoun + ' throat bobbing with each swallow'}.`,
            `Your ${cockState} cock pulses into ${anatomyDesc}, ${isMultipleEjaculation ? 'another hot load for ' + posPronoun + ' already-filled mouth, the excess dripping down ' + posPronoun + ' chin' : 'hot jets of semen shooting into ' + posPronoun + ' eager mouth'}.`,
            `You erupt in ${anatomyDesc} and ${subjectPronoun.toLowerCase()} takes it all — cheeks hollowing, throat working in quick gulps as ${subjectPronoun.toLowerCase()} swallows every pulse of you, not spilling a drop.`,
            `You come in ${posPronoun} mouth and ${subjectPronoun.toLowerCase()} holds still for it, gulping your release down in slow, deliberate swallows, ${posPronoun} throat bobbing with each one.`
        ];
    }
    
    // Get favorability and attraction for mood-aware kiss narration
    var _favor = (npc.memory && typeof npc.memory.favorability === "number") ? npc.memory.favorability : 0;
    var _attraction = (npc.memory && typeof npc.memory.attraction === "number") ? npc.memory.attraction : 0;
    var _lust = (npc.memory && typeof npc.memory.lust === "number") ? npc.memory.lust : 0;
    var highFavor = _favor >= 60;
    var highAttraction = _attraction >= 30;

    return [
        `You ${verbPresent} ${anatomyDesc}.`,
        `Your ${actualTool} ${toolVerb} ${anatomyDesc}.`,
        // Kiss templates — mood-aware, with favorability and attraction details
        verbBase === 'kiss' ? (function() {
            var kissLines = [
                `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'pressing firmly, tasting the warmth of ' + posPronoun + ' breath' : 'gently touching the soft surface'}.`
            ];
            if (highFavor && highAttraction) {
                kissLines.push(
                    `Your excitement grows as you press against ${anatomyDesc}, sliding your tongue against ${posPronoun}, tasting something sweet.`,
                    `A tingle runs up your spine as ${subjectPronoun.toLowerCase()} presses ${posPronoun} mouth against yours, ${posPronoun} lips warm and inviting, and your loins tighten with the heat of it.`,
                    `You deepen the kiss against ${anatomyDesc}, your tongue finding ${posPronoun}, the soft wet contact sending a jolt through your chest.`,
                    `You kiss ${anatomyDesc} hungrily, the sweetness of ${posPronoun} mouth and the press of ${posPronoun} body against yours making your pulse race.`,
                    `You linger against ${anatomyDesc}, tasting the faint sweetness on ${posPronoun} tongue, your body responding to the warmth of the kiss with a familiar ache.`
                );
            } else if (highFavor) {
                kissLines.push(
                    `You ${verbPresent} ${anatomyDesc}, a warmth spreading through you as ${posPronoun} lips soften against yours.`,
                    `You press into the kiss, tasting ${getObjectPronoun(npc)}, the gentleness of it making your breath catch.`
                );
            } else {
                kissLines.push(
                    `You ${verbPresent} ${anatomyDesc}, the soft contact sending a pleasant warmth through you.`,
                    `Your lips meet ${anatomyDesc}, the tentative press of the kiss coaxing a quiet breath from you both.`
                );
            }
            return kissLines[Math.floor(Math.random() * kissLines.length)];
        })() : null,
        verbBase === 'suck' ? `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'drawing deeply' : 'gently pulling'}${getMouthSound()}.` : null,
        verbBase === 'bite' || verbBase === 'nibble' ? `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'with eager pressure' : 'playfully'}.` : null,
        verbBase === 'lick' ? `Your ${actualTool === 'tongue' ? actualTool : 'tongue'} ${verbIng} ${anatomyDesc}, ${highArousal ? 'hungrily' : 'exploratively'}${getMouthSound()}.` : null,
        `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'savoring the intimate contact' : 'enjoying the soft warmth'}${getMouthSound()}.`
    ].filter(Boolean);
}

/**
 * Build thighs action narratives
 */
function buildThighNarratives(npc, verbBase, verbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, act = {}) {
    const { arousalLevel = 0, isContinueAction = false } = context;
    const highArousal = arousalLevel > 70;
    const actualTool = act.tool || pickRandom(['hands', 'palms']);
    const toolVerb = getVerbForTool(verbBase, actualTool);
    
    return [
        `You ${verbPresent} ${anatomyDesc}.`,
        `Your ${actualTool} ${toolVerb} ${anatomyDesc}.`,
        verbBase === 'stroke' || verbBase === 'caress' ? `You ${verbPresent} ${anatomyDesc}, feeling the ${highArousal ? 'damp heat' : 'soft skin'} beneath your touch.` : null,
        verbBase === 'spread' || verbBase === 'part' ? `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'exposing the slick center' : 'revealing what lies between'}.` : null,
        verbBase === 'squeeze' ? `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'gripping the soft flesh' : 'feeling the firm resistance'}` : null,
        verbBase === 'kiss' ? `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'breathing in the musk of arousal' : 'enjoying the warm skin'}.` : null,
        `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'feeling the warm skin' : 'enjoying the smooth texture'}.`
    ].filter(Boolean);
}

/**
 * Get skin tone description for NPC
 * Returns descriptive phrases about the NPC's skin color
 */
function getSkinDescription(npc) {
    if (!npc) return "";

    // Try npc.skinTone first (set during NPC creation)
    var skinTone = (npc.skinTone || "").toLowerCase();

    // If no skinTone, check nsfw anatomy body color
    if (!skinTone && npc.nsfwTraits && npc.nsfwTraits.anatomy) {
        var body = npc.nsfwTraits.anatomy.body || {};
        skinTone = (body.color || "").toLowerCase();
    }

    // Also check surfaceColor (covers fur, scales, etc.)
    var surfaceColor = (npc.surfaceColor || "").toLowerCase();
    var surfaceType = (npc.surfaceType || "skin").toLowerCase();

    if (!skinTone && !surfaceColor) return "";

    // Use surfaceColor as fallback if skinTone is empty (non-human skin types)
    var effectiveTone = skinTone || surfaceColor;

    const skinDescriptors = {
        // Human-like skin tones
        'pale': ["pale", "ivory", "fair", "alabaster"],
        'fair': ["fair", "light", "cream-colored", "peaches-and-cream"],
        'tan': ["tan", "golden", "sun-kissed", "bronzed"],
        'olive': ["olive", "warm olive", "mediterranean", "dusky"],
        'brown': ["brown", "deep brown", "caramel", "mahogany"],
        'dark brown': ["dark brown", "rich chocolate", "espresso", "deep umber"],
        'black': ["dark", "ebony", "midnight", "obsidian"],
        // Fantasy skin tones
        'warm ivory': ["warm ivory", "creamy", "pearl-like", "soft ivory"],
        'copper': ["copper", "bronze", "russet", "burnished"],
        'moonlit brown': ["moonlit brown", "silvery-brown", "lunar", "shimmering brown"],
        'ruddy': ["ruddy", "rosy", "flushed", "reddish"],
        'deep brown': ["deep brown", "chocolate", "umber", "dark bronze"],
        'umber': ["umber", "earthy", "soil-toned", "muted brown"],
        'stone-pale': ["stone-pale", "pale gray", "chalky", "mineral"],
        'moss green': ["moss green", "verdigris", "forest-green", "emerald-flecked"],
        'yellow-green': ["yellow-green", "chartreuse", "lime-tinged", "citrine"],
        'ash gray': ["ash gray", "smoke-gray", "charcoal", "dusty gray"],
        'mud brown': ["mud brown", "earth-brown", "clay-colored", "swampy"],
        'sallow ochre': ["sallow ochre", "ochre", "mustard", "golden-brown"],
        'gray-green': ["gray-green", "sage", "mossy", "sea-foam"],
        'dark umber': ["dark umber", "shadowed brown", "night-brown", "blackened brown"],
        'yellowed': ["yellowed", "aged", "parchment", "waxen"],
        'smoke-stained': ["smoke-stained", "soot-dusted", "ashen", "charred"],
        'old brown': ["old brown", "weathered", "leathery", "worn"],
        'green': ["green", "emerald", "jade", "verdant"],
        'dark green': ["dark green", "forest", "deep emerald", "mossy green"],
        'gray': ["gray", "silver-gray", "steel", "pewter"],
        'mottled': ["mottled", "patchwork", "speckled", "dappled"],
        'pale blue': ["pale blue", "icy", "frost-kissed", "cerulean"],
        'silver-white': ["silver-white", "luminous", "moon-pale", "ethereal"],
        'faint green': ["faint green", "pale verdant", "ghostly green", "wisp-green"],
        'smoky gray': ["smoky gray", "misty", "fog-colored", "shadow-touched"],
        'candlelit gold': ["candlelit gold", "amber", "gilded", "warm gold"],
        'sun-browned': ["sun-browned", "weathered tan", "leathery", "wind-kissed"],
        'warm tan': ["warm tan", "golden-brown", "honey-toned", "amber"],
        'ash-white': ["ash-white", "bone-pale", "chalky", "bleached"],
        'ivory': ["ivory", "bone-white", "alabaster", "pearl"],
        'deep green': ["deep green", "forest", "emerald", "pine"],
        'olive': ["olive", "warm olive", "mediterranean", "dusky"]
    };

    const descriptors = skinDescriptors[effectiveTone] || [effectiveTone];
    var desc = pickRandom(descriptors);

    // Include surface type if it's not "skin" (fur, scales, hide, etc.)
    if (surfaceType && surfaceType !== "skin") {
        desc = desc + " " + surfaceType;
    }

    return desc;
}

/**
 * Check if anal penetration should be easy or difficult
 * Sphincters are normally tight and closed. They only open easily if:
 * - Already been penetrated in this encounter
 * - NPC is significantly larger than player (size advantage)
 * @param {Object} npc - The NPC
 * @param {Object} player - The player
 * @returns {boolean} - True if anal penetration should be easy
 */
// ============================================================================
// RELATIVE SIZE SYSTEM
// ============================================================================

/**
 * Get the size of an NPC from its species template or anatomy.
 * Returns: "tiny", "small", "medium", "large", "huge", or "medium" (default).
 */
function getNPCSize(npc) {
    if (!npc) return "medium";
    // Check anatomy first (from nsfw traits)
    if (npc.anatomy && (npc.anatomy.size || npc.anatomy.bodySize)) {
        return String(npc.anatomy.size || npc.anatomy.bodySize).toLowerCase();
    }
    // Check nsfw traits
    if (npc.nsfwTraits && npc.nsfwTraits.size) {
        return String(npc.nsfwTraits.size).toLowerCase();
    }
    // Fall back to species template
    if (typeof getSpeciesTemplate === "function") {
        var template = getSpeciesTemplate(npc.species);
        if (template && template.size) return String(template.size).toLowerCase();
    }
    // Check for species-based size (from world data via window)
    if (typeof window !== "undefined" && typeof window.getSpeciesTemplate === "function") {
        var template = window.getSpeciesTemplate(npc.species);
        if (template && template.size) return String(template.size).toLowerCase();
    }
    return "medium";
}

/**
 * Get the player's size. Player has no anatomy or species, so default to
 * "medium" (Human-sized). Could be extended to read from a player size
 * field if one is added in the future.
 */
function getPlayerSize(player) {
    if (!player) return "medium";
    if (player.size) return String(player.size).toLowerCase();
    if (player.anatomy && player.anatomy.size) return String(player.anatomy.size).toLowerCase();
    if (player.stats && player.stats.size) return String(player.stats.size).toLowerCase();
    return "medium"; // Default: Human-sized player
}

var SIZE_ORDER = ["tiny", "small", "medium", "large", "huge", "gigantic"];

/**
 * Compare player and NPC sizes. Returns a descriptor for the AI prompt
 * and template narratives:
 * - "" (same size or unknown — omit)
 * - "player-larger" (player is at least 1 size category larger)
 * - "npc-larger" (NPC is at least 1 size category larger)
 * - "player-much-larger" (2+ categories larger)
 * - "npc-much-larger" (2+ categories larger)
 */
function getRelativeSize(player, npc) {
    var pSize = getPlayerSize(player);
    var nSize = getNPCSize(npc);
    var pIdx = SIZE_ORDER.indexOf(pSize);
    var nIdx = SIZE_ORDER.indexOf(nSize);
    if (pIdx < 0) pIdx = 2; // default medium
    if (nIdx < 0) nIdx = 2;
    var diff = pIdx - nIdx;
    if (diff === 0) return "";
    if (diff >= 2) return "player-much-larger";
    if (diff === 1) return "player-larger";
    if (diff <= -2) return "npc-much-larger";
    if (diff === -1) return "npc-larger";
    return "";
}

/**
 * Get a human-readable size descriptor for the AI prompt.
 * Only returns text when sizes differ. Same size returns "".
 */
function getSizeContext(player, npc) {
    var rel = getRelativeSize(player, npc);
    if (!rel) return "";
    if (rel === "player-larger") return "Size: the player is larger than the NPC. The NPC's body is smaller, making orifices tighter and the frame more delicate beneath the player.";
    if (rel === "player-much-larger") return "Size: the player is much larger than the NPC. The size difference is significant — the NPC is small compared to the player, and their body struggles to accommodate the player's larger frame.";
    if (rel === "npc-larger") return "Size: the NPC is larger than the player. The NPC's body is bigger, with more mass and deeper orifices that envelop the player more fully.";
    if (rel === "npc-much-larger") return "Size: the NPC is much larger than the player. The size difference is significant — the NPC's large frame dwarfs the player, and their body can easily accommodate or overwhelm the player.";
    return "";
}

/**
 * Player cock color word from the profile skin tone picked at character
 * creation (player.anatomy.skinTone, materialized by
 * ensurePlayerIntimacyAnatomy).
 */
function getPlayerCockColorWord(player) {
    var tone = player && player.anatomy ? player.anatomy.skinTone : "";
    tone = String(tone || "").toLowerCase().trim();
    if (!tone) return "";
    var map = {
        "fair": "pale", "light": "pale", "olive": "olive", "tan": "tan",
        "brown": "brown", "dark brown": "dark brown", "deep brown": "deep brown"
    };
    return map[tone] || tone;
}

/**
 * True while the Raging Bull potion effect (STATUS_EFFECT_DEFINITIONS
 * .ragingBull in cyoaftw-engine-CORE.js) is active on the entity. Works for
 * the player or an NPC - drinking it maxes stamina and, for 15 story turns,
 * no action costs stamina; the male-endowment flavor below reads it too.
 */
function isRagingBullActive(entity) {
    if (!entity) return false;
    try {
        if (typeof hasActiveStatusEffect === "function") return hasActiveStatusEffect(entity, "ragingBull");
    } catch (err) { /* fall through to the direct read */ }
    return !!(Array.isArray(entity.statusEffects) && entity.statusEffects.some(function (e) {
        return e && e.key === "ragingBull";
    }));
}

// Intimacy stamina costs (engine's spendEntityStamina does the actual
// spending - strain/exhaustion states included). Per-act is the small
// exertion of any physical act; climax is the big payout of an
// orgasm/ejaculation. Raging Bull makes both free: spendEntityStamina
// no-ops while the effect is active, so no extra guard is needed here.
var INTIMACY_STAMINA_COST_PER_ACT = 1;
var INTIMACY_STAMINA_COST_CLIMAX = 4;

function spendIntimacyStamina(entity, amount, isPlayer) {
    if (typeof spendEntityStamina !== "function") return;
    try { spendEntityStamina(entity, amount, [], { isPlayer: !!isPlayer }); } catch (err) { /* engine absent */ }
}

/**
 * Player cock size category ("small" | "medium" | "large") from the profile.
 * While Raging Bull is active the reported category is one step larger than
 * the profile's, so every consumer of this helper (fit calculation, AI size
 * context, deepthroat templates) sees the engorged state.
 */
function getPlayerCockSize(player) {
    var a = player && player.anatomy;
    if (!a) return "medium";
    var size = (a.penis && a.penis.sizeCategory) || (a.genitalSize && a.genitalSize.sizeCategory) || "medium";
    size = String(size).toLowerCase();
    if (isRagingBullActive(player)) {
        if (size === "small") size = "medium";
        else if (size === "medium") size = "large";
    }
    return size;
}

/**
 * NPC skin flavor words for narration: color and texture
 * (e.g. "green", "mottled").
 */
// Human-readable body-surface phrase for prompt anatomy notes: "fur",
// "deep green scales", "tanned skin", or for regioned bodies (satyr:
// skin upper body, fur legs) "tanned skin on the upper body, russet fur on
// the goat legs". Never a placeholder label - the AI copies these notes
// into prose verbatim.
function getNPCSurfaceTextureDesc(npc) {
    if (!npc) return "skin";
    var body = (npc.anatomy && npc.anatomy.body) || {};
    var surfaceType = String(body.surfaceType || npc.surfaceType || "").toLowerCase().trim();
    var color = String(body.color || npc.surfaceColor || npc.skinTone || npc.furColor || npc.scaleColor || npc.featherColor || "").toLowerCase().trim();
    var regions = Array.isArray(body.regions) ? body.regions : [];
    if (regions.length) {
        var parts = regions.map(function (r) {
            var c = String((r && r.color) || color || "").toLowerCase().trim();
            var st = String((r && r.surfaceType) || surfaceType || "skin").toLowerCase().trim();
            var where = r && r.region ? " on " + r.region : "";
            return (c ? c + " " : "") + (st || "skin") + where;
        }).filter(Boolean);
        if (parts.length) return parts.join(", ");
    }
    if (!surfaceType) {
        if (npc.furColor) surfaceType = "fur";
        else if (npc.scaleColor) surfaceType = "scales";
        else if (npc.featherColor) surfaceType = "feathers";
        else surfaceType = "skin";
    }
    return (color ? color + " " : "") + surfaceType;
}

function getNPCSkinFlavorWords(npc) {
    var color = "";
    var texture = "";
    if (npc) {
        var body = (npc.anatomy && npc.anatomy.body) ||
                   (npc.nsfwTraits && npc.nsfwTraits.anatomy && npc.nsfwTraits.anatomy.body) || {};
        color = String((npc.skinTone || body.color || npc.surfaceColor || "") || "").toLowerCase().trim();
        texture = String((body.texture || npc.surfaceTexture || "") || "").toLowerCase().trim();
    }
    return { color: color, texture: texture };
}

// Orifice size vocabulary (tight/snug/loose/...) mapped to the
// small/medium/large categories used by genital size picks.
var ORIFICE_SIZE_MAP = {
    tight: "small", snug: "small",
    firm: "medium", supple: "medium",
    loose: "large", gaping: "large", stretchy: "large"
};

/**
 * How the player's cock size (profile) fits the NPC's orifice.
 * Returns "resistance" (large cock, small hole), "stretched" (large
 * cock, medium hole), "easy" (small cock, large hole), or "" (neutral
 * or unknown). Only meaningful when the player is the penetrating party.
 */
function getPenetrationFit(player, npc, target) {
    var t = String(target || "").toLowerCase();
    if (!npc || !npc.anatomy) return "";
    var anat;
    if (t === "vagina" || t === "pussy") anat = npc.anatomy.vagina || {};
    else if (t === "anus" || t === "ass") anat = npc.anatomy.anus || {};
    else return "";
    var orifice = ORIFICE_SIZE_MAP[anat.size] || anat.sizeCategory;
    if (!orifice) return "";
    orifice = String(orifice).toLowerCase();
    var cock = getPlayerCockSize(player);
    if (cock === "large") return orifice === "small" ? "resistance" : orifice === "medium" ? "stretched" : "";
    if (cock === "small") return orifice === "large" ? "easy" : "";
    return "";
}

/**
 * AI prompt context for penetration acts: color and size flavor drawn
 * from the player's profile (cock size/color) and the NPC's anatomy
 * (skin color/texture, orifice size), plus the resulting fit. Both the
 * enter (PENETRATE) and continue (CONTINUE) phases get this - the AI
 * weaves these facts into its narration.
 */
function getColorSizeContext(player, npc, action) {
    if (!action || action.playerIsBottom) return "";
    var type = action.type;
    if (type !== "penetrate" && type !== "continue") return "";
    var tool = String(action.tool || "").toLowerCase();
    if (tool !== "penis" && tool !== "cock") return "";
    var lines = [];
    var size = getPlayerCockSize(player);
    var color = getPlayerCockColorWord(player);
    if (isRagingBullActive(player)) {
        lines.push("- The player's penis is unnaturally engorged - flushed and straining, larger than usual (Raging Bull potion in effect). Name that engorged look when it appears.");
    }
    if (size !== "medium" || color) {
        var sizeDesc = size === "large" ? "large and thick" : size === "small" ? "small and slender" : "average-sized";
        var example = size === "large" ? "your thick " : size === "small" ? "your slender " : "your ";
        example += (color ? color + " " : "") + "cock";
        lines.push("- The player's penis: " + sizeDesc + (color ? ", " + color + "-skinned" : "") + '. Name its size and color when it appears - e.g. "' + example + '".');
    }
    var skin = getNPCSkinFlavorWords(npc);
    if (skin.color) {
        lines.push("- The NPC's skin: " + skin.color + (skin.texture ? ", " + skin.texture : "") + '. Mention their skin color/texture when their body is described - e.g. "sweat beads on their ' + skin.color + (skin.texture ? " " + skin.texture : "") + ' skin".');
    }
    var fit = getPenetrationFit(player, npc, action.target);
    var fitDesc = fit === "resistance"
        ? "the player's girth meets real resistance in the NPC's small hole - entry is slow and hard-won"
        : fit === "stretched"
        ? "the player's girth stretches the NPC open - they feel every inch"
        : fit === "easy"
        ? "the NPC's practiced hole takes the player's slender cock with ease"
        : "";
    if (fitDesc) lines.push("- Fit: " + fitDesc + ".");
    if (!lines.length) return "";
    return "COLOR & SIZE (physical facts - weave these naturally into the narration whenever the relevant body part appears):\n" + lines.join("\n");
}

/**
 * True for oral-service acts on genitals, either direction (NPC's mouth
 * on the player's penis or pussy, or the player's mouth on the NPC's
 * penis or pussy). These get an EXTENDED multi-beat narration style: the
 * act progresses through distinct steps (see _oralSteps in
 * buildIntimacyPrompt; cunnilingus builds differently from fellatio)
 * with invented in-character dialogue allowed - see buildIntimacyPrompt.
 */
function isExtendedOralAction(action) {
    if (!action) return false;
    var tool = String(action.tool || "").toLowerCase();
    var target = String(action.target || "").toLowerCase();
    if ((target === "penis" || target === "cock") &&
        (tool === "mouth" || tool === "lips" || tool === "tongue")) return true;
    if (target === "mouth" && (tool === "penis" || tool === "cock" || tool === "vagina" || tool === "pussy")) return true;
    if ((target === "vagina" || target === "pussy" || target === "clitoris") &&
        (tool === "mouth" || tool === "lips" || tool === "tongue") &&
        ["kiss", "lick", "suck", "penetrate"].indexOf(String(action.verb || "").toLowerCase()) !== -1) return true;
    return false;
}

/**
 * Check if anal entry should be easy (based on prior use or size advantage)
 * Returns true if: already penetrated, or NPC is larger than player.
 */
function isAnalEntryEasy(npc, player) {
    if (!npc) return false;

    // Check if anus has already been penetrated in this encounter
    const penetration = npc.intimacy && npc.intimacy.penetration;
    if (penetration && penetration.target === 'anus' && penetration.active) {
        return true; // Already penetrated - easier to continue
    }

    // Check if lubricated
    var intimacy = npc.intimacy || {};
    if (intimacy.lube && intimacy.lube.anus && intimacy.lube.anus.hasLube) {
        return true; // Lubricated - easier entry
    }

    // Check if cum is already inside (acts as lubrication)
    if (intimacy.climax && intimacy.climax.hasInternalEjaculation && intimacy.climax.lastInternalEjaculation === "anus") {
        return true; // Cum inside - slick and easier to slide in
    }

    // Check if well-used (loose/stretchy/gaping)
    var anusAnatomy = (npc.anatomy && npc.anatomy.anus) || {};
    var anusSize = anusAnatomy.size || "snug";
    if (anusSize === "loose" || anusSize === "stretchy" || anusSize === "gaping") {
        return true; // Well-used - easier entry
    }

    // Check size comparison using the new relative size system
    if (player && npc) {
        var rel = getRelativeSize(player, npc);
        // If NPC is larger, anal entry is easier (larger orifice)
        if (rel === 'npc-larger' || rel === 'npc-much-larger') {
            return true;
        }
    }

    return false; // Default: sphincters are tight and resistant
}

/**
 * Check if anal insertion can actually complete.
 * Returns: "easy", "difficult", or "blocked"
 * - Easy: lubricated, well-used, or larger NPC
 * - Difficult: tight but possible (will get in with effort)
 * - Blocked: very tight + unlubricated + smaller NPC (20% chance — can't get it in this attempt)
 */
function canCompleteAnalInsertion(npc, player) {
    if (isAnalEntryEasy(npc, player)) return "easy";

    // Check anus tightness
    var anusAnatomy = (npc.anatomy && npc.anatomy.anus) || {};
    var anusSize = anusAnatomy.size || "snug";

    // Check size difference — player larger than NPC makes insertion harder
    var rel = player ? getRelativeSize(player, npc) : "";
    var playerLarger = (rel === "player-larger" || rel === "player-much-larger");
    var playerMuchLarger = (rel === "player-much-larger");

    // Much larger player + tight + no lube: 35% chance blocked
    if (playerMuchLarger && (anusSize === "tight" || anusSize === "snug") && Math.random() < 0.35) {
        return "blocked";
    }

    // Larger player + tight: 20% chance blocked
    if (playerLarger && (anusSize === "tight" || anusSize === "snug") && Math.random() < 0.20) {
        return "blocked";
    }

    // Tight + no lube + no size advantage: 15% chance blocked
    if ((anusSize === "tight" || anusSize === "snug") && Math.random() < 0.15) {
        return "blocked";
    }

    // Player larger = difficult even if not blocked
    if (playerLarger || playerMuchLarger) return "difficult";

    return "difficult";
}

/**
 * Check if a species is civilized
 * Used to determine if NPC understands certain intimate acts
 */
function isCivilizedSpecies(species) {
    if (!species) return false;
    const civilizedSpecies = ["human", "elf", "dwarf", "halfling", "dragonborn"];
    return civilizedSpecies.includes(species.toLowerCase());
}

/**
 * Get the anatomy type for an NPC based on species template or override.
 * Returns "humanoid" (standard genitals), "reptilian" (cloaca), "mixed"
 * (humanoid genitals with scaly texture), "furry", or "scaled".
 * 
 * Priority:
 * 1. Explicit override on npc.nsfwTraits.anatomyType
 * 2. Explicit override on npc.anatomyType
 * 3. Template anatomyType
 * 4. Surface type mapping (fur -> furry, scales -> scaled)
 * 5. Default: humanoid
 */
function getNPCAnatomyType(npc) {
    if (!npc || !npc.species) return "humanoid";
    
    // Check for explicit overrides first (NSFW overrides SFW)
    if (npc.nsfwTraits && npc.nsfwTraits.anatomyType) {
        return npc.nsfwTraits.anatomyType;
    }
    if (npc.anatomyType) {
        return npc.anatomyType;
    }
    
    // Get template anatomyType
    var template = null;
    if (typeof getSpeciesTemplate === "function") {
        template = getSpeciesTemplate(npc.species);
    } else if (typeof window !== "undefined" && typeof window.getSpeciesTemplate === "function") {
        template = window.getSpeciesTemplate(npc.species);
    }
    if (template && template.anatomyType) return template.anatomyType;
    
    // Map surfaceType to anatomy descriptor
    const anatomy = npc.anatomy || {};
    const surfaceType = anatomy.surfaceType || (npc.surfaceType) || "";
    const surfaceToAnatomy = {
        "fur": "furry",
        "scales": "scaled",
        "feathers": "furry"
    };
    if (surfaceToAnatomy[surfaceType.toLowerCase()]) {
        return surfaceToAnatomy[surfaceType.toLowerCase()];
    }
    
    return "humanoid";
}

/**
 * Check if NPC has a tail based on species template or anatomy features.
 */
function hasNPCTail(npc) {
    if (!npc) return false;
    // Hydrated flag wins — kept consistent with _actNpcHasTail in
    // intimacy-data-acts.js (npc.hasTail is the authoritative runtime flag
    // when a hydration pass has set it).
    if (npc.hasTail === true) return true;
    if (npc.hasTail === false) return false;
    // Check species template
    var template = null;
    if (typeof getSpeciesTemplate === "function") {
        template = getSpeciesTemplate(npc.species);
    } else if (typeof window !== "undefined" && typeof window.getSpeciesTemplate === "function") {
        template = window.getSpeciesTemplate(npc.species);
    }
    if (template && template.hasTail) return true;
    // Check anatomy features for tail mention
    if (npc.anatomy && Array.isArray(npc.anatomy.features)) {
        return npc.anatomy.features.some(function(f) { return /tail/i.test(String(f)); });
    }
    return false;
}

/**
 * Check if an NPC can speak
 * Non-verbal NPCs will only make sounds, not speak
 */
function canNPCSpeak(npc) {
    if (!npc) return true;
    // Check for explicit non-verbal flag
    if (npc.nonVerbal === true || npc.verbal === false) return false;
    // Some species might be naturally non-verbal
    const nonVerbalSpecies = ["animal", "beast", "monster", "creature"];
    const species = (npc.species || "").toLowerCase();
    if (nonVerbalSpecies.some(s => species.includes(s))) return false;
    return true;
}

/**
 * Get dialogue style for an NPC
 * Returns: 'civilized', 'uncivilized', or 'nonverbal'
 */
function getNPCDialogueStyle(npc) {
    if (!npc) return 'civilized';
    
    // Non-verbal NPCs can't speak
    if (!canNPCSpeak(npc)) return 'nonverbal';
    
    // Check if species is civilized
    const species = npc.species || "";
    if (isCivilizedSpecies(species)) return 'civilized';
    
    // Uncivilized species have limited vocabulary
    return 'uncivilized';
}

/**
 * Get internal vagina color description
 * Returns descriptive phrases for the color of vaginal interiors/labia
 */
function getVaginalInteriorColor(npc) {
    if (!npc) return "";
    
    const anatomy = (npc.nsfwTraits && npc.nsfwTraits.anatomy) || (npc.anatomy || {});
    const genitals = anatomy.genitals || {};
    const pigmentation = (genitals.pigmentation || "natural").toLowerCase();
    
    // Map pigmentation to interior color descriptions
    const interiorColors = {
        'natural': ["soft pink", "warm pink", "rosy", "peachy", "blush-colored"],
        'pale': ["pale pink", "delicate pink", "light rose", "ivory-pink", "cream"],
        'light': ["light pink", "soft rose", "peach", "apricot", "corals"],
        'fair': ["fair pink", "warm blush", "dusky rose", "sunset hues"],
        'medium': ["deep pink", "rose", "ruby", "carmine", "coral"],
        'dark': ["dark rose", "deep ruby", "wine-colored", "burgundy", "mahogany"],
        'dark brown': ["chocolate brown", "deep umber", "espresso", "mocha"],
        'brown': ["warm brown", "tawny", "caramel", "honey-golden"],
        'black': ["darkest rose", "ebony-tinged", "shadowed crimson", "midnight wine"],
        'tan': ["tan-rose", "sun-kissed pink", "golden blush", "amber"],
        'olive': ["olive-pink", "muted rose", "earth-toned", "dusky blush"],
        // Fantasy colors
        'green': ["emeraldean", "jade-flecked", "verданt pink", "moss-tinged"],
        'blue': ["azure-blushed", "sapphire-kissed", "cerulean pink", "sky-tinted"],
        'purple': ["amethyst pink", "violet-blushed", "lilac", "orchid"],
        'gray': ["pearl-gray", "smoke-pink", "silver-blushed", "ash-rose"]
    };
    
    const colors = interiorColors[pigmentation] || interiorColors['natural'];
    return pickRandom(colors);
}

/**
 * Get anus interior color description
 * Returns descriptive phrases for the color of anal interiors
 */
function getAnalInteriorColor(npc) {
    if (!npc) return "";
    
    const anatomy = (npc.nsfwTraits && npc.nsfwTraits.anatomy) || (npc.anatomy || {});
    const anus = anatomy.anus || {};
    const pigmentation = (anus.pigmentation || "natural").toLowerCase();
    
    // Anal interior colors - typically darker than surrounding skin
    const interiorColors = {
        'natural': ["soft pink", "warm rose", "dusky", "peach", "flesh-toned"],
        'pale': ["pale rose", "light pink", "ivory", "cream"],
        'light': ["light rose", "peach", "blush", "sun-kissed"],
        'medium': ["rose", "ruby", "carmine", "deep pink"],
        'dark': ["deep rose", "wine-colored", "burgundy", "mahogany", "ebony"],
        'dark brown': ["chocolate", "deep umber", "espresso", "mocha-brown"],
        'brown': ["warm brown", "tawny", "caramel", "honey"],
        'black': ["darkest rose", "ebony", "shadowed", "midnight"],
        // Fantasy colors
        'green': ["emerald-tinged", "jade", "verdanт", "mossy"],
        'blue': ["azure-tinged", "sapphire", "cerulean", "sky-blue"],
        'gray': ["pearl-gray", "smoke-gray", "silver", "ash"]
    };
    
    const colors = interiorColors[pigmentation] || interiorColors['natural'];
    return pickRandom(colors);
}

/**
 * Get pubic hair description
 */
function getPubicDescription(npc) {
    // Reptilian species have a cloaca (vent) with smooth scales.
    // Other species (including mixed, furry, scaled) have humanoid genitals.
    var anatomyType = (typeof getNPCAnatomyType === "function") ? getNPCAnatomyType(npc) : "humanoid";
    
    // Get actual surface type from anatomy
    var body = (npc.anatomy && npc.anatomy.body) || (npc.nsfwTraits && npc.nsfwTraits.anatomy && npc.nsfwTraits.anatomy.body) || {};
    var surfaceType = String(body.surfaceType || npc.surfaceType || "skin").toLowerCase();
    
    if (anatomyType === "reptilian") {
        var skinDesc = (typeof getSkinDescription === "function") ? getSkinDescription(npc) : "";
        return pickRandom([
            "smooth " + (skinDesc || "scaled") + " vent, the scales smaller and lighter here",
            "bare scaled vent, no hair but fine smaller scales",
            "smooth vent with fine scales"
        ]);
    }
    
    // For non-reptilian species, check actual surface type
    if (surfaceType !== "skin") {
        var skinDesc = (typeof getSkinDescription === "function") ? getSkinDescription(npc) : "";
        var surface = skinDesc ? skinDesc + " " + surfaceType : surfaceType;
        
        if (surfaceType === "scales") {
            return pickRandom([
                "smooth " + surface + " mound, the scales finer and lighter here",
                "bare scaled mound, no hair",
                "hairless " + surface + " mound"
            ]);
        } else if (surfaceType === "fur") {
            return pickRandom([
                "soft " + surface + " mound covered in " + (skinDesc || "") + "fur",
                surface + " mound with fine fur",
                surface + " mound"
            ]);
        } else if (surfaceType === "feathers") {
            return pickRandom([
                "feathered " + surface + " mound",
                "soft " + surface + " mound covered in down",
                surface + " mound"
            ]);
        } else {
            return surface + " mound";
        }
    }

    // Check nsfwTraits first (sexual anatomy), then fallback to regular anatomy
    const nsfwAnatomy = (npc.nsfwTraits && npc.nsfwTraits.anatomy) || {};
    const regularAnatomy = npc.anatomy || {};
    const anatomy = { ...regularAnatomy, ...nsfwAnatomy };
    const pubicHair = anatomy.pubicHair || {};
    const hairColor = pubicHair.color || "dark";
    const hairStyle = pubicHair.style || "natural";
    
    const hairAdjectives = {
        dark: ["brown", "dark"],
        brown: ["chestnut", "auburn"],
        black: ["black", "dark"],
        blonde: ["golden", "blonde"],
        auburn: ["copper", "auburn"],
        grey: ["silver", "grey"]
    };
    const hairAdj = hairAdjectives[hairColor] ? pickRandom(hairAdjectives[hairColor]) : hairColor;
    
    if (hairStyle === "smooth" || hairStyle === "none") {
        return pickRandom(["smooth mound", "bare skin", "shaven flesh"]);
    }
    
    const styleDescriptions = {
        "neatly trimmed": "trimmed",
        "natural": "bush",
        "thick": "thatch",
        "a messy natural": "wild growth",
        "a unkept and thick": "thick growth",
        "long thick and wild": "wild thicket"
    };
    const styleDesc = styleDescriptions[hairStyle] || hairStyle;
    
    return `${hairAdj} ${styleDesc}`;
}

/**
 * Get scent descriptor for intimate scenes
 * Civilized species get subtle/pleasant scents, uncivilized get stronger/muskier scents
 * Anal acts always include pungent smell references
 */
function getScentDescriptor(npc, target, isAnalAct = false) {
    if (!npc) return "";
    
    const species = (npc.species || "").toLowerCase();
    const isUncivilized = species && !isCivilizedSpecies(species);
    
    // For anal acts, 30% chance for pungent smell descriptors (60% for uncivilized)
    if (isAnalAct && Math.random() < (isUncivilized ? 0.6 : 0.3)) {
        // Cloaca-bearing NPCs: the vent is scaled — no coarse hair; the
        // musk reads reptilian.
        if (npcHasCloacaFlag(npc)) {
            return pickRandom([
                "and the sharp, unwashed stench of the vent hits you hard",
                "and a thick, acrid musk rises from the scaled seam",
                "and the pungent, animalistic smell of the vent fills the air",
                "and a heavy, rank odor clings to the smooth scales of the cleft",
                "and the strong, raw scent of the vent makes your nose wrinkle",
                "and a sour, earthy stench wafts up from between the scales"
            ]);
        }
        if (isUncivilized) {
            return pickRandom([
                "and the sharp, unwashed stench of the area hits you hard",
                "and a thick, acrid musk rises from between the coarse hair",
                "and the pungent, animalistic smell of unwashed flesh fills the air",
                "and a heavy, rank odor clings to the coarse hair dusting the cleft",
                "and the strong, raw scent of the area makes your nose wrinkle",
                "and a sour, earthy stench wafts up from the unwashed skin",
                "and the sharp, unrefined tang of the area is hard to ignore",
                "and the coarse hair carries a strong, musky odor that's almost overpowering"
            ]);
        } else {
            return pickRandom([
                "and the musky, earthy scent of the area fills the air",
                "and a raw, musky aroma rises between you",
                "and a deep, earthy musk fills the space",
                "and the unmistakable, raw musk of the area surrounds you",
                "and a faint, earthy aroma drifts by",
                "and the warm, slightly salty musk of the cleft lingers"
            ]);
        }
    }
    
    // For other sex acts - 15% chance for occasional scent descriptors
    if (!isAnalAct && Math.random() < 0.15) {
        if (isUncivilized) {
            return pickRandom([
                "and a strong, animal musk fills the air",
                "and the primal scent of arousal surrounds you",
                "and a raw, earthy aroma rises",
                "and the unrefined smell of desire fills the space",
                "and a thick, pungent musk hangs heavy"
            ]);
        } else {
            return pickRandom([
                "and a warm, intoxicating scent fills the air",
                "and the musk of arousal surrounds you",
                "and a subtle, warm aroma drifts by",
                "and the heady smell of passion fills the space",
                "and a faint, pleasurable fragrance lingers"
            ]);
        }
    }
    
    return "";
}

/**
 * Helper to get merged anatomy (regular + NSFW traits) for debugging/testing
 */
function getMergedAnatomy(npc) {
    if (!npc) return {};
    const nsfwAnatomy = (npc.nsfwTraits && npc.nsfwTraits.anatomy) || {};
    const regularAnatomy = npc.anatomy || {};
    return { ...regularAnatomy, ...nsfwAnatomy };
}

// ============================================================================
// EXAMPLE USAGE / INTEGRATION
// ============================================================================
// 
// To use the anatomy describer and narrative generator:
//
// 1. Generate full action narratives:
//    const narrative = generateIntimacyNarrative(femaleNPC, "lick_pussy", {
//        arousalLevel: 85,
//        isWet: true
//    });
//    // Example output: "You trace your tongue along through a wild growth of auburn pubic hair to her slick meaty vagina, savoring every dripping inch."
//
// 2. Get a rich description of a body part:
//    const vaginaDesc = describeAnatomy(femaleNPC, "vagina", { 
//        arousalLevel: 85,
//        isAroused: true,
//        isWet: true 
//    });
//    // Example output: "through a wild growth of fiery pubic hair to her slick meaty vagina"
//
// 3. Enhance an action label:
//    const enhanced = enhanceActionLabel(femaleNPC, "Lick pussy", {
//        arousalLevel: 85,
//        actId: "lick_pussy"
//    });
//    // Example output: "Lick through a natural bush of dark pubic hair to her plump labia"
//
// 4. Build custom flowing narrative:
//    const posPronoun = getPossessivePronoun(npc);
//    const pubicDesc = getPubicDescription(npc);  // e.g., "brown pubs"
//    const vaginaDesc = describeAnatomy(npc, "vagina", { arousalLevel: 85, isWet: true });
//    const narrative = `You part ${posPronoun} ${pubicDesc} and expose ${vaginaDesc}. You slide your tongue between the engorged folds, parting them as you...`;
//    // Output: "You part her brown pubs and expose through a thick patch of chestnut pubic hair to her glistening meaty vagina. You slide your tongue between the engorged folds, parting them as you..."
//
// 5. For position change narration:
//    const posChange = changePosition(npc, player, "Doggy");
//    const narration = buildPositionChangeNarration(npc, posChange);
//    const npcResponse = buildPositionChangeNPCResponse(npc, posChange);
//
// ============================================================================


