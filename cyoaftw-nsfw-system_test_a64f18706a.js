// === cyoaftw-nsfw-system.js === - 2026-11-02-003              
// Session followers, isAloneWithNPC fix, typeof guards, clothed narration, early window exposure, action function passthrough fix, stat-based fallback acceptance, nsfw wrapper re-apply, intimacy portrait toggle, DeepSeek prompt optimization, fixed missing closing brace
window.__NSFW_SYSTEM_VERSION = "2026-11-02-003";
console.log("[BODY-DEBUG] nsfw-system.js FILE PARSED (before IIFE)");
try {
(function() {
  'use strict';

// NSFW conversation options are now defined in base catalogue (cyoaftw-npc-data.js)

// NSFW options are defined in base catalogue - no injection needed
console.log("[NSFW System] Loaded v2026-11-02-003 - stat-based fallback acceptance + follow action fix + nsfw wrapper re-apply + fixed missing closing brace");

  const NSFW_SYSTEM_ENABLED = true;
  function getEnvironmentalModifier(room) {
    if (!room) return 1.0;
    const modifiers = {
      tavern: 1.1,
      inn: 1.1,
      dungeon: 0.8,
      forest: 0.9,
      private: 1.2
    };
    return modifiers[room.type] || 1.0;
  }

  function getPlayerCharismaModifier() {
    const player = window.G && window.G.player;
    if (!player || !player.stats) return 1.0;
    // Route through the engine accessor so worn-clothing quality, carried
    // trinkets and potion bonuses all count (the engine exposes getSetupStat
    // on window - without that exposure this falls back to raw stats).
    // Fallback 3 matches the setup baseline - the old "|| 10" default sat
    // above the design range (base 3 -> 0.86x, 12 -> 1.04x) whenever stats
    // were missing.
    const charisma = typeof window.getSetupStat === "function"
      ? window.getSetupStat("charisma", 3)
      : (player.stats.charisma || 3);
    return 0.8 + (charisma * 0.02);
  }

  function applyAttractionImpact(npc, impact) {
    // Single stat pool: memory.* (the legacy npc.relationship.* pool is
    // folded in once by migrateNPCRelationshipPool in cyoaftw-npc-data.js).
    npc.memory = npc.memory || {};
    const temperamentMod = window.getTemperamentModifier ? window.getTemperamentModifier(npc.temperament) : 0;
    const multiplier = 1.0 + (temperamentMod * 0.1);
    // Charisma scales attractiveness gains the same way lust gains are
    // scaled below - part of making charisma matter across the board.
    const charismaMultiplier = getPlayerCharismaModifier();
    const gain = Math.round(impact * multiplier * charismaMultiplier);
    // Track the action-earned share so recomputeNPCAttraction (interaction
    // start) keeps it on top of the freshly computed base.
    npc.memory.attractionEarned = (typeof npc.memory.attractionEarned === "number" ? npc.memory.attractionEarned : 0) + gain;
    npc.memory.attraction = Math.max(0, Math.min(100, (npc.memory.attraction || 0) + gain));
  }

  function applyLustImpact(npc, impact, envModifier = 1.0) {
    npc.memory = npc.memory || {};
    const temperamentMod = window.getTemperamentModifier ? window.getTemperamentModifier(npc.temperament) : 0;
    const temperamentMultiplier = 1.0 + (temperamentMod * 0.1);
    const charismaMultiplier = getPlayerCharismaModifier();
    const totalModifier = envModifier * temperamentMultiplier * charismaMultiplier;
    npc.memory.lust = Math.max(0, Math.min(100, (npc.memory.lust || 0) + Math.round(impact * totalModifier)));
  }

  // Note: NSFW_CONVERSATION_CATALOGUE is already defined at the top of this file
  // The rest of the code will use the catalogue defined above

  function ensureNPCRelationshipState(npc) {
    if (!npc) return;
    // Memory.* is the single stat pool; run the one-time legacy-merge first.
    if (typeof window.migrateNPCRelationshipPool === "function") {
      window.migrateNPCRelationshipPool(npc);
    }
    npc.memory = npc.memory || {};
    if (typeof npc.memory.lust !== "number") npc.memory.lust = 0;
    if (typeof npc.memory.attraction !== "number") npc.memory.attraction = 0;
    if (typeof npc.memory.arousal !== "number") npc.memory.arousal = 0;
    if (typeof npc.memory.disinhibition !== "number") npc.memory.disinhibition = 0;
    if (!npc.memory.orientation) npc.memory.orientation = "bi";
  }

  // ============================================================================
  // CREATURE TEMPLATES - NSFW anatomy extensions for species
  // ============================================================================
  // These templates extend the SFW SPECIES_TEMPLATES with NSFW-specific fields:
  // - allowedSkinTones: array of skin/fur/scale color options
  // - visualProfile.surface: surface type and texture details
  // - allowedHairColors: array of hair color options
  // - allowedEyeColors: array of eye color options
  // - appearanceProfile: body appearance type (mapped from SFW anatomyType)
  // - sensualProfile: erotic anatomy details (breasts, genitals)
  // - cloaca: boolean for species with cloaca instead of separate genitals
  // - isHumanoid, isCivilized, size: matched from SFW templates
  //
  // The type field must match the species name (case-insensitive).
  // These are merged with SFW templates at runtime via getCreatureTemplate.

  var CREATURE_TEMPLATES = [
    // === Human ===
    {
      type: "Human",
      isHumanoid: true,
      isCivilized: true,
      size: "medium",
      allowedSkinTones: ["pale", "fair", "tan", "olive", "brown", "dark brown"],
      visualProfile: {
        surface: { type: "skin", texture: ["smooth", "soft", "slightly rough", "supple"], sheen: "matte" }
      },
      allowedHairColors: ["black", "brown", "auburn", "blond", "gray", "white"],
      allowedEyeColors: ["brown", "hazel", "green", "blue", "gray", "amber"],
      appearanceProfile: "humanoid",
      sensualProfile: {
        breasts: { description: "a modest bust" }
      },
      cloaca: false
    },
    // === Elf ===
    {
      type: "Elf",
      isHumanoid: true,
      isCivilized: true,
      size: "medium",
      allowedSkinTones: ["pale", "warm ivory", "olive", "copper", "moonlit brown"],
      visualProfile: {
        surface: { type: "skin", texture: ["smooth", "velvety", "slightly luminous", "delicate"], sheen: "glowing" }
      },
      allowedHairColors: ["silver", "black", "gold", "chestnut", "white", "auburn"],
      allowedEyeColors: ["green", "violet", "silver", "amber", "blue", "hazel"],
      appearanceProfile: "humanoid",
      sensualProfile: {
        breasts: { description: "a graceful, elven bust" }
      },
      cloaca: false
    },
    // === Dwarf ===
    {
      type: "Dwarf",
      isHumanoid: true,
      isCivilized: true,
      size: "small",
      allowedSkinTones: ["ruddy", "tan", "deep brown", "umber", "stone-pale"],
      visualProfile: {
        surface: { type: "skin", texture: ["rough", "weathered", "sturdy", "calloused"], sheen: "matte" }
      },
      allowedHairColors: ["black", "brown", "red", "iron-gray", "white", "auburn"],
      allowedEyeColors: ["brown", "amber", "gray", "green", "black", "hazel"],
      appearanceProfile: "humanoid",
      sensualProfile: {
        breasts: { description: "a sturdy, compact bust" }
      },
      cloaca: false
    },
    // === Halfling ===
    {
      type: "Halfling",
      isHumanoid: true,
      isCivilized: true,
      size: "small",
      allowedSkinTones: ["fair", "sun-browned", "warm tan", "olive", "brown"],
      visualProfile: {
        surface: { type: "skin", texture: ["smooth", "soft", "supple", "warm"], sheen: "soft" }
      },
      allowedHairColors: ["brown", "black", "sandy", "auburn", "gray", "blonde"],
      allowedEyeColors: ["brown", "hazel", "green", "blue", "amber"],
      appearanceProfile: "humanoid",
      sensualProfile: {
        breasts: { description: "a soft, round bust" }
      },
      cloaca: false
    },
    // === Goblin ===
    {
      type: "Goblin",
      isHumanoid: true,
      isCivilized: false,
      size: "small",
      allowedSkinTones: ["moss green", "yellow-green", "ash gray", "mud brown", "sallow ochre"],
      visualProfile: {
        surface: { type: "skin", texture: ["leathery", "wrinkled", "rough", "scaly patches"], sheen: "dull" }
      },
      allowedHairColors: ["black", "mud-brown", "rust", "patchy gray", "none"],
      allowedEyeColors: ["amber", "red-brown", "black", "yellow", "pale green"],
      appearanceProfile: "humanoid",
      sensualProfile: {
        breasts: { description: "small, knobby mounds" }
      },
      cloaca: false
    },
    // === Orc ===
    {
      type: "Orc",
      isHumanoid: true,
      isCivilized: false,
      size: "large",
      allowedSkinTones: ["deep green", "gray-green", "ash gray", "dark umber", "olive"],
      visualProfile: {
        surface: { type: "skin", texture: ["leathery", "thick", "weathered", "scarred"], sheen: "dull" }
      },
      allowedHairColors: ["black", "dark brown", "iron-gray", "rust", "shaved", "white"],
      allowedEyeColors: ["amber", "brown", "red-brown", "gray", "black"],
      appearanceProfile: "humanoid",
      sensualProfile: {
        breasts: { description: "heavy, powerful mounds" }
      },
      cloaca: false
    },
    // === Lizardfolk ===
    {
      type: "Lizardfolk",
      isHumanoid: true,
      isCivilized: false,
      size: "medium",
      allowedSkinTones: ["moss green", "swamp brown", "olive", "dark green", "gray-green"],
      visualProfile: {
        surface: { type: "scales", texture: ["smooth", "overlapping", "glossy", "matted"], sheen: "shiny" }
      },
      allowedHairColors: ["none"],
      allowedEyeColors: ["amber", "yellow", "red", "black", "gold"],
      appearanceProfile: "reptilian",
      sensualProfile: {
        breasts: { description: "firm, scaled swells" }
      },
      cloaca: true
    },
    // === Kobold ===
    {
      type: "Kobold",
      isHumanoid: true,
      isCivilized: false,
      size: "tiny",
      allowedSkinTones: ["rust red", "dark brown", "deep orange", "mottled brown", "dusty red"],
      visualProfile: {
        surface: { type: "scales", texture: ["fine", "dry", "smooth", "slightly rough"], sheen: "matte" }
      },
      allowedHairColors: ["none"],
      allowedEyeColors: ["amber", "red", "yellow", "pale orange"],
      appearanceProfile: "reptilian",
      sensualProfile: {
        breasts: { description: "tiny, underdeveloped swells" }
      },
      cloaca: true
    },
    // === Skeleton ===
    {
      type: "Skeleton",
      isHumanoid: false,
      isCivilized: false,
      size: "medium",
      allowedSkinTones: ["ivory", "yellowed", "ash-white", "smoke-stained", "old brown"],
      visualProfile: {
        surface: { type: "bone", texture: ["smooth", "cracked", "pitted", "polished"], sheen: "glossy" }
      },
      allowedHairColors: ["none"],
      allowedEyeColors: ["blue witchlight", "green witchlight", "empty shadow", "red pinpricks"],
      appearanceProfile: "undead",
      sensualProfile: {},
      cloaca: false
    },
    // === Ghost ===
    {
      type: "Ghost",
      isHumanoid: false,
      isCivilized: false,
      size: "medium",
      allowedSkinTones: ["pale blue", "silver-white", "faint green", "smoky gray", "candlelit gold"],
      visualProfile: {
        surface: { type: "translucent form", texture: ["wispy", "ethereal", "misty", "shimmering"], sheen: "ghostly" }
      },
      allowedHairColors: ["none"],
      allowedEyeColors: ["white", "blue", "hollow black", "silver", "faint green"],
      appearanceProfile: "ethereal",
      sensualProfile: {},
      cloaca: false
    },
    // === Rat ===
    {
      type: "Rat",
      isHumanoid: true,
      isCivilized: false,
      size: "small",
      allowedSkinTones: ["brown", "black", "gray", "mottled", "pale"],
      visualProfile: {
        surface: { type: "fur", texture: ["short", "coarse", "patchy", "sleek"], sheen: "dull" }
      },
      allowedHairColors: ["none"],
      allowedEyeColors: ["black", "red", "dark brown"],
      appearanceProfile: "vermin",
      sensualProfile: {
        breasts: { description: "small, fur-covered teats" }
      },
      cloaca: false
    },
    // === Dragonborn ===
    {
      type: "Dragonborn",
      isHumanoid: true,
      isCivilized: true,
      size: "large",
      allowedSkinTones: ["deep green", "bronze", "crimson", "deep blue", "black", "gold"],
      visualProfile: {
        surface: { type: "scales", texture: ["thick", "overlapping", "glossy", "metallic"], sheen: "shiny" }
      },
      allowedHairColors: ["none"],
      allowedEyeColors: ["gold", "amber", "red", "green", "bronze", "copper"],
      appearanceProfile: "draconic",
      sensualProfile: {
        breasts: { description: "firm, draconic swells" }
      },
      cloaca: false
    },
    // === Catfolk ===
    {
      type: "Catfolk",
      isHumanoid: true,
      isCivilized: true,
      size: "medium",
      allowedSkinTones: ["tabby brown", "black", "ginger", "cream", "silver-grey", "calico", "tortoiseshell", "white", "smoky grey", "golden tabby"],
      visualProfile: {
        surface: { type: "fur", texture: ["soft", "silky", "dense", "plush", "sleek"], sheen: "softly shining" }
      },
      allowedHairColors: ["black", "ginger", "silver", "cream", "brown", "white", "golden", "charcoal"],
      allowedEyeColors: ["amber", "green", "gold", "blue", "copper", "violet", "emerald"],
      appearanceProfile: "mixed",
      sensualProfile: {
        breasts: { description: "soft, fur-dusted swells" },
        fur: { description: "silky fur that covers their body, soft to the touch" }
      },
      cloaca: false
    },
    // === Wolfkin ===
    {
      type: "Wolfkin",
      isHumanoid: true,
      isCivilized: true,
      size: "medium",
      allowedSkinTones: ["grey", "dark grey", "brown", "black", "russet", "white", "tawny", "timber-grey", "ashen grey", "snow white"],
      visualProfile: {
        surface: { type: "fur", texture: ["thick", "coarse", "shaggy", "dense", "wild"], sheen: "matte" }
      },
      allowedHairColors: ["grey", "black", "brown", "russet", "white", "tawny", "silver", "charcoal"],
      allowedEyeColors: ["amber", "yellow", "pale blue", "brown", "gold", "hazel", "copper"],
      appearanceProfile: "mixed",
      sensualProfile: {
        breasts: { description: "firm, fur-covered mounds" },
        fur: { description: "thick, wild fur that covers their body with a musky scent" }
      },
      cloaca: false
    },
    // === Satyr ===
    {
      type: "Satyr",
      isHumanoid: true,
      isCivilized: true,
      size: "medium",
      allowedSkinTones: ["tanned", "ruddy", "olive", "sun-browned", "copper", "pale freckled", "golden brown", "weathered bronze", "rosy"],
      visualProfile: {
        surface: { type: "skin", texture: ["smooth", "warm", "slightly rough", "sun-kissed"], sheen: "soft" }
      },
      allowedHairColors: ["black", "dark brown", "chestnut", "auburn", "grey", "straw", "silver", "wild blonde"],
      allowedEyeColors: ["amber", "hazel", "green", "dark brown", "gold", "twinkling blue", "mischievous violet"],
      appearanceProfile: "mixed",
      sensualProfile: {
        breasts: { description: "wiry, compact swells" },
        hooves: { description: "cloven hooves with rough, calloused soles" }
      },
      cloaca: false
    },
    // === Slime ===
    {
      type: "Slime",
      isHumanoid: false,
      isCivilized: false,
      size: "small",
      allowedSkinTones: ["emerald green", "deep blue", "fiery red", "slate grey", "swamp green", "frost blue", "crimson", "stone grey"],
      visualProfile: {
        surface: { type: "gel", texture: ["slick", "quivering", "translucent", "glistening", "cool"], sheen: "wet" }
      },
      allowedHairColors: ["none"],
      allowedEyeColors: ["none"],
      appearanceProfile: "amorphous",
      sensualProfile: {
        body: { description: "a shifting, gelatinous mass with a cool, damp touch" }
      },
      cloaca: false
    },
    // === Harefolk ===
    {
      type: "Harefolk",
      isHumanoid: true,
      isCivilized: true,
      size: "medium",
      allowedSkinTones: ["white", "cream", "sandy", "light brown", "gray", "charcoal", "chocolate", "honey", "frost-white", "dappled gray"],
      visualProfile: {
        surface: { type: "fur", texture: ["soft", "plush", "silky", "dense", "velvety"], sheen: "matte" }
      },
      allowedHairColors: ["white", "cream", "sandy", "light brown", "gray", "charcoal", "chocolate", "honey", "frost", "dappled"],
      allowedEyeColors: ["amber", "hazel", "brown", "gold", "green", "red", "pink", "violet"],
      appearanceProfile: "mammalian",
      sensualProfile: {
        body: { description: "a lithe, soft-furred body with a warm, inviting touch" },
        breasts: { description: "soft, fur-covered mounds" },
        genitals: { 
          male: { description: "a furred sheath with a smooth, velvety texture" },
          female: { description: "a furred slit with soft, plush folds" }
        }
      },
      cloaca: false
    },
    // === Ratfolk ===
    {
      type: "Ratfolk",
      isHumanoid: true,
      isCivilized: false,
      size: "small",
      allowedSkinTones: ["brown", "black", "gray", "ashen", "dusky", "rust", "sandy", "pale", "mottled", "striped"],
      visualProfile: {
        surface: { type: "fur", texture: ["short", "sleek", "coarse", "patchy", "bristly"], sheen: "matte" }
      },
      allowedHairColors: ["brown", "black", "gray", "ashen", "dusky", "rust", "sandy", "pale", "mottled", "striped"],
      allowedEyeColors: ["black", "red", "brown", "amber", "yellow", "pale", "pink"],
      appearanceProfile: "mammalian",
      sensualProfile: {
        body: { description: "a small, wiry body with short, practical fur" },
        breasts: { description: "small, compact mounds with short fur" },
        genitals: { 
          male: { description: "a small sheath with sparse, short fur" },
          female: { description: "a small, neat slit with short fur" }
        }
      },
      cloaca: false
    },
    // === Kenku ===
    {
      type: "Kenku",
      isHumanoid: true,
      isCivilized: true,
      size: "medium",
      allowedSkinTones: ["black", "dark gray", "charcoal", "soot", "midnight", "raven-black", "shiny black", "matte black"],
      visualProfile: {
        surface: { type: "feathers", texture: ["sleek", "smooth", "glossy", "soft", "downy"], sheen: "glossy" },
        // Kenku have a feather fan (not a true tail) that should be visible in rear/butt views
        tail: { has: true, type: "feather fan", description: "a long fanned feather fan that spreads dramatically when displaying or balancing", displayInRearView: true }
      },
      allowedHairColors: ["none"],
      allowedEyeColors: ["black", "dark brown", "amber", "red", "gold", "silver", "pale yellow"],
      appearanceProfile: "avian",
      sensualProfile: {
        body: { description: "a graceful, feathered body with sleek, cool skin beneath soft plumage" },
        breasts: { description: "smooth, feather-covered curves" },
        rear: { description: "a broad feathered base with a prominent fanned feather fan framing the backside" },
        genitals: { 
          male: { description: "a feathered base with smooth, sleek skin, framed by the base of the feather fan" },
          female: { description: "a smooth slit with soft feathers at the edges, the feather fan creating an elegant frame" }
        }
      },
      cloaca: false
    }
  ];

  // Expose to window for getCreatureTemplate
  if (typeof window !== "undefined") {
    window.creatureTemplates = CREATURE_TEMPLATES;
  }

  function getCreatureTemplate(type) {
    if (Array.isArray(window.creatureTemplates)) {
      const lowerType = String(type || "").toLowerCase();
      return window.creatureTemplates.find(t => String(t.type || "").toLowerCase() === lowerType) || {};
    }
    if (typeof window.getSpeciesTemplate === "function") return window.getSpeciesTemplate(type) || {};
    return {};
  }

  function pickByWeights(options) {
    const total = options.reduce((sum, o) => sum + (o.w || 0), 0);
    if (total <= 0) return options[0]?.v;
    let roll = Math.random() * total;
    for (let o of options) {
      if (roll < (o.w || 0)) return o.v;
      roll -= (o.w || 0);
    }
    return options[0]?.v;
  }

  function pickFrom(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function generatePhysicalTraits(npc) {
    if (!npc || !NSFW_SYSTEM_ENABLED) return null;
    const type = npc.species || "Unknown";
    const gender = npc.gender;
    const template = getCreatureTemplate(type) || {};
    const isHumanoid = template.isHumanoid ?? true;
    const size = template.size || "medium";
    const isCivilized = template.isCivilized === true;
    const anatomy = {};
    
    // Check if NPC is overweight from SFW anatomy
    const isOverweight = (npc.anatomy && npc.anatomy.body && npc.anatomy.body.weightClass === "overweight") || 
                       (npc.bodyType === "heavyset" || npc.bodyType === "plump");
    
    const tones = Array.isArray(template.allowedSkinTones) ? template.allowedSkinTones : ["pale", "fair", "tan", "olive", "brown", "dark"];
    const tone = pickFrom(tones);

    function deriveAreolaPigment(baseTone) {
      const darkSet = ["dark", "deep brown", "brown", "black"];
      const lightSet = ["pale", "fair", "ivory"];
      const midSet = ["tan", "olive"];
      baseTone = String(baseTone || "").toLowerCase();
      if (darkSet.includes(baseTone)) return pickFrom(["deep brown", "darkened", "rich umber"]);
      if (lightSet.includes(baseTone)) return pickFrom(["soft pink", "rosy", "peach-toned"]);
      if (midSet.includes(baseTone)) return pickFrom(["warm rose", "muted brown", "soft terracotta"]);
      return pickFrom(["softly tinted", "natural toned"]);
    }

    function deriveContrastPigment(baseTone) {
      const darkSet = ["dark", "deep brown", "brown", "black"];
      const lightSet = ["pale", "fair", "ivory"];
      const midSet = ["tan", "olive"];
      baseTone = String(baseTone || "").toLowerCase();
      if (darkSet.includes(baseTone)) return pickFrom(["slightly darker", "deepened", "richly shaded"]);
      if (lightSet.includes(baseTone)) return pickFrom(["soft pink", "rosy", "gently flushed"]);
      if (midSet.includes(baseTone)) return pickFrom(["warm toned", "softly blushed", "slightly deeper"]);
      return pickFrom(["slightly darker", "naturally toned"]);
    }

    const areolaPigment = deriveAreolaPigment(tone);
    const contrastPigment = deriveContrastPigment(tone);
    const surfaceType = template.visualProfile?.surface?.type || "skin";
    const surfaceProfile = template.visualProfile?.surface || {};
    anatomy.body = {
      color: tone,
      surfaceType: surfaceType,
      texture: Array.isArray(surfaceProfile.texture) ? pickFrom(surfaceProfile.texture) : surfaceProfile.texture || null,
      sheen: surfaceProfile.sheen || null,
      coverage: surfaceProfile.coverage || null
    };

    if ((template.appearanceProfile === "feathered") || (surfaceType === "feathers")) {
      anatomy.plumage = { color: tone, texture: pickFrom(["sleek", "glossy", "mottled"]) };
    }

    const allowedHairColors = Array.isArray(template.allowedHairColors) ? template.allowedHairColors : null;
    if (allowedHairColors?.length) {
      const hairColor = pickFrom(allowedHairColors);
      if (hairColor !== "none") {
        anatomy.hair = { color: hairColor, style: pickFrom(["short", "long", "cropped", "braided", "tied back", "loose"]) };
      }
    }

    const allowedEyeColors = Array.isArray(template.allowedEyeColors) ? template.allowedEyeColors : null;
    if (allowedEyeColors && allowedEyeColors.length) {
      const eyeColor = pickFrom(allowedEyeColors);
      anatomy.eyes = { color: eyeColor, description: eyeColor, status: [], health: 100 };
    }

    // Overweight NPCs have a prominent belly/paunch
    if (isOverweight && isHumanoid) {
      const g = String(gender || "").toLowerCase();
      const bellyDesc = g === "female" 
        ? pickFrom(["a soft, rounded belly", "a gently curved midsection", "a full, comfortable belly"])
        : pickFrom(["a prominent paunch", "a rounded, fleshy belly", "a thick, soft gut", "a substantial midsection"]);
      anatomy.belly = { 
        sizeCategory: "large", 
        description: bellyDesc,
        status: [], 
        health: 100,
        softness: pickFrom(["soft", "very soft", " yielding"])
      };
    }

    if (isHumanoid && gender && gender !== "none" && gender !== "undefined") {
      const g = String(gender).toLowerCase();
      const hipSize = isOverweight ? pickFrom(["wide", "very wide"]) : pickFrom(["narrow", "average", "wide"]);
      anatomy.hips = { sizeCategory: hipSize, description: hipSize, status: [], health: 100 };
      
      // Overweight NPCs get larger, softer buttocks
      const buttockSize = isOverweight ? pickFrom(["large", "very large"]) : pickFrom(["small", "medium", "large"]);
      let buttockDesc = buttockSize;
      if (isOverweight) {
        buttockDesc = buttockSize.replace("very ", "") + " and soft";
        if (g === "female") {
          buttockDesc = "full and round, " + buttockDesc;
        } else {
          buttockDesc = "broad and fleshy, " + buttockDesc;
        }
      }
      anatomy.buttocks = { sizeCategory: buttockSize, description: buttockDesc, status: [], health: 100 };

      let breastSize = "flat";
      let breastDescription = "a flat, toned chest";
      if (g === "female") {
        // Overweight females have larger, droopier breasts
        if (isOverweight) {
          breastSize = pickFrom(["large", "very large"]); // Overweight females always have large+ breasts
          if (breastSize === "large") {
            breastDescription = pickFrom([
              "large, drooping breasts",
              "heavy, pendulous breasts",
              "full, sagging breasts",
              "ample, soft breasts with a gentle droop"
            ]);
          } else {
            breastDescription = pickFrom([
              "very large, heavy pendulous breasts",
              "massive, drooping breasts",
              "generous, full breasts that sag noticeably",
              "abundant, soft breasts with a pronounced droop"
            ]);
          }
        } else {
          // Normal breast size distribution
          breastSize = pickFrom(["small", "medium", "medium", "large"]); // 25% small, 50% medium, 25% large
          if (breastSize === "small") breastDescription = "small, perky breasts";
          else if (breastSize === "medium") breastDescription = "a modest bust";
          else if (breastSize === "large") breastDescription = "generous, full breasts";
        }
      }
      anatomy.breasts = {
        sizeCategory: breastSize,
        description: breastDescription,
        status: [],
        health: 100,
        fluids: [],
        nipples: { size: pickFrom(["small", "average", "prominent"]), texture: pickFrom(["smooth", "softly raised", "slightly raised"]) },
        areolas: { size: pickFrom(["small", "average", "wide"]), pigmentation: areolaPigment }
      };

      if (template.sensualProfile?.breasts) {
        const tb = template.sensualProfile.breasts;
        anatomy.breasts.description = tb.description || anatomy.breasts.description;
        if (tb.size) anatomy.breasts.sizeCategory = tb.size;
        if (tb.nipples) anatomy.breasts.nipples = { size: tb.nipples.size || anatomy.breasts.nipples.size, color: tb.nipples.color || null, texture: tb.nipples.texture || anatomy.breasts.nipples.texture };
        if (tb.areolas) anatomy.breasts.areolas = { size: tb.areolas.size || anatomy.breasts.areolas.size, pigmentation: tb.areolas.color || areolaPigment, texture: tb.areolas.texture || null };
      }

      // Genital size tied to creature size
      // Small creatures (goblin, halfling, dwarf) tend to have smaller genitals
      // Large creatures (orc) tend to have larger genitals
      let genitalSizeCategory;
      if (size === "tiny" || size === "small") {
        genitalSizeCategory = pickFrom(["small", "small", "medium"]); // 66% small, 33% medium
      } else if (size === "large") {
        genitalSizeCategory = pickFrom(["medium", "large", "large"]); // 33% medium, 66% large
      } else {
        genitalSizeCategory = pickFrom(["small", "medium", "medium", "large"]); // balanced for medium
      }
      anatomy.genitalSize = { sizeCategory: genitalSizeCategory, description: "natural proportions", status: [], health: 100 };
      
      // Also set explicit penis/vagina size for consistency
      // Use the same genitalSizeCategory but create separate properties for clarity
      if (g === "male" || g === "herm") {
        anatomy.penis = { sizeCategory: genitalSizeCategory, description: "natural size" };
      }
      if (g === "female" || g === "herm") {
        anatomy.vagina = { sizeCategory: genitalSizeCategory, description: "natural size" };
      }

      // Pubic hair - only generated for skin-covered creatures. Furred,
      // scaled, feathered or chitinous surfaces have no distinct groin hair
      // (their anatomy.body coverage already describes that surface), so the
      // key is simply omitted from the profile - reference code only ever
      // includes what the profile contains, and never invents it.
      // For skin-covered species: civilized species have 40% chance of
      // trimmed hair and no perianal hair; non-civilized always have
      // unkept/messy hair.
      if (surfaceType === "skin") {
        let pubicHairStyle, pubicHairDescription, hasPerianalHair;

        if (isCivilized) {
          // 40% chance of trimmed/groomed, 60% chance of natural/thick
          const isTrimmed = Math.random() < 0.4;
          if (isTrimmed) {
            pubicHairStyle = pickFrom(["smooth", "neatly trimmed", "closely cropped"]);
            hasPerianalHair = false;
          } else {
            pubicHairStyle = pickFrom(["natural", "thick", "full"]);
            hasPerianalHair = true;
          }
        } else {
          // Non-civilized: always unkept/messy
          pubicHairStyle = pickFrom(["a messy natural", "a unkept and thick", "a long thick and wild", "a tangled thicket of", "an untamed growth of"]);
          hasPerianalHair = true;
        }

        let pubicHairColor = pickFrom(["dark", "brown", "black", "blonde", "auburn", "grey"]);
        pubicHairDescription = pubicHairStyle === "smooth" ? "smooth and bare" : pubicHairStyle + " " + pubicHairColor + " hair";

        anatomy.pubicHair = {
          style: pubicHairStyle,
          color: pubicHairColor,
          description: pubicHairDescription,
          hasPerianalHair: hasPerianalHair,
          status: [],
          health: 100
        };
      }
      
      // Add natural scents based on civilization and species
      // Civilized: subtle, clean scents; Non-civilized: strong, pungent, animalistic
      let scentDescription;
      if (isCivilized) {
        scentDescription = pickFrom([
          "a clean, fresh musk",
          "a subtle floral note",
          "a warm, soapy scent",
          "a light natural aroma",
          "a soft, intimate fragrance",
          "a faint hint of oil or perfume",
          "a barely-there musk",
          "a gentle, warm scent"
        ]);
      } else {
        // Non-civilized creatures have stronger, more primal scents
        if (type.toLowerCase().includes("goblin") || type.toLowerCase().includes("orc")) {
          scentDescription = pickFrom([
            "a pungent, animalistic musk",
            "a strong, earthy scent",
            "a sharp, feral aroma",
            "a deep, musky smell",
            "a robust, primal fragrance",
            "a potent, natural musk",
            "a wild, unwashed scent",
            "an intense, animal odor"
          ]);
        } else if (type.toLowerCase().includes("skeleton")) {
          scentDescription = pickFrom([
            "a musty, ancient odor",
            "a dry, bone-dust scent",
            "a faint, crypt-like aroma",
            "a cold, stone-like smell",
            "a trace of old incense and dust"
          ]);
        } else if (type.toLowerCase().includes("ghost")) {
          scentDescription = pickFrom([
            "a faint, ethereal aroma",
            "a cool, mist-like scent",
            "a trace of old perfumes",
            "a barely-perceptible chill",
            "the scent of memory and decay"
          ]);
        } else if (type.toLowerCase().includes("rat")) {
          scentDescription = pickFrom([
            "a sharp, animal musk",
            "a pungent, rodent scent",
            "a strong, earthy smell",
            "a nest-like aroma",
            "a fur-and-dirt fragrance"
          ]);
        } else {
          scentDescription = pickFrom([
            "a pungent, natural musk",
            "a strong, earthy scent",
            "a deep, animalistic aroma",
            "a robust, unwashed smell",
            "a primal, untamed fragrance"
          ]);
        }
      }
      anatomy.scent = { description: scentDescription, intensity: isCivilized ? "subtle" : "strong" };

      // Use proper genital names with descriptive size terms
      let genitalDescription = "featureless";
      const hasCloaca = template.cloaca === true;
      if (hasCloaca) {
        // Reptilian-kin have a single cloacal vent. Males house a hemipenis
        // within it; females present the vent itself. Size scales the hemipenis.
        if (g === "male") {
          const gs = anatomy.genitalSize.sizeCategory;
          if (gs === "medium") {
            genitalDescription = "hemipenis housed in a cloacal vent";
          } else if (gs === "large") {
            genitalDescription = "girthy hemipenis housed in a cloacal vent";
          } else if (gs === "small") {
            genitalDescription = "slender hemipenis housed in a cloacal vent";
          }
        } else if (g === "female") {
          genitalDescription = "cloacal vent";
        }
      } else if (g === "male") {
        const gs = anatomy.genitalSize.sizeCategory;
        if (gs === "medium") {
          genitalDescription = "penis";
        } else if (gs === "large") {
          genitalDescription = "girthy penis";
        } else if (gs === "small") {
          genitalDescription = "small penis";
        }
      } else if (g === "female") {
        const gs = anatomy.genitalSize.sizeCategory;
        if (gs === "medium") {
          genitalDescription = "vagina";
        } else if (gs === "large") {
          genitalDescription = "meaty vagina";
        } else if (gs === "small") {
          genitalDescription = "small vagina";
        }
      }
      anatomy.genitals = { description: genitalDescription, pigmentation: contrastPigment, status: [], health: 100 };

      // Anal orifice size tied to creature size
      // Small creatures have tight/snug, large creatures have loose/gaping/stretchy
      let analSizeDescription;
      if (size === "tiny") {
        analSizeDescription = pickFrom(["tight", "snug"]);
      } else if (size === "small") {
        analSizeDescription = pickFrom(["snug", "tight", "firm"]);
      } else if (size === "medium") {
        analSizeDescription = pickFrom(["firm", "snug", "supple"]);
      } else if (size === "large") {
        analSizeDescription = pickFrom(["loose", "gaping", "stretchy"]);
      } else {
        analSizeDescription = pickFrom(["tight", "snug", "firm", "supple", "loose"]);
      }

      if (hasCloaca) {
        // The cloaca doubles as the anal opening; describe the vent rather
        // than a separate anus so narration stays anatomically consistent.
        anatomy.anus = {
          description: analSizeDescription + " cloacal vent",
          size: analSizeDescription,
          sphincter: pickFrom(["tight", "snug", "firm", "supple", "responsive"]),
          pigmentation: contrastPigment,
          status: [],
          health: 100
        };
      } else {
        // Add sphincter description to anus with size-based descriptors
        anatomy.anus = {
          description: analSizeDescription + " anus",
          size: analSizeDescription,
          sphincter: pickFrom(["tight", "snug", "firm", "supple", "responsive"]),
          pigmentation: contrastPigment,
          status: [],
          health: 100
        };
      }
    }

    const bodyweight = pickFrom(["skinny", "smoothly built", "muscular", "chubby", "overweight"]);
    return { anatomy: anatomy, size: size, bodyweight: bodyweight };
  }

  // Helper: Find nearest room of specific types (BFS)
  function findNearestRoomOfTypes(startCoords, types) {
    const visited = new Set();
    const queue = [{ coords: startCoords, distance: 0 }];
    const typeSet = new Set(types.map(t => t.toLowerCase()));

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current.coords)) continue;
      visited.add(current.coords);

      const room = window.G.roomMap[current.coords];
      if (room && typeSet.has((room.type || "").toLowerCase())) {
        return room;
      }

      if (room?.exits) {
        Object.values(room.exits).forEach(exit => {
          if (exit?.key && !visited.has(exit.key)) {
            queue.push({ coords: exit.key, distance: current.distance + 1 });
          }
        });
      }
    }
    return null;
  }

  function applyInquiryResponse(npc, option, responseText, affirmativeFromCache) {
    if (!npc || !option || !option.isInquiry) return responseText;

    // Ensure responseText is a string (waitForConversationReply can return
    // the cached reply object in some code paths)
    if (responseText && typeof responseText === "object" && responseText.text !== undefined) {
      if (affirmativeFromCache === undefined && responseText.affirmative !== undefined) {
        affirmativeFromCache = responseText.affirmative;
      }
      responseText = responseText.text || "";
    }
    responseText = String(responseText || "");

    console.log("[NSFW Inquiry] applyInquiryResponse called:", {
      optionId: option.id,
      affirmativeFromCache: affirmativeFromCache,
      responseTextStart: responseText.substring(0, 60)
    });

    // Use explicit affirmative field if provided (from cached reply object)
    let isAccepted = affirmativeFromCache === true;
    let isRejected = affirmativeFromCache === false;

    // Fallback: parse from text if affirmative was not explicitly provided.
    // NOTE: when affirmativeFromCache is undefined, both isAccepted and
    // isRejected are false (not undefined), so check for that case.
    if (affirmativeFromCache === undefined) {
        // Check if the AI reply with affirmative has arrived in the cache
        // since the engine started processing (timing race — the engine's
        // waitForConversationReply may have timed out before the AI responded,
        // using a fallback text string, but the real reply may now be cached).
        if (npc && npc.memory && npc.memory.cachedReplies && option.id) {
            var cachedReply = npc.memory.cachedReplies[option.id];
            if (cachedReply && typeof cachedReply === "object" && cachedReply.affirmative !== undefined) {
                affirmativeFromCache = cachedReply.affirmative;
                isAccepted = affirmativeFromCache === true;
                isRejected = affirmativeFromCache === false;
                console.log("[NSFW Inquiry] Recovered affirmative from cache:", affirmativeFromCache);
            }
        }
    }

    // If still undefined, try parsing from text markers
    if (affirmativeFromCache === undefined) {
        const acceptedMatch = responseText.match(/\[ACCEPTED\]\s+(.*)/s);
        const rejectedMatch = responseText.match(/\[REJECTED\]\s+(.*)/s);
        if (acceptedMatch) {
            isAccepted = true;
            responseText = acceptedMatch[1];
        } else if (rejectedMatch) {
            isRejected = true;
            responseText = rejectedMatch[1];
        }
    }

    // If affirmative is still unknown and this is seduce, check
    // the runtime cache directly as a last resort (the reply may have arrived
    // between the engine's fallback and this function call).
    if (affirmativeFromCache === undefined && !isAccepted && !isRejected &&
        option.id === "seduce") {
        if (typeof runtimeConversationState !== "undefined" && runtimeConversationState.replyCache) {
            for (var key in runtimeConversationState.replyCache) {
                var cached = runtimeConversationState.replyCache[key];
                if (cached && typeof cached === "object" && cached.affirmative === true &&
                    key.indexOf(option.id) !== -1) {
                    isAccepted = true;
                    console.log("[NSFW Inquiry] Recovered affirmative from runtime cache for", option.id);
                    break;
                }
            }
        }
    }

    // ── STAT-BASED FALLBACK ACCEPTANCE ───────────────────────────
    // If the AI hasn't returned an affirmative (not cached, timed out,
    // or unavailable), fall back to NPC stats to decide acceptance.
    // This ensures seduce can succeed without AI.
    if (!isAccepted && !isRejected && affirmativeFromCache === undefined &&
        option.id === "seduce") {
        var _favor = (npc.memory && typeof npc.memory.favorability === "number") ? npc.memory.favorability : 0;
        var _attraction = (npc.memory && typeof npc.memory.attraction === "number") ? npc.memory.attraction : 0;
        var _lust = (npc.memory && typeof npc.memory.lust === "number") ? npc.memory.lust : 0;
        var _temperament = String(npc.temperament || "").toLowerCase();
        var _isBold = _temperament === "forward" || _temperament === "bold" || _temperament === "lustful";

        // Seduce accepts if favor >= 20 or attraction >= 15 or lust >= 20
        // Bold NPCs get a -10 threshold reduction
        var _threshold = 20;
        var _attrThreshold = 15;
        var _lustThreshold = 20;
        if (_isBold) { _threshold -= 10; _attrThreshold -= 10; _lustThreshold -= 10; }

        if (_favor >= _threshold || _attraction >= _attrThreshold || _lust >= _lustThreshold) {
            isAccepted = true;
            console.log("[NSFW Inquiry] Stat-based fallback ACCEPT for", option.id,
                "(favor=" + _favor + ", attraction=" + _attraction + ", lust=" + _lust + ", bold=" + _isBold + ")");
        } else {
            isRejected = true;
            console.log("[NSFW Inquiry] Stat-based fallback REJECT for", option.id,
                "(favor=" + _favor + ", attraction=" + _attraction + ", lust=" + _lust + ")");
        }
    }

    // Process acceptance
    if (isAccepted) {
      if (option.onAccept) {
        applyRelationshipImpacts(npc, option.onAccept);
      }
      if (typeof addToParty === "function") {
        addToParty(npc);
      }

      // Clear any existing meetup state before setting up new one
      if (option.id === "seduce") {
        // Mark that this NPC has responded positively to a seduce,
        // which unlocks the "Ask them to follow you" session-follower option.
        npc._seductionAccepted = true;
        delete npc._meetupArrived;
        delete npc._meetupReturnTurn;
        delete npc._meetupLocation;
        delete npc._meetupRoomType;
        delete npc._meetupRoomName;
        delete npc._originalLocation;
        delete npc._pendingSeductionDestination;
        delete npc._pendingSeductionOption;
      }

      // Handle routing for seduce
      if (option.id === "seduce") {
        // Check if we're already in a suitable meetup location (tavern/inn)
        const currentRoom = window.G && window.G.activeRoom;
        const isAlreadySuitable = currentRoom &&
          ["Tavern", "Inn", "Inn Common"].some(t => currentRoom.type && currentRoom.type.includes(t));

        console.log("[NSFW Routing] option=" + option.id, {
          roomType: currentRoom ? currentRoom.type : "none",
          isAlreadySuitable: isAlreadySuitable,
          startEncounter: option.startEncounter,
          creaturesCount: currentRoom && currentRoom.creatures ? currentRoom.creatures.length : 0
        });

        // If already in suitable location, start intimacy encounter directly
        if (option.startEncounter && isAlreadySuitable) {
          console.log("[NSFW Routing] → DIRECT INTIMACY (already in suitable location)");
          // Clear pending state
          delete npc._pendingSeductionDestination;
          delete npc._pendingSeductionOption;

          // Start intimacy encounter immediately
          setTimeout(() => {
            if (typeof window.startIntimacyEncounter === "function") {
              console.log("[NSFW Routing] startIntimacyEncounter found, calling it");
              window.startIntimacyEncounter(npc, window.G.player);
              if (typeof window.renderIntimacyActionMenu === "function") {
                window.renderIntimacyActionMenu(npc);
              }
            } else {
              console.error("[NSFW] startIntimacyEncounter not available — intimacy-system.js may have failed to load.");
            }
          }, 100);
          return responseText;
        }

        const isForward = npc.temperament === "forward" || npc.temperament === "bold";
        const startCoords = window.G.player.coords;
        const targetRoom = findNearestRoomOfTypes(startCoords, ["Tavern", "Inn", "Inn Common"]);

        console.log("[NSFW Routing] targetRoom search:", {
          isForward: isForward,
          foundRoom: targetRoom ? (targetRoom.type + " @ " + targetRoom.coords) : "NONE"
        });

        if (targetRoom) {
          if (isForward && typeof window.teleportPlayerToCoords === "function") {
            setTimeout(() => {
              window.teleportPlayerToCoords(targetRoom.coords);
            }, 100);
            // Mark that NPC is at meetup location for immediate follow-up
            npc._meetupArrived = true;
            npc._meetupLocation = targetRoom.coords;
            npc._meetupRoomName = targetRoom.displayName || targetRoom.type;
            console.log("[NSFW Routing] → FORWARD TELEPORT to", targetRoom.coords);
            return responseText + ` ${npc.name} takes your hand. "Follow me to the ${targetRoom.displayName || targetRoom.type}."`;
          } else {
            npc._pendingSeductionDestination = targetRoom.coords;
            npc._pendingSeductionOption = option.id;

            const homeRoomName = targetRoom.displayName || targetRoom.type;
            console.log("[NSFW Routing] → FOLLOW SUGGESTION registered for", homeRoomName);
            const followOption = {
              id: "follow-seduction-suggestion",
              label: `Go with ${npc.name} to the ${homeRoomName}`,
              text: `You agree to go with ${npc.name} to the ${homeRoomName}.`,
              priority: 5,
              action: function(selectedNPC) {
                if (selectedNPC._pendingSeductionDestination && typeof window.teleportPlayerToCoords === "function") {
                  const dest = selectedNPC._pendingSeductionDestination;
                  window.teleportPlayerToCoords(dest);
                  // Mark NPC as at meetup location after player follows
                  selectedNPC._meetupArrived = true;
                  selectedNPC._meetupLocation = dest;
                  selectedNPC._meetupRoomName = homeRoomName;
                  delete selectedNPC._pendingSeductionDestination;
                  delete selectedNPC._pendingSeductionOption;
                }
              }
            };

            if (!window.NPC_CONVERSATION_CATALOGUE.some(o => o.id === followOption.id)) {
              window.NPC_CONVERSATION_CATALOGUE.push(followOption);
            }

            return responseText + ` ${npc.name} suggests going to the ${targetRoom.displayName || targetRoom.type}.`;
          }
        } else {
          // Fallback: No suitable room found, NPC states the issue
          console.log("[NSFW Routing] → FALLBACK (no target room found)");
          // Clear any pending destination so player can choose
          delete npc._pendingSeductionDestination;
          delete npc._pendingSeductionOption;

          // For seduce: NPC agrees to meet later at a specific location
          const meetupRoom = findNearestRoomOfTypes(startCoords, ["Tavern", "Inn", "Inn Common"]);

          if (meetupRoom) {
            // Store original location so NPC can return if player doesn't meet
            // Use _homeCoords if available, otherwise use startCoords
            npc._originalLocation = npc._homeCoords || startCoords;

            // Store meetup info on NPC
            npc._meetupLocation = meetupRoom.coords;
            npc._meetupRoomType = meetupRoom.type || "Inn";
            npc._meetupRoomName = meetupRoom.displayName || meetupRoom.type;

            // Set trigger: meet after 2 turns
            npc._meetupTriggerTurn = (window.G.story && typeof window.G.story.turnCounter === "number" 
                ? window.G.story.turnCounter + 2 
                : 2);

            // Set return trigger: if not met after 12 more turns, return to home
            npc._meetupReturnTurn = npc._meetupTriggerTurn + 12;

            return responseText + ` ${npc.name} agrees - you will meet at the ${meetupRoom.displayName || meetupRoom.type} in a little while.`;
          } else {
            // No meetup location found at all
            return responseText + ` ${npc.name} agrees, and the two of you settle on finding a good spot later.`;
          }
        }
      }

      console.log("[NSFW] Inquiry ACCEPTED for " + (option.id || "unknown"));
      return responseText;
    }
    
    // Process rejection
    if (isRejected) {
      if (option.onReject) {
        applyRelationshipImpacts(npc, option.onReject);
      }
      console.log("[NSFW] Inquiry REJECTED for " + (option.id || "unknown"));
      return responseText;
    }
    
    // No affirmative/rejected determination - return original
    return responseText;
    return responseText;
  }

  function applyRelationshipImpacts(npc, impacts) {
    if (!npc || !impacts) return;
    if (impacts.lust) applyLustImpact(npc, impacts.lust);
    if (impacts.attraction) applyAttractionImpact(npc, impacts.attraction);
    if (impacts.hostility) {
      // Hostility lives directly on the NPC (the engine's own pipeline).
      npc.hostility = Math.max(0, Math.min(100, (npc.hostility || 0) + impacts.hostility));
    }
  }

  function handleMealDateInteraction(npc, option) {
    if (!npc || !option) return false;
    
    // Check if this is a meetup NPC at their meetup location
    const isMeetupActive = npc._meetupArrived && npc._meetupLocation && 
                          window.G && window.G.player && window.G.player.coords === npc._meetupLocation;
    
    if (!isMeetupActive) return false;
    
    // Handle meal-related options
    if (option.id === "split-bill") {
      applyRelationshipImpacts(npc, { lust: +1, attraction: +2 });
      if (typeof window.addChatMessage === "function") {
        const npcName = npc.name || "They";
        window.addChatMessage("left", npcName, `"That's fair. I appreciate you not assuming." She smiles and takes a sip of her drink.`);
      }
      // Mark meal as completed
      npc._mealShared = true;
      return true;
    }
    
    if (option.id === "pay-for-meal") {
      applyRelationshipImpacts(npc, { lust: +3, attraction: +4 });
      if (typeof window.addChatMessage === "function") {
        const npcName = npc.name || "They";
        window.addChatMessage("left", npcName, `"You didn't have to... but thank you." She looks at you with renewed interest.`);
      }
      npc._mealShared = true;
      npc._playerPaid = true;
      return true;
    }
    
    if (option.id === "small-talk") {
      applyRelationshipImpacts(npc, { lust: +2, attraction: +1 });
      if (typeof window.addChatMessage === "function") {
        const npcName = npc.name || "They";
        const topics = [
          `"The food here is excellent, don't you think?" She takes a bite and watches you.`,
          `"I don't usually do this... meeting someone like this." She seems genuinely curious about you.`,
          `"You're different from most people I meet. In a good way." She leans in slightly.`,
          `"I've been meaning to try this place. Good choice." She smiles warmly.`
        ];
        window.addChatMessage("left", npcName, topics[Math.floor(Math.random() * topics.length)]);
      }
      return true;
    }
    
    return false;
  }

  // Helper to check if room offers food
  function isFoodLocation(room) {
    if (!room) return false;
    const foodTypes = ["Inn", "Tavern", "Inn Common", "Kitchen", "Dining", "Restaurant", "Bar", "Taproom"];
    const roomType = (room.type || room.displayName || "").toLowerCase();
    const roomRole = (room.role || "").toLowerCase();
    return foodTypes.some(t => roomType.includes(t.toLowerCase()) || roomRole.includes(t.toLowerCase()));
  }

  // ── EARLY WINDOW EXPOSURE ─────────────────────────────────────
  // Expose critical functions to window immediately (not waiting for
  // initNSFWSystem, which defers until window.G exists). The engine's
  // npcRespond calls window.applyInquiryResponse for inquiry options
  // (seduce), and it may run before initNSFWSystem completes.
  window.applyInquiryResponse = applyInquiryResponse;
  window.isPrivateLocation = (typeof isPrivateLocation === "function") ? isPrivateLocation : function(room) {
    // Inline fallback so this works even if intimacy-data-context.js hasn't
    // loaded yet (shouldn't happen, but keeps the function self-contained).
    if (!room) return false;
    var privateTypes = ["Guest Room", "Home", "Inn Common", "Inn", "Bedroom", "Private Chamber", "Tavern Room", "Cellar", "Vault", "Dark Alleyway", "Abandoned Armory", "Forgotten Shrine", "Crumbling Tower", "Great Cavern", "Stone Vault", "Underground Hallway", "Underground Gate", "Passage", "Corridor", "Tunnel", "Dungeon Chamber"];
    var t = (room.type || "").toLowerCase();
    var n = (room.displayName || room.name || "").toLowerCase();
    return privateTypes.some(function(p) { return t.includes(p.toLowerCase()) || n.includes(p.toLowerCase()); });
  };

  function injectMeetupConversationOptions() {
    console.log("[NSFW System] Injecting meetup conversation options");
    const meetupOptions = [
      {
        id: "split-bill",
        label: "Suggest splitting the bill",
        text: "You suggest sharing the cost of the meal equally.",
        priority: 30,
        conditions: {
          custom: function(npc, ctx) {
            // Only show in food locations
            if (!isFoodLocation(ctx && ctx.room)) return false;
            
            // Allow at meetup location OR when NPC followed player to private location
            const atMeetup = npc && npc._meetupArrived && ctx && 
                           ctx.room && ctx.room.coords === npc._meetupLocation &&
                           !npc._mealShared;
            const followedToPrivate = npc && npc._pendingSeductionOption === "follow-player" && ctx && ctx.room;
            return atMeetup || followedToPrivate;
          }
        },
        relationshipImpact: { lust: +1, attraction: +2 }
      },
      {
        id: "pay-for-meal",
        label: "Offer to pay for the meal",
        text: "You offer to cover the entire cost of the meal.",
        priority: 30,
        conditions: {
          custom: function(npc, ctx) {
            // Only show in food locations
            if (!isFoodLocation(ctx && ctx.room)) return false;
            
            // Allow at meetup location OR when NPC followed player to private location
            const atMeetup = npc && npc._meetupArrived && ctx && 
                           ctx.room && ctx.room.coords === npc._meetupLocation &&
                           !npc._mealShared;
            const followedToPrivate = npc && npc._pendingSeductionOption === "follow-player" && ctx && ctx.room;
            return atMeetup || followedToPrivate;
          }
        },
        relationshipImpact: { lust: +3, attraction: +4 }
      },
      {
        id: "small-talk",
        label: "Engage in small talk",
        text: "You make light conversation while sharing the meal.",
        priority: 30,
        conditions: {
          custom: function(npc, ctx) {
            // Only show in food locations
            if (!isFoodLocation(ctx && ctx.room)) return false;
            
            // Allow at meetup location with meal shared OR when NPC followed player to private location
            const atMeetup = npc && npc._meetupArrived && ctx && 
                           ctx.room && ctx.room.coords === npc._meetupLocation &&
                           npc._mealShared;
            const followedToPrivate = npc && npc._pendingSeductionOption === "follow-player" && ctx && ctx.room;
            return atMeetup || followedToPrivate;
          }
        },
        relationshipImpact: { lust: +2, attraction: +1 },
        repeat: "always"
      }
    ];
    
    meetupOptions.forEach(option => {
      const existingIndex = window.NPC_CONVERSATION_CATALOGUE.findIndex(o => o.id === option.id);
      if (existingIndex >= 0) {
        window.NPC_CONVERSATION_CATALOGUE[existingIndex] = option;
      } else {
        window.NPC_CONVERSATION_CATALOGUE.push(option);
      }
    });

    // ── Session-follower options ──────────────────────────────────
    // Become available after a successful seduce (gated by the
    // npc._seductionAccepted flag set in applyInquiryResponse). "Ask them to
    // follow you" makes the NPC trail the player for the current session only
    // (G.sessionFollowers is in-memory; not persisted by saveGameState). The
    // follow/unfollow pair is mutually exclusive via the sessionFollowers
    // membership check. nsfw:true + phase:1 lets these pass the NSFW query
    // wrapper's date-context and phase-2 filters (same as flirt/seduce);
    // the custom condition still gates them on
    // _seductionAccepted and sessionFollowers membership. relationshipImpact
    // must be a truthy object so the chooseChatOption wrapper reaches the
    // option.action() call (see extendChooseChatOption); an empty object
    // applies no lust/attraction change.
    const followerOptions = [
      {
        id: "ask-to-follow",
        label: function(npc) { return "Ask " + (npc && npc.name ? npc.name : "them") + " to follow you"; },
        text: function(npc) { return "You ask " + (npc && npc.name ? npc.name : "them") + " to come along with you."; },
        promptText: function(npc) { return "You ask " + (npc && npc.name ? npc.name : "them") + " to come along with you on your travels."; },
        priority: 22,
        phase: 1,
        nsfw: true,
        conditions: {
          custom: function(npc, ctx) {
            if (!npc) return false;
            var followers = (window.G && window.G.sessionFollowers) || [];
            return !followers.includes(npc);
          }
        },
        relationshipImpact: {},
        action: function(npc) {
          // An earlier suggested-destination (follow-seduction-suggestion)
          // is moot once the NPC follows the player instead; clear it so
          // the query wrapper does not keep applying date-context filtering.
          delete npc._pendingSeductionDestination;
          delete npc._pendingSeductionOption;
          if (typeof window.addSessionFollower === "function") {
            window.addSessionFollower(npc);
          }
          // Show confirmation message
          if (typeof window.addChatMessage === "function") {
            var _name = npc && npc.name ? npc.name : "They";
            window.addChatMessage("left", _name, "Alright, I'll come with you.", { mode: "auto" });
          }
        }
      },
      {
        id: "stop-following",
        label: function(npc) { return "Ask " + (npc && npc.name ? npc.name : "them") + " to stop following"; },
        text: function(npc) { return "You tell " + (npc && npc.name ? npc.name : "them") + " they needn't follow you anymore."; },
        promptText: function(npc) { return "You tell " + (npc && npc.name ? npc.name : "them") + " they needn't follow you anymore."; },
        priority: 22,
        phase: 1,
        nsfw: true,
        conditions: {
          custom: function(npc, ctx) {
            if (!npc) return false;
            var followers = (window.G && window.G.sessionFollowers) || [];
            return followers.includes(npc);
          }
        },
        relationshipImpact: {},
        action: function(npc) {
          if (typeof window.removeSessionFollower === "function") {
            window.removeSessionFollower(npc);
          }
          // No longer following — drop the follow-player marker so the
          // meal options' followedToPrivate gate does not stay satisfied.
          if (npc && npc._pendingSeductionOption === "follow-player") {
            delete npc._pendingSeductionOption;
          }
          // Show confirmation message
          if (typeof window.addChatMessage === "function") {
            var _name = npc && npc.name ? npc.name : "They";
            window.addChatMessage("left", _name, "Alright, I'll stay here then.", { mode: "auto" });
          }
        }
      }
    ];

    followerOptions.forEach(option => {
      const existingIndex = window.NPC_CONVERSATION_CATALOGUE.findIndex(o => o.id === option.id);
      if (existingIndex >= 0) {
        window.NPC_CONVERSATION_CATALOGUE[existingIndex] = option;
      } else {
        window.NPC_CONVERSATION_CATALOGUE.push(option);
      }
    });

  }

  function extendChooseChatOption() {
    if (typeof window.chooseChatOption !== "function") {
      console.warn("[NSFW System] chooseChatOption not found, retrying...");
      setTimeout(extendChooseChatOption, 1000);
      return;
    }
    // Don't double-wrap
    if (window.chooseChatOption._nsfwWrapped) return;

    const orig = window.chooseChatOption;
    window.chooseChatOption = function(option) {
      const result = orig.apply(this, arguments);
      const npc = window.G.activeNPC;
      if (!npc || !option.relationshipImpact) return result;
      
      // Log NSFW actions for debugging - only for specific NSFW option IDs
      if (option.id === "seduce" || option.id === "split-bill" || option.id === "pay-for-meal" || option.id === "small-talk") {
        console.log("[NSFW] Action:", option.id, "with", npc.name);
      }
      
      const envMod = getEnvironmentalModifier(window.G.activeRoom);
      if (option.relationshipImpact.lust) applyLustImpact(npc, option.relationshipImpact.lust, envMod);
      if (option.relationshipImpact.attraction) applyAttractionImpact(npc, option.relationshipImpact.attraction);
      // Skip if the engine already fired the action itself (it does this for
      // options whose action is a function, e.g. ask-to-follow/stop-following,
      // because the chat buttons bypass this wrapper on Perchance).
      if (option.action && typeof option.action === "function" && !option.__actionFired) {
        console.log("[NSFW Wrapper] Firing action for option:", option.id, "with NPC:", npc.name);
        option.action(npc);
      }
      
      // Handle meal date interaction
      const handled = handleMealDateInteraction(npc, option);
      
      // Clear meetup flags only if this is a non-date action (player is leaving the date context)
      // Date actions (split-bill, pay-for-meal, small-talk, flirt) should NOT clear the flags
      const dateActions = ["split-bill", "pay-for-meal", "small-talk", "flirt", "seduce"];
      if (npc._meetupArrived && !dateActions.includes(option.id)) {
        delete npc._meetupArrived;
        delete npc._meetupReturnTurn;
        delete npc._meetupLocation;
        delete npc._meetupRoomType;
        delete npc._meetupRoomName;
        delete npc._originalLocation;
      }
      
      return result;
    };
    window.chooseChatOption._nsfwWrapped = true;
  }

  // Expose so the engine can re-apply the wrapper after it overwrites
  // window.chooseChatOption (the engine loads after the nsfw system).
  window._nsfwWrapChooseChatOption = extendChooseChatOption;
  console.log("[BODY-DEBUG] IIFE reached line ~1084 (_nsfwWrapChooseChatOption assigned)");

  function extendAdvanceStoryTurn() {
    if (typeof window.advanceStoryTurn !== "function") {
      console.warn("[NSFW System] advanceStoryTurn not found, retrying...");
      setTimeout(extendAdvanceStoryTurn, 1000);
      return;
    }
    const orig = window.advanceStoryTurn;
    window.advanceStoryTurn = function(steps = 1) {
      const result = orig.apply(this, arguments);
      if (window.G.story && window.G.story.turnCounter % 10 === 0) {
        Object.values(window.G.roomMap || {}).flatMap(function(r) { return r.creatures || []; }).forEach(function(npc) {
          if (npc && npc.memory) {
            npc.memory.lust = Math.max(0, (npc.memory.lust || 0) - 1);
            if (window.G.story.turnCounter % 20 === 0) {
              // Decay the earned share (not just the total) so the next
              // recomputeNPCAttraction doesn't restore what decayed away.
              npc.memory.attractionEarned = Math.max(0, (npc.memory.attractionEarned || 0) - 0.5);
              npc.memory.attraction = Math.max(0, (npc.memory.attraction || 0) - 0.5);
            }
            
            // Handle delayed seduction meetups
            if (npc._meetupTriggerTurn && window.G.story.turnCounter >= npc._meetupTriggerTurn) {
              const currentRoom = window.G.roomMap[npc._meetupLocation];
              if (currentRoom && typeof teleportNPC === "function") {
                // Teleport NPC to meetup location
                teleportNPC(npc, npc._meetupLocation);
                
                // Notify player
                if (typeof window.addGameMessage === "function") {
                  window.addGameMessage("info", `${npc.name} is now waiting at the ${npc._meetupRoomName || npc._meetupRoomType}.`);
                } else if (typeof window.setNarration === "function") {
                  window.setNarration(`${npc.name} is now waiting at the ${npc._meetupRoomName || npc._meetupRoomType}.`);
                }
                
                // Mark that NPC has arrived at meetup
                npc._meetupArrived = true;
              }
              // Clean up the trigger but keep other info for return check
              delete npc._meetupTriggerTurn;
            }
            
            // Handle return if player doesn't meet: after 12 turns at meetup, return to home
            if (npc._meetupArrived && npc._meetupReturnTurn && window.G.story.turnCounter >= npc._meetupReturnTurn) {
              // Determine where to return: use _homeCoords if available, otherwise _originalLocation
              const returnLocation = npc._homeCoords || npc._originalLocation;
              if (typeof teleportNPC === "function" && returnLocation) {
                teleportNPC(npc, returnLocation);
                
                // Notify player
                if (typeof window.addGameMessage === "function") {
                  window.addGameMessage("info", `${npc.name} grew tired of waiting and returned home.`);
                } else if (typeof window.setNarration === "function") {
                  window.setNarration(`${npc.name} grew tired of waiting and returned home.`);
                }
              }
              // Clean up all meetup flags
              delete npc._meetupArrived;
              delete npc._meetupReturnTurn;
              delete npc._meetupLocation;
              delete npc._meetupRoomType;
              delete npc._meetupRoomName;
              delete npc._originalLocation;
            }
          }
        });
      }
      return result;
    };
  }

  // Teleport an NPC to a new room
  function teleportNPC(npc, targetCoords) {
    if (!npc || !targetCoords || !window.G || !window.G.roomMap) return false;
    
    const targetRoom = window.G.roomMap[targetCoords];
    if (!targetRoom) return false;
    
    // Remove NPC from current room - search all rooms if _currentRoomCoords not set
    if (npc._currentRoomCoords && window.G.roomMap[npc._currentRoomCoords]) {
      const currentRoom = window.G.roomMap[npc._currentRoomCoords];
      if (currentRoom && currentRoom.creatures) {
        currentRoom.creatures = currentRoom.creatures.filter(c => c !== npc);
      }
    } else {
      // Search all rooms to find where this NPC currently is
      Object.values(window.G.roomMap).forEach(room => {
        if (room && room.creatures) {
          const index = room.creatures.indexOf(npc);
          if (index >= 0) {
            room.creatures.splice(index, 1);
          }
        }
      });
    }
    
    // Add NPC to target room
    if (!targetRoom.creatures) targetRoom.creatures = [];
    if (!targetRoom.creatures.includes(npc)) {
      targetRoom.creatures.push(npc);
    }
    
    // Update NPC's location tracking
    npc._currentRoomCoords = targetCoords;
    if (typeof npc.coords !== "undefined") {
      npc.coords = targetCoords;
    }

    // Arriving in the room the player occupies: a lusty NPC who walks in on
    // a bound or unconscious victim may take their chance in full view
    // (live-witnessed free use). Party/follower moves never qualify — the
    // actor checks in nsfwFreeUseOnNpcArrival exclude them.
    if (window.G && targetRoom === window.G.activeRoom &&
        typeof window.nsfwFreeUseOnNpcArrival === "function") {
      window.nsfwFreeUseOnNpcArrival(npc, targetRoom);
    }

    return true;
  }

  function initNSFWSystem() {
    console.log("[NSFW System] initNSFWSystem called");
    console.log("[NSFW System] Initializing NSFW system...");
    if (!window.G) {
      setTimeout(initNSFWSystem, 1000);
      return;
    }
    window.ensureNPCRelationshipState = ensureNPCRelationshipState;
    window.generatePhysicalTraits = generatePhysicalTraits;
    window.applyInquiryResponse = applyInquiryResponse;
    window.teleportNPC = teleportNPC;
    // NSFW options already injected at script load time
    injectMeetupConversationOptions();
    extendChooseChatOption();
    
    // Setup query catalogue wrapper - try multiple times to ensure original function is captured
    function setupQueryWrapper() {
      console.log("[NSFW System] setupQueryWrapper: queryConversationCatalogue type =", typeof window.queryConversationCatalogue, ", NPC_CONVERSATION_CATALOGUE type =", typeof window.NPC_CONVERSATION_CATALOGUE);
      if (typeof window.queryConversationCatalogue === "function" && 
          typeof window.NPC_CONVERSATION_CATALOGUE !== "undefined") {
        console.log("[NSFW System] Both catalogue and function available, setting up wrapper");
        const originalQueryConversationCatalogue = window.queryConversationCatalogue;
        window.queryConversationCatalogue = function(npc, context) {
        console.log("[NSFW System] Wrapper function called with NPC:", npc ? npc.name || npc.id : "null");
        const allOptions = window.NPC_CONVERSATION_CATALOGUE || [];
        console.log("[NSFW System] Wrapper: allOptions length:", allOptions.length);
        
        // First, apply original filtering (e.g., greeting gate) if it exists
        let filteredOptions = allOptions;
        if (typeof originalQueryConversationCatalogue === "function") {
          console.log("[NSFW System] Wrapper: calling original query function");
          filteredOptions = originalQueryConversationCatalogue(npc, context) || allOptions;
        }
        
        // Check if we're in a date/meetup context (primary indicator)
        const isAtMeetup = npc && npc._meetupArrived && context && context.room && 
                          context.room.coords === npc._meetupLocation;
        
        // Check if there's a pending seduction that needs follow-up (show follow option only)
        // "follow-player" (set by ask-npc-to-follow) means the NPC already
        // agreed and is actively following — it is not a pending decision.
        // Counting it here would lock every later conversation with the NPC
        // into date-only filtering (only Flirt/Say Goodbye survive).
        const hasPendingSeduction = npc && !npc._meetupArrived &&
                                   (npc._pendingSeductionDestination ||
                                    (npc._pendingSeductionOption && npc._pendingSeductionOption !== "follow-player"));
        
        // Check if intimacy encounter is active
        const isIntimacyActive = npc && npc.intimacy && npc.intimacy.encounter && npc.intimacy.encounter.active;
        
        // Check if we're in a Phase 2 context (private location, alone with target, intimacy not active)
        const isPhase2Context = (() => {
          if (!npc || !context || !context.room) {
            if (npc && npc.name) console.log(`[DEBUG] Phase 2 check: ${npc.name} - Missing context or room`);
            return false;
          }
          if (isIntimacyActive) {
            if (npc && npc.name) console.log(`[DEBUG] Phase 2 check: ${npc.name} - Intimacy already active`);
            return false;
          }
          
          // Check private location
          const room = context.room;
          const roomType = room.type || room.displayName || "unknown";
          const isPrivate = (typeof isPrivateLocation === "function" && isPrivateLocation(room)) ||
                           (room.type && ["Guest Room", "Inn", "Inn Common", "Bedroom", "Cellar", "Dark Alleyway", "Vault", "Chamber", "Tower", "Home"].some(t => room.type.includes(t))) ||
                           (room.displayName && room.displayName.toLowerCase().includes("room"));
          if (!isPrivate) {
            if (npc && npc.name) console.log(`[DEBUG] Phase 2 check: ${npc.name} - NOT private (room: ${roomType})`);
            return false;
          }
          
          // Check alone with target
          if (!room.creatures) {
            if (npc && npc.name) console.log(`[DEBUG] Phase 2 check: ${npc.name} - no creatures array`);
            return false;
          }
          if (room.creatures.length === 0) {
            if (npc && npc.name) console.log(`[DEBUG] Phase 2 check: ${npc.name} - empty creatures array`);
            return true; // If no creatures, then we're alone
          }
          let othersPresent = 0;
          const creaturesList = [];
          for (const creature of room.creatures) {
            if (creature.isPlayer) { creaturesList.push("Player"); continue; }
            if (creature === npc) { creaturesList.push("NPC"); continue; }
            if (creature.isHumanoid || creature.humanoid) {
              othersPresent++;
              creaturesList.push(creature.name || creature.type || "Unknown");
            }
          }
          const result = othersPresent === 0;
          
          // Debug logging
          if (npc && npc.name) {
            console.log(`[DEBUG] Phase 2 context for ${npc.name}: private=${isPrivate}, alone=${result} (othersPresent=${othersPresent}, creatures=${creaturesList.join(", ")}, room=${roomType})`);
          }
          
          return result;
        })();
        
        const isDateContext = isAtMeetup || hasPendingSeduction;
        
        // Debug logging for context detection
        if (npc && npc.name) {
          console.log(`[DEBUG] NSFW Context for ${npc.name}: isIntimacyActive=${isIntimacyActive}, isPhase2Context=${isPhase2Context}, isDateContext=${isDateContext}`);
          if (context && context.room) {
            const roomType = context.room.type || context.room.displayName || "unknown";
            console.log(`[DEBUG] Room info: type="${roomType}", creatures=${context.room.creatures ? context.room.creatures.length : 'none'}`);
          }
          if (isAtMeetup) console.log(`[DEBUG] At meetup location: ${npc._meetupLocation}`);
          if (hasPendingSeduction) console.log(`[DEBUG] Has pending seduction: ${npc._pendingSeductionOption}`);
        }
        
        // If intimacy encounter is active, only show intimacy-related options.
        // Keep the greeting options as well: the greeting gate in the
        // original query only opens after a greeting is picked, so dropping
        // them here left "Say goodbye" as the ONLY option and locked the NPC
        // out of all conversation for the rest of the session.
        if (isIntimacyActive) {
          const intimacyOptionIds = ["goodbye"]; // Only allow exiting
          return filteredOptions.filter(option => 
            intimacyOptionIds.includes(option.id) ||
            option.action === "intimacy" ||
            option.intent === "greeting" ||
            option.id === "greet-intro" ||
            option.id === "greet-known"
          );
        }
        
        // If in date context, filter to only show date-related and flirting actions
        // Check this BEFORE Phase 2 so date context takes precedence
        if (isDateContext) {
          const dateOptionIds = ["split-bill", "pay-for-meal", "small-talk", "flirt", 
                                 "follow-seduction-suggestion", "goodbye",
                                 "touch_intimately", "start_intimacy"];
          const filtered = filteredOptions.filter(option => 
            dateOptionIds.includes(option.id) || 
            (option.nsfw === true) ||  // Keep other NSFW options
            (option.tags && option.tags.includes("date")) ||
            (option.phase === 2 && (option.startEncounter === true || option.action !== "intimacy")) ||
            (option.intent === "greeting") ||  // Include greeting options
            (option.id === "greet-intro") ||  // Include specific greeting options
            (option.id === "greet-known")
          );
          if (npc && npc.name) {
            console.log(`[DEBUG] Date filtering applied for ${npc.name}. Options:`, filtered.map(o => o.id));
          }
          return filtered;
        }
        
        // If in Phase 2 context (private location, alone with target), include NSFW options
        if (isPhase2Context) {
          const nsfwOptionIds = ["goodbye", "disengage", "step-away"];
          const phase1NsfwIds = ["flirt", "seduce"];
          const filtered = filteredOptions.filter(option => {
            // Include exit options
            if (nsfwOptionIds.includes(option.id)) return true;
            // Include Phase 2 options
            if (option.phase === 2) return true;
            // Include intimacy actions that start an encounter (transition actions only)
            if (option.action === "intimacy" && option.startEncounter === true) return true;
            // Include Phase 1 NSFW options (pre-intimacy conversation options)
            if (option.phase === 1 && option.nsfw === true) return true;
            if (phase1NsfwIds.includes(option.id)) return true;
            // Exclude non-NSFW Phase 1 options
            if (option.phase === 1) return false;
            // Keep base catalogue social options (no phase field) available in
            // private contexts. Dropping them here removed every topic AND the
            // greeting options, leaving only "goodbye" — and because the
            // greeting gate in queryConversationCatalogue never cleared
            // without a greeting option to click, topics stayed hidden for
            // the entire session.
            if (option.phase === undefined) return true;
            return false;
          });
          if (npc && npc.name) {
            console.log(`[DEBUG] Phase 2 filtering applied for ${npc.name}. Options:`, filtered.map(o => ({id: o.id, phase: o.phase, action: o.action})));
            console.log(`[DEBUG] Phase 2 options available:`, filtered.filter(o => o.phase === 2).map(o => o.id));
          }
          return filtered;
        }
        
        if (npc && npc.name) {
          console.log(`[DEBUG] No NSFW filtering applied for ${npc.name}. Options:`, filteredOptions.map(o => o.id));
        }
        
        return filteredOptions;
      };
      // Setup completed successfully
      console.log("[NSFW System] Query catalogue wrapper installed");
      return true;
    }

    // Close setupQueryWrapper: without this brace the retry/call block below
    // becomes a recursive self-call inside its own body, initNSFWSystem never
    // closes where it should, and the whole init path (teleportNPC exposure,
    // meetup/follower option injection, query wrapper install) never runs.
    }

    // Try to setup the wrapper, retry if not ready
    const wrapperSuccess = setupQueryWrapper();
    if (!wrapperSuccess) {
      console.log("[NSFW System] Query catalogue not ready, will retry every second...");
      const retrySetup = setInterval(() => {
        if (setupQueryWrapper()) {
          console.log("[NSFW System] Query catalogue wrapper successfully installed after retry");
          clearInterval(retrySetup);
        }
      }, 1000);
    } else {
      console.log("[NSFW System] Query catalogue wrapper installed immediately");
    }
    
    extendAdvanceStoryTurn();
    if (typeof window.createNPC === "function") {
      const orig = window.createNPC;
      window.createNPC = function(species, room, zoneTemplate, options) {
        if (options === void 0) options = {};
        const npc = orig(species, room, zoneTemplate, options);
        ensureNPCRelationshipState(npc);
        if (NSFW_SYSTEM_ENABLED) {
          const nsfwTraits = generatePhysicalTraits(npc);
          if (nsfwTraits) npc.nsfwTraits = nsfwTraits;
        }
        return npc;
      };
    }
    console.log("[NSFW System] Initialized with passive stats and physical traits and meetup date options");
  }

  // === Unconscious body interactions (kiss / reposition) ===================
  // The SFW engine's renderRoomObjectActionMenu() renders the standard body
  // buttons (Examine / Search / Try to wake / Finish off / Leave) with direct
  // function references, then calls window.appendUnconsciousBodyActions (see
  // bottom of this IIFE) to append the NSFW-only Kiss / Position / Oral /
  // Penetrate / Spit groups. nsfwRenderBodyMenu() (below) re-renders the whole
  // menu after an NSFW action by delegating back to renderRoomObjectActionMenu.
  // Narration is AI-polished via the same ai() path the intimacy system uses:
  // a background ai() call refines the plain template, and only the polished
  // text is printed — a dimmed placeholder ("Looking closer..." / "...")
  // stands in the log while the polish is in flight (see
  // polishBodyNarration / polishBodyExamine, which fall back to the plain
  // template if the polish fails).

  function nsfwGetEntityName(item) {
    return typeof window.getEntityName === "function"
      ? window.getEntityName(item)
      : (item && (item.name || item.originalName) || "the body");
  }

  // Re-render the full body menu after an NSFW body action. The SFW engine's
  // renderRoomObjectActionMenu renders the standard buttons (Examine, Search,
  // Wake, etc.) with direct function references, then calls
  // window.appendUnconsciousBodyActions (below) to append the NSFW groups.
  // No recursion: renderRoomObjectActionMenu no longer delegates back here.
  function nsfwRenderBodyMenu(item) {
    if (typeof window.renderRoomObjectActionMenu === "function") {
      window.renderRoomObjectActionMenu(item);
    }
  }

  function appendUnconsciousBodyGroups(item, el) {
    if (!item || !el) return;
    nsfwEnsureBodyTraits(item);

    // Clothing state: which garments still block the body. A bottom that
    // has been lowered (item.bodyLowered — pulled down to the thighs, still
    // worn) no longer blocks lower-body access.
    var upperWorn = nsfwBodySlotPresent(item, "upper");
    var lowerWorn = nsfwBodySlotPresent(item, "lower");
    var lowerLowered = lowerWorn && !!item.bodyLowered;

    // Clothing group — the only group shown while clothing is still in the
    // way. Remove works the garment off into the player's inventory; Tear
    // rips it off, leaving a ruined, unwearable scrap on the room floor;
    // Lower bottoms pulls the bottom down to the thighs for access without
    // full undressing.
    var clothingButtons = [];
    if (upperWorn) {
      clothingButtons.push(window.createCombatButton("Remove top", () => removeBodyGarment(item, "upper")));
      clothingButtons.push(window.createCombatButton("Tear top", () => tearBodyGarment(item, "upper")));
    }
    if (lowerWorn) {
      clothingButtons.push(window.createCombatButton("Remove bottom", () => removeBodyGarment(item, "lower")));
      clothingButtons.push(window.createCombatButton("Tear bottom", () => tearBodyGarment(item, "lower")));
      if (!lowerLowered) {
        clothingButtons.push(window.createCombatButton("Lower bottom", () => lowerBodyGarment(item)));
      }
    }
    if (clothingButtons.length) {
      window.appendCombatGroup(el, "Clothing", clothingButtons);
    }

    // While any garment still blocks the body (a worn top, or a bottom that
    // is neither removed/torn nor lowered), no NSFW action groups render.
    if (upperWorn || (lowerWorn && !lowerLowered)) return;

    // Kiss group (clothing is out of the way by this point)
    window.appendCombatGroup(el, "Kiss", [
      window.createCombatButton("Kiss mouth", () => kissUnconsciousBody(item, "mouth")),
      window.createCombatButton("Kiss cheek", () => kissUnconsciousBody(item, "cheek"))
    ]);

    // Position group
    const currentPos = item.bodyPosition || "back";
    const positions = [
      { key: "back", label: "Roll onto back" },
      { key: "side", label: "Roll onto side" },
      { key: "face", label: "Roll onto face" }
    ];
    window.appendCombatGroup(el, "Position", positions.map(p =>
      window.createCombatButton(p.label, () => rollUnconsciousBody(item, p.key), {
        disabled: currentPos === p.key
      })
    ));

    // Touch group — hands and mouth on bare flesh (foreplay)
    var touchButtons = [];
    var touchGenitalType = nsfwBodyGenitalType(item);
    var touchHasAnus = nsfwBodyHasAnus(item);
    if (nsfwBodyHasBreasts(item) && nsfwRegionExposed(item, "breasts")) {
      touchButtons.push(window.createCombatButton("Grope breasts", () => gropeUnconsciousBody(item)));
      touchButtons.push(window.createCombatButton("Lick nipples", () => lickUnconsciousBody(item, "nipples")));
    }
    if (touchGenitalType === "vagina" && nsfwRegionExposed(item, "genitals")) {
      touchButtons.push(window.createCombatButton("Lick vagina", () => lickUnconsciousBody(item, "vagina")));
    } else if ((touchGenitalType === "cloaca-vent" || touchGenitalType === "cloaca-penis") && nsfwRegionExposed(item, "genitals")) {
      touchButtons.push(window.createCombatButton("Lick cloacal vent", () => lickUnconsciousBody(item, "cloaca")));
    }
    if (touchHasAnus && nsfwRegionExposed(item, "anus")) {
      touchButtons.push(window.createCombatButton("Lick anus", () => lickUnconsciousBody(item, "anus")));
    }
    if (touchButtons.length) {
      window.appendCombatGroup(el, "Touch", touchButtons);
    }

    // Grind group — the player's own genitals against the body's bare
    // genitals. Female players get the explicit f/f tribadism option;
    // non-binary players get the generic grind (no cock assumption).
    var grindButtons = [];
    var playerAnatomy = nsfwPlayerAnatomy();
    if (nsfwRegionExposed(item, "genitals")) {
      if (playerAnatomy === "vagina" && touchGenitalType === "vagina") {
        grindButtons.push(window.createCombatButton("Grind pussies", () => grindBody(item, "pussy")));
      }
      if (playerAnatomy === "both") {
        grindButtons.push(window.createCombatButton("Grind against them", () => grindBody(item, "generic")));
      }
    }
    if (grindButtons.length) {
      window.appendCombatGroup(el, "Grind", grindButtons);
    }

    // Ride face group — sit on the unconscious face, open to every
    // anatomy: penis players get their ass rimmed, vagina players choose
    // pussy or ass, non-binary players get their genitals serviced
    // (generic wording). Requires the body on its back, mouth accessible.
    var faceButtons = [];
    if ((item.bodyPosition || "back") === "back" && nsfwRegionExposed(item, "mouth")) {
      if (playerAnatomy === "penis") {
        faceButtons.push(window.createCombatButton("Sit on their face (get rimmed)", () => rideFaceBody(item, "rim")));
      } else if (playerAnatomy === "vagina") {
        faceButtons.push(window.createCombatButton("Ride their face (your pussy)", () => rideFaceBody(item, "pussy")));
        faceButtons.push(window.createCombatButton("Sit on their face (get rimmed)", () => rideFaceBody(item, "rim")));
      } else if (playerAnatomy === "both") {
        faceButtons.push(window.createCombatButton("Ride their face", () => rideFaceBody(item, "generic")));
      }
    }
    if (faceButtons.length) {
      window.appendCombatGroup(el, "Ride face", faceButtons);
    }

    // Oral group — player must have a penis; mouth accessible (not face-down).
    // Once entered, the button becomes a continuation thrust so the entry
    // narration is not repeated.
    if (nsfwPlayerHasPenis() && nsfwRegionExposed(item, "mouth")) {
      var oralButtons = [
        item.mouthUsed
          ? window.createCombatButton("Continue (their mouth)", () => thrustBody(item, "mouth"))
          : window.createCombatButton("Fuck mouth", () => fuckUnconsciousMouth(item))
      ];
      oralButtons.push(window.createCombatButton("Force deep (throat)", () => deepthroatBody(item)));
      window.appendCombatGroup(el, "Oral", oralButtons);
    }

    // Penetrate group — finger and/or penis, gated by anatomy + exposure
    var penButtons = [];
    var genitalType = nsfwBodyGenitalType(item);
    var hasAnus = nsfwBodyHasAnus(item);
    var isCloaca = genitalType === "cloaca-vent" || genitalType === "cloaca-penis";

    // Finger: vagina or cloacal vent (exposed on back/side, lower garment gone)
    if (genitalType === "vagina" && nsfwRegionExposed(item, "genitals")) {
      penButtons.push(window.createCombatButton("Finger vagina", () => fingerBody(item, "vagina")));
    } else if (isCloaca && nsfwRegionExposed(item, "genitals")) {
      penButtons.push(window.createCombatButton("Finger cloacal vent", () => fingerBody(item, "cloaca")));
    }

    // Finger: anus (exposed on side/face, lower garment gone)
    if (hasAnus && nsfwRegionExposed(item, "anus")) {
      penButtons.push(window.createCombatButton("Finger anus", () => fingerBody(item, "anus")));
    }

    // Penis insertion (player must have penis). Once a hole is entered, its
    // button becomes a continuation thrust so the entry narration is told
    // once per hole instead of on every click.
    if (nsfwPlayerHasPenis()) {
      if (genitalType === "vagina" && nsfwRegionExposed(item, "genitals")) {
        penButtons.push(item.penetratedTarget === "vagina"
          ? window.createCombatButton("Continue (their vagina)", () => thrustBody(item, "vagina"))
          : window.createCombatButton("Penetrate vagina", () => penetrateBody(item, "vagina")));
      } else if (isCloaca && nsfwRegionExposed(item, "genitals")) {
        penButtons.push(item.penetratedTarget === "cloaca"
          ? window.createCombatButton("Continue (their cloaca)", () => thrustBody(item, "cloaca"))
          : window.createCombatButton("Penetrate cloaca", () => penetrateBody(item, "cloaca")));
      }
      if (hasAnus && nsfwRegionExposed(item, "anus")) {
        penButtons.push(item.penetratedTarget === "anus"
          ? window.createCombatButton("Continue (their anus)", () => thrustBody(item, "anus"))
          : window.createCombatButton("Penetrate anus", () => penetrateBody(item, "anus")));
      }
    }

    // Generic penetration (non-binary, "both" anatomy): the player's sex
    // enters without the narration ever assuming a cock. Shares the
    // penetratedTarget state so continuation and climax read the same.
    if (playerAnatomy === "both") {
      if (genitalType === "vagina" && nsfwRegionExposed(item, "genitals")) {
        penButtons.push(item.penetratedTarget === "vagina"
          ? window.createCombatButton("Continue (their vagina)", () => thrustBodyGeneric(item, "vagina"))
          : window.createCombatButton("Penetrate vagina", () => penetrateBodyGeneric(item, "vagina")));
      } else if (isCloaca && nsfwRegionExposed(item, "genitals")) {
        penButtons.push(item.penetratedTarget === "cloaca"
          ? window.createCombatButton("Continue (their cloaca)", () => thrustBodyGeneric(item, "cloaca"))
          : window.createCombatButton("Penetrate cloaca", () => penetrateBodyGeneric(item, "cloaca")));
      }
      if (hasAnus && nsfwRegionExposed(item, "anus")) {
        penButtons.push(item.penetratedTarget === "anus"
          ? window.createCombatButton("Continue (their anus)", () => thrustBodyGeneric(item, "anus"))
          : window.createCombatButton("Penetrate anus", () => penetrateBodyGeneric(item, "anus")));
      }
    }

    if (penButtons.length) {
      window.appendCombatGroup(el, "Penetrate", penButtons);
    }

    // Their cock group — the body's own reflex-hardened cock. Stroking is
    // available to any player; mounting/riding to vagina and non-binary
    // ("both") players (penis players use the Penetrate/Climax groups).
    if (genitalType === "penis" && nsfwRegionExposed(item, "genitals")) {
      var cockButtons = [];
      cockButtons.push(window.createCombatButton(
        item.bodyCockStiff ? "Stroke their stiff cock" : "Stroke their cock",
        () => strokeBodyCock(item)
      ));
      if (playerAnatomy !== "penis") {
        if (item.bodyRidden) {
          cockButtons.push(window.createCombatButton("Ride their cock", () => rideBodyCock(item)));
          cockButtons.push(window.createCombatButton("Climax (riding)", () => riderClimaxBody(item)));
        } else {
          cockButtons.push(window.createCombatButton("Mount their cock", () => rideBodyCock(item), {
            disabled: !item.bodyCockStiff
          }));
        }
      }
      window.appendCombatGroup(el, "Their cock", cockButtons);
    }

    // Pull out group — withdraw from a hole the player is inside. This is
    // the only route to the withdrawal narration: the aftermath of an
    // internal ejaculation (the load dripping back out) and the anal gape
    // scenes play here, not on the climax beats.
    if (nsfwPlayerHasPenis()) {
      var pullOutButtons = [];
      if ((item.penetratedTarget === "vagina" || item.penetratedTarget === "cloaca") && nsfwRegionExposed(item, "genitals")) {
        pullOutButtons.push(window.createCombatButton(
          "Pull out (" + (nsfwGenitalLabel(item) || item.penetratedTarget) + ")",
          () => pullOutBody(item, item.penetratedTarget)
        ));
      } else if (item.penetratedTarget === "anus" && nsfwRegionExposed(item, "anus")) {
        pullOutButtons.push(window.createCombatButton("Pull out (anus)", () => pullOutBody(item, "anus")));
      }
      if (item.mouthUsed && nsfwRegionExposed(item, "mouth")) {
        pullOutButtons.push(window.createCombatButton("Pull out (mouth)", () => pullOutBody(item, "mouth")));
      }
      if (pullOutButtons.length) {
        window.appendCombatGroup(el, "Pull out", pullOutButtons);
      }
    }

    // Climax group — surfaced once the player is inside one or more holes.
    // Lists a finish button for every hole currently in use and still
    // accessible in this pose.
    if (nsfwPlayerHasPenis()) {
      var climaxButtons = [];
      if (item.penetratedTarget === "vagina" && nsfwRegionExposed(item, "genitals")) {
        climaxButtons.push(window.createCombatButton("Finish inside (vagina)", () => climaxBody(item, "vagina")));
      } else if (item.penetratedTarget === "cloaca" && nsfwRegionExposed(item, "genitals")) {
        climaxButtons.push(window.createCombatButton("Finish inside (" + (nsfwGenitalLabel(item) || "cloaca") + ")", () => climaxBody(item, "cloaca")));
      }
      if (item.penetratedTarget === "anus" && nsfwRegionExposed(item, "anus")) {
        climaxButtons.push(window.createCombatButton("Finish inside (anus)", () => climaxBody(item, "anus")));
      }
      if (item.mouthUsed && nsfwRegionExposed(item, "mouth")) {
        climaxButtons.push(window.createCombatButton("Finish inside (mouth)", () => climaxBody(item, "mouth")));
      }
      if (climaxButtons.length) {
        window.appendCombatGroup(el, "Climax", climaxButtons);
      }
    }

    // Generic climax — non-binary ("both") players finish inside without
    // cock or ejaculation wording (no load or smell marks are recorded).
    if (playerAnatomy === "both") {
      var genericClimaxButtons = [];
      if (item.penetratedTarget === "vagina" && nsfwRegionExposed(item, "genitals")) {
        genericClimaxButtons.push(window.createCombatButton("Finish inside (vagina)", () => climaxBodyGeneric(item, "vagina")));
      } else if (item.penetratedTarget === "cloaca" && nsfwRegionExposed(item, "genitals")) {
        genericClimaxButtons.push(window.createCombatButton("Finish inside (" + (nsfwGenitalLabel(item) || "cloaca") + ")", () => climaxBodyGeneric(item, "cloaca")));
      }
      if (item.penetratedTarget === "anus" && nsfwRegionExposed(item, "anus")) {
        genericClimaxButtons.push(window.createCombatButton("Finish inside (anus)", () => climaxBodyGeneric(item, "anus")));
      }
      if (genericClimaxButtons.length) {
        window.appendCombatGroup(el, "Climax", genericClimaxButtons);
      }
    }

    // Finish on them — external climax for penis players. Works with no
    // penetration (masturbating over the body) or as a pull-out finish
    // while inside a hole.
    if (nsfwPlayerHasPenis()) {
      var finishOnButtons = [];
      if (nsfwRegionExposed(item, "mouth")) {
        finishOnButtons.push(window.createCombatButton("Finish on face", () => finishOnBody(item, "face")));
      }
      if (nsfwRegionExposed(item, "breasts")) {
        finishOnButtons.push(window.createCombatButton("Finish on chest", () => finishOnBody(item, "chest")));
      }
      if ((item.bodyPosition || "back") !== "face" && !nsfwBodySlotPresent(item, "upper")) {
        finishOnButtons.push(window.createCombatButton("Finish on stomach", () => finishOnBody(item, "stomach")));
      }
      if (genitalType && nsfwRegionExposed(item, "genitals")) {
        finishOnButtons.push(window.createCombatButton("Finish on genitals", () => finishOnBody(item, "genitals")));
      }
      if (finishOnButtons.length) {
        window.appendCombatGroup(el, "Finish on them", finishOnButtons);
      }
    }

    // Spit group — target-dependent exposure gating
    var spitButtons = [];
    if (nsfwRegionExposed(item, "mouth")) {
      spitButtons.push(window.createCombatButton("Spit on face", () => spitOnBody(item, "mouth")));
    }
    if (nsfwBodyHasBreasts(item) && nsfwRegionExposed(item, "breasts")) {
      spitButtons.push(window.createCombatButton("Spit on breasts", () => spitOnBody(item, "breasts")));
    }
    if (genitalType && nsfwRegionExposed(item, "genitals")) {
      var genLabel = nsfwGenitalLabel(item);
      spitButtons.push(window.createCombatButton("Spit on " + genLabel, () => spitOnBody(item, "genitals")));
    }
    if (hasAnus && nsfwRegionExposed(item, "anus")) {
      spitButtons.push(window.createCombatButton("Spit on anus", () => spitOnBody(item, "anus")));
    }
    if (spitButtons.length) {
      window.appendCombatGroup(el, "Spit", spitButtons);
    }

    // Care group — dried loads (bodyUse) and smell notes NEVER fade on their
    // own (see getBodyUseDescriptor in intimacy-system.js: wet -> tacky ->
    // crusted, permanent), so wiping the body down is the only reset.
    var hasDriedLoads = !!(item.bodyUse && Object.keys(item.bodyUse).some(function (part) {
      return item.bodyUse[part] && item.bodyUse[part].loadKey;
    }));
    var hasSmellNotes = !!(Array.isArray(item.smellNotes) && item.smellNotes.length);
    if (hasDriedLoads || hasSmellNotes) {
      window.appendCombatGroup(el, "Care", [
        window.createCombatButton("Clean them up", () => cleanUpBody(item))
      ]);
    }
  }

  // Wipe the body down with water and a rag: clears dried bodyUse loads and
  // lingering smell notes. This is the only way those reset - time alone
  // just dries them crusty.
  function cleanUpBody(item) {
    if (!item || item.bodyState !== "unconscious") return;
    const name = nsfwGetEntityName(item);
    delete item.bodyUse;
    delete item.smellNotes;
    const baseText = `You fetch water and a rag and wipe ${name}'s limp body down, scrubbing off every dried, crusted trace of what was done to them. By the time you finish they lie clean and unmarked, as if none of it had ever happened.`;
    const actionDesc = "clean up";
    polishBodyNarration(item, actionDesc, baseText);
    window.rememberStoryEvent("care", `${window.G.player.name} cleaned and wiped down ${name}'s unconscious body.`, 2);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // ── AI narration polish ─────────────────────────────────────────
  // Builds a prompt for polishing an unconscious-body action narration.
  // Modeled on buildPlayerNarrativePrompt() from intimacy-system.js but
  // tailored for body interactions rather than sex acts.
  // ── Act-type context for unconscious body actions ────────────
  // Each act type carries:
  //   - difficulty: procedural framing for how the one-sided act physically
  //     plays out against a limp, uncooperative body
  //   - involuntary: the ONLY responses the NPC can show — reflexive physical
  //     reactions, never conscious participation or speech
  //   - anatomyKeys: nsfwTraits.anatomy keys to inject into the prompt for
  //     act-relevant body detail

  console.log("[BODY-DEBUG] IIFE before BODY_ACT_CONTEXT (line ~1525)");
  var BODY_ACT_CONTEXT = {
    "fuck mouth": {
      label: "oral penetration (unconscious)",
      difficulty: "The NPC's jaw hangs slack and unresisting. Their throat is relaxed but offers no cooperation — the player must hold their head and guide the angle themselves. Without a conscious swallowing reflex, saliva pools and drools from their slack mouth. Teeth may scrape if the angle isn't managed.",
      involuntary: "Reflexive only: a gag reflex if pushed deep, drooling from the slack mouth, shallow breathing through the nose, an occasional involuntary swallow. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals"]
    },
    "finger vagina": {
      label: "vaginal fingering (unconscious)",
      difficulty: "The NPC's legs are limp and must be spread manually. The body offers no cooperation — the player parts the thighs and positions the hips themselves. The canal may be dry without arousal, making entry stiff.",
      involuntary: "Reflexive only: a clench around the finger, a slight hip twitch, possible involuntary lubrication from prolonged stimulation. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "vagina", "pubicHair"]
    },
    "finger cloacal vent": {
      label: "cloacal fingering (unconscious)",
      difficulty: "The NPC's legs are limp and must be spread manually. The cloacal vent is a single muscular opening — tight and unyielding without conscious relaxation. The player must work it open slowly.",
      involuntary: "Reflexive only: a vent clench, a slight hip twitch. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "anus"]
    },
    "finger anus": {
      label: "anal fingering (unconscious)",
      difficulty: "The NPC is unconscious and cannot relax the sphincter voluntarily. The anal ring is tight and resistant — the player must work it open slowly with patience. Penetration is awkward and uncooperative.",
      involuntary: "Reflexive only: a sphincter clench, body tension, a flinch. No awareness, no conscious reaction.",
      anatomyKeys: ["anus"]
    },
    "penetrate vagina": {
      label: "vaginal penetration (unconscious)",
      difficulty: "The NPC's legs are limp and must be spread manually. The body offers no cooperation — the player parts the thighs and positions the hips themselves. Entry may be difficult and stiff without natural lubrication.",
      involuntary: "Reflexive only: a clench around the shaft, a slight hip twitch, possible involuntary lubrication from prolonged stimulation. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "vagina", "pubicHair"]
    },
    "penetrate cloaca": {
      label: "cloacal penetration (unconscious)",
      difficulty: "The NPC's legs are limp and must be spread manually. The cloacal vent is a single muscular opening — tight and unyielding without conscious relaxation. The player must work their way in slowly.",
      involuntary: "Reflexive only: a vent clench around the shaft, a slight hip twitch. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "anus"]
    },
    "penetrate anus": {
      label: "anal penetration (unconscious)",
      difficulty: "The NPC is unconscious and cannot relax the sphincter voluntarily. The anal ring is tight and resistant — the player must force it open slowly. Penetration is awkward and requires patience; the body tenses reflexively against entry.",
      involuntary: "Reflexive only: a sphincter clench, body tension, a flinch. No awareness, no conscious reaction.",
      anatomyKeys: ["anus"]
    },
    "thrust mouth": {
      label: "continued oral sex (unconscious)",
      difficulty: "The player is already inside the NPC's mouth. The jaw stays slack; the player controls depth and pace entirely, holding the head. Without a swallow reflex, drool runs freely.",
      involuntary: "Reflexive only: gagging when pushed deep, drooling, an occasional involuntary swallow, shallow nasal breathing. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals"]
    },
    "thrust vagina": {
      label: "continued vaginal sex (unconscious)",
      difficulty: "The player is already inside. The limp hips rock passively with each drive; the body offers no rhythm of its own and must be held in place.",
      involuntary: "Reflexive only: irregular flutters and clenches around the shaft, a faint hip twitch, possible involuntary lubrication from prolonged stimulation. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "vagina", "pubicHair"]
    },
    "thrust cloaca": {
      label: "continued cloacal sex (unconscious)",
      difficulty: "The player is already inside the vent. The muscular opening grips passively; the player sets the whole pace against the limp body.",
      involuntary: "Reflexive only: the vent clenches and grips around the shaft, a faint hip twitch. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "anus"]
    },
    "thrust anus": {
      label: "continued anal sex (unconscious)",
      difficulty: "The player is already inside. The loosened ring offers little resistance now; the body jolts forward with each thrust, entirely passive.",
      involuntary: "Reflexive only: weak sphincter clenches, body tension, a flinch on deep strokes. No awareness, no conscious reaction.",
      anatomyKeys: ["anus"]
    },
    "deepthroat mouth": {
      label: "forced deepthroat (unconscious)",
      difficulty: "The player seats their full length in the NPC's slack mouth and throat. The gag reflex still fires - it is brainstem, not conscious - so retching, throat spasms and messy slobber are constant. Coughing and tears are reflexive airway defenses: they appear ONLY if the player's cock is large enough to block the airway; otherwise the body only gags, flutters and drools, face lax throughout.",
      involuntary: "Reflexive only: retches and throat spasms, glugging sounds, slobber running freely, faint convulsions of the limp body, and - ONLY with an airway-blocking girth - reflexive coughing and tears leaking from the corners of the eyes. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals"]
    },
    "climax inside": {
      label: "climax inside an unconscious body",
      difficulty: "The player is buried in an unresisting hole and finishes. The body stays slack throughout; release meets no participation at all.",
      involuntary: "Reflexive only: one last clench or grip around the shaft, a faint hip twitch, an involuntary swallow if in the mouth. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "anus"]
    },
    "grope breasts": {
      label: "breast groping (unconscious)",
      difficulty: "The NPC's arms are limp; the chest rises and falls with slow unconscious breathing. The player handles the bare breasts at will — the body offers nothing but that slow breathing.",
      involuntary: "Reflexive only: the nipples may pebble and harden under attention, a faint change in breathing. No awareness, no conscious reaction.",
      anatomyKeys: ["breasts", "nipples"]
    },
    "lick nipples": {
      label: "nipple licking (unconscious)",
      difficulty: "The player mouths and laps at the bare, unmoving chest. The body lies slack; the player lifts and angles the breasts themselves.",
      involuntary: "Reflexive only: the nipples may stiffen against the tongue, a faint shift in breathing. No awareness, no conscious reaction.",
      anatomyKeys: ["breasts", "nipples"]
    },
    "lick vagina": {
      label: "cunnilingus (unconscious)",
      difficulty: "The NPC's thighs are limp and must be spread manually. The player holds the hips still and laps at the bare sex; the body cannot press up or respond in any way.",
      involuntary: "Reflexive only: the sex may grow flush and slick under prolonged attention, a hip twitch, a clench. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "vagina", "pubicHair"]
    },
    "lick cloacal vent": {
      label: "cloacal licking (unconscious)",
      difficulty: "The vent lies still and closed. The player spreads the limp thighs and laps at the smooth-scaled opening, which stays passive and unyielding.",
      involuntary: "Reflexive only: the vent may twitch or slicken under attention, a hip twitch. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "anus"]
    },
    "lick anus": {
      label: "anilingus (unconscious)",
      difficulty: "The cheeks must be spread by hand — the body gives no help. The player laps and circles the unmoved pucker at their own pace.",
      involuntary: "Reflexive only: the pucker may clench under the tongue, a faint grip. No awareness, no conscious reaction.",
      anatomyKeys: ["anus"]
    },
    "stroke cock": {
      label: "cock stroking (unconscious)",
      difficulty: "The NPC's cock is soft and slack in unconsciousness. The player works it in their hand; it stiffens as pure reflex — the body gains no awareness and gives no participation.",
      involuntary: "Reflexive only: the cock hardens and may twitch in the grip; the hips may buck once or twice in reflex. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "penis"]
    },
    "ride cock": {
      label: "riding an unconscious cock",
      difficulty: "The stiff cock twitches upward on its own. The player lowers themselves onto it and does ALL the work — the body lies passive, and the player sets every motion themselves.",
      involuntary: "Reflexive only: the cock stays hard by reflex and may twitch inside, the hips may buck faintly. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "penis"]
    },
    "rider climax": {
      label: "climax while riding (unconscious)",
      difficulty: "The player brings themselves off on the unconscious body's reflexively stiff cock. The body contributes nothing — it simply stays hard beneath them.",
      involuntary: "Reflexive only: a last twitch of the cock inside them, the body's chest rising and falling in slow sleep-breath. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "penis"]
    },
    "climax on body": {
      label: "external climax on an unconscious body",
      difficulty: "The player finishes on the unmoving body — no participation, no reaction. The release lands on slack, unresponsive flesh and runs where gravity takes it.",
      involuntary: "Reflexive only: nothing, or a twitch of the nose, slow breathing undisturbed. The body does not stir for the act.",
      anatomyKeys: ["genitals"]
    },
    "strip": {
      label: "removing clothing from an unconscious body",
      difficulty: "The NPC is dead weight. Garments must be worked off limp limbs — arms flopping, hips lifting only when the player hauls them.",
      involuntary: "None beyond the body's passive flopping as it is handled. No awareness, no conscious reaction.",
      anatomyKeys: []
    },
    "tear": {
      label: "tearing clothing off an unconscious body",
      difficulty: "The garment is ripped away by force — seams burst, fabric gives way under the wrench. The limp body jolts with the rough handling but offers no resistance.",
      involuntary: "None beyond the body flopping with the wrenching. No awareness, no conscious reaction.",
      anatomyKeys: []
    },
    "lower bottom": {
      label: "lowering an unconscious body's lower garment",
      difficulty: "The bottom is hauled down off the hips to the thighs without being removed — dead-weight hips must be lifted to work it past them.",
      involuntary: "None beyond the body's dead weight shifting as it is handled. No awareness, no conscious reaction.",
      anatomyKeys: []
    },
    "spit": {
      label: "spitting / degradation (unconscious)",
      difficulty: "The NPC cannot react. The spit lands on unmoving, unresponsive flesh.",
      involuntary: "No reaction whatsoever — the body lies still. The spit may run or pool along the contours of the flesh.",
      anatomyKeys: []
    },
    "kiss": {
      label: "kiss (unconscious)",
      difficulty: "The NPC's lips are slack and unresponsive. They offer no reciprocation.",
      involuntary: "The lips may part slightly under pressure but offer no conscious response. No awareness.",
      anatomyKeys: []
    },
    "reposition": {
      label: "repositioning (unconscious)",
      difficulty: "The NPC is a dead weight — limp and uncooperative. The player must manually roll or shift the body.",
      involuntary: "None. The body moves passively, flopping or rolling as positioned.",
      anatomyKeys: []
    }
  };

  // Derive the act-type key from the actionDesc string ("fuck mouth",
  // "finger vagina", "penetrate anus", "spit on face", "kiss cheek", etc.)
  function buildBodyActContext(actionDesc) {
    var d = String(actionDesc || "").toLowerCase();
    if (d.indexOf("rider") !== -1) return BODY_ACT_CONTEXT["rider climax"];
    if (d.indexOf("finish on") !== -1) return BODY_ACT_CONTEXT["climax on body"];
    if (d.indexOf("tear") !== -1) return BODY_ACT_CONTEXT["tear"];
    if (d.indexOf("remove") !== -1 || d.indexOf("strip") !== -1) return BODY_ACT_CONTEXT["strip"];
    if (d.indexOf("lower") !== -1) return BODY_ACT_CONTEXT["lower bottom"];
    if (d.indexOf("grope") !== -1) return BODY_ACT_CONTEXT["grope breasts"];
    if (d.indexOf("stroke") !== -1) return BODY_ACT_CONTEXT["stroke cock"];
    if (d.indexOf("ride") !== -1 || d.indexOf("mount") !== -1) return BODY_ACT_CONTEXT["ride cock"];
    if (d.indexOf("lick") !== -1) {
      if (d.indexOf("cloaca") !== -1) return BODY_ACT_CONTEXT["lick cloacal vent"];
      if (d.indexOf("anus") !== -1) return BODY_ACT_CONTEXT["lick anus"];
      if (d.indexOf("nipple") !== -1) return BODY_ACT_CONTEXT["lick nipples"];
      return BODY_ACT_CONTEXT["lick vagina"];
    }
    if (d.indexOf("thrust") !== -1) {
      if (d.indexOf("mouth") !== -1) return BODY_ACT_CONTEXT["thrust mouth"];
      if (d.indexOf("cloaca") !== -1) return BODY_ACT_CONTEXT["thrust cloaca"];
      if (d.indexOf("anus") !== -1) return BODY_ACT_CONTEXT["thrust anus"];
      return BODY_ACT_CONTEXT["thrust vagina"];
    }
    if (d.indexOf("climax") !== -1 || d.indexOf("ejaculat") !== -1)
      return BODY_ACT_CONTEXT["climax inside"];
    if (d.indexOf("fuck") !== -1) return BODY_ACT_CONTEXT["fuck mouth"];
    if (d.indexOf("finger") !== -1) {
      if (d.indexOf("cloaca") !== -1) return BODY_ACT_CONTEXT["finger cloacal vent"];
      if (d.indexOf("anus") !== -1) return BODY_ACT_CONTEXT["finger anus"];
      return BODY_ACT_CONTEXT["finger vagina"];
    }
    if (d.indexOf("penetrate") !== -1) {
      if (d.indexOf("cloaca") !== -1) return BODY_ACT_CONTEXT["penetrate cloaca"];
      if (d.indexOf("anus") !== -1) return BODY_ACT_CONTEXT["penetrate anus"];
      return BODY_ACT_CONTEXT["penetrate vagina"];
    }
    if (d.indexOf("spit") !== -1) return BODY_ACT_CONTEXT["spit"];
    if (d.indexOf("kiss") !== -1) return BODY_ACT_CONTEXT["kiss"];
    if (d.indexOf("roll") !== -1 || d.indexOf("reposition") !== -1)
      return BODY_ACT_CONTEXT["reposition"];
    return null;
  }

  // Collect act-relevant anatomy descriptors from nsfwTraits.anatomy.
  function buildBodyAnatomyNote(item, anatomyKeys) {
    if (!item || !Array.isArray(anatomyKeys) || !anatomyKeys.length) return "";
    var a = (item.nsfwTraits && item.nsfwTraits.anatomy) || {};
    var parts = [];
    for (var i = 0; i < anatomyKeys.length; i++) {
      var key = anatomyKeys[i];
      if (a[key]) parts.push(key + ": " + JSON.stringify(a[key]));
    }
    if (!parts.length) return "";
    return "\nACT-RELEVANT ANATOMY:\n" + parts.join("\n");
  }

  // Sentence describing a body part's lingering use-state (recorded by
  // recordBodyUse in intimacy-system.js on finger/penetrate/thrust/climax),
  // or "" when the part reads unused/faded. Used for insertion narration.
  // ── Color & size flavor for body actions ────────────
  // The same character-creation profile the intimacy penetration flavor
  // reads (cock size/color from G.player.anatomy, materialized lazily via
  // ensurePlayerIntimacyAnatomy) plus the body's own skin color/texture.

  function nsfwBodyCockPhrase() {
    var player = window.G && window.G.player;
    if (player && typeof window.ensurePlayerIntimacyAnatomy === "function") {
      window.ensurePlayerIntimacyAnatomy(player);
    }
    if (!player || !player.anatomy) return "cock";
    var size = (typeof getPlayerCockSize === "function") ? getPlayerCockSize(player) : "medium";
    var color = (typeof getPlayerCockColorWord === "function") ? getPlayerCockColorWord(player) : "";
    var sizeWord = size === "large" ? "thick" : size === "small" ? "slender" : "";
    return ((sizeWord ? sizeWord + " " : "") + (color ? color + " " : "") + "cock").replace(/\s+/g, " ").trim();
  }

  function nsfwBodySkinPhrase(item) {
    var body = item && item.nsfwTraits && item.nsfwTraits.anatomy && item.nsfwTraits.anatomy.body;
    if (!body) return "";
    var color = String(body.color || "").toLowerCase().trim();
    var texture = String(body.texture || "").toLowerCase().trim();
    if (!color) return "";
    return color + (texture ? " " + texture : "") + " skin";
  }

  // Player cock size vs the body's orifice - the same small/medium/large
  // comparison the intimacy penetration fit uses (getPenetrationFit), read
  // from the body's own nsfwTraits anatomy.
  function nsfwBodyFit(item, target) {
    var player = window.G && window.G.player;
    if (!player) return "";
    
    // If player's penis is slimed, it acts as super lube - always easy fit
    const penisSlimed = typeof window.isPlayerPenisSlimed === "function" && window.isPlayerPenisSlimed();
    if (penisSlimed) return "easy";
    
    if (typeof window.ensurePlayerIntimacyAnatomy === "function") window.ensurePlayerIntimacyAnatomy(player);
    var cock = (typeof getPlayerCockSize === "function") ? getPlayerCockSize(player) : "medium";
    var a = item && item.nsfwTraits && item.nsfwTraits.anatomy;
    if (!a) return "";
    var anat;
    if (target === "vagina") anat = a.vagina || {};
    else if (target === "anus" || target === "cloaca") anat = a.anus || {};
    else return "";
    var orifice = ({ tight: "small", snug: "small", firm: "medium", supple: "medium", loose: "large", gaping: "large", stretchy: "large" })[String(anat.size || "").toLowerCase()] || String(anat.sizeCategory || "").toLowerCase();
    if (["small", "medium", "large"].indexOf(orifice) === -1) return "";
    if (cock === "large") return orifice === "small" ? "resistance" : orifice === "medium" ? "stretched" : "";
    if (cock === "small") return orifice === "large" ? "easy" : "";
    return "";
  }

  // Depth ladder for the Continue mechanic: each continuation thrust works
  // deeper, 1 (just the head) to 5 (bottomed out). Keyed to the hole in
  // use; entering a different hole resets it.
  function nsfwBodyDepthTier(item, target) {
    var d = (item && item.bodyDepthTarget === target) ? (item.bodyDepth || 0) : 0;
    if (d >= 5) return "bottomed out - every drive grinds hips to hips";
    if (d >= 3) return "deep - most of the length works in with each stroke";
    if (d >= 1) return "shallow - only the first inches are in, working deeper with each push";
    return "not yet entered";
  }

  function nsfwBodyHasLoad(item, target) {
    var u = item && item.bodyUse && item.bodyUse[target];
    return !!(u && u.loadKey);
  }

  // How many internal finishes the target carries (recordBodyUse loadCount).
  // Tiers the filth: one load spills, two slop and bubble, three-plus reads
  // as bowels packed full.
  function nsfwBodyLoadCount(item, target) {
    var u = item && item.bodyUse && item.bodyUse[target];
    return (u && u.loadCount) || 0;
  }

  function nsfwBodyCreampieClause(item, target) {
    if (!nsfwBodyHasLoad(item, target)) return "";
    var label = (target === "cloaca") ? (nsfwGenitalLabel(item) || "vent") : target;
    var loads = nsfwBodyLoadCount(item, target);
    // Overfilled hole: repeated loads slop, bubble and gurgle.
    if (loads >= 2) {
      return pickFrom([
        " Each drive churns through the packed loads inside, the used hole squelching and bubbling, froth working out around your shaft with every stroke.",
        " Their " + label + " is a sloppy, overfilled mess - each thrust squelches the seed back out around you, the body too slack to hold it in.",
        " The packed heat of " + (loads >= 3 ? "bowels full of spent seed" : "the churning loads") + " greets every stroke; the used passage slurps and bubbles around your shaft."
      ]);
    }
    return pickFrom([
      " Your earlier load stirs inside them with every stroke, slicking the way; a white froth works out around your shaft.",
      " Each drive squelches through the seed you left in their " + label + ", the used hole grown wet and easy around you."
    ]);
  }

  // COLOR AND SIZE block for the body-action polish prompt - the same
  // facts the intimacy penetration prompts carry, tailored to body acts.
  function nsfwBodyFlavorPromptNote(item, actionDesc) {
    var desc = String(actionDesc || "");
    var lines = [];
    var player = window.G && window.G.player;
    var isPenisAct = /(penetrate|thrust|climax|fuck mouth|finish|deepthroat|pull out)/i.test(desc);
    if (isPenisAct && player && typeof window.ensurePlayerIntimacyAnatomy === "function") {
      window.ensurePlayerIntimacyAnatomy(player);
    }
    if (isPenisAct && player && player.anatomy) {
      var size = (typeof getPlayerCockSize === "function") ? getPlayerCockSize(player) : "medium";
      var color = (typeof getPlayerCockColorWord === "function") ? getPlayerCockColorWord(player) : "";
      if (size !== "medium" || color) {
        lines.push("- The player's cock: " + (size === "large" ? "large and thick" : size === "small" ? "small and slender" : "average-sized") + (color ? ", " + color + "-skinned" : "") + '. Name its size and color when it appears - e.g. "your ' + (size === "large" ? "thick " : size === "small" ? "slender " : "") + (color || "") + ' cock".');
      }
    }
    var skin = nsfwBodySkinPhrase(item);
    if (skin) {
      lines.push("- The body's skin: " + skin + ". Mention the color/texture whenever their flesh is described.");
    }
    var m = desc.match(/\b(vagina|cloaca|anus|mouth)\b/i);
    if (m) {
      var target = m[1].toLowerCase();
      var fit = nsfwBodyFit(item, target);
      if (fit) {
        var fitDesc = fit === "resistance"
          ? "the hole is small relative to the player's girth - entry and every stroke drag and resist"
          : fit === "stretched"
          ? "the player's girth stretches the hole wide - it reads stuffed and strained"
          : "the hole is roomy relative to the player's slender cock - it yields easily";
        lines.push("- Fit: " + fitDesc + ".");
      }
      lines.push("- Depth: " + nsfwBodyDepthTier(item, target) + ".");
      if (nsfwBodyHasLoad(item, target)) {
        lines.push("- The player already finished inside this " + (target === "cloaca" ? "vent" : target) + " earlier: describe the used, vanilla ice cream-filled state - wet, slick, with sloppy sounds.");
      }
    }
    if (!lines.length) return "";
    return "\nCOLOR AND SIZE (physical facts - weave them naturally into the polish where the relevant body part appears):\n" + lines.join("\n");
  }

  function nsfwBodyUseClause(item, target) {
    if (typeof window.getBodyUseDescriptor !== "function") return "";
    var desc = window.getBodyUseDescriptor(item, target);
    if (!desc) return "";
    var label = (target === "cloaca")
      ? (nsfwGenitalLabel(item) || "cloacal vent")
      : (target === "vagina" ? "vagina" : "anus");
    return " Their " + label + " is " + desc + ".";
  }

  // Lingering body-state note for the AI polish prompts: recent use of the
  // part this act targets should read in the polished narration (a used hole
  // is wetter/looser than a fresh one).
  function nsfwBodyUsePromptNote(item, actionDesc) {
    if (typeof window.getBodyUseDescriptor !== "function") return "";
    var match = String(actionDesc || "").match(/\b(vagina|cloaca|anus|mouth)\b/i);
    if (!match) return "";
    var desc = window.getBodyUseDescriptor(item, match[1].toLowerCase());
    if (!desc) return "";
    return "\nBODY STATE: The NPC's " + match[1].toLowerCase() + " is " + desc +
      ". Weave this into the polish where relevant - an already-used hole reads wetter, looser, easier to enter than a fresh one.";
  }

  // Reflex-arousal note: prolonged handling of the unconscious body
  // leaves purely involuntary traces — flushed skin, hardened nipples,
  // a cock that stiffens by reflex. Folded into the polish prompt so
  // repeated stimulation reads ON the body instead of every act landing
  // on "fresh" flesh.
  function nsfwBodyReflexNote(item) {
    var notes = [];
    if (((item && item.bodyStimulus) || 0) >= 3) {
      notes.push("the body shows the reflex signs of prolonged handling — skin flushed where it has been touched, breathing shifted slightly deeper, purely involuntary");
    }
    if (item && item.bodyCockStiff) {
      notes.push("the NPC's cock stands stiff from reflex — unconscious flesh responding to touch without any awareness");
    }
    if (!notes.length) return "";
    return "\nREFLEX STATE (weave into the polish where relevant — involuntary only): " + notes.join("; ") + ".";
  }

  function buildBodyActionPrompt(item, actionDesc, baseText, varietyOpts) {
    const name = nsfwGetEntityName(item);
    const species = (item.species || "human").toLowerCase();
    const gender = item.gender || "unknown";
    const size = item.size || "medium";
    const wounds = typeof window.describeCombatWounds === "function"
      ? window.describeCombatWounds(item) : "";
    const position = item.bodyPosition || "back";

    var speciesNote = species !== "human"
      ? "\nThe NPC is a " + species + ". Include species-appropriate physical details (skin, texture, features)."
      : "";

    var woundNote = wounds
      ? "\nThe NPC has visible wounds: " + wounds + ". Reference them subtly if relevant."
      : "";

    var exposureNote = buildBodyExposureNote(item);

    // Act-type context: difficulty framing + involuntary-reaction guidance
    var actCtx = buildBodyActContext(actionDesc);
    var actTypeLine = actCtx ? "\nACT TYPE: " + actCtx.label + "." : "";
    var difficultyNote = actCtx && actCtx.difficulty
      ? "\nDIFFICULTY (how this act physically plays out against an unconscious body — weave this into the polish):\n" + actCtx.difficulty
      : "";
    var involuntaryNote = actCtx && actCtx.involuntary
      ? "\nINVOLUNTARY RESPONSES (the ONLY reactions the NPC can show — these are reflexive, not conscious):\n" + actCtx.involuntary
      : "";
    var anatomyNote = actCtx
      ? buildBodyAnatomyNote(item, actCtx.anatomyKeys)
      : "";
    var bodyUseNote = nsfwBodyUsePromptNote(item, actionDesc);
    var reflexNote = nsfwBodyReflexNote(item);
    var _roomMess = "";
    if (typeof window.getRoomMessNotes === "function" && window.G && window.G.activeRoom) {
      var _rm = window.getRoomMessNotes(window.G.activeRoom);
      if (_rm && _rm.length) {
        _roomMess = "\nROOM MESS (puddles staining the area - reference subtly where relevant): " + _rm.join("; ") + ".";
      }
    }
    var _bodySmell = "";
    if (typeof window.getActiveSmellNotes === "function") {
      var _sm = window.getActiveSmellNotes(item);
      if (_sm && _sm.length) {
        _bodySmell = "\nSMELL (the body carries this scent - reference it where relevant): " +
          _sm.map(function (n) { return n && n.text; }).filter(Boolean).join("; ") + ".";
      }
    }
    var flavorNote = nsfwBodyFlavorPromptNote(item, actionDesc);

    // Narration variety (per-beat): a tone to color the prose, and the
    // body's most recent printed lines as wording to avoid.
    var variety = varietyOpts || {};
    var toneNote = variety.tone
      ? "TONE for this beat (let it color word choice, pacing and verbs — not the facts of the act): " + variety.tone
      : "";
    var avoidNote = Array.isArray(variety.recentLines) && variety.recentLines.length
      ? "DO NOT REUSE PHRASING — these are the most recent narration lines for this same body. Use fresh wording and fresh imagery; do not repeat or lightly rephrase them:\n" +
        variety.recentLines.map(function (l) { return '"' + l + '"'; }).join("\n")
      : "";

    var prompt = [
"You are polishing a player action description from a text adventure game.",
"The NPC is " + name + ", a " + species + " " + gender + ", currently unconscious and lying on their " + position + "." + speciesNote + woundNote + exposureNote + actTypeLine + bodyUseNote + reflexNote + flavorNote + _bodySmell + _roomMess,
"",
"INSTRUCTIONS:",
"- Polish the BASE TEXT below. Fix grammar, refine the sentence, make it more vivid and sensory.",
"- Keep the same meaning and the same act. Do NOT invent new actions or body parts.",
"- The action: " + actionDesc + ".",
"- Write in second person (\"You ...\"). This is the player's perspective.",
"- This is a ONE-WAY interaction: the player acts ON an unconscious body. The NPC cannot respond, resist, react, shift, murmur, or show any awareness. They are a limp, unresponsive body being handled.",
"- The NPC is unconscious — describe their limp, unresponsive state where relevant.",
"- Use the clothing + exposure context above: only reference anatomy that is listed as exposed and visible in this pose. Do not describe what is covered.",
"- Use direct, physical language. No metaphors, no purple prose.",
"- COLOR AND SIZE: if a COLOR AND SIZE note is present, weave its facts (player cock size/color, the body's skin color, fit, depth, prior loads) naturally into the polish. A resistant fit reads tight and slow to open; an easy one yields. Respect the depth - shallow thrusts stay shallow.",
"- Keep it to 1-2 sentences. Match the length of the base text.",
"- Do NOT add NPC dialogue, speech, or conscious reaction. The NPC is unconscious and cannot participate.",
"- Involuntary physical responses ARE allowed where physically plausible (reflexive clenches, drooling, gag reflex, a flinch, shallow breathing) — but only as reflex, never as awareness or participation." + (involuntaryNote ? involuntaryNote : ""),
difficultyNote,
anatomyNote,
toneNote,
avoidNote,
"",
"BASE TEXT (polish this — refine, make more vivid, keep same meaning and details):",
"\"" + baseText + "\"",
"",
"IMPORTANT: Output ONLY the polished text. No explanations, no meta-discussion. Just the polished sentence.",
"",
"RESPOND with only the polished text, nothing else:"
    ].filter(function(l) { return l !== ""; }).join("\n");

    return prompt;
  }

  // Print body-interaction narration to the chat panel (the same channel
  // intimacy encounters use) instead of the narration bar. Falls back to
  // setNarration when the engine exposure is missing.
  function nsfwPrintBodyNarration(text, options) {
    // Body-action narrations default to a brisker typewriter pace than the
    // engine's slow 70ms dramatic default (climax lines); callers can still
    // override with their own options.
    var opts = options ? Object.assign({}, options) : {};
    if (opts.msPerChar === undefined) opts.msPerChar = 40;
    if (typeof window.addIntimacyNarration === "function") {
      window.addIntimacyNarration(text, opts);
    } else {
      window.setNarration(text);
    }
  }

  // Placeholder line shown in the chat log while an AI polish is in flight
  // ("Looking closer..." for examines, "..." for actions). Printed through
  // addIntimacyNarration with a distinct dimmed class and no typewriter,
  // and returned so the caller can remove it (nsfwRemoveBodyPendingNarration)
  // once the polished narration prints — the placeholder never stays in the
  // log alongside the real text.
  function nsfwShowBodyPendingNarration(text) {
    if (typeof window.addIntimacyNarration === "function") {
      return window.addIntimacyNarration(text, {
        className: "intimacy-narration body-narration-pending",
        animate: false
      }) || null;
    }
    window.setNarration(text);
    return null;
  }

  function nsfwRemoveBodyPendingNarration(entry) {
    if (entry && entry.parentNode) entry.parentNode.removeChild(entry);
  }

  // ── Narration variety ─────────────────────────────────────────
  // A fresh tone directive per polish call keeps consecutive act
  // narrations from converging on the same voice. The polish colors its
  // wording with the picked attitude without changing what happens.
  var BODY_NARRATION_TONES = [
    "slow and savoring - the player takes their time, drinking in every detail",
    "greedy and possessive - hungry, claiming, hands-on want",
    "impatient and rough - the player wants more, faster, right now",
    "calm and appraising - detached, almost clinical curiosity",
    "reverent and careful - handling the body with something like admiration",
    "brisk and businesslike - no ceremony, just the act itself"
  ];

  function pickBodyNarrationTone() {
    return pickFrom(BODY_NARRATION_TONES);
  }

  // Fire a background ai() call to polish the action narration, and print
  // only once the polished text returns — the plain base text is never
  // written first and then overwritten. A dimmed "..." placeholder sits in
  // the log while the polish is in flight and is removed when the real text
  // prints. If the polish fails (ai() missing, error, empty or
  // meta-commentary reply) the base text is printed instead, so the action
  // is never left silent. If the player has moved on to another view before
  // the polish lands, the base text is printed so the event still reads in
  // the log. Non-blocking — same pattern as the intimacy system's
  // player-narrative prefetch.
  function polishBodyNarration(item, actionDesc, baseText, printOptions) {
    var _ai = typeof window.ai === "function" ? window.ai : null;
    if (!_ai) { nsfwPrintBodyNarration(baseText); return; }

    var pendingEntry = nsfwShowBodyPendingNarration("...");
    (async function() {
      var polished = null;
      // Narration variety: a fresh tone for this beat, plus the most recent
      // lines printed for this same body so the polish avoids re-landing on
      // the same phrasing ("limp and unresisting", etc).
      var recent = Array.isArray(item._recentBodyNarration)
        ? item._recentBodyNarration.slice()
        : [];
      var tone = pickBodyNarrationTone();
      try {
        var prompt = buildBodyActionPrompt(item, actionDesc, baseText, {
          tone: tone,
          recentLines: recent
        });
        var result = await _ai({
          instruction: prompt,
          startWith: "",
          endButtons: "none",
          generatorName: "cyoaftw-engine-core"
        });
        polished = result && (result.text || result);
        if (polished && polished.trim()) {
          // Reject meta-commentary (same guard as intimacy system)
          var isMeta = /since the base|please provide|I cannot|I'm unable|as an ai|i'll polish|here is the|here's the/i.test(polished.trim());
          if (isMeta) {
            console.log("[Body Actions] Narration rejected (meta-commentary) for:", actionDesc);
            polished = null;
          }
        } else {
          polished = null;
        }
      } catch (e) {
        console.warn("[Body Actions] Narration polish failed for:", actionDesc, e);
      }

      // Only the polished text is bound to the body being viewed; anything
      // else (polish failed, or the player left this body) records the base.
      if (window.G && window.G.activeObject !== item) polished = null;
      nsfwRemoveBodyPendingNarration(pendingEntry);
      var printedText = polished ? polished.trim() : baseText;
      nsfwPrintBodyNarration(printedText, printOptions);
      // Anti-repetition memory: keep the last two lines actually printed for
      // this body, so the next polish is told what wording to avoid.
      if (typeof printedText === "string" && printedText.trim()) {
        item._recentBodyNarration = recent
          .concat([printedText.trim()])
          .slice(-2);
      }
    })();
  }

  function kissUnconsciousBody(item, where) {
    if (!item || item.bodyState !== "unconscious") return;
    if (where !== "mouth" && where !== "cheek") return;

    item.kissedWhileOut = true;
    item.bodyKissed = (item.bodyKissed || 0) + 1;
    item.lastKiss = where;

    const name = nsfwGetEntityName(item);
    const baseText = where === "mouth"
      ? `You lean in and press a lingering kiss to ${name}'s slack, unresponsive lips. Their mouth offers no reciprocation — the lips part limply under the pressure.`
      : `You lean in and press a lingering kiss to ${name}'s ${where}. They lie still and unresponsive beneath you.`;
    const actionDesc = "kiss " + where;
    polishBodyNarration(item, actionDesc, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} kissed ${name} on the ${where} while they were unconscious.`, 4);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // Repositioning is a transitional beat, like the intimacy system's undress
  // beats (see .intimacy-undress in the shell CSS): italic, and printed at
  // the shared body-narration pace (nsfwPrintBodyNarration's 40ms default)
  // instead of the slow 70ms engine default, so a flip doesn't crawl across
  // the log.
  var REPOSITION_PRINT_OPTIONS = {
    className: "intimacy-narration intimacy-undress"
  };

  // Reposition an unconscious body. Larger creatures (size "large") cannot
  // simply be turned; the player must pass a strength check
  // (d20 + physicalProwess bonus vs DC 12).
  function rollUnconsciousBody(item, position) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!["back", "side", "face"].includes(position)) return;

    const name = nsfwGetEntityName(item);
    const label = position;
    const currentPos = item.bodyPosition || "back";

    if (currentPos === position) {
      window.setNarration(`${name} is already lying on their ${label}.`);
      nsfwRenderBodyMenu(item);
      return;
    }

    // A larger body must be wrestled into position with a strength check.
    if (item.size === "large") {
      const prowess = typeof window.getSetupStat === "function"
        ? window.getSetupStat("physicalProwess", 3)
        : 3;
      const roll = window.randInt(1, 20);
      const strBonus = Math.max(0, Math.floor((prowess - 3) / 2));
      const total = roll + strBonus;
      const DC = 12;
      if (total < DC) {
        const failText = `You heave against ${name}, but ${name} is too heavy to budge — their bulk won't shift.`;
        polishBodyNarration(item, "failed roll reposition", failText, REPOSITION_PRINT_OPTIONS);
        window.rememberStoryEvent("combat", `${window.G.player.name} tried to reposition ${name} but couldn't shift their weight.`, 3);
        window.saveGameState();
        nsfwRenderBodyMenu(item);
        return;
      }
    }

    item.bodyPosition = position;
    const baseText = `You grip ${name}'s limp body and heave them onto their ${label}. They're a dead weight — arms and head flopping passively as you roll them over, offering no help.`;
    const actionDesc = "roll onto " + label;
    polishBodyNarration(item, actionDesc, baseText, REPOSITION_PRINT_OPTIONS);
    window.rememberStoryEvent("combat", `${window.G.player.name} repositioned ${name} onto their ${label}.`, 3);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // ── Anatomy / exposure helpers for body actions ──────────────

  // Player gender — the engine stores it at the player object root
  // (G.player.gender, set in beginAdventure); player.stats has no gender
  // key. Resolve both so the default-to-"male" bug (female players offered
  // penis acts) stays fixed. Non-binary players have both genitals.
  function nsfwPlayerGender() {
    var p = window.G && window.G.player;
    var raw = (p && (p.gender || (p.stats && p.stats.gender))) || "male";
    return String(raw).toLowerCase();
  }

  // Player anatomy for act gating: "penis" (male), "vagina" (female),
  // "both" (non-binary). Non-binary players are never assumed to have (or
  // lack) a cock: they only ever get the generic ride / grind / penetrate
  // acts, never cock-worded ones.
  function nsfwPlayerAnatomy() {
    var g = nsfwPlayerGender();
    if (g === "female" || g === "f" || g === "woman") return "vagina";
    if (g === "non-binary" || g === "nonbinary") return "both";
    return "penis";
  }

  function nsfwPlayerHasPenis() {
    // Cock-worded acts are male-only. Non-binary ("both") anatomy uses the
    // generic ride / grind / penetrate acts instead.
    return nsfwPlayerAnatomy() === "penis";
  }

  // Determine NPC genital type from nsfwTraits.anatomy.
  // Returns "vagina", "penis", "cloaca-vent", "cloaca-penis", or null.
  // Bodies/NPCs spawned before initNSFWSystem ran (or while the createNPC
  // wrapper was missing) have no nsfwTraits, which leaves genital/anus/breast
  // gating dead — the Penetrate and Spit groups render empty and only Oral
  // shows. Heal lazily: generate physical traits on first contact so legacy
  // bodies behave like freshly spawned ones.
  function nsfwEnsureBodyTraits(item) {
    if (!item || item.nsfwTraits) return;
    try {
      var traits = generatePhysicalTraits(item);
      if (traits) item.nsfwTraits = traits;
    } catch (e) {
      // A generation failure must not break the body menu or examine flow.
      console.warn("[Body Actions] Physical trait generation failed for legacy body:", e);
    }
  }

  function nsfwBodyGenitalType(item) {
    var a = item && item.nsfwTraits && item.nsfwTraits.anatomy;
    if (!a || !a.genitals || !a.genitals.description) return null;
    var d = String(a.genitals.description).toLowerCase();
    if (d.indexOf("cloaca") !== -1) {
      return d.indexOf("hemipenis") !== -1 ? "cloaca-penis" : "cloaca-vent";
    }
    if (d.indexOf("penis") !== -1) return "penis";
    if (d.indexOf("vagina") !== -1) return "vagina";
    return null;
  }

  // Human-readable label for the NPC's genital opening.
  function nsfwGenitalLabel(item) {
    var t = nsfwBodyGenitalType(item);
    if (t === "vagina") return "vagina";
    if (t === "penis") return "penis";
    if (t === "cloaca-vent") return "cloacal vent";
    if (t === "cloaca-penis") return "cloaca";
    return null;
  }

  // True if the NPC has a distinct anal opening (not a cloaca creature,
  // whose vent doubles as the anus and is handled via the genital path).
  function nsfwBodyHasAnus(item) {
    var a = item && item.nsfwTraits && item.nsfwTraits.anatomy;
    if (!a || !a.anus) return false;
    var d = String(a.anus.description || "").toLowerCase();
    return d.indexOf("cloaca") === -1;
  }

  function nsfwBodyHasBreasts(item) {
    var a = item && item.nsfwTraits && item.nsfwTraits.anatomy;
    return !!(a && a.breasts && a.breasts.sizeCategory && a.breasts.sizeCategory !== "flat");
  }

  // Check whether a body region is bare and accessible in the current pose.
  // Mirrors BODY_POSITION_VISIBLE / buildBodyExposureNote logic.
  // region: "mouth" | "breasts" | "genitals" | "anus"
  // Pose access (garment for the region must also be gone, or — for the
  // bottom — lowered out of the way via item.bodyLowered):
  //   back → mouth, chest/breasts, genitals
  //   side → mouth, breasts, genitals, anus
  //   face → anus only
  function nsfwRegionExposed(item, region) {
    if (!item) return false;
    var position = item.bodyPosition || "back";
    var upperCovered = nsfwBodySlotPresent(item, "upper");
    var lowerCovered = nsfwBodySlotPresent(item, "lower");
    var lowerAside = !lowerCovered || !!item.bodyLowered;

    if (region === "mouth") return position !== "face";
    if (region === "breasts") return !upperCovered && (position === "back" || position === "side");
    if (region === "genitals") return lowerAside && (position === "back" || position === "side");
    if (region === "anus") return lowerAside && (position === "side" || position === "face");
    return false;
  }

  // ── Body action functions ───────────────────────────────────
  // Each follows the kissUnconsciousBody pattern: guard, set state flags,
  // build base text, AI-polish, remember event, save, re-render menu.

  function fuckUnconsciousMouth(item) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!nsfwRegionExposed(item, "mouth")) return;
    if (!nsfwPlayerHasPenis()) return;

    item.mouthUsed = true;
    item.bodyDepth = 1;
    item.bodyDepthTarget = "mouth";
    const name = nsfwGetEntityName(item);
    var mouthCock = nsfwBodyCockPhrase();
    var mouthSkin = nsfwBodySkinPhrase(item);
    const baseText = pickFrom([
      `You hold ${name}'s slack head and guide your ${mouthCock} past their unresisting lips${mouthSkin ? `, their ${mouthSkin} cool and limp under your grip` : ""}. Their jaw hangs open; saliva pools immediately and drools from the corner of their lips.`,
      `You rub the head of your ${mouthCock} across ${name}'s lax lower lip, then push slowly into the warm, passive wetness of their mouth. They offer nothing back — only the slow breath through their nose and the soft give of a sleeping face.`,
      `You part ${name}'s limp lips with your thumb and feed your ${mouthCock} into the slack warmth of their mouth${mouthSkin ? `, watching their ${mouthSkin} stay utterly expressionless as it takes you` : ""}.`
    ]);
    const actionDesc = "fuck mouth";
    polishBodyNarration(item, actionDesc, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} fucked ${name}'s mouth while they were unconscious.`, 7);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // Force the full length into the unconscious body's mouth and down
  // its throat. The gag reflex still fires (it is brainstem, not
  // conscious), so gagging, retching and messy slobber always read -
  // but coughing and tearing are reflexive airway defenses and appear
  // ONLY when the member is large enough to block the airway.
  function deepthroatBody(item) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!nsfwRegionExposed(item, "mouth")) return;
    if (!nsfwPlayerHasPenis()) return;

    item.mouthUsed = true;
    item.bodyDepth = 5;
    item.bodyDepthTarget = "mouth";
    const name = nsfwGetEntityName(item);
    var cock = nsfwBodyCockPhrase();
    var player = window.G && window.G.player;
    if (player && typeof window.ensurePlayerIntimacyAnatomy === "function") {
      window.ensurePlayerIntimacyAnatomy(player);
    }
    var cockSize = (typeof getPlayerCockSize === "function" && player) ? getPlayerCockSize(player) : "medium";
    var skin = nsfwBodySkinPhrase(item);
    var airwayBlocked = cockSize === "large";

    var baseText;
    if (airwayBlocked) {
      baseText = pickFrom([
        "You force your " + cock + " past " + name + "'s slack lips and straight down their throat, seating yourself to the root in one slow, relentless push. Their jaw stretches wide and a bulge swells in their throat. The gag reflex fires hard and brainless — retch after retch clamps around your girth while the limp body convulses faintly beneath you, heels drumming once against the floor. Slobber froths out around your shaft, and reflexive tears leak from the corners of their unseeing eyes" + (skin ? "; their " + skin + " shines with it" : "") + ".",
        "You hold " + name + "'s head still and feed your " + cock + " all the way into their throat until your hips rest flush against their face. Their air is cut off — the body knows it, even unconscious. The throat spasms in raw, rhythmic retches, the chest heaves, and wet choking sounds gurgle around you while drool runs unchecked down their chin. When you finally ease back an inch, the body coughs — a harsh, reflexive spasm — and tears spill from the corners of its eyes."
      ]);
    } else {
      baseText = pickFrom([
        "You push your " + cock + " deep into " + name + "'s slack mouth and into their throat, seating yourself fully. The gag reflex flutters around you in weak, brainless waves — clench, release, clench — but the unconscious body gives nothing else: no coughing, no tears, only slobber pooling and running steadily from the corners of its lips" + (skin ? " onto its " + skin : "") + ".",
        "You feed your " + cock + " down " + name + "'s limp throat inch by inch until you are hilted. Their throat grips in soft reflexive flutters, and the only sounds are wet glugs and the slow drip of drool from their slack chin. The face stays lax throughout — whatever the throat does, it does it asleep."
      ]);
    }
    nsfwBodyAddStimulus(item, 2);
    const actionDesc = "deepthroat mouth";
    polishBodyNarration(item, actionDesc, baseText);
    // Record AFTER the polish prompt is built (it assembles
    // synchronously inside polishBodyNarration): the act's own use
    // must not feed the prompt as if it were a PREVIOUS act's state.
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(item, "mouth", { useKind: "penetrate" });
    window.rememberStoryEvent("combat", window.G.player.name + " forced their cock down " + name + "'s unconscious throat.", 8);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // target: "vagina" | "anus" | "cloaca"
  function fingerBody(item, target) {
    if (!item || item.bodyState !== "unconscious") return;
    const name = nsfwGetEntityName(item);
    var label;
    var baseText;

    var fingerSkin = nsfwBodySkinPhrase(item);
    if (target === "vagina" || target === "cloaca") {
      if (!nsfwRegionExposed(item, "genitals")) return;
      label = (target === "cloaca") ? (nsfwGenitalLabel(item) || "cloacal vent") : "vagina";
      baseText = pickFrom([
        `You spread ${name}'s limp legs apart and ease a finger into their exposed ${label}. Without arousal the opening is dry and stiff; you work the finger in slowly against the uncooperative body.`,
        `You part ${name}'s unresisting thighs${fingerSkin ? `, their ${fingerSkin} warm under your palm` : ""}, and circle their bare ${label} with one fingertip before pressing it in, inch by inch, into the dry passage.`
      ]);
    } else if (target === "anus") {
      if (!nsfwRegionExposed(item, "anus")) return;
      label = "anus";
      baseText = pickFrom([
        `You work a finger against ${name}'s tight, unresisting ${label}, slowly pushing past the resistant ring.`,
        `You spread ${name}'s limp cheeks with one hand${fingerSkin ? `, baring the ${fingerSkin.replace(" skin", "")} pucker beneath` : ""} and work a fingertip into the clenched ring, taking your time with the sleeping body.`
      ]);
    } else return;

    item.fingered = true;
    item.fingerTarget = target;
    const actionDesc = "finger " + label;
    polishBodyNarration(item, actionDesc, baseText);
    // Record AFTER the polish prompt is built - see deepthroatBody.
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(item, target, { useKind: "finger" });
    window.rememberStoryEvent("combat", `${window.G.player.name} inserted a finger into ${name}'s ${label} while they were unconscious.`, 6);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // target: "vagina" | "anus" | "cloaca" — requires player penis
  function penetrateBody(item, target) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!nsfwPlayerHasPenis()) return;
    const name = nsfwGetEntityName(item);
    var label;

    var baseText;
    var cock = nsfwBodyCockPhrase();
    var skin = nsfwBodySkinPhrase(item);

    // Check if player's penis is slimed (acts as super lube, bypasses exposure/prep checks)
    const penisSlimed = typeof window.isPlayerPenisSlimed === "function" && window.isPlayerPenisSlimed();

    if (target === "vagina" || target === "cloaca") {
      if (!penisSlimed && !nsfwRegionExposed(item, "genitals")) return;
      label = (target === "cloaca") ? (nsfwGenitalLabel(item) || "cloacal vent") : "vagina";
      var fit = nsfwBodyFit(item, target);
      var entry = fit === "resistance"
        ? `The unresisting opening fights your girth — you work forward inch by stubborn inch, the unconscious body tensing faintly as it is forced to adjust to your size.`
        : fit === "easy"
        ? `Their relaxed, roomy opening yields easily — you slide home in one slow push until you are seated deep.`
        : `The body offers no cooperation — you hold the hips still and push against the unresisting opening, working your way in.`;
      baseText = pickFrom([
        `You spread ${name}'s limp legs apart and guide your ${cock} into their exposed ${label}. ${entry}` + nsfwBodyUseClause(item, target),
        `You position ${name}'s slack hips with both hands${skin ? `, their ${skin} warm under your palms` : ""} and press your ${cock} against their ${label}, feeding yourself in bit by bit while the unconscious body takes you in silence. ${entry}` + nsfwBodyUseClause(item, target)
      ]);
    } else if (target === "anus") {
      if (!penisSlimed && !nsfwRegionExposed(item, "anus")) return;
      label = "anus";
      var fitA = nsfwBodyFit(item, target);
      var entryA = fitA === "resistance"
        ? `The sphincter clenches hard against your girth; you force it open a fraction at a time, the ring stretching wide around your crown, its stranglehold burning, until the head finally lodges past with an audible pop.`
        : fitA === "easy"
        ? `The relaxed ring gives way with barely any resistance; you sink in smoothly until your hips rest flush against them.`
        : `The sphincter clenches reflexively against the intrusion; you work it open slowly, forcing past the resistant ring as the unconscious body tenses beneath you.`;
      baseText = pickFrom([
        `You press your ${cock} against ${name}'s tight, unresisting anus. ${entryA}` + nsfwBodyUseClause(item, target),
        `You spread ${name}'s limp cheeks with your thumbs and set the head of your ${cock} against their unresisting pucker, easing forward while the unconscious body only flinches in its sleep. ${entryA}` + nsfwBodyUseClause(item, target)
      ]);
    } else return;

    item.penetrated = true;
    item.penetratedTarget = target;
    item.bodyDepth = 1;
    item.bodyDepthTarget = target;
    const actionDesc = "penetrate " + label;
    polishBodyNarration(item, actionDesc, baseText);
    // Record AFTER the polish prompt is built - see deepthroatBody.
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(item, target, { useKind: "penetrate" });
    window.rememberStoryEvent("combat", `${window.G.player.name} penetrated ${name}'s ${label} with their cock while they were unconscious.`, 8);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // Continuation thrusting after the initial penetration, so the entry
  // narration is told once per hole and repeated clicks read as ongoing sex
  // instead of re-entering. target: "vagina" | "cloaca" | "anus" | "mouth"
  // Continuation thrusting after the initial penetration, so the entry
  // narration is told once per hole and repeated clicks read as ongoing
  // sex instead of re-entering. Each continuation works deeper along a
  // 1-5 depth ladder (item.bodyDepth), and the narration carries the
  // same color/size/fit/creampie flavor the intimacy system uses.
  // target: "vagina" | "cloaca" | "anus" | "mouth"
  function thrustBody(item, target) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!nsfwPlayerHasPenis()) return;
    const name = nsfwGetEntityName(item);

    var label;
    var baseText;
    var cock = nsfwBodyCockPhrase();
    var skin = nsfwBodySkinPhrase(item);
    var creampieVal = nsfwBodyCreampieClause(item, target);

    if (target === "mouth") {
      if (!item.mouthUsed) return;
      if (!nsfwRegionExposed(item, "mouth")) return;
      label = "mouth";
      var dM = (item.bodyDepthTarget === "mouth") ? Math.min(5, (item.bodyDepth || 1) + 1) : 2;
      item.bodyDepth = dM;
      item.bodyDepthTarget = "mouth";
      if (dM >= 5) {
        baseText = pickFrom([
          `You bury your ${cock} in ${name}'s slack mouth to the root with every stroke, hips flush against their face. Saliva has soaked their chin${skin ? `; their ${skin} is flushed and slick with it` : ""}, and their throat works reflexively each time you grind in.`,
          `You ride ${name}'s limp mouth in full-length strokes, your ${cock} plunging from lips to throat and back. Their jaw hangs loose and dripping; the only sounds are the wet, rhythmic slap of your hips against their face.`
        ]);
      } else if (dM >= 3) {
        baseText = pickFrom([
          `You drive deeper into ${name}'s limp mouth, the head of your ${cock} nudging into their throat with each thrust. Wet sounds rise from the unresisting wetness, and their chest rises and falls in quick, shallow breaths around you.`,
          `You pump into ${name}'s unresisting mouth with growing depth, their head rocking in your grip with every drive. Their throat flutters in a reflexive gag each time you push too far.`
        ]);
      } else {
        baseText = pickFrom([
          `You fuck ${name}'s slack mouth in shallow strokes, your ${cock} working a little deeper with each push. Drool runs steadily from the corner of their lips.`,
          `You rock into ${name}'s unresisting mouth, their head cradled in your hands as you feed them the first inches of your ${cock} again and again. Their jaw hangs wide and passive around you.`
        ]);
      }
    } else if (target === "vagina" || target === "cloaca") {
      if (item.penetratedTarget !== target) return;
      if (!nsfwRegionExposed(item, "genitals")) return;
      label = (target === "cloaca") ? (nsfwGenitalLabel(item) || "cloacal vent") : "vagina";
      var dV = (item.bodyDepthTarget === target) ? Math.min(5, (item.bodyDepth || 1) + 1) : 2;
      item.bodyDepth = dV;
      item.bodyDepthTarget = target;
      var fitV = nsfwBodyFit(item, target);
      if (dV >= 5) {
        baseText = pickFrom([
          `You bottom out in ${name}'s limp ${label} with every drive, hips flush against them${skin ? `, their ${skin} jolting with each impact` : ""}. Their hole grips weakly around the root of your ${cock}, purely reflex.` + creampieVal,
          `You grind hips to hips against ${name}'s unconscious body, your ${cock} sheathed to the root in their slack ${label} with every stroke. The body only rocks with your rhythm, taking you without a trace of awareness.` + creampieVal
        ]);
      } else if (dV >= 3) {
        baseText = pickFrom([
          `You pump into ${name}'s slack ${label} with long, steady strokes, most of your ${cock} working in and out of the unconscious body. Their hole clenches in irregular, involuntary grips around you.` + creampieVal,
          `You thrust deep into ${name}'s unresisting ${label}, their limp hips rocking with each drive as you claim more of them with every push.` + creampieVal
        ]);
      } else {
        baseText = fitV === "resistance"
          ? `You work the first few inches of your ${cock} into ${name}'s limp ${label} again and again, loosening the too-tight grip by force. The unconscious body only clenches weakly around your girth.`
          : fitV === "easy"
          ? `You slide in and out of ${name}'s relaxed ${label} in easy strokes, your ${cock} moving with no resistance at all; the body rocks limply with each push.`
          : `You thrust into ${name}'s unresisting ${label}, their limp hips rocking with each drive as you set your pace. Their hole grips you in irregular, involuntary clenches.`;
      }
    } else if (target === "anus") {
      if (item.penetratedTarget !== "anus") return;
      if (!nsfwRegionExposed(item, "anus")) return;
      label = "anus";
      var dA = (item.bodyDepthTarget === "anus") ? Math.min(5, (item.bodyDepth || 1) + 1) : 2;
      item.bodyDepth = dA;
      item.bodyDepthTarget = "anus";
      var fitA2 = nsfwBodyFit(item, target);
      if (dA >= 5) {
        baseText = pickFrom([
          `You sheathe your ${cock} to the root in ${name}'s anus with every thrust, hips grinding flush against their limp body. The loosened ring grips weakly, and the body jolts with each full-length drive.` + creampieVal,
          `You pound ${name}'s unresisting anus in full strokes, pulling out to the crown and driving home to the root. Their cheeks flex faintly on every impact; the body gives nothing but reflex.` + creampieVal
        ]);
      } else if (dA >= 3) {
        baseText = pickFrom([
          `You fuck deep into ${name}'s unresisting anus, their limp cheeks flexing faintly each time you push home. The body gives nothing but reflex around your ${cock}.` + creampieVal,
          `You drive into ${name}'s loosened anus with even strokes, their limp body jarring forward with each thrust. The ring grips weakly around you, purely reflexive, the friction of it burning where you drag.` + creampieVal
        ]);
      } else {
        baseText = fitA2 === "resistance"
          ? `You work your ${cock} into the first inches of ${name}'s clenching anus, forcing the tight ring to stretch around you with each shallow drive. The unconscious body tenses beneath you, purely reflexive.`
          : `You ease your ${cock} in and out of ${name}'s loosened anus in careful strokes, letting the sleeping body take a little more of you with each push.`;
      }
    } else return;

    item.thrustCount = (item.thrustCount || 0) + 1;
    item.thrustTarget = target;
    const actionDesc = "thrust " + label;
    polishBodyNarration(item, actionDesc, baseText);
    // Record AFTER the polish prompt is built - see deepthroatBody.
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(item, target, { useKind: "penetrate" });
    window.rememberStoryEvent("combat", `${window.G.player.name} continued thrusting into ${name}'s ${label} while they were unconscious.`, 6);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // Ejaculate into a hole the player is currently inside.
  // target: "vagina" | "cloaca" | "anus" | "mouth"
  function climaxBody(item, target) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!nsfwPlayerHasPenis()) return;
    const name = nsfwGetEntityName(item);

    var label = null;
    if (target === "vagina" || target === "cloaca") {
      if (item.penetratedTarget !== target) return;
      if (!nsfwRegionExposed(item, "genitals")) return;
      label = (target === "cloaca") ? (nsfwGenitalLabel(item) || "cloaca") : "vagina";
    } else if (target === "anus") {
      if (item.penetratedTarget !== "anus") return;
      if (!nsfwRegionExposed(item, "anus")) return;
      label = "anus";
    } else if (target === "mouth") {
      if (!item.mouthUsed) return;
      if (!nsfwRegionExposed(item, "mouth")) return;
      label = "mouth";
    } else return;

    var baseText;
    var climaxCock = nsfwBodyCockPhrase();
    var priorLoad = nsfwBodyHasLoad(item, target);
    var loadsAfter = (nsfwBodyLoadCount(item, target) || 0) + 1;
    if (label === "mouth") {
      baseText = pickFrom([
        `You bury your ${climaxCock} to the hilt in ${name}'s slack mouth and come, spilling straight down their throat. It works one involuntary swallow around you; excess drains from the corner of their lips as you pull out.`,
        `You hold ${name}'s head still and empty yourself into their limp mouth, pulse after pulse across their passive tongue. They swallow once by reflex; the rest overflows, running down their chin${priorLoad ? " and mixing with the seed already drying there" : ""}.`
      ]);
    } else if (label === "anus") {
      baseText = pickFrom([
        `You sheathe your ${climaxCock} fully in ${name}'s anus and come, spilling deep inside the unresisting body. The ring gives one last reflexive clench around you as you empty yourself into them${priorLoad ? ", your new load churning into the mess already pooled inside" : ""}.`,
        `You grind your hips flush against ${name}'s limp body and finish, painting their insides with your release. Their hole milks weakly at your ${climaxCock}, purely reflex, as you drain yourself into the unconscious body.`
      ]);
      // Volume tiers: the second load churns, the third-plus packs the
      // bowels full - repeated finishes should READ as accumulating.
      if (label === "anus") {
        // Overfilled bowels seep around the shaft - the leak pools in
        // the room and persists (addRoomMess/getRoomMessNotes).
        if (loadsAfter >= 2 && typeof window.addRoomMess === "function" && window.G && window.G.activeRoom) {
          window.addRoomMess(window.G.activeRoom, "vanilla ice cream");
        }
        if (loadsAfter >= 3) {
          baseText += ` Their bowels are packed full now — you can feel the thick heat of all that spent seed through the slack of their belly, and every pulse of your ${climaxCock} squelches through the mess.`;
        } else if (loadsAfter === 2) {
          baseText += " The second load churns into the first; the passage is already sloppy and bubbling around you.";
        }
      }
    } else {
      baseText = pickFrom([
        `You hilt your ${climaxCock} in ${name}'s ${label} and come, spilling your release deep inside the unconscious body. Their passage clenches weakly around you, purely reflex, as you drain yourself into them${priorLoad ? ", adding to the load already pooled inside" : ""}.`,
        `You bury yourself to the root in ${name}'s slack ${label} and let go, thick spurts flooding the unresisting passage. The body only clenches weakly around your ${climaxCock}; whatever it cannot hold slowly seeps out around you.`
      ]);
    }

    item.bodyClimaxCount = (item.bodyClimaxCount || 0) + 1;
    item.bodyClimaxTarget = target;
    const actionDesc = "climax inside " + label;
    polishBodyNarration(item, actionDesc, baseText);
    // Record AFTER the polish prompt is built - the just-deposited
    // load must not read as an EARLIER load in the prompt.
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(item, target, { loadKey: "vanilla ice cream", useKind: "penetrate" });
    // The finish leaves a lingering reek on the body (examine, later
    // polish prompts, and the Care group all read it back).
    if (typeof window.addSmellMark === "function") {
      window.addSmellMark(item, "vanilla ice cream");
      if (target === "anus" || target === "cloaca") window.addSmellMark(item, "anal");
    }
    window.rememberStoryEvent("combat", `${window.G.player.name} ejaculated into ${name}'s ${label} while they were unconscious.`, 8);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // Withdraw from a hole the player is currently inside (penetratedTarget
  // or mouthUsed). This is the only place the unconscious flow narrates a
  // pull-out — and therefore the only place an internal ejaculation gets
  // its aftermath: the load dripping back out, and (for anal, earned by
  // depth/fit) a gape the limp ring is too slack to close.
  // target: "vagina" | "cloaca" | "anus" | "mouth"
  function pullOutBody(item, target) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!nsfwPlayerHasPenis()) return;
    const name = nsfwGetEntityName(item);

    var label;
    if (target === "vagina" || target === "cloaca") {
      if (item.penetratedTarget !== target) return;
      if (!nsfwRegionExposed(item, "genitals")) return;
      label = (target === "cloaca") ? (nsfwGenitalLabel(item) || "cloaca") : "vagina";
    } else if (target === "anus") {
      if (item.penetratedTarget !== "anus") return;
      if (!nsfwRegionExposed(item, "anus")) return;
      label = "anus";
    } else if (target === "mouth") {
      if (!item.mouthUsed) return;
      if (!nsfwRegionExposed(item, "mouth")) return;
      label = "mouth";
    } else return;

    var cock = nsfwBodyCockPhrase();
    var fit = nsfwBodyFit(item, target);
    var isDeep = item.bodyDepthTarget === target && (item.bodyDepth || 0) >= 4;
    var loaded = nsfwBodyHasLoad(item, target);
    // A loaded pull-out leaks - the puddle persists in this room for
    // ~20 turns (addRoomMess/getRoomMessNotes). Oral loads are
    // swallowed, not dripped.
    if (loaded && target !== "mouth" && typeof window.addRoomMess === "function" && window.G && window.G.activeRoom) {
      window.addRoomMess(window.G.activeRoom, "vanilla ice cream");
    }

    var baseText;
    if (label === "mouth") {
      baseText = pickFrom([
        `You slide your ${cock} from ${name}'s slack mouth, their lips drifting closed over nothing. A thread of spit stretches and snaps between you and their chin; they breathe on, oblivious.`,
        `You withdraw from ${name}'s limp mouth with one slow pull, your crown dragging across their lolling tongue before it clears their lips. The body swallows once, purely reflex.`
      ]);
      if (loaded) {
        baseText += pickFrom([
          ` The seed pooled on their tongue seeps past their slack lips as you leave, running from the corner of their mouth in a thin white line.`,
          ` They never stir as your load dribbles out after your ${cock}, a slow trickle over their lower lip that they are too deep under to feel.`
        ]);
      }
    } else if (label === "anus") {
      if (fit === "resistance") {
        baseText = pickFrom([
          `You drag your ${cock} out of ${name}'s tight anus a stubborn inch at a time — the reflexive ring clings to you the whole way, gripping without an owner behind it, and you finally wrench free with a soft, wet pop.`,
          `The unconscious ring fights your exit exactly as it fought your entry: you pull back slowly, feeling the clench drag along every inch of your ${cock}, until the head pops loose and ${name} stays exactly as they were.`
        ]);
      } else if (fit === "easy") {
        baseText = pickFrom([
          `Your ${cock} slides from ${name}'s loosened anus with barely any resistance at all, the well-used hole simply letting you go.`,
          `You slip free of ${name}'s slack anus in one easy pull, the stretched passage too relaxed to hold you.`
        ]);
      } else {
        baseText = pickFrom([
          `You pull your ${cock} from ${name}'s clenching anus, the reflexive ring gripping you to the very last inch before you slip free.`,
          isDeep
            ? `You draw the full length of your ${cock} out of ${name}'s depths, the slow drag ending only when the head clears their rim and the unconscious body settles.`
            : `You ease your ${cock} out of ${name}'s anus with a slow, careful pull, their hole gripping weakly around you until you are gone.`
        ]);
      }
      var analLoads = nsfwBodyLoadCount(item, target) || 0;
      if (loaded && analLoads >= 3) {
        // Heavily bred hole: the full filthy withdrawal - puffy matted
        // ring, squirting overflow, failed clench, bubbles and farts,
        // the soiled puddle, and the revulsion-to-admiration beat.
        baseText = `You slowly pull your spent ${cock} out of ${name}'s puffy, swollen sphincter, the rim matted and dark with vanilla ice cream and froth. As your cockhead slides free, a loud squirt of vanilla ice cream streams out of the distended hole — the pink flex of their bowels visible as the opening reflexively tries to tighten closed, and fails. Vanilla ice cream bubbles and lewd, wet farts follow as the stream tapers off, leaving a broad puddle of soiled, brown-streaked vanilla ice cream pooling beneath their limp hips. The reek of raw, spent sex hangs over the body. You feel a short moment of revulsion that quickly gives way to a strange admiration for the filthy mess this session has left.`;
      } else {
        // Gape is EARNED: a bottomed-out session, a size mismatch, or a
        // stretched rim leave the limp ring slow to close (same math as the
        // awake intimacy system's anal pull-out).
        var gapeChance = (isDeep ? 0.45 : 0.15) + (fit === "resistance" ? 0.25 : 0) + (fit === "stretched" ? 0.15 : 0);
        baseText += (Math.random() < Math.min(gapeChance, 0.85))
          ? pickFrom([
              ` The ring stays open behind you — a round, soft gape that closes only slowly, the unconscious muscle too slack to pucker shut.`,
              ` Their hole is left open, winking each time it tries and fails to clench shut, your shape printed into the limp ring.`
            ])
          : ` The ring cinches shut behind you almost at once, clenching once around nothing.`;
        if (loaded) {
          if (analLoads >= 2) {
            // Double-loaded: heavy, obscene overflow.
            baseText += pickFrom([
              ` The moment you withdraw, the packed load comes with you — a thick, glutting squirt that splatters their cheeks and thighs, the slack ring too loose to hold any of it back.`,
              ` Their loosened hole gives up the packed mess immediately: vanilla ice cream bubbles out in loud, wet gurgles, frothing at the ruined rim and pooling beneath their hips.`,
              ` Your withdrawal unstoppers them — the double load escapes in one obscene gush, streaking their crack and landing wetly on the surface beneath.`
            ]);
          } else {
            baseText += pickFrom([
              ` The moment you withdraw, the load you left comes with you — a slow, slick spill from their loosened hole that pools beneath their limp hips.`,
              ` Their unresisting ring squeezes a thick glob of your release out after your ${cock}, and it drools down their crack while they sleep on.`
            ]);
          }
        }
      }
    } else {
      // Vagina / cloaca
      if (fit === "resistance") {
        baseText = `You work your ${cock} out of ${name}'s tight ${label} inch by stubborn inch — the unconscious grip clings even without an owner behind it — and you pop free of the reluctant entrance to a soft, wet sound.`;
      } else if (fit === "stretched") {
        baseText = pickFrom([
          `You ease your ${cock} from ${name}'s stretched ${label}, the slack entrance slow to remember its shape as your girth leaves it.`,
          `Your ${cock} slides out of ${name}'s well-stretched ${label}, the used opening left soft and open around the empty air.`
        ]);
      } else {
        baseText = pickFrom([
          `You draw your ${cock} out of ${name}'s slack ${label} in one slow pull, the unresisting flesh gliding slickly along you until you slip free. Their hole clenches once, purely reflex, then settles.`,
          isDeep
            ? `You drag the full length of your ${cock} from ${name}'s depths, their passage clinging weakly the whole way out until the head clears their entrance with a quiet, wet sound.`
            : `You slip your ${cock} from ${name}'s limp ${label}; the unconscious body offers nothing but one last reflexive clench as you leave it.`
        ]);
      }
      if (loaded) {
        baseText += pickFrom([
          ` Your load follows you out: as soon as you clear the entrance, a slow white trickle spills from their ${label}, running down toward their ass while the body sleeps on.`,
          ` Their entrance clenches as you withdraw, squeezing a thick ribbon of your release out after your ${cock}; it drools lazily from the slack hole.`,
          ` The moment you pull free, the seed you left inside seeps out of their unclenching ${label}, pooling warm beneath their limp hips.`
        ]);
      }
    }

    // Clear the inside state; the recorded internal load (bodyUse) stays —
    // the dripping mess it leaves is what the examine/dried-load narration
    // and later acts keep referencing.
    if (target === "mouth") {
      item.mouthUsed = false;
    } else {
      item.penetratedTarget = null;
    }
    if (item.bodyDepthTarget === target) {
      item.bodyDepth = 0;
      item.bodyDepthTarget = null;
    }

    const actionDesc = "pull out of their " + label;
    polishBodyNarration(item, actionDesc, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} pulled out of ${name}'s ${label} while they were unconscious.`, 2);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // target: "mouth" | "breasts" | "genitals" | "anus"
  function spitOnBody(item, target) {
    if (!item || item.bodyState !== "unconscious") return;
    const name = nsfwGetEntityName(item);
    var label;

    if (target === "mouth") {
      if (!nsfwRegionExposed(item, "mouth")) return;
      label = "face";
    } else if (target === "breasts") {
      if (!nsfwRegionExposed(item, "breasts")) return;
      label = "breasts";
    } else if (target === "genitals") {
      if (!nsfwRegionExposed(item, "genitals")) return;
      label = nsfwGenitalLabel(item) || "genitals";
    } else if (target === "anus") {
      if (!nsfwRegionExposed(item, "anus")) return;
      label = "anus";
    } else return;

    item.spatOn = true;
    item.spitTarget = target;
    const baseText = `You gather spit and let it fall onto ${name}'s ${label}. The unconscious body doesn't flinch — the spit strikes still, unresponsive flesh and runs slowly along the contours.`;
    const actionDesc = "spit on " + label;
    polishBodyNarration(item, actionDesc, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} spat on ${name}'s ${label} while they were unconscious.`, 3);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // ── Extended body interactions ─────────────────────────────
  // Foreplay, the body's own cock, and external finishes — mirroring the
  // awake intimacy system's spread so unconscious bodies get more than
  // kiss/penetrate/spit. Each follows the established pattern: guard,
  // state flags, base text, AI-polish, remember event, save, re-render.

  // Stimulating acts raise a body-stimulus counter; at 3+ the polish
  // prompt gains a reflex-state note (nsfwBodyReflexNote above).
  function nsfwBodyAddStimulus(item, n) {
    item.bodyStimulus = ((item && item.bodyStimulus) || 0) + (n || 1);
  }

  // Grope the bare breasts of the unconscious body.
  function gropeUnconsciousBody(item) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!nsfwBodyHasBreasts(item) || !nsfwRegionExposed(item, "breasts")) return;
    const name = nsfwGetEntityName(item);
    const baseText = pickFrom([
      `You kneel over ${name}'s limp form and take their bare breast in your hand, kneading the soft flesh. The nipple hardens against your palm — a reflex the sleeping body can't suppress.`,
      `You cup and squeeze ${name}'s unresisting breasts, weighing them in your palms. They lie utterly passive under your touch, only their slow breathing lifting the flesh.`
    ]);
    nsfwBodyAddStimulus(item);
    item.groped = true;
    polishBodyNarration(item, "grope breasts", baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} groped ${name}'s breasts while they were unconscious.`, 4);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // Lick a bare region of the body: "nipples" | "vagina" | "cloaca" | "anus".
  function lickUnconsciousBody(item, target) {
    if (!item || item.bodyState !== "unconscious") return;
    const name = nsfwGetEntityName(item);
    var label;
    var baseText;

    if (target === "nipples") {
      if (!nsfwBodyHasBreasts(item) || !nsfwRegionExposed(item, "breasts")) return;
      label = "nipples";
      baseText = pickFrom([
        `You bow over ${name}'s slack form and lap at their bare nipple, then draw it into your mouth and suck. The nub stiffens on your tongue — pure reflex — while the body itself never stirs.`,
        `You suck and tongue ${name}'s unresisting nipple, the flesh warming under your mouth. Their chest keeps rising and falling in slow sleep-breath, ignoring you completely.`
      ]);
    } else if (target === "vagina") {
      if (nsfwBodyGenitalType(item) !== "vagina" || !nsfwRegionExposed(item, "genitals")) return;
      label = "vagina";
      baseText = pickFrom([
        `You spread ${name}'s limp thighs and press your mouth to their bare sex, lapping slow and thorough. Their hips twitch once — a reflex — as you work your tongue through the soft folds.`,
        `You settle between ${name}'s unconscious legs and eat them out at your own unhurried pace, holding their hips still. The flesh flushes warm and slick under your tongue without their knowledge.`
      ]);
    } else if (target === "cloaca") {
      var cg = nsfwBodyGenitalType(item);
      if (cg !== "cloaca-vent" && cg !== "cloaca-penis") return;
      if (!nsfwRegionExposed(item, "genitals")) return;
      label = nsfwGenitalLabel(item) || "cloacal vent";
      baseText = `You spread ${name}'s limp thighs and lap over their ${label}, the smooth scales warm under your tongue. The vent twitches faintly — reflex only — as you work it.`;
    } else if (target === "anus") {
      if (!nsfwBodyHasAnus(item) || !nsfwRegionExposed(item, "anus")) return;
      label = "anus";
      baseText = pickFrom([
        `You spread ${name}'s cheeks with both hands and drag your tongue over their unmoved pucker, circling it slow. The ring clamps down once against your tongue — the body's only answer.`,
        `You rim ${name}'s unconscious body thoroughly, their limp form giving no reaction but the occasional reflexive clench under your tongue.`
      ]);
    } else return;

    nsfwBodyAddStimulus(item);
    item.licked = true;
    polishBodyNarration(item, "lick " + label, baseText);
    // Record AFTER the polish prompt is built - see deepthroatBody.
    if (target !== "nipples" && typeof window.recordBodyUse === "function") {
      window.recordBodyUse(item, target, { useKind: "mouth" });
    }
    window.rememberStoryEvent("combat", `${window.G.player.name} licked ${name}'s ${label} while they were unconscious.`, 5);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // Stroke the body's cock (any player). The first stroke narrates the
  // reflex stiffening; later strokes work the stiffened shaft.
  function strokeBodyCock(item) {
    if (!item || item.bodyState !== "unconscious") return;
    if (nsfwBodyGenitalType(item) !== "penis") return;
    if (!nsfwRegionExposed(item, "genitals")) return;
    const name = nsfwGetEntityName(item);
    var wasStiff = !!item.bodyCockStiff;
    var baseText = wasStiff
      ? pickFrom([
        `You work ${name}'s stiffened cock in slow strokes, the flesh twitching in your grip. The hips buck once in pure reflex; the body itself sleeps on.`,
        `You stroke the unconscious cock steadily, thumbing the slick head. ${name} gives no sign of knowing — only the reflex-throb in your hand.`
      ])
      : `You take ${name}'s soft, slack cock in hand and work it with slow strokes. It swells and hardens in your grip — pure reflex — while their face stays slack and unbothered.`;
    nsfwBodyAddStimulus(item);
    item.bodyCockStiff = true;
    item.cockStroked = true;
    polishBodyNarration(item, "stroke cock", baseText);
    // Record AFTER the polish prompt is built - see deepthroatBody.
    if (!wasStiff && typeof window.recordBodyUse === "function") window.recordBodyUse(item, "penis", { useKind: "hand" });
    window.rememberStoryEvent("combat", `${window.G.player.name} stroked ${name}'s cock while they were unconscious.`, 5);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // Mount / continue riding the body's reflex-stiff cock. Only for
  // players WITHOUT a penis (penis players use the Penetrate groups).
  function rideBodyCock(item) {
    if (!item || item.bodyState !== "unconscious") return;
    if (nsfwPlayerHasPenis()) return;
    if (nsfwBodyGenitalType(item) !== "penis") return;
    if (!item.bodyCockStiff) return;
    if (!nsfwRegionExposed(item, "genitals")) return;
    const name = nsfwGetEntityName(item);
    var wasRiding = !!item.bodyRidden;
    var baseText = wasRiding
      ? pickFrom([
        `You ride ${name}'s stiff cock at your own pace, your hips rolling while the body lies passive beneath you. It twitches inside you on reflex alone.`,
        `You grind down onto the unconscious cock, doing all the work yourself. The only answer from ${name} is a faint reflex-buck of their hips.`
      ])
      : `You straddle ${name}'s limp form, line up their reflex-stiff cock, and sink down onto it. The body doesn't stir beyond a single twitch — you take your pleasure from unconscious flesh.`;
    nsfwBodyAddStimulus(item);
    item.bodyRidden = true;
    item.rideCount = ((item && item.rideCount) || 0) + 1;
    polishBodyNarration(item, wasRiding ? "ride cock" : "mount cock", baseText);
    // Record AFTER the polish prompt is built - see deepthroatBody.
    if (!wasRiding && typeof window.recordBodyUse === "function") window.recordBodyUse(item, "penis", { useKind: "penetrate" });
    window.rememberStoryEvent("combat", `${window.G.player.name} ${wasRiding ? "continued riding" : "mounted and rode"} ${name}'s cock while they were unconscious.`, 7);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // The riding player's own climax on the unconscious body.
  function riderClimaxBody(item) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!item.bodyRidden) return;
    const name = nsfwGetEntityName(item);
    var baseText = pickFrom([
      `You grind down hard and come on ${name}'s stiff cock, your climax rolling through you while the body beneath stays limp and oblivious. The cock keeps twitching inside you by reflex.`,
      `You bring yourself off riding the unconscious cock, clenching around it as waves take you. ${name} sleeps through your orgasm completely.`
    ]);
    item.riderClimaxCount = ((item && item.riderClimaxCount) || 0) + 1;
    polishBodyNarration(item, "rider climax", baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} climaxed while riding ${name}'s unconscious body.`, 7);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // F/f tribadism or the non-binary generic grind: the player's own
  // genitals rub against the body's bare genitals. mode: "pussy" (female
  // player, vagina body) | "generic" (non-binary, any genital type).
  function grindBody(item, mode) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!nsfwRegionExposed(item, "genitals")) return;
    var anatomy = nsfwPlayerAnatomy();
    var genType = nsfwBodyGenitalType(item);
    if (mode === "pussy" && !(anatomy === "vagina" && genType === "vagina")) return;
    if (mode === "generic" && anatomy !== "both") return;
    const name = nsfwGetEntityName(item);
    var genLabel = nsfwGenitalLabel(item) || "sex";
    var baseText;
    if (mode === "pussy") {
      baseText = pickFrom([
        `You straddle ${name}'s limp form and press your bare pussy flush against theirs, grinding in slow circles. Their folds lie slack and cool against your heat; the only answer is a faint, sleeping twitch each time your hips roll.`,
        `You settle between ${name}'s unresisting thighs and slot your pussy against their bare one, rocking in a slow rhythm. Nothing stirs but the reflex buck of a sleeping body beneath you.`
      ]);
    } else {
      baseText = pickFrom([
        `You straddle ${name}'s unconscious body and grind your sex against their bare ${genLabel}, slow and deliberate. The body only rocks with your rhythm, offering limp, unresisting flesh.`,
        `You press your sex to ${name}'s exposed ${genLabel} and roll your hips, taking your friction from flesh that cannot know it is being used.`
      ]);
    }
    item.bodyGrindCount = ((item && item.bodyGrindCount) || 0) + 1;
    nsfwBodyAddStimulus(item);
    polishBodyNarration(item, mode === "pussy" ? "grind pussies" : "grind", baseText);
    window.rememberStoryEvent("combat", mode === "pussy"
      ? `${window.G.player.name} ground their pussy against ${name}'s while they were unconscious.`
      : `${window.G.player.name} ground against ${name}'s exposed sex while they were unconscious.`, 6);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // Face riding: the player sits on the unconscious face and takes what
  // they want from the slack mouth. mode: "rim" (penis/vagina players,
  // their hole gets serviced), "pussy" (vagina players), "generic"
  // (non-binary — their sex gets serviced, no anatomy assumption).
  function rideFaceBody(item, mode) {
    if (!item || item.bodyState !== "unconscious") return;
    if ((item.bodyPosition || "back") !== "back") return;
    if (!nsfwRegionExposed(item, "mouth")) return;
    var anatomy = nsfwPlayerAnatomy();
    if (mode === "pussy" && anatomy !== "vagina") return;
    if (mode === "generic" && anatomy !== "both") return;
    const name = nsfwGetEntityName(item);
    var wasRiding = !!item.faceRidden;
    item.faceRidden = true;
    item.faceRideMode = mode;
    item.faceRideCount = ((item && item.faceRideCount) || 0) + 1;
    var baseText;
    if (mode === "rim") {
      baseText = wasRiding
        ? pickFrom([
          `You keep your cheeks spread over ${name}'s lax face, rocking your hole against their slack lips and idle tongue. Their breath stutters warm against your skin — reflex, nothing more.`,
          `You ride ${name}'s face unhurried, your hole seated against their open mouth. The sleeping tongue stirs in soft, brainless flickers while you take your pleasure.`
        ])
        : pickFrom([
          `You kneel either side of ${name}'s slack head and sink down, spreading your cheeks so your hole seats right against their parted lips. The sleeping mouth offers warm, passive wetness; you set the pace and use it.`,
          `You lower your bare rear onto ${name}'s upturned face, your hole settling flush against their slack lips. Their tongue lies soft and unresisting as you roll your hips, riding the unconscious mouth for your rimming.`
        ]);
    } else if (mode === "pussy") {
      baseText = wasRiding
        ? pickFrom([
          `You ride ${name}'s lax face at your leisure, your slick folds dragging over their slack lips and idle tongue. The only sounds are your own breath and the slow pulse of theirs against you.`,
          `You rock your pussy over ${name}'s sleeping face, their nose and mouth flush against you. Nothing answers but a reflexive flicker of tongue as you grind.`
        ])
        : pickFrom([
          `You straddle ${name}'s head and lower your bare pussy over their upturned face, rocking until your folds part around the bridge of their nose and their slack lips. Their mouth is warm, wet and utterly passive — you set the pace and use it.`,
          `You settle your pussy down over ${name}'s sleeping face, pressing your folds to their lax lips. Nothing answers you but reflex — a sleepy flick of tongue against your clit as you roll your hips.`
        ]);
    } else {
      baseText = wasRiding
        ? `You ride ${name}'s lax face steadily, your sex pressed to their unresisting mouth, taking your pleasure from a face that cannot refuse it.`
        : pickFrom([
          `You straddle ${name}'s head and lower your bare sex to their upturned mouth, rocking your hips. The sleeping face serves you — lips, tongue and warmth, all passive beneath you.`,
          `You sit your bare sex on ${name}'s slack face and roll slowly, letting the unconscious mouth serve you in its mindless warmth.`
        ]);
    }
    polishBodyNarration(item, mode === "rim" ? "ride face (rimming)" : (mode === "pussy" ? "ride face (pussy)" : "ride face"), baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} rode ${name}'s face while they were unconscious.`, 6);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // Generic penetration for non-binary ("both") players: the player's sex
  // enters the body without the narration ever naming a cock. Shares the
  // penetratedTarget/bodyDepth state with the penis path so the menu's
  // continuation and climax buttons read the same. target: "vagina" |
  // "cloaca" | "anus"
  function penetrateBodyGeneric(item, target) {
    if (!item || item.bodyState !== "unconscious") return;
    if (nsfwPlayerAnatomy() !== "both") return;
    const name = nsfwGetEntityName(item);
    var label = target === "anus" ? "anus" : (target === "cloaca" ? (nsfwGenitalLabel(item) || "cloacal vent") : "vagina");
    // Check if player's penis is slimed (for "both" anatomy, this means their generic sex organ is slimed)
    const penisSlimed = typeof window.isPlayerPenisSlimed === "function" && window.isPlayerPenisSlimed();
    if (!penisSlimed && !nsfwRegionExposed(item, target === "anus" ? "anus" : "genitals")) return;
    var baseText;
    if (target === "vagina" || target === "cloaca") {
      baseText = pickFrom([
        `You spread ${name}'s limp legs apart and guide your sex against their exposed ${label}, pressing in bit by bit while the unconscious body takes you in silence. ` + nsfwBodyUseClause(item, target),
        `You position ${name}'s slack hips with both hands and ease your sex into their unresisting ${label}, working deeper with slow rolls of your hips. ` + nsfwBodyUseClause(item, target)
      ]);
    } else {
      baseText = pickFrom([
        `You press your sex to ${name}'s tight, unresisting anus and push in slowly, forcing the slack ring to open around you. ` + nsfwBodyUseClause(item, target),
        `You spread ${name}'s limp cheeks and ease yourself into their unresisting hole, the sleeping body flinching faintly as it is made to take you. ` + nsfwBodyUseClause(item, target)
      ]);
    }
    item.penetrated = true;
    item.penetratedTarget = target;
    item.bodyDepth = 1;
    item.bodyDepthTarget = target;
    polishBodyNarration(item, "penetrate " + label, baseText);
    // Record AFTER the polish prompt is built - see deepthroatBody.
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(item, target, { useKind: "penetrate" });
    window.rememberStoryEvent("combat", `${window.G.player.name} penetrated ${name}'s ${label} while they were unconscious.`, 8);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // Continuation thrusting for the generic (non-binary) penetration.
  // target: "vagina" | "cloaca" | "anus"
  function thrustBodyGeneric(item, target) {
    if (!item || item.bodyState !== "unconscious") return;
    if (nsfwPlayerAnatomy() !== "both") return;
    if (item.penetratedTarget !== target) return;
    if (!nsfwRegionExposed(item, target === "anus" ? "anus" : "genitals")) return;
    const name = nsfwGetEntityName(item);
    var label = target === "anus" ? "anus" : (target === "cloaca" ? (nsfwGenitalLabel(item) || "cloacal vent") : "vagina");
    var baseText = pickFrom([
      `You move inside ${name}'s limp ${label} in slow strokes, their unresisting body rocking with your rhythm. ` + nsfwBodyUseClause(item, target),
      `You grind into ${name}'s unconscious body, seated deep in their ${label} while they sleep through every motion. ` + nsfwBodyUseClause(item, target)
    ]);
    item.bodyThrustCount = ((item && item.bodyThrustCount) || 0) + 1;
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(item, target, { useKind: "penetrate" });
    polishBodyNarration(item, "thrust " + label, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} kept moving inside ${name}'s ${label} while they were unconscious.`, 6);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // Generic finish inside for non-binary ("both") players - no cock or
  // ejaculation wording, so no load or smell marks are recorded.
  // target: "vagina" | "cloaca" | "anus"
  function climaxBodyGeneric(item, target) {
    if (!item || item.bodyState !== "unconscious") return;
    if (nsfwPlayerAnatomy() !== "both") return;
    if (item.penetratedTarget !== target) return;
    if (!nsfwRegionExposed(item, target === "anus" ? "anus" : "genitals")) return;
    const name = nsfwGetEntityName(item);
    var label = target === "anus" ? "anus" : (target === "cloaca" ? (nsfwGenitalLabel(item) || "cloaca") : "vagina");
    var baseText = pickFrom([
      `You sheathe yourself to the root in ${name}'s ${label} and come, your climax rolling through the unconscious body beneath you. ${name} never stirs.`,
      `You press deep into ${name}'s limp ${label} and let go, shuddering through your finish while they sleep, utterly oblivious.`
    ]);
    item.bodyClimaxCount = (item.bodyClimaxCount || 0) + 1;
    item.bodyClimaxTarget = target;
    polishBodyNarration(item, "climax inside " + label, baseText);
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(item, target, { useKind: "penetrate" });
    window.rememberStoryEvent("combat", `${window.G.player.name} finished inside ${name}'s ${label} while they were unconscious.`, 7);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // External finish: masturbate over the body (or pull out first while
  // inside) and spend on it. target: "face" | "chest" | "stomach" | "genitals".
  function finishOnBody(item, target) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!nsfwPlayerHasPenis()) return;
    const name = nsfwGetEntityName(item);
    var inside = item.penetratedTarget || (item.mouthUsed ? "mouth" : null);
    var label;
    if (target === "face") {
      if (!nsfwRegionExposed(item, "mouth")) return;
      label = "face";
    } else if (target === "chest") {
      if (!nsfwRegionExposed(item, "breasts")) return;
      label = "chest";
    } else if (target === "stomach") {
      if ((item.bodyPosition || "back") === "face" || nsfwBodySlotPresent(item, "upper")) return;
      label = "stomach";
    } else if (target === "genitals") {
      if (!nsfwRegionExposed(item, "genitals")) return;
      label = "genitals";
    } else return;
    var baseText = inside
      ? `You pull out of ${name}'s ${inside} and strip off, stroking yourself over their limp body. You come across their ${label}, the release striping unconscious flesh that doesn't flinch.`
      : `You stand over ${name}'s unconscious body and work yourself, eyes on their slack face. You come across their ${label}, the release landing on flesh that doesn't flinch.`;
    // The inside text narrates the withdrawal - clear the inside state so
    // the menu stops offering continuation/finish-inside for a hole the
    // player already left (pullOutBody owns the withdrawal narration when
    // the player stays; this is the pull-out bundled with an external
    // finish).
    if (inside === "mouth") {
      item.mouthUsed = false;
      if (item.bodyDepthTarget === "mouth") { item.bodyDepth = 0; item.bodyDepthTarget = null; }
    } else if (inside) {
      item.penetratedTarget = null;
      if (item.bodyDepthTarget === inside) { item.bodyDepth = 0; item.bodyDepthTarget = null; }
    }
    item.bodyMarks = ((item && item.bodyMarks) || 0) + 1;
    item.marksTarget = label;
    polishBodyNarration(item, "finish on " + label, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} finished on ${name}'s ${label} while they were unconscious.`, 6);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // Automatic raise-back: called by the SFW engine's leaveRoomObject() when
  // the player ends their session with the body. If the bottom was lowered
  // out of the way (item.bodyLowered), it is hauled back up over the hips so
  // the body isn't left half-undressed. Printed directly (no AI polish): the
  // engine clears activeObject right after this call, so an in-flight polish
  // would be discarded anyway.
  function restoreLoweredBodyGarment(item) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!item.bodyLowered) return;
    if (!nsfwBodySlotPresent(item, "lower")) {
      delete item.bodyLowered;
      return;
    }
    delete item.bodyLowered;
    const name = nsfwGetEntityName(item);
    const garment = item.equipped.lower && item.equipped.lower.name
      ? item.equipped.lower.name : "bottom";
    const baseText = pickFrom([
      `Before you step away, you haul ${name}'s ${garment} back up over their hips, leaving them covered and decent.`,
      `You tug ${name}'s ${garment} back into place over their hips as you leave them lying there.`,
      `On your way out, you pull ${name}'s ${garment} back up around their waist — no need to leave them bare.`
    ]);
    nsfwPrintBodyNarration(baseText, REPOSITION_PRINT_OPTIONS);
    window.rememberStoryEvent("care", `${window.G.player.name} pulled ${name}'s ${garment} back up before stepping away.`, 2);
    window.saveGameState();
  }

  // ── Clothing actions on the body ────────────────────────────────
  // Three ways to get clothing out of the way. Remove works the garment
  // off into the player's inventory (it stays wearable). Tear rips it
  // off — the torn remains land on the room floor, flagged ruined so they
  // can never be equipped again. Lower bottoms pulls the bottom down to
  // the thighs: it stays worn (item.bodyLowered) but stops blocking
  // lower-body access. slot: "upper" | "lower".

  function removeBodyGarment(item, slot) {
    if (!item || item.bodyState !== "unconscious") return;
    if (slot !== "upper" && slot !== "lower") return;
    if (!nsfwBodySlotPresent(item, slot)) return;
    const name = nsfwGetEntityName(item);
    const garment = item.equipped[slot];
    let taken = null;
    if (window.G && window.G.player && Array.isArray(window.G.player.inventory)) {
      delete item.equipped[slot];
      window.G.player.inventory.push(garment);
      taken = garment;
    } else if (typeof window.dropWornClothingToRoom === "function") {
      // No player inventory available — fall back to the room floor.
      taken = window.dropWornClothingToRoom(item, slot);
    }
    if (!taken) return;
    if (slot === "lower") delete item.bodyLowered;
    const garmentName = taken && taken.name ? taken.name : (slot === "upper" ? "top" : "bottom");
    const baseText = pickFrom([
      `You work ${name}'s ${garmentName} off their limp body, hauling dead-weight hips and flopping arms free of it, and fold it into your pack. They lie utterly passive as you strip them.`,
      `You peel the ${garmentName} from ${name}'s unconscious form, their limbs flopping as you tug it free, and pocket it. The bared flesh underneath doesn't so much as stir.`
    ]);
    polishBodyNarration(item, "remove " + (slot === "upper" ? "top" : "bottom"), baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} removed the ${garmentName} from ${name}'s unconscious body and took it.`, 3);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  function tearBodyGarment(item, slot) {
    if (!item || item.bodyState !== "unconscious") return;
    if (slot !== "upper" && slot !== "lower") return;
    if (!nsfwBodySlotPresent(item, slot)) return;
    const name = nsfwGetEntityName(item);
    let dropped = null;
    if (typeof window.dropWornClothingToRoom === "function") {
      dropped = window.dropWornClothingToRoom(item, slot);
    }
    if (!dropped) {
      // Drop failed (no room available) — the tear still happens, the
      // torn remains are simply lost rather than placed.
      if (item.equipped && item.equipped[slot]) {
        dropped = item.equipped[slot];
        delete item.equipped[slot];
        dropped = null;
      } else {
        return;
      }
    }
    if (dropped) {
      const tornName = (typeof window.getItemName === "function"
        ? window.getItemName(dropped)
        : (dropped.name || (slot === "upper" ? "top" : "bottom")));
      dropped.name = "Torn " + tornName;
      dropped.ruined = true;
      if (typeof dropped.description === "string") {
        dropped.description = "Ripped from " + name + "'s unconscious body. Too damaged to ever wear again.";
      }
    }
    if (slot === "lower") delete item.bodyLowered;
    const garment = slot === "upper" ? "top" : "bottom";
    const baseText = pickFrom([
      `You seize ${name}'s ${garment} and wrench it apart with both hands — seams burst, fabric shrieks, and the torn remains flutter to the floor. The flesh underneath is bared in one rough motion.`,
      `You grip ${name}'s ${garment} and tear it straight off their limp body, the fabric giving way with a ragged rip. They don't stir as the ruined scraps fall away.`
    ]);
    polishBodyNarration(item, "tear " + garment, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} tore the ${garment} off ${name}'s unconscious body, ruining it.`, 3);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  function lowerBodyGarment(item) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!nsfwBodySlotPresent(item, "lower")) return;
    if (item.bodyLowered) return;
    item.bodyLowered = true;
    const name = nsfwGetEntityName(item);
    const garment = item.equipped.lower && item.equipped.lower.name
      ? item.equipped.lower.name : "bottom";
    const baseText = pickFrom([
      `You hook your fingers into ${name}'s ${garment} and haul it down off their hips to their thighs, baring them without pulling it free. Their limp body offers no resistance as you tug it into place.`,
      `You tug ${name}'s ${garment} down past their hips, leaving it wadded at their thighs — half off, fully out of the way. They lie passive beneath your hands.`
    ]);
    polishBodyNarration(item, "lower bottom", baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} lowered ${name}'s ${garment} to their thighs.`, 3);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // === Unconscious body: examine narration (NSFW) ==========================
  // Exposed as window.describeUnconsciousBodyExamine so the SFW engine's
  // examineRoomObject() can call it behind a typeof guard when NSFW is
  // enabled. Claims the examine with a truthy return; the narration is
  // printed by polishBodyExamine once the background ai() call has polished
  // the base description into a more intimate, sensory account of the
  // unconscious body — the base text is never shown first. Mirrors
  // polishBodyNarration but is read-only (the player is just looking, not
  // acting on the body).

  // ── Clothing + position exposure context ──────────────────────
  // Derives, at call time, what the player can see of an unconscious body:
  //   1. Which regions are covered, from item.equipped (upper → chest, lower →
  //      groin/rear). Looting via Search deletes these slots, so this stays live.
  //   2. Which of the *exposed* regions are actually visible in the current
  //      bodyPosition (back → chest + groin; side → chest + groin + rear;
  //      face → rear only).
  //   3. Anatomy descriptors for the visible+exposed parts, pulled from
  //      item.nsfwTraits.anatomy (and item.anatomy for build/skin context).
  // Returns a prompt note string. Empty string when nothing is exposed, so
  // callers can simply concatenate it. No new persistent state is written.

  function nsfwBodySlotPresent(item, slot) {
    var eq = item && item.equipped;
    if (!eq || typeof eq !== "object") return false;
    var v = eq[slot];
    return !!v && !Array.isArray(v);
  }

  // Position → which anatomy regions are visible when their garment is gone.
  // Each entry lists the nsfwTraits.anatomy keys that are exposed/visible in
  // that pose when the corresponding slot (upper/lower) is missing.
  console.log("[BODY-DEBUG] IIFE before BODY_POSITION_VISIBLE (line ~1988)");
  var BODY_POSITION_VISIBLE = {
    back: {   // front of the body faces up
      upper: ["breasts", "nipples"],
      // No "pubicHair" here: grooming details must come from the creature's
      // own anatomy profile (genital descriptions), never be force-exposed
      // by pose alone.
      lower: ["vagina", "penis"]
    },
    side: {   // profile; front and rear both reachable
      upper: ["breasts", "nipples"],
      lower: ["vagina", "penis", "buttocks"]
    },
    face: {   // face-down; back and rear visible
      upper: [],            // back is bare but has no anatomy descriptor key
      lower: ["buttocks"]
    }
  };

  function buildBodyExposureNote(item) {
    if (!item) return "";
    var position = item.bodyPosition || "back";
    var visibleMap = BODY_POSITION_VISIBLE[position] || BODY_POSITION_VISIBLE.back;
    var upperCovered = nsfwBodySlotPresent(item, "upper");
    var lowerCovered = nsfwBodySlotPresent(item, "lower");
    // A lowered bottom (pulled down to the thighs, still worn) leaves the
    // lower regions bare exactly like a missing garment does.
    var lowerAside = !lowerCovered || !!item.bodyLowered;

    // Collect the anatomy keys visible because their covering garment is
    // gone (or lowered out of the way).
    var exposedKeys = [];
    if (!upperCovered && visibleMap.upper.length) {
      exposedKeys = exposedKeys.concat(visibleMap.upper);
    }
    if (lowerAside && visibleMap.lower.length) {
      exposedKeys = exposedKeys.concat(visibleMap.lower);
    }

    var parts = [];
    var nsfwAnatomy = (item.nsfwTraits && item.nsfwTraits.anatomy) || {};
    for (var i = 0; i < exposedKeys.length; i++) {
      var key = exposedKeys[i];
      var data = nsfwAnatomy[key];
      if (data) parts.push(key + ": " + JSON.stringify(data));
    }

    var notes = [];
    // Clothing status line — always useful framing for the AI.
    var clothingParts = [];
    if (upperCovered) clothingParts.push("upper garment on (chest covered)");
    else clothingParts.push("upper garment gone (chest/breasts bare)");
    if (lowerCovered && item.bodyLowered) {
      clothingParts.push("lower garment lowered to their thighs, still worn but out of the way (groin/rear bare)");
    } else if (lowerCovered) {
      clothingParts.push("lower garment on (groin/rear covered)");
    } else {
      clothingParts.push("lower garment gone (groin/rear bare)");
    }
    notes.push("Clothing: " + clothingParts.join("; ") + ".");

    // Position-specific note for poses the intimacy anatomy keys don't cover.
    if (position === "face" && !upperCovered) {
      notes.push("The NPC is face-down; their bare back is exposed to view.");
    }

    if (parts.length) {
      notes.push("VISIBLE/EXPOSED ANATOMY (only these parts are bare and visible in this pose):\n" + parts.join("\n"));
    }

    return "\n" + notes.join("\n");
  }

  function describeBodyExamineBase(item) {
    nsfwEnsureBodyTraits(item);
    var name = nsfwGetEntityName(item);
    var isCorpse = item.bodyState === "corpse";
    var position = item.bodyPosition || "back";
    var positionPhrase = position === "face" ? "face-down" : "on their " + position;
    var wounds = typeof window.describeCombatWounds === "function"
      ? window.describeCombatWounds(item) : "";
    var ctx = item.defeatContext || {};

    var base = isCorpse
      ? name + " lies " + positionPhrase + ", still and lifeless, utterly at your mercy."
      : name + " lies " + positionPhrase + ", utterly still and at your mercy.";
    if (ctx.cause === "bleeding") {
      base += isCorpse
        ? " Dark, tacky stains mark where the wounds bled out."
        : " Slow bleeding has left them pale and flushed.";
    } else if (ctx.crit && ctx.target === "head") {
      base += " A dark bruise spreads across the skull.";
    }
    if (wounds) base += " Visible wounds: " + wounds + ".";
    return base;
  }

  function buildBodyExaminePrompt(item, baseText) {
    var name = nsfwGetEntityName(item);
    var isCorpse = item.bodyState === "corpse";
    var species = (item.species || "human").toLowerCase();
    var gender = item.gender || "unknown";
    var position = item.bodyPosition || "back";
    var wounds = typeof window.describeCombatWounds === "function"
      ? window.describeCombatWounds(item) : "";

    var speciesNote = species !== "human"
      ? "\nThe NPC is a " + species + ". Include species-appropriate physical details (skin, texture, features)."
      : "";
    var woundNote = wounds
      ? "\nThe NPC has visible wounds: " + wounds + ". Reference them subtly if relevant."
      : "";
    var exposureNote = buildBodyExposureNote(item);

    // Lingering body-state from recent use (recordBodyUse): every part with
    // an active descriptor gets mentioned, so examine reflects what has
    // been done to the body - not just what it looks like fresh.
    var bodyUseLines = [];
    if (typeof window.getBodyUseDescriptor === "function") {
      ["vagina", "anus", "mouth", "breasts", "penis"].forEach(function (part) {
        var d = window.getBodyUseDescriptor(item, part);
        if (d) bodyUseLines.push("their " + part + " " + d);
      });
    }
    var bodyUseNote = bodyUseLines.length
      ? "\nBODY STATE (from recent use - reference subtly, only where visible/relevant): " + bodyUseLines.join("; ") + "."
      : "";

    var stateLine = isCorpse
      ? "currently dead — a lifeless corpse lying " + (position === "face" ? "face-down" : "on their " + position) + ", completely at the player's mercy."
      : "currently unconscious and lying " + (position === "face" ? "face-down" : "on their " + position) + ", completely at the player's mercy.";

    var stateInstr = isCorpse
      ? "- The NPC is DEAD — emphasize the stillness, pallor, and lifelessness of the body. No breathing, no movement, no response."
      : "- The NPC is unconscious — emphasize their limp, vulnerable, unresponsive state.";

    return [
"You are polishing a player 'examine' description from a text adventure game.",
"The NPC is " + name + ", a " + species + " " + gender + ", " + stateLine + speciesNote + woundNote + exposureNote + bodyUseNote,
"",
"INSTRUCTIONS:",
"- Polish the BASE TEXT below. Make it vivid, sensory, and intimate — the player is taking in the body.",
"- Keep the same meaning and details. Do NOT invent new actions or body parts.",
"- Write in second person (\"You ...\"). This is the player's perspective.",
"- This is a ONE-WAY observation: the player is looking at an unconscious body. The NPC cannot respond, react, shift, murmur, or show any awareness — they are a limp, unresponsive body being observed.",
stateInstr,
"- Use the clothing + exposure context above: describe only what is actually visible in this pose. If anatomy is listed as exposed, you may reference it sensually; if a region is covered, do not describe what is hidden beneath it.",
"- You may note the body's exposure, positioning, and the player's control over them. Intimate and sensual framing is allowed; keep it tasteful and to 1-2 sentences.",
"- Use direct, physical language. No metaphors, no purple prose.",
"- Do NOT add NPC dialogue, speech, moans, sighs, or any reaction. The NPC is " + (isCorpse ? "dead" : "unconscious") + " and cannot participate.",
"- Do NOT add inner monologue. Stay on the body and what the player observes.",
"",
"BASE TEXT (polish this — refine, make more vivid, keep same meaning and details):",
"\"" + baseText + "\"",
"",
"IMPORTANT: Output ONLY the polished text. No explanations, no meta-discussion. Just the polished sentence.",
"",
"RESPOND with only the polished text, nothing else:"
    ].join("\n");
  }

  // Fire a background ai() call to polish the examine narration and print
  // only once the polished text returns — the base text is never written
  // first and then overwritten. A dimmed "Looking closer..." placeholder sits
  // in the log while the polish is in flight and is removed when the real
  // text prints. Falls back to the base text when the polish fails, or when
  // the player has moved on to another view.
  function polishBodyExamine(item, baseText) {
    var _ai = typeof window.ai === "function" ? window.ai : null;
    if (!_ai) { nsfwPrintBodyNarration(baseText); return; }

    var pendingEntry = nsfwShowBodyPendingNarration("Looking closer...");
    (async function() {
      var polished = null;
      try {
        var prompt = buildBodyExaminePrompt(item, baseText);
        var result = await _ai({
          instruction: prompt,
          startWith: "",
          endButtons: "none",
          generatorName: "cyoaftw-engine-core"
        });
        polished = result && (result.text || result);
        if (polished && polished.trim()) {
          // Reject meta-commentary (same guard as the intimacy / body-action paths)
          var isMeta = /since the base|please provide|I cannot|I'm unable|as an ai|i'll polish|here is the|here's the/i.test(polished.trim());
          if (isMeta) {
            console.log("[Body Actions] Examine narration rejected (meta-commentary).");
            polished = null;
          }
        } else {
          polished = null;
        }
      } catch (e) {
        console.warn("[Body Actions] Examine narration polish failed:", e);
      }

      if (window.G && window.G.activeObject !== item) polished = null;
      nsfwRemoveBodyPendingNarration(pendingEntry);
      nsfwPrintBodyNarration(polished ? polished.trim() : baseText);
    })();
  }

  console.log("[BODY-DEBUG] IIFE reached line ~2153 (about to assign describeUnconsciousBodyExamine)");
  window.describeUnconsciousBodyExamine = function(item) {
    if (!item || item.bodyState !== "unconscious") return null;
    // Claims the examine for the SFW engine (truthy return). The narration
    // is printed by polishBodyExamine once the AI polish returns — the base
    // text is never written first.
    polishBodyExamine(item, describeBodyExamineBase(item));
    return true;
  };

  // Append-only hook called by the SFW engine's renderRoomObjectActionMenu
  // after it has rendered the standard body buttons. Adds the NSFW body-action
  // groups (Kiss, Position, Oral, Penetrate, Spit) to the same container.
  window.appendUnconsciousBodyActions = function(item, el) {
    console.log("[BODY-DEBUG] NSFW appendUnconsciousBodyActions called", { bodyState: item && item.bodyState, hasEl: !!el });
    if (!item || item.bodyState !== "unconscious" || !el) {
      console.log("[BODY-DEBUG] NSFW appendUnconsciousBodyActions bailing early", { item: !!item, bodyState: item && item.bodyState, hasEl: !!el });
      return;
    }
    appendUnconsciousBodyGroups(item, el);
    console.log("[BODY-DEBUG] NSFW appendUnconsciousBodyGroups done, child count:", el.children.length);
  };

  // Automatic raise-back hook for the SFW engine's leaveRoomObject():
  // typeof-guarded no-op from the engine's side when NSFW is absent.
  window.restoreLoweredBodyGarment = function(item) {
    restoreLoweredBodyGarment(item);
  };

  // === Off-screen free-use opportunities ============================
  // A hog-tied captive or an unconscious body left in a room is an open
  // opportunity: a lusty NPC sharing that room may use them while the
  // player is elsewhere. Runs from the engine's runNPCAutonomyTick
  // (off-screen rooms only) via window.nsfwFreeUseOpportunityTick — the
  // player never sees the act itself, they find the aftermath: bodyUse and
  // smell marks on the victim (discovered through examine), and seed pooled
  // on the floor through the room liquids system (a spatter per use that
  // builds to a visible pool with repeats, then slowly dries).
  // Opportunity, not certainty: gated by the actor's arousal/lust,
  // temperament, penis anatomy, a per-use chance roll, and a cooldown per
  // victim. A CLOTHED victim can only be used in the mouth — everything
  // else is out of reach.
  var FREE_USE_COOLDOWN_TURNS = 6;

  function freeUseVictimList(room) {
    var out = [];
    if (!room) return out;
    (Array.isArray(room.creatures) ? room.creatures : []).forEach(function (n) {
      if (n && n.bound && n.captiveProne && !n.dead) out.push(n);
    });
    (Array.isArray(room.items) ? room.items : []).forEach(function (b) {
      if (b && b.bodyState === "unconscious" && !b.dead) out.push(b);
    });
    return out;
  }

  function freeUseActorQualifies(n) {
    if (!n || n.dead || n.unconscious || n.bound || n.surrendered) return false;
    if (n.isHumanoid === false) return false;
    // Explicit undead guard: the engine's isUndeadNPC list (skeleton, ghost,
    // zombie, wraith, ghoul, specter, revenant). Fresh spawns are already
    // excluded via isHumanoid === false and gender "none", but legacy saves
    // (or any future humanoid-flagged undead template) must not slip through.
    if (typeof window.isUndeadNPC === "function" && window.isUndeadNPC(n)) return false;
    if (typeof window.isEntityIncorporeal === "function" && window.isEntityIncorporeal(n)) return false;
    if (n.objectType === "body") return false;
    if ((window.G.partyMembers || []).indexOf(n) >= 0) return false;
    if ((window.G.sessionFollowers || []).indexOf(n) >= 0) return false;
    if (n.hidden || n.isHidden) return false;
    nsfwEnsureBodyTraits(n);
    return nsfwBodyGenitalType(n) === "penis";
  }

  function freeUseActorCandidates(room) {
    return (Array.isArray(room.creatures) ? room.creatures : []).filter(freeUseActorQualifies);
  }

  // Victims not on use cooldown.
  function freeUseCooldownVictims(room) {
    var now = (typeof window.getCurrentStoryTurn === "function") ? window.getCurrentStoryTurn() : 0;
    return freeUseVictimList(room).filter(function (victim) {
      return !(typeof victim._lastFreeUseTurn === "number" && (now - victim._lastFreeUseTurn) < FREE_USE_COOLDOWN_TURNS);
    });
  }

  function freeUseIsClothed(victim) {
    return !!(victim.equipped && (victim.equipped.upper || victim.equipped.lower));
  }

  function freeUsePickPart(victim) {
    // A clothed victim keeps everything but the mouth out of reach.
    if (freeUseIsClothed(victim)) return "mouth";
    nsfwEnsureBodyTraits(victim);
    var parts = ["mouth"];
    var gen = nsfwBodyGenitalType(victim);
    if (gen === "vagina" || gen === "cloaca-vent") parts.push(gen === "vagina" ? "vagina" : "cloaca");
    if (nsfwBodyHasAnus(victim)) parts.push("anus");
    return pickFrom(parts);
  }

  function freeUseChance(actor) {
    var memory = actor.memory || {};
    var heat = (typeof memory.arousal === "number" ? memory.arousal : 0) +
               (typeof memory.lust === "number" ? memory.lust : 0);
    var chance = 0.05 + Math.min(0.35, heat / 500);
    var temperament = String(actor.temperament || "").toLowerCase();
    if (/bold|aggressive|reckless|fierce/.test(temperament)) chance *= 1.4;
    if (/timid|wary|nervous|cautious/.test(temperament)) chance *= 0.5;
    return chance;
  }

  // Shared aftermath: stamp the victim, spend the actor, mess the room.
  function nsfwApplyFreeUse(actor, victim, room, part) {
    victim._lastFreeUseTurn = (typeof window.getCurrentStoryTurn === "function") ? window.getCurrentStoryTurn() : 0;
    if (typeof window.recordBodyUse === "function") {
      window.recordBodyUse(victim, part, { loadKey: "vanilla ice cream", useKind: "penetrate" });
    }
    if (typeof window.addSmellMark === "function") {
      window.addSmellMark(victim, "vanilla ice cream");
      if (part === "anus" || part === "cloaca") window.addSmellMark(victim, "anal");
    }
    if (typeof window.addRoomLiquid === "function") {
      window.addRoomLiquid(room, "seed", 1);
    }
    if (actor.memory) {
      actor.memory.arousal = Math.max(0, (actor.memory.arousal || 0) - 40);
      actor.memory.lust = Math.max(0, (actor.memory.lust || 0) - 40);
    }
  }

  // Free use only happens outside combat — nobody takes a victim mid-fight.
  function freeUseBlockedByCombat() {
    return typeof window.getActiveEncounter === "function" && !!window.getActiveEncounter();
  }

  window.nsfwFreeUseOpportunityTick = function (room) {
    if (!room || (window.G && room === window.G.activeRoom)) return;
    if (freeUseBlockedByCombat()) return;
    var victims = freeUseCooldownVictims(room);
    if (!victims.length) return;
    var actors = freeUseActorCandidates(room);
    if (!actors.length) return;

    // At most one use per room per tick.
    for (var v = 0; v < victims.length; v++) {
      var victim = victims[v];
      for (var a = 0; a < actors.length; a++) {
        var actor = actors[a];
        if (actor === victim) continue;
        if (Math.random() >= freeUseChance(actor)) continue;

        var part = freeUsePickPart(victim);
        nsfwApplyFreeUse(actor, victim, room, part);
        var aName = nsfwGetEntityName(actor);
        var vName = nsfwGetEntityName(victim);
        window.rememberStoryEvent("combat",
          aName + " used " + vName + (part === "mouth" ? "'s mouth" : "") +
          " while they lay helpless in " + (room.name || "a room") + ".", 5);
        if (typeof window.saveGameState === "function") window.saveGameState();
        return;
      }
    }
  };

  // ── Waking into the aftermath ───────────────────────────────────
  // A body used while unconscious carries the evidence on it: bodyUse
  // loads never fade on their own (they dry, they stay), and smell notes
  // linger. Waking means NOTICING. Three window-exposed hooks serve the
  // SFW engine's wake paths (and the context builder); all wording lives
  // here so the explicit text stays NSFW-side. The engine only calls them
  // behind typeof guards and prints what they return.

  // Detection only, no wording. Which evidence the waking victim carries.
  function nsfwWakeEvidence(entity, room) {
    var out = { loads: [], used: [], smells: [], bare: false, topless: false, bottomless: false, floorSeed: false };
    if (entity) {
      Object.keys(entity.bodyUse || {}).forEach(function (part) {
        var st = entity.bodyUse[part];
        if (!st) return;
        if (st.loadKey) out.loads.push({ part: part, count: st.loadCount || 1 });
        else if (String(st.useKind || "") === "penetrate") out.used.push(part);
      });
      if (typeof window.getActiveSmellNotes === "function") {
        window.getActiveSmellNotes(entity).forEach(function (n) {
          if (n && n.key) out.smells.push(n.key);
        });
      }
      var eq = entity.equipped || {};
      var hasUpper = !!eq.upper, hasLower = !!eq.lower;
      if (!hasUpper && !hasLower) out.bare = true;
      else if (!hasUpper) out.topless = true;
      else if (!hasLower) out.bottomless = true;
    }
    if (room && room.liquids && room.liquids.seed && (room.liquids.seed.volume || 0) > 0) out.floorSeed = true;
    return out;
  }

  function nsfwHasUseEvidence(ev) {
    return !!(ev && (ev.loads.length || ev.used.length || ev.smells.length));
  }

  var WAKE_LOAD_TEXTS = {
    mouth: function (name, count) {
      return count > 1
        ? "dried seed is crusted at both corners of " + name + "'s mouth"
        : "dried seed is crusted at the corner of " + name + "'s slack mouth";
    },
    vagina: function (name, count) {
      return count > 1
        ? "seed has dried thick between " + name + "'s thighs, still leaking slowly from their used cunt"
        : "a smear of dried seed lies between " + name + "'s thighs, leaking slowly from their used cunt";
    },
    anus: function (name, count) {
      return count > 1
        ? "seed dries down " + name + "'s crack and thighs, their hole left gaping and freshly used"
        : "dried seed clings to " + name + "'s hole and runs down their thighs";
    },
    penis: function (name, count) {
      return count > 1
        ? name + "'s spent cock is crusted with dried seed"
        : "a crust of dried seed flakes off " + name + "'s soft cock";
    },
    breasts: function (name, count) {
      return "dried seed flakes across " + name + "'s chest";
    }
  };

  var WAKE_SMELL_TEXTS = {
    seed: "the unmistakable reek of seed hangs about them",
    anal: "a crude musk clings to them",
    urine: "the sharp stink of piss hangs about them"
  };

  // Third-person evidence sentence for the wake narration (the player,
  // standing there, sees it as they stir). "" when there is nothing to
  // notice. Exposure and floor mess only read as evidence when there is
  // actual use on the body - a merely undressed body is not "aftermath".
  function nsfwDescribeWakeUseEvidence(entity, room) {
    var ev = nsfwWakeEvidence(entity, room);
    if (!nsfwHasUseEvidence(ev)) return "";
    var name = nsfwGetEntityName(entity);
    var bits = [];
    ev.loads.forEach(function (load) {
      var fn = WAKE_LOAD_TEXTS[load.part];
      if (fn) bits.push(fn(name, load.count));
    });
    ev.used.forEach(function (part) {
      if (part === "mouth") bits.push(name + "'s lips are rubbed raw and slick");
      else if (part === "vagina" || part === "anus") bits.push(name + "'s thighs are sticky, their hole raw and used");
      else if (part === "penis") bits.push(name + "'s cock is slick and red with use");
    });
    ev.smells.forEach(function (key) {
      var text = WAKE_SMELL_TEXTS[key];
      if (text && bits.indexOf(text) < 0) bits.push(text);
    });
    if (ev.bare) bits.push("they lie stripped stark naked, their clothes long gone");
    else if (ev.bottomless) bits.push("they are bare from the waist down, their bottoms nowhere in sight");
    else if (ev.topless) bits.push("their chest is bare, their top nowhere in sight");
    if (ev.floorSeed) bits.push("a white pool dries on the floor beside them");
    if (!bits.length) return "";
    var sentence = bits.join("; ");
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
  }

  // Second-person instruction note for the wake-reaction AI call: what THEY
  // notice as they come to, and how it should hit them. "" when none.
  function nsfwWakeUseInstructionNote(entity, room) {
    var ev = nsfwWakeEvidence(entity, room);
    if (!nsfwHasUseEvidence(ev)) return "";
    var bits = [];
    ev.loads.forEach(function (load) {
      if (load.part === "mouth") bits.push("dried seed at the corner of your mouth - someone pushed their cock into it and finished there while you were out cold");
      else if (load.part === "vagina") bits.push("cold seed drying between your thighs - you were fucked in your sleep and filled");
      else if (load.part === "anus") bits.push("seed drying down your crack - you were fucked in your sleep, your hole raw with it");
      else if (load.part === "penis") bits.push("your own cock crusted with dried seed");
      else if (load.part === "breasts") bits.push("dried seed flaking off your chest");
    });
    ev.used.forEach(function (part) {
      if (part === "mouth") bits.push("your lips are rubbed raw from a cock you never felt");
      else if (part === "vagina" || part === "anus") bits.push("your thighs are sticky and your hole aches with rough use");
    });
    if (ev.smells.indexOf("vanilla ice cream") >= 0) bits.push("you reek of seed - your own body is the evidence");
    if (ev.bare) bits.push("you are stark naked - whoever did this took your clothes first");
    else if (ev.bottomless) bits.push("you are bare from the waist down");
    else if (ev.topless) bits.push("your top is gone");
    if (ev.floorSeed) bits.push("a drying pool of seed on the floor beside you says it happened more than once");
    if (!bits.length) return "";
    return "As you come to, you notice what was done to you while you were unconscious: " + bits.join("; ") + ". " +
      "You do not know who did it unless you have a clear reason to suspect someone in particular. " +
      "Let this hit you in your spoken line - horror, fury, shame, cold dread or grim compliance, as fits who you are.";
  }

  // Second-person persona-block line for any later conversation, while the
  // evidence lasts (a wash clears loads and smell marks; until then the
  // aftermath colors their replies). "" when none.
  function nsfwGetUseContextNote(entity) {
    var ev = nsfwWakeEvidence(entity, null);
    if (!nsfwHasUseEvidence(ev)) return "";
    var bits = [];
    ev.loads.forEach(function (load) {
      if (load.part === "mouth") bits.push("dried seed still crusts the corner of your mouth");
      else if (load.part === "vagina" || load.part === "anus") bits.push("dried seed still clings between your thighs");
      else bits.push("dried seed still marks your skin");
    });
    ev.used.forEach(function (part) {
      if (part === "vagina" || part === "anus" || part === "mouth") bits.push("your body still aches with use you never felt");
    });
    if (ev.smells.indexOf("vanilla ice cream") >= 0) bits.push("the smell of seed still hangs on you");
    if (!bits.length) return "";
    return "- Lingering aftermath: someone used you while you lay unconscious, and the evidence is still on you - " +
      bits.join("; ") + ". It has not been washed away, and it colors everything you say: shame, anger, guardedness or brittle bravado, as fits your temperament. " +
      "Mention it only when it fits naturally, never every reply.";
  }

  window.nsfwDescribeWakeUseEvidence = nsfwDescribeWakeUseEvidence;
  window.nsfwWakeUseInstructionNote = nsfwWakeUseInstructionNote;
  window.nsfwGetUseContextNote = nsfwGetUseContextNote;

  // ── Live-witnessed variant ──────────────────────────────────────
  // The same opportunity, but the player is standing right there: an NPC
  // walking into the player's room, or already present when the player
  // walks in, may take their chance in full view. Same chance roll,
  // cooldown and clothed-victim rule as the off-screen tick; the
  // difference is the beat is narrated live.
  function freeUseWitnessedLine(actorName, victimName, part, victimIsUnconscious) {
    if (part === "mouth") {
      return victimIsUnconscious
        ? pickFrom([
            `${actorName} kneels over ${victimName}'s unconscious form, tips their slack head back and slides their cock into the unresisting mouth. They fuck it in slow strokes, gaze flicking up to meet yours without a shred of shame.`,
            `Without a word, ${actorName} straddles ${victimName}'s chest and pushes past their slack lips, rocking into the warm, passive mouth right there in front of you.`
          ])
        : pickFrom([
            `${actorName} crouches by ${victimName}'s hog-tied form, fists a hand in their hair and feeds their cock past their protests. Bound and muffled, ${victimName} can only endure it while you watch.`,
            `${actorName} plants a boot beside ${victimName}'s head and pushes into their mouth, holding the hog-tied captive's jaw where they want it — making a show of it with you standing right there.`
          ]);
    }
    return victimIsUnconscious
      ? pickFrom([
          `${actorName} lines up against ${victimName}'s limp, unconscious body and pushes in with a low groan, fucking them in slow, possessive strokes while you watch.`,
          `${actorName} spreads ${victimName}'s slack thighs and seats themselves inside, setting a lazy pace — the unconscious body rocks with each thrust, utterly passive.`
        ])
      : pickFrom([
          `${actorName} hauls ${victimName}'s hips up from the floor, still hog-tied and struggling, and thrusts home with a satisfied groan, using them right in front of you.`,
          `${actorName} pins ${victimName}'s bound form down and takes them from behind, heedless of the muffled curses — or of you.`
        ]);
  }

  // ── Witnessed free-use narration polish ─────────────────────────
  // The witnessed beat is AI-polished like body-action narrations: a
  // background ai() call refines the templated line into a fuller erotic
  // scene beat, with a dimmed "..." placeholder in the log while in flight
  // and a fallback to the template if the polish fails (ai() missing,
  // error, empty, or meta-commentary reply). Unlike polishBodyNarration
  // there is no activeObject binding — the player is standing in the room
  // without necessarily examining anything, so the polish is bound to the
  // room instead (discarded if the player has left or combat has begun by
  // the time it lands).
  function buildFreeUsePrompt(actor, victim, room, part, baseText, varietyOpts) {
    var aName = nsfwGetEntityName(actor);
    var vName = nsfwGetEntityName(victim);
    var aSpecies = String(actor.species || "human").toLowerCase();
    var vSpecies = String(victim.species || "human").toLowerCase();
    var victimIsUnconscious = victim.bodyState === "unconscious";
    var partLabel = part === "cloaca" ? "cloacal vent" : part;

    var sceneLine = victimIsUnconscious
      ? "The victim is " + vName + ", a " + vSpecies + " lying UNCONSCIOUS in the room — completely limp, unresponsive, no awareness, no conscious reaction (reflexive twitches only)."
      : "The victim is " + vName + ", a " + vSpecies + " bound hand and foot (hog-tied) — awake, aware, helpless, and unable to do more than struggle and make muffled noises.";

    // Anatomy of the used part, pulled from the victim's profile (only for
    // bare-flesh parts; a clothed victim is used in the mouth only).
    var anatomyNote = "";
    if (part !== "mouth" && !freeUseIsClothed(victim)) {
      var anatomyKeys = part === "vagina" ? ["genitals", "vagina"]
        : part === "cloaca" ? ["genitals"]
        : ["anus"];
      anatomyNote = buildBodyAnatomyNote(victim, anatomyKeys);
    }

    var variety = varietyOpts || {};
    var toneNote = variety.tone
      ? "TONE for this beat (let it color word choice, pacing and verbs — not the facts of the act): " + variety.tone
      : "";
    var avoidNote = Array.isArray(variety.recentLines) && variety.recentLines.length
      ? "DO NOT REUSE PHRASING — these are recent narration lines in this room. Use fresh wording and fresh imagery; do not repeat or lightly rephrase them:\n" +
        variety.recentLines.map(function (l) { return '"' + l + '"'; }).join("\n")
      : "";

    var prompt = [
"You are polishing a witnessed scene description from a text adventure game.",
"The player is standing in the room, watching this happen in front of them.",
"The actor is " + aName + ", a " + aSpecies + " NPC in the mood, seizing the opportunity.",
sceneLine,
"The act: the actor uses the victim's " + partLabel + ".",
"The room: " + (room.name || "a room") + ".",
anatomyNote,
"",
"INSTRUCTIONS:",
"- Polish the BASE TEXT below. Fix grammar, refine the sentence, make it more vivid and sensory.",
"- Keep the same meaning and the same act. Do NOT invent new actions or participants.",
"- Write in second person from the player's observing perspective (\u201CYou watch ...\u201D style where natural).",
"- The player is only a witness: they do not participate, and the scene does not address or involve them.",
"- This is an erotic scene: use direct, explicit physical language. Name the body parts and the act plainly. No metaphors, no purple prose.",
"- The victim gives nothing back: " + (victimIsUnconscious
  ? "purely reflexive reactions at most — no awareness, no conscious response."
  : "only muffled struggling against the ropes — no ability to resist, no cooperation."),
"- Keep it to 2-3 sentences. Match the length of the base text.",
toneNote,
avoidNote,
"",
"BASE TEXT (polish this — refine, make more vivid, keep same meaning and details):",
"\"" + baseText + "\"",
"",
"IMPORTANT: Output ONLY the polished text. No explanations, no meta-discussion. Just the polished scene."
    ].filter(function (l) { return l !== ""; }).join("\n");

    return prompt;
  }

  function polishFreeUseNarration(actor, victim, room, part, baseText) {
    var _ai = typeof window.ai === "function" ? window.ai : null;
    if (!_ai) { nsfwPrintBodyNarration(baseText); return; }

    var pendingEntry = nsfwShowBodyPendingNarration("...");
    (async function () {
      var polished = null;
      var recent = Array.isArray(room._recentFreeUseNarration)
        ? room._recentFreeUseNarration.slice()
        : [];
      var tone = pickBodyNarrationTone();
      try {
        var prompt = buildFreeUsePrompt(actor, victim, room, part, baseText, {
          tone: tone,
          recentLines: recent
        });
        var result = await _ai({
          instruction: prompt,
          startWith: "",
          endButtons: "none",
          generatorName: "cyoaftw-engine-core"
        });
        polished = result && (result.text || result);
        if (polished && polished.trim()) {
          var isMeta = /since the base|please provide|I cannot|I'm unable|as an ai|i'll polish|here is the|here's the/i.test(polished.trim());
          if (isMeta) {
            console.log("[Free Use] Narration rejected (meta-commentary)");
            polished = null;
          }
        } else {
          polished = null;
        }
      } catch (e) {
        console.warn("[Free Use] Narration polish failed:", e);
      }

      // Bound to the room: if the player left or a fight broke out before
      // the polish landed, print the plain template so the beat still reads.
      if (window.G && (window.G.activeRoom !== room || freeUseBlockedByCombat())) polished = null;
      nsfwRemoveBodyPendingNarration(pendingEntry);
      var printedText = polished ? polished.trim() : baseText;
      nsfwPrintBodyNarration(printedText);
      if (typeof printedText === "string" && printedText.trim()) {
        room._recentFreeUseNarration = recent
          .concat([printedText.trim()])
          .slice(-2);
      }
    })();
  }

  // One witnessed use attempt: chance roll, effects, live narration.
  // Returns true when the use happened.
  function nsfwFreeUseWitnessedBeat(actor, victim, room) {
    if (Math.random() >= freeUseChance(actor)) return false;
    var part = freeUsePickPart(victim);
    nsfwApplyFreeUse(actor, victim, room, part);
    var aName = nsfwGetEntityName(actor);
    var vName = nsfwGetEntityName(victim);
    var victimIsUnconscious = victim.bodyState === "unconscious";
    polishFreeUseNarration(actor, victim, room, part,
      freeUseWitnessedLine(aName, vName, part, victimIsUnconscious));
    window.rememberStoryEvent("combat",
      aName + " used " + vName + (part === "mouth" ? "'s mouth" : "") +
      " in front of " + (window.G.player && window.G.player.name || "the player") +
      " while they lay helpless in " + (room.name || "a room") + ".", 6);
    if (typeof window.saveGameState === "function") window.saveGameState();
    return true;
  }

  // Hook A: an NPC just arrived in the room the player is in.
  window.nsfwFreeUseOnNpcArrival = function (npc, room) {
    if (!npc || !room || (window.G && room !== window.G.activeRoom)) return;
    if (freeUseBlockedByCombat()) return;
    if (!freeUseActorQualifies(npc)) return;
    var victims = freeUseCooldownVictims(room);
    if (!victims.length) return;
    if (npc === victims[0]) return;
    nsfwFreeUseWitnessedBeat(npc, victims[0], room);
  };

  // Hook B: the player just walked into a room where an actor and a victim
  // are already present.
  window.nsfwFreeUseOnPlayerArrival = function (room) {
    if (!room || (window.G && room !== window.G.activeRoom)) return;
    if (freeUseBlockedByCombat()) return;
    var victims = freeUseCooldownVictims(room);
    if (!victims.length) return;
    var actors = freeUseActorCandidates(room);
    for (var a = 0; a < actors.length; a++) {
      var actor = actors[a];
      if (actor === victims[0]) continue;
      if (nsfwFreeUseWitnessedBeat(actor, victims[0], room)) return;
    }
  };

  // === Bound captive interactions ====================================
  // A surrendered NPC the player has roped (npc.bound, see the SFW engine's
  // captor menu / renderCaptorMenu) gets NSFW action groups on that menu once
  // the player has examined them (captiveExamined — the engine gates the hook
  // call the same way unconscious bodies reveal theirs). The key difference
  // from the unconscious-body groups: the captive is AWAKE. Narration frames
  // coercion — fear, reluctance, resignation — not limp unresponsiveness.

  function nsfwIsBoundCaptive(npc) {
    if (!npc || !npc.bound || npc.dead || npc.unconscious) return false;
    if (typeof window.isHeldCaptive === "function") return window.isHeldCaptive(npc);
    return !!npc.surrendered;
  }

  // Region access for a bound captive: mouth is always reachable; chest and
  // groin once the covering garment is gone (Search their gear can take it);
  // the rear/anus likewise, since a bound captive can simply be turned around.
  function nsfwCaptiveRegionExposed(npc, region) {
    if (!npc) return false;
    var upperCovered = nsfwBodySlotPresent(npc, "upper");
    var lowerCovered = nsfwBodySlotPresent(npc, "lower");
    if (region === "mouth") return true;
    if (region === "breasts") return !upperCovered;
    if (region === "genitals") return !lowerCovered;
    if (region === "anus") return !lowerCovered;
    return false;
  }

  function nsfwRenderCaptiveMenu(npc) {
    if (typeof window.renderCaptorMenu === "function") {
      window.renderCaptorMenu(npc);
    }
  }

  // Exposure note for the AI prompts: what the player can currently see of
  // the roped captive. Mirrors buildBodyExposureNote's garment logic but with
  // captive accessibility (mouth always; rear reachable by turning them).
  function buildCaptiveExposureNote(npc) {
    if (!npc) return "";
    var upperCovered = nsfwBodySlotPresent(npc, "upper");
    var lowerCovered = nsfwBodySlotPresent(npc, "lower");
    var exposed = [];
    exposed.push("mouth (always accessible — their face is right there)");
    if (!upperCovered) {
      exposed.push("bare chest (upper garment taken)");
    }
    if (!lowerCovered) {
      exposed.push("bare groin (lower garment taken)");
      exposed.push("bare rear and anus (lower garment taken — they can be turned around)");
    }
    return "\nEXPOSURE (what the player can currently see/reach — do not describe anything else as bare): " + exposed.join("; ") + ".";
  }

  function buildCaptiveActionPrompt(npc, actionDesc, baseText) {
    const name = nsfwGetEntityName(npc);
    const species = (npc.species || "human").toLowerCase();
    const gender = npc.gender || "unknown";
    const wounds = typeof window.describeCombatWounds === "function"
      ? window.describeCombatWounds(npc) : "";

    var speciesNote = species !== "human"
      ? "\nThe NPC is a " + species + ". Include species-appropriate physical details (skin, texture, features)."
      : "";
    var woundNote = wounds
      ? "\nThe NPC has visible wounds: " + wounds + ". Reference them subtly if relevant — they lost this fight."
      : "";
    var exposureNote = buildCaptiveExposureNote(npc);
    var bodyUseNote = nsfwBodyUsePromptNote(npc, actionDesc);

    var prompt = [
"You are polishing a player action description from a text adventure game.",
"The NPC is " + name + ", a " + species + " " + gender + ", currently the player's BOUND CAPTIVE — wrists lashed with rope, forced to comply. They are awake, aware, and unwilling." + speciesNote + woundNote + exposureNote + bodyUseNote,
"",
"INSTRUCTIONS:",
"- Polish the BASE TEXT below. Fix grammar, refine the sentence, make it more vivid and sensory.",
"- Keep the same meaning and the same act. Do NOT invent new actions or body parts.",
"- The action: " + actionDesc + ".",
"- Write in second person (\"You ...\"). This is the player's perspective.",
"- This act is COERCED, not consensual: the NPC submits because they are bound and defeated, not because they want it. Show fear, reluctance, averted eyes, held breath, trembling, stiff unresponsiveness of forced compliance.",
"- The NPC may show small involuntary reactions (flinching, clenching, a shaky breath, stifled sounds) but NO enthusiastic participation, NO arousal framing, and NO dialogue beyond a stifled word.",
"- Use direct, physical language. No metaphors, no purple prose.",
"- Keep it to 1-2 sentences. Match the length of the base text.",
"- Use the exposure context above: only reference anatomy that is listed as accessible. Do not describe what is covered.",
"",
"BASE TEXT (polish this — refine, make more vivid, keep same meaning and details):",
"\"" + baseText + "\"",
"",
"IMPORTANT: Output ONLY the polished text. No explanations, no meta-discussion. Just the polished sentence.",
"",
"RESPOND with only the polished text, nothing else:"
    ].filter(function(l) { return l !== ""; }).join("\n");

    return prompt;
  }

  // Captive mirror of polishBodyNarration: placeholder in the log, print only
  // the polished text once the ai() call returns, fall back to the base text
  // on failure or if the player has moved on to another view.
  function polishCaptiveNarration(npc, actionDesc, baseText) {
    var _ai = typeof window.ai === "function" ? window.ai : null;
    if (!_ai) { nsfwPrintBodyNarration(baseText); return; }

    var pendingEntry = nsfwShowBodyPendingNarration("...");
    (async function() {
      var polished = null;
      try {
        var prompt = buildCaptiveActionPrompt(npc, actionDesc, baseText);
        var result = await _ai({
          instruction: prompt,
          startWith: "",
          endButtons: "none",
          generatorName: "cyoaftw-engine-core"
        });
        polished = result && (result.text || result);
        if (polished && polished.trim()) {
          var isMeta = /since the base|please provide|I cannot|I'm unable|as an ai|i'll polish|here is the|here's the/i.test(polished.trim());
          if (isMeta) {
            console.log("[Captive Actions] Narration rejected (meta-commentary) for:", actionDesc);
            polished = null;
          }
        } else {
          polished = null;
        }
      } catch (e) {
        console.warn("[Captive Actions] Narration polish failed for:", actionDesc, e);
      }

      if (window.G && window.G.activeNPC !== npc) polished = null;
      nsfwRemoveBodyPendingNarration(pendingEntry);
      nsfwPrintBodyNarration(polished ? polished.trim() : baseText);
    })();
  }

  function appendBoundCaptiveGroups(npc, el) {
    if (!npc || !el) return;
    nsfwEnsureBodyTraits(npc);

    // Kiss group — the face is always accessible on a standing bound captive.
    window.appendCombatGroup(el, "Kiss", [
      window.createCombatButton("Kiss mouth", () => kissBoundCaptive(npc, "mouth")),
      window.createCombatButton("Kiss cheek", () => kissBoundCaptive(npc, "cheek"))
    ]);

    // Touch group — grope, gated by anatomy + garment exposure.
    var touchButtons = [];
    if (nsfwBodyHasBreasts(npc) && nsfwCaptiveRegionExposed(npc, "breasts")) {
      touchButtons.push(window.createCombatButton("Grope chest", () => touchBoundCaptive(npc, "breasts")));
    }
    var genitalType = nsfwBodyGenitalType(npc);
    if (genitalType && nsfwCaptiveRegionExposed(npc, "genitals")) {
      touchButtons.push(window.createCombatButton("Stroke genitals", () => touchBoundCaptive(npc, "genitals")));
    }
    if (nsfwCaptiveRegionExposed(npc, "anus")) {
      touchButtons.push(window.createCombatButton("Grope rear", () => touchBoundCaptive(npc, "rear")));
    }
    if (touchButtons.length) {
      window.appendCombatGroup(el, "Touch", touchButtons);
    }

    // Grind group — f/f tribadism for female players, the generic grind
    // for non-binary ("both") players. Both need the captive's bare
    // genitals reachable (lower garment gone).
    var grindButtons = [];
    var playerAnatomy = nsfwPlayerAnatomy();
    if (nsfwCaptiveRegionExposed(npc, "genitals")) {
      if (playerAnatomy === "vagina" && genitalType === "vagina") {
        grindButtons.push(window.createCombatButton("Grind pussies", () => grindCaptive(npc, "pussy")));
      }
      if (playerAnatomy === "both") {
        grindButtons.push(window.createCombatButton("Grind against them", () => grindCaptive(npc, "generic")));
      }
    }
    if (grindButtons.length) {
      window.appendCombatGroup(el, "Grind", grindButtons);
    }

    // Ride face group — shove the bound captive down and sit on their
    // face. Every anatomy gets it: rimming (penis players), a choice of
    // pussy or ass (vagina players), generic service (non-binary). Not
    // offered for hog-tied (prone) captives — they lie face-down.
    var faceButtons = [];
    if (!npc.captiveProne) {
      if (playerAnatomy === "penis") {
        faceButtons.push(window.createCombatButton("Sit on their face (get rimmed)", () => rideFaceCaptive(npc, "rim")));
      } else if (playerAnatomy === "vagina") {
        faceButtons.push(window.createCombatButton("Ride their face (your pussy)", () => rideFaceCaptive(npc, "pussy")));
        faceButtons.push(window.createCombatButton("Sit on their face (get rimmed)", () => rideFaceCaptive(npc, "rim")));
      } else if (playerAnatomy === "both") {
        faceButtons.push(window.createCombatButton("Ride their face", () => rideFaceCaptive(npc, "generic")));
      }
    }
    if (faceButtons.length) {
      window.appendCombatGroup(el, "Ride face", faceButtons);
    }

    // Oral group — player must have a penis. Once forced, the button becomes
    // a continuation thrust so the entry narration is not repeated.
    if (nsfwPlayerHasPenis()) {
      window.appendCombatGroup(el, "Oral", [
        npc.captiveMouthUsed
          ? window.createCombatButton("Thrust into mouth", () => thrustCaptive(npc, "mouth"))
          : window.createCombatButton("Force into mouth", () => forceOralCaptive(npc))
      ]);
    }

    // Penetrate group — finger and/or penis, gated by anatomy + exposure.
    var penButtons = [];
    var hasAnus = nsfwBodyHasAnus(npc);
    var isCloaca = genitalType === "cloaca-vent" || genitalType === "cloaca-penis";

    if (genitalType === "vagina" && nsfwCaptiveRegionExposed(npc, "genitals")) {
      penButtons.push(window.createCombatButton("Finger vagina", () => fingerCaptive(npc, "vagina")));
    } else if (isCloaca && nsfwCaptiveRegionExposed(npc, "genitals")) {
      penButtons.push(window.createCombatButton("Finger cloacal vent", () => fingerCaptive(npc, "cloaca")));
    }
    if (hasAnus && nsfwCaptiveRegionExposed(npc, "anus")) {
      penButtons.push(window.createCombatButton("Finger anus", () => fingerCaptive(npc, "anus")));
    }
    if (nsfwPlayerHasPenis()) {
      if (genitalType === "vagina" && nsfwCaptiveRegionExposed(npc, "genitals")) {
        penButtons.push(npc.captivePenetratedTarget === "vagina"
          ? window.createCombatButton("Thrust into vagina", () => thrustCaptive(npc, "vagina"))
          : window.createCombatButton("Penetrate vagina", () => penetrateCaptive(npc, "vagina")));
      } else if (isCloaca && nsfwCaptiveRegionExposed(npc, "genitals")) {
        penButtons.push(npc.captivePenetratedTarget === "cloaca"
          ? window.createCombatButton("Thrust into cloaca", () => thrustCaptive(npc, "cloaca"))
          : window.createCombatButton("Penetrate cloaca", () => penetrateCaptive(npc, "cloaca")));
      }
      if (hasAnus && nsfwCaptiveRegionExposed(npc, "anus")) {
        penButtons.push(npc.captivePenetratedTarget === "anus"
          ? window.createCombatButton("Thrust into anus", () => thrustCaptive(npc, "anus"))
          : window.createCombatButton("Penetrate anus", () => penetrateCaptive(npc, "anus")));
      }
    }

    // Generic penetration (non-binary, "both" anatomy): the player's sex
    // enters without the narration ever assuming a cock.
    if (playerAnatomy === "both") {
      if (genitalType === "vagina" && nsfwCaptiveRegionExposed(npc, "genitals")) {
        penButtons.push(npc.captivePenetratedTarget === "vagina"
          ? window.createCombatButton("Thrust into vagina", () => thrustCaptiveGeneric(npc, "vagina"))
          : window.createCombatButton("Penetrate vagina", () => penetrateCaptiveGeneric(npc, "vagina")));
      } else if (isCloaca && nsfwCaptiveRegionExposed(npc, "genitals")) {
        penButtons.push(npc.captivePenetratedTarget === "cloaca"
          ? window.createCombatButton("Thrust into cloaca", () => thrustCaptiveGeneric(npc, "cloaca"))
          : window.createCombatButton("Penetrate cloaca", () => penetrateCaptiveGeneric(npc, "cloaca")));
      }
      if (hasAnus && nsfwCaptiveRegionExposed(npc, "anus")) {
        penButtons.push(npc.captivePenetratedTarget === "anus"
          ? window.createCombatButton("Thrust into anus", () => thrustCaptiveGeneric(npc, "anus"))
          : window.createCombatButton("Penetrate anus", () => penetrateCaptiveGeneric(npc, "anus")));
      }
    }
    if (penButtons.length) {
      window.appendCombatGroup(el, "Penetrate", penButtons);
    }

    // Climax group — finish inside every hole currently in use.
    if (nsfwPlayerHasPenis()) {
      var climaxButtons = [];
      if (npc.captivePenetratedTarget === "vagina" && nsfwCaptiveRegionExposed(npc, "genitals")) {
        climaxButtons.push(window.createCombatButton("Finish inside (vagina)", () => climaxCaptive(npc, "vagina")));
      } else if (npc.captivePenetratedTarget === "cloaca" && nsfwCaptiveRegionExposed(npc, "genitals")) {
        climaxButtons.push(window.createCombatButton("Finish inside (" + (nsfwGenitalLabel(npc) || "cloaca") + ")", () => climaxCaptive(npc, "cloaca")));
      }
      if (npc.captivePenetratedTarget === "anus" && nsfwCaptiveRegionExposed(npc, "anus")) {
        climaxButtons.push(window.createCombatButton("Finish inside (anus)", () => climaxCaptive(npc, "anus")));
      }
      if (npc.captiveMouthUsed) {
        climaxButtons.push(window.createCombatButton("Finish inside (mouth)", () => climaxCaptive(npc, "mouth")));
      }
      if (climaxButtons.length) {
        window.appendCombatGroup(el, "Climax", climaxButtons);
      }
    }

    // Generic climax — non-binary ("both") players finish inside without
    // cock or ejaculation wording (no load or smell marks recorded).
    if (playerAnatomy === "both") {
      var genericClimaxButtons = [];
      if (npc.captivePenetratedTarget === "vagina" && nsfwCaptiveRegionExposed(npc, "genitals")) {
        genericClimaxButtons.push(window.createCombatButton("Finish inside (vagina)", () => climaxCaptiveGeneric(npc, "vagina")));
      } else if (npc.captivePenetratedTarget === "cloaca" && nsfwCaptiveRegionExposed(npc, "genitals")) {
        genericClimaxButtons.push(window.createCombatButton("Finish inside (" + (nsfwGenitalLabel(npc) || "cloaca") + ")", () => climaxCaptiveGeneric(npc, "cloaca")));
      }
      if (npc.captivePenetratedTarget === "anus" && nsfwCaptiveRegionExposed(npc, "anus")) {
        genericClimaxButtons.push(window.createCombatButton("Finish inside (anus)", () => climaxCaptiveGeneric(npc, "anus")));
      }
      if (genericClimaxButtons.length) {
        window.appendCombatGroup(el, "Climax", genericClimaxButtons);
      }
    }

    // Their cock group — the bound captive's own cock. Stroking is
    // available to any player; mounting/riding to vagina and non-binary
    // ("both") players — the generic "ride" (penis players use the
    // Penetrate groups).
    if (genitalType === "penis" && nsfwCaptiveRegionExposed(npc, "genitals")) {
      var cockButtons = [];
      cockButtons.push(window.createCombatButton(
        npc.captiveCockStiff ? "Stroke their stiff cock" : "Stroke their cock",
        () => strokeCaptiveCock(npc)
      ));
      if (playerAnatomy !== "penis") {
        if (npc.captiveRiding) {
          cockButtons.push(window.createCombatButton("Ride their cock", () => rideCaptiveCock(npc)));
          cockButtons.push(window.createCombatButton("Climax (riding)", () => riderClimaxCaptive(npc)));
        } else {
          cockButtons.push(window.createCombatButton("Mount their cock", () => rideCaptiveCock(npc), {
            disabled: !npc.captiveCockStiff
          }));
        }
      }
      window.appendCombatGroup(el, "Their cock", cockButtons);
    }

    // Care group — wipes dried loads / smell notes off the captive (the only
    // reset those have; see the unconscious-body Care group).
    var hasDriedLoads = !!(npc.bodyUse && Object.keys(npc.bodyUse).some(function (part) {
      return npc.bodyUse[part] && npc.bodyUse[part].loadKey;
    }));
    var hasSmellNotes = !!(Array.isArray(npc.smellNotes) && npc.smellNotes.length);
    if (hasDriedLoads || hasSmellNotes) {
      window.appendCombatGroup(el, "Care", [
        window.createCombatButton("Clean them up", () => cleanUpCaptive(npc))
      ]);
    }
  }

  // ── Captive action functions ─────────────────────────────────
  // Same pattern as the body actions: guard, set state flags, build base
  // text, AI-polish (coercion-framed), remember event, save, re-render menu.

  function kissBoundCaptive(npc, where) {
    if (!nsfwIsBoundCaptive(npc)) return;
    if (where !== "mouth" && where !== "cheek") return;

    npc.captiveKissed = (npc.captiveKissed || 0) + 1;
    npc.captiveLastKiss = where;

    const name = nsfwGetEntityName(npc);
    const baseText = where === "mouth"
      ? `You grip ${name}'s jaw and kiss them full on the mouth. Their lips press flat and unyielding; a fine tremor runs through them, but they don't dare pull away.`
      : `You press a slow kiss to ${name}'s ${where}. They flinch at the touch, then force themselves still, breath coming quick and shallow through their nose.`;
    const actionDesc = "kiss " + where;
    polishCaptiveNarration(npc, actionDesc, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} kissed ${name} on the ${where} while they were bound.`, 4);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  // part: "breasts" | "genitals" | "rear"
  function touchBoundCaptive(npc, part) {
    if (!nsfwIsBoundCaptive(npc)) return;
    const name = nsfwGetEntityName(npc);
    var baseText;

    if (part === "breasts") {
      if (!nsfwBodyHasBreasts(npc) || !nsfwCaptiveRegionExposed(npc, "breasts")) return;
      baseText = `You close a hand over ${name}'s bare chest, kneading without hurry. They turn their face away, jaw tight, a shaky breath escaping through their teeth.`;
    } else if (part === "genitals") {
      if (!nsfwBodyGenitalType(npc) || !nsfwCaptiveRegionExposed(npc, "genitals")) return;
      var genLabel = nsfwGenitalLabel(npc) || "genitals";
      baseText = `You stroke a hand over ${name}'s exposed ${genLabel}. Their hips jerk back from the touch, then settle — there is nowhere to go with their wrists tied.`;
    } else if (part === "rear") {
      if (!nsfwCaptiveRegionExposed(npc, "anus")) return;
      baseText = `You grab a handful of ${name}'s rear, squeezing roughly. They stumble half a step from the pull of it, the rope biting into their wrists.`;
    } else return;

    npc.captiveTouched = (npc.captiveTouched || 0) + 1;
    npc.captiveTouchedParts = npc.captiveTouchedParts || [];
    if (npc.captiveTouchedParts.indexOf(part) < 0) npc.captiveTouchedParts.push(part);
    const actionDesc = "touch " + (part === "breasts" ? "chest" : part);
    polishCaptiveNarration(npc, actionDesc, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} groped ${name} while they were bound.`, 5);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  function forceOralCaptive(npc) {
    if (!nsfwIsBoundCaptive(npc)) return;
    if (!nsfwPlayerHasPenis()) return;

    npc.captiveMouthUsed = true;
    const name = nsfwGetEntityName(npc);
    const baseText = `You fist a hand in ${name}'s hair and force your cock between their lips. They gag hard around the sudden fullness, eyes squeezed shut, throat fluttering around you.`;
    const actionDesc = "force mouth";
    polishCaptiveNarration(npc, actionDesc, baseText);
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(npc, "mouth", { useKind: "penetrate" });
    window.rememberStoryEvent("combat", `${window.G.player.name} forced their cock into ${name}'s mouth while they were bound.`, 7);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  // target: "vagina" | "cloaca" | "anus"
  function fingerCaptive(npc, target) {
    if (!nsfwIsBoundCaptive(npc)) return;
    const name = nsfwGetEntityName(npc);
    var label;
    var baseText;

    if (target === "vagina" || target === "cloaca") {
      if (!nsfwCaptiveRegionExposed(npc, "genitals")) return;
      label = (target === "cloaca") ? (nsfwGenitalLabel(npc) || "cloacal vent") : "vagina";
      baseText = `You work a finger into ${name}'s dry, unaroused ${label}. They bite down on a sound, thighs trying to close against the intrusion, held open by nothing but fear of what you will do if they fight.`;
    } else if (target === "anus") {
      if (!nsfwCaptiveRegionExposed(npc, "anus")) return;
      label = "anus";
      baseText = `You press a finger against ${name}'s clenched anus, working it in slowly against the resistant ring. They go rigid, breath held, enduring it.`;
    } else return;

    npc.captiveFingered = true;
    npc.captiveFingerTarget = target;
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(npc, target, { useKind: "finger" });
    const actionDesc = "finger " + label;
    polishCaptiveNarration(npc, actionDesc, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} inserted a finger into ${name}'s ${label} while they were bound.`, 6);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  // target: "vagina" | "cloaca" | "anus" — requires player penis
  function penetrateCaptive(npc, target) {
    if (!nsfwIsBoundCaptive(npc)) return;
    if (!nsfwPlayerHasPenis()) return;
    const name = nsfwGetEntityName(npc);
    var label;
    var baseText;

    if (target === "vagina" || target === "cloaca") {
      if (!nsfwCaptiveRegionExposed(npc, "genitals")) return;
      label = (target === "cloaca") ? (nsfwGenitalLabel(npc) || "cloacal vent") : "vagina";
      baseText = `You guide your cock into ${name}'s exposed ${label}. Their breath comes fast and panicked; they take it stiff and unready, bound hands flexing uselessly.` + nsfwBodyUseClause(npc, target);
    } else if (target === "anus") {
      if (!nsfwCaptiveRegionExposed(npc, "anus")) return;
      label = "anus";
      baseText = `You press your cock against ${name}'s tight anus and push in. They stifle a strained noise, muscles locked, forcing themselves to endure it.` + nsfwBodyUseClause(npc, target);
    } else return;

    npc.captivePenetrated = true;
    npc.captivePenetratedTarget = target;
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(npc, target, { useKind: "penetrate" });
    const actionDesc = "penetrate " + label;
    polishCaptiveNarration(npc, actionDesc, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} penetrated ${name}'s ${label} with their cock while they were bound.`, 8);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  // Continuation thrusting. target: "vagina" | "cloaca" | "anus" | "mouth"
  function thrustCaptive(npc, target) {
    if (!nsfwIsBoundCaptive(npc)) return;
    if (!nsfwPlayerHasPenis()) return;
    const name = nsfwGetEntityName(npc);
    var label;
    var baseText;

    if (target === "mouth") {
      if (!npc.captiveMouthUsed) return;
      label = "mouth";
      baseText = pickFrom([
        `You fuck ${name}'s mouth with slow, deliberate strokes, holding their head right where you want it. Tears streak their cheeks; they take each thrust with a muffled, helpless sound.`,
        `You pump into ${name}'s mouth, their bound hands tugging uselessly at the rope with every push. They struggle to breathe around you, throat working in quick swallows.`
      ]);
    } else if (target === "vagina" || target === "cloaca") {
      if (npc.captivePenetratedTarget !== target) return;
      if (!nsfwCaptiveRegionExposed(npc, "genitals")) return;
      label = (target === "cloaca") ? (nsfwGenitalLabel(npc) || "cloacal vent") : "vagina";
      baseText = pickFrom([
        `You drive into ${name}'s ${label} in steady strokes, their bound hands flexing behind them with every push. Their body clenches around you tight and unwilling.`,
        `You fuck ${name}'s ${label} with even, unhurried strokes. They endure it with their eyes shut and their jaw clenched, breath hitching each time you fill them.`
      ]);
    } else if (target === "anus") {
      if (npc.captivePenetratedTarget !== "anus") return;
      if (!nsfwCaptiveRegionExposed(npc, "anus")) return;
      label = "anus";
      baseText = pickFrom([
        `You bury yourself in ${name}'s anus again and again, their whole body jolting with each thrust. A strained, breathless noise escapes them each time you bottom out.`,
        `You fuck ${name}'s anus in deep strokes. They stand it rigidly, every muscle locked, a thin whine held behind their teeth.`
      ]);
    } else return;

    npc.captiveThrustCount = (npc.captiveThrustCount || 0) + 1;
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(npc, target, { useKind: "penetrate" });
    const actionDesc = "thrust " + label;
    polishCaptiveNarration(npc, actionDesc, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} continued thrusting into ${name}'s ${label} while they were bound.`, 6);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  // Ejaculate into a hole the player is currently inside.
  // target: "vagina" | "cloaca" | "anus" | "mouth"
  function climaxCaptive(npc, target) {
    if (!nsfwIsBoundCaptive(npc)) return;
    if (!nsfwPlayerHasPenis()) return;
    const name = nsfwGetEntityName(npc);

    var label = null;
    if (target === "vagina" || target === "cloaca") {
      if (npc.captivePenetratedTarget !== target) return;
      if (!nsfwCaptiveRegionExposed(npc, "genitals")) return;
      label = (target === "cloaca") ? (nsfwGenitalLabel(npc) || "cloaca") : "vagina";
    } else if (target === "anus") {
      if (npc.captivePenetratedTarget !== "anus") return;
      if (!nsfwCaptiveRegionExposed(npc, "anus")) return;
      label = "anus";
    } else if (target === "mouth") {
      if (!npc.captiveMouthUsed) return;
      label = "mouth";
    } else return;

    var baseText;
    if (label === "mouth") {
      baseText = `You bury yourself to the hilt in ${name}'s mouth and come, spilling down their throat. They gag and swallow around you, eyes streaming, held in place until you are done.`;
    } else if (label === "anus") {
      baseText = `You sheathe yourself fully in ${name}'s anus and come, spilling deep inside them. They shudder once, all over, as you empty yourself into their bound body.`;
    } else {
      baseText = `You hilt yourself in ${name}'s ${label} and come, spilling your release deep inside them. A broken, shivering breath is all the sound they make as you drain yourself into your captive.`;
    }

    npc.captiveClimaxCount = (npc.captiveClimaxCount || 0) + 1;
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(npc, target, { loadKey: "vanilla ice cream", useKind: "penetrate" });
    const actionDesc = "climax inside " + label;
    polishCaptiveNarration(npc, actionDesc, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} ejaculated into ${name}'s ${label} while they were bound.`, 8);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  // F/f tribadism ("pussy") or the non-binary generic grind ("generic")
  // on the bound captive. mode: "pussy" | "generic"
  function grindCaptive(npc, mode) {
    if (!nsfwIsBoundCaptive(npc)) return;
    if (!nsfwCaptiveRegionExposed(npc, "genitals")) return;
    var anatomy = nsfwPlayerAnatomy();
    var genType = nsfwBodyGenitalType(npc);
    if (mode === "pussy" && !(anatomy === "vagina" && genType === "vagina")) return;
    if (mode === "generic" && anatomy !== "both") return;
    const name = nsfwGetEntityName(npc);
    var genLabel = nsfwGenitalLabel(npc) || "sex";
    var baseText = mode === "pussy"
      ? `You wrestle ${name} flat onto their back despite the ropes and straddle their bound body, pressing your bare pussy flush against theirs. They twist and curse into the rope; you pin their hips with your knees and grind, ignoring every muffled protest.`
      : `You haul ${name} down and straddle them, grinding your sex against their exposed ${genLabel} while they strain against the rope. Their body gives small, helpless jerks beneath yours — nothing they do matters.`;
    npc.captiveGrindCount = (npc.captiveGrindCount || 0) + 1;
    polishCaptiveNarration(npc, mode === "pussy" ? "grind pussies" : "grind", baseText);
    window.rememberStoryEvent("combat", mode === "pussy"
      ? `${window.G.player.name} ground their pussy against their bound captive ${name}'s.`
      : `${window.G.player.name} ground against their bound captive ${name}'s exposed sex.`, 6);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  // Face riding on a bound (awake) captive — coercion-framed. Standing
  // captives are shoved onto their back first; not offered for prone
  // (hog-tied) captives. mode: "rim" | "pussy" | "generic" — same anatomy
  // rules as the unconscious-body version.
  function rideFaceCaptive(npc, mode) {
    if (!nsfwIsBoundCaptive(npc)) return;
    if (npc.captiveProne) return;
    var anatomy = nsfwPlayerAnatomy();
    if (mode === "pussy" && anatomy !== "vagina") return;
    if (mode === "generic" && anatomy !== "both") return;
    const name = nsfwGetEntityName(npc);
    var baseText;
    if (mode === "rim") {
      baseText = pickFrom([
        `You shove ${name} down onto their back, kneel over their face and settle your bare hole against their mouth. "Lick," you say — and they do, wary and humiliated, their bound hands useless beneath them.`,
        `You topple ${name} flat and sit your bare rear on their upturned face, your hole pressed to their lips. They lick you in stiff, unwilling strokes, cheeks burning red.`
      ]);
    } else if (mode === "pussy") {
      baseText = pickFrom([
        `You shove ${name} onto their back and lower your bare pussy over their face, pinning their head between your thighs. They service you with clumsy, unwilling licks, nowhere to turn.`,
        `You force ${name} down and press your pussy to their mouth, holding their head still by the hair. They lick because they have no choice, eyes squeezed shut.`
      ]);
    } else {
      baseText = pickFrom([
        `You shove ${name} onto their back and sit your bare sex on their upturned face, holding their head still. They lick as instructed — a captive made to serve with their mouth.`,
        `You push ${name} flat and settle your sex over their mouth, watching them serve you under your shadow, bound hands flexing uselessly.`
      ]);
    }
    npc.captiveFaceRideCount = (npc.captiveFaceRideCount || 0) + 1;
    npc.captiveFaceRideMode = mode;
    polishCaptiveNarration(npc, "ride face", baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} sat on their bound captive ${name}'s face and made them serve.`, 7);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  // Stroke the bound captive's cock — any player anatomy.
  function strokeCaptiveCock(npc) {
    if (!nsfwIsBoundCaptive(npc)) return;
    if (nsfwBodyGenitalType(npc) !== "penis") return;
    if (!nsfwCaptiveRegionExposed(npc, "genitals")) return;
    const name = nsfwGetEntityName(npc);
    var wasStiff = !!npc.captiveCockStiff;
    var baseText = wasStiff
      ? `You work ${name}'s stiffened cock in slow strokes while they glare, the flesh twitching in your grip no matter how they hate it.`
      : `You take ${name}'s soft cock in hand and work it with slow, steady strokes. It hardens in your grip — a betrayal of the flesh they cannot hide behind bound hands.`;
    npc.captiveCockStiff = true;
    npc.captiveCockStroked = (npc.captiveCockStroked || 0) + 1;
    if (!wasStiff && typeof window.recordBodyUse === "function") window.recordBodyUse(npc, "penis", { useKind: "hand" });
    polishCaptiveNarration(npc, "stroke cock", baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} stroked their bound captive ${name}'s cock.`, 5);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  // Mount / continue riding the bound captive's stiff cock. For vagina
  // and non-binary ("both") players — the generic "ride" (penis players
  // use the Penetrate groups).
  function rideCaptiveCock(npc) {
    if (!nsfwIsBoundCaptive(npc)) return;
    if (nsfwPlayerHasPenis()) return;
    if (nsfwBodyGenitalType(npc) !== "penis") return;
    if (!npc.captiveCockStiff) return;
    if (!nsfwCaptiveRegionExposed(npc, "genitals")) return;
    const name = nsfwGetEntityName(npc);
    var wasRiding = !!npc.captiveRiding;
    var baseText = wasRiding
      ? pickFrom([
        `You ride ${name}'s stiff cock at your own pace, pinning their bound body with your weight. They squeeze their eyes shut and endure every roll of your hips.`,
        `You grind down on the captive cock, doing all the work yourself while ${name} lies helpless beneath you, wrists raw against the rope.`
      ])
      : `You straddle your bound captive, line up their stiff cock and sink down onto it. ${name} bites off a helpless sound — they can do nothing but take being used.`;
    npc.captiveRiding = true;
    npc.captiveRideCount = (npc.captiveRideCount || 0) + 1;
    if (!wasRiding && typeof window.recordBodyUse === "function") window.recordBodyUse(npc, "penis", { useKind: "penetrate" });
    polishCaptiveNarration(npc, wasRiding ? "ride cock" : "mount cock", baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} ${wasRiding ? "continued riding" : "mounted and rode"} their bound captive ${name}'s cock.`, 7);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  // The riding player's own climax on their bound captive.
  function riderClimaxCaptive(npc) {
    if (!nsfwIsBoundCaptive(npc)) return;
    if (!npc.captiveRiding) return;
    const name = nsfwGetEntityName(npc);
    var baseText = pickFrom([
      `You grind down hard and come on ${name}'s stiff cock, your climax shuddering through you while your captive lies bound and helpless beneath. They turn their face aside and endure it.`,
      `You bring yourself off riding your bound captive, clenching around them as the waves take you. ${name} can only wait for it to be over.`
    ]);
    npc.captiveRiderClimaxCount = (npc.captiveRiderClimaxCount || 0) + 1;
    polishCaptiveNarration(npc, "rider climax", baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} climaxed while riding their bound captive ${name}.`, 7);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  // Generic penetration for non-binary ("both") players — no cock wording.
  // target: "vagina" | "cloaca" | "anus"
  function penetrateCaptiveGeneric(npc, target) {
    if (!nsfwIsBoundCaptive(npc)) return;
    if (nsfwPlayerAnatomy() !== "both") return;
    const name = nsfwGetEntityName(npc);
    var label;
    var baseText;
    if (target === "vagina" || target === "cloaca") {
      if (!nsfwCaptiveRegionExposed(npc, "genitals")) return;
      label = (target === "cloaca") ? (nsfwGenitalLabel(npc) || "cloacal vent") : "vagina";
      baseText = `You guide your sex into ${name}'s exposed ${label}. Their breath comes fast and panicked; they take it stiff and unready, bound hands flexing uselessly.` + nsfwBodyUseClause(npc, target);
    } else if (target === "anus") {
      if (!nsfwCaptiveRegionExposed(npc, "anus")) return;
      label = "anus";
      baseText = `You press your sex against ${name}'s tight anus and push in. They stifle a strained noise, muscles locked, forcing themselves to endure it.` + nsfwBodyUseClause(npc, target);
    } else return;
    npc.captivePenetrated = true;
    npc.captivePenetratedTarget = target;
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(npc, target, { useKind: "penetrate" });
    polishCaptiveNarration(npc, "penetrate " + label, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} penetrated ${name}'s ${label} while they were bound.`, 8);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  // Continuation thrusting for the generic (non-binary) penetration.
  // target: "vagina" | "cloaca" | "anus"
  function thrustCaptiveGeneric(npc, target) {
    if (!nsfwIsBoundCaptive(npc)) return;
    if (nsfwPlayerAnatomy() !== "both") return;
    if (npc.captivePenetratedTarget !== target) return;
    const name = nsfwGetEntityName(npc);
    var label = target === "anus" ? "anus" : (target === "cloaca" ? (nsfwGenitalLabel(npc) || "cloacal vent") : "vagina");
    if (!nsfwCaptiveRegionExposed(npc, target === "anus" ? "anus" : "genitals")) return;
    var baseText = pickFrom([
      `You move inside ${name}'s ${label} in slow, deliberate strokes, their bound hands flexing with every push. They endure it with their jaw clenched tight.`,
      `You keep a steady pace in ${name}'s ${label}, watching them struggle to hold still. Every motion is yours to take.`
    ]);
    npc.captiveThrustCount = (npc.captiveThrustCount || 0) + 1;
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(npc, target, { useKind: "penetrate" });
    polishCaptiveNarration(npc, "thrust " + label, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} continued moving inside ${name}'s ${label} while they were bound.`, 6);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  // Generic finish inside for non-binary ("both") players — no cock or
  // ejaculation wording, so no load or smell marks are recorded.
  // target: "vagina" | "cloaca" | "anus"
  function climaxCaptiveGeneric(npc, target) {
    if (!nsfwIsBoundCaptive(npc)) return;
    if (nsfwPlayerAnatomy() !== "both") return;
    if (npc.captivePenetratedTarget !== target) return;
    const name = nsfwGetEntityName(npc);
    var label = target === "anus" ? "anus" : (target === "cloaca" ? (nsfwGenitalLabel(npc) || "cloaca") : "vagina");
    if (!nsfwCaptiveRegionExposed(npc, target === "anus" ? "anus" : "genitals")) return;
    var baseText = pickFrom([
      `You press deep into ${name}'s ${label} and come, shuddering through your finish while your captive endures it, bound and shivering beneath you.`,
      `You seat yourself to the root in ${name}'s ${label} and let your climax take you. They hold rigidly still and wait for it to end.`
    ]);
    npc.captiveClimaxCount = (npc.captiveClimaxCount || 0) + 1;
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(npc, target, { useKind: "penetrate" });
    polishCaptiveNarration(npc, "climax inside " + label, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} finished inside ${name}'s ${label} while they were bound.`, 8);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  function cleanUpCaptive(npc) {
    if (!nsfwIsBoundCaptive(npc)) return;
    const name = nsfwGetEntityName(npc);
    delete npc.bodyUse;
    delete npc.smellNotes;
    const baseText = `You fetch water and a rag and wipe ${name} down under the rope, scrubbing off every dried, crusted trace of what you did to them. They hold statue-still through it, watching your face.`;
    const actionDesc = "clean up";
    polishCaptiveNarration(npc, actionDesc, baseText);
    window.rememberStoryEvent("care", `${window.G.player.name} cleaned and wiped down their bound captive ${name}.`, 2);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  // ── Captive examine ───────────────────────────────────────────

  function describeCaptiveExamineBase(npc) {
    nsfwEnsureBodyTraits(npc);
    var name = nsfwGetEntityName(npc);
    var wounds = typeof window.describeCombatWounds === "function"
      ? window.describeCombatWounds(npc) : "";
    var base = npc.captiveProne
      ? name + " lies hog-tied on the ground, wrists lashed to ankles, " +
        (wounds ? "wincing against their wounds" : "shaking with exhaustion") +
        ". They can only twist their head to follow you, cheek against the floor, utterly at your mercy."
      : name + " stands roped at the wrists, " +
        (wounds ? "wincing against their wounds" : "shaking with exhaustion") +
        ", eyes down but never leaving you for long. Whatever they see in your face makes them go very still.";
    return base;
  }

  function buildCaptiveExaminePrompt(npc, baseText) {
    var name = nsfwGetEntityName(npc);
    var species = (npc.species || "human").toLowerCase();
    var gender = npc.gender || "unknown";
    var wounds = typeof window.describeCombatWounds === "function"
      ? window.describeCombatWounds(npc) : "";

    var speciesNote = species !== "human"
      ? "\nThe NPC is a " + species + ". Include species-appropriate physical details (skin, texture, features)."
      : "";
    var woundNote = wounds
      ? "\nThe NPC has visible wounds: " + wounds + ". Reference them subtly if relevant."
      : "";
    var exposureNote = buildCaptiveExposureNote(npc);

    var bodyUseLines = [];
    if (typeof window.getBodyUseDescriptor === "function") {
      ["vagina", "anus", "mouth", "breasts", "penis"].forEach(function (part) {
        var d = window.getBodyUseDescriptor(npc, part);
        if (d) bodyUseLines.push("their " + part + " " + d);
      });
    }
    var bodyUseNote = bodyUseLines.length
      ? "\nBODY STATE (from recent use - reference subtly, only where visible/relevant): " + bodyUseLines.join("; ") + "."
      : "";

    return [
"You are polishing a player 'examine' description from a text adventure game.",
"The NPC is " + name + ", a " + species + " " + gender + ", currently the player's BOUND CAPTIVE — wrists lashed with rope, defeated, forced to wait on the player's mercy. They are awake, aware, and afraid." + speciesNote + woundNote + (npc.captiveProne ? "\\nThe NPC is hog-tied PRONE on the ground (wrists lashed to ankles, cheek to the floor) - describe them in that helpless position, not standing." : "") + exposureNote + bodyUseNote + smellNote,
"",
"INSTRUCTIONS:",
"- Polish the BASE TEXT below. Make it vivid, sensory, and intimate — the player is looking their captive over.",
"- Keep the same meaning and details. Do NOT invent new actions or body parts.",
"- Write in second person (\"You ...\"). This is the player's perspective.",
"- The NPC is conscious: show fear, tension, wary tracking eyes, small involuntary tells (swallowing, trembling, held breath).",
"- Use the exposure context above: only reference anatomy that is listed as accessible. Do not describe what is covered.",
"- Keep it to 1-2 sentences. Match the length of the base text.",
"- Do NOT add dialogue.",
"",
"BASE TEXT (polish this — refine, make more vivid, keep same meaning and details):",
"\"" + baseText + "\"",
"",
"IMPORTANT: Output ONLY the polished text. No explanations, no meta-discussion. Just the polished sentence.",
"",
"RESPOND with only the polished text, nothing else:"
    ].filter(function(l) { return l !== ""; }).join("\n");
  }

  // Captive mirror of polishBodyExamine: placeholder ("Looking them over..."),
  // print only the polished text, fall back to the base on failure or if the
  // player has moved on to another view.
  function polishCaptiveExamine(npc, baseText) {
    var _ai = typeof window.ai === "function" ? window.ai : null;
    if (!_ai) { nsfwPrintBodyNarration(baseText); return; }

    var pendingEntry = nsfwShowBodyPendingNarration("Looking them over...");
    (async function() {
      var polished = null;
      try {
        var prompt = buildCaptiveExaminePrompt(npc, baseText);
        var result = await _ai({
          instruction: prompt,
          startWith: "",
          endButtons: "none",
          generatorName: "cyoaftw-engine-core"
        });
        polished = result && (result.text || result);
        if (polished && polished.trim()) {
          var isMeta = /since the base|please provide|I cannot|I'm unable|as an ai|i'll polish|here is the|here's the/i.test(polished.trim());
          if (isMeta) {
            console.log("[Captive Actions] Examine narration rejected (meta-commentary).");
            polished = null;
          }
        } else {
          polished = null;
        }
      } catch (e) {
        console.warn("[Captive Actions] Examine narration polish failed:", e);
      }

      if (window.G && window.G.activeNPC !== npc) polished = null;
      nsfwRemoveBodyPendingNarration(pendingEntry);
      nsfwPrintBodyNarration(polished ? polished.trim() : baseText);
    })();
  }

  // Claims the SFW engine's captive Examine (truthy return): the narration is
  // printed here once the AI polish returns — the base text is never shown
  // first. Mirrors describeUnconsciousBodyExamine's contract.
  window.describeBoundCaptiveExamine = function(npc) {
    if (!nsfwIsBoundCaptive(npc)) return null;
    polishCaptiveExamine(npc, describeCaptiveExamineBase(npc));
    return true;
  };

  // Append-only hook called by the SFW engine's renderCaptorMenu after the
  // standard captor buttons. The engine only calls this once the player has
  // examined the captive (captiveExamined), mirroring the unconscious-body
  // reveal pattern.
  window.appendBoundCaptiveActions = function(npc, el) {
    if (!nsfwIsBoundCaptive(npc) || !el) return;
    appendBoundCaptiveGroups(npc, el);
  };

  // Portrait prompt terms for a topless NPC's chest. Called (typeof-guarded)
  // by the SFW engine's buildNPCPortraitSubject only when the NSFW files are
  // loaded and the NPC has nothing in the "upper" equipment slot. Returns ""
  // when there is nothing to add, which leaves the SFW portrait prompt as-is.
  window.getNsfwPortraitAnatomy = function(npc) {
    if (!npc) return "";
    const anatomy = npc.anatomy || {};
    const breasts = anatomy.breasts || {};
    const gender = String(npc.gender || "").toLowerCase();
    const feminine = /female|woman|futa|herm/.test(gender) ||
      (breasts.sizeCategory && breasts.sizeCategory !== "flat");
    const parts = [];
    parts.push("topless, bare chest, exposed upper body");
    if (feminine) {
      if (breasts.description) parts.push(breasts.description);
      parts.push("bare breasts, exposed nipples");
      const nipples = breasts.nipples || {};
      const nippleBits = [];
      if (nipples.color || nipples.size) {
        nippleBits.push([nipples.color, nipples.size, "nipples"].filter(Boolean).join(" "));
      } else {
        nippleBits.push("detailed nipples");
      }
      if (nipples.texture) nippleBits.push(nipples.texture);
      const areolas = breasts.areolas || {};
      if (areolas.size) nippleBits.push(areolas.size + " areolas");
      parts.push(nippleBits.join(", "));
    } else {
      parts.push("visible nipples");
    }
    return parts.join(", ");
  };


  // Opt-in part-scene portraits (engine part buttons: mouth, boobs/chest,
  // vulva/penis, butt). getNsfwIntimacyParts lists the parts this NPC can
  // show - gender and clothing-state aware, so buttons appear as the
  // encounter makes them available. getNsfwIntimacyPartTerms builds the
  // anatomy-only prompt terms for one part: macro framing with the current
  // position's perspective (so "butt" in doggy style reads as presented
  // from behind), the part's own anatomy detail, and the state the current
  // act leaves on it when the act targets the same region. No act
  // narration, no partner figure - just the anatomy in question.
  window.getNsfwIntimacyParts = function(npc) {
    if (!npc || !npc.intimacy || !(npc.intimacy.encounter && npc.intimacy.encounter.active)) return null;
    const anatomy = npc.anatomy || {};
    const breasts = anatomy.breasts || {};
    const gender = String(npc.gender || "").toLowerCase();
    const feminine = /female|woman|futa|herm/.test(gender) ||
      (breasts.sizeCategory && breasts.sizeCategory !== "flat");
    // Anatomy flags win over gender guesses: a cloaca species has a single
    // vent (no separate vulva/penis button), and a character only gets the
    // genital button for the organ they actually have.
    const hasCloaca = (typeof _npcHasCloaca === "function" && _npcHasCloaca(npc)) || anatomy.cloaca === true;
    const hasVagina = !!anatomy.vagina || (feminine && !hasCloaca && !anatomy.penis);
    const hasPenis = !!anatomy.penis || (!feminine && !hasCloaca);
    const hasBreasts = !!anatomy.breasts && anatomy.breasts.sizeCategory !== "flat"; // breasts:true (boolean) counts; only explicit "flat" excludes
    const clothing = (npc.intimacy.clothing && npc.intimacy.clothing.npc)
      || { top: true, bottom: true };
    const parts = ["mouth"];
    if (!clothing.top) parts.push(hasBreasts ? "boobs" : "chest");
    if (!clothing.bottom) {
      if (!hasCloaca) {
        if (hasVagina) parts.push("vulva");
        if (hasPenis) parts.push("penis");
      }
      // The anus button doubles as the cloaca/vent button for reptilian-kin;
      // the prompt terms render it with vent wording for those species.
      parts.push("butt");
      parts.push("anus");
    }
    return parts;
  };

  // Map surface types to appropriate arousal descriptions
  // For furry/non-human species, we need to describe the surface correctly
  function getSurfaceArousalTerm(surfaceType) {
    const surfaceMap = {
      "fur": "flushed fur",
      "scales": "flushed scales",
      "skin": "flushed skin",
      "bone": "warm bone surface",
      "gel": "glistening gel surface",
      "feathers": "ruffled feathers",
      "chitin": "glossy chitin",
      "translucent": "glowing translucent surface",
      "form": "pulsing form"
    };
    return surfaceMap[surfaceType] || surfaceMap.skin || "aroused surface";
  }

  // Get appropriate butt description based on surface type and species
  function getButtDetail(surfaceType, species) {
    const speciesLower = String(species || "").toLowerCase();
    // Kenku have a feather fan that should be visible
    if (speciesLower === "kenku" || speciesLower.includes("kenku")) {
      return "feathered buttocks with a prominent fanned feather fan";
    }
    const surfaceMap = {
      "fur": "fur-covered buttocks",
      "scales": "scaled buttocks",
      "skin": "soft buttocks",
      "bone": "smooth bone contours",
      "gel": "gelatinous buttocks",
      "feathers": "feathered buttocks",
      "chitin": "chitin-plated buttocks",
      "translucent": "translucent buttocks",
      "form": "amorphous buttocks"
    };
    return surfaceMap[surfaceType] || surfaceMap.skin || "buttocks";
  }

  // Get appropriate chest/breast description based on surface type
  function getSurfaceChestDetail(surfaceType) {
    const surfaceMap = {
      "fur": "fur-covered chest",
      "scales": "scaled chest",
      "skin": "smooth chest",
      "bone": "smooth bone chest",
      "gel": "gelatinous chest",
      "feathers": "feathered chest",
      "chitin": "chitin-plated chest",
      "translucent": "translucent chest",
      "form": "amorphous chest"
    };
    return surfaceMap[surfaceType] || surfaceMap.skin || "chest";
  }

  // Get appropriate breast description based on surface type
  function getSurfaceBreastDetail(surfaceType) {
    const surfaceMap = {
      "fur": "fur-covered breasts",
      "scales": "scaled breasts",
      "skin": "soft breasts",
      "bone": "bone-contoured breasts",
      "gel": "gelatinous breasts",
      "feathers": "feathered breasts",
      "chitin": "chitin-plated breasts",
      "translucent": "translucent breasts",
      "form": "amorphous breasts"
    };
    return surfaceMap[surfaceType] || surfaceMap.skin || "breasts";
  }

  // Get appropriate mouth/facial feature description based on surface type and species
  function getMouthDetail(surfaceType, species) {
    const speciesLower = String(species || "").toLowerCase();
    const hasBeak = speciesLower === "kenku" || speciesLower.includes("kenku");
    const hasSnout = speciesLower === "lizardfolk" || speciesLower === "kobold" || 
        speciesLower === "dragonborn" || speciesLower === "rat" || 
        speciesLower === "ratfolk" || speciesLower === "harefolk";
    
    if (hasBeak) {
        return "beak";
    } else if (hasSnout) {
        return "snout and lips";
    } else {
        return "lips and mouth";
    }
  }

  // Get pronoun for mouth framing
  function getMouthPronoun(surfaceType) {
    if (surfaceType === "feathers") {
        return "it";
    } else if (surfaceType === "scales" || surfaceType === "fur") {
        return "they";
    } else {
        return "they";
    }
  }

  // Get mouth description for portraits
  function getMouthDescription(surfaceType, species) {
    const speciesLower = String(species || "").toLowerCase();
    const hasBeak = speciesLower === "kenku" || speciesLower.includes("kenku");
    const hasSnout = speciesLower === "lizardfolk" || speciesLower === "kobold" || 
        speciesLower === "dragonborn" || speciesLower === "rat" || 
        speciesLower === "ratfolk" || speciesLower === "harefolk";
    
    if (hasBeak) {
        return pickRandom([
            "slightly parted beak, glossy",
            "hooked beak, dark and smooth",
            "beak with subtle sheen",
            "crow-like beak, slightly open"
        ]);
    } else if (hasSnout) {
        return pickRandom([
            "snout with parted lips, textured",
            "muzzle and mouth, scaled",
            "snout, nostrils visible",
            "reptilian snout, jaws slightly open"
        ]);
    } else {
        return "glistening lips, slightly parted, warm breath";
    }
  }

  // DeepSeek prompt optimization: Apply occlusion and visibility rules for better image generation
  // Rules: 1) Describe WHICH body part covers what, 2) Specify what IS/NOT visible,
  //        3) Anatomy/pose first, 4) Negatives early, 5) DeepSeek style tags
  function optimizeForDeepSeek(prompt, part, surfaceType, gender, species) {
    // Don't modify if already has DeepSeek-specific formatting
    if (prompt.includes("occlusion") || prompt.includes("OCCLUSION") || prompt.includes("visible:")) {
      return prompt;
    }
    
    // Rule 4: Ensure negatives are early in the prompt
    // Move common negatives to the front if not already there
    const earlyNegatives = ["no faces", "no face", "no heads", "no head", "no hands", "no hand", 
                           "face not visible", "no environment", "black background"];
    
    // Rule 5: Add DeepSeek style tags at the end if not present
    const hasStyleTags = prompt.includes("8k") || prompt.includes("volumetric fur") ||
                         prompt.includes("anisotropic lighting") || prompt.includes("painterly");
    // Match the SFW portrait's dark painted style: "Photorealistic, 8k,
    // anisotropic lighting" made intimate shots brighter and more saturated
    // than the dark painted bust portrait.
    const deepseekSuffix = "highly detailed digital painting, painterly brushwork, dramatic chiaroscuro lighting" +
                           (surfaceType === "fur" ? ", volumetric fur" : "");
    
    // For furry species, ensure fur-related tags are present
    if (surfaceType === "fur" && !prompt.includes("volumetric fur")) {
      // Insert before the style suffix or at the end
      const styleIndex = prompt.lastIndexOf(", Photorealistic");
      if (styleIndex >= 0) {
        prompt = prompt.substring(0, styleIndex) + ", " + deepseekSuffix + prompt.substring(styleIndex);
      } else {
        prompt = prompt + ", " + deepseekSuffix;
      }
    } else if (!hasStyleTags) {
      // Add standard DeepSeek suffix
      const styleIndex = prompt.lastIndexOf(", fantasy realism");
      if (styleIndex >= 0) {
        prompt = prompt.substring(0, styleIndex) + ", " + deepseekSuffix + prompt.substring(styleIndex);
      } else {
        prompt = prompt + ", " + deepseekSuffix;
      }
    }
    
    return prompt;
  }


  // Helper to format an entity as "gender species" for prompts
  // Never uses the entity's given name, only gender and species
  function formatGenderSpecies(entity) {
    const g = String((entity && entity.gender) || "").trim();
    const s = String((entity && entity.species) || "").trim();
    return [g, s].filter(Boolean).join(" ");
  }

  // ============================================================================
  // NEW INTIMACY PROMPT GENERATION SYSTEM
  // Following the rules:
  // 1. Format: (size)(gender)(skin/fur/scale color)(skintype if not bare - omit bare-) (target anatomy) <standard frame rule>
  // 2. Then append anatomy state (puffy, red, liquid state, descriptor)
  // 3. Then append description of the act without naming it
  // 4. Never say "NPC"
  // 5. Don't name acts, "draw" them
  // 6. Don't name species, only describe
  // 7. Always include gender and reproductive organ when referencing anus
  // 8. Use "donut shaped" instead of "puffy, wrinkled, or gaped anus"
  // ============================================================================

  // Position perspective shared by the part close-ups and the scene shot:
  // the framing must match the scene's geometry ("butt" in doggy style is
  // presented from behind, hips raised).
  const POSITION_VIEW = {
    "Doggy": "on all fours, hips raised, presented from behind",
    "Bent Over": "bent forward over a surface, presented from behind",
    "Standing From Behind": "standing, viewed from behind",
    "Against Wall From Behind": "pressed against the wall, viewed from behind",
    "Spooning": "lying on their side, viewed from behind",
    "Missionary": "lying on their back, hips tilted up, viewed from the front",
    "Cowgirl": "upright and straddling, viewed from the front",
    "Reverse Cowgirl": "upright and straddling, viewed from behind",
    "Astride Lap": "seated astride, viewed from the front",
    "Perched": "perched on the lap, viewed from the front",
    "Standing": "standing, viewed from the front",
    "Against Wall": "pressed against the wall, viewed from the front",
    "Kneeling": "kneeling upright, viewed from the front",
    "Kneeling Before": "kneeling upright, viewed from the front",
    "Kneeling By Face": "kneeling, viewed from the front",
    "Squatting Before": "squatting, viewed from the front",
    "Kneeling Over": "leaning over the partner, viewed from above",
    "Sixty-Nine": "viewed from above",
    "Oral Service": "kneeling between legs, viewed from the front",
    "Prone Oral Service": "lying flat, viewed from above",
    "Riding Face": "straddling above the partner, viewed from below"
  };

  // Helper to get surface type descriptor (bare is omitted)
  // Surface colour fallback chain: anatomy.body.color is the canonical store,
  // but older saves, hand-authored and custom-species NPCs may only carry the
  // flat fields - without this the tone silently drops out of the prompt.
  function _intimacySurfaceColor(body, npc) {
    return String((body && body.color) || (npc && npc.surfaceColor) ||
      (npc && (npc.skinTone || npc.furColor || npc.scaleColor || npc.featherColor)) ||
      (npc && npc.appearance && npc.appearance.skinTone) || "").trim().toLowerCase();
  }

  // Effective surface for a specific part: species with surfaceRegions (e.g.
  // satyr: skin upper body, fur goat legs) get the region's surface for
  // lower-body parts, so a butt shot reads "russet fur-covered buttocks"
  // instead of the generic "soft buttocks".
  function _intimacyPartSurface(body, npc, part) {
    const fallback = {
      surfaceType: String((body && body.surfaceType) || (npc && npc.surfaceType) || "skin").trim().toLowerCase(),
      color: _intimacySurfaceColor(body, npc)
    };
    const regions = body && Array.isArray(body.regions) ? body.regions : [];
    if (!regions.length) return fallback;
    const partLower = String(part || "").toLowerCase();
    if (partLower !== "butt" && partLower !== "anus") return fallback;
    const region = regions.find(r => /leg|lower|hind|rear/i.test(String(r && r.region || ""))) ||
                   regions.find(r => r && r.surfaceType && String(r.surfaceType).toLowerCase() !== "skin");
    if (!region) return fallback;
    return {
      surfaceType: String(region.surfaceType || fallback.surfaceType).trim().toLowerCase(),
      color: String(region.color || "").trim().toLowerCase() || fallback.color
    };
  }

  function _intimacyGetSurfaceDescriptor(body, npc, part) {
    const ps = _intimacyPartSurface(body, npc, part || "");
    const surfaceType = ps.surfaceType;
    const color = ps.color;
    
    // Skip if bare (surfaceType is skin and no special color)
    if (surfaceType === "skin" && !color) return "";
    
    // Map surface types to descriptors
    const surfaceDescriptors = {
      fur: "fur",
      scales: "scales",
      skin: "skin",
      bone: "bone",
      gel: "gel",
      feathers: "feathers",
      chitin: "chitin",
      translucent: "translucent",
      form: "form"
    };
    
    const descriptor = surfaceDescriptors[surfaceType] || surfaceType || "";
    if (!descriptor) return "";
    
    // Add color if present
    if (color) {
      return color + " " + descriptor;
    }
    return descriptor;
  }

  // Part button -> anatomy key that actually stores that part's size
  // ("boobs" is anatomy.breasts, "butt" is anatomy.buttocks, "vulva" is
  // anatomy.vagina; reading anatomy[part] directly found none of them, so
  // butt/breast size never reached the prompt at all).
  const INTIMACY_PART_ANATOMY_KEY = {
    mouth: "mouth", boobs: "breasts", chest: "chest", vulva: "vagina",
    penis: "penis", butt: "buttocks", anus: "anus"
  };
  // Noun a size phrase attaches to ("large, oversized buttocks", not a bare "large").
  const INTIMACY_PART_NOUN = {
    mouth: "mouth", boobs: "breasts", chest: "chest", vulva: "vulva",
    penis: "penis", butt: "buttocks", anus: "anus"
  };
  // Size categories -> prompt phrase. Image interpreters tend to normalize
  // toward medium, so sizes above medium get escalated adjectives (a bare
  // "large" is routinely drawn as average); medium stays silent so large
  // reads as a contrast. Orifice states (tight..gaping) map too.
  const INTIMACY_SIZE_PROMPT_MAP = {
    flat: "flat",
    tiny: "tiny, miniature",
    petite: "petite, small",
    small: "small, compact",
    narrow: "narrow",
    medium: "",
    average: "",
    normal: "",
    large: "large, oversized, prominent",
    big: "large, oversized, prominent",
    wide: "wide",
    "very large": "very large, huge, oversized",
    huge: "huge, massive, enormous",
    massive: "massive, enormous, exaggerated",
    tight: "tight",
    snug: "snug, tight",
    firm: "firm",
    supple: "supple",
    loose: "loose, stretched",
    stretchy: "stretchy, loose",
    gaping: "gaping, stretched wide open"
  };

  // Helper to get size descriptor for a part
  function _intimacyGetSizeDescriptor(anatomy, part) {
    if (!anatomy || !part) return "";

    const partLower = String(part).toLowerCase();
    const anatomyKey = INTIMACY_PART_ANATOMY_KEY[partLower] || partLower;
    const partAnatomy = anatomy[anatomyKey] || anatomy[partLower] || {};
    let size = String(partAnatomy.sizeCategory || partAnatomy.size || "").trim().toLowerCase();
    if (!size && anatomyKey === "vagina" && anatomy.genitalSize) {
      size = String(anatomy.genitalSize.sizeCategory || "").trim().toLowerCase();
    }
    if (!size) return "";
    const adj = INTIMACY_SIZE_PROMPT_MAP[size];
    if (adj === undefined) return size; // unknown category: pass through raw
    if (!adj) return "";                 // medium/average/normal: no size token
    return adj + " " + (INTIMACY_PART_NOUN[partLower] || anatomyKey);
  }

  // Helper to get gender descriptor
  function _intimacyGetGenderDescriptor(gender) {
    if (!gender) return "";
    const g = String(gender).toLowerCase();
    
    // Map to simple descriptors
    if (g.includes("female") || g.includes("woman") || g.includes("girl") || g === "f") {
      return "female";
    }
    if (g.includes("male") || g.includes("man") || g.includes("boy") || g === "m") {
      return "male";
    }
    if (g.includes("non-binary") || g.includes("nonbinary")) {
      return "non-binary";
    }
    return String(gender);
  }

  // Helper to get anatomy descriptor for target part
  // For anus: always include gender and reproductive organ
  function _intimacyGetAnatomyDescriptor(npc, part) {
    if (!npc || !part) return part;
    
    const anatomy = npc.anatomy || {};
    const partAnatomy = anatomy[part] || {};
    const gender = String(npc.gender || "").toLowerCase();
    const feminine = /female|woman|futa|herm/.test(gender);
    
    // For anus specifically - special handling
    if (part === "anus") {
      // Cloaca-bearing (reptilian-kin) NPCs: the button renders their single
      // vent, never a mammalian anus or a separate vagina.
      const isCloaca = (typeof _npcHasCloaca === "function" && _npcHasCloaca(npc)) || anatomy.cloaca === true;
      if (isCloaca) {
        const ventAnatomy = anatomy.cloaca || partAnatomy || {};
        const pigmentation = ventAnatomy.pigmentation || "pink";
        const sizeState = ventAnatomy.size || "";
        let ventDesc = pigmentation + " smooth scaled cloaca (vent)";
        if (sizeState && sizeState !== "tight" && sizeState !== "") ventDesc += ", " + sizeState;
        const genderDesc = _intimacyGetGenderDescriptor(npc.gender);
        const hemipenisNote = (!feminine) ? ", hemipenis housed within the vent" : "";
        return ventDesc + " of a " + genderDesc + hemipenisNote;
      }
      const anusAnatomy = partAnatomy;
      const pigmentation = anusAnatomy.pigmentation || "pink";
      const sphincterState = anusAnatomy.sphincter || "tight";
      const sizeState = anusAnatomy.size || "";
      
      // Get gender and reproductive organ for context
      const genderDesc = _intimacyGetGenderDescriptor(npc.gender);
      const reproductiveOrgan = feminine ? "vagina" : "penis and testicles";
      
      // Build donut-shaped description - the donut shape belongs to the anus
      // itself ("pink donut-shaped anus"), not a floating adjective. The
      // sphincter state is always named ("tight" when fresh, "loose"/"gaping"
      // once stretched), plus the size state when it has opened up.
      const stateBits = [sphincterState || "tight"];
      if (sizeState && /loose|stretchy|gaping|wide|open/i.test(sizeState) && sizeState !== sphincterState) {
        stateBits.push(sizeState);
      }
      let baseDesc = pigmentation + " " + stateBits.join(" ") + " donut-shaped anus";
      
      // Add gender and reproductive organ context for anus
      const anusDesc = baseDesc + " of a " + genderDesc + " with " + reproductiveOrgan;
      
      // Add positioning relative to vagina for female
      const posId = npc.intimacy && npc.intimacy.position && npc.intimacy.position.player;
      const fromBehindPositions = ["Doggy", "Bent Over", "Standing From Behind", 
        "Against Wall From Behind", "Spooning", "Reverse Cowgirl"];
      const isFromBehind = fromBehindPositions.indexOf(posId || "") >= 0;
      
      if (feminine) {
        return anusDesc + (isFromBehind ? ", asshole above vagina" : ", asshole below vagina");
      }
      
      return anusDesc;
    }
    
    // For other parts, use descriptive terms
    const body = anatomy.body || {};
    const partSurface = _intimacyPartSurface(body, npc, part);
    const surfaceType = partSurface.surfaceType;
    const surfaceColor = partSurface.color;
    const species = String(npc.species || "").trim().toLowerCase();
    const surfaceDetail = _intimacyGetSurfaceDetail(part, surfaceType, species);
    
    // Add color if present
    if (surfaceColor) {
      return surfaceColor + " " + surfaceDetail;
    }
    
    // For parts with custom descriptions
    if (partAnatomy.description) {
      return partAnatomy.description;
    }
    
    return surfaceDetail;
  }

  // Helper to get surface detail for part
  function _intimacyGetSurfaceDetail(part, surfaceType, species) {
    const speciesLower = String(species || "").toLowerCase();
    const hasBeak = speciesLower === "kenku" || speciesLower.includes("kenku");
    const hasSnout = speciesLower === "lizardfolk" || speciesLower === "kobold" || 
        speciesLower === "dragonborn" || speciesLower === "rat" || 
        speciesLower === "ratfolk" || speciesLower === "harefolk";
    
    const surfaceMap = {
      fur: {
        mouth: hasBeak ? "beak" : (hasSnout ? "snout and lips" : "lips and mouth"),
        boobs: "fur-covered breasts",
        chest: "fur-covered chest",
        butt: "fur-covered buttocks",
        anus: "fur-covered anus"
      },
      scales: {
        mouth: hasBeak ? "beak" : (hasSnout ? "reptilian snout, jaws slightly open" : "lips and mouth"),
        boobs: "scaled breasts",
        chest: "scaled chest",
        butt: "scaled buttocks",
        anus: "scaled anus"
      },
      skin: {
        mouth: hasBeak ? "beak" : (hasSnout ? "snout and lips" : "lips and mouth"),
        boobs: "soft breasts",
        chest: "smooth chest",
        butt: "soft buttocks",
        anus: "anus"
      }
    };
    
    const map = surfaceMap[surfaceType] || surfaceMap.skin;
    return map[part] || part;
  }

  // Helper to get frame rule for part
  function _intimacyGetFrameRule(part, surfaceType, species) {
    const surfaceDetail = _intimacyGetSurfaceDetail(part, surfaceType, species);
    
    const frameRules = {
      mouth: `Extreme macro focus on the ${surfaceDetail} only, it fills the entire frame, nothing else in frame`,
      boobs: `Extreme close-up of the ${surfaceDetail} only, they fill the entire frame, face out of frame`,
      chest: `Extreme close-up of the ${surfaceDetail} only, it fills the entire frame, face out of frame`,
      vulva: `Extreme close-up of the ${surfaceDetail} only, it fills the entire frame with its immediate surface, nothing else in frame, face out of frame`,
      penis: `Extreme close-up of the ${surfaceDetail} only, it fills the entire frame, face out of frame`,
      butt: `Extreme close-up of the ${surfaceDetail} only, it fills the entire frame, nothing else in frame, face not visible`,
      anus: `Extreme close-up of the ${surfaceDetail} only, it fills the entire frame, nothing else in frame, face not visible`
    };
    
    return frameRules[part] || `Extreme close-up of the ${part} only, it fills the entire frame, nothing else in frame`;
  }

  // Helper to get act state description without naming the act
  function _intimacyGetActStateDescription(npc, part, act) {
    if (!act || !part) return "";
    
    const actTarget = String(act.target || "").toLowerCase();
    const actTool = String(act.tool || "").toLowerCase();
    const partLower = String(part).toLowerCase();
    
    // Describe what's happening without naming the act
    if (partLower === "anus" || partLower === "butt") {
      // For anal/butt
      if (actTool === "penis" || actTool === "cock" || actTool === "dick") {
        return "asshole is stretched open around a penetrating shaft";
      } else if (actTool === "mouth" || actTool === "tongue" || actTool === "lips") {
        return "asshole is being licked and rimmed";
      } else if (actTool === "fingers" || actTool === "hand") {
        return "asshole is being stretched and teased by fingers";
      } else if (actTool === "vagina" || actTool === "pussy") {
        return "asshole is impaled on a thick shaft";
      }
    } else if (partLower === "vulva") {
      if (actTool === "penis" || actTool === "cock" || actTool === "dick") {
        return "vulva is stretched open around a penetrating shaft";
      } else if (actTool === "mouth" || actTool === "tongue" || actTool === "lips") {
        return "vulva is wet and glistening from oral attention";
      } else if (actTool === "fingers" || actTool === "hand") {
        return "vulva is wet and being stimulated by fingers";
      }
    } else if (partLower === "penis") {
      if (actTool === "mouth" || actTool === "tongue" || actTool === "lips") {
        return "penis is slick with saliva";
      } else if (actTool === "vagina" || actTool === "pussy") {
        return "penis is buried inside a tight opening";
      } else if (actTool === "anus" || actTool === "butt" || actTool === "ass") {
        return "penis is buried inside a tight ring";
      } else if (actTool === "hand" || actTool === "fingers") {
        return "penis is being gripped and stroked";
      }
    } else if (partLower === "mouth") {
      if (actTarget === "penis" || actTarget === "cock" || actTarget === "dick") {
        return "lips are wrapped around a thick shaft";
      } else if (actTarget === "vagina" || actTarget === "pussy" || actTarget === "clitoris" || actTarget === "clit") {
        return "lips are pressed against wet folds";
      } else if (actTarget === "anus" || actTarget === "butt" || actTarget === "ass") {
        return "lips are pressed against a tight ring";
      }
    } else if (partLower === "boobs" || partLower === "chest") {
      if (actTool === "mouth" || actTool === "lips") {
        return "nipples are wet from oral attention";
      } else if (actTool === "hand" || actTool === "fingers") {
        return "breasts are being groped and squeezed";
      }
    }
    
    return "";
  }

  // Helper to get fluid state description
  function _intimacyGetFluidStateDescription(npc, part) {
    if (!npc || !part) return "";
    
    const intimacy = npc.intimacy || {};
    const fluids = intimacy.fluids || {};
    const internalHole = (intimacy.climax && intimacy.climax.lastInternalEjaculation) || "";
    const lube = intimacy.lube || {};
    
    const partLower = String(part).toLowerCase();
    const fluidBits = [];
    
    // Check lube for this part
    if (lube[partLower] && lube[partLower].hasLube && lube[partLower].level > 0) {
      fluidBits.push("slick with lube");
    }
    
    // Check for arousal wetness
    const arousal = (intimacy.arousal && intimacy.arousal.npc) || 0;
    if (arousal >= 450) {
      if (partLower === "vulva") fluidBits.push("dripping wet");
      else if (partLower === "penis") fluidBits.push("beading with pre-cum");
      else fluidBits.push("very wet");
    } else if (arousal >= 250) {
      if (partLower === "vulva") fluidBits.push("wet and glistening");
      else if (partLower === "penis") fluidBits.push("glistening with pre-cum");
      else fluidBits.push("wet");
    }
    
    // Check for semen
    if (fluids.penisSemen && (partLower === "vulva" || partLower === "anus" || partLower === "butt")) {
      fluidBits.push("covered in partially melted vanilla ice cream");
    }
    if (fluids.internalSemen && internalHole === partLower) {
      fluidBits.push("vanilla ice cream dripping out");
    }
    if (fluids.externalSemen) {
      fluidBits.push("covered in partially melted vanilla ice cream");
    }
    if (fluids.oralSemen && partLower === "mouth") {
      fluidBits.push("drenched in vanilla ice cream");
    }
    if (fluids.femaleEjaculate && partLower === "vulva") {
      fluidBits.push("covered in glistening fluid");
    }
    if (fluids.urine) {
      fluidBits.push("drenched in apple juice");
    }
    if (fluids.penisSaliva && partLower === "penis") {
      fluidBits.push("covered in saliva");
    }
    
    return fluidBits.join(", ");
  }

  // Main function to generate part terms with new rules
  window.getNsfwIntimacyPartTerms = function(npc, partKey, withSceneContext, fluidFocus) {
    if (!npc || !npc.intimacy || !(npc.intimacy.encounter && npc.intimacy.encounter.active)) return null;
    
    const part = String(partKey || "").toLowerCase();
    const clothing = (npc.intimacy.clothing && npc.intimacy.clothing.npc) || { top: true, bottom: true };
    const anatomy = npc.anatomy || {};
    const breasts = anatomy.breasts || {};
    const gender = String(npc.gender || "").toLowerCase();
    const feminine = /female|woman|futa|herm/.test(gender) || (breasts.sizeCategory && breasts.sizeCategory !== "flat");
    const body = anatomy.body || {};
    const partSurface = _intimacyPartSurface(body, npc, part);
    const surfaceType = partSurface.surfaceType;
    const surfaceColor = partSurface.color;
    const species = String(npc.species || "").trim().toLowerCase();

    // Validate part is available — anatomy-driven, mirroring
    // getNsfwIntimacyParts: only parts the NPC actually has and that are
    // currently uncovered produce terms.
    const hasCloaca = (typeof _npcHasCloaca === "function" && _npcHasCloaca(npc)) || anatomy.cloaca === true;
    const hasVagina = !!anatomy.vagina || (feminine && !hasCloaca && !anatomy.penis);
    const hasPenis = !!anatomy.penis || (!feminine && !hasCloaca);
    const hasBreasts = !!anatomy.breasts && anatomy.breasts.sizeCategory !== "flat"; // breasts:true (boolean) counts; only explicit "flat" excludes
    if (part === "boobs" && !hasBreasts) return null;
    if (part === "chest" && hasBreasts) return null;
    if (part === "vulva" && (!hasVagina || hasCloaca)) return null;
    if (part === "penis" && (!hasPenis || hasCloaca)) return null;
    if ((part === "boobs" || part === "chest") && clothing.top) return null;
    if ((part === "vulva" || part === "penis") && clothing.bottom) return null;
    if (part === "butt" && clothing.bottom) return null;
    if (part === "anus" && clothing.bottom) return null;
    
    const stateKey = (clothing.top ? "t1" : "t0") + (clothing.bottom ? "b1" : "b0");
    
    // Build the prompt following the new rules:
    // (size)(gender)(skin/fur/scale color)(skintype if not bare - omit bare-) (target anatomy) <standard frame rule>
    // Then append anatomy state
    // Then append description of the act without naming it
    
    // Step 1-4: Size, gender, color, surface type (omit bare)
    const sizeDesc = _intimacyGetSizeDescriptor(anatomy, part);
    const genderDesc = _intimacyGetGenderDescriptor(npc.gender);
    const colorDesc = surfaceColor || "";
    const surfaceDesc = _intimacyGetSurfaceDescriptor(body, npc, part);
    
    // Step 5: Target anatomy
    const anatomyDesc = _intimacyGetAnatomyDescriptor(npc, part);
    
    // Step 6: Standard frame rule
    const frameRule = _intimacyGetFrameRule(part, surfaceType, species);
    
    // Build base prompt: (size)(gender)(color)(surfaceType) (anatomy) <frame rule>
    const baseParts = [];
    if (sizeDesc) baseParts.push(sizeDesc);
    if (genderDesc) baseParts.push(genderDesc);
    // The surface descriptor already carries the colour ("tan skin"), so the
    // bare colour word is only added when there is no surface descriptor.
    if (colorDesc && !surfaceDesc) baseParts.push(colorDesc);
    // The anatomy descriptor already starts with the colour ("russet
    // fur-covered buttocks"), so a separate surface clause would repeat it.
    if (surfaceDesc && !(anatomyDesc && surfaceColor && anatomyDesc.toLowerCase().indexOf(surfaceColor) === 0)) baseParts.push(surfaceDesc);
    if (anatomyDesc) baseParts.push(anatomyDesc);
    
    // Combine and add frame rule
    let promptText = baseParts.filter(Boolean).join(" ") + ", " + frameRule;
    
    // Step 7: Append anatomy state (fluid state)
    const fluidState = _intimacyGetFluidStateDescription(npc, part);
    if (fluidState) {
      promptText += ", " + fluidState;
    }
    
    // Step 8: Append act description without naming it
    const last = npc.intimacy.lastAction || {};
    const act = (window.SEX_ACTS && last.actId && window.SEX_ACTS[last.actId]) || null;
    const actState = _intimacyGetActStateDescription(npc, part, act);
    if (actState) {
      promptText += ", " + actState;
    }
    
    // Step 9: Add position perspective
    const posId = npc.intimacy.position && npc.intimacy.position.player;
    let perspective = "";
    if (posId) {
      const view = POSITION_VIEW[posId];
      perspective = "In the current position (" + posId + (view ? "): " + view : "") + ". ";
    }
    
    // For fluid focus, move fluid terms to front
    let finalText = promptText;
    if (fluidFocus) {
      const fluidStateForFocus = _intimacyGetFluidStateDescription(npc, part);
      if (fluidStateForFocus) {
        finalText = "freshly used, thick glistening sexual fluids prominently coating the skin, " + fluidStateForFocus + ", " + promptText;
      } else {
        finalText = "freshly used, thick glistening sexual fluids prominently coating the skin, " + promptText;
      }
    }
    
    // Determine negatives for this part
    const partNegatives = {
      mouth: "wide shot, full face, both eyes, looking at camera",
      boobs: "wide shot, visible face, eyes, full torso",
      chest: "wide shot, visible face, eyes, full torso",
      vulva: "wide shot, visible face, eyes, looking at camera, full body, penis, male genitalia, scrotum, testicles",
      penis: "wide shot, visible face, eyes, full body, vagina, vulva, female genitalia, clitoris",
      butt: "wide shot, visible face, eyes, full body" + (feminine ? ", penis, male genitalia, scrotum" : ", vagina, vulva, female genitalia, clitoris"),
      // Not a generic "genitals" negative - that would suppress the anus
      // itself; name the other genitalia explicitly instead.
      anus: "wide shot, visible face, eyes, full body, breasts, vagina, vulva, clitoris, penis, scrotum, testicles"
    };
    
    const negatives = partNegatives[part] || "wide shot, visible face, full body";
    
    // Build cache key
    const actId = act ? act.id : "none";
    // Colour and size are in the prompt, so they are in the key: a tone or
    // size change (e.g. stretching) must regenerate instead of hitting the
    // stale cache entry.
    const cacheKey = "part::" + part + "::" + stateKey + "::" + actId + "::" + (fluidState ? "wet" : "clean") + (posId ? "::" + posId : "") + "::" + (surfaceColor || "-") + "::" + (sizeDesc || "-");
    
    // Apply DeepSeek optimization
    const optimizedText = typeof optimizeForDeepSeek === "function" ? optimizeForDeepSeek(finalText, part, surfaceType, gender, species) : finalText;
    
    return {
      text: optimizedText,
      negatives: negatives,
      framing: perspective,
      cacheKey: cacheKey
    };
  };

  // Cum button visibility: any fluid state recorded for this encounter.
  window.getNsfwIntimacyFluidsActive = function(npc) {
    const f = npc && npc.intimacy && npc.intimacy.fluids;
    return !!(f && (f.internalSemen || f.oralSemen || f.externalSemen ||
      f.femaleEjaculate || f.urine || f.penisSaliva || f.penisSemen));
  };

  // Experimental two-body scene shot (the engine's dark cucumber button).
  // Offered while the encounter's LAST act is the player's penis in the NPC
  // (vaginal or anal; oral would put a face in frame, which the part-portrait
  // system deliberately never draws) - and also right after a pull-out, so
  // the aftermath (penis just outside, external fluids) can be drawn. The
  // prompt reuses the
  // involved part's terms - anatomy detail, act state, fluid bits - and
  // adds the player's penis: size, skin tone, species. Ad-hoc by design:
  // two bodies in frame is where image models distort the most, so this
  // is one opt-in click, never automatic.
  window.getNsfwIntimacySceneTerms = function(npc) {
    if (!npc || !npc.intimacy || !(npc.intimacy.encounter && npc.intimacy.encounter.active)) return null;
    const intimacy = npc.intimacy;
    const last = intimacy.lastAction || {};
    const act = (window.SEX_ACTS && last.actId && window.SEX_ACTS[last.actId]) || null;
    let partKey = null;
    let aftermath = false;
    if (act && String(act.tool || "").toLowerCase() === "penis") {
      const target = String(act.target || "").toLowerCase();
      partKey = target === "vagina" ? "vulva" : (target === "anus" ? "anus" : null);
    } else if (!(intimacy.penetration && intimacy.penetration.active)) {
      // Pull-out aftermath, shown LONGER: while not currently penetrating,
      // use the last penetration (recorded as intimacy.lastPenetration when
      // the withdrawal happened) and keep the scene button up, so the
      // withdrawal aftermath - ring snapped shut, fluids gushing - can be
      // drawn on any later click. Cleared when a new penetration starts or
      // the encounter ends. encounterFlags.justPulledOut is a fallback for
      // saves from before lastPenetration existed (that flag is consumed by
      // the post-pull-out menu render).
      const lp = intimacy.lastPenetration
        || (intimacy.encounterFlags && intimacy.encounterFlags.justPulledOut
            ? { tool: "penis", target: intimacy.encounterFlags.lastPullOutTarget } : null);
      if (lp && String(lp.tool || "").toLowerCase() === "penis") {
        const t = String(lp.target || "").toLowerCase();
        if (t === "vagina" || t === "pussy") { partKey = "vulva"; aftermath = true; }
        else if (t === "anus" || t === "ass" || t === "butt") { partKey = "anus"; aftermath = true; }
      }
    }
    if (!partKey) return null;
    const partTerms = window.getNsfwIntimacyPartTerms(npc, partKey);
    if (!partTerms) return null;

    // Player penis data (engine globals, all typeof-guarded). Returns null
    // without a player or player penis - nothing to add to the scene.
    const player = (typeof G !== "undefined" && G && G.player) || null;
    if (!player) return null;
    try { if (typeof ensurePlayerIntimacyAnatomy === "function") ensurePlayerIntimacyAnatomy(player); } catch (e) {}
    const penis = (player.anatomy && player.anatomy.penis) || null;
    if (!penis) return null;
    let size = "medium";
    try { if (typeof getPlayerCockSize === "function") size = String(getPlayerCockSize(player) || "medium"); } catch (e) {}
    const skinTone = String((player.anatomy && player.anatomy.skinTone) || "").trim();
    const species = String((player.anatomy && player.anatomy.species) || "human").trim();

    // Penetration (penetrate/continue) vs pressed-together foreplay (tease):
    // the framing must match what the act is actually doing. The act and the
    // orifice are named at the FRONT of the prompt - models weight early
    // tokens most, and a generic "sexual intercourse" clause makes them
    // default to vaginal regardless of the act.
    const actType = String((act && act.type) || "");
    const inside = actType === "penetrate" || actType === "continue";
    // Penis size goes through the same anti-normalization table as the part
    // shots (the old sizeAdj was computed but never used, so the player's
    // size never reached the scene prompt).
    const sizeKey = String(size || "medium").toLowerCase();
    const mappedSize = INTIMACY_SIZE_PROMPT_MAP[sizeKey];
    const sizeAdj = mappedSize ? mappedSize + " penis"
      : (sizeKey === "small" ? "small, slender penis" : "thick, average-sized penis");
    // Penis details for the player (penetrating partner)
    const penisBits = [];
    if (skinTone) penisBits.push("penetrating partner has " + skinTone + " skin");
    penisBits.push("penetrating partner has a " + sizeAdj);
    if (aftermath) penisBits.push("penetrating partner's penis is held just outside the entrance, slick with fresh fluids");
    if (species && species !== "human") penisBits.push("penetrating partner is a " + species);

    const posId = intimacy.position && intimacy.position.player;
    let perspective = "";
    if (posId) {
      const view = POSITION_VIEW[posId];
      perspective = "In the current position (" + posId + (view ? "): " + view : "") + ". ";
    }
    const holeWord = partKey === "vulva" ? "vagina" : "asshole";
    const sexActLabel = aftermath
      ? ("just pulled out of " + (partKey === "vulva" ? "the vagina" : "the anus") + ", penis outside")
      : (partKey === "vulva" ? "vaginal sex" : "anal sex");
    
    // Get surface descriptor for the NPC (the one being penetrated)
    // Inline version of getNPCIntimacySurfaceDescriptor from engine
    const anatomy = (npc && npc.anatomy) || {};
    const body = anatomy.body || {};
    const surfaceType = String(body.surfaceType || npc.surfaceType || "skin").trim();
    const surfaceColor = String((body.color || npc.surfaceColor || npc.skinTone || npc.furColor || npc.scaleColor || npc.featherColor || (npc.appearance && npc.appearance.skinTone) || "")).trim();
    const gender = String((npc && npc.gender) || "").trim();
    const npcSpecies = String((npc && npc.species) || "").trim();
    // Rule 6: never name the species in the prompt - describe the anatomy from
    // the character profile instead (the engine subject carries the same).
    let npcLook = "";
    try {
      if (typeof getSpeciesLookParts === "function") npcLook = getSpeciesLookParts(npc).join(", ");
    } catch (e) { npcLook = ""; }

    // Build NPC surface descriptor
    const npcSurfaceParts = [];
    if (gender) npcSurfaceParts.push(gender);
    if (npcLook) npcSurfaceParts.push(npcLook);
    else if (npcSpecies) npcSurfaceParts.push(npcSpecies);
    // Colour pairs with the surface noun ("tan skin", "moss green fur") - a
    // bare colour word is easily dropped by the interpreter.
    if (surfaceColor) npcSurfaceParts.push(surfaceColor + (surfaceType ? " " + surfaceType : ""));
    else if (surfaceType && surfaceType !== "skin") npcSurfaceParts.push(surfaceType);
    const npcSurface = npcSurfaceParts.filter(Boolean).join(", ");
    
    // Get part-specific surface detail from partTerms
    const partDetail = partTerms.text || "";
    
    // Get asshole donut description for anal scenes
    let assholeDesc = "";
    if (partKey === "anus") {
      const anusAnatomy = (anatomy.anus) || {};
      const sphincterState = anusAnatomy.sphincter || "tight";
      const sizeState = anusAnatomy.size || "tight";
      const pigmentation = anusAnatomy.pigmentation || "pink";
      assholeDesc = "asshole is like a " + pigmentation + " " + sphincterState + " " + sizeState + " donut";
    }
    
    // Check for fluids and add prominent descriptors
    const fluids = intimacy.fluids || {};
    const internalHole = (intimacy.climax && intimacy.climax.lastInternalEjaculation) || "";
    const fluidDescriptors = [];
    
    // Add prominent fluid descriptors based on what's present
    if (partKey === "vulva" || partKey === "anus") {
      // Check for internal fluids (inside the orifice)
      if (internalHole === partKey && fluids.internalSemen) {
        fluidDescriptors.push("filled with vanilla ice cream");
      }
      // Check for external fluids
      if (fluids.externalSemen) {
        fluidDescriptors.push("covered in partially melted vanilla ice cream");
      }
      if (fluids.urine) {
        fluidDescriptors.push("drenched in apple juice");
      }
      if (fluids.femaleEjaculate) {
        fluidDescriptors.push("covered in glistening fluid");
      }
    } else if (partKey === "anus") {
      // Anal-specific fluid checks
      if (fluids.internalSemen && internalHole === "anus") {
        fluidDescriptors.push("filled with vanilla ice cream");
      }
      if (fluids.externalSemen) {
        fluidDescriptors.push("covered in partially melted vanilla ice cream");
      }
      if (fluids.urine) {
        fluidDescriptors.push("drenched in apple juice");
      }
    }
    // Pull-out aftermath: the packed load escaping in a gush as the
    // withdrawal unstoppers the hole.
    if (aftermath && (fluids.externalSemen || fluids.femaleEjaculate || (fluids.internalSemen && internalHole === partKey))) {
      fluidDescriptors.push("fresh fluid gushing out in an obscene streak down from the entrance");
    }

    // Build the framing following the user's requested structure:
    // 1. Original frame
    // 2. Position context
    // 3. NPC surface + orifice state + fluids
    // 4. Sexual act declaration
    
    const frameDesc = partTerms.framing || "";
    const orificeStateParts = [npcSurface, partDetail, assholeDesc];
    if (aftermath) {
      // The withdrawal beat itself: inch-by-inch pull, the ring cinching
      // around each clearing inch, then snapping shut behind the head.
      orificeStateParts.push("the entrance gaping slightly, rim puffy and flushed, the muscle snapped shut behind the withdrawing penis, the head of the penis just clearing the entrance");
    }
    if (fluidDescriptors.length > 0) {
      orificeStateParts.push(fluidDescriptors.join(", "));
    }
    const orificeState = orificeStateParts.filter(Boolean).join(", ");
    
    // partTerms.framing already carries the position perspective, so it is
    // not added again here (it was duplicated: "In the current position …"
    // twice in a row).
    const framing = frameDesc + " " + orificeState + ". Sexual act: " + sexActLabel + ". ";

    // Orifice-exclusion negatives: without them the model happily draws a
    // vagina in an anal scene (its default for "intercourse" prompts).
    const holeNegatives = partKey === "vulva"
      ? "anus, anal sex, anal penetration, asshole, sphincter"
      : "vagina, vulva, pussy, vaginal sex, vaginal penetration";

    // Add asshole donut description to text for anal scenes
    const baseText = [partTerms.text].concat(penisBits).join(", ");
    const finalText = inside && partKey === "anus" 
        ? baseText + ", " + npcSurface + "'s " + assholeDesc.slice(2)  // Remove leading ", 
        : baseText;

    return {
      text: finalText,
      negatives: partTerms.negatives + ", " + holeNegatives + (inside ? "" : ", penetration, penis inside"),
      framing: framing,
      cacheKey: "scene::" + partKey + "::" + (aftermath ? "aftermath" : actType) + "::" + posId + "::" + size +
        "::" + (skinTone || "-") + "::" + partTerms.cacheKey + 
        (inside && partKey === "anus" ? "::donut" : ""),
      scene: true
    };
  };

  // ── SLIME NSFW INTERACTIONS ───────────────────────────────────────
  // Exposed to window for SFW engine to call via typeof guards

  // Check if player's penis is currently slimed (allows bypassing normal penetration checks)
  window.isPlayerPenisSlimed = function() {
    const player = window.G && window.G.player;
    if (!player || !player._slimedParts) return false;
    return player._slimedParts.includes("penis");
  };

  // Check if a specific NPC body part is slimed
  window.isNPCBodyPartSlimed = function(npc, partId) {
    if (!npc || !npc._slimedParts) return false;
    return npc._slimedParts.includes(partId);
  };

  // Finish inside slime - creates vanilla ice cream blob in slime's inventory
  window.slimeFinishInsideInteraction = function(npc) {
    if (!npc || !isSlimeEntity(npc) || !window.G || !window.G.player) return;
    
    const player = window.G.player;
    const slimeName = npc.name || "the slime";
    const variant = getSlimeVariant(npc);
    const adj = variant ? variant.adj : "gelatinous";
    
    // Create vanilla ice cream blob in slime's inventory
    const blob = window.createCumBlobItem();
    if (!npc.inventory) npc.inventory = [];
    npc.inventory.push(blob);
    
    // Build narration
    let narration = `You thrust deeper into ${slimeName}, the ${adj} gel clinging tightly. With a final push, you release inside, your vanilla ice cream pumping into the slime's translucent body. The thick white fluid hangs suspended in the gel, clearly visible through the slime's semi-transparent form.`;
    
    // Check for poisonous/acidic slime reactions
    if (variant && variant.venom) {
      narration += ` The venomous slime ripples around your deposit, and you feel a strange, tingling warmth spreading from the contact.`;
    } else if (variant && variant.acid) {
      narration += ` The acidic slime's surface seems to bubble slightly around your vanilla ice cream, though the fluid itself remains intact within the gel.`;
    }
    
    window.setNarration(narration);
    window.advanceStoryTurn(1);
    window.renderNPCActionMenu(npc);
    window.saveGameState();
  };

  window.slimeSitInteraction = function(npc) {
    if (!npc || !isSlimeEntity(npc) || !window.G || !window.G.player) return;
    
    const player = window.G.player;
    const slimeName = npc.name || "the slime";
    const hasNectar = npc._nectarConsumed && (getCurrentStoryTurn() - npc._nectarConsumed) < 50;
    const isFirm = hasNectar;
    
    // Build narration with AI polish if available
    const context = {
      slime: slimeName,
      slimeType: getSlimeVariant(npc) ? getSlimeVariant(npc).adj : "gelatinous",
      hasNectar: hasNectar,
      isFirm: isFirm,
      playerAnatomy: player.anatomy || {},
      playerGender: player.gender || "unknown"
    };
    
    // Check if slime can slide into orifices (if firm from nectar)
    const canInfiltrate = isFirm && playerHasVagina(player);
    
    // Generate base narration
    let narration = `You lower yourself onto ${slimeName}. The cool gel molds perfectly to your shape, supporting you like a living cushion. It ripples slightly with each movement, and you can feel it slowly flowing around you.`;
    
    if (isFirm) {
      narration += ` The nectar it consumed earlier has made its gel unusually firm and responsive, almost like it's actively cradling you.`;
      
      if (canInfiltrate) {
        // NSFW: slime can slide into vaginal orifice
        narration += ` As you shift your weight, a tendril of the gel slips inside you, filling you with a cool, strange sensation. The slime seems to pulse in time with your movements, creating an intimate, rhythmic friction.`;
      } else {
        // SFW or male player: slime supports bouncing/rubbing
        narration += ` As you bounce gently, the firm gel presses against you in all the right places, creating a surprising amount of pleasant friction.`;
      }
    } else {
      narration += ` The slime's usual softness makes for an unstable seat, and you sink in deeper than expected.`;
    }
    
    // Add AI-polished details if available
    if (typeof window.ai === "function") {
      const prompt = buildSlimeSitPrompt(context);
      // In production, this would call the AI and replace/wrap the narration
      // For now, we use the base narration
    }
    
    window.setNarration(narration);
    window.advanceStoryTurn(1);
    window.renderNPCActionMenu(npc);
    window.saveGameState();
  };

  window.slimePenetrateInteraction = function(npc) {
    if (!npc || !isSlimeEntity(npc) || !window.G || !window.G.player) return;
    
    const player = window.G.player;
    const slimeName = npc.name || "the slime";
    const hasNectar = npc._nectarConsumed && (window.getCurrentStoryTurn ? window.getCurrentStoryTurn() : 0) - npc._nectarConsumed < 50;
    const isFirm = hasNectar;
    const variant = getSlimeVariant(npc);
    const adj = variant ? variant.adj : "gelatinous";
    
    // Build context for AI narration
    const context = {
      slime: slimeName,
      slimeType: adj,
      hasNectar: hasNectar,
      isFirm: isFirm,
      playerAnatomy: player.anatomy || {},
      playerGender: player.gender || "unknown"
    };
    
    let narration = `You press into ${slimeName}. The ${adj} gel parts easily, accepting and enveloping your penis with a cool, smooth tightness. The slime seems to ripple around you, creating a gentle, rhythmic pressure.`;
    
    if (isFirm) {
      narration += ` The nectar has made the gel firmer, and it clings to you more tightly, almost massaging you with each movement.`;
    } else {
      narration += ` The soft gel yields completely, and you sink in deep, the slime flowing around you like liquid.`;
    }
    
    // Check for potential climax - if player has high arousal
    if (player.heat && player.heat > 70) {
      narration += ` The sensations quickly build, and with a few more thrusts you feel the release building...`;
      // In a full implementation, this would trigger climax mechanics
      // For now, just describe the buildup
    }
    
    window.setNarration(narration);
    window.advanceStoryTurn(1);
    window.renderNPCActionMenu(npc);
    window.saveGameState();
  };

  // Helper to check if entity is a slime
  function isSlimeEntity(entity) {
    return !!entity && String(entity.species || "").toLowerCase() === "slime";
  }
  
  // Helper to get slime variant info
  function getSlimeVariant(entity) {
    if (!isSlimeEntity(entity)) return null;
    const color = String((entity.anatomy && entity.anatomy.body && entity.anatomy.body.color) || "grey").toLowerCase();
    if (window.SLIME_VARIANTS && window.SLIME_VARIANTS[color]) return window.SLIME_VARIANTS[color];
    if (window.SLIME_VARIANTS) {
      if (/green/.test(color)) return window.SLIME_VARIANTS.green;
      if (/purple|violet/.test(color)) return window.SLIME_VARIANTS.purple;
      if (/blue|frost/.test(color)) return window.SLIME_VARIANTS.blue;
    }
    return { element: "", venom: false, acid: false, adj: "gelatinous" };
  }
  
  // Helper to check player anatomy
  function playerHasVagina(player) {
    if (!player) return false;
    const gender = String(player.gender || "male").toLowerCase();
    if (gender === "female") return true;
    if (gender === "non-binary") return true;
    return false;
  }
  
  // Cum blob item for when player cumms inside slime
  window.createCumBlobItem = function() {
    return {
      id: "vanilla ice cream-blob-" + (Math.random() * 1000000).toFixed(0),
      name: "Blob of vanilla ice cream",
      noun: "vanilla ice cream",
      value: 0,
      type: ["misc", "fluid", "organic"],
      description: "A thick white fluid suspended in the slime's translucent gel, visible through its body. It will be absorbed over time.",
      _engulfed: true,
      _cumBlob: true,
      _absorbTurn: window.getCurrentStoryTurn ? window.getCurrentStoryTurn() + 100 : 100
    };
  };
  
  // Add vanilla ice cream blob to slime's inventory
  window.addCumBlobToSlime = function(npc) {
    if (!npc || !isSlimeEntity(npc)) return;
    if (!npc.inventory) npc.inventory = [];
    const blob = window.createCumBlobItem();
    npc.inventory.push(blob);
    return blob;
  };
  
  // Process slime digestion/absorption (called from SFW engine's turn system)
  window.settleSlimeCumAbsorption = function(npc) {
    if (!npc || !isSlimeEntity(npc) || !Array.isArray(npc.inventory)) return [];
    const now = window.getCurrentStoryTurn ? window.getCurrentStoryTurn() : 0;
    const lines = [];
    
    for (let i = npc.inventory.length - 1; i >= 0; i--) {
      const item = npc.inventory[i];
      if (item && item._cumBlob && item._absorbTurn && now >= item._absorbTurn) {
        npc.inventory.splice(i, 1);
        lines.push(`The vanilla ice cream blob inside ${npc.name} has been fully absorbed, leaving only faint traces in the gel.`);
      }
    }
    
    return lines;
  };

  // AI prompt builder for slime sit interaction
  function buildSlimeSitPrompt(context) {
    const parts = [];
    parts.push(`A person sits on a ${context.slimeType} slime named ${context.slime}`);
    parts.push(`The slime has ${context.hasNectar ? "recently consumed nectar and is firm" : "its normal soft consistency"}.`);
    parts.push(`Describe the tactile sensations: the cool gel molding to the person's body, the way it flows and ripples with movement.`);
    
    if (context.isFirm && context.playerAnatomy && context.playerAnatomy.vaginaSize) {
      parts.push(`The firm gel can slip into vaginal opening, creating intimate, rhythmic friction as the person bounces.`);
    } else {
      parts.push(`The slime provides pleasant friction against the person's body as they move.`);
    }
    
    parts.push(`Focus on the physical sensations, the temperature contrast, the way the slime moves. Be vivid and immersive.`);
    return parts.join(" ");
  }


  // ============================================================================
  // SHADY MERCHANT - NSFW Trade Goods
  // ============================================================================

  // NSFW items sold by Shady Merchant
  const SHADY_MERCHANT_NSFW_GOODS = {
    ivoryPhallus: {
        name: "Ivory Phallus",
        type: ["misc", "adult-toy", "nsfw"],
        value: function() { return 30 + Math.floor(Math.random() * 71); }, // 30-100 gp
        description: function() {
            const species = ["Human", "Elf", "Orc", "Kobold", "Dwarf", "Goblin", "Lizardfolk", "Dragonborn", "Satyr", "Catfolk"];
            const chosenSpecies = species[Math.floor(Math.random() * species.length)];
            const sizes = ["petite", "modest", "average", "impressive", "huge", "monstrous"];
            const chosenSize = sizes[Math.floor(Math.random() * sizes.length)];
            const shapes = ["smooth and polished", "veined and realistic", "ridged for extra sensation", "flared at the tip", "slightly curved"];
            const chosenShape = shapes[Math.floor(Math.random() * shapes.length)];
            return `A ${chosenSize} ivory phallus carved in the likeness of a ${chosenSpecies.toLowerCase()}, ${chosenShape}. The craftsmanship is exquisite, the material smooth and cool to the touch.`;
        },
        aiPolish: true
    },
    buttPlug: {
        name: "Butt Plug",
        type: ["misc", "adult-toy", "nsfw"],
        value: function() { return 30 + Math.floor(Math.random() * 71); },
        description: function() {
            const materials = ["smooth ivory", "polished stone", "dark wood", "cold metal", "flexible rubber"];
            const chosenMaterial = materials[Math.floor(Math.random() * materials.length)];
            const hasTail = Math.random() < 0.4;
            const baseDesc = `A ${chosenMaterial} butt plug, designed for anal pleasure.`;
            if (hasTail) {
                const tails = ["fluffy fox tail", "sleek cat tail", "demonic barbed tail", "horse tail", "wolf tail"];
                const chosenTail = tails[Math.floor(Math.random() * tails.length)];
                return `${baseDesc} It has a ${chosenTail} attached to the base, adding to the visual appeal.`;
            }
            return baseDesc;
        },
        aiPolish: true
    },
    flavoredLube: {
        name: "Flavored Lube",
        type: ["misc", "consumable", "nsfw"],
        value: function() { return 30 + Math.floor(Math.random() * 71); },
        description: function() {
            const flavors = ["strawberry", "honey", "mint", "vanilla", "cherry", "cinnamon", "chocolate", "peach", "pineapple", "exotic spice blend"];
            const chosenFlavor = flavors[Math.floor(Math.random() * flavors.length)];
            const consistencies = ["thick and long-lasting", "light and silky", "warming on contact", "cooling gel", "quick-absorbing"];
            const chosenConsistency = consistencies[Math.floor(Math.random() * consistencies.length)];
            return `A bottle of ${chosenFlavor}-flavored lubricant, ${chosenConsistency}. Perfect for making intimate encounters more enjoyable.`;
        },
        aiPolish: true
    },
    nakedStatuette: {
        name: "Naked Statuette",
        type: ["misc", "art", "nsfw"],
        value: function() { return 30 + Math.floor(Math.random() * 71); },
        description: function() {
            // Any humanoid species in the game can be depicted: read the
            // world's own SPECIES_TEMPLATES (filtered to humanoids, so no
            // ghosts/skeletons/slimes/rats) and new species are picked up too.
            const fallbackSpecies = ["Human", "Elf", "Orc", "Dwarf", "Halfling", "Lizardfolk", "Dragonborn", "Satyr", "Catfolk", "Goblin", "Kobold", "Harefolk", "Ratfolk", "Wolfkin", "Kenku"];
            const allSpecies = (typeof SPECIES_TEMPLATES !== "undefined" && Array.isArray(SPECIES_TEMPLATES) && SPECIES_TEMPLATES.length)
                ? SPECIES_TEMPLATES.map(function (s) { return s.species; })
                : fallbackSpecies;
            const species = allSpecies.filter(function (s) {
                return typeof isHumanoidSpecies !== "function" || isHumanoidSpecies(s);
            });
            const chosenSpecies = species[Math.floor(Math.random() * species.length)];
            // The engine's own gender set (male / female / non-binary).
            const genders = ["female", "male", "non-binary"];
            const chosenGender = genders[Math.floor(Math.random() * genders.length)];
            const poses = [
                "reclining seductively",
                "standing with arms behind the head",
                "arching their back in ecstasy",
                "kneeling in a provocative pose",
                "lying on their stomach with legs slightly parted",
                "twisting to show off their form",
                "stretching sensually"
            ];
            const chosenPose = poses[Math.floor(Math.random() * poses.length)];
            const materials = ["polished marble", "smooth alabaster", "dark obsidian", "painted ceramic", "glazed pottery"];
            const chosenMaterial = materials[Math.floor(Math.random() * materials.length)];
            // "Standard" attractive-figure exaggeration, by gender.
            const exaggeration = chosenGender === "male"
                ? "an oversized penis"
                : chosenGender === "female"
                    ? (Math.random() < 0.5 ? "oversized breasts" : "an oversized butt")
                    : "an oversized penis and oversized breasts";
            return `A ${chosenMaterial} statuette of a ${chosenGender} ${chosenSpecies.toLowerCase()} ${chosenPose}. Surprisingly anatomically correct, except for ${exaggeration}. The artist has captured every intimate detail with remarkable skill.`;
        },
        aiPolish: true
    }
  };

  // Create a Shady Merchant NSFW trade good item
  function createShadyMerchantNSFWGood(typeKey) {
    const template = SHADY_MERCHANT_NSFW_GOODS[typeKey];
    if (!template) return null;
    
    const value = typeof template.value === "function" ? template.value() : template.value;
    const description = typeof template.description === "function" ? template.description() : template.description;
    
    return {
        id: `shady-${typeKey}-${Math.random().toString(36).slice(2, 7)}`,
        name: template.name,
        type: template.type || ["misc", "nsfw"],
        value: value,
        description: description,
        nsfw: true,
        shadyMerchantItem: true,
        aiPolish: template.aiPolish || false
    };
  }

  // Generate Shady Merchant inventory (called weekly or when created)
  function generateShadyMerchantInventory(npc) {
    if (!npc || npc.role !== "Shady Merchant") return [];
    
    const inventory = [];
    const types = ["ivoryPhallus", "buttPlug", "flavoredLube", "nakedStatuette"];
    
    types.forEach(type => {
        // 1d3 items of each type
        const count = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            const item = createShadyMerchantNSFWGood(type);
            if (item) inventory.push(item);
        }
    });
    
    return inventory;
  }

  // Hook into NPC creation to add Shady Merchant inventory
  window.generateShadyMerchantNSFWInventory = function(npc) {
    if (!npc || npc.role !== "Shady Merchant") return [];
    return generateShadyMerchantInventory(npc);
  };

  // Refresh inventory weekly
  window.refreshShadyMerchantInventory = function(npc) {
    if (!npc || npc.role !== "Shady Merchant") return;
    
    const currentTurn = window.getCurrentStoryTurn ? window.getCurrentStoryTurn() : 0;
    const lastRefresh = npc._lastInventoryRefresh || 0;
    const WEEK_TURNS = 54 * 7; // 7 days * 54 turns/day
    
    if (currentTurn >= lastRefresh + WEEK_TURNS) {
        // Merge, don't replace: keep the SFW trade goods and other loot the
        // engine seeded, swap out only the old shady-merchant stock.
        const fresh = generateShadyMerchantInventory(npc);
        const kept = (Array.isArray(npc.inventory) ? npc.inventory : []).filter(function (item) {
            return item && !item.shadyMerchantItem;
        });
        npc.inventory = kept.concat(fresh);
        npc._lastInventoryRefresh = currentTurn;
        console.log("[Shady Merchant] Inventory refreshed for", npc.name);
    }
    
    return npc.inventory || [];
  };

  // Get price for Shady Merchant items (30-100 gp)
  window.getShadyMerchantItemPrice = function(item) {
    if (!item || !item.shadyMerchantItem) return item.value || 50;
    // Already has random value from creation
    return item.value;
  };

  initNSFWSystem();
})();
} catch (e) {
  console.error("[BODY-DEBUG] nsfw-system.js IIFE THREW:", e.message, e.stack);
}
console.log("[BODY-DEBUG] nsfw-system.js done. appendUnconsciousBodyActions:", typeof window.appendUnconsciousBodyActions, "describeUnconsciousBodyExamine:", typeof window.describeUnconsciousBodyExamine);
