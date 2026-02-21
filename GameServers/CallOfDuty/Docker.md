---
sidebar_label: Docker
---

# Call of Duty Dedicated Server

This repository provides a Dockerized **Call of Duty dedicated server** suitable for running multiplayer Call of Duty servers in a clean, reproducible way.  
The image is designed for **headless operation**, supports bind-mounted mods and configuration, and handles legacy runtime dependencies required by Call of Duty.

---

## Features

- Runs the **Call of Duty dedicated server** (`cod_lnxded`)
- Optionally downloads and extracts mod archives from URLs at startup
- Automated build & push via GitHub Actions

## Docker Compose Example
```yaml
services:
  callofduty:
    image: lancommander/callofduty:latest
    container_name: callofduty-server

    # Call of Duty uses UDP
    ports:
      - "28960:28960/udp"

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
    ├── Server/            # Base Call of Duty install
    │   └── main/          # Call of Duty game files base directory
    ├── Overlay/           # Files to overlay on game directory (optional)
    │   └── main/          # Call of Duty overlay directory
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
You will need to copy the `pak*.pk3` files from your retail copy of Call of Duty into the `/config/Server/base` directory. The server will not run without these files.

---

## Configuration
An `autoexec.cfg` file can also be created for adjusting server settings.
Example:
```
////////////////////////////////////////////////////////////
// Call of Duty (2003) - Dedicated Server (Vanilla)
// File: main/server.cfg
////////////////////////////////////////////////////////////

///////////////////////
// Server Identity
///////////////////////
set sv_hostname "^2Call of Duty^7 Dedicated Server"
set g_motd "^7Welcome to ^2CoD1^7! No cheating."

set sv_maxclients "20"
set sv_privateClients "0"
set sv_privatePassword ""

///////////////////////
// Internet / LAN
///////////////////////
set dedicated "2"          // 2 = Internet, 1 = LAN
set net_port "28960"       // default CoD1 port

///////////////////////
// RCON / Admin
///////////////////////
set rconpassword "CHANGE_ME_STRONG_PASSWORD"

///////////////////////
// Passwords (optional)
///////////////////////
set g_password ""          // leave empty for public server

///////////////////////
// Game Rules
///////////////////////
set g_gametype "tdm"       // dm, tdm, sd, re
set timelimit "20"
set scorelimit "0"
set roundlimit "0"
set rounds "0"

set scr_friendlyfire "1"
set scr_killcam "1"

///////////////////////
// Team / Gameplay
///////////////////////
set scr_forcerespawn "0"
set scr_drawfriend "1"
set scr_teambalance "1"

///////////////////////
// Weapon Settings
///////////////////////
set scr_allow_smgs "1"
set scr_allow_rifles "1"
set scr_allow_snipers "1"
set scr_allow_shotgun "1"
set scr_allow_pistols "1"

///////////////////////
// Voting
///////////////////////
set g_allowvote "1"

///////////////////////
// PunkBuster (optional)
///////////////////////
set sv_punkbuster "0"      // 1 = enable PB

///////////////////////
// Networking / Stability
///////////////////////
set sv_maxrate "25000"
set sv_fps "20"
set sv_timeout "240"
set sv_reconnectlimit "3"
set sv_floodProtect "1"

///////////////////////
// Logging
///////////////////////
set g_log "games_mp.log"
set g_logSync "1"
set logfile "2"

///////////////////////
// Downloading
///////////////////////
set sv_allowDownload "0"

///////////////////////
// Map Rotation
// Stock CoD1 MP maps
///////////////////////
set sv_maprotation "map mp_harbor map mp_brecourt map mp_dawnville map mp_carentan map mp_railyard"
```
All gameplay rules, cvars, maps, and RCON settings should live here.

## Extra Mod Downloads
Archives provided via `EXTRA_MOD_URLS` are extracted into `/config/Overlay` before startup.

---

## Environment Variables

| Variable | Description | Default |
|--------|-------------|---------|
| `EXTRA_MOD_URLS` | URLs to download and extract into `/config` at startup | *(empty)* |
| `SERVER_ARGS` | Additional Call of Duty command-line arguments (advanced) | *(empty)* |

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
  -p 28960:28960/udp \
  -v "$(pwd)/config:/config" \
  lancommander/callofduty:latest
```
### With automatic mod downloads
docker run --rm -it \
  -p 28960:28960/udp \
  -v "$(pwd)/config:/config" \
  -e EXTRA_MOD_URLS="https://example.com/modpack.zip" \
  lancommander/callofduty:latest

## Ports
- **UDP 28960** – default Call of Duty server port