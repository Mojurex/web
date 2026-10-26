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
  { name: "Python: нөхцөл ба давталт", questions: "1–2", points: 4 },
  { name: "Python: жагсаалт", questions: "3–6", points: 8 },
  { name: "Python: функц", questions: "7–9, 15", points: 10 },
  { name: "HTML: семантик бүтэц ба форм", questions: "10–11, 16", points: 8 },
  { name: "CSS: сонгогч, давуу эрэмбэ, box model, :hover", questions: "12–13", points: 4 },
  { name: "CSS Flexbox", questions: "14, 17", points: 6 },
];

type PracticalData = {
  p1: { title: string; prompt: string; data: string; p13: string; p14: string };
  p2: { title: string; p21: string; p22: string; p23: string };
  key: string;
};

const practical = (d: PracticalData): PracticalTask[] => [
  {
    n: "П1",
    title: `Python ${d.p1.title}`,
    points: 30,
    tools: ["python"],
    files: { "main.py": `${d.p1.data}\n` },
    prompt: d.p1.prompt,
    key: d.key,
    parts: [
      {
        n: "П1.1",
        text: "average(lst) функц: жагсаалтын дунджийг буцаана.",
        points: 6,
        rubric: [
          { label: "def, параметртэй функц", points: 2 },
          { label: "Нийлбэр/тоог зөв бодсон", points: 2 },
          { label: "return-ээр утга буцаасан", points: 2 },
        ],
      },
      {
        n: "П1.2",
        text: "max_min(lst) функц: max(), min() ашиглахгүйгээр, давталтаар хамгийн их, бага утгыг олж (их, бага) гэж буцаана.",
        points: 8,
        rubric: [
          { label: "Эхний элементээр эхлүүлсэн", points: 2 },
          { label: "for давталтаар бүх элементийг шалгасан", points: 3 },
          { label: "max/min built-in ашиглаагүй, 2 утгыг зөв буцаасан", points: 3 },
        ],
      },
      {
        n: "П1.3",
        text: d.p1.p13,
        points: 8,
        rubric: [
          { label: "if/elif/else бүтэц", points: 3 },
          { label: "Хязгаарууд зөв (≥ ашигласан)", points: 3 },
          { label: "return-ээр буцаасан", points: 2 },
        ],
      },
      {
        n: "П1.4",
        text: d.p1.p14,
        points: 8,
        rubric: [
          { label: "Функцуудыг дуудаж ашигласан", points: 3 },
          { label: "Элемент бүрийн ангиллыг хэвлэсэн", points: 2 },
          { label: "Тоолох нөхцөл зөв", points: 2 },
          { label: "Гаралт ойлгомжтой", points: 1 },
        ],
      },
    ],
  },
  {
    n: "П2",
    title: `Вэб хуудас «${d.p2.title}»`,
    points: 30,
    tools: ["web"],
    files: { "index.html": "", "style.css": "" },
    prompt: "index.html болон style.css файлд бичнэ.",
    parts: [
      {
        n: "П2.1",
        text: d.p2.p21,
        points: 12,
        rubric: [
          { label: "header, nav (3 холбоос)", points: 3 },
          { label: "main дотор 3 карт (зураг/эможи, нэр, үнэ, товч)", points: 5 },
          { label: "footer", points: 2 },
          { label: "style.css холбосон", points: 2 },
        ],
      },
      {
        n: "П2.2",
        text: d.p2.p22,
        points: 9,
        rubric: [
          { label: ".card padding, border, border-radius", points: 3 },
          { label: ".card margin эсвэл box-shadow", points: 2 },
          { label: "button загвар", points: 2 },
          { label: "button:hover-д өөрчлөлт харагдана", points: 2 },
        ],
      },
      {
        n: "П2.3",
        text: d.p2.p23,
        points: 9,
        rubric: [
          { label: "nav ul display: flex, gap", points: 3 },
          { label: ".cards display: flex, gap", points: 3 },
          { label: "justify-content / flex-wrap зөв", points: 3 },
        ],
      },
    ],
  },
];

const grade11: GradeContent = {
  grade: 11,
  roman: "XI",
  topic: "Python · HTML/CSS",
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
          'Доорх програм юу хэвлэх вэ?\n\n```python\nfor i in range(0, 10, 3):\n    print(i, end=" ")\n```',
          [["А", "0 3 6 9"], ["Б", "0 3 6"], ["В", "0 1 2 3"], ["Г", "3 6 9"]],
          "А",
        ),
        mcq(
          "2",
          'Доорх програм юу хэвлэх вэ?\n\n```python\nfor i in range(1, 6):\n    if i == 3:\n        continue\n    print(i, end=" ")\n```',
          [["А", "3"], ["Б", "1 2"], ["В", "1 2 4 5"], ["Г", "1 2 3 4 5"]],
          "В",
        ),
        mcq(
          "3",
          "`a = [4, 8, 15, 16, 23]` үед `a[-1]`-ийн утга аль вэ?",
          [["А", "23"], ["Б", "4"], ["В", "Алдаа гарна"], ["Г", "16"]],
          "А",
        ),
        mcq(
          "4",
          "`a = [4, 8, 15, 16, 23]` үед `a[1:3]`-ын утга аль вэ?",
          [["А", "[4, 8]"], ["Б", "[8, 15]"], ["В", "[4, 8, 15]"], ["Г", "[8, 15, 16]"]],
          "Б",
        ),
        mcq(
          "5",
          "Доорх програм юу хэвлэх вэ?\n\n```python\na = [1, 2, 3]\na.append(10)\nprint(len(a))\n```",
          [["А", "3"], ["Б", "4"], ["В", "13"], ["Г", "10"]],
          "Б",
        ),
        mcq(
          "6",
          '`"Python"[0] + "Python"[-1]` илэрхийллийн үр дүн аль вэ?',
          [["А", '"nP"'], ["Б", '"Po"'], ["В", '"Py"'], ["Г", '"Pn"']],
          "Г",
        ),
        mcq(
          "7",
          "Python-д функц тодорхойлох түлхүүр үг аль вэ?",
          [["А", "function"], ["Б", "return"], ["В", "func"], ["Г", "def"]],
          "Г",
        ),
        mcq(
          "8",
          "Доорх програм юу хэвлэх вэ?\n\n```python\ndef f(x):\n    return x * 2\nprint(f(3) + 1)\n```",
          [["А", "8"], ["Б", "4"], ["В", "6"], ["Г", "7"]],
          "Г",
        ),
        mcq(
          "9",
          "Доорх програмын сүүлийн мөр юу хэвлэх вэ?\n\n```python\ndef f(x):\n    print(x * 2)\ny = f(5)\nprint(y)\n```",
          [["А", "10"], ["Б", "0"], ["В", "5"], ["Г", "None"]],
          "Г",
        ),
        mcq(
          "10",
          "Хуудасны доод хэсэг (зохиогчийн эрх, холбоо барих)-ийн семантик таг аль вэ?",
          [["А", "<footer>"], ["Б", "<header>"], ["В", "<nav>"], ["Г", "<section>"]],
          "А",
        ),
        mcq(
          "11",
          '`<label for="email">Имэйл</label>` аль input-тэй холбогдох вэ?',
          [["А", '<input id="email">'], ["Б", '<input name="mail">'], ["В", '<input class="email">'], ["Г", '<input type="text">']],
          "А",
        ),
        mcq(
          "12",
          'Доорх кодонд догол мөр ямар өнгөтэй харагдах вэ?\n\n```html\np { color: black; }\n.text { color: green; }\n#intro { color: blue; }\n...\n<p id="intro" class="text">Сайн уу</p>\n```',
          [["А", "Ногоон цэнхэр холилдоно"], ["Б", "Цэнхэр"], ["В", "Хар"], ["Г", "Ногоон"]],
          "Б",
        ),
        mcq(
          "13",
          "`box-sizing: content-box` үед доорх элементийн нийт харагдах өргөн хэд вэ?\n\n```css\n.box {\n  width: 200px;\n  padding: 10px;\n  border: 5px solid black;\n}\n```",
          [["А", "230px"], ["Б", "215px"], ["В", "200px"], ["Г", "220px"]],
          "А",
        ),
        mcq(
          "14",
          "Flex элементүүдийг дээрээс доош багана болгон байрлуулах шинж аль вэ?",
          [
            ["А", "justify-content: center"],
            ["Б", "flex-direction: row"],
            ["В", "flex-direction: column"],
            ["Г", "flex-wrap: wrap"],
          ],
          "В",
        ),
        {
          n: "15",
          type: "open",
          points: 4,
          input: { code: "python" },
          prompt: "Тоонуудын жагсаалт nums-ийн дунджийг буцаах `average(nums)` функц бичнэ үү. Жагсаалт хоосон бол 0 буцаана.",
          rubric: [
            { label: "def, параметр зөв", points: 1 },
            { label: "Хоосон эсэхийг шалгаж 0 буцаасан", points: 1 },
            { label: "Дунджийг зөв бодсон", points: 1 },
            { label: "return ашигласан", points: 1 },
          ],
          key: "def average(nums):\n    if len(nums) == 0:\n        return 0\n    return sum(nums) / len(nums)",
        },
        {
          n: "16",
          type: "open",
          points: 4,
          input: { code: "html" },
          prompt:
            'Нэр (текст), имэйл (type="email") гэсэн 2 талбар, «Илгээх» товчтой форм бичнэ үү. Талбар бүр label-тай, for ба id-аар холбогдсон байна.',
          rubric: [
            { label: "form таг", points: 1 },
            { label: "2 label for ↔ id зөв", points: 1 },
            { label: "input төрлүүд зөв", points: 1 },
            { label: "Илгээх товч", points: 1 },
          ],
          key: '<form>\n  <label for="name">Нэр</label>\n  <input type="text" id="name">\n  <label for="email">Имэйл</label>\n  <input type="email" id="email">\n  <button type="submit">Илгээх</button>\n</form>',
        },
        {
          n: "17",
          type: "open",
          points: 4,
          prompt:
            "Доорх CSS дүрмийн шинж бүр юу хийхийг тайлбарлана уу. Үр дүнд nav доторх элементүүд хэрхэн байрлах вэ?\n\n```css\nnav {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n```",
          rubric: [
            { label: "display: flex", points: 1 },
            { label: "justify-content: space-between", points: 1 },
            { label: "align-items: center", points: 1 },
            { label: "Нийт байрлалыг зөв дүгнэсэн", points: 1 },
          ],
          key: "display: flex – хүү элементүүдийг нэг мөрөнд (хэвтээ) байрлуулна; justify-content: space-between – эхний, сүүлийн элементийг хоёр захад, бусдыг хооронд нь тэнцүү зайтай; align-items: center – босоо тэнхлэгийн дагуу голлуулна. Үр дүн: лого зүүн, цэс баруун захад, босоо голлосон нэг мөр.",
        },
      ],
      sectionB: practical({
        p1: {
          title: "«Сурагчдын дүн»",
          prompt: "`scores = [78, 92, 55, 85, 64, 99, 70]` жагсаалт ашиглана.",
          data: "scores = [78, 92, 55, 85, 64, 99, 70]",
          p13: "grade(score) функц: ≥ 90 – «A», ≥ 80 – «B», ≥ 70 – «C», ≥ 60 – «D», бусад – «F» буцаана.",
          p14: "Функцуудаа ашиглан дундаж (1 оронтой), хамгийн их ба бага оноо, оноо бүрийн үнэлгээ, тэнцсэн (≥ 60) сурагчдын тоог хэвлэнэ.",
        },
        p2: {
          title: "Технологийн дэлгүүр",
          p21: 'Семантик бүтэц: header (дэлгүүрийн нэр), nav (Нүүр, Бараа, Холбоо барих), main дотор 3 бүтээгдэхүүний карт (<div class="card">: зураг/эможи, нэр, үнэ, «Сагслах» товч), footer.',
          p22: ".card-д padding, border, border-radius, margin (эсвэл box-shadow) өгч; button-д загвар, button:hover-д өнгө солигдох загвар бичнэ.",
          p23: "nav доторх холбоосуудыг (ul) display: flex, gap-ээр нэг мөрөнд; 3 картыг .cards сав дотор display: flex, gap, justify-content (эсвэл flex-wrap)-оор байрлуулна.",
        },
        key: "П1.4: дундаж = 543 / 7 ≈ 77.6; их = 99, бага = 55; үнэлгээ: 78-C, 92-A, 55-F, 85-B, 64-D, 99-A, 70-C; тэнцсэн = 6.",
      }),
    },
    B: {
      units,
      sectionA: [
        mcq(
          "1",
          'Доорх програм юу хэвлэх вэ?\n\n```python\nfor i in range(1, 12, 4):\n    print(i, end=" ")\n```',
          [["А", "1 4 7 10"], ["Б", "1 5 9 13"], ["В", "1 5 9"], ["Г", "4 8"]],
          "В",
        ),
        mcq(
          "2",
          'Доорх програм юу хэвлэх вэ?\n\n```python\nfor i in range(1, 6):\n    if i % 2 == 0:\n        continue\n    print(i, end=" ")\n```',
          [["А", "1"], ["Б", "1 3 5"], ["В", "1 2 3 4 5"], ["Г", "2 4"]],
          "Б",
        ),
        mcq(
          "3",
          '`a = ["улаан", "ногоон", "цэнхэр", "шар"]` үед `a[-2]`-ийн утга аль вэ?',
          [["А", '"ногоон"'], ["Б", '"шар"'], ["В", '"цэнхэр"'], ["Г", "Алдаа гарна"]],
          "В",
        ),
        mcq(
          "4",
          "`b = [10, 20, 30, 40, 50]` үед `b[2:4]`-ийн утга аль вэ?",
          [["А", "[20, 30, 40]"], ["Б", "[30, 40]"], ["В", "[20, 30]"], ["Г", "[30, 40, 50]"]],
          "Б",
        ),
        mcq(
          "5",
          "Доорх програм юу хэвлэх вэ?\n\n```python\na = [5, 6]\na.append(7)\na.append(8)\nprint(len(a))\n```",
          [["А", "15"], ["Б", "3"], ["В", "2"], ["Г", "4"]],
          "Г",
        ),
        mcq(
          "6",
          '`"Hello"[1] + "Hello"[-1]` илэрхийллийн үр дүн аль вэ?',
          [["А", '"eo"'], ["Б", '"Ho"'], ["В", '"el"'], ["Г", '"lo"']],
          "А",
        ),
        mcq(
          "7",
          "`def square(x):` мөрийн `def` түлхүүр үг юу хийдэг вэ?",
          [["А", "Хувьсагч устгана"], ["Б", "Давталт эхлүүлнэ"], ["В", "Утга буцаана"], ["Г", "Функц тодорхойлж эхэлнэ"]],
          "Г",
        ),
        mcq(
          "8",
          "Доорх програм юу хэвлэх вэ?\n\n```python\ndef g(a, b):\n    return a - b\nprint(g(10, 4) * 2)\n```",
          [["А", "8"], ["Б", "14"], ["В", "6"], ["Г", "12"]],
          "Г",
        ),
        mcq(
          "9",
          'Доорх програмын хоёр дахь мөрөнд юу хэвлэгдэх вэ?\n\n```python\ndef hello():\n    print("Hi")\nr = hello()\nprint(r)\n```',
          [["А", "Hi"], ["Б", "None"], ["В", "Алдаа гарна"], ["Г", "0"]],
          "Б",
        ),
        mcq(
          "10",
          "Сайтын үндсэн цэсний холбоосууд байрлах семантик таг аль вэ?",
          [["А", "<aside>"], ["Б", "<nav>"], ["В", "<footer>"], ["Г", "<main>"]],
          "Б",
        ),
        mcq(
          "11",
          '`<input id="phone">`-тэй холбогдох label аль вэ?',
          [["А", '<label class="phone">'], ["Б", '<label id="phone">'], ["В", '<label name="phone">'], ["Г", '<label for="phone">']],
          "Г",
        ),
        mcq(
          "12",
          'Доорх кодонд гарчиг ямар өнгөтэй харагдах вэ?\n\n```html\nh2 { color: gray; }\n#main-title { color: orange; }\n.big { color: purple; }\n...\n<h2 class="big" id="main-title">Мэдээ</h2>\n```',
          [["А", "Хар"], ["Б", "Ягаан"], ["В", "Улбар шар"], ["Г", "Саарал"]],
          "В",
        ),
        mcq(
          "13",
          "`box-sizing: content-box` үед доорх элементийн нийт харагдах өргөн хэд вэ?\n\n```css\n.card {\n  width: 300px;\n  padding: 20px;\n  border: 2px solid gray;\n}\n```",
          [["А", "344px"], ["Б", "322px"], ["В", "342px"], ["Г", "300px"]],
          "А",
        ),
        mcq(
          "14",
          "flex-direction-ийн анхдагч утга бөгөөд элементүүдийг хэвтээ мөрөөр байрлуулдаг нь аль вэ?",
          [["А", "column"], ["Б", "center"], ["В", "wrap"], ["Г", "row"]],
          "Г",
        ),
        {
          n: "15",
          type: "open",
          points: 4,
          input: { code: "python" },
          prompt:
            "Онооны жагсаалт scores-оос 60 ба түүнээс дээш оноотой сурагчдын тоог буцаах `count_pass(scores)` функц бичнэ үү. Жагсаалт хоосон бол 0 буцаана.",
          rubric: [
            { label: "def, параметр зөв", points: 1 },
            { label: "Давталт ба нөхцөл зөв", points: 1 },
            { label: "Тоолуур зөв (хоосон үед 0)", points: 1 },
            { label: "return ашигласан", points: 1 },
          ],
          key: "def count_pass(scores):\n    count = 0\n    for s in scores:\n        if s >= 60:\n            count += 1\n    return count",
        },
        {
          n: "16",
          type: "open",
          points: 4,
          input: { code: "html" },
          prompt:
            'Хэрэглэгчийн нэр (текст), нууц үг (type="password") гэсэн 2 талбар, «Нэвтрэх» товчтой форм бичнэ үү. Талбар бүр label-тай, for ба id-аар холбогдсон байна.',
          rubric: [
            { label: "form таг", points: 1 },
            { label: "2 label for ↔ id зөв", points: 1 },
            { label: "input төрлүүд зөв (password)", points: 1 },
            { label: "Нэвтрэх товч", points: 1 },
          ],
          key: '<form>\n  <label for="user">Хэрэглэгчийн нэр</label>\n  <input type="text" id="user">\n  <label for="pass">Нууц үг</label>\n  <input type="password" id="pass">\n  <button type="submit">Нэвтрэх</button>\n</form>',
        },
        {
          n: "17",
          type: "open",
          points: 4,
          prompt:
            "Доорх CSS дүрмийн шинж бүр юу хийхийг тайлбарлана уу. Үр дүнд .gallery доторх зургууд хэрхэн байрлах вэ?\n\n```css\n.gallery {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 20px;\n}\n```",
          rubric: [
            { label: "flex-direction: column", points: 1 },
            { label: "align-items: center", points: 1 },
            { label: "gap: 20px", points: 1 },
            { label: "Нийт байрлалыг зөв дүгнэсэн", points: 1 },
          ],
          key: "display: flex – flex сав болгоно; flex-direction: column – хүү элементүүдийг дээрээс доош багана болгоно; align-items: center – хэвтээ тэнхлэгийн дагуу голлуулна; gap: 20px – элементүүдийн хооронд 20px зай. Үр дүн: зургууд нэг багананд, голлосон, 20px зайтай.",
        },
      ],
      sectionB: practical({
        p1: {
          title: "«Цаг агаарын хэмжилт»",
          prompt: "`temps = [12, 18, 25, -3, 7, 21, 16]` (7 хоногийн өдрийн хэм) жагсаалт ашиглана.",
          data: "temps = [12, 18, 25, -3, 7, 21, 16]",
          p13: "level(t) функц: ≥ 25 – «Халуун», ≥ 15 – «Дулаан», ≥ 5 – «Сэрүүн», ≥ −10 – «Хүйтэн», бусад – «Жавартай» буцаана.",
          p14: "Функцуудаа ашиглан дундаж (1 оронтой), хамгийн их ба бага хэм, өдөр бүрийн ангилал, 15°-аас дээш (≥ 15) дулаан өдрийн тоог хэвлэнэ.",
        },
        p2: {
          title: "Номын дэлгүүр",
          p21: 'Семантик бүтэц: header (дэлгүүрийн нэр), nav (Нүүр, Номууд, Холбоо барих), main дотор 3 номын карт (<div class="card">: зураг/эможи, нэр, үнэ, «Худалдан авах» товч), footer.',
          p22: ".card-д padding, border, border-radius, margin (эсвэл box-shadow) өгч; button-д загвар, button:hover-д өнгө эсвэл хэмжээ өөрчлөгдөх загвар бичнэ.",
          p23: "nav доторх холбоосуудыг (ul) display: flex, gap-ээр нэг мөрөнд; 3 картыг .cards сав дотор display: flex, gap, justify-content: center (эсвэл flex-wrap)-оор байрлуулна.",
        },
        key: "П1.4: дундаж = 96 / 7 ≈ 13.7; их = 25, бага = −3; ангилал: 12-Сэрүүн, 18-Дулаан, 25-Халуун, −3-Хүйтэн, 7-Сэрүүн, 21-Дулаан, 16-Дулаан; дулаан өдөр = 4.",
      }),
    },
  },
};

export default grade11;
