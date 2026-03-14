---
title: Map Rotation
---

# Enemy Territory Map & Campaign Rotation Guide

## Overview

Map rotations automate server cycling through a sequence of maps/campaigns. They use **string variables** (cvars) to chain commands together, creating a continuous loop that transitions to the next map when the current round ends.

---

## String Variables (String Library)

### What Are String Variables?

String variables are custom names you assign to a sequence of commands. The game engine stores them in memory and executes all associated commands when you invoke the variable name.

**Syntax:**
```
set <variable_name> "<command1> ; <command2> ; <command3>"
```

When you call `vstr <variable_name>`, the engine executes all commands in that string.

**Basic Example:**
```
set quickstart "g_gametype 2 ; map fueldump"
vstr quickstart
```
This stores a named command that sets gametype to 2 and loads fueldump map.

### Why Use String Variables for Rotations?

String variables enable **automatic map cycling** by:
1. Setting the current map/gametype
2. Storing the **next map** in the `nextmap` or `nextcampaign` variable
3. When the round ends, the engine automatically executes `nextmap`
4. This loads the next map in the rotation sequence
5. Each new map sets its own `nextmap`, creating a continuous loop

---

## Objective Mode Rotation

### Understanding the Example

```
set d1 "set g_gametype 2 ; map sw_oasis_b3 ; set nextmap vstr d2"
set d2 "set g_gametype 2 ; map mlb_daybreak ; set nextmap vstr d3"
set d3 "set g_gametype 2 ; map supplydepot2 ; set nextmap vstr d4"
set d4 "set g_gametype 2 ; map mlb_temple; set nextmap vstr d5"
set d5 "set g_gametype 2 ; map baserace; set nextmap vstr d6"
set d6 "set g_gametype 2 ; map et_mor2_night_final; set nextmap vstr d7"
set d7 "set g_gametype 2 ; map venice_ne4; set nextmap vstr d8"
set d8 "set g_gametype 2 ; map fueldump; set nextmap vstr d9"
set d9 "set g_gametype 2 ; map UJE_00 ; set nextmap vstr d10"
set d10 "set g_gametype 2 ; map goldrush ; set nextmap vstr d1"
vstr d1
```

### Breakdown

- **d1, d2, d3...** = String variable names (can be any name, but `d1`, `d2` is standard for "day")
- **g_gametype 2** = Objective mode (see gametype reference in server_cvars.md)
- **map mapname** = Load the specified map
- **set nextmap vstr d2** = When this round ends, automatically execute string `d2`
- **vstr d1** = Start the rotation with the first map

### Execution Flow

1. `vstr d1` executes:
   - Sets gametype to 2 (Objective)
   - Loads sw_oasis_b3
   - Sets nextmap to `vstr d2`

2. When sw_oasis_b3 round ends, nextmap triggers `vstr d2`:
   - Sets gametype to 2
   - Loads mlb_daybreak
   - Sets nextmap to `vstr d3`

3. Process repeats through d3, d4, d5... d10

4. When d10 (goldrush) round ends:
   - nextmap is set to `vstr d1`
   - Rotation loops back to beginning

### Maps in This Rotation (10 maps)
1. sw_oasis_b3
2. mlb_daybreak
3. supplydepot2
4. mlb_temple
5. baserace
6. et_mor2_night_final
7. venice_ne4
8. fueldump
9. UJE_00
10. goldrush

---

## Stopwatch Mode Rotation

### Understanding Stopwatch Rotations

Stopwatch mode requires **two rounds per map** (one for each team):
- **r1 = First round** (initial map load with gametype change)
- **r2 = Second round** (map restart, keeps same teams but switches sides)

### Example Stopwatch Rotation

```
// WATCHDOG
set com_watchdog_cmd "vstr m1r1 ; say watchdog found no map running - restarted mapcycle"

// MAPS
set m1r1 "g_gametype 3; map oasis; set nextmap vstr m1r2"
set m1r2 "map_restart 0; set nextmap vstr m2r1"

set m2r1 "g_gametype 3; map goldrush; set nextmap vstr m2r2"
set m2r2 "map_restart 0; set nextmap vstr m3r1"

set m3r1 "g_gametype 3; map radar; set nextmap vstr m3r2"
set m3r2 "map_restart 0; set nextmap vstr m4r1"

set m4r1 "g_gametype 3; map railgun; set nextmap vstr m4r2"
set m4r2 "map_restart 0; set nextmap vstr m5r1"

set m5r1 "g_gametype 3; map supplydepot; set nextmap vstr m5r2"
set m5r2 "map_restart 0; set nextmap vstr m6r1"

set m6r1 "g_gametype 3; map caen; set nextmap vstr m6r2"
set m6r2 "map_restart 0; set nextmap vstr m1r1"

vstr m1r1
```

### Breakdown

- **m1r1, m1r2, m2r1, m2r2...** = String format: `m<map_number>r<round_number>`
  - `m1r1` = Map 1, Round 1
  - `m1r2` = Map 1, Round 2
  - `m2r1` = Map 2, Round 1
  - etc.

- **R1 (first round):** Contains `g_gametype 3; map <mapname>`
- **R2 (second round):** Contains `map_restart 0` (keeps same map, restarts)

### Watchdog Mechanism

```
set com_watchdog_cmd "vstr m1r1 ; say watchdog found no map running - restarted mapcycle"
```

- **Purpose:** If the map rotation breaks/crashes, automatically restart it
- **Action:** Restarts from m1r1 and announces to players
- **com_watchdog** = Built-in server mechanism that monitors map cycling

### Execution Flow for Stopwatch

1. `vstr m1r1` loads Oasis with gametype 3, sets nextmap to `m1r2`
2. Round completes, `vstr m1r2` restarts Oasis (teams swap sides), sets nextmap to `m2r1`
3. Both rounds of Oasis done, `vstr m2r1` loads Goldrush, sets nextmap to `m2r2`
4. Round completes, `vstr m2r2` restarts Goldrush, sets nextmap to `m3r1`
5. Pattern continues through all maps
6. After caen round 2 (`m6r2`), rotation loops back to `m1r1` (Oasis)

### Maps in This Rotation (6 maps × 2 rounds = 12 total rounds)
1. Oasis (r1 + r2)
2. Goldrush (r1 + r2)
3. Radar (r1 + r2)
4. Railgun (r1 + r2)
5. Supplydepot (r1 + r2)
6. Caen (r1 + r2)

---

## Campaign Rotation

### Understanding Campaign Mode

Campaign mode (g_gametype 4) automatically cycles through multiple maps within a campaign. However, to rotate **between different campaigns**, you need string variables.

### Campaign Rotation Example

```
// CAMPAIGN ROTATION - official campaigns
// WATCHDOG
set com_watchdog_cmd "vstr d_initial ; say watchdog found no map running - restarted mapcycle"

// CAMPAIGNS
set d1 "campaign cmpgn_northafrica ; set nextcampaign vstr d2"
set d2 "campaign cmpgn_centraleurope ; set nextcampaign vstr d1"
set d_initial "set g_gametype 4 ; map oasis ; set nextcampaign vstr d2"

vstr d_initial
// END CAMPAIGN ROTATION
```

### Breakdown

- **campaign campaign_name** = Load a campaign file
- **g_gametype 4** = Campaign mode
- **nextcampaign** = Campaign-specific version of nextmap
  - Used instead of `nextmap` for campaign rotations
  - Triggers when current campaign completes
- **d_initial** = Special startup variable
  - Ensures correct map is loaded first
  - Must match the first map of the first campaign

### Key Differences from Map Rotations

| Aspect | Map Rotation | Campaign Rotation |
|--------|--------------|-------------------|
| Next variable | `set nextmap` | `set nextcampaign` |
| Load command | `map <mapname>` | `campaign <campaign_name>` |
| Gametype | 2 (Objective) or 3 (Stopwatch) | 4 (Campaign) |
| Multiple maps | Set individually | Automatic (defined in campaign file) |

### Critical Details

**Why must d_initial load Oasis?**

The first campaign (cmpgn_northafrica) starts with Oasis as its first map. The `d_initial` line must explicitly load the same map because:
1. The `campaign` command doesn't load the first map immediately
2. An explicit `map` command is needed to bootstrap the rotation
3. d_initial sets `nextcampaign vstr d2` (which loads centraleurope when northafrica completes)

**Campaign File Example:**
```
cmpgn_northafrica {
  maps: oasis, gplaya, base
}
cmpgn_centraleurope {
  maps: goldrush, railgun, radar
}
```

When cmpgn_northafrica completes (after all 3 maps), `nextcampaign vstr d2` triggers, loading cmpgn_centraleurope.

### Execution Flow for Campaign Rotation

1. `vstr d_initial` executes:
   - Sets gametype to 4 (Campaign)
   - Loads Oasis map
   - Sets nextcampaign to `vstr d2`

2. Campaign cmpgn_northafrica progresses through its maps (Oasis → Gplaya → Base)

3. When northafrica campaign completes, `vstr d2` executes:
   - Loads campaign cmpgn_centraleurope
   - Sets nextcampaign to `vstr d1`

4. Campaign cmpgn_centraleurope progresses through its maps (Goldrush → Railgun → Radar)

5. When centraleurope completes, `vstr d1` executes:
   - Loads campaign cmpgn_northafrica again
   - Sets nextcampaign to `vstr d2`

6. Rotation loops indefinitely

---

## Creating Custom Rotations

### Step 1: Choose Your Format

**For Objective/TDM/FFA (single round per map):**
```
set d1 "set g_gametype <type> ; map <map1> ; set nextmap vstr d2"
set d2 "set g_gametype <type> ; map <map2> ; set nextmap vstr d3"
set d3 "set g_gametype <type> ; map <map1> ; set nextmap vstr d1"
vstr d1
```

**For Stopwatch (two rounds per map):**
```
set m1r1 "set g_gametype 3 ; map <map1> ; set nextmap vstr m1r2"
set m1r2 "map_restart 0 ; set nextmap vstr m2r1"
set m2r1 "set g_gametype 3 ; map <map2> ; set nextmap vstr m2r2"
set m2r2 "map_restart 0 ; set nextmap vstr m1r1"
vstr m1r1
```

**For Campaign:**
```
set d_initial "set g_gametype 4 ; map <first_map> ; set nextcampaign vstr d2"
set d1 "campaign <campaign1> ; set nextcampaign vstr d2"
set d2 "campaign <campaign2> ; set nextcampaign vstr d1"
vstr d_initial
```

### Step 2: List Your Maps

Write down the maps/campaigns you want in order:

**Example for Objective (10 maps):**
```
1. mp_beach
2. sw_goldrush_final
3. supplydepot2
4. fueldump
5. radar
6. tc_base
7. oasis
8. railgun
9. caen
10. mp_ice
```

### Step 3: Assign Gametype

Find the gametype number:
- 0 = FFA
- 1 = Tournament
- 2 = Team Deathmatch
- 3 = Stopwatch
- 4 = Campaign
- 5 = Last Man Standing (LMS)
- 6 = Map Vote

### Step 4: Build the Rotation String

**Example: 5-map Objective rotation**

```
// 5-MAP OBJECTIVE ROTATION
set d1 "set g_gametype 2 ; map mp_beach ; set nextmap vstr d2"
set d2 "set g_gametype 2 ; map sw_goldrush_final ; set nextmap vstr d3"
set d3 "set g_gametype 2 ; map supplydepot2 ; set nextmap vstr d4"
set d4 "set g_gametype 2 ; map fueldump ; set nextmap vstr d5"
set d5 "set g_gametype 2 ; map radar ; set nextmap vstr d1"
vstr d1
```

### Step 5: Add Watchdog (Optional but Recommended)

```
set com_watchdog_cmd "vstr d1 ; say watchdog found no map running - restarted mapcycle"
```

Place this at the top of your rotation.

### Step 6: Test

```
// Start the rotation
vstr d1

// Check current map and gametype
status
```

---

## Advanced Rotation Examples

### Mixed-Mode Rotation (Cycle Through Game Types)

Rotate through different game modes on the same map:

```
// MIXED MODE ROTATION - Objective then Stopwatch
set m1_obj "set g_gametype 2 ; map oasis ; set nextmap vstr m1_sw"
set m1_sw "map_restart 0 ; set nextmap vstr m2_obj"
set m2_obj "set g_gametype 2 ; map goldrush ; set nextmap vstr m2_sw"
set m2_sw "map_restart 0 ; set nextmap vstr m1_obj"
vstr m1_obj
```

### Large Objective Rotation (20 Maps)

```
set com_watchdog_cmd "vstr d1 ; say watchdog restart"
set d1 "set g_gametype 2 ; map map1 ; set nextmap vstr d2"
set d2 "set g_gametype 2 ; map map2 ; set nextmap vstr d3"
set d3 "set g_gametype 2 ; map map3 ; set nextmap vstr d4"
set d4 "set g_gametype 2 ; map map4 ; set nextmap vstr d5"
set d5 "set g_gametype 2 ; map map5 ; set nextmap vstr d6"
set d6 "set g_gametype 2 ; map map6 ; set nextmap vstr d7"
set d7 "set g_gametype 2 ; map map7 ; set nextmap vstr d8"
set d8 "set g_gametype 2 ; map map8 ; set nextmap vstr d9"
set d9 "set g_gametype 2 ; map map9 ; set nextmap vstr d10"
set d10 "set g_gametype 2 ; map map10 ; set nextmap vstr d11"
set d11 "set g_gametype 2 ; map map11 ; set nextmap vstr d12"
set d12 "set g_gametype 2 ; map map12 ; set nextmap vstr d13"
set d13 "set g_gametype 2 ; map map13 ; set nextmap vstr d14"
set d14 "set g_gametype 2 ; map map14 ; set nextmap vstr d15"
set d15 "set g_gametype 2 ; map map15 ; set nextmap vstr d16"
set d16 "set g_gametype 2 ; map map16 ; set nextmap vstr d17"
set d17 "set g_gametype 2 ; map map17 ; set nextmap vstr d18"
set d18 "set g_gametype 2 ; map map18 ; set nextmap vstr d19"
set d19 "set g_gametype 2 ; map map19 ; set nextmap vstr d20"
set d20 "set g_gametype 2 ; map map20 ; set nextmap vstr d1"
vstr d1
```

### Competitive Stopwatch with Voting

```
// 8-MAP COMPETITIVE STOPWATCH
set com_watchdog_cmd "vstr m1r1 ; say watchdog restarted rotation"
set m1r1 "set g_gametype 3 ; map oasis ; set nextmap vstr m1r2"
set m1r2 "map_restart 0 ; set nextmap vstr m2r1"
set m2r1 "set g_gametype 3 ; map goldrush ; set nextmap vstr m2r2"
set m2r2 "map_restart 0 ; set nextmap vstr m3r1"
set m3r1 "set g_gametype 3 ; map radar ; set nextmap vstr m3r2"
set m3r2 "map_restart 0 ; set nextmap vstr m4r1"
set m4r1 "set g_gametype 3 ; map railgun ; set nextmap vstr m4r2"
set m4r2 "map_restart 0 ; set nextmap vstr m5r1"
set m5r1 "set g_gametype 3 ; map supplydepot ; set nextmap vstr m5r2"
set m5r2 "map_restart 0 ; set nextmap vstr m6r1"
set m6r1 "set g_gametype 3 ; map caen ; set nextmap vstr m6r2"
set m6r2 "map_restart 0 ; set nextmap vstr m7r1"
set m7r1 "set g_gametype 3 ; map tobruk ; set nextmap vstr m7r2"
set m7r2 "map_restart 0 ; set nextmap vstr m8r1"
set m8r1 "set g_gametype 3 ; map italians ; set nextmap vstr m8r2"
set m8r2 "map_restart 0 ; set nextmap vstr m1r1"
vstr m1r1
```

### Multi-Campaign Custom Rotation

```
// THREE CAMPAIGN ROTATION
set com_watchdog_cmd "vstr d_initial ; say watchdog restarted"
set d_initial "set g_gametype 4 ; map oasis ; set nextcampaign vstr d1"
set d1 "campaign cmpgn_northafrica ; set nextcampaign vstr d2"
set d2 "campaign cmpgn_centraleurope ; set nextcampaign vstr d3"
set d3 "campaign my_custom_campaign ; set nextcampaign vstr d1"
vstr d_initial
```

---

## Troubleshooting Rotations

### Rotation Won't Start
```
// Verify string variables exist
cvarlist *d1*

// Check for typos in map names
status

// Manually start rotation
vstr d1
```

### Map Won't Load
```
// Verify map exists and is spelled correctly
map <mapname>

// Check map file is in correct directory
// ET maps: map folder or pk3 files
// Check server console for errors
```

### Rotation Skips Maps
```
// Check nextmap is set correctly
// Ensure each line sets nextmap to next variable
// Example error: set nextmap vstr d3 (should be d2)
```

### Campaign Won't Load
```
// Verify campaign file name is correct
campaign cmpgn_name

// Ensure campaign file exists in correct location
// Verify first map in d_initial matches campaign start map
```

### Watchdog Not Working
```
// Watchdog is automatic - cannot be disabled
// If maps still crash, check:
// - Map file integrity
// - Sufficient server disk space
// - Server logs for errors
```

---

## Naming Conventions

### Standard Rotation Variables

| Format | Usage |
|--------|-------|
| `d1, d2, d3...` | "Day" rotations (Objective, TDM, FFA) |
| `n1, n2, n3...` | "Night" rotations (alternate themed set) |
| `m1r1, m1r2...` | "Map Round" format (Stopwatch) |
| `cmp1, cmp2...` | Campaign rotations |
| `d_initial` | Initial startup variable (campaigns) |

### Example: Day and Night Rotations

```
// DAY ROTATION - Objective maps
set d1 "set g_gametype 2 ; map sunny_map1 ; set nextmap vstr d2"
set d2 "set g_gametype 2 ; map sunny_map2 ; set nextmap vstr d3"
set d3 "set g_gametype 2 ; map sunny_map1 ; set nextmap vstr d1"

// NIGHT ROTATION - Darker maps
set n1 "set g_gametype 2 ; map dark_map1 ; set nextmap vstr n2"
set n2 "set g_gametype 2 ; map dark_map2 ; set nextmap vstr n3"
set n3 "set g_gametype 2 ; map dark_map1 ; set nextmap vstr n1"

// Start day rotation
vstr d1

// Or switch to night rotation
vstr n1
```

---

## Adding Rotations to Server Config

Most ET servers use an **autoexec.cfg** file that runs at startup. Add your rotation strings:

```
// ============================================
// MAP ROTATION CONFIGURATION
// ============================================
set com_watchdog_cmd "vstr d1 ; say watchdog restarted mapcycle"

// Objective Mode Rotation (10 maps)
set d1 "set g_gametype 2 ; map sw_oasis_b3 ; set nextmap vstr d2"
set d2 "set g_gametype 2 ; map mlb_daybreak ; set nextmap vstr d3"
// ... more maps ...
set d10 "set g_gametype 2 ; map goldrush ; set nextmap vstr d1"

// Start rotation
vstr d1
```

### Loading Custom Configs

**Option 1: Via server startup**
```
+exec autoexec.cfg +exec rotations.cfg
```

**Option 2: From in-game console**
```
exec rotations.cfg
vstr d1
```

**Option 3: Using server commands**
```
rcon exec rotations.cfg
rcon vstr d1
```

---

## Common Rotation Patterns

### Quick Reference

**3-Map Objective Loop:**
```
set d1 "set g_gametype 2 ; map map1 ; set nextmap vstr d2"
set d2 "set g_gametype 2 ; map map2 ; set nextmap vstr d3"
set d3 "set g_gametype 2 ; map map3 ; set nextmap vstr d1"
vstr d1
```

**4-Map Stopwatch Loop:**
```
set m1r1 "set g_gametype 3 ; map map1 ; set nextmap vstr m1r2"
set m1r2 "map_restart 0 ; set nextmap vstr m2r1"
set m2r1 "set g_gametype 3 ; map map2 ; set nextmap vstr m2r2"
set m2r2 "map_restart 0 ; set nextmap vstr m1r1"
vstr m1r1
```

**2-Campaign Loop:**
```
set d_initial "set g_gametype 4 ; map oasis ; set nextcampaign vstr d1"
set d1 "campaign campaign1 ; set nextcampaign vstr d2"
set d2 "campaign campaign2 ; set nextcampaign vstr d1"
vstr d_initial
```

---

## Performance Considerations

### Map Load Times
- Large/complex maps may take 30-60 seconds to load
- Plan rotation accordingly for tournament play
- Watchdog timeout is typically 120 seconds

### Player Transitions
- Between rounds (map_restart): ~5-10 seconds
- Between maps: ~30-60 seconds
- Between campaigns: ~60+ seconds (loads entire campaign)

### Server Resources
- Each map consumes memory (can be 100+ MB per complex map)
- Stopwatch restarts reuse memory (faster)
- Campaign transitions may cause brief lag spikes

---

## Tips & Best Practices

1. **Always include watchdog** at the top for automatic recovery
2. **Test rotations manually** before deploying to production
3. **Use consistent naming** (d1-d10, m1r1-m5r2) for maintainability
4. **Document your rotation** with comments
5. **Verify map names** are spelled exactly (case-sensitive on Linux)
6. **For campaigns**, ensure d_initial map matches campaign start map
7. **For stopwatch**, always use `map_restart 0` for the second round
8. **Balance map variety** to keep gameplay fresh
9. **Avoid excessive rotation sizes** (20+ maps causes memory bloat)
10. **Monitor server logs** for rotation errors and player complaints

---

## Reference: All Gametypes

```
g_gametype 0 = FFA (Free For All)
g_gametype 1 = Tournament (Casual multiplayer)
g_gametype 2 = Team Deathmatch
g_gametype 3 = Stopwatch
g_gametype 4 = Campaign
g_gametype 5 = Last Man Standing (LMS)
g_gametype 6 = Map Vote
```

Use the appropriate gametype in your rotation's first command.
