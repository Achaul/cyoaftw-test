/**
 * INTIMACY MAPPING: CourseOfTemptation -> CYOADEV
 * 
 * This file maps the rich action/verb system from CourseOfTemptation.html
 * (setup.sexacts) to the existing CYOADEV intimacy system.
 * 
 * STRUCTURE:
 * 1. Category Mapping - Groups COT actions into CYOADEV categories
 * 2. Direct Action Mapping - Specific COT actions -> CYOADEV act IDs
 * 3. Missing Actions - COT actions not yet implemented in CYOADEV
 * 4. Property Translation - How COT properties map to CYOADEV properties
 * 5. Position Mapping - COT positions -> CYOADEV positions
 * 
 * Version: 2026-08-16-006
 * Source: CourseOfTemptation.html lines 78626-81496 (setup.sexacts)
 */

// ============================================================================
// VERSION IDENTIFIER
// ============================================================================
if (typeof window !== "undefined") {
    window.INTIMACY_COT_MAPPING_VERSION = "2026-08-16-007";
    console.log("[Intimacy COT Mapping] Loaded v2026-08-16-007 - Smart end-action validation based on lastAction");
}

// ============================================================================
// COT STRUCTURE REFERENCE
// ============================================================================
/**
 * CourseOfTemptation Action Structure (setup.sexacts):
 * {
 *   "Action Name": {
 *     positions: ["Position:role", ...],           // Valid positions
 *     "action type": ["tease"|"penetrate"|"continue"|"end"|"attack"|"impact"],
 *     "subject parts": ["bodyPart", ...],        // Actor's required body parts
 *     "object parts": ["bodyPart", ...],         // Target's required body parts
 *     masturbation: boolean,                    // Can do to self
 *     "take virginity": ["bodyPart", ...],      // Virginity taken
 *     "skills required": { skill: level, ... }, // Required skill levels
 *     "subject skills improved": ["skill", ...],// Skills improved for actor
 *     "object skills improved": ["skill", ...], // Skills improved for target
 *     "subject arousal": number,                // Arousal gain for actor
 *     "object arousal": number,                 // Arousal gain for target
 *     "subject arousal cap": number,           // Max arousal for actor
 *     "object arousal cap": number,            // Max arousal for target
 *     "remember as": ["memoryType", "perspective"], // Memory classification
 *     toys: ["toyType", ...],                   // Required/used toys
 *     "act label substitution": [],             // Label replacements
 *     kink: "kinkType",                        // Kink category
 *     "dialogue tags": ["tag", ...],           // For NPC response matching
 *     ignoreforideas: boolean,                 // Don't trigger idea system
 *     deprecated: boolean,                      // Deprecated action
 *     force bottom cum location: boolean,     // Special cum handling
 *     "no object arousal cap for": ["trait"],  // Traits that bypass cap
 *     inclinations required: ["trait"],       // Required personality traits
 *     requires virginity: ["bodyPart"],        // Requires target to be virgin
 *     ...
 *   }
 * }
 */

// ============================================================================
// CYOADEV STRUCTURE REFERENCE
// ============================================================================
/**
 * CYOADEV Action Structure (intimacy-data-acts.js SEX_ACTS):
 * {
 *   actionId: {
 *     id: "actionId",
 *     tool: "bodyPart|body",                  // Actor's body part/tool
 *     target: "bodyPart",                     // Target's body part
 *     verb: "actionVerb",                     // The action verb
 *     type: ACT_TYPES.TEASE|PENETRATE|CONTINUE|END|CLOTHING|IMPACT,
 *     label: "Menu Label",                   // Display label
 *     desc: "Description",                    // Full description
 *     arousal: { p: number, n: number },     // Arousal for player and NPC
 *     pos: ["Position", ...],                 // Valid positions
 *     reqCloth: CLOTHING_REQUIREMENTS.*,     // Clothing requirement
 *     requiresPrior: ["actionId", ...],      // Prerequisite actions
 *     requiresLube: boolean,                  // Requires lubrication
 *     takesVirginity: [VIRGINITY_TYPES.*],   // Virginity taken
 *     playerIsBottom: boolean,               // Player is receiving
 *     triggersClimax: boolean,                // Triggers orgasm
 *     maleOnly: boolean,                      // Male-only action
 *     femaleOnly: boolean,                    // Female-only action
 *     consequence: "consequenceType",        // Result of action
 *     intensity: "soft"|"medium"|"hard",      // Action intensity
 *     requiresConsent: boolean,               // Explicit consent required
 *     clothingItem: "top"|"bottom"|"underwear", // For clothing actions
 *     clothingAction: "remove"|"pull down"|"lift"|"move aside" // Clothing action type
 *   }
 * }
 */

// ============================================================================
// SECTION 1: ACTION TYPE MAPPING
// ============================================================================

/**
 * Maps COT action types to CYOADEV action types
 * COT uses arrays, CYOADEV uses single values
 */
var COT_TO_CYOADEV_ACTION_TYPE = {
    "tease": "TEASE",
    "penetrate": "PENETRATE",
    "continue": "CONTINUE",
    "end": "END",
    "attack": "IMPACT",           // COT attack = CYOADEV impact (painful)
    "impact": "IMPACT"            // COT impact = CYOADEV impact (sensation)
};

// ============================================================================
// SECTION 2: BODY PART MAPPING
// ============================================================================

/**
 * Maps COT body parts to CYOADEV body parts
 * Note: COT uses plural forms, CYOADEV uses singular
 */
var COT_TO_CYOADEV_BODY_PARTS = {
    // Mouth/Tongue
    "mouth": "mouth",
    "tongue": "tongue",
    "lips": "mouth",
    
    // Chest/Breasts/Nipples
    "breasts": "chest",
    "nipples": "nipples",
    "chest": "chest",
    
    // Vagina/Pussy/Clitoris
    "vagina": "vagina",
    "pussy": "vagina",
    "clitoris": "clitoris",
    "clit": "clitoris",
    "front hole": "vagina",
    
    // Penis/Cock
    "penis": "penis",
    "cock": "penis",
    "dick": "penis",
    "t-dick": "penis",
    
    // Balls
    "balls": "testicles",
    "testicles": "testicles",
    
    // Anus/Ass/Butt
    "anus": "anus",
    "ass": "anus",
    "butt": "buttocks",
    "butthole": "anus",
    "buttocks": "buttocks",
    "crotch": "groin",
    
    // Hands/Fingers/Wrist
    "hand": "hand",
    "hands": "hand",
    "fingers": "fingers",
    "wrist": "hand",
    
    // Feet/Toes
    "foot": "foot",
    "feet": "foot",
    "thigh": "thighs",
    "thighs": "thighs",
    
    // Head/Face
    "face": "face",
    "head": "head",
    "hair": "hair",
    "neck": "neck",
    
    // Torso
    "stomach": "stomach",
    "back": "back",
    "shoulders": "shoulders",
    "hips": "hips",
    "groin": "groin",
    
    // Full body
    "body": "body"
};

// ============================================================================
// SECTION 3: POSITION MAPPING
// ============================================================================

/**
 * Maps COT position formats to CYOADEV position IDs
 * COT uses format: "Position:role" (e.g., "Missionary:top", "Doggy:bottom")
 * CYOADEV uses simple position names: "Missionary", "Doggy", etc.
 * The role (top/bottom) is handled separately in CYOADEV via playerIsBottom
 */
var COT_TO_CYOADEV_POSITIONS = {
    // Primary positions (no role specified)
    "Standing": "Standing",
    "Missionary": "Missionary",
    "Cowgirl": "Cowgirl",
    "Reverse Cowgirl": "Reverse Cowgirl",
    "Doggy": "Doggy",
    "Bent Over": "Bent Over",
    "From Behind": "From Behind",
    "Standing From Behind": "Standing From Behind",
    "Against Wall": "Against Wall",
    "Against Wall From Behind": "Against Wall From Behind",
    "Perched": "Perched",
    "Astride Lap": "Astride Lap",
    "Spooning": "Spooning",
    "Double Decker": "Double Decker",
    "Kneeling": "Kneeling",
    "Kneeling Over": "Kneeling Over",
    "Squatting Before": "Squatting Before",
    "Kneeling Between Thighs": "Kneeling Between Thighs",
    "Sixty-Nine": "Sixty-Nine",
    "Straddling Chest": "Straddling Chest",
    "Riding Face": "Riding Face",
    "Oral Service": "Oral Service",
    "Prone Oral Service": "Prone Oral Service",
    "Kneeling By Face": "Kneeling By Face",
    "Squatting Before": "Squatting Before",
    "Laid Across On Back": "Laid Across On Back",
    "Laid Across On Stomach": "Laid Across On Stomach",
    "Mounted On X-Cross": "Mounted On X-Cross",
    "Mounted On X-Cross Oral Service": "Mounted On X-Cross Oral Service",
    "Perched Oral Service": "Perched Oral Service",
    "Underneath Oral Service": "Underneath Oral Service",
    "Laid Across Oral Service": "Laid Across Oral Service",
    
    // Deprecated COT positions
    "Mating Press": "Missionary",  // Mating Press maps to Missionary
    "Prone Bone": "Doggy",        // Prone Bone maps to Doggy
    "Waiting": null              // Waiting is a special state, not a real position
};

/**
 * Maps COT role suffixes to CYOADEV playerIsBottom values
 * :top = player is on top/active (playerIsBottom: false)
 * :bottom = player is underneath/passive (playerIsBottom: true)
 */
var COT_ROLE_TO_PLAYERISBOTTOM = {
    ":top": false,       // Player is top/active
    ":bottom": true,     // Player is bottom/passive
    "": null             // No role specified = either
};

// ============================================================================
// SECTION 4: CATEGORY MAPPING
// ============================================================================

/**
 * Maps COT action categories (based on comments in source) to CYOADEV menu categories
 * This is used for UI organization
 */
var COT_CATEGORY_TO_CYOADEV_MENU = {
    // COT comment categories -> CYOADEV categories
    "kissing": "Kissing",
    "mostly foreplay actions": "Foreplay",
    "oral/hand pussy service actions": "Oral",
    "oral/hand cock service actions": "Oral",
    "piv fucking actions": "Penetration",
    "specifically m2m actions": "Special",
    "specifically f2f actions": "Special",
    "anal actions": "Anal",
    "toy actions": "Toys"
};

/**
 * Maps CYOADEV action targets to menu categories
 * This is used in getActionCategory() in intimacy-data-acts.js
 */
var TARGET_TO_MENU_CATEGORY = {
    // Mouth/Face
    "mouth": "Kissing",
    "lips": "Kissing",
    "face": "Kissing",
    "neck": "Kissing",
    "cheek": "Kissing",
    
    // Breasts
    "chest": "Breasts",
    "nipples": "Breasts",
    
    // Lower Body - General
    "hips": "Lower Body",
    "thighs": "Lower Body",
    "groin": "Lower Body",
    "buttocks": "Lower Body",
    
    // Vagina
    "vagina": "Vaginal",
    "clitoris": "Vaginal",
    
    // Penis
    "penis": "Penis",
    "testicles": "Penis",
    
    // Anus
    "anus": "Anal",
    
    // Full body
    "body": "Full Body"
};

// ============================================================================
// SECTION 5: DIRECT ACTION MAPPING
// ============================================================================

/**
 * Direct mapping from COT action names to CYOADEV action IDs
 * Format: { cotActionName: cyoadvActionId or null (if not implemented) }
 */
var COT_ACTION_TO_CYOADEV_ID = {
    // ===== KISSING =====
    "Kiss": "kiss_lips",
    
    // ===== BREAST/NIPPLE =====
    "Grope Breasts": "grope_breasts",
    "Tease Nipples": "tease_nipples",
    "Kiss Nipple": "kiss_nipples",
    "Lick Nipple": "lick_nipples",
    "Suck Nipple": "suck_nipples",
    
    // ===== VAGINAL (Pussy) =====
    "Rub Pussy": "rub_pussy",
    "Pull Hand To Pussy": "pull_hand_to_pussy",
    "Finger Pussy": "finger_pussy",
    "Hump Hand": "hump_hand",
    "Rub Clit": "rub_pussy",    // Close match
    "Lick Pussy": "lick_pussy",
    "Suck Clit": "suck_clit",
    "Ride Face": "ride_face",
    "Rub Pussy Against Leg": "rub_pussy_against_leg",
    "Rub Leg Against Pussy": "rub_leg_against_pussy",
    "Stop Fingering": "stop",    // Generic stop
    "Pull Off Of Finger": "stop",
    
    // ===== COCK/PENIS =====
    "Fondle Balls": "stroke_penis",  // Approximate match
    "Lick Balls": null,
    "Suck Balls": null,
    "Lick Ass": "lick_anus",
    "Lick Cock": "lick_penis",
    "Rub Cock On Face": null,
    "Tease Cock With Fingers": "stroke_penis",
    
    // ===== PIV ACTIONS =====
    "Tease Pussy With Cock": "press_penis_pussy",
    "Cocktease With Pussy": null,
    "Enter Pussy": "enter_pussy",
    "Push Cock In": "enter_pussy",  // Same as enter_pussy
    "Fuck Pussy": "fuck_pussy",
    "Take Cock": "thrust_pussy",
    "Hump Back": "pound_pussy",
    "Ride Cock": "ride_penis",
    "Squeeze Cock": "squeeze_cock",
    "Rabbitfuck": "pound_pussy",  // Intensity: hard
    "Deep Stroke": "thrust_pussy",
    "Pull Out": "stop",
    "Pull Off": "stop",
    
    // ===== ANAL ACTIONS =====
    "Tease Ass With Cock": "press_penis_anus",
    "Cocktease With Ass": "cocktease_with_ass",
    "Rub Butthole": "rub_anus",
    "Stretch Butthole": "stretch_butthole",
    "Enter Ass": "enter_anus",
    "Push Cock In Ass": "enter_anus",
    "Finger Ass": "finger_anus",
    "Fuck Ass": "fuck_anus",
    "Take Cock In Ass": "take_penis_anus",
    "Hump Ass Back Onto Cock": "hump_ass_back_onto_cock",
    "Pull Strap-on Out": null,
    "Pull Out Of Ass": "stop",
    "Pull Off Of Ass": "stop",
    
    // ===== ORAL ACTIONS =====
    "Fondle Balls": "fondle_balls",
    "Lick Balls": "lick_balls",
    "Suck Balls": "suck_balls",
    "Lick Ass": "lick_anus",
    "Lick Cock": "lick_penis",
    "Suck Cock": "suck_penis",
    "Deepthroat": "deepthroat_penis",
    "Fuck Mouth": "fuck_mouth",
    "Release Cock": "release_cock",
    "Tug Cock Free": "release_cock",
    "Pull Out Of Mouth": "pull_out_of_mouth",
    "Pull Mouth Off Of Cock": "pull_out_of_mouth",
    
    // ===== STRAP-ON ACTIONS =====
    "Tease Pussy With Strap-on": null,
    "Enter Pussy With Strap-on": null,
    "Push Strap-on In": null,
    "Fuck Pussy With Strap-on": null,
    "Take Strap-on": null,
    "Hump Back On Strap-on": null,
    "Ride Strap-on": null,
    "Rabbitfuck With Strap-on": null,
    "Deep Stroke With Strap-on": null,
    "Pull Strap-on Out": null,
    "Pull Off Of Strap-on": null,
    "Tease Ass With Strap-on": null,
    "Enter Ass With Strap-on": null,
    "Push Strap-on In Ass": null,
    "Fuck Ass With Strap-on": null,
    "Take Strap-on In Ass": null,
    "Hump Ass Back Onto Strap-on": null,
    "Pull Strap-on Out Of Ass": null,
    "Pull Ass Off Of Strap-on": null,
    
    // ===== BEADS ACTIONS =====
    "Tease Ass With Beads": null,
    "Insert Beads Into Ass": null,
    "Tug On Beads": null,
    "Pull Beads From Ass": null,
    
    // ===== COCK SLEEVE ACTIONS =====
    "Tease Cock With Cocksleeve": null,
    "Push Cocksleeve Onto Cock": null,
    "Fuck Cock With Cocksleeve": null,
    "Fuck Cocksleeve": null,
    "Pull Cocksleeve Off Of Cock": null,
    "Pull Off Of Cocksleeve": null,
    
    // ===== SPECIAL ACTIONS =====
    "Frot": "frot",  // M2M cock rubbing
    "Trib": "trib",  // F2F vulva rubbing
    
    // ===== FOOT ACTIONS =====
    "Rub Cock Against Leg": "rub_cock_against_leg",
    "Rub Leg Against Cock": "rub_leg_against_cock",
    "Rub Pussy Against Leg": "rub_pussy_against_leg",
    "Rub Leg Against Pussy": "rub_leg_against_pussy",
    "Release Cock From Feet": null,
    "Tug Cock Free Of Feet": null,
    "Move Feet Away From Pussy": null,
    "Pull Away From Feet": null
};

// ============================================================================
// SECTION 6: MISSING ACTIONS ANALYSIS
// ============================================================================

/**
 * Actions from COT that are NOT implemented in CYOADEV
 * Organized by category for prioritization
 */
var MISSING_COT_ACTIONS = {
    "Clothing/Position Adjustments": [],
    
    "Oral - Balls": [],
    
    "Oral - Cock Advanced": [],
    
    "Oral - Pussy Advanced": [],
    
    "Vaginal - Advanced Techniques": [],
    
    "Anal - Advanced": [],
    
    "Toys - Strap-on": [
        "Tease Pussy With Strap-on",
        "Enter Pussy With Strap-on",
        "Push Strap-on In",
        "Fuck Pussy With Strap-on",
        "Take Strap-on",
        "Hump Back On Strap-on",
        "Ride Strap-on",
        "Rabbitfuck With Strap-on",
        "Deep Stroke With Strap-on",
        "Pull Strap-on Out",
        "Pull Off Of Strap-on",
        "Tease Ass With Strap-on",
        "Enter Ass With Strap-on",
        "Push Strap-on In Ass",
        "Fuck Ass With Strap-on",
        "Take Strap-on In Ass",
        "Hump Ass Back Onto Strap-on",
        "Pull Strap-on Out Of Ass",
        "Pull Ass Off Of Strap-on"
    ],
    
    "Toys - Beads": [
        "Tease Ass With Beads",
        "Insert Beads Into Ass",
        "Tug On Beads",
        "Pull Beads From Ass"
    ],
    
    "Toys - Cock Sleeve": [
        "Tease Cock With Cocksleeve",
        "Push Cocksleeve Onto Cock",
        "Fuck Cock With Cocksleeve",
        "Fuck Cocksleeve",
        "Pull Cocksleeve Off Of Cock"
    ],
    
    "Special - M2M": [
        "Frot"
    ],
    
    "Special - F2F": [
        "Trib"
    ],
    
    "Foot Actions": [
        "Release Cock From Feet",
        "Tug Cock Free Of Feet",
        "Move Feet Away From Pussy",
        "Pull Away From Feet"
    ],
    
    "Anal - More": [
        "Lick Ass"
    ]
};

// ============================================================================
// SECTION 7: PROPERTY TRANSLATION GUIDE
// ============================================================================

/**
 * How to translate COT action properties to CYOADEV properties
 */
var PROPERTY_TRANSLATION_GUIDE = {
    // Action Type
    // COT: "action type": ["tease", "penetrate", ...]
    // CYOADEV: type: ACT_TYPES.TEASE
    // Mapping: Take first element from COT array, map via COT_TO_CYOADEV_ACTION_TYPE
    
    // Body Parts
    // COT: "subject parts": ["hand"], "object parts": ["breasts"]
    // CYOADEV: tool: "hand", target: "chest"
    // Mapping: Map via COT_TO_CYOADEV_BODY_PARTS
    // Note: COT "breasts" -> CYOADEV "chest" (simplified)
    
    // Positions
    // COT: positions: ["Missionary:top", "Doggy:bottom", ...]
    // CYOADEV: pos: ["Missionary", "Doggy", ...]
    // Mapping: Strip :role suffix, map via COT_TO_CYOADEV_POSITIONS
    // Role handling: If role is :bottom, set playerIsBottom: true
    
    // Arousal
    // COT: "subject arousal": 10, "object arousal": 25
    // CYOADEV: arousal: { p: 10, n: 25 }
    // Direct mapping
    
    // Arousal Caps
    // COT: "subject arousal cap": 300, "object arousal cap": 600
    // CYOADEV: Not directly supported, but can be added
    
    // Skills
    // COT: "skills required": { "Disinhibition": 2, "Penetrative": 5 }
    // CYOADEV: Not currently supported, but could be added
    
    // Virginity
    // COT: "take virginity": ["vagina", "anus"]
    // CYOADEV: takesVirginity: [VIRGINITY_TYPES.VAGINAL, VIRGINITY_TYPES.ANAL]
    // Mapping: "vagina" -> VIRGINITY_TYPES.VAGINAL, "anus" -> VIRGINITY_TYPES.ANAL
    
    // Toys
    // COT: toys: ["dildo", "anal beads", ...]
    // CYOADEV: Not currently supported for action definitions
    
    // Memory
    // COT: "remember as": ["fingerbang", "given"]
    // CYOADEV: Not currently supported
    
    // Dialogue Tags
    // COT: "subject dialogue tags": ["groping breasts"], "object dialogue tags": ["breasts groped"]
    // CYOADEV: Not currently supported
    
    // Special Flags
    // COT: masturbation: true
    // CYOADEV: Not directly supported, but can be inferred
    
    // COT: ignoreforideas: true
    // CYOADEV: Not applicable
    
    // COT: deprecated: true
    // CYOADEV: Should be excluded from mapping
    
    // COT: kink: "anal"
    // CYOADEV: Not currently supported
    
    // COT: "act label substitution": ["object", "transgender male", "Rub Front Hole"]
    // CYOADEV: Not applicable (handled by gender system)
    
    // COT: "no object arousal cap for": ["Sensitive Nipples"]
    // CYOADEV: Not currently supported
    
    // COT: inclinations required: ["Oral Fixation"]
    // CYOADEV: Not currently supported
};

// ============================================================================
// SECTION 8: PRIORITY RECOMMENDATIONS
// ============================================================================

/**
 * Recommended implementation priority for missing COT actions
 * Priority 1 = High (core functionality)
 * Priority 2 = Medium (common actions)
 * Priority 3 = Low (niche/specialized)
 */
var IMPLEMENTATION_PRIORITY = {
    // Priority 1: Core foreplay and penetration
    "Pull Hand To Pussy": 1,
    "Hump Hand": 1,
    "Rub Clit": 1,
    "Suck Clit": 2,
    "Lick Balls": 2,
    "Suck Balls": 2,
    "Rub Cock On Face": 2,
    "Fuck Mouth": 1,
    "Release Cock": 1,
    "Pull Out Of Mouth": 1,
    "Cocktease With Ass": 2,
    "Stretch Butthole": 3,
    
    // Priority 2: Advanced techniques
    "Squeeze Cock": 2,
    "Hump Ass Back Onto Cock": 2,
    
    // Priority 3: Toys
    "Tease Pussy With Strap-on": 3,
    "Enter Pussy With Strap-on": 3,
    "Fuck Pussy With Strap-on": 3,
    "Tease Ass With Beads": 3,
    "Insert Beads Into Ass": 3,
    
    // Priority 2: Special pairing
    "Frot": 2,
    "Trib": 2,
    
    // Priority 3: Foot actions (niche)
    "Rub Cock Against Leg": 3,
    "Rub Leg Against Cock": 3,
    "Rub Pussy Against Leg": 3,
    "Rub Leg Against Pussy": 3,
    "Release Cock From Feet": 3,
    "Tug Cock Free Of Feet": 3
};

// ============================================================================
// SECTION 9: CONVERSION UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert COT action type array to CYOADEV action type
 * @param {string[]} cotActionTypes - COT action type array
 * @returns {string} CYOADEV action type constant
 */
function convertCOTActionType(cotActionTypes) {
    if (!cotActionTypes || cotActionTypes.length === 0) {
        return ACT_TYPES.TEASE; // Default to tease
    }
    
    // Take the first type and map it
    const firstType = cotActionTypes[0].toLowerCase();
    return COT_TO_CYOADEV_ACTION_TYPE[firstType] || ACT_TYPES.TEASE;
}

/**
 * Convert COT body part to CYOADEV body part
 * @param {string} cotBodyPart - COT body part
 * @returns {string} CYOADEV body part
 */
function convertCOTBodyPart(cotBodyPart) {
    if (!cotBodyPart) return "body";
    return COT_TO_CYOADEV_BODY_PARTS[cotBodyPart.toLowerCase()] || cotBodyPart.toLowerCase();
}

/**
 * Convert COT position array to CYOADEV position array
 * @param {string[]} cotPositions - COT position array
 * @returns {string[]} CYOADEV position array
 */
function convertCOTPositions(cotPositions) {
    if (!cotPositions || cotPositions.length === 0) {
        return ["Standing", "Perched"]; // Default positions
    }
    
    const cyoadvPositions = new Set();
    
    for (const pos of cotPositions) {
        // Handle position:role format
        const [position, role] = pos.split(":");
        const mappedPos = COT_TO_CYOADEV_POSITIONS[position] || position;
        if (mappedPos) {
            cyoadvPositions.add(mappedPos);
        }
    }
    
    return Array.from(cyoadvPositions);
}

/**
 * Convert COT position with role to CYOADEV position and playerIsBottom
 * @param {string[]} cotPositions - COT position array
 * @returns {{positions: string[], playerIsBottom: boolean|null}} CYOADEV format
 */
function convertCOTPositionsWithRole(cotPositions) {
    const positions = new Set();
    let playerIsBottom = null; // null means either is valid
    
    for (const pos of cotPositions) {
        const [position, role] = pos.split(":");
        const mappedPos = COT_TO_CYOADEV_POSITIONS[position] || position;
        
        if (mappedPos) {
            positions.add(mappedPos);
            
            // Track role consistency
            if (role) {
                const isBottom = COT_ROLE_TO_PLAYERISBOTTOM[`:${role}`];
                if (isBottom !== undefined) {
                    if (playerIsBottom === null) {
                        playerIsBottom = isBottom;
                    } else if (playerIsBottom !== isBottom) {
                        // Mixed roles, reset to null (either valid)
                        playerIsBottom = null;
                    }
                }
            }
        }
    }
    
    return {
        positions: Array.from(positions),
        playerIsBottom: playerIsBottom
    };
}

/**
 * Convert COT virginity parts to CYOADEV virginity types
 * @param {string[]} cotParts - COT body parts
 * @returns {string[]} CYOADEV virginity types
 */
function convertCOTVirginity(cotParts) {
    if (!cotParts || cotParts.length === 0) return [];
    
    const result = [];
    for (const part of cotParts) {
        const lowerPart = part.toLowerCase();
        if (lowerPart === "vagina" || lowerPart === "pussy" || lowerPart === "front hole") {
            result.push("VAGINAL");
        } else if (lowerPart === "anus" || lowerPart === "ass" || lowerPart === "butthole") {
            result.push("ANAL");
        }
    }
    return result;
}

/**
 * Generate a CYOADEV action ID from COT action name
 * @param {string} cotActionName - COT action name
 * @returns {string} Generated action ID
 */
function generateActionId(cotActionName) {
    return cotActionName
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
        .replace(/_+$/, "");
}

/**
 * Generate a CYOADEV action definition from COT action
 * @param {string} cotActionName - COT action name
 * @param {Object} cotActionData - COT action data
 * @returns {Object} CYOADEV action definition
 */
function convertCOTActionToCYOADEV(cotActionName, cotActionData) {
    // Skip deprecated actions
    if (cotActionData.deprecated) {
        return null;
    }
    
    // Get action type
    const type = convertCOTActionType(cotActionData["action type"]);
    
    // Get subject and object parts
    const subjectParts = cotActionData["subject parts"] || [];
    const objectParts = cotActionData["object parts"] || [];
    const tool = subjectParts.length > 0 ? convertCOTBodyPart(subjectParts[0]) : "body";
    const target = objectParts.length > 0 ? convertCOTBodyPart(objectParts[0]) : "body";
    
    // Get verb (from action name or infer from context)
    const verb = cotActionName.split(" ")[0].toLowerCase(); // First word as verb
    
    // Get positions
    const { positions, playerIsBottom } = convertCOTPositionsWithRole(cotActionData.positions || []);
    
    // Get arousal
    const subjectArousal = cotActionData["subject arousal"] || 0;
    const objectArousal = cotActionData["object arousal"] || 0;
    
    // Get virginity
    const takesVirginity = convertCOTVirginity(cotActionData["take virginity"]);
    
    // Generate ID
    const id = generateActionId(cotActionName);
    
    // Build CYOADEV action
    const cyoadvAction = {
        id: id,
        tool: tool,
        target: target,
        verb: verb,
        type: type,
        label: cotActionName.replace(/[A-Z]/g, m => " " + m).trim(),
        desc: cotActionName,
        arousal: { p: subjectArousal, n: objectArousal },
        pos: positions.length > 0 ? positions : ["Standing", "Perched"],
        reqCloth: null, // Will be set based on action type and parts
        requiresLube: cotActionData["skills required"] && cotActionData["skills required"]["Disinhibition"] >= 3,
        takesVirginity: takesVirginity.length > 0 ? takesVirginity : null,
        playerIsBottom: playerIsBottom
    };
    
    // Set clothing requirements based on body parts
    if (objectParts.some(p => p === "vagina" || p === "pussy" || p === "anus" || p === "penis" || p === "balls")) {
        cyoadvAction.reqCloth = "BOTTOM_OFF";
    }
    if (objectParts.some(p => p === "breasts" || p === "nipples")) {
        cyoadvAction.reqCloth = "TOP_OFF";
    }
    if (objectParts.some(p => p === "vagina" || p === "anus") && subjectParts.some(p => p === "penis")) {
        cyoadvAction.reqCloth = "NUDE";
    }
    
    // Set maleOnly/femaleOnly based on body parts
    if (subjectParts.some(p => p === "penis" || p === "cock")) {
        cyoadvAction.maleOnly = true;
    }
    if (subjectParts.some(p => p === "vagina" || p === "pussy")) {
        cyoadvAction.femaleOnly = true;
    }
    
    return cyoadvAction;
}

// ============================================================================
// SECTION 10: EXPORT
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        COT_TO_CYOADEV_ACTION_TYPE,
        COT_TO_CYOADEV_BODY_PARTS,
        COT_TO_CYOADEV_POSITIONS,
        COT_ROLE_TO_PLAYERISBOTTOM,
        COT_CATEGORY_TO_CYOADEV_MENU,
        TARGET_TO_MENU_CATEGORY,
        COT_ACTION_TO_CYOADEV_ID,
        MISSING_COT_ACTIONS,
        PROPERTY_TRANSLATION_GUIDE,
        IMPLEMENTATION_PRIORITY,
        convertCOTActionType,
        convertCOTBodyPart,
        convertCOTPositions,
        convertCOTPositionsWithRole,
        convertCOTVirginity,
        generateActionId,
        convertCOTActionToCYOADEV
    };
}
