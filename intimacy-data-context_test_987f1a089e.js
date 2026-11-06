/**
 * INTIMACY SYSTEM - CONTEXT DETECTION
 * Detects game state to determine appropriate intimacy options
 * Version: 2026-08-16-006
 */

// Version identifier for debugging cached files
if (typeof window !== "undefined") {
    window.INTIMACY_CONTEXT_VERSION = "2026-08-16-009";
    console.log("[Intimacy Context] Loaded v2026-08-16-009 - All natural labels now use specific body part references with {trait} placeholders");
}

// ============================================================================
// PRIVATE LOCATION TYPES
// Rooms where intimate actions are socially acceptable
// ============================================================================

var PRIVATE_ROOM_TYPES = [
    "Guest Room",
    "Home",
    "Inn Common",
    "Inn",
    "Bedroom",
    "Private Chamber",
    "Tavern Room",
    "Cellar",
    "Vault",
    "Dark Alleyway",
    "Abandoned Armory",
    "Forgotten Shrine",
    "Crumbling Tower",
    "Great Cavern",
    "Stone Vault",
    "Underground Hallway",
    "Underground Gate",
    "Passage",
    "Corridor",
    "Tunnel",
    "Dungeon Chamber"
];

var SOCIAL_ROOM_TYPES = [
    "Town Square",
    "Square",
    "Street",
    "Avenue",
    "Market Avenue",
    "Cobblestone Street",
    "Market",
    "Tavern",
    "Taproom",
    "Smoky Tavern",
    "Gate",
    "Town Gate",
    "Hallway",
    "Ruined Hallway",
    "Ruins Passage",
    "Library",
    "Ruined Library"
];

// ============================================================================
// INTIMACY PHASES
// ============================================================================

var INTIMACY_PHASES = {
    SOCIAL: 1,        // Flirt, seduce only
    PRIVATE: 2,       // Undressing, foreplay (private location, only 2 people)
    INTIMATE: 3       // Full intimacy menu (after consent/penetration)
};

// ============================================================================
// CONTEXT CHECKING FUNCTIONS
// ============================================================================

/**
 * Check if current room is private (suitable for intimacy)
 */
function isPrivateLocation(room) {
    if (!room) return false;
    
    const roomType = room.type || room.roomType || "";
    const displayName = room.displayName || room.name || "";
    
    // Check against private types
    const normalizedType = roomType.toLowerCase().trim();
    const normalizedName = displayName.toLowerCase().trim();
    
    for (const privateType of PRIVATE_ROOM_TYPES) {
        if (normalizedType.includes(privateType.toLowerCase()) ||
            normalizedName.includes(privateType.toLowerCase())) {
            return true;
        }
    }
    
    // Check room tags/flags if available
    if (room.isPrivate || room.private || room.tags && room.tags.includes("private")) {
        return true;
    }
    
    return false;
}

/**
 * Check if current room is social (public, not suitable for nudity)
 */
function isSocialLocation(room) {
    if (!room) return true; // Default to social if unknown
    
    const roomType = room.type || room.roomType || "";
    const displayName = room.displayName || room.name || "";
    
    const normalizedType = roomType.toLowerCase().trim();
    const normalizedName = displayName.toLowerCase().trim();
    
    for (const socialType of SOCIAL_ROOM_TYPES) {
        if (normalizedType.includes(socialType.toLowerCase()) ||
            normalizedName.includes(socialType.toLowerCase())) {
            return true;
        }
    }
    
    return false;
}

/**
 * Count humanoids in room (excluding player)
 */
function countHumanoidsInRoom(room, excludeNpc = null) {
    if (!room || !room.creatures) return 1; // Assume others present if unknown
    
    let count = 0;
    for (const creature of room.creatures) {
        // Skip excluded NPC
        if (excludeNpc && creature === excludeNpc) continue;
        
        // Skip non-humanoids
        if (!creature.isHumanoid && !creature.humanoid) continue;
        
        // Skip player character
        if (creature.isPlayer) continue;
        
        count++;
    }
    
    return count;
}

/**
 * Check if only player and target NPC are present
 */
function isAloneWithTarget(room, targetNpc) {
    if (!room) return false;
    return countHumanoidsInRoom(room, targetNpc) === 0;
}

/**
 * Determine current intimacy phase based on context
 */
function getCurrentIntimacyPhase(room, targetNpc, npc) {
    if (!room) return INTIMACY_PHASES.SOCIAL;
    
    // Check if intimacy encounter is already active
    if (npc && npc.intimacy && npc.intimacy.encounter && npc.intimacy.encounter.active) {
        return INTIMACY_PHASES.INTIMATE;
    }
    
    // Check if in private location with only target
    const isPrivate = isPrivateLocation(room);
    const isAlone = isAloneWithTarget(room, targetNpc);
    
    // Allow PRIVATE phase if: (private + alone) OR (private + pending seduction/follow)
    const hasPendingSeduction = npc && (npc._pendingSeductionDestination || npc._pendingSeductionOption);
    
    if ((isPrivate && isAlone) || (isPrivate && hasPendingSeduction)) {
        return INTIMACY_PHASES.PRIVATE;
    }
    
    // Default to social
    return INTIMACY_PHASES.SOCIAL;
}

/**
 * Check if full intimacy is allowed in current context
 */
function canStartIntimacy(room, targetNpc) {
    const phase = getCurrentIntimacyPhase(room, targetNpc);
    return phase >= INTIMACY_PHASES.PRIVATE;
}

/**
 * Check if undressing/foreplay is allowed
 */
function canUndress(room, targetNpc) {
    return canStartIntimacy(room, targetNpc);
}

/**
 * Check if full penetration is allowed
 */
function canPenetrate(room, targetNpc, npc) {
    // Requires intimacy encounter to be active
    if (npc && npc.intimacy && npc.intimacy.encounter && npc.intimacy.encounter.active) {
        return true;
    }
    return canStartIntimacy(room, targetNpc);
}

/**
 * Check if NPC is in an unconscious state (unconscious body or isUnconsciousBody flag)
 */
function isNPCUnconscious(npc) {
    if (!npc) return false;
    // Check for unconscious body objects
    if (npc.bodyState === "unconscious" || npc.isUnconsciousBody === true) {
        return true;
    }
    // Check for unconscious flag on regular NPCs
    if (npc.unconscious === true || npc.hp <= 0) {
        return true;
    }
    return false;
}

/**
 * Check if action is eligible for unconscious NPC
 * Unconscious NPCs can only receive one-sided, non-consensual actions
 */
function isActionValidForUnconscious(act, npc) {
    if (!act || !npc) return false;
    // Action must be marked for unconscious use
    if (act.unconsciousOnly !== true) return false;
    // Additional checks can be added here for species compatibility, etc.
    return true;
}

// ============================================================================
// NATURAL LABEL MAPPING
// Maps clinical act IDs to natural, immersive display text
// ============================================================================

var NATURAL_LABELS = {
    // Stage 1: Social/Clothed
    kiss_lips: "Kiss lips",
    kiss_cheek: "Kiss cheek",
    kiss_neck: "Kiss neck",
    caress_face: "Caress face",
    stroke_hair: "Stroke hair",
    hold_hand: "Hold hand",
    hug: "Hug their body",
    embrace: "Embrace their body",
    
    // Stage 2: Clothing Removal
    remove_player_top: "Remove your top",
    remove_player_bottom: "Remove your bottom",
    undress_player: "Undress yourself",
    remove_npc_top: "Remove their top",
    remove_npc_bottom: "Remove their bottom",
    undress_npc: "Undress them completely",
    move_top_aside: "Move your top aside",
    pull_down_bottom: "Pull down your bottom",
    move_npc_top_aside: "Move their top aside",
    pull_down_npc_bottom: "Pull down their bottom",
    
    // Stage 3: Nude Foreplay - Gentle
    grope_breasts: "Touch their breasts",
    caress_breasts: "Caress their breasts",
    squeeze_breasts: "Squeeze their breasts",
    titfuck: "Fuck their {npcBreasts}",
    tease_nipples: "Tease their nipples",
    pinch_nipples: "Pinch their nipples",
    flick_nipples: "Flick their nipples",
    kiss_nipples: "Kiss their nipples",
    lick_nipples: "Lick their nipples",
    suck_nipples: "Suck their nipples",
    bite_nipples: "Nibble their nipples",
    
    caress_stomach: "Caress their stomach",
    stroke_back: "Stroke their back",
    massage_shoulders: "Massage their shoulders",
    grip_hips: "Grip their hips",
    stroke_thighs: "Stroke their thighs",
    tease_groin: "Tease their groin",
    
    // Genital actions - suggestive
    rub_pussy: "Touch their {pussy}",
    tease_pussy: "Tease their {pussy}",
    press_pussy: "Press {pussy} with your hand",
    spread_pussy: "Part their {pussy} lips",
    finger_pussy: "Finger their {pussy}",
    enter_pussy_finger: "Slide fingers into {pussy}",
    finger_pussy_fast: "Finger their {pussy} fast",
    kiss_pussy: "Kiss their {pussy}",
    lick_pussy: "Taste their {pussy}",
    tongue_pussy: "Tongue their {pussy}",
    grind_pussy: "Grind your groin on {pussy}",
    
    press_penis_pussy: "Press your {penis} on {pussy}",
    enter_pussy: "Enter {pussy} with your {penis}",
    thrust_pussy: "Thrust your {penis} in {pussy}",
    pump_pussy: "Pump your {penis} in {pussy}",
    fuck_pussy: "Fuck {pussy} with your {penis}",
    pound_pussy: "Pound your {penis} into {pussy}",
    
    // Vagina on penis (player bottom)
    impale_penis: "Lower onto their {penis}",
    ride_penis: "Ride their {penis}",
    bounce_penis: "Bounce on their {penis}",
    grind_penis: "Grind on their {penis}",
    
    // Anal actions
    grope_ass: "Touch their {buttocks}",
    squeeze_ass: "Squeeze their {buttocks}",
    assjob: "Hotdog their {buttocks}",
    slap_ass: "Spank their {buttocks}",
    spread_cheeks: "Spread their cheeks",
    touch_anus: "Touch their {anus}",
    press_anus: "Press {anus} with your hand",
    rub_anus: "Rub their {anus}",
    finger_anus: "Finger-tease their {anus}",
    enter_anus_finger: "Slide a finger into {anus}",
    finger_anus_fast: "Finger their {anus} fast",
    kiss_anus: "Kiss their {anus}",
    lick_anus: "Lick their {anus}",
    suck_anus: "Suck on their {anus}",
    rim_anus: "Rim {anus} with your tongue",
    tongue_anus: "Tongue their {anus}",
    press_penis_anus: "Press your {penis} on {anus}",
    enter_anus: "Enter {anus} with your {penis}",
    thrust_anus: "Thrust your {penis} in {anus}",
    pound_anus: "Pound your {penis} into {anus}",
    fuck_anus: "Fuck {anus} with your {penis}",
    accept_penis_anus: "Ask for their {penis} in your {anus}",
    take_penis_anus: "Take their {penis} deeper",
    
    // Penis actions (on NPC)
    stroke_penis: "Stroke their {penis}",
    grip_penis: "Grip their {penis} firmly",
    squeeze_penis: "Squeeze their {penis}",
    kiss_penis: "Kiss their {penis}",
    lick_penis: "Lick their {penis}",
    suck_penis: "Suck their {penis}",
    deepthroat_penis: "Deepthroat their {penis}",
    fuck_mouth: "Facefuck them with your {penis}",
    
    // On player
    suck_player_nipples: "Ask them to suck your {nipples}",
    accept_penis_mouth: "Offer your mouth for their {penis}",
    lick_player_pussy: "Ask them to lick your {pussy}",
    suck_player_clit: "Ask them to suck on your clit",
    suck_player_penis: "Ask them to suck your {penis}",
    stroke_player_penis: "Ask them to stroke your {penis}",
    titjob_player: "Ask them to titfuck your {penis}",
    deepthroat_player_penis: "Ask them to deepthroat you",
    lick_player_balls: "Ask them to lick your {balls}",
    suck_player_balls: "Ask them to suck your {balls}",
    lick_player_anus: "Ask them to lick your {anus}",
    rim_player_anus: "Ask them to rim your {anus}",
    
    // Climax actions - natural
    ejaculate_in_vagina: "Finish inside their {pussy}",
    ejaculate_in_anus: "Finish inside their {anus}",
    ejaculate_in_mouth: "Release in their mouth",
    ejaculate_on_face: "Mark their face",
    ejaculate_on_chest: "Finish on their {chest}",
    ejaculate_on_breasts: "Finish on their {breasts}",
    ejaculate_on_stomach: "Finish on their {stomach}",
    ejaculate_on_butt: "Finish on their {buttocks}",
    ejaculate_on_pussy: "Finish on their {pussy}",
    ejaculate_on_back: "Finish on their back",
    ejaculate_on_legs: "Finish on their {legs}",
    ejaculate_on_feet: "Finish on their {feet}",
    female_ejaculate: "Let yourself go and squirt",
    player_orgasm: "Succumb to the pressure and come",
    mutual_climax: "Climax together",
    
    // End actions
    stop: "Stop",
    pause: "Pause"
};

/**
 * Get natural display label for an act, with optional gender personalization
 * If npc and player are provided, uses gendered labels when available
 */
function getNaturalLabel(actId, npc, player) {
    // First check NATURAL_LABELS for override — the curated menu label wins
    // over the raw act label; gendering is applied to the natural label
    // itself (via a temp act carrying the real act's target), never to the
    // raw act label, so a gendered "Enter her anus" can't shadow the
    // curated "Enter their {anus} with your {penis}".
    if (NATURAL_LABELS[actId]) {
        if (typeof getGenderedLabel === 'function' && npc && player) {
            const actForNatural = getAct(actId);
            if (actForNatural && actForNatural.target) {
                // Gender the natural label directly using the act's target
                // info, so possessive/token handling works the same as for
                // act labels (playerIsBottom included for receive actions).
                const tempAct = {
                    label: NATURAL_LABELS[actId],
                    target: actForNatural.target,
                    playerIsBottom: actForNatural.playerIsBottom
                };
                const genderedNatural = getGenderedLabel(tempAct, npc, player);
                if (genderedNatural && genderedNatural !== NATURAL_LABELS[actId]) {
                    return genderedNatural;
                }
            }
        }
        return NATURAL_LABELS[actId];
    }
    
    // Fallback to act label
    const act = getAct(actId);
    if (!act) return actId;
    
    // Try gendered label if we have npc/player
    if (typeof getGenderedLabel === 'function' && npc && player) {
        const gendered = getGenderedLabel(act, npc, player);
        if (gendered && gendered !== act.label) {
            return gendered;
        }
    }
    
    return act.label || actId;
}

// ============================================================================
// ACTION FILTERING FOR MENU
// ============================================================================

/**
 * Filter actions based on current intimacy phase
 */
function filterActionsByPhase(actions, phase) {
    const filtered = [];
    
    // Handle both array and object (categorized) formats
    const actionsArray = Array.isArray(actions) ? actions : (
        actions ? Object.values(actions).flat() : []
    );
    
    for (const action of actionsArray) {
        const act = action.actId ? getAct(action.actId) : action;
        if (!act) continue;
        
        // Always allow in intimate phase
        if (phase >= INTIMACY_PHASES.INTIMATE) {
            filtered.push(action);
            continue;
        }
        
        // Private phase: allow clothing removal and foreplay
        if (phase >= INTIMACY_PHASES.PRIVATE) {
            if (act.type === ACT_TYPES.CLOTHING || 
                act.type === ACT_TYPES.TEASE ||
                (act.type === ACT_TYPES.IMPACT && act.id !== "slap_ass")) {
                filtered.push(action);
                continue;
            }
        }
        
        // Social phase: only allow non-physical actions
        if (phase >= INTIMACY_PHASES.SOCIAL) {
            // These are always allowed in social contexts
            const socialActions = [
                "kiss_lips", "kiss_cheek", "kiss_neck",
                "caress_face", "stroke_hair", 
                "hug", "embrace",
                "hold_hand"
            ];
            
            if (socialActions.includes(act.id)) {
                filtered.push(action);
            }
        }
    }
    
    return filtered;
}

// Export for Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PRIVATE_ROOM_TYPES,
        SOCIAL_ROOM_TYPES,
        INTIMACY_PHASES,
        NATURAL_LABELS,
        isPrivateLocation,
        isSocialLocation,
        countHumanoidsInRoom,
        isAloneWithTarget,
        getCurrentIntimacyPhase,
        canStartIntimacy,
        canUndress,
        canPenetrate,
        filterActionsByPhase,
        getNaturalLabel,
        isNPCUnconscious,
        isActionValidForUnconscious
    };
}

// Assign to window for browser use
if (typeof window !== 'undefined') {
    window.PRIVATE_ROOM_TYPES = PRIVATE_ROOM_TYPES;
    window.SOCIAL_ROOM_TYPES = SOCIAL_ROOM_TYPES;
    window.INTIMACY_PHASES = INTIMACY_PHASES;
    window.NATURAL_LABELS = NATURAL_LABELS;
    window.isPrivateLocation = isPrivateLocation;
    window.isSocialLocation = isSocialLocation;
    window.countHumanoidsInRoom = countHumanoidsInRoom;
    window.isAloneWithTarget = isAloneWithTarget;
    window.getCurrentIntimacyPhase = getCurrentIntimacyPhase;
    window.canStartIntimacy = canStartIntimacy;
    window.canUndress = canUndress;
    window.canPenetrate = canPenetrate;
    window.filterActionsByPhase = filterActionsByPhase;
    window.getNaturalLabel = getNaturalLabel;
    window.isNPCUnconscious = isNPCUnconscious;
    window.isActionValidForUnconscious = isActionValidForUnconscious;
}
