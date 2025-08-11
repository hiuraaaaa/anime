"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

type Subtitle = { label: string; lang: string; src: string };
type Props = {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  subtitles?: Subtitle[];
  nextHref?: string;         // for auto-next
  nextTitle?: string;        // for overlay text
  autoNext?: boolean;        // enable auto-next on ended
  storageKey?: string;       // key for local resume
};

type Level = { index: number; height?: number; bitrate?: number };

function formatQuality(l: Level){
  if (l.height) return l.height + "p";
  if (l.bitrate) return Math.round(l.bitrate/1000) + "kbps";
  return "Level " + l.index;
}

export default function Player({ src, poster, autoPlay, subtitles = [], nextHref, nextTitle, autoNext, storageKey }: Props){
  const ref = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const [hls, setHls] = useState<Hls | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1); // -1 auto
  const [showOverlay, setShowOverlay] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [resumeAt, setResumeAt] = useState<number>(0);

  // Load resume time from localStorage
  useEffect(()=>{
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem("wp:" + storageKey);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && typeof obj.t === "number") setResumeAt(obj.t);
      }
    } catch {}
  }, [storageKey]);

  // Initialize HLS or native playback
  useEffect(()=>{
    const video = ref.current!;
    if(!src || !video) return;

    const startPlayback = ()=>{
      if (resumeAt > 0 && !isNaN(resumeAt)) {
        // seek a bit later to ensure media is loaded
        const seek = () => {
          video.currentTime = Math.max(0, resumeAt - 1);
          video.removeEventListener('loadedmetadata', seek);
        };
        video.addEventListener('loadedmetadata', seek);
      }
      if (autoPlay) {
        video.muted = true;
        video.setAttribute("autoplay", "true");
        video.play().catch(()=>{});
      }
    };

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src; // Safari
      startPlayback();
      return;
    }
    if (Hls.isSupported()) {
      const _hls = new Hls();
      _hls.loadSource(src);
      _hls.attachMedia(video);
      _hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const lvls: Level[] = _hls.levels.map((lv, i) => ({
          index: i, height: lv.height ?? undefined, bitrate: lv.bitrate ?? undefined
        }));
        setLevels(lvls);
        setCurrentLevel(-1); // auto by default
        startPlayback();
      });
      setHls(_hls);
      return () => { _hls.destroy(); setHls(null); };
    } else {
      console.warn("HLS tidak didukung.");
    }
  }, [src, autoPlay, resumeAt]);

  // Quality change
  const onChangeQuality = (e: React.ChangeEvent<HTMLSelectElement>)=>{
    const idx = Number(e.target.value);
    setCurrentLevel(idx);
    if (hls) {
      hls.currentLevel = idx; // -1 = auto
    } else {
      // native HLS (Safari) doesn't expose levels easily; ignore
    }
  };

  // Fullscreen by click
  const goFull = ()=>{
    const v = ref.current;
    if(!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
    else if ((v as any).webkitEnterFullscreen) (v as any).webkitEnterFullscreen();
  };

  // Hotkeys
  useEffect(()=>{
    const v = ref.current;
    if(!v) return;
    const onKey = (e: KeyboardEvent)=>{
      if (e.key.toLowerCase() === "f") { e.preventDefault(); goFull(); }
      if (e.key.toLowerCase() === "k" || e.key === " ") {
        e.preventDefault();
        if (v.paused) v.play().catch(()=>{}); else v.pause();
      }
    };
    window.addEventListener("keydown", onKey);
    return ()=> window.removeEventListener("keydown", onKey);
  }, []);

  // Auto-next with countdown overlay
  useEffect(()=>{
    const v = ref.current;
    if(!v) return;
    let timer: any = null;
    let interval: any = null;

    const onEnded = ()=>{
      if (autoNext && nextHref) {
        setCountdown(5);
        setShowOverlay(true);
        interval = setInterval(()=> setCountdown(c=> c>0 ? c-1 : 0), 1000);
        timer = setTimeout(()=>{
          router.push(nextHref);
        }, 5000);
      }
    };
    v.addEventListener("ended", onEnded);
    return ()=> {
      v.removeEventListener("ended", onEnded);
      if (timer) clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [autoNext, nextHref, router]);

  const cancelAutoNext = ()=> setShowOverlay(false);
  const goNextNow = ()=> { if (nextHref) router.push(nextHref); };

  // Save progress (localStorage baseline) + optional Supabase
  useEffect(()=>{
    const v = ref.current;
    if(!v || !storageKey) return;
    let last = 0;
    let t: any = null;
    const supa = getSupabase();
    const deviceId = (()=>{
      try {
        let id = localStorage.getItem("device:id");
        if (!id) { id = Math.random().toString(36).slice(2); localStorage.setItem("device:id", id); }
        return id;
      } catch { return "anon"; }
    })();

    const save = async ()=>{
      const payload = { t: Math.floor(v.currentTime), d: Math.floor(v.duration || 0), at: Date.now() };
      try { localStorage.setItem("wp:" + storageKey, JSON.stringify(payload)); } catch {}

      if (supa) {
        try {
          await supa.from("watch_history").upsert({
            device_id: deviceId,
            storage_key: storageKey,
            position: payload.t,
            duration: payload.d,
            updated_at: new Date(payload.at).toISOString()
          }, { onConflict: "device_id,storage_key" });
        } catch(e){ /* ignore */ }
      }
    };

    const onTime = ()=>{
      const now = Date.now();
      if (now - last > 2000) { // throttle 2s
        last = now;
        save();
      }
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("pause", save);
    window.addEventListener("beforeunload", save);
    return ()=>{
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("pause", save);
      window.removeEventListener("beforeunload", save);
      if (t) clearTimeout(t);
    };
  }, [storageKey]);

  return (
    <div className="relative">
      <video
        ref={ref}
        controls
        playsInline
        preload="metadata"
        poster={poster}
        className="w-full rounded-2xl border bg-black cursor-pointer"
        onClick={goFull}
      >
        {subtitles.map((s, i)=> (
          <track key={i} kind="subtitles" label={s.label} srcLang={s.lang} src={s.src} default={i===0} />
        ))}
      </video>

      {/* Controls overlay: quality & fullscreen */}
      <div className="absolute bottom-3 left-3 flex gap-2">
        {levels.length > 0 && (
          <select
            value={currentLevel}
            onChange={onChangeQuality}
            className="px-2 py-1 rounded-lg text-xs bg-white/90 hover:bg-white border shadow-soft dark:bg-slate-800 dark:text-white dark:border-slate-700"
            title="Kualitas video"
          >
            <option value={-1}>Auto</option>
            {levels.map(l => (
              <option key={l.index} value={l.index}>{formatQuality(l)}</option>
            ))}
          </select>
        )}
      </div>

      <button
        type="button"
        onClick={goFull}
        className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg text-xs bg-white/90 hover:bg-white border shadow-soft dark:bg-slate-800 dark:text-white dark:border-slate-700"
        aria-label="Masuk Fullscreen"
        title="Fullscreen (F)"
      >
        Fullscreen
      </button>

      {/* Auto-next overlay */}
      {showOverlay && nextHref && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 max-w-sm text-center space-y-3">
            <div className="text-sm opacity-70">Selanjutnya</div>
            <div className="font-semibold">{nextTitle || "Episode berikutnya"}</div>
            <div className="text-4xl font-bold">{countdown}</div>
            <div className="flex justify-center gap-3 pt-2">
              <button onClick={goNextNow} className="btn btn-primary">Tonton sekarang</button>
              <button onClick={()=>setShowOverlay(false)} className="btn btn-secondary">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
