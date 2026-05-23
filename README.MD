
# Twitch Chat Overlay

A lightweight Node.js application to display Twitch chat messages as an overlay for programs such as OBS, with customizable fonts, message duration, and viewport height. Messages appear in styled squircle boxes, with support for Twitch emotes and user-specific colors.

## Features
- **Real-Time Twitch Chat**: Connects to a specified Twitch channel (e.g., `melechtna_antelecht`) and displays messages in real time.
- **Custom Styling**: Allows full replacement of both fonts and styling via override folder
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
- **Customisation**: Add anything you could like to an override folder, only requirement is either index.html and/or style.css (optional, defaults baked into executable).

## Installation
1. **Download executable**

2. **Set override** (Optional):
   - Create an `override/` folder next to the executable:
     ```bash
     mkdir override
     ```
   - Add index.html, style.css, fonts, images, whatever you would like, the executable will pickup and use what index.html points to (use the defaults as reference), keep in mind if you get these from others, they can potentially put malicious code in the HTML/JS. The css loads dynamically, so you can make adjustments without needing to refresh the browser, adjustments to the html will require a refresh.

## Usage
Run the overlay with the relavent executable and specify options via command-line flags.

### Command
```bash
twitch-chat-overlay-local(.exe) -u <twitch-username> -v <height> -p <port> -s <seconds> -d
```

### Flags
| Flag | Alias | Description | Type | Default | Required |
|------|-------|-------------|------|---------|----------|
| `--port` | `-p` | Port to run the server on | Number | 3005 | No |
| `--username` | `-u` | Twitch channel username (e.g., `melechtna_antelecht`) | String | None | Yes* |
| `--height` | `-v` | Viewport height in pixels (Browser Source overlay height) | Number | None | Yes |
| `--seconds` | `-s` | Seconds each message stays visible | Number | 10 | No |
| `--debug` | `-d` | Mode to send test messages without twitch | Boolean | Internal | No |
| `--help` | `-h` | Show help | Boolean | - | No |

*Username is not required when using the debug flag

### Example
Run the overlay for `melechtna_antelecht` with a 400px height, and 30-second message duration on port 3006:
```bash
twitch-chat-overloat-local -u melechtna_antelecht -v 400 -p 3006 -s 30
```

Example output:
```
Available fonts: font, font2
Validating font: font, namefont: font2
Server settings: port=3006, channel=melechtna_antelecht, height=400, seconds=30, messageFont=font, namefont=font2
Chat overlay at http://localhost:3006
```

### Debug Example
This mode allows you to test out your override without needing an internet connection.

```bash
twitch-chat-overloat-local -v 400 -p 3006 -d
```

Example output:
```
Server settings: port=30005, channel=undefined, height=500, seconds=30
Debug mode enabled — Twitch connection skipped.
Chat overlay at http://localhost:30005
Enter dummy username: test
> hi
>
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
