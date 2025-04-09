---
layout: default
title: 📚 Categories
permalink: /categories/
---

<h1>{{ page.title }}</h1>

<ul>
  {% for category in site.categories %}
    <li>
      <a href="/categories/{{ category[0] | slugify }}/">{{ category[0] }}</a>
      ({{ category[1].size }} posts)
    </li>
  {% endfor %}
</ul>
