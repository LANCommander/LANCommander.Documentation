---
sidebar_label: Docker
---

# Giants: Citizen Kabuto Docker Container

This Docker container runs a Giants: Citizen Kabuto (2000) dedicated server. It is built on the WINE image and runs the 1.5 community patch's `GiantsDedicated.exe -dedicated <file>.gdf` under Wine and Xvfb. The container doesn't download the game, so you provide the files.

## Quick Start

```yaml
services:
  giants:
    image: lancommander/giantscitizenkabuto:latest
    container_name: giants

    ports:
      - 19711:19711/udp

    volumes:
      - "/data/Servers/Giants - Citizen Kabuto/Default:/config"

    environment:
      GIANTS_SERVER_NAME: "My Giants Server"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Copy a Giants install with the **1.5** patch (the folder with `GiantsDedicated.exe`, `Bin/` and `Stream/`) into `Server/` before the first start. You can instead set `GIANTS_ARCHIVE_URL` to a zip of that folder.

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitializeWinePrefix/20-InstallDirectPlay.ps1` runs `winetricks directplay` once, using the DirectX redist cached in the image. This installs Microsoft's `dpnet.dll` and related DLLs. Giants hosts with DirectPlay 8, and Wine's builtin `dpnet` can't host. A marker file, `wineprefix/.lancommander-directplay`, records that the install is done. Delete it to reinstall.
3. `PostInitialization/20-InstallGiants.ps1` checks for `Server/GiantsDedicated.exe`. If it's missing and `GIANTS_ARCHIVE_URL` is set, the hook downloads the archive.
4. `PostInitialization/30-ConfigureGiants.ps1` writes `Bin/<GIANTS_GDF_NAME>.gdf` from the `GIANTS_*` variables (it lands in `Overlay/Bin/`).
5. `START_EXE` (`/usr/local/bin/giants-server`) runs `wine-run GiantsDedicated.exe -dedicated <name>.gdf -port <GIANTS_PORT> -noaudio -framelimit <GIANTS_FRAME_LIMIT> [-nomaster]` from the game root and follows `Giants.log` to stdout.

`GiantsDedicated.exe` is the game with its 3D UI, so it needs a display: without one it logs `CreateWindowEx failed` and exits. It writes nothing to stdout. A successful start looks like:

```
Starting: GiantsDedicated.exe -dedicated lancommander.gdf -port 19711 -noaudio -framelimit 30 -nomaster
[23:18:38 23:18.023] [Giants Dedicated] [info] [32] Starting Giants v1.500.0.0
[23:18:38 23:18.079] [Giants Dedicated] [info] [32] No server console found -- skipping console initialization.
```

The "no server console" line is expected. The patch can load an optional `ServerConsole.dll` for a dialog UI, which a headless server doesn't need.

## Configuration Options

### Ports

- **19711/udp**: Game (DirectPlay 8 host, `GIANTS_PORT`). It also answers DirectPlay session enumeration.

DirectPlay also opens a few dynamic UDP ports. Giving the container its own LAN address (macvlan/ipvlan) is the most reliable setup. The server binds per interface, so query it on the container's LAN IP rather than 127.0.0.1.

To check that the server is up, send the DirectPlay enumeration packet `00 02 12 34 02` to UDP 19711. The reply holds the game name (UTF-16), the current world's description ("Mecc v. Mecc - Desert Snakes"), the player count (the server counts as one) and the max players. The application data bytes after `ff` are the game type and the teams.

### Environment Variables

See the [README](../README.md#environment-variables) for the table, the rotation format and the world list.

### Rotation file

`.gdf` is a binary file. The layout, read from the setup tool `dedicated.exe` v1.06:

| Offset | Size | Field |
|--------|------|-------|
| `0x000` | int32 | version, `4` |
| `0x004` | int32 | number of games |
| `0x008` | int32 | max players |
| `0x00c` | byte | no voting |
| `0x00d` | char[31] | game name |
| `0x02d` | char[255] | message of the day |
| `0x130` | 0x140 each | games |

Each game:

| Offset | Size | Field |
|--------|------|-------|
| `0x00` | int32 | vimp meat energy (0 easy, 1 medium, 2 hard) |
| `0x04` | int32 | max smarties, an index into 15, 13, 10, 7, 4, 0 |
| `0x08` | int32 × 5 | points per kill, points per capture, player score limit, team score limit, time limit |
| `0x1c` | int32 | first base destroyed |
| `0x20` | int32 | game type (0 `DM` to 7 `DefendBaseCap`) |
| `0x24` | int32 | teams (0 `MvM`, 1 `MvMvM`, 2 `RvR`, 3 `MvR`, 4 `MvRvK`, 5 `MvK`, 6 `RvK`) |
| `0x28` | int32 | the setup tool's world list index (not used by the server) |
| `0x2c` | int32 × 3 | damage teammates, no vimps, detente |
| `0x38` | char[256] | world, e.g. `m_mecc_desertsnakes` |
| `0x138` | uint32 × 2 | unavailable Mecc / Reaper weapons |

The hook regenerates the file on every start while `Bin/<name>.gdf.lancommander` exists. Without that marker file it leaves the `.gdf` alone, so you can save your own from `dedicated.exe` (it must be saved in `Bin/`) and set `GIANTS_GDF_NAME` to it.

### Hooks

| Hook | When |
|------|------|
| `PreInstallGiants` / `PostInstallGiants` | Around the game file check/download |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **The server exits with "Server rotation Bin/lancommander.gdf not found".** The configure hook rejected a setting. Its reason is in the log above, for example an unknown world, game type or team. The hook removes the old rotation first, so the server doesn't quietly start the previous one.
- **The server runs but UDP 19711 doesn't answer.** A `.gdf` you wrote yourself probably names a world that doesn't exist. GiantsDedicated then shows a "Giants Fatal Error" message box and waits forever, which you can't see in a container. Generated rotations are checked first.
- **The wrong world is played.** A world that doesn't suit the teams is replaced by the server without a message (MvM on `m_3way_l1` played `m_mecc_desertsnakes`). Use `m_mecc_*` worlds for MvM, `m_reaper_*` for RvR and `m_3way_*` for the others.
- **`Cannot host a multiplayer game (Code 80004001)` in the log.** The prefix has Wine's builtin DirectPlay. Delete `wineprefix/.lancommander-directplay` and restart to reinstall the native DLLs.
- **High CPU.** The server renders its 3D view as fast as it can. Lower `GIANTS_FRAME_LIMIT` (20 uses about 14% of a core).
- **Edits to `Overlay/` from the host while the container runs don't show up.** OverlayFS caches the upper directory. Restart the container, or edit through `Merged/` inside it (`docker exec`).
- ALSA "cannot find card" and `XDG_RUNTIME_DIR` messages in the log are harmless; the server runs with `-noaudio`.
