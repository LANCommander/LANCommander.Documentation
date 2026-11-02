---
sidebar_label: Docker
---

# Quake Docker Container

This Docker container runs a Quake (1996) dedicated server. It is built on the base image and runs [Ironwail](https://github.com/andrei-drexler/ironwail) with `-dedicated`. The image compiles Ironwail from its latest release at build time (`IRONWAIL_VERSION` pins one). You supply the game data.

## Quick Start

```yaml
services:
  quake:
    image: lancommander/quake:latest
    container_name: quake

    ports:
      - 26000:26000/udp

    volumes:
      - "/data/Servers/Quake/Deathmatch:/config"

    environment:
      QUAKE_SERVER_NAME: "My Quake Server"
      QUAKE_MAP: "dm4"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Before the first start, copy the `id1/` folder (`pak0.pak`, `pak1.pak`) into `Server/`, and any mod folders next to it.

## How It Starts

1. `PostInitialization/20-LinkLowercaseFiles.ps1` makes sure the lowercase names Linux Quake opens exist. For `id1` and `QUAKE_GAME`, it links the folder to its lowercase name if it is spelled differently (`id1` → `Id1`). It also links each file and folder directly inside it whose name has capitals (`pak0.pak` → `PAK0.PAK`), unless the lowercase name already exists. The links land in `Overlay/`.
2. `PostInitialization/30-ConfigureQuake.ps1` checks for `id1/pak0.pak` and writes the non-empty `QUAKE_*` settings into `<QUAKE_GAME or id1>/lancommander.cfg`. That file starts with `exec server.cfg`, so your own `server.cfg` runs first and the `QUAKE_*` settings override it. The hook writes through `Merged/`, so the file lands in `Overlay/`.
3. `START_EXE` (`/usr/local/bin/quake-server`) runs from `Merged/`:

   ```text
   /opt/ironwail/ironwail -dedicated 16 -port 26000 -basedir /config/Merged
       [-game <QUAKE_GAME>] [-protocol <QUAKE_PROTOCOL>] +exec lancommander.cfg <START_ARGS> +map dm1
   ```

   The output is line-buffered (`stdbuf`), so the server console appears in `docker logs` as it happens. Ironwail's engine pak (`ironwail.pak`) is next to the binary in `/opt/ironwail`.

## Configuration Options

### Ports

- **26000/udp**: game, server info queries and LAN browser (`QUAKE_PORT`). Each connected client then gets its own UDP socket on a random port, so publish the container on the LAN (macvlan/ipvlan or host networking) rather than mapping single ports when clients are behind other NATs.

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### server.cfg

`Overlay/<QUAKE_GAME or id1>/server.cfg` is yours to create and edit. Any console command works there, for example `sv_gravity 600`, `sv_aim 1`, `pausable 0` or `sys_ticrate 0.025`. `QUAKE_*` variables that are set override the same settings in it; clear a variable (set it to `""`) to control that setting from `server.cfg` instead.

### Game modes

| Mode | Settings |
|------|----------|
| Deathmatch | `QUAKE_DEATHMATCH=1` (or `2`, weapons stay), a `dm1` to `dm6` map |
| Team deathmatch | the above, plus `QUAKE_TEAMPLAY=1` or `2` |
| Co-op | `QUAKE_COOP=1` (sets `deathmatch 0`), `QUAKE_MAP=start` or `e1m1`, `QUAKE_SKILL` for difficulty, `QUAKE_FRAG_LIMIT=0`, `QUAKE_TIME_LIMIT=0` |

### Maps

The stock game code has no rotation: in deathmatch, reaching the frag or time limit restarts the current map. Maps with an exit go on to the next map when a player takes it (`QUAKE_NO_EXIT=1` stops that in deathmatch). Change the map from `server.cfg` or with `START_ARGS`, or use a mod with its own rotation.

### Hooks

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/` to run at the base image's lifecycle hooks (`PreInitialization`, `PostInitialization`, `ServerStarted`, `ServerStopped`).

## Troubleshooting

- **`id1/pak0.pak not found`**: the game data isn't in `Server/`, or the folder has a name other than any spelling of `id1`. Copy `id1/` from a Quake install.
- **"Playing shareware version"**: only `pak0.pak` was found. Copy `pak1.pak` too; the link hook covers uppercase names.
- **A mod map or file isn't found**: names are case-sensitive on Linux. The link hook only covers the top level of `id1/` and `QUAKE_GAME`; rename files deeper down to lowercase.
- **Clients can't connect, or get "Server returned version 999"**: the client doesn't support the RMQ protocol. Set `QUAKE_PROTOCOL=666` (FitzQuake and QuakeSpasm) or `15` (original Quake, ProQuake). `cat /opt/ironwail/VERSION` in the container shows the server's Ironwail version.
- **Server not in the LAN browser**: the browser finds servers by UDP broadcast, so the container needs its own LAN address (macvlan/ipvlan) or host networking. With port mapping, clients join by IP (`connect <ip>:26000` in the console).
- **"Failed to download add-on list" and "Steam library not found"** in the log are harmless: the server is built without download support and has no Steam.
