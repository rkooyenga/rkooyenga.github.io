---
title: "Adding Favicons to Jekyll Part 1"
tags:
  - jekyll
  - code
created_at: 2025-03-27T00:010:00-07:00
last_modified_at: 2025-03-27T00:010:00-07:00
---
Quick project here to add favicons to my Github Pages Jekyll. I never know what to make as an icon so end up putting it off or copying icons from somewhere else. Which is fine until you see all the fails in your server logs. Or go to build a progressive web app, or the worst has gotta be a chrome extension manifest v2+. If you know you know. 

You need them because Google wants to see them. And so do users. Don't be the ugly grey globe on someones bookmark bar you wont last there long like that. As a user I have 6 icons on my desktop and 3 are my own apps. If I'm going to add your site because I like it that much, how long would it last if yours triggers some error? Or has an ugly generic placeholder? If you appified it how many less installs would you get for having the lowest effort icon? 

That's how you should look at it. If you're like me and always have 20 projects at a time it's crazy to put effort into this for all of them. Especially if you also battle a unease with self promotion. Ironically despite a history owning ad agencies I never felt comfortable marketing myself. Weird but common affliction amongst software types. I'll deep dive on that topic at some point in another article but for now, the icons for your app matter, branding matters, and you being proud of what you build matters. You wouldnt hand someone an expensive gift in a garbage bag, you'd wrap it in the nicest paper. So put a bow on your your work. 

About this site, it is a Jekyll site but it's not using the normal Github template engine. Although I manage my own servers this is hosted entirely at Github like a regular GH Pages site, the difference being I'm opting out of their built in template system. I let their builder build based on whats called a "remote theme" and you can set this up in your config file. In my case I'm also the person hosting said theme files, out of another repository. So GH Pages engine handles the build whenever I post or make a change of both my sites and the theme site. Don't let that complicated configuration give you the impression I know what I'm doing though as I'm a complete novice and just feeling my way around. That said my ideas won't be the worst and despite the less common setup, I whatever we figure out on this article will be a workable method for you too. 

Making the image I was playing with some low res ascii style utilities including Better ASCII one of my own apps in beta: [Better ASCII](https://raykooyenga.com/apps/better-ascii/)

![Image](/assets/images/icon_512.png)

Better ASCII is cool because even it's current state allows lots of configurations for display but also saving which is more rare. For instance you can save a picture of yourself as actual .txt lol. So we're taking that then cropping soon as i saw it, then it's time to make conversions and see how friendly our size is. 

### resize, resample, convert

I'm using Imagemagick here and going to shrink this file for frequent web transfer such as near every transaction. The lines I'm doing manually look something like this to achieve png to 8bit png, grayscale, 1/3 size, reduce to 512x512 from 824px

```shell
convert icon.png -set colorspace Gray -separate -average -sample 512 -quality 70% PNG8:icon_512.png
```

Note the use of **sample** instead of **resize**. SO yes given our use case you can probably see why I'm electing for sampling as opposed to interpolation as removing lines here wont make a huge noticeably difference. If you're wondering about quality (good question if png is lossless) the answer is compression. And decompression takes horsepower. So what we are talkign about is really do you want to max out a users ram/cpu to decompress, or their storage for not doing so or similarly max out their limited data plan? I'm shooting for the right balance Starting at 30k though ain't bad and in fact we ended with 9k. 


imagemagick png to 8bit png, grayscale, 1/3 size, 512x512

```shell
convert icon.png -set colorspace Gray -separate -average -sample 512 -quality 70% PNG8:test.png
```

updated (better preservation of lines on shrink, pronounced blacks and whites, total 5):

```shell
convert icon.png -resize 192x192 -colorspace Gray -normalize -level 15%,85% -sharpen 0x1 -posterize 2 icon_192.png
convert icon.png -resize 256x256 -colorspace Gray -normalize -level 15%,85% -sharpen 0x2 -posterize 2 icon_256.png
```

And updated variation for the 512:

```shell
convert icon.png -colorspace Gray -normalize -resize 512x512 -strip -quality 70% -posterize 2 icon_512.png
```

A few attempts above as depending on the size we're downsizing to, the image would get distorted. Also some window manager thumbnail cache issues hence the ``-strip``. You'll notice I abandoned the force 8 bit and sample options that in fact did not lend themselves to a ascii image the way I hoped. Btw were it not for me writing a article on this, I wouldn't care and just left it as is. Nothing was bad I just thought it could be improved. Even the Rolling Stones tongue icon there before was fine by me.

We have our favicon now in multiple sizes. it looks decent in each size and saves considerable bandwidth while not taking up other resources also. The next step may be a tad more complex than it seems. We aren't just adding to a website we're adding to a template engine. Worse, 'we' means you and me. I don't know about you but I've not done this before and my method and setup are not the most common. For instance, we can hardcode this into the template all day without worrying. But I try to think of what could be better like "if I was desigining the template how would it work" and "if someone else is following my work..." or "if i end up wanting to do this again or change what i did what will that process look like?" The last one is big right?


Thanks for Reading and stay tuned for part 2
