from pathlib import Path
from PIL import Image

TARGETS = [
    Path('/home/ubuntu/ironlog/assets/images/icon.png'),
    Path('/home/ubuntu/ironlog/assets/images/favicon.png'),
    Path('/home/ubuntu/ironlog/assets/images/android-icon-foreground.png'),
    Path('/home/ubuntu/ironlog/assets/images/splash-icon.png'),
]

MAX_SIZE = 512

for path in TARGETS:
    image = Image.open(path).convert('RGBA')
    width, height = image.size
    scale = min(MAX_SIZE / width, MAX_SIZE / height, 1)
    resized = image.resize((max(1, int(width * scale)), max(1, int(height * scale))), Image.LANCZOS)
    resized.save(path, format='PNG', optimize=True, compress_level=9)
    print(f'{path.name}: {path.stat().st_size}')
