/**
 * Schéma RxDB pour la collection "users".
 * Définit la structure, les contraintes et les index de la ressource User.
 */
const userSchema = {
  title: 'user schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 120
    },
    email: {
      type: 'string',
      minLength: 3,
      maxLength: 190
    },
    password: {
      type: 'string',
      minLength: 1,
      maxLength: 255
    }
  },
  required: ['id', 'name', 'email', 'password'],
  indexes: ['email']
};

module.exports = userSchema;
