---
title: Carrier lookup with Twilio API
description: Quick post on Twilio Lookup API
date: 2025-07-03 00:02:00
tags:
  - twilio
  - code
---
![image]()
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

### 🔧 Solution: Twilio Line Lookup Script

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

A funny note about this is part of my immediate use case is for AT&T and apparently for the first time this century I know of AT&T has completely discontinued the SMS Email system and respective domains on June 17 2025 or, 2 weeks ago lol. A throwback to how cool they use to be though is not only would they format things as mms to give you a nice broken up message with formatting on the mms domain, they also had an alias feature where you could just text ray@att.net or rayk@att.net and it worked. I've got a screenshot saved somewhere but man that was a cool. Anyway of all the weeks to do this writeup and sample app right?
