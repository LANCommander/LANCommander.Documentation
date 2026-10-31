---
sidebar_label: Docker
---

# Far Cry Docker Container

This Docker container runs a Far Cry dedicated server. It is built on the WINE image and runs the game's dedicated server, `Bin32/FarCry_WinSV.exe` from patch 1.4, on a virtual display. The container doesn't download the game, so you provide the files.

## Quick Start

```yaml
services:
  farcry:
    image: lancommander/farcry:latest
    container_name: farcry

    ports:
      - 49001:49001/udp
      - 49124:49124/udp
      - 5678:5678/udp

    volumes:
      - "/data/Servers/Far Cry/Deathmatch:/config"

    environment:
      FC_SERVER_NAME: "My Far Cry Server"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Before the first start, copy a Far Cry 1.4 install, the folder that contains `Bin32/`, into `Server/`. You can instead set `FC_ARCHIVE_URL` to a zip of that folder.

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitialization/20-InstallFarCry.ps1` checks for `Server/Bin32/FarCry_WinSV.exe`. If it's missing and `FC_ARCHIVE_URL` is set, the hook downloads and extracts the archive and remounts the overlay.
3. `PostInitialization/30-ConfigureFarCry.ps1` writes the non-empty `FC_*` settings into `Profiles/server/<FC_PROFILE>_server.cfg`, and `FC_MAPCYCLE` into `Profiles/server/<FC_PROFILE>_mapcycle.txt`.
4. `START_EXE` (`/usr/local/bin/farcry-server`) runs `Bin32/FarCry_WinSV.exe "sv_port 49001" "log_verbosity 3" [START_ARGS] "SProfile_run LANCommander"` from the game folder under Wine and Xvfb, and streams `log_WinSV.txt` to `docker logs`.

Each `FarCry_WinSV.exe` argument is a console command. `SProfile_run` runs the profile and loads `gr_NextMap`. A server that is up ends its log with:

```
 Level mp_monkeybay loaded in 1.541 seconds
Precaching level ...
--------------------------------------------------------------------------------
To run a dedicated server you should save a server-profile in the game.
```

The last lines are the server's standard help text and are printed even when the profile has loaded. To check that the server is up, send an All-Seeing Eye query to the game port + 123:

```bash
python3 -c 'import socket; s=socket.socket(2,2); s.settimeout(3); s.sendto(b"s",("<server>",49124)); print(s.recvfrom(4096)[0])'
# b'EYE1\x07farcry\x0649001\x0fFar Cry Server\x04FFA\rmp_monkeybay\x0b1.4.0.1405...'
```

## Configuration Options

### Ports

- **49001/udp**: Game (`FC_PORT`)
- **49124/udp**: All-Seeing Eye status queries. This is always the game port + 123
- **5678/udp**: CryNetwork binds this fixed port whatever `FC_PORT` is. Its purpose is unconfirmed; publish it to be safe

The game's own documentation also lists TCP 40000-42999 and UDP 41005, 41006 and 44000. Those are for Ubi.com and aren't used on a LAN.

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### Server Profile

A server profile is a Lua script of `cvar = "value"` lines in `Profiles/server/<name>_server.cfg`. It is the file the game's Multiplayer > Create Server menu writes with Save Profile. The hook edits the profile through the merged view, so the edited copy is in `Overlay/` and is yours to change. A cvar that also has a non-empty `FC_*` variable is overwritten on every start. You can add any other server cvar to the file, e.g.:

```lua
gr_DamageScale      = "1"
gr_PrewarOn         = "0"
net_cheatprotection = "1"
```

To use a profile saved in the game instead, copy it to `Overlay/Profiles/server/` and set `FC_PROFILE` to its name.

### Map Rotation

The map cycle file has one map per line: `<map> <game type> [time limit] [respawn time] [invulnerability timer] [max players] [min team size] [max team size]`. The optional values override the profile's for that map. `FC_MAPCYCLE` takes the same entries separated by commas. The rotation can change the game type, but each map must support the type it's given:

| Game type | Maps |
|-----------|------|
| `FFA`, `TDM` | `mp_cliffside`, `mp_monkeybay`, `mp_monkeybay_n`, `mp_radio`, `mp_surf` |
| `ASSAULT` | `mp_airstrip`, `mp_dam`, `mp_dune`, `mp_freighter`, `mp_jungle`, `mp_mangoriver`, `mp_px_airstrip`, `mp_px_dam`, `mp_px_dune`, `mp_px_freighter`, `mp_px_jungle`, `mp_px_mangoriver` |

Set `FC_MAPCYCLE` to empty to use the stock `Profiles/server/mapcycle.txt`, which mixes all three game types.

### Hooks

| Hook | When |
|------|------|
| `PreInstallFarCry` / `PostInstallFarCry` | Around the game file check/download |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **The container exits right away with no log**: FarCry_WinSV is a GUI program and exits silently without a display. Keep `WINE_XVFB=true`.
- **The log ends with `failed to load profile`**: `Profiles/server/<FC_PROFILE>_server.cfg` is missing or isn't valid Lua. Delete `Overlay/Profiles/server/<FC_PROFILE>_server.cfg` to regenerate it from the `FC_*` settings.
- **The map doesn't load or the game type is wrong**: the map doesn't support that game type. See the table above.
- **`ERROR: failed to open bannedip.txt for reading!`**: harmless. It only means no IPs are banned.
- **`err:vulkan:vulkan_init_once Failed to load libvulkan.so.1`**: harmless; the server runs without Vulkan.
- **Not in the in-game LAN list**: LAN discovery by broadcast needs the container on the LAN itself (macvlan/ipvlan, or `network_mode: host`). Clients can always join by IP.
- **The log never shows the map loading**: `FC_LOG_VERBOSITY` is below 3. The server can still be running; check with the status query.
- **No console commands**: the console only exists in the server's window. Change settings through the environment or the profile and restart, or set `FC_RCON_PASSWORD` and use RCon from a game client (`cl_rcon_serverip`, `cl_rcon_port`, `cl_rcon_password`, then `rcon <command>`).
