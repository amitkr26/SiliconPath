// src/components/academy/YoutubeEmbed.tsx
import React from "react";
import { Youtube, ExternalLink, Play } from "lucide-react";

interface YoutubeEmbedProps {
  videoId: string;
  title: string;
  channelName: string;
  channelUrl: string;
  notes?: string | null;
  watchFromSeconds?: number | null;
}

function extractYoutubeId(input: string): string {
  if (!input) return "M0mx8S05v60";
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }
  const match = input.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : "M0mx8S05v60";
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
  let embedUrl = `https://www.youtube-nocookie.com/embed/${cleanVideoId}?rel=0&autoplay=0`;
  if (watchFromSeconds) {
    embedUrl += `&start=${watchFromSeconds}`;
  }
  const directWatchUrl = `https://www.youtube.com/watch?v=${cleanVideoId}`;

  return (
    <div className="w-full bg-white border-3 border-slate-900 rounded-2xl overflow-hidden shadow-[5px_5px_0px_0px_#0F172A] transition-all duration-300 hover:shadow-[7px_7px_0px_0px_#0F172A]">
      {/* Video Title Header */}
      <div className="p-3.5 bg-slate-900 text-white border-b-2 border-slate-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Youtube className="w-5 h-5 text-red-500 flex-shrink-0 fill-current" />
          <h4 className="text-xs font-black text-white truncate" title={title}>
            {title}
          </h4>
        </div>
        <a
          href={channelUrl || directWatchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[11px] font-black bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-xl border border-white shadow-[2px_2px_0px_0px_#FFFFFF] transition-all shrink-0"
        >
          <span>{channelName || "YouTube Channel"}</span>
          <ExternalLink className="w-3 h-3 stroke-[2.5]" />
        </a>
      </div>

      {/* Video Container (16:9 Aspect Ratio) */}
      <div className="relative w-full aspect-video bg-slate-950">
        <iframe
          src={embedUrl}
          title={title}
          className="absolute top-0 left-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>

      {/* Action Bar & Helpful Notes */}
      <div className="p-3.5 bg-slate-50 border-t-2 border-slate-900 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {notes && (
            <p className="text-xs text-slate-700 font-medium leading-snug flex-1 min-w-[200px]">
              <strong className="font-black text-slate-900">Key Takeaway:</strong> {notes}
            </p>
          )}
          <a
            href={directWatchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-black text-slate-900 hover:text-blue-600 bg-white hover:bg-blue-50 border-2 border-slate-900 px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_#0F172A] transition-all"
          >
            <Play className="w-3.5 h-3.5 text-red-600 fill-current" />
            <span>Open in YouTube</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default YoutubeEmbed;
