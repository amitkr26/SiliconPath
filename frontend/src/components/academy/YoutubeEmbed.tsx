// src/components/academy/YoutubeEmbed.tsx
import React from "react";
import { Youtube, ExternalLink } from "lucide-react";

interface YoutubeEmbedProps {
  videoId: string;
  title: string;
  channelName: string;
  channelUrl: string;
  notes?: string | null;
  watchFromSeconds?: number | null;
}

function extractYoutubeId(input: string): string {
  if (!input) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }
  const match = input.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : input;
}

export const YoutubeEmbed: React.FC<YoutubeEmbedProps> = ({
  videoId,
  title,
  channelName,
  channelUrl,
  notes,
  watchFromSeconds
}) => {
  const cleanVideoId = extractYoutubeId(videoId);
  // Build embed URL, append start time parameter if specified
  let embedUrl = `https://www.youtube.com/embed/${cleanVideoId}?rel=0`;
  if (watchFromSeconds) {
    embedUrl += `&start=${watchFromSeconds}`;
  }

  return (
    <div className="w-full bg-[#111827]/40 border border-[#374151]/50 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm transition-all duration-300 hover:border-cyan/40">
      {/* Video Title Header */}
      <div className="p-4 bg-[#1F2937]/50 border-b border-[#374151]/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Youtube className="w-5 h-5 text-red-500 flex-shrink-0" />
          <h4 className="text-sm font-semibold text-gray-200 truncate" title={title}>
            {title}
          </h4>
        </div>
        {/* Attribution Link (Mandatory Ground Rule) */}
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-cyan hover:underline bg-cyan/10 px-2.5 py-1 rounded-full font-medium transition-colors"
        >
          <span>{channelName}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Video Container (16:9 Aspect Ratio) */}
      <div className="relative w-full aspect-video bg-black">
        <iframe
          src={embedUrl}
          title={title}
          className="absolute top-0 left-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>

      {/* Helpful Notes */}
      {notes && (
        <div className="p-3 bg-[#1F2937]/20 border-t border-[#374151]/30 text-xs text-gray-400 italic">
          <strong>Tip:</strong> {notes}
        </div>
      )}
    </div>
  );
};
export default YoutubeEmbed;
