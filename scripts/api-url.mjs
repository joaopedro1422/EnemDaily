import { writeFile } from 'node:fs/promises';

const url = (process.env.API_URL || '').replace(/\/$/, '');
await writeFile('src/app/models/api-url.ts', `export const API_URL = '${url}';\n`, 'utf8');
console.log(`[api-url] ${url || '(vazio: usando o backend local na porta 8080)'}`);
