---
sidebar_label: Docker
---

# Red Faction Docker Container

This Docker container runs a Red Faction dedicated server. It is built on the WINE image and runs the retail game's `-dedicated` mode with Dash Faction. The container doesn't download the game, so you provide the files.

## Quick Start

```yaml
services:
  redfaction:
    image: lancommander/redfaction:latest
    container_name: redfaction

    ports:
      - 7755:7755/udp

    volumes:
      - "/data/Servers/Red Faction/Deathmatch:/config"

    environment:
      RF_CONFIG: "dm"
      RF_SERVER_NAME: "My Red Faction Server"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Copy a Red Faction 1.20 NA install with Dash Faction (the folder with `DashFactionLauncher.exe`, `RF.exe` and the `.vpp` files) into `Server/` before the first start. You can instead set `RF_ARCHIVE_URL` to a zip of that folder.

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitialization/20-InstallRedFaction.ps1` checks for `Server/DashFactionLauncher.exe`. If it's missing and `RF_ARCHIVE_URL` is set, the hook downloads and extracts the archive and remounts the overlay.
3. `PostInitialization/30-ConfigureRedFaction.ps1` finds the `$Name: "<RF_CONFIG>"` block in `dedicated_server.txt` and writes the non-empty `RF_*` settings into it. It edits through `Merged/`, so the file lands in `Overlay/`.
4. `START_EXE` (`/usr/local/bin/rf-server`) sets the `ForcePort` registry value to `RF_PORT` and runs `DashFactionLauncher.exe -game -exe-path <RF.exe> -dedicated <RF_CONFIG> -lanonly -win32-console` under Wine. The launcher starts RF, injects Dash Faction and exits, so the script then waits with `wineserver -w` until the game exits.

A successful start prints the configuration and ends with:

```
================  Dedicated Server Settings ===============
Using game mode 'dm' in dedicated_server.txt
Server name = 'Red Faction Server'
...
-- Game Initializing --
-- Dash Faction Initializing --
-- Level Initializing --
```

Nothing more is printed while the server runs. Dash Faction's own log is `logs/DashFaction-dedicated-<config>.log` in `Overlay/`.

## Configuration Options

### Ports

- **7755/udp**: Game, server info and LAN browser queries (`RF_PORT`)

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### dedicated_server.txt

`Overlay/dedicated_server.txt` is yours to edit. Each `$Name:` block is a game configuration with its own game type (`DM`, `TeamDM`, `CTF`), limits, rules and `$Map:` rotation. Only the options that have a non-empty `RF_*` variable are rewritten on start, and only in the `RF_CONFIG` block. Missing maps in a rotation are skipped (the stock `dm` list names `dm11` and `dm18`, which aren't shipped). `$Max Time:` is at least 5 minutes.

A `$Server Name:` containing `$ME` is replaced with the Windows user name, which is the container's user.

### Hooks

| Hook | When |
|------|------|
| `PreInstallRedFaction` / `PostInstallRedFaction` | Around the game file check/download |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **Server not in the LAN browser**: the browser finds servers by UDP broadcast, so the container needs its own LAN address (macvlan/ipvlan) or host networking. Clients can join by IP through port mapping; with a port other than 7755, give `<ip>:<port>`.
- **Server not in the internet browser**: `RF_LAN_ONLY` is `true` by default. Set it to `false` to announce the server to the game tracker set in the `GameTracker` registry value.
- **`No $Name: "x" game configuration`**: `RF_CONFIG` must match a `$Name:` in `dedicated_server.txt`.
- **Dash Faction says the executable is unsupported**: it needs the original 1.20 NA `RF.exe`. Point `RF_EXE` at it.
- **No console commands**: the dedicated console reads from its own Win32 console, not `docker attach`. Use RCON from a game client (`rcon_request <password>`, then `rcon <command>`).
