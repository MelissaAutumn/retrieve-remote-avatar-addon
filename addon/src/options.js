import { getProviders } from './providers.js';
import { CACHE_EXPIRY_FOUND } from './defines.js';

const initProviders = () => {
  const activeProviders = getProviders();
  const providerList = document.getElementById('activeProviders');
  providerList.innerHTML = '';

  for (const provider of activeProviders) {
    const {name, url} = provider;
    console.log(provider);
    const opt = document.createElement('option');
    opt.value = url;
    opt.label = name;
    providerList.appendChild(opt);
  }

};

const initAddNewProvider = async () => {
  const newProviderDialog = document.getElementById('newProviderDialog');
  const newProviderName = document.getElementById('newProviderName');
  const newProviderUrl = document.getElementById('newProviderUrl');
  const newProviderExample = document.getElementById('newProviderExample');

  newProviderUrl.addEventListener('keyup', (evt) => {
    const url = newProviderUrl.value;
    const nobodyAtExampleDotOrg = '562b23229c385803090e3a1e8ec8e846ed154fbf0a9027c8065e43f19ea02264';
    const exampleDotOrgDomain = 'example.org';
    newProviderExample.innerHTML = url.replaceAll('$hash', nobodyAtExampleDotOrg).replaceAll('$domain', exampleDotOrgDomain);
  });

  newProviderDialog.show();
  newProviderDialog.close();
}

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