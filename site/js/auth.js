const signInContainers = [...document.querySelectorAll('.google-sign-in')];

const announceAuthMessage = (message) => {
  let status = document.querySelector('.google-auth-status');
  if (!status) {
    status = document.createElement('p');
    status.className = 'google-auth-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    document.querySelector('.header').after(status);
  }
  status.textContent = message;
  status.hidden = !message;
};

const loadGoogleIdentityServices = () => new Promise((resolve, reject) => {
  if (window.google?.accounts?.id) {
    resolve();
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.onload = () => window.google?.accounts?.id
    ? resolve()
    : reject(new Error('Google Identity Services did not initialize.'));
  script.onerror = () => reject(new Error('Google Identity Services could not be loaded.'));
  document.head.append(script);
});

const renderSignedInUser = (user) => {
  signInContainers.forEach((container) => {
    container.replaceChildren();
    container.classList.add('is-authenticated');

    const name = document.createElement('span');
    name.className = 'signed-in-name';
    name.textContent = user.name;

    const signOutButton = document.createElement('button');
    signOutButton.className = 'sign-out-button';
    signOutButton.type = 'button';
    signOutButton.textContent = 'Sign out';
    signOutButton.addEventListener('click', async () => {
      signOutButton.disabled = true;
      try {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        if (!response.ok) throw new Error('Sign out failed.');
        window.location.reload();
      } catch {
        signOutButton.disabled = false;
        announceAuthMessage('登出失敗，請稍後再試。');
      }
    });

    container.append(name, signOutButton);
  });
};

const handleGoogleCredential = async ({ credential }) => {
  if (!credential) {
    announceAuthMessage('Google 沒有回傳登入憑證，請再試一次。');
    return;
  }

  announceAuthMessage('正在登入…');
  try {
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || 'Google 登入失敗。');

    announceAuthMessage('');
    renderSignedInUser(result.user);
  } catch (error) {
    announceAuthMessage(error.message || 'Google 登入失敗，請稍後再試。');
  }
};

const markSignInUnavailable = (message) => {
  signInContainers.forEach((container) => {
    container.textContent = message;
    container.classList.add('is-unavailable');
    container.setAttribute('aria-disabled', 'true');
    container.title = message;
  });
};

const initializeGoogleSignIn = async () => {
  if (!signInContainers.length) return;

  try {
    const configResponse = await fetch('/api/config');
    if (!configResponse.ok) throw new Error('無法讀取登入設定。');
    const { googleClientId } = await configResponse.json();

    const sessionResponse = await fetch('/api/auth/me');
    if (sessionResponse.ok) {
      const session = await sessionResponse.json();
      if (session.authenticated) {
        renderSignedInUser(session.user);
        return;
      }
    }

    if (!googleClientId) {
      markSignInUnavailable('Google 登入尚未設定');
      return;
    }

    await loadGoogleIdentityServices();
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential
    });

    signInContainers.forEach((container) => {
      window.google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'small',
        text: 'continue_with',
        shape: 'rectangular',
        width: 190
      });
    });
  } catch (error) {
    markSignInUnavailable('Google 登入目前無法使用');
    announceAuthMessage(error.message || '無法連線至登入服務。');
  }
};

initializeGoogleSignIn();