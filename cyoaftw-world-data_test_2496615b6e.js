// Settlement mausoleums: named service cluster, fifty-niche vaults and upward expansion plans.
// Shared species appearance: explicit morphology, regional surfaces and saved NPC fullness.
// ── cyoaftw-world-data.js v2026-10-26-001 ── Hidden warding marks support reading and comprehension. Previous: Washable puddles/troughs and authored moonbloom/root harvesting; generated bathhouse names and stable saved-building names; street fixture physical templates; guide check-ins and zone/trade shop names.
// Previous: Commoner debt dialogue identifies the creditor.
// Version identifier for debugging cached files
if (typeof window !== "undefined") {
    window.WORLD_DATA_VERSION = "2026-10-26-001";
    console.log("[World Data] Loaded v" + window.WORLD_DATA_VERSION);
}

// Physical definitions use kg, cm and litres. Inventory unitSize remains a
// separate game abstraction. Existing elemental damage stays in DURABILITY_MATERIALS.
const WORLD_MATERIAL_RULES = {
    wood:    { density: 0.65, hardness: 2, brittle: false, flexible: false, absorbency: 0.3 },
    cloth:   { density: 0.25, hardness: 0, brittle: false, flexible: true, absorbency: 1 },
    leather: { density: 0.85, hardness: 1, brittle: false, flexible: true, absorbency: 0.4 },
    paper:   { density: 0.7, hardness: 0, brittle: false, flexible: true, absorbency: 1 },
    bone:    { density: 1.8, hardness: 3, brittle: true, flexible: false, absorbency: 0.1 },
    glass:   { density: 2.5, hardness: 4, brittle: true, flexible: false, absorbency: 0 },
    ceramic: { density: 2.3, hardness: 4, brittle: true, flexible: false, absorbency: 0.1 },
    iron:    { density: 7.8, hardness: 5, brittle: false, flexible: false, absorbency: 0 },
    steel:   { density: 7.85, hardness: 6, brittle: false, flexible: false, absorbency: 0 },
    gold:    { density: 19.3, hardness: 2, brittle: false, flexible: false, absorbency: 0 },
    stone:   { density: 2.6, hardness: 5, brittle: true, flexible: false, absorbency: 0.1 },
    brick:   { density: 1.8, hardness: 3, brittle: true, flexible: false, absorbency: 0.3 },
    plaster: { density: 0.9, hardness: 1, brittle: true, flexible: false, absorbency: 0.8 },
    earth:   { density: 1.5, hardness: 0, brittle: false, flexible: false, absorbency: 0.8 },
    misc:    { density: 1, hardness: 1, brittle: false, flexible: false, absorbency: 0.2 }
};
// Templates define construction, including actual material volume. A frame
// occupies only part of its bounding box; a vessel has walls and an open top.
const WORLD_OBJECT_CATALOGUE = {
    coin:   { size: [2,2,0.15], form: "frame", fill: 0.78, material: "gold", unitSize: 0 },
    block:  { size: [20,20,20], form: "solid", fill: 1, material: "stone", unitSize: 4 },
    plank:  { size: [100,15,3], form: "solid", fill: 1, material: "wood", unitSize: 4 },
    bar:    { size: [60,2.5,2.5], form: "solid", fill: 1, material: "iron", unitSize: 3 },
    bucket: { size: [28,28,30], form: "vessel", thickness: 1, material: "wood", unitSize: 4, liquid: true },
    cup:    { size: [9,9,12], form: "vessel", thickness: 0.4, material: "ceramic", unitSize: 1, liquid: true },
    bottle: { size: [9,9,25], form: "vessel", thickness: 0.3, material: "glass", unitSize: 2, liquid: true },
    barrel: { size: [55,55,85], form: "vessel", thickness: 2, material: "wood", unitSize: 12, liquid: true },
    crate:  { size: [60,45,40], form: "vessel", thickness: 1.5, material: "wood", unitSize: 8, storage: true },
    chest:  { size: [80,45,45], form: "vessel", thickness: 2, material: "wood", unitSize: 8, storage: true },
    chair:  { size: [45,45,90], form: "frame", fill: 0.04, material: "wood", unitSize: 8 },
    stool:  { size: [35,35,45], form: "frame", fill: 0.07, material: "wood", unitSize: 4 },
    table:  { size: [120,75,75], form: "frame", fill: 0.045, material: "wood", unitSize: 16 },
    bench:  { size: [150,40,50], form: "frame", fill: 0.06, material: "wood", unitSize: 12 },
    pallet: { size: [180,70,15], form: "frame", fill: 0.3, material: "cloth", unitSize: 12 },
    anvil:  { size: [45,20,25], form: "frame", fill: 0.45, material: "iron", unitSize: 12, secured: true },
    statue: { size: [50,50,170], form: "frame", fill: 0.3, material: "stone", unitSize: 24, secured: true },
    cloth:  { size: [100,100,0.2], form: "solid", fill: 1, material: "cloth", unitSize: 2 },
    rope:   { size: [300,1.5,1.5], form: "frame", fill: 0.78, material: "cloth", unitSize: 2 },
    // Street fixtures (2026-10-21): hollow iron lamp column, open wooden cart,
    // fixed market stall, wooden post. Secured ones stay put unless authored.
    lamppost: { size: [20,20,280], form: "frame", fill: 0.2, material: "iron", unitSize: 24, secured: true },
    cart:   { size: [180,100,90], form: "frame", fill: 0.05, material: "wood", unitSize: 40 },
    stall:  { size: [200,120,220], form: "frame", fill: 0.02, material: "wood", unitSize: 40, secured: true },
    post:   { size: [15,15,200], form: "solid", fill: 1, material: "wood", unitSize: 16, secured: true },
    item:   { size: [10,10,10], form: "solid", fill: 0.3, material: "misc", unitSize: 2 }
};
// Native spill-volume units are abstract. This explicit bridge gives them a
// stable mass without changing any native coverage, capacity or spell rules.
const WORLD_FLUID_PHYSICS = { litresPerUnit: 0.25, density: { water: 1, oil: 0.9, spirits: 0.85, ale: 1, blood: 1.06 } };

function validateWorldObjectDefinition(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    if (Object.keys(value).some(function (key) { return ["name", "template", "material", "scale"].indexOf(key) < 0; })) return null;
    if (typeof value.name !== "string" || !value.name.trim() || value.name.length > 100 || /[<>\r\n]/.test(value.name)) return null;
    if (!Object.prototype.hasOwnProperty.call(WORLD_OBJECT_CATALOGUE, value.template) || !Object.prototype.hasOwnProperty.call(WORLD_MATERIAL_RULES, value.material)) return null;
    const scale = value.scale === undefined ? 1 : value.scale;
    if (typeof scale !== "number" || !Number.isFinite(scale) || scale < 0.5 || scale > 2) return null;
    const template = WORLD_OBJECT_CATALOGUE[value.template], material = WORLD_MATERIAL_RULES[value.material];
    // A rigid vessel/frame cannot be made from loose earth or a flexible sheet.
    if ((template.form === "vessel" || template.form === "frame" && value.template !== "rope" && value.template !== "pallet") && (material.flexible || value.material === "earth" || value.material === "paper")) return null;
    if (value.template === "rope" && !material.flexible) return null;
    return { name: value.name.trim(), template: value.template, material: value.material, scale: scale };
}

function calculateWorldObjectPhysics(definition) {
    const def = validateWorldObjectDefinition(definition);
    if (!def) return null;
    const template = WORLD_OBJECT_CATALOGUE[def.template], material = WORLD_MATERIAL_RULES[def.material];
    const dimensions = template.size.map(function (n) { return n * def.scale; });
    const outer = dimensions[0] * dimensions[1] * dimensions[2] / 1000;
    let materialLitres = outer * (template.fill || 1), capacityLitres = 0;
    if (template.form === "vessel") {
        const wall = template.thickness * def.scale;
        capacityLitres = Math.max(0, dimensions[0] - 2 * wall) * Math.max(0, dimensions[1] - 2 * wall) * Math.max(0, dimensions[2] - wall) / 1000;
        materialLitres = outer - capacityLitres;
    }
    return { version: 1, template: def.template, material: def.material, scale: def.scale, dimensionsCm: dimensions,
        dryMassKg: Math.round(materialLitres * material.density * 1000) / 1000,
        capacityLitres: Math.round(capacityLitres * 1000) / 1000,
        unitSize: Math.max(0, Math.ceil(template.unitSize * Math.pow(def.scale, 3))), secured: !!template.secured };
}

function inferWorldObjectDefinition(object, kind) {
    if (!object || typeof object !== "object") return null;
    if (object.physicalDefinition) return validateWorldObjectDefinition(object.physicalDefinition);
    const name = String(object.name || object.id || "object"), text = name.toLowerCase().replace(/-/g, " ");
    const rules = [[/\bcoins?\b/,"coin"],[/\b(bucket|pail)\b/,"bucket"],[/\b(barrel|cask|keg)\b/,"barrel"],[/\b(chest|trunk)\b/,"chest"],[/\bcrate\b/,"crate"],
        [/\b(bottle|flask|vial)\b/,"bottle"],[/\b(cup|mug|bowl)\b/,"cup"],[/\bstool\b/,"stool"],[/\bchair\b/,"chair"],[/\bbench\b/,"bench"],
        [/\btable\b/,"table"],[/\b(pallet|bedroll)\b/,"pallet"],[/\banvil\b/,"anvil"],[/\bstatue\b/,"statue"],[/\b(plank|board)\b/,"plank"],[/\b(crowbar|pry bar|iron bar|steel bar)\b/,"bar"],[/\brope\b/,"rope"],
        [/\b(lamppost|lamp post|street ?lamp)\b/,"lamppost"],[/\b(cart|wagon|wheelbarrow|barrow)\b/,"cart"],[/\b(market stall|stall|booth)\b/,"stall"],[/\b(signpost|sign post|hitching post|post)\b/,"post"]];
    const match = rules.find(function (row) { return row[0].test(text); });
    if (!match && kind === "fixture") return null;
    const key = match ? match[1] : "item", template = WORLD_OBJECT_CATALOGUE[key];
    const explicit = object.material || object.durability && object.durability.material;
    let material = Object.prototype.hasOwnProperty.call(WORLD_MATERIAL_RULES, explicit) ? explicit : template.material;
    if (!explicit) Object.keys(WORLD_MATERIAL_RULES).some(function (key) { if (new RegExp("\\b" + key + "\\b").test(text)) { material = key; return true; } return false; });
    let scale = 1;
    if (key === "bottle" && /\bvial\b/.test(text)) scale = 0.5;
    if (key === "item" && typeof object.unitSize === "number") scale = Math.max(0.5, Math.min(2, Math.pow(Math.max(0.25, object.unitSize) / 2, 1/3)));
    return validateWorldObjectDefinition({ name: name.slice(0,100), template: key, material: material, scale: scale });
}

function worldObjectGenerationRules() {
    return "Return JSON only: {name,template,material,scale}. No effects, weight, value, contents, magic or attachment fields. " +
        "Scale 0.5..2 multiplies the template dimensions; the engine calculates mass, size and capacity. " +
        "Rigid vessels/frames need rigid materials; ropes need flexible material. Templates=" + JSON.stringify(WORLD_OBJECT_CATALOGUE) + "; materials=" + JSON.stringify(WORLD_MATERIAL_RULES);
}

// ── ZONE TEMPLATES ───────────────────────────────────────────────

const ZONE_TEMPLATES = [
    {
        name: "Town",
        hostileArea: false,
        ambiance: "The sounds of daily life fill the air. People go about their business.",
        // (The boss-room type is now the "Council Chamber" behind the Town
        // Hall's front hall - see BUILDING_BLUEPRINTS.) "Town Hall" was the
        // old boss-room type (see ZONE_BOSS_ROOMS in
        // cyoaftw-engine-CORE.js) - it's a normal, flat-odds entry in this
        // list like any other room type, not specially weighted. "Cellar
        // Shrine" is this zone's guaranteed shrine room (ZONE_SHRINE_ROOMS)
        // in the same style - odd for a Town, tucked away below a tavern.
        roomTypes: ["Tavern", "Taproom", "Inn", "Kitchen", "Cellar", "Smithy", "Street", "Alleyway", "Square", "Avenue", "Gate", "Town Hall", "Cellar Shrine"],
        allowedSpecies: ["Human", "Elf", "Dwarf", "Halfling", "Dragonborn", "Satyr", "Catfolk", "Harefolk", "Ratfolk", "Kenku"],
        lightLevel: "bright",
        defaultDanger: "safe"
    },
    {
        name: "Dungeon",
        hostileArea: true,
        ambiance: "The air is cold and stale. Distant sounds echo from unseen passages.",
        // "Buried Shrine" is this zone's guaranteed shrine room
        // (ZONE_SHRINE_ROOMS) - sealed behind a cave-in, easy to miss.
        roomTypes: ["Chamber", "Corridor", "Passage", "Vault", "Trap", "Tunnel", "Armory", "Collapsed Gallery", "Throne Room", "Buried Shrine", "Smugglers' Den"],
        allowedSpecies: ["Goblin", "Orc", "Skeleton", "Rat", "Kobold", "Lizardfolk", "Wolfkin", "Slime", "Ratfolk"],
        lightLevel: "dark",
        defaultDanger: "hostile"
    },
    {
        name: "Ruins",
        hostileArea: true,
        ambiance: "Crumbling stone and silence. Whatever once thrived here is long gone.",
        // "Shrine" doubles as this zone's guaranteed shrine room
        // (ZONE_SHRINE_ROOMS) - "Altar" is a second, bonus prayer-capable
        // room type that can also turn up here at ordinary flat odds.
        roomTypes: ["Hallway", "Ruins Passage", "Altar", "Library", "Tower", "Shrine", "Inner Sanctum", "Smugglers' Den"],
        allowedSpecies: ["Skeleton", "Ghost", "Goblin", "Lizardfolk", "Wolfkin", "Kenku"],
        lightLevel: "dim",
        defaultDanger: "hostile"
    },
    {
        name: "Underground City",
        hostileArea: false,
        ambiance: "Torchlight flickers across ancient stone. A civilization lives below the world.",
        // "Deep Well Shrine" is this zone's guaranteed shrine room
        // (ZONE_SHRINE_ROOMS) - built around a dried-up well shaft, tucked
        // between otherwise mundane tunnels.
        roomTypes: ["Cavern", "Mine Shaft", "Vault", "Deep Forge", "Underground Hallway", "Underground Gate", "Chieftain's Hall", "Deep Well Shrine", "Smugglers' Den"],
        allowedSpecies: ["Dwarf", "Goblin", "Human", "Kobold", "Dragonborn", "Catfolk", "Slime", "Ratfolk", "Kenku"],
        lightLevel: "dim",
        defaultDanger: "tense"
    },
    {
        name: "Swamp",
        hostileArea: true,
        ambiance: "Thick mist clings to the water. The ground squelches underfoot, and something large moves in the reeds.",
        // "Sunken Chapel" is this zone's guaranteed shrine room
        // (ZONE_SHRINE_ROOMS) - half-submerged, easy to mistake for just
        // another ruin until you're standing in it.
        roomTypes: ["Marsh", "Broken Ground", "Swamp Camp", "Submerged Ruin", "Witch's Lair", "Sunken Chapel"],
        allowedSpecies: ["Lizardfolk", "Rat", "Kobold", "Slime", "Ratfolk"],
        lightLevel: "dim",
        defaultDanger: "hostile"
    }
];

// ── SPECIES TEMPLATES ───────────────────────────────────────────
// anatomyProfile.morphology is shared species anatomy, never a random feature.
// Individual anatomy.morphology fields can override it (including an empty
// string for an absent part). typicalBuild describes a tendency, not a mandate.
// bodyFatEligible enables the one-time 5% NPC fullness roll; frame stays separate.
// anatomyProfile.look is the reader-facing wording of the same parts, used in
// descriptions the player reads. morphology stays the precise record for AI
// prompts and portraits. A look part set to "" is left out of descriptions.

const SPECIES_TEMPLATES = [
    {
        species: "Human",
        // Used for NPC portrait prompts: face/head detail and species-specific negatives.
        portraitProfile: { face: "a human face", negatives: "pointed ears, elf ears, fangs, scales, tusks" },
        isHumanoid: true,
        size: "medium",
        isCivilized: true,
        speechStyle: "common",
        lore: "Humans are adaptable people whose customs change quickly from town to frontier. They tend to judge strangers by conduct before bloodline.",
        anatomyProfile: {
            morphology: { ears: "one pair of rounded human ears on the sides of the head", face: "a human face", bodyPlan: "an upright human body with two arms and two legs", feet: "human feet" },
            // Reader-facing wording for the parts above ("" = not worth mentioning).
            look: { ears: "", face: "", bodyPlan: "", feet: "" },
            typicalBuild: "variable human proportions and body frames",
            bodyFatEligible: true,
            surfaceType: "skin",
            skinTones: ["pale", "fair", "tan", "olive", "brown", "dark brown"],
            hairColors: ["black", "brown", "auburn", "blond", "gray"],
            hairStyles: ["cropped", "loose", "tied back", "braided", "messy"],
            eyeColors: ["brown", "hazel", "green", "blue", "gray"],
            builds: ["lean", "sturdy", "soft-featured", "weathered", "athletic"],
            features: ["calloused hands", "travel-worn boots", "expressive brows", "a tired but alert face"],
            movements: ["moves with practical economy", "keeps an easy human stride", "shifts weight like someone used to long roads"],
            voices: ["plain-spoken", "warm", "dry", "streetwise", "measured"]
        },
        culture: {
            values: ["practical bargains", "local reputation", "family or guild ties"],
            topics: ["recent trouble", "work", "weather", "rumors"],
            taboos: ["being treated as disposable"]
        }
    },
    {
        species: "Elf",
        // Used for NPC portrait prompts: face/head detail and species-specific negatives.
        portraitProfile: { face: "long pointed ears, high cheekbones, angular delicate face, almond-shaped eyes", negatives: "round ears, tusks, heavy jaw" },
        isHumanoid: true,
        size: "medium",
        isCivilized: true,
        speechStyle: "formal",
        lore: "Elves carry long memory in their manners. Even a casual remark may be weighed against old promises, beauty, and restraint.",
        anatomyProfile: {
            morphology: { ears: "one pair of long tapered elven ears on the sides of the head", face: "a fine-featured face with high cheekbones and almond-shaped eyes", bodyPlan: "an upright humanoid body with long limbs", feet: "humanlike feet" },
            // Reader-facing wording for the parts above ("" = not worth mentioning).
            look: { ears: "long tapered ears", face: "fine features with high cheekbones and almond-shaped eyes", bodyPlan: "long limbs", feet: "" },
            typicalBuild: "usually slender and light-framed; individuals can carry extra body fat",
            bodyFatEligible: true,
            surfaceType: "skin",
            skinTones: ["pale", "warm ivory", "olive", "copper", "moonlit brown"],
            hairColors: ["silver", "black", "gold", "chestnut", "white"],
            hairStyles: ["long", "braided", "tied with cord", "flowing", "neatly pinned"],
            eyeColors: ["green", "violet", "silver", "amber", "blue"],
            builds: ["willowy", "graceful", "lithe", "narrow-shouldered", "elegant"],
            features: ["tapered ears", "fine cheekbones", "an ageless gaze", "delicate hands"],
            movements: ["moves with quiet precision", "steps as if listening to the floor", "turns with deliberate grace"],
            voices: ["soft", "musical", "formal", "distant", "carefully chosen"]
        },
        culture: {
            values: ["oaths", "old places", "craftsmanship", "patience"],
            topics: ["history", "music", "omens", "old grudges"],
            taboos: ["mockery of tradition", "careless promises"]
        }
    },
    {
        species: "Dwarf",
        // Used for NPC portrait prompts: face/head detail and species-specific negatives.
        portraitProfile: { face: "rounded humanlike ears, broad nose, broad rounded face, full cheeks, rounded jaw", negatives: "pointed ears, elf ears, angular face, narrow face, sharp cheekbones" },
        isHumanoid: true,
        size: "small",
        isCivilized: true,
        speechStyle: "gruff",
        lore: "Dwarves are shaped by clan, craft, and memory. They notice workmanship quickly and remember debts even faster.",
        anatomyProfile: {
            morphology: { ears: "one pair of rounded humanlike ears on the sides of the head", face: "a broad rounded face with full cheeks and a rounded jaw", bodyPlan: "a short broad body with compact limbs", feet: "broad humanlike feet" },
            // Reader-facing wording for the parts above ("" = not worth mentioning).
            look: { ears: "", face: "a broad round face with full cheeks", bodyPlan: "a short broad frame", feet: "" },
            typicalBuild: "usually stout and endomorphic, with a heavier rounded frame",
            buildWeights: { compact: 1, broad: 1, stout: 4, powerful: 1, thickset: 4 },
            bodyFatEligible: true,
            surfaceType: "skin",
            skinTones: ["ruddy", "tan", "deep brown", "umber", "stone-pale"],
            hairColors: ["black", "brown", "red", "iron-gray", "white"],
            hairStyles: ["braided", "thick", "bound with rings", "cropped", "wild"],
            eyeColors: ["brown", "amber", "gray", "green", "black"],
            builds: ["compact", "broad", "stout", "powerful", "thickset"],
            features: ["square hands", "a strong jaw", "work-scarred knuckles", "ornamental beard-braids"],
            movements: ["plants each step firmly", "moves like a walking wall", "keeps a low steady stance"],
            voices: ["gravelly", "blunt", "resonant", "clipped", "hearty"]
        },
        culture: {
            values: ["craft", "clan honor", "contracts", "endurance"],
            topics: ["stonework", "tools", "lineage", "trade"],
            taboos: ["broken bargains", "insults to craft"]
        }
    },
    {
        species: "Halfling",
        // Used for NPC portrait prompts: face/head detail and species-specific negatives.
        portraitProfile: { face: "rounded ears, small button nose, soft round youthful face", negatives: "pointed ears, elf ears, gaunt, heavy jaw", sizeWord: "short" },
        isHumanoid: true,
        size: "small",
        isCivilized: true,
        speechStyle: "folksy",
        lore: "Halflings survive by community, caution, and cheerful misdirection. They often know more local news than they admit.",
        anatomyProfile: {
            morphology: { ears: "one pair of rounded humanlike ears on the sides of the head", face: "a soft rounded adult face with a small nose", bodyPlan: "a short compact humanoid body with adult proportions", feet: "broad humanlike feet with hair on their tops" },
            // Reader-facing wording for the parts above ("" = not worth mentioning).
            look: { ears: "", face: "a soft round face with a small nose", bodyPlan: "a short compact frame", feet: "broad feet with hair on top" },
            typicalBuild: "usually compact and softly rounded, with short limbs",
            bodyFatEligible: true,
            surfaceType: "skin",
            skinTones: ["fair", "sun-browned", "warm tan", "olive", "brown"],
            hairColors: ["brown", "black", "sandy", "auburn", "gray"],
            hairStyles: ["curly", "loose", "short", "tousled", "neatly brushed"],
            eyeColors: ["brown", "hazel", "green", "blue"],
            builds: ["compact", "round-faced", "nimble", "soft", "sturdy"],
            features: ["quick fingers", "bright eyes", "barefoot confidence", "a ready half-smile"],
            movements: ["moves with small quick steps", "keeps near cover without seeming to", "rocks lightly on their heels"],
            voices: ["bright", "conspiratorial", "gentle", "quick", "homey"]
        },
        culture: {
            values: ["hospitality", "personal favors", "safe roads", "good food"],
            topics: ["meals", "families", "gossip", "hidden shortcuts"],
            taboos: ["threats to home", "wasted food"]
        }
    },
    {
        species: "Goblin",
        // Used for NPC portrait prompts: face/head detail and species-specific negatives.
        portraitProfile: { face: "grotesque goblin face, leathery wrinkled skin, very large long pointed ears, big crooked hooked nose, heavy brow ridge, deep-set sunken eyes, wide thin-lipped mouth, crooked yellow teeth with small lower tusks, sneering", negatives: "cute, pretty, beautiful, handsome, smooth skin, flawless, round ears, small ears, human face, elf, child, hood", sizeWord: "short" },
        isHumanoid: true,
        isCivilized: false,
        size: "small",
        speechStyle: "clipped",
        lore: "Goblin bands prize cunning, salvage, and status earned by surviving bad odds. They often test strangers before trusting them.",
        articulation: "Small sharp teeth give hard consonants a slight click. Subtle, not exaggerated.",
        anatomyProfile: {
            morphology: { ears: "one pair of very large long pointed goblin ears projecting from the sides of the head", face: "a leathery goblin face with a hooked nose, heavy brow and sharp teeth", bodyPlan: "a short humanoid body with long fingers", feet: "small claw-nailed feet" },
            // Reader-facing wording for the parts above ("" = not worth mentioning).
            look: { ears: "very large pointed ears", face: "a leathery face with a hooked nose, heavy brow and sharp teeth", bodyPlan: "long fingers", feet: "small clawed feet" },
            typicalBuild: "usually wiry and thin-limbed",
            bodyFatEligible: true,
            surfaceType: "skin",
            skinTones: ["moss green", "yellow-green", "ash gray", "mud brown", "sallow ochre"],
            hairColors: ["black", "mud-brown", "rust", "patchy gray", "none"],
            hairStyles: ["patchy", "spiky", "stringy", "cropped", "tufted"],
            eyeColors: ["amber", "red-brown", "black", "yellow", "pale green"],
            builds: ["wiry", "knobby", "scrappy", "thin-limbed", "sinewy"],
            features: ["large ears", "sharp little teeth", "long fingers", "a scarred nose", "ragged nails"],
            movements: ["crouches when watched", "moves in quick nervous bursts", "tilts their head before answering"],
            voices: ["nasal", "raspy", "quick", "sly", "chittering"]
        },
        culture: {
            values: ["useful scraps", "rank", "clever tricks", "survival"],
            topics: ["loot", "routes", "threats", "who is in charge"],
            taboos: ["being cornered", "being laughed at by stronger folk"]
        }
    },
    {
        species: "Orc",
        // Used for NPC portrait prompts: face/head detail and species-specific negatives.
        portraitProfile: { face: "brutish orc face, thick leathery weathered skin with scars, heavy protruding brow ridge, deep-set eyes, broad flat upturned nose, massive square underbite jaw, two lower tusks, thick neck, small rounded ears", negatives: "pointed ears, elf ears, cute, pretty, beautiful, handsome, smooth skin, delicate, slender, narrow jaw, human face, child" },
        isHumanoid: true,
        isCivilized: false,
        size: "large",
        speechStyle: "direct",
        lore: "Orcs respect strength, directness, and loyalty proven under pressure. Insults are remembered, but so is courage.",
        articulation: "Tusks blunt and thicken hard consonants slightly. Otherwise speaks clearly.",
        anatomyProfile: {
            morphology: { ears: "one pair of small rounded orc ears on the sides of the head", face: "a broad orc face with a heavy brow, flat nose, square underbite jaw and two lower tusks", bodyPlan: "a large broad-shouldered humanoid body with a thick neck", feet: "large humanlike feet" },
            // Reader-facing wording for the parts above ("" = not worth mentioning).
            look: { ears: "small rounded ears", face: "a broad face with a heavy brow, flat nose and two lower tusks", bodyPlan: "broad shoulders and a thick neck", feet: "" },
            typicalBuild: "usually powerful and muscular, with a broad frame",
            bodyFatEligible: true,
            surfaceType: "skin",
            skinTones: ["deep green", "gray-green", "ash gray", "dark umber", "olive"],
            hairColors: ["black", "dark brown", "iron-gray", "rust", "shaved"],
            hairStyles: ["shaved at the sides", "braided", "topknotted", "loose", "cropped"],
            eyeColors: ["amber", "brown", "red-brown", "gray", "black"],
            builds: ["powerful", "broad-shouldered", "scarred", "heavy", "muscular"],
            features: ["short tusks", "thick neck", "scarred forearms", "heavy brow", "corded hands"],
            movements: ["moves with blunt confidence", "keeps a fighter's stance", "rolls their shoulders before speaking"],
            voices: ["deep", "rough", "commanding", "low", "blunt"]
        },
        culture: {
            values: ["strength", "honor", "kinship", "spoils fairly won"],
            topics: ["battles", "leadership", "weapons", "worthy enemies"],
            taboos: ["cowardice", "veiled insults"]
        }
    },
    {
        species: "Skeleton",
        // Used for NPC portrait prompts: face/head detail and species-specific negatives.
        portraitProfile: { face: "bare skull, hollow eye sockets, exposed teeth, no skin or flesh", negatives: "skin, flesh, hair, lips, eyelids, living human face" },
        isHumanoid: false,
        isCivilized: false,
        size: "medium",
        speechStyle: "broken",
        lore: "Animated skeletons retain fragments of purpose rather than full lives. They respond to command, trespass, and ritual disturbance.",
        articulation: "No lungs or vocal cords - speech is a dry, hollow approximation animated by will, not breath. No breath sounds or wet consonants; words land a beat flatter than a living voice.",
        anatomyProfile: {
            morphology: { ears: "no external ears", face: "a bare skull with exposed teeth and hollow eye sockets", bodyPlan: "an upright humanoid skeleton with exposed bones", feet: "skeletal feet", absent: ["skin", "flesh", "hair", "lips"] },
            // Reader-facing wording for the parts above ("" = not worth mentioning).
            look: { ears: "", face: "a bare skull with hollow eye sockets", bodyPlan: "nothing but bare bones", feet: "" },
            typicalBuild: "a bony humanoid frame without body fat",
            bodyFatEligible: false,
            surfaceType: "bone",
            skinTones: ["ivory", "yellowed", "ash-white", "smoke-stained", "old brown"],
            eyeColors: ["blue witchlight", "green witchlight", "empty shadow", "red pinpricks"],
            builds: ["bare-boned", "rattling", "ancient", "jagged", "ritually marked"],
            features: ["cracked ribs", "missing teeth", "rusted bindings", "old blade marks", "dust in every joint"],
            movements: ["rattles with each step", "turns with puppet-like precision", "moves without breath or hesitation"],
            voices: ["dry", "hollow", "wordless", "scraping", "echoing"]
        },
        culture: {
            values: ["orders", "thresholds", "burial rites"],
            topics: ["the command that binds it", "the grave it left", "the trespass it senses"],
            taboos: ["holy symbols", "grave desecration"]
        }
    },
    {
        species: "Rat",
        // Used for NPC portrait prompts: face/head detail and species-specific negatives.
        portraitProfile: { face: "rat head, long snout, whiskers, fur-covered face", negatives: "human face, human nose, elf ears" },
        isHumanoid: false,
        isCivilized: false,
        size: "tiny",
        speechStyle: "broken",
        lore: "Rats follow food, warmth, and danger-scent. A lone rat is usually a sign that a larger hidden ecology is nearby.",
        articulation: "A tiny mouth built for gnawing, not speech - words come out as a thin, urgent squeak-and-chitter blend, half-formed but understandable in context.",
        // Biological fertility cycle for autonomous arousal
        fertilityCycle: {
            hasCycle: true,
            cycleLength: 36,       // turns between estrus cycles
            duration: 6,          // turns the estrus state lasts
            arousalBoost: 25,      // +arousal during estrus
            minAge: 4             // months ( Rats reach sexual maturity around 4-5 weeks)
        },
        anatomyProfile: {
            morphology: { ears: "one pair of rounded rodent ears high on the sides of the head", face: "a pointed rat muzzle with whiskers and prominent incisors", bodyPlan: "a small quadrupedal rodent body", feet: "four small clawed paws", tail: "a long bare rat tail" },
            // Reader-facing wording for the parts above ("" = not worth mentioning).
            look: { ears: "rounded ears", face: "a pointed whiskered muzzle with prominent incisors", bodyPlan: "", feet: "small clawed paws", tail: "a long bare tail" },
            typicalBuild: "a small low-slung rodent frame",
            bodyFatEligible: true,
            surfaceType: "fur",
            skinTones: ["brown", "black", "gray", "mottled", "pale"],
            eyeColors: ["black", "red", "dark brown"],
            builds: ["small", "lean", "ragged", "sleek", "bony"],
            features: ["long whiskers", "a naked tail", "tiny clawed feet", "twitching ears", "sharp incisors"],
            movements: ["sniffs rapidly", "darts from shadow to shadow", "freezes at the smallest sound"],
            voices: ["squeaking", "silent", "chittering"]
        },
        culture: {
            values: ["food", "escape routes", "warm nests"],
            topics: ["scent trails", "crumbs", "nearby danger"],
            taboos: ["fire", "sudden movement"]
        }
    },
    {
        species: "Ghost",
        // Used for NPC portrait prompts: face/head detail and species-specific negatives.
        portraitProfile: { face: "translucent spectral face, faint wispy edges, hollow glowing eyes", negatives: "solid skin, opaque, vivid colors" },
        isHumanoid: false,
        isCivilized: false,
        // Immune to regular physical damage (weapons with no elemental
        // damage bounce off harmlessly) and only elemental-imbued weapons
        // can actually hurt them - see getSpeciesIsIncorporeal in
        // cyoaftw-engine-CORE.js and its call sites in the combat damage
        // functions. Their own attacks likewise skip the player's HP and
        // drain stamina instead - a ghost's touch is a chill, not a wound.
        incorporeal: true,
        size: "medium",
        speechStyle: "whisper",
        lore: "Ghosts are memory given shape. They notice names, unfinished business, and places where the living have repeated old mistakes.",
        articulation: "No physical vocal apparatus - sound seems to arrive from just behind the listener, thin and half-formed, more impression of speech than actual speech.",
        anatomyProfile: {
            morphology: { ears: "indistinct spectral ear outlines rather than solid external ears", face: "a translucent spectral face with wispy edges", bodyPlan: "an incorporeal humanoid outline", feet: "a fading lower outline that does not touch the floor", absent: ["solid flesh", "physical body fat"] },
            // Reader-facing wording for the parts above ("" = not worth mentioning).
            look: { ears: "", face: "a translucent face with wispy edges", bodyPlan: "a see-through outline", feet: "a lower body that fades before it reaches the floor" },
            typicalBuild: "a spectral outline; no unrecorded former species is implied",
            bodyFatEligible: false,
            surfaceType: "translucent form",
            skinTones: ["pale blue", "silver-white", "faint green", "smoky gray", "candlelit gold"],
            eyeColors: ["white", "blue", "hollow black", "silver", "faint green"],
            builds: ["faint", "flickering", "mist-thin", "half-remembered", "tattered"],
            features: ["blurred edges", "old-fashioned clothing", "light passing through them", "a face shaped by grief", "drifting hair"],
            movements: ["drifts without touching the floor", "fades at the edges when still", "turns as if hearing distant music"],
            voices: ["echoing", "faint", "mournful", "distant", "whispered"]
        },
        culture: {
            values: ["names", "unfinished promises", "places of death"],
            topics: ["lost memories", "betrayal", "buried truths", "the moment of death"],
            taboos: ["mocking the dead", "breaking memorials"]
        }
    },
    {
        species: "Dragonborn",
        // Used for NPC portrait prompts: face/head detail and species-specific negatives.
        portraitProfile: { face: "draconic reptilian head with a blunt snout, scales across the face, small horns, no hair, no external ears", negatives: "hat, helmet, fire, flames, smoke, breathing fire, open mouth, jaw spikes, wings, fur, human face, pointed ears, elf ears" },
        isHumanoid: true,
        size: "large",
        isCivilized: true,
        speechStyle: "direct",
        anatomyType: "mixed",
        hasTail: true,
        lore: "Dragonborn carry the blood of ancient dragons in their scales and breath. They value honor above all — a promise given is a debt that outlasts death. Their clans trace lineage to specific dragon ancestors, and they judge others by the weight of their word.",
        articulation: "A rigid snout with no lips - consonants form further back in the throat, with no lip-rounding for sounds like a soft b or w. Comes through as clipped and slightly breathy rather than mumbled or slurred.",
        anatomyProfile: {
            morphology: { ears: "recessed ear openings with no external ears", face: "a scaled draconic head with a blunt snout and swept-back horns", bodyPlan: "a large upright reptilian body", hands: "clawed hands", feet: "clawed reptilian feet", tail: "a thick scaly tail", absent: ["hair", "fur", "wings"] },
            // Reader-facing wording for the parts above ("" = not worth mentioning).
            look: { ears: "", face: "a scaled draconic head with a blunt snout and swept-back horns", bodyPlan: "", hands: "clawed hands", feet: "clawed feet", tail: "a thick scaly tail" },
            typicalBuild: "usually tall, broad-shouldered and muscular",
            bodyFatEligible: true,
            surfaceType: "scales",
            skinTones: ["deep green", "bronze", "crimson", "deep blue", "black", "gold"],
            hairColors: ["none"],
            hairStyles: ["none"],
            eyeColors: ["gold", "amber", "red", "green", "bronze"],
            builds: ["powerful", "broad-shouldered", "tall", "muscular", "imposing"],
            features: ["draconic snout", "swept-back horns", "thick scaly hide", "a thick tail", "clawed hands", "a breath weapon's heat shimmer"],
            movements: ["moves with heavy purpose", "carries themselves like a soldier", "steps with the weight of their heritage"],
            voices: ["deep and resonant", "rumbling", "commanding", "draconic growl", "booming"]
        },
        culture: {
            values: ["honor", "clan duty", "oaths", "ancestral pride"],
            topics: ["clan history", "dragon ancestors", "oaths sworn and broken", "battles won"],
            taboos: ["broken oaths", "dishonor", "cowardice in the face of duty"]
        }
    },
    {
        species: "Lizardfolk",
        // Used for NPC portrait prompts: face/head detail and species-specific negatives.
        portraitProfile: { face: "reptilian lizard head, long snout, slitted pupils, fine scales, no hair, no external ears", negatives: "human face, ears, fur, hair, flames, wings, horns" },
        isHumanoid: true,
        size: "medium",
        isCivilized: false,
        speechStyle: "broken",
        anatomyType: "reptilian",
        hasTail: true,
        cloaca: true,
        lore: "Lizardfolk are reptilian survivors shaped by swamp and jungle. They think in terms of predator and prey, not good and evil. Their tribes value practical cunning over sentiment, and they eat what they kill. Trust is earned through shared danger, not words.",
        articulation: "A long snout and forked tongue soften sibilants into a faint hiss and flatten vowels - the mouth doesn't round the way a human's does.",
        anatomyProfile: {
            morphology: { ears: "recessed ear openings with no external ears", face: "a scaled lizard head with a long snout and slit pupils", bodyPlan: "an upright reptilian body", hands: "clawed webbed hands", feet: "clawed reptilian feet", tail: "a thick muscular scaly tail", absent: ["hair", "fur", "wings", "horns"] },
            // Reader-facing wording for the parts above ("" = not worth mentioning).
            look: { ears: "", face: "a long-snouted lizard head with slit pupils", bodyPlan: "", hands: "clawed webbed hands", feet: "", tail: "a thick muscular tail" },
            typicalBuild: "usually lean and sinewy",
            bodyFatEligible: true,
            surfaceType: "scales",
            skinTones: ["moss green", "swamp brown", "olive", "dark green", "gray-green"],
            hairColors: ["none"],
            hairStyles: ["none"],
            eyeColors: ["amber", "yellow", "red", "black"],
            builds: ["wiry", "lean", "sinewy", "compact", "reptilian"],
            features: ["a snout full of sharp teeth", "a thick muscular tail", "clawed webbed hands", "a frilled crest", "slit-pupil eyes", "a forked tongue"],
            movements: ["moves with liquid stillness", "lowers into a crouch when watching", "flicks their tongue to taste the air"],
            voices: ["hissing", "guttural", "sibilant", "low rumble", "chittering"]
        },
        culture: {
            values: ["survival", "tribal strength", "hunting prowess", "territory"],
            topics: ["prey", "water sources", "dangerous predators", "tribal boundaries"],
            taboos: ["wasting meat", "showing weakness before the tribe", "trespass on sacred ground"]
        }
    },
    {
        species: "Kobold",
        // Used for NPC portrait prompts: face/head detail and species-specific negatives.
        portraitProfile: { face: "small reptilian snout, scaly skin, large eyes, small horns, no hair", negatives: "human face, elf ears, fur, flames, wings", sizeWord: "short" },
        isHumanoid: true,
        size: "tiny",
        isCivilized: false,
        speechStyle: "clipped",
        anatomyType: "reptilian",
        hasTail: true,
        cloaca: true,
        lore: "Kobolds are small dragon-kin who survive through cleverness, traps, and sheer numbers. They revere dragons as gods and model their tunnels after dragon lairs. A lone kobold is a scout or a trap-setter — where there is one, there are always more.",
        articulation: "A small toothy snout gives words a slightly yipping, clipped quality, with sharp sibilants.",
        anatomyProfile: {
            morphology: { ears: "recessed ear openings with no external ears", face: "a small reptilian head with a pointed snout and small horns", bodyPlan: "a very short upright reptilian body", hands: "small clawed hands", feet: "small clawed reptilian feet", tail: "a thin whip-like scaly tail", absent: ["hair", "fur", "wings"] },
            // Reader-facing wording for the parts above ("" = not worth mentioning).
            look: { ears: "", face: "a small reptilian head with a pointed snout and little horns", bodyPlan: "", hands: "small clawed hands", feet: "", tail: "a thin whip-like tail" },
            typicalBuild: "usually slight and wiry",
            bodyFatEligible: true,
            surfaceType: "scales",
            skinTones: ["rust red", "dark brown", "deep orange", "mottled brown", "dusty red"],
            hairColors: ["none"],
            hairStyles: ["none"],
            eyeColors: ["amber", "red", "yellow", "pale orange"],
            builds: ["tiny", "wiry", "scrawny", "quick", "fragile-looking"],
            features: ["small horns", "a thin whip-like tail", "tiny clawed hands", "sharp little teeth", "reptilian eyes", "a snout"],
            movements: ["darts between shadows", "moves in quick skittering bursts", "freezes stock-still when spotted"],
            voices: ["yipping", "chittering", "high-pitched", "rapid", "squeaky"]
        },
        culture: {
            values: ["traps", "numbers", "dragon worship", "cleverness"],
            topics: ["tunnel routes", "trap designs", "the dragon they serve", "intruders in the warren"],
            taboos: ["damaging traps carelessly", "mentioning the dragon's wrath", "stealing from the hoard"]
        }
    },
    {
        species: "Catfolk",
        portraitProfile: { face: "feline face, cat ears, slit pupils, whiskers, short fur-covered muzzle, soft fur on cheeks", negatives: "human ears, bare human skin, scales, horns, wings" },
        isHumanoid: true,
        size: "medium",
        isCivilized: true,
        speechStyle: "wry",
        anatomyType: "mixed",
        hasTail: true,
        lore: "Catfolk are lithe, curious wanderers who travel in family troupes and caravans, trading small luxuries, stories and favours. They prize freedom, independence and a clever bargain, bow to no throne, and hold grudges and debts with equal care. A catfolk who stays in one place has usually been given a very good reason.",
        articulation: "A short muzzle and sharp canines give words a soft, purring roll on the r's, with the occasional trill when amused.",
        // Biological fertility cycle for autonomous arousal
        fertilityCycle: {
            hasCycle: true,
            cycleLength: 40,       // turns between estrus cycles (cats: ~2-3 weeks)
            duration: 5,          // turns the estrus state lasts
            arousalBoost: 25,      // +arousal during estrus
            minAge: 6             // months (catfolk reach maturity around 6-12 months)
        },
        anatomyProfile: {
            morphology: { ears: "one pair of triangular furred cat ears on top of the head", face: "a feline face with a short muzzle, whiskers and slit pupils", bodyPlan: "an upright furred humanoid body", hands: "padded hands with retractable claws", feet: "padded feline feet", tail: "a long furred cat tail", absent: ["human ears", "a second pair of ears"] },
            // Reader-facing wording for the parts above ("" = not worth mentioning).
            look: { ears: "triangular furred ears on top of the head", face: "a feline face with a short muzzle, whiskers and slit pupils", bodyPlan: "", hands: "padded hands with retractable claws", feet: "", tail: "a long furred tail" },
            typicalBuild: "usually lithe and flexible",
            bodyFatEligible: true,
            surfaceType: "fur",
            skinTones: ["tabby brown", "black", "ginger", "cream", "silver-grey", "calico", "tortoiseshell", "white", "smoky grey", "golden tabby"],
            hairColors: ["black", "ginger", "silver", "cream", "brown", "white", "golden", "charcoal"],
            hairStyles: ["a short mane", "a braided tuft", "a loose ruff", "a topknot", "a sleek short cut", "a wild tangled mass", "a carefully groomed coat", "long flowing fur"],
            eyeColors: ["amber", "green", "gold", "blue", "copper", "violet", "emerald"],
            builds: ["lithe", "slender", "wiry", "sleek", "compact", "graceful", "nimble"],
            features: ["pointed furred ears", "long whiskers", "a long swishing tail", "slit-pupil eyes", "retractable claws", "soft padded hands", "a delicate muzzle", "fur that ripples with movement", "sharp curved claws"],
            movements: ["moves with a silent, rolling stride", "stretches lazily before answering", "settles into a watchful crouch", "flicks their tail while thinking", "pads forward on silent paws", "arches their back playfully", "freezes mid-movement to listen"],
            voices: ["purring", "smooth", "low and lilting", "sly", "trilling", "a soft growl", "a melodic hum"]
        },
        culture: {
            values: ["freedom", "clever bargains", "family troupe", "comfort"],
            topics: ["roads and caravans", "good deals", "old debts", "warm places to sleep"],
            taboos: ["being caged", "being ordered about", "wet fur", "broken bargains"]
        }
    },
    {
        species: "Wolfkin",
        portraitProfile: { face: "lupine face, long muzzle, pointed upright wolf ears, amber eyes, thick fur ruff", negatives: "human ears, bare human skin, scales, horns, wings" },
        isHumanoid: true,
        size: "medium",
        isCivilized: true,
        speechStyle: "direct",
        anatomyType: "mixed",
        hasTail: true,
        lore: "Wolfkin live and hunt in packs, and the pack is everything: its hunt, its territory, its word. They are loyal to a fault and slow to trust outsiders, but once you are counted pack they will follow you into the dark. A lone wolfkin is an exile, a scout, or a hunter on a long trail.",
        articulation: "A long muzzle shapes words into a low, rumbling growl at the edges, and the occasional half-howl slips out when emotions run high.",
        // Biological fertility cycle for autonomous arousal
        fertilityCycle: {
            hasCycle: true,
            cycleLength: 60,       // turns between estrus cycles (wolves: ~6 months)
            duration: 8,          // turns the estrus state lasts
            arousalBoost: 30,      // +arousal during estrus
            minAge: 16            // months (wolfkin reach maturity around 1-2 years)
        },
        anatomyProfile: {
            morphology: { ears: "one pair of upright furred wolf ears on top of the head", face: "a lupine face with a long muzzle and fangs", bodyPlan: "an upright furred humanoid body capable of running on all fours", hands: "heavy clawed hands", feet: "padded lupine feet", tail: "a bushy wolf tail", absent: ["human ears", "a second pair of ears"] },
            // Reader-facing wording for the parts above ("" = not worth mentioning).
            look: { ears: "upright wolf ears", face: "a lupine face with a long muzzle and fangs", bodyPlan: "", hands: "heavy clawed hands", feet: "", tail: "a bushy tail" },
            typicalBuild: "usually rangy or muscular, with a strong frame",
            bodyFatEligible: true,
            surfaceType: "fur",
            skinTones: ["grey", "dark grey", "brown", "black", "russet", "white", "tawny", "timber-grey", "ashen grey", "snow white"],
            hairColors: ["grey", "black", "brown", "russet", "white", "tawny", "silver", "charcoal"],
            hairStyles: ["a thick ruff", "a wild mane", "a braided scruff", "a close-cropped pelt", "a long shaggy mane", "a neatly combed coat", "a wind-tousled mess", "a winter-thick pelt"],
            eyeColors: ["amber", "yellow", "pale blue", "brown", "gold", "hazel", "copper"],
            builds: ["rangy", "powerful", "lean", "broad-shouldered", "wolfish", "muscular", "lanky"],
            features: ["upright furred ears", "a bushy tail", "a long muzzle with sharp fangs", "heavy clawed hands", "a thick neck ruff", "keen amber eyes", "a powerful jaw", "thick calloused pads", "a battle-scarred muzzle"],
            movements: ["moves with a loping, tireless gait", "scents the air before speaking", "stands braced as if ready to spring", "paces in restless circles", "drops to all fours when running", "sniffs at the ground intently", "freezes with ears pricked forward"],
            voices: ["low growl", "rumbling", "gravelly", "even and quiet", "half-howling", "a deep bark", "a throaty snarl"]
        },
        culture: {
            values: ["the pack", "the hunt", "loyalty", "territory"],
            topics: ["the pack and its hunt", "tracks and scents", "territory lines", "strangers near the den"],
            taboos: ["abandoning the pack", "breaking a hunt-oath", "wasting kill", "cages and chains"]
        }
    },
    {
        species: "Satyr",
        portraitProfile: { face: "humanlike face with furred goat-shaped ears, small curved goat horns, shaggy hair", negatives: "elf ears, human ears, scales, snout, wings, feathers, bare human legs, human feet" },
        isHumanoid: true,
        size: "medium",
        isCivilized: true,
        speechStyle: "boisterous",
        anatomyType: "mixed",
        hasTail: true,
        lore: "Satyrs are horned, goat-legged revellers who live for wine, music and the next good prank. They are mischievous, quick-witted and fickle, and they treat rules as suggestions. Most are harmless tricksters; a few take the joke too far. Their circles gather wherever there is a party to start or a stuffy neighbour to unsettle.",
        articulation: "Words come out in a lilting, sing-song rhythm, quick to laughter and prone to bleating when startled or when a joke lands.",
        // Biological fertility cycle for autonomous arousal
        fertilityCycle: {
            hasCycle: true,
            cycleLength: 28,       // turns between estrus cycles (goats: ~every 3-4 weeks)
            duration: 6,          // turns the estrus state lasts
            arousalBoost: 35,      // +arousal during estrus (satyrs are particularly libidinous)
            minAge: 8             // months (satyrs reach maturity around 1-2 years)
        },
        anatomyProfile: {
            morphology: { ears: "one pair of furred goat-shaped ears projecting from the sides of the head", face: "a humanlike face with curved goat horns", bodyPlan: "a humanlike upper body above shaggy goat legs", feet: "cloven hooves instead of human feet", tail: "a short tufted goat tail", absent: ["elf ears", "human feet", "bare human legs"] },
            // Reader-facing wording for the parts above ("" = not worth mentioning).
            look: { ears: "goat-shaped ears", face: "curved goat horns", bodyPlan: "shaggy goat legs", feet: "cloven hooves", tail: "a short tufted goat tail" },
            typicalBuild: "a variable humanoid frame above strong goat legs",
            bodyFatEligible: true,
            surfaceRegions: [
                { region: "the upper body", surfaceType: "skin" },
                { region: "the goat legs", surfaceType: "fur", colors: ["black", "dark brown", "chestnut", "grey", "cream", "russet"] }
            ],
            surfaceType: "skin",
            skinTones: ["tanned", "ruddy", "olive", "sun-browned", "copper", "pale freckled", "golden brown", "weathered bronze", "rosy"],
            hairColors: ["black", "dark brown", "chestnut", "auburn", "grey", "straw", "silver", "wild blonde"],
            hairStyles: ["shaggy curls", "a wild mop", "a loose tangle", "unkempt waves", "a braided top-knot", "long flowing locks", "tied back with vines", "completely unmanaged"],
            eyeColors: ["amber", "hazel", "green", "dark brown", "gold", "twinkling blue", "mischievous violet"],
            builds: ["wiry", "stocky", "lean", "sturdy", "springy", "lanky", "barrel-chested"],
            features: ["small curved goat horns", "shaggy goat legs with cloven hooves", "pointed furred ears", "a short tufted tail", "a scruffy goatee", "a crooked grin", "a mischievous glint in their eye", "hooves that click on stone", "a permanent smirk"],
            movements: ["capers rather than walks", "cocks their head with a grin", "leans on one hip, hooves tapping", "dances a few steps for no reason", "spins with arms outstretched", "prances in a circle", "drums fingers on their thigh"],
            voices: ["lilting", "bleating laugh", "sing-song", "husky and playful", "booming", "a deep chuckle", "a musical hum"]
        },
        culture: {
            values: ["revelry", "music", "wine and good company", "pranks"],
            topics: ["the next party", "pipes and songs", "tricks played on the stuffy", "good wine"],
            taboos: ["sour company", "cages", "empty cups", "being bored"]
        }
    },
    {
        species: "Slime",
        portraitProfile: { face: "a glistening translucent gelatinous blob, no face, faint core visible inside", negatives: "human face, eyes, mouth, limbs, hair" },
        isHumanoid: false,
        isCivilized: false,
        size: "small",
        speechStyle: "broken",
        anatomyType: "amorphous",
        hasTail: false,
        lore: "Slimes are mindless blobs of living gel that drift through damp stone, eating whatever rots or moves. They do not think or speak, only seep toward warmth and food. Some take on the temper of the place they grew: acid or poison from the swamp's rot, or frost from cold deep stone. They have an unnatural love for moonbloom nectar, which makes their bodies shimmer and move with uncharacteristic energy.",
        articulation: "A slime is a faceless gelatinous pile with no eyes, mouth or limbs. It moves by oozing and rippling, never by human gestures or facial expressions; its gurgles and slurps come from shifting gel.",
        anatomyProfile: {
            morphology: { ears: "no ears", bodyPlan: "an amorphous gelatinous body", absent: ["face", "eyes", "mouth", "limbs", "hair", "ears"] },
            // Reader-facing wording for the parts above ("" = not worth mentioning).
            look: { ears: "", bodyPlan: "" },
            typicalBuild: "a variable pooled gelatinous shape, not a human body frame",
            bodyFatEligible: false,
            surfaceType: "gel",
            skinTones: ["emerald green", "deep blue", "murky purple", "slate grey", "swamp green", "frost blue", "dusky violet", "stone grey"],
            hairColors: ["none"],
            hairStyles: ["none"],
            eyeColors: [],
            builds: ["squat", "wobbling", "pooled", "bulbous", "sprawling", "flat", "glistening", "pulsing"],
            features: ["a translucent quivering body", "a dim core inside the gel", "bits of bone and coin suspended within", "a trail of sticky slime", "faint internal light", "a rippling surface", "a cool damp touch", "bits of digested debris"],
            movements: ["oozes forward", "quivers in place", "slides along the wall", "pools and swells", "drips from ceiling", "seeps under door gaps", "pulses rhythmically", "splits and rejoins"],
            voices: ["gurgling", "silent", "slurping", "blubbering", "squelching", "dripping"]
        },
        culture: {
            values: ["food", "warmth", "damp", "nectar"],
            topics: ["nothing it can say"],
            taboos: ["fire", "salt"]
        }
    },
    {
        species: "Harefolk",
        portraitProfile: { face: "hare face, very long upright ears, large dark eyes, split upper lip, twitching nose, soft short fur", negatives: "human ears, bare human skin, scales, horns, wings, feathers" },
        isHumanoid: true,
        size: "medium",
        isCivilized: true,
        speechStyle: "folksy",
        anatomyType: "mixed",
        hasTail: true,
        lore: "Harefolk live in warrens of linked burrows and hidden halls, and they survive by hearing trouble before it arrives. They are quick, warm, chatty and easily startled, fond of a full larder and a crowded hearth, and they trade news faster than any road can carry it. A harefolk who stands their ground has decided something is worth more than their own safety, and that is not a decision they make lightly.",
        articulation: "A split lip and quick breath make words tumble out in rapid little bursts, with a soft thump of a hind foot when they mean it.",
        // Biological fertility cycle for autonomous arousal
        fertilityCycle: {
            hasCycle: true,
            cycleLength: 30,       // turns between estrus cycles (hares: ~every 3-4 weeks)
            duration: 4,          // turns the estrus state lasts
            arousalBoost: 20,      // +arousal during estrus
            minAge: 4             // months (harefolk reach maturity quickly)
        },
        anatomyProfile: {
            morphology: { ears: "one pair of very long upright hare ears on top of the head", face: "a furred hare face with a twitching nose and split upper lip", bodyPlan: "an upright humanoid body with powerful hind legs", hands: "soft furred hands", feet: "long furred hind feet", tail: "a short fluffy hare tail", absent: ["human ears", "a second pair of ears"] },
            // Reader-facing wording for the parts above ("" = not worth mentioning).
            look: { ears: "very long upright hare ears", face: "a furred face with a twitching nose and split upper lip", bodyPlan: "powerful hind legs", hands: "", feet: "long hind feet", tail: "a short fluffy tail" },
            typicalBuild: "usually light-boned and long-limbed",
            bodyFatEligible: true,
            surfaceType: "fur",
            skinTones: ["sandy brown", "grey-brown", "snow white", "russet", "dappled grey", "tawny", "black-tipped brown", "cream", "dusky fawn", "white", "sandy", "light brown", "gray", "charcoal", "chocolate", "honey", "frost-white", "dappled gray"],
            hairColors: ["brown", "white", "grey", "russet", "black", "cream", "sandy", "fawn", "light brown", "gray", "charcoal", "chocolate", "honey", "frost", "dappled"],
            hairStyles: ["a short tuft between the ears", "a soft ruff", "a braided forelock", "a sleek short coat", "a fluffy mane", "a neat parted crest", "a wind-tousled mess", "a wild fluff", "a sleek coat", "a neatly brushed pelt", "a thick winter coat", "a summer-short trim", "a slightly disheveled mess"],
            eyeColors: ["dark brown", "black", "amber", "hazel", "ruby", "pale grey", "brown", "gold", "green", "red", "pink", "violet"],
            builds: ["lean", "wiry", "springy", "slight", "long-limbed", "rangy", "light-boned", "lithe", "compact", "graceful", "nimble", "delicate"],
            features: ["very long upright ears", "a twitching nose", "a short white tail", "powerful hind legs", "large dark eyes", "a split upper lip", "ears that swivel at every sound", "soft furred hands", "long hind feet", "long upright rabbit ears", "a soft twitching nose", "large expressive eyes", "a fluffy cotton tail", "strong muscular legs", "soft padded feet", "a delicate muzzle", "fur that shimmers in sunlight", "quick reflexes"],
            movements: ["bounds forward in quick light steps", "freezes with ears high, listening", "thumps a hind foot twice and glances back", "folds their ears flat and goes still", "hops sideways at a sudden noise", "shifts weight from foot to foot, ready to run", "stands tall on their toes to see over everything", "moves with quick, darting steps", "freezes with ears twitching", "bounds forward in long leaps", "stands poised to flee", "pauses to sniff the air", "hops lightly from foot to foot", "twitches nose while listening", "darts side to side like the wind"],
            voices: ["quick", "breathy", "light and rapid", "soft and eager", "fluttering", "a hushed patter", "soft", "gentle", "melodic", "light", "a quiet hum", "a soft chuckle"]
        },
        culture: {
            values: ["the warren", "safety in numbers", "a full larder", "fast news"],
            topics: ["tunnel routes", "harvests and weather", "who is kin to whom", "which roads are watched"],
            taboos: ["being cornered", "snares and cages", "going hungry", "lying to the warren"]
        }
    },
    {
        species: "Ratfolk",
        portraitProfile: { face: "rat face, pointed snout, long whiskers, round ears, small bright eyes, long incisors", negatives: "human ears, bare human skin, scales, horns, wings, feathers" },
        isHumanoid: true,
        size: "small",
        isCivilized: true,
        speechStyle: "clipped",
        anatomyType: "mixed",
        hasTail: true,
        lore: "Ratfolk make their homes in the gaps other people leave: drains, cellars, tunnels and the undersides of cities. They are clever, crowded, quick with a bargain and quicker with salvage, and nothing is ever wasted among them. They are used to being looked down on and have learned to profit from it, but they remember a kindness for years and an insult for longer.",
        articulation: "A pointed snout and long front teeth give words a quick, whistling edge, with the occasional chitter when something pleases them.",
        // Biological fertility cycle for autonomous arousal
        fertilityCycle: {
            hasCycle: true,
            cycleLength: 32,       // turns between estrus cycles (similar to rats)
            duration: 6,          // turns the estrus state lasts
            arousalBoost: 22,      // +arousal during estrus
            minAge: 5             // months (ratfolk reach maturity around 6-8 months)
        },
        anatomyProfile: {
            morphology: { ears: "one pair of rounded rodent ears high on the sides of the head", face: "a pointed rat muzzle with long whiskers and prominent incisors", bodyPlan: "a very short upright furred humanoid body of roughly kobold height", hands: "small clawed hands", feet: "small clawed rodent feet", tail: "a long bare rat tail", absent: ["human ears", "elf ears", "a second pair of ears"] },
            // Reader-facing wording for the parts above ("" = not worth mentioning).
            look: { ears: "rounded rodent ears", face: "a pointed muzzle with long whiskers and prominent incisors", bodyPlan: "", hands: "small clawed hands", feet: "", tail: "a long bare tail" },
            typicalBuild: "usually compact or wiry, at kobold-like height",
            heightRangeCm: [70, 105],
            bodyFatEligible: true,
            surfaceType: "fur",
            skinTones: ["soot grey", "dun brown", "black", "piebald", "pale grey", "patchy brown and white", "dusty grey", "ginger-brown", "slate", "brown", "gray", "ashen", "dusky", "rust", "sandy", "pale", "mottled", "striped"],
            hairColors: ["grey", "brown", "black", "white", "ginger", "dun", "mottled", "gray", "ashen", "dusky", "rust", "sandy", "pale", "striped"],
            hairStyles: ["a patchy scruff", "a short bristle", "a tangled mane", "a neat brushed coat", "a thin tuft", "a ragged crest", "a knotted topknot", "patchy", "sleek", "ruffled", "scruffy", "neatly preened", "thick and glossy", "dull and worn", "slightly mangy"],
            eyeColors: ["black", "ruby", "dark brown", "amber", "pale pink", "bright grey", "red", "brown", "yellow", "pale", "pink"],
            builds: ["scrawny", "wiry", "compact", "wiry and quick", "stocky", "slight", "sinewy", "small", "nimble", "lean"],
            features: ["a long bare tail", "sharp twitching whiskers", "round ears with a notched edge", "quick clever hands", "long yellowed incisors", "bright beady eyes", "a scarred snout", "ink-stained fingers", "a nose that never stops testing the air", "twitching whiskers", "a long naked tail", "small clawed hands", "round rodent ears", "a pointed muzzle", "sharp incisors", "beady eyes", "a scruffy pelt", "quick darting movements"],
            movements: ["scuttles along the wall", "sniffs the air and glances over a shoulder", "rubs their hands together, thinking", "ducks low and darts between legs", "tests the ground with a cautious paw", "wrings their tail while talking", "pops up out of nowhere", "darts rapidly from place to place", "sniffs at everything", "freezes at sudden noises", "scurries along walls", "twitches whiskers constantly", "pauses to groom their fur", "squeaks when excited", "moves in short quick bursts"],
            voices: ["quick", "squeaky", "wheedling", "a dry whistle", "chittering", "low and conspiratorial", "rapid", "nasal", "high-pitched", "a quick hiss", "a nervous squeak"]
        },
        culture: {
            values: ["the nest", "clever salvage", "debts and deals", "never wasting anything"],
            topics: ["salvage and scrap", "drains and old tunnels", "who pays best", "who is hunting the nest"],
            taboos: ["being called vermin", "poison and traps", "wasting food", "owing a stranger"]
        }
    },
    {
        species: "Kenku",
        portraitProfile: { face: "crow-like bird face, glossy black hooked beak, bright round eyes, smooth head feathers, no mouth other than the beak", negatives: "human ears, bare human skin, scales, fur, horns, bat wings, flying pose" },
        isHumanoid: true,
        size: "medium",
        isCivilized: true,
        speechStyle: "mimic",
        anatomyType: "mixed",
        hasTail: true,
        lore: "Kenku are small, flightless bird-folk of rooftops, ruins and back alleys. They cannot speak with a voice of their own: they can only repeat what they have heard, in the very voice that said it, and fill the gaps with clicks, caws, croaks and chirps. They hoard bright trinkets and heard words with equal care, and say far more with their wings, heads and tails than with any borrowed sentence. A kenku who repeats your own words back is not mocking you. It is telling you it has kept them.",
        articulation: "They cannot shape words of their own. They speak only in sounds they have heard: whole borrowed phrases in other people's voices, door slams and clinks, strung together with clicks, caws, croaks and chirps.",
        anatomyProfile: {
            morphology: { ears: "concealed ear openings beneath head feathers with no external ears", face: "a crow-like head with a hooked beak", bodyPlan: "an upright feathered humanoid body", hands: "nimble feathered hands", feet: "three-toed taloned feet", wings: "small folded wings too short for flight", tail: "a long fanned feather fan (not a true tail but decorative plumage)", absent: ["human ears", "hair", "fur", "a human mouth"] },
            // Reader-facing wording for the parts above ("" = not worth mentioning).
            look: { ears: "", face: "a crow-like head with a hooked beak", bodyPlan: "", hands: "feathered hands", feet: "three-toed taloned feet", wings: "small folded wings", tail: "a long fan of tail feathers" },
            typicalBuild: "usually lean or compact, with a light birdlike frame",
            bodyFatEligible: true,
            surfaceType: "feathers",
            skinTones: ["glossy black", "charcoal", "slate grey", "mottled brown", "dusky blue-black", "ash grey", "oil-slick black", "dark brown", "white-flecked black", "black", "dark gray", "soot", "midnight", "raven-black", "shiny black", "matte black"],
            hairColors: ["none"],
            hairStyles: ["none"],
            eyeColors: ["black", "amber", "pale yellow", "bright silver", "dark brown", "white-rimmed black", "red", "gold", "silver"],
            builds: ["lean", "slight", "gangling", "wiry", "hunched", "compact", "narrow", "graceful", "lanky", "delicate", "tall", "slim"],
            features: ["a hooked black beak", "small folded wings too short for flight", "a long fanned feather fan", "three-toed taloned feet", "nimble feathered hands", "head feathers that rise and fall with mood", "sharp bead-bright eyes", "a notched wing feather", "a beak that clicks when they think", "a smooth head crest", "a ruffled crest", "a scruffy head tuft", "a high stiff crest", "a curved black beak", "sleek black feathers", "dark intelligent eyes", "long graceful fingers", "light hollow bones", "a preening instinct", "quick reflexes", "a slight hollow sound when moving", "feathers that catch the light"],
            movements: ["tilts their head sharply to one side", "clicks their beak twice and watches with one eye", "half-opens their wings and tucks them back", "droops their wings low and hunches", "fluffs their feathers and stands tall", "bobs their head, talons clicking on the floor", "fans their tail and goes very still", "hops sideways and flares one wing", "moves with graceful precision", "tilts head curiously", "preens imaginary feathers", "steps lightly and quietly", "darts with sudden speed", "freezes in place when listening", "watches with unblinking focus", "mimics observed gestures"],
            voices: ["a dry rasp", "clicking", "a crow's croak", "a rattling chirp", "borrowed and tinny", "a sudden clear human voice", "mimicked speech", "perfect imitation", "whispers and echoes", "repeated phrases", "sudden perfect words", "calls and cries", "mimicked laughter"]
        },
        culture: {
            values: ["the flock", "bright things and fair swaps", "heard words kept like treasure", "watchfulness"],
            topics: ["shiny things", "voices they have kept", "who belongs to the flock", "what was overheard in the market"],
            taboos: ["clipped wings", "cages", "being mocked for a borrowed voice", "stealing from the flock"]
        }
    }
];

// ── ROOM TEMPLATES ───────────────────────────────────────────────
const ROOM_TEMPLATES = [
    {
        type: "Mausoleum", zone: "Town", role: "landmark", displayName: "Mausoleum", imageKey: "Shrine",
        baseDescription: "A quiet stone house of remembrance keeps the settlement's dead under watch. A receiving counter holds the register of names; beyond it lie the memorial gallery, laying-out room and stairs to the burial vaults. The Long War taught the living to make room for every name, known or unknown.",
        allowedZones: ["town", "underground city"], parentCluster: ["square", "cavern"], isConnector: false,
        structural: [
            { id: "mortuary-register", name: "register of the departed", tags: ["information"], anchored: true, alwaysShow: true,
              examineText: "The Keeper of the Quiet records the names of the dead and the numbered niches assigned to them. Unidentified people receive a record too. Each burial vault has fifty individual niches. When the last available niche is filled, another vault floor opens above the stair tower." },
            { id: "receiving-counter", name: "receiving counter", tags: ["surface", "work"], anchored: true },
            { id: "mourners-bench", name: "mourners' bench", tags: ["social", "rest"], anchored: true }
        ]
    },
    {
        type: "Memorial Gallery", zone: "Town", role: "interior", displayName: "Memorial Gallery", imageKey: "Shrine",
        baseDescription: "Name tablets line a peaceful gallery. A Vigil Tender keeps the lamps trimmed and gives visitors room to remember. The stair tower and laying-out room lead away from this public hall.",
        allowedZones: ["town", "underground city"], parentCluster: ["mausoleum"], isConnector: false,
        structural: [
            { id: "memorial-tablets", name: "memorial name tablets", tags: ["information"], anchored: true,
              examineText: "Simple stone tablets commemorate the departed without claiming that every name has yet been learned." },
            { id: "vigil-lamps", name: "vigil lamp stand", tags: ["work"], anchored: true },
            { id: "remembrance-bench", name: "remembrance bench", tags: ["rest", "social"], anchored: true }
        ]
    },
    {
        type: "Laying-out Room", zone: "Town", role: "interior", displayName: "Laying-out Room", imageKey: "Chamber",
        baseDescription: "A clean stone table stands beside a wash basin. Folded shrouds, name tags and mild herbs are set out for the respectful preparation of the dead. A wide door leads to the bearers' lodge.",
        allowedZones: ["town", "underground city"], parentCluster: ["mausoleum"], isConnector: false, noNpcs: true,
        structural: [
            { id: "laying-out-table", name: "stone laying-out table", tags: ["surface", "work"], anchored: true,
              physicalDefinition: { name: "stone laying-out table", template: "table", material: "stone", scale: 1.5 } },
            { id: "mortuary-basin", name: "stone wash basin", tags: ["work"], anchored: true,
              examineText: "A basin for washing hands and cleaning the preparation table. Preparation work routines are not yet available." },
            { id: "shroud-shelves", name: "shroud and name-tag shelves", tags: ["work"], anchored: true }
        ]
    },
    {
        type: "Bearers' Lodge", zone: "Town", role: "interior", displayName: "Bearers' Lodge", imageKey: "Armory",
        baseDescription: "Two places are kept ready for a pair of Bier Bearers. A long carrying bier rests beside a covered handcart; straps, clean coverings and a route board await the next round. Their charge is to bring the confirmed dead to the mausoleum together.",
        allowedZones: ["town", "underground city"], parentCluster: ["mausoleum"], isConnector: false,
        structural: [
            { id: "carrying-bier", name: "wooden carrying bier", tags: ["work"], takeable: false,
              physicalDefinition: { name: "wooden carrying bier", template: "bench", material: "wood", scale: 1.4 },
              examineText: "A long two-person carrying frame with handles and straps. The bearers use it together to collect the dead from reachable rooms and carry them to a burial vault." },
            { id: "mortuary-handcart", name: "covered mortuary handcart", tags: ["work"], takeable: false,
              physicalDefinition: { name: "covered mortuary handcart", template: "cart", material: "wood", scale: 1 } },
            { id: "bearer-route-board", name: "bearers' route board", tags: ["information"], anchored: true,
              examineText: "One pair of Bier Bearers serves this settlement. During working hours they collect the confirmed dead along safe, open routes. Unconscious people are left for medical care. A journey already carrying a body is completed before the pair goes off duty." }
        ]
    },
    {
        type: "Mausoleum Stair", zone: "Town", role: "interior", displayName: "Mausoleum Stair", imageKey: "Stairs",
        baseDescription: "A broad stone stair has space for two bearers and their burden. Landings serve the burial vaults above; the tower can be extended upward as the settlement needs more room.",
        allowedZones: ["town", "underground city"], parentCluster: ["mausoleum"], isConnector: true, noNpcs: true,
        structural: [{ id: "vault-floor-marker", name: "vault floor marker", tags: ["information"], anchored: true,
            examineText: "Each vault floor provides fifty individual burial niches. The stairs lead back down to the memorial gallery." }]
    },
    {
        type: "Burial Vault", zone: "Town", role: "interior", displayName: "Burial Vault", imageKey: "Vault",
        baseDescription: "Fifty full-length burial niches are set into the stone walls, each with its own numbered cover and place for a name tablet. The cool, quiet chamber opens onto the stair landing. Each niche is intended for one deceased person.",
        allowedZones: ["town", "underground city"], parentCluster: ["mausoleum"], isConnector: false, noNpcs: true,
        burialCapacity: 50,
        structural: [{ id: "burial-niches", name: "fifty numbered burial niches", tags: ["burial"], anchored: true, takeable: false, alwaysShow: true,
            examineText: "Fifty separate stone cubbies, numbered one through fifty, each sized for one body. Occupied niches preserve their bodies indefinitely. Memorial plaques are mounted outside the niche covers." }]
    },
    {
        type: "Bathhouse", zone: "Town", role: "landmark", displayName: "Bathhouse", imageKey: "Inn Common",
        baseDescription: "A modest stone bathhouse smells of warm linen and rosemary. A keeper's counter faces the street; beyond a door lie the bathing room and massage room. A painted board offers hot baths, assisted washing, shoulder and back massage, and honest work. Laborers, travelers and old soldiers come here to ease the aches the Long War left behind.",
        allowedZones: ["town"], parentCluster: ["square"], isConnector: false, minNpcs: 7,
        requiredRole: "Bathkeeper",
        roleTable: [
            { role: "BathhouseAttendant", weight: 4 },
            { role: "BathhousePractitioner", weight: 3 },
            { role: "BathhouseAttendant", weight: 2 }
        ],
        structural: [
            { id: "bathhouse-price-board", name: "bathhouse price board", tags: ["information", "commerce"], alwaysShow: true,
              examineText: "The keeper offers hot baths, assisted washes and shoulder and back massage. Ask about bathhouse services for current prices and work. General attendants carry water, tend fires and wash linen; massage practitioners must pass a supervised practical trial." },
            { id: "linen-counter", name: "linen counter", tags: ["surface", "work"], anchored: true },
            { id: "waiting-bench", name: "waiting bench", tags: ["social", "rest"], anchored: true }
        ]
    },
    {
        type: "Bathing Room", zone: "Town", role: "interior", displayName: "Bathing Room", imageKey: "Guest Room",
        baseDescription: "Copper tubs stand behind linen screens. A banked furnace warms the water, and shelves hold soap, buckets and folded towels. The keeper arranges baths and attendant work at the front counter.",
        allowedZones: ["town"], parentCluster: ["bathhouse"], isConnector: false, minNpcs: 3,
        roleTable: [
            { role: "BathhouseAttendant", weight: 5 },
            { role: "BathhousePractitioner", weight: 2 },
            { role: "BathhouseAttendant", weight: 3 }
        ],
        structural: [
            { id: "bathing-tubs", name: "screened bathing tubs", tags: ["work", "commerce"], anchored: true, takeable: false },
            { id: "linen-shelves", name: "clean linen shelves", tags: ["work"], anchored: true }
        ]
    },
    {
        type: "Massage Room", zone: "Town", role: "interior", displayName: "Massage Room", imageKey: "Guest Room",
        baseDescription: "A quiet room holds a padded treatment bench, a stool and a shelf of mild herbal oils. Fresh linen covers the bench. Here the bathkeeper supervises practical trials and trained hands ease tired shoulders and backs.",
        allowedZones: ["town"], parentCluster: ["bathhouse"], isConnector: false, minNpcs: 2,
        roleTable: [
            { role: "BathhousePractitioner", weight: 4 },
            { role: "BathhouseAttendant", weight: 2 },
            { role: "BathhousePractitioner", weight: 3 }
        ],
        structural: [
            { id: "massage-bench", name: "padded treatment bench", tags: ["work", "commerce"], anchored: true, takeable: false },
            { id: "oil-shelf", name: "shelf of herbal oils", tags: ["work"], anchored: true }
        ]
    },
    {
        type: "Bathhouse Changeroom", zone: "Town", role: "interior", displayName: "Changeroom", imageKey: "Guest Room",
        baseDescription: "A small private room with wooden lockers for staff and workers. Clean bathhouse uniforms hang ready for use, and a full-length mirror allows final adjustments before stepping onto the floor.",
        allowedZones: ["town"], parentCluster: ["bathhouse"], isConnector: false, minNpcs: 0,
        structural: [
            { id: "lockers", name: "wooden staff lockers", tags: ["storage"], anchored: true, takeable: false },
            { id: "uniform-rack", name: "uniform rack", tags: ["work"], anchored: true, takeable: false },
            { id: "changeroom-mirror", name: "full-length mirror", tags: ["social"], anchored: true, takeable: false }
        ]
    },
    {
        type: "Private Bath Chamber", zone: "Town", role: "interior", displayName: "Private Bath Chamber", imageKey: "Guest Room",
        baseDescription: "A secluded private bath chamber with warm lighting and soft padding. A treatment bench draped in fresh linen occupies the center, with small tables holding oils and towels. The air carries the scent of herbs and warm stone. A sturdy door with a lock ensures privacy.",
        allowedZones: ["town"], parentCluster: ["bathhouse"], isConnector: false, minNpcs: 0,
        structural: [
            { id: "private-bench", name: "padded treatment bench", tags: ["work", "rest", "commerce"], anchored: true, takeable: false },
            { id: "private-oil-shelf", name: "shelf of premium oils", tags: ["work"], anchored: true },
            { id: "linen-stand", name: "linen towel stand", tags: ["work"], anchored: true }
        ]
    },
    {
        type: "Private Chamber", zone: "Town", role: "interior", displayName: "Private Chamber", imageKey: "Guest Room",
        baseDescription: "A secluded private chamber with warm lighting and soft padding. A treatment bench draped in fresh linen occupies the center, with small tables holding oils and towels. The air carries the scent of herbs and warm stone.",
        allowedZones: ["town"], parentCluster: ["bathhouse"], isConnector: false, minNpcs: 0,
        structural: [
            { id: "private-bench", name: "padded treatment bench", tags: ["work", "rest", "commerce"], anchored: true, takeable: false },
            { id: "private-oil-shelf", name: "shelf of premium oils", tags: ["work"], anchored: true },
            { id: "linen-stand", name: "linen towel stand", tags: ["work"], anchored: true }
        ]
    },
    {
        type: "Guest Room",
        zone: "Town",
        role: "interior",
        displayName: "Guest Room",
        baseDescription: "A modest guest room with simple furnishings. A narrow bed sits against the wall, and a small window overlooks the street below.",
        allowedZones: ["town"],
        parentCluster: ["inn"],
        isConnector: false,
        structural: [
            { id: "bed",        name: "bed",         tags: ["rest"] },
            { id: "chest",      name: "chest",       tags: ["storage"] },
            { id: "wash-basin", name: "wash basin",  tags: ["hygiene"] }
        ],
        imageKey: "Guest Room"
    },
    {
        type: "Gate",
        zone: "Town",
        role: "landmark",
        displayName: "Town Gate",
        baseDescription: "A massive gate set into thick stone walls. Its heavy wooden doors are bound with iron, and guards watch all who pass.",
        allowedZones: ["town", "ruins"],
        parentCluster: ["wall", "fortress"],
        isConnector: false,
        structural: [
            { id: "gate-doors",   name: "iron-bound doors", tags: ["barrier", "landmark"] },
            { id: "guard-post",   name: "guard post",       tags: ["formal", "danger"] },
            { id: "portcullis",   name: "portcullis",       tags: ["barrier"] },
            { id: "practice-dummies", name: "battered practice dummies", tags: ["work", "training"] }
        ],
        imageKey: "Gate"
    },
    {
        type: "Street",
        zone: "Town",
        role: "spine",
        displayName: "Cobblestone Street",
        baseDescription: "A worn cobblestone path. The road is uneven, marked by age and the footsteps of countless travelers.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: true,
        structural: [
            { id: "lamppost",     name: "lamppost",         tags: ["light"] },
            { id: "cart",         name: "merchant cart",    tags: ["commerce"] }
        ],
        imageKey: "Street"
    },
    {
        type: "Avenue",
        zone: "Town",
        role: "spine",
        displayName: "Market Avenue",
        baseDescription: "A broad street with cobbled stones, frequented by merchants and townsfolk alike. Stalls line the edges.",
        allowedZones: ["town"],
        parentCluster: ["square", "market"],
        isConnector: true,
        structural: [
            { id: "market-stall", name: "market stall",     tags: ["commerce"] },
            { id: "lamppost",     name: "lamppost",         tags: ["light"] },
            { id: "bench",        name: "bench",            tags: ["rest"] }
        ],
        imageKey: "Avenue"
    },
    {
        type: "Smithy",
        zone: "Town",
        role: "interior",
        displayName: "Town Smithy",
        baseDescription: "Heat rolls out of an open-fronted workshop. A forge glows orange against the back wall, and the ring of hammer on iron carries out into the street.",
        allowedZones: ["town"],
        parentCluster: ["market", "square"],
        isConnector: false,
        structural: [
            { id: "forge-fire",    name: "forge fire",    tags: ["heat", "light", "forge"] },
            { id: "anvil",         name: "anvil",         tags: ["work", "forge"] },
            { id: "grindstone",    name: "grindstone",    tags: ["work", "forge"] },
            { id: "quench-trough", name: "quench trough", tags: ["work", "forge", "hygiene"] },
            { id: "ore-bin",       name: "ore bin",       tags: ["storage", "loot"] },
            { id: "commission-board", name: "commission board", tags: ["information", "commerce"], alwaysShow: true }
        ],
        imageKey: "Smithy"
    },
    {
        type: "Alleyway",
        zone: "Town",
        role: "spine",
        displayName: "Dark Alleyway",
        baseDescription: "A narrow shadow-filled alley tucked between town buildings. The smell of refuse and something less pleasant.",
        allowedZones: ["town"],
        parentCluster: ["tavern", "market", "inn", "guild", "square"],
        isConnector: true,
        structural: [
            { id: "crates",       name: "stack of crates",  tags: ["cover", "storage"] },
            { id: "barrel",       name: "barrel",           tags: ["storage"] }
        ],
        imageKey: "Alleyway"
    },
    {
        type: "Square",
        zone: "Town",
        role: "landmark",
        displayName: "Town Square",
        baseDescription: "An open public space at the heart of town, used for gatherings and trade. A fountain stands at the center.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: false,
        structural: [
            { id: "fountain",     name: "fountain",         tags: ["landmark", "water"] },
            { id: "benches",      name: "benches",          tags: ["rest", "social"] },
            { id: "notice-post",  name: "notice post",      tags: ["information"], alwaysShow: true }
        ],
        imageKey: "Square"
    },
    {
        type: "Tavern",
        zone: "Town",
        role: "landmark",
        displayName: "Smoky Tavern",
        baseDescription: "Warm light spills from wall-mounted lanterns. The smell of ale and woodsmoke hangs in the air. Voices compete with the crackle of the fire.",
        allowedZones: ["town"],
        parentCluster: ["tavern"],
        isConnector: false,
        structural: [
            { id: "bar-counter",  name: "bar counter",      tags: ["surface", "social"] },
            { id: "fireplace",    name: "fireplace",        tags: ["heat", "light"] },
            { id: "notice-board", name: "notice board",     tags: ["information"], alwaysShow: true }
        ],
        imageKey: "Tavern"
    },
    {
        type: "Taproom",
        zone: "Town",
        role: "interior",
        displayName: "Taproom",
        baseDescription: "Wooden tables crowd the space, sticky with spilled ale. Patrons hunch over drinks and speak in low voices.",
        allowedZones: ["town"],
        parentCluster: ["tavern"],
        isConnector: false,
        structural: [
            { id: "tables",       name: "tables",           tags: ["social", "surface"] },
            { id: "bar",          name: "bar",              tags: ["social", "surface"] },
            { id: "hearth",       name: "hearth",           tags: ["heat", "light"] }
        ],
        imageKey: "Taproom"
    },
    {
        type: "Kitchen",
        zone: "Town",
        role: "interior",
        displayName: "Tavern Kitchen",
        baseDescription: "The air is thick with the scent of stew and smoke. Pots clatter and someone shouts an order from the taproom.",
        allowedZones: ["town"],
        parentCluster: ["tavern"],
        isConnector: false,
        structural: [
            { id: "cooking-fire", name: "cooking fire",     tags: ["heat", "work"] },
            { id: "cauldron",     name: "soup cauldron",    tags: ["work", "cauldron"], alwaysShow: true },
            { id: "prep-table",   name: "preparation table",tags: ["surface", "work"] },
            { id: "pot-rack",     name: "pot rack",         tags: ["storage"] }
        ],
        imageKey: "Kitchen"
    },
    {
        type: "Cellar",
        zone: "Town",
        role: "interior",
        displayName: "Tavern Cellar",
        baseDescription: "Stone steps descend into a cool cellar stacked with barrels of ale and crates of provisions.",
        allowedZones: ["town"],
        parentCluster: ["tavern"],
        isConnector: false,
        structural: [
            { id: "ale-barrels",  name: "ale barrels",      tags: ["storage", "commerce"] },
            { id: "shelving",     name: "shelving",         tags: ["storage"] },
            { id: "packing-board", name: "nailed packing board", tags: [], material: "wood", attachment: "nailed", anchored: true, pryable: true,
                examineText: "A wooden packing board is held to an old rack by exposed nails. There is room to slip a lever under its edge." },
            { id: "cellar-pry-bar", name: "iron pry bar", tags: [], material: "iron", anchored: false, unitSize: 3,
                examineText: "A loose iron bar with a flattened end leans against the rack." },
            { id: "trapdoor",     name: "trapdoor",         tags: ["passage"] }
        ],
        imageKey: "Cellar"
    },
    {
        type: "Cellar Shrine",
        zone: "Town",
        role: "landmark",
        displayName: "Hidden Cellar Shrine",
        baseDescription: "Behind a false wall of stacked crates, a small hollow has been carved out and quietly kept up - a chipped icon, a few burned-down candle stubs, and a shallow bowl for offerings. Whoever tends it never seems to be around.",
        allowedZones: ["town"],
        parentCluster: ["tavern"],
        isConnector: false,
        // Prayer-capable (see isShrineRoom in cyoaftw-engine-CORE.js) -
        // Town's designated guaranteed shrine room (ZONE_SHRINE_ROOMS),
        // deliberately an odd/hidden spot for one rather than a formal
        // temple.
        isShrine: true,
        structural: [
            { id: "chipped-icon", name: "chipped icon",     tags: ["ritual", "landmark"] },
            { id: "candle-stubs", name: "candle stubs",     tags: ["light", "ritual"] },
            { id: "offering-bowl",name: "offering bowl",    tags: ["ritual"] }
        ],
        imageKey: "Cellar"
    },
    {
        type: "Passage",
        zone: "Dungeon",
        role: "spine",
        displayName: "Stone Passage",
        baseDescription: "A narrow dusty passage carved through ancient stone. The air is cold and still.",
        allowedZones: ["dungeon", "ruins", "underground city"],
        parentCluster: ["passage"],
        isConnector: true,
        structural: [
            { id: "torch-sconce", name: "torch sconce",     tags: ["light"] },
            { id: "cracked-wall", name: "cracked wall",     tags: ["hazard"] }
        ],
        imageKey: "Passage"
    },
    {
        type: "Corridor",
        zone: "Dungeon",
        role: "spine",
        displayName: "Dungeon Corridor",
        baseDescription: "A narrow corridor with stone walls and sparse lighting. Moisture seeps through the cracks.",
        allowedZones: ["dungeon"],
        parentCluster: ["passage"],
        isConnector: true,
        structural: [
            { id: "torch-sconce", name: "torch sconce",     tags: ["light"] },
            { id: "iron-door",    name: "iron door",        tags: ["barrier"] }
        ],
        imageKey: "Corridor"
    },
    {
        type: "Tunnel",
        zone: "Dungeon",
        role: "spine",
        displayName: "Dark Tunnel",
        baseDescription: "A long dimly lit tunnel with damp stone walls. The sound of dripping water echoes in the dark.",
        allowedZones: ["dungeon", "underground city"],
        parentCluster: ["tunnel"],
        isConnector: true,
        structural: [
            { id: "support-beam", name: "support beam",     tags: ["structural"] },
            { id: "puddle",       name: "puddle",           tags: ["hazard", "hygiene"] }
        ],
        imageKey: "Tunnel"
    },
    {
        type: "Chamber",
        zone: "Dungeon",
        role: "landmark",
        displayName: "Dungeon Chamber",
        baseDescription: "A grand chamber within the dungeon. Vaulted stone ceilings disappear into shadow above.",
        allowedZones: ["dungeon", "castle"],
        parentCluster: ["chamber"],
        isConnector: false,
        structural: [
            { id: "stone-pillar", name: "stone pillar",     tags: ["structural", "cover"] },
            { id: "iron-gate",    name: "iron gate",        tags: ["barrier"] },
            { id: "chest",        name: "chest",            tags: ["storage", "loot"] },
            { id: "wall-tallies", name: "scratched tallies", tags: ["information"] }
        ],
        imageKey: "Chamber"
    },
    {
        type: "Trap",
        zone: "Dungeon",
        role: "interior",
        displayName: "Trap Room",
        baseDescription: "The floor is suspiciously clean. Something about this room feels wrong.",
        allowedZones: ["dungeon"],
        parentCluster: ["chamber"],
        isConnector: false,
        structural: [
            { id: "pressure-plate", name: "pressure plate", tags: ["hazard", "trap"] },
            { id: "dart-holes",     name: "dart holes",     tags: ["hazard", "trap"] }
        ],
        imageKey: "Trap"
    },
    // ── Inn ──
    {
        type: "Inn",
        zone: "Town",
        role: "landmark",
        displayName: "Traveller's Inn",
        baseDescription: "A welcoming inn with a warm common room. The smell of fresh bread drifts from the kitchen.",
        allowedZones: ["town"],
        parentCluster: ["inn"],
        isConnector: false,
        structural: [
            { id: "reception-desk", name: "reception desk", tags: ["social", "commerce"] },
            { id: "common-hearth",  name: "hearth",         tags: ["heat", "light"] },
            { id: "staircase",      name: "staircase",      tags: ["passage"] }
        ],
        imageKey: "Inn"
    },
    {
        type: "Inn Common",
        zone: "Town",
        role: "interior",
        displayName: "Inn Common Room",
        baseDescription: "A shared common room with long tables and benches. Travellers eat, drink and exchange stories.",
        allowedZones: ["town"],
        parentCluster: ["inn"],
        isConnector: false,
        structural: [
            { id: "long-tables",  name: "long tables",  tags: ["social", "surface"] },
            { id: "notice-board", name: "notice board", tags: ["information"], alwaysShow: true },
            { id: "hearth",       name: "hearth",       tags: ["heat", "light"] }
        ],
        imageKey: "Inn Common"
    },

    // ── Dungeon Landmarks ──
    {
        type: "Shrine",
        zone: "Dungeon",
        role: "landmark",
        displayName: "Forgotten Shrine",
        baseDescription: "A small shrine carved into the rock. Offerings long since rotted sit at the base of a worn stone idol.",
        allowedZones: ["dungeon", "ruins"],
        parentCluster: ["chamber"],
        isConnector: false,
        // Prayer-capable (see isShrineRoom in cyoaftw-engine-CORE.js) - this
        // is Ruins' designated guaranteed shrine room (ZONE_SHRINE_ROOMS).
        isShrine: true,
        structural: [
            { id: "stone-idol",   name: "stone idol",   tags: ["ritual", "landmark"] },
            { id: "offering-bowl",name: "offering bowl",tags: ["ritual"] },
            { id: "candles",      name: "candles",      tags: ["light", "ritual"] }
        ],
        imageKey: "Shrine"
    },
    {
        type: "Armory",
        zone: "Dungeon",
        role: "interior",
        displayName: "Abandoned Armory",
        baseDescription: "Rusted weapons hang from the walls. Broken shields and empty scabbards litter the floor.",
        allowedZones: ["dungeon"],
        parentCluster: ["chamber"],
        isConnector: false,
        structural: [
            { id: "weapon-rack",  name: "weapon rack",  tags: ["storage", "loot"] },
            { id: "armor-stand",  name: "armor stand",  tags: ["storage", "loot"] },
            { id: "workbench",    name: "workbench",    tags: ["surface", "work"] }
        ],
        imageKey: "Armory"
    },
    {
        type: "Collapsed Gallery",
        zone: "Dungeon",
        role: "interior",
        displayName: "Collapsed Gallery",
        baseDescription: "An old mine gallery that fell in on itself. Splintered timbers jut from heaps of broken rock, and a bright seam of ore still glints where the roof gave way.",
        allowedZones: ["dungeon"],
        parentCluster: ["chamber"],
        isConnector: false,
        structural: [
            { id: "cave-in-rubble", name: "cave-in rubble",    tags: ["hazard", "cover"] },
            { id: "ore-vein",       name: "exposed ore vein",  tags: ["resource", "landmark"] },
            { id: "ore-cart",       name: "overturned ore cart", tags: ["storage", "loot"] }
        ],
        imageKey: "Collapsed Gallery"
    },
    {
        type: "Buried Shrine",
        zone: "Dungeon",
        role: "landmark",
        displayName: "Buried Shrine",
        baseDescription: "A cave-in sealed this chamber off long ago, but a narrow gap in the rubble still lets someone squeeze through. Inside, a shrine sits untouched by time, dust thick on every surface except where a devotee has clearly still been kneeling.",
        allowedZones: ["dungeon"],
        parentCluster: ["chamber"],
        isConnector: false,
        // Prayer-capable (see isShrineRoom) - Dungeon's designated
        // guaranteed shrine room (ZONE_SHRINE_ROOMS), odd for being
        // sealed off rather than out in the open.
        isShrine: true,
        structural: [
            { id: "cave-in-rubble", name: "cave-in rubble", tags: ["hazard", "cover"] },
            { id: "dust-shrine",    name: "dust-caked shrine", tags: ["ritual", "landmark"] },
            { id: "kneeling-mark",  name: "worn kneeling mark", tags: ["ritual"] }
        ],
        imageKey: "Shrine"
    },

    // ── Ruins ──
    {
        type: "Hallway",
        zone: "Ruins",
        role: "spine",
        displayName: "Ruined Hallway",
        baseDescription: "A once grand hallway now choked with rubble. Faded murals cling to crumbling walls.",
        allowedZones: ["ruins"],
        parentCluster: ["passage"],
        isConnector: true,
        structural: [
            { id: "rubble",       name: "rubble",       tags: ["hazard", "cover"] },
            { id: "faded-mural",  name: "faded mural",  tags: ["information", "landmark"] }
        ],
        imageKey: "Hallway"
    },
    {
        type: "Altar",
        zone: "Ruins",
        role: "landmark",
        displayName: "Ancient Altar",
        baseDescription: "A massive stone altar dominates the room. Dark stains mark its surface. The air feels heavy here.",
        allowedZones: ["ruins"],
        parentCluster: ["chamber"],
        isConnector: false,
        // Prayer-capable (see isShrineRoom) - a bonus prayer room alongside
        // Ruins' designated "Shrine" (ZONE_SHRINE_ROOMS), not itself the
        // guaranteed one, but it counts if it happens to turn up first.
        isShrine: true,
        structural: [
            { id: "stone-altar",  name: "stone altar",  tags: ["ritual", "landmark"] },
            { id: "ritual-basin", name: "ritual basin", tags: ["ritual"] },
            { id: "inscriptions", name: "inscriptions", tags: ["information"] }
        ],
        imageKey: "Altar"
    },
    {
        type: "Library",
        zone: "Ruins",
        role: "interior",
        displayName: "Ruined Library",
        baseDescription: "Shelves of rotting books line the walls. Most are unreadable but a few tomes remain intact.",
        allowedZones: ["ruins"],
        parentCluster: ["chamber"],
        isConnector: false,
        structural: [
            { id: "bookshelves",  name: "bookshelves",  tags: ["storage", "information"] },
            { id: "reading-desk", name: "reading desk", tags: ["surface", "work", "lab"] },
            { id: "intact-tome",  name: "intact tome",  tags: ["information", "loot"] }
        ],
        imageKey: "Library"
    },
    {
        type: "Tower",
        zone: "Ruins",
        role: "landmark",
        displayName: "Crumbling Tower",
        baseDescription: "A tall tower with a collapsed upper section. Wind howls through gaps in the stonework.",
        allowedZones: ["ruins"],
        parentCluster: ["chamber"],
        isConnector: false,
        structural: [
            { id: "spiral-stair", name: "spiral staircase", tags: ["passage"] },
            { id: "broken-floor", name: "broken floor",     tags: ["hazard"] },
            { id: "arrow-slit",   name: "arrow slit",       tags: ["cover"] }
        ],
        imageKey: "Tower"
    },
    {
        type: "Ruins Passage",
        zone: "Ruins",
        role: "spine",
        displayName: "Ruins Passage",
        baseDescription: "A passage threading through collapsed masonry. Every step dislodges small cascades of dust and stone.",
        allowedZones: ["ruins"],
        parentCluster: ["passage"],
        isConnector: true,
        structural: [
            { id: "fallen-column",name: "fallen column", tags: ["cover", "hazard"] },
            { id: "rubble",       name: "rubble",        tags: ["hazard"] }
        ],
        imageKey: "Ruins Passage"
    },

    // ── Underground City ──
    {
        type: "Cavern",
        zone: "Underground City",
        role: "landmark",
        displayName: "Great Cavern",
        baseDescription: "A vast natural cavern. Glowing fungi cling to the walls and strange sounds drift from the depths.",
        allowedZones: ["underground city", "dungeon"],
        parentCluster: ["cavern"],
        isConnector: false,
        structural: [
            { id: "stalagmites",  name: "stalagmites",  tags: ["cover", "hazard"] },
            { id: "glowing-fungi",name: "glowing fungi",tags: ["light", "landmark"] },
            { id: "underground-pool", name: "underground pool", tags: ["water"] },
            { id: "moonbloom-grove", name: "grove of moonbloom flowers", tags: ["flora", "gather", "light"], forageIngredient: "moonbloom", forageMax: 2 }
        ],
        imageKey: "Cavern"
    },
    {
        type: "Mine Shaft",
        zone: "Underground City",
        role: "landmark",
        displayName: "Mine Shaft",
        baseDescription: "A braced shaft where the city's miners work the living rock. Lantern light shows glittering seams in the walls, and the steady ring of picks carries down the tunnel.",
        allowedZones: ["underground city"],
        parentCluster: ["cavern"],
        isConnector: false,
        structural: [
            { id: "ore-vein",     name: "rich ore vein", tags: ["resource", "landmark"] },
            { id: "ore-cart",     name: "ore cart",      tags: ["storage", "loot"] },
            { id: "support-beam", name: "support beam",  tags: ["structural"] }
        ],
        imageKey: "Mine Shaft"
    },
    {
        type: "Deep Forge",
        zone: "Underground City",
        role: "interior",
        displayName: "Deep Forge",
        baseDescription: "A smithy hewn straight into the rock, its forge fed by a channel of glowing heat from far below. The anvils here have rung for generations.",
        allowedZones: ["underground city"],
        parentCluster: ["cavern"],
        isConnector: false,
        structural: [
            { id: "forge-fire",    name: "deep-fed forge", tags: ["heat", "light", "forge"] },
            { id: "anvil",         name: "anvil",          tags: ["work", "forge"] },
            { id: "grindstone",    name: "grindstone",     tags: ["work", "forge"] },
            { id: "quench-trough", name: "quench trough",  tags: ["work", "forge", "hygiene"] },
            { id: "ore-bin",       name: "ore bin",        tags: ["storage", "loot"] },
            { id: "commission-board", name: "commission board", tags: ["information", "commerce"], alwaysShow: true }
        ],
        imageKey: "Deep Forge"
    },
    {
        type: "Vault",
        zone: "Underground City",
        role: "interior",
        displayName: "Stone Vault",
        baseDescription: "A sealed chamber with thick stone walls. Whatever was stored here was meant to stay hidden.",
        allowedZones: ["underground city", "dungeon"],
        parentCluster: ["chamber"],
        isConnector: false,
        structural: [
            { id: "iron-door",    name: "iron door",    tags: ["barrier"] },
            { id: "stone-chest",  name: "stone chest",  tags: ["storage", "loot"] },
            { id: "wall-chains",  name: "wall chains",  tags: ["hazard"] }
        ],
        imageKey: "Vault"
    },
    {
        type: "Underground Hallway",
        zone: "Underground City",
        role: "spine",
        displayName: "Underground Hallway",
        baseDescription: "A wide hallway carved with deliberate precision. Signs of habitation are everywhere — old fire pits, worn flagstones.",
        allowedZones: ["underground city"],
        parentCluster: ["passage"],
        isConnector: true,
        structural: [
            { id: "carved-pillars",name: "carved pillars", tags: ["structural", "landmark"] },
            { id: "fire-pit",      name: "fire pit",       tags: ["heat", "light"] }
        ],
        imageKey: "Underground Hallway"
    },
    {
        type: "Underground Gate",
        zone: "Underground City",
        role: "landmark",
        displayName: "Underground Gate",
        baseDescription: "A fortified gate controlling passage deeper into the underground city. Guards eye all who approach.",
        allowedZones: ["underground city"],
        parentCluster: ["gate"],
        isConnector: false,
        structural: [
            { id: "stone-gate",   name: "stone gate",   tags: ["barrier", "landmark"] },
            { id: "guard-post",   name: "guard post",   tags: ["formal", "danger"] },
            { id: "torch-stands", name: "torch stands", tags: ["light"] }
        ],
        imageKey: "Underground Gate"
    },
    {
        type: "Deep Well Shrine",
        zone: "Underground City",
        role: "landmark",
        displayName: "Deep Well Shrine",
        baseDescription: "Tucked between two unremarkable tunnels, an old dried-up well shaft has been built up into a shrine, offerings left along its rim where water used to be. No one seems to remember which god it was dug for.",
        allowedZones: ["underground city"],
        parentCluster: ["passage"],
        isConnector: false,
        // Prayer-capable (see isShrineRoom) - Underground City's
        // designated guaranteed shrine room (ZONE_SHRINE_ROOMS), odd for
        // being built around a dead well rather than a proper temple.
        isShrine: true,
        structural: [
            { id: "dry-well-shaft", name: "dry well shaft", tags: ["ritual", "landmark"] },
            { id: "rim-offerings",  name: "offerings along the rim", tags: ["ritual"] },
            { id: "worn-carvings",  name: "worn carvings",  tags: ["information"] }
        ],
        imageKey: "Shrine"
    },

    // ── Swamp ──
    {
        type: "Marsh",
        zone: "Swamp",
        role: "spine",
        displayName: "Sunken Marsh",
        baseDescription: "Black water pools between twisted roots. Every step sinks ankle-deep into the mud, and the reeds hiss faintly in a wind that never seems to reach the ground.",
        allowedZones: ["swamp"],
        parentCluster: ["marsh"],
        isConnector: true,
        structural: [
            { id: "twisted-roots", name: "twisted roots", tags: ["hazard", "cover", "forage"], forageIngredient: "twisted-root", forageMax: 2 },
            { id: "reed-bed",      name: "reed bed",      tags: ["cover"] },
            { id: "moonbloom-patch", name: "pale moonbloom flowers", tags: ["flora", "gather"], forageIngredient: "moonbloom", forageMax: 2 }
        ],
        imageKey: "Marsh"
    },
    {
        type: "Broken Ground",
        zone: "Swamp",
        role: "landmark",
        displayName: "Broken Ground",
        baseDescription: "The earth has buckled and split here, thick roots and slabs of peat heaved up at odd angles. Stagnant water fills the gaps between them.",
        allowedZones: ["swamp"],
        parentCluster: ["marsh"],
        isConnector: false,
        structural: [
            { id: "heaved-slabs",  name: "heaved slabs of peat", tags: ["hazard", "cover"] },
            { id: "stagnant-pool", name: "stagnant pool",        tags: ["water", "hazard"] },
            { id: "moonbloom-cluster", name: "cluster of glowing moonblooms", tags: ["flora", "gather", "light"], forageIngredient: "moonbloom", forageMax: 2 }
        ],
        imageKey: "Broken Ground"
    },
    {
        type: "Swamp Camp",
        zone: "Swamp",
        role: "landmark",
        displayName: "Swamp Camp",
        baseDescription: "A cluster of lean-tos and raised platforms built above the waterline. A smoky fire struggles against the damp, and belongings hang from lines strung between the posts.",
        allowedZones: ["swamp"],
        parentCluster: ["camp"],
        isConnector: false,
        structural: [
            { id: "smoky-fire",      name: "smoky fire pit",  tags: ["heat", "light", "social"] },
            { id: "raised-platform", name: "raised platform", tags: ["rest", "storage"] },
            { id: "drying-lines",    name: "drying lines",    tags: ["storage"] },
            { id: "waymarker-post",  name: "weathered waymarker post", tags: ["information"] }
        ],
        imageKey: "Swamp Camp"
    },
    {
        type: "Submerged Ruin",
        zone: "Swamp",
        role: "landmark",
        displayName: "Submerged Ruin",
        baseDescription: "The tops of old stone walls break the surface of the water, half-swallowed by the swamp. Whatever this place once was, the marsh has nearly finished reclaiming it.",
        allowedZones: ["swamp"],
        parentCluster: ["ruin"],
        isConnector: false,
        structural: [
            { id: "sunken-walls",      name: "sunken stone walls", tags: ["cover", "landmark"] },
            { id: "silted-doorway",    name: "silted doorway",     tags: ["passage", "hazard"] },
            { id: "waterlogged-chest", name: "waterlogged chest",  tags: ["storage", "loot"] }
        ],
        imageKey: "Submerged Ruin"
    },
    {
        type: "Sunken Chapel",
        zone: "Swamp",
        role: "landmark",
        displayName: "Sunken Chapel",
        baseDescription: "Half-swallowed by black water, a small chapel still stands just enough to be entered. Its floor is a shallow, mirror-still pool, and whatever idol once stood at its center is now visible only as a shape beneath the surface.",
        allowedZones: ["swamp"],
        parentCluster: ["marsh", "ruin"],
        isConnector: false,
        // Prayer-capable (see isShrineRoom) - Swamp's designated
        // guaranteed shrine room (ZONE_SHRINE_ROOMS), odd for being
        // half-submerged rather than dry ground.
        isShrine: true,
        structural: [
            { id: "mirror-pool",   name: "mirror-still pool", tags: ["ritual", "water", "landmark"] },
            { id: "submerged-idol",name: "submerged idol",    tags: ["ritual"] },
            { id: "rotted-pews",   name: "rotted pews",       tags: ["cover"] }
        ],
        imageKey: "Altar"
    },

    // ── STARTING HUB ROOMS ────────────────────────────────────────
    // Rooms of the pre-built starting hubs (see ZONE_HUBS below). They are
    // deliberately absent from every ZONE_TEMPLATES.roomTypes list, so the
    // walk generator never rolls them; they only exist inside a hub.
    // requiredRole / roleTable are read by determineNPCRole in the engine.
    {
        type: "Market Cavern", zone: "Underground City", role: "landmark",
        displayName: "Market Cavern",
        baseDescription: "A great vaulted cavern given over to trade. Stalls of cut stone and canvas ring a central well of lamplight, and the air smells of coal, tallow and bread.",
        allowedZones: ["underground city"], parentCluster: ["cavern"], isConnector: false, minNpcs: 2,
        requiredRole: "Vendor",
        roleTable: [
            { role: "Vendor", weight: 5, unique: true }, { role: "Townsfolk", weight: 5 },
            { role: "Miner", weight: 2 }, { role: "Wandering Merchant", weight: 2, unique: true },
            { role: "Stone Guard", weight: 1 }
        ],
        structural: [
            { id: "market-stalls", name: "stone market stalls", tags: ["commerce", "social"] },
            { id: "lamp-well",     name: "well of hanging lamps", tags: ["light", "landmark"] },
            { id: "notice-board",  name: "notice board", tags: ["information", "commerce"], alwaysShow: true }
        ],
        imageKey: "Cavern"
    },
    {
        type: "Lantern Hall", zone: "Underground City", role: "landmark",
        displayName: "Lantern Hall",
        baseDescription: "A low, warm hall hung with a hundred small lanterns, each one a debt paid or a promise kept. Long tables run beneath them, and a bar of polished slate fills the far wall.",
        allowedZones: ["underground city"], parentCluster: ["cavern"], isConnector: false, minNpcs: 2,
        requiredRole: "Bartender",
        roleTable: [
            { role: "Bartender", weight: 6, unique: true }, { role: "Patron", weight: 6 },
            { role: "Miner", weight: 3 }, { role: "Townsfolk", weight: 2 }, { role: "Servant", weight: 1 }
        ],
        structural: [
            { id: "bar",          name: "slate bar", tags: ["commerce", "social"] },
            { id: "long-tables",  name: "long stone tables", tags: ["social"] },
            { id: "lantern-rows", name: "rows of small lanterns", tags: ["light", "landmark"] }
        ],
        imageKey: "Taproom"
    },
    {
        type: "Cavern Lodgings", zone: "Underground City", role: "landmark",
        displayName: "Cavern Lodgings",
        baseDescription: "Sleeping alcoves are cut into the rock in tiers, each hung with a heavy curtain. A keeper sits by the stair with a ledger and a ring of iron keys.",
        allowedZones: ["underground city"], parentCluster: ["cavern"], isConnector: false, minNpcs: 1,
        requiredRole: "Innkeeper",
        roleTable: [
            { role: "Innkeeper", weight: 6, unique: true }, { role: "Guest", weight: 5 },
            { role: "Townsfolk", weight: 2 }, { role: "Miner", weight: 2 }
        ],
        structural: [
            { id: "sleeping-alcoves", name: "curtained sleeping alcoves", tags: ["rest"] },
            { id: "ledger-desk",      name: "keeper's desk", tags: ["commerce", "information"] },
            { id: "foot-lockers",     name: "foot lockers", tags: ["storage"] }
        ],
        imageKey: "Inn"
    },

    {
        type: "Warren Mouth", zone: "Dungeon", role: "landmark",
        displayName: "Warren Mouth",
        baseDescription: "A ragged opening in the rock, hung with bones, rags and crude warding totems. Fresh drag marks scar the floor, and smoke drifts out from somewhere deeper.",
        allowedZones: ["dungeon"], parentCluster: ["gate"], isConnector: false, minNpcs: 1,
        roleTable: [
            { role: "Raider", weight: 5 }, { role: "Scout", weight: 3 }, { role: "Scavenger", weight: 2 }
        ],
        structural: [
            { id: "bone-totems", name: "bone totems", tags: ["landmark", "danger"] },
            { id: "lookout-ledge", name: "lookout ledge", tags: ["formal", "danger"] },
            { id: "drag-marks", name: "drag marks", tags: ["information"] }
        ],
        imageKey: "Passage"
    },
    {
        type: "Fire Hall", zone: "Dungeon", role: "landmark",
        displayName: "Fire Hall",
        baseDescription: "A wide, soot-black cave where the warren eats. A great cookfire burns in a ring of stones, with a spit above it and a keg or two rolled against the wall.",
        allowedZones: ["dungeon"], parentCluster: ["chamber"], isConnector: false, minNpcs: 2,
        requiredRole: "Bartender",
        roleTable: [
            { role: "Bartender", weight: 4, unique: true }, { role: "Cook", weight: 3, unique: true },
            { role: "Raider", weight: 4 }, { role: "Patron", weight: 3 }
        ],
        structural: [
            { id: "bar",        name: "keg bar", tags: ["commerce", "social"] },
            { id: "cookfire",   name: "great cookfire", tags: ["heat", "light", "social"] },
            { id: "gnawed-benches", name: "gnawed benches", tags: ["social"] }
        ],
        imageKey: "Chamber"
    },
    {
        type: "Bunk Cave", zone: "Dungeon", role: "landmark",
        displayName: "Bunk Cave",
        baseDescription: "Heaps of straw, furs and stolen blankets are piled along the walls of this crowded cave. Someone has hung a tin cup on every nail.",
        allowedZones: ["dungeon"], parentCluster: ["chamber"], isConnector: false, minNpcs: 1,
        roleTable: [
            { role: "Raider", weight: 4 }, { role: "Scavenger", weight: 3 }, { role: "Townsfolk", weight: 2 }
        ],
        structural: [
            { id: "straw-bunks", name: "straw and fur bunks", tags: ["rest"] },
            { id: "loot-sacks",  name: "stuffed loot sacks", tags: ["storage", "loot"] },
            { id: "tin-cups",    name: "tin cups on nails", tags: ["social"] }
        ],
        imageKey: "Chamber"
    },
    {
        type: "Fighting Pit", zone: "Dungeon", role: "landmark",
        displayName: "Fighting Pit",
        baseDescription: "A sunken ring of packed earth, ringed with tiers of rubble for a crowd. Old blood has darkened the dirt, and a rack of battered weapons stands by the entry.",
        allowedZones: ["dungeon"], parentCluster: ["chamber"], isConnector: false, minNpcs: 1,
        roleTable: [
            { role: "Raider", weight: 6 }, { role: "Adventurer", weight: 2 }, { role: "Scout", weight: 2 }
        ],
        structural: [
            { id: "pit-ring",     name: "packed-earth ring", tags: ["work", "training"] },
            { id: "practice-dummies", name: "battered practice dummies", tags: ["work", "training"] },
            { id: "weapon-rack",  name: "rack of battered weapons", tags: ["storage", "loot"] }
        ],
        imageKey: "Chamber"
    },
    {
        type: "Scrap Stores", zone: "Dungeon", role: "landmark",
        displayName: "Scrap Stores",
        baseDescription: "Piles of salvage fill this long cave: bent blades, dented helms, rope, lamp oil, a surprising amount of boots. A scrawny trader squats in the middle of it all, keeping count.",
        allowedZones: ["dungeon"], parentCluster: ["chamber"], isConnector: false, minNpcs: 1,
        requiredRole: "Vendor",
        roleTable: [
            { role: "Vendor", weight: 5, unique: true }, { role: "Scavenger", weight: 4 }, { role: "Raider", weight: 2 }
        ],
        structural: [
            { id: "salvage-heaps", name: "heaps of salvage", tags: ["commerce", "storage", "loot"] },
            { id: "trade-blanket", name: "trade blanket", tags: ["commerce"] },
            { id: "tally-sticks",  name: "tally sticks", tags: ["information"] }
        ],
        imageKey: "Armory"
    },

    {
        type: "Boardwalk", zone: "Swamp", role: "spine",
        displayName: "Stilt Boardwalk",
        baseDescription: "Planks lashed to tall posts carry you above the black water. Lanterns of fish oil hang along the rail, and the whole walk sways gently underfoot.",
        allowedZones: ["swamp"], parentCluster: ["marsh"], isConnector: true,
        structural: [
            { id: "plank-walk", name: "lashed plank walk", tags: ["passage"] },
            { id: "oil-lanterns", name: "fish-oil lanterns", tags: ["light"] }
        ],
        imageKey: "Marsh"
    },
    {
        type: "Stilt Hall", zone: "Swamp", role: "landmark",
        displayName: "Stilt Hall",
        baseDescription: "The village's gathering house stands on thick posts over the water. Smoke from a clay hearth hangs under the thatch, and a cask of something fermented sits by the door.",
        allowedZones: ["swamp"], parentCluster: ["camp"], isConnector: false, minNpcs: 2,
        requiredRole: "Bartender",
        roleTable: [
            { role: "Bartender", weight: 5, unique: true }, { role: "Cook", weight: 3, unique: true },
            { role: "Patron", weight: 4 }, { role: "Scout", weight: 2 }
        ],
        structural: [
            { id: "bar",    name: "cask bar", tags: ["commerce", "social"] },
            { id: "clay-hearth", name: "clay hearth", tags: ["heat", "light", "social"] },
            { id: "mat-floor",   name: "woven reed mats", tags: ["social", "rest"] }
        ],
        imageKey: "Swamp Camp"
    },
    {
        type: "Reed Huts", zone: "Swamp", role: "landmark",
        displayName: "Reed Huts",
        baseDescription: "A cluster of small huts woven from reed and bound with wet cord, each on its own platform. Fishing nets dry on every rail.",
        allowedZones: ["swamp"], parentCluster: ["camp"], isConnector: false, minNpcs: 1,
        roleTable: [
            { role: "Villager", weight: 5 }, { role: "Scout", weight: 2 }, { role: "Townsfolk", weight: 2 }
        ],
        structural: [
            { id: "reed-beds", name: "reed sleeping mats", tags: ["rest"] },
            { id: "drying-nets", name: "drying nets", tags: ["storage"] },
            { id: "cook-pots", name: "clay cook pots", tags: ["storage"] }
        ],
        imageKey: "Swamp Camp"
    },
    {
        type: "Hunters' Landing", zone: "Swamp", role: "landmark",
        displayName: "Hunters' Landing",
        baseDescription: "Flat-bottomed boats nose against a plank dock stacked with pelts, eel traps and smoked fish. A weathered trader haggles over all of it.",
        allowedZones: ["swamp"], parentCluster: ["camp"], isConnector: false, minNpcs: 1,
        requiredRole: "Vendor",
        roleTable: [
            { role: "Vendor", weight: 5, unique: true }, { role: "Scout", weight: 3 }, { role: "Villager", weight: 3 }
        ],
        structural: [
            { id: "boat-dock", name: "plank dock", tags: ["landmark", "passage"] },
            { id: "pelt-racks", name: "pelt racks", tags: ["commerce", "storage"] },
            { id: "eel-traps",  name: "eel traps", tags: ["storage", "hazard"] }
        ],
        imageKey: "Marsh"
    },

    {
        type: "Camp Fire Ring", zone: "Ruins", role: "landmark",
        displayName: "Camp Fire Ring",
        baseDescription: "A ring of fallen masonry, with a cookfire at its centre and bedrolls tucked against the broken walls. The crumbled skyline of old Aldermere stands black beyond the smoke.",
        allowedZones: ["ruins"], parentCluster: ["camp"], isConnector: false, minNpcs: 2,
        roleTable: [
            { role: "Pilgrim", weight: 5 }, { role: "Scavenger", weight: 3 },
            { role: "Adventurer", weight: 2 }, { role: "Townsfolk", weight: 2 }
        ],
        structural: [
            { id: "camp-fire",   name: "cookfire in a stone ring", tags: ["heat", "light", "social"] },
            { id: "bedrolls",    name: "bedrolls", tags: ["rest"] },
            { id: "fallen-masonry", name: "fallen masonry seats", tags: ["social"] }
        ],
        imageKey: "Ruins Passage"
    },
    {
        type: "Scavenger's Stall", zone: "Ruins", role: "landmark",
        displayName: "Scavenger's Stall",
        baseDescription: "A canvas awning stretched over a toppled column, laden with things pulled from the ruins: tarnished spoons, lamp glass, odd bits of armor. The seller keeps a cudgel within reach.",
        allowedZones: ["ruins"], parentCluster: ["camp"], isConnector: false, minNpcs: 1,
        requiredRole: "Vendor",
        roleTable: [
            { role: "Vendor", weight: 5, unique: true }, { role: "Scavenger", weight: 3 }, { role: "Pilgrim", weight: 2 }
        ],
        structural: [
            { id: "canvas-awning", name: "canvas awning", tags: ["commerce"] },
            { id: "salvage-table", name: "salvage table", tags: ["commerce", "storage", "loot"] },
            { id: "price-slate",   name: "chalk price slate", tags: ["information"] }
        ],
        imageKey: "Hallway"
    },
    {
        type: "Watch Post", zone: "Ruins", role: "landmark",
        displayName: "Watch Post",
        baseDescription: "A broken stair leads up to a fire-blackened platform where the camp keeps its lookout. A signal horn hangs on a hook, and a stack of spears leans against the parapet.",
        allowedZones: ["ruins"], parentCluster: ["tower"], isConnector: false, minNpcs: 1,
        roleTable: [
            { role: "Scout", weight: 5 }, { role: "Adventurer", weight: 3 }, { role: "Pilgrim", weight: 1 }
        ],
        structural: [
            { id: "signal-horn", name: "signal horn", tags: ["landmark", "formal"] },
            { id: "spear-stack", name: "spear stack", tags: ["storage", "loot"] },
            { id: "practice-dummies", name: "straw practice dummies", tags: ["work", "training"] }
        ],
        imageKey: "Tower"
    },
    {
        type: "Lean-to Chapel", zone: "Ruins", role: "landmark",
        displayName: "Lean-to Chapel",
        baseDescription: "Pilgrims have roofed a broken apse with salvaged boards. A cracked altar stone is draped in candle-ends, and offerings of coin and bread sit in the cracks.",
        allowedZones: ["ruins"], parentCluster: ["ruin"], isConnector: false, minNpcs: 1,
        isShrine: true,
        requiredRole: "Priest",
        roleTable: [
            { role: "Priest", weight: 4, unique: true }, { role: "Pilgrim", weight: 5 }
        ],
        structural: [
            { id: "cracked-altar", name: "cracked altar stone", tags: ["ritual", "landmark"] },
            { id: "candle-ends",   name: "candle-ends and offerings", tags: ["ritual"] },
            { id: "board-roof",    name: "salvaged board roof", tags: ["cover"] }
        ],
        imageKey: "Altar"
    },
    {
        type: "Collapsed Cellar", zone: "Ruins", role: "landmark",
        displayName: "Collapsed Cellar",
        baseDescription: "Steps lead down into a half-fallen cellar that the camp has shored up with timber. It is dry, defensible and just barely warm. Straw pallets line the one sound wall.",
        allowedZones: ["ruins"], parentCluster: ["camp"], isConnector: false, minNpcs: 1,
        roleTable: [
            { role: "Pilgrim", weight: 4 }, { role: "Townsfolk", weight: 3 }, { role: "Scavenger", weight: 2 }
        ],
        structural: [
            { id: "straw-pallets", name: "straw pallets", tags: ["rest"] },
            { id: "timber-props",  name: "timber props", tags: ["structural"] },
            { id: "supply-crates", name: "supply crates", tags: ["storage", "loot"] }
        ],
        imageKey: "Cellar"
    },

    // ── ZONE-TRANSITION CORRIDOR TYPES ────────────────────────────
    // Zone-agnostic connector rooms used only by the zone-transition
    // corridor system in cyoaftw-engine-CORE.js (see
    // ZONE_TRANSITION_CORRIDOR_TYPES / chooseRoomTypeForTransition).
    // Deliberately absent from every ZONE_TEMPLATES.roomTypes list, so
    // normal weighted room selection never picks them - they only ever
    // appear via chooseRoomTypeForTransition while a corridor is active.
    // allowedZones spans all five real zones so they're border-capable
    // from anywhere, matching a Gate's guaranteed 2-4 exit floor.
    {
        type: "Borderlands",
        zone: "Town",
        role: "spine",
        displayName: "Borderlands",
        baseDescription: "The land here belongs to no single place. Familiar terrain frays at the edges, and the way ahead could lead almost anywhere.",
        allowedZones: ["town", "dungeon", "ruins", "underground city", "swamp"],
        parentCluster: [],
        isConnector: true,
        structural: [
            { id: "waymarker",     name: "weathered waymarker", tags: ["landmark"] },
            { id: "worn-trail",    name: "worn trail",          tags: ["passage"] }
        ]
    },
    {
        type: "Fringe Path",
        zone: "Town",
        role: "spine",
        displayName: "Fringe Path",
        baseDescription: "A faint path winds along the fringe between regions, half-swallowed by whatever landscape presses in from either side.",
        allowedZones: ["town", "dungeon", "ruins", "underground city", "swamp"],
        parentCluster: [],
        isConnector: true,
        structural: [
            { id: "boundary-stones", name: "boundary stones", tags: ["landmark"] },
            { id: "overgrown-trail", name: "overgrown trail", tags: ["passage"] }
        ]
    },
    {
        type: "Old Road",
        zone: "Town",
        role: "spine",
        displayName: "Old Road",
        baseDescription: "A once-paved road, now cracked flagstones and leaning milestones. Weeds push up between the stones, but the way is still plain.",
        allowedZones: ["town", "ruins"],
        parentCluster: [],
        isConnector: true,
        structural: [
            { id: "milestone", name: "leaning milestone", tags: ["landmark"] },
            { id: "rutted-road", name: "rutted road", tags: ["passage"] }
        ]
    },
    {
        type: "Causeway",
        zone: "Swamp",
        role: "spine",
        displayName: "Causeway",
        baseDescription: "A raised causeway of old stone and rotting planks threads between black water and reeds. Every step sounds loud over the quiet of the swamp.",
        allowedZones: ["ruins", "swamp"],
        parentCluster: [],
        isConnector: true,
        structural: [
            { id: "causeway-posts", name: "mossy causeway posts", tags: ["landmark"] },
            { id: "reed-beds", name: "reed beds", tags: ["cover"] }
        ]
    },
    {
        type: "Stairwell",
        zone: "Dungeon",
        role: "spine",
        displayName: "Stairwell",
        baseDescription: "Worn stone steps wind through the rock. Each tread is hollowed by feet that stopped coming long ago, and a stale draught moves up the shaft.",
        allowedZones: ["town", "dungeon"],
        parentCluster: [],
        isConnector: true,
        structural: [
            { id: "stone-steps", name: "worn stone steps", tags: ["passage"] },
            { id: "lamp-niche", name: "lamp niche", tags: ["light"] }
        ]
    },
    {
        type: "Old Mine Tunnel",
        zone: "Dungeon",
        role: "spine",
        displayName: "Old Mine Tunnel",
        baseDescription: "A timber-braced tunnel cut for ore carts. Rusted rails run along the floor, and the old props groan when the air shifts.",
        allowedZones: ["dungeon", "underground city"],
        parentCluster: [],
        isConnector: true,
        structural: [
            { id: "rusted-rails", name: "rusted rails", tags: ["passage"] },
            { id: "mine-props", name: "timber props", tags: ["structural"] }
        ]
    },
    {
        type: "Lift Shaft",
        zone: "Underground City",
        role: "spine",
        displayName: "Lift Shaft",
        baseDescription: "A wide shaft bored through the rock, with an oak-and-iron cargo lift on counterweighted chains. Dwarven runes along the rim mark the load limit.",
        allowedZones: ["town", "underground city"],
        parentCluster: [],
        isConnector: true,
        structural: [
            { id: "cargo-lift", name: "cargo lift", tags: ["passage", "landmark"] },
            { id: "lift-chains", name: "winch chains", tags: ["structural"] }
        ]
    },
    {
        type: "Underground Stairs",
        zone: "Underground City",
        role: "spine",
        displayName: "Underground Stairs",
        baseDescription: "Broad, worn stone steps descend beneath the town gate into a vast cavern. A few pale lanterns mark the balustrade; below, stone streets and houses cluster around dark water, with a waterfall glimmering beyond them.",
        allowedZones: ["town", "underground city"],
        parentCluster: [],
        isConnector: true,
        noNpcs: true,
        structural: [
            { id: "underground-stairway", name: "stone stairway", tags: ["passage"], alwaysShow: true,
              examineText: "The stone stairway joins the town gate above to a public hallway in the underground city below. Worn treads and a solid balustrade mark the way in both directions." },
            { id: "stone-balustrade", name: "worn stone balustrade", tags: ["structural"] }
        ],
        imageKey: "Underground Stairs"
    },

    // ── BUILDING CONNECTORS ────────────────────────────────────────
    // Hallways, stairs and doorways that tie a building's rooms together
    // (see BUILDING_BLUEPRINTS). They are never part of a zone's random
    // roomTypes roll - only blueprints place them. role "spine" means no
    // NPCs spawn in them.
    {
        type: "Cellar Stairs",
        zone: "Town",
        role: "spine",
        displayName: "Cellar Stairs",
        baseDescription: "A narrow landing behind the taproom. A steep wooden stair drops into the cool dark of the cellar, and the smell of damp stone and spilled ale drifts up.",
        allowedZones: ["town"],
        parentCluster: ["tavern"],
        isConnector: true,
        structural: [
            { id: "steep-stair", name: "steep wooden stair", tags: ["passage"] },
            { id: "wall-hook",   name: "lantern hook",       tags: ["light"] }
        ]
    },
    {
        type: "Back Door",
        zone: "Town",
        role: "spine",
        displayName: "Back Door",
        baseDescription: "A cramped back passage by the kitchen, stacked with empty crates and slop buckets. A barred door leads out to the alley behind the building.",
        allowedZones: ["town"],
        parentCluster: ["tavern", "inn"],
        isConnector: true,
        structural: [
            { id: "door-bar",   name: "heavy door bar", tags: ["barrier"] },
            { id: "slop-buckets", name: "slop buckets", tags: ["refuse"] }
        ]
    },
    {
        type: "Stairs",
        zone: "Town",
        role: "spine",
        displayName: "Staircase",
        baseDescription: "A broad wooden staircase worn smooth by travellers' boots, rising from the common room to the guest floor above.",
        allowedZones: ["town"],
        parentCluster: ["inn"],
        isConnector: true,
        structural: [
            { id: "banister", name: "polished banister", tags: ["passage"] },
            { id: "stair-runner", name: "threadbare runner", tags: ["passage"] }
        ]
    },
    {
        type: "Upstairs Hallway",
        zone: "Town",
        role: "spine",
        displayName: "Upstairs Hallway",
        baseDescription: "A narrow, creaking hallway lined with numbered doors. A single lamp burns at the end, and muffled snores seep through the walls.",
        allowedZones: ["town"],
        parentCluster: ["inn"],
        isConnector: true,
        structural: [
            { id: "hall-lamp", name: "hall lamp", tags: ["light"] },
            { id: "room-doors", name: "numbered doors", tags: ["barrier"] }
        ]
    },

    // ── SMITHY & TOWN HALL INTERIORS ───────────────────────────────
    // Rooms behind the street-facing Smithy / Town Hall (see
    // BUILDING_BLUEPRINTS). Never rolled randomly.
    {
        type: "Smithy Storeroom",
        zone: "Town",
        role: "interior",
        displayName: "Smithy Storeroom",
        baseDescription: "A low, sooty storeroom behind the forge. Ingots and ore sacks are stacked to the rafters, and a dwarven cargo lift squats against the back wall on its thick chains. A heavy yard door leads out to the alley.",
        allowedZones: ["town"],
        parentCluster: ["market", "square"],
        isConnector: false,
        structural: [
            { id: "ore-bin",    name: "ore bin",         tags: ["storage", "loot"] },
            { id: "ingot-rack", name: "ingot rack",      tags: ["storage", "commerce"] },
            { id: "cargo-lift", name: "cargo lift",      tags: ["passage", "landmark"] }
        ],
        imageKey: "Smithy"
    },
    {
        type: "Smith's Quarters",
        zone: "Town",
        role: "interior",
        displayName: "Smith's Quarters",
        baseDescription: "A cramped living space above the din of the forge: a narrow bed, a table with a half-eaten loaf, and a shelf of tools too precious to leave downstairs.",
        allowedZones: ["town"],
        parentCluster: ["market", "square"],
        isConnector: false,
        structural: [
            { id: "bed",        name: "bed",         tags: ["rest"] },
            { id: "chest",      name: "chest",       tags: ["storage"] },
            { id: "wash-basin", name: "wash basin",  tags: ["hygiene"] }
        ],
        imageKey: "Guest Room"
    },
    {
        type: "Townhouse",
        zone: "Town",
        role: "interior",
        displayName: "Townhouse",
        baseDescription: "The front room of a narrow townhouse: a worn table, a few stools, and a hearth banked low. Someone's washing hangs drying by the fire, and a door at the back leads further in.",
        allowedZones: ["town"],
        parentCluster: ["house"],
        isConnector: false,
        structural: [
            { id: "table",  name: "worn table",  tags: ["surface", "social"] },
            { id: "hearth", name: "hearth",      tags: ["heat", "light"] }
        ],
        imageKey: "Room"
    },
    {
        type: "Bedroom",
        zone: "Town",
        role: "interior",
        displayName: "Bedroom",
        baseDescription: "A small, tidy bedroom: a narrow bed under a patched quilt, a clothes chest, and a shuttered window that looks out over the rooftops.",
        allowedZones: ["town"],
        parentCluster: ["house"],
        isConnector: false,
        structural: [
            { id: "bed",        name: "bed",         tags: ["rest"] },
            { id: "chest",      name: "chest",       tags: ["storage"] },
            { id: "wash-basin", name: "wash basin",  tags: ["hygiene"] }
        ],
        imageKey: "Guest Room"
    },
    {
        type: "Hall Corridor",
        zone: "Town",
        role: "spine",
        displayName: "Hall Corridor",
        baseDescription: "A cool stone corridor behind the great hall, hung with the portraits of long-dead magistrates. Clerks hurry past with armfuls of paper, and boots echo from the guardroom.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: true,
        structural: [
            { id: "portraits", name: "magistrates' portraits", tags: ["landmark"] },
            { id: "wall-sconces", name: "wall sconces", tags: ["light"] }
        ],
        imageKey: "Town Hall"
    },
    {
        type: "Council Chamber",
        zone: "Town",
        role: "landmark",
        displayName: "Council Chamber",
        baseDescription: "A high-ceilinged chamber of dressed stone. A long council table fills the floor beneath hanging banners, and a raised dais at the far end holds the chair of whoever truly runs this town.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: false,
        structural: [
            { id: "council-table", name: "long council table", tags: ["surface", "formal"] },
            { id: "banners",       name: "hanging banners",     tags: ["landmark"] },
            { id: "raised-dais",   name: "raised dais",         tags: ["formal", "landmark"] }
        ],
        imageKey: "Town Hall"
    },
    {
        type: "Records Office",
        zone: "Town",
        role: "interior",
        displayName: "Records Office",
        baseDescription: "A narrow, dusty office walled with pigeonholes of deeds, tax rolls and levy tallies. A clerk's desk faces the door, and the room smells of ink and old paper.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: false,
        structural: [
            { id: "clerk-desk",  name: "clerk's desk",   tags: ["surface", "work", "formal"] },
            { id: "pigeonholes", name: "pigeonholes of records", tags: ["storage", "information"] },
            { id: "writing-table", name: "writing table cluttered with ink and sand", tags: ["surface", "work", "lab"] }
        ],
        imageKey: "Library"
    },
    // The Town Portal: a waygate the council keeps behind the Hall Corridor.
    // Placed only by the Town Hall blueprint (never rolled). Its "portal"
    // tagged fixture opens the pay-and-step-through card (see TOWN PORTAL in
    // cyoaftw-engine-CORE.js).
    {
        type: "Portal Chamber",
        zone: "Town",
        role: "interior",
        displayName: "Portal Chamber",
        noNpcs: true,
        baseDescription: "A round, windowless chamber of old grey stone, its floor inlaid with rings of worn brass. A tall arch of fitted black stone stands against the far wall, and the air inside it shimmers like heat over a road.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: false,
        structural: [
            { id: "town-portal", name: "shimmering waygate", tags: ["landmark", "portal"], alwaysShow: true,
              examineText: "A tall arch of black stone holds a pane of shimmering air. Through it you glimpse a street you do not know, under a different sky. Brass rings in the floor hum faintly whenever someone stands near, and a plaque beside the arch states the council's fee for passage." },
            { id: "brass-rings", name: "inlaid brass rings", tags: ["landmark"] }
        ],
        imageKey: "Portal Chamber"
    },

    // ── GUILDHALL & CHAPEL ─────────────────────────────────────────
    // Two more public buildings (see BUILDING_BLUEPRINTS). Never rolled
    // randomly. The Guildhall is where fighters and sellswords are trained
    // and hired (its yard carries "training" fixtures, which makes it a
    // synergy yard station); the Chapel is a real, prayer-capable temple,
    // unlike the hidden cellar shrine under the tavern.
    {
        type: "Guildhall",
        zone: "Town",
        role: "landmark",
        displayName: "Guildhall",
        baseDescription: "A broad, timber-framed hall with a painted shield over the door for every company that ever signed its rolls. A job board crowds the entrance, and the sound of steel on steel rings from somewhere behind.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: false,
        structural: [
            { id: "job-board",    name: "job board",         tags: ["information", "commerce"], alwaysShow: true },
            { id: "guild-shields", name: "painted guild shields", tags: ["landmark"] },
            { id: "muster-bench", name: "muster bench",      tags: ["social", "rest"] }
        ],
        imageKey: "Guildhall"
    },
    {
        type: "Training Yard",
        zone: "Town",
        role: "interior",
        displayName: "Training Yard",
        baseDescription: "A packed-earth yard walled in on all sides, scuffed by years of boots. Straw dummies stand against one wall, a weapon rack against another, and a pair of recruits trade slow, careful blows under a master's eye.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: false,
        minNpcs: 1,
        structural: [
            { id: "straw-dummies", name: "straw dummies",  tags: ["training", "combat"] },
            { id: "weapon-rack",   name: "weapon rack",    tags: ["storage", "combat"] },
            { id: "sparring-ring", name: "chalked sparring ring", tags: ["training", "formal"] }
        ],
        imageKey: "Training Yard"
    },
    {
        type: "Guildmaster's Office",
        zone: "Town",
        role: "interior",
        displayName: "Guildmaster's Office",
        baseDescription: "A cramped office stacked with contract scrolls and muster rolls. A scarred desk faces the door, and a map of the district is pinned to the wall, studded with coloured tacks.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: false,
        structural: [
            { id: "scarred-desk",  name: "scarred desk",     tags: ["surface", "work", "formal"] },
            { id: "contract-shelf", name: "shelf of contracts", tags: ["storage", "information"] },
            { id: "district-map",  name: "pinned district map", tags: ["information", "landmark"] }
        ],
        imageKey: "Guildmaster's Office"
    },
    {
        type: "Chapel",
        zone: "Town",
        role: "landmark",
        displayName: "Chapel",
        baseDescription: "A small stone chapel with a narrow bell-cote and a worn step. Inside, light falls in coloured bars through a single window onto rows of plain benches and an altar kept clean by someone who clearly cares.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: false,
        // Prayer-capable (see isShrineRoom in cyoaftw-engine-CORE.js), and
        // always tended: minNpcs keeps the priest at the altar even though
        // ordinary shrines are mostly empty.
        isShrine: true,
        minNpcs: 1,
        structural: [
            { id: "altar-stone",  name: "altar stone",     tags: ["ritual", "landmark"] },
            { id: "votive-rack",  name: "rack of votive candles", tags: ["light", "ritual"] },
            { id: "plain-benches", name: "plain benches",  tags: ["social", "rest"] }
        ],
        imageKey: "Cellar"
    },
    {
        type: "Vestry",
        zone: "Town",
        role: "interior",
        displayName: "Vestry",
        baseDescription: "A narrow room behind the altar where vestments hang on pegs and the poor-box is counted. A kettle sits by a small stove, and a shelf of worn prayer books leans against the wall.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: false,
        structural: [
            { id: "vestment-pegs", name: "pegs of vestments", tags: ["storage"] },
            { id: "prayer-shelf",  name: "shelf of prayer books", tags: ["storage", "information"] },
            { id: "poor-box",      name: "iron-banded poor-box", tags: ["storage", "commerce"] }
        ],
        imageKey: "Room"
    },

    // ── ZONE BOSS ROOMS ────────────────────────────────────────────
    // One per zone, added as a normal flat-odds entry in that zone's
    // ZONE_TEMPLATES.roomTypes list. cyoaftw-engine-CORE.js's ZONE_BOSS_ROOMS
    // map ties each of these back to its zone, and spawnNPCsForRoom checks
    // for a room of this type to guarantee-place that zone's rare boss NPC
    // (see the "ZONE BOSS" section there for the full mechanic, including
    // the room-count safety net that forces this type if the flat odds
    // haven't naturally produced it after a while).
    {
        type: "Town Hall",
        zone: "Town",
        role: "landmark",
        displayName: "Town Hall",
        baseDescription: "A stately hall of dressed stone, its doors flanked by carved pillars. This is where the town's business - and its leadership - is conducted.",
        allowedZones: ["town"],
        parentCluster: ["square"],
        isConnector: false,
        structural: [
            { id: "council-table", name: "long council table", tags: ["surface", "formal"] },
            { id: "banners",       name: "hanging banners",     tags: ["landmark"] },
            { id: "raised-dais",   name: "raised dais",         tags: ["formal", "landmark"] }
        ],
        imageKey: "Town Hall"
    },
    {
        type: "Throne Room",
        zone: "Dungeon",
        role: "landmark",
        displayName: "Throne Room",
        baseDescription: "A cavernous chamber dominated by a crude but imposing throne. Whoever rules this place holds court here.",
        allowedZones: ["dungeon"],
        parentCluster: ["chamber"],
        isConnector: false,
        structural: [
            { id: "throne",        name: "crude throne",        tags: ["landmark", "formal"] },
            { id: "trophy-rack",   name: "trophy rack",         tags: ["danger", "landmark"] },
            { id: "brazier",       name: "iron brazier",        tags: ["light", "heat"] }
        ],
        imageKey: "Throne Room"
    },
    {
        type: "Inner Sanctum",
        zone: "Ruins",
        role: "landmark",
        displayName: "Inner Sanctum",
        baseDescription: "The deepest, best-preserved chamber in the ruins, sealed away from the collapse outside. Something has clearly been guarding it.",
        allowedZones: ["ruins"],
        parentCluster: ["altar", "shrine"],
        isConnector: false,
        structural: [
            { id: "sealed-altar",  name: "sealed altar",        tags: ["landmark", "formal"] },
            { id: "old-wards",     name: "faded warding marks", tags: ["danger", "landmark", "information"] }
        ],
        imageKey: "Inner Sanctum"
    },
    {
        type: "Chieftain's Hall",
        zone: "Underground City",
        role: "landmark",
        displayName: "Chieftain's Hall",
        baseDescription: "The largest hall in the underground settlement, lit by rows of torches. This is where the chieftain holds audience.",
        allowedZones: ["underground city"],
        parentCluster: ["cavern", "vault"],
        isConnector: false,
        structural: [
            { id: "chieftain-seat", name: "chieftain's seat",   tags: ["landmark", "formal"] },
            { id: "war-trophies",   name: "war trophies",       tags: ["danger", "landmark"] }
        ],
        imageKey: "Chieftain's Hall"
    },
    {
        type: "Witch's Lair",
        zone: "Swamp",
        role: "landmark",
        displayName: "Witch's Lair",
        baseDescription: "A hut raised on stilts above the mire, hung with charms and bundled herbs. Something old and dangerous lives here.",
        allowedZones: ["swamp"],
        parentCluster: ["swamp camp"],
        isConnector: false,
        structural: [
            { id: "hanging-charms", name: "hanging charms",     tags: ["danger", "landmark"] },
            { id: "cauldron",       name: "bubbling cauldron",  tags: ["danger", "work", "cauldron"], alwaysShow: true }
        ],
        imageKey: "Witch's Lair"
    },

    // ── THE QUIET ARTS: rogue cluster ────────────────────────────────
    // Town: the "Quiet House" building (see BUILDING_BLUEPRINTS): a pawnbroker's
    // front, a counting room where rogues drink and teach, a locked workroom
    // with the alchemy table, and a cellar hideaway. Never rolled randomly.
    // Wild: the Smugglers' Den (Dungeon, Ruins, Underground City; one per zone)
    // brings a locked Hidden Workroom and a Cache with it (sideRooms, see
    // attachRoomClusterSideRooms in the engine). The alchemy table stands only
    // in the two workrooms.
    {
        type: "Pawnbroker",
        zone: "Town",
        role: "landmark",
        displayName: "Pawnbroker's Shop",
        baseDescription: "A narrow shop crowded with other people's belongings: pocket watches, a saddle, a single boot, a stuffed owl. Every piece has a paper tag in a neat hand, and nobody here asks where anything came from.",
        allowedZones: ["town"],
        parentCluster: ["quiet-house"],
        isConnector: false,
        minNpcs: 1,
        requiredRole: "Shopkeeper",
        roleTable: [
            { role: "Shopkeeper", weight: 7, unique: true },
            { role: "Townsfolk", weight: 2 },
            { role: "Wanderer", weight: 2 }
        ],
        structural: [
            { id: "pawn-counter", name: "pawn counter", tags: ["surface", "commerce"] },
            { id: "glass-case",   name: "locked glass case", tags: ["storage", "commerce"] },
            { id: "pledge-shelves", name: "shelves of pledged goods", tags: ["storage", "commerce"] }
        ],
        imageKey: "Smithy"
    },
    {
        type: "Counting Room",
        zone: "Town",
        role: "interior",
        displayName: "Counting Room",
        baseDescription: "A back room with the shutters closed and a lamp turned low. A round table is scattered with dice, ledgers and a few cheerfully mismatched cups. People here lower their voices when a stranger comes in, and raise them again if the stranger knows the right word.",
        allowedZones: ["town"],
        parentCluster: ["quiet-house"],
        isConnector: false,
        minNpcs: 1,
        roleTable: [
            { role: "Scout", weight: 4 },
            { role: "Wanderer", weight: 3 },
            { role: "Delver", weight: 1 },
            { role: "Townsfolk", weight: 2 }
        ],
        structural: [
            { id: "round-table", name: "round table", tags: ["social", "surface"] },
            { id: "ledger-stand", name: "ledger stand", tags: ["information"] },
            { id: "lamp-low",    name: "shaded lamp", tags: ["light"] }
        ],
        imageKey: "Library"
    },
    {
        type: "Alchemy Workroom",
        zone: "Town",
        role: "interior",
        displayName: "Alchemist's Workroom",
        baseDescription: "A cramped room that smells of crushed leaves, hot glass and something faintly bitter. Bunches of herbs hang drying from the beams, jars of powders line the shelves, and an alchemist's table takes up most of the floor.",
        allowedZones: ["town"],
        parentCluster: ["quiet-house"],
        isConnector: false,
        roleTable: [
            { role: "Wanderer", weight: 3 },
            { role: "Scout", weight: 3 },
            { role: "Scholar", weight: 2 },
            { role: "Townsfolk", weight: 1 }
        ],
        structural: [
            { id: "alchemy-table", name: "alchemist's table", tags: ["work", "lab", "alchemy"], alwaysShow: true },
            { id: "drying-herbs",  name: "bunches of drying herbs", tags: ["storage"] },
            { id: "powder-jars",   name: "shelves of stoppered jars", tags: ["storage"] }
        ],
        imageKey: "Library"
    },
    {
        type: "Quiet Hideaway",
        zone: "Town",
        role: "interior",
        displayName: "Hideaway Cellar",
        baseDescription: "A low brick cellar kept dry and tidy by someone who expects to need it in a hurry: a cot, a lantern, a rack of plain cloaks, and a floor board that does not quite sit flush.",
        allowedZones: ["town"],
        parentCluster: ["quiet-house"],
        isConnector: false,
        roleTable: [
            { role: "Wanderer", weight: 3 },
            { role: "Scout", weight: 3 },
            { role: "Townsfolk", weight: 1 }
        ],
        structural: [
            { id: "cot",          name: "cot", tags: ["rest"] },
            { id: "cloak-rack",   name: "rack of plain cloaks", tags: ["storage"] },
            { id: "loose-board",  name: "loose floor board", tags: ["storage", "landmark"] }
        ],
        imageKey: "Cellar"
    },
    {
        type: "Smugglers' Den",
        zone: "Dungeon",
        role: "landmark",
        displayName: "Smugglers' Den",
        baseDescription: "A broad chamber turned into a crooked market after dark: crates stencilled with other people's marks, a dice table, a tally board chalked with debts. Conversation stops when you walk in, and everyone has quietly found somewhere to put their hands.",
        allowedZones: ["dungeon", "ruins", "underground city"],
        parentCluster: ["smugglers"],
        isConnector: false,
        minNpcs: 1,
        // Brings two private rooms with it (see attachRoomClusterSideRooms).
        sideRooms: [
            { type: "Hidden Workroom", lock: { level: [2, 3] } },
            { type: "Smugglers' Cache", lock: { level: [1, 2] }, parent: "previous" }
        ],
        roleTable: [
            { role: "Scout", weight: 4 },
            { role: "Wanderer", weight: 3 },
            { role: "Scavenger", weight: 2 },
            { role: "Delver", weight: 2 }
        ],
        structural: [
            { id: "marked-crates", name: "stencilled crates", tags: ["storage", "loot"] },
            { id: "dice-table",    name: "dice table", tags: ["social", "surface"] },
            { id: "tally-board",   name: "chalked tally board", tags: ["information"] }
        ],
        imageKey: "Vault"
    },
    {
        type: "Hidden Workroom",
        zone: "Dungeon",
        role: "interior",
        displayName: "Hidden Workroom",
        baseDescription: "A small side room sealed off from the den behind a plain door. Glassware, a spirit lamp and a stained alchemist's table have been set up with the care of someone who plans to come back.",
        allowedZones: ["dungeon", "ruins", "underground city"],
        parentCluster: ["smugglers"],
        isConnector: false,
        roleTable: [
            { role: "Scout", weight: 3 },
            { role: "Wanderer", weight: 3 },
            { role: "Scavenger", weight: 1 }
        ],
        structural: [
            { id: "alchemy-table", name: "alchemist's table", tags: ["work", "lab", "alchemy"], alwaysShow: true },
            { id: "drying-herbs",  name: "bunches of drying herbs", tags: ["storage"] }
        ],
        imageKey: "Library"
    },
    {
        type: "Smugglers' Cache",
        zone: "Dungeon",
        role: "interior",
        displayName: "Smugglers' Cache",
        baseDescription: "A cramped storeroom of bundled cloth, kegs and barrels with their stamps scraped off. Whatever is kept here was not meant to be found by anyone, least of all the people who lost it.",
        allowedZones: ["dungeon", "ruins", "underground city"],
        parentCluster: ["smugglers"],
        isConnector: false,
        noNpcs: true,
        structural: [
            { id: "scraped-kegs", name: "kegs with the stamps scraped off", tags: ["storage", "loot"] },
            { id: "cloth-bundles", name: "bundles of oiled cloth", tags: ["storage", "loot"] }
        ],
        imageKey: "Vault"
    }
];

// ── ROOM IMAGE MAP ───────────────────────────────────────────────


// Retain the original Freeimage image URLs as per-room backup sources.
const ROOM_IMAGE_BACKUP_MAP = {

    // ───────── Town Spine ─────────
    "Street": "https://iili.io/qFWPsNR.jpg",
    "Avenue": "https://iili.io/qFW4bzN.jpg",
    "Alleyway": "https://iili.io/qFX9SiG.jpg",

    // ───────── Town Landmarks ─────────
    "Square": "https://iili.io/qFW4FoP.jpg",
    "Gate": "https://iili.io/qFWrByl.jpg",
    "Portal Chamber": "https://iili.io/nOGrwyN.jpg",

    // ───────── Guild ─────────
    "Guildhall": "https://iili.io/nOM5pqv.jpg",
    "Training Yard": "https://iili.io/nOM5y1R.jpg",
    "Guildmaster's Office": "https://iili.io/nOM5bLJ.jpg",

    // ───────── Tavern ─────────
    "Tavern": "https://iili.io/qFWVXYg.jpg",
    "Taproom": "https://iili.io/qFWVXYg.jpg",
    "Kitchen": "https://iili.io/qFXJeGs.jpg",
    "Cellar": "https://iili.io/qFWMgmx.jpg",
    "Guest Room": "https://iili.io/qFW2Aw7.jpg",
    "Room": "https://iili.io/qFW2Aw7.jpg",
    "Cellar Stairs": "https://iili.io/nOGrejt.jpg",
    "Back Door": "https://iili.io/nOGrX3v.jpg",

    // ───────── Inn ─────────
    "Inn": "https://iili.io/qFW3cxt.jpg",
    "Inn Common": "https://iili.io/qFW3cxt.jpg",
    "Stairs": "https://iili.io/nOGrkZX.jpg",
    "Upstairs Hallway": "https://iili.io/nOGrhaR.jpg",
    "Brothel": "https://iili.io/qUJX3j1.jpg",

    // ───────── Dungeon Spine ─────────
    "Passage": "https://iili.io/qFVVGi7.jpg",
    "Corridor": "https://iili.io/qFVMLP9.jpg",
    "Tunnel": "https://iili.io/qFW2jMg.jpg",

    // ───────── Dungeon Landmarks ─────────
    "Chamber": "https://iili.io/qFVGWL7.jpg",
    "Trap": "https://iili.io/qFWdC7V.jpg",
    "Shrine": "https://iili.io/qFXdHt1.jpg",
    "Armory": "https://iili.io/qFX3ScJ.jpg",

    // ───────── Ruins ─────────
    "Hallway": "https://iili.io/qFWJLss.jpg",
    "Altar": "https://iili.io/qFVik8J.jpg",
    "Library": "https://iili.io/qFXfr9j.jpg",
    "Tower": "https://iili.io/qFXqX0F.jpg",
    "Ruins Passage": "https://iili.io/qFXBghQ.jpg",

    // ───────── Underground City ─────────
    "Cavern": "https://iili.io/qFXn4g1.jpg",
    "Vault": "https://iili.io/qFXoaEB.jpg",
    "Underground Hallway": "https://iili.io/qFXxz6N.jpg",
    "Underground Gate": "https://iili.io/qFXzdxf.jpg",
    "Underground Stairs": "https://iili.io/nOGrjvp.jpg",
    "Lift Shaft": "https://iili.io/nOMKN1a.jpg",

    // Stand-in art: approximate re-use of the closest existing image until
    // dedicated art exists. Swap a URL here when real art is made.
    "Smithy": "https://iili.io/qFX3ScJ.jpg",
    "Deep Forge": "https://iili.io/qFX3ScJ.jpg",
    "Mine Shaft": "https://iili.io/qFXn4g1.jpg",
    "Collapsed Gallery": "https://iili.io/qFW2jMg.jpg",
    "Old Mine Tunnel": "https://iili.io/qFW2jMg.jpg",
    "Stairwell": "https://iili.io/qFVVGi7.jpg",
    "Old Road": "https://iili.io/qFWPsNR.jpg",
    "Causeway": "https://iili.io/qFXBghQ.jpg",
    "Borderlands": "https://iili.io/qFXBghQ.jpg",
    "Fringe Path": "https://iili.io/qFXBghQ.jpg",
    "Town Hall": "https://iili.io/qFVGWL7.jpg",
    "Throne Room": "https://iili.io/qFVGWL7.jpg",
    "Chieftain's Hall": "https://iili.io/qFVGWL7.jpg",
    "Inner Sanctum": "https://iili.io/qFVik8J.jpg",
    "Witch's Lair": "https://iili.io/qFXdHt1.jpg",
    "Marsh": "https://iili.io/qFXBghQ.jpg",
    "Broken Ground": "https://iili.io/qFWJLss.jpg",
    "Swamp Camp": "https://iili.io/qFXBghQ.jpg",
    "Submerged Ruin": "https://iili.io/qFWJLss.jpg"

};

// Primary host; aliases retain the same stand-in art as the original map.
const ROOM_IMAGE_MAP = {
    "Street": "https://i.postimg.cc/FswXcPY9/town-street.jpg",
    "Avenue": "https://i.postimg.cc/hPNRxCXB/town-avenue.jpg",
    "Alleyway": "https://i.postimg.cc/kX2d2rgG/town-alley.jpg",
    "Square": "https://i.postimg.cc/c4PGYDvx/town-square.jpg",
    "Gate": "https://i.postimg.cc/hPNRxCXg/town-gate.jpg",
    "Portal Chamber": "https://i.postimg.cc/L6JMJd6b/portalroom.jpg",
    "Guildhall": "https://i.postimg.cc/c19S11Z2/guildhall.jpg",
    "Training Yard": "https://i.postimg.cc/wTnYJW1x/trainingyard.jpg",
    "Guildmaster's Office": "https://i.postimg.cc/tCsHs0CD/guildoffice.jpg",
    "Tavern": "https://i.postimg.cc/L6JMJd88/tavern-main.jpg",
    "Taproom": "https://i.postimg.cc/qMNdNfvR/tavern-taproom.jpg",
    "Kitchen": "https://i.postimg.cc/8P7V78zp/tavern-kitchen.jpg",
    "Cellar": "https://i.postimg.cc/bNZjZXwq/tavern-cellar.jpg",
    "Guest Room": "https://i.postimg.cc/QxFrFLxn/inn-room.jpg",
    "Room": "https://i.postimg.cc/QxFrFLxn/inn-room.jpg",
    "Cellar Stairs": "https://i.postimg.cc/G37C33rB/cellar-stairs.jpg",
    "Back Door": "https://i.postimg.cc/FzB5TpD4/backdoor.jpg",
    "Inn": "https://i.postimg.cc/jdDrDVd3/inn-common.jpg",
    "Inn Common": "https://i.postimg.cc/jdDrDVd3/inn-common.jpg",
    "Stairs": "https://i.postimg.cc/wT1d1KTr/innstairway.jpg",
    "Upstairs Hallway": "https://i.postimg.cc/TYBvmkK5/upstairshallway.jpg",
    "Brothel": "https://i.postimg.cc/7hW8K9m4/brothel.jpg",
    "Passage": "https://i.postimg.cc/Kcq2ccFD/dungeon-passage.jpg",
    "Corridor": "https://i.postimg.cc/kM1mMM9N/dungeon-corridor.jpg",
    "Tunnel": "https://i.postimg.cc/T27622GS/dungeon-tunnel.jpg",
    "Chamber": "https://i.postimg.cc/mZXsZZRP/dungeon-chamber.jpg",
    "Trap": "https://i.postimg.cc/FFW4FFmB/dungeon-trap.jpg",
    "Shrine": "https://i.postimg.cc/9X8hXXVt/dungeon-shrine.jpg",
    "Armory": "https://i.postimg.cc/Pf3jffhP/dungeon-armory.jpg",
    "Hallway": "https://i.postimg.cc/xTXSXrTw/ruins-hallway.jpg",
    "Altar": "https://i.postimg.cc/8P7V78Px/ruins-altar.jpg",
    "Library": "https://i.postimg.cc/pXmtmNLN/ruins-library.jpg",
    "Tower": "https://i.postimg.cc/SNnpn0xq/ruins-tower.jpg",
    "Ruins Passage": "https://i.postimg.cc/kX2d2rgC/ruins-passage.jpg",
    "Cavern": "https://i.postimg.cc/MKgJRsnv/underground-cavern.jpg",
    "Vault": "https://i.postimg.cc/02h1mtzM/underground-vault.jpg",
    "Underground Hallway": "https://i.postimg.cc/NfZvTNKy/underground-hallway.jpg",
    "Underground Gate": "https://i.postimg.cc/xTBVHsXX/underground-gate.jpg",
    "Underground Stairs": "https://i.postimg.cc/qMNdNfv4/stairsundergorundcity.jpg",
    "Lift Shaft": "https://i.postimg.cc/5yRdsgn1/cargolift.jpg",
    "Smithy": "https://i.postimg.cc/Pf3jffhP/dungeon-armory.jpg",
    "Deep Forge": "https://i.postimg.cc/Pf3jffhP/dungeon-armory.jpg",
    "Mine Shaft": "https://i.postimg.cc/MKgJRsnv/underground-cavern.jpg",
    "Collapsed Gallery": "https://i.postimg.cc/T27622GS/dungeon-tunnel.jpg",
    "Old Mine Tunnel": "https://i.postimg.cc/T27622GS/dungeon-tunnel.jpg",
    "Stairwell": "https://i.postimg.cc/Kcq2ccFD/dungeon-passage.jpg",
    "Old Road": "https://i.postimg.cc/FswXcPY9/town-street.jpg",
    "Causeway": "https://i.postimg.cc/kX2d2rgC/ruins-passage.jpg",
    "Borderlands": "https://i.postimg.cc/kX2d2rgC/ruins-passage.jpg",
    "Fringe Path": "https://i.postimg.cc/kX2d2rgC/ruins-passage.jpg",
    "Town Hall": "https://i.postimg.cc/mZXsZZRP/dungeon-chamber.jpg",
    "Throne Room": "https://i.postimg.cc/mZXsZZRP/dungeon-chamber.jpg",
    "Chieftain's Hall": "https://i.postimg.cc/mZXsZZRP/dungeon-chamber.jpg",
    "Inner Sanctum": "https://i.postimg.cc/8P7V78Px/ruins-altar.jpg",
    "Witch's Lair": "https://i.postimg.cc/9X8hXXVt/dungeon-shrine.jpg",
    "Marsh": "https://i.postimg.cc/kX2d2rgC/ruins-passage.jpg",
    "Broken Ground": "https://i.postimg.cc/xTXSXrTw/ruins-hallway.jpg",
    "Swamp Camp": "https://i.postimg.cc/kX2d2rgC/ruins-passage.jpg",
    "Submerged Ruin": "https://i.postimg.cc/xTXSXrTw/ruins-hallway.jpg"
};

// An alternate format of the lift artwork was also supplied.
const ROOM_IMAGE_ALTERNATES = {
    "Lift Shaft": ["https://i.postimg.cc/qBbTBB0n/cargolift.png"]
};

const ZONE_IMAGE_MAP = {
    "Town": "https://iili.io/town-default-placeholder.jpg",
    "Dungeon": "https://iili.io/dungeon-default-placeholder.jpg",
    "Ruins": "https://iili.io/ruins-default-placeholder.jpg",
    "Underground City": "https://iili.io/underground-default-placeholder.jpg",
    "Castle": "https://iili.io/castle-default-placeholder.jpg"
};



// ── HELPER: GET ZONE TEMPLATE ────────────────────────────────────

function getZoneTemplate(zoneName) {
    return ZONE_TEMPLATES.find(
        z => z.name.toLowerCase() === String(zoneName || "").toLowerCase()
    ) || null;
}

// ── HELPER: GET ROOM TEMPLATE ────────────────────────────────────

function getRoomTemplate(roomType) {
    return ROOM_TEMPLATES.find(
        r => r.type.toLowerCase() === String(roomType || "").toLowerCase()
    ) || null;
}

// ── HELPER: GET SPECIES TEMPLATE ────────────────────────────────

function getSpeciesTemplate(species) {
    return SPECIES_TEMPLATES.find(
        s => s.species.toLowerCase() === String(species || "").toLowerCase()
    ) || null;
}

function isHumanoidSpecies(species) {
    const template = getSpeciesTemplate(species);
    return !!(template && template.isHumanoid);
}

// ── HELPER: GET IMAGE FOR ROOM ───────────────────────────────────

function getRoomImage(roomType) {
    return ROOM_IMAGE_MAP[roomType] || null;
}

// Ordered candidates for visual loading only. Custom art never falls back to
// an unrelated stock image; selecting a backup does not rewrite saved state.
function getRoomImageSources(room) {
    if (!room) return [];
    const template = getRoomTemplate(room.type);
    const key = template ? (template.imageKey || template.type) : room.type;
    const primary = ROOM_IMAGE_MAP[key];
    const backup = ROOM_IMAGE_BACKUP_MAP[key];
    const alternates = ROOM_IMAGE_ALTERNATES[key] || [];
    const assigned = room.image || primary;
    if (!assigned) return [];
    if (assigned !== primary && assigned !== backup && !alternates.includes(assigned)) return [assigned];
    return [primary].concat(alternates, backup).filter(function (url, index, list) {
        return !!url && list.indexOf(url) === index;
    });
}

// Refresh missing art and these replaced stand-ins when saved rooms are shown.
// Preserve deliberately assigned/custom images rather than resetting every room.
function ensureRoomImage(room) {
    if (!room) return null;
    const template = getRoomTemplate(room.type);
    const image = template && getRoomImage(template.imageKey || template.type);
    const backup = template && ROOM_IMAGE_BACKUP_MAP[template.imageKey || template.type];
    const previousImages = {
        "Portal Chamber": ["https://iili.io/qFVGWL7.jpg"],
        "Lift Shaft": ["https://iili.io/qFXxz6N.jpg", "https://iili.io/nOGrjvp.jpg"],
        "Guildhall": ["https://iili.io/qFVGWL7.jpg"],
        "Training Yard": ["https://iili.io/qFVGWL7.jpg"],
        "Guildmaster's Office": ["https://iili.io/qFXfr9j.jpg"]
    };
    if (image && (!room.image || room.image === backup || (previousImages[room.type] || []).includes(room.image))) {
        room.image = image;
    }
    return room.image || null;
}

// ── HELPER: BUILD ROOM INSTANCE ──────────────────────────────────

// Shop name generator: zone imagery plus a sign suited to the business.
const SHOP_NAME_ZONE_WORDS = {
    "town": { adjectives: ["Copper", "Golden", "Quiet", "Crooked", "Silver", "Amber", "Wayward", "Merry"], nouns: ["Fox", "Lantern", "Oak", "Stag", "Bell", "Sparrow", "Hearth", "Crown"] },
    "underground city": { adjectives: ["Deep", "Iron", "Ember", "Runed", "Stone", "Obsidian", "Copper", "Basalt"], nouns: ["Anvil", "Rune", "Flint", "Hollow", "Crag", "Lantern", "Cavern", "Garnet"] },
    "dungeon": { adjectives: ["Ashen", "Hidden", "Sooted", "Iron", "Guttering", "Forgotten", "Black", "Silent"], nouns: ["Key", "Lantern", "Gate", "Chain", "Vault", "Raven", "Flint", "Torch"] },
    "swamp": { adjectives: ["Reed", "Mossy", "Willow", "Mistbound", "Green", "Sable", "Fen", "Driftwood"], nouns: ["Heron", "Reed", "Willow", "Frog", "Rush", "Turtle", "Lantern", "Otter"] },
    "ruins": { adjectives: ["Ashen", "Weathered", "Lost", "Broken", "Faded", "Old", "Dusty", "Fallen"], nouns: ["Crown", "Arch", "Tower", "Relic", "Raven", "Bell", "Laurel", "Keystone"] }
};
const SHOP_NAME_TRADES = {
    mausoleum: { words: ["Cypress", "Vigil", "Remembrance", "Repose", "Last Light", "Resting Bell"], endings: ["Mausoleum", "House of Rest", "House of Remembrance"] },
    bathhouse: { words: ["Willow", "Rosemary", "Linen", "Spring", "Lavender", "Basin"], endings: ["Baths", "Bathhouse"] },
    smithy: { words: ["Hammer", "Anvil", "Tongs", "Steel", "Spark", "Horseshoe"], endings: ["Forge", "Smithy", "Ironworks"] },
    clothier: { words: ["Needle", "Spindle", "Thread", "Thimble", "Shuttle", "Bobbin"], endings: ["Clothiers", "Tailors", "Outfitters"] },
    alchemist: { words: ["Retort", "Vial", "Mortar", "Sage", "Crucible", "Alembic"], endings: ["Apothecary", "Alchemical Supplies", "Remedies"] },
    pawnbroker: { words: ["Coin", "Ledger", "Latch", "Balance", "Trinket", "Coffer"], endings: ["Pawnbrokers", "Exchange", "Curiosities"] },
    general: { words: ["Pack", "Compass", "Wagon", "Lantern", "Satchel", "Wheel"], endings: ["General Goods", "Provisioners", "Trading House"] },
    market: { words: ["Scale", "Coin", "Caravan", "Basket", "Wagon", "Bell"], endings: ["Market", "Exchange", "Bazaar"] },
    tavern: { words: ["Flagon", "Tankard", "Stag", "Fox", "Badger", "Kettle"], endings: ["Tavern", "Alehouse", "Taproom"] },
    inn: { words: ["Hearth", "Lantern", "Pillow", "Stag", "Willow", "Wayfarer"], endings: ["Inn", "Lodge", "Rest"] }
};

const MAUSOLEUM_NAME_ZONE_WORDS = {
    "town": { adjectives: ["Quiet", "Silver", "Silent", "Pale", "Hallowed", "Still", "Ashen", "Gentle"], nouns: ["Cypress", "Bell", "Lantern", "Willow", "Rosemary", "Candle"] },
    "underground city": { adjectives: ["Deep", "Runed", "Stone", "Obsidian", "Silent", "Basalt", "Hallowed", "Still"], nouns: ["Rune", "Lantern", "Granite", "Bell", "Garnet", "Vigil"] }
};

function getShopNameTrade(shopType) {
    const type = String(shopType || "").trim().toLowerCase();
    if (/mausoleum|\btomb\b/.test(type)) return "mausoleum";
    if (/bathhouse|bathkeeper|\bspa\b/.test(type)) return "bathhouse";
    if (/smith|forge|blacksmith/.test(type)) return "smithy";
    if (/clothier|tailor|outfitter|clothing/.test(type)) return "clothier";
    if (/alchem|apothecar|herbalist/.test(type)) return "alchemist";
    if (/pawn|quiet house|curios/.test(type)) return "pawnbroker";
    if (/tavern|alehouse|taproom/.test(type)) return "tavern";
    if (/\binn\b|lodging|bunk cave/.test(type)) return "inn";
    if (/market|bazaar/.test(type)) return "market";
    if (/shop|store|stall|trader|merchant|general goods/.test(type)) return "general";
    return null;
}

function generateShopName(zoneName, shopType, rngIn, usedNames) {
    const trade = SHOP_NAME_TRADES[getShopNameTrade(shopType)];
    if (!trade) return null;
    const zoneKey = String(zoneName || "").trim().toLowerCase();
    const zone = trade === SHOP_NAME_TRADES.mausoleum ? (MAUSOLEUM_NAME_ZONE_WORDS[zoneKey] || MAUSOLEUM_NAME_ZONE_WORDS.town) : (SHOP_NAME_ZONE_WORDS[zoneKey] || SHOP_NAME_ZONE_WORDS.town);
    const rng = typeof rngIn === "function" ? rngIn : Math.random;
    const pick = function (words) { return words[Math.min(words.length - 1, Math.max(0, Math.floor(rng() * words.length)))]; };
    const used = usedNames && typeof usedNames.has === "function" && typeof usedNames.add === "function" ? usedNames : new Set(usedNames || []);
    let name;
    for (let attempt = 0; attempt < 40; attempt++) {
        const adjective = pick(zone.adjectives);
        let sign = rng() < 0.65 ? pick(trade.words) : pick(zone.nouns);
        if (sign.toLowerCase() === adjective.toLowerCase()) sign = pick(trade.words);
        name = "The " + adjective + " " + sign + " " + pick(trade.endings);
        if (!used.has(name)) { used.add(name); return name; }
    }
    let branch = 2;
    while (used.has(name + " " + branch)) branch++;
    name += " " + branch;
    used.add(name);
    return name;
}

// Former default is recognised only for one-time saved-building migration.
const LEGACY_BATHHOUSE_NAME = "The Warmstone Baths";

function applyShopDisplayName(room, shopName) {
    const template = getRoomTemplate(room.type);
    const ordinaryName = template && template.displayName || room.type;
    const oldName = room.buildingName || (getShopNameTrade(room.buildingType || room.type) === "bathhouse" ? LEGACY_BATHHOUSE_NAME : null);
    room.buildingName = shopName;
    if (!room.displayName || room.displayName === ordinaryName || room.displayName === room.type || room.displayName === oldName || room.displayName === oldName + " — " + ordinaryName || room.displayName === room.shopDisplayName) {
        const label = room.isBuildingRoom && !room.isEntrance ? shopName + " — " + ordinaryName : shopName;
        room.name = label;
        room.displayName = label;
        room.shopDisplayName = label;
    }
}

// Backfill unnamed shops once, and surface names already saved on buildings.
function ensureShopNamesForRoomMap(roomMap) {
    const groups = new Map();
    const used = new Set();
    Object.keys(roomMap || {}).forEach(function (coords) {
        const room = roomMap[coords];
        if (!room) return;
        if (room.buildingName) used.add(room.buildingName);
        if (!getShopNameTrade(room.buildingType || room.type)) return;
        const key = room.buildingId || coords;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(room);
    });
    groups.forEach(function (rooms) {
        const first = rooms[0];
        const bathhouse = getShopNameTrade(first.buildingType || first.type) === "bathhouse";
        const named = rooms.find(function (room) { return !!room.buildingName && !(bathhouse && room.buildingName === LEGACY_BATHHOUSE_NAME); });
        const name = named ? named.buildingName : generateShopName(first.zone, first.buildingType || first.type, Math.random, used);
        rooms.forEach(function (room) {
            applyShopDisplayName(room, name);
            if (bathhouse) (room.creatures || []).forEach(function (npc) { if (npc && npc.role === "Bathkeeper" && npc.shopName === LEGACY_BATHHOUSE_NAME) npc.shopName = name; });
        });
    });
}

function buildRoomInstance(roomType, zoneName) {
    const template = getRoomTemplate(roomType);
    const zone = getZoneTemplate(zoneName);

    if (!template) return null;

    const shopName = generateShopName(zoneName || template.zone, template.type);
    return {
        type: template.type,
        zone: zoneName || template.zone,
        role: template.role,
        name: shopName || template.displayName || template.type,
        displayName: shopName || template.displayName || template.type,
        buildingName: shopName,
        shopDisplayName: shopName,
        baseDescription: template.baseDescription || "",
        description: null,
        allowedZones: template.allowedZones || [],
        parentCluster: template.parentCluster || [],
        isConnector: template.isConnector || false,
        structural: (template.structural || []).map(s => ({ ...s })),
        ...(template.burialCapacity ? { burialStorage: { capacity: template.burialCapacity,
            niches: Array.from({ length: template.burialCapacity }, (_, index) => ({ number: index + 1, body: null })) } } : {}),
        creatures: [],
        items: [],
        image: getRoomImage(template.imageKey || template.type),
        exits: {}
    };
}


// ── BUILDINGS & PLANNED ZONE LAYOUTS ─────────────────────────────
// A building is no longer a loose room dropped next to whatever the random
// generator rolled. It is a small blueprint: one ENTRANCE room that faces the
// street on the main map plane, and a set of interior rooms on their own map
// plane(s), joined by hallways, stairs and doors. The only ways in or out are
// the doors the blueprint names (`front`, optionally `back`).
//
// Blueprint fields:
//   entrance  room type of the street-facing room (main plane)
//   front     key of the interior room the front door opens into (null for a
//             single-room building)
//   back      optional key of the interior room whose rear door opens onto an
//             alley behind the building
//   rooms     [{ key, type, floor, at:[x,y], chance?, anchorFor?, verticalLinks? }]
//             floor 0 is the ground interior plane, 1 is upstairs, -1 is a
//             cellar. at is local to the building; +y is toward the BACK of the
//             building (away from the street).
//   links     [[keyA, keyB, doorKind?]] - rooms on the same floor must be
//             adjacent cells; rooms on different floors are joined by an
//             Up/Down stair. doorKind: "door" | "arch" | omitted (open).
//   anchorFor / verticalLinks: zone-link ids, see ZONE_LINKS in the engine.
//
// Interiors live far from the street grid (BUILDING_PLANE_X0 and up), each
// building in its own x block and each floor in its own y band, so they can
// never touch a neighbouring street room.
const BUILDING_PLANE_X0 = 10000;
const BUILDING_PLANE_X_STRIDE = 30;
const BUILDING_FLOOR_Y_STRIDE = 60;

const BUILDING_BLUEPRINTS = {
    "Mausoleum": {
        zone: "Town", entrance: "Mausoleum", front: "gallery", frontDoor: "door", back: null, hostilityCap: 25,
        names: [],
        rooms: [
            { key: "gallery", type: "Memorial Gallery", floor: 0, at: [0, 0] },
            { key: "preparation", type: "Laying-out Room", floor: 0, at: [1, 0] },
            { key: "lodge", type: "Bearers' Lodge", floor: 0, at: [1, 1] },
            { key: "stairs0", type: "Mausoleum Stair", floor: 0, at: [0, 1] },
            { key: "stairs1", type: "Mausoleum Stair", floor: 1, at: [0, 1] },
            { key: "vault1", type: "Burial Vault", floor: 1, at: [0, 0] }
        ],
        links: [["gallery", "preparation", "door"], ["preparation", "lodge", "door"], ["gallery", "stairs0", "arch"],
            ["stairs0", "stairs1"], ["stairs1", "vault1", "door"]]
    },
    "Tavern": {
        zone: "Town",
        entrance: "Tavern",
        front: "taproom",
        back: "backdoor",
        names: ["The Gilded Flagon", "The Hollow Oak", "The Crooked Lantern", "The Rusty Anchor", "The Sleeping Stag", "The Drowned Rat"],
        rooms: [
            { key: "taproom",      type: "Taproom",       floor: 0,  at: [0, 0] },
            { key: "kitchen",      type: "Kitchen",       floor: 0,  at: [1, 0], minNpcs: 1 },
            { key: "backdoor",     type: "Back Door",     floor: 0,  at: [1, 1] },
            { key: "cellarstairs", type: "Cellar Stairs", floor: 0,  at: [0, 1] },
            { key: "cellar",       type: "Cellar",        floor: -1, at: [0, 0],
              anchorFor: ["dungeon-to-town"], verticalLinks: ["town-to-dungeon"] },
            { key: "shrine",       type: "Cellar Shrine", floor: -1, at: [1, 0] }
        ],
        // The alley side of the back door is barred; it lifts freely from inside.
        // The cellar door is often kept locked (freely opened from the stair
        // side, so a way in from the dungeon never traps anyone).
        backLock: { chance: 1, level: [2, 3] },
        links: [
            ["taproom", "kitchen", "door"],
            ["kitchen", "backdoor", "door"],
            ["taproom", "cellarstairs", "door", { chance: 0.5, level: 2 }],
            ["cellarstairs", "cellar"],
            ["cellar", "shrine", "door"]
        ]
    },
    "Bathhouse": {
        zone: "Town", entrance: "Bathhouse", front: "baths", frontDoor: "door", back: null, hostilityCap: 25,
        names: [],
        // Core rooms - bathing and massage areas
        rooms: [
            { key: "baths", type: "Bathing Room", floor: 0, at: [0, 0], minNpcs: 0 },
            { key: "massage", type: "Massage Room", floor: 0, at: [1, 0], minNpcs: 0 },
            // Placeholder for dynamic private rooms - these will be expanded based on zone species
            // The actual private rooms are created dynamically in ensureZoneBathhouse()
            { key: "private1", type: "Private Bath Chamber", floor: 0, at: [0, 1], minNpcs: 0 },
            { key: "private2", type: "Private Bath Chamber", floor: 0, at: [1, 1], minNpcs: 0 }
        ],
        links: [
            ["baths", "massage", "door"],
            ["baths", "private1", "door", { chance: 1, level: 1, keyId: "bathhouse-master-key" }],
            ["massage", "private2", "door", { chance: 1, level: 1, keyId: "bathhouse-master-key" }]
        ],
        // Dynamic expansion: private rooms will be added based on zone species count
        // Each species in the zone gets its own private room and attendant
        dynamicPrivateRooms: true
    },
    "Inn": {
        zone: "Town",
        entrance: "Inn",
        front: "common",
        back: null,
        names: ["The Wayfarer's Rest", "The Lantern & Loaf", "The Quiet Hearth", "The Traveller's Lamp", "The Weary Boot"],
        rooms: [
            { key: "common",  type: "Inn Common",       floor: 0, at: [0, 0] },
            { key: "stairs",  type: "Stairs",           floor: 0, at: [1, 0] },
            { key: "hall1",   type: "Upstairs Hallway", floor: 1, at: [1, 0] },
            { key: "hall2",   type: "Upstairs Hallway", floor: 1, at: [2, 0] },
            { key: "guest1",  type: "Guest Room",       floor: 1, at: [1, 1] },
            { key: "guest2",  type: "Guest Room",       floor: 1, at: [1, -1] },
            { key: "guest3",  type: "Guest Room",       floor: 1, at: [2, 1] },
            { key: "guest4",  type: "Guest Room",       floor: 1, at: [2, -1], chance: 0.7 },
            { key: "guest5",  type: "Guest Room",       floor: 1, at: [3, 0],  chance: 0.5 }
        ],
        links: [
            ["common", "stairs", "arch"],
            ["stairs", "hall1"],
            ["hall1", "hall2"],
            ["hall1", "guest1", "door", { chance: 1, level: 2, keyId: "room-token" }],
            ["hall1", "guest2", "door", { chance: 1, level: 2, keyId: "room-token" }],
            ["hall2", "guest3", "door", { chance: 1, level: 2, keyId: "room-token" }],
            ["hall2", "guest4", "door", { chance: 1, level: 2, keyId: "room-token" }],
            ["hall2", "guest5", "door", { chance: 1, level: 2, keyId: "room-token" }]
        ]
    },
    // The forge floor is open-fronted to the street (an archway, not a door).
    // Behind it: the storeroom (ore deliveries come in by the yard door to the
    // alley, and the cargo lift down to the Underground City is here) and the
    // smith's own quarters, which is a private room with its own door.
    "Smithy": {
        zone: "Town",
        entrance: "Smithy",
        streetDoor: "arch",
        front: "storeroom",
        frontDoor: "arch",
        back: "storeroom",
        names: ["The Cinder Anvil", "Ironhand Forge", "The Black Hammer", "Emberstone Smithy"],
        rooms: [
            { key: "storeroom", type: "Smithy Storeroom", floor: 0, at: [0, 0], minNpcs: 0,
              anchorFor: ["uc-to-town"], verticalLinks: ["town-to-uc"] },
            { key: "quarters",  type: "Smith's Quarters", floor: 0, at: [1, 0] }
        ],
        links: [
            ["storeroom", "quarters", "door", { chance: 0.6, level: 2 }]
        ],
        backLock: { chance: 1, level: 2 }
    },
    // The quiet arts: a pawnbroker's shop on the street, a counting room behind it
    // where rogues gather, a (usually locked) workroom with the alchemy table and a
    // cellar hideaway. One door onto the street. At most one per town.
    "Quiet House": {
        zone: "Town",
        entrance: "Pawnbroker",
        front: "counting",
        frontDoor: "door",
        back: null,
        names: ["The Grey Ledger", "Lamp & Latch", "The Hollow Coin", "Third Drawer Pawnbrokers", "The Quiet Door"],
        rooms: [
            { key: "counting",  type: "Counting Room",    floor: 0,  at: [0, 0] },
            { key: "workroom",  type: "Alchemy Workroom", floor: 0,  at: [1, 0] },
            { key: "hideaway",  type: "Quiet Hideaway",   floor: -1, at: [0, 0] }
        ],
        links: [
            ["counting", "workroom", "door", { chance: 0.8, level: [2, 3] }],
            ["counting", "hideaway", "door", { chance: 0.5, level: 2 }]
        ]
    },
    // An ordinary home: front room onto the street, a bedroom behind a door.
    // One door in or out. Fills out larger towns.
    "House": {
        zone: "Town",
        entrance: "Townhouse",
        front: "bedroom",
        frontDoor: "door",
        // Homes are often locked up; the bedroom door less so.
        streetLock: { chance: 0.45, level: [1, 2] },
        frontLock: { chance: 0.35, level: 2 },
        back: null,
        names: [],
        rooms: [
            { key: "bedroom", type: "Bedroom", floor: 0, at: [0, 0] }
        ],
        links: []
    },
    // Public hall at the front with the town guard; a corridor behind it leads
    // to the council chamber (the town's boss room) and the records office.
    // One door.
    "Town Hall": {
        zone: "Town",
        entrance: "Town Hall",
        front: "corridor",
        frontDoor: "door",
        back: null,
        names: [],
        rooms: [
            { key: "corridor", type: "Hall Corridor",   floor: 0, at: [0, 0] },
            { key: "chamber",  type: "Council Chamber", floor: 0, at: [0, 1] },
            { key: "records",  type: "Records Office",  floor: 0, at: [1, 0], minNpcs: 1 },
            // The Town Portal (always present; west of the corridor, open
            // archway, never locked).
            { key: "portal",   type: "Portal Chamber",  floor: 0, at: [-1, 0] }
        ],
        links: [
            ["corridor", "chamber", "door"],
            ["corridor", "records", "door", { chance: 0.7, level: 3 }],
            ["corridor", "portal", "arch"]
        ]
    },
    // The street-facing hall holds the Guildmaster and the job board; an
    // archway opens onto the training yard behind, and the Guildmaster's
    // office is a locked room off the yard. One way in.
    "Guildhall": {
        zone: "Town",
        entrance: "Guildhall",
        front: "yard",
        frontDoor: "arch",
        back: null,
        names: ["The Ironbound Guildhall", "The Company of the Open Road", "The Wayfarers' Guildhall", "The Brazen Banner Hall", "The Sellswords' Hall"],
        rooms: [
            { key: "yard",   type: "Training Yard",        floor: 0, at: [0, 0], minNpcs: 1 },
            { key: "office", type: "Guildmaster's Office", floor: 0, at: [1, 0] }
        ],
        links: [
            ["yard", "office", "door", { chance: 0.6, level: 2 }]
        ]
    },
    // A nave open to the street with a vestry behind. One door, never locked
    // (a chapel turns nobody away).
    "Chapel": {
        zone: "Town",
        entrance: "Chapel",
        front: "vestry",
        frontDoor: "door",
        back: null,
        names: ["The Chapel of the Lantern", "The Chapel of Ash and Dawn", "The Hearthward Chapel", "The Chapel of Quiet Lamps"],
        rooms: [
            { key: "vestry", type: "Vestry", floor: 0, at: [0, 0] }
        ],
        links: []
    }
};

const _DIR_DELTA = {
    N: [0, 1], S: [0, -1], E: [1, 0], W: [-1, 0],
    NE: [1, 1], NW: [-1, 1], SE: [1, -1], SW: [-1, -1]
};
const _DIR_OPP = { N: "S", S: "N", E: "W", W: "E", NE: "SW", SW: "NE", NW: "SE", SE: "NW", U: "D", D: "U" };

function _dirFromDelta(dx, dy) {
    const keys = Object.keys(_DIR_DELTA);
    for (let i = 0; i < keys.length; i++) {
        if (_DIR_DELTA[keys[i]][0] === dx && _DIR_DELTA[keys[i]][1] === dy) return keys[i];
    }
    return null;
}

function _planShuffle(list, rng) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
}

// A plan is plain data: { rooms: {coords: desc}, buildings: [...] }. The
// engine turns each desc into a real room (see buildPlannedZone there).
// desc: { coords, type, zone, exits{dir:coords}, portals{dir:true},
//         doors{dir:kind}, buildingId, buildingType, buildingName, floor,
//         isBuildingRoom, anchorFor[], verticalLinks[], guaranteedLink }
function _planAddRoom(plan, coords, type, zone, extra) {
    const desc = Object.assign({
        coords: coords, type: type, zone: zone,
        exits: {}, portals: {}, doors: {}, locks: {}
    }, extra || {});
    plan.rooms[coords] = desc;
    return desc;
}

// Joins two planned rooms. A plain adjacent link is an ordinary exit. Pass
// portal=true for links between cells that are not neighbours on the grid
// (a street door into an interior plane, a back door into an alley). doorKind
// puts a visible door (or archway) on both sides of the link.
function _planLink(plan, aCoords, bCoords, dirFromA, doorKind, portal, lock) {
    const a = plan.rooms[aCoords];
    const b = plan.rooms[bCoords];
    const back = _DIR_OPP[dirFromA];
    a.exits[dirFromA] = bCoords;
    b.exits[back] = aCoords;
    if (portal) { a.portals[dirFromA] = true; b.portals[back] = true; }
    // A lock needs a door to sit in.
    if (lock && !doorKind) doorKind = "door";
    if (doorKind) { a.doors[dirFromA] = doorKind; b.doors[back] = doorKind; }
    if (lock) {
        // Both sides share one lock. freeFrom says which side can open it
        // without a roll (lift the bar, turn the latch): "A" is aCoords' side,
        // "B" the other. Doors are always openable from the private side, so
        // nobody can be locked inside a building (or out of the way they came
        // in by stairs or lift).
        a.locks[dirFromA] = { state: "locked", level: lock.level, keyId: lock.keyId || null, freeOpen: lock.freeFrom === "A" };
        b.locks[back]     = { state: "locked", level: lock.level, keyId: lock.keyId || null, freeOpen: lock.freeFrom !== "A" };
    }
}

// Rolls a blueprint lock spec: { chance?, level: n | [lo, hi], keyId?, freeFrom? }.
// Returns null when the chance roll says this door is simply unlocked.
function _planRollLock(spec, rng, defaultFreeFrom) {
    if (!spec) return null;
    if (typeof spec.chance === "number" && rng() >= spec.chance) return null;
    let level = spec.level || 1;
    if (Array.isArray(level)) level = level[0] + Math.floor(rng() * (level[1] - level[0] + 1));
    return { level: level, keyId: spec.keyId || null, freeFrom: spec.freeFrom || defaultFreeFrom || "B" };
}

function _planBuildingInterior(plan, bpKey, index, entranceDesc, side, rng, alleyCoords) {
    const bp = BUILDING_BLUEPRINTS[bpKey];
    const buildingId = bpKey.toLowerCase().replace(/[^a-z]+/g, "-") + "-" + index;
    const usedNames = new Set(plan.buildings.map(function (building) { return building.name; }).filter(Boolean));
    const name = generateShopName(entranceDesc.zone || bp.zone, bpKey, rng, usedNames)
        || (bp.names && bp.names.length ? bp.names[Math.floor(rng() * bp.names.length)] : null);

    entranceDesc.buildingId = buildingId;
    entranceDesc.buildingType = bpKey;
    entranceDesc.buildingName = name;
    entranceDesc.isBuildingRoom = true;
    entranceDesc.isEntrance = true;
    entranceDesc.floor = 0;
    if (typeof bp.hostilityCap === "number") entranceDesc.hostilityCap = bp.hostilityCap;
    if (name && getShopNameTrade(bpKey)) applyShopDisplayName(entranceDesc, name);
    if (bp.anchorFor) entranceDesc.anchorFor = bp.anchorFor.slice();
    if (bp.verticalLinks) entranceDesc.verticalLinks = bp.verticalLinks.slice();

    const byKey = {};
    const x0 = BUILDING_PLANE_X0 + index * BUILDING_PLANE_X_STRIDE;
    (bp.rooms || []).forEach(def => {
        if (typeof def.chance === "number" && rng() >= def.chance) return;
        const coords = (x0 + def.at[0]) + "," + (def.floor * BUILDING_FLOOR_Y_STRIDE + def.at[1] * side);
        const desc = _planAddRoom(plan, coords, def.type, entranceDesc.zone || bp.zone, {
            buildingId: buildingId, buildingType: bpKey, buildingName: name,
            isBuildingRoom: true, floor: def.floor
        });
        if (name && getShopNameTrade(bpKey)) applyShopDisplayName(desc, name);
        if (typeof def.minNpcs === "number") desc.minNpcs = def.minNpcs;
        if (typeof bp.hostilityCap === "number") desc.hostilityCap = bp.hostilityCap;
        if (def.anchorFor) desc.anchorFor = def.anchorFor.slice();
        if (def.verticalLinks) desc.verticalLinks = def.verticalLinks.slice();
        byKey[def.key] = desc;
    });

    (bp.links || []).forEach(link => {
        const a = byKey[link[0]];
        const b = byKey[link[1]];
        if (!a || !b) return; // an optional room that did not roll
        const kind = link[2] || null;
        const lock = _planRollLock(link[3], rng, "B");
        if (a.floor === b.floor) {
            const pa = a.coords.split(","), pb = b.coords.split(",");
            const dir = _dirFromDelta(Number(pb[0]) - Number(pa[0]), Number(pb[1]) - Number(pa[1]));
            if (!dir) throw new Error("Blueprint " + bpKey + ": " + link[0] + " and " + link[1] + " are not adjacent");
            _planLink(plan, a.coords, b.coords, dir, kind, false, lock);
        } else {
            const upDir = b.floor > a.floor ? "U" : "D";
            _planLink(plan, a.coords, b.coords, upDir, kind, false, lock);
        }
    });

    // The front door: street-facing entrance -> interior. "Inward" is toward
    // the back of the building: north for a building on the north side of the
    // street, south for one on the south side.
    const inward = side > 0 ? "N" : "S";
    if (bp.front && byKey[bp.front]) {
        _planLink(plan, entranceDesc.coords, byKey[bp.front].coords, inward, bp.frontDoor || "door", true, _planRollLock(bp.frontLock, rng, "B"));
    }
    // The back door, if the blueprint has one: interior -> alley.
    if (bp.back && byKey[bp.back] && alleyCoords) {
        // The back door is barred from inside: the inside (A) side opens freely.
        _planLink(plan, byKey[bp.back].coords, alleyCoords, inward, "door", true, _planRollLock(bp.backLock, rng, "A"));
    }
    return { buildingId: buildingId, name: name, type: bpKey };
}

// Mirrors the street plane of a finished town plan east-west, so the Gate can
// sit at either end of the main street. Only street-plane cells move (the
// spine, Square, Gate, alleys and building entrances); interiors live on their
// own planes at x >= BUILDING_PLANE_X0 and keep their coordinates. Every exit
// target that points at a street cell is flipped, and E/W labels are swapped
// on street rooms. N/S labels (front doors, back doors, alley bends) and
// Up/Down are unchanged, so adjacency, portals and door/lock data stay valid.
function _planMirrorStreetX(plan) {
    const isStreet = function (coords) {
        return Math.abs(Number(String(coords).split(",")[0])) < BUILDING_PLANE_X0 / 2;
    };
    const flip = function (coords) {
        const p = String(coords).split(",");
        return String(-Number(p[0]) + 0) + "," + p[1];
    };
    const swap = { E: "W", W: "E", NE: "NW", NW: "NE", SE: "SW", SW: "SE" };
    const relabel = function (map) {
        const out = {};
        Object.keys(map || {}).forEach(function (dir) { out[swap[dir] || dir] = map[dir]; });
        return out;
    };
    const rooms = {};
    Object.keys(plan.rooms).forEach(function (key) {
        const desc = plan.rooms[key];
        const street = isStreet(key);
        const exits = {};
        Object.keys(desc.exits).forEach(function (dir) {
            const target = desc.exits[dir];
            const outDir = street ? (swap[dir] || dir) : dir;
            exits[outDir] = isStreet(target) ? flip(target) : target;
        });
        desc.exits = exits;
        if (street) {
            desc.portals = relabel(desc.portals);
            desc.doors = relabel(desc.doors);
            desc.locks = relabel(desc.locks);
            desc.coords = flip(key);
        }
        rooms[street ? desc.coords : key] = desc;
    });
    plan.rooms = rooms;
    plan.buildings.forEach(function (b) {
        if (b.entranceCoords) b.entranceCoords = flip(b.entranceCoords);
    });
}

// Town: a street running east-west with a Square near the middle and a Gate
// at one end (west or east, rolled), buildings facing it from the north and
// south side, and a back alley behind any building with a rear door. Closed
// at the far end - the Gate's outward exit is the only frontier (it always
// leads out to the Ruins, see ZONE_LINKS). The plan is built with the Gate to
// the west, then mirrored east-west about half the time.
function planTownLayout(rngIn) {
    const rng = typeof rngIn === "function" ? rngIn : Math.random;
    const zone = "Town";
    const plan = { zone: zone, rooms: {}, buildings: [], startByType: {} };
    const randInt = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));

    // Random size: the street runs `west` slots to the west of the Square and
    // `east` to the east, so a town has between 3 and 7 slots per side (6 to
    // 14 building plots in all, before empty ones are left as plain wall).
    const west = randInt(1, 3);
    const east = Math.max(2, randInt(1, 3)); // Space for every essential establishment, including the baths.
    const SPINE_MIN = -(2 * west + 2);
    const SPINE_MAX = 2 * east + 2;

    for (let x = SPINE_MIN; x <= SPINE_MAX; x++) {
        const type = x === SPINE_MIN ? "Gate" : x === 0 ? "Square" : Math.abs(x) === 1 ? "Avenue" : "Street";
        _planAddRoom(plan, x + ",0", type, zone, {});
    }
    for (let x = SPINE_MIN; x < SPINE_MAX; x++) {
        _planLink(plan, x + ",0", (x + 1) + ",0", "E", null, false);
    }
    // The Gate's outward (west) exit points at ground that does not exist
    // yet; walking out is what builds the road to the Ruins.
    const gate = plan.rooms[SPINE_MIN + ",0"];
    gate.exits.W = (SPINE_MIN - 1) + ",0";
    gate.guaranteedLink = "town-to-ruins";
    gate.anchorFor = ["ruins-to-town", "uc-to-town-stairs"];
    gate.verticalLinks = ["town-to-uc-stairs"];

    // Building slots: two columns apart so each has a free column beside it
    // for an alley. Town Hall takes a slot facing the Square.
    const slots = [];
    for (let x = -2 * west; x <= 2 * east; x += 2) {
        [1, -1].forEach(side => slots.push({ x: x, side: side }));
    }
    const squareSlots = slots.filter(s => s.x === 0);
    const hallSlot = squareSlots[Math.floor(rng() * squareSlots.length)];
    const rest = _planShuffle(slots.filter(s => s !== hallSlot), rng);

    const assignment = [{ type: "Town Hall", slot: hallSlot }];
    // Every town has these. The Guildhall and the Chapel are the guide's
    // lead destinations (see PLAYER_ARCHETYPES), so they are always placed.
    const MUST_HAVE = ["Tavern", "Inn", "Smithy", "Guildhall", "Chapel", "Bathhouse", "Mausoleum"];
    MUST_HAVE.forEach((type, i) => { assignment.push({ type: type, slot: rest[i] }); });
    // Every other plot is a house or stays empty. Bigger towns get a second
    // inn now and then. The Tavern (cellar shrine, way down to the dungeon),
    // the Smithy (cargo lift to the Underground City) and the Town Hall
    // (boss room) are always single, since each carries a one-per-zone
    // feature or zone link; the Guildhall and Chapel are single too.
    rest.slice(MUST_HAVE.length).forEach(slot => {
        const roll = rng();
        if (roll < 0.10) assignment.push({ type: "Inn", slot: slot });
        else if (roll < 0.70) assignment.push({ type: "House", slot: slot });
    });

    // Most towns have one Quiet House (the rogues' pawnshop). It takes over one
    // plot that would have been a house, or an empty plot. Rolled after the rest
    // so the layout above rolls exactly as before for a given rng sequence.
    if (rng() < 0.8) {
        const houses = assignment.filter(entry => entry.type === "House");
        if (houses.length) {
            houses[Math.floor(rng() * houses.length)].type = "Quiet House";
        } else {
            const used = new Set(assignment.map(entry => entry.slot));
            const free = rest.filter(slot => !used.has(slot));
            if (free.length) assignment.push({ type: "Quiet House", slot: free[Math.floor(rng() * free.length)] });
        }
    }

    assignment.forEach((entry, idx) => {
        const slot = entry.slot;
        const bp = BUILDING_BLUEPRINTS[entry.type];
        const entranceCoords = slot.x + "," + slot.side;
        const entrance = _planAddRoom(plan, entranceCoords, bp.entrance, zone, {});
        _planLink(plan, slot.x + ",0", entranceCoords, slot.side > 0 ? "N" : "S", bp.streetDoor || "door", false, _planRollLock(bp.streetLock, rng, "B"));

        let alleyCoords = null;
        if (bp.back) {
            // Alley: street -> beside the building -> behind it.
            const a1 = (slot.x + 1) + "," + slot.side;
            const a2 = (slot.x + 1) + "," + (2 * slot.side);
            const a3 = slot.x + "," + (2 * slot.side);
            _planAddRoom(plan, a1, "Alleyway", zone, {});
            _planAddRoom(plan, a2, "Alleyway", zone, {});
            _planAddRoom(plan, a3, "Alleyway", zone, {});
            _planLink(plan, (slot.x + 1) + ",0", a1, slot.side > 0 ? "N" : "S", null, false);
            _planLink(plan, a1, a2, slot.side > 0 ? "N" : "S", null, false);
            _planLink(plan, a2, a3, "W", null, false);
            alleyCoords = a3;
        }
        const info = _planBuildingInterior(plan, entry.type, idx, entrance, slot.side, rng, alleyCoords);
        info.entranceCoords = entranceCoords;
        plan.buildings.push(info);
    });

    // Gate side: drawn last so the rest of the layout rolls exactly as before
    // for a given rng sequence. Half of all towns put the Gate on the east.
    if (rng() < 0.5) _planMirrorStreetX(plan);

    // Where a new game can start, by the room type the player picked.
    Object.keys(plan.rooms).forEach(coords => {
        const type = plan.rooms[coords].type;
        if (!plan.startByType[type]) plan.startByType[type] = coords;
    });
    return plan;
}

// Registry: which zones have a planner (others still grow room by room).
// ── STARTING HUBS ────────────────────────────────────────────────
// Every non-Town zone starts a new game in a small pre-built hub (5-6 rooms)
// instead of one lone room: a few places to eat, sleep, trade and train, with
// open frontier exits that hand off to the walk generator. A hub is plain data:
//   rooms     { key: { type, at:[x,y], minNpcs? } }
//   links     [[keyA, keyB, doorKind?, lock?]]  - rooms must be grid neighbours
//   name      (per room) themed display name overriding the template's
//   zoneCast  (per room) keep the zone's own species list instead of the hub's (boss lairs)
//   frontier  [[key, dir]]                - exit toward ground that does not exist yet
//   starts    { roomType: key }           - what the new-game wizard offers
//   npcSpecies  species pool for the hub's residents (overrides the zone list)
//   hostilityCap  residents are never generated hotter than this
//   vertical  { key: [linkIds] }          - Up/Down zone links on hub rooms
// Hub rooms carry isPlannedHub (the engine keeps loops out of them) and
// zoneOrdinal = their index, so zone links still need a full-size zone first.
const ZONE_HUBS = {
    "Underground City": {
        name: "Lantern Quarter",
        npcSpecies: ["Dwarf", "Dwarf", "Human", "Human", "Dragonborn", "Kobold", "Goblin", "Catfolk", "Catfolk", "Ratfolk", "Ratfolk", "Kenku"],
        hostilityCap: 35,
        rooms: {
            gate:    { type: "Underground Gate",     at: [0, 0] },
            market:  { type: "Market Cavern",        at: [1, 0] },
            hall:    { type: "Lantern Hall",         at: [1, 1] },
            lodge:   { type: "Cavern Lodgings",      at: [1, -1] },
            hallway: { type: "Underground Hallway",  at: [2, 0], anchorFor: ["town-to-uc-stairs"] },
            forge:   { type: "Deep Forge",           at: [0, 1] },
            shrine:  { type: "Deep Well Shrine",     at: [2, 1] },
            shaft:   { type: "Mine Shaft",           at: [3, 0], name: "Old Ore Shaft" },
            vault:   { type: "Vault",                at: [3, -1], name: "Clan Treasury" },
            chief:   { type: "Chieftain's Hall",     at: [3, 1], zoneCast: true }
        },
        links: [["gate", "market", "arch"], ["market", "hall", "arch"], ["market", "lodge", "door"], ["market", "hallway"], ["gate", "forge"], ["forge", "hall"],
                ["hall", "shrine", "arch"], ["hallway", "shrine"], ["hallway", "shaft"], ["shaft", "vault", "door", { level: 1, freeFrom: "B" }], ["shaft", "chief", "door", { level: 2, freeFrom: "B" }]],
        frontier: [["gate", "W"], ["shaft", "E"], ["lodge", "S"]],
        vertical: { gate: ["uc-to-town"], hallway: ["uc-to-town-stairs"] },
        starts: { "Underground Gate": "gate", "Lantern Hall": "hall", "Market Cavern": "market" }
    },
    "Dungeon": {
        name: "The Warrens",
        npcSpecies: ["Goblin", "Goblin", "Orc", "Orc", "Kobold", "Lizardfolk"],
        hostilityCap: null,
        rooms: {
            mouth:  { type: "Warren Mouth",  at: [0, 0] },
            fire:   { type: "Fire Hall",     at: [1, 0] },
            bunk:   { type: "Bunk Cave",     at: [1, 1] },
            pit:    { type: "Fighting Pit",  at: [2, 0] },
            stores: { type: "Scrap Stores",  at: [1, -1] },
            armory: { type: "Armory",        at: [2, 1], name: "Warband Arms Store" },
            shrine: { type: "Buried Shrine", at: [2, -1] },
            throne: { type: "Throne Room",   at: [3, 0], zoneCast: true, name: "The Warlord's Seat" }
        },
        links: [["mouth", "fire"], ["fire", "bunk"], ["fire", "pit"], ["fire", "stores"],
                ["bunk", "armory", "door"], ["pit", "armory"], ["stores", "shrine", "arch"], ["pit", "throne", "door", { level: 2, freeFrom: "B" }]],
        frontier: [["mouth", "W"], ["armory", "N"], ["bunk", "N"], ["stores", "S"], ["shrine", "S"]],
        starts: { "Warren Mouth": "mouth", "Fire Hall": "fire", "Bunk Cave": "bunk" }
    },
    "Swamp": {
        name: "Stilt Village",
        npcSpecies: ["Lizardfolk", "Lizardfolk", "Kobold"],
        hostilityCap: null,
        rooms: {
            walk:    { type: "Boardwalk",         at: [0, 0] },
            hall:    { type: "Stilt Hall",        at: [1, 0] },
            huts:    { type: "Reed Huts",         at: [1, 1] },
            landing: { type: "Hunters' Landing",  at: [1, -1] },
            chapel:  { type: "Sunken Chapel",     at: [2, 0] },
            ruin:    { type: "Submerged Ruin",    at: [2, -1], name: "Drowned Stone House" },
            lair:    { type: "Witch's Lair",      at: [2, 1], zoneCast: true }
        },
        links: [["walk", "hall"], ["hall", "huts"], ["hall", "landing"], ["hall", "chapel"],
                ["landing", "ruin"], ["chapel", "ruin"], ["chapel", "lair", "door", { level: 2, freeFrom: "B" }]],
        frontier: [["walk", "W"], ["chapel", "E"], ["huts", "N"], ["landing", "S"], ["ruin", "E"]],
        starts: { "Boardwalk": "walk", "Stilt Hall": "hall", "Reed Huts": "huts" }
    },
    "Ruins": {
        name: "Pilgrims' Camp",
        npcSpecies: ["Human", "Human", "Dwarf", "Halfling", "Elf", "Wolfkin", "Harefolk", "Harefolk", "Kenku"],
        hostilityCap: 40,
        rooms: {
            fire:   { type: "Camp Fire Ring",     at: [0, 0] },
            stall:  { type: "Scavenger's Stall",  at: [1, 0] },
            watch:  { type: "Watch Post",         at: [0, 1] },
            chapel: { type: "Lean-to Chapel",     at: [1, 1] },
            cellar: { type: "Collapsed Cellar",   at: [0, -1] },
            library: { type: "Library",           at: [2, 0], name: "Burnt Archive" },
            tower:  { type: "Tower",              at: [2, 1], name: "Broken Watchtower" },
            sanctum: { type: "Inner Sanctum",     at: [3, 0], zoneCast: true, name: "The Regent's Sanctum" }
        },
        links: [["fire", "stall"], ["fire", "watch"], ["watch", "chapel"], ["stall", "chapel"], ["fire", "cellar", "arch"],
                ["stall", "library", "arch"], ["chapel", "tower"], ["library", "tower"], ["library", "sanctum", "door", { level: 2, freeFrom: "B" }]],
        frontier: [["fire", "W"], ["tower", "N"], ["chapel", "N"], ["cellar", "S"], ["library", "S"]],
        starts: { "Camp Fire Ring": "fire", "Collapsed Cellar": "cellar", "Watch Post": "watch" }
    }
};

// Wizard helper: the start rooms a zone offers, [{ value, label }]. Town is
// the planned town (Tavern / Inn / Square); every other zone reads its hub.
function getZoneStartOptions(zoneName) {
    if (zoneName === "Town") {
        return [{ value: "Tavern", label: "Tavern" }, { value: "Inn", label: "Inn" }, { value: "Square", label: "Town Square" }];
    }
    const hub = ZONE_HUBS[zoneName];
    if (!hub) return [];
    return Object.keys(hub.starts).map(function (type) {
        const tpl = getRoomTemplate(type);
        const key = hub.starts[type];
        const own = hub.rooms[key] && hub.rooms[key].name;
        return { value: type, label: own || (tpl && tpl.displayName ? tpl.displayName : type) };
    });
}

function _planHubLayout(zoneName) {
    const spec = ZONE_HUBS[zoneName];
    const plan = { zone: zoneName, rooms: {}, buildings: [], startByType: {}, hubName: spec.name, defaultStart: null };
    const keyCoords = {};
    const keys = Object.keys(spec.rooms);
    keys.forEach(function (key, idx) {
        const r = spec.rooms[key];
        const coords = r.at[0] + "," + r.at[1];
        keyCoords[key] = coords;
        const extra = { isPlannedHub: true, zoneOrdinal: idx };
        // name: a themed display name for this hub (a dungeon armory is not
        // "the Armory", a ruined library is a burnt archive).
        if (r.name) { extra.displayName = r.name; extra.name = r.name; }
        if (r.anchorFor) extra.anchorFor = r.anchorFor.slice();
        // zoneCast rooms (the boss lairs) keep the zone's own species list.
        if (!r.zoneCast) {
            extra.npcSpecies = spec.npcSpecies.slice();
            if (typeof spec.hostilityCap === "number") extra.hostilityCap = spec.hostilityCap;
        }
        if (spec.vertical && spec.vertical[key]) extra.verticalLinks = spec.vertical[key].slice();
        _planAddRoom(plan, coords, r.type, zoneName, extra);
    });
    spec.links.forEach(function (l) {
        const a = spec.rooms[l[0]], b = spec.rooms[l[1]];
        const dir = _dirFromDelta(b.at[0] - a.at[0], b.at[1] - a.at[1]);
        if (!dir) return;
        // l[3] = { level, freeFrom } locks the door; freeFrom "B" means the far
        // room (l[1]) side opens it without a roll, so a lair locks from outside.
        _planLink(plan, keyCoords[l[0]], keyCoords[l[1]], dir, l[2] || null, false, l[3] || null);
    });
    spec.frontier.forEach(function (f) {
        const room = plan.rooms[keyCoords[f[0]]];
        const delta = _DIR_DELTA[f[1]];
        const base = spec.rooms[f[0]].at;
        if (!room || !delta || room.exits[f[1]]) return;
        room.exits[f[1]] = (base[0] + delta[0]) + "," + (base[1] + delta[1]);
    });
    Object.keys(spec.starts).forEach(function (type) { plan.startByType[type] = keyCoords[spec.starts[type]]; });
    if (zoneName === "Underground City") {
        const entrance = _planAddRoom(plan, "1,2", "Mausoleum", zoneName, {});
        _planLink(plan, keyCoords.hall, entrance.coords, "N", "door", false);
        plan.buildings.push(_planBuildingInterior(plan, "Mausoleum", 0, entrance, 1, Math.random, null));
    }
    plan.defaultStart = plan.startByType[Object.keys(spec.starts)[0]];
    return plan;
}

// Pure expansion plan: a new landing and a fifty-niche vault above the tower.
// The engine installs this plan automatically when the last free niche fills.
function planMausoleumExpansion(roomMap, buildingId) {
    const rooms = Object.values(roomMap || {}).filter(r => r && r.buildingType === "Mausoleum" && r.buildingId === buildingId);
    const top = rooms.filter(r => r.type === "Mausoleum Stair").sort((a, b) => b.floor - a.floor)[0];
    if (!top || !Number.isInteger(top.floor) || top.exits.U) return null;
    const floor = top.floor + 1, at = top.coords.split(",").map(Number);
    const side = Math.sign(at[1] - top.floor * BUILDING_FLOOR_Y_STRIDE);
    if (!side || !at.every(Number.isFinite)) return null;
    const stairCoords = at[0] + "," + (floor * BUILDING_FLOOR_Y_STRIDE + side);
    const vaultCoords = at[0] + "," + (floor * BUILDING_FLOOR_Y_STRIDE);
    const reserved = new Set(Object.values(roomMap).filter(Boolean).flatMap(r => Object.values(r.exits || {})));
    if ([stairCoords, vaultCoords].some(key => roomMap[key] || reserved.has(key))) return null;
    const plan = { zone: top.zone, rooms: {}, buildings: [] };
    const extra = { buildingId, buildingType: "Mausoleum", buildingName: top.buildingName, isBuildingRoom: true, floor, hostilityCap: 25 };
    const stair = _planAddRoom(plan, stairCoords, "Mausoleum Stair", top.zone, extra);
    const vault = _planAddRoom(plan, vaultCoords, "Burial Vault", top.zone, extra);
    [stair, vault].forEach(r => applyShopDisplayName(r, top.buildingName));
    const previous = _planAddRoom(plan, top.coords, top.type, top.zone, {});
    _planLink(plan, previous.coords, stairCoords, "U", null, false);
    _planLink(plan, stairCoords, vaultCoords, side > 0 ? "S" : "N", "door", false);
    delete plan.rooms[top.coords];
    plan.connection = { from: top.coords, direction: "U", to: stairCoords };
    return plan;
}

const ZONE_PLANNERS = {
    "Town": planTownLayout,
    "Underground City": function () { return _planHubLayout("Underground City"); },
    "Dungeon": function () { return _planHubLayout("Dungeon"); },
    "Swamp": function () { return _planHubLayout("Swamp"); },
    "Ruins": function () { return _planHubLayout("Ruins"); }
};

// ── WORLD LORE ("world bible") ───────────────────────────────────
// One shared history the NPCs draw on, so rumors, topics and replies point
// at the same real people, places and events instead of being improvised.
//
// BACKBONE (fixed): the Long War between the Crown of Aldermere and the Free
// Banners. The capital, Aldermere, is the Ruins. Town is what survives. The
// Dungeon and the Underground City are where people went to be out of it; the
// Swamp is just habitat that swallowed some of the war's wreckage. Both sides
// have faded into remnants: the Ashen Court (Crown loyalists) and the
// Tattered Banners (unpaid sellswords). Neither is a hero faction, and the
// player can drift toward either (see getWorldStanding / shiftWorldStanding).
//
// SEEDED DETAILS (varied per new game, stored in G.worldLore.seed): a few
// "who really did it" questions are answered once, and fact text reads the
// answers, so the history is concrete but not identical every run.
//
// FACT SHAPE (WORLD_LORE_FACTS):
//   id        unique key
//   tiers     who can know it: common | local | trade | military | faith |
//             scholar | deep | swamp | secret  (see getNPCLoreTiers in
//             cyoaftw-npc-data.js; NPCs know the tiers their role/species allow)
//   zones     zones the fact is about (distance from the NPC's zone lowers
//             how likely they are to know it; "common" ignores distance)
//   topic     short phrase for the menu: "Ask about <topic>"
//   text      what is true (string or function(seed))
//   distorted optional garbled version told by hearsay-only NPCs
//   know      0-100 base chance an eligible NPC actually knows it
//   rumor     true = also offered by "Ask for a rumor"

const WORLD_LORE_SEED_OPTIONS = {
    burner: ["crown", "banners", "unknown"],       // who burned Aldermere
    damBreaker: ["crown", "banners"],              // who broke the Greywater dam
    ending: ["plague", "ruin", "truce"],           // why the war stopped
    regentFate: ["entombed", "fled", "fell"],      // what became of the Regent
    townOrigin: ["crown", "banners"]               // what the town grew from
};

const WORLD_LORE_SIDES = {
    crown: { name: "the Crown", full: "the Crown of Aldermere", short: "Crown" },
    banners: { name: "the Free Banners", full: "the Free Banners", short: "Banners" }
};

function _wlSide(seed, key) {
    return WORLD_LORE_SIDES[seed[key]] || null;
}
function _wlOther(side) {
    return side === "crown" ? "banners" : "crown";
}

const WORLD_LORE_FACTS = [
    // ── common: what everyone has heard ──────────────────────────
    {
        id: "war-basics", tiers: ["common"], zones: ["Town", "Ruins"], know: 95, rumor: false,
        topic: "the Long War",
        text: "Eleven winters ago the Crown of Aldermere and the Free Banners went to war over the Crown's grain levy. It ruined both sides, and most of the land with them.",
        distorted: "The Long War was over some king's grain tax, and it went on for as long as anyone can remember."
    },
    {
        id: "aldermere-fell", tiers: ["common"], zones: ["Ruins"], know: 90, rumor: true,
        topic: "what happened to Aldermere",
        text: function (s) {
            if (s.burner === "crown") return "Aldermere, the old capital, burned in the last winter of the war. The Crown set the fires itself rather than hand the city to the Free Banners.";
            if (s.burner === "banners") return "Aldermere, the old capital, was sacked and burned by the Free Banners in the last winter of the war.";
            return "Aldermere, the old capital, burned in the last winter of the war. Each side blames the other, and nobody living can say who lit it.";
        },
        distorted: "Aldermere burned, and folk say its ghosts still walk the streets."
    },
    {
        id: "town-survives", tiers: ["common", "local"], zones: ["Town"], know: 85, rumor: false,
        topic: "how the town survived",
        text: function (s) {
            return s.townOrigin === "crown"
                ? "The town began as a Crown grain depot. It outlived the war by feeding both armies when it suited it, and by looking too poor to be worth burning."
                : "The town began as a Free Banner muster camp. It outlived the war by feeding both armies when it suited it, and by looking too poor to be worth burning.";
        }
    },
    {
        id: "ruins-haunted", tiers: ["common"], zones: ["Ruins"], know: 80, rumor: true,
        topic: "the old capital",
        text: "Folk avoid the ruins of Aldermere after dark. Soldiers who never left their posts are said to still keep them, and scavengers who go in do not always come back.",
        distorted: "Something in the old capital eats anyone who goes in after dark."
    },
    {
        id: "ashen-court", tiers: ["common", "military"], zones: ["Dungeon", "Ruins"], know: 60, rumor: true,
        topic: "the Ashen Court",
        text: "The Ashen Court is what is left of the Crown: loyalists who swear the war was never lost and keep a pretender's court somewhere below the town. Few have seen it, and fewer laugh at it.",
        distorted: "A dead king holds court under the town, and his courtiers take the living."
    },
    {
        id: "tattered-banners", tiers: ["common", "military", "trade"], zones: ["Dungeon", "Underground City"], know: 65, rumor: true,
        topic: "the Tattered Banners",
        text: "The Tattered Banners are Free Banner sellswords the new peace never paid. They now sell their swords to anyone, charge tolls on the lower roads, and are loyal to nobody.",
        distorted: "Bandits wearing old rebel colors hold the lower roads and rob anyone who passes."
    },
    {
        id: "plague-winter", tiers: ["common"], zones: ["Town"], know: 70, rumor: false,
        topic: "how the war ended",
        text: function (s) {
            if (s.ending === "plague") return "The war ended because a plague winter killed more soldiers than any battle. Both armies simply stopped marching, and nobody signed a peace.";
            if (s.ending === "ruin") return "The war ended because both treasuries ran dry. After the fight at the Greywater Ford neither side could pay for another season.";
            return "The war ended in a truce at the Greywater Ford. Both sides swore to it and neither honored it. They just ran out of strength to break it.";
        },
        distorted: "The war ended when the gods grew tired of it and sent a winter to end it."
    },
    {
        id: "closed-gates", tiers: ["common", "deep"], zones: ["Underground City"], know: 70, rumor: true,
        topic: "the Closed Gates",
        text: "Dwarves and others who wanted no part of the war went below and shut the gates behind them. The Underground City still lets in anyone who leaves their sworn side at the gate and swears no banner while inside.",
        distorted: "The dwarves below sealed the gates and will not open them for anyone, not even for gold."
    },
    // ── local: Town gossip ────────────────────────────────────────
    {
        id: "town-watch", tiers: ["local", "military"], zones: ["Town"], know: 65, rumor: true,
        topic: "the town watch",
        text: "The town watch answers to the Town Hall, not to either old side. They are paid in grain and goodwill, and they are told to keep the road to the ruins quiet.",
        distorted: "The watch is bought, and by whoever pays more than the Town Hall."
    },
    {
        id: "ruins-scavengers", tiers: ["local", "trade"], zones: ["Town", "Ruins"], know: 75, rumor: true,
        topic: "scavengers in the ruins",
        text: "Scavengers sell what they find in Aldermere to the town's merchants: coins, old arms, and the odd Crown seal. The smart ones stay out of the Throne District.",
        distorted: "A scavenger found a hoard of Crown gold in the ruins and was never seen again."
    },
    {
        id: "tavern-talk", tiers: ["local", "trade"], zones: ["Town"], know: 70, rumor: true,
        topic: "who drinks here",
        text: "Old soldiers from both sides drink in the same taverns now. They keep to separate corners and the fights are mostly polite, but nobody has yet agreed on whose war it was."
    },
    {
        id: "grain-road", tiers: ["trade", "local"], zones: ["Town", "Swamp"], know: 60, rumor: true,
        topic: "the grain road",
        text: "The old grain road through the Swamp is the town's cheapest trade route, and the one the Tattered Banners prey on most. Merchants pay for guards or take the long way."
    },
    // ── trade: prices, supply, who pays ───────────────────────────
    {
        id: "war-surplus", tiers: ["trade", "military"], zones: ["Town", "Dungeon"], know: 65, rumor: false,
        topic: "war surplus",
        text: "Swords, shields and mail from the war still turn up in the market. A good share comes from caches in the lower works that nobody has ever fully counted."
    },
    {
        id: "ore-prices", tiers: ["trade", "deep"], zones: ["Underground City", "Town"], know: 60, rumor: false,
        topic: "ore and iron prices",
        text: "Iron has been dear ever since the dwarves stopped selling openly. The Underground City sells through go-betweens now, and the Tattered Banners tax every cart that comes up."
    },
    // ── military: soldiers, guards, sellswords ────────────────────
    {
        id: "greywater-ford", tiers: ["military", "swamp"], zones: ["Swamp"], know: 60, rumor: true,
        topic: "the Greywater Ford",
        text: function (s) {
            const who = s.damBreaker === "crown" ? "the Crown" : "the Free Banners";
            const target = s.damBreaker === "crown" ? "the Free Banner column" : "the Crown relief column";
            return "The Greywater Ford was where the war broke. " + who + " broke the dam upstream to drown " + target + ", and the flood buried the ford, the dead and half the old road under what is now the swamp.";
        },
        distorted: "A whole army drowned in the swamp when the river flooded, and you can still hear the drums."
    },
    {
        id: "oathbound-dead", tiers: ["military", "faith"], zones: ["Ruins"], know: 45, rumor: false,
        topic: "the oathbound dead",
        text: "The skeletons in Aldermere are Crownguard who swore to hold the palace and were never released from the oath. They do not hunt the living. They hold their posts and strike whoever comes near.",
        distorted: "The dead of Aldermere hunt anyone who enters the city."
    },
    {
        id: "dungeon-assize", tiers: ["military", "scholar", "local"], zones: ["Dungeon", "Town"], know: 40, rumor: false,
        topic: "the cellars below the town",
        text: "The dungeon under the town was the Crown's assize cellar and prison. After the war deserters, debtors and every sort of person who did not wish to be found moved into it. The goblins, kobolds and rats came later."
    },
    {
        id: "sellsword-debt", tiers: ["military"], zones: ["Dungeon", "Underground City"], know: 45, rumor: false,
        topic: "unpaid soldiers",
        text: "The Free Banners promised their sellswords a share of the Aldermere treasury. It was burned, or looted, or never existed, and eleven winters on they are still waiting for the pay.",
        distorted: "The rebels hid the Aldermere treasury and will kill anyone who looks for it."
    },
    // ── deep: miners, dwarves, smiths ─────────────────────────────
    {
        id: "mine-works", tiers: ["deep"], zones: ["Underground City", "Dungeon"], know: 70, rumor: true,
        topic: "the old mine works",
        text: "The mines under the town were the Crown's, worked to make arms for the war. The galleries still hold good ore and old collapses, and the lift down to the deep forge is older than the Underground City itself."
    },
    {
        id: "deep-forge", tiers: ["deep", "trade"], zones: ["Underground City"], know: 50, rumor: false,
        topic: "the deep forge",
        text: "The deep forge made the Crown's best blades. The Underground City's smiths keep it lit and decline commissions from either old side, which is why a Crown-forged blade fetches such a price."
    },
    {
        id: "gate-oath", tiers: ["deep", "scholar"], zones: ["Underground City"], know: 55, rumor: false,
        topic: "the gate oath",
        text: "Whoever enters the Closed Gates must set down their banner, their rank and their quarrel at the threshold. Several Free Banner captains and Crown officers live there under plain names, and everyone below pretends not to notice."
    },
    // ── swamp ─────────────────────────────────────────────────────
    {
        id: "swamp-wreck", tiers: ["swamp", "local"], zones: ["Swamp"], know: 65, rumor: true,
        topic: "what the swamp swallowed",
        text: "The swamp is mostly the flooded valley of the Greywater. Wagons, banners, bones and armor are still being found in the mud, and the swamp folk claim whatever the water gives up."
    },
    {
        id: "swamp-neutral", tiers: ["swamp"], zones: ["Swamp"], know: 60, rumor: false,
        topic: "the swamp folk and the war",
        text: "The swamp folk want no side. The flood did not ask them either, and they take payment from whichever side comes first with something worth having, and remember who kept their word."
    },
    // ── faith ─────────────────────────────────────────────────────
    {
        id: "shrines-both-sides", tiers: ["faith", "scholar"], zones: ["Town", "Ruins", "Dungeon"], know: 55, rumor: false,
        topic: "the old shrines",
        text: "Both sides kept the same shrines and prayed to the same old gods for victory. The shrines that survived are neutral ground by custom, and nobody has drawn a weapon in one since the war."
    },
    {
        id: "dead-gods-silent", tiers: ["faith"], zones: ["Ruins", "Town"], know: 40, rumor: false,
        topic: "the silence of the gods",
        text: "Priests on both sides prayed for victory and neither received an answer. Some call that the real reason the war ended, and prefer not to say so in front of the faithful."
    },
    // ── scholar ───────────────────────────────────────────────────
    {
        id: "grain-levy", tiers: ["scholar"], zones: ["Ruins", "Town"], know: 50, rumor: false,
        topic: "why the war began",
        text: "The war started over the grain levy, but the records in Aldermere show the Crown had been emptying the granaries to pay its debts for years. The Free Banners were not wrong about the cause. They were wrong about the cure."
    },
    {
        id: "ruins-archive", tiers: ["scholar"], zones: ["Ruins"], know: 40, rumor: false,
        topic: "the lost archive",
        text: "Aldermere's archive was only half burned. What survived the fire lies in the deeper rooms of the ruins, and both sides would pay well for the ledgers that show who ordered what."
    },
    // ── doors, locks and trespass ─────────────────────────────────
    {
        id: "locked-doors", tiers: ["common", "local", "trade"], zones: ["Town"], know: 75, rumor: false,
        topic: "locked doors in town",
        text: "People here lock what is theirs. Guest rooms at the inn open to a room token from the innkeeper, a barred back door lifts from the inside only, and a house with its shutters closed is not an invitation. Anyone can knock. Picking a lock in front of witnesses ends badly, and walking into someone's room uninvited ends worse.",
        distorted: "Every door in town is locked at night, and the guards will take you in for even trying one."
    },
    // ── secret ────────────────────────────────────────────────────
    {
        id: "regent-fate", tiers: ["secret", "military", "scholar"], zones: ["Dungeon", "Underground City", "Ruins"], know: 35, rumor: false,
        topic: "what became of the Regent",
        text: function (s) {
            if (s.regentFate === "entombed") return "The Regent never left the war. The Ashen Court sealed the body in the throne hall beneath the town and still guards it, and the Court's authority rests on the claim that the Regent is only sleeping.";
            if (s.regentFate === "fled") return "The Regent escaped Aldermere and lives in the Underground City under a plain name. The Ashen Court does not know, and some who do would sooner it stayed so.";
            return "The Regent died at the Greywater Ford and the body was never recovered. The Ashen Court's loyalty rests on a missing corpse, and everyone who knows that keeps quiet.";
        },
        distorted: "The Regent is alive, and the Crown will rise again."
    },
    {
        id: "treasury-truth", tiers: ["secret", "military"], zones: ["Ruins", "Dungeon"], know: 30, rumor: false,
        topic: "the Aldermere treasury",
        text: function (s) {
            return s.burner === "banners"
                ? "The treasury was real, and the Free Banners looted it before they burned the city. The captains kept it. The rank and file got nothing, which is why the Tattered Banners still hold a grudge against their own officers."
                : "There was little left of the treasury. The Crown had spent it on the war long before the fires, and the sellswords' pay was gone before the last winter.";
        },
        distorted: "A fortune in Crown gold is buried under Aldermere, and the ghosts guard it."
    },
    // ── nature & flora: moonblooms and nectar ────────────────────
    {
        id: "moonbloom-nature", tiers: ["local", "trade", "swamp"], zones: ["Swamp", "Underground City"], know: 70, rumor: false,
        topic: "moonbloom flowers",
        text: "Moonblooms are pale, luminous flowers that grow in damp caverns and swamp edges. They glow faintly in darkness and produce a sweet nectar that collecting creatures and careful gatherers harvest at dawn.",
        distorted: "There are flowers in the swamp that shine like captured moonlight and make a sweet liquid that drives animals mad with desire."
    },
    {
        id: "nectar-harvest", tiers: ["trade", "swamp", "scholar"], zones: ["Swamp", "Underground City", "Town"], know: 55, rumor: false,
        topic: "harvesting moonbloom nectar",
        text: "Moonbloom nectar is carefully collected from the flowers at dawn using small glass vials. The nectar droplets form overnight and are most potent just before sunrise. One moonbloom produces only a few drops, making pure nectar rare and valuable.",
        distorted: "Moonbloom nectar is harvested by bleeding the flowers with silver knives under a full moon."
    },
    {
        id: "nectar-uses", tiers: ["common", "trade"], zones: ["Town", "Swamp", "Underground City"], know: 80, rumor: false,
        topic: "uses for moonbloom nectar",
        text: "Moonbloom nectar is prized by bakers for its intense floral sweetness and subtle glow. A few drops can flavor an entire batch of pastries. Alchemists use it as a base for potions requiring purity, and some claim it has mild restorative properties.",
        distorted: "Moonbloom nectar is a powerful aphrodisiac and people have died for trying to hoard it."
    },
    {
        id: "slimes-and-nectar", tiers: ["common", "swamp", "scholar"], zones: ["Dungeon", "Swamp", "Underground City"], know: 75, rumor: true,
        topic: "why slimes love nectar",
        text: "Slimes are instinctively drawn to moonbloom nectar. When they consume it, their gelatinous bodies absorb the liquid completely and emit a faint glow. Nectar makes slimes move faster and become more cohesive. Some dungeon delvers use nectar vials as bait to lure slimes away from valuable treasure.",
        distorted: "Slimes go mad for nectar. It makes them grow huge and aggressive, so only fools carry it in slime territory."
    }
];

// ── SEEDED STATE (G.worldLore) ───────────────────────────────────
// { seed: {...}, heard: { factId: true }, standing: { crown: 0, banners: 0 } }
// Created lazily on first use and saved with the game; reset when a new
// adventure starts (updateStoryOnAdventureStart in the engine).

// ── PLACE LORE (building names) ──────────────────────────────────
// Every named building of a planned town becomes a few lore facts NPCs can
// share: where it is, what it does, and, for those who know, what is hidden
// in it. Built fresh from the room map on each lookup (so it always matches
// the town that actually exists, and nothing needs saving).
// Fact shape is the same as WORLD_LORE_FACTS plus `buildingId`: an NPC
// standing in that building knows its facts firsthand (see
// getNPCKnownLoreFacts in cyoaftw-npc-data.js).
function _placeWhere(entrance) {
    const rooms = typeof G !== "undefined" && G && G.roomMap ? G.roomMap : {};
    const parts = String(entrance.coords || "0,0").split(",").map(Number);
    const x = parts[0], y = parts[1];
    let gateX = null;
    Object.keys(rooms).forEach(function (key) {
        const r = rooms[key];
        if (r && r.type === "Gate" && r.zone === "Town") gateX = Number(key.split(",")[0]);
    });
    const side = y > 0 ? "north" : "south";
    let where;
    if (x === 0) where = "facing the Square on the " + side + " side of the main street";
    else if (gateX !== null && Math.abs(x - gateX) <= 3) where = "on the " + side + " side of the street, near the Gate";
    else where = "on the " + side + " side of the main street, " + (x < 0 ? "west" : "east") + " of the Square";
    return where;
}

function getPlaceLoreFacts() {
    const out = [];
    const rooms = typeof G !== "undefined" && G && G.roomMap ? G.roomMap : null;
    if (!rooms) return out;
    Object.keys(rooms).forEach(function (key) {
        const r = rooms[key];
        if (!r || !r.isEntrance || !r.buildingId || r.zone !== "Town") return;
        const id = r.buildingId;
        const type = r.buildingType;
        const name = r.buildingName || (type === "Town Hall" ? "the Town Hall" : null);
        if (!name) return;
        const where = _placeWhere(r);
        const base = { buildingId: id, zones: ["Town"] };

        if (type === "Tavern") {
            out.push(Object.assign({}, base, {
                id: "place-" + id, tiers: ["local", "trade"], know: 85, rumor: true, topic: name,
                text: name + " is the town's tavern, " + where + ". The taproom is its busy heart, the kitchen runs behind it, and deliveries come in by a barred back door onto the alley. The cellar below is older than the rest of the building.",
                distorted: name + " is where the town drinks, and the cellar is said to go down further than any cellar should."
            }));
            out.push(Object.assign({}, base, {
                id: "place-" + id + "-secret", tiers: ["secret", "deep"], know: 60, rumor: false, topic: "what lies beneath " + name,
                text: "Past " + name + "'s cellar a hidden hollow holds a small shrine someone keeps tidy, and behind a loose panel in the cellar wall worn stone steps lead down into the old works under the town.",
                distorted: "Folk say there is a way down from " + name + "'s cellar, and that something answers if you knock on the right stone."
            }));
        } else if (type === "Inn") {
            out.push(Object.assign({}, base, {
                id: "place-" + id, tiers: ["local", "trade"], know: 85, rumor: true, topic: name,
                text: name + " is an inn, " + where + ". The common room is downstairs and the guest rooms are upstairs, each behind its own door. The innkeeper sells a room token that opens one for the night. A room with someone already in it stays shut.",
                distorted: name + " is where travellers sleep, if the innkeeper likes the look of you."
            }));
        } else if (type === "Smithy") {
            out.push(Object.assign({}, base, {
                id: "place-" + id, tiers: ["local", "trade", "deep"], know: 80, rumor: true, topic: name,
                text: name + " is the town's forge, " + where + ". The smith works the open front, ore and ingots are stored behind it, and the yard door onto the alley is where deliveries come in.",
                distorted: name + " is where the town's blades come from, and the smith asks no questions."
            }));
            out.push(Object.assign({}, base, {
                id: "place-" + id + "-lift", tiers: ["deep", "trade"], zones: ["Town", "Underground City"], know: 55, rumor: true, topic: "the lift behind " + name,
                text: "In the storeroom behind " + name + " stands a dwarven cargo lift on thick chains. It is how ore comes up from the Underground City and steel goes down, and the dwarves below know its schedule better than the smith does.",
                distorted: "There is a way under the town through the smithy, and only dwarves are let use it."
            }));
        } else if (type === "Town Hall") {
            out.push(Object.assign({}, base, {
                id: "place-" + id, tiers: ["local", "military"], know: 80, rumor: false, topic: "the Town Hall",
                text: function (seed) {
                    const origin = seed && seed.townOrigin === "crown"
                        ? "It began as the Crown grain depot's counting house."
                        : "It began as the Free Banners' muster hall.";
                    return "The Town Hall stands " + where + ". " + origin + " The guards keep the front hall, the council sits in the chamber at the back, and the records office off the corridor is kept locked when the clerk is out. West of the corridor the council keeps a waygate in its own chamber, and it will carry anyone who can pay the fee to another town far from here.";
                },
                distorted: "The Town Hall is where the council meets, and the council answers to whoever pays the guards."
            }));
        } else if (type === "Guildhall") {
            out.push(Object.assign({}, base, {
                id: "place-" + id, tiers: ["local", "military", "trade"], know: 80, rumor: true, topic: name,
                text: name + " is the town's guildhall, " + where + ". The guildmaster holds court in the front hall beside the job board, recruits train in the yard behind it, and the guildmaster's office is kept locked when its owner is out.",
                distorted: name + " is where sellswords are hired, and the guildmaster takes a cut of everything."
            }));
        } else if (type === "Chapel") {
            out.push(Object.assign({}, base, {
                id: "place-" + id, tiers: ["local", "faith"], know: 85, rumor: true, topic: name,
                text: name + " is the town's chapel, " + where + ". The priest keeps the altar and the vestry behind it, prays with anyone who asks, and has never been known to turn a traveller from the door.",
                distorted: name + " is where folk go to ask forgiveness, and the priest hears more than most."
            }));
        }
    });
    return out;
}

function _wlPick(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function createWorldLoreState() {
    const seed = {};
    Object.keys(WORLD_LORE_SEED_OPTIONS).forEach(function (key) {
        seed[key] = _wlPick(WORLD_LORE_SEED_OPTIONS[key]);
    });
    return { seed: seed, heard: {}, standing: { crown: 0, banners: 0 } };
}

function ensureWorldLore() {
    if (typeof G !== "object" || !G) return createWorldLoreState();
    if (!G.worldLore || typeof G.worldLore !== "object" || !G.worldLore.seed) {
        G.worldLore = createWorldLoreState();
    }
    const lore = G.worldLore;
    if (!lore.heard || typeof lore.heard !== "object") lore.heard = {};
    if (!lore.standing || typeof lore.standing !== "object") lore.standing = { crown: 0, banners: 0 };
    Object.keys(WORLD_LORE_SEED_OPTIONS).forEach(function (key) {
        if (WORLD_LORE_SEED_OPTIONS[key].indexOf(lore.seed[key]) < 0) {
            lore.seed[key] = _wlPick(WORLD_LORE_SEED_OPTIONS[key]);
        }
    });
    return lore;
}

function getWorldLoreFactText(fact, seed, distorted) {
    if (!fact) return "";
    const src = distorted && fact.distorted ? fact.distorted : fact.text;
    return typeof src === "function" ? String(src(seed || {})) : String(src || "");
}

// How the player has sided in the war so far. Positive = favors that side.
function getWorldStanding() {
    const lore = ensureWorldLore();
    return { crown: lore.standing.crown || 0, banners: lore.standing.banners || 0 };
}
function shiftWorldStanding(side, amount) {
    if (side !== "crown" && side !== "banners") return;
    const lore = ensureWorldLore();
    const next = (lore.standing[side] || 0) + (typeof amount === "number" ? amount : 1);
    lore.standing[side] = Math.max(-10, Math.min(10, next));
}

if (typeof window !== "undefined") {
    window.WORLD_LORE_FACTS = WORLD_LORE_FACTS;
    window.getPlaceLoreFacts = getPlaceLoreFacts;
    window.ensureWorldLore = ensureWorldLore;
    window.getWorldLoreFactText = getWorldLoreFactText;
    window.getWorldStanding = getWorldStanding;
    window.shiftWorldStanding = shiftWorldStanding;
}

// ── STARTING PAST: ARCHETYPES, BACKSTORY AND THE GUIDE ───────────
// Character creation asks "what brought you here?" (an archetype), one
// class-specific question about how the player learned their craft, and two
// questions that fill in the details of the archetype. The answers become a
// backstory (G.player.backstory, built by the engine's beginAdventure from
// buildPlayerBackstory below) and decide who the GUIDE is: an NPC who joins
// the player shortly after the adventure begins, opens the first
// conversation and points at a first lead. The leads are real lore facts
// (getBackstoryLoreFacts) so asking around actually turns something up.
//
// Everything here is plain data plus small pure helpers. The engine owns
// the UI (setup pages), the guide's spawn and the story hooks; the
// conversation entries live in cyoaftw-npc-data.js (ids "guide-*").
//
// SLOTS: each answer sets one or more named slots (home, wrong, craft ...).
// Backstory templates, guide lines and lore facts read them through
// {placeholders}, so every answer changes the wording the player sees later.

// How many random "approach" questions the personality page asks.
const APPROACH_QUESTION_COUNT = 4;

// Story turns the player gets to look around before the guide arrives.
const GUIDE_ARRIVAL_TURN = 1;

function _spFill(text, map) {
    return String(text == null ? "" : text).replace(/\{(\w+)\}/g, function (m, key) {
        const v = map && map[key];
        return (v === undefined || v === null || v === "") ? m : String(v);
    });
}

// ── CLASS CRAFT QUESTION: how did you learn what you do? ─────────
const CLASS_CRAFT_QUESTIONS = {
    Fighter: {
        prompt: "Where did you learn to fight?",
        options: [
            { label: "Militia drills back home", slot: { craft: "learned to fight in the militia drills back home" }, trait: "boldness" },
            { label: "A mercenary company that fell apart", slot: { craft: "carried a spear for a mercenary company until it broke up" }, trait: "boldness" },
            { label: "Taverns and alley scraps", slot: { craft: "learned to fight the hard way, in taverns and alley scraps" }, trait: "curiosity" },
            { label: "A veteran who saw something in me", slot: { craft: "were trained by an old veteran who saw something in you" }, trait: "empathy" }
        ]
    },
    Rogue: {
        prompt: "Where did you pick up your light fingers?",
        options: [
            { label: "Running errands for a street crew", slot: { craft: "grew up running errands for a street crew" }, trait: "boldness" },
            { label: "Touring with a troupe of players", slot: { craft: "toured with a troupe of players and picked up more than lines" }, trait: "empathy" },
            { label: "A locksmith's workshop", slot: { craft: "apprenticed under a locksmith and learned what every lock is hiding" }, trait: "curiosity" },
            { label: "Working off a family debt", slot: { craft: "worked off a family debt with quick fingers and a quicker exit" }, trait: "boldness" }
        ]
    },
    Cleric: {
        prompt: "What first turned you toward your faith?",
        options: [
            { label: "A vow I made as a child", slot: { craft: "swore a vow of service as a child and never took it back" }, trait: "empathy" },
            { label: "A stranger's deathbed", slot: { craft: "sat at a dying stranger's bedside and heard something you could not explain" }, trait: "curiosity" },
            { label: "Years on the pilgrim roads", slot: { craft: "walked the pilgrim roads until the road itself became your faith" }, trait: "curiosity" },
            { label: "A temple that took in foundlings", slot: { craft: "were raised in a temple that took in those nobody else wanted" }, trait: "empathy" }
        ]
    },
    Wizard: {
        prompt: "How did you come by your magic?",
        options: [
            { label: "A stolen primer and stubbornness", slot: { craft: "taught yourself from a stolen primer and a great deal of stubbornness" }, trait: "curiosity" },
            { label: "A failed apprenticeship", slot: { craft: "washed out of a respectable apprenticeship and kept everything you learned" }, trait: "boldness" },
            { label: "A wandering hedge-mage", slot: { craft: "were taken in by a wandering hedge-mage who never stayed anywhere long" }, trait: "curiosity" },
            { label: "A dangerous inheritance", slot: { craft: "inherited a trunk of somebody else's dangerous notes" }, trait: "boldness" }
        ]
    }
};

// ── APPROACH QUESTION POOL (random subset each new game) ─────────
// Same three traits as before (curiosity / empathy / boldness) - the
// conversation catalogue and deity judgment already read them - but a
// different handful of scenarios each time. Options per question may be 2-3.
const APPROACH_QUESTION_POOL = [
    { id: "new-place", prompt: "You step into a place you've never seen before. What draws you first?", options: [
        { text: "The layout, exits, and anything unusual", trait: "curiosity" },
        { text: "The people, and whether anyone seems worth approaching", trait: "empathy" },
        { text: "Who looks dangerous, and where I'd stand if it went wrong", trait: "boldness" } ] },
    { id: "troubled", prompt: "You notice someone nearby who looks troubled. What do you do?", options: [
        { text: "Check on them and offer help", trait: "empathy" },
        { text: "Stay back and watch before getting involved", trait: "boldness" },
        { text: "Find out what's troubling them, so I understand the situation", trait: "curiosity" } ] },
    { id: "strange-sound", prompt: "A strange sound comes from deeper inside. Your instinct is to:", options: [
        { text: "Go find out what made it", trait: "curiosity" },
        { text: "Leave it alone unless it becomes my problem", trait: "boldness" } ] },
    { id: "blocked", prompt: "Someone blocks your way and tests you. How do you respond?", options: [
        { text: "Hold your ground and push back", trait: "boldness" },
        { text: "Talk them down and keep things under control", trait: "empathy" } ] },
    { id: "found-purse", prompt: "You find a purse on the road with a name stitched inside. You:", options: [
        { text: "Track down the owner, whatever it takes", trait: "empathy" },
        { text: "Look through it carefully for what it can tell you", trait: "curiosity" },
        { text: "Keep it. The road is not a lost-and-found", trait: "boldness" } ] },
    { id: "locked-door", prompt: "A door is locked and nobody is watching. What goes through your mind?", options: [
        { text: "What could be behind it?", trait: "curiosity" },
        { text: "That someone must have a reason for the lock", trait: "empathy" },
        { text: "That a lock is only a suggestion", trait: "boldness" } ] },
    { id: "argument", prompt: "Two strangers are arguing loudly in the street. You:", options: [
        { text: "Step between them before it turns ugly", trait: "boldness" },
        { text: "Listen in. Arguments tell you a lot about a town", trait: "curiosity" },
        { text: "Ask one of them if they're alright afterward", trait: "empathy" } ] },
    { id: "offer", prompt: "A stranger offers you well-paid work and won't say what it is. You:", options: [
        { text: "Take it. Details can wait", trait: "boldness" },
        { text: "Ask questions until the story stops changing", trait: "curiosity" },
        { text: "Ask who else will be hurt if it goes wrong", trait: "empathy" } ] },
    { id: "ruin", prompt: "You pass a collapsed house with something glinting in the rubble. You:", options: [
        { text: "Climb in. Something that shiny won't wait", trait: "boldness" },
        { text: "Look for another way in that doesn't bring the roof down", trait: "curiosity" },
        { text: "Call out in case anyone is still inside", trait: "empathy" } ] },
    { id: "rumor", prompt: "You overhear a rumor that may or may not be true. You:", options: [
        { text: "Chase it down to see for myself", trait: "curiosity" },
        { text: "Think about who it might hurt before repeating it", trait: "empathy" },
        { text: "Use it, if it gets me an edge", trait: "boldness" } ] },
    { id: "wounded", prompt: "You come across an injured stranger on the road. You:", options: [
        { text: "Stop and tend to them", trait: "empathy" },
        { text: "Check whether this is a trap before approaching", trait: "boldness" },
        { text: "Ask what happened to them, because it may happen to me", trait: "curiosity" } ] },
    { id: "night-camp", prompt: "You are alone at a camp after dark and hear something moving outside the light. You:", options: [
        { text: "Draw steel and call out", trait: "boldness" },
        { text: "Douse the fire and listen", trait: "curiosity" },
        { text: "Leave food at the edge of the light, in case it only needs that", trait: "empathy" } ] }
];

// ── ARCHETYPES ───────────────────────────────────────────────────
// id            key stored on G.player.backstory.archetype
// label/blurb   shown on the setup page
// classFit      classes the choice is labelled "suits your class" for
// questions     two detail questions; option.slot merges into the slots
// build         (slots, ctx) -> backstory text; ctx = { name, cls, craft }
// goal          (slots) -> one line for the character sheet and story thread
// guide         who joins the player (see buildGuideSpec / the engine's
//               spawnGuideNPC): species pool, role, age, relation, persona,
//               opening line variants and three canned replies
// lead          { building, ... }: where the first lead points, and the lore
//               fact asking around will turn up (see getBackstoryLoreFacts)
// Placeholders available in guide lines and leads: {player} {class}
// {leadPlace} {mentorHint} {guideName} plus every slot.
const PLAYER_ARCHETYPES = {
    "coming-of-age": {
        label: "Coming of Age",
        blurb: "You have left home to learn a trade or earn a place. A family friend has offered to help you begin.",
        classFit: ["Fighter", "Rogue", "Wizard"],
        questions: [
            { prompt: "What did you leave behind?", options: [
                { label: "A farming village", slot: { home: "a farming village" }, trait: "empathy" },
                { label: "A family trade", slot: { home: "your family's trade" }, trait: "boldness" },
                { label: "A quiet monastery school", slot: { home: "a quiet monastery school" }, trait: "curiosity" },
                { label: "A fishing hamlet", slot: { home: "a fishing hamlet" }, trait: "boldness" } ] },
            { prompt: "Why leave now?", options: [
                { label: "To see the world before settling down", slot: { reason: "you wanted to see more of the world before settling down" }, trait: "curiosity" },
                { label: "There was no place left for me at home", slot: { reason: "there was no place left for you at home" }, trait: "boldness" },
                { label: "To prove myself to someone who doubted me", slot: { reason: "someone back home never believed you would amount to anything" }, trait: "boldness" },
                { label: "My teacher said I had outgrown the place", slot: { reason: "your teacher told you that you had outgrown the place" }, trait: "empathy" } ] }
        ],
        build: function (s, c) {
            return "You " + c.craft + ". You left " + s.home + " because " + s.reason + ". " +
                (c.alone ? "You came on your own, to make your own start." : "An old friend of your family has promised to help you get started here.");
        },
        goal: function () { return "Find a teacher or a guild willing to take you on."; },
        guide: {
            relation: "an old friend of your family who promised to see you started",
            species: ["Human", "Dwarf", "Elf", "Halfling"], role: "Townsfolk", age: "middle-aged",
            persona: "An old friend of the player's family who wants them to build a life of their own. Patient, with dry humour. Asks what they need before advising; takes hesitation seriously and accepts a refusal.",
            opening: [
                "\"{player}! There you are. I promised your family I would see you properly started, and I mean to keep that promise.\""
            ],
            replies: [
                { label: "Say you're ready", say: "I'm ready. Where do we start?", stance: "friendly" },
                { label: "Admit it's a lot to take in", say: "Give me a moment. It's a lot to take in.", stance: "guarded" },
                { label: "Bristle at being looked after", say: "I don't need a minder.", stance: "hostile" }
            ]
        },
        lead: { building: "classMentor" }
    },

    "revenge": {
        label: "Revenge",
        blurb: "Someone wronged you. Their trail leads here, and an old comrade is following it too.",
        classFit: ["Fighter", "Rogue"],
        questions: [
            { prompt: "What was done to you?", options: [
                { label: "They burned my home", slot: { wrong: "burned your home to the ground" }, trait: "boldness" },
                { label: "They killed someone I loved", slot: { wrong: "killed someone you loved" }, trait: "empathy" },
                { label: "They betrayed me and left me for dead", slot: { wrong: "betrayed you and left you for dead" }, trait: "boldness" },
                { label: "They stole my family's name and land", slot: { wrong: "stole your family's name and land" }, trait: "curiosity" } ] },
            { prompt: "Who are you after?", options: [
                { label: "An agent of the Ashen Court", slot: { quarry: "the Ashen Court", quarryFaction: "crown" }, trait: "curiosity" },
                { label: "A captain of the Tattered Banners", slot: { quarry: "the Tattered Banners", quarryFaction: "banners" }, trait: "boldness" },
                { label: "Someone I once trusted", slot: { quarry: "the one who betrayed you", quarryFaction: "" }, trait: "empathy" },
                { label: "Someone whose face I never saw", slot: { quarry: "the one whose face you never saw", quarryFaction: "" }, trait: "curiosity" } ] }
        ],
        build: function (s, c) {
            return "You " + c.craft + ". Someone " + s.wrong + ", and the trail of " + s.quarry + " has brought you here. " +
                (c.alone ? "You followed it here alone." : "An old comrade who shares your grudge has come to help you follow it.");
        },
        goal: function (s) { return "Follow the trail of " + s.quarry + " and see justice done."; },
        guide: {
            relation: "an old comrade who shares your grudge",
            species: ["Human", "Dwarf", "Orc", "Halfling"], role: "Adventurer", age: "adult",
            persona: "An old comrade tracking the same trail as the player. Quiet and direct. Separates a lead from proof, checks what the player is ready to do, and never promises revenge will put things right.",
            opening: [
                "\"{player}. Keep your voice down. A trace of {quarry} turned up at {leadPlace}. We ask around quietly, and we don't say who is asking.\""
            ],
            replies: [
                { label: "Say you're with them", say: "Then we start there. Lead on.", stance: "friendly" },
                { label: "Ask what exactly they know", say: "How sure are you? I won't chase a rumor.", stance: "guarded" },
                { label: "Say you work alone", say: "I'll do this my way. Stay out of it.", stance: "hostile" }
            ]
        },
        lead: { building: { Fighter: "Guildhall", "default": "Inn" } }
    },

    "redemption": {
        label: "Redemption",
        blurb: "You cannot undo what you did. You have come here to begin making amends.",
        classFit: ["Cleric", "Fighter"],
        questions: [
            { prompt: "What do you carry?", options: [
                { label: "I left my comrades to die", slot: { sin: "left your comrades to die" }, trait: "boldness" },
                { label: "I stole from people who trusted me", slot: { sin: "stole from people who trusted you" }, trait: "curiosity" },
                { label: "I took a life I could have spared", slot: { sin: "took a life you could have spared" }, trait: "empathy" },
                { label: "I ran when I was needed", slot: { sin: "ran when you were needed most" }, trait: "boldness" } ] },
            { prompt: "What do you want now?", options: [
                { label: "To repay what I owe", slot: { penance: "you mean to repay what you owe, whatever it costs" }, trait: "empathy" },
                { label: "To make things right with the one I wronged", slot: { penance: "you mean to make things right with the one you wronged" }, trait: "empathy" },
                { label: "To earn a second chance", slot: { penance: "you mean to earn a second chance, one honest deed at a time" }, trait: "curiosity" },
                { label: "To be somebody I can stand to be", slot: { penance: "you mean to become someone you can stand to be" }, trait: "boldness" } ] }
        ],
        build: function (s, c) {
            return "You " + c.craft + ". You " + s.sin + ". Now " + s.penance + ". " +
                (c.alone ? "You came alone, to begin on your own." : "Someone who knew you before has offered to help you begin making amends.");
        },
        goal: function () { return "Make amends, one honest deed at a time."; },
        guide: {
            relation: "someone who offered you a way to begin making amends",
            species: ["Human", "Dwarf", "Elf", "Halfling"], role: "Priest", age: "elderly",
            persona: "A plainspoken priest who knew the player before their wrongdoing and has offered help. Gives practical suggestions without judging their worth or promising forgiveness. Listens to doubt without turning it into a sermon.",
            opening: [
                "\"{player}. You came. I was not certain you would. No speeches: this town has people who need help and a shrine worth sitting in. I would start at {leadPlace}.\""
            ],
            replies: [
                { label: "Thank them", say: "Thank you for not giving up on me. Where do I begin?", stance: "friendly" },
                { label: "Admit you don't deserve it", say: "I don't know that I deserve this.", stance: "guarded" },
                { label: "Snap that you didn't ask for pity", say: "I didn't ask for your pity.", stance: "hostile" }
            ]
        },
        lead: { building: "Chapel", shrine: true }
    },

    "missing-kin": {
        label: "Search",
        blurb: "Someone you care about is missing. The last trail you could find points to this town.",
        classFit: ["Rogue", "Wizard", "Cleric"],
        questions: [
            { prompt: "Who are you looking for?", options: [
                { label: "My younger sibling", slot: { who: "your younger sibling" }, trait: "empathy" },
                { label: "A parent", slot: { who: "your mother or father" }, trait: "empathy" },
                { label: "My oldest friend", slot: { who: "your oldest friend" }, trait: "curiosity" },
                { label: "My child", slot: { who: "your child" }, trait: "boldness" } ] },
            { prompt: "How did they go missing?", options: [
                { label: "They left to find work in town", slot: { lastSeen: "left for this town to find work and never wrote again" }, trait: "curiosity" },
                { label: "They were taken by sellswords", slot: { lastSeen: "were taken by sellswords on the road" }, trait: "boldness" },
                { label: "They vanished after a quarrel", slot: { lastSeen: "vanished after a bitter quarrel, and you never got to take it back" }, trait: "empathy" },
                { label: "They went to the old capital", slot: { lastSeen: "went to the ruined capital of Aldermere and did not come back" }, trait: "curiosity" } ] }
        ],
        build: function (s, c) {
            return "You " + c.craft + ". " + s.who.charAt(0).toUpperCase() + s.who.slice(1) + " " + s.lastSeen + ". " +
                "Their trail leads here. " + (c.alone ? "You are searching on your own." : "A friend of theirs is helping you search.");
        },
        goal: function (s) { return "Find out what happened to " + s.who + "."; },
        guide: {
            relation: "a friend who wants answers as badly as you do",
            species: ["Human", "Elf", "Halfling", "Dwarf"], role: "Townsfolk", age: "adult",
            persona: "A friend of the missing person who is helping the player search. Observant and practical. Cares about the person as well as the search, admits uncertainty, and lets the player set the pace when an answer frightens them.",
            opening: [
                "\"{player}, over here. The clerk at {leadPlace} keeps a ledger of who comes and goes. If {who} passed through, a name is in it.\""
            ],
            replies: [
                { label: "Say let's go", say: "Then let's go. I'm not stopping until I know.", stance: "friendly" },
                { label: "Admit you're afraid of the answer", say: "What if the answer is one I can't bear?", stance: "guarded" },
                { label: "Say you'd rather search alone", say: "I'd rather do this on my own.", stance: "hostile" }
            ]
        },
        lead: { building: "Town Hall" }
    },

    "fortune": {
        label: "Fortune",
        blurb: "You need coin and a chance to build something. A partner from earlier schemes has come to help.",
        classFit: ["Rogue", "Wizard", "Fighter"],
        questions: [
            { prompt: "How did you end up needing coin?", options: [
                { label: "A moneylender called in my family's debt", slot: { need: "a moneylender called in your family's debt" }, trait: "boldness" },
                { label: "A venture of mine failed badly", slot: { need: "a venture of yours failed badly and took everything with it" }, trait: "curiosity" },
                { label: "I gambled it away", slot: { need: "you gambled away a good deal more than you owned" }, trait: "boldness" },
                { label: "I'm just tired of being poor", slot: { need: "you grew tired of being poor and decided to do something about it" }, trait: "empathy" } ] },
            { prompt: "What would count as winning?", options: [
                { label: "Paying off every debt", slot: { dream: "clear every debt you owe" }, trait: "empathy" },
                { label: "A house with a lock only I hold the key to", slot: { dream: "own a place with a lock only you hold the key to" }, trait: "boldness" },
                { label: "Enough to start my own business", slot: { dream: "have enough to start something of your own" }, trait: "curiosity" },
                { label: "More than anyone thinks I deserve", slot: { dream: "earn enough to prove the people who doubted you wrong" }, trait: "boldness" } ] }
        ],
        build: function (s, c) {
            return "You " + c.craft + ". When " + s.need + ", you came here to " + s.dream + ". " +
                (c.alone ? "You came on your own." : "A partner from your earlier schemes has come to help you find work.");
        },
        goal: function (s) { return "Earn enough coin to " + s.dream + "."; },
        guide: {
            relation: "a partner from your earlier schemes",
            species: ["Human", "Halfling", "Dwarf", "Elf"], role: "Adventurer", age: "adult",
            persona: "A quick-talking partner from the player's earlier schemes. Uses a little dry humour when it is welcome. Takes their money worries seriously, gives straight answers about known work, and lets the player check a proposition before agreeing.",
            opening: [
                "\"{player}! Well, here we are. There is more coin in this town than either of us has seen in a year, and somebody always pays for a quiet pair of hands. Start at {leadPlace}.\""
            ],
            replies: [
                { label: "Grin and agree", say: "Honest work first. Then we see.", stance: "friendly" },
                { label: "Ask if you can trust them", say: "How do I know I can trust this plan?", stance: "guarded" },
                { label: "Say you'll take the lead", say: "I'll decide where we go. You follow.", stance: "hostile" }
            ]
        },
        lead: { building: { Rogue: "Tavern", "default": "Guildhall" } }
    },

    "exile": {
        label: "Exile",
        blurb: "You cannot go home. A friend who vouched for you is helping you find somewhere to start again.",
        classFit: ["Rogue", "Fighter", "Cleric"],
        questions: [
            { prompt: "Why can't you go home?", options: [
                { label: "Accused of a crime I didn't commit", slot: { cause: "were accused of a crime you did not commit" }, trait: "empathy" },
                { label: "I refused an order I couldn't stomach", slot: { cause: "refused an order you could not stomach" }, trait: "boldness" },
                { label: "I was caught on the wrong side of a feud", slot: { cause: "were caught on the wrong side of a feud between people far above you" }, trait: "curiosity" },
                { label: "I was cast out for what I believe", slot: { cause: "were cast out for what you believe" }, trait: "boldness" } ] },
            { prompt: "Who might be looking for you?", options: [
                { label: "The Crown's magistrates", slot: { hunters: "the Crown's old magistrates" }, trait: "curiosity" },
                { label: "My former company", slot: { hunters: "your former company" }, trait: "boldness" },
                { label: "A powerful family", slot: { hunters: "a powerful family with long arms" }, trait: "curiosity" },
                { label: "Nobody, if I'm careful", slot: { hunters: "nobody, as long as you stay careful" }, trait: "empathy" } ] }
        ],
        build: function (s, c) {
            const hunters = String(s.hunters || "");
            const pursuit = /^nobody\b/i.test(hunters)
                ? "You hope to stay unnoticed here. "
                : (hunters ? hunters.charAt(0).toUpperCase() + hunters.slice(1) + " may come looking. " : "");
            return "You " + c.craft + ". You " + s.cause + ", and you cannot go home. " + pursuit +
                (c.alone ? "You came alone." : "A friend who vouched for you has come to help you start again.");
        },
        goal: function () { return "Lie low, and find a way to clear your name or start over."; },
        guide: {
            relation: "a friend who vouched for you when nobody else would",
            species: ["Human", "Elf", "Dwarf", "Halfling"], role: "Adventurer", age: "adult",
            persona: "A friend who vouched for the player when others would not. Soft-spoken and protective. Offers discreet, practical help, admits they cannot guarantee safety, and does not demand trust or choose how the player faces their past.",
            opening: [
                "\"Easy, {player}. Nobody followed us. This town asks few questions, so use no real name where you can help it. {leadPlace} is a good place to start being nobody.\""
            ],
            replies: [
                { label: "Thank them for the warning", say: "Thank you. I'll keep my head down.", stance: "friendly" },
                { label: "Ask whether it's safe", say: "How safe is it, really?", stance: "guarded" },
                { label: "Say you won't hide", say: "I'm done hiding. Let them come.", stance: "hostile" }
            ]
        },
        lead: { building: { Cleric: "Chapel", "default": "Inn" } }
    },

    "calling": {
        label: "Calling",
        blurb: "A dream, voice or other sign brought you here. A pilgrim has offered to help you investigate it.",
        classFit: ["Cleric", "Wizard"],
        questions: [
            { prompt: "What was the sign?", options: [
                { label: "A dream that came three nights running", slot: { sign: "a dream that returned three nights running" }, trait: "curiosity" },
                { label: "A voice at a roadside shrine", slot: { sign: "a voice at a roadside shrine" }, trait: "empathy" },
                { label: "A dying stranger's last words", slot: { sign: "a dying stranger's last words" }, trait: "empathy" },
                { label: "A relic that came into my hands", slot: { sign: "a relic that came into your hands, unasked" }, trait: "curiosity" } ] },
            { prompt: "How do you feel about it?", options: [
                { label: "Afraid, but I'm going anyway", slot: { feeling: "afraid, and going anyway" }, trait: "boldness" },
                { label: "Certain. It feels like coming home", slot: { feeling: "certain, as if it were coming home" }, trait: "empathy" },
                { label: "Suspicious. I want proof", slot: { feeling: "suspicious, and wanting proof" }, trait: "curiosity" },
                { label: "Resentful. I didn't ask for this", slot: { feeling: "resentful, because you never asked for any of this" }, trait: "boldness" } ] }
        ],
        build: function (s, c) {
            return "You " + c.craft + ". Then came " + s.sign + ". You are " + s.feeling + ". " +
                "You followed the sign here. " + (c.alone ? "You came alone, to find out what it means." : "A pilgrim who recognises such signs has offered to help you investigate.");
        },
        goal: function () { return "Find out what the sign that brought you here means."; },
        guide: {
            relation: "someone who understands the sign that drew you here",
            species: ["Human", "Elf", "Dwarf", "Halfling"], role: "Priest", age: "elderly",
            persona: "An older pilgrim who recognises the kind of sign the player followed. Quiet and curious. Answers questions directly, admits what remains unknown, and never treats a sign as an obligation or declares the player chosen.",
            opening: [
                "\"{player}. You followed it all the way. Folk say an old shrine tied to {leadPlace} still answers. Come, we will see whether it answers you.\""
            ],
            replies: [
                { label: "Ask them to explain", say: "Then tell me what it means. Please.", stance: "friendly" },
                { label: "Admit you can still turn back", say: "I could still turn around. Couldn't I?", stance: "guarded" },
                { label: "Reject the idea of fate", say: "I don't believe in signs.", stance: "hostile" }
            ]
        },
        lead: { building: { Cleric: "Chapel", "default": "Tavern" }, shrine: true }
    },

    // ── Lighter starts ──────────────────────────────────────────────
    // No pursuers, no debts, nothing to atone for. These have no pressure
    // spec (see getPressureSpec), so the start-mode cards are plain difficulty
    // choices (see getStartModeCards) and nobody comes looking for the player.
    "open-road": {
        label: "Open Road",
        blurb: "You came to see the world and hear its stories. A friend who has travelled this way before has offered to show you around.",
        classFit: ["Rogue", "Wizard", "Fighter", "Cleric"],
        questions: [
            { prompt: "What set you walking?", options: [
                { label: "A map I found in an attic", slot: { spark: "you found an old map in an attic and could not stop looking at it" }, trait: "curiosity" },
                { label: "Travellers' tales at my family's table", slot: { spark: "travellers' tales at your family's table made staying put feel small" }, trait: "empathy" },
                { label: "A festival I had heard about", slot: { spark: "you heard of a festival that sounded worth the walk" }, trait: "boldness" },
                { label: "I simply felt like it", slot: { spark: "you woke one morning wanting to see what lay past the next hill" }, trait: "curiosity" } ] },
            { prompt: "What are you hoping for?", options: [
                { label: "A good story to tell", slot: { hope: "a good story to tell" }, trait: "boldness" },
                { label: "A trade worth learning", slot: { hope: "a trade worth learning" }, trait: "curiosity" },
                { label: "Good company", slot: { hope: "good company" }, trait: "empathy" },
                { label: "A place that feels like home", slot: { hope: "a place that feels like home" }, trait: "empathy" } ] }
        ],
        build: function (s, c) {
            return "You " + c.craft + ". You set out because " + s.spark + ". You hope to find " + s.hope + ". " +
                (c.alone ? "You arrived on your own, in no hurry." : "A friend who has travelled this way before has offered to show you around.");
        },
        goal: function (s) { return "Look around town, meet people, and find " + _prSlot(s, "hope", "a good story to tell") + "."; },
        guide: {
            relation: "a travelling friend who knows the town and offered to show you around",
            species: ["Human", "Elf", "Dwarf", "Halfling"], role: "Adventurer", age: "adult",
            persona: "A cheerful travelling friend who has visited this town before. Easygoing and curious, glad to point out the good places and to let the player wander at their own pace. Answers plainly, admits what they do not know, and never insists on a plan.",
            opening: [
                "\"{player}! There you are. I told you this town was worth the walk. Travellers swap news at {leadPlace}, and that is always a good place to start.\""
            ],
            replies: [
                { label: "Say you're glad to see them", say: "Good to see you. Show me around.", stance: "friendly" },
                { label: "Say you want to take it slowly", say: "Give me a minute to take it all in.", stance: "guarded" },
                { label: "Say you'd rather explore alone", say: "I think I'd rather look around by myself.", stance: "hostile" }
            ]
        },
        lead: { building: "Tavern" }
    },

    "homecoming": {
        label: "Homecoming",
        blurb: "You grew up near here and have come back after years away. Someone who remembers you has come to welcome you.",
        classFit: ["Fighter", "Cleric", "Rogue", "Wizard"],
        questions: [
            { prompt: "Where have you been?", options: [
                { label: "Learning a trade", slot: { away: "a few years learning a trade" }, trait: "curiosity" },
                { label: "Fostered with relatives", slot: { away: "most of your childhood, fostered with relatives" }, trait: "empathy" },
                { label: "On the road", slot: { away: "years on the road" }, trait: "boldness" },
                { label: "Studying far away", slot: { away: "a long stretch of study far from home" }, trait: "curiosity" } ] },
            { prompt: "What did you miss most?", options: [
                { label: "My family's cooking", slot: { missed: "your family's cooking" }, trait: "empathy" },
                { label: "The market on a busy morning", slot: { missed: "the market on a busy morning" }, trait: "boldness" },
                { label: "The quiet evenings", slot: { missed: "the quiet evenings" }, trait: "curiosity" },
                { label: "The people", slot: { missed: "the people" }, trait: "empathy" } ] }
        ],
        build: function (s, c) {
            return "You " + c.craft + ". After " + s.away + ", you have come back to the town you grew up near, missing " + s.missed + ". " +
                (c.alone ? "You came back quietly, without telling anyone." : "An old neighbour who remembers you has come to welcome you home.");
        },
        goal: function () { return "Settle back in, and see who from the old days is still around."; },
        guide: {
            relation: "an old neighbour who remembers you and has come to welcome you home",
            species: ["Human", "Dwarf", "Elf", "Halfling"], role: "Townsfolk", age: "middle-aged",
            persona: "An old neighbour who remembers the player as a child and is delighted they are back. Warm, a little nosy, full of local news. Asks how the player is before telling them anything, and accepts it when they would rather not be fussed over.",
            opening: [
                "\"{player}! Look at you, all grown. Welcome back. Half the town will want to say hello, and {leadPlace} is the best place to start.\""
            ],
            replies: [
                { label: "Say it's good to be back", say: "It is so good to see you. Show me what has changed.", stance: "friendly" },
                { label: "Admit it feels strange", say: "It feels strange being back. Give me a moment.", stance: "guarded" },
                { label: "Ask them not to fuss", say: "Please, no fuss. I'd rather look around quietly.", stance: "hostile" }
            ]
        },
        lead: { building: "Inn" }
    },

    "good-offer": {
        label: "A Good Offer",
        blurb: "A letter promised honest work if you came. The sender has come to meet you and see you settled.",
        classFit: ["Fighter", "Cleric", "Rogue", "Wizard"],
        questions: [
            { prompt: "Who sent the letter?", options: [
                { label: "A cousin who runs a shop", slot: { sender: "a cousin who runs a shop" }, trait: "empathy" },
                { label: "A former teacher", slot: { sender: "a former teacher" }, trait: "curiosity" },
                { label: "A friend from my travelling days", slot: { sender: "a friend from your travelling days" }, trait: "boldness" },
                { label: "A merchant I once did a favour", slot: { sender: "a merchant you once did a favour" }, trait: "boldness" } ] },
            { prompt: "What did they promise?", options: [
                { label: "Steady pay and a bed", slot: { promise: "steady pay and a bed" }, trait: "empathy" },
                { label: "Work that suits my skills", slot: { promise: "work that suits your skills" }, trait: "curiosity" },
                { label: "A share of the takings", slot: { promise: "a share of the takings" }, trait: "boldness" },
                { label: "A chance to learn something new", slot: { promise: "a chance to learn something new" }, trait: "curiosity" } ] }
        ],
        build: function (s, c) {
            return "You " + c.craft + ". " + _spCap(s.sender) + " wrote to promise " + s.promise + " if you came. " +
                (c.alone ? "You came to see for yourself." : "They have come to meet you and see you settled.");
        },
        goal: function () { return "Find the work you were promised, and settle in."; },
        guide: {
            relation: "the one who wrote to offer you work, and came to meet you",
            species: ["Human", "Halfling", "Dwarf", "Elf"], role: "Townsfolk", age: "middle-aged",
            persona: "The person who wrote offering the player work. Practical and friendly. Explains the offer plainly, admits what they do not know, and accepts it when the player would rather look around before agreeing to anything.",
            opening: [
                "\"{player}! You made it. I hoped you would. The offer stands, and there is no hurry. {leadPlace} is where I would start asking about work.\""
            ],
            replies: [
                { label: "Say you're ready for work", say: "I'm ready. Where do we start?", stance: "friendly" },
                { label: "Ask about the offer", say: "Tell me about the work first.", stance: "guarded" },
                { label: "Say you'll look around first", say: "I'd like to look around before I decide anything.", stance: "hostile" }
            ]
        },
        lead: { building: "classMentor" }
    }
};

// Which Town building a green character of each class would start looking
// for a teacher in (used by "coming-of-age"). Hints are per building type.
const CLASS_MENTOR_HINTS = {
    Fighter: { building: "Guildhall" },
    Rogue: { building: "Tavern" },
    Cleric: { building: "Chapel" },
    Wizard: { building: "Town Hall" }
};
const BUILDING_MENTOR_HINTS = {
    "Guildhall": "The guildmaster keeps a roll of recruits, and the training yard behind the hall is where they learn. Ask to speak to the guildmaster.",
    "Chapel": "The priest here takes in the faithful and the lost alike, and teaches those who show a true calling. Ask after the vestry's prayer books.",
    "Tavern": "The kind of people who teach a rogue drink in the taproom. Ask the bartender who is worth knowing.",
    "Town Hall": "The records office at the Town Hall is the nearest thing this town has to a library. Ask the clerk who here can teach.",
    "Inn": "Travellers pass through the inn with all sorts of skills. Ask the innkeeper who is worth learning from.",
    "Quiet House": "Some trades are not taught in the open. Look for the pawnbroker's shop, and the room behind it."
};
// If a town (an old save, say) has no such building, lead somewhere that does.
const LEAD_FALLBACKS = {
    "Chapel": ["Tavern", "Town Hall"],
    "Guildhall": ["Town Hall", "Tavern"]
};

// Generic wording when the world has no such building (a non-town start).
const GUIDE_FALLBACK_PLACE = "the nearest place where people gather";

function getArchetypeIdsForClass(cls) {
    const ids = Object.keys(PLAYER_ARCHETYPES);
    const fits = ids.filter(function (id) { return PLAYER_ARCHETYPES[id].classFit.indexOf(cls) >= 0; });
    const rest = ids.filter(function (id) { return fits.indexOf(id) < 0; });
    return fits.concat(rest);
}

function _spCap(text) {
    const t = String(text || "");
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

// Finds a named building of the live Town ({ name, type, coords }), or null.
function findTownBuilding(type) {
    const rooms = typeof G !== "undefined" && G && G.roomMap ? G.roomMap : null;
    if (!rooms) return null;
    let found = null;
    Object.keys(rooms).forEach(function (key) {
        const r = rooms[key];
        if (found || !r || !r.isEntrance || !r.buildingId || r.buildingType !== type) return;
        found = {
            id: r.buildingId,
            type: type,
            coords: key,
            name: r.buildingName || (type === "Town Hall" ? "the Town Hall" : "the " + type.toLowerCase())
        };
    });
    return found;
}

// The place the first lead points at, resolved against the live world.
function _leadTypeFor(arch, cls) {
    let b = arch.lead ? arch.lead.building : null;
    if (b && typeof b === "object") b = b[cls] || b["default"];
    if (b === "classMentor") b = (CLASS_MENTOR_HINTS[cls] || CLASS_MENTOR_HINTS.Fighter).building;
    return b || "Tavern";
}

function resolveGuideLeadPlace(backstory) {
    const arch = backstory ? PLAYER_ARCHETYPES[backstory.archetype] : null;
    if (!arch) return null;
    let type = _leadTypeFor(arch, backstory.cls);
    let building = findTownBuilding(type);
    if (!building && LEAD_FALLBACKS[type]) {
        const fbs = LEAD_FALLBACKS[type];
        for (let i = 0; i < fbs.length && !building; i++) {
            building = findTownBuilding(fbs[i]);
            if (building) type = fbs[i];
        }
    }
    return { building: building, type: type, hint: BUILDING_MENTOR_HINTS[type] || "" };
}

// The fill map for guide lines and lore facts: slots + player + place.
function getBackstoryFillMap(backstory) {
    const slots = backstory && backstory.slots ? backstory.slots : {};
    const map = {};
    Object.keys(slots).forEach(function (k) { map[k] = slots[k]; });
    map.player = backstory && backstory.playerName ? backstory.playerName : "friend";
    map.class = backstory && backstory.cls ? String(backstory.cls).toLowerCase() : "adventurer";
    const lead = resolveGuideLeadPlace(backstory);
    map.leadPlace = lead && lead.building ? lead.building.name : GUIDE_FALLBACK_PLACE;
    map.mentorHint = lead && lead.hint ? lead.hint : "";
    map.guideName = backstory && backstory.guide && backstory.guide.name ? backstory.guide.name : "your guide";
    const guildB = typeof findTownBuilding === "function" ? findTownBuilding("Guildhall") : null;
    map.guildPlace = guildB && guildB.name ? guildB.name : "the guildhall";
    const chapelB = typeof findTownBuilding === "function" ? findTownBuilding("Chapel") : null;
    map.chapelPlace = chapelB && chapelB.name ? chapelB.name : "the chapel";
    return map;
}

// choices = { archetype, cls, playerName, slots }; returns the object the
// engine stores on G.player.backstory (text is the template version; the
// engine may replace it with an AI-polished one and keeps this as `template`).
function buildPlayerBackstory(choices) {
    const arch = PLAYER_ARCHETYPES[choices.archetype];
    if (!arch) return null;
    const slots = Object.assign({}, choices.slots || {});
    const craft = slots.craft || "made your own way in the world";
    // Free-form start ("Write my own"): the player's own words replace the
    // template text and, when given, the goal line. The archetype and slots
    // still drive the guide, the lead and the pressure terms.
    const fr = choices.freeform || null;
    const frText = fr && typeof cleanFreeformText === "function" ? cleanFreeformText(fr.background, FREEFORM_BACKGROUND_MAX) : "";
    const frMotive = fr && typeof cleanFreeformText === "function" ? cleanFreeformText(fr.motive, FREEFORM_MOTIVE_MAX) : "";
    // "Arrive on my own": no one from the past meets the player. The backstory
    // text drops the helper, and the guide never comes (state "none").
    const alone = !!choices.alone;
    const template = frText || arch.build(slots, { name: choices.playerName, cls: choices.cls, craft: craft, alone: alone });
    const out = {
        archetype: choices.archetype,
        label: arch.label,
        cls: choices.cls,
        playerName: choices.playerName,
        slots: slots,
        template: template,
        text: template,
        goal: frMotive || arch.goal(slots),
        guide: { state: alone ? "none" : "pending" },
        version: 1
    };
    if (alone) out.alone = true;
    if (frText) { out.freeform = true; if (frMotive) out.motive = frMotive; }
    return out;
}

// ── FREE-FORM BACKSTORY ("Write my own") ─────────────────────────
// The player writes the background and motive in their own words and picks
// the archetype that best fits. The archetype feeds the guide, the lead and
// the pressure system; a few optional fields (a name, a faction, an amount)
// fill the slots those systems read. Typed text is cleaned before it is
// stored: no braces (Perchance list syntax and {placeholder} fills), angle
// brackets, backticks, backslashes or double quotes, one line, length capped.
const FREEFORM_BACKGROUND_MIN = 20;
const FREEFORM_BACKGROUND_MAX = 700;
const FREEFORM_MOTIVE_MAX = 200;
const FREEFORM_NAME_MAX = 60;
const FREEFORM_AMOUNT_MIN = 100;
const FREEFORM_AMOUNT_MAX = 800;

function cleanFreeformText(value, max) {
    return String(value == null ? "" : value)
        .replace(/[{}<>`\\]/g, " ")
        .replace(/["\u201c\u201d]/g, "'")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max || FREEFORM_BACKGROUND_MAX)
        .trim();
}

// 0 when blank or not a positive number; otherwise clamped to a sane range so
// a typed amount can neither erase the pressure terms nor make them absurd.
function clampFreeformAmount(value) {
    const n = Math.round(Number(value));
    if (!isFinite(n) || n <= 0) return 0;
    return Math.max(FREEFORM_AMOUNT_MIN, Math.min(FREEFORM_AMOUNT_MAX, n));
}

// Per archetype: a one-line note on what the choice does, and the optional
// follow-up fields. kind: "text" (a name), "select" (a category the code
// recognises) or "amount" (coins).
const FREEFORM_ARCHETYPE_FIELDS = {
    "coming-of-age": {
        note: "Someone from your past has promised to see you started, and a rival from home may follow. No names needed.",
        fields: []
    },
    "revenge": {
        note: "A trail to follow and an enemy who will send people when they learn of you.",
        fields: [
            { key: "quarryFaction", kind: "select", label: "Is your enemy part of a larger group?", options: [
                { value: "", label: "No, someone on their own" },
                { value: "crown", label: "The Ashen Court (the Crown's agents)" },
                { value: "banners", label: "The Tattered Banners (sellswords)" } ] },
            { key: "quarryName", kind: "text", label: "Their name, if you know it (optional)", placeholder: "e.g. Captain Varn" }
        ]
    },
    "redemption": {
        note: "Something you cannot undo. Those you wronged may come to name terms.",
        fields: [
            { key: "amount", kind: "amount", label: "Coins you would pay to make it right (optional, 100 to 800)", placeholder: "300" }
        ]
    },
    "missing-kin": {
        note: "Someone vanished and the trail leads here. Someone else would rather it ended.",
        fields: [
            { key: "who", kind: "text", label: "Who are you looking for? (a name or a relation)", placeholder: "e.g. my brother Tomas" }
        ]
    },
    "fortune": {
        note: "You need coin, and whoever you owe will send collectors.",
        fields: [
            { key: "need", kind: "select", label: "Who is after your coin?", options: [
                { value: "poor", label: "No one in particular, I am just tired of being poor" },
                { value: "lender", label: "A moneylender" },
                { value: "venture", label: "The backers of a venture that failed" },
                { value: "gambled", label: "A gambling house" } ] },
            { key: "amount", kind: "amount", label: "What you owe, in coins (optional, 100 to 800)", placeholder: "500" }
        ]
    },
    "exile": {
        note: "You cannot go home. Someone may come looking, and they may name a price.",
        fields: [
            { key: "hunters", kind: "select", label: "Who might be looking for you?", options: [
                { value: "nobody", label: "Nobody, if I am careful" },
                { value: "crown", label: "The Crown's magistrates" },
                { value: "company", label: "My former company" },
                { value: "family", label: "A powerful family" } ] },
            { key: "amount", kind: "amount", label: "The price of being left alone, in coins (optional, 100 to 800)", placeholder: "400" }
        ]
    },
    "calling": {
        note: "A sign drew you here, and a rival seeker believes it was meant for them. No names needed.",
        fields: []
    },
    "open-road": {
        note: "You came for the road itself, and a friend who knows the town will meet you. Nothing is chasing you.",
        fields: []
    },
    "homecoming": {
        note: "You are returning to a place you know, and someone remembers you. Nothing is chasing you.",
        fields: []
    },
    "good-offer": {
        note: "Someone promised you honest work and will meet you. Nothing is chasing you.",
        fields: []
    }
};

// Values from the free-form page -> the slots the rest of the game reads.
// values = { fieldKey: typed or chosen value }. Anything blank gets a neutral
// default so no {placeholder} is ever left raw in a guide line or lore fact.
function resolveFreeformSlots(archetypeId, values) {
    const v = values || {};
    const slots = {};
    if (archetypeId === "revenge") {
        const faction = v.quarryFaction === "crown" || v.quarryFaction === "banners" ? v.quarryFaction : "";
        const name = cleanFreeformText(v.quarryName, FREEFORM_NAME_MAX);
        const group = faction === "crown" ? "the Ashen Court" : (faction === "banners" ? "the Tattered Banners" : "");
        slots.quarryFaction = faction;
        slots.quarry = name && group ? name + " of " + group : (name || group || "the one who wronged you");
    } else if (archetypeId === "missing-kin") {
        slots.who = cleanFreeformText(v.who, FREEFORM_NAME_MAX) || "the one you are searching for";
    } else if (archetypeId === "fortune") {
        const NEED = {
            lender: "a moneylender called in your family's debt",
            venture: "a venture of yours failed badly and took everything with it",
            gambled: "you gambled away a good deal more than you owned",
            poor: "you grew tired of being poor and decided to do something about it"
        };
        slots.need = NEED[v.need] || NEED.poor;
        slots.dream = "make something of yourself";
    } else if (archetypeId === "exile") {
        const HUNTERS = {
            crown: "the Crown's old magistrates",
            company: "your former company",
            family: "a powerful family with long arms",
            nobody: "nobody, as long as you stay careful"
        };
        slots.hunters = HUNTERS[v.hunters] || HUNTERS.nobody;
    } else if (archetypeId === "open-road") {
        slots.hope = "a good story to tell";
    }
    const amt = clampFreeformAmount(v.amount);
    if (amt && (archetypeId === "redemption" || archetypeId === "fortune" || archetypeId === "exile")) slots.amount = amt;
    return slots;
}

// The guide's opening line for this backstory (one of the variants, stable per player).
// ── GUIDE SPEECH BY SPECIES ────────────────────────────────────────────────
// The guide is always the player's own species (see spawnGuideNPC), and talks
// the way that people talk. Everyone speaks the common tongue; there are no
// invented languages. What changes is idiom, cadence and what they care about
// (see NPC_SPECIES_SPEECH in cyoaftw-npc-data.js for the same layer applied
// to every NPC). Humans use the base lines in PLAYER_ARCHETYPES; the other
// playable species override the relation and the opening line per archetype,
// and the shared mission and newcomer-blessing lines below.
// Fill tokens are the same as the base lines ({player}, {leadPlace}, {quarry},
// {who}, {guildPlace}, {chapelPlace}).
const GUIDE_SPECIES_LINES = {
    "coming-of-age": {
        elf: {
            relation: "an old friend of your family, long in years, who promised to see you started",
            opening: "\"{player}. At last. I gave your family my word that I would see you properly started, and I do not give my word lightly. We have time, but not as much as you think.\""
        },
        dwarf: {
            relation: "a clan friend of your family who swore to see you started",
            opening: "\"{player}! About time. I gave your family my word I would see you started, and a word is a contract. Let us get on with it.\""
        },
        halfling: {
            relation: "an old friend from the next hearth over who promised to see you started",
            opening: "\"{player}, there you are! Look at you, thin as a rake. I promised your family I would see you properly started, and I will not have it said I broke a promise on an empty stomach.\""
        },
        orc: {
            relation: "an elder of your clan, old kin to your family, who swore to see you started",
            opening: "\"{player}. You came. Good. I swore to your kin that I would see you started, and I keep what I swear. Stand straight and listen.\""
        },
        dragonborn: {
            relation: "a retainer of your family's house, sworn to see you started",
            opening: "\"{player}. You are late, but you are here. I gave my oath to your house that you would be properly started, and I do not leave an oath half kept.\""
        }
    },
    "revenge": {
        elf: {
            relation: "an old companion of the road who has long shared your grudge",
            opening: "\"{player}. Speak softly. I have waited a long while for a trace of {quarry}, and one has turned up at {leadPlace}. We ask quietly, and we give no name.\""
        },
        dwarf: {
            relation: "an old comrade from the same hall who shares your grudge",
            opening: "\"{player}. Keep it down. A trace of {quarry} turned up at {leadPlace}. We ask around, we do not say who is asking, and we settle the account in full.\""
        },
        halfling: {
            relation: "an old friend who shares your grudge and has not forgiven it either",
            opening: "\"{player}, shh, come close. Somebody at {leadPlace} saw a trace of {quarry}. We ask nicely, we do not say who is asking, and we do not let on that we care.\""
        },
        orc: {
            relation: "a blood-sworn clan-mate who shares your grudge",
            opening: "\"{player}. Low voice. {quarry} left a trail and it runs to {leadPlace}. We ask, we listen, we say no names. When the time comes we strike once, and properly.\""
        },
        dragonborn: {
            relation: "a sworn companion of your line who shares your grudge",
            opening: "\"{player}. Lower your voice. A trace of {quarry} has surfaced at {leadPlace}. We inquire discreetly, and we do not speak of who asks. Patience will be repaid.\""
        }
    },
    "redemption": {
        elf: {
            relation: "a patient elder who offered you a way to begin making amends",
            opening: "\"{player}. You came. I was not certain you would, and I am glad. There is no hurry in amends, only the doing. This town has people who need help, and I would begin at {leadPlace}.\""
        },
        dwarf: {
            relation: "a stern old priest who offered you a way to begin making amends, and a ledger to keep it in",
            opening: "\"{player}. You came. Good. A debt is not paid by talking about it. This town has folk who need help and a shrine worth sitting in. Start at {leadPlace}.\""
        },
        halfling: {
            relation: "a kindly old priest who offered you a way to begin making amends, and a bowl of soup besides",
            opening: "\"{player}, dear, you came. I was not sure you would. No fuss, no speeches. There are folk here who need help and a shrine that is good to sit in. Start at {leadPlace}, and eat something first.\""
        },
        orc: {
            relation: "an old priest of the clan who offered you a way to begin making amends",
            opening: "\"{player}. You came. I did not know that you would. Words are cheap, so I will not spend many. People here need a strong hand, and the shrine is worth your time. Go to {leadPlace}.\""
        },
        dragonborn: {
            relation: "an elderly priest of your house who offered you a way to begin making amends",
            opening: "\"{player}. You came. I confess I was uncertain. Honour is repaired by deeds, not declarations. This town holds people in need and a shrine worth your devotion. Begin at {leadPlace}.\""
        }
    },
    "missing-kin": {
        elf: {
            relation: "a friend of long standing who wants answers as badly as you do",
            opening: "\"{player}, over here. I have been patient, but patience has its limits. The clerk at {leadPlace} keeps a ledger of who comes and goes. If {who} passed through, a name is in it.\""
        },
        dwarf: {
            relation: "a clan friend who wants answers as badly as you do",
            opening: "\"{player}, here. The clerk at {leadPlace} keeps the books on who comes and goes. If {who} passed through, it is written down. Books do not lie. Clerks might.\""
        },
        halfling: {
            relation: "a close friend who wants answers as badly as you do",
            opening: "\"{player}, over here, quick! The clerk at {leadPlace} keeps a ledger of who comes and goes, and clerks love to be asked nicely. If {who} passed through, a name is in it.\""
        },
        orc: {
            relation: "a clan-mate who wants answers as badly as you do",
            opening: "\"{player}. Here. The clerk at {leadPlace} keeps a ledger of who comes and goes. If {who} passed through, a name is in it. We go together, and we do not leave without the answer.\""
        },
        dragonborn: {
            relation: "a loyal friend of your house who wants answers as badly as you do",
            opening: "\"{player}. Here. The clerk at {leadPlace} keeps a record of arrivals and departures. If {who} passed through, a name is written there. We will have it.\""
        }
    },
    "fortune": {
        elf: {
            relation: "a fellow chancer, older and cleverer than you, who got you into this",
            opening: "\"{player}. Well. Here we are. There is more coin in this town than either of us has seen in a very long time, and someone always pays for a quiet pair of hands. Begin at {leadPlace}.\""
        },
        dwarf: {
            relation: "a fellow chancer who talked you into this on a handshake",
            opening: "\"{player}! Here we are. More coin in this town than we have seen in a year, and somebody always pays for quiet hands. Fair work for fair coin. Start at {leadPlace}.\""
        },
        halfling: {
            relation: "a fellow chancer, quick with a smile, who got you into this",
            opening: "\"{player}! Well, here we are, and what a town! More coin than either of us has seen in a year, and somebody always pays for a quiet pair of hands. Start at {leadPlace}, and mind your pockets.\""
        },
        orc: {
            relation: "a fellow raider turned chancer who got you into this",
            opening: "\"{player}. We are here. There is more coin in this town than either of us has seen in a year, and somebody pays well for hands that can be quiet or loud. Start at {leadPlace}.\""
        },
        dragonborn: {
            relation: "a fellow chancer of good birth and poor luck who got you into this",
            opening: "\"{player}. We have arrived. There is more coin in this town than either of us has seen in a year, and someone always pays for discreet service. Begin at {leadPlace}.\""
        }
    },
    "exile": {
        elf: {
            relation: "a friend of long standing who vouched for you when nobody else would",
            opening: "\"Softly, {player}. Nobody followed us. This town asks few questions, so give no true name where you can avoid it. {leadPlace} is a good place to begin being nobody.\""
        },
        dwarf: {
            relation: "a clan friend who vouched for you when nobody else would",
            opening: "\"Easy, {player}. Nobody followed. This town does not ask many questions, so give no real name if you can help it. {leadPlace} is a good place to start being nobody.\""
        },
        halfling: {
            relation: "a friend who vouched for you when nobody else would, and fed you besides",
            opening: "\"Easy, {player}, easy. Nobody followed us, and I looked twice. This town asks few questions, so use no real name if you can help it. {leadPlace} is a good place to start being nobody.\""
        },
        orc: {
            relation: "a clan-mate who vouched for you when nobody else would",
            opening: "\"Easy, {player}. Nobody followed us. This town asks few questions, so give no true name if you can avoid it. {leadPlace} is a good place to start being no one.\""
        },
        dragonborn: {
            relation: "a friend who spoke for you when nobody else would, at cost to their own name",
            opening: "\"Calm yourself, {player}. Nobody followed us. This town asks few questions, so give no true name where it can be helped. {leadPlace} is a fitting place to be nobody for a while.\""
        }
    },
    "calling": {
        elf: {
            relation: "someone who understands the sign that drew you here, and has seen its like before",
            opening: "\"{player}. You followed it all the way. I have seen a sign like yours once before, long ago. They say an old shrine tied to {leadPlace} still answers. Come, we will see whether it answers you.\""
        },
        dwarf: {
            relation: "someone who understands the sign that drew you here",
            opening: "\"{player}. You followed it all the way. Folk say an old shrine tied to {leadPlace} still answers. Come on, we will see whether it answers you.\""
        },
        halfling: {
            relation: "someone who understands the sign that drew you here",
            opening: "\"{player}! You followed it all the way here, bless you. Folk say an old shrine tied to {leadPlace} still answers. Come along, we will see whether it answers you.\""
        },
        orc: {
            relation: "a seer of your clan who understands the sign that drew you here",
            opening: "\"{player}. You followed the sign to the end. Good. They say an old shrine tied to {leadPlace} still answers. We will go and see whether it answers you.\""
        },
        dragonborn: {
            relation: "someone who understands the sign that drew you here",
            opening: "\"{player}. You followed it to the end. Fitting. It is said an old shrine tied to {leadPlace} still answers. Let us see whether it answers you.\""
        }
    }
};

// Shared guide lines by species (mission, mission when the lead is the
// Guildhall, and the newcomer's-blessing advice). Facts are identical to the
// base lines; only the voice changes. Humans use the base lines.
const GUIDE_SPECIES_TEXT = {
    elf: {
        mission: "\"Three things, {player}, and there is no need to hurry any of them. Grow stronger: {guildPlace} keeps trainers and a quiet yard. Earn coin: the notice boards are never empty. And follow your lead, patiently; it will keep.\"",
        missionGuild: "\"Three things, {player}, and there is no need to hurry any of them. Grow stronger: the trainers and the quiet yard there are for that. Earn coin: the notice boards are never empty. And follow your lead, patiently; it will keep.\"",
        advice: "\"I have buried too many who learned this late: death here is final. Before anything else, go to the shrine in {chapelPlace} and ask for a newcomer's blessing. It is free, it binds you to no god, and it will catch you once. Beyond that, only a patron you have served can bring you back, and only if they are strong enough. Say the word and I will walk you there.\""
    },
    dwarf: {
        mission: "\"Three things, {player}, no frills. Get stronger: {guildPlace} has trainers and a yard. Earn coin: the boards pay for honest work. Follow your lead. There are no shortcuts, only the work.\"",
        missionGuild: "\"Three things, {player}, no frills. Get stronger: the trainers and the yard there are for that. Earn coin: the boards pay for honest work. Follow your lead. There are no shortcuts, only the work.\"",
        advice: "\"Death is final here. No refunds, no second pour. First thing, the shrine in {chapelPlace}: ask for a newcomer's blessing. It costs nothing, ties you to no god, and it saves you once. After that, only a patron you have served, and only if they have the strength. I will show you the way, if you want it.\""
    },
    halfling: {
        mission: "\"Right, {player}, three things, and then supper. Get stronger: {guildPlace} has trainers and a yard to practise in. Earn coin: there is always a job on a board somewhere. And follow your lead.\"",
        missionGuild: "\"Right, {player}, three things, and then supper. Get stronger: the trainers and the yard there are for that. Earn coin: there is always a job on a board somewhere. And follow your lead.\"",
        advice: "\"Now, one hard thing, and I will say it kindly: death is final in this country. Pop into the shrine in {chapelPlace} and ask for a newcomer's blessing before anything else. It is free, it binds you to no god, and it saves you once. After that, only a patron you have served can bring you back, and only if they are strong enough. I will walk you over, if you like.\""
    },
    orc: {
        mission: "\"Three things, {player}. Get strong: {guildPlace} has trainers and a yard to bleed in. Earn coin: take work, take bounties. Then follow your lead.\"",
        missionGuild: "\"Three things, {player}. Get strong: the trainers and the yard there are for that. Earn coin: take work, take bounties. Then follow your lead.\"",
        advice: "\"Know this: death is final here, and pride will not save you. Before anything else, go to the shrine in {chapelPlace} and ask for a newcomer's blessing. Free, binds you to no god, saves you once. After that, only a patron you have served can pull you back, if they are strong enough. Do not skip it. I will take you there.\""
    },
    dragonborn: {
        mission: "\"Three matters, {player}. Grow stronger: {guildPlace} has trainers and a yard worth your sweat. Earn coin: there is work, and there are bounties. And follow your lead, for it will not wait forever.\"",
        missionGuild: "\"Three matters, {player}. Grow stronger: the trainers and the yard there are worth your sweat. Earn coin: there is work, and there are bounties. And follow your lead, for it will not wait forever.\"",
        advice: "\"Understand this: death is final in this country, and pride will not undo it. Before anything else, go to the shrine in {chapelPlace} and ask for a newcomer's blessing. It is free, it binds you to no god, and it saves you once. After that, only a patron you have served can restore you, and only if they are strong enough. Let me lead you there.\""
    }
};

// The guide's spec for this player's species: the archetype's base guide with
// the species relation and opening swapped in when one exists.
function getGuideSpec(archetypeId, speciesKey) {
    const arch = PLAYER_ARCHETYPES[archetypeId];
    if (!arch || !arch.guide) return null;
    const key = String(speciesKey || "").toLowerCase();
    const byArch = GUIDE_SPECIES_LINES[archetypeId];
    const o = byArch && byArch[key] ? byArch[key] : null;
    if (!o) return arch.guide;
    const spec = Object.assign({}, arch.guide);
    if (o.relation) spec.relation = o.relation;
    if (o.opening) spec.opening = [o.opening];
    return spec;
}

function _guideOwnSpeciesKey() {
    return typeof getPlayerSpeciesKey === "function" ? getPlayerSpeciesKey() : "";
}

function getGuideOpeningLine(backstory) {
    const arch = backstory ? PLAYER_ARCHETYPES[backstory.archetype] : null;
    if (!arch) return "";
    const gspec = getGuideSpec(backstory.archetype, _guideOwnSpeciesKey()) || arch.guide;
    const variants = gspec.opening;
    let h = 0;
    const seed = String(backstory.playerName || "") + backstory.archetype;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 9973;
    return _spFill(variants[h % variants.length], getBackstoryFillMap(backstory));
}

// After the opening line the guide says the shared mission (the same for every
// archetype: get stronger, earn coin, follow your lead) and then the hard rule:
// death is final, so ask for the free newcomer's blessing first (see
// requestNewcomerBlessing in the engine). Folded into one bubble by
// startGuideArrival.
const GUIDE_MISSION_LINES = [
    "\"I will not bury you in advice, {player}. Three things matter here. Get stronger: {guildPlace} keeps trainers and a yard for it. Earn coin: the notice boards always want something done. And follow your lead, before it goes cold.\""
];

// Used when the first lead is the Guildhall itself, so the place is not named twice.
const GUIDE_MISSION_LINES_GUILD_LEAD = [
    "\"I will not bury you in advice, {player}. Three things matter here. Get stronger: the trainers and the yard there are made for it. Earn coin: the notice boards always want something done. And follow your lead, before it goes cold.\""
];

const GUIDE_NEWCOMER_ADVICE = [
    "\"One more thing, and listen. Death here does not bargain. Before you do anything rash, go to the shrine in {chapelPlace} and ask for a newcomer's blessing. It costs nothing, it binds you to no god, and it pulls you back from the grave once. After that, you will need a patron who owes you, and one strong enough to pay. Say the word and I will walk you there.\""
];

function _guideSeedIndex(backstory, n) {
    let h = 0;
    const seed = String(backstory && backstory.playerName || "") + String(backstory && backstory.archetype || "");
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 9973;
    return h % n;
}

function getGuideMissionLine(backstory) {
    if (!backstory) return "";
    const fill = getBackstoryFillMap(backstory);
    const guildLead = fill.leadPlace === fill.guildPlace;
    const sp = GUIDE_SPECIES_TEXT[_guideOwnSpeciesKey()];
    let pool = guildLead ? GUIDE_MISSION_LINES_GUILD_LEAD : GUIDE_MISSION_LINES;
    if (sp) pool = [guildLead ? sp.missionGuild : sp.mission];
    return _spFill(pool[_guideSeedIndex(backstory, pool.length)], fill);
}

function getGuideNewcomerAdvice(backstory) {
    if (!backstory) return "";
    const sp = GUIDE_SPECIES_TEXT[_guideOwnSpeciesKey()];
    const pool = sp ? [sp.advice] : GUIDE_NEWCOMER_ADVICE;
    return _spFill(pool[_guideSeedIndex(backstory, pool.length)], getBackstoryFillMap(backstory));
}

// ── GUIDE TALK: the opening as a back-and-forth ───────────────────────────
// The guide no longer delivers opening + mission + blessing in one go. They
// speak a short line, stop on a check-in with reply buttons, and each reply
// picks the next small beat (see handleGuideTalk in the engine). Every beat
// has several phrasings, one chosen at random each time. Facts (places, the
// newcomer's blessing) stay scripted. Works for any guide NPC: the name and
// species come from the NPC, the places from the fill map.
// Intro delivery is authored. AI may select a delivery, never extend it.
const GUIDE_CARE_LINES = {
    checkin: [
        '"There you are, {player}. How are you holding up?"',
        '"{player}. I am glad I found you. How are you doing?"'
    ],
    checkinHurt: [
        '"{player}, you are hurt. Do you want to see to that before we talk?"',
        '"There you are. You are hurt, {player}. What do you need first?"'
    ],
    fine: [
        '"I am glad. What would help you most right now?"',
        '"Good to hear. What do you want to tackle first?"'
    ],
    fineHurt: [
        '"Alright. If that changes, say so. Do you want to hear about resting, or get on with things?"',
        '"I hear you. You are still hurt, though. Shall we talk about resting, or would you rather carry on?"'
    ],
    rattled: [
        '"We can leave the plans for a moment. Would you rather have some quiet, or talk about what to do?"',
        '"You do not have to explain. Do you want a moment, or would something practical help?"'
    ],
    hurt: [
        '"Then let us put the plans aside. Do you want to know how to tend your wounds?"',
        '"Your wounds come first. Shall we talk about how to mend?"'
    ],
    who: [
        '"I am {relation}. You need not take my advice. What would help right now?"'
    ],
    pause: [
        '"Take your time. I will be here when you want to talk."',
        '"Alright. We can talk when you are ready."'
    ],
    first: [
        '"What do you need first: training, coin, or a place to start looking?"',
        '"What would help most: getting stronger, finding work, or following your lead?"'
    ]
};

// These short variants carry the same intent; no invented observations,
// metaphors, consolation speeches, or claims to have helped off screen.
const GUIDE_CARE_VOICE = {
    elf: {
        checkin: ['"{player}. It is good to see you. How are you holding up?"'],
        rattled: ['"There is time. Would you prefer quiet, or shall we think through the next step?"']
    },
    dwarf: {
        checkin: ['"There you are, {player}. How are you doing? Tell me plain."'],
        rattled: ['"We can wait. Do you want quiet, or something useful to get on with?"']
    },
    halfling: {
        checkin: ['"{player}, there you are. How are you, really?"'],
        rattled: ['"Oh, {player}. We can put the plans aside. Quiet, or a little help deciding?"']
    },
    orc: {
        checkin: ['"{player}. Good to see you. What do you need?"'],
        rattled: ['"We wait, then. Unless you want something to do. Your choice."']
    },
    dragonborn: {
        checkin: ['"{player}. I am glad to find you. How do you fare?"'],
        rattled: ['"Then the plans can wait. Would you prefer a moment, or a next step?"']
    },
    goblin: {
        checkin: ['"{player}! Found you. How are you doing?"'],
        rattled: ['"No rush, no rush. Want quiet? Or shall we work out what comes next?"']
    }
};

const GUIDE_CARE_READY_REPLIES = [
    { label: "Help me decide", say: "Help me work out what to do first.", stance: "friendly", guideTalk: "first-choice" },
    { label: "What do you know about my lead?", say: "What do you know about my lead?", stance: "guarded", guideTalk: "hook" },
    { label: "I need a moment", say: "I need a moment.", stance: "guarded", guideTalk: "pause" }
];
const GUIDE_CARE_REST_REPLY = { label: "How can I heal?", say: "How can I tend my wounds?", stance: "friendly", guideTalk: "care-rest" };

// Each reaction answers the actual archetype reply, rather than treating all
// guarded/hostile replies as interchangeable attitude.
const GUIDE_HOOK_LISTENING = {
    "coming-of-age": {
        friendly: '"Let us pick a first step, then. What would help most?"',
        guarded: '"Of course. We can leave it there until you are ready."',
        hostile: '"You decide what you do. I will give advice when you ask for it."'
    },
    revenge: {
        friendly: '"We can start with the lead. Or is there something you need first?"',
        guarded: '"I cannot promise what we will find. You can ask for yourself before deciding to go further."',
        hostile: '"Your way, then. I will not come with you unless you ask."'
    },
    redemption: {
        friendly: '"You are still trying. What would help you begin?"',
        guarded: '"You do not have to settle that with me. We can start with something you choose to do."',
        hostile: '"I hear you. I will leave the choice to you."'
    },
    "missing-kin": {
        friendly: '"Then we can start asking. Is there anything you need before that?"',
        guarded: '"I cannot promise what the answer will be. We can ask one question at a time, if you want."',
        hostile: '"Alright. I will not follow you unless you ask."'
    },
    fortune: {
        friendly: '"Honest work first. Shall we look at what you need to begin?"',
        guarded: '"You have reason to question me. Check the work for yourself before you agree to it."',
        hostile: '"You choose where to go. I will wait until you ask me along."'
    },
    exile: {
        friendly: '"Then we keep it quiet. What do you need first?"',
        guarded: '"I cannot promise you will be safe. You can choose how much to tell anyone here."',
        hostile: '"I hear you. How you face them is your choice. I can help you prepare if you ask."'
    },
    calling: {
        friendly: '"I cannot tell you what it means for you. We can ask at the shrine, if you want."',
        guarded: '"Yes. You can turn back. You do not owe the shrine an answer."',
        hostile: '"It is your choice. I will not press you."'
    },
    "open-road": {
        friendly: '"Then let us start with the sights. What do you want to see first?"',
        guarded: '"Of course. No rush. Take it in at your own pace."',
        hostile: '"Fair enough. Explore as you like. I will be around if you want company."'
    },
    homecoming: {
        friendly: '"Then let us start with who is still around. Who do you want to see first?"',
        guarded: '"Of course. Take your time getting your feet under you."',
        hostile: '"Fair enough. I will not fuss. I am around if you want me."'
    },
    "good-offer": {
        friendly: '"Good. Then let us start with the work. What would suit you best?"',
        guarded: '"Fair. Ask whatever you like about it, and decide when you are ready."',
        hostile: '"Of course. Look around first. The offer will keep."'
    }
};

// Only plain, unambiguous self-reports use the authored intro route. Questions
// and longer accounts remain available to normal conversation.
function matchGuideCheckinReply(text) {
    const t = String(text || "").toLowerCase().replace(/[.!?]+$/g, "").replace(/[’]/g, "'").trim();
    if (/^(?:i |i'm |i am )?(?:need a moment|need some space|need a minute|give me a moment|give me a minute|leave me alone)$/.test(t)) return "pause";
    if (/^(?:i'm|i am|i feel) (?:a bit |really |still )?(?:shaken|rattled|scared|afraid|overwhelmed|not (?:fine|okay|ok|alright))$/.test(t)) return "checkin-rattled";
    if (/^(?:i'm|i am) (?:hurt|wounded|injured|bleeding)$/.test(t)) return "checkin-hurt";
    if (/^(?:i'm|i am|i feel) (?:fine|okay|ok|alright|not hurt)(?:,? (?:thanks|thank you))?$/.test(t)) return "checkin-fine";
    if (/^(?:who are you|remind me who you are)$/.test(t)) return "checkin-who";
    return "";
}


const GUIDE_TALK_CHECKIN = [
    "\"Are you unhurt? You look like you have come a long way.\"",
    "\"{player}. Easy. Are you hurt?\"",
    "\"There you are. Breathe. Any wounds I should know about?\"",
    "\"I came as fast as I could. Are you in one piece?\""
];
const GUIDE_TALK_CHECKIN_REPLIES = [
    { label: "I'm fine", say: "I'm fine. Just a scratch.", stance: "friendly", guideTalk: "checkin-fine" },
    { label: "A bit rattled", say: "A bit rattled, if I'm honest.", stance: "guarded", guideTalk: "checkin-rattled" },
    { label: "Who are you?", say: "Who are you?", stance: "guarded", guideTalk: "checkin-who" }
];
const GUIDE_TALK_FINE_OK = [
    "\"Good. Then you are in better shape than most who come through here.\"",
    "\"Glad to hear it. I would rather not be burying anyone today.\"",
    "\"Good. Keep your guard up all the same.\""
];
const GUIDE_TALK_FINE_HURT = [
    "\"That is more than a scratch, {player}. Do not be proud about it.\"",
    "\"You are favouring that wound and calling it fine. I will let it go, this once.\"",
    "\"Fine, says the one who is hurt. Rest when you can.\""
];
const GUIDE_TALK_RATTLED = [
    "\"No shame in it. Take a breath. Rattled is only what alive feels like.\"",
    "\"It passes. It passes faster with something to do, in my experience.\"",
    "\"Then we go slowly. I am in no hurry.\""
];
const GUIDE_TALK_WHO = [
    "\"Fair question. I am {relation}.\"",
    "\"Someone who has been looking for you. I am {relation}.\"",
    "\"On your side, if nothing else. I am {relation}.\""
];
const GUIDE_TALK_HOOK_REACT = {
    friendly: ["\"Good. Then listen.\"", "\"Glad you see it that way.\"", "\"That is the spirit.\""],
    guarded: ["\"Fair enough. Careful keeps people alive here.\"", "\"Ask what you like. I will not take offence.\"", "\"Take your time. I will say it plainly.\""],
    hostile: ["\"Prickly. Fine. You will thank me when it counts.\"", "\"Say what you like. I am staying anyway.\"", "\"I have been called worse by better. Hear me out.\""]
};
const GUIDE_TALK_FIRST = [
    "\"So. What do you want to deal with first?\"",
    "\"Where do you want to begin?\"",
    "\"What weighs on you most right now?\""
];
const GUIDE_TALK_FIRST_REPLIES = [
    { label: "Get stronger", say: "I want to get stronger.", stance: "friendly", guideTalk: "first-strong" },
    { label: "Earn some coin", say: "I need coin.", stance: "friendly", guideTalk: "first-coin" },
    { label: "Ask about my lead", say: "Where can I start looking?", stance: "friendly", guideTalk: "first-lead" },
    { label: "What would you do?", say: "What would you do?", stance: "guarded", guideTalk: "first-suggest" }
];
const GUIDE_TALK_STRONG = [
    '"The trainers at {guildPlace} sell lessons. You can practise in the yard for free."',
    '"Try {guildPlace}. Lessons cost coin, but practice in the yard is free."'
];
const GUIDE_TALK_COIN = [
    '"Check the notice boards in the tavern, the inn, or the town hall. Innkeepers and cooks also hire hands."',
    '"Ask an innkeeper or a cook about work, or read a notice board. Bounties pay when you bring proof."'
];

// The blessing, said as the guide parts. Species voice (GUIDE_SPECIES_TEXT) is
// used when the player's species has one; the base advice is one more variant.
const GUIDE_TALK_PARTING = [
    '"Before you go, {player}: ask for a newcomer\'s blessing at the shrine in {chapelPlace}. It is free, binds you to no god, and can save your life once. After that, you would need a patron you have served, strong enough to bring you back."',
    '"Please stop at the shrine in {chapelPlace}, {player}. A newcomer\'s blessing is free, binds you to no god, and saves you once. I would like you to have that protection before you take a risk."'
];
const GUIDE_TALK_PARTING_SHOUT = [
    '"One thing, {player}: ask for a newcomer\'s blessing at the shrine in {chapelPlace}. Free, binds you to no god, saves your life once."'
];

const GUIDE_TALK_PARTING_PLAIN = [
    "\"Go well, {player}. You know where to find me.\"",
    "\"Mind yourself out there. I will be around.\"",
    "\"Good. Come back when you want company.\""
];

// Species voice for every guide-talk beat (the guide shares the player's
// species). Human, and any species not listed, use the base pools above. Voice
// follows NPC_SPECIES_NATIVE_SPEECH in cyoaftw-npc-data.js: plain common tongue,
// no invented words or phonetic spelling. Keys: checkin, fineOk, fineHurt,
// rattled, who, react{friendly,guarded,hostile}, first, strong, coin, parting
// (extra variants; GUIDE_SPECIES_TEXT.advice is added too), shout, plain, factIn
// (a short lead-in bubble before the lead/suggestion answers).
const GUIDE_TALK_VOICE = {
    elf: {
        checkin: ["\"You are unhurt? I saw you from the far wall, and came at once.\"", "\"{player}. Be still a moment. Tell me you are whole.\"", "\"I came as swiftly as my years allow. Are you harmed?\""],
        fineOk: ["\"Good. Few leave such a morning so well.\"", "\"That is welcome. I have no wish to mourn today.\""],
        fineHurt: ["\"That is not nothing, {player}. Pride is a poor bandage.\"", "\"You are hurt and call it fine. I shall not argue, this once.\""],
        rattled: ["\"There is no shame in it. Breathe. The feeling will pass, as feelings do.\"", "\"Then we will go slowly. I have the patience for both of us.\""],
        who: ["\"A fair question. I am {relation}.\"", "\"One who has waited some while to find you. I am {relation}.\""],
        react: { friendly: ["\"Good. Then attend.\"", "\"I am glad of it.\""], guarded: ["\"Caution is no insult. I will be plain.\"", "\"Ask what you will. I have time.\""], hostile: ["\"You are sharp with me. I will bear it, and you will understand later.\"", "\"Say what you wish. I shall remain.\""] },
        first: ["\"Where shall we begin?\"", "\"What would you have us see to first?\""],
        strong: ["\"Then {guildPlace}. Its trainers teach for coin, and its yard asks only your sweat. Skill is grown slowly; begin now.\"", "\"{guildPlace}. Teachers, and a yard to practise in. Patience will do the rest.\""],
        coin: ["\"The notice boards in the tavern, the inn and the town hall are never empty. Bounties pay on proof, and innkeepers and cooks will hire a willing hand.\"", "\"Work, and bounties. Read the boards, and ask the innkeeper or the cook. Coin buys lessons, and one day a road out.\""],
        parting: ["\"Before you go, {player}, I would ask one thing of you. The shrine in {chapelPlace}: ask there for a newcomer's blessing. It is free, it binds you to no god, and it will catch you once. After that, only a patron you have served can do as much, and only if they are strong enough.\""],
        shout: ["\"{player}, wait. Before you go far: the shrine in {chapelPlace}, and a newcomer's blessing. It costs nothing, binds you to no god, and saves you once.\""],
        plain: ["\"Go well, {player}. I shall be near.\"", "\"Walk carefully. You know where to find me.\""],
        factIn: ["\"Then hear it plainly.\"", "\"Patience, then. Here is the way.\""]
    },
    dwarf: {
        checkin: ["\"You hurt? You are walking stiff.\"", "\"{player}. Still standing? Good. Any wounds?\"", "\"Came as quick as my legs go. In one piece?\""],
        fineOk: ["\"Good. Sound as a laid stone.\"", "\"Fine is fine. No bill to pay, then.\""],
        fineHurt: ["\"That is not fine, that is a debt. Mind it, {player}.\"", "\"You are bleeding on my good opinion of you. Sit when you can.\""],
        rattled: ["\"No shame. Even good stone rings when struck. It settles.\"", "\"Then slow work. Slow work lasts.\""],
        who: ["\"I am {relation}. Plain enough.\"", "\"Someone who came looking, and not for nothing. I am {relation}.\""],
        react: { friendly: ["\"Good. Listen, then.\"", "\"Sensible. Now the work.\""], guarded: ["\"Careful is fine. I will be plain.\"", "\"Ask. I keep my answers short.\""], hostile: ["\"Prickly as a hedgehog. Fine. You will thank me.\"", "\"Say what you like. I am not leaving.\""] },
        first: ["\"So. What first?\"", "\"Where do we start the work?\""],
        strong: ["\"{guildPlace}. Trainers for coin, a yard for free. No shortcuts, only work.\"", "\"Then {guildPlace}. Pay the trainers, use the yard. Honest work builds honest strength.\""],
        coin: ["\"The boards in the tavern, the inn and the town hall. Honest work, honest pay, bounties on proof. Innkeepers and cooks hire hands too.\"", "\"Work and bounties. Read the boards, ask the innkeeper. Coin buys lessons; lessons buy you another day.\""],
        parting: ["\"One thing before you go, and mark it. Shrine in {chapelPlace}, newcomer's blessing. Free, no god owns you for it, and it saves you once. After that only a patron you have served, and only if they have the strength.\""],
        shout: ["\"{player}! Hold. Shrine in {chapelPlace}, newcomer's blessing, before anything else. Free, ties you to no god, saves you once.\""],
        plain: ["\"Go on, then. I will be here.\"", "\"Mind yourself out there. I will be around.\""],
        factIn: ["\"Here is the way, then.\"", "\"Plain as I can make it.\""]
    },
    halfling: {
        checkin: ["\"Oh, there you are! Are you hurt? You look peaky.\"", "\"{player}! Sit, sit. Are you hurt anywhere?\"", "\"Came as fast as my feet would carry me. Are you all in one piece, dear?\""],
        fineOk: ["\"Oh, thank goodness. A scratch heals, and a fright I can put a kettle on for.\"", "\"Good. Then no harm done, and supper is still on.\""],
        fineHurt: ["\"That is not nothing, {player}. Do mind it; I will not have you bleeding on an empty stomach.\"", "\"Fine, says the one who is wincing. Sit when you can, hm?\""],
        rattled: ["\"Of course you are. Nobody is steady after that. A warm drink and a quiet minute work wonders.\"", "\"Then we go gently. No hurry at all.\""],
        who: ["\"Oh, forgive me, I forget myself. I am {relation}.\"", "\"A friend, I hope. I am {relation}.\""],
        react: { friendly: ["\"Lovely. Now, listen.\"", "\"That is the spirit.\""], guarded: ["\"Fair enough, ask away. I do not mind a bit.\"", "\"Take your time, dear. I will keep it simple.\""], hostile: ["\"Oh, prickly! I have met worse at a harvest fair. Hear me out anyway.\"", "\"Say what you like. I am not going anywhere.\""] },
        first: ["\"Now, what shall we see to first?\"", "\"Where would you like to start?\""],
        strong: ["\"{guildPlace}, then. Trainers who will teach you for coin, and a yard to practise in. Mind you eat well while you do.\"", "\"{guildPlace}. Teachers and a yard to practise in. Little by little, and you will surprise yourself.\""],
        coin: ["\"There is always a job on a board somewhere: the tavern, the inn, the town hall. Innkeepers and cooks hire hands too, and bounties pay on proof.\"", "\"Work, dear, and bounties. Read the boards and ask the cook. Coin buys lessons, and lessons are worth it.\""],
        parting: ["\"Oh, before you go! The shrine in {chapelPlace}: ask for a newcomer's blessing. It is free, it ties you to no god, and it saves you once. After that, only a patron you have served can do the same, if they are strong enough.\""],
        shout: ["\"{player}! Wait! The shrine in {chapelPlace}, a newcomer's blessing, before you go far. Free, ties you to no god, and it saves you once.\""],
        plain: ["\"Off you go, then. Do come back for a cup of something.\"", "\"Mind yourself, dear. I will be about.\""],
        factIn: ["\"Right, here is how it goes.\"", "\"Now, listen close.\""]
    },
    orc: {
        checkin: ["\"You hurt? Speak plain.\"", "\"{player}. Still on your feet. Wounds?\"", "\"I came fast. Say it. Are you hurt?\""],
        fineOk: ["\"Good. Strong.\"", "\"Good. No blood owed, then.\""],
        fineHurt: ["\"That is not fine. That is blood. Tend it.\"", "\"You bleed and say fine. Brave, or stupid. Tend it anyway.\""],
        rattled: ["\"No shame. Everyone shakes after. Breathe it out.\"", "\"Then we go slow. Slow is alive.\""],
        who: ["\"I am {relation}. That is all you need.\"", "\"Someone who came for you. I am {relation}.\""],
        react: { friendly: ["\"Good. Listen.\"", "\"Good answer.\""], guarded: ["\"Careful is fine. Ask.\"", "\"I will keep it short. Ask what you want.\""], hostile: ["\"Hot-blooded. Good. Listen anyway.\"", "\"Snarl if you like. I stay.\""] },
        first: ["\"What first?\"", "\"Where do we begin?\""],
        strong: ["\"{guildPlace}. Trainers, and a yard to bleed in. Hit things there, not in the street.\"", "\"{guildPlace}. Pay a trainer. Sweat in the yard. Be strong.\""],
        coin: ["\"Take work. The boards in the tavern, the inn and the town hall. Bounties pay for proof. Innkeepers and cooks hire hands.\"", "\"Boards. Bounties. Hire out your arm. Coin buys lessons.\""],
        parting: ["\"Before you go. Shrine in {chapelPlace}. Ask for the newcomer's blessing. Free, binds you to no god, saves you once. Do not skip it.\""],
        shout: ["\"{player}! Stop. Shrine in {chapelPlace}. Newcomer's blessing, now. Free. Saves you once.\""],
        plain: ["\"Go. I will be around.\"", "\"Fight well. Come back alive.\""],
        factIn: ["\"Hear it.\"", "\"Plain words, then.\""]
    },
    dragonborn: {
        checkin: ["\"Are you unhurt? You carry yourself stiffly.\"", "\"{player}. Stand straight and tell me: are you wounded?\"", "\"I came the moment I saw you. Are you whole?\""],
        fineOk: ["\"Good. Our line is not so easily broken.\"", "\"Good. I expected no less.\""],
        fineHurt: ["\"That is no scratch, {player}. Pride is no armour. See to it.\"", "\"You say fine, and bleed. I shall allow it this once.\""],
        rattled: ["\"It is no dishonour to be shaken. Master it, and it becomes strength.\"", "\"Then we proceed with care. Honour is patient.\""],
        who: ["\"You ask rightly. I am {relation}.\"", "\"One who sought you out, as duty demands. I am {relation}.\""],
        react: { friendly: ["\"Good. Then attend.\"", "\"Well said.\""], guarded: ["\"Caution is no weakness. I will speak plainly.\"", "\"Ask. I will answer what I can.\""], hostile: ["\"Sharp words. I have heard worse. Attend regardless.\"", "\"Speak as you like. I remain.\""] },
        first: ["\"Where shall we begin?\"", "\"What demands your attention first?\""],
        strong: ["\"{guildPlace}. Its trainers teach, and its yard rewards sweat. Strength is built, not given.\"", "\"Then {guildPlace}. Pay the trainers and use the yard. A line grows strong by its labour.\""],
        coin: ["\"The notice boards in the tavern, the inn and the town hall always list work. Bounties pay on proof. Innkeepers and cooks hire hands as well.\"", "\"Take work and bounties. Read the boards and ask the innkeeper. Coin pays for training, and for the way onward.\""],
        parting: ["\"Before you depart, mark this. The shrine in {chapelPlace}: ask there for a newcomer's blessing. It is free, it binds you to no god, and it will restore you once. Beyond that, only a patron you have served, and only if they are strong enough.\""],
        shout: ["\"{player}! Halt. The shrine in {chapelPlace}, and a newcomer's blessing, before you go far. It costs nothing, binds you to no god, and saves you once.\""],
        plain: ["\"Go, then, and carry yourself well.\"", "\"Walk with honour. You know where to find me.\""],
        factIn: ["\"Attend, then.\"", "\"Hear it, and remember it.\""]
    },
    goblin: {
        checkin: ["\"Hurt? Hurt? You look rough, yes. You whole?\"", "\"{player}! Quick, quick, let me look. Any holes in you?\"", "\"Came running, yes. Anything bleeding that should not be?\""],
        fineOk: ["\"Good, good! Whole is useful. Whole is very useful.\"", "\"Good. Fine is the best kind of luck.\""],
        fineHurt: ["\"Fine? That is not fine, that is leaking. Mind it, {player}.\"", "\"You say fine, I see red. I will not say a word. Almost.\""],
        rattled: ["\"Oh, yes, rattled, who is not? Shaky is only alive being loud.\"", "\"Slow then, slow. No hurry. Well, a little hurry.\""],
        who: ["\"Me? Useful, that is who. I am {relation}.\"", "\"A friend, a good one. I am {relation}.\""],
        react: { friendly: ["\"Good, good. Listen, listen.\"", "\"Clever. You will go far.\""], guarded: ["\"Careful, yes. Ask, ask. I answer straight, mostly.\"", "\"Take your time. I have plenty.\""], hostile: ["\"Oooh, snappy. Fine. You will thank me later.\"", "\"Snap all you like. I stay.\""] },
        first: ["\"So, so. What first?\"", "\"Where do we start, clever one?\""],
        strong: ["\"{guildPlace}. Trainers who teach for coin, and a yard to practise in for free. Free is best!\"", "\"{guildPlace}, yes. Teachers, and a yard to bruise yourself in. Cheaper than a real fight.\""],
        coin: ["\"The boards! Tavern, inn, town hall, always something wanted. Bounties pay on proof. Cooks and innkeepers hire hands too.\"", "\"Work and bounties, yes. Read the boards, ask the cook. Coin buys lessons, and lessons buy another day.\""],
        parting: ["\"Wait, wait, before you go. The shrine in {chapelPlace}: ask for a newcomer's blessing. Free! Ties you to no god, and it saves you once. After, only a patron you have served, if they are strong enough.\""],
        shout: ["\"{player}! Wait, wait! Shrine in {chapelPlace}, newcomer's blessing, before you go far. Free, no god, saves you once.\""],
        plain: ["\"Off you go, then. I will be about, yes.\"", "\"Mind yourself. Stay useful.\""],
        factIn: ["\"Listen, listen.\"", "\"Here is how, yes.\""]
    },
    lizardfolk: {
        checkin: ["\"You are hurt? You walk like it.\"", "\"{player}. You stand. Any wounds?\"", "\"We came fast. You are whole?\""],
        fineOk: ["\"Good. Whole is strong.\"", "\"Good. No blood to tend.\""],
        fineHurt: ["\"That is not fine. That is blood. Tend it.\"", "\"You say fine. We see the wound. Tend it.\""],
        rattled: ["\"It passes. Breathe. The hunt is quiet now.\"", "\"Then slow. Slow is safe.\""],
        who: ["\"I am {relation}. That is enough.\"", "\"I came for you. I am {relation}.\""],
        react: { friendly: ["\"Good. Listen.\"", "\"Good. Now.\""], guarded: ["\"Ask. We answer.\"", "\"Careful is good. We speak plainly.\""], hostile: ["\"You snarl. It is fine. Listen.\"", "\"Snarl if you like. We stay.\""] },
        first: ["\"What first?\"", "\"Where do we start?\""],
        strong: ["\"{guildPlace}. Trainers and a yard. You pay, you learn, you grow strong.\"", "\"{guildPlace}. Teachers there. A yard to practise. Strength is earned.\""],
        coin: ["\"Boards in the tavern, the inn, the town hall. Work and bounties. Bounties pay for proof. Cooks and innkeepers hire hands.\"", "\"Work. Bounties. Read the boards. Coin buys lessons.\""],
        parting: ["\"Before you go. The shrine in {chapelPlace}. Ask for the newcomer's blessing. It is free. It binds you to no god. It saves you once. After, only a patron you have served, if strong enough.\""],
        shout: ["\"{player}. Stop. The shrine in {chapelPlace}. Newcomer's blessing, first. Free. Saves you once.\""],
        plain: ["\"Go. We will be near.\"", "\"Hunt well. Return.\""],
        factIn: ["\"Listen.\"", "\"We tell it plain.\""]
    },
    kobold: {
        checkin: ["\"You are hurt? We saw you, yes, from here! Are you whole?\"", "\"{player}! Oh, good, there. Any wounds? Please say no.\"", "\"We came so fast! Are you all in one piece?\""],
        fineOk: ["\"Oh, good! Good good good. Whole is best.\"", "\"Yes, fine, wonderful. We worried. A little.\""],
        fineHurt: ["\"That is not fine, {player}! That is bleeding! Please, mind it.\"", "\"You say fine, but we see it. Please sit. Please.\""],
        rattled: ["\"Oh, yes, of course. We are rattled too. Everyone is. Breathe.\"", "\"Then slowly. We will go slowly. No trouble at all.\""],
        who: ["\"We came to help. Truly. I am {relation}.\"", "\"A friend, we hope. I am {relation}.\""],
        react: { friendly: ["\"Oh, good! Listen, then, please.\"", "\"Yes, yes, that is it.\""], guarded: ["\"Ask anything. We will answer, we promise.\"", "\"Careful is wise. Careful keeps us alive.\""], hostile: ["\"Oh, you are cross. That is fine, that is fine. Please listen.\"", "\"Say what you like. We stay. We insist, a little.\""] },
        first: ["\"So, what first? Please say.\"", "\"Where do we begin? We will follow.\""],
        strong: ["\"{guildPlace}, please. Trainers for coin, a yard for nothing. Strong is safer.\"", "\"{guildPlace}. Teachers and a yard. Strong is how we survive.\""],
        coin: ["\"The boards! Tavern, inn, town hall. Work and bounties. Bounties pay on proof. Cooks and innkeepers hire hands, yes.\"", "\"Work, bounties. Read the boards, ask the cook. Coin buys lessons, and lessons keep us alive.\""],
        parting: ["\"Oh, before you go, please! The shrine in {chapelPlace}: ask for the newcomer's blessing. Free, ties you to no god, saves you once. Then only a patron you have served, if they are strong enough.\""],
        shout: ["\"{player}! Please, wait! The shrine in {chapelPlace}, the newcomer's blessing, before you go far! Free, no god, saves you once!\""],
        plain: ["\"Go, go, but stay safe. We will be here.\"", "\"Be careful, please. Come back.\""],
        factIn: ["\"Please listen, yes.\"", "\"We will say it plain.\""]
    }
};

// The pool for a beat in the guide's (= the player's) species voice, else base.
function _guideTalkVoicePool(key, base, sub) {
    const v = GUIDE_TALK_VOICE[_guideOwnSpeciesKey()];
    if (!v || !v[key]) return base;
    const entry = sub ? v[key][sub] : v[key];
    return Array.isArray(entry) && entry.length ? entry : base;
}

// ── GUIDE INFLECTION ───────────────────────────────────────────────────────
// How the guide sounds. A base inflection per backstory (their temperament in
// speech), then up to two situational shifts that come from the live state
// (see getGuideShifts in the engine). The text goes to the AI as direction
// (see getGuideContextLine); when the AI is off, a short species-voiced lead
// line stands in for the shift (GUIDE_SHIFT_LEADS). No invented languages:
// this is rhythm, warmth and word choice in the common tongue.
const GUIDE_INFLECTION_BASE = {
    "coming-of-age": "warm, dry and a little teasing; gentle pride, jokes that land softly, never mocking",
    "revenge": "low, quiet and clipped; says little, never raises their voice, loyal without being soft about it",
    "redemption": "calm, unhurried and gentle; plain words, comfortable with a pause, never flattering",
    "missing-kin": "careful and urgent; lowers their voice, keeps checking the room, wants answers more than small talk",
    "fortune": "quick, wry and playful; talks with a grin, enjoys the angle, light about serious things",
    "exile": "hushed and watchful; short sentences, an eye on the door, trusts slowly",
    "calling": "serene and a little reverent; speaks as if the words matter, patient with questions",
    "open-road": "easygoing, curious and cheerful; happy to chat, never pushy, laughs easily",
    "homecoming": "warm, a little nosy and fond; chatty, full of local news, softens when they see you tired",
    "good-offer": "friendly, practical and unhurried; says what the work is and what it is not, glad to answer questions"
};

const GUIDE_INFLECTION_SHIFTS = {
    pursued: "Trouble from the player's past is close, so you are tighter and more watchful: shorter sentences, a glance toward the door.",
    hurt: "The player is hurt, so you slow down and soften: shorter sentences, concern under the surface, no jokes at their expense.",
    firm: "The player has been curt with you, so you stay patient but firmer: no grovelling, no picking a fight.",
    night: "It is night, so you keep your voice low and speak a little slower.",
    success: "The player has been doing well lately, so you ease up a little: more warmth, a touch of pride, a looser rhythm.",
    gap: "It has been a while since you last spoke, so you are relaxed and unhurried, like picking up an old thread."
};
const GUIDE_SHIFT_ORDER = ["pursued", "hurt", "firm", "night", "success", "gap"];

// Direction text for the AI: base inflection plus up to two shifts.
function getGuideInflection(archetypeId, shifts) {
    const base = GUIDE_INFLECTION_BASE[archetypeId] || "plain, steady and friendly";
    const list = Array.isArray(shifts) ? shifts.slice(0, 2) : [];
    const extra = list.map(function (k) { return GUIDE_INFLECTION_SHIFTS[k]; }).filter(function (x) { return !!x; });
    return "Your usual manner is " + base + "." + (extra.length ? " " + extra.join(" ") : "");
}

// Scripted stand-ins for a shift when the AI is off (or its line was rejected).
// One short line each, in the guide's species manner. No "firm" line: it only
// matters in free speech.
const GUIDE_SHIFT_LEADS = {
    human: {
        hurt: "\"You look worse than you let on.\"",
        pursued: "\"Keep your eyes open. Trouble from your past is close.\"",
        night: "\"Keep your voice down, it is late.\"",
        success: "\"You are doing better than I expected, and I expected plenty.\"",
        gap: "\"It has been a while. Good to see you again.\""
    },
    elf: {
        hurt: "\"You carry that wound badly, and hide it worse.\"",
        pursued: "\"Stay watchful. Your past is nearer than you would like.\"",
        night: "\"It is late. Let us speak softly.\"",
        success: "\"You have done well. I am glad to say it.\"",
        gap: "\"It has been some time. I am glad to see you.\""
    },
    dwarf: {
        hurt: "\"You look rough. That wants tending. Do not be stubborn.\"",
        pursued: "\"Eyes up. Your old trouble is close.\"",
        night: "\"Late. Keep it short and quiet.\"",
        success: "\"Good work so far. Do not let it go to your head.\"",
        gap: "\"Been a while. Good.\""
    },
    halfling: {
        hurt: "\"Look at you, pale as milk. Sit when you can.\"",
        pursued: "\"Quietly now, and keep glancing back. Your old trouble is near.\"",
        night: "\"Late, isn't it? Let us keep it hushed.\"",
        success: "\"Look at you go! I am proud of you, truly.\"",
        gap: "\"There you are again! It has been ages.\""
    },
    orc: {
        hurt: "\"You are hurt. Do not hide it. Heal before you fight.\"",
        pursued: "\"Stay sharp. Your enemies are close.\"",
        night: "\"Night. Speak low.\"",
        success: "\"You fight well. I see it.\"",
        gap: "\"You return. Good.\""
    },
    dragonborn: {
        hurt: "\"You are wounded. Do not insult me by hiding it.\"",
        pursued: "\"Be vigilant. Those who follow you are near.\"",
        night: "\"The hour is late. Speak quietly.\"",
        success: "\"You acquit yourself well. I note it.\"",
        gap: "\"You return. Well met again.\""
    },
    goblin: {
        hurt: "\"Hurt, hurt. You look rough, yes. Sit, heal.\"",
        pursued: "\"Eyes open, eyes open. Old trouble is close, yes.\"",
        night: "\"Night, night. Quiet voices.\"",
        success: "\"Useful, you are. Good.\"",
        gap: "\"Back again, yes. Good.\""
    },
    lizardfolk: {
        hurt: "\"You are hurt. Rest. We watch.\"",
        pursued: "\"Watch. The ones hunting you are near.\"",
        night: "\"Night. Speak low.\"",
        success: "\"You hunt well. We see.\"",
        gap: "\"You return. Good.\""
    },
    kobold: {
        hurt: "\"You are hurt! We worry. Please rest.\"",
        pursued: "\"Careful, careful. We think your hunters are near.\"",
        night: "\"It is night. We whisper.\"",
        success: "\"You do well! We are glad.\"",
        gap: "\"You are back! We are glad.\""
    }
};

// ── Guide voices for the Catfolk, Wolfkin and Satyr (playable). Same facts as
// the base lines; only the voice changes. Merged into the tables above.
const GUIDE_SPECIES_LINES_EXTRA = {
    "coming-of-age": {
        catfolk: {
            relation: "an old family friend from the caravan road who promised to see you started",
            opening: "\"{player}, there you are. I told your family I would see you properly started, and I always collect on a promise, mine included. Walk with me. Slowly. There is no sense in being hurried when we can be clever.\""
        },
        wolfkin: {
            relation: "a pack elder who swore to see you started",
            opening: "\"{player}. You are here. Good. I gave your pack my word that I would see you started, and a pack's word is not broken. Stay close, watch the street, and learn the place before it learns you.\""
        },
        satyr: {
            relation: "a family friend with a bottomless flask who swore to see you started",
            opening: "\"{player}! At last! I promised your family I would see you started, and I always keep a promise, provided it comes with a drink. Come on, come on, the day is wasting and so is the wine!\""
        }
    },
    "revenge": {
        catfolk: {
            relation: "an old companion of the road who shares your grudge and keeps its accounts",
            opening: "\"{player}. Softly. A trace of {quarry} turned up at {leadPlace}. We ask nicely, we pay for quiet, and nobody learns who is asking. A cat does not pounce until she is sure.\""
        },
        wolfkin: {
            relation: "a packmate who hunts the same quarry you do",
            opening: "\"{player}. Low voice. {quarry} left a trail that ends near {leadPlace}. We follow it quietly, we tell no one, and when we find them, we finish it.\""
        },
        satyr: {
            relation: "an old drinking companion who shares your grudge and a very long memory",
            opening: "\"{player}, shh, come closer. A whisper says {quarry} has been seen at {leadPlace}. We ask softly, we do not say who is asking, and when the time comes we make a terrible joke of them.\""
        }
    },
    "redemption": {
        catfolk: {
            relation: "an old troupe elder who offered you a way to begin making amends",
            opening: "\"{player}. You came. I was not sure you would. Amends are a debt like any other, and I keep honest accounts. This town has people who need help, and a shrine that is pleasant to sit in. Start at {leadPlace}.\""
        },
        wolfkin: {
            relation: "a pack elder who offered you a way back to honour",
            opening: "\"{player}. You came. That is the first hard step. A hunter pays what he owes. This town has folk who need help and a shrine worth sitting in. Begin at {leadPlace}.\""
        },
        satyr: {
            relation: "a patient old reveller who offered you a way to begin making amends, and a cup besides",
            opening: "\"{player}, you came! I was half sure you would not, and half sure you would, so I brought wine either way. Amends first, wine after. This town has folk who need help, and a shrine that is good to sit in. Start at {leadPlace}.\""
        }
    },
    "missing-kin": {
        catfolk: {
            relation: "a close friend of the troupe who wants answers as badly as you do",
            opening: "\"{player}, here, quickly. The clerk at {leadPlace} keeps a ledger of who comes and goes, and clerks adore being asked nicely, or paid. If {who} passed through, a name is in it.\""
        },
        wolfkin: {
            relation: "a packmate who wants answers as badly as you do",
            opening: "\"{player}. Here. The clerk at {leadPlace} keeps a ledger of who comes and goes. If {who} passed through, the name is written. We read it, and then we follow the trail.\""
        },
        satyr: {
            relation: "a dear friend who wants answers as badly as you do and would sooner be laughing",
            opening: "\"{player}, over here! The clerk at {leadPlace} keeps a ledger of who comes and goes, and clerks cannot resist a charming visitor. If {who} passed through, a name is in it. Let us be charming.\""
        }
    },
    "fortune": {
        catfolk: {
            relation: "a fellow chancer, sleek and sly, who got you into this",
            opening: "\"{player}. Well, well. Here we are. More coin in this town than either of us has seen in a year, and someone always pays for a quiet pair of paws. Begin at {leadPlace}, and keep an eye on your purse.\""
        },
        wolfkin: {
            relation: "a fellow wanderer who talked you into this on a hard winter",
            opening: "\"{player}. We are here. The hunt was poor at home, and this town has coin. Someone always pays for a steady hand. Begin at {leadPlace}, and watch who watches you.\""
        },
        satyr: {
            relation: "a fellow chancer and the reason you are here at all",
            opening: "\"{player}! Look at this place! More coin than either of us has seen in a year, and somebody always pays for a pair of nimble hands. Start at {leadPlace}, and do not let me near the dice.\""
        }
    },
    "exile": {
        catfolk: {
            relation: "a friend from the road who vouched for you when no troupe would",
            opening: "\"Softly, {player}. Nobody followed us, and I checked twice, because I always do. This town asks few questions, so give no true name where you can avoid it. {leadPlace} is a good place to start being nobody.\""
        },
        wolfkin: {
            relation: "a former packmate who stood by you when the pack cast you out",
            opening: "\"Easy, {player}. Nobody followed. I watched the road. This town asks few questions, so use no true name if you can help it. {leadPlace} is a good place to begin again.\""
        },
        satyr: {
            relation: "a friend who vouched for you when everyone else was shouting",
            opening: "\"Easy, {player}, easy. Nobody followed, and I looked behind every barrel. This town asks few questions, so give no true name. {leadPlace} is a lovely place to be nobody for a while.\""
        }
    },
    "calling": {
        catfolk: {
            relation: "someone who understands the sign that drew you here, and has seen its like on the road",
            opening: "\"{player}. You followed it all the way. I have seen a sign like yours once, in another town. They say an old shrine tied to {leadPlace} still answers. Come, let us see whether it answers you.\""
        },
        wolfkin: {
            relation: "a pack seer who understands the sign that drew you here",
            opening: "\"{player}. You followed the sign to its end. Good. They say an old shrine tied to {leadPlace} still answers. We will go and see whether it answers you.\""
        },
        satyr: {
            relation: "someone who understands the sign that drew you here, and found it rather exciting",
            opening: "\"{player}! You followed it all the way here, marvellous! Folk say an old shrine tied to {leadPlace} still answers. Come along, let us see whether it answers you. I will bring the wine, in case it does not.\""
        }
    }
};

const GUIDE_SPECIES_TEXT_EXTRA = {
    catfolk: {
        mission: "\"Three things, {player}, and no need to rush any of them. Grow stronger: {guildPlace} keeps trainers and a quiet yard. Earn coin: the notice boards are never empty. And follow your lead, carefully; it will keep.\"",
        missionGuild: "\"Three things, {player}, and no need to rush any of them. Grow stronger: the trainers and the quiet yard there are for that. Earn coin: the notice boards are never empty. And follow your lead, carefully.\"",
        advice: "\"One hard thing, and I will say it plainly: death is final in this country, even for cats. Slip into the shrine in {chapelPlace} and ask for a newcomer's blessing before anything else. It is free, it binds you to no god, and it saves you once. After that, only a patron you have served can bring you back, and only if they are strong enough. I will walk you there, if you like.\""
    },
    wolfkin: {
        mission: "\"Three things, {player}. Grow stronger: {guildPlace} has trainers and a yard. Earn coin: the boards always have work. And follow your lead, for a trail goes cold.\"",
        missionGuild: "\"Three things, {player}. Grow stronger: the trainers and the yard there are for that. Earn coin: the boards always have work. And follow your lead, for a trail goes cold.\"",
        advice: "\"One hard thing. Death is final in this country. Go to the shrine in {chapelPlace} and ask for a newcomer's blessing, first. It is free, it binds you to no god, and it saves you once. After that, only a patron you have served can bring you back, and only if they are strong enough. I will walk you there.\""
    },
    satyr: {
        mission: "\"Three things, {player}, and then, I hope, a drink. Grow stronger: {guildPlace} has trainers and a yard to practise in. Earn coin: the boards are always full of work. And follow your lead, before it wanders off.\"",
        missionGuild: "\"Three things, {player}, and then, I hope, a drink. Grow stronger: the trainers and the yard there are for that. Earn coin: the boards are always full of work. And follow your lead, before it wanders off.\"",
        advice: "\"One serious thing, and I do not say that often: death is final in this country. Pop into the shrine in {chapelPlace} and ask for a newcomer's blessing, before anything else. It is free, it binds you to no god, and it saves you once. After that, only a patron you have served can bring you back, and only if they are strong enough. I will walk you over. Then wine.\""
    }
};

const GUIDE_TALK_VOICE_EXTRA = {
    catfolk: {
        checkin: ["\"You are not hurt? I came as soon as I smelled trouble.\"", "\"{player}. Hold still. Tell me you are whole.\"", "\"I saw you from the rooftops. Are you hurt?\""],
        fineOk: ["\"Good. I dislike mourning on an empty stomach.\"", "\"Splendid. Then no harm done, and we need not talk of it.\""],
        fineHurt: ["\"That is not nothing, {player}. A bruise is a debt you pay later.\"", "\"Fine, says the one who is limping. I shall not argue.\""],
        rattled: ["\"Of course. Breathe. Nobody is steady after that.\"", "\"Then we go gently. A cat knows when to sit still.\""],
        who: ["\"Forgive me, I forget manners. I am {relation}.\"", "\"A friend, I hope. I am {relation}.\""],
        react: { friendly: ["\"Lovely. Now, listen.\"", "\"Good. That is the spirit.\""], guarded: ["\"Wary is wise. Ask what you like.\"", "\"I will keep it short, and you may keep your distance.\""], hostile: ["\"Hissing already? Fine. Hear me out anyway.\"", "\"Claws in, please. I am here to help.\""] },
        first: ["\"What shall we see to first?\"", "\"Where shall we begin?\""],
        strong: ["\"{guildPlace}, then. Trainers who teach for coin, and a yard to stretch in. Do not skip the stretching.\"", "\"{guildPlace}. Teachers and a quiet yard. Little by little, and you will surprise yourself.\""],
        coin: ["\"There is always a job on a board: the tavern, the inn, the town hall. Innkeepers and cooks hire hands too, and bounties pay on proof.\"", "\"Work, and bounties. Read the boards and ask the cook. Coin buys lessons, and lessons are worth it.\""],
        parting: ["\"Before you go. The shrine in {chapelPlace}: ask for a newcomer's blessing. It is free, it ties you to no god, and it saves you once. After that, only a patron you have served can do the same, if they are strong enough.\""],
        shout: ["\"{player}! Wait! The shrine in {chapelPlace}, a newcomer's blessing, before you go far. Free, ties you to no god, and it saves you once.\""],
        plain: ["\"Off you go, then. Come back for a saucer of something.\"", "\"Mind yourself. I will be about.\""],
        factIn: ["\"Now, here is how it goes.\"", "\"Listen closely.\""]
    },
    wolfkin: {
        checkin: ["\"You are hurt? Say it.\"", "\"{player}. I smelled blood. Is it yours?\"", "\"I came fast. Are you wounded?\""],
        fineOk: ["\"Good. The pack is whole, then.\"", "\"Good. No blood owed.\""],
        fineHurt: ["\"That is not fine. That is blood. Tend it.\"", "\"You bleed and say fine. Stubborn. Tend it anyway.\""],
        rattled: ["\"No shame. Every hunter shakes after. Breathe it out.\"", "\"Then we go slowly. Slow is alive.\""],
        who: ["\"I am {relation}. That is all you need.\"", "\"One who came for you. I am {relation}.\""],
        react: { friendly: ["\"Good. Listen.\"", "\"Good answer.\""], guarded: ["\"Careful is fine. Ask.\"", "\"I will be brief. Ask what you want.\""], hostile: ["\"Growl if you must. Hear me anyway.\"", "\"Hot-blooded. Fine. Listen.\""] },
        first: ["\"What first?\"", "\"Where do we begin?\""],
        strong: ["\"{guildPlace}. Trainers, and a yard to run in. Work hard there, not in the street.\"", "\"{guildPlace}. Pay a trainer. Sweat in the yard. Get strong.\""],
        coin: ["\"Take work. The boards in the tavern, the inn and the town hall. Bounties pay on proof. Innkeepers and cooks hire hands.\"", "\"Boards. Bounties. Hire out your strength. Coin buys lessons.\""],
        parting: ["\"Before you go. Shrine in {chapelPlace}. Ask for the newcomer's blessing. Free, binds you to no god, saves you once. Do not skip it.\""],
        shout: ["\"{player}! Stop. Shrine in {chapelPlace}. Newcomer's blessing, now. Free. Saves you once.\""],
        plain: ["\"Go. I will watch the road.\"", "\"Hunt well. Come back alive.\""],
        factIn: ["\"Hear it.\"", "\"Plain words, then.\""]
    },
    satyr: {
        checkin: ["\"Are you hurt?! I ran the whole way, and I never run!\"", "\"{player}! Sit, sit. Tell me nothing is broken.\"", "\"I heard the noise, I came running. Are you hurt?\""],
        fineOk: ["\"Oh, thank goodness. A scratch heals, and a fright I can drown in wine.\"", "\"Good! Then no harm done, and the evening is still young.\""],
        fineHurt: ["\"That is not nothing, {player}! Do mind it, I will not have you bleeding on my good boots.\"", "\"Fine, says the one who is wincing. I shall pretend to believe you.\""],
        rattled: ["\"Of course you are. Nobody is steady after that. A quiet minute and a cup will help.\"", "\"Then we go gently. No hurry. I am very good at hurrying slowly.\""],
        who: ["\"Forgive me, I forget my manners. I am {relation}.\"", "\"A friend, I hope! I am {relation}.\""],
        react: { friendly: ["\"Lovely! Now, listen.\"", "\"Splendid. That is the spirit.\""], guarded: ["\"Wary? Wise. Ask away, I will not take offence.\"", "\"Take your time. I will keep it simple, for once.\""], hostile: ["\"Oh, prickly! I have met worse at a feast. Hear me anyway.\"", "\"Scowl all you like. I will say my piece.\""] },
        first: ["\"Now, what first?\"", "\"Where shall we begin?\""],
        strong: ["\"{guildPlace}, then. Trainers for coin, and a yard to practise in. Stretch first. Hooves are not forgiving.\"", "\"{guildPlace}. Teachers and a yard. Little by little, and you will surprise yourself.\""],
        coin: ["\"There is always a job on a board: the tavern, the inn, the town hall. Innkeepers and cooks hire hands too, and bounties pay on proof.\"", "\"Work and bounties, my friend. Read the boards and charm the cook. Coin buys lessons, and lessons are worth it.\""],
        parting: ["\"Oh, before you go! The shrine in {chapelPlace}: ask for a newcomer's blessing. It is free, it ties you to no god, and it saves you once. After that, only a patron you have served can do the same, if they are strong enough.\""],
        shout: ["\"{player}! Wait! The shrine in {chapelPlace}, a newcomer's blessing, before you go far. Free, ties you to no god, and it saves you once.\""],
        plain: ["\"Off you go, then! Come back for a cup, and a story.\"", "\"Mind yourself, friend. I will be about, probably near the wine.\""],
        factIn: ["\"Right, here is how it goes.\"", "\"Now, listen, because I will only say it once. Possibly twice.\""]
    }
};

const GUIDE_SHIFT_LEADS_EXTRA = {
    catfolk: {
        hurt: "\"You wear that wound badly, and hide it worse.\"",
        pursued: "\"Quietly. Old trouble is close, and it has not noticed us yet.\"",
        night: "\"It is late. Cats keep quiet hours, and so should you.\"",
        success: "\"Look at you. Better than I expected, and I expected a great deal.\"",
        gap: "\"There you are. I wondered when you would turn up.\""
    },
    wolfkin: {
        hurt: "\"You are hurt. Do not hide it. Heal before you fight.\"",
        pursued: "\"Stay sharp. Your old enemies are close. I smell them.\"",
        night: "\"Night. Speak low.\"",
        success: "\"You hunt well. I see it.\"",
        gap: "\"You return. Good.\""
    },
    satyr: {
        hurt: "\"You look dreadful, darling. Sit down before you fall down.\"",
        pursued: "\"Quietly now, and keep glancing back. Your old trouble is near.\"",
        night: "\"It is late, and I have just poured a drink, so speak softly.\"",
        success: "\"Look at you go! I am proud, and a little jealous.\"",
        gap: "\"There you are! It has been ages, and I have run out of gossip.\""
    }
};

(function mergeGuideSpeciesExtras() {
    Object.keys(GUIDE_SPECIES_LINES_EXTRA).forEach(function (arch) {
        GUIDE_SPECIES_LINES[arch] = GUIDE_SPECIES_LINES[arch] || {};
        Object.assign(GUIDE_SPECIES_LINES[arch], GUIDE_SPECIES_LINES_EXTRA[arch]);
    });
    Object.assign(GUIDE_SPECIES_TEXT, GUIDE_SPECIES_TEXT_EXTRA);
    Object.assign(GUIDE_TALK_VOICE, GUIDE_TALK_VOICE_EXTRA);
    Object.assign(GUIDE_SHIFT_LEADS, GUIDE_SHIFT_LEADS_EXTRA);
})();

function getGuideShiftLead(shifts, speciesKey) {
    const set = GUIDE_SHIFT_LEADS[String(speciesKey || "").toLowerCase()] || GUIDE_SHIFT_LEADS.human;
    const list = Array.isArray(shifts) ? shifts : [];
    for (let i = 0; i < list.length; i++) {
        if (set[list[i]]) return set[list[i]];
    }
    return "";
}

function _guideTalkPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// The engine owns the next beat, facts, options, and pacing. Delivery choices
// are complete approved bubbles; the AI can return only their numeric index.
function _buildGuideTalkBeat(beatId, backstory, ctx) {
    const c = ctx || {};
    const map = getBackstoryFillMap(backstory);
    if (c.relation) map.relation = c.relation;
    const f = function (t) { return _spFill(t, map); };
    const copy = function (list) { return list.map(function (r) { return Object.assign({}, r); }); };
    const ready = function () { return copy(GUIDE_CARE_READY_REPLIES); };
    const care = function (key, replies, concern) {
        const voice = GUIDE_CARE_VOICE[_guideOwnSpeciesKey()] || {};
        const deliveries = (voice[key] || []).concat(GUIDE_CARE_LINES[key] || []).map(f);
        const actions = { space: "gives you room and waits quietly", shaken: "gives you their full attention", hurt: "puts the plans aside to listen" };
        return { lines: [_guideTalkPick(deliveries)], deliveries: deliveries, replies: replies, concern: concern || "", action: actions[concern] || "" };
    };
    const firstReplies = function () {
        return copy(GUIDE_TALK_FIRST_REPLIES).concat([copy([GUIDE_CARE_READY_REPLIES[2]])[0]]);
    };
    const answer = function (line) {
        const replies = [];
        if (!c.inParty && !c.partyOffered && typeof getGuidePartyOffer === "function" && getGuidePartyOffer(backstory)) {
            replies.push({ label: "Could you come with me?", say: "Could you come with me?", stance: "friendly", guideTalk: "offer" });
        }
        replies.push({ label: "Ask about something else", say: "There is something else I need to work out.", stance: "guarded", guideTalk: "first-choice" });
        return { lines: [line], replies: replies, plan: true, concern: "ready" };
    };

    if (beatId === "checkin") {
        const replies = copy(GUIDE_TALK_CHECKIN_REPLIES);
        replies[0].say = "I'm alright.";
        replies.splice(2, 0, { label: "I'm hurt", say: "I'm hurt.", stance: "guarded", guideTalk: "checkin-hurt" });
        return care(typeof c.hpFrac === "number" && c.hpFrac < 0.7 ? "checkinHurt" : "checkin", replies);
    }
    if (beatId === "checkin-fine") {
        if (typeof c.hpFrac === "number" && c.hpFrac < 0.7) {
            return care("fineHurt", [copy([GUIDE_CARE_REST_REPLY])[0]].concat(ready()), "ready");
        }
        return care("fine", firstReplies(), "ready");
    }
    if (beatId === "checkin-rattled") return care("rattled", ready(), "shaken");
    if (beatId === "checkin-hurt") return care("hurt", [copy([GUIDE_CARE_REST_REPLY])[0]].concat(ready()), "hurt");
    if (beatId === "checkin-who") return care("who", ready());
    if (beatId === "pause") {
        const replies = ready().slice(0, 2);
        replies[0].label = "I'm ready. Help me decide";
        replies[0].say = "I'm ready now. Help me decide what to do first.";
        return care("pause", replies, "space");
    }
    if (beatId === "care-rest") {
        return { lines: [getGuideTopicAnswer("rest", backstory)], replies: ready(), concern: "hurt" };
    }
    if (beatId === "first-choice") return care("first", firstReplies(), "ready");
    if (beatId === "hook") {
        const spec = backstory ? getGuideSpec(backstory.archetype, _guideOwnSpeciesKey()) : null;
        const replies = spec && Array.isArray(spec.replies) ? copy(spec.replies) : ready();
        if (spec && Array.isArray(spec.replies)) replies.forEach(function (r) { r.guideTalk = "hook-react"; });
        const plan = getGuidePlanText(backstory);
        if (!plan) return care("first", firstReplies());
        return { lines: ['"' + plan + '"'], replies: replies, plan: true };
    }
    if (beatId === "hook-react") {
        const set = GUIDE_HOOK_LISTENING[backstory && backstory.archetype] || {};
        const stance = c.stance || "guarded";
        const line = set[stance] || '"You choose what happens next. What would help?"';
        // A request for time or distance must actually stop the briefing.
        const space = stance === "hostile" || (stance === "guarded" && backstory && backstory.archetype === "coming-of-age");
        return { lines: [f(line)], replies: space ? ready().slice(0, 2) : firstReplies(), concern: space ? "space" : "" };
    }
    if (beatId === "first-strong") return answer(f(_guideTalkPick(GUIDE_TALK_STRONG)));
    if (beatId === "first-coin") return answer(f(_guideTalkPick(GUIDE_TALK_COIN)));
    if (beatId === "first-lead") {
        const plan = getGuidePlanText(backstory);
        return answer(plan ? '"' + f(plan) + '"' : f(GUIDE_TALK_STRONG[0]));
    }
    if (beatId === "first-suggest") {
        const text = getGuideTopicAnswer("next", backstory);
        return answer(text || f(GUIDE_TALK_STRONG[0]));
    }
    if (beatId === "offer") {
        if (c.inParty || c.partyOffered) return care("first", firstReplies());
        const offer = typeof getGuidePartyOffer === "function" ? getGuidePartyOffer(backstory) : null;
        if (!offer) return null;
        return { lines: [offer.line], replies: offer.replies, offered: true };
    }
    if (beatId === "parting" || beatId === "parting-shout") {
        if (c.blessed) return { lines: [f(_guideTalkPick(_guideTalkVoicePool("plain", GUIDE_TALK_PARTING_PLAIN)))], replies: null, advice: false };
        // Keep every blessing fact together, including the one-use limit.
        const pool = beatId === "parting-shout" ? GUIDE_TALK_PARTING_SHOUT : GUIDE_TALK_PARTING;
        return { lines: [f(_guideTalkPick(pool))], replies: null, advice: true };
    }
    return null;
}

function getGuideTalkBeat(beatId, backstory, ctx) {
    return _buildGuideTalkBeat(beatId, backstory, ctx);
}


// ── OPENING SCENE (the intro card shown once, at the start of a new game) ──
// Staged from the wizard's answers: species and look, personality, past
// (backstory text), and where the player starts. buildOpeningSceneTemplate
// is pure (it takes a plain context object) and always returns a complete
// authored version from the selected origin and current start facts.
const OPENING_ZONE_SCENES = {
    "Town": "Chimney smoke hangs over the roofs. Beyond the town, the ruins of Aldermere mark what the Long War left behind.",
    "Underground City": "Lamps light the stone passages of {hub}, far below the war above.",
    "Dungeon": "Smoke and the noise of a resting warband fill the wet stone passages of {hub}.",
    "Ruins": "{hub} huddles among the fallen masonry of old Aldermere, a ring of cookfires and bedrolls beneath a black, broken skyline.",
    "Swamp": "Mist drifts between the stilts of {hub}. Black water laps against the wood below."
};
const OPENING_FALLBACK_SCENE = "You have arrived somewhere few would choose to begin.";

const OPENING_TIER_LINES = {
    "Easy": "The people here look you over and, for the most part, their faces soften.",
    "Normal": "Heads turn as you arrive, curious more than kind or cruel.",
    "Hard": "Heads turn as you arrive, and few of the looks are friendly.",
    "Brutal": "Few people here look willing to help a stranger."
};

const OPENING_TRAIT_LINES = {
    curiosity: "Unanswered questions tend to hold your attention.",
    empathy: "You tend to notice when someone needs help.",
    boldness: "You are usually willing to make the first move."
};

const OPENING_HAIR_STYLE_PHRASES = {
    "cropped": "cropped close",
    "short": "cut short",
    "loose": "worn loose",
    "long": "worn long",
    "braided": "braided",
    "tied back": "tied back",
    "curly": "curling freely",
    "messy": "in a messy tangle"
};

function _opLowerFirst(s) {
    s = String(s || "");
    return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

function _opArticle(word) {
    return /^[aeiou]/i.test(String(word || "")) ? "an" : "a";
}

function _opJoin(parts) {
    if (!parts.length) return "";
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return parts[0] + " and " + parts[1];
    return parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
}

// ctx: { speciesLabel, appearance, scaled, trait, backstoryText, zone,
//        hubName, roomName, tier, kin, guideRelation, goal, alone, chapelPlace }
function buildOpeningSceneTemplate(ctx) {
    ctx = ctx || {};
    const a = ctx.appearance || {};
    const species = String(ctx.speciesLabel || "human").toLowerCase();
    const paragraphs = [];

    // 1. Who you are.
    const build = a.build ? String(a.build) : "";
    let who = "You are " + _opArticle(build || species) + " " + (build ? build + " " : "") + species + ".";
    const looks = [];
    if (a.hairColor || a.hairStyle) {
        const style = a.hairStyle ? (OPENING_HAIR_STYLE_PHRASES[a.hairStyle] || a.hairStyle) : "";
        looks.push((a.hairColor ? a.hairColor + " hair" : "hair") + (style ? " " + style : ""));
    }
    if (a.eyeColor) looks.push(a.eyeColor + " eyes");
    if (a.skinTone) looks.push(a.skinTone + (ctx.scaled ? " scales" : " skin"));
    if (looks.length) who += " You have " + _opJoin(looks) + ".";
    if (a.feature) who += " Your appearance is marked by " + a.feature + ".";
    const traitLine = OPENING_TRAIT_LINES[ctx.trait] || "";
    if (traitLine) who += " " + traitLine;
    paragraphs.push(who);

    // 2. Where you come from (the backstory text, template or polished).
    if (ctx.backstoryText) paragraphs.push(String(ctx.backstoryText).trim());

    // 3. Where you are now.
    const hub = ctx.hubName || "";
    let scene = OPENING_ZONE_SCENES[ctx.zone] || OPENING_FALLBACK_SCENE;
    scene = scene.replace(/\{hub\}/g, hub || "the quarter");
    let now = scene;
    if (ctx.roomName) now += " You stand in " + ctx.roomName + ".";
    now += " " + (OPENING_TIER_LINES[ctx.tier] || OPENING_TIER_LINES.Normal);
    if (ctx.modeLine) now += " " + ctx.modeLine;
    now += ctx.kin ? " Here and there you pick out a few of your own kind." : " You see no one of your own kind.";
    // With no guide to say it, the card carries the one rule a newcomer must know.
    if (ctx.alone) now += " No one from your past is here to meet you. Death in this country is final, and the shrine in " + (ctx.chapelPlace || "the chapel") + " offers newcomers a free blessing that can save you once.";
    if (ctx.goal) now += " You came with one aim: " + _opLowerFirst(ctx.goal);
    paragraphs.push(now);

    return paragraphs.join("\n\n");
}

// ── START MODES AND BACKSTORY PRESSURE ─────────────────────────────────────
// The last wizard page asks how the player's story begins. The answer is also
// the difficulty:
//   survive  hunters are already on the trail and there is no talking; beat
//            three waves to be left alone. Hard start (Brutal where the
//            species and zone already say Brutal).
//   settle   the past catches up, but its envoy talks first. Meet the
//            backstory's terms (pay, deeds, a faith, a fight) and it ends.
//            Normal start.
//   fresh    nobody is chasing you; the backstory is only a story. Easy start.
// Each backstory (archetype) has its own pursuers, terms and wording
// (getPressureSpec). The engine runs the clock (see BACKSTORY PRESSURE in
// cyoaftw-engine-CORE.js): a warning, then an emissary or scout, then
// waves. Terms are a list of requirements the engine can check:
//   pay {amount}   coin handed to the emissary, in parts if need be
//   deeds {n}      jobs plus bounties finished
//   trained        has trained at a guildhall or the yard
//   lead           the first-lead arc is finished
//   faith          has pledged to a patron god
//   defeat         the leader of a wave is beaten
const START_MODES = {
    survive: { id: "survive", label: "Survive", tag: "Hard start", tier: "Hard", pressure: true, talks: false },
    settle:  { id: "settle",  label: "Settle it", tag: "Normal start", tier: "Normal", pressure: true, talks: true },
    fresh:   { id: "fresh",   label: "Fresh start", tag: "Easy start", tier: "Easy", pressure: false, talks: false }
};
const START_MODE_ORDER = ["settle", "survive", "fresh"];
const DEFAULT_START_MODE = "settle";
const START_TIER_ORDER = ["Easy", "Normal", "Hard", "Brutal"];

// The mode sets the tier; where the species and zone already say Brutal, the
// mode's tier is lifted one step (survive stays at Brutal) so a Human who
// starts in the Warrens is never handed an "easy" start.
function getStartTierForMode(modeId, computedTier) {
    const mode = START_MODES[modeId] || START_MODES[DEFAULT_START_MODE];
    let i = START_TIER_ORDER.indexOf(mode.tier);
    if (computedTier === "Brutal") i += 1;
    return START_TIER_ORDER[Math.max(0, Math.min(START_TIER_ORDER.length - 1, i))];
}

// Shared calendar unit: a workday (30 turns) plus a night (24 turns).
// The engine's lodging and day/night clock use this same value.
const STORY_DAY_TURNS = 54;
const PRESSURE_TIMING_VERSION = 2;
// Durations are expressed in days, converted to story turns here. warn is
// the first warning; next is the gap to the emissary (settle) or first hunter
// (survive); then is the emissary's deadline; repeat is between later waves.
const PRESSURE_TIMING = {
    settle:  { warn: 3 * STORY_DAY_TURNS, next: 4 * STORY_DAY_TURNS, then: 7 * STORY_DAY_TURNS, repeat: 7 * STORY_DAY_TURNS },
    survive: { warn: 2 * STORY_DAY_TURNS, next: 3 * STORY_DAY_TURNS, then: 4 * STORY_DAY_TURNS, repeat: 4 * STORY_DAY_TURNS }
};
const PRESSURE_PAY_EXTEND = 7 * STORY_DAY_TURNS;  // a payment buys a week
const PRESSURE_TIME_EXTEND = 3 * STORY_DAY_TURNS; // ask for three more days, once per visit
const PRESSURE_READY_DELAY = 30;     // "I'm ready" (defeat terms) brings the party this soon
const PRESSURE_SURVIVE_BEATEN = 3;   // waves beaten to outlast the hunters
const PRESSURE_MAX_ALIVE = 6;        // never more than this many pursuers alive at once

function _prSlot(s, key, fallback) { return s && s[key] ? s[key] : fallback; }
function _prHas(text, word) { return String(text || "").toLowerCase().indexOf(word) >= 0; }

// The resolved spec for one backstory. All text may use {player} and {owed}
// (the engine fills them). Returns null for an unknown archetype.
function getPressureSpec(archetypeId, slots) {
    const s = slots || {};
    let spec = null;
    if (archetypeId === "coming-of-age") {
        spec = {
            settleLabel: "Prove yourself",
            pursuers: "a rival from home and their friends", who: "a rival from home",
            cards: {
                survive: "Someone from home swore you would never make it, and has followed to see you fail. They are not alone, and they are not friendly. Outlast them.",
                settle: "A rival from home has followed you to see whether you earned your place. Train, take honest work, and show them. Then it ends.",
                fresh: "No rival, no deadline. The place is yours to make, in your own time."
            },
            warning: "A carter at the gate mentions, to no one in particular, that someone from your old home is on the road and has been asking after you by name.",
            rumor: "Someone from the country has been asking around for a newcomer, and does not sound friendly.",
            emissary: { species: ["Human", "Elf", "Dwarf", "Halfling"], role: "Adventurer", age: "adult",
                persona: "A proud, prickly rival from the player's home who was passed over for the place the player got and has come to see whether it was earned. Not cruel, but quick to sneer. Respects results, not words.",
                arrival: "\"So this is where you ended up. They said at home you had made something of yourself, so I came to see. Prove you earned your place, and I will ride home and say so. Fail, and I stay. I brought friends.\"" },
            partyIntro: "Your rival from home shoulders in with two friends at their back. \"Time is up,\" they say. \"Let us see what you have learned.\"",
            reqs: [{ type: "trained" }, { type: "deeds", n: 2 }],
            settledLine: "Your rival looks you over, nods stiffly, and says they will tell them at home that you earned your place. Then they are gone.",
            outlastedLine: "The last of them limps off down the road. Nobody from home comes after you again."
        };
    } else if (archetypeId === "revenge") {
        const org = s.quarryFaction === "crown" || s.quarryFaction === "banners";
        const q = _prSlot(s, "quarry", "your enemy");
        spec = {
            settleLabel: "Face them",
            pursuers: org ? "agents of " + q : "hired blades sent by " + q, who: "a go-between for " + q,
            cards: {
                survive: q.charAt(0).toUpperCase() + q.slice(1) + " has learned who is hunting them, and has sent hunters first. No parley. Outlast them.",
                settle: q.charAt(0).toUpperCase() + q.slice(1) + " will send their best to meet you. Beat them, and the trail comes to you.",
                fresh: "The trail is cold, and you may let it stay that way. No hunters, no clock."
            },
            warning: "A stranger at the gate has been asking after someone with your description, quietly, and paying in old coin.",
            rumor: "A quiet stranger has been asking after someone with a newcomer's description, and paying well for the answer.",
            emissary: { species: ["Human", "Elf", "Dwarf", "Halfling"], role: "Adventurer", age: "adult",
                persona: "A cold, careful go-between sent by the player's enemy to deliver one message and watch how it lands. Polite, unhurried, never raises a voice, says nothing that could be repeated in court.",
                arrival: "\"" + q.charAt(0).toUpperCase() + q.slice(1) + " knows you are here, and what you want. They would rather settle it face to face than watch you creep around town. Say the word, and the best they have will meet you. Only one of you walks away.\"" },
            partyIntro: "Figures step out of the crowd from three sides at once. The one in front says, \"" + q.charAt(0).toUpperCase() + q.slice(1) + " sends regards,\" and draws.",
            reqs: [{ type: "defeat" }],
            settledLine: "Their best lies beaten at your feet. Whatever " + q + " wanted to settle is settled, and the others melt away into the crowd.",
            outlastedLine: "The last of the hired hands is down, and the street goes quiet. For now, " + q + " has run out of people to send."
        };
    } else if (archetypeId === "redemption") {
        spec = {
            settleLabel: "Make it right",
            pursuers: "those you wronged, and the hired hands who speak for them", who: "an envoy of those you wronged",
            cards: {
                survive: "What you did cannot be paid for, and those you wronged know it. They want blood. Outlast them.",
                settle: "Those you wronged will hear you if you can make good the loss and show you have changed. Pay what you can, and do honest work.",
                fresh: "Nobody is waiting to hear your apology. Make amends if you want to. The road is open."
            },
            warning: "A weathered traveller leaves word at the inn that someone you once wronged knows where you are, and wants what is owed.",
            rumor: "A traveller says someone is coming to town to settle an old wrong with a newcomer.",
            emissary: { species: ["Human", "Dwarf", "Halfling", "Elf"], role: "Adventurer", age: "adult",
                persona: "A stern, plainspoken envoy for the people the player wronged. Not cruel and not forgiving. Wants restitution and proof of change, in that order.",
                arrival: "\"I speak for those you wronged. They know you are here. They want two things: coin to make good the loss, and proof you are not the same person who did it. Honest work will serve for the second.\"" },
            partyIntro: "Hard-faced men push in, and the one in front says, \"We were told you had your chance to make it right.\"",
            reqs: [{ type: "pay", amount: 300 }, { type: "deeds", n: 3 }],
            settledLine: "The envoy weighs what you have done, and for the first time looks at you without anger. \"It is enough,\" they say. \"They will not come again.\"",
            outlastedLine: "The last of them is down. Nobody speaks for those you wronged any more, and the quiet is not forgiveness, but it is something."
        };
    } else if (archetypeId === "missing-kin") {
        const who = _prSlot(s, "who", "the one you are searching for");
        spec = {
            settleLabel: "Find the truth",
            pursuers: "people who do not want the trail followed", who: "a polite stranger",
            cards: {
                survive: "Someone does not want " + who + " found, and has noticed you looking. They are sending people. Outlast them.",
                settle: "Whoever is behind it knows you are close. Follow the trail to its end, and they have no reason left to hunt you.",
                fresh: "The trail is yours to follow at your own pace. Nobody is watching."
            },
            warning: "Someone has been asking the innkeepers who is searching for whom, and tipping well for the answer.",
            rumor: "A smiling stranger has been asking who the newcomer is, and who they are looking for.",
            emissary: { species: ["Human", "Elf", "Halfling", "Dwarf"], role: "Adventurer", age: "adult",
                persona: "A smooth, polite stranger sent to find out how much the player knows and to talk them out of searching. Friendly on the surface, always smiling, never answers a direct question.",
                arrival: "\"You have been asking questions, friend. Nobody minds questions. But some people would rather the trail ended here, and I would hate to see you hurt. Find what you came for, or give it up, and be quick about either.\"" },
            partyIntro: "The polite stranger is not smiling now. \"A pity,\" they say, and the men behind them move in.",
            reqs: [{ type: "lead" }],
            settledLine: "You have found what you came here to find, and there is nothing left for them to hide. The watchers stop coming.",
            outlastedLine: "The last of them is down, and whoever sent them seems to have run out of hands. The trail is yours again."
        };
    } else if (archetypeId === "fortune") {
        const need = s.need || "";
        let kind = "poor";
        if (_prHas(need, "moneylender")) kind = "lender";
        else if (_prHas(need, "venture")) kind = "venture";
        else if (_prHas(need, "gambled")) kind = "gambled";
        const K = {
            lender:  { pursuers: "the moneylender's collectors", who: "a collector", amount: 500, label: "Pay what you owe",
                       persona: "A bored, businesslike collector who has chased many debtors and no longer takes it personally. Polite until the money is mentioned.",
                       arrival: "\"There you are. {owed} coins, and we call it even. No more interest, since I like you. Pay what you can now and the rest as it comes, and my colleagues stay home.\"",
                       warning: "Someone has been asking after you in the taverns, and the men who ask are not drinking.",
                       rumor: "Men in the moneylender's grey have been asking about a newcomer with debts." },
            venture: { pursuers: "your creditors' collectors", who: "a collector", amount: 450, label: "Pay what you owe",
                       persona: "A dry, patient collector for the people the player's failed venture left owed. Takes notes, keeps accounts, never loses their temper.",
                       arrival: "\"Your venture failed, and the people who backed it want their money. {owed} coins, as you can manage it. I am authorised to take it in pieces, but not to take no.\"",
                       warning: "A clerk has been asking at the inn whether a certain newcomer has been seen, and what they do for coin.",
                       rumor: "A clerk with a ledger has been asking around about a newcomer who owes a good deal." },
            gambled: { pursuers: "the gambling house's collectors", who: "a collector from the gambling house", amount: 600, label: "Pay what you owe",
                       persona: "A smiling, heavy-set collector for a gambling house who treats every debt as a friendly game that the debtor is losing.",
                       arrival: "\"You left owing the house, friend, and the house has a long memory. {owed} coins settles it. Pay in parts if you must. The house is patient, but its friends are not.\"",
                       warning: "Two big men in good coats have been asking at the tavern whether anyone has seen a newcomer who plays cards badly.",
                       rumor: "Big men in good coats have been asking after a newcomer who left a gaming debt." },
            poor:    { pursuers: "the crew that runs these streets", who: "one of the street crew", amount: 300, label: "Buy your peace",
                       persona: "A lazy, confident street enforcer who treats this town's corners as theirs. Not cruel, just certain nobody will say no.",
                       arrival: "\"You are new. New people pay for the privilege of keeping their teeth. {owed} coins, a little at a time if you are broke, and we leave you alone.\"",
                       warning: "Someone mentions that a certain crew has noticed the newcomer, and that the crew likes to be introduced.",
                       rumor: "A street crew has taken an interest in a newcomer's purse." }
        }[kind];
        spec = {
            settleLabel: K.label,
            pursuers: K.pursuers, who: K.who,
            cards: {
                survive: "The collectors have stopped sending letters and started sending people. There is no paying this off now. Outlast them.",
                settle: "The collectors will come, but they will talk first. Pay what you owe, in whatever pieces you can, and they leave.",
                fresh: "Whatever you owed, you left behind it. Nobody here knows your name."
            },
            warning: K.warning, rumor: K.rumor,
            emissary: { species: ["Human", "Halfling", "Dwarf", "Elf"], role: "Adventurer", age: "adult", persona: K.persona, arrival: K.arrival },
            partyIntro: "The collectors shoulder in, three of them, and the leader does not bother with a greeting. \"Time is up,\" they say.",
            reqs: [{ type: "pay", amount: K.amount }],
            settledLine: "The last coin is counted, and the collector tears the note in two. \"A pleasure doing business,\" they say. \"You will not see us again.\"",
            outlastedLine: "The last of them is down, and nobody comes to collect. Whoever held the debt has decided you are not worth the cost."
        };
    } else if (archetypeId === "exile") {
        const h = s.hunters || "";
        let kind = "nobody";
        if (_prHas(h, "magistrate")) kind = "crown";
        else if (_prHas(h, "company")) kind = "company";
        else if (_prHas(h, "family")) kind = "family";
        const K = {
            crown:   { pursuers: "the magistrates' bailiffs", who: "a magistrate's clerk", amount: 400, species: ["Human", "Elf", "Dwarf"],
                       persona: "A tired magistrate's clerk who serves writs and takes fines. Careful with words, bored by everything except a signed receipt.",
                       arrival: "\"I am told you are the person the magistrates are looking for. I am also told a fine, paid in coin and promptly, makes a clerk forget a face. {owed} coins, and I never saw you.\"",
                       warning: "A clerk in a magistrate's grey passes through town and asks the innkeepers, very politely, for the names of recent arrivals." },
            company: { pursuers: "your former company's men", who: "an old comrade from the company", amount: 400, species: ["Human", "Dwarf", "Orc"],
                       persona: "A gruff old comrade from the player's former company, sent to collect what the company says is owed. Does not enjoy this, does it anyway.",
                       arrival: "\"The company wants its due, or an apology it can use. Coin does for either: {owed}. Pay what you can, the rest when you can. Do not make me bring the others.\"",
                       warning: "A man with a company's faded colours under his cloak has been asking about a newcomer who walks like a soldier." },
            family:  { pursuers: "the family's retainers", who: "a family retainer", amount: 500, species: ["Human", "Elf", "Halfling"],
                       persona: "A smooth retainer of a powerful family, sent to name a price for the family's forgetting. Never raises their voice; has never needed to.",
                       arrival: "\"The family would be willing to forget you, for a price. {owed} coins, by instalment if you must. The family is patient. Its retainers are less so.\"",
                       warning: "A well-dressed stranger has been taking rooms at the inn and asking, with great courtesy, about a newcomer's habits." },
            nobody:  { pursuers: "a bounty hunter who recognised your face", who: "a bounty hunter", amount: 250, species: ["Human", "Orc", "Dwarf"],
                       persona: "A tired bounty hunter who recognised the player from a notice and would rather be paid to look away than do the work.",
                       arrival: "\"I know your face from a notice, friend. A hunter has to eat. {owed} coins and I am suddenly lost, and I forget where I saw you.\"",
                       warning: "A hard-eyed stranger has been studying the notices in the square, and then studying the crowd." }
        }[kind];
        spec = {
            settleLabel: "Clear your name",
            pursuers: K.pursuers, who: K.who,
            cards: {
                survive: "They found you. There is no appeal and no price. Outlast them.",
                settle: "They will come and name terms: a fine, a fee, a favour. Meet them and your name is clear.",
                fresh: "Nobody is looking. Keep your head down or do not. The name is yours to make."
            },
            warning: K.warning,
            rumor: "A stranger has been asking about newcomers who keep their heads down.",
            emissary: { species: K.species, role: "Adventurer", age: "adult", persona: K.persona, arrival: K.arrival },
            partyIntro: "Armed figures step in from the street, and the one in front says, \"We gave you the chance to settle. That chance is gone.\"",
            reqs: [{ type: "pay", amount: K.amount }],
            settledLine: "The coin vanishes into a pocket. \"A pleasure,\" they say. \"I never saw you.\" And they are gone.",
            outlastedLine: "The last of them is down. Whoever sent them seems to have decided you are more trouble than you are worth."
        };
    } else if (archetypeId === "calling") {
        spec = {
            settleLabel: "Answer the call",
            pursuers: "pilgrims who believe the sign is theirs", who: "a rival seeker",
            cards: {
                survive: "Others heard the same call and believe it is theirs. They will kill to stop you answering. Outlast them.",
                settle: "A rival seeker wants what the sign promises. Answer the call by pledging yourself to a god, and they have nothing left to contest.",
                fresh: "The call is quiet now. You are free to follow it, or not."
            },
            warning: "Hooded pilgrims have been seen on the road, and they ask which shrine the newcomer visits.",
            rumor: "Hooded pilgrims have been asking about a newcomer, and about which shrine they pray at.",
            emissary: { species: ["Human", "Elf", "Dwarf", "Halfling"], role: "Adventurer", age: "adult",
                persona: "A fervent rival seeker who heard the same call and is convinced it was meant for them. Devout, intense, not quite calm about it.",
                arrival: "\"You heard it too. I see it on you. It was meant for one of us, and it was meant for me. Unless you can show the god you answer to, and that it answers you, I will take what is mine.\"" },
            partyIntro: "The hooded pilgrims close in, murmuring, and their leader says, \"It was never yours.\"",
            reqs: [{ type: "faith" }],
            settledLine: "You speak a name before the shrine, and for a heartbeat the room is warmer. The rival seeker lowers their eyes. \"It is yours,\" they whisper, and go.",
            outlastedLine: "The last of them is down. The sign is yours, and nobody left alive disputes it."
        };
    }
    // A free-form start may name its own sum (clamped); it replaces the
    // archetype's default coin terms.
    if (spec && s.amount && typeof clampFreeformAmount === "function" && Array.isArray(spec.reqs)) {
        const amt = clampFreeformAmount(s.amount);
        if (amt) spec.reqs = spec.reqs.map(function (r) { return r.type === "pay" ? Object.assign({}, r, { amount: amt }) : r; });
    }
    return spec;
}

// Origins with nothing chasing the player (no pressure spec) offer the same
// three tiers as plain difficulty choices.
const NO_PRESSURE_CARDS = {
    settle:  { label: "Find your feet", text: "Nothing is chasing you. The locals are neither kind nor cruel, and you make what you can of the place." },
    survive: { label: "Rough welcome", text: "Nothing is chasing you, but the locals are wary of strangers. You start with a few coins and a healing potion to make up for it." },
    fresh:   { label: "Gentle welcome", text: "Nothing is chasing you, and the locals warm to a newcomer a little faster. Take it at your own pace." }
};

// The three wizard cards for a backstory: [{ id, label, tag, text }].
function getStartModeCards(archetypeId, slots) {
    const spec = getPressureSpec(archetypeId, slots);
    return START_MODE_ORDER.map(function (id) {
        const mode = START_MODES[id];
        if (!spec && NO_PRESSURE_CARDS[id] && PLAYER_ARCHETYPES[archetypeId]) {
            return { id: id, label: NO_PRESSURE_CARDS[id].label, tag: mode.tag, text: NO_PRESSURE_CARDS[id].text };
        }
        const label = id === "settle" && spec ? spec.settleLabel : mode.label;
        const text = spec && spec.cards ? spec.cards[id] : "";
        return { id: id, label: label, tag: mode.tag, text: text };
    });
}

// One line for the prologue: how the past is expected to catch up.
function getPressurePrologueLine(modeId, archetypeId, slots) {
    const spec = getPressureSpec(archetypeId, slots);
    if (!spec) return "";
    const cap = spec.pursuers.charAt(0).toUpperCase() + spec.pursuers.slice(1);
    if (modeId === "survive") return cap + " are already on your trail, and they will not stop to talk.";
    if (modeId === "settle") return "Sooner or later " + spec.pursuers + " will find you. When they do, you mean to settle it.";
    return "Nobody here knows what you left behind, and nobody is looking.";
}

// Gossip about the player's pursuers, from the first warning until the
// pressure ends (see BACKSTORY PRESSURE in the engine). Joins the lore pool.
function getPressureLoreFacts() {
    const p = typeof G !== "undefined" && G && G.player ? G.player : null;
    const pr = p ? p.pressure : null;
    if (!pr || pr.resolved || pr.mode === "fresh" || (pr.stage || 0) < 1) return [];
    const bs = p.backstory;
    const spec = bs ? getPressureSpec(bs.archetype, bs.slots) : null;
    if (!spec) return [];
    return [{
        id: "pressure-rumor", tiers: ["common", "local", "trade"],
        zones: ["Town", "Underground City", "Dungeon", "Ruins", "Swamp"],
        know: 60, rumor: true, topic: "strangers asking questions",
        text: spec.rumor,
        distorted: "Strangers have been asking questions around town about a newcomer."
    }];
}

// First-lead facts the world can answer. These join the lore pool (see
// getNPCKnownLoreFacts in cyoaftw-npc-data.js), so asking around at the
// named building turns up exactly what the guide hinted at.
function getBackstoryLoreFacts() {
    const bs = typeof G !== "undefined" && G && G.player ? G.player.backstory : null;
    const arch = bs ? PLAYER_ARCHETYPES[bs.archetype] : null;
    if (!arch) return [];
    const lead = resolveGuideLeadPlace(bs);
    if (!lead || !lead.building) return [];
    const map = getBackstoryFillMap(bs);
    const place = lead.building.name;
    const base = { buildingId: lead.building.id, zones: ["Town"], know: 85, rumor: true, backstoryLead: true };
    const out = [];
    const id = "lead-" + bs.archetype;
    const common = ["local", "trade"];
    const type = lead.type;
    const isChapel = type === "Chapel";
    const isGuild = type === "Guildhall";
    if (bs.archetype === "coming-of-age") {
        out.push(Object.assign({}, base, { id: id, tiers: common, topic: "finding a teacher",
            text: place + " is where a green " + map.class + " is most likely to find somebody willing to teach. " + lead.hint,
            distorted: "Folk say you can find a teacher at " + place + ", if the teacher likes your face." }));
    } else if (bs.archetype === "revenge") {
        const trace = bs.slots.quarryFaction === "crown" ? "a quiet man in Crown grey who paid in old coin"
            : bs.slots.quarryFaction === "banners" ? "a scarred sellsword with a faded Banner patch under his cloak"
            : "a stranger who gave no name and watched the door the whole evening";
        if (isGuild) {
            out.push(Object.assign({}, base, { id: id, tiers: common, topic: "a stranger at " + place,
                text: "Some time ago " + trace + " came to " + place + ", asked the guildmaster who had taken contracts in this town before the war, and left before dawn. Nobody saw which road.",
                distorted: "A stranger asked about old contracts at " + place + " and left in a hurry. Folk say he was hiring, or hunting." }));
        } else {
            out.push(Object.assign({}, base, { id: id, tiers: common, topic: "a stranger at " + place,
                text: "Some time ago " + trace + " took a room at " + place + ", asked who still lived in the town from before the war, and left before dawn. Nobody saw which road.",
                distorted: "A stranger stayed at " + place + " and left in a hurry. Folk say he was running from something, or toward it." }));
        }
    } else if (bs.archetype === "redemption") {
        if (isChapel) {
            out.push(Object.assign({}, base, { id: id, tiers: common, topic: "the altar at " + place,
                text: "The priest at " + place + " asks nothing of those who kneel at the altar. Folk go there when they have something to answer for, and most walk out lighter.",
                distorted: "There is a chapel where people go to confess. Nobody talks about what they say." }));
        } else {
            out.push(Object.assign({}, base, { id: id, tiers: common, topic: "the shrine below " + place,
                text: "The shrine below " + place + " is kept clean by someone who asks for nothing. Folk go down there when they have something to answer for, and most come back lighter.",
                distorted: "There is a shrine under " + place + " where people go to confess. Nobody talks about what they say." }));
        }
    } else if (bs.archetype === "missing-kin") {
        out.push(Object.assign({}, base, { id: id, tiers: ["local", "military"], topic: "the arrivals ledger",
            text: "The clerk at " + place + " keeps a ledger of who comes through the town. Anyone looking for someone who passed this way should ask there, politely, and the clerk usually has more patience than coin.",
            distorted: "Someone at " + place + " writes down everyone who comes and goes, if you can get past the guards." }));
    } else if (bs.archetype === "fortune") {
        if (isGuild) {
            out.push(Object.assign({}, base, { id: id, tiers: common, topic: "who is hiring",
                text: "The job board at " + place + " is where this town's contracts end up: escorts, bounties, a little quiet work. The guildmaster knows which ones pay and which ones get people killed.",
                distorted: "There is always work on the board at " + place + " for anyone who doesn't ask what it is." }));
        } else {
            out.push(Object.assign({}, base, { id: id, tiers: common, topic: "who is hiring",
                text: "Anyone in this town who wants a job done quietly ends up at " + place + ". The bartender knows who is hiring and what they are willing to pay.",
                distorted: "There is always work at " + place + " for anyone who doesn't ask what it is." }));
        }
    } else if (bs.archetype === "exile") {
        if (isChapel) {
            out.push(Object.assign({}, base, { id: id, tiers: common, topic: "keeping quiet in town",
                text: "The priest at " + place + " takes in anyone who comes to the altar and never asks a penitent's name. Strangers who keep their heads down there are left alone.",
                distorted: "They say " + place + " shelters anyone who kneels, and forgets every face." }));
        } else {
            out.push(Object.assign({}, base, { id: id, tiers: common, topic: "keeping quiet in town",
                text: "Strangers who keep their heads down at " + place + " are left alone, and the people who run it are used to not asking where a guest comes from.",
                distorted: "They say " + place + " takes in anyone who can pay and doesn't remember anyone's face." }));
        }
    } else if (bs.archetype === "calling") {
        if (isChapel) {
            out.push(Object.assign({}, base, { id: id, tiers: common, topic: "the altar at " + place,
                text: "The altar at " + place + " is older than the chapel built around it, and some say it answers those who come with a real question.",
                distorted: "Something at the altar of " + place + " answers questions, if the questioner is willing to hear the answer." }));
        } else {
            out.push(Object.assign({}, base, { id: id, tiers: common, topic: "the old shrine below " + place,
                text: "Below " + place + " is a shrine older than the building, and some say it answers those who come with a real question.",
                distorted: "Something below " + place + " answers questions, if the questioner is willing to hear the answer." }));
        }
    } else if (bs.archetype === "open-road") {
        out.push(Object.assign({}, base, { id: id, tiers: common, topic: "what is worth seeing",
            text: "Travellers swap news and road stories at " + place + ", and the regulars will gladly tell a newcomer what is worth seeing in town.",
            distorted: "Travellers meet at " + place + " to trade stories about the road." }));
    } else if (bs.archetype === "homecoming") {
        out.push(Object.assign({}, base, { id: id, tiers: common, topic: "old neighbours",
            text: "Folk who grew up around here tend to end up at " + place + " sooner or later, and the regulars will happily say who from the old days is still in town.",
            distorted: "Half the town ends up at " + place + " eventually, and they all know each other's business." }));
    } else if (bs.archetype === "good-offer") {
        out.push(Object.assign({}, base, { id: id, tiers: common, topic: "who is hiring",
            text: place + " is where honest work in this town gets arranged, and the people there can say who is hiring newcomers.",
            distorted: "There is steady work to be had at " + place + " if you ask the right person." }));
    }
    out.forEach(function (f) { f.text = _spCap(f.text); });
    return out;
}

// The concrete first step the guide suggests (used by the "Ask what to do
// first" conversation option and the guide's prompt line).
// A string, or an object keyed by lead building type with a "default".
const ARCHETYPE_PLAN_TEXT = {
    "coming-of-age": "Go to {leadPlace} and ask after a teacher or a guild willing to take you on. {mentorHint}",
    "revenge": {
        "default": "Ask around at {leadPlace}, starting with whoever keeps the place, and keep quiet about who is asking. Someone tied to {quarry} was seen there not long ago.",
        "Guildhall": "Ask the guildmaster at {leadPlace} who has been hiring, and keep quiet about who is asking. Someone tied to {quarry} was seen there not long ago."
    },
    "redemption": {
        "default": "Go down to the shrine below {leadPlace} and sit with it, then ask around town who could use an honest hand.",
        "Chapel": "Go to {leadPlace}, speak with the priest and kneel at the altar, then ask around town who could use an honest hand."
    },
    "missing-kin": "Ask the clerk at {leadPlace} to look through the arrivals ledger for {who}.",
    "fortune": {
        "default": "Ask the bartender at {leadPlace} who is hiring, and take the first honest job that pays.",
        "Guildhall": "Read the job board at {leadPlace}, ask the guildmaster which contracts pay, and take the first honest one."
    },
    "exile": {
        "default": "Keep to {leadPlace}, give no true name, and listen for anyone asking after you.",
        "Chapel": "Keep to {leadPlace}, where nobody asks a penitent's name, and listen for anyone asking after you."
    },
    "calling": {
        "default": "Go down to the old shrine below {leadPlace} and see whether it answers you.",
        "Chapel": "Go to {leadPlace}, kneel at the altar and see whether it answers you."
    },
    "open-road": "Go to {leadPlace}, where travellers swap news, and ask what is worth seeing in town.",
    "homecoming": "Go to {leadPlace} and ask who from the old days is still around.",
    "good-offer": "Go to {leadPlace} and ask about the work you were promised."
};

function getGuidePlanText(backstory) {
    if (!backstory) return "";
    const leadStage = backstory.guide && backstory.guide.leadStage ? backstory.guide.leadStage : 0;
    if (leadStage >= 1 && typeof getLeadStage === "function") {
        const st = getLeadStage(backstory, 1);
        if (leadStage >= 2) return st ? st.done : "";
        if (st) return "Next, go to " + st.place + " and " + st.ask.charAt(0).toLowerCase() + st.ask.slice(1) + ".";
    }
    let tpl = ARCHETYPE_PLAN_TEXT[backstory.archetype] || "";
    if (tpl && typeof tpl === "object") {
        const lead = resolveGuideLeadPlace(backstory);
        tpl = (lead && tpl[lead.type]) || tpl["default"] || "";
    }
    return _spFill(tpl, getBackstoryFillMap(backstory)).replace(/\s+/g, " ").trim();
}

// The guide asks whether to join the player's party, once, right after the
// first step is laid out (see maybeOfferGuideParty in the engine). Lines are
// scripted so the question is always asked the same clear way; the menu keeps
// an "Ask them to come along" option afterwards for anyone who said no.
const GUIDE_PARTY_OFFERS = {
    "coming-of-age": "I can come with you, {player}. Would that help?",
    "revenge": "I can, {player}. We can follow the trail together if you want.",
    "redemption": "I can come with you, {player}. We can take this at your pace.",
    "missing-kin": "I can, {player}. We can ask together, and stop when you need to.",
    "fortune": "I can come with you, {player}. We can look at the work together before you agree to it.",
    "exile": "I can, {player}. You decide where we go and what we tell people.",
    "calling": "I can come with you, {player}. We can investigate without deciding yet what it means.",
    "open-road": "I can come along, {player}. Seeing it together is half the fun.",
    "homecoming": "I can walk you round, {player}. It would be nice to see it all again with you.",
    "good-offer": "I can come with you, {player}. We can look at the work together before you agree to anything."
};

const GUIDE_PARTY_REPLIES = [
    { label: "Yes, come with me", say: "Yes. Come with me.", stance: "friendly", guideParty: "accept" },
    { label: "Not just yet", say: "Not yet. Let me look around first.", stance: "guarded", guideParty: "later" },
    { label: "I'll go alone for now", say: "I'd rather go on my own for now.", stance: "guarded", guideParty: "decline" }
];
const GUIDE_PARTY_RESPONSES = {
    accept: "\"Good. Lead on, {player}. I'll be right behind you.\"",
    later: "\"Take your time. Say the word whenever you want me with you.\"",
    decline: "\"I understand. I'll wait here, and if you change your mind, you know where to find me.\"",
    leave: "\"Alright. I'll stay here and keep my ears open. Come back for me when you need me.\""
};

// { line, replies } for the party offer, or null when the archetype has none.
function getGuidePartyOffer(backstory) {
    if (!backstory) return null;
    const tpl = GUIDE_PARTY_OFFERS[backstory.archetype];
    if (!tpl) return null;
    const map = getBackstoryFillMap(backstory);
    return {
        line: _spFill(tpl, map),
        replies: GUIDE_PARTY_REPLIES.map(function (r) { return Object.assign({}, r); })
    };
}

function getGuidePartyResponse(backstory, kind) {
    const tpl = GUIDE_PARTY_RESPONSES[kind] || "";
    return _spFill(tpl, getBackstoryFillMap(backstory));
}

// ── LEAD STAGES ──────────────────────────────────────────────────
// The guide's first lead is stage 0 (the building in arch.lead). Asking the
// right question of someone there pays it off (see "lead-stage-ask" in
// cyoaftw-npc-data.js and onGuideBeat "lead" in the engine) and opens stage 1,
// a second building; paying that off completes the opening arc and points the
// player out of town. G.player.backstory.guide.leadStage counts payoffs (0-2).
// ask = the menu label, reveal = what the NPC is told to say, done = the story
// line recorded. Only {leadPlace}, {who}, {quarry}, {class} are filled.
const ARCHETYPE_LEADS = {
    "coming-of-age": [
        { ask: "Ask who could teach you",
          reveal: "The player is a green {class} looking for a teacher. Tell them plainly that people here take on newcomers who show grit, and that a real start begins with honest tools: the smith is who to see about a first proper kit. Name only the smith as the next stop.",
          done: "{leadPlace} will take you on, but first you need a proper kit. Try the smith." },
        { building: "Smithy", ask: "Ask about a first proper kit",
          reveal: "Size up the newcomer honestly. A first kit matters less than what they do with it. Apprentices prove themselves on the old road past the Gate, or in the cellar below the tavern where the way down begins. Wish them luck. Do not invent names.",
          done: "Your apprenticeship begins in earnest: the old road past the Gate, or the way down under the tavern." }
    ],
    "revenge": [
        { ask: "Ask about the stranger",
          reveal: "Quietly confirm that someone matching the trail of {quarry} was here not long ago, asked who in town could mend a blade, and left toward the Gate. Say no more than that. Do not invent names.",
          done: "The trail was here, and went looking for a smith." },
        { building: "Smithy", ask: "Ask whom they mended a blade for",
          reveal: "You mended a blade for a stranger tied to {quarry}. Describe them briefly, say they paid in old coin and asked the way to the old road beyond the Gate. Do not invent a name.",
          done: "The trail leads out of the Gate and onto the old road." }
    ],
    "redemption": [
        { ask: "Ask for guidance",
          reveal: "Be gentle. Tell the player that amends are made in deeds, not words, and that the watch at the Town Hall never has enough honest hands. Name only the Town Hall as the next stop.",
          done: "Amends are made in deeds. The Town Hall always needs honest hands." },
        { building: "Town Hall", ask: "Ask about honest work",
          reveal: "The player seeks honest work to make amends. Tell them the watch has patrols that never come back from the old road beyond the Gate, and that someone willing to scout it and return would be thanked. Do not invent names.",
          done: "A task worth doing: scout the old road beyond the Gate and come back." }
    ],
    "missing-kin": [
        { ask: "Ask about the ledger",
          reveal: "Say the arrivals ledger does show {who}, or someone answering to them, passing through not long ago; they asked for a bed at the inn. Do not invent other details or names.",
          done: "The ledger shows {who} passed through and asked for a bed at the inn." },
        { building: "Inn", ask: "Ask about {who}",
          reveal: "Say someone answering to {who} stayed one night, paid for a second they never used, and left before dawn by the Gate toward the old road. Do not invent other names.",
          done: "{who} went out by the Gate toward the old road." }
    ],
    "fortune": [
        { ask: "Ask who is hiring",
          reveal: "Say there is steady work, and that the best standing job in town is the smith's commission board. Name only the smith as the next stop.",
          done: "Steady work and coin: the smith's commission board is the place." },
        { building: "Smithy", ask: "Ask about work",
          reveal: "Tell the player the smith posts commissions on the board in the forge and pays fairly for ore and honest deliveries, and that the real money is out past the Gate where ore is scavenged, or down below the tavern. Do not invent names.",
          done: "Work and coin wait out past the Gate, and below the tavern." }
    ],
    "exile": [
        { ask: "Ask who has been asking questions",
          reveal: "Say, quietly, that someone has been asking after a stranger answering the player's description, and that you told them nothing. Advise talking to the bartender, who hears everything. Name only the tavern as the next stop.",
          done: "Someone has been asking after you. The tavern hears everything." },
        { building: "Tavern", ask: "Ask what people are saying",
          reveal: "Say the person asking left town by the Gate after being told nothing, and that the road out is where trouble waits; staying put is safer for now. Do not invent names.",
          done: "Whoever was asking has gone out the Gate. You can hide here, or go after them." }
    ],
    "calling": [
        { ask: "Ask about the shrine",
          reveal: "Say the shrine answers those who listen, and lately it has been restless. Those who keep it say the old way beneath the tavern's cellar leads down to where it began. Do not invent names.",
          done: "The shrine has been restless. The old way down, under the tavern, is where it began." },
        { building: { Cleric: "Tavern", "default": "Chapel" }, ask: "Ask what the shrine has said",
          reveal: "Say others have heard the same call. It points downward, to the old works under the town, reached through the cellar below the tavern. Do not invent names.",
          done: "The calling points down, to the way below the tavern's cellar." }
    ],
    "open-road": [
        { ask: "Ask what is worth seeing",
          reveal: "Say, cheerfully, that the forge is a sight when a blade is poured, and that travellers swap news at the tavern. Name only the smith as the next stop. Do not invent names.",
          done: "Folk here say the forge is worth seeing. Try the smith." },
        { building: "Smithy", ask: "Ask about the forge",
          reveal: "Welcome the visitor. Say a traveller can watch the work, and that the old road past the Gate and the cellar below the tavern are the two places newcomers like to explore. Do not invent names.",
          done: "Two places to explore: the old road past the Gate, or the way down under the tavern." }
    ],
    "homecoming": [
        { ask: "Ask who is still around",
          reveal: "Say happily that several of the old neighbours still live in town, and that the smith asked after the player. Name only the smith as the next stop. Do not invent other names.",
          done: "Old neighbours are still around, and the smith asked after you. Try the smith." },
        { building: "Smithy", ask: "Ask what has changed",
          reveal: "Welcome them home. Say a lot has changed: the old road past the Gate is busier since the war, and folk have started going down the cellar below the tavern to see what is there. Do not invent names.",
          done: "Two things are new since you left: the old road past the Gate, and the way down under the tavern." }
    ],
    "good-offer": [
        { ask: "Ask who is hiring",
          reveal: "Say there is steady work in town, and that the smith's commission board is the best standing job. Name only the smith as the next stop. Do not invent names.",
          done: "Steady work is posted at the smith's commission board." },
        { building: "Smithy", ask: "Ask about the commission board",
          reveal: "Tell the player the smith posts commissions on the board in the forge and pays fairly for honest deliveries, and that more work lies out past the Gate and below the tavern. Do not invent names.",
          done: "More work waits past the Gate, and below the tavern." }
    ]
};

const GUIDE_LEAD_ARRIVE_LINES = [
    "This is the place, {player}. Ask quietly, and let's see who here will talk.",
    "Here, then. Same as before: ask quietly, and watch how they answer."
];
const LEAD_STAGE_FALLBACK_TYPES = ["Inn", "Smithy", "Tavern", "Town Hall"];

// idx 0 = first lead, 1 = second. Returns { idx, type, building, place,
// ask, reveal, done } resolved against the live town, or null.
function getLeadStage(backstory, idx) {
    const arch = backstory ? PLAYER_ARCHETYPES[backstory.archetype] : null;
    const list = arch ? ARCHETYPE_LEADS[backstory.archetype] : null;
    const data = list ? list[idx] : null;
    if (!data) return null;
    const first = resolveGuideLeadPlace(backstory);
    let type, building;
    if (idx === 0) {
        type = first.type;
        building = first.building;
    } else {
        let spec = data.building;
        if (spec && typeof spec === "object") spec = spec[backstory.cls] || spec["default"];
        type = spec;
        building = findTownBuilding(type);
        const firstId = first && first.building ? first.building.id : null;
        if (!building || building.id === firstId) {
            building = null;
            for (let i = 0; i < LEAD_STAGE_FALLBACK_TYPES.length && !building; i++) {
                const b = findTownBuilding(LEAD_STAGE_FALLBACK_TYPES[i]);
                if (b && b.id !== firstId) { building = b; type = LEAD_STAGE_FALLBACK_TYPES[i]; }
            }
        }
    }
    const map = getBackstoryFillMap(backstory);
    map.leadPlace = building ? building.name : GUIDE_FALLBACK_PLACE;
    return {
        idx: idx,
        type: type,
        building: building,
        place: map.leadPlace,
        ask: _spFill(data.ask, map),
        reveal: _spFill(data.reveal, map),
        done: _spCap(_spFill(data.done, map))
    };
}

// The stage the player is working on now (0 or 1), or null once both are done.
function getCurrentLeadStage(backstory) {
    if (!backstory || !backstory.guide) return null;
    const n = backstory.guide.leadStage || 0;
    return n >= 2 ? null : getLeadStage(backstory, n);
}

// What the guide says on entering a place (once per place type per game),
// only while travelling with the player. {player} is filled.
const GUIDE_ROOM_REMARKS = {
    "Chapel": ["Quiet in here. Whatever else happens, this is a good place to think.", "Chapels are never quite empty, are they? Someone always seems to be listening."],
    "Guildhall": ["Listen to that yard. Hard to tell whether to be impressed or nervous.", "Plenty of steel in here, and every one of them is sizing you up."],
    "Smithy": ["Smell that? Hot iron and honest work. The kind of place that tells you a lot about a town.", "A forge keeps a town honest. Folk who can mend a blade hear everything."],
    "Tavern": ["Every town's real news is poured in a place like this, {player}. Keep your ears open.", "If anyone in town talks too much, it will be here."],
    "Inn": ["Travellers pass through here from all over. Somebody has always seen something worth knowing."],
    "Town Hall": ["The watch keeps its eye on the door. Be polite, and be ready to be looked over."],
    "Training Yard": ["Straw dummies and bruised pride. I like it already."],
    "Council Chamber": ["Careful now. Rooms like this are where decisions get made about people like us."],
    "Gate": ["Beyond that is everything we do not know yet. Stay close, {player}."],
    "Cellar": ["Cold air, old stone. This cellar goes down further than it should, I think."]
};

function getGuideRoomRemark(room, seedText) {
    if (!room) return null;
    const key = GUIDE_ROOM_REMARKS[room.buildingType] && room.isEntrance ? room.buildingType : (GUIDE_ROOM_REMARKS[room.type] ? room.type : null);
    if (!key) return null;
    const lines = GUIDE_ROOM_REMARKS[key];
    let h = 0;
    const seed = String(seedText || "") + key;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 9973;
    return { key: key, line: lines[h % lines.length] };
}

// Real building names for the guide to talk about when asked about the town.
function getGuideTownSummary() {
    const names = [];
    ["Tavern", "Inn", "Smithy", "Town Hall", "Guildhall", "Chapel"].forEach(function (type) {
        const b = findTownBuilding(type);
        if (b) names.push(b.name + " (" + type.toLowerCase() + ")");
    });
    return names.join(", ");
}

// ── GUIDE KNOWLEDGE: basic, common knowledge of the world ───────────────
// The guide is a local, not a rules expert. They know the town, how coin is
// made, that the gods and the portal exist, and that death is final. Fine
// points of a skill, weapon or craft belong to its trainer. Answers are
// scripted (instant, always correct); numbers are read from the engine's
// constants when they exist. A typed question is matched to a topic by
// keyword (matchGuideTopic); no match falls through to the AI with
// GUIDE_UNKNOWN_NOTE so the guide admits what they do not know.
// Engine constants are file-level `const`s, not window properties, so they are
// read through this table of getters (each guarded with typeof).
// ============================================================================
// SOCIETY SHEETS - nature and nurture for NPCs (see claude/species-culture-design.md)
// Societies get a sheet: a group, a rank in it, how they got that rank, and four
// stored facts (need, liking, worry, secret). Mobs (rats, skeletons, ghosts and
// other non-humanoids) get none. The sheets are plain data; generateNPCSocial
// (cyoaftw-npc-data.js) rolls one per NPC and the conversation options reveal
// the facts. Texts are what the NPC says, first person, short.
// Slots filled at generation: {group} {rank} {place} {house} {landlord} {zone}
// ============================================================================
const SOCIETY_BY_SPECIES = {
    Orc: "orc-clan", Goblin: "goblin-tribe", Lizardfolk: "lizardfolk-tribe",
    Kobold: "kobold", Dragonborn: "dragonborn-house",
    Human: "realm", Elf: "realm", Dwarf: "realm", Halfling: "realm",
    Catfolk: "catfolk-troupe", Wolfkin: "wolfkin-pack", Satyr: "satyr-revel",
    Harefolk: "harefolk-warren", Ratfolk: "ratfolk-nest", Kenku: "kenku-flock"
};

const DRAGONBORN_HOUSES = ["House Emberscale", "House Vaelthorn", "House Ironcrest", "House Ashmaw", "House Solgard"];

const SOCIETY_SHEETS = {
    "orc-clan": {
        label: "clan",
        groupNames: ["Skullsplitter", "Red Fang", "Ashhide", "Stonetusk", "Bloodmaw", "Blackbrand"],
        groupPrefix: "Clan ",
        leadership: "The strongest rules. A rank is held until someone stronger takes it.",
        ranks: [
            { key: "chieftain", label: "chieftain", tier: 4, weight: 2 },
            { key: "war-leader", label: "war-leader", tier: 3, weight: 6 },
            { key: "champion", label: "champion", tier: 2, weight: 14 },
            { key: "warrior", label: "warrior", tier: 1, weight: 52 },
            { key: "whelp", label: "untested whelp", tier: 0, weight: 18 },
            { key: "outcast", label: "outcast", tier: 0, weight: 8 }
        ],
        standings: [
            "I won this standing by beating a rival in a fair fight.",
            "I lost a challenge once and have fought to climb back since.",
            "I was born to the clan and I am still proving it.",
            "I took the place of a fallen warrior and I have kept it.",
            "The clan watches me. I am quicker to fight than to think."
        ],
        needs: [
            { kind: "help", text: "A rival in {group} has been slighting me. I want a witness when I settle it, someone who will tell it straight." },
            { kind: "item", text: "I need a good blade. Mine is notched past saving, and a warrior with a bad blade is a dead warrior." },
            { kind: "coin", text: "I owe the clan a share of spoils and came home short. Coin would square it." },
            { kind: "news", text: "I need word of where the next fight is. The clan sits idle, and idle clans eat their own." }
        ],
        likings: [
            "A good fight. Win or lose, a clean one.",
            "Fresh meat, rare, and plenty of it.",
            "A scar with a story behind it.",
            "Old war-songs, the loud kind."
        ],
        worries: [
            "Someone stronger is coming up behind me. I feel it.",
            "The clan is getting weak, and weak clans get eaten.",
            "A foe I cannot beat has marked me, and I will not run from it.",
            "I have fought too little lately. A warrior who does not fight fades."
        ],
        secrets: [
            { text: "I lost to a smaller foe once and told no one. If it came out, my rank would go with it." },
            { text: "I do not want to be chieftain. I only want to be left alone. In {group} that is the same as being weak." },
            { text: "I kept spoils back from the clan. If they search my kit, I am done." }
        ]
    },
    "goblin-tribe": {
        label: "tribe",
        groupNames: ["Gutter Rats", "Mirebiters", "Hollow Knives", "Sootclaw", "Greasy Thumb", "Lanternless"],
        groupPrefix: "the ",
        leadership: "A chieftain rules a large tribe, usually with magic-users (shamans) at the ear. They fear magic and keep its users close.",
        ranks: [
            { key: "chieftain", label: "chieftain", tier: 4, weight: 2 },
            { key: "shaman", label: "shaman-advisor", tier: 3, weight: 5 },
            { key: "boss", label: "warband boss", tier: 2, weight: 9 },
            { key: "sneak", label: "sneak-thief", tier: 1, weight: 34 },
            { key: "scrounger", label: "scrounger", tier: 1, weight: 34 },
            { key: "runt", label: "runt", tier: 0, weight: 16 }
        ],
        standings: [
            "I rose by selling out a rival, and I have looked over my shoulder since.",
            "I know a useful secret about a boss, so I am not cheated much.",
            "I am clever, but that is worth nothing unless the chief knows it.",
            "I serve a boss who takes most of the haul and gives back scraps.",
            "I am one bad week from being fed to the dogs, and I know it."
        ],
        needs: [
            { kind: "coin", text: "Coin. Not for the tribe. For me. A little buried somewhere no boss can find." },
            { kind: "item", text: "Something shiny to give my boss, enough to look useful. Ask no more than that." },
            { kind: "help", text: "Someone is on my trail. Not a friend of yours, I hope. I need them to lose me." },
            { kind: "news", text: "I need to know which way the chief's mood is blowing before I walk back into camp." }
        ],
        likings: [
            "Shiny things, especially if nobody is counting them.",
            "A good lie that works.",
            "Stolen food. It tastes better.",
            "Being the one who knows something."
        ],
        worries: [
            "Magic. The shaman's magic, anyone's magic. It turns a man into a smear.",
            "A boss who thinks I know too much.",
            "Running short of someone to blame.",
            "Dark corners that used to be empty and are not now."
        ],
        secrets: [
            { text: "I sell what I overhear to the other tribes. If {group} learned it, I would be bait by dawn." },
            { text: "I can do a little magic. A spark, a trick. If the shaman finds out, I am dead or I belong to him." },
            { text: "I have a way out of the tribe's lair that no one else knows. I keep it for the day I need it." }
        ]
    },
    "lizardfolk-tribe": {
        label: "tribe",
        groupNames: ["Reed-Tail", "Mire-Warden", "Slow-Water", "Sun-Scale", "Black-Pool", "Sedge-Hold"],
        groupPrefix: "the ",
        leadership: "Family units under the elders; the whole tribe shares food and labour and defends its ground to the death.",
        ranks: [
            { key: "elder", label: "elder", tier: 4, weight: 3 },
            { key: "hunt-leader", label: "hunt-leader", tier: 3, weight: 8 },
            { key: "warden", label: "warden of the territory", tier: 2, weight: 16 },
            { key: "hunter", label: "hunter", tier: 1, weight: 38 },
            { key: "forager", label: "forager", tier: 1, weight: 25 },
            { key: "hatch-tender", label: "hatch-tender", tier: 1, weight: 10 }
        ],
        standings: [
            "I was born to this stretch of water and have never wanted another.",
            "I joined this family unit through marriage and have worked to be trusted.",
            "I took over a fallen kin's duty and I carry it as my own.",
            "I share what I catch without thinking, as everyone does, and I expect the same back.",
            "I have driven intruders off the boundary more than once."
        ],
        needs: [
            { kind: "help", text: "Intruders keep crossing our ground. Help me watch the boundary and the tribe will remember it." },
            { kind: "item", text: "Salt and good fish-hooks. The tribe is short, and I would not ask if we were not." },
            { kind: "coin", text: "Coin for the hatch-tenders. They need warm stone and fresh reed, and the stone is not free." },
            { kind: "news", text: "Tell me what you saw on your road. A stranger in the water is a stranger at our nests." }
        ],
        likings: [
            "Fresh fish, shared among the family.",
            "Warm stone at midday, and quiet.",
            "A good hunt with the whole family along.",
            "Still water at dusk."
        ],
        worries: [
            "Strangers settling on our ground.",
            "The water going bad. It is the tribe's life.",
            "A hatching going wrong this season.",
            "The tribe splitting over food. It has happened before."
        ],
        secrets: [
            { text: "I have been feeding a stranger outside the boundary. If {group} finds out, I am cast out." },
            { text: "I do not hunt well anymore. My kin cover for me and say nothing, and it shames us both." },
            { text: "I know where an old hoard lies under the mire. I have never told the elders. I have no idea why." }
        ]
    },
    "kobold": {
        label: "service",
        groupNames: [],
        groupPrefix: "",
        leadership: "Every kobold belongs to a master or a patron, because without one they are nothing. Dragonborn are gods to them.",
        // status decides the rank/standing/group wording; see generateNPCSocial.
        statuses: {
            bonded: { label: "bonded servant", tier: 2, group: "the {house} household", standing: "I serve {house}. It is the highest honour of my small life." },
            feral: { label: "feral, seeking a master", tier: 0, group: "no master yet", standing: "I wander the dark looking for a dragonborn worthy of kneeling to." },
            runaway: { label: "runaway", tier: 0, group: "the lower tunnels", standing: "I fled a cruel master. I still flinch at a raised hand." },
            tribute: { label: "tribute-payer", tier: 1, group: "a stronger band", standing: "I pay tribute to a stronger band and do as I am told." },
            worshipper: { label: "dragon's worshipper", tier: 1, group: "an unseen dragon's cult", standing: "I serve an unseen dragon whose name is never said aloud." }
        },
        needs: [
            { kind: "help", only: ["feral", "runaway"], text: "I need a master. Someone strong, someone with fire in their blood. I will serve and ask for nothing." },
            { kind: "item", text: "Something to offer for the dragon's altar. A coin, a gem, a bright thing. I came with empty hands." },
            { kind: "coin", text: "Coin for my tribute. If I am short again, they will take it from my hide." },
            { kind: "news", text: "Word of any great scaled one. Anything. I would walk a month for rumor of a dragon." }
        ],
        likings: [
            "Warm stone and coal-light.",
            "Stories of dragons, told reverently.",
            "A kind word. Rare, so rare.",
            "Bright metal, polished."
        ],
        worries: [
            "Failing my master and being cast out.",
            "Being found by hunters before I find a master.",
            "The cold, and the dark, and no one to serve.",
            "A rival kobold who is better liked by the one I serve."
        ],
        secrets: [
            { only: ["bonded"], text: "I do not truly love my master. I fear them. I am too small to say it aloud." },
            { only: ["bonded"], text: "I have been skimming a few bright things from my master's hoard. A few. I mean to return them." },
            { text: "I am not sure the dragons are gods. I am too afraid to ask a dragonborn." }
        ]
    },
    "catfolk-troupe": {
        label: "troupe",
        groupNames: ["Quiet Paw", "Lantern Road", "Silk Whisker", "Moonstep", "Copper Tail", "Dusk Caravan"],
        groupPrefix: "the ",
        leadership: "A troupe is a travelling family led by an elder who holds the road-map and the purse. Nobody is ordered about; everyone is persuaded, or simply leaves.",
        ranks: [
            { key: "troupe-elder", label: "troupe elder", tier: 4, weight: 3 },
            { key: "pathfinder", label: "pathfinder", tier: 3, weight: 10 },
            { key: "peddler", label: "peddler", tier: 2, weight: 32 },
            { key: "nimble", label: "nimble-fingered cousin", tier: 1, weight: 24 },
            { key: "dreamer", label: "idle dreamer", tier: 1, weight: 20 },
            { key: "stray", label: "stray from the troupe", tier: 0, weight: 11 }
        ],
        standings: [
            "I carry a share of the troupe's goods and I keep my accounts spotless, for once.",
            "I left my troupe on a quarrel and I am too proud to go back.",
            "I am the family's best bargainer, and I do not let them forget it.",
            "I sleep wherever the sun lands, and the troupe lets me, so long as I earn my keep.",
            "I took a debt for the troupe and I mean to clear it before the next thaw."
        ],
        needs: [
            { kind: "coin", text: "Coin for a debt I would rather the troupe never heard about." },
            { kind: "item", text: "Good fish, or anything cream-sweet. I have been living on stale bread, and I am sulking about it." },
            { kind: "news", text: "Which road is open and which is watched. A troupe lives on that." },
            { kind: "help", text: "Someone to carry a parcel across a gate I would rather not be seen at." }
        ],
        likings: [
            "A warm windowsill and an hour of nothing.",
            "A clever bargain won fair.",
            "Fresh fish, cream, anything that smells of the river.",
            "A good tale, told twice."
        ],
        worries: [
            "Being shut in. Cages, cellars, locked doors.",
            "That the troupe will move on without me.",
            "A debt that outlasts the road.",
            "Rain on the caravan. It is never just rain."
        ],
        secrets: [
            { text: "I have a hidden cache beneath a stone in {zone}, in case I have to run. No one in {group} knows." },
            { text: "I once cheated a fellow troupe-cousin. We have not spoken since, and I miss them." },
            { text: "I can read, though I pretend I cannot. It keeps me from being handed the ledger." }
        ]
    },
    "wolfkin-pack": {
        label: "pack",
        groupNames: ["Greyfang", "Ashmane", "Ridgehowl", "Frostpaw", "Stonetrail", "Nightwatch"],
        groupPrefix: "the ",
        leadership: "A mated pair leads, the alpha and the steady-hand; the hunters follow their word. Disobedience is answered with exile.",
        ranks: [
            { key: "alpha", label: "pack alpha", tier: 4, weight: 3 },
            { key: "warden", label: "den-warden", tier: 3, weight: 10 },
            { key: "hunter", label: "hunter", tier: 2, weight: 33 },
            { key: "scout", label: "trail-scout", tier: 1, weight: 28 },
            { key: "cub-keeper", label: "cub-keeper", tier: 1, weight: 12 },
            { key: "lone", label: "lone wolf", tier: 0, weight: 14 }
        ],
        standings: [
            "I earned my place on the hunt, and I keep it by never coming home empty.",
            "I am sworn to the pack. Whatever it asks, I do.",
            "I was cast out of my pack and I am still not sure whether I was wronged.",
            "I watch the den and the cubs. It is quieter work, and it matters more than most think.",
            "I walk the boundary and report what I find. Silence is the pack's first defence."
        ],
        needs: [
            { kind: "help", text: "A stranger has been tracking the pack's boundary. I would have a witness to what I find." },
            { kind: "item", text: "Salt and a good knife. The hunt has been lean, and a wolf with a dull knife is a hungry wolf." },
            { kind: "coin", text: "Coin to buy meat for the cubs. We do not beg, but the season has been poor." },
            { kind: "news", text: "Word of any hunters or trappers working these roads. The pack must know." }
        ],
        likings: [
            "Meat, rare, shared with company.",
            "A good run on a cold morning.",
            "Silence broken only by the pack's howling.",
            "A story of a long hunt, told true."
        ],
        worries: [
            "That the pack will scatter, and I will be alone.",
            "A hunter who takes more than the pack can answer for.",
            "Cubs lost to a hard winter.",
            "The silver-smell of a trap. Chains. Cages."
        ],
        secrets: [
            { text: "I once broke a hunt-oath for a stranger, and {group} does not know. If they learned it, I would be driven out." },
            { text: "I am tired of the pack. I would rather walk alone than follow another order. That is a shame I keep behind my teeth." },
            { text: "I have been feeding a stray from beyond the territory. The pack would call it treason." }
        ]
    },
    "satyr-revel": {
        label: "revel",
        groupNames: ["Merry Hooves", "Goat-Horn Chorus", "Wine-Dark Circle", "Reed-Pipe Band", "Moonlit Fauns", "Crooked Smile"],
        groupPrefix: "the ",
        leadership: "No rulers, only a most-charismatic reveller who calls the next party. Everyone follows the music until the cup runs dry.",
        ranks: [
            { key: "master-of-revels", label: "master of revels", tier: 4, weight: 2 },
            { key: "piper", label: "piper", tier: 3, weight: 10 },
            { key: "cup-bearer", label: "cup-bearer", tier: 2, weight: 24 },
            { key: "troublemaker", label: "known troublemaker", tier: 1, weight: 34 },
            { key: "reveller", label: "reveller", tier: 1, weight: 24 },
            { key: "sulker", label: "sulking outcast", tier: 0, weight: 6 }
        ],
        standings: [
            "I am the best piper in three valleys, and nobody can prove otherwise.",
            "I was thrown out of the last revel for a prank gone sour, and I am hoping for a second chance.",
            "I keep the cups full and the secrets quiet.",
            "I have been the reason for most of the trouble in {group}, and I am proud of it.",
            "I am only here until the next party. Do not tell {group} I said so."
        ],
        needs: [
            { kind: "item", text: "Good wine, a flask of it, and I will owe you a song." },
            { kind: "coin", text: "Coin for a tab I ran at the tavern. The barkeep has the look of a man planning something." },
            { kind: "help", text: "A friend to bear witness that the whole thing was a prank. Entirely a prank." },
            { kind: "news", text: "Where the next feast is. I will find the cheese myself." }
        ],
        likings: [
            "Wine. Any wine. Better with company.",
            "A well-played prank, at someone else's expense.",
            "Pipes and drums at dusk.",
            "Cheese, ripe fruit, the last of a loaf."
        ],
        worries: [
            "A stern neighbour who might finally call the guard on me.",
            "Running out of wine.",
            "A prank turning out to hurt someone I like.",
            "Quiet. Dreadful quiet. It makes me think."
        ],
        secrets: [
            { text: "I swapped the wine of a very stern man for vinegar, and the stern man is now town magistrate. I keep my hat low." },
            { text: "I do not actually know how to play the pipes. I only learned to look like I do." },
            { text: "I owe {group} more than I can ever repay, and I have begun to avoid them for it." }
        ]
    },
    "harefolk-warren": {
        label: "warren",
        groupNames: ["Longear", "Clover Hollow", "Brindle Down", "Thistlerun", "Burrowdeep", "Quickfoot"],
        groupPrefix: "the ",
        leadership: "A warren is run by its eldest, who keeps the tunnel maps in their head and calls the alarm. Everyone has a say, usually all at once, and the warren moves only when the elder has finished listening.",
        ranks: [
            { key: "warren-elder", label: "warren elder", tier: 4, weight: 3 },
            { key: "tunnel-warden", label: "tunnel-warden", tier: 3, weight: 10 },
            { key: "forager", label: "forager", tier: 2, weight: 32 },
            { key: "runner", label: "runner", tier: 1, weight: 26 },
            { key: "kit-minder", label: "kit-minder", tier: 1, weight: 16 },
            { key: "wanderer", label: "wanderer from the warren", tier: 0, weight: 13 }
        ],
        standings: [
            "I keep the larder stocked, and nobody in the warren has gone hungry on my watch.",
            "I carry word between warrens. If I stop, a dozen families stop hearing from each other.",
            "I left my warren after a quarrel, and I pretend I do not listen for its alarm drum.",
            "I mind the little ones. They say I fuss, and they are right.",
            "I walk the tunnels and listen at every junction. Nothing gets past my ears."
        ],
        needs: [
            { kind: "item", text: "Greens, root vegetables, anything fresh. The larder is thin and the cold is coming." },
            { kind: "news", text: "Which roads are watched, and by whom. A warren lives on that." },
            { kind: "help", text: "Someone to walk a parcel past a place I would rather not cross alone." },
            { kind: "coin", text: "Coin for seed and a good lock. The last one was no use against a fox." }
        ],
        likings: [
            "A crowded hearth and someone else cooking.",
            "Fresh greens and sweet herb tea.",
            "News, even small news, told twice.",
            "A warm burrow in the cold."
        ],
        worries: [
            "Snares, cages and anything with a latch on the outside.",
            "Hunger in the winter.",
            "That the alarm will come too late.",
            "Strangers who stand between me and the door."
        ],
        secrets: [
            { text: "I once raised a false alarm and sent the whole warren running. They still tell the story, and they do not know it was me." },
            { text: "I have a second burrow nobody in {group} knows of, stocked in case I have to run alone." },
            { text: "I am tired of being afraid. I want, just once, to stand my ground and not run." }
        ]
    },
    "ratfolk-nest": {
        label: "nest",
        groupNames: ["Gutter Gnaw", "Cinder Drain", "Rusty Tail", "Pennyscrape", "Lowlamp", "Brasswhisker"],
        groupPrefix: "the ",
        leadership: "A nest answers to its boss, usually the best fixer in the drains, and to the debts everyone owes. Nobody is turned out while they still earn their keep, and nothing is thrown away that someone could use.",
        ranks: [
            { key: "nest-boss", label: "nest boss", tier: 4, weight: 3 },
            { key: "fixer", label: "fixer", tier: 3, weight: 10 },
            { key: "scrounger", label: "scrounger", tier: 2, weight: 32 },
            { key: "tunnel-runner", label: "tunnel-runner", tier: 1, weight: 26 },
            { key: "tinker", label: "tinker", tier: 2, weight: 14 },
            { key: "outcast", label: "outcast from the nest", tier: 0, weight: 15 }
        ],
        standings: [
            "I find what others throw out and sell it back to them. Honest work, mostly.",
            "I owe the nest and the nest owes me. We keep an accurate count.",
            "I was put out of my nest over a deal gone wrong, and I am working my way back.",
            "I know every drain and shortcut under this place, and they pay me to say so.",
            "I fix things: locks, pots, bad ideas. I do not ask what they are for."
        ],
        needs: [
            { kind: "item", text: "Scrap, wire, anything with a bit of metal in it. A nest runs on what other people leave." },
            { kind: "coin", text: "Coin to settle a debt before the interest eats me alive." },
            { kind: "news", text: "Who is paying for salvage this week, and who is hunting for it." },
            { kind: "help", text: "Someone to carry a sack past a gate I would rather not be seen at." }
        ],
        likings: [
            "A good find at the bottom of a heap.",
            "Cheese rinds, nuts, anything someone left behind.",
            "A fair deal, shaken on.",
            "A dry, warm corner with the whole nest close."
        ],
        worries: [
            "Poison, traps and anyone with a broom and a bad attitude.",
            "Being called vermin by someone who needs my help next week.",
            "A flood in the lower tunnels.",
            "Owing the wrong sort of person."
        ],
        secrets: [
            { text: "I skim a coin from every deal the nest makes, and the boss does not know. I mean to stop. Soon." },
            { text: "I kept something from a find that was meant to go to {group}. It is the best thing I have ever owned." },
            { text: "I can read, and I pretend I cannot. Being underestimated pays better than being clever." }
        ]
    },
    "kenku-flock": {
        label: "flock",
        groupNames: ["Brightcrow", "Tin Cup", "Echo Roof", "Magpie Row", "Clatter", "Nightperch"],
        groupPrefix: "the ",
        leadership: "A flock follows its caller, whoever keeps the best store of voices and the sharpest eye. Nothing is ordered aloud; the caller shows a posture, and the flock moves.",
        ranks: [
            { key: "flock-caller", label: "flock caller", tier: 4, weight: 3 },
            { key: "voice-keeper", label: "keeper of voices", tier: 3, weight: 10 },
            { key: "trader", label: "trinket trader", tier: 2, weight: 30 },
            { key: "lookout", label: "rooftop lookout", tier: 1, weight: 28 },
            { key: "fledgling", label: "fledgling", tier: 1, weight: 15 },
            { key: "unflocked", label: "unflocked wanderer", tier: 0, weight: 14 }
        ],
        standings: [
            "I keep the flock's best voices, the ones worth remembering. When I speak, it is with someone else's words and my own meaning.",
            "I trade bright things for useful ones, and I never short a fair swap.",
            "I watch from the roofs and tell the flock what I overhear, in the voices I heard it in.",
            "I am young. I am still collecting my first voices, and I trip over every one.",
            "I left my flock, or they left me. Either way I carry their voices and no one to say them to."
        ],
        needs: [
            { kind: "item", text: "Something bright and small: a button, a coin, a bit of mirror. The flock counts a good trinket as a good day." },
            { kind: "news", text: "New phrases, new voices, anything worth keeping. A flock is only as rich as what it has heard." },
            { kind: "help", text: "Someone to walk me past a place with a cage in it. I do not go near cages." },
            { kind: "coin", text: "Coin, but only the shiny sort. I do not trust the dull sort." }
        ],
        likings: [
            "Bright trinkets, laid out in a row.",
            "A clear voice saying something worth keeping.",
            "A high perch and a good view.",
            "A fair swap, shaken on."
        ],
        worries: [
            "Cages, clipped wings and anyone who laughs at a borrowed voice.",
            "Losing a voice I have kept for years.",
            "That the flock will scatter.",
            "Being asked something in my own words, when I have none."
        ],
        secrets: [
            { text: "I kept one voice that was never meant to be kept: someone from {group} who is gone now. I say their words when I am alone." },
            { text: "I once repeated a secret I overheard, in exactly the voice I heard it in, and a good person was ruined by it." },
            { text: "I hide a small hoard on a rooftop in {zone}. It is the only thing I own that nobody has ever asked me to share." }
        ]
    },
    "dragonborn-house": {
        label: "house",
        groupNames: DRAGONBORN_HOUSES.slice(),
        groupPrefix: "",
        leadership: "Houses are ranked by purity of bloodline. The purest and oldest line rules; mixed blood ranks lower. Succession is contested.",
        ranks: [
            { key: "head", label: "head of the house", tier: 4, weight: 3 },
            { key: "pure", label: "pure-blood of the house", tier: 3, weight: 14 },
            { key: "thin", label: "thin-blood cadet", tier: 2, weight: 33 },
            { key: "mixed", label: "mixed-blood retainer", tier: 1, weight: 35 },
            { key: "oathless", label: "oathless exile", tier: 0, weight: 15 }
        ],
        standings: [
            "I hold the position the house expects of the blood, and I will not be seen to falter.",
            "My blood is thin. I work twice as hard to be thought worthy.",
            "I carry an oath to the house that outranks anything I might want.",
            "I was shamed once in the eyes of the house and have been rebuilding my name since.",
            "I hold kobold retainers. They are a measure of standing."
        ],
        needs: [
            { kind: "help", text: "I need a witness for a matter of honour. Someone with no tie to {house}, to say what they saw." },
            { kind: "item", text: "Fine meat, properly hung. The cook here serves vegetables, as if I were a lowborn." },
            { kind: "coin", text: "The house's tithe is due. I would not be seen short of it." },
            { kind: "news", text: "Anything you hear of a rival house moving against {house}. Tell me first." }
        ],
        likings: [
            "Meat, rare. Nothing else is food.",
            "To be addressed correctly. Titles matter.",
            "Old lineage-songs of the great dragons.",
            "Competence, shown quietly."
        ],
        worries: [
            "My blood being doubted.",
            "A rival rising within the house.",
            "Being forced to answer to someone beneath me.",
            "Failing the oath I swore."
        ],
        secrets: [
            { text: "I am not as pure as the house claims. A grandparent was not of the blood. If it came out, I would be cast down." },
            { text: "I have been quietly buying kobold servants. I am not sure it is entirely lawful." },
            { text: "I do not believe my line deserves to rule. I would never say so where {house} could hear." }
        ]
    },
    "realm": {
        label: "station",
        groupNames: [],
        groupPrefix: "",
        leadership: "The Crown names nobles; nobles alone own land. Everyone else holds a trade and rents. Wealth, guild standing and royal grants move people up.",
        castes: {
            noble: [
                { key: "lord", label: "head of a landed House", tier: 4, weight: 2 },
                { key: "heir", label: "heir of a landed House", tier: 3, weight: 3 },
                { key: "scion", label: "younger scion of a noble line", tier: 2, weight: 5 },
                { key: "knight", label: "household knight", tier: 2, weight: 3 },
                { key: "steward", label: "steward of an estate", tier: 2, weight: 3 }
            ],
            master: { key: "master", label: "master of their trade", tier: 2 },
            tradesperson: { key: "trade", label: "tradesperson", tier: 1 },
            wage: { key: "wage", label: "wage-earner", tier: 1 },
            drifter: { key: "drifter", label: "drifter with no fixed trade", tier: 0 }
        },
        standingsByCaste: {
            noble: [
                "I was born to land and have never paid rent a day in my life.",
                "My family holds an estate granted by the Crown.",
                "I am waiting on a grant that would raise the family's name.",
                "I am heavy with duties to the House and light on freedom."
            ],
            commoner: [
                "I pay {landlord} rent each season and keep just enough over to live.",
                "I earned my trade the hard way and mean to pass it on.",
                "I came here new, like most, and I am still finding my place.",
                "I work for others and rent from {landlord}, like nearly everyone in town.",
                "I owe {creditor} a debt that has hung over me longer than I like."
            ]
        },
        needs: [
            { kind: "coin", text: "Rent is due to {landlord} and I am short. Everything I earn goes to it." },
            { kind: "help", text: "A small matter I cannot handle alone. I would pay, if the work was honest." },
            { kind: "item", text: "Good tools, or something to trade. I am a few pieces short of doing my work properly." },
            { kind: "news", text: "I am waiting on word from the {landlord} household. Tell me anything you hear." }
        ],
        likings: [
            "A fair price and an honest word.",
            "A warm meal after a long day.",
            "Quiet, and a roof I can count on.",
            "Good talk about the trade."
        ],
        worries: [
            "Rent going up. It always does.",
            "Losing my place to someone cheaper.",
            "A debt I cannot clear.",
            "What the nobles will do next. They never ask us."
        ],
        secrets: [
            { text: "I am behind on rent more than anyone knows, and {landlord}'s agent has started to notice." },
            { text: "I once cheated a customer badly, and I think about it. The debt is not only coin." },
            { text: "I dream of owning land. They say it is not for the likes of us. I will not stop dreaming it." }
        ]
    }
};

// A staff/trade role's standing in the Realm.
const REALM_MASTER_ROLES = ["Bathkeeper", "Guildmaster", "Innkeeper", "Blacksmith", "Clothier", "Shopkeeper", "Healer", "Priest", "Archivist", "Enchanter", "Arcanist", "Reliquarian"];
const REALM_TRADE_ROLES = ["Vendor", "Bartender", "Cook", "Scholar", "Merchant", "Trader"];
const REALM_WAGE_ROLES = ["Servant", "Villager", "Townsfolk", "Miner", "Guard", "Scout", "Stone Guard"];

// ============================================================================
// THE KINGDOM AND ITS HOUSES
// One kingdom, one crown. The crown grants nobility; nobles are a caste and
// ONLY nobles own land. Everyone else rents: a home, a shop, a room. The town
// is split between a few noble Houses, each with a seat (a manor or castle
// outside the town streets). Crown holds the public buildings. Details of the
// wider land are deliberately left open. Rename by editing KINGDOM_NAME.
// ============================================================================
const KINGDOM_NAME = "the Kingdom";
const NOBLE_HOUSES = [
    { id: "harrow", name: "House Harrow", seat: "Harrow Keep", seatKind: "castle", note: "old blood, holds the north of the town and the gate road" },
    { id: "vane", name: "House Vane", seat: "Vane Manor", seatKind: "manor", note: "newer money, holds the market streets and most of the inns" },
    { id: "corwin", name: "House Corwin", seat: "Corwin Hall", seatKind: "manor", note: "quiet and proud, holds the south side and the chapel lands" }
];
const CROWN_HELD_TYPES = ["Town Hall", "Guildhall", "Chapel"];

function _hashString(str) {
    let h = 0;
    const s = String(str || "");
    for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) | 0;
    return Math.abs(h);
}

// Who owns the land a building stands on. Deterministic per building.
// Returns { crown: true, name } or { crown: false, house }.
function getBuildingLandholder(buildingId, buildingType) {
    if (CROWN_HELD_TYPES.indexOf(buildingType) >= 0) return { crown: true, name: "the Crown" };
    const house = NOBLE_HOUSES[_hashString(buildingId) % NOBLE_HOUSES.length];
    return { crown: false, house: house, name: house.name };
}

function getKingdomSummary() {
    return "Land in " + KINGDOM_NAME + " belongs to the noble Houses, whom the Crown names, and to the Crown itself. Only nobles may own land. Everyone else rents. Three Houses hold this district: " +
        NOBLE_HOUSES.map(function (h) { return h.name + " at " + h.seat; }).join(", ") + ".";
}

function _guideConst(key) {
    if (key === "portalFee") return typeof TOWN_PORTAL_BASE_COST === "number" ? TOWN_PORTAL_BASE_COST : 200;
    if (key === "portalGrowth") return typeof TOWN_PORTAL_COST_GROWTH === "number" ? TOWN_PORTAL_COST_GROWTH : 2;
    if (key === "maxBounties") return typeof QUEST_MAX_ACTIVE === "number" ? QUEST_MAX_ACTIVE : 3;
    if (key === "deathOdds") return typeof PLAYER_DEATH_CHANCE === "number" && PLAYER_DEATH_CHANCE > 0 ? Math.round(1 / PLAYER_DEATH_CHANCE) : 4;
    if (key === "reviveCost") return typeof DIVINE_REVIVAL_COST === "number" ? DIVINE_REVIVAL_COST : 10;
    return 0;
}

const GUIDE_KNOWLEDGE = [
    {
        id: "next",
        question: "What should I do next?",
        keywords: ["next", "first", "start", "begin", "plan", "now", "should", "where do i go", "what do i do"],
        answer: function (map, bs) { const st = getGuideNextStep(bs); return st ? st.text : ""; }
    },
    {
        id: "how",
        question: "How does this work?",
        keywords: ["how does this work", "how do i play", "how to play", "how do i move", "how do i talk", "how do i speak", "how do i walk", "controls", "buttons", "tutorial", "choices", "interact", "typing", "how it works", "how this works"],
        answer: function () {
            return "\"Everything here is a choice, and the road is yours. The buttons around the map walk you down streets and through doors. The middle one, Interact, lets you look around, search, take and use what is in the room. Anyone or anything you see is a name you can tap: tap a person to speak to them, and you will be offered things to say or do. Choose Respond, or Say something, to put it in your own words instead. The people remember what you do, so choose with care.\"";
        }
    },
    {
        id: "pursuit",
        question: "Is anyone still after me?",
        keywords: ["after me", "chasing me", "chase", "chased", "hunt", "hunted", "hunters", "following me", "followed", "pursue", "pursuers", "pursuit", "collector", "collectors", "debt", "debts", "owe", "owed", "enemy", "enemies", "looking for me", "who is looking"],
        answer: function () {
            const t = typeof window !== "undefined" && typeof window.getPressureGuideText === "function" ? window.getPressureGuideText() : "";
            return "\"" + (t || "Not that I know of. Nobody has come asking, and I have been listening.") + "\"";
        }
    },
    {
        id: "stronger",
        question: "How do I get stronger?",
        keywords: ["stronger", "strong", "train", "trainer", "training", "learn", "level", "xp", "skill", "skills", "teacher", "practice", "practise", "improve", "better", "lesson", "lessons"],
        answer: function (map) {
            return "\"Find someone to teach you. " + map.guildPlace + " has trainers and a yard to practise in, and a teacher will take your coin and drill you properly. Cheaper, you can hammer the dummies in the yard. Fighting teaches you too, but it bites back. For the fine points of a weapon or a craft, ask the trainer who knows it. I only know the basics.\"";
        }
    },
    {
        id: "money",
        question: "How do I make money?",
        keywords: ["money", "coin", "coins", "gold", "earn", "job", "jobs", "find work", "get work", "need work", "looking for work", "any work", "odd jobs", "bounty", "bounties", "quest", "quests", "pay", "paid", "rich", "afford", "loot", "sell", "wage", "wages", "tip", "tips", "board"],
        answer: function (map) {
            return "\"Work for it or hunt for it. Innkeepers, bartenders and cooks hire hands, and the notice boards in the tavern, the inn and the Town Hall list jobs and bounties. You can carry up to " + _guideConst("maxBounties") + " bounties at once; most want pests culled, and you bring back a trophy as proof. Jobs cost stamina and time, and a day's work ends with you sleeping and then collecting your pay. Whatever you loot and sell adds up. You will need coin for trainers, and one day for the portal.\"";
        }
    },
    {
        id: "patron",
        question: "What is a patron?",
        keywords: ["patron", "god", "gods", "deity", "deities", "pray", "prayer", "praying", "shrine", "shrines", "faith", "priest", "divine", "worship", "pledge", "trickster", "titan", "healer", "guardian", "outcast"],
        answer: function (map) {
            return "\"There are five gods: the Trickster, the Titan, the Healer, the Guardian and the Outcast. Priests and their books will tell you about them. Pledge to one at a shrine and they are your patron for good, so choose with care. Serve them by praying and keeping their shrines. If you die, a patron with enough strength can pull you back, but you lose every coin and weapon you carried, and it costs them " + _guideConst("reviveCost") + " power to do it. With no patron, death is the end.\"";
        }
    },
    {
        id: "death",
        question: "What happens if I die?",
        keywords: ["die", "dies", "died", "dying", "death", "dead", "blessing", "blessed", "revive", "resurrect", "permadeath", "safe", "safety", "killed", "kill", "survive"],
        answer: function (map) {
            return "\"Death is final here. When a blow drops you to zero health there is about a one in " + _guideConst("deathOdds") + " chance it kills you outright. A newcomer's blessing, free at any shrine, saves you once with your gear intact. After that, only a patron god strong enough to answer can pull you back, and you lose everything you carried. Without one, you start over. Ask for the blessing at the shrine in " + map.chapelPlace + " before you take any risks.\"";
        }
    },
    {
        id: "portal",
        question: "What is the portal for?",
        keywords: ["portal", "portals", "waygate", "gate", "new town", "harder", "fee", "town hall", "tier"],
        answer: function (map) {
            return "\"Under the Town Hall is a portal chamber. For a fee, " + _guideConst("portalFee") + " gold the first time and doubling after that, it opens a new town: harder foes, better gear and richer purses. The old towns stay as you left them and the way back is free. Your bounties and any wanted status follow you through.\"";
        }
    },
    {
        id: "fighting",
        question: "How do I fight?",
        keywords: ["fight", "fighting", "combat", "battle", "attack", "weapon", "weapons", "enemy", "enemies", "monster", "monsters", "flee", "run", "spell", "spells", "magic", "armour", "armor", "sword"],
        answer: function (map) {
            return "\"Fights run in turns and the quicker side moves first. Mind your health and the warning shown under it, and break off before it turns bad. I know that much, not the fine points. The trainers at " + map.guildPlace + " know each weapon and craft far better than I do. Ask them how it is done.\"";
        }
    },
    {
        id: "lodging",
        question: "Where can I sleep?",
        keywords: ["sleep", "sleeping", "lodging", "room", "rooms", "rent", "renting", "landlord", "bed", "beds", "noble", "nobles", "own land", "owns", "stay the night", "somewhere to stay", "where do i stay", "house", "houses"],
        answer: function (map) {
            return "\"Nobody owns land here but the nobles, and the Crown names them. Everyone else rents, you included. The innkeeper lets rooms by the week. Pay, and you get a key to a room that is yours until the rent runs out, with a real bed. Friends with a place of their own may let you crash too. A proper bed heals you faster and clears your head.\"";
        }
    },
    {
        id: "rest",
        question: "How do I heal?",
        keywords: ["heal", "healing", "hurt", "wound", "wounds", "wounded", "bleed", "bleeding", "rest", "resting", "potion", "potions", "bandage", "bandages", "health", "hp", "stamina"],
        answer: function () {
            return "\"Rest somewhere safe, with no enemies close, and you will mend. Bind any bleeding wounds with a bandage, and keep a Potion of Health for the bad days. A bed at an inn is the best place to sleep a day off.\"";
        }
    },
    {
        id: "town",
        question: "What is in this town?",
        keywords: ["town", "place", "places", "building", "buildings", "tavern", "inn", "smithy", "smith", "chapel", "guildhall", "guild", "map", "directions", "around", "here", "where"],
        answer: function () {
            const places = typeof getGuideTownSummary === "function" ? getGuideTownSummary() : "";
            return "\"" + (places ? "Here is what the town has: " + places + ". " : "") + "Anyone local can give you directions if you lose your way.\"";
        }
    },
    {
        id: "past",
        question: "How did we end up here?",
        keywords: ["past", "history", "remember", "before", "who are you", "why are we", "how did we", "how we", "ended up"],
        answer: function (map, bs) {
            return "\"" + (bs && bs.text ? bs.text : "It is a long story, and you were there for most of it.") + "\"";
        }
    }
];

// The guide's turn when asked something outside what they know.
const GUIDE_UNKNOWN_NOTE = "You and the player have already met and been talking: never greet them as if you have just found or reached them, never re-introduce yourself, and never say you finally caught up. Carry on mid-conversation. You are a local with only common knowledge: the places in town, how people make coin, that gods and shrines exist, that a portal leads to harder towns, that death is final, and what you have told them of who is after you. If the player asks about fighting technique, spells, weapons, stats or other fine rules, say plainly that you do not know the details and suggest asking the trainers at the guildhall. Never invent numbers, prices, odds or rules.";

function getGuideTopic(id) {
    for (let i = 0; i < GUIDE_KNOWLEDGE.length; i++) if (GUIDE_KNOWLEDGE[i].id === id) return GUIDE_KNOWLEDGE[i];
    return null;
}

// Suggested questions for the menu: [{ id, question }].
function getGuideSuggestedQuestions() {
    return GUIDE_KNOWLEDGE.map(function (t) { return { id: t.id, question: t.question }; });
}

// Best topic for a typed question, or null. A keyword counts when it equals a
// word in the text (or, for words of 4+ letters, when a word starts with it);
// multi-word keywords match as a phrase. Ties go to the earlier topic.
function matchGuideTopic(text) {
    const raw = String(text || "").toLowerCase().replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
    if (!raw) return null;
    const words = raw.split(" ");
    let best = null;
    let bestScore = 0;
    GUIDE_KNOWLEDGE.forEach(function (t) {
        let score = 0;
        t.keywords.forEach(function (k) {
            if (k.indexOf(" ") >= 0) {
                if ((" " + raw + " ").indexOf(" " + k + " ") >= 0) score += 2;
                return;
            }
            for (let i = 0; i < words.length; i++) {
                const w = words[i];
                if (w === k || (k.length >= 4 && w.indexOf(k) === 0)) { score += 1; break; }
            }
        });
        if (score > bestScore) { best = t; bestScore = score; }
    });
    // A lone generic word ("now", "here", "where") is not enough to answer.
    if (best && bestScore < 2) {
        const generic = { now: 1, here: 1, where: 1, should: 1, better: 1, place: 1, around: 1, first: 1, start: 1, begin: 1 };
        const hit = best.keywords.filter(function (k) { return words.indexOf(k) >= 0 || (k.length >= 4 && words.some(function (w) { return w.indexOf(k) === 0; })); });
        if (hit.length && hit.every(function (k) { return generic[k]; })) return null;
    }
    return best;
}

// Resolved answer text for a topic (the guide's line), or "".
function getGuideTopicAnswer(id, backstory) {
    const t = getGuideTopic(id);
    if (!t) return "";
    const bs = backstory || (typeof getPlayerBackstory === "function" ? getPlayerBackstory() : null);
    const map = getBackstoryFillMap(bs);
    const text = t.answer(map, bs);
    return _spFill(text, map).replace(/\s+/g, " ").trim();
}

// State-based "what should I do next?": the first unmet step wins.
// Order: blessing -> trained -> earned -> patron -> lead -> keep growing.
// Returns { key, text }.
function getGuideNextStep(backstory) {
    const bs = backstory || (typeof getPlayerBackstory === "function" ? getPlayerBackstory() : null);
    const map = getBackstoryFillMap(bs);
    const p = typeof G !== "undefined" && G ? G.player : null;
    const flag = function (f) { return typeof hasStoryFlag === "function" && hasStoryFlag(f); };
    let key = "grow";
    let text = "";
    if (p && !p.newcomerProtection) {
        key = "blessing";
        text = "\"First, " + map.player + ", get the newcomer's blessing. Go to the shrine in " + map.chapelPlace + " and ask for it, or ask me to walk you there. It costs nothing, and it is the only thing between you and the end until you have a god behind you.\"";
    } else if (typeof window !== "undefined" && typeof window.getPressureGuideNext === "function" && window.getPressureGuideNext()) {
        key = "pressure";
        text = "\"" + window.getPressureGuideNext() + "\"";
    } else if (!flag("trained-once")) {
        key = "train";
        text = "\"Next, get stronger. Go to " + map.guildPlace + " and find a trainer, or work the dummies in the yard. Even a little training beats walking into a fight raw.\"";
    } else if (p && !((p.jobs && p.jobs.done > 0) || (p.quests && p.quests.done > 0))) {
        key = "earn";
        text = "\"You will need coin. Read a notice board in the tavern, the inn or the Town Hall, or ask the innkeeper or bartender about work. Take something small and finish it.\"";
    } else if (flag("slept-rough") && !(typeof getActiveLodging === "function" && getActiveLodging())) {
        key = "lodging";
        text = "\"You have been sleeping rough. Rent a room from the innkeeper by the week. A real bed heals you faster, and your things stay safe behind a locked door.\"";
    } else if (p && !p.deity) {
        key = "patron";
        text = "\"Think about a patron. Ask priests about the gods, read what you find, then pledge to one at a shrine and keep it. Once your blessing is spent, a god you have served is your only way back.\"";
    } else {
        const stage = bs && bs.guide && typeof bs.guide.leadStage === "number" ? bs.guide.leadStage : 0;
        const lead = typeof getGuidePlanText === "function" ? getGuidePlanText(bs) : "";
        if (lead && stage < 2) {
            key = "lead";
            text = "\"Now your lead. " + lead + "\"";
        } else {
            key = "grow";
            text = "\"You are on your feet now. Keep training, keep taking bounties, and save for the portal, which costs " + _guideConst("portalFee") + " gold and doubles each time. The rest is up to you.\"";
        }
    }
    return { key: key, text: _spFill(text, map).replace(/\s+/g, " ").trim() };
}

if (typeof window !== "undefined") {
    window.PLAYER_ARCHETYPES = PLAYER_ARCHETYPES;
    window.FREEFORM_ARCHETYPE_FIELDS = FREEFORM_ARCHETYPE_FIELDS;
    window.cleanFreeformText = cleanFreeformText;
    window.clampFreeformAmount = clampFreeformAmount;
    window.resolveFreeformSlots = resolveFreeformSlots;
    window.CLASS_CRAFT_QUESTIONS = CLASS_CRAFT_QUESTIONS;
    window.APPROACH_QUESTION_POOL = APPROACH_QUESTION_POOL;
    window.APPROACH_QUESTION_COUNT = APPROACH_QUESTION_COUNT;
    window.GUIDE_ARRIVAL_TURN = GUIDE_ARRIVAL_TURN;
    window.getArchetypeIdsForClass = getArchetypeIdsForClass;
    window.buildPlayerBackstory = buildPlayerBackstory;
    window.getBackstoryFillMap = getBackstoryFillMap;
    window.getGuideOpeningLine = getGuideOpeningLine;
    window.getBackstoryLoreFacts = getBackstoryLoreFacts;
    window.resolveGuideLeadPlace = resolveGuideLeadPlace;
    window.getGuidePlanText = getGuidePlanText;
    window.getGuideMissionLine = getGuideMissionLine;
    window.getGuideTalkBeat = getGuideTalkBeat;
    window.matchGuideCheckinReply = matchGuideCheckinReply;
    window.getGuideInflection = getGuideInflection;
    window.getGuideShiftLead = getGuideShiftLead;
    window.GUIDE_SHIFT_ORDER = GUIDE_SHIFT_ORDER;
    window.getGuideSpec = getGuideSpec;
    window.GUIDE_SPECIES_LINES = GUIDE_SPECIES_LINES;
    window.GUIDE_SPECIES_TEXT = GUIDE_SPECIES_TEXT;
    window.buildOpeningSceneTemplate = buildOpeningSceneTemplate;
    window.GUIDE_KNOWLEDGE = GUIDE_KNOWLEDGE;
    window.GUIDE_UNKNOWN_NOTE = GUIDE_UNKNOWN_NOTE;
    window.getGuideTopic = getGuideTopic;
    window.getGuideSuggestedQuestions = getGuideSuggestedQuestions;
    window.matchGuideTopic = matchGuideTopic;
    window.getGuideTopicAnswer = getGuideTopicAnswer;
    window.getGuideNextStep = getGuideNextStep;
    window.START_MODES = START_MODES;
    window.START_MODE_ORDER = START_MODE_ORDER;
    window.DEFAULT_START_MODE = DEFAULT_START_MODE;
    window.getStartTierForMode = getStartTierForMode;
    window.getStartModeCards = getStartModeCards;
    window.getPressureSpec = getPressureSpec;
    window.getPressureLoreFacts = getPressureLoreFacts;
    window.getPressurePrologueLine = getPressurePrologueLine;
    window.PRESSURE_TIMING = PRESSURE_TIMING;
    window.SOCIETY_BY_SPECIES = SOCIETY_BY_SPECIES;
    window.SOCIETY_SHEETS = SOCIETY_SHEETS;
    window.DRAGONBORN_HOUSES = DRAGONBORN_HOUSES;
    window.REALM_MASTER_ROLES = REALM_MASTER_ROLES;
    window.REALM_TRADE_ROLES = REALM_TRADE_ROLES;
    window.REALM_WAGE_ROLES = REALM_WAGE_ROLES;
    window.KINGDOM_NAME = KINGDOM_NAME;
    window.NOBLE_HOUSES = NOBLE_HOUSES;
    window.getBuildingLandholder = getBuildingLandholder;
    window.getKingdomSummary = getKingdomSummary;
    window.getLeadStage = getLeadStage;
    window.getCurrentLeadStage = getCurrentLeadStage;
    window.getGuideRoomRemark = getGuideRoomRemark;
    window.GUIDE_LEAD_ARRIVE_LINES = GUIDE_LEAD_ARRIVE_LINES;
    window.getGuidePartyOffer = getGuidePartyOffer;
    window.getGuidePartyResponse = getGuidePartyResponse;
    window.getGuideTownSummary = getGuideTownSummary;
    window.findTownBuilding = findTownBuilding;
}
