import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';
import RedistributableList from '@site/src/components/RedistributableList';

import styles from './Redistributables.module.css';

const HUB_URL = 'https://github.com/LANCommander/LANCommander.Redistributables';

export default function Redistributables(): ReactNode {
  return (
    <Layout
      title="Redistributables"
      description="Download pre-built redistributable import packages for LANCommander.">
      <header className={styles.header}>
        <div className="container">
          <Heading as="h1" className={styles.title}>
            Redistributables
          </Heading>
          <p className={styles.subtitle}>
            Pre-built <code>.LCX</code> packages you can import straight into your server &mdash;
            each one a runtime, library or compatibility shim, already wired up with its detect,
            install and configuration scripts.
          </p>
        </div>
      </header>

      <main className={styles.main}>
        <div className="container">
          <section className={styles.section}>
            <p>
              <Link to="/Server/Redistributables">Redistributables</Link> are the common runtimes
              and libraries a game needs in order to run. Building one by hand means uploading an
              archive, writing detect and install scripts, and authoring an option schema in the
              admin UI. The packages below skip all of that: each is built automatically from its
              upstream project, versioned to match it, and published as a single importable file.
            </p>
            <p>
              They are produced by the{' '}
              <a href={HUB_URL} target="_blank" rel="noopener noreferrer">
                LANCommander.Redistributables
              </a>{' '}
              project, where each package lives in its own repository with a scheduled job watching
              upstream for new releases.
            </p>
          </section>

          <section className={styles.section}>
            <Heading as="h2">Importing a package</Heading>
            <p>
              Download the <code>.lcx</code> file and import it from your server&rsquo;s{' '}
              <strong>Redistributables</strong> page, or from the launcher&rsquo;s headless mode
              while signed in as an administrator:
            </p>
            <CodeBlock language="powershell">
              LANCommander.Launcher Import --Path redistributable.lcx --Type Redistributable
            </CodeBlock>
            <p>
              The identifiers inside each package are stable across releases, so importing a newer
              version <strong>updates</strong> the existing entry rather than creating a duplicate
              alongside it. Every package also ships a <code>Package</code> script, so a server can
              import once and then keep itself up to date from that repository&rsquo;s releases.
            </p>
            <p>
              For scripting, every repository exposes a permanent URL that always resolves to its
              newest package:
            </p>
            <CodeBlock language="text" className={styles.wrapCode}>
              https://github.com/LANCommander/LANCommander.Redistributables.&lt;Name&gt;/releases/latest/download/redistributable.lcx
            </CodeBlock>
          </section>

          <section className={styles.section}>
            <Heading as="h2">Available packages</Heading>
            <RedistributableList />
          </section>
        </div>
      </main>
    </Layout>
  );
}
