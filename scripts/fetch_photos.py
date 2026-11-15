"""Fetch real photographs during GitHub Pages build, not at user page load.
Photo rights belong to credited originators. Review suitability/licences before publishing.
A photo failing download is *not* silently replaced by AI imagery.
"""
import json, pathlib, io, urllib.request, os, time
from PIL import Image, ImageOps
ROOT=pathlib.Path(__file__).resolve().parent.parent
sources=json.loads((ROOT/'scripts/photo_sources.json').read_text())
out=ROOT/'assets/photos'
out.mkdir(parents=True,exist_ok=True)
manifest={};success=[];failed=[]
for key,meta in sources.items():
 for url in meta['urls']:
  try:
   req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; NYCTripPhotoBuilder/1.0; +https://github.com)','Accept':'image/avif,image/webp,image/*,*/*;q=0.8','Referer':meta.get('source') or 'https://www.google.com/'})
   with urllib.request.urlopen(req,timeout=22) as res:
    if not res.headers.get('Content-Type','').startswith('image/'):
     raise RuntimeError('Not an image ('+str(res.headers.get('Content-Type'))+')')
    body=res.read(7*1024*1024+1)
   if len(body)>7*1024*1024:raise RuntimeError('Image exceeds 7MB budget')
   im=Image.open(io.BytesIO(body));im.verify();im=Image.open(io.BytesIO(body))
   im=ImageOps.exif_transpose(im).convert('RGB');im.thumbnail((1600,1100),Image.Resampling.LANCZOS)
   im.save(out/(key+'.jpg'),format='JPEG',quality=83,optimize=True,progressive=True)
   success.append(key);manifest[key]={"path":"assets/photos/"+key+".jpg","source":meta.get('source'),'credit':meta['credit'],'exact':meta.get('exact',False),'label':meta['label']}
   print('OK',key,im.size)
   break
  except Exception as e:
   print('RETRY',key,type(e).__name__,str(e)[:145]);time.sleep(.15)
 else:
  failed.append(key);manifest[key]={"path":None,"source":meta.get('source'),'credit':meta['credit'],'exact':meta.get('exact',False),'label':meta['label']}
(ROOT/'assets/photo-index.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
(ROOT/'assets/photo-index.js').write_text('window.NYC_PHOTO_INDEX = '+json.dumps(manifest,ensure_ascii=False,indent=2)+';\n')
print('REAL PHOTOS:',len(success),'FAILED:',len(failed),failed)
# Fail the build rather than publish the same pictureless product again.
critical=['hotel','cruise','westlight','watertower','lebain','butterfly','albertine','nypl','bluenote','domino']
missing=[k for k in critical if k not in success]
if len(missing)>3 and os.environ.get('ALLOW_INCOMPLETE_PHOTOS')!='1':
 raise SystemExit('Refusing pictureless deployment. Key venue photos missing: '+', '.join(missing))