---
title: Dark Messiah MP Console Variables (Server Tuning)
---

This page documents **multiplayer-relevant** console variables found in via `cvarlist` output, with a focus on **XP tuning** and a few other server ops knobs.

## Notes on flags in `cvarlist`

- **`sv`**: server-side (set on the server / listen host)
- **`rep`**: replicated to clients
- **`cheat`**: typically requires `sv_cheats 1`
- **`nf`**: “not flagged” for some restrictions (varies by Source branch/mod)
- **`cl`**: client-side

---

## XP award tuning

These variables appear to directly control XP awards for game events and abilities.

### Objective / mode XP

| CVar | Default | What it affects |
|---|---:|---|
| `xp_capture_point_gain` | `10` | XP granted for capturing a control point (or similar objective). |
| `xp_ctf_flag_capture` | `150` | XP for capturing the flag. |
| `xp_ctf_flag_capture_same_team` | `50` | XP for a flag capture when… the capturing/crediting condition is “same team” (likely defense/assist/return-to-base capture flow depending on the mod logic). |
| `xp_ctf_flag_returned` | `150` | XP for returning a flag. |
| `xp_ctf_bonus_for_killing_flag_carrier` | `20` | Bonus XP for killing the enemy flag carrier. |

### Combat / kill scaling

| CVar | Default | What it affects |
|---|---:|---|
| `xp_kill_per_level_gain` | `10` | XP per kill per level (i.e., kill XP scales by player level). This is likely one of the most impactful knobs. |

### Support / spell XP

| CVar | Default | What it affects |
|---|---:|---|
| `xp_cure_gain` | `3` | XP for “cure” (healing/cleanse) actions. |
| `xp_cure_ctf_carrier_bonus` | `3` | Bonus XP when curing/healing a CTF flag carrier (or equivalent). |
| `xp_heal_team_per_player_gain` | `2` | XP gain per teammate affected by team-heal tick/ability. |
| `xp_resurrect_gain` | `8` | XP for resurrecting a teammate. |
| `xp_mass_resurrect_gain` | `15` | XP for mass-resurrect. |
| `xp_eat_soul_gain` | `6` | XP for “eat soul” ability. |
| `xp_gain_force_arrow` | `2` | XP for a force arrow event (likely hit/kill/impact depending on how the mod counts it). |
| `xp_mark_target_kill_bonus` | `20` | Bonus XP for killing a marked target. |

### XP multipliers / global-ish knobs

| CVar | Default | What it affects |
|---|---:|---|
| `sv_adrenaline_xp_bonus` | `1` | **XP multiplier when in adrenaline mode.** (Your output explicitly says this.) |

> **Practical guidance:** If you want “overall XP is faster/slower,” the closest “multiplier” you have in this excerpt is `sv_adrenaline_xp_bonus`. Otherwise you’ll be adjusting the individual `xp_*` awards.

---

## Shared XP system (`xps_*`) knobs

These look like a **shared XP** or **assist XP** mechanism, based on damage taken / healing taken and various modifiers.

| CVar | Default | What it affects |
|---|---:|---|
| `xps_capture_point_gain` | `5` | Shared/secondary XP for capture points (likely “assist XP” pool). |
| `xps_damage_takendamage_modifier` | `1` | Scaling factor for shared XP based on damage taken. |
| `xps_damage_takendrop_off_per_second` | `5` | Decay/drop-off rate for damage-taken contribution over time. |
| `xps_damage_takenminimum_required_to_get_shared_xp` | `5` | Minimum damage threshold before shared XP is awarded. |
| `xps_damage_takenincrease_for_blind_effect` | `15` | Additional shared-XP factor while blind is affecting target (or while attacker has blind status interaction). |
| `xps_damage_takenlast_gasp_increase` | `100` | Large boost tied to “last gasp” state/event. |
| `xps_damage_takenmark_target_increase` | `20` | Boost when damage involves a “mark target” effect. |
| `xps_healing_taken_healing_modifier` | `1` | Scaling factor for shared XP based on healing taken. |
| `xps_healing_taken_drop_off_per_secnd` | `5` | Decay/drop-off rate for healing-taken contribution over time. |
| `xps_healing_taken_minimum_required_to_get_shared_xp` | `5` | Minimum healing threshold before shared XP is awarded. |
| `xps_healing_taken_increase_for_stone_armour_effect` | `50` | Boost when stone armour is involved. |
| `xps_xps_healing_taken_increase_for_mass_resurrect` | `40` | Boost for mass resurrect contribution (name typo duplicated in cvar). |
| `xps_xps_healing_taken_increase_for_resurrect` | `60` | Boost for resurrect contribution (name typo duplicated in cvar). |
| `xps_xps_healing_taken_magical_shield_damage_modifier` | `1` | Modifier for magical shield interactions (note: your output line has a formatting typo). |

> These are good candidates if you’re trying to rebalance “support” classes: tune the minimum thresholds and decay first, then adjust the special-case boosts.

---

## “Starting skill points” (not found in this excerpt)

Your pasted `cvarlist` excerpt **does not contain** an obvious `start_skill_points` / `starting_skillpoints` / similar cvar.

**Workaround (admin/cheat style):**
- If the game exposes commands like `mm_player_add_skillpoints <n>`, you can approximate “starting skill points” by running a script on player connect/spawn (if supported), but that’s beyond what’s visible in this output.

---

## Useful server multiplayer settings (ops / QoL)

These aren’t XP-related, but are typically “server.cfg staples”.

### Access / LAN / passwords

| CVar | Default | Description |
|---|---:|---|
| `sv_lan` | `1` | LAN mode (no heartbeat/auth; restricts to local networking behavior). |
| `sv_password` | `0` | Server password for joining MP games. |

### Downloads / FastDL-style

| CVar | Default | Description |
|---|---:|---|
| `sv_allowdownload` | `1` | Allow clients to download missing files. |
| `sv_allowupload` | `1` | Allow clients to upload customizations. |
| `sv_downloadurl` | `0` | URL clients use to download missing content (if supported by the mod/branch). |
| `sv_consistency` | `1` | Enforce file consistency for critical files. |

### Voice / comms

| CVar | Default | Description |
|---|---:|---|
| `sv_alltalk` | `0` | Everyone hears everyone (no team restriction). |
| `sv_voiceenable` | `1` | Enables voice on server (note: your output has `sv_voiceenabl` typo). |

### Teamkill punishment

| CVar | Default | Description |
|---|---:|---|
| `team_kill_punish` | `1` | Enables teamkill punishment logic. |
| `teamkill_poison_damage` | `15` | Damage amount for poison punishment. |
| `teamkill_setonfire_time` | `10` | Fire duration punishment. |
| `teamkill_menu_time` | `15` | Time window for teamkill menu (client replicated). |

### RCON hardening

| CVar | Default | Description |
|---|---:|---|
| `sv_rcon_banpenalty` | `0` | Minutes to ban after repeated rcon auth failures. |
| `sv_rcon_maxfailures` | `10` | Max failures before ban. |
| `sv_rcon_minfailures` | `5` | Failures allowed within time window. |
| `sv_rcon_minfailuretime` | `30` | Window (seconds) for counting failures. |

### Rates / networking

| CVar | Default | Description |
|---|---:|---|
| `sv_maxrate` / `sv_minrate` | `0` / `0` | Bandwidth caps (0 = unlimited). |
| `sv_maxupdaterate` / `sv_minupdaterate` | `60` / `10` | Server update-rate bounds. |
| `sv_timeout` | `65` | Drop client after inactivity (seconds). |

### SourceTV (if you’re recording or spectating matches)

| CVar | Default | Description |
|---|---:|---|
| `tv_enable` | `0` | Enables SourceTV on server. |
| `tv_port` | `27020` | SourceTV port. |
| `tv_delay` | `10` | Broadcast delay (seconds). |
| `tv_maxclients` | `128` | Max SourceTV clients. |
| `tv_record` / `tv_stoprecord` | `cmd` | Start/stop demo recording. |

---

## Example `server.cfg` snippets

### Faster leveling (example: CTF + kill scaling)
```cfg
// CTF awards
sv_xp_ctf_flag_capture 250
sv_xp_ctf_flag_returned 200
sv_xp_ctf_bonus_for_killing_flag_carrier 30

// Kill scaling
sv_xp_kill_per_level_gain 15
```

### Make support play matter more (shared XP + healing XP)
```cfg
sv_xp_cure_gain 5
sv_xp_resurrect_gain 12
sv_xp_mass_resurrect_gain 20

sv_xps_healing_taken_minimum_required_to_get_shared_xp 3
sv_xps_healing_taken_drop_off_per_secnd 3
sv_xps_healing_taken_healing_modifier 2
```

