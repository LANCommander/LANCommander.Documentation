---
sidebar_label: Docker
---

# Wolfenstein (2009) Docker Container

This Docker container runs a Wolfenstein (2009) multiplayer dedicated server. It is built on the WINE image and runs the game's own dedicated server, `Wolf2MPLite.exe` (multiplayer 1.2), on a virtual display. The container doesn't download the game, so you provide its files.

## Quick Start

```yaml
services:
  wolfenstein:
    image: lancommander/wolfenstein2009:latest
    container_name: wolfenstein

    ports:
      - 27758:27758/udp

    volumes:
      - "/servers/Wolfenstein/Objective:/config"

    environment:
      WOLF_SERVER_NAME: "My Wolfenstein Server"
      WOLF_RULES: "objective"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Before the first start, copy the installed game's `MP` folder into `Server/`, or put a zip of the game in the config directory (or set `WOLF_ARCHIVE`/`WOLF_ARCHIVE_URL`).

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitialization/20-InstallWolfenstein.ps1` checks for `Server/Wolf2MPLite.exe`. If it's missing, the hook finds a zip containing `Wolf2MPLite.exe`, extracts everything in that folder (the `MP` folder of an installed game, minus its menu videos) into `Server/`, and remounts the overlay.
3. `PostInitialization/30-ConfigureWolfenstein.ps1` writes `base/lancommander.cfg` from the `WOLF_*` variables.
4. `START_EXE` (`/usr/local/bin/wolf-server`) runs, under Wine and Xvfb:

   ```
   Wolf2MPLite.exe +set net_port <WOLF_PORT> +set net_serverDedicated 1 +set net_LANServer <0|1> +exec lancommander.cfg [START_ARGS]
   ```

   These are the switches the game's own `serverlauncher.exe` uses. The server's console is a window on the virtual display, so the launcher follows its `console.log` into `docker logs`, minus the decl/material loading lines.

A healthy start ends with:

```
execing 'lancommander.cfg'
Server spawned on port 27758.
...
  3772 msec to load maps/mp_canals.entities
Loaded map in     4 seconds
Failed to resolve master patches.wolfenstein.com - using IP 92.122.127.24
newgame state 1 (old 0)
...
The update server could not be reached.
```

The master and update server messages are harmless.

## Configuration Options

### Ports

- **27758/udp**: Game (`WOLF_PORT`)
- **3074/udp**: DemonWare (sdnet) traffic, the game's online service layer

The server also binds a random local UDP port.

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### lancommander.cfg

The hook writes the file through the merged view, so it's in `Overlay/base/`. It sets the `si_*` server info, the passwords and the map rotation. The server saves most `si_*` cvars to `wolfdedconfig.cfg` in the Wine prefix and reads them back on the next start, so the hook writes every setting on every start. With `WOLF_MANAGE_CONFIG=false` the file is left alone. Without one, the server starts without a map.

The rotation is written the way `serverlauncher.exe` writes it:

```
set m0 "set g_nextMap $m1;set si_rules sdGameRulesTDM;spawnServer mp_canals"
set m1 "set g_nextMap $m0;set si_rules sdGameRulesObjective;spawnServer mp_bank"
vstr m0
```

Each entry sets `g_nextMap` to the next entry (the engine expands an unquoted `$cvar`), sets the rules and spawns its map. The last entry loops back to the first. Rule sets: `sdGameRulesObjective`, `sdGameRulesStopWatch`, `sdGameRulesTDM`.

Other useful cvars for `WOLF_EXTRA_CONFIG` or `START_ARGS`: `si_pure`, `si_spectators`, `si_teamForceBalance`, `si_readyPercent`, `si_disableVoting`, `si_allowLateJoin`, `g_warmup` (minutes), `si_privateClients`, `g_privatePassword`.

### Hooks

| Hook | When |
|------|------|
| `PreInstallWolfenstein` / `PostInstallWolfenstein` | Around the server check/extract |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **`Wolf2MPLite.exe not found` and the container exits**: there are no game files. Copy the `MP` folder into `Server/`, or give the hook a zip.
- **Exits immediately without a display**: the server is a GUI program. Keep `WINE_XVFB=true`.
- **Crash (`page fault on write access to 00000000`) at start**: setting `fs_savePath` on the command line (as `serverlauncher.exe` can) crashes the server under Wine. Leave it unset; the server then uses `Documents\id Software\WolfMP` and `AppData\Local\id Software\WolfMP` in the Wine prefix.
- **The map never changes**: with no players the match stays in warmup and the clock doesn't run.
- **`Client ... is not a LAN address, will be rejected`**: `WOLF_LAN_ONLY=true` (`net_LANServer 1`) only accepts private addresses. Set it to `false` for other networks.
- **Not in the in-game LAN list**: LAN discovery needs the container on the LAN itself (macvlan/ipvlan, or `network_mode: host`). Clients can always join with `+connect <host>:27758`. Players use an offline account, which the game limits to LAN play.
- **Clients can't connect**: client and server must both be version 1.2 (`WolfMP 1.2.341005`).
