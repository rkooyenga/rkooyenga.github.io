---
title: rss news mobile hotfix
path: //raykooyenga.com/apps/news-app/images/icons/icon180.png
thumbnail: //raykooyenga.com/apps/news-app/images/ogimage1200x630.png
caption: "patching RSS News app "
description: patching RSS News app to adjust for mobile Safari issues
tags:
  - coder, github
---

## RSS News - Mobile Hotfix | URL Argument Load

Trying to knock out 2 types of issues here first is compensating for the usual "why can't iphones click on my buttons" kind of stuff. This will be a combination of CSS and Javscript and not really unexpected. But things have progressed that I want to push some release of this officially soon here.

Second up would be the restoration of the Bring-Your-Own RSS FEED. OR rather confirm it as generally working. Expected behavior is the BYO feed proivded will 
become the new default newas source for the current session and immediately populate results page, as well as be listed in the menu.

HAving most versions living at Codepen some for a decade there are limitations. Appending to their URLS is a proper feed is all that's needed and the error tolerance is pretty high. What can happen is at codepen for instance they are also appending to strings so theres collision. Also there had been instances of needing base64 conversion. 

Having been liberated from codepen and hosted in the raykooyenga.com/apps/[appname]``` backup indp  The way it workls is users append ``?q=`` (there are others like ``?url``, or no assignment just ?[url][+
+
paramatereven leaving it bla because why notplace a that can be triggered at run time as a url parameter So far unless certain characters it doesnt appear to be wanting to 

- get random rss/feed url:
 - oc register example
- URI encode string special characters it, just a line a javascript in the terminal does it but may not be necessary anymore:

```shell
node -e 'let newurl="https://www.ocregister.com/feed/";
let newurlenc=encodeURIComponent(newurl);console.log(newurlenc);'
```

- output *from above*:

``https%3A%2F%2Fwww.ocregister.com%2Ffeed%2F``

- now add as parameter on launch:

``https://raykooyenga.com/apps/news-app/?q=https%3A%2F%2Fwww.ocregister.com%2Ffeed%2F``

- or the mobile device hotfix branch:

``https://raykooyenga.com/apps/news-app/phone2.html?q=https%3A%2F%2Fwww.ocregister.com%2Ffeed%2F``

### Tests

test subject: ** app/phone2.html **

#### :Hotfix

- [ ] Hotfix Behavior Android
- [ ] Hotfix Behavior iPhone
- [ ] Hotfix Behavior iPad
- [ ] Hotfix Behavior Chrome Desktop
- [ ] Hotfix Behavior Firefox Ddesktop


#### :BYO URL Load 

- [ ] URL Args Behavior Android
- [ ] URL Args Behavior iPhone
- [ ] URL Args Behavior iPad
- [ ] URL Args Behavior Chrome Desktop
- [ ] URL Args Behavior Firefox Desktop
