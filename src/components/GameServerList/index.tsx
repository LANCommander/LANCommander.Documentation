import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {
  useDocsData,
  useDocsSidebar,
  useDocsVersion,
} from '@docusaurus/plugin-content-docs/client';
import type {PropSidebarItem} from '@docusaurus/plugin-content-docs';

import styles from './styles.module.css';

interface GameServer {
  name: string;
  href: string;
  description?: string;
  /** The server's other docs, e.g. a configuration reference next to the Docker page. */
  pages: {label: string; href: string}[];
}

function pagesOf(items: PropSidebarItem[]): GameServer['pages'] {
  return items.flatMap((item) =>
    item.type === 'link' || (item.type === 'category' && item.href)
      ? [{label: item.label, href: item.href!}]
      : [],
  );
}

/**
 * Builds the list from the Game Servers sidebar, which already has each server's
 * display name and landing page (see gameServersSidebarItemsGenerator).
 */
function useGameServers(): GameServer[] {
  const sidebar = useDocsSidebar();
  const version = useDocsVersion();
  const docIdByPath = new Map(
    useDocsData('gameServers').versions[0].docs.map((doc) => [doc.path, doc.id]),
  );

  const descriptionOf = (href: string) => {
    const id = docIdByPath.get(href);
    return id ? version.docs[id]?.description : undefined;
  };

  return (sidebar?.items ?? []).flatMap((item): GameServer[] => {
    if (item.type === 'link' && item.docId && item.docId !== 'index') {
      return [{name: item.label, href: item.href, description: descriptionOf(item.href), pages: []}];
    }

    if (item.type === 'category' && item.href) {
      return [
        {
          name: item.label,
          href: item.href,
          description: descriptionOf(item.href),
          pages: pagesOf(item.items),
        },
      ];
    }

    return [];
  });
}

function GameServerCard({server}: {server: GameServer}): ReactNode {
  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>
        <Link className={styles.cardLink} to={server.href}>
          {server.name}
        </Link>
      </h3>

      {server.description && <p className={styles.cardDescription}>{server.description}</p>}

      {server.pages.length > 0 && (
        <div className={styles.cardPages}>
          {server.pages.map((page) => (
            <Link key={page.href} to={page.href}>
              {page.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GameServerList(): ReactNode {
  const servers = useGameServers();

  if (servers.length === 0) {
    return <p className={styles.empty}>No game servers are currently documented.</p>;
  }

  return (
    <div className={styles.grid}>
      {servers.map((server) => (
        <GameServerCard key={server.href} server={server} />
      ))}
    </div>
  );
}
