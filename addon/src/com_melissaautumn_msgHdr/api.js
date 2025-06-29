/**
 * Navigate the confusing forbidden labrynth to retrieve the avatar's element.
 * @param rootDoc
 * @returns {Element|null}
 */
const getAvatarElement = (rootDoc) => {
  const messageBrowserContext = rootDoc.querySelector('#messageBrowser').browsingContext;
  const messageBrowserDoc = messageBrowserContext.window.document;
  if (messageBrowserDoc.querySelector('.recipient-avatar.has-avatar')) {
    return null;
  }

  return messageBrowserDoc.querySelector('.recipient-avatar');
};

var com_melissaautumn_msgHdr = class extends ExtensionCommon.ExtensionAPI {
  getAPI (context) {
    return {
      com_melissaautumn_msgHdr: {
        async setRemoteAvatar (tabId, url) {
          let tabObject = context.extension.tabManager.get(tabId);
          // Get the requested tab's document...it's a process.
          const doc = tabObject.nativeTab.chromeBrowser.browsingContext.window.document;

          const avatar = getAvatarElement(doc);
          // if returned null we failed, or they already have an avatar set.
          if (!avatar || !url) {
            return;
          }

          // Remove the children
          avatar.innerHTML = '';

          // Create the avatar image element
          const avatarImg = doc.createElement('img');
          avatarImg.src = url;

          avatar.appendChild(avatarImg);
        },
      }
    };
  }
};