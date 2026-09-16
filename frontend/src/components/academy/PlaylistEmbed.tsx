// src/components/academy/PlaylistEmbed.tsx
// Click-to-play embedded YouTube playlist (videoseries iframe) for the new
// design system. Loads the iframe only after the visitor opts in.
"use client";

import React, { useState } from "react";
import { Youtube, ExternalLink, Play, ListVideo } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface PlaylistEmbedProps {
  playlistId: string;
  title: string;
  channel: string;
  channelUrl: string;
}

export const PlaylistEmbed: React.FC<PlaylistEmbedProps> = ({
  playlistId,
  title,
  channel,
  channelUrl,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const embedUrl = `https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=1&rel=0`;
  const watchUrl = `https://www.youtube.com/playlist?list=${playlistId}`;

  return (
    <Card hover className="overflow-hidden">
      {/* Header */}
      <div className="p-3.5 bg-white border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Youtube className="w-5 h-5 text-red-600 flex-shrink-0 fill-current" />
          <h4 className="text-sm font-semibold text-slate-900 truncate" title={title}>
            {title}
          </h4>
        </div>
        <a
          href={channelUrl || watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-lg transition-colors shrink-0"
        >
          <span>{channel}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Playlist stage (16:9) */}
      <div className="relative w-full aspect-video bg-slate-950">
        {isPlaying ? (
          <iframe
            src={embedUrl}
            title={title}
            className="absolute top-0 left-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        ) : (
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 w-full h-full cursor-pointer group flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950"
          >
            <div className="w-16 h-16 rounded-xl bg-red-600 shadow-lg flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-red-500 transition-transform">
              <Play className="w-8 h-8 fill-current ml-1" />
            </div>
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <ListVideo className="w-4 h-4" />
              Click to play full playlist inline
            </span>
          </button>
        )}
      </div>

      {/* Footer action bar */}
      <div className="p-3.5 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500 font-medium">Free full-length lecture series</span>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Play className="w-3.5 h-3.5 text-red-600 fill-current" />
          Open in YouTube
        </a>
      </div>
    </Card>
  );
};

export default PlaylistEmbed;