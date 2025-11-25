import { URL } from 'url';
import { urlMapper } from '../url';
import { cloneDefined } from '../object';
import { Fixtures } from '../../__tests__/utils.js';

const goFn = () => jest.fn().mockImplementation(async ({ pathname }: { pathname: string }) => {
    if (pathname.startsWith('/hasAccess/')) {
        if (pathname.endsWith('/existing')) {
            return Fixtures.sessionServiceAccess;
        } else if (pathname.endsWith('/non_existing')) {
            return Fixtures.sessionServiceNoAccess;
        } else if (pathname.endsWith('/existing,non_existing')) {
            return Fixtures.sessionServiceAccess;
        }
    }
    throw new Error(`Unimplemented mock response for url: '${pathname}'`);
});

function search(query: any, useDefaultParams: boolean, defaultParams: any): string {
    const params = useDefaultParams ? cloneDefined(defaultParams, query) : cloneDefined(query);
    return Object.keys(params).filter(p => params[p]!=='').map(p => `${encode(p)}=${encode(params[p])}`).join('&');
}

function encode(str: string): string {
    const replace: { [key: string]: string } = {
        '!': '%21',
        "'": '%27',
        '(': '%28',
        ')': '%29',
        '~': '%7E',
        '%20': '+',
        '%00': '\x00'
    };
    return encodeURIComponent(str).replace(/[!'()~]|%20|%00/g, match => replace[match]);
}

export const RESTClient = jest.fn().mockImplementation(({ serverUrl = 'PRE', envDic, defaultParams = {} }: {
    serverUrl?: string;
    envDic?: any;
    defaultParams?: any;
}) => {
    const foo = {
        url: new URL(urlMapper(serverUrl, envDic)),
        defaultParams,
        go: goFn(),
        makeUrl: (pathname: string = '', query: any = {}, useDefaultParams: boolean = true) => {
            const url = new URL(pathname, foo.url);
            url.search = search(query, useDefaultParams, foo.defaultParams);
            return url.href;
        },
        get: (pathname: string, data?: any) => {
            return foo.go({ method: 'get', pathname, data });
        },
    }
    return foo;
});

export default RESTClient;
