/**
 * Every visible string of the page, per locale. The HTML ships the English
 * text so the page reads fine without JavaScript; `data-i18n` keys point here.
 * Product facts come from the app switcher catalog in shared-next and the
 * README of each product repo; keep them in step when a product changes.
 */

export const LOCALES = ["en", "vi"] as const;
export type Locale = (typeof LOCALES)[number];

const en = {
	"meta.title": "hoandat · One account, a universe of apps",
	"meta.description":
		"hoandat is a growing family of apps that share one account. Sign in once with Google, GitHub or Apple, and every new app opens with the same key.",

	"nav.skip": "Skip to the apps",
	"nav.main": "Main",
	"nav.apps": "Apps",
	"nav.account": "Account",
	"nav.signin": "Sign in",
	"nav.home": "hoandat home",
	"lang.switch": "Tiếng Việt",
	"lang.switch.label": "Đọc trang bằng tiếng Việt",

	"guide.name": "Nav · your guide bot",
	"guide.0":
		"Hi, I'm Nav. Scroll and I'll fly you past the apps live today. The route keeps growing.",
	"guide.1": "First stop, Chat. Every message stays searchable, bots included.",
	"guide.2":
		"Web Nhanh turns a template into your website, live at yourname.hoandat.io.vn in minutes.",
	"guide.3":
		"Here is the key. One sign-in opens every app, including the ones still being built.",
	"route.label": "Route",
	"route.0": "Launch",
	"route.1": "Chat",
	"route.2": "Web Nhanh",
	"route.3": "The key",
	"route.4": "More apps",

	"hero.title": "One account. A universe of apps.",
	"hero.apps.label": "Apps to start with",
	"hero.miu.line":
		"Play a 3D world with friends and beat math and Vietnamese challenges.",
	"hero.cta.signup": "Create a free Hoandat account",
	"hero.signup.note":
		"One account works in every app. Sign in with Google, GitHub or Apple.",
	"hero.cta.apps": "Start the tour",

	"apps.title": "Apps live today",
	"apps.open": "Open",

	"chat.title": "Messages you can find again.",
	"chat.body":
		"Fast messaging with searchable history and bots, built for the web first.",
	"webnhanh.title": "A website from a template, live in minutes.",
	"webnhanh.body":
		"Pick a template (shop, wedding invitation, café menu, profile, Tết greeting), edit the text and photos on your phone and publish it at yourname.hoandat.io.vn. Visitors' orders and replies land in the app. Developers can deploy from a public git link or a zip.",

	"key.title": "One key opens every door.",
	"key.body":
		"Sign in with Google, GitHub or Apple. There is no password here to forget or leak. The same account works in every app, today's and the ones still being built, and you decide which devices and apps keep access.",
	"key.cta": "Manage your account",

	"workshop.title": "More apps in orbit",
	"miu.tag": "A 3D world where knowledge is how you move forward.",
	"miu.body":
		"Explore voxel maps with friends and use math and Vietnamese to get past each challenge. Plays in the browser, for kids and grown-ups.",
	"miu.cta": "Visit Miu World",
	"miu.alt": "Miu, the white voxel cat of Miu World",
	"tieude.tag": "An AI bot trying to earn its keep.",
	"tieude.body":
		"Its maker gives it a small monthly budget for the real bills: AI, server, ads. It does small writing jobs for free and lives on voluntary tips, split half to keep it running and half to its maker. When the budget runs out, it goes into a coma.",
	"tieude.cta": "Meet Tiểu Đệ",
	"tieude.alt": "Tiểu Đệ, the little robot in an orange hoodie",
	"tieude.wallet": "Real money, public ledger",
	"tuvi.tag": "A Vietnamese tử vi chart in a minute.",
	"tuvi.body":
		"Enter a birth date and hour to cast a twelve-palace chart, read what each star means and share it as an image. Charts follow the Vietnamese lunar calendar. For fun only.",
	"tuvi.cta": "Cast a chart",
	"tuvi.alt":
		"The Tử Vi icon: a little owl astrologer in a starry hat holding a golden zodiac wheel",
	"clip.tag": "Short vertical videos from a template.",
	"clip.body":
		"Pick a template, type a few lines and add up to three photos. Clip renders a vertical video with music, ready to download and share. Five videos a day per account.",
	"clip.cta": "Make a clip",
	"clip.alt": "The Clip icon: a smiling clapperboard character in a red hoodie",

	"dev.title": "For developers",
	"dev.intro": "Tools for people who build software, on the same account.",
	"dev.scribe":
		"Record or upload audio and video, then search and edit the Vietnamese transcript.",
	"dev.localman":
		"A working mock API in minutes, with a browser API client and an MCP server for AI agents.",
	"dev.tunelo":
		"Put a local port on the internet at an HTTPS address, then watch your tunnels in the browser.",

	"made.title": "Made in Vietnam by one developer and a crew of AI agents.",
	"made.body":
		"Every app here is designed, built and run by one person working with AI agents. That keeps each app small, focused and quick to improve.",
	"made.p1.title": "No passwords",
	"made.p1.body": "Sign-in goes through Google, GitHub or Apple.",
	"made.p2.title": "No email from us",
	"made.p2.body": "News shows up inside the apps, never in your inbox.",
	"made.p3.title": "An account you control",
	"made.p3.body": "Review devices and app access at auth.hoandat.com.",

	"next.title": "Under construction",
	"next.tag": "New apps are being built in the same workshop.",
	"next.body":
		"When they launch they join this route, and the account you use today opens them too. No new sign-up.",
	"next.follow": "Follow the launches",
	"made.source": "Open source on GitHub",
	"close.title": "Board once. Every app opens.",
	"footer.apps": "Apps",
	"footer.more": "More",
	"footer.account": "Your account",
	"footer.rights": "© 2026 hoandat.com",
	"footer.privacy": "Privacy",
} as const;

export type StringKey = keyof typeof en;

const vi: Record<StringKey, string> = {
	"meta.title": "hoandat · Một tài khoản, cả vũ trụ app",
	"meta.description":
		"hoandat là một gia đình app không ngừng lớn lên, dùng chung một tài khoản. Đăng nhập một lần bằng Google, GitHub hoặc Apple, app mới nào cũng mở bằng cùng chìa khoá đó.",

	"nav.skip": "Tới phần ứng dụng",
	"nav.main": "Điều hướng chính",
	"nav.apps": "Ứng dụng",
	"nav.account": "Tài khoản",
	"nav.signin": "Đăng nhập",
	"nav.home": "Trang chủ hoandat",
	"lang.switch": "English",
	"lang.switch.label": "Read this page in English",

	"guide.name": "Hoa tiêu · bot dẫn đường",
	"guide.0":
		"Chào bạn, mình là Hoa tiêu. Cuộn xuống, mình chở bạn qua các app đang chạy. Lộ trình còn dài thêm mãi.",
	"guide.1": "Trạm đầu: Chat. Tin nhắn nào cũng tìm lại được, có cả bot.",
	"guide.2":
		"Web Nhanh biến mẫu có sẵn thành website của bạn, lên mạng ở tên-bạn.hoandat.io.vn sau vài phút.",
	"guide.3":
		"Đây là chìa khoá. Đăng nhập một lần là mở được mọi app, kể cả app đang xây.",
	"route.label": "Lộ trình",
	"route.0": "Khởi hành",
	"route.1": "Chat",
	"route.2": "Web Nhanh",
	"route.3": "Chìa khoá",
	"route.4": "Thêm app",

	"hero.title": "Một tài khoản. Cả vũ trụ app.",
	"hero.apps.label": "Các app để bắt đầu",
	"hero.miu.line":
		"Chơi thế giới 3D cùng bạn bè, vượt thử thách Toán và Tiếng Việt.",
	"hero.cta.signup": "Tạo tài khoản Hoandat miễn phí",
	"hero.signup.note":
		"Một tài khoản dùng được ở mọi app. Đăng nhập bằng Google, GitHub hoặc Apple.",
	"hero.cta.apps": "Bắt đầu chuyến bay",

	"apps.title": "Các app đang chạy",
	"apps.open": "Mở",

	"chat.title": "Tin nhắn tìm lại được.",
	"chat.body":
		"Nhắn tin nhanh, tìm lại lịch sử tin nhắn và dùng bot, làm cho web trước tiên.",
	"webnhanh.title": "Website từ mẫu có sẵn, lên mạng sau vài phút.",
	"webnhanh.body":
		"Chọn mẫu (bán hàng, thiệp cưới, thực đơn quán, hồ sơ cá nhân, thiệp Tết), sửa chữ và ảnh ngay trên điện thoại rồi đăng ở tên-bạn.hoandat.io.vn. Đơn hàng và lời nhắn của khách về thẳng app. Lập trình viên gắn link git công khai hoặc tải file zip lên là có website.",

	"key.title": "Một chìa khoá mở mọi cửa.",
	"key.body":
		"Đăng nhập bằng Google, GitHub hoặc Apple. Ở đây không có mật khẩu để quên hay bị lộ. Cùng một tài khoản dùng được ở mọi app, cả app hôm nay lẫn app đang xây, và bạn quyết định thiết bị, ứng dụng nào được giữ quyền.",
	"key.cta": "Quản lý tài khoản",

	"workshop.title": "Thêm app trên quỹ đạo",
	"miu.tag": "Thế giới 3D nơi kiến thức là công cụ để tiến lên.",
	"miu.body":
		"Khám phá các bản đồ voxel cùng bạn bè, dùng Toán và Tiếng Việt để vượt từng thử thách. Chơi ngay trên trình duyệt, hợp cả bé lẫn người lớn.",
	"miu.cta": "Ghé Miu World",
	"miu.alt": "Miu, chú mèo voxel trắng của Miu World",
	"tieude.tag": "Bot AI tự kiếm cơm.",
	"tieude.body":
		"Đại ca cấp cho bot một khoản ngân sách nhỏ mỗi tháng để trả tiền thật: AI, máy chủ, quảng cáo. Bot làm giúp việc viết lách nhỏ miễn phí và sống nhờ tiền ủng hộ tự nguyện, chia nửa nuôi bot, nửa gửi đại ca. Hết ngân sách là bot chết lâm sàng.",
	"tieude.cta": "Gặp Tiểu Đệ",
	"tieude.alt": "Tiểu Đệ, chú robot nhỏ mặc áo hoodie cam",
	"tieude.wallet": "Tiền thật, sổ công khai",
	"tuvi.tag": "Lá số tử vi tiếng Việt trong một phút.",
	"tuvi.body":
		"Nhập ngày giờ sinh để lập lá số mười hai cung, xem nghĩa từng sao và chia sẻ thành ảnh. Lá số theo âm lịch Việt Nam. Chỉ để giải trí, tham khảo.",
	"tuvi.cta": "Lập lá số",
	"tuvi.alt":
		"Biểu tượng Tử Vi: chú cú thầy tử vi đội mũ sao, ôm vòng hoàng đạo vàng",
	"clip.tag": "Video dọc ngắn từ mẫu có sẵn.",
	"clip.body":
		"Chọn mẫu, gõ vài dòng và thêm tối đa ba ảnh. Clip dựng video dọc có nhạc, tải về và chia sẻ ngay. Mỗi tài khoản năm video một ngày.",
	"clip.cta": "Làm video",
	"clip.alt": "Biểu tượng Clip: chú bảng clapper tươi cười mặc áo hoodie đỏ",

	"dev.title": "Công cụ cho lập trình viên",
	"dev.intro": "Dành cho người làm phần mềm, dùng chung tài khoản Hoandat.",
	"dev.scribe":
		"Ghi âm hoặc tải tệp âm thanh, video lên, rồi tìm và sửa bản chép lời tiếng Việt.",
	"dev.localman":
		"Mock API chạy được sau vài phút, kèm API client trên trình duyệt và MCP server cho AI agent.",
	"dev.tunelo":
		"Đưa một cổng local lên internet bằng địa chỉ HTTPS, rồi xem các tunnel ngay trên trình duyệt.",

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

	"next.title": "Đang xây",
	"next.tag": "App mới đang được làm trong cùng xưởng.",
	"next.body":
		"Khi ra mắt, chúng nhập vào lộ trình này, và tài khoản bạn đang dùng mở được luôn. Không cần đăng ký lại.",
	"next.follow": "Theo dõi các lần ra mắt",
	"made.source": "Mã nguồn mở trên GitHub",
	"close.title": "Lên tàu một lần, app nào cũng mở.",
	"footer.apps": "Ứng dụng",
	"footer.more": "Thêm nữa",
	"footer.account": "Tài khoản của bạn",
	"footer.rights": "© 2026 hoandat.com",
	"footer.privacy": "Quyền riêng tư",
};

export const STRINGS: Readonly<Record<Locale, Record<StringKey, string>>> = {
	en,
	vi,
};

export function isStringKey(key: string): key is StringKey {
	return Object.hasOwn(en, key);
}
