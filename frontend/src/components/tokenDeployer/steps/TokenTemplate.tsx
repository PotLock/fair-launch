import { useDeployStore } from "../../../stores/deployStores";
import { tokenTemplates } from "../../../lib/templates";

export const TokenTemplate = () => {
    const { selectedTemplate, setSelectedTemplate } = useDeployStore();
    return (
        <div className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tokenTemplates.map((tpl) => (
              <button
                key={tpl.key}
                className={`relative flex flex-col items-start p-4 border rounded-lg text-left focus:outline-none ${selectedTemplate === tpl.key ? 'border-gray-500 bg-gray-50' : 'border-gray-200'}`}
                onClick={() => setSelectedTemplate(tpl.key)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <img src={tpl.icon} alt={tpl.label} className="w-6 h-6" />
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
