# Battlefield 1942 Docker Container
This Docker container provides a Battlefield 1942 game server that automatically downloads the required server files and supports file overlaying using OverlayFS.

## Quick Start

```yaml
services:
  bf1942:
    image: lancommander/bf1942:latest
    container_name: bf1942

    ports:
      - 14567:14567/udp
      - 4711:4711/tcp   # RCON
      - 22000:22000/udp # Queries / heartbeats (LAN)
      - 27900:27900/tcp # Master server heartbeat

    volumes:
      - "/data/Servers/Battlefield 1942:/config"

    environment:
      # START_ARGS: "+statusMonitor 1"

    cap_add:
      - SYS_ADMIN

    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

## Configuration Options

### Ports

The container exposes the following ports:

- **14567/udp** - Main game server port (default). Clients connect to this port to join the server.
- **4711/tcp** - RCON port (optional)
- **22000/udp** - Queries / heartbeats (LAN) (optional)
- **27900/tcp** - Master server heartbeat

### Volumes

The container requires a volume mount for the `/config` directory, which stores:

- **Server/** - Base server files
- **Overlay/** - Custom files that overlay on top of the game directory
- **Merged/** - OverlayFS merged view (auto-created)
- **Scripts/** - Custom PowerShell scripts for hooks

**Example:**
```yaml
volumes:
  - "/data/Servers/Battlefield 1942:/config"
```

The host path can be:
- An absolute path (Windows: `C:\data\...`, Linux: `/data/...`)
- A relative path (e.g., `./config:/config`)
- A named volume (e.g., `bf1942-server:/config`)

**Important:** The mounted directory must be writable by the container.

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `START_ARGS` | Arguments used to start the game server | `"+statusMonitor 1"` | No |

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
├── Server/              # Game files from SteamCMD (auto-created)
│   └── mods
|       └── bf1942       # The base game server files
|       └── xpack1       # Road to Rome data files
|       └── xpack2       # Secret Weapons of WWII data files
├── Overlay/             # Custom files overlay (your modifications)
│   └── mods/
│       └── bf1942/
│           └── Levels/  # Custom maps
├── Merged/              # OverlayFS merged view (auto-created)
├── .overlay-work/       # OverlayFS work directory (auto-created)
└── Scripts/
    └── Hooks/           # Custom PowerShell scripts for hooks
```

## OverlayFS

The container uses Linux OverlayFS to merge the base game files with your custom files:

- **Lower layer**: `/config/Server` (base game files)
- **Upper layer**: `/config/Overlay` (your custom files)
- **Merged view**: `/config/Merged` (where the game server runs from)

**Benefits:**
- Replace files without modifying the base installation
- Add custom content (maps, plugins, configs)
- No file copying required - OverlayFS is a union filesystem
- Easy updates - base game files can be updated without losing customizations

If OverlayFS cannot be mounted (e.g., missing privileges), the container will fall back to using `/config/Server` directly and log a warning.

## Troubleshooting

### Container Won't Start

1. **Check logs:**
   ```bash
   docker logs bf1942
   ```

2. **Verify permissions:**
   Ensure the mounted volume is writable:
   ```bash
   # Linux
   chmod -R 755 "/data/Servers/Battlefield 1942"
   
   # Windows
   # Ensure the directory has proper permissions in Windows
   ```

3. **Check security options:**
   Ensure `cap_add: SYS_ADMIN` is set, or use `privileged: true`

### Game Server Not Starting

1. **Verify START_ARGS:**
   Check that `START_ARGS` contains a valid server arguments:
   ```yaml
   START_ARGS: "+statusMonitor 1"
   ```

2. **Check server directory:**
   Verify that game files were downloaded:
   ```bash
   docker exec bf1942 ls -la /config/Server
   ```

3. **Review server logs:**
   Check container logs for server startup messages and errors

### OverlayFS Warnings

If you see warnings about OverlayFS:

1. **Verify capabilities:**
   Ensure `cap_add: SYS_ADMIN` is present in your docker-compose.yml

2. **Check AppArmor:**
   On Ubuntu, add `security_opt: apparmor:unconfined`

3. **Alternative:**
   Use `privileged: true` (less secure but simpler)

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
     - 27601:27600/udp  # Use a different host port
   ```

3. **Stop conflicting containers:**
   ```bash
   docker stop <container-name>
   ```

## Advanced Usage

### Custom Hooks

You can create custom PowerShell scripts that execute at various points in the container's lifecycle. Place scripts in:

```
/config/Scripts/Hooks/{HookName}/
```

**Available hooks:**
- `Prebf1942Install` - Before iobf1942 is downloaded/extracted
- `Postbf1942Install` - After iobf1942 is installed
- `PreInstallPatches` - Before patch installation
- `PostInstallPatches` - After patch installation

**Example hook script** (`/config/Scripts/Hooks/Postbf1942Install/10-CustomSetup.ps1`):
```powershell
Write-Host "Running custom setup..."
# Your custom commands here
```

## Additional Resources

- [Server Options](https://docs.lancommander.app/GameServers/BF1942/Options)
