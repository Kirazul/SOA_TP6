/**
 * Schéma RxDB pour la collection "devices".
 * Un device est en relation de composition avec un User :
 * il ne peut pas exister sans son userId parent.
 */
const deviceSchema = {
  title: 'device schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    userId: {
      type: 'string',
      maxLength: 100,
      description: 'Référence vers l\'utilisateur propriétaire (composition)'
    },
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 150
    },
    type: {
      type: 'string',
      enum: ['laptop', 'smartphone', 'tablet', 'server']
    },
    serialNumber: {
      type: 'string',
      minLength: 1,
      maxLength: 100
    },
    status: {
      type: 'string',
      enum: ['active', 'inactive', 'maintenance']
    }
  },
  required: ['id', 'userId', 'name', 'type', 'serialNumber', 'status'],
  indexes: ['userId', 'serialNumber']
};

module.exports = deviceSchema;
