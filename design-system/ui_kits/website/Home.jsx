// Hero — full-bleed photo, brand mark, h1, address, CTA
function Hero({ lang, go }) {
  const t = L[lang];
  return (
    <section className="hero">
      <img className="hero__bg" src={`${A}/images/jokin.webp`} alt="Jokin Ramos" />
      <div className="hero__scrim" />
      <div className="hero__inner">
        <img className="hero__mark" src={`${A}/logos/main-logo-vertical.svg`} alt="Laguntza Fisioterapia" />
        <h1 className="hero__h1">{t.hero.h1}</h1>
        <p className="hero__sub">{t.hero.sub}</p>
        <a className="hero__addr" href="https://maps.app.goo.gl/ct7ZQvDpocAY3V5ZA" target="_blank" rel="noreferrer">
          <img src={`${A}/icons/marker.svg`} alt="" />{COMPANY.address}
        </a>
        <button className="hero__cta" onClick={() => go('contact')}>{t.cta}</button>
      </div>
      <div className="hero__scrollcue">
        <img src={`${A}/icons/keep-scrolling.svg`} alt="" />
        <span>{t.hero.more}</span>
      </div>
    </section>
  );
}

// Scroll-reveal wrapper — inline-style driven, with in-view + timeout fallbacks
function Reveal({ children, className = '' }) {
  const ref = React.useRef(null);
  const [seen, setSeen] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Already in/above the viewport at mount → show right away.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) { setSeen(true); return; }
    const io = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
    io.observe(el);
    // Safety net: never let content stay hidden.
    const t = setTimeout(() => setSeen(true), 2500);
    return () => { io.disconnect(); clearTimeout(t); };
  }, []);
  const style = {
    opacity: seen ? 1 : 0,
    transform: seen ? 'none' : 'translateY(32px)',
    transition: 'opacity .9s cubic-bezier(.16,1,.3,1), transform .9s cubic-bezier(.16,1,.3,1)',
  };
  return <div ref={ref} style={style} className={className}>{children}</div>;
}

// Editorial dark homepage content stream
function HomeContent({ lang, go }) {
  const t = L[lang];
  return (
    <div className="home-dark">
      <Reveal className="s-intro"><div className="container narrow">
        <div className="s-intro__inner">
          <div className="s-intro__accent" />
          <p className="s-intro__text">{t.intro}</p>
        </div>
      </div></Reveal>

      <Reveal className="s-about"><div className="container">
        <div className="s-about__layout">
          <div className="s-about__frame"><img src={`${A}/images/jokin.webp`} alt="Jokin Ramos" /></div>
          <div>
            <span className="eyebrow">{t.about.label}</span>
            <h2 className="h-heading">{t.about.title}</h2>
            <p className="h-body">{t.about.text}</p>
            <a className="h-link" onClick={() => go('services')}>{t.about.cta} <span>→</span></a>
          </div>
        </div>
      </div></Reveal>

      <Reveal className="s-svc"><div className="container narrow">
        <div className="s-svc__rule" />
        <div className="s-svc__split">
          <h2 className="h-heading grad">{t.svcOverview.title}</h2>
          <p className="h-body">{t.svcOverview.text}</p>
        </div>
      </div></Reveal>

      <Reveal className="s-tags"><div className="container narrow">
        <h2 className="h-heading">{t.specialtiesTitle}</h2>
        <div className="tags">
          {t.specialties.map((s, i) => <span key={i} className={'tag' + (i % 2 ? ' warm' : '')}>{s}</span>)}
        </div>
      </div></Reveal>

      <Reveal className="s-why"><div className="container narrow">
        <h2 className="h-heading s-why__h">{t.whyTitle}</h2>
        <div className="bento">
          {t.why.map((w, i) => (
            <article key={i} className={'bcard' + (i === 0 ? ' b-hero' : '') + (i === 3 ? ' b-wide' : '')}>
              <h3>{w.t}</h3><p>{w.d}</p>
            </article>
          ))}
        </div>
      </div></Reveal>

      <Reveal className="s-cta"><div className="container narrow">
        <div className="cta-card">
          <h2 className="h-heading grad">{t.ctaCard.title}</h2>
          <p className="h-body" style={{maxWidth: '52ch', margin: '0 auto'}}>{t.ctaCard.text}</p>
          <button className="cta-card__btn" onClick={() => go('contact')}>{t.cta}</button>
        </div>
      </div></Reveal>
    </div>
  );
}

Object.assign(window, { Hero, Reveal, HomeContent });
