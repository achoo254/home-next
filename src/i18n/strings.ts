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
		"Knowledge Base keeps texts on all kinds of topics in English and Vietnamese. Read it, search it or ask AI.",
	"guide.3":
		"Web Nhanh turns a template into your website, live at yourname.hoandat.io.vn in minutes.",
	"guide.4":
		"Here is the key. One sign-in opens every app, including the ones still being built.",
	"route.label": "Route",
	"route.0": "Launch",
	"route.1": "Chat",
	"route.2": "Knowledge Base",
	"route.3": "Web Nhanh",
	"route.4": "The key",
	"route.5": "More apps",

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
	"kb.title": "Everything worth knowing, in English and Vietnamese.",
	"kb.body":
		"It covers all kinds of topics, laid out as one universe you can read, search and ask AI.",
	"webnhanh.title": "A website from a template, live in minutes.",
	"webnhanh.body":
		"Pick a template (shop, wedding invitation, café menu, profile, Tết greeting), edit the text and photos on your phone and publish it at yourname.hoandat.io.vn. Visitors' orders and replies land in the app. You can also deploy from a public git link or a zip.",

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
	"tieude.tag": "Free help with small writing jobs.",
	"tieude.body":
		"An AI bot that does small writing jobs for you for free, right in the browser.",
	"tieude.cta": "Meet Tiểu Đệ",
	"tieude.alt": "Tiểu Đệ, the little robot in an orange hoodie",
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
	"lockin.tag": "Lock in plans through one link.",
	"lockin.body":
		"Lock in plans with friends or coworkers through one link. Everyone votes on time and place, no account needed.",
	"lockin.cta": "Make a plan",
	"lockin.alt":
		"The Lockin icon: a red padlock with a white check mark, shaped like a map pin, on a lime tile",
	"chuanho.tag": "Tap the wooden bell, light incense, ease up on harsh words.",
	"chuanho.body":
		"Tap the wooden bell to the beat, light incense, check in on your harsh words for the day and listen to Lofi Chùa Nhỏ. A few calm minutes a day, just for fun.",
	"chuanho.cta": "Tap the bell",
	"chuanho.alt":
		"The Chùa Nhỏ icon: a round cream wooden bell with a mallet on a deep purple tile",

	"group.tools.title": "Tools",
	"group.tools.intro": "Get things done faster, every day.",
	"group.fun.title": "Entertainment",
	"group.fun.intro": "Just for fun.",
	"group.learn.title": "Learning",
	"group.learn.intro": "Learn like playing, look things up in seconds.",
	"group.app.webnhanh":
		"A website from a template, published at its own address.",
	"group.app.chat": "Fast messaging with searchable history and bots.",
	"group.app.tieude": "An AI bot that does small writing jobs for free.",
	"group.app.scribe":
		"Record audio and turn it into searchable, editable transcripts.",
	"group.app.localman": "Mock APIs and an API client in your browser.",
	"group.app.tunelo": "Your tunnels in the browser.",
	"group.app.tuvi":
		"Your 12-palace horoscope chart and a fortune stick every day, just for fun.",
	"group.app.clip": "Short vertical videos from a template.",
	"group.app.lockin": "Lock in plans through one link.",
	"group.app.chuanho":
		"Tap the wooden bell, light incense, ease up on harsh words. A calmer head, just for fun.",
	"group.app.miu":
		"A 3D block world to play with friends, with maths and Vietnamese quests.",
	"group.app.kb":
		"Bilingual articles on all kinds of topics to read, search and ask AI.",

	"made.title": "Made in Vietnam by one person and a crew of AI agents.",
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
		"Knowledge Base giữ kiến thức song ngữ Anh – Việt về đủ mọi chủ đề. Đọc, tìm hay hỏi AI đều được.",
	"guide.3":
		"Web Nhanh biến mẫu có sẵn thành website của bạn, lên mạng ở tên-bạn.hoandat.io.vn sau vài phút.",
	"guide.4":
		"Đây là chìa khoá. Đăng nhập một lần là mở được mọi app, kể cả app đang xây.",
	"route.label": "Lộ trình",
	"route.0": "Khởi hành",
	"route.1": "Chat",
	"route.2": "Knowledge Base",
	"route.3": "Web Nhanh",
	"route.4": "Chìa khoá",
	"route.5": "Thêm app",

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
	"kb.title": "Kho tri thức song ngữ Anh – Việt.",
	"kb.body":
		"Đủ mọi chủ đề, từ công việc tới đời sống, xếp thành một vũ trụ để bạn đọc, tìm và hỏi AI.",
	"webnhanh.title": "Website từ mẫu có sẵn, lên mạng sau vài phút.",
	"webnhanh.body":
		"Chọn mẫu (bán hàng, thiệp cưới, thực đơn quán, hồ sơ cá nhân, thiệp Tết), sửa chữ và ảnh ngay trên điện thoại rồi đăng ở tên-bạn.hoandat.io.vn. Đơn hàng và lời nhắn của khách về thẳng app. Bạn cũng có thể gắn link git công khai hoặc tải file zip lên là có website.",

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
	"tieude.tag": "Viết giúp việc nhỏ, miễn phí.",
	"tieude.body":
		"Bot AI làm giúp bạn các việc viết lách nhỏ, miễn phí, ngay trên trình duyệt.",
	"tieude.cta": "Gặp Tiểu Đệ",
	"tieude.alt": "Tiểu Đệ, chú robot nhỏ mặc áo hoodie cam",
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
	"lockin.tag": "Chốt kèo bằng một link.",
	"lockin.body":
		"Chốt kèo với bạn bè hay đồng nghiệp bằng một link. Mọi người vote giờ và chỗ, không cần tài khoản.",
	"lockin.cta": "Chốt kèo",
	"lockin.alt":
		"Biểu tượng Lockin: ổ khoá đỏ hình ghim bản đồ mang dấu tích trắng trên nền xanh chanh",
	"chuanho.tag": "Gõ mõ, thắp hương, bớt khẩu nghiệp.",
	"chuanho.body":
		"Gõ mõ theo nhịp, thắp hương, check-in khẩu nghiệp và nghe Lofi Chùa Nhỏ. Vài phút mỗi ngày cho tâm bớt lag, chơi cho vui.",
	"chuanho.cta": "Gõ mõ",
	"chuanho.alt":
		"Biểu tượng Chùa Nhỏ: chiếc mõ tròn màu kem cùng dùi gõ trên nền tím đậm",

	"group.tools.title": "Công cụ",
	"group.tools.intro": "Làm việc nhanh hơn mỗi ngày.",
	"group.fun.title": "Giải trí",
	"group.fun.intro": "Chơi cho vui, xem cho đã.",
	"group.learn.title": "Học tập",
	"group.learn.intro": "Học mà như chơi, tra cứu là có.",
	"group.app.webnhanh":
		"Làm website từ mẫu có sẵn và đăng ngay ở địa chỉ riêng.",
	"group.app.chat": "Nhắn tin nhanh, tìm lại lịch sử tin nhắn và dùng bot.",
	"group.app.tieude": "Bot AI làm giúp miễn phí các việc viết nhỏ.",
	"group.app.scribe":
		"Ghi âm và chuyển thành bản chép lời để tìm kiếm, chỉnh sửa.",
	"group.app.localman": "Mock API và API client ngay trên trình duyệt.",
	"group.app.tunelo": "Tunnel của bạn trên trình duyệt.",
	"group.app.tuvi": "Lập lá số 12 cung và xin quẻ mỗi ngày, xem cho vui.",
	"group.app.clip": "Video dọc ngắn làm từ mẫu có sẵn.",
	"group.app.lockin": "Chốt kèo bằng một link.",
	"group.app.chuanho":
		"Gõ mõ, thắp hương, bớt khẩu nghiệp. Chơi cho tâm bớt lag.",
	"group.app.miu":
		"Thế giới khối 3D chơi cùng bạn bè, vượt thử thách Toán và Tiếng Việt.",
	"group.app.kb":
		"Kho tri thức song ngữ về đủ mọi chủ đề để đọc, tìm và hỏi AI.",

	"made.title": "Làm tại Việt Nam bởi một người và đội AI agent.",
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
