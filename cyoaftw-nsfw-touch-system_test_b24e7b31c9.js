// === cyoaftw-nsfw-touch-system.js ===
// NPC Physical Touch Reaction System
// Handles NPC reactions to physical touch/grab/grope actions outside of intimacy scenes.
// Reactions are context-aware based on relationship, temperament, location, etc.

(function() {
  'use strict';

  console.log("[NSFW Touch System] Loading...");

  // Helper to check if location is private
  function isPrivateLocationFunc(room) {
    if (!room) return false;
    const privateTypes = ["Guest Room", "Inn", "Bedroom", "Chamber", "Private Chamber", "Vault", "Bath", "Bathroom"];
    const roomType = room.type || room.displayName || "";
    return privateTypes.some(t => roomType.includes(t)) ||
           /bedroom|chamber|private|inn|vault|bath/i.test(roomType.toLowerCase());
  }

  // Get receptivity score for a touch action (0-100 scale)
  function calculateTouchReceptivity(npc, touchType, ctx) {
    if (!npc || !touchType) return 0;
    
    // Ensure relationship state exists
    if (typeof window.ensureNPCRelationshipState === "function") {
      window.ensureNPCRelationshipState(npc);
    } else {
      npc.memory = npc.memory || {};
      if (typeof npc.memory.lust !== "number") npc.memory.lust = 0;
      if (typeof npc.memory.attraction !== "number") npc.memory.attraction = 0;
      if (typeof npc.memory.arousal !== "number") npc.memory.arousal = 0;
      if (typeof npc.memory.disinhibition !== "number") npc.memory.disinhibition = 0;
      if (typeof npc.memory.hostility !== "number") npc.memory.hostility = 0;
      if (typeof npc.memory.favorability !== "number") npc.memory.favorability = 0;
      if (typeof npc.memory.mood !== "number") npc.memory.mood = 0;
      if (!npc.memory.orientation) npc.memory.orientation = "bi";
    }
    
    const memory = npc.memory || {};
    const room = ctx && ctx.room;
    let score = 0;
    
    // Base receptivity from relationship stats
    score += (memory.attraction || 0) * 0.8;
    score += (memory.lust || 0) * 0.6;
    score += (memory.favorability || memory.favor || 0) * 0.4;
    score += (memory.mood || 0) * 0.3;
    score += (memory.disinhibition || 0) * 0.5;
    score -= (memory.hostility || 0) * 1.2;
    score += (memory.arousal || 0) * 0.4;
    
    // Temperament modifiers
    const temperament = String(npc.temperament || "neutral").toLowerCase();
    if (temperament === "bold" || temperament === "forward" || temperament === "lustful") score += 20;
    if (temperament === "shy" || temperament === "cautious" || temperament === "wary") {
      score -= 15;
      if (touchType === "bold") score -= 20;
    }
    if (temperament === "aggressive" || temperament === "hostile") score -= 25;
    
    // Touch type modifiers
    switch (touchType) {
      case "gentle": score += 10; break;
      case "firm": score += 0; break;
      case "affectionate": score += 15; break;
      case "bold": score -= 10; break;
    }
    
    // Location modifiers
    if (room) {
      if (isPrivateLocationFunc(room)) score += 25;
      else {
        const isPublic = !room.type || !room.type.match(/bedroom|guest room|inn|private|chamber/i);
        if (isPublic) {
          score -= 15;
          if (touchType === "bold" || touchType === "firm") score -= 20;
        }
      }
      if (room.creatures) {
        const others = room.creatures.filter(c => c && !c.isPlayer && c !== npc && (c.isHumanoid || c.humanoid));
        if (others.length > 0) {
          score -= 25;
          if (touchType === "bold") score -= 30;
        } else {
          score += 10;
        }
      }
    }
    
    // Player charisma modifier
    let charismaMod = 1.0;
    if (typeof window.getPlayerCharismaModifier === "function") {
      charismaMod = window.getPlayerCharismaModifier();
    } else {
      const player = window.G && window.G.player;
      if (player && player.stats) {
        const charisma = player.stats.charisma || 3;
        charismaMod = 0.8 + (charisma * 0.02);
      }
    }
    score += (charismaMod - 1.0) * 30;
    
    // Environmental modifier
    let envMod = 1.0;
    if (typeof window.getEnvironmentalModifier === "function") {
      envMod = window.getEnvironmentalModifier(room);
    }
    score *= envMod;
    
    // Clamp to 0-100 range
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // Determine reaction category based on receptivity score
  function getTouchReactionCategory(receptivity) {
    if (receptivity >= 80) return "eager";
    if (receptivity >= 50) return "welcoming";
    if (receptivity >= 20) return "receptive";
    if (receptivity >= 0) return "neutral";
    if (receptivity >= -20) return "uncomfortable";
    if (receptivity >= -50) return "angry";
    return "furious";
  }

  // Generate NPC reaction text based on context
  function generateTouchReactionText(npc, touchType, reactionCategory, ctx) {
    if (!npc) return "";
    
    const npcName = npc.name || (npc.firstName && npc.lastName ? npc.firstName + " " + npc.lastName : "they");
    const isMale = npc.gender === "male";
    const isFemale = npc.gender === "female";
    const temperament = String(npc.temperament || "neutral").toLowerCase();
    
    // Location context
    const room = ctx && ctx.room;
    const isPrivate = room && isPrivateLocationFunc(room);
    const hasOthers = room && room.creatures && room.creatures.some(c => c && !c.isPlayer && c !== npc && (c.isHumanoid || c.humanoid));
    
    // Build reaction based on category and context
    let reaction = "";
    let actionText = "";
    let flavorText = "";
    
    switch (reactionCategory) {
      case "eager":
        if (touchType === "gentle") reaction = npcName + " leans into your touch, a soft smile playing on their lips.";
        else if (touchType === "firm") reaction = npcName + " responds eagerly, pressing closer against you.";
        else if (touchType === "affectionate") reaction = npcName + " wraps their arms around you in return, pulling you close.";
        else if (touchType === "bold") reaction = npcName + " gasps softly, their body responding to your bold touch with eager heat.";
        actionText = "They clearly welcome your advances.";
        break;
      case "welcoming":
        if (touchType === "gentle") reaction = npcName + " accepts your touch with a warm expression.";
        else if (touchType === "firm") reaction = npcName + " lets out a soft sound, not pulling away from your grasp.";
        else if (touchType === "affectionate") reaction = npcName + " hugs you back, a pleased look in their eyes.";
        else if (touchType === "bold") reaction = npcName + " blushes but doesn't protest, their breathing quickening.";
        actionText = "They seem comfortable with your attention.";
        break;
      case "receptive":
        if (touchType === "gentle") reaction = npcName + " doesn't pull away, though their expression is cautious.";
        else if (touchType === "firm") reaction = npcName + " tenses slightly but allows your grip.";
        else if (touchType === "affectionate") reaction = npcName + " accepts the hug, if a bit stiffly.";
        else if (touchType === "bold") reaction = npcName + " shifts uncomfortably but doesn't push you away.";
        actionText = "They tolerate your touch, if not enthusiastically.";
        break;
      case "neutral":
        if (touchType === "gentle") reaction = npcName + " acknowledges your touch with a neutral expression.";
        else if (touchType === "firm") reaction = npcName + " raises an eyebrow at your boldness but doesn't resist.";
        else if (touchType === "affectionate") reaction = npcName + " returns a brief, polite hug.";
        else if (touchType === "bold") reaction = npcName + " freezes for a moment, uncertain how to respond.";
        actionText = "They seem indifferent to your advance.";
        break;
      case "uncomfortable":
        if (touchType === "gentle") reaction = npcName + " flinches slightly at your touch.";
        else if (touchType === "firm") reaction = npcName + " stiffens in your grasp, clearly uncomfortable.";
        else if (touchType === "affectionate") reaction = npcName + " pats your back awkwardly, not quite reciprocating the hug.";
        else if (touchType === "bold") reaction = npcName + " steps back, their face flushing with embarrassment.";
        actionText = "They don't appreciate your advance.";
        break;
      case "angry":
        if (touchType === "gentle") reaction = npcName + " glares at you, their expression cold.";
        else if (touchType === "firm") reaction = npcName + " tries to pull away, their voice sharp: \"Unhand me!\"";
        else if (touchType === "affectionate") reaction = npcName + " pushes you away, looking offended.";
        else if (touchType === "bold") reaction = npcName + " slaps your hand away, their face dark with anger.";
        actionText = "They are angered by your familiarity.";
        break;
      case "furious":
        if (touchType === "gentle") reaction = npcName + " looks at you with pure disgust.";
        else if (touchType === "firm") reaction = npcName + " wrenches free of your grasp, looking ready to strike you.";
        else if (touchType === "affectionate") reaction = npcName + " shoves you back forcefully.";
        else if (touchType === "bold") reaction = npcName + " looks like they want to hurt you for that.";
        actionText = "They are furious at your presumption.";
        break;
    }
    
    // Add public/private context flavor
    if (hasOthers && (reactionCategory === "uncomfortable" || reactionCategory === "angry" || reactionCategory === "furious")) {
      flavorText = " Their embarrassment is only heightened by the presence of others.";
    } else if (isPrivate && (reactionCategory === "eager" || reactionCategory === "welcoming")) {
      flavorText = " In the privacy of the moment, they seem to relax into your touch.";
    }
    
    // Add temperament-specific flavor
    if (temperament === "shy" && reactionCategory !== "furious") {
      flavorText += " The shy " + (isMale ? "man" : isFemale ? "woman" : "person") + " looks away, clearly flustered.";
    } else if ((temperament === "bold" || temperament === "forward") && reactionCategory === "eager") {
      flavorText += " They return your touch with bold confidence.";
    }
    
    // Combine all parts
    let fullReaction = reaction;
    if (actionText) fullReaction += " " + actionText;
    if (flavorText) fullReaction += flavorText;
    
    return fullReaction;
  }

  // Handle physical touch action and generate NPC reaction
  function handlePhysicalTouch(npc, touchType, ctx) {
    if (!npc || !touchType) {
      console.log("[NSFW Touch] Invalid parameters:", { npc: npc, touchType: touchType });
      return { success: false, message: "Invalid touch action." };
    }
    
    // Ensure relationship state exists
    if (typeof window.ensureNPCRelationshipState === "function") {
      window.ensureNPCRelationshipState(npc);
    } else {
      npc.memory = npc.memory || {};
    }
    
    const npcName = npc.name || (npc.firstName && npc.lastName ? npc.firstName + " " + npc.lastName : "they");
    const memory = npc.memory || {};
    
    // Block if NPC is not receptive at all
    if (!npc.romanceEligible || !npc.isHumanoid) {
      return { 
        success: false, 
        message: npcName + " is not someone you can touch that way.",
        hostilityImpact: 5
      };
    }
    
    // Check hostility
    if ((memory.hostility || 0) >= 70) {
      return { 
        success: false, 
        message: npcName + " looks at you like they want to kill you. Touching them now would be a very bad idea.",
        hostilityImpact: 0
      };
    }
    
    // Calculate receptivity
    const receptivity = calculateTouchReceptivity(npc, touchType, ctx);
    const reactionCategory = getTouchReactionCategory(receptivity);
    
    console.log("[NSFW Touch] Receptivity:", {
      npc: npcName,
      touchType: touchType,
      receptivity: receptivity,
      category: reactionCategory,
      attraction: memory.attraction,
      lust: memory.lust,
      hostility: memory.hostility,
      favor: memory.favorability || memory.favor
    });
    
    // Generate reaction text
    const reactionText = generateTouchReactionText(npc, touchType, reactionCategory, ctx);
    
    // Determine stat impacts based on reaction
    let impacts = { lust: 0, attraction: 0, hostility: 0, favor: 0, mood: 0 };
    
    switch (reactionCategory) {
      case "eager": impacts = { lust: 5, attraction: 3, favor: 2, mood: 3 }; break;
      case "welcoming": impacts = { lust: 3, attraction: 2, favor: 1, mood: 2 }; break;
      case "receptive": impacts = { lust: 1, attraction: 1, mood: 1 }; break;
      case "neutral": impacts = { attraction: -1 }; break;
      case "uncomfortable": impacts = { hostility: 2, attraction: -2, mood: -2 }; break;
      case "angry": impacts = { hostility: 5, attraction: -3, favor: -2, mood: -3 }; break;
      case "furious": impacts = { hostility: 10, attraction: -5, favor: -4, mood: -5 }; break;
    }
    
    // Bold touches have stronger impacts (positive or negative)
    if (touchType === "bold") {
      impacts.lust = Math.round(impacts.lust * 1.5);
      impacts.attraction = Math.round(impacts.attraction * 1.5);
      impacts.hostility = Math.round(impacts.hostility * 1.5);
    }
    
    // Apply impacts using existing functions
    if (typeof window.applyLustImpact === "function" && impacts.lust !== 0) {
      window.applyLustImpact(npc, impacts.lust);
    }
    if (typeof window.applyAttractionImpact === "function" && impacts.attraction !== 0) {
      window.applyAttractionImpact(npc, impacts.attraction);
    }
    if (impacts.hostility !== 0) {
      npc.memory.hostility = Math.max(0, Math.min(100, (npc.memory.hostility || 0) + impacts.hostility));
    }
    if (impacts.favor !== 0) {
      npc.memory.favorability = Math.max(0, Math.min(100, (npc.memory.favorability || npc.memory.favor || 0) + impacts.favor));
    }
    if (impacts.mood !== 0) {
      npc.memory.mood = Math.max(-100, Math.min(100, (npc.memory.mood || 0) + impacts.mood));
    }
    
    return {
      success: true,
      message: reactionText,
      receptivity: receptivity,
      reactionCategory: reactionCategory,
      impacts: impacts
    };
  }

  // Expose to window
  window.handlePhysicalTouch = handlePhysicalTouch;
  window.calculateTouchReceptivity = calculateTouchReceptivity;
  window.getTouchReactionCategory = getTouchReactionCategory;
  window.generateTouchReactionText = generateTouchReactionText;
  window.isPrivateLocationFunc = isPrivateLocationFunc;
  
  console.log("[NSFW Touch System] Loaded successfully");
})();
