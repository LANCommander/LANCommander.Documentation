import { useEffect } from 'react';
import type { ReactNode } from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import { useHistory } from '@docusaurus/router';
import Layout from '@theme/Layout';

interface LatestRelease {
  version: string;
  to: string;
}

interface LatestReleaseRedirectProps {
  latest: LatestRelease;
}

// The route this renders is resolved at build time to whatever the newest
// release is, so it must never be treated as a permanent alias of that
// version: hence the replace() instead of a push, and the noindex.
export default function LatestReleaseRedirect({
  latest,
}: LatestReleaseRedirectProps): ReactNode {
  const history = useHistory();

  useEffect(() => {
    history.replace(latest.to);
  }, [history, latest.to]);

  return (
    <Layout title={`Redirecting to ${latest.version}`}>
      <Head>
        <meta httpEquiv="refresh" content={`0; url=${latest.to}`} />
        <meta name="robots" content="noindex, follow" />
      </Head>
      <main className="container margin-vert--lg">
        <p>
          Redirecting to the latest release,{' '}
          <Link to={latest.to}>{latest.version}</Link>…
        </p>
      </main>
    </Layout>
  );
}
