# Kanata macOS keyboard config

Mirrors the Keebart Corne layout on the MacBook built-in keyboard:

- CAGS home-row mods: A/S/D/F = Control/Option/Command/Shift, mirrored on J/K/L/;.
- Tap Caps Lock for Escape.
- Hold Caps Lock for Navigation.
- Caps+H/J/K/L = Left/Down/Up/Right.
- Caps+Q/W/E/R/T = Command+1 through Command+5.
- Caps+Y/U = Command+Shift+[ / Command+Shift+].
- Caps+I/O/P = close tab, reopen tab, and cycle windows in the current app.
- Caps+A/S and D/F = macOS line and word movement; Caps+G = Page Down.
- Caps+Z/X/C/V/B = undo, redo, copy, paste, and cut.
- Caps+; = Command+Tab application switching.
- Caps+N, M, comma, period, and slash = play/pause, previous track, next track, volume down, and volume up.
- Only `Apple Internal Keyboard / Trackpad` is captured. The Corne remains firmware-owned.

BetterTouchTool can continue to own app/window automations. It should not remap these keys.

## Install

Kanata 1.12.0 requires the standalone Karabiner DriverKit VirtualHIDDevice 6.2.0. Karabiner-Elements itself must not run alongside Kanata.

Follow this order. Karabiner-Elements' uninstaller removes its bundled driver, so installing the standalone driver before uninstalling Karabiner would immediately remove the new installation too.

1. Quit Karabiner-Elements and remove it before starting Kanata:

   ```sh
   brew uninstall --cask karabiner-elements
   ```

2. Install Kanata. It is also tracked in `~/.Brewfile`:

   ```sh
   brew install kanata
   ```

3. Download and install the signed standalone driver:

   <https://github.com/pqrs-org/Karabiner-DriverKit-VirtualHIDDevice/releases/tag/v6.2.0>

4. Activate its system extension:

   ```sh
   sudo /Applications/.Karabiner-VirtualHIDDevice-Manager.app/Contents/MacOS/Karabiner-VirtualHIDDevice-Manager forceActivate
   ```

   Then enable `org.pqrs.Karabiner-DriverKit-VirtualHIDDevice` under **System Settings → General → Login Items & Extensions → Driver Extensions**.

5. Install and verify the standalone driver daemon:

   ```sh
   sudo cp ~/.config/kanata/karabiner-vhid-daemon.plist \
     /Library/LaunchDaemons/org.pqrs.Karabiner-VirtualHIDDevice-Daemon.plist
   sudo chown root:wheel \
     /Library/LaunchDaemons/org.pqrs.Karabiner-VirtualHIDDevice-Daemon.plist
   sudo launchctl bootstrap system \
     /Library/LaunchDaemons/org.pqrs.Karabiner-VirtualHIDDevice-Daemon.plist
   sudo launchctl print system/org.pqrs.Karabiner-VirtualHIDDevice-Daemon
   ```

6. Grant `/opt/homebrew/bin/kanata` Input Monitoring and Accessibility access under **System Settings → Privacy & Security**. This command opens the Accessibility prompt:

   ```sh
   kanata --macos-request-permissions || true
   ```

   macOS Tahoe 26.2 silently rejects bare executables dragged into these lists. Upgrade to a current Tahoe release before configuring the launch service; running Kanata from an already trusted Terminal is only a temporary workaround.

7. Validate and only then start Kanata:

   ```sh
   kanata --check --cfg ~/.config/kanata/kanata.kbd
   kanata --list
   sudo brew services start kanata
   ```

Reload after config changes:

```sh
sudo brew services restart kanata
```

Emergency exit: hold Control+Space+Escape.

## Validation

- `kanata --list` reports `Apple Internal Keyboard / Trackpad` exactly.
- Corne input is unchanged when connected.
- Test `asdf`, `jkl;`, `ion`, and repeated same-hand rolls for false modifiers.
- Test opposite-hand Command, Shift, Option, and Control shortcuts.
- Test Caps tap, held arrows, Command+1/2, tab cycling, line/word motion, Page Down, close/reopen, app/window switching, edit shortcuts, media, and volume.
- Test after sleep, lock/unlock, and macOS updates.
