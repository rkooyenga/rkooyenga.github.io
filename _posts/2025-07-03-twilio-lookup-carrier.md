---
title: Caller Name + Carrier lookup in Twilio API
description: Quick post on who owns a phone number and what carrier via Twilio Lookup API
date: 2025-07-03 00:02:00 -0700
updated: 2025-07-29 18:30:00 -0700
tags:
  - twilio
  - api
  - code
---
![](https://github.com/user-attachments/assets/cb07c11d-b891-4a6b-a06c-ee2dfc5d9a81)
Use case today: we need to pull a carrier from a mobile phone number to determine which domain to use for sending SMS via email. This is a task needed with some frequency but doesn't need to be fed into any other apps at this time, instead it's manual. Twilio’s Lookup API with line type intelligence makes this straightforward.

For context, sending SMS or MMS via email requires knowledge of the recipient’s carrier. Here are a few common formats:

### Carrier Email Gateways

- **AT&T**  
  - SMS: `10-digit-number @ txt.att.net`  
  - MMS: `10-digit-number @ mms.att.net`

- **Verizon**  
  - SMS: `10-digit-number @ vtext.com`  
  - MMS: `10-digit-number @ vzwpix.com`

- **T-Mobile**  
  - SMS & MMS: `10-digit-number @ tmomail.net`

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

Now I know what you're thinking. That's a nice trip through the Smithsonian Ray maybe we could talk about replacement parts for our telegraphs next. What about something cool like, who owns a number?

Fair question. And the lookup API does allow us to get that information. It's in the raw data just my example number doesn't have that info. Were I disclosing my own cell here, it does show as me. But let's do a version 2 of our script. We're going to pull some additional info here and filter for owner's full name where applicable, and I've also commented out but added in filter for Sim Swap and SMS Pump risk. Our original is JSON and looks like the header image in this article. This version will give us a formatted table of just a few details.

```bash
#!/bin/bash
# Query Twilio Lookup API line intelligence caller name and carrier
# Usage: linelookup.sh 7141234567
# Author: Ray Kooyenga
# Version: 0.2
# Dependencies: jq, curl, TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN set in environment

lookup_phone_number() {
  local phone_number="$1"

  if [[ -z "$phone_number" ]]; then
    echo "Error: Please provide a phone number in the format 7141234567"
    exit 1
  fi

  if [[ -z "$TWILIO_ACCOUNT_SID" || -z "$TWILIO_AUTH_TOKEN" ]]; then
    echo "Error: TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variables are not set."
    exit 1
  fi

  echo "Looking up: $phone_number"
  echo "----------------------------------------"

  response=$(curl -s -X GET "https://lookups.twilio.com/v2/PhoneNumbers/$phone_number?Fields=caller_name,line_type_intelligence" \
    -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN")

  if [[ -z "$response" ]]; then
    echo "Error: No response received from Twilio API."
    exit 1
  fi

#  echo "$response" | jq .

  echo ""
  echo "Line Info:"
  echo "----------------------------------------"
#  echo "Sim Swap Risk   : $(echo "$response" | jq -r '.sim_swap')"
#  echo "SMS Pump Risk   : $(echo "$response" | jq -r '.sms_pumping_risk')"
  echo "National Format : $(echo "$response" | jq -r '.national_format')"
  echo "International   : $(echo "$response" | jq -r '.phone_number')"
  echo "Country Code    : $(echo "$response" | jq -r '.country_code')"
  echo "Line Type       : $(echo "$response" | jq -r '.line_type_intelligence.type')"
  echo "Carrier         : $(echo "$response" | jq -r '.line_type_intelligence.carrier_name')"
  echo "Caller Name     : $(echo "$response" | jq -r '.caller_name.caller_name // "N/A"')"
 
}

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <PhoneNumber>"
  echo "Example: $0 7141234567"
  exit 1
fi

lookup_phone_number "$1"
```

Here's what it should look like.

![](https://github.com/user-attachments/assets/5306f4b5-a2a3-470e-89d5-ca5ce72acc14)

If you want the SMS Pump and Sim Swap just uncomment. If you want it unfiltered uncomment the first jq line above our table. 

Here's another use case, I have 10 unrecognized numbers half toll free and I suspect spam/telemarketer stuff. Android pretty much handles this seamlessly but I'm temporarily on an iPhone (total psyop, I loathe mine). So I run `linelookup` on each one and the output is useful. Between saying company name or outright listing it as spam or fraud like so: 
![](https://github.com/user-attachments/assets/b8e19a0b-7ef9-4422-9035-5467152a93cc)

I get to block all 10 numbers I looked up and continue to feel great about never answering my phone haha!

Back to the original plan though email SMS. Archaic? That's fair. My use case 20 years ago was building as far as I know the first lead conversion optimized lead contact forms that would relay the leads to a customer's email and cell phone via text message. Back then it seemed a novel idea. Text messages were not that commonly used, and especially outside America could be expensive, not included in phone plans, or had limits circa 2005. 

Personally I had to buy expansion packages with Verizon to have blocks of 250 text message capability. Anyone else remember that? This prevented per message overage charges while I beta tested a lead conversion optimization concept on a handful of clients close to the vest who were great for testing new product ideas on and giving honest feedback. A couple real estate brokers in Houston Texas, Pensacola, and medical malpractice or other class action law firms were the guinea pigs here. 

Fast forward a bit and the preferred way to do things would be APIs like Twilio or SignalWire. These services though initially easy are becoming increasingly complicated in the industry's attempt to police the fraud and spam. The present moment that shift is in process there are some people still on the margins hanging on where using the old method has an application. As for legitimate use cases those still exist as well, they could be as simple as using as an alternate email address for yourself

*Let's do an update here though **july 29** and fix something that is giving me a headache. I have another quick post on looking up IP geolocations, our Twilio script is pretty much what we need with a few changes. But there's 2 scripts one filtered to certain fields after pipe to `jq`, the other just going through `jq`. If we're going to reuse it I don't want to reuse 2 versions, and then have 2 versions of our ip script, and so on for the next reuse. So let's

- consolidate into one version
- add command line arg for raw, jq, jq with filter
- make pretty jq the default if not specified
- colorize output
- make sure we're pipe friendly
- update filter field choices

**And here is our final version!**
![](https://gist.github.com/user-attachments/assets/e5a79be8-5e5a-49aa-bd5b-6cd1db5fb43d)

```bash
#!/bin/bash
# Twilio Lookup API Script (Caller + Line Intelligence)
# Usage: linelookup.sh [-m raw|jq|filter] [PhoneNumber]
# Author: Ray Kooyenga
# Version: 0.3
# Dependencies: jq, curl
# TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in environment

# Color codes
RED="\e[1;31m"
YELLOW="\e[1;33m"
CYAN="\e[1;36m"
RESET="\e[0m"

print_usage() {
  echo -e "${YELLOW}Usage:${RESET} $0 [-m raw|jq|filter] [PhoneNumber]"
  echo -e "${YELLOW}Example:${RESET} echo 7141234567 | $0 -m filter"
  exit 1
}

colored_label() {
  echo -en "${CYAN}$1${RESET}"
}

lookup_phone_number() {
  local phone="$1"
  local mode="$2"

  if [[ -z "$phone" ]]; then
    echo -e "${RED}Error:${RESET} Please provide a phone number in the format 7141234567"
    print_usage
  fi

  if [[ -z "$TWILIO_ACCOUNT_SID" || -z "$TWILIO_AUTH_TOKEN" ]]; then
    echo -e "${RED}Error:${RESET} TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variables are not set."
    exit 1
  fi

  echo -e "${YELLOW}Looking up:${RESET} $phone"
  echo "----------------------------------------"

  response=$(curl -s -X GET "https://lookups.twilio.com/v2/PhoneNumbers/$phone?Fields=caller_name,line_type_intelligence" \
    -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN")

  if [[ -z "$response" ]]; then
    echo -e "${RED}Error:${RESET} No response received from Twilio API."
    exit 1
  fi

  case "$mode" in
    raw)
      echo "$response"
      ;;
    jq)
      echo "$response" | jq
      ;;
    filter)
      colored_label "Sim Swap Risk         : "; echo "$(echo "$response" | jq -r '.sim_swap // "N/A"')"
      colored_label "SMS Pump Risk         : "; echo "$(echo "$response" | jq -r '.sms_pumping_risk // "N/A"')"
      colored_label "National Format       : "; echo "$(echo "$response" | jq -r '.national_format')"
      colored_label "International         : "; echo "$(echo "$response" | jq -r '.phone_number')"
      colored_label "Country Code          : "; echo "$(echo "$response" | jq -r '.country_code')"
      colored_label "Line Type             : "; echo "$(echo "$response" | jq -r '.line_type_intelligence.type // "N/A"')"
      colored_label "Carrier               : "; echo "$(echo "$response" | jq -r '.line_type_intelligence.carrier_name // "N/A"')"
      colored_label "MCC (Mobile Country)  : "; echo "$(echo "$response" | jq -r '.line_type_intelligence.mobile_country_code // "N/A"')"
      colored_label "MNC (Network Code)    : "; echo "$(echo "$response" | jq -r '.line_type_intelligence.mobile_network_code // "N/A"')"
      colored_label "Caller Name           : "; echo "$(echo "$response" | jq -r '.caller_name.caller_name // "N/A"')"
      colored_label "Caller Type           : "; echo "$(echo "$response" | jq -r '.caller_name.caller_type // "N/A"')"
      colored_label "Caller Name ErrorCode : "; echo "$(echo "$response" | jq -r '.caller_name.error_code // "N/A"')"
      ;;
    *)
      echo -e "${RED}Error:${RESET} Unknown mode '$mode'"
      print_usage
      ;;
  esac
}

# Default mode
MODE="jq"
PHONE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--mode)
      MODE="$2"
      shift 2
      ;;
    -*)
      echo -e "${RED}Unknown option:${RESET} $1"
      print_usage
      ;;
    *)
      PHONE="$1"
      shift
      ;;
  esac
done

# Allow pipe input
if [[ -z "$PHONE" && ! -t 0 ]]; then
  read -r PHONE
fi

lookup_phone_number "$PHONE" "$MODE"
```

Let's throw it in a Gist too [Line Lookup App](https://gist.github.com/deadflowers/165d2bfe14b2f999a9d97124c51519b0)

Sweet! Here's a screencast.
<iframe id="youtubePlayer_hFoHI4il4ss" width="640" height="360" src="https://www.youtube-nocookie.com/embed/C64pB2fttNQ?controls=0&enablejsapi=1&origin=https%3A%2F%2Frkooyenga.github.io" frameborder="0" allowfullscreen=""> </iframe>
Twilio Lookup API script


A funny note about this is part of my immediate use case is for AT&T and apparently for the first time this century I know of AT&T has completely [discontinued the SMS Email](https://signalwire.com/blogs/industry/att-ending-email-to-text#:~:text=What's%20changing?,gateways%20will%20be%20shut%20down.) system and respective domains on June 17 2025 or, 2 weeks ago. Of all the weeks to do this writeup and sample app right? 

A throwback to just how cool they use to be though is not only would they format things as MMS or plain text based on type and subdomains (txt, mms, sms), they also had an alias feature where you could just text ray@att.net or rayk@att.net and it worked. I've got a screenshot saved somewhere but man that was a cool.

In a more security conscious age dormant legacy products forgotten by the companies that built and hosted them, collecting dust on the backpages of their aging website often yielded gold like that alias program, cloud hosting, free advanced TTS engines, and others. Just on AT&T alone. How about the ability to buy cheap dialup internet. Credit to Bob for that genius find. Why would you do that? Well, because it comes with 10 email addresses you can rotate across if you built your own custom scrapers filters and email blaster, and hacking a Verizon modem into a IP rotator after disassembling the software to discover the disconnect reconnect commands and overiding in C Script which also leveraged the hosts file and a bounce on my website to accelerate closing the connection at the first sign of delivery error. 

Not that I did that. And I definitely didn't use it to detect and slide past Google Captcha to harvest all their sponsor data which was so large learning and writing a SQL app was required to even view such a large dataset after two trips to Best Buy for more RAM wasn't enough. That 100% did not happen 😉
