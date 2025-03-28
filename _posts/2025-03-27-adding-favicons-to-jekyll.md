---
title: "Adding Favicons to Jekyll Part 1"
tags:
  - jekyll
  - code
created_at: 2025-03-27T00:010:00-07:00
last_modified_at: 2025-03-27T00:010:00-07:00
---

## Adding Favicons to Jekyll

Quick project here to add favicons to my Github Pages Jekyll as I have placeholder stuff there and have lazily used it to feed images elsewhere so it's time to just do the icons. I'm building on top of Michael Rose' Basically Basic, as opposed to a from scratch theme and Basically is itself built on Minima. I'm self hosting my fork of the theme, then feeding that into this via the "remote theme". I'm also novice and probably dont do things right.

Making the image I was playing with some low res ascii style utilities including Better ASCII one of my own apps in beta: [Better ASCII](https://raykooyenga.com/apps/better-ascii/)

Better ASCII is cool because even it's current state allows lots of configurations for display but also saving which is more rare. For instance you can save a picture of yourself as actual .txt lol. So we're taking that then cropping soon as i saw it, then it's time to make conversions and see how friendly our size is. 

### resize, resample, convert

I'm using Imagemagick here and going to shrink this file for frequent web transfer such as near every transaction. The lines I'm doing manually look something like this to achieve png to 8bit png, grayscale, 1/3 size, reduce to 512x512 from 824px

```shell
convert icon.png -set colorspace Gray -separate -average -sample 512 -quality 70% PNG8:icon_512.png
```

Note the use of **sample** instead of **resize**. SO yes given our use case you can probably see why I'm electing for sampling as opposed to interpolation as removing lines here wont make a huge noticeably difference. If you're wondering about quality (good question if png is lossless) the answer is compression. And decompression takes horsepower. So what we are talkign about is really do you want to max out a users ram/cpu to decompress, or their storage for not doing so or similarly max out their limited data plan? I'm shooting for the right balance Starting at 30k though ain't bad and in fact we ended with 9k. 


imagemagick png to 8bit png, grayscale, 1/3 size, 512x512

```convert icon.png -set colorspace Gray -separate -average -sample 512 -quality 70% PNG8:test.png```

updated (better preservation of lines on shrink, pronounced blacks and whites, total 5):

```shell
convert icon.png -resize 192x192 -colorspace Gray -normalize -level 15%,85% -sharpen 0x1 -posterize 2 icon_192.png
convert icon.png -resize 256x256 -colorspace Gray -normalize -level 15%,85% -sharpen 0x2 -posterize 2 icon_256.png

And updated variation for the 512:

```shell
convert icon.png -colorspace Gray -normalize -resize 512x512 -strip -quality 70% -posterize 2 icon_512.png
```

A few attempts above as depending on the size we're downsizing to, the image would get distorted. Also some window manager thumbnail cache issues hence the ``-strip``. You'll notice I abandoned the force 8 bit and sample options that in fact did not lend themselves to a ascii image the way I hoped. Btw were it not for me writing a article on this, I wouldn't care and just left it as is. Nothing was bad I just thought it could be improved. Even the Rolling Stones tongue icon there before was fine by me.

We have our favicon now in multiple sizes. it looks decent in each size and saves considerable bandwidth while not taking up other resources also. The next step may be a tad more complex than it seems. We aren't just adding to a website we're adding to a template engine. Worse, 'we' means you and me. I don't know about you but I've not done this before and my method and setup are not the most common. For instance, we can hardcode this into the template all day without worrying. But I try to think of what could be better like "if I was desigining the template how would it work" and "if someone else is following my work..." or "if i end up wanting to do this again or change what i did what will that process look like?" The last one is big right?


Thanks for Reading and stay tuned for part 2
