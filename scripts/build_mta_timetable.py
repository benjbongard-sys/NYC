#!/usr/bin/env python3
"""Build a privacy-safe, date-specific subway timetable for NOUX from official MTA GTFS.

Only public route/stop/schedule data are emitted. Private itinerary content never enters these files.
Each day's connections are sorted by departure time for an efficient connection scan.
"""
import collections, csv, datetime as dt, io, json, os, pathlib, sys, time, urllib.request, zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'subway'
SOURCE = 'https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip'
DATES = [dt.date(2026, 11, d) for d in range(23, 28)]


def table(zf, name):
    with zf.open(name) as file:
        yield from csv.DictReader(io.TextIOWrapper(file, encoding='utf-8-sig', newline=''))


def minutes(hhmmss):
    hour, minute, second = [int(x) for x in hhmmss.split(':')]
    return hour * 60 + minute + (1 if second >= 30 else 0)


def download():
    if 'NYC_GTFS_FILE' in os.environ:
        return pathlib.Path(os.environ['NYC_GTFS_FILE']).read_bytes()
    last = None
    for attempt in range(4):
        try:
            req = urllib.request.Request(SOURCE, headers={'User-Agent':'NOUX-trip-planner/1.0 (public GTFS feed; benjbongard-sys/nyc-lyna)'})
            with urllib.request.urlopen(req, timeout=45) as resp:
                data = resp.read()
            if len(data) < 10000 or not zipfile.is_zipfile(io.BytesIO(data)):
                raise ValueError(f'Unexpected ZIP response: {len(data)} bytes')
            return data
        except Exception as ex:
            last = ex
            print(f'MTA download retry {attempt+1}: {type(ex).__name__}: {ex}', flush=True)
            time.sleep((attempt+1)*3)
    raise RuntimeError('Official MTA GTFS static timetable is unavailable; abort publication of unverified routes') from last


def build(archive, out=OUT, dates=DATES):
    out.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(archive)) as zf:
        names = set(zf.namelist())
        for required in ('stops.txt','trips.txt','stop_times.txt','calendar.txt'):
            if required not in names: raise ValueError('Missing GTFS file '+required)
        stops = {s['stop_id']:s for s in table(zf,'stops.txt')}
        groups = {}
        stop_to_group = {}
        for stop_id, row in stops.items():
            group = row.get('parent_station') or stop_id
            stop_to_group[stop_id] = group
            if group not in groups:
                base = stops.get(group, row)
                groups[group] = {'id':group,'name':base['stop_name'], 'lat':float(base['stop_lat']), 'lng':float(base['stop_lon'])}
        # Keep only stations that appear in passenger train stop_times.
        active_stations = set()
        routes = {r['route_id']:r for r in table(zf,'routes.txt')} if 'routes.txt' in names else {}
        train_meta = {r['trip_id']:r for r in table(zf,'trips.txt')}
        weekly = {}
        day_names=['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
        for row in table(zf,'calendar.txt'):
            weekly[row['service_id']]=row
        exceptions = {}
        if 'calendar_dates.txt' in names:
            for row in table(zf,'calendar_dates.txt'):
                exceptions[(row['service_id'],row['date'])] = int(row['exception_type'])
        timings = collections.defaultdict(list)
        for row in table(zf,'stop_times.txt'):
            tid=row['trip_id']
            if tid not in train_meta: continue
            sid=row['stop_id']
            group=stop_to_group.get(sid)
            if group is None: continue
            active_stations.add(group)
            timings[tid].append((int(row['stop_sequence']),sid,
                minutes(row['arrival_time']), minutes(row['departure_time'])))
        active = sorted(active_stations)
        group_index={g:i for i,g in enumerate(active)}
        stop_ids = sorted({s for times in timings.values() for _,s,_,_ in times})
        stop_index={s:i for i,s in enumerate(stop_ids)}
        route_ids=sorted({r['route_id'] for r in train_meta.values()})
        route_index={r:i for i,r in enumerate(route_ids)}
        transfer_dict={}
        if 'transfers.txt' in names:
            for row in table(zf,'transfers.txt'):
                a,b=stop_to_group.get(row['from_stop_id']),stop_to_group.get(row['to_stop_id'])
                if not a or not b or a==b or a not in group_index or b not in group_index: continue
                secs=int(row.get('min_transfer_time') or '180')
                # within-station transfer footpaths can be longer than 2 minutes
                t=max(2,min(15,(secs+59)//60))
                key=(group_index[a],group_index[b]);transfer_dict[key]=min(t,transfer_dict.get(key,30))
        network={
          'source':SOURCE,'attribution':'Metropolitan Transportation Authority — Official static GTFS',
          'generated_utc':dt.datetime.now(dt.timezone.utc).isoformat(),
          'stations':[[g,groups[g]['name'],round(groups[g]['lat'],6),round(groups[g]['lng'],6)] for g in active],
          'platforms':stop_ids,
          'routes':[[rid,(routes.get(rid,{}).get('route_short_name') or rid),routes.get(rid,{}).get('route_color') or '444444'] for rid in route_ids],
          'transfers':[[a,b,mins] for (a,b),mins in sorted(transfer_dict.items())],
          'dates':[d.isoformat() for d in dates]
        }
        (out/'network.json').write_text(json.dumps(network,separators=(',',':'),ensure_ascii=False))
        print('Stations',len(active),'platforms',len(stop_ids),'routes',len(route_ids),'transfers',len(transfer_dict))
        for date in dates:
            datestr=date.strftime('%Y%m%d')
            weekdays=day_names[date.weekday()]
            service_ids=set()
            for sid, row in weekly.items():
                on=(row['start_date']<=datestr<=row['end_date'] and row.get(weekdays,'0')=='1')
                ex=exceptions.get((sid,datestr))
                if ex==1 or (on and ex!=2):service_ids.add(sid)
            trip_list=[];conn=[]
            for trip_id,row in train_meta.items():
                if row['service_id'] not in service_ids or trip_id not in timings:continue
                train=sorted(timings[trip_id],key=lambda x:x[0]);
                if len(train)<2:continue
                trip_idx=len(trip_list)
                trip_list.append([route_index[row['route_id']],row.get('trip_headsign') or '',trip_id])
                for left,right in zip(train,train[1:]):
                    _,p_a,_,depart=left
                    _,p_b,arrive,_=right
                    base_a=stop_to_group[p_a];base_b=stop_to_group[p_b]
                    if base_a==base_b or arrive<depart or arrive-depart>45: continue
                    conn.append([depart,arrive,group_index[base_a],group_index[base_b],trip_idx,stop_index[p_a],stop_index[p_b]])
            conn.sort(key=lambda x:(x[0],x[1]))
            if (len(trip_list)<1500 or len(conn)<15000) and os.environ.get('NOUX_TEST_FIXTURE')!='1':
                raise ValueError(f'GTFS yielded implausibly few trips for {date}: {len(trip_list)} / {len(conn)}; halt instead of fabricating transit routing')
            document={'date':date.isoformat(),'generated_utc':network['generated_utc'],
                'service_ids':sorted(service_ids),'trips':trip_list,'connections':conn}
            target=out/(date.isoformat()+'.json')
            target.write_text(json.dumps(document,separators=(',',':'),ensure_ascii=False))
            print(date.isoformat(),'trips',len(trip_list),'connections',len(conn),'raw_bytes',target.stat().st_size,flush=True)
        return network


if __name__=='__main__':
    build(download())