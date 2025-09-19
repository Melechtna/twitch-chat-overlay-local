const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const tmi = require('tmi.js');
const yargs = require('yargs');
const getSystemFonts = require('get-system-fonts');
const path = require('path');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Use the directory of the executable for fonts/
const publicDir = path.join(__dirname, 'public');
const fontsDir = path.join(path.dirname(process.execPath), 'fonts');

// Set Content-Security-Policy to allow inline scripts/styles and local resources
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self'; connect-src 'self' ws:");
  next();
});

// Parse command-line arguments
const argv = yargs
.option('port', {
  alias: 'p',
  type: 'number',
  description: 'Port to run the server on',
  default: 3005
})
.option('username', {
  alias: 'u',
  type: 'string',
  description: 'Twitch channel username',
  demandOption: true
})
.option('height', {
  alias: 'v',
  type: 'number',
  description: 'Viewport height in pixels, set to your intended OBS overlay size in height',
  demandOption: true
})
.option('seconds', {
  alias: 's',
  type: 'number',
  description: 'Seconds each message stays visible',
  default: 30
})
.option('font', {
  alias: 'f',
  type: 'string',
  description: 'Font for message text (name in fonts/ folder)',
  default: 'Arial'
})
.option('namefont', {
  alias: 'n',
  type: 'string',
  description: 'Font for usernames (name in fonts/ folder)',
  default: 'Arial'
})
.check((argv) => {
  const errors = [];
  if (argv.port < 1 || argv.port > 65535) {
    errors.push('Port must be between 1 and 65535');
  }
  if (!argv.username || !/^[a-zA-Z0-9_]{3,25}$/.test(argv.username)) {
    errors.push('Username must be a valid Twitch channel name (3-25 alphanumeric characters or underscores)');
  }
  if (argv.height < 100 || argv.height > 2160) {
    errors.push('Height must be between 100 and 2160 pixels');
  }
  if (argv.seconds <= 0) {
    errors.push('Seconds must be a positive number');
  }

  // Font validation (log warnings, don't throw)
  const validateFont = (font, type) => {
    if (font === 'Arial') return true;
    console.log(`Checking fonts directory: ${fontsDir}`);
    if (fs.existsSync(fontsDir)) {
      const fontFiles = fs.readdirSync(fontsDir).filter(f => /\.(ttf|otf|woff|woff2)$/i.test(f));
      const fontNames = fontFiles.map(f => path.basename(f, path.extname(f)));
      console.log(`Available fonts in fonts/: ${fontNames.join(', ')}`);
      if (!fontNames.some(name => name.toLowerCase() === font.toLowerCase())) {
        console.error(`${type} "${font}" not found in fonts/ folder. Falling back to Arial. Available fonts: ${fontNames.join(', ') || 'none'}`);
        return false;
      }
      return true;
    } else {
      console.error(`${type} "${font}" not found and fonts/ directory does not exist at ${fontsDir}. Falling back to Arial.`);
      return false;
    }
  };

  const fontValid = validateFont(argv.font, 'Font');
  const namefontValid = validateFont(argv.namefont, 'Namefont');

  // Override with Arial if invalid
  argv.font = fontValid ? argv.font : 'Arial';
  argv.namefont = namefontValid ? argv.namefont : 'Arial';

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
  return true;
})
.help()
.argv;

const port = argv.port || 3005;
const channel = argv.username;
const viewportHeight = argv.height;
const messageSeconds = argv.seconds;
const messageFont = argv.font;
const namefont = argv.namefont;
console.log(`Server settings: port=${port}, channel=${channel}, height=${viewportHeight}, seconds=${messageSeconds}, messageFont=${messageFont}, namefont=${namefont}`);

// Serve static files
app.use(express.static(publicDir));

// Debug route for styles.css
app.get('/styles.css', (req, res) => {
  console.log('Requested styles.css');
  res.sendFile(path.join(publicDir, 'styles.css'));
});

// Serve fonts
app.get('/fonts/:font', (req, res) => {
  let fontName = req.params.font;
  console.log(`Requested font: ${fontName}`);

  // Strip extension if present
  const fontExt = path.extname(fontName).toLowerCase();
  if (['.ttf', '.otf', '.woff', '.woff2'].includes(fontExt)) {
    fontName = path.basename(fontName, fontExt);
    console.log(`Stripped extension, font name: ${fontName}`);
  }

  const extensions = ['.ttf', '.otf', '.woff', '.woff2'];
  let fontPath = null;

  // Try each extension, case-insensitive
  for (const ext of extensions) {
    const possiblePath = path.join(fontsDir, fontName + ext);
    console.log(`Checking font path: ${possiblePath}`);
    if (fs.existsSync(possiblePath)) {
      fontPath = possiblePath;
      break;
    }
    // Check case-insensitive match
    const files = fs.existsSync(fontsDir) ? fs.readdirSync(fontsDir) : [];
    const matchingFile = files.find(f => f.toLowerCase() === (fontName + ext).toLowerCase());
    if (matchingFile) {
      fontPath = path.join(fontsDir, matchingFile);
      break;
    }
  }

  if (fontPath) {
    const ext = path.extname(fontPath).toLowerCase();
    const mimeTypes = {
      '.ttf': 'font/ttf',
      '.otf': 'font/otf',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2'
    };
    res.set('Content-Type', mimeTypes[ext]);
    console.log(`Serving font: ${fontPath}`);
    fs.createReadStream(fontPath).pipe(res);
  } else {
    console.error(`Font not found: ${fontName} in ${fontsDir}`);
    res.status(404).send('Font not found');
  }
});

// Serve overlay
app.get('/', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  console.log(`Serving overlay: ${indexPath}`);
  res.sendFile(indexPath);
});

// Twitch chat client
const client = new tmi.Client({
  connection: { secure: true, reconnect: true },
  channels: [channel]
});

// Connect to Twitch
client.connect().catch(console.error);

// Handle chat messages
client.on('message', (channel, tags, message, self) => {
  const emotes = [];
  if (tags.emotes) {
    for (const emoteId in tags.emotes) {
      tags.emotes[emoteId].forEach(position => {
        const [start, end] = position.split('-').map(Number);
        emotes.push({ id: emoteId, start, end });
      });
    }
  }
  io.emit('chatMessage', {
    username: tags['display-name'] || 'Anonymous',
    message: message,
    color: tags.color || '#ffffff',
    emotes: emotes
  });
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Socket.IO client connected:', socket.id);
  socket.emit('settings', {
    viewportHeight,
    messageSeconds,
    messageFont,
    namefont
  });
});

// Start server
server.listen(port, () => {
  console.log(`Chat overlay at http://localhost:${port}`);
});
