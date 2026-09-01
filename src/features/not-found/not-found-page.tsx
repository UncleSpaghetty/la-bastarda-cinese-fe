import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

export function NotFoundPage() {
  return <section className="not-found-page page-container" aria-labelledby="not-found-title">
    <div className="not-found-mark" aria-hidden="true"><img src="/brand/logo-mark.svg" alt="" width="96" height="96" /></div>
    <p className="eyebrow">ERRORE 404</p>
    <h1 id="not-found-title">Questa carta non esiste.</h1>
    <p>La pagina che cercavi è stata bandita dal tavolo. Qui non c’è niente da raccogliere.</p>
    <Link className="button button-primary" to="/"><ArrowLeft size={18} aria-hidden="true" /> Torna alla homepage</Link>
  </section>;
}
