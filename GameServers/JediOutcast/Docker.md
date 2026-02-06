---
sidebar_label: Docker
---

# Jedi Knight II: Jedi Outcast Dedicated Server

This repository provides a Dockerized **Jedi Knight II: Jedi Outcast dedicated server via JK2MV** suitable for running multiplayer Jedi Knight II: Jedi Outcast servers in a clean, reproducible way.  
The image is designed for **headless operation**, supports bind-mounted mods and configuration, and handles legacy runtime dependencies required by Jedi Knight II: Jedi Outcast.

---

## Features

- Runs the **Jedi Knight II: Jedi Outcast dedicated server** (`jk2mvded`)
- Optionally downloads and extracts mod archives from URLs at startup
- Automated build & push via GitHub Actions

## Docker Compose Example
```yaml
services:
  jedioutcast:
    image: lancommander/jedioutcast:latest
    container_name: jedioutcast-server

    # Jedi Knight II: Jedi Outcast uses UDP
    ports:
      - "27960:27960/udp"

    # Bind mounts so files appear on the host
    volumes:
      - ./config:/config

    environment:
      # Optional: download mods/maps at startup
      # EXTRA_MOD_URLS: >
      #   https://example.com/maps.zip,
      #   https://example.com/gameplay.pk3

      # Optional overrides
      # SERVER_ARGS: '+set dedicated 2 +set sv_allowDownload 1 +set sv_dlURL \"\" +set com_hunkmegs 64'

    # Ensure container restarts if the server crashes or host reboots
    restart: unless-stopped
```

---

## Directory Layout (Host)

```text
.
└── config/
    ├── Server/            # Base JK2MV install
    │   └── base/          # Jedi Knight II: Jedi Outcast game files base directory
    ├── Overlay/           # Files to overlay on game directory (optional)
    │   └── base/          # Jedi Knight II: Jedi Outcast overlay directory
    │       ├── maps/      # Custom maps
    │       └── ...        # Any other files you want to overlay
    ├── Merged/            # Overlayfs merged view (auto-created)
    ├── .overlay-work/     # Overlayfs work directory (auto-created)
    ├── Scripts/
        └── Hooks/         # Script files in this directory get automatically executed if registered to a hook
```
Both directories **must be writable** by Docker.

---

## Game Files
You will need to copy the `pak*.pk3` files from your retail copy of Jedi Knight II: Jedi Outcast into the `/config/Server/base` directory. The server will not run without these files.

---

## Configuration
An `autoexec.cfg` file can also be created for adjusting server settings.
Example:
```
////////////////////////////////////////////////////////////
// Jedi Knight II: Jedi Outcast (MP) - JK2MV Dedicated Server
// File: base/autoexec.cfg
////////////////////////////////////////////////////////////

///////////////////////
// Server Identity
///////////////////////
set sv_hostname "^2JK2^7 JK2MV Dedicated"
set g_motd "^7Welcome! ^2No drama^7, have fun."
set sv_maxclients "16"
set sv_privateClients "0"
set sv_privatePassword ""

///////////////////////
// Dedicated / Version (JK2MV)
///////////////////////
set dedicated "2"                 // 2=Internet, 1=LAN
set mv_serverversion "1.04"       // 1.02 / 1.03 / 1.04 :contentReference[oaicite:1]{index=1}

///////////////////////
// RCON
///////////////////////
set rconPassword "CHANGE_ME_STRONG_PASSWORD"

///////////////////////
// Game Rules
///////////////////////
set g_gametype "0"                // 0=FFA (common default)
set timelimit "20"
set fraglimit "0"
set capturelimit "0"

set g_friendlyFire "1"
set g_teamForceBalance "1"
set g_teamAutoJoin "0"

set g_allowVote "1"
set g_voteLimit "5"

///////////////////////
// Networking / Stability
///////////////////////
set sv_maxRate "25000"
set sv_timeout "200"
set sv_zombietime "2"
set sv_floodProtect "1"

///////////////////////
// Purity / Downloads
///////////////////////
set sv_pure "1"
set sv_allowDownload "0"

///////////////////////
// Logging
///////////////////////
set g_log "games.log"
set g_logSync "1"
set logfile "3"

///////////////////////
// Map Rotation
// (Use JK2 MP map names you actually have available)
///////////////////////
set d1 "map ffa_bespin;  set nextmap vstr d2"
set d2 "map ffa_imperial; set nextmap vstr d3"
set d3 "map ffa_ns_streets; set nextmap vstr d4"
set d4 "map ffa_yavin;   set nextmap vstr d1"
set nextmap "vstr d1"

///////////////////////
// Start
///////////////////////
vstr d1
```
All gameplay rules, cvars, maps, and RCON settings should live here.

## Extra Mod Downloads
Archives provided via `EXTRA_MOD_URLS` are extracted into `/config/Overlay` before startup.

---

## Environment Variables

| Variable | Description | Default |
|--------|-------------|---------|
| `EXTRA_MOD_URLS` | URLs to download and extract into `/config` at startup | *(empty)* |
| `SERVER_ARGS` | Additional Jedi Knight II: Jedi Outcast command-line arguments (advanced) | *(empty)* |

### `EXTRA_MOD_URLS`

A list of URLs separated by **commas**, **spaces**, or **newlines**.

Examples:

```bash
EXTRA_MOD_URLS="https://example.com/maps.zip,https://example.com/mod.pk3"
```
Archives are extracted into /config/Overlay. Single files are copied as-is.

---

## Running the Server
### Basic run (recommended)
```bash
mkdir -p config

docker run --rm -it \
  -p 27960:27960/udp \
  -v "$(pwd)/config:/config" \
  lancommander/jedioutcast:latest
```
### With automatic mod downloads
docker run --rm -it \
  -p 27960:27960/udp \
  -v "$(pwd)/config:/config" \
  -e EXTRA_MOD_URLS="https://example.com/modpack.zip" \
  lancommander/jedioutcast:latest

## Ports
- **UDP 27960** – default Jedi Knight II: Jedi Outcast server port

## License
JK2MV is distributed under its own license.
This repository contains only Docker build logic and helper scripts licensed under MIT.