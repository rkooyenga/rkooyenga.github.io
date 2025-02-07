---
layout: gists
title: rss news mobile hotfix
date: 02-05-2025
description: patching RSS News app to adjust for mobile Safari common issues
---

## RSS News - Mobile Hotfix | URL Argument Load


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
