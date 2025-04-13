---
title: '[Clean Code] 17장 냄새와 휴리스틱 - Java'
date: 2025-04-09
categories: [Reference]
tags: [Java, Formatting, Clean code, Collaboration]
---

### J1: 긴 import 목록을 피하고 와일드카드를 사용하라
- 긴 import 목록은 읽기 부담스럽다.
- 명시적인 import문를 사용하면 특정 클래스에 대한 결합도가 높아진다.

> 단, 이름이 같으면서 패키지가 서로 다른 클래스는 명시적인 import문을 사용하거나 코드에서 전체 경로를 명시한다.

### J2: 상수는 상속하지 않는다.
- 상수는 상위 인터페이스나 클래스에 숨겨두면 안 된다.
- 상수는 static import 방식으로 사용해야 한다.

### J3. 상수 대 Enum
- enum은 상수보다 많은 의미를 담을 수 있다.
- enum은 메서드와 필드를 사용할 수 있어 상수보다 훨씬 더 유연하고 서술적이다.
  
<div style="margin-top: 3rem"></div>

**Reference**   
로버트 C. 마틴. (2013). 17장. 냄새와 휴리스틱. Clean Code. 인사이트.
