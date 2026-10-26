import { JoinForm } from "./JoinForm";

export default function Home() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-5xl items-center gap-10 px-4 py-10 md:grid-cols-[1.1fr_1fr] md:px-8">
      <section>
        <p className="mb-3 font-semibold text-indigo">Программчлал</p>
        <h1 className="text-4xl leading-tight font-bold md:text-5xl">Хөндлөнгийн шалгалт</h1>
        <p className="mt-4 max-w-md text-lg text-muted">
          Шалгалт хоёр хэсэгтэй. Онолын хэсэг 20 минут, практик хэсэг 40 минут үргэлжилнэ. Хариулт тань автоматаар
          хадгалагдана.
        </p>
        <ul className="mt-6 flex max-w-md flex-col gap-2 text-[0.95rem]">
          <li className="flex gap-3">
            <span className="qnum shrink-0 scale-75">А</span>
            <span>Олон сонголттой, задгай даалгавар. Илгээсний дараа практик хэсэг шууд эхэлнэ.</span>
          </li>
          <li className="flex gap-3">
            <span className="qnum shrink-0 scale-75">Б</span>
            <span>Компьютер дээрх практик: код бичиж, ажиллуулж шалгана.</span>
          </li>
        </ul>
        <p className="mt-6 max-w-md rounded-lg bg-warn-tint px-3 py-2 text-[0.95rem] text-warn">
          Шалгалтын үеэр өөр таб, цонх руу шилжвэл багшид бүртгэгдэж, олон удаа гарвал шалгалт автоматаар дуусна.
        </p>
      </section>
      <section className="rounded-2xl border border-line bg-surface p-6 md:p-8">
        <JoinForm />
      </section>
    </main>
  );
}
