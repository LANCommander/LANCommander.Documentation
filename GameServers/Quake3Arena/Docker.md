# Quake 3 Docker Container
This Docker container provides a Quake 3 Arena game server that automatically downloads ioquake3, supports file overlaying using OverlayFS, and has a built in HTTP server for FastDL configurations.

## Quick Start

```yaml
services:
  quake3:
    image: lancommander/quake3:latest
    container_name: quake3

    ports:
      - 27600:27600/udp
      - 27680:80 # For FastDL support

    volumes:
      - "/data/Servers/Quake 3:/config"

    environment:
      # START_ARGS: "+set dedicated 2 +set sv_allowDownload 1 +set sv_dlURL \"http://<hostname>:27680\" +set com_hunkmegs 64"

    cap_add:
      - SYS_ADMIN

    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

## Configuration Options

### Ports

The container exposes the following ports:

- **27600/udp** - Main game server port (default). Clients connect to this port to join the server.
- **80/tcp** - HTTP file server port (optional). Used for serving game files to clients (See [FastDL](https://developer.valvesoftware.com/wiki/FastDL)).

**Port Mapping:**
In the example configuration, ports are mapped as:
- `27600:27600/udp` - Maps host port 27600 to container port 27600
- `27680:80` - Maps host port 27680 to container port 80

You can customize these mappings based on your network requirements. If you're running multiple servers, use different host ports for each instance.

### Volumes

The container requires a volume mount for the `/config` directory, which stores:

- **Server/** - Base server files. Put your pak0.pk3 under the `baseq3` directory.
- **Overlay/** - Custom files that overlay on top of the game directory
- **Merged/** - OverlayFS merged view (auto-created)
- **Scripts/** - Custom PowerShell scripts for hooks

**Example:**
```yaml
volumes:
  - "/data/Servers/Quake 3:/config"
```

The host path can be:
- An absolute path (Windows: `C:\data\...`, Linux: `/data/...`)
- A relative path (e.g., `./config:/config`)
- A named volume (e.g., `q3a-server-data:/config`)

**Important:** The mounted directory must be writable by the container.

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `START_ARGS` | Arguments used to start the game server | `"+set dedicated 2 +set sv_allowDownload 1 +set sv_dlURL \"\" +set com_hunkmegs 64"` | No |

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
│   └── baseq3/          # The base game files. Put your retail pak0.pk3 here
├── Overlay/             # Custom files overlay (your modifications)
│   └── baseq3/
│       ├── maps/        # Custom maps
│       └── ...
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
   docker logs quake3
   ```

2. **Verify permissions:**
   Ensure the mounted volume is writable:
   ```bash
   # Linux
   chmod -R 755 "/data/Servers/Quake 3"
   
   # Windows
   # Ensure the directory has proper permissions in Windows
   ```

3. **Check security options:**
   Ensure `cap_add: SYS_ADMIN` is set, or use `privileged: true`

### Game Server Not Starting

1. **Verify START_ARGS:**
   Check that `START_ARGS` contains a valid server arguments:
   ```yaml
   START_ARGS: "+set dedicated 2 +set sv_allowDownload 1 +set sv_dlURL \"\" +set com_hunkmegs 64"
   ```

2. **Check server directory:**
   Verify that game files were downloaded:
   ```bash
   docker exec quake3 ls -la /config/Server
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
- `PreQuake3Install` - Before ioquake3 is downloaded/extracted
- `PostQuake3Install` - After ioquake3 is installed
- `PreInstallPatches` - Before patch installation
- `PostInstallPatches` - After patch installation

**Example hook script** (`/config/Scripts/Hooks/PostQuake3Install/10-CustomSetup.ps1`):
```powershell
Write-Host "Running custom setup..."
# Your custom commands here
```

### HTTP File Server

The container includes an optional HTTP file server (port 80) for serving game files to clients. This is useful for fast downloads of custom maps and content.

The file server is configured via environment variables:
- `HTTP_FILESERVER_ENABLED` - Enable/disable the file server
- `HTTP_FILESERVER_WEB_ROOT` - Root directory for file serving
- `HTTP_FILESERVER_FILE_PATTERN` - Pattern for files to serve

## Additional Resources

- [ioquake3 Sys Admin Guide](https://ioquake3.org/help/sys-admin-guide/)
