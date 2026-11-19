---
sidebar_label: Docker
---

# Rune Docker Container

This Docker container runs a Rune dedicated server. It is built on the WINE image and runs the retail game's Unreal Engine 1 server, `UCC.exe server`. The container doesn't download the game, so you provide the files.

## Quick Start

```yaml
services:
  rune:
    image: lancommander/rune:latest
    container_name: rune

    ports:
      - 7777:7777/udp
      - 7778:7778/udp
      - 8777:8777/udp

    volumes:
      - "/data/Servers/Rune/Deathmatch:/config"

    environment:
      RUNE_SERVER_NAME: "My Rune Server"
      RUNE_GAME_TYPE: "deathmatch"
      RUNE_MAP: "DM-Hel"
      RUNE_ADMIN_PASSWORD: "changeme"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Copy a Rune Classic **1.10** install (the folder with `System/UCC.exe`, `System/RuneI.u` and `Maps/`) into `Server/` before the first start. You can instead set `RUNE_ARCHIVE_URL` to a zip of that folder.

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitialization/20-InstallRune.ps1` checks for `Server/System/UCC.exe`. If it's missing and `RUNE_ARCHIVE_URL` is set, the hook downloads the archive, extracts the folder that holds `System/RuneI.u` and `System/UCC.exe`, and remounts the overlay.
3. `PostInitialization/30-ConfigureRune.ps1` copies `System/Default.ini` to `System/Server.ini` (`RUNE_INI`) if it doesn't exist yet. It does this through `Merged/`, so the file lands in `Overlay/System/`. It then writes the non-empty `RUNE_*` settings into it, the map rotation and the web admin settings, and removes the master server uplink.
4. `START_EXE` (`/usr/local/bin/rune-server`) runs `UCC.exe server <RUNE_MAP>?game=<class> ini=Server.ini log=server.log` from `System/` under Wine.

A successful start ends with:

```
Game class is 'RuneMultiPlayer'
TcpNetDriver on port 7777
...
Spawning: IpDrv.UdpBeacon
Spawning: IpServer.UdpServerQuery
Spawning: UWeb.WebServer
...
UdpServerQuery(crt): Port 7778 successfully bound.
Webserver is not enabled.  Set bEnabled to True in Advanced Options.
Game engine initialized
```

## Configuration Options

### Ports

- **7777/udp**: Game (`RUNE_PORT`)
- **7778/udp**: Server query, GameSpy protocol (game port + 1). `\status\` returns the name, map, game type, version (`gamever 110`), player count and rules.
- **8777/udp**: LAN beacon. The in-game LAN browser broadcasts `REPORTQUERY` here, and the server replies `rune 7778`.
- **8080/tcp**: Web admin (`RUNE_WEB_ADMIN_PORT`), only with `RUNE_WEB_ADMIN=true`.

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### Server ini

`Overlay/System/Server.ini` is yours to edit. Only the keys that have a non-empty `RUNE_*` variable are rewritten on start. Delete the file to regenerate it from `Default.ini`.

- `FragLimit`, `TimeLimit`, `bHardCoreMode`, `bMegaSpeed` and `bChangeLevels` are `globalconfig` in `[RuneI.RuneMultiPlayer]`, so they apply to every game type. `bAllowLimbSever` is per game class. Team and HeadBall have `FriendlyFireScale`, `GoalTeamScore`, `MaxTeams` and `MaxTeamSize` in `[RuneI.TeamGame]` / `[HeadBall.HeadBallGame]`; Arena has `TimeBetweenMatch` and `MaxTeamSupport` in `[Arena.ArenaGameInfo]`.
- Passwords and max players are in `[Engine.GameInfo]` (`AdminPassword`, `GamePassword`, `MaxPlayers`, `MaxSpectators`). They are never put on the command line.
- Map rotation: `Maps[0]`..`Maps[31]` (`<name>.run`) and `MapNum` in the game type's map list: `[RuneI.DMmaplist]` (Deathmatch and Team), `[Arena.ARMapList]` or `[HeadBall.HBmaplist]`. The game looks up the current map in the list and moves to the next entry. If the list is empty, it cycles through every installed map with the game type's prefix. `RUNE_MAPS` rewrites the list on every start; without it the list is left as it is.
- Web admin: `[UWeb.WebServer] bEnabled`/`ListenPort`, and the login in `[RuneServerAdmin.RuneServerAdmin] AdminUsername`/`AdminPassword` (stock: `admin`/`admin`). `RUNE_WEB_ADMIN=true` sets them, with `RUNE_ADMIN_PASSWORD` as the password. The admin pages are at `http://<server>:8080/ServerAdmin`.

UCC saves its config to the server ini, so values can also change there after an admin command or a map change.

### Hooks

| Hook | When |
|------|------|
| `PreInstallRune` / `PostInstallRune` | Around the game file check/download |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **Server not in the LAN browser**: the browser finds servers by UDP broadcast to 8777, so the container needs its own LAN address (macvlan/ipvlan) or host networking. Joining by IP works through port mapping.
- **Clients can't join / version mismatch**: the server reports `gamever 110` and `minnetver 110` (Rune Classic 1.10). Older Rune 1.07 clients can't join.
- **Settings ignored**: they go into `RUNE_INI`, not `Default.ini` or the client's `Rune.ini`. Check `Overlay/System/Server.ini`.
- **The time limit never ends on an empty server**: the game clock only runs once players are in, so the map rotation doesn't advance on an idle server.
- **`Map ... is not installed; left out of the rotation`**: the map isn't in `Maps/` as `<name>.run`. Names are case-insensitive; the `.run` extension is optional.
- **`RUNE_MASTER_SERVER_UPLINK=true`**: adds `ServerActors=IpServer.UdpServerUplink MasterServerAddress=master.333networks.com MasterServerPort=27900`; the uplink binds the query port + 1 (7779/udp). Whether 333networks lists the server is untested.
- **`System/UCC.exe not found`**: `Server/` must contain the game folder itself (`Server/System/UCC.exe`), not a folder that contains it.
