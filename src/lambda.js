const _ = require('lodash');

function parseParams(params) {
  if (!params) return {};

  const objs = params.slice(1, -1).split(', ')
    .map(kv => kv.split('='))
    .map(([k, v]) => {
      if (v === 'true') v = true;
      if (v === 'false') v = false;
      return {[k]: v};
    });
  return _.merge({}, ...objs);
}

function convertUrl(path, req) {
  const pathname = Object.keys(req.pathParams).reduce((path, p) => {
    return path.replace(`{${p}}`, req.pathParams[p]);
  }, path);
  const query = req.queryParams;

  const url = require('url');
  return url.format({pathname, query});
}

function mapEvent(event) {
  const req = {};
  req.queryParams = {};

  if (event.queryString) {
    req.queryParams = parseParams(event.queryString);
  }

  if (event.headers) {
    req.headers = parseParams(event.headers);
    req.headers["user-agent"] = event["user-agent"];

    req.headers["x-real-ip"] = event["source-ip"];
    req.headers["host"] = event["api-id"]
  }
  req.pathParams = parseParams(event.pathParams);

  req.method = event["http-method"];
  req.url = convertUrl(event['resource-path'], req);
  req.baseUrl = '';
  req.originalUrl = req.baseUrl + req.url;
  if (event.baseUrl) {
    req.baseUrl = event.baseUrl;
  }

  const socket = {
    remoteAddress: event.remoteAddress
  };

  req.socket = socket;
  req.connection = socket;

  return req;
}

const app = require('./app');
exports.handler = function (event, context) {
  const http = require('http')
  const req = mapEvent(event);
  const res = new http.ServerResponse(req);

  res.oldEnd = res.end;
  res.end = function (chunk, encoding, callback) {
    res.oldEnd(chunk, encoding, callback);
    const statusCode = res.statusCode;

    if (statusCode > 399) {
      return context.fail(new Error(statusCode));
    }

    const contentType = res.getHeader('content-type');
    const payload = res.output[1].toString('base64');
    context.succeed({ payload, contentType });
  };

  // setup and call express
  app.handle(req, res);
};
