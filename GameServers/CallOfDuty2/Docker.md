---
sidebar_label: Docker
---

# Call of Duty 2 Docker Container

This Docker container runs a Call of Duty 2 dedicated server. It is built on the base image and runs the official 1.3 Linux dedicated server (`cod2_lnxded`), which it downloads on first start. You supply the retail game data.

## Quick Start

```yaml
services:
  callofduty2:
    image: lancommander/callofduty2:latest
    container_name: callofduty2

    ports:
      - 28960:28960/udp

    volumes:
      - "/data/Servers/Call of Duty 2/Team Deathmatch:/config"

    environment:
      COD2_SERVER_NAME: "My Call of Duty 2 Server"
      COD2_GAME_TYPE: "tdm"
      COD2_RCON_PASSWORD: "changeme"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Before the first start, copy `localization.txt` and the `main/` folder of a Call of Duty 2 1.3 install into `Server/`.

## How It Starts

1. `PostInitialization/20-InstallCallOfDuty2.ps1` downloads `COD2_SERVER_URL`, checks it against `COD2_SERVER_SHA256` and unpacks it into `Server/` (`cod2_lnxded`, `README.linux`, `pb/*.so`). It records the URL in `Server/.cod2-server-url` and skips the download on later starts unless the URL changes. After installing it remounts the overlay so the new files show up in `Merged/`.
2. `PostInitialization/30-ConfigureCallOfDuty2.ps1` checks for `main/iw_00.iwd` and writes the non-empty `COD2_*` settings into `<COD2_FS_GAME or main>/lancommander.cfg` as `set` commands. That file starts with `exec server.cfg`, so your own `server.cfg` runs first and the `COD2_*` settings override it. The hook writes through `Merged/`, so the file lands in `Overlay/`.
3. `START_EXE` (`/usr/local/bin/cod2-server`) runs from `Merged/`:

   ```text
   ./cod2_lnxded +set dedicated 1 +set net_port 28960 +set fs_basepath /config/Merged
       +set fs_homepath /config/Merged [+set fs_game <COD2_FS_GAME>] +set sv_punkbuster 0
       +exec lancommander.cfg <START_ARGS> +map_rotate
   ```

   `map_rotate` loads the first entry of `sv_mapRotation`. Base and home path both point at `Merged/`, so `config_mp_server.cfg`, `games_mp.log` and anything else the server writes land in `Overlay/main/`.

The server console prints to `docker logs`.

## Configuration Options

### Ports

- **28960/udp**: game, `getstatus`/`getinfo` queries, RCON and LAN browser (`COD2_PORT`)
- **80/tcp**: HTTP fast download, only with `HTTP_FILESERVER_ENABLED=true`

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### server.cfg

`Overlay/main/server.cfg` (or `Overlay/<COD2_FS_GAME>/server.cfg`) is yours to create and edit. Any console command works there, for example `set g_antilag 1`, `set scr_teambalance 1`, `set sv_maxPing 200` or `set logfile 1`. `COD2_*` variables that are set override the same settings in it; clear a variable (set it to `""`) to control that setting from `server.cfg` instead. To use a mixed rotation (`gametype ctf map mp_carentan gametype sd map mp_toujane ...`), clear `COD2_MAPS` and set `sv_mapRotation` in `server.cfg`.

### Game types

| `COD2_GAME_TYPE` | Mode |
|------------------|------|
| `dm` | Deathmatch |
| `tdm` | Team Deathmatch |
| `sd` | Search and Destroy |
| `ctf` | Capture the Flag |
| `hq` | Headquarters |

`COD2_TIME_LIMIT` and `COD2_SCORE_LIMIT` set the cvars of the selected game type (`scr_tdm_timelimit`, `scr_ctf_scorelimit` ...). The other game-type cvars (`scr_sd_roundlimit`, `scr_hq_timelimit` ...) go in `server.cfg`.

### Mods and fast download

Put a mod in `Overlay/<folder>/` and set `COD2_FS_GAME` to that folder (e.g. `mods/mymod`). With `COD2_ALLOW_DOWNLOAD=1` (the default) clients download missing `.iwd` files from the game server, which is slow. For HTTP downloads set `HTTP_FILESERVER_ENABLED=true`, publish port 80, and set `COD2_WWW_BASE_URL` to `http://<server address>`. Clients then fetch `<COD2_WWW_BASE_URL>/<fs_game>/<file>.iwd`.

### Hooks

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/` to run at the base image's lifecycle hooks (`PreInitialization`, `PostInitialization`, `ServerStarted`, `ServerStopped`), or at `PreInstallCallOfDuty2` / `PostInstallCallOfDuty2` around the server install.

## Troubleshooting

- **`main/iw_00.iwd not found`**: the retail game data isn't in `Server/`. Copy `main/` and `localization.txt` from a Call of Duty 2 install patched to 1.3.
- **Clients get "server uses a different protocol" or can't connect**: the server is 1.3 (protocol 118); clients must be 1.3 as well.
- **"Resolving cod2master.activision.com" / "Sending heartbeat" in the log in LAN mode**: the 1.3 server sends these even with `dedicated 1`. They are harmless and nothing depends on them.
- **"couldn't exec server.cfg"**: there is no `server.cfg` yet. This is harmless; the `COD2_*` settings still apply.
- **RCON or query replies stop for a moment**: the server rate-limits RCON and status requests from the same address. Wait about a second between requests.
- **Server not in the LAN browser**: the browser finds servers by UDP broadcast, so the container needs its own LAN address (macvlan/ipvlan) or host networking. With port mapping, clients join by IP.
- **`libstdc++.so.5` errors**: the image installs `libstdc++5:i386`. This only shows up if you replace `START_EXE` with a binary in a different location that needs other libraries.
