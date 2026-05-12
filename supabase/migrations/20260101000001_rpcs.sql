-- Helper RPCs called from edge functions.

create or replace function public.set_run_geom(run_id uuid, wkt text)
returns void language sql security definer as $$
  update runs set geometry = ST_GeomFromText(wkt, 4326) where id = run_id;
$$;

create or replace function public.set_segment_geom(seg_id uuid, wkt text)
returns void language sql security definer as $$
  update street_segments set geometry = ST_GeomFromText(wkt, 4326) where id = seg_id;
$$;

create or replace function public.bump_points(uid uuid, delta int)
returns void language sql security definer as $$
  update profiles set points = points + delta where id = uid;
$$;

create or replace function public.apply_decay()
returns int language plpgsql security definer as $$
declare
  affected int;
begin
  update territory
  set score = greatest(0, score - 5)
  where last_defended_at < now() - interval '24 hours';
  get diagnostics affected = row_count;

  -- transfer ownership when score hits 0
  update territory set owner_id = null, score = 0
  where score = 0 and owner_id is not null;
  return affected;
end; $$;
