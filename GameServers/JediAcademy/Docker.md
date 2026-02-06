---
sidebar_label: Docker
---

# Jedi Knight: Jedi Academy Dedicated Server (Docker)

This repository provides a Dockerized **Jedi Knight: Jedi Academy dedicated server via OpenJK** suitable for running multiplayer Jedi Knight: Jedi Academy servers in a clean, reproducible way.  
The image is designed for **headless operation**, supports bind-mounted mods and configuration, and handles legacy runtime dependencies required by Jedi Knight: Jedi Academy.

---

## Features

- Runs the **Jedi Knight: Jedi Academy dedicated server** (`openjkded.x86_64`)
- Optionally downloads and extracts mod archives from URLs at startup
- Automated build & push via GitHub Actions

## Docker Compose Example
```yaml
services:
  jediacademy:
    image: lancommander/jediacademy:latest
    container_name: jediacademy-server

    # Jedi Knight: Jedi Academy uses UDP
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
    ├── Server/            # Base OpenJK install
    │   └── base/          # Jedi Knight: Jedi Academy game files base directory
    ├── Overlay/           # Files to overlay on game directory (optional)
    │   └── base/          # Jedi Knight: Jedi Academy overlay directory
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
You will need to copy the `pak*.pk3` files from your retail copy of Jedi Knight: Jedi Academy into the `/config/Server/base` directory. The server will not run without these files.

---

## Configuration
An `autoexec.cfg` file can also be created for adjusting server settings.
Example:
```
////////////////////////////////////////////////////////////
// Star Wars: Jedi Knight - Jedi Academy (MP)
// OpenJK Dedicated Server - autoexec.cfg
// Location: base/autoexec.cfg
////////////////////////////////////////////////////////////

///////////////////////
// Server Identity
///////////////////////
set sv_hostname "^2Jedi Academy^7 OpenJK Dedicated"
set g_motd "^7Welcome! ^2Be respectful^7 and have fun."
set sv_maxclients "16"
set sv_privateClients "0"
set sv_privatePassword ""

///////////////////////
// Internet / LAN
///////////////////////
set dedicated "2"            // 2=Internet, 1=LAN
set net_port "29070"         // change if hosting multiple servers

///////////////////////
// Admin / RCON
///////////////////////
set rconPassword "CHANGE_ME_STRONG_PASSWORD"

///////////////////////
// Passwords (optional)
///////////////////////
set g_password ""            // set to restrict join (leave empty for public)

///////////////////////
// Game Rules
// g_gametype (common):
// 0=FFA, 1=Duel, 2=Power Duel, 3=Team FFA, 4=CTF, 6=Siege
///////////////////////
set g_gametype "0"           // FFA
set timelimit "20"
set fraglimit "0"
set capturelimit "0"

set g_friendlyFire "1"
set g_teamForceBalance "1"
set g_teamAutoJoin "0"
set g_allowVote "1"
set g_voteLimit "5"

///////////////////////
// Network / Abuse Control
///////////////////////
set sv_maxRate "25000"
set sv_timeout "200"
set sv_zombietime "2"
set sv_floodProtect "1"

///////////////////////
// Purity / Downloads
///////////////////////
set sv_pure "1"
set sv_allowDownload "0"     // set 1 only if you actually want clients downloading pk3s

///////////////////////
// Logging
///////////////////////
set g_log "games.log"
set g_logSync "1"
set logfile "3"

///////////////////////
// Map Rotation (FFA stock maps)
// Make sure these maps exist in your install/mod set.
///////////////////////
set m1 "map ffa_bespin;      set nextmap vstr m2"
set m2 "map ffa_lunarbase;   set nextmap vstr m3"
set m3 "map ffa_raven;       set nextmap vstr m4"
set m4 "map ffa_tatooine;    set nextmap vstr m5"
set m5 "map ffa_yavin;       set nextmap vstr m1"

set nextmap "vstr m1"

///////////////////////
// Start
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
| `SERVER_ARGS` | Additional Jedi Knight: Jedi Academy command-line arguments (advanced) | *(empty)* |

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
  lancommander/jediacademy:latest
```
### With automatic mod downloads
docker run --rm -it \
  -p 27960:27960/udp \
  -v "$(pwd)/config:/config" \
  -e EXTRA_MOD_URLS="https://example.com/modpack.zip" \
  lancommander/jediacademy:latest

## Ports
- **UDP 27960** – default Jedi Knight: Jedi Academy server port