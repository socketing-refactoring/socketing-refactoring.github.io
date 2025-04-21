---
title: '[Gradle] 플러그인 기초'
date: 2025-04-21
categories: [Reference]
tags: [Java, Gradle, Spring boot]
---


> **Gradle 8.13 공식문서** > Gradle 빌드 실행하기 > 기초 학습 > 8. 플러그인 기초  
[https://docs.gradle.org/current/userguide/plugin_basics.html](https://docs.gradle.org/current/userguide/plugin_basics.html)


## Gradle 플러그인 기초

Gradle은 플러그인 시스템 위에 만들어졌다. Gradle의 주요한 구성 요소는 정교한 의존성 결정 엔진 등의 infrastructure이고, 그 외 나머지 기능은 플러그인이 제공한다.  
플러그인은 Gradle의 빌드 시스템에 추가적인 기능을 제공하는 소프트웨어이다.

![gradle plugin](/assets/images/gradle-plugin.png)

Gradle 빌드 스크립트에 플러그인을 추가하면 새로운 태스크, 설정 또는 다른 빌드 관련 기능을 추가할 수 있다.

Java Library 플러그인 - `java-library`
- Java Libray들을 정의하고 빌드하기 위해 사용됨
- `compileJava` 태스크로 Java 소스 코드를 컴파일함
- `javadoc` 태스크로 `javadoc` 태스크를 생성함
- `jar` 태스크로 컴파일된 클래스들을 JAR 파일에 패키징함

Google Services Gradle 플러그인 - `com.google.gms:google-service`
- 안드로이드 앱에서 Google API와 Firebase 서비스를 사용할 수 있게 함
- `googleServices{}`라는 설정 블록과 `generateReleaseAssets`라는 태스크를 이용함

Gradle Bintray 플러그인 - `com.jfrog.bintray`
- Bintray에 artifact를 배포할 수 있게 함
- `bintray{}` 블록으로 플러그인을 설정해야 함

### 플러그인 배포판
플러그인은 다음 3가지 방법으로 배포된다.
1. Core plugins
- Gradle에서 Core Plugin을 개발하고 운영함
2. Community plugins
- Gradle의 커뮤니티가 Gradle Plugin Portal을 통해 플러그인을 공유함
3. Local plugins
- 사용자가 API를 이용하여 커스텀 플러그인을 생성함

### 플러그인 적용하기 Applying plugins
프로젝트에 플러그인을 적용하면 프로젝트의 기능을 확장할 수 있다.
plugin id (전역적으로 고유한 식별자)와 버전을 이용하여 빌드 스크립트에 플러그인을 추가할 수 있다.


**build.gradle 예시**

```Gradle
plugins {
    id «plugin id» version «plugin version»
}
```

### 1. Core plugins
Gradle Core plugin은 Gradle 배포판에 포함되어 있는 플러그인들이다.
이 플러그인들은 프로젝트를 빌드하고 관리하는 데 핵심적인 기능을 제공한다.

core plugin의 예는 다음과 같다.
- `java`: Java 프로젝트 빌드를 지원
- `groovy`: Groovy 소스 파일을 컴파일하고 테스트하는 것을 지원
- `ear`: 기업 애플리케이션을 위한 EAR 파일 빌드를 지원

core plugin은 빌드 스크립트에서 핵심 `JavaPlugin`에 대해 `java`를 사용하듯이 짧은 이름을 사용할 수 있다는 점에서 특별하다.
또한 이들은 버전을 명시하지 않아도 된다.

**build.gradle.kts 예시**

```Gradle
plugins {
    id("java")
}
```

사용자가 사용할 수 있는 다양한 Core plugin은 [여기](https://docs.gradle.org/current/userguide/plugin_reference.html#plugin_reference)에서 확인할 수 있다.  

### 2. Community Plugins
Community plugin은 Gradle community에 의해 개발된 플러그인이다.
이 플러그인은 특정 use case나 기술에 특화된 기능을 제공한다.  
Spring boot Gradle Plugin은 실행 가능한 Jar 또는 War 아카이브를 패키징하고 Spring boot Java 애플리케이션을 실행시킨다.  

프로젝트에 `org.springframework.boot` 플러그인을 추가하려면 다음과 같이 하면 된다.

**build.gradle.kts**

```Gradle
plugins {
    id("org.springframework.boot") version "3.1.5"
}
```

Community 플러그인은 Gradle Plugin Portal에 배포될 수 있다. 

### 3. Local Plugins
커스텀 또는 로컬 플러그인은 특정 프로젝트나 기관 내에서 개발되고 사용된다. 이 플러그들은 공개적으로 공유되지 않으며 
프로젝트나 조직의 특수한 요구에 맞게 커스텀된다.  
로컬 플러그인은 공통 빌드 로직을 캡슐화하고 내부 시스템 또는 도구와의 연동을 제공하고, 복잡한 기능을 재사용 가능한 컴포넌트에 추상화할 수 있다.  

Gradle은 사용자가 API를 이용하여 커스텀 플러그인을 개발하는 것을 가능하게 해준다.
당신만의 플러그인을 만들기 위하여 일반적으로 당신은 다음과 같은 단계를 따를 것이다.

1. 플러그인 클래스를 정의하기: `Plugin<Project>` 인터페이스를 구현하는 새로운 클래스를 생성한다.

```Gradle
class HelloPlugin : Plugin<Project> {
    override fun apply(project: Project) {
        // Define the 'hello' task
        val helloTask = project.tasks.register("hello") {
            doLast {
                println("Hello, Gradle!")
            }
        }
    }
}
```

2. 플러그인을 빌드하고 선택에 따라 플러그인을 배포하기: 당신의 플러그인 코드를 포함하는 JAR 파일을 생성하고 선택에 따라 이 JAR 파일을 다른 프로젝트에서 재사용될 수 있도록 로컬 또는 원격 리포지토리에 배포한다.

```Gradle
// Publish the plugin
plugins {
    `maven-publish`
}


publishing {
    publications {
        create<MavenPublication>("mavenJava") {
            from(components["java"])
        }
    }
    repositories {
        mavenLocal()
    }
}
```

3. 당신의 플러그인을 적용하기: 플러그인을 사용하고 싶다면 플러그인 ID와 버전을 빌드 파일의 `plugin{}` 블록에 포함시킨다.

```Gradle
// Apply the plugin
plugins {
    id("com.example.hello") version "1.0"
}
```

플러그인 개발과 관련하여 더 자세한 내용은 [다음 문서](https://docs.gradle.org/current/userguide/custom_plugins.html#custom_plugins)에서 
확인할 수 있다.
