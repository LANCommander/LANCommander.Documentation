import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { load as parseYaml } from 'js-yaml';
import { formatBytes, formatDate, formatNumber } from '@site/src/utils/format';

import styles from './styles.module.css';

const ORG = 'LANCommander';
const REPO_PREFIX = 'LANCommander.Redistributables.';
const ORG_BROWSE_URL =
  'https://github.com/orgs/LANCommander/repositories?q=LANCommander.Redistributables.';

const CACHE_KEY = 'lc-redistributables-v1';
const CACHE_TTL_MS = 30 * 60 * 1000;

interface Repo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
}

interface ReleaseAsset {
  id: number;
  name: string;
  size: number;
  download_count: number;
  browser_download_url: string;
}

interface Release {
  tag_name: string;
  published_at: string;
  assets: ReleaseAsset[];
  html_url: string;
}

/** The subset of a repository's redistributable.yml that this page renders. */
interface Metadata {
  Name?: string;
  Description?: string;
  Notes?: string;
  Source?: {Mode?: string};
}

interface Redistributable {
  repo: string;
  name: string;
  description: string;
  notes?: string;
  /** True when the package ships no binaries and needs its Package script run after import. */
  payloadFetchedByServer: boolean;
  version: string;
  publishedAt: string;
  repoUrl: string;
  releaseUrl: string;
  asset: {name: string; size: number; downloads: number; url: string};
}

class RateLimitError extends Error {}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 403 && res.headers.get('X-RateLimit-Remaining') === '0') {
      throw new RateLimitError('GitHub API rate limit exceeded');
    }
    throw new Error(`GitHub API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/** Lists every repository in the org, following pagination until exhausted. */
async function fetchOrgRepos(): Promise<Repo[]> {
  const repos: Repo[] = [];

  for (let page = 1; page <= 10; page++) {
    const batch = await getJson<Repo[]>(
      `https://api.github.com/orgs/${ORG}/repos?per_page=100&page=${page}`,
    );

    repos.push(...batch);

    if (batch.length < 100) break;
  }

  return repos;
}

/**
 * Reads a repository's curated metadata. Served by raw.githubusercontent.com, which does not
 * count against the GitHub API rate limit, so this is free relative to the release lookup.
 */
async function fetchMetadata(repo: string): Promise<Metadata> {
  const res = await fetch(
    `https://raw.githubusercontent.com/${ORG}/${repo}/HEAD/redistributable.yml`,
  );

  if (!res.ok) throw new Error(`Failed to read redistributable.yml: ${res.status}`);

  return (parseYaml(await res.text()) ?? {}) as Metadata;
}

/**
 * Prefers the versioned package, so a saved file records which release it came from.
 * payload.zip is a build artifact and is never offered.
 */
function pickAsset(assets: ReleaseAsset[]): ReleaseAsset | undefined {
  return (
    assets.find((a) => /-v.*\.lcx$/i.test(a.name)) ??
    assets.find((a) => a.name.toLowerCase() === 'redistributable.lcx') ??
    assets.find((a) => a.name.toLowerCase().endsWith('.lcx'))
  );
}

async function fetchRedistributable(repo: Repo): Promise<Redistributable | null> {
  let release: Release;

  try {
    release = await getJson<Release>(
      `https://api.github.com/repos/${repo.full_name}/releases/latest`,
    );
  } catch (err) {
    // A repository that has been scaffolded but has not published yet 404s here.
    if (err instanceof RateLimitError) throw err;
    return null;
  }

  const asset = pickAsset(release.assets);
  if (!asset) return null;

  const metadata = await fetchMetadata(repo.name).catch(() => ({}) as Metadata);

  return {
    repo: repo.name,
    name: metadata.Name?.trim() || repo.name.slice(REPO_PREFIX.length),
    description: metadata.Description?.trim() || repo.description || '',
    notes: metadata.Notes?.trim() || undefined,
    payloadFetchedByServer: metadata.Source?.Mode === 'none',
    version: release.tag_name,
    publishedAt: release.published_at,
    repoUrl: repo.html_url,
    releaseUrl: release.html_url,
    asset: {
      name: asset.name,
      size: asset.size,
      downloads: asset.download_count,
      url: asset.browser_download_url,
    },
  };
}

async function fetchAll(): Promise<Redistributable[]> {
  const repos = (await fetchOrgRepos()).filter((r) => r.name.startsWith(REPO_PREFIX));

  const results = await Promise.all(repos.map(fetchRedistributable));

  return results
    .filter((r): r is Redistributable => r !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function readCache(): Redistributable[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const {at, data} = JSON.parse(raw) as {at: number; data: Redistributable[]};

    return Date.now() - at < CACHE_TTL_MS ? data : null;
  } catch {
    return null;
  }
}

function writeCache(data: Redistributable[]): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({at: Date.now(), data}));
  } catch {
    // Private browsing or a full quota; the page works without the cache.
  }
}

function DownloadIcon(): ReactNode {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{marginRight: '0.45rem'}}
      aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function RedistributableCard({item}: {item: Redistributable}): ReactNode {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{item.name}</h3>
        <span className={styles.versionBadge}>{item.version}</span>
      </div>

      {item.description && <p className={styles.cardDescription}>{item.description}</p>}

      {item.payloadFetchedByServer && (
        <p className={styles.warning}>
          <strong>Contains no binaries.</strong> Upstream licensing does not permit us to
          redistribute them, so after importing you must run this package&rsquo;s{' '}
          <strong>Package</strong> script once from your server&rsquo;s Redistributables page. Your
          server then downloads the files straight from the vendor.
        </p>
      )}

      {item.notes && <p className={styles.notes}>{item.notes}</p>}

      <div className={styles.cardFooter}>
        <a className={styles.downloadButton} href={item.asset.url} download>
          <DownloadIcon />
          Download .lcx
        </a>

        <div className={styles.assetMeta}>
          <span>{formatBytes(item.asset.size)}</span>
          <span>{formatNumber(item.asset.downloads)} downloads</span>
          <span>{formatDate(item.publishedAt)}</span>
        </div>
      </div>

      <div className={styles.cardLinks}>
        <a href={item.releaseUrl} target="_blank" rel="noopener noreferrer">
          Release notes
        </a>
        <a href={item.repoUrl} target="_blank" rel="noopener noreferrer">
          Source
        </a>
      </div>
    </div>
  );
}

export default function RedistributableList(): ReactNode {
  const [items, setItems] = useState<Redistributable[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = readCache();

    if (cached) {
      setItems(cached);
      return;
    }

    let cancelled = false;

    fetchAll()
      .then((data) => {
        writeCache(data);
        if (!cancelled) setItems(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err instanceof RateLimitError ? 'rateLimit' : err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error === 'rateLimit') {
    return (
      <p>
        GitHub is rate limiting anonymous requests from your network, so the package list
        can&rsquo;t be loaded right now. Try again in an hour, or{' '}
        <a href={ORG_BROWSE_URL} target="_blank" rel="noopener noreferrer">
          browse the redistributable repositories on GitHub
        </a>{' '}
        instead.
      </p>
    );
  }

  if (error) {
    return (
      <p>
        Failed to load the package list: {error}. You can{' '}
        <a href={ORG_BROWSE_URL} target="_blank" rel="noopener noreferrer">
          browse the redistributable repositories on GitHub
        </a>{' '}
        instead.
      </p>
    );
  }

  if (!items) {
    return <p>Loading redistributables&hellip;</p>;
  }

  if (items.length === 0) {
    return <p>No redistributable packages have been published yet.</p>;
  }

  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <RedistributableCard key={item.repo} item={item} />
      ))}
    </div>
  );
}
