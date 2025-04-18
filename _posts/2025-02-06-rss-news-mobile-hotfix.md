---
title: rss news mobile hotfix
path: //raykooyenga.com/apps/news-app/images/icons/icon180.png
thumbnail: //raykooyenga.com/apps/news-app/images/ogimage1200x630.png
caption: "patching RSS News app "
date: 2025-02-06
tags:
  - code
  - todo
description: "patching RSS News app to adjust for mobile Safari issues"
---

<summary>a note about this task</summary>
<details>
*A note to self when I was on schedule for this project and needed to test and implement a round of essential fixes. I havent read in awhile but given its personal nature expect typos amd improper grammar, thoughts abbreviated, etc. Tho at a glance one thing stands out as the todo checkboxes have Ipad not yet checked off. Apple testing is critical as I'm only recently discovering and quite taken aback by the sheer amound of instances my demos don't function on iphones. As my mother recently passed I inherited an iphone which is helpful for testing now, but also though i've not used it yet, her iPad which is a nice one too so that's be interesting to play with and reason to ease in to logging in and messing with that hopefully find some pictures. That never happened hence the blankn checkboxes. Because...the ipad is missing from yes, the small area that is my dead mother's things. At the same time as all this a friend in town had what I'll call a misadventure. I mean a lot of things by that. Just one small one was losing his house after it being robbbed, etc. This psychological response was sever.
</details>

Trying to knock out 2 types of issues here first is compensating for the usual "why can't iphones click on my buttons" kind of stuff. This will be a combination of CSS and Javscript and not really unexpected. But things have progressed that I want to push some release of this officially soon here.

Task is simple there testing phone1.html and phone2.html which incorporate the proposed fixes.

- [x] to date this is satisfactory o iphones
 
Second up would be the restoration of the Bring-Your-Own RSS FEED. OR rather confirm it as generally working. Expected behavior is the BYO feed proivded will become the new default news source for the current session and immediately populate results page, as well as be listed in the menu.


Having most versions living at Codepen some for a decade there are limitations. Appending to their URLS is a proper feed is all that's needed and the error tolerance is pretty high. What can happen is at codepen for instance they are also appending to strings so theres collision. When hosted in the raykooyenga.com/apps/[appname]``` behavior is largely as expected.Users append ``?q=`` (there are others like ``?url``, or ?site=no assignment just ?[url][+
+
parameter even leaving it blank because why not place a that can be triggered at run time as a url parameter So far unless certain characters it doesnt appear to be wanting to 

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

- [x] Hotfix Behavior Android
- [x] Hotfix Behavior iPhone
- [ ] Hotfix Behavior iPad
- [x] Hotfix Behavior Chrome Desktop
- [x] Hotfix Behavior Firefox Ddesktop


#### :BYO URL Load 

- [x] URL Args Behavior Android
- [ ] URL Args Behavior iPhone
- [ ] URL Args Behavior iPad
- [x] URL Args Behavior Chrome Desktop
- [x] URL Args Behavior Firefox Desktop


### Testing concludes and advises the following:
 
 - uri encoding is often required and the app's responsibility
   should have a way to submit live in app mode
 - review fonts/size (too big on p standard)
 - style big 5col view readmore link animation
 - style bug firefox header drop down, again new way of entering urls it was a hhidden feature before
 - dark mode is sick, needs some formatting fixing up
 - landing promo page should it be a 1st login trigger instead of news?
 
 ### Other feature thoughts

 - service worker downloads pages frequent publications
 - sw  frequent favoptimizes grid perhaps 
 - sw refill/readmore when more data exists?
 - 5 site 1 panel each version? old school rs project
 - screenshot share, html container share
 - **tricky highlighter** - *added! 2/11*
