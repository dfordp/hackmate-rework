import { Tweet } from "react-tweet";

interface TwitterEmbedProps {
  tweetId: string;
  className?: string;
}

export const TwitterEmbed: React.FC<TwitterEmbedProps> = ({ tweetId, className }) => {
  return (
    <div 
      data-theme="dark" 
      className={`w-full max-w-sm mx-auto ${className}`}
      style={{
        '--tweet-theme': 'dark',
        '--tweet-text-color': '#e5e7eb',
        '--tweet-bg-color': '#000000',
        colorScheme: 'dark'
      } as React.CSSProperties}
    >
      <div className="[&_article]:!bg-black [&_article]:!border-0 [&_*]:!text-gray-300 [&_a]:!text-blue-400 [&_svg]:!text-gray-400">
        <Tweet id={tweetId} />
      </div>
    </div>
  );
};

export default TwitterEmbed;