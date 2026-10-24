# home-next

Trang landing của tên miền gốc `hoandat.com`: giới thiệu bốn app dùng chung một tài khoản hoandat (Chat, Scribe, Localman, Tunelo), cùng Miu World và Tiểu Đệ. Trang tĩnh, Vite + TypeScript, lớp 3D bằng three.js.

Plan, brief thiết kế và quyết định: [`../plans/dattqh/261025-0113-hoandat-home-landing/plan.md`](../plans/dattqh/261025-0113-hoandat-home-landing/plan.md).

## Bắt đầu

Node ≥ 22.12, pnpm.

```bash
pnpm install
pnpm dev            # http://localhost:5280
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm preview        # bản build ở http://localhost:5281
```

Bản build nằm ở `dist/`: một `index.html`, CSS, JS ban đầu (~4,5 kB gzip), chunk 3D tải lazy (~154 kB gzip) và font tự host ở `/fonts/` (trình duyệt chỉ tải subset cần theo `unicode-range`). Phục vụ được bằng bất kỳ web server tĩnh nào.

## Cách trang hoạt động

| Phần | Ở đâu |
|---|---|
| Nội dung tiếng Anh (đọc được khi không có JS) | `index.html` |
| Chuỗi en/vi, chọn ngôn ngữ (lưu lựa chọn, mặc định theo trình duyệt) | `src/i18n/` |
| Vị trí cuộn → "stage" liên tục (0 hero, 1-4 bốn app, 5 tài khoản, 6 workshop) | `src/scroll/stage-progress.ts` |
| Vị trí 4 ô logo ở từng stage (toán thuần, có test) | `src/scene/tile-poses.ts` |
| Điều phối cảnh: lò xo từng ô, vòng render, mất/khôi phục WebGL | `src/scene/tiles-scene.ts` |
| 4 khối kính khúc xạ có tán sắc, mỗi khối chứa biểu tượng app phát sáng | `src/scene/glass-tiles.ts`, `src/scene/tile-glyphs.ts` |
| Nền cực quang (shader), đổi tông màu theo từng stage | `src/scene/aurora-backdrop.ts`, `AURORA_MOODS` trong `src/scene/scene-palette.ts` |
| Bụi sao, vòng "chìa khoá" của phần tài khoản | `src/scene/star-dust.ts`, `src/scene/key-ring.ts` |
| Hậu kỳ: bloom, quang sai nhẹ, grain | `src/scene/post-effects.ts` |
| Tự hạ chất lượng khi máy không giữ nổi ~45 fps | `src/scene/quality-governor.ts` |
| Token thiết kế (màu oklch theo logo, cỡ chữ, khoảng cách) | `src/styles/tokens.css` |

- Section nào là một stage thì có thuộc tính `data-stage`; đổi thứ tự hay thêm stage thì sửa cả `tile-poses.ts`.
- Mô tả sản phẩm lấy từ catalog `shared-next/packages/app-switcher/src/catalog.ts` và README từng repo; sản phẩm đổi thì sửa `src/i18n/strings.ts` (test kiểm mọi khoá trong HTML đều có chuỗi, chữ tiếng Anh trong HTML khớp chuỗi `en`, không có em-dash).
- Màu của cảnh 3D (three.js cần hex) nằm một chỗ ở `src/scene/scene-palette.ts`.

## Dự phòng và hiệu năng

- Không WebGL hoặc chunk 3D lỗi: poster SVG trong hero ở lại, trang đọc đủ.
- `prefers-reduced-motion`: không trôi nền, không parallax, cảnh nhảy thẳng tới stage đích và chỉ vẽ lại khi cuộn.
- Bậc chất lượng (`QUALITY_LEVELS`): bắt đầu ở DPR 2 (điện thoại 1,5); trung bình khung hình chậm hơn 1/45 giây trong 90 khung thì hạ DPR, độ phân giải phần khúc xạ, cuối cùng tắt bloom. Không bao giờ nâng lại trong một lượt xem.
- Máy chỉ có WebGL chạy bằng CPU (`failIfMajorPerformanceCaveat`) giữ poster thay vì dựng cảnh.
- Mất WebGL context: poster hiện lại; khôi phục thì dựng lại môi trường phản chiếu và vẽ tiếp.
- Dừng vòng render khi tab ẩn; chunk 3D (~154 kB gzip) tải sau `requestIdleCallback`.

## Deploy

Production: `https://hoandat.com` (từ 25/10/2026). Cloudflare (bản ghi A proxied cho `hoandat.com` và `www`, SSL "full") → nginx trên .65 (`/etc/nginx/conf.d/hoandat.com.conf`, bản gốc ở `infra/nginx/`) → file tĩnh ở `/var/www/hoandat-home/dist`. `www` và `http` chuyển 301 về `https://hoandat.com/`.

```bash
SSH_TARGET=<alias .65> SSH_OPTS="-F <ssh_config>" bash infra/deploy.sh
```

Script chạy gate và build, rsync `dist/` và file nginx, giữ bản trước ở `dist.prev`, chỉ cài lại file nginx khi nó đổi (`nginx -t` trước khi reload), rồi kiểm origin trả 200. Từ Git Bash trên Windows phải chạy với `PATH="/usr/bin:$PATH"` để rsync đi cùng ssh của MSYS. Quay lại bản trước: `cd /var/www/hoandat-home && rm -rf dist && mv dist.prev dist`.

CSP chặn mọi nguồn ngoài, trừ beacon Cloudflare Web Analytics (cấu hình cấp zone, không cookie). Thêm nguồn ngoài vào trang thì sửa CSP ở cả hai chỗ trong file nginx.
