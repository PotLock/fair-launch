import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function ConsultUs() {
    const rootRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
            gsap.from('.cu-title', {
                y: 20,
                opacity: 0,
                duration: 0.6,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: rootRef.current,
                    start: 'top 80%',
                    once: true,
                },
            });
            gsap.from('.cu-subtitle', {
                y: 16,
                opacity: 0,
                duration: 0.5,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: rootRef.current,
                    start: 'top 78%',
                    once: true,
                },
            });
            gsap.utils.toArray<HTMLElement>('.cu-card').forEach((el, i) => {
                gsap.from(el, {
                    y: 24,
                    opacity: 0,
                    duration: 0.5,
                    ease: 'power3.out',
                    delay: Math.min(i * 0.06, 0.4),
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 90%',
                        toggleActions: 'play none none reverse',
                    },
                })
            })
        }, rootRef);
        return () => ctx.revert();
    }, []);

    return (
        <div className="pt-[68px] md:px-6" ref={rootRef}>
            <div className="w-full flex flex-col md:flex-row justify-center text-center md:text-start gap-2 md:justify-between items-center mb-5 md:mb-12">
                <h1 className="font-bold text-3xl md:max-w-[20rem] cu-title">Launching a Token, Consult us</h1>
                <span className="md:max-w-[22rem] text-xl cu-subtitle">Fast track your product via internet capital markets</span>
            </div>
            <div className="relative w-full overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div 
                        className="border border-gray-200 hover:border-gray-300 rounded-xl h-[250px] flex flex-col justify-center items-center p-8 text-center gap-2 cursor-pointer hover:shadow-md transition-shadow duration-300 cu-card"
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
                        className="border border-gray-200 hover:border-gray-300 rounded-xl h-[250px] flex flex-col justify-center items-center p-8 text-center gap-2 cursor-pointer hover:shadow-md transition-shadow duration-300 cu-card"
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
                        className="border border-gray-200 hover:border-gray-300 rounded-xl h-[250px] flex flex-col justify-center items-center p-8 text-center gap-2 cursor-pointer hover:shadow-md transition-shadow duration-300 cu-card"
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