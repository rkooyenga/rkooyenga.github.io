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



})();
