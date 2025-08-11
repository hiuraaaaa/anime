# Supabase: watch history

Buat tabel (di SQL editor Supabase):

```sql
create table if not exists public.watch_history (
  device_id text not null,
  storage_key text not null,
  position int4 not null default 0,
  duration int4 not null default 0,
  updated_at timestamptz not null default now(),
  primary key (device_id, storage_key)
);
```

Tambahkan Row Level Security (opsional untuk public insert/update dengan anon key — atur sesuai kebutuhan keamanan kamu):

```sql
alter table public.watch_history enable row level security;
create policy "allow anon upsert"
on public.watch_history for
insert with check (true);
create policy "allow anon update"
on public.watch_history for
update using (true);
```
