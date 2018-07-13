$.getScript("js/locales/i18next.min.js");
$.getScript("js/locales/i18nextBrowserLanguageDetector.min.js");
$.getScript("js/locales/i18nextLocalStorageCache.min.js");
$.getScript("js/locales/i18nextXHRBackend.min.js");
$.getScript("js/locales/loc-i18next.min.js");

var __t = function(key, def){
	var msg = i18next ? i18next.t(key) || def: def;
	return msg;
};

var i18nextLoaded = false;

$(document).ready(function () {
	var option = {
		loadPath: 'locales/{{lng}}/{{ns}}.json'
    };
    var locId = setInterval(function () {
        if ("undefined" === typeof i18next || "undefined" === typeof i18nextBrowserLanguageDetector || "undefined" === typeof i18nextXHRBackend || "undefined" === typeof i18nextLocalStorageCache) {
            return;
        }
        i18next
            .use(i18nextBrowserLanguageDetector)
            .use(i18nextXHRBackend)
            .use(i18nextLocalStorageCache)
            .init({
                backend: option,
                cache: {
                    enable: true,
                    expirationTime: 7 * 24 * 60 * 60 * 1000
                },
                detection: {
                    // order and from where user language should be detected
                    order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
                    // keys or params to lookup language from
                    lookupQuerystring: 'lang',
                    lookupCookie: 'i18next',
                    lookupLocalStorage: 'i18nextLng',
                    // cache user language on
                    caches: ['localStorage', 'cookie']
                }
            }, function (err, t) {
                i18nextLoaded = true;
                // localize = locI18next.init(i18next);
                // localize('.container-fluid');
                // localize('.navbar');
                // localize('.footer');
                // localize('.container');
                // localize('.row-fluid');
                // localize('.alert');
            });
        clearInterval(locId);
    }, 10);
});