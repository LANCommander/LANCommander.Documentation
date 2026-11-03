---
sidebar_label: Docker
---

# Legends of Might and Magic Docker Container

This Docker container runs a Legends of Might and Magic dedicated server. It is built on the WINE image and runs the retail Windows server, `LegendServ.exe`, under Wine and Xvfb. The container doesn't download the game, so you provide the files.

## Quick Start

```yaml
services:
  legends:
    image: lancommander/legendsofmightandmagic:latest
    container_name: legends

    ports:
      - 29800:29800/udp
      - 29801:29801/udp

    volumes:
      - "/data/Servers/Legends of Might and Magic/Default:/config"

    environment:
      LOMM_SERVER_NAME: "My Legends Server"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Copy a Legends of Might and Magic **1.1** install (the folder with `LegendServ.exe`, `server.dll` and `Data/`) into `Server/` before the first start. You can instead set `LOMM_ARCHIVE_URL` to a zip of that folder.

## How It Starts

`LegendServ.exe` has no config file and no command-line settings. It opens a **Host Settings** dialog, fills it from the registry (`HKLM\Software\New World Computing\Legends of Might and Magic\1.0`, 32-bit view) and from `ROTATION.TXT`, and starts hosting when OK is pressed. It then saves the dialog back to both, except the password, which isn't stored anywhere. The image automates this:

1. `PostInitialization/10-InitializeWinePrefix.ps1` (from the WINE image) creates the Wine prefix in `/config/wineprefix`.
2. `PostInitializeWinePrefix/20-InstallDirectPlay.ps1` runs `winetricks directplay` once, using the DirectX redist cached in the image. The server hosts through DirectPlay's "Internet TCP/IP" service provider. With Wine's builtin `dplayx` this fails with `DPERR_UNAVAILABLE`, and the server hangs at "Starting world..". A marker file, `wineprefix/.lancommander-directplay`, records that the install is done. Delete it to reinstall.
3. `PostInitialization/20-InstallLegends.ps1` checks for `Server/LegendServ.exe`. If it's missing and `LOMM_ARCHIVE_URL` is set, the hook downloads the archive.
4. `PostInitialization/25-PatchLegends.ps1` patches `Data/object.lto` so players with the same CD key can join (see [Shared CD Keys](#shared-cd-keys)).
5. `PostInitialization/30-ConfigureLegends.ps1` checks the `LOMM_*` values, writes them to the registry with `wine reg import /reg:32`, and writes the map rotation to `ROTATION.TXT`.
6. `START_EXE` (`/usr/local/bin/lomm-server`) starts `LegendServ.exe` under Xvfb and waits for the dialog. If `LOMM_PASSWORD` is set, it tabs to the password field and types it. Then it presses Enter (OK) with `xdotool`. After that it polls the GameSpy status port and logs the map and player count when they change.

A successful start looks like this:

```
Starting: LegendServ.exe
Host Settings accepted; game port 29800/udp, GameSpy status on 29801/udp
Server is up: My Legends Server
map Gauntlet (Sword), 0/16 players
```

## Configuration Options

### Ports

- **29800/udp**: Game (`LOMM_PORT`)
- **29801/udp**: GameSpy status queries (`LOMM_GAMESPY_PORT`). A `\status\` query returns the name, map, game type, players and settings.

DirectPlay also opens a dynamic UDP port. Giving the container its own LAN address (macvlan/ipvlan) is the most reliable setup.

### Environment Variables

See the [README](../README.md#environment-variables) for the full table. Settings are re-applied on every start, so changes made in the server window don't survive a restart.

### Map Rotation

`LOMM_MAPS` is a comma-separated list. Names are case-insensitive, and a `.dat` extension is accepted. Each name must be one of the 20 retail maps in `Data/worlds.rez`, or a file in `Data/Worlds/`. Unknown names are logged and left out, because a single unknown map makes the server hang at "Starting world.." for good. Set `LOMM_MAPS=config` to keep a hand-written `ROTATION.TXT` (put it in `Overlay/`).

`LOMM_MAP_TIME` is the time on each map in minutes. With nobody connected the map clock doesn't run, so an empty server stays on its first map.

### Shared CD Keys

The digital releases of the game all share one CD key. The stock server rejects a second player using a key that is already connected, with "CD Key in use". The check is GameSpy's CD key SDK in `Data/object.lto`, the server-side game DLL. The patch hook changes one byte, at file offset `0x8E25F` (VA `0x1008E25F`): a `je` (`74`) becomes a `jmp` (`EB`), so the list of connected keys is never searched.

- Only the known 1.1 `object.lto` is patched (sha256 `57e2a651…cf20` → `5d676978…5f31`). The LANCommander 1.1 archive already ships the patched file, with the original kept as `object.lto.bak`; the hook leaves that alone. Any other version is logged and not touched.
- The patched copy is written through `Merged/`, so it lands in `Overlay/Data/object.lto` and `Server/` keeps the original. Clients don't need the patch.
- After that check the SDK sends the key to `key.gamespy.com`. That server is gone, so after three 2-second retries the player is let in ("Validation Timeout"). This makes joining take a few seconds longer.
- Set `LOMM_ALLOW_SHARED_CD_KEYS=false` to leave `object.lto` alone. A file that is already patched stays patched, because the hook doesn't restore the original.

### Hooks

| Hook | When |
|------|------|
| `PreInstallLegends` / `PostInstallLegends` | Around the game file check/download |
| `PreInitializeWinePrefix` / `PostInitializeWinePrefix` | Around Wine prefix creation (WINE image) |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **Nothing after "Host Settings accepted", or "no GameSpy status reply"**: the world failed to load. Check the map names, and check that `wineprefix/.lancommander-directplay` exists.
- **"didn't accept its Host Settings"**: the dialog showed an error box. Its title names the field, e.g. `Max Players:`. The configure hook checks the same ranges, so this usually means the hook failed earlier in the log.
- **The password is visible to anyone**: the server includes it in its GameSpy `\status\` reply. That's how the game works, and it can't be turned off.
- **No console output**: the server's console is a list box in its window. `LegendServ.exe +log <file>` only writes "LogFile initialized.". The launcher logs status from the GameSpy port instead.
- **`Leg*.tmp` files**: the server leaves one in the game folder on every run. The launcher deletes them at startup.
- **"Dedicated Servers should be left as a standalone"**: the game's readme says not to join a dedicated server from the same machine.
