---
sidebar_label: Docker
---

# Multi Theft Auto Docker Container

This Docker container runs a Multi Theft Auto: San Andreas dedicated server. It is built on the base image and runs the official MTA:SA 1.6 Linux server (`mta-server64`, 1.6.0 r24159) with the official resource pack (r1602). Both are downloaded on first start, so you don't need to supply game files. Players need GTA: San Andreas with the MTA:SA 1.6 client.

## Quick Start

```yaml
services:
  multitheftauto:
    image: lancommander/multitheftauto:latest
    container_name: multitheftauto

    ports:
      - 22003:22003/udp
      - 22005:22005/tcp
      - 22126:22126/udp
      - 34219:34219/udp

    volumes:
      - "/data/Servers/MultiTheftAuto:/config"

    environment:
      MTA_SERVER_NAME: "My MTA Server"
      MTA_ADMIN_PASSWORD: "changeme"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    stdin_open: true
    stop_grace_period: 15s
    restart: unless-stopped
```

## How It Starts

1. `PostInitialization/20-InstallMultiTheftAuto.ps1` downloads `MTA_SERVER_URL`, `MTA_BASECONFIG_URL` and `MTA_RESOURCES_URL` if `Server/mta-server64` is missing or a URL changed, checks their SHA-256, replaces `Server/` with them (configs and resources in `mods/deathmatch/`) and remounts the overlay.
2. `PostInitialization/30-ConfigureMultiTheftAuto.ps1` works through `Merged/`, so everything lands in `Overlay/`:
   - copies the image's resources into `mods/deathmatch/resources/`: `[lancommander]/lancommander` (creates the admin account) and, with `MTA_PARTY_ROTATION=true`, `[managers]/mapcycler` (the party rotation, replacing the stock one)
   - writes the `MTA_*` settings and `MTA_CONFIG` into `mtaserver.conf`, and sets the startup resources (`lancommander` and `mapcycler` on, `play` off with the party rotation, plus `MTA_START_RESOURCES`)
   - adds `resource.lancommander` to the `Admin` group in `acl.xml`
   - writes the party rotation settings, the admin account and `MTA_RESOURCE_SETTINGS` into `settings.xml`
3. `PostInitialization/50-ConsoleAndStopSignal.ps1` turns `docker stop` into the `shutdown` console command.
4. `START_EXE` (`/usr/local/bin/mta-server`) runs `./mta-server64 -n -u -t <START_ARGS>` from `Merged/` (no ncurses, unbuffered, plain console) with its console fed from the FIFO `/run/mta/console`.

A successful start ends with:

```
[..] Resources: 198 loaded, 0 failed
...
[..] Server started and is ready to accept connections!
[..] PARTY: Starting Race
[..] Gamemode 'Race' started.
```

## Configuration Options

### Ports

| Port | Protocol | Use |
|------|----------|-----|
| 22003 | UDP | Game (`MTA_PORT`) |
| 22005 | TCP | Built-in HTTP server: resource downloads for clients, web admin (`MTA_HTTP_PORT`) |
| 22126 | UDP | Server browser queries (`MTA_PORT` + 123) |
| 34219 | UDP | LAN server browser broadcasts |

### Environment Variables

See the [README](https://github.com/LANCommander/LANCommander.Servers/tree/main/Servers/MultiTheftAuto#environment-variables) for the full table.

### mtaserver.conf, acl.xml and settings.xml

All three live in `mods/deathmatch/` (in `Overlay/` once the server has started). Only the elements and settings the `MTA_*` variables cover are rewritten on start; edit the rest in the files. Resource settings in `settings.xml` look like `<setting name="*race.ghostmode" value="[ true ]"/>`; the in-game admin panel (Resources tab) edits them too.

### Party rotation

The rotation is the `mapcycler` resource in `mods/deathmatch/resources/[managers]/mapcycler/` (`party.lua`). Its settings (`*mapcycler.gamemodes`, `start`, `race_maps`, `time_limit`, `vote_options`, `vote_delay`, `recent_maps`, `color`) come from the `MTA_PARTY_*` variables; `vote_delay` (seconds between a match ending and the vote, default 8) and `recent_maps` (recently played maps left out of the vote, default 8) can be set with `MTA_RESOURCE_SETTINGS`.

### Remote administration

- In game: `/login <password>` with the `MTA_ADMIN_PASSWORD` account, then `P` opens the admin panel. `/skipmap` starts the next vote.
- Web admin: `http://<server>:22005/` with the same account.
- Console: `docker exec <container> mta-command 'say hello'`, or `docker attach` with `stdin_open: true` (detach with Ctrl-P Ctrl-Q).

### Hooks

Custom hook points `PreInstallMultiTheftAuto` and `PostInstallMultiTheftAuto` run around the install. Put scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **`ip2c` warns `Access denied @ 'fetchRemote'`**: the stock `ip2c` resource can't update its country database; harmless.
- **Clients are told to update**: the server's `minclientversion` is newer than their client. With `MTA_LAN=true` it isn't raised automatically; clear `<minclientversion>` in `mtaserver.conf` if an older 1.6 client is turned away.
- **Admin login refused from a new PC**: serial authorization (`auth_serial_groups`) is cleared when `MTA_LAN=true`. On an internet server, approve the serial with `authserial <account>` in the console.
- **Votes never come up in deathmatch**: deathmatch and briefcaserace only report their round ends to a resource called `mapcycler`; keep `MTA_PARTY_ROTATION=true` or use the stock `mapcycler`.
- **`dbconmy.so` (MySQL) fails to load**: it needs OpenSSL 1.1, which Debian 12 doesn't ship. Only `dbConnect("mysql", ...)` uses it; SQLite works.
