"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { VideoItemWithSlug } from "@/lib/data";

export default function Browse({ items }: { items: VideoItemWithSlug[] }){
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState<string>("");

  const genres = useMemo(()=>{
    const s = new Set<string>();
    items.forEach(i => (i.genre||[]).forEach(g => s.add(g)));
    return Array.from(s).sort();
  }, [items]);

  const filtered = useMemo(()=>{
    const qq = q.trim().toLowerCase();
    return items.filter(v=>{
      const matchesQ = !qq || [v.anime, v.judul, v.sinopsis, v.deskripsi].filter(Boolean).some(x=>String(x).toLowerCase().includes(qq));
      const matchesG = !genre || (v.genre||[]).includes(genre);
      return matchesQ && matchesG;
    }).sort((a,b)=> a.animeSlug.localeCompare(b.animeSlug) || (a.eps - b.eps));
  }, [items, q, genre]);

  // group by anime
  const grouped = useMemo(()=>{
    const map: Record<string, VideoItemWithSlug[]> = {};
    for(const v of filtered){
      if(!map[v.anime]) map[v.anime] = [];
      map[v.anime].push(v);
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          placeholder="Cari judul/anime..."
          className="w-full md:w-1/2 border rounded-xl px-4 py-2"
        />
        <select value={genre} onChange={e=>setGenre(e.target.value)} className="border rounded-xl px-4 py-2">
          <option value="">Semua genre</option>
          {genres.map(g=> <option key={g} value={g}>{g}</option>)}
        </select>
        <button className="btn btn-secondary" onClick={()=>{setQ(""); setGenre("");}}>Reset</button>
      </div>

      {Object.entries(grouped).map(([anime, arr])=> (
        <section key={anime} className="card">
          <h2 className="text-lg font-semibold mb-3">{anime}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {arr.map(v=> (
              <Link key={v.animeSlug + v.eps} href={`/watch/${v.animeSlug}/${v.eps}`} className="block overflow-hidden rounded-xl border hover:shadow-soft bg-white">
                {v.thumb && <img src={v.thumb} alt={v.judul} className="w-full aspect-video object-cover" />}
                <div className="p-3">
                  <div className="text-xs opacity-60 mb-1">{v.genre?.join(" • ")}</div>
                  <div className="text-sm font-semibold line-clamp-2">{v.judul}</div>
                  <div className="text-xs opacity-70 mt-1">{v.eps === 0 ? "Movie" : `EP ${v.eps}`}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
      {filtered.length === 0 && <div className="opacity-60">Tidak ada hasil.</div>}
    </div>
  );
}
