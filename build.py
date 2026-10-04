import base64
import json
from pathlib import Path

root = Path(__file__).resolve().parent
catalog = json.loads((root / 'catalog.json').read_text())['stickers']
images = {s['id']: base64.b64encode((root / 'assets' / s['file']).read_bytes()).decode() for s in catalog}
source = (root / 'server.template.mjs').read_text()
source = source.replace('__CATALOG__', json.dumps(catalog, ensure_ascii=False)).replace('__IMAGES__', json.dumps(images))
(root / 'index.mjs').write_text(source)
print(f'Built {len(catalog)} stickers; single-file source: {len(source.encode())} bytes')
