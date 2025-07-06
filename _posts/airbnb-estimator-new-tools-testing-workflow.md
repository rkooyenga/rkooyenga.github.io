2 weeks ago I made a rough concept AirBnB businesd evaluator and profit estimator tool. In noticing it in my analytics thus suggesting I may inadvertently have made it public or even saved at all on Codepen I went to search for the URL of the demo and found a impressive looking SASS product doing essentially the same thing for AirBnb. In attempting to somehow catalog the find for later when I have time to look at it I wonder how best to do that? There's an auth popup and blur on the page I assume wants me to pay $5 a month or something to see. Well it's not that important and I don't have time for signing up for something I'll guarantee forget I just want to bookmark it but a bit more than that. 


![image](https://github.com/user-attachments/assets/f79bb02c-6f61-474c-948f-81323ba1929a)

First I gotta get rid of that banner. So, a quick CSS hack is in order. I don't see a blur filter in the CSS page and haven't look at the on page styles or opened up any of the scripts. I see theres a MAIN tag and in it a "box" DIV modal holding the login. I hide it instead of kill it that seems to work. Next the blurring... For that I'm going to shotgun it. html, body, and the ".main-container" class are all getting a unblur or `filter:blur(0px) !important;` brighten it up as well with another filter. Could combine them but who really cares. 

The CSS hack:

```css
div.box{
    visibility:hidden !important;
    /* this was needed once only not sure why 
     display:none;
  */
}
.main-container,body,html{
    filter: blur(0px) !important;
    filter: brightness(1.2) !important;
}
```


I save it in DevTools but it doesn't save on re-open, arghh! Type it out again and add the ` !important` to each line as I hadn't before and it could matter.
I can save it reliable in snippets too or as a bookmarklet script, and it's just easier to do that so lets wrap this in a injector with Javascript:

```javascript
!(function(){var style=document.createElement('style'),styleContent=document.createTextNode('div.box{visibility:hidden !important;display:none;}.main-container,body,html{filter: blur(0px) !important;filter: brightness(1.2) !important;}');style.appendChild(styleContent);var%20mexMeHead=document.getElementsByTagName('head');mexMeHead[0].appendChild(style);})();
```
![image](https://github.com/user-attachments/assets/8970ba8a-6305-42ff-8e95-5b4a0c2e7100)


Cool. Now I can show the person I made the original concept for and see if they care at all. Not holding my breath there, long story. Anyway, maybe I can feed both mine and this into an AI agent and do a comparison and take some inspiration from it. Start with a screenshot, but visual stuff rarely goes my way without pain so I'm not satisfied with that. I have two projects I'm in the middle of or supposed to be in the middle of cleaning up versions on. My Scrapechat scraper for exporting AI chats across multiple agents like Grok and OpenAI, but also general scrapes of table data or conversation, let's call it a kinda smart general webscraper mixed with GPT chat export. Surprisingly and unusually, none of my versions are successful and in a way I've not seen so that's great data! But doesn't help with the current objective. I logged this as a screenshot but also a page of code for non visual AI to digest. OK Project 2 is HackMicro my lightweight nimble code editor that was born as a DataURI and Bookmarklet Javascript. It has a new scraper function built in too. Fun stuff. OK I try that and get caught with just the auth page again. Hmm. OK let's just copy the DOM out of DevTools and paste it in manually we're talking a couple clicks here. 

OK That works well. let's name it and have HackMicro export it as a one page app. 
![image](https://github.com/user-attachments/assets/fcf5435b-b0a5-4c55-92b0-8ec6f8db10db)

I'm jazzed that I found some things to fix on my other projects more than I care about this one, but I am curious if it has potential or what marketability it might have. Later in the evening I show it to the aforementinoed other party and predictably they couldn't care less but I show them on my phone so rather than get them to look at my desktop and since Iphone is the worst thing ever and good luck trying to write in line javascript in the address bar of your iphone safari browser, I just give in and login as one of my gmails. Looks good I'm impressed with the product. Looks like other typical rules followed from the auth login, to the breaking up the fields as different pages of questions (never show them all at once it's a turn off), a free mode that hints at what you're missing, blurring the full results and/or under upgrade... Spend a week on indiehacker Twitter and yu' come away with the same advice. Now, let's see what the prices are. I joked $5 a month but it's actually $34 and $50 a month? Holy sh**. Definitely to keep in back of my mind here to try and get to how many sales are converting. 



notes
```
URL:
https://auth.airdna.co/oauth2/register?response_type=code&scope=profile+openid&state=%7B%22path%22%3A%22%2Fdata%2Frentalizer%22%2C%22search%22%3A%22%3Faddress%3D2233%2520McKenzie%2520Rd%252C%2520Abbotsford%252C%2520BC%2520V2S%25201S8%252C%2520Canada%26bedrooms%3D2%26bathrooms%3D2.0%26accommodates%3D4%22%7D&client_id=5f040464-0aef-48a1-a1d1-daa9fbf81415&redirect_uri=https%3A%2F%2Fapp.airdna.co&bedrooms=2&bathrooms=2.0&accommodates=4

CSS Hack:
div.box{
    visibility:hidden !important;display:none;
}
.main-container,body,html{
    filter: blur(0px) !important;
    filter: brightness(1.2) !important;
}

CSS Hack by JS Injection:
!(function(){var style=document.createElement('style'),styleContent=document.createTextNode('div.box{visibility:hidden !important;display:none;}.main-container,body,html{filter: blur(0px) !important;filter: brightness(1.2) !important;}');style.appendChild(styleContent);var%20mexMeHead=document.getElementsByTagName('head');mexMeHead[0].appendChild(style);})();


Hack Micro use:
attempt scrape, pulls in auth banner. blocking with above reveals no content but otherwise works. Alternate attempt, copy DOM from DevTools and paste HTML into Hack Micro and add CSS hack to the CSS panel or injection version in the JS panel, then save.
```
