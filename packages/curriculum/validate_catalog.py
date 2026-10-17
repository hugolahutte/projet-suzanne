"""Validate provenance and the 2026/2027 transition cases most prone to mistakes."""
import hashlib, json
from pathlib import Path
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parents[2]
catalog=json.loads((ROOT/'packages/curriculum/catalog.json').read_text())
entries=catalog['entries']
assert len({e['id'] for e in entries})==len(entries)
for e in entries:
 assert e['status'] in {'current','transition','reference'},e['id']
 assert e['sourceKind'] in {'programme','index'},e['id']
 assert set(e['levels']) <= {'CM2','6e','5e','4e','3e','2de','1re','Tle'},e['id']
 assert urlparse(e['sourceUrl']).hostname.endswith('.education.gouv.fr'),e['id']
 if e.get('effectiveFrom') and e.get('effectiveTo'):assert e['effectiveFrom']<=e['effectiveTo'],e['id']
def programmes(level,subject,date):
 return [e for e in entries if level in e['levels'] and e['subject']==subject and e['track']=='commun' and e['sourceKind']=='programme' and e['effectiveFrom'] and e['effectiveFrom']<=date and (not e['effectiveTo'] or e['effectiveTo']>=date)]
for subject in ['francais','mathematiques','anglais']:
 for level,version in [('5e','2026' if subject!='anglais' else '2025'),('4e','2020'),('3e','2020')]:
  found=programmes(level,subject,'2026-10-12')
  assert len(found)==1 and found[0]['id']==f'{level}-{subject}-{version}',(level,subject,found)
 for level,date,version in [('4e','2027-09-01','2026' if subject!='anglais' else '2025'),('3e','2028-09-01','2026' if subject!='anglais' else '2025')]:
  found=programmes(level,subject,date)
  assert len(found)==1 and found[0]['id']==f'{level}-{subject}-{version}',(level,subject,found)
assert programmes('CM2','anglais','2026-10-12')[0]['documentId']=='cycle-3-base-2023'
assert programmes('CM2','francais','2026-10-12')[0]['documentId']=='cycle-3-francais-2025'
assert programmes('6e','anglais','2026-10-12')[0]['documentId']=='anglais-college-2025'
def active(level,subject,track,date):
 return [e for e in entries if level in e['levels'] and e['subject']==subject and e['track']==track and e['sourceKind']=='programme' and e['effectiveFrom'] and e['effectiveFrom']<=date and (not e['effectiveTo'] or e['effectiveTo']>=date)]
for track in ['general-specialite','technologique','option']:
 current=active('Tle','mathematiques',track,'2026-10-12')
 future=active('Tle','mathematiques',track,'2027-09-01')
 # Options include the unchanged mathematics expertes programme.
 assert len(current)==(2 if track=='option' else 1),(track,current)
 assert len(future)==len(current),(track,future)
 assert any(e['effectiveFrom']=='2027-09-01' for e in future),track
 assert not any(e['effectiveFrom']=='2027-09-01' for e in current),track
assert len(active('1re','eps','general-specialite','2021-10-12'))==1
assert len(active('Tle','eps','general-specialite','2021-10-12'))==0
assert len(active('Tle','eps','general-specialite','2022-10-12'))==1
assert len(active('2de','lsf','option','2020-10-12'))==2
manifest=json.loads((ROOT/'docs/curriculum/manifest.json').read_text())
manifest_by_id={d['id']:d for d in manifest}
for e in entries:
 if 'documentId' in e:assert e['documentId'] in manifest_by_id,e['id']
for d in manifest:
 assert d['status']=='downloaded',d
 b=(ROOT/d['path']).read_bytes()
 assert b.startswith(b'%PDF-'),d['id']
 assert hashlib.sha256(b).hexdigest()==d['sha256'],d['id']
 assert len(b)==d['bytes'],d['id']
assert set(manifest_by_id)=={d['id'] for d in json.loads((ROOT/'docs/curriculum/documents.json').read_text())}
print(f'{len(entries)} entries and {len(manifest)} PDF checksums validated; collège, lycée mathematics, EPS and LSF date checks passed.')
