import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withPayload } from '@payloadcms/next/withPayload';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(dirname, '../..');

for (const envFile of ['.env.local', '.env']) {
  const fullPath = path.join(rootDir, envFile);
  if (fs.existsSync(fullPath) && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(fullPath);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    reactCompiler: false,
  },
};

export default withPayload(nextConfig);
