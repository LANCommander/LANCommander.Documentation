---
title: Client Config
---

# Enemy Territory Client Console Variables (CVars) Reference

## Overview

Client-side console variables control player gameplay experience, graphics rendering, input settings, and user interface. These are personal settings stored in your config and don't affect other players.

---

## Network & Performance Settings

### Connection Settings
```
rate <bytes/sec>                    Default: 25000
Recommended: 25000+ (good connection)
              15000-20000 (moderate ISP)
              10000-15000 (poor connection)

snaps <updates/sec>                 Default: 20
Recommended: 20 (standard)
              25-33 (competitive)
              40+ (high-end connection)

cl_maxpackets <packets/sec>         Default: 125
Recommended: 125 (standard)
              60 (if lagging)

cl_packetdup <number>               Default: 1
              Duplicate packets for reliability
              0 = off, 1-2 = recommended

cl_timeNudge <milliseconds>         Default: 0
              Adjust ping compensation (-10 to 10 typical)
```

**Example: High-speed competitive connection**
```
rate 25000
snaps 25
cl_maxpackets 125
cl_packetdup 1
cl_timeNudge 0
```

**Example: Dial-up or poor connection**
```
rate 8000
snaps 20
cl_maxpackets 60
cl_packetdup 2
cl_timeNudge -5
```

### Interpolation & Smoothing
```
cl_interpolation <0-4>              Default: 0
              0 = off (most responsive)
              1-2 = light smoothing
              3-4 = heavy smoothing
              Depends on snaps value

cl_extrapolationMargin <0-10>       Default: 1
              Reduce jitter from packet loss
```

---

## Input & Control Settings

### Mouse Settings
```
sensitivity <value>                 Default: 5
m_pitch <value>                     Default: 0.022
m_yaw <value>                       Default: 0.022
m_forward <value>                   Default: 0.25
m_side <value>                      Default: 0.25
m_filter <0|1>                      Default: 0 (smooth input: off)

cl_mouseAccel <0|1>                 Default: 0 (mouse acceleration)
```

**Example: Competitive mouse settings (low sensitivity)**
```
sensitivity 2.5
m_pitch 0.022
m_yaw 0.022
m_forward 0.25
m_side 0.25
m_filter 0
cl_mouseAccel 0
```

**Example: High sensitivity tactical settings**
```
sensitivity 8
m_pitch 0.015
m_yaw 0.015
m_forward 0.35
m_side 0.35
m_filter 1
cl_mouseAccel 1
```

### Joystick / Controller Settings
```
j_pitch <-15 to 15>                 Default: 0.022
j_yaw <-15 to 15>                   Default: -0.022
j_forward <-15 to 15>               Default: -0.25
j_side <-15 to 15>                  Default: 0.25
j_up <-15 to 15>                    Default: 0

j_pitch_axis <0-N>                  Default: 3
j_yaw_axis <0-N>                    Default: 2
j_forward_axis <0-N>                Default: 1
j_side_axis <0-N>                   Default: 0
j_up_axis <0-N>                     Default: 4
```

### Movement Controls
```
cl_run <0|1>                        Default: 1 (running enabled)
cl_freelook <0|1>                   Default: 1 (free look)
cl_yawspeed <degrees/sec>           Default: 140
cl_pitchspeed <degrees/sec>         Default: 140
cl_anglespeedkey <multiplier>       Default: 1.5 (key held modifier)
cl_doubletapdelay <ms>              Default: 0 (double-tap lean)
```

---

## Weapon & Aiming Settings

### Zoom & Scoped Weapon Settings
```
cg_useWeapsForZoom <0|1>            Default: 1
              Use weapon zoom instead of +zoom

cg_zoomDefaultSniper <value>        Default: 20 (zoom level)
cg_zoomStepSniper <value>           Default: 2 (zoom increment)

cg_weapzoomFov <degrees>            Default: 75
cg_weapzoomInTimeMs <ms>            Default: 100 (zoom in speed)
cg_weapzoomOutTimeMs <ms>           Default: 100 (zoom out speed)
cg_weapzoomSensitivityScale <0-1>   Default: 1.0
cg_weapzoomSensitivityOverride <0|1> Default: 0

cg_scopedSensitivityScaler <0-1>    Default: 0.6
              Reduce mouse sensitivity when scoped
              Recommended: 0.4-0.6
```

**Example: Competitive sniper settings**
```
cg_useWeapsForZoom 1
cg_zoomDefaultSniper 20
cg_zoomStepSniper 2
cg_weapzoomFov 60
cg_weapzoomInTimeMs 50
cg_weapzoomOutTimeMs 50
cg_scopedSensitivityScaler 0.5
```

### Weapon Mechanics
```
cg_autoswitch <0|1|2>               Default: 2
              0 = off
              1 = switch on pickup
              2 = switch on empty

cg_noAmmoAutoSwitch <0|1>           Default: 1 (switch when out of ammo)
cg_autoactivate <0|1>               Default: 1
cg_autoReload <0|1>                 Default: 1
cg_weapaltReloads <0|1>             Default: 0 (alt fire reload)
cg_weapaltSwitches <0|1>            Default: 1 (alt fire weapon switch)
cg_weapaltMgAutoProne <0|1>         Default: 1 (machinegun auto-prone)

cg_weaponCycleDelay <ms>            Default: 150
cg_cycleAllWeaps <0|1>              Default: 1 (cycle all weapons vs equipped)
```

**Example: Fast-paced weapon switching**
```
cg_autoswitch 2
cg_noAmmoAutoSwitch 1
cg_autoReload 1
cg_weapaltReloads 1
cg_weapaltSwitches 1
cg_weaponCycleDelay 80
```

### Crosshair Settings
```
cg_drawCrosshair <0|1>              Default: 1
cg_drawCrosshairPickups <0|1>       Default: 1
cg_drawCrosshairFade <ms>           Default: 250

# Built-in crosshairs
cg_useCvarCrosshair <0|1>           Default: 1
cg_crosshairSize <pixels>           Default: 48
cg_crosshairColor <color>           Default: White
cg_crosshairAlpha <0-1>             Default: 1.0
cg_crosshairPulse <0|1>             Default: 1
cg_crosshairHealth <0|1>            Default: 0 (color by health)
cg_crosshairX <offset>              Default: 0
cg_crosshairY <offset>              Default: 0
cg_crosshairScaleX <scale>          Default: 1.0
cg_crosshairScaleY <scale>          Default: 1.0

# Alternate crosshair
cg_crosshairColorAlt <color>        Default: White
cg_crosshairAlphaAlt <0-1>          Default: 1.0
```

**Example: Large visibility crosshair**
```
cg_useCvarCrosshair 1
cg_crosshairSize 64
cg_crosshairColor "Yellow"
cg_crosshairAlpha 1.0
cg_crosshairPulse 1
cg_crosshairHealth 1
```

### Custom Crosshair (Advanced)
```
cg_customCrosshair <0|1>            Default: 0 (enable custom)

# Dot configuration
cg_customCrosshairDotWidth <px>         Default: 2.0
cg_customCrosshairDotColor <hex>        Default: #00FF00E6
cg_customCrosshairDotOutlineRounded <0|1> Default: 1
cg_customCrosshairDotOutlineColor <hex> Default: #000000E6
cg_customCrosshairDotOutlineWidth <px>  Default: 1.0

# Crosshair lines configuration
cg_customCrosshairCrossWidth <px>       Default: 2.0
cg_customCrosshairCrossLength <px>      Default: 8.0
cg_customCrosshairCrossGap <px>         Default: 4.0
cg_customCrosshairCrossSpreadDistance <px> Default: 25.0
cg_customCrosshairCrossSpreadOTGCoef <mult> Default: 2.0
cg_customCrosshairCrossColor <hex>      Default: #00FF00E6
cg_customCrosshairCrossOutlineRounded <0|1> Default: 1
cg_customCrosshairCrossOutlineColor <hex> Default: #000000E6
cg_customCrosshairCrossOutlineWidth <px> Default: 1.0

cg_customCrosshairHealth <0|1>      Default: 0 (color by health)
```

**Example: Competitive custom crosshair**
```
cg_customCrosshair 1
cg_customCrosshairDotWidth 3.0
cg_customCrosshairDotColor "#00FF00FF"
cg_customCrosshairCrossWidth 2.0
cg_customCrosshairCrossLength 10.0
cg_customCrosshairCrossGap 3.0
cg_customCrosshairCrossSpreadDistance 30.0
cg_customCrosshairCrossColor "#00FF00FF"
```

---

## HUD & Display Settings

### Interface Display
```
cg_draw2D <0|1>                     Default: 1
cg_drawGun <0|1>                    Default: 1 (gun model)
cg_drawStatus <0|1>                 Default: 0 (status bar)
cg_drawEnvAwareness <0-7>           Default: 7 (objective icons)
cg_drawEnvAwarenessScale <0-1>      Default: 0.80
cg_drawEnvAwarenessIconSize <px>    Default: 14

cg_letterbox <0|1>                  Default: 0 (cinematic borders)
cg_centertime <seconds>             Default: 5 (center print duration)
```

### HUD Styles & Themes
```
cg_altHud <0|1>                     Default: 0 (alternative HUD)
cg_shoutcasterHud <name>            Default: Shoutcaster
cg_drawUnit <0|1>                   Default: 0 (show unit names)
```

### Scoreboard & Team Info
```
cg_drawSpectatorNames <0-2>         Default: 2
              0 = off
              1 = minimal
              2 = full

cg_teamChatsOnly <0|1>              Default: 0
cg_teamVoiceChatsOnly <0|1>         Default: 0
cg_voiceChats <0|1>                 Default: 1
cg_voiceText <0|1>                  Default: 1
cg_voiceSpriteTime <ms>             Default: 6000

cg_teamChatTime <ms>                Default: 8000
cg_teamChatMention <0|1>            Default: 1
```

### Notifications & Feedback
```
cg_drawNotifyText <0|1>             Default: 1
cg_printObjectiveInfo <0|1>         Default: 1
cg_quickMessageAlt <0|1>            Default: 1 (quick message menu)
cg_locations <0-3>                  Default: 3 (location messages)
cg_locationMaxChars <0-N>           Default: 0 (no limit)

cg_announcer <0|1>                  Default: 1
cg_reinforceTickTock <0|1>          Default: 0 (reinforce sound)
cg_hitSounds <0|1>                  Default: 1
```

---

## Graphics & Visual Effects

### Rendering Options
```
cg_fov <degrees>                    Default: 90 (field of view)
              Recommended: 90-110

cg_shadows <0|1>                    Default: 0
cg_dynamicLight <0|1>               Default: 1 (dynamic lighting)
cg_muzzleFlash <0|1>                Default: 1
cg_muzzleFlashDlight <0|1>          Default: 0 (dynamic light on muzzle)
cg_muzzleFlashOld <0|1>             Default: 0 (old-style particles)

cg_gibs <0|1>                       Default: 1 (gore/gibs)
cg_showblood <0|1>                  Default: 1
cg_bloodPuff <0|1>                  Default: 1
cg_bloodFlash <0-1>                 Default: 1.0 (intensity)
cg_bloodFlashTime <ms>              Default: 1500
cg_bloodDamageBlend <0-1>           Default: 0.0
cg_bloodForcePuffsForDamage <0|1>   Default: 1

cg_drawBreathPuffs <0|1>            Default: 1
cg_drawAirstrikePlanes <0|1>        Default: 1
```

### Particles & Visual Details
```
cg_visualEffects <0|1>              Default: 1 (smoke, debris)
cg_railTrailTime <ms>               Default: 750
cg_tracers <0|1>                    Default: 1
cg_brassTime <ms>                   Default: 2500
cg_markTime <ms>                    Default: 20000
cg_coronas <0|1>                    Default: 1
cg_coronafardist <pixels>           Default: 1536
```

### Misc Visual Settings
```
cg_simpleItems <0|1>                Default: 0
cg_simpleItemsScale <scale>         Default: 1.0
cg_skybox <0|1>                     Default: 1
cg_bobbing <0-1>                    Default: 0.0 (view bob)
cg_swingSpeed <speed>               Default: 0.1 (weapon swing)
```

### Scope Reticle Customization
```
cg_scopeReticleStyle <0-N>          Default: 0
cg_scopeReticleColor <hex>          Default: #000000FF
cg_scopeReticleDotColor <hex>       Default: #000000FF
cg_scopeReticleLineThickness <px>   Default: 2.0
cg_scopeReticleDotThickness <px>    Default: 2.0
```

**Example: Clean minimal visuals**
```
cg_shadows 1
cg_gibs 0
cg_showblood 0
cg_bloodFlash 0.5
cg_visualEffects 0
cg_tracers 0
cg_coronas 0
cg_bobbing 0.0
```

---

## Audio Settings

### Chat & Communication
```
cg_drawNotifyText <0|1>             Default: 1
cg_voiceText <0|1>                  Default: 1
cg_voiceChats <0|1>                 Default: 1

# Console keys for chatting
cl_consoleKeys "~ ` 0x7e 0x60"      Allows ~ or ` for console
```

### Sound Effects
```
cg_hitSounds <0|1>                  Default: 1
cg_announcer <0|1>                  Default: 1
```

---

## Demo Recording & Playback

### Recording Settings
```
cl_demorecording <0|1>              Read-only (auto-set by record/stop)
cl_demofilename <name>              Read-only (current demo name)
cl_autorecord <0|1>                 Default: 0 (auto-record matches)

cl_wavefilerecord <0|1>             Default: 0 (record to WAV)

# AVI recording
cl_avidemo <0|1>                    Default: 0
cl_forceavidemo <0|1>               Default: 0
cl_avidemotype <0|1>                Default: 0
cl_avimotionjpeg <0|1>              Default: 0
cl_aviFrameRate <fps>               Default: 25
              Recommended: 24-30 fps

cl_aviPipeFormat <ffmpeg-options>   Default: "-preset medium -crf 23..."
cl_aviPipeExtension <ext>           Default: "mp4"
```

**Example: High-quality AVI recording**
```
cl_aviFrameRate 30
cl_avidemotype 1
cl_avimotionjpeg 0
```

### Demo Playback
```
cl_freezeDemo <0|1>                 Default: 0
timedemo <0|1>                      Benchmark mode
cl_avidemo <0|1>                    Record while playing demo
```

### EDV (Extended Demo Viewer)
```
demo_weaponcam <0|1>                Default: 0
demo_followDistance <x y z>         Default: 50 0 20
demo_yawPitchRollSpeed <y p r>      Default: 140 140 140
demo_freecamspeed <units>           Default: 800
demo_nopitch <0|1>                  Default: 1
demo_pvshint <0|1>                  Default: 0
demo_lookat <entity-num>            Default: -1
demo_autotimescale <0|1>            Default: 1
demo_autotimescaleweapons <0|1>     Default: 0
demo_teamonlymissilecam <0|1>       Default: 0

demo_avifpsF1 <fps>                 Default: 0 (F1 key)
demo_avifpsF2 <fps>                 Default: 10
demo_avifpsF3 <fps>                 Default: 15
demo_avifpsF4 <fps>                 Default: 20
demo_avifpsF5 <fps>                 Default: 24
```

---

## Advanced Graphics Settings

### Texture & Rendering Quality
```
r_picmip <0-3>                      Default: 1 (texture quality)
              0 = highest quality
              1 = standard
              2 = lower
              3 = lowest

r_texturebits <0|16|32>             Default: 0 (auto)
r_detailtextures <0|1>              Default: 1
r_colorMipLevels <0|1>              Default: 0
r_roundImagesDown <0|1>             Default: 1
r_simpleMipMaps <0|1>               Default: 1

r_lodBias <value>                   Default: 0
r_lodCurveError <value>             Default: 250
r_lodScale <value>                  Default: 5
```

### Advanced Rendering
```
r_allowExtensions <0|1>             Default: 1
r_ext_compressed_textures <0|1>     Default: 1
r_ext_multitexture <0|1>            Default: 1
r_ext_texture_env_add <0|1>         Default: 1
r_ext_texture_filter_anisotropic <0|1> Default: 0
r_ext_max_anisotropy <value>        Default: 2

r_gamma <value>                     Default: 1.3 (brightness)
r_overBrightBits <0|1>              Default: 0
r_mapOverBrightBits <0-3>           Default: 2
r_intensity <0-1.5>                 Default: 1

r_fbo <0|1>                         Default: 1 (framebuffer objects)
r_flares <0|1>                      Default: 1
r_flareSize <pixels>                Default: 40

r_textureMode <mode>                Default: GL_LINEAR_MIPMAP_NEAREST
r_fastSky <0|1>                     Default: 0
r_drawSun <0|1>                     Default: 1
r_facePlaneCull <0|1>               Default: 1
```

### Debug Rendering
```
r_showImages <0|1>                  Default: 0
r_debugLight <0|1>                  Default: 0
r_speeds <0|1>                      Default: 0
r_showTris <0|1>                    Default: 0
r_drawWorld <0|1>                   Default: 1
r_lightMap <0|1>                    Default: 0
r_portalOnly <0|1>                  Default: 0
```

---

## User Profile & Settings

### Player Profile
```
name <player-name>                  Default: UnnamedPlayer
cl_profile <profile-name>           Default: (auto-detected)
cl_defaultProfile <profile>         Default: (empty)
password <password>                 Default: (empty, for password-protected servers)
```

**Example: Set your player name**
```
name "MyNickname"
```

### Gameplay Preferences
```
cg_autoactivate <0|1>               Default: 1 (auto-use items)
cg_predictItems <0|1>               Default: 1
cg_optimizePrediction <0|1>         Default: 1
```

---

## Download & Content Management

### Server File Handling
```
cl_allowDownload <0|1>              Default: 1
cl_wwwDownload <0|1>                Default: 1 (download from web)
cl_maxPing <milliseconds>           Default: 800
```

---

## Testing & Development

### Performance & Debug
```
developer <0|1>                     Default: 0 (developer mode)
timescale <speed>                   Default: 1 (play speed)
cl_shownet <0-3>                    Default: 0
              0 = off
              1 = incoming packets
              2 = +outgoing packets
              3 = +packet fragmentation

cl_showSend <0|1>                   Default: 0
cl_showTimeDelta <0|1>              Default: 0
cl_packetloss <0-100>               Default: 0 (simulate loss %)
cl_packetdelay <ms>                 Default: 0 (simulate delay)
```

---

## Complete Client Configuration Examples

### Competitive Online Configuration
```
// Network
rate 25000
snaps 25
cl_maxpackets 125
cl_timeNudge 0

// Mouse
sensitivity 3.5
m_pitch 0.022
m_yaw 0.022
m_filter 0
cl_mouseAccel 0

// Weapons
cg_useWeapsForZoom 1
cg_scopedSensitivityScaler 0.5
cg_weapzoomFov 60
cg_autoswitch 2
cg_autoReload 1
cg_weapaltSwitches 1

// Crosshair
cg_useCvarCrosshair 1
cg_crosshairSize 52
cg_crosshairColor "Yellow"
cg_crosshairHealth 1

// HUD
cg_draw2D 1
cg_drawGun 1
cg_drawEnvAwareness 7
cg_drawSpectatorNames 2

// Graphics
cg_shadows 1
cg_dynamicLight 0
cg_fov 100
cg_gibs 0
cg_showblood 0

// Audio
cg_hitSounds 1
cg_announcer 1

// Player
name "CompetitivePlayer"
```

### Casual/Fun Configuration
```
// Network
rate 20000
snaps 20
cl_maxpackets 125

// Mouse
sensitivity 6
m_filter 1

// Weapons
cg_autoswitch 1
cg_noAmmoAutoSwitch 1
cg_autoReload 1

// Crosshair
cg_useCvarCrosshair 1
cg_crosshairSize 48
cg_crosshairColor "Green"
cg_crosshairPulse 1

// HUD
cg_draw2D 1
cg_drawGun 1
cg_centertime 5

// Graphics
cg_shadows 1
cg_dynamicLight 1
cg_gibs 1
cg_showblood 1
cg_tracers 1
cg_coronas 1

// Audio
cg_hitSounds 1
cg_announcer 1
cg_voiceChats 1

// Player
name "CasualPlayer"
```

### High-Performance Configuration (Low-End PC)
```
// Network
rate 10000
snaps 20
cl_maxpackets 60
cl_packetdup 2

// Graphics - Minimal
cg_shadows 0
cg_dynamicLight 0
cg_gibs 0
cg_showblood 0
cg_tracers 0
cg_coronas 0
cg_visualEffects 0
r_picmip 2
r_detailtextures 0

// Rendering
r_overBrightBits 0
r_mapOverBrightBits 0
r_allowExtensions 0

// Mouse
sensitivity 4
m_filter 0

// Weapons
cg_autoswitch 2
cg_muzzleFlash 0

// Player
name "LowEndPlayer"
```

### Demo Recording Configuration
```
// Recording settings
cl_autorecord 1
cl_demofilename "match"
cl_aviFrameRate 30

// Visual clarity for commentary
cg_drawEnvAwareness 7
cg_drawGun 1
cg_draw2D 1

// Smooth playback
cg_shadows 1
cg_dynamicLight 1
r_allowExtensions 1

// Demo-specific
demo_followDistance "100 0 30"
demo_freecamspeed 600
```

---

## Common Troubleshooting

### Lag or High Ping Issues
```
cl_maxpackets 60          (reduce from 125)
cl_packetdup 2            (increase from 1)
cl_extrapolationMargin 2  (increase from 1)
```

### Mouse Feeling Sluggish
```
m_filter 0                (turn off smoothing)
cl_mouseAccel 0           (disable acceleration)
sensitivity 5             (increase value)
```

### Jittery Movement
```
cl_interpolation 1        (enable light smoothing)
pmove_fixed 1             (server-side setting, ask admin)
```

### FPS Drops / Performance
```
cg_dynamicLight 0
cg_shadows 0
cg_gibs 0
cg_visualEffects 0
r_picmip 2
r_allowExtensions 0
```

---

## Default Controls Reference
```
Mouse 1        Primary Fire
Mouse 2        Alternate Fire
Mouse Wheel    Previous/Next Weapon
W / A / S / D  Movement (WASD)
Space          Jump / Climb
C              Crouch / Prone
V              Zoom / Scope
E              Use / Activate
Tab            Scores / Objectives
T              Team Chat
Y              Global Chat
```

---

## Tips for Optimization

1. **Network**: Set `rate` to your connection speed (ask your ISP if unsure)
2. **Mouse**: Disable `m_filter` and `cl_mouseAccel` for responsiveness
3. **Scoped**: Reduce `cg_scopedSensitivityScaler` to 0.4-0.5 for control
4. **Ping**: Use `cl_timeNudge` to adjust for your latency (test -5 to +5)
5. **Demos**: Set `cl_autorecord 1` to record all matches automatically
6. **FOV**: Try 100-110 for better peripheral vision (non-competitive only)

---

## Related Console Commands

- `showscores` - Display scoreboard
- `kill` - Kill yourself (team respawn)
- `callvote <type>` - Call a vote
- `clientinfo` - Show your player settings
- `record <demoname>` - Start demo recording
- `stop` - Stop demo/AVI recording
- `playdemo <demoname>` - Play a recorded demo
- `screenshot` - Take a screenshot
- `bind <key> <command>` - Bind key to command
- `unbind <key>` - Unbind a key
