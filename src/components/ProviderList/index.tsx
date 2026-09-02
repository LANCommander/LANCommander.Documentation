import type {ReactNode} from 'react';

import styles from './styles.module.css';

export interface Provider {
  /** Display name, as HQ reports it from `GET /Providers`. */
  name: string;
  /** The `provider` query parameter value used by the game endpoints. */
  slug: string;
  /** Requires the `premium` claim; requests without it are rejected with a 403. */
  premium?: boolean;
  /** A hand-maintained catalog rather than a passthrough to a third party. */
  curated?: boolean;
  /** Upstream source, or the HQ site itself for the canonical catalog. */
  url: string;
  description: string;
  /** The fields this provider actually fills in on a game record. */
  contributes: string[];
}

/**
 * Mirrors the providers registered in LANCommander.HQ. The live list is served by
 * `GET /Providers`, but that endpoint requires a member token, so this page carries its
 * own copy — update it when a provider is added or its premium status changes.
 */
export const providers: Provider[] = [
  {
    name: 'LANCommander',
    slug: 'lancommander',
    premium: true,
    curated: true,
    url: 'https://hq.lancommander.app',
    description:
      'The canonical catalog. Every record here has been merged from the providers below and ' +
      'corrected by hand, so titles, editions, and artwork line up instead of contradicting ' +
      'each other. This is the one to search first.',
    contributes: ['Everything, reconciled'],
  },
  {
    name: 'IGDB',
    slug: 'igdb',
    url: 'https://www.igdb.com',
    description:
      'Broad, well-structured coverage of modern releases. Also ranks its catalog by ' +
      'popularity, which is what drives HQ’s bulk backfill of the canonical database.',
    contributes: ['Genres', 'Themes', 'Platforms', 'Engine', 'Multiplayer modes', 'Cover art', 'Screenshots'],
  },
  {
    name: 'MobyGames',
    slug: 'mobygames',
    premium: true,
    url: 'https://www.mobygames.com',
    description:
      'Decades of catalog depth, including the older LAN-era titles that newer databases ' +
      'never indexed. Calls cost paid quota, so HQ only reaches for it to fill real gaps.',
    contributes: ['Genres', 'Platforms', 'Developers', 'Multiplayer attributes', 'Cover art', 'Screenshots'],
  },
  {
    name: 'PCGamingWiki',
    slug: 'pcgamingwiki',
    url: 'https://www.pcgamingwiki.com',
    description:
      'The best source for the things that actually matter when you run a game off a server: ' +
      'where saves and configs live on disk, and how its multiplayer is wired. Also resolves ' +
      'one provider’s ID straight to another’s without a title search.',
    contributes: ['Save paths', 'Config paths', 'Engine', 'Network protocols', 'Cover art'],
  },
  {
    name: 'Steam',
    slug: 'steam',
    url: 'https://store.steampowered.com',
    description:
      'Store metadata for anything on Steam, including the LAN, online, and local co-op flags ' +
      'Valve publishes per title.',
    contributes: ['Description', 'Genres', 'Developers', 'Multiplayer modes', 'Screenshots', 'Trailers', 'Background art'],
  },
  {
    name: 'GOG',
    slug: 'gog',
    url: 'https://www.gog.com',
    description:
      'The DRM-free catalog, which is often the only storefront still carrying a re-release of ' +
      'an older title in a form you can install offline.',
    contributes: ['Description', 'Genres', 'Developers', 'Cover art', 'Icons', 'Screenshots', 'Trailers'],
  },
  {
    name: 'SteamGridDB',
    slug: 'steamgriddb',
    url: 'https://www.steamgriddb.com',
    description:
      'Artwork only, but the community fills gaps no storefront does — grids, heroes, logos, ' +
      'and icons for games that never shipped with usable art.',
    contributes: ['Cover art', 'Background art', 'Logos', 'Icons'],
  },
  {
    name: 'TheGamesDB',
    slug: 'thegamesdb',
    url: 'https://thegamesdb.net',
    description:
      'A community database with strong coverage of console and retro platforms, useful as a ' +
      'second opinion where the PC-focused providers come back empty.',
    contributes: ['Overview', 'Genres', 'Developers', 'Multiplayer modes', 'Cover art', 'Background art'],
  },
  {
    name: 'ModDB',
    slug: 'moddb',
    url: 'https://www.moddb.com',
    description:
      'Mods and total conversions, which no storefront indexes. If half your LAN runs on a ' +
      'twenty-year-old mod, this is where its metadata comes from.',
    contributes: ['Description', 'Genres', 'Developers', 'Multiplayer modes', 'Cover art'],
  },
  {
    name: 'Discord',
    slug: 'discord',
    url: 'https://discord.com',
    description:
      'Discord’s detectable-application registry. Narrow, but it carries clean icon and cover ' +
      'art for a long tail of games, including plenty that predate Steam.',
    contributes: ['Cover art', 'Icons'],
  },
];

function PremiumIcon(): ReactNode {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{marginRight: '0.3rem'}}
      aria-hidden="true">
      <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z" />
    </svg>
  );
}

export default function ProviderList(): ReactNode {
  return (
    <>
      <p className={styles.legend}>
        <span className={styles.premiumBadge}>
          <PremiumIcon />
          Premium
        </span>{' '}
        marks a provider that requires a premium subscription. Everything else is available on
        the free plan.
      </p>

      <div className={styles.grid}>
        {providers.map((provider) => (
          <div
            key={provider.slug}
            className={provider.premium ? `${styles.card} ${styles.cardPremium}` : styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <a href={provider.url} target="_blank" rel="noopener noreferrer">
                  {provider.name}
                </a>
              </h3>
              {provider.premium && (
                <span className={styles.premiumBadge}>
                  <PremiumIcon />
                  Premium
                </span>
              )}
            </div>

            <code className={styles.slug}>{provider.slug}</code>

            <p className={styles.cardDescription}>{provider.description}</p>

            <div className={styles.cardFooter}>
              <span className={styles.contributesLabel}>Contributes</span>
              <div className={styles.tags}>
                {provider.contributes.map((field) => (
                  <span key={field} className={styles.tag}>
                    {field}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
