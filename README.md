# home-next

Trang landing của tên miền gốc `hoandat.com`: một tài khoản hoandat, một "vũ trụ" app không ngừng mở rộng. Khách ngồi trên con tàu nhỏ, bot dẫn đường Nav (tiếng Việt: Hoa tiêu) chở đi qua từng app đang chạy (Chat, Scribe, Localman, Tunelo, Miu World, Tiểu Đệ), tới trạm chìa khoá (tài khoản chung) và các app đang xây. Không app nào là "lõi": thêm app thì thêm trạm. Trang tĩnh, Vite + TypeScript, lớp 3D bằng three.js.

Plan, brief thiết kế và quyết định: [`../plans/dattqh/261025-0113-hoandat-home-landing/plan.md`](../plans/dattqh/261025-0113-hoandat-home-landing/plan.md).

## Bắt đầu

Node ≥ 22.12, pnpm.

```bash
pnpm install
pnpm dev            # http://localhost:5280
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm preview        # bản build ở http://localhost:5281
```

Bản build nằm ở `dist/`: một `index.html`, CSS, JS ban đầu (~4,5 kB gzip), chunk 3D tải lazy (~159 kB gzip) và font tự host ở `/fonts/` (trình duyệt chỉ tải subset cần theo `unicode-range`). Phục vụ được bằng bất kỳ web server tĩnh nào.

## Cách trang hoạt động

| Phần | Ở đâu |
|---|---|
| Nội dung tiếng Anh (đọc được khi không có JS) | `index.html` |
| Chuỗi en/vi (gồm lời thoại của bot), chọn ngôn ngữ | `src/i18n/` |
| Vị trí cuộn → "stage" liên tục (0 khởi hành, 1-4 từng app, 5 chìa khoá, 6 thêm app) | `src/scroll/stage-progress.ts` |
| Bong bóng thoại của bot (gõ chữ; ẩn khỏi trình đọc màn hình vì lặp lại nội dung chương) và bản đồ lộ trình; chạy cả khi không có WebGL | `src/guide/guide-dialog.ts`, `src/styles/cockpit-hud.css` |
| Quỹ đạo bay: đường cong qua 7 trạm, vị trí trạm cạnh chữ (desktop) hoặc trên chữ (điện thoại); toán thuần, có test | `src/scene/flight-path.ts` |
| Điều phối cảnh: camera bay theo cuộn, trạm, hub, bot, vòng render, mất/khôi phục WebGL | `src/scene/flight-scene.ts` |
| Bot dẫn đường 3D (mắt chớp, quay đầu nhìn trạm, ăng-ten nháy khi "nói") | `src/scene/guide-bot.ts` |
| Tên lửa của bot: vòi kim loại, tia plasma hai lớp có shock diamond, tia lửa chạy trên GPU, quầng nhiệt; tia dài ra khi tàu bay nhanh | `src/scene/bot-thruster.ts` |
| Trạm: khối kính khúc xạ có tán sắc; biểu tượng app vẽ sau lớp kính, ở đủ độ phân giải, nên luôn nét | `src/scene/glass-tiles.ts`, `src/scene/tile-glyphs.ts` |
| Hub "chìa khoá": logo quỹ đạo 3D (lõi hồng = tài khoản, các ô app chạy trên vòng) | `src/scene/flight-scene.ts`, `src/scene/key-ring.ts` |
| Tinh vân (shader vẽ ở độ phân giải thấp, làm background), đổi tông theo trạm | `src/scene/aurora-backdrop.ts`, `AURORA_MOODS` trong `src/scene/scene-palette.ts` |
| Sao: bụi sao lấp lánh và vệt sao khi tàu bay nhanh | `src/scene/star-dust.ts`, `src/scene/warp-stars.ts` |
| Môi trường phản chiếu riêng (thay `RoomEnvironment`, vốn làm mặt kính cháy trắng) | `src/scene/studio-environment.ts` |
| Hậu kỳ: bloom, quang sai nhẹ, grain | `src/scene/post-effects.ts` |
| Tự hạ chất lượng khi máy không giữ nổi ~45 fps | `src/scene/quality-governor.ts` |
| Logo quỹ đạo (chỉ dùng trên landing; `docs/brand` của hệ sinh thái chưa đổi) | `public/favicon.svg`, bản inline trong `index.html` |
| Token thiết kế (màu oklch theo logo, cỡ chữ, khoảng cách) | `src/styles/tokens.css` |

- Section nào là một stage thì có thuộc tính `data-stage` (test kiểm số lượng khớp `LAST_STAGE + 1`). Thêm một app: thêm một chương và một mục lộ trình trong `index.html`, chuỗi `guide.<n>`/`route.<n>`, một tâm trạng trong `AURORA_MOODS`, rồi tăng `STOP_COUNT` trong `flight-path.ts`.
- Mô tả sản phẩm lấy từ catalog `shared-next/packages/app-switcher/src/catalog.ts` và README từng repo; sản phẩm đổi thì sửa `src/i18n/strings.ts` (test kiểm mọi khoá trong HTML đều có chuỗi, chữ tiếng Anh trong HTML khớp chuỗi `en`, không có em-dash).
- Màu của cảnh 3D (three.js cần hex) nằm một chỗ ở `src/scene/scene-palette.ts`.

## Dự phòng và hiệu năng

- Không WebGL hoặc chunk 3D lỗi: poster SVG trong hero ở lại, trang đọc đủ.
- `prefers-reduced-motion`: không trôi nền, không parallax, cảnh nhảy thẳng tới stage đích và chỉ vẽ lại khi cuộn.
- Bậc chất lượng (`QUALITY_LEVELS`): bắt đầu ở DPR 2 (điện thoại và máy cảm ứng 1,5); trung bình khung hình chậm hơn 1/45 giây trong 45 khung thì hạ DPR, độ phân giải phần khúc xạ và tinh vân, cuối cùng tắt bloom. Không bao giờ nâng lại trong một lượt xem.
- Máy chỉ có WebGL chạy bằng CPU (`failIfMajorPerformanceCaveat`) giữ poster thay vì dựng cảnh.
- Mất WebGL context: poster hiện lại; khôi phục thì dựng lại môi trường phản chiếu và vẽ tiếp.
- Dừng vòng render khi tab ẩn; chunk 3D (~159 kB gzip) tải sau `requestIdleCallback`.

## Deploy

Production: `https://hoandat.com` (từ 25/10/2026). Cloudflare (bản ghi A proxied cho `hoandat.com` và `www`, SSL "full") → nginx trên .65 (`/etc/nginx/conf.d/hoandat.com.conf`, bản gốc ở `infra/nginx/`) → file tĩnh ở `/var/www/hoandat-home/dist`. `www` và `http` chuyển 301 về `https://hoandat.com/`.

```bash
SSH_TARGET=<alias .65> SSH_OPTS="-F <ssh_config>" bash infra/deploy.sh
```

Script chạy gate và build, rsync `dist/` và file nginx, giữ bản trước ở `dist.prev`, chỉ cài lại file nginx khi nó đổi (`nginx -t` trước khi reload), rồi kiểm origin trả 200. Từ Git Bash trên Windows phải chạy với `PATH="/usr/bin:$PATH"` để rsync đi cùng ssh của MSYS. Quay lại bản trước: `cd /var/www/hoandat-home && rm -rf dist && mv dist.prev dist`.

CSP chặn mọi nguồn ngoài, trừ beacon Cloudflare Web Analytics (cấu hình cấp zone, không cookie). Thêm nguồn ngoài vào trang thì sửa CSP ở cả hai chỗ trong file nginx.
