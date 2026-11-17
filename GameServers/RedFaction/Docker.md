---
sidebar_label: Docker
---

# Red Faction Docker Container

This Docker container runs a Red Faction dedicated server. It is built on the WINE image and runs the retail game's dedicated mode with Alpine Faction. The container doesn't download the game, so you provide the files.

## Quick Start

```yaml
services:
  redfaction:
    image: lancommander/redfaction:latest
    container_name: redfaction

    ports:
      - 7755:7755/udp

    volumes:
      - "/servers/Red Faction/Default:/config"

    environment:
      RF_SERVER_NAME: "My Red Faction Server"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Copy a Red Faction 1.20 NA install (the folder with `RF.exe` and the `.vpp` files) into `Server/` before the first start. You can instead set `RF_ARCHIVE_URL` to a zip of that folder. Alpine Faction comes with the image.

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitialization/20-InstallRedFaction.ps1` checks for `Server/RF.exe` (or `RF_120na.exe`). If it's missing and `RF_ARCHIVE_URL` is set, the hook downloads and extracts the archive and remounts the overlay. With `AF_INSTALL=true` it then copies the image's Alpine Faction files into `Merged/` wherever they differ, so they land in `Overlay/`.
3. `PostInitialization/30-ConfigureRedFaction.ps1` creates `<RF_CONFIG>.toml` from the image's default if it doesn't exist, then writes the non-empty `RF_*` settings into its top-level keys. It edits through `Merged/`, so the file lands in `Overlay/`.
4. `PostInitialization/40-ConfigureMatchStatistics.ps1` sets up the [match statistics](#match-statistics) when they're on, and takes out the `fflink_gsk` it wrote when they're off.
5. `START_EXE` (`/usr/local/bin/rf-server`) starts `rf-stats-bridge` first if the match statistics are on, then runs `AlpineFactionLauncher.exe -game -exe-path <RF.exe> -ads <RF_CONFIG>.toml -port <RF_PORT> -lanonly -win32-console` under Wine. The launcher starts RF, injects Alpine Faction and exits, so the script then waits with `wineserver -w` until the game exits.

A successful start prints the full config and rotation, and ends with:

```
-- Game Initializing --
-- Alpine Faction Initializing --
-- Level Initializing: dm02.rfl (DM) --
Applying level-specific rules for server rotation index 0 (dm02.rfl)...
```

Each level change prints another `-- Level Initializing: <level> (<game type>) --` line. Alpine Faction's own log is `logs/AlpineFaction-dedicated-<RF_CONFIG>.log` in `Overlay/`.

## Configuration Options

### Ports

- **7755/udp**: Game, server info and LAN browser queries (`RF_PORT`)

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### Server config

`Overlay/<RF_CONFIG>.toml` (`server.toml` by default) is an Alpine Faction dedicated server (ADS) config, and it's yours to edit. Only `server_name`, `max_players`, `password` and `rcon_password` are rewritten on start, and only when their `RF_*` variable is set. The full key reference is in Alpine Faction's [DEDICATED_SERVER_CONFIG.md](https://github.com/GooberRF/alpinefaction/blob/main/docs/reference/DEDICATED_SERVER_CONFIG.md), and [dedi.alpinefaction.com](https://dedi.alpinefaction.com) builds one in the browser.

The file has server settings at the top, then a `[base]` table with the rules for every level, then the rotation as `[[levels]]` entries played in order. A level picks its own game type and overrides rules in a `[levels.rules]` table:

```toml
[base]
game_type = "DM"
time_limit = 600                # seconds

[[levels]]
filename = "dm02"               # DM, from [base]

[[levels]]
filename = "ctf01"
[levels.rules]
game_type = "CTF"
cap_limit = 5

[[levels]]
filename = "dm10"
[levels.rules]
game_type = "GG"                # Gun Game
```

Game types are `DM`, `TDM`, `CTF`, `KOTH` (King of the Hill), `DC` (Damage Control), `REV` (Revolt), `RUN`, `ESC` (Escalation), `BAG`/`TBAG` (Bagman, Team Bagman), `PIT`, `WO` (Wipeout), `GG` (Gun Game), `SAL` (Salvage), `SCAV` (Scavenger) and `PAY` (Payload). Several need levels made for them (KOTH, DC, REV, RUN, ESC, SAL, SCAV, PAY ...). The stock levels are `dm01`-`dm20` (no `dm11` or `dm18`) and `ctf01`-`ctf07`. A rotation level that isn't installed is downloaded from FactionFiles at startup, which needs internet access, and dropped if that fails; add `-nodl` to `START_ARGS` to skip downloads. `dynamic_rotation = true` shuffles the rotation.

Players can vote with `vote level <level> [game type]`, `vote next`, `vote restart` and `vote extend` in chat. Each vote has its own `[vote_*]` table.

Game types and mutators added by Alpine Faction need Alpine Faction clients. Other clients spectate while one is active.

### Match statistics

Alpine Faction has its own stats reporting: with an `fflink_gsk` in its config, the server sends every game it hosts to FactionFiles (`https://link.factionfiles.com/afstats/v1/`). The image can send those reports to LANCommander instead. Set `MATCH_STATS_SERVER_URL`, `MATCH_STATS_TOKEN` (a LANCommander access token with the **Report matches** scope) and `MATCH_STATS_GAME_ID`:

```yaml
    environment:
      MATCH_STATS_SERVER_URL: "http://lancommander.lan:1337"
      MATCH_STATS_TOKEN: "${LANCOMMANDER_MATCH_TOKEN}"
      MATCH_STATS_GAME_ID: "<the game's id in LANCommander>"
```

With them set, hook 40:

- resolves `link.factionfiles.com` to `127.0.0.1` inside the container (`/etc/hosts`)
- makes a certificate authority and a `link.factionfiles.com` certificate in `/config/.rf-stats-bridge/`, and adds the authority to the container's trusted roots, which Wine reads
- adds an `fflink_gsk` to `<RF_CONFIG>.toml` if it has none, and `demo_auto_record = true` if the config doesn't set it and `MATCH_STATS_DEMOS` is on (both marked with a comment, and removed again when turned off)

`rf-server` then starts `rf-stats-bridge`, which listens on `127.0.0.1:443` and answers Alpine Faction in FactionFiles' place. It accepts the server's key, acknowledges each batch of events, and turns the events into LANCommander matches. The [LANCommander Interposer](https://github.com/LANCommander/LANCommander.Interposer), built into the bridge, delivers them. It batches and retries, and keeps whatever LANCommander hasn't taken yet in `/config/.interposer/Matches/` until it can be delivered, across restarts. Its log is in `/config/.interposer/Logs/`.

Each level played is one match:

| LANCommander | From Alpine Faction |
|---|---|
| Map, mode | The level file (`dm02`) and the game type (`dm`, `ctf`, `tdm`, `koth`, `gg` ...) |
| Settings | Time limit, win condition, overtime, mutators, the game type's settings and the server settings |
| Players | `name:<name>`, or `bot:<name>` for bots, with their team. A name change keeps the player's key until the next level |
| Events | `kill` (weapon, damage type, headshot/splash/melee, suicide, teamkill, assists, positions), `award`, `flag_stolen`/`flag_picked_up`/`flag_captured`/`flag_dropped`/`flag_returned`, `point_captured`, `bag_picked_up` ..., `gungame_level`, `round_start`/`round_end`, `ready_match_start`/`ready_match_end`, `vote_called`/`vote_ended`, `team_change`, `name_change`, `disconnect`, `game_end` |
| Statistics | Each player's totals from the end-of-level scoreboard: `score`, `kills`, `deaths`, `assists`, `captures`, `shots_fired`, `shots_hit`, `damage_dealt`, `damage_taken`, `highest_streak`, `time_played_ms`, `avg_ping` ...; each team's `score` |
| Results | Team games rank the teams by score, and each player takes their team's place. Otherwise the players are ranked by score. A player who left before the end did not finish |
| Attachments | The level's demo (`.afd`), as a Demo |

#### Demos

With `MATCH_STATS_DEMOS` on (the default), Alpine Faction records every level it hosts (`demo_auto_record`) and, when the next level starts, uploads the recording as it would to FactionFiles. The bridge takes the upload, checks its size and CRC, and attaches it to the level's match; the Interposer uploads it to LANCommander in the background. The bridge's copy waits in `/config/.rf-stats-bridge/demos/` until LANCommander has it, across restarts.

- A level no human player joined isn't kept by Alpine Faction, and the demo of a level that wasn't reported (`MATCH_STATS_MIN_PLAYERS`) is thrown away.
- Alpine Faction keeps its own copy too, in `Overlay/demos/uploaded/`. Set `fflink_demo_delete_after_send = true` in the config to have it deleted instead.
- On a match-mode server (`[match_mode]`), only live matches are recorded, not the ready-up levels.
- The level being played when the container stops has no demo: Alpine Faction never gets to finish it.
- Alpine Faction gives up on a demo over `fflink_demo_max_mb` (100 MB at most).
- `fflink_demo_upload = false` in the config keeps the demos on the server only.

`docker stop` stops the whole container at once, without telling the server, so the level being played then has no end. The bridge ends it as abandoned (`server_shutdown`) the next time the container starts, and the Interposer delivers whatever it had recorded.

A level is only reported once `MATCH_STATS_MIN_PLAYERS` human players (default 1) have been in it, so an empty server cycling through its rotation reports nothing.

Weapon names are the stock `weapons.tbl`'s. On a server running a TC mod (`-mod`) or changing the weapon tables, only the weapon's number (`weapon_id`) is given.

While the match statistics are on, nothing reaches FactionFiles, and clients see the server as stats-enabled, as they would one reporting to FactionFiles. An `fflink_gsk` already in the config is kept and used.

`docker logs` shows the bridge's lines:

```
[rf-stats-bridge] listening on 127.0.0.1:443 for link.factionfiles.com
[rf-stats-bridge] Alpine Faction connected; reporting its games to http://lancommander.lan:1337
FactionFiles session established (server id 1).
[rf-stats-bridge] Recording match af:9846fb6fa92c1e57:1 (dm02, dm)
[rf-stats-bridge] Match af:9846fb6fa92c1e57:1 (dm02) ended: time_limit
Demo recording stopped: Z:\config\Merged\demos\dm02_20261115-174426.afd
Uploading demo dm02_20261115-174426.afd to FactionFiles...
[rf-stats-bridge] Demo dm02_9846fb6fa92c1e57_1.afd attached to match af:9846fb6fa92c1e57:1
Demo dm02_20261115-174426.afd uploaded (game af:9846fb6fa92c1e57:1)
```

### Hooks

| Hook | When |
|------|------|
| `PreInstallRedFaction` / `PostInstallRedFaction` | Around the game file check/download and the Alpine Faction copy |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **Server not in the LAN browser**: the browser finds servers by UDP broadcast, so the container needs its own LAN address (macvlan/ipvlan) or host networking. Clients can join by IP through port mapping; with a port other than 7755, give `<ip>:<port>`.
- **Server not in the internet browser**: `RF_LAN_ONLY` is `true` by default. Set it to `false` to announce the server to the game tracker set in the `GameTracker` registry value.
- **A level is missing from the rotation**: it isn't installed and couldn't be downloaded. Put the `.rfl` (or its `.vpp`) in `Overlay/user_maps/multi/`.
- **Alpine Faction says the executable is unsupported**: it needs the original 1.20 NA `RF.exe`. Point `RF_EXE` at it.
- **Changing the config without a restart**: `sv_loadconfig` over RCON (a `full_admin` rcon profile) reloads the TOML.
- **Match statistics don't arrive**: look for the `[rf-stats-bridge]` lines in `docker logs`, then in `/config/.interposer/Logs/` for `[MATCH ERROR]` lines. `MATCH_STATS_GAME_ID` must be set, the URL must be `http://`, and the token needs the **Report matches** scope. `FactionFiles session exchange failed` means the bridge wasn't listening.
- **No console commands**: the dedicated console reads from its own Win32 console, not `docker attach`. Use RCON from a game client (`rcon_request <password>`, then `rcon <command>`).
