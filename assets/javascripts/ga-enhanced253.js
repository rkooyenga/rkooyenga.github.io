/*
 * Enhanced Analytics Script for Google Analytics (GA4) - v2.5.3 (Combined & Fully Unminified)
 * ===================================================================
 *
 * A BitCurrents experiment by Ray Kooyenga
 * Work in progress that makes no guarantee of stability or accuracy
 *
 * Changelog v2.5.3:
 * - CONSOLIDATED: Provided as a single, fully unminified file for clarity and easier debugging.
 * - FIXED: `getConfig` correctly parses default string values for 'intarray' types.
 * - FIXED: YouTube iframe preparation typo (`search_params_set` to `searchParams.set`).
 * - INTEGRATED: Correct, unminified Web Vitals v3.5.2 library.
 * - RETAINED: All previous video tracking enhancements (playlist, live, muted, playback rate).
 *
 * Robust tracking includes experimental support for:
 *  YouTube, Vimeo, Twitter, HTML5 Media, auto-links, and more.
 */

(function () {
    const currentScript = document.currentScript;
    if (!currentScript) {
        console.error("EA: No currentScript. This script might not work as expected if loaded asynchronously without `defer` or if document.currentScript is unsupported and not polyfilled.");
        // Attempt a fallback for older browsers or specific async loading scenarios if absolutely necessary,
        // though this is less reliable.
        // const scripts = document.getElementsByTagName('script');
        // currentScript = scripts[scripts.length - 1];
        // if (!currentScript || !currentScript.getAttribute('data-ga-measurement-id')) {
        //     console.error("EA: Fallback for currentScript failed to identify this script tag.");
        //     return;
        // }
        return; // Prefer to exit if currentScript is not found, as it's crucial for config.
    }

    const getConfig = (attr, def, type = 'string') => {
        let valAttribute = currentScript.getAttribute(`data-${attr}`);
        let valueToProcess;

        if (valAttribute === null || valAttribute === undefined) {
            valueToProcess = def; // Use default
        } else {
            valueToProcess = valAttribute; // Use attribute value
        }

        // Ensure valueToProcess is a string if it's meant for string operations,
        // but if it's already an object/array (e.g. for default JSON), don't convert.
        if (typeof valueToProcess === 'number' && (type === 'array' || type === 'intarray' || type === 'json' || type === 'string')) {
             valueToProcess = String(valueToProcess);
        }


        if (type === 'boolean') {
            if (typeof valueToProcess === 'boolean') return valueToProcess;
            return String(valueToProcess).toLowerCase() === 'true';
        }
        if (type === 'array') {
            if (Array.isArray(valueToProcess)) return valueToProcess;
            return String(valueToProcess).split(',').map(s => s.trim()).filter(Boolean);
        }
        if (type === 'intarray') {
            if (Array.isArray(valueToProcess) && valueToProcess.every(n => typeof n === 'number')) return valueToProcess;
            return String(valueToProcess).split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        }
        if (type === 'json') {
            if (typeof valueToProcess === 'object' && valueToProcess !== null) return valueToProcess; // Already an object (e.g. default {} for customDimensionMap)
            try {
                return JSON.parse(String(valueToProcess));
            }
            catch (e) {
                console.error(`EA: Invalid JSON for data-${attr}:`, valueToProcess, e);
                // Return the default if parsing fails, ensuring 'def' for JSON is an actual object if possible
                return (typeof def === 'object' && def !== null) ? def : {};
            }
        }
        return valueToProcess; // Return as string or original type if not boolean/array/json
    };

    const GA_MEASUREMENT_ID = getConfig('ga-measurement-id', null, 'string');
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
        piiRedactionLevel: getConfig('pii-redaction-level', 'basic', 'string'),
        customDimensionMap: getConfig('custom-dimension-map', {}, 'json')
    };

    if (window._enhanced_analytics_loaded) {
        console.warn("EA: Enhanced Analytics script already loaded. Halting initialization.");
        return;
    }
    if (typeof window.gtag !== 'function') {
        console.error("EA: gtag.js not found. Enhanced Analytics requires gtag.js to be loaded first.");
        return;
    }
    if (!GA_MEASUREMENT_ID) {
        console.error("EA: GA Measurement ID not provided. Please add data-ga-measurement-id to the script tag.");
        return;
    }
    window._enhanced_analytics_loaded = true;

    /* --- Web Vitals Library (v3.5.2 - UNMINIFIED) --- */
    (function (webVitals) {
      'use strict';

      var DURATION_THRESHOLD = 40;

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
      // const onBFCacheRestore = (cb: (event: PageShowEvent) => void) => {
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
              rating: 'good', // Assume 'good' until we know otherwise.
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
          addEventListener('pagehide', onHiddenOrPageHide, true);
      };

      var firstHiddenTime = -1;
      var getFirstHidden = function () {
          if (firstHiddenTime < 0) {
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

      // This is not used in the library itself, but is exported for convenience.
      // var reportedMetricIDs = {};
      // var report = function(metric, reportAllChanges) {
      //     if (metric.value >= 0) {
      //         if (reportAllChanges || !reportedMetricIDs[metric.id]) {
      //             // console.log(metric.name, metric.value, metric);
      //             reportedMetricIDs[metric.id] = true;
      //         }
      //     }
      // };


      var createReporter = function (callback, metric, thresholds, reportAllChanges) {
          var prevValue;
          var delta;
          return function (forceReport) {
              if (metric.value >= 0) {
                  if (forceReport || reportAllChanges) {
                      delta = metric.value - (prevValue || 0);
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

      var isDocumentPrerendering = function () { return document.prerendering; };
      var onPrerenderFinish = function (callback) {
          if (isDocumentPrerendering()) {
              addEventListener('prerenderingchange', function () { return callback(); }, true);
          }
          else {
              callback();
          }
      };

      var FCPThresholds = [1800, 3000];
      var onFCP = function (onReport, opts) {
          opts = opts || {};
          onPrerenderFinish((function () {
              var firstHidden = getFirstHidden();
              var metric = initMetric('FCP');
              var report = createReporter(onReport, metric, FCPThresholds, opts.reportAllChanges);
              var entryHandler = function (entry) {
                  if (entry.name === 'first-contentful-paint') {
                      if (po) {
                          po.disconnect();
                      }
                      if (entry.startTime < firstHidden.firstHiddenTime) {
                          metric.value = Math.max(entry.startTime - getActivationStart(), 0);
                          metric.entries.push(entry);
                          report(true);
                      }
                  }
              };
              var po = observe('paint', entryHandler);
              if (po) {
                  onBFCacheRestore$1(function (event) {
                      metric = initMetric('FCP');
                      report = createReporter(onReport, metric, FCPThresholds, opts.reportAllChanges);
                      requestAnimationFrame(function () {
                          requestAnimationFrame(function () {
                              metric.value = performance.now() - event.timeStamp;
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
          if (!PerformanceEventTiming) {
              return;
          }
          onPrerenderFinish((function () {
              var metric = initMetric('CLS', 0);
              var report = createReporter(onReport, metric, CLSThresholds, opts.reportAllChanges);
              var sessionValue = 0;
              var sessionEntries = [];
              var entryHandler = function (entry) {
                  if (!entry.hadRecentInput) {
                      var firstSessionEntry = sessionEntries[0];
                      var lastSessionEntry = sessionEntries[sessionEntries.length - 1];
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
              }
          }));
      };


      var LCPThresholds = [2500, 4000];
      var reportedLCPMetricIDs = {};
      var onLCP = function (onReport, opts) {
          opts = opts || {};
          onPrerenderFinish((function () {
              var firstHidden = getFirstHidden();
              var metric = initMetric('LCP');
              var report = createReporter(onReport, metric, LCPThresholds, opts.reportAllChanges);
              var entryHandler = function (entry) {
                  var value = Math.max(entry.startTime - getActivationStart(), 0);
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
                  onBFCacheRestore$1(function (event) {
                      metric = initMetric('LCP');
                      report = createReporter(onReport, metric, LCPThresholds, opts.reportAllChanges);
                      reportedLCPMetricIDs = {};
                      requestAnimationFrame(function () {
                          requestAnimationFrame(function () {
                              metric.value = performance.now() - event.timeStamp;
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
          onPrerenderFinish((function () {
              var firstHidden = getFirstHidden();
              var metric = initMetric('FID');
              var report = createReporter(onReport, metric, FIDThresholds, opts.reportAllChanges);
              var entryHandler = function (entry) {
                  if (entry.processingStart > 0 && entry.startTime < firstHidden.firstHiddenTime) {
                      metric.value = entry.processingStart - entry.startTime;
                      metric.entries.push(entry);
                      report(true);
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
                  });
              }
          }));
      };

      var interactionCountPolyfillObserver;
      var pointerupInteractionCount = 0;
      var keyupInteractionCount = 0;
      var interactionCountForPolyfill = 0;

      var initInteractionCountPolyfill = function () {
          if ('interactionCount' in performance || interactionCountPolyfillObserver) return;
          interactionCountPolyfillObserver = observe('event', function(entries) {
              entries.forEach(function(entry) {
                  if (entry.interactionId) {
                      interactionCountForPolyfill = Math.max(interactionCountForPolyfill, entry.interactionId);
                  }
              });
          }, {
              type: 'event',
              buffered: true,
              durationThreshold: 0,
          });
          addEventListener('pointerup', function() { pointerupInteractionCount++; });
          addEventListener('keyup', function() { keyupInteractionCount++; });
      };

      var getInteractionCount = function() {
          if ('interactionCount' in performance) {
              return performance.interactionCount;
          }
          return interactionCountForPolyfill || pointerupInteractionCount + keyupInteractionCount;
      };

      var INPThresholds = [200, 500];
      //   let interactionCount = 0;
      var interactionCountTarget = 0;
      var interactionEntries = [];
      var interactionMap = {};
      var processInteractionEntry = function (entry) {
          if (entry.interactionId) {
              var _a = interactionMap[entry.interactionId] || { entries: [], latency: 0 }, entries = _a.entries, latency = _a.latency;
              entries.push(entry);
              latency = Math.max(latency, entry.duration);
              interactionMap[entry.interactionId] = { entries: entries, latency: latency };
              if (interactionEntries.length < 10 || latency > interactionEntries[interactionEntries.length - 1].latency) {
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
                  interactionEntries.splice(10);
              }
          }
      };
      var onINP = function (onReport, opts) {
          opts = opts || {};
          onPrerenderFinish((function () {
              if (!('interactionCount' in performance)) {
                  initInteractionCountPolyfill();
                  if (!('interactionCount' in performance) && !interactionCountPolyfillObserver) return;
              }
              var firstHidden = getFirstHidden();
              var metric = initMetric('INP');
              var report = createReporter(onReport, metric, INPThresholds, opts.reportAllChanges);
              var entryHandler = function (entries) {
                  entries.forEach(processInteractionEntry);
                  if (firstHidden.firstHiddenTime < Infinity) {
                      interactionEntries = interactionEntries.filter(function (i) { return i.entries[0].startTime < firstHidden.firstHiddenTime; });
                  }
                  interactionCountTarget = Math.min(interactionEntries.length - 1, Math.floor(getInteractionCount() / 50));
                  var p98Interaction = interactionEntries[interactionCountTarget];
                  if (p98Interaction && p98Interaction.latency !== metric.value) {
                      metric.value = p98Interaction.latency;
                      metric.entries = p98Interaction.entries;
                      report();
                  }
              };
              var po = observe('event', entryHandler, { durationThreshold: opts.durationThreshold || DURATION_THRESHOLD });
              if (!po) return;
              observe('first-input', function (entries) {
                  entries.forEach(function (entry) {
                      var interactionExists = interactionEntries.find(function (i) { return i.entries.some(function (e) { return e.entryType === 'first-input' && e.startTime === entry.startTime && e.duration === entry.duration; }); });
                      if (!interactionExists) {
                          processInteractionEntry(entry);
                      }
                  });
              });
              onHidden(function () {
                  po.takeRecords().map(processInteractionEntry);
                  report(true);
              });
              onBFCacheRestore$1(function () {
                  interactionEntries = [];
                  interactionMap = {};
                  // interactionCount = 0; // Already handled by polyfill reset or native
                  interactionCountTarget = 0;
                  metric = initMetric('INP');
                  report = createReporter(onReport, metric, INPThresholds, opts.reportAllChanges);
                  initInteractionCountPolyfill();
              });
          }));
      };

      var TTFBThresholds = [800, 1800];
      var onTTFB = function (onReport, opts) {
          opts = opts || {};
          onPrerenderFinish((function () {
              var metric = initMetric('TTFB');
              var report = createReporter(onReport, metric, TTFBThresholds, opts.reportAllChanges);
              var navigationEntry = getNavigationEntry();
              if (navigationEntry) {
                  var value = Math.max(navigationEntry.responseStart - getActivationStart(), 0);
                  // Ensure the value is positive and occurred before the current time.
                  if (value > 0 && value < performance.now()) {
                      metric.value = value;
                      metric.entries.push(navigationEntry);
                      report(true);
                  }
                  onBFCacheRestore$1(function (event) {
                      metric = initMetric('TTFB', 0);
                      report = createReporter(onReport, metric, TTFBThresholds, opts.reportAllChanges);
                      // Value for BFCache restore is typically 0 or very small.
                      // Or consider using event.timeStamp if more appropriate.
                      report(true);
                  });
              }
          }));
      };

      webVitals.onCLS = onCLS;
      webVitals.onFCP = onFCP;
      webVitals.onFID = onFID;
      webVitals.onINP = onINP;
      webVitals.onLCP = onLCP;
      webVitals.onTTFB = onTTFB;
      webVitals.CLSThresholds = CLSThresholds;
      webVitals.FCPThresholds = FCPThresholds;
      webVitals.FIDThresholds = FIDThresholds;
      webVitals.INPThresholds = INPThresholds;
      webVitals.LCPThresholds = LCPThresholds;
      webVitals.TTFBThresholds = TTFBThresholds;

      // Expose getXXX functions
      var getCLS = function(onReport, opts) { onCLS(onReport, opts); };
      var getFCP = function(onReport, opts) { onFCP(onReport, opts); };
      var getFID = function(onReport, opts) { onFID(onReport, opts); };
      var getLCP = function (onReport, opts) { onLCP(onReport, opts); };
      var getINP = function (onReport, opts) { onINP(onReport, opts); };
      var getTTFB = function(onReport, opts) { onTTFB(onReport, opts); };

      webVitals.getCLS = getCLS;
      webVitals.getFCP = getFCP;
      webVitals.getFID = getFID;
      webVitals.getINP = getINP;
      webVitals.getLCP = getLCP;
      webVitals.getTTFB = getTTFB;

    })(window.webVitals = window.webVitals || {});
    /* --- End Web Vitals Library --- */


    const piiPatterns = {
        basic: [
            { name: 'EMAIL', regex: /[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi },
            { name: 'NAME_PARAM', regex: /((?:first|last|full|user)[_-]?name)=[^&]+/gi },
            { name: 'PWD_PARAM', regex: /(password|passwd|pwd)=[^&]+/gi },
        ],
        strict: [
            { name: 'EMAIL', regex: /[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi },
            { name: 'PHONE', regex: /(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/gi },
            { name: 'SSN', regex: /\d{3}[\s.-]?\d{2}[\s.-]?\d{4}/gi },
            { name: 'NAME_PARAM', regex: /((?:first|last|middle|full|user|sur)[_-]?name)=[^&]+/gi },
            { name: 'PWD_PARAM', regex: /((?:confirm[_-]?)?password|passwd|pwd)=[^&]+/gi },
            { name: 'ADDR_PARAM', regex: /(address|street|addr)[1-2]?=[^&]+/gi },
            { name: 'ZIP_PARAM', regex: /(zip|postal)[_-]?code=[^&]+/gi },
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
                }
            });
            const newQueryString = newParams.toString();
            return newQueryString ? `${baseUrl}?${newQueryString}` : baseUrl;
        } catch (e) {
            console.error("EA: Error scrubbing URL params:", e, url);
            return url.split('?')[0]; // Return base URL on error
        }
    }

    function sendGAEvent(eventName, eventParams = {}) {
        if (typeof gtag === 'function' && GA_MEASUREMENT_ID) {
            const processedParams = {};
            for (const key in eventParams) {
                if (Object.prototype.hasOwnProperty.call(eventParams, key)) {
                    let value = eventParams[key];
                    if (config.enablePiiRedaction && typeof value === 'string') {
                        if (key.includes('url') || key.includes('link') || key.includes('href') || key === 'page_location' || key === 'page_referrer' || key === 'file_name') {
                            value = scrubUrlParams(value); // Scrub first to remove unwanted params
                            value = redactPii(value);     // Then redact PII from allowed params/path
                        } else if (key.includes('text') || key.includes('label') || key.includes('term') || key.includes('title') || key === 'value' || key === 'debug_target') {
                            value = redactPii(value, 'basic'); // Use basic redaction for general text fields
                        }
                    }
                    processedParams[key] = value;
                }
            }
            gtag('event', eventName, processedParams);
        }
    }

    function sendGAPageView(path = null, title = null) {
        if (typeof gtag === 'function' && GA_MEASUREMENT_ID) {
            const pagePath = path || location.pathname + location.search + location.hash;
            const pageTitle = title || document.title;

            const configUpdate = {
                'page_path': scrubUrlParams(pagePath), // Scrub first
                'page_title': config.enablePiiRedaction ? redactPii(pageTitle, 'basic') : pageTitle
            };
            // Ensure page_path is also redacted if PII redaction is on for URLs
            if (config.enablePiiRedaction) {
                configUpdate.page_path = redactPii(configUpdate.page_path);
            }

            gtag('config', GA_MEASUREMENT_ID, configUpdate);
            handleSearchTermCheck(pagePath); // Check original path for search terms
        }
    }

    function setGAUserProperty(propName, propValue) {
        if (typeof gtag === 'function') {
            const userProp = {};
            userProp[propName] = (config.enablePiiRedaction && typeof propValue === 'string') ? redactPii(propValue, 'basic') : propValue;
            gtag('set', 'user_properties', userProp);
        }
    }

    window.enhancedAnalytics = {
        event: sendGAEvent,
        pageview: sendGAPageView,
        redact: redactPii,
        config: config
    };

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
            } catch (e) { return false; }
        }

        function getFileExtension(href) {
            try {
                const path = new URL(href, location.origin).pathname;
                const match = path.match(downloadExtensionsRegex);
                return match ? match[1].toLowerCase() : '';
            } catch (e) { return ''; }
        }

        function getFileName(href) {
             try {
                const path = new URL(href, location.origin).pathname;
                return path.substring(path.lastIndexOf('/') + 1);
            } catch (e) { return ''; }
        }

        const handleInteraction = (event) => {
            const link = event.target.closest('a');
            if (!link || !link.href) return;

            const isPrimaryClick = event.type === 'mousedown' && event.button === 0;
            const isEnterKey = event.type === 'keydown' && event.keyCode === 13;

            if (!isPrimaryClick && !isEnterKey) return;

            const interactionType = isPrimaryClick ? 'click' : 'enter_key';
            const href = link.href;
            const linkText = (link.innerText || link.textContent || '').trim().replace(/[\s\r\n]+/g, ' ');
            const linkId = link.id || 'N/A';
            const linkClasses = link.className || 'N/A';

            let eventName = 'click';
            let eventParams = {
                link_url: href, // Will be scrubbed/redacted by sendGAEvent
                link_text: linkText, // Will be redacted by sendGAEvent
                link_id: linkId,
                link_classes: linkClasses,
                interaction_type: interactionType,
                outbound: false
            };

            try {
                const linkUrl = new URL(href, location.origin); // Use location.origin as base for relative URLs
                const linkHostname = linkUrl.hostname.replace(/^www\./, "").toLowerCase();

                if (mailtoRegex.test(href)) {
                    eventName = 'email_click';
                    const emailAddress = href.substring(href.indexOf(':') + 1);
                    eventParams.link_domain = emailAddress.substring(emailAddress.indexOf('@') + 1);
                    // `link_url` (the email address) will be redacted by sendGAEvent if PII is on.
                } else if (telRegex.test(href)) {
                    eventName = 'telephone_click';
                    eventParams.link_url = href.substring(4); // Remove "tel:"
                } else if (linkUrl.protocol.startsWith('http')) { // Covers http and https
                    if (isDownload(href)) {
                        eventName = 'file_download';
                        eventParams.file_extension = getFileExtension(href);
                        eventParams.file_name = getFileName(href); // Will be redacted by sendGAEvent
                        eventParams.link_domain = linkHostname;
                    } else {
                        eventParams.link_domain = linkHostname;
                    }

                    if (linkHostname !== domain && !linkHostname.endsWith('.' + domain)) {
                        eventParams.outbound = true;
                    } else {
                        if (eventName === 'click') eventName = 'navigation_click'; // Internal navigation
                    }
                } else {
                    // Non-standard protocol, or error in URL parsing for protocol.
                    // Treat as outbound by default if unsure, or could be a specific app link.
                    eventName = 'click'; // Or a more specific "special_link_click"
                    eventParams.link_domain = 'N/A';
                    eventParams.outbound = true; // Safer to assume outbound for unknown protocols
                }
                sendGAEvent(eventName, eventParams);
            } catch (e) {
                console.error("EA: Error processing link interaction:", e, link);
                sendGAEvent('analytics_error', {
                    'error_type': 'link_tracking',
                    'error_message': e.message,
                    'link_href': href // Will be scrubbed/redacted by sendGAEvent
                });
            }
        };
        document.body.addEventListener("mousedown", handleInteraction, true);
        document.body.addEventListener("keydown", handleInteraction, true);
    }

    /* --- Universal Video Tracking Utilities --- */
    function _resetVideoMilestonesOnSeek(playerState, currentPercent) {
        playerState.lastReportedMilestone = 0;
        config.videoMilestones.forEach(m => {
            playerState.progressReached[m] = m < currentPercent;
        });
    }

    function initYouTubeTracking() {
        if (!config.enableYouTubeTracking) return;

        const players = {}; // Store player instances and their states
        const milestones = config.videoMilestones;

        function getPlayerState(playerId) {
            if (!players[playerId]) {
                players[playerId] = {
                    progressReached: {},
                    intervalId: null,
                    isStarted: false,
                    lastReportedMilestone: 0,
                    lastTime: 0,
                    hasSeeked: false,
                    currentVideoId: null,
                    isLive: false,
                    playbackRate: 1,
                    duration: 0 // Store duration for playlist completion
                };
                milestones.forEach(m => players[playerId].progressReached[m] = false);
            }
            return players[playerId];
        }

        function clearPlayerProgress(playerId) {
            const state = getPlayerState(playerId);
            milestones.forEach(m => state.progressReached[m] = false);
            state.isStarted = false;
            state.lastReportedMilestone = 0;
            state.lastTime = 0;
            state.hasSeeked = false;
            state.isLive = false;
            state.currentVideoId = null;
            state.playbackRate = 1;
            state.duration = 0;
            if (state.intervalId) {
                clearInterval(state.intervalId);
                state.intervalId = null;
            }
        }

        function buildVideoParams(player, playerState) {
            try {
                const duration = player.getDuration();
                const isLive = !isFinite(duration);
                const currentTime = player.getCurrentTime();
                const percent = !isLive && duration > 0 ? Math.min(100, Math.floor((currentTime / duration) * 100)) : 0;
                const videoData = player.getVideoData(); // Contains title, video_id etc.

                return {
                    video_title: videoData?.title || 'N/A',
                    video_url: player.getVideoUrl() || 'N/A', // Will be scrubbed/redacted by sendGAEvent
                    video_duration: isLive ? 0 : Math.round(duration || 0),
                    video_current_time: Math.round(currentTime || 0),
                    video_percent: percent,
                    video_provider: 'youtube',
                    video_id: videoData?.video_id || 'N/A',
                    video_is_muted: player.isMuted(),
                    video_is_live: isLive,
                    video_playback_rate: player.getPlaybackRate()
                };
            } catch (e) {
                // console.error("EA: YouTube buildVideoParams error", e);
                return { video_provider: 'youtube', video_error: e.message, video_id: playerState.currentVideoId || 'N/A' };
            }
        }

        function handleYouTubePlaylistChange(player, playerState, currentVideoParams) {
            const newVideoId = currentVideoParams.video_id;
            // Check if it's a playlist, if a video was playing, and if the ID changed
            if (newVideoId && playerState.currentVideoId && newVideoId !== playerState.currentVideoId) {
                // Send complete for the old video
                const oldVideoParams = {
                    ...currentVideoParams, // Base new params on current for some consistency
                    video_id: playerState.currentVideoId, // Critical: use OLD video_id
                    video_percent: 100,
                    // Use stored duration for old video if not live
                    video_current_time: playerState.isLive ? currentVideoParams.video_current_time : playerState.duration
                };
                sendGAEvent('video_complete', oldVideoParams);

                // Reset state for the new video in the playlist
                const playerId = player.getIframe().id;
                clearPlayerProgress(playerId); // Clears interval, milestones etc.

                // Update playerState with new video's details
                playerState.currentVideoId = newVideoId;
                playerState.isStarted = true; // It's starting now
                playerState.isLive = currentVideoParams.video_is_live;
                playerState.duration = currentVideoParams.video_duration; // Store new duration
                playerState.playbackRate = currentVideoParams.video_playback_rate;

                sendGAEvent('video_start', currentVideoParams); // Send start for new video
                return true; // Indicates a playlist change was handled
            }
            return false; // No playlist change
        }


        function trackProgress(player, playerId) {
            const playerState = getPlayerState(playerId);
            if (!playerState || !playerState.isStarted || playerState.isLive) return;

            const videoParams = buildVideoParams(player, playerState);
            const currentTime = videoParams.video_current_time;

            if (Math.abs(currentTime - playerState.lastTime) > 2 && !playerState.isLive) { // More than 2s jump = seek
                playerState.hasSeeked = true;
                _resetVideoMilestonesOnSeek(playerState, videoParams.video_percent);
            }
            playerState.lastTime = currentTime;

            const currentPercent = videoParams.video_percent;
            milestones.forEach(milestone => {
                if (!playerState.progressReached[milestone] && currentPercent >= milestone && milestone > playerState.lastReportedMilestone) {
                    playerState.progressReached[milestone] = true;
                    playerState.lastReportedMilestone = milestone;
                    const milestoneParams = { ...videoParams, video_percent: milestone };
                    sendGAEvent('video_progress', milestoneParams);
                }
            });
        }

        function onPlayerStateChange(event) {
            const player = event.target;
            const iframe = player.getIframe ? player.getIframe() : null;
            if (!iframe || !iframe.id) return;

            const playerId = iframe.id;
            const playerState = getPlayerState(playerId);
            let videoParams = buildVideoParams(player, playerState); // Get current params once

            switch (event.data) {
                case YT.PlayerState.PLAYING:
                    // Always check for playlist change first when playing starts
                    if (handleYouTubePlaylistChange(player, playerState, videoParams)) {
                        // If playlist change handled, it already sent start and reset state.
                        // Re-evaluate videoParams as buildVideoParams might have stale state if called before playlist change logic
                        videoParams = buildVideoParams(player, playerState);
                    }

                    if (!playerState.isStarted) { // Should be true only for the very first play or after playlist change handled it
                        playerState.isStarted = true;
                        playerState.currentVideoId = videoParams.video_id;
                        playerState.isLive = videoParams.video_is_live;
                        playerState.duration = videoParams.video_duration;
                        playerState.playbackRate = videoParams.video_playback_rate;
                        sendGAEvent('video_start', videoParams);
                    } else {
                        // This is a resume or play after seek/buffer
                        if (playerState.hasSeeked) {
                            sendGAEvent('video_seek', videoParams);
                            playerState.hasSeeked = false;
                        }
                        sendGAEvent('video_play', videoParams);
                    }

                    if (!playerState.intervalId && !playerState.isLive && milestones.length > 0) {
                        playerState.lastTime = player.getCurrentTime(); // Initialize lastTime
                        playerState.intervalId = setInterval(() => trackProgress(player, playerId), 1000);
                    }
                    break;
                case YT.PlayerState.PAUSED:
                    if (!playerState.isStarted) return;
                    if (playerState.intervalId) {
                        clearInterval(playerState.intervalId);
                        playerState.intervalId = null;
                    }
                    sendGAEvent('video_pause', videoParams);
                    break;
                case YT.PlayerState.ENDED:
                    if (!playerState.isStarted) return;
                    videoParams.video_percent = 100; // Ensure 100% for complete
                    if (!playerState.isLive) videoParams.video_current_time = videoParams.video_duration;
                    sendGAEvent('video_complete', videoParams);
                    clearPlayerProgress(playerId);
                    break;
                case YT.PlayerState.CUED:
                    clearPlayerProgress(playerId); // Video cued, reset any prior state
                    break;
                // case YT.PlayerState.BUFFERING: // Optional: track buffering
                // if(playerState.isStarted) sendGAEvent('video_buffer', videoParams);
                // break;
            }
        }

        function onPlaybackRateChange(event) {
            const player = event.target;
            const iframe = player.getIframe ? player.getIframe() : null;
            if (!iframe || !iframe.id) return;
            const playerState = getPlayerState(iframe.id);
            if (!playerState.isStarted) return;

            playerState.playbackRate = event.data; // event.data is the new rate
            const params = buildVideoParams(player, playerState); // Rebuild params with new rate
            sendGAEvent('video_playback_rate_change', params);
        }

        function onPlayerError(event) {
            const player = event.target;
            const iframe = player.getIframe ? player.getIframe() : null;
            if (!iframe || !iframe.id) return;
            const playerId = iframe.id;
            const playerState = getPlayerState(playerId); // Get current state
            const videoParams = buildVideoParams(player, playerState); // Try to get as much info
            videoParams.error_code = event.data; // event.data is the error code
            sendGAEvent('video_error', videoParams);
            clearPlayerProgress(playerId);
        }

        function findAndPrepareYouTubeFrames() {
            if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
                 if (config.enableYouTubeTracking && !window._yt_api_warned_enh) {
                    // console.warn("EA: YouTube API not ready yet for findAndPrepareYouTubeFrames.");
                    window._yt_api_warned_enh = true;
                 }
                return;
            }

            document.querySelectorAll('iframe[src*="youtube.com/embed/"], iframe[src*="youtube-nocookie.com/embed/"]').forEach(iframe => {
                try {
                    let iframeId = iframe.id;
                    if (!iframeId) {
                        // Generate a unique ID if one isn't present
                        const videoUrlSrc = iframe.getAttribute('src');
                        let videoIdFromSrc = 'unknown';
                        if (videoUrlSrc) {
                            const videoUrl = new URL(videoUrlSrc, window.location.origin);
                            videoIdFromSrc = videoUrl.pathname.split('/').pop() || Math.random().toString(36).substring(2, 9);
                        } else {
                            videoIdFromSrc = Math.random().toString(36).substring(2, 9);
                        }
                        iframeId = 'ytplayer_' + videoIdFromSrc.replace(/[^a-zA-Z0-9_-]/g, '');
                        iframe.id = iframeId;
                    }

                    // Ensure enablejsapi=1 is on the iframe src
                    let currentSrc = iframe.getAttribute('src');
                    if (currentSrc) {
                        const url = new URL(currentSrc, window.location.origin);
                        if (url.searchParams.get('enablejsapi') !== '1') {
                            url.searchParams.set('enablejsapi', '1');
                            // It's good practice to also set origin for security if not present
                            if (!url.searchParams.has('origin')) {
                                url.searchParams.set('origin', window.location.origin);
                            }
                            iframe.setAttribute('src', url.toString());
                        }
                    } else {
                        // console.warn("EA: YouTube iframe has no src attribute.", iframe);
                        return; // Cannot initialize player without src
                    }


                    if (!players[iframeId] || !players[iframeId].ytPlayerObject) {
                        getPlayerState(iframeId); // Initialize state object
                        const playerObj = new YT.Player(iframeId, {
                            events: {
                                'onReady': null, // onReady is not strictly needed if state changes are handled well
                                'onStateChange': onPlayerStateChange,
                                'onError': onPlayerError,
                                'onPlaybackRateChange': onPlaybackRateChange
                            }
                        });
                        players[iframeId].ytPlayerObject = playerObj; // Store the player object itself
                    }
                } catch (e) {
                    console.error("EA: Error preparing YouTube iframe:", e, iframe);
                }
            });
        }

        if (!window.onYouTubeIframeAPIReady) {
            window.onYouTubeIframeAPIReady = () => {
                findAndPrepareYouTubeFrames();
                 // Potentially re-call if other scripts overwrote it.
                if(typeof window._origOnYouTubeIframeAPIReady_enh === 'function') {
                    window._origOnYouTubeIframeAPIReady_enh();
                }
            };
        } else {
            // If API ready fires before this script, or if another script defined it.
            // Chain it if it's already defined by someone else.
            if(typeof window.onYouTubeIframeAPIReady !== 'undefined' && window.onYouTubeIframeAPIReady.name !== 'onYouTubeIframeAPIReady') { // check if it's not our own wrapper
                 window._origOnYouTubeIframeAPIReady_enh = window.onYouTubeIframeAPIReady;
                 window.onYouTubeIframeAPIReady = () => {
                    findAndPrepareYouTubeFrames();
                    if(typeof window._origOnYouTubeIframeAPIReady_enh === 'function') {
                        window._origOnYouTubeIframeAPIReady_enh();
                    }
                 };
            }
            findAndPrepareYouTubeFrames(); // Call it directly if API might already be ready
        }


        if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
            if (!document.querySelector('script[src*="youtube.com/iframe_api"]') && !window._yt_api_loading_enh) {
                window._yt_api_loading_enh = true;
                var tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                var firstScriptTag = document.getElementsByTagName('script')[0];
                if (firstScriptTag && firstScriptTag.parentNode) {
                    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                } else {
                    document.head.appendChild(tag); // Fallback if no script tags found
                }
            }
        }

        // Use MutationObserver to detect dynamically added YouTube iframes
        if (window.MutationObserver && !window._ytMutationObserverAttached_enh) {
            const observer = new MutationObserver(mutationsList => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) { // Check if it's an element node
                                if (node.tagName === 'IFRAME' && node.src && (node.src.includes('youtube.com/embed/') || node.src.includes('youtube-nocookie.com/embed/'))) {
                                    findAndPrepareYouTubeFrames();
                                } else if (node.querySelector) { // Check if it's an element that can contain other elements
                                    const iframes = node.querySelectorAll('iframe[src*="youtube.com/embed/"], iframe[src*="youtube-nocookie.com/embed/"]');
                                    if (iframes.length > 0) {
                                        findAndPrepareYouTubeFrames();
                                    }
                                }
                            }
                        });
                    }
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            window._ytMutationObserverAttached_enh = true;
        }
    }

    function initHtmlMediaTracking() {
        if (!config.enableHtmlMediaTracking) return;

        const mediaStatus = {}; // Store state for each media element
        const milestones = config.videoMilestones;

        function getMediaState(mediaId) {
            if (!mediaStatus[mediaId]) {
                mediaStatus[mediaId] = {
                    progressReached: {},
                    isStarted: false,
                    mediaType: '', // 'video' or 'audio'
                    lastReportedMilestone: 0,
                    currentSrc: null, // To detect src changes
                    isLive: false,
                    duration: 0
                };
                milestones.forEach(m => mediaStatus[mediaId].progressReached[m] = false);
            }
            return mediaStatus[mediaId];
        }

        function resetMediaState(mediaId) {
            const state = getMediaState(mediaId); // Ensures it exists
            state.isStarted = false;
            state.lastReportedMilestone = 0;
            // state.mediaType = ''; // Keep mediaType if known
            state.currentSrc = null;
            state.isLive = false;
            state.duration = 0;
            milestones.forEach(m => state.progressReached[m] = false);
        }

        function buildMediaParams(element, state) {
            try {
                const duration = element.duration;
                const isLive = duration === Infinity;
                const mediaType = state.mediaType || (element.tagName === 'VIDEO' ? 'video' : 'audio');
                if(!state.mediaType) state.mediaType = mediaType; // Set it if not already set

                const baseParams = {
                    [`${mediaType}_duration`]: isLive ? 0 : Math.round(duration || 0),
                    [`${mediaType}_current_time`]: Math.round(element.currentTime || 0),
                    [`${mediaType}_percent`]: isLive || duration <= 0 || !isFinite(duration) ? 0 : Math.min(100, Math.floor((element.currentTime / duration) * 100)),
                    [`${mediaType}_provider`]: `html5 ${mediaType}`,
                    [`${mediaType}_url`]: element.currentSrc || element.src || 'N/A', // Will be scrubbed/redacted
                    [`${mediaType}_id`]: element.id || 'N/A',
                    [`${mediaType}_is_muted`]: element.muted,
                    [`${mediaType}_is_live`]: isLive,
                    [`${mediaType}_playback_rate`]: element.playbackRate
                };
                baseParams[`${mediaType}_title`] = element.title || element.getAttribute('aria-label') || baseParams[`${mediaType}_url`].split('/').pop() || 'N/A';
                return baseParams;
            } catch(e) {
                // console.error("EA: HTML5 buildMediaParams error", e);
                const mediaType = element.tagName === 'VIDEO' ? 'video' : 'audio';
                return { [`${mediaType}_provider`]: `html5 ${mediaType}`, [`${mediaType}_error`]: e.message, [`${mediaType}_id`]: element.id || 'N/A'};
            }
        }

        function trackMediaProgress(element, mediaId) {
            const state = getMediaState(mediaId);
            if (!state || !state.isStarted || state.isLive) return;

            const mediaParams = buildMediaParams(element, state);
            const currentPercent = mediaParams[`${state.mediaType}_percent`];

            milestones.forEach(milestone => {
                if (!state.progressReached[milestone] && currentPercent >= milestone && milestone > state.lastReportedMilestone) {
                    state.progressReached[milestone] = true;
                    state.lastReportedMilestone = milestone;
                    const milestoneParams = { ...mediaParams }; // Create a copy for this specific milestone event
                    milestoneParams[`${state.mediaType}_percent`] = milestone; // Set precise milestone percent
                    sendGAEvent(`${state.mediaType}_progress`, milestoneParams);
                }
            });
        }

        function handleMediaEvent(event) {
            const element = event.target;
            const mediaId = element.id;
            if (!mediaId) return; // Should have been assigned by setupListenersForMedia

            const state = getMediaState(mediaId);
            let mediaParams; // To be built as needed
            const mediaType = state.mediaType || (element.tagName === 'VIDEO' ? 'video' : 'audio');
             if(!state.mediaType) state.mediaType = mediaType;


            switch (event.type) {
                case 'loadstart': // Fired when the browser begins loading the media
                    // If already started and src changes, implies a dynamic source update
                    if (state.isStarted && state.currentSrc && state.currentSrc !== element.currentSrc) {
                        let oldParams = buildMediaParams(element, state); // Build params with old state info if possible
                        oldParams[`${mediaType}_percent`] = 100; // Assume previous finished
                        if (!state.isLive) oldParams[`${mediaType}_current_time`] = oldParams[`${mediaType}_duration`];
                        sendGAEvent(`${mediaType}_complete`, oldParams);
                        resetMediaState(mediaId); // Reset for the new source
                    }
                    state.currentSrc = element.currentSrc;
                    // Do not build params here yet, wait for 'loadedmetadata' or 'playing'
                    break;

                case 'loadedmetadata': // Duration, dimensions, and text tracks are known
                    mediaParams = buildMediaParams(element, state);
                    state.isLive = mediaParams[`${mediaType}_is_live`];
                    state.duration = mediaParams[`${mediaType}_duration`];
                    // Can update state.mediaType here if it was unknown
                    if (!state.mediaType) state.mediaType = (element.tagName === 'VIDEO' ? 'video' : 'audio');
                    break;

                case 'playing': // Playback has started or resumed after pause/stall
                    mediaParams = buildMediaParams(element, state); // Rebuild to get latest info
                    if (!state.isStarted) {
                        state.isStarted = true;
                        state.isLive = mediaParams[`${mediaType}_is_live`]; // Ensure live status is set
                        state.duration = mediaParams[`${mediaType}_duration`];
                        sendGAEvent(`${mediaType}_start`, mediaParams);
                    } else {
                        // This is a resume from pause or recovery from buffering
                        sendGAEvent(`${mediaType}_play`, mediaParams);
                    }
                    break;

                case 'pause':
                    if (state.isStarted && !element.ended) { // Only if playing and not at the end
                        mediaParams = buildMediaParams(element, state);
                        sendGAEvent(`${mediaType}_pause`, mediaParams);
                    }
                    break;

                case 'ended':
                    if (state.isStarted) {
                        mediaParams = buildMediaParams(element, state);
                        mediaParams[`${mediaType}_percent`] = 100;
                        if(!state.isLive) mediaParams[`${mediaType}_current_time`] = mediaParams[`${mediaType}_duration`];
                        sendGAEvent(`${mediaType}_complete`, mediaParams);
                    }
                    resetMediaState(mediaId);
                    break;

                case 'timeupdate':
                    if (state.isStarted && !state.isLive) { // Only track progress for non-live, started media
                        trackMediaProgress(element, mediaId);
                    }
                    break;

                case 'error':
                    mediaParams = buildMediaParams(element, state); // Try to get info
                    const error = element.error;
                    mediaParams[`${mediaType}_error_code`] = error?.code || 'N/A';
                    mediaParams[`${mediaType}_error_message`] = error?.message || 'Unknown Error';
                    sendGAEvent(`${mediaType}_error`, mediaParams);
                    resetMediaState(mediaId);
                    break;

                case 'seeking':
                    if(state.isStarted) {
                        mediaParams = buildMediaParams(element, state);
                        sendGAEvent(`${mediaType}_seek`, mediaParams);
                        if(!state.isLive) _resetVideoMilestonesOnSeek(state, mediaParams[`${mediaType}_percent`]);
                    }
                    break;

                case 'seeked':
                    if(state.isStarted && !state.isLive) {
                        trackMediaProgress(element, mediaId); // Update progress after seek
                    }
                    break;
                case 'ratechange':
                     if (state.isStarted) {
                        sendGAEvent(`${mediaType}_playback_rate_change`, buildMediaParams(element, state));
                     }
                    break;
            }
        }

        function setupListenersForMedia(element) {
            let mediaId = element.id;
            if (!mediaId) {
                mediaId = `htmlmedia_${Math.random().toString(36).substring(2, 9)}`;
                element.id = mediaId;
            }
            getMediaState(mediaId); // Initialize state object

            if (!element._htmlMediaListenersAttached_enh) {
                // Standard events for comprehensive tracking
                ['loadstart', 'loadedmetadata', 'playing', 'pause', 'ended', 'timeupdate', 'error', 'seeking', 'seeked', 'ratechange'].forEach(type => {
                    element.addEventListener(type, handleMediaEvent, true);
                });
                element._htmlMediaListenersAttached_enh = true;
            }
        }

        document.querySelectorAll('video, audio').forEach(setupListenersForMedia);

        // Use MutationObserver to detect dynamically added media elements
        if (window.MutationObserver && !window._htmlMediaMutationObserverAttached_enh) {
            const observer = new MutationObserver(mutationsList => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                             if (node.nodeType === 1) { // Check if it's an element node
                                if (node.matches('video, audio')) {
                                    setupListenersForMedia(node);
                                } else if (node.querySelector) {
                                    node.querySelectorAll('video, audio').forEach(setupListenersForMedia);
                                }
                            }
                        });
                    }
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            window._htmlMediaMutationObserverAttached_enh = true;
        }
    }

    function initVimeoTracking() {
        if (!config.enableVimeoTracking) return;

        if (typeof Vimeo === 'undefined' || typeof Vimeo.Player === 'undefined') {
            if (!document.querySelector('script[src*="vimeo.com/api/player.js"]') && !window._vimeo_sdk_loading_enh) {
                window._vimeo_sdk_loading_enh = true;
                const vimeoScript = document.createElement('script');
                vimeoScript.src = "https://player.vimeo.com/api/player.js";
                vimeoScript.onload = initVimeoTracking; // Re-initialize once SDK is loaded
                document.head.appendChild(vimeoScript);
            }
            return; // Exit if SDK not ready
        }

        const vimeoPlayers = {}; // Store player instances and their states
        const milestones = config.videoMilestones;

        function getVimeoPlayerState(playerId) {
            if (!vimeoPlayers[playerId]) {
                vimeoPlayers[playerId] = {
                    progressReached: {},
                    isStarted: false,
                    duration: 0,
                    title: 'N/A',
                    videoId: 'N/A',
                    videoUrl: 'N/A',
                    lastReportedMilestone: 0,
                    volume: 1, // Default volume
                    playbackRate: 1 // Default rate
                };
                milestones.forEach(m => vimeoPlayers[playerId].progressReached[m] = false);
            }
            return vimeoPlayers[playerId];
        }

        function resetVimeoPlayerState(playerId) {
            const state = getVimeoPlayerState(playerId);
            state.isStarted = false;
            state.duration = 0;
            state.lastReportedMilestone = 0;
            state.playbackRate = 1;
            // Don't reset title, videoId, videoUrl as they might be needed for a final error event
            milestones.forEach(m => state.progressReached[m] = false);
        }

        function buildVimeoParams(playerState, data = {}) { // data often comes from Vimeo event payloads
             try {
                const currentTime = data.seconds || (playerState.player ? playerState.player.getCurrentTime().then(ct => ct).catch(()=>0) : 0); // Approx if no data
                const duration = playerState.duration || data.duration || 0;
                const percent = duration > 0 ? Math.min(100, Math.round((data.percent || (currentTime / duration)) * 100)) : 0;

                return {
                    video_title: playerState.title,
                    video_url: playerState.videoUrl, // Will be scrubbed/redacted
                    video_duration: Math.round(duration),
                    video_current_time: Math.round(currentTime),
                    video_percent: percent,
                    video_provider: 'vimeo',
                    video_id: playerState.videoId,
                    video_is_muted: playerState.volume === 0,
                    video_is_live: false, // Vimeo Player API does not clearly indicate live status for embeds
                    video_playback_rate: playerState.playbackRate
                };
            } catch(e) {
                // console.error("EA: Vimeo buildVideoParams error", e);
                return { video_provider: 'vimeo', video_error: e.message, video_id: playerState.videoId || 'N/A' };
            }
        }

        function trackVimeoProgress(playerId, data) { // Pass playerId
            const playerState = getVimeoPlayerState(playerId);
            if (!playerState.isStarted) return;

            const params = buildVimeoParams(playerState, data);
            const currentPercent = params.video_percent;

            milestones.forEach(milestone => {
                if (!playerState.progressReached[milestone] && currentPercent >= milestone && milestone > playerState.lastReportedMilestone) {
                    playerState.progressReached[milestone] = true;
                    playerState.lastReportedMilestone = milestone;
                    const milestoneParams = { ...params, video_percent: milestone };
                    sendGAEvent('video_progress', milestoneParams);
                }
            });
        }

        document.querySelectorAll('iframe[src*="player.vimeo.com/video/"]').forEach(iframe => {
            try {
                let iframeId = iframe.id;
                if (!iframeId) {
                    iframeId = 'vimeoPlayer_' + (iframe.src.split('/').pop().split('?')[0] || Math.random().toString(36).substring(2,9));
                    iframe.id = iframeId;
                }

                if (vimeoPlayers[iframeId] && vimeoPlayers[iframeId].player) {
                    return; // Already initialized
                }

                const player = new Vimeo.Player(iframe);
                const playerState = getVimeoPlayerState(iframeId); // Ensures state object exists
                playerState.player = player; // Store the player instance

                player.ready().then(() => {
                    Promise.all([
                        player.getDuration(),
                        player.getVideoTitle(),
                        player.getVideoId(),
                        player.getVideoUrl(),
                        player.getVolume(),
                        player.getPlaybackRate()
                    ]).then(([duration, title, videoId, videoUrl, volume, rate]) => {
                        playerState.duration = duration;
                        playerState.title = title || 'N/A';
                        playerState.videoId = String(videoId) || 'N/A';
                        playerState.videoUrl = videoUrl || iframe.src;
                        playerState.volume = volume;
                        playerState.playbackRate = rate;
                    }).catch(err => console.warn("EA: Vimeo player initial data fetch error", iframeId, err));
                }).catch(err => console.warn("EA: Vimeo player not ready", iframeId, err));

                player.on('play', data => {
                    playerState.duration = data.duration; // Update duration on play, could change
                    const params = buildVimeoParams(playerState, data);
                    if (!playerState.isStarted) {
                        playerState.isStarted = true;
                        sendGAEvent('video_start', params);
                    } else {
                        sendGAEvent('video_play', params);
                    }
                });

                player.on('pause', data => {
                    if (playerState.isStarted) {
                        sendGAEvent('video_pause', buildVimeoParams(playerState, data));
                    }
                });

                player.on('ended', data => {
                    if (playerState.isStarted) {
                        const params = buildVimeoParams(playerState, data);
                        params.video_percent = 100;
                        params.video_current_time = params.video_duration; // Align current time with duration
                        sendGAEvent('video_complete', params);
                        resetVimeoPlayerState(iframeId);
                    }
                });

                player.on('timeupdate', data => {
                    trackVimeoProgress(iframeId, data); // Pass iframeId
                });

                player.on('volumechange', data => {
                    playerState.volume = data.volume;
                    // Optional: sendGAEvent('video_volume_change', buildVimeoParams(playerState, {volume: data.volume}));
                });

                player.on('playbackratechange', data => { // Note: API docs say event is 'playbackratechange'
                    playerState.playbackRate = data.playbackRate;
                    if (playerState.isStarted) {
                         sendGAEvent('video_playback_rate_change', buildVimeoParams(playerState));
                    }
                });

                player.on('error', err => {
                    const params = buildVimeoParams(playerState); // Get existing data
                    params.error_code = err.name; // e.g., 'TypeError', 'RangeError'
                    params.error_message = err.message;
                    params.error_method = err.method;
                    sendGAEvent('video_error', params);
                    resetVimeoPlayerState(iframeId);
                });

                player.on('seeked', data => {
                    if(playerState.isStarted) {
                        sendGAEvent('video_seek', buildVimeoParams(playerState, data));
                        _resetVideoMilestonesOnSeek(playerState, Math.round(data.percent * 100));
                        trackVimeoProgress(iframeId, data); // Update progress after seek
                    }
                });

            } catch (e) {
                console.error("EA: Error setting up Vimeo player:", e, iframe);
            }
        });

        // Use MutationObserver to detect dynamically added Vimeo iframes
        if (window.MutationObserver && !window._vimeoMutationObserverAttached_enh) {
            const observer = new MutationObserver(mutationsList => {
                 for (const mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) {
                                if (node.tagName === 'IFRAME' && node.src && node.src.includes('player.vimeo.com/video/')) {
                                    initVimeoTracking(); // Re-run to catch new iframes
                                } else if (node.querySelector) {
                                    const iframes = node.querySelectorAll('iframe[src*="player.vimeo.com/video/"]');
                                    if (iframes.length > 0) {
                                        initVimeoTracking(); // Re-run
                                    }
                                }
                            }
                        });
                    }
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            window._vimeoMutationObserverAttached_enh = true;
        }
    }

    function initTwitterTracking() {
        if (!config.enableTwitterTracking) return;

        if (typeof twttr === 'undefined' || typeof twttr.events === 'undefined' || typeof twttr.events.bind !== 'function') {
            if (!window._twitter_api_retry_enh) {
                // console.warn("EA: Twitter API (twttr.events) not found. Will retry.");
                window._twitter_api_retry_enh = setTimeout(initTwitterTracking, 2000);
            }
            return;
        }
        // Clear retry timeout if API is now available
        if (window._twitter_api_retry_enh) {
            clearTimeout(window._twitter_api_retry_enh);
            window._twitter_api_retry_enh = null;
        }
        if(window._twitter_events_bound_enh) return; // Prevent double binding

        function getTwitterWidgetType(element) {
            if (!element) return 'unknown';
            if (element.classList && element.classList.contains('twitter-tweet')) return 'single_tweet';
            if (element.classList && element.classList.contains('twitter-timeline')) return 'timeline';
            // For iframes created by widgets.js
            if (element.tagName === 'IFRAME') {
                const src = element.src || '';
                if (src.includes('/widget/') && src.includes('tweet')) return 'single_tweet_iframe';
                if (src.includes('/widget/') && src.includes('timeline')) return 'timeline_iframe';
                // Fallback for iframes inside widget containers
                const parentTweet = element.closest('.twitter-tweet');
                if(parentTweet) return 'single_tweet';
                const parentTimeline = element.closest('.twitter-timeline');
                if(parentTimeline) return 'timeline';
            }
            return 'unknown';
        }

        twttr.events.bind('loaded', event => { // When widgets.js has loaded and initialized widgets
            if (event.widgets && event.widgets.length > 0) {
                event.widgets.forEach(widget => {
                    sendGAEvent('twitter_embed_loaded', {
                        widget_id: widget.id || 'N/A',
                        widget_type: getTwitterWidgetType(widget),
                        page_location: scrubUrlParams(window.location.href)
                    });
                });
            }
        });

        twttr.events.bind('rendered', event => { // When a specific widget has rendered
            const widgetFrame = event.target; // This is usually the iframe of the rendered widget
            if (widgetFrame) {
                sendGAEvent('twitter_embed_rendered', {
                    widget_id: widgetFrame.id || (widgetFrame.closest('.twitter-tweet,.twitter-timeline') ? widgetFrame.closest('.twitter-tweet,.twitter-timeline').id : 'N/A'),
                    widget_type: getTwitterWidgetType(widgetFrame),
                    page_location: scrubUrlParams(window.location.href)
                });
            }
        });

        twttr.events.bind('tweet', event => { // Specifically for tweets rendered within a timeline
            if (event.target && event.tweetId) { // event.target is the timeline widget's iframe
                sendGAEvent('twitter_tweet_rendered', {
                    tweet_id: event.tweetId,
                    widget_id: event.target.id || (event.target.closest('.twitter-timeline') ? event.target.closest('.twitter-timeline').id : 'N/A'),
                    widget_type: 'timeline_tweet', // Differentiate from a standalone tweet embed
                    page_location: scrubUrlParams(window.location.href)
                });
            }
        });
        window._twitter_events_bound_enh = true;
    }

    function initScrollTracking() {
        if (!config.enableScrollTracking || config.scrollThresholds.length === 0) return;

        const thresholds = config.scrollThresholds; // Already sorted numbers
        let thresholdsTriggered = {}; // Store triggered thresholds for current page view

        function getScrollPercent() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
            // Calculate document height, considering all common properties
            const documentHeight = Math.max(
                document.body.scrollHeight, document.documentElement.scrollHeight,
                document.body.offsetHeight, document.documentElement.offsetHeight,
                document.body.clientHeight, document.documentElement.clientHeight
            );
            const windowHeight = window.innerHeight;

            if (documentHeight <= windowHeight) return 100; // Page is not scrollable or fully visible

            const scrollableHeight = documentHeight - windowHeight;
            if (scrollableHeight <= 0) return 100; // Should not happen if docHeight > winHeight

            return Math.min(100, Math.max(0, Math.floor((scrollTop / scrollableHeight) * 100)));
        }

        function handleScroll() {
            const scrollPercent = getScrollPercent();
            thresholds.forEach(threshold => {
                if (!thresholdsTriggered[threshold] && scrollPercent >= threshold) {
                    thresholdsTriggered[threshold] = true;
                    sendGAEvent('scroll_depth', {
                        'percent_scrolled': threshold // Send the target threshold, not exact percentage
                    });
                }
            });
        }

        let scrollTimeout;
        function debouncedScrollHandler() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(handleScroll, 250); // Debounce scroll events
        }

        // Use 'scrollend' if available for modern browsers, fallback to debounced 'scroll'
        const scrollEvent = 'onscrollend' in window ? 'scrollend' : 'scroll';
        const scrollHandler = scrollEvent === 'scrollend' ? handleScroll : debouncedScrollHandler;

        window.addEventListener(scrollEvent, scrollHandler, { passive: true });
        handleScroll(); // Initial check in case page loads already scrolled

        // Function to reset scroll tracking, e.g., on SPA navigation
        window._resetScrollTracking_enh = () => {
            thresholdsTriggered = {};
            setTimeout(handleScroll, 50); // Re-check scroll depth after a brief delay
        };
    }

    function initWebVitalsTracking() {
        if (!config.enableWebVitals || !window.webVitals) {
            if (config.enableWebVitals) console.warn("EA: Web Vitals tracking enabled, but window.webVitals not found.");
            return;
        }
        try {
            const sendVital = (metric) => {
                const eventParams = {
                    metric_name: metric.name,
                    metric_value: metric.value,
                    metric_id: metric.id,
                    metric_rating: metric.rating,
                    metric_delta: metric.delta,
                    debug_navigation_type: metric.navigationType,
                };

                if (metric.attribution) {
                    let target = '(not set)';
                    // Prioritize more specific attribution targets
                    if(metric.attribution.largestShiftTarget) target = metric.attribution.largestShiftTarget;
                    else if(metric.attribution.element) target = metric.attribution.element;
                    else if(metric.attribution.eventTarget) target = metric.attribution.eventTarget;

                    eventParams.debug_target = typeof target === 'string' ? target.substring(0,100) : String(target).substring(0,100);
                    eventParams.debug_event_type = metric.attribution.eventType || '(not set)';
                    eventParams.debug_load_state = metric.attribution.loadState || '(not set)';
                }

                // Ensure consistent number formatting for GA4
                if (metric.name === 'CLS') {
                    eventParams.metric_value = parseFloat(metric.value.toFixed(4));
                } else if (['FCP', 'LCP', 'FID', 'TTFB', 'INP'].includes(metric.name)) {
                    eventParams.metric_value = parseFloat(metric.value.toFixed(2));
                }
                // metric_delta is usually fine as is, but can also be toFixed if needed

                sendGAEvent('web_vitals', eventParams);
            };

            window.webVitals.onCLS(sendVital, {reportAllChanges: true}); // CLS can change, report all
            window.webVitals.onFCP(sendVital);
            window.webVitals.onFID(sendVital);
            window.webVitals.onLCP(sendVital);
            window.webVitals.onTTFB(sendVital);
            window.webVitals.onINP(sendVital);

        } catch (error) {
            console.error("EA: Error setting up Web Vitals tracking:", error);
            sendGAEvent('analytics_error', {
                'error_type': 'web_vitals_setup',
                'error_message': error.message
            });
        }
    }

    function initAdblockDetection() {
        if (!config.enableAdblockDetection) return;

        // Check if status already determined (e.g., by a previous SPA navigation)
        if (typeof window._ga_adblock_status_enh !== 'undefined') {
            setGAUserProperty('has_adblocker', window._ga_adblock_status_enh);
            return;
        }

        // A common technique: try to fetch a well-known ad script.
        // This URL is frequently blocked by ad blockers.
        fetch("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", {
            method: 'HEAD',
            mode: 'no-cors', // We don't need the content, just to see if request is blocked
            cache: 'no-store'  // Try to bypass browser cache
        }).then(() => {
            window._ga_adblock_status_enh = false;
            setGAUserProperty('has_adblocker', false);
        }).catch(() => {
            window._ga_adblock_status_enh = true;
            setGAUserProperty('has_adblocker', true);
        });
    }

    function handleSearchTermCheck(currentUrlString = window.location.href) {
        if (!config.enableSearchTracking || config.searchParams.length === 0) return;

        try {
            const url = new URL(currentUrlString); // Use full URL string
            const params = url.searchParams;
            let searchTerm = null;

            for (const paramName of config.searchParams) {
                if (params.has(paramName)) {
                    searchTerm = params.get(paramName);
                    if (searchTerm) break; // Found a search term
                }
            }

            if (searchTerm) {
                sendGAEvent('view_search_results', {
                    search_term: searchTerm // Will be redacted by sendGAEvent if PII is on
                });
            }
        } catch (e) {
            console.error("EA: Error checking search terms:", e, currentUrlString);
        }
    }

    function initSpaTracking() {
        if (!config.enableSpaTracking) return;

        let lastPath = scrubUrlParams(location.pathname + location.search + location.hash);

        const handleRouteChange = () => {
            // Wait a bit for document.title to potentially update after route change
            setTimeout(() => {
                const newPath = location.pathname + location.search + location.hash;
                const scrubbedNewPath = scrubUrlParams(newPath); // Scrub before comparison

                if (scrubbedNewPath !== lastPath) {
                    lastPath = scrubbedNewPath;
                    sendGAPageView(scrubbedNewPath, document.title); // Send scrubbed path

                    // Re-initialize or reset features that might be affected by new page content
                    if (window._resetScrollTracking_enh) window._resetScrollTracking_enh();
                    if (config.enableAdblockDetection) initAdblockDetection(); // Re-check adblock status

                    // Re-scan for media elements
                    if (config.enableYouTubeTracking) initYouTubeTracking();
                    if (config.enableHtmlMediaTracking) initHtmlMediaTracking();
                    if (config.enableVimeoTracking) initVimeoTracking();
                    if (config.enableTwitterTracking) initTwitterTracking(); // For dynamic twitter widgets

                    if (config.enableFormTracking) initFormTracking(true); // Reset form tracking for new forms
                }
            }, 150); // Delay can be adjusted
        };

        // Wrap history methods
        const originalPushState = history.pushState;
        if (originalPushState) {
            try {
                history.pushState = function(...args) {
                    originalPushState.apply(this, args);
                    window.dispatchEvent(new CustomEvent('pushstate', { detail: args })); // More specific event
                    handleRouteChange();
                };
            } catch (e) { console.error("EA: Error wrapping history.pushState", e); }
        }


        const originalReplaceState = history.replaceState;
        if (originalReplaceState) {
             try {
                history.replaceState = function(...args) {
                    originalReplaceState.apply(this, args);
                    window.dispatchEvent(new CustomEvent('replacestate', { detail: args }));
                    handleRouteChange();
                };
            } catch (e) { console.error("EA: Error wrapping history.replaceState", e); }
        }


        window.addEventListener('popstate', handleRouteChange);
        // window.addEventListener('hashchange', handleRouteChange); // Optionally track hash changes if they signify new views
    }

    function initFormTracking(isSpaNav = false) {
        if (!config.enableFormTracking) return;

        function handleFormEvent(event) {
            const form = event.target.closest('form');
            if (!form) return;

            // Basic form identification
            const formId = form.id || form.name || 'N/A';
            const formAction = form.action || 'N/A';
            const formMethod = form.method || 'N/A';
            let eventName = '';

            const eventParams = {
                form_id: formId,
                form_name: form.name || formId, // Use name if available, else id
                form_action: formAction, // Will be scrubbed/redacted by sendGAEvent
                form_method: formMethod,
                form_destination: scrubUrlParams(form.action || window.location.href) // Redact potential PII in destination
            };

            if (event.type === 'submit') {
                eventName = 'form_submit';
            } else if (event.type === 'focusin') {
                 // Check if any form field inside this form is focused
                if (form.contains(event.target) && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT')) {
                    if (!form._formTrackerStarted_enh) { // Track start only once per form load/interaction
                        form._formTrackerStarted_enh = true;
                        eventName = 'form_start';
                    }
                }
            }

            if (eventName) {
                sendGAEvent(eventName, eventParams);
            }
        }

        if (!isSpaNav || !window._formListenersAttached_enh) {
            document.body.addEventListener('submit', handleFormEvent, true); // Capture submit events
            document.body.addEventListener('focusin', handleFormEvent, true); // Capture focus on form fields
            window._formListenersAttached_enh = true;
        }

        // Reset _formTrackerStarted_enh for all forms on SPA nav or initial load
        // This allows form_start to be re-triggered if user interacts with forms on a new "page"
        document.querySelectorAll('form').forEach(form => {
            delete form._formTrackerStarted_enh;
        });
    }

    function initialize() {
        const initialConfig = { ...config.customDimensionMap };
        if (document.referrer) {
            initialConfig.page_referrer = scrubUrlParams(document.referrer); // Scrub referrer
            if (config.enablePiiRedaction) {
                initialConfig.page_referrer = redactPii(initialConfig.page_referrer); // Then redact
            }
        }

        if (Object.keys(initialConfig).length > 0) {
            gtag('config', GA_MEASUREMENT_ID, initialConfig);
        }
        // Initial page view is typically handled by the main gtag snippet.
        // If this script loads after initial gtag config, send one if SPA or for redundancy.
        // However, usually the main gtag snippet's 'config' command sends the first page_view.
        // We call handleSearchTermCheck for the initial load.
        handleSearchTermCheck(); // For initial page load

        if (config.enableAdblockDetection) initAdblockDetection();
        if (config.enableWebVitals) initWebVitalsTracking(); // Web Vitals should be initialized early
        if (config.enableAutoLinkTracking) initAutoLinkTracking();
        if (config.enableHtmlMediaTracking) initHtmlMediaTracking();
        if (config.enableYouTubeTracking) initYouTubeTracking();
        if (config.enableVimeoTracking) initVimeoTracking();
        if (config.enableTwitterTracking) initTwitterTracking(); // Initialize after twttr is likely loaded
        if (config.enableScrollTracking) initScrollTracking();
        if (config.enableFormTracking) initFormTracking();
        if (config.enableSpaTracking) initSpaTracking(); // SPA should be last to wrap history

        console.log(`Enhanced Analytics v2.5.3 Initialized (ID: ${GA_MEASUREMENT_ID})`);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize(); // DOMContentLoaded has already fired
    }
})();
