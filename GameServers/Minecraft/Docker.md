---
sidebar_label: Docker
---

# Minecraft Docker Server

`lancommander/minecraft` runs a Minecraft: Java Edition server (Paper by default) on a bundled Java 25 runtime, in offline mode for LAN play.

## Quick Start

```yaml
services:
  minecraft:
    image: lancommander/minecraft:latest
    container_name: minecraft
    ports:
      - "25565:25565/tcp"
    volumes:
      - ./config:/config
    environment:
      MINECRAFT_EULA: "true"
      MINECRAFT_VERSION: "26.2"
    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined
    stdin_open: true
    stop_grace_period: 30s
    restart: unless-stopped
```

Setting `MINECRAFT_EULA=true` accepts the [Minecraft EULA](https://aka.ms/MinecraftEULA). Without it the server writes `eula=false` and stops.

## Ports

| Port | Protocol | Use |
|------|----------|-----|
| 25565 | TCP | Game (`MINECRAFT_PORT`) |
| 25565 | UDP | Server list query, when `enable-query=true` |
| 25575 | TCP | RCON, when `MINECRAFT_RCON_PASSWORD` is set |
| 4445 | UDP (out) | "LAN Worlds" announcement to 224.0.2.60 (`MINECRAFT_LAN_ANNOUNCE`) |

## Volumes

`/config` holds `Server/` (the server jar and plugin jars the image installs), `Overlay/` (everything the server writes), and `Merged/` (the OverlayFS view the server runs in). Put your own files, such as worlds, `server.properties` changes, plugin configs, or plugins you add by hand, in `Overlay/`.

## Environment Variables

See the table in the [README](../README.md#environment-variables).

## Offline Mode

With `MINECRAFT_ONLINE_MODE=false` the server doesn't check players with Mojang, so it accepts any name, and a player's UUID is derived from the name (`OfflinePlayer:<name>`). Inventories, stats and operator status follow the name. `MINECRAFT_OPS` writes those UUIDs into `ops.json`. `MINECRAFT_ENFORCE_SECURE_PROFILE` must stay `false`, or offline clients can't chat.

Anyone on the network can join under any name, so keep an offline server on a trusted LAN (or set a whitelist in `Overlay/whitelist.json` with `white-list=true`).

## Console

- `docker exec <container> minecraft-command '<command>'` (e.g. `'say hi'`, `'op SomePlayer'`) writes to the server console.
- With `stdin_open: true`, whatever is written to the container's stdin reaches the console too (`docker attach`, the LANCommander Docker engine).
- `docker stop` sends `stop`, which saves the worlds before the server exits. Give it time with `stop_grace_period`.
- The log is `Overlay/logs/latest.log`.

## Hooks

| Hook | Script | What it does |
|------|--------|--------------|
| PostInitialization | `20-InstallMinecraft.ps1` | Installs the server jar and plugins; fires `PreInstallMinecraft` / `PostInstallMinecraft` |
| PostInitialization | `30-ConfigureMinecraft.ps1` | Writes `eula.txt`, `server.properties` and `ops.json` |
| PostInitialization | `40-StartLanAnnounce.ps1` | Starts the "LAN Worlds" announcer |
| PostInitialization | `50-ConsoleAndStopSignal.ps1` | Turns SIGTERM/SIGINT into the `stop` console command |

Your own scripts go in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **"Hash check failed for downloaded file mojang_<version>.jar"** on first start: Paper's download of Mojang's jar was cut short. The container restarts and downloads it again.
- **Clients get "Outdated server" / "Outdated client"**: the client and server versions differ. Set `MINECRAFT_VERSION` to the clients' version.
- **"Failed to verify username"**: the server is in online mode; set `MINECRAFT_ONLINE_MODE=false` for offline clients.
- **Extra worlds on 26.1+**: Paper keeps worlds other than the main one in `<level-name>/dimensions/minecraft/<name>/`. A world folder copied to the server root is moved there when it's loaded, and that move fails if the target folder already exists. Plugins that reset worlds by copying them into the server root have to delete the old folder in `dimensions/` first.
