"""
Build complete issue-035.json
All content embedded in Python to avoid JSON escaping issues
"""
import json

def build_issue():
    issue = {
        "issue": {
            "number": "035",
            "date": "2026-08-13",
            "date_display": "2026.08.13"
        },
        "cover": build_cover(),
        "briefs": [
            build_brief1(),
            build_brief2(),
            build_brief3(),
            build_brief4(),
            build_brief5(),
            build_brief6()
        ],
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
        "body_html": COVER_BODY_CN,
        "body_html_en": COVER_BODY_EN
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
        "body_html": B1_BODY_CN,
        "body_html_en": B1_BODY_EN
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
        "og_description_en": "Meta launches 30B open source agent model Muse Glimmer, runs locally on 24GB VRAM. Zuckerberg calls for fewer open-source AI restrictions - the open vs closed debate enters a new phase.",
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
        "body_html": B2_BODY_CN,
        "body_html_en": B2_BODY_EN
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
        "deck_en": "European AI coding company Lovable closes Series C at $13.3B valuation - up from $6.6B just six months ago. Led by Menlo Ventures and Scaleup Europe Fund, with a dozen+ institutions participating. AI startup is no longer just a Silicon Valley game.",
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
        "body_html": B3_BODY_CN,
        "body_html_en": B3_BODY_EN
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
        "deck_en": "Anthropic announces invisible watermarks in Claude-generated text to meet EU AI Act transparency rules. Invisible to human eyes but machine-detectable. Work emails, student essays - your AI output is becoming traceable.",
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
        "body_html": B4_BODY_CN,
        "body_html_en": B4_BODY_EN
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
        "deck_en": "AI talent show '12-Star Training' has 530K+ Douyin followers, debut stage video hit 760K+ likes, but August summer games videos only got ~50K likes - a cliff drop. AI can replicate the format, but not real charisma and growth.",
        "keywords": "Dawn Vision,AI选秀,12星练赛,AI偶像,AI新媒体,虚拟偶像,内容创作",
        "keywords_en": "Dawn Vision, AI talent show, 12-Star Training, AI idol, AI new media, virtual idol, content creation",
        "og_description": "AI选秀节目热度断崖式下跌，点赞从76万跌到5万。AI可以复制选秀规则和流程，但复制不了真实人格魅力和观众的情感投入。",
        "og_description_en": "AI talent show heat crashes, likes drop from 760K to 50K. AI can replicate rules and format, but not real charisma and audience emotional investment.",
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
        "body_html": B5_BODY_CN,
        "body_html_en": B5_BODY_EN
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
        "deck_en": "Global humanoid robot shipments hit ~19.1K units in H1 2026, up 275%+ YoY, with Chinese makers accounting for 97%+ of global share. ZhiYuan takes #1 globally with 8.4K units / 44% share, surpassing Unitree.",
        "keywords": "Dawn Vision,人形机器人,具身智能,智元,宇树,出货量,国产机器人,2026",
        "keywords_en": "Dawn Vision, humanoid robot, embodied AI, ZhiYuan, Unitree, shipments, Chinese robots, 2026",
        "og_description": "2026上半年全球人形机器人出货1.91万台，同比+275%，国产占97%，智元超越宇树登顶全球。商业化加速，但产能扩张快于技术迭代的隐忧需警惕。",
        "og_description_en": "H1 2026 global humanoid robot shipments 19.1K, +275% YoY, China makes 97%, ZhiYuan surpasses Unitree for global #1. Commercialization accelerates, but capacity outpacing tech iteration is a concern.",
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
        "body_html": B6_BODY_CN,
        "body_html_en": B6_BODY_EN
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
        "deck_en": "Atlanta Fed-related research finds ~90% of execs say AI hasn't yet boosted company productivity, and gains since 2021 mainly came from remote work dividends. Bosses who cut staff while betting on AI finally get a reality check.",
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
        "body_html": CAO_BODY_CN,
        "body_html_en": CAO_BODY_EN
    }


# ============================================================
# BODY CONTENT - All article bodies below
# ============================================================

COVER_BODY_CN = """<p>没有发布会，没有PPT，没有预热海报。</p>
<p>8月13日凌晨，DeepSeek的API页面悄悄更新了一个版本号：<strong>DeepSeek-V4-Pro-0813</strong>。模型名没变，调用方式没变，文档没变——但你今天调的API，已经不是昨天那个模型了。</p>
<p>最直接的证据是一个数字的跳跃：<strong>DeepSWE跑分从12.8直接跳到62.7，翻了将近5倍</strong>。一个月前的预览版在正式版面前，像是另一个物种。</p>
<p>这不是一次常规的小版本迭代。这是大模型行业一个标志性的转向——过去两年卷的是推理能力：奥数题、编程竞赛、知识问答。而这次暴涨的每一项跑分，都指向同一个方向：<strong>让模型在真实环境里，长时间、多步骤地完成任务</strong>。</p>
<p>用行话说，这叫Agent能力。用大白话说：<strong>以前的模型是学霸，这次升级的方向是长工。</strong></p>

<h2>翻了5倍的，不是智商是干活能力</h2>
<p>先看一组对比。左边是一个月前的预览版（Preview），右边是8月13日上线的正式版：</p>
<p>Terminal Bench从72.1到87.9，提升15.8分；DeepSWE从12.8到62.7，翻近5倍；AutomationBench从12.8到31.8，提升19分；DSBench-FullStack从41.8到71.1，提升29.3分；DSBench-Hard从31.1到67.2，提升36.1分；Cybergym从52.7到83.3，提升30.6分。</p>
<p>这张表里最值得多看一眼的，不是涨幅，而是涨幅出现的位置。</p>
<p>Terminal Bench考的是模型在终端里真实操作的能力，DeepSWE考的是软件工程任务，AutomationBench考的是自动化流程，Cybergym考的是安全攻防——<strong>这些全是"干活"的测试，不是"答题"的测试</strong>。</p>
<div class="pull-quote">"过去两年大模型卷的是'能不能答对'，现在开始卷的是'能不能把活干完干好'。这不是同一场考试。"—— 一位AI行业从业者的判断</div>
<p>为什么这个转向重要？因为推理能力再强，如果不能在真实环境中持续执行任务，它的商业价值就始终停留在"聊天助手"的层面。而Agent能力——也就是模型能调用工具、操作电脑、完成多步骤任务的能力——才是大模型真正从"玩具"变成"生产力工具"的关键一跃。</p>
<p>DeepSeek这次深夜升级释放的信号非常明确：它不再满足于做"便宜的推理模型"，它要直接切入Agent主战场。</p>

<h2>横向对比：无短板才是最难做到的</h2>
<p>自家预览版被吊打，只能说明进步快。真正的问题是：放到全球牌桌上，DeepSeek V4 Pro站在什么位置？</p>
<p>把正式版和目前第一梯队的几个模型摆在一起看：Terminal Bench上，Kimi-K3以88.3分占据榜首，V4 Pro是87.9，差0.4分——这个差距比一次测试的随机波动大不了多少。HLE（带工具）上，Fable 5的63.0仍然领先。NL2Repo上，Opus-4.8的69.7保持优势。Cybergym 83.3分，则是目前已公布的最高水平之一。</p>
<p>这张表怎么读？看两点。</p>
<p>第一，<strong>单项未必全是第一</strong>。每一个细分项目都有更强的选手——有的编程强，有的推理强，有的安全攻防强。V4 Pro在任何一个单项上都不是绝对的王者。</p>
<p>第二，也是更关键的一点：<strong>没有任何一项掉出第一梯队</strong>。</p>
<p>这恰恰是Agent模型最难做到的事。推理模型可以偏科——数学特别强、写作一般般，照样有卖点。但Agent要在真实环境里连续干活：写代码、调工具、查资料、改bug、跑流程，任何一个环节掉链子，整个任务就崩了。</p>
<div class="pull-quote">"单项未必全是第一，但没有任何一项掉出第一梯队——这才是Agent模型最难做到的无短板。"—— 一位AI技术博主的评论</div>
<p>用一句话概括现在的格局：<strong>国产AI离海外旗舰，只差一步</strong>。而且这一步，是以"月"为单位在缩短的。</p>
<p>如果说半年前，国产大模型还在"追赶"海外旗舰，那么现在的格局已经变成了"交替领先"——你在这个基准上领先，我在那个基准上领先。第一梯队的门槛，已经不是美国公司专属了。</p>

<h2>地板价的算盘：1M上下文的生意经</h2>
<p>说完能力，说钱。这次价格牌，打得很有讲究。</p>
<p>先看给了什么：<strong>100万token上下文，38.4万token最大输出</strong>。什么概念？一百万token大约能塞进去七八本长篇小说，或者一个中型项目的全部代码。对于要长时间跑任务的Agent来说，长上下文和大输出不是锦上添花，是硬刚需——上下文不够长，干到一半就把前面的指令忘了。</p>
<p>再看收多少。V4 Pro定价：缓存命中输入<strong>0.025元</strong>/百万token，未命中输入<strong>3元</strong>/百万token，输出<strong>6元</strong>/百万token，并发上限500。</p>
<p>两个细节值得注意。</p>
<p>一是<strong>缓存命中价压到了0.025元</strong>。重复上下文走缓存，成本几乎可以忽略——这是明摆着在鼓励开发者把长任务、多轮对话的场景往上搬。对比海外同级旗舰动辄几十美元的定价，这个价格基本就是零头。<strong>同样的活，只要别人一个零头</strong>。</p>
<p>二是<strong>并发上限从Flash的2500收到了500</strong>。为什么？能力越强，单次推理烧的算力越贵，尤其是默认开启的思考模式。从并发上限的收缩也能侧面看出来：V4 Pro的算力成本比V4 Flash高了不少，但DeepSeek仍然把价格压在了一个极具竞争力的水平。</p>
<p>这背后的商业逻辑很清晰：<strong>用低价换量，用量练模型，用模型数据再练出更强的能力</strong>。DeepSeek不是慈善机构，它的低价策略是一种投资——用今天的低价，换明天的市场份额和数据积累。</p>

<h2>模型战争的下半场：从比聪明到比干活</h2>
<p>DeepSeek V4 Pro的这次深夜升级，放在更宏观的行业背景下看，意义远不止一个模型的更新。</p>
<p>它标志着大模型行业的竞争，正在发生一次根本性的转向。</p>
<p>上半场的主题是<strong>"谁更聪明"</strong>。比参数规模、比推理能力、比基准测试跑分。各家公司的发布会，核心叙事都是"我们的模型在某某榜单上超越了某某"。用户关心的也是"这个模型做题够不够厉害"。</p>
<p>下半场的主题正在变成<strong>"谁更能干活"</strong>。比Agent能力、比工具调用、比真实场景下的任务完成率。基准测试不再是MMLU和GSM8K，而是Terminal Bench、DeepSWE、Cybergym这些真正考验"做事能力"的测试集。</p>
<p>这个转向对行业意味着什么？</p>
<p>第一，<strong>评价体系的切换</strong>。过去我们用"聪不聪明"来评价一个模型，未来我们会用"能不能干活"来评价。这两个维度有关联，但不完全重合——一个模型可能推理题做得很好，但一到真实环境就各种翻车。</p>
<p>第二，<strong>商业模式的切换</strong>。纯聊天模型的商业化天花板已经逐渐清晰——订阅制、API调用，这些模式的增长曲线正在放缓。而Agent模型直接对接的是真实工作流——编程、办公、运营、客服——每一个都是万亿美元级别的市场。</p>
<p>第三，<strong>竞争格局的重洗</strong>。上半场赢了的公司，下半场未必还能赢。推理能力强不等于Agent能力强，数据积累多不等于工具链完善。Agent是一个系统工程，不是光靠模型就能搞定的。</p>
<div class="pull-quote">"当模型名没变、里子却换了一代的时候，你就知道这个行业的迭代速度已经快到了什么程度。去年的最强模型，今年可能连第二梯队都进不去。"—— 一位AI投资人的观察</div>
<p>DeepSeek这次选择在深夜静默更新，不发公告、不做发布会，本身就是一种自信的表现——产品够硬的时候，营销是最不重要的那一环。一张跑分图，胜过十场发布会。</p>
<p>但竞争也远没有结束。V4 Pro的Agent能力上来了，那V5呢？OpenAI的下一个版本呢？Anthropic的Claude Next呢？这场从"比聪明"到"比干活"的战争，才刚刚进入白热化阶段。</p>
<p>可以确定的是：未来几个月，我们会看到越来越多的模型在Agent基准上你追我赶。对于用户来说，这是最好的时代——模型越来越强，价格越来越低，选择越来越多。</p>
<p>对于大模型公司来说，这也是最坏的时代——你刚觉得自己领先了，转头就被别人深夜换芯超过去。</p>
<p>明天见。</p>"""

COVER_BODY_EN = """<p>No launch event. No slides. No teaser posters.</p>
<p>In the early hours of August 13, DeepSeek's API page quietly updated a version number: <strong>DeepSeek-V4-Pro-0813</strong>. The model name stayed the same, the API call stayed the same, the docs stayed the same - but the API you're calling today isn't the same model as yesterday.</p>
<p>The most direct evidence is a single number's leap: <strong>DeepSWE score jumped from 12.8 straight to 62.7 - nearly 5x</strong>. The preview version from a month ago, next to the official release, looks like a different species entirely.</p>
<p>This isn't a routine minor version bump. This is a landmark pivot for the entire LLM industry. For the past two years, the race was about reasoning - Olympiad math, programming contests, knowledge QA. But every benchmark that skyrocketed this time points in the same direction: <strong>making models work for extended periods, across multiple steps, in real environments</strong>.</p>
<p>In industry jargon: Agent capability. In plain English: <strong>previous models were honor students; this upgrade's direction is blue-collar workers.</strong></p>

<h2>What Jumped 5x Wasn't IQ - It Was Getting Work Done</h2>
<p>Let's compare. On the left, the preview version from a month ago. On the right, the official release that went live August 13:</p>
<p>Terminal Bench: 72.1 to 87.9, +15.8. DeepSWE: 12.8 to 62.7, nearly 5x. AutomationBench: 12.8 to 31.8, +19.0. DSBench-FullStack: 41.8 to 71.1, +29.3. DSBench-Hard: 31.1 to 67.2, +36.1. Cybergym: 52.7 to 83.3, +30.6.</p>
<p>What's most notable in this table isn't the gains themselves - it's where the gains are happening.</p>
<p>Terminal Bench tests a model's ability to actually operate inside a terminal. DeepSWE tests software engineering tasks. AutomationBench tests automated workflows. Cybergym tests security offense and defense. <strong>All of these are "getting work done" tests, not "answering questions" tests</strong>.</p>
<div class="pull-quote">"For two years LLMs competed on 'can you get the right answer.' Now they're competing on 'can you get the job done.' These aren't the same exam." - An AI Industry Practitioner</div>
<p>Why does this pivot matter? Because no matter how strong reasoning capability is, if a model can't continuously execute tasks in real environments, its commercial value remains stuck at the "chat assistant" level. Agent capability - a model's ability to call tools, operate a computer, complete multi-step tasks - is the critical leap from "toy" to "productivity tool."</p>
<p>The signal DeepSeek is sending with this midnight upgrade is clear: it's no longer satisfied being a "cheap reasoning model." It's going straight for the Agent main battlefield.</p>

<h2>Side by Side: No Weaknesses Is the Hardest Feat</h2>
<p>Beating your own preview version only proves you've improved fast. The real question: where does DeepSeek V4 Pro stand at the global table?</p>
<p>Pitting the official release against the current first-tier models: on Terminal Bench, Kimi-K3 leads at 88.3; V4 Pro sits at 87.9 - a 0.4 difference, barely more than test noise. On HLE with tools, Fable 5's 63.0 still leads. On NL2Repo, Opus-4.8's 69.7 holds the edge. On Cybergym, 83.3 ranks among the highest published scores.</p>
<p>How to read this chart? Two observations.</p>
<p>First, <strong>it's not first in every category</strong>. Every sub-discipline has a stronger player - some excel at coding, some at reasoning, some at security. V4 Pro isn't the undisputed king of any single benchmark.</p>
<p>Second - and this is the more crucial point - <strong>it doesn't fall out of the first tier in any of them</strong>.</p>
<p>This is precisely the hardest thing for an Agent model to achieve. Reasoning models can afford to be lopsided - great at math, mediocre at writing, and still sell. But an agent working through real tasks has to code, use tools, look things up, fix bugs, run pipelines. Fail at any one link and the whole task breaks.</p>
<div class="pull-quote">"Not first in everything, but never outside the top tier - that's the hardest no-weakness bar for Agent models." - An AI Tech Blogger</div>
<p>Summarizing the current landscape in one sentence: <strong>Chinese AI is one step away from overseas flagships</strong>. And that step is closing, measured in months.</p>
<p>If half a year ago Chinese LLMs were still "catching up" to overseas flagships, the landscape has now shifted to "alternating leads." You lead on this benchmark, I lead on that one. The first tier is no longer an exclusive club for American companies.</p>

<h2>Floor-Price Strategy: The Economics of 1M Context</h2>
<p>Capability covered, now let's talk money. This pricing play is calculated.</p>
<p>First, what you get: <strong>1 million token context window, 384,000 token max output</strong>. To put that in perspective: a million tokens is roughly seven or eight full-length novels, or the entire codebase of a medium-sized project. For agents running long tasks, long context and large output aren't nice-to-haves - they're hard requirements. Too short a context, and the agent forgets earlier instructions halfway through.</p>
<p>Now what you pay. V4 Pro pricing: cached input <strong>0.025 yuan</strong>/M tokens, uncached input <strong>3 yuan</strong>/M tokens, output <strong>6 yuan</strong>/M tokens, concurrency limit 500.</p>
<p>Two details stand out.</p>
<p>First, <strong>cached input priced at 0.025 yuan</strong>. Repeated context goes through cache and costs essentially nothing - this is clearly encouraging developers to move long tasks and multi-turn conversations onto this model. Compared to overseas flagship prices in the tens of dollars, this price is literally a fraction. <strong>The same work, for pocket change.</strong></p>
<p>Second, <strong>concurrency dropped from 2500 (Flash) to 500</strong>. Why? The more capable the model, the more compute each inference burns - especially with thinking mode enabled by default. The concurrency contraction also tells you something: V4 Pro's compute cost is significantly higher than V4 Flash's, yet DeepSeek still compressed the price to a brutally competitive level.</p>
<p>The business logic is clear: <strong>low prices for volume, volume for data, data for even better capability</strong>. DeepSeek isn't a charity - its low-price strategy is an investment. Today's low price buys tomorrow's market share and data accumulation.</p>

<h2>The Model War's Second Half: From Smarts to Work</h2>
<p>DeepSeek V4 Pro's midnight upgrade, viewed against the broader industry backdrop, means far more than a single model update.</p>
<p>It signals that competition in the LLM industry is undergoing a fundamental pivot.</p>
<p>The first half's theme was <strong>"who's smarter"</strong>. Competing on parameter scale, reasoning capability, benchmark scores. Every company's keynote centered on "our model surpassed X on benchmark Y." Users cared about "can this model ace the test."</p>
<p>The second half's theme is becoming <strong>"who gets work done"</strong>. Competing on Agent capability, tool use, real-world task completion. Benchmarks aren't MMLU and GSM8K anymore - they're Terminal Bench, DeepSWE, Cybergym, tests that actually measure "getting things done."</p>
<p>What does this pivot mean for the industry?</p>
<p>First, <strong>a shift in evaluation</strong>. We used to judge models by "how smart they are." Going forward, we'll judge by "how much work they can do." These dimensions correlate but aren't identical - a model can nail reasoning questions yet completely fall apart in real environments.</p>
<p>Second, <strong>a shift in business models</strong>. The commercial ceiling of pure chat models is becoming clearer - subscriptions, API calls, these growth curves are flattening. Agent models directly plug into real workflows - coding, office operations, customer service - each a multi-trillion-dollar market.</p>
<p>Third, <strong>a reshuffle of the competitive landscape</strong>. Companies that won the first half won't necessarily win the second. Strong reasoning doesn't equal strong Agent capability. Lots of data doesn't equal a complete toolchain. Agent systems are systems engineering - you can't just throw a model at it and call it done.</p>
<div class="pull-quote">"When the model name stays the same but the inside is a whole new generation, you know how fast this industry iterates. Last year's strongest model might not even make second tier this year." - An AI Investor</div>
<p>DeepSeek choosing to release this silently in the middle of the night - no announcement, no press event - is itself a display of confidence. When the product speaks for itself, marketing is the least important thing. One benchmark chart beats ten launch events.</p>
<p>But the competition is far from over. V4 Pro's Agent capability is up - but what about V5? What about OpenAI's next version? What about Anthropic's Claude Next? This war, shifting from "who's smarter" to "who gets work done," is just entering its white-hot phase.</p>
<p>One thing is certain: in the months ahead, we'll see more and more models trading leads on Agent benchmarks. For users, this is the best of times - models keep getting stronger, prices keep dropping, options keep multiplying.</p>
<p>For LLM companies, it's also the worst of times - just when you think you're ahead, someone swaps cores on you at midnight and surges past.</p>
<p>See you tomorrow.</p>"""

B1_BODY_CN = """<p>9月。一个月后。</p>
<p>马斯克在SpaceX内部全员会议上放了一句话：<strong>公司的AI收入将于9月超过其他所有业务收入之和</strong>，并且在第四季度大幅领先。</p>
<p>这句话的分量，怎么强调都不过分。SpaceX是什么公司？是全球最大的商业火箭发射公司，是星链运营商，是估值几千亿美元的航天巨头。它的"其他所有业务"——火箭发射、星链、星舰——加在一起，年营收规模在数百亿美元级别。</p>
<p>而AI业务，在两年前还几乎不存在。</p>
<p>8月13日，SpaceXAI正式发布了Grok 4.6。这次升级的核心方向不是推理能力的常规提升，而是<strong>长时运行的智能体任务、复杂交互、视觉工作和编码能力</strong>的强化。换句话说，Grok正在从"聊天模型"变成"能干活的模型"。</p>

<h2>从成本中心到利润中心的转身</h2>
<p>两年前，xAI还只是马斯克名下一个烧钱的AI实验室。Grok 1的发布更像是一个玩具——性能落后于GPT和Claude，用户主要是X平台的硬核粉丝。</p>
<p>但事情变化的速度远超所有人预期。2026年2月，SpaceX吸收合并了xAI——这不是简单的组织调整，而是一次战略层面的资源整合。合并之后，xAI获得了SpaceX的算力基础设施、工程团队和分发渠道，而SpaceX则拿到了AI时代的入场券。</p>
<p>现在回头看，这步棋走得极其精准。</p>
<p>Grok的商业化路径，走的不是OpenAI那种纯API+订阅的路线，而是直接嵌入SpaceX的整个产品矩阵：</p>
<p><strong>第一，编程入口</strong>。SpaceX以600亿美元收购Cursor之后，Grok成为Cursor的默认模型之一。数千万开发者的注意力和数据，直接转化为Grok的训练燃料和收入来源。</p>
<p><strong>第二，硬件入口</strong>。Grok Build、Grok Code等工具直接对接开发者工作流，首周双倍额度的促销策略快速拉新。</p>
<p><strong>第三，企业入口</strong>。通过xAI的企业版方案，Grok正在切入企业级AI市场。</p>
<div class="pull-quote">"火箭是马斯克的梦想，AI是马斯克的生意。当AI收入超过火箭收入的那一刻，SpaceX就不再是一家航天公司了——它是一家AI公司，顺便造火箭。"—— 一位科技行业分析师</div>
<p>如果马斯克的预测兑现——9月AI收入超过其他所有业务之和——那意味着SpaceX的收入结构将发生根本性的变化。一家以火箭发射起家的公司，最终变成了一家以AI为主要收入来源的公司。这个转变，可能比任何技术突破都更有象征意义。</p>

<h2>AI收入为什么涨得这么快？</h2>
<p>很多人可能会问：Grok的性能明明不是最强的，为什么收入能涨这么快？</p>
<p>答案在于：<strong>AI收入的关键不在模型本身有多强，而在分发渠道有多广</strong>。</p>
<p>OpenAI的ChatGPT用户量巨大，但它的分发渠道本质上只有一个——自己的产品。Anthropic的Claude能力很强，但分发渠道主要靠AWS和第三方开发者。</p>
<p>而马斯克的AI版图有什么？X平台（数亿用户）、Cursor（数千万开发者）、SpaceX算力（自建超算）、Tesla（车载入口）、Neuralink（脑机接口）——这些渠道每一个都可以直接转化为AI产品的用户。</p>
<p>更重要的是，这些渠道之间形成了<strong>正向飞轮</strong>：X平台的数据训练Grok模型，Grok能力提升让Cursor更好用，Cursor的用户数据又反过来改进Grok，Grok变强了又吸引更多企业客户——整个闭环在马斯克的体系内就能完成。</p>
<p>这就是为什么Grok在技术参数上可能还不是全球第一，但收入增长速度却可能是最快的。因为它不是一个孤立的AI产品，而是一个庞大生态系统中的一个环节。</p>
<p>当然，马斯克的收入预测是内部讲话内容，不是已经实现的财报数据。实际情况是否能达到预期，还需要等财报验证。但即便数字有出入，大方向也是明确的：<strong>AI正在从SpaceX的"未来业务"变成"当前主业"</strong>。</p>
<p>当一家火箭公司的AI收入超过火箭收入的时候，我们可以确定一件事：AI时代的权力结构，已经彻底改写了。</p>
<p>明天见。</p>"""

B1_BODY_EN = """<p>September. One month from now.</p>
<p>At a SpaceX all-hands meeting, Elon Musk dropped one line: <strong>the company's AI revenue will surpass all other businesses combined in September</strong>, and will lead decisively in Q4.</p>
<p>The weight of that statement can't be overstated. What is SpaceX? It's the world's largest commercial rocket launch company, it's Starlink, it's a multi-hundred-billion-dollar aerospace giant. "All other businesses" - rocket launches, Starlink, Starship - combined, represent tens of billions in annual revenue.</p>
<p>And the AI business? Two years ago, it barely existed.</p>
<p>On August 13, SpaceXAI officially launched Grok 4.6. The core of this upgrade isn't routine reasoning improvement - it's strengthened <strong>long-running agent tasks, complex interaction, visual work, and coding capability</strong>. In other words, Grok is evolving from a "chat model" to a "model that gets work done."</p>

<h2>The Pivot From Cost Center to Profit Center</h2>
<p>Two years ago, xAI was just a money-burning AI lab under Musk's umbrella. Grok 1's launch felt more like a toy - performance lagging behind GPT and Claude, users mostly hardcore fans on the X platform.</p>
<p>But things changed faster than anyone expected. In February 2026, SpaceX absorbed xAI - this wasn't a simple org change, it was a strategic resource consolidation. After the merger, xAI gained SpaceX's compute infrastructure, engineering teams, and distribution channels, while SpaceX got its ticket to the AI era.</p>
<p>Looking back now, this move was extraordinarily well-timed.</p>
<p>Grok's commercialization path isn't OpenAI's pure API + subscription route. It's directly embedded in SpaceX's entire product matrix:</p>
<p><strong>First, the coding entry point.</strong> After SpaceX acquired Cursor for $60B, Grok became one of Cursor's default models. Tens of millions of developers' attention and data directly convert into Grok's training fuel and revenue.</p>
<p><strong>Second, the product entry point.</strong> Grok Build, Grok Code, and other tools plug directly into developer workflows. First-week double-credit promotions accelerate user acquisition.</p>
<p><strong>Third, the enterprise entry point.</strong> Through xAI's enterprise solutions, Grok is penetrating the enterprise AI market.</p>
<div class="pull-quote">"Rockets are Musk's dream; AI is Musk's business. The day AI revenue exceeds rocket revenue, SpaceX stops being an aerospace company - it's an AI company that happens to build rockets." - A Tech Industry Analyst</div>
<p>If Musk's prediction holds - AI revenue surpassing all other businesses combined in September - it means SpaceX's revenue structure undergoes a fundamental shift. A company built on rocket launches ends up with AI as its primary income source. This transformation may be more symbolically significant than any technological breakthrough.</p>

<h2>Why Is AI Revenue Growing So Fast?</h2>
<p>Many people might ask: Grok clearly isn't the strongest model - why is revenue growing so quickly?</p>
<p>The answer: <strong>AI revenue's key driver isn't how strong the model is - it's how broad the distribution channels are</strong>.</p>
<p>OpenAI's ChatGPT has massive users, but its distribution is essentially one channel - its own product. Anthropic's Claude is very capable, but distribution relies mainly on AWS and third-party developers.</p>
<p>What does Musk's AI landscape have? The X platform (hundreds of millions of users), Cursor (tens of millions of developers), SpaceX compute (self-built supercomputers), Tesla (in-vehicle entry point), Neuralink (BCI) - each of these channels can directly convert into AI product users.</p>
<p>More importantly, these channels form a <strong>positive flywheel</strong>: X platform data trains Grok models, Grok's improvements make Cursor better, Cursor's user data in turn improves Grok, stronger Grok attracts more enterprise customers - the entire loop completes within Musk's ecosystem.</p>
<p>This is why Grok may not be the global leader in technical specs, yet its revenue growth could be the fastest. It isn't an isolated AI product - it's one link in a massive ecosystem.</p>
<p>Of course, Musk's revenue prediction is from an internal speech, not realized financial results. Whether reality matches expectations awaits earnings confirmation. But even if the numbers differ, the direction is clear: <strong>AI is shifting from SpaceX's "future business" to "current main business."</strong></p>
<p>When a rocket company's AI revenue exceeds its rocket revenue, one thing is certain: the power structure of the AI era has been completely rewritten.</p>
<p>See you tomorrow.</p>"""

B2_BODY_CN = """<p>300亿参数。24GB显存。本地运行。</p>
<p>8月11日晚，扎克伯格发了一篇长文，同时做了一件事：<strong>Meta发布Muse Glimmer——一款300亿参数的本地Agent模型，并且完全开源</strong>。这也是Meta成立超级智能实验室后，首次开放模型权重。</p>
<p>Muse Glimmer是什么？它不是一个又大又强的通用模型。它的定位很明确：<strong>个人Agent的本地基础模型</strong>。量化后不到20GB，可以在消费级显卡甚至部分Mac上运行，没有网络连接也能执行任务。整理文件、管理日程、起草消息、本地编程——这些不需要把数据送到云端的事，它就在你电脑上帮你干了。</p>
<p>技术上，这个模型有亮点但也不是碾压级的。在Meta公布的22项基准测试中，它拿下12项SOTA，优势集中在Agent任务和部分推理测试。但在桌面操作、编程、多模态上，它不如Qwen 3.6。</p>
<p>真正值得关注的，不是模型本身，而是<strong>扎克伯格用它打的牌</strong>。</p>

<h2>开源是武器，不是慈善</h2>
<p>扎克伯格的长文，标题就很有攻击性——《未来属于每个人》。核心论点只有一个：<strong>超级智能不应该集中在少数公司或个人手中</strong>。</p>
<p>他说了几件事。第一，Meta超级智能实验室将恢复开放部分模型，面向数十亿用户提供免费或低价的个人Agent。第二，推出连Meta自身也无法读取用户数据的完全私密模式。第三，设立10亿美元的"未来属于每个人"基金，支持美国数据中心建设的社区。</p>
<p>但最有争议的是第四点：<strong>他呼吁减少美国对开源AI模型的限制，同时支持继续实施芯片出口管制</strong>。</p>
<p>这个立场看起来矛盾——一边说AI应该开放，一边又说芯片不能卖给中国。但放在Meta的商业利益下看，一点也不矛盾：</p>
<p><strong>开源模型，是Meta对抗OpenAI和Google的武器。</strong>OpenAI和Google靠闭源模型赚钱，Meta就用开源模型打价格战——你收费的东西，我免费给。开发者用了我的开源模型，就会形成生态依赖，最终反过来巩固Meta的平台地位。</p>
<p><strong>芯片管制，是Meta限制中国对手的工具。</strong>开源模型可以在低配置硬件上跑，但要训练最强的模型还是需要高端芯片。限制芯片出口，就是限制中国公司训练出能跟Meta竞争的模型。</p>
<div class="pull-quote">"扎克伯格谈开源的时候，你听的是理想主义；但你看他的商业动作，全是现实主义。开源不是慈善，是护城河。"—— 一位AI行业观察者</div>
<p>这套打法Meta已经用过一次了。当年Meta开源LLaMA，直接催生了全球开源大模型的生态繁荣——但最大的受益者是谁？是Meta。因为所有开源模型的开发者，本质上都在为Meta的生态添砖加瓦。</p>

<h2>本地Agent：下一个战场</h2>
<p>Muse Glimmer的发布，也指向了AI行业的下一个战场：<strong>本地AI</strong>。</p>
<p>过去几年，AI的趋势是云端化——所有计算都在云端完成，用户只需要一个浏览器。但云端AI有几个解不开的结：隐私问题（你的数据要上传到别人的服务器）、延迟问题（网络不好就用不了）、成本问题（云端计算是按次收费的）。</p>
<p>本地AI刚好反过来。模型跑在你自己的电脑上，数据不出设备，没有延迟，没有API费用——唯一的成本是你买显卡的钱。</p>
<p>但本地AI最大的问题是<strong>能力不够强</strong>。消费级显卡能跑的模型，参数规模有限，能力自然不如云端的千亿万亿参数模型。</p>
<p>Meta这次的30B模型，如果Agent能力真的能达到官方说的水平，那就是一个重要的里程碑——它证明了<strong>三十亿级的模型，也能具备实用级的Agent能力</strong>。如果24GB显存的显卡就能跑一个能帮你干活的Agent，那本地AI的普及门槛就被大大降低了。</p>
<p>这对AI行业意味着什么？意味着AI的形态可能从"集中式云端服务"，向"分布式本地智能"演化。未来每个人的电脑、手机、甚至智能手表里，可能都跑着一个专属的本地Agent——它知道你的习惯、帮你处理日常事务，而且<strong>所有数据都在你自己的设备上</strong>。</p>
<p>当然，现在说这些还太早。Muse Glimmer的实际表现还需要社区验证，本地Agent的使用场景也还在探索中。但Meta押注这个方向，本身就是一个强烈的信号——</p>
<p>闭源模型垄断AI的时代，可能正在被开源的力量一点一点地打破。而每一次打破，受益的都是用户。</p>
<p>明天见。</p>"""

B2_BODY_EN = """<p>30 billion parameters. 24GB VRAM. Runs locally.</p>
<p>On the evening of August 11, Mark Zuckerberg published a long essay and did one thing: <strong>Meta released Muse Glimmer - a 30-billion-parameter local agent model, fully open source</strong>. This is also the first time Meta's Superintelligence Lab has opened model weights since its founding.</p>
<p