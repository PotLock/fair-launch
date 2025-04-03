import React from 'react';
import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/fair-launchpad/intro">
            Get Started with Fair LaunchPad
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Create and mint your own SPL Token without coding. Customize with metadata, supply, and add logo.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <div className="container margin-top--xl margin-bottom--xl">
          <div className="row">
            <div className="col col--8 col--offset-2">
              <div className="text--center margin-bottom--lg">
                <h2>Lauching your token in Minutes</h2>
                <p>
                  Fair LaunchPad provides a step-by-step process to create, configure, and launch your token
                  with professional-grade features that would normally require extensive development work.
                </p>
              </div>
              <div className="text--center">
                <Link
                  className="button button--primary button--lg"
                  to="/docs/fair-launchpad/intro">
                  Explore the Documentation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
