import React from 'react'
import { M_PLUS_1p } from "next/font/google"
import { OverlayCard } from './overlay-card'

const mPlus1p = M_PLUS_1p({
    subsets: ['latin'],
    weight: ['500']
})

const HowItWorks = () => {

    const overlayCardData = [
        {
            title: "Create your profile",
            content: "Showcase your skills, experience, and what you're looking to build. Our profiles focus on what matters - your abilities and goals.",
            imgUrl: "https://ik.imagekit.io/ixcfmut8e/hackmate/fwefwef.PNG",
            gifUrl: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGV2YmR4bnN6MzJoYXJla2QzN28wdjdzYTg3N3Y0dGg5bW0yMjJrdCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/FvK8SzkBAzHvEAwb6r/giphy.gif"
        },
        {
            title: "Swipe to match",
            content: "Browse potential collaborators and express interest with a simple swipe. Our algorithm helps find people who match your skillset.",
            imgUrl: "https://ik.imagekit.io/ixcfmut8e/hackmate/fggwfw.PNG",
            gifUrl: "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGZqN3AzMHBiNmFhMjdzN29xbzE4YWtjM2h4aXNlemdmbGs3NzZrZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/TjuKLi9mwaNlNnT3fT/giphy.gif"
        },
        {
            title: "Connect & build",
            content: "When there's mutual interest, start a conversation and begin collaborating on your next big idea.",
            imgUrl: "https://ik.imagekit.io/ixcfmut8e/hackmate/fqewfwqe.PNG",
            gifUrl: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdHVrOWxsYTE2azBub2puNXF5bHhha3o0MnN5djNpcG90MmNrcWRsMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/IrH7rEXjLLbbyW0KX2/giphy.gif"
        }
    ]
    return (
        <section className="w-full pt-8 md:py-4 px-4 sm:px-6 lg:px-8 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                {/* Centered heading with responsive typography */}
                <div className="text-center mb-2 md:mb-4">
                    <h1 className={`${mPlus1p.className} text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4`}>
                        How it Works
                    </h1>
                </div>

                {/* Responsive card grid with centered layout and proper spacing */}
                    <div className="relative py-8 px-4">
                        {/* Rhombus mesh background with enhanced fade-in effect */}
                        <div 
                            className="absolute left-0 right-0 -bottom-16 -top-4 lg:-left-32 lg:-right-32 lg:-bottom-20 opacity-80"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M12 0L24 12L12 24L0 12z' stroke='%23004a8a' stroke-width='1.2'/%3E%3C/g%3E%3C/svg%3E")`,
                                backgroundSize: '22px 22px',
                                backgroundPosition: '0 0, 12px 12px',
                                maskImage: `
                                    radial-gradient(ellipse 110% 90% at center, 
                                        rgba(0,0,0,0) 0%, 
                                        rgba(0,0,0,0.1) 15%, 
                                        rgba(0,0,0,0.3) 25%, 
                                        rgba(0,0,0,0.6) 35%, 
                                        rgba(0,0,0,0.8) 45%, 
                                        rgba(0,0,0,0.95) 55%, 
                                        rgba(0,0,0,0.8) 65%, 
                                        rgba(0,0,0,0.6) 75%, 
                                        rgba(0,0,0,0.3) 85%, 
                                        rgba(0,0,0,0.1) 95%, 
                                        rgba(0,0,0,0) 100%
                                    ),
                                    linear-gradient(to right, 
                                        rgba(0,0,0,0) 0%, 
                                        rgba(0,0,0,0.05) 5%, 
                                        rgba(0,0,0,0.2) 15%, 
                                        rgba(0,0,0,0.5) 25%, 
                                        rgba(0,0,0,0.8) 35%, 
                                        rgba(0,0,0,1) 50%, 
                                        rgba(0,0,0,0.8) 65%, 
                                        rgba(0,0,0,0.5) 75%, 
                                        rgba(0,0,0,0.2) 85%, 
                                        rgba(0,0,0,0.05) 95%, 
                                        rgba(0,0,0,0) 100%
                                    ),
                                    linear-gradient(to bottom, 
                                        rgba(0,0,0,0) 0%, 
                                        rgba(0,0,0,0.1) 8%, 
                                        rgba(0,0,0,0.4) 18%, 
                                        rgba(0,0,0,0.7) 28%, 
                                        rgba(0,0,0,0.9) 35%, 
                                        rgba(0,0,0,1) 50%, 
                                        rgba(0,0,0,0.9) 65%, 
                                        rgba(0,0,0,0.7) 72%, 
                                        rgba(0,0,0,0.4) 82%, 
                                        rgba(0,0,0,0.1) 92%, 
                                        rgba(0,0,0,0) 100%
                                    )
                                `,
                                WebkitMaskImage: `
                                    radial-gradient(ellipse 110% 90% at center, 
                                        rgba(0,0,0,0) 0%, 
                                        rgba(0,0,0,0.1) 15%, 
                                        rgba(0,0,0,0.3) 25%, 
                                        rgba(0,0,0,0.6) 35%, 
                                        rgba(0,0,0,0.8) 45%, 
                                        rgba(0,0,0,0.95) 55%, 
                                        rgba(0,0,0,0.8) 65%, 
                                        rgba(0,0,0,0.6) 75%, 
                                        rgba(0,0,0,0.3) 85%, 
                                        rgba(0,0,0,0.1) 95%, 
                                        rgba(0,0,0,0) 100%
                                    ),
                                    linear-gradient(to right, 
                                        rgba(0,0,0,0) 0%, 
                                        rgba(0,0,0,0.05) 5%, 
                                        rgba(0,0,0,0.2) 15%, 
                                        rgba(0,0,0,0.5) 25%, 
                                        rgba(0,0,0,0.8) 35%, 
                                        rgba(0,0,0,1) 50%, 
                                        rgba(0,0,0,0.8) 65%, 
                                        rgba(0,0,0,0.5) 75%, 
                                        rgba(0,0,0,0.2) 85%, 
                                        rgba(0,0,0,0.05) 95%, 
                                        rgba(0,0,0,0) 100%
                                    ),
                                    linear-gradient(to bottom, 
                                        rgba(0,0,0,0) 0%, 
                                        rgba(0,0,0,0.1) 8%, 
                                        rgba(0,0,0,0.4) 18%, 
                                        rgba(0,0,0,0.7) 28%, 
                                        rgba(0,0,0,0.9) 35%, 
                                        rgba(0,0,0,1) 50%, 
                                        rgba(0,0,0,0.9) 65%, 
                                        rgba(0,0,0,0.7) 72%, 
                                        rgba(0,0,0,0.4) 82%, 
                                        rgba(0,0,0,0.1) 92%, 
                                        rgba(0,0,0,0) 100%
                                    )
                                `,
                                maskComposite: 'intersect',
                                WebkitMaskComposite: 'source-in'
                            }}
                        />
                        
                        {/* Additional subtle glow effect for enhanced visibility */}
                        <div 
                            className="absolute left-0 right-0 -bottom-8 -top-2 lg:-left-16 lg:-right-16 lg:-bottom-12 opacity-30 pointer-events-none"
                            style={{
                                background: `
                                    radial-gradient(ellipse 80% 60% at center, 
                                        rgba(0, 74, 138, 0.15) 0%, 
                                        rgba(0, 74, 138, 0.1) 30%, 
                                        rgba(0, 74, 138, 0.05) 60%, 
                                        transparent 100%
                                    )
                                `,
                                filter: 'blur(1px)'
                            }}
                        />
                    {/* Card grid content */}
                    <div className='px-6'>
                        <div className="relative flex flex-col lg:flex-row justify-center items-center lg:items-stretch gap-4 sm:gap-6 lg:gap-8 xl:gap-12">
                            {overlayCardData.map((card, index) => (
                                <div key={index} className="w-full max-w-xs sm:max-w-sm lg:max-w-xs xl:max-w-sm flex-shrink-0">
                                    <OverlayCard 
                                        title={card.title}
                                        content={card.content}
                                        imgUrl={card.imgUrl}
                                        gifUrl={card.gifUrl}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default HowItWorks
