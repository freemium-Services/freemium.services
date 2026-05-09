(function() {
  function setCookie(name, value, days) {
    let expires = "";
    if (days) {
      let date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
  }

  function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('newsletter-modal');
    const closeBtn = document.getElementById('newsletter-close');
    const subscribeBtn = document.getElementById('newsletter-subscribe');
    const emailInput = document.getElementById('newsletter-email');

    if (!modal) return;

    const hasSeenNewsletter = getCookie('newsletter_seen');
    const hasSubscribed = getCookie('newsletter_subscribed');

    // Auto-show after 10 seconds if they haven't seen it or subscribed
    if (!hasSeenNewsletter && !hasSubscribed) {
      setTimeout(() => {
        modal.classList.add('active');
        setCookie('newsletter_seen', 'true', 30); // don't auto-show again for 30 days
      }, 10000);
    }

    // Global helper for manual triggers
    window.openNewsletter = function() {
      modal.classList.add('active');
    };

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        setCookie('newsletter_seen', 'true', 30);
      });
    }

    if (subscribeBtn) {
      subscribeBtn.addEventListener('click', () => {
        const email = emailInput ? emailInput.value : '';
        if (email && email.includes('@')) {
          alert('Thanks for subscribing! (This is a demo)');
          modal.classList.remove('active');
          setCookie('newsletter_subscribed', 'true', 365); // Subscribe cookie lasts 1 year
        } else {
          alert('Please enter a valid email address.');
        }
      });
    }

    // Allow closing by clicking outside the modal content
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        setCookie('newsletter_seen', 'true', 30);
      }
    });
  });
})();
