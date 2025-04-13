---
title: '통합 테스트를 이용하여 API 문서화 자동화하기: Swagger, Spring Rest Docs'
date: 2025-04-13
categories: [Review]
tags: [Java, Gradle, Collaboration, Git, Test, MSA]
---

## 도입 배경

API 문서화 작업은 많은 개발자가 협업하게 되는 환경에서 필수적인 작업인 것 같습니다.
처음 개발을 배울 때는 API 설계를 할 때 엑셀 또는 노션을 이용하여 API 문서 작업을 하는 것이 전부였습니다.
그러다가 Postman이나 Swagger Open Api를 이용하여 API 문서을 생성함과 동시에 API 테스트 환경도 만들 수 있다는 것을 알게 되었습니다.  

Swagger는 팀 프로젝트에서 Next.js 백엔드 API를 개발할 때 사용해본 경험이 있습니다. 그런데 Nest.js에서 작업할 때부터 느꼈던 두 가지 단점이 계속 마음에 걸렸습니다.  

1. Swagger 문서에 Descrption, Example 등을 추가하기 위해 소스 코드에 긴 분량의 애노테이션을 사용해야 한다는 점
2. Api 요청 및 응답 값이 변경되면 수작업으로 문서를 수정해야 해서 수고롭고 휴먼 폴트의 가능성이 있다는 점

Spring Rest Docs를 이용하면 통합 테스트를 통해 실제 API를 100%로 반영한 API 문서를 자동 생성할 수 있고
이 문서를 Swagger 문서 스펙으로 변환하는 것도 가능하다는 것을 알게 됐습니다.  
그래서 이번 프로젝트에서는 Spring boot에 문서화 환경을 이 방법으로 직접 세팅해보았습니다.
   
## 1. Swagger 문서화

### Gradle 설정
다음과 같이 의존성을 추가해주고 Spring boot를 실행한 뒤 `/swagger-ui/index.html`에 접속하면  
Controller 소스 코드에 작성한 API들을 바탕으로 자동 생성된 Swagger Api 문서를 확인할 수 있습니다.

- Gradle 의존성 추가

```gradle
// build.gradle.kts

dependencies {
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.5")
    // 생략
}

// 생략
```

### Swagger 문서 설정 
   
저는 프로젝트 상황에 맞게 `appication.yml`에서 몇 가지 설정을 커스텀해주었습니다.  
API 문서의 URI, API의 정렬 순서 등을 설정할 수 있습니다. 어떤 설정 속성들이 있는지는 다음 공식 문서에서 확인할 수 있습니다.
> Spring Doc 공식 문서 [https://springdoc.org/#properties](https://springdoc.org/#properties)

```yaml
# application.yml

# 생략

springdoc:
  default-consumes-media-type: "application/json"
  default-produces-media-type: "application/json"
  show-actuator: false                  # don't include auto generated actuator api
  api-docs:
    path: "/api/v1/members/api/json"   
  swagger-ui:
    path: "/api/v1/members/api/docs"    # default path: /swagger-ui/index.html
    operations-sorter: "alpha"          # Sort by paths alphanumerically
    disable-swagger-default-url: true
    display-request-duration: true
```

### 마이크로 서비스를 위한 설정
  
Java 코드로도 Swagger 설정을 커스텀할 수 있습니다.  
저는 마이크로 서비스 환경에 맞게 Swagger에서 보내는 요청이 마이크로 서비스 서버로 바로 가지 않고
Nginx와 Spring Gateway Server가 있는 서버를 통해 마이크로 서비스로 라우팅될 수 있도록 대상 서버를 다음과 같이 바꾸어주었습니다.  

```java
package com.jeein.member.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        Server server = new Server();
        server.setUrl("https://api.socketing.jeein.xyz");
        return new OpenAPI().servers(List.of(server));
    
}

```

이렇게 하면 다음과 같이 Api 요청을 보낼 서버가 변경됩니다. 
서버를 리스트로 추가할 수도 있어서 로컬용, 개발용, 운영용 서버 등 여러 서버를 등록할 수도 있습니다.  

![swagger-server](/assets/images/swagger-server.png)

그리고 Spring Gateway Server에는 마이크로 서비스들의 Swagger 문서를 불러오기 위해 다음과 같이 설정해주었습니다. 
마이크로 서비스들의 Swagger 문서는 api-docs.path에 등록한 경로 (또는 default인 /v3/api-docs)에 위치해 있으니 그 경로를 이용하면 됩니다.  
저는 마이크로 서비스의 Swagger 문서를 요청할 때도 Spring Gateway Server의 라우팅을 통할 수 있도록 Spring Gateway Server의 url을 이용하였습니다.  

```yaml
# application.yml

springdoc:
  swagger-ui:
    path: /api/docs
    urls[0]:
      name: auth-service
      url: https://api.socketing.jeein.xyz/api/v1/auth/api/json
    urls[1]:
      name: member-service
      url: https://api.socketing.jeein.xyz/api/v1/members/api/json
    urls[2]:
      name: event-service
      url: https://api.socketing.jeein.xyz/api/v1/events/api/json
    urls[3]:
      name: order-service
      url: https://api.socketing.jeein.xyz/api/v1/orders/api/json
```

이렇게 하면 다음과 같이 Spring Gateway Server의 Swagger ui에서 마이크로 서비스들의 Swagger 문서를 한곳에 모아 볼 수 있습니다.  

![swagger-source](/assets/images/swagger-source.png)

### 애노테이션 추가 방식과 문서 작성 방식

Swagger가 자동으로 문서를 생성해주기는 하지만 description이나 example 그리고 예외 응답들을 관리하려면 추가적인 작업이 필요합니다.
소스 코드에 애노테이션을 추가하거나
자동 생성 문서를 사용하는 대신 문서를 직접 생성할 수 있습니다.  
애노테이션을 쓰게 될 경우 소스 코드를 건들여야 돼서 거부감이 있을 수 있습니다. 
이에 API 문서 코드를 분리하기 위해 인터페이스에 문서화 작업을 진행하는 방법 등이 우회 방식으로 사용되는 것으로 보였습니다.
이는 Spring doc demo 리포지토리에서 예시를 확인할 수 있습니다.  

> Swagger doc demo repository [https://github.com/springdoc/springdoc-openapi-demos/tree/master/demo-spring-boot-3-webmvc/src/main/java/org/springdoc/demo/app2/api](https://github.com/springdoc/springdoc-openapi-demos/tree/master/demo-spring-boot-3-webmvc/src/main/java/org/springdoc/demo/app2/api)

저는 애노테이션 방식은 Next.js 프로젝트에서 사용해보았기 때문에 이번에는 `yml`에 문서를 직접 작성하는 방식을 실험해봤습니다.  

'yml' 작성 방법은 Swagger에서 제공해주는 에디터를 참고하면 좋습니다.
> Swagger Editor [https://editor.swagger.io/](https://editor.swagger.io/)

직접 작성한 파일은 `src/main/resources/static`에 위치시키고 `application.yml`에 다음 설정을 추가해주면 직접 작성한 문서를 ui로 확인할 수 있습니다.

```yaml
# application.yml

springdoc:
  swagger-ui:
    url: /{file name}.yml    # also can use json
``` 

## 2. Spring Rest Docs 문서화

이번에는 Spring Rest Docs로 문서를 생성하는 방법입니다.
Swagger 문서는 장점이 정말 많지만 자세한 설명을 추가하려고 하면 main 코드를 건들여야 되거나 문서를 직접 작성해야 한다는 점이 단점으로 다가옵니다.  
Spring Rest Docs의 경우 test 코드를 작성하고 나서 테스트에 성공하고 나면 자동으로 Http 요청과 응답 snippet을 생성할 수 있습니다.
그리고 Gradle에서 asciidocTask를 이용하면 adoc 포맷의 문서를 html로 변환할 수도 있습니다. 

테스트와 문서 작업을 통합하는 이 방식은 문서의 신뢰성도 확보하고 api가 변경될 때마다 이를 문서에 자동 반영할 수 있으며 main 소스 코드에 문서화 코드를 개입시키지 않을 수도 있어서  장점이 많은 방식입니다.  

### Gradle 설정

Spring Rest Docs를 사용하기 위한 Gradle 설정은 다음 공식 문서를 참고하였습니다.
> Spring Rest Docs 공식 문서 [https://docs.spring.io/spring-restdocs/docs/current/reference/htmlsingle/](https://docs.spring.io/spring-restdocs/docs/current/reference/htmlsingle/)

제가 작성한 Gradle 설정 파일은 다음과 같습니다. 스니펫 생성 경로와 html 문서 생성 경로를 명시적으로 지정해주었습니다.

```gradle
// build.gradle.kts

import org.asciidoctor.gradle.jvm.AsciidoctorTask

plugins {
    id("org.asciidoctor.jvm.convert") version "4.0.4"
    // 생략
}

configurations {
    create("asciidoctorExt")
}

dependencies {
    testImplementation("org.springframework.restdocs:spring-restdocs-mockmvc"))
    add("asciidoctorExt", "org.springframework.restdocs:spring-restdocs-asciidoctor")

    // 생략 (Junit 의존성 등 필요)
}

val snippetsDir by extra { file("build/generated-snippets") }

// 테스트를 실행하면 snippetsDir에 스니펫 생성
tasks.test {
    useJUnitPlatform()
    outputs.dir(snippetsDir)
}

// snippetDir에 있는 snippet과 adoc 문서를 바탕으로 outputDir에 html 문서 생성
val asciidoctorTask =
    tasks.named<AsciidoctorTask>("asciidoctor").apply {
        configure {

            inputs.dir(snippetsDir)
            configurations("asciidoctorExt")
            dependsOn(tasks.test)

            sources(
                delegateClosureOf<PatternSet> {
                    include("index.adoc")
                },
            )
            baseDirFollowsSourceFile() // required to include adoc into index.adoc

            setOutputDir(layout.buildDirectory.dir("docs/asciidoc/member-service"))
        }
    }

// html 문서를 jar의 정적 소스 경로에 추가
tasks.named<BootJar>("bootJar") { // need to import BootJar class
    archiveFileName.set("member-service.jar")
    dependsOn(asciidoctorTask)

    from(asciidoctorTask.map { it.outputDir }) {
        into("static/docs")
    }
}
```

### adoc 문서 작성

이 설정대로 문서를 생성하려면 `src/docs/asciidoc` 위치에 문서의 형태가 될 `index.adoc`을 작성해두어야 합니다.
저는 `index.adoc`가 너무 길어지는 것을 방지하기 위해 `index.adoc`에서 개별 `.adoc` 파일들을 include하는 방식을 선택했습니다. AsciidoctorTask가 include된 adoc을 정상적으로 처리할 수 있게 하려면 위 설정처럼 `baseDirFollowsSourceFile()`를 꼭 추가해주어야 합니다.  
`adoc`의 메타데이터로 toc(Table Of Content) 설정을 추가해주면 문서의 목차가 생겨서 편리합니다. 이외 adoc 문법은 공식 문서를 참고할 수 있습니다.  
> Asciidoc 공식 문서 [https://docs.asciidoctor.org/](https://docs.asciidoctor.org/)

```adoc
// src/docs/asciidoc/index.adoc

= API 문서
:doctype: book
:icons: font
:source-highlighter: highlightjs
:toc: left
:toclevels: 4
:sectlinks:

== 회원가입

=== HTTP 요청

회원가입 요청에 대한 설명입니다.

include::join-request.adoc[]

=== HTTP 성공 응답

회원가입 성공 시 반환되는 응답입니다.

include::join-response.adoc[]

// 생략
```

Request Header 같은 경우 테스트 클래스 파일에서 특별히 문서화 코드가 없으면 스니펫이 생성되지 않습니다. 이를 대비하여 스니펫을 include할 때 `[opts=optional]` 옵션을 추가해주면 스니펫이 없는 경우 자동으로 문서에서 제외할 수 있습니다.

```adoc
// src/docs/asciidoc/join-request.adoc

HTTP Request
include::{snippets}/join/success/base/http-request.adoc[opts=optional]

Request Headers
include::{snippets}/join/success/base/request-headers.adoc[opts=optional]

// 생략
```

한편 `index.adoc`에서 다른 adoc를 include하는 대신 link할 수도 있습니다. 그렇게 하려면 각각의 adoc들도 html로 변환되어야 하며 `index.adoc`이 `index.html`로 변환될 때 adoc에 대한 참조가 html에 대한 참조로 변경될 수 있도록 해야 합니다. 이를 위해 AsciidoctorTask에 다음 설정을 추가해야 합니다.

```gradle
attributes(
    mapOf(
        "snippets" to snippetsDir,
        "outfilesuffix" to ".html",
        "relfileprefix" to "",
        "xrefstyle" to "short",
    ),
)
```

### 테스트 코드 작성과 문서화

다음은 문서화를 위해 작성한 회원가입 통합 테스트 코드입니다. 

```java
// src/test/java/com/jeein/member/docs/join/JoinSuccessTest.java

// 생략

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("회원가입 성공 테스트")
@ExtendWith(RestDocumentationExtension.class)
public class JoinSuccessTest {

    @Autowired private WebApplicationContext context;

    @Autowired private MemberService memberService;

    @Autowired private ObjectMapper objectMapper;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp(
            WebApplicationContext webApplicationContext,
            RestDocumentationContextProvider restDocumentation) {
        this.mockMvc =
                MockMvcBuilders.webAppContextSetup(webApplicationContext)
                        .apply(documentationConfiguration(restDocumentation))
                        .defaultRequest(
                                get("/").accept(MediaType.APPLICATION_JSON)
                                        .contentType(MediaType.APPLICATION_JSON))
                        .build();
    }

    @Test
    @DisplayName("회원가입 요청이 유효하고 이메일과 닉네임이 고유하면 회원가입이 성공한다.")
    void joinMember_success() throws Exception {
        JoinRequestDTO request = JoinRequestDTO.of("email@example.com", "이름", "닉네임", "password");

        mockMvc.perform(post(ApiPath.MEMBER_JOIN).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.message").value(ResponseMessage.JOIN_SUCCESS))
                .andExpect(jsonPath("$.errors").doesNotExist())
                .andExpect(jsonPath("$.data.id").exists())
                .andExpect(jsonPath("$.data.email").value("email@example.com"))
                .andExpect(jsonPath("$.data.name").value("이름"))
                .andExpect(jsonPath("$.data.nickname").value("닉네임"))
                .andExpect(header().string("Location", containsString("api/v1/members/")))
                .andDo(
                        doc(
                                DocumentIdentifier.JOIN_SUCCESS_BASE,
                                MemberSnippet.MEMBER_JOIN_REQUEST_FIELDS,
                                responseHeaders(
                                        headerWithName(HttpHeaders.LOCATION)
                                                .description("생성된 리소스의 URI")),
                                CommonSnippet.successResponseWithDataFields()));
    }
}

```

작성 내용을 요약하면 다음과 같습니다.

- 테스트 관련
  - `@SpringBootTest`로 전체 스프링 컨텍스트를 로딩 (통합 테스트)
  - `@ActiveProfiles("test")`로 test 프로파일의 데이터베이스 설정 이용
  - `@Transactional` 적용으로 테스트 종료 시 insert한 데이터 롤백
  - `@DisplayName`으로 테스트 클래스 및 테스트 메서드에 이름 부여
  - `@BeforeEach`로 테스트 메서드 실행 전에 Mockmvc 생성, 공통 헤더 적용
  - 요청 객체를 ObjectMapper로 json화하여 클라이언트의 요청 mocking
  - `andExpect()`로 기대한 결과와 실제 결과가 같은지 확인

- 문서화 관련
  - `@ExtendWith(RestDocumentationExtension.class)`으로 문서화 기능 활성화
  - `@BeforeEach`로 테스트 메서드 실행 전에 Mockmvc에 문서화 설정 적용
  - `andDo()`에 `document()`로 문서에 추가할 내용 작성
    - `document()`의 wrapper 함수인 `doc()`을 이용하여 요청, 응답 body의 json의 출력을 보기 좋게 만드는 설정 추가
    - Request Field 및 Respons과 Field 스니펫, 스니펫 저장 장소는 별도 파일에서 상수 및 enum으로 관리

이렇게 하면 다음과 같이 `build.gradle.kts`에 설정한 스니펫 생성 경로에 스니펫이 생성됩니다. 

![rest snippet](/assets/images/rest-snippet.png)

```adoc
// build/generated-snippets/join/success/base/http-request.adoc

POST /api/v1/members/join HTTP/1.1
Content-Type: application/json
Accept: application/json
Content-Length: 116
Host: localhost:8080

{
  "email" : "email@example.com",
  "name" : "이름",
  "nickname" : "닉네임",
  "password" : "password"
}
```

여기까지 설정을 마치고 `./gradlew bootJar`를 실행하면 `/docs/index.html`에서 완성된 문서를 확인할 수 있습니다.

## 3. Github publishing

마이크로 서비스에 접속하지 않고도 문서를 확인하고 싶거나 이  문서를 중앙집중식으로 관리하고 싶다면 Gradle의 git publish 플러그인을 이용할 수 있습니다.  

### Gradle 설정

> 레퍼런스  
네이버 핵데이 행사 리포지토리 [https://github.com/naver/hackday-conventions-java/blob/master/build.gradle](https://github.com/naver/hackday-conventions-java/blob/master/build.gradle)

저는 github organization에 jekyll blog를 위한 리포지토리를 만들어두었기 때문에 문서를 리포지토리의 docs 폴더로 push하는 태스크를 다음과 같이 생성하였습니다. 이때 주의해야 할 것은 gitPublish는 기본적으로 기존 리포지토리의 내용을 모두 clean하여 삭제해버린다는 것입니다. 이를 방지하기 위하여 `preserve` 설정을 추가해주어야 합니다.  

다음은 제가 이용한 Gradle 설정입니다. 이렇게 설정을 하고 로컬 컴퓨터에 설정에 명시한 리포지토리에 접근할 수 있는 github personal access token이 등록되어 있다면 `./gradlew gitPublishPush` 명령어를 통해 문서를 이 리포지토리에 push할 수 있습니다.

```gradle
// build.gradle.kts

plugin {
    id("org.ajoberstar.git-publish") version "4.2.0"
}

val asciidoctorOutputDir = layout.buildDirectory.dir("docs/asciidoc/member-service")

// Publishing Document
tasks.named("gitPublishCopy") {
    dependsOn("asciidoctor")
}

gitPublish {
    repoUri.set("git@github.com:socketing-refactoring/socketing-refactoring.github.io.git")
    branch.set("gh-pages")
    contents {
        from(asciidoctorOutputDir) {
            into("docs/member-service")
        }

        preserve {
            include("**")
        }
    }
    commitMessage.set("Update Member Service API documentation")
}

// 생략
```

이렇게 하면 이제 서버를 실행시키지 않아도 다음과 같이 공용 리포지토리의 경로를 통해 문서를 확인할 수 있습니다.

[https://socketing-refactoring.github.io/docs/member-service/](https://socketing-refactoring.github.io/docs/member-service/)

## 4. Spring Rest Docs To Swagger

Spring Rest Docs를 통해 실제 Api와 100% 호환되는 API 문서를 생성하였습니다. 그러나 asciidoc 문서는 Api 테스트가 어렵다는 점이 아쉽습니다.  
이에 Spring Rest Docs 문서를 Swagger 문서로 변환하는 플러그인을 적용해보려고 합니다.

> 레퍼런스  
카카오페이 기술 블로그 [https://tech.kakaopay.com/post/openapi-documentation/](https://tech.kakaopay.com/post/openapi-documentation/)  
Velog [ssongkim's devlog](https://velog.io/@suhongkim98/spring-Rest-Docs-Swagger-UI%EB%A1%9C-MSA-%ED%99%98%EA%B2%BD%EC%97%90%EC%84%9C-API-%EB%AC%B8%EC%84%9C-%ED%86%B5%ED%95%A9-%EA%B4%80%EB%A6%AC%ED%95%98%EA%B8%B0)

### Gradle 설정

기존 설정에서 다음 설정을 추가합니다.

```gradle
// build.gradle.kts

plugins {
    id("com.epages.restdocs-api-spec") version "0.18.4"
    // 생략
}

dependencies {
    testImplementation("com.epages:restdocs-api-spec-mockmvc:0.18.4")
    // 생략
}

openapi3 {
    this.setServer("https://api.socketing.jeein.xyz")
    title = "My API"
    description = "My API description"
    version = "0.1.0"
    format = "yaml" // or json
}
```

여기서 주의할 점은 epage에서 제공하는 라이브러리의 버전입니다. 스프링 부트 3부터는 17 이상의 버전을 사용해야 `RequestParameterSnipp` NoClassDefFoundError 를 피할 수 있습니다. 

> epage restdocs 공식 문서 [https://github.com/ePages-de/restdocs-api-spec](https://github.com/ePages-de/restdocs-api-spec)

그리고 이 라이브러리를 사용해보니 spring rest docs와 조금 차이가 나는 부분도 있는 것 같습니다. 예를 들어, 유효성 검사 테스트에서 어떤 파라미터에 null이 들어가는 경우를 테스트할 때 원래는 Snippet의 해당 필드 type이 STRING 이어도 테스트가 실패하지 않았었는데 epage의 rest docs의 경우 request field snippet의 타입과 요청 데이터의 타입이 일치하지 않는다는 이유로 테스트가 실패했습니다. 그래서 저는 실패 테스트의 경우에는 request field snippet 문서화를 하지 않는 것으로 오류를 해결했습니다. 

### Java 코드 수정

이제 테스트 코드에서 `andDo()` 안의 `document()`를 `org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document`에서 `com.epages.restdocs.apispec.MockMvcRestDocumentationWrapper.document`로 바꾸어주기만 하면 됩니다. document 이외에는 `org.springframework.restdocs.mockmvc.MockMvcRestDocumentation` 패키지의 클래스들을 그대로 이용하면 됩니다.  

저는 `document()`를 감싸는 wrapper 함수를 사용하고 있었다보니 이 함수가 있는 클래스에서 import문 하나만 바꿔주니 테스트 코드를 수정할 필요 없이 바로 epage의 document를 적용할 수 있었습니다. 

```java
// import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static com.epages.restdocs.apispec.MockMvcRestDocumentationWrapper.document;
// 생략

public class RestDocsUtil {

    public static RestDocumentationResultHandler doc(String identifier, Snippet... snippets) {
        return document(
                identifier,
                preprocessRequest(prettyPrint()),
                preprocessResponse(prettyPrint()),
                snippets);
    }
}

```

이제 `./gradlew openapi3`를 실행하면 `build/api-spec` 위치에 `openapi3.yaml`이 생성됩니다. Swagger Editor를 통해 ui 버전을 확인해보면 다음과 같습니다. spring rest docs와 연동하니 테스트해본 예외 응답들을 자동으로 문서화할 수 있어서 편리한 것 같습니다.

![swagger-epage](/assets/images/swagger-epage.png)

Swagger 스펙의 문서가 만들어졌으니 이를 ui로 변환해서 볼 방법을 고민해야 합니다. 이에 대해서는 위 레퍼런스를 참고하면 좋을 것 같습니다. 저의 경우 Spring Gateway Server가 있는 서버가 지금 생성된 문서를 사용할 수 있도록 문서를 json 타입의 정적 리소스로 배포하면 될 것 같습니다.

## 리뷰

Swagger와 Spring Rest Docs를 이용하여 문서화를 적용해보았습니다. 각각의 장점이 뚜렷하다보니 둘의 장점을 모두 취할 수 있는 방법을 선택하게 되었습니다.  
아쉬운 점이 있다면 점점 Gradle의 태스크가 늘어나고 있어서 빌드 시간이 길어지고 있습니다. 특히 문서화를 위한 테스트 코드가 통합 테스트이다보니 특히나 테스트 작업이 오래 걸립니다. 그나마 마이크로 서비스라서 빌드 시간이 이 정도였다는 생각에 마이크로 서비스 아키텍처의 장점을 느끼기도 하였습니다. 앞으로는 테스트와 빌드 작업 최적화 방법을 고민해보면 좋을 것 같습니다.
