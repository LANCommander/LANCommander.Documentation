import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import ProjectList, {type Project} from '@site/src/components/ProjectList';

import styles from './Projects.module.css';

// Add a project by appending it to the projects list of its section. Sections
// with nothing in them still render, so the page keeps its shape while empty.
const sections: {id: string; title: string; description: string; projects: Project[]}[] = [
  {
    id: 'ports',
    title: 'Ports',
    description: 'Games brought to new platforms, architectures, and operating systems.',
    projects: [
      { name: 'Tony Was A Pro Skater', description: 'A native Windows and Linux port of the first entry in the iconic series, built from a full decompilation of the original game.', repo: 'LANCommander/TonyWasAProSkater' },
      { name: 'Hydro Thunder Online', description: 'Previously limited to only the arcade release of the game, race with up to 16 simultaneous racers in this wet and wild arcade classic online or on your local network.', repo: 'LANCommander/HydroThunderOnline' }
    ],
  },
  {
    id: 'patches',
    title: 'Patches',
    description:
      'Fixes and enhancements for existing games, from compatibility and networking fixes to quality-of-life improvements.',
    projects: [
      { name: 'DethKarz', description: 'A comprehensive set of patches for the game DethKarz introducing widescreen, high framerate support, modern controllers, network stability, and 16 player races over the network.', repo: 'LANCommander/LANCommander.Patches.DethKarz' },
      { name: 'Plane Crazy', description: 'A comprehensive set of patches for the game Plane Crazy introducing widescreen, high framerate support, modern controllers, and 16 player races over the network.', repo: 'LANCommander/LANCommander.Patches.PlaneCrazy' },
      { name: 'Motocross Madness 2', description: 'A comprehensive set of patches for the game Motocross Madness 2 introducing widescreen, high framerate support, and modern controller support.', repo: 'LANCommander/LANCommander.Patches.MotocrossMadness2' }
    ],
  },
];

export default function Projects(): ReactNode {
  return (
    <Layout
      title="Projects"
      description="Ports, and patches maintained under the LANCommander name.">
      <header className={styles.header}>
        <div className="container">
          <Heading as="h1" className={styles.title}>
            Projects
          </Heading>
          <p className={styles.subtitle}>
            Beyond LANCommander itself, we maintain a number of projects that help keep classic games playable on modern hardware and on the LAN.
          </p>
          <nav className={styles.sectionNav}>
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`}>
                {section.title}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <div className="container">
          {sections.map((section) => (
            <section key={section.id} className={styles.section}>
              <Heading as="h2" id={section.id}>
                {section.title}
              </Heading>
              <p className={styles.sectionDescription}>{section.description}</p>
              <ProjectList projects={section.projects} />
            </section>
          ))}
        </div>
      </main>
    </Layout>
  );
}
