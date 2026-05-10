/**
 * userService.js — Logique métier pour la ressource User.
 *
 * Ce module est la SEULE source de vérité pour les opérations sur les users.
 * Les routes REST et les résolveurs GraphQL l'appellent directement,
 * garantissant un comportement identique quelle que soit l'interface utilisée.
 */

const dbPromise = require('../db/database');

// ─── Helpers internes ────────────────────────────────────────────────────────

/** Convertit un document RxDB en objet JSON simple. */
function toJson(doc) {
  return doc ? doc.toJSON() : null;
}

/** Recherche un utilisateur par adresse e-mail. */
async function findByEmail(usersCollection, email) {
  return usersCollection.findOne({ selector: { email } }).exec();
}

/**
 * Vérifie que l'e-mail n'est pas déjà utilisé par un autre utilisateur.
 * @param {string|null} excludedId - ID à exclure (utile lors d'une mise à jour).
 */
async function ensureUniqueEmail(usersCollection, email, excludedId = null) {
  const existing = await findByEmail(usersCollection, email);
  if (existing && existing.primary !== excludedId) {
    throw new Error('Adresse e-mail déjà utilisée');
  }
}

// ─── Opérations CRUD ─────────────────────────────────────────────────────────

/**
 * Récupère tous les utilisateurs.
 * @returns {Promise<Object[]>}
 */
async function getAllUsers() {
  const { users } = await dbPromise;
  const docs = await users.find().exec();
  return docs.map(toJson);
}

/**
 * Récupère un utilisateur par son ID.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function getUserById(id) {
  const { users } = await dbPromise;
  const doc = await users.findOne(id).exec();
  return toJson(doc);
}

/**
 * Crée un nouvel utilisateur.
 * @param {{ name: string, email: string, password: string }} data
 * @returns {Promise<Object>}
 */
async function createUser({ name, email, password }) {
  const { users, persistUsers, createId } = await dbPromise;

  if (!name || !email || !password) {
    throw new Error('Les champs name, email et password sont obligatoires');
  }

  await ensureUniqueEmail(users, email);

  const inserted = await users.insert({
    id: createId(),
    name,
    email,
    password
  });

  await persistUsers(users);
  return inserted.toJSON();
}

/**
 * Met à jour un utilisateur existant.
 * @param {{ id: string, name: string, email: string, password: string }} data
 * @returns {Promise<Object|null>} null si l'utilisateur n'existe pas
 */
async function updateUser({ id, name, email, password }) {
  const { users, persistUsers } = await dbPromise;

  const doc = await users.findOne(id).exec();
  if (!doc) return null;

  if (!name || !email || !password) {
    throw new Error('Les champs name, email et password sont obligatoires');
  }

  await ensureUniqueEmail(users, email, id);

  const updatedDoc = await doc.incrementalPatch({ name, email, password });
  await persistUsers(users);
  return updatedDoc.toJSON();
}

/**
 * Supprime un utilisateur et tous ses devices (composition).
 * @param {string} id
 * @returns {Promise<boolean>}
 */
async function deleteUser(id) {
  const { users, devices, persistUsers, persistDevices } = await dbPromise;

  const doc = await users.findOne(id).exec();
  if (!doc) return false;

  // Suppression en cascade des devices liés (relation de composition)
  const userDevices = await devices.find({ selector: { userId: id } }).exec();
  await Promise.all(userDevices.map((d) => d.remove()));

  await doc.remove();

  await Promise.all([persistUsers(users), persistDevices(devices)]);
  return true;
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
