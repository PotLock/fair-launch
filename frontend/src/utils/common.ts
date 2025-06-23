const steps = [
    {
      title: 'Basic Information',
      description: 'Token Name, Symbol & Supply',
    },
    {
      title: 'Allocation',
      description: 'How tokens are distributed',
    },
    {
      title: 'Vesting',
      description: 'Release schedule for allocated tokens',
    },
    {
      title: 'Bonding Curve',
      description: 'Price mechanism',
    },
    {
      title: 'Liquidity',
      description: 'Where token will be launched',
    },
    {
      title: 'Fees',
      description: 'Transaction fees',
    },
    {
      title: 'Launchpad',
      description: 'Public sale configuration',
    },
    {
      title: 'Review & Deploy',
      description: 'Review and deploy to chain',
    },
  ];


const DEFAULT_ALLOCATION = {
  description: "",
  percentAllocate: 0,
  walletAddress: "",
  lockupPeriod: 0,
};

const LIST_STEPS = [
  { title: "Basic info" },
  { title: "Government" },
  { title: "Launchpad" },
  { title: "Allocation" },
];

const PREFIX_TOKEN = {
  CURVE_CONFIGURATION_SEED: "curve_configuration",
  POOL_SEED_PREFIX: "bonding_curve",
  SOL_VAULT_PREFIX: "liquidity_sol_vault",
  FEE_POOL_SEED_PREFIX: "fee_pool",
  FEE_POOL_VAULT_PREFIX: "fee_pool_vault",
};

const LAUNCHPAD_TYPE_OPTIONS = [
  {
    label: "Bonding Curve",
    value: "Bonding Curve",
  },
];

export {
  steps,
  DEFAULT_ALLOCATION,
  LIST_STEPS,
  PREFIX_TOKEN,
  LAUNCHPAD_TYPE_OPTIONS
}
