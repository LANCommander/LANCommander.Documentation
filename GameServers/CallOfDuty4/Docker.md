---
sidebar_label: Docker
---

# Call of Duty 4: Modern Warfare Docker Container

This Docker container runs a Call of Duty 4: Modern Warfare dedicated server. It is built on the base image and runs the official 1.7 Linux dedicated server (`cod4_lnxded`), which it downloads on first start. You supply the retail game data.

## Quick Start

```yaml
services:
  callofduty4:
    image: lancommander/callofduty4:latest
    container_name: callofduty4

    ports:
      - 28960:28960/udp

    volumes:
      - "/data/Servers/Call of Duty 4/Team Deathmatch:/config"

    environment:
      COD4_SERVER_NAME: "My Call of Duty 4 Server"
      COD4_GAME_TYPE: "war"
      COD4_RCON_PASSWORD: "changeme"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Before the first start, copy `localization.txt`, the `.iwd` files in `main/` and the `zone/` folder of a Call of Duty 4 1.7 install into `Server/`.

## How It Starts

1. `PostInitialization/20-InstallCallOfDuty4.ps1` downloads `COD4_SERVER_URL`, checks it against `COD4_SERVER_SHA256` and unpacks it into `Server/` (`cod4_lnxded`, `README.linux`). It records the URL in `Server/.cod4-server-url` and skips the download on later starts unless the URL changes. After installing it remounts the overlay so the new files show up in `Merged/`.
2. `PostInitialization/30-ConfigureCallOfDuty4.ps1` checks for `main/iw_00.iwd` and `zone/english/common_mp.ff` and writes the non-empty `COD4_*` settings into `<COD4_FS_GAME or main>/lancommander.cfg` as `set` commands. That file starts with `exec server.cfg`, so your own `server.cfg` runs first and the `COD4_*` settings override it. The hook writes through `Merged/`, so the file lands in `Overlay/`.
3. `START_EXE` (`/usr/local/bin/cod4-server`) runs from `Merged/`:

   ```text
   ./cod4_lnxded +set dedicated 1 +set net_port 28960 +set fs_basepath /config/Merged
       +set fs_homepath /config/Merged [+set fs_game <COD4_FS_GAME>] +set sv_punkbuster 0
       +exec lancommander.cfg <START_ARGS> +map_rotate
   ```

   `map_rotate` loads the first entry of `sv_mapRotation`. Base and home path both point at `Merged/`, so `games_mp.log` and anything else the server writes land in `Overlay/main/`.

The server console prints to `docker logs`.

## Configuration Options

### Ports

- **28960/udp**: game, `getstatus`/`getinfo` queries, RCON and LAN browser (`COD4_PORT`)
- **80/tcp**: HTTP fast download, only with `HTTP_FILESERVER_ENABLED=true`

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### server.cfg

`Overlay/main/server.cfg` (or `Overlay/<COD4_FS_GAME>/server.cfg`) is yours to create and edit. Any console command works there, for example `set scr_teambalance 1`, `set sv_maxPing 200`, `set scr_oldschool 1` or `set logfile 1`. `COD4_*` variables that are set override the same settings in it; clear a variable (set it to `""`) to control that setting from `server.cfg` instead. To use a mixed rotation (`gametype dom map mp_crash gametype sd map mp_strike ...`), clear `COD4_MAPS` and set `sv_mapRotation` in `server.cfg`.

### Game types

| `COD4_GAME_TYPE` | Mode |
|------------------|------|
| `dm` | Free-for-all |
| `war` | Team Deathmatch |
| `sd` | Search and Destroy |
| `sab` | Sabotage |
| `dom` | Domination |
| `koth` | Headquarters |

`COD4_TIME_LIMIT` and `COD4_SCORE_LIMIT` set the cvars of the selected game type (`scr_war_timelimit`, `scr_dom_scorelimit` ...). The other game-type cvars (`scr_sd_roundlimit`, `scr_koth_timelimit` ...) go in `server.cfg`.

### Mods and fast download

Call of Duty 4 loads mods only from `mods/<name>/` (lowercase `mods`; the retail install's `Mods/` folder holds the mod tools sample and isn't seen by the Linux server). Put a mod in `Overlay/mods/<name>/` and set `COD4_FS_GAME` to `mods/<name>`. With `COD4_ALLOW_DOWNLOAD=1` (the default) clients download the mod's `.iwd` and `mod.ff` files from the game server, which is slow. For HTTP downloads set `HTTP_FILESERVER_ENABLED=true`, publish port 80, and set `COD4_WWW_BASE_URL` to `http://<server address>`. Clients then fetch `<COD4_WWW_BASE_URL>/mods/<name>/<file>`.

### Hooks

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/` to run at the base image's lifecycle hooks (`PreInitialization`, `PostInitialization`, `ServerStarted`, `ServerStopped`), or at `PreInstallCallOfDuty4` / `PostInstallCallOfDuty4` around the server install.

## Troubleshooting

- **`main/iw_00.iwd or zone/english/common_mp.ff not found`**: the retail game data isn't in `Server/`. Copy `main/*.iwd`, `zone/` and `localization.txt` from a Call of Duty 4 install patched to 1.7.
- **Clients can't connect or see a version mismatch**: the server is 1.7 (protocol 6); clients must be 1.7 as well.
- **"Resolving cod4master.activision.com" / "Sending heartbeat" in the log in LAN mode**: the server sends these even with `dedicated 1`. They are harmless and nothing depends on them.
- **"Error: Unable to initialize punkbuster"**: PunkBuster isn't installed. This is expected with `COD4_PUNKBUSTER=0`.
- **"couldn't exec server.cfg"**: there is no `server.cfg` yet. This is harmless; the `COD4_*` settings still apply.
- **Hundreds of `WARNING: unknown dvar 'bg_shock_volume_*'` lines at startup**: the dedicated server has no sound system, so the shock files' volume settings don't exist. They are harmless.
- **RCON or query replies stop for a moment**: the server rate-limits RCON and status requests from the same address. Wait about a second between requests.
- **Server not in the LAN browser**: the browser finds servers by UDP broadcast, so the container needs its own LAN address (macvlan/ipvlan) or host networking. With port mapping, clients join by IP.
- **The 1.7 tarball from icculus.org**: its `cod4_lnxded-bin` is a 1.6 build. Only `cod4_lnxded` is 1.7, which is why the `server-1.7` package contains only that file and `README.linux`.
