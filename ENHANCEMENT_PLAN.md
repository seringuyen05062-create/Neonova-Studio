# VRM-AI-AVATAR EXPANSION PLAN

## Current State:
- ✅ VRM Avatar with Chat AI, TTS, Lip Sync
- ✅ VRM Animation System (VRMA files)  
- ✅ Mode switching (VRM/GLB)
- ✅ Settings panel

## Proposed Enhancement:
**Add Pet Companion System to existing VRM Avatar**

### New Architecture:
```
/components/three/
  ├── Scene.tsx              // Enhanced: VRM + Pet in same scene
  ├── VRMAvatarSystem.tsx    // Current VRM system (rename from Scene.tsx)
  ├── PetCompanion.tsx       // NEW: Pet GLB with AI behaviors  
  └── usePetWander.ts        // NEW: Pet movement AI

/components/ui/  
  ├── PetPanel.tsx           // NEW: Pet controls in settings
  └── ControlPanel.tsx       // Enhanced: Add pet tab

/store/
  └── petStore.ts            // NEW: Pet state management
```

### Enhanced Features:
1. **VRM Avatar**: Keep all existing features (Chat AI, TTS, Lip Sync, Dance)
2. **Pet Companion**: 
   - Load GLB pets in same scene as VRM
   - AI wander behavior (avoid VRM, random movement)
   - Idle/Walk animations
   - Independent mixer
3. **Interaction**: Pet reacts to VRM animations/voice
4. **UI**: New pet tab in settings panel

### Implementation Strategy:
- Phase 1: Add Pet system alongside existing VRM
- Phase 2: Add Pet-Avatar interactions  
- Phase 3: Pet responds to chat context (happy/sad reactions)

This keeps all current functionality while adding the pet companion feature.