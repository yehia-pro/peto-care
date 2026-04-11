declare module 'i18next-http-backend' {
    import { BackendModule, InitOptions } from 'i18next';
    
    interface HttpBackendOptions {
        /**
         * path where resources get loaded from
         */
        loadPath?: string | ((lngs: string[], namespaces: string[]) => string);
        /**
         * path to post missing resources
         */
        addPath?: string | ((lng: string, ns: string) => string);
        /**
         * your backend server supports multiLoading
         * /locales/resources.json?lng=de+en&ns=ns1+ns2
         */
        allowMultiLoading?: boolean;
        /**
         * parse data after it has been fetched
         */
        parse?: (data: string) => any;
        /**
         * use fetch instead of xhr
         */
        fetch?: (url: string, options: any, callback: (data: any, status: string) => void) => void;
        /**
         * allow cross domain requests
         */
        crossDomain?: boolean;
        /**
         * allow credentials on cross domain requests
         */
        withCredentials?: boolean;
        /**
         * define a custom request header
         */
        customHeaders?: { [key: string]: string };
        /**
         * add parameters to resource URL. Example: 'foo=bar'
         */
        queryStringParams?: { [key: string]: string };
        /**
         * @deprecated use addPath instead
         */
        addPathPattern?: string;
        /**
         * @deprecated use loadPath instead
         */
        loadPathPattern?: string;
        /**
         * allows reloading resources in the i18next cache
         */
        reloadInterval?: false | number;
        /**
         * set to true to load a single resource file when using a non-standard language code (e.g. en-US)
         */
        loadFromPath?: boolean;
        /**
         * set to true to load a single resource file when using a non-standard language code (e.g. en-US)
         */
        loadFromPath?: boolean;
    }
    
    type HttpBackendService = BackendModule<HttpBackendOptions>;
    
    const HttpBackend: HttpBackendService;
    export default HttpBackend;
}
