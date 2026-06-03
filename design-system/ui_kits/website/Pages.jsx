// Services page — grid of image cards with overlay
function ServicesPage({ lang, go }) {
  const t = L[lang];
  return (
    <main className="svc-page">
      <div className="container">
        <div className="svc-page__head">
          <h1>{t.nav.services}</h1>
          <p>{t.svcPageIntro}</p>
        </div>
        <div className="svc-grid">
          {t.services.map((s, i) => (
            <article key={i} className="svc-card" onClick={() => go('contact')}>
              <img src={`${A}/images/${s.img}`} alt={s.title} />
              <div className="svc-card__scrim" />
              <div className="svc-card__body">
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

// Contact page — the recreated ContactForm
function ContactPage({ lang }) {
  const t = L[lang].contact;
  const [sent, setSent] = React.useState(false);
  const submit = (e) => { e.preventDefault(); setSent(true); };
  return (
    <main className="contact-page">
      <div className="container narrow">
        <div className="form-head">
          <h1>{t.title}</h1>
          <p>{t.sub}</p>
        </div>
        <form className="form-card" onSubmit={submit}>
          <div className="form-grid">
            <div className="fg">
              <label>{t.name} <span className="req">*</span></label>
              <div className="fwrap">
                <svg className="ic" style={{position:'absolute',left:16,width:20,height:20,opacity:.5}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input required placeholder={t.namePh} />
              </div>
            </div>
            <div className="fg">
              <label>Email <span className="req">*</span></label>
              <div className="fwrap">
                <img className="ic" src={`${A}/icons/email.svg`} alt="" />
                <input type="email" required placeholder={t.emailPh} />
              </div>
            </div>
            <div className="fg">
              <label>{t.phone}</label>
              <div className="fwrap">
                <img className="ic" src={`${A}/icons/phone.svg`} alt="" />
                <input type="tel" placeholder="643 123 456" />
              </div>
              <small>{t.phoneHelp}</small>
            </div>
            <div className="fg">
              <label>WhatsApp</label>
              <div className="fwrap">
                <img className="ic" src={`${A}/icons/marker.svg`} alt="" />
                <input value={COMPANY.whatsapp} readOnly />
              </div>
              <small>{COMPANY.address}</small>
            </div>
          </div>
          <div className="fg full" style={{marginTop:'1rem'}}>
            <label>{t.message} <span className="req">*</span></label>
            <textarea required rows="4" placeholder={t.messagePh}></textarea>
            <small>{t.messageHelp}</small>
          </div>
          <div className="form-actions">
            <button className="submit-btn" type="submit">{t.send} <img src={`${A}/icons/send.svg`} alt="" /></button>
          </div>
          {sent && (
            <div className="form-success">
              <div className="ok">✓</div>
              <div><h4>{t.okTitle}</h4><p>{t.okText}</p></div>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}

Object.assign(window, { ServicesPage, ContactPage });
