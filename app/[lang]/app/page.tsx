import type { Metadata } from "next";
import { STORY } from "@/lib/experience/story";
import { notFound } from "next/navigation";
import { LocaleProvider } from "@/design-system/i18n/context";
import { StoryPage } from "@/components/story-page";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "en" && lang !== "es") notFound();
  return <LocaleProvider locale={lang}><StoryPage /></LocaleProvider>;
}
export async function generateMetadata({params}:{params:Promise<{lang:string}>}):Promise<Metadata>{const {lang}=await params;const s=STORY[lang==="es"?"es":"en"];return {title:s.name,description:s.oneLiner};}
