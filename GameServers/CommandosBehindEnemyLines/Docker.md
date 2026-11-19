---
sidebar_label: Docker
---

# Commandos: Behind Enemy Lines Docker Container

This Docker container runs a Commandos: Behind Enemy Lines multiplayer server. It is built on the WINE image and runs the game's own server, `mpserver.exe`, a small Windows console program. The container doesn't download the game, so you provide the file.

## Quick Start

```yaml
services:
  commandos:
    image: lancommander/commandosbehindenemylines:latest
    container_name: commandos

    ports:
      - 4321:4321/tcp
      - 4322:4322/tcp

    volumes:
      - "/data/Servers/Commandos - Behind Enemy Lines/Default:/config"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Before the first start, copy `mpserver.exe` from the game folder into `Server/`. You can instead set `COMMANDOS_ARCHIVE_URL` to a zip of the game folder; only `mpserver.exe` is extracted from it.

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitialization/20-InstallCommandos.ps1` checks for `Server/mpserver.exe`. If it's missing and `COMMANDOS_ARCHIVE_URL` is set, the hook downloads the zip, extracts `mpserver.exe` (at the zip root or in one top-level folder, any letter case) and remounts the overlay.
3. `START_EXE` (`/usr/local/bin/commandos-server`) runs `mpserver.exe [START_ARGS]` from the game folder under Wine, in a pseudo-terminal.

`docker logs` then shows the server's console:

```
Starting: mpserver.exe
 Commandos - multiplayer server
--------------------------------
The name of this machine is: 995692A66895
The IP address of this machine is: 172.17.0.2
Please use this address in the "SERVER IP ADDRESS" field
 of the join multiplayer screen of Commandos.
Press CTRL-C to Close Server
--------------------------------
```

The server doesn't print anything after this, not even when players connect.

## Configuration Options

### Ports

- **4321/tcp**, **4322/tcp**: mpserver.exe. Both are fixed in the program.

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### Game Settings

`mpserver.exe` has no command line options and no config file. Players create or join a game from the client's multiplayer screen and pick the mission and options there.

### Clients

Clients connect to the address in the **SERVER IP ADDRESS** field of the join multiplayer screen. The game stores it as `.SERVERADDRESS <ip>` in `OUTPUT\COMANDO.CFG` (in `Documents\Pyro Studios\Commandos\OUTPUT\` on later releases), so a launcher can set it before the game starts. The address the server prints is the container's own. With Docker port mapping, players use the host's address.

### Hooks

| Hook | When |
|------|------|
| `PreInstallCommandos` / `PostInstallCommandos` | Around the game file check/download |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **Nothing in `docker logs` after `Starting: mpserver.exe`**: mpserver writes its console only to a terminal. The launcher gives it one with `script(1)`; a custom `START_EXE` must do the same, or the server runs without any output.
- **`mpserver.exe not found`**: put `mpserver.exe` in `Server/`, or check that the zip in `COMMANDOS_ARCHIVE_URL` contains it at the root or in one top-level folder.
- **Clients can't connect**: both TCP ports, 4321 and 4322, must be reachable from the clients.
- **Console input**: there is none. Stop the container to stop the server.
- **Resources**: an idle server uses about 1% of a core and 250 MB of memory. `docker stop` takes about 5 seconds.
