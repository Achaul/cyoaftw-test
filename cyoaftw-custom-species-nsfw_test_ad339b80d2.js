// ── CUSTOM SPECIES — NSFW EXTENSION ──────────────────────────────────────────
// Loaded after nsfw/cyoaftw-nsfw-system.js and after cyoaftw-custom-species.js.
// Installs window.CUSTOM_SPECIES_EXTENSION so player-authored creature templates
// can carry the same sexual/reproductive anatomy fields the built-in templates
// have. The SFW side (cyoaftw-custom-species.js, cyoaftw-world-building.js) only
// provides guarded hooks; every field definition and all NSFW wording lives here.
//
// Extension contract (all optional except templateFields/validate):
//   templateFields  - template keys this extension owns (claimed before the SFW
//                     whitelist/refusal pass, validated by `validate`)
//   validate(src, out, errors, warnings) - clean extension fields from the raw
//                     entry into the validated template `out`
//   register(template, engine)  - mirror a registered custom species into the
//                     NSFW side tables (here: window.creatureTemplates)
//   unregister(name)            - remove the mirrored entry
//   sections                    - WB_SECTIONS-style form sections for the dialog
//   entryToValues(entry)        - flatten extension fields into form values
//   valuesToEntry(entry, vals)  - write form values back into the entry
//
// Template fields owned here:
//   cloaca         - boolean; reptilian-style single vent. Read through
//                    getSpeciesTemplate by hydrateNPCSpeciesFlags and the
//                    intimacy cloaca gates.
//   fertilityCycle - { hasCycle, cycleLength, duration, arousalBoost, minAge };
//                    read through getSpeciesTemplate for autonomous arousal.
//   nsfwProfile    - feeds a CREATURE_TEMPLATES-shaped entry in
//                    window.creatureTemplates (appearanceProfile, colour pools,
//                    visualProfile, sensualProfile), consumed by
//                    getCreatureTemplate/generatePhysicalTraits.

(function () {
    if (typeof window === "undefined") return;

    var NSX_APPEARANCE_TYPES = ["humanoid", "mammalian", "avian", "reptilian", "draconic", "mixed", "vermin", "amorphous", "ethereal", "undead"];
    var NSX_SURFACE_TYPES = ["skin", "fur", "scales", "feathers", "bone", "gel", "translucent form"];
    var NSX_LIMITS = { desc: 300, short: 80, tiny: 40, listMax: 12, item: 60 };

    // ── small local cleaners (kept self-contained; the SFW _cs* helpers are
    // not guaranteed to be visible from this file in every load context) ──

    function nsxText(value, max) {
        var s = typeof value === "string" ? value : (typeof value === "number" ? String(value) : "");
        s = s.replace(/[<>\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
        return s.length > max ? s.slice(0, max).trim() : s;
    }

    function nsxLines(value, errors, label) {
        var out = [];
        if (value === undefined || value === null) return out;
        if (!Array.isArray(value)) { errors.push(label + " must be a list (one entry per line)."); return out; }
        for (var i = 0; i < value.length; i++) {
            var s = nsxText(value[i], NSX_LIMITS.item);
            if (s && !out.some(function (o) { return o.toLowerCase() === s.toLowerCase(); })) out.push(s);
        }
        if (out.length > NSX_LIMITS.listMax) {
            errors.push(label + " has " + out.length + " entries; the limit is " + NSX_LIMITS.listMax + ".");
            return out.slice(0, NSX_LIMITS.listMax);
        }
        return out;
    }

    function nsxBool(value, label, errors, fallback) {
        if (value === undefined || value === null) return fallback;
        if (typeof value !== "boolean") { errors.push(label + " must be true or false."); return fallback; }
        return value;
    }

    function nsxEnum(value, allowed, label, errors) {
        if (value === undefined || value === null || value === "") return "";
        var v = String(value).toLowerCase();
        if (allowed.indexOf(v) < 0) { errors.push(label + " must be one of: " + allowed.join(", ") + "."); return ""; }
        return v;
    }

    function nsxInt(value, min, max, label, errors, fallback) {
        if (value === undefined || value === null || value === "") return fallback;
        var n = typeof value === "number" ? value : Number(String(value).trim());
        if (!Number.isFinite(n) || Math.floor(n) !== n) { errors.push(label + " must be a whole number."); return fallback; }
        if (n < min || n > max) { errors.push(label + " must be between " + min + " and " + max + "."); return fallback; }
        return n;
    }

    function nsxUnknown(obj, known, label, warnings) {
        if (!obj || typeof obj !== "object") return;
        for (var key of Object.keys(obj)) {
            if (known.indexOf(key) >= 0) continue;
            warnings.push(label + "." + key + " is not a recognised field and was dropped.");
        }
    }

    // A { description } block; breasts may also carry size/nipples/areolas.
    function nsxPart(value, label, errors, warnings, allowExtras) {
        if (value === undefined || value === null) return null;
        if (!value || typeof value !== "object") { errors.push(label + " must be a block with a description."); return null; }
        nsxUnknown(value, allowExtras ? ["description", "size", "nipples", "areolas"] : ["description"], label, warnings);
        var part = {};
        var desc = nsxText(value.description, NSX_LIMITS.desc);
        if (desc) part.description = desc;
        if (allowExtras) {
            var size = nsxText(value.size, NSX_LIMITS.tiny);
            if (size) part.size = size;
            for (var sub of ["nipples", "areolas"]) {
                var sv = value[sub];
                if (sv === undefined || sv === null) continue;
                if (!sv || typeof sv !== "object") { errors.push(label + "." + sub + " must be a block."); continue; }
                nsxUnknown(sv, ["size", "color", "texture"], label + "." + sub, warnings);
                var cleaned = {};
                for (var k of ["size", "color", "texture"]) {
                    var tv = nsxText(sv[k], NSX_LIMITS.tiny);
                    if (tv) cleaned[k] = tv;
                }
                if (Object.keys(cleaned).length) part[sub] = cleaned;
            }
        }
        return Object.keys(part).length ? part : null;
    }

    // ── validation ────────────────────────────────────────────────────────

    function validateProfile(p, errors, warnings) {
        var profile = {};
        nsxUnknown(p, ["appearanceProfile", "allowedSkinTones", "allowedHairColors", "allowedEyeColors", "visualProfile", "sensualProfile"], "nsfwProfile", warnings);

        var appearance = nsxEnum(p.appearanceProfile, NSX_APPEARANCE_TYPES, "Intimate anatomy: body type", errors);
        if (appearance) profile.appearanceProfile = appearance;

        var tones = nsxLines(p.allowedSkinTones, errors, "Intimate anatomy: surface colours");
        if (tones.length) profile.allowedSkinTones = tones;
        var hair = nsxLines(p.allowedHairColors, errors, "Intimate anatomy: hair colours");
        if (hair.length) profile.allowedHairColors = hair;
        var eyes = nsxLines(p.allowedEyeColors, errors, "Intimate anatomy: eye colours");
        if (eyes.length) profile.allowedEyeColors = eyes;

        var vp = p.visualProfile;
        if (vp !== undefined && vp !== null) {
            if (!vp || typeof vp !== "object") errors.push("Intimate anatomy: visual profile must be a block.");
            else {
                nsxUnknown(vp, ["surface", "tail"], "nsfwProfile.visualProfile", warnings);
                var visual = {};
                var surf = vp.surface;
                if (surf !== undefined && surf !== null) {
                    if (!surf || typeof surf !== "object") errors.push("Intimate anatomy: surface must be a block.");
                    else {
                        nsxUnknown(surf, ["type", "texture", "sheen", "coverage"], "nsfwProfile.visualProfile.surface", warnings);
                        var surface = {};
                        var stype = nsxEnum(surf.type, NSX_SURFACE_TYPES, "Intimate anatomy: surface type", errors);
                        if (stype) surface.type = stype;
                        var tex = nsxLines(surf.texture, errors, "Intimate anatomy: surface textures");
                        if (tex.length) surface.texture = tex;
                        var sheen = nsxText(surf.sheen, NSX_LIMITS.short);
                        if (sheen) surface.sheen = sheen;
                        var coverage = nsxText(surf.coverage, NSX_LIMITS.short);
                        if (coverage) surface.coverage = coverage;
                        if (Object.keys(surface).length) visual.surface = surface;
                    }
                }
                var tail = vp.tail;
                if (tail !== undefined && tail !== null) {
                    if (!tail || typeof tail !== "object") errors.push("Intimate anatomy: tail must be a block.");
                    else {
                        nsxUnknown(tail, ["has", "type", "description", "displayInRearView"], "nsfwProfile.visualProfile.tail", warnings);
                        var t = {};
                        if (tail.has !== undefined && tail.has !== null) t.has = nsxBool(tail.has, "Intimate anatomy: tail present", errors, false);
                        var ttype = nsxText(tail.type, NSX_LIMITS.short);
                        if (ttype) t.type = ttype;
                        var tdesc = nsxText(tail.description, NSX_LIMITS.desc);
                        if (tdesc) t.description = tdesc;
                        if (tail.displayInRearView !== undefined && tail.displayInRearView !== null) t.displayInRearView = nsxBool(tail.displayInRearView, "Intimate anatomy: show tail in rear view", errors, false);
                        if (Object.keys(t).length) visual.tail = t;
                    }
                }
                if (Object.keys(visual).length) profile.visualProfile = visual;
            }
        }

        var sp = p.sensualProfile;
        if (sp !== undefined && sp !== null) {
            if (!sp || typeof sp !== "object") errors.push("Intimate anatomy: sensual profile must be a block.");
            else {
                nsxUnknown(sp, ["body", "breasts", "fur", "hooves", "rear", "genitals"], "nsfwProfile.sensualProfile", warnings);
                var sensual = {};
                var body = nsxPart(sp.body, "Intimate anatomy: body", errors, warnings, false);
                if (body) sensual.body = body;
                var breasts = nsxPart(sp.breasts, "Intimate anatomy: breasts", errors, warnings, true);
                if (breasts) sensual.breasts = breasts;
                var fur = nsxPart(sp.fur, "Intimate anatomy: fur", errors, warnings, false);
                if (fur) sensual.fur = fur;
                var hooves = nsxPart(sp.hooves, "Intimate anatomy: hooves", errors, warnings, false);
                if (hooves) sensual.hooves = hooves;
                var rear = nsxPart(sp.rear, "Intimate anatomy: rear", errors, warnings, false);
                if (rear) sensual.rear = rear;
                var gen = sp.genitals;
                if (gen !== undefined && gen !== null) {
                    if (!gen || typeof gen !== "object") errors.push("Intimate anatomy: genitals must be a block with male/female.");
                    else {
                        nsxUnknown(gen, ["male", "female"], "nsfwProfile.sensualProfile.genitals", warnings);
                        var genOut = {};
                        var gm = nsxPart(gen.male, "Intimate anatomy: male genitals", errors, warnings, false);
                        if (gm) genOut.male = gm;
                        var gf = nsxPart(gen.female, "Intimate anatomy: female genitals", errors, warnings, false);
                        if (gf) genOut.female = gf;
                        if (Object.keys(genOut).length) sensual.genitals = genOut;
                    }
                }
                if (Object.keys(sensual).length) profile.sensualProfile = sensual;
            }
        }
        return profile;
    }

    function validate(src, out, errors, warnings) {
        var tpl = src && src.template && typeof src.template === "object" ? src.template : {};
        if (tpl.cloaca !== undefined && tpl.cloaca !== null) {
            out.cloaca = nsxBool(tpl.cloaca, "Cloaca", errors, false);
        }
        if (tpl.fertilityCycle !== undefined && tpl.fertilityCycle !== null) {
            var fc = tpl.fertilityCycle;
            if (!fc || typeof fc !== "object") {
                errors.push("Fertility cycle must be a block of numbers.");
            } else {
                nsxUnknown(fc, ["hasCycle", "cycleLength", "duration", "arousalBoost", "minAge"], "fertilityCycle", warnings);
                if (fc.hasCycle === true) {
                    out.fertilityCycle = {
                        hasCycle: true,
                        cycleLength: nsxInt(fc.cycleLength, 1, 9999, "Fertility: cycle length (turns)", errors, 36),
                        duration: nsxInt(fc.duration, 1, 999, "Fertility: estrus duration (turns)", errors, 6),
                        arousalBoost: nsxInt(fc.arousalBoost, 0, 100, "Fertility: arousal boost", errors, 25),
                        minAge: nsxInt(fc.minAge, 0, 1200, "Fertility: minimum age (months)", errors, 0)
                    };
                } else {
                    warnings.push("template.fertilityCycle was dropped: hasCycle is not true.");
                }
            }
        }
        if (tpl.nsfwProfile !== undefined && tpl.nsfwProfile !== null) {
            if (!tpl.nsfwProfile || typeof tpl.nsfwProfile !== "object") {
                errors.push("nsfwProfile must be a block of anatomy fields.");
            } else {
                var profile = validateProfile(tpl.nsfwProfile, errors, warnings);
                if (Object.keys(profile).length) out.nsfwProfile = profile;
            }
        }
    }

    // ── side-table registration (window.creatureTemplates) ────────────────

    function register(template) {
        if (!template || !template.species) return;
        var p = template.nsfwProfile || {};
        var ap = template.anatomyProfile || {};
        var entry = {
            type: template.species,
            custom: true,
            isHumanoid: template.isHumanoid === true,
            isCivilized: template.isCivilized === true,
            size: template.size || "medium",
            cloaca: template.cloaca === true,
            allowedSkinTones: (p.allowedSkinTones && p.allowedSkinTones.length ? p.allowedSkinTones : ap.skinTones) || [],
            allowedHairColors: (p.allowedHairColors && p.allowedHairColors.length ? p.allowedHairColors : ap.hairColors) || [],
            allowedEyeColors: (p.allowedEyeColors && p.allowedEyeColors.length ? p.allowedEyeColors : ap.eyeColors) || [],
            visualProfile: p.visualProfile || { surface: { type: ap.surfaceType || "skin" } },
            appearanceProfile: p.appearanceProfile || "humanoid",
            sensualProfile: p.sensualProfile || {}
        };
        if (!Array.isArray(window.creatureTemplates)) window.creatureTemplates = [];
        var key = String(template.species).toLowerCase();
        var i = -1;
        for (var j = 0; j < window.creatureTemplates.length; j++) {
            var t = window.creatureTemplates[j];
            if (t && t.custom === true && String(t.type || "").toLowerCase() === key) { i = j; break; }
        }
        if (i >= 0) window.creatureTemplates[i] = entry;
        else window.creatureTemplates.push(entry);
    }

    function unregister(name) {
        if (!Array.isArray(window.creatureTemplates)) return;
        var key = String(name || "").toLowerCase();
        window.creatureTemplates = window.creatureTemplates.filter(function (t) {
            return !(t && t.custom === true && String(t.type || "").toLowerCase() === key);
        });
    }

    // ── form sections (WB_SECTIONS shape; rendered by cyoaftw-world-building.js) ──

    function nsxLinesOf(text) {
        return String(text || "").split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    }

    var sections = [
        { title: "Intimate anatomy (optional)", intro: "Used in intimate scenes and when the game describes the creature's body. Leave blank to use the defaults from the Body section.", fields: [
            { key: "cloaca", label: "Has a cloaca (a single vent instead of separate genitals and anus)", type: "check" },
            { key: "nsfwAppearance", label: "Body type used in intimate scenes", type: "select", options: function () { return [""].concat(NSX_APPEARANCE_TYPES); } },
            { key: "nsfwSkinTones", label: "Surface colours (intimate scenes)", type: "lines", max: 12, hint: "One per line. Defaults to the Body section colours." },
            { key: "nsfwHairColors", label: "Hair colours (intimate scenes)", type: "lines", max: 12 },
            { key: "nsfwEyeColors", label: "Eye colours (intimate scenes)", type: "lines", max: 12 },
            { key: "nsfwSurfaceType", label: "Surface type (intimate scenes)", type: "select", options: function () { return [""].concat(NSX_SURFACE_TYPES); } },
            { key: "nsfwSurfaceTexture", label: "Surface textures", type: "lines", max: 12, hint: "One per line, such as smooth, rough, glossy." },
            { key: "nsfwSurfaceSheen", label: "Surface sheen", type: "text", max: 80, hint: "Such as matte, glossy, wet." },
            { key: "nsfwSurfaceCoverage", label: "Surface coverage", type: "text", max: 80, hint: "How much of the body the surface covers, if worth mentioning." },
            { key: "nsfwTailHas", label: "Has a tail worth showing in intimate scenes", type: "check" },
            { key: "nsfwTailType", label: "Tail type", type: "text", max: 80 },
            { key: "nsfwTailDescription", label: "Tail description", type: "area", max: 300 },
            { key: "nsfwTailRearView", label: "Show the tail in rear views", type: "check" },
            { key: "sensBody", label: "Body (intimate scenes)", type: "area", max: 300 },
            { key: "sensBreasts", label: "Breasts (intimate scenes)", type: "area", max: 300 },
            { key: "sensBreastSize", label: "Breast size word", type: "text", max: 40 },
            { key: "sensFur", label: "Fur (intimate scenes)", type: "area", max: 300 },
            { key: "sensHooves", label: "Hooves (intimate scenes)", type: "area", max: 300 },
            { key: "sensRear", label: "Rear / tail base (intimate scenes)", type: "area", max: 300 },
            { key: "sensGenitalsMale", label: "Male genitals (intimate scenes)", type: "area", max: 300 },
            { key: "sensGenitalsFemale", label: "Female genitals (intimate scenes)", type: "area", max: 300 }
        ] },
        { title: "Fertility cycle (optional)", intro: "Drives autonomous arousal over time for this species. Leave off for creatures without a cycle.", fields: [
            { key: "fertHasCycle", label: "This species has a fertility cycle", type: "check" },
            { key: "fertCycleLength", label: "Turns between cycles", type: "text", max: 8 },
            { key: "fertDuration", label: "Turns each cycle lasts", type: "text", max: 8 },
            { key: "fertArousalBoost", label: "Arousal added during a cycle (0-100)", type: "text", max: 8 },
            { key: "fertMinAge", label: "Minimum age in months (0 = no limit)", type: "text", max: 8 }
        ] }
    ];

    // ── form value mapping ────────────────────────────────────────────────

    function entryToValues(entry) {
        var t = (entry && entry.template) || {};
        var p = t.nsfwProfile || {};
        var vp = p.visualProfile || {};
        var surf = vp.surface || {};
        var tail = vp.tail || {};
        var sens = p.sensualProfile || {};
        var gen = sens.genitals || {};
        var fc = t.fertilityCycle || {};
        var join = function (l) { return Array.isArray(l) ? l.join("\n") : ""; };
        var num = function (n) { return n === undefined || n === null ? "" : String(n); };
        return {
            cloaca: t.cloaca === true,
            fertHasCycle: fc.hasCycle === true,
            fertCycleLength: num(fc.cycleLength), fertDuration: num(fc.duration),
            fertArousalBoost: num(fc.arousalBoost), fertMinAge: num(fc.minAge),
            nsfwAppearance: p.appearanceProfile || "",
            nsfwSkinTones: join(p.allowedSkinTones), nsfwHairColors: join(p.allowedHairColors), nsfwEyeColors: join(p.allowedEyeColors),
            nsfwSurfaceType: surf.type || "", nsfwSurfaceTexture: join(surf.texture),
            nsfwSurfaceSheen: surf.sheen || "", nsfwSurfaceCoverage: surf.coverage || "",
            nsfwTailHas: tail.has === true, nsfwTailType: tail.type || "",
            nsfwTailDescription: tail.description || "", nsfwTailRearView: tail.displayInRearView === true,
            sensBody: (sens.body && sens.body.description) || "",
            sensBreasts: (sens.breasts && sens.breasts.description) || "",
            sensBreastSize: (sens.breasts && sens.breasts.size) || "",
            sensFur: (sens.fur && sens.fur.description) || "",
            sensHooves: (sens.hooves && sens.hooves.description) || "",
            sensRear: (sens.rear && sens.rear.description) || "",
            sensGenitalsMale: (gen.male && gen.male.description) || "",
            sensGenitalsFemale: (gen.female && gen.female.description) || ""
        };
    }

    function valuesToEntry(entry, v) {
        var t = entry.template = entry.template || {};
        if (v.cloaca) t.cloaca = true; else delete t.cloaca;

        if (v.fertHasCycle) {
            var num = function (s) {
                var n = Number(String(s === undefined || s === null ? "" : s).trim());
                return String(s).trim() !== "" && Number.isFinite(n) ? n : String(s || "").trim();
            };
            t.fertilityCycle = {
                hasCycle: true,
                cycleLength: num(v.fertCycleLength),
                duration: num(v.fertDuration),
                arousalBoost: num(v.fertArousalBoost),
                minAge: num(v.fertMinAge)
            };
        } else {
            delete t.fertilityCycle;
        }

        var profile = {};
        if (v.nsfwAppearance) profile.appearanceProfile = String(v.nsfwAppearance);
        var skin = nsxLinesOf(v.nsfwSkinTones); if (skin.length) profile.allowedSkinTones = skin;
        var hair = nsxLinesOf(v.nsfwHairColors); if (hair.length) profile.allowedHairColors = hair;
        var eyes = nsxLinesOf(v.nsfwEyeColors); if (eyes.length) profile.allowedEyeColors = eyes;
        var surface = {};
        if (v.nsfwSurfaceType) surface.type = String(v.nsfwSurfaceType);
        var tex = nsxLinesOf(v.nsfwSurfaceTexture); if (tex.length) surface.texture = tex;
        var sheen = String(v.nsfwSurfaceSheen || "").trim(); if (sheen) surface.sheen = sheen;
        var coverage = String(v.nsfwSurfaceCoverage || "").trim(); if (coverage) surface.coverage = coverage;
        var tail = {};
        if (v.nsfwTailHas) tail.has = true;
        var ttype = String(v.nsfwTailType || "").trim(); if (ttype) tail.type = ttype;
        var tdesc = String(v.nsfwTailDescription || "").trim(); if (tdesc) tail.description = tdesc;
        if (v.nsfwTailRearView) tail.displayInRearView = true;
        var visual = {};
        if (Object.keys(surface).length) visual.surface = surface;
        if (Object.keys(tail).length) visual.tail = tail;
        if (Object.keys(visual).length) profile.visualProfile = visual;
        var sensual = {};
        var part = function (val) { var s = String(val || "").trim(); return s ? { description: s } : null; };
        var body = part(v.sensBody); if (body) sensual.body = body;
        var fur = part(v.sensFur); if (fur) sensual.fur = fur;
        var hooves = part(v.sensHooves); if (hooves) sensual.hooves = hooves;
        var rear = part(v.sensRear); if (rear) sensual.rear = rear;
        var bdesc = String(v.sensBreasts || "").trim();
        var bsize = String(v.sensBreastSize || "").trim();
        if (bdesc || bsize) {
            sensual.breasts = {};
            if (bdesc) sensual.breasts.description = bdesc;
            if (bsize) sensual.breasts.size = bsize;
        }
        var gen = {};
        var gm = part(v.sensGenitalsMale); if (gm) gen.male = gm;
        var gf = part(v.sensGenitalsFemale); if (gf) gen.female = gf;
        if (Object.keys(gen).length) sensual.genitals = gen;
        if (Object.keys(sensual).length) profile.sensualProfile = sensual;
        if (Object.keys(profile).length) t.nsfwProfile = profile;
        else delete t.nsfwProfile;
    }

    // ── install ───────────────────────────────────────────────────────────

    window.CUSTOM_SPECIES_EXTENSION = {
        templateFields: ["cloaca", "fertilityCycle", "nsfwProfile"],
        validate: validate,
        register: register,
        unregister: unregister,
        sections: sections,
        entryToValues: entryToValues,
        valuesToEntry: valuesToEntry
    };

    // Re-run library registration now that this extension owns its fields, so
    // creatures stored with NSFW fields re-register with them intact (the SFW
    // load pass ran before this file and dropped them as unknown).
    if (typeof window.registerCustomSpeciesLibrary === "function") {
        try { window.registerCustomSpeciesLibrary(); }
        catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("Custom species NSFW re-registration failed", e); }
    }
})();
