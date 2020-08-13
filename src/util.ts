import * as _ from 'lodash';

export interface Section {
  body: string;
  sections?: Section[];
  background?: string;
}

export let host = process.env.HOST || '';
const context = process.env.CONTEXT;

export function setHost(h: string) {
  host = h;
}

export function convertImageSrcSet(baseUrl: string, imageSrcSet: string) {
  return imageSrcSet.split(',').map(src => baseUrl + '/image' + sanitizeImageSrc(src)).join(',');
}

export function splitPinnedPages(PINNED_PAGES?: string): string[] {
  if (!PINNED_PAGES) return [];
  return PINNED_PAGES.split(',');
}

export function sanitizeImageSrc(imageSrc: string) {
  if (imageSrc.startsWith(host)) {
    imageSrc = imageSrc.slice(host.length);
  }
  if (context && context.length && imageSrc.startsWith('/' + context)) {
    imageSrc = imageSrc.slice(`/${context}`.length);
  }
  return imageSrc;
}

export function parseParams(params: string): {[key: string]: string} {
  return _.merge({}, ...params.split(';').map(param => {
    const [key, value] = param.split(':');
    return {
      [key.trim()]: value.trim()
    };
  }));
}
