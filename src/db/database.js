import Dexie from 'dexie'

export const db = new Dexie('OsmoTrackDB')

db.version(1).stores({
  readings: '++id, date',
  interventions: '++id, date, equipment, category',
  maintenance: '++id, equipment',
  stocks: '++id, name, category',
  settings: 'key',
})

db.version(2).stores({
  readings: '++id, date',
  interventions: '++id, date, equipment, category',
  maintenance: '++id, equipment',
  stocks: '++id, name, category',
  settings: 'key',
})

export default db
