---
title: cloudfront invalidations by cli
tagline: aws cli
description: "note to self"
tags:
  - aws
  - bytes
---

Note to self on cache invalidation for cloudfront via aws cli as I for some reason always used the web and rarely mess in AWS these days. 

Basic cache invalidation of file:

```shell

aws cloudfront create-invalidation \
    --distribution-id E1TYUW3XFWTEXJ \
    --paths "/assets/bkjs/pagedependencies.js"
```

response from invalidation command:

```shell

https://cloudfront.amazonaws.com/2020-05-31/distribution/E1TYUW3XFWTEXJ/invalidation/IC5UBG72BAFNZLR4DHQVY7HFLP
INVALIDATION	2025-04-16T03:46:14.946Z	IC5UBG72BAFNZLR4DHQVY7HFLP	InProgress
INVALIDATIONBATCH	cli-1744775174-910229
PATHS	1
ITEMS	/assets/bkjs/pagedependencies.js
```

Says in progress, to check status let's try:

```shell

aws cloudfront list-invalidations --distribution-id E1TYUW3XFWTEXJ
```

And our response to that is:

```shell

ITEMS	2025-04-16T14:51:43.248Z	I3ZVG7K6IMT*****O0U6IJKFJ7	Completed
ITEMS	2025-04-16T11:28:45.632Z	I2RZMQAJNM5*****0HJOVDXFOF	Completed
ITEMS	2025-04-16T11:24:05.342Z	I8X2WFOOKN9*****9MB18XGP7V	Completed
ITEMS	2025-04-16T03:46:14.946Z	IC5UBG72BAF*****DHQVY7HFLP	Completed
ITEMS	2025-04-15T12:40:30.693Z	I8UXFI27G8W*****7QVXL1J8XJ	Completed
```

Cool, now what if we want to have those invalidations IDs transalate to something more human readable? Just kidding I think we're out of luck there. Not worth the squeeze on todays mission. 

However, I did just pick up something unexpected. I love command histories rely on them be it a forensic accounting of changes made or remembering a path or a command. And I've many times created systems for myself to help make the inventory and indexing of histories more robust. Shell functions triggered by login and logout events, maxing out the size of coammand history files. Even now new machine but this and my server right away I put history archive folder and every so often i dump my history to it it's been a lifesaver. So I randomly wondered hey, easiest thing for a recent aws action would be if bash didnt record it (sometimes too many terminals open) what about aws itself? Well, yes that does exist it turns out. You can manually edit your config file or, try this:

```shell

aws configure set cli_history enabled
```

You've now activated the history logging feature of aws cli! So how to use it? Pretty basic you got 2 choices

```shell

aws history list

aws history show
```

List will give you a listing of recent commands 1 per row. There's some other column details so it seems like maybe buildign a little function with awk would be useful. I love that but don't have time today. You've also got "show" as a command. If you want a forensic reporting of the submitted command, this looks like it would satisfy Hoover.

That's all for now!

