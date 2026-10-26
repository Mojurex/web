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
  { name: "Вэб, хөтөч ба HTML баримтын бүтэц", questions: "1–4", points: 8 },
  { name: "Текст форматлах таг", questions: "5–7", points: 6 },
  { name: "Жагсаалт", questions: "8–9, 15", points: 8 },
  { name: "Холбоос ба зураг", questions: "10–12, 17", points: 10 },
  { name: "CSS үндэс", questions: "13–14, 16", points: 8 },
];

type PracticalData = {
  title: string;
  image: string;
  emoji: string;
  p11: string;
  p12: string;
  p13: string;
  p14: string;
  width: string;
  cls: string;
  p21: string;
  p22: string;
  p23: string;
};

const practical = (d: PracticalData): PracticalTask[] => {
  const shared = {
    tools: ["web"] as PracticalTask["tools"],
    workspace: "site",
    files: { "index.html": "" },
    images: { [d.image]: d.emoji },
  };
  return [
    {
      ...shared,
      n: "П1",
      title: `HTML хуудас «${d.title}»`,
      points: 30,
      prompt: `index.html файлд хуудсаа бичнэ. **${d.image}** зураг бэлэн байгаа тул шууд ашиглаж болно. Баруун талд хуудас хэрхэн харагдахыг шалгана.`,
      parts: [
        {
          n: "П1.1",
          text: d.p11,
          points: 5,
          rubric: [
            { label: "DOCTYPE, html", points: 1 },
            { label: "head ба title зөв", points: 2 },
            { label: "body, бүх таг зөв хаагдсан", points: 2 },
          ],
        },
        {
          n: "П1.2",
          text: d.p12,
          points: 8,
          rubric: [
            { label: "h1 гарчиг", points: 1 },
            { label: "2 h2 дэд гарчиг", points: 2 },
            { label: "2+ догол мөр (p)", points: 2 },
            { label: "strong ашигласан", points: 1.5 },
            { label: "em ашигласан", points: 1.5 },
          ],
        },
        {
          n: "П1.3",
          text: d.p13,
          points: 7,
          rubric: [
            { label: "ul, 3+ li", points: 3 },
            { label: "ol, 3+ li", points: 3 },
            { label: "li бүр зөв хаагдсан", points: 1 },
          ],
        },
        {
          n: "П1.4",
          text: d.p14,
          points: 10,
          rubric: [
            { label: "img src зөв, зураг харагдана", points: 3 },
            { label: "alt текст бичсэн", points: 2 },
            { label: `width="${d.width}"`, points: 2 },
            { label: "a href зөв, шинэ хуудас руу ордог", points: 3 },
          ],
        },
      ],
    },
    {
      ...shared,
      n: "П2",
      title: "CSS загварчлал",
      points: 30,
      prompt: "П1-д хийсэн хуудасныхаа `<head>` хэсэгт `<style>` таг нэмж, хуудсаа загварчлана.",
      parts: [
        {
          n: "П2.1",
          text: d.p21,
          points: 10,
          rubric: [
            { label: "<style> тагийг head-д зөв байршуулсан", points: 3 },
            { label: "tag сонгогч ашигласан", points: 3 },
            { label: `.${d.cls} класс тодорхойлж, HTML-д class="${d.cls}" өгсөн`, points: 4 },
          ],
        },
        {
          n: "П2.2",
          text: d.p22,
          points: 12,
          rubric: [
            { label: "body дүрэм", points: 3 },
            { label: "h1 дүрэм", points: 3 },
            { label: "p дүрэм", points: 3 },
            { label: "li дүрэм", points: 3 },
          ],
        },
        {
          n: "П2.3",
          text: d.p23,
          points: 8,
          rubric: [
            { label: "img border", points: 2 },
            { label: "border-radius", points: 2 },
            { label: "Код догол мөртэй, цэгцтэй, хуудас бүтнээрээ уялдаатай", points: 4 },
          ],
        },
      ],
    },
  ];
};

const grade8: GradeContent = {
  grade: 8,
  roman: "VIII",
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
          "Вэб хуудсыг нээж харуулдаг програмыг юу гэж нэрлэх вэ?",
          [["А", "Текст засварлагч"], ["Б", "Үйлдлийн систем"], ["В", "Хөтөч (browser)"], ["Г", "Вирусны эсрэг програм"]],
          "В",
        ),
        mcq("2", "HTML файлын өргөтгөл аль вэ?", [["А", ".py"], ["Б", ".doc"], ["В", ".txt"], ["Г", ".html"]], "Г"),
        mcq(
          "3",
          "Хос тагийн зөв бичиглэл аль вэ?",
          [["А", "</p>Сайн уу<p>"], ["Б", "<p/>Сайн уу</p>"], ["В", "<p>Сайн уу</p>"], ["Г", "<p>Сайн уу<p>"]],
          "В",
        ),
        mcq(
          "4",
          "`<head>` хэсэгт голчлон юу бичигддэг вэ?",
          [
            ["А", "Хуудсын гарчиг (title), meta зэрэг хуудсын тухай мэдээлэл"],
            ["Б", "Жагсаалт ба хүснэгт"],
            ["В", "Холбоосууд"],
            ["Г", "Хуудсанд харагдах зураг, текст"],
          ],
          "А",
        ),
        mcq("5", "Догол мөрийн таг аль вэ?", [["А", "<h1>"], ["Б", "<p>"], ["В", "<li>"], ["Г", "<br>"]], "Б"),
        mcq("6", "Мөр шилжүүлэх таг аль вэ?", [["А", "<em>"], ["Б", "<hr>"], ["В", "<p>"], ["Г", "<br>"]], "Г"),
        mcq(
          "7",
          "Текстийг ТОД (bold) болгох таг аль вэ?",
          [["А", "<p>"], ["Б", "<em>"], ["В", "<h6>"], ["Г", "<strong>"]],
          "Г",
        ),
        mcq(
          "8",
          "Дугааргүй (цэгтэй) жагсаалтын таг аль вэ?",
          [["А", "<li>"], ["Б", "<ul>"], ["В", "<ol>"], ["Г", "<dl>"]],
          "Б",
        ),
        mcq(
          "9",
          "Доорх кодын 2-р мөр хөтөч дээр хэрхэн харагдах вэ?\n\n```html\n<ol>\n  <li>Улаан</li>\n  <li>Ногоон</li>\n  <li>Цэнхэр</li>\n</ol>\n```",
          [["А", "b. Ногоон"], ["Б", "Ногоон"], ["В", "2. Ногоон"], ["Г", "• Ногоон"]],
          "В",
        ),
        mcq("10", "Хуудсанд зураг оруулах таг аль вэ?", [["А", "<img>"], ["Б", "<a>"], ["В", "<pic>"], ["Г", "<src>"]], "А"),
        mcq(
          "11",
          "`<img>` тагийн `src` атрибут юуг заадаг вэ?",
          [["А", "Зургийн тайлбар текст"], ["Б", "Зургийн өнгө"], ["В", "Зургийн өргөн"], ["Г", "Зургийн файлын зам (хаяг)"]],
          "Г",
        ),
        mcq(
          "12",
          "Google руу шилжих холбоосын зөв код аль вэ?",
          [
            ["А", '<link href="https://google.com">Google</link>'],
            ["Б", "<a>https://google.com</a href>"],
            ["В", '<a href="https://google.com">Google</a>'],
            ["Г", '<a src="https://google.com">Google</a>'],
          ],
          "В",
        ),
        mcq(
          "13",
          "`h1 { color: red; }` дүрэм юу хийх вэ?",
          [
            ["А", "Хуудсын бүх h1 гарчгийг улаан өнгөтэй болгоно"],
            ["Б", "Зөвхөн эхний догол мөрийг улаан болгоно"],
            ["В", "h1-ийн хүрээг улаан болгоно"],
            ["Г", "Хуудсын дэвсгэрийг улаан болгоно"],
          ],
          "А",
        ),
        mcq(
          "14",
          'Доорх кодонд «Сайн уу» ямар өнгөтэй харагдах вэ?\n\n```html\n<style> p { color: blue; } </style>\n...\n<p style="color: green;">Сайн уу</p>\n```',
          [["А", "Хар"], ["Б", "Цэнхэр ногоон холилдоно"], ["В", "Ногоон"], ["Г", "Цэнхэр"]],
          "В",
        ),
        {
          n: "15",
          type: "open",
          points: 4,
          input: { code: "html" },
          prompt:
            "«Миний гэр бүл» сэдвээр h2 гарчиг, нэг догол мөр (p), гэр бүлийн 3 гишүүнийг дугаартай жагсаалтаар (ol) харуулах HTML код бичнэ үү.",
          rubric: [
            { label: "h2 зөв", points: 1 },
            { label: "p зөв", points: 1 },
            { label: "ol зөв", points: 1 },
            { label: "3 li зөв хаагдсан", points: 1 },
          ],
          key: "<h2>Миний гэр бүл</h2>\n<p>Манай гэр бүл 4 хүнтэй.</p>\n<ol>\n  <li>Аав</li>\n  <li>Ээж</li>\n  <li>Ах</li>\n</ol>",
        },
        {
          n: "16",
          type: "open",
          points: 4,
          input: { code: "html" },
          prompt:
            "`<style>` таг дотор дараах CSS дүрмүүдийг бичнэ үү: body-ийн дэвсгэр өнгө lightyellow; h1-ийн өнгө navy, төвд зэрэгцсэн; p-ийн үсгийн хэмжээ 18px.",
          rubric: [
            { label: "body background-color", points: 1 },
            { label: "h1 color", points: 1 },
            { label: "h1 text-align: center", points: 1 },
            { label: "p font-size: 18px", points: 1 },
          ],
          key: "<style>\n  body { background-color: lightyellow; }\n  h1 { color: navy; text-align: center; }\n  p { font-size: 18px; }\n</style>",
        },
        {
          n: "17",
          type: "open",
          points: 4,
          input: { code: "html" },
          prompt:
            'Доорх кодонд 3 алдаа байна. Алдаа бүрийг олж, зассан кодыг бичнэ үү.\n\n```html\n<p>Сайн уу<p>\n<a src="https://www.mn">Мэдээ</a>\n<img href="cat.jpg" alt="Муур">\n```',
          rubric: [
            { label: "Алдаа бүрийг олж зассан – тус бүр 1", points: 3 },
            { label: "Зассан бүтэн код зөв", points: 1 },
          ],
          key: "1) <p>Сайн уу<p> → </p>; 2) <a src=…> → <a href=…>; 3) <img href=…> → <img src=…>",
        },
      ],
      sectionB: practical({
        title: "Миний дуртай спорт",
        image: "sport.jpg",
        emoji: "⚽",
        p11: "<!DOCTYPE html>, <html>, <head>, <title>Миний дуртай спорт</title>, <body> бүхий үндсэн бүтэц үүсгэнэ.",
        p12: "<h1>Миний дуртай спорт</h1> гарчиг; «Түүх», «Дүрэм» гэсэн 2 h2 дэд гарчиг; 2-оос доошгүй догол мөр; нэг үгийг <strong>, нэг үгийг <em>-ээр онцолно.",
        p13: "Спортод хэрэгтэй хэрэгслийн дугааргүй жагсаалт (ul) ба дуртай тамирчдын дугаартай жагсаалт (ol) тус бүр 3-аас доошгүй мөртэй.",
        p14: 'sport.jpg зургийг alt тайлбар, width="300"-тай оруулж, спортын тухай вэб хуудас руу холбоос (a href) нэмнэ.',
        width: "300",
        cls: "highlight",
        p21: '<style> тагт tag сонгогчоор дүрэм бичиж, .highlight класс үүсгээд (жишээ нь background-color: yellow) нэг догол мөрт class="highlight" өгнө.',
        p22: "body (background-color, font-family), h1 (color, text-align: center), p (font-size), li (color) дүрмүүдийг бичнэ.",
        p23: "Зурагт border (жишээ: 3px solid gray), border-radius (жишээ: 10px) өгч, кодоо цэгцтэй догол мөртэй бичнэ.",
      }),
    },
    B: {
      units,
      sectionA: [
        mcq(
          "1",
          "Аль нь хөтөч (browser) вэ?",
          [["А", "Google Chrome"], ["Б", "Paint"], ["В", "Notepad"], ["Г", "Microsoft Word"]],
          "А",
        ),
        mcq(
          "2",
          "Вэб хуудсыг хадгалахдаа файлыг ямар өргөтгөлтэй нэрлэх вэ?",
          [["А", "index.docx"], ["Б", "index.exe"], ["В", "index.jpg"], ["Г", "index.html"]],
          "Г",
        ),
        mcq("3", "Хаалтын таг аль вэ?", [["А", "<h1/>"], ["Б", "<h1>"], ["В", "</h1>"], ["Г", "<\\h1>"]], "В"),
        mcq(
          "4",
          "Хөтчийн таб дээр харагдах гарчгийг аль хэсэгт бичих вэ?",
          [["А", "<body> доторх <h1>-д"], ["Б", "<head> доторх <title>-д"], ["В", "<p>-д"], ["Г", "<footer>-т"]],
          "Б",
        ),
        mcq("5", "Хамгийн том гарчгийн таг аль вэ?", [["А", "<title>"], ["Б", "<h6>"], ["В", "<head>"], ["Г", "<h1>"]], "Г"),
        mcq(
          "6",
          "Нэг догол мөр дотор шинэ мөрөөс эхлүүлэхэд аль тагийг хэрэглэх вэ?",
          [["А", "<br>"], ["Б", "<p>"], ["В", "<li>"], ["Г", "<b>"]],
          "А",
        ),
        mcq(
          "7",
          "Текстийг НАЛУУ (онцлох) болгох таг аль вэ?",
          [["А", "<h2>"], ["Б", "<em>"], ["В", "<strong>"], ["Г", "<u>"]],
          "Б",
        ),
        mcq("8", "Дугаартай жагсаалтын таг аль вэ?", [["А", "<li>"], ["Б", "<nl>"], ["В", "<ul>"], ["Г", "<ol>"]], "Г"),
        mcq(
          "9",
          "Доорх кодын 3-р мөр хөтөч дээр хэрхэн харагдах вэ?\n\n```html\n<ul>\n  <li>Нар</li>\n  <li>Од</li>\n  <li>Сар</li>\n</ul>\n```",
          [["А", "Сар"], ["Б", "c. Сар"], ["В", "3. Сар"], ["Г", "• Сар"]],
          "Г",
        ),
        mcq(
          "10",
          "Аль код зөв зураг оруулах вэ?",
          [
            ["А", '<img link="dog.jpg">'],
            ["Б", '<a src="dog.jpg">'],
            ["В", '<image href="dog.jpg">'],
            ["Г", '<img src="dog.jpg" alt="Нохой">'],
          ],
          "Г",
        ),
        mcq(
          "11",
          "`<img>` тагийн `alt` атрибут юунд хэрэгтэй вэ?",
          [
            ["А", "Зургийн файлын замыг заана"],
            ["Б", "Зургийг холбоос болгоно"],
            ["В", "Зураг харагдахгүй үед орлох тайлбар текст харуулна"],
            ["Г", "Зургийн хэмжээг заана"],
          ],
          "В",
        ),
        mcq(
          "12",
          "«Мэдээ» гэсэн бичиг дээр дарахад news.html хуудас руу шилжих код аль вэ?",
          [
            ["А", '<a>Мэдээ</a href="news.html">'],
            ["Б", "<link>news.html</link>"],
            ["В", '<a href="news.html">Мэдээ</a>'],
            ["Г", '<a src="news.html">Мэдээ</a>'],
          ],
          "В",
        ),
        mcq(
          "13",
          "`p { font-size: 20px; }` дүрэм юу хийх вэ?",
          [
            ["А", "Хуудсын өргөнийг 20px болгоно"],
            ["Б", "Бүх догол мөрийн үсгийн хэмжээг 20px болгоно"],
            ["В", "Бүх гарчгийг 20px болгоно"],
            ["Г", "Зөвхөн эхний догол мөрийг 20px болгоно"],
          ],
          "Б",
        ),
        mcq(
          "14",
          'Доорх кодонд «Гарчиг» ямар өнгөтэй харагдах вэ?\n\n```html\n<style> h1 { color: red; } </style>\n...\n<h1 style="color: purple;">Гарчиг</h1>\n```',
          [["А", "Ягаан"], ["Б", "Хар"], ["В", "Улаан ягаан холилдоно"], ["Г", "Улаан"]],
          "А",
        ),
        {
          n: "15",
          type: "open",
          points: 4,
          input: { code: "html" },
          prompt:
            "«Миний дуртай хоол» сэдвээр h2 гарчиг, нэг догол мөр (p), дуртай 3 хоолоо дугаартай жагсаалтаар (ol) харуулах HTML код бичнэ үү.",
          rubric: [
            { label: "h2 зөв", points: 1 },
            { label: "p зөв", points: 1 },
            { label: "ol зөв", points: 1 },
            { label: "3 li зөв хаагдсан", points: 1 },
          ],
          key: "<h2>Миний дуртай хоол</h2>\n<p>Би монгол хоолонд дуртай.</p>\n<ol>\n  <li>Бууз</li>\n  <li>Хуушуур</li>\n  <li>Цуйван</li>\n</ol>",
        },
        {
          n: "16",
          type: "open",
          points: 4,
          input: { code: "html" },
          prompt:
            "`<style>` таг дотор дараах CSS дүрмүүдийг бичнэ үү: body-ийн дэвсгэр өнгө lightblue; h1-ийн өнгө darkgreen, үсгийн хэмжээ 32px; p-г төвд зэрэгцүүлэх.",
          rubric: [
            { label: "body background-color", points: 1 },
            { label: "h1 color", points: 1 },
            { label: "h1 font-size: 32px", points: 1 },
            { label: "p text-align: center", points: 1 },
          ],
          key: "<style>\n  body { background-color: lightblue; }\n  h1 { color: darkgreen; font-size: 32px; }\n  p { text-align: center; }\n</style>",
        },
        {
          n: "17",
          type: "open",
          points: 4,
          input: { code: "html" },
          prompt:
            'Доорх кодонд 3 алдаа байна. Алдаа бүрийг олж, зассан кодыг бичнэ үү.\n\n```html\n<h1>Амьтад</h2>\n<img href="dog.jpg" alt="Нохой">\n<a src="https://www.wwf.org">WWF</a>\n```',
          rubric: [
            { label: "Алдаа бүрийг олж зассан – тус бүр 1", points: 3 },
            { label: "Зассан бүтэн код зөв", points: 1 },
          ],
          key: "1) <h1>Амьтад</h2> → </h1>; 2) <img href=…> → <img src=…>; 3) <a src=…> → <a href=…>",
        },
      ],
      sectionB: practical({
        title: "Миний дуртай амьтан",
        image: "animal.jpg",
        emoji: "🐎",
        p11: "<!DOCTYPE html>, <html>, <head>, <title>Миний дуртай амьтан</title>, <body> бүхий үндсэн бүтэц үүсгэнэ.",
        p12: "<h1>Миний дуртай амьтан</h1> гарчиг; «Амьдрах орчин», «Идэш тэжээл» гэсэн 2 h2 дэд гарчиг; 2-оос доошгүй догол мөр; нэг үгийг <strong>, нэг үгийг <em>-ээр онцолно.",
        p13: "Амьтны онцлог шинжийн дугааргүй жагсаалт (ul) ба түүний идэш тэжээлийн дугаартай жагсаалт (ol) тус бүр 3-аас доошгүй мөртэй.",
        p14: 'animal.jpg зургийг alt тайлбар, width="250"-тай оруулж, тухайн амьтны тухай вэб хуудас (жишээ нь Википедиа) руу холбоос (a href) нэмнэ.',
        width: "250",
        cls: "note",
        p21: '<style> тагт tag сонгогчоор дүрэм бичиж, .note класс үүсгээд (жишээ нь color: darkred; font-style: italic) нэг догол мөрт class="note" өгнө.',
        p22: "body (background-color, font-family), h1 (color, font-size), p (text-align эсвэл line-height), li (font-size эсвэл color) дүрмүүдийг бичнэ.",
        p23: "Зурагт border (жишээ: 4px dashed green), border-radius (жишээ: 50%) өгч, кодоо цэгцтэй догол мөртэй бичнэ.",
      }),
    },
  },
};

export default grade8;
