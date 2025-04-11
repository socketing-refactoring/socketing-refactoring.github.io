---
title: '코드 스타일 적용 자동화하기: Spotless, Checkstyle, editorconfig'
date: 2025-04-11
categories: [Code Formatting]
tags: [Gradle, Git, Collaboration, Java]
---

## 요약
Gradle의 플러그인 Spotless, Checkstyle, editorconfig와 pre-commit을 이용하여 코드 스타일 적용 자동화 환경을 구축했습니다.

## 도입 배경
VSCode나 Intellij와 같은 IDE들은 모두 자체적으로 코드 포맷팅 기능을 제공해주기 때문에 
개발을 처음 시작할 때는 코드 포맷팅 자동화 도구의 필요성에 대해 생각해보지 못했던 것 같습니다.

그러나 첫 팀 프로젝트에서 처음으로 협업을 경험해보면서 팀 차원에서 코드 포맷팅 규칙을 세우고 자동화하는 것이
중요하다는 것을 알게 됐습니다.
아무리 팀원들이 같은 IDE를 쓰고 있다고 하더라도 각자의 로컬 IDE에 설정되어 있는 포맷팅 규칙이 다르고, 코드를 커밋하기 전에 
코드 포맷팅을 강제하는 절차도 없다 보니 누구 한 명이 로컬에서 파일을 수정해서 원격에 push할 때마다 
들여쓰기, 괄호 앞뒤의 띄어쓰기 등이 계속해서 달라졌습니다.
결과적으로 커밋의 코드 변경 사항에서 실제로 의미 있는 변경만 확인하기가 어려웠습니다.  

두 번째 팀 프로젝트에서는 DevOps 역할을 맡은 팀원 분께서 prettier, editorconfig와 husky를 이용하여 
Javascript, Typescript 프로젝트에서의 코드 포맷팅 환경을 세팅해주셨습니다.
그 결과 모든 팀원들이 로컬 개발 환경에서도 일관되게 코드를 포맷팅할 수 있었고
커밋 시 코드에 prettier가 자동 적용되니 원격 리포지토리의 코드도 포맷팅된 상태로 유지할 수 있었습니다.

이렇게 코드 포맷팅 규칙 설정과 자동화의 중요성을 알게 되었기 때문에
이번 프로젝트에서는 코드 포맷팅 환경을 직접 세팅해보았습니다.
해당 포스트는 코드 포맷팅을 적용하는 방법을 자세히 소개하기보다는 
Javascript / Typescript 프로젝트 환경과 비교했을 때 Spring boot 프로젝트 환경에서의 코드 포맷팅 방법은
어떻게 다른지 그리고 해당 포맷팅 방법을 선택한 이유가 무엇인지를 중점적으로 정리해보려고 합니다.

## 1. Java 코드 스타일 설정 (Google Code Style 사용)

Javascript / Typescript 프로젝트에서는 `.prettierrc` 파일에 코드 스타일 규칙을 설정했었습니다.

**예시**

```json
{
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": false,
  "jsxSingleQuote": false,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "proseWrap": "preserve"
}
```

  
Java 프로젝트에서는 `.xml` 형식의 설정 파일을 통해 코드 스타일 규칙을 설정할 수 있습니다. `.xml` 설정 파일의 형태는 
IDE가 eclipse인지 intellij인지에 따라 차이가 있습니다.   
저는 [구글 코드 스타일](https://google.github.io/styleguide/javaguide.html)을 사용하되, indent size는 4로 조정한 코드 스타일을 사용하였습니다.

<details>
  <summary>Google과 네이버 핵데이 행사의 Java 코드 스타일 설정 파일</summary>
  <h4>Google Code Style 설정 파일</h4>
  <ul>
    <li>Eclipse version</li>
    <ul>
      <li>
        <a href="https://github.com/google/styleguide/blob/gh-pages/eclipse-java-google-style.xml" target="_blank">
          https://github.com/google/styleguide/blob/gh-pages/eclipse-java-google-style.xml
        </a>
      </li>
    </ul>
    <li>Intellij version</li>
    <ul>
      <li>
        <a href="https://github.com/google/styleguide/blob/gh-pages/intellij-java-google-style.xml" target="_blank">
          https://github.com/google/styleguide/blob/gh-pages/intellij-java-google-style.xml
        </a>
      </li>
    </ul>
  </ul>

  <h4>네이버 핵데이 행사의 Code Style 설정 파일</h4>
  <ul>
    <li>Eclipse version</li>
    <ul>
      <li>
        <a href="https://github.com/naver/hackday-conventions-java/blob/master/rule-config/naver-eclipse-formatter.xml" target="_blank">
          https://github.com/naver/hackday-conventions-java/blob/master/rule-config/naver-eclipse-formatter.xml
        </a>
      </li>
    </ul>
    <li>Intellij version</li>
    <ul>
      <li>
        <a href="https://github.com/naver/hackday-conventions-java/blob/master/rule-config/naver-intellij-formatter.xml" target="_blank">
          https://github.com/naver/hackday-conventions-java/blob/master/rule-config/naver-intellij-formatter.xml
        </a>
      </li>
    </ul>
  </ul>
</details>

## 2. Java 코드 스타일 적용 (Spotless 사용)

Javascript / Typescript 프로젝트에서는 IDE의 자동 포맷팅 기능을 사용할 수도 있지만
prettier를 이용하면 IDE의 도움 없이 `npx prettier --write .` 명령어로도 `.prettierrc` 파일에서 설정한 코드 스타일을 적용할 수 있습니다.

Java 프로젝트에서는 IDE의 자동 포맷팅 기능을 사용하여 원하는 코드 스타일을 적용하거나,
명령어를 통해 코드 스타일 적용을 하고 싶다면 gradle의 Spotless라는 플러그인을 사용할 수 있습니다. 
저는 IDE에 의존적이지 않은 방식으로 코드 스타일을 적용하고 싶었기 때문에 다음과 같이 `build.gradle.kts`에 Spotless 플러그인을 추가해주었습니다.  

```gradle
// build.gradle.kts

plugins {
    id("com.diffplug.spotless") version "7.0.2"
    // 생략
}

spotless {
    java {
        removeUnusedImports()
        importOrder()
        googleJavaFormat().aosp() // Apply Android Open Source Project style to adjust indentation into 4 spaces
    }
}

// 생략
```

이렇게 하면 `spotlessCheck`와 `spotlessApply` 태스크가 제공됩니다. `./gradlew spotlessApply` 명령어를 수행하면
소스 코드를 지정된 코드 스타일에 맞게 일괄 수정할 수 있습니다.

저는 기본적으로 구글 코드 스타일을 적용하되, aosp 스타일도 적용하여 indent size를 4로 조정하였습니다. 사용되지 않는 패키지의 import는 제거하고 import 순서는 따로 설정하지 않고 기본을 따르도록 하였습니다.

Spotless의 Gradle plugin 항목 문서에는 커스텀 `.xml` 설정 파일을 적용할 수 있는 방법이나
멤버 변수를 정렬하는 방법과 같이 포맷팅 규칙을 디테일하게 조정할 수 있는 방법이 소개되어 있습니다.
포맷팅 규칙을 커스텀하고 싶다면 문서를 참고하면 좋을 것 같습니다.

> Spotless 공식 문서 [https://github.com/diffplug/spotless/tree/main/plugin-gradle#java](https://github.com/diffplug/spotless/tree/main/plugin-gradle#java)

## 3. Java 코드 스타일 적용 자동화 (Spotless와 pre-commit 사용용)

Javascript / Typescript 프로젝트에서는 IDE의 도움 없이 prettier 명령어로도 코드 스타일 자동 적용이 가능하기 때문에
pre-commit hook 스크립트를 통해 커밋 단계에서 코드 스타일 적용을 강제/자동화할 수 있었습니다.

Java 프로젝트에서는 코드 스타일의 적용을 '강제'하려면
코드가 스타일을 준수하고 있는지 검사하는 도구인 Checkstyle을 사용할 수 있습니다.
다만 Checkstyle은 코드 스타일 준수 여부를 검사하여 코드 스타일의 적용을 '강제'할 수 있을 뿐 코드 스타일을 자동 적용해주지는 않습니다.
 
저는 코드 스타일 적용을 '강제'하는 것과 더불어 코드 스타일 적용을 커밋 단계에서 '자동화'하고 싶었습니다.
그래서 위 설정대로 gradle spotless plugin을 적용하여 `spotlessApply` 태스크를 만들고
pre-commit 설정 파일에 `./gradlew spotlessApply` 명령어를 실행하는 훅을 추가하였습니다.
> pre-commit을 실행하려면 파이썬이 설치되어 있어야 합니다.

제가 작성한 pre-commit 설정 파일은 다음과 같습니다.
```yml
# pre-commit-config.yaml

repos:
  - repo: local
    hooks:
      - id: formatting-apply
        name: Apply spotless formatting
        entry: bash -c ./gradlew spotlessApply # Bash terminal is required for Window environment
        language: system
        pass_filenames: false # Required to prevent passing wrong arguments
```

이로써 협업 환경에서 일관된 Java 코드 스타일을 적용할 수 있는 환경을 마련하였습니다.

## 4. 추가적인 Java 코드 스타일 검사 (Checkstyle)

`spotlessJavaApply` 태스크는 Java 코드를 스타일 가이드에 맞게 잘 수정해주지만
디테일한 규칙은 수정해주지 못하는 것으로 확인됐습니다.  

### Checkstyle 검사 결과 예시
예를 들어 소스 코드에 `spotlessApply` 태스크를 실행한 후에 `checkStyleMain` 태스크를 실행하면
다음과 같이 'import 문에서 "*"를 허용하지 않는다', '변수명은 카멜 케이스로 작성한다' 등의 규칙과 관련한 경고가 나타납니다.

```bash
[ant:checkstyle] [WARN] (경로 생략): Using the '.*' form of import should be avoided - com.jeein.member.dto.response.*. [AvoidStarImport]
[ant:checkstyle] [WARN] (경로 생략): Abbreviation in name 'loginRequestDTO' must contain no more than '1' consecutive capital letters. [AbbreviationAsWordInName]
[ant:checkstyle] [WARN] (경로 생략): Method name 'CreateInvalidMapWithField' must match pattern '^[a-z][a-z0-9][a-zA-Z0-9]*$'. [MethodName]
[ant:checkstyle] [WARN] (경로 생략): Using the '.*' form of import should be avoided - com.jeein.member.docs.DocumentIdentifier.*. [AvoidStarImport]
```

`spotlessApply` 태스크를 실행한 후에도 남아 있는 코드 스타일 위반 내용까지 완전하게 검사하기 위해
`build.gradle.kts`에 CheckStyle을 추가해주었습니다.

### Checkstyle 플러그인 추가

다음과 같이 Checkstyle 플러그인을 추가하면 `checkStyleMain`과 `checkStyleTest` 태스크가 생깁니다. 

```gradle
// build.gradle.kts

plugins {
    id("checkstyle")
    // 생략
}

checkstyle {
    toolVersion = "10.23.0"
}
```

이제 설정 파일을 등록하면 `./gradlew checkStyleMain` 명령어를 사용하여 `spotlessCheck`가 잡아내지 못하는 오류들까지도 잡아낼 수 있습니다.

### Checkstyle 설정 파일 추가

[Gradle 공식 문서](https://docs.gradle.org/current/userguide/checkstyle_plugin.html)에 따르면 
Checkstyle 플러그인이 사용하는 `.xml` 설정 파일의 기본 경로 및 파일 이름은 다음과 같습니다. 이 위치에 설정 파일을 두면
`build.gradle.kts`에서 경로를 별도로 지정해주지 않아도 됩니다.  

```bash
<root>
└── config
    └── checkstyle           
        └── checkstyle.xml   // configuration for checking rule
        └── suppressions.xml // configuration for suppressing checking rule
```

`suppressions.xml` 파일은 특정 규칙을 무효화하고 싶을 때 사용하는 파일입니다.
`suppression.xml`의 위치는 `checkstyle.xml` 파일의 `SuppressionFilter` module의 `file` 속성에 명시합니다.
기본 경로를 이용할 경우  Gradle이 제공하는 `config_loc` 속성을 이용하여 `${config_loc}/suppressions.xml`을 해당 속성 값으로 설정하면 파일의 위치가 잘 인식됩니다.


- config/check/checkstyle.xml

```xml
<!-- SuppressionFilter module in file -->

<!-- AS-IS -->
<!-- https://checkstyle.org/filters/suppressionfilter.html -->
<module name="SuppressionFilter"> 
  <property name="file" value="${org.checkstyle.google.suppressionfilter.config}" 
            default="checkstyle-suppressions.xml" /> 
  <property name="optional" value="true"/> 
</module>

<!-- TO-BE -->
<!-- Using Gradle checkstyle plugin -->
<module name="SuppressionFilter">
  <property name="file" value="${config_loc}/suppressions.xml" />
  <property name="optional" value="true" />
</module>
```

`checkstyle.xml` 파일은 checkstyle 리포지토리에서 제공하는 [google_checks.xml](https://github.com/checkstyle/checkstyle/blob/master/src/main/resources/google_checks.xml)을
파일명을 바꾸어서 사용했습니다. 
저의 경우 소스 코드에 CheckStyle을 수행해보니 Javadoc을 작성하지 않아서 다음과 같은 경고가 많이 떴습니다.

```bash
[ant:checkstyle] [WARN] (경로 생략): Missing a Javadoc comment. [MissingJavadocType]
[ant:checkstyle] [WARN] (경로 생략): Missing a Javadoc comment. [MissingJavadocMethod]
```

지금으로서는 Javadoc을 작성할 계획이 없기 때문에 `suppressions.xml`에 다음과 같이 설정하여
`MissingJavadocType`과 `MissingJavadocMethod` 체크를 무효화해주었습니다.

- config/check/suppressions.xml

```xml
<?xml version="1.0"?>
<!DOCTYPE suppressions PUBLIC
        "-//Checkstyle//DTD Suppressions 1.2//EN"
        "https://checkstyle.org/dtds/suppressions_1_2.dtd">

<suppressions>
	<suppress checks="MissingJavadocType" files=".*" />
	<suppress checks="MissingJavadocMethod" files=".*" />
</suppressions>

```

네이버 핵데이 행사에서 사용된 [Checkstyle 설정 파일](https://github.com/naver/hackday-conventions-java/blob/master/rule-config/naver-checkstyle-rules.xml)과
[Checkstyle 가이드](https://naver.github.io/hackday-conventions-java/#checkstyle)도 
공개되어 있으니 설정 내용을 참고해봐도 좋을 것 같습니다.

위와 같이 설정만 해주면 별도로 의존성을 추가해주지 않아도 기본적으로
`com.puppycrawl.tools:checkstyle` 의존성이 사용됩니다.  
의존성을 직접 추가하게 될 경우 기본 의존성은 제거되니 주의가 필요합니다.

### Check 규칙 커스텀
저는 프로젝트 상황에 맞게 다음과 같이 Check 규칙을 커스텀했습니다.
Check 규칙을 커스텀할 때 주의해야 할 점은 `checkstyle.xml`의 property에 유효하지 않은 속성을 넣으면 `checkStyleMain` 태스크가 실패한다는 것입니다.  
CheckStyle 공식 문서를 참고하여 유효한 속성명을 사용하여야 합니다.
> CheckStyle 공식 문서 [https://checkstyle.org/checks.html](https://checkstyle.org/checks.html)

**수정 내용**
1. Google Java code style에서 indent size를 2에서 4로 변경했으므로 Checkstyle 규칙도 일관되게 수정
2. import문의 "*" 와일드카드의 경우 상수 필드를 가진 클래스와 lombok, persistence 등 클래스의 메서드가 자주 사용되는 패키지에 한해 허용
3. 식별자에 사용되는 대문자 약어로 "URI", "DTO", "API" 허용

- config/checkstyle/checkstyle.xml

```xml
<!-- Some modules in file -->

<module name="Indentation">
  <property name="basicOffset" value="4" />
  <property name="braceAdjustment" value="0" />
  <property name="caseIndent" value="4" />
  <property name="throwsIndent" value="4" />
  <property name="lineWrappingIndentation" value="4" />
  <property name="arrayInitIndent" value="4" />
</module>

<module name="AvoidStarImport">
  <property name="excludes"
    value="lombok.*, jakarta.persistence.*, org.springframework.web.bind.annotation.*" />
  <property name="allowStaticMemberImports" value="true" />
</module>

<module name="AbbreviationAsWordInName">
  <property name="ignoreFinal" value="false" />
  <property name="allowedAbbreviationLength" value="0" />
  <property name="allowedAbbreviations" value="URI, DTO, API" />
  <property name="tokens"
    value="CLASS_DEF, INTERFACE_DEF, ENUM_DEF, ANNOTATION_DEF, ANNOTATION_FIELD_DEF,
                PARAMETER_DEF, VARIABLE_DEF, METHOD_DEF, PATTERN_VARIABLE_DEF, RECORD_DEF,
                RECORD_COMPONENT_DEF" />
</module>
```

## 5. 기타 언어 및 파일 포맷팅 자동화

프로젝트 메인 언어인 Java의 포맷팅 자동화 환경 세팅은 모두 마쳤습니다.  
그런데 프로젝트에는 Java뿐만 아니라 `.kts`, `.yml`, `.xml` 등의 파일도 존재합니다.

Javascript / Typescript 프로젝트의 경우 JS, TS 포맷팅을 위해 prettier가 이미 사용되므로 다른 언어나 파일에도 prettier를 적용하면 됩니다.
그리고 prettier가 editorconfig도 자동 반영해주기 때문에 파일 기반 규칙인 기본 indent size, 인코딩 방식, 줄바꿈 형식 등도 쉽게 포맷팅할 수 있었습니다.

Java 프로젝트에서 다른 언어 및 파일을 포맷팅하는 가장 간단한 방법은 IDE의 포맷팅 기능을 이용하는 것입니다. 그렇지만 협업 환경을 위하여 Spotless에서 지원하는 Kotlin, XML, YML 포맷팅 기능을 이용하였습니다.
> Spotless 공식 문서
> [Kotlin](https://github.com/diffplug/spotless/tree/main/plugin-gradle#kotlin) |
> [XML](https://github.com/diffplug/spotless/tree/main/plugin-gradle#yaml) |
> [YAML](https://github.com/diffplug/spotless/tree/main/plugin-gradle#yaml)

제가 사용한 Spotless 설정은 다음과 같습니다.

```gradle
// build.gradle.kts

//생략
dependencies {
    implementation("com.diffplug.spotless:spotless-lib-extra:3.1.1") // For use of enum EclipseWtpFormatterStep
    // 생략
}

spotless {
    java {
        removeUnusedImports()
        importOrder()
        googleJavaFormat().aosp()
    }

    kotlinGradle {
        target("**/*.gradle.kts", "*.gradle.kts")

        ktlint()
        trimTrailingWhitespace()
        endWithNewline()
    }

    yaml {
        target("**/*.yml", "**/*.yaml")
        jackson()
            .yamlFeature("MINIMIZE_QUOTES", true)                     // minimize the use of quotes
            .yamlFeature("ALWAYS_QUOTE_NUMBERS_AS_STRINGS", false)    // prevent number being quoted
            .yamlFeature("WRITE_DOC_START_MARKER", false)             // not adding "---" on the top of the file
            .yamlFeature("INDENT_ARRAYS_WITH_INDICATOR", true)        // add indent in front of array elements
    }

    format("xml") {
        target("**/*.xml")

        eclipseWtp(EclipseWtpFormatterStep.XML)
    }
}
```

사실 처음에는 Spotelss에서 prettier도 지원해줘서 `.prettierrc`와 `.prettierignore` 파일을 추가하여
이를 기반으로 포맷팅을 했었습니다.

> 참고 레퍼런스
> Spotless 공식 문서 [Prettier](https://github.com/diffplug/spotless/tree/main/plugin-gradle#prettier)
> [https://github.com/google/security-annotation-tools/blob/main/spotless.gradle.kts](https://github.com/google/security-annotation-tools/blob/main/spotless.gradle.kts)  

그런데 prettier를 사용하니 build 디렉토리에 생성된 node_module 디렉토리가 삭제되지 않는 버그가 발생하기도 하고  
`.prettierrc`에서 파일 확장자별로 override한 설정이 포맷팅에 잘 반영되지 않아서 `build.gradle.kts` 파일에 직접 설정을 작성해야 하는 등
불편한 점이 생겼습니다.
이에 Javascript가 없는 환경에 굳이 prettier까지 적용할 필요는 없을 것 같다는 판단을 하였고 prettier를 사용하는 대신
위와 같이 Spotless에서 지원해주는 포맷팅 기능을 이용하기로 결정하였습니다.

이제 남은 문제는 파일 기반 규칙인 줄바꿈 방식, 인코딩 방식 등을 관리하는 문제 그리고 Spotless에서 직접 포맷팅 규칙을 설정하지 않은 파일들의 포맷팅을 관리하는 문제입니다.
이 문제는 `.editorconfig`와 gradle의 editorconfig 플러그인을 사용하여 커밋 또는 빌드 전에 `.editorconfig` 규칙 준수 여부를 검사하는 방식으로 해결하였습니다.

> 참고 레퍼런스 [네이버 핵데이 Gradle editorconfig 플러그인 설정 방법](https://naver.github.io/hackday-conventions-java/#_gradle)

## 최종 리뷰

Javascript 생태계의 prettier를 경험한 후에 Java 프로젝트에서도 prettier의 스타일 자동 적용, 자동화 기능을 그대로 사용하고자 Spotless라는 플러그인을 적극 사용해보았습니다.  

포맷팅 자동화 환경을 세팅하면서 느꼈던 어려운 점은 다음과 같습니다.
1. 하나의 프로젝트에 Java 언어만 있었다면 프로젝트에 포맷팅 환경을 세팅하는 것이 조금 더 간단했겠지만 프로젝트에는 다양한 파일 확장자를 가진 파일들이 있기 때문에
이들 또한 포맷팅할 수 있는 방법을 수립하는 것이 까다로웠습니다.
특히 `.editorconfig`와 `.prettierrc`를 같이 사용할 때는 각각의 설정과 Java Code Style이 충돌나지 않게 관리해야 해서 설정 복잡도가 너무 높았던 것 같습니다. 
포맷팅 설정 파일은 최대한 언어별로 관리하고 파일 기반의 줄바꿈 방식 정도만 공통 설정 파일에서 관리하는 것이 설정 관리에 유리할 것 같습니다.
그리고 로컬 개발 환경과 협업 환경에서의 설정 규칙을 통일되게 관리할 수 있는 방법을 찾는 것도 중요한 것 같습니다.
3. 포맷팅 설정 방법을 바꿀 때마다 모든 파일 확장자가 제대로 작동하는지 테스트해야 해서 생각보다 포맷팅 환경을 세팅하는 시간이 길어졌습니다.
실제 현업 상황이라면 프로젝트 세팅이 나중에 바뀌지 않도록 초기에 완벽하게 해둬야 코드 이력 관리 면에서 진정한 의미가 있다는 생각에 꼼꼼하게 테스트해보게 된 것 같습니다.
4. Gradle을 Groovy가 아닌 Kotlin 기반으로 사용하다보니 Groovy 기반의 레퍼런스를 볼 때 이를 Kotlin 방식으로 수정하는 데에도 시간이 꽤 걸렸던 것 같습니다.
   그래도 Gradle 공식 문서에서도 Kotlin 스타일을 추천하고 있는 만큼 이번 기회에 `build.gradle.kts`의 사용 방법을 익힐 수 있어 의미 있는 시간이었던 것 같습니다.

포맷팅 환경 구축은 코드의 유지보수성을 높이고 협업 환경에서의 생산성을 높이는 데 있어 중요한 과정이라고 생각합니다. 
직접 포맷팅 환경 구축을 해보며 Google의 코드 스타일을 기반으로 좋은 코드 스타일이 무엇인지 생각도 해보고, 협업 환경을 위한 pre-commit 자동화 능력을 키울 수 있었습니다.  

시간이 난다면 Javascript 생태계의 ESLint처럼 Java에서 사용할 수 있는 정적 분석 도구 또한 적용하여 코드 안정성을 높여보고 싶습니다.
