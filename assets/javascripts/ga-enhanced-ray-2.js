/*
 * Enhanced Analytics Script for Google Analytics (GA4) - v2
 * =======================================================
 * A BitCurrents experiement by Ray Kooyenga
 * Work in progress that makes no guarantee of stability or accuracy
 *
 * Prerequisites:
 * 1. Google Analytics gtag.js snippet must be loaded BEFORE this script.
 * 2. Add your GA Measurement ID to the script tag.
 *
 * Configuration (via data attributes on the script tag):
 * - data-ga-measurement-id="G-XXXXXXXXXX" (Required)
 *
 * Feature Flags (Defaults are generally sensible):
 * - data-enable-auto-link-tracking="true"  (Default: true) Tracks clicks on links (internal, external, download, mailto, tel) automatically.
 * - data-enable-youtube-tracking="true"    (Default: true) Tracks embedded YouTube video interactions.
 * - data-enable-html-media-tracking="true" (Default: true) Tracks HTML5 <video> and <audio> interactions.
 * - data-enable-scroll-tracking="true"     (Default: true) Tracks scroll depth milestones.
 * - data-enable-web-vitals="true"          (Default: true) Tracks Core Web Vitals with attribution.
 * - data-enable-adblock-detection="false"  (Default: false) Detects adblockers and sets a user property.
 * - data-enable-spa-tracking="true"        (Default: true) Tracks single-page application navigation.
 * - data-enable-search-tracking="true"     (Default: true) Tracks internal site search results views.
 * - data-enable-pii-redaction="false"      (Default: false) Enables basic PII pattern redaction in URLs/params. BE CAUTIOUS.
 *
 * Configuration Parameters:
 * - data-download-extensions="pdf,zip,doc,docx,xls,xlsx,ppt,pptx,exe,js,txt,csv,rar,7z,gz,tgz,tar" (Comma-separated)
 * - data-search-params="q,query,s,search,keyword,search_term,search_query,searchtext,search_keywords" (Comma-separated)
 * - data-video-milestones="10,25,50,75,90" (Comma-separated percentages for video progress)
 * - data-scroll-thresholds="25,50,75,90"  (Comma-separated percentages for scroll depth)
 * - data-allowed-query-params="utm_*,gclid,dclid,_gl,gclsrc,wbraid,gbraid" (Comma-separated, supports wildcard *) - Used for URL scrubbing.
 * - data-pii-redaction-level="basic"     (Options: "none", "basic" [email, common pwd/name params], "strict" [adds phone, zip, potentially more FPs]) - Only if pii-redaction is enabled.
 * - data-custom-dimension-map="{}"       (JSON map, e.g., '{"dimension1": "value1", "user_prop1": "uValue"}' - Sent with initial config)
 *
 * Public API:
 * - window.enhancedAnalytics.event('event_name', {param1: 'value1'});
 * - window.enhancedAnalytics.pageview('/new/path', 'New Title');
 * - window.enhancedAnalytics.redact('string_to_redact'); // If needed externally
 */

(function () {
    const currentScript = document.currentScript;
    if (!currentScript) {
        console.error("Enhanced Analytics: Cannot find current script tag. Ensure async/defer attributes are used correctly.");
        return;
    }

    // --- Configuration Reading ---
    const getConfig = (attributeName, defaultValue, type = 'string') => {
        const value = currentScript.getAttribute(`data-${attributeName}`);
        if (value === null || value === undefined) {
            return defaultValue;
        }
        if (type === 'boolean') {
            return value.toLowerCase() === 'true';
        }
        if (type === 'array') {
            return value.split(',').map(s => s.trim()).filter(Boolean);
        }
         if (type === 'intarray') {
            return value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
         }
        if (type === 'json') {
            try {
                return JSON.parse(value);
            } catch (e) {
                console.error(`Enhanced Analytics: Invalid JSON in data-${attributeName}:`, value);
                return defaultValue;
            }
        }
        return value;
    };

    const GA_MEASUREMENT_ID = getConfig('ga-measurement-id', null);
    const config = {
        enableAutoLinkTracking: getConfig('enable-auto-link-tracking', true, 'boolean'),
        enableYouTubeTracking: getConfig('enable-youtube-tracking', true, 'boolean'),
        enableHtmlMediaTracking: getConfig('enable-html-media-tracking', true, 'boolean'),
        enableScrollTracking: getConfig('enable-scroll-tracking', true, 'boolean'),
        enableWebVitals: getConfig('enable-web-vitals', true, 'boolean'),
        enableAdblockDetection: getConfig('enable-adblock-detection', false, 'boolean'),
        enableSpaTracking: getConfig('enable-spa-tracking', true, 'boolean'),
        enableSearchTracking: getConfig('enable-search-tracking', true, 'boolean'),
        enablePiiRedaction: getConfig('enable-pii-redaction', false, 'boolean'),

        downloadExtensions: getConfig('download-extensions', 'pdf,zip,doc,docx,xls,xlsx,ppt,pptx,exe,js,txt,csv,rar,7z,gz,tgz,tar', 'array'),
        searchParams: getConfig('search-params', 'q,query,s,search,keyword,search_term,search_query,searchtext,search_keywords', 'array'),
        videoMilestones: getConfig('video-milestones', '10,25,50,75,90', 'intarray'),
        scrollThresholds: getConfig('scroll-thresholds', '25,50,75,90', 'intarray'),
        allowedQueryParams: getConfig('allowed-query-params', 'utm_*,gclid,dclid,_gl,gclsrc,wbraid,gbraid', 'array'),
        piiRedactionLevel: getConfig('pii-redaction-level', 'basic'),
        customDimensionMap: getConfig('custom-dimension-map', {}, 'json')
    };

    // --- Pre-requisite Checks ---
    if (window._enhanced_analytics_loaded) {
        // console.warn("Enhanced Analytics: Script already loaded. Skipping initialization.");
        return; // Prevent double execution
    }
    if (typeof window.gtag !== 'function') {
        console.error("Enhanced Analytics: Google Analytics gtag.js not found. Ensure it's loaded before this script.");
        return;
    }
    if (!GA_MEASUREMENT_ID) {
        console.error("Enhanced Analytics: GA Measurement ID not provided. Add 'data-ga-measurement-id=\"G-XXXXXXXXXX\"' to the script tag.");
        return;
    }

    window._enhanced_analytics_loaded = true;

    // --- Web Vitals Library (minified, included directly) ---
    var webVitals = function (e) { /* ... (Keep the exact same minified webVitals code as in your original snippet) ... */
        "use strict";var n,t,r,i,o,a=-1,c=function(e){addEventListener("pageshow",(function(n){n.persisted&&(a=n.timeStamp,e(n))}),!0)},u=function(){return window.performance&&performance.getEntriesByType&&performance.getEntriesByType("navigation")[0]},s=function(){var e=u();return e&&e.activationStart||0},f=function(e,n){var t=u(),r="navigate";a>=0?r="back-forward-cache":t&&(document.prerendering||s()>0?r="prerender":document.wasDiscarded?r="restore":t.type&&(r=t.type.replace(/_/g,"-")));return{name:e,value:void 0===n?-1:n,rating:"good",delta:0,entries:[],id:"v3-".concat(Date.now(),"-").concat(Math.floor(8999999999999*Math.random())+1e12),navigationType:r}},d=function(e,n,t){try{if(PerformanceObserver.supportedEntryTypes.includes(e)){var r=new PerformanceObserver((function(e){Promise.resolve().then((function(){n(e.getEntries())}))}));return r.observe(Object.assign({type:e,buffered:!0},t||{})),r}}catch(e){}},l=function(e,n,t,r){var i,o;return function(a){n.value>=0&&(a||r)&&((o=n.value-(i||0))||void 0===i)&&(i=n.value,n.delta=o,n.rating=function(e,n){return e>n[1]?"poor":e>n[0]?"needs-improvement":"good"}(n.value,t),e(n))}},p=function(e){requestAnimationFrame((function(){return requestAnimationFrame((function(){return e()}))}))},v=function(e){var n=function(n){"pagehide"!==n.type&&"hidden"!==document.visibilityState||e(n)};addEventListener("visibilitychange",n,!0),addEventListener("pagehide",n,!0)},m=function(e){var n=!1;return function(t){n||(e(t),n=!0)}},h=-1,g=function(){return"hidden"!==document.visibilityState||document.prerendering?1/0:0},T=function(e){"hidden"===document.visibilityState&&h>-1&&(h="visibilitychange"===e.type?e.timeStamp:0,C())},y=function(){addEventListener("visibilitychange",T,!0),addEventListener("prerenderingchange",T,!0)},C=function(){removeEventListener("visibilitychange",T,!0),removeEventListener("prerenderingchange",T,!0)},E=function(){return h<0&&(h=g(),y(),c((function(){setTimeout((function(){h=g(),y()}),0)}))),{get firstHiddenTime(){return h}}},L=function(e){document.prerendering?addEventListener("prerenderingchange",(function(){return e()}),!0):e()},b=[1800,3e3],S=function(e,n){n=n||{},L((function(){var t,r=E(),i=f("FCP"),o=d("paint",(function(e){e.forEach((function(e){"first-contentful-paint"===e.name&&(o.disconnect(),e.startTime<r.firstHiddenTime&&(i.value=Math.max(e.startTime-s(),0),i.entries.push(e),t(!0)))})}));o&&(t=l(e,i,b,n.reportAllChanges),c((function(r){i=f("FCP"),t=l(e,i,b,n.reportAllChanges),p((function(){i.value=performance.now()-r.timeStamp,t(!0)}))})))}))},w=[.1,.25],P=function(e,n){n=n||{},S(m((function(){var t,r=f("CLS",0),i=0,o=[],a=function(e){e.forEach((function(e){if(!e.hadRecentInput){var n=o[0],t=o[o.length-1];i&&e.startTime-t.startTime<1e3&&e.startTime-n.startTime<5e3?(i+=e.value,o.push(e)):(i=e.value,o=[e])}})),i>r.value&&(r.value=i,r.entries=o,t())},u=d("layout-shift",a);u&&(t=l(e,r,w,n.reportAllChanges),v((function(){a(u.takeRecords()),t(!0)})),c((function(){i=0,r=f("CLS",0),t=l(e,r,w,n.reportAllChanges),p((function(){return t()}))})),setTimeout(t,0))})))}),F={passive:!0,capture:!0},I=new Date,A=function(e,i){n||(n=i,t=e,r=new Date,k(removeEventListener),M())},M=function(){if(t>=0&&t<r-I){var e={entryType:"first-input",name:n.type,target:n.target,cancelable:n.cancelable,startTime:n.timeStamp,processingStart:n.timeStamp+t};i.forEach((function(n){n(e)})),i=[]}},D=function(e){if(e.cancelable){var n=(e.timeStamp>1e12?new Date:performance.now())-e.timeStamp;"pointerdown"==e.type?function(e,n){var t=function(){A(e,n),i()},r=function(){i()},i=function(){removeEventListener("pointerup",t,F),removeEventListener("pointercancel",r,F)};addEventListener("pointerup",t,F),addEventListener("pointercancel",r,F)}(n,e):A(n,e)}},k=function(e){["mousedown","keydown","touchstart","pointerdown"].forEach((function(n){return e(n,D,F)}))},B=[100,300],x=function(e,r){r=r||{},L((function(){var o,a=E(),u=f("FID"),s=function(e){e.startTime<a.firstHiddenTime&&(u.value=e.processingStart-e.startTime,u.entries.push(e),o(!0))},p=function(e){e.forEach(s)},h=d("first-input",p);o=l(e,u,B,r.reportAllChanges),h&&v(m((function(){p(h.takeRecords()),h.disconnect()}))),h&&c((function(){var a;u=f("FID"),o=l(e,u,B,r.reportAllChanges),i=[],t=-1,n=null,k(addEventListener),a=s,i.push(a),M()}))}))},N=0,R=1/0,H=0,O=function(e){e.forEach((function(e){e.interactionId&&(R=Math.min(R,e.interactionId),H=Math.max(H,e.interactionId),N=H?(H-R)/7+1:0)}))},_=function(){return o?N:performance.interactionCount||0},j=function(){"interactionCount"in performance||o||(o=d("event",O,{type:"event",buffered:!0,durationThreshold:0}))},q=[200,500],V=0,z=function(){return _()-V},G=[],J={},K=function(e){var n=G[G.length-1],t=J[e.interactionId];if(t||G.length<10||e.duration>n.latency){if(t)t.entries.push(e),t.latency=Math.max(t.latency,e.duration);else{var r={id:e.interactionId,latency:e.duration,entries:[e]};J[r.id]=r,G.push(r)}G.sort((function(e,n){return n.latency-e.latency})),G.splice(10).forEach((function(e){delete J[e.id]}))}},Q=function(e,n){n=n||{},L((function(){j();var t,r=f("INP"),i=function(e){e.forEach((function(e){(e.interactionId&&K(e),"first-input"===e.entryType)&&!G.some((function(n){return n.entries.some((function(n){return e.duration===n.duration&&e.startTime===n.startTime}))}))&&K(e)})),n=Math.min(G.length-1,Math.floor(z()/50));var n,i=G[n];i&&i.latency!==r.value&&(r.value=i.latency,r.entries=i.entries,t())},o=d("event",i,{durationThreshold:n.durationThreshold||40});t=l(e,r,q,n.reportAllChanges),o&&(o.observe({type:"first-input",buffered:!0}),v((function(){i(o.takeRecords()),r.value<0&&z()>0&&(r.value=0,r.entries=[]),t(!0)})),c((function(){G=[],V=_(),r=f("INP"),t=l(e,r,q,n.reportAllChanges)})))}));
        e.INPThresholds=q;var U=[2500,4e3],W={},X=function(e,n){n=n||{},L((function(){var t,r=E(),i=f("LCP"),o=function(e){var n=e[e.length-1];n&&n.startTime<r.firstHiddenTime&&(i.value=Math.max(n.startTime-s(),0),i.entries=[n],t())},a=d("largest-contentful-paint",o);if(a){t=l(e,i,U,n.reportAllChanges);var u=m((function(){W[i.id]||(o(a.takeRecords()),a.disconnect(),W[i.id]=!0,t(!0))}));["keydown","click"].forEach((function(e){addEventListener(e,u,!0)})),v(u),c((function(r){i=f("LCP"),t=l(e,i,U,n.reportAllChanges),p((function(){i.value=performance.now()-r.timeStamp,W[i.id]=!0,t(!0)}))}))}}))},Y=[800,1800],Z=function e(n){document.prerendering?L((function(){return e(n)})):"complete"!==document.readyState?addEventListener("load",(function(){return e(n)}),!0):setTimeout(n,0)},$=function(e,n){n=n||{};var t=f("TTFB"),r=l(e,t,Y,n.reportAllChanges);Z((function(){var i=u();if(i){var o=i.responseStart;if(o<=0||o>performance.now())return;t.value=Math.max(o-s(),0),t.entries=[i],r(!0),c((function(){t=f("TTFB",0),(r=l(e,t,Y,n.reportAllChanges))(!0)}))}}))};return e.CLSThresholds=w,e.FCPThresholds=b,e.FIDThresholds=B,e.INPThresholds=q,e.LCPThresholds=U,e.TTFBThresholds=Y,e.getCLS=P,e.getFCP=S,e.getFID=x,e.getINP=Q,e.getLCP=X,e.getTTFB=$,e.onCLS=P,e.onFCP=S,e.onFID=x,e.onINP=Q,e.onLCP=X,e.onTTFB=$,Object.defineProperty(e,"__esModule",{value:!0}),e}({});
    // --- End Web Vitals Library ---

    // --- PII Redaction & URL Scrubbing ---
    const piiPatterns = {
        basic: [
            { name: 'EMAIL', regex: /[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi },
            // Basic checks for common query param names likely containing PII
            { name: 'NAME_PARAM', regex: /((?:first|last|full|user)[_-]?name)=[^&]+/gi },
            { name: 'PWD_PARAM', regex: /(password|passwd|pwd)=[^&]+/gi },
        ],
        strict: [
            { name: 'EMAIL', regex: /[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi },
            { name: 'PHONE', regex: /(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/gi }, // More comprehensive phone
             { name: 'SSN', regex: /\d{3}[\s.-]?\d{2}[\s.-]?\d{4}/gi }, // Basic SSN structure (use with caution, potential for FPs)
            // More aggressive param checks
            { name: 'NAME_PARAM', regex: /((?:first|last|middle|full|user|sur)[_-]?name)=[^&]+/gi },
            { name: 'PWD_PARAM', regex: /((?:confirm[_-]?)?password|passwd|pwd)=[^&]+/gi },
            { name: 'ADDR_PARAM', regex: /(address|street|addr)[1-2]?=[^&]+/gi },
            { name: 'ZIP_PARAM', regex: /(zip|postal)[_-]?code=[^&]+/gi },
             // Basic DOB patterns (example, adapt carefully)
             { name: 'DOB_PARAM', regex: /(dob|birth[_-]?date)=(?:\d{1,4}[-/.\s]){2}\d{1,4}/gi }
        ]
    };

    function redactPii(text, level = config.piiRedactionLevel) {
        if (!config.enablePiiRedaction || level === 'none' || typeof text !== 'string') {
            return text;
        }
        const patternsToUse = piiPatterns[level] || [];
        let redactedText = text;
        patternsToUse.forEach(pattern => {
            // Handle param redaction (replace value part) vs general text redaction
            if (pattern.name.endsWith('_PARAM')) {
                redactedText = redactedText.replace(pattern.regex, `$1=[REDACTED_${pattern.name.replace('_PARAM','')}]`);
            } else {
                redactedText = redactedText.replace(pattern.regex, `[REDACTED_${pattern.name}]`);
            }
        });
        return redactedText;
    }

    function scrubUrlParams(url) {
        if (typeof url !== 'string' || url.indexOf('?') === -1) {
            return url;
        }
        try {
            const urlParts = url.split('?');
            const baseUrl = urlParts[0];
            const queryString = urlParts[1];
            const params = new URLSearchParams(queryString);
            const newParams = new URLSearchParams();
            const allowedLower = config.allowedQueryParams.map(p => p.toLowerCase());

            params.forEach((value, key) => {
                const keyLower = key.toLowerCase();
                let isAllowed = allowedLower.some(allowedKey => {
                    if (allowedKey.endsWith('*')) {
                        return keyLower.startsWith(allowedKey.slice(0, -1));
                    }
                    return keyLower === allowedKey;
                });

                if (isAllowed) {
                    newParams.append(key, config.enablePiiRedaction ? redactPii(value) : value);
                } else if (config.enablePiiRedaction) {
                    // Optionally redact disallowed params instead of removing entirely
                     // newParams.append(key, `[REDACTED_PARAM]`);
                }
                // If neither allowed nor redacted, it's dropped.
            });

            const newQueryString = newParams.toString();
            return newQueryString ? `${baseUrl}?${newQueryString}` : baseUrl;

        } catch (e) {
            console.error("Enhanced Analytics: Error scrubbing URL params:", e, url);
            // Fallback: Redact the entire query string if scrubbing fails and PII redaction is on
            return config.enablePiiRedaction ? url.split('?')[0] + '?query=[REDACTED_PII_ERROR]' : url.split('?')[0];
        }
    }


    // --- GA Helper Functions ---
    function sendGAEvent(eventName, eventParams = {}) {
        if (typeof gtag === 'function' && GA_MEASUREMENT_ID) {
            const processedParams = {};
             // Redact specific sensitive fields if enabled
            for (const key in eventParams) {
                if (Object.prototype.hasOwnProperty.call(eventParams, key)) {
                    let value = eventParams[key];
                    if (config.enablePiiRedaction && typeof value === 'string') {
                         // Redact URLs commonly found in event params
                        if (key.includes('url') || key.includes('link') || key.includes('href') || key === 'page_location' || key === 'page_referrer' || key === 'file_name') {
                            value = scrubUrlParams(value); // Scrub params first
                            value = redactPii(value);      // Then redact remaining text
                        }
                        // Redact potentially free-form text fields (use basic redaction)
                        else if (key.includes('text') || key.includes('label') || key.includes('term') || key.includes('title') || key === 'value' || key === 'debug_target') {
                             value = redactPii(value, 'basic'); // Less aggressive here
                        }
                    }
                     processedParams[key] = value;
                }
            }
            // console.log(`GA Event: ${eventName}`, processedParams); // Uncomment for debugging
            gtag('event', eventName, processedParams);
        }
    }

    // Sends pageview via config update for SPA
    function sendGAPageView(path = null, title = null) {
        if (typeof gtag === 'function' && GA_MEASUREMENT_ID) {
            const pagePath = path || location.pathname + location.search + location.hash;
            const pageTitle = title || document.title;

            const configUpdate = {
                'page_path': scrubUrlParams(pagePath), // Scrub potentially PII params
                'page_title': config.enablePiiRedaction ? redactPii(pageTitle, 'basic') : pageTitle
            };
            // console.log(`GA PageView (Config Update):`, configUpdate); // Uncomment for debugging
            gtag('config', GA_MEASUREMENT_ID, configUpdate);

            // Check for search terms after page view
            handleSearchTermCheck(pagePath);
        }
    }

    function setGAUserProperty(propName, propValue) {
         if (typeof gtag === 'function') {
            const userProp = {};
            // Redact user property value if needed (less common, be careful)
            userProp[propName] = (config.enablePiiRedaction && typeof propValue === 'string') ? redactPii(propValue, 'basic') : propValue;
            // console.log(`GA User Property:`, userProp); // Uncomment for debugging
            gtag('set', 'user_properties', userProp);
         }
    }

    // --- Public API ---
    window.enhancedAnalytics = {
        event: sendGAEvent,
        pageview: sendGAPageView,
        redact: redactPii, // Expose redaction if needed externally
        config: config      // Expose config for debugging/inspection
    };


    // --- Feature Initialization Functions ---

    // Adapted from gov-dap.js _initAutoTracker
    function initAutoLinkTracking() {
        if (!config.enableAutoLinkTracking) return;

        const domain = location.hostname.replace(/^www\./, "").toLowerCase();
        const downloadExtensionsRegex = new RegExp(`\\.(${config.downloadExtensions.join('|')})$`, 'i');
        const mailtoRegex = /^mailto:/i;
        const telRegex = /^tel:/i;

        function isDownload(href) {
            try {
                const path = new URL(href, location.origin).pathname;
                return downloadExtensionsRegex.test(path);
            } catch (e) {
                return false; // Invalid URL
            }
        }

        function getFileExtension(href) {
            try {
                const path = new URL(href, location.origin).pathname;
                const match = path.match(downloadExtensionsRegex);
                return match ? match[1].toLowerCase() : '';
            } catch (e) {
                return '';
            }
        }

         function getFileName(href) {
            try {
                const path = new URL(href, location.origin).pathname;
                return path.substring(path.lastIndexOf('/') + 1);
            } catch (e) {
                return '';
            }
        }


        const handleInteraction = (event) => {
            const link = event.target.closest('a');
            if (!link || !link.href) return;

            const interactionType = (event.type === 'mousedown') ? 'click' :
                                   (event.type === 'keydown' && event.keyCode === 13) ? 'enter_key' : null;

            if (!interactionType) return;

            const href = link.href;
            const linkText = (link.innerText || link.textContent || '').trim().replace(/[\s\r\n]+/g, ' ');
            const linkId = link.id || 'N/A';
            const linkClasses = link.className || 'N/A';

            let eventName = 'click'; // Default event name
            let eventParams = {
                link_url: href, // Will be scrubbed/redacted by sendGAEvent
                link_text: linkText,
                link_id: linkId,
                link_classes: linkClasses,
                interaction_type: interactionType,
                outbound: false // Default to internal
            };

            try {
                const linkUrl = new URL(href, location.origin); // Resolve relative URLs
                const linkHostname = linkUrl.hostname.replace(/^www\./, "").toLowerCase();

                if (mailtoRegex.test(href)) {
                    eventName = 'email_click';
                    eventParams.link_domain = href.substring(href.indexOf('@') + 1);
                } else if (telRegex.test(href)) {
                    eventName = 'telephone_click';
                    eventParams.link_url = href.substring(4); // Remove "tel:"
                } else if (linkUrl.protocol.startsWith('http')) {
                     // Check if it's a download link
                    if (isDownload(href)) {
                        eventName = 'file_download';
                        eventParams.file_extension = getFileExtension(href);
                        eventParams.file_name = getFileName(href); // Will be scrubbed/redacted
                        eventParams.link_domain = linkHostname;
                    } else {
                         // Standard link click (external or internal)
                         eventParams.link_domain = linkHostname;
                    }

                    // Determine if outbound
                    if (linkHostname !== domain && !linkHostname.endsWith('.' + domain)) {
                        eventParams.outbound = true;
                         // Keep eventName as 'click' for external links
                    } else {
                         eventName = 'navigation_click'; // Use specific name for internal non-download clicks
                    }
                } else {
                    // Non-http protocols (ftp, etc.) - treat as external clicks
                    eventName = 'click';
                    eventParams.link_domain = 'N/A';
                    eventParams.outbound = true;
                }

                sendGAEvent(eventName, eventParams);

            } catch (e) {
                console.error("Enhanced Analytics: Error processing link interaction:", e, link);
                 // Send a generic error event?
                 sendGAEvent('analytics_error', { 'error_type': 'link_tracking', 'error_message': e.message, 'link_href': href });
            }
        };

         // Use event delegation on the document body
        document.body.addEventListener("mousedown", handleInteraction, true); // Capture phase
        document.body.addEventListener("keydown", handleInteraction, true);   // Capture phase
    }


    // Adapted from gov-dap.js YouTube tracking
    function initYouTubeTracking() {
        if (!config.enableYouTubeTracking || typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
            if(config.enableYouTubeTracking && !window._yt_api_warned) {
                 // console.warn("Enhanced Analytics: YouTube IFrame API not found. YouTube tracking disabled. Ensure API is loaded (https://www.youtube.com/iframe_api).");
                 window._yt_api_warned = true; // Prevent repeated warnings on SPA nav
            }
            // Attempt to load YT API if not present
            if (!window.onYouTubeIframeAPIReady && config.enableYouTubeTracking) {
                 // console.log("Enhanced Analytics: Attempting to load YouTube IFrame API.");
                 var tag = document.createElement('script');
                 tag.src = "https://www.youtube.com/iframe_api";
                 document.head.appendChild(tag);
                 // Define the global callback
                 window.onYouTubeIframeAPIReady = findAndPrepareYouTubeFrames;
            }
            return;
        }

        const players = {}; // Store player instances and state
        const milestones = config.videoMilestones.sort((a, b) => a - b);

        function getPlayerState(playerId) {
            if (!players[playerId]) {
                players[playerId] = {
                    progressReached: {}, // track milestones reached { 25: true, 50: true }
                    intervalId: null,
                    videoData: null,
                    isStarted: false
                };
                milestones.forEach(m => players[playerId].progressReached[m] = false);
            }
            return players[playerId];
        }

         function clearPlayerProgress(playerId) {
            const state = getPlayerState(playerId);
            milestones.forEach(m => state.progressReached[m] = false);
            state.isStarted = false;
            if (state.intervalId) {
                clearInterval(state.intervalId);
                state.intervalId = null;
            }
         }

        function buildVideoParams(player, playerState) {
             try {
                 const videoData = playerState.videoData || player.getVideoData(); // Cache data
                 if(!playerState.videoData && videoData) playerState.videoData = videoData; // Cache it

                 const duration = player.getDuration();
                 const currentTime = player.getCurrentTime();
                 const percent = duration > 0 ? Math.min(100, Math.floor((currentTime / duration) * 100)) : 0;

                 return {
                     video_title: videoData?.title || 'N/A',
                     video_url: player.getVideoUrl() || 'N/A',
                     video_duration: Math.round(duration || 0),
                     video_current_time: Math.round(currentTime || 0),
                     video_percent: percent,
                     video_provider: 'youtube',
                     video_id: videoData?.video_id || 'N/A' // Extract from videoData if possible
                 };
             } catch (e) {
                 console.error("Enhanced Analytics: Error building YouTube video params:", e);
                 return { video_provider: 'youtube', video_error: e.message };
             }
        }


        function onPlayerStateChange(event) {
            const player = event.target;
            const playerId = player.getIframe().id;
             if (!playerId) return; // Need an ID

            const playerState = getPlayerState(playerId);
            const videoParams = buildVideoParams(player, playerState);

            switch (event.data) {
                case YT.PlayerState.PLAYING:
                    if (!playerState.isStarted) {
                        playerState.isStarted = true;
                        sendGAEvent('video_start', videoParams);
                         // Start progress tracking interval only if milestones are defined
                         if (!playerState.intervalId && milestones.length > 0) {
                             playerState.intervalId = setInterval(() => trackProgress(player, playerId), 1000);
                         }
                    } else {
                         sendGAEvent('video_play', videoParams);
                          // Ensure interval is running if resuming
                         if (!playerState.intervalId && milestones.length > 0) {
                             playerState.intervalId = setInterval(() => trackProgress(player, playerId), 1000);
                         }
                    }
                    break;
                case YT.PlayerState.PAUSED:
                    sendGAEvent('video_pause', videoParams);
                    // Clear interval when paused
                     if (playerState.intervalId) {
                        clearInterval(playerState.intervalId);
                        playerState.intervalId = null;
                    }
                    break;
                case YT.PlayerState.ENDED:
                     // Ensure the final progress event (e.g., 90%) fires if needed
                     trackProgress(player, playerId, true); // Force final check
                     // Send complete event AFTER final progress check
                     videoParams.video_percent = 100; // Force 100% on complete
                     videoParams.video_current_time = videoParams.video_duration;
                     sendGAEvent('video_complete', videoParams);
                     clearPlayerProgress(playerId); // Reset state
                    break;
                case YT.PlayerState.BUFFERING:
                     // Optional: Track buffering?
                    break;
                 case YT.PlayerState.CUED:
                     clearPlayerProgress(playerId); // Reset state when a new video is cued
                     playerState.videoData = null; // Clear cached data
                     break;
            }
        }

         function trackProgress(player, playerId, isEnded = false) {
            const playerState = getPlayerState(playerId);
            if (!playerState || !playerState.isStarted) return; // Only track if started

            const videoParams = buildVideoParams(player, playerState);
             const currentPercent = videoParams.video_percent;

            milestones.forEach(milestone => {
                if (!playerState.progressReached[milestone] && currentPercent >= milestone) {
                    playerState.progressReached[milestone] = true;
                    // Adjust params to reflect the milestone exact value
                     const milestoneParams = { ...videoParams };
                     milestoneParams.video_percent = milestone;
                     // Estimate current time for the milestone if needed, though percent is usually key
                     // milestoneParams.video_current_time = Math.round(videoParams.video_duration * (milestone / 100));
                    sendGAEvent('video_progress', milestoneParams);
                }
            });

            // Stop interval if ended
            if(isEnded && playerState.intervalId) {
                clearInterval(playerState.intervalId);
                playerState.intervalId = null;
            }
        }

        function onPlayerError(event) {
             const player = event.target;
             const playerState = getPlayerState(player.getIframe().id);
             const videoParams = buildVideoParams(player, playerState);
             videoParams.error_code = event.data; // Add error code
             sendGAEvent('video_error', videoParams);
             clearPlayerProgress(player.getIframe().id); // Reset on error
        }

        function findAndPrepareYouTubeFrames() {
            // console.log("Enhanced Analytics: YouTube API ready. Searching for IFrames.");
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach(iframe => {
                 try {
                     const src = iframe.src || '';
                     if (src.includes('youtube.com/embed/') || src.includes('youtube-nocookie.com/embed/')) {
                         // Ensure the iframe has an ID
                         let iframeId = iframe.id;
                         if (!iframeId) {
                             iframeId = 'ytplayer_' + Math.random().toString(36).substring(7);
                             iframe.id = iframeId;
                         }

                         // Ensure enablejsapi=1 is present
                         let currentSrc = iframe.getAttribute('src');
                         if (!currentSrc) return;

                         const url = new URL(currentSrc);
                         if (url.searchParams.get('enablejsapi') !== '1') {
                             url.searchParams.set('enablejsapi', '1');
                             // Also good practice to set origin
                             if (!url.searchParams.has('origin')) {
                                url.searchParams.set('origin', window.location.origin);
                             }
                             iframe.setAttribute('src', url.toString());
                             // console.log(`Enhanced Analytics: Updated YT IFrame src for ${iframeId}`);

                             // IMPORTANT: If src is changed, the player needs re-initialization.
                             // This is tricky. Simplest is to assume API was loaded *after* iframe was in DOM.
                             // If iframes are added dynamically AFTER API load, this needs more robust handling.
                         }


                         // Avoid re-initializing if already a player
                         if (!players[iframeId] && YT && YT.Player) {
                            // console.log(`Enhanced Analytics: Initializing YouTube player for ${iframeId}`);
                             // Initialize player state before creating YT.Player
                             getPlayerState(iframeId);
                             try {
                                 new YT.Player(iframeId, {
                                     events: {
                                         'onReady': (event) => {
                                            // console.log(`Enhanced Analytics: YT Player ready: ${iframeId}`);
                                            // Initial state setup might be needed here if not done elsewhere
                                             getPlayerState(iframeId);
                                         },
                                         'onStateChange': onPlayerStateChange,
                                         'onError': onPlayerError
                                     }
                                 });
                             } catch(ytError) {
                                console.error(`Enhanced Analytics: Failed to initialize YT.Player for ${iframeId}:`, ytError);
                             }
                         }
                     }
                 } catch (e) {
                     console.error("Enhanced Analytics: Error processing iframe for YouTube tracking:", e, iframe);
                 }
            });
        }

        // Initial scan for players if API was already loaded
        findAndPrepareYouTubeFrames();

         // --- Handle dynamically added YouTube iframes ---
         // Use MutationObserver to watch for new iframes being added to the DOM
         if (window.MutationObserver) {
             const observer = new MutationObserver((mutationsList) => {
                 for (const mutation of mutationsList) {
                     if (mutation.type === 'childList') {
                         mutation.addedNodes.forEach(node => {
                             if (node.tagName === 'IFRAME') {
                                 findAndPrepareYouTubeFrames(); // Re-scan when an iframe is added
                             } else if (node.querySelectorAll) {
                                 // Check if added node contains iframes
                                 const iframes = node.querySelectorAll('iframe');
                                 if (iframes.length > 0) {
                                    findAndPrepareYouTubeFrames();
                                 }
                             }
                         });
                     }
                 }
             });

             observer.observe(document.body, { childList: true, subtree: true });
             // console.log("Enhanced Analytics: MutationObserver set up for dynamic YouTube IFrames.");
         } else {
            // console.warn("Enhanced Analytics: MutationObserver not supported. Dynamically added YouTube videos may not be tracked.");
         }
    }

    // Adapted from gov-dap.js _initHTMLVideoTracker
    function initHtmlMediaTracking() {
        if (!config.enableHtmlMediaTracking) return;

        const mediaStatus = {}; // Store state for each media element
        const milestones = config.videoMilestones.sort((a, b) => a - b);

        function getMediaState(mediaId) {
            if (!mediaStatus[mediaId]) {
                mediaStatus[mediaId] = {
                     progressReached: {}, // track milestones { 25: true }
                     current: 0,
                     isStarted: false,
                     mediaType: '', // 'video' or 'audio'
                     lastMilestoneReported: 0
                };
                milestones.forEach(m => mediaStatus[mediaId].progressReached[m] = false);
            }
            return mediaStatus[mediaId];
        }

        function resetMediaState(mediaId) {
             const state = getMediaState(mediaId);
             state.current = 0;
             state.isStarted = false;
             state.lastMilestoneReported = 0;
             milestones.forEach(m => state.progressReached[m] = false);
        }

        function buildMediaParams(element, state) {
            try {
                const duration = element.duration;
                const currentTime = element.currentTime;
                const percent = duration > 0 && isFinite(duration) ? Math.min(100, Math.floor((currentTime / duration) * 100)) : 0;
                const mediaType = state.mediaType || (element.tagName === 'VIDEO' ? 'video' : 'audio');
                 if(!state.mediaType) state.mediaType = mediaType; // Cache it

                 const baseParams = {
                     [`${mediaType}_duration`]: Math.round(duration || 0),
                     [`${mediaType}_current_time`]: Math.round(currentTime || 0),
                     [`${mediaType}_percent`]: percent,
                     [`${mediaType}_provider`]: `html5 ${mediaType}`,
                     [`${mediaType}_url`]: element.currentSrc || 'N/A',
                     [`${mediaType}_id`]: element.id || 'N/A'
                 };

                 // Attempt to get a title - often missing in HTML5 media
                 baseParams[`${mediaType}_title`] = element.title || element.getAttribute('aria-label') || element.currentSrc?.split('/').pop() || 'N/A';

                 return baseParams;

            } catch(e) {
                 console.error("Enhanced Analytics: Error building HTML media params:", e);
                 const mediaType = element.tagName === 'VIDEO' ? 'video' : 'audio';
                 return { [`${mediaType}_provider`]: `html5 ${mediaType}`, [`${mediaType}_error`]: e.message };
            }
        }

        function handleMediaEvent(event) {
            const element = event.target;
            const mediaId = element.id;
             if (!mediaId) return; // Element needs an ID

            const state = getMediaState(mediaId);
            const mediaParams = buildMediaParams(element, state);
            const mediaType = state.mediaType;

            switch (event.type) {
                case 'play':
                case 'playing': // Some browsers use playing after buffering
                     // Use 'playing' event as the canonical start/resume if available, fallback to 'play'
                     // Avoid double-sending if both fire close together (though usually one follows the other)
                    if (!state.isStarted && state.current <= 1) { // Consider it 'start' if near the beginning
                         state.isStarted = true;
                         sendGAEvent(`${mediaType}_start`, mediaParams);
                    } else if (state.isStarted) { // It's a resume
                         sendGAEvent(`${mediaType}_play`, mediaParams);
                    }
                    break;

                 case 'pause':
                     // Only send pause if not at the end and actually started
                    if (state.isStarted && !element.ended && Math.abs(element.currentTime - element.duration) > 0.5) {
                        sendGAEvent(`${mediaType}_pause`, mediaParams);
                    }
                    break;

                case 'ended':
                    if (state.isStarted) { // Only send complete if it was started
                         // Ensure final progress event fires
                        state.current = element.duration; // Ensure current time reflects end
                        trackMediaProgress(element, mediaId, true);

                        // Send complete event
                         const completeParams = buildMediaParams(element, state); // Rebuild params at end
                         completeParams[`${mediaType}_percent`] = 100;
                         sendGAEvent(`${mediaType}_complete`, completeParams);
                    }
                    resetMediaState(mediaId); // Reset state
                    break;

                case 'timeupdate':
                    if (!state.isStarted) return; // Don't track progress before start
                    state.current = element.currentTime;
                    trackMediaProgress(element, mediaId);
                    break;

                 case 'error':
                      const error = element.error;
                      mediaParams.error_code = error?.code || 'N/A';
                      mediaParams.error_message = error?.message || 'Unknown Error';
                      sendGAEvent(`${mediaType}_error`, mediaParams);
                      resetMediaState(mediaId);
                      break;

                  case 'abort': // User stopped download before completion
                  case 'emptied': // Network error caused media to be emptied
                  case 'stalled': // Browser trying to get data, but not available
                     // Optional: Track these states if needed
                     break;
                  case 'seeking':
                     state.lastMilestoneReported = 0; // Reset last reported milestone on seek
                     milestones.forEach(m => {
                         if(m > (buildMediaParams(element,state)[`${mediaType}_percent`])){
                              state.progressReached[m] = false;
                         }
                     });
                     break;
                 case 'seeked':
                      trackMediaProgress(element, mediaId); // Check progress after seek completes
                      break;

            }
        }

        function trackMediaProgress(element, mediaId, isEnded = false) {
             const state = getMediaState(mediaId);
             if (!state || !state.isStarted) return;

             const mediaParams = buildMediaParams(element, state);
             const currentPercent = mediaParams[`${state.mediaType}_percent`];

             milestones.forEach(milestone => {
                 // Ensure we report only once and that current percent truly passed the milestone
                 if (!state.progressReached[milestone] && currentPercent >= milestone && milestone > state.lastMilestoneReported) {
                     state.progressReached[milestone] = true;
                     state.lastMilestoneReported = milestone;

                     const milestoneParams = { ...mediaParams };
                     milestoneParams[`${state.mediaType}_percent`] = milestone; // Report the exact milestone
                     sendGAEvent(`${state.mediaType}_progress`, milestoneParams);
                 }
             });
        }


        function setupListenersForMedia(element) {
             let mediaId = element.id;
             if (!mediaId) {
                 mediaId = `htmlmedia_${Math.random().toString(36).substring(7)}`;
                 element.id = mediaId;
             }

             // Initialize state if not already done
             const state = getMediaState(mediaId);

             // Attach listeners - use flags to avoid duplicates if re-called
             if (!element._htmlMediaListenersAttached) {
                 element.addEventListener("play", handleMediaEvent, true);
                 element.addEventListener("playing", handleMediaEvent, true); // Often more reliable than 'play'
                 element.addEventListener("pause", handleMediaEvent, true);
                 element.addEventListener("ended", handleMediaEvent, true);
                 element.addEventListener("timeupdate", handleMediaEvent, true);
                 element.addEventListener("error", handleMediaEvent, true);
                 // Optional listeners
                 element.addEventListener("seeking", handleMediaEvent, true);
                 element.addEventListener("seeked", handleMediaEvent, true);
                 // element.addEventListener("abort", handleMediaEvent, true);
                 // element.addEventListener("emptied", handleMediaEvent, true);
                 // element.addEventListener("stalled", handleMediaEvent, true);
                 element._htmlMediaListenersAttached = true;
                 // console.log(`Enhanced Analytics: Attached listeners to HTML media: ${mediaId}`);
             }
        }

        // Find initial media elements
        document.querySelectorAll('video, audio').forEach(setupListenersForMedia);

         // --- Handle dynamically added media elements ---
         if (window.MutationObserver) {
             const observer = new MutationObserver((mutationsList) => {
                 for (const mutation of mutationsList) {
                     if (mutation.type === 'childList') {
                         mutation.addedNodes.forEach(node => {
                             if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
                                 setupListenersForMedia(node);
                             } else if (node.querySelectorAll) {
                                 node.querySelectorAll('video, audio').forEach(setupListenersForMedia);
                             }
                         });
                     }
                 }
             });
             observer.observe(document.body, { childList: true, subtree: true });
             // console.log("Enhanced Analytics: MutationObserver set up for dynamic HTML media.");
         } else {
            // console.warn("Enhanced Analytics: MutationObserver not supported. Dynamically added HTML media may not be tracked.");
         }
    }

    function initScrollTracking() {
        if (!config.enableScrollTracking || config.scrollThresholds.length === 0) return;

        const thresholds = config.scrollThresholds.sort((a, b) => a - b);
        let thresholdsTriggered = {}; // Reset on each page view (including SPA)

        function getScrollPercent() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
            const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight);
            const winHeight = window.innerHeight;

            if (docHeight <= winHeight) {
                return 100;
            }
            // Ensure denominator is not zero or negative
            const scrollableHeight = docHeight - winHeight;
            if (scrollableHeight <= 0) return 100;

            return Math.min(100, Math.max(0, Math.floor((scrollTop / scrollableHeight) * 100)));
        }

        function handleScroll() {
            const scrollPercent = getScrollPercent();
            thresholds.forEach(threshold => {
                if (!thresholdsTriggered[threshold] && scrollPercent >= threshold) {
                    thresholdsTriggered[threshold] = true;
                    sendGAEvent('scroll_depth', {
                        'percent_scrolled': threshold
                    });
                }
            });
        }

        let scrollTimeout;
        function debouncedScrollHandler() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(handleScroll, 250); // Check 250ms after scroll stops
        }

        // Use scrollend if available, fallback to debounced scroll
        const scrollEvent = 'onscrollend' in window ? 'scrollend' : 'scroll';
        const scrollHandler = scrollEvent === 'scrollend' ? handleScroll : debouncedScrollHandler;

        window.addEventListener(scrollEvent, scrollHandler, { passive: true });

        // Initial check in case the page loads already scrolled
        handleScroll();

        // Function to reset state on SPA navigation
        window._resetScrollTracking = () => {
            // console.log("Resetting scroll thresholds for SPA navigation");
            thresholdsTriggered = {};
            // Re-run initial check for the new page state
            setTimeout(handleScroll, 50); // Delay slightly for potential layout shifts
        };
    }


    function initWebVitalsTracking() {
        if (!config.enableWebVitals) return;
        try {
            const sendVital = (metric) => {
                const { name, delta, value, id, entries, rating, navigationType, attribution } = metric;

                // Extract attribution details (inspired by gov-dap.js)
                const debugTarget = attribution ? attribution.largestShiftTarget || attribution.element || attribution.eventTarget || '' : '(not set)';
                const eventType = attribution ? attribution.eventType || '' : '';
                const loadState = attribution ? attribution.loadState || '' : '';
                // Use appropriate time based on metric
                 let metricTime = 0;
                 if (name === 'LCP' && attribution?.lcpEntry) metricTime = attribution.lcpEntry.startTime;
                 else if (name === 'FID' && attribution?.eventTime) metricTime = attribution.eventTime;
                 else if (name === 'CLS' && attribution?.largestShiftTime) metricTime = attribution.largestShiftTime;
                 else if (name === 'INP' && attribution?.eventTime) metricTime = attribution.eventTime; // Assuming eventTime for INP interaction start


                const eventParams = {
                    // Standard params
                    'metric_name': name,
                    'metric_value': value,
                    'metric_delta': delta,
                    'metric_id': id,
                    'metric_rating': rating,
                    // Attribution/Debug params
                    'debug_navigation_type': navigationType,
                    'debug_target': debugTarget.toString().substring(0, 100), // Limit length
                     'debug_event_type': eventType,
                     'debug_load_state': loadState,
                     'event_time': parseFloat(metricTime?.toFixed(2) || 0) // Add relevant timing info
                };

                // Round values for cleaner reporting
                 if (name === 'CLS') {
                    eventParams.metric_value = parseFloat(value.toFixed(4));
                 } else if (['FCP', 'LCP', 'FID', 'TTFB', 'INP'].includes(name)){
                    eventParams.metric_value = parseFloat(value.toFixed(2));
                 }

                sendGAEvent('web_vitals', eventParams);
            };

            // Register listeners for each vital
            window.webVitals.onLCP(sendVital);
            window.webVitals.onFID(sendVital);
            window.webVitals.onCLS(sendVital, {reportAllChanges: true}); // Report all shifts for CLS debugging
            window.webVitals.onFCP(sendVital);
            window.webVitals.onTTFB(sendVital);
            window.webVitals.onINP(sendVital);

        } catch (error) {
            console.error("Enhanced Analytics: Error setting up Web Vitals tracking:", error);
            sendGAEvent('analytics_error', { 'error_type': 'web_vitals_setup', 'error_message': error.message });
        }
    }

    function initAdblockDetection() {
        if (!config.enableAdblockDetection) return;

        if (typeof window._ga_adblock_status !== 'undefined') {
            setGAUserProperty('has_adblocker', window._ga_adblock_status);
            return;
        }

        // Use a common technique - try fetching a known ad script
        fetch("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-store'
        })
        .then(() => {
            window._ga_adblock_status = false;
            setGAUserProperty('has_adblocker', false);
        })
        .catch(() => {
            window._ga_adblock_status = true;
            setGAUserProperty('has_adblocker', true);
        });
    }

    // Based on _URIHandler and _sendViewSearchResult from gov-dap.js
    function handleSearchTermCheck(currentUrl = window.location.href) {
         if (!config.enableSearchTracking || config.searchParams.length === 0) return;

         try {
             const url = new URL(currentUrl);
             const params = url.searchParams;
             let searchTerm = null;

             for (const paramName of config.searchParams) {
                 if (params.has(paramName)) {
                     searchTerm = params.get(paramName);
                     if (searchTerm) break; // Use the first one found
                 }
             }

             if (searchTerm) {
                 // Send view_search_results event
                 sendGAEvent('view_search_results', {
                     search_term: searchTerm // Will be redacted if needed by sendGAEvent
                 });
             }
         } catch (e) {
             console.error("Enhanced Analytics: Error checking for search terms:", e, currentUrl);
         }
    }


    function initSpaTracking() {
        if (!config.enableSpaTracking) return;

        let lastPath = scrubUrlParams(location.pathname + location.search + location.hash);

        const handleRouteChange = () => {
            // Small delay allows title to potentially update & DOM changes
            setTimeout(() => {
                const newPath = location.pathname + location.search + location.hash;
                const scrubbedNewPath = scrubUrlParams(newPath);

                if (scrubbedNewPath !== lastPath) {
                    // console.log(`Enhanced Analytics: SPA Route Change Detected: ${lastPath} -> ${scrubbedNewPath}`);
                    lastPath = scrubbedNewPath;

                    sendGAPageView(scrubbedNewPath, document.title); // Sends pageview & checks search terms

                    // Reset applicable tracking states
                    if (window._resetScrollTracking) {
                         window._resetScrollTracking();
                    }
                     // Adblock status check might be relevant if extensions change
                     if (config.enableAdblockDetection) {
                         initAdblockDetection();
                     }
                     // Re-initialize YT players if SPA framework replaces iframes
                     if (config.enableYouTubeTracking && typeof window.onYouTubeIframeAPIReady === 'function') {
                         // console.log("Enhanced Analytics: Re-scanning for YouTube players after SPA nav.");
                         window.onYouTubeIframeAPIReady();
                     }
                     // Re-initialize HTML5 media if SPA framework replaces players
                     if (config.enableHtmlMediaTracking) {
                         // console.log("Enhanced Analytics: Re-scanning for HTML media after SPA nav.");
                         document.querySelectorAll('video, audio').forEach(el => {
                             if (!el._htmlMediaListenersAttached) {
                                 initHtmlMediaTracking(); // Re-run the setup logic for potentially new elements
                             }
                         });
                     }
                }
            }, 150); // Increased delay slightly for complex SPAs
        };

        // Wrap history methods
        const wrapHistoryMethod = (method) => {
            const original = history[method];
            if (!original) return;
            try {
                history[method] = function (...args) {
                    const result = original.apply(this, args);
                    // Dispatch custom event *after* state change
                     window.dispatchEvent(new Event(`custom${method.toLowerCase()}`));
                     handleRouteChange();
                    return result;
                };
            } catch (e) {
                 console.error(`Enhanced Analytics: Could not wrap history.${method}`, e);
            }
        };

        wrapHistoryMethod('pushState');
        wrapHistoryMethod('replaceState');

        // Listen for popstate (browser back/forward buttons)
        window.addEventListener('popstate', handleRouteChange);
    }

    // --- Initial Setup & Execution ---
    function initialize() {
        // 1. Send initial config with custom dimensions (if any)
        // This typically handles the *first* pageview unless send_page_view: false is set in base snippet
        const initialConfig = {
            // Custom dimensions from data attribute
            ...config.customDimensionMap,
            // Potentially add other fixed dimensions here if needed
            // 'custom_tracker_version': 'v2.0'
        };
        // Scrub referrer before initial config
        if (document.referrer) {
             initialConfig.page_referrer = scrubUrlParams(document.referrer);
        }

        if (Object.keys(initialConfig).length > 0) {
            gtag('config', GA_MEASUREMENT_ID, initialConfig);
            // console.log("Enhanced Analytics: Initial config sent with custom dimensions:", initialConfig);
        }

        // 2. Check for search terms on initial load
        handleSearchTermCheck();

        // 3. Initialize features based on config
        if (config.enableAdblockDetection) initAdblockDetection();
        if (config.enableWebVitals) initWebVitalsTracking();
        if (config.enableAutoLinkTracking) initAutoLinkTracking();
        if (config.enableYouTubeTracking) initYouTubeTracking(); // Will attempt API load if needed
        if (config.enableHtmlMediaTracking) initHtmlMediaTracking();
        if (config.enableScrollTracking) initScrollTracking();
        if (config.enableSpaTracking) initSpaTracking();

        console.log("Enhanced Analytics v2 Initialized (ID: " + GA_MEASUREMENT_ID + ")");
    }

    // Wait for DOMContentLoaded for some trackers, but start API loading etc. earlier
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
