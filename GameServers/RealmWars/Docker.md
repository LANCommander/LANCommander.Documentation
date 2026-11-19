---
sidebar_label: Docker
---

# Realm Wars Docker Container

This Docker container runs a Realm Wars dedicated server. It is built on the WINE image and runs the game executable in dedicated mode, `RealmWars.exe -dedicated -mission …`. The container doesn't download the game, so you provide the files.

## Quick Start

```yaml
services:
  realmwars:
    image: lancommander/realmwars:latest
    container_name: realmwars

    ports:
      - 28000:28000/udp

    volumes:
      - "/data/Servers/RealmWars/Default:/config"

    environment:
      REALMWARS_SERVER_NAME: "My Realm Wars Server"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Copy a Realm Wars install (the folder with `RealmWars.exe`, `main.cs`, `common/` and `rw/`) into `Server/` before the first start. You can instead set `REALMWARS_ARCHIVE_URL` to a zip of that folder.

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitialization/20-InstallRealmWars.ps1` checks for `Server/RealmWars.exe`. If it's missing and `REALMWARS_ARCHIVE_URL` is set, the hook downloads the archive.
3. `START_EXE` (`/usr/local/bin/realmwars-server`) writes `lancommander/main.cs` from the `REALMWARS_*` variables. It then starts `RealmWars.exe -dedicated -mod lancommander -mission <REALMWARS_MISSION>` with `wine-run` inside a pseudo-terminal, and follows `console.log` to stdout.

`-mod lancommander` makes the game load `lancommander/main.cs` after `rw/main.cs`, which has already run `rw/server/defaults.cs` and `rw/server/prefs.cs`, and before the server starts. The generated file:

- sets the server name, info, player limit, passwords, time limit and port. These override the same values in `rw/server/prefs.cs`.
- sets `$Pref::Net::DisplayOnMaster = "Never"`, so the server doesn't send heartbeats to `master.garagegames.com`, which no longer exists
- runs `lancommander/custom.cs`, if it exists. Put your own startup TorqueScript there (in `Overlay/lancommander/custom.cs`). `lancommander/main.cs` is overwritten on every start.

A successful start ends with:

```
Loading compiled script lancommander/main.cs.
...
*** LOADING MISSION: rw/data/missions/newlands.mis
...
*** Mission loaded
******* onMissionLoaded in example.rw.server.scripts.dmgame.cs called
******* startGame in example.rw.server.scripts.dmgame.cs called
```

The many `Error: shape … bounds box invalid!`, `ParticleData(…)` and `Unable to find object: 'moveMap'` lines before that come from the game's own data and are harmless.

## Configuration Options

### Ports

- **28000/udp**: Game and LAN discovery (`REALMWARS_PORT`). If the port is taken, the game tries the next one, up to 10 times.

The in-game LAN list finds servers by UDP broadcast, which only reaches the container if it is on the LAN itself (macvlan/ipvlan or host networking). Clients can always join by IP.

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### Other Server Settings

Remaining server preferences (kick/ban times, flood protection, chat length) are in `rw/server/prefs.cs`, and the ban list in `rw/server/banlist.cs`. Put changes in `Overlay/` or in `lancommander/custom.cs`.

### Hooks

| Hook | When |
|------|------|
| `PreInstallRealmWars` / `PostInstallRealmWars` | Around the game file check/download |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

### `Unhandled page fault on read access … at address 00582D67` right after `Engine initialized...`

The game's console input thread fails without a real console and then reads past the end of its buffer. The launcher runs the game under `script` to give it a pseudo-terminal. If you replace `START_EXE`, keep that.

### Commands typed into the console do nothing

The pseudo-terminal's input isn't connected to anything. Use `lancommander/custom.cs`, or the in-game admin tools (`REALMWARS_ADMIN_PASSWORD`).

### `Mission … not found`

`REALMWARS_MISSION` is relative to the game folder and case-sensitive. The launcher prints the missions it found.

### The server doesn't show up in the LAN list

LAN discovery uses UDP broadcast, so the container needs its own address on the clients' network. Clients can still join by IP on port 28000. There is no internet server list; the GarageGames master server is gone.
