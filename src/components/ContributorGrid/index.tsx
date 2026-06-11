import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import styles from './styles.module.css';

interface Contributor {
  login: string;
  avatar_url: string;
  html_url: string;
}

interface CompareResponse {
  commits: {
    author: Contributor | null;
  }[];
}

interface ContributorGridProps {
  /** GitHub repo in owner/repo format (default: LANCommander/LANCommander) */
  repo?: string;
  /** Base tag for comparison (e.g. "v2.0.0") */
  from: string;
  /** Head tag for comparison (e.g. "v2.1.0") */
  to: string;
  /** GitHub usernames to exclude (e.g. repo owner, bots) */
  exclude?: string[];
  /** Avatar size in pixels (default: 64) */
  size?: number;
}

export default function ContributorGrid({
  repo = 'LANCommander/LANCommander',
  from,
  to,
  exclude = [],
  size = 64,
}: ContributorGridProps): ReactNode {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const excludeSet = new Set(exclude.map((u) => u.toLowerCase()));

    fetch(`https://api.github.com/repos/${repo}/compare/${from}...${to}`)
      .then((res) => {
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
        return res.json() as Promise<CompareResponse>;
      })
      .then((data) => {
        const seen = new Set<string>();
        const unique: Contributor[] = [];

        for (const commit of data.commits) {
          const author = commit.author;
          if (!author) continue;

          const login = author.login.toLowerCase();
          if (seen.has(login) || excludeSet.has(login)) continue;

          seen.add(login);
          unique.push(author);
        }

        setContributors(unique);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [repo, from, to, exclude]);

  if (loading) {
    return <p>Loading contributors…</p>;
  }

  if (error) {
    return <p>Failed to load contributors: {error}</p>;
  }

  if (contributors.length === 0) {
    return null;
  }

  return (
    <div className={styles.grid}>
      {contributors.map((contributor) => (
        <a
          key={contributor.login}
          href={contributor.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.contributor}
          title={contributor.login}
        >
          <img
            src={`${contributor.avatar_url}&s=${size * 2}`}
            alt={contributor.login}
            width={size}
            height={size}
            className={styles.avatar}
            loading="lazy"
          />
          <span className={styles.username}>{contributor.login}</span>
        </a>
      ))}
    </div>
  );
}
