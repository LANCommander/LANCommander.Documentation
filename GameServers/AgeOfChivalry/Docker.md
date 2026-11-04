# Age of Chivalry Docker Container

This Docker container provides a fully configured Age of Chivalry game server that automatically downloads and updates the game via SteamCMD (anonymous login, app `17515`) and supports file overlaying using OverlayFS.

## Quick Start

```yaml
services:
  aoc-battleground:
    image: lancommander/ageofchivalry:latest
    container_name: aoc-battleground

    ports:
      - 27015:27015/udp
      - 27015:27015/tcp
      - 27080:80 # For FastDL support

    volumes:
      - "/data/Servers/Age of Chivalry/Battleground:/config"

    environment:
      START_ARGS: "-game ageofchivalry -console -norestart -insecure +maxplayers 16 +map aoc_battleground"

    user: root

    # The server only prints its console when stdout is a TTY
    tty: true

    cap_add:
      - SYS_ADMIN

    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

## Configuration Options

### Ports

The container exposes the following ports:

- **27015/udp** - Main game server port (default). Clients connect to this port to join the server, and server browser queries (A2S) are answered on it.
- **27015/tcp** - RCON (remote console). The server listens on the container's IP address, not on `127.0.0.1`.
- **27020/udp** - SourceTV port (optional).
- **80/tcp** - HTTP file server port (optional). Used for serving game files to clients (See [FastDL](https://developer.valvesoftware.com/wiki/FastDL)).

The server also binds 27005/udp (client port) and 26901/udp (Steam); neither needs to be published.

**Port Mapping:**
In the example configuration, ports are mapped as:
- `27015:27015/udp` - Maps host port 27015 to container port 27015
- `27015:27015/tcp` - Maps host port 27015 to container port 27015 (RCON)
- `27080:80` - Maps host port 27080 to container port 80

You can customize these mappings based on your network requirements. If you're running multiple servers, use different host ports for each instance.

### Volumes

The container requires a volume mount for the `/config` directory, which stores:

- **Server/** - Game files downloaded by SteamCMD (auto-created, about 3.9 GB)
- **Overlay/** - Custom files that overlay on top of the game directory
- **Merged/** - OverlayFS merged view (auto-created)
- **Scripts/** - Custom PowerShell scripts for hooks

**Example:**
```yaml
volumes:
  - "/data/Servers/Age of Chivalry/Battleground:/config"
```

The host path can be:
- An absolute path (Windows: `C:\data\...`, Linux: `/data/...`)
- A relative path (e.g., `./config:/config`)
- A named volume (e.g., `aoc-server-data:/config`)

**Important:** The mounted directory must be writable by the container.

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `STEAM_APP_ID` | Steam app id of the dedicated server | `17515` | No |
| `STEAM_VALIDATE` | Validate the game files when SteamCMD updates on startup (`true`/`false`) | `true` | No |
| `START_EXE` | Server executable (relative to the game directory) | `srcds_run` | No |
| `START_ARGS` | Arguments used to start the game server | `"-game ageofchivalry -console -norestart -insecure +maxplayers 16 +map aoc_battleground"` | No |
| `HTTP_FILESERVER_ENABLED` | Serve custom content over HTTP (FastDL) on port 80 | `true` | No |
| `HTTP_FILESERVER_WEB_ROOT` | Directory served by the HTTP file server | `/config/Merged/ageofchivalry` | No |
| `HTTP_FILESERVER_FILE_PATTERN` | Regex of request paths the file server allows | maps, materials, models and sound files | No |

#### `STEAM_VALIDATE`

SteamCMD updates the game server on every container start. With `STEAM_VALIDATE` set to `"true"` (the default) it also checks every game file, which takes longer; set it to `"false"` for faster restarts.

**Example:**
```yaml
environment:
  STEAM_VALIDATE: "false"
```

#### `START_ARGS`

Arguments passed to the game server executable at startup.

**Default:**
```yaml
START_ARGS: "-game ageofchivalry -console -norestart -insecure +maxplayers 16 +map aoc_battleground"
```

**Customization Example:**
```yaml
START_ARGS: "-game ageofchivalry -console -norestart -insecure +maxplayers 32 +map aoc_theshore +rcon_password secret"
```

**Common Server Parameters:**
- `+map <mapname>` - Set the starting map
- `+maxplayers <n>` - Player slots
- `+rcon_password <password>` - RCON password (the stock `server.cfg` doesn't set it, so the command line value stays in effect)
- `+ip <address>` - Server IP address (use `0.0.0.0` for all interfaces)
- `+port <port>` - Server port (default: 27015)
- `-insecure` - Disable VAC
- `-norestart` - Run the server directly instead of in `srcds_run`'s crash-restart loop. Without it, `srcds_run` stays the main process and restarts the server itself after a crash.

`hostname` and `sv_lan` are set by the stock `server.cfg` on every map load, which overrides the command line. Set them in your own `server.cfg` (see [Server Configuration](#server-configuration)).

### Security Options

The container requires elevated privileges to use OverlayFS for file overlaying.

#### `cap_add: SYS_ADMIN`

Adds the `SYS_ADMIN` capability, which is required for mounting OverlayFS. This is the recommended approach as it provides minimal necessary privileges.

```yaml
cap_add:
  - SYS_ADMIN
```

#### `security_opt: apparmor:unconfined`

On Ubuntu hosts with AppArmor enabled, you may need to disable AppArmor restrictions for the container. This is often necessary for OverlayFS to function properly.

```yaml
security_opt:
  - apparmor:unconfined
```

**Alternative Options:**

If you prefer less security but simpler configuration, you can use privileged mode:

```yaml
privileged: true
```

**Note:** Privileged mode grants the container extensive access to the host system and is less secure than using `cap_add: SYS_ADMIN`.

### Restart Policy

```yaml
restart: unless-stopped
```

This ensures the container automatically restarts if it stops unexpectedly, but won't restart if you manually stop it.

**Other options:**
- `no` - Never restart
- `always` - Always restart, even after manual stop
- `on-failure` - Restart only on failure

## Directory Structure

The `/config` directory contains the following structure:

```
/config/
├── Server/                # Game files from SteamCMD (auto-created)
│   ├── srcds_run          # Launcher script
│   ├── srcds_i486         # 32-bit dedicated server binary
│   ├── bin/               # Engine libraries
│   ├── hl2/               # Shared Half-Life 2 content
│   └── ageofchivalry/     # Age of Chivalry game directory
├── Overlay/               # Custom files overlay (your modifications)
│   └── ageofchivalry/
│       ├── maps/          # Custom maps
│       ├── cfg/           # Server configuration files (server.cfg, etc.)
│       ├── mapcycle.txt   # Map rotation
│       └── ...
├── Merged/                # OverlayFS merged view (auto-created)
├── .overlay-work/         # OverlayFS work directory (auto-created)
└── Scripts/
    └── Hooks/             # Custom PowerShell scripts for hooks
```

## Game Configuration

### Server Configuration

Place server configuration files in:

```
/config/Overlay/ageofchivalry/cfg/
```

The stock `ageofchivalry/cfg/server.cfg` runs on every map load and contains only:

```
// server name
hostname   		"Age of Chivalry Server"

// operation
sv_lan 0
```

An `Overlay/ageofchivalry/cfg/server.cfg` replaces it. For a LAN server:

```
hostname "My Age of Chivalry Server"
sv_lan 1
rcon_password "your_rcon_password"
```

### Maps

The server ships these 18 maps, in this order in the stock `ageofchivalry/mapcycle.txt`:

`aoc_theshore`, `aoc_darkforest`, `aoc_stoneshill`, `aoc_overlook`, `aoc_galadan`, `aoc_siege`, `aoc_valley`, `aoc_helms_deep`, `aoc_battleground`, `aoc_firecrag`, `aoc_sorrow`, `aoc_invasion`, `aoc_monastery`, `aoc_westerlyn`, `aoc_tournament`, `aoc_tombs`, `aoc_meleefields`, `aoc_fight_pub`

Each map also has a KeyValues file, `ageofchivalry/maps/<map>.cfg`, with its display name, a `time` value and the next map after each side wins (`next_maps` → `goodwins`/`evilwins`). For example, `aoc_battleground.cfg` has `time "20"` and sends both sides to `aoc_firecrag`. To change the rotation, overlay your own `mapcycle.txt` and/or the per-map `.cfg` files.

## OverlayFS

The container uses Linux OverlayFS to merge the base game files with your custom files:

- **Lower layer**: `/config/Server` (base game files from SteamCMD)
- **Upper layer**: `/config/Overlay` (your custom files)
- **Merged view**: `/config/Merged` (where the game server runs from)

**Benefits:**
- Replace files without modifying the base installation
- Add custom content (maps, configs)
- No file copying required - OverlayFS is a union filesystem
- Easy updates - base game files can be updated without losing customizations

If OverlayFS cannot be mounted (e.g., missing privileges), the container will fall back to using `/config/Server` directly and log a warning.

## Troubleshooting

### Container Won't Start

1. **Check logs:**
   ```bash
   docker logs aoc-battleground
   ```

2. **Verify permissions:**
   Ensure the mounted volume is writable:
   ```bash
   chmod -R 755 "/data/Servers/Age of Chivalry/Battleground"
   ```

3. **Check security options:**
   Ensure `cap_add: SYS_ADMIN` is set, or use `privileged: true`

### Game Server Not Starting

1. **Verify START_ARGS:**
   Check that `START_ARGS` contains `-game ageofchivalry` and a valid map:
   ```yaml
   START_ARGS: "-game ageofchivalry -console -norestart -insecure +maxplayers 16 +map aoc_battleground"
   ```

2. **Check server directory:**
   Verify that game files were downloaded:
   ```bash
   docker exec aoc-battleground ls -la /config/Server/ageofchivalry
   ```

3. **Review server logs:**
   Check container logs for server startup messages and errors. Add `-condebug` to `START_ARGS` to also write `ageofchivalry/console.log`.

### No Server Console Output in `docker logs`

The 2007 server only writes its console (map loads, `Network: IP ...` and so on) to stdout when stdout is a TTY. Without one, the log stops after `Using SSE2 Optimised binary.` while the server runs normally. Set `tty: true` in compose (or `-t` with `docker run`), or add `-condebug` to `START_ARGS` to write `ageofchivalry/console.log`.

### `sv_lan` or `hostname` Has No Effect

The stock `server.cfg` sets `hostname` and `sv_lan 0` on every map load, which overrides `+sv_lan`/`+hostname` in `START_ARGS`. Set them in `/config/Overlay/ageofchivalry/cfg/server.cfg`. RCON listens on the container's IP address, so connect to that (or the published host port), not to `127.0.0.1` inside the container.

### Clients Can't Join: Version Mismatch

The dedicated server app has only the `public` branch, which carries the final release, `PatchVersion=1.0.0.6` in `ageofchivalry/steam.inf`. Clients need the same version. A2S replies report it as the game version.

### SourceMod / MetaMod

SourceMod isn't installed and isn't supported. Age of Chivalry runs on the original 2007 Orange Box engine. MetaMod:Source 1.11 and 1.12 ship an `ep2` build, and SourceMod ships `game.aoc.txt` gamedata, but with MetaMod loaded the server hangs right after `Network: IP ..., mode MP, dedicated Yes, ports 27015 SV / 27005 CL`.

### `ERROR! Failed to install app '17515' (Missing configuration)`

A fresh SteamCMD (no cached app info) can fail to install a dedicated server with this error. The image handles this in the `PreSteamInstallGame/10-BootstrapInstall.ps1` hook: when `Server/steamapps/appmanifest_17515.acf` doesn't exist yet, it refreshes the app info (`app_info_update 1`) and installs in the same SteamCMD session. Later updates work as usual. If the first install was interrupted, delete `Server/steamapps/appmanifest_17515.acf` and restart the container to run the bootstrap again.

### Harmless Startup Messages

These appear on every start:

- `Unable to load Steam library.` The engine looks for the legacy Steam ticket validation library (`bin/libsteamvalidateuseridtickets_i486.so`), which the depot doesn't include. The server still loads maps and answers queries. Run with `-insecure` and `sv_lan 1` so it doesn't try to validate clients with Steam.
- `Particles: Missing 'particles/....pcf'` (Half-Life 2: Episode Two particle files the mod doesn't ship)
- `Failed to load $include VMT file (...)`
- `Error Vertex File for 'AoC_Weapon/w_spear.mdl' checksum ... should be ...`
- `ConVarRef mat_dxlevel doesn't point to an existing ConVar` and `ConVarRef room_type doesn't point to an existing ConVar`
- `Dynamic prop prop_dynamic: no sequence named:turn`

### Port Already in Use

If you get port binding errors:

1. **Check for existing containers:**
   ```bash
   docker ps -a
   ```

2. **Use different ports:**
   Change the port mapping in docker-compose.yml:
   ```yaml
   ports:
     - 27016:27015/udp  # Use a different host port
   ```

3. **Stop conflicting containers:**
   ```bash
   docker stop <container-name>
   ```

### Permission Errors

The container runs as a non-root user. If you encounter permission errors:

1. **Check file ownership:**
   ```bash
   docker exec aoc-battleground ls -la /config
   ```

2. **Verify volume mount:**
   Ensure the host directory is accessible and writable

3. **Review logs:**
   Check container logs for specific permission error messages

## Advanced Usage

### Custom Hooks

You can create custom PowerShell scripts that execute at various points in the container's lifecycle. Place scripts in:

```
/config/Scripts/Hooks/{HookName}/
```

**Available hooks:**
- `PreSteamInstallGame` - Before SteamCMD runs
- `PostSteamInstallGame` - After SteamCMD completes

**Example hook script** (`/config/Scripts/Hooks/PostSteamInstallGame/10-CustomSetup.ps1`):
```powershell
Write-Host "Running custom setup..."
# Your custom commands here
```

### HTTP File Server

The container includes an optional HTTP file server (port 80) for serving game files to clients. This is useful for fast downloads of custom maps and content. Point `sv_downloadurl` in `server.cfg` at it.

The file server is configured via environment variables:
- `HTTP_FILESERVER_ENABLED` - Enable/disable the file server
- `HTTP_FILESERVER_WEB_ROOT` - Root directory for file serving
- `HTTP_FILESERVER_FILE_PATTERN` - Pattern for files to serve

### Multiple Server Instances

To run multiple Age of Chivalry servers on the same host:

1. **Use different container names:**
   ```yaml
   container_name: aoc-server1
   ```

2. **Use different ports:**
   ```yaml
   ports:
     - 27016:27015/udp
     - 27016:27015/tcp
   ```

3. **Use different volume mounts:**
   ```yaml
   volumes:
     - "/data/Servers/Age of Chivalry/Server1:/config"
   ```

4. **Use different maps:**
   ```yaml
   environment:
     START_ARGS: "-game ageofchivalry -console -norestart -insecure +maxplayers 16 +map aoc_theshore"
   ```

## Additional Resources

- [Source Dedicated Server Documentation](https://developer.valvesoftware.com/wiki/Source_Dedicated_Server)
