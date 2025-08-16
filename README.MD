# Twitch Chat Overlay

A lightweight Node.js application to display Twitch chat messages as an overlay for programs such as OBS, with customizable fonts, message duration, and viewport height. Messages appear in styled squircle boxes, with support for Twitch emotes and user-specific colors.

## Features
- **Real-Time Twitch Chat**: Connects to a specified Twitch channel (e.g., `melechtna_antelecht`) and displays messages in real time.
- **Custom Fonts**: Supports custom fonts for usernames and messages, loaded from a local `fonts/` folder (e.g., `Bagnard.otf`) or system fonts like Arial.
- **Squircle Styling**: Messages appear in semi-transparent, rounded rectangles (squircles) for a modern look.
- **Configurable Display**:
  - Set viewport height to match your OBS or other softwares browser source.
  - Control how long messages stay visible.
  - Run on a custom port for flexibility.
- **Emote Support**: Renders Twitch emotes inline with messages.
- **OBS Integration**: Designed for OBS or similar softwares Browser Source, with smooth animations and overflow handling.

## Prerequisites
- **Node.js**: Version 18 or higher (download from [nodejs.org](https://nodejs.org) or in your distro's repositories where applicable).
- **npm**: Comes with Node.js.
- **OBS Studio or similar**: For displaying the overlay, though you can load this easily in a web browser as well.
- **Twitch Account**: A valid Twitch channel name for chat connection.
- **Fonts**: Place `.otf`, `.ttf`, `.woff`, or `.woff2` font files in a `fonts/` folder in the project directory (optional, defaults to Arial).

## Installation
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/twitch-chat-overlay.git
   cd twitch-chat-overlay-local
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Fonts** (Optional):
   - Create a `fonts/` folder in the project directory:
     ```bash
     mkdir fonts
     ```
   - Add font files (e.g., `Font.otf`) to `~/twitch-chat-overlay-local/fonts/`.
   - Fonts must match the names used with `-f` and `-n` flags (case-insensitive).

4. **Verify Project Structure**:
   ```
   twitch-chat-overlay/
   ├── index.js
   ├── package.json
   ├── public/
   │   ├── index.html
   │   ├── styles.css
   ├── fonts/
   │   ├── Font.otf (or your custom fonts)
   ```

## Usage
Run the overlay with `node index.js` and specify options via command-line flags.

### Command
```bash
node index.js -u <twitch-username> -v <height> -p <port> -f <message-font> -n <username-font> -s <seconds>
```

### Flags
| Flag | Alias | Description | Type | Default | Required |
|------|-------|-------------|------|---------|----------|
| `--port` | `-p` | Port to run the server on | Number | 3005 | No |
| `--username` | `-u` | Twitch channel username (e.g., `melechtna_antelecht`) | String | None | Yes |
| `--height` | `-v` | Viewport height in pixels (Browser Source overlay height) | Number | None | Yes |
| `--seconds` | `-s` | Seconds each message stays visible | Number | 10 | No |
| `--font` | `-f` | Font for message text (e.g., `Bagnard`, `Arial`) | String | Arial | No |
| `--namefont` | `-n` | Font for usernames (e.g., `Bagnard`, `Arial`) | String | Arial | No |
| `--help` | `-h` | Show help | Boolean | - | No |

### Example
Run the overlay for `melechtna_antelecht` with a 400px height, 30-second message duration, and `Font` font for both messages and usernames on port 3006:
```bash
node index.js -u melechtna_antelecht -v 400 -p 3006 -f Font -n Font2 -s 30
```

Example output:
```
Available fonts: font, font2
Validating font: font, namefont: font2
Server settings: port=3006, channel=melechtna_antelecht, height=400, seconds=30, messageFont=Bagnard, namefont=Bagnard
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
Contributions are welcome! The project runs with `node index.js`, but compiling to a standalone binary (e.g., using `pkg`) is untested and may have issues with asset serving (e.g., `styles.css` not loading). If you’d like to tackle binary compilation, please submit a pull request with instructions.

## License
MIT License. Fonts in `fonts/` are not included—users must provide their own to avoid licensing issues.
