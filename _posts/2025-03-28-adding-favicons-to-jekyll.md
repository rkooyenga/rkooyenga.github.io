---
title: "Adding Favicons to Jekyll Part 2"
tags:
  - jekyll
  - code
created_at: 2025-03-28T01:28:00-07:00
last_modified_at: 2025-03-28T01:28:00-07:00
---

## Adding Favicons to Jekyll Part 2

OK we made an icon we like, edited it, compressed it. It's web ready and time to add, but we aren't using a flat html page. It's a generated static page by the Jekyll builder. Easy enough to hardcode around and explicitly refernce the path, but is that what we want? Lets try and fit it in more seamlessly so we improve the process for next time. Thinking in that model sometimes seems like an overthinking waste of time. And with nothing else to justify it perhaps there's truth there. 

I mentioned some reasoning in the close of part 1 like others following your code in an organization, that's big but I can't relate as much as that's never been my world. But I like making stuff, learning, and creating things that make my process easier is entertaining, I appreciate it later. Most important ask yourself when looking at the whole thing upon completion is that improvement something others would find value in to a significant degree? In other words did you just potentially make a product. Can't stress that enough. Lots of things I thought I made for me years later other people are selling. Sometimes follow the whole process to mimic what others are doing, to understand their pain points so you know what solutions to build!

Back to the favicon. I'm seeing some people just hardcode it in on stack exchange. Interesting but welcome sight. Because if the by-the-book nerds don't particularly care neither do I. Well I would like to get it to improve down the road changes so I have something in mind here. The config file ``_config.yml``, you can add your own variables.

I'm adding these to my config file:

```yaml
favicon: assets/images/icon_192.png
favicon_big: assets/images/icon_256.png
favicon_biggest: assets/images/icon_512.png
```

Remember I said I use a remote hosted theme but also that I'm the one hosting? One reason I do this is to have the power to change anything but the ability to see where a division should be between template and the variable data it is instantiated with. In this case I think this solution feels like it should be part of the template so I'm adding these as blank fields to the template config:

```yaml
favicon: 
favicon_big:
favicon_biggest:
```
 
Next lets figure out which piece should refer to this. It looks like ``_includes/head.html``. If you're using a remote theme and just have a config file you cna try adding the _includes folder and placing a file named ``head.html`` in it for overriding the default. I'm going to do that in both my user side and also the hosted theme. 

This is what I'll be adding:

```liquid
{% raw %}
<link rel="shortcut icon" href="{{ site.favicon | absolute_url}}">

<link rel="apple-touch-startup-image" href="{{ site.favicon_biggest | absolute_url}}">

{% endraw %}
```

This will take my variables favicon and favicon_biggest path and append it to the absolute url as defined in the config file also. Absolute url is a filter in jekyll which combines the url ``https://rkooyenga.github.io`` and baseurl ``/`` Your setup may or may not be like that but thats why I'm choosing this route and also absolute url is I believe SEO preferred, best practice, and the placing of the icon in a sub folder then referencing it here is also best practice per the W3 Consortium. 

Here's what my head file looks like:

```liquid
{% raw %}
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#e7a904">
    <meta name="mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="shortcut icon"  type="image/png"  href="{{ site.favicon | absolute_url}}">
    <link rel="apple-touch-startup-image"  type="image/png"  href="{{ site.favicon_biggest | absolute_url}}">
...other stuff...

{% endraw %}
```

As with the previous updates, I'm applying this change to my template theme as well as the site itself. Here's what this output when loaded:

```liquid
{% raw %}
<html lang="en-US" class="no-js">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#e7a904">
    <meta name="mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="shortcut icon"  type="image/png"  href="https://rkooyenga.github.io/assets/images/icon_192.png">
    <link rel="apple-touch-startup-image"  type="image/png"  href="https://rkooyenga.github.io/assets/images/icon_512.png">

{% endraw %}
```

Note the last two lines? We're good!! Your keen eye may be inquisitive about the no-js class at top. That just because for speed I just ran it in the terminal ``curl -L rkooyenga.github.io|head --lines 10``


In closing here I feel good about the process. It feels more by the book than I'm generally inclined to be. So I try to pat myself on the back when I do something I think is how the IBM guys with garter belts on their socks (not even joking it's some real 50s shit) might've done it. In testing i'm getting no errors and dragging my site to the chrome favorites bar theres my icon. But there's more. I already see a problem with these icons in how I processed them. But since we're using variables and templates it's going to be a 2 minute change with zero coding. Having second thoughts about the whole ascii squished down idea of a site icon concept but, if I decide to change them completely, that'll be a cinch too with zero code!

Thanks for sticking through this and if it looks like there's any reads here I'll do another writeup on Jekyll stuff.

Be Best,
RK
