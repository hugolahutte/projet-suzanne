"""Build a curated official-source catalogue; no generated teaching content."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
C3='https://eduscol.education.gouv.fr/4356/enseigner-au-cycle-3'
C4='https://eduscol.education.gouv.fr/4362/enseigner-au-cycle-4'
GT='https://eduscol.education.gouv.fr/4368/enseigner-au-lycee-generaltechnologique'
LV='https://www.education.gouv.fr/bo/2025/Hebdo22/MENE2504621A'
LCA='https://eduscol.education.gouv.fr/5808/programmes-et-ressources-en-langues-et-cultures-de-l-antiquite-voie-gt'
DOCS={
'cycle-3-base-2023':'https://eduscol.education.gouv.fr/sites/default/files/document/programme-d-enseignement-du-cycle-3-2023-100806.pdf',
'cycle-3-francais-2025':'https://www.education.gouv.fr/sites/default/files/programme-de-fran-ais-pour-le-cycle-3-439824.pdf',
'cycle-3-mathematiques-2025':'https://www.education.gouv.fr/sites/default/files/programme-de-math-matiques-pour-le-cycle-3-439827.pdf',
'cycle-4-base-2020':'https://cache.media.education.gouv.fr/file/31/89/1/ensel714_annexe3_1312891.pdf',
'cycle-4-francais-2026':'https://www.education.gouv.fr/sites/default/files/document/Annexe%201%20%E2%80%93%20Programme%20de%20fran%C3%A7ais%20pour%20le%20cycle%204-480713.pdf',
'cycle-4-mathematiques-2026':'https://www.education.gouv.fr/sites/default/files/document/Annexe%202%20%E2%80%93%20Programme%20de%20math%C3%A9matiques%20pour%20le%20cycle%204-480716.pdf',
'cycle-4-technologie-2024':'https://www.education.gouv.fr/sites/default/files/document/Annexe%20%E2%80%94%20Programme%20de%20technologie%20du%20cycle%204-368016.pdf',
'anglais-college-2025':'https://www.education.gouv.fr/sites/default/files/annexe-3-programme-d-anglais-pour-les-classes-de-coll-ge-440358.pdf',
'anglais-lycee-2025':'https://www.education.gouv.fr/sites/default/files/annexe-4-programme-d-anglais-pour-les-classes-de-lyc-e-g-n-ral-et-technologique-440361.pdf',
'emc-2024':'https://www.education.gouv.fr/sites/default/files/document/Annexe%20%E2%80%94%20Programme%20d%E2%80%99enseignement%20moral%20et%20civique%20du%20cours%20pr%C3%A9paratoire%20%C3%A0%20la%20classe%20terminale%20des%20voies%20g%C3%A9n%C3%A9rale,%20technologique%20et%20professionnelle%20et%20des%20classes%20pr%C3%A9parant%20au%20CAP-402159.pdf',
'evar-elementaire-2025':'https://www.education.gouv.fr/sites/default/files/document/Programme%20d%E2%80%99%C3%A9ducation%20%C3%A0%20la%20vie%20affective%20et%20relationnelle%20%C3%A0%20l%E2%80%99%C3%A9cole%20%C3%A9l%C3%A9mentaire-405261.pdf',
'evars-college-2025':'https://www.education.gouv.fr/sites/default/files/document/Programme%20d%E2%80%99%C3%A9ducation%20%C3%A0%20la%20vie%20affective%20et%20relationnelle,%20et%20%C3%A0%20la%20sexualit%C3%A9%20au%20coll%C3%A8ge-405264.pdf',
'lca-seconde-2019':'https://eduscol.education.gouv.fr/sites/default/files/document/spe579annexe1corr1063701pdf-83511.pdf',
'lca-premiere-2019':'https://eduscol.education.gouv.fr/sites/default/files/document/spe579annexe21062855pdf-83514.pdf',
'lca-terminale-2019':'https://eduscol.education.gouv.fr/sites/default/files/document/spe267annexe1158694pdf-83517.pdf',
'llca-premiere-2019':'https://eduscol.education.gouv.fr/sites/default/files/document/spe582annexe1063148pdf-83520.pdf',
'llca-terminale-2019':'https://eduscol.education.gouv.fr/sites/default/files/document/spe257annexe1158895pdf-83523.pdf',
}
DOCS.update({
'evars-lycee-2025':'https://www.education.gouv.fr/sites/default/files/document/Programme%20d%E2%80%99%C3%A9ducation%20%C3%A0%20la%20vie%20affective%20et%20relationnelle,%20et%20%C3%A0%20la%20sexualit%C3%A9%20au%20lyc%C3%A9e-405267.pdf',
'fca-6e-2021':'https://cache.media.education.gouv.fr/file/27/33/5/ensel785_annexe_1415335.pdf',
'llcer-anglais-premiere-2019':'https://eduscol.education.gouv.fr/sites/default/files/document/spe590annexe222-11063850pdf-83328.pdf',
'llcer-anglais-terminale-2019':'https://eduscol.education.gouv.fr/sites/default/files/document/spe256annexe21158999pdf-83364.pdf',
'llcer-anglais-premiere-oeuvres-2025':'https://eduscol.education.gouv.fr/sites/default/files/document/programmelimitatif1rellcerrs2025et2026anglaispdf-112110.pdf',
'llcer-anglais-terminale-oeuvres-2026':'https://eduscol.education.gouv.fr/sites/default/files/document/nsproglimitatifterminalellcerrs2026et2027annexe2-anglais-eduscolpdf-127244.pdf',
'llcer-amc-premiere-2020':'https://cache.media.education.gouv.fr/file/30/41/0/ensel287_annexe_1313410.pdf',
'llcer-amc-terminale-2020':'https://cache.media.education.gouv.fr/file/30/42/0/ensel292_annexe_1313420.pdf',
})
entries=[]
def add(id,title,subject,levels,track,source,doc=None,start=None,end=None,status='current',notes='',kind='programme'):
 e=dict(id=id,title=title,subject=subject,levels=levels,track=track,sourceUrl=source,effectiveFrom=start,effectiveTo=end,status=status,notes=notes,checkedAt='2026-10-12',sourceKind=kind)
 if doc:e.update(documentUrl=DOCS[doc],documentId=doc)
 entries.append(e)
for sub,label in [('francais','Français'),('mathematiques','Mathématiques')]:
 for level,start in [('CM2','2026-09-01'),('6e','2025-09-01')]:add(f'{level.lower()}-{sub}-2025',label,sub,[level],'commun',C3,f'cycle-3-{sub}-2025',start)
for sub,label in [('histoire-geographie','Histoire-géographie'),('eps','Éducation physique et sportive'),('arts-plastiques','Arts plastiques'),('education-musicale','Éducation musicale'),('histoire-des-arts','Histoire des arts'),('sciences-technologie','Sciences et technologie')]:
 add(f'cycle-3-{sub}',label,sub,['CM2','6e'],'commun',C3,'cycle-3-base-2023','2023-09-01' if sub=='sciences-technologie' else '2020-09-01',notes='Consulter uniquement la section de cette matière ; le PDF contient aussi des sections remplacées.')
add('cm2-langues','Langues vivantes — anglais et autres langues','anglais',['CM2'],'commun',C3,'cycle-3-base-2023','2020-09-01','2027-08-31','transition','Programme de cycle, non spécifique à une langue. Nouveau programme CM2 prévu en 2027.')
for sub,label in [('francais','Français'),('mathematiques','Mathématiques')]:
 add(f'5e-{sub}-2026',label,sub,['5e'],'commun',C4,f'cycle-4-{sub}-2026','2026-09-01')
 for level,end,start in [('4e','2027-08-31','2027-09-01'),('3e','2028-08-31','2028-09-01')]:
  add(f'{level}-{sub}-2020',label,sub,[level],'commun',C4,'cycle-4-base-2020','2020-09-01',end,'transition','Version applicable en 2026-2027.')
  add(f'{level}-{sub}-2026',f'{label} — prochaine version',sub,[level],'commun',C4,f'cycle-4-{sub}-2026',start,None,'transition','Publication anticipée ; ne pas utiliser avant effectiveFrom.')
for sub,label in [('arts-plastiques','Arts plastiques'),('education-musicale','Éducation musicale'),('eps','Éducation physique et sportive'),('histoire-geographie','Histoire-géographie'),('histoire-des-arts','Histoire des arts'),('physique-chimie','Physique-chimie'),('svt','Sciences de la vie et de la Terre'),('emi','Éducation aux médias et à l’information')]:
 add(f'cycle-4-{sub}',label,sub,['5e','4e','3e'],'commun',C4,'cycle-4-base-2020','2020-09-01',notes='Utiliser la section de cette matière ; les autres sections peuvent être remplacées.')
add('cycle-4-technologie','Technologie','technologie',['5e','4e','3e'],'commun',C4,'cycle-4-technologie-2024','2026-09-01',notes='Toutes classes couvertes depuis 2026 ; 5e depuis 2024, 4e depuis 2025.')
for level,start in [('6e','2025-09-01'),('5e','2026-09-01'),('4e','2027-09-01'),('3e','2028-09-01')]:
 add(f'{level}-anglais-2025','Anglais','anglais',[level],'commun',LV,'anglais-college-2025',start,status='current' if level in ['6e','5e'] else 'transition',notes='Nouveau programme : calendrier par classe à respecter.')
 if level in ['4e','3e']:add(f'{level}-anglais-2020','Anglais — programme encore applicable','anglais',[level],'commun',C4,'cycle-4-base-2020','2020-09-01',f'{int(start[:4])}-08-31','transition')
add('colleges-autres-langues','Autres langues vivantes étrangères — index officiel','langues-vivantes',['6e','5e','4e','3e'],'commun',LV,status='reference',notes='Annexes par langue. Même calendrier progressif que l’anglais ; 4e/3e restent en 2020 en 2026-2027.',kind='index')
add('cm2-emc','Enseignement moral et civique','emc',['CM2'],'commun',C3,'emc-2024','2025-09-01')
add('college-emc','Enseignement moral et civique','emc',['6e','5e','4e','3e'],'commun',C4,'emc-2024','2026-09-01',notes='Déploiement complet au collège en 2026 ; 5e depuis 2024, 4e depuis 2025.')
add('cm2-evar','Éducation à la vie affective et relationnelle','evar',['CM2'],'commun',C3,'evar-elementaire-2025','2025-09-01')
add('college-evars','Éducation à la vie affective et relationnelle, et à la sexualité','evars',['6e','5e','4e','3e'],'commun',C4,'evars-college-2025','2025-09-01')
for sub,levels in [('latin',['5e','4e','3e']),('grec',['3e'])]:
 add(f'college-{sub}',sub.capitalize()+' — langues et cultures de l’Antiquité',sub,levels,'option','https://www.education.gouv.fr/bo/16/Hebdo11/MENE1603855A.htm?cid_bo=99531',start='2016-09-01',notes='Annexe intégrale disponible en HTML. La page disciplinaire Éduscol renvoie à ce programme 2016.')
for levels,start in [(['2de'],'2025-09-01'),(['1re','Tle'],'2026-09-01')]:
 add('lycee-anglais-'+levels[0],'Anglais — lycée général et technologique','anglais',levels,'general-technologique',LV,'anglais-lycee-2025',start)
for level,nom,date in [('2de','seconde','2019-09-01'),('1re','premiere','2019-09-01'),('Tle','terminale','2020-09-01')]:
 for sub in ['latin','grec']:
  add(f'lycee-{level}-{sub}',sub.capitalize()+' — option LCA',sub,[level],'option',LCA,f'lca-{nom}-2019',date,notes='Disponibilité selon voie et établissement ; vérifier lors de l’inscription.')
  if level!='2de':add(f'lycee-{level}-llca-{sub}','Spécialité LLCA — '+sub,sub,[level],'general-specialite',LCA,f'llca-{nom}-2019',date)
add('llca-limitatif-2026','Œuvres au programme de terminale LLCA 2026–2028','latin-grec',['Tle'],'general-specialite','https://www.education.gouv.fr/bo/2026/Hebdo11/MENE2605298N',start='2026-09-01',end='2028-08-31',notes='À articuler avec le programme permanent de terminale LLCA.')
# The remaining upper-secondary entries are verified official indexes, not downloaded programmes.
INDEX=[
('francais','Français',['2de','1re'],'general-technologique','5793/programmes-et-ressources-en-francais-voie-gt'),
('mathematiques','Mathématiques',['2de','1re','Tle'],'general-technologique','5817/programmes-et-ressources-en-mathematiques-voie-gt'),
('physique-chimie','Physique-chimie',['2de','1re','Tle'],'general-technologique','5829/programmes-et-ressources-en-physique-chimie-voie-gt'),
('svt','Sciences de la vie et de la Terre',['2de','1re','Tle'],'general','5835/programmes-et-ressources-en-sciences-de-la-vie-et-de-la-terre-voie-gt'),
('ses','Sciences économiques et sociales',['2de','1re','Tle'],'general','5838/programmes-et-ressources-en-sciences-economiques-et-sociales-voie-gt'),
('enseignement-scientifique','Enseignement scientifique',['1re','Tle'],'general','5790/programmes-et-ressources-en-enseignement-scientifique-voie-g'),
('philosophie','Philosophie',['Tle'],'general-technologique','5826/programmes-et-ressources-en-philosophie-voie-gt'),
('hggsp','Histoire-géographie, géopolitique et sciences politiques',['1re','Tle'],'general-specialite','5802/programmes-et-ressources-en-histoire-geographie-geopolitique-et-sciences-politiques-voie-g'),
('hlp','Humanités, littérature et philosophie',['1re','Tle'],'general-specialite','5805/programmes-et-ressources-en-humanites-litterature-et-philosophie-voie-g'),
('llcer','Langues, littératures et cultures étrangères et régionales',['1re','Tle'],'general-specialite','5814/programmes-et-ressources-en-langues-litteratures-et-cultures-etrangeres-et-regionales-voie-g'),
('nsi','Numérique et sciences informatiques',['1re','Tle'],'general-specialite','5823/programmes-et-ressources-en-numerique-et-sciences-informatiques-voie-g'),
('emc','Enseignement moral et civique',['2de','1re','Tle'],'general-technologique','5787/programmes-et-ressources-en-enseignement-moral-et-civique-voie-gt'),
]
for sub,label,levels,track,path in INDEX:add('lycee-index-'+sub,label+' — ressources officielles',sub,levels,track,'https://eduscol.education.gouv.fr/'+path,status='reference',kind='index',notes='Index officiel complémentaire aux programmes détaillés du catalogue.')
for sub,label,levels,track in [
('histoire-geographie','Histoire-géographie',['2de','1re','Tle'],'general-technologique'),('eps','EPS et spécialité EPPCS',['2de','1re','Tle'],'general-technologique'),('snt','Sciences numériques et technologie',['2de'],'general-technologique'),('si','Sciences de l’ingénieur',['2de','1re','Tle'],'general-specialite'),('arts','Arts : cirque, plastiques, cinéma, danse, histoire des arts, musique, théâtre',['2de','1re','Tle'],'option-specialite'),('etlv','Enseignement technologique en langue vivante',['1re','Tle'],'technologique'),('dgemc','Droit et grands enjeux du monde contemporain',['Tle'],'option'),('options','Options : LSF, mathématiques expertes et complémentaires, enseignements technologiques',['2de','1re','Tle'],'option')
]+[(x.lower(),x,['1re','Tle'],'technologique') for x in ['ST2S','STL','STD2A','STI2D','STMG','STHR','S2TMD']]:
 add('lycee-index-'+sub,label+' — index officiel',sub,levels,track,GT,status='reference',kind='index',notes='Point d’accès vérifié ; sélectionner ensuite la matière, la série et la classe.')
add('lycee-evars','Éducation à la vie affective et relationnelle, et à la sexualité','evars',['2de','1re','Tle'],'general-technologique','https://eduscol.education.gouv.fr/5916/mettre-en-oeuvre-le-programme-evarevars','evars-lycee-2025','2025-09-01')
add('6e-fca','Français et culture antique','latin-grec',['6e'],'option','https://eduscol.education.gouv.fr/4779/francais-et-culture-antique','fca-6e-2021','2021-09-01')
LLCER='https://eduscol.education.gouv.fr/5814/programmes-et-ressources-en-langues-litteratures-et-cultures-etrangeres-et-regionales-voie-g'
for level,nom,start in [('1re','premiere','2019-09-01'),('Tle','terminale','2020-09-01')]:
 add(f'llcer-anglais-{level}','Spécialité LLCER anglais','anglais',[level],'general-specialite',LLCER,f'llcer-anglais-{nom}-2019',start)
 add(f'llcer-amc-{level}','Spécialité anglais, monde contemporain','anglais',[level],'general-specialite',LLCER,f'llcer-amc-{nom}-2020','2020-09-01')
add('llcer-anglais-1re-oeuvres','Œuvres LLCER anglais — première 2025–2027','anglais',['1re'],'general-specialite',LLCER,'llcer-anglais-premiere-oeuvres-2025','2025-09-01','2027-08-31')
add('llcer-anglais-tle-oeuvres','Œuvres LLCER anglais — terminale 2026–2028','anglais',['Tle'],'general-specialite',LLCER,'llcer-anglais-terminale-oeuvres-2026','2026-09-01','2028-08-31')
from extend_catalog import extend
extend(ROOT,DOCS,entries)
metadata=dict(schemaVersion=1,schoolYear='2026-2027',checkedAt='2026-10-12',jurisdiction='France',dateConvention='Dates effectives normalisées au 1er septembre de la rentrée concernée, bornes inclusives.',coverage='CM2 et collège : programmes communs et anglais, latin, grec référencés ; lycée GT : matières communes, spécialités générales, sept séries technologiques, options, langues étrangères et principaux programmes limitatifs. Hors voie professionnelle, STAV/biologie-écologie agricole, langues régionales, adaptations territoriales et sections internationales/binationales.',entries=entries)
(ROOT/'packages/curriculum/catalog.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
(ROOT/'docs/curriculum/documents.json').write_text(json.dumps([dict(id=k,url=v,path='docs/curriculum/sources/'+k+'.pdf') for k,v in DOCS.items()],ensure_ascii=False,indent=2)+'\n')
print(len(entries),'entries;',len(DOCS),'unique PDF documents')
