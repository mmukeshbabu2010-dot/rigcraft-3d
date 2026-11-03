import json, math, struct
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
CAT=json.loads((ROOT/'parts.json').read_text())
OUT=ROOT/'assets/models/catalogue'; OUT.mkdir(parents=True,exist_ok=True)
MATS={'black':((.025,.035,.045,1),.5,.3),'dark':((.01,.016,.022,1),.6,.22),'metal':((.42,.49,.54,1),.78,.24),'aluminium':((.68,.72,.75,1),.84,.2),'pcb':((.025,.13,.105,1),.25,.42),'pcb2':((.045,.08,.15,1),.22,.48),'gold':((.8,.55,.18,1),.82,.2),'copper':((.62,.3,.12,1),.8,.25),'glass':((.1,.17,.22,.32),.45,.12),'rgb':((.12,.82,.76,1),.3,.22),'white':((.84,.88,.9,1),.18,.3),'fanblade':((.075,.1,.13,1),.32,.4),'rubber':((.018,.022,.026,1),.05,.82),'red':((.5,.04,.05,1),.3,.35)}
def unit(v):
 l=math.sqrt(sum(x*x for x in v)) or 1; return tuple(x/l for x in v)
class Mesh:
 def __init__(self): self.g={k:{'p':[],'n':[],'i':[]} for k in MATS}
 def tri(self,a,b,c,mat):
  n=unit(((b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]),(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]),(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])))
  q=self.g[mat]; k=len(q['p'])//3
  for v in (a,b,c): q['p']+=list(v);q['n']+=list(n)
  q['i'] += [k,k+1,k+2]
 def quad(self,a,b,c,d,mat):
  n=unit(((b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]),(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]),(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])))
  q=self.g[mat];k=len(q['p'])//3
  for v in (a,b,c,d):q['p']+=list(v);q['n']+=list(n)
  q['i'] += [k,k+1,k+2,k,k+2,k+3]
 def box(self,c,s,mat):
  x,y,z=c; a,b,d=[v/2 for v in s];v=[(x-a,y-b,z-d),(x+a,y-b,z-d),(x+a,y+b,z-d),(x-a,y+b,z-d),(x-a,y-b,z+d),(x+a,y-b,z+d),(x+a,y+b,z+d),(x-a,y+b,z+d)]
  for f in [(0,3,2,1),(4,5,6,7),(0,4,7,3),(1,2,6,5),(0,1,5,4),(3,7,6,2)]: self.quad(*[v[i] for i in f],mat)
 def cyl(self,c,r,h,mat,axis='y',n=20):
  x,y,z=c
  def pt(a,o):
   u,v=math.cos(a)*r,math.sin(a)*r
   return (x+u,y+o,z+v) if axis=='y' else (x+u,y+v,z+o)
  for i in range(n):
   a=2*math.pi*i/n;b=2*math.pi*(i+1)/n
   self.quad(pt(a,-h/2),pt(b,-h/2),pt(b,h/2),pt(a,h/2),mat)
   if axis=='y': self.tri((x,y-h/2,z),pt(b,-h/2),pt(a,-h/2),mat);self.tri((x,y+h/2,z),pt(a,h/2),pt(b,h/2),mat)
   else: self.tri((x,y,z-h/2),pt(a,-h/2),pt(b,-h/2),mat);self.tri((x,y,z+h/2),pt(b,h/2),pt(a,h/2),mat)
 def ring(self,c,r,t,mat,axis='y',n=36,k=8):
  x,y,z=c
  def pt(a,b):
   rr=r+t*math.cos(b);dd=t*math.sin(b)
   return (x+rr*math.cos(a),y+dd,z+rr*math.sin(a)) if axis=='y' else (x+rr*math.cos(a),y+rr*math.sin(a),z+dd)
  for i in range(n):
   a=2*math.pi*i/n;aa=2*math.pi*(i+1)/n
   for j in range(k):
    b=2*math.pi*j/k;bb=2*math.pi*(j+1)/k
    self.quad(pt(a,b),pt(aa,b),pt(aa,bb),pt(a,bb),mat)
 def fan(self,c,r,axis='y',rgb=False):
  x,y,z=c;mat='rgb' if rgb else 'metal'
  if axis=='y':
   self.box((x,y,z),(2*r,.075,2*r),'black')
   for xx,zz in [(-1,-1),(1,-1),(1,1),(-1,1)]: self.cyl((x+xx*r*.78,y+.05,z+zz*r*.78),r*.05,.02,'metal',n=12)
   self.ring((x,y+.06,z),r*.82,r*.05,'metal');self.ring((x,y+.07,z),r*.67,r*.018,'dark')
   for i in range(7):
    a=2*math.pi*i/7
    def pt(rr,ang):return (x+rr*math.cos(ang),y+.105,z+rr*math.sin(ang))
    self.quad(pt(r*.16,a),pt(r*.78,a+.32),pt(r*.68,a+.8),pt(r*.28,a+.52),'fanblade')
   self.cyl((x,y+.11,z),r*.2,.08,'dark',n=32);self.cyl((x,y+.16,z),r*.115,.025,mat,n=32)
  else:
   self.box((x,y,z),(2*r,2*r,.075),'black');self.ring((x,y,z+.06),r*.82,r*.05,'metal','z');self.ring((x,y,z+.07),r*.67,r*.018,'dark','z')
   for i in range(7):
    a=2*math.pi*i/7
    def pt(rr,ang):return (x+rr*math.cos(ang),y+rr*math.sin(ang),z+.105)
    self.quad(pt(r*.16,a),pt(r*.78,a+.32),pt(r*.68,a+.8),pt(r*.28,a+.52),'fanblade')
   self.cyl((x,y,z+.11),r*.2,.08,'dark','z',32);self.cyl((x,y,z+.16),r*.115,.025,mat,'z',32)
def case(m,p):
 compact=p['id']=='compact-itx';w,h,d=(1.05,1.55,1.05) if compact else (1.38,2.05,1.35)
 for x in [-w/2,w/2]:
  for y in [-h/2,h/2]:m.box((x,y,0),(.075,.075,d),'metal')
 for x in [-w/2,w/2]:
  for z in [-d/2,d/2]:m.box((x,0,z),(.075,h,.075),'metal')
 for y in [-h/2,h/2]:
  for z in [-d/2,d/2]:m.box((0,y,z),(w,.075,.075),'metal')
 m.box((w/2+.015,0,0),(.025,h*.91,d*.91),'glass');m.box((-w/2+.03,0,0),(.04,h*.88,d*.88),'black')
 m.box((0,0,d/2),(w*.88,h*.84,.045),'dark')
 for i in range(11):
  for j in range(17):m.cyl((-.38*w+i*.076*w,-.39*h+j*.049*h,d/2+.03),.007,.012,'metal','z',8)
 for i in range(3):m.fan((0,h*.29-i*h*.29,d/2+.075),.22,'z')
 m.box((-w*.24,0,-.08),(.035,h*.79,d*.78),'metal');m.box((0,-h*.36,-.05),(w*.82,.16,d*.78),'black')
 for i in range(7):m.box((w*.38,-h*.22+i*.065,-d*.38),(.025,.035,.34),'metal')
def board(m,p):
 ff=p.get('form_factor','ATX');sx,sz=(1.65,1.85) if ff=='ATX' else ((1.65,1.35) if ff=='Micro-ATX' else (1.25,1.25))
 m.box((0,0,0),(sx,.075,sz),'pcb' if p.get('socket')=='AM5' else 'pcb2')
 for x in [-.68,.68]:
  for z in [-.72,.72]:m.cyl((x,.045,z),.04,.012,'gold')
 m.box((-.15,.12,-.05),(.52,.11,.52),'dark');m.box((-.15,.19,-.05),(.43,.045,.43),'aluminium');m.box((-.15,.22,-.05),(.34,.025,.34),'metal');m.box((.09,.22,-.05),(.035,.025,.48),'gold')
 for i in range(p.get('memory_slots',4)):
  z=-.67+i*.16;m.box((.52,.13,z),(.075,.13,1.05),'black');m.box((.56,.19,z),(.025,.035,.98),'gold')
  for zz in [-.53,.53]:m.box((.52,.19,z+zz),(.09,.11,.045),'white')
 for x in [-.72,-.42]:
  m.box((x,.16,-.61),(.18,.22,.48),'dark')
  for i in range(8):m.box((x,.29,-.82+i*.06),(.19,.035,.025),'aluminium')
 for z,l in [(0,1.18),(.34,.78),(.61,.54)]:m.box((-.05,-.01,z),(l,.09,.09),'black');m.box((-.05,.045,z),(l*.82,.018,.025),'gold')
 m.box((.55,.12,.48),(.38,.18,.32),'metal')
 for i in range(p.get('m2_slots',2)):
  z=-.42+i*.35;m.box((-.08,.12,z),(.76,.08,.14),'dark');m.box((-.08,.17,z),(.68,.035,.1),'aluminium')
 for i in range(14):m.cyl((-.78+(i%7)*.12,.13,.76+(i//7)*.09),.035,.12,'aluminium')
 for i in range(p.get('sata_ports',4)):m.box((.73,.12,-.65+i*.13),(.18,.12,.095),'dark')
 m.box((-.78,.12,-.05),(.18,.3,.78),'metal')
 for i in range(5):m.box((-.78,.2,-.34+i*.14),(.2,.11,.07),'dark')
def cpu(m,p):
 m.box((0,0,0),(.92,.12,.92),'dark');m.box((0,.075,0),(.87,.055,.87),'aluminium');m.box((0,.108,0),(.78,.025,.78),'metal');m.box((0,.126,0),(.68,.012,.68),'black')
 for x in range(12):
  for z in range(12):m.box((-.32+x*.058,-.073,-.32+z*.058),(.022,.009,.022),'gold')
 for x in [-.4,.4]:
  for z in [-.4,.4]:m.box((x,.11,z),(.045,.02,.045),'dark')
def gpu(m,p):
 length=max(.95,min(1.65,p.get('length_mm',280)/220));width=max(.65,min(1.08,p.get('size_x',.85)))*.72
 m.box((0,0,0),(width,.28,length),'dark');m.box((0,.16,0),(width*.98,.045,length*.98),'black');m.box((0,.19,0),(width*.96,.025,length*.94),'metal')
 count=2 if p['id']=='rtx4070' else 3
 for i in range(count):m.fan((0,.22,(i-(count-1)/2)*length*.29),.19 if count==2 else .15)
 for i in range(28):
  z=-length*.46+i*length*.92/27;m.box((width*.49,-.005,z),(.035,.23,.012),'aluminium');m.box((-width*.49,-.005,z),(.035,.23,.012),'aluminium')
 for x in [-.2,0,.2]:m.cyl((x,-.16,0),.025,length*.8,'copper','z',12)
 m.box((0,-.17,0),(width*.94,.035,length*.95),'aluminium');m.box((0,-.2,0),(width*.65,.025,length*.68),'black')
 m.box((width/2+.04,-.02,0),(.09,.36,length*.8),'metal');m.box((width/2+.04,-.02,length*.38),(.09,.3,.16),'dark')
 for i in range(22):m.box((-.31+i*.029,-.225,-.02),(.018,.012,.16),'gold')
 m.box((width*.22,.23,-length*.42),(.18,.06,.16),'dark')
def psu(m,p):
 m.box((0,0,0),(1.55,.68,1.2),'black');m.box((0,.35,0),(1.5,.035,1.15),'metal');m.ring((0,.39,0),.37,.028,'metal');m.fan((0,.405,0),.31)
 for i in range(8):
  for j in range(3):m.cyl((.76,.18-j*.13,-.43+i*.12),.022,.015,'dark','x',10)
 m.box((0,-.12,.615),(.55,.3,.035),'metal')
 for i in range(8):
  x=-.2+(i%4)*.13;y=-.05-(i//4)*.13;m.box((x,y,.64),(.08,.08,.025),'dark');m.box((x,y,.66),(.035,.035,.012),'gold')
 m.box((0,.2,-.615),(.65,.24,.035),'dark')
 for i in range(9):m.box((-.28+i*.07,.2,-.64),(.025,.15,.025),'metal')
def ram(m,p):
 for i in range(2):
  z=(i-.5)*.34;m.box((0,0,z),(.075,1.28,.19),'dark');m.box((.045,.02,z),(.028,1.08,.16),'metal')
  for j in range(10):m.box((.06,-.48+j*.105,z),(.012,.07,.13),'black')
  m.box((0,.67,z),(.09,.07,.2),'rgb')
  for j in range(28):m.box((0,-.7+j*.026,z),(.14,.012,.018),'gold')
  for x in [-.08,.08]:
   for y in [-.48,.48]:m.box((x*.55,y,z),(.012,.04,.18),'aluminium')
def cooler(m,p):
 if p['cooling_type']=='Air':
  for x in [-.23,.23]:
   m.box((x,0,0),(.42,1.05,.56),'aluminium')
   for j in range(22):m.box((x,.48-j*.045,0),(.44,.012,.58),'metal')
  for x in [-.23,0,.23]:m.cyl((x,-.58,0),.035,.82,'copper')
  m.fan((-.47,0,0),.28);m.fan((.47,0,0),.28)
 else:
  n=p.get('fan_count',2);span=.48*n;m.box((0,.02,0),(span,.18,.68),'dark')
  for i in range(n):m.fan(((i-(n-1)/2)*.48,.14,0),.21)
  for side in [-1,1]:
   for k in range(18):
    t=k/17;m.cyl((side*span*(.22+.28*t),.02-t*.42,.25+t*.42),.035,.08,'rubber','z',12)
  m.box((-.75,-.4,.45),(.42,.35,.42),'black');m.cyl((-.75,-.2,.45),.16,.12,'metal');m.cyl((-.75,-.12,.45),.11,.045,'rgb')
def storage(m,p):
 if p['drive_type']=='2.5-inch SATA':
  m.box((0,0,0),(.85,.14,1.02),'black');m.box((0,.085,0),(.79,.025,.94),'aluminium')
  for x in [-.36,.36]:
   for z in [-.42,.42]:m.cyl((x,.1,z),.035,.02,'metal')
  m.box((0,-.12,.54),(.42,.12,.06),'dark')
 else:
  m.box((0,0,0),(.25,.04,1.5),'pcb2');m.box((0,.03,0),(.22,.025,.62),'metal')
  for i in range(5):m.box((0,.05,-.58+i*.28),(.2,.025,.19),'dark' if i%2 else 'metal')
  for i in range(18):m.box((-.105+i*.012,-.025,.72),(.009,.012,.12),'gold')
  m.cyl((0,.05,-.68),.035,.025,'metal')
def fans(m,p):
 n=p.get('count',3);r=.32*p.get('size_mm',120)/120
 for i in range(n):m.fan(((i-(n-1)/2)*r*2.35,0,0),r,'y',p.get('rgb',False))
BUILD={'cases':case,'motherboards':board,'cpus':cpu,'gpus':gpu,'psus':psu,'ram':ram,'coolers':cooler,'storage':storage,'fans':fans}
def make_glb(mesh,p,cat):
 blob=bytearray();views=[];acc=[];prims=[]
 def put(data,target,ctype,count,typ,mins=None,maxs=None):
  while len(blob)%4:blob.append(0)
  off=len(blob);blob.extend(data);views.append({'buffer':0,'byteOffset':off,'byteLength':len(data),'target':target});a={'bufferView':len(views)-1,'byteOffset':0,'componentType':ctype,'count':count,'type':typ}
  if mins is not None:a.update({'min':mins,'max':maxs})
  acc.append(a);return len(acc)-1
 for mat,g in [(k,v) for k,v in mesh.g.items() if v['p']]:
  p0=g['p'];n0=g['n'];ix=g['i'];pa=put(struct.pack('<%sf'%len(p0),*p0),34962,5126,len(p0)//3,'VEC3',[min(p0[i::3]) for i in range(3)],[max(p0[i::3]) for i in range(3)]);na=put(struct.pack('<%sf'%len(n0),*n0),34962,5126,len(n0)//3,'VEC3');ia=put(struct.pack('<%sI'%len(ix),*ix),34963,5125,len(ix),'SCALAR');prims.append({'attributes':{'POSITION':pa,'NORMAL':na},'indices':ia,'material':list(MATS).index(mat),'mode':4})
 mats=[]
 for name,(color,metal,rough) in MATS.items():
  mat={'name':name,'pbrMetallicRoughness':{'baseColorFactor':color,'metallicFactor':metal,'roughnessFactor':rough},'doubleSided':True}
  if color[3]<1:mat['alphaMode']='BLEND'
  mats.append(mat)
 doc={'asset':{'version':'2.0','generator':'RigCraft original mesh generator 1.0'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'name':p['id'],'mesh':0,'extras':{'catalogueId':p['id'],'displayName':p['name'],'geometryOrigin':'original-custom-mesh','manufacturerCAD':False}}],'meshes':[{'name':p['name'],'primitives':prims}],'materials':mats,'accessors':acc,'bufferViews':views,'buffers':[{'byteLength':len(blob)}],'extras':{'catalogueId':p['id'],'category':cat,'displayName':p['name'],'meshType':'original-custom-high-detail','manufacturerCAD':False,'dimensionsPolicy':'visual proportions; only catalogue-supplied dimensions are verified'}}
 js=json.dumps(doc,separators=(',',':')).encode();js+=b' '*((4-len(js)%4)%4);blob+=b'\0'*((4-len(blob)%4)%4);total=12+8+len(js)+8+len(blob)
 return struct.pack('<4sII',b'glTF',2,total)+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(blob),b'BIN\0')+blob
count=0;total=0
for cat,items in CAT.items():
 for p in items:
  m=Mesh();BUILD[cat](m,p);b=make_glb(m,p,cat);(OUT/(p['id']+'.glb')).write_bytes(b);count+=1;total+=len(b)
  print(p['id'],len(b),sum(len(x['i'])//3 for x in m.g.values()))
print('GENERATED',count,'assets',round(total/1024,1),'KiB')
