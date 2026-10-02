(function(){
  const reduce = false; // animações sempre ativas, mesmo com "reduzir movimento" ligado no sistema
  const loader = document.getElementById('loader');

  // copy address
  document.getElementById('copyAddr').addEventListener('click', e => {
    const t = 'Rua Icatu, 950 - São José dos Campos, SP, 12237-010';
    const btn = e.currentTarget;
    const done = () => { btn.textContent = 'Endereço copiado'; setTimeout(()=>btn.textContent='Copiar endereço',2000); };
    try{ navigator.clipboard.writeText(t).then(done, () => selectAddr()); }catch(_){ selectAddr(); }
    function selectAddr(){ const r=document.createRange(); r.selectNodeContents(document.getElementById('addr')); const s=getSelection(); s.removeAllRanges(); s.addRange(r); }
  });

  // plan toggle (works without GSAP too)
  const toggle = document.getElementById('toggle'), pill = document.getElementById('pill');
  const btns = toggle.querySelectorAll('button');
  function placePill(b, animate){
    const x = b.offsetLeft - 5, w = b.offsetWidth;
    if (window.gsap && animate) gsap.to(pill,{x, width:w, duration:.6, ease:'expo.out'});
    else { pill.style.transform = `translateX(${x}px)`; pill.style.width = w+'px'; }
  }
  function setMode(mode, animate){
    btns.forEach(b => b.setAttribute('aria-pressed', b.dataset.mode===mode));
    placePill([...btns].find(b=>b.dataset.mode===mode), animate);
    document.querySelectorAll('.pnum').forEach(el => {
      const to = +el.dataset[mode];
      if (window.gsap && animate && !reduce){
        const o = {v:+el.textContent};
        gsap.to(o,{v:to,duration:.9,ease:'power3.out',onUpdate:()=>el.textContent=Math.round(o.v)});
        gsap.fromTo(el,{yPercent:12,opacity:.4},{yPercent:0,opacity:1,duration:.6,ease:'power3.out'});
      } else el.textContent = to;
    });
    const label = mode==='ambos' ? 'Cabelo + barba' : 'Só cabelo';
    document.querySelector('[data-label-standart]').textContent = label;
    const line = mode==='ambos' ? 'Atendimento de cabelo e barba de 1 hora' : 'Atendimento de cabelo de 30 minutos';
    document.querySelector('[data-swap-standart]').textContent = line;
    document.querySelector('[data-swap-premium]').textContent = line;
  }
  btns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode, true)));
  requestAnimationFrame(()=>setMode('cabelo', false));
  window.addEventListener('resize', ()=>placePill(toggle.querySelector('[aria-pressed="true"]'), false));

  if (!window.gsap || !window.ScrollTrigger){ loader.remove(); document.documentElement.classList.add('no-js-anim'); return; }
  gsap.registerPlugin(ScrollTrigger);

  // nav solid on scroll
  const nav = document.getElementById('nav');
  ScrollTrigger.create({start:80, onUpdate:self=>nav.classList.toggle('is-solid', self.scroll()>80)});

  // barber pole spin (always, gentle) + scroll boost
  const stripes = document.getElementById('poleStripes');
  let poleSpeed = 1, poleY = 0;
  gsap.ticker.add((t, dt) => { if(reduce) return; poleY = (poleY + 0.06*dt*poleSpeed) % 88; stripes.style.transform = `translateY(${poleY}px)`; });

  if (reduce){ loader.remove(); return; }

  // smooth scroll
  let lenis = null;
  if (window.Lenis){
    lenis = new Lenis({duration:1.15, smoothWheel:true});
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t*1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href'); const el = document.querySelector(id);
      if (el){ e.preventDefault(); lenis.scrollTo(el, {offset:-70}); }
    }));
  }

  // split helpers
  function splitWords(el){
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType===3){
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
            else { const s=document.createElement('span'); s.className='w'; s.textContent=part; frag.appendChild(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType===1) walk(n);
      });
    };
    walk(el); return el.querySelectorAll('.w');
  }
  function splitLinesMask(el){
    // wrap each word in a mask so it can rise
    const words = splitWords(el);
    words.forEach(w => { const m=document.createElement('span'); m.style.cssText='display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.08em;margin-bottom:-.08em'; w.style.display='inline-block'; w.replaceWith(m); m.appendChild(w); });
    return words;
  }

  // ---------- intro ----------
  const heroRows = gsap.utils.toArray('.hero h1 .row > span');
  gsap.set(heroRows,{yPercent:110});
  gsap.set('.hero__meta, .hero .reveal',{opacity:0,y:24});
  gsap.set('.pole',{scaleY:0, transformOrigin:'50% 100%'});
  gsap.set('.nav',{yPercent:-100,opacity:0});

  const counter = {v:0}, numEl = document.getElementById('loadNum');
  const intro = gsap.timeline();
  intro.from('.loader__word span',{yPercent:110,duration:.8,ease:'expo.out'})
       .to('.loader__bar i',{scaleX:1,duration:1.1,ease:'power2.inOut'},'<.1')
       .to(counter,{v:100,duration:1.1,ease:'power2.inOut',onUpdate:()=>numEl.textContent=Math.round(counter.v)},'<')
       .to('.loader__in',{yPercent:-30,opacity:0,duration:.6,ease:'power3.in'})
       .to(loader,{clipPath:'inset(0 0 100% 0)',duration:.9,ease:'expo.inOut'},'-=.2')
       .set(loader,{display:'none'})
       .to(heroRows,{yPercent:0,duration:1.3,stagger:.12,ease:'expo.out'},'-=.55')
       .to('.pole',{scaleY:1,duration:1.4,ease:'expo.out'},'<.1')
       .to('.nav',{yPercent:0,opacity:1,duration:1,ease:'expo.out'},'<.2')
       .to('.hero__meta, .hero .reveal',{opacity:1,y:0,duration:1,stagger:.08,ease:'power3.out'},'<.1');

  // hero scroll-out parallax
  gsap.to('.hero h1',{yPercent:-18, ease:'none', scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
  gsap.to('.pole',{y:120, rotate:6, ease:'none', scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
  gsap.to('.hero__glow',{yPercent:40, ease:'none', scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});

  // mouse parallax on hero title
  const h1 = document.querySelector('.hero h1');
  const qx = gsap.quickTo(h1,'x',{duration:1.2,ease:'power3'}), qr = gsap.quickTo('.pole','rotateY',{duration:1.2,ease:'power3'});
  window.addEventListener('pointermove', e => { const nx = e.clientX/innerWidth - .5; qx(nx*-24); qr(nx*30); });

  // ---------- marquee with scroll velocity ----------
  const track = document.getElementById('marquee');
  const mq = gsap.to(track,{xPercent:-50, duration:28, ease:'none', repeat:-1});
  let skewTo = gsap.quickTo(track,'skewX',{duration:.5,ease:'power3'});
  ScrollTrigger.create({onUpdate:self=>{
    const v = self.getVelocity();
    const dir = self.direction;
    gsap.to(mq,{timeScale: dir*(1+Math.min(Math.abs(v)/300,5)), duration:.3, overwrite:true});
    gsap.to(mq,{timeScale: dir, duration:1.2, delay:.3});
    skewTo(gsap.utils.clamp(-8,8,v/-200));
    poleSpeed = 1 + Math.min(Math.abs(v)/150, 10);
    gsap.delayedCall(.3,()=>{skewTo(0);});
  }});
  gsap.ticker.add(()=>{ poleSpeed += (1-poleSpeed)*.05; });

  // ---------- manifesto word scrub ----------
  const mWords = splitWords(document.getElementById('manifesto'));
  gsap.to(mWords,{opacity:1, stagger:.05, ease:'none', scrollTrigger:{trigger:'#manifesto',start:'top 80%',end:'bottom 45%',scrub:true}});

  // counters
  gsap.utils.toArray('.count').forEach(el => {
    const to = +el.dataset.to, dec = +(el.dataset.dec||0), o={v:0};
    el.textContent = dec ? '0,0' : '0';
    gsap.to(o,{v:to,duration:1.8,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 90%',once:true},
      onUpdate:()=>el.textContent = dec ? o.v.toFixed(1).replace('.',',') : Math.round(o.v)});
  });

  // split headings rise
  gsap.utils.toArray('.split').forEach(h => {
    const w = splitLinesMask(h);
    gsap.from(w,{yPercent:110, duration:1.2, stagger:.06, ease:'expo.out', scrollTrigger:{trigger:h,start:'top 85%'}});
  });

  // generic reveals
  gsap.utils.toArray('.reveal').forEach(el => {
    if (el.closest('.hero')) return;
    gsap.from(el,{y:60, opacity:0, duration:1.1, ease:'power3.out', scrollTrigger:{trigger:el,start:'top 90%'}});
  });
  ScrollTrigger.batch('.reveal-stagger',{start:'top 90%', onEnter:b=>gsap.from(b,{y:50,opacity:0,duration:1,stagger:.1,ease:'power3.out'})});

  // plans: rise in + 3D tilt
  gsap.from('.plan',{y:120, rotateX:-12, opacity:0, duration:1.3, stagger:.15, ease:'expo.out', scrollTrigger:{trigger:'.plans__grid',start:'top 85%'}});
  gsap.from('.plans',{borderRadius:0, ease:'none', scrollTrigger:{trigger:'.plans',start:'top bottom',end:'top 40%',scrub:true}});
  if (matchMedia('(pointer:fine)').matches){
    document.querySelectorAll('.tilt').forEach(card => {
      const rx = gsap.quickTo(card,'rotateX',{duration:.6,ease:'power3'}), ry = gsap.quickTo(card,'rotateY',{duration:.6,ease:'power3'});
      gsap.set(card,{transformPerspective:1000});
      card.addEventListener('pointermove', e => { const r=card.getBoundingClientRect(); ry(((e.clientX-r.left)/r.width-.5)*8); rx(((e.clientY-r.top)/r.height-.5)*-8); });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }

  // ---------- horizontal services ----------
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const trackEl = document.getElementById('menuTrack');
    const dist = () => trackEl.scrollWidth - window.innerWidth;
    const tween = gsap.to(trackEl,{x:()=>-dist(), ease:'none', scrollTrigger:{
      trigger:'#menuPin', start:'top top', end:()=>'+='+dist(), pin:true, scrub:1, invalidateOnRefresh:true, anticipatePin:1,
      onUpdate:self=>gsap.set('#menuProg',{scaleX:self.progress})
    }});
    gsap.utils.toArray('.panel').forEach(p => {
      gsap.from(p.querySelectorAll('h3, .rows li, .therapy__item, .bigprice, p, .btn'),{y:40, opacity:0, stagger:.05, duration:.8, ease:'power3.out',
        scrollTrigger:{trigger:p, containerAnimation:tween, start:'left 85%'}});
    });
    gsap.from('.bigprice b',{innerText:0, snap:{innerText:1}, duration:1.6, ease:'power3.out',
      scrollTrigger:{trigger:'.bigprice', containerAnimation:tween, start:'left 80%'}});
  });
  mm.add('(max-width: 899px)', () => {
    gsap.utils.toArray('.panel').forEach(p => gsap.from(p,{y:70,opacity:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:p,start:'top 88%'}}));
  });

  // team letters parallax
  gsap.utils.toArray('.parallax').forEach(el => gsap.fromTo(el,{yPercent:25},{yPercent:-25,ease:'none',scrollTrigger:{trigger:el.parentElement,start:'top bottom',end:'bottom top',scrub:true}}));

  // final big type
  const fRows = gsap.utils.toArray('.final__big .row > span');
  gsap.from(fRows,{yPercent:110, duration:1.4, stagger:.12, ease:'expo.out', scrollTrigger:{trigger:'.final__big',start:'top 80%'}});
  gsap.fromTo('.final__big',{letterSpacing:'-.02em'},{letterSpacing:'-.06em',ease:'none',scrollTrigger:{trigger:'.final',start:'top bottom',end:'bottom bottom',scrub:true}});

  // ---------- cursor + magnetic ----------
  if (matchMedia('(pointer:fine)').matches){
    const cur = document.getElementById('cursor'), lab = document.getElementById('cursorLabel');
    const cx = gsap.quickTo([cur,lab],'x',{duration:.35,ease:'power3'}), cy = gsap.quickTo([cur,lab],'y',{duration:.35,ease:'power3'});
    window.addEventListener('pointermove', e => { cx(e.clientX); cy(e.clientY); });
    document.querySelectorAll('[data-cursor]').forEach(el => {
      el.addEventListener('pointerenter', () => { lab.textContent = el.dataset.cursor; gsap.to(cur,{scale:8,duration:.5,ease:'expo.out'}); gsap.to(lab,{scale:1,duration:.5,ease:'expo.out'}); });
      el.addEventListener('pointerleave', () => { gsap.to(cur,{scale:1,duration:.5,ease:'expo.out'}); gsap.to(lab,{scale:0,duration:.3}); });
    });
    document.querySelectorAll('a:not([data-cursor]), button').forEach(el => {
      el.addEventListener('pointerenter', () => gsap.to(cur,{scale:3,duration:.4}));
      el.addEventListener('pointerleave', () => gsap.to(cur,{scale:1,duration:.4}));
    });
    document.querySelectorAll('.magnetic').forEach(el => {
      const mx = gsap.quickTo(el,'x',{duration:.6,ease:'elastic.out(1,.4)'}), my = gsap.quickTo(el,'y',{duration:.6,ease:'elastic.out(1,.4)'});
      el.addEventListener('pointermove', e => { const r=el.getBoundingClientRect(); mx((e.clientX-r.left-r.width/2)*.3); my((e.clientY-r.top-r.height/2)*.4); });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
