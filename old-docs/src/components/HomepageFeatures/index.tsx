import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  emoji: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Token Launchpad',
    emoji: '🚀',
    description: (
      <>
        Discover and participate in token launches on our platform. Browse through a curated list of 
        tokens created through bonding curves and support projects you believe in.
      </>
    ),
  },
  {
    title: 'Token Deployer',
    emoji: '🪙',
    description: (
      <>
        Easily create and deploy your own SPL tokens without coding. Our step-by-step wizard guides you 
        through token creation, bonding curves, liquidity setup, and DEX listing.
      </>
    ),
  },
  {
    title: 'Token Management',
    emoji: '📈',
    description: (
      <>
        View and manage all your created tokens in one place. Track your token performance, 
        trading activity, and detailed analytics with comprehensive charts and metrics.
      </>
    ),
  },
];

function Feature({title, emoji, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>  
      <div className="text--center" style={{ fontSize: '2.5rem', marginBottom: 8 }}>
        {emoji}
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
