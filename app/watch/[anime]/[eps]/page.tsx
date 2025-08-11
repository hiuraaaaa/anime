import Player from "@/components/Player";
import { getAll, getAllParams, getOne } from "@/lib/data";
import Link from "next/link";

export async function generateStaticParams(){
  return await getAllParams();
}

export const dynamicParams = false;

export default async function WatchPage({ params, searchParams }: { params: { anime: string; eps: string }, searchParams: { [k: string]: string | string[] | undefined } }){
  const epsNum = Number(params.eps);
  const item = await getOne(params.anime, epsNum);
  const autoplay = String(searchParams?.autoplay ?? "").toLowerCase() === "1";
  const autoNext = String(searchParams?.autonext ?? "").toLowerCase() !== "0"; // default ON

  if(!item){
    return (
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-xl font-bold mb-3">Tidak ditemukan</h1>
        <Link href="/" className="text-blue-600">Kembali</Link>
      </main>
    );
  }

  // Build next/prev from same anime
  const all = await getAll();
  const same = all.filter(v => v.animeSlug === params.anime).sort((a,b)=> a.eps - b.eps);
  const idx = same.findIndex(v => v.eps === epsNum);
  const prev = idx > 0 ? same[idx-1] : null;
  const next = idx >= 0 && idx < same.length-1 ? same[idx+1] : null;

  const nextHref = next ? `/watch/${next.animeSlug}/${next.eps}${autoplay ? '?autoplay=1' : ''}` : undefined;
  const nextTitle = next ? `${next.anime} — ${next.judul}` : undefined;
  const storageKey = `${item.animeSlug}:${item.eps}`;

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{item.anime} — {item.judul}</h1>
          <div className="text-sm opacity-70">{item.genre?.join(" • ")} {item.eps ? `• EP ${item.eps}` : ""}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {prev && (
            <Link
              href={`/watch/${prev.animeSlug}/${prev.eps}${autoplay ? '?autoplay=1' : ''}`}
              className="btn btn-secondary"
            >
              ← Prev
            </Link>
          )}
          <Link href="/" className="btn btn-secondary">Daftar</Link>
          {next && (
            <Link
              href={`/watch/${next.animeSlug}/${next.eps}${autoplay ? '?autoplay=1' : ''}`}
              className="btn btn-secondary"
            >
              Next →
            </Link>
          )}
        </div>
      </div>

      <Player
        src={item.video}
        poster={item.thumb}
        autoPlay={autoplay}
        subtitles={item.subtitles as any}
        nextHref={nextHref}
        nextTitle={nextTitle}
        autoNext={autoNext}
        storageKey={storageKey}
      />

      <div className="flex items-center gap-3 text-sm">
        {!autoplay ? (
          <Link href={`/watch/${item.animeSlug}/${item.eps}?autoplay=1`} className="text-blue-600">
            Aktifkan autoplay episode ini
          </Link>
        ) : (
          <Link href={`/watch/${item.animeSlug}/${item.eps}`} className="text-blue-600">
            Matikan autoplay
          </Link>
        )}
        <span className="opacity-60">•</span>
        {autoNext ? (
          <Link href={`/watch/${item.animeSlug}/${item.eps}${autoplay ? '?autoplay=1&' : '?'}autonext=0`} className="text-blue-600">
            Matikan auto-next
          </Link>
        ) : (
          <Link href={`/watch/${item.animeSlug}/${item.eps}${autoplay ? '?autoplay=1&' : '?'}autonext=1`} className="text-blue-600">
            Aktifkan auto-next
          </Link>
        )}
      </div>

      <p className="opacity-90">{item.deskripsi || item.sinopsis}</p>
    </main>
  );
}
