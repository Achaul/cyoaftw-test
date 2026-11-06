/**
 * BATHHOUSE NSFW CONTEXT
 * Bathhouse service definitions and intimacy system integration
 * 
 * Version: 2026-10-24-001
 * 
 * Features:
 * - 9 bathhouse services with act filtering
 * - Context-aware narration (bathhouse setting overrides)
 * - Turn tracking with 5-turn warning
 * - Charisma-based boundary pushing
 * - Unified payment flow (bathhouse always takes 30%)
 */

// ============================================================================
// SERVICE DEFINITIONS
// ============================================================================

/**
 * Bathhouse NSFW Services
 * Each service defines:
 * - Metadata (name, cost, turns, recovery)
 * - Allowed act types for intimacy system
 * - Setting context for narration overrides
 * - Charisma bonuses for boundary pushing
 */
const BATHHOUSE_SERVICES = {
    // ========================================================================
    // TIER 1: MANUAL STIMULATION (Handjob/Fingering) - 40-60 gold
    // ========================================================================
    
    bath_manual_stress: {
        id: 'bath_manual_stress',
        name: "Dungeon Delver's Rub",
        tier: 'manual',
        cost: 40,
        baseTurns: 3,
        minTurns: 3,
        staminaRecovery: 6,
        cleanses: false,
        allowedActTypes: ['tease', 'touch'],
        compatibleWith: ['male', 'female', 'neutral', 'nonbinary'],
        requiresActTypes: ['tease', 'touch'],
        setting: {
            location: "private chamber",
            furniture: "treatment bench",
            props: ["warm oil", "linen towels"],
            context: "manual service",
            atmosphere: "professional, oil-slicked"
        },
        description: "Skilled hands work out the deepest tension with warm herbal oils.",
        charismaBonus: {
            minCharisma: 12,
            effect: "extra_turn",
            value: 1,
            description: "Your silver tongue convinces them to linger a bit longer."
        }
    },
    
    bath_manual_oil: {
        id: 'bath_manual_oil',
        name: "Herbal Oil Release",
        tier: 'manual',
        cost: 50,
        baseTurns: 3,
        minTurns: 3,
        staminaRecovery: 7,
        cleanses: true,
        allowedActTypes: ['tease', 'touch'],
        compatibleWith: ['male', 'female', 'neutral', 'nonbinary'],
        requiresActTypes: ['tease', 'touch'],
        setting: {
            location: "private chamber",
            furniture: "treatment bench",
            props: ["herbal oils", "clean linen"],
            context: "oil massage",
            atmosphere: "fragrant, slick"
        },
        description: "Herbal oils make the skin slick as expert hands work out all tension.",
        charismaBonus: {
            minCharisma: 12,
            effect: "extra_turn",
            value: 1,
            description: "Your persuasive words earn you extra attention."
        }
    },
    
    bath_manual_tension: {
        id: 'bath_manual_tension',
        name: "Adventurer's Ease",
        tier: 'manual',
        cost: 60,
        baseTurns: 4,
        minTurns: 4,
        staminaRecovery: 8,
        cleanses: false,
        allowedActTypes: ['tease', 'touch'],
        compatibleWith: ['male', 'female', 'neutral', 'nonbinary'],
        requiresActTypes: ['tease', 'touch'],
        setting: {
            location: "private chamber",
            furniture: "treatment bench",
            props: ["warm oil", "linen screens"],
            context: "full body tension release",
            atmosphere: "methodical, thorough"
        },
        description: "A knowing touch finds and works out tension you didn't realize you carried.",
        charismaBonus: {
            minCharisma: 12,
            effect: "extra_turn",
            value: 1,
            description: "Your charm has them finding even the deepest knots."
        }
    },
    
    // ========================================================================
    // TIER 2: ORAL SERVICE - 100-130 gold
    // Allows: cunnilingus, fellatio, analingus
    // ========================================================================
    
    bath_oral_deep: {
        id: 'bath_oral_deep',
        name: "Delver's Deep Relief",
        tier: 'oral',
        cost: 100,
        baseTurns: 4,
        minTurns: 4,
        staminaRecovery: 10,
        cleanses: false,
        allowedActTypes: ['oral', 'tease'],
        compatibleWith: ['male', 'female', 'neutral', 'nonbinary'],
        requiresActTypes: ['oral', 'tease'],
        recipientAnatomy: ['penis', 'vulva'],
        providerAnatomy: ['mouth', 'tongue'],
        setting: {
            location: "private chamber",
            furniture: "treatment bench",
            props: ["warm breath", "skilled tongue"],
            context: "oral service",
            atmosphere: "intimate, thorough"
        },
        description: "Some aches can't be reached with hands alone - skilled mouth provides complete relief.",
        charismaBonus: {
            minCharisma: 14,
            effect: "enhanced_recovery",
            value: 2,
            description: "Your persuasive words make the experience even more satisfying."
        }
    },
    
    bath_oral_comprehensive: {
        id: 'bath_oral_comprehensive',
        name: "Full Exploration",
        tier: 'oral',
        cost: 120,
        baseTurns: 5,
        minTurns: 5,
        staminaRecovery: 12,
        cleanses: false,
        allowedActTypes: ['oral', 'tease'],
        compatibleWith: ['male', 'female', 'neutral', 'nonbinary'],
        requiresActTypes: ['oral', 'tease'],
        recipientAnatomy: ['penis', 'vulva', 'anus'],
        providerAnatomy: ['mouth', 'tongue'],
        setting: {
            location: "private chamber",
            furniture: "padded bench",
            props: ["herbal oils", "warm breath"],
            context: "comprehensive oral service",
            atmosphere: "exploratory, lingering"
        },
        description: "Every inch receives attention before the thorough oral release.",
        charismaBonus: {
            minCharisma: 14,
            effect: "enhanced_recovery",
            value: 2,
            description: "Your charm earns you the most thorough attention."
        }
    },
    
    bath_oral_traveler: {
        id: 'bath_oral_traveler',
        name: "Road-Worn Solace",
        tier: 'oral',
        cost: 130,
        baseTurns: 5,
        minTurns: 5,
        staminaRecovery: 14,
        cleanses: true,
        allowedActTypes: ['oral', 'tease'],
        compatibleWith: ['male', 'female', 'neutral', 'nonbinary'],
        requiresActTypes: ['oral', 'tease'],
        recipientAnatomy: ['penis', 'vulva'],
        providerAnatomy: ['mouth', 'tongue'],
        setting: {
            location: "private chamber",
            furniture: "treatment bench",
            props: ["herbal steam", "clean linen"],
            context: "road-worn relief",
            atmosphere: "understanding, soothing"
        },
        description: "For road-weary travelers - the kind of comfort that can't be bought at an inn.",
        charismaBonus: {
            minCharisma: 14,
            effect: "enhanced_recovery",
            value: 3,
            description: "Your travel stories earn you especially dedicated service."
        }
    },
    
    // ========================================================================
    // TIER 3: INTERCOURSE - 150-200 gold
    // ========================================================================
    
    bath_intercourse_full: {
        id: 'bath_intercourse_full',
        name: "Complete Unburdening",
        tier: 'intercourse',
        cost: 150,
        baseTurns: 6,
        minTurns: 6,
        staminaRecovery: 15,
        cleanses: false,
        allowedActTypes: ['penetrate', 'continue', 'tease'],
        compatibleWith: ['male', 'female', 'neutral', 'nonbinary'],
        requiresActTypes: ['penetrate', 'continue', 'tease'],
        recipientAnatomy: ['vagina', 'anus'],
        providerAnatomy: ['penis'],
        orientationCompatible: true,
        setting: {
            location: "private chamber",
            furniture: "padded treatment bench",
            props: ["fresh linen", "warm oil"],
            context: "full service",
            atmosphere: "intimate, unburdening"
        },
        description: "Private chamber, clean linen, and understanding silence - the most primal relief.",
        charismaBonus: {
            minCharisma: 15,
            effect: "extended_service",
            value: 2,
            description: "Your charm has them eager to provide extra attention."
        }
    },
    
    bath_intercourse_evening: {
        id: 'bath_intercourse_evening',
        name: "Moonlit Respite",
        tier: 'intercourse',
        cost: 170,
        baseTurns: 7,
        minTurns: 7,
        staminaRecovery: 18,
        cleanses: false,
        allowedActTypes: ['penetrate', 'continue', 'tease'],
        compatibleWith: ['male', 'female', 'neutral', 'nonbinary'],
        requiresActTypes: ['penetrate', 'continue', 'tease'],
        recipientAnatomy: ['vagina', 'anus'],
        providerAnatomy: ['penis'],
        orientationCompatible: true,
        setting: {
            location: "private chamber",
            furniture: "padded bench",
            props: ["soft lamplight", "warm linen"],
            context: "evening service",
            atmosphere: "quiet, intimate"
        },
        description: "After hours, when the bathhouse is quiet - full, lingering attention.",
        charismaBonus: {
            minCharisma: 15,
            effect: "extended_service",
            value: 2,
            description: "The quiet atmosphere and your charm combine for extended pleasure."
        }
    },
    
    bath_intercourse_adventurer: {
        id: 'bath_intercourse_adventurer',
        name: "Adventurer's Respite",
        tier: 'intercourse',
        cost: 200,
        baseTurns: 8,
        minTurns: 8,
        staminaRecovery: 20,
        cleanses: true,
        allowedActTypes: ['penetrate', 'continue', 'tease'],
        compatibleWith: ['male', 'female', 'neutral', 'nonbinary'],
        requiresActTypes: ['penetrate', 'continue', 'tease'],
        recipientAnatomy: ['vagina', 'anus'],
        providerAnatomy: ['penis'],
        orientationCompatible: true,
        setting: {
            location: "private chamber",
            furniture: "luxurious treatment bench",
            props: ["herbal oils", "fresh linen", "steaming water"],
            context: "premium respite",
            atmosphere: "healing, thorough"
        },
        description: "For those carrying scars no healer can touch - relief that heals body and soul.",
        charismaBonus: {
            minCharisma: 15,
            effect: "extended_service",
            value: 3,
            description: "Your adventuring tales earn you the most dedicated service."
        }
    }
};

// ============================================================================
// NARRATION CONTEXT OVERRIDES
// ============================================================================

/**
 * Bathhouse-specific narration overrides
 * Applied to intimacy system narration to reflect bathhouse setting
 */
const BATHHOUSE_NARRATION_CONTEXT = {
    // Location/furniture replacements
    location: {
        'bed': 'treatment bench',
        'floor': 'padded floor',
        'chair': 'stool',
        'room': 'private chamber',
        'candlelight': 'lamplight',
        'mattress': 'padded bench',
        'sheets': 'clean linen'
    },
    
    // Activity/prop additions
    props: {
        oil: ['warm herbal oil', 'slick oil', 'fragrant oil'],
        linen: ['clean linen', 'fresh linen', 'soft linen'],
        water: ['warm water', 'steaming water', 'herbal steam']
    },
    
    // Activity context overrides
    context: {
        'fuck': 'service',
        'sex': 'treatment',
        'make love': 'provide relief',
        'love': 'attention',
        'passion': 'dedication',
        'ravish': 'attend to',
        'pound': 'work',
        'thrust': 'apply pressure'
    },
    
    // Bathhouse-specific descriptors
    descriptors: {
        'bedroom': 'treatment room',
        'lovers': 'attendant and client',
        'partner': 'practitioner',
        'darling': 'esteemed guest',
        'baby': 'valued patron'
    }
};

/**
 * Apply bathhouse context to narration text
 */
function applyBathhouseContext(text, serviceId) {
    if (!text) return text;
    
    const service = BATHHOUSE_SERVICES[serviceId];
    const setting = service ? service.setting : null;
    
    let result = text;
    
    // Apply location overrides
    for (const [original, replacement] of Object.entries(BATHHOUSE_NARRATION_CONTEXT.location)) {
        result = result.replace(new RegExp(`\\b${original}\\b`, 'gi'), replacement);
    }
    
    // Apply context overrides
    for (const [original, replacement] of Object.entries(BATHHOUSE_NARRATION_CONTEXT.context)) {
        result = result.replace(new RegExp(`\\b${original}\\b`, 'gi'), replacement);
    }
    
    // Apply descriptor overrides
    for (const [original, replacement] of Object.entries(BATHHOUSE_NARRATION_CONTEXT.descriptors)) {
        result = result.replace(new RegExp(`\\b${original}\\b`, 'gi'), replacement);
    }
    
    // Randomly insert bathhouse props
    if (setting && setting.props && setting.props.length > 0 && Math.random() < 0.3) {
        const prop = setting.props[Math.floor(Math.random() * setting.props.length)];
        // Insert before common prepositions
        result = result.replace(/(the |a |an |with |using |covered in )/gi, (match) => {
            return Math.random() < 0.4 ? `${match}${prop} ` : match;
        });
    }
    
    return result;
}

/**
 * Get bathhouse-specific introduction for encounter
 */
function getBathhouseEncounterIntro(npc, serviceId, isPlayerProvider) {
    const service = BATHHOUSE_SERVICES[serviceId];
    if (!service) return "";
    
    const provider = isPlayerProvider ? npc : npc;
    const client = isPlayerProvider ? npc : G.player;
    const providerName = provider.name || "the bathkeeper";
    const clientName = client.name || "you";
    
    // Check if this is a continuation
    if (typeof window !== 'undefined' && window.bathhouseServiceState && window.bathhouseServiceState.get(serviceId)) {
        return ""; // Already introduced
    }
    
    return `${providerName} leads ${clientName} to a ${service.setting.furniture} in the ${service.setting.location}. ` +
           `The ${service.setting.props.join(", ")} are ready, and the atmosphere is ${service.setting.atmosphere}.`;
}

// ============================================================================
// BATHHOUSE-SPECIFIC INTIMACY ENCOUNTER HANDLER
// ============================================================================

/**
 * Start a bathhouse-specific intimacy encounter
 * Maps touchType to serviceId and triggers the appropriate sequence
 */
function startBathhouseIntimacyEncounter(npc, player, touchType) {
    if (touchType !== "bathhouseService") {
        // Fall back to regular intimacy encounter
        if (typeof startIntimacyEncounter === "function") {
            return startIntimacyEncounter(npc, player);
        }
        return false;
    }
    
    // Determine which service to use based on NPC role
    // Default to manual service (massage) for attendants
    let serviceId = 'bath_manual_oil';
    
    if (npc.role === "BathhousePractitioner") {
        // Practitioners can provide full service
        serviceId = 'bath_intercourse_full';
    } else if (npc.role === "BathhouseAttendant") {
        // Attendants provide manual/massage service
        serviceId = 'bath_manual_oil';
    }
    
    // Call the regular start function with the service
    if (typeof startIntimacyEncounter === "function") {
        // Store the serviceId so the hooks can access it
        if (typeof window !== 'undefined') {
            window.bathhouseCurrentService = serviceId;
        }
        return startIntimacyEncounter(npc, player);
    }
    return false;
}

// Override the global startIntimacyEncounter for bathhouse services
if (typeof window !== 'undefined') {
    const originalStartIntimacyEncounter = window.startIntimacyEncounter;
    window.startBathhouseIntimacyEncounter = startBathhouseIntimacyEncounter;
    
    // Create a wrapper that checks for bathhouseService touchType
    window.startIntimacyEncounter = function(npc, player, positionId) {
        // Check if this is a bathhouse service call
        if (player === "bathhouseService") {
            return startBathhouseIntimacyEncounter(npc, G.player, "bathhouseService");
        }
        // Otherwise, use the original function
        return originalStartIntimacyEncounter && originalStartIntimacyEncounter(npc, player, positionId);
    };
}

// ============================================================================
// TURN TRACKING & CHARISMA SYSTEM
// ============================================================================

/**
 * Active bathhouse service tracking
 * Maps serviceKey -> { turnsRemaining, hasWarned, charismaBonusApplied, etc. }
 */
const activeBathhouseServices = new Map();

/**
 * Start tracking a bathhouse service
 * Returns serviceKey for later reference
 */
function startBathhouseServiceTracking(npc, serviceId, player, isPlayerProvider) {
    const service = BATHHOUSE_SERVICES[serviceId];
    if (!service) return null;
    
    const provider = isPlayerProvider ? player : npc;
    const client = isPlayerProvider ? npc : player;
    const serviceKey = `${provider.id || provider.name}:${client.id || client.name}:${serviceId}`;
    
    activeBathhouseServices.set(serviceKey, {
        npc: npc,
        player: player,
        serviceId: serviceId,
        isPlayerProvider: isPlayerProvider,
        baseTurns: service.baseTurns,
        minTurns: service.minTurns,
        turnsRemaining: service.baseTurns,
        hasWarned: false,
        charismaBonusApplied: false,
        costPaid: service.cost,
        staminaRecovery: service.staminaRecovery,
        cleanses: service.cleanses
    });
    
    return serviceKey;
}

/**
 * Stop tracking a bathhouse service
 */
function stopBathhouseServiceTracking(serviceKey) {
    activeBathhouseServices.delete(serviceKey);
}

/**
 * Get active service tracking
 */
function getBathhouseServiceTracking(serviceKey) {
    return activeBathhouseServices.get(serviceKey);
}

/**
 * Check and update turn tracking
 * Returns: { type, message } or null
 */
function checkBathhouseServiceTime(serviceKey) {
    const service = activeBathhouseServices.get(serviceKey);
    if (!service) return null;
    
    const serviceDef = BATHHOUSE_SERVICES[service.serviceId];
    if (!serviceDef) return null;
    
    service.turnsRemaining--;
    
    // Check for charisma bonus (only once per service, before warning)
    if (!service.charismaBonusApplied && service.turnsRemaining <= 5 && serviceDef.charismaBonus) {
        const charisma = (service.isPlayerProvider ? service.player : service.npc).stats?.charisma || 
                       (service.isPlayerProvider ? service.player : service.npc).charisma || 10;
        
        if (charisma >= serviceDef.charismaBonus.minCharisma) {
            service.turnsRemaining += serviceDef.charismaBonus.value;
            service.charismaBonusApplied = true;
            
            return {
                type: 'charisma_bonus',
                message: serviceDef.charismaBonus.description,
                extraTurns: serviceDef.charismaBonus.value
            };
        }
    }
    
    // Warn at 5 turns remaining
    if (service.turnsRemaining === 5 && !service.hasWarned) {
        service.hasWarned = true;
        return {
            type: 'time_warning',
            message: `The ${serviceDef.setting.furniture} creaks softly. Only 5 turns remain for the paid service - but the treatment will conclude satisfactorily.`,
            turnsRemaining: 5,
            serviceName: serviceDef.name
        };
    }
    
    // Service complete
    if (service.turnsRemaining <= 0) {
        stopBathhouseServiceTracking(serviceKey);
        return {
            type: 'service_complete',
            message: `The session concludes after the allotted time. The paid service has been fully rendered to satisfaction.`,
            staminaRecovery: service.staminaRecovery,
            cleanses: service.cleanses
        };
    }
    
    return null;
}

// ============================================================================
// PAYMENT FLOW (Unified - Bathhouse always takes 30%)
// ============================================================================

/**
 * Payment flow: Client -> Bathhouse -> Provider (70%)
 * Both NPC and Player as client follow same flow
 * Bathhouse always collects 30% cut
 */
function processBathhousePayment(client, provider, serviceId) {
    const service = BATHHOUSE_SERVICES[serviceId];
    if (!service) {
        return { success: false, message: "Service not found" };
    }
    
    const baseCost = service.cost;
    
    // Check if client can afford
    if ((client.coins || 0) < baseCost) {
        return { 
            success: false, 
            message: "Not enough gold for this service.",
            shortfall: baseCost - (client.coins || 0)
        };
    }
    
    // Deduct from client
    client.coins -= baseCost;
    
    const bathhouseCut = Math.round(baseCost * 0.3);
    const providerEarnings = baseCost - bathhouseCut;
    const tip = 0; // Tips handled separately
    
    // Pay provider
    provider.coins += providerEarnings;
    
    // Track provider income
    if (!provider.bathhouseProviderProfile) {
        provider.bathhouseProviderProfile = {
            totalEarnings: 0,
            dailyEarnings: 0,
            servicesProvided: 0,
            tipsReceived: 0,
            tipsGiven: 0
        };
    }
    provider.bathhouseProviderProfile.totalEarnings += providerEarnings;
    provider.bathhouseProviderProfile.dailyEarnings += providerEarnings;
    provider.bathhouseProviderProfile.servicesProvided++;
    
    // Client might tip provider (10-30% chance, more likely with high satisfaction)
    // Tips are separate from bathhouse cut - direct from client to provider
    const satisfaction = Math.random(); // 0-1, would be calculated from encounter if available
    const tipChance = 0.1 + (satisfaction * 0.2); // 10-30%
    
    if (Math.random() < tipChance) {
        const tipPercentage = 0.05 + (satisfaction * 0.15); // 5-20%
        const tipAmount = Math.round(baseCost * tipPercentage);
        
        if (client.coins >= tipAmount) {
            client.coins -= tipAmount;
            provider.coins += tipAmount;
            provider.bathhouseProviderProfile.tipsReceived += tipAmount;
            
            if (client.bathhouseProviderProfile) {
                client.bathhouseProviderProfile.tipsGiven += tipAmount;
            }
            
            return {
                success: true,
                baseCost: baseCost,
                bathhouseCut: bathhouseCut,
                providerEarnings: providerEarnings,
                tip: tipAmount,
                tipMessage: getTipMessage(client, provider, tipAmount)
            };
        }
    }
    
    return {
        success: true,
        baseCost: baseCost,
        bathhouseCut: bathhouseCut,
        providerEarnings: providerEarnings,
        tip: 0
    };
}

/**
 * Get tip message based on relationship
 */
function getTipMessage(client, provider, amount) {
    const clientName = client.name || "The client";
    const providerName = provider.name || "the provider";
    
    const messages = [
        `${clientName} slips an extra ${amount} gold to ${providerName} with a satisfied smile.`,
        `${clientName} presses a ${amount} gold tip into ${providerName}'s hand as thanks.`,
        `${clientName} adds a generous ${amount} gold tip for the excellent service.`,
        `${clientName} can't help but tip ${amount} gold - the service was that good.`
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Process tip from client to provider (separate from base payment)
 */
function processBathhouseTip(client, provider, amount) {
    if ((client.coins || 0) < amount) {
        return { success: false, message: "Not enough gold for that tip." };
    }
    
    client.coins -= amount;
    provider.coins += amount;
    
    if (!provider.bathhouseProviderProfile) {
        provider.bathhouseProviderProfile = {
            totalEarnings: 0,
            dailyEarnings: 0,
            servicesProvided: 0,
            tipsReceived: 0
        };
    }
    provider.bathhouseProviderProfile.tipsReceived += amount;
    
    if (!client.bathhouseProviderProfile) {
        client.bathhouseProviderProfile = {
            totalEarnings: 0,
            dailyEarnings: 0,
            servicesProvided: 0,
            tipsReceived: 0,
            tipsGiven: 0
        };
    }
    client.bathhouseProviderProfile.tipsGiven += amount;
    
    return { success: true, amount: amount };
}

// ============================================================================
// SERVICE UTILITY FUNCTIONS
// ============================================================================

/**
 * Get charisma modifier from character stats
 */
function getCharismaModifier(character) {
    if (!character) return 0;
    const cha = (character.stats && character.stats.CHA) || character.charisma || 10;
    return Math.floor((cha - 10) / 2);
}

/**
 * Check if NPC can provide anal penetration (as receiver)
 * Returns true if NPC is not smaller than player and not shy
 */
function canProvideAnal(npc, player) {
    if (!npc || !player) return false;
    
    // Get sizes - try anatomy.size first, then size, then default to medium
    const npcSize = getCharacterSize(npc);
    const playerSize = getCharacterSize(player);
    
    // Size hierarchy
    const sizeOrder = { tiny: 0, small: 1, medium: 2, large: 3, "very large": 4 };
    const npcSizeRank = sizeOrder[npcSize] || 2;
    const playerSizeRank = sizeOrder[playerSize] || 2;
    
    // Check if NPC is smaller than player
    const npcIsSmaller = npcSizeRank < playerSizeRank;
    
    // Check if NPC is shy
    const npcIsShy = npc.traits && npc.traits.includes("shy");
    
    // Can provide if not smaller AND not shy
    return !npcIsSmaller && !npcIsShy;
}

/**
 * Get the reason why anal is refused
 */
function getAnalRefusalReason(npc, player) {
    if (!npc || !player) return "Not available right now.";
    
    const npcSize = getCharacterSize(npc);
    const playerSize = getCharacterSize(player);
    
    const sizeOrder = { tiny: 0, small: 1, medium: 2, large: 3, "very large": 4 };
    const npcSizeRank = sizeOrder[npcSize] || 2;
    const playerSizeRank = sizeOrder[playerSize] || 2;
    
    const npcIsSmaller = npcSizeRank < playerSizeRank;
    const npcIsShy = npc.traits && npc.traits.includes("shy");
    
    if (npcIsSmaller) {
        return `"I need to be able to walk out of here," ${npc.name || "the attendant"} says with a knowing smile.`;
    }
    if (npcIsShy) {
        return `"I'm not comfortable with that," ${npc.name || "the attendant"} murmurs, looking away.`;
    }
    
    return `"Not today," ${npc.name || "the attendant"} says.`;
}

/**
 * Get character size from various possible fields
 */
function getCharacterSize(character) {
    if (!character) return "medium";
    
    // Try anatomy.size first
    if (character.anatomy && character.anatomy.size) {
        return String(character.anatomy.size).toLowerCase();
    }
    
    // Try size field
    if (character.size) {
        return String(character.size).toLowerCase();
    }
    
    // Try to use getPlayerSpeciesSize for players
    if (typeof getPlayerSpeciesSize === "function" && character.isPlayer) {
        return getPlayerSpeciesSize(character);
    }
    
    return "medium";
}

/**
 * Get service by ID
 */
function getBathhouseService(serviceId) {
    return BATHHOUSE_SERVICES[serviceId];
}

/**
 * Get all services
 */
function getAllBathhouseServices() {
    return Object.values(BATHHOUSE_SERVICES);
}

/**
 * Get services by tier
 */
function getServicesByTier(tier) {
    return Object.values(BATHHOUSE_SERVICES)
        .filter(s => s.tier === tier);
}

/**
 * Get services that NPC can provide
 */
function getNPCProvidedServices(npc) {
    if (!npc || !npc.bathhouse) return [];
    const providedTypes = npc.bathhouse.offeredServiceTypes || ['manual', 'oral', 'intercourse'];
    return Object.values(BATHHOUSE_SERVICES)
        .filter(s => providedTypes.includes(s.tier));
}

/**
 * Get services NPC desires
 */
function getNPCDesiredServices(npc) {
    if (!npc || !npc.bathhouse) return [];
    const desiredTypes = npc.bathhouse.preferredServiceTypes || ['manual', 'oral', 'intercourse'];
    return Object.values(BATHHOUSE_SERVICES)
        .filter(s => desiredTypes.includes(s.tier));
}

/**
 * Get affordable services for character
 */
function getAffordableServices(character) {
    if (!character) return [];
    const coins = character.coins || 0;
    return Object.values(BATHHOUSE_SERVICES)
        .filter(s => s.cost <= coins);
}

/**
 * Check if service is compatible with recipient's gender
 * Also checks orientation and anatomy compatibility for intercourse/oral services
 */
function isServiceCompatible(serviceId, recipient, provider) {
    const service = BATHHOUSE_SERVICES[serviceId];
    if (!service) return false;
    
    // Check gender compatibility
    if (service.compatibleWith) {
        const gender = String(recipient.gender || "male").toLowerCase();
        if (!service.compatibleWith.includes(gender)) {
            return { compatible: false, reason: "gender_incompatible" };
        }
    }
    
    // For manual services, gender is enough
    if (service.tier === 'manual') {
        return { compatible: true, reason: "manual_service" };
    }
    
    // For oral and intercourse, check anatomy and orientation
    if (service.tier === 'oral' || service.tier === 'intercourse') {
        const result = checkAnatomyCompatibility(service, recipient, provider);
        if (!result.compatible) {
            return result;
        }
    }
    
    return { compatible: true, reason: "full_compatibility" };
}

/**
 * Check anatomy compatibility for oral/intercourse services
 */
function checkAnatomyCompatibility(service, recipient, provider) {
    if (!service || !recipient) return { compatible: false, reason: "invalid_input" };
    
    // Manual services don't need anatomy check
    if (service.tier === 'manual') return { compatible: true, reason: "manual_service" };
    
    // Get recipient anatomy
    const recipientAnatomy = getRelevantAnatomy(recipient);
    const providerAnatomy = provider ? getRelevantAnatomy(provider) : null;
    
    // For oral services: provider needs mouth/tongue, recipient needs relevant anatomy
    if (service.tier === 'oral') {
        const requiredProvider = service.providerAnatomy || ['mouth', 'tongue'];
        const requiredRecipient = service.recipientAnatomy || ['penis', 'vulva'];
        
        // Check if provider has required anatomy
        if (providerAnatomy && !hasRequiredAnatomy(providerAnatomy, requiredProvider)) {
            return { compatible: false, reason: "provider_missing_anatomy" };
        }
        
        // Check if recipient has required anatomy
        if (!hasRequiredAnatomy(recipientAnatomy, requiredRecipient)) {
            return { compatible: false, reason: "recipient_missing_anatomy" };
        }
    }
    
    // For intercourse: check orientation and anatomy
    if (service.tier === 'intercourse') {
        // Check orientation compatibility
        if (service.orientationCompatible) {
            const orientationResult = checkOrientationCompatibility(recipient, provider);
            if (!orientationResult.compatible) {
                return orientationResult;
            }
        }
        
        const requiredProvider = service.providerAnatomy || ['penis'];
        const requiredRecipient = service.recipientAnatomy || ['vagina', 'anus'];
        
        // Check provider anatomy
        if (providerAnatomy && !hasRequiredAnatomy(providerAnatomy, requiredProvider)) {
            return { compatible: false, reason: "provider_missing_genitalia" };
        }
        
        // Check recipient anatomy
        if (!hasRequiredAnatomy(recipientAnatomy, requiredRecipient)) {
            return { compatible: false, reason: "recipient_missing_orifice" };
        }
    }
    
    return { compatible: true, reason: "anatomy_compatible" };
}

/**
 * Get relevant anatomy parts from character
 */
function getRelevantAnatomy(character) {
    if (!character) return {};
    
    const anatomy = {};
    
    // Check anatomy object
    if (character.anatomy && typeof character.anatomy === 'object') {
        if (character.anatomy.body) {
            anatomy.body = character.anatomy.body;
        }
        if (character.anatomy.genitalia) {
            anatomy.genitalia = character.anatomy.genitalia;
        }
        if (character.anatomy.breasts) {
            anatomy.breasts = character.anatomy.breasts;
        }
    }
    
    // Check for specific anatomy parts
    if (character.penis) anatomy.penis = true;
    if (character.vagina) anatomy.vagina = true;
    if (character.anus) anatomy.anus = true;
    if (character.vulva) anatomy.vulva = true;
    
    // Always assume mouth/tongue for humanoids
    if (character.isHumanoid === true) {
        anatomy.mouth = true;
        anatomy.tongue = true;
    }
    
    return anatomy;
}

/**
 * Check if character has required anatomy parts
 */
function hasRequiredAnatomy(characterAnatomy, requiredParts) {
    if (!characterAnatomy || !requiredParts || !requiredParts.length) return true;
    
    for (const part of requiredParts) {
        if (characterAnatomy[part]) {
            return true;
        }
    }
    
    return false;
}

/**
 * Check orientation compatibility
 */
function checkOrientationCompatibility(recipient, provider) {
    if (!recipient || !provider) return { compatible: true, reason: "no_orientation_data" };
    
    const recipientOrientation = String(recipient.memory && recipient.memory.orientation || "bi").toLowerCase();
    const providerOrientation = String(provider.memory && provider.memory.orientation || "bi").toLowerCase();
    const recipientGender = String(recipient.gender || "male").toLowerCase();
    const providerGender = String(provider.gender || "male").toLowerCase();
    
    // Check if recipient accepts provider's gender
    const recipientAccepts = checkGenderPreference(recipientOrientation, providerGender);
    if (!recipientAccepts) {
        return { compatible: false, reason: "recipient_orientation_mismatch" };
    }
    
    // Check if provider accepts recipient's gender
    const providerAccepts = checkGenderPreference(providerOrientation, recipientGender);
    if (!providerAccepts) {
        return { compatible: false, reason: "provider_orientation_mismatch" };
    }
    
    return { compatible: true, reason: "orientation_compatible" };
}

/**
 * Check if orientation includes gender preference
 */
function checkGenderPreference(orientation, gender) {
    if (!orientation || orientation === 'bi' || orientation === 'pan') return true;
    
    // Simplified orientation checking
    // This will be enhanced with more detailed logic
    const maleOrientations = ['straight', 'heterosexual', 'bi', 'pan'];
    const femaleOrientations = ['straight', 'heterosexual', 'bi', 'pan', 'lesbian', 'homosexual'];
    
    if (gender === 'male' || gender === 'masculine') {
        return maleOrientations.includes(orientation);
    }
    if (gender === 'female' || gender === 'feminine') {
        return femaleOrientations.includes(orientation);
    }
    
    // For non-binary, only pan/bi accept
    return ['bi', 'pan'].includes(orientation);
}

/**
 * Check if character can afford service
 */
function canAffordService(character, serviceId) {
    if (!character) return false;
    const service = BATHHOUSE_SERVICES[serviceId];
    if (!service) return false;
    return (character.coins || 0) >= service.cost;
}

/**
 * Enhanced compatibility check that considers all factors
 * Returns detailed compatibility information for narration
 */
function getServiceCompatibilityDetails(serviceId, recipient, provider) {
    const basicCheck = isServiceCompatible(serviceId, recipient, provider);
    
    if (!basicCheck.compatible) {
        return {
            compatible: false,
            reason: basicCheck.reason,
            tier: BATHHOUSE_SERVICES[serviceId] ? BATHHOUSE_SERVICES[serviceId].tier : 'unknown',
            narration: getIncompatibilityNarration(basicCheck.reason, recipient, provider)
        };
    }
    
    return {
        compatible: true,
        reason: basicCheck.reason,
        tier: BATHHOUSE_SERVICES[serviceId] ? BATHHOUSE_SERVICES[serviceId].tier : 'unknown',
        narration: ""
    };
}

/**
 * Get narration for incompatibility reasons
 */
function getIncompatibilityNarration(reason, recipient, provider) {
    if (!recipient) return "";
    
    const rName = recipient.name || (recipient.isPlayer ? "You" : "They");
    const pName = provider ? (provider.name || (provider.isPlayer ? "You" : "Them")) : "The provider";
    
    switch (reason) {
        case 'gender_incompatible':
            return rName + "'s gender is not compatible with this service.";
        case 'provider_missing_anatomy':
            return pName + " lacks the necessary anatomy to provide this service.";
        case 'recipient_missing_anatomy':
            return rName + " lacks the necessary anatomy to receive this service.";
        case 'provider_missing_genitalia':
            return pName + " lacks the necessary genitalia for this service.";
        case 'recipient_missing_orifice':
            return rName + " lacks the necessary orifices for this service.";
        case 'recipient_orientation_mismatch':
            return rName + "'s orientation doesn't include " + pName + "'s gender.";
        case 'provider_orientation_mismatch':
            return pName + "'s orientation doesn't include " + rName + "'s gender.";
        default:
            return "This service is not compatible.";
    }
}

// ============================================================================
// INTIMACY SYSTEM INTEGRATION HOOKS
// ============================================================================

/**
 * Generate setup sequence for bathhouse encounters
 * Attendant is always in charge, undresses player, folds clothes, guides to location
 */
function getBathhouseServiceIntro(npc, player, serviceId, wantsAnal) {
    const providerName = npc.name || "the attendant";
    const playerName = player.name || "you";
    const playerGender = String(player.gender || "").toLowerCase();
    const providerGender = String(npc.gender || "").toLowerCase();
    
    const service = BATHHOUSE_SERVICES[serviceId];
    if (!service) return "";
    
    // Common setup: undress, fold clothes, guide to location
    let intro = `${providerName} takes charge, efficiently undressing ${playerName} according to what ${playerGender === 'male' ? 'he' : playerGender === 'female' ? 'she' : 'they'} are wearing. `;
    intro += `Your clothes are neatly folded and placed near the door. `;
    intro += `${providerName} guides ${playerName} to the `;
    
    // Service-specific sequences
    if (service.tier === 'manual' || serviceId.includes('massage')) {
        // Massage service
        intro += `massage table. "Please lay face down," ${providerGender === 'female' ? 'she' : providerGender === 'male' ? 'he' : 'they'} instructs. `;
        intro += `You settle onto the padded surface as ${providerName} begins working on your shoulders with skilled hands, slowly moving down your neck, then your back. `;
        intro += `The tension melts away as ${providerGender === 'female' ? 'she' : providerGender === 'male' ? 'he' : 'they'} kneads and strokes, paying special attention to your buttocks before moving lower. `;
    }
    else if (service.tier === 'oral' || serviceId.includes('bath')) {
        // Bath service with oral
        intro += `large warm tub filled with soothing soap suds. ${providerName} helps ${playerName} settle into the warm water. `;
        intro += `${providerName} takes a sponge and begins washing ${playerName}, the warm water and soap creating a slippery, sensual experience. `;
        intro += `Without warning, ${providerName} steps into the tub, the water rising around ${providerGender === 'female' ? 'her' : providerGender === 'male' ? 'him' : 'them'}. `;
        intro += `Before ${playerName} can react, ${providerName} plunges underwater, taking ${playerGender === 'male' ? 'your cock' : playerGender === 'female' ? 'your pussy' : 'you'} into ${providerGender === 'female' ? 'her' : providerGender === 'male' ? 'his' : 'their'} mouth. `;
        intro += `${providerGender === 'female' ? 'She' : providerGender === 'male' ? 'He' : 'They'} works skillfully underwater, then surfaces for air while continuing to stroke ${playerName}. `;
        intro += `${providerName} repeats this, diving under and coming up, until ${playerName} finally cums. `;
    }
    else if (service.tier === 'intercourse' || serviceId.includes('intercourse') || serviceId.includes('full')) {
        // Full service with intercourse
        intro += `bath area. After a thorough sponge bath in the warm, soapy water, ${providerName} towels ${playerName} dry. `;
        intro += `${providerName} rubs warm massage oil all over ${playerName}'s body, the slick sensation heightening your anticipation. `;
        intro += `"Please lay on your back on the massage table," ${providerName} directs. `;
        
        // Check if player wants anal and if it's available
        const playerWantsAnal = wantsAnal === true;
        const canDoAnal = canProvideAnal(npc, player);
        const analCost = 30 - getCharismaModifier(player); // 30 gold modified by charisma
        
        // Determine position based on provider gender
        if (providerGender === 'male') {
            // Male attendant - player is face down, attendant penetrates from behind
            intro += `${playerName} lays on the table as instructed, but ${providerName} guides ${playerName} to roll onto ${playerGender === 'female' ? 'your stomach' : 'your front'}. `;
            intro += `${providerName} positions himself behind ${playerName} and `;
            intro += `${playerGender === 'female' ? 'penetrates you vaginally' : 'penetrates you anally'}, taking control as ${providerName} sets the pace. `;
        } else {
            // Female/non-binary attendant - rides the player
            intro += `As soon as ${playerName} lays back, ${providerName} climbs on top, straddling ${playerName}. `;
            intro += `${providerGender === 'female' ? 'She' : 'They'} guides ${playerGender === 'male' ? 'your cock' : playerGender === 'female' ? 'you' : 'you'} to ${providerGender === 'female' ? 'her' : 'their'} entrance and impales ${providerGender === 'female' ? 'herself' : 'themselves'} onto you, taking complete control. `;
            
            // If player shifts hips to transition to anal
            if (playerWantsAnal) {
                intro += `As ${providerGender === 'female' ? 'she' : 'they'} rides you, ${playerName} shifts ${playerGender === 'male' ? 'your' : playerGender === 'female' ? 'your' : 'their'} hips, and the angle brings ${playerGender === 'male' ? 'your cock' : 'the penetration'} near ${providerName}'s tight anus. `;
                
                if (canDoAnal) {
                    // Accept and prepare
                    intro += `${providerName} stops, ${providerGender === 'female' ? 'her' : 'their'} eyes widening slightly as ${providerGender === 'female' ? 'she' : 'they'} realizes your intent. `;
                    intro += `${providerGender === 'female' ? 'She' : 'They'} smiles knowingly. "For an additional ${analCost} gold, we can do that." `;
                    intro += `After the coins exchange hands, ${providerName} reaches for the warm oil and generously coats ${playerGender === 'male' ? 'your shaft and head' : 'the penetration'}, making it slick and hot. `;
                    intro += `${providerGender === 'female' ? 'She' : 'They'} shifts position and slowly lowers ${providerGender === 'female' ? 'herself' : 'themselves'} onto ${playerGender === 'male' ? 'your cock' : 'it'}, taking you anally with practiced control. `;
                } else {
                    // Refuse and continue vaginal
                    intro += `${providerName} freezes, ${providerGender === 'female' ? 'her' : 'their'} body tense. ${getAnalRefusalReason(npc, player)} `;
                    intro += `${providerGender === 'female' ? 'She' : 'They'} adjusts ${providerGender === 'female' ? 'her' : 'their'} position and continues riding you vaginally, maintaining control. `;
                }
            }
        }
    }
    
    intro += `The attendant remains in charge throughout, expertly controlling the experience. `;
    
    return intro;
}

/**
 * Hook to be called when intimacy encounter starts
 * Sets up bathhouse-specific tracking
 */
function onBathhouseEncounterStart(npc, player, serviceId, isPlayerProvider, wantsAnal) {
    // If serviceId is not provided, try to get it from the global bathhouse context
    if (!serviceId && typeof window !== 'undefined' && window.bathhouseCurrentService) {
        serviceId = window.bathhouseCurrentService;
        delete window.bathhouseCurrentService;
    }
    
    // Generate the service-specific intro sequence
    const intro = getBathhouseServiceIntro(npc, player, serviceId, wantsAnal);
    
    // Start turn tracking
    const serviceKey = startBathhouseServiceTracking(npc, serviceId, player, isPlayerProvider);
    
    // Process payment
    const client = isPlayerProvider ? npc : player;
    const provider = isPlayerProvider ? player : npc;
    
    // Check if anal option is requested and available
    let analCost = 0;
    let analPayment = null;
    if (wantsAnal && canProvideAnal(npc, player)) {
        analCost = 30 - getCharismaModifier(player);
        
        // Process anal surcharge
        if ((client.coins || 0) >= analCost) {
            client.coins -= analCost;
            provider.coins += analCost;
            analPayment = {
                success: true,
                amount: analCost,
                type: "anal_surcharge"
            };
        } else {
            return { success: false, message: `Not enough gold for the anal surcharge (${analCost} gold).` };
        }
    }
    
    const payment = processBathhousePayment(client, provider, serviceId);
    
    if (!payment.success) {
        // Refund anal surcharge if base payment failed
        if (analPayment && analPayment.success) {
            client.coins += analCost;
            provider.coins -= analCost;
        }
        return { success: false, message: payment.message };
    }
    
    // Store service key for later reference
    if (typeof window !== 'undefined') {
        window.bathhouseServiceState = window.bathhouseServiceState || new Map();
        window.bathhouseServiceState.set(serviceId, serviceKey);
    }
    
    // Return encounter configuration with intro narrative
    return {
        success: true,
        serviceKey: serviceKey,
        allowedActTypes: BATHHOUSE_SERVICES[serviceId].allowedActTypes,
        turns: BATHHOUSE_SERVICES[serviceId].baseTurns,
        staminaRecovery: BATHHOUSE_SERVICES[serviceId].staminaRecovery,
        cleanses: BATHHOUSE_SERVICES[serviceId].cleanses,
        payment: payment,
        analPayment: analPayment,
        analCost: analCost,
        intro: intro
    };
}

/**
 * Hook to be called on each intimacy turn
 * Checks for time warnings and charisma bonuses
 */
function onBathhouseEncounterTurn(serviceKey) {
    const result = checkBathhouseServiceTime(serviceKey);
    
    if (result) {
        switch (result.type) {
            case 'charisma_bonus':
                return {
                    type: 'info',
                    message: result.message,
                    extraTurns: result.extraTurns
                };
            case 'time_warning':
                return {
                    type: 'warning',
                    message: result.message
                };
            case 'service_complete':
                return {
                    type: 'complete',
                    message: result.message,
                    staminaRecovery: result.staminaRecovery,
                    cleanses: result.cleanses
                };
        }
    }
    
    return null;
}

/**
 * Hook to be called when intimacy encounter ends
 * Applies bathhouse-specific effects
 */
function onBathhouseEncounterEnd(serviceKey, encounter) {
    const service = getBathhouseServiceTracking(serviceKey);
    if (!service) return;
    
    // Stop tracking
    stopBathhouseServiceTracking(serviceKey);
    
    // Apply effects even if turns ran out
    const serviceDef = BATHHOUSE_SERVICES[service.serviceId];
    if (serviceDef) {
        const recipient = service.isPlayerProvider ? service.npc : service.player;
        
        // Apply stamina recovery
        if (serviceDef.staminaRecovery && recipient.stamina !== undefined) {
            recipient.stamina = Math.min(
                recipient.staminaMax || 100,
                (recipient.stamina || 0) + serviceDef.staminaRecovery
            );
        }
        
        // Apply cleansing
        if (serviceDef.cleanses && recipient.dirtiness !== undefined) {
            recipient.dirtiness = 0;
        }
        
        // Satisfy needs
        if (recipient.needsRelease !== undefined) {
            recipient.needsRelease = false;
        }
    }
}

/**
 * Apply bathhouse context to intimacy narration
 */
function applyBathhouseNarrationContext(text, serviceId) {
    // First apply bathhouse context overrides
    let result = applyBathhouseContext(text, serviceId);
    
    // Then apply any bathhouse-specific adjustments
    const service = BATHHOUSE_SERVICES[serviceId];
    if (service) {
        // Add bathhouse-specific descriptors
        if (service.setting && service.setting.atmosphere) {
            result = result.replace(/\b( mood| atmosphere)\b/gi, service.setting.atmosphere);
        }
    }
    
    return result;
}

// ============================================================================
// EXPORTS
// ============================================================================

if (typeof window !== 'undefined') {
    // Service definitions
    window.BATHHOUSE_SERVICES = BATHHOUSE_SERVICES;
    
    // Service utilities
    window.getBathhouseService = getBathhouseService;
    window.getAllBathhouseServices = getAllBathhouseServices;
    window.getServicesByTier = getServicesByTier;
    window.getNPCProvidedServices = getNPCProvidedServices;
    window.getNPCDesiredServices = getNPCDesiredServices;
    window.getAffordableServices = getAffordableServices;
    window.isServiceCompatible = isServiceCompatible;
    window.canAffordService = canAffordService;
    
    // Narration context
    window.BATHHOUSE_NARRATION_CONTEXT = BATHHOUSE_NARRATION_CONTEXT;
    window.applyBathhouseContext = applyBathhouseContext;
    window.getBathhouseEncounterIntro = getBathhouseEncounterIntro;
    window.applyBathhouseNarrationContext = applyBathhouseNarrationContext;
    
    // Turn tracking
    window.startBathhouseServiceTracking = startBathhouseServiceTracking;
    window.stopBathhouseServiceTracking = stopBathhouseServiceTracking;
    window.getBathhouseServiceTracking = getBathhouseServiceTracking;
    window.checkBathhouseServiceTime = checkBathhouseServiceTime;
    
    // Payment
    window.processBathhousePayment = processBathhousePayment;
    window.processBathhouseTip = processBathhouseTip;
    window.getTipMessage = getTipMessage;
    
    // Integration hooks
    window.onBathhouseEncounterStart = onBathhouseEncounterStart;
    window.onBathhouseEncounterTurn = onBathhouseEncounterTurn;
    window.onBathhouseEncounterEnd = onBathhouseEncounterEnd;
    
    // Anal service helpers
    window.getCharismaModifier = getCharismaModifier;
    window.canProvideAnal = canProvideAnal;
    window.getAnalRefusalReason = getAnalRefusalReason;
    window.getCharacterSize = getCharacterSize;
    
    // State
    window.bathhouseServiceState = window.bathhouseServiceState || new Map();
    
    // Bathhouse-specific encounter starter
    window.startBathhouseIntimacyEncounter = startBathhouseIntimacyEncounter;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BATHHOUSE_SERVICES,
        BATHHOUSE_NARRATION_CONTEXT,
        getBathhouseService,
        getAllBathhouseServices,
        getServicesByTier,
        getNPCProvidedServices,
        getNPCDesiredServices,
        getAffordableServices,
        isServiceCompatible,
        canAffordService,
        applyBathhouseContext,
        getBathhouseEncounterIntro,
        getBathhouseServiceIntro,
        applyBathhouseNarrationContext,
        startBathhouseServiceTracking,
        stopBathhouseServiceTracking,
        getBathhouseServiceTracking,
        checkBathhouseServiceTime,
        processBathhousePayment,
        processBathhouseTip,
        getTipMessage,
        startBathhouseIntimacyEncounter,
        onBathhouseEncounterStart,
        onBathhouseEncounterTurn,
        onBathhouseEncounterEnd,
        getCharismaModifier,
        canProvideAnal,
        getAnalRefusalReason,
        getCharacterSize
    };
}
