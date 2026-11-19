---
sidebar_label: Docker
---

# Atomic Bomberman Docker Container

This Docker container runs an Atomic Bomberman dedicated server. It is built on the base image and runs the server of [FPC Atomic](https://github.com/PascalCorpsman/fpc_atomic) 0.14002, the open-source remake that LANCommander installs as Atomic Bomberman, using the official native Linux build. The server only needs the map definitions, which are in the image, so you don't need to supply game files.

## Quick Start

```yaml
services:
  atomicbomberman:
    image: lancommander/atomicbomberman:latest
    container_name: atomicbomberman

    ports:
      - 5521:5521/tcp
      - 8005:8005/udp

    volumes:
      - "/data/Servers/AtomicBomberman/Default:/config"

    environment:
      ATOMIC_AI: "ai_smart"

    user: root
    cap_add:
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined

    restart: unless-stopped
```

Clients join from the game's network menu. A server on the same LAN segment appears in the list (UDP 8005 discovery); otherwise enter its IP and port 5521.

## How It Starts

1. `PostInitialization/20-InstallAtomicBomberman.ps1` copies the release files baked into the image (`ATOMIC_DIST`: `atomic_server`, `libai.so`, `libai_smart.so`, `data/maps/*/info.txt`) into `Server/` if `Server/atomic_server` is missing or `Server/.atomic-version` differs from `ATOMIC_VERSION`, then remounts the overlay.
2. `START_EXE` (`/usr/local/bin/atomic-server`) sets `XDG_CONFIG_HOME` to `Merged/.config` and runs `./atomic_server -p <ATOMIC_PORT> -t <ATOMIC_TIMEOUT> [-ai <ATOMIC_AI>] [-l <ATOMIC_LOG_LEVEL>] <START_ARGS>` from `Merged/`, under `script` so its console output reaches `docker logs` in whole lines.

A successful start ends with:

```
FPC Atomic - Server ver. 0.18 by Corpsman www.Corpsman.de
...
                 Port: 5521
...
Autotimeout = 0, press "ESC" to terminate.
Ai "Atomic ai ver. 0.08 by Corpsman" loaded successfully!
```

The `ver. 0.18` is the network protocol version, not the release: the 0.14002 release uses protocol 18.

## Configuration Options

### Ports

- **5521/tcp**: Game connections (`ATOMIC_PORT`).
- **8005/udp**: LAN discovery. Clients broadcast to this port to find open servers. It is fixed in the game and can't be changed, so on a shared IP only one server shows up in the list.

### Environment Variables

See the [README](../README.md#environment-variables) for the full table.

### Game settings

The server has no settings file for the game rules. The first player to join (the master) picks the game mode, mods, wins needed and map in the client, and the client sends them to the server.

### Files the server writes

The server keeps its config folder in `Overlay/.config/fpc_atomic/`:

- `log/server.log`: the same log as `docker logs`.
- `ai_smart.ini`: the smart AI's settings (difficulty, which abilities it uses). It is written with every key and its defaults the first time `ATOMIC_AI=ai_smart` loads; edit it there and restart.
- `stats.txt`, `Playerstats.csv`: match and per-player statistics, written when the server quits by itself (see Troubleshooting).

### Hooks

| Hook | When |
|------|------|
| `PreInstallAtomicBomberman` / `PostInstallAtomicBomberman` | Around copying the server into `Server/` |

Put `.ps1` scripts in `config/Scripts/Hooks/<HookName>/`.

## Troubleshooting

- **Clients can't join / the server isn't in the list**: the client must run the same FPC Atomic release (0.14002). Each release with network changes bumps the protocol, and other releases can't join. The 0.11009 client in older LANCommander archives needs an update (FPC Atomic launcher → **Updates...**, or the executables from the [0.14002 release](https://github.com/PascalCorpsman/fpc_atomic/releases/tag/0.14002)). Clients also need the original game's data, extracted with FPC Atomic's CD data extractor; the server doesn't.
- **The log says the server is running on `127.0.0.1`**: that line is only a display. The server listens on every address; set `-bind <IP>` in `START_ARGS` to limit it.
- **`stats.txt` and `Playerstats.csv` are never written**: the server saves them only when it quits by itself, and its quit command is the ESC key. The launcher types ESC when it gets SIGTERM/SIGINT, but `docker stop` signals the base image's PowerShell entrypoint (PID 1), which doesn't pass the signal on, so the server is killed without saving. To stop it cleanly, signal the launcher first: `docker exec <container> sh -c 'for p in /proc/[0-9]*; do tr "\0" " " < $p/cmdline | grep -q "^/bin/sh /usr/local/bin/atomic-server" && kill -TERM ${p#/proc/}; done'`.
- **The first line of `docker logs` starts with `[6n[H[m`**: terminal escape codes from FPC's crt unit, written once at start. They're harmless.
- **The server exits when the last player leaves**: `ATOMIC_TIMEOUT` is not `0`. With a timeout, the server closes after that many milliseconds with nobody connected, and the container stops unless it has a restart policy.
