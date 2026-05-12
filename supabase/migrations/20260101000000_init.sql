create extension if not exists postgis;

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique,
  avatar_url text,
  is_premium boolean default false,
  stripe_customer_id text,
  points int default 0,
  created_at timestamptz default now()
);

create table runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  geometry geometry(LineString, 4326),
  distance_m int,
  duration_s int,
  created_at timestamptz default now()
);

create table street_segments (
  id uuid primary key default gen_random_uuid(),
  osm_way_id bigint unique,
  geometry geometry(LineString, 4326),
  name text,
  created_at timestamptz default now()
);

create table territory (
  id uuid primary key default gen_random_uuid(),
  segment_id uuid references street_segments unique,
  owner_id uuid references profiles on delete set null,
  score int default 50,
  claimed_at timestamptz default now(),
  last_defended_at timestamptz default now()
);

create table power_ups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  type text check (type in ('shield','boost','radar','contest')),
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz default now()
);

create index runs_geom_idx on runs using gist(geometry);
create index segments_geom_idx on street_segments using gist(geometry);
create index territory_owner_idx on territory(owner_id);
create index power_ups_user_idx on power_ups(user_id);

-- RLS
alter table profiles enable row level security;
alter table runs enable row level security;
alter table street_segments enable row level security;
alter table territory enable row level security;
alter table power_ups enable row level security;

create policy "profiles readable" on profiles for select using (true);
create policy "profiles self update" on profiles for update using (auth.uid() = id);
create policy "profiles self insert" on profiles for insert with check (auth.uid() = id);

create policy "runs readable" on runs for select using (true);
create policy "runs self insert" on runs for insert with check (auth.uid() = user_id);

create policy "segments readable" on street_segments for select using (true);
create policy "territory readable" on territory for select using (true);

create policy "powerups self read" on power_ups for select using (auth.uid() = user_id);
create policy "powerups self insert" on power_ups for insert with check (auth.uid() = user_id);
create policy "powerups self update" on power_ups for update using (auth.uid() = user_id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- helper rpc: territory with owners as geojson
create or replace function public.territory_geojson()
returns json language sql stable as $$
  select json_build_object(
    'type','FeatureCollection',
    'features', coalesce(json_agg(json_build_object(
      'type','Feature',
      'geometry', ST_AsGeoJSON(s.geometry)::json,
      'properties', json_build_object(
        'segment_id', s.id,
        'name', s.name,
        'owner_id', t.owner_id,
        'owner_username', p.username,
        'score', t.score
      )
    )), '[]'::json)
  )
  from street_segments s
  join territory t on t.segment_id = s.id
  left join profiles p on p.id = t.owner_id;
$$;
