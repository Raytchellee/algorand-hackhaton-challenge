'use client';

import { useCallback } from 'react';
import { ClientRequestOptions, RequestMethod, RequestOptions } from '@/interface';
import config from '@/config';

export const useClient = () => {
  const baseApiUrl = config.API_URL;

  async function handleResponse<R = any, E = any>(response: globalThis.Response) {
    return response
      .json()
      .then(async (data) => {
        if (!response.ok) {
          const error: E = (data && data.message) || response.statusText;

          return {
            error,
            status: response.status,
            data: undefined,
          };
        }

        const responseData: R = data.message || data;

        return {
          data: responseData,
          status: response.status,
          error: undefined,
        };
      })
      .catch((error) => {
        return {
          data: undefined,
          status: response.status,
          error: error.message || 'An error occurred',
        };
      });
  }

  const request = useCallback((method: RequestMethod) => {
    /**
     * @description This method makes an API Call using the provided
     * @param url The url to make the request to. The base URL of
     * @param body The body of the request.
     * @param options Extra options to modify the behaviour of the request.
     */
    return async function requestHandler<Response = any, Body = any, Error = any>(
      url: string,
      body?: Body,
      options?: ClientRequestOptions,
    ) {
      const requestOptions: RequestOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      };

      if (body) {
        requestOptions.headers['Content-Type'] = 'application/json';
        requestOptions.body = JSON.stringify(body);
      }

      const hideSlash = url.startsWith('/');
      const baseUrl = options?.overrideDefaultBaseUrl ? '' : baseApiUrl + (hideSlash ? '' : '/');
      const requestUrl = `${baseUrl}${url}`;

      return fetch(requestUrl, requestOptions)
        .then((response) => {
          return handleResponse<Response, Error>(response);
        })
        .catch((error: Error) => {
          return { error, status: 500, data: undefined };
        });
    };
  }, []);

  return {
    get: request('GET'),
    post: request('POST'),
    put: request('PUT'),
    delete: request('DELETE'),
    patch: request('PATCH'),
  };
};
