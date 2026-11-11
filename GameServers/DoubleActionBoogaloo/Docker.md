---
sidebar_label: Docker
---

# Double Action: Boogaloo Docker Container

This Docker container runs a Double Action: Boogaloo dedicated server. It is built on the WINE image. The server's game content has only Windows binaries, so the container runs the Windows `srcds.exe -game dab` under Wine.

## Quick Start

```yaml
services:
  doubleactionboogaloo:
    image: lancommander/doubleactionboogaloo:latest
    container_name: doubleactionboogaloo

    ports:
      - 27015:27015/udp
      - 27015:27015/tcp

    volumes:
      - "/data/Servers/Double Action - Boogaloo/Deathmatch:/config"

    environment:
      DAB_HOSTNAME: "My Double Action Server"
      DAB_RCON_PASSWORD: "changeme"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitialization/20-InstallDoubleAction.ps1`:
   - runs SteamCMD with `+@sSteamCmdForcePlatformType windows +app_info_update 1 +app_update 317800` into `Server/`. It retries with `validate` (`STEAM_INSTALL_ATTEMPTS`) until `srcds.exe` and `dab/bin/server.dll` exist.
   - chowns `Server/` to the server user and remounts the overlay, so the new files show up in `Merged/`.
3. `PostInitialization/25-InstallSourceMod.ps1` installs the Windows builds of Metamod:Source and SourceMod into `dab/addons/`, if they aren't there yet (`INSTALL_SOURCEMOD`).
4. `PostInitialization/30-InstallMatchStatistics.ps1` installs the LANCommander match statistics plugin when it's turned on (`MATCH_STATS_*`), or removes it.
5. `START_EXE` (`/usr/local/bin/dab-server`) writes `dab/cfg/lancommander.cfg` from the `DAB_*` variables, then runs `wine-run srcds.exe -console -game dab -condebug -port <DAB_PORT> +maxplayers <DAB_MAX_PLAYERS> <DAB_EXTRA_ARGS> +servercfgfile lancommander.cfg +map <DAB_MAP>` under Xvfb. It also follows `da_info/console.log` to stdout.

The first start downloads about 2.3 GB from Steam, so it takes several minutes. Under Wine the server answers queries about a minute after `Starting: srcds.exe ...`.

### Why Wine

The Linux depot of app 317800 is the 2014 release: its `srcds_linux` crashes in `BreakpadMiniDumpSystemInit`. Its game content depot is shared with the game and has been updated since, but it only contains Windows binaries (`dab/bin/server.dll`), with no `server.so`. The Windows engine from the same app loads the current `server.dll` under Wine.

## Configuration Options

### Ports

- **27015/udp**: game traffic and server queries (`DAB_PORT`)
- **27015/tcp**: RCON. srcds listens on the container's IP address, not on `127.0.0.1`.

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### Server Configuration

The stock `dab/cfg/server.cfg` runs on every map load. It sets `hostname "Double Action: Boogaloo"`, `sv_lan 0`, `bot_quota 2` and `sv_allow_votes 1`, then runs `banned_ip.cfg`, `banned_user.cfg` and `server_custom.cfg` (none of which ship with the game). Because it runs after the command line, cvars passed as `+cvar` arguments would be overridden.

So `dab-server` sets `servercfgfile` to a generated `dab/cfg/lancommander.cfg`, which runs on every map load:

```
exec "server.cfg"          // DAB_SERVER_CFG
hostname "..."             // DAB_HOSTNAME
sv_lan "1"                 // DAB_LAN
sv_password ""             // DAB_PASSWORD
rcon_password "..."        // DAB_RCON_PASSWORD
```

Put your own settings in `Overlay/dab/cfg/server_custom.cfg`, which the stock `server.cfg` runs. To replace the stock file entirely, overlay `dab/cfg/server.cfg` or set `DAB_SERVER_CFG` to another file in `dab/cfg/`. `lancommander.cfg` is rewritten on every start, so don't edit it. `valve.rc` and `autoexec.cfg` run once at server start.

### Maps

The game ships `da_cocaine`, `da_doubletrouble`, `da_holdingcell`, `da_megachat`, `da_morgendorffer`, `da_official`, `da_rooftops`, `da_sacred`, `da_streets` and `da_trainingday`. `dab/mapcycle.txt` holds the rotation (all ten maps); overlay `dab/mapcycle.txt` or `dab/cfg/mapcycle.txt` to change it.

### Hooks

| Hook | When |
|------|------|
| `PreSteamInstallGame` / `PostSteamInstallGame` | Around the SteamCMD install of app 317800 |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |
| `PreInstallSourceMod` / `PostInstallSourceMod` | Around the Metamod:Source and SourceMod install |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

### SourceMod and Match Statistics

[Metamod:Source and SourceMod](https://www.sourcemod.net/) are installed into `dab/addons/` (in `Overlay/`) on the first start.
They're the Windows builds, because `srcds.exe` runs under Wine. They aren't updated afterwards: delete
`Overlay/dab/addons/metamod` or `Overlay/dab/addons/sourcemod` to have them installed again. Put plugins in
`Overlay/dab/addons/sourcemod/plugins/`. SourceMod has no gamedata for Double Action, so plugins that need SDK Tools'
game-specific functions may not work.

| Variable | Description | Default |
|----------|-------------|---------|
| `INSTALL_SOURCEMOD` | Install Metamod:Source and SourceMod | `true` |
| `METAMOD_MAJOR_VERSION` / `METAMOD_VERSION` | Metamod:Source build | `1.12` / `1.12.0-git1229` |
| `SOURCEMOD_MAJOR_VERSION` / `SOURCEMOD_VERSION` | SourceMod build | `1.12` / `1.12.0-git7259` |
| `METAMOD_URL` / `SOURCEMOD_URL` | Download these instead | |

The server can report the matches played on it to LANCommander, with the
[LANCommander match statistics plugin](https://github.com/LANCommander/LANCommander.MatchStatistics.SourceMod).
The plugin is built into the image and needs SourceMod. It is turned on when `MATCH_STATS_SERVER_URL` and
`MATCH_STATS_TOKEN` are set, and is then copied into `dab/addons/sourcemod/` on every start. The core plugin loads
its Double Action module itself. Turned off, the plugin's files are removed again.

| Variable | Description | Default |
|----------|-------------|---------|
| `MATCH_STATS_ENABLED` | `auto`: on when `MATCH_STATS_SERVER_URL` and `MATCH_STATS_TOKEN` are set. `true` or `false` | `auto` |
| `MATCH_STATS_SERVER_URL` | The LANCommander server, e.g. `http://lancommander.lan:1337` | *(empty)* |
| `MATCH_STATS_TOKEN` | A LANCommander access token with the **Report matches** scope (Profile → Access Tokens). It isn't written to any file | *(empty)* |
| `MATCH_STATS_GAME_ID` | The game's id in LANCommander | *(empty)* |
| `MATCH_STATS_SERVER_ID` | This server's id in LANCommander, if LANCommander manages it | *(empty)* |
| `MATCH_STATS_REPORTER_NAME` | How the server is named in LANCommander | *(hostname)* |
| `MATCH_STATS_MIN_PLAYERS` | Human players needed before a match is recorded | *(1)* |
| `MATCH_STATS_MODE` | The mode reported. Empty lets the game module decide | *(empty)* |
| `MATCH_STATS_RECORD_BOTS` | Record bots as players (`true`/`false`) | *(true)* |
| `MATCH_STATS_RECORD_CHAT` | Record chat messages (`true`/`false`) | *(false)* |
| `MATCH_STATS_ATTACH_DEMOS` | Upload SourceTV demos recorded with `tv_record` (`true`/`false`) | *(true)* |

The settings are written to `dab/cfg/sourcemod/lancommander.cfg` as `lc_*` cvars on every start. Settings left
empty aren't written, so they and the plugin's other `lc_*` cvars (see its README) can be set in
`dab/cfg/sourcemod/sourcemod.cfg` instead. A `lancommander.cfg` you put in `Overlay/dab/cfg/sourcemod/` yourself
is left alone.

`sm_lc_status` over RCON shows the match being recorded and how delivery is going. Reports that couldn't be
delivered yet are kept in `Overlay/dab/addons/sourcemod/extensions/.interposer/Matches/` and sent once LANCommander
can be reached.

## Troubleshooting

- **`ERROR! Failed to install app '317800' (Missing configuration)`** in the SteamCMD output: a fresh SteamCMD fails the first attempt with this error. The hook retries, and the second attempt installs the app.
- **Clients can't join: version mismatch**: the image always installs the newest content from Steam. Compare `PatchVersion` in `dab/steam.inf` on the server and the client, and update the client.
- **`hostname` or `sv_lan` isn't what you set**: a cfg that runs after `lancommander.cfg` sets it, e.g. a map config. Set it in `server_custom.cfg` or use the `DAB_*` variables.
- **No output in `docker logs` after `Starting: srcds.exe ...`**: srcds writes its console to `da_info/console.log` (DAB's write path, next to `dab/`) only after the engine has started. The first start under Wine can take a minute.
- **Harmless console messages**: `prop_dynamic_override ... no matching entry in propdata.txt`, `No such file scripts/weapons/...`, `Error loading cfg/trusted_keys_base.txt`, `'banned_ip.cfg' not present` and `'server_custom.cfg' not present` appear on every map load.
