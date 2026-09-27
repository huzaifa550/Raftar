import { dataStore } from '../db/datastore.ts';

console.log('🧹 Purging all demo data with is_demo = true from Raftaar marketplace database...');

const allUsers = dataStore.listUsers();
const demoUsers = allUsers.filter((u) => u.isDemo);

demoUsers.forEach((u) => {
  dataStore.users.delete(u.id);
});

console.log(`✅ Removed ${demoUsers.length} demo user records.`);
console.log(`Remaining users: ${dataStore.listUsers().length}`);
