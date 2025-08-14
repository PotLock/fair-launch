import { Link } from "@tanstack/react-router"
import { useState } from "react";
import { TermsPrivacyModal } from "../TermsPrivacyModal";

export const Footer = () => {
    const [openModal, setOpenModal] = useState<null | "privacy" | "terms">(null);
    return(
        <div className="w-full p-4 flex flex-col md:flex-row justify-between items-center gap-5 md:items-end lg:container mx-auto md:pt-20 pt-10">
            <div className="flex flex-col gap-4">
                <Link to={"/"} className="flex flex-row gap-2 items-center">
                    <img src="/logo.png" alt="logo" className="w-7 h-7" />
                    <span className="font-semibold">POTLAUNCH</span>
                </Link>
                <div className="flex flex-row gap-4 items-center">
                    <a href="https://potlock.org/community" target="_blank" className="h-6 w-6 bg-neutral-950 rounded-full flex justify-center items-center mt-0.5">
                        <img src="/icons/telegram.svg" alt="telegram" className="w-4 h-4" />
                    </a>
                    <a href="https://github.com/PotLock/potlaunch" target="_blank">
                        <img src="/icons/github.svg" alt="github" className="h-6 w-6"/>
                    </a>
                    <a href="https://x.com/potlock_" target="_blank">
                        <img src="/icons/twitter-dark.svg" alt="telegram" className="w-6 h-6" />
                    </a>
                </div>
            </div>
            <div className="flex flex-row gap-1">
                <span>built with ❤️ by</span>
                <a href="https://www.potlock.org/" target="_blank" className="text-black underline">POTLOCK</a>
            </div>
            <div className="flex flex-col gap-2 items-end">
                <a href="https://docs.potlaunch.com/" target="_blank" className="hover:underline">
                    <span>Docs</span>
                </a>
                <div className="flex flex-row gap-2">
                    <a href="#" target="_blank" className="hover:underline" id="privacy-link" onClick={e => { e.preventDefault(); setOpenModal("privacy"); }}>
                        <span>Privs</span>
                    </a>
                    <a href="#" target="_blank" className="hover:underline" id="terms-link" onClick={e => { e.preventDefault(); setOpenModal("terms"); }}>
                        <span>Terms</span>
                    </a>
                </div>
            </div>
            <TermsPrivacyModal
                open={openModal === "privacy"}
                onOpenChange={(open: boolean) => setOpenModal(open ? openModal : null)}
                type="privacy"
            />
            <TermsPrivacyModal
                open={openModal === "terms"}
                onOpenChange={(open: boolean) => setOpenModal(open ? openModal : null)}
                type="terms"
            />
        </div>
    )
}