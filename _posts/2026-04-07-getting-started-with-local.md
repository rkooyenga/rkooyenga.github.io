---
layout: post
title: "Getting Started With Local AI"
description: Beginners guide to running local uncensored basic AI
date: 2026-04-07 02:00:00
author: Ray Kooyenga
tags:
  - ai
---
<img width="1000" height="478" alt="Screenshot From 2026-07-17 03-59-10" src="https://github.com/user-attachments/assets/601a9181-8df9-45bf-a12f-585b79aee618" />

ChatGPT is cool and all but gets expensive, and steals your data. What if there was a way you could pay less and get more, while protecting privacy? Here's my thoughts on that and a sample solution for anyone curious. 

There are choices people may not realize they have. Trusting cloud-based AI with your trade secrets is bad for business. Government efforts to gatekeep compute and prevent model access is creepy too. Overzealous politically biased safety mechanisms and moral proselytizing is annoying and disruptive. All complications for both consumer and commercial AI use. 

It seems timely to advocate for the benefit of running local. Own your AI or it will own you as they say. There's an obvious benefit to picking up some technical knowledge to run local, abliterated models on your own hardware. 

There's a wave of posts and articles of people dropping $5K to $10K on equipment and subscriptions. For software devs or serving enterprise solutions there are justifications but there are basic stacks not getting a lot of airtime, some that cost next to nothing. 

So for fun here's a simple recipe for essentially free and uncensored Gemini, totally private, no API keys or subscriptions. You can run it on outdated hardware. In fact this demo is on an 8-year-old $200 used laptop I grabbed in Tijuana. (I erased Windows for Linux, obviously because Windows is slow and gay)

    <video width="560" height="315" controls>
      <source src="[/assets/videos/video2.mp4](https://github.com/user-attachments/assets/edae74ba-df6d-4a29-8465-8238f6dbdc90)" type="video/mp4">
      Your browser does not support the video tag.
    </video>
+ Gemma 4 E4B Q4_K_M (abliterated GGUF from Hugging Face): 4-bit quantized for efficient memory use on ~16GB of RAM.
If you have 8GB or less try the E2B file, 31B if you're a baller.
+ llama.cpp: The engine, forcing inference on CPU (bypass low-end GPU).
+ Goose by Block: Orchestration, agentic interface and bridge to autonomous task execution.
+ Ubuntu 26.04: Popular Linux flavor. Use Arch or Kali or Mint or whatever you prefer. Or Windows/Mac if you must.

There you go. It's a Prius not a race car but...this is your own self contained setup for old machines. No rate limits, no monthly fee, no spying, no expensive hardware, and no pussy objections to charged political questions like correlations between race and IQ or "how do i break into a building with a blowtorch".

Enjoy ;)
