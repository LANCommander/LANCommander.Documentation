---
sidebar_label: Docker
---

# Medal of Honor: Allied Assault Docker Container

This Docker container runs a Medal of Honor: Allied Assault dedicated server, for the base game, Spearhead or Breakthrough. It is built on the base image and runs [OpenMoHAA](https://github.com/openmoh/openmohaa)'s Linux dedicated server (`omohaaded`), which the original game clients can join. You supply the retail game data.

## Quick Start

```yaml
services:
  mohaa:
    image: lancommander/medalofhonoralliedassault:latest
    container_name: mohaa

    ports:
      - 12203:12203/udp
      - 12300:12300/udp

    volumes:
      - "/data/Servers/Medal of Honor - Allied Assault/Team Deathmatch:/config"

    environment:
      MOHAA_GAME: "aa"
      MOHAA_SERVER_NAME: "My Medal of Honor Server"
      MOHAA_GAME_TYPE: "tdm"
      MOHAA_RCON_PASSWORD: "changeme"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Before the first start, copy the `main/` folder of a MOH:AA 1.11 install into `Server/`, plus `mainta/` (Spearhead) and `maintt/` (Breakthrough) if you want to run those.

## How It Starts

1. `PostInitialization/30-ConfigureMOHAA.ps1` writes the non-empty `MOHAA_*` settings into `<game dir>/lancommander.cfg` as `set` commands (`main`, `mainta` or `maintt`, from `MOHAA_GAME`). That file starts with `exec server.cfg`, so your own `server.cfg` runs first and the `MOHAA_*` settings override it, and ends with `map <first map of the rotation>`. The hook writes through `Merged/`, so the file lands in `Overlay/`.
2. `START_EXE` (`/usr/local/bin/mohaa-server`) checks for `main/Pak0.pk3` (and `mainta/pak1.pk3` or `maintt/pak1.pk3`), then runs from `Merged/`:

   ```text
   /opt/openmohaa/omohaaded +set dedicated 1 +set net_port 12203 +set net_gamespy_port 12300
       +set com_target_game 0 +set fs_basepath /config/Merged +set fs_homepath /config/Merged
       <START_ARGS> +exec lancommander.cfg
   ```

   OpenMoHAA itself (`omohaaded`, `game.so`, `libcurl.so.4`) lives in the image under `/opt/openmohaa`, not in `/config`. Base and home path both point at `Merged/`, so configs, logs and anything else the server writes land in `Overlay/<game dir>/`.

The server console prints to `docker logs`.

## Configuration Options

### Ports

- **12203/udp**: game and RCON (`MOHAA_PORT`)
- **12300/udp**: GameSpy queries, used by the in-game server browser and LAN search (`MOHAA_GAMESPY_PORT`)

The server reports both ports to clients and the master server, so the container and host ports must match.

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### Games

| `MOHAA_GAME` | Game | Game dir | Needs |
|--------------|------|----------|-------|
| `aa` | Allied Assault | `main` | `main/` |
| `sh` | Spearhead | `mainta` | `main/`, `mainta/` |
| `bt` | Breakthrough | `maintt` | `main/`, `maintt/` |

Clients must run the same game: Allied Assault clients can't join a Spearhead server and so on.

### Game types

| `MOHAA_GAME_TYPE` | `g_gametype` | Mode |
|-------------------|--------------|------|
| `ffa` | 1 | Free for All |
| `tdm` | 2 | Team Deathmatch |
| `round` | 3 | Round-based |
| `obj` | 4 | Objective |
| `tow` | 5 | Tug of War (Spearhead, Breakthrough) |
| `lib` | 6 | Liberation (Breakthrough) |

With `MOHAA_MAPS` empty the server uses the stock maps for the game and game type (see the README). Otherwise list maps by their path under `maps/` without `.bsp`, e.g. `dm/mohdm6 obj/obj_team2`.

### server.cfg

`Overlay/<game dir>/server.cfg` is yours to create and edit. Any console command works there, for example `set sv_maxping 200`, `set g_healthdrop 0`, `bitset dmflags 18` or `set sv_sprinton 1`. `MOHAA_*` variables that are set override the same settings in it; clear a variable (set it to `""`) to control that setting from `server.cfg` instead. Don't put a `map` command in it: `lancommander.cfg` loads the map. OpenMoHAA also reads `server_opm.cfg` examples from its [docs](https://github.com/openmoh/openmohaa/tree/main/docs/markdown/03-configuration), including bots.

### Mods

Put extra `.pk3` files in `Overlay/<game dir>/`. Clients need the same files.

### Hooks

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/` to run at the base image's lifecycle hooks (`PreInitialization`, `PostInitialization`, `ServerStarted`, `ServerStopped`).

## Troubleshooting

- **`main/Pak0.pk3 not found`** (or `mainta/pak1.pk3`, `maintt/pak1.pk3`): the retail game data isn't in `Server/`, or `MOHAA_GAME` picks an expansion you didn't copy.
- **"couldn't exec server.cfg"**: there is no `server.cfg` yet. This is harmless; the `MOHAA_*` settings still apply.
- **Clients can't connect or get a version mismatch**: original clients must be patched (1.11, Spearhead 2.15, Breakthrough 2.40b) and must run the game `MOHAA_GAME` selects.
- **Server not in the LAN search**: the search broadcasts to the GameSpy port, so the container needs its own LAN address (macvlan/ipvlan) or host networking, and `MOHAA_GAMESPY_PORT` must stay `12300`. With port mapping, clients join by IP.
- **Map doesn't load / "Can't find map"**: the map name is wrong or belongs to another game (Breakthrough maps need `MOHAA_GAME=bt`). Map names are paths under `maps/` without `.bsp`.
