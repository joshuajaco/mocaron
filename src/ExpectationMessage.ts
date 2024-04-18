import { diff } from "jest-diff";
import { MockServer } from "./MockServer";
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

/**
 * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#expectationmessage}
 */
export const ExpectationMessage = {
  /**
   * Format an expectation message for [`hasBeenCalledWith()`]{@link https://github.com/joshuajaco/mocaron#hasbeencalledwithmatcher-boolean}.
   * @param {MockServer} mockServer The mock server instance
   * @param {string | RegExp | Matcher} matcher If matcher is a `string` or `RegExp`, it will be used to match the request path
   * @returns {string} the formatted expectation message
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#hasbeencalledwithmockserver-matcher-string}
   * @example
   * ExpectationMessage.hasBeenCalledWith(mockServer, matcher);
   */
  hasBeenCalledWith(mockServer: MockServer, matcher: Matcher): string {
    return `Expected 'mockServer' to have been called with matcher:\n${formatMatcher(matcher)}\n\n${formatDiffs(mockServer, matcher)}`;
  },

  /**
   * Format an expectation message for [`hasBeenCalledTimes()`]{@link https://github.com/joshuajaco/mocaron#hasbeencalledtimestimes-matcher-boolean}.
   * @param {MockServer} mockServer The mock server instance
   * @param {number} times The number of times the mock server should have been called
   * @param {string | RegExp | Matcher} matcher If matcher is a `string` or `RegExp`, it will be used to match the request path
   * @returns {string} the formatted expectation message
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#hasbeencalledtimesmockserver-times-matcher-string}
   * @example
   * ExpectationMessage.hasBeenCalledTimes(mockServer, 1, matcher);
   */
  hasBeenCalledTimes(
    mockServer: MockServer,
    times: number,
    matcher: Matcher,
  ): string {
    const actualTimes = mockServer.countCalls(matcher);

    if (actualTimes > 0) {
      return `Expected 'mockServer' to have been called ${times} times with matcher:\n${formatMatcher(matcher)}\n\nActual calls: ${actualTimes}`;
    }

    return this.hasBeenCalledWith(mockServer, matcher);
  },
};

function formatMatcher(matcher: Matcher) {
  if (typeof matcher === "function") return matcher.toString();
  return JSON.stringify(matcher, null, 2);
}

function formatDiffs(mockServer: MockServer, matcher: Matcher) {
  if (typeof matcher === "function") return "No diff (matcher is a function)";

  return mockServer
    .calls()
    .map(({ request }) => [request, score(matcher, request)] as const)
    .toSorted(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(
      ([request]) =>
        `${request.method} ${request.path}:\n${formatDiff(matcher, request)}`,
    )
    .join("\n\n");
}

function formatDiff(matcher: MatcherObj, request: Request) {
  const req = sanitizeRequest(request);

  const actual: MatcherObj = filterKeys(
    req,
    Object.keys(matcher) as Array<keyof MatcherObj>,
  );

  if (matcher.query) {
    actual.query = filterKeys(req.query, Object.keys(matcher.query));
  }

  if (matcher.headers) {
    actual.headers = filterKeys(req.headers, Object.keys(matcher.headers));
  }

  return diff(matcher, actual);
}

function score(matcher: MatcherObj, request: Request): number {
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

type SanitizedRequest = Required<Omit<MatcherObj, "body">> & MatcherObj;

function sanitizeRequest(request: Request): SanitizedRequest {
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
