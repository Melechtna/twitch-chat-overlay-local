# Twitch Chat Overlay

A lightweight Node.js application to display Twitch chat messages as an overlay for programs such as OBS, with customizable fonts, message duration, and viewport height. Messages appear in styled squircle boxes, with support for Twitch emotes and user-specific colors.

## Features
- **Real-Time Twitch Chat**: Connects to a specified Twitch channel (e.g., `melechtna_antelecht`) and displays messages in real time.
- **Custom Fonts**: Supports custom fonts for usernames and messages, loaded from a local `fonts/` folder (e.g., `Font.otf`) or system fonts like Arial.
- **Squircle Styling**: Messages appear in semi-transparent, rounded rectangles (squircles) for a modern look.
- **Configurable Display**:
  - Set viewport height to match your OBS or other softwares browser source.
  - Control how long messages stay visible.
  - Run on a custom port for flexibility.
- **Emote Support**: Renders Twitch emotes inline with messages.
- **OBS Integration**: Designed for OBS or similar softwares Browser Source, with smooth animations and overflow handling.

## Prerequisites
- **OBS Studio or similar**: For displaying the overlay, though you can load this easily in a web browser as well.
- **Twitch Account**: A valid Twitch channel name for chat connection.
- **Fonts**: Place `.otf`, `.ttf`, `.woff`, or `.woff2` font files in a `fonts/` folder next to the executable (optional, defaults to Arial).

## Installation
1. **Download executable**

2. **Set Up Fonts** (Optional):
   - Create a `fonts/` folder next to the executable:
     ```bash
     mkdir fonts
     ```
   - Add font files (e.g., `Font.otf`) to the fonts folder.
   - Fonts must match the names used with `-f` and `-n` flags (case-insensitive).

## Usage
Run the overlay with the relavent executable and specify options via command-line flags.

### Command
```bash
twitch-chat-overlay-local(.exe) -u <twitch-username> -v <height> -p <port> -f <message-font> -n <username-font> -s <seconds>
```

### Flags
| Flag | Alias | Description | Type | Default | Required |
|------|-------|-------------|------|---------|----------|
| `--port` | `-p` | Port to run the server on | Number | 3005 | No |
| `--username` | `-u` | Twitch channel username (e.g., `melechtna_antelecht`) | String | None | Yes |
| `--height` | `-v` | Viewport height in pixels (Browser Source overlay height) | Number | None | Yes |
| `--seconds` | `-s` | Seconds each message stays visible | Number | 10 | No |
| `--font` | `-f` | Font for message text (e.g., `Font`, `Arial`) | String | Arial | No |
| `--namefont` | `-n` | Font for usernames (e.g., `Font`, `Arial`) | String | Arial | No |
| `--help` | `-h` | Show help | Boolean | - | No |

### Example
Run the overlay for `melechtna_antelecht` with a 400px height, 30-second message duration, and `Font` font for both messages and usernames on port 3006:
```bash
twitch-chat-overloat-local -u melechtna_antelecht -v 400 -p 3006 -f Font -n Font2 -s 30
```

Example output:
```
Available fonts: font, font2
Validating font: font, namefont: font2
Server settings: port=3006, channel=melechtna_antelecht, height=400, seconds=30, messageFont=font, namefont=font2
Chat overlay at http://localhost:3006
```

### OBS or Similar Setup
1. Open OBS Studio.
2. Add a Browser Source:
   - **URL**: `http://localhost:3006` (or your `-p` port).
   - **Width**: Set to your preference.
   - **Height**: Match `-v` value (e.g., 400px) to your preference.
   - Check “Refresh cache of current page” after changes.
3. Test chat on your Twitch channel (e.g., `twitch.tv/melechtna_antelecht`).
4. Messages should appear in squircle boxes with custom fonts.

## Contributing
Contributions are welcome! However at this point, unless Twitch changes something, I'm pretty sure it should just work.

## License
MIT License. Fonts in `fonts/` are not included—users must provide their own to avoid licensing issues.
