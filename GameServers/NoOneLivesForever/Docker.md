---
sidebar_label: Docker
---

# No One Lives Forever Docker Container

This Docker container runs a dedicated server for The Operative: No One Lives Forever. It is built on the WINE image and runs the game's dedicated server, `NolfServ.exe` 1.004, on a virtual display. The container doesn't download the game, so you provide the files.

## Quick Start

```yaml
services:
  nolf:
    image: lancommander/noonelivesforever:latest
    container_name: nolf

    ports:
      - 27888:27888/udp

    volumes:
      - "/data/Servers/No One Lives Forever/Deathmatch:/config"

    environment:
      NOLF_SERVER_NAME: "My NOLF Server"
      NOLF_LEVELS: "001ThePad_DM,002Rebar_DM,005Unity_DM"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Before the first start, copy a NOLF 1.003+ install, the folder that contains `NolfServ.exe`, into `Server/`. You can instead set `NOLF_ARCHIVE_URL` to a zip of that folder.

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitialization/20-InstallNOLF.ps1` checks for `Server/NolfServ.exe`. If it's missing and `NOLF_ARCHIVE_URL` is set, the hook downloads and extracts the archive (without `Movies/` and `EReg/`) and remounts the overlay.
3. `PostInitialization/30-ConfigureNOLF.ps1` writes `startup.txt` (the `.rez` files to load) and the `NOLF_*` settings into `NetHost.txt`. It reads the level list out of the `.rez` files to check `NOLF_LEVELS`, or to build the default rotation.
4. `START_EXE` (`/usr/local/bin/nolf-server`) runs `NolfServ.exe -nowiz -NetPort 27888 [START_ARGS]` from the game folder under Wine and Xvfb.

NolfServ's console is a list box in its window, so `docker logs` ends at:

```
Starting: NolfServ.exe -nowiz -NetPort 27888
Game port and status queries on 27888/udp
```

To check that the server is up, send a GameSpy status query to the game port:

```bash
python3 -c 'import socket; s=socket.socket(2,2); s.settimeout(3); s.sendto(b"\\status\\",("<server>",27888)); print(s.recvfrom(4096)[0])'
# b'\\gamename\\nolf\\gamever\\1.006\\location\\0\\hostname\\My NOLF Server\\hostport\\27888\\mapname\\001ThePad_DM\\gametype\\deathmatch\\...'
```

`gamever` is `1.006` when the Modernizer is loaded.

## Configuration Options

### Ports

- **27888/udp**: Game and GameSpy status queries (`NOLF_PORT`)

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### NetHost.txt

NolfServ saves its setup wizard answers in the `[Host]` section of `NetHost.txt` and reads them back with `-nowiz`. Lines look like `NetMaxPlayers = 16.000000f`, with strings in quotes. Each line sets a console variable, so any server variable can go there, e.g. `LeashLen` or `ShowConnStats`. The hook edits the file through the merged view, so the edited copy is in `Overlay/` and is yours to change. A key that also has a non-empty `NOLF_*` variable is overwritten on every start.

| Key | Meaning |
|-----|---------|
| `NetGameType` | `2` Deathmatch, `1` H.A.R.M. vs. UNITY. Any other value fails with "ERROR - Unable to start server." |
| `NetSessionName`, `NetPort`, `NetMaxPlayers` | Server name, port, player limit |
| `NetUsePassword`, `NetPassword` | Password protection |
| `NetNumLevels`, `NetLevel0` ... | Deathmatch rotation, as paths like `Worlds\Multi\DeathMatch\001ThePad_DM` |
| `NetCANumLevels`, `NetCALevel0` ... | H.A.R.M. vs. UNITY rotation (`Worlds\Multi\AssaultMap\...`) |
| `NetDMGameEnd`, `NetCAGameEnd` | Level end: `0` frag/score limit, `1` time limit, `2` either, `3` never |
| `NetEndFrags`, `NetEndScore`, `NetEndTime` | The limits |
| `NetRunSpeed`, `NetRespawnScale`, `NetFallDamageScale`, `NetArmorHealthPercent` | Fractions, e.g. `1.2` = 120% |
| `NetDefaultWeapon`, `NetWeaponsStay`, `NetHitLocation`, `NetAudioTaunts`, `NetIntelScore`, `NetFragScore`, `NetFriendlyFire` | Other game options |
| `SendBandwidth` | Upload limit in bytes per second |

### Rez Files and the NOLF Modernizer

NolfServ loads the `.rez` files listed in `startup.txt`. The stock file lists patch files a GOTY install doesn't have and nothing from `Custom/`. Under `-nowiz` the server also ignores the add-ons picked on the wizard's Customization page. The hook therefore rewrites `startup.txt` with the retail `.rez` files that exist (`NOLF.REZ`, `NOLF2.REZ`, `nolfu003.rez`, `NOLFCRES003.REZ`, `NOLFGOTY.REZ` ...), followed by `NOLF_CUSTOM_REZ`.

The [NOLF Modernizer](https://heythere.coffee/nolf/) (`Custom/MODERNIZER.REZ`) replaces the game code (`object.lto`) and reports version 1.006. LANCommander's NOLF client loads it, so the server loads it by default too. Set `NOLF_CUSTOM_REZ=""` to run the unmodified 1.004 server.

### Custom Levels

Put custom `.rez` files in `Overlay/Custom/` and add them to `NOLF_CUSTOM_REZ`, e.g. `MODERNIZER.REZ,MyLevels.rez`. Levels in them under `Worlds\Multi\DeathMatch` or `Worlds\Multi\AssaultMap` can then go in `NOLF_LEVELS`. Clients need the same files.

### Weapons

`NOLF_DEFAULT_WEAPON` ids: 20 none, 21 Shepherd Arms P38, 22 Petri .38 Airweight, 23 Braun 9mm, 24 Gordon 9mm SMG, 25 Hampton MPL SMG, 26 AK-47, 27 Sportsman EX Crossbow, 28 Hampton Carbine, 29 Geldmacher SVD, 30 Morris Model 14 Spear Gun, 31 Laser Gun, 32 Super Atomic Laser Weapon, 33 Bacalov Corrector, 34 M79 Grenade Launcher, 35 Briefcase, 36-38 Lipstick explosives (impact, proximity, timed), 39-41 gas (sleeping, stun, acid), 42 Belt Buckle/Zipcord.

### Hooks

| Hook | When |
|------|------|
| `PreInstallNOLF` / `PostInstallNOLF` | Around the game file check/download |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **No port is bound and no query answers**: NolfServ is showing a message box or its setup wizard on the virtual display. "ERROR - Unable to start server." means `NetGameType` isn't 1 or 2 or there are no levels for the game type. The wizard opens when `-nowiz` is the last argument, so don't remove `-NetPort` from the launcher. Check the hook's log lines, or delete `Overlay/NetHost.txt` to regenerate it.
- **Port bound but no query answers**: the first level doesn't exist, so the server never loads a world. The hook drops unknown levels from `NOLF_LEVELS`; check `NetLevel0`/`NetCALevel0` if you edited `NetHost.txt` by hand.
- **Clients can't join or get out of sync**: the Modernizer changes the game code, so the server and clients should agree on it. Load it on both (the default) or on neither (`NOLF_CUSTOM_REZ=""`). Joins have not been tested either way.
- **Exits immediately without a display**: NolfServ is a GUI program. Keep `WINE_XVFB=true`.
- **Server name cut off**: NOLF allows 24 characters; the hook shortens longer names.
- **The password shows up in status queries**: GameSpy `\status\` replies include `\Password\<password>` in clear text. That is the game's behavior.
- **CPU use**: the server loop takes about 20-30% of one core while idle.
- **Not in the in-game server list**: LAN discovery is untested with this image. Discovery by broadcast needs the container on the LAN itself (macvlan/ipvlan, or `network_mode: host`). Clients can always join by IP.
- **No console output or console commands**: the console only exists in NolfServ's window. Change settings through the environment or `NetHost.txt` and restart.
