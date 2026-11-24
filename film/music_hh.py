import numpy as np, sys
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile
SR=44100; DUR=50.0; N=int(SR*DUR)
rng=np.random.default_rng(11)
BPM=90; BEAT=60/BPM; BAR=4*BEAT; O=2.6; S16=BEAT/4
def t_(n): return np.arange(n)/SR
def lp(x,f,o=2): return sosfilt(butter(o,f,'low',fs=SR,output='sos'),x)
def hp(x,f,o=2): return sosfilt(butter(o,f,'high',fs=SR,output='sos'),x)
def bp(x,a,b,o=2): return sosfilt(butter(o,[a,b],'band',fs=SR,output='sos'),x)
def bus(): return [np.zeros(N),np.zeros(N)]
DR,B8,MUS,FX=bus(),bus(),bus(),bus()
def put(sig,at,g=1.0,pan=0.0,b=None):
    i=int(round(at*SR))
    if i>=N or i<0: return
    s=sig[:N-i]*g; b=b or DR
    b[0][i:i+len(s)]+=s*np.sqrt(0.5*(1-pan)); b[1][i:i+len(s)]+=s*np.sqrt(0.5*(1+pan))
def saw(f,n,det=0.0):
    ph=f*(1+det)*t_(n); return 2*(ph-np.floor(ph+0.5))
def nf(name):
    m={'C':0,'Db':1,'D':2,'Eb':3,'E':4,'F':5,'Gb':6,'G':7,'Ab':8,'A':9,'Bb':10,'B':11}
    return 440*2**((m[name[:-1]]+12*(int(name[-1])+1)-69)/12)

# ---------- sounds ----------
def kick():
    n=int(SR*0.32); t=t_(n); f=52+130*np.exp(-t/0.03)
    x=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t/0.14)
    x+=0.5*hp(rng.standard_normal(n),2000)*np.exp(-t/0.005)
    return np.tanh(3.0*x)*0.85
def snare():
    n=int(SR*0.35); t=t_(n)
    body=np.sin(2*np.pi*np.cumsum(220-40*np.exp(-t/0.02))/SR)*np.exp(-t/0.045)
    nz=bp(rng.standard_normal(n),1500,10000)*np.exp(-t/0.11)
    return np.tanh(2.0*(0.8*body+1.0*nz))*0.7
def clap():
    n=int(SR*0.3); t=t_(n); x=bp(rng.standard_normal(n),1000,6000)
    e=sum(np.exp(-np.clip(t-d,0,None)/0.01)*(t>=d) for d in (0,0.009,0.019))+0.6*np.exp(-t/0.12)
    return x*e*0.4
def hat(open_=False):
    n=int(SR*(0.22 if open_ else 0.045)); t=t_(n)
    return hp(rng.standard_normal(n),8000,4)*np.exp(-t/(0.08 if open_ else 0.012))*0.3
def b808(f,dur,glide_to=None):
    n=int(SR*dur); t=t_(n)
    ff=f*np.ones(n)
    if glide_to: ff=f+(glide_to-f)*np.clip((t-dur*0.55)/(dur*0.3),0,1)
    ff=ff*(1+0.6*np.exp(-t/0.012))
    x=np.sin(2*np.pi*np.cumsum(ff)/SR)
    e=np.minimum(1,t/0.003)*np.exp(-t/1.1)*np.clip((dur-t)/0.03,0,1)
    return np.tanh(2.6*x*e)*0.75
def piano(f,dur,vel=1.0):
    n=int(SR*dur); t=t_(n); x=np.zeros(n)
    for k,a in ((1,1),(2,.45),(3,.25),(4,.12),(5,.08),(6,.05)):
        fk=f*k*(1+0.0004*k*k); x+=a*np.sin(2*np.pi*fk*t)*np.exp(-t*(1.2+0.9*k))
    x+=0.05*rng.standard_normal(n)*np.exp(-t/0.004)
    return lp(x,2600)*np.clip((dur-t)/0.05,0,1)*np.minimum(1,t/0.002)*0.18*vel
def strings(fs,dur):
    n=int(SR*dur); x=sum(saw(f,n,d) for f in fs for d in (-0.007,0,0.007))/(3*len(fs))
    t=t_(n); x=lp(x,1300); return x*np.clip(t/0.5,0,1)*np.clip((dur-t)/0.4,0,1)*0.32
def orch(fs,dur=0.9):
    n=int(SR*dur); t=t_(n); x=sum(saw(f,n,d) for f in fs for d in (-0.01,0,0.01))/(3*len(fs))
    x=lp(x,3200)+0.25*bp(rng.standard_normal(n),200,3000)*np.exp(-t/0.05)
    return np.tanh(1.5*x)*np.exp(-t/0.28)*np.minimum(1,t/0.004)*0.6
def bell(f,dur):
    n=int(SR*dur); t=t_(n); mod=np.sin(2*np.pi*f*3.5*t)*2.2*np.exp(-t/0.4)
    return np.sin(2*np.pi*f*t+mod)*np.exp(-t/0.7)*np.minimum(1,t/0.003)*0.16
def boom(dur=2.2):
    n=int(SR*dur); t=t_(n); f=28+80*np.exp(-t/0.1)
    x=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t/0.8)+lp(rng.standard_normal(n),700)*np.exp(-t/0.3)*0.6
    return np.tanh(2*x)*0.95
def crash(dur=2.5):
    n=int(SR*dur); t=t_(n); return hp(rng.standard_normal(n),5000)*np.exp(-t/0.8)*0.25
def riser(dur):
    n=int(SR*dur); t=t_(n); p=t/dur
    return (hp(rng.standard_normal(n),600)*p**2.5*0.35+np.sin(2*np.pi*np.cumsum(150+900*p**2)/SR)*p**2*0.2)*0.8
def revcym(dur=1.5):
    c=crash(dur); return c[::-1].copy()*0.9
def pop():
    n=int(SR*0.16); t=t_(n); f=450+800*np.exp(-t/0.02)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t/0.05)*0.3

# ---------- harmony: F minor  i – VI – iv – V ----------
prog=[('F1',['F3','Ab3','C4']),('Db2',['Db3','F3','Ab3']),('Bb1',['Bb2','Db3','F3']),('C2',['C3','E3','G3'])]
riff=[0,2,1,2, 0,2,1,2]  # 8th-note piano arpeggio pattern over chord tones (index into chord, +octave)
melody=[[('C5',1.5),('Ab4',.5),('G4',1),('F4',1)],[('Ab4',2),('F4',1),('Db5',1)],
        [('C5',1.5),('Bb4',.5),('Ab4',1),('F4',1)],[('G4',2),('E4',1),('C5',1)]]
kicks=[]
def bar(b): return O+b*BAR
def sw(k): return k*S16+(S16*0.16 if k%2 else 0)  # swing on 16ths
def drums(b,rolls=False,half=False,fill=False):
    s=bar(b)
    kpat=[0,7,10] if not half else [0]
    if b%2==1 and not half: kpat=[0,3,10,14]
    for k in kpat: put(kick(),s+sw(k),1.0); kicks.append(s+sw(k))
    if half: put(snare(),s+2*BEAT,0.9); put(clap(),s+2*BEAT,0.8,0.15)
    else:
        for q in (1,3): put(snare(),s+q*BEAT,0.95); put(clap(),s+q*BEAT,0.9,0.15)
    hs=range(0,16,2) if half else range(16)
    for k in hs:
        put(hat(open_=(k==14 and not half)),s+sw(k),0.85 if k%4==0 else 0.55,0.3)
    if rolls and not half:  # trap roll on beat 4
        for j in range(6): put(hat(),s+3*BEAT+BEAT*0.5+j*BEAT/12,0.4+0.07*j,0.3)
    if fill:
        for j in range(4): put(snare(),s+3*BEAT+j*S16,0.45+0.12*j)
def music(b,strings_on=False,bells=False,orch_on=False,light=False):
    s=bar(b); root,ch=prog[b%4]; cf=[nf(c) for c in ch]
    # 808 pattern
    if not light or True:
        pat=[(0,1.6),(1.75,0.6),(2.5,1.4)] if not light else [(0,3.8)]
        for st,ln in pat:
            nxt=nf(prog[(b+1)%4][0]) if st==2.5 and not light else None
            put(b808(nf(root),ln*BEAT,glide_to=nxt),s+st*BEAT,1.0*(0.8 if light else 1),0,B8)
    for k,ix in enumerate(riff):
        f=cf[ix]*(2 if k in (3,7) else 1)
        put(piano(f*2,BEAT*0.9,1.0 if k%4==0 else 0.75),s+k*BEAT/2,1.0,-0.2 if k%2 else 0.2,MUS)
    put(piano(cf[0],BAR,0.9),s,1.0,0,MUS);
    if strings_on or light: put(strings(cf+[cf[0]*2],BAR),s,1.0,0,MUS)
    if orch_on and b%2==0: put(orch([c*2 for c in cf]+[cf[0]]),s,1.0,0,MUS)
    if bells:
        tt=s
        for nt,ln in melody[b%4]:
            put(bell(nf(nt),ln*BEAT+0.4),tt,1.0,0.25,MUS); tt+=ln*BEAT

# ---------- arrangement ----------
# intro (0–2.6): boom, crackly filtered piano, reverse cymbal, stutter into drop
put(boom(),0.12,0.9,0,FX); put(orch([nf('F3'),nf('Ab3'),nf('C4'),nf('F2')],1.2),0.12,0.8,0,MUS)
for k in range(4): put(piano(nf(['F4','Ab4','C5','Ab4'][k]),0.6,0.8),0.7+k*BEAT/2,1.0,0,MUS)
put(revcym(1.3),2.6-1.3,1.0,0,FX); put(riser(1.6),1.0,0.8,0,FX)
for j in range(6): put(kick(),2.0+j*0.1,0.25+0.1*j);
# verse 1: bars 0–3 boom bap
for b in range(0,4): drums(b,fill=(b==3)); music(b)
put(crash(),bar(0),0.8,0,FX); put(boom(1.4),bar(0),0.6,0,FX)
# verse 2: bars 4–11 heavier
for b in range(4,12): drums(b,rolls=True,fill=(b in (7,11))); music(b,strings_on=True,bells=(b>=8),orch_on=True)
put(crash(),bar(4),0.8,0,FX); put(crash(),bar(8),0.8,0,FX)
# breakdown: bars 12–14 (install tutorial)
for b in range(12,15): drums(b,half=True); music(b,light=True)
put(riser(BAR),bar(14),1.0,0,FX); put(revcym(1.2),bar(15)-1.2,1.0,0,FX)
put(pop(),42.05,1.0,0,FX); put(pop(),43.2,0.6,0,FX)
# drop: bar 15 and first half of 16
for b in (15,16): drums(b,rolls=True); music(b,strings_on=True,bells=True,orch_on=True)
put(crash(),bar(15),0.9,0,FX); put(boom(1.4),bar(15),0.7,0,FX)
# outro (cut everything from 46.6): hits synced to end card
cut=int(46.6*SR)
for b_ in (DR,B8,MUS):
    for ch in b_: ch[cut:]*=np.exp(-np.arange(N-cut)/SR/0.05)
Fm=[nf('F3'),nf('Ab3'),nf('C4'),nf('F4')]
for tt,g in ((46.6,1.0),(47.0,0.75),(47.4,0.85)):
    put(orch(Fm,0.5),tt,g,0,MUS); put(kick(),tt,g); put(snare(),tt,0.7*g); put(b808(nf('F1'),0.4),tt,g,0,B8); kicks.append(tt)
put(crash(3),46.6,0.7,0,FX)
fin=48.1
put(boom(2.2),fin,1.0,0,FX); put(orch(Fm+[nf('F2')],1.9),fin,1.0,0,MUS); put(b808(nf('F1'),1.9),fin,1.0,0,B8)
put(strings(Fm,1.9),fin,1.2,0,MUS); put(crash(2),fin,0.9,0,FX)

# vinyl crackle + hiss through the whole thing
cr=np.zeros(N); idx=rng.integers(0,N,int(DUR*25)); cr[idx]=rng.uniform(-1,1,len(idx))
cr=lp(hp(cr,1500),6000)*0.5+lp(rng.standard_normal(N),4000)*0.004
FX[0]+=cr*0.5; FX[1]+=np.roll(cr,37)*0.5

# ---------- mix ----------
duck=np.ones(N); t=t_(N)
for k in kicks:
    i=int(k*SR); n=min(int(0.25*SR),N-i)
    if n>0: duck[i:i+n]=np.minimum(duck[i:i+n],1-0.5*np.exp(-t_(n)/0.07))
L=DR[0]+B8[0]*duck*1.0+MUS[0]*duck*0.95+FX[0]; R=DR[1]+B8[1]*duck*1.0+MUS[1]*duck*0.95+FX[1]
ir_n=int(SR*1.8); ir=rng.standard_normal(ir_n)*np.exp(-t_(ir_n)/0.45); ir=lp(ir,4500); ir/=np.sqrt(np.sum(ir**2))
send0=hp(MUS[0]+0.3*DR[0],350); send1=hp(MUS[1]+0.3*DR[1],350)
L+=fftconvolve(send0,ir)[:N]*0.22; R+=fftconvolve(send1,ir[::-1].copy()*0.15+ir*0.85)[:N]*0.22
mix=np.stack([L,R],1); mix=hp(mix.T,28).T
mix*=np.clip((DUR-t)/0.9,0,1)[:,None]
mix=mix/np.max(np.abs(mix))*1.7; mix=np.tanh(mix)*0.92
print('peak',np.max(np.abs(mix)),'rms',np.sqrt(np.mean(mix**2)))
wavfile.write(sys.argv[1],SR,(mix*32767).astype(np.int16))
