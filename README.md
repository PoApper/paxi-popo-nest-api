# Paxi Nest API

<p align="center">
  <a href="http://popo.poapper.club">
    <img src="https://raw.githubusercontent.com/PoApper/POPO-nest-api/master/assets/popo.svg" alt="Logo" height="150">
  </a>
  <p align="center">
    NestJS API for PAXI @ <a href="https://github.com/PoApper">PoApper</a>
    <br />
    POPO, POstechian's POrtal
    <br />
    👉 <a href="http://popo.poapper.club">POPO</a>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Docker-2CA5E0?logo=Docker&logoColor=white"/>
  <img src="https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white">
  <img src="https://img.shields.io/badge/NestJS-11.x-E0234E?logo=nestjs&logoColor=white">
  <img src="https://img.shields.io/badge/WebSocket-Socket.IO-010101?logo=socketdotio&logoColor=white" />
</p>

## About

Paxi는 교내 택시/카풀 매칭과 실시간 커뮤니케이션을 제공하는 서비스로, 웹/모바일 클라이언트가 안전하게 방을 만들고 참여하며 결제를 정산할 수 있도록 하는 NestJS 기반 API입니다. 현재는 모바일 환경만 지원합니다.

Paxi는 [POPO](https://github.com/PoApper/popo-nest-api)와 더불어 교내 구성원들을 위한 PoApper에서 개발한 서비스입니다. 산재된 카풀 구인 채널로 인한 불편함을 해결하기 위해 기획했습니다. 아래와 같은 가치를 제공합니다.

- 신뢰성: 교내 이메일 인증으로 사용자 신원 보증 및 추적 가능성 확보
- 개인정보 보호: 닉네임 기반 채팅으로 전화번호 등 불필요한 개인정보 노출 최소화
- 편의성: 통합 플랫폼으로 카풀 구인부터 정산까지 같은 방에서

현재 모바일에서 만나보실 수 있습니다.

<p align="center">
  <a href="https://play.google.com/store/apps/details?id=com.popomobile" target="_blank" rel="noreferrer">
    <img src="https://img.shields.io/badge/Google%20Play-414141?style=for-the-badge&logo=googleplay&logoColor=white" alt="Google Play" />
  </a>
  <a href="https://apps.apple.com/us/app/popo-%ED%8F%AC%EC%8A%A4%ED%85%8C%ED%82%A4%EC%95%88%EC%9D%98-%ED%95%84%EC%88%98-%EC%95%B1/id6743666761" target="_blank" rel="noreferrer">
    <img src="https://img.shields.io/badge/App%20Store-0D96F6?style=for-the-badge&logo=appstore&logoColor=white" alt="App Store" />
  </a>
</p>

## How to Deploy

Paxi 어플리케이션은 POPO와 마찬가지로, Docker Container로 실행되고 있으며, [Docker Swarm](https://docs.docker.com/engine/swarm/)을 통해 오케스트레이션 되고 있습니다. [Portainer](https://www.portainer.io/)라는 웹 도구를 사용해 컨테이너 환경을 제어하고 모니터링 하고 있습니다.
Dev-Prod의 two-stage 배포 정책을 가지고 있으며, 각 stage에 배포하기 위한 조건은 아래와 같습니다.

- Dev Stage
  -  정의해 둔 `Github Actions` 스크립트에 의해 PR이 열릴 때 자동으로 이미지를 빌드하고 dev 서버에 배포됩니다.
- Prod Stage
  - Paxi 도커 이미지의 특정 태그를 업데이트 후 릴리즈합니다. (ex. `v1.2.3`)
  - PoApper AWS ECR에 릴리즈가 업로드됩니다.
  - Portainer 웹에서 **직접** Prod stage의 버전을 해당 버전으로 바꿔줍니다.

## Contributors & Maintainer

- Gwanho Kim ([@khkim6040](https://github.com/khkim6040/))
- Taeyang Na ([@hegelty](https://github.com/hegelty/))
- Seokyun Ha ([@bluehorn07](https://github.com/bluehorn07))
