"""Curated expansion of the 2026-2027 upper-secondary official corpus."""
import hashlib,json,re,unicodedata

def extend(root,docs,entries):
 rows=json.loads((root/'packages/curriculum/lycee_sources.json').read_text())
 def put(row,levels,track,start,end=None,status='current',subject=None,title=None,suffix='',notes=''):
  subject=subject or row['subject']; doc='official-'+hashlib.sha256(row['url'].encode()).hexdigest()[:12]
  e=dict(id=f'{subject}-{doc}{suffix}',title=title or row['label'].split(' PDF')[0].split('†')[0],subject=subject,levels=levels,track=track,sourceUrl=row['sourceUrl'],effectiveFrom=start,effectiveTo=end,status=status,notes=notes,checkedAt='2026-10-12',sourceKind='programme')
  if row['pdf']:
   existing=next((key for key,url in docs.items() if url==row['url']),doc)
   docs[existing]=row['url'];e.update(documentUrl=row['url'],documentId=existing)
  else:e['sourceUrl']=row['url'];e['notes']+=' Texte intégral publié en HTML au Bulletin officiel.'
  entries.append(e)
 for r in rows:
  s=r['subject'];i=r['linkId'];label=r['label'];low=label.lower();start='2019-09-01';end=None;status='current';notes=''
  if s=='lv':
   langs=['allemand','arabe','chinois','espagnol','hébreu','italien','japonais','néerlandais','polonais','portugais','russe']; lang=next((l for l in langs if l in low),'langues-faible-diffusion')
   slug=''.join(c for c in unicodedata.normalize('NFKD',lang) if not unicodedata.combining(c))
   if 'collège' in low:
    for lev,year in [('6e',2025),('5e',2026),('4e',2027),('3e',2028)]:put(r,[lev],'commun',f'{year}-09-01',status='current' if year<=2026 else 'transition',subject=slug,title=f'{lang.capitalize()} — {lev}',suffix='-'+lev,notes='Annexe 2025 ; calendrier officiel progressif par classe.')
    for lev,year in [('4e',2027),('3e',2028)]:
     old={**r,'url':docs['cycle-4-base-2020'],'pdf':True}
     put(old,[lev],'commun','2020-09-01',f'{year}-08-31','transition',slug,f'{lang.capitalize()} — ancien programme de cycle encore applicable',suffix='-'+lev,notes='La partie langues vivantes du programme de cycle 4 reste applicable en 2026–2027.')
   else:
    put(r,['2de'],'general-technologique','2025-09-01',subject=slug,suffix='-2de')
    put(r,['1re','Tle'],'general-technologique','2026-09-01',subject=slug,suffix='-cycle-terminal')
   continue
  if s=='llcer':
   lang=low.split(' pdf')[0].split('†')[0];levels=['1re'] if i<15 or 28<=i<=32 else ['Tle'];subject=lang
   limited=i>=28
   start=('2025-09-01' if levels==['1re'] else '2026-09-01') if limited else ('2019-09-01' if levels==['1re'] else '2020-09-01')
   end=('2027-08-31' if levels==['1re'] else '2028-08-31') if limited else None
   put(r,levels,'general-specialite',start,end,subject=subject,title=f'LLCER {lang} — '+('œuvres imposées' if limited else 'programme')+' — '+levels[0]);continue
  levels=[]
  if 'seconde' in low:levels.append('2de')
  if 'première' in low or 'premières' in low:levels.append('1re')
  if 'terminale' in low or 'terminales' in low:levels.append('Tle')
  if not levels:levels=['1re','Tle'] if 'cycle terminal' in low else ['Tle']
  if s=='snt':levels=['2de']
  if s=='eps':levels=['2de','1re','Tle'] if i in [2,3] else ['1re','Tle']
  if s=='sti2d' and i==4:levels=['1re','Tle']
  track='general-technologique'
  if 'option' in low or s in ['lsf','dgemc','sciences-laboratoire']:track='option'
  elif s in ['st2s','stl','std2a','sti2d','stmg','sthr','s2tmd']:track='technologique-'+s
  elif 'spécialit' in low or s in ['hggsp','hlp','nsi','si']:track='general-specialite'
  elif 'technologique' in low and 'générale' not in low:track='technologique'
  elif 'générale' in low and 'technologique' not in low:track='general'
  if levels==['Tle'] or 'Tle' in levels:start='2020-09-01'
  if s=='francais':start='2020-09-01';levels=['2de'] if i==2 else ['1re']
  if s=='francais' and i==4:start='2026-09-01';end='2027-08-31'
  if s=='enseignement-scientifique':start='2023-09-01' if i==4 else '2024-09-01';levels=['1re'] if i==4 else ['Tle'];track='general'
  if s=='sthr':start=('2015-09-01' if '2de' in levels else '2017-09-01') if i!=3 else '2019-09-01';notes='Déploiement progressif des programmes spécifiques : seconde 2015, première 2016, terminale 2017.' if i!=3 else ''
  if s=='mathematiques':
   if 2<=i<=5:start='2026-09-01'
   if 6<=i<=8:start='2027-09-01';status='transition';notes='Nouveau programme publié en 2026, applicable en terminale seulement à la rentrée 2027.'
   if i in [14,16,17]:end='2027-08-31';status='transition';notes='Programme encore applicable à la terminale en 2026–2027.'
   if i==11:track='technologique-sthr'
  if s=='eps' and i in [3,4]:
   put(r,['2de','1re'] if i==3 else ['1re'],track,'2021-09-01',suffix='-2021',notes='Programme 2021 ; première application à la rentrée 2021.')
   put(r,['Tle'],track,'2022-09-01',suffix='-2022',notes='Programme 2021 ; application à la terminale à la rentrée 2022.');continue
  if s=='eps' and i==2:track='general-technologique';notes='Programme commun aux voies générale et technologique ; borne commune après déploiement en seconde/première en 2019 puis terminale en 2020.'
  if s=='lsf':start='2020-09-01';notes='Arrêté du 17 juillet 2020, article 2 : application à la rentrée 2020–2021.'
  if s=='dgemc':start='2022-09-01'
  if s=='arts':notes='Annexe commune à plusieurs disciplines artistiques. Dans les annexes intitulées première et terminale, seule la musique couvre les deux classes ; les autres disciplines concernent la première. Les annexes terminale distinctes ne contiennent pas la musique. Lire la section de la discipline et de la classe. Les arts du cirque sont présents en seconde et en spécialité, pas dans les annexes optionnelles du cycle terminal.'
  if s in ['arts-du-cirque','cinema-audiovisuel','theatre','musique']:
   start='2026-09-01';end='2027-08-31';track='option' if 'optionnel' in low else 'general-specialite'
  if s=='arts-plastiques':start='2026-09-01';track='general-specialite';levels=['Tle']
  if s=='histoire-des-arts':start='2023-09-01' if i==8 else '2026-09-01';track='option' if i in [7,8] else 'general-specialite'
  if s=='danse':
   track='general-specialite'
   if i==7:start='2022-09-01';end='2027-08-31';status='transition'
   else:
    put(r,['1re'],track,'2026-09-01',suffix='-1re',notes='Nouveau programme limitatif en première dès 2026.');put(r,['Tle'],track,'2027-09-01',status='transition',suffix='-Tle',notes='Nouveau programme limitatif en terminale seulement en 2027.');continue
  if s in ['histoire-geographie','physique-chimie','svt','ses','philosophie','snt']:
   title=s.replace('-',' ').capitalize()+' — '+label.split(' PDF')[0].split('†')[0]
  else:title=None
  put(r,levels,track,start,end,status,title=title,notes=notes)
 # The 2024 EMC programme is now in force throughout upper secondary.
 emc=dict(subject='emc',label='Enseignement moral et civique — lycée général et technologique',sourceUrl='https://eduscol.education.gouv.fr/5787/programmes-et-ressources-en-enseignement-moral-et-civique-voie-gt',url=docs['emc-2024'],pdf=True)
 put(emc,['2de','1re','Tle'],'general-technologique','2026-09-01',notes='Programme 2024 ; seconde depuis 2024, première depuis 2025, terminale depuis 2026.')
 for e in entries:
  if e['sourceKind']=='index':e['notes']='Index officiel complémentaire aux PDF du catalogue ; consulter le rapport de couverture pour les exclusions.'
