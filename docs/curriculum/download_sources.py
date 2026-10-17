"""Download only the verified, public official PDF URLs in documents.json."""
from pathlib import Path
import concurrent.futures, hashlib, json, subprocess
from datetime import datetime, timezone
from datetime import date
ROOT=Path(__file__).resolve().parents[2]
MANIFEST=ROOT/'docs/curriculum/manifest.json'
PREVIOUS={d['id']:d for d in json.loads(MANIFEST.read_text())} if MANIFEST.exists() else {}
def download(d):
 p=ROOT/d['path']; p.parent.mkdir(parents=True,exist_ok=True)
 old=PREVIOUS.get(d['id'],{})
 if p.exists() and old.get('status')=='downloaded' and old.get('url')==d['url']:
  content=p.read_bytes()
  if content.startswith(b'%PDF-') and hashlib.sha256(content).hexdigest()==old.get('sha256'):return old
 result=subprocess.run(['curl','--silent','--show-error','--fail','--location','--max-time','45',d['url'],'--output',str(p)],capture_output=True,text=True)
 row={**d,'retrievedAt':date.today().isoformat(),'status':'downloaded'}
 if result.returncode or not p.exists() or not p.read_bytes().startswith(b'%PDF-'):
  row.update(status='failed',error=result.stderr.strip() or 'Not a PDF');p.unlink(missing_ok=True)
 else:
  content=p.read_bytes();row.update(bytes=len(content),sha256=hashlib.sha256(content).hexdigest())
 return row
if __name__=='__main__':
 docs=json.loads((ROOT/'docs/curriculum/documents.json').read_text())
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(download,docs))
 (ROOT/'docs/curriculum/manifest.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
 for row in rows:print(row['id'],row['status'],row.get('bytes',row.get('error')))
