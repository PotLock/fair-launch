import { Link } from "@tanstack/react-router"

export const Footer = () => {
    return(
        <div className="w-full p-4 flex flex-col md:flex-row justify-between items-center gap-5 md:items-end lg:container mx-auto md:pt-20 pt-10">
            <div className="flex flex-col gap-4">
                <Link to={"/"} className="flex flex-row gap-2 items-center">
                    <img src="/logo.png" alt="logo" className="w-6 h-6" />
                    <span className="font-semibold">POTLAUNCH</span>
                </Link>
                <div className="flex flex-row gap-4 items-center">
                    <a href="https://potlock.org/community" target="_blank" className="h-6 w-6 bg-neutral-950 rounded-full flex justify-center items-center mt-0.5">
                        <img src="/icons/telegram.svg" alt="telegram" className="w-4 h-4" />
                    </a>
                    <a href="https://github.com/PotLock/fair-launch" target="_blank">
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
            <div className="flex flex-row gap-2">
                <a href="#" target="_blank" className="hover:underline">
                    <span>Privacy Policy</span>
                </a>
                <a href="#" target="_blank" className="hover:underline">
                    <span>Terms of use</span>
                </a>
            </div>
        </div>
    )
}