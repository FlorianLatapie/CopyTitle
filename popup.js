document.addEventListener('DOMContentLoaded', async () => {
  const modifyUrl = (url) => {
    return url
  }

  const modifyTitle = (title) => {
    return title.replace(/ - Google (Docs|Sheets|Slides)$/, '')
  } 

  // Get current tab info (url, title) ----------
  /**
   * Get the current tab's URL and title.
   * @returns {Promise<{url: string, title: string}>} - The URL and title of the current tab.
   */
  const getCurrentTabInfo = async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      const url = modifyUrl(tab.url);
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.title
      });
      const title = modifyTitle(results[0].result || decodeURIComponent(url.replace(/^https?:\/\//, '')));
      return { url, title };
    } catch (err) {
      return { url: '', title: '' };
    }
  };

  // Check if the current tab is a valid page ----------

  if ((await getCurrentTabInfo()).url === '') {
    alert("Cette extension n'est pas compatible avec cette page.");
    window.close();
    return;
  }

  // start the actual script -----------------------------------------------------------------

  // Prepare the DOM elements ----------
  const elements = {
    copyUrl: document.getElementById('copyUrl'),
    copyTitle: document.getElementById('copyTitle'),
    copyMarkdown: document.getElementById('copyMarkdown'),
    copyHtml: document.getElementById('copyHtml'),
    copyBoth: document.getElementById('copyBoth')
  };

  // Clipboard functions ----------
  /**
   * Copy text to the clipboard.
   * @param {string} text - The text to copy.
   * @returns {Promise<void>} - A promise that resolves when the text is copied.
   */
  const copyTextToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      alert(`Erreur: ${err}`);
    }
  };

  // blink button ----------
  /**
   * Blink the button to indicate an action.
   * @param {HTMLElement} buttonElement - The button element to blink.
   */
  const blinkButton = (buttonElement) => {
    buttonElement.classList.add('blink');
    setTimeout(() => buttonElement.classList.remove('blink'), 300);
  };

  // Save last action for next time
  /**
   * Save the last action performed to local storage.
   * @param {string} actionName - The name of the action to save.
   */
  const saveLastAction = (actionName) => {
    chrome.storage.local.set({ lastAction: actionName });
  };

  // Close the popup after a delay ----------
  /**
   * Close the popup after a delay.
   */
  const closePopup = () => {
    setTimeout(() => window.close(), 500);
  }

  // Actions dictionary
  const actions = {
    copyUrl: async (isDefault = false) => {
      const { url } = await getCurrentTabInfo();
      await copyTextToClipboard(url);
      saveLastAction('copyUrl');
      if (!isDefault) closePopup();
    },
    copyTitle: async (isDefault = false) => {
      const { title } = await getCurrentTabInfo();
      await copyTextToClipboard(title);
      saveLastAction('copyTitle');
      if (!isDefault) closePopup();
    },
    copyMarkdown: async (isDefault = false) => {
      const { url, title } = await getCurrentTabInfo();
      await copyTextToClipboard(`[${title}](${url})`);
      saveLastAction('copyMarkdown');
      if (!isDefault) closePopup();
    },
    copyHtml: async (isDefault = false) => {
      const { url, title } = await getCurrentTabInfo();
      const html = `<a href="${url}">${title}</a>`;
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([title], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' })
        })
      ]);
      saveLastAction('copyHtml');
      if (!isDefault) closePopup();
    },
    copyBoth: async (isDefault = false) => {
      const { url, title } = await getCurrentTabInfo();
      const markdown = `[${title}](${url})`;
      const html = `<a href="${url}">${title}</a>`;
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([markdown], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' })
        })
      ]);
      saveLastAction('copyBoth');
      if (!isDefault) closePopup();
    }
  };

  // Keyboard shortcuts ----------
  document.addEventListener('keydown', async (event) => {
    const keyActions = {
      'u': 'copyUrl',
      't': 'copyTitle',
      'm': 'copyMarkdown',
      'h': 'copyHtml',
      'a': 'copyBoth'
    };

    if (keyActions[event.key]) {
      const button = elements[keyActions[event.key]];
      blinkButton(button);
      await actions[keyActions[event.key]](false);
    }
  });

  // Set up button event listeners ----------
  Object.keys(actions).forEach(action => {
    elements[action].addEventListener('click', () => actions[action](false));
  });

  // Execute default action based on last choice or default to copyHtml
  try {
    const result = await chrome.storage.local.get('lastAction');
    const lastAction = result.lastAction || 'copyBoth'; // Default to copyBoth if no previous action

    const button = elements[lastAction];
    blinkButton(button);

    actions[lastAction](true);
  } catch (err) {
    alert(`Erreur: ${err}`);
    const lastAction = 'copyBoth'; // Default to copyBoth if no previous action
    actions[lastAction](true);
  }
});