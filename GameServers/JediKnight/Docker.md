---
sidebar_label: Docker
---

# Star Wars Jedi Knight: Dark Forces II Docker Container

This Docker container runs a Jedi Knight: Dark Forces II dedicated server. The original game has no dedicated server, so the container runs [OpenJKDF2](https://github.com/shinyquagsire23/OpenJKDF2), the open-source reimplementation of the engine, with `-headless -dedicatedServer`. It is built on the WINE image and runs the Windows build of OpenJKDF2, so the server is the same binary your clients run. The container doesn't download the game, so you provide the files.

## Quick Start

```yaml
services:
  jediknight:
    image: lancommander/jediknight:latest
    container_name: jediknight

    ports:
      - 27020:27020/udp

    volumes:
      - "/data/Servers/Jedi Knight/Deathmatch:/config"

    environment:
      JK_SERVER_NAME: "My Jedi Knight Server"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Before the first start, copy a Jedi Knight install with OpenJKDF2 in it, the folder that contains `openjkdf2-64.exe`, `Episode/` and `Resource/`, into `Server/`. You can instead set `JK_ARCHIVE_URL` to a zip of that folder.

Clients must run the same OpenJKDF2 version as the server. The LANCommander package of the game uses v0.8.15.

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitialization/20-InstallJediKnight.ps1` checks for `Server/openjkdf2-64.exe`. If it's missing and `JK_ARCHIVE_URL` is set, the hook downloads and extracts the archive and remounts the overlay.
3. `PostInitialization/30-ConfigureJediKnight.ps1` sets `bIsDedicated` and writes the non-empty `JK_*` settings into `registry.json`.
4. `START_EXE` (`/usr/local/bin/jediknight-server`) runs `openjkdf2-64.exe -headless -dedicatedServer -debug log -verbose 1 [START_ARGS]` from the game folder under Wine and Xvfb, and streams `debug.log` to `docker logs`.

The server has no console and logs very little. At `-verbose 1` a running server's log is only these lines, which are harmless:

```
Premature 'END' found after only 787 lines in 'ui\jkstrings.uni'.  Check number in 'MSG xxx' header.
...
```

To check that the server is up, look for its UDP port inside the container (`698C` is 27020 in hex):

```bash
docker exec jediknight sh -c 'cat /proc/net/udp6'
```

## Configuration Options

### Ports

- **27020/udp**: Game (`JK_PORT`). OpenJKDF2 uses Valve's GameNetworkingSockets, on one UDP port.

Players join by address (Multiplayer > Join Game).

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### registry.json

OpenJKDF2 keeps the settings the original game stored in the Windows registry in `registry.json`, in the game folder. The dedicated server reads all of its settings from it: the keys the Host Game menu saves. The hook edits it through the merged view, so the edited copy is in `Overlay/` and is yours to change. A key that also has a non-empty `JK_*` variable is overwritten on every start.

| Key | Meaning |
|-----|---------|
| `gameName` | Server name |
| `serverPassword` | Join password |
| `serverEpisodeGob`, `serverMapJkl` | Episode and first level |
| `portNum` | UDP port |
| `maxPlayers` | Player slots, not counting the server |
| `maxRank` | Highest Jedi rank, 0-8 |
| `scoreLimit`, `bUseScoreLimit` | Score limit |
| `timeLimit`, `bUseTimeLimit` | Time limit, in milliseconds |
| `bIsTeams`, `bIsSingleLevel` | Team play, stay on one level |
| `tickRate` | Network update interval, ms |
| `gameFlags`, `sessionFlags` | Bit fields the game builds from the keys above. The hook keeps the teams, limit and password bits in sync |

The server rewrites `registry.json` when it starts, so `maxPlayers` and the flag fields can change slightly after the first start.

### Levels

| `JK_EPISODE` | Levels (`JK_MAP`) |
|--------------|-------------------|
| `JK1MP` | `m2.jkl`, `m4.jkl`, `m5.jkl`, `m10.jkl`, `m_boss15.jkl`, `m_boss17.jkl` |
| `JK1CTF` | `c1.jkl`, `c2.jkl`, `c3.jkl` |

Add-on episodes go in `Overlay/Episode/` as `.gob` files. Use the file name without `.gob` as `JK_EPISODE`.

### Hooks

| Hook | When |
|------|------|
| `PreInstallJediKnight` / `PostInstallJediKnight` | Around the game file check/download |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **The container exits right away with no log**: OpenJKDF2 creates a window while starting, even with `-headless`, and exits with code 255 without a display. Keep `WINE_XVFB=true`.
- **The server uses most of a CPU core while idle**: the game loop doesn't sleep in dedicated mode, and the dedicated server ignores the frame limit setting (`r_fpslimit`). Limit the container (`cpus: 1` in compose) if that matters.
- **Clients can't connect, or disconnect straight away**: check that the client runs the same OpenJKDF2 build as the server. The network protocol is not compatible across releases.
- **The server starts on the wrong level**: `JK_MAP` must be a level inside `JK_EPISODE`. See the table above.
- **`XDG_RUNTIME_DIR (/tmp) is not owned by us`** and **`ALSA lib ... cannot find card '0'`**: harmless; the server runs without sound.
- **More logging**: set `JK_VERBOSE=2`, or add `-verboseNetworking` to `START_ARGS`.
