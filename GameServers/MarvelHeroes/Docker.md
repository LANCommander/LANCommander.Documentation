---
sidebar_label: Docker
---

# Marvel Heroes Docker Container

This Docker container runs a Marvel Heroes server: [MHServerEmu](https://github.com/Crypto137/MHServerEmu) 1.0.3 for Marvel Heroes Omega 1.52.0.1700, on .NET 10. It is built on the base image. MHServerEmu is baked into the image. nginx takes the place of the Apache server MHServerEmu ships for Windows. You supply two data files from the game client, `Calligraphy.sip` and `mu_cdata.sip`.

## Quick Start

```yaml
services:
  marvelheroes:
    image: lancommander/marvelheroes:latest
    container_name: marvelheroes

    ports:
      - 4306:4306/tcp
      - 80:80/tcp
      - 443:443/tcp

    volumes:
      - "/servers/Marvel Heroes/Default:/config"

    environment:
      MH_PUBLIC_ADDRESS: "192.168.1.50"
      MH_SERVER_NAME: "Marvel Heroes LAN"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    stop_grace_period: 30s
    restart: unless-stopped
```

Copy `Calligraphy.sip` and `mu_cdata.sip` from a 1.52.0.1700 client's `Data/Game/` into `config/ClientData/` first.

## How It Starts

1. `PostInitialization/20-InstallMHServerEmu.ps1` copies MHServerEmu from `/opt/mhserveremu` in the image into `Server/` when `Server/.mhserveremu-version` is missing or names another version. Before that it unmounts the overlay. When it replaces another version, it renames that version's `Config.ini`, `htdocs/SiteConfig.xml` and `htdocs/news/index.html` in `Overlay/` to `*.bak-<old version>` and empties `Server/`. Then it remounts. It then copies `Calligraphy.sip` and `mu_cdata.sip` from `MH_CLIENT_DATA_DIR` into `Data/Game/` (through `Merged/`, so into `Overlay/`) when they're missing or differ in size or date.
2. `PostInitialization/30-ConfigureMHServerEmu.ps1` works out the public address (`MH_PUBLIC_ADDRESS`, or the container's IPv4 address) and writes `ConfigOverride.ini` from the `MH_*` and `MHSE__*` variables. It sets `AuthServerAddress` and `LoadScreenTipsURL` in `htdocs/SiteConfig.xml` and the patch notes link in `htdocs/news/index.html` to that address.
3. `PostInitialization/40-StartWebServer.ps1` writes `/etc/nginx/nginx.conf` and starts nginx. nginx serves `Merged/htdocs/` on 80, and passes `/AuthServer`, `/Dashboard`, `/MTXStore`, `/AccountManagement`, `/ServerStatus`, `/RegionReport` and `/Metrics` on to MHServerEmu's web front end (`127.0.0.1:MH_WEB_PORT`) on 80 and 443.
4. `PostInitialization/50-ConsoleAndStopSignal.ps1` creates `/run/mhserveremu/` and registers a SIGTERM/SIGINT handler in the entrypoint process (see [Stopping](#stopping)).
5. `START_EXE` (`/usr/local/bin/mhserveremu-server`) checks for the `.sip` files and runs `dotnet MHServerEmu.dll <START_ARGS>` in `Merged/`. The server's console input is the FIFO `/run/mhserveremu/console`, plus the container's stdin when one is attached.

A successful start ends with:

```
[...] [ Info] [PakFileSystem] Loaded 7928 entries from mu_cdata.sip
[...] [ Info] [PakFileSystem] Loaded 94788 entries from Calligraphy.sip
...
[...] [ Info] [GameDatabase] Finished initializing game database in 6388 ms
...
[...] [ Info] [FrontendServer] FrontendServer is listening on 0.0.0.0:4306...
[...] [ Info] [WebService] WebFrontend is listening on http://127.0.0.1:8080/...
[...] [ Info] [ServerApp] Type '!commands' for a list of available commands
```

Startup takes about 10 seconds and the server uses about 650 MB of memory with nobody on.

## Configuration Options

### Ports

- **4306/tcp**: Game frontend (`MH_FRONTEND_PORT`). The client connects to `[Frontend] PublicAddress` on this port after logging in.
- **80/tcp**: `SiteConfig.xml` (the first thing the client loads), the store, news and loading-tips pages, the account dashboard (`/Dashboard/`).
- **443/tcp**: HTTPS login (`/AuthServer/Login/IndexPB`). The client takes the host from `SiteConfig.xml`'s `AuthServerAddress` and the port from `AuthServerPort`.

MHServerEmu's own web front end (8080) only listens on 127.0.0.1 and isn't exposed.

### Public address

The client reads the server's address from three places, all set from the public address on every start:

- `-siteconfigurl=<address>/SiteConfig.xml` on the client's command line (yours to set)
- `AuthServerAddress` in `SiteConfig.xml` (login)
- `[Frontend] PublicAddress` in `ConfigOverride.ini` (game connection, sent to the client at login)

With `MH_PUBLIC_ADDRESS` empty, the container's first IPv4 address is used. That is right on a macvlan network where the container has its own LAN address. Behind Docker's port publishing (bridge network), set `MH_PUBLIC_ADDRESS` to the host's LAN address or name, or clients get an address they can't reach.

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### Config.ini and ConfigOverride.ini

MHServerEmu reads `Config.ini`, then `ConfigOverride.ini` over it. The hook rewrites `ConfigOverride.ini` on every start: the frontend, web front end, news and store URLs, the `MH_*` settings, then every `MHSE__<Section>__<Key>` variable, e.g. `MHSE__CustomGameOptions__DisableInstancedLoot=true` or `MHSE__GameData__LoadAllPrototypes=true`. For anything else, edit `Overlay/Config.ini` (copy it from `Server/`); every setting is documented in the file. Worth knowing:

- `[CustomGameOptions]`: `DisableInstancedLoot`, `DisableAccountBinding`, `DisableCharacterBinding`, `AllowSameGroupTalents`, `ESCooldownOverrideMinutes`, `EnableUltimatePrestige`
- `[GameOptions]`: feature switches sent to the client (Infinity vs Omega, difficulty slider, tutorial)
- `[GameData] LoadAllPrototypes=true`: a slower start, but no hitches the first time a region loads
- `[GameInstance] NumWorkerThreads`: game instance threads, up to the CPU count
- `Data/Game/LiveTuning/`: XP, loot and event multipliers

### Accounts and admins

Players create accounts on the dashboard at `http://<server>/Dashboard/`, or you create them in the server console with `!account create <email> <playerName> <password>`. New accounts are user level 0. Make an admin with `!account userlevel <email> 2` (1 = moderator). Admins can run every `!` command in the in-game chat as well. `!commands` lists them.

Run console commands from the host with:

```bash
docker exec marvelheroes mhserveremu-command '!account userlevel me@example.com 2'
```

The output is in the container's log. With `stdin_open: true`, commands can also be typed into the container's stdin (e.g. `docker attach`, or a LANCommander console).

### Stopping

MHServerEmu saves a player when they log out or change regions, and every `MH_AUTOSAVE_MINUTES` (5 by default, MHServerEmu's own default is 15). On `!server shutdown` it saves everyone, but it saves nothing when it's killed. `docker stop` only signals PID 1, the base image's PowerShell entrypoint, so `50-ConsoleAndStopSignal.ps1` registers a handler there that sends `!server shutdown` instead of exiting. The launcher closes the console once the server logs `All services shut down`, and the server exits with code 0, usually within a few seconds. Give the container a `stop_grace_period` of 30s or so, so a busy server isn't killed mid-save. A second signal isn't held back.

### Web files (htdocs)

`htdocs/` is the web root: `SiteConfig.xml`, `LiveLoadingTips.xml`, `news/`, `store/` and `bundles/` (store bundle pages and images). Edit them in `Overlay/htdocs/`. The hook only changes `AuthServerAddress` and `LoadScreenTipsURL` in `SiteConfig.xml` and the patch notes link in `news/index.html`. nginx is case-sensitive where Windows' Apache wasn't, so `/liveloadingtips.xml` and `/siteconfig.xml` are mapped to the real names. The released `SiteConfig.xml` asks for the lowercase one.

### Logs

The server logs to the console (`docker logs`). `MH_LOG_LEVEL` sets the console's level. The default of 2 (info) hides the trace lines MHServerEmu prints at startup and on every garbage collection. For a log file, set `MHSE__Logging__EnableFile=true`. It writes `Logs/MHServerEmu_<date>.log` in `Overlay/`, a new file every start. Crash reports go to `Overlay/CrashReports/`. nginx logs to `/var/log/nginx/` in the container.

### Hooks

| Hook | When |
|------|------|
| `PreInstallMHServerEmu` / `PostInstallMHServerEmu` | Around the MHServerEmu install and client data copy |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **`Data/Game/Calligraphy.sip not found`** and the container stops: copy `Calligraphy.sip` and `mu_cdata.sip` from the client's `Data/Game/` into `config/ClientData/` (or `MH_CLIENT_DATA_DIR`) and restart.
- **The client can't connect / hangs at "Connecting"**: check the client loads `http://<address>/SiteConfig.xml` and that its `AuthServerAddress` is an address the client can reach. Check the log's `Public address:` line; if it's a Docker bridge address (172.17.x.x), set `MH_PUBLIC_ADDRESS`.
- **Login works but the game doesn't load**: 4306/tcp isn't reachable at `[Frontend] PublicAddress`.
- **"Client version mismatch"** in the log: the client isn't 1.52.0.1700. Use that version, or set `MHSE__PlayerManager__AllowClientVersionMismatch=true` at your own risk.
- **`HTTP_FILESERVER_ENABLED is set`** warning: the base image's file server also wants port 80. Leave it off; this image's nginx already serves the web files.
- **`*.bak-<version>` files in `Overlay/`**: the image brought a new MHServerEmu version and moved your edited copies of the old version's files aside. Reapply your changes to the new files, then delete the backups.
- **Progress lost after a restart**: the container was killed before the server could save (no `!server shutdown` in the log). Use `docker stop` with enough `stop_grace_period`, or lower `MH_AUTOSAVE_MINUTES`.
- **`Account.db.old`** appeared: MHServerEmu 1.x can't read 0.x account databases. It renames them and starts a new one.
