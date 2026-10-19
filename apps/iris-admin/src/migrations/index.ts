import * as migration_20261017_001 from './20261017_001_user_tenants_migration';

export const migrations = [
  {
    up: migration_20261017_001.up,
    down: migration_20261017_001.down,
    name: '20261017_001_user_tenants_migration',
  },
];
