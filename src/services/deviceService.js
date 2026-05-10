/**
 * deviceService.js — Logique métier pour la ressource Device.
 *
 * Règles métier :
 *   - Un device ne peut pas exister sans un utilisateur valide (composition).
 *   - Le serialNumber doit être unique dans la collection.
 *   - La suppression d'un user entraîne la suppression de ses devices
 *     (gérée dans userService.deleteUser).
 */

const dbPromise = require('../db/database');

// ─── Helpers internes ────────────────────────────────────────────────────────

function toJson(doc) {
  return doc ? doc.toJSON() : null;
}

const VALID_TYPES = ['laptop', 'smartphone', 'tablet', 'server'];
const VALID_STATUSES = ['active', 'inactive', 'maintenance'];

function validateDeviceFields({ type, status }) {
  if (type && !VALID_TYPES.includes(type)) {
    throw new Error(`Type invalide. Valeurs acceptées : ${VALID_TYPES.join(', ')}`);
  }
  if (status && !VALID_STATUSES.includes(status)) {
    throw new Error(`Statut invalide. Valeurs acceptées : ${VALID_STATUSES.join(', ')}`);
  }
}

/** Vérifie que l'utilisateur parent existe. */
async function ensureUserExists(usersCollection, userId) {
  const user = await usersCollection.findOne(userId).exec();
  if (!user) {
    throw new Error(`Utilisateur introuvable (id: ${userId})`);
  }
}

/** Vérifie l'unicité du numéro de série. */
async function ensureUniqueSerial(devicesCollection, serialNumber, excludedId = null) {
  const existing = await devicesCollection
    .findOne({ selector: { serialNumber } })
    .exec();
  if (existing && existing.primary !== excludedId) {
    throw new Error('Numéro de série déjà utilisé');
  }
}

// ─── Opérations CRUD ─────────────────────────────────────────────────────────

/**
 * Récupère tous les devices, avec filtrage optionnel par userId.
 * @param {string|null} userId
 * @returns {Promise<Object[]>}
 */
async function getAllDevices(userId = null) {
  const { devices } = await dbPromise;
  const selector = userId ? { userId } : {};
  const docs = await devices.find({ selector }).exec();
  return docs.map(toJson);
}

/**
 * Récupère un device par son ID.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function getDeviceById(id) {
  const { devices } = await dbPromise;
  const doc = await devices.findOne(id).exec();
  return toJson(doc);
}

/**
 * Récupère tous les devices d'un utilisateur donné.
 * @param {string} userId
 * @returns {Promise<Object[]>}
 */
async function getDevicesByUserId(userId) {
  return getAllDevices(userId);
}

/**
 * Crée un nouveau device.
 * @param {{ userId, name, type, serialNumber, status }} data
 * @returns {Promise<Object>}
 */
async function createDevice({ userId, name, type, serialNumber, status }) {
  const { users, devices, persistDevices, createId } = await dbPromise;

  if (!userId || !name || !type || !serialNumber || !status) {
    throw new Error('Les champs userId, name, type, serialNumber et status sont obligatoires');
  }

  validateDeviceFields({ type, status });
  await ensureUserExists(users, userId);
  await ensureUniqueSerial(devices, serialNumber);

  const inserted = await devices.insert({
    id: createId(),
    userId,
    name,
    type,
    serialNumber,
    status
  });

  await persistDevices(devices);
  return inserted.toJSON();
}

/**
 * Met à jour un device existant.
 * @param {{ id, userId, name, type, serialNumber, status }} data
 * @returns {Promise<Object|null>}
 */
async function updateDevice({ id, userId, name, type, serialNumber, status }) {
  const { users, devices, persistDevices } = await dbPromise;

  const doc = await devices.findOne(id).exec();
  if (!doc) return null;

  if (!userId || !name || !type || !serialNumber || !status) {
    throw new Error('Les champs userId, name, type, serialNumber et status sont obligatoires');
  }

  validateDeviceFields({ type, status });
  await ensureUserExists(users, userId);
  await ensureUniqueSerial(devices, serialNumber, id);

  const updatedDoc = await doc.incrementalPatch({ userId, name, type, serialNumber, status });
  await persistDevices(devices);
  return updatedDoc.toJSON();
}

/**
 * Supprime un device par son ID.
 * @param {string} id
 * @returns {Promise<boolean>}
 */
async function deleteDevice(id) {
  const { devices, persistDevices } = await dbPromise;

  const doc = await devices.findOne(id).exec();
  if (!doc) return false;

  await doc.remove();
  await persistDevices(devices);
  return true;
}

module.exports = {
  getAllDevices,
  getDeviceById,
  getDevicesByUserId,
  createDevice,
  updateDevice,
  deleteDevice
};
