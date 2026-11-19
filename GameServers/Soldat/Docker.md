---
sidebar_label: Docker
---

# Soldat Docker Container

This Docker container runs a Soldat dedicated server. It is built on the base image and runs the official SoldatServer 2.8.2 for game 1.7.1.1 (the non-Steam Linux build). The server package includes its maps, so you don't need to supply game files.

## Quick Start

```yaml
services:
  soldat:
    image: lancommander/soldat:latest
    container_name: soldat

    ports:
      - 23073:23073/udp
      - 23073:23073/tcp
      - 23083:23083/tcp

    volumes:
      - "/data/Servers/Soldat/CTF:/config"

    environment:
      SOLDAT_SERVER_NAME: "My Soldat Server"
      SOLDAT_GAME_TYPE: "ctf"
      SOLDAT_ADMIN_PASSWORD: "changeme"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

## How It Starts

1. `PostInitialization/20-InstallSoldat.ps1` downloads `SOLDAT_SERVER_URL` if `Server/soldatserver` is missing or the URL changed, checks `SOLDAT_SERVER_SHA256`, unpacks the folder holding `soldatserver` into `Server/` and remounts the overlay.
2. `PostInitialization/30-ConfigureSoldat.ps1` writes the non-empty `SOLDAT_*` settings into `soldat.ini` and the map rotation into `mapslist.txt`. It does this through `Merged/`, so both files land in `Overlay/`.
3. `START_EXE` (`/usr/local/bin/soldat-server`) runs `./soldatserver -p <SOLDAT_PORT>` from `Merged/`, under `script` so that its console output reaches `docker logs` straight away.

A successful start ends with:

```
Welcome to Soldat 1.7.1
Server name: Soldat Server
...
ctf_Ash by chakapoko maker
Server IP: 0.0.0.0 Port: 23073
Connection for file server started. Port: 23083
```

## Configuration Options

### Ports

- **23073/udp**: Game (`SOLDAT_PORT`). With `SOLDAT_LAN=false` the lobby and All-Seeing Eye registration use this port too (`Registering server @ ...` in the log).
- **23073/tcp**: Admin console for the Soldat Admin program (same port number). It is only open when `SOLDAT_ADMIN_PASSWORD` (or `Admin_Password`) is set.
- **23083/tcp**: Map and file downloads for clients (game port + 10).

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### soldat.ini and mapslist.txt

`Overlay/soldat.ini` is yours to edit. Only the keys that have a non-empty `SOLDAT_*` variable are rewritten on start. `server.ini` holds the less common options (team-kill bans, scripting).

- `GameStyle` (0 DM, 1 PM, 2 TM, 3 CTF, 4 RM, 5 INF, 6 HTF) and every mode's limit are in `[GAME]`. `SOLDAT_SCORE_LIMIT` goes into the limit key of the selected game type only.
- `mapslist.txt` is rewritten on every start: from `SOLDAT_MAPS`, or with every installed map for the game type (`ctf_*`, `inf_*`, `htf_*`, or the unprefixed maps for DM/PM/TM/RM). Set `SOLDAT_MAPS=keep` to edit `Overlay/mapslist.txt` by hand. Add custom maps as `Overlay/maps/<name>.pms`.
- Logs are in `Overlay/logs/` (`consolelog-*.txt`, `log-*.txt`, `kills/`).

### Admin console

Connect with Soldat Admin (or any TCP client) to port 23073, send the admin password as the first line, then server commands such as `/map ctf_Run`, `/nextmap`, `/addbot Kruger` or `/kick <name>`.

### Hooks

| Hook | When |
|------|------|
| `PreInstallSoldat` / `PostInstallSoldat` | Around the server download |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **Clients can't join / version mismatch**: the server is 1.7.1 (SoldatServer 2.8.2). Older 1.6 clients can't join. The Steam client checks for a Steam-authenticated server; this image is for the non-Steam client.
- **`[WARNING] Can't keep up, tick took 14831600ms`** right after start: the first tick is measured from an uninitialized timer. It is harmless.
- **The time limit ends with nobody on the server**: Soldat's clock runs without players, so an empty server keeps changing maps.
- **No bots join**: `Random_Bots` didn't add bots to an empty test server, and neither did `/addbot` from the admin console. Whether bots join once a player is on is untested.
- **`Map ... is not installed; left out of the rotation`**: the map isn't in `maps/` as `<name>.pms`. Names are case-insensitive; the `.pms` extension is optional.
- **Admin console refuses connections**: set `SOLDAT_ADMIN_PASSWORD`; the server doesn't listen on TCP 23073 without an admin password.
