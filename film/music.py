import numpy as np, sys
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile
SR=44100; DUR=50.0; N=int(SR*DUR)
rng=np.random.default_rng(7)
BPM=120; BEAT=60/BPM; BAR=4*BEAT; O=2.6   # first downbeat (drop) at 2.6 s
L=np.zeros(N); R=np.zeros(N)
def t_(n): return np.arange(n)/SR
def lp(x,f,o=2): return sosfilt(butter(o,f,'low',fs=SR,output='sos'),x)
def hp(x,f,o=2): return sosfilt(butter(o,f,'high',fs=SR,output='sos'),x)
def bp(x,a,b,o=2): return sosfilt(butter(o,[a,b],'band',fs=SR,output='sos'),x)
def put(sig,at,g=1.0,pan=0.0,bus=None):
    i=int(round(at*SR));
    if i>=N: return
    s=sig[:N-i]*g; lg=np.sqrt(0.5*(1-pan)); rg=np.sqrt(0.5*(1+pan))
    (bus or (L,R))[0][i:i+len(s)]+=s*lg; (bus or (L,R))[1][i:i+len(s)]+=s*rg
def saw(f,n,det=0.0):
    t=t_(n); ph=(f*(1+det))*t; return 2*(ph-np.floor(ph+0.5))
def env(n,a=0.005,d=0.2,s=0.0,rel=None):
    t=t_(n); e=np.minimum(1,t/max(a,1e-4))*((1-s)*np.exp(-t/d)+s)
    if rel: e*=np.clip((n/SR-t)/rel,0,1)
    return e
def nf(name):
    m={'C':0,'C#':1,'D':2,'D#':3,'E':4,'F':5,'F#':6,'G':7,'G#':8,'A':9,'A#':10,'B':11}
    k=name[:-1]; o=int(name[-1]); return 440*2**((m[k]+12*(o+1)-69)/12)

# ---------- instruments ----------
def kick(big=False):
    n=int(SR*(0.6 if big else 0.42)); t=t_(n)
    f=45+110*np.exp(-t/0.045); ph=2*np.pi*np.cumsum(f)/SR
    x=np.sin(ph)*np.exp(-t/(0.32 if big else 0.22))
    x+=0.35*rng.standard_normal(n)*np.exp(-t/0.004)
    return np.tanh(2.2*x)*0.9
def snare():
    n=int(SR*0.45); t=t_(n)
    body=np.sin(2*np.pi*185*t)*np.exp(-t/0.05)
    nz=bp(rng.standard_normal(n),1200,9000)
    tail=nz*np.where(t<0.22,np.exp(-t/0.25),np.exp(-0.22/0.25)*np.exp(-(t-0.22)/0.015))  # 80s gated
    return np.tanh(1.6*(0.7*body+0.9*tail))*0.75
def clap():
    n=int(SR*0.25); t=t_(n); x=bp(rng.standard_normal(n),900,5000)
    e=sum(np.exp(-np.clip(t-d,0,None)/0.012)*(t>=d) for d in (0,0.011,0.022))+0.5*np.exp(-t/0.09)
    return x*e*0.35
def hat(open_=False):
    n=int(SR*(0.25 if open_ else 0.05)); t=t_(n)
    return hp(rng.standard_normal(n),7000,4)*np.exp(-t/(0.09 if open_ else 0.014))*0.32
def crash(dur=2.5):
    n=int(SR*dur); t=t_(n); return hp(rng.standard_normal(n),4500,2)*np.exp(-t/0.9)*0.3
def boom(dur=2.0):
    n=int(SR*dur); t=t_(n); f=30+70*np.exp(-t/0.12)
    x=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t/0.7)
    x+=lp(rng.standard_normal(n),900)*np.exp(-t/0.25)*0.5
    return np.tanh(1.8*x)*0.95
def power(root,dur,mute=False):
    n=int(SR*dur); fs=[root,root*1.4983,root*2]
    x=sum(saw(f,n,d)+saw(f,n,-d) for f in fs for d in (0.0,0.004))
    x=np.tanh(4.5*x/len(fs))
    x=lp(x,1700 if mute else 3800,2); x=hp(x,90)
    e=env(n,0.003,0.07 if mute else 0.9,0.0 if mute else 0.35,rel=0.04)
    return x*e*(0.28 if mute else 0.32)
def bass(f,dur):
    n=int(SR*dur); x=saw(f,n)+0.6*np.sin(2*np.pi*f/2*t_(n))
    x=lp(np.tanh(2.5*x),420,2); return x*env(n,0.004,0.18,0.55,rel=0.02)*0.5
def brass(fs,dur):
    n=int(SR*dur); x=sum(saw(f,n,d) for f in fs for d in (-0.006,0,0.006))/ (3*len(fs))
    cut=lp(x,2600,2); e=env(n,0.012,0.16,0.35,rel=0.06); return cut*e*0.55
def lead(f,dur):
    n=int(SR*dur); t=t_(n); vib=1+0.004*np.sin(2*np.pi*5.5*t)*np.clip(t/0.15,0,1)
    ph=np.cumsum(f*vib)/SR; x=2*(ph-np.floor(ph+0.5)); x+=0.5*np.sign(np.sin(2*np.pi*ph))
    x=lp(np.tanh(1.5*x),3200); return x*env(n,0.01,0.3,0.6,rel=0.05)*0.22
def pad(fs,dur):
    n=int(SR*dur); x=sum(saw(f,n,d) for f in fs for d in (-0.008,0.008))/(2*len(fs))
    x=lp(x,900); t=t_(n); e=np.clip(t/0.4,0,1)*np.clip((dur-t)/0.3,0,1); return x*e*0.35
def riser(dur):
    n=int(SR*dur); t=t_(n); p=t/dur
    x=rng.standard_normal(n); x=hp(x,400)*(p**2)
    tone=np.sin(2*np.pi*np.cumsum(200+1200*p**2)/SR)*p**2*0.3
    return (x*0.35+tone)*0.6
def pop():
    n=int(SR*0.18); t=t_(n); f=500+900*np.exp(-t/0.02)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t/0.05)*0.35

# ---------- arrangement ----------
prog=[('E',nf('E2')),('E',nf('E2')),('C',nf('C2')),('D',nf('D2'))]
chords={'E':[nf('E4'),nf('G4'),nf('B4')],'C':[nf('C4'),nf('E4'),nf('G4')],'D':[nf('D4'),nf('F#4'),nf('A4')]}
hook=[[('E4',1),('G4',1),('B4',1),('A4',.5),('G4',.5)],[('E4',3),(None,1)],
      [('C5',1),('B4',1),('G4',1),('E4',1)],[('D4',1),('F#4',1),('A4',1),('B4',1)]]
gtr=(np.zeros(N),np.zeros(N)); syn=(np.zeros(N),np.zeros(N)); kicks=[]
def bar_t(b): return O+b*BAR
def drums(b,full=True,hats16=False,fill=False,half=False):
    s=bar_t(b)
    for q in range(4):
        tb=s+q*BEAT
        if not half or q in (0,2):
            put(kick(),tb,1.0); kicks.append(tb)
        if q in (1,3) and not half: put(snare(),tb,0.9); put(clap(),tb,0.8,0.1)
    if full and not half: put(kick(),s+2.5*BEAT,0.8); kicks.append(s+2.5*BEAT)
    steps=16 if hats16 else 8
    for k in range(steps):
        tt=s+k*BAR/steps; put(hat(open_=(k%(steps//2)==steps//2-1 and not half)),tt,0.9 if k%2==0 else 0.6,0.35)
    if fill:
        for k in range(8): put(snare(),s+3*BEAT+k*BEAT/8,0.35+0.07*k,-0.1)
def riff(b,lead_on=False,brass_on=True,light=False):
    s=bar_t(b); name,root=prog[b%4]
    if light:
        put(pad(chords[name],BAR),s,1.6,0,syn)
        for k in range(8): put(lp(bass(root,BEAT*0.45),250),s+k*BEAT/2,0.9,0,gtr)
        for k in range(8):
            f=chords[name][k%3]*2; n=int(SR*0.22); put(np.sin(2*np.pi*f*t_(n))*np.exp(-t_(n)/0.08)*0.18,s+k*BEAT/2,1,(-0.4 if k%2 else 0.4),syn)
        return
    # chugging power chords: 8ths palm muted, accent on 1 and the "and" of 2
    for k in range(8):
        tt=s+k*BEAT/2
        if k in (0,3): put(power(root*2,BEAT*0.9),tt,1.0,-0.45,gtr); put(power(root*2*1.003,BEAT*0.9),tt,1.0,0.45,gtr)
        else: put(power(root*2,BEAT*0.45,mute=True),tt,1.0,-0.4,gtr); put(power(root*2,BEAT*0.45,mute=True),tt,1.0,0.4,gtr)
        put(bass(root,BEAT*0.48),tt,1.0,0,gtr)
    if brass_on: put(brass(chords[name],BEAT*0.7),s,1.0,0,syn); put(brass(chords[name],BEAT*0.35),s+1.5*BEAT,0.8,0,syn)
    if lead_on:
        tt=s
        for nt,ln in hook[b%4]:
            if nt: put(lead(nf(nt),ln*BEAT*0.95),tt,1.0,0.15,syn)
            tt+=ln*BEAT

# intro 0–2.6
put(boom(2.2),0.12,0.9); put(crash(2.0),0.12,0.5)
put(brass(chords['E'],0.9),0.12,0.7)
put(riser(2.0),0.6,0.9)
for k in range(16):
    tt=1.6+k*(1.0/16); put(snare(),tt,0.25+0.04*k,(-0.2 if k%2 else 0.2))
# main
for b in range(0,8): drums(b,hats16=False,fill=(b==7)); riff(b,lead_on=False)
for b in range(8,16): drums(b,hats16=True,fill=(b==15)); riff(b,lead_on=True)
put(crash(),bar_t(0),0.9); put(crash(),bar_t(8),0.9); put(boom(1.2),bar_t(0),0.6)
# transition into install part
drums(16,hats16=True); riff(16,lead_on=True)
for b in range(17,20): drums(b,half=True,full=False); riff(b,light=True)
put(riser(BAR*1.5),bar_t(19)-BAR*0.5,1.0)
for k in range(8): put(snare(),bar_t(19)+2*BEAT+k*BEAT/4,0.3+0.06*k)
# icon pop on home screen + drop
put(pop(),42.05,1.0); put(pop(),43.2,0.6)
for b in range(20,22): drums(b,hats16=True,fill=(b==21)); riff(b,lead_on=True)
put(crash(),bar_t(20),0.9); put(boom(1.2),bar_t(20),0.6)
# outro: big hits synced to end card
for tt,g in ((46.6,1.0),(47.0,0.7),(47.4,0.8)):
    put(boom(1.6),tt,g); put(power(nf('E3'),0.35),tt,1.0,-0.4,gtr); put(power(nf('E3'),0.35),tt,1.0,0.4,gtr); put(snare(),tt,0.7); kicks.append(tt)
put(crash(3.0),46.6,0.8)
fin=bar_t(23)-BAR*0.5  # 47.6? keep musical: hit on 48.1
fin=48.1
put(boom(2.0),fin,1.0); put(crash(2.0),fin,1.0); kicks.append(fin)
put(power(nf('E2'),1.9),fin,1.0,-0.5,gtr); put(power(nf('E2')*1.003,1.9),fin,1.0,0.5,gtr)
put(brass(chords['E']+[nf('E5')],1.9),fin,1.0,0,syn)

# ---------- mix ----------
t=t_(N); duck=np.ones(N)
for k in kicks:
    i=int(k*SR); n=min(int(0.3*SR),N-i)
    if n>0: duck[i:i+n]=np.minimum(duck[i:i+n],1-0.55*np.exp(-t_(n)/0.09))
for bus,g in ((gtr,0.9),(syn,0.8)):
    L[:]+= bus[0]*duck*g; R[:]+= bus[1]*duck*g
# reverb send
ir_n=int(SR*1.4); ir=rng.standard_normal(ir_n)*np.exp(-t_(ir_n)/0.35); ir=lp(ir,5000); ir/=np.sqrt(np.sum(ir**2))
rl=fftconvolve(hp(syn[0],300),ir)[:N]; rr=fftconvolve(hp(syn[1],300),ir[::-1].copy()*0.9+ir*0.1)[:N]
L+=rl*0.25; R+=rr*0.25
mix=np.stack([L,R],1)
mix=hp(mix.T,30).T
# fade out last 0.8 s
mix*=np.clip((DUR-t)/0.8,0,1)[:,None]
pk=np.max(np.abs(mix)); mix=mix/pk*1.6; mix=np.tanh(mix)*0.92  # glue + limiter
print('peak',np.max(np.abs(mix)),'rms',np.sqrt(np.mean(mix**2)))
wavfile.write(sys.argv[1],SR,(mix*32767).astype(np.int16))
