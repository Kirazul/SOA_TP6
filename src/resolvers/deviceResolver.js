/**
 * deviceResolver.js — Résolveurs GraphQL pour la ressource Device.
 *
 * Chaque résolveur délègue entièrement à deviceService.
 */

const deviceService = require('../services/deviceService');

const deviceResolver = {
  /** Récupère un device par son ID. */
  device: ({ id }) => deviceService.getDeviceById(id),

  /** Récupère tous les devices (filtrables par userId). */
  devices: ({ userId } = {}) => deviceService.getAllDevices(userId || null),

  /** Récupère tous les devices d'un utilisateur donné. */
  devicesByUser: ({ userId }) => deviceService.getDevicesByUserId(userId),

  /** Crée un nouveau device. */
  addDevice: ({ userId, name, type, serialNumber, status }) =>
    deviceService.createDevice({ userId, name, type, serialNumber, status }),

  /** Met à jour un device existant. */
  updateDevice: ({ id, userId, name, type, serialNumber, status }) =>
    deviceService.updateDevice({ id, userId, name, type, serialNumber, status }),

  /** Supprime un device. */
  deleteDevice: ({ id }) => deviceService.deleteDevice(id)
};

module.exports = deviceResolver;
