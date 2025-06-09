---
title: NASA A-Van-Gogh-Go  
description: CSS Blend Modes Experiment with Weather Video  
date: 2025-06-03  
tags:  
 - codepen  
---
![animated and distorted nasa satellite imagery](/assets/images/nasa-van-gogh-go.jpg)
**What is it?**  
Honestly, some testing for a project but as a visualization or art piece it's pretty cool. 

Literally we're taking a NASA Gulfstream weather-tracking satellite feed, styling it using CSS blend modes, and creating a Van Gogh-esque swirling animation. The name “NASA a-Van-Gogh-go” Seemed catchy. Obciously, Dutch Post-Impressionism colliding with satellite imagery, styled purely via CSS, then a nod to retro ‘60s American culture or better early punk abstraction of that — think *Misfits*, *Ramones*. The lack of congruence with these colliding themes really made it a must-post piece of nonsense.

Anyway — I like it.

**But why?**  
Time kind of stopped for me earlier this month of May, long story but I’m still piecing together where I left off. As best as I can remember, I was overhauling a screen recorder app, and part of the update was to explore some filter effects and Picture-in-Picture (PiP) support. The test I ran was to see how blend modes behave in both docked and undocked PiP windows, and whether I could style the video with effects in either state. It seems PiP windows don’t support much in the way of styling, which was the core of the experiment — blend modes applied to a preview screen or monitor view. I also noticed that some recent CSS changes affected how I layered elements, compared to a developer I follow who uses a similar technique.

In any case, the test gave me my answer: a new approach is needed. Although unfortunate, I liked this visual a lot and so once it started to evoke a kind of swirling Van Gogh effect — I decided to not delete it, publish the result.

Since I don’t watch TV and instead stream my monitor or mobile devices to the screen over WiFi (Bluetooth is a nightmare), I’m always looking for ambient visuals the TV can display while music plays on the soundbar. Eventually, I’d love to integrate hand tracking and audio-reactive visualizations so the visuals interact with the room and its occupants. That’s not a priority right now, but it’s on the horizon.

This piece, though — I might strip it down to a standalone HTML file and send it over to the TV in as close to a frameless presentation as possible. 

**On the Code:**  
There’s some not-so-straightforward code in here. There exists HTML, CSS, and JavaScript lines that are mainly used to control how the piece is displayed inside CodePen’s Details view, which has some constraints — especially in terms of default viewport size and cropping. You’ll see some scroll and zoom code commented out. There’s also logic for autoplay, fallback images, and thumbnail handling — all part of making it behave nicely within CodePen.

Outside of that, the core code is pretty simple.

*If it's not animating, hit the “Rerun” button in the bottom right.*

<p class="codepen" data-height="600" data-theme-id="light" allow="autoplay" muted data-default-tab="result" data-slug-hash="bNNKaqg" data-pen-title="CSS Mix Blend Mode + Video" data-user="deadflowers" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 1px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/deadflowers/pen/bNNKaqg">
  CSS Mix Blend Mode + Video</a> by Ray Kooyenga (<a href="https://codepen.io/deadflowers">@deadflowers</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>
