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
    src: '/img/screenshots/admin/dashboard.jpg',
    alt: 'Dashboard',
    label: 'Dashboard',
    caption: 'Monitor player activity and popular games',
  },
  {
    src: '/img/screenshots/admin/games-covers.jpg',
    alt: 'Game Covers',
    label: 'Game Library',
    caption: 'Manage your game collection via the web UI',
  },
  {
    src: '/img/screenshots/admin/games-list.jpg',
    alt: 'Game List',
    label: 'Game Filtering',
    caption: 'Find games quickly with flexible filters',
  },
  {
    src: '/img/screenshots/admin/game-edit.jpg',
    alt: 'Game Editing',
    label: 'Game Editing',
    caption: 'Edit metadata, versions, actions, and more',
  },
  {
    src: '/img/screenshots/admin/script-editor.jpg',
    alt: 'Script Editor',
    label: 'Script Editor',
    caption: 'Write install and launch scripts with completions',
  },
  {
    src: '/img/screenshots/admin/server-monitor.jpg',
    alt: 'Server Monitor',
    label: 'Server Management',
    caption: 'Manage and monitor game servers from one interface',
  },
  {
    src: '/img/screenshots/admin/pages.jpg',
    alt: 'Pages',
    label: 'Pages',
    caption: 'Publish pages with live game and server embeds',
  },
  {
    src: '/img/screenshots/admin/plugins.jpg',
    alt: 'Plugins',
    label: 'Plugins',
    caption: 'Extend LANCommander with plugins from NuGet',
  },
  {
    src: '/img/screenshots/admin/chat.jpg',
    alt: 'Chat',
    label: 'Chat',
    caption: 'Chat with players from the web UI or the launcher',
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
