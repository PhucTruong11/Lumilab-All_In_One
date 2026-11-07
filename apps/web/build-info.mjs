// Public build metadata only; never copy environment variables or credentials.
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { URL } from 'node:url';

const root = new URL('../../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const gitSha = process.env.LUMILAB_BUILD_SHA || 'unknown';
if (!/^(unknown|[0-9a-f]{40})$/.test(gitSha)) throw new Error('Invalid build SHA');
const catalog = read('packages/lab-engine/labs/catalog.json');
const identity = [...catalog.active, ...catalog.archived].sort().map(id => {
  const lab = read(`packages/lab-engine/labs/${id}/lab.json`);
  return [id, catalog.active.includes(id) ? 'active' : 'archived', lab.model_version, lab.dataset_version];
});
const info = {
  schema_version: 'web-build-1.0', git_sha: gitSha,
  mapping_revision: read('packages/contracts/practice-map.json').revision,
  mapping_fingerprint: createHash('sha256').update(readFileSync(new URL('packages/contracts/practice-map.json', root))).digest('hex'),
  runtime_fingerprint: createHash('sha256').update(JSON.stringify(identity)).digest('hex'),
};
const output = new URL('./dist/', import.meta.url);
mkdirSync(output, { recursive: true });
writeFileSync(new URL('build-info.json', output), JSON.stringify(info) + '\n');
