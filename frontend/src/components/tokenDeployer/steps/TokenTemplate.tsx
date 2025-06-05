const tokenTemplates = [
    {
      key: 'meme',
      label: 'Meme Coin',
      description: 'Perfect for viral, community-driven tokens with meme appeal.',
      icon: <img src="/icons/meme-token.svg" alt="Meme Token" width={24} height={24} />,
      badge: 'POPULAR',
      badgeColor: 'bg-green-500',
    },
    {
      key: 'utility',
      label: 'Utility Token',
      description: 'For tokens with real-world utility and use cases',
      icon: <img src="/icons/utility-token.svg" alt="Utility Token" width={24} height={24} />,
    },
    {
      key: 'governance',
      label: 'Governance Token',
      description: 'Community controlled tokens with voting rights.',
      icon: <img src="/icons/governance-token.svg" alt="Governance Token" width={24} height={24} />,
    },
    {
      key: 'gaming',
      label: 'Gaming Token',
      description: 'In game currencies and gaming ecosystem tokens.',
      icon: <img src="/icons/gaming-token.svg" alt="Gaming Token" width={24} height={24} />,
    },
    {
      key: 'custom',
      label: 'Custom Token',
      description: 'Full control over all parameters for advanced users.',
      icon: <img src="/icons/custom-token.svg" alt="Custom Token" width={24} height={24} />,
    },
];

export const TokenTemplate = ({ selected, setSelected }: { selected: string, setSelected: (key: string) => void }) => {
    return (
        <div className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tokenTemplates.map((tpl) => (
              <button
                key={tpl.key}
                className={`relative flex flex-col items-start p-4 border rounded-lg text-left focus:outline-none ${selected === tpl.key ? 'border-gray-500 bg-gray-50' : 'border-gray-200'}`}
                onClick={() => setSelected(tpl.key)}
              >
                <div className="flex items-center gap-2 mb-2">
                  {tpl.icon}
                  <span className="font-semibold text-base">{tpl.label}</span>
                  {tpl.badge && (
                    <span className={`ml-2 text-xs text-white px-2 py-0.5 rounded ${tpl.badgeColor}`}>{tpl.badge}</span>
                  )}
                </div>
                <span className="text-xs text-gray-600">{tpl.description}</span>
              </button>
            ))}
          </div>
        </div>
    )
}
