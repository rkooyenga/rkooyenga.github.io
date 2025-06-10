/*
 * Enhanced Analytics Script for Google Analytics (GA4) - v2.5.1 (Combined)
 * ===================================================================
 *
 * A BitCurrents experiment by Ray Kooyenga
 * Work in progress that makes no guarantee of stability or accuracy
 *
 * Changelog v2.5.1:
 * - FIXED: Critical typo in YouTube iframe preparation (`search_params_set` to `searchParams.set`).
 *
 * Changelog v2.5:
 * - FIXED: Replaced corrupted Web Vitals library that caused a critical syntax error.
 * - FIXED: Corrected YouTube playlist logic to reliably detect video changes.
 * - ENHANCED: Added tracking for video playback rate changes.
 * - ENHANCED: Standardized `video_is_live` and `video_is_muted` params across all providers.
 *
 * Robust tracking includes experimental support for:
 *  YouTube, Vimeo, Twitter, HTML5 Media, auto-links, and more.
 */

(function () {
    const currentScript = document.currentScript;
    if (!currentScript) { console.error("EA: No currentScript."); return; }

    const getConfig = (attr, def, type = 'string') => {
        const val = currentScript.getAttribute(`data-${attr}`);
        if (val === null || val === undefined) return def;
        if (type === 'boolean') return val.toLowerCase() === 'true';
        if (type === 'array') return val.split(',').map(s => s.trim()).filter(Boolean);
        if (type === 'intarray') return val.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        if (type === 'json') { try { return JSON.parse(val); } catch (e) { console.error(`EA: Invalid JSON data-${attr}`, val); return def; }}
        return val;
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

    if (window._enhanced_analytics_loaded) return;
    if (typeof window.gtag !== 'function') { console.error("EA: gtag.js not found."); return; }
    if (!GA_MEASUREMENT_ID) { console.error("EA: GA Measurement ID not provided."); return; }
    window._enhanced_analytics_loaded = true;


    /* --- Web Vitals Library (v3.5.2 - UNMINIFIED - For reliable copy/paste) --- */
(function (webVitals) {
  'use strict';

  var DURATION_THRESHOLD = 40; // For INP

  var global = typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : {};

  var PerformanceEventTiming = global.PerformanceEventTiming;

  var PerformanceObserver = global.PerformanceObserver;

  var performance = global.performance;

  var generateUniqueID = function () { return "v3-".concat(Date.now(), "-").concat(Math.floor(Math.random() * (9e12 - 1)) + 1e12); };

  var navigationEntry;
  var getNavigationEntry = function () {
      if (navigationEntry) {
          return navigationEntry;
      }
      else if (performance && performance.getEntriesByType) {
          var navEntries = performance.getEntriesByType('navigation');
          if (navEntries.length > 0) {
              navigationEntry = navEntries[0];
              return navigationEntry;
          }
      }
      return undefined;
  };

  var activationStart = 0;
  var getActivationStart = function () {
      var navEntry = getNavigationEntry();
      if (navEntry) {
          return navEntry.activationStart || 0;
      }
      return 0;
  };

  var bfcacheRestoreTime = -1;
  var onBFCacheRestore = function (cb) {
      addEventListener('pageshow', function (event) {
          if (event.persisted) {
              bfcacheRestoreTime = event.timeStamp;
              cb(event);
          }
      }, true);
  };

  var getNavigationType = function () {
      var navEntry = getNavigationEntry();
      if (bfcacheRestoreTime >= 0) {
          return 'back-forward-cache';
      }
      else if (navEntry) {
          if (document.prerendering || getActivationStart() > 0) {
              return 'prerender';
          }
          else if (document.wasDiscarded) {
              return 'restore';
          }
          else if (navEntry.type) {
              return navEntry.type.replace(/_/g, '-');
          }
      }
      return 'navigate';
  };

  var initMetric = function (name, value) {
      return {
          name: name,
          value: typeof value === 'undefined' ? -1 : value,
          rating: 'good',
          delta: 0,
          entries: [],
          id: generateUniqueID(),
          navigationType: getNavigationType(),
      };
  };

  var observe = function (type, callback, opts) {
      try {
          if (PerformanceObserver.supportedEntryTypes.includes(type)) {
              if (type === 'first-input' && !('PerformanceEventTiming' in global)) {
                  return;
              }
              var po = new PerformanceObserver(function (list) {
                  // Delay by a microtask to workaround a bug in Safari where the
                  // callback is invoked synchronously causing an infinite loop,
                  // see: https://github.com/GoogleChrome/web-vitals/issues/277
                  Promise.resolve().then(function () {
                      callback(list.getEntries());
                  });
              });
              po.observe(Object.assign({
                  type: type,
                  buffered: true,
              }, opts || {}));
              return po;
          }
      }
      catch (e) {
          // Do nothing.
      }
      return;
  };

  var onHidden = function (cb, once) {
      var onHiddenOrPageHide = function (event) {
          if (event.type === 'pagehide' || document.visibilityState === 'hidden') {
              cb(event);
              if (once) {
                  removeEventListener('visibilitychange', onHiddenOrPageHide, true);
                  removeEventListener('pagehide', onHiddenOrPageHide, true);
              }
          }
      };
      addEventListener('visibilitychange', onHiddenOrPageHide, true);
      // Some browsers have buggy implementations of visibilitychange,
      // so we use pagehide in addition, just to be safe.
      addEventListener('pagehide', onHiddenOrPageHide, true);
  };

  var firstHiddenTime = -1;
  var getFirstHidden = function () {
      if (firstHiddenTime < 0) {
          // If the document is hidden when this code runs, assume it was hidden
          // since navigation start. This isn't a perfect heuristic, but it's the
          // best we can do until an API is available to support querying past
          // visibilityState.
          firstHiddenTime = document.visibilityState === 'hidden' ? 0 : Infinity;
          onHidden(function (event) {
              firstHiddenTime = event.timeStamp;
          }, true);
      }
      return {
          get firstHiddenTime() {
              return firstHiddenTime;
          }
      };
  };

  var reportedMetricIDs = {};
  var report = function (metric, reportAllChanges) {
      if (metric.value >= 0) {
          if (reportAllChanges || !reportedMetricIDs[metric.id]) {
              // Implement your own report logic here.
              // console.log(metric.name, metric.value, metric);
              reportedMetricIDs[metric.id] = true; // Mark as reported
          }
      }
  };


  var createReporter = function (callback, metric, thresholds, reportAllChanges) {
      var prevValue;
      var delta;
      return function (forceReport) {
          if (metric.value >= 0) {
              if (forceReport || reportAllChanges) {
                  delta = metric.value - (prevValue || 0);
                  // Report the metric if there's a non-zero delta or if no previous
                  // value exists (which can happen in BFCache restores).
                  if (delta || prevValue === undefined) {
                      prevValue = metric.value;
                      metric.delta = delta;
                      metric.rating = getRating(metric.value, thresholds);
                      callback(metric);
                  }
              }
          }
      };
  };

  var getRating = function (value, thresholds) {
      if (value > thresholds[1]) {
          return 'poor';
      }
      if (value > thresholds[0]) {
          return 'needs-improvement';
      }
      return 'good';
  };

  var onBFCacheRestore$1 = function (cb) {
      addEventListener('pageshow', function (event) {
          if (event.persisted) {
              cb(event);
          }
      }, true);
  };


  var FCPThresholds = [1800, 3000];
  var onFCP = function (onReport, opts) {
      // Set defaults
      opts = opts || {};
      L((function () {
          var firstHidden = getFirstHidden();
          var metric = initMetric('FCP');
          var report = createReporter(onReport, metric, FCPThresholds, opts.reportAllChanges);
          var entryHandler = function (entry) {
              if (entry.name === 'first-contentful-paint') {
                  if (po) {
                      po.disconnect();
                  }
                  // Only report if the page wasn't hidden prior to FCP.
                  if (entry.startTime < firstHidden.firstHiddenTime) {
                      metric.value = Math.max(entry.startTime - getActivationStart(), 0);
                      metric.entries.push(entry);
                      report(true);
                  }
              }
          };
          var po = observe('paint', entryHandler);
          if (po) {
              onBFCacheRestore$1(function () {
                  metric = initMetric('FCP');
                  report = createReporter(onReport, metric, FCPThresholds, opts.reportAllChanges);
                  requestAnimationFrame(function () {
                      requestAnimationFrame(function () {
                          metric.value = performance.now() - bfcacheRestoreTime;
                          report(true);
                      });
                  });
              });
          }
      }));
  };

  var CLSThresholds = [0.1, 0.25];
  var onCLS = function (onReport, opts) {
      opts = opts || {};
      // Safari does not support layout-shift entries generated via observation,
      // so CLS is not reported on Safari.
      // https://bugs.webkit.org/show_bug.cgi?id=230318
      if (!PerformanceEventTiming) { // PerformanceEventTiming implies layout-shift is supported
          return;
      }
      L((function () {
          var metric = initMetric('CLS', 0);
          var report = createReporter(onReport, metric, CLSThresholds, opts.reportAllChanges);
          var sessionValue = 0;
          var sessionEntries = [];
          var entryHandler = function (entry) {
              // Only count layout shifts without recent user input.
              if (!entry.hadRecentInput) {
                  var firstSessionEntry = sessionEntries[0];
                  var lastSessionEntry = sessionEntries[sessionEntries.length - 1];
                  // If the entry occurred less than 1 second after the previous entry and
                  // less than 5 seconds after the first entry in the session, include the
                  // entry in the current session. Otherwise, start a new session.
                  if (sessionValue &&
                      sessionEntries.length !== 0 &&
                      entry.startTime - lastSessionEntry.startTime < 1000 &&
                      entry.startTime - firstSessionEntry.startTime < 5000) {
                      sessionValue += entry.value;
                      sessionEntries.push(entry);
                  }
                  else {
                      sessionValue = entry.value;
                      sessionEntries = [entry];
                  }
                  // If the current session value is larger than the current CLS value,
                  // update CLS and the entries contributing to it.
                  if (sessionValue > metric.value) {
                      metric.value = sessionValue;
                      metric.entries = sessionEntries;
                      report();
                  }
              }
          };
          var po = observe('layout-shift', entryHandler);
          if (po) {
              onHidden(function () {
                  // Force any pending records to be dispatched.
                  po.takeRecords().map(entryHandler);
                  report(true);
              });
              onBFCacheRestore$1(function () {
                  sessionValue = 0;
                  metric = initMetric('CLS', 0);
                  report = createReporter(onReport, metric, CLSThresholds, opts.reportAllChanges);
                  requestAnimationFrame(function () {
                      requestAnimationFrame(function () {
                          report();
                      });
                  });
              });
              // Add a timeout to report the final CLS value after  LPS.
              // setTimeout(report, 0);
          }
      }));
  };


  var LCPThresholds = [2500, 4000];
  var reportedLCPMetricIDs = {};
  var onLCP = function (onReport, opts) {
      opts = opts || {};
      L((function () {
          var firstHidden = getFirstHidden();
          var metric = initMetric('LCP');
          var report = createReporter(onReport, metric, LCPThresholds, opts.reportAllChanges);
          var entryHandler = function (entry) {
              // The startTime attribute returns the value of the renderTime if it is not 0,
              // and the value of the loadTime otherwise.
              var value = Math.max(entry.startTime - getActivationStart(), 0);
              // Only report if the page wasn't hidden prior to LCP.
              if (entry.startTime < firstHidden.firstHiddenTime) {
                  metric.value = value;
                  metric.entries.push(entry);
              }
              report();
          };
          var po = observe('largest-contentful-paint', entryHandler);
          if (po) {
              onHidden(function () {
                  if (!reportedLCPMetricIDs[metric.id]) {
                      po.takeRecords().map(entryHandler);
                      po.disconnect();
                      reportedLCPMetricIDs[metric.id] = true;
                      report(true);
                  }
              });
              onBFCacheRestore$1(function () {
                  metric = initMetric('LCP');
                  report = createReporter(onReport, metric, LCPThresholds, opts.reportAllChanges);
                  reportedLCPMetricIDs = {}; // Reset reported IDs
                  requestAnimationFrame(function () {
                      requestAnimationFrame(function () {
                          metric.value = performance.now() - bfcacheRestoreTime;
                          reportedLCPMetricIDs[metric.id] = true;
                          report(true);
                      });
                  });
              });
          }
      }));
  };


  var FIDThresholds = [100, 300];
  var onFID = function (onReport, opts) {
      opts = opts || {};
      L((function () {
          var firstHidden = getFirstHidden();
          var metric = initMetric('FID');
          var report = createReporter(onReport, metric, FIDThresholds, opts.reportAllChanges);
          var entryHandler = function (entry) {
              // Only report if the page wasn't hidden prior to FID.
              // The processingStart on an event entry can be 0 if the event is
              // a "pointerdown" event. This check handles that case.
              if (entry.processingStart > 0 && entry.startTime < firstHidden.firstHiddenTime) {
                  metric.value = entry.processingStart - entry.startTime;
                  metric.entries.push(entry);
                  report(true); // FID is a one-time metric.
              }
          };
          var po = observe('first-input', entryHandler);
          if (po) {
              onHidden(function () {
                  po.takeRecords().map(entryHandler);
                  po.disconnect();
              }, true);
              onBFCacheRestore$1(function () {
                  metric = initMetric('FID');
                  report = createReporter(onReport, metric, FIDThresholds, opts.reportAllChanges);
                  // TODO: Re-observe 'first-input' for BFCache restores.
                  // For now, do nothing as FID is not re-measured after BFCache.
              });
          }
      }));
  };

  var INPThresholds = [200, 500];
  var interactionCount = 0;
  var interactionCountTarget = 0;
  var interactionEntries = [];
  var interactionMap = {};
  var processInteractionEntry = function (entry) {
      // Negative interactionId values are reserved for entries that are not part
      // of an actual interaction. See: https://github.com/WICG/event-timing#interactionid-explainer
      if (entry.interactionId) {
          var _a = interactionMap[entry.interactionId] || { entries: [], latency: 0 }, entries = _a.entries, latency = _a.latency;
          entries.push(entry);
          // Latency is the max processingEnd - startTime for all entries in an
          // interaction.
          latency = Math.max(latency, entry.duration);
          interactionMap[entry.interactionId] = { entries: entries, latency: latency };
          // If the interaction is the Nth one (where N is 50), and its latency is
          // greater than the current Nth interaction, that means this interaction
          // is the new Nth interaction, and the old Nth interaction needs to be
          // removed from the list.
          if (interactionEntries.length < 10 || latency > interactionEntries[interactionEntries.length - 1].latency) {
              // If the map has a previous interaction with the same ID, remove it before
              // adding the new one.
              var prevInteraction = interactionEntries.find(function (i) { return i.id === entry.interactionId; });
              if (prevInteraction) {
                  interactionEntries.splice(interactionEntries.indexOf(prevInteraction), 1);
              }
              interactionEntries.push({
                  id: entry.interactionId,
                  latency: latency,
                  entries: entries,
              });
              interactionEntries.sort(function (a, b) { return b.latency - a.latency; });
              // Only keep the top 10 interactions by latency.
              interactionEntries.splice(10);
          }
      }
  };
  var onINP = function (onReport, opts) {
      opts = opts || {};
      L((function () {
          // If the browser doesn't support the interactionCount property, exit.
          // TODO: an alternative way to measure interactions.
          if (!('interactionCount' in performance)) {
              _(); // Ensure interactionCount is polyfilled if possible
              if (!('interactionCount' in performance)) return; // Still not supported
          }
          var firstHidden = getFirstHidden();
          var metric = initMetric('INP');
          var report = createReporter(onReport, metric, INPThresholds, opts.reportAllChanges);
          var entryHandler = function (entries) {
              entries.forEach(processInteractionEntry);
              // If the page was hidden prior to the entry being dispatched,
              // or after the entry was dispatched, then disregard the entry.
              if (firstHidden.firstHiddenTime < Infinity) {
                  interactionEntries = interactionEntries.filter(function (i) { return i.entries[0].startTime < firstHidden.firstHiddenTime; });
              }
              // interactionCountTarget will be the Nth interaction,
              // (where N is 50, but is an approximation for the 98th percentile).
              //
              // A new interactionCount is assigned to performance.interactionCount
              // after processing the entries in the event loop.
              interactionCountTarget = Math.min(interactionEntries.length - 1, Math.floor(O() / 50));
              var p98Interaction = interactionEntries[interactionCountTarget];
              if (p98Interaction && p98Interaction.latency !== metric.value) {
                  metric.value = p98Interaction.latency;
                  metric.entries = p98Interaction.entries;
                  report();
              }
          };
          var po = observe('event', entryHandler, { durationThreshold: opts.durationThreshold || DURATION_THRESHOLD });
          // If there's no PO, it means this browser doesn't support the event timing
          // API. In this case, exit.
          if (!po)
              return;
          // Observe 'first-input' entries as well, and add them to the INP
          // entries if they are not already there.
          // This is needed because 'first-input' entries are not always also
          // 'event' entries, and we want to ensure the first input is considered
          // for INP.
          observe('first-input', function (entries) {
              entries.forEach(function (entry) {
                  var interactionExists = interactionEntries.find(function (i) { return i.entries.some(function (e) { return e.entryType === 'first-input' && e.startTime === entry.startTime && e.duration === entry.duration; }); });
                  if (!interactionExists) {
                      processInteractionEntry(entry);
                  }
              });
          });
          onHidden(function () {
              // Force any pending records to be dispatched.
              po.takeRecords().map(processInteractionEntry);
              // INP should be reported after page hidden.
              report(true);
          });
          onBFCacheRestore$1(function () {
              interactionEntries = [];
              interactionMap = {};
              interactionCount = 0;
              interactionCountTarget = 0;
              metric = initMetric('INP');
              report = createReporter(onReport, metric, INPThresholds, opts.reportAllChanges);
              _(); // Re-init interactionCount polyfill
          });
      }));
  };

  var TTFBThresholds = [800, 1800];
  var onTTFB = function (onReport, opts) {
      opts = opts || {};
      L((function () {
          var metric = initMetric('TTFB');
          var report = createReporter(onReport, metric, TTFBThresholds, opts.reportAllChanges);
          var navigationEntry = getNavigationEntry();
          if (navigationEntry) {
              // Measure the TTFB value.
              // If the page was prerendered, use activationStart as the page start time.
              // Otherwise use the navigation start time.
              var value = Math.max(navigationEntry.responseStart - getActivationStart(), 0);
              // Only report if the page wasn't hidden prior to LCP.
              // The value should be greater than 0
              // and less than the current page time - 1 second (to be safe).
              if (value > 0 && value < (performance.now() - 1000)) {
                  metric.value = value;
                  metric.entries.push(navigationEntry);
                  report(true);
              }
              // Set an initial value on BFCache restore.
              onBFCacheRestore$1(function () {
                  metric = initMetric('TTFB', 0);
                  report = createReporter(onReport, metric, TTFBThresholds, opts.reportAllChanges);
                  report(true);
              });
          }
          else {
              // Do nothing if there's no navigation entry.
              // This can happen if the page was opened via a link with
              // `rel="prerender"`, and is not yet activated.
          }
      }));
  };

  // Polyfill interactionCount if the browser doesn't support it.
  var initInteractionCountPolyfill = function () {
      // If the browser supports interactionCount, don't polyfill.
      if ('interactionCount' in performance || r)
          return;
      r = observe('event', H, {
          type: 'event',
          buffered: true,
          durationThreshold: 0,
      });
      addEventListener('pointerup', function () { q++; });
      addEventListener('keyup', function () { q++; });
  };

  var isDocumentPrerendering = function () { return document.prerendering; };
  var onPrerenderFinish = function (callback) {
      if (isDocumentPrerendering()) {
          addEventListener('prerenderingchange', function () { return callback(); }, true);
      }
      else {
          callback();
      }
  };

  // Assign all functions to the public webVitals object.
  webVitals.onCLS = onCLS;
  webVitals.onFCP = onFCP;
  webVitals.onFID = onFID;
  webVitals.onINP = onINP;
  webVitals.onLCP = onLCP;
  webVitals.onTTFB = onTTFB;
  // Also expose the thresholds
  webVitals.CLSThresholds = CLSThresholds;
  webVitals.FCPThresholds = FCPThresholds;
  webVitals.FIDThresholds = FIDThresholds;
  webVitals.INPThresholds = INPThresholds;
  webVitals.LCPThresholds = LCPThresholds;
  webVitals.TTFBThresholds = TTFBThresholds;

  // Ensure the LCP and INP functions are exported for the getXXX functions.
  // The onXXX functions for CLS, FCP, FID, TTFB are already exported above.
  var getLCP = function (onReport, opts) { onLCP(onReport, opts); };
  var getINP = function (onReport, opts) { onINP(onReport, opts); };
  webVitals.getCLS = onCLS;
  webVitals.getFCP = onFCP;
  webVitals.getFID = onFID;
  webVitals.getINP = getINP;
  webVitals.getLCP = getLCP;
  webVitals.getTTFB = onTTFB;

})(window.webVitals = window.webVitals || {});
    

    const piiPatterns = { basic: [ { name: 'EMAIL', regex: /[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi }, { name: 'NAME_PARAM', regex: /((?:first|last|full|user)[_-]?name)=[^&]+/gi }, { name: 'PWD_PARAM', regex: /(password|passwd|pwd)=[^&]+/gi }, ], strict: [ { name: 'EMAIL', regex: /[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi }, { name: 'PHONE', regex: /(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/gi }, { name: 'SSN', regex: /\d{3}[\s.-]?\d{2}[\s.-]?\d{4}/gi }, { name: 'NAME_PARAM', regex: /((?:first|last|middle|full|user|sur)[_-]?name)=[^&]+/gi }, { name: 'PWD_PARAM', regex: /((?:confirm[_-]?)?password|passwd|pwd)=[^&]+/gi }, { name: 'ADDR_PARAM', regex: /(address|street|addr)[1-2]?=[^&]+/gi }, { name: 'ZIP_PARAM', regex: /(zip|postal)[_-]?code=[^&]+/gi }, { name: 'DOB_PARAM', regex: /(dob|birth[_-]?date)=(?:\d{1,4}[-/.\s]){2}\d{1,4}/gi } ] };
    function redactPii(text, level = config.piiRedactionLevel) { if (!config.enablePiiRedaction || level === 'none' || typeof text !== 'string') { return text; } const patternsToUse = piiPatterns[level] || []; let redactedText = text; patternsToUse.forEach(pattern => { if (pattern.name.endsWith('_PARAM')) { redactedText = redactedText.replace(pattern.regex, `$1=[REDACTED_${pattern.name.replace('_PARAM','')}]`); } else { redactedText = redactedText.replace(pattern.regex, `[REDACTED_${pattern.name}]`); } }); return redactedText; }
    function scrubUrlParams(url) { if (typeof url !== 'string' || url.indexOf('?') === -1) { return url; } try { const urlParts = url.split('?'); const baseUrl = urlParts[0]; const queryString = urlParts[1]; const params = new URLSearchParams(queryString); const newParams = new URLSearchParams(); const allowedLower = config.allowedQueryParams.map(p => p.toLowerCase()); params.forEach((value, key) => { const keyLower = key.toLowerCase(); let isAllowed = allowedLower.some(allowedKey => { if (allowedKey.endsWith('*')) { return keyLower.startsWith(allowedKey.slice(0, -1)); } return keyLower === allowedKey; }); if (isAllowed) { newParams.append(key, config.enablePiiRedaction ? redactPii(value) : value); } }); const newQueryString = newParams.toString(); return newQueryString ? `${baseUrl}?${newQueryString}` : baseUrl; } catch (e) { console.error("EA: Error scrubbing URL params:", e, url); return url.split('?')[0]; } }

    function sendGAEvent(eventName, eventParams = {}) { if (typeof gtag === 'function' && GA_MEASUREMENT_ID) { const processedParams = {}; for (const key in eventParams) { if (Object.prototype.hasOwnProperty.call(eventParams, key)) { let value = eventParams[key]; if (config.enablePiiRedaction && typeof value === 'string') { if (key.includes('url') || key.includes('link') || key.includes('href') || key === 'page_location' || key === 'page_referrer' || key === 'file_name') { value = scrubUrlParams(value); value = redactPii(value); } else if (key.includes('text') || key.includes('label') || key.includes('term') || key.includes('title') || key === 'value' || key === 'debug_target') { value = redactPii(value, 'basic'); } } processedParams[key] = value; } } gtag('event', eventName, processedParams); } }
    function sendGAPageView(path = null, title = null) { if (typeof gtag === 'function' && GA_MEASUREMENT_ID) { const pagePath = path || location.pathname + location.search + location.hash; const pageTitle = title || document.title; const configUpdate = { 'page_path': scrubUrlParams(pagePath), 'page_title': config.enablePiiRedaction ? redactPii(pageTitle, 'basic') : pageTitle }; gtag('config', GA_MEASUREMENT_ID, configUpdate); handleSearchTermCheck(pagePath); } }
    function setGAUserProperty(propName, propValue) { if (typeof gtag === 'function') { const userProp = {}; userProp[propName] = (config.enablePiiRedaction && typeof propValue === 'string') ? redactPii(propValue, 'basic') : propValue; gtag('set', 'user_properties', userProp); } }

    window.enhancedAnalytics = { event: sendGAEvent, pageview: sendGAPageView, redact: redactPii, config: config };

    function initAutoLinkTracking() { if (!config.enableAutoLinkTracking) return; const domain = location.hostname.replace(/^www\./, "").toLowerCase(); const downloadExtensionsRegex = new RegExp(`\\.(${config.downloadExtensions.join('|')})$`, 'i'); const mailtoRegex = /^mailto:/i; const telRegex = /^tel:/i; function isDownload(href) { try { const path = new URL(href, location.origin).pathname; return downloadExtensionsRegex.test(path); } catch (e) { return false; } } function getFileExtension(href) { try { const path = new URL(href, location.origin).pathname; const match = path.match(downloadExtensionsRegex); return match ? match[1].toLowerCase() : ''; } catch (e) { return ''; } } function getFileName(href) { try { const path = new URL(href, location.origin).pathname; return path.substring(path.lastIndexOf('/') + 1); } catch (e) { return ''; } } const handleInteraction = (event) => { const link = event.target.closest('a'); if (!link || !link.href) return; const isPrimaryClick = event.type === 'mousedown' && event.button === 0; const isEnterKey = event.type === 'keydown' && event.keyCode === 13; if (!isPrimaryClick && !isEnterKey) return; const interactionType = isPrimaryClick ? 'click' : 'enter_key'; const href = link.href; const linkText = (link.innerText || link.textContent || '').trim().replace(/[\s\r\n]+/g, ' '); const linkId = link.id || 'N/A'; const linkClasses = link.className || 'N/A'; let eventName = 'click'; let eventParams = { link_url: href, link_text: linkText, link_id: linkId, link_classes: linkClasses, interaction_type: interactionType, outbound: false }; try { const linkUrl = new URL(href, location.origin); const linkHostname = linkUrl.hostname.replace(/^www\./, "").toLowerCase(); if (mailtoRegex.test(href)) { eventName = 'email_click'; eventParams.link_domain = href.substring(href.indexOf('@') + 1); } else if (telRegex.test(href)) { eventName = 'telephone_click'; eventParams.link_url = href.substring(4); } else if (linkUrl.protocol.startsWith('http')) { if (isDownload(href)) { eventName = 'file_download'; eventParams.file_extension = getFileExtension(href); eventParams.file_name = getFileName(href); eventParams.link_domain = linkHostname; } else { eventParams.link_domain = linkHostname; } if (linkHostname !== domain && !linkHostname.endsWith('.' + domain)) { eventParams.outbound = true; } else { if (eventName === 'click') eventName = 'navigation_click'; } } else { eventName = 'click'; eventParams.link_domain = 'N/A'; eventParams.outbound = true; } sendGAEvent(eventName, eventParams); } catch (e) { console.error("EA: Error processing link interaction:", e, link); sendGAEvent('analytics_error', { 'error_type': 'link_tracking', 'error_message': e.message, 'link_href': href }); } }; document.body.addEventListener("mousedown", handleInteraction, true); document.body.addEventListener("keydown", handleInteraction, true); }

    /* --- Universal Video Tracking Utilities --- */
    function _resetVideoMilestonesOnSeek(playerState, currentPercent) { playerState.lastReportedMilestone = 0; config.videoMilestones.forEach(m => { playerState.progressReached[m] = m < currentPercent; }); }

    function initYouTubeTracking() { if (!config.enableYouTubeTracking) return; const players = {}; const milestones = config.videoMilestones; function getPlayerState(playerId) { if (!players[playerId]) { players[playerId] = { progressReached: {}, intervalId: null, isStarted: false, lastReportedMilestone: 0, lastTime: 0, hasSeeked: false, currentVideoId: null, isLive: false, playbackRate: 1, duration: 0 }; milestones.forEach(m => players[playerId].progressReached[m] = false); } return players[playerId]; } function clearPlayerProgress(playerId) { const state = getPlayerState(playerId); milestones.forEach(m => state.progressReached[m] = false); state.isStarted = false; state.lastReportedMilestone = 0; state.lastTime = 0; state.hasSeeked = false; state.isLive = false; state.currentVideoId = null; state.playbackRate = 1; state.duration = 0; if (state.intervalId) { clearInterval(state.intervalId); state.intervalId = null; } } function buildVideoParams(player, playerState) { try { const duration = player.getDuration(); const isLive = !isFinite(duration); const currentTime = player.getCurrentTime(); const percent = !isLive && duration > 0 ? Math.min(100, Math.floor((currentTime / duration) * 100)) : 0; const videoData = player.getVideoData(); return { video_title: videoData?.title || 'N/A', video_url: player.getVideoUrl() || 'N/A', video_duration: isLive ? 0 : Math.round(duration || 0), video_current_time: Math.round(currentTime || 0), video_percent: percent, video_provider: 'youtube', video_id: videoData?.video_id || 'N/A', video_is_muted: player.isMuted(), video_is_live: isLive, video_playback_rate: player.getPlaybackRate() }; } catch (e) { return { video_provider: 'youtube', video_error: e.message }; } } function handleYouTubePlaylistChange(player, playerState, currentVideoParams) { const newVideoId = currentVideoParams.video_id; if (newVideoId && playerState.currentVideoId && newVideoId !== playerState.currentVideoId) { const oldVideoParams = { ...currentVideoParams, video_id: playerState.currentVideoId, video_percent: 100, video_current_time: playerState.isLive ? currentVideoParams.video_current_time : playerState.duration }; sendGAEvent('video_complete', oldVideoParams); clearPlayerProgress(player.getIframe().id); playerState.currentVideoId = newVideoId; playerState.isStarted = true; playerState.isLive = currentVideoParams.video_is_live; playerState.duration = currentVideoParams.video_duration; sendGAEvent('video_start', currentVideoParams); return true; } return false; } function trackProgress(player, playerId) { const playerState = getPlayerState(playerId); if (!playerState || !playerState.isStarted || playerState.isLive) return; const videoParams = buildVideoParams(player, playerState); const currentTime = videoParams.video_current_time; if (Math.abs(currentTime - playerState.lastTime) > 2 && !playerState.isLive) { playerState.hasSeeked = true; _resetVideoMilestonesOnSeek(playerState, videoParams.video_percent); } playerState.lastTime = currentTime; const currentPercent = videoParams.video_percent; milestones.forEach(milestone => { if (!playerState.progressReached[milestone] && currentPercent >= milestone && milestone > playerState.lastReportedMilestone) { playerState.progressReached[milestone] = true; playerState.lastReportedMilestone = milestone; const milestoneParams = { ...videoParams, video_percent: milestone }; sendGAEvent('video_progress', milestoneParams); } }); } function onPlayerStateChange(event) { const player = event.target; const iframe = player.getIframe ? player.getIframe() : null; if (!iframe || !iframe.id) return; const playerId = iframe.id; const playerState = getPlayerState(playerId); let videoParams = buildVideoParams(player, playerState); switch (event.data) { case YT.PlayerState.PLAYING: if (handleYouTubePlaylistChange(player, playerState, videoParams)) break; if (!playerState.isStarted) { playerState.isStarted = true; playerState.currentVideoId = videoParams.video_id; playerState.isLive = videoParams.video_is_live; playerState.duration = videoParams.video_duration; sendGAEvent('video_start', videoParams); } else { if (playerState.hasSeeked) { sendGAEvent('video_seek', videoParams); playerState.hasSeeked = false; } sendGAEvent('video_play', videoParams); } if (!playerState.intervalId && !playerState.isLive && milestones.length > 0) { playerState.lastTime = player.getCurrentTime(); playerState.intervalId = setInterval(() => trackProgress(player, playerId), 1000); } break; case YT.PlayerState.PAUSED: if (!playerState.isStarted) return; if (playerState.intervalId) { clearInterval(playerState.intervalId); playerState.intervalId = null; } sendGAEvent('video_pause', videoParams); break; case YT.PlayerState.ENDED: if (!playerState.isStarted) return; videoParams.video_percent = 100; if (!playerState.isLive) videoParams.video_current_time = videoParams.video_duration; sendGAEvent('video_complete', videoParams); clearPlayerProgress(playerId); break; case YT.PlayerState.CUED: clearPlayerProgress(playerId); break; } } function onPlaybackRateChange(event) { const player = event.target; const playerState = getPlayerState(player.getIframe().id); if (!playerState.isStarted) return; playerState.playbackRate = event.data; const params = buildVideoParams(player, playerState); sendGAEvent('video_playback_rate_change', params); } function onPlayerError(event) { const player = event.target; const iframe = player.getIframe ? player.getIframe() : null; if (!iframe || !iframe.id) return; const playerId = iframe.id; const videoParams = buildVideoParams(player, getPlayerState(playerId)); videoParams.error_code = event.data; sendGAEvent('video_error', videoParams); clearPlayerProgress(playerId); } function findAndPrepareYouTubeFrames() { if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') return; document.querySelectorAll('iframe[src*="youtube.com/embed/"], iframe[src*="youtube-nocookie.com/embed/"]').forEach(iframe => { try { let iframeId = iframe.id; if (!iframeId) { const videoUrl = new URL(iframe.src); const videoIdParam = videoUrl.pathname.split('/').pop() || Math.random().toString(36).substring(7); iframeId = 'ytplayer_' + videoIdParam.replace(/[^a-zA-Z0-9_-]/g, ''); iframe.id = iframeId; } let currentSrc = iframe.getAttribute('src'); const url = new URL(currentSrc, window.location.origin); if (url.searchParams.get('enablejsapi') !== '1') { url.searchParams.set('enablejsapi', '1'); /* CORRECTED LINE */ iframe.setAttribute('src', url.toString()); } if (!players[iframeId] || !players[iframeId].ytPlayerObject) { getPlayerState(iframeId); const playerObj = new YT.Player(iframeId, { events: { 'onStateChange': onPlayerStateChange, 'onError': onPlayerError, 'onPlaybackRateChange': onPlaybackRateChange } }); players[iframeId].ytPlayerObject = playerObj; } } catch (e) { console.error("EA: Error preparing YouTube iframe:", e, iframe); } }); } if (!window.onYouTubeIframeAPIReady) { window.onYouTubeIframeAPIReady = () => { findAndPrepareYouTubeFrames(); }; } else { findAndPrepareYouTubeFrames(); } if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') { if (!document.querySelector('script[src*="youtube.com/iframe_api"]') && !window._yt_api_loading_enh) { window._yt_api_loading_enh = true; var tag = document.createElement('script'); tag.src = "https://www.youtube.com/iframe_api"; var firstScriptTag = document.getElementsByTagName('script')[0]; firstScriptTag.parentNode.insertBefore(tag, firstScriptTag); } } if (window.MutationObserver && !window._ytMutationObserverAttached) { const observer = new MutationObserver(mutationsList => { mutationsList.forEach(mutation => { if (mutation.type === 'childList') { mutation.addedNodes.forEach(node => { if (node.nodeType === 1 && (node.matches('iframe[src*="youtube.com/embed/"]') || node.querySelector('iframe[src*="youtube.com/embed/"]'))) { findAndPrepareYouTubeFrames(); } }); } }); }); observer.observe(document.body, { childList: true, subtree: true }); window._ytMutationObserverAttached = true; } }

    function initHtmlMediaTracking() { if (!config.enableHtmlMediaTracking) return; const mediaStatus = {}; const milestones = config.videoMilestones; function getMediaState(mediaId) { if (!mediaStatus[mediaId]) { mediaStatus[mediaId] = { progressReached: {}, isStarted: false, mediaType: '', lastReportedMilestone: 0, currentSrc: null, isLive: false, duration: 0 }; milestones.forEach(m => mediaStatus[mediaId].progressReached[m] = false); } return mediaStatus[mediaId]; } function resetMediaState(mediaId) { const state = getMediaState(mediaId); state.isStarted = false; state.lastReportedMilestone = 0; state.isLive = false; state.currentSrc = null; state.duration = 0; milestones.forEach(m => state.progressReached[m] = false); } function buildMediaParams(element, state) { try { const duration = element.duration; const isLive = duration === Infinity; const mediaType = state.mediaType || (element.tagName === 'VIDEO' ? 'video' : 'audio'); if(!state.mediaType) state.mediaType = mediaType; const baseParams = { [`${mediaType}_duration`]: isLive ? 0 : Math.round(duration || 0), [`${mediaType}_current_time`]: Math.round(element.currentTime || 0), [`${mediaType}_percent`]: isLive || duration <= 0 ? 0 : Math.min(100, Math.floor((element.currentTime / duration) * 100)), [`${mediaType}_provider`]: `html5 ${mediaType}`, [`${mediaType}_url`]: element.currentSrc || 'N/A', [`${mediaType}_id`]: element.id || 'N/A', [`${mediaType}_is_muted`]: element.muted, [`${mediaType}_is_live`]: isLive, [`${mediaType}_playback_rate`]: element.playbackRate }; baseParams[`${mediaType}_title`] = element.title || element.getAttribute('aria-label') || element.currentSrc?.split('/').pop() || 'N/A'; return baseParams; } catch(e) { const mediaType = element.tagName === 'VIDEO' ? 'video' : 'audio'; return { [`${mediaType}_provider`]: `html5 ${mediaType}`, [`${mediaType}_error`]: e.message }; } } function trackMediaProgress(element, mediaId) { const state = getMediaState(mediaId); if (!state || !state.isStarted || state.isLive) return; const mediaParams = buildMediaParams(element, state); const currentPercent = mediaParams[`${state.mediaType}_percent`]; milestones.forEach(milestone => { if (!state.progressReached[milestone] && currentPercent >= milestone && milestone > state.lastReportedMilestone) { state.progressReached[milestone] = true; state.lastReportedMilestone = milestone; const milestoneParams = { ...mediaParams }; milestoneParams[`${state.mediaType}_percent`] = milestone; sendGAEvent(`${state.mediaType}_progress`, milestoneParams); } }); } function handleMediaEvent(event) { const element = event.target; const mediaId = element.id; if (!mediaId) return; const state = getMediaState(mediaId); let mediaParams; const mediaType = state.mediaType || (element.tagName === 'VIDEO' ? 'video' : 'audio'); switch (event.type) { case 'loadstart': if (state.isStarted && state.currentSrc && state.currentSrc !== element.currentSrc) { let oldParams = buildMediaParams(element, state); oldParams[`${mediaType}_percent`] = 100; if (!state.isLive) oldParams[`${mediaType}_current_time`] = oldParams[`${mediaType}_duration`]; sendGAEvent(`${mediaType}_complete`, oldParams); resetMediaState(mediaId); } state.currentSrc = element.currentSrc; break; case 'playing': mediaParams = buildMediaParams(element, state); if (!state.isStarted) { state.isStarted = true; state.isLive = mediaParams[`${mediaType}_is_live`]; state.duration = mediaParams[`${mediaType}_duration`]; sendGAEvent(`${mediaType}_start`, mediaParams); } else { sendGAEvent(`${mediaType}_play`, mediaParams); } break; case 'pause': if (state.isStarted && !element.ended) { sendGAEvent(`${mediaType}_pause`, buildMediaParams(element, state)); } break; case 'ended': if (state.isStarted) { mediaParams = buildMediaParams(element, state); mediaParams[`${mediaType}_percent`] = 100; if(!state.isLive) mediaParams[`${mediaType}_current_time`] = mediaParams[`${mediaType}_duration`]; sendGAEvent(`${mediaType}_complete`, mediaParams); } resetMediaState(mediaId); break; case 'timeupdate': if (state.isStarted && !state.isLive) trackMediaProgress(element, mediaId); break; case 'error': const error = element.error; mediaParams = buildMediaParams(element, state); mediaParams.error_code = error?.code || 'N/A'; mediaParams.error_message = error?.message || 'Unknown Error'; sendGAEvent(`${mediaType}_error`, mediaParams); resetMediaState(mediaId); break; case 'seeking': mediaParams = buildMediaParams(element, state); sendGAEvent(`${mediaType}_seek`, mediaParams); if(!state.isLive) _resetVideoMilestonesOnSeek(state, mediaParams[`${mediaType}_percent`]); break; case 'seeked': if(state.isStarted && !state.isLive) trackMediaProgress(element, mediaId); break; case 'ratechange': if (state.isStarted) sendGAEvent(`${mediaType}_playback_rate_change`, buildMediaParams(element, state)); break; } } function setupListenersForMedia(element) { let mediaId = element.id; if (!mediaId) { mediaId = `htmlmedia_${Math.random().toString(36).substring(7)}`; element.id = mediaId; } getMediaState(mediaId); if (!element._htmlMediaListenersAttached) { ['loadstart', 'playing', 'pause', 'ended', 'timeupdate', 'error', 'seeking', 'seeked', 'ratechange'].forEach(type => element.addEventListener(type, handleMediaEvent, true)); element._htmlMediaListenersAttached = true; } } document.querySelectorAll('video, audio').forEach(setupListenersForMedia); if (window.MutationObserver && !window._htmlMediaMutationObserverAttached) { const observer = new MutationObserver(mutationsList => { mutationsList.forEach(mutation => { if (mutation.type === 'childList') { mutation.addedNodes.forEach(node => { if (node.nodeType === 1 && (node.matches('video, audio') || node.querySelector('video, audio'))) { (node.matches('video, audio') ? [node] : Array.from(node.querySelectorAll('video, audio'))).forEach(setupListenersForMedia); } }); } }); }); observer.observe(document.body, { childList: true, subtree: true }); window._htmlMediaMutationObserverAttached = true; } }

    function initVimeoTracking() { if (!config.enableVimeoTracking) return; if (typeof Vimeo === 'undefined' || typeof Vimeo.Player === 'undefined') { if (!document.querySelector('script[src*="vimeo.com/api/player.js"]') && !window._vimeo_sdk_loading_enh) { window._vimeo_sdk_loading_enh = true; const vimeoScript = document.createElement('script'); vimeoScript.src = "https://player.vimeo.com/api/player.js"; vimeoScript.onload = initVimeoTracking; document.head.appendChild(vimeoScript); } return; } const vimeoPlayers = {}; const milestones = config.videoMilestones; function getVimeoPlayerState(playerId) { if (!vimeoPlayers[playerId]) { vimeoPlayers[playerId] = { progressReached: {}, isStarted: false, duration: 0, title: 'N/A', videoId: 'N/A', videoUrl: 'N/A', lastReportedMilestone: 0, volume: 1, playbackRate: 1 }; milestones.forEach(m => vimeoPlayers[playerId].progressReached[m] = false); } return vimeoPlayers[playerId]; } function resetVimeoPlayerState(playerId) { const state = getVimeoPlayerState(playerId); state.isStarted = false; state.duration = 0; state.lastReportedMilestone = 0; state.playbackRate = 1; milestones.forEach(m => state.progressReached[m] = false); } function buildVimeoParams(playerState, data = {}) { const currentTime = data.seconds || 0; const duration = playerState.duration || data.duration || 0; const percent = duration > 0 ? Math.min(100, Math.round(data.percent * 100 || (currentTime / duration * 100))) : 0; return { video_title: playerState.title, video_url: playerState.videoUrl, video_duration: Math.round(duration), video_current_time: Math.round(currentTime), video_percent: percent, video_provider: 'vimeo', video_id: playerState.videoId, video_is_muted: playerState.volume === 0, video_is_live: false, /* Vimeo API doesn't indicate live status for embeds */ video_playback_rate: playerState.playbackRate }; } function trackVimeoProgress(playerState, data) { if (!playerState.isStarted) return; const params = buildVimeoParams(playerState, data); const currentPercent = params.video_percent; milestones.forEach(milestone => { if (!playerState.progressReached[milestone] && currentPercent >= milestone && milestone > playerState.lastReportedMilestone) { playerState.progressReached[milestone] = true; playerState.lastReportedMilestone = milestone; const milestoneParams = { ...params, video_percent: milestone }; sendGAEvent('video_progress', milestoneParams); } }); } document.querySelectorAll('iframe[src*="player.vimeo.com/video/"]').forEach(iframe => { try { let iframeId = iframe.id; if (!iframeId) { iframeId = 'vimeoPlayer_' + (iframe.src.split('/').pop().split('?')[0] || Math.random().toString(36).substring(7)); iframe.id = iframeId; } if (vimeoPlayers[iframeId] && vimeoPlayers[iframeId].player) return; const player = new Vimeo.Player(iframe); const playerState = getVimeoPlayerState(iframeId); playerState.player = player; player.ready().then(() => { Promise.all([player.getDuration(), player.getVideoTitle(), player.getVideoId(), player.getVideoUrl(), player.getVolume(), player.getPlaybackRate()]).then(([duration, title, videoId, videoUrl, volume, rate]) => { playerState.duration = duration; playerState.title = title; playerState.videoId = videoId; playerState.videoUrl = videoUrl || iframe.src; playerState.volume = volume; playerState.playbackRate = rate; }).catch(err => console.warn("EA: Vimeo player data fetch error", err)); }); player.on('play', data => { playerState.duration = data.duration; const params = buildVimeoParams(playerState, data); if (!playerState.isStarted) { playerState.isStarted = true; sendGAEvent('video_start', params); } else { sendGAEvent('video_play', params); } }); player.on('pause', data => { if (playerState.isStarted) sendGAEvent('video_pause', buildVimeoParams(playerState, data)); }); player.on('ended', data => { if (playerState.isStarted) { const params = buildVimeoParams(playerState, data); params.video_percent = 100; params.video_current_time = params.video_duration; sendGAEvent('video_complete', params); resetVimeoPlayerState(iframeId); } }); player.on('timeupdate', data => { trackVimeoProgress(playerState, data); }); player.on('volumechange', data => { playerState.volume = data.volume; }); player.on('playbackratechange', data => { playerState.playbackRate = data.playbackRate; if (playerState.isStarted) sendGAEvent('video_playback_rate_change', buildVimeoParams(playerState)); }); player.on('error', err => { const params = buildVimeoParams(playerState); params.error_message = err.message; params.error_name = err.name; sendGAEvent('video_error', params); resetVimeoPlayerState(iframeId);}); player.on('seeked', data => { sendGAEvent('video_seek', buildVimeoParams(playerState, data)); _resetVideoMilestonesOnSeek(playerState, Math.round(data.percent * 100)); trackVimeoProgress(playerState, data); }); } catch (e) { console.error("EA: Error setting up Vimeo player:", e, iframe); } }); if (window.MutationObserver && !window._vimeoMutationObserverAttachedEnh) { const observer = new MutationObserver(mutationsList => { mutationsList.forEach(mutation => { if (mutation.type === 'childList') { mutation.addedNodes.forEach(node => { if (node.nodeType === 1 && (node.matches('iframe[src*="player.vimeo.com/video/"]') || node.querySelector('iframe[src*="player.vimeo.com/video/"]'))) { initVimeoTracking(); } }); } }); }); observer.observe(document.body, { childList: true, subtree: true }); window._vimeoMutationObserverAttachedEnh = true; } }

    function initTwitterTracking() { if (!config.enableTwitterTracking) return; if (typeof twttr === 'undefined' || typeof twttr.events === 'undefined' || typeof twttr.events.bind !== 'function') { if (!window._twitter_api_retry_enh) { window._twitter_api_retry_enh = setTimeout(initTwitterTracking, 2000); } return; } if (window._twitter_api_retry_enh) clearTimeout(window._twitter_api_retry_enh); function getTwitterWidgetType(element) { if (!element) return 'unknown'; if (element.classList && element.classList.contains('twitter-tweet')) return 'single_tweet'; if (element.classList && element.classList.contains('twitter-timeline')) return 'timeline'; if (element.tagName === 'IFRAME') { const src = element.src || ''; if (src.includes('/widget/') && src.includes('tweet')) return 'single_tweet_iframe'; if (src.includes('/widget/') && src.includes('timeline')) return 'timeline_iframe'; const parentTweet = element.closest('.twitter-tweet'); if(parentTweet) return 'single_tweet'; const parentTimeline = element.closest('.twitter-timeline'); if(parentTimeline) return 'timeline'; } return 'unknown'; } twttr.events.bind('loaded', event => { if (event.widgets && event.widgets.length > 0) { event.widgets.forEach(widget => { sendGAEvent('twitter_embed_loaded', { widget_id: widget.id || 'N/A', widget_type: getTwitterWidgetType(widget), page_location: scrubUrlParams(window.location.href) }); }); } }); twttr.events.bind('rendered', event => { const wf = event.target; if (wf) { sendGAEvent('twitter_embed_rendered', { widget_id: wf.id || (wf.closest('.twitter-tweet') ? wf.closest('.twitter-tweet').id : 'N/A'), widget_type: getTwitterWidgetType(wf), page_location: scrubUrlParams(window.location.href) }); } }); twttr.events.bind('tweet', event => { if (event.target && event.tweetId) { sendGAEvent('twitter_tweet_rendered', { tweet_id: event.tweetId, widget_id: event.target.id || (event.target.closest('.twitter-timeline') ? event.target.closest('.twitter-timeline').id : 'N/A'), widget_type: 'timeline_tweet', page_location: scrubUrlParams(window.location.href) }); } }); }
    function initScrollTracking() { if (!config.enableScrollTracking || config.scrollThresholds.length === 0) return; const thresholds = config.scrollThresholds; let thresholdsTriggered = {}; function getScrollPercent() { const st = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0; const dh = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight); const wh = window.innerHeight; if (dh <= wh) return 100; const sh = dh - wh; if (sh <= 0) return 100; return Math.min(100, Math.max(0, Math.floor((st / sh) * 100))); } function handleScroll() { const sp = getScrollPercent(); thresholds.forEach(t => { if (!thresholdsTriggered[t] && sp >= t) { thresholdsTriggered[t] = true; sendGAEvent('scroll_depth', { 'percent_scrolled': t }); } }); } let scrollTimeout; function debouncedScrollHandler() { clearTimeout(scrollTimeout); scrollTimeout = setTimeout(handleScroll, 250); } const scrollEvent = 'onscrollend' in window ? 'scrollend' : 'scroll'; const scrollHandler = scrollEvent === 'scrollend' ? handleScroll : debouncedScrollHandler; window.addEventListener(scrollEvent, scrollHandler, { passive: true }); handleScroll(); window._resetScrollTracking = () => { thresholdsTriggered = {}; setTimeout(handleScroll, 50); }; }
    function initWebVitalsTracking() { if (!config.enableWebVitals || !window.webVitals) return; try { const sendVital = (metric) => { const eventParams = { metric_name: metric.name, metric_value: metric.value, metric_id: metric.id, metric_rating: metric.rating, metric_delta: metric.delta, debug_navigation_type: metric.navigationType, }; if (metric.attribution) { let target = '(not set)'; if(metric.attribution.element) target = metric.attribution.element; else if(metric.attribution.largestShiftTarget) target = metric.attribution.largestShiftTarget; else if(metric.attribution.eventTarget) target = metric.attribution.eventTarget; eventParams.debug_target = target.toString().substring(0,100); eventParams.debug_event_type = metric.attribution.eventType || '(not set)'; eventParams.debug_load_state = metric.attribution.loadState || '(not set)';} if (metric.name === 'CLS') eventParams.metric_value = parseFloat(metric.value.toFixed(4)); else if (['FCP', 'LCP', 'FID', 'TTFB', 'INP'].includes(metric.name)) eventParams.metric_value = parseFloat(metric.value.toFixed(2)); sendGAEvent('web_vitals', eventParams); }; window.webVitals.onCLS(sendVital, {reportAllChanges: true}); window.webVitals.onFCP(sendVital); window.webVitals.onFID(sendVital); window.webVitals.onLCP(sendVital); window.webVitals.onTTFB(sendVital); window.webVitals.onINP(sendVital); } catch (error) { console.error("EA: Error setting up Web Vitals:", error); sendGAEvent('analytics_error', { 'error_type': 'web_vitals_setup', 'error_message': error.message }); } }
    function initAdblockDetection() { if (!config.enableAdblockDetection) return; if (typeof window._ga_adblock_status_enh !== 'undefined') { setGAUserProperty('has_adblocker', window._ga_adblock_status_enh); return; } fetch("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", { method: 'HEAD', mode: 'no-cors', cache: 'no-store' }).then(() => { window._ga_adblock_status_enh = false; setGAUserProperty('has_adblocker', false); }).catch(() => { window._ga_adblock_status_enh = true; setGAUserProperty('has_adblocker', true); }); }
    function handleSearchTermCheck(currentUrl = window.location.href) { if (!config.enableSearchTracking || config.searchParams.length === 0) return; try { const url = new URL(currentUrl); const params = url.searchParams; let searchTerm = null; for (const paramName of config.searchParams) { if (params.has(paramName)) { searchTerm = params.get(paramName); if (searchTerm) break; } } if (searchTerm) { sendGAEvent('view_search_results', { search_term: searchTerm }); } } catch (e) { console.error("EA: Error checking search terms:", e, currentUrl); } }
    function initSpaTracking() { if (!config.enableSpaTracking) return; let lastPath = scrubUrlParams(location.pathname + location.search + location.hash); const handleRouteChange = () => { setTimeout(() => { const newPath = location.pathname + location.search + location.hash; const scrubbedNewPath = scrubUrlParams(newPath); if (scrubbedNewPath !== lastPath) { lastPath = scrubbedNewPath; sendGAPageView(scrubbedNewPath, document.title); if (window._resetScrollTracking) window._resetScrollTracking(); if (config.enableAdblockDetection) initAdblockDetection(); if (config.enableYouTubeTracking) initYouTubeTracking(); if (config.enableHtmlMediaTracking) initHtmlMediaTracking(); if (config.enableVimeoTracking) initVimeoTracking(); if (config.enableTwitterTracking) initTwitterTracking(); if (config.enableFormTracking) initFormTracking(true); } }, 150); }; const wrap = (method) => { const orig = history[method]; if (!orig) return; try { history[method] = function (...a) { const r = orig.apply(this, a); window.dispatchEvent(new Event(`custom${method.toLowerCase()}`)); handleRouteChange(); return r; }; } catch (e) { console.error(`EA: Error wrapping history.${method}`, e); } }; wrap('pushState'); wrap('replaceState'); window.addEventListener('popstate', handleRouteChange); }
    function initFormTracking(isSpaNav = false) { if (!config.enableFormTracking) return; function handleFormEvent(event) { const form = event.target.closest('form'); if (!form) return; const formId = form.id || form.name || 'N/A'; const formAction = form.action || 'N/A'; const formMethod = form.method || 'N/A'; let eventName = ''; const eventParams = { form_id: formId, form_name: form.name || formId, form_action: formAction, form_method: formMethod, form_destination: scrubUrlParams(form.action || window.location.href) }; if (event.type === 'submit') { eventName = 'form_submit'; } else if (event.type === 'focusin' && !form._formTrackerStarted) { form._formTrackerStarted = true; eventName = 'form_start'; } if (eventName) { sendGAEvent(eventName, eventParams); } } if (!isSpaNav || !window._formListenersAttached) { document.body.addEventListener('submit', handleFormEvent, true); document.body.addEventListener('focusin', handleFormEvent, true); window._formListenersAttached = true; } document.querySelectorAll('form').forEach(form => { delete form._formTrackerStarted; }); }

    function initialize() {
        const initialConfig = { ...config.customDimensionMap };
        if (document.referrer) initialConfig.page_referrer = scrubUrlParams(document.referrer);
        if (Object.keys(initialConfig).length > 0) gtag('config', GA_MEASUREMENT_ID, initialConfig);
        handleSearchTermCheck();
        if (config.enableAdblockDetection) initAdblockDetection();
        if (config.enableWebVitals) initWebVitalsTracking();
        if (config.enableAutoLinkTracking) initAutoLinkTracking();
        if (config.enableHtmlMediaTracking) initHtmlMediaTracking();
        if (config.enableYouTubeTracking) initYouTubeTracking();
        if (config.enableVimeoTracking) initVimeoTracking();
        if (config.enableTwitterTracking) initTwitterTracking();
        if (config.enableScrollTracking) initScrollTracking();
        if (config.enableFormTracking) initFormTracking();
        if (config.enableSpaTracking) initSpaTracking();
        console.log(`Enhanced Analytics v2.5.1 Initialized (ID: ${GA_MEASUREMENT_ID})`);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
