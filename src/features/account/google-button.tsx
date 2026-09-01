import { useEffect, useRef } from "react";

type CredentialResponse = { credential: string };
type GoogleAccounts = {
  id: {
    initialize: (options: {
      client_id: string;
      callback: (response: CredentialResponse) => void;
    }) => void;
    renderButton: (parent: HTMLElement, options: Record<string, string>) => void;
  };
};

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

export function GoogleButton({ onCredential }: { onCredential: (credential: string) => void }) {
  const target = useRef<HTMLDivElement>(null);
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  useEffect(() => {
    if (!clientId) return;
    const render = () => {
      if (!window.google || !target.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (value) => onCredential(value.credential),
      });
      window.google.accounts.id.renderButton(target.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        locale: "it",
      });
    };
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-identity="true"]'
    );
    if (existing) {
      render();
      existing.addEventListener("load", render, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.dataset.googleIdentity = "true";
    script.addEventListener("load", render, { once: true });
    document.head.appendChild(script);
  }, [clientId, onCredential]);
  if (!clientId) return null;
  return <div ref={target} aria-label="Continua con Google" />;
}
