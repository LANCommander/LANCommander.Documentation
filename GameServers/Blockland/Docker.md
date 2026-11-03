---
sidebar_label: Docker
---

# Blockland Docker Container

This Docker container runs a Blockland Rebuilt (v2.1) dedicated server. It is built on the WINE image and runs the game's dedicated LAN mode, `BLRebuilt.exe -dedicatedLAN`. The container doesn't download the game, so you provide the files.

## Quick Start

```yaml
services:
  blockland:
    image: lancommander/blockland:latest
    container_name: blockland

    ports:
      - 28050:28050/udp

    volumes:
      - "/data/Servers/Blockland/Default:/config"

    environment:
      BLOCKLAND_SERVER_NAME: "My Blockland Server"

    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Copy a Blockland Rebuilt **v2.1** install (the folder with `BLRebuilt.exe`, `base/` and `Add-Ons/`) into `Server/` before the first start. You can instead set `BLOCKLAND_ARCHIVE_URL` to a zip of that folder.

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitialization/20-InstallBlockland.ps1` checks for `Server/BLRebuilt.exe`. If it's missing and `BLOCKLAND_ARCHIVE_URL` is set, the hook downloads the archive.
3. `START_EXE` (`/usr/local/bin/blockland-server`) writes `config/main.cs` from the `BLOCKLAND_*` variables. It then starts `BLRebuilt.exe -dedicatedLAN -noMasterServer -map …` (or `-gamemode …`) with `wine-run` inside a pseudo-terminal, and follows `console.log` to stdout.

The game runs `config/main.cs` as a mod, after it loads `config/server/prefs.cs` and before the server starts. The generated file:

- sets the server name, player limit and passwords. These override the same values in `config/server/prefs.cs`.
- calls `setKey()` once the game asks for a key (see below)
- runs `config/server/custom.cs`, if it exists. Put your own startup TorqueScript there. `config/main.cs` is overwritten on every start.

A successful start ends with:

```
LANCommander: supplying server key
--------- Starting Dedicated LAN Server ---------
Starting LAN Server
UDP initialized on port 28050
...
*** Mission loaded
```

## Configuration Options

### Ports

- **28050/udp**: Game and LAN discovery. LAN servers always bind 28050. The game ignores `-port` and `$Pref::Server::Port` in LAN mode. If 28050 is taken, it tries the next port, up to 10 times.

The in-game LAN list broadcasts to 28050, 28000 and 28051. Broadcasts only reach the container if it is on the LAN itself (macvlan/ipvlan or host networking).

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### Other Server Settings

All other server preferences (brick limits, quotas, welcome message, etc.) are in `config/server/prefs.cs`. The game rewrites that file on shutdown, so edit it while the server is stopped. Add-ons are enabled in `config/server/ADD_ON_LIST.cs`.

### Hooks

| Hook | When |
|------|------|
| `PreInstallBlockland` / `PostInstallBlockland` | Around the game file check/download |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

### `Unhandled page fault on read access … at address 000000014030B9BF`

The game's console input thread calls `ReadConsoleInput` and doesn't check whether it succeeded. Without a real console the call fails, and the loop reads garbage off the stack. The launcher runs the game under `script` to give it a pseudo-terminal. If you replace `START_EXE`, keep that.

### The server stops at "Authentication Key required for hosting internet game"

Even a LAN server waits for `setKey("XXXXX-XXXX-XXXX-XXXX")` before it starts, and it asks on every start, even when `key.dat` exists. `setKey()` only exists once the prompt is shown, and the engine doesn't let scripts redefine the key functions. So the generated `config/main.cs` schedules a `setKey(BLOCKLAND_KEY)` call one second after load. LAN mode never checks the key online, so the default placeholder works. If you see the prompt but not `LANCommander: supplying server key`, check that `config/main.cs` exists in `Merged/`.

### Commands typed into the console do nothing

The pseudo-terminal's input isn't connected to anything. Use `config/server/custom.cs`, or the in-game admin tools.

### The server doesn't show up in the LAN list

LAN discovery uses UDP broadcast, so the container needs its own address on the clients' network. Clients can still join by IP on port 28050.
