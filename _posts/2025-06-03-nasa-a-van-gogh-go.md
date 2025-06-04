---
title: NASA A-Van-Gogh-Go
description: CSS Blend Modes Experiment with Weather Video
date: 2025-06-03
tags:
  - codepen 
---

What is it? I don't know. It's a NASA weather satellite video with CSS Blend Modes and I that NASA a go-go but like van Gogh was catchy to me even if obscure to others. Why? Been a wild month let me think here, I want to say I was writing a version of my screen cast app and the pop out window having effects as opposed to the docked one woas going to be a easy solution if possible but this test as recall made it apparent that wasn't not going to be an effetive path. Then It looked cool so I published. Further code is in here as fallbacks and to make sure it displays right not just on load but specifically in the codepen detail view pens can show up in. It started out pretty clean and simple though. Anyway Nasa a Van Gogh Gogh:

<p class="codepen" data-height="600" data-theme-id="light" data-default-tab="html,result" data-slug-hash="bNNKaqg" data-pen-title="CSS Mix Blend Mode + Video" data-user="deadflowers" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/deadflowers/pen/bNNKaqg">
  CSS Mix Blend Mode + Video</a> by ray kooyenga (<a href="https://codepen.io/deadflowers">@deadflowers</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

<style>img {
  height: 1000px;
  width: 1000px;
  z-index: 10;
  visibility: none;
}

/* once again for the demo as the lag on starting results in something unnacceptable where layer divs gradient table is top left on white space */
html {
  background: url("https://d3uaz5bp3928j6.cloudfront.net/assets/web/img/swirlcomp.webp")
    no-repeat center center fixed;
  -webkit-background-size: cover;
  -moz-background-size: cover;
  -o-background-size: cover;
  background-size: cover;
}

.container {
  position: absolute;
}

.layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 0, 0, 1) 0%,
    rgba(255, 154, 0, 1) 10%,
    rgba(208, 222, 33, 1) 20%,
    rgba(79, 220, 74, 1) 30%,
    rgba(63, 218, 216, 1) 40%,
    rgba(47, 201, 226, 1) 50%,
    rgba(28, 127, 238, 1) 60%,
    rgba(95, 21, 242, 1) 70%,
    rgba(186, 12, 248, 1) 80%,
    rgba(251, 7, 217, 1) 90%,
    rgba(255, 0, 0, 1) 100%
  );
  mix-blend-mode: plus-lighter;
}

::-webkit-scrollbar {
  display: none;
}

/* look better in demo detail view either scroll via js or flip the vid */
html,
body {
  zoom: 1;
}
video {
  transform: rotateY(180deg);
  -webkit-transform: rotateY(180deg); /* max-inline-size: 300%; */
}</style>
<div class="container">
  <video id="video">
    <source src="https://assets.science.nasa.gov/content/dam/science/esd/articles/2025/The%20North%20American%20Gulf%20Stream.mp4" type="video/mp4">
    <img id="image-placeholder" src="https://d3uaz5bp3928j6.cloudfront.net/assets/web/img/swirlcomp.webp" height=100 width=100 type="image/webp">
  </video>
  <div id="layer" class="layer"></div>
</div>
<script>!(function init() {
  document.querySelector("#video").autoplay = true;
  document.querySelector("#video").loop = true;
  document.querySelector("#video").playbackRate = 0.5;
})();
</script>
