# AGENTS.md

Home (`home-next`): trang landing tĩnh của `hoandat.com` (Vite + TypeScript, nền vũ trụ bằng three.js). Đọc `README.md` trước khi làm; bản đồ file nằm ở đó.

## Gate trước khi báo xong

`pnpm lint` (Biome) → `pnpm typecheck` → `pnpm test` → `pnpm build`. Cổng dev cố định 5280. Chỉ dùng `pnpm`, không dùng npm.

## Deploy prod

Không có môi trường dev hay staging: xong việc, push hết lên `main`, kiểm `ci`, rồi `bash ../tools/deploy-prod.sh home-next` (script của workspace `hoandat-app`). Không cần hỏi trước. Vẫn hỏi trước khi sửa bí mật hay chạy script setup. Chuẩn chung: `../docs/deploy-standard.md`; chi tiết riêng ở mục Deploy của `README.md`.

## Repo công khai

Không commit IP, cổng SSH, user máy chủ, secret hay file env. Env production (nếu có) nằm ngoài repo ở iCloud `ENV production/<tên dự án>/`.
