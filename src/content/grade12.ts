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
  { name: "React ба JSX", questions: "1–4, 17", points: 12 },
  { name: "Компонент", questions: "5–7", points: 6 },
  { name: "Props", questions: "8–11, 15", points: 12 },
  { name: "Нөхцөлт рендер", questions: "12–14, 16", points: 10 },
];

const app = `import "./styles.css";

export default function App() {
  return (
    <div className="app">
      {/* Энд компонентуудаа ашиглана */}
    </div>
  );
}
`;

type PracticalData = {
  title: string;
  prompt: string;
  card: string;
  p12: string;
  p13: string;
  p14: string;
  available: string;
  key: string;
};

const practical = (d: PracticalData): PracticalTask[] => [
  {
    n: "П1",
    title: d.title,
    points: 60,
    tools: ["react"],
    files: {
      "App.jsx": app,
      "components/Header.jsx": "",
      [`components/${d.card}.jsx`]: "",
      "styles.css": "",
    },
    prompt: `${d.prompt}\n\nКомпонент бүрийг \`components/\` хавтсанд тусдаа файлд бичнэ. «▶ Ажиллуулах» дарахад баруун талд үр дүн, доор нь Console харагдана.`,
    key: d.key,
    parts: [
      {
        n: "П1.1",
        text: 'Header({ title, subtitle }) компонент үүсгэж, export default хийгээд App-д <Header title="…" subtitle="…" /> гэж ашиглана.',
        points: 8,
        rubric: [
          { label: "Функц компонент, нэр том үсгээр", points: 2 },
          { label: "Props задалж ({ title, subtitle }) ашигласан", points: 3 },
          { label: "export default, App-д import хийсэн", points: 3 },
        ],
      },
      {
        n: "П1.2",
        text: d.p12,
        points: 20,
        rubric: [
          { label: "Props-ийг задалж хүлээн авсан", points: 4 },
          { label: "discount = 0 анхдагч утга", points: 4 },
          { label: "Бүх мэдээлэл ({ } илэрхийллээр) зөв харагдана", points: 6 },
          { label: "className ашиглан CSS загвар өгсөн", points: 6 },
        ],
      },
      {
        n: "П1.3",
        text: d.p13,
        points: 20,
        rubric: [
          { label: d.available, points: 6 },
          { label: "discount > 0 && «-X%» тэмдэг (0 үед «0» харагдахгүй)", points: 5 },
          { label: "Шинэ үнийн тооцоо зөв", points: 5 },
          { label: "Хуучин үнэ зурааслагдсан (зөвхөн хямдралтай үед)", points: 4 },
        ],
      },
      {
        n: "П1.4",
        text: d.p14,
        points: 6,
        rubric: [
          { label: "3 тохиолдол, өөр өөр props", points: 4 },
          { label: "Нөхцлийн бүх хувилбар харагдана", points: 2 },
        ],
      },
      {
        n: "П1.5",
        text: "Кодын чанар: Console-д алдаа/анхааруулга байхгүй, компонентын нэршил зөв, догол мөр цэгцтэй.",
        points: 6,
        rubric: [
          { label: "Console алдаагүй", points: 2 },
          { label: "Нэршил зөв", points: 2 },
          { label: "Код цэгцтэй", points: 2 },
        ],
      },
    ],
  },
];

const grade12: GradeContent = {
  grade: 12,
  roman: "XII",
  topic: "React",
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
          "JSX-д HTML элементэд CSS класс өгөх атрибут аль вэ?",
          [["А", "style"], ["Б", "class"], ["В", "cssClass"], ["Г", "className"]],
          "Г",
        ),
        mcq(
          "2",
          "Аль return зөв (алдаагүй) вэ?",
          [
            ["А", "return (<><h1>Гарчиг</h1><p>Текст</p></>);"],
            ["Б", "return [h1, p];"],
            ["В", "return (<h1>Гарчиг</h1><p>Текст</p>);"],
            ["Г", "return <h1>Гарчиг</h1>, <p>Текст</p>;"],
          ],
          "А",
        ),
        mcq(
          "3",
          'Доорх компонент юу харуулах вэ?\n\n```jsx\nconst name = "Сараа";\nreturn <h1>Сайн уу, {name}!</h1>;\n```',
          [["А", "Сайн уу, name!"], ["Б", "Алдаа гарна"], ["В", "Сайн уу, {name}!"], ["Г", "Сайн уу, Сараа!"]],
          "Г",
        ),
        mcq(
          "4",
          "JSX дотор JavaScript илэрхийлэл бичихэд аль хаалтыг хэрэглэх вэ?",
          [["А", "()"], ["Б", "{}"], ["В", "<>"], ["Г", "[]"]],
          "Б",
        ),
        mcq(
          "5",
          "React компонентийн нэр яагаад ТОМ үсгээр эхлэх ёстой вэ?",
          [
            ["А", "JavaScript-ийн дүрэм тул"],
            ["Б", "CSS ажиллахгүй тул"],
            ["В", "Жижиг үсгээр эхэлсэн нэрийг React HTML таг гэж ойлгодог тул"],
            ["Г", "Хурдан ажилладаг тул"],
          ],
          "В",
        ),
        mcq(
          "6",
          "Header.jsx-д `export default function Header() {…}` гэж бичсэн. App.jsx-д хэрхэн импортлох вэ?",
          [
            ["А", 'include Header from "./Header";'],
            ["Б", "require Header;"],
            ["В", 'import Header from "./Header";'],
            ["Г", 'import { Header } from "./Header";'],
          ],
          "В",
        ),
        mcq(
          "7",
          "Greeting компонентийг JSX-д ашиглах зөв бичиглэл аль вэ?",
          [["А", "<greeting>"], ["Б", "Greeting()"], ["В", "<Greeting />"], ["Г", "{Greeting}"]],
          "В",
        ),
        mcq(
          "8",
          "Props-ийн үндсэн үүрэг юу вэ?",
          [
            ["А", "Компонентийг устгах"],
            ["Б", "Эцэг компонентоос хүү компонент руу өгөгдөл дамжуулах"],
            ["В", "Серверээс өгөгдөл татах"],
            ["Г", "CSS загвар хадгалах"],
          ],
          "Б",
        ),
        mcq(
          "9",
          "Props-ийн талаар зөв өгүүлбэр аль вэ?",
          [
            ["А", "Props зөвхөн уншигдана; хүү компонент дотор өөрчилж болохгүй"],
            ["Б", "Props зөвхөн тоо байна"],
            ["В", "Хүү компонент props-ийг чөлөөтэй өөрчилж болно"],
            ["Г", "Props-ийг зөвхөн App ашиглана"],
          ],
          "А",
        ),
        mcq(
          "10",
          '`<Card title="Ном" price={5000} />` юу харуулах вэ?\n\n```jsx\nfunction Card({ title, price }) {\n  return <p>{title}: {price}₮</p>;\n}\n```',
          [["А", "Ном: 5000₮"], ["Б", "Ном: {5000}₮"], ["В", "title: price₮"], ["Г", "{title}: {price}₮"]],
          "А",
        ),
        mcq(
          "11",
          '`<Button />` гэж props-гүй ашиглахад товч дээр юу бичигдэх вэ?\n\n```jsx\nfunction Button({ label = "Дарах" }) {\n  return <button>{label}</button>;\n}\n```',
          [["А", "Дарах"], ["Б", "undefined"], ["В", "Юу ч бичигдэхгүй"], ["Г", "label"]],
          "А",
        ),
        mcq(
          "12",
          "isLoggedIn = false үед юу рендерлэгдэх вэ?\n\n```jsx\n{isLoggedIn ? <Welcome /> : <Login />}\n```",
          [["А", "<Welcome />"], ["Б", "Юу ч үгүй"], ["В", "<Login />"], ["Г", "Хоёулаа"]],
          "В",
        ),
        mcq(
          "13",
          "count = 0 үед дэлгэцэд юу харагдах вэ?\n\n```jsx\n{count && <p>Шинэ: {count}</p>}\n```",
          [["А", "false"], ["Б", "0"], ["В", "Шинэ: 0"], ["Г", "Юу ч харагдахгүй"]],
          "Б",
        ),
        mcq(
          "14",
          "Компонент юу ч рендерлэхгүй байхын тулд юу буцаах вэ?",
          [["А", "return false;"], ["Б", "return null;"], ["В", 'return "";'], ["Г", "return 0;"]],
          "Б",
        ),
        {
          n: "15",
          type: "open",
          points: 4,
          input: { code: "jsx" },
          prompt: "name, age props хүлээн авч, нэрийг `<h3>`-д, насыг «Нас: …» гэж `<p>`-д харуулах UserCard компонент бичнэ үү.",
          rubric: [
            { label: "Функц компонент, нэр зөв", points: 1 },
            { label: "Props задлах", points: 1 },
            { label: "{name}, {age} зөв", points: 1 },
            { label: "Нэг эх элементтэй return", points: 1 },
          ],
          key: 'function UserCard({ name, age }) {\n  return (\n    <div className="user-card">\n      <h3>{name}</h3>\n      <p>Нас: {age}</p>\n    </div>\n  );\n}',
        },
        {
          n: "16",
          type: "open",
          points: 4,
          input: { code: "jsx" },
          prompt: "score props хүлээн авч, 60 ба түүнээс дээш бол «Тэнцсэн», бусад үед «Тэнцээгүй» гэж `<span>`-д харуулах Badge компонент бичнэ үү.",
          rubric: [
            { label: "Props задлах", points: 1 },
            { label: "Нөхцөл score >= 60 зөв", points: 1 },
            { label: "Тернар/if ашигласан", points: 1 },
            { label: "Хоёр текст зөв", points: 1 },
          ],
          key: 'function Badge({ score }) {\n  return <span>{score >= 60 ? "Тэнцсэн" : "Тэнцээгүй"}</span>;\n}',
        },
        {
          n: "17",
          type: "open",
          points: 4,
          prompt:
            'Доорх компонентод 3 алдаа байна. Алдаа бүрийг олж, яагаад буруу болохыг тайлбарлаад зассан кодыг бичнэ үү.\n\n```jsx\nfunction profile() {\n  return (\n    <h2 class="title">Профайл</h2>\n    <p>Сурагч</p>\n  );\n}\n```',
          rubric: [
            { label: "Алдаа бүрийг зөв тайлбарлаж зассан – тус бүр 1", points: 3 },
            { label: "Зассан бүтэн код зөв", points: 1 },
          ],
          key: "1) profile → Profile (компонент том үсгээр эхэлнэ); 2) class → className; 3) 2 эх элемент → <>…</> эсвэл <div>-ээр боох.",
        },
      ],
      sectionB: practical({
        title: "«Бүтээгдэхүүний каталог»",
        prompt: "Онлайн дэлгүүрийн бүтээгдэхүүний каталог бүтээнэ.",
        card: "ProductCard",
        p12: "ProductCard({ name, price, icon, inStock, discount = 0 }) компонент: icon (эможи), нэр, үнийг харуулж, className-ээр карт загвар (хүрээ, зай, булан) өгнө.",
        p13: "Нөхцөлт рендер: inStock бол «Сагслах» товч, үгүй бол «Дууссан» гэсэн бичиг; discount > 0 бол «-X%» тэмдэг, хуучин үнийг зурааслаж, шинэ үнэ = price × (100 − discount) / 100-г харуулна.",
        p14: "App-д 3 ProductCard: (1) хямдралгүй, бэлэн; (2) 20% хямдралтай, бэлэн; (3) дууссан.",
        available: "inStock ? «Сагслах» : «Дууссан» зөв",
        key: "Жишээ: price = 50000, discount = 20 → шинэ үнэ 40000, хуучин үнэ 50000 зураастай. discount && … гэж бичвэл discount = 0 үед «0» гарах алдааг шалгана (discount > 0 && … зөв).",
      }),
    },
    B: {
      units,
      sectionA: [
        mcq(
          "1",
          "JSX-д `<label>`-ийн `for` атрибутыг хэрхэн бичих вэ?",
          [["А", "htmlFor"], ["Б", "labelFor"], ["В", "forId"], ["Г", "for"]],
          "А",
        ),
        mcq(
          "2",
          "Аль return зөв (алдаагүй) вэ?",
          [
            ["А", "return <h1>Гарчиг</h1><p>Текст</p>;"],
            ["Б", "return (<h1>Гарчиг</h1><p>Текст</p>);"],
            ["В", "return (<div><h1>Гарчиг</h1><p>Текст</p></div>);"],
            ["Г", "return h1 + p;"],
          ],
          "В",
        ),
        mcq(
          "3",
          'Доорх компонент юу харуулах вэ?\n\n```jsx\nconst city = "Дархан";\nconst n = 3;\nreturn <p>{city} хотод {n + 2} өдөр</p>;\n```',
          [
            ["А", "{city} хотод {n + 2} өдөр"],
            ["Б", "Дархан хотод 5 өдөр"],
            ["В", "Дархан хотод 32 өдөр"],
            ["Г", "city хотод n + 2 өдөр"],
          ],
          "Б",
        ),
        mcq(
          "4",
          "JSX дотор 2 + 3-ын утгыг (5) харуулах зөв бичиглэл аль вэ?",
          [["А", "<p>2 + 3</p>"], ["Б", "<p>[2 + 3]</p>"], ["В", "<p>(2 + 3)</p>"], ["Г", "<p>{2 + 3}</p>"]],
          "Г",
        ),
        mcq(
          "5",
          "`function card() {…}` гэж нэрлээд `<card />` гэж ашиглавал яагаад ажиллахгүй вэ?",
          [
            ["А", "card нь JavaScript-ийн түлхүүр үг тул"],
            ["Б", "Компонент заавал 2 үгтэй байх ёстой тул"],
            ["В", "Ажиллана, алдаагүй"],
            ["Г", "Жижиг үсгээр эхэлсэн нэрийг React HTML таг гэж ойлгодог тул"],
          ],
          "Г",
        ),
        mcq(
          "6",
          "Footer.jsx-д `export function Footer() {…}` (нэрлэсэн экспорт) гэж бичсэн. Хэрхэн импортлох вэ?",
          [
            ["А", "import * Footer;"],
            ["Б", "include { Footer };"],
            ["В", 'import Footer from "./Footer";'],
            ["Г", 'import { Footer } from "./Footer";'],
          ],
          "Г",
        ),
        mcq(
          "7",
          'Profile компонентод title="Миний" props дамжуулж ашиглах зөв бичиглэл аль вэ?',
          [
            ["А", '<Profile>{title: "Миний"}'],
            ["Б", 'Profile("Миний")'],
            ["В", '<Profile title="Миний" />'],
            ["Г", '<profile title="Миний">'],
          ],
          "В",
        ),
        mcq(
          "8",
          "Props гэж юу вэ?",
          [
            ["А", "React-ийн суулгах команд"],
            ["Б", "Компонентийн CSS файл"],
            ["В", "Компонентод гаднаас (эцгээс) дамжуулж буй утгууд"],
            ["Г", "HTML таг"],
          ],
          "В",
        ),
        mcq(
          "9",
          'Хүү компонент дотор `props.name = "Бат"` гэж бичвэл аль нь зөв бэ?',
          [
            ["А", "Зөвхөн тоон props-ийг өөрчилж болно"],
            ["Б", "Буруу; props зөвхөн уншигдах тул өөрчилж болохгүй"],
            ["В", "Зөв арга, нэр солигдоно"],
            ["Г", "Эцэг компонентын утга мөн солигдоно"],
          ],
          "Б",
        ),
        mcq(
          "10",
          '`<Tag text="Шинэ" color="ногоон" />` юу харуулах вэ?\n\n```jsx\nfunction Tag({ text, color }) {\n  return <span>{text} ({color})</span>;\n}\n```',
          [["А", "{text} ({color})"], ["Б", "text (color)"], ["В", "Шинэ (ногоон)"], ["Г", "Шинэ ногоон"]],
          "В",
        ),
        mcq(
          "11",
          "`<Avatar size={80} />` юу харуулах вэ?\n\n```jsx\nfunction Avatar({ size = 50 }) {\n  return <p>Хэмжээ: {size}</p>;\n}\n```",
          [["А", "Хэмжээ: 80"], ["Б", "Хэмжээ: 50"], ["В", "Хэмжээ: 130"], ["Г", "Хэмжээ: size"]],
          "А",
        ),
        mcq(
          "12",
          "hasError = true үед юу рендерлэгдэх вэ?\n\n```jsx\n{hasError ? <Error /> : <Success />}\n```",
          [["А", "<Error />"], ["Б", "<Success />"], ["В", "Хоёулаа"], ["Г", "Юу ч үгүй"]],
          "А",
        ),
        mcq(
          "13",
          "items = [] (хоосон) үед дэлгэцэд юу харагдах вэ?\n\n```jsx\n{items.length && <List items={items} />}\n```",
          [["А", "0"], ["Б", "Юу ч харагдахгүй"], ["В", "false"], ["Г", "<List />"]],
          "А",
        ),
        mcq(
          "14",
          "show = false үед Banner юу ч харуулахгүй байх ёстой. Хоосон зайд юу бичих вэ?\n\n```jsx\nfunction Banner({ show }) {\n  if (!show) ______\n  return <div>Урамшуулал</div>;\n}\n```",
          [["А", "break;"], ["Б", "return null;"], ["В", "return <div />;"], ["Г", "return 0;"]],
          "Б",
        ),
        {
          n: "15",
          type: "open",
          points: 4,
          input: { code: "jsx" },
          prompt: "title, author props хүлээн авч, номын нэрийг `<h3>`-д, зохиолчийг «Зохиолч: …» гэж `<p>`-д харуулах BookCard компонент бичнэ үү.",
          rubric: [
            { label: "Функц компонент, нэр зөв", points: 1 },
            { label: "Props задлах", points: 1 },
            { label: "{title}, {author} зөв", points: 1 },
            { label: "Нэг эх элементтэй return", points: 1 },
          ],
          key: 'function BookCard({ title, author }) {\n  return (\n    <div className="book-card">\n      <h3>{title}</h3>\n      <p>Зохиолч: {author}</p>\n    </div>\n  );\n}',
        },
        {
          n: "16",
          type: "open",
          points: 4,
          input: { code: "jsx" },
          prompt: "online props (true/false) хүлээн авч, true бол «Онлайн», false бол «Офлайн» гэж `<span>`-д харуулах Status компонент бичнэ үү.",
          rubric: [
            { label: "Props задлах", points: 1 },
            { label: "online нөхцөл зөв", points: 1 },
            { label: "Тернар/if ашигласан", points: 1 },
            { label: "Хоёр текст зөв", points: 1 },
          ],
          key: 'function Status({ online }) {\n  return <span>{online ? "Онлайн" : "Офлайн"}</span>;\n}',
        },
        {
          n: "17",
          type: "open",
          points: 4,
          prompt:
            'Доорх компонентод 3 алдаа байна. Алдаа бүрийг олж, яагаад буруу болохыг тайлбарлаад зассан кодыг бичнэ үү.\n\n```jsx\nfunction card(props) {\n  return (\n    <div class="card"><h3>{props.title}</h3></div>\n    <p>Шинэ</p>\n  );\n}\n```',
          rubric: [
            { label: "Алдаа бүрийг зөв тайлбарлаж зассан – тус бүр 1", points: 3 },
            { label: "Зассан бүтэн код зөв", points: 1 },
          ],
          key: "1) card → Card (компонент том үсгээр эхэлнэ); 2) class → className; 3) 2 эх элемент (div, p) → <>…</>-ээр боох эсвэл p-г div дотор оруулах.",
        },
      ],
      sectionB: practical({
        title: "«Аяллын багц»",
        prompt: "Аяллын компанийн аяллын багцын каталог бүтээнэ.",
        card: "TourCard",
        p12: "TourCard({ name, price, icon, seats, discount = 0 }) компонент: icon (эможи), аяллын нэр, үнэ, үлдсэн суудлын тоог харуулж, className-ээр карт загвар өгнө.",
        p13: "Нөхцөлт рендер: seats > 0 бол «Захиалах» товч, үгүй бол «Суудал дууссан» бичиг; discount > 0 бол «-X%» тэмдэг, хуучин үнийг зурааслаж, шинэ үнэ = price × (100 − discount) / 100-г харуулна.",
        p14: "App-д 3 TourCard: (1) хямдралгүй, суудалтай; (2) 15% хямдралтай, суудалтай; (3) суудал дууссан (seats = 0).",
        available: "seats > 0 ? «Захиалах» : «Суудал дууссан» зөв",
        key: "Жишээ: price = 800000, discount = 15 → шинэ үнэ 680000. seats && … гэж бичвэл seats = 0 үед «0» гарах алдааг шалгана.",
      }),
    },
  },
};

export default grade12;
