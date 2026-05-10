/**
 * server.js — Point d'entrée de l'application.
 *
 * Expose :
 *   - Une API REST sur /users et /devices
 *   - Un endpoint GraphQL sur /graphql
 *
 * Les deux interfaces partagent la même base RxDB via les services métier.
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const { buildSchema } = require('graphql');
const { createHandler } = require('graphql-http/lib/use/express');

// ─── Routes REST ─────────────────────────────────────────────────────────────
const userRoutes = require('./src/routes/userRoutes');
const deviceRoutes = require('./src/routes/deviceRoutes');

// ─── Résolveurs GraphQL ───────────────────────────────────────────────────────
const userResolver = require('./src/resolvers/userResolver');
const deviceResolver = require('./src/resolvers/deviceResolver');

// ─── Configuration ────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ─── Schéma GraphQL ───────────────────────────────────────────────────────────
const schema = buildSchema(
  fs.readFileSync(path.join(__dirname, 'src', 'schema.gql'), 'utf8')
);

// Fusion des résolveurs user et device en un seul rootValue
const rootValue = { ...userResolver, ...deviceResolver };

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(express.json());

// ─── Endpoint GraphQL ─────────────────────────────────────────────────────────
app.all('/graphql', createHandler({ schema, rootValue }));

// ─── Routes REST ──────────────────────────────────────────────────────────────
app.use('/users', userRoutes);
app.use('/devices', deviceRoutes);

// Route imbriquée : GET /users/:userId/devices
app.get('/users/:userId/devices', async (req, res) => {
  try {
    const deviceService = require('./src/services/deviceService');
    const devices = await deviceService.getDevicesByUserId(req.params.userId);
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Page d'accueil ───────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'TP6 — API REST/GraphQL avec RxDB',
    version: '1.0.0',
    rest: {
      users: {
        list:   'GET    /users',
        one:    'GET    /users/:id',
        create: 'POST   /users',
        update: 'PUT    /users/:id',
        delete: 'DELETE /users/:id'
      },
      devices: {
        list:          'GET    /devices',
        listByUser:    'GET    /users/:userId/devices',
        listFiltered:  'GET    /devices?userId=:userId',
        one:           'GET    /devices/:id',
        create:        'POST   /devices',
        update:        'PUT    /devices/:id',
        delete:        'DELETE /devices/:id'
      }
    },
    graphql: {
      endpoint: 'POST /graphql',
      queries:  ['user(id)', 'users', 'device(id)', 'devices(userId?)', 'devicesByUser(userId)'],
      mutations: ['addUser', 'updateUser', 'deleteUser', 'addDevice', 'updateDevice', 'deleteDevice']
    }
  });
});

// ─── Démarrage ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📡 GraphQL disponible sur http://localhost:${PORT}/graphql`);
  console.log(`📋 REST Users    → http://localhost:${PORT}/users`);
  console.log(`📋 REST Devices  → http://localhost:${PORT}/devices\n`);
});
