import {lazy,Suspense,useCallback,useEffect,useRef,useState} from 'react'
import {AnimatePresence,motion,MotionConfig,useReducedMotion} from 'framer-motion'
import {ArrowUpRight,ArrowRight,Check,X,Plus,ExternalLink} from 'lucide-react'
import gsap from 'gsap'
import KnotLanding from './components/KnotLanding'
const SiteEditor=lazy(()=>import('./components/SiteEditor'))

const templates = [
  { id: 'minimal', name: 'The Minimalist', category: 'Entrepreneurs', file: 'phone-white@2x.png', color: '#e7e4df', person: 'Tom Hanks', title: 'Angel investor in Mayfair, LDN', sub: 'A little less noise. A lot more you.' },
  { id: 'designer', name: 'The Creative', category: 'Designers', file: 'phone-pink-vector@2x.png', color: '#f1dbea', person: 'Aiden Pierce', title: 'Product Designer & UI UX Expert', sub: 'A canvas for your next big idea.' },
  { id: 'product', name: 'The Professional', category: 'Professionals', file: 'phone-blue@2x.png', color: '#083d5d', person: 'Jenny Law', title: 'Product Manager with 15 years of experience.', sub: 'Make your experience speak for itself.' },
  { id: 'botanist', name: 'The Natural', category: 'Creators', file: 'phone-green@2x.png', color: '#2c4825', person: 'Anna Taylor', title: 'Professional botanist sharing plant tips.', sub: 'For a world that grows with you.' },
  { id: 'developer', name: 'The Bold', category: 'Developers', file: 'phone-black@2x.png', color: '#191d0b', person: 'Evan Vance', title: 'Viral marketer, helping founders grow their apps.', sub: 'Your work deserves the spotlight.' },
]

function Badge({dark=false, children}) {
  return <span className={`section-badge ${dark ? 'badge-dark' : ''}`}><img src="/assets/knot-mark.svg" width="16" height="14" alt="" />{children || <>knot <em>site</em></>}</span>
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
    gsap.to(ref.current, {rotateY:((e.clientX-box.left)/box.width-.5)*3, rotateX:-((e.clientY-box.top)/box.height-.5)*2, duration:.55, ease:'power3.out'})
  }
  function leave(){gsap.to(ref.current,{rotateX:0,rotateY:0,duration:.8,ease:'power2.out'})}
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
    const focusInside=()=>{
      const target=focusables()[0]||panel.current
      target?.focus({preventScroll:true})
    }
    focusInside()
    const observer=new MutationObserver(()=>{
      if(document.activeElement===panel.current)focusInside()
    })
    if(panel.current)observer.observe(panel.current,{childList:true,subtree:true})
    function key(e){
      if(e.key==='Escape') onClose()
      if(e.key==='Tab'){
        const all=focusables();if(!all.length){e.preventDefault();panel.current?.focus();return}
        const first=all[0],last=all[all.length-1]
        if(e.shiftKey && (document.activeElement===first || !panel.current.contains(document.activeElement))){e.preventDefault();last.focus()}
        else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus()}
      }
    }
    window.addEventListener('keydown',key)
    return ()=>{observer.disconnect();document.body.style.overflow=oldOverflow;window.removeEventListener('keydown',key);previous?.focus({preventScroll:true})}
  },[onClose])
  return <motion.div className="modal-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
    <motion.section ref={panel} tabIndex={-1} className={`modal-panel ${wide?'modal-wide':''}`} role="dialog" aria-modal="true" aria-label={title} initial={{opacity:0,y:24,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:15,scale:.98}} transition={{duration:.25}}>
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
  const [modal,setModal]=useState(null)
  const [selected,setSelected]=useState(templates[2])
  const [draftName,setDraftName]=useState('')
  const [article,setArticle]=useState(null)
  const [openFaq,setOpenFaq]=useState(null)
  const close=useCallback(()=>{setModal(null);setArticle(null)},[])
  const claim=username=>setModal({type:'editor',username,template:selected.id})
  return <MotionConfig reducedMotion="user"><div>
    <KnotLanding templates={templates} onClaim={claim} onOpen={type=>setModal({type})} onTemplate={template=>{setSelected(template);setModal({type:'template'})}}/>
    <AnimatePresence>{modal&&<Modal onClose={close} wide={modal.type==='editor'} title={{editor:'Your Knot Site editor',template:'Template preview',journal:'The Knot Journal',login:'Continue your draft',jobs:'Find your next chapter',privacy:'Privacy and terms',faq:'Frequently asked questions',support:'Knot Site support'}[modal.type]}>
      {modal.type==='editor'&&<Suspense fallback={<p className="workspace-loading" role="status">Opening your workspace…</p>}><SiteEditor username={modal.username} initialTemplate={modal.template} onClose={close}/></Suspense>}
      {modal.type==='template'&&<div className="template-modal"><div className="template-modal-preview" style={{background:selected.color+'22'}}><Phone template={selected} onClick={()=>claim('yourname')}/></div><div className="template-modal-content"><span className="eyebrow">A STARTING POINT, NOT A LIMIT</span><h2>{selected.name}</h2><p>{selected.sub} Make this template your own with your words, colors, and work.</p><ul>{['Responsive by design','Custom colors and sections','Save locally & export HTML'].map(t=><li key={t}><Check size={15}/>{t}</li>)}</ul><button className="button button-blue" onClick={()=>claim('yourname')}>Make it yours <ArrowUpRight size={16}/></button><p className="small-print">Sample portfolio content · fully customizable</p></div></div>}
      {modal.type==='login'&&<div className="simple-modal"><Badge/><h2>Pick up where<br/>you left off.</h2><p>Enter your draft’s username to continue editing on this device.</p><form onSubmit={e=>{e.preventDefault();if(draftName.trim())claim(draftName.trim().toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,24)||'yourname')}}><label htmlFor="draft-name">Draft username</label><input id="draft-name" value={draftName} onChange={e=>setDraftName(e.target.value)} placeholder="yourname" required maxLength={24}/><button className="button button-blue" type="submit">Open my workspace <ArrowRight size={16}/></button></form><p className="small-print">Drafts are stored in this browser. No account or password is required.</p></div>}
      {modal.type==='journal'&&<div className="simple-modal journal-modal"><Badge/><h2>{article?article.title:'The little things\nthat make you stand out.'}</h2>{article?<><p>{article.body}</p><button className="text-link" onClick={()=>setArticle(null)}>← Back to the journal</button></>:<><p>Small reads for building a personal presence with a little more intention.</p>{[
        {title:'A homepage that feels like you',tag:'PERSONAL BRAND · 3 MIN READ',body:'Start with one clear sentence about what you do and who you do it for. Choose three projects you want to be known for, and tell the story behind each: the challenge, your contribution, and what changed. Add one clear way to get in touch. Your site doesn’t need to say everything. It needs to open the right conversation.'},
        {title:'Show the thinking behind the work',tag:'PORTFOLIOS · 2 MIN READ',body:'The finished image is only part of the story. Share the question you started with, a decision that mattered, and what you learned. A concise project story gives people a better sense of how you work than a long list of tools. Keep your role specific and give credit to collaborators.'},
        {title:'Your first site is a starting point',tag:'GETTING STARTED · 2 MIN READ',body:'Pick a template that makes your work easy to understand. Add your name, a useful headline, one project, and a contact link. Preview it on mobile, check the links, and export a copy. You can always add more later. A clear, current page is more useful than a perfect page that never leaves your drafts.'},
      ].map(a=><button className="journal-article" key={a.title} onClick={()=>setArticle(a)}><span>{a.tag}</span><strong>{a.title}<ArrowUpRight size={18}/></strong></button>)}</>}</div>}
      {modal.type==='jobs'&&<div className="simple-modal"><Badge/><h2>Your next chapter<br/>starts with your story.</h2><p>Give your best work a home before making your next move.</p><button className="button button-blue" onClick={()=>claim('yourname')}>Build your portfolio <ArrowUpRight size={16}/></button><div className="resource-links"><span className="eyebrow">EXPLORE OPPORTUNITIES</span><a href="https://www.ycombinator.com/jobs" target="_blank" rel="noreferrer">Y Combinator jobs <ExternalLink size={15}/></a><a href="https://wellfound.com/jobs" target="_blank" rel="noreferrer">Wellfound startup jobs <ExternalLink size={15}/></a></div><p className="small-print">Independent job boards. Knot Site does not list or manage applications.</p></div>}
      {modal.type==='privacy'&&<div className="simple-modal"><Badge/><h2>Your space.<br/>Your information.</h2><p>This interactive prototype stores portfolio drafts in your browser’s local storage. It does not create an account, register a domain, collect payment, or publish your draft.</p><p>Exported files are downloaded to your device. To remove a draft, clear this site’s browser storage. External job links open independent services with their own terms and privacy policies.</p><p className="small-print">This is a design implementation and local editing experience, not a live domain registration service.</p></div>}
      {modal.type==='faq'&&<div className="simple-modal"><Badge/><h2>A few questions.</h2><div className="faq-list">{faqs.map(([question,answer],i)=><div className="faq-item" key={question}><button onClick={()=>setOpenFaq(openFaq===i?null:i)} aria-expanded={openFaq===i} aria-controls={`faq-answer-${i}`}>{question}<Plus size={17}/></button>{openFaq===i&&<p id={`faq-answer-${i}`}>{answer}</p>}</div>)}</div></div>}
      {modal.type==='support'&&<div className="simple-modal"><Badge/><h2>A little help.</h2><p>Explore a template, choose a username, and try the editor. Save a draft on this device, or export your portfolio as an HTML file.</p><p>This homepage is a web design portfolio project. The account and URL fields demonstrate the intended product experience.</p><button className="button button-blue" onClick={()=>setModal({type:'faq'})}>Read the FAQs <ArrowRight size={16}/></button></div>}
    </Modal>}</AnimatePresence>
  </div></MotionConfig>
}
export default App
