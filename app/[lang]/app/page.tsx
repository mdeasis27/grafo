import { notFound } from "next/navigation";
import { LocaleProvider } from "@/design-system/i18n/context";
import { StoryPage } from "@/components/story-page";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "en" && lang !== "es") notFound();
  return <LocaleProvider locale={lang}><StoryPage /></LocaleProvider>;
}
