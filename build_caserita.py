# -*- coding: utf-8 -*-
import math, fitz

GREEN='#2E7D32'; GREEN_D='#1B5E20'; GREEN_BG='#E8F5E9'
INK='#1F2937'; GRAY='#6B7280'; GRAY2='#9CA3AF'; LINE='#E5E7EB'; SURF='#F4F5F3'; WHITE='#FFFFFF'
BLUE='#2563EB'; TAN='#C9A36B'; TERRA='#D98C5F'; AMBER='#E0A458'

PW,PH=420,840
PAD=70; GX=70; GY=96; TITLE=190; COLS=3
W=PAD*2+COLS*PW+(COLS-1)*GX
ROWS=2
H=TITLE+ROWS*PH+(ROWS-1)*GY+70

def rr(x,y,w,h,rx,fill,stroke=None,sw=1.5,dash=None):
    s=f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"'
    if stroke: s+=f' stroke="{stroke}" stroke-width="{sw}"'
    if dash: s+=f' stroke-dasharray="{dash}"'
    return s+'/>'

def tx(x,y,t,size,fill,bold=False,anchor='start',ls=None):
    b=' font-weight="bold"' if bold else ''
    l=f' letter-spacing="{ls}"' if ls else ''
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}"{b} text-anchor="{anchor}"{l}>{t}</text>'

def ln(x1,y1,x2,y2,stroke,sw=2,dash=None,cap='butt'):
    d=f' stroke-dasharray="{dash}"' if dash else ''
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="{cap}"{d}/>'

def ci(cx,cy,r,fill,stroke=None,sw=1.5):
    s=f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"'
    if stroke: s+=f' stroke="{stroke}" stroke-width="{sw}"'
    return s+'/>'

def pin(cx,cy,sc,fill):
    r=14*sc
    tri=f'<polygon points="{cx-r*0.72},{cy+r*0.35} {cx+r*0.72},{cy+r*0.35} {cx},{cy+r*1.85}" fill="{fill}"/>'
    return ci(cx,cy,r,fill)+tri+ci(cx,cy,r*0.42,WHITE)

def star(cx,cy,r,fill=AMBER):
    pts=[]
    for i in range(10):
        ang=-math.pi/2+i*math.pi/5
        rr_=r if i%2==0 else r*0.42
        pts.append(f'{cx+rr_*math.cos(ang):.1f},{cy+rr_*math.sin(ang):.1f}')
    return f'<polygon points="{" ".join(pts)}" fill="{fill}"/>'

def check(cx,cy,s,stroke):
    return f'<path d="M {cx-s} {cy} L {cx-s*0.28} {cy+s*0.72} L {cx+s} {cy-s*0.62}" fill="none" stroke="{stroke}" stroke-width="{s*0.42}" stroke-linecap="round" stroke-linejoin="round"/>'

def g_bread(cx,cy):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="22" ry="14" fill="{TAN}"/>'+ln(cx-9,cy-4,cx-3,cy+4,'#9c7a45',2.4,cap='round')+ln(cx+1,cy-5,cx+7,cy+3,'#9c7a45',2.4,cap='round')

def g_soup(cx,cy):
    s=f'<path d="M {cx-20} {cy-4} A 20 20 0 0 0 {cx+20} {cy-4} Z" fill="{TERRA}"/>'
    s+=f'<ellipse cx="{cx}" cy="{cy-4}" rx="20" ry="6" fill="#e6a07a"/>'
    s+=ln(cx-6,cy-16,cx-6,cy-22,GRAY2,2,cap='round')+ln(cx+6,cy-16,cx+6,cy-22,GRAY2,2,cap='round')
    return s

def g_salt(cx,cy):
    return f'<path d="M {cx-20} {cy+8} A 20 16 0 0 1 {cx+20} {cy+8} Z" fill="{AMBER}"/>'+f'<path d="M {cx-20} {cy+8} q 4 -6 8 0 q 4 -6 8 0 q 4 -6 8 0 q 4 -6 8 0 q 4 -6 8 0" fill="none" stroke="#b9842f" stroke-width="2"/>'

def statusbar():
    s=rr(PW/2-60,14,120,26,13,INK)
    s+=tx(28,44,'14:05',15,GRAY,bold=True)
    s+=rr(354,30,30,16,4,WHITE,stroke=GRAY,sw=1.5)+rr(386,34,3,8,1,GRAY)+rr(357,33,22,10,2,GREEN)
    s+=tx(340,44,'5G',13,GRAY,anchor='end')
    return s

def nav(active):
    y=792; xs=[96,184,236,324]
    icons=['home','search','bag','user']
    out=ln(24,y-22,396,y-22,LINE,1.5)
    cx=[88,176,264,352]
    for i,ic in enumerate(icons):
        c=GREEN if i==active else GRAY2
        x=cx[i]
        if ic=='home':
            out+=f'<polygon points="{x},{y-12} {x-12},{y} {x+12},{y}" fill="{c}"/>'+rr(x-8,y,16,12,2,c)
        elif ic=='search':
            out+=ci(x-2,y-6,9,'none',stroke=c,sw=3)+ln(x+5,y+2,x+11,y+8,c,3,cap='round')
        elif ic=='bag':
            out+=rr(x-11,y-6,22,18,3,'none',stroke=c,sw=2.6)+f'<path d="M {x-6} {y-6} a 6 8 0 0 1 12 0" fill="none" stroke="{c}" stroke-width="2.6"/>'
        else:
            out+=ci(x,y-9,6,c)+f'<path d="M {x-11} {y+8} a 11 9 0 0 1 22 0" fill="{c}"/>'
    return out

def btn(y,label):
    return rr(24,y,372,56,14,GREEN)+tx(PW/2,y+35,label,18,WHITE,bold=True,anchor='middle')

def chip(x,y,w,t,sel):
    f=GREEN if sel else SURF
    c=WHITE if sel else GRAY
    return rr(x,y,w,34,17,f)+tx(x+w/2,y+22,t,14,c,anchor='middle',bold=sel)

# ---------- SCREEN 1: HOME ----------
def screen_home():
    s=tx(24,98,'Caserita',30,GREEN,bold=True)
    s+=pin(360,90,0.85,GREEN)+tx(348,96,'Santa Cruz',15,GRAY,anchor='end')
    s+=rr(24,118,372,50,14,SURF)+ci(48,143,8,'none',stroke=GRAY2,sw=2.4)+ln(54,149,60,155,GRAY2,2.4,cap='round')+tx(74,149,'Buscar comida cerca',15,GRAY2)
    s+=tx(24,202,'Bolsas sorpresa cerca de ti',17,INK,bold=True)
    rows=[('Panadería La Espiga','Bolsa de pan del día','Bs 35','Bs 12','18:00 · 0.8 km','4.8',g_bread),
          ('Pensión Doña Mary','Almuerzo casero del día','Bs 25','Bs 10','14:30 · 1.2 km','4.7',g_soup),
          ('Salteñería El Horno','Salteñas de media mañana','Bs 18','Bs 7','10:30 · 0.5 km','4.9',g_salt)]
    y=220
    for name,desc,old,new,meta,rate,gl in rows:
        s+=rr(24,y,372,108,16,WHITE,stroke=LINE,sw=1.5)
        s+=rr(44,y+20,68,68,12,SURF)+gl(78,y+54)
        s+=tx(128,y+38,name,17,INK,bold=True)
        s+=tx(128,y+62,desc,14,GRAY)
        s+=tx(128,y+90,old,14,GRAY2)+ln(128,y+85,128+34,y+85,GRAY2,1.6)+tx(176,y+91,new,17,GREEN,bold=True)
        s+=tx(376,y+38,meta,13,GRAY,anchor='end')
        s+=star(352,y+62,8)+tx(346,y+67,rate,14,INK,anchor='end',bold=True)
        y+=120
    s+=nav(0)
    return s

# ---------- SCREEN 2: DETAIL ----------
def screen_detail():
    s=rr(24,70,372,150,16,SURF)
    s+=f'<ellipse cx="210" cy="142" rx="46" ry="31" fill="{TAN}"/>'+ln(190,134,204,152,'#9c7a45',3,cap='round')+ln(204,130,218,148,'#9c7a45',3,cap='round')+ln(218,134,230,150,'#9c7a45',3,cap='round')
    s+=ci(52,98,18,WHITE)+f'<path d="M 58 90 L 48 98 L 58 106" fill="none" stroke="{INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'
    s+=rr(316,86,64,28,14,GREEN)+tx(348,105,'-66%',15,WHITE,bold=True,anchor='middle')
    s+=tx(24,256,'Panadería La Espiga',21,INK,bold=True)
    s+=star(34,278,8)+tx(48,283,'4.8',14,INK,bold=True)+pin(120,276,0.7,GRAY2)+tx(132,283,'0.8 km',14,GRAY)
    s+=tx(24,316,'Bolsa sorpresa de pan del día:',14,GRAY)
    s+=tx(24,338,'marraqueta, cuñapé y empanadas.',14,GRAY)
    s+=tx(24,392,'Bs 35',16,GRAY2)+ln(24,386,24+44,386,GRAY2,2)+tx(86,396,'Bs 12',30,GREEN,bold=True)
    s+=rr(24,420,372,52,12,SURF)+ci(50,446,3,GRAY)+ci(50,446,10,'none',stroke=GRAY,sw=2)+ln(50,440,50,446,GRAY,2,cap='round')+ln(50,446,55,449,GRAY,2,cap='round')+tx(74,452,'Recoge hoy 18:00 – 19:00',14,INK)
    s+=rr(24,486,372,50,12,GREEN_BG)
    s+=f'<path d="M 48 511 C 40 503 56 497 50 489 C 64 495 60 511 48 511 Z" fill="{GREEN}"/>'
    s+=tx(74,516,'Salvas ~1.2 kg de comida · evitas 3 kg CO2',13,GREEN_D)
    s+=tx(24,580,'Pago al recoger: efectivo o QR Simple',13,GRAY)
    s+=btn(720,'Reservar  ·  Bs 12')
    return s

# ---------- SCREEN 3: CONFIRM ----------
def screen_confirm():
    s=ci(210,150,42,GREEN_BG)+check(210,150,20,GREEN)
    s+=tx(210,232,'¡Reservado!',23,INK,bold=True,anchor='middle')
    s+=tx(210,266,'Muestra este código al recoger',14,GRAY,anchor='middle')
    s+=rr(60,292,300,92,14,WHITE,stroke=GRAY2,sw=2,dash='7 6')
    s+=tx(210,352,'A7-K9',40,INK,bold=True,anchor='middle',ls=4)
    items=[(g_bread,'Panadería La Espiga'),(None,'Hoy 18:00 – 19:00 · 0.8 km'),(None,'Paga Bs 12 al recoger (efectivo o QR)')]
    y=430
    s+=rr(40,410,340,150,14,SURF)
    s+=ci(64,y-6,3,GRAY)+ci(64,y-6,9,'none',stroke=GRAY,sw=0)
    s+=g_bread(64,y-6)
    s+=tx(92,y,'Panadería La Espiga',15,INK,bold=True)
    s+=ln(64,y+18,64,y+24,GRAY,0)
    s+=ci(64,y+34,3,GRAY)+ci(64,y+34,10,'none',stroke=GRAY,sw=2)+ln(64,y+28,64,y+34,GRAY,2,cap='round')+ln(64,y+34,69,y+37,GRAY,2,cap='round')
    s+=tx(92,y+40,'Hoy 18:00 – 19:00 · 0.8 km',14,GRAY)
    s+=rr(56,y+62,16,12,2,'none',stroke=GRAY,sw=2)+ln(56,y+66,72,y+66,GRAY,2)
    s+=tx(92,y+74,'Paga Bs 12 al recoger (efectivo o QR)',14,GRAY)
    s+=rr(24,724,372,48,12,GREEN_BG)+f'<path d="M 48 754 C 40 746 56 740 50 732 C 64 738 60 754 48 754 Z" fill="{GREEN}"/>'+tx(74,758,'Llevas 12 comidas rescatadas este mes',13,GREEN_D)
    return s

# ---------- SCREEN 4: VENDOR ----------
def screen_vendor():
    s=rr(28,80,22,20,4,'none',stroke=INK,sw=2.4)+f'<path d="M 28 84 h 22 l -3 -8 h -16 Z" fill="{INK}"/>'
    s+=tx(60,98,'Modo vendedor',18,INK,bold=True)
    s+=tx(24,126,'Publica lo que te sobró hoy',14,GRAY)
    s+=tx(24,172,'¿Qué te sobró?',13,GRAY)
    s+=chip(24,184,118,'Pan del día',True)+chip(150,184,108,'Almuerzo',False)+chip(266,184,118,'Repostería',False)
    s+=tx(24,260,'Bolsas',13,GRAY)+rr(24,272,176,48,10,WHITE,stroke=LINE,sw=1.6)+tx(44,302,'5',16,INK,bold=True)
    s+=tx(220,260,'Precio',13,GRAY)+rr(220,272,176,48,10,WHITE,stroke=LINE,sw=1.6)+tx(240,302,'Bs 12',16,INK,bold=True)
    s+=tx(24,356,'Horario de recojo',13,GRAY)+rr(24,368,372,48,10,WHITE,stroke=LINE,sw=1.6)+tx(44,398,'18:00 – 19:00',16,INK,bold=True)
    s+=btn(452,'Publicar  (1 toque)')
    s+=rr(24,536,372,76,12,SURF)
    s+=f'<path d="M 52 560 a 16 16 0 1 0 -14 24 l -4 8 l 9 -3 a 16 16 0 0 0 9 -29 Z" fill="{GREEN}"/>'
    s+=tx(80,564,'O publica por WhatsApp:',13,INK,bold=True)
    s+=tx(80,588,'escribe "tengo 5 bolsas de pan" y listo.',13,GRAY)
    return s

# ---------- SCREEN 5: MAP ----------
def screen_map():
    s=rr(24,70,372,648,18,'#EAF0EC')
    cx,cy=210,360
    for r in (70,120,170,220):
        s+=ci(cx,cy,r,'none',stroke='#D3DED7',sw=6)
    for (x2,y2) in [(40,120),(380,120),(40,600),(380,600),(210,90),(210,690),(40,360),(380,360)]:
        s+=ln(cx,cy,x2,y2,'#D3DED7',5)
    s+=rr(40,86,118,32,16,WHITE,stroke=LINE,sw=1)+pin(58,102,0.55,GREEN)+tx(72,107,'Santa Cruz',13,INK,bold=True)
    offers=[(150,250,'Bs 12'),(300,300,'Bs 10'),(250,470,'Bs 7'),(120,430,'Bs 9'),(330,200,'Bs 8')]
    for (px,py,pr) in offers:
        s+=rr(px+14,py-22,58,26,13,WHITE,stroke=LINE,sw=1)+tx(px+43,py-4,pr,13,GREEN,bold=True,anchor='middle')
        s+=pin(px,py,1.0,GREEN)
    s+=ci(cx,cy,18,'#BBD3F7')+ci(cx,cy,8,BLUE,stroke=WHITE,sw=2.5)
    s+=rr(40,612,340,86,14,WHITE,stroke=LINE,sw=1.5)
    s+=rr(56,628,54,54,10,SURF)+g_bread(83,655)
    s+=tx(126,650,'Panadería La Espiga',15,INK,bold=True)
    s+=tx(126,674,'Bs 35',13,GRAY2)+ln(126,669,126+30,669,GRAY2,1.5)+tx(170,675,'Bs 12 · 0.8 km',14,GREEN,bold=True)
    s+=rr(300,638,64,34,17,GREEN)+tx(332,660,'Ver',14,WHITE,bold=True,anchor='middle')
    s+=nav(1)
    return s

# ---------- SCREEN 6: DELIVERY ----------
def screen_delivery():
    s=f'<path d="M 30 92 l 6 -10 a 12 12 0 0 1 10 -6 h 6" fill="none" stroke="{GREEN}" stroke-width="0"/>'
    s+=tx(24,98,'Modo delivery',18,INK,bold=True)
    s+=rr(330,80,52,28,14,GREEN)+ci(368,94,11,WHITE)
    # map strip with route
    s+=rr(24,124,372,168,16,'#EAF0EC')
    for r in (50,90,130):
        s+=ci(150,210,r,'none',stroke='#D3DED7',sw=5)
    s+=f'<path d="M 70 250 C 140 150 250 280 340 160" fill="none" stroke="{GREEN}" stroke-width="5" stroke-dasharray="2 8" stroke-linecap="round"/>'
    s+=rr(54,236,40,28,8,GREEN)+g_bread(74,250) if False else ''
    s+=ci(70,250,16,WHITE,stroke=GREEN,sw=3)+pin(70,246,0.7,GREEN)
    s+=ci(340,160,15,WHITE,stroke=INK,sw=3)+f'<polygon points="340,150 330,160 350,160" fill="{INK}"/>'+rr(334,160,12,9,1,INK)
    # courier dot on route
    s+=ci(210,205,17,GREEN)+f'<circle cx="210" cy="205" r="7" fill="{WHITE}"/>'+f'<path d="M204 205 h12 M210 199 v12" stroke="{GREEN}" stroke-width="0"/>'
    # tracker
    ty=336
    steps=[('Preparando',True),('En camino',True),('Entregado',False)]
    xs=[80,210,340]
    s+=ln(80,ty,340,ty,LINE,4)
    s+=ln(80,ty,210,ty,GREEN,4)
    for i,(lbl,done) in enumerate(steps):
        col=GREEN if done else WHITE
        s+=ci(xs[i],ty,12,col,stroke=GREEN if done else GRAY2,sw=2.5)
        if i==1: s+=ci(xs[i],ty,5,WHITE)
        s+=tx(xs[i],ty+34,lbl,13,(INK if done else GRAY2),anchor='middle',bold=(i==1))
    # ETA card
    s+=rr(24,398,372,76,14,GREEN_BG)
    s+=ci(64,436,24,GREEN)+rr(56,430,16,12,2,WHITE)+ci(60,446,4,WHITE)+ci(72,446,4,WHITE)
    s+=tx(104,428,'Llega en 15 min',19,GREEN_D,bold=True)
    s+=tx(104,454,'Tu pedido va en camino',13,GREEN_D)
    # order summary
    s+=rr(24,494,372,182,14,WHITE,stroke=LINE,sw=1.5)
    s+=rr(44,512,52,52,10,SURF)+g_bread(70,538)
    s+=tx(112,532,'Panadería La Espiga',15,INK,bold=True)
    s+=tx(112,556,'1 bolsa sorpresa de pan',13,GRAY)
    s+=ln(44,584,376,584,LINE,1.4)
    s+=tx(44,612,'Producto',14,GRAY)+tx(376,612,'Bs 12',14,INK,anchor='end')
    s+=tx(44,640,'Delivery',14,GRAY)+tx(376,640,'Bs 8',14,INK,anchor='end')
    s+=tx(44,668,'Total',15,INK,bold=True)+tx(376,668,'Bs 20',16,GREEN,bold=True,anchor='end')
    s+=btn(704,'Seguir en el mapa')
    return s

def phone(label,inner):
    s=rr(0,0,PW,PH,46,WHITE,stroke=LINE,sw=2)
    s+=statusbar()
    s+=inner
    s+=tx(PW/2,PH+44,label,24,GRAY,anchor='middle',bold=True)
    return s

screens=[('1 · Descubre',screen_home()),('2 · Elige',screen_detail()),('3 · Recoge',screen_confirm()),
         ('4 · Vendedor',screen_vendor()),('5 · Mapa Santa Cruz',screen_map()),('6 · Delivery',screen_delivery())]

body=''
body+=rr(PAD,48,64,64,18,GREEN)+pin(PAD+32,76,1.5,WHITE)
body+=tx(PAD+82,92,'Caserita',54,GREEN,bold=True)
body+=tx(PAD+84,132,'Comida buena, a mitad de precio  ·  Santa Cruz, Bolivia',24,GRAY)

for i,(label,inner) in enumerate(screens):
    c=i%COLS; r=i//COLS
    x=PAD+c*(PW+GX); y=TITLE+r*(PH+GY)
    body+=f'<g transform="translate({x},{y})">'+phone(label,inner)+'</g>'

svg=f'<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="sans-serif"><rect width="{W}" height="{H}" fill="{WHITE}"/>{body}</svg>'

open('caserita_mockup.svg','w',encoding='utf-8').write(svg)
doc=fitz.open('caserita_mockup.svg')
# vector PDF
pdfbytes=doc.convert_to_pdf()
out=fitz.open('pdf',pdfbytes); out.save('Caserita_Prototipo.pdf')
# 4K raster
doc[0].get_pixmap(matrix=fitz.Matrix(2.6,2.6)).save('Caserita_Prototipo_4K.png')
# preview + verify the PDF renders crisp when zoomed
doc[0].get_pixmap(matrix=fitz.Matrix(1.4,1.4)).save('caserita_preview.png')
v=fitz.open('Caserita_Prototipo.pdf')
v[0].get_pixmap(matrix=fitz.Matrix(1.6,1.6),clip=fitz.Rect(60,150,820,560)).save('caserita_pdf_zoom.png')
print('PDF page size pt:', round(v[0].rect.width), 'x', round(v[0].rect.height))
print('all done', W, H)
