import type { Competitor, EventItem, IndustryTheme, KejieImplication, ProductMove, SourceMaterial, Viewpoint } from './types';

export const competitors: Competitor[] = [
  { id: 'zhipu', name: '智谱', type: '模型厂商', logo: 'Z', status: '正在链接', cooperation: '建议推进联合方案', summary: '从 GLM 模型能力延伸到 AutoGLM、GUI Agent、地方政府和国资生态合作。', tags: ['大模型', '地方国资', 'Agent'] },
  { id: 'deepseek', name: 'DeepSeek', type: '模型厂商', logo: 'D', status: '重点适配', cooperation: '模型能力底座', summary: '以高性价比模型与开源生态扩散为核心，适合作为多模型适配对象。', tags: ['开源生态', '低成本推理', '模型适配'] },
  { id: 'huawei', name: '华为昇腾', type: '算力/云', logo: 'H', status: '重点生态', cooperation: '国产算力适配', summary: '围绕昇腾、Agentic Infra、ModelArts、行业云形成全栈生态。', tags: ['国产算力', '云平台', 'Agentic Infra'] },
  { id: 'sugon', name: '中科曙光', type: '算力厂商', logo: 'S', status: '已在合作适配', cooperation: '联合市场与交付', summary: '具备高端计算、存储、智算中心和算力服务能力，适合形成算力+数据联合方案。', tags: ['智算中心', '信创', '联合方案'] },
  { id: 'hygon', name: '海光', type: '芯片厂商', logo: '海', status: '建议纳入适配', cooperation: '国产芯片生态', summary: '国产 CPU/GPU 生态的重要成员，可纳入科杰算力适配矩阵。', tags: ['国产芯片', '适配矩阵'] },
  { id: 'iluvatar', name: '天数智芯', type: '芯片厂商', logo: '天', status: '已在合作适配', cooperation: '推理/训练适配', summary: '国产 GPU 厂商，建议沉淀与 KeenData、KeenClaw 相关的性能与成本基线。', tags: ['国产GPU', '已适配'] },
  { id: 'tsingmicro', name: '清微智能', type: '芯片厂商', logo: '清', status: '建议观察', cooperation: '异构算力评估', summary: '可作为异构算力调度与国产芯片生态观察对象。', tags: ['异构算力', '芯片生态'] },
  { id: 'databricks', name: 'Databricks', type: '国际数据基础设施', logo: 'DB', status: '国际对标', cooperation: '对标研究', summary: '从 Lakehouse 走向 Data Intelligence Platform、Agent Bricks 与企业 AI 工作负载。', tags: ['Lakehouse', 'Agent Bricks', 'Unity Catalog'] },
  { id: 'snowflake', name: 'Snowflake', type: '国际数据基础设施', logo: 'SF', status: '国际对标', cooperation: '对标研究', summary: '从 Data Cloud 走向 Cortex、CoWork、共享上下文和 Agentic Enterprise。', tags: ['Cortex', 'CoWork', '共享上下文'] },
  { id: 'transwarp', name: '星环科技', type: '专业基础软件', logo: '星', status: '重点竞合', cooperation: '国内直接对标', summary: '国产大数据基础软件和 AI-ready 数据平台方向，是更直接的专业型对标对象。', tags: ['全栈数据平台', 'AI-ready'] },
  { id: 'alicloud', name: '阿里云', type: '云与平台型厂商', logo: '阿', status: '重点观察', cooperation: '云生态与模型适配', summary: '围绕通义、百炼、数据平台和政企云形成全栈打法。', tags: ['通义', '百炼', 'DataWorks'] },
  { id: 'tencentcloud', name: '腾讯云', type: '云与平台型厂商', logo: '腾', status: '重点观察', cooperation: '行业云与智能体生态', summary: '关注混元、智能体平台和政企行业云协同。', tags: ['混元', '智能体', '行业云'] },
  { id: 'baiducloud', name: '百度智能云', type: '云与平台型厂商', logo: '百', status: '重点观察', cooperation: '千帆与产业智能', summary: '关注千帆平台、文心模型及工业智能落地。', tags: ['文心', '千帆', '产业智能'] },
  { id: 'moonshot', name: 'Kimi', type: '模型厂商', logo: 'K', status: '观察中', cooperation: '长文本与 Agent 能力观察', summary: '关注长上下文、搜索和 Agent 产品化路径。', tags: ['长上下文', '搜索', 'Agent'] },
  { id: 'minimax', name: 'MiniMax', type: '模型厂商', logo: 'M', status: '观察中', cooperation: '多模态模型适配', summary: '关注多模态、语音和智能体产品迭代。', tags: ['多模态', '语音', 'Agent'] },
  { id: 'nvidia', name: 'NVIDIA', type: '算力/芯片厂商', logo: 'N', status: '国际对标', cooperation: 'AI Factory 与推理栈研究', summary: '关注 AI Factory、NIM、推理优化和企业 AI 全栈。', tags: ['AI Factory', 'NIM', '推理'] },
  { id: 'cambricon', name: '寒武纪', type: '算力/芯片厂商', logo: '寒', status: '建议适配', cooperation: '国产芯片适配矩阵', summary: '纳入国产训推一体适配与性能基线。', tags: ['国产芯片', '训推一体'] },
  { id: 'muxi', name: '沐曦', type: '算力/芯片厂商', logo: '沐', status: '建议接触', cooperation: '国产 GPU 生态', summary: '关注通用 GPU、智算中心和软件栈兼容。', tags: ['国产GPU', '智算中心'] },
  { id: 'moorethreads', name: '摩尔线程', type: '算力/芯片厂商', logo: '摩', status: '观察中', cooperation: '国产 GPU 生态', summary: '跟踪全功能 GPU 与智算集群产品路线。', tags: ['国产GPU', '智算集群'] },
  { id: 'palantir', name: 'Palantir', type: '国际数据基础设施', logo: 'P', status: '国际对标', cooperation: 'Ontology 与 AIP 研究', summary: '以 Ontology 连接数据、业务对象、决策和行动。', tags: ['Ontology', 'AIP', '行动闭环'] },
  { id: 'scaleai', name: 'Scale AI', type: '国际数据基础设施', logo: 'S', status: '国际对标', cooperation: '高质量数据集研究', summary: '关注数据标注、评测、数据引擎和模型应用体系。', tags: ['数据引擎', '评测集', '高质量数据集'] },
  { id: 'deepexi', name: '滴普科技', type: '专业基础软件', logo: '滴', status: '重点竞合', cooperation: '国内产品迭代对标', summary: '跟踪 FastData、FastAGI 与数字员工产品线。', tags: ['FastData', 'FastAGI', '数字员工'] },
  { id: 'kangaroo', name: '袋鼠云', type: '专业基础软件', logo: '袋', status: '国内对标', cooperation: '数据开发治理对标', summary: '跟踪数据开发、治理、指标和智能化产品升级。', tags: ['数据治理', '指标平台', '智能开发'] },
  { id: 'fanruan', name: '帆软', type: '数据应用厂商', logo: '帆', status: '国内对标', cooperation: 'BI 到智能决策观察', summary: '关注 BI、数据运营和智能问数的产品演进。', tags: ['BI', '智能问数', '数据运营'] },
  { id: 'datablau', name: '数语科技', type: '数据治理厂商', logo: '数', status: '观察中', cooperation: '治理与元数据对标', summary: '关注数据治理、元数据和知识图谱产品能力。', tags: ['数据治理', '元数据', '知识图谱'] }
];

export const events: EventItem[] = [
  { id: 'e1', company: '智谱', date: '2026-07-02', type: '战略合作', title: '强化地方政府与国资合作打法', summary: '围绕地方政务、国资平台和产业应用形成模型+场景+生态的联合打法。', source: '公众号 / 官网材料', impact: '高', tags: ['地方国资', '模型生态'], heat: 92 },
  { id: 'e2', company: '中科曙光', date: '2026-06-29', type: '合作适配', title: '算力底座与 AI 数据基础设施联合方案推进', summary: '建议围绕智算中心、信创底座、湖仓一体和智能体应用形成联合市场包。', source: '内部合作进展', impact: '高', tags: ['已适配', '联合方案'], heat: 88 },
  { id: 'e3', company: '天数智芯', date: '2026-06-26', type: '技术适配', title: '国产 GPU 适配进入清单化管理', summary: '建议形成模型训推、数据处理、KeenClaw 场景的性能与成本基线。', source: '内部合作进展', impact: '中', tags: ['国产GPU', '适配矩阵'], heat: 76 },
  { id: 'e4', company: 'Snowflake', date: '2026-06-20', type: '产品发布', title: '强化共享上下文与 CoWork 表达', summary: '数据平台从分析工具上移到 Agent 可理解、可调用、可控制的企业上下文。', source: 'Summit / 行业观察', impact: '高', tags: ['共享上下文', 'Agentic Enterprise'], heat: 90 },
  { id: 'e5', company: 'Databricks', date: '2026-06-15', type: '产品发布', title: 'Agent Bricks 与 Genie 工作流继续扩张', summary: 'Lakehouse 能力向企业智能体构建、评测和业务入口延伸。', source: '官方发布', impact: '中', tags: ['Agent Bricks', 'Data Intelligence'], heat: 82 },
  { id: 'e6', company: 'DeepSeek', date: '2026-06-10', type: '生态扩散', title: '开源模型继续成为企业多模型适配重点', summary: '高性价比推理和开源生态使其适合作为科杰多模型路由与行业方案底座之一。', source: '行业文章', impact: '中', tags: ['多模型', '开源生态'], heat: 79 }
];

export const themes: IndustryTheme[] = [
  { id: 't1', name: 'AI 数据基础设施', hot: 92, delta: 12, companies: ['科杰', 'Databricks', 'Snowflake', '星环'], expressions: ['Agent-ready', 'Data&AI 一体化', '共享上下文'], summary: '数据平台正在从“服务人看数据”升级为“服务 AI 和智能体用数据”。' },
  { id: 't2', name: 'Agent 生态', hot: 88, delta: 9, companies: ['OpenAI', 'Anthropic', '智谱', '腾讯'], expressions: ['数字员工', '任务执行入口', 'Agent 控制平面'], summary: 'Agent 成为算力、模型、数据三层共同争夺的前台入口。' },
  { id: 't3', name: '企业认知模型', hot: 86, delta: 8, companies: ['Palantir', 'Snowflake', '科杰'], expressions: ['Ontology', '企业上下文', '数据认知×业务认知×行动认知'], summary: '企业 AI 落地从知识库问答进入组织级上下文和行动体系。' },
  { id: 't4', name: '可信数据空间', hot: 82, delta: 6, companies: ['国家数据局', '地方数产集团', '科杰'], expressions: ['可用不可见', '数据流通', '智能结果交易'], summary: '可信数据空间正在从数据共享机制走向模型、工具、智能体和场景协同机制。' },
  { id: 't5', name: '国产算力生态', hot: 78, delta: 7, companies: ['华为昇腾', '曙光', '海光', '天数智芯', '清微智能'], expressions: ['异构算力调度', '信创适配', '推理成本基线'], summary: '国产算力正在从硬件供给走向算力、模型、数据和 Agent 的联合适配。' },
  { id: 't6', name: '高质量数据集', hot: 76, delta: 5, companies: ['科杰', 'Scale AI', '行业链主'], expressions: ['AI 燃料工程', '训练/验证/评测集', '持续运营'], summary: '高质量数据集不再是申报材料，而是支撑模型和智能体持续进化的生产系统。' }
];

export const viewpoints: Viewpoint[] = [
  { id: 'v1', title: 'Agent 不是应用热词，而是新的任务入口', source: '算力/模型/数据三层厂商动态', rawExpression: 'Agentic Enterprise / AI Factory / Agent Toolkit', kejieRewrite: 'Agent 是 AI 产业链的新任务入口、价值出口和控制界面；科杰应以 KeenClaw 承接组织级行动入口。', scenes: ['领导汇报', '客户方案', '公众号'], status: '母版候选' },
  { id: 'v2', title: '企业认知模型可升级为共享企业上下文', source: 'Snowflake / Palantir / Databricks', rawExpression: 'Context / Ontology / Unity Catalog', kejieRewrite: '企业认知模型不是知识库，而是让不同 Agent 共享企业数据、业务语义、流程规则、角色权限和行动经验的组织级上下文系统。', scenes: ['产品表达', 'KeenClaw', '可信数据空间'], status: '母版候选' },
  { id: 'v3', title: 'AI 数据基础设施要从后台平台走向行动系统', source: '国际数据厂商上移动作', rawExpression: '从数据云到 Agentic Enterprise', kejieRewrite: '科杰不只交付数据底座，而是让数据持续变成智能、让智能进入流程、让流程产生收益的智能产能系统。', scenes: ['战略定位', '售前话术'], status: '已发布' },
  { id: 'map1-1', title: '竞争焦点正从模型能力转向产业生产力', source: 'Map1｜数据重构', rawExpression: 'AI 上半场是模型突破，下半场是产业系统重构。', kejieRewrite: '未来真正决定产业价值的，不是谁的模型参数更多，而是谁能让 AI 进入产业、流程和业务并持续产生价值。', scenes: ['领导汇报', '战略定位'], status: '母版候选', confidence: '高', mapBranch: '1. 时代判断', reasoning: ['模型能力逐步普及', '产业系统仍是落地瓶颈', '竞争单位从模型转向生产系统'] },
  { id: 'map1-2', title: 'AI 产业化的核心工程是数据重构', source: 'Map1｜数据重构', rawExpression: '记录型数据→生产型数据；孤岛型数据→流通型数据；报表型数据→行动型数据。', kejieRewrite: '数据不再只是业务记录物，而要成为可供模型、智能体和流程持续调用的智能生产资料。', scenes: ['产品架构', '客户方案'], status: '母版候选', confidence: '高', mapBranch: '3. 核心答案', reasoning: ['数据量不是目标', '业务记录需转化为生产资料', '数据服务对象从人扩展到模型与智能体'] },
  { id: 'map1-3', title: '科杰三层架构：数据、认知、行动', source: 'Map1｜数据重构', rawExpression: 'KeenData Lakehouse 解决数据底座；企业认知模型解决产业理解；KeenClaw 解决行动闭环。', kejieRewrite: '科杰以 AI 数据基础设施供给受治理数据，以企业认知模型沉淀组织上下文，以 KeenClaw 驱动智能体进入流程和行动闭环。', scenes: ['母版架构', '产品路线'], status: '母版候选', confidence: '高', mapBranch: '5. 三层重构', reasoning: ['数据可供给 AI', '组织上下文可被理解', '智能体可进入流程并被治理'] }
];

export const implications: KejieImplication[] = [
  { id: 'k1', category: '核心定位', title: '从软件公司升级为 AI 数据基础设施构建者', insight: '科杰的价值不应被压缩为数据中台或工具软件，而应面向大型组织和区域产业构建 AI 数据基础设施。', action: '统一对外口径：AI 数据基础设施 + 企业认知模型 + KeenClaw 智能体入口。', status: '母版候选' },
  { id: 'k2', category: '企业认知模型', title: '把企业认知模型升级为共享企业上下文', insight: '企业认知模型要承载数据认知、业务认知和行动认知，成为 Agent 复用的上下文底座。', action: '产品侧梳理业务对象、指标、规则、流程、角色权限等最小上下文模型。', status: '母版候选' },
  { id: 'k3', category: '产品架构', title: 'KeenClaw 定位为组织级入口和行动句柄', insight: 'KeenClaw 不宜被定义为普通聊天助手，而应作为连接数据底座、企业认知和业务行动的控制面。', action: '补齐任务编排、权限治理、效果评测、审计追踪和人工接管指标。', status: '已发布' },
  { id: 'k4', category: '可信数据空间', title: '可信数据空间可升级为可信智能生产空间', insight: '可信数据空间不仅解决数据流通，也可承载模型、工具、智能体和场景结果的可信协同。', action: '在方案中加入“数据产品 + 模型服务 + 智能体服务 + 场景运营”的表达。', status: '待审核', owner: '产品线/售前', priority: '高', productMoves: ['可信空间对象扩展到模型、工具、智能体', '增加结果交付与价值分润口径'] },
  { id: 'k5', category: '产品升级', title: '建立竞对产品迭代到科杰版本规划的映射', insight: '外部厂商每次从数据平台上移到语义、Agent 和行动闭环，都应形成科杰产品差距、版本动作和验收指标。', action: '建立 KeenData、企业认知模型、KeenClaw 三条产品演进看板，按月复盘。', status: '母版候选', owner: '产品线', priority: '高', productMoves: ['KeenData 增加 Agent-ready 数据产品目录', '企业认知模型补齐对象、指标、规则、流程、权限', 'KeenClaw 补齐 Skill 目录、评测、审计与人工接管'] }
];

export const sources: SourceMaterial[] = [
  { id: 's1', title: 'Snowflake Summit 26：Goodbye Data, Hello AI', publisher: 'InfoQ / 行业观察', importedAt: '2026-06-20', summary: 'Snowflake 将数据平台表达为共享上下文和 Agentic Enterprise 的底座。', tags: ['Snowflake', 'Agent-ready'] },
  { id: 's2', title: '智谱地方政府与国资生态合作观察', publisher: '微信公众号', importedAt: '2026-07-02', summary: '智谱从模型能力转向地方 AI 基础设施和产业融合。', tags: ['智谱', '地方政府'] },
  { id: 's3', title: '科杰数据重构：AI 产业化时代的新基建', publisher: '内部母版材料', importedAt: '2026-07-01', summary: '数据从业务记录物变成智能生产资料，算、数、模、行构成科杰架构主线。', tags: ['项目架构母版', '数据重构'] }
];

export const productMoves: ProductMove[] = [
  { id: 'pm1', product: 'KeenData Lakehouse', direction: 'Agent-ready 数据供给', competitorSignal: 'Databricks 以 Unity Catalog、Genie、Agent Bricks 连接数据治理与智能体开发。', currentGap: '数据资产与智能体可调用的数据产品之间缺少显式目录和质量门槛。', nextRelease: '增加 Agent 数据产品目录、上下文接口和训练/评测数据集流水线。', owner: '数据产品线', priority: 'P0' },
  { id: 'pm2', product: '企业认知模型', direction: '共享企业上下文', competitorSignal: 'Palantir Ontology、Snowflake Cortex 将数据对象、语义、权限与行动连接。', currentGap: '现有表达偏知识与语义，业务对象、流程规则、角色权限和行动经验尚未形成统一最小模型。', nextRelease: '发布认知模型 1.0：对象、指标、规则、流程、角色、权限、行动七类上下文。', owner: '认知产品线', priority: 'P0' },
  { id: 'pm3', product: 'KeenClaw', direction: '组织级 Agent 控制面', competitorSignal: '模型与数据厂商正在补齐 Skills、任务编排、评测、审计和人机协同。', currentGap: '入口表达清晰，但任务执行治理和效果评测仍需产品化。', nextRelease: '补齐 Skill 目录、任务编排、执行审计、效果评测、人工接管五个闭环。', owner: '智能体产品线', priority: 'P0' },
  { id: 'pm4', product: '可信数据空间', direction: '可信智能生产空间', competitorSignal: '行业从数据流通扩展到模型服务、智能体服务和场景结果协同。', currentGap: '方案仍偏数据共享和交易，智能服务的计量、审计与分润口径不足。', nextRelease: '增加模型/工具/智能体服务目录、结果交付凭证和价值分润规则。', owner: '方案产品线', priority: 'P1' },
  { id: 'pm5', product: '国产生态适配', direction: '算数模行适配矩阵', competitorSignal: '算力厂商通过 AI Factory 和整机方案向数据、模型与场景上移。', currentGap: '适配状态分散，缺少面向客户的性能、成本和可交付证明。', nextRelease: '按芯片/框架/模型/数据处理/Agent 场景形成兼容认证和基线报告。', owner: '生态合作部', priority: 'P1' }
];
