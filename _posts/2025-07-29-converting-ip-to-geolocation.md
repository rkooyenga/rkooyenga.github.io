---
title: Converting IP to Geolocation
description: Converting IP Address to Location in Console with ip2location.io Free API
date: 2025-07-29 06:06:00
tags:
  - api
  - code
---
Earlier this month we worked up a quick script for looking at caller ID or telephone numbers to determine the carrier, line type, name on file where applicable, and other stats. Today we are needing to verify IP and locations to do some verifications for banking while abroad. 
![image](https://gist.github.com/user-attachments/assets/336da060-932e-4757-80b3-17d15edb2f56)

Coinbase. Very touchy as they have a habit of freezing funds as long as a year for the pettiest reasons and no support solutions. I run a vpn server so it's my own dedicated ip through `vultr` however, using a hosting service as your ip can be a red flag. Yes, security minded organizations want you *not* to secure your traffic and use a static address under your ownership :clown: 

Solution here is cell phone data as hotspot. We have a few choices but need to verify the IPs are US as current location today is Baja, and default IP shows Mexico City. First we get the ip from my website. I have an API subdomain and use the simplest fastest method for grabbing ip or user agent:

```nginx
location /ip {
  default_type text/plain;
  return 200 "$remote_addr\n";
}
```

Next we need to use a service to check the location. I was using `ipinfo` however I noticed their free tier gives 10 lookups and starter pay plan is $49. That's a bit rich for low use. Enter a competing service I found: [ip2location.io](https://www.ip2location.io/?a=111587). I'm loving it so far. As I just wrote 4 versions of the script and tested on maybe 5 ip's that's way over what I was allotted before. Even better, while a lot of API services require a card, and have authority to charge until you manage to cancel, ip2location didn't ask for anything. More attractive pricing, is a breeze to use, and onboarding was great it took literally seconds to sign up with *no card verification or anything*. 

Should the need arise to have more capacity than offered I would feel good about putting a card on file with them. They even have referral codes and promos for any of my readers signing up with the above link so try them out!

Onto the script. We begin with a modified version of our Twilio script changing all Phone Number reference to IP instead, update the customer filter fields which are commented out until v0.2, and we have our concept version:
```bash
#!/bin/bash
# Query IP2LOCATION API
# Usage: ip2location.sh 154.54.23.256
# Author: Ray Kooyenga
# Version: 0.1
# Dependencies: jq, curl, IP2LOCATION key set in environment from ip2location.io

lookup_ip() {
  local ip="$1"

  if [[ -z "$ip" ]]; then
    echo "Error: Please provide a IP in the format 126.198.25.246"
    exit 1
  fi

  if [[ -z "$IP2LOCATION" ]]; then
    echo "Error: IP2LOCATION environment variables are not set."
    exit 1
  fi

  echo "Looking up: $ip"
  echo "----------------------------------------"


  response=$(curl -s -X GET "https://api.ip2location.io/?key=$IP2LOCATION\&ip=$ip"|jq)

  if [[ -z "$response" ]]; then
    echo "Error: No response received from IP2LOCATION API."
    exit 1
  fi

  echo "$response" | jq .

## if filtering comment out above line and uncomment below area to meet needs
## likewise for full unfiltered, commen block block and uncomment line above
#  echo ""
#  echo "IP Address Info:"
#  echo "----------------------------------------"
#  echo "ip   : $(echo "$response" | jq -r '.ip')"
#  echo "country code   : $(echo "$response" | jq -r '.country_code')"
#  echo "country : $(echo "$response" | jq -r '.country_name')"
#  echo "region   : $(echo "$response" | jq -r '.region_name')"
#  echo "zip code    : $(echo "$response" | jq -r '.zip_code')"
#  echo "ASN       : $(echo "$response" | jq -r '.asn')" 
#  echo "ISP       : $(echo "$response" | jq -r '.isp')"
#  echo "time         : $(echo "$response" | jq -r '.current_time')"
#  echo "gmt offset     : $(echo "$response" | jq -r '.gmt_offset')"
#  echo "time code       : $(echo "$response" | jq -r '.time_abbreviation')"
 
}

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <IP>"
  echo "Example: $0 123.45.67.890"
  exit 1
fi

lookup_ip "$1"
```

This one works ok, next we do our filtered jq version. Then we are messing with customized fields for the filter. Cool it works pretty good. The script is in `~/.local/bin` which allows me to run it without having to further clutter my home directory. 

What really is annoying me is the different scripts to choose filtered or not. There are times I might want both and even raw as well. So let's just mash them together, add a raw function, and specify our output as command line arguments.

Next, let's review those filtered field selections and add some color for the filtered jq view!
```bash
      colored_label "ip           : ";       echo "$(echo "$response" | jq -r '.ip')"
      colored_label "country code : ";       echo "$(echo "$response" | jq -r '.country_code')"
      colored_label "country      : ";       echo "$(echo "$response" | jq -r '.country_name')"
      colored_label "region       : ";       echo "$(echo "$response" | jq -r '.region_name')"
      colored_label "city         : ";       echo "$(echo "$response" | jq -r '.city_name')"
      colored_label "zip code     : ";       echo "$(echo "$response" | jq -r '.zip_code')"
      colored_label "ASN          : ";       echo "$(echo "$response" | jq -r '.asn')" 
      colored_label "ISP          : ";       echo "$(echo "$response" | jq -r '.isp')"
      colored_label "time         : ";       echo "$(echo "$response" | jq -r '.time_zone_info.current_time')"
      colored_label "gmt offset   : ";       echo "$(echo "$response" | jq -r '.time_zone_info.gmt_offset')"
      colored_label "time code    : ";       echo "$(echo "$response" | jq -r '.time_zone_info.abbreviation')"
      colored_label "usage type   : ";       echo "$(echo "$response" | jq -r '.usage_type')"
      colored_label "fraud score  : ";       echo "$(echo "$response" | jq -r '.fraud_score')"
```

Alright now let's make sure you can redirect or 'pipe' in an ip!
```bash
# Support piped input
if [[ -z "$IP" && ! -t 0 ]]; then
  read -r IP
fi
```

Finally we update some error checking, remind the user to have IP2LOCATION set in their environment with the respective API key.

And here is our new output:

```bash
#!/bin/bash
# IP2Location Lookup Script
# Usage: ip2location.sh [-m raw|jq|filter] [IP]
# Author: Ray Kooyenga
# Version: 0.4
# Dependencies: jq, curl
# IP2LOCATION API key must be in the IP2LOCATION env variable

# Color codes
RED="\e[1;31m"
YELLOW="\e[1;33m"
CYAN="\e[1;36m"
RESET="\e[0m"

print_usage() {
  echo -e "${YELLOW}Usage:${RESET} $0 [-m raw|jq|filter] [IP]"
  echo -e "${YELLOW}Example:${RESET} echo 8.8.8.8 | $0 -m filter"
  exit 1
}

colored_label() {
  echo -en "${CYAN}$1${RESET}"
}

lookup_ip() {
  local ip="$1"
  local mode="$2"

  if [[ -z "$ip" ]]; then
    echo -e "${RED}Error:${RESET} No IP address provided."
    print_usage
  fi

  if [[ -z "$IP2LOCATION" ]]; then
    echo -e "${RED}Error:${RESET} IP2LOCATION environment variable is not set."
    exit 1
  fi

  echo -e "${YELLOW}Looking up:${RESET} $ip ..."
  echo ""

  response=$(curl -s -L -X GET "https://api.ip2location.io/?key=$IP2LOCATION&ip=$ip")

  if [[ -z "$response" ]]; then
    echo -e "${RED}Error:${RESET} No response received from IP2Location API."
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
      echo -e "${YELLOW}IP Address Info:${RESET}"
      echo "----------------------------------------"
      colored_label "ip           : ";       echo "$(echo "$response" | jq -r '.ip')"
      colored_label "country code : ";       echo "$(echo "$response" | jq -r '.country_code')"
      colored_label "country      : ";       echo "$(echo "$response" | jq -r '.country_name')"
      colored_label "region       : ";       echo "$(echo "$response" | jq -r '.region_name')"
      colored_label "city         : ";       echo "$(echo "$response" | jq -r '.city_name')"
      colored_label "zip code     : ";       echo "$(echo "$response" | jq -r '.zip_code')"
      colored_label "ASN          : ";       echo "$(echo "$response" | jq -r '.asn')" 
      colored_label "ISP          : ";       echo "$(echo "$response" | jq -r '.isp')"
      colored_label "time         : ";       echo "$(echo "$response" | jq -r '.time_zone_info.current_time')"
      colored_label "gmt offset   : ";       echo "$(echo "$response" | jq -r '.time_zone_info.gmt_offset')"
      colored_label "time code    : ";       echo "$(echo "$response" | jq -r '.time_zone_info.abbreviation')"
      colored_label "usage type   : ";       echo "$(echo "$response" | jq -r '.usage_type')"
      colored_label "fraud score  : ";       echo "$(echo "$response" | jq -r '.fraud_score')"
      ;;
    *)
      echo -e "${RED}Error:${RESET} Unknown mode '$mode'"
      print_usage
      ;;
  esac
}

# Default mode
MODE="jq"
IP=""

# Parse options
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
      IP="$1"
      shift
      ;;
  esac
done

# Support piped input
if [[ -z "$IP" && ! -t 0 ]]; then
  read -r IP
fi

lookup_ip "$IP" "$MODE"
```

Sweet! Here's a screencast.
<iframe id="youtubePlayer_hFoHI4il4ss" width="640" height="360" src="https://www.youtube-nocookie.com/embed/MPDrRhfLr_w?controls=0&enablejsapi=1&origin=https%3A%2F%2Frkooyenga.github.io" frameborder="0" allowfullscreen=""> </iframe>
Ip2Location API script


Simultaneous to this we've also updated our [Twilio Lookup](https://gist.github.com/deadflowers/165d2bfe14b2f999a9d97124c51519b0) and saved as a new Gist and Readme and we'll do the same for this script: ![IP2Location IP Lookup](https://gist.github.com/deadflowers/75815b7792b48bcf70728f66d4758f8d)


And finally our instructions for the README. Pretty simple.

# 🌐 iplookup — IP2Location CLI Tool

Query IP address details using the [IP2Location API](https://www.ip2location.io/?a=111587).

![image](https://gist.github.com/user-attachments/assets/2bc38063-080f-42f9-9b47-b991c3bbbfb5)


## 🔧 Requirements

- `curl`
- `jq`
- Set your IP2Location API key:
  ```bash
  export IP2LOCATION=your_api_key
  ```

## 🛠 Setup

```bash
chmod +x iplookup.sh
mkdir -p ~/.local/bin
cp iplookup.sh ~/.local/bin/iplookup
```

Make sure `~/.local/bin` is in your `PATH`.

## 🧪 Usage

```bash
iplookup 8.8.8.8
echo 8.8.8.8 | iplookup -m filter

```

### 🔍 Output Modes

- `-m raw` → Raw JSON
- `-m jq` *(default)* → Pretty JSON via jq
- `-m filter` → Colorized summary
