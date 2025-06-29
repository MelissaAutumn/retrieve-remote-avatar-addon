import { ACTIVE_PROVIDERS_KEY, CACHE_EXPIRY_FOUND, GRAVATAR_URL, LIBRAVATAR_URL } from './defines.js';

export const defaultProviders = [
  { uuid: '7a90f5d9-9328-497d-b13b-bd0b7728e593', name: 'Libravatar', url: LIBRAVATAR_URL, ttl: CACHE_EXPIRY_FOUND },
  { uuid: '5b0ce286-c129-4b39-97c9-ee98d10ffd68', name: 'Gravatar', url: GRAVATAR_URL, ttl: CACHE_EXPIRY_FOUND },
];

export const getProviders = async () => {
  const activeProviders = await browser.storage.local.get(ACTIVE_PROVIDERS_KEY);
  if (activeProviders && activeProviders.hasOwnProperty(ACTIVE_PROVIDERS_KEY)) {
    return activeProviders[ACTIVE_PROVIDERS_KEY];
  }

  return structuredClone(defaultProviders);
};

export const resetProviders = async () => {
  await browser.storage.local.remove(ACTIVE_PROVIDERS_KEY);
  return await getProviders();
};

export const saveProviders = async (providers) => {
  await browser.storage.local.remove(ACTIVE_PROVIDERS_KEY);
  await browser.storage.local.set({ [ACTIVE_PROVIDERS_KEY]: providers });
}