// ==UserScript==
// @name         Tidal More Albums
// @namespace    https://github.com/pawllo01/tidal-more-albums
// @version      1.0
// @description  Show all releases in artists' discographies.
// @author       pawllo01
// @match        *://listen.tidal.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tidal.com
// @grant        unsafeWindow
// ==/UserScript==

(function () {
  'use strict';

  // store the original fetch function
  const originalFetch = unsafeWindow.fetch;

  // override the fetch function
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch
  unsafeWindow.fetch = function (resource, options) {
    // check if the request URL matches
    if (
      typeof resource === 'string' &&
      resource.includes('/v1/pages/single-module-page/ae223310-a4c2-4568-a770-ffef70344441')
    ) {
      return originalFetch(resource, options).then((response) => {
        // clone the response to read and modify the body
        const clonedResponse = response.clone();

        return clonedResponse.json().then((data) => {
          const url = window.location.href;

          let filter;
          if (url.includes('a4f964ba-b52e-41e8-b25c-06cd70c1efad')) filter = 'ALBUMS';
          else if (url.includes('65f09547-3bba-4764-ad0c-8e105f776fa7')) filter = 'EPSANDSINGLES';
          else return response;

          // override dataApiPath
          const artistId = getArtistId(url);
          data.rows[0].modules[0].pagedList.dataApiPath = `artists/${artistId}/albums?filter=${filter}`;

          // return the new response with the modified data
          const modifiedResponse = new Response(JSON.stringify(data), {
            status: clonedResponse.status,
            statusText: clonedResponse.statusText,
            headers: clonedResponse.headers,
          });

          return modifiedResponse;
        });
      });
    }

    // if the request doesn't match, just proceed as usual
    return originalFetch(resource, options);
  };

  function getArtistId(url) {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    return urlParams.get('artistId');
  }
})();
