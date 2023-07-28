import type express from "express";
import deepEqual from "deep-equal";

export type MatcherObj = {
  method?: string;
  path?: string | RegExp;
  query?: express.Request["query"];
  headers?: Record<string, string>;
  body?: string | object;
};

export type MatcherFn = (req: express.Request) => boolean;

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
  return deepEqual(matcher.query, req.query, { strict: true });
}

function matchHeaders(matcher: MatcherObj, req: express.Request) {
  return (
    !matcher.headers ||
    Object.entries(matcher.headers).every(([k, v]) => req.headers[k] === v)
  );
}

function matchBody(matcher: MatcherObj, req: express.Request) {
  if (!matcher.body) return true;

  if (typeof matcher.body === "string") {
    return matcher.body === req.body.toString();
  }

  if (typeof req.body === "object") {
    return deepEqual(matcher.body, req.body, { strict: true });
  }

  try {
    return deepEqual(matcher.body, JSON.parse(req.body.toString()), {
      strict: true,
    });
  } catch {
    return false;
  }
}
