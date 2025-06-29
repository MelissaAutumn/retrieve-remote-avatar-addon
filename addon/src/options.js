import { getProviders, resetProviders, saveProviders } from './providers.js';
import { CACHE_EXPIRY_FOUND } from './defines.js';

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

const initAddNewProvider = async () => {
  const newProviderDialog = document.getElementById('newProviderDialog');
  const newProviderName = document.getElementById('newProviderName');
  const newProviderUrl = document.getElementById('newProviderUrl');
  const newProviderExample = document.getElementById('newProviderExample');
  const newProviderAdd = document.getElementById('newProviderAdd');
  const newProviderCancel = document.getElementById('newProviderCancel');

  newProviderCancel.addEventListener('click', () => {
    newProviderDialog.close();
  });

  newProviderAdd.addEventListener('click', async () => {
    const name = newProviderName.value;
    const url = newProviderUrl.value;

    if (!name || !url) {
      return;
    }

    const activeProviders = await getProviders();
    const provider = {
      uuid: crypto.randomUUID(), name, url
    };
    activeProviders.push(provider);
    await saveProviders(activeProviders);
    await initProviderList();
    newProviderDialog.close();
  });

  newProviderUrl.addEventListener('keyup', (evt) => {
    const url = newProviderUrl.value;
    const nobodyAtExampleDotOrg = '562b23229c385803090e3a1e8ec8e846ed154fbf0a9027c8065e43f19ea02264';
    const exampleDotOrgDomain = 'example.org';
    newProviderExample.innerHTML = url.replaceAll('$hash', nobodyAtExampleDotOrg).replaceAll('$domain', exampleDotOrgDomain);
  });
};

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