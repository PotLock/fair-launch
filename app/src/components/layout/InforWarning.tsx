export const InforWarning = () =>{
    return(
        <div className="p-5 w-full flex gap-3 md:gap-5 items-center h-10 bg-orange-400 justify-center">
            <img src="/icons/warning.svg" alt="warnign" className="w-5 h-5" />
            <span className="text-white text-xs md:text-sm">🚧 Development Mode - This is a testnet environment</span>
        </div>
    )
}