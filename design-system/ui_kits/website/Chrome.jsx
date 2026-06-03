// Header — sticky nav with logo, links, language toggle, CTA
function Header({ lang, setLang, view, go, onDark }) {
  const t = L[lang];
  const logo = onDark ? `${A}/logos/logo-white-horizontal.svg` : `${A}/logos/logo-color-horizontal.svg`;
  const items = [['home', t.nav.home], ['services', t.nav.services], ['about', t.nav.about], ['contact', t.nav.contact]];
  return (
    <header className={'hdr' + (onDark ? ' on-dark' : '')}>
      <img className="hdr__logo" src={logo} alt="Laguntza Fisioterapia" onClick={() => go('home')} />
      <nav className="hdr__nav">
        {items.map(([id, label]) => (
          <button key={id} className={view === id ? 'active' : ''} onClick={() => go(id === 'about' ? 'home' : id)}>{label}</button>
        ))}
      </nav>
      <div className="hdr__right">
        <button className="lang" onClick={() => setLang(lang === 'eu' ? 'es' : 'eu')} title="Aldatu hizkuntza / Cambiar idioma">
          <img src={`${A}/icons/translate.svg`} alt="" /> {lang === 'eu' ? 'EU' : 'ES'}
        </button>
        <button className="hdr__cta" onClick={() => go('contact')}>{t.cta}</button>
      </div>
    </header>
  );
}

// Footer — socials, address, quick links, logo, copyright
function Footer({ lang, go }) {
  const t = L[lang];
  const ig = 'M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4A5.8 5.8 0 0 1 16.2 22H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 1.8A4 4 0 0 0 3.8 7.8v8.4a4 4 0 0 0 4 4h8.4a4 4 0 0 0 4-4V7.8a4 4 0 0 0-4-4H7.8ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Zm5.3-2.9a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z';
  const wa = 'M12 2a9.9 9.9 0 0 0-8.4 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 0 1 6.9 12.6.9.9 0 0 0-.1.8l.5 1.8-1.9-.5a.9.9 0 0 0-.7.1A8.2 8.2 0 1 1 12 3.8Zm-2.7 3.6c-.2 0-.5 0-.7.3-.3.3-1 1-1 2.3s1 2.7 1.2 2.9c.1.2 2 3.1 4.9 4.2 2.4 1 2.9.8 3.4.7.5 0 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3l-2-1c-.3-.1-.5-.1-.7.2l-.7.9c-.1.2-.3.2-.5.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5 0-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.4-.5-.6-.5h-.5Z';
  const links = [['home', t.nav.home], ['services', t.nav.services], ['contact', t.nav.contact]];
  return (
    <footer className="ftr">
      <div className="container narrow ftr__inner">
        <div className="ftr__socials">
          <a href="https://www.instagram.com/laguntzafisioterapia" target="_blank" rel="noreferrer" title="Instagram"><svg viewBox="0 0 24 24" fill="currentColor"><path d={ig}/></svg></a>
          <a href={`https://wa.me/${COMPANY.whatsapp.replace(/\s/g,'')}`} target="_blank" rel="noreferrer" title="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d={wa}/></svg></a>
          <a href={`mailto:${COMPANY.email}`} title="Email"><img src={`${A}/icons/email.svg`} alt="" style={{width:24,height:24}}/></a>
        </div>
        <address className="ftr__addr" style={{fontStyle:'normal'}}>
          <a href={`tel:+34${COMPANY.phone.replace(/\s/g,'')}`}><img src={`${A}/icons/phone.svg`} alt=""/> {COMPANY.whatsapp} · {COMPANY.phone}</a>
          <a href="https://maps.app.goo.gl/ct7ZQvDpocAY3V5ZA" target="_blank" rel="noreferrer"><img src={`${A}/icons/marker.svg`} alt=""/> {COMPANY.address}</a>
        </address>
        <nav className="ftr__links">
          {links.map(([id, label]) => <button key={id} onClick={() => go(id)}>{label}</button>)}
        </nav>
        <div className="ftr__logo"><img src={`${A}/logos/logo-color-vertical.svg`} alt="Laguntza Fisioterapia"/></div>
      </div>
      <div className="ftr__copy">Copyright © {new Date().getFullYear()} Laguntza Fisioterapia</div>
    </footer>
  );
}

Object.assign(window, { Header, Footer });
