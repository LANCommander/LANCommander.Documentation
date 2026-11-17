# Half-Life Docker Container

This Docker container provides a Half-Life (GoldSrc) dedicated server. It automatically downloads and updates HLDS via SteamCMD and supports file overlaying using OverlayFS. The same image runs any GoldSrc game, such as Counter-Strike 1.6, Day of Defeat or Team Fortress Classic.

## Quick Start

```yaml
services:
  halflife-deathmatch:
    image: lancommander/halflife:latest
    container_name: halflife-deathmatch

    ports:
      - 27015:27015/udp

    volumes:
      - "/data/Servers/Half-Life/Deathmatch:/config"

    environment:
      STEAM_APP_UPDATE: "true"
      START_ARGS: "-game valve -port 27015 +maxplayers 16 +map crossfire"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

## Configuration Options

### Ports

- **27015/udp**: Game server port. Clients connect and query the server on this port. RCON also uses it.
- **80/tcp**: HTTP file server (optional). Serves custom content for `sv_downloadurl`.

GoldSrc has no SourceTV port. HLTV is a separate `hltv` process and isn't started by this image.

### Volumes

The container requires a volume mount for `/config`, which stores:

- **Server/**: HLDS files downloaded by SteamCMD (auto-created)
- **Overlay/**: Custom files that overlay the server directory
- **Merged/**: OverlayFS merged view, where the server runs (auto-created)
- **Scripts/**: Custom PowerShell scripts for hooks

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `STEAM_APP_UPDATE` | Run SteamCMD on startup (`"true"`/`"false"`) | `"true"` |
| `STEAM_INSTALL_ATTEMPTS` | How many times to run SteamCMD if it fails | `"3"` |
| `STEAM_VALIDATE` | Validate files on every update | `"true"` |
| `STEAM_BRANCH` | Steam beta branch | `""` |
| `GAME_MOD` | Game content SteamCMD downloads | `"valve"` |
| `GAME_APP_ID` | Overrides the app ID written to `steam_appid.txt` | Derived from `GAME_MOD` |
| `START_EXE` | Server executable | `"hlds_run"` |
| `START_ARGS` | Arguments passed to the server | `"-game valve -console -port 27015 +maxplayers 16 +map crossfire"` |
| `HTTP_FILESERVER_ENABLED` | Enable the HTTP file server | `"false"` |
| `HTTP_FILESERVER_WEB_ROOT` | Directory served over HTTP | `"/config/Merged/valve"` |
| `HTTP_FILESERVER_FILE_PATTERN` | Regex of paths the HTTP file server allows | maps, models, sound, sprites, gfx, overviews |

#### `GAME_MOD`

HLDS is one Steam app (`90`) shared by every GoldSrc game. The content to download is chosen with SteamCMD's `app_set_config 90 mod <mod>`, which this image runs when `GAME_MOD` is anything other than `valve`.

| Game | `GAME_MOD` | App ID |
|------|------------|--------|
| Half-Life | `valve` | 70 |
| Counter-Strike | `cstrike` | 10 |
| Team Fortress Classic | `tfc` | 20 |
| Day of Defeat | `dod` | 30 |
| Deathmatch Classic | `dmc` | 40 |
| Opposing Force | `gearbox` | 50 |
| Ricochet | `ricochet` | 60 |
| Condition Zero | `czero` | 80 |

Remember to also change `-game` in `START_ARGS` and `HTTP_FILESERVER_WEB_ROOT`.

#### `START_ARGS`

Common parameters:

- `-game <mod>`: Game directory to run
- `-port <port>`: Server port (default 27015)
- `-insecure`: Disable VAC
- `-norestart`: Stop `hlds_run` from restarting the server when it crashes, so Docker's restart policy handles it instead
- `+maxplayers <n>`: Player slots. This can only be set on the command line.
- `+map <map>`: Starting map (required)
- `+sv_lan 1`: LAN-only server
- `+rcon_password <password>`: RCON password
- `+hostname "<name>"`: Server name

### Server Configuration

GoldSrc reads `server.cfg` from the game directory itself:

```
/config/Overlay/valve/server.cfg
```

**Example:**
```
hostname "My Half-Life Server"
sv_lan 1
mp_timelimit 20
mp_fraglimit 50
rcon_password "your_rcon_password"
```

The map cycle is `valve/mapcycle.txt`.

## Match Statistics

The server can report the matches played on it to LANCommander, with the
[LANCommander match statistics plugin for Metamod](https://github.com/LANCommander/LANCommander.MatchStatistics.MetaMod).
The plugin and [Metamod-P](https://github.com/Bots-United/metamod-p) are built into the image. The plugin is turned on
when `MATCH_STATS_SERVER_URL` and `MATCH_STATS_TOKEN` are set, and is then copied into the game directory (`-game` in
`START_ARGS`, otherwise `GAME_MOD`) on every start. It reports Counter-Strike 1.6 and Condition Zero, Day of Defeat,
Team Fortress Classic, Natural Selection, Half-Life deathmatch and Ricochet in detail, and the kills and frags of any
other Metamod game.

On every start, with the statistics on:

- If `liblist.gam`'s `gamedll_linux` doesn't load Metamod yet, Metamod-P is installed in `<game>/addons/metamod/` and
  `gamedll_linux` is pointed at it. Metamod's `config.ini` loads the original game DLL. A Metamod you installed
  yourself (for AMX Mod X, say) is kept, and the plugin is added to its `plugins.ini`.
- The plugin goes into `<game>/addons/lancommander/dlls/`, and its line into `addons/metamod/plugins.ini`.
- The settings are written to `<game>/addons/lancommander/lancommander.cfg` as `lc_*` cvars. Metamod runs it at startup
  from `addons/metamod/exec.cfg`.

Turned off, all of this is undone and `liblist.gam` loads the game DLL directly again. Metamod stays if `plugins.ini`
still loads other plugins.

| Variable | Description | Default |
|----------|-------------|---------|
| `MATCH_STATS_ENABLED` | `auto`: on when `MATCH_STATS_SERVER_URL` and `MATCH_STATS_TOKEN` are set. `true` or `false` | `auto` |
| `MATCH_STATS_SERVER_URL` | The LANCommander server, e.g. `http://lancommander.lan:1337`. Only `http://` works on Linux | *(empty)* |
| `MATCH_STATS_TOKEN` | A LANCommander access token with the **Report matches** scope (Profile → Access Tokens). It isn't written to any file | *(empty)* |
| `MATCH_STATS_GAME_ID` | The game's id in LANCommander | *(empty)* |
| `MATCH_STATS_SERVER_ID` | This server's id in LANCommander, if LANCommander manages it | *(empty)* |
| `MATCH_STATS_REPORTER_NAME` | How the server is named in LANCommander | *(hostname)* |
| `MATCH_STATS_MIN_PLAYERS` | Human players needed before a match is recorded | *(1)* |
| `MATCH_STATS_MODE` | The mode reported. Empty lets the game module decide | *(empty)* |
| `MATCH_STATS_RECORD_BOTS` | Record bots as players (`true`/`false`) | *(true)* |
| `MATCH_STATS_RECORD_CHAT` | Record chat messages (`true`/`false`) | *(false)* |

Settings left empty aren't written, so they and the plugin's other `lc_*` cvars (see its README) can be set in
`server.cfg` instead, which runs after `lancommander.cfg`. A `lancommander.cfg` you put in
`Overlay/<game>/addons/lancommander/` yourself is left alone.

`lc_status` on the server console or over RCON shows the match being recorded and how delivery is going. Reports that
couldn't be delivered yet are kept in `Overlay/<game>/addons/lancommander/dlls/.interposer/Matches/` and sent once
LANCommander can be reached.

## Custom Hooks

PowerShell scripts in `/config/Scripts/Hooks/{HookName}/` run at points in the container's lifecycle:

- `PreSteamInstallGame`: Before SteamCMD runs
- `PostSteamInstallGame`: After SteamCMD completes
- `ServerStarted` / `ServerStopped`

Hooks shipped in this image (copied into `/config/Scripts/Hooks` on every start):

- `PostInitialization/20-InstallGame.ps1`: Installs HLDS. It applies `GAME_MOD`, retries SteamCMD, runs `PostSteamInstallGame`, then remounts the overlay so anything SteamCMD or those hooks added to `Server/` shows up in `Merged/`.
- `PostInitialization/30-ConfigureSteam.ps1`: Seeds `steam_appid.txt` and links `~/.steam/sdk32/steamclient.so`. Without these, HLDS fails its first launch with `Unable to initialize Steam`.
- `PostInitialization/40-InstallMatchStatistics.ps1`: Installs or removes Metamod-P and the match statistics plugin. See [Match Statistics](#match-statistics).

## Troubleshooting

### `FATAL ERROR (shutting down): Unable to initialize Steam.`

`steam_appid.txt` is missing or holds the wrong app ID. The `30-ConfigureSteam.ps1` hook creates it if it's missing, but it doesn't overwrite an existing one. Delete `/config/Overlay/steam_appid.txt` or set `GAME_APP_ID`.

### `Error! App '90' state is 0x... after update job`

App 90 often needs more than one SteamCMD pass. The install hook retries up to `STEAM_INSTALL_ATTEMPTS` times. If that still fails, restart the container.

### OverlayFS warnings

Make sure the container runs as root with `cap_add: SYS_ADMIN`, and with `security_opt: apparmor:unconfined` on Ubuntu hosts.

## Additional Resources

- [Half-Life Dedicated Server](https://developer.valvesoftware.com/wiki/Half-Life_Dedicated_Server)
- [SteamCMD](https://developer.valvesoftware.com/wiki/SteamCMD)
