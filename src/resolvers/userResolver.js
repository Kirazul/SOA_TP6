/**
 * userResolver.js — Résolveurs GraphQL pour la ressource User.
 *
 * Chaque résolveur délègue entièrement à userService,
 * assurant la cohérence avec les routes REST.
 */

const userService = require('../services/userService');

const userResolver = {
  /** Récupère un utilisateur par son ID. */
  user: ({ id }) => userService.getUserById(id),

  /** Récupère la liste de tous les utilisateurs. */
  users: () => userService.getAllUsers(),

  /** Crée un nouvel utilisateur. */
  addUser: ({ name, email, password }) =>
    userService.createUser({ name, email, password }),

  /** Met à jour un utilisateur existant. */
  updateUser: ({ id, name, email, password }) =>
    userService.updateUser({ id, name, email, password }),

  /** Supprime un utilisateur (et ses devices en cascade). */
  deleteUser: ({ id }) => userService.deleteUser(id)
};

module.exports = userResolver;
