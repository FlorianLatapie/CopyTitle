document.addEventListener('DOMContentLoaded', function() {
    const copyUrlBtn = document.getElementById('copyUrl');
    const copyTitleBtn = document.getElementById('copyTitle');
    const copyMarkdownBtn = document.getElementById('copyMarkdown');
    const statusDiv = document.getElementById('status');
  
    function showStatus(message) {
      statusDiv.textContent = message;
      setTimeout(function() {
        statusDiv.textContent = '';
      }, 2000);
    }
  
    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(function() {
        showStatus('Copié !');
      }, function(err) {
        showStatus('Erreur: ' + err);
      });
    }
  
    // Option 1: Copier l'URL
    copyUrlBtn.addEventListener('click', function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        copyToClipboard(tabs[0].url);
      });
    });
  
    // Option 2: Copier le titre
    copyTitleBtn.addEventListener('click', function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => document.title
        }).then(results => {
          if (results && results[0]) {
            copyToClipboard(results[0].result);
          }
        });
      });
    });
  
    // Option 3: Copier au format Markdown
    copyMarkdownBtn.addEventListener('click', function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const url = tabs[0].url;
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => document.title
        }).then(results => {
          if (results && results[0]) {
            const title = results[0].result;
            const markdown = `[${title}](${url})`;
            copyToClipboard(markdown);
          }
        });
      });
    });
  });