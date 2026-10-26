import type { GradeContent, McqQuestion, PracticalTask } from "./types";

const mcq = (n: string, prompt: string, options: [string, string][], answer: string): McqQuestion => ({
  n,
  type: "mcq",
  points: 2,
  prompt,
  options,
  answer,
});

const units = [
  { name: "HTML баримтын бүтэц", questions: "1–3", points: 6 },
  { name: "Текст ба жагсаалт", questions: "4–5, 15", points: 8 },
  { name: "Холбоос ба зураг", questions: "6–8, 17", points: 10 },
  { name: "Хүснэгт", questions: "9", points: 2 },
  { name: "CSS үндэс ба сонгогч", questions: "10–12, 14", points: 8 },
  { name: "CSS загварчлал ба box model", questions: "13, 16", points: 6 },
];

type PracticalData = {
  title: string;
  image: string;
  emoji: string;
  p12: string;
  p13: string;
  p14: string;
  cls: string;
  p21: string;
  p22: string;
};

const practical = (d: PracticalData): PracticalTask[] => {
  const shared = {
    tools: ["web"] as PracticalTask["tools"],
    workspace: "site",
    files: { "index.html": "", "style.css": "" },
    images: { [d.image]: d.emoji },
  };
  return [
    {
      ...shared,
      n: "П1",
      title: `HTML хуудас «${d.title}»`,
      points: 30,
      prompt: `index.html файлд хуудсаа бичнэ. **${d.image}** зураг бэлэн байгаа.`,
      parts: [
        {
          n: "П1.1",
          text: `<!DOCTYPE html>, <html lang="mn">, <head> (<meta charset="UTF-8">, <title>${d.title}</title>), <body> бүхий бүтэц үүсгэнэ.`,
          points: 5,
          rubric: [
            { label: "DOCTYPE, html", points: 1 },
            { label: "meta charset", points: 2 },
            { label: "title, body зөв", points: 2 },
          ],
        },
        {
          n: "П1.2",
          text: d.p12,
          points: 9,
          rubric: [
            { label: "h1", points: 2 },
            { label: "2+ p", points: 3 },
            { label: "ul, 3+ li", points: 4 },
          ],
        },
        {
          n: "П1.3",
          text: d.p13,
          points: 9,
          rubric: [
            { label: "img src зөв, зураг харагдана", points: 3 },
            { label: "alt текст", points: 2 },
            { label: "a href зөв", points: 2 },
            { label: 'target="_blank"', points: 2 },
          ],
        },
        {
          n: "П1.4",
          text: d.p14,
          points: 7,
          rubric: [
            { label: "table, tr, td бүтэц зөв", points: 3 },
            { label: "th толгой мөр", points: 2 },
            { label: "3 өгөгдлийн мөр", points: 2 },
          ],
        },
      ],
    },
    {
      ...shared,
      n: "П2",
      title: "CSS загварчлал – гадаад файл",
      points: 30,
      prompt: "Бүх загвараа **style.css** файлд бичнэ.",
      parts: [
        {
          n: "П2.1",
          text: d.p21,
          points: 15,
          rubric: [
            { label: '<link rel="stylesheet" href="style.css"> зөв, CSS ажиллаж байна', points: 4 },
            { label: "body дүрэм (2+ шинж)", points: 3 },
            { label: "h1 дүрэм (2+ шинж)", points: 3 },
            { label: `class="${d.cls}" элемент ба .${d.cls} сонгогч`, points: 5 },
          ],
        },
        {
          n: "П2.2",
          text: d.p22,
          points: 15,
          rubric: [
            { label: "padding", points: 3 },
            { label: "border", points: 3 },
            { label: "border-radius", points: 2 },
            { label: "margin", points: 3 },
            { label: "Хүснэгтийн хүрээ (border, border-collapse)", points: 4 },
          ],
        },
      ],
    },
  ];
};

const grade9: GradeContent = {
  grade: 9,
  roman: "IX",
  topic: "HTML/CSS",
  sectionAMinutes: 20,
  sectionBMinutes: 40,
  notes: [
    "Хэсэгчлэн зөв гүйцэтгэлд шалгуурын оноог 0.5-ын нарийвчлалтай хувь тэнцүүлэн өгнө. Хоосон орхисон бол 0.",
  ],
  variants: {
    A: {
      units,
      sectionA: [
        mcq(
          "1",
          "HTML-ийн бүтэн нэр аль вэ?",
          [
            ["А", "High Tech Modern Language"],
            ["Б", "Home Text Making Language"],
            ["В", "HyperTool Multi Language"],
            ["Г", "HyperText Markup Language"],
          ],
          "Г",
        ),
        mcq(
          "2",
          "Хөтчийн таб дээр харагдах гарчгийг аль таг тодорхойлох вэ?",
          [["А", "<title>"], ["Б", "<h1>"], ["В", "<header>"], ["Г", "<head>"]],
          "А",
        ),
        mcq(
          "3",
          "Хэрэглэгчид харагдах бүх агуулга аль тагийн дотор бичигдэх вэ?",
          [["А", "<head>"], ["Б", "<body>"], ["В", "<meta>"], ["Г", "<title>"]],
          "Б",
        ),
        mcq(
          "4",
          "Хамгийн том (1-р түвшний) гарчгийн таг аль вэ?",
          [["А", "<big>"], ["Б", "<h6>"], ["В", "<h1>"], ["Г", "<header>"]],
          "В",
        ),
        mcq("5", "Дугаарласан жагсаалтын таг аль вэ?", [["А", "<ol>"], ["Б", "<ul>"], ["В", "<li>"], ["Г", "<dl>"]], "А"),
        mcq(
          "6",
          "Холбоосын зөв бичиглэл аль вэ?",
          [
            ["А", '<a href="https://num.edu.mn">МУИС</a>'],
            ["Б", '<href a="https://num.edu.mn">МУИС</href>'],
            ["В", "<a>https://num.edu.mn</a>"],
            ["Г", '<a link="https://num.edu.mn">МУИС</a>'],
          ],
          "А",
        ),
        mcq(
          "7",
          "`<img>` тагийн `alt` атрибутын зорилго юу вэ?",
          [
            ["А", "Зураг ачаалагдахгүй үед болон дэлгэц уншигчид зориулсан орлуулах текст"],
            ["Б", "Зургийн файлын замыг заах"],
            ["В", "Зургийн хэмжээг тогтоох"],
            ["Г", "Зургийг холбоос болгох"],
          ],
          "А",
        ),
        mcq(
          "8",
          "Холбоосыг шинэ табд нээх атрибут аль вэ?",
          [["А", 'rel="new"'], ["Б", 'target="_blank"'], ["В", 'open="tab"'], ["Г", 'target="_self"']],
          "Б",
        ),
        mcq("9", "Хүснэгтийн МӨРИЙН таг аль вэ?", [["А", "<td>"], ["Б", "<table>"], ["В", "<th>"], ["Г", "<tr>"]], "Г"),
        mcq(
          "10",
          "CSS-ийн бүтэн нэр аль вэ?",
          [
            ["А", "Cascading Style Sheets"],
            ["Б", "Colorful Style Sheets"],
            ["В", "Creative Style System"],
            ["Г", "Computer Style Sheets"],
          ],
          "А",
        ),
        mcq(
          "11",
          '`class="box"` элементүүдийг сонгох CSS сонгогч аль вэ?',
          [["А", "box"], ["Б", "*box"], ["В", ".box"], ["Г", "#box"]],
          "В",
        ),
        mcq(
          "12",
          "Гадаад style.css файлыг HTML-д холбох зөв мөр аль вэ?",
          [
            ["А", '<css href="style.css">'],
            ["Б", '<style src="style.css">'],
            ["В", '<script src="style.css">'],
            ["Г", '<link rel="stylesheet" href="style.css">'],
          ],
          "Г",
        ),
        mcq(
          "13",
          "Элементийн агуулга ба хүрээ (border)-ний хоорондох зайг юу гэх вэ?",
          [["А", "gap"], ["Б", "border"], ["В", "padding"], ["Г", "margin"]],
          "В",
        ),
        mcq(
          "14",
          'Доорх кодонд гарчиг ямар өнгөтэй харагдах вэ?\n\n```html\n#title { color: blue; }\n.red { color: red; }\n...\n<h1 id="title" class="red">Мэндчилгээ</h1>\n```',
          [["А", "Улаан"], ["Б", "Цэнхэр"], ["В", "Ногоон"], ["Г", "Хар"]],
          "Б",
        ),
        {
          n: "15",
          type: "open",
          points: 4,
          input: { code: "html" },
          prompt:
            "3 мөртэй дугааргүй жагсаалт (ul) бичнэ үү. Мөрүүд нь дуртай 3 сайтын нэр байх ба эхний мөр нь https://www.wikipedia.org руу холбоос байна.",
          rubric: [
            { label: "ul зөв", points: 1 },
            { label: "3 li зөв", points: 1 },
            { label: "li доторх a href зөв", points: 2 },
          ],
          key: '<ul>\n  <li><a href="https://www.wikipedia.org">Википедиа</a></li>\n  <li>YouTube</li>\n  <li>Khan Academy</li>\n</ul>',
        },
        {
          n: "16",
          type: "open",
          points: 4,
          input: { code: "css" },
          prompt:
            ".card класст дараах загварыг бичнэ үү: дэвсгэр өнгө #f0f0f0; дотор зай 15px; 2px зузаантай, саарал, тасралтгүй хүрээ; гадна зай 10px.",
          rubric: [
            { label: "background-color", points: 1 },
            { label: "padding", points: 1 },
            { label: "border (зузаан, төрөл, өнгө)", points: 1 },
            { label: "margin; сонгогч ба синтакс зөв", points: 1 },
          ],
          key: ".card {\n  background-color: #f0f0f0;\n  padding: 15px;\n  border: 2px solid gray;\n  margin: 10px;\n}",
        },
        {
          n: "17",
          type: "open",
          points: 4,
          input: "text",
          prompt:
            'Доорх кодонд 2 алдаа байна. Алдаа бүрийг олж, яагаад буруу болохыг тайлбарлаад зассан кодыг бичнэ үү.\n\n```html\n<h1>Манай сургууль</h2>\n<img href="logo.png" alt="Лого">\n```',
          rubric: [
            { label: "1-р алдааг олсон", points: 1 },
            { label: "1-р алдааг зассан", points: 1 },
            { label: "2-р алдааг олсон", points: 1 },
            { label: "2-р алдааг зассан", points: 1 },
          ],
          key: '1) <h1>…</h2> – нээсэн, хаасан таг таарахгүй → </h1>. 2) img-д href биш src атрибутаар зургийн замыг заана → src="logo.png".',
        },
      ],
      sectionB: practical({
        title: "Миний сонирхол",
        image: "hobby.jpg",
        emoji: "🎨",
        p12: "h1 гарчиг, сонирхлынхоо тухай 2-оос доошгүй догол мөр, үүнд хэрэгтэй зүйлсийн 3-аас доошгүй мөртэй ul жагсаалт бичнэ.",
        p13: 'hobby.jpg зургийг alt-тай оруулж, сонирхлын тухай гадаад сайт руу шинэ табд нээгдэх (target="_blank") холбоос нэмнэ.',
        p14: "Долоо хоногийн хуваарийн хүснэгт: «Гараг | Үйл ажиллагаа | Цаг» толгой мөр (th), 3 өгөгдлийн мөр.",
        cls: "card",
        p21: 'style.css-ийг <link>-ээр холбож, body (font-family, background-color), h1 (color, text-align) дүрэм бичнэ. Нэг хэсгийг <div class="card"> дотор оруулж .card сонгогч ашиглана.',
        p22: ".card-д padding, border, border-radius, margin өгч; хүснэгтэд (table, th, td) border, border-collapse: collapse өгнө.",
      }),
    },
    B: {
      units,
      sectionA: [
        mcq(
          "1",
          "HTML гэдэг нь юу вэ?",
          [
            ["А", "Програмчлалын хэл"],
            ["Б", "Өгөгдлийн сан"],
            ["В", "Вэб хуудсын бүтцийг тодорхойлох тэмдэглэгээний хэл (HyperText Markup Language)"],
            ["Г", "Зураг засах програм"],
          ],
          "В",
        ),
        mcq(
          "2",
          '`<meta charset="UTF-8">` мөр ямар хэсэгт бичигдэх вэ?',
          [["А", "<footer>"], ["Б", "<body>"], ["В", "<head>"], ["Г", "<table>"]],
          "В",
        ),
        mcq(
          "3",
          "`<head>` ба `<body>`-ийн ялгааг зөв заасан нь аль вэ?",
          [
            ["А", "Хоёулаа ижил"],
            ["Б", "head – хуудсын тухай мэдээлэл, body – харагдах агуулга"],
            ["В", "head – харагдах агуулга, body – тохиргоо"],
            ["Г", "head – зөвхөн зураг, body – зөвхөн текст"],
          ],
          "Б",
        ),
        mcq("4", "Аль гарчиг хамгийн жижиг вэ?", [["А", "<h3>"], ["Б", "<h6>"], ["В", "<h4>"], ["Г", "<h1>"]], "Б"),
        mcq(
          "5",
          "Дугааргүй (цэгтэй) жагсаалтын таг аль вэ?",
          [["А", "<ul>"], ["Б", "<li>"], ["В", "<list>"], ["Г", "<ol>"]],
          "А",
        ),
        mcq(
          "6",
          "contact.html хуудас руу шилжих холбоосын зөв бичиглэл аль вэ?",
          [
            ["А", '<link to="contact.html">Холбоо барих</link>'],
            ["Б", '<a src="contact.html">Холбоо барих</a>'],
            ["В", "<a>contact.html</a>"],
            ["Г", '<a href="contact.html">Холбоо барих</a>'],
          ],
          "Г",
        ),
        mcq(
          "7",
          "Зураг ачаалагдахгүй үед ямар атрибутын текст харагдах вэ?",
          [["А", "alt"], ["Б", "title"], ["В", "src"], ["Г", "width"]],
          "А",
        ),
        mcq(
          "8",
          "Холбоосыг одоогийн табд (анхдагч байдлаар) нээх утга аль вэ?",
          [["А", 'target="_self"'], ["Б", 'target="_new"'], ["В", 'target="_blank"'], ["Г", 'target="_tab"']],
          "А",
        ),
        mcq(
          "9",
          "Хүснэгтийн толгой нүдний таг аль вэ?",
          [["А", "<thead>"], ["Б", "<td>"], ["В", "<th>"], ["Г", "<tr>"]],
          "В",
        ),
        mcq(
          "10",
          "CSS-ийн үүрэг юу вэ?",
          [
            ["А", "Вэб хуудсын харагдах байдал (өнгө, фонт, байрлал)-ыг загварчлах"],
            ["Б", "Сервер удирдах"],
            ["В", "Вэб хуудсын бүтэц тодорхойлох"],
            ["Г", "Өгөгдөл хадгалах"],
          ],
          "А",
        ),
        mcq(
          "11",
          '`id="menu"` элементийг сонгох CSS сонгогч аль вэ?',
          [["А", "*menu"], ["Б", ".menu"], ["В", "menu"], ["Г", "#menu"]],
          "Г",
        ),
        mcq(
          "12",
          "Гадаад CSS файлыг холбох `<link>` таг аль хэсэгт байрлах вэ?",
          [["А", "<footer> дотор"], ["Б", "<body>-ийн төгсгөлд"], ["В", "<title> дотор"], ["Г", "<head> дотор"]],
          "Г",
        ),
        mcq(
          "13",
          "Элементийн хүрээний ГАДНА талын, бусад элементтэй хоорондох зайг юу гэх вэ?",
          [["А", "content"], ["Б", "margin"], ["В", "padding"], ["Г", "border"]],
          "Б",
        ),
        mcq(
          "14",
          'Доорх кодонд догол мөр ямар өнгөтэй харагдах вэ?\n\n```html\np { color: green; }\n#note { color: orange; }\n.info { color: blue; }\n...\n<p id="note" class="info">Анхаар!</p>\n```',
          [["А", "Ногоон"], ["Б", "Цэнхэр"], ["В", "Улбар шар"], ["Г", "Хар"]],
          "В",
        ),
        {
          n: "15",
          type: "open",
          points: 4,
          input: { code: "html" },
          prompt:
            "3 мөртэй дугааргүй жагсаалт (ul) бичнэ үү. Мөрүүд нь дуртай 3 хичээлийн нэр байх ба сүүлийн мөр нь https://www.khanacademy.org руу холбоос байна.",
          rubric: [
            { label: "ul зөв", points: 1 },
            { label: "3 li зөв", points: 1 },
            { label: "li доторх a href зөв", points: 2 },
          ],
          key: '<ul>\n  <li>Математик</li>\n  <li>Программчлал</li>\n  <li><a href="https://www.khanacademy.org">Khan Academy</a></li>\n</ul>',
        },
        {
          n: "16",
          type: "open",
          points: 4,
          input: { code: "css" },
          prompt:
            ".box класст дараах загварыг бичнэ үү: дэвсгэр өнгө lightyellow; дотор зай 20px; 3px зузаантай, ногоон, тасархай (dashed) хүрээ; гадна зай 15px.",
          rubric: [
            { label: "background-color", points: 1 },
            { label: "padding", points: 1 },
            { label: "border (зузаан, төрөл, өнгө)", points: 1 },
            { label: "margin; сонгогч ба синтакс зөв", points: 1 },
          ],
          key: ".box {\n  background-color: lightyellow;\n  padding: 20px;\n  border: 3px dashed green;\n  margin: 15px;\n}",
        },
        {
          n: "17",
          type: "open",
          points: 4,
          input: "text",
          prompt:
            'Доорх кодонд 2 алдаа байна. Алдаа бүрийг олж, яагаад буруу болохыг тайлбарлаад зассан кодыг бичнэ үү.\n\n```html\n<h2>Манай баг</h3>\n<img link="team.jpg" alt="Баг">\n```',
          rubric: [
            { label: "1-р алдааг олсон", points: 1 },
            { label: "1-р алдааг зассан", points: 1 },
            { label: "2-р алдааг олсон", points: 1 },
            { label: "2-р алдааг зассан", points: 1 },
          ],
          key: '1) <h2>…</h3> – нээсэн, хаасан таг таарахгүй → </h2>. 2) img-д link биш src атрибутаар зургийн замыг заана → src="team.jpg".',
        },
      ],
      sectionB: practical({
        title: "Манай сургууль",
        image: "school.jpg",
        emoji: "🏫",
        p12: "h1 гарчиг, сургуулийнхаа тухай 2-оос доошгүй догол мөр, сургуулийн дугуйлан/клубүүдийн 3-аас доошгүй мөртэй ul жагсаалт бичнэ.",
        p13: 'school.jpg зургийг alt-тай оруулж, Боловсролын яамны (эсвэл сургуулийн) сайт руу шинэ табд нээгдэх (target="_blank") холбоос нэмнэ.',
        p14: "Хичээлийн хуваарийн хүснэгт: «Цаг | Хичээл | Багш» толгой мөр (th), 3 өгөгдлийн мөр.",
        cls: "box",
        p21: 'style.css-ийг <link>-ээр холбож, body (font-family, color), h1 (background-color, padding) дүрэм бичнэ. Нэг хэсгийг <div class="box"> дотор оруулж .box сонгогч ашиглана.',
        p22: ".box-д padding, border, border-radius, margin өгч; хүснэгтэд (table, th, td) border, border-collapse: collapse өгнө.",
      }),
    },
  },
};

export default grade9;
