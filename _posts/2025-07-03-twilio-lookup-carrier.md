---
title: Carrier lookup with Twilio API
description: Quick post on Twilio Lookup API
date: 2025-07-03 00:02:00
tags:
  - twilio
  - code
---
![image](https://github.com/user-attachments/assets/cb07c11d-b891-4a6b-a06c-ee2dfc5d9a81)
Use case today: we need to pull a carrier from a mobile phone number to determine which domain to use for sending SMS via email. This is a task needed with some frequency but doesn't need to be fed into any other apps at this time, instead it's manual. Twilio’s Lookup API with line type intelligence makes this straightforward.

For context, sending SMS or MMS via email requires knowledge of the recipient’s carrier. Here are a few common formats:

### Carrier Email Gateways

- **AT&T**  
  - SMS: `10-digit-number@txt.att.net`  
  - MMS: `10-digit-number@mms.att.net`

- **Verizon**  
  - SMS: `10-digit-number@vtext.com`  
  - MMS: `10-digit-number@vzwpix.com`

- **T-Mobile**  
  - SMS & MMS: `10-digit-number@tmomail.net`

---

Enter our Twilio lookup script

A quick shell script using the Twilio Lookup API to return the carrier and line type:

```bash
#!/bin/bash
# linelookup.sh
# Usage: ./linelookup.sh 7141234567

lookup_phone_number() {
  local phone_number="$1"

  if [[ -z "$phone_number" ]]; then
    echo "Error: Provide a phone number (e.g., 7141234567)"
    exit 1
  fi

  if [[ -z "$TWILIO_ACCOUNT_SID" || -z "$TWILIO_AUTH_TOKEN" ]]; then
    echo "Error: TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set"
    exit 1
  fi

  curl -X GET "https://lookups.twilio.com/v2/PhoneNumbers/$phone_number?Fields=line_type_intelligence" \
    -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
    | jq .
}

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <PhoneNumber>"
  exit 1
fi

lookup_phone_number "$1"
```
I have my script as executable with `chmod +x`, dropped the extension, and stored in `$HOME/.local/bin/linelookup` .

You’ll need 'jq' installed for formatting the JSON or you can remove the `| jq` part. Then also your Twilio credentials exported in your shell:
```bash
export TWILIO_ACCOUNT_SID=your_sid
export TWILIO_AUTH_TOKEN=your_token
```
This returns carrier details like:

```json
"line_type_intelligence": {
  "type": "mobile",
  "carrier": "Verizon Wireless"
}
```
Once you have the carrier name, you can route your SMS emails correctly using the domains above. This comes in handy when building automation, contact normalization scripts, or legacy notification systems without native SMS APIs.

My use case 20 years ago was building as far as I know the first lead conversion optimized lead contact forms that would relay the leads to a customer's email and cell phone via text message. Back then it seemed a novel idea. Text messages were not that commonly used, and especially outside America could be expensive, not included in phone plans, or had limits circa 2005. Personally I had to buy expansion packages with Verizon to have blocks of 250 text message capability. This prevented per message overage charges while I beta tested a lead conversion optimization concept on a handful of clients close to the vest who were great for testing new product ideas on and giving honest feedback. A couple real estate brokers in Houston Texas, Pensacola, and medical malpractice or other class action law firms were the guinea pigs here. 

Fast forward a bit and the preferred way to do things would be APIs like Twilio or SignalWire. These Services though initially easy are becoming increasingly complicated in the industry's attempt to police the fraud and spam. The present moment that shift is in process there are some people still on the margins hanging on where using the old method has an application. As for legitimate use cases those still exist as well, they could be as simple as using as an alternate email address for yourself


A funny note about this is part of my immediate use case is for AT&T and apparently for the first time this century I know of AT&T has completely [discontinued the SMS Email](https://signalwire.com/blogs/industry/att-ending-email-to-text#:~:text=What's%20changing?,gateways%20will%20be%20shut%20down.) system and respective domains on June 17 2025 or, 2 weeks ago lol. A throwback to just how cool they use to be though is not only would they format things as MMS or plain text based on type and subdomains (txt, mms, sms), they also had an alias feature where you could just text ray@att.net or rayk@att.net and it worked. I've got a screenshot saved somewhere but man that was a cool. Anyway of all the weeks to do this writeup and sample app right? 

In a more security conscious age dormant legacy products forgotten by the companies that built and hosted them, collecting dust on the backpages of their aging website often yielded gold like that alias program, cloud hosting, free advanced TTS engines, unknown program. And others. How about the ability to buy cheap dialup internet. Credit to Bob for that genius find. Why would you do that? Well, because it comes with 10 email addresses you can rotate across if you built your own custom scrapers filters and email blaster, and hacking a Verizon modem into a IP rotator after disassembling the software to discover the disconnect reconnect commands and overiding in C Script which also leveraged the hosts file and a bounce on my website to accelerate closing the connection at the first sign of delivery error. Not that I did that. And I definitely didn't use it to detect and slide past Google Captcha to harvest all their sponsor data which was so large learning and writing a SQL app was required to even view such a large dataset after two trips to Best Buy for more RAM wasn't enough. That 100% did not happen 😉
