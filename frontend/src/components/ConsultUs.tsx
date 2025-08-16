export default function ConsultUs() {
    return (
        <div className="pt-[68px] md:px-10">
            <div className="w-full flex flex-col md:flex-row justify-center text-center md:text-start gap-2 md:justify-between items-center mb-5 md:mb-12">
                <h1 className="font-bold text-3xl">Launching a Token, Consult us</h1>
                <span className="md:max-w-[22rem] text-xl">Fast track your product via internet capital markets</span>
            </div>
            <div className="relative w-full overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div 
                        className="border border-gray-200 hover:border-gray-300 rounded-xl h-[250px] flex flex-col justify-center items-center p-8 text-center gap-2 cursor-pointer hover:shadow-md transition-shadow duration-300"
                        onClick={() => window.open('https://github.com/potlock/potlaunch', '_blank')}
                    >
                        <img src="/logos/github-3d.png" alt="GitHub" className="w-24 h-24" />
                        <h3 className="font-bold text-xl text-gray-900">
                            View code on GitHub
                        </h3>
                        <p className="text-gray-600 text-sm md:text-xs leading-relaxed">
                            Completely open source codebase with transparent development and community contributions
                        </p>
                    </div>
                    <div 
                        className="border border-gray-200 hover:border-gray-300 rounded-xl h-[250px] flex flex-col justify-center items-center p-8 text-center gap-2 cursor-pointer hover:shadow-md transition-shadow duration-300"
                        onClick={() => window.open('https://docs.potlaunch.com/docs/developer-guide/potlaunch-sdk', '_blank')}
                    >
                        <img src="/icons/book-sdk.png" alt="SDK" className="w-24 h-24" />
                        <h3 className="font-bold text-xl text-gray-900">
                            Developer SDK
                        </h3>
                        <p className="text-gray-600 text-sm md:text-xs leading-relaxed">
                            Comprehensive SDK for integrating POTLAUNCH features into your applications
                        </p>
                    </div>
                    <div
                        className="border border-gray-200 hover:border-gray-300 rounded-xl h-[250px] flex flex-col justify-center items-center p-8 text-center gap-2 cursor-pointer hover:shadow-md transition-shadow duration-300"
                        onClick={() => window.open('https://docs.potlaunch.com/docs/developer-guide/indexer-setup', '_blank')}
                    >
                        <img src="/icons/indexing.png" alt="Indexing" className="w-24 h-24" />
                        <h3 className="font-bold text-xl text-gray-900">
                            Indexing Tools
                        </h3>
                        <p className="text-gray-600 text-sm md:text-xs leading-relaxed">
                            Advanced indexing and analytics tools for tracking token performance and market data
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}