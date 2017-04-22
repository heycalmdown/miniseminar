const _ = require('lodash');

export let host = process.env.HOST;

export function setHost(h) {
  host = h;
}

export function convertImageSrcSet(baseUrl, imageSrcSet) {
  return imageSrcSet.split(',').map(src => baseUrl + '/image' + src).join(',');
}

export function splitPinnedPages(PINNED_PAGES) {
  if (!PINNED_PAGES) return [];
  return PINNED_PAGES.split(',');
}

export function sanitizeImageSrc(imageSrc) {
  if (!imageSrc.startsWith(host)) return imageSrc;
  return imageSrc.slice(host.length);
}

export function parseParams(params) {
  return _.merge(...params.split(';').map(param => {
    const [key, value] = param.split(':');
    return {
      [key.trim()]: value.trim()
    };
  }));
}
