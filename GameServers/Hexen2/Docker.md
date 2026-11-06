---
sidebar_label: Docker
---

# Hexen II Docker Container

This Docker container runs a Hexen II (1997) dedicated server. It is built on the base image and runs `h2ded` from [Hammer of Thyrion (uHexen2)](https://github.com/sezero/uhexen2) 1.5.9, which the image compiles from source. You supply the game data.

## Quick Start

```yaml
services:
  hexen2:
    image: lancommander/hexen2:latest
    container_name: hexen2

    ports:
      - 26900:26900/udp

    volumes:
      - "/data/Servers/Hexen II/Deathmatch:/config"

    environment:
      HEXEN2_SERVER_NAME: "My Hexen II Server"
      HEXEN2_MAP: "ravdm2"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Before the first start, copy the `data1/` folder (`pak0.pak` and `pak1.pak` patched to 1.11, plus Hammer of Thyrion's `progs.dat`/`progs2.dat` if you have them) into `Server/`. Add `portals/` for the mission pack and any mod folders next to it. A whole Hammer of Thyrion install directory works too.

## How It Starts

1. `PostInitialization/20-LinkLowercaseFiles.ps1` makes sure the lowercase names h2ded opens exist. For `data1`, `portals` (with `HEXEN2_PORTALS`) and `HEXEN2_GAME`, it links the folder to its lowercase name if it is spelled differently (`data1` → `DATA1`). It also links each file and folder directly inside it whose name has capitals (`pak0.pak` → `PAK0.PAK`), unless the lowercase name already exists. The links land in `Overlay/`.
2. `PostInitialization/30-ConfigureHexen2.ps1` checks for `data1/pak0.pak` and writes the non-empty `HEXEN2_*` settings into `<HEXEN2_GAME or data1>/lancommander.cfg`. The hook writes through `Merged/`, so the file lands in `Overlay/`.
3. `START_EXE` (`/usr/local/bin/hexen2-server`) runs from `Merged/`:

   ```text
   /opt/uhexen2/h2ded -dedicated 16 -port 26900 -basedir /config/Merged
       [-portals] [-game <HEXEN2_GAME>] [-protocol <HEXEN2_PROTOCOL>] +exec lancommander.cfg <START_ARGS> +map ravdm1
   ```

   h2ded execs `server.cfg` by itself before it runs the command line, so your `server.cfg` comes first and `lancommander.cfg` overrides it. The output is line-buffered (`stdbuf`), so the server console appears in `docker logs` as it happens.

## Configuration Options

### Ports

- **26900/udp**: game, server info queries and LAN browser (`HEXEN2_PORT`). Each connected client then gets its own UDP socket on a random port, so publish the container on the LAN (macvlan/ipvlan or host networking) rather than mapping single ports when clients are behind other NATs.

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### server.cfg

`Overlay/<HEXEN2_GAME, portals or data1>/server.cfg` is yours to create and edit; h2ded finds it in the game's search path. Any console command works there, for example `sv_gravity 600`, `pausable 0` or `sys_ticrate 0.025`. `HEXEN2_*` variables that are set override the same settings in it; clear a variable (set it to `""`) to control that setting from `server.cfg` instead.

### Game modes

| Mode | Settings |
|------|----------|
| Deathmatch | `HEXEN2_DEATHMATCH=1`, a `ravdm1` to `ravdm5` map |
| Team deathmatch | the above, plus `HEXEN2_TEAMPLAY=1` (teams by player color) |
| Co-op | `HEXEN2_COOP=1` (sets `deathmatch 0`), `HEXEN2_MAP=demo1` (the first map of the campaign) or `village1`, `HEXEN2_SKILL` for difficulty, `HEXEN2_FRAG_LIMIT=0`, `HEXEN2_TIME_LIMIT=0` |
| Mission pack | any of the above, plus `HEXEN2_PORTALS=1` and a mission pack map (`keep1`, ...) |

### Maps

The stock game code has no rotation: in deathmatch, reaching the frag or time limit restarts the current map. Maps with an exit go on to the next map when a player takes it (`HEXEN2_NO_EXIT=1` stops that in deathmatch). Change the map from `server.cfg` or with `START_ARGS`, or use a mod with its own rotation.

### Hooks

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/` to run at the base image's lifecycle hooks (`PreInitialization`, `PostInitialization`, `ServerStarted`, `ServerStopped`).

## Troubleshooting

- **`data1/pak0.pak not found`**: the game data isn't in `Server/`, or the folder has a name other than any spelling of `data1`. Copy `data1/` from a Hexen II install.
- **"You must patch your installation with Raven's 1.11 update"**: the paks are the original CD versions. Patch them with Hammer of Thyrion's `h2patch` (or xdelta3 and the `patchdat/` deltas it ships).
- **"Playing the demo version"** or **"Unable to find a proper Hexen II installation"**: `pak1.pak` is missing or not a retail Hexen II pak.
- **"Missing or invalid mission pack installation"**: `HEXEN2_PORTALS=1` but `portals/pak3.pak` isn't there. LANCommander's Hammer of Thyrion package has a `portals/` folder without `pak3.pak`; copy it from a Portal of Praevus install or leave `HEXEN2_PORTALS` empty.
- **"Old protocol request not compatible with the Mission Pack"**: `HEXEN2_PROTOCOL=18` can't be combined with `HEXEN2_PORTALS`.
- **A mod map or file isn't found**: names are case-sensitive on Linux. The link hook only covers the top level of `data1/`, `portals/` and `HEXEN2_GAME`; rename files deeper down to lowercase.
- **"couldn't exec server.cfg"** in the log is harmless: there is no `server.cfg` yet.
- **Server not in the LAN browser**: the browser finds servers by UDP broadcast, so the container needs its own LAN address (macvlan/ipvlan) or host networking. With port mapping, clients join by IP (`connect <ip>:26900` in the console).
