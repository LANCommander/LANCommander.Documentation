---
sidebar_label: Docker
---

# King Arthur's Gold Docker Container

This Docker container runs a King Arthur's Gold dedicated server. It is built on the base image and runs Transhuman Design's official Linux dedicated server (build 2844). The server package includes all game data, maps and game modes, so you don't need to supply game files.

## Quick Start

```yaml
services:
  kag:
    image: lancommander/kingarthursgold:latest
    container_name: kag

    ports:
      - 50301:50301/udp
      - 50301:50301/tcp

    volumes:
      - "/data/Servers/King Arthur's Gold/CTF:/config"

    environment:
      KAG_SERVER_NAME: "My KAG Server"
      KAG_GAME_MODE: "CTF"
      KAG_RCON_PASSWORD: "changeme"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

## How It Starts

1. `PostInitialization/20-InstallKAG.ps1` downloads `KAG_SERVER_URL` if `Server/KAGdedi` is missing or the URL changed, checks `KAG_SERVER_SHA256`, unpacks the folder holding `KAGdedi` into `Server/` and remounts the overlay.
2. `PostInitialization/30-ConfigureKAG.ps1` writes the non-empty `KAG_*` settings into `autoconfig.cfg` and, with `KAG_MAP_CYCLE`, writes `Base/Maps/lancommander_mapcycle.cfg`. It does this through `Merged/`, so both files land in `Overlay/`.
3. `START_EXE` (`/usr/local/bin/kag-server`) runs `./KAGdedi autostart Scripts/server_autostart.as autoconfig autoconfig.cfg` from `Merged/` (THD's `dedicatedserver.sh` command line), with `lib/` on `LD_LIBRARY_PATH`, under `script` so that its console output reaches `docker logs` straight away.

On start the server downloads `http://update.kag2d.com/1/linux32-dedicated-release/App/version.txt` to check for updates. Without internet access the check fails and the server starts anyway.

A successful start ends with:

```
[03:50:18] ############ GAMEMODE CTF
[03:50:18] Server created on 50301 (BUILD 4762)
...
[03:50:18] LOADING PNG MAP Maps/Official/CTF/FG_Forsaken.png
[03:50:18] Restarting rules script: Rules/CTF/Scripts/CTF.as
[03:50:18] Checking any holidays...
```

## Configuration Options

### Ports

- **50301/udp**: Game (`KAG_PORT`, `sv_port`).
- **50301/tcp**: TCP RCON (TCPR), only with `KAG_TCPR=true` (`TCPR started successfully - listening on port 50301` in the log).

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### autoconfig.cfg

`Overlay/autoconfig.cfg` is yours to edit. Only the variables that have a non-empty `KAG_*` setting are rewritten on start, plus `g_ansiconsole 0`, `sv_register`/`sv_sendminimap` (from `KAG_LAN`) and `sv_mapcycle` (from `KAG_MAP_CYCLE`). The file uses `name = value   # comment` lines. The package ships no `autoconfig.cfg`, so on the first start it holds only the hook's lines; every other variable keeps its built-in default. `server_setup_info.txt` and the [KAG wiki](https://wiki.kag2d.com/wiki/Server) describe the rest (`sv_bots`, `sv_maxping`, `sv_reservedslots`, `security_*`, ...).

### Game modes and map cycles

- `KAG_GAME_MODE` (`sv_gamemode`) is a folder under `Base/Rules`: `CTF`, `SmallCTF`, `TDM`, `WAR`, `Sandbox`, `Challenge`. Mods can add more.
- With `KAG_MAP_CYCLE` empty, the mode uses its own `Base/Rules/<mode>/mapcycle.cfg`.
- `KAG_MAP_CYCLE` takes paths under `Base/` (`Maps/Official/CTF/FG_Forsaken.png`) or bare file names (`FG_Sinkhole.png`, the first match under `Base/` is used). Maps that aren't found are left out with a warning. Add custom maps as `Overlay/Base/Maps/<name>.png`.
- Set `KAG_MAP_CYCLE=keep` to manage `sv_mapcycle` yourself; the file it points at must be under `Base/` or a mod folder.

### Remote administration

- In game: open the console (Home key) and type `/rcon /login <KAG_RCON_PASSWORD>`, then prefix commands with `/rcon`, e.g. `/rcon /nextmap`, `/rcon /kick <name> 10`.
- TCPR (`KAG_TCPR=true`): connect to TCP 50301, send the RCON password as the first line, then one command per line. Lines are console input: `/players`, `/msg hello`, or AngelScript such as `print(sv_name);`. With `sv_tcpr_everything 1` (the default) the whole console log is streamed back.

### Hooks

| Hook | When |
|------|------|
| `PreInstallKAG` / `PostInstallKAG` | Around the server download |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **`SHA256 mismatch`**: `dl.kag2d.com/kag-linux32-dedicated-release.tar.gz` always serves the newest build, and THD has published a new one. Clear `KAG_SERVER_SHA256` (or set the new hash) to install it, and update your clients to the same build.
- **Clients can't join / version mismatch**: the client and server builds must match. The server is build 2844 (`App/version.txt`, `BUILD 4762` in the log). Older clients normally update themselves on launch when they have internet access.
- **The server crashes (exit code 139) right after `LOADING PNG MAP`, with `Infinite hook recursion detected when executing void onRestart` and `postgamemapvotes` in the log**: the map cycle has fewer than 3 maps. The end-of-match map vote needs 3, and with fewer it reloads the map inside its own restart hook until the server crashes. The hook repeats maps to pad `KAG_MAP_CYCLE` to 3; a hand-written cycle (`KAG_MAP_CYCLE=keep`) needs at least 3 entries.
- **`Match not found for file ...` / `Failed to load map cycle file`**: KAG only finds files that were under `Base/` (or an enabled mod) at startup. A cycle file in the server root isn't found.
- **`WARING: sv_register is set to 0, the server will attempt to register with the api...`**: printed whenever `sv_register` is 0 (the default here, `KAG_LAN=true`). The wording is THD's; the server is not registered.
- **`Files have the same name! (rename for safety)` and `Config file not found '.../Security/*.cfg'`** during startup: harmless; the stock package has a few duplicated maps and no security lists, which the server creates.
- **`Overlay/autoconfig.cfg` has only a few lines**: see [autoconfig.cfg](#autoconfigcfg). Variables that aren't in the file use their defaults.
