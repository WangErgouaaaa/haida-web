#!/usr/bin/env node
/**
 * 数据库种子脚本 —— 首次启动前执行:npm run db:seed
 * 已存在数据时自动跳过,不会覆盖手工修改。
 * 示例:机器学习与多组学分析研究团队网站,直接编辑下方数组即可替换成真实数据。
 */
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { SCHEMA } from './schema.mjs'

const DB_PATH = process.env.LAB_DB_PATH
  ? resolve(process.env.LAB_DB_PATH)
  : resolve(process.cwd(), 'data', 'haida.db')

if (!existsSync(dirname(DB_PATH))) mkdirSync(dirname(DB_PATH), { recursive: true })

const db = new DatabaseSync(DB_PATH)
db.exec(SCHEMA)

const count = db.prepare('SELECT COUNT(*) AS n FROM settings').get().n
if (count > 0) {
  console.log('数据库已有数据,跳过种子初始化。')
  db.close()
  process.exit(0)
}

const insert = db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)`)
const settings = [
  ['site_name', '机器学习与多组学分析研究团队'],
  ['site_name_short', 'ML × OMICS'],
  ['site_institution', '海南大学生命健康学院'],
  ['site_footer_text', '机器学习与多组学分析研究团队 · 海南大学生命健康学院'],
  ['site_footer_contact', 'Contact · 中文 / EN'],
  ['site_join_text', '欢迎对病原生物信息学、机器学习和多组学研究感兴趣的同学加入。'],
  ['join_cta_text', '了解招生信息 →'],
  ['join_hero_title', '和我们一起研究生命数据'],
  ['join_hero_text', '欢迎对病原生物信息学、机器学习和多组学研究感兴趣的同学联系团队。'],
  ['join_what_title', '研究与学习机会'],
  ['join_what_text', '团队方向涵盖比较基因组学、群体遗传学、转录组学、宏组学、机器学习与数据库构建。'],
  ['join_what_methods', '本科生科研 · 研究生培养 · 合作交流'],
  ['join_contact_title', '联系方式'],
  ['join_contact_text', '招生要求、联系邮箱与办公地点将在信息确认后补充。'],
  ['join_contact_address', '海南大学生命健康学院'],
  ['site_contact_email', ''],
  ['research_hero_title', '从多源生命数据中理解病原传播、演化与互作'],
  ['research_hero_text', '围绕“同一健康”理念，连接宿主、媒介/环境与病原，为疾病监测、预警及防控提供新的研究视角。'],
  ['updates_hero_title', '记录研究、资源与团队的新进展'],
  ['updates_hero_text', '按论文、项目、数据资源和团队动态分类，记录团队的最新动态。'],
  ['members_hero_title', '共同探索生命数据中的规律'],
  ['members_hero_text', '团队成员信息持续更新中。'],
  ['databases_hero_title', '面向病原生物信息学的数据资源'],
  ['databases_hero_text', '发布团队建设和维护的数据库，为每个资源提供独立介绍、版本记录与访问入口。'],
  ['tools_hero_title', '让分析方法可以直接使用'],
  ['tools_hero_text', '连接团队开发的 Webserver、分析流程和软件工具。'],
]
for (const [k, v] of settings) insert.run(k, v)

const h = db.prepare(`INSERT INTO hero_slides (kicker, title, text, action1_text, action1_url, action2_text, action2_url, visual, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
const slides = [
  ['One Health · 同一健康', '追踪病原演化，<br>守护共同健康', '聚焦人兽共患病原的传播、演化与宿主互作，以机器学习和多组学分析服务疾病监测、预警及防控。', '探索研究方向', '/research', '加入我们', '/join', 'photo', '0'],
  ['Pathogen surveillance', '从多源数据中，<br>发现早期风险信号', '连接病原基因组、流行病学与环境数据，识别新发病原和异常传播信号。', '监测与预警', '/research', '了解方法', '/tools', 'network', '1'],
  ['Machine learning × Multi-omics', '解析致病与耐药，<br>寻找干预线索', '利用机器学习和多组学分析理解病原—媒介/环境—宿主互作，并挖掘关键生物活性肽。', '多组学研究', '/research', '最新进展', '/updates', 'heatmap', '2'],
]
for (const row of slides) h.run(...row)

const s = db.prepare(`INSERT INTO signals (label, title, text, sort_order) VALUES (?, ?, ?, ?)`)
const signals = [
  ['研究框架 · Framework', '同一健康', '连接宿主、媒介/环境与病原', '0'],
  ['核心问题 · Questions', '传播、演化与互作', '面向监测、预警与疾病防控', '1'],
  ['技术路径 · Methods', 'AI × 多组学', '基因组、转录组与宏组学分析', '2'],
]
for (const row of signals) s.run(...row)

const r = db.prepare(`INSERT INTO research_areas (number, title_en, title_zh, description, methods, visual, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`)
const areas = [
  ['01', 'Surveillance', '新发和突发病原监测、预警及防控', '整合病原基因组、流行病学与环境数据，识别新发病原与异常传播信号，为疾病监测、预警及防控提供支撑。团队围绕隐孢子虫等人兽共患病原开展基因组流行病学研究。', '比较基因组学 · 群体遗传学 · 基因组流行病学 · 机器学习', 'surveillance', '0'],
  ['02', 'Evolution', '病原演化及传播动态', '结合遗传变异、时间与地理信息，解析病原的演化路径和传播过程。团队聚焦隐孢子虫的基因重组、宿主偏好改变与亚型扩散，揭示病原演化的分子机制。', '系统发育 · 群体基因组学 · 重组分析 · 时空分析', 'evolution', '1'],
  ['03', 'One Health', '病原—媒介/环境—宿主互作', '从同一健康视角理解多主体系统，结合转录组与宏组学解析病原感染应答与致病过程，探索致病、耐药及宿主响应机制。', '转录组学 · 宏基因/转录组学 · 宿主-病原互作 · 多组学整合', 'onehealth', '2'],
  ['04', 'Resistance & Peptide', '致病与耐药机制解析、生物活性肽挖掘', '利用机器学习和多组学分析解析病原菌的致病和耐药机制（如I型限制修饰系统经DNA甲基化调控毒力），并挖掘治疗疾病的关键生物活性肽。', '蛋白语言模型 · 毒力因子预测 · DNA甲基化分析 · 生物活性肽挖掘', 'onehealth', '3'],
]
for (const row of areas) r.run(...row)

const u = db.prepare(`INSERT INTO updates (date, title, preview_title, summary, category, category_zh, tags, featured, featured_badge, paper_file, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
const updates = [
  ['2025-07-08', 'I型限制修饰系统通过DNA甲基化增强细菌致病性', 'Horizontal acquisition of the Type I restriction-modification system enhances bacterial pathogenicity by mediating methylation of transcription factor-encoding genes', '研究在4273个原核基因组中解析了I型限制修饰（RM）系统的进化轨迹：RMS构型经基因复制、水平基因转移与丢失形成并稳定遗传；多组学分析揭示RMS通过DNA甲基化调控转录因子表达，进而调节鞭毛与趋化基因、增强细菌毒力与感染能力。', 'Research', '论文', '限制修饰系统 · DNA甲基化 · 细菌毒力 · 多组学', '1', '重点进展 · 2025.07', 'files/papers/gkaf659.docx', '0'],
  ['2025-10-14', '蛋白质语言模型显著提升毒力因子预测能力', 'Advancing virulence factor prediction using protein language models', '团队构建基于蛋白质语言模型的新方法，在细菌毒力因子预测任务上取得显著提升，为病原监测与预警提供新的计算工具。', 'Research', '论文', '毒力因子 · 蛋白质语言模型 · 机器学习', '0', '', 'files/papers/Liu2025_VirulenceFactorPrediction.docx', '1'],
  ['2024-12-30', '多拷贝亚端粒基因决定隐孢子虫人源亚型的动物感染性', 'Multicopy subtelomeric genes underlie animal infectivity of divergent Cryptosporidium hominis subtypes', '与华南农业大学、中国农业大学合作在Nature Communications发表论文：多拷贝亚端粒基因是不同隐孢子虫人源亚型获得动物感染能力的关键遗传基础，为理解病原宿主范围演化提供新视角。', 'Research', '论文', '隐孢子虫 · 亚端粒基因 · 宿主适应性', '0', '', 'files/papers/Huang2024_Multicopy.docx', '2'],
  ['2023-04-27', 'PlaASDB：植物胁迫响应可变剪接综合数据库发布', 'PlaASDB: a comprehensive database of plant alternative splicing events in response to stress', '构建整合拟南芥与水稻胁迫响应可变剪接与基因表达数据的综合数据库，支持胁迫生物学研究。', 'Resource', '数据资源', '数据库 · 可变剪接 · 胁迫响应', '0', '', 'files/papers/Guo2023_PlaASDB.docx', '3'],
  ['2025-01-01', '团队获批国家自然科学基金青年项目', '高传播力微小隐孢子虫IIaA15G2R1亚型的产生机制', '王天鹏主持的国家自然科学基金青年项目（32402919）获批，聚焦高传播力微小隐孢子虫亚型的产生机制，为隐孢子虫病监测与防控提供理论依据。', 'Project', '项目', '隐孢子虫 · 国家自然科学基金', '0', '', '', '4'],
  ['2024-09-01', '团队指导学生获全国大学生生命科学竞赛国家级一等奖', '第九届全国大学生生命科学竞赛（创新创业类）国家级一等奖', '李宏老师指导学生在第九届全国大学生生命科学竞赛（创新创业类）中获国家级一等奖，展现团队在人才培养与科研创新方面的综合实力。', 'Team', '团队动态', '竞赛 · 教学成果', '0', '', '', '5'],
]
for (const row of updates) u.run(...row)

const m = db.prepare(`INSERT INTO members (name, name_en, role, position, email, website, bio, photo, avatar_text, detail, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
const members = [
  {
    name: '李宏', name_en: 'Hong Li', role: 'PI', position: '副教授、博士生导师',
    email: '', website: 'https://slhs.hainanu.edu.cn/info/1022/19443.htm',
    bio: '利用机器学习和多组学分析手段，解析病原菌的致病与耐药机制，挖掘治疗疾病的关键生物活性肽。',
    photo: '/assets/members/li-hong.png', avatar_text: '李', sort_order: 0,
    detail: {
      sections: [
        { title: '个人基本情况', items: [
          '李宏，女，海南大学副教授，博士生导师'
        ] },
        { title: '教育背景', items: [
          '2013/09-2018/06，中国农业大学，生物学院，生物信息，博士，导师：张子丁',
          '2008/09-2013/06，哈尔滨医科大学，生物信息科学与技术学院，生物技术（生物医学软件工程方向），学士'
        ] },
        { title: '主要研究方向', items: [
          '利用机器学习和多组学分析手段，解析病原菌的致病和耐药机制',
          '挖掘治疗疾病的关键生物活性肽'
        ] },
        { title: '教学情况', items: [
          '主讲本科生《生物信息学》、研究生《基因组学与生物信息学》课程'
        ] },
        { title: '主持科研项目', items: [
          '国家自然科学基金地区项目，32460244，整合多组学数据探究I型限制修饰系统的进化历史和调控毒力的分子机制，2025/01-2028/12',
          '国家自然科学基金地区项目，32060153，基于多组学分析探索维氏气单胞菌毒力蛋白动态相互作用的分子机制，2021/01-2024/12',
          '海南省自然科学基金面上项目，225MS009，DNA甲基化修饰介导I型限制修饰系统调控维氏气单胞菌毒力的机制，2025/03-2028/02',
          '海南省自然科学基金高层次人才项目，322RC589，耐硼赖氨酸芽孢杆菌对罗非鱼的促生作用及机制研究，2022/04-2025/03',
          '海南省自然科学基金青年基金项目，319QN161，维氏气单胞菌毒力因子的挖掘及侵染宿主机制的分析，2019/03-2021/12',
          '海南大学科研启动基金项目，KYQD(ZR)1929，维氏气单胞菌-罗非鱼蛋白质互作机制的探究，2019/01-2023/12'
        ] },
        { title: '第一或通讯作者SCI论文（节选）', items: [
          'Ma J, Jiang X, Bi H, Li J, Ma X, Chi X, Tang Y, Liu Z*, and Li H*. Horizontal acquisition of the Type I restriction-modification system enhances bacterial pathogenicity by mediating methylation of transcription factor-encoding genes. Nucleic Acids Research, 2025, 53(13): gkaf659.',
          'Liu Y, Cao X, Li J, Li T, Li J, Ma X, Chi X, Tang Y, Liu Z*, and Li H*. Advancing virulence factor prediction using protein language models. BMC Biology, 2025, 10.1186/s12915-025-02374-w.',
          'Lu Z, Li A, Sheng Q, Ma X, Tang Y, Li J, Chi X, Liu Z*, and Li H*. Time-series transcriptomic analysis of Nile tilapia reveals the crucial roles of long non-coding RNA and transcription factor in response to Aeromonas veronii infection. BMC Genomics, 2025, 10.1186/s12864-025-11930-1.',
          'Zhao H, Ma J, Tang Y, Ma X, Li J, Li H*, and Liu Z*. Genome-wide DNA N6-methyladenosine in Aeromonas veronii and Helicobacter pylori. BMC Genomics, 2024, 25(1): 161.',
          'Ma J, Zhao H, Mo S, Li J, Ma X, Tang Y, Li H*, and Liu Z*. Acquisition of Type I methyltransferase via horizontal gene transfer increases the drug resistance of Aeromonas veronii. Microbial Genomics, 2023, 9(9): 001107.',
          'Tang Y, Lei J, Ma X, Li J, Li H*, and Liu Z*. Identification and characterization of a novel bacteriocin gene cluster in Lysinibacillus boronitolerans. Biotechnology and Applied Biochemistry, 2023, 70(6): 1860-1869.',
          'Li H, Ma X, Tang Y, Wang D, Zhang Z, and Liu Z.* Network-based analysis of virulence factors for uncovering Aeromonas veronii pathogenesis. BMC Microbiology, 2021, 21: 188.',
          'Li H, Ma X, Tang Y, Yan C, Hu X, Huang X, Lin M, and Liu Z.* Integrated analysis reveals an association between the rhizosphere microbiome and root rot of arecanut palm. Pedosphere, 2021, 31(5): 725-735.',
          'Li H, Jiang S, Li C, Liu L, Lin Z, He H, Deng XW, Zhang Z*, and Wang X*. The hybrid protein interactome contributes to rice heterosis as epistatic effects. Plant Journal, 2020, 102: 116-128.',
          'Yang X, Yang S, Qi H, Wang T, Li H*, and Zhang Z*. PlaPPISite: a comprehensive resource for plant protein-protein interaction sites. BMC Plant Biology, 2020, 20: 61.',
          'Li H, Yan C, Tang Y, Ma X, Chen Y, Chen S, Lin M, and Liu Z. Endophytic bacterial and fungal microbiota in different cultivars of cassava (Manihot esculenta Crantz). Journal of Microbiology, 2020, 58: 614-623.',
          'Li H, Zhou Y, and Zhang Z. Network analysis reveals a common host-pathogen interaction pattern in Arabidopsis immune responses. Frontiers in Plant Science, 2017, 8: 893-893.',
          'Li H, Yang S, Wang C, Zhou Y, and Zhang Z. AraPPISite: a database of fine grained protein-protein interaction site annotations for Arabidopsis thaliana. Plant Molecular Biology, 2016, 92: 105-116.',
          'Li H, and Zhang Z. Systems understanding of plant-pathogen interactions through genome-wide protein-protein interaction networks. Frontiers of Agricultural Science and Engineering, 2016, 3: 102-112.',
          'Li H, Zhou Y, and Zhang Z. Competition-cooperation relationship networks characterize the competition and cooperation between proteins. Scientific Reports, 2015, 5: 11619.'
        ] },
        { title: '授权专利', items: [
          '李宏，曹欣，刘柱，陈银华，马香，王丹，唐燕琼，高玉晓，胡新文。耐硼赖氨酸芽孢杆菌在抑制火龙果软腐病菌生长方面的应用。专利号：ZL202111280400.9，授权公告日：2023年02月03日。',
          '李宏，高玉晓，刘柱，马香，唐燕琼，晏承梁，雷军霞，林敏。一种耐硼赖氨酸芽孢杆菌作为底盘细胞制备的槟榔根腐病杀菌剂。专利号：ZL201910963026.9，授权公告日：2022年12月02日。',
          '李宏，徐一轲，刘柱，马香，唐燕琼，盛强龙，孙愉宸。一种维氏气单胞菌减毒菌株的构建方法、菌株及其应用。专利号：ZL201910841507.2，授权公告日: 2021年09月21日。',
          '刘柱，陈银华，曹欣，马香，王丹，李宏，唐燕琼，唐鸿倩，高玉晓，林敏。一种芒果蒂腐病菌杀菌剂及其应用。专利号：ZL202110816707.X，授权公告日：2023年03月14日。',
          '唐燕琼，高玉晓，马香，刘柱，李宏，晏承梁，雷军霞，林敏。一种耐硼赖氨酸芽孢杆菌作为底盘细胞制备的水稻纹枯病杀菌剂。专利号：ZL201910963022.0，授权公告日：2022年12月02日。',
          '刘柱，晏承梁，马香，唐燕琼，李宏，高玉晓，林敏。一种耐硼赖氨酸芽孢杆菌作为底盘细胞制备的稻瘟病杀菌剂。专利号：ZL201910963020.1，授权公告日：2021年06月22日。'
        ] },
        { title: '荣誉奖励（节选）', items: [
          '2025年，第十届全国大学生生命科学竞赛（科学探究类），国家级三等奖，指导教师',
          '2024年，第九届全国大学生生命科学竞赛（创新创业类），国家级一等奖，指导教师',
          '2024年，第九届全国大学生生命科学竞赛（科学探究类），国家级二等奖，指导教师',
          '2023年，第六届全国高校青年教师教学竞赛，国家级三等奖',
          '2023年，海南省科技进步二等奖：淡水鱼养殖中细菌性病害综合防控关键技术及应用',
          '2022年，海南省首届"优秀研究生导师团队"',
          '2022年，第十二届海南省高校青年教师教学竞赛，理科组二等奖',
          '2022年，第四届海南大学青年教师"教学能手"选拔赛，理科组二等奖',
          '2020年，海南大学教学成果奖二等奖'
        ] },
        { title: '社会兼职', items: [
          '担任Frontiers in Cellular and Infection Microbiology期刊客座主编，生物工程学报、微生物学报、生物信息学、BMC Genomics、BMC Microbiology、International Journal of Clinical Virology、Archives of Microbiology期刊审稿人，全国大学生生命科学竞赛网络评审专家。'
        ] }
      ],
    },
  },
  {
    name: '王天鹏', name_en: 'Tianpeng Wang', role: 'PI', position: '副研究员、博士生/硕士生导师',
    email: 'tpwang@hainanu.edu.cn', website: 'https://slhs.hainanu.edu.cn/info/1022/12843.htm',
    bio: '围绕"同一健康"理念开展人兽共患病原的生物信息学研究，解析宿主—媒介/环境—病原的相互作用、传播及演化过程。',
    photo: '/assets/members/wang-tianpeng.png', avatar_text: '王', sort_order: 1,
    detail: {
      sections: [
        { title: '个人基本情况', items: [
          '王天鹏，男，理学博士，中共党员，海南大学生命健康学院副研究员。'
        ] },
        { title: '教育工作经历', items: [
          '2013.09-2017.06 贵州大学，生命科学学院，生物科学，本科',
          '2017.09-2023.01 中国农业大学，生物学院，生物信息学，直博研究生',
          '2023.03-2025.02 华南农业大学-韶关学院博士后创新实践基地博士后',
          '2025年至今 海南大学，生命健康学院，副研究员'
        ] },
        { title: '科研情况和研究方向', items: [
          '围绕"同一健康"的理念，致力于人兽共患病原的生物信息学研究，以解析宿主-媒介/环境-病原的相互作用、传播及演化过程，为疾病监测、预警及防控提供新角度新思路，包括比较基因组学、群体遗传学、转录组学、宏基因/转录组学、机器学习及数据库构建等。',
          '主要研究方向：新发和突发病原的监测、预警及防控；病原演化及传播动态；病原-媒介（环境）-宿主的相互作用'
        ] },
        { title: '主持科研项目', items: [
          '国家自然科学基金青年项目（32402919），高传播力微小隐孢子虫IIaA15G2R1亚型的产生机制，主持，30万元，2025.01-2027.12，在研',
          '中国博士后科学基金第17批特别资助（2024T170289），主持，18万元，已结题',
          '中国博士后科学基金第73批博士后科学基金面上项目（2023M731144），主持，8万元，已结题'
        ] },
        { title: '发表论文情况（并列第一作者；*通讯作者）', items: [
          'Tianpeng Wang, Chengyi Chen, Qi Wang, Wanyi Huang, Tianyi Hou, Falei Li, Gaoming Lou, Na Li, Lihua Xiao, Yaoyu Feng, Jiayu Li*, Yaqiong Guo*. The first draft genome of Cryptosporidium serpentis reveals metabolic divergence from intestinal Cryptosporidium species. International Journal for Parasitology, 2025, 10.1016/j.ijpara.2025.07.003.',
          'Tianpeng Wang, Ziding Zhang, Yaoyu Feng*, Lihua Xiao*. Analytic approaches in genomic epidemiological studies of parasitic protozoa. Transboundary and Emerging Diseases, 2024, 7679727 (2024).',
          'Wanyi Huang1, Wei He1, Yue Huang1, Yongping Tang, Ming Chen, Lianbei Sun, Zuwei Yang, Tianyi Hou, Huimin Liu, Haoyu Chen, Tianpeng Wang, Na Li, Yaqiong Guo*, Lihua Xiao*, Yaoyu Feng*. Multicopy subtelomeric genes underlie animal infectivity of divergent Cryptosporidium hominis subtypes. Nature Communications, 15, 10774 (2024).',
          'Xiaokun Guo, Tianpeng Wang*, Linyang Jiang, Huan Qi, Ziding Zhang*. PlaASDB: a comprehensive database of plant alternative splicing events in response to stress. BMC Plant Biology, 23, 225 (2023).',
          'Zhinan Lin, Yuqi Huang, Sihan Liu, Qiwen Huang, Biliang Zhang, Tianpeng Wang, Ziding Zhang, Xiaowei Zhu, Chenghong Liao*, Qian Han*. Gene coexpression network during ontogeny in the yellow fever mosquito, Aedes aegypti. BMC Genomics, 24(1), 301 (2023).',
          'Tianpeng Wang1, Yaqiong Guo1, Dawn M. Roellig, Na Li, Mónica Santín, Jason Lombard, Martin Kváč, Doaa Naguib, Ziding Zhang*, Yaoyu Feng*, and Lihua Xiao*. Sympatric recombination in zoonotic Cryptosporidium leads to emergence of populations with modified host preference. Molecular Biology and Evolution, 39, msac150 (2022).',
          'Panyu Ren, Xiaodi Yang, Tianpeng Wang, Yunpeng Hou*, Ziding Zhang*. Proteome-wide prediction and analysis of the Cryptosporidium parvum protein-protein interaction network through integrative methods. Computational and Structural Biotechnology Journal, 20, 2322-2331 (2022).'
        ] },
        { title: '荣誉奖励', items: [
          '2024年获中国畜牧兽医学会兽医寄生虫学分会第18次学术研讨会优秀学术论文二等奖',
          '2023年获北京市普通高等学校优秀毕业生',
          '2023年获中国农业大学2023届优秀毕业生',
          '2022年获宝钢优秀学生奖学金获得者'
        ] },
        { title: '寄语', items: [
          '保持一颗赤子之心！务实、求真、努力、进步！欢迎各位一起交流学习~'
        ] }
      ],
    },
  },
]
for (const row of members) {
  m.run(row.name, row.name_en, row.role, row.position, row.email, row.website, row.bio, row.photo, row.avatar_text, JSON.stringify(row.detail), row.sort_order)
}

db.close()
