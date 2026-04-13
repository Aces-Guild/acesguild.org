#!/usr/bin/env node
// scripts/sync-projects.js
//
// Syncs project website content from each project repo into the Astro site.
//
// Usage:
//   node scripts/sync-projects.js           # fetch from GitHub API
//   node scripts/sync-projects.js --local   # read from local sibling repos (dev)
//
// Optional env vars:
//   GITHUB_TOKEN — increases GitHub API rate limit (60 → 1000+ req/hr)

import { cpSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const isLocal = process.argv.includes('--local');
const token = process.env.GITHUB_TOKEN;

const config = JSON.parse(readFileSync(join(rootDir, 'projects.config.json'), 'utf-8'));

for (const project of config.projects) {
  const slug = project.repo.split('/')[1];
  process.stdout.write(`Syncing ${slug}... `);

  try {
    if (isLocal && project.local) {
      syncFromLocal(join(rootDir, project.local), slug);
    } else {
      await syncFromGitHub(project.repo, slug);
    }
    console.log('✓');
  } catch (err) {
    console.log('✗');
    console.error(`  Error: ${err.message}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------

function syncFromLocal(localRepoPath, slug) {
  const websiteDir = join(localRepoPath, 'website');
  const contentSrc = join(websiteDir, 'content.md');
  const mediaSrc = join(websiteDir, 'media');

  if (!existsSync(contentSrc)) {
    throw new Error(`website/content.md not found at ${contentSrc}`);
  }

  const contentDest = join(rootDir, 'src', 'content', 'projects', `${slug}.md`);
  mkdirSync(dirname(contentDest), { recursive: true });
  writeFileSync(contentDest, readFileSync(contentSrc));

  if (existsSync(mediaSrc)) {
    const mediaDest = join(rootDir, 'public', 'images', 'projects', slug);
    mkdirSync(mediaDest, { recursive: true });
    cpSync(mediaSrc, mediaDest, { recursive: true });
  }
}

async function syncFromGitHub(repo, slug) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Fetch website/content.md
  const contentRes = await fetch(
    `https://api.github.com/repos/${repo}/contents/website/content.md`,
    { headers },
  );
  if (!contentRes.ok) {
    throw new Error(`Failed to fetch content.md: ${contentRes.status} ${contentRes.statusText}`);
  }
  const contentData = await contentRes.json();
  const content = Buffer.from(contentData.content, 'base64').toString('utf-8');

  const contentDest = join(rootDir, 'src', 'content', 'projects', `${slug}.md`);
  mkdirSync(dirname(contentDest), { recursive: true });
  writeFileSync(contentDest, content);

  // Fetch website/media/ (if it exists)
  const mediaRes = await fetch(
    `https://api.github.com/repos/${repo}/contents/website/media`,
    { headers },
  );
  if (mediaRes.ok) {
    const mediaDest = join(rootDir, 'public', 'images', 'projects', slug);
    mkdirSync(mediaDest, { recursive: true });
    await fetchMediaDir(await mediaRes.json(), mediaDest, headers);
  }
}

async function fetchMediaDir(items, destDir, headers) {
  for (const item of items) {
    if (item.type === 'file') {
      const fileRes = await fetch(item.download_url);
      if (!fileRes.ok) {
        throw new Error(`Failed to download ${item.name}: ${fileRes.status}`);
      }
      writeFileSync(join(destDir, item.name), Buffer.from(await fileRes.arrayBuffer()));
    } else if (item.type === 'dir') {
      const subDir = join(destDir, item.name);
      mkdirSync(subDir, { recursive: true });
      const subRes = await fetch(item.url, { headers });
      if (subRes.ok) await fetchMediaDir(await subRes.json(), subDir, headers);
    }
  }
}
