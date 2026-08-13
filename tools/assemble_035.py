"""
Build issue-035.json - Part 1: structure + cover + brief1 + brief2
"""
import json

def read_body(filename):
    with open(f'tools/bodies/{filename}', 'r', encoding='utf-8') as f:
        return f.read().strip()

def build_issue():
    issue = {
        "issue": {
            "number": "035",
            "date": "2026-08-13",
            "date_display": "2026.08.13"
        },
        "cover": build_cover(),
        "briefs": [build_brief1(), build_brief2(), build_brief3(), 
                   build_brief4(), build_brief5(), build_brief6()],
        "cao": build_cao()
    }
    return issue

def build_cover():
    return {
        "slug": "deepseek-v4-pro-agent-benchmark-5x",
        "title": "DeepSeek V4 Pro深夜换芯：Agent跑分翻5倍，模型战争从谁更聪明转向谁更能干活",
        "title_en": "DeepSeek V4 Pro Midnight Upgrade: Agent Benchmarks 5x Jump, the Model War Shifts from Who's Smarter to Who Gets Work Done",
        "title_short": "DeepSeek深夜换芯Agent跑分翻5倍",
        "title_short_en": "DeepSeek V4 Pro Agent Scores Jump 5x",
        "title_break": "DeepSeek V4-Pro-0813静默上线<br>Agent跑分翻近5倍模型战争转向",
        "title_break_en": "DeepSeek V4-Pro-0813 Launches Quietly<br>Agent Scores 5x, Model War Pivots",
        "deck": "8月13日凌晨，DeepSeek V4-Pro-0813静默上线，DeepSWE跑分从12.8飙升至62.7翻近5倍，Terminal Bench 87.9直逼Kimi-K3的88.3。模型名没变，里子换了一代——大模型竞争从比推理，正式转向比Agent干活能力。",
        "deck_en": "In the early hours of August 13, DeepSeek V4-Pro-0813 went live silently. DeepSWE score skyrocketed from 12.8 to 62.7 - nearly 5x. Terminal Bench hit 87.9, nipping at Kimi-K3's 88.3. Same model name, new guts - the LLM race officially pivots from reasoning benchmarks to Agent productivity.",
        "category": "AI 编程 · 工具竞争",
        "category_en": "AI Coding · Tools",
        "tags": ["DeepSeek", "V4 Pro", "Agent能力", "大模型", "基准测试", "AI编程"],
        "tags_en": ["DeepSeek", "V4 Pro", "Agent Capability", "LLM", "Benchmark", "AI Coding"],
        "keywords": "Dawn Vision,DeepSeek,V4 Pro,Agent,大模型,DeepSWE,Terminal Bench,基准测试,AI编程,0813",
        "keywords_en": "Dawn Vision, DeepSeek, V4 Pro, Agent, LLM, DeepSWE, Terminal Bench, benchmark, AI coding, 0813",
        "og_description": "DeepSeek V4 Pro深夜静默升级，Agent类跑分全面翻近5倍。模型名没变，能力换了一代。大模型竞争从'谁更聪明'的推理竞赛，转向'谁更能干活'的Agent实战。",
        "og_description_en": "DeepSeek V4 Pro silently upgrades overnight, Agent benchmarks nearly 5x. Same model name, a generation leap in capability. The LLM race shifts from reasoning contests to Agent reality.",
        "twitter_description": "没有发布会，没有PPT，一张跑分图——DeepSeek V4 Pro深夜换芯，Agent能力翻近5倍。模型战争的战场，从推理题换成了干活能力。",
        "twitter_description_en": "No launch event, no slides, one benchmark chart - DeepSeek V4 Pro swaps cores overnight, Agent capability jumps nearly 5x. The model war's battlefield moves from reasoning to getting things done.",
        "read_time": "约 10 分钟阅读",
        "read_time_en": "~10 min read",
        "word_count": 2500,
        "sources": [
            {"text": "DeepSeek官方API文档 - V4-Pro-0813模型更新", "url": "https://www.deepseek.com/"},
            {"text": "今日头条 - 为什么DeepSeek V4 PRO选在深夜更新", "url": "http://m.toutiao.com/group/7673188364321702438/"},
            {"text": "cnBeta - DeepSeek推出V4-Pro-0813模型", "url": "https://www.cnbeta.com.tw/articles/tech/1572966.htm"},
            {"text": "ReadHub - DeepSeek V4 Pro 正式上线", "url": "https://readhub.cn/topic/8vXYr7sQRSr"}
        ],
        "body_html": read_body('cover_cn.txt'),
        "body_html_en": read_body('cover_en.txt')
    }

def build_brief1():
    return {
        "slug": "grok-4-6-musk-ai-revenue-surpasses-spacex",
        "category": "大模型 · 商业分析",
        "category_en": "LLM · Business",
        "title": "Grok 4.6发布：马斯克称AI收入下月将超越SpaceX所有其他业务",
        "title_en": "Grok 4.6 Launches: Musk Says AI Revenue Will Surpass All Other SpaceX Businesses Next Month",
        "title_short": "马斯克称AI收入下月超全部其他业务",
        "title_short_en": "Musk: AI Revenue Surpasses All Next Month",
        "title_break": "Grok 4.6强化长时Agent能力<br>马斯克称AI收入下月全面反超",
        "title_break_en": "Grok 4.6 Boosts Long-Running Agents<br>Musk Says AI Revenue Surpasses All Next Month",
        "deck": "8月13日SpaceXAI发布Grok 4.6，强化长时运行Agent、编码与视觉工作。马斯克在内部全员会上称，AI收入将于9月超过SpaceX其他所有业务之和，第四季度大幅领先。火箭公司正在变成AI公司。",
        "deck_en": "On August 13, SpaceXAI launched Grok 4.6 with enhanced long-running agents, coding, and visual work. Musk told an all-hands meeting AI revenue will surpass all other SpaceX businesses combined in September, leading decisively in Q4. The rocket company is becoming an AI company.",
        "keywords": "Dawn Vision,Grok 4.6,SpaceX,马斯克,AI收入,xAI,大模型商业,Agent能力",
        "keywords_en": "Dawn Vision, Grok 4.6, SpaceX, Musk, AI revenue, xAI, LLM business, Agent capability",
        "og_description": "Grok 4.6发布，强化长时Agent与编码能力。马斯克称AI收入9月将超过SpaceX其他所有业务之和。火箭公司的第二增长曲线，正在变成主营业务。",
        "og_description_en": "Grok 4.6 launches with stronger long-running agents and coding. Musk says AI revenue surpasses all other SpaceX businesses in September. The rocket company's second curve is becoming the main business.",
        "read_time": "约 5 分钟阅读",
        "read_time_en": "~5 min read",
        "word_count": 800,
        "sources": [
            {"text": "xAI官方 - Grok 4.6发布公告", "url": "https://x.ai/"},
            {"text": "ReadHub - Grok 4.6正式发布", "url": "https://readhub.cn/topic/8vXYtGNybAQ"},
            {"text": "InfoQ AI快讯 - SpaceXAI发布Grok 4.6", "url": "https://www.infoq.cn/aibriefs"}
        ],
        "pull_quote": {
            "text": "火箭是马斯克的梦想，AI是马斯克的生意。当AI收入超过火箭收入的那一刻，SpaceX就不再是一家航天公司了。",
            "text_en": "Rockets are Musk's dream; AI is Musk's business. The day AI revenue exceeds rocket revenue, SpaceX stops being an aerospace company.",
            "attr": "—— 一位科技行业分析师",
            "attr_en": "- A Tech Industry Analyst"
        },
        "cognitive_notes": "Grok 4.6,SpaceX,马斯克,AI收入,xAI,大模型商业",
        "cognitive_notes_en": "Grok 4.6,SpaceX,Musk,AI revenue,xAI,LLM business",
        "source_summary": "本文基于 Dawn Vision 认知引擎处理的 8 个源信号生成，经编辑部人工审核。素材来源：xAI官方公告、ReadHub、InfoQ AI快讯。",
        "source_summary_en": "Generated by the Dawn Vision cognitive engine processing 8 source signals, with human editorial review. Sources: xAI Official Announcement, ReadHub, InfoQ AI Briefs.",
        "body_html": read_body('b1_cn.txt'),
        "body_html_en": read_body('b1_en.txt')
    }

def build_brief2():
    return {
        "slug": "meta-muse-glimmer-30b-open-source-local-agent",
        "category": "AI Agent · 工程实践",
        "category_en": "AI Agent · Engineering",
        "title": "Meta Muse Glimmer 30B开源：消费级显卡跑本地Agent，小扎向闭源AI宣战",
        "title_en": "Meta Muse Glimmer 30B Open Source: Consumer GPU Runs Local Agents, Zuck Declares War on Closed AI",
        "title_short": "Meta开源30B本地Agent模型",
        "title_short_en": "Meta Open Sources 30B Local Agent Model",
        "title_break": "Meta发布30B开源Agent模型<br>24GB显卡即可本地运行",
        "title_break_en": "Meta Launches 30B Open Source Agent Model<br>Runs Locally on 24GB GPU",
        "deck": "8月11日Meta发布300亿参数本地Agent模型Muse Glimmer并开放权重，24GB显存显卡即可运行。扎克伯格发长文呼吁减少美国对开源AI的限制，同时支持芯片出口管制。开源与闭源的战争，进入新阶段。",
        "deck_en": "On August 11, Meta released Muse Glimmer, a 30B-parameter local agent model with open weights, runnable on 24GB GPUs. Zuckerberg published an essay calling for fewer US restrictions on open-source AI while supporting chip export controls. The open vs closed AI war enters a new phase.",
        "keywords": "Dawn Vision,Meta,Muse Glimmer,开源,本地Agent,扎克伯格,Muse Spark,消费级AI",
        "keywords_en": "Dawn Vision, Meta, Muse Glimmer, open source, local agent, Zuckerberg, Muse Spark, consumer AI",
        "og_description": "Meta发布30B开源Agent模型Muse Glimmer，24GB显存即可本地运行。扎克伯格呼吁减少开源AI限制，开源vs闭源路线之争进入新阶段。",
        "og_description_en": "Meta launches 30B open source agent model Muse Glimmer, runs locally on 24GB VRAM. Zuckerberg calls for fewer open-source AI restrictions.",
        "read_time": "约 5 分钟阅读",
        "read_time_en": "~5 min read",
        "word_count": 800,
        "sources": [
            {"text": "Meta官方 - The Future is for Everyone", "url": "https://www.meta.com/thefutureisforeveryone/"},
            {"text": "智东西 - 小扎高调开战闭源AI", "url": "http://m.toutiao.com/group/7636599866783024153/"}
        ],
        "pull_quote": {
            "text": "扎克伯格谈开源的时候，你听的是理想主义；但你看他的商业动作，全是现实主义。开源不是慈善，是护城河。",
            "text_en": "When Zuckerberg talks about open source, you hear idealism. But when you watch his business moves - it's all realism. Open source isn't charity. It's a moat.",
            "attr": "—— 一位AI行业观察者",
            "attr_en": "- An AI Industry Observer"
        },
        "cognitive_notes": "Meta,Muse Glimmer,开源,本地Agent,扎克伯格,30B模型",
        "cognitive_notes_en": "Meta,Muse Glimmer,open source,local agent,Zuckerberg,30B model",
        "source_summary": "本文基于 Dawn Vision 认知引擎处理的 7 个源信号生成，经编辑部人工审核。素材来源：Meta官方长文、智东西。",
        "source_summary_en": "Generated by the Dawn Vision cognitive engine processing 7 source signals, with human editorial review. Sources: Meta Official Essay, Zhidongxi.",
        "body_html": read_body('b2_cn.txt'),
        "body_html_en": read_body('b2_en.txt')
    }

def build_brief3():
    return {
        "slug": "lovable-13-3b-valuation-european-ai-coding",
        "category": "AI 轻创业 · 一人公司",
        "category_en": "AI Solopreneur",
        "title": "Lovable估值133亿美元：欧洲AI编程新星半年翻番，非硅谷也能跑出独角兽",
        "title_en": "Lovable at $13.3B Valuation: European AI Coding Star Doubles in 6 Months - Unicorns Don't Need Silicon Valley",
        "title_short": "Lovable估值133亿半年翻番",
        "title_short_en": "Lovable at $13.3B, Doubles in 6M",
        "title_break": "Lovable估值升至133亿美元<br>欧洲AI编程独角兽半年翻番",
        "title_break_en": "Lovable Valuation Hits $13.3B<br>European AI Coding Unicorn Doubles in 6M",
        "deck": "欧洲AI编程公司Lovable完成C轮融资，估值升至133亿美元，半年前还是66亿。Menlo Ventures和Scaleup Europe领投，十余家机构跟投。AI创业不再只是硅谷的游戏，全球多点开花的时代来了。",
        "deck_en": "European AI coding company Lovable closes Series C at $13.3B valuation - up from $6.6B six months ago. Led by Menlo Ventures and Scaleup Europe Fund. AI startup is no longer just a Silicon Valley game.",
        "keywords": "Dawn Vision,Lovable,AI编程,欧洲创业,估值133亿,独角兽,AI轻创业",
        "keywords_en": "Dawn Vision, Lovable, AI coding, European startup, $13.3B valuation, unicorn, AI solopreneur",
        "og_description": "欧洲AI编程公司Lovable估值升至133亿美元，半年翻番。AI创业不再只有硅谷故事，欧洲、中国、全球各地都在跑出自己的独角兽。",
        "og_description_en": "European AI coding company Lovable hits $13.3B valuation, doubling in 6 months. AI startups aren't just a Silicon Valley story anymore.",
        "read_time": "约 5 分钟阅读",
        "read_time_en": "~5 min read",
        "word_count": 750,
        "sources": [
            {"text": "TechCrunch - Lovable confirms new $13.3B valuation", "url": "https://techcrunch.com/"},
            {"text": "aibase - Lovable估值飙升至133亿美元", "url": "https://news.aibase.cn/news/30312"}
        ],
        "pull_quote": {
            "text": "当欧洲也跑出百亿级AI编程公司的时候，你就知道这场创业潮已经从硅谷的野火，变成了全球的燎原之势。",
            "text_en": "When Europe also produces a $10B+ AI coding company, you know this startup wave has gone from a Silicon Valley wildfire to a global blaze.",
            "attr": "—— 一位全球AI创业投资人",
            "attr_en": "- A Global AI Startup Investor"
        },
        "cognitive_notes": "Lovable,AI编程,欧洲创业,133亿估值,独角兽,轻创业",
        "cognitive_notes_en": "Lovable,AI coding,European startup,$13.3B valuation,unicorn,solopreneur",
        "source_summary": "本文基于 Dawn Vision 认知引擎处理的 6 个源信号生成，经编辑部人工审核。素材来源：TechCrunch、aibase。",
        "source_summary_en": "Generated by the Dawn Vision cognitive engine processing 6 source signals, with human editorial review. Sources: TechCrunch, aibase.",
        "body_html": read_body('b3_cn.txt'),
        "body_html_en": read_body('b3_en.txt')
    }

def build_brief4():
    return {
        "slug": "anthropic-claude-invisible-watermark-eu-ai-act",
        "category": "AI 监管 · 政策伦理",
        "category_en": "AI Regulation · Ethics",
        "title": "Anthropic为Claude加隐形水印：EU AI Act落地，你的AI输出正在被悄悄标记",
        "title_en": "Anthropic Adds Invisible Watermarks to Claude: EU AI Act Lands, Your AI Output Is Being Quietly Tagged",
        "title_short": "Claude嵌入隐形水印满足EU AI Act",
        "title_short_en": "Claude Adds Watermarks for EU AI Act",
        "title_break": "Claude输出嵌入隐形水印<br>EU AI Act倒逼内容溯源",
        "title_break_en": "Claude Output Gets Invisible Watermarks<br>EU AI Act Forces Content Traceability",
        "deck": "Anthropic宣布将在Claude生成的文本中嵌入隐形水印，以满足欧盟AI法案透明度要求。水印对人眼不可见但可被机器识别。职场写邮件、学生写论文——你用AI产出的内容，正在变成可以溯源的。",
        "deck_en": "Anthropic announces invisible watermarks in Claude-generated text to meet EU AI Act transparency rules. Invisible to human eyes but machine-detectable. Your AI output is becoming traceable.",
        "keywords": "Dawn Vision,Anthropic,Claude,隐形水印,EU AI Act,AI监管,内容溯源,隐私",
        "keywords_en": "Dawn Vision, Anthropic, Claude, invisible watermark, EU AI Act, AI regulation, content traceability, privacy",
        "og_description": "Anthropic为Claude添加隐形水印，满足欧盟AI法案透明度要求。AI内容溯源时代到来，你的每一段AI生成文字，都可能带着看不见的标记。",
        "og_description_en": "Anthropic adds invisible watermarks to Claude for EU AI Act compliance. The era of AI content traceability arrives.",
        "read_time": "约 4 分钟阅读",
        "read_time_en": "~4 min read",
        "word_count": 700,
        "sources": [
            {"text": "TechCrunch - Anthropic is rolling out invisible watermarks", "url": "https://techcrunch.com/"},
            {"text": "cnBeta - 为符合欧盟AI法案透明度规定", "url": "https://www.cnbeta.com.tw/articles/tech/1572743.htm"}
        ],
        "pull_quote": {
            "text": "监管说的是'透明度'，用户听到的是'被监控'。同一个技术，不同的角度，完全是两回事。",
            "text_en": "Regulators call it 'transparency.' Users hear 'surveillance.' Same technology, different angles - two completely different things.",
            "attr": "—— 一位AI隐私研究者",
            "attr_en": "- An AI Privacy Researcher"
        },
        "cognitive_notes": "Anthropic,Claude,隐形水印,EU AI Act,AI监管,内容溯源",
        "cognitive_notes_en": "Anthropic,Claude,invisible watermark,EU AI Act,AI regulation,content traceability",
        "source_summary": "本文基于 Dawn Vision 认知引擎处理的 5 个源信号生成，经编辑部人工审核。素材来源：TechCrunch、cnBeta。",
        "source_summary_en": "Generated by the Dawn Vision cognitive engine processing 5 source signals, with human editorial review. Sources: TechCrunch, cnBeta.",
        "body_html": read_body('b4_cn.txt'),
        "body_html_en": read_body('b4_en.txt')
    }

def build_brief5():
    return {
        "slug": "ai-idol-show-heat-plunge-personality-gap",
        "category": "AI 新媒体 · 内容创作",
        "category_en": "AI New Media · Content",
        "title": "AI选秀热度骤降：53万粉丝点赞从76万跌到5万，AI偶像缺的不是脸是灵魂",
        "title_en": "AI Idol Show Heat Plunges: 530K Fans, Likes Drop From 760K to 50K - AI Idols Lack Soul, Not Faces",
        "title_short": "AI选秀点赞从76万跌到5万",
        "title_short_en": "AI Talent Show Likes Crash to 50K",
        "title_break": "《12星练赛》点赞从76万跌到5万<br>AI选秀的热度撑不过两期",
        "title_break_en": "'12-Star Training' Likes Crash From 760K to 50K<br>AI Talent Show Heat Doesn't Last Two Episodes",
        "deck": "AI选秀节目《12星练赛》抖音粉丝超53万，初舞台视频点赞超76万，但8月夏日运动会视频点赞仅5万左右，热度断崖式下跌。AI能复制选秀的形式，复制不了真实的人格魅力和成长感。",
        "deck_en": "AI talent show '12-Star Training' has 530K+ Douyin followers, debut stage hit 760K+ likes, but August summer games only got ~50K - a cliff drop. AI can replicate format, not charisma and growth.",
        "keywords": "Dawn Vision,AI选秀,12星练赛,AI偶像,AI新媒体,虚拟偶像,内容创作",
        "keywords_en": "Dawn Vision, AI talent show, 12-Star Training, AI idol, AI new media, virtual idol, content creation",
        "og_description": "AI选秀节目热度断崖式下跌，点赞从76万跌到5万。AI可以复制选秀规则和流程，但复制不了真实人格魅力和观众的情感投入。",
        "og_description_en": "AI talent show heat crashes, likes drop from 760K to 50K. AI can replicate rules and format, but not real charisma and emotional investment.",
        "read_time": "约 4 分钟阅读",
        "read_time_en": "~4 min read",
        "word_count": 750,
        "sources": [
            {"text": "界面新闻/娱乐独角兽 - AI选秀的真实困境", "url": "https://m.jiemian.com/article/14914255.html"}
        ],
        "pull_quote": {
            "text": "你会为一个游戏角色的成长真情实感地哭吗？不会。新鲜感过了之后，你也不会为AI偶像的选秀真情实感。",
            "text_en": "Do you genuinely cry over a game character's growth? No. After the novelty wears off, you won't genuinely feel for an AI idol's competition either.",
            "attr": "—— 一位娱乐行业从业者",
            "attr_en": "- An Entertainment Industry Professional"
        },
        "cognitive_notes": "AI选秀,12星练赛,AI偶像,虚拟偶像,AI新媒体,内容创作",
        "cognitive_notes_en": "AI talent show,12-Star Training,AI idol,virtual idol,AI new media,content creation",
        "source_summary": "本文基于 Dawn Vision 认知引擎处理的 4 个源信号生成，经编辑部人工审核。素材来源：界面新闻/娱乐独角兽。",
        "source_summary_en": "Generated by the Dawn Vision cognitive engine processing 4 source signals, with human editorial review. Sources: Jiemian News / Entertainment Unicorn.",
        "body_html": read_body('b5_cn.txt'),
        "body_html_en": read_body('b5_en.txt')
    }

def build_brief6():
    return {
        "slug": "humanoid-robot-h1-2026-shipments-china-dominate",
        "category": "具身智能 · 产业观察",
        "category_en": "Embodied AI · Industry",
        "title": "人形机器人上半年出货1.91万台：国产占97%，智元8400台超越宇树登顶全球",
        "title_en": "19.1K Humanoid Robots Shipped in H1 2026: China Makes 97%, ZhiYuan Leads Globally With 8.4K Units",
        "title_short": "上半年出货1.91万台国产占97%",
        "title_short_en": "H1 Shipments 19.1K, China 97%",
        "title_break": "上半年全球出货1.91万台同比+275%<br>国产占97%智元超越宇树登顶",
        "title_break_en": "Global H1 Shipments 19.1K, +275% YoY<br>China 97%, ZhiYuan Surpasses Unitree for #1",
        "deck": "2026上半年全球人形机器人出货约1.91万台，同比增长275%以上，国产厂商占全球出货份额超97%。智元以8400台、44%份额超越宇树登顶全球第一。商业化落地加速，但隐忧同样存在。",
        "deck_en": "Global humanoid robot shipments hit ~19.1K units in H1 2026, up 275%+ YoY, with Chinese makers accounting for 97%+ of global share. ZhiYuan takes #1 with 8.4K units / 44% share.",
        "keywords": "Dawn Vision,人形机器人,具身智能,智元,宇树,出货量,国产机器人,2026",
        "keywords_en": "Dawn Vision, humanoid robot, embodied AI, ZhiYuan, Unitree, shipments, Chinese robots, 2026",
        "og_description": "2026上半年全球人形机器人出货1.91万台，同比+275%，国产占97%，智元超越宇树登顶全球。商业化加速，但产能扩张快于技术迭代的隐忧需警惕。",
        "og_description_en": "H1 2026 global humanoid robot shipments 19.1K, +275% YoY, China makes 97%, ZhiYuan surpasses Unitree for #1. Commercialization accelerates, but capacity outpacing tech iteration is a concern.",
        "read_time": "约 5 分钟阅读",
        "read_time_en": "~5 min read",
        "word_count": 800,
        "sources": [
            {"text": "今日头条 - 智元机器人强势登顶", "url": "http://m.toutiao.com/group/7673039405476495923/"},
            {"text": "36氪 - 2026年上半年度人形机器人行业数据", "url": "https://36kr.com/p/3443976384548356"}
        ],
        "pull_quote": {
            "text": "美国人形机器人公司还在拍发布会视频的时候，中国公司已经把机器人送进工厂干活了。路线不一样，结果就不一样。",
            "text_en": "While American humanoid robot companies were still shooting launch videos, Chinese companies were already putting robots to work in factories. Different routes, different results.",
            "attr": "—— 一位机器人行业资深人士",
            "attr_en": "- A Robotics Industry Veteran"
        },
        "cognitive_notes": "人形机器人,具身智能,智元,宇树,出货量,国产机器人",
        "cognitive_notes_en": "humanoid robot,embodied AI,ZhiYuan,Unitree,shipments,Chinese robots",
        "source_summary": "本文基于 Dawn Vision 认知引擎处理的 6 个源信号生成，经编辑部人工审核。素材来源：今日头条、36氪。",
        "source_summary_en": "Generated by the Dawn Vision cognitive engine processing 6 source signals, with human editorial review. Sources: Jinri Toutiao, 36Kr.",
        "body_html": read_body('b6_cn.txt'),
        "body_html_en": read_body('b6_en.txt')
    }

def build_cao():
    return {
        "slug": "90-percent-executives-ai-productivity-myth-layoffs",
        "category": "槽点 · 职场观察",
        "category_en": "Cao · Workplace",
        "title": "九成高管承认AI没提升生产力：裁掉老员工后，才发现离不开人",
        "title_en": "90% of Execs Admit AI Hasn't Boosted Productivity: After Firing Senior Staff, They Realize They Can't Live Without Humans",
        "title_short": "九成高管承认AI没提高生产力",
        "title_short_en": "90% Execs Say No AI Productivity Gain",
        "title_break": "调查显示九成高管认为AI未提效<br>裁员押注AI的逻辑被现实打脸",
        "title_break_en": "Survey Shows 90% of Execs Say AI Hasn't Improved Productivity<br>Layoffs + AI Bet Gets Reality Check",
        "deck": "亚特兰大联储相关研究发现，约九成企业高管认为AI尚未提高公司生产力，2021年以来的生产力提升主要源于远程办公红利。一边裁员一边押注AI的老板们，终于被现实教做人了。",
        "deck_en": "Atlanta Fed-related research finds ~90% of execs say AI hasn't yet boosted company productivity, gains since 2021 from remote work dividends. Bosses who cut staff while betting on AI finally get a reality check.",
        "keywords": "Dawn Vision,槽点,AI生产力,裁员,职场,高管,亚特兰大联储,科技圈",
        "keywords_en": "Dawn Vision, Cao, AI productivity, layoffs, workplace, executives, Atlanta Fed, tech industry",
        "og_description": "九成高管承认AI还没提高生产力。一边裁人一边押注AI的老板们，终于发现老员工才是真正的生产力。打脸来得太快就像龙卷风。",
        "og_description_en": "90% of execs admit AI hasn't improved productivity yet. Bosses who cut staff while betting on AI finally discover veteran employees are the real productivity.",
        "read_time": "约 3 分钟阅读",
        "read_time_en": "~3 min read",
        "word_count": 750,
        "sources": [
            {"text": "aibase - 近九成企业高管认为AI尚未提高生产力", "url": "https://news.aibase.cn/news/30310"}
        ],
        "footnote_tip": "槽点栏目素材来源于行业观察与公开研究，旨在以轻松视角探讨AI圈的荒诞现象。如有不同意见，欢迎来辩。",
        "footnote_tip_en": "The Cao column draws from industry observations and public research, exploring absurd AI phenomena through a lighthearted lens. Disagree? Come argue about it.",
        "pull_quote": {
            "text": "你们以为的AI提效，其实是在家上班省出来的通勤时间。",
            "text_en": "All that AI productivity you thought you had? It was just the commute time people saved by working from home.",
            "attr": "",
            "attr_en": ""
        },
        "cognitive_notes": "AI生产力,裁员,职场,高管,科技笑话,槽点",
        "cognitive_notes_en": "AI productivity,layoffs,workplace,executives,tech jokes,Cao",
        "source_summary": "本文基于 Dawn Vision 认知引擎处理的 3 个源信号生成，经编辑部人工审核。素材来源：aibase新闻。",
        "source_summary_en": "Generated by the Dawn Vision cognitive engine processing 3 source signals, with human editorial review. Sources: aibase News.",
        "body_html": read_body('cao_cn.txt'),
        "body_html_en": read_body('cao_en.txt')
    }

if __name__ == '__main__':
    issue = build_issue()
    output_path = 'tools/data/issue-035.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(issue, f, ensure_ascii=False, indent=2)
    
    # Validation
    print(f"✅ issue-035.json saved!")
    print(f"Cover: {issue['cover']['title'][:40]}...")
    print(f"Briefs: {len(issue['briefs'])} articles")
    for i, b in enumerate(issue['briefs']):
        print(f"  Brief {i+1}: {b['slug']} - {b['category']}")
    print(f"Cao: {issue['cao']['title'][:40]}...")
    
    # Check all required fields
    required_zh = ["title", "title_short", "title_break", "deck", "body_html", "category", "read_time", "og_description"]
    required_en = ["title_en", "title_short_en", "title_break_en", "deck_en", "body_html_en", "category_en", "read_time_en", "og_description_en"]
    
    def check(obj, name):
        missing = []
        for f in required_zh + required_en:
            if f not in obj:
                missing.append(f)
        if missing:
            print(f"  ⚠️  {name} MISSING: {missing}")
        else:
            cn_len = len(obj.get('body_html', ''))
            en_len = len(obj.get('body_html_en', ''))
            print(f"  ✅ {name} OK (CN:{cn_len}chars EN:{en_len}chars)")
    
    print("\n--- Field Validation ---")
    check(issue['cover'], "cover")
    for i, b in enumerate(issue['briefs']):
        check(b, f"brief{i+1}")
        # check pull_quote
        pq = b.get('pull_quote', {})
        if 'text_en' in pq and 'attr_en' in pq:
            print(f"    ✅ pull_quote has en fields")
        else:
            print(f"    ⚠️  pull_quote missing en fields")
    check(issue['cao'], "cao")
    if 'footnote_tip_en' in issue['cao']:
        print("    ✅ footnote_tip_en present")
    else:
        print("    ⚠️  footnote_tip_en missing")
