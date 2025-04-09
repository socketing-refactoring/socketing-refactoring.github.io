---
layout: default
title: home
---

<h1>📚 최근 포스트</h1>

<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      <small> - {{ post.date | date: "%Y-%m-%d" }}</small>
    </li>
  {% endfor %}
</ul>
