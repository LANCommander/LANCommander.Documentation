---
sidebar_label: Docker
---

# America's Army Docker Container

This Docker container runs an America's Army 2.8.5 dedicated server. It is built on the WINE image and runs the retail game's Unreal Engine 2 server, `System/Server.exe`. The container doesn't download the game, so you provide the files.

## Quick Start

```yaml
services:
  americasarmy:
    image: lancommander/americasarmy:latest
    container_name: americasarmy

    ports:
      - 1716:1716/udp
      - 7778:7778/udp

    volumes:
      - "/data/Servers/America's Army/Objective:/config"

    environment:
      AA_SERVER_NAME: "My America's Army Server"
      AA_MAP: "Bridge"
      AA_MAPS: "Bridge,Border,Pipeline,SFhospital,Steamroller"
      AA_ADMIN_PASSWORD: "changeme"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Copy an America's Army **2.8.5** install (the folder with `System/Server.exe` and `Maps/`) into `Server/` before the first start. You can instead set `AA_ARCHIVE_URL` to a zip of that folder.

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitialization/20-InstallAmericasArmy.ps1` checks for `Server/System/Server.exe`. If it's missing and `AA_ARCHIVE_URL` is set, the hook downloads the archive, extracts the shallowest folder that holds `System/Server.exe`, and remounts the overlay.
3. `PostInitialization/30-ConfigureAmericasArmy.ps1` writes the non-empty `AA_*` settings into `System/server.ini` (`AA_INI`) through `Merged/`, so the edited copy lands in `Overlay/System/`. It sets the GameSpy query IP to the container's address and, if `AA_MAPS` is set, rewrites the map rotation.
4. `START_EXE` (`/usr/local/bin/aa-server`) runs `Server.exe <AA_MODE> <AA_MAP>.aao ini=server.ini log=server.log` from `System/` under Wine.

A successful start ends with:

```
Game class is 'AGP_GameTeamObjective'
...
GameSpyQR - IP: 10.0.1.x port:1716 lan: 1 nat: 0
GameSpy - IP: 10.0.1.x port: 7778 Public: 0 NAT: 0
Lan server. Not initializing DBMBS.
...
completed loading
```

## Configuration Options

### Ports

- **1716/udp**: Game (`AA_PORT`)
- **7778/udp**: GameSpy query (QR2). `\status\` and the `FE FD` protocol return the name, map, version (`gamever 2.8.5.0`), round and rules.

`RunServer.bat` also lists 1717, 1718, 8777, 27900 and the DBAuth TCP ports. In LAN mode under 2.8.5 the server binds only 1716 and 7778; the rest belong to the shut-down official master, stats and auth services.

### Server modes

`AA_MODE` is the first `Server.exe` argument. `LAN` lists the server in the LAN browser and needs no authorization. `LANTOURNAMENT` turns on tournament mode (`[AGP_Gameplay.AGP_GameTournament]`), and `LANETA`/`LANETATOURNAMENT` run Instant Action. `GLOBAL` and `TOURNAMENT` register with the official America's Army services, which are gone: the server times out on the auth server, logs `Reverting server to LAN mode` and then crashes with a general protection fault.

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### Server ini

`Overlay/System/server.ini` is yours to edit. Only the keys that have a non-empty `AA_*` variable are rewritten on start. Delete it to go back to the stock file.

- Round rules: `[Engine.GameInfo] TimeLimit`, `MaxPlayers`; `[AGP_Gameplay.AGP_GameDeathMatch] RoundsPerMatch`, `InitialWarmupTime`, `MinNetPlayers`; team balance in `[AGP_Gameplay.AGP_GameTeam]`.
- Map rotation: repeated `Maps=` lines plus `MapNum=` in `[AGP_Gameplay.AGP_MapList]`, used only when `[AGP_Gameplay.AGP_GameDeathMatch] bCycleMaps=True`. `AA_MAPS` writes all three. The stock list names maps that aren't in 2.8.5 (`SFOasis`, `SFWaterTreatment`, `SFBlizzard`), but it's off by default.
- Gameplay: `[AGP.AGP_GameInfo] ForceGameplay` (`FORCE_None`, `FORCE_Normal`, `FORCE_MILES`), `bOpenAllWeaponClassSlots`.
- Admins: `[Engine.AccessControl] AdminPassword` (`AA_ADMIN_PASSWORD`), and `PlayerAdmin=` lines in the same section.

The server may save its config to the ini on exit, so values can also change there after an admin command.

### Hooks

| Hook | When |
|------|------|
| `PreInstallAmericasArmy` / `PostInstallAmericasArmy` | Around the game file check/download |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **Server not in the LAN browser**: the browser finds servers by UDP broadcast, so the container needs its own LAN address (macvlan/ipvlan) or host networking. Joining by IP works through port mapping. With port mapping or NAT, set `AA_GAMESPY_IP` to the address clients should use.
- **Internet listing / OpenSpy**: not supported. The master server hostnames in `System/IpDrv.dll` (`%s.master.gamespy.com`, `%s.ms%d.gamespy.com`) can be byte-patched to `openspy.net`, but a LAN-mode server never heartbeats (`GameSpy ... Public: 0`), `GLOBAL` mode crashes (see Server modes), and the `.u` packages are encrypted, so the script that sets the public flag can't be changed. OpenSpy also doesn't list `armygame` among its supported games. Clients join by LAN browser or IP.
- **Clients can't join / version mismatch**: the server reports `gamever 2.8.5.0`. Clients need 2.8.5 with the same maps; `bEnableMapTesting`/`bEnableCodeTesting` compare them.
- **`Can't find host dms1.americasarmy.com`**: harmless. The server looks for an updated `Tours.ini` on the old official server.
- **`Player administrator entry "" is not using the correct format`**: harmless; it's the empty `PlayerAdmin` example in the stock ini.
- **Settings ignored**: they go into `AA_INI` (`System/server.ini`), not `ArmyOps.ini` or `Default.ini`. Check `Overlay/System/server.ini`.
- **`System/Server.exe not found`**: `Server/` must contain the game folder itself (`Server/System/Server.exe`), not a folder that contains it.
