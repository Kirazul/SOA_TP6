# TP6 — API REST / GraphQL avec RxDB



---

## Présentation

Ce projet implémente une API hybride exposant les mêmes données via deux interfaces :

| Interface | Endpoint | Protocole |
|-----------|----------|-----------|
| REST | `/users`, `/devices` | HTTP + JSON |
| GraphQL | `/graphql` | HTTP + JSON |

Les deux interfaces partagent la **même logique métier** (services) et la **même base de données** (RxDB en mémoire avec snapshot JSON sur disque).

---

## Architecture

```
api-rest-graphql-rxdb/
├── data/                          # Snapshots JSON (persistance sur disque)
│   ├── users.snapshot.json
│   └── devices.snapshot.json
├── src/
│   ├── db/
│   │   └── database.js            # Initialisation RxDB (singleton)
│   ├── models/
│   │   ├── userSchema.js          # Schéma RxDB User
│   │   └── deviceSchema.js        # Schéma RxDB Device
│   ├── services/
│   │   ├── userService.js         # Logique métier Users (CRUD + cascade)
│   │   └── deviceService.js       # Logique métier Devices (CRUD + validation)
│   ├── resolvers/
│   │   ├── userResolver.js        # Résolveurs GraphQL → userService
│   │   └── deviceResolver.js      # Résolveurs GraphQL → deviceService
│   ├── routes/
│   │   ├── userRoutes.js          # Routes REST → userService
│   │   └── deviceRoutes.js        # Routes REST → deviceService
│   └── schema.gql                 # Schéma GraphQL (SDL)
├── server.js                      # Point d'entrée Express
├── package.json
└── README.md
```

### Séparation des responsabilités

```
REST Routes  ──┐
               ├──► Services (logique métier) ──► RxDB (base de données)
GQL Resolvers ─┘
```

---

## Prérequis

- Node.js ≥ 18 (LTS recommandé)
- npm ≥ 9

---

## Installation

```bash
git clone <repo>
cd api-rest-graphql-rxdb
npm install
```

---

## Démarrage

```bash
node server.js
# ou
npm start
```

Le serveur démarre sur **http://localhost:5000**.

---

## Modèles de données

### User

| Champ | Type | Contraintes |
|-------|------|-------------|
| `id` | string | UUID, clé primaire |
| `name` | string | 1–120 caractères |
| `email` | string | 3–190 caractères, unique |
| `password` | string | 1–255 caractères |

### Device

| Champ | Type | Contraintes |
|-------|------|-------------|
| `id` | string | UUID, clé primaire |
| `userId` | string | Référence User (composition) |
| `name` | string | 1–150 caractères |
| `type` | enum | `laptop`, `smartphone`, `tablet`, `server` |
| `serialNumber` | string | Unique |
| `status` | enum | `active`, `inactive`, `maintenance` |

> **Composition** : un device ne peut pas exister sans son utilisateur parent. La suppression d'un utilisateur entraîne la suppression automatique de tous ses devices.

---

## API REST

### Users

```
GET    /users              Liste tous les utilisateurs
GET    /users/:id          Récupère un utilisateur
POST   /users              Crée un utilisateur
PUT    /users/:id          Met à jour un utilisateur
DELETE /users/:id          Supprime un utilisateur (+ ses devices)
```

#### Exemple — Créer un utilisateur

```bash
curl -X POST http://localhost:5000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Ali Ben Salah","email":"ali@example.com","password":"123456"}'
```

#### Exemple — Lister les utilisateurs

```bash
curl http://localhost:5000/users
```

#### Exemple — Mettre à jour

```bash
curl -X PUT http://localhost:5000/users/<id> \
  -H "Content-Type: application/json" \
  -d '{"name":"Ali B.","email":"ali.b@example.com","password":"newpass"}'
```

#### Exemple — Supprimer

```bash
curl -X DELETE http://localhost:5000/users/<id>
```

---

### Devices

```
GET    /devices                    Liste tous les devices
GET    /devices?userId=<id>        Filtre par utilisateur
GET    /devices/:id                Récupère un device
GET    /users/:userId/devices      Devices d'un utilisateur (route imbriquée)
POST   /devices                    Crée un device
PUT    /devices/:id                Met à jour un device
DELETE /devices/:id                Supprime un device
```

#### Exemple — Créer un device

```bash
curl -X POST http://localhost:5000/devices \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<user-id>",
    "name": "MacBook Pro",
    "type": "laptop",
    "serialNumber": "SN-001",
    "status": "active"
  }'
```

---

## API GraphQL

Endpoint : `POST http://localhost:5000/graphql`  
Content-Type : `application/json`

### Queries

#### Lister tous les utilisateurs

```graphql
{
  users {
    id
    name
    email
  }
}
```

#### Récupérer un utilisateur avec ses devices

```graphql
{
  user(id: "<id>") {
    id
    name
    email
    devices {
      id
      name
      type
      status
    }
  }
}
```

#### Lister tous les devices

```graphql
{
  devices {
    id
    userId
    name
    type
    serialNumber
    status
  }
}
```

#### Devices d'un utilisateur

```graphql
{
  devicesByUser(userId: "<id>") {
    id
    name
    type
    status
  }
}
```

---

### Mutations

#### Ajouter un utilisateur

```graphql
mutation {
  addUser(name: "Amira", email: "amira@example.com", password: "abc123") {
    id
    name
    email
  }
}
```

#### Mettre à jour un utilisateur

```graphql
mutation {
  updateUser(
    id: "<id>"
    name: "Amira K."
    email: "amira.k@example.com"
    password: "xyz789"
  ) {
    id
    name
    email
  }
}
```

#### Supprimer un utilisateur (supprime aussi ses devices)

```graphql
mutation {
  deleteUser(id: "<id>")
}
```

#### Ajouter un device

```graphql
mutation {
  addDevice(
    userId: "<user-id>"
    name: "iPhone 15"
    type: smartphone
    serialNumber: "SN-IPHONE-001"
    status: active
  ) {
    id
    name
    type
    status
  }
}
```

#### Mettre à jour un device

```graphql
mutation {
  updateDevice(
    id: "<device-id>"
    userId: "<user-id>"
    name: "iPhone 15 Pro"
    type: smartphone
    serialNumber: "SN-IPHONE-001"
    status: maintenance
  ) {
    id
    name
    status
  }
}
```

#### Supprimer un device

```graphql
mutation {
  deleteDevice(id: "<device-id>")
}
```

---

## Interopérabilité REST ↔ GraphQL

Les données créées via REST sont immédiatement accessibles via GraphQL et inversement, car les deux interfaces partagent la même instance RxDB.

**Scénario de test :**

1. Créer un utilisateur via REST (`POST /users`)
2. Vérifier sa présence via GraphQL (`{ users { id name } }`)
3. Créer un device via GraphQL (`mutation { addDevice(...) }`)
4. Vérifier sa présence via REST (`GET /devices`)
5. Supprimer l'utilisateur via REST (`DELETE /users/:id`)
6. Vérifier que ses devices ont été supprimés (`GET /devices?userId=:id`)

---

## Persistance

RxDB utilise un stockage **en mémoire** pour les performances. Un snapshot JSON est sauvegardé dans `data/` après chaque opération d'écriture et rechargé au démarrage du serveur, assurant la durabilité des données entre les redémarrages.

```
data/
├── users.snapshot.json    # Sauvegarde des utilisateurs
└── devices.snapshot.json  # Sauvegarde des devices
```

---

## Technologies utilisées

| Catégorie | Technologie |
|-----------|-------------|
| Serveur HTTP | Node.js, Express |
| GraphQL | graphql, graphql-http |
| Base de données | RxDB (stockage mémoire + snapshot JSON) |
| Validation | RxDB AJV plugin |
| Test API | curl, Postman, Insomnia |
