import type express from "express";
import deepEqual from "deep-equal";

/** @see [Documentation]{@link https://github.com/joshuajaco/mocaron#matcherobj} */
export type MatcherObj = {
  /**
   * HTTP method to match against
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#matcherobj}
   */
  method?: string;
  /**
   * path to match against
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#matcherobj}
   */
  path?: string | RegExp;
  /**
   * query parameters to match against -
   * Parameters explicitly set to `undefined` will not match when provided
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#matcherobj}
   */
  query?: express.Request["query"];
  /**
   * headers to match against -
   * Headers explicitly set to `undefined` will not match when provided
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#matcherobj}
   */
  headers?: Record<string, string | undefined>;
  /**
   * body to match against -
   * If an `object` is given it will be compared to the request body parsed as JSON
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#matcherobj}
   */
  body?: string | object;
};

/**
 * @param {express.Request} req - request to match against
 * @returns {boolean} whether the request should match
 * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#matcherfn}
 */
export type MatcherFn = (req: express.Request) => boolean;

/**
 * matcher to match against the request
 * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#matcher}
 */
export type Matcher = MatcherObj | MatcherFn;

export function matchRequest(matcher: Matcher, req: express.Request): boolean {
  if (typeof matcher === "function") return matcher(req);

  return (
    matchMethod(matcher, req) &&
    matchPath(matcher, req) &&
    matchQuery(matcher, req) &&
    matchHeaders(matcher, req) &&
    matchBody(matcher, req)
  );
}

function matchMethod(matcher: MatcherObj, req: express.Request) {
  return (
    !matcher.method || matcher.method.toLowerCase() === req.method.toLowerCase()
  );
}

function matchPath(matcher: MatcherObj, req: express.Request) {
  return (
    !matcher.path ||
    (matcher.path instanceof RegExp
      ? !!req.path.match(matcher.path)
      : req.path === matcher.path)
  );
}

function matchQuery(matcher: MatcherObj, req: express.Request) {
  if (!matcher.query) return true;
  return Object.entries(matcher.query).every(([k, v]) =>
    deepEqual(req.query[k], v, { strict: true }),
  );
}

function matchHeaders(matcher: MatcherObj, req: express.Request) {
  if (!matcher.headers) return true;
  return Object.entries(matcher.headers).every(
    ([k, v]) => req.headers[k.toLowerCase()] === v,
  );
}

function matchBody(matcher: MatcherObj, req: express.Request) {
  if (!matcher.body) return true;

  // body-parser will parse the body into a Buffer. See https://github.com/expressjs/body-parser#bodyparserrawoptions
  // if the body was empty, it will be an empty object ({}). See https://github.com/expressjs/body-parser#api
  if (!(req.body instanceof Buffer)) return false;

  if (typeof matcher.body === "string") {
    return matcher.body === req.body.toString();
  }

  try {
    return deepEqual(matcher.body, JSON.parse(req.body.toString()), {
      strict: true,
    });
  } catch {
    return false;
  }
}
