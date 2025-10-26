import { ExchangeType } from "../types";

export const exchanges: ExchangeType[] = [
    {
      title: 'Fair Launch',
      desc: 'Equal opportunity for all participants at the same price.',
      pricing: [
        { label: 'Fixed Price', icon: '/icons/dollar-sign.svg', color: 'bg-emerald-50 text-emerald-700' },
        { label: 'Bonding Curve', icon: '/icons/line-chart.svg', color: 'bg-orange-50 text-orange-700' },
      ],
      value: 'fair-launch',
    },
    {
      title: 'Whitelist',
      desc: 'Only pre-approved addresses can participate initially',
      pricing: [
        { label: 'Fixed Price', icon: '/icons/dollar-sign.svg', color: 'bg-emerald-50 text-emerald-700' },
        { label: 'Bonding Curve', icon: '/icons/line-chart.svg', color: 'bg-orange-50 text-orange-700' },
      ],
      value: 'whitelist',
    },
    {
      title: 'Auction',
      desc: 'Price determined by market demand through bidding',
      pricing: [
        { label: 'Fixed Price', icon: '/icons/dollar-sign.svg', color: 'bg-emerald-50 text-emerald-700' },
        { label: 'Bonding Curve', icon: '/icons/line-chart.svg', color: 'bg-orange-50 text-orange-700' },
      ],
      value: 'auction',
    },
    {
      title: 'Whitelist Sale',
      desc: 'Only pre-approved addresses can participate initially',
      pricing: [
        { label: 'Fixed Price', icon: '/icons/dollar-sign.svg', color: 'bg-emerald-50 text-emerald-700' },
        { label: 'Bonding Curve', icon: '/icons/line-chart.svg', color: 'bg-orange-50 text-orange-700' },
      ],
      value: 'whitelist-sale',
    },
  ];