---
sidebar_label: Docker
---

# Thievery Docker Container

This Docker container runs a Thievery dedicated server. Thievery is a mod for Unreal Tournament (1999); the container runs Unreal Tournament's Windows server, `UCC.exe server`, with the mod loaded, on the WINE image. The container doesn't download the game, so you provide the files.

## Quick Start

```yaml
services:
  thievery:
    image: lancommander/thievery:latest
    container_name: thievery

    ports:
      - 7777:7777/udp
      - 7778:7778/udp
      - 8777:8777/udp

    volumes:
      - "/data/Servers/Thievery/Teams:/config"

    environment:
      THIEVERY_SERVER_NAME: "My Thievery Server"
      THIEVERY_GAME_TYPE: "teams"
      THIEVERY_MAP: "TH-Theatre"
      THIEVERY_ADMIN_PASSWORD: "changeme"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Put an Unreal Tournament **436** install with **Thievery 1.7** extracted on top (the folder with `System/UCC.exe`, `System/ThieveryMod.u` and `Thievery/th-maps/`) in `Server/` before the first start. You can instead set `THIEVERY_UT_ARCHIVE_URL` and `THIEVERY_ARCHIVE_URL` to zips of the two parts.

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitialization/20-InstallThievery.ps1` checks for `Server/System/UCC.exe` and `Server/System/ThieveryMod.u`. For each one that's missing, if its URL is set, the hook downloads the zip (or reads a `file://` path in place), extracts it without `Help/`, `Manual/` and `NetGamesUSA.com/`, and copies the folder that holds `System/` into `Server/`. Unreal Tournament goes first; Thievery is merged on top. The overlay is then remounted.
3. `PostInitialization/30-ConfigureThievery.ps1` copies `System/ThAux.ini` to `System/Server.ini` (`THIEVERY_INI`) if it doesn't exist yet. It does this through `Merged/`, so the file lands in `Overlay/System/`. It writes the non-empty server settings into it and removes the master server uplinks. It then writes the gameplay settings and the map rotation into `System/ThieveryMod.ini` (also copied up into `Overlay/System/`).
4. `START_EXE` (`/usr/local/bin/thievery-server`) runs `UCC.exe server <THIEVERY_MAP>?game=<class> ini=Server.ini userini=ThieveryUser.ini log=server.log` from `System/` under Wine.

A successful start ends with:

```
Game class is 'ThieveryDeathMatchPlus'
TcpNetDriver on port 7777
...
UdpServerQuery(crt): Port 7778 successfully bound.
...
[Tdmplus] Total loot on map=1180.000000
Game engine initialized
```

## Configuration Options

### Ports

- **7777/udp**: Game (`THIEVERY_PORT`)
- **7778/udp**: Server query, GameSpy protocol (game port + 1). `\status\` returns the name, map, game type, UT version (`gamever 436`), the Thievery version (`thgamever v1.7.5` for the 1.7 release), player counts per team and the rules.
- **8777/udp**: LAN beacon. The in-game LAN browser broadcasts `REPORTQUERY` here, and the server replies `ut 7778`.

With `THIEVERY_MASTER_SERVER_UPLINK=true` the uplink also binds 7779/udp (query port + 1) for outgoing heartbeats.

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### Server ini

`Overlay/System/Server.ini` is yours to edit. Only the keys that have a non-empty `THIEVERY_*` variable are rewritten on start. Delete the file to regenerate it from `ThAux.ini`.

- Passwords and max players are in `[Engine.GameInfo]` (`AdminPassword`, `GamePassword`, `MaxPlayers`, `MaxSpectators`). They are never put on the command line.
- `[ThieveryMod.ThieveryDeathMatchPlus]` has `FriendlyFireScale`, `MaxTeams`, `MaxTeamSize` and `GoalTeamScore`.
- `ServerPackages` lists the packages clients download or must have. Add your own when you add custom maps that need extra packages.

### ThieveryMod.ini

Thievery's classes keep their settings in `System/ThieveryMod.ini`, whatever `ini=` says. The hook writes to it through `Merged/`, so the edited copy is `Overlay/System/ThieveryMod.ini`.

- `[ThieveryMod.ThieveryGameSettings]` holds the settings that apply to every game type: `TimeLimit`, `bBalanceTeams`, `GuardStartMoney`, `ThievesStartMoney`, `nPregameWaitTime`, `AISkill`, the loot drop percentage, the co-op options (`bCoopNoKOs`, `bCoopAllToExit` ...) and more. `bOverrideMapSettings=True` (stock) makes these override the values set in the map.
- Map rotation: `Maps[0]`..`Maps[31]` (`<name>.unr`) and `MapNum` in `[ThieveryMod.ThieveryMapList]`. The game looks up the current map in the list and moves to the next entry. `THIEVERY_MAPS` rewrites the list on every start; without it the stock list (11 maps) is left as it is. Maps are looked up in `Thievery/th-maps/` and `Maps/`.

UCC saves its config back to both files, so values can also change there after an admin command or a map change.

### Hooks

| Hook | When |
|------|------|
| `PreInstallThievery` / `PostInstallThievery` | Around the game file check/download |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **Server not in the LAN browser**: the browser finds servers by UDP broadcast to 8777, so the container needs its own LAN address (macvlan/ipvlan) or host networking. Joining by IP works through port mapping.
- **Clients can't join / package mismatch**: clients need the same Unreal Tournament patch (436) and Thievery release as the server. Check `gamever` and `thgamever` in the `\status\` query.
- **Settings ignored**: server settings go into `THIEVERY_INI`, gameplay settings into `ThieveryMod.ini`, not into `ThAux.ini` or `UnrealTournament.ini`. Check `Overlay/System/Server.ini` and `Overlay/System/ThieveryMod.ini`.
- **`Map ... is not installed; left out of the rotation`**: the map isn't in `Thievery/th-maps/` or `Maps/` as `<name>.unr`. Names are case-insensitive; the `.unr` extension is optional.
- **`Resolving unreal.epicgames.com...` / `UdpServerUplink: Failed to resolve master server address`**: the stock `ThAux.ini` sends heartbeats to four master servers. The hook removes them unless `THIEVERY_MASTER_SERVER_UPLINK=true`, which keeps only 333networks. Whether 333networks lists the server is untested.
- **`System/UCC.exe not found` / `System/ThieveryMod.u not found`**: `Server/` must contain the game folder itself (`Server/System/UCC.exe`), not a folder that contains it, and Thievery must be extracted into the same folder.
- **No web admin**: Thievery's `ThAux.ini` points `[UWeb.WebServer]` at `ThWeb` classes that the 1.7 release doesn't include, so the image doesn't set up web admin.
