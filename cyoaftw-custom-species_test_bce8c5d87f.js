// ── CUSTOM SPECIES ──────────────────────────────────────────────
// Player-authored species templates: validation, a browser-storage library,
// import/export, and registration into the live species data. Loaded after
// cyoaftw-world-data.js and cyoaftw-npc-data.js, before the engine.
//
// A custom species is an ordinary SPECIES_TEMPLATES entry (flagged
// `custom: true`), so everything that goes through getSpeciesTemplate() and the
// shapeshift species pool sees it with no special casing. The optional
// `engine` block feeds the species-keyed tables in cyoaftw-npc-data.js (food,
// name pools) and the zone allowedSpecies lists that decide where it spawns.
//
// Scope (v1): species templates only. No PLAYER_SPECIES entry, no custom
// attacks, no incorporeal. Anything outside the whitelist is dropped with a
// warning, never executed. See CREATURE_TEMPLATES.md.

const CUSTOM_SPECIES_FORMAT = "cyoaftw-creature-template";
const CUSTOM_SPECIES_VERSION = 1;
const CUSTOM_SPECIES_STORAGE_KEY = "cyoaCustomSpeciesLibrary";

const CUSTOM_SPECIES_SIZES = ["tiny", "small", "medium", "large"];
const CUSTOM_SPECIES_SPEECH_STYLES = ["common", "formal", "gruff", "folksy", "clipped", "direct", "broken", "whisper", "wry", "boisterous", "mimic"];
// Surface types the NPC colour/anatomy code already knows how to describe.
const CUSTOM_SPECIES_SURFACES = ["skin", "fur", "scales", "feathers", "bone", "gel", "translucent form"];
const CUSTOM_SPECIES_ANATOMY_TYPES = ["mixed", "reptilian", "amorphous"];
const CUSTOM_SPECIES_LIMITS = {
    nameMin: 2, nameMax: 24, lore: 600, line: 300, short: 80, item: 60, food: 120,
    listMax: 12, absentMax: 8, namesMax: 20, zonesMax: 12, entriesMax: 50
};

// Fields the importer recognises but deliberately refuses, each with its reason.
// An installed extension (see _csExtension) may claim any of these keys for
// itself; claimed keys are then validated by the extension instead of refused.
const CUSTOM_SPECIES_REFUSED = {
    incorporeal: "changes combat damage rules; not available to custom species",
    naturalAttacks: "custom attacks are not supported yet",
    fertilityCycle: "not part of player templates"
};

// NSFW extension hook. The NSFW half (nsfw/cyoaftw-custom-species-nsfw.js,
// loaded after this file) installs window.CUSTOM_SPECIES_EXTENSION to own
// additional template fields (cloaca, fertilityCycle, nsfwProfile). This file
// only provides the guarded call points; it never names or contains NSFW
// content itself. Without an extension every hook below is a no-op.
function _csExtension() {
    if (typeof window !== "undefined" && window && window.CUSTOM_SPECIES_EXTENSION) return window.CUSTOM_SPECIES_EXTENSION;
    if (typeof CUSTOM_SPECIES_EXTENSION !== "undefined" && CUSTOM_SPECIES_EXTENSION) return CUSTOM_SPECIES_EXTENSION;
    return null;
}

function _csExtensionFields() {
    const ext = _csExtension();
    return ext && Array.isArray(ext.templateFields) ? ext.templateFields : [];
}

function _csText(value, max) {
    let s = typeof value === "string" ? value : (typeof value === "number" ? String(value) : "");
    // Structural cleanup only: no markup characters or control characters in names/text.
    s = s.replace(/[<>\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
    return s.length > max ? s.slice(0, max).trim() : s;
}

function _csList(value, maxItems, maxLen, errors, label) {
    const out = [];
    if (value === undefined || value === null) return out;
    if (!Array.isArray(value)) { errors.push(label + " must be a list."); return out; }
    for (const entry of value) {
        const s = _csText(entry, maxLen);
        if (s && !out.some(o => o.toLowerCase() === s.toLowerCase())) out.push(s);
    }
    if (out.length > maxItems) {
        errors.push(label + " has " + out.length + " entries; the limit is " + maxItems + ".");
        return out.slice(0, maxItems);
    }
    return out;
}

function _csBool(value, label, errors, fallback) {
    if (value === undefined || value === null) return fallback;
    if (typeof value !== "boolean") { errors.push(label + " must be true or false."); return fallback; }
    return value;
}

function _csEnum(value, allowed, label, errors, fallback) {
    if (value === undefined || value === null || value === "") return fallback;
    const v = String(value).toLowerCase();
    if (allowed.indexOf(v) < 0) { errors.push(label + " must be one of: " + allowed.join(", ") + "."); return fallback; }
    return v;
}

function isCustomSpeciesTemplate(template) {
    return !!(template && template.custom === true);
}

// Built-in species names (lowercase), so a custom species can never shadow one.
function getBuiltInSpeciesNames() {
    if (typeof SPECIES_TEMPLATES === "undefined" || !Array.isArray(SPECIES_TEMPLATES)) return [];
    return SPECIES_TEMPLATES.filter(t => t && !t.custom && t.species).map(t => String(t.species).toLowerCase());
}

function _csUnknownKeys(obj, known, label, warnings, refused) {
    if (!obj || typeof obj !== "object") return;
    const reasons = refused || CUSTOM_SPECIES_REFUSED;
    for (const key of Object.keys(obj)) {
        if (known.indexOf(key) >= 0) continue;
        warnings.push(label + (reasons[key] ? "." + key + " was dropped: " + reasons[key] + "." : "." + key + " is not a recognised field and was dropped."));
    }
}

// Validates and normalises one library entry: { template, engine? }.
// Returns { ok, errors, warnings, entry }. `entry` is the cleaned copy and is
// only meaningful when ok is true. Never mutates the input.
function validateCustomSpeciesEntry(raw, options) {
    const errors = [];
    const warnings = [];
    const L = CUSTOM_SPECIES_LIMITS;
    const src = raw && typeof raw === "object" ? raw : null;
    const tpl = src && src.template && typeof src.template === "object" ? src.template : null;
    if (!tpl) return { ok: false, errors: ["Entry has no template."], warnings, entry: null };
    _csUnknownKeys(src, ["template", "engine", "_notes"], "entry", warnings);

    // Names are checked as typed (whitespace tidied only): illegal characters are an
    // error, not something to quietly rewrite.
    const name = typeof tpl.species === "string" ? tpl.species.replace(/\s+/g, " ").trim() : "";
    if (name.length < L.nameMin || name.length > L.nameMax || !/^[A-Za-z][A-Za-z '-]*$/.test(name)) {
        errors.push("species must be " + L.nameMin + "-" + L.nameMax + " characters: letters, spaces, hyphens or apostrophes.");
    } else if (getBuiltInSpeciesNames().indexOf(name.toLowerCase()) >= 0) {
        errors.push("\"" + name + "\" is a built-in species name.");
    }

    // `custom` is the flag this validator adds to its own output; it is accepted
    // on re-validation (stored entries, edits) and always rewritten, never trusted.
    // Extension-owned fields join the whitelist and leave the refused list.
    const extFields = _csExtensionFields();
    const templateRefused = {};
    for (const key of Object.keys(CUSTOM_SPECIES_REFUSED)) {
        if (extFields.indexOf(key) < 0) templateRefused[key] = CUSTOM_SPECIES_REFUSED[key];
    }
    _csUnknownKeys(tpl, ["species", "custom", "isHumanoid", "isCivilized", "size", "speechStyle", "anatomyType", "hasTail", "lore", "articulation", "portraitProfile", "anatomyProfile", "culture"].concat(extFields), "template", warnings, templateRefused);

    const out = { species: name, custom: true };
    out.isHumanoid = _csBool(tpl.isHumanoid, "isHumanoid", errors, false);
    out.isCivilized = _csBool(tpl.isCivilized, "isCivilized", errors, false);
    out.size = _csEnum(tpl.size, CUSTOM_SPECIES_SIZES, "size", errors, "medium");
    out.speechStyle = _csEnum(tpl.speechStyle, CUSTOM_SPECIES_SPEECH_STYLES, "speechStyle", errors, "common");
    if (tpl.anatomyType !== undefined && tpl.anatomyType !== null) {
        const t = _csEnum(tpl.anatomyType, CUSTOM_SPECIES_ANATOMY_TYPES, "anatomyType", errors, "");
        if (t) out.anatomyType = t;
    }
    if (tpl.hasTail !== undefined && tpl.hasTail !== null) out.hasTail = _csBool(tpl.hasTail, "hasTail", errors, false);
    out.lore = _csText(tpl.lore, L.lore);
    if (!out.lore) errors.push("lore is required.");
    const articulation = _csText(tpl.articulation, L.line);
    if (articulation) out.articulation = articulation;

    // Portrait prompt profile.
    const pp = tpl.portraitProfile && typeof tpl.portraitProfile === "object" ? tpl.portraitProfile : null;
    if (!pp) errors.push("portraitProfile is required.");
    else {
        _csUnknownKeys(pp, ["face", "negatives", "sizeWord"], "portraitProfile", warnings);
        out.portraitProfile = { face: _csText(pp.face, L.line), negatives: _csText(pp.negatives, L.line) };
        if (!out.portraitProfile.face) errors.push("portraitProfile.face is required.");
        const sizeWord = _csText(pp.sizeWord, 20);
        if (sizeWord) out.portraitProfile.sizeWord = sizeWord;
    }

    // Anatomy.
    const ap = tpl.anatomyProfile && typeof tpl.anatomyProfile === "object" ? tpl.anatomyProfile : null;
    if (!ap) errors.push("anatomyProfile is required.");
    else {
        _csUnknownKeys(ap, ["morphology", "look", "typicalBuild", "bodyFatEligible", "surfaceType", "skinTones", "hairColors", "hairStyles", "eyeColors", "builds", "features", "movements", "voices"], "anatomyProfile", warnings);
        const morphKeys = ["ears", "face", "bodyPlan", "feet", "tail"];
        const m = ap.morphology && typeof ap.morphology === "object" ? ap.morphology : {};
        const morphology = {};
        for (const k of morphKeys) {
            const v = _csText(m[k], L.line);
            if (v) morphology[k] = v;
        }
        if (!morphology.ears) errors.push("anatomyProfile.morphology.ears is required (use \"no ears\" if none).");
        if (!morphology.bodyPlan) errors.push("anatomyProfile.morphology.bodyPlan is required.");
        const absent = _csList(m.absent, L.absentMax, L.item, errors, "anatomyProfile.morphology.absent");
        if (absent.length) morphology.absent = absent;
        const lk = ap.look && typeof ap.look === "object" ? ap.look : {};
        const look = {};
        for (const k of morphKeys) {
            if (morphology[k] !== undefined || lk[k] !== undefined) look[k] = _csText(lk[k], L.line);
        }
        const surfaceType = _csEnum(ap.surfaceType, CUSTOM_SPECIES_SURFACES, "anatomyProfile.surfaceType", errors, "");
        if (!surfaceType && (ap.surfaceType === undefined || ap.surfaceType === null || ap.surfaceType === "")) {
            errors.push("anatomyProfile.surfaceType is required.");
        }
        const profile = {
            morphology, look,
            typicalBuild: _csText(ap.typicalBuild, L.line),
            bodyFatEligible: _csBool(ap.bodyFatEligible, "anatomyProfile.bodyFatEligible", errors, false),
            surfaceType: surfaceType || "skin"
        };
        if (!profile.typicalBuild) errors.push("anatomyProfile.typicalBuild is required.");
        const lists = { skinTones: true, hairColors: false, hairStyles: false, eyeColors: false, builds: true, features: true, movements: true, voices: true };
        for (const key of Object.keys(lists)) {
            const maxLen = key === "features" || key === "movements" ? L.item : L.short;
            const list = _csList(ap[key], L.listMax, maxLen, errors, "anatomyProfile." + key);
            if (lists[key] && !list.length) errors.push("anatomyProfile." + key + " needs at least one entry.");
            if (list.length || key === "eyeColors") profile[key] = list;
        }
        out.anatomyProfile = profile;
    }

    // Culture.
    const cu = tpl.culture && typeof tpl.culture === "object" ? tpl.culture : {};
    _csUnknownKeys(cu, ["values", "topics", "taboos"], "culture", warnings);
    out.culture = {
        values: _csList(cu.values, L.listMax, L.item, errors, "culture.values"),
        topics: _csList(cu.topics, L.listMax, L.item, errors, "culture.topics"),
        taboos: _csList(cu.taboos, L.listMax, L.item, errors, "culture.taboos")
    };

    // Extension-owned fields (the NSFW half validates its own schema into `out`).
    // Guarded: with no extension installed this is a no-op and the keys above
    // were already dropped as unknown/refused.
    const ext = _csExtension();
    if (ext && typeof ext.validate === "function") {
        try { ext.validate(src, out, errors, warnings); }
        catch (e) { errors.push("Extension validation failed: " + (e && e.message ? e.message : String(e))); }
    }

    // Engine hooks: zones, food and name pools. Zones must exist.
    const eng = src.engine && typeof src.engine === "object" ? src.engine : {};
    _csUnknownKeys(eng, ["zones", "food", "names"], "engine", warnings);
    const engine = { zones: [], food: "" };
    const zones = _csList(eng.zones, L.zonesMax, L.short, errors, "engine.zones");
    for (const z of zones) {
        const zone = typeof getZoneTemplate === "function" ? getZoneTemplate(z) : null;
        if (zone) engine.zones.push(zone.name);
        else warnings.push("engine.zones: no zone named \"" + z + "\"; skipped.");
    }
    engine.food = _csText(eng.food, L.food);
    if (eng.names && typeof eng.names === "object") {
        _csUnknownKeys(eng.names, ["male", "female", "surnames"], "engine.names", warnings);
        const names = {};
        for (const k of ["male", "female", "surnames"]) {
            const list = _csList(eng.names[k], L.namesMax, L.nameMax, errors, "engine.names." + k);
            if (list.length) names[k] = list;
        }
        if (Object.keys(names).length) engine.names = names;
    }

    const entry = { template: out, engine };
    return { ok: errors.length === 0, errors, warnings, entry: errors.length ? null : entry };
}

// ── REGISTRATION ────────────────────────────────────────────────

function _csFindTemplateIndex(name) {
    const key = String(name || "").toLowerCase();
    return SPECIES_TEMPLATES.findIndex(t => t && String(t.species || "").toLowerCase() === key);
}

function _csEachZoneList(fn) {
    if (typeof ZONE_TEMPLATES === "undefined" || !Array.isArray(ZONE_TEMPLATES)) return;
    for (const zone of ZONE_TEMPLATES) {
        if (zone && Array.isArray(zone.allowedSpecies)) fn(zone);
    }
}

// Keys this file added to the species-keyed npc-data tables, so removal never
// touches a built-in entry.
const _csTableKeys = { food: {}, names: {} };

function _csRemoveFromTables(name) {
    const key = String(name || "").toLowerCase();
    _csEachZoneList(zone => {
        zone.allowedSpecies = zone.allowedSpecies.filter(s => String(s).toLowerCase() !== key);
    });
    for (const k of Object.keys(_csTableKeys.food)) {
        if (k.toLowerCase() === key) {
            if (typeof NPC_SPECIES_FOOD !== "undefined") delete NPC_SPECIES_FOOD[k];
            delete _csTableKeys.food[k];
        }
    }
    for (const k of Object.keys(_csTableKeys.names)) {
        if (k.toLowerCase() === key) {
            if (typeof NPC_GIVEN_NAME_POOLS !== "undefined") delete NPC_GIVEN_NAME_POOLS[k];
            delete _csTableKeys.names[k];
        }
    }
}

// Adds a validated entry to the live species data, replacing any custom species
// of the same name. Returns { ok, errors, warnings, name }.
function registerCustomSpecies(raw) {
    const result = validateCustomSpeciesEntry(raw);
    if (!result.ok) return { ok: false, errors: result.errors, warnings: result.warnings, name: null };
    const { template, engine } = result.entry;
    const existing = _csFindTemplateIndex(template.species);
    if (existing >= 0 && !SPECIES_TEMPLATES[existing].custom) {
        return { ok: false, errors: ["\"" + template.species + "\" is a built-in species name."], warnings: result.warnings, name: null };
    }
    if (existing >= 0) {
        _csRemoveFromTables(template.species);
        SPECIES_TEMPLATES.splice(existing, 1);
    }
    SPECIES_TEMPLATES.push(template);

    if (engine.food && typeof NPC_SPECIES_FOOD !== "undefined") {
        NPC_SPECIES_FOOD[template.species] = engine.food;
        _csTableKeys.food[template.species] = true;
    }
    if (engine.names && typeof NPC_GIVEN_NAME_POOLS !== "undefined") {
        const pool = {};
        for (const k of Object.keys(engine.names)) pool[k] = engine.names[k].slice();
        NPC_GIVEN_NAME_POOLS[template.species] = pool;
        _csTableKeys.names[template.species] = true;
    }
    _csEachZoneList(zone => {
        if (engine.zones.indexOf(zone.name) >= 0 &&
            !zone.allowedSpecies.some(s => String(s).toLowerCase() === template.species.toLowerCase())) {
            zone.allowedSpecies.push(template.species);
        }
    });
    // Side-table registration (the NSFW half mirrors the entry into its own
    // species tables). Guarded: no extension, no-op. A failure here must never
    // break SFW registration, so it only adds a warning.
    const ext = _csExtension();
    if (ext && typeof ext.register === "function") {
        try { ext.register(template, engine); }
        catch (e) { result.warnings.push("Extension registration failed: " + (e && e.message ? e.message : String(e))); }
    }
    return { ok: true, errors: [], warnings: result.warnings, name: template.species };
}

function unregisterCustomSpecies(name) {
    const idx = _csFindTemplateIndex(name);
    if (idx < 0 || !SPECIES_TEMPLATES[idx].custom) return false;
    const removed = SPECIES_TEMPLATES[idx].species;
    _csRemoveFromTables(removed);
    SPECIES_TEMPLATES.splice(idx, 1);
    const ext = _csExtension();
    if (ext && typeof ext.unregister === "function") {
        try { ext.unregister(removed); } catch (e) { /* removal must stay best-effort */ }
    }
    return true;
}

// ── LIBRARY (browser storage) ───────────────────────────────────

// The library holds the raw authored entries, not the registered copies, so
// edits and exports always round-trip what the player wrote (after cleaning).
const customSpeciesLibrary = { entries: [] };

function loadCustomSpeciesLibrary() {
    let parsed = null;
    try { parsed = JSON.parse(localStorage.getItem(CUSTOM_SPECIES_STORAGE_KEY) || "null"); } catch (_) { parsed = null; }
    customSpeciesLibrary.entries = [];
    if (!parsed || parsed.format !== CUSTOM_SPECIES_FORMAT || !Array.isArray(parsed.entries)) return customSpeciesLibrary.entries;
    for (const raw of parsed.entries.slice(0, CUSTOM_SPECIES_LIMITS.entriesMax)) {
        const result = validateCustomSpeciesEntry(raw);
        if (result.ok) customSpeciesLibrary.entries.push(result.entry);
    }
    return customSpeciesLibrary.entries;
}

function saveCustomSpeciesLibrary() {
    try {
        localStorage.setItem(CUSTOM_SPECIES_STORAGE_KEY, JSON.stringify({
            format: CUSTOM_SPECIES_FORMAT, version: CUSTOM_SPECIES_VERSION, entries: customSpeciesLibrary.entries
        }));
        return true;
    } catch (_) { return false; }
}

// Registers every stored entry with the live species data. Call once at load.
function registerCustomSpeciesLibrary() {
    loadCustomSpeciesLibrary();
    const registered = [];
    for (const entry of customSpeciesLibrary.entries) {
        const r = registerCustomSpecies(entry);
        if (r.ok) registered.push(r.name);
    }
    return registered;
}

// Adds or replaces an entry in the library, registers it, and saves.
// Returns the registerCustomSpecies result plus `saved`.
function saveCustomSpecies(raw) {
    const result = validateCustomSpeciesEntry(raw);
    if (!result.ok) return { ok: false, errors: result.errors, warnings: result.warnings, name: null, saved: false };
    const name = result.entry.template.species;
    const key = name.toLowerCase();
    if (!customSpeciesLibrary.entries.some(e => e.template.species.toLowerCase() === key) &&
        customSpeciesLibrary.entries.length >= CUSTOM_SPECIES_LIMITS.entriesMax) {
        return { ok: false, errors: ["The library is full (" + CUSTOM_SPECIES_LIMITS.entriesMax + " species)."], warnings: result.warnings, name: null, saved: false };
    }
    const registered = registerCustomSpecies(result.entry);
    if (!registered.ok) return Object.assign({ saved: false }, registered);
    const idx = customSpeciesLibrary.entries.findIndex(e => e.template.species.toLowerCase() === key);
    if (idx >= 0) customSpeciesLibrary.entries[idx] = result.entry;
    else customSpeciesLibrary.entries.push(result.entry);
    return Object.assign({ saved: saveCustomSpeciesLibrary() }, registered);
}

function deleteCustomSpecies(name) {
    const key = String(name || "").toLowerCase();
    const before = customSpeciesLibrary.entries.length;
    customSpeciesLibrary.entries = customSpeciesLibrary.entries.filter(e => e.template.species.toLowerCase() !== key);
    const removed = unregisterCustomSpecies(name);
    if (removed || customSpeciesLibrary.entries.length !== before) saveCustomSpeciesLibrary();
    return removed;
}

function listCustomSpecies() {
    return customSpeciesLibrary.entries.map(e => e.template.species);
}

// ── IMPORT / EXPORT ─────────────────────────────────────────────

// Returns a JSON string for the named species (all when names is omitted).
function exportCustomSpecies(names) {
    const wanted = Array.isArray(names) ? names.map(n => String(n).toLowerCase()) : null;
    const entries = customSpeciesLibrary.entries.filter(e => !wanted || wanted.indexOf(e.template.species.toLowerCase()) >= 0);
    return JSON.stringify({ format: CUSTOM_SPECIES_FORMAT, version: CUSTOM_SPECIES_VERSION, entries }, null, 2);
}

// Parses an export (or a single-template file such as creature-template-draft.json).
// options.onConflict: "skip" (default) keeps an existing custom species of the same name,
// "replace" overwrites it. Returns { ok, error?, added, replaced, skipped } where
// skipped entries carry the name and the reasons.
function importCustomSpecies(text, options) {
    const onConflict = options && options.onConflict === "replace" ? "replace" : "skip";
    let parsed = null;
    try { parsed = JSON.parse(String(text)); } catch (_) { return { ok: false, error: "That is not valid JSON.", added: [], replaced: [], skipped: [] }; }
    if (!parsed || typeof parsed !== "object" || parsed.format !== CUSTOM_SPECIES_FORMAT) {
        return { ok: false, error: "That file is not a creature template export.", added: [], replaced: [], skipped: [] };
    }
    if (typeof parsed.version === "number" && parsed.version > CUSTOM_SPECIES_VERSION) {
        return { ok: false, error: "That file is from a newer version of the game.", added: [], replaced: [], skipped: [] };
    }
    const entries = Array.isArray(parsed.entries) ? parsed.entries
        : (parsed.template ? [{ template: parsed.template, engine: parsed.engine }] : []);
    if (!entries.length) return { ok: false, error: "That file has no creature templates.", added: [], replaced: [], skipped: [] };
    const report = { ok: true, added: [], replaced: [], skipped: [] };
    for (const raw of entries.slice(0, CUSTOM_SPECIES_LIMITS.entriesMax)) {
        const check = validateCustomSpeciesEntry(raw);
        if (!check.ok) {
            const label = raw && raw.template && typeof raw.template.species === "string" ? raw.template.species : "(unnamed)";
            report.skipped.push({ name: label, reasons: check.errors });
            continue;
        }
        const name = check.entry.template.species;
        const exists = customSpeciesLibrary.entries.some(e => e.template.species.toLowerCase() === name.toLowerCase());
        if (exists && onConflict === "skip") { report.skipped.push({ name, reasons: ["Already in your library."] }); continue; }
        const saved = saveCustomSpecies(check.entry);
        if (!saved.ok) { report.skipped.push({ name, reasons: saved.errors }); continue; }
        (exists ? report.replaced : report.added).push(name);
    }
    return report;
}

// Browser load: register whatever the player has saved. Guarded so the file can
// also be evaluated in a test context without storage.
if (typeof localStorage !== "undefined") {
    try { registerCustomSpeciesLibrary(); } catch (e) { if (typeof console !== "undefined") console.warn("Custom species failed to load", e); }
}

// Explicit window exposure: classic scripts get these for free in a browser,
// but stating them keeps the NSFW extension file (loaded after this one) and
// test harnesses working even where `window` is not the global object.
if (typeof window !== "undefined") {
    window.validateCustomSpeciesEntry = validateCustomSpeciesEntry;
    window.registerCustomSpecies = registerCustomSpecies;
    window.unregisterCustomSpecies = unregisterCustomSpecies;
    window.registerCustomSpeciesLibrary = registerCustomSpeciesLibrary;
    window.saveCustomSpecies = saveCustomSpecies;
    window.deleteCustomSpecies = deleteCustomSpecies;
    window.listCustomSpecies = listCustomSpecies;
    window.importCustomSpecies = importCustomSpecies;
    window.exportCustomSpecies = exportCustomSpecies;
}
