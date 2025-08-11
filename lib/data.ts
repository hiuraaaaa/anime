import { promises as fs } from "fs";
import path from "path";

export type VideoItem = {
  anime: string;
  judul: string;
  video: string;
  thumb?: string;
  sinopsis?: string;
  deskripsi?: string;
  genre?: string[];
  eps: number;
};
export type VideoItemWithSlug = VideoItem & { animeSlug: string };

export type DataShape = { videos: VideoItem[] };

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getAll(): Promise<VideoItemWithSlug[]> {
  const file = path.join(process.cwd(), "public", "datavideo.json");
  const raw = await fs.readFile(file, "utf8");
  const json: DataShape = JSON.parse(raw);
  return (json.videos || []).map((v) => ({ ...v, animeSlug: slugify(v.anime) }));
}

export async function getOne(animeSlug: string, epsNum: number) {
  const list = await getAll();
  return list.find((x) => x.animeSlug === animeSlug && Number(x.eps) === Number(epsNum)) || null;
}

export async function getAllParams() {
  const list = await getAll();
  return list.map((x) => ({ anime: x.animeSlug, eps: String(x.eps) }));
}
