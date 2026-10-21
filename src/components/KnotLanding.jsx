import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import testimonials from '../data/design-testimonials.json'
import shadows from '../data/design-shadows.json'
import './KnotLanding.css'
import './KnotLandingDetails.css'

gsap.registerPlugin(ScrollTrigger)

// The desktop composition uses the original 1600px Figma coordinate system.
// Container units scale it uniformly at narrower desktop widths.
const unit = n => `${n / 16}cqw`
const place = (x, y, width, height) => ({ left: unit(x), top: unit(y), width: unit(width), height: height == null ? undefined : unit(height) })

function Artwork({name, file, x, y, width, height, angle = 0, alt = '', interactive = false, className = '', eager = false}) {
  const image = <img src={`/assets/${file || `${name}@2x.png`}`} alt={interactive ? '' : alt} width={Math.round(width * 2)} height={Math.round(height * 2)} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable="false" />
  const props = { className: `ks-place ks-art ${interactive ? 'ks-art-button' : ''} ${className}`, 'data-design-asset': name, style: {...place(x,y,width,height), '--source-angle': `${angle}deg` } }
  return interactive ? <button {...props} type="button" aria-label={alt}><span className="ks-art-motion">{image}</span></button> : <div {...props} aria-hidden={alt ? undefined : 'true'}>{image}</div>
}

function Shadow({name,originY=0,originX=0}) {
  const s=shadows.find(item=>item.name===name)
  if(!s)return null
  const m=s.matrix
  return <div className="ks-place ks-shadow" style={{...place(s.x-originX,s.y-originY,s.width,s.height),transform:`matrix(${m.m00},${m.m10},${m.m01},${m.m11},0,0)`}} aria-hidden="true"><img src={`/assets/${s.paddedPng2x}`} alt="" loading="lazy" decoding="async" style={{position:'absolute',left:unit(-s.padding),top:unit(-s.padding),width:unit(s.imageWidth),height:unit(s.imageHeight),maxWidth:'none'}}/></div>
}

function ClaimForm({x,y,note=true,className=''}) {
  return <div className={`ks-place ks-claim ${className}`} style={place(x,y,510,note?76:40)}>
    <div className="ks-claim-form">
      <div className="ks-domain"><input aria-label="Your site username" placeholder="yourname" maxLength={24} autoCapitalize="none" autoCorrect="off" spellCheck="false"/><span>.knot.site</span></div>
      <button className="ks-claim-button" type="button">Claim your knot.site</button>
    </div>
    {note&&<p className="ks-no-card"><img src="/assets/no-credit-card@2x.png" width="23" height="17" alt=""/>No Credit Card Required</p>}
  </div>
}

const heroPhones=[
  ['phone-white',322,419.8345336914,154.5863342285,318.6217346191,0],
  ['phone-pink-vector',513.228515625,392.3525390625,154.5863342285,318.6217346191,1],
  ['phone-blue',704.45703125,358,190.0024261475,391.6187133789,2],
  ['phone-green',931.185546875,392.3525390625,154.5863342285,318.6217346191,3],
  ['phone-black',1122.4140625,419.8345336914,154.5863342285,318.6217346191,4],
]
const sectionCards=[
  ['section-stats',497,336.1907958984,150,150,-11.6113392464,'Preview the statistics section'],
  ['section-projects',536.779296875,451,150,162,12.3975074849,'Preview the projects section'],
  ['section-contact',514,644.6754150391,150,170,-11.8003877822,'Preview the contact section'],
  ['section-tools',949.05859375,303,150,120,15,'Preview the tools section'],
  ['section-faq',921,468.3208007813,150,121,-17.185865508,'Preview the FAQ section'],
  ['section-gallery',957.763671875,571,150,200,15,'Preview the gallery section'],
]
const featureData=[
  ['themes','Stunning Themes','Customise your site with beatifully designed themes that make your content stand out effortlessly.'],
  ['share','Share Instantly','Publish and share your site with a single-click-no coding, no hassle, just instant access.'],
  ['edit','Easily Edit','Make quick changes anytime with an intuitive editor designed for seamless updates.'],
  ['analytics','Powerful Analytics','Track visitor insights and performance metrics to optimize your site’s impact.'],
]

export default function KnotLanding() {
  const root=useRef(null)
  const carousel=useRef(null)
  const menuToggle=useRef(null)
  const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [menu,setMenu]=useState(false)
  useLayoutEffect(()=>{
    if(reduced)return
    const ctx=gsap.context(()=>{
      gsap.to('.ks-hero > [data-design-asset="knot-badge"],.ks-hero > .ks-heading,.ks-hero > .ks-body,.ks-hero > .ks-claim,.ks-hero-phones',{
        autoAlpha:.12,
        y:-24,
        stagger:.025,
        ease:'none',
        scrollTrigger:{trigger:'.ks-hero',start:'top top',end:'bottom 32%',scrub:.35},
      })
      gsap.utils.toArray('.ks-scroll-item').forEach(item=>{
        const distance=()=>window.innerWidth<768?18:34
        gsap.timeline({
          scrollTrigger:{trigger:item,start:'top 96%',end:'bottom 4%',scrub:.35,invalidateOnRefresh:true},
          defaults:{ease:'none'},
        })
          .fromTo(item,{autoAlpha:0,y:distance},{autoAlpha:1,y:0,duration:.24},0)
          .to(item,{autoAlpha:1,y:0,duration:.52})
          .to(item,{autoAlpha:.12,y:()=>-distance(),duration:.24})
      })
    },root)
    return ()=>ctx.revert()
  },[reduced])
  useEffect(()=>{
    const mq=window.matchMedia('(prefers-reduced-motion: reduce)')
    const update=()=>setReduced(mq.matches)
    update();mq.addEventListener('change',update)
    return ()=>mq.removeEventListener('change',update)
  },[])
  useEffect(()=>{
    const mq=window.matchMedia('(max-width: 1199px)')
    const center=()=>{if(mq.matches&&carousel.current)carousel.current.scrollLeft=(carousel.current.scrollWidth-carousel.current.clientWidth)/2}
    center();mq.addEventListener('change',center)
    return ()=>mq.removeEventListener('change',center)
  },[])
  useEffect(()=>{
    if(!menu)return
    const navigation=document.getElementById('ks-mobile-navigation')
    navigation?.querySelector('button,a')?.focus({preventScroll:true})
    const closeMenu=event=>{
      if(event.key==='Escape'){
        setMenu(false)
        window.requestAnimationFrame(()=>menuToggle.current?.focus({preventScroll:true}))
      }
    }
    window.addEventListener('keydown',closeMenu)
    return ()=>window.removeEventListener('keydown',closeMenu)
  },[menu])

  return <div className="ks-site" ref={root}>
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="ks-navigation">
      <a className="ks-place ks-header-brand" style={place(215,24,132,33)} href="#main" aria-label="Knot Site home"><img src="/assets/knot-wordmark@2x.png" width="264" height="66" alt="knot site"/></a>
      <nav className="ks-desktop-navigation" aria-label="Main navigation">
        <button className="ks-place" style={place(867,30.5,37,20)} type="button">Blog</button><span className="ks-place ks-new" style={place(909,30,39.1666679382,20)}>New</span>
        <a className="ks-place" style={place(978,30.5,69,20)} href="#sections">Sections</a>
        <button className="ks-place" style={place(1078,30.5,78,20)} type="button">Find Jobs</button>
        <button className="ks-place" style={place(1186,30.5,125,20)} type="button">Create Account</button>
        <button className="ks-place" style={place(1338,30.5,50,20)} type="button">Log In</button>
      </nav>
      <button ref={menuToggle} type="button" className="ks-menu-toggle" aria-label={menu?'Close navigation':'Open navigation'} aria-expanded={menu} aria-controls="ks-mobile-navigation" onClick={()=>setMenu(!menu)}><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d={menu?'M5 5 19 19M19 5 5 19':'M4 7h16M4 12h16M4 17h16'}/></svg></button>
      {menu&&<nav id="ks-mobile-navigation" className="ks-mobile-navigation" aria-label="Mobile navigation"><button type="button">Blog <span>New</span></button><a href="#sections" onClick={()=>setMenu(false)}>Sections</a><button type="button">Find Jobs</button><button type="button">Create Account</button><button type="button">Log In</button></nav>}
    </header>

    <main id="main">
      <section className="ks-hero" aria-labelledby="ks-hero-title">
        <div className="ks-hero-glow" aria-hidden="true"/>
        <Artwork name="knot-badge" x={775} y={40} width={50} height={50} eager/>
        <h1 id="ks-hero-title" className="ks-place ks-heading" style={place(364,106,882,87.296)}>Tie your digital world together</h1>
        <p className="ks-place ks-body ks-hero-copy" style={place(634,201,333,20)}>Claim, customize, and publish - for free.</p>
        <ClaimForm x={536} y={242}/>
        <div className="ks-hero-shadows" aria-hidden="true">
          {['white','pink','green','blue','black'].map(color=><Shadow key={color} name={`shadow-hero-${color}`} originY={80}/>)}
        </div>
        <div className="ks-hero-phones" ref={carousel} aria-label="Personal website templates">{heroPhones.map(([name,x,y,width,height])=><Artwork key={name} name={name} x={x} y={y} width={width} height={height} eager alt="Portfolio template preview" interactive/>)}</div>
      </section>

      <section className="ks-prebuilt" id="sections" aria-labelledby="ks-sections-title">
        <Artwork name="knot-pill" x={734} y={0} width={130} height={33} className="ks-scroll-item"/>
        <h2 id="ks-sections-title" className="ks-place ks-heading ks-scroll-item" style={place(477,49,652,87.296)}>Use Pre-Built Sections</h2>
        <p className="ks-place ks-body ks-centered ks-prebuilt-copy ks-scroll-item" style={place(504,144,592,40)}>knot gives you stunning prebuilt sections to build your site effortlessly.<br/>Just pick, customize, and publish - no design skills needed.</p>
        <ClaimForm x={545} y={210} className="ks-scroll-item"/>
        <div className="ks-section-artwork ks-scroll-item">
          <Shadow name="shadow-section-phone" originY={914}/>
          <Artwork name="section-phone" x={715} y={326} width={169.814453125} height={350.0087890625} alt="Preview the designer template" interactive/>
          {sectionCards.map(([name,x,y,width,height,angle,label])=><Artwork key={name} name={name} x={x} y={y} width={width} height={height} angle={angle} alt={label} interactive/>)}
        </div>
      </section>

      <section className="ks-social-proof" aria-labelledby="ks-social-title">
        <div className="ks-social-glow" aria-hidden="true"/>
        <Artwork name="knot-pill-dark" x={729} y={80} width={130} height={33} className="ks-scroll-item"/>
        <h2 id="ks-social-title" className="ks-place ks-heading ks-centered ks-scroll-item" style={place(352,129,895,174)}>The <em>easiest</em> way to build a<br/> stunning personal site for free.</h2>
        <p className="ks-place ks-body ks-centered ks-social-copy ks-scroll-item" style={place(421,311,758,40)}>No complicated tools, no hidden fees - just a fast, free way to create a stunning site in minutes. Professionals love it, and you will too.</p>
        <ClaimForm x={518} y={377} note={false} className="ks-scroll-item"/>
        <div className="ks-testimonials ks-scroll-item" aria-label="Illustrative testimonials from the original portfolio design">{testimonials.map(card=><figure className="ks-place ks-testimonial" key={card.id} style={place(card.x,card.y-1670,300,100)}><img src={card.artwork} width="600" height="200" loading="lazy" decoding="async" alt={card.alt}/></figure>)}</div>
        <div className="ks-proof-fade" aria-hidden="true"/>
      </section>

      <section className="ks-launch" aria-labelledby="ks-launch-title">
        <Artwork name="knot-pill" x={734} y={80} width={130} height={33} className="ks-scroll-item"/>
        <h2 id="ks-launch-title" className="ks-place ks-heading ks-scroll-item" style={place(315,137,993,87.296)}>Launch <em>your</em> personal brand today</h2>
        <p className="ks-place ks-body ks-centered ks-launch-copy ks-scroll-item" style={place(507,232,587,40)}>Pick a template, edit a few sections and share. No design skills needed,<br/>just a fast, effortless way to build your brand.</p>
        <ClaimForm x={545} y={298} note={false} className="ks-scroll-item"/>
        <div className="ks-features ks-scroll-item">{featureData.map(([icon,title,text],index)=><article key={icon} className="ks-place ks-feature" style={place(288+258*index,386,250,185)}>
          <div className={`ks-feature-icon ks-feature-icon-${icon}`}>{icon==='themes'?<img src="/assets/feature-themes.svg" width="44" height="44" alt=""/>:<img src={`/assets/feature-${icon}.svg`} width={icon==='share'?18:icon==='edit'?19:20} height={icon==='share'?18:icon==='edit'?19:18} alt=""/>}</div>
          <h3>{title}</h3><p>{text}</p>
        </article>)}</div>
        <Artwork name="editor-reference" x={415} y={651} width={772} height={600} className="ks-scroll-item ks-editor-preview" alt="Knot Site editor preview" interactive/>
      </section>

      <section className="ks-cta" aria-labelledby="ks-cta-title">
        <div className="ks-cta-glow ks-cta-glow-top" aria-hidden="true"/><div className="ks-cta-glow ks-cta-glow-bottom" aria-hidden="true"/>
        <h2 id="ks-cta-title" className="ks-place ks-heading ks-scroll-item" style={place(285,136,552,134)}>Start making <em>your</em><br/>personal site now.</h2>
        <p className="ks-place ks-body ks-cta-copy ks-scroll-item" style={place(285,278,452,20)}>Claim your knot.site URL before someone else takes it.</p>
        <ClaimForm x={285} y={324} className="ks-scroll-item"/>
        <div className="ks-place ks-cta-artwork ks-scroll-item" data-design-asset="cta-phones" style={place(929,80,231.814453125,376.0087890625)}>
          <Shadow name="shadow-cta-white" originX={929} originY={4081}/><Shadow name="shadow-cta-pink" originX={929} originY={4081}/>
          <Artwork name="cta-phone-white" x={0} y={0} width={170} height={350.3912353516} alt="Preview the minimalist template" interactive/>
          <Artwork name="cta-phone-pink" x={62} y={26} width={169.814453125} height={350.0087890625} alt="Preview the designer template" interactive/>
        </div>
      </section>
    </main>

    <footer className="ks-footer">
      <a href="#main" className="ks-place ks-footer-brand" style={place(285,80,132,33)} aria-label="Knot Site home"><img src="/assets/knot-wordmark@2x.png" width="264" height="66" alt="knot site" loading="lazy"/></a>
      <div className="ks-place ks-footer-column" style={place(517,83,74,124)}><h2>Use</h2><button type="button">SignIn</button><button type="button">Blog <span className="ks-new">New</span></button><button type="button">Support</button></div>
      <div className="ks-place ks-footer-column" style={place(642,83,90,89)}><h2>Legal</h2><button type="button">Terms</button><button type="button">Privacy</button></div>
      <div className="ks-place ks-footer-column" style={place(777,83,80,89)}><h2>More</h2><button type="button">X(Twitter)</button><button type="button">FAQs <span className="ks-new">New</span></button></div>
      <p className="ks-place ks-copyright" style={place(909,83,178,19)}>2026 © All Rights Reserved</p>
    </footer>
  </div>
}
