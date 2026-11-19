# Project Zomboid Docker Container

This Docker container provides a Project Zomboid dedicated server that automatically downloads and updates the game via SteamCMD, configures the server from environment variables, and supports file overlaying using OverlayFS.

## Quick Start

```yaml
services:
  projectzomboid-survival:
    image: lancommander/projectzomboid:latest
    container_name: projectzomboid-survival

    ports:
      - 16261:16261/udp
      - 16262:16262/udp

    volumes:
      - "/servers/Project Zomboid/Survival:/config"

    environment:
      PZ_SERVER_NAME: "survival"
      PZ_ADMIN_PASSWORD: "change-me"
      PZ_PUBLIC_NAME: "My Project Zomboid Server"
      PZ_MEMORY: "4g"

    user: root

    cap_add:
      - SYS_ADMIN

    security_opt:
      - apparmor:unconfined

    stop_grace_period: 30s
    restart: unless-stopped
```

## Configuration Options

### Ports

The container exposes the following ports:

- **16261/udp** - Game traffic. Clients connect to this port. Set with `PZ_PORT` (`DefaultPort`).
- **16262/udp** - Direct (RakNet) connections. Set with `PZ_UDP_PORT` (`UDPPort`).
- **8766/udp**, **8767/udp** - Steam game server ports (Steam mode only).
- **27015/tcp** - RCON, when `PZ_RCON_PASSWORD` is set. Set with `PZ_RCON_PORT` (`RCONPort`).

If you change the ports, change the port mappings to match. When running several servers on one host with bridge networking, give each its own ports.

### Volumes

The container requires a volume mount for the `/config` directory, which stores:

- **Server/** - Game files downloaded by SteamCMD (auto-created, about 3 GB)
- **Overlay/** - Custom files that overlay on top of the game directory
- **Merged/** - OverlayFS merged view (auto-created)
- **Zomboid/** - The server's Zomboid folder (`PZ_CACHE_DIR`): settings, the world, player accounts and logs
- **Scripts/** - Custom PowerShell scripts for hooks

**Important:** The mounted directory must be writable by the container.

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `STEAM_APP_ID` | Steam app id of the dedicated server | `380870` | No |
| `STEAM_BRANCH` | Steam branch to install, e.g. `legacy41` for Build 41 | *(unset, public build)* | No |
| `START_EXE` | Server launcher | `pz-server` | No |
| `START_ARGS` | Extra arguments passed to the server | *(empty)* | No |
| `PZ_SERVER_NAME` | Name of the server's config and save set | `servertest` | No |
| `PZ_CACHE_DIR` | The server's Zomboid folder (config, saves, logs, accounts) | `/config/Zomboid` | No |
| `PZ_ADMIN_USERNAME` | Admin account name | *(unset, `admin`)* | No |
| `PZ_ADMIN_PASSWORD` | Admin account password | `changeme` | No |
| `PZ_MEMORY` | JVM heap (`-Xms`/`-Xmx`), e.g. `4g` | *(unset, from `ProjectZomboid64.json`)* | No |
| `PZ_STEAM` | `false` runs the server with `-nosteam` | `true` | No |
| `PZ_PUBLIC_NAME` | `PublicName`: name shown in the server browser | *(unset)* | No |
| `PZ_PUBLIC_DESCRIPTION` | `PublicDescription` | *(unset)* | No |
| `PZ_MAX_PLAYERS` | `MaxPlayers` | *(unset, stock: `32`)* | No |
| `PZ_PASSWORD` | `Password`: join password | *(unset, stock: none)* | No |
| `PZ_PORT` | `DefaultPort`: game port (UDP) | *(unset, stock: `16261`)* | No |
| `PZ_UDP_PORT` | `UDPPort`: direct connection port (UDP) | *(unset, stock: `16262`)* | No |
| `PZ_RCON_PORT` | `RCONPort` (TCP) | *(unset, stock: `27015`)* | No |
| `PZ_RCON_PASSWORD` | `RCONPassword`; RCON is off while it's empty | *(unset)* | No |
| `PZ_PUBLIC` | `Public`: list the server on the Steam server browser | *(unset, stock: `false`)* | No |
| `PZ_PVP` | `PVP` | *(unset, stock: `true`)* | No |
| `PZ_PAUSE_EMPTY` | `PauseEmpty`: stop the clock while nobody is online | *(unset, stock: `true`)* | No |
| `PZ_MAP` | `Map` | *(unset, stock: `Muldraugh, KY`)* | No |
| `PZ_MODS` | `Mods` | *(unset)* | No |
| `PZ_WORKSHOP_ITEMS` | `WorkshopItems` | *(unset)* | No |
| `PZ_INI_<Key>` | Sets any other `<Key>` in `<name>.ini` | | No |
| `HTTP_FILESERVER_ENABLED` | HTTP file server on port 80 (the game has nothing to serve) | `false` | No |

#### `PZ_*` and `PZ_INI_*`

On every start, `PostInitialization/30-ConfigureServer.ps1` writes each `.ini` variable that is set into `/config/Zomboid/Server/<PZ_SERVER_NAME>.ini`, creating the file on the first start (the server then adds every other option with its default). `PZ_INI_<Key>` sets any key by name, e.g. `PZ_INI_SpawnItems=Base.Hammer`. Empty variables leave the value in the file alone, so settings you edit by hand survive. Passwords are masked in the log.

#### `PZ_MEMORY`, `PZ_STEAM` and `START_ARGS`

The launcher `pz-server` starts the bundled Java runtime with the classpath and JVM options from `ProjectZomboid64.json`, replacing `-Xms`/`-Xmx` with `PZ_MEMORY` and `-Dzomboid.steam` with `PZ_STEAM`. It passes `-cachedir`, `-servername`, `-adminpassword` (and `-nosteam`, `-port`, `-udpport`, `-adminusername` when set) itself; `START_ARGS` is added after those, e.g. `-debug`.

#### `STEAM_VALIDATE`

SteamCMD updates the game server on every container start. With `STEAM_VALIDATE` set to `"true"` (the default) it also checks every game file, which takes longer; set it to `"false"` for faster restarts.

### Security Options

The container requires elevated privileges to use OverlayFS for file overlaying.

```yaml
cap_add:
  - SYS_ADMIN
security_opt:
  - apparmor:unconfined
```

`privileged: true` also works, but grants the container far more access than it needs.

## Directory Structure

```text
/config/
├── Server/                         # Game files (SteamCMD)
├── Overlay/                        # Files overlaid on the game directory
├── Merged/                         # Merged view the server runs from
├── Zomboid/
│   ├── Server/<name>.ini           # Server settings
│   ├── Server/<name>_SandboxVars.lua
│   ├── Server/<name>_spawnregions.lua
│   ├── Saves/Multiplayer/<name>/   # The world
│   ├── db/<name>.db                # Player accounts
│   └── server-console.txt          # Console log of the current run
└── Scripts/Hooks/                  # Custom hook scripts
```

## Game Configuration

### `<name>.ini`

Server settings: name, password, PvP, safehouses, factions, chat, spawn items, respawn options. Edit it while the server is stopped, or set keys with `PZ_INI_<Key>`.

### `<name>_SandboxVars.lua`

Gameplay: zombie population and lore, loot, vehicles, XP multipliers, day length, character creation points. Each option is documented in the file. Most options only affect parts of the world that haven't been generated yet; delete `Zomboid/Saves/Multiplayer/<name>` to start a new world with them.

### `<name>_spawnregions.lua`

The towns players can choose to spawn in. Keep one entry to make everyone start in the same town.

### Admin account

`PZ_ADMIN_PASSWORD` sets the password of the `admin` account (or `PZ_ADMIN_USERNAME`) on every start. Without it the server waits for the password on its console on the first start.

## Troubleshooting

### Container Won't Start

Check the logs with `docker logs <container>`. The container must run as root (`user: root`) with `SYS_ADMIN` to mount the overlay; the server itself runs as an unprivileged user.

### `ERROR! Failed to install app '380870' (Missing configuration)`

A fresh SteamCMD fails the first install with this error until it has refreshed the app info. The `PreSteamInstallGame/10-BootstrapInstall.ps1` hook runs `app_info_update 1` and the install in one SteamCMD session (retrying up to three times) when `Server/steamapps/appmanifest_380870.acf` doesn't exist yet. If the first install was interrupted, delete that file and restart the container.

### Clients get "Server version is different"

Clients have to run the same build as the server. The image installs the current public build; set `STEAM_BRANCH` to match older clients (e.g. `legacy41`).

### The server is killed or runs out of memory

`ProjectZomboid64.json` asks for an 8 GB heap. Set `PZ_MEMORY` to what the host can spare (4 GB is plenty for a handful of players).

### Sandbox changes don't show up in game

Most sandbox options are applied when a part of the world is first generated. Change them before anyone joins, or delete `Zomboid/Saves/Multiplayer/<name>` to start a new world.

### "Waiting for response from Steam servers" at startup

In Steam mode the server waits up to about 40 seconds for Steam when it has no internet connection, then carries on.

### Harmless startup messages

`SLF4J(W): No SLF4J providers were found`, `Could not find icon`, `Missing ThumpSound for breakable object` and `Property Name not found: WindowShape` are printed on every start and don't affect the server.

## Advanced Usage

### Custom Hooks

You can create custom PowerShell scripts that execute at various points in the container's lifecycle. Place scripts in:

```
/config/Scripts/Hooks/{HookName}/
```

**Available hooks:**
- `PreInitialization` - Before the overlay is mounted
- `PostInitialization` - After the overlay is mounted; the game is installed by `20-InstallGame.ps1` and the `.ini` is configured by `30-ConfigureServer.ps1`
- `PreSteamInstallGame` - Before SteamCMD runs
- `PostSteamInstallGame` - After SteamCMD completes
- `ServerStarted` - Right before the server process starts
- `ServerStopped` - After the server process exits

### Multiple Server Instances

Give each instance its own container name, `/config` directory and ports:

```yaml
environment:
  PZ_SERVER_NAME: "second"
  PZ_PORT: "16263"
  PZ_UDP_PORT: "16264"
ports:
  - 16263:16263/udp
  - 16264:16264/udp
```

## Additional Resources

- [Project Zomboid on Steam](https://store.steampowered.com/app/108600/Project_Zomboid/)
- [Project Zomboid Dedicated Server on SteamDB](https://steamdb.info/app/380870/)
