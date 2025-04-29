---
layout: default
title: home
---


<h2>Spring Rest Docs API 문서</h2>
<ul>
  <li>
    <a href="/docs/member-service/">Member Service</a>
  </li>
  <li>
    <a href="/docs/event-service/index.html">Event Service</a>
  </li>
</ul>

<h2>최근 포스트</h2>

<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      <small> - {{ post.date | date: "%Y-%m-%d" }}</small>
    </li>
  {% endfor %}
</ul>
