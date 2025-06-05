import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

const adminStructures = [
  'Single Wallet',
  'Multisig',
  'DAO',
];

export const AdminSetup = () => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [revokeMint, setRevokeMint] = useState<boolean>(false);
    const [revokeFreeze, setRevokeFreeze] = useState<boolean>(false);
    const [adminWallet, setAdminWallet] = useState<string>('');
    const [adminStructure, setAdminStructure] = useState<string>(adminStructures[0]);
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 w-full">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex flex-col">
                    <div className={`${isExpanded ? 'text-black text-base font-semibold' : 'text-sm text-gray-500'}`}>Admin Setup</div>
                    {
                        isExpanded && (
                            <span className="text-xs text-gray-500">Who controls your token?</span>
                        )
                    }
                </div>
                {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
            </div>
            {isExpanded && (
                <div className="space-y-6 mt-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <div className="font-medium text-sm">Revoke Mint Authority</div>
                                <div className="text-xs text-gray-400">Prevent the ability to create new tokens</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRevokeMint((v) => !v)}
                                className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 ease-in-out ${revokeMint ? 'bg-black' : 'bg-gray-200'}`}
                            >
                                <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out ${revokeMint ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <div className="font-medium text-sm">Revoke Freeze Authority</div>
                                <div className="text-xs text-gray-400">Ability to freeze token accounts</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRevokeFreeze((v) => !v)}
                                className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 ease-in-out ${revokeFreeze ? 'bg-black' : 'bg-gray-200'}`}
                            >
                                <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out ${revokeFreeze ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                        </div>
                    </div>
                <div className='space-y-1'>
                    <Label className="font-medium">Admin Wallet Address</Label>
                    <Input
                        placeholder="Your Wallet  address that will control the token"
                        value={adminWallet}
                        onChange={e => setAdminWallet(e.target.value)}
                        className="mt-1"
                    />
                    <div className="text-sm text-gray-500 mt-1">This wallet will have authority to manage the token after deployment</div>
                </div>
                <div>
                    <Label className="font-medium">Admin Structure</Label>
                    <div className="relative mt-1">
                    <div
                        className="w-full p-2 border border-gray-200 rounded-md cursor-pointer flex justify-between items-center bg-gray-50 hover:border-gray-400"
                        onClick={() => setDropdownOpen((v) => !v)}
                    >
                        <span className="text-sm">{adminStructure}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                    {dropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                        {adminStructures.map((structure) => (
                            <div
                            key={structure}
                            className={`p-2 text-sm cursor-pointer hover:bg-gray-100 ${adminStructure === structure ? 'bg-gray-50' : ''}`}
                            onClick={() => { setAdminStructure(structure); setDropdownOpen(false); }}
                            >
                            {structure}
                            </div>
                        ))}
                        </div>
                    )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">How token management decisions will be made</div>
                </div>
                </div>
            )}
        </div>
    );
}