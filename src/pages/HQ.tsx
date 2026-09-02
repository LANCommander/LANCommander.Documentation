import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';
import ProviderList from '@site/src/components/ProviderList';

import styles from './HQ.module.css';

const HQ_URL = 'https://hq.lancommander.app';
const API_URL = 'https://api.lancommander.app';
const NUGET_URL = 'https://www.nuget.org/packages/LANCommander.HQ.SDK';

const capabilities = [
  {
    title: 'One search, every source',
    body:
      'Stop wasting that precious RAM cross referencing metadata providers across a dozen browser tabs. HQ aggregates metadata from multiple providers in one interface.',
  },
  {
    title: 'Built for LANCommander',
    body:
      'Every LANCommander server comes bundled with an HQ integration. Search across supported providers to enrich your own library without leaving the server UI.',
  },
  {
    title: 'A curated catalog',
    body:
      'Aggregation gets you a draft. Editors reconcile duplicates, group editions and re-releases ' +
      'under one title, and correct what upstream got wrong, so the canonical record is one you ' +
      'can import without cleanup.',
  },
  {
    title: 'Artwork that exists',
    body:
      'Covers, backgrounds, logos, icons, screenshots, and trailers, pulled from whichever ' +
      'provider has them. Media is served through HQ, so a dead upstream link does not leave a ' +
      'hole in your library.',
  },
/*  {
    title: 'Master server browsing',
    body:
      'HQ proxies GameSpy and Source master servers and queries individual hosts over GameSpy, ' +
      'Source, and GoldSrc, so a launcher can show live servers alongside the games themselves.',
  },*/
  {
    title: 'Localized metadata',
    body:
      'Send an X-Locale header and descriptions, genres, and taxonomy come back translated where ' +
      'a translation exists, with the source language as the fallback.',
  },
];

export default function HQ(): ReactNode {
  return (
    <Layout
      title="LANCommander HQ"
      description="An aggregate game metadata service built for LANCommander; ten providers, one curated catalog, one API.">
      <header className={styles.header}>
        <div className="container">
          <div className={styles.headerInner}>
            <span className={styles.eyebrow}>LANCommander HQ</span>
            <Heading as="h1" className={styles.title}>
              Every game database, reconciled into one
            </Heading>
            <p className={styles.subtitle}>
              HQ is a metadata service that searches multiple metadata providers at once, merges the results into
              a single curated catalog, and serves it back over one API. No need to manually search multiple providers
              register multiple accounts.
            </p>
            <div className={styles.buttons}>
              <Link
                className={clsx('button button--primary button--lg', styles.button)}
                href={HQ_URL}>
                Get Started
              </Link>
              {/* A raw anchor rather than <Link>, whose broken-anchor check only knows about
                  anchors generated from markdown headings, not an id on a section. */}
              <a
                className={clsx('button button--outline button--lg', styles.button, styles.ghostButton)}
                href="#api">
                Read the API docs
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.band}>
          <div className="container">
            <div className={styles.capabilityGrid}>
              {capabilities.map((capability) => (
                <div key={capability.title} className={styles.capability}>
                  <Heading as="h3" className={styles.capabilityTitle}>
                    {capability.title}
                  </Heading>
                  <p className={styles.capabilityBody}>{capability.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={clsx(styles.band, styles.bandAlt)} id="providers">
          <div className="container">
            <div className={styles.sectionIntro}>
              <Heading as="h2">Providers</Heading>
              <p>
                Ten sources, each contributing what it is best at.
              </p>
            </div>
            <ProviderList />
          </div>
        </section>

        <section className={styles.band} id="plans">
          <div className="container">
            <div className={styles.sectionIntro}>
              <Heading as="h2">Plans</Heading>
              <p>
                HQ pays per call for some of the data it serves. The free plan covers the community
                providers; premium covers the ones with a bill attached, and the curated catalog
                is built on top of them.
              </p>
            </div>

            <div className={styles.planGrid}>
              <div className={styles.plan}>
                <Heading as="h3" className={styles.planName}>
                  Free
                </Heading>
                <div className={styles.planPrice}>
                  $0<span>/mo</span>
                </div>
                <ul className={styles.planFeatures}>
                  <li>Browse the game database</li>
                  <li>Eight community metadata providers</li>
                  <li>Full API and SDK access</li>
                </ul>
                <Link
                  className={clsx('button button--secondary button--block', styles.planButton)}
                  href={HQ_URL}>
                  Join Free
                </Link>
              </div>

              <div className={clsx(styles.plan, styles.planPremium)}>
                <Heading as="h3" className={styles.planName}>
                  Premium
                </Heading>
                <div className={styles.planPrice}>
                  $5<span>/mo</span>
                </div>
                <ul className={styles.planFeatures}>
                  <li>Everything in Free</li>
                  <li>The curated LANCommander catalog</li>
                  <li>Premium metadata providers</li>
                  <li>Priority support</li>
                </ul>
                <Link
                  className={clsx('button button--primary button--block', styles.planButton)}
                  href={HQ_URL}>
                  Subscribe
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className={clsx(styles.band, styles.bandAlt)} id="api">
          <div className="container">
            <div className={styles.prose}>
              <Heading as="h2">Using the API</Heading>
              <p>
                Everything HQ knows is available over a REST API at <code>{API_URL}</code>. Sign in
                once, and a long-running client stays authenticated indefinitely. Access tokens are
                short-lived and renewed from a refresh token whose clock resets on every use.
              </p>
              <p>
                For .NET there is a first-party SDK on{' '}
                <a href={NUGET_URL} target="_blank" rel="noopener noreferrer">
                  NuGet
                </a>{' '}
                that wraps every endpoint and handles token rotation for you:
              </p>
              <CodeBlock language="powershell">
                dotnet add package LANCommander.HQ.SDK
              </CodeBlock>
              <CodeBlock language="csharp">
                {`using var client = new HQClient(new HQClientOptions
{
    BaseAddress = new Uri("${API_URL}"),
    RefreshToken = configuration["HQ:RefreshToken"],
    TokenStore = new FileTokenStore("/var/lib/myapp/hq-tokens.json"),
    ClientName = "my-lancommander-server",
});

var providers = await client.Providers.ListAsync();
var results = await client.Games.SearchAsync(provider: "igdb", query: "Half-Life");
var game = await client.Games.GetAsync("igdb", results.First().ProviderId);`}
              </CodeBlock>
              <p>
                Scripts and one-off tooling can skip the token dance entirely and authenticate with
                an API key. See the{' '}
                <a
                  href="https://github.com/LANCommander/LANCommander.HQ"
                  target="_blank"
                  rel="noopener noreferrer">
                  HQ repository
                </a>{' '}
                for the full endpoint reference, or the{' '}
                <Link to="/SDK/Overview">LANCommander SDK docs</Link> if you are building against a
                LANCommander server instead.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.cta}>
          <div className="container">
            <Heading as="h2" className={styles.ctaTitle}>
              Stop maintaining game metadata by hand
            </Heading>
            <p className={styles.ctaBody}>
              Point your server at HQ and let it fill in the covers, the player counts, and the save
              paths for you.
            </p>
            <Link className={clsx('button button--primary button--lg', styles.button)} href={HQ_URL}>
              Get Started
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}
