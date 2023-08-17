
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');

const app = express();
const PORT = process.env.PORT || 8081;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/icons', express.static(path.join(__dirname, 'icons')));
app.use(express.static(__dirname));

const os = require('os');
const ifaces = os.networkInterfaces();
let serverIP = null;

Object.keys(ifaces).forEach(ifname => {
  ifaces[ifname].forEach(iface => {
    if (iface.family === 'IPv4' && !iface.internal) {
      serverIP = iface.address;
    }
  });
});

if (!serverIP) {
  console.error('No se pudo detectar la dirección IP local del servidor.');
  process.exit(1);
}

console.log(`Dirección IP local del servidor: ${serverIP}`);

// Conexión a la base de datos SQLite
const db = new sqlite3.Database('channels.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Conexión a la base de datos SQLite exitosa.');
    db.run(`CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      url TEXT,
      icon TEXT
    )`, (err) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log('Tabla de canales creada.');
        
        // Check if channels are already inserted
        const checkQuery = 'SELECT COUNT(*) AS count FROM channels';

        db.get(checkQuery, [], (err, row) => {
          if (err) {
            console.error(err.message);
          } else {
            if (row.count === 0) {
              insertStaticChannels();
            }
          }
        });
      }
    });
  }
});

// Datos simulados de canales
const channels = [
  {
    id: 1,
    name: 'Discovery',
    description: 'Discovery Channel en español',
    url: 'https://www.twitch.tv/dt_yy83',
    icon: `http://${serverIP}:${PORT}/icons/discovery.png`,
  },
  {
    id: 2,
    name: 'HBO 2',
    description: 'HBO2 en español',
    url: 'https://www.twitch.tv/daxtr5gtx',
    icon: `http://${serverIP}:${PORT}/icons/hbo2.png`,
  },
  {
    id: 3,
    name: 'History',
    description: 'History Channel en español',
    url: 'https://www.twitch.tv/vdt_5ltt',
    icon: `http://${serverIP}:${PORT}/icons/history.png`,
  },
  {
    id: 4,
    name: 'History 2',
    description: 'History Channel 2 en español',
    url: 'https://www.twitch.tv/rr_955rrr',
    icon: `http://${serverIP}:${PORT}/icons/history.png`,
  },
];

// Endpoint para obtener la lista de canales desde la base de datos
app.get('/channels', (req, res) => {
  const selectQuery = 'SELECT * FROM channels';

  db.all(selectQuery, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Error al obtener la lista de canales' });
    } else {
      res.status(200).json(rows);
    }
  });
});

// Endpoint para obtener un canal por su ID
app.get('/channel', (req, res) => {
  const channelId = parseInt(req.query.id);

  if (!isNaN(channelId)) {
    const channel = channels.find(c => c.id === channelId);

    if (channel) {
      res.json(channel);
      console.log('Obteniendo datos del canal: ' + channelId);
    } else {
      res.status(404).json({ error: 'Canal no encontrado' });
    }
  } else {
    res.status(400).json({ error: 'ID de canal inválido' });
  }
});

// Endpoint para agregar un nuevo canal a la base de datos
app.post('/addChannel', (req, res) => {
  const { name, description, url, icon } = req.body;
  const insertQuery = 'INSERT INTO channels (name, description, url, icon) VALUES (?, ?, ?, ?)';
  const values = [name, description, url, icon];

  db.run(insertQuery, values, function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Error al agregar el canal' });
    } else {
      console.log(`Agregado canal con ID: ${this.lastID}`);
      res.redirect('/addChannel'); // Redirige a la página del formulario
    }
  });
});

// Endpoint para editar un canal existente
app.put('/editChannel/:id', (req, res) => {
  const channelId = req.params.id;
  const { name, description, url, icon } = req.body;
  const updateQuery = 'UPDATE channels SET name = ?, description = ?, url = ?, icon = ? WHERE id = ?';
  const values = [name, description, url, icon, channelId];

  db.run(updateQuery, values, function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Error al editar el canal' });
    } else {
      console.log(`Editado canal con ID: ${channelId}`);
      res.status(200).json({ message: 'Canal editado exitosamente' });
    }
  });
});

// Endpoint para eliminar un canal por su ID
app.delete('/deleteChannel/:id', (req, res) => {
  const channelId = req.params.id;
  const deleteQuery = 'DELETE FROM channels WHERE id = ?';

  db.run(deleteQuery, [channelId], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Error al eliminar el canal' });
    } else {
      console.log(`Eliminado canal con ID: ${channelId}`);
      res.status(200).json({ message: 'Canal eliminado exitosamente' });
    }
  });
});

// Function to insert static channels
function insertStaticChannels() {
  const insertStaticPromises = channels.map(channel => {
    return new Promise((resolve, reject) => {
      const insertQuery = 'INSERT INTO channels (name, description, url, icon) VALUES (?, ?, ?, ?)';
      const values = [channel.name, channel.description, channel.url, channel.icon];
      
      db.run(insertQuery, values, function (err) {
        if (err) {
          console.error(err.message);
          reject(err);
        } else {
          console.log(`Agregado canal estático con ID: ${this.lastID}`);
          resolve(this.lastID);
        }
      });
    });
  });

  Promise.all(insertStaticPromises)
    .then(() => {
      console.log('Canales estáticos insertados en la base de datos.');
    })
    .catch(err => {
      console.error('Error al insertar canales estáticos:', err);
    });
}

app.listen(PORT, () => {
  console.log(`El servidor está funcionando en el puerto ${PORT}`);
});
