import { PeerlistTestimonialProps } from '@/components/ui/peerlist-testimonial';
import { ProductHuntTestimonialProps } from '@/components/ui/product-hunt-testimonial';

// Define the different types of testimonials
export type TestimonialType = 'custom' | 'twitter' | 'peerlist' | 'producthunt';

export interface CustomTestimonial {
  type: 'custom';
  id: string;
  text: string;
  image: string;
  name: string;
  role: string;
}

export interface TwitterTestimonial {
  type: 'twitter';
  id: string;
  tweetUrl: string;
  content: string;
  authorName: string;
  authorHandle: string;
  postedOn: string;
  lang?: string;
}

export interface PeerlistTestimonialData extends PeerlistTestimonialProps {
  type: 'peerlist';
}

export interface ProductHuntTestimonialData extends ProductHuntTestimonialProps {
  type: 'producthunt';
}

export type TestimonialItem = 
  | CustomTestimonial 
  | TwitterTestimonial 
  | PeerlistTestimonialData 
  | ProductHuntTestimonialData;

/**
 * Shuffles an array using the Fisher-Yates algorithm with a seed for consistent randomization
 */
export function shuffleArray<T>(array: T[], seed = 42): T[] {
  const shuffled = [...array];
  let currentIndex = shuffled.length;
  let randomIndex: number;

  // Seeded random number generator for consistency
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  let currentSeed = seed;

  // While there remain elements to shuffle
  while (currentIndex > 0) {
    // Pick a remaining element
    randomIndex = Math.floor(seededRandom(currentSeed++) * currentIndex);
    currentIndex--;

    // And swap it with the current element
    [shuffled[currentIndex], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[currentIndex],
    ];
  }

  return shuffled;
}

/**
 * Distributes testimonials evenly across columns while maintaining randomization
 */
export function distributeTestimonials(testimonials: TestimonialItem[], columnCount = 3): TestimonialItem[][] {
  const shuffled = shuffleArray(testimonials);
  const columns: TestimonialItem[][] = Array.from({ length: columnCount }, () => []);
  
  // Distribute testimonials evenly across columns
  shuffled.forEach((testimonial, index) => {
    const columnIndex = index % columnCount;
    columns[columnIndex].push(testimonial);
  });
  
  return columns;
}

/**
 * Ensures each column has a good mix of testimonial types
 */
export function balanceTestimonialTypes(testimonials: TestimonialItem[], columnCount = 3): TestimonialItem[][] {
  // Group testimonials by type
  const groupedByType = testimonials.reduce((acc, testimonial) => {
    if (!acc[testimonial.type]) {
      acc[testimonial.type] = [];
    }
    acc[testimonial.type].push(testimonial);
    return acc;
  }, {} as Record<TestimonialType, TestimonialItem[]>);

  // Shuffle each type group
  Object.keys(groupedByType).forEach(type => {
    groupedByType[type as TestimonialType] = shuffleArray(groupedByType[type as TestimonialType]);
  });

  const columns: TestimonialItem[][] = Array.from({ length: columnCount }, () => []);
  const typeKeys = Object.keys(groupedByType) as TestimonialType[];
  
  let columnIndex = 0;
  let typeIndex = 0;
  
  // Round-robin distribution across types and columns
  while (typeKeys.some(type => groupedByType[type].length > 0)) {
    const currentType = typeKeys[typeIndex];
    
    if (groupedByType[currentType].length > 0) {
      const testimonial = groupedByType[currentType].shift()!;
      columns[columnIndex].push(testimonial);
      columnIndex = (columnIndex + 1) % columnCount;
    }
    
    typeIndex = (typeIndex + 1) % typeKeys.length;
  }
  
  return columns;
}