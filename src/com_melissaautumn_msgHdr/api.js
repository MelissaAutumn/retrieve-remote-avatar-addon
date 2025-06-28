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

  // Grab the actual image URL
  return `https://gravatar.com/avatar/${ hash }`;
}

var com_melissaautumn_msgHdr = class extends ExtensionCommon.ExtensionAPI {
  getAPI (context) {
    return {
      com_melissaautumn_msgHdr: {
        async setRemoteAvatar (email) {
          const doc = Services.wm.getMostRecentWindow('mail:3pane').document
          const win = Services.wm.getMostRecentWindow('mail:3pane').window;

          const avatar = getAvatarElement(doc);
          // if returned null we failed, or they already have an avatar set.
          if (!avatar) {
            return;
          }

          // Remove the children
          avatar.innerHTML = '';

          // Create the avatar image element
          const avatarImg = doc.createElement('img')
          // FIXME: This causes a CSP error but for some reason Thunderbird still loads it?
          avatarImg.src = await getGravatarURL(win, email);

          avatar.appendChild(avatarImg);
        },
      }
    }
  }
}