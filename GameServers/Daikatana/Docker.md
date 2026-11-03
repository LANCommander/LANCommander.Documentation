---
sidebar_label: Docker
---

# Daikatana Docker Container

This Docker container runs a Daikatana dedicated server. It is built on the WINE image and runs the community Daikatana v1.3 dedicated server, `dk_ded.exe`, on a virtual display. The container doesn't download the game, so you provide a v1.3 install.

## Quick Start

```yaml
services:
  daikatana:
    image: lancommander/daikatana:latest
    container_name: daikatana

    ports:
      - 27992:27992/udp
      - 27982:27982/udp

    volumes:
      - "/data/Servers/Daikatana/Deathmatch:/config"

    environment:
      DAIKATANA_SERVER_NAME: "My Daikatana Server"
      DAIKATANA_MODE: "dm"
      DAIKATANA_MAP: "e1dm1"
      DAIKATANA_MAPS: "e1dm1 e1dm2 e2dm1 e2dm2 e3dm1 e3dm2 e4dm1 e4dm2"
      DAIKATANA_TIME_LIMIT: "15"
      DAIKATANA_RCON_PASSWORD: "changeme"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Before the first start, copy a Daikatana v1.3 install (the folder with `dk_ded.exe` and `data/`) into `Server/`, or set `DAIKATANA_ARCHIVE_URL` to a zip of it.

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitialization/20-InstallDaikatana.ps1` checks for `Server/dk_ded.exe`. If it's missing and `DAIKATANA_ARCHIVE_URL` is set, the hook downloads the zip and moves the shallowest folder holding `dk_ded.exe` and `data/` into `Server/`. It leaves out `data/music/`, `Intro.exe` and `*.pdb`, fixes the file modes and remounts the overlay.
3. `PostInitialization/30-ConfigureDaikatana.ps1` writes `data/lancommander.cfg` from the `DAIKATANA_*` variables. It reads the map list from the directories of `data/*.pak` (plus `data/maps/*.bsp`), warns about a start map that doesn't exist, and drops missing maps from the rotation.
4. `START_EXE` (`/usr/local/bin/daikatana-server`) runs, from the server folder under Wine and Xvfb:

   ```
   dk_ded.exe -portable +set dedicated 1 +set port <DAIKATANA_PORT> +set logfile 2 +exec lancommander.cfg [START_ARGS] +map <DAIKATANA_MAP>
   ```

   `-portable` keeps configs, saves and the log in `data/` (in `Overlay/`) instead of the Wine user's `Documents/My Games/Daikatana`. The console is a window on the virtual display, so the launcher follows the log, `data/dk_console.log` (recreated on every start), into `docker logs`.

A healthy start ends with:

```
6b7338f (2023-08-17 08:14:07 -0400)

------- Daikatana Initialized -------

execing lancommander.cfg
Initializing GameSpy
------- Server Initialization -------
info_player_start
Map: e1dm1
-------------------------------------
```

## Configuration Options

### Ports

- **27992/udp**: Game (`DAIKATANA_PORT`)
- **27982/udp**: GameSpy query (`\status\`), always the game port minus 10

The game port also answers Quake II style out-of-band queries (`ÿÿÿÿstatus`, `ÿÿÿÿinfo 34`) and rcon.

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### lancommander.cfg and server.cfg

`data/lancommander.cfg` is regenerated on every start. Put your own cvars in `data/server.cfg` in `Overlay/`:

- With `DAIKATANA_MAP` set, `lancommander.cfg` execs `server.cfg` first and then sets the `DAIKATANA_*` values, so the variables win.
- With `DAIKATANA_MAP` empty, `server.cfg` runs last and must start a map itself (`map e1dm1`).

Useful cvars (the server lists them with descriptions through `rcon <password> cvarlist`):

| Cvar | Meaning |
|------|---------|
| `deathmatch`, `dm_teamplay`, `ctf`, `deathtag`, `coop` | Game mode (set by `DAIKATANA_MODE`) |
| `dm_instagib` | `1` random weapons, `2` fixed weapon set, `3` rocket arena |
| `maps_dm`, `maps_ctf`, `maps_deathtag` | Space-separated rotation per mode |
| `sv_auto_rotate_map` | `1` rotates on the time limit even with no players |
| `sv_lockout_old_builds` | `1` drops clients on older v1.3 builds |
| `allow_download_maps` | Lets clients download missing maps (on by default) |
| `dm_use_skill_system` | The deathmatch level-up system |
| `admin`, `email`, `website` | Shown in GameSpy-compatible browsers |
| `coop_password`, `coop_checkpoints` | Co-op stats and checkpoints |

The `maps_*` cvars are latched: a change applies on the next map.

### Remote Console

With `DAIKATANA_RCON_PASSWORD` set, use any Quake II rcon tool on the game port, or `rcon` from the in-game console. `sv_rcon_banned_commands` blocks `killserver`, `quit` and a few others over rcon unless `rcon_master_password` is used.

### Custom Maps

Put `.bsp` files in `Overlay/data/maps/`, then name them in `DAIKATANA_MAP`/`DAIKATANA_MAPS`. Clients without the map download it when `allow_download_maps` is on.

### Hooks

| Hook | When |
|------|------|
| `PreInstallDaikatana` / `PostInstallDaikatana` | Around the install check/download |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **`dk_ded.exe not found` and the container exits**: copy an install into `Server/` or set `DAIKATANA_ARCHIVE_URL`.
- **Exits immediately with no log**: the server is a GUI program and quits without a display. Keep `WINE_XVFB=true`.
- **`Can't find map maps/<name>.bsp` over and over**: a rotation map is missing. The configure hook drops missing maps from `DAIKATANA_MAPS`, but rotation cvars set in `server.cfg` aren't checked.
- **The map never changes**: rotation happens when the time or frag limit is hit. With no players, set `sv_auto_rotate_map 1` in `server.cfg`.
- **Clients get "outdated version" or BSP version errors**: client and server must run the same v1.3 build.
- **Not in the in-game server list**: LAN discovery is untested with this image. It needs the container on the LAN itself (macvlan/ipvlan, or `network_mode: host`).
