import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface ReleaseAsset {
  id: number;
  name: string;
  size: number;
  download_count: number;
  browser_download_url: string;
  content_type: string;
}

interface Release {
  tag_name: string;
  name: string;
  published_at: string;
  assets: ReleaseAsset[];
  html_url: string;
}

interface ReleaseDownloadsProps {
  repo?: string;
  release?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

export default function ReleaseDownloads({
  repo = 'LANCommander/LANCommander',
  release,
}: ReleaseDownloadsProps): ReactNode {
  const [data, setData] = useState<Release | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = release
      ? `https://api.github.com/repos/${repo}/releases/tags/${release}`
      : `https://api.github.com/repos/${repo}/releases/latest`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
        return res.json() as Promise<Release>;
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [repo, release]);

  if (loading) {
    return <p>Loading release downloads…</p>;
  }

  if (error) {
    return <p>Failed to load release: {error}</p>;
  }

  if (!data || data.assets.length === 0) {
    return <p>No downloadable assets found for this release.</p>;
  }

  const publishedDate = new Date(data.published_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      <p>
        <strong>
          <a href={data.html_url} target="_blank" rel="noopener noreferrer">
            {data.name || data.tag_name}
          </a>
        </strong>{' '}
        &mdash; released {publishedDate}
      </p>
      <table>
        <thead>
          <tr>
            <th>Asset</th>
            <th>Size</th>
            <th>Downloads</th>
          </tr>
        </thead>
        <tbody>
          {data.assets.map((asset) => (
            <tr key={asset.id}>
              <td>
                <a href={asset.browser_download_url} download>
                  {asset.name}
                </a>
              </td>
              <td>{formatBytes(asset.size)}</td>
              <td>{formatNumber(asset.download_count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
