import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

function IconServer() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="8" rx="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" />
      <circle cx="6" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="6" cy="18" r="1" fill="currentColor" stroke="none" />
      <line x1="10" y1="6" x2="14" y2="6" />
      <line x1="10" y1="18" x2="14" y2="18" />
    </svg>
  );
}

function IconGamepad() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="6" y1="12" x2="10" y2="12" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <circle cx="15" cy="13" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="10" r="1" fill="currentColor" stroke="none" />
      <path d="M6 9h12l2 7a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
    </svg>
  );
}

function IconRocket() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function IconDocker() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="10" width="3.5" height="3" rx="0.5" />
      <rect x="8.75" y="10" width="3.5" height="3" rx="0.5" />
      <rect x="13.5" y="10" width="3.5" height="3" rx="0.5" />
      <rect x="8.75" y="5.5" width="3.5" height="3" rx="0.5" />
      <path d="M21.8 11.5a4 4 0 00-1.8-.5h-.5V10a5.25 5.25 0 00-10.5 0" />
      <path d="M2 14c.5 2 2 3 4 3h13c1 0 2-.5 2.5-1.5" />
    </svg>
  );
}

function IconTerminal() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function IconGitHub() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

type FeatureItem = {
  title: string;
  icon: ReactNode;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Self-Hosted',
    icon: <IconServer />,
    description: (
      <>
        Run your own game distribution platform on your local network. No internet required for game
        installations. Perfect for LAN parties and closed networks. Available for Windows, Linux, and macOS.
      </>
    ),
  },
  {
    title: 'Game Management',
    icon: <IconGamepad />,
    description: (
      <>
        Upload and manage game archives, scripts for installation and configuration, game keys, and
        organize your library with collections. Supports redistributables, dedicated servers, and saves.
      </>
    ),
  },
  {
    title: 'Custom Launcher',
    icon: <IconRocket />,
    description: (
      <>
        Official launcher application for easy client setup. Browse your game library, install games
        with a single click, and manage your installations. Features offline mode and automatic updates.
      </>
    ),
  },
  {
    title: 'Docker Support',
    icon: <IconDocker />,
    description: (
      <>
        Pre-configured Docker container for easy deployment. Optional SteamCMD and WINE support.
        Multi-architecture support including Linux/ARM64 for flexible hosting options.
      </>
    ),
  },
  {
    title: 'Scripting & SDK',
    icon: <IconTerminal />,
    description: (
      <>
        Powerful PowerShell scripting engine for game installation and configuration. Full SDK
        available for building custom client applications. Extensive documentation and examples.
      </>
    ),
  },
  {
    title: 'Open Source',
    icon: <IconGitHub />,
    description: (
      <>
        Completely open source and community-driven. View the code on{' '}
        <Link href="https://github.com/LANCommander/LANCommander">GitHub</Link>, contribute
        improvements, or join the community on{' '}
        <Link href="https://discord.gg/vDEEWVt8EM">Discord</Link>.
      </>
    ),
  },
];

function Feature({title, icon, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4', styles.featureContainer)}>
      <div className={styles.featureCard}>
        <div className={styles.featureIcon}>{icon}</div>
        <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
        <p className={styles.featureDescription}>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <Heading as="h2" className={styles.sectionHeading}>Features</Heading>
        <p className={styles.sectionSubheading}>
          Everything you need to manage and distribute games across your local network.
        </p>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
