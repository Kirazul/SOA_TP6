/**
 * deviceRoutes.js — Routes REST pour la ressource Device.
 *
 * Routes exposées :
 *   GET    /devices              → liste tous les devices (optionnel: ?userId=...)
 *   GET    /devices/:id          → récupère un device
 *   GET    /users/:userId/devices → liste les devices d'un utilisateur
 *   POST   /devices              → crée un device
 *   PUT    /devices/:id          → met à jour un device
 *   DELETE /devices/:id          → supprime un device
 */

const { Router } = require('express');
const deviceService = require('../services/deviceService');

const router = Router();

// GET /devices — Liste tous les devices (filtrables par ?userId=)
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const devices = await deviceService.getAllDevices(userId || null);
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /devices/:id — Récupère un device par ID
router.get('/:id', async (req, res) => {
  try {
    const device = await deviceService.getDeviceById(req.params.id);
    if (!device) return res.status(404).json({ error: 'Device non trouvé' });
    res.json(device);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /devices — Crée un device
router.post('/', async (req, res) => {
  try {
    const created = await deviceService.createDevice(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /devices/:id — Met à jour un device
router.put('/:id', async (req, res) => {
  try {
    const updated = await deviceService.updateDevice({ id: req.params.id, ...req.body });
    if (!updated) return res.status(404).json({ error: 'Device non trouvé' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /devices/:id — Supprime un device
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await deviceService.deleteDevice(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Device non trouvé' });
    res.json({ message: 'Device supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
