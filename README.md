# home-next

Trang landing của tên miền gốc `hoandat.com`. Thông điệp: một tài khoản hoandat, một "vũ trụ" app không ngừng mở rộng. Khách ngồi trên con tàu nhỏ, bot dẫn đường Nav (tiếng Việt: Hoa tiêu) chở đi qua các trạm: từng app đang chạy, trạm chìa khoá (tài khoản chung ở `auth.hoandat.com`) và trạm các app đang xây. Không app nào là "lõi": thêm app thì thêm trạm.

Trang tĩnh (Vite + TypeScript), lớp 3D bằng three.js. Plan, brief thiết kế và quyết định nằm ở workspace riêng của hệ sinh thái (không thuộc repo này): `plans/dattqh/261025-0113-hoandat-home-landing/plan.md`.

## Quyết định thiết kế

- **Nội dung đọc được không cần JS.** Chữ tiếng Anh nằm sẵn trong `index.html`; JS chỉ đổi ngôn ngữ và dựng cảnh. Không có WebGL, WebGL chạy bằng CPU, hoặc chunk 3D lỗi thì poster SVG ở lại và trang vẫn đọc đủ.
- **3D không được làm chậm trang.** Chunk 3D tải lazy sau `requestIdleCallback`; máy yếu được hạ chất lượng thay vì giật, và không nâng lại trong một lượt xem (lý do ở đầu `src/scene/quality-governor.ts`). `prefers-reduced-motion` được tôn trọng.
- **Không nguồn ngoài.** Font tự host ở `public/fonts/`; CSP trong `infra/nginx/hoandat.com.conf` chặn mọi nguồn ngoài trừ beacon Cloudflare Web Analytics (không cookie). Thêm nguồn ngoài thì sửa CSP ở mọi khối `add_header` trong file đó.
- **Mô tả sản phẩm theo catalog chung.** Chuỗi en/vi ở `src/i18n/strings.ts` lấy từ catalog app-switcher của `shared-next` và README từng repo; sản phẩm đổi thì sửa ở đây. Test trong `src/i18n/strings.test.ts` giữ HTML và chuỗi khớp nhau.
- **Logo quỹ đạo chỉ dùng cho landing** (`public/favicon.svg`, bản inline trong `index.html`); bộ brand chung của hệ sinh thái chưa đổi theo.

## Ở đâu

| Cần tìm | Ở đâu |
|---|---|
| Nội dung trang, các chương (`data-stage`) | `index.html` |
| Chuỗi en/vi, lời thoại bot, chọn ngôn ngữ | `src/i18n/` |
| Cuộn → stage | `src/scroll/stage-progress.ts` |
| Quỹ đạo bay và số trạm (`STOP_COUNT`) | `src/scene/flight-path.ts` |
| Điều phối cảnh 3D (camera, trạm, bot, vòng render, mất WebGL) | `src/scene/flight-scene.ts` |
| Màu cảnh 3D và tông tinh vân theo trạm (`AURORA_MOODS`) | `src/scene/scene-palette.ts` |
| Bong bóng thoại và bản đồ lộ trình (chạy cả khi không WebGL) | `src/guide/guide-dialog.ts` |
| Token thiết kế | `src/styles/tokens.css` |

Thêm một app: thêm chương và mục lộ trình trong `index.html`, chuỗi `guide.<n>`/`route.<n>`, một tâm trạng trong `AURORA_MOODS`, rồi tăng `STOP_COUNT`. `src/i18n/strings.test.ts` bắt lỗi lệch số chương với số trạm và khoá chuỗi bị thiếu.

## Phát triển

Node ≥ 22.12, pnpm. Lệnh và cổng dev/preview: `scripts` trong `package.json`. Gate trước khi deploy: `lint`, `typecheck`, `test`, `build`. Bản build ở `dist/` phục vụ được bằng bất kỳ web server tĩnh nào.

## Deploy

Production: <https://hoandat.com>, Cloudflare đứng trước nginx trên máy chủ chung của hệ sinh thái; `www` và `http` chuyển 301 về `https://hoandat.com/`. Cấu hình nginx gốc: `infra/nginx/hoandat.com.conf`.

Deploy và rollback bằng `infra/deploy.sh`: cách gọi, các bước và lệnh quay lại bản trước ghi ở đầu script. Thông tin truy cập máy chủ không nằm trong repo.
