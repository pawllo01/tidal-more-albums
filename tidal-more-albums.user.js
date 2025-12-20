// ==UserScript==
// @name         Tidal More Albums
// @namespace    https://github.com/pawllo01/tidal-more-albums
// @version      1.1
// @description  Show all releases in artists' discographies.
// @author       pawllo01
// @match        https://tidal.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tidal.com
// @grant        unsafeWindow
// ==/UserScript==

(function () {
  'use strict';

  const originalFetch = unsafeWindow.fetch;

  unsafeWindow.fetch = function (resource, options) {
    // check if the request URL matches
    if (
      typeof resource === 'string' &&
      resource.includes('/v1/pages/single-module-page/ae223310-a4c2-4568-a770-ffef70344441')
    ) {
      return originalFetch(resource, options).then((response) => {
        // clone the response to read and modify the body
        const clonedResponse = response.clone();

        return clonedResponse
          .json()
          .then((data) => {
            const url = location.href;

            let filter;
            if (url.includes('a4f964ba-b52e-41e8-b25c-06cd70c1efad')) filter = 'ALBUMS';
            else if (url.includes('65f09547-3bba-4764-ad0c-8e105f776fa7')) filter = 'EPSANDSINGLES';
            else return response;

            const artistId = getArtistIdFromUrl(url);
            data.rows[0].modules[0].pagedList.dataApiPath = `artists/${artistId}/albums?filter=${filter}`;
            data.rows[0].modules[0].pagedList.items = [];

            // return the new response with the modified data
            return new Response(JSON.stringify(data), {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            });
          })
          .catch(() => response);
      });
    }

    // if the request doesn't match, just proceed as usual
    return originalFetch(resource, options);
  };

  function getArtistIdFromUrl(url) {
    // e.g. https://tidal.com/artist/7162333
    const pathMatch = url.match(/\/artist\/([^\/\?]+)/);
    if (pathMatch) return pathMatch[1];

    // e.g. https://tidal.com/view/pages/single-module-page/ae223310-a4c2-4568-a770-ffef70344441/4/a4f964ba-b52e-41e8-b25c-06cd70c1efad/2?artistId=7162333
    const params = new URLSearchParams(url.split('?')[1]);
    return params.get('artistId');
  }

  function addCustomLinks() {
    function insertLinks() {
      const artistId = getArtistIdFromUrl(location.href);
      if (!artistId) return;

      const containers = document.querySelectorAll('div._buttonContainer_a150d77');

      containers.forEach((container) => {
        if (container.querySelector('a.custom-link')) return; // skip if custom link was added

        const originalLink = container.querySelector('a[data-test="view-all-link"]');
        const href = originalLink?.href || '';

        if (href.includes('ARTIST_ALBUMS')) {
          container.append(createLink('albums', artistId));
        } else if (href.includes('ARTIST_TOP_SINGLES')) {
          container.append(createLink('singles', artistId));
        }
      });
    }

    function createLink(type, artistId) {
      const DISCOGRAPHY_PAGE_BASE =
        '/view/pages/single-module-page/ae223310-a4c2-4568-a770-ffef70344441/4/';
      const MODULES = {
        albums: 'a4f964ba-b52e-41e8-b25c-06cd70c1efad/2',
        singles: '65f09547-3bba-4764-ad0c-8e105f776fa7/1',
      };

      const href = `${DISCOGRAPHY_PAGE_BASE}${MODULES[type]}?artistId=${artistId}`;

      const customLink = document.createElement('a');
      customLink.className = '_viewAllButton_4b4f90c custom-link';
      customLink.setAttribute('data-test', 'view-all-link');
      customLink.href = href;
      customLink.innerHTML = `<span class="_marketText_1lyag_1 _semibold20_1lyag_246 _text20_1lyag_291">View all</span>`;

      customLink.style.backgroundColor = '#da2013';
      customLink.style.borderRadius = '6px';
      customLink.style.paddingLeft = '6px';

      customLink.addEventListener('click', (e) => {
        e.preventDefault();
        history.pushState({}, '', href);
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      return customLink;
    }

    new MutationObserver(insertLinks).observe(document.body, { childList: true, subtree: true });
  }

  window.addEventListener('load', addCustomLinks);
})();
