---
sidebar_label: Docker
---

# Deer Hunter 2005 Docker Container

This Docker container runs a Deer Hunter: The 2005 Season dedicated server. It is built on the WINE image and runs the retail game's headless dedicated mode, `DH2005.exe -Dedicated_Server:TRUE`. The container doesn't download the game, so you provide the files.

## Quick Start

```yaml
services:
  deerhunter2005:
    image: lancommander/deerhunter2005:latest
    container_name: deerhunter2005

    ports:
      - 23459:23459/udp
      - 6073:6073/udp

    volumes:
      - "/data/Servers/Deer Hunter 2005/Default:/config"

    environment:
      DH2005_SERVER_NAME: "My Deer Hunter Server"
      DH2005_SEASON: "RUT"

    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Copy a Deer Hunter 2005 **v1.2** install (the folder with `DH2005.exe`, `Aspen.dll` and `Game/`) into `Server/` before the first start. You can instead set `DH2005_ARCHIVE_URL` to a zip of that folder.

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitializeWinePrefix/20-InstallDirectPlay.ps1` runs `winetricks directplay` once, using the DirectX redist cached in the image. This installs Microsoft's `dpnet.dll` and related DLLs. The game needs them: with Wine's builtin DirectPlay 8 it logs `Could not init CNetServer DirectPlay media!` and quits. A marker file, `wineprefix/.lancommander-directplay`, records that the install is done. Delete it to reinstall.
3. `PostInitialization/20-InstallDeerHunter2005.ps1` checks for `Server/DH2005.exe`. If it's missing and `DH2005_ARCHIVE_URL` is set, the hook downloads the archive.
4. `START_EXE` (`/usr/local/bin/dh2005-server`) builds the command line from the `DH2005_*` variables and writes it to `C:\dh2005-server.bat`. It runs the batch file with `wine cmd` under Xvfb, and follows `Game/Game.LOG` to stdout.

The game parses its own Windows command line (`-Server_Name:"My Server"`). This is why the command line is written to a batch file and isn't passed through `START_ARGS`. Use `DH2005_EXTRA_ARGS` for anything raw. Any `START_ARGS` are appended too, but quoting inside them is lost.

A successful start ends with:

```
Hosting a dedicated server multi-player match at "Oregon"...
SERVER: Server network ready...
>>> Multi-player match started - dedicated server.
```

## Configuration Options

### Ports

- **23459/udp**: Game (DirectPlay host). The game's own help says 23458, but the v1.2 server listens on 23459.
- **6073/udp**: DirectPlay enumeration (`dpnsvr`), which the in-game LAN search uses

DirectPlay also opens some dynamic UDP ports. Giving the container its own LAN address (macvlan/ipvlan) is the most reliable setup.

### Environment Variables

See the [README](../README.md#environment-variables) for the full table. The defaults match the game's `RunDedicated.bat`, except that GameSpy publishing is off.

### Hooks

| Hook | When |
|------|------|
| `PreInstallDeerHunter2005` / `PostInstallDeerHunter2005` | Around the game file check/download |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.
