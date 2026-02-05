---
sidebar_label: Docker
---

# Star Trek: Elite Force Dedicated Server

This repository provides a Dockerized **Star Trek: Elite Force dedicated server via cMod** suitable for running multiplayer Star Trek: Elite Force servers in a clean, reproducible way.  
The image is designed for **headless operation**, supports bind-mounted mods and configuration, and handles legacy runtime dependencies required by Star Trek: Elite Force.

---

## Features

- Runs the **Star Trek: Elite Force dedicated server** (`cMod-dedicated`)
- Optionally downloads and extracts mod archives from URLs at startup
- Automated build & push via GitHub Actions

## Docker Compose Example
```yaml
services:
  eliteforce:
    image: lancommander/eliteforce:latest
    container_name: eliteforce-server

    # Star Trek: Elite Force uses UDP
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
    ├── Server/            # Base cMod install
    │   └── baseEF/        # Star Trek: Elite Force game files base directory
    ├── Overlay/           # Files to overlay on game directory (optional)
    │   └── baseEF/        # Star Trek: Elite Force overlay directory
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
You will need to copy the `pak*.pk3` files from your retail copy of Star Trek: Elite Force into the `/config/Server/baseEF` directory. The server will not run without these files.

---

## Configuration
An `autoexec.cfg` file can also be created for adjusting server settings.
Example:
```
////////////////////////////////////////////////////////////
// Star Trek: Voyager - Elite Force (Holomatch)
// cMod (ioEF-cMod) Dedicated Server - autoexec.cfg
// Location: baseEF/autoexec.cfg
////////////////////////////////////////////////////////////

///////////////////////
// Core server identity
///////////////////////
set sv_hostname "^2Elite Force^7 cMod Dedicated"
set g_motd "^7Welcome! ^2Play nice ^7and have fun."
set g_gametype "3"            // 1=FFA, 3=Team DM, 4=CTF (common EF values)

set sv_maxclients "16"
set sv_privateClients "0"
set sv_privatePassword ""

///////////////////////
// Internet / LAN mode
///////////////////////
set dedicated "2"             // 2=Internet, 1=LAN

///////////////////////
// Admin / RCON
///////////////////////
set rconPassword "CHANGE_ME_STRONG_PASSWORD"  // never leave blank

///////////////////////
// Rules / match pacing
///////////////////////
set timelimit "20"
set fraglimit "0"
set capturelimit "0"

set g_friendlyFire "1"
set g_teamForceBalance "1"
set g_teamAutoJoin "0"

set g_allowVote "1"
set g_doWarmup "1"
set g_warmup "15"

///////////////////////
// Networking / abuse control
///////////////////////
set sv_maxRate "25000"         // cap client rate (bandwidth fairness)
set sv_timeout "200"
set sv_zombietime "2"
set sv_floodProtect "1"

///////////////////////
// Purity / cheats
///////////////////////
set sv_pure "1"

///////////////////////
// Downloads (cMod supports HTTP downloads)
///////////////////////
set sv_allowDownload "1"
set sv_wwwDownload "1"
set sv_wwwBaseURL "https://example.com/ef"    // points to your pk3 mirror root
set sv_wwwDlDisconnected "0"                  // 0 keeps player connected while downloading

///////////////////////
// Logging
///////////////////////
set g_log "games.log"
set g_logSync "1"
set logfile "3"

///////////////////////
// Ports note (router/firewall)
// Elite Force commonly uses UDP 26000, 27500, 27910, 27960
///////////////////////

///////////////////////
// Map rotation (Team DM example)
///////////////////////
set m1 "map hm_stasis ; set nextmap vstr m2"
set m2 "map hm_fear ; set nextmap vstr m3"
set m3 "map hm_helix ; set nextmap vstr m4"
set m4 "map hm_hangar ; set nextmap vstr m1"
set nextmap "vstr m1"

///////////////////////
// Start the first map
///////////////////////
vstr m1
```
All gameplay rules, cvars, maps, and RCON settings should live here.

## Extra Mod Downloads
Archives provided via `EXTRA_MOD_URLS` are extracted into `/config/Overlay` before startup.

---

## Environment Variables

| Variable | Description | Default |
|--------|-------------|---------|
| `EXTRA_MOD_URLS` | URLs to download and extract into `/config` at startup | *(empty)* |
| `SERVER_ARGS` | Additional Star Trek: Elite Force command-line arguments (advanced) | *(empty)* |

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
  lancommander/eliteforce:latest
```
### With automatic mod downloads
docker run --rm -it \
  -p 27960:27960/udp \
  -v "$(pwd)/config:/config" \
  -e EXTRA_MOD_URLS="https://example.com/modpack.zip" \
  lancommander/eliteforce:latest

## Ports
- **UDP 27960** – default Star Trek: Elite Force server port

## License
cMod is distributed under its own license.
This repository contains only Docker build logic and helper scripts licensed under MIT.