---
sidebar_label: Docker
---

# Starsiege: Tribes Docker Container

This Docker container runs a Starsiege: Tribes dedicated server. It is built on the WINE image and runs the Windows game's `-dedicated` mode under Wine and Xvfb. The container doesn't download the game, so you provide the files.

## Quick Start

```yaml
services:
  tribes:
    image: lancommander/tribes:latest
    container_name: tribes

    ports:
      - 28001:28001/udp

    volumes:
      - "/data/Servers/Starsiege - Tribes/CTF:/config"

    environment:
      TRIBES_MISSION: "Raindance"
      TRIBES_SERVER_NAME: "My Tribes Server"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Before the first start, copy a Tribes install into `Server/`, so that `Server/Tribes.exe` and `Server/base/` exist. The community 1.40/1.41 release is recommended; clients must run the same version. You can instead set `TRIBES_ARCHIVE_URL` to a zip of the game folder.

## How It Starts

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitialization/20-InstallTribes.ps1` checks for `Server/Tribes.exe`. If it's missing and `TRIBES_ARCHIVE_URL` is set, the hook downloads and extracts the archive and remounts the overlay.
3. `PostInitialization/30-ConfigureTribes.ps1` writes `config/lancommander.cs` with the non-empty `TRIBES_*` settings and `$Console::LogMode = 1;` (turns on `console.log`). It also writes `config/lancommanderAdmins.cs` and adds a line to `config/Server/adminpasswords.cs` that executes it.
4. `START_EXE` (`/usr/local/bin/tribes-server`) streams `console.log` and runs `Tribes.exe [-mod <mod>]... +exec lancommander.cs [START_ARGS] -dedicated <TRIBES_MISSION>` under Wine and Xvfb.

The game's `console.cs` loads `config/Server/serverDefaults.cs` and `config/Server/ServerPrefs.cs`, then the `+exec` files, then creates the server. A successful start ends with:

```
Executing missions/Raindance.mis.
...
Dedicated Server Initialized
```

## Configuration Options

### Ports

- **28001/udp**: Game, server queries and LAN browser (`TRIBES_PORT`)

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### Missions and map packs

The mission name is the `.mis` file name without the extension, from any `missions/` folder on the game's search path. The game type (CTF, Capture and Hold, Deathmatch ...) comes from the mission. The server cycles through missions of the same type.

Many community installs, including the 1.41 release, add map packs (`lt/`, `dox/`, `opencall/` ...) to the search path in `console.cs`. Their missions work without `-mod`; set `TRIBES_MISSION` to e.g. `BastardForgeLT`. Use `TRIBES_MOD` only for script mods that ship a `<mod>/<mod>.cs`.

### Server and admin config

`config/Server/ServerPrefs.cs`, `serverDefaults.cs`, `adminpasswords.cs` and `adminlevels.cs` are in your install and yours to edit (changes land in `Overlay/`). A setting that also has a non-empty `TRIBES_*` variable is overwritten on start. Don't edit `config/lancommander.cs` or `config/lancommanderAdmins.cs`, because they are regenerated on every start.

`TRIBES_ADMIN_PASSWORD` adds an "Owner Admin" login. Add more admins with `admin::addadmin("Name", "password", "<level>");` lines in `adminpasswords.cs`. Clients log in from the in-game admin menu or the console (`remoteEval(2048, AdminPassword, "password");`).

### Hooks

| Hook | When |
|------|------|
| `PreInstallTribes` / `PostInstallTribes` | Around the game file check/download |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **`wine: Unhandled page fault on read access to ... at address 00561390` right after start**: the server ran without a display. `Tribes.exe` needs a window system even with `-dedicated`, so keep `WINE_XVFB=true`.
- **The server exits right after `Starting: Tribes.exe -mod <name> ...` with no console output**: the `-mod` folder is not a script mod. Map packs on the search path (`lt`, `dox`, `opencall` ... in the 1.41 release) must not be loaded with `-mod`; clear `TRIBES_MOD`.
- **Server not in the LAN browser**: the browser finds servers by UDP broadcast, so the container needs its own LAN address (macvlan/ipvlan) or host networking. Clients can join by IP through port mapping (`IP:<address>:28001`).
- **Admin password doesn't work**: it needs `config/Server/adminpasswords.cs` (1.40/1.41 admin scripts). With older versions, the hook logs a warning and ignores `TRIBES_ADMIN_PASSWORD`.
- **The first lines of the console are missing from `docker logs`**: logging only starts when `config/lancommander.cs` runs, after the game has loaded its scripts and prefs.
- **`cursorOn: MainWindow is not a valid SimGui::Canvas`, `exec: invalid script file .cs.`**: harmless; the dedicated server runs client UI calls and an empty mod script name.
- **No console commands**: the dedicated console reads from its own Win32 console, not `docker attach`. Use the in-game admin menu.
