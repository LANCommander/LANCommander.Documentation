import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { formatBytes, formatDate, formatNumber } from '@site/src/utils/format';

import styles from './styles.module.css';

const CACHE_PREFIX = 'lc-project-release-v1:';
const CACHE_TTL_MS = 30 * 60 * 1000;

export interface Project {
  name: string;
  description: string;
  /** GitHub repository as owner/name. */
  repo: string;
  /** Optional landing page or documentation outside of GitHub. */
  url?: string;
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

/** What a card renders from the latest release: the files people actually download. */
interface LatestRelease {
  version: string;
  publishedAt: string;
  url: string;
  assets: {name: string; size: number; downloads: number; url: string}[];
}

/** `null` means the project hasn't published a release yet. */
type ReleaseState =
  | {status: 'loading'}
  | {status: 'loaded'; release: LatestRelease | null}
  | {status: 'error'; rateLimited: boolean};

class RateLimitError extends Error {}

/** Checksums and signatures sit alongside the builds but aren't something to offer as a download. */
function isDownload(asset: ReleaseAsset): boolean {
  return !/(^SHA\d*SUMS|\.(sha\d+|md5|sig|asc)$)/i.test(asset.name);
}

async function fetchLatestRelease(repo: string): Promise<LatestRelease | null> {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);

  // A repository that has not published yet 404s here.
  if (res.status === 404) return null;

  if (!res.ok) {
    if (res.status === 403 && res.headers.get('X-RateLimit-Remaining') === '0') {
      throw new RateLimitError('GitHub API rate limit exceeded');
    }
    throw new Error(`GitHub API error: ${res.status}`);
  }

  const release = (await res.json()) as Release;

  return {
    version: release.tag_name,
    publishedAt: release.published_at,
    url: release.html_url,
    assets: release.assets.filter(isDownload).map((asset) => ({
      name: asset.name,
      size: asset.size,
      downloads: asset.download_count,
      url: asset.browser_download_url,
    })),
  };
}

function readCache(repo: string): {release: LatestRelease | null} | null {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + repo);
    if (!raw) return null;

    const {at, release} = JSON.parse(raw) as {at: number; release: LatestRelease | null};

    return Date.now() - at < CACHE_TTL_MS ? {release} : null;
  } catch {
    return null;
  }
}

function writeCache(repo: string, release: LatestRelease | null): void {
  try {
    sessionStorage.setItem(CACHE_PREFIX + repo, JSON.stringify({at: Date.now(), release}));
  } catch {
    // Private browsing or a full quota; the page works without the cache.
  }
}

function useLatestRelease(repo: string): ReleaseState {
  const [state, setState] = useState<ReleaseState>({status: 'loading'});

  useEffect(() => {
    const cached = readCache(repo);

    if (cached) {
      setState({status: 'loaded', release: cached.release});
      return;
    }

    let cancelled = false;

    fetchLatestRelease(repo)
      .then((release) => {
        writeCache(repo, release);
        if (!cancelled) setState({status: 'loaded', release});
      })
      .catch((err: Error) => {
        if (!cancelled) setState({status: 'error', rateLimited: err instanceof RateLimitError});
      });

    return () => {
      cancelled = true;
    };
  }, [repo]);

  return state;
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
      className={styles.downloadIcon}
      aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function Downloads({state, releasesUrl}: {state: ReleaseState; releasesUrl: string}): ReactNode {
  if (state.status === 'loading') {
    return <p className={styles.releaseStatus}>Loading latest release&hellip;</p>;
  }

  if (state.status === 'error') {
    return (
      <p className={styles.releaseStatus}>
        {state.rateLimited
          ? 'GitHub is rate limiting requests from your network, so the latest release can’t be loaded right now. '
          : 'The latest release couldn’t be loaded. '}
        <a href={releasesUrl} target="_blank" rel="noopener noreferrer">
          View releases on GitHub
        </a>
        .
      </p>
    );
  }

  if (!state.release) {
    return <p className={styles.releaseStatus}>No releases have been published yet.</p>;
  }

  const {release} = state;

  return (
    <>
      <p className={styles.releaseDate}>Released {formatDate(release.publishedAt)}</p>
      <ul className={styles.assetList}>
        {release.assets.map((asset) => (
          <li key={asset.url} className={styles.asset}>
            <a className={styles.assetLink} href={asset.url} download>
              <DownloadIcon />
              {asset.name}
            </a>
            <span className={styles.assetMeta}>
              <span>{formatBytes(asset.size)}</span>
              <span>{formatNumber(asset.downloads)} downloads</span>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

function ProjectCard({project}: {project: Project}): ReactNode {
  const state = useLatestRelease(project.repo);
  const repoUrl = `https://github.com/${project.repo}`;
  const release = state.status === 'loaded' ? state.release : null;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{project.name}</h3>
        {release && <span className={styles.versionBadge}>{release.version}</span>}
      </div>

      <p className={styles.cardDescription}>{project.description}</p>

      <div className={styles.cardFooter}>
        <Downloads state={state} releasesUrl={`${repoUrl}/releases`} />
      </div>

      <div className={styles.cardLinks}>
        {release && (
          <a href={release.url} target="_blank" rel="noopener noreferrer">
            Release notes
          </a>
        )}
        <a href={repoUrl} target="_blank" rel="noopener noreferrer">
          Source
        </a>
        {project.url && (
          <a href={project.url} target="_blank" rel="noopener noreferrer">
            Website
          </a>
        )}
      </div>
    </div>
  );
}

export default function ProjectList({projects}: {projects: Project[]}): ReactNode {
  if (projects.length === 0) {
    return <p className={styles.empty}>Nothing to show here yet.</p>;
  }

  return (
    <div className={styles.grid}>
      {[...projects]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((project) => (
          <ProjectCard key={project.repo} project={project} />
        ))}
    </div>
  );
}
