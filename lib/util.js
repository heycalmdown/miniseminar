const _ = require('lodash');

let host = process.env.HOST;

function setHost(h) {
  host = h;
}

function convertImageSrcSet(baseUrl, imageSrcSet) {
  return imageSrcSet.split(',').map(src => baseUrl + '/image' + src).join(',');
}

function splitPinnedPages(PINNED_PAGES) {
  if (!PINNED_PAGES) return [];
  return PINNED_PAGES.split(',');
}

function sanitizeImageSrc(imageSrc) {
  if (!imageSrc.startsWith(host)) return imageSrc;
  return imageSrc.slice(host.length);
}

function parseParams(params) {
  return _.merge(...params.split(';').map(param => {
    const [key, value] = param.split(':');
    return {
      [key.trim()]: value.trim()
    };
  }));
}

module.exports = {
  host,
  setHost,
  convertImageSrcSet,
  splitPinnedPages,
  sanitizeImageSrc,
  parseParams
}
