---
title: Server Config
---

# Enemy Territory Server Console Variables (CVars) Reference

## Overview

Server-side console variables control game behavior, server configuration, and administrative functions. Variables marked with **CVAR_LATCH** require a map restart to take effect. Variables marked with **CVAR_ARCHIVE** are saved to configuration files.

---

## Game Type & Mode Configuration

### Game Type Selection
```
g_gametype <value>                  Default: 4 (Campaign)
```
| Value | Game Type |
|-------|-----------|
| 0 | FFA (Free For All) |
| 1 | Tournament |
| 2 | Team Deathmatch |
| 3 | Objective |
| 4 | Campaign |
| 5 | Last Man Standing |
| 6 | Stopwatch |
| 7 | Map Vote |

**Example: Set server to Objective mode**
```
g_gametype 3
map mp_beach
map_restart
```

### Campaign & Map Control
```
g_currentCampaign <name>            Campaign name (read-only, set by map)
g_currentCampaignMap <number>       Current map index in campaign
nextmap <mapname>                   Set next map
nextcampaign <campaign>             Set next campaign
g_campaignFile <filename>           Campaign file to load
```

**Example: Run a specific campaign**
```
g_currentCampaign "BreitenburgToWerfen"
map fueldump
```

---

## Time & Round Limits

### Match Timing
```
timelimit <minutes>                 Default: 0 (no limit)
g_warmup <seconds>                  Default: 60
g_doWarmup <0|1>                    Default: 0 (disabled)
match_timeoutlength <seconds>       Default: 180
match_timeoutcount <number>         Default: 3
```

**Example: 30-minute match with 90-second warmup**
```
timelimit 30
g_warmup 90
g_doWarmup 1
map mp_beach
```

### Last Man Standing (LMS) Mode
```
g_lms_roundlimit <rounds>           Default: 3
g_lms_matchlimit <matches>          Default: 2
g_lms_followTeamOnly <0|1>          Default: 1
g_lms_lockTeams <0|1>               Default: 0
```

**Example: LMS tournament settings**
```
g_gametype 5
g_lms_roundlimit 5
g_lms_matchlimit 3
g_lms_lockTeams 1
```

---

## Team & Player Management

### Player Limits & Balance
```
sv_maxclients <number>              Default: 20 (max players on server)
g_maxGameClients <number>           Default: 0 (no limit)
g_minGameClients <number>           Default: 8
g_teamForceBalance <0|1>            Default: 0
g_noTeamSwitching <0|1>             Default: 0
```

### Respawn Times
```
g_redlimbotime <milliseconds>       Default: 30000 (30 seconds)
g_bluelimbotime <milliseconds>      Default: 30000 (30 seconds)
match_latejoin <0|1>                Default: 1
```

**Example: 10v10 balanced public server**
```
sv_maxclients 20
g_minGameClients 6
g_teamForceBalance 1
g_redlimbotime 15000
g_bluelimbotime 15000
```

### Class & Weapon Restrictions
```
team_maxSoldiers <-1|0-N>           Default: -1 (unlimited)
team_maxMedics <-1|0-N>             Default: -1
team_maxEngineers <-1|0-N>          Default: -1
team_maxFieldops <-1|0-N>           Default: -1
team_maxCovertops <-1|0-N>          Default: -1
team_maxplayers <0-N>               Default: 0 (no per-team limit)

team_maxMortars <-1|0-N>            Default: -1
team_maxFlamers <-1|0-N>            Default: -1
team_maxMachineguns <-1|0-N>        Default: -1
team_maxRockets <-1|0-N>            Default: -1
team_maxRiflegrenades <-1|0-N>      Default: -1
team_maxLandmines <0-N>             Default: 10
```

**Example: Class balanced server (2 per class max)**
```
team_maxSoldiers 2
team_maxMedics 2
team_maxEngineers 2
team_maxFieldops 2
team_maxCovertops 2
team_maxMortars 1
team_maxMachineguns 1
team_maxRockets 1
```

---

## Gameplay Mechanics

### Friendly Fire & Damage
```
g_friendlyFire <0|1>                Default: 1 (enabled)
g_speed <units/sec>                 Default: 320
g_gravity <units/sec²>              Default: 800
g_knockback <multiplier>            Default: 1000
```

### Special Class Charge Times (milliseconds)
```
g_soldierChargeTime <ms>            Default: 20000
g_medicChargeTime <ms>              Default: 45000
g_engineerChargeTime <ms>           Default: 30000
g_fieldopsChargeTime <ms>           Default: 40000
g_covertopsChargeTime <ms>          Default: 30000
```

**Example: Fast-paced gameplay settings**
```
g_friendlyFire 1
g_speed 380
g_gravity 900
g_knockback 1200
g_medicChargeTime 30000
g_engineerChargeTime 20000
g_soldierChargeTime 15000
```

### Heavy Weapons & Item Drops
```
g_heavyWeaponRestriction <0-100>    Default: 100 (no restriction)
g_landminetimeout <minutes>         Default: 1
g_dropHealth <0|1>                  Default: 0
g_dropAmmo <0|1>                    Default: 0
```

---

## Administration & Security

### Server Authentication
```
g_password <password>               Default: none
sv_privatepassword <password>       Default: (empty)
refereePassword <password>          Default: none
shoutcastPassword <password>        Default: none
g_banIPs <comma-separated IPs>      Default: (empty)
g_filterBan <0|1>                   Default: 1
```

**Example: Secure server with admin access**
```
g_password "public_pass"
sv_privatepassword "admin_secret"
refereePassword "ref_pass"
shoutcastPassword "shout_pass"
```

### Chat & Complaints
```
g_complaintlimit <limit>            Default: 6 (public: 0)
g_ipcomplaintlimit <per-IP>         Default: 3
g_teambleedComplaint <threshold>    Default: 50
g_disableComplaints <0|1>           Default: 0
g_voiceChatsAllowed <number>        Default: 5
```

### Match Management
```
match_minplayers <number>           Default: 8
match_readypercent <0-100>          Default: 100
match_mutespecs <0|1>               Default: 0
match_warmupDamage <0|1>            Default: 1
g_forcerespawn <0|1>                Default: 0
g_inactivity <milliseconds>         Default: 0 (disabled)
```

---

## Voting System Configuration

### Vote Permissions
```
g_voting <0|1>                      Default: 0 (disabled)
vote_allow_kick <0|1>               Default: 1
vote_allow_map <0|1>                Default: 1
vote_allow_gametype <0|1>           Default: 1
vote_allow_nextmap <0|1>            Default: 1
vote_allow_mutespecs <0|1>          Default: 1
vote_allow_shuffleteams <0|1>       Default: 1
vote_allow_swapteams <0|1>          Default: 1
vote_allow_friendlyfire <0|1>       Default: 1
vote_allow_antilag <0|1>            Default: 1
vote_allow_timelimit <0|1>          Default: 0
vote_allow_matchreset <0|1>         Default: 1
vote_allow_config <0|1>             Default: 1
vote_allow_referee <0|1>            Default: 0
vote_allow_surrender <0|1>          Default: 1
vote_allow_poll <0|1>               Default: 1
vote_allow_muting <0|1>             Default: 1
```

### Vote Thresholds
```
vote_limit <number>                 Default: 5 (max votes per map)
vote_percent <0-100>                Default: 50 (percentage required)
```

**Example: Enable casual voting**
```
g_voting 1
vote_allow_kick 1
vote_allow_map 1
vote_allow_nextmap 1
vote_allow_shuffleteams 1
vote_allow_friendlyfire 1
vote_limit 3
vote_percent 60
```

---

## Gameplay Rules & Features

### Antilag & Netcode
```
g_antilag <0|1>                     Default: 1 (enabled)
pmove_fixed <0|1>                   Default: 0
pmove_msec <8-33>                   Default: 8 (milliseconds per frame)
g_maxWarp <number>                  Default: 4
g_antiwarp <0|1>                    Default: 1
```

**Example: Pro-level antilag settings**
```
g_antilag 1
pmove_fixed 0
pmove_msec 8
g_maxWarp 3
```

### Skill System
```
skill_soldier <level1> <level2> <level3> <level4>    Default: 20 50 90 140
skill_medic <level1> <level2> <level3> <level4>      Default: 20 50 90 140
skill_fieldops <level1> <level2> <level3> <level4>   Default: 20 50 90 140
skill_engineer <level1> <level2> <level3> <level4>   Default: 20 50 90 140
skill_covertops <level1> <level2> <level3> <level4>  Default: 20 50 90 140
skill_battlesense <level1> <level2> <level3> <level4> Default: 20 50 90 140
skill_lightweapons <level1> <level2> <level3> <level4> Default: 20 50 90 140
```

**Example: Accelerated skill progression**
```
skill_soldier 10 30 70 120
skill_medic 10 30 70 120
skill_fieldops 10 30 70 120
skill_engineer 10 30 70 120
skill_covertops 10 30 70 120
```

### Game Features
```
g_fastres <0|1>                     Default: 0 (medic revive speed)
g_syringeHealing <0|1>              Default: 0 (allow syringe on alive teammates)
g_legacyRevives <0|1>               Default: 1 (ET-style revive behavior)
g_maxlives <0-N>                    Default: 0 (no limit)
g_maxlivesRespawnPenalty <ms>       Default: 0
g_filtercams <0|1>                  Default: 0
g_corpses <0|1>                     Default: 0 (corpse persistence)
```

---

## Server Information & MOTD

### Server Metadata
```
URL <website>                       Default: (empty)
g_motd <message>                    Default: (empty)
server_motd0 to server_motd5        Default: " ^NEnemy Territory ^7MOTD "
```

**Example: Public server setup**
```
URL "http://myclan.com"
server_motd0 "^N=== MyServer ^7MOTD ^N==="
server_motd1 "^7No racist language"
server_motd2 "^7No airstrike spam"
server_motd3 "^7Have fun!"
server_motd4 ""
server_motd5 "^7Website: myclan.com"
```

---

## Logging & Debugging

### Server Logging
```
g_log <filename>                    Default: (empty)
g_logSync <0|1>                     Default: 0
g_logTimestamp <0|1>                Default: 1
cg_logFile <filename>               Default: (empty)
```

**Example: Enable detailed logging**
```
g_log "games.log"
g_logSync 1
g_logTimestamp 1
```

### Debug Options (Cheat Protected)
```
developer <0|1>                     Default: 0
g_debugSkills <0|1>                 Default: 0
g_debugConstruct <0|1>              Default: 0
g_debugHitboxes <0|1>               Default: 0
g_debugPlayerHitboxes <0|1>         Default: 0
g_debugEvents <0|1>                 Default: 0
```

---

## Map & Campaign Management

### Map Voting
```
g_mapVoteFlags <flags>              Default: 0
g_maxMapsVotedFor <number>          Default: 6
g_minMapAge <maps>                  Default: 3 (before replay)
g_excludedMaps <map1,map2,...>      Default: (empty)
g_resetXPMapCount <number>          Default: 0
```

**Example: Enable map voting with rotation**
```
g_mapVoteFlags 1
g_maxMapsVotedFor 8
g_minMapAge 2
g_resetXPMapCount 0
```

---

## XP & Progression

```
g_xpSaver <0|1>                     Default: 0 (preserve XP between maps)
g_xpSaverMaxAge <seconds>           Default: 86400 (24 hours)
#ifdef FEATURE_RATING
g_skillRating <0|1|2>               Default: 2 (skill-based rating)
#endif
#ifdef FEATURE_PRESTIGE
g_prestige <0|1>                    Default: 1 (enable prestige system)
#endif
```

---

## Advanced Configuration

### Physics & Movement
```
g_fixedphysics <0|1>                Default: 1
g_fixedphysicsfps <fps>             Default: 125
g_pronedelay <ms>                   Default: 0
g_moverScale <multiplier>           Default: 1.0
```

### Misc Features
```
g_suddenDeath <0|1>                 Default: 0
g_dropObjDelay <ms>                 Default: 3000
g_floodProtection <0|1>             Default: 1
g_floodLimit <messages>             Default: 5
g_floodWait <ms>                    Default: 1000
g_guide <0|1>                       Default: 1 (GUID enforcement)
g_protect <0|1>                     Default: 0 (clan tag protection)
```

**Example: Anti-spam and flood protection**
```
g_floodProtection 1
g_floodLimit 4
g_floodWait 2000
g_complaintlimit 0
```

---

## Complete Server Configuration Examples

### Competitive LAN Tournament
```bash
# Game settings
g_gametype 3
timelimit 35
g_warmup 120
g_doWarmup 1
g_friendlyFire 1

# Player management
sv_maxclients 20
g_minGameClients 12
g_teamForceBalance 1
g_redlimbotime 20000
g_bluelimbotime 20000

# Class limits
team_maxSoldiers 3
team_maxMedics 2
team_maxEngineers 2
team_maxFieldops 2
team_maxCovertops 2
team_maxMortars 1
team_maxRockets 1

# Netcode
g_antilag 1
pmove_fixed 0
pmove_msec 8

# Voting
g_voting 1
vote_allow_kick 1
vote_allow_map 1
vote_allow_shuffle 1
vote_percent 66
vote_limit 2

# Logging
g_log "matches.log"
g_logSync 1

# Map rotation
map mp_beach
```

### Casual Public Server
```bash
# Game settings
g_gametype 0
timelimit 45
g_warmup 60
g_doWarmup 0
g_friendlyFire 0

# Player management
sv_maxclients 32
g_minGameClients 4
g_teamForceBalance 0
g_redlimbotime 10000
g_bluelimbotime 10000

# No restrictions
team_maxSoldiers -1
team_maxMedics -1
team_maxEngineers -1
team_maxFieldops -1
team_maxCovertops -1

# Voting enabled
g_voting 1
vote_allow_kick 1
vote_allow_map 1
vote_allow_gametype 1
vote_allow_friendlyfire 1
vote_percent 50
vote_limit 5

# Server info
g_password ""
URL "http://myserver.com"
server_motd0 "^N=== Welcome ^7===^N"
server_motd1 "^7Have fun!"
server_motd2 ""
server_motd3 "^7No cheating"
server_motd4 ""
server_motd5 "^7myserver.com"
```

### Last Man Standing Tournament
```bash
g_gametype 5
g_lms_roundlimit 5
g_lms_matchlimit 3
g_lms_lockTeams 1
g_lms_followTeamOnly 1

sv_maxclients 20
timelimit 0
g_warmup 30
g_doWarmup 1

g_antilag 1
pmove_msec 8

match_readypercent 100
vote_allow_kick 1
vote_percent 66
```

---

## Related Commands

- `status` - Show current players and scores
- `map <mapname>` - Load a map
- `map_restart [delay]` - Restart current map
- `g_gametype` - Set game type
- `say <message>` - Server message
- `say_team <message>` - Team message
- `admin` - Admin commands (if enabled)

---

## Notes

- Use `sv_cvar <varname>` to query server cvars from client
- Most changes require `map_restart` or loading a new map
- Latched variables only take effect on server restart/map load
- Cheat-protected variables require `sv_cheats 1`
- Archive variables persist in config files
