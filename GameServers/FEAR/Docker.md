---
sidebar_label: Docker
---

# F.E.A.R. Docker Container

This Docker container runs a F.E.A.R. multiplayer (F.E.A.R. Combat) dedicated server. It is built on the WINE image and runs the game's stand-alone server, the 1.08 `FEARServer.exe`, on a virtual display. The container doesn't download the game, so you provide the files.

## Quick Start

```yaml
services:
  fear:
    image: lancommander/fear:latest
    container_name: fear

    ports:
      - 27888:27888/udp

    volumes:
      - "/data/Servers/F.E.A.R./Deathmatch:/config"

    environment:
      FEAR_SERVER_NAME: "My F.E.A.R. Server"
      FEAR_GAME_TYPE: "deathmatch"
      FEAR_SCMD_PASSWORD: "changeme"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Before the first start, copy a F.E.A.R. Combat 1.08 install, the folder that contains `FEARServer.exe`, into `Server/`. You can instead set `FEAR_ARCHIVE_URL` to a zip of that folder.

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitialization/20-InstallFEAR.ps1` checks for `Server/FEARServer.exe`. If it's missing and `FEAR_ARCHIVE_URL` is set, the hook downloads and extracts the archive and remounts the overlay.
3. `PostInitialization/30-ConfigureFEAR.ps1` creates `<FEAR_USER_DIR>/ServerOptions/<FEAR_CONFIG>.txt` with the stock defaults if it doesn't exist, then writes the non-empty `FEAR_*` settings and the map rotation into it.
4. `START_EXE` (`/usr/local/bin/fear-server`) runs `FEARServer.exe -userdirectory <dir> -optionsfile <FEAR_CONFIG> +errorlog 1 ... [START_ARGS]` from the game folder under Wine and Xvfb, and copies the server's log (`<FEAR_USER_DIR>/fearserver.log`) to stdout.

`docker logs` then shows the server console:

```
Starting: FEARServer.exe -userdirectory Z:\config\Merged\Monolith Productions\FEARCombat -optionsfile lancommander ...
Game port and status queries on 27888/udp
Server is running.
F.E.A.R. ServerShield (SEC2) v2.1.1 (Jul  3 2023 - 12:40:13)
Loading world: Worlds\ReleaseMultiplayer\Asylum
World loaded.
```

To check that the server is up, send a GameSpy status query to the game port:

```bash
python3 -c 'import socket; s=socket.socket(2,2); s.settimeout(3); s.sendto(b"\\status\\",("<server>",27888)); print(s.recvfrom(4096)[0])'
# b'\\hostname\\F.E.A.R. Combat\\gamever\\FEAR v1.08\\mapname\\[SEC2] - Asylum\\gametype\\DeathMatch\\...\\maxplayers\\16\\...'
```

## Configuration Options

### Ports

- **27888/udp**: Game and GameSpy status queries (`FEAR_PORT`)

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### Options File (`<FEAR_USER_DIR>/ServerOptions/<name>.txt`)

The options file is an INI file, UTF-16 like the game's own. The hook edits it through the merged view, so the edited copy is in `Overlay/` and is yours to change (any text editor that keeps UTF-16 or saves ANSI works). A key that also has a non-empty `FEAR_*` variable is overwritten on every start. Set `FEAR_MAPS=config` to manage the rotation in the file yourself. The game's `ServerOptions/ExampleServerOptions.txt` lists every key.

| Section | Keys |
|---------|------|
| `[ServerSettings]` | `GameType` (the name of a game type section), `ServerMessage`, `UsePassword`, `Password`, `AllowScmdCommands`, `ScmdPassword`, `Port`, `BindToAddr`, `BandwidthServer`, `LANOnly`, `Dedicated`, `AllowContentDownload` and download limits, vote settings |
| One per game type: `[DeathMatch]`, `[TeamDeathMatch]`, `[Elimination]`, `[TeamElimination]`, `[SlowMoDeathmatch]`, `[TeamSlowMoDeathmatch]`, `[CTF]`, `[Slowmo CTF]`, `[CaptureAll]` (Conquer All), `[CaptureHold]` (Control) | `SessionName`, `MaxPlayers`, `ScoreLimit`, `TimeLimit`, `NumRounds`, `RunSpeed`, `FriendlyFire`, weapon restrictions, `Mission0`, `Mission1` ... (rotation, e.g. `Worlds\ReleaseMultiplayer\Streets`) |
| `[SEC2]` (SEC2 patch) | `ReservedPlayers`, ping checks (`UsePingChecks`, `MaxPing` ...), `BanHackers`, `ConnectionTimeout` ... |

A game type section without `MissionN` keys plays every map made for that game type. Missing keys use the game's defaults.

### Gameplay Customizations

`<FEAR_USER_DIR>/MPCustomizations.txt` (weapon damage, pickups, movement, scoring ...) is read on start; put an edited copy in `Overlay/`. To use a different file, add `-mpcustomizations <file>` to `START_ARGS`, or `-mpcustomizations none` to ignore it.

### Administration (SCMD)

With `FEAR_SCMD_PASSWORD` set, players log in from the in-game chat with `scmd login <password>`, then use `scmd listclients`, `scmd bootname <name>`, `scmd banuser <id>`, `scmd nextmap`, `scmd setmap <index>`, `scmd setgameoption <id> <value>` and so on (`scmd help` lists them). Ban lists (`BanUserList.txt`, `BanIPList.txt`) are in the user directory.

### Hooks

| Hook | When |
|------|------|
| `PreInstallFEAR` / `PostInstallFEAR` | Around the game file check/download |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **The server never starts and no port is bound**: FEARServer is showing an "ERROR - Unable to start server." message box on the virtual display. That happens when the options file can't be found: `-optionsfile` takes the name **without** `.txt` and looks in `<user directory>\ServerOptions\`. The launcher checks for the file before starting.
- **A map from `FEAR_MAPS` is never played**: FEARServer skips maps it can't load and falls back to the game type's default rotation. Stock maps have no `CTF_` prefix, despite the examples in `ExampleServerOptions.txt`; the hook warns about names that aren't stock maps.
- **Exits immediately without a display**: FEARServer is a GUI program. Keep `WINE_XVFB=true`.
- **`docker stop` takes 10 seconds**: Wine doesn't act on SIGTERM, so Docker kills the server after its timeout. Nothing needs saving on shutdown.
- **Not in the in-game server list**: LAN discovery by broadcast needs the container on the LAN itself (macvlan/ipvlan, or `network_mode: host`). Clients can always join by IP.
- **No console commands**: the console input box only exists in FEARServer's window. Use SCMD from a client instead.
