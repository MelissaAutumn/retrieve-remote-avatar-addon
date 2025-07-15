/**
 * The main script, this retrieves the remote url, hashes emails, and get/sets img cache.
 * This should be split up into various js files, but it works for now!
 */
import {
  CACHE_EXPIRY_FOUND,
  CACHE_EXPIRY_NOT_FOUND,
  CACHED_NOT_FOUND,
} from './defines.js';
import { getProviders } from './providers.js';

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

const normalizeEmail = (email) => {
  // Sometimes email contains "my name <my@email.com>", so process that...
  const emailIdx = email.indexOf('<');
  const processedEmail = emailIdx > -1 ? email.substring(emailIdx + 1, email.length - 1) : email;
  return String(processedEmail).trim().toLowerCase();
}

const hashEmail = async (email) => {
  return await sha256(normalizeEmail(email));
};

const emailDomain = async (email) => {
  const address = normalizeEmail(email);
  return address.slice(address.indexOf('@')+1);
};


const getRemoteURL = async (email, rootUrl) => {
  const hashedEmail = await hashEmail(email);
  const domain = await emailDomain(email);
  const url = rootUrl.replace('$hash', hashedEmail).replace('$domain', domain);
  const response = await window.fetch(url);
  if (!response.ok) {
    return null;
  }

  const mediaType = response.headers.get('content-type') ?? 'image/png';
  const blob = await response.blob();
  // .bytes is available in firefox, so should be okay here.
  const bytes = await blob.bytes();
  const base64String = btoa(String.fromCharCode(...bytes));
  return `data:${mediaType};base64,${base64String}`;
};

const getCache = async (email) => {
  const key = `imgv1_${await hashEmail(email)}`;
  const item = await browser.storage.local.get(key);
  if (!item || !item.hasOwnProperty(key)) {
    return null;
  }
  const { expiresAt, data } = item[key];

  if (expiresAt > -1 && expiresAt <= Date.now()) {
    await browser.storage.local.remove(key);
    return null;
  }
  return data;
};

const setCache = async (email, dataURL, expiresAtDays = 3) => {
  const key = `imgv1_${await hashEmail(email)}`;

  const expiresAt = new Date(Date.now());
  expiresAt.setDate(expiresAt.getDate() + expiresAtDays);
  const timestamp = expiresAtDays > -1 ? expiresAt.getTime() : -1;

  const item = {
    expiresAt: timestamp,
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

  let url = null;
  let ttl = null;
  const activeProviders = await getProviders();
  for (const activeProvider of activeProviders) {
    url = await getRemoteURL(email, activeProvider.url);
    if (url) {
      ttl = activeProvider.ttl ?? CACHE_EXPIRY_FOUND;
      break;
    }
  }

  try {
    await setCache(email, url === null ? CACHED_NOT_FOUND : url, url === null ? CACHE_EXPIRY_NOT_FOUND : ttl);
  } catch (e) {
    console.warn('Error setting cached avatar', e);
  }
  return url;
};

/**
 * Retrieve the tabid, retrieve the remote avatar and pass it to our exp api to place it in the message header.
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
  await browser.com_melissaautumn_msgHdr.setRemoteAvatar(tabId, url);
};

/**
 * Handle incoming event (there's only one) from on_message_display
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

