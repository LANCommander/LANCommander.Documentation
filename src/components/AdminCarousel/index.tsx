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
    src: '/img/screenshots/admin/games.png',
    alt: 'Game Management',
    label: 'Game Management',
    caption: 'Manage your game collection via the admin web UI',
  },
  {
    src: '/img/screenshots/admin/servers.png',
    alt: 'Server Management',
    label: 'Server Management',
    caption: 'Manage game servers from one interface',
  },
  {
    src: '/img/screenshots/admin/redistributables.png',
    alt: 'Redistributable Management',
    label: 'Redistributable Management',
    caption: 'Manage common redistributables and assign them to games',
  },
  {
    src: '/img/screenshots/admin/dashboard.png',
    alt: 'Dashboarding',
    label: 'Dashboarding',
    caption: 'Monitor player activity and popular games',
  },
  {
    src: '/img/screenshots/admin/issues.png',
    alt: 'Issue Tracking',
    label: 'Issue Tracking',
    caption: 'Collect and track issues submitted by users for games',
  },
  {
    src: '/img/screenshots/admin/collections.png',
    alt: 'Game Collections',
    label: 'Game Collections',
    caption: 'Sort and categorize games with metadata',
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

export default function AdminCarousel(): ReactNode {
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
