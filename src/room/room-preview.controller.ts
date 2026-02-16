import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import * as moment from 'moment';

import { GuardName } from 'src/common/guard-name';
import { PublicGuard } from 'src/common/public-guard.decorator';

import { RoomService } from './room.service';

@Controller('room')
export class RoomPreviewController {
  constructor(private readonly roomService: RoomService) {}

  @Get('preview/:uuid')
  @PublicGuard([GuardName.JwtGuard, GuardName.NicknameGuard])
  @ApiOperation({
    summary:
      '카카오톡 등 메신저 공유 시 OG 메타태그가 포함된 HTML을 반환합니다. (인증 불필요)',
  })
  @ApiParam({ name: 'uuid', description: '방 UUID' })
  @ApiResponse({
    status: 200,
    description: 'OG 메타태그가 포함된 HTML',
  })
  @ApiResponse({
    status: 404,
    description: '방이 존재하지 않는 경우',
  })
  async getRoomPreview(@Param('uuid') uuid: string, @Res() res: Response) {
    const room = await this.roomService.findOne(uuid);

    const departureTime = moment(room.departureTime)
      .utcOffset(9)
      .format('M/D(ddd) a h:mm')
      .replace('am', '오전')
      .replace('pm', '오후');

    const title = `${room.departureLocation} → ${room.destinationLocation}`;
    const description = `🕐 ${departureTime} | 👥 ${room.currentParticipant}/${room.maxParticipant}명`;

    const ogTitle = `Paxi - ${escapeHtml(title)}`;
    const ogDescription = escapeHtml(description);
    const iosStoreUrl =
      'https://apps.apple.com/us/app/popo-%ED%8F%AC%EC%8A%A4%ED%85%8C%ED%82%A4%EC%95%88%EC%9D%98-%ED%95%84%EC%88%98-%EC%95%B1/id6743666761';
    const androidStoreUrl =
      'https://play.google.com/store/apps/details?id=com.popomobile';

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${ogTitle}</title>

  <meta name="apple-itunes-app" content="app-id=6743666761" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Paxi" />
  <meta property="og:title" content="${ogTitle}" />
  <meta property="og:description" content="${ogDescription}" />

  <meta property="twitter:card" content="summary" />
  <meta property="twitter:title" content="${ogTitle}" />
  <meta property="twitter:description" content="${ogDescription}" />

  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #fa5721 0%, #ff8a5b 100%);
      color: white;
      text-align: center;
    }
    h1 { font-size: 24px; margin-bottom: 12px; }
    p { font-size: 15px; opacity: 0.9; margin: 6px 0; }
    .spinner {
      border: 3px solid rgba(255,255,255,0.3);
      border-top: 3px solid white;
      border-radius: 50%;
      width: 40px; height: 40px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .button {
      display: inline-block;
      background: white;
      color: #fa5721;
      padding: 12px 22px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 8px 4px;
    }
    .button:hover { background: #f3f3f3; }
    #status { margin-top: 16px; font-size: 14px; }
  </style>

  <script>
    document.addEventListener('DOMContentLoaded', function () {
      var roomUuid = '${escapeHtml(uuid)}';
      var ua = navigator.userAgent;
      var isIOS = /iPhone|iPad|iPod/i.test(ua);
      var isAndroid = /Android/i.test(ua);
      var isKakao = /KAKAOTALK/i.test(ua);
      var appOpened = false;

      if (isKakao) {
        location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(window.location.href);
        return;
      }

      function openApp() {
        if (isIOS) {
          window.location.href = 'popo://room/' + roomUuid;
        } else if (isAndroid) {
          window.location.href = 'intent://room/' + roomUuid + '#Intent;scheme=popo;package=com.popomobile;end';
        }
      }

      document.addEventListener('visibilitychange', function () {
        if (document.hidden) appOpened = true;
      });

      if (isIOS || isAndroid) {
        openApp();
      }

      var fallbackDelay = isIOS ? 2000 : 1500;
      setTimeout(function () {
        if (appOpened) return;
        var statusEl = document.getElementById('status');
        var spinner = document.querySelector('.spinner');
        var openAppBtn = document.getElementById('open-app-btn');
        var storeSection = document.getElementById('store-section');

        if (spinner) spinner.style.display = 'none';

        if (isIOS || isAndroid) {
          if (statusEl) statusEl.textContent = '자동으로 열리지 않았다면 아래 버튼을 눌러주세요.';
          if (openAppBtn) {
            openAppBtn.style.display = 'inline-block';
            openAppBtn.addEventListener('click', function (e) {
              e.preventDefault();
              openApp();
            });
          }
          if (storeSection) storeSection.style.display = 'block';
        } else {
          if (statusEl) statusEl.textContent = '이 링크는 모바일 기기에서 열어주세요.';
        }
      }, fallbackDelay);
    });
  </script>
</head>
<body>
  <div class="spinner"></div>
  <h1>Paxi 택시팟 참여하기</h1>
  <p id="status">앱에서 열기를 시도 중입니다...</p>

  <a id="open-app-btn" href="#" class="button" style="display:none; font-size:17px; padding:14px 36px; margin-top:16px;">
    앱에서 열기
  </a>

  <div id="store-section" style="margin-top:28px; display:none;">
    <p style="font-size:13px">앱이 설치되어 있지 않다면</p>
    <a href="${iosStoreUrl}" class="button">iOS 앱 다운로드</a>
    <a href="${androidStoreUrl}" class="button">Android 앱 다운로드</a>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
