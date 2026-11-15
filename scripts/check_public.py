from pathlib import Path
import json
root=Path('_site')
required=['index.html','unlock.js','explorer.js','venues.js','styles.css','assets/private.vault.json','assets/photo-index.js','assets/photos/skyline.jpg']
for f in required:
 assert (root/f).is_file(),f'Missing required offline asset {f}'
vault=json.loads((root/'assets/private.vault.json').read_text())
assert vault['algorithm']=='AES-256-GCM' and len(vault['ct'])>40000
for name in ['data.js','itinerary.js','app.js','mta.js','photo-sources.js','custom-stops.js','private_source']:
 assert not (root/name).exists(),f'Plaintext/private module published: {name}'
assert len(list((root/'assets/photos').glob('*.jpg')))>=24,'Photo coverage insufficient'
for f in [root/'index.html',root/'unlock.js']:
 text=f.read_text()
 for bad in ['132 W 47th','Sanctuary Hotel','2026-11-23','Ben & Lyna','River Café']:
  assert bad not in text, f'Private itinerary string leaked into {f.name}: {bad}'
print('Security build PASS: first-party itinerary encrypted, no plain modules published, real venue photos local.')