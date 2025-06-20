---
title: Chat Bubbles in Jekyll
description: Quick post on how the effect was achieved
date: 2025-06-20 02:00:00
tags:
  - jekyll
  - code
---
![image](https://github.com/user-attachments/assets/73eb3064-c2f4-43aa-90d2-d46a24142365)
Recent posts of mine here have a "chat bubble" conversation effect to emulate an AI chat and could be used as well to reference phone calls, texts, obviously many short conversational narrative styles. Here's a quick write up on how that was done for anyone interested, but myself mostly as I'll forget if it's not written down.


Really basic implementation here, the posts have a block in them representing the conversation snippet:
```html
<div class="bubble me">
 <p><strong>Ray:</strong></p>
 <p>Hey Grok — Congrats, you’re the star of a viral tweet tonight...</p>
</div>
<div class="bubble other"><p><strong>Grok:</strong></p>
  <p><strong></strong></p>
 <p>Sure Ray, here's your answer...</p>
</div>
```

My Jekyll has an overide for new.css in the head file. And in it, 3 new CSS files I want successively pulled in that I provide locally (I remote host my theme which is served by my alt ID), the last of which is updates.css. This block resides at the tail of that last file.
```css
/* chat bubbles */
.bubble {
  padding: 17px;
  margin-bottom: 5px;
  border-radius: 30px;
  max-width: 70%;
  word-break: break-word;
  /* General 3D styling for all bubbles */
  border: 1px solid rgba(0, 0, 0, 0.2);
  box-shadow: 
    0 2px 5px rgba(0, 0, 0, 0.15), 
    inset 0 1px 1px rgba(255, 255, 255, 0.4); 
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.7);
}

.bubble.me {
  margin-left: 30px;
  background-color: #add8e6; 
  background-image: linear-gradient(to bottom, #bde0ee, #a1d2e6);
  align-self: flex-end;
}

.bubble.other {
  background-color: #dcf8c6; 
  background-image: linear-gradient(to bottom, #e9f9de, #d0f4b8);
  align-self: flex-start;
}
  /* end chat bubbles */
```
So that's really all there is to it. I have no plans to make a plugin of this nor did I spend more than a couple minutes searching for some fashion of out of the box solutions in existence already, knock yourself out of you want to!

*If you have a similar need and in fact an exactly similar one like posting a GPT or Grok chat, you might wonder about shortcuts to getting it formatted in the way I have or even extracted in the first place. A lengthy chat could be a lot of manual work, but I do have a secret there: a scraper app I call ScrapeGPT or ScrapeChat. This is the first time I tested on Grok and it worked well. Project is still evolving as I want a less opinionated abstract conversation or table data scraper for all kinds of content if that pursuit proves realistic. At the least agent agnostic. Will post on that project soon hopefully, but I take the output as HTML and use that or feed it into my html2md project you can see on my page, then I use that md or even format back to simplified HTML. Here that's what I did which got rid of tons of hard to find and replace inline styles and unnecessary DIVs, then did find and replace on the end result. And the style code and html was fine tuned using my HackMicro.com editor. Sounds complicated, but whole job took a couple minutes*
