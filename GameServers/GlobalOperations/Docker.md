---
sidebar_label: Docker
---

# Global Operations Docker Container

This Docker container runs a Global Operations dedicated server. It is built on the WINE image and runs the game's Windows server, `goserver.exe`, under Wine and Xvfb. The container doesn't download the game, so you provide the files.

## Quick Start

```yaml
services:
  globalops:
    image: lancommander/globaloperations:latest
    container_name: globalops

    ports:
      - 27888:27888/udp
      - 28672:28672/udp

    volumes:
      - "/data/Servers/Global Operations/Default:/config"

    environment:
      GO_SERVER_NAME: "My Global Operations Server"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Copy a Global Operations install with the unofficial **4.0a** update (the folder with `goserver.exe`, `server.dll` and `Globalops/`) into `Server/` before the first start. You can instead set `GO_ARCHIVE_URL` to a zip of that folder. Clients must run the same version; the server checks it.

## How It Starts

`goserver.exe` has no command-line settings. It opens a **Server Settings** dialog (tabs Server, Rules, Team Rules and Advanced), fills it from `Globalops/server.cfg`, and starts hosting when OK is pressed. It then saves the dialog back to `server.cfg`. Cancel quits the program. The image automates this:

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`. The server needs nothing installed into it.
2. `PostInitialization/20-InstallGlobalOps.ps1` checks for `Server/goserver.exe`. If it's missing and `GO_ARCHIVE_URL` is set, the hook downloads the archive.
3. `PostInitialization/30-ConfigureGlobalOps.ps1` reads `Globalops/server.cfg`, checks the `GO_*` values, sets them in it, and writes it back through `Merged/`, so it lands in `Overlay/Globalops/server.cfg` and `Server/` keeps the original. Keys it doesn't know (e.g. `katime`, `IncapacitatedTime`) are kept.
4. `START_EXE` (`/usr/local/bin/go-server`) starts `goserver.exe` under Xvfb, waits for the dialog, and presses Enter (OK) with `xdotool`. It then copies the newest event log in `Globalops/logs/` to stdout, and logs once the GameSpy status port answers.

A successful start looks like this:

```
Starting: goserver.exe
Server Settings accepted; game port 27888/udp, GameSpy status on 28672/udp
L 11/05/2026 - 00:44:57: Log file started
L 11/05/2026 - 00:44:57: Started map "worlds/mexico"
Server is up: My Global Operations Server, map mexico, 0/24 players
```

## Configuration Options

### Ports

- **27888/udp**: Game (LithTech)
- **28672/udp**: GameSpy status queries. A `\status\` query returns the name, map, players and settings, and gives 28672 as `hostport`.

Neither port can be changed: there is no setting for them in the dialog, `server.cfg` or on the command line. Run one server per IP. Giving the container its own LAN address (macvlan/ipvlan) is the most reliable setup.

### Environment Variables

See the [README](../README.md#environment-variables) for the full table. Settings are re-applied on every start, so changes made in the server window don't survive a restart, except for settings whose variable is empty.

An empty variable keeps what `server.cfg` already has, so a hand-edited `server.cfg` in `Overlay/Globalops/` still works for anything you leave unset. To clear a text field such as the password, set the variable to a single space (the server itself stores empty fields that way).

### Map Rotation

`GO_MAPS` is a comma-separated list. Names are case-insensitive, and a `.dat` extension or `worlds/` prefix is accepted. Each name must be a file in `Globalops/worlds/`. Unknown names are logged and left out. Set `GO_MAPS=config` to keep the `map0`..`mapN` entries already in `server.cfg`.

`GO_TIME_LIMIT` is the round length in minutes and `GO_ROUNDS` the number of rounds before the map changes.

The server's **Map Rotation** dialog doesn't draw under Wine. The image never opens it, so this only matters if you use the server window by hand.

### LAN Mode and CD Keys

`GO_LAN=true` (the default) puts the server in LAN mode. The `authenticate` key in `server.cfg` stays `0`, so players' CD keys aren't checked against GameSpy (which is gone; 4.0a reports to OpenSpy instead).

### Event Log

With `GO_LOG_EVENTS=true` the server writes `Globalops/logs/YYYYMMDD-NNNN.log`, a new file each time the server starts, in the HLstats-style format (`L date - time: "player<team>" joined team ...`). The launcher copies the newest file written since it started to stdout. Old files are kept in `Overlay/Globalops/logs/`; delete them when they pile up.

### Hooks

| Hook | When |
|------|------|
| `PreInstallGlobalOps` / `PostInstallGlobalOps` | Around the game file check/download |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **No "Server is up", or "no GameSpy status reply"**: the world failed to load. Check the map names.
- **"didn't accept its Server Settings"**: the dialog showed an error box instead of closing. The open windows are listed in the message.
- **No event log in `docker logs`**: `GO_LOG_EVENTS` is off, or was left empty and `server.cfg` has `logevents 0`.
- **Players can't see the server in the LAN browser**: the browser broadcasts on the local network. Use macvlan/ipvlan or host networking, not port mapping.
- **Clients can't join or don't list the server as compatible**: the client isn't on 4.0a (version 1.40). The server and clients need the same files.
