import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import ScreenshotCarousel from '@site/src/components/ScreenshotCarousel';

import styles from './index.module.css';

const backgrounds = [
  '/img/backgrounds/aoe2.jpg',
  '/img/backgrounds/ns2.jpg',
  '/img/backgrounds/css.jpg',
  '/img/backgrounds/bfme2.jpg',
  '/img/backgrounds/soldat2.jpg',
  '/img/backgrounds/ut2004.jpg',
];

function HomepageHeader() {
  const bg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
  return (
    <header
      className={styles.heroBanner}
      style={{backgroundImage: `url(${bg})`}}>
      <div className={styles.heroBannerOverlay} />
      <div className="container">
        <div className={styles.heroContent}>
          <img
            src="/img/logo.svg"
            alt="LANCommander"
            className={styles.heroLogo}
          />
          <p className={styles.heroSubtitle}>
            The open-source, self-hosted game distribution platform for LAN parties and private
            networks. No internet required.
          </p>
          <div className={styles.buttons}>
            <Link className={clsx('button button--primary button--lg', styles.getStartedButton)} to="/Overview">
              Get Started
            </Link>
            <Link
              className={clsx('button button--outline button--lg', styles.ghostButton)}
              href="https://github.com/LANCommander/LANCommander">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{marginRight: '0.4rem', verticalAlign: 'text-bottom'}}
                aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              View on GitHub
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function ScreenshotSection() {
  return (
    <section className={styles.screenshotSection}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          See it in Action
        </Heading>
        <p className={styles.sectionSubtitle}>
          A complete game management solution with intuitive interfaces for both administrators and
          players.
        </p>
        <ScreenshotCarousel />
      </div>
    </section>
  );
}

function CommunitySection() {
  const bg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
  return (
    <section className={styles.communitySection} style={{backgroundImage: `url(${bg})`}}>
      <div className={styles.heroBannerOverlay} />
      <div className="container">
        <div className={styles.communityContent}>
          <Heading as="h2" className={styles.communitySectionTitle}>
            Join the Community
          </Heading>
          <p className={styles.communitySectionSubtitle}>
            LANCommander is free and open source. Get help, share setups, and contribute on GitHub
            and Discord.
          </p>
          <div className={styles.communityButtons}>
            <Link
              className={clsx('button button--primary button--lg', styles.getStartedButton)}
              href="https://discord.gg/vDEEWVt8EM">
              Join Discord
            </Link>
            <Link
              className={clsx('button button--outline button--lg', styles.ghostButton)}
              href="https://github.com/LANCommander/LANCommander">
              Star on GitHub
            </Link>
            <Link
              className={clsx('button button--outline button--lg', styles.ghostButton)}
              href="https://www.patreon.com/LANCommander">
              Support on Patreon
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Documentation for LANCommander, the self-hosted game library. Learn how to set up and manage your own digital game distribution platform.">
      <HomepageHeader />
      <main>
        <ScreenshotSection />
        <HomepageFeatures />
        <CommunitySection />
      </main>
    </Layout>
  );
}
