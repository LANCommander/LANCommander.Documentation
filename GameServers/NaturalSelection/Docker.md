# Natural Selection Docker Container

This Docker container provides a Natural Selection dedicated server. It is built on the Half-Life image: HLDS comes from SteamCMD, and the `ns` mod comes from the [ENSL Natural Selection](https://github.com/ENSL/NS) GitHub releases.

## Quick Start

```yaml
services:
  naturalselection:
    image: lancommander/naturalselection:latest
    container_name: naturalselection

    ports:
      - 27015:27015/udp

    volumes:
      - "/data/Servers/Natural Selection/Default:/config"

    environment:
      START_ARGS: "-game ns -port 27015 +maxplayers 24 +map ns_eon"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

## Configuration Options

### Ports

- **27015/udp**: Game server port, which is also used for queries and RCON
- **80/tcp**: HTTP file server (optional), for `sv_downloadurl`

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NS_VERSION` | ENSL release tag to install | `"v3.3b9"` |
| `NS_URL` | URL of a release zip, which overrides `NS_VERSION` | `""` |
| `START_ARGS` | Arguments passed to the server | `"-game ns -console -port 27015 +maxplayers 24 +map ns_eon"` |
| `HTTP_FILESERVER_WEB_ROOT` | Directory served over HTTP | `"/config/Merged/ns"` |

The Half-Life image's variables (`STEAM_APP_UPDATE`, `STEAM_INSTALL_ATTEMPTS`, `HTTP_FILESERVER_ENABLED`, ...) also apply.

#### `NS_VERSION` / `NS_URL`

By default the hook downloads `https://github.com/ENSL/NS/releases/download/<NS_VERSION>/ns_<version without dots>_full.zip`, for example `ns_v33b9_full.zip`. Only the `ns/` folder is extracted, into `/config/Server/ns`.

The URL that was installed is recorded in `Server/ns/.lancommander-ns-url`. When `NS_VERSION` or `NS_URL` changes, `Server/ns` is removed and the new release is extracted. Files in `Overlay/ns` are never touched.

#### `START_ARGS`

- `-game ns`: Required
- `+maxplayers <n>`: NS is designed for up to 32 players. Many maps in the default `mapcycle.txt` are skipped below 16 players.
- `+map <map>`: Starting map. Use `ns_*` maps for regular mode (commander vs. hive) and `co_*` maps for Combat mode, which plays better with few players.

### Server Configuration

Natural Selection reads `ns/server.cfg` and executes it again on every map change (`mapchangecfgfile server.cfg`). To customize it, copy the default from `Server/ns/server.cfg` into `Overlay/ns/server.cfg` and edit the copy.

Notable settings:

```
hostname "My NS Server"
sv_lan 1
mp_botsenabled 1      // built-in bots
mp_botminplayers 12   // fill the server with bots up to this many players
mp_tournamentmode 0
mp_friendlyfire 0
```

The map rotation is in `ns/mapcycle.txt`. Entries can carry `minplayers` and `maxplayers` limits.

## Custom Hooks

In addition to the Half-Life image's hooks:

- `PreInstallNaturalSelection`: Before the mod is downloaded
- `PostInstallNaturalSelection`: After a new version is extracted

Place PowerShell scripts in `/config/Scripts/Hooks/{HookName}/`.

## Troubleshooting

### Mod didn't install

Check the container logs for `Downloading Natural Selection` and any curl or unzip errors. The install only runs when `STEAM_APP_UPDATE` is enabled. To force a reinstall, delete `/config/Server/ns/.lancommander-ns-url`.

### `Unable to initialize Steam`

`steam_appid.txt` must contain `70`, which the Half-Life image writes by default. Natural Selection has no app ID of its own.

## Additional Resources

- [ENSL Natural Selection](https://github.com/ENSL/NS)
- [Half-Life Dedicated Server](https://developer.valvesoftware.com/wiki/Half-Life_Dedicated_Server)
