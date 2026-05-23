const express   = require('express');
const http      = require('http');
const socketIo  = require('socket.io');
const tmi       = require('tmi.js');
const yargs     = require('yargs');
const path      = require('path');
const fs        = require('fs');
const readline  = require('readline');

const app    = express();
const server = http.createServer(app);
const io     = socketIo(server);


// UI (HTML/CSS/JS) is bundled inside the binary → use __dirname
const publicDir = path.join(__dirname, 'public');

const overrideDir = path.join(
  process.pkg ? path.dirname(process.execPath) : __dirname,
  'override'
);

app.use((req, res, next) => {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' https://static-cdn.jtvnw.net https://cdn.jtvnw.net",
    "connect-src 'self' ws:"
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);
  next();
});


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
  description: 'Twitch channel username (not required in debug mode)'
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
.option('debug', {
  alias: 'd',
  type: 'boolean',
  description: 'Debug mode: inject test messages via CLI instead of connecting to Twitch',
  default: false
})
.check((argv) => {
  const errors = [];

  if (argv.port < 1 || argv.port > 65535) {
    errors.push('Port must be between 1 and 65535');
  }
  if (!argv.debug && (!argv.username || !/^[a-zA-Z0-9_]{3,25}$/.test(argv.username))) {
    errors.push('Username must be a valid Twitch channel name (3-25 alphanumeric characters or underscores)');
  }
  if (argv.height < 100 || argv.height > 2160) {
    errors.push('Height must be between 100 and 2160 pixels');
  }
  if (argv.seconds <= 0) {
    errors.push('Seconds must be a positive number');
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
  return true;
})
.help()
.argv;


const port          = argv.port;
const channel       = argv.username;
const viewportHeight = argv.height;
const messageSeconds = argv.seconds;
console.log(`Server settings: port=${port}, channel=${channel}, height=${viewportHeight}, seconds=${messageSeconds}`);

if (fs.existsSync(overrideDir)) {
  console.log(`Override directory detected: ${overrideDir}`);
}


const noCache = (res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
};

app.get('/styles.css', (req, res) => {
  noCache(res);
  const overridePath = path.join(overrideDir, 'style.css');
  if (fs.existsSync(overridePath)) {
    if (!argv.debug) console.log('Requested styles.css (override)');
    return res.sendFile(overridePath);
  }
  if (!argv.debug) console.log('Requested styles.css (default)');
  res.sendFile(path.join(publicDir, 'styles.css'));
});


app.get('/', (req, res) => {
  noCache(res);
  const overridePath = path.join(overrideDir, 'index.html');
  if (fs.existsSync(overridePath)) {
    if (!argv.debug) console.log(`Serving overlay (override): ${overridePath}`);
    return res.sendFile(overridePath);
  }
  const indexPath = path.join(publicDir, 'index.html');
  if (!argv.debug) console.log(`Serving overlay (default): ${indexPath}`);
  res.sendFile(indexPath);
});


// Override files take priority over bundled UI
app.use(express.static(overrideDir));

// UI files (bundled inside the binary)
app.use(express.static(publicDir));


io.on('connection', (socket) => {
  if (!argv.debug) {
    console.log('Socket.IO client connected:', socket.id);
  }
  socket.emit('settings', {
    viewportHeight,
    messageSeconds
  });
});


if (argv.debug) {
  console.log('Debug mode enabled \u2014 Twitch connection skipped.');
} else {
  const client = new tmi.Client({
    connection: { secure: true, reconnect: true },
    channels: [channel]
  });

  client.connect().catch(console.error);

  client.on('message', (chan, tags, message, self) => {
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
      message,
      color: tags.color || '#ffffff',
      emotes
    });
  });
}


server.listen(port, () => {
  console.log(`Chat overlay at http://localhost:${port}`);

  if (fs.existsSync(overrideDir)) {
    const watchedFiles = ['style.css', 'index.html'];
    const mtimes = {};
    for (const file of watchedFiles) {
      const fp = path.join(overrideDir, file);
      if (fs.existsSync(fp)) mtimes[file] = fs.statSync(fp).mtimeMs;
    }
    setInterval(() => {
      for (const file of watchedFiles) {
        const fp = path.join(overrideDir, file);
        if (fs.existsSync(fp)) {
          const mtime = fs.statSync(fp).mtimeMs;
          if (mtimes[file] !== undefined && mtime !== mtimes[file]) {
            if (!argv.debug) console.log(`Override file changed: ${file}`);
            io.emit('fileChanged', { file });
          }
          mtimes[file] = mtime;
        }
      }
    }, 2000);
  }

  if (argv.debug) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Enter dummy username: ', (dummyUsername) => {
      dummyUsername = dummyUsername || 'TestUser';

      const randomColor = () => {
        const hue = Math.floor(Math.random() * 360);
        return `hsl(${hue}, 75%, 55%)`;
      };

      rl.setPrompt('> ');
      rl.prompt();

      rl.on('line', (line) => {
        const trimmed = line.trim();
        if (trimmed.toLowerCase() === '/exit' || trimmed.toLowerCase() === '/quit') {
          rl.close();
          return;
        }

        io.emit('chatMessage', {
          username: dummyUsername,
          message: trimmed,
          color: randomColor(),
          emotes: []
        });
        rl.prompt();
      });

      rl.on('close', () => {
        console.log('\nExiting debug mode.');
        process.exit(0);
      });
    });
  }
});
