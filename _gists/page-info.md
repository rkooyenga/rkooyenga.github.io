---
title: Page Info Bookmarklet
path: //raykooyenga.com/apps/news-app/images/icons/icon180.png
thumbnail: //raykooyenga.com/apps/news-app/images/ogimage1200x630.png
tagline: "Page Info 🔍 javascript"
description: a multi output multi function info logger
tags:
  - code, bookmarklets, javascript
---

### summary:

Simple address bar execution script to display quick info about the current visited page/URL. 

### usage:
paste in address bar and hit enter, or save as bookmark on your toolbar make sure it starts with javascript: name it whatever you want. easy!

### ➕ the source
```js
javascript:!(function $(){
    var bs = '\n',
        p = 'origin: ' + location.origin + bs,
        a = 'title: ' + document.title + bs,
        g = 'href: ' + location.href + bs,
        e = 'hash: ' + location.hash + bs,
        i = 'agent: ' + navigator.userAgent + bs,
        n = 'last mod: ' + document.lastModified + bs,
        f = 'current: ' + new Date().toLocaleString() + bs + bs,
        o = 'this bookmarklet: (quine)' + bs + '(' + $ + ')()';

    var str = p + a + g + e + i + n + f + o;
    console.log(str);
    window.alert(decodeURIComponent(str));
})();
```

*note:* 
updated ```window.alert(decodeURIComponent(escape(str)));``` as FireFox isn't fond of the call to *escape()*.

Here's a compacted version to highlight and drag to your bookmark bar:

``javascript:(function $(){var bs='\n',p='origin: '+location.origin+bs,a='title: '+document.title+bs,g='href: '+location.href+bs,e='hash: '+location.hash+bs,i='agent: '+navigator.userAgent+bs,n='last mod: '+document.lastModified+bs,f='current: '+new Date().toLocaleString()+bs+bs,o='this bookmarklet (quine):'+bs+'(' + $ + ')()';var str=p+a+g+e+i+n+f+o;console.log(str);window.alert(decodeURIComponent(str));})();``

### details

No dependencies besides a compatible browser and a website not employing restrictions on inline scripts and bookmarks like CSP, etc. Output is a simul-display of current page info to both the dev console and alert box. 

Of all my bookmarklets (even the one that's a terminal stuffed in a bookmark), this one remains a fav I'm kinda proud of. Why? The self-referential mnemonic of the chain of variables spelling out it's function. I was randomly inspired to employ this lexical inception, or poetic echo if you will. 

Poetic code? Like "protected", free artistic expression? [U.S. District Judge Lewis Kaplan](https://www.cs.cmu.edu/~dst/DeCSS/Gallery/wsj-04-12-2001.html) vs *2600 Hacker Quarterly*

Finally and in keeping with our theme, it doesn't get more directly self referential then the tail of the program output being...a copy of itself! We'd that particular self reproduction a "quine" in computer science, after philosopher <cite>Willard Van Orman Quine</cite>. Except, technically I think it can't take input to be called that, but art and rules aren't always compatible. 

Anyway I think it's cool and has proved useful. Hopefully you see some utility in it.


<!--<details>
<summary>But why? </summary>
There's a story there, as published on one of my 30+ github aliases 8 years ago: 


*sigh, compulsion i guess. signed up for a service, got distracted, tried some exploits (no ill intent) just feeling the walls you know, found something right away, but the url was too long for screenshot so this was to capture pertinent info for me, or the developers of the app/site via a message box/console summary if I decide to send it to them or if the authorities need context during the routine questioning of potential witnesses and surveying of open tabs on my screen at the time of my untimely and figurative ⚰ death...*

    
Yeah I don't know. It was a very trying time in my life. And writing midnight javascript favlets and bash functions is something I do when I'm anxious haha.
</details>-->

author: [Ray Kooyenga](@rkooyenga) aka @deadflowers

site: [raykooyenga.com](//raykooyenga.com)

gh pages [rkooyenga.github.io](//rkooyenga.github.io)

[link to gist](https://gist.github.com/deadflowers/79661416cb17c72c17936d6003ce5843)

<!--<script src="https://gist.github.com/deadflowers/79661416cb17c72c17936d6003ce5843.js"></script>-->
