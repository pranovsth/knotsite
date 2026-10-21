import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, ArrowRight, ArrowDown, Check, ChevronDown, CreditCard, Menu, X, MousePointer2, Plus, Sparkles, Monitor, Layers, MoveUpRight, ExternalLink } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SiteEditor from './components/SiteEditor'

const KnotScene = lazy(() => import('./components/KnotScene'))
gsap.registerPlugin(ScrollTrigger)

const templates = [
  { id: 'minimal', name: 'The Minimalist', category: 'Entrepreneurs', file: 'phone-white@2x.png', color: '#e7e4df', person: 'Tom Hanks', title: 'Angel investor in Mayfair, LDN', sub: 'A little less noise. A lot more you.' },
  { id: 'designer', name: 'The Creative', category: 'Designers', file: 'phone-pink-vector@2x.png', color: '#f1dbea', person: 'Aiden Pierce', title: 'Product Designer & UI UX Expert', sub: 'A canvas for your next big idea.' },
  { id: 'product', name: 'The Professional', category: 'Professionals', file: 'phone-blue@2x.png', color: '#083d5d', person: 'Jenny Law', title: 'Product Manager with 15 years of experience.', sub: 'Make your experience speak for itself.' },
  { id: 'botanist', name: 'The Natural', category: 'Creators', file: 'phone-green@2x.png', color: '#2c4825', person: 'Anna Taylor', title: 'Professional botanist sharing plant tips.', sub: 'For a world that grows with you.' },
  { id: 'developer', name: 'The Bold', category: 'Developers', file: 'phone-black@2x.png', color: '#191d0b', person: 'Evan Vance', title: 'Viral marketer, helping founders grow their apps.', sub: 'Your work deserves the spotlight.' },
]

const profiles = [
  ['Ethan Vance','ethan','Creative developer','Building small things with big ideas.',4],
  ['Marcus Drake','marcus','Independent designer','A little space for a fresh perspective.',1],
  ['Franklin Green','franklin','Photographer & maker','Collecting moments. Creating connections.',3],
  ['Ana Taylor','ana','Botanist & storyteller','Good things need a little room to grow.',3],
  ['Jeff Hardy','jeff','Product thinker','Making the complicated feel simple.',2],
  ['Deepak','deepak','Designer & developer','Thoughtful work, all in one place.',2],
  ['Charlotte','charlotte','Visual storyteller','A canvas for the ideas in between.',1],
  ['Alex Hormozi','alex','Entrepreneur','Every great idea starts somewhere.',0],
  ['Ethan Vance','ethan','Creative developer','A home for the things I’m proud of.',4],
  ['Marcus Drake','marcus','Independent designer','Turning a new page, one project at a time.',1],
  ['Franklin Green','franklin','Photographer & maker','The work. The story. The person behind it.',3],
  ['Ana Taylor','ana','Botanist & storyteller','Something personal. Something growing.',3],
]

function Logo({small = false}) {
  return <span className={`logo ${small ? 'logo-small' : ''}`}><img src="/assets/knot-mark.svg" width="30" height="26" alt="" /><span>knot <em>site</em></span></span>
}

function Badge({dark=false, children}) {
  return <span className={`section-badge ${dark ? 'badge-dark' : ''}`}><img src="/assets/knot-mark.svg" width="16" height="14" alt="" />{children || <>knot <em>site</em></>}</span>
}

function SectionAsset({name, label, className, onClick}) {
  return <button className={`float-card original-section ${className}`} onClick={onClick} aria-label={label}><img src={`/assets/section-${name}@2x.png`} alt="" loading="lazy"/><span className="section-asset-action"><Plus size={13}/></span></button>
}

function ClaimForm({onClaim, compact = false, dark = false}) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const id = useRef(`claim-${Math.random().toString(36).slice(2)}`).current
  function submit(e) {
    e.preventDefault()
    const slug = name.trim().toLowerCase()
    if (!/^[a-z0-9](?:[a-z0-9-]{1,22}[a-z0-9])?$/.test(slug) || slug.length < 3) {
      setError('Use 3–24 letters or numbers. Hyphens can go in the middle.')
      return
    }
    setError('')
    onClaim(slug)
  }
  return <div className={`claim-wrap ${compact ? 'claim-compact' : ''} ${dark ? 'claim-dark' : ''}`}>
    <form className="claim-form" onSubmit={submit} noValidate>
      <div className={`domain-input ${error ? 'has-error' : ''}`}>
        <label className="sr-only" htmlFor={id}>Your site username</label>
        <input id={id} value={name} onChange={e=>{setName(e.target.value.toLowerCase());setError('')}} placeholder="yourname" autoCapitalize="none" autoCorrect="off" spellCheck="false" maxLength={24} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />
        <span>.knot.site</span>
      </div>
      <motion.button className="button button-blue" type="submit" whileHover={{y:-2}} whileTap={{scale:.97}}>Claim your knot.site <ArrowUpRight size={16}/></motion.button>
    </form>
    {error ? <p className="form-error" id={`${id}-error`} role="alert">{error}</p> : <p className="form-note"><CreditCard size={13}/><span>No credit card required</span><span className="note-divider">·</span><span>Yours to make</span></p>}
  </div>
}

function PhoneFallback({template}) {
  return <div className={`phone-fallback fallback-${template.id}`}><span className="phone-island"/><div className="fallback-content"><div className="sample-person"><span className="sample-avatar">{template.person[0]}</span>{template.person}</div><h3>{template.title}</h3><p>{template.sub}</p><span className="sample-cta">Let's connect <ArrowUpRight size={9}/></span><div className="sample-projects"><span>Selected work</span><div/><div/><div/></div></div></div>
}

function Phone({template, className='', onClick, eager=false}) {
  const ref = useRef(null)
  const [failed, setFailed] = useState(false)
  const reduced = useReducedMotion()
  function move(e) {
    if(reduced || e.pointerType === 'touch') return
    const box = ref.current.getBoundingClientRect()
    gsap.to(ref.current, {rotateY:((e.clientX-box.left)/box.width-.5)*15, rotateX:-((e.clientY-box.top)/box.height-.5)*10, duration:.55, ease:'power3.out'})
  }
  function leave(){gsap.to(ref.current,{rotateX:0,rotateY:0,duration:.8,ease:'elastic.out(1,.6)'})}
  return <button ref={ref} className={`phone ${className}`} onClick={onClick} onPointerMove={move} onPointerLeave={leave} aria-label={`Preview ${template.name} template`} style={{'--template-color':template.color}}>
    {failed ? <PhoneFallback template={template}/> : <img src={`/assets/${template.file}`} onError={()=>setFailed(true)} alt={`${template.name} personal site template on a phone`} loading={eager ? 'eager':'lazy'} draggable="false" width="190" height="392"/>}
    <span className="phone-hover">Explore template <ArrowUpRight size={12}/></span>
  </button>
}

function Modal({children, onClose, title, wide=false}) {
  const panel = useRef(null)
  useEffect(()=>{
    const previous = document.activeElement
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow='hidden'
    const focusables = ()=>Array.from(panel.current?.querySelectorAll('button:not([disabled]), a[href], input, textarea, select, [tabindex="0"]') || []).filter(el=>el.getClientRects().length && getComputedStyle(el).visibility!=='hidden')
    focusables()?.[0]?.focus()
    function key(e){
      if(e.key==='Escape') onClose()
      if(e.key==='Tab'){
        const all=focusables();if(!all?.length)return
        const first=all[0],last=all[all.length-1]
        if(e.shiftKey && (document.activeElement===first || !panel.current.contains(document.activeElement))){e.preventDefault();last.focus()}
        else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus()}
      }
    }
    window.addEventListener('keydown',key)
    return ()=>{document.body.style.overflow=oldOverflow;window.removeEventListener('keydown',key);previous?.focus()}
  },[onClose])
  return <motion.div className="modal-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
    <motion.section ref={panel} className={`modal-panel ${wide?'modal-wide':''}`} role="dialog" aria-modal="true" aria-label={title} initial={{opacity:0,y:24,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:15,scale:.98}} transition={{duration:.25}}>
      <button className="modal-close icon-button" onClick={onClose} aria-label="Close dialog"><X size={20}/></button>{children}
    </motion.section>
  </motion.div>
}

const faqs = [
  ['What can I make with Knot Site?', 'A personal home for your work, projects, experience, and links. Start with a template, make it yours, and export a portfolio page you can host wherever you like.'],
  ['Do I need to know how to code?', 'No. The live editor lets you change your name, headline, colors, and sections. Your preview updates as you go, and Export HTML gives you a ready-to-use page.'],
  ['Where is my site saved?', 'This experience saves drafts in this browser on your device. Your chosen knot.site address is a preview; it is not registered or published. Export your HTML file to keep a portable copy.'],
  ['Will my site work on mobile?', 'Yes. Both this experience and exported portfolio pages adapt to smaller screens. Use the mobile preview in the editor to check your layout.'],
]

function App(){
  const root=useRef(null)
  const reduced=useReducedMotion()
  const [modal,setModal]=useState(null)
  const [selected,setSelected]=useState(templates[2])
  const [mobileMenu,setMobileMenu]=useState(false)
  const [activeSection,setActiveSection]=useState('Projects')
  const [openFaq,setOpenFaq]=useState(null)
  const [draftName,setDraftName]=useState('')
  const [article,setArticle]=useState(null)
  const close=useCallback(()=>{setModal(null);setArticle(null)},[])
  function claim(username){setModal({type:'editor',username,template:selected.id})}

  useLayoutEffect(()=>{
    const ctx=gsap.context(()=>{
      if(reduced)return
      const tl=gsap.timeline({defaults:{ease:'power3.out'}})
      tl.from('.hero-knot',{opacity:0,y:15,duration:.9},.05)
        .from('.hero-title .word',{y:60,opacity:0,rotateX:12,duration:1,stagger:.065},.15)
        .from('.hero-intro > .hero-subtitle, .hero-intro > .claim-wrap',{opacity:0,y:18,duration:.8,stagger:.12},.5)
        .from('.hero-phone-wrap',{y:80,opacity:0,rotate:0,duration:1.25,stagger:.09},.55)
      gsap.utils.toArray('.reveal').forEach(el=>gsap.from(el,{y:35,opacity:0,duration:.9,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 92%',once:true}}))
      gsap.utils.toArray('.float-card').forEach((el,i)=>gsap.to(el,{y:i%2? -18:16,ease:'none',scrollTrigger:{trigger:'.sections-orbit',start:'top bottom',end:'bottom top',scrub:1.5}}))
      gsap.to('.hero-halo',{y:100,scale:1.16,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1.5}})
      gsap.to('.scroll-progress',{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:.15}})
    },root)
    return ()=>ctx.revert()
  },[reduced])

  return <MotionConfig reducedMotion="user"><div ref={root}>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="scroll-progress" aria-hidden="true"/>
    <header className="site-header">
      <div className="nav-shell"><a href="#" aria-label="Knot Site home"><Logo/></a>
      <nav className="desktop-nav" aria-label="Main navigation">
        <button onClick={()=>setModal({type:'journal'})}>Blog <span className="new-tag">New</span></button>
        <a href="#sections">Sections</a>
        <button onClick={()=>setModal({type:'jobs'})}>Find Jobs</button>
        <button className="nav-create" onClick={()=>claim('yourname')}>Create Account <ArrowUpRight size={13}/></button>
        <button onClick={()=>setModal({type:'login'})}>Log In</button>
      </nav>
      <button className="mobile-menu-button icon-button" onClick={()=>setMobileMenu(!mobileMenu)} aria-expanded={mobileMenu} aria-label={mobileMenu?'Close navigation':'Open navigation'}>{mobileMenu?<X/>:<Menu/>}</button>
      </div>
      <AnimatePresence>{mobileMenu&&<motion.nav className="mobile-nav" aria-label="Mobile navigation" initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}>
        <a href="#sections" onClick={()=>setMobileMenu(false)}>Explore sections <ArrowUpRight size={16}/></a>
        <button onClick={()=>{setMobileMenu(false);setModal({type:'journal'})}}>The journal <ArrowUpRight size={16}/></button>
        <button onClick={()=>{setMobileMenu(false);claim('yourname')}}>Create your site <ArrowUpRight size={16}/></button>
        <button onClick={()=>{setMobileMenu(false);setModal({type:'login'})}}>Continue a draft <ArrowUpRight size={16}/></button>
      </motion.nav>}</AnimatePresence>
    </header>

    <main id="main">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-halo" aria-hidden="true"/>
        <div className="hero-intro">
          <div className="hero-knot"><Suspense fallback={<img src="/assets/knot-mark.svg" alt="" width="42" height="36"/>}><KnotScene reducedMotion={!!reduced}/></Suspense></div>
          <h1 id="hero-title" className="hero-title">{'Tie your digital world together'.split(' ').map((word,i)=><span className="word" key={i}>{word}{i<4?'\u00a0':''}</span>)}</h1>
          <p className="hero-subtitle">Claim, customize, and publish <span className="subtle-dash">—</span> for free.</p>
          <ClaimForm onClaim={claim}/>
        </div>
        <div className="hero-showcase" aria-label="Explore five personal site templates">
          {templates.map((template,i)=><div className={`hero-phone-wrap hero-phone-${i}`} key={template.id} style={{'--index':i}}><Phone template={template} eager onClick={()=>{setSelected(template);setModal({type:'template'})}}/></div>)}
          <span className="showcase-grid" aria-hidden="true"/>
        </div>
        <div className="hero-bottom"><span className="live-dot"/> A little space for everything you are.<a href="#sections" aria-label="Scroll to prebuilt sections"><span>Scroll to explore</span><ArrowDown size={14}/></a></div>
      </section>

      <section className="prebuilt section-padding" id="sections" aria-labelledby="sections-title">
        <div className="section-heading reveal"><Badge/><h2 id="sections-title">Use Pre-Built Sections</h2><p>Your story, in all the right pieces.<br/>Just pick, customize, and publish — no design skills needed.</p></div>
        <div className="section-tabs reveal" role="tablist" aria-label="Section type" onKeyDown={e=>{const names=['Projects','Experience','Gallery','Contact'];if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const index=names.indexOf(activeSection);const next=e.key==='Home'?0:e.key==='End'?3:(index+(e.key==='ArrowRight'?1:3))%4;setActiveSection(names[next]);document.getElementById(`tab-${names[next]}`)?.focus()}}>{['Projects','Experience','Gallery','Contact'].map((section,i)=><button key={section} role="tab" tabIndex={activeSection===section?0:-1} id={`tab-${section}`} aria-controls="section-preview" aria-selected={activeSection===section} onClick={()=>setActiveSection(section)} className={activeSection===section?'active':''}>{[<Layers size={14}/>,<Monitor size={14}/>,<Sparkles size={14}/>,<MousePointer2 size={14}/>][i]}{section}</button>)}</div>
        <div className="sections-orbit" id="section-preview" role="tabpanel" aria-labelledby={`tab-${activeSection}`}>
          <div className="orbit-ring ring-one"/><div className="orbit-ring ring-two"/>
          <div className="orbit-phone reveal"><Phone template={{...templates[1],file:'section-phone@2x.png'}} onClick={()=>{setSelected(templates[1]);setModal({type:'template'})}}/></div>
          <SectionAsset name="stats" label="Explore experience sections" className={`stats-card ${activeSection==='Experience'?'section-highlight':''}`} onClick={()=>setActiveSection('Experience')}/>
          <SectionAsset name="projects" label="Explore project sections" className={`projects-card ${activeSection==='Projects'?'section-highlight':''}`} onClick={()=>setActiveSection('Projects')}/>
          <SectionAsset name="tools" label="Explore tools and experience sections" className="stack-card" onClick={()=>setActiveSection('Experience')}/>
          <SectionAsset name="faq" label="Add a frequently asked questions section" className="section-faq" onClick={()=>claim('yourname')}/>
          <SectionAsset name="gallery" label="Explore gallery sections" className={`gallery-card ${activeSection==='Gallery'?'section-highlight':''}`} onClick={()=>setActiveSection('Gallery')}/>
          <SectionAsset name="contact" label="Explore contact sections" className={`contact-card ${activeSection==='Contact'?'section-highlight':''}`} onClick={()=>setActiveSection('Contact')}/>
          <AnimatePresence mode="wait"><motion.p className="orbit-caption" key={activeSection} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>{{Projects:'Show what you make.',Experience:'Let your journey shine.',Gallery:'A picture of your world.',Contact:'Start a conversation.'}[activeSection]}</motion.p></AnimatePresence>
        </div>
      </section>

      <section className="dark-section" id="templates" aria-labelledby="templates-title">
        <div className="dark-glow" aria-hidden="true"/>
        <div className="section-heading reveal"><Badge dark/><h2 id="templates-title">The <em>easiest</em> way to build a<br className="desktop-break"/> stunning personal site for free.</h2><p>No complicated tools. No hidden fees.<br/>Just a thoughtful little corner of the internet, made yours.</p><button className="button button-white" onClick={()=>claim('yourname')}>Find your starting point <ArrowUpRight size={15}/></button></div>
        <div className="community-wall reveal" aria-label="Sample personal profiles — choose one to explore a template">{[0,1,2].map(column=><div className={`community-column community-column-${column}`} key={column}>{profiles.slice(column*4,column*4+4).map(([name,photo,role,note,template],i)=><button className="community-card" key={`${name}-${i}`} onClick={()=>{setSelected(templates[template]);setModal({type:'template'})}}><span className="community-person"><img src={`/assets/avatar-${photo}.jpg`} width="31" height="31" alt="" loading="lazy"/><span><strong>{name} <ArrowUpRight size={10}/></strong><small>{role}</small></span></span><span className="community-note">{note}</span></button>)}</div>)}</div>
        <p className="dark-footnote"><span className="live-dot"/> Sample profiles. Different stories. One place to connect them.</p>
      </section>

      <section className="brand-section section-padding" id="playground" aria-labelledby="brand-title">
        <div className="section-heading reveal"><Badge/><h2 id="brand-title">Launch <em>your</em> personal brand today</h2><p>Pick a template, edit a few sections, and share.<br/>Less setting up. More showing up.</p></div>
        <div className="feature-grid reveal">{[
          ['themes','Stunning Themes','Beautifully designed themes that make your content stand out effortlessly.'],
          ['share','Share Instantly','Keep a portable copy of your site, ready to host and share with the world.'],
          ['edit','Easily Edit','Make quick changes with an intuitive editor and see them come to life.'],
          ['analytics','Powerful Analytics','A considered space for the insights that help your personal brand grow.'],
        ].map(([icon,title,desc])=><article className="feature" key={icon}><div className={`feature-icon feature-${icon}`}><img src={`/assets/feature-${icon}.svg`} width={icon==='themes'?44:20} height={icon==='themes'?44:20} alt=""/></div><h3>{title}</h3><p>{desc}</p></article>)}</div>
        <div className="editor-demo reveal"><div className="demo-label"><span className="live-dot"/> YOUR IDEAS, LIVE ON THE CANVAS <span>Try it. Make a little change. <MousePointer2 size={12}/></span></div><SiteEditor username="yourname" initialTemplate="product" inline/></div>
      </section>

      <section className="final-cta" aria-labelledby="cta-title"><div className="cta-inner"><div className="reveal"><span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span><h2 id="cta-title">Start making <em>your</em><br/> personal site now.</h2><p>One link. Your work, your world, your way.</p><ClaimForm onClaim={claim} compact/></div><div className="cta-phones reveal"><Phone className="cta-phone-back" template={templates[0]} onClick={()=>{setSelected(templates[0]);setModal({type:'template'})}}/><Phone className="cta-phone-front" template={templates[1]} onClick={()=>{setSelected(templates[1]);setModal({type:'template'})}}/><span className="cta-spark spark-one">✳</span><span className="cta-spark spark-two">✦</span></div></div></section>

      <section className="faq-section" id="faq"><div className="faq-intro"><span className="eyebrow">A FEW LOOSE ENDS</span><h2>A little clarity.</h2><p>Good things start with good questions.</p></div><div className="faq-list">{faqs.map(([question,answer],i)=><div className="faq-item" key={question}><button onClick={()=>setOpenFaq(openFaq===i?null:i)} aria-expanded={openFaq===i} aria-controls={`faq-answer-${i}`}>{question}<Plus size={17} className={openFaq===i?'rotated':''}/></button><AnimatePresence initial={false}>{openFaq===i&&<motion.div id={`faq-answer-${i}`} initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}><p>{answer}</p></motion.div>}</AnimatePresence></div>)}</div></section>
    </main>
    <footer className="site-footer"><div className="footer-top"><a href="#" aria-label="Knot Site home"><Logo/></a><span>A home for everything you are.</span><a href="#main" className="back-top">Back to top <ArrowUpRight size={14}/></a></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Knot Site</span><div><button onClick={()=>setModal({type:'journal'})}>Journal</button><a href="#sections">Sections</a><a href="#faq">FAQs</a><button onClick={()=>setModal({type:'privacy'})}>Privacy & terms</button></div><span>Made to be yours <span className="footer-flower">✳</span></span></div></footer>

    <AnimatePresence>{modal&&<Modal onClose={close} wide={modal.type==='editor'} title={{editor:'Your Knot Site editor',template:'Template preview',journal:'The Knot Journal',login:'Continue your draft',jobs:'Find your next chapter',privacy:'Privacy and terms'}[modal.type]}>
      {modal.type==='editor'&&<SiteEditor username={modal.username} initialTemplate={modal.template} onClose={close}/>}
      {modal.type==='template'&&<div className="template-modal"><div className="template-modal-preview" style={{background:selected.color+'22'}}><Phone template={selected} onClick={()=>claim('yourname')}/></div><div className="template-modal-content"><span className="eyebrow">A STARTING POINT, NOT A LIMIT</span><h2>{selected.name}</h2><p>{selected.sub} Make this template your own with your words, colors, and work.</p><ul>{['Responsive by design','Custom colors and sections','Save locally & export HTML'].map(t=><li key={t}><Check size={15}/>{t}</li>)}</ul><button className="button button-blue" onClick={()=>claim('yourname')}>Make it yours <ArrowUpRight size={16}/></button><p className="small-print">Sample portfolio content · fully customizable</p></div></div>}
      {modal.type==='login'&&<div className="simple-modal"><Badge/><h2>Pick up where<br/>you left off.</h2><p>Enter your draft’s username to continue editing on this device.</p><form onSubmit={e=>{e.preventDefault();if(draftName.trim())claim(draftName.trim().toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,24)||'yourname')}}><label htmlFor="draft-name">Draft username</label><input id="draft-name" value={draftName} onChange={e=>setDraftName(e.target.value)} placeholder="yourname" required maxLength={24}/><button className="button button-blue" type="submit">Open my workspace <ArrowRight size={16}/></button></form><p className="small-print">Drafts are stored in this browser. No account or password is required.</p></div>}
      {modal.type==='journal'&&<div className="simple-modal journal-modal"><Badge/><h2>{article?article.title:'The little things\nthat make you stand out.'}</h2>{article?<><p>{article.body}</p><button className="text-link" onClick={()=>setArticle(null)}>← Back to the journal</button></>:<><p>Small reads for building a personal presence with a little more intention.</p>{[
        {title:'A homepage that feels like you',tag:'PERSONAL BRAND · 3 MIN READ',body:'Start with one clear sentence about what you do and who you do it for. Choose three projects you want to be known for, and tell the story behind each: the challenge, your contribution, and what changed. Add one clear way to get in touch. Your site doesn’t need to say everything. It needs to open the right conversation.'},
        {title:'Show the thinking behind the work',tag:'PORTFOLIOS · 2 MIN READ',body:'The finished image is only part of the story. Share the question you started with, a decision that mattered, and what you learned. A concise project story gives people a better sense of how you work than a long list of tools. Keep your role specific and give credit to collaborators.'},
        {title:'Your first site is a starting point',tag:'GETTING STARTED · 2 MIN READ',body:'Pick a template that makes your work easy to understand. Add your name, a useful headline, one project, and a contact link. Preview it on mobile, check the links, and export a copy. You can always add more later. A clear, current page is more useful than a perfect page that never leaves your drafts.'},
      ].map(a=><button className="journal-article" key={a.title} onClick={()=>setArticle(a)}><span>{a.tag}</span><strong>{a.title}<ArrowUpRight size={18}/></strong></button>)}</>}</div>}
      {modal.type==='jobs'&&<div className="simple-modal"><Badge/><h2>Your next chapter<br/>starts with your story.</h2><p>Give your best work a home before making your next move.</p><button className="button button-blue" onClick={()=>claim('yourname')}>Build your portfolio <ArrowUpRight size={16}/></button><div className="resource-links"><span className="eyebrow">EXPLORE OPPORTUNITIES</span><a href="https://www.ycombinator.com/jobs" target="_blank" rel="noreferrer">Y Combinator jobs <ExternalLink size={15}/></a><a href="https://wellfound.com/jobs" target="_blank" rel="noreferrer">Wellfound startup jobs <ExternalLink size={15}/></a></div><p className="small-print">Independent job boards. Knot Site does not list or manage applications.</p></div>}
      {modal.type==='privacy'&&<div className="simple-modal"><Badge/><h2>Your space.<br/>Your information.</h2><p>This interactive prototype stores portfolio drafts in your browser’s local storage. It does not create an account, register a domain, collect payment, or publish your draft.</p><p>Exported files are downloaded to your device. To remove a draft, clear this site’s browser storage. External job links open independent services with their own terms and privacy policies.</p><p className="small-print">This is a design implementation and local editing experience, not a live domain registration service.</p></div>}
    </Modal>}</AnimatePresence>
  </div></MotionConfig>
}
export default App
