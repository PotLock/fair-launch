import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { useDeployStore } from '../../../stores/deployStores';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { SliderCustom } from '../../ui/slider-custom';

const adminStructures = [
    {label: 'Single Wallet', value: 'single'},
    {label: 'Multi-Signature', value: 'multisig'},
    {label: 'DAO Controlled', value: 'dao'}
] as const;

type AdminStructureType = typeof adminStructures[number]['value'];

export const AdminSetup = () => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
    const { adminSetup, updateAdminSetup } = useDeployStore();

    const handleRevokeMintChange = (value: boolean) => {
        updateAdminSetup({ 
            revokeMintAuthority: {
                ...adminSetup.revokeMintAuthority,
                isEnabled: value
            }
        });
    };

    const handleRevokeFreezeChange = (value: boolean) => {
        updateAdminSetup({ 
            revokeFreezeAuthority: {
                ...adminSetup.revokeFreezeAuthority,
                isEnabled: value
            }
        });
    };

    const handleMintAuthorityWalletChange = (value: string) => {
        updateAdminSetup({
            revokeMintAuthority: {
                ...adminSetup.revokeMintAuthority,
                walletAddress: value
            }
        });
    };

    const handleFreezeAuthorityWalletChange = (value: string) => {
        updateAdminSetup({
            revokeFreezeAuthority: {
                ...adminSetup.revokeFreezeAuthority,
                walletAddress: value
            }
        });
    };

    const handleAdminWalletChange = (value: string) => {
        updateAdminSetup({ adminWalletAddress: value });
    };

    const handleAdminStructureChange = (value: AdminStructureType) => {
        updateAdminSetup({ adminStructure: value });
        setDropdownOpen(false);
    };

    const handleNumberOfSignaturesChange = (value: number) => {
        updateAdminSetup({ numberOfSignatures: value });
    };

    const handleTokenOwnerWalletChange = (value: string) => {
        updateAdminSetup({ tokenOwnerWalletAddress: value });
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 w-full">
            <div className="flex items-start justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
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
                        <div className="flex flex-col items-start mb-2 border border-gray-200 rounded-lg">
                            <div className={`flex items-center justify-between w-full p-3  ${adminSetup.revokeMintAuthority.isEnabled ? 'bg-gray-50 border-b border-gray-200 rounded-t-lg' : ''}`}>
                                <div>
                                    <div className="font-medium text-sm">Revoke Mint Authority</div>
                                    <div className="text-xs text-gray-400">Prevent the ability to create new tokens</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRevokeMintChange(!adminSetup.revokeMintAuthority.isEnabled)}
                                    className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 ease-in-out ${adminSetup.revokeMintAuthority.isEnabled ? 'bg-black' : 'bg-gray-200'}`}
                                >
                                    <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out ${adminSetup.revokeMintAuthority.isEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>
                            {
                                adminSetup.revokeMintAuthority.isEnabled && (
                                    <div className='flex flex-col gap-2 p-3 w-full'>
                                        <RadioGroup defaultValue="comfortable" className='w-full'>
                                            <div className="flex items-center gap-3">
                                                <RadioGroupItem value="default" id="r1" />
                                                <Label className='text-xs' htmlFor="r1">Same as Primary Admin</Label>
                                            </div> 
                                            <div className='flex flex-col gap-1 w-full'>
                                                <div className="flex items-center gap-3">
                                                    <RadioGroupItem value="comfortable" id="r2" />
                                                    <Label className='text-xs' htmlFor="r2">Different Wallet</Label>
                                                </div>
                                                <Input 
                                                    placeholder='Mint Authority Wallet Address' 
                                                    className='ml-5 mt-1 text-xs placeholder:text-xs w-[90%]'
                                                    value={adminSetup.revokeMintAuthority.walletAddress}
                                                    onChange={(e) => handleMintAuthorityWalletChange(e.target.value)}
                                                />
                                            </div>
                                        </RadioGroup>
                                    </div>
                                )
                            }
                        </div>
                        <div className="flex flex-col items-start mb-2 border border-gray-200 rounded-lg">
                            <div className={`flex items-center justify-between w-full p-3  ${adminSetup.revokeFreezeAuthority.isEnabled ? 'bg-gray-50 border-b border-gray-200 rounded-t-lg' : ''}`}>
                                <div>
                                    <div className="font-medium text-sm">Revoke Freeze Authority</div>
                                    <div className="text-xs text-gray-400">Ability to freeze token accounts</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRevokeFreezeChange(!adminSetup.revokeFreezeAuthority.isEnabled)}
                                    className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 ease-in-out ${adminSetup.revokeFreezeAuthority.isEnabled ? 'bg-black' : 'bg-gray-200'}`}
                                >
                                    <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out ${adminSetup.revokeFreezeAuthority.isEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>
                            {
                                adminSetup.revokeFreezeAuthority.isEnabled && (
                                    <div className='flex flex-col gap-2 p-3 w-full'>
                                        <RadioGroup defaultValue="comfortable" className='w-full'>
                                            <div className="flex items-center gap-3">
                                                <RadioGroupItem value="default" id="r1" />
                                                <Label className='text-xs' htmlFor="r1">Same as Primary Admin</Label>
                                            </div> 
                                            <div className='flex flex-col gap-1 w-full'>
                                                <div className="flex items-center gap-3">
                                                    <RadioGroupItem value="comfortable" id="r2" />
                                                    <Label className='text-xs' htmlFor="r2">Different Wallet</Label>
                                                </div>
                                                <Input 
                                                    placeholder='Freeze Authority Wallet Address' 
                                                    className='ml-5 mt-1 text-xs placeholder:text-xs w-[90%]'
                                                    value={adminSetup.revokeFreezeAuthority.walletAddress}
                                                    onChange={(e) => handleFreezeAuthorityWalletChange(e.target.value)}
                                                />
                                            </div>
                                        </RadioGroup>
                                    </div>
                                )
                            }
                        </div>
                    </div>
                    <div className='space-y-1'>
                        <Label className="font-medium">Admin Wallet Address</Label>
                        <Input
                            placeholder="Your Wallet  address that will control the token"
                            value={adminSetup.adminWalletAddress}
                            onChange={e => handleAdminWalletChange(e.target.value)}
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
                            <span className="text-sm">{adminStructures.find(s => s.value === adminSetup.adminStructure)?.label || adminSetup.adminStructure}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                        {dropdownOpen && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                            {adminStructures.map((structure) => (
                                <div
                                key={structure.value}
                                className={`p-2 text-sm cursor-pointer hover:bg-gray-100 ${adminSetup.adminStructure === structure.value ? 'bg-gray-50' : ''}`}
                                onClick={() => handleAdminStructureChange(structure.value as AdminStructureType)}
                                >
                                {structure.label}
                                </div>
                            ))}
                            </div>
                        )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">How token management decisions will be made</div>
                    </div>
                    
                    {(adminSetup.adminStructure === 'multisig' || adminSetup.adminStructure === 'dao') && (
                        <div className="mt-4">
                            <div className="text-lg font-semibold mb-1">Token Authority</div>
                            <div className="text-sm text-gray-500 mb-6">Who controls your token</div>
                            <div className="mb-5">
                                <Label className="font-medium">Token Owner Wallet Address</Label>
                                <Input
                                    placeholder="Public wallet address(e.g 4Zbc51.....0sErp)"
                                    value={adminSetup.tokenOwnerWalletAddress}
                                    onChange={e => handleTokenOwnerWalletChange(e.target.value)}
                                    className="mt-1"
                                />
                                <div className="text-xs text-gray-500 mt-1">This wallet will have authority to manage the token after deployment</div>
                            </div>
                            <div className="mb-5">
                                <Label className="font-medium">Authority Type</Label>
                                <div className="relative mt-1">
                                    <select
                                        className="w-full p-2 border border-gray-200 rounded-md bg-gray-100 text-gray-700"
                                        value={adminSetup.adminStructure}
                                        disabled
                                    >
                                        <option value="multisig">Multi-Signature</option>
                                        <option value="dao">DAO Controlled</option>
                                    </select>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">How token management decisions will be made</div>
                            </div>
                            {adminSetup.adminStructure === 'multisig' && (
                                <div className="mb-2">
                                    <Label className="font-medium">Required Signatures: {adminSetup.numberOfSignatures}</Label>
                                    <SliderCustom
                                        min={1}
                                        max={10}
                                        value={[adminSetup.numberOfSignatures]}
                                        onValueChange={([val]: number[]) => handleNumberOfSignaturesChange(val)}
                                        className="mt-2"
                                    />
                                    <div className="text-xs text-gray-500 mt-1">Number of Signatures required for administration action</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}