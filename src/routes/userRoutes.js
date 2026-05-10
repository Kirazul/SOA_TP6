/**
 * userRoutes.js — Routes REST pour la ressource User.
 *
 * Toutes les opérations délèguent à userService,
 * garantissant la même logique métier que GraphQL.
 *
 * Routes exposées :
 *   GET    /users          → liste tous les utilisateurs
 *   GET    /users/:id      → récupère un utilisateur
 *   POST   /users          → crée un utilisateur
 *   PUT    /users/:id      → met à jour un utilisateur
 *   DELETE /users/:id      → supprime un utilisateur (+ ses devices)
 */

const { Router } = require('express');
const userService = require('../services/userService');

const router = Router();

// GET /users — Liste tous les utilisateurs
router.get('/', async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/:id — Récupère un utilisateur par ID
router.get('/:id', async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /users — Crée un utilisateur
router.post('/', async (req, res) => {
  try {
    const created = await userService.createUser(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /users/:id — Met à jour un utilisateur
router.put('/:id', async (req, res) => {
  try {
    const updated = await userService.updateUser({ id: req.params.id, ...req.body });
    if (!updated) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /users/:id — Supprime un utilisateur (et ses devices)
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await userService.deleteUser(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
