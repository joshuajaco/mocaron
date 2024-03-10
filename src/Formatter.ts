import {
  matchBody,
  Matcher,
  MatcherObj,
  matchHeaders,
  matchMethod,
  matchPath,
  matchQuery,
  Request,
} from "./matchRequest";
import { diff } from "jest-diff";

export function formatMatcher(matcher: Matcher) {
  if (typeof matcher === "function") return matcher.toString();
  return JSON.stringify(matcher, null, 2);
}

export function formatDiffs(matcher: Matcher, requests: Request[]) {
  return requests
    .map((request) => [request, score(matcher, request)] as const)
    .toSorted(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(
      ([request]) =>
        `${request.method} ${request.path}:\n${formatDiff(matcher, request)}`,
    )
    .join("\n\n");
}

function formatDiff(matcher: Matcher, request: Request) {
  if (typeof matcher === "function") throw "ay";

  const req = sanitizeRequest(request);

  const actual: MatcherObj = {};

  if (matcher.method) actual.method = req.method;
  if (matcher.path) actual.path = req.path;

  if (matcher.query) {
    actual.query =
      req.query && filterKeys(req.query, Object.keys(matcher.query));
  }

  if (matcher.headers) {
    actual.headers =
      req.headers && filterKeys(req.headers, Object.keys(matcher.headers));
  }

  if (matcher.body) actual.body = req.body;

  return diff(matcher, actual);
}

function score(matcher: Matcher, request: Request): number {
  if (typeof matcher === "function") throw "ay";

  let maxPoints = 0;
  let points = 0;

  if (matcher.method) {
    maxPoints += 1;
    if (matchMethod(matcher, request)) points += 1;
  }

  if (matcher.path) {
    maxPoints += 3;
    if (matchPath(matcher, request)) points += 3;
  }

  if (matcher.query) {
    maxPoints += 3;
    if (matchQuery(matcher, request)) points += 3;
  }

  if (matcher.headers) {
    maxPoints += 2;
    if (matchHeaders(matcher, request)) points += 2;
  }

  if (matcher.body) {
    maxPoints += 4;
    if (matchBody(matcher, request)) points += 4;
  }

  return (points / maxPoints) * 100;
}

function sanitizeRequest(request: Request): MatcherObj {
  return {
    method: request.method,
    path: request.path,
    query: request.query,
    headers: request.headers,
    body: request.body ? tryParse(request.body.toString()) : undefined,
  };
}

function tryParse(body: string): string | Record<never, unknown> {
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function filterKeys<T>(obj: T, keys: Array<keyof T>): Partial<T> {
  return Object.fromEntries(keys.map((key) => [key, obj[key]])) as Partial<T>;
}
