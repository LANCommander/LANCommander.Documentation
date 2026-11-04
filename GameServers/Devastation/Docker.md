---
sidebar_label: Docker
---

# Devastation Docker Container

This Docker container runs a Devastation dedicated server. It is built on the WINE image and runs the retail game's Unreal Engine 2 server, `UCC.exe server`. The container doesn't download the game, so you provide the files.

## Quick Start

```yaml
services:
  devastation:
    image: lancommander/devastation:latest
    container_name: devastation

    ports:
      - 7777:7777/udp
      - 7787:7787/udp
      - 7900:7900/udp
      - 8777:8777/udp

    volumes:
      - "/data/Servers/Devastation/Territories:/config"

    environment:
      DEVASTATION_SERVER_NAME: "My Devastation Server"
      DEVASTATION_GAME_TYPE: "territories"
      DEVASTATION_MAP: "DTT-Union"
      DEVASTATION_ADMIN_PASSWORD: "changeme"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Copy a Devastation **390** install (the folder with `System/UCC.exe`, `System/DCore.u` and `Maps/`) into `Server/` before the first start. You can instead set `DEVASTATION_ARCHIVE_URL` to a zip of that folder.

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitialization/20-InstallDevastation.ps1` checks for `Server/System/UCC.exe`. If it's missing and `DEVASTATION_ARCHIVE_URL` is set, the hook downloads the archive, extracts the folder that holds `System/DCore.u` and `System/UCC.exe`, and remounts the overlay.
3. `PostInitialization/30-ConfigureDevastation.ps1` copies `System/Default.ini` to `System/Server.ini` (`DEVASTATION_INI`) if it doesn't exist yet. It does this through `Merged/`, so the file lands in `Overlay/System/`. It then writes the non-empty `DEVASTATION_*` settings into it, writes the map rotation, and removes the master server uplinks.
4. `START_EXE` (`/usr/local/bin/devastation-server`) runs `UCC.exe server <DEVASTATION_MAP>?game=<class> ini=Z:\config\Merged\System\Server.ini log=server.log` from `System/` under Wine.

A successful start ends with:

```
Game class is 'DTerrGameInfo'
TcpNetDriver on port 7777
Spawning: IpDrv.UdpBeacon
Spawning: IpDrv.UdpGamespyQuery
Spawning: IpDrv.ASEUplink
...
UdpServerQuery(crt): Port 7787 successfully bound.
...
Game engine initialized
```

## Configuration Options

### Ports

- **7777/udp**: Game (`DEVASTATION_PORT`)
- **7787/udp**: Server query, GameSpy protocol (game port + 10). `\status\` returns the name, map, game type, version (`gamever 3069`), player count and rules (time/frag limit, Full Physics, Game Mode, password).
- **7900/udp**: All-Seeing Eye query (game port + 123).
- **8777/udp**: LAN beacon. The in-game LAN browser broadcasts `REPORTQUERY` here, and the server replies `devastation 7787`.

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### Server ini

`Overlay/System/Server.ini` is yours to edit. Only the keys that have a non-empty `DEVASTATION_*` variable are rewritten on start. Delete the file to regenerate it from `Default.ini`.

- This engine looks for a relative `ini=` in `My Documents\Devastation` inside the Wine prefix, not in `System/`. The launcher therefore passes the ini as an absolute `Z:\` path. `server.log` and `User.ini` do land in `wineprefix/drive_c/users/<user>/Documents/Devastation/`.
- Mode rules are per game class: `[DTerritories.DTerrGameInfo]`, `[DTerritories.DCTFGameInfo]`, `[DGamePlay.DStreetWarGameInfo]` and `[DGamePlay.DTeamStreetWarGI]` hold `TimeLimit`, `FragLimit`, `GameMode` (0 Arcade, 1 Simulation) and `FriendlyFireScale`. Territories also has `RoundLimit`, `TimeLimitRound` (seconds) and `SuddenDeathSeconds`. `DEVASTATION_TIME_LIMIT`/`DEVASTATION_FRAG_LIMIT` go into all four sections.
- Passwords, max players and full physics are in `[Engine.GameInfo]` (`AdminPassword`, `GamePassword`, `MaxPlayers`, `bKarmaMP`). They are never put on the command line.
- Map rotation: `[DGamePlay.DSWMapList]` `Maps[0]`..`Maps[31]`, each with a `MapParams[n]` URL (`?game=<class>?timelimit=..`), plus `MapNum`, `GameMode` and `bKarmaMP`. This is the format the in-game host menu writes, so one rotation can mix game types. The hook rewrites it on every start from `DEVASTATION_MAPS` (or every installed map of `DEVASTATION_GAME_TYPE`); a rotation entry's limits come from its game class's section.
- Web admin: `[UWeb.WebServer] bEnabled=True` and a `ServerActors=UWeb.WebServer` line under `[Engine.GameEngine]` turn on the web admin. It is off by default; expose its TCP port if you enable it.

UCC saves its config to the server ini, so values can also change there after an admin command.

### Hooks

| Hook | When |
|------|------|
| `PreInstallDevastation` / `PostInstallDevastation` | Around the game file check/download |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **Server not in the LAN browser**: the browser finds servers by UDP broadcast to 8777, so the container needs its own LAN address (macvlan/ipvlan) or host networking. Joining by IP works through port mapping.
- **Clients can't join / version mismatch**: the server reports `gamever 3069` and `minnetver 3069` (retail 390). Clients need the same version and packages.
- **Settings ignored**: they go into `DEVASTATION_INI`, not `Default.ini` or the client's `Devastation*.ini`. Check `Overlay/System/Server.ini`. A `Server.ini` in `wineprefix/.../Documents/Devastation/` is not used.
- **`MasterServerUplink: Resolving devserver.hdinteractive.nl`**: the stock master server uplink is dead and only retries. The hook removes it on every start; it reappears only if you start UCC with another ini.
- **`DEVASTATION_MASTER_SERVER_UPLINK=true`**: adds `ServerActors=IpDrv.UdpGamespyUplink MasterServerAddress=master.openspy.com MasterServerPort=27900`. Whether OpenSpy lists Devastation servers is untested.
- **`Map ... is not installed; left out of the rotation`**: the map isn't in `Maps/` as `<name>.dvs`. Names are case-insensitive; the `.dvs` extension is optional.
- **`System/UCC.exe not found`**: `Server/` must contain the game folder itself (`Server/System/UCC.exe`), not a folder that contains it.
