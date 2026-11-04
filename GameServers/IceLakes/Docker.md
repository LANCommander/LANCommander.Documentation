# Ice Lakes Docker Container

This Docker container provides an Ice Lakes dedicated server that automatically downloads and updates the game via SteamCMD, configures the server from environment variables, and supports file overlaying using OverlayFS.

## Quick Start

```yaml
services:
  icelakes-default:
    image: lancommander/icelakes:latest
    container_name: icelakes-default

    ports:
      - 13300:13300/udp
      - 27015:27015/udp
      - 8766:8766/udp

    volumes:
      - "/data/Servers/Ice Lakes/Default:/config"

    environment:
      ICELAKES_SERVER_NAME: "My Ice Lakes Server"
      ICELAKES_MAX_PLAYERS: "16"
      ICELAKES_ADMIN_PASSWORD: "change-me"

    user: root

    cap_add:
      - SYS_ADMIN

    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

## Configuration Options

### Ports

The container exposes the following ports:

- **13300/udp** - Game traffic. Clients connect to this port. Set with `ICELAKES_PORT` (`[Server] Port`).
- **27015/udp** - Server queries. The in-game LAN server browser and Steam find the server on this port. Set with `ICELAKES_QUERY_PORT` (`[Server] OutPort`).
- **8766/udp** - Steam game server port, used to talk to the Steam master servers.

If you change `ICELAKES_PORT` or `ICELAKES_QUERY_PORT`, change the port mappings to match. When running several servers on one host with bridge networking, give each its own ports.

### Volumes

The container requires a volume mount for the `/config` directory, which stores:

- **Server/** - Game files downloaded by SteamCMD (auto-created, about 1.8 GB)
- **Overlay/** - Custom files that overlay on top of the game directory, including your `server.cfg`
- **Merged/** - OverlayFS merged view (auto-created)
- **Logs/** - The server log of the current run (`IceLakes_Server.log`)
- **Scripts/** - Custom PowerShell scripts for hooks

**Important:** The mounted directory must be writable by the container.

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `STEAM_APP_ID` | Steam app id of the dedicated server | `460300` | No |
| `STEAM_VALIDATE` | Validate the game files when SteamCMD updates on startup (`true`/`false`) | `true` | No |
| `START_EXE` | Server launcher | `icelakes-server` | No |
| `START_ARGS` | Arguments passed to `IceLakes_Server.x86_64` | `"-batchmode -nographics"` | No |
| `ICELAKES_SERVER_NAME` | `[Server] Name`: name shown in the server browser | *(unset, stock: `Dedicated Server`)* | No |
| `ICELAKES_MAX_PLAYERS` | `[Server] MaxPlayers` | *(unset, stock: `32`)* | No |
| `ICELAKES_PASSWORD` | `[Server] Password`: join password | *(unset, stock: none)* | No |
| `ICELAKES_ADMIN_PASSWORD` | `[Server] AdminPassword` | *(unset, stock: `admin`)* | No |
| `ICELAKES_PORT` | `[Server] Port`: game port (UDP) | *(unset, stock: `13300`)* | No |
| `ICELAKES_QUERY_PORT` | `[Server] OutPort`: server query port (UDP) | *(unset, stock: `27015`)* | No |
| `ICELAKES_FISH_NOTIFICATIONS` | `[Server] FishNotifications` (`1`/`0`) | *(unset, stock: `1`)* | No |
| `ICELAKES_FISH_FIGHT` | `[Server] FishFight` (`1`/`0`) | *(unset, stock: `1`)* | No |
| `ICELAKES_BATTLE_ROYALE` | `[Server] BattleRoyale` (`1`/`0`) | *(unset, stock: `0`)* | No |
| `ICELAKES_LOG_FILE` | Server log file, followed to `docker logs` | `/config/Logs/IceLakes_Server.log` | No |
| `HTTP_FILESERVER_ENABLED` | HTTP file server on port 80 (the game has nothing to serve) | `false` | No |

#### `ICELAKES_*`

On every start, `PostInitialization/30-ConfigureServer.ps1` writes each `ICELAKES_*` variable that is set into the `[Server]` section of `/config/Merged/server.cfg` (keeping the file's Windows line endings). The first change copies the file into `/config/Overlay/server.cfg`. Empty variables leave the value in the file alone, so settings you edit by hand in the overlaid file survive. Passwords are masked in the log.

#### `START_ARGS`

Arguments passed to `IceLakes_Server.x86_64`. Keep `-batchmode -nographics`. Don't add `-logFile`: the launcher sets it to `ICELAKES_LOG_FILE`.

The server also understands `+port <n>`, `+outport <n>` and `+password <pw>` on the command line, but the image configures these through `server.cfg`.

#### `STEAM_VALIDATE`

SteamCMD updates the game server on every container start. With `STEAM_VALIDATE` set to `"true"` (the default) it also checks every game file, which takes longer; set it to `"false"` for faster restarts.

### Security Options

The container requires elevated privileges to use OverlayFS for file overlaying.

```yaml
cap_add:
  - SYS_ADMIN
security_opt:
  - apparmor:unconfined
```

`privileged: true` also works, but grants the container far more access than it needs.

## Directory Structure

```
/config/
├── Server/              # Game files from SteamCMD (auto-created)
│   ├── IceLakes_Server.x86_64
│   ├── IceLakes_Server.x86
│   ├── IceLakes_Server_Data/
│   ├── server.cfg       # Stock configuration (restored by SteamCMD updates)
│   └── steam_appid.txt
├── Overlay/             # Custom files overlay (your modifications)
│   └── server.cfg       # Your configuration
├── Merged/              # OverlayFS merged view (auto-created)
├── .overlay-work/       # OverlayFS work directory (auto-created)
├── Logs/
│   └── IceLakes_Server.log
└── Scripts/
    └── Hooks/           # Custom PowerShell scripts for hooks
```

## Game Configuration

### `server.cfg`

```ini
[Server]
Name=Dedicated Server
MaxPlayers=32
Port=13300
OutPort=27015
Password=
AdminPassword=admin
FishNotifications=1
FishFight=1
BattleRoyale=0

[Map1]
Level=Level_Forest_Lake
GameMode=Total_Weight
TimeLimit=20
Season=Winter
DayTime=Evening

[Map2]
...
```

The server starts on `[Map1]`; the other `[MapN]` sections are the rotation. More maps can be added by increasing the number. The stock file has 24 entries.

| Key | Values |
|-----|--------|
| `Level` | `Level_Forest_Lake`, `Level_Fishing_Islands`, `Level_Roach_Lake`, `Level_Pike_River`, `Level_Moose_Lake`, `Level_North_River`, `Level_West_Coast`, `Level_Snowy_Mountains`, `Level_Duck_Pond`, `Level_Korvas`, `Level_Hardy_Herring`, `Level_Clear_Waters`, `Level_Emperors_Garden`, `Level_Ice_Lakes`, `Level_Gold_Rush`, `Level_Glacier`, `Level_Tropical_Freeze`, `Level_Tammerkoski`, `Level_Siilinkari`, `Level_China_1`, `Level_China_2` |
| `GameMode` | `Total_Weight`, `Free`, `Total_Amount`, `Biggest_Fish`, `Most_Species`, `Only_Trout`, `Only_Perch`, `Only_Perch_Quantity`, `Three_Biggest`, `Only_Mormushka`, `Only_Balanced`, `Only_Pike` |
| `TimeLimit` | Round length. The stock file's comment says seconds, but its values (15–30) only make sense as minutes |
| `Season` | `Autumn`, `Winter`, `Spring` |
| `DayTime` | `Morning`, `Noon`, `Evening`, `Night` |

To change the rotation:

```bash
cd "/data/Servers/Ice Lakes/Default"
[ -f Overlay/server.cfg ] || cp Server/server.cfg Overlay/server.cfg
$EDITOR Overlay/server.cfg
docker restart icelakes-default
```

## Troubleshooting

### Container Won't Start

1. Check the logs: `docker logs icelakes-default`
2. Ensure the mounted volume is writable
3. Ensure `cap_add: SYS_ADMIN` is set, or use `privileged: true`

### `ERROR! Failed to install app '460300' (Missing configuration)`

A fresh SteamCMD (no cached app info) fails to install the Ice Lakes Dedicated Server with this error. The image handles this in the `PreSteamInstallGame/10-BootstrapInstall.ps1` hook: when `Server/steamapps/appmanifest_460300.acf` doesn't exist yet, it refreshes the app info (`app_info_update 1`) and installs in the same SteamCMD session, retrying up to three times (the first attempt usually fails and the second works). Later updates work as usual. If the first install was interrupted, delete `Server/steamapps/appmanifest_460300.acf` and restart the container.

### `START_EXE` or game files not found on the first start

The overlay is mounted before SteamCMD downloads the game into `Server/`, and OverlayFS doesn't reliably show files added to the lower directory while it is mounted. `PostSteamInstallGame/90-RemountOverlay.ps1` hands the files to the server user and remounts the overlay after the install. It only runs when the container runs as root (`user: root`).

### Server log missing from `docker logs`

The server runs as the unprivileged `lancommander` user and can't reopen the container's stdout, so `-logFile /dev/stdout` makes Unity silently fall back to `~/.config/unity3d/Player.log`. The `icelakes-server` launcher passes `-logFile $ICELAKES_LOG_FILE` and follows that file instead. Don't put `-logFile` in `START_ARGS`.

### Settings in `server.cfg` are reset

SteamCMD restores the stock `Server/server.cfg` on updates. Edit `/config/Overlay/server.cfg` instead. `ICELAKES_*` variables that are set override the matching `[Server]` keys on every start.

### Server not visible in the LAN server browser

The LAN browser queries port 27015/udp (`OutPort`). Make sure it is reachable from the clients, e.g. by running the container on a macvlan network or publishing the port. Clients can also join directly with the server's address and game port.

### Harmless startup messages

`Couldn't load savedata: IceLakesData.bytes`, `Couldn't read username from steam`, `AddComponent with MonoBehaviour is not allowed`, `DontDestroyOnLoad only work for root GameObjects` and the `(Filename: ... Line: ...)` lines after them are printed on every start and don't affect the server.

## Advanced Usage

### Custom Hooks

You can create custom PowerShell scripts that execute at various points in the container's lifecycle. Place scripts in:

```
/config/Scripts/Hooks/{HookName}/
```

**Available hooks:**
- `PreInitialization` - Before the overlay is mounted
- `PostInitialization` - After the overlay is mounted; the game is installed by `20-InstallGame.ps1` and `server.cfg` is configured by `30-ConfigureServer.ps1`
- `PreSteamInstallGame` - Before SteamCMD runs
- `PostSteamInstallGame` - After SteamCMD completes
- `ServerStarted` - Right before the server process starts
- `ServerStopped` - After the server process exits

### Multiple Server Instances

Give each instance its own container name, `/config` directory and ports:

```yaml
environment:
  ICELAKES_SERVER_NAME: "Ice Lakes 2"
  ICELAKES_PORT: "13301"
  ICELAKES_QUERY_PORT: "27016"
ports:
  - 13301:13301/udp
  - 27016:27016/udp
```

## Additional Resources

- [Ice Lakes on Steam](https://store.steampowered.com/app/393430/Ice_Lakes/)
- [Ice Lakes Dedicated Server on SteamDB](https://steamdb.info/app/460300/)
