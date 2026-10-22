// Skilytics contextual RIASEC screener adapted from O*NET Interest Profiler activity domains.
// Source: U.S. Department of Labor/Employment and Training Administration.
// https://www.onetcenter.org/dl_files/Mini-IP.pdf
// O*NET Tools Developer License: https://www.onetcenter.org/license_tools.html
// Activities and translations adapted by Skilytics; this is not the validated Mini-IP.
// USDOL/ETA has not approved, endorsed, or tested these modifications.
// IDs 201-230 prevent answers to previous instruments from being reused.
export type RiasecType = "R" | "I" | "A" | "S" | "E" | "C";
export const RIASEC_QUESTIONS: { id: number; type: RiasecType; text: string; textMs: string; textZh: string }[] = [
  {"id":201,"type":"R","text":"Assemble or repair tools and equipment","textMs":"Memasang atau membaiki alatan dan peralatan","textZh":"组装或维修工具和设备"},
  {"id":202,"type":"I","text":"Investigate why a system or process is not working","textMs":"Menyiasat punca sistem atau proses tidak berfungsi","textZh":"调查系统或流程无法正常运作的原因"},
  {"id":203,"type":"A","text":"Design visuals for a product or campaign","textMs":"Mereka bentuk visual untuk produk atau kempen","textZh":"为产品或宣传活动设计视觉内容"},
  {"id":204,"type":"S","text":"Teach someone a new skill","textMs":"Mengajar seseorang kemahiran baharu","textZh":"教他人一项新技能"},
  {"id":205,"type":"E","text":"Persuade a client to support a proposal","textMs":"Meyakinkan pelanggan untuk menyokong cadangan","textZh":"说服客户支持一项提案"},
  {"id":206,"type":"C","text":"Organise files and records so they are easy to find","textMs":"Menyusun fail dan rekod supaya mudah dicari","textZh":"整理文件和记录以便查找"},
  {"id":207,"type":"R","text":"Install and test electrical or electronic components","textMs":"Memasang dan menguji komponen elektrik atau elektronik","textZh":"安装和测试电气或电子零件"},
  {"id":208,"type":"I","text":"Analyse data to identify patterns","textMs":"Menganalisis data untuk mengenal pasti pola","textZh":"分析数据以识别规律"},
  {"id":209,"type":"A","text":"Write stories, articles or scripts","textMs":"Menulis cerita, artikel atau skrip","textZh":"撰写故事、文章或剧本"},
  {"id":210,"type":"S","text":"Help people work through personal difficulties","textMs":"Membantu orang menangani kesukaran peribadi","textZh":"帮助他人应对个人困难"},
  {"id":211,"type":"E","text":"Lead a team towards a shared goal","textMs":"Memimpin pasukan ke arah matlamat bersama","textZh":"带领团队实现共同目标"},
  {"id":212,"type":"C","text":"Check documents and figures for errors","textMs":"Menyemak dokumen dan angka untuk mencari kesilapan","textZh":"检查文件和数字中的错误"},
  {"id":213,"type":"R","text":"Operate machines to make or move products","textMs":"Mengendalikan mesin untuk menghasilkan atau memindahkan produk","textZh":"操作机器制造或搬运产品"},
  {"id":214,"type":"I","text":"Run experiments to test an idea","textMs":"Menjalankan eksperimen untuk menguji idea","textZh":"通过实验检验想法"},
  {"id":215,"type":"A","text":"Create an original design for a space or object","textMs":"Menghasilkan reka bentuk asli untuk ruang atau objek","textZh":"为空间或物品创作原创设计"},
  {"id":216,"type":"S","text":"Guide someone who is choosing a career or course","textMs":"Membimbing seseorang memilih kerjaya atau kursus","textZh":"指导他人选择职业或课程"},
  {"id":217,"type":"E","text":"Start and manage a small business","textMs":"Memulakan dan mengurus perniagaan kecil","textZh":"创办并经营小型企业"},
  {"id":218,"type":"C","text":"Maintain accurate stock and delivery records","textMs":"Menyelenggara rekod stok dan penghantaran yang tepat","textZh":"维护准确的库存和配送记录"},
  {"id":219,"type":"R","text":"Inspect and maintain equipment at a workplace","textMs":"Memeriksa dan menyelenggara peralatan di tempat kerja","textZh":"检查和维护工作场所的设备"},
  {"id":220,"type":"I","text":"Research different solutions to a technical problem","textMs":"Mengkaji pelbagai penyelesaian bagi masalah teknikal","textZh":"研究技术问题的不同解决方法"},
  {"id":221,"type":"A","text":"Produce music, video or a performance","textMs":"Menghasilkan muzik, video atau persembahan","textZh":"创作音乐、视频或表演"},
  {"id":222,"type":"S","text":"Support people who need care or assistance","textMs":"Menyokong orang yang memerlukan penjagaan atau bantuan","textZh":"支持需要照顾或帮助的人"},
  {"id":223,"type":"E","text":"Negotiate an agreement with a supplier or customer","textMs":"Merunding persetujuan dengan pembekal atau pelanggan","textZh":"与供应商或客户协商达成协议"},
  {"id":224,"type":"C","text":"Prepare schedules and track deadlines","textMs":"Menyediakan jadual dan memantau tarikh akhir","textZh":"安排日程并跟进截止日期"},
  {"id":225,"type":"R","text":"Build or fix physical objects using hand tools","textMs":"Membina atau membaiki objek fizikal menggunakan alatan tangan","textZh":"使用手工工具制作或修理实物"},
  {"id":226,"type":"I","text":"Study how people, technology or nature work","textMs":"Mengkaji cara manusia, teknologi atau alam semula jadi berfungsi","textZh":"研究人类、技术或自然的运作方式"},
  {"id":227,"type":"A","text":"Develop creative concepts for a brand or service","textMs":"Menghasilkan konsep kreatif untuk jenama atau perkhidmatan","textZh":"为品牌或服务构思创意概念"},
  {"id":228,"type":"S","text":"Train colleagues or volunteers to do a task","textMs":"Melatih rakan sekerja atau sukarelawan menjalankan tugas","textZh":"培训同事或志愿者完成任务"},
  {"id":229,"type":"E","text":"Present a business idea to potential supporters","textMs":"Membentangkan idea perniagaan kepada bakal penyokong","textZh":"向潜在支持者介绍商业构想"},
  {"id":230,"type":"C","text":"Follow procedures to process forms or transactions","textMs":"Mengikut prosedur untuk memproses borang atau transaksi","textZh":"按照流程处理表格或交易"},
];
