---
layout: default
title: 🏷 Tags
permalink: /tags/
---

<h1>{{ page.title }}</h1>

<ul>
  {% for tag in site.tags %}
    <li>
      <a href="/tags/{{ tag[0] | slugify }}/">{{ tag[0] }}</a>
      ({{ tag[1].size }} posts)
    </li>
  {% endfor %}
</ul>
