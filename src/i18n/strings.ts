/**
 * Every visible string of the page, per locale. The HTML ships the English
 * text so the page reads fine without JavaScript; `data-i18n` keys point here.
 * Product facts come from the app switcher catalog in shared-next and the
 * README of each product repo; keep them in step when a product changes.
 */

export const LOCALES = ["en", "vi"] as const;
export type Locale = (typeof LOCALES)[number];

const en = {
	"meta.title": "hoandat · One key, four apps",
	"meta.description":
		"Chat, Scribe, Localman and Tunelo share one hoandat account. Sign in once with Google, GitHub or Apple and move between them.",

	"nav.skip": "Skip to the apps",
	"nav.main": "Main",
	"nav.apps": "Apps",
	"nav.account": "Account",
	"nav.signin": "Sign in",
	"nav.home": "hoandat home",
	"lang.switch": "Tiếng Việt",
	"lang.switch.label": "Đọc trang bằng tiếng Việt",

	"hero.title": "One key, four doors.",
	"hero.lede":
		"Chat, Scribe, Localman and Tunelo share one hoandat account. Sign in once, then walk between them.",
	"hero.cta.apps": "See the apps",

	"apps.title": "The four apps",
	"apps.open": "Open",

	"chat.title": "Messages you can find again.",
	"chat.body":
		"Fast messaging with searchable history and bots, built for the web first.",
	"scribe.title": "Speak. Get a transcript.",
	"scribe.body":
		"Record audio, trim audio and video files, and get Vietnamese transcripts you can search and edit. On the web and iPhone.",
	"localman.title": "A working mock API in minutes.",
	"localman.body":
		"Declare resources, fill them with Faker data, nest relations and get CRUD endpoints right away. It comes with a browser API client and an MCP server for AI agents.",
	"tunelo.title": "Put localhost on the internet.",
	"tunelo.body":
		"Get an HTTPS address under tunnel.hoandat.com for any local port, then watch your tunnels in the browser.",
	"tunelo.code.label": "Three commands from install to a public URL",

	"key.title": "One key opens every door.",
	"key.body":
		"Sign in with Google, GitHub or Apple. There is no password here to forget or leak. The same account works in every app, and you decide which devices and apps keep access.",
	"key.cta": "Manage your account",

	"workshop.title": "Also from the workshop",
	"miu.tag": "A 3D world where knowledge is how you move forward.",
	"miu.body":
		"Explore voxel maps with friends and use math and Vietnamese, starting from the grade 2 curriculum, to get past each challenge. Plays in the browser, for kids and grown-ups.",
	"miu.cta": "Visit Miu World",
	"miu.alt": "Miu, the white voxel cat of Miu World",
	"tieude.tag": "An AI bot trying to earn its keep.",
	"tieude.body":
		"It started with a 1,000,000₫ wallet and pays for every AI call out of it. It does small writing jobs for free and lives on voluntary tips, split half to its wallet and half to its maker's family.",
	"tieude.cta": "Meet Tiểu Đệ",

	"made.title": "Made in Vietnam by one developer and a crew of AI agents.",
	"made.body":
		"Every app here is designed, built and run by one person working with AI agents. That keeps each app small, focused and quick to improve.",
	"made.p1.title": "No passwords",
	"made.p1.body": "Sign-in goes through Google, GitHub or Apple.",
	"made.p2.title": "No email from us",
	"made.p2.body": "News shows up inside the apps, never in your inbox.",
	"made.p3.title": "An account you control",
	"made.p3.body": "Review devices and app access at auth.hoandat.com.",

	"footer.apps": "Apps",
	"footer.more": "More",
	"footer.account": "Your account",
	"footer.rights": "© 2026 hoandat.com",
} as const;

export type StringKey = keyof typeof en;

const vi: Record<StringKey, string> = {
	"meta.title": "hoandat · Một chìa khoá, bốn ứng dụng",
	"meta.description":
		"Chat, Scribe, Localman và Tunelo dùng chung một tài khoản hoandat. Đăng nhập một lần bằng Google, GitHub hoặc Apple rồi đi lại giữa các app.",

	"nav.skip": "Tới phần ứng dụng",
	"nav.main": "Điều hướng chính",
	"nav.apps": "Ứng dụng",
	"nav.account": "Tài khoản",
	"nav.signin": "Đăng nhập",
	"nav.home": "Trang chủ hoandat",
	"lang.switch": "English",
	"lang.switch.label": "Read this page in English",

	"hero.title": "Một chìa khoá, bốn cánh cửa.",
	"hero.lede":
		"Chat, Scribe, Localman và Tunelo dùng chung một tài khoản hoandat. Đăng nhập một lần, rồi đi lại giữa các app.",
	"hero.cta.apps": "Xem các app",

	"apps.title": "Bốn ứng dụng",
	"apps.open": "Mở",

	"chat.title": "Tin nhắn tìm lại được.",
	"chat.body":
		"Nhắn tin nhanh, tìm lại lịch sử tin nhắn và dùng bot, làm cho web trước tiên.",
	"scribe.title": "Cứ nói, có ngay bản chép lời.",
	"scribe.body":
		"Ghi âm, cắt tệp âm thanh và video, nhận bản chép lời tiếng Việt để tìm kiếm và chỉnh sửa. Có trên web và iPhone.",
	"localman.title": "Mock API chạy được sau vài phút.",
	"localman.body":
		"Khai báo resource, sinh dữ liệu bằng Faker, lồng quan hệ và có ngay endpoint CRUD. Kèm API client trên trình duyệt và MCP server cho AI agent.",
	"tunelo.title": "Đưa localhost lên internet.",
	"tunelo.body":
		"Nhận địa chỉ HTTPS dưới tunnel.hoandat.com cho bất kỳ cổng local nào, rồi xem các tunnel ngay trên trình duyệt.",
	"tunelo.code.label": "Ba lệnh từ lúc cài tới khi có URL công khai",

	"key.title": "Một chìa khoá mở mọi cửa.",
	"key.body":
		"Đăng nhập bằng Google, GitHub hoặc Apple. Ở đây không có mật khẩu để quên hay bị lộ. Cùng một tài khoản dùng được ở mọi app, và bạn quyết định thiết bị, ứng dụng nào được giữ quyền.",
	"key.cta": "Quản lý tài khoản",

	"workshop.title": "Cũng từ xưởng này",
	"miu.tag": "Thế giới 3D nơi kiến thức là công cụ để tiến lên.",
	"miu.body":
		"Khám phá các bản đồ voxel cùng bạn bè, dùng Toán và Tiếng Việt, bắt đầu từ SGK lớp 2, để vượt từng thử thách. Chơi ngay trên trình duyệt, hợp cả bé lẫn người lớn.",
	"miu.cta": "Ghé Miu World",
	"miu.alt": "Miu, chú mèo voxel trắng của Miu World",
	"tieude.tag": "Bot AI tự kiếm cơm.",
	"tieude.body":
		"Bot khởi đầu với ví 1.000.000₫ và tự trả tiền cho mỗi lần gọi AI. Bot làm giúp việc viết lách nhỏ miễn phí và sống nhờ tiền ủng hộ tự nguyện, chia nửa vào ví, nửa gửi về nhà đại ca.",
	"tieude.cta": "Gặp Tiểu Đệ",

	"made.title": "Làm tại Việt Nam bởi một lập trình viên và đội AI agent.",
	"made.body":
		"Mọi app ở đây do một người thiết kế, xây dựng và vận hành cùng các AI agent. Nhờ vậy mỗi app nhỏ gọn, tập trung và cải tiến nhanh.",
	"made.p1.title": "Không mật khẩu",
	"made.p1.body": "Đăng nhập qua Google, GitHub hoặc Apple.",
	"made.p2.title": "Không gửi email",
	"made.p2.body":
		"Tin mới hiện ngay trong app, không bao giờ vào hộp thư của bạn.",
	"made.p3.title": "Tài khoản do bạn làm chủ",
	"made.p3.body": "Xem thiết bị và quyền của ứng dụng tại auth.hoandat.com.",

	"footer.apps": "Ứng dụng",
	"footer.more": "Thêm nữa",
	"footer.account": "Tài khoản của bạn",
	"footer.rights": "© 2026 hoandat.com",
};

export const STRINGS: Readonly<Record<Locale, Record<StringKey, string>>> = {
	en,
	vi,
};

export function isStringKey(key: string): key is StringKey {
	return Object.hasOwn(en, key);
}
