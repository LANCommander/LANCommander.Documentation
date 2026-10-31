---
sidebar_label: Docker
---

# Aliens vs. Predator 2 Docker Container

This Docker container runs an Aliens vs. Predator 2 dedicated server. It is built on the WINE image and runs the game's stand-alone server, the Master Server Patch 2.4 build of `AVP2Serv.exe`, on a virtual display. The container doesn't download the game, so you provide the files.

## Quick Start

```yaml
services:
  avp2:
    image: lancommander/aliensvspredator2:latest
    container_name: avp2

    ports:
      - 27888:27888/udp

    volumes:
      - "/data/Servers/Aliens vs. Predator 2/Deathmatch:/config"

    environment:
      AVP2_SERVER_NAME: "My AvP2 Server"
      AVP2_GAME_TYPE: "deathmatch"
      AVP2_CONTROL_PASSWORD: "changeme"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Before the first start, copy an AvP2 1.0.9.6 install with the Master Server Patch 2.4 server, the folder that contains `AVP2Serv.exe`, into `Server/`. You can instead set `AVP2_ARCHIVE_URL` to a zip of that folder.

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitialization/20-InstallAVP2.ps1` checks for `Server/AVP2Serv.exe`. If it's missing and `AVP2_ARCHIVE_URL` is set, the hook downloads and extracts the archive and remounts the overlay.
3. `PostInitialization/30-ConfigureAVP2.ps1` creates `ServerData/<AVP2_CONFIG>.txt` from `ServerData/unnamed.txt` if it doesn't exist, then writes the non-empty `AVP2_*` settings and the map rotation into it.
4. `START_EXE` (`/usr/local/bin/avp2-server`) runs `AVP2Serv.exe -config <AVP2_CONFIG> [START_ARGS]` from the game folder under Wine and Xvfb. `-config` makes AVP2Serv load the profile and host without showing its setup dialog.

AVP2Serv's console is a list box in its window, so `docker logs` ends at:

```
Starting: AVP2Serv.exe -config lancommander
Game port and status queries on 27888/udp
```

To check that the server is up, send a GameSpy status query to the game port:

```bash
python3 -c 'import socket; s=socket.socket(2,2); s.settimeout(3); s.sendto(b"\\status\\",("<server>",27888)); print(s.recvfrom(4096)[0])'
# b'\\gamename\\avp2\\gamever\\1.0.9.6\\location\\0\\mspatch\\2.4\\...\\hostname\\My AvP2 Server [D]\\hostport\\27888\\mapname\\dm_alesserfate\\gametype\\DM\\...'
```

## Configuration Options

### Ports

- **27888/udp**: Game and GameSpy status queries (`AVP2_PORT`)

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### Server Profile (`ServerData/<name>.txt`)

The profile is an INI file. The hook edits it through the merged view, so the edited copy is in `Overlay/ServerData/` and is yours to change. A key that also has a non-empty `AVP2_*` variable is overwritten on every start. Set `AVP2_MAPS=config` to manage the rotation in the file yourself.

| Section | Keys |
|---------|------|
| `[Settings]` | `ServerName`, `PortID`, `GameType`, `Password`, `Locked` (`1` = password required), `SCPassword`, `LANConnection`, `Bandwidth`, `Dedicated` |
| One per game type: `[Deathmatch]`, `[TeamDeathmatch]`, `[Hunt]`, `[Survivor]`, `[Overrun]`, `[Evac]`, `[CaptureTheFlag]`, `[Domination]` | `Map00`, `Map01` ... (rotation, e.g. `"worlds\multi\dm\dm_verloc"`), `TimeLimit`, `FragLimit`, `ScoreLimit`, `RoundLimit`, `CaptureLimit`, `MaxTotalPlayers`, `MaxPlayers0`-`3`, race settings (`AttackerRace`, `DefenderRace`, `HunterRace`, `PreyRace`, `SurvivorRace`; 0 alien, 1 marine, 2 predator, 3 corporate) |
| `[Preferences]` | `FriendlyFire`, `ClassWeapons`, `LocationDamage`, `MaskLoss`, `Exosuit`, `QueenMolt`, `Speed`, `DamageScale`, `RespawnSpeed`, `UseNewNetcode` ... |

`GameType` numbers: 1 Deathmatch, 2 Team Deathmatch, 3 Hunt, 4 Survivor, 5 Overrun, 6 Evac, 7 Capture the Flag, 8 Domination.

### Master Server Patch Settings

The patch's own settings are in files in the game folder. Put edited copies in `Overlay/`:

- `serverconfig.txt`: voting, anti-cheat, exploit fixes, weapon and grenade bans (see `readme_server.txt`)
- `messages.txt`: automatic chat messages and rules
- `ctfworlds/`, `domworlds/`: flag and control point positions for CTF and Domination. A map needs a file here to be played in those game types

The server writes its logs (`chatlog.txt`, `guidlog.txt`, `iplog.txt` ...) and ban lists (`guidban.txt`, `ipban.txt` ...) to the game folder, so they end up in `Overlay/`.

### Client Compatibility

The patch's server loads every `.rez` it knows about, including `AVP2P5.REZ` (the patch's extra maps) and `LITHSERVER.REZ` (from `customrez.txt`). Clients started without the patch's command line (`avp2cmds.msp.txt`) don't load `AVP2P5.REZ`, so the default rotations only use retail maps. Add patch maps such as `dm_storageyard`, `dm_temple` or `evac_moria` only if every client runs the patch.

### Hooks

| Hook | When |
|------|------|
| `PreInstallAVP2` / `PostInstallAVP2` | Around the game file check/download |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **The port is bound but status queries get no reply**: the first map of the rotation doesn't exist, or the game type's section has no maps. AVP2Serv then sits in an error state on the virtual display. Check the map names and the hook's log line. The stock `unnamed.txt` Deathmatch list has maps that aren't in any `.rez` (`[dnd] hive`, `dm_brokendream`), which is why the image writes its own rotation.
- **The server never starts and no port is bound**: AVP2Serv is showing its setup dialog, because `ServerData/<AVP2_CONFIG>.txt` is missing or unreadable. Delete `Overlay/ServerData/<name>.txt` to regenerate it.
- **Exits immediately without a display**: AVP2Serv is a GUI program. Keep `WINE_XVFB=true`.
- **Primal Hunt**: `AVP2XServ.exe`, the expansion's server, isn't supported by this image.
- **Not in the in-game server list**: LAN discovery is untested with this image. Discovery by broadcast needs the container on the LAN itself (macvlan/ipvlan, or `network_mode: host`). Clients can always join by IP.
- **No console output or console commands**: the console only exists in AVP2Serv's window. Use `/control <password>` in game for admin commands, or change settings and restart.
