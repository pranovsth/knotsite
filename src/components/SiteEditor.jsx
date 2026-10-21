import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, ArrowUpRight, Check, Download, Eye, LayoutTemplate, Mail, Monitor, Palette, Smartphone, X } from 'lucide-react';
import './SiteEditor.css';

const TEMPLATES = {
  designer: { label: 'Designer', color: '#eda3ba', background: '#fff7f7', ink: '#3e2735', role: 'Independent designer', note: 'A little playful. A lot of you.' },
  product: { label: 'Product', color: '#9ebde9', background: '#f2f6fd', ink: '#1c304e', role: 'Product designer', note: 'Good ideas deserve great homes.' },
  botanist: { label: 'Botanist', color: '#bad1a4', background: '#f4f7ee', ink: '#30432f', role: 'Growing good things', note: 'Room for your ideas to grow.' },
  minimal: { label: 'Minimal', color: '#d8cdbb', background: '#faf8f3', ink: '#413c33', role: 'Designer & thoughtful maker', note: 'Less noise. More you.' },
  developer: { label: 'Developer', color: '#b5a2ef', background: '#242528', ink: '#f5f4ef', role: 'Creative developer', note: 'Made with curiosity and a little code.' },
};
const ACCENTS = ['#eda3ba', '#9ebde9', '#bad1a4', '#d8cdbb', '#b5a2ef', '#f2b880'];
const hasTemplate = (value) => Object.prototype.hasOwnProperty.call(TEMPLATES, value);
const socialLink = (value) => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };
const contactEmail = (value) => typeof value === 'string' && /^[^\s<>"'@]+@[^\s<>"'@]+\.[^\s<>"'@]+$/.test(value.trim()) ? value.trim() : '';
const contactLink = (value) => contactEmail(value) ? `mailto:${encodeURIComponent(contactEmail(value)).replace(/%40/g, '@')}` : '';
const defaultProfile = (username, initialTemplate) => ({
  name: username === 'yourname' ? 'Alex Morgan' : username.replace(/[._-]/g, ' '),
  title: TEMPLATES[initialTemplate]?.role || TEMPLATES.designer.role,
  bio: 'I turn big ideas into thoughtful digital experiences. Currently making things that feel a little more human.',
  email: 'hello@example.com',
  socialURL: '',
  template: hasTemplate(initialTemplate) ? initialTemplate : 'designer',
  accent: TEMPLATES[initialTemplate]?.color || TEMPLATES.designer.color,
  sections: { projects: true, contact: true, social: true },
});
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const validAccent = (value) => /^#[a-f0-9]{6}$/i.test(value);

function readDraft(username, initialTemplate) {
  const fallback = defaultProfile(username, initialTemplate);
  try {
    const saved = JSON.parse(localStorage.getItem(`knot-site:draft:${username}`));
    if (!saved || typeof saved !== 'object') return fallback;
    return {
      ...fallback,
      ...Object.fromEntries(['name', 'title', 'bio', 'email', 'socialURL'].map((key) => [key, typeof saved[key] === 'string' ? saved[key].slice(0, key === 'bio' ? 360 : key === 'socialURL' ? 300 : 100) : fallback[key]])),
      template: hasTemplate(saved.template) ? saved.template : fallback.template,
      accent: validAccent(saved.accent) ? saved.accent : fallback.accent,
      sections: Object.fromEntries(Object.keys(fallback.sections).map((key) => [key, typeof saved.sections?.[key] === 'boolean' ? saved.sections[key] : true])),
    };
  } catch { return fallback; }
}

function portfolioHTML(profile) {
  const theme = TEMPLATES[profile.template];
  const safeEmail = contactEmail(profile.email);
  const contact = contactLink(profile.email) || '#contact';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escapeHTML(profile.bio)}"><title>${escapeHTML(profile.name)} — ${escapeHTML(profile.title)}</title><style>*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;overflow-wrap:anywhere;background:${theme.background};color:${theme.ink};font-family:Arial,sans-serif;line-height:1.6}.page{max-width:800px;margin:auto;padding:64px 28px}nav{display:flex;gap:24px;justify-content:space-between;align-items:center}a{color:inherit;text-underline-offset:5px}nav a{font-size:14px}header{padding:88px 0 56px}.avatar{width:82px;height:82px;border-radius:50%;display:grid;place-items:center;background:${profile.accent};font-size:32px;color:#28231f}h1{font-size:clamp(42px,9vw,76px);line-height:1.06;letter-spacing:-.06em;margin:25px 0 18px}h2{font-size:28px;letter-spacing:-.04em}p{max-width:530px;opacity:.75}.role{font-size:21px;opacity:1}.button{display:inline-flex;padding:12px 20px;background:${profile.accent};color:#28231f;border-radius:30px;text-decoration:none;font-weight:bold;margin-top:16px}.projects{display:grid;grid-template-columns:1fr 1fr;gap:20px}.project{display:block;text-decoration:none}.art{aspect-ratio:4/3;border-radius:18px;background:radial-gradient(ellipse at 50% 45%,#fff9 0 20%,transparent 21%),linear-gradient(135deg,${profile.accent},#c5b5e4);display:grid;place-items:center;font-size:45px;color:#28231f}.project:nth-child(2) .art{background:linear-gradient(145deg,#c9d7bc,#ece7ce)}.project h3{margin:12px 0 0}.project p{margin-top:0;font-size:14px}section{padding:25px 0 40px}footer{margin-top:60px;padding-top:24px;border-top:1px solid #8884;font-size:12px;opacity:.65}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}@media(max-width:500px){.page{padding:28px 22px}header{padding-top:56px}.projects{grid-template-columns:1fr}}</style></head><body><main class="page"><nav><strong>${escapeHTML(profile.name)}</strong><div>${profile.sections.projects ? '<a href="#work">Work</a>&nbsp;&nbsp;&nbsp;' : ''}${profile.sections.contact ? '<a href="#contact">Say hello ↗</a>' : ''}</div></nav><header><div class="avatar" aria-hidden="true">${escapeHTML(profile.name.slice(0, 1).toUpperCase() || 'A')}</div><h1>${escapeHTML(profile.name)}</h1><p class="role">${escapeHTML(profile.title)}</p><p>${escapeHTML(profile.bio)}</p>${profile.sections.contact ? `<a class="button" href="${escapeHTML(contact)}">Let's talk ↗</a>` : ''}</header>${profile.sections.projects ? '<section id="work"><h2>Selected work</h2><div class="projects"><a class="project" href="#project-one"><div class="art" aria-hidden="true">✳</div><h3>Fresh perspectives</h3><p>Brand identity · 2026</p></a><a class="project" href="#project-two"><div class="art" aria-hidden="true">↗</div><h3>A little more human</h3><p>Digital experience · 2026</p></a></div></section><section id="project-one"><h2>Fresh perspectives</h2><p>A space for your first project. Replace this description and add your own images to make it yours.</p></section><section id="project-two"><h2>A little more human</h2><p>A space for your next big idea. Tell the story behind your work here.</p></section>' : ''}${profile.sections.contact ? `<section id="contact"><h2>Have something in mind?</h2><p>I'd love to hear about it.</p>${safeEmail ? `<a href="${escapeHTML(contact)}">${escapeHTML(safeEmail)} ↗</a>` : '<p>Add your email address in the editor to let people contact you.</p>'}</section>` : ''}${profile.sections.social && socialLink(profile.socialURL) ? `<section aria-label="Social link"><h2>Elsewhere on the internet</h2><a href="${escapeHTML(socialLink(profile.socialURL))}" target="_blank" rel="noopener noreferrer">Find me online ↗</a></section>` : ''}<footer>© ${new Date().getFullYear()} ${escapeHTML(profile.name)} · Made with Knot Site</footer></main></body></html>`;
}

export default function SiteEditor({ username = 'yourname', initialTemplate = 'designer', onClose, inline = false }) {
  const [profile, setProfile] = useState(() => readDraft(username, initialTemplate));
  const [viewport, setViewport] = useState('desktop');
  const [status, setStatus] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const inputRefs = useRef({});
  const id = useId();
  const reduceMotion = useReducedMotion();
  const theme = TEMPLATES[profile.template];

  useEffect(() => { setProfile(readDraft(username, initialTemplate)); setDirty(false); setStatus(''); setStatusError(false); }, [username, initialTemplate]);
  const announce = (message, error = false) => { setStatus(message); setStatusError(error); };
  const update = (key, value) => { setProfile((current) => ({ ...current, [key]: value })); setDirty(true); announce(''); };
  const setTemplate = (template) => { setProfile((current) => ({ ...current, template, accent: TEMPLATES[template].color })); setDirty(true); announce(''); };
  const save = () => {
    try { localStorage.setItem(`knot-site:draft:${username}`, JSON.stringify(profile)); setDirty(false); announce('Draft saved on this device.'); }
    catch { announce('Your browser could not save this draft. You can still export your HTML.', true); }
  };
  const exportHTML = () => {
    let url;
    let link;
    try {
      const blob = new Blob([portfolioHTML(profile)], { type: 'text/html;charset=utf-8' });
      url = URL.createObjectURL(blob);
      link = document.createElement('a');
      link.href = url; link.download = `${username.replace(/[^a-z0-9_-]/gi, '-') || 'my'}-portfolio.html`;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
      announce('HTML download started. Open the downloaded file in your browser.');
    } catch {
      link?.remove();
      if (url) URL.revokeObjectURL(url);
      announce('Your browser could not start the HTML download. Please try again.', true);
    }
  };
  const focusField = (field) => { setActiveTab('content'); window.requestAnimationFrame(() => inputRefs.current[field]?.focus()); };

  return (
    <div className={`knot-editor ${inline ? 'knot-editor--inline' : ''}`} style={{ '--editor-accent': profile.accent }}>
      <div className="ke-toolbar">
        <div className="ke-brand"><span className="ke-knot" aria-hidden="true">✳</span><span>knot<span className="ke-brand-dot">.</span></span><span className="ke-draft-badge">Your studio</span></div>
        <div className="ke-toolbar-actions">
          <span className="ke-save-note">{dirty ? 'Unsaved changes' : 'Local draft'}</span>
          <button type="button" className="ke-save" onClick={save}>{!dirty && status.startsWith('Draft saved') ? <Check size={14} /> : null}Save draft</button>
          <button type="button" className="ke-export" onClick={exportHTML}><Download size={14} /><span>Export HTML</span></button>
          {onClose && <button type="button" className="ke-icon-button ke-close" onClick={onClose} aria-label="Close site editor"><X size={19} /></button>}
        </div>
      </div>
      <div className="ke-workspace">
        <aside className="ke-controls" aria-label="Portfolio settings">
          <div className="ke-panel-heading"><span>Make yourself at home.</span><p>Your corner of the internet, your way.</p></div>
          <div className="ke-tabs" role="tablist" aria-label="Editor controls" onKeyDown={(event) => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 'content' : event.key === 'End' ? 'style' : activeTab === 'content' ? 'style' : 'content'; setActiveTab(next); document.getElementById(`${id}-${next}-tab`)?.focus(); } }}>
            <button type="button" role="tab" tabIndex={activeTab === 'content' ? 0 : -1} id={`${id}-content-tab`} aria-controls={`${id}-content-panel`} aria-selected={activeTab === 'content'} className={activeTab === 'content' ? 'is-active' : ''} onClick={() => setActiveTab('content')}><Eye size={14} />Content</button>
            <button type="button" role="tab" tabIndex={activeTab === 'style' ? 0 : -1} id={`${id}-style-tab`} aria-controls={`${id}-style-panel`} aria-selected={activeTab === 'style'} className={activeTab === 'style' ? 'is-active' : ''} onClick={() => setActiveTab('style')}><Palette size={14} />Style</button>
          </div>
          <div className="ke-control-body" role="tabpanel" id={`${id}-${activeTab}-panel`} aria-labelledby={`${id}-${activeTab}-tab`}>
            {activeTab === 'content' ? <>
              <div className="ke-field"><label htmlFor={`${id}-name`}>Your name</label><input ref={(element) => { inputRefs.current.name = element; }} id={`${id}-name`} value={profile.name} maxLength={100} onChange={(event) => update('name', event.target.value)} placeholder="Your name" /></div>
              <div className="ke-field"><label htmlFor={`${id}-title`}>What do you do?</label><input ref={(element) => { inputRefs.current.title = element; }} id={`${id}-title`} value={profile.title} maxLength={100} onChange={(event) => update('title', event.target.value)} placeholder="Designer, maker, dreamer…" /></div>
              <div className="ke-field ke-bio-field"><label htmlFor={`${id}-bio`}>A little about you<span>{profile.bio.length}/360</span></label><textarea id={`${id}-bio`} value={profile.bio} maxLength={360} onChange={(event) => update('bio', event.target.value)} rows={4} /></div>
              <div className="ke-field"><label htmlFor={`${id}-email`}>Contact email</label><input id={`${id}-email`} type="email" autoComplete="email" aria-invalid={Boolean(profile.email && !contactEmail(profile.email))} value={profile.email} maxLength={100} onChange={(event) => update('email', event.target.value)} placeholder="hello@you.com" /></div>
              {profile.sections.social && <div className="ke-field"><label htmlFor={`${id}-social`}>Social profile <span>Optional</span></label><input id={`${id}-social`} type="url" autoComplete="url" aria-invalid={Boolean(profile.socialURL && !socialLink(profile.socialURL))} value={profile.socialURL} maxLength={300} onChange={(event) => update('socialURL', event.target.value)} placeholder="https://your-social-profile.com" /></div>}
              <div className="ke-section-controls"><h4>Your sections</h4>{[['projects', 'Selected work'], ['contact', 'Contact'], ['social', 'Social links']].map(([key, label]) => <label className="ke-toggle-row" key={key}><span>{label}</span><input type="checkbox" checked={profile.sections[key]} onChange={(event) => update('sections', { ...profile.sections, [key]: event.target.checked })} /><span className="ke-toggle" aria-hidden="true" /></label>)}</div>
            </> : <>
              <div className="ke-field-title"><LayoutTemplate size={15} />Find your feeling</div>
              <div className="ke-template-grid">{Object.entries(TEMPLATES).map(([key, item]) => <button type="button" key={key} className={`ke-template-option ${profile.template === key ? 'is-selected' : ''}`} aria-pressed={profile.template === key} onClick={() => setTemplate(key)}><span className="ke-template-mini" style={{ background: item.background, color: item.ink }}><i style={{ background: item.color }} /><b /><em /><em /></span><span>{item.label}{profile.template === key && <Check size={12} />}</span></button>)}</div>
              <div className="ke-accent-picker"><h4>A pop of personality</h4><div className="ke-swatches">{ACCENTS.map((color) => <button type="button" key={color} onClick={() => update('accent', color)} style={{ backgroundColor: color }} aria-label={`Use ${({ '#eda3ba': 'rose', '#9ebde9': 'sky blue', '#bad1a4': 'sage', '#d8cdbb': 'sand', '#b5a2ef': 'lilac', '#f2b880': 'peach' })[color]} accent`} aria-pressed={profile.accent === color}>{profile.accent === color && <Check size={14} />}</button>)}</div></div>
              <p className="ke-style-note">{theme.note}<br />Switch things up whenever you like.</p>
            </>}
          </div>
          <div className="ke-local-note"><span className="ke-local-dot" />A little local magic. Your draft stays on this device.</div>
        </aside>
        <div className="ke-preview-workspace">
          <div className="ke-preview-topline"><span><span className="ke-live-dot" />Live preview</span><div className="ke-viewport-toggle" aria-label="Preview size"><button type="button" className={viewport === 'desktop' ? 'is-active' : ''} onClick={() => setViewport('desktop')} aria-pressed={viewport === 'desktop'} aria-label="Desktop preview"><Monitor size={15} /></button><button type="button" className={viewport === 'mobile' ? 'is-active' : ''} onClick={() => setViewport('mobile')} aria-pressed={viewport === 'mobile'} aria-label="Mobile preview"><Smartphone size={15} /></button></div><span className="ke-preview-hint">Made by you. Already.</span></div>
          <motion.div layout={!reduceMotion} transition={{ type: 'spring', stiffness: 220, damping: 30 }} className={`ke-preview-frame ${viewport === 'mobile' ? 'ke-preview-frame--mobile' : ''}`}>
            <div className="ke-browser-bar"><div><i /><i /><i /></div><span>your little corner / {username}</span><span className="ke-browser-status">DRAFT</span></div>
            <AnimatePresence mode="wait"><motion.div key={profile.template} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: reduceMotion ? 1 : 0 }} transition={{ duration: reduceMotion ? 0 : 0.18 }} className={`ke-portfolio ke-portfolio--${profile.template}`} style={{ background: theme.background, color: theme.ink }}>
              <nav className="ke-site-nav"><span>{profile.name.split(' ')[0] || 'Your name'}<span style={{ color: profile.accent }}>.</span></span><div>{profile.sections.projects && <a href={`#${id}-work`}>Work</a>}{profile.sections.contact && <a href={`#${id}-contact`}>Say hello <ArrowUpRight size={11} /></a>}</div></nav>
              <div className="ke-profile-hero"><div className="ke-avatar" style={{ background: profile.accent }} aria-hidden="true"><span>✳</span><i /></div><div className="ke-available"><i />Open to good conversations</div><button type="button" className="ke-editable-name" onClick={() => focusField('name')} aria-label="Edit your name"><h2>Hey, I'm {profile.name || 'your name'}<span style={{ color: profile.accent }}>.</span></h2></button><button type="button" className="ke-editable-title" onClick={() => focusField('title')} aria-label="Edit your role">{profile.title || 'What do you do?'}</button><p>{profile.bio}</p>{profile.sections.contact && <a className="ke-talk-button" href={`#${id}-contact`}>Let's talk <ArrowUpRight size={13} /></a>}</div>
              {profile.sections.projects && <section className="ke-selected-work" id={`${id}-work`}><div className="ke-mini-heading"><h3>A few things I've made</h3><span>Selected work / 2026</span></div><div className="ke-project-grid"><a className="ke-project-card" href={`#${id}-project-one`} onClick={() => { const detail = document.getElementById(`${id}-project-one`); if (detail) detail.open = true; }}><div className="ke-project-art ke-project-art--one"><div className="ke-art-orbit" /><span>offbeat<span>®</span></span><div className="ke-art-sticker">A fresh<br />perspective.</div></div><div className="ke-project-caption"><span>Fresh perspectives<small>Brand identity</small></span><ArrowUpRight size={14} /></div></a><a className="ke-project-card" href={`#${id}-project-two`} onClick={() => { const detail = document.getElementById(`${id}-project-two`); if (detail) detail.open = true; }}><div className="ke-project-art ke-project-art--two"><div className="ke-art-sun" /><span>good things<br /><i>take shape.</i></span><div className="ke-art-plant" /></div><div className="ke-project-caption"><span>A little more human<small>Digital experience</small></span><ArrowUpRight size={14} /></div></a></div><details className="ke-project-detail" id={`${id}-project-one`}><summary>Fresh perspectives — project details</summary><p>Your first project starts here. Export your site and add the story, images, and details behind your work.</p></details><details className="ke-project-detail" id={`${id}-project-two`}><summary>A little more human — project details</summary><p>A home for your next big idea. This is a sample project to help you picture the possibilities.</p></details></section>}
              {profile.sections.contact && <section id={`${id}-contact`} className="ke-preview-contact"><span>Have something in mind?</span><a href={contactLink(profile.email) || `#${id}-email`} onClick={(event) => { if (!contactEmail(profile.email)) { event.preventDefault(); setActiveTab('content'); announce('Add a valid contact email to enable this link.', true); window.requestAnimationFrame(() => document.getElementById(`${id}-email`)?.focus()); } }}>Let's make it happen <ArrowUpRight size={14} /></a></section>}
              <footer className="ke-site-footer"><span>© {new Date().getFullYear()} {profile.name || 'Your name'}</span>{profile.sections.social && (socialLink(profile.socialURL) ? <a href={socialLink(profile.socialURL)} target="_blank" rel="noopener noreferrer">Find me online <ArrowUpRight size={9} /></a> : <button type="button" onClick={() => { setActiveTab('content'); window.requestAnimationFrame(() => document.getElementById(`${id}-social`)?.focus()); }}><Mail size={11} />Add social link</button>)}<span>Made with <b>knot.</b></span></footer>
            </motion.div></AnimatePresence>
          </motion.div>
          <p className="ke-preview-caption">Go on, make it feel like you. <span>✳</span></p>
        </div>
      </div>
      <div className={`ke-status ${status ? 'ke-status--visible' : ''} ${statusError ? 'ke-status--error' : ''}`} role="status" aria-live="polite" aria-atomic="true">{status && <>{statusError ? <AlertCircle size={14} /> : <Check size={14} />}{status}</>}</div>
    </div>
  );
}
