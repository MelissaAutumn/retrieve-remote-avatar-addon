/**
 * A messy options script. Contains all the logic for the addon's preferences page.
 */
import { getProviders, resetProviders, saveProviders } from './providers.js';
import { CACHE_EXPIRY_FOUND } from './defines.js';

/**
 * Initialize the provider related options including setting event handlers for buttons
 * @returns {Promise<void>}
 */
const initProviders = async () => {
  const providerList = document.getElementById('activeProviders');
  const providerAdd = document.getElementById('providerAdd');
  const providerRemove = document.getElementById('providerRemove');
  const providerRestoreDefaults = document.getElementById('providerRestoreDefaults');
  const providerMoveUp = document.getElementById('providerMoveUp');
  const providerMoveDown = document.getElementById('providerMoveDown');

  const getProviderIndex = async () => {
    const selectedUUID = providerList.value;

    if (!selectedUUID) {
      return -1;
    }

    let idx = -1;
    for (let i = 0; i < providerList.options.length; i++) {
      if (selectedUUID === providerList.options[i].value) {
        idx = i;
        break;
      }
    }

    return idx;
  };

  providerMoveUp.addEventListener('click', async () => {
    const activeProviders = await getProviders();
    const idx = await getProviderIndex();

    // Ignore not-founds and items already at the top of the list
    if (idx <= 0) {
      return;
    }

    const reOrderedProviders = structuredClone(activeProviders);
    reOrderedProviders.splice(idx, 1);
    reOrderedProviders.splice(idx - 1, 0, activeProviders[idx]);
    await saveProviders(reOrderedProviders);
    await initProviderList();
  });

  providerMoveDown.addEventListener('click', async () => {
    const activeProviders = await getProviders();
    const idx = await getProviderIndex();

    // Ignore not-founds and items already at the bottom of the list
    if (idx >= providerList.options.length - 1 || idx === -1) {
      return;
    }

    const reOrderedProviders = structuredClone(activeProviders);
    reOrderedProviders.splice(idx, 1);
    reOrderedProviders.splice(idx + 1, 0, activeProviders[idx]);
    await saveProviders(reOrderedProviders);
    await initProviderList();
  });

  providerAdd.addEventListener('click', () => {
    const newProviderDialog = document.getElementById('newProviderDialog');
    newProviderDialog.showModal();
  });

  providerRemove.addEventListener('click', async () => {
    const activeProviders = await getProviders();
    const idx = await getProviderIndex();
    const updatedProviders = structuredClone(activeProviders);
    updatedProviders.splice(idx, 1);
    await saveProviders(updatedProviders);
    await initProviderList();
  });

  providerRestoreDefaults.addEventListener('click', async () => {
    await resetProviders();
    await initProviderList();
  });

  await initProviderList();
};

/**
 * Clear and remake the list of providers for the select element.
 * @returns {Promise<void>}
 */
const initProviderList = async () => {
  const activeProviders = await getProviders();
  const providerList = document.getElementById('activeProviders');
  providerList.innerHTML = '';

  for (const provider of activeProviders) {
    const { uuid, name } = provider;
    const opt = document.createElement('option');
    opt.value = uuid;
    opt.label = name;
    providerList.appendChild(opt);
  }
};

/**
 * Init the new provider dialog
 * @returns {Promise<void>}
 */
const initAddNewProvider = async () => {
  const newProviderDialog = document.getElementById('newProviderDialog');
  const newProviderName = document.getElementById('newProviderName');
  const newProviderUrl = document.getElementById('newProviderUrl');
  const newProviderCache = document.getElementById('newProviderCache');
  const newProviderExample = document.getElementById('newProviderExample');
  const newProviderAdd = document.getElementById('newProviderAdd');
  const newProviderCancel = document.getElementById('newProviderCancel');

  // Set some default fields
  newProviderCache.value = CACHE_EXPIRY_FOUND;

  newProviderCancel.addEventListener('click', () => {
    newProviderDialog.close();
  });

  newProviderAdd.addEventListener('click', async () => {
    const name = newProviderName.value;
    const url = newProviderUrl.value;
    const ttl = newProviderCache.value;

    if (!name || !url || ttl === '') {
      alert('You must enter in all fields to add a new provider.');
      return;
    }

    const activeProviders = await getProviders();
    const provider = {
      uuid: crypto.randomUUID(), name, url, ttl
    };
    activeProviders.push(provider);
    await saveProviders(activeProviders);
    await initProviderList();
    newProviderDialog.close();

    // Reset the fields
    newProviderName.value = '';
    newProviderUrl.value = '';
    newProviderCache.value = CACHE_EXPIRY_FOUND;
  });

  newProviderUrl.addEventListener('keyup', (evt) => {
    const url = newProviderUrl.value;
    const nobodyAtExampleDotOrg = '562b23229c385803090e3a1e8ec8e846ed154fbf0a9027c8065e43f19ea02264';
    const exampleDotOrgDomain = 'example.org';
    newProviderExample.innerHTML = url.replaceAll('$hash', nobodyAtExampleDotOrg).replaceAll('$domain', exampleDotOrgDomain);
  });
};

/**
 * Initialize the cache stats section of the cache options
 * @returns {Promise<void>}
 */
const initCacheStats = async () => {
  const cacheExpiryPeriod = document.getElementById('cacheExpiryPeriod');
  const cacheStatsTotal = document.getElementById('cacheStatsTotal');
  // Not supported in local storage :(
  const cacheStatsSize = document.getElementById('cacheStatsSize');
  const allCacheItems = await browser.storage.local.get();
  const imagesInCache = Object.keys(allCacheItems).filter((val) => val.startsWith('imgv1_')).length;
  cacheExpiryPeriod.innerHTML = String(CACHE_EXPIRY_FOUND);
  cacheStatsTotal.innerHTML = String(imagesInCache);
};

/**
 * Initialize the cache options including event handlers for the clear cache button
 * @returns {Promise<void>}
 */
const initCache = async () => {
  await initCacheStats();
  const cacheClearBtn = document.getElementById('cacheClear');

  cacheClearBtn.addEventListener('click', async () => {
    const allCacheItems = await browser.storage.local.get();
    const images = Object.keys(allCacheItems).filter((val) => val.startsWith('imgv1_'));
    await browser.storage.local.remove(images);

    // Refresh stats
    await initCacheStats();
  });
};

initProviders();
initAddNewProvider();
initCache();