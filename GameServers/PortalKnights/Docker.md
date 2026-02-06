---
sidebar_label: Docker
---

# Portal Knights Dedicated Server

This repository provides a Dockerized **Portal Knights dedicated server via OpenJK** suitable for running multiplayer Portal Knights servers in a clean, reproducible way.  
The image is designed for **headless operation**, supports bind-mounted mods and configuration, and handles legacy runtime dependencies required by Portal Knights.

---

## Features

- Runs the **Portal Knights dedicated server** (`pk_dedicated_server.exe`)
- Automated build & push via GitHub Actions

## Docker Compose Example
```yaml
services:
  portalknights:
    image: lancommander/portalknights:latest
    container_name: portalknights-server

    # Portal Knights uses UDP
    ports:
      - "16365:16365/udp"

    # Bind mounts so files appear on the host
    volumes:
      - ./config:/config

    # Ensure container restarts if the server crashes or host reboots
    restart: unless-stopped
```

---

## Directory Layout (Host)

```text
.
└── config/
    ├── Server/            # Base Portal Knights dedicated server install
    ├── Overlay/           # Files to overlay on game directory (optional)
    │   └── savedata/      # Portal Knights savedata
    │       └── ...        # Any other files you want to overlay
    ├── Merged/            # Overlayfs merged view (auto-created)
    ├── .overlay-work/     # Overlayfs work directory (auto-created)
    ├── Scripts/
        └── Hooks/         # Script files in this directory get automatically executed if registered to a hook
```
Both directories **must be writable** by Docker.

---

## Game Files
You will need to extract the dedicated server files from your retail copy of Portal Knights into the `/config/Server` directory. The server will not run without these files. These files can be found in the `dedicated_server.zip` file located in your Portal Knights installation directory.

---

## Environment Variables

| Variable | Description | Default |
|--------|-------------|---------|
| `SERVER_ARGS` | Additional Portal Knights command-line arguments (advanced) | `pk_dedicated_server.exe` |

---

## Running the Server
### Basic run (recommended)
```bash
mkdir -p config

docker run --rm -it \
  -p 16365:16365/udp \
  -v "$(pwd)/config:/config" \
  lancommander/portalknights:latest
```

## Ports
- **UDP 16365** – default Portal Knights server port

## License
Portal Knights is distributed under its own license.
This repository contains only Docker build logic and helper scripts licensed under MIT.