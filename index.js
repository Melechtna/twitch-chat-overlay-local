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
    default: 10
  })
  .option('font', {
    alias: 'f',
    type: 'string',
    description: 'Font for message text',
    default: 'Arial'
  })
  .option('namefont', {
    alias: 'n',
    type: 'string',
    description: 'Font for usernames',
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
    // Font validation
    const fontsDir = path.join(__dirname, 'fonts');
    if (fs.existsSync(fontsDir)) {
      const fontFiles = fs.readdirSync(fontsDir).filter(f => /\.(ttf|otf|woff|woff2)$/i.test(f));
      const fontNames = fontFiles.map(f => path.basename(f, path.extname(f)).toLowerCase());
      console.log(`Available fonts: ${fontNames.join(', ')}`);
      const font = typeof argv.font === 'string' ? argv.font.toLowerCase() : 'arial';
      const namefont = typeof argv.namefont === 'string' ? argv.namefont.toLowerCase() : 'arial';
      console.log(`Validating font: ${font}, namefont: ${namefont}`);
      if (!fontNames.includes(font) && font !== 'arial') {
        errors.push(`Font "${argv.font}" not found in fonts/ folder. Available fonts: ${fontNames.join(', ')} or system fonts`);
      }
      if (!fontNames.includes(namefont) && namefont !== 'arial') {
        errors.push(`Font "${argv.namefont}" not found in fonts/ folder. Available fonts: ${fontNames.join(', ')} or system fonts`);
      }
    }
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
app.use(express.static('public'));

// Serve fonts folder with correct MIME types
const fontsDir = path.join(__dirname, 'fonts');
if (fs.existsSync(fontsDir)) {
  app.get('/fonts/:font', (req, res) => {
    const fontPath = path.join(fontsDir, req.params.font);
    const ext = path.extname(fontPath).toLowerCase();
    const mimeTypes = {
      '.ttf': 'font/ttf',
      '.otf': 'font/otf',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2'
    };
    if (fs.existsSync(fontPath) && mimeTypes[ext]) {
      res.set('Content-Type', mimeTypes[ext]);
      fs.createReadStream(fontPath).pipe(res);
    } else {
      res.status(404).send('Font not found');
    }
  });
}

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

// Serve overlay
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Emit settings to client
io.on('connection', (socket) => {
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
