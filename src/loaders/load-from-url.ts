import { printSchemaWithDirectives } from '../utils/print-schema-with-directives';
import { DocumentNode } from 'graphql/language/ast';
import { introspectionQuery, IntrospectionQuery } from 'graphql/utilities/introspectionQuery';
import { buildClientSchema } from 'graphql/utilities/buildClientSchema';
import { parse } from 'graphql/language/parser';

export type FetchFn = WindowOrWorkerGlobalScope['fetch'];

type Headers = Record<string, string> | Array<Record<string, string>>;

export interface LoadFromUrlOptions {
  headers?: Headers;
  fetch?: FetchFn;
}

export async function loadFromUrl(url: string, options?: LoadFromUrlOptions): Promise<DocumentNode> {
  let headers = {};
  let fetch: FetchFn;

  if (options) {
    if (Array.isArray(options.headers)) {
      headers = options.headers.reduce((prev: object, v: object) => ({ ...prev, ...v }), {});
    } else if (typeof options.headers === 'object') {
      headers = options.headers;
    }

    if (options.fetch) {
      fetch = options.fetch;
    } else {
      fetch = (await import('cross-fetch')).fetch;
    }
  }
  
  const fetchFn: typeof import('cross-fetch').fetch = typeof fetch === 'undefined' ? eval(`require('cross-fetch').fetch`) : fetch;
  let extraHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...headers,
  };

  const response = await fetchFn(url, {
    method: 'POST',
    body: JSON.stringify({
      query: introspectionQuery,
    }),
    headers: extraHeaders,
  });

  const body: ExecutionResult = await response.json();

  let errorMessage;

  if (body.errors && body.errors.length > 0) {
    errorMessage = body.errors.map((item: Error) => item.message).join(', ');
  } else if (!body.data) {
    errorMessage = body;
  }

  if (errorMessage) {
    throw 'Unable to download schema from remote: ' + errorMessage;
  }

  if (!body.data.__schema) {
    throw new Error('Invalid schema provided!');
  }

  const asSchema = buildClientSchema(body.data as IntrospectionQuery);
  const printed = printSchemaWithDirectives(asSchema);

  return parse(printed);
}
