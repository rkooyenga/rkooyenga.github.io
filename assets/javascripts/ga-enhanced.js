/*
 * Enhanced Analytics Script for Google Analytics (GA4) - v2.1 (Combined)
 * ===================================================================
 *
 * A BitCurrents experiment by Ray Kooyenga
 * Work in progress that makes no guarantee of stability or accuracy
 *
 * Robust tracking includes experimental support for: 
 *  YouTube, Vimeo, Twitter, HTML5 Media, auto-links, and more.
 *
 * Prerequisites:
 * 1. Google Analytics gtag.js snippet must be loaded BEFORE this script.
 * 2. Add your GA Measurement ID to the script tag.
 *
 * Configuration (via data attributes on the script tag):
 * - data-ga-measurement-id="G-XXXXXXXXXX" (Required)
 *
 * Feature Flags (Defaults shown):
 * - data-enable-auto-link-tracking="true"
 * - data-enable-youtube-tracking="true"     (Requires jsapi=1, see docs)
 * - data-enable-html-media-tracking="true"
 * - data-enable-vimeo-tracking="false"      (Default false as it requires Vimeo SDK)
 * - data-enable-twitter-tracking="false"    (Default false as it relies on twttr API)
 * - data-enable-scroll-tracking="true"
 * - data-enable-web-vitals="true"
 * - data-enable-adblock-detection="false"
 * - data-enable-spa-tracking="true"
 * - data-enable-search-tracking="true"
 * - data-enable-pii-redaction="false"       
 * - data-enable-form-tracking="false"       (Basic form start/submit)
 *
 * Configuration Parameters:
 * - data-download-extensions="pdf,zip,doc,docx,xls,xlsx,xlsm,ppt,pptx,exe,js,txt,csv,dxf,dwgd,rfa,rvt,dwfx,dwg,wmv,jpg,msi,7z,gz,tgz,tar,wma,mov,avi,mp3,mp4,mobi,epub,swf,rar"
 * - data-search-params="q,query,s,search,keyword,search_term,search_query,searchtext,search_keywords"
 * - data-video-milestones="10,25,50,75,90,95" (Percentages for video progress; 95 can act as "near_complete")
 * - data-scroll-thresholds="25,50,75,90"
 * - data-allowed-query-params="utm_*,gclid,dclid,_gl,gclsrc,wbraid,gbraid" (Supports wildcard *)
 * - data-pii-redaction-level="basic" (Options: "none", "basic", "strict")
 * - data-custom-dimension-map="{}" (JSON map for initial GA config, e.g., '{"site_topic": "Art"}')
 *
 * Public API:
 * - window.enhancedAnalytics.event('event_name', {param1: 'value1'});
 * - window.enhancedAnalytics.pageview('/new/path', 'New Title');
 * - window.enhancedAnalytics.redact('string_to_redact');
 */

(function () {
    const currentScript = document.currentScript;
    if (!currentScript) {
        console.error("Enhanced Analytics: Cannot find current script tag.");
        return;
    }

    // --- Configuration Reading ---
    const getConfig = (attributeName, defaultValue, type = 'string') => {
        const value = currentScript.getAttribute(`data-${attributeName}`);
        if (value === null || value === undefined) return defaultValue;
        if (type === 'boolean') return value.toLowerCase() === 'true';
        if (type === 'array') return value.split(',').map(s => s.trim()).filter(Boolean);
        if (type === 'intarray') return value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        if (type === 'json') {
            try { return JSON.parse(value); }
            catch (e) { console.error(`Enhanced Analytics: Invalid JSON in data-${attributeName}:`, value); return defaultValue; }
        }
        return value;
    };

    const GA_MEASUREMENT_ID = getConfig('ga-measurement-id', null);
    const config = {
        enableAutoLinkTracking: getConfig('enable-auto-link-tracking', true, 'boolean'),
        enableYouTubeTracking: getConfig('enable-youtube-tracking', true, 'boolean'),
        enableHtmlMediaTracking: getConfig('enable-html-media-tracking', true, 'boolean'),
        enableVimeoTracking: getConfig('enable-vimeo-tracking', false, 'boolean'),
        enableTwitterTracking: getConfig('enable-twitter-tracking', false, 'boolean'),
        enableScrollTracking: getConfig('enable-scroll-tracking', true, 'boolean'),
        enableWebVitals: getConfig('enable-web-vitals', true, 'boolean'),
        enableAdblockDetection: getConfig('enable-adblock-detection', false, 'boolean'),
        enableSpaTracking: getConfig('enable-spa-tracking', true, 'boolean'),
        enableSearchTracking: getConfig('enable-search-tracking', true, 'boolean'),
        enablePiiRedaction: getConfig('enable-pii-redaction', false, 'boolean'),
        enableFormTracking: getConfig('enable-form-tracking', false, 'boolean'),

        downloadExtensions: getConfig('download-extensions', 'pdf,zip,doc,docx,xls,xlsx,xlsm,ppt,pptx,exe,js,txt,csv,dxf,dwgd,rfa,rvt,dwfx,dwg,wmv,jpg,msi,7z,gz,tgz,tar,wma,mov,avi,mp3,mp4,mobi,epub,swf,rar', 'array'),
        searchParams: getConfig('search-params', 'q,query,s,search,keyword,search_term,search_query,searchtext,search_keywords', 'array'),
        videoMilestones: getConfig('video-milestones', '10,25,50,75,90,95', 'intarray').sort((a,b) => a-b),
        scrollThresholds: getConfig('scroll-thresholds', '25,50,75,90', 'intarray').sort((a,b) => a-b),
        allowedQueryParams: getConfig('allowed-query-params', 'utm_*,gclid,dclid,_gl,gclsrc,wbraid,gbraid', 'array'),
        piiRedactionLevel: getConfig('pii-redaction-level', 'basic'),
        customDimensionMap: getConfig('custom-dimension-map', {}, 'json')
    };

    // --- Pre-requisite Checks ---
    if (window._enhanced_analytics_loaded) return;
    if (typeof window.gtag !== 'function') { console.error("Enhanced Analytics: gtag.js not found."); return; }
    if (!GA_MEASUREMENT_ID) { console.error("Enhanced Analytics: GA Measurement ID not provided."); return; }
    window._enhanced_analytics_loaded = true;

    // --- Web Vitals Library ---
    var webVitals = function (e) {
        "use strict";var n,t,r,i,o,a=-1,c=function(e){addEventListener("pageshow",(function(n){n.persisted&&(a=n.timeStamp,e(n))}),!0)},u=function(){return window.performance&&performance.getEntriesByType&&performance.getEntriesByType("navigation")[0]},s=function(){var e=u();return e&&e.activationStart||0},f=function(e,n){var t=u(),r="navigate";a>=0?r="back-forward-cache":t&&(document.prerendering||s()>0?r="prerender":document.wasDiscarded?r="restore":t.type&&(r=t.type.replace(/_/g,"-")));return{name:e,value:void 0===n?-1:n,rating:"good",delta:0,entries:[],id:"v3-".concat(Date.now(),"-").concat(Math.floor(8999999999999*Math.random())+1e12),navigationType:r}},d=function(e,n,t){try{if(PerformanceObserver.supportedEntryTypes.includes(e)){var r=new PerformanceObserver((function(e){Promise.resolve().then((function(){n(e.getEntries())}))}));return r.observe(Object.assign({type:e,buffered:!0},t||{})),r}}catch(e){}},l=function(e,n,t,r){var i,o;return function(a){n.value>=0&&(a||r)&&((o=n.value-(i||0))||void 0===i)&&(i=n.value,n.delta=o,n.rating=function(e,n){return e>n[1]?"poor":e>n[0]?"needs-improvement":"good"}(n.value,t),e(n))}},p=function(e){requestAnimationFrame((function(){return requestAnimationFrame((function(){return e()}))}))},v=function(e){var n=function(n){"pagehide"!==n.type&&"hidden"!==document.visibilityState||e(n)};addEventListener("visibilitychange",n,!0),addEventListener("pagehide",n,!0)},m=function(e){var n=!1;return function(t){n||(e(t),n=!0)}},h=-1,g=function(){return"hidden"!==document.visibilityState||document.prerendering?1/0:0},T=function(e){"hidden"===document.visibilityState&&h>-1&&(h="visibilitychange"===e.type?e.timeStamp:0,C())},y=function(){addEventListener("visibilitychange",T,!0),addEventListener("prerenderingchange",T,!0)},C=function(){removeEventListener("visibilitychange",T,!0),removeEventListener("prerenderingchange",T,!0)},E=function(){return h<0&&(h=g(),y(),c((function(){setTimeout((function(){h=g(),y()}),0)}))),{get firstHiddenTime(){return h}}},L=function(e){document.prerendering?addEventListener("prerenderingchange",(function(){return e()}),!0):e()},b=[1800,3e3],S=function(e,n){n=n||{},L((function(){var t,r=E(),i=f("FCP"),o=d("paint",(function(e){e.forEach((function(e){"first-contentful-paint"===e.name&&(o.disconnect(),e.startTime<r.firstHiddenTime&&(i.value=Math.max(e.startTime-s(),0),i.entries.push(e),t(!0)))})}));o&&(t=l(e,i,b,n.reportAllChanges),c((function(r){i=f("FCP"),t=l(e,i,b,n.reportAllChanges),p((function(){i.value=performance.now()-r.timeStamp,t(!0)}))})))}))},w=[.1,.25],P=function(e,n){n=n||{},S(m((function(){var t,r=f("CLS",0),i=0,o=[],a=function(e){e.forEach((function(e){if(!e.hadRecentInput){var n=o[0],t=o[o.length-1];i&&e.startTime-t.startTime<1e3&&e.startTime-n.startTime<5e3?(i+=e.value,o.push(e)):(i=e.value,o=[e])}})),i>r.value&&(r.value=i,r.entries=o,t())},u=d("layout-shift",a);u&&(t=l(e,r,w,n.reportAllChanges),v((function(){a(u.takeRecords()),t(!0)})),c((function(){i=0,r=f("CLS",0),t=l(e,r,w,n.reportAllChanges),p((function(){return t()}))})),setTimeout(t,0))})))}),F={passive:!0,capture:!0},I=new Date,A=function(e,i){n||(n=i,t=e,r=new Date,k(removeEventListener),M())},M=function(){if(t>=0&&t<r-I){var e={entryType:"first-input",name:n.type,target:n.target,cancelable:n.cancelable,startTime:n.timeStamp,processingStart:n.timeStamp+t};i.forEach((function(n){n(e)})),i=[]}},D=function(e){if(e.cancelable){var n=(e.timeStamp>1e12?new Date:performance.now())-e.timeStamp;"pointerdown"==e.type?function(e,n){var t=function(){A(e,n),i()},r=function(){i()},i=function(){removeEventListener("pointerup",t,F),removeEventListener("pointercancel",r,F)};addEventListener("pointerup",t,F),addEventListener("pointercancel",r,F)}(n,e):A(n,e)}},k=function(e){["mousedown","keydown","touchstart","pointerdown"].forEach((function(n){return e(n,D,F)}))},B=[100,300],x=function(e,r){r=r||{},L((function(){var o,a=E(),u=f("FID"),s=function(e){e.startTime<a.firstHiddenTime&&(u.value=e.processingStart-e.startTime,u.entries.push(e),o(!0))},p=function(e){e.forEach(s)},h=d("first-input",p);o=l(e,u,B,r.reportAllChanges),h&&v(m((function(){p(h.takeRecords()),h.disconnect()}))),h&&c((function(){var a;u=f("FID"),o=l(e,u,B,r.reportAllChanges),i=[],t=-1,n=null,k(addEventListener),a=s,i.push(a),M()}))}))},N=0,R=1/0,H=0,O=function(e){e.forEach((function(e){e.interactionId&&(R=Math.min(R,e.interactionId),H=Math.max(H,e.interactionId),N=H?(H-R)/7+1:0)}))},_=function(){return o?N:performance.interactionCount||0},j=function(){"interactionCount"in performance||o||(o=d("event",O,{type:"event",buffered:!0,durationThreshold:0}))},q=[200,500],V=0,z=function(){return _()-V},G=[],J={},K=function(e){var n=G[G.length-1],t=J[e.interactionId];if(t||G.length<10||e.duration>n.latency){if(t)t.entries.push(e),t.latency=Math.max(t.latency,e.duration);else{var r={id:e.interactionId,latency:e.duration,entries:[e]};J[r.id]=r,G.push(r)}G.sort((function(e,n){return n.latency-e.latency})),G.splice(10).forEach((function(e){delete J[e.id]}))}},Q=function(e,n){n=n||{},L((function(){j();var t,r=f("INP"),i=function(e){e.forEach((function(e){(e.interactionId&&K(e),"first-input"===e.entryType)&&!G.some((function(n){return n.entries.some((function(n){return e.duration===n.duration&&e.startTime===n.startTime}))}))&&K(e)})),n=Math.min(G.length-1,Math.floor(z()/50));var n,i=G[n];i&&i.latency!==r.value&&(r.value=i.latency,r.entries=i.entries,t())},o=d("event",i,{durationThreshold:n.durationThreshold||40});t=l(e,r,q,n.reportAllChanges),o&&(o.observe({type:"first-input",buffered:!0}),v((function(){i(o.takeRecords()),r.value<0&&z()>0&&(r.value=0,r.entries=[]),t(!0)})),c((function(){G=[],V=_(),r=f("INP"),t=l(e,r,q,n.reportAllChanges)})))}));
        e.INPThresholds=q;var U=[2500,4e3],W={},X=function(e,n){n=n||{},L((function(){var t,r=E(),i=f("LCP"),o=function(e){var n=e[e.length-1];n&&n.startTime<r.firstHiddenTime&&(i.value=Math.max(n.startTime-s(),0),i.entries=[n],t())},a=d("largest-contentful-paint",o);if(a){t=l(e,i,U,n.reportAllChanges);var u=m((function(){W[i.id]||(o(a.takeRecords()),a.disconnect(),W[i.id]=!0,t(!0))}));["keydown","click"].forEach((function(e){addEventListener(e,u,!0)})),v(u),c((function(r){i=f("LCP"),t=l(e,i,U,n.reportAllChanges),p((function(){i.value=performance.now()-r.timeStamp,W[i.id]=!0,t(!0)}))}))}}))},Y=[800,1800],Z=function e(n){document.prerendering?L((function(){return e(n)})):"complete"!==document.readyState?addEventListener("load",(function(){return e(n)}),!0):setTimeout(n,0)},$=function(e,n){n=n||{};var t=f("TTFB"),r=l(e,t,Y,n.reportAllChanges);Z((function(){var i=u();if(i){var o=i.responseStart;if(o<=0||o>performance.now())return;t.value=Math.max(o-s(),0),t.entries=[i],r(!0),c((function(){t=f("TTFB",0),(r=l(e,t,Y,n.reportAllChanges))(!0)}))}}))};return e.CLSThresholds=w,e.FCPThresholds=b,e.FIDThresholds=B,e.INPThresholds=q,e.LCPThresholds=U,e.TTFBThresholds=Y,e.getCLS=P,e.getFCP=S,e.getFID=x,e.getINP=Q,e.getLCP=X,e.getTTFB=$,e.onCLS=P,e.onFCP=S,e.onFID=x,e.onINP=Q,e.onLCP=X,e.onTTFB=$,Object.defineProperty(e,"__esModule",{value:!0}),e}({});

// --- PII Redaction & URL Scrubbing ---
    const piiPatterns = { 
        basic: [ { name: 'EMAIL', regex: /[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi }, { name: 'NAME_PARAM', regex: /((?:first|last|full|user)[_-]?name)=[^&]+/gi }, { name: 'PWD_PARAM', regex: /(password|passwd|pwd)=[^&]+/gi }, ], strict: [ { name: 'EMAIL', regex: /[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi }, { name: 'PHONE', regex: /(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/gi }, { name: 'SSN', regex: /\d{3}[\s.-]?\d{2}[\s.-]?\d{4}/gi }, { name: 'NAME_PARAM', regex: /((?:first|last|middle|full|user|sur)[_-]?name)=[^&]+/gi }, { name: 'PWD_PARAM', regex: /((?:confirm[_-]?)?password|passwd|pwd)=[^&]+/gi }, { name: 'ADDR_PARAM', regex: /(address|street|addr)[1-2]?=[^&]+/gi }, { name: 'ZIP_PARAM', regex: /(zip|postal)[_-]?code=[^&]+/gi }, { name: 'DOB_PARAM', regex: /(dob|birth[_-]?date)=(?:\d{1,4}[-/.\s]){2}\d{1,4}/gi } ] };
    function redactPii(text, level = config.piiRedactionLevel) {
        if (!config.enablePiiRedaction || level === 'none' || typeof text !== 'string') { return text; }
        const patternsToUse = piiPatterns[level] || []; let redactedText = text;
        patternsToUse.forEach(pattern => { if (pattern.name.endsWith('_PARAM')) { redactedText = redactedText.replace(pattern.regex, `$1=[REDACTED_${pattern.name.replace('_PARAM','')}]`); } else { redactedText = redactedText.replace(pattern.regex, `[REDACTED_${pattern.name}]`); } });
        return redactedText;
    }
    function scrubUrlParams(url) {
        if (typeof url !== 'string' || url.indexOf('?') === -1) { return url; }
        try {
            const urlParts = url.split('?'); const baseUrl = urlParts[0]; const queryString = urlParts[1];
            const params = new URLSearchParams(queryString); const newParams = new URLSearchParams();
            const allowedLower = config.allowedQueryParams.map(p => p.toLowerCase());
            params.forEach((value, key) => {
                const keyLower = key.toLowerCase();
                let isAllowed = allowedLower.some(allowedKey => { if (allowedKey.endsWith('*')) { return keyLower.startsWith(allowedKey.slice(0, -1)); } return keyLower === allowedKey; });
                if (isAllowed) { newParams.append(key, config.enablePiiRedaction ? redactPii(value) : value); }
            });
            const newQueryString = newParams.toString(); return newQueryString ? `${baseUrl}?${newQueryString}` : baseUrl;
        } catch (e) { console.error("Enhanced Analytics: Error scrubbing URL params:", e, url); return config.enablePiiRedaction ? url.split('?')[0] + '?query=[REDACTED_PII_ERROR]' : url.split('?')[0]; }
    }

    // --- GA Helper Functions ---
    function sendGAEvent(eventName, eventParams = {}) { 
        if (typeof gtag === 'function' && GA_MEASUREMENT_ID) {
            const processedParams = {};
            for (const key in eventParams) {
                if (Object.prototype.hasOwnProperty.call(eventParams, key)) {
                    let value = eventParams[key];
                    if (config.enablePiiRedaction && typeof value === 'string') {
                        if (key.includes('url') || key.includes('link') || key.includes('href') || key === 'page_location' || key === 'page_referrer' || key === 'file_name') { value = scrubUrlParams(value); value = redactPii(value); }
                        else if (key.includes('text') || key.includes('label') || key.includes('term') || key.includes('title') || key === 'value' || key === 'debug_target') { value = redactPii(value, 'basic'); }
                    }
                    processedParams[key] = value;
                }
            }
            // console.log(`GA Event: ${eventName}`, processedParams);
            gtag('event', eventName, processedParams);
        }
    }
    function sendGAPageView(path = null, title = null) {
        if (typeof gtag === 'function' && GA_MEASUREMENT_ID) {
            const pagePath = path || location.pathname + location.search + location.hash;
            const pageTitle = title || document.title;
            const configUpdate = { 'page_path': scrubUrlParams(pagePath), 'page_title': config.enablePiiRedaction ? redactPii(pageTitle, 'basic') : pageTitle };
            // console.log(`GA PageView (Config Update):`, configUpdate);
            gtag('config', GA_MEASUREMENT_ID, configUpdate);
            handleSearchTermCheck(pagePath);
        }
    }
    function setGAUserProperty(propName, propValue) { 
         if (typeof gtag === 'function') { const userProp = {}; userProp[propName] = (config.enablePiiRedaction && typeof propValue === 'string') ? redactPii(propValue, 'basic') : propValue; gtag('set', 'user_properties', userProp); }
    }

    // --- Public API ---
    window.enhancedAnalytics = { event: sendGAEvent, pageview: sendGAPageView, redact: redactPii, config: config };

    // --- Feature Initialization Functions ---
    function initAutoLinkTracking() {
        if (!config.enableAutoLinkTracking) return;
        const domain = location.hostname.replace(/^www\./, "").toLowerCase();
        const downloadExtensionsRegex = new RegExp(`\\.(${config.downloadExtensions.join('|')})$`, 'i');
        const mailtoRegex = /^mailto:/i; const telRegex = /^tel:/i;
        function isDownload(href) { try { const path = new URL(href, location.origin).pathname; return downloadExtensionsRegex.test(path); } catch (e) { return false; } }
        function getFileExtension(href) { try { const path = new URL(href, location.origin).pathname; const match = path.match(downloadExtensionsRegex); return match ? match[1].toLowerCase() : ''; } catch (e) { return ''; } }
        function getFileName(href) { try { const path = new URL(href, location.origin).pathname; return path.substring(path.lastIndexOf('/') + 1); } catch (e) { return ''; } }
        const handleInteraction = (event) => {
            const link = event.target.closest('a'); if (!link || !link.href) return;
            // console.log('Enhanced Analytics: Link interaction detected!', event.type, link.href); // DEBUG
            const interactionType = (event.type === 'mousedown') ? 'click' : (event.type === 'keydown' && event.keyCode === 13) ? 'enter_key' : null;
            if (!interactionType) return;
            const href = link.href; const linkText = (link.innerText || link.textContent || '').trim().replace(/[\s\r\n]+/g, ' ');
            const linkId = link.id || 'N/A'; const linkClasses = link.className || 'N/A';
            let eventName = 'click'; let eventParams = { link_url: href, link_text: linkText, link_id: linkId, link_classes: linkClasses, interaction_type: interactionType, outbound: false };
            try {
                const linkUrl = new URL(href, location.origin); const linkHostname = linkUrl.hostname.replace(/^www\./, "").toLowerCase();
                if (mailtoRegex.test(href)) { eventName = 'email_click'; eventParams.link_domain = href.substring(href.indexOf('@') + 1); }
                else if (telRegex.test(href)) { eventName = 'telephone_click'; eventParams.link_url = href.substring(4); }
                else if (linkUrl.protocol.startsWith('http')) {
                    if (isDownload(href)) { eventName = 'file_download'; eventParams.file_extension = getFileExtension(href); eventParams.file_name = getFileName(href); eventParams.link_domain = linkHostname; }
                    else { eventParams.link_domain = linkHostname; }
                    if (linkHostname !== domain && !linkHostname.endsWith('.' + domain)) { eventParams.outbound = true; } else { if (eventName === 'click') eventName = 'navigation_click'; }
                } else { eventName = 'click'; eventParams.link_domain = 'N/A'; eventParams.outbound = true; }
                sendGAEvent(eventName, eventParams);
            } catch (e) { console.error("Enhanced Analytics: Error processing link interaction:", e, link); sendGAEvent('analytics_error', { 'error_type': 'link_tracking', 'error_message': e.message, 'link_href': href }); }
        };
        document.body.addEventListener("mousedown", handleInteraction, true); document.body.addEventListener("keydown", handleInteraction, true);
    }

    function initYouTubeTracking() { // ENHANCED YouTube Tracking
        if (!config.enableYouTubeTracking) return;

        const players = {};
        const milestones = config.videoMilestones; // Already sorted in config
        const highestMilestoneBeforeComplete = milestones.length > 0 ? milestones[milestones.length -1] : 0;

        function getPlayerState(playerId) {
            if (!players[playerId]) {
                players[playerId] = {
                    progressReached: {}, intervalId: null, videoData: null, isStarted: false,
                    lastReportedMilestone: 0
                };
                milestones.forEach(m => players[playerId].progressReached[m] = false);
            }
            return players[playerId];
        }

        function clearPlayerProgress(playerId) {
            const state = getPlayerState(playerId);
            milestones.forEach(m => state.progressReached[m] = false);
            state.isStarted = false; state.lastReportedMilestone = 0;
            if (state.intervalId) { clearInterval(state.intervalId); state.intervalId = null; }
            state.videoData = null; // Clear cached data
        }

        function buildVideoParams(player, playerState) {
            try {
                const videoData = playerState.videoData || player.getVideoData();
                if(!playerState.videoData && videoData && videoData.title) playerState.videoData = videoData;

                const duration = player.getDuration();
                const currentTime = player.getCurrentTime();
                const percent = duration > 0 ? Math.min(100, Math.floor((currentTime / duration) * 100)) : 0;

                return {
                    video_title: playerState.videoData?.title || 'N/A',
                    video_url: player.getVideoUrl() || 'N/A',
                    video_duration: Math.round(duration || 0),
                    video_current_time: Math.round(currentTime || 0),
                    video_percent: percent,
                    video_provider: 'youtube',
                    video_id: playerState.videoData?.video_id || (player.getVideoUrl() ? new URL(player.getVideoUrl()).searchParams.get('v') : 'N/A')
                };
            } catch (e) { return { video_provider: 'youtube', video_error: e.message }; }
        }

        function trackProgress(player, playerId, forceFinalCheck = false) {
            const playerState = getPlayerState(playerId);
            if (!playerState || !playerState.isStarted) return;

            const videoParams = buildVideoParams(player, playerState);
            const currentPercent = videoParams.video_percent;

            milestones.forEach(milestone => {
                if (!playerState.progressReached[milestone] && currentPercent >= milestone && milestone > playerState.lastReportedMilestone) {
                    playerState.progressReached[milestone] = true;
                    playerState.lastReportedMilestone = milestone;
                    const milestoneParams = { ...videoParams, video_percent: milestone };
                    sendGAEvent('video_progress', milestoneParams);
                }
            });

            if (forceFinalCheck && currentPercent >= highestMilestoneBeforeComplete && !playerState.progressReached[highestMilestoneBeforeComplete]) {
                 if (!playerState.progressReached[highestMilestoneBeforeComplete]) {
                    playerState.progressReached[highestMilestoneBeforeComplete] = true;
                    playerState.lastReportedMilestone = highestMilestoneBeforeComplete;
                    const finalMilestoneParams = { ...videoParams, video_percent: highestMilestoneBeforeComplete };
                    sendGAEvent('video_progress', finalMilestoneParams);
                }
            }
        }

        function onPlayerStateChange(event) {
            const player = event.target;
            const iframe = player.getIframe ? player.getIframe() : null;
            if (!iframe || !iframe.id) return;
            const playerId = iframe.id;

            const playerState = getPlayerState(playerId);
            let videoParams = buildVideoParams(player, playerState); // Build once

            switch (event.data) {
                case YT.PlayerState.PLAYING:
                    if (!playerState.isStarted) {
                        playerState.isStarted = true;
                        sendGAEvent('video_start', videoParams);
                    } else {
                        sendGAEvent('video_play', videoParams);
                    }
                    if (!playerState.intervalId && milestones.length > 0) {
                        playerState.intervalId = setInterval(() => trackProgress(player, playerId), 1000);
                    }
                    break;
                case YT.PlayerState.PAUSED:
                    if (!playerState.isStarted) return; // Don't send pause if never started
                    // Ensure progress is up-to-date before pausing
                    trackProgress(player, playerId, true);
                    sendGAEvent('video_pause', videoParams);
                    if (playerState.intervalId) { clearInterval(playerState.intervalId); playerState.intervalId = null; }
                    break;
                case YT.PlayerState.ENDED:
                    if (!playerState.isStarted) return; // Don't send complete if never started
                    trackProgress(player, playerId, true); // Force final progress check
                    videoParams = buildVideoParams(player, playerState); // Re-fetch params for accuracy
                    videoParams.video_percent = 100;
                    videoParams.video_current_time = videoParams.video_duration;
                    sendGAEvent('video_complete', videoParams);
                    clearPlayerProgress(playerId);
                    break;
                case YT.PlayerState.CUED:
                    clearPlayerProgress(playerId);
                    break;
                case YT.PlayerState.BUFFERING: // Optional: track buffering
                    break;
            }
        }

        function onPlayerError(event) {
            const player = event.target;
            const iframe = player.getIframe ? player.getIframe() : null;
            if (!iframe || !iframe.id) return;
            const playerId = iframe.id;
            const playerState = getPlayerState(playerId);
            const videoParams = buildVideoParams(player, playerState);
            videoParams.error_code = event.data;
            sendGAEvent('video_error', videoParams);
            clearPlayerProgress(playerId);
        }

        function findAndPrepareYouTubeFrames() {
            if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
                if(config.enableYouTubeTracking && !window._yt_api_warned_enh) {
                    // console.warn("Enhanced Analytics: YouTube API not ready for findAndPrepare. Will retry or wait for onYouTubeIframeAPIReady.");
                    window._yt_api_warned_enh = true;
                }
                return; // YT API not loaded yet
            }
            // console.log("Enhanced Analytics: (Re)Scanning for YouTube IFrames with API ready.");
            document.querySelectorAll('iframe[src*="youtube.com/embed/"], iframe[src*="youtube-nocookie.com/embed/"]').forEach(iframe => {
                try {
                    let iframeId = iframe.id;
                    if (!iframeId) {
                        const videoUrl = new URL(iframe.src);
                        const videoIdParam = videoUrl.pathname.split('/').pop() || Math.random().toString(36).substring(7);
                        iframeId = 'ytplayer_' + videoIdParam.replace(/[^a-zA-Z0-9_-]/g, '');
                        iframe.id = iframeId;
                    }

                    let currentSrc = iframe.getAttribute('src');
                    const url = new URL(currentSrc, window.location.origin); // Base URL for relative paths
                    let srcChanged = false;
                    if (url.searchParams.get('enablejsapi') !== '1') {
                        url.searchParams.set('enablejsapi', '1'); srcChanged = true;
                    }
                    if (!url.searchParams.has('origin')) {
                        url.searchParams.set('origin', window.location.origin); srcChanged = true;
                    }
                    if (srcChanged) iframe.setAttribute('src', url.toString());

                    if (!players[iframeId] || !players[iframeId].ytPlayerObject) { // Avoid re-initializing
                        // console.log(`Enhanced Analytics: Initializing YouTube player for ${iframeId}`);
                        getPlayerState(iframeId); // Initialize state store
                        const playerObj = new YT.Player(iframeId, {
                            events: { 'onReady': null, 'onStateChange': onPlayerStateChange, 'onError': onPlayerError }
                        });
                        players[iframeId].ytPlayerObject = playerObj; // Store the YT.Player instance
                    }
                } catch (e) { console.error("Enhanced Analytics: Error preparing YouTube iframe:", e, iframe); }
            });
        }

        // Global callback for YouTube API
        if (!window.onYouTubeIframeAPIReady) {
            window.onYouTubeIframeAPIReady = () => {
                // console.log("Enhanced Analytics: onYouTubeIframeAPIReady fired.");
                findAndPrepareYouTubeFrames();
            };
        } else {
            // If API might be ready before this script runs, or if onYouTubeIframeAPIReady is defined by another script
            findAndPrepareYouTubeFrames(); // Attempt initial scan
        }

        // Attempt to load YT API if not present
        if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
            if (!document.querySelector('script[src*="youtube.com/iframe_api"]') && !window._yt_api_loading_enh) {
                // console.log("Enhanced Analytics: Attempting to load YouTube IFrame API.");
                window._yt_api_loading_enh = true;
                var tag = document.createElement('script'); tag.src = "https://www.youtube.com/iframe_api";
                var firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            }
        }

        // MutationObserver for dynamically added YouTube iframes
        if (window.MutationObserver && !window._ytMutationObserverAttached) {
            const observer = new MutationObserver(mutationsList => {
                mutationsList.forEach(mutation => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1 && (node.matches('iframe[src*="youtube.com/embed/"], iframe[src*="youtube-nocookie.com/embed/"]') || node.querySelector('iframe[src*="youtube.com/embed/"], iframe[src*="youtube-nocookie.com/embed/"]'))) {
                                // console.log("Enhanced Analytics: Dynamic YouTube iframe detected by MutationObserver.");
                                findAndPrepareYouTubeFrames();
                            }
                        });
                    }
                });
            });
            observer.observe(document.body, { childList: true, subtree: true });
            window._ytMutationObserverAttached = true;
        }
    }

    function initHtmlMediaTracking() {
        if (!config.enableHtmlMediaTracking) return;
        const mediaStatus = {}; const milestones = config.videoMilestones;
        const highestMilestoneBeforeComplete = milestones.length > 0 ? milestones[milestones.length -1] : 0;

        function getMediaState(mediaId) {
            if (!mediaStatus[mediaId]) {
                mediaStatus[mediaId] = { progressReached: {}, current: 0, isStarted: false, mediaType: '', lastMilestoneReported: 0 };
                milestones.forEach(m => mediaStatus[mediaId].progressReached[m] = false);
            } return mediaStatus[mediaId];
        }
        function resetMediaState(mediaId) {
            const state = getMediaState(mediaId); state.current = 0; state.isStarted = false; state.lastMilestoneReported = 0;
            milestones.forEach(m => state.progressReached[m] = false);
        }
        function buildMediaParams(element, state) {
            try {
                const duration = element.duration; const currentTime = element.currentTime;
                const percent = duration > 0 && isFinite(duration) ? Math.min(100, Math.floor((currentTime / duration) * 100)) : 0;
                const mediaType = state.mediaType || (element.tagName === 'VIDEO' ? 'video' : 'audio');
                if(!state.mediaType) state.mediaType = mediaType;
                const baseParams = {
                    [`${mediaType}_duration`]: Math.round(duration || 0), [`${mediaType}_current_time`]: Math.round(currentTime || 0),
                    [`${mediaType}_percent`]: percent, [`${mediaType}_provider`]: `html5 ${mediaType}`,
                    [`${mediaType}_url`]: element.currentSrc || 'N/A', [`${mediaType}_id`]: element.id || 'N/A'
                };
                baseParams[`${mediaType}_title`] = element.title || element.getAttribute('aria-label') || element.currentSrc?.split('/').pop() || 'N/A';
                return baseParams;
            } catch(e) { const mediaType = element.tagName === 'VIDEO' ? 'video' : 'audio'; return { [`${mediaType}_provider`]: `html5 ${mediaType}`, [`${mediaType}_error`]: e.message }; }
        }
        function trackMediaProgress(element, mediaId, forceFinalCheck = false) {
            const state = getMediaState(mediaId); if (!state || !state.isStarted) return;
            const mediaParams = buildMediaParams(element, state); const currentPercent = mediaParams[`${state.mediaType}_percent`];
            milestones.forEach(milestone => {
                if (!state.progressReached[milestone] && currentPercent >= milestone && milestone > state.lastMilestoneReported) {
                    state.progressReached[milestone] = true; state.lastMilestoneReported = milestone;
                    const milestoneParams = { ...mediaParams }; milestoneParams[`${state.mediaType}_percent`] = milestone;
                    sendGAEvent(`${state.mediaType}_progress`, milestoneParams);
                }
            });
            if (forceFinalCheck && currentPercent >= highestMilestoneBeforeComplete && !state.progressReached[highestMilestoneBeforeComplete]) {
                 if (!state.progressReached[highestMilestoneBeforeComplete]) {
                    state.progressReached[highestMilestoneBeforeComplete] = true; state.lastMilestoneReported = highestMilestoneBeforeComplete;
                    const finalMilestoneParams = { ...mediaParams, [`${state.mediaType}_percent`]: highestMilestoneBeforeComplete };
                    sendGAEvent(`${state.mediaType}_progress`, finalMilestoneParams);
                }
            }
        }
        function handleMediaEvent(event) {
            const element = event.target; const mediaId = element.id; if (!mediaId) return;
            const state = getMediaState(mediaId); let mediaParams = buildMediaParams(element, state); const mediaType = state.mediaType;

            switch (event.type) {
                case 'play': case 'playing':
                    if (!state.isStarted && state.current <= 1) { state.isStarted = true; sendGAEvent(`${mediaType}_start`, mediaParams); }
                    else if (state.isStarted) { sendGAEvent(`${mediaType}_play`, mediaParams); }
                    break;
                case 'pause':
                    if (state.isStarted && !element.ended && Math.abs(element.currentTime - element.duration) > 0.5) { trackMediaProgress(element, mediaId, true); sendGAEvent(`${mediaType}_pause`, mediaParams); }
                    break;
                case 'ended':
                    if (state.isStarted) {
                        trackMediaProgress(element, mediaId, true);
                        mediaParams = buildMediaParams(element, state); // Rebuild
                        mediaParams[`${mediaType}_percent`] = 100; mediaParams[`${mediaType}_current_time`] = mediaParams[`${mediaType}_duration`];
                        sendGAEvent(`${mediaType}_complete`, mediaParams);
                    } resetMediaState(mediaId); break;
                case 'timeupdate': if (!state.isStarted) return; state.current = element.currentTime; trackMediaProgress(element, mediaId); break;
                case 'error': const error = element.error; mediaParams.error_code = error?.code || 'N/A'; mediaParams.error_message = error?.message || 'Unknown Error'; sendGAEvent(`${mediaType}_error`, mediaParams); resetMediaState(mediaId); break;
                case 'seeking': state.lastMilestoneReported = 0; milestones.forEach(m => { if (m > (buildMediaParams(element, state)[`${mediaType}_percent`])) { state.progressReached[m] = false; } }); break;
                case 'seeked': trackMediaProgress(element, mediaId); break;
            }
        }
        function setupListenersForMedia(element) {
            let mediaId = element.id; if (!mediaId) { mediaId = `htmlmedia_${Math.random().toString(36).substring(7)}`; element.id = mediaId; }
            getMediaState(mediaId); // Initialize state
            if (!element._htmlMediaListenersAttached) {
                ['play', 'playing', 'pause', 'ended', 'timeupdate', 'error', 'seeking', 'seeked'].forEach(type => element.addEventListener(type, handleMediaEvent, true));
                element._htmlMediaListenersAttached = true;
            }
        }
        document.querySelectorAll('video, audio').forEach(setupListenersForMedia);
        if (window.MutationObserver && !window._htmlMediaMutationObserverAttached) {
            const observer = new MutationObserver(mutationsList => { mutationsList.forEach(mutation => { if (mutation.type === 'childList') { mutation.addedNodes.forEach(node => { if (node.nodeType === 1 && (node.matches('video, audio') || node.querySelector('video, audio'))) { (node.matches('video, audio') ? [node] : Array.from(node.querySelectorAll('video, audio'))).forEach(setupListenersForMedia); } }); } }); });
            observer.observe(document.body, { childList: true, subtree: true }); window._htmlMediaMutationObserverAttached = true;
        }
    }

    function initVimeoTracking() { 
        if (!config.enableVimeoTracking) return;
        if (typeof Vimeo === 'undefined' || typeof Vimeo.Player === 'undefined') {
            if (!document.querySelector('script[src*="vimeo.com/api/player.js"]') && !window._vimeo_sdk_loading_enh) {
                window._vimeo_sdk_loading_enh = true; const vimeoScript = document.createElement('script'); vimeoScript.src = "https://player.vimeo.com/api/player.js"; vimeoScript.onload = initVimeoTracking; document.head.appendChild(vimeoScript);
            } return;
        }
        const vimeoPlayers = {}; const milestones = config.videoMilestones; const highestMilestoneBeforeComplete = milestones.length > 0 ? milestones[milestones.length -1] : 0;

        function getVimeoPlayerState(playerId) {
            if (!vimeoPlayers[playerId]) { vimeoPlayers[playerId] = { progressReached: {}, isStarted: false, duration: 0, title: 'N/A', videoId: 'N/A', videoUrl: 'N/A', lastReportedMilestone: 0 }; milestones.forEach(m => vimeoPlayers[playerId].progressReached[m] = false); }
            return vimeoPlayers[playerId];
        }
        function resetVimeoPlayerState(playerId) { const state = getVimeoPlayerState(playerId); state.isStarted = false; state.duration = 0; state.lastReportedMilestone = 0; milestones.forEach(m => state.progressReached[m] = false); }

        function buildVimeoParams(playerState, data = {}) {
            const currentTime = data.seconds || 0; const duration = playerState.duration || data.duration || 0;
            const percent = duration > 0 ? Math.min(100, Math.round(data.percent * 100 || (currentTime / duration * 100))) : 0;
            return {
                video_title: playerState.title, video_url: playerState.videoUrl, video_duration: Math.round(duration),
                video_current_time: Math.round(currentTime), video_percent: percent, video_provider: 'vimeo', video_id: playerState.videoId
            };
        }
        function trackVimeoProgress(playerState, data, forceFinalCheck = false) {
            if (!playerState.isStarted) return;
            const params = buildVimeoParams(playerState, data); const currentPercent = params.video_percent;
            milestones.forEach(milestone => {
                if (!playerState.progressReached[milestone] && currentPercent >= milestone && milestone > playerState.lastReportedMilestone) {
                    playerState.progressReached[milestone] = true; playerState.lastReportedMilestone = milestone;
                    const milestoneParams = { ...params, video_percent: milestone }; sendGAEvent('video_progress', milestoneParams);
                }
            });
            if (forceFinalCheck && currentPercent >= highestMilestoneBeforeComplete && !playerState.progressReached[highestMilestoneBeforeComplete]) {
                if (!playerState.progressReached[highestMilestoneBeforeComplete]) {
                    playerState.progressReached[highestMilestoneBeforeComplete] = true; playerState.lastReportedMilestone = highestMilestoneBeforeComplete;
                    const finalParams = { ...params, video_percent: highestMilestoneBeforeComplete }; sendGAEvent('video_progress', finalParams);
                }
            }
        }

        document.querySelectorAll('iframe[src*="player.vimeo.com/video/"]').forEach(iframe => {
            try {
                let iframeId = iframe.id; if (!iframeId) { iframeId = 'vimeoPlayer_' + (iframe.src.split('/').pop().split('?')[0] || Math.random().toString(36).substring(7)); iframe.id = iframeId; }
                if (vimeoPlayers[iframeId] && vimeoPlayers[iframeId].player) return;

                const player = new Vimeo.Player(iframe); const playerState = getVimeoPlayerState(iframeId); playerState.player = player;
                playerState.videoUrl = iframe.src; // Initial URL

                player.ready().then(() => {
                    Promise.all([player.getDuration(), player.getVideoTitle(), player.getVideoId(), player.getVideoUrl()])
                        .then(([duration, title, videoId, videoUrl]) => {
                            playerState.duration = duration; playerState.title = title; playerState.videoId = videoId; playerState.videoUrl = videoUrl;
                        }).catch(err => console.warn("Enhanced Analytics: Vimeo player data fetch error", err));
                });

                player.on('play', data => {
                    playerState.duration = data.duration; // Update on play
                    const params = buildVimeoParams(playerState, data);
                    if (!playerState.isStarted) { playerState.isStarted = true; sendGAEvent('video_start', params); }
                    else { sendGAEvent('video_play', params); }
                });
                player.on('pause', data => { if (!playerState.isStarted) return; trackVimeoProgress(playerState, data, true); sendGAEvent('video_pause', buildVimeoParams(playerState, data)); });
                player.on('ended', data => {
                    if (!playerState.isStarted) return;
                    trackVimeoProgress(playerState, data, true);
                    const params = buildVimeoParams(playerState, data); params.video_percent = 100; params.video_current_time = params.video_duration;
                    sendGAEvent('video_complete', params); resetVimeoPlayerState(iframeId);
                });
                player.on('timeupdate', data => { trackVimeoProgress(playerState, data); });
                player.on('error', err => { const params = buildVimeoParams(playerState); params.error_message = err.message; params.error_name = err.name; sendGAEvent('video_error', params); resetVimeoPlayerState(iframeId);});
                player.on('seeked', data => { // Reset milestones on seek
                    playerState.lastReportedMilestone = 0;
                    const currentPercentAfterSeek = Math.round((data.seconds / data.duration) * 100);
                    milestones.forEach(m => { playerState.progressReached[m] = m < currentPercentAfterSeek; });
                    trackVimeoProgress(playerState, data);
                });

            } catch (e) { console.error("Enhanced Analytics: Error setting up Vimeo player:", e, iframe); }
        });
        if (window.MutationObserver && !window._vimeoMutationObserverAttachedEnh) {
            const observer = new MutationObserver(mutationsList => { mutationsList.forEach(mutation => { if (mutation.type === 'childList') { mutation.addedNodes.forEach(node => { if (node.nodeType === 1 && (node.matches('iframe[src*="player.vimeo.com/video/"]') || node.querySelector('iframe[src*="player.vimeo.com/video/"]'))) { initVimeoTracking(); } }); } }); });
            observer.observe(document.body, { childList: true, subtree: true }); window._vimeoMutationObserverAttachedEnh = true;
        }
    }

    function initTwitterTracking() { 
        if (!config.enableTwitterTracking) return;
        if (typeof twttr === 'undefined' || typeof twttr.events === 'undefined' || typeof twttr.events.bind !== 'function') {
            if (!window._twitter_api_retry_enh) { window._twitter_api_retry_enh = setTimeout(initTwitterTracking, 2000); } return;
        } if (window._twitter_api_retry_enh) clearTimeout(window._twitter_api_retry_enh);

        function getTwitterWidgetType(element) { if (!element) return 'unknown'; if (element.classList && element.classList.contains('twitter-tweet')) return 'single_tweet'; if (element.classList && element.classList.contains('twitter-timeline')) return 'timeline'; if (element.tagName === 'IFRAME') { const src = element.src || ''; if (src.includes('/widget/') && src.includes('tweet')) return 'single_tweet_iframe'; if (src.includes('/widget/') && src.includes('timeline')) return 'timeline_iframe'; const parentTweet = element.closest('.twitter-tweet'); if(parentTweet) return 'single_tweet'; const parentTimeline = element.closest('.twitter-timeline'); if(parentTimeline) return 'timeline'; } return 'unknown'; }

        twttr.events.bind('loaded', event => { if (event.widgets && event.widgets.length > 0) { event.widgets.forEach(widget => { sendGAEvent('twitter_embed_loaded', { widget_id: widget.id || 'N/A', widget_type: getTwitterWidgetType(widget), page_location: scrubUrlParams(window.location.href) }); }); } });
        twttr.events.bind('rendered', event => { const wf = event.target; if (wf) { sendGAEvent('twitter_embed_rendered', { widget_id: wf.id || (wf.closest('.twitter-tweet') ? wf.closest('.twitter-tweet').id : 'N/A'), widget_type: getTwitterWidgetType(wf), page_location: scrubUrlParams(window.location.href) }); } });
        twttr.events.bind('tweet', event => { if (event.target && event.tweetId) { sendGAEvent('twitter_tweet_rendered', { tweet_id: event.tweetId, widget_id: event.target.id || (event.target.closest('.twitter-timeline') ? event.target.closest('.twitter-timeline').id : 'N/A'), widget_type: 'timeline_tweet', page_location: scrubUrlParams(window.location.href) }); } });
         // Auto link tracking should handle clicks within tweet text if they are standard <a> tags.
    }

    function initScrollTracking() { 
        if (!config.enableScrollTracking || config.scrollThresholds.length === 0) return;
        const thresholds = config.scrollThresholds; let thresholdsTriggered = {};
        function getScrollPercent() { const st = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0; const dh = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight); const wh = window.innerHeight; if (dh <= wh) return 100; const sh = dh - wh; if (sh <= 0) return 100; return Math.min(100, Math.max(0, Math.floor((st / sh) * 100))); }
        function handleScroll() { const sp = getScrollPercent(); thresholds.forEach(t => { if (!thresholdsTriggered[t] && sp >= t) { thresholdsTriggered[t] = true; sendGAEvent('scroll_depth', { 'percent_scrolled': t }); } }); }
        let scrollTimeout; function debouncedScrollHandler() { clearTimeout(scrollTimeout); scrollTimeout = setTimeout(handleScroll, 250); }
        const scrollEvent = 'onscrollend' in window ? 'scrollend' : 'scroll'; const scrollHandler = scrollEvent === 'scrollend' ? handleScroll : debouncedScrollHandler;
        window.addEventListener(scrollEvent, scrollHandler, { passive: true }); handleScroll();
        window._resetScrollTracking = () => { thresholdsTriggered = {}; setTimeout(handleScroll, 50); };
    }

    function initWebVitalsTracking() { 
        if (!config.enableWebVitals) return;
        try {
            const sendVital = (metric) => {
                const { name, delta, value, id, rating, navigationType, attribution } = metric;
                const debugTarget = attribution ? attribution.largestShiftTarget || attribution.element || attribution.eventTarget || '' : '(not set)';
                const eventType = attribution ? attribution.eventType || '' : ''; const loadState = attribution ? attribution.loadState || '' : '';
                let metricTime = 0; if (name === 'LCP' && attribution?.lcpEntry) metricTime = attribution.lcpEntry.startTime; else if (name === 'FID' && attribution?.eventTime) metricTime = attribution.eventTime; else if (name === 'CLS' && attribution?.largestShiftTime) metricTime = attribution.largestShiftTime; else if (name === 'INP' && attribution?.eventTime) metricTime = attribution.eventTime;
                const eventParams = { 'metric_name': name, 'metric_value': value, 'metric_delta': delta, 'metric_id': id, 'metric_rating': rating, 'debug_navigation_type': navigationType, 'debug_target': debugTarget.toString().substring(0, 100), 'debug_event_type': eventType, 'debug_load_state': loadState, 'event_time': parseFloat(metricTime?.toFixed(2) || 0) };
                if (name === 'CLS') eventParams.metric_value = parseFloat(value.toFixed(4)); else if (['FCP', 'LCP', 'FID', 'TTFB', 'INP'].includes(name)) eventParams.metric_value = parseFloat(value.toFixed(2));
                sendGAEvent('web_vitals', eventParams);
            };
            window.webVitals.onLCP(sendVital); window.webVitals.onFID(sendVital); window.webVitals.onCLS(sendVital, {reportAllChanges: true}); window.webVitals.onFCP(sendVital); window.webVitals.onTTFB(sendVital); window.webVitals.onINP(sendVital);
        } catch (error) { console.error("Enhanced Analytics: Error setting up Web Vitals:", error); sendGAEvent('analytics_error', { 'error_type': 'web_vitals_setup', 'error_message': error.message }); }
    }

    function initAdblockDetection() { 
        if (!config.enableAdblockDetection) return; if (typeof window._ga_adblock_status_enh !== 'undefined') { setGAUserProperty('has_adblocker', window._ga_adblock_status_enh); return; }
        fetch("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", { method: 'HEAD', mode: 'no-cors', cache: 'no-store' })
        .then(() => { window._ga_adblock_status_enh = false; setGAUserProperty('has_adblocker', false); })
        .catch(() => { window._ga_adblock_status_enh = true; setGAUserProperty('has_adblocker', true); });
    }

    function handleSearchTermCheck(currentUrl = window.location.href) {
         if (!config.enableSearchTracking || config.searchParams.length === 0) return;
         try { const url = new URL(currentUrl); const params = url.searchParams; let searchTerm = null;
             for (const paramName of config.searchParams) { if (params.has(paramName)) { searchTerm = params.get(paramName); if (searchTerm) break; } }
             if (searchTerm) { sendGAEvent('view_search_results', { search_term: searchTerm }); }
         } catch (e) { console.error("Enhanced Analytics: Error checking search terms:", e, currentUrl); }
    }

    function initSpaTracking() { 
        if (!config.enableSpaTracking) return;
        let lastPath = scrubUrlParams(location.pathname + location.search + location.hash);
        const handleRouteChange = () => {
            setTimeout(() => {
                const newPath = location.pathname + location.search + location.hash; const scrubbedNewPath = scrubUrlParams(newPath);
                if (scrubbedNewPath !== lastPath) {
                    lastPath = scrubbedNewPath; sendGAPageView(scrubbedNewPath, document.title);
                    if (window._resetScrollTracking) window._resetScrollTracking();
                    if (config.enableAdblockDetection) initAdblockDetection();
                    if (config.enableYouTubeTracking) initYouTubeTracking(); // Re-scan/init
                    if (config.enableHtmlMediaTracking) initHtmlMediaTracking(); // Re-scan/init
                    if (config.enableVimeoTracking) initVimeoTracking(); // Re-scan/init
                    if (config.enableTwitterTracking) initTwitterTracking(); // Re-scan/init
                    if (config.enableFormTracking) initFormTracking(true); // Re-scan for new forms
                }
            }, 150);
        };
        const wrap = (method) => { const orig = history[method]; if (!orig) return; try { history[method] = function (...a) { const r = orig.apply(this, a); window.dispatchEvent(new Event(`custom${method.toLowerCase()}`)); handleRouteChange(); return r; }; } catch (e) { console.error(`Enhanced Analytics: Error wrapping history.${method}`, e); } };
        wrap('pushState'); wrap('replaceState');
        window.addEventListener('popstate', handleRouteChange);
    }

    function initFormTracking(isSpaNav = false) {
        if (!config.enableFormTracking) return;

        function handleFormEvent(event) {
            const form = event.target.closest('form');
            if (!form) return;

            const formId = form.id || form.name || 'N/A';
            const formAction = form.action || 'N/A';
            const formMethod = form.method || 'N/A';
            let eventName = '';
            const eventParams = {
                form_id: formId,
                form_name: form.name || formId, // Alias
                form_action: formAction,
                form_method: formMethod,
                form_destination: scrubUrlParams(form.action || window.location.href) // Where it's likely going
            };

            if (event.type === 'submit') {
                eventName = 'form_submit';
                // Optional: capture some field values (PII caution!) if form.elements is used
            } else if (event.type === 'focusin' && !form._formTrackerStarted) {
                // 'focusin' bubbles, 'focus' does not.
                form._formTrackerStarted = true; // Mark form as started
                eventName = 'form_start';
                // Could add eventParams.field_name = event.target.name || event.target.id
            }

            if (eventName) {
                sendGAEvent(eventName, eventParams);
            }
        }

        // If not SPA nav, or if it is the first call
        if (!isSpaNav || !window._formListenersAttached) {
            document.body.addEventListener('submit', handleFormEvent, true); // Capture phase for submit
            document.body.addEventListener('focusin', handleFormEvent, true); // Capture for first interaction
            window._formListenersAttached = true;
        }
        // For SPA: re-evaluate forms on the new page view, existing listeners on body will catch them.
        // We just need to reset the _formTrackerStarted flag for any new forms.
        document.querySelectorAll('form').forEach(form => {
            delete form._formTrackerStarted; // Reset for SPA navs
        });
    }


    // --- Initial Setup & Execution ---
    function initialize() {
        const initialConfig = { ...config.customDimensionMap };
        if (document.referrer) initialConfig.page_referrer = scrubUrlParams(document.referrer);
        if (Object.keys(initialConfig).length > 0) gtag('config', GA_MEASUREMENT_ID, initialConfig);

        handleSearchTermCheck(); // Initial search check

        // Initialize features based on config
        if (config.enableAdblockDetection) initAdblockDetection();
        if (config.enableWebVitals) initWebVitalsTracking();
        if (config.enableAutoLinkTracking) initAutoLinkTracking();
        if (config.enableHtmlMediaTracking) initHtmlMediaTracking();
        if (config.enableYouTubeTracking) initYouTubeTracking(); // Attempts API load if needed
        if (config.enableVimeoTracking) initVimeoTracking();     // Attempts SDK load if needed
        if (config.enableTwitterTracking) initTwitterTracking();   // Waits for twttr API
        if (config.enableScrollTracking) initScrollTracking();
        if (config.enableFormTracking) initFormTracking();
        if (config.enableSpaTracking) initSpaTracking();

        console.log(`Enhanced Analytics v2.1 Initialized (ID: ${GA_MEASUREMENT_ID})`);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
