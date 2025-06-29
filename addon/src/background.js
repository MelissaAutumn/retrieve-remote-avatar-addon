import { CACHED_NOT_FOUND, GRAVATAR_URL, LIBRAVATAR_URL } from './defines.js';

/**
 * Compute sha256 hash from a given input string
 * Source: https://stackoverflow.com/a/67600346
 * @param input
 * @returns {Promise<string>}
 */
const sha256 = async (input) => {
  const textAsBuffer = new window.TextEncoder().encode(input);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', textAsBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray
    .map((item) => item.toString(16).padStart(2, '0'))
    .join('');
  return hash;
};

const hashEmail = async (email) => {
  // Sometimes email contains "my name <my@email.com>", so process that...
  const emailIdx = email.indexOf('<');
  const processedEmail = emailIdx > -1 ? email.substring(emailIdx + 1, email.length - 1) : email;
  const address = String(processedEmail).trim().toLowerCase();
  return await sha256(address);
};

const getRemoteURL = async (email, rootUrl) => {
  const hashedEmail = await hashEmail(email);
  const url = rootUrl.replace('$hash', hashedEmail);
  const response = await window.fetch(url);
  if (!response.ok) {
    return null;
  }

  const blob = await response.blob();
  // .bytes is available in firefox, so should be okay here.
  const bytes = await blob.bytes();
  const base64String = btoa(String.fromCharCode(...bytes));
  return `data:image/png;base64,${base64String}`;
};

const getCache = async (email) => {
  const key = `imgv1_${await hashEmail(email)}`;
  const item = await browser.storage.local.get(key);
  if (!item || !item.hasOwnProperty(key)) {
    return null;
  }
  const { expiresAt, data } = item[key];

  if (expiresAt <= Date.now()) {
    await browser.storage.local.remove(key);
    return null;
  }
  return data;
};

const setCache = async (email, dataURL, expiresAtDays = 3) => {
  const key = `imgv1_${await hashEmail(email)}`;
  const expiresAt = new Date(Date.now());
  expiresAt.setDate(expiresAt.getDate() + expiresAtDays);
  const item = {
    expiresAt: expiresAt.getTime(),
    data: dataURL
  };
  await browser.storage.local.set({ [key]: item });
};

const getAvatarURL = async (email) => {
  try {
    const cachedUrl = await getCache(email);
    if (cachedUrl) {
      return cachedUrl === CACHED_NOT_FOUND ? null : cachedUrl;
    }
  } catch (e) {
    console.warn('Error retrieving cached avatar', e);
  }

  const url = await getRemoteURL(email, LIBRAVATAR_URL) ?? await getRemoteURL(email, GRAVATAR_URL);
  try {
    await setCache(email, url === null ? CACHED_NOT_FOUND : url, url === null ? 1 : 3);
  } catch (e) {
    console.warn('Error setting cached avatar', e);
  }
  return url;
};

/**
 * command handler: handles the commands received from the content script
 */
const doHandleCommand = async (message, sender) => {
  const {
    tab: { id: tabId },
  } = sender;

  const messageHeader = await browser.messageDisplay.getDisplayedMessage(tabId);
  const url = await getAvatarURL(messageHeader.author);
  if (!url) {
    return;
  }
  await browser.com_melissaautumn_msgHdr.setRemoteAvatar(url);
};

/**
 * Add a handler for communication with other parts of the extension,
 * like our messageDisplayScript.
 *
 * 👉 There should be only one handler in the background script
 *    for all incoming messages
 *
 * 👉 Handle the received message by filtering for a distinct property and select
 *    the appropriate handler
 */
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.hasOwnProperty('command')) {
    // If we have a command, return a promise from the command handler.
    return doHandleCommand(message, sender);
  }
  return false;
});

/**
 * Tell Thunderbird that it should load our message-content-script.js file
 * whenever a message is displayed
 */
messenger.messageDisplayScripts.register({
  js: [{ file: '/src/on_message_display.js' }],
});

