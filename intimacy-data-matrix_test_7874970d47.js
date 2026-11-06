/**
 * INTIMACY SYSTEM - LOT MATRIX
 * Tool-Verb-Target matrix for generating valid intimacy actions
 * Version: 2026-08-16-006
 */

// Version identifier for debugging cached files
if (typeof window !== "undefined") {
    window.INTIMACY_MATRIX_VERSION = "2026-08-16-007";
    console.log("[Intimacy Matrix] Loaded v2026-08-16-007 - Smart end-action validation based on lastAction");
}

// ============================================================================
// LOT MATRIX
// Structure: TOOL -> TARGET -> [VERBS]
// ============================================================================

var INTIMACY_MATRIX = {
    // Hands - versatile, can reach most targets
    hand: {
        // Face/Head
        face: ["touch", "caress", "cup", "stroke", "slap"],
        mouth: ["cover", "press", "open", "finger"],
        lips: ["touch", "brush", "press"],
        neck: ["stroke", "grip", "kiss", "lick"],
        hair: ["stroke", "grip", "tug", "brush"],
        
        // Torso
        chest: ["press", "caress", "squeeze", "pat", "grope"],
        nipples: ["pinch", "tease", "flick", "squeeze", "roll"],
        shoulders: ["grip", "squeeze", "press", "massage"],
        stomach: ["stroke", "caress", "press", "tickle"],
        back: ["stroke", "press", "massage", "scratch"],
        
        // Lower body
        hips: ["grip", "hold", "pull", "squeeze"],
        groin: ["press", "tease", "grip", "rub"],
        buttocks: ["squeeze", "slap", "press", "spread", "grope"],
        anus: ["touch", "press", "rub", "spread"],
        vagina: ["rub", "tease", "press", "finger", "spread"],
        penis: ["stroke", "grip", "squeeze", "rub", "milk"],
        
        // Legs/Feet
        thighs: ["stroke", "grip", "squeeze", "caress", "spread"],
        legs: ["stroke", "grip", "trace"],
        feet: ["hold", "lift", "massage", "tickle"]
    },
    
    // Fingers - more precise, can enter orifices
    fingers: {
        face: ["trace", "brush"],
        mouth: ["trace", "probe", "gag", "enter"],
        lips: ["trace", "part"],
        neck: ["trace", "tickle"],
        hair: ["separate", "brush", "tangle"],
        
        chest: ["trace", "pinch", "circle", "flick"],
        nipples: ["pinch", "flick", "roll", "tease", "twist"],
        shoulders: ["trace", "press"],
        stomach: ["trace", "tickle", "circle"],
        back: ["trace", "scratch"],
        
        hips: ["trace", "grip"],
        groin: ["tease", "probe", "grip"],
        buttocks: ["trace", "press", "spread", "squeeze"],
        anus: ["rub", "press", "finger", "enter", "probe", "circle"],
        vagina: ["rub", "tease", "enter", "finger", "penetrate", "spread"],
        penis: ["stroke", "grip", "squeeze", "wrap", "milk", "probe"],
        
        thighs: ["trace", "tickle", "grip"],
        legs: ["trace"],
        feet: ["trace", "tickle"]
    },
    
    // Mouth - for kissing, licking, oral
    mouth: {
        face: ["kiss", "nuzzle"],
        mouth: ["kiss", "lick", "bite", "nibble", "suck"],
        lips: ["kiss", "lick", "bite", "suck", "nibble"],
        neck: ["kiss", "lick", "nibble", "suck"],
        hair: ["kiss", "nuzzle"],
        
        chest: ["kiss", "lick", "bite", "suck", "nuzzle"],
        nipples: ["kiss", "lick", "bite", "suck", "nibble", "flick"],
        shoulders: ["kiss", "lick", "nibble"],
        stomach: ["kiss", "lick"],
        
        hips: ["kiss", "lick", "nibble"],
        groin: ["kiss", "lick", "nuzzle", "nibble"],
        buttocks: ["kiss", "lick"],
        anus: ["kiss", "lick", "suck", "rim", "tongue", "nuzzle"],
        vagina: ["kiss", "lick", "penetrate", "eat", "tongue", "suck", "lap", "nibble"],
        penis: ["kiss", "lick", "suck", "deepthroat", "swallow", "nibble"],
        
        thighs: ["kiss", "lick", "nibble"],
        legs: ["kiss", "lick"],
        feet: ["kiss", "lick"]
    },
    
    // Tongue - separate from mouth for more specificity
    tongue: {
        mouth: ["flick", "probe", "enter"],
        lips: ["lick", "flick", "trace"],
        neck: ["lick"],
        nipples: ["lick", "flick", "circle", "suck"],
        groin: ["lick"],
        anus: ["lick", "rim", "flick", "circle", "penetrate"],
        vagina: ["lick", "flick", "penetrate", "lap", "circle"],
        penis: ["lick", "circle", "flick", "swirl"]
    },
    
    // Penis (male player only)
    penis: {
        face: ["press", "brush", "ejaculate on", "rub"],
        mouth: ["press", "enter", "thrust", "deepthroat", "ejaculate", "fuck"],
        lips: ["press", "brush", "rub"],
        chest: ["press", "rub", "ejaculate on", "poke"],
        shoulders: ["press", "rub", "poke", "ejaculate on"],
        stomach: ["press", "rub", "ejaculate on"],
        breasts: ["press", "rub", "ejaculate on"],
        
        buttocks: ["rub", "poke", "ejaculate on", "slap", "press"],
        hips: ["press", "poke", "ejaculate on", "grind"],
        vagina: ["enter", "thrust", "poke", "piston", "ejaculate", "bury", "fuck", "ejaculate on"],
        anus: ["enter", "thrust", "poke", "piston", "ejaculate", "bury", "fuck"],
        
        legs: ["rub", "ejaculate on", "press"],
        thighs: ["rub", "press", "ejaculate on", "grind"],
        feet: ["rub", "ejaculate on"]
    },
    
    // Vagina (female player only)
    vagina: {
        face: ["press", "rub"],
        mouth: ["press", "grind", "rub", "smother"],
        lips: ["press", "rub"],
        chest: ["press", "grind", "rub"],
        
        groin: ["grind", "press", "rub"],
        penis: ["impale", "sit on", "grind", "swallow", "clench", "ride", "bounce"],
        hips: ["press", "grind", "rub"]
    },
    
    // Anus (for receiving anal)
    anus: {
        penis: ["accept", "take", "receive", "swallow"],
        fingers: ["accept", "take", "receive"],
        tongue: ["accept", "take", "receive"]
    }
};

// ============================================================================
// TARGET CATEGORIES
// ============================================================================

const TARGET_CATEGORIES = {
    FACE: ["face", "mouth", "lips", "neck", "hair"],
    TORSO: ["chest", "nipples", "shoulders", "stomach", "back"],
    GROIN: ["groin", "penis", "vagina"],
    ANAL: ["buttocks", "anus"],
    LEGS: ["hips", "thighs", "legs", "feet"],
    HANDS: ["hand", "arm"]
};

// ============================================================================
// TOOL CATEGORIES
// ============================================================================

const TOOL_CATEGORIES = {
    MANUAL: ["hand", "fingers"],
    ORAL: ["mouth", "tongue"],
    PENETRATIVE: ["penis", "vagina"],
    RECEPTIVE: ["anus"]
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all tools in the matrix
 */
function getAllTools() {
    return Object.keys(INTIMACY_MATRIX);
}

/**
 * Get all targets for a specific tool
 */
function getTargetsForTool(tool) {
    const matrixTool = INTIMACY_MATRIX[tool];
    if (!matrixTool) return [];
    return Object.keys(matrixTool);
}

/**
 * Get all verbs for a tool-target combination
 */
function getVerbsForCombination(tool, target) {
    const matrixTool = INTIMACY_MATRIX[tool];
    if (!matrixTool) return [];
    return matrixTool[target] || [];
}

/**
 * Check if a tool-target combination is valid
 */
function isValidCombination(tool, target) {
    const matrixTool = INTIMACY_MATRIX[tool];
    if (!matrixTool) return false;
    return matrixTool.hasOwnProperty(target);
}

/**
 * Check if a specific verb is valid for a tool-target combination
 */
function isValidVerb(tool, target, verb) {
    const verbs = getVerbsForCombination(tool, target);
    return verbs.includes(verb);
}

/**
 * Generate all possible combinations (tool + target + verb)
 */
function generateAllCombinations() {
    const combinations = [];
    for (const tool of getAllTools()) {
        const targets = getTargetsForTool(tool);
        for (const target of targets) {
            const verbs = getVerbsForCombination(tool, target);
            for (const verb of verbs) {
                combinations.push({ tool, target, verb });
            }
        }
    }
    return combinations;
}

/**
 * Get random combination
 */
function getRandomCombination() {
    const all = generateAllCombinations();
    return all[Math.floor(Math.random() * all.length)];
}

/**
 * Get combinations filtered by target category
 */
function getCombinationsByTargetCategory(category) {
    const targets = TARGET_CATEGORIES[category] || [];
    const combinations = [];
    for (const tool of getAllTools()) {
        for (const target of targets) {
            const verbs = getVerbsForCombination(tool, target);
            for (const verb of verbs) {
                combinations.push({ tool, target, verb });
            }
        }
    }
    return combinations;
}

/**
 * Get combinations filtered by tool category
 */
function getCombinationsByToolCategory(category) {
    const tools = TOOL_CATEGORIES[category] || [];
    const combinations = [];
    for (const tool of tools) {
        const targets = getTargetsForTool(tool);
        for (const target of targets) {
            const verbs = getVerbsForCombination(tool, target);
            for (const verb of verbs) {
                combinations.push({ tool, target, verb });
            }
        }
    }
    return combinations;
}

/**
 * Get gender-appropriate tools based on player gender
 */
function getToolsForGender(gender) {
    const allTools = getAllTools();
    const genderSpecificTools = {
        male: ["penis"],
        female: ["vagina"],
        both: ["hand", "fingers", "mouth", "tongue", "anus"]
    };
    
    // Normalize gender to handle prefixes like "female Halfling" or "male Elf"
    const normalizedGender = String(gender || "").toLowerCase();
    let effectiveGender = gender;
    
    if (normalizedGender.startsWith("female") || normalizedGender.includes("female ")) {
        effectiveGender = "female";
    } else if (normalizedGender.startsWith("male") || normalizedGender.includes("male ")) {
        effectiveGender = "male";
    } else if (normalizedGender.includes("woman") || normalizedGender.includes("girl")) {
        effectiveGender = "female";
    } else if (normalizedGender.includes("man") || normalizedGender.includes("boy")) {
        effectiveGender = "male";
    }
    
    const genderTools = genderSpecificTools[effectiveGender] || [];
    const commonTools = genderSpecificTools.both || [];
    
    return [...new Set([...commonTools, ...genderTools])];
}

// Export for Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        INTIMACY_MATRIX,
        TARGET_CATEGORIES,
        TOOL_CATEGORIES,
        getAllTools,
        getTargetsForTool,
        getVerbsForCombination,
        isValidCombination,
        isValidVerb,
        generateAllCombinations,
        getRandomCombination,
        getCombinationsByTargetCategory,
        getCombinationsByToolCategory,
        getToolsForGender
    };
}
