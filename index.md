---
layout: default
title: home
---

<h2>Spring Rest Docs API 문서</h2>
<ul>
  <li>
    <a href="/docs/member-service/">Member Service</a>
  </li>
</ul>

<h2>
<ul>
  {% for category in site.categories %}
    <li>
      <a href="/categories/{{ category[0] | slugify }}/">{{ category[0] }}</a>
      ({{ category[1].size }} posts)
    </li>
  {% endfor %}
</ul>
</h2>

