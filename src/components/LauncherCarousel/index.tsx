import type {ReactNode} from 'react';
import {useState, useEffect, useCallback} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

type Screenshot = {
  src: string;
  alt: string;
  label: string;
  caption: string;
};

const screenshots: Screenshot[] = [
  {
    src: '/img/screenshots/launcher/library.jpg',
    alt: 'Game Library',
    label: 'Game Library',
    caption: 'Recently played games and collections front and center',
  },
  {
    src: '/img/screenshots/launcher/depot.jpg',
    alt: 'Depot',
    label: 'Depot',
    caption: 'Browse every game available on your server',
  },
  {
    src: '/img/screenshots/launcher/depot-carousels.jpg',
    alt: 'Depot Carousels',
    label: 'Depot Carousels',
    caption: 'Discover games through categorized carousels',
  },
  {
    src: '/img/screenshots/launcher/game-details.jpg',
    alt: 'Game Details',
    label: 'Game Details',
    caption: 'Rich metadata and art for every game',
  },
  {
    src: '/img/screenshots/launcher/media-lightbox.jpg',
    alt: 'Media Lightbox',
    label: 'Media',
    caption: 'Screenshots and videos in a full-screen lightbox',
  },
  {
    src: '/img/screenshots/launcher/game-servers.jpg',
    alt: 'Game Servers',
    label: 'Servers',
    caption: 'See which servers are running for a game',
  },
  {
    src: '/img/screenshots/launcher/manage-versions.jpg',
    alt: 'Manage Versions',
    label: 'Versions',
    caption: 'Switch between published versions of a game',
  },
  {
    src: '/img/screenshots/launcher/manage-saves.jpg',
    alt: 'Save Management',
    label: 'Save Management',
    caption: 'Save sync keeps your progress across devices',
  },
  {
    src: '/img/screenshots/launcher/downloads.jpg',
    alt: 'Download Queue',
    label: 'Download Queue',
    caption: 'Monitor active downloads with a clear queue view',
  },
];

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function LauncherCarousel(): ReactNode {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const next = useCallback(
    () => setCurrent(c => (c + 1) % screenshots.length),
    [],
  );
  const prev = useCallback(
    () => setCurrent(c => (c - 1 + screenshots.length) % screenshots.length),
    [],
  );

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(next, 4500);
    return () => clearInterval(timer);
  }, [isHovered, next]);

  return (
    <div
      className={styles.wrapper}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      <div className={styles.frame}>
        <div className={styles.chrome}>
          <div className={styles.chromeTitle}>{screenshots[current].label}</div>
        </div>
        <div className={styles.slides}>
          {screenshots.map((s, i) => (
            <div
              key={i}
              className={clsx(styles.slide, i === current && styles.active)}
              aria-hidden={i !== current}>
              <img
                src={s.src}
                alt={s.alt}
                className={styles.screenshot}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
          <button
            className={clsx(styles.arrow, styles.prevArrow)}
            onClick={prev}
            aria-label="Previous screenshot">
            <ChevronLeft />
          </button>
          <button
            className={clsx(styles.arrow, styles.nextArrow)}
            onClick={next}
            aria-label="Next screenshot">
            <ChevronRight />
          </button>
        </div>
      </div>
      <div className={styles.controls}>
        <p className={styles.caption}>{screenshots[current].caption}</p>
        <div className={styles.dots}>
          {screenshots.map((_, i) => (
            <button
              key={i}
              className={clsx(styles.dot, i === current && styles.dotActive)}
              onClick={() => setCurrent(i)}
              aria-label={`View screenshot ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
