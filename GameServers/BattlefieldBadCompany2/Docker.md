---
sidebar_label: Docker
---

# Battlefield: Bad Company 2 Docker Container

This Docker container runs a Battlefield: Bad Company 2 LAN server: the R34 dedicated server from Bc2emu V0.9 under Wine. The server files are built into the image, so there is nothing to download or supply. EA's login and server browser services are gone, so the server registers with a master server emulator at `BFBC2_MASTER_SERVER`, e.g. the LANCommander server's BFBC2 master server plugin.

## Quick Start

```yaml
services:
  bfbc2:
    image: lancommander/battlefieldbadcompany2:latest
    container_name: bfbc2

    networks:
      lan:

    volumes:
      - "/data/Servers/Battlefield Bad Company 2/Rush:/config"

    environment:
      BFBC2_MASTER_SERVER: "192.168.1.10"
      BFBC2_MODE: rush
      BFBC2_SERVER_NAME: "Bad Company 2 LAN"
      BFBC2_ADMIN_PASSWORD: "change-me"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped

networks:
  lan:
    external: true
```

Give the container its own LAN address (e.g. a macvlan network). The master server hands players the address it sees the game server connect from, so Docker's port mapping and NAT get in the way.

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (WINE image) creates the Wine prefix in `/config/wineprefix`. Its `PostInitializeWinePrefix` hook, `20-InstallRuntimes.ps1`, installs native `dinput8` and the Visual C++ 2005/2008/2010 runtimes with winetricks, from installers cached in the image. This takes a few minutes on the first start only.
2. `PostInitialization/20-InstallBadCompany2.ps1` copies the server files from `/opt/bfbc2/server` into `Server/` when they aren't there yet, and remounts the overlay. It writes `Server/.lancommander-bc2emu`; server files without it are yours and are left alone.
3. `START_EXE` (`/usr/local/bin/bfbc2-server`):
   - writes `bfbc2.ini`, `Instance/ServerOptions.ini`, `Instance/AdminScripts/Startup.txt` and `Instance/maplist.txt` from the `BFBC2_*` settings;
   - runs `Frost.Game.Main_Win32_Final.exe -serverInstancePath Instance/ -port <BFBC2_PORT> -mapPack2Enabled 1 -region <BFBC2_REGION> -heartBeatInterval 20000` under Wine and Xvfb (`Win32Game.cfg` adds `-server -dedicated`);
   - follows the server's log, `Instance/RuntimeLog_<HOSTNAME>_server.log`, into `docker logs`, without the frame timing line it writes every 10 seconds.


A server that is up and registered with the master server logs:

```
Starting rush (BC2) server 'Bad Company 2 LAN' on 19567/udp, master server 192.168.1.10: ...
[UTC ...] Engine/Game/Server/ServerRemoteAdministration.cpp(77): "Main": Info: Remote Administration interface is listening on port 0.0.0.0:48888
[UTC ...] Engine/Game/GameplayServer/Level/ServerLevel.cpp(492): "Main": Info: ------------ Server level 'Levels/MP_002' started -------------
[UTC ...] Engine/Game/Server/Backend/Plasma/ServerGameManagerListener.cpp(838): "Main": Info: Server is now accepting players from the Plasma backend
```

The first start takes a few minutes (winetricks, copying the server files); later starts about a minute. The server uses about 10% of a core and 120 MB of memory idle.

## Configuration Options

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### Game modes and maplists

`BFBC2_MODE` picks a maplist from `maplists/` in the server folder and the mod (`GameModID`):

| `BFBC2_MODE` | Maplist | Mod |
|---|---|---|
| `rush` | `rush.txt` | BC2 |
| `conquest` | `conquest.txt` | BC2 |
| `sqdm` | `sqdm.txt` | BC2 |
| `sqrush` | `sqrush.txt` | BC2 |
| `vietrush` | `viet_rush.txt` | VIETNAM |
| `vietconquest` | `viet_conquest.txt` | VIETNAM |
| `vietsqdm` | `viet_sqdm.txt` | VIETNAM |
| `vietsqrush` | `viet_sqrush.txt` | VIETNAM |

The default maplists are copied into `Overlay/maplists/` on the first start; edit them there. The first line is the game mode (`RUSH`, `CONQUEST`, `SQDM`, `SQRUSH`), then one level per line. `#` starts a comment.

### Startup commands

`Instance/AdminScripts/Startup.txt` runs as remote admin commands when the server starts. It gets the `vars.*` settings from the environment, then each line of `BFBC2_STARTUP_COMMANDS`:

```yaml
environment:
  BFBC2_STARTUP_COMMANDS: |
    levelVars.set gamemode RUSH tickets 150
    levelVars.set gamemode RUSH ticketBleedSpeed 50
```

The level settings are `tickets`, `ticketBleedSpeed`, `vehicleSpawnRate`, `vehiclesDisabled`, `startDelay` and `respawnDelay` (BFBC2 PC Server Administration docs, "List of implemented settings").

### Remote admin

The server listens for RCON on `BFBC2_ADMIN_PORT` (48888/tcp), on all addresses (`RemoteAdminPort=0.0.0.0:<port>`; a bare port number only accepts localhost). Procon and OpenRCON work. With `BFBC2_ADMIN_PASSWORD` empty, a new random password is printed in `docker logs` on every start.

### Master server

The server logs in to the master server on 19021/tcp and registers on 19026/tcp, at `BFBC2_MASTER_SERVER`. Several game servers can use the same master server; they all show up in its server browser.

### Clients

Each player needs `dinput8.dll` and `bfbc2.ini` from `Bc2emu_V09.rar` (`Crack - Copy to client root`) in the game folder, on an R11 client, with `host=` in `bfbc2.ini` set to the master server's address. A LANCommander script can set it:

```powershell
Update-IniValue -Section "info" -Key "host" -Value $ServerIp -FilePath "$InstallDirectory\bfbc2.ini"
```

### Hooks

| Hook | When |
|------|------|
| `PreInstallBadCompany2` / `PostInstallBadCompany2` | Around the server file copy |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **The server isn't in the server browser**: check that `BFBC2_MASTER_SERVER` is reachable on 19021/tcp and 19026/tcp, and that the log shows `Server is now accepting players from the Plasma backend`. The master server lists the game server at the address it connected from, so that has to be an address players can reach (not a NAT'd one).
- **`BFBC2_MASTER_SERVER is empty`**: it's required; set it to the master server's address.
- **The game asks for a serial number**: the client is talking to EA, not the master server. Check that `dinput8.dll` is next to `BFBC2Game.exe` and `host=` is set in `bfbc2.ini`.
- **Can't create an account**: names must be 3–32 characters with no spaces or special characters; persona names up to 16.
- **Edits to `bfbc2.ini`, `ServerOptions.ini`, `Startup.txt` or `maplist.txt` are lost**: they are generated on every start. Use the environment variables, `BFBC2_STARTUP_COMMANDS` and `maplists/`.
- **Squad Deathmatch shows 16 slots**: the game caps SQDM at 16 players (4 squads of 4), whatever `BFBC2_MAX_PLAYERS` says.
- **`Error: Unable to open ProviderId.dat`** in the server log, and the server never registers: `ProviderID.dat` is missing from the server folder. It ships with Bc2emu; with your own server files, copy it over.
- **No log-file console in LANCommander**: the server's log name contains the computer name (the container's hostname), so the image can't label it. It is followed into `docker logs` instead.
- **Slow first start**: the winetricks installs and the 420 MB copy into `Server/` happen once.
