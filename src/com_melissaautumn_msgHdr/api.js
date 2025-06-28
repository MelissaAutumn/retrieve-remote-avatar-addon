/**
 * Compute sha256 hash from a given input string
 * Source: https://stackoverflow.com/a/67600346
 * @param window
 * @param input
 * @returns {Promise<string>}
 */
const sha256 = async (window, input) => {
  const textAsBuffer = new window.TextEncoder().encode(input);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", textAsBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
  return hash;
};

/**
 * Navigate the confusing forbidden labrynth to retrieve the avatar's element.
 * @param rootDoc
 * @returns {Element|null}
 */
const getAvatarElement = (rootDoc) => {
  const mail3PaneTabBrowserContext = rootDoc.getElementById('mail3PaneTabBrowser1').browsingContext
  const messageWindow = mail3PaneTabBrowserContext.window.messagePane
  const messageBrowserContext = messageWindow.querySelector('#messageBrowser').browsingContext
  const messageBrowserDoc = messageBrowserContext.window.document

  if (messageBrowserDoc.querySelector('.recipient-avatar.has-avatar')) {
    return null;
  }

  return messageBrowserDoc.querySelector('.recipient-avatar')
}

/**
 * Construct the gravatar url
 * window is required as we don't have a global window object here.
 * @param window
 * @param email
 * @returns {Promise<string>}
 */
const getGravatarURL = async ( window, email )  => {
  // Trim leading and trailing whitespace from
  // an email address and force all characters
  // to lower case
  const address = String( email ).trim().toLowerCase();

  // Create a SHA256 hash of the final string
  const hash = await sha256( window, address );

  const url =  `https://gravatar.com/avatar/${ hash }?d=404`;

  const response = await window.fetch(url);
  if (!response.ok) {
    return null;
  }
  const blob = await response.blob();
  return window.URL.createObjectURL(blob);
}

const getLibravatarURL = async ( window, email )  => {
  // Trim leading and trailing whitespace from
  // an email address and force all characters
  // to lower case
  const address = String( email ).trim().toLowerCase();

  // Create a SHA256 hash of the final string
  const hash = await sha256( window, address );

  const url =  `https://seccdn.libravatar.org/avatar/${ hash }?d=404`;

  const response = await window.fetch(url);
  if (!response.ok) {
    return null;
  }
  const blob = await response.blob();
  return window.URL.createObjectURL(blob);
}

var com_melissaautumn_msgHdr = class extends ExtensionCommon.ExtensionAPI {
  getAPI (context) {
    return {
      com_melissaautumn_msgHdr: {
        async setRemoteAvatar (email) {
          console.log(context.extension);
          const doc = Services.wm.getMostRecentWindow('mail:3pane').document
          //const win = Services.wm.getMostRecentWindow('mail:3pane').window;

          // ...the mail body allows remote images (if you allow it)
          // FIXME: Do remote requests in background.js or somewhere that allows remote fetches
          const win = doc.getElementById('mail3PaneTabBrowser1').browsingContext.window

          const avatar = getAvatarElement(doc);
          // if returned null we failed, or they already have an avatar set.
          if (!avatar) {
            return;
          }

          // Sometimes email contains "my name <my@email.com>", so process that...
          const emailIdx = email.indexOf('<');
          const processedEmail = emailIdx > -1 ? email.substring(emailIdx+1, email.length-1) : email;

          // TODO: Cache the result for a period of time

          // Retrieve libravatar, and if that fails try gravatar
          let url = await getLibravatarURL(win, processedEmail);
          if (!url) {
            url = await getGravatarURL(win, processedEmail);
          }
          // If neither works then return
          if (!url) {
            return;
          }

          // Remove the children
          avatar.innerHTML = '';

          // Create the avatar image element
          const avatarImg = doc.createElement('img')
          avatarImg.src = url;

          avatar.appendChild(avatarImg);
        },
      }
    }
  }
}