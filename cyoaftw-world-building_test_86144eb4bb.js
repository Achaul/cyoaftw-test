// ── WORLD BUILDING (setup-screen creature authoring) ────────────
// The form, list, import and export UI for custom species. Loaded after
// cyoaftw-custom-species.js, which owns validation, storage and registration.
// Every field is typed in by the player; nothing here writes or rewrites content.
// The modal shell (#worldBuildingModal) lives in cyoaftw-engine-CORE.html.

const WB_SECTIONS = [
    { title: "Basics", fields: [
        { key: "species", label: "Name", type: "text", max: 24, required: true, hint: "Letters, spaces, hyphens or apostrophes. Cannot match a built-in species." },
        { key: "isHumanoid", label: "Humanoid (stands and acts like a person)", type: "check" },
        { key: "isCivilized", label: "Civilized (builds and lives in settlements)", type: "check" },
        { key: "size", label: "Size", type: "select", options: () => CUSTOM_SPECIES_SIZES },
        { key: "speechStyle", label: "Speech style", type: "select", options: () => CUSTOM_SPECIES_SPEECH_STYLES },
        { key: "lore", label: "Lore", type: "area", max: 600, required: true, hint: "Who they are and how they treat strangers." },
        { key: "articulation", label: "How they sound when they speak", type: "area", max: 300 }
    ] },
    { title: "Portrait", fields: [
        { key: "portraitFace", label: "Face and head", type: "area", max: 300, required: true, hint: "Used to describe the face in portraits." },
        { key: "portraitNegatives", label: "Never show", type: "area", max: 300, hint: "Features portraits must avoid, such as \"human face, wings\"." }
    ] },
    { title: "Body", fields: [
        { key: "ears", label: "Ears", type: "text", max: 300, required: true, hint: "Write \"no ears\" if there are none." },
        { key: "face", label: "Face", type: "text", max: 300 },
        { key: "bodyPlan", label: "Body plan", type: "text", max: 300, required: true },
        { key: "feet", label: "Feet", type: "text", max: 300 },
        { key: "tail", label: "Tail", type: "text", max: 300 },
        { key: "absent", label: "Parts they lack", type: "lines", max: 8, hint: "One per line, such as hands or hair." },
        { key: "typicalBuild", label: "Typical build", type: "text", max: 300, required: true },
        { key: "bodyFatEligible", label: "Individuals can carry extra body fat", type: "check" },
        { key: "surfaceType", label: "Surface", type: "select", options: () => CUSTOM_SPECIES_SURFACES }
    ] },
    { title: "How the game describes them", intro: "Plain wording players read. Leave a line blank to leave that part out of descriptions.", fields: [
        { key: "lookEars", label: "Ears", type: "text", max: 300 },
        { key: "lookFace", label: "Face", type: "text", max: 300 },
        { key: "lookBodyPlan", label: "Body", type: "text", max: 300 },
        { key: "lookFeet", label: "Feet", type: "text", max: 300 },
        { key: "lookTail", label: "Tail", type: "text", max: 300 }
    ] },
    { title: "Options for individuals", intro: "One option per line. Each new individual picks from these.", fields: [
        { key: "skinTones", label: "Skin, scale, fur or surface colours", type: "lines", max: 12, required: true },
        { key: "hairColors", label: "Hair colours", type: "lines", max: 12, hint: "Leave empty if they have no hair." },
        { key: "hairStyles", label: "Hair styles", type: "lines", max: 12 },
        { key: "eyeColors", label: "Eye colours", type: "lines", max: 12 },
        { key: "builds", label: "Builds", type: "lines", max: 12, required: true },
        { key: "features", label: "Distinguishing features", type: "lines", max: 12, required: true },
        { key: "movements", label: "Ways of moving", type: "lines", max: 12, required: true },
        { key: "voices", label: "Voices", type: "lines", max: 12, required: true }
    ] },
    { title: "Culture", intro: "One entry per line.", fields: [
        { key: "values", label: "Values", type: "lines", max: 12 },
        { key: "topics", label: "Topics they talk about", type: "lines", max: 12 },
        { key: "taboos", label: "Taboos", type: "lines", max: 12 }
    ] },
    { title: "Where they live", fields: [
        { key: "zones", label: "Zones they can appear in", type: "zones" },
        { key: "food", label: "What they eat", type: "text", max: 120 },
        { key: "namesMale", label: "Male given names", type: "lines", max: 20 },
        { key: "namesFemale", label: "Female given names", type: "lines", max: 20 },
        { key: "namesSurnames", label: "Surnames", type: "lines", max: 20 }
    ] }
];

const worldBuildingState = { opener: null, editing: null, confirmDelete: null };

// NSFW extension hook: when the NSFW half (nsfw/cyoaftw-custom-species-nsfw.js)
// installs window.CUSTOM_SPECIES_EXTENSION, its `sections` are appended to the
// form and its entryToValues/valuesToEntry flatten and rebuild its fields.
// This file never names NSFW content; without the extension these are no-ops.
function _wbExtension() {
    if (typeof window !== "undefined" && window && window.CUSTOM_SPECIES_EXTENSION) return window.CUSTOM_SPECIES_EXTENSION;
    if (typeof CUSTOM_SPECIES_EXTENSION !== "undefined" && CUSTOM_SPECIES_EXTENSION) return CUSTOM_SPECIES_EXTENSION;
    return null;
}

function _wbAllSections() {
    const ext = _wbExtension();
    return ext && Array.isArray(ext.sections) ? WB_SECTIONS.concat(ext.sections) : WB_SECTIONS;
}

function _wbLines(text) {
    return String(text || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

// Flattens a library entry into the form's field values.
function worldBuildingEntryToValues(entry) {
    const t = (entry && entry.template) || {};
    const ap = t.anatomyProfile || {};
    const m = ap.morphology || {};
    const look = ap.look || {};
    const c = t.culture || {};
    const e = (entry && entry.engine) || {};
    const n = e.names || {};
    const join = list => (Array.isArray(list) ? list.join("\n") : "");
    const pp = t.portraitProfile || {};
    const values = {
        species: t.species || "", isHumanoid: !!t.isHumanoid, isCivilized: !!t.isCivilized,
        size: t.size || "medium", speechStyle: t.speechStyle || "common",
        lore: t.lore || "", articulation: t.articulation || "",
        portraitFace: pp.face || "", portraitNegatives: pp.negatives || "",
        ears: m.ears || "", face: m.face || "", bodyPlan: m.bodyPlan || "", feet: m.feet || "", tail: m.tail || "",
        absent: join(m.absent), typicalBuild: ap.typicalBuild || "", bodyFatEligible: !!ap.bodyFatEligible,
        surfaceType: ap.surfaceType || "skin",
        lookEars: look.ears || "", lookFace: look.face || "", lookBodyPlan: look.bodyPlan || "",
        lookFeet: look.feet || "", lookTail: look.tail || "",
        skinTones: join(ap.skinTones), hairColors: join(ap.hairColors), hairStyles: join(ap.hairStyles),
        eyeColors: join(ap.eyeColors), builds: join(ap.builds), features: join(ap.features),
        movements: join(ap.movements), voices: join(ap.voices),
        values: join(c.values), topics: join(c.topics), taboos: join(c.taboos),
        zones: Array.isArray(e.zones) ? e.zones.slice() : [], food: e.food || "",
        namesMale: join(n.male), namesFemale: join(n.female), namesSurnames: join(n.surnames)
    };
    const ext = _wbExtension();
    if (ext && typeof ext.entryToValues === "function") {
        try { Object.assign(values, ext.entryToValues(entry)); } catch (err) { /* keep base values */ }
    }
    return values;
}

// Builds a library entry from form values. `base` is the entry being edited, so
// fields the form does not expose (anatomyType, hasTail, sizeWord) survive an edit.
// The result is not validated; saveCustomSpecies does that.
function worldBuildingValuesToEntry(values, base) {
    const v = values || {};
    const entry = base ? JSON.parse(JSON.stringify(base)) : { template: {}, engine: {} };
    const t = entry.template = entry.template || {};
    const ap = t.anatomyProfile = t.anatomyProfile || {};
    t.species = String(v.species || "");
    t.isHumanoid = !!v.isHumanoid;
    t.isCivilized = !!v.isCivilized;
    t.size = v.size;
    t.speechStyle = v.speechStyle;
    t.lore = v.lore;
    t.articulation = v.articulation;
    t.portraitProfile = Object.assign({}, t.portraitProfile, { face: v.portraitFace, negatives: v.portraitNegatives });
    ap.morphology = { ears: v.ears, face: v.face, bodyPlan: v.bodyPlan, feet: v.feet, tail: v.tail, absent: _wbLines(v.absent) };
    ap.look = { ears: v.lookEars, face: v.lookFace, bodyPlan: v.lookBodyPlan, feet: v.lookFeet, tail: v.lookTail };
    ap.typicalBuild = v.typicalBuild;
    ap.bodyFatEligible = !!v.bodyFatEligible;
    ap.surfaceType = v.surfaceType;
    for (const key of ["skinTones", "hairColors", "hairStyles", "eyeColors", "builds", "features", "movements", "voices"]) {
        ap[key] = _wbLines(v[key]);
    }
    t.culture = { values: _wbLines(v.values), topics: _wbLines(v.topics), taboos: _wbLines(v.taboos) };
    const names = { male: _wbLines(v.namesMale), female: _wbLines(v.namesFemale), surnames: _wbLines(v.namesSurnames) };
    entry.engine = { zones: Array.isArray(v.zones) ? v.zones.slice() : [], food: v.food || "" };
    if (names.male.length || names.female.length || names.surnames.length) entry.engine.names = names;
    const ext = _wbExtension();
    if (ext && typeof ext.valuesToEntry === "function") {
        try { ext.valuesToEntry(entry, v); } catch (err) { /* keep base entry */ }
    }
    return entry;
}

function worldBuildingSummary(entry) {
    const t = entry.template;
    const zones = entry.engine && entry.engine.zones && entry.engine.zones.length ? entry.engine.zones.join(", ") : "no zones yet";
    return t.size + ", " + (t.isHumanoid ? "humanoid" : "not humanoid") + ", " + (t.isCivilized ? "civilized" : "wild") + " · " + zones;
}

// ── DOM helpers ─────────────────────────────────────────────────

function _wbEl(tag, props, children) {
    const el = document.createElement(tag);
    for (const key of Object.keys(props || {})) {
        if (key === "text") el.textContent = props[key];
        else if (key === "class") el.className = props[key];
        else if (key.slice(0, 2) === "on") el.addEventListener(key.slice(2), props[key]);
        else if (props[key] === true) el.setAttribute(key, "");
        else if (props[key] !== false && props[key] !== null && props[key] !== undefined) el.setAttribute(key, props[key]);
    }
    for (const child of children || []) if (child) el.appendChild(child);
    return el;
}

function _wbStatus(message, isError) {
    const el = document.getElementById("worldBuildingStatus");
    if (!el) return;
    el.textContent = message || "";
    el.classList.toggle("save-error", !!isError);
}

function _wbRoot() { return document.getElementById("worldBuildingBody"); }

function _wbFieldId(key) { return "wbField_" + key; }

function _wbRenderField(field, values) {
    const id = _wbFieldId(field.key);
    const label = _wbEl("label", { for: id, text: field.label + (field.required ? " *" : "") });
    let control;
    if (field.type === "check") {
        control = _wbEl("input", { type: "checkbox", id });
        control.checked = !!values[field.key];
        const wrap = _wbEl("div", { class: "wb-field wb-check" }, [control, _wbEl("label", { for: id, text: field.label })]);
        return wrap;
    }
    if (field.type === "select") {
        control = _wbEl("select", { id });
        for (const option of field.options()) control.appendChild(_wbEl("option", { value: option, text: option }));
        control.value = values[field.key];
    } else if (field.type === "zones") {
        control = _wbEl("div", { id, class: "wb-zones", role: "group", "aria-label": field.label });
        const zones = typeof ZONE_TEMPLATES !== "undefined" ? ZONE_TEMPLATES : [];
        for (const zone of zones) {
            const zid = id + "_" + zone.name.replace(/[^A-Za-z0-9]/g, "");
            const box = _wbEl("input", { type: "checkbox", id: zid, value: zone.name });
            box.checked = (values.zones || []).indexOf(zone.name) >= 0;
            control.appendChild(_wbEl("span", { class: "wb-zone" }, [box, _wbEl("label", { for: zid, text: zone.name })]));
        }
    } else if (field.type === "area" || field.type === "lines") {
        control = _wbEl("textarea", { id, rows: field.type === "area" ? 3 : 4, maxlength: field.type === "area" ? field.max : null });
        control.value = values[field.key];
    } else {
        control = _wbEl("input", { type: "text", id, maxlength: field.max });
        control.value = values[field.key];
    }
    const hint = field.hint ? _wbEl("div", { class: "wb-hint", id: id + "_hint", text: field.hint }) : null;
    if (hint) control.setAttribute("aria-describedby", id + "_hint");
    return _wbEl("div", { class: "wb-field" }, [label, control, hint]);
}

function _wbReadValues() {
    const values = {};
    for (const section of _wbAllSections()) {
        for (const field of section.fields) {
            const el = document.getElementById(_wbFieldId(field.key));
            if (!el) continue;
            if (field.type === "check") values[field.key] = el.checked;
            else if (field.type === "zones") values[field.key] = Array.from(el.querySelectorAll("input:checked")).map(b => b.value);
            else values[field.key] = el.value;
        }
    }
    return values;
}

// ── Views ───────────────────────────────────────────────────────

function renderWorldBuildingList() {
    const root = _wbRoot();
    if (!root) return;
    worldBuildingState.editing = null;
    root.textContent = "";
    const names = typeof listCustomSpecies === "function" ? listCustomSpecies() : [];
    const toolbar = _wbEl("div", { class: "save-actions save-toolbar" }, [
        _wbEl("button", { type: "button", class: "save-primary", id: "wbNewBtn", text: "New creature", onclick: () => renderWorldBuildingForm(null) }),
        _wbEl("button", { type: "button", id: "wbImportBtn", text: "Import file", onclick: () => document.getElementById("worldBuildingFileInput").click() }),
        _wbEl("button", { type: "button", id: "wbExportAllBtn", text: "Export all", disabled: !names.length, onclick: () => worldBuildingExport(null) }),
        _wbEl("button", { type: "button", id: "wbCopyAllBtn", text: "Copy all", disabled: !names.length, onclick: () => worldBuildingCopy(null) })
    ]);
    root.appendChild(toolbar);
    const paste = _wbEl("details", { class: "wb-paste" }, [
        _wbEl("summary", { text: "Paste template text instead" }),
        _wbEl("textarea", { id: "worldBuildingPasteBox", rows: 5, "aria-label": "Pasted creature template text" }),
        _wbEl("div", { class: "save-actions" }, [
            _wbEl("button", { type: "button", id: "wbPasteImportBtn", text: "Import pasted text", onclick: () => {
                const box = document.getElementById("worldBuildingPasteBox");
                worldBuildingImportText(box.value);
            } })
        ])
    ]);
    root.appendChild(paste);
    const list = _wbEl("div", { id: "worldBuildingList", "aria-label": "Your creatures" });
    if (!names.length) {
        list.appendChild(_wbEl("p", { class: "save-empty", text: "No creatures yet. Create one, or import a file from another player." }));
    }
    for (const name of names) {
        const entry = customSpeciesLibrary.entries.find(e => e.template.species === name);
        if (!entry) continue;
        const confirming = worldBuildingState.confirmDelete === name;
        const actions = _wbEl("div", { class: "save-actions" }, [
            _wbEl("button", { type: "button", text: "Edit", "aria-label": "Edit " + name, onclick: () => renderWorldBuildingForm(name) }),
            _wbEl("button", { type: "button", text: "Export", "aria-label": "Export " + name, onclick: () => worldBuildingExport(name) }),
            _wbEl("button", { type: "button", text: "Copy", "aria-label": "Copy " + name, onclick: () => worldBuildingCopy(name) }),
            _wbEl("button", { type: "button", class: "save-danger", text: confirming ? "Confirm delete" : "Delete", "aria-label": (confirming ? "Confirm delete " : "Delete ") + name, onclick: () => worldBuildingDelete(name) })
        ]);
        list.appendChild(_wbEl("div", { class: "save-entry" }, [
            _wbEl("h4", { text: name }),
            _wbEl("p", { class: "save-summary", text: worldBuildingSummary(entry) }),
            actions
        ]));
    }
    root.appendChild(list);
    _wbStatus("");
}

function renderWorldBuildingForm(name) {
    const root = _wbRoot();
    if (!root) return;
    const entry = name ? customSpeciesLibrary.entries.find(e => e.template.species === name) : null;
    worldBuildingState.editing = { original: entry ? entry.template.species : null, base: entry || null };
    const values = worldBuildingEntryToValues(entry || {
        template: { size: "medium", speechStyle: "common", surfaceType: "skin" }, engine: {}
    });
    root.textContent = "";
    root.appendChild(_wbEl("h4", { class: "wb-form-title", text: entry ? "Edit " + entry.template.species : "New creature" }));
    root.appendChild(_wbEl("p", { class: "save-intro", text: "Fill in the fields yourself. Fields marked * are required. Nothing is written for you." }));
    root.appendChild(_wbEl("div", { id: "worldBuildingErrors", class: "wb-errors", role: "alert", hidden: true }));
    for (const section of _wbAllSections()) {
        const box = _wbEl("fieldset", { class: "wb-section" }, [_wbEl("legend", { text: section.title })]);
        if (section.intro) box.appendChild(_wbEl("p", { class: "wb-hint", text: section.intro }));
        for (const field of section.fields) box.appendChild(_wbRenderField(field, values));
        root.appendChild(box);
    }
    root.appendChild(_wbEl("div", { class: "save-actions wb-form-actions" }, [
        _wbEl("button", { type: "button", class: "save-primary", id: "wbSaveBtn", text: "Save creature", onclick: worldBuildingSave }),
        _wbEl("button", { type: "button", id: "wbCancelBtn", text: "Cancel", onclick: () => { renderWorldBuildingList(); } })
    ]));
    _wbStatus("");
    const first = document.getElementById(_wbFieldId("species"));
    if (first) first.focus();
}

// ── Actions ─────────────────────────────────────────────────────

function worldBuildingSave() {
    const editing = worldBuildingState.editing;
    if (!editing) return;
    const entry = worldBuildingValuesToEntry(_wbReadValues(), editing.base);
    const originalKey = editing.original ? editing.original.toLowerCase() : "";
    const newKey = String(entry.template.species || "").trim().toLowerCase();
    // Renaming onto a different existing creature would silently overwrite it.
    if (newKey && newKey !== originalKey && customSpeciesLibrary.entries.some(e => e.template.species.toLowerCase() === newKey)) {
        _wbShowErrors(["You already have a creature named \"" + entry.template.species.trim() + "\". Choose another name or edit that one."]);
        return;
    }
    const result = saveCustomSpecies(entry);
    if (!result.ok) { _wbShowErrors(result.errors); return; }
    if (editing.original && editing.original.toLowerCase() !== result.name.toLowerCase()) deleteCustomSpecies(editing.original);
    renderWorldBuildingList();
    const notes = [];
    if (result.warnings && result.warnings.length) notes.push(result.warnings.length + " note(s): " + result.warnings.join(" "));
    if (!result.saved) notes.push("It could not be stored in this browser. Export it to keep a copy.");
    _wbStatus("Saved " + result.name + ". " + notes.join(" ") + (result.saved ? " Export a copy to keep a backup." : ""), !result.saved);
}

// The validator names fields by their data path; players know them by form label.
const WB_ERROR_LABELS = {
    "anatomyProfile.morphology.absent": "Parts they lack",
    "anatomyProfile.morphology.ears": "Body: ears",
    "anatomyProfile.morphology.bodyPlan": "Body: body plan",
    "anatomyProfile.typicalBuild": "Typical build",
    "anatomyProfile.surfaceType": "Surface",
    "anatomyProfile.skinTones": "Surface colours",
    "anatomyProfile.hairColors": "Hair colours",
    "anatomyProfile.hairStyles": "Hair styles",
    "anatomyProfile.eyeColors": "Eye colours",
    "anatomyProfile.builds": "Builds",
    "anatomyProfile.features": "Distinguishing features",
    "anatomyProfile.movements": "Ways of moving",
    "anatomyProfile.voices": "Voices",
    "portraitProfile.face": "Portrait: face and head",
    "portraitProfile": "Portrait",
    "culture.values": "Values",
    "culture.topics": "Topics",
    "culture.taboos": "Taboos",
    "engine.zones": "Zones",
    "engine.names.male": "Male given names",
    "engine.names.female": "Female given names",
    "engine.names.surnames": "Surnames",
    "species": "Name",
    "isHumanoid": "Humanoid",
    "isCivilized": "Civilized",
    "speechStyle": "Speech style",
    "size": "Size",
    "lore": "Lore"
};

function worldBuildingErrorText(message) {
    const paths = Object.keys(WB_ERROR_LABELS).sort((a, b) => b.length - a.length);
    let text = String(message);
    for (const path of paths) {
        text = text.split(path).join(WB_ERROR_LABELS[path]);
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function _wbShowErrors(errors) {
    const box = document.getElementById("worldBuildingErrors");
    if (!box) return;
    box.textContent = "";
    box.appendChild(_wbEl("strong", { text: "This creature can't be saved yet:" }));
    const ul = _wbEl("ul");
    for (const e of errors) ul.appendChild(_wbEl("li", { text: worldBuildingErrorText(e) }));
    box.appendChild(ul);
    box.hidden = false;
    box.scrollIntoView && box.scrollIntoView({ block: "nearest" });
}

function worldBuildingDelete(name) {
    if (worldBuildingState.confirmDelete !== name) {
        worldBuildingState.confirmDelete = name;
        renderWorldBuildingList();
        _wbStatus("Press Delete again to remove " + name + ". Export it first if you may want it back.");
        return;
    }
    worldBuildingState.confirmDelete = null;
    deleteCustomSpecies(name);
    renderWorldBuildingList();
    _wbStatus("Deleted " + name + ".");
}

function worldBuildingExportText(name) {
    return exportCustomSpecies(name ? [name] : null);
}

function worldBuildingExport(name) {
    const text = worldBuildingExportText(name);
    try {
        const blob = new Blob([text], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = (name ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "my-creatures") + ".creature.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        _wbStatus("Exported " + (name || "all creatures") + ".");
    } catch (e) {
        _wbStatus("Download is not available here. Use Copy instead.", true);
    }
}

function worldBuildingCopy(name) {
    const text = worldBuildingExportText(name);
    const done = () => _wbStatus("Copied " + (name || "all creatures") + " to the clipboard.");
    const fail = () => _wbStatus("Copy is not available here. Use Export instead.", true);
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fail);
    else fail();
}

function worldBuildingImportText(text) {
    const report = importCustomSpecies(text);
    renderWorldBuildingList();
    if (!report.ok) { _wbStatus(report.error, true); return report; }
    const parts = [];
    if (report.added.length) parts.push("Added " + report.added.join(", ") + ".");
    if (report.replaced.length) parts.push("Updated " + report.replaced.join(", ") + ".");
    for (const s of report.skipped) parts.push("Skipped " + s.name + ": " + s.reasons.join(" "));
    _wbStatus(parts.join(" ") || "Nothing was imported.", !report.added.length && !report.replaced.length);
    return report;
}

function worldBuildingImportFile(input) {
    const file = input && input.files && input.files[0];
    if (!file) return;
    const finish = text => { worldBuildingImportText(text); input.value = ""; };
    if (file.text) file.text().then(finish, () => { _wbStatus("That file could not be read.", true); input.value = ""; });
    else {
        const reader = new FileReader();
        reader.onload = () => finish(String(reader.result));
        reader.onerror = () => { _wbStatus("That file could not be read.", true); input.value = ""; };
        reader.readAsText(file);
    }
}

function openWorldBuilding() {
    const modal = document.getElementById("worldBuildingModal");
    if (!modal) return;
    if (!modal.classList.contains("active")) worldBuildingState.opener = document.activeElement;
    worldBuildingState.confirmDelete = null;
    renderWorldBuildingList();
    modal.classList.add("active");
    document.getElementById("worldBuildingCloseBtn").focus();
}

function closeWorldBuilding() {
    const modal = document.getElementById("worldBuildingModal");
    if (!modal) return;
    modal.classList.remove("active");
    worldBuildingState.editing = null;
    worldBuildingState.confirmDelete = null;
    const opener = worldBuildingState.opener;
    if (opener && opener.isConnected) opener.focus();
}

if (typeof document !== "undefined") {
    document.addEventListener("keydown", function (event) {
        const modal = document.getElementById("worldBuildingModal");
        if (!modal || !modal.classList.contains("active")) return;
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopImmediatePropagation();
            if (worldBuildingState.editing) renderWorldBuildingList();
            else closeWorldBuilding();
        } else if (event.key === "Tab") {
            const items = Array.from(modal.querySelectorAll("button:not(:disabled), input:not(:disabled):not([type=hidden]), select, textarea, summary"))
                .filter(el => el.getClientRects().length);
            if (!items.length) return;
            const first = items[0], last = items[items.length - 1];
            if (!modal.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
            else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
    });
}
