import { GRAVATAR_URL, LIBRAVATAR_URL } from './defines.js';

export const defaultProviders = [
  { name: 'Libravatar', url: LIBRAVATAR_URL },
  { name: 'Gravatar', url: GRAVATAR_URL },
];

export const getProviders = () => {
  const key = 'activeProvidersv1';
  const activeProviders = browser.storage.local.get(key);
  if (activeProviders && activeProviders.hasOwnProperty(key)) {
    return activeProviders[key];
  }

  return structuredClone(defaultProviders);
};