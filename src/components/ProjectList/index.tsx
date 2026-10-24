import type { ReactNode } from 'react';

import styles from './styles.module.css';

export interface Project {
  name: string;
  /** The game the project is built around, when it isn't obvious from the name. */
  game?: string;
  description: string;
  /** GitHub repository as owner/name. */
  repo: string;
  /** Optional landing page or documentation outside of GitHub. */
  url?: string;
}

function ProjectCard({project}: {project: Project}): ReactNode {
  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>{project.name}</h3>
      {project.game && <p className={styles.game}>{project.game}</p>}

      <p className={styles.cardDescription}>{project.description}</p>

      <div className={styles.cardLinks}>
        <a href={`https://github.com/${project.repo}`} target="_blank" rel="noopener noreferrer">
          Source
        </a>
        {project.url && (
          <a href={project.url} target="_blank" rel="noopener noreferrer">
            Website
          </a>
        )}
      </div>
    </div>
  );
}

export default function ProjectList({projects}: {projects: Project[]}): ReactNode {
  if (projects.length === 0) {
    return <p className={styles.empty}>Nothing to show here yet.</p>;
  }

  return (
    <div className={styles.grid}>
      {[...projects]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((project) => (
          <ProjectCard key={project.repo} project={project} />
        ))}
    </div>
  );
}
