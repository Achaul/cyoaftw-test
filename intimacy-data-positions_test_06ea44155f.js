/**
 * INTIMACY SYSTEM - POSITION DEFINITIONS
 * Position data for the NSFW intimacy action menu
 * Version: 2026-10-27-001
 */

// Version identifier for debugging cached files
if (typeof window !== "undefined") {
    window.INTIMACY_POSITIONS_VERSION = "2026-10-27-001";
    console.log("[Intimacy Positions] Loaded v2026-10-27-001 - choreography: geometry promptNote, full validTools, new Kneeling Before position");
}

var INTIMACY_POSITIONS = {
    // ===== STANDING POSITIONS =====
    "Standing": {
        label: "standing face to face",
        playerRole: "standing",
        npcRole: "standing",
        furniture: ["small standing room", "large standing room", "open space"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts", "thighs", "groin", "body"],
        analFriendly: false,
        description: "Both standing, facing each other",
        promptNote: "Both upright, face to face, chests close; hands free; mouths reach nothing below the chest."
    },
    
    "Standing From Behind": {
        label: "standing from behind",
        playerRole: "behind",
        npcRole: "in front",
        furniture: ["small standing room", "large standing room", "open space"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts", "thighs", "groin", "body"],
        analFriendly: true,
        description: "Player standing behind the NPC",
        promptNote: "The player stands behind the NPC, front pressed to their back; the NPC's rear at the player's groin, their face turned away."
    },
    
    "Against Wall": {
        label: "against the wall",
        playerRole: "pinned",
        npcRole: "pinning",
        furniture: ["vertical surface", "wall"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts", "thighs", "groin", "body"],
        analFriendly: false,
        description: "NPC has player pinned against a wall",
        promptNote: "The NPC pins the player against a wall; bodies front to front, the player's back to the wall."
    },

    "Against Wall From Behind": {
        label: "against wall from behind",
        playerRole: "pinning",
        npcRole: "pinned",
        furniture: ["vertical surface", "wall"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts", "thighs", "groin", "body"],
        analFriendly: true,
        description: "Player has NPC pinned against a wall from behind",
        promptNote: "The player presses the NPC against the wall from behind; the NPC's cheek to the surface, rear presented."
    },

    // ===== SEATED POSITIONS =====
    "Perched": {
        label: "perched on lap",
        playerRole: "seated",
        npcRole: "between thighs",
        furniture: ["seat", "chair", "lap"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts", "thighs", "groin", "body"],
        analFriendly: true,
        description: "NPC sitting on player's lap",
        promptNote: "The NPC sits on the player's lap, chest to chest, faces level."
    },
    
    "Astride Lap": {
        label: "astride lap",
        playerRole: "sitting",
        npcRole: "seated",
        furniture: ["seat", "chair"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts", "thighs", "groin", "body"],
        analFriendly: true,
        description: "Player straddling NPC's lap",
        promptNote: "The player sits astride the NPC's lap, chest to chest, faces level."
    },

    // ===== LYING POSITIONS =====
    "Missionary": {
        label: "missionary",
        playerRole: "top",
        npcRole: "bottom",
        furniture: ["flat surface", "bed", "ground"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts", "thighs", "groin", "body"],
        analFriendly: true,
        description: "Player on top, facing NPC",
        promptNote: "The player lies over the NPC, face to face, both horizontal, the NPC on their back.",
        // A limp body can be arranged into this lying/bottom position by the player
        placeableByPlayer: true
    },
    
    "Doggy": {
        label: "doggy style",
        playerRole: "behind",
        npcRole: "on all fours",
        furniture: ["flat surface", "bed", "ground"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts", "thighs", "groin", "body"],
        analFriendly: true,
        description: "NPC on hands and knees, player behind",
        promptNote: "The NPC on hands and knees, the player kneeling behind; the NPC's face forward, rear raised.",
        // The player can prop a limp body into this receiving position
        placeableByPlayer: true
    },
    
    "Bent Over": {
        label: "bent over",
        playerRole: "standing",
        npcRole: "bent over",
        furniture: ["vertical surface", "table", "bed", "railing"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts", "thighs", "groin", "body"],
        analFriendly: true,
        description: "NPC bent over a surface",
        promptNote: "The NPC bent over a surface, the player standing behind; face down, rear presented.",
        // The player can hold a limp body bent over a surface
        placeableByPlayer: true
    },
    
    "Spooning": {
        label: "spooning",
        playerRole: "behind",
        npcRole: "in front",
        furniture: ["flat surface", "bed"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts", "thighs", "groin", "body"],
        analFriendly: true,
        description: "Both lying on side, player behind NPC",
        promptNote: "Both lying on their sides, the player nestled behind the NPC, fronts to backs.",
        // A limp body can be rolled into spooning by the player
        placeableByPlayer: true
    },

    // ===== SPECIAL POSITIONS =====
    "Kneeling": {
        label: "kneeling",
        playerRole: "standing",
        npcRole: "kneeling",
        furniture: ["open space", "floor"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts", "thighs", "groin", "body"],
        analFriendly: true,
        description: "NPC kneeling before player",
        promptNote: "The NPC kneels before the standing player, face at groin height; the player's hands rest on their head and shoulders."
    },
    
    "Kneeling Over": {
        label: "kneeling over",
        playerRole: "lying",
        npcRole: "kneeling",
        furniture: ["open space", "floor", "bed"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts", "thighs", "groin", "body"],
        analFriendly: true,
        description: "NPC kneeling over player",
        promptNote: "The NPC kneels astride the prone player, groin over the player's face, able to bend over them."
    },
    
    // ===== COWGIRL VARIATIONS =====
    "Cowgirl": {
        label: "cowgirl",
        playerRole: "bottom",
        npcRole: "top",
        furniture: ["flat surface", "bed"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts", "thighs", "groin", "body"],
        analFriendly: true,
        description: "Player on back, NPC on top facing player",
        promptNote: "The NPC straddles the prone player, kneeling over their hips, facing them; the player lies on their back."
    },
    
    "Reverse Cowgirl": {
        label: "reverse cowgirl",
        playerRole: "bottom",
        npcRole: "top",
        furniture: ["flat surface", "bed"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts", "thighs", "groin", "body"],
        analFriendly: true,
        description: "Player on back, NPC on top facing away",
        promptNote: "The NPC straddles the prone player facing away; the player sees their back."
    },

    // ===== ORAL SERVICE POSITIONS =====
    "Sixty-Nine": {
        label: "69",
        playerRole: "top",
        npcRole: "bottom",
        furniture: ["flat surface", "bed"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts", "thighs", "groin", "body"],
        analFriendly: true,
        description: "Oral service with reciprocal access",
        promptNote: "Head to toe: each groin at the other's mouth, both faces buried, mutual."
    },

    "Oral Service": {
        label: "oral service",
        playerRole: "top",
        npcRole: "bottom",
        furniture: ["flat surface", "bed", "kneeling position"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts", "thighs", "groin", "body"],
        analFriendly: true,
        description: "NPC performing oral on player",
        promptNote: "The NPC kneels servicing the player's groin with their mouth; the player stands or sits before them."
    },

    "Prone Oral Service": {
        label: "prone oral service",
        playerRole: "bottom",
        npcRole: "top",
        furniture: ["flat surface", "bed"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts", "thighs", "groin", "body"],
        analFriendly: true,
        description: "NPC lying down performing oral",
        promptNote: "The NPC lies prone servicing the player, who kneels over them; both groins within reach - a flat 69."
    },

    "Kneeling By Face": {
        label: "kneeling by face",
        playerRole: "standing",
        npcRole: "kneeling",
        furniture: ["open space", "small standing room", "large standing room"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts", "thighs", "groin", "body"],
        analFriendly: true,
        description: "Player standing, NPC kneeling at face level",
        promptNote: "The NPC kneels at the player's groin, face tilted up to service them."
    },

    "Squatting Before": {
        label: "squatting before",
        playerRole: "standing",
        npcRole: "squatting",
        furniture: ["open space", "small standing room", "large standing room"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts", "thighs", "groin", "body"],
        analFriendly: true,
        description: "Player standing, NPC squatting in front",
        promptNote: "The NPC squats low before the standing player, mouth at their groin."
    },

    "Riding Face": {
        label: "riding face",
        playerRole: "bottom",
        npcRole: "top",
        furniture: ["flat surface", "bed"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts", "thighs", "groin", "body"],
        analFriendly: true,
        description: "NPC sitting on player's face",
        promptNote: "The NPC sits astride the player's face, groin over the player's mouth, facing down their body."
    },

    "Mounted On X-Cross Oral Service": {
        label: "mounted on X-cross oral service",
        playerRole: "top",
        npcRole: "restrained",
        furniture: ["x-cross", "bondage furniture"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts", "thighs", "groin", "body"],
        analFriendly: true,
        description: "NPC restrained on X-cross performing oral",
        promptNote: "The NPC is bound spread on an X-cross; the player stands before them, their mouth and pinned body available."
    },
    "Kneeling Before": {
        label: "kneeling before",
        playerRole: "kneeling",
        npcRole: "standing",
        furniture: ["open space", "floor"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples", "thighs"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "anus", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples", "thighs"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts", "thighs", "groin", "body"],
        analFriendly: false,
        description: "Player kneeling before the standing NPC",
        promptNote: "The player kneels before the standing NPC, mouth at groin height; the NPC's hands rest on the player's head and shoulders."
    },

    // ===== UNCONSCIOUS BODY POSITIONS =====
    "Unconscious On Back": {
        label: "on back (unconscious)",
        playerRole: "over",
        npcRole: "on back",
        furniture: ["floor"],
        accessibleTargets: {
            player: ["face", "mouth", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "anus", "back", "arms", "legs", "thighs"],
            npc: ["face", "mouth", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "anus", "back", "arms", "legs", "thighs"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts"],
        analFriendly: false,
        description: "NPC lying unconscious on their back",
        promptNote: "The NPC lies motionless on their back. Arms flop to the sides, legs fall open by gravity, head lolls to one side. You can position their limp limbs as needed.",
        unconsciousOnly: true
    },
    "Unconscious On Face": {
        label: "on face (unconscious)",
        playerRole: "behind",
        npcRole: "on face",
        furniture: ["floor"],
        accessibleTargets: {
            player: ["face", "mouth", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "anus", "back", "arms", "legs", "thighs"],
            npc: ["face", "mouth", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "anus", "back", "arms", "legs", "thighs"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts"],
        analFriendly: true,
        description: "NPC on face, knees splayed, butt raised",
        promptNote: "The NPC lies face-down, chest and knees on floor. Legs splayed wide by gravity, buttocks raised and exposed. You can spread their cheeks or adjust position - no resistance.",
        unconsciousOnly: true
    },
    "Unconscious On Side": {
        label: "on side (unconscious)",
        playerRole: "beside",
        npcRole: "on side",
        furniture: ["floor"],
        accessibleTargets: {
            player: ["face", "mouth", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "anus", "back", "arms", "legs", "thighs"],
            npc: ["face", "mouth", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "anus", "back", "arms", "legs", "thighs"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts"],
        analFriendly: false,
        description: "NPC lying unconscious on their side",
        promptNote: "The NPC lies on their side, one arm under, one flopped out. Top leg falls forward, bottom leg back, giving partial access. Gravity helps hold position.",
        unconsciousOnly: true
    },
    "Unconscious Doggy": {
        label: "doggy position (unconscious)",
        playerRole: "behind",
        npcRole: "on all fours",
        furniture: ["floor"],
        accessibleTargets: {
            player: ["face", "mouth", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "anus", "back", "arms", "legs", "thighs"],
            npc: ["face", "mouth", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "anus", "back", "arms", "legs", "thighs"]
        },
        validTools: ["hand", "fingers", "mouth", "tongue", "penis", "vagina", "anus", "breasts"],
        analFriendly: true,
        description: "NPC in doggy position, unconscious",
        promptNote: "The NPC is positioned on hands and knees, face down. Arms barely support chest, knees spread wide, buttocks raised and exposed. Unconscious - no resistance to positioning.",
        unconsciousOnly: true
    }

};

// Default position for new encounters
const DEFAULT_POSITION = "Standing";

// Helper function to get position by ID
function getPosition(positionId) {
    return INTIMACY_POSITIONS[positionId];
}

// Check if a position exists
function hasPosition(positionId) {
    return INTIMACY_POSITIONS.hasOwnProperty(positionId);
}

// Get all position IDs
function getAllPositionIds() {
    return Object.keys(INTIMACY_POSITIONS);
}

// Get positions filtered by furniture requirement
function getPositionsForFurniture(furnitureType) {
    const validPositions = [];
    for (const [id, pos] of Object.entries(INTIMACY_POSITIONS)) {
        if (pos.furniture.includes(furnitureType)) {
            validPositions.push(id);
        }
    }
    return validPositions;
}

// Get positions that support anal access
function getAnalFriendlyPositions() {
    const positions = [];
    for (const [id, pos] of Object.entries(INTIMACY_POSITIONS)) {
        if (pos.analFriendly) {
            positions.push(id);
        }
    }
    return positions;
}

// Can the player physically place a non-resisting (unconscious/sleeping)
// NPC into this position? Only dedicated unconscious positions and lying
// "bottom" positions the player can arrange a limp body into qualify —
// never positions where the NPC must stand, kneel, sit up, hold itself
// up, or be on top.
function isPositionPlaceableForNonResisting(positionId) {
    const pos = INTIMACY_POSITIONS[positionId];
    if (!pos) return false;
    if (pos.unconsciousOnly === true) return true;
    if (pos.placeableByPlayer === true) return true;
    return false;
}

// Export for Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        INTIMACY_POSITIONS,
        DEFAULT_POSITION,
        getPosition,
        hasPosition,
        getAllPositionIds,
        getPositionsForFurniture,
        getAnalFriendlyPositions,
        isPositionPlaceableForNonResisting
    };
}
