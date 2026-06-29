"use client";
import React from "react";
import { motion } from "motion/react";
import Image from "next/image";
import TwitterEmbed from '@/components/ui/twitter-embed';
import PeerlistTestimonial from '@/components/ui/peerlist-testimonial';
import ProductHuntTestimonial from '@/components/ui/product-hunt-testimonial';
import { TestimonialItem } from '@/lib/testimonial-utils';

// Legacy support for old testimonial format
interface LegacyTestimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: TestimonialItem[] | LegacyTestimonial[];
  duration?: number;
}) => {
  // Helper function to check if testimonial is legacy format
  const isLegacyTestimonial = (testimonial: TestimonialItem | LegacyTestimonial): testimonial is LegacyTestimonial => {
    return !('type' in testimonial);
  };

  // Type guards for different testimonial types
  const isTwitterTestimonial = (testimonial: TestimonialItem): testimonial is TestimonialItem & {
    type: 'twitter';
    tweetUrl: string;
    content: string;
    authorName: string;
    authorHandle: string;
    postedOn: string;
    lang?: string;
  } => {
    return testimonial.type === 'twitter';
  };

  const isPeerlistTestimonial = (testimonial: TestimonialItem): testimonial is TestimonialItem & { type: 'peerlist' } => {
    return testimonial.type === 'peerlist';
  };

  const isProductHuntTestimonial = (testimonial: TestimonialItem): testimonial is TestimonialItem & { type: 'producthunt' } => {
    return testimonial.type === 'producthunt';
  };

  const isCustomTestimonial = (testimonial: TestimonialItem): testimonial is TestimonialItem & { 
    type: 'custom'; 
    id: string;
    text: string; 
    image: string; 
    name: string; 
    role: string 
  } => {
    return testimonial.type === 'custom';
  };

  // Render individual testimonial based on type
  const renderTestimonial = (testimonial: TestimonialItem | LegacyTestimonial, index: number) => {
    if (isLegacyTestimonial(testimonial)) {
      // Render legacy testimonial format
      return (
        <div className="p-4 sm:p-6 rounded-2xl border border-gray-800/50 bg-black/20 backdrop-blur-sm shadow-lg shadow-primary/10 w-full max-w-sm mx-auto hover:border-gray-700/50 transition-all duration-300 will-change-transform" key={`legacy-${index}`} style={{transform: "translate3d(0, 0, 0)"}}>
          <div className="text-gray-200 text-sm sm:text-base leading-relaxed mb-4">{testimonial.text}</div>
          <div className="flex items-center gap-3">
            <Image
              width={40}
              height={40}
              src={testimonial.image}
              alt={testimonial.name}
              className="h-10 w-10 rounded-full border border-gray-700 flex-shrink-0"
            />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="font-medium tracking-tight leading-5 text-white truncate">{testimonial.name}</div>
              <div className="leading-5 text-gray-400 tracking-tight text-sm truncate">{testimonial.role}</div>
            </div>
          </div>
        </div>
      );
    }

    // Render new testimonial types with proper type guards
    if (isTwitterTestimonial(testimonial)) {
      return (
        <div key={`twitter-${testimonial.id}`} className="w-full max-w-sm mx-auto will-change-transform" style={{transform: "translate3d(0, 0, 0)"}}>
          <TwitterEmbed 
            tweetUrl={testimonial.tweetUrl}
            content={testimonial.content}
            authorName={testimonial.authorName}
            authorHandle={testimonial.authorHandle}
            postedOn={testimonial.postedOn}
            lang={testimonial.lang}
            className="w-full"
          />
        </div>
      );
    }
    
    if (isPeerlistTestimonial(testimonial)) {
      return (
        <PeerlistTestimonial
          key={`peerlist-${testimonial.id}`}
          {...testimonial}
        />
      );
    }
    
    if (isProductHuntTestimonial(testimonial)) {
      return (
        <ProductHuntTestimonial
          key={`producthunt-${testimonial.id}`}
          {...testimonial}
        />
      );
    }
    
    if (isCustomTestimonial(testimonial)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const customTestimonial = testimonial as any;
      
      return (
        <div className="p-4 sm:p-6 rounded-2xl border border-gray-800/50 bg-black/20 backdrop-blur-sm shadow-lg shadow-primary/10 w-full max-w-sm mx-auto hover:border-gray-700/50 transition-all duration-300 will-change-transform" key={`custom-${customTestimonial.id}`} style={{transform: "translate3d(0, 0, 0)"}}>
          <div className="text-gray-200 text-sm sm:text-base leading-relaxed mb-4">{customTestimonial.text}</div>
          <div className="flex items-center gap-3">
            <Image
              width={40}
              height={40}
              src={customTestimonial.image}
              alt={customTestimonial.name}
              className="h-10 w-10 rounded-full border border-gray-700 flex-shrink-0"
            />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="font-medium tracking-tight leading-5 text-white truncate">{customTestimonial.name}</div>
              <div className="leading-5 text-gray-400 tracking-tight text-sm truncate">{customTestimonial.role}</div>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-4 sm:gap-6 pb-4 sm:pb-6 bg-transparent will-change-transform transform-gpu"
        style={{
          transform: "translate3d(0, 0, 0)", // Force GPU acceleration
          backfaceVisibility: "hidden", // Reduce rendering artifacts
        }}
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map((testimonial, i) => renderTestimonial(testimonial, i))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};
