---
title: Gists
layout: collection
permalink: /gists/
collection: gists
entries_layout: grid
---

Sample document listing for the collection `_gists`.
---
title: Video
layout: collection
permalink: /videos/
collection:/videos/
taxonomy: video
---


{%- for post in site.tags["video"] -%}
  {% include entry.html %}
{%- endfor -%}
