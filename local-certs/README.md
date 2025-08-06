## 로컬에서 HTTPS 통신을 하기 위한 self-signed 인증서 생성 방법
로컬 환경에서 popo-public-web, popo-admin-web 프론트와 통신을 위해 필요한 인증서를 생성하는 방법이다.
프론트와 통신은 HTTP가 아니라 HTTPS로 이루어지기 때문에 인증서가 필요하다.

`local-certs` 폴더에서 아래 명령어를 실행

```sh
# macOS
$ brew install mkcert
$ mkcert -key-file localhost-key.pem -cert-file localhost.pem localhost 127.0.0.1 ::1

Created a new certificate valid for the following names 📜
 - "localhost"
 - "127.0.0.1"
 - "::1"

The certificate is at "localhost.pem" and the key at "localhost-key.pem" ✅

It will expire on 6 November 2027 🗓
```

```powershell
# Windows
# TODO: 윈도우 유저 추가 설명 필요
```

연결하고자 하는 프론트(popo-public-web, popo-admin-web)에서도 동일한 명령어를 실행해서 인증서를 생성해 놓아야 한다.
각 레포지토리의 설명 참고

_이래도 안된다면 트러블슈팅 후 이어서 작성해주시길.._
