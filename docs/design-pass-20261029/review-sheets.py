from pathlib import Path
from PIL import Image, ImageDraw
root = Path('C:/sw/synera-design/docs/design-pass-20261029')
shots = root / 'shots'
files = sorted(shots.glob('matrix-*.png')) + sorted(shots.glob('design-*.png'))
sheet_files = []
for batch in range(0, len(files), 4):
    group = files[batch:batch+4]
    sheet = Image.new('RGB',(800,1768),'#d9ddd6')
    draw = ImageDraw.Draw(sheet)
    for i, file in enumerate(group):
        img = Image.open(file).convert('RGB')
        # Full-page home is inspected separately; show its first viewport here.
        img = img.crop((0,0,img.width,min(img.height,round(img.width*844/390))))
        img.thumbnail((390,844))
        x=(i%2)*400+5;y=(i//2)*884+30
        sheet.paste(img,(x,y));draw.text((x,y-22),file.name,fill='#193e32')
    target=root/f'review-sheet-{batch//4+1:02d}.jpg'
    sheet.save(target,quality=95)
    sheet_files.append(target.name)
print('Sheets:', ', '.join(sheet_files))
full = Image.open(shots / 'design-iphone-home-full.png').convert('RGB')
height = round(full.width * 844 / 390)
sheet = Image.new('RGB',(800,1768),'#d9ddd6')
draw = ImageDraw.Draw(sheet)
for i, start in enumerate(range(0,full.height,height)):
    tile = full.crop((0,start,full.width,min(full.height,start+height)))
    tile.thumbnail((390,844))
    x = (i%2)*400+5; y = (i//2)*884+30
    sheet.paste(tile,(x,y)); draw.text((x,y-22),f'home-full segment {i+1}',fill='#193e32')
sheet.save(root/'review-sheet-14.jpg',quality=95)
