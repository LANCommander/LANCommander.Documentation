---
sidebar_label: Docker
---

# Tribes 2 Docker Container

This Docker container runs a Tribes 2 dedicated server. It is built on the WINE image and runs the Windows game's `-dedicated` mode in LAN (`-nologin`) mode. The container doesn't download the game, so you provide the files.

## Quick Start

```yaml
services:
  tribes2:
    image: lancommander/tribes2:latest
    container_name: tribes2

    ports:
      - 28000:28000/udp

    volumes:
      - "/data/Servers/Tribes 2/CTF:/config"

    environment:
      T2_MOD: "Classic"
      T2_MAP: "Katabatic"
      T2_MISSION_TYPE: "CTF"
      T2_SERVER_NAME: "My Tribes 2 Server"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Before the first start, copy a Tribes 2 25034 install into `Server/`. `Server/` is the folder that contains `GameData/`, with `GameData/Tribes2.exe`. You can instead set `T2_ARCHIVE_URL` to a zip of that folder.

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitialization/20-InstallTribes2.ps1` checks for `Server/GameData/Tribes2.exe`. If it's missing and `T2_ARCHIVE_URL` is set, the hook downloads and extracts the archive and remounts the overlay.
3. `PostInitialization/30-ConfigureTribes2.ps1` writes `GameData/<T2_MOD>/prefs/lancommander.cs`. That file executes `prefs/ServerPrefs.cs`, then sets the non-empty `T2_*` settings. The hook also adds `setLogMode(1);` to `GameData/<T2_MOD>/autoexec.cs` once, which turns on `console.log` (the call has no effect in the prefs file).
4. `START_EXE` (`/usr/local/bin/t2-server`) deletes compiled `*.dso` scripts under `base/scripts` and `<mod>/scripts`, as the game's launch `.bat` files do. It then streams `console.log` and runs `Tribes2.exe -dedicated -nologin -serverprefs prefs/lancommander.cs [START_ARGS] -mod <T2_MOD>` from `GameData/` under Wine, with no display.

A successful start ends with:

```
LOADING MISSION: Katabatic
...
Default game mission load done.
starting mission countdown...
START MATCH
```

## Configuration Options

### Ports

- **28000/udp**: Game, server queries and LAN browser broadcasts (`T2_PORT`)

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### ServerPrefs.cs

The game exports every `$Host::` setting to `GameData/<mod>/prefs/ServerPrefs.cs` when a mission loads. That file is in `Overlay/` and is yours to edit, for example map limits, vote settings, admin lists, or the Classic `$Host::Classic*` options. A setting that also has a non-empty `T2_*` variable is overwritten on start. Don't edit `lancommander.cs`, because it is regenerated on every start.

The game keeps the last exported value of a `$Host::` setting even after you clear its `T2_*` variable. To reset such a setting, edit or delete it in `ServerPrefs.cs`.

### Hooks

| Hook | When |
|------|------|
| `PreInstallTribes2` / `PostInstallTribes2` | Around the game file check/download |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **`wine: Unhandled page fault on read access to 00000008 at address 6DCE247C ... starting debugger`** at startup: this is TribesNext's Ruby helper (`msvcrt-ruby190.dll`), and Ruby 1.9.0 crashes under Wine. Only TribesNext's online authentication uses Ruby, and that runs only in `-online` mode. The LAN server keeps running, so the message is harmless.
- **No online / TribesNext master listing**: the image runs LAN mode only. Online mode needs a working Ruby (the TribesNext community's Wine fix replaces `msvcrt-ruby190.dll` with a Ruby 1.8.7 or 1.9.1 build). That setup is untested here.
- **Server not in the LAN browser**: the browser finds servers by UDP broadcast, so the container needs its own LAN address (macvlan/ipvlan) or host networking. Clients can join by IP through port mapping.
- **"You are not running the same mod" or the client can't join**: clients must start with the same `-mod` as `T2_MOD`, in LAN mode (`-nologin`).
- **Arguments after `-mod` are ignored**: the game's argument parser skips the argument that follows `-mod <name>`. `t2-server` puts `-mod` last for this reason, so put extra flags in `START_ARGS`.
- **Hangs at startup with no console output, about 50% CPU, port not bound**: the server was started with an X display. Under Wine 11 `-dedicated` stalls before loading any script when it has a display, so keep `WINE_XVFB=false` and don't set `DISPLAY`. (Older TribesNext guides say the opposite, for much older Wine.)
- **No console output in `docker logs`, but the server works**: `GameData/<mod>/autoexec.cs` must contain the `setLogMode(1);` line. The hook adds it unless a line containing `LANCommander:` is already there.
- **Server stutter**: the TribesNext community recommends `SetPerfCounterEnable(0);` in a `GameData/<mod>/scripts/autoexec/*.cs` file, and pinning the server to one CPU (compose `cpuset: "0"`).
- **No console commands**: the dedicated console reads from its own Win32 console, not `docker attach`. Use the in-game admin menu, or the Classic telnet console (`$Host::ClassicTelnet*` in `ServerPrefs.cs`; expose the telnet port).
