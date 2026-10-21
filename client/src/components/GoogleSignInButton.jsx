import { useEffect, useRef, useState } from 'react';
import { authAPI } from '../api';

export default function GoogleSignInButton({ onCredentialReceived, disabled }) {
  const buttonRef = useRef(null);
  const [clientId, setClientId] = useState(import.meta.env.VITE_GOOGLE_CLIENT_ID || '');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    if (!clientId) {
      authAPI
        .config()
        .then(({ data }) => {
          if (active && data.googleClientId) {
            setClientId(data.googleClientId);
          }
        })
        .catch((err) => console.error('Failed to load Google Client ID:', err));
    }
    return () => {
      active = false;
    };
  }, [clientId]);

  useEffect(() => {
    if (!clientId || !buttonRef.current) return;

    let intervalId;
    function initGoogle() {
      if (window.google?.accounts?.id) {
        clearInterval(intervalId);
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential && onCredentialReceived) {
              onCredentialReceived(response.credential);
            }
          },
        });

        buttonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 384,
          shape: 'rectangular',
          text: 'signin_with',
          logo_alignment: 'left',
        });
        setLoaded(true);
      }
    }

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      intervalId = setInterval(initGoogle, 200);
    }

    return () => clearInterval(intervalId);
  }, [clientId, onCredentialReceived]);

  if (!clientId) return null;

  return (
    <div className="w-full flex justify-center my-2">
      <div
        ref={buttonRef}
        className={`w-full flex justify-center min-h-[44px] ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      />
      {!loaded && (
        <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      )}
    </div>
  );
}

