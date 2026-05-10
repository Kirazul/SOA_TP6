/**
 * database.js — Initialisation de RxDB avec stockage en mémoire.
 *
 * Stratégie de persistance :
 *   - RxDB utilise un stockage en mémoire (getRxStorageMemory) pour les performances.
 *   - Un snapshot JSON est sauvegardé sur disque (data/*.snapshot.json) après chaque
 *     écriture et rechargé au démarrage, assurant la durabilité entre les redémarrages.
 */

const fs = require('fs/promises');
const path = require('path');
const { createHash, randomUUID } = require('crypto');
const { createRxDatabase } = require('rxdb');
const { getRxStorageMemory } = require('rxdb/plugins/storage-memory');
const { wrappedValidateAjvStorage } = require('rxdb/plugins/validate-ajv');

const userSchema = require('../models/userSchema');
const deviceSchema = require('../models/deviceSchema');

// ─── Chemins des snapshots ────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const USERS_SNAPSHOT = path.join(DATA_DIR, 'users.snapshot.json');
const DEVICES_SNAPSHOT = path.join(DATA_DIR, 'devices.snapshot.json');

// ─── Fonction de hachage requise par RxDB ────────────────────────────────────
async function hashFunction(input) {
  if (input instanceof ArrayBuffer) input = Buffer.from(input);
  if (typeof Blob !== 'undefined' && input instanceof Blob) {
    input = Buffer.from(await input.arrayBuffer());
  }
  if (!Buffer.isBuffer(input)) input = Buffer.from(String(input));
  return createHash('sha256').update(input).digest('hex');
}

// ─── Helpers snapshot ────────────────────────────────────────────────────────
async function loadSnapshot(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function saveSnapshot(filePath, collection) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const docs = await collection.find().exec();
  const data = docs.map((doc) => doc.toJSON());
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ─── Fonctions de persistance exposées ───────────────────────────────────────
async function persistUsers(usersCollection) {
  await saveSnapshot(USERS_SNAPSHOT, usersCollection);
}

async function persistDevices(devicesCollection) {
  await saveSnapshot(DEVICES_SNAPSHOT, devicesCollection);
}

// ─── Initialisation de la base ───────────────────────────────────────────────
async function initDatabase() {
  const storage = wrappedValidateAjvStorage({
    storage: getRxStorageMemory()
  });

  const db = await createRxDatabase({
    name: 'tp6-rxdb-memory',
    storage,
    eventReduce: true,
    multiInstance: false,
    hashFunction
  });

  await db.addCollections({
    users: { schema: userSchema },
    devices: { schema: deviceSchema }
  });

  // Restaurer les données depuis les snapshots
  const [savedUsers, savedDevices] = await Promise.all([
    loadSnapshot(USERS_SNAPSHOT),
    loadSnapshot(DEVICES_SNAPSHOT)
  ]);

  if (savedUsers.length > 0) await db.users.bulkInsert(savedUsers);
  if (savedDevices.length > 0) await db.devices.bulkInsert(savedDevices);

  console.log(
    `[DB] Base initialisée — ${savedUsers.length} user(s), ${savedDevices.length} device(s) restauré(s).`
  );

  return {
    db,
    users: db.users,
    devices: db.devices,
    persistUsers,
    persistDevices,
    createId: () => randomUUID()
  };
}

// Singleton : la promesse est partagée dans toute l'application
module.exports = initDatabase();
