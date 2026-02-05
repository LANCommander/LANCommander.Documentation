# Battlefield 1942 Server Configuration Options

This document describes the available server configuration options for Battlefield 1942 dedicated servers. All options are set in `.con` files, primarily `serversettings.con` and `maplist.con`.

## Server Identity

Configure the server name, visibility, and connection settings.

```con
game.serverName "My Battlefield Server"
```
Sets the server name displayed in the server browser.

```con
game.serverDedicated 1
```
Enables dedicated server mode. Set to `1` for dedicated servers, `0` for listen servers.

```con
game.serverInternet 0
```
Controls server visibility:
- `0` - LAN server (not visible on internet)
- `1` - Internet server (visible on GameSpy master server)

```con
game.serverIP 0.0.0.0
```
IP address to bind the server to. Use `0.0.0.0` to bind to all interfaces.

```con
game.serverPort 14567
```
UDP port for game traffic. Default is `14567`.

```con
game.serverPassword ""
```
Password required to join the server. Leave empty (`""`) for no password.

```con
game.serverReservedPassword ""
```
Password for reserved slots. Players with this password can join even when the server is full.

```con
game.serverNumReservedSlots 0
```
Number of slots reserved for players with the reserved password.

```con
game.setServerWelcomeMessage 0 ""
```
Welcome message displayed to players when they join. Format: `game.setServerWelcomeMessage <line_number> "<message>"`

## Gameplay Settings

Configure game rules, timers, and gameplay mechanics.

### Round and Time Settings

```con
game.serverGameTime 0
```
Time limit per round in seconds. `0` means no time limit.

```con
game.serverNumberOfRounds 3
```
Number of rounds to play before changing maps.

```con
game.serverScoreLimit 0
```
Score limit to end the round. `0` means no score limit.

```con
game.serverGameStartDelay 20
```
Delay in seconds before the game starts after map loads.

```con
game.serverGameRoundStartDelay 10
```
Delay in seconds before each round starts.

### Spawn Settings

```con
game.serverSpawnTime 20
```
Time in seconds between spawn waves.

```con
game.serverSpawnDelay 3
```
Additional delay in seconds before players can spawn after death.

### Friendly Fire

```con
game.serverSoldierFriendlyFire 100
```
Friendly fire damage percentage for soldiers. `0` = disabled, `100` = full damage.

```con
game.serverVehicleFriendlyFire 100
```
Friendly fire damage percentage for vehicles. `0` = disabled, `100` = full damage.

```con
game.serverSoldierFriendlyFireOnSplash 100
```
Friendly fire splash damage percentage for soldier weapons.

```con
game.serverVehicleFriendlyFireOnSplash 100
```
Friendly fire splash damage percentage for vehicle weapons.

### Team Kill (TK) System

```con
game.serverTKPunishMode 1
```
Team kill punishment mode:
- `0` - Forgive mode (players are forgiven by default, victim can punish)
- `1` - Punish mode (players are punished by default, victim can forgive)

```con
game.serverKickBack 0.000000
```
Kickback damage when team killed. `0.0` = disabled.

```con
game.serverKickBackOnSplash 0.000000
```
Kickback damage from splash when team killed. `0.0` = disabled.

### Camera and View Settings

```con
game.serverAllowNoseCam 1
```
Allow nose camera view in aircraft. `0` = disabled, `1` = enabled.

```con
game.serverFreeCamera 0
```
Enable free camera mode. `0` = disabled, `1` = enabled.

```con
game.serverExternalViews 1
```
Allow external views (third-person). `0` = disabled, `1` = enabled.

```con
game.serverDeathCameraType 1
```
Death camera type:
- `0` - No death camera
- `1` - Standard death camera
- `2` - Free camera

```con
game.serverCrossHairCenterPoint 1
```
Show center point dot on crosshair. `0` = disabled, `1` = enabled.

### Other Gameplay Options

```con
game.serverHitIndication 1
```
Show hit indication markers. `0` = disabled, `1` = enabled.

```con
game.serverNameTagDistance 50
```
Distance in meters to show player name tags.

```con
game.serverNameTagDistanceScope 300
```
Distance in meters to show player name tags when using scope/binoculars.

```con
game.objectiveAttackerTicketsMod 100
```
Modifier percentage for attacker tickets on objective-based maps. `100` = normal.

## Team Balance

Configure team balancing and ratios.

```con
game.serverAutoBalanceTeams 0
```
Automatically balance teams. `0` = disabled, `1` = enabled.

```con
game.serverAlliedTeamRatio 1
```
Allied team size ratio multiplier. `1` = normal size.

```con
game.serverAxisTeamRatio 1
```
Axis team size ratio multiplier. `1` = normal size.

```con
game.serverTicketRatio 100
```
Ticket ratio percentage. `100` = balanced, higher values favor one team.

```con
game.serverMaxPlayers 32
```
Maximum number of players allowed on the server.

## Co-op Settings

Configure cooperative gameplay with AI bots.

```con
game.serverCoopAiSkill 75
```
AI bot skill level (0-100). Higher values = more difficult bots.

```con
game.serverCoopCpu 20
```
Number of AI bots to spawn.

## Voting System

Configure player voting for maps and kicks.

### Voting Enable/Disable

```con
admin.enableMapVote 1
```
Enable map voting. `0` = disabled, `1` = enabled.

```con
admin.enableKickPlayerVote 1
```
Enable vote to kick players. `0` = disabled, `1` = enabled.

```con
admin.enableKickTeamPlayerVote 1
```
Enable vote to kick players from your team only. `0` = disabled, `1` = enabled.

### Voting Configuration

```con
admin.votingTime 30
```
Time in seconds players have to vote.

## Network and Performance

Configure network settings and performance options.

```con
game.serverBandwidthChokeLimit 0
```
Bandwidth limit in bytes per second. `0` = unlimited.

```con
game.serverMaxAllowedConnectionType CTLanT1
```
Maximum allowed connection type:
- `CTLanT1` - LAN/T1
- `CTLanT2` - T2
- `CTLanT3` - T3
- `CTLanCable` - Cable
- `CTLanDSL` - DSL
- `CTLan56k` - 56k modem

### GameSpy and ASE Ports

```con
game.gameSpyLANPort 0
```
Port for GameSpy LAN queries. `0` = disabled.

```con
game.gameSpyPort 0
```
Port for GameSpy internet queries. `0` = disabled.

```con
game.ASEPort 0
```
Port for All-Seeing Eye (ASE) queries. `0` = disabled.

## Remote Console (RCON)

Configure remote administration access.

### RCON Settings

```con
admin.enableRemoteConsole 1
```
Enable remote console access. `0` = disabled, `1` = enabled.

```con
admin.enableRemoteAdmin 1
```
Enable remote admin commands. `0` = disabled, `1` = enabled.

**Note:** Remote console uses TCP port `4711` by default. Ensure this port is open and accessible.

### Common RCON Commands

These commands can be executed via remote console:

```con
admin.kickplayer <player_id>
```
Kick a player by their player ID.

```con
admin.banplayer <player_id> [timeout]
```
Ban a player by their player ID. Timeout can be:
- Omitted or `perm` - permanent ban
- Number (seconds) - temporary ban duration
- `round` - ban until next map
- `:epoch_time` - ban until specific epoch time

```con
admin.banPlayerKey <player_id> [timeout]
```
Ban a player by their CD key hash.

```con
admin.addAddresstoBanList <ip_address> [timeout]
```
Ban an IP address.

```con
admin.removeAddressFromBanList <ip_address>
```
Remove an IP address from the ban list.

```con
admin.listBannedAddresses
```
List all banned IP addresses.

```con
admin.listBannedKeys
```
List all banned CD key hashes.

```con
admin.clearbanlist
```
Clear all bans.

```con
admin.changemap <mapname> <gamemode> <mod>
```
Change to a specific map immediately. Example: `admin.changemap berlin GPM_CQ bf1942`

```con
admin.setNextLevel <mapname> <gamemode> <mod>
```
Set the next map in rotation. Example: `admin.setNextLevel berlin GPM_CQ bf1942`

```con
admin.runnextlevel
```
Skip to the next map in rotation.

```con
admin.restartmap
```
Restart the current map.

```con
admin.togglegamepause
```
Pause/unpause the game.

```con
admin.servermessage "<message>"
```
Send a message to all players.

```con
game.listplayers
```
List all connected players with their IDs, names, and CD key hashes.

```con
game.showPorts
```
Display all ports currently used by the server.

## Logging

Configure server event logging.

```con
game.serverEventLogging 0
```
Enable XML event logging. `0` = disabled, `1` = enabled.

When enabled, the server writes XML log files to the `Logs` directory containing:
- Round statistics
- Player actions (kills, deaths, captures)
- Chat messages
- Server events

```con
game.serverEventLogCompression 0
```
Enable compression for XML log files. `0` = disabled, `1` = enabled.

When enabled, log files use `.zxml` extension and are compressed with zlib. This saves disk space but increases CPU usage.

**Note:** Compressed logs require zlib-aware tools to decompress. See the XML logging readme for decompression examples.

## Map Rotation

Configure which maps are played and in what order.

### Map List Format

Maps are defined in `maplist.con` using the following format:

```con
game.addLevel <mapname> <gamemode> <mod>
```

**Parameters:**
- `<mapname>` - Map name (e.g., `berlin`, `omaha_beach`, `stalingrad`)
- `<gamemode>` - Game mode:
  - `GPM_CQ` - Conquest
  - `GPM_COOP` - Cooperative
  - `GPM_TDM` - Team Deathmatch
  - `GPM_CTF` - Capture the Flag
  - `GPM_OBJECTIVEMODE` - Objective Mode
- `<mod>` - Mod name (e.g., `bf1942`, `xpack1`, `xpack2`)

### Example Map Rotation

```con
game.addLevel berlin GPM_CQ bf1942
game.addLevel omaha_beach GPM_CQ bf1942
game.addLevel stalingrad GPM_CQ bf1942
game.addLevel kursk GPM_CQ bf1942
game.addLevel el_alamein GPM_CQ bf1942
game.setCurrentLevel berlin GPM_CQ bf1942
```

The `game.setCurrentLevel` command sets the starting map. The server will cycle through maps in the order they are added.

### Available Maps

**Base Game (bf1942):**
- `aberdeen`, `battle_of_britain`, `battle_of_the_bulge`, `battleaxe`, `berlin`, `bocage`, `coral_sea`, `el_alamein`, `gazala`, `guadalcanal`, `invasion_of_the_philippines`, `iwo_jima`, `kharkov`, `kursk`, `liberation_of_caen`, `market_garden`, `midway`, `omaha_beach`, `stalingrad`, `tobruk`, `wake`

**Road to Rome (xpack1):**
- `anzio`, `baytown`, `cassino`, `husky`, `salerno`, `santo_croce`

**Secret Weapons of WWII (xpack2):**
- `eagles_nest`, `essen`, `gothic_line`, `hellendoorn`, `kbely_airfield`, `mimoyecques`, `peenemunde`, `raid_on_agheila`, `telemark`

## Content Checking

Configure content validation to prevent cheating.

```con
game.serverContentCheck 1
```
Content checking mode:
- `0` - Allow all clients (no checking)
- `1` - Only allow default installations (strict checking)
- `2` - Allow clients matching server-defined CRCs (custom mod support)

```con
game.serverUnpureMods ""
```
List of mods that are allowed even with content checking enabled. Format: `"mod1 mod2 mod3"`

**Note:** Content checking requires `contentcrc32.con` files in each mod directory. See the content check readme for details on generating CRC files for custom mods.

## PunkBuster

Configure PunkBuster anti-cheat.

```con
game.serverPunkBuster 0
```
Enable PunkBuster anti-cheat. `0` = disabled, `1` = enabled.

**Note:** PunkBuster requires separate installation and configuration. Visit http://www.evenbalance.com for more information.

## Advanced Admin Settings

Additional administrative settings available via console commands:

```con
admin.spawnDelayPenaltyForTK <value>
```
Extra spawn waves penalty for team kills. `1.0` = wait 1 spawn wave, `1.5` = wait 1.5 spawn waves, etc.

```con
admin.banPlayerOnTKKick <0 or 1>
```
Ban players when kicked for team killing. `0` = disabled, `1` = enabled.

```con
admin.nrOfTKToKick <value>
```
Number of punished team kills before automatic kick.

```con
admin.timeLimit <seconds>
```
Set time limit for rounds (alternative to `game.serverGameTime`).

```con
admin.scoreLimit <score>
```
Set score limit for rounds (alternative to `game.serverScoreLimit`).

```con
admin.setNrOfRounds <number>
```
Set number of rounds per map (alternative to `game.serverNumberOfRounds`).

```con
admin.delaybeforestartinggame <seconds>
```
Delay before game starts (alternative to `game.serverGameStartDelay`).

```con
admin.roundDelayBeforeStartingGame <seconds>
```
Delay before round starts (alternative to `game.serverGameRoundStartDelay`).

```con
admin.banTime <seconds>
```
Default ban duration in seconds for temporary bans.

## File Locations

Configuration files are typically located in:
- `mods/bf1942/settings/serversettings.con` - Main server settings
- `mods/bf1942/settings/maplist.con` - Map rotation
- `mods/bf1942/settings/adminsettings.con` - Admin settings (if used)
- `mods/bf1942/settings/banlist.con` - Banned players/IPs (auto-generated)

## Notes

- All settings in `serversettings.con` are loaded when the server starts
- Changes to `serversettings.con` require a server restart to take effect
- Map rotation changes in `maplist.con` require a server restart
- Some settings can be changed at runtime via console commands
- Use `game.listPlayers` to find player IDs for admin commands
- Remote console requires TCP port `4711` to be accessible
- XML logs are written to the `Logs` directory in the mod folder
