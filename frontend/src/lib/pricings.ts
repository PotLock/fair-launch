import { PricingOption, SaleType } from "../types";

export const saleTypes: SaleType[] = [
    {
      label: "Fair Launch",
      icon: '/icons/rocket.svg',
      color: "bg-emerald-50 text-green-600",
      value: "fair-launch",
    },
    {
      label: "Whitelist Sale",
      icon: '/icons/list.svg',
      color: "bg-indigo-50 text-indigo-600",
      value: "whitelist-sale",
    },
    {
      label: "Fixed Price Sale",
      icon: '/icons/tag.svg',
      color: "bg-yellow-50 text-yellow-700",
      value: "fixed-price-sale",
    },
  ];
  
export const pricingOptions: PricingOption[] = [
    {
      key: "fixed-price",
      title: "Fixed Price",
      desc: "Set a specific price per token that doesn't change during the sale",
      badges: [saleTypes[0], saleTypes[1], saleTypes[2]],
    },
    {
      key: "bonding-curve",
      title: "Bonding Curve",
      desc: "Price increases automatically as more tokens are sold",
      badges: [saleTypes[0], saleTypes[1], saleTypes[2]],
    },
];