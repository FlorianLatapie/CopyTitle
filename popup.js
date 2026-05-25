document.addEventListener('DOMContentLoaded', async () => {
  const modifyUrl = (url) => {return url}

  const modifyTitle = (title) => {
    return title.replace(/ - Google (Docs|Sheets|Slides)$/, '');
  };

  const escapeHtml = (str) =>
    str.replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));

  const isMacOS = /Mac|iPod|iPhone|iPad/.test(navigator.platform) || navigator.userAgent.includes('Macintosh');
  if (isMacOS) document.querySelector('.header')?.setAttribute('title', 'Raccourci : Option + C');

  const getCurrentTabInfo = async () => {
    try {
      const [tab] = await chrome.tabs.query({active: true,currentWindow: true});
      return {
        url : modifyUrl(tab.url || ''),
        title: modifyTitle(tab.title || tab.url || '')
      };
    } catch {
      return { url: '', title: 'Unable to retrieve the URL information' };
    }
  };


  // Check if the current tab is a valid page ----------
  const tabInfo = await getCurrentTabInfo();
  if (!tabInfo.url) {
    alert("Cette extension n'est pas compatible avec cette page.");
    window.close();
    return;
  }
  const { url, title } = tabInfo;

  // start the actual script -----------------------------------------------------------------

  // Prepare the DOM elements ----------
  const elements = {
    copyUrl: document.getElementById('copyUrl'),
    copyTitle: document.getElementById('copyTitle'),
    copyMarkdown: document.getElementById('copyMarkdown'),
    copyHtml: document.getElementById('copyHtml'),
    copyMarkdownAndHtml: document.getElementById('copyMarkdownAndHtml')
  };

  // Clipboard functions ----------
  const copyTextToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      alert(`Erreur: ${err}`);
    }
  };

  // blink button ----------
  const blinkButton = (buttonElement) => {
    buttonElement.classList.add('blink');
    setTimeout(() => buttonElement.classList.remove('blink'), 300);
  };

  // Save last action for next time
  const saveLastAction = (actionName) => {
    chrome.storage.local.set({ lastAction: actionName });
  };

  // Close the popup after a delay ----------
  const closePopup = (delay = 500) => {
    setTimeout(() => window.close(), delay);
  };

  const markdown = `[${title}](${url})`;
  const html = `<a href="${escapeHtml(url)}">${escapeHtml(title)}</a>`;

  // Actions dictionary
  const actions = {
    copyUrl: async (isDefault = false) => {
      await copyTextToClipboard(url);
      saveLastAction('copyUrl');
      if (!isDefault) closePopup();
    },

    copyTitle: async (isDefault = false) => {
      await copyTextToClipboard(title);
      saveLastAction('copyTitle');
      if (!isDefault) closePopup();
    },

    copyMarkdown: async (isDefault = false) => {
      await copyTextToClipboard(markdown);
      saveLastAction('copyMarkdown');
      if (!isDefault) closePopup();
    },

    copyHtml: async (isDefault = false) => {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([title], {type: 'text/plain'}),
          'text/html': new Blob([html], {type: 'text/html'})
        })
      ]);
      saveLastAction('copyHtml');
      if (!isDefault) closePopup();
    },

    copyMarkdownAndHtml: async (isDefault = false) => {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([markdown], {type: 'text/plain'}),
          'text/html': new Blob([html], {type: 'text/html'})
        })
      ]);
      saveLastAction('copyMarkdownAndHtml');
      if (!isDefault) closePopup();
    }
  };

  // Keyboard shortcuts ----------
  document.addEventListener('keydown', async (event) => {
    const keyActions = {
      u: 'copyUrl',
      t: 'copyTitle',
      m: 'copyMarkdown',
      h: 'copyHtml',
      a: 'copyMarkdownAndHtml'
    };

    const action = keyActions[event.key.toLowerCase()];

    if (!action) {
      return;
    }

    blinkButton(elements[action]);

    await actions[action](false);
  });

  // Set up button event listeners ----------
  Object.keys(actions).forEach(action => {
    elements[action].addEventListener('click', async () => {
      await actions[action](false);
    });
  });

  // Execute default action based on last choice or default to copyHtml
  try {
    const result = await chrome.storage.local.get('lastAction');

    const lastAction =
      result.lastAction || 'copyMarkdownAndHtml';

    blinkButton(elements[lastAction]);
    await actions[lastAction](true);
  } catch (err) {
    console.error(`Error: ${err}`);
    await actions.copyMarkdownAndHtml(true);
  }
});