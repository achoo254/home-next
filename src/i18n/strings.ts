/**
 * Every visible string of the page, per locale. The HTML ships the English
 * text so the page reads fine without JavaScript; `data-i18n` keys point here.
 * Product facts come from the app switcher catalog in shared-next and the
 * README of each product repo; keep them in step when a product changes.
 */

export const LOCALES = ["en", "vi", "zh-CN"] as const;
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

	"guide.name": "Nav · your guide bot",
	"guide.0":
		"Hi, I'm Nav. Scroll and I'll fly you past the apps live today. The route keeps growing.",
	"guide.1": "First stop, Chat. Every message stays searchable, bots included.",
	"guide.2":
		"Knowledge Base keeps texts on infrastructure and software engineering in English and Vietnamese. Read it, search it or ask AI.",
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
		"It covers infrastructure and software engineering, laid out as one universe you can read, search and ask AI.",
	"webnhanh.title": "A website from a template, live in minutes.",
	"webnhanh.body":
		"Pick a template (shop, wedding invitation, café menu, profile, Tết greeting), edit the text and photos on your phone and publish it at yourname.hoandat.io.vn. Visitors' orders and replies land in the app. You can also deploy from a public git link or a zip.",

	"key.title": "One key opens every door.",
	"key.body":
		"Sign in with Google, GitHub or Apple. There is no password here to forget or leak. The same account works in every app, today's and the ones still being built, and you decide which devices and apps keep access.",
	"key.cta": "Manage your account",

	"workshop.title": "More apps in orbit",
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
	"group.learn.intro": "Look things up in seconds.",
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
	"group.app.chuanho":
		"Tap the wooden bell, light incense, ease up on harsh words. A calmer head, just for fun.",
	"group.app.kb":
		"Bilingual articles on infrastructure and software engineering to read, search and ask AI.",

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

	"guide.name": "Hoa tiêu · bot dẫn đường",
	"guide.0":
		"Chào bạn, mình là Hoa tiêu. Cuộn xuống, mình chở bạn qua các app đang chạy. Lộ trình còn dài thêm mãi.",
	"guide.1": "Trạm đầu: Chat. Tin nhắn nào cũng tìm lại được, có cả bot.",
	"guide.2":
		"Knowledge Base giữ kiến thức song ngữ Anh – Việt về hạ tầng và kỹ thuật phần mềm. Đọc, tìm hay hỏi AI đều được.",
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
		"Hạ tầng và kỹ thuật phần mềm, xếp thành một vũ trụ để bạn đọc, tìm và hỏi AI.",
	"webnhanh.title": "Website từ mẫu có sẵn, lên mạng sau vài phút.",
	"webnhanh.body":
		"Chọn mẫu (bán hàng, thiệp cưới, thực đơn quán, hồ sơ cá nhân, thiệp Tết), sửa chữ và ảnh ngay trên điện thoại rồi đăng ở tên-bạn.hoandat.io.vn. Đơn hàng và lời nhắn của khách về thẳng app. Bạn cũng có thể gắn link git công khai hoặc tải file zip lên là có website.",

	"key.title": "Một chìa khoá mở mọi cửa.",
	"key.body":
		"Đăng nhập bằng Google, GitHub hoặc Apple. Ở đây không có mật khẩu để quên hay bị lộ. Cùng một tài khoản dùng được ở mọi app, cả app hôm nay lẫn app đang xây, và bạn quyết định thiết bị, ứng dụng nào được giữ quyền.",
	"key.cta": "Quản lý tài khoản",

	"workshop.title": "Thêm app trên quỹ đạo",
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
	"group.learn.intro": "Tra cứu là có.",
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
	"group.app.chuanho":
		"Gõ mõ, thắp hương, bớt khẩu nghiệp. Chơi cho tâm bớt lag.",
	"group.app.kb":
		"Kho tri thức song ngữ về hạ tầng và kỹ thuật phần mềm để đọc, tìm và hỏi AI.",

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

/** Simplified Chinese. Product names stay as they are written everywhere else. */
const zhCN: Record<StringKey, string> = {
	"meta.title": "hoandat · 一个账号，一整个应用宇宙",
	"meta.description":
		"hoandat 是一个不断壮大的应用家族，所有应用共用一个账号。用 Google、GitHub 或 Apple 登录一次，之后每个新应用都能用同一把钥匙打开。",

	"nav.skip": "跳到应用",
	"nav.main": "主导航",
	"nav.apps": "应用",
	"nav.account": "账号",
	"nav.signin": "登录",
	"nav.home": "hoandat 首页",

	"guide.name": "Nav · 你的向导机器人",
	"guide.0":
		"你好，我是 Nav。向下滚动，我带你飞过现在已上线的应用。航线还在不断延长。",
	"guide.1": "第一站：Chat。每条消息都能再搜到，机器人的也一样。",
	"guide.2":
		"Knowledge Base 收录英语和越南语的基础设施与软件工程文章。可以阅读、搜索，也可以问 AI。",
	"guide.3":
		"Web Nhanh 把模板变成你的网站，几分钟就能在 yourname.hoandat.io.vn 上线。",
	"guide.4": "这就是钥匙。登录一次就能打开所有应用，包括还在开发中的。",
	"route.label": "航线",
	"route.0": "出发",
	"route.1": "Chat",
	"route.2": "Knowledge Base",
	"route.3": "Web Nhanh",
	"route.4": "钥匙",
	"route.5": "更多应用",

	"hero.title": "一个账号，一整个应用宇宙。",
	"hero.apps.label": "从这些应用开始",
	"hero.cta.signup": "免费创建 Hoandat 账号",
	"hero.signup.note":
		"一个账号通用于所有应用。用 Google、GitHub 或 Apple 登录。",
	"hero.cta.apps": "开始旅程",

	"apps.title": "已上线的应用",
	"apps.open": "打开",

	"chat.title": "找得回来的消息。",
	"chat.body": "快速聊天，历史消息可搜索，还有机器人，为网页优先打造。",
	"kb.title": "值得了解的知识，英语和越南语双语。",
	"kb.body":
		"涵盖基础设施和软件工程，排成一个宇宙，你可以阅读、搜索，也可以问 AI。",
	"webnhanh.title": "用模板做网站，几分钟上线。",
	"webnhanh.body":
		"选一个模板（网店、婚礼请柬、咖啡馆菜单、个人简介、春节贺卡），在手机上修改文字和照片，然后发布到 yourname.hoandat.io.vn。访客的订单和留言直接进入应用。你也可以通过公开的 git 链接或 zip 文件部署。",

	"key.title": "一把钥匙，打开每一扇门。",
	"key.body":
		"用 Google、GitHub 或 Apple 登录。这里没有会忘记或泄露的密码。同一个账号适用于所有应用，包括现在的和还在开发中的，由你决定哪些设备和应用保留访问权限。",
	"key.cta": "管理你的账号",

	"workshop.title": "轨道上的更多应用",
	"tieude.tag": "免费帮你完成小型写作任务。",
	"tieude.body": "一个 AI 机器人，直接在浏览器里免费帮你完成小型写作任务。",
	"tieude.cta": "认识 Tiểu Đệ",
	"tieude.alt": "Tiểu Đệ，穿橙色连帽衫的小机器人",
	"tuvi.tag": "一分钟排出越南紫微命盘。",
	"tuvi.body":
		"输入出生日期和时辰，排出十二宫命盘，查看每颗星的含义，并分享为图片。命盘按越南农历推算。仅供娱乐。",
	"tuvi.cta": "排命盘",
	"tuvi.alt": "Tử Vi 图标：戴星星帽、抱着金色星盘的小猫头鹰占星师",
	"clip.tag": "用模板制作竖屏短视频。",
	"clip.body":
		"选一个模板，输入几行字，最多添加三张照片。Clip 会生成带音乐的竖屏视频，可直接下载和分享。每个账号每天五个视频。",
	"clip.cta": "制作视频",
	"clip.alt": "Clip 图标：穿红色连帽衫、面带笑容的场记板角色",
	"chuanho.tag": "敲木鱼、上香，少说狠话。",
	"chuanho.body":
		"跟着节拍敲木鱼、上香，记下今天说过的狠话，再听听 Lofi Chùa Nhỏ。每天静几分钟，图个开心。",
	"chuanho.cta": "敲木鱼",
	"chuanho.alt": "Chùa Nhỏ 图标：深紫色底上，一只奶油色圆木鱼和木槌",

	"group.tools.title": "工具",
	"group.tools.intro": "每天更快把事做完。",
	"group.fun.title": "娱乐",
	"group.fun.intro": "纯粹图个开心。",
	"group.learn.title": "学习",
	"group.learn.intro": "几秒就能查到。",
	"group.app.webnhanh": "用模板做网站，发布在专属地址。",
	"group.app.chat": "快速聊天，历史消息可搜索，还有机器人。",
	"group.app.tieude": "免费帮你完成小型写作任务的 AI 机器人。",
	"group.app.scribe": "录音并转成可搜索、可编辑的文字稿。",
	"group.app.localman": "浏览器里的 Mock API 和 API 客户端。",
	"group.app.tunelo": "在浏览器里管理你的隧道。",
	"group.app.tuvi": "十二宫命盘，外加每日一签，图个开心。",
	"group.app.clip": "用模板制作竖屏短视频。",
	"group.app.chuanho": "敲木鱼、上香，少说狠话。让心静一静，图个开心。",
	"group.app.kb": "基础设施和软件工程的双语文章，可阅读、搜索，也可以问 AI。",

	"made.title": "越南制造，由一个人和一支 AI 智能体团队打造。",
	"made.body":
		"这里的每个应用都由一个人和 AI 智能体一起设计、开发和运营。所以每个应用都小巧、专注，改进得很快。",
	"made.p1.title": "没有密码",
	"made.p1.body": "通过 Google、GitHub 或 Apple 登录。",
	"made.p2.title": "我们不发邮件",
	"made.p2.body": "新消息只在应用内显示，绝不会进入你的收件箱。",
	"made.p3.title": "账号由你掌控",
	"made.p3.body": "在 auth.hoandat.com 查看设备和应用权限。",

	"next.title": "建设中",
	"next.tag": "新应用正在同一个工坊里打造。",
	"next.body":
		"上线后，它们会加入这条航线，你现在用的账号也能直接打开。无需重新注册。",
	"next.follow": "关注上线动态",
	"made.source": "在 GitHub 上开源",
	"close.title": "登船一次，每个应用都能打开。",
	"footer.account": "你的账号",
	"footer.rights": "© 2026 hoandat.com",
	"footer.privacy": "隐私",
};

export const STRINGS: Readonly<Record<Locale, Record<StringKey, string>>> = {
	en,
	vi,
	"zh-CN": zhCN,
};

export function isStringKey(key: string): key is StringKey {
	return Object.hasOwn(en, key);
}
