---
sidebar_label: Docker
---

# Freelancer Docker Container

This Docker container runs a Freelancer dedicated server. It is built on the WINE image and runs the retail `EXE/FLServer.exe` under Wine and Xvfb. The container doesn't download the game, so you provide the files.

## Quick Start

```yaml
services:
  freelancer:
    image: lancommander/freelancer:latest
    container_name: freelancer

    ports:
      - 2302:2302/udp
      - 6073:6073/udp

    volumes:
      - "/data/Servers/Freelancer/Default:/config"

    environment:
      FL_SERVER_NAME: "My Freelancer Server"
      FL_MAX_PLAYERS: "16"

    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Copy a Freelancer **1.1** install (the folder with `EXE/` and `DATA/`) into `Server/` before the first start. You can instead set `FL_ARCHIVE_URL` to a zip of that folder.

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitializeWinePrefix/20-InstallWineRuntimes.ps1` runs `winetricks directplay` and `winetricks mfc42` once each, using redists cached in the image. Marker files `wineprefix/.lancommander-directplay` and `.lancommander-mfc42` record that they're done. Delete one to reinstall it.
3. `PostInitialization/20-InstallFreelancer.ps1` checks for `Server/EXE/FLServer.exe`. If it's missing and `FL_ARCHIVE_URL` is set, the hook downloads the archive.
4. `PostInitialization/30-ConfigureFreelancer.ps1` accepts the EULA in the Wine registry and writes `FLServer.cfg` from the `FL_*` variables.
5. `START_EXE` (`/usr/local/bin/fl-server`) runs `FLServer.exe /c /p<FL_PORT>` from `EXE/` with `wine-run`.

FLServer writes no log and no console output, so `docker logs` ends at `Starting: FLServer.exe /c /p2302`. To check that it's up, send a DirectPlay enumeration query (UDP `00 02 12 34 02`) to port 2302 or 6073. The reply contains the server name and description.

## Configuration Options

### Ports

- **2302/udp**: Game (DirectPlay host, `FL_PORT`)
- **6073/udp**: DirectPlay enumeration (`dpnsvr`), which the in-game LAN search uses. It forwards queries to the game port.

DirectPlay also opens some dynamic UDP ports. Giving the container its own LAN address (macvlan/ipvlan) is the most reliable setup.

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### FLServer.cfg

FLServer has no command-line or text settings. On first run it shows a EULA and then a modal "Server Configuration" dialog. It saves the dialog to `My Games\Freelancer\Accts\MultiPlayer\FLServer.cfg` in the user's Documents folder. Once that file exists, `/c` starts hosting without asking.

The hook rewrites the file on every start, so changes made in FLServer's own dialog don't persist. The format is a 369-byte binary dump of the dialog:

| Offset | Type | Field |
|--------|------|-------|
| `0x000` | int32 | `3` (version) |
| `0x004` | UTF-16 `[33]` | Server name |
| `0x046` | UTF-16 `[129]` | Description |
| `0x148` | UTF-16 `[17]` | Password |
| `0x16A` | byte | Allow new players |
| `0x16B` | byte | Internet accessible |
| `0x16C` | int32 | Max players |
| `0x170` | byte | Allow players to harm other players |

### Player Data

Accounts (`accounts.cfg`) and multiplayer characters are stored in `wineprefix/drive_c/users/lancommander/Documents/My Games/Freelancer/Accts/MultiPlayer/`. Back up that folder to keep characters. Deleting the prefix resets them.

### Hooks

| Hook | When |
|------|------|
| `PreInstallFreelancer` / `PostInstallFreelancer` | Around the game file check/download |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **Server exits right away with code 53**: `MFC42.DLL` is missing from the prefix. Delete `wineprefix/.lancommander-mfc42` and restart.
- **No reply on 2302, process still running**: FLServer is waiting on a dialog. That happens when `FLServer.cfg` is missing or the EULA wasn't accepted. Check the `30-ConfigureFreelancer.ps1` lines in `docker logs`.
- **Clients don't see the server in the LAN list**: Port 6073/udp must be reachable from the clients' broadcast domain. Clients can also connect by IP.
- **Long names are cut off**: The name, description and password fields hold 32, 128 and 16 characters.
