// O*NET Mini Interest Profiler, Appendix A: https://www.onetcenter.org/dl_files/Mini-IP.pdf
// Source: U.S. Department of Labor/Employment and Training Administration.
// Used under the O*NET Tools Developer License: https://www.onetcenter.org/license_tools.html
// Malay and Mandarin translations are by Skilytics and are not independently validated.
// IDs 101-130 distinguish these items from the former self-authored 1-30 questionnaire.
// USDOL/ETA has not approved, endorsed, or tested these modifications.
export type RiasecType = "R" | "I" | "A" | "S" | "E" | "C";
export const RIASEC_QUESTIONS: { id: number; type: RiasecType; text: string; textMs: string; textZh: string }[] = [
  { id: 101, type: "R", text: "Build kitchen cabinets", textMs: "Membina kabinet dapur", textZh: "制作厨房橱柜" },
  { id: 102, type: "I", text: "Develop a new medicine", textMs: "Membangunkan ubat baharu", textZh: "研发新药" },
  { id: 103, type: "A", text: "Write books or plays", textMs: "Menulis buku atau skrip teater", textZh: "写书或剧本" },
  { id: 104, type: "S", text: "Help people with personal or emotional problems", textMs: "Membantu orang yang menghadapi masalah peribadi atau emosi", textZh: "帮助有个人或情绪困扰的人" },
  { id: 105, type: "E", text: "Manage a department within a large company", textMs: "Mengurus jabatan dalam syarikat besar", textZh: "管理大公司中的一个部门" },
  { id: 106, type: "C", text: "Install software across computers on a large network", textMs: "Memasang perisian pada komputer dalam rangkaian besar", textZh: "为大型网络中的计算机安装软件" },
  { id: 107, type: "R", text: "Repair household appliances", textMs: "Membaiki peralatan rumah", textZh: "维修家用电器" },
  { id: 108, type: "I", text: "Study ways to reduce water pollution", textMs: "Mengkaji cara mengurangkan pencemaran air", textZh: "研究减少水污染的方法" },
  { id: 109, type: "A", text: "Compose or arrange music", textMs: "Menggubah atau menyusun muzik", textZh: "作曲或编曲" },
  { id: 110, type: "S", text: "Give career guidance to people", textMs: "Memberi bimbingan kerjaya kepada orang ramai", textZh: "为他人提供职业指导" },
  { id: 111, type: "E", text: "Start your own business", textMs: "Memulakan perniagaan sendiri", textZh: "创办自己的企业" },
  { id: 112, type: "C", text: "Operate a calculator", textMs: "Menggunakan kalkulator", textZh: "使用计算器" },
  { id: 113, type: "R", text: "Assemble electronic parts", textMs: "Memasang komponen elektronik", textZh: "组装电子零件" },
  { id: 114, type: "I", text: "Conduct chemical experiments", textMs: "Menjalankan eksperimen kimia", textZh: "进行化学实验" },
  { id: 115, type: "A", text: "Create special effects for movies", textMs: "Menghasilkan kesan khas untuk filem", textZh: "为电影制作特效" },
  { id: 116, type: "S", text: "Perform rehabilitation therapy", textMs: "Menjalankan terapi pemulihan", textZh: "进行康复治疗" },
  { id: 117, type: "E", text: "Negotiate business contracts", textMs: "Merunding kontrak perniagaan", textZh: "谈判商业合同" },
  { id: 118, type: "C", text: "Keep shipping and receiving records", textMs: "Menyimpan rekod penghantaran dan penerimaan barang", textZh: "保存发货和收货记录" },
  { id: 119, type: "R", text: "Drive a truck to deliver packages to offices and homes", textMs: "Memandu trak untuk menghantar bungkusan ke pejabat dan rumah", textZh: "驾驶卡车向办公室和住家递送包裹" },
  { id: 120, type: "I", text: "Examine blood samples using a microscope", textMs: "Memeriksa sampel darah menggunakan mikroskop", textZh: "用显微镜检查血液样本" },
  { id: 121, type: "A", text: "Paint sets for plays", textMs: "Melukis set pentas untuk pementasan teater", textZh: "为舞台剧绘制布景" },
  { id: 122, type: "S", text: "Do volunteer work at a non-profit organization", textMs: "Menjadi sukarelawan di pertubuhan bukan untung", textZh: "在非营利组织做志愿工作" },
  { id: 123, type: "E", text: "Market a new line of clothing", textMs: "Memasarkan rangkaian pakaian baharu", textZh: "推广新的服装系列" },
  { id: 124, type: "C", text: "Inventory supplies using a hand-held computer", textMs: "Merekod inventori bekalan menggunakan komputer genggam", textZh: "使用手持电脑清点物资" },
  { id: 125, type: "R", text: "Test the quality of parts before shipment", textMs: "Menguji kualiti komponen sebelum penghantaran", textZh: "在发货前检测零件质量" },
  { id: 126, type: "I", text: "Develop a way to better predict the weather", textMs: "Membangunkan cara untuk meramal cuaca dengan lebih tepat", textZh: "开发更准确的天气预测方法" },
  { id: 127, type: "A", text: "Write scripts for movies or television shows", textMs: "Menulis skrip untuk filem atau rancangan televisyen", textZh: "为电影或电视节目编写剧本" },
  { id: 128, type: "S", text: "Teach a high-school class", textMs: "Mengajar kelas sekolah menengah", textZh: "教授高中课程" },
  { id: 129, type: "E", text: "Sell merchandise at a department store", textMs: "Menjual barangan di gedung serbaneka", textZh: "在百货商店销售商品" },
  { id: 130, type: "C", text: "Stamp, sort, and distribute mail for an organization", textMs: "Mengecap, mengisih dan mengedarkan surat untuk sesebuah organisasi", textZh: "为机构盖章、分类和分发邮件" },
];
