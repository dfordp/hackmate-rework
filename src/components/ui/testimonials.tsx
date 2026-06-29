import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";
import { motion } from "motion/react";
import { TestimonialItem, balanceTestimonialTypes } from "@/lib/testimonial-utils";
import { M_PLUS_1p } from "next/font/google";

const mPlus1p = M_PLUS_1p({
    subsets: ['latin'],
    weight: ['500']
})

const twitterTestimonials: TestimonialItem[] = [
    {
        type: "twitter",
        id: "twitter-1",
        content: "Lfg ❤️",
        authorName: "Kartik",
        authorHandle: "@code_kartik",
        postedOn: "September 22, 2025",
        tweetUrl: "https://x.com/code_kartik/status/1970102716899696646?ref_src=twsrc%5Etfw",
        lang: "und",
    },
    {
        type: "twitter",
        id: "twitter-2",
        content: "Lessgoooo 🔥",
        authorName: "Ameya",
        authorHandle: "@ameyaidk",
        postedOn: "September 22, 2025",
        tweetUrl: "https://x.com/ameyaidk/status/1970089201128653270?ref_src=twsrc%5Etfw",
        lang: "und",
    },
    {
        type: "twitter",
        id: "twitter-3",
        content: "This looks like a really fantastic project.. Great work Man",
        authorName: "Duru Victor Ikechukwu",
        authorHandle: "@iamduruvictor",
        postedOn: "September 22, 2025",
        tweetUrl: "https://x.com/iamduruvictor/status/1970167197051052042?ref_src=twsrc%5Etfw",
        lang: "en",
    },
    {
        type: "twitter",
        id: "twitter-4",
        content: "Lessgoo",
        authorName: "aditya",
        authorHandle: "@adxtyahq",
        postedOn: "September 22, 2025",
        tweetUrl: "https://x.com/adxtyahq/status/1970165220258509231?ref_src=twsrc%5Etfw",
        lang: "und",
    },
]

const testimonials: TestimonialItem[] = [
    ...twitterTestimonials,
    {
        type: "peerlist",
        id: "peerlist-1",
        author: {
            name: "Krishna Kant",
            username: "krixn",
            avatar: "https://dqy38fnwh4fqs.cloudfront.net/UHGNL96GAJ6EE781M6DJNPNNQBRM/hgnl96gaj6ee781m6djnpnnqbrm-2580-profile.webp",
            title: "Front End Dev",
        },
        content: "This is so coool and has great usecase",
    },
    {
        type: "peerlist",
        id: "peerlist-2",
        author: {
            name: "Rohan Sharma",
            username: "rohansrma",
            avatar: "https://dqy38fnwh4fqs.cloudfront.net/UH6AJB6DDEJONPO2RGQ7PQPQAOOR/h6ajb6ddejonpo2rgq7pqpqaoor-profile",
            title: "Web Developer || UI/UX designer",
        },
        content: "Let's see who's my match!",
    },
    {
        type: "peerlist",
        id: "peerlist-3",
        author: {
            name: "Naman Jain",
            username: "namanjain152003",
            avatar: "https://dqy38fnwh4fqs.cloudfront.net/UHR8D66P8R9EQERFDEPDDKQG6OAN/hr8d66p8r9eqerfdepddkqg6oan-5583-profile.webp",
            title: "Developer",
        },
        content: "Great work and solving the real world problem",
    },
    {
        type: "producthunt",
        id: "ph-1", 
        author: {
            name: "Bogdan Ivtsjenko",
            username: "bogdan_ivtsjenko1",
            avatar: "https://ph-avatars.imgix.net/6254640/0f0c3c29-8fdd-44d2-9b38-44ce44eafa06.jpeg?auto=compress&codec=mozjpeg&cs=strip&auto=format&w=120&h=120&fit=crop&frame=1&dpr=1",
            title: "Software Engineer",
            isMaker: false,
        },
        content: "This looks really cool! The real, time collaboration feature is impressive, especially how it can help with instant feedback.",
        badge: "daily_winner",
    },
    {
        type: "producthunt",
        id: "ph-2", 
        author: {
            name: "Richard Hummer",
            username: "bogdan_ivtsjenko1",
            avatar: "https://ph-avatars.imgix.net/9029221/a692966e-94fe-47d3-80ac-22adea8b59be.jpeg?auto=compress&codec=mozjpeg&cs=strip&auto=format&w=32&h=32&fit=crop&frame=1&dpr=2",
            title: "Growth Management",
            isMaker: false,
        },
        content: "damn! it’s rare to find a platform that connects builders so naturally",
        badge: "featured",
    }
];

const Testimonials = () => {
    // Responsive testimonial distribution
    // Mobile (< sm): All testimonials in 1 column
    // Tablet (sm to lg): All testimonials in 2 columns  
    // Desktop (lg+): All testimonials in 3 columns
    const mobileColumns = testimonials.length > 0 ? [testimonials] : [[]];
    const tabletColumns = testimonials.length > 0 ? balanceTestimonialTypes(testimonials, 2) : [[], []];
    const desktopColumns = testimonials.length > 0 ? balanceTestimonialTypes(testimonials, 3) : [[], [], []];

    return (
        <section className="my-12 sm:my-16 md:my-20 relative">
        {/* Dark blurred glass background */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-xl border border-gray-800/20 rounded-2xl sm:rounded-3xl"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/10 via-black/30 to-gray-900/10"></div>
        
        <div className="container z-10 mx-auto relative py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center max-w-2xl mx-auto"
            >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter mt-3 sm:mt-5 text-white text-center" style={{ ...mPlus1p.style, fontWeight: 600 }}>
                What our users say
            </h2>
            <p className="text-center mt-4 sm:mt-5 text-gray-300 text-base sm:text-lg max-w-lg">
                See what developers and makers are saying about Hackmate across different platforms.
            </p>
            </motion.div>

            {testimonials.length > 0 ? (
            <>
                {/* Mobile: Single column with all testimonials and optimized animation */}
                <div className="sm:hidden flex justify-center gap-4 mt-8 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[600px] overflow-hidden">
                    <TestimonialsColumn testimonials={mobileColumns[0]} duration={15} />
                </div>
                
                {/* Tablet: Two columns with all testimonials distributed */}
                <div className="hidden sm:flex lg:hidden justify-center gap-4 sm:gap-6 mt-8 sm:mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[600px] overflow-hidden">
                    <TestimonialsColumn testimonials={tabletColumns[0]} duration={15} />
                    <TestimonialsColumn testimonials={tabletColumns[1]} duration={19} />
                </div>
                
                {/* Desktop: Three columns */}
                <div className="hidden lg:flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
                    <TestimonialsColumn testimonials={desktopColumns[0]} duration={15} />
                    <TestimonialsColumn testimonials={desktopColumns[1]} duration={19} />
                    <TestimonialsColumn testimonials={desktopColumns[2]} duration={17} />
                </div>
            </>
            ) : (
            <div className="flex justify-center mt-8 sm:mt-10">
                <div className="text-center text-gray-400 p-6 sm:p-8">
                <p className="text-base sm:text-lg">Add your testimonials to showcase community feedback.</p>
                <p className="text-sm sm:text-base mt-2">Edit the testimonials array in testimonials.tsx to get started.</p>
                </div>
            </div>
            )}
        </div>
        </section>
    );
};

export { Testimonials };
