 "use client";
import { useEffect, useMemo, useState } from "react";
import { Activity, Building2, MessageSquareText, Sparkles, Upload, RefreshCw, Search, LayoutDashboard, Star, AlertTriangle, CheckCircle2, FileUp, ArrowUpRight } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import Papa from "papaparse";
import type { Review } from "@/types/review";
import { getAnalytics } from "@/lib/analytics";
import { properties } from "@/lib/demo-data";

type Insights = { summary:string; strengths:string[]; issues:{topic:string;severity:string;evidence:string}[]; actions:{priority:string;action:string;owner:string}[]; property_observations:{property:string;observation:string}[] };

const COLORS = ["#16a085","#e6a23c","#e05b63"];
const sampleTrend = [{month:"Jul",rating:7.6},{month:"Aug",rating:7.9},{month:"Sep",rating:8.1},{month:"Oct",rating:8.4}];

export default function DashboardPage() {
  const [reviews,setReviews] = useState<Review[]>([]);
  const [mode,setMode] = useState("loading");
  const [property,setProperty] = useState("All properties");
  const [sentiment,setSentiment] = useState("All sentiments");
  const [search,setSearch] = useState("");
  const [insights,setInsights] = useState<Insights|null>(null);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");

  async function load() {
    setMessage("");
    const res = await fetch("/api/reviews");
    const data = await res.json();
    if (!res.ok) { setMessage(data.error || "Could not load reviews"); return; }
    setReviews(data.reviews); setMode(data.mode);
  }
  useEffect(()=>{ load(); },[]);

  const filtered = useMemo(()=>reviews.filter(r =>
    (property==="All properties" || r.property===property) &&
    (sentiment==="All sentiments" || r.sentiment===sentiment) &&
    `${r.guest_name} ${r.title} ${r.review_text} ${r.category}`.toLowerCase().includes(search.toLowerCase())
  ),[reviews,property,sentiment,search]);
  const stats = getAnalytics(filtered);
  const barData = stats.propertyStats;
  const sentimentData = [
    {name:"Positive",value:stats.positive},{name:"Neutral",value:stats.neutral},{name:"Negative",value:stats.negative}
  ];

  async function runAI() {
    setBusy(true); setMessage("");
    try {
      const res = await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reviews:filtered})});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");
      setInsights(data.insights);
    } catch(e) { setMessage(e instanceof Error ? e.message : "AI analysis failed"); }
    finally { setBusy(false); }
  }

  async function importCSV(file: File) {
    Papa.parse<Record<string,string>>(file,{header:true,skipEmptyLines:true,complete:async result=>{
      const rows = result.data.map((r,i)=>({
        id:`csv-${Date.now()}-${i}`,
        property:r.property || r.hotel || "",
        guest_name:r.guest_name || r.guest || "Guest",
        review_date:r.review_date || r.date || new Date().toISOString().slice(0,10),
        rating:Number(r.rating || r.score),
        title:r.title || "",
        review_text:r.review_text || r.review || r.text || "",
        sentiment:(r.sentiment || (Number(r.rating || r.score)>=8?"Positive":Number(r.rating || r.score)>=6?"Neutral":"Negative")) as Review["sentiment"],
        category:r.category || "Other",
        source:"CSV import"
      }));
      const res=await fetch("/api/reviews",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reviews:rows})});
      const data=await res.json();
      if(!res.ok){setMessage(data.error || "Import failed");return;}
      setMessage(`Imported ${data.imported} reviews successfully.`); await load();
    }});
  }

  return <main className="min-h-screen">
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col bg-[#111c32] p-5 text-white md:flex">
        <div className="mb-10 flex items-center gap-3"><div className="rounded-xl bg-cyan-400/15 p-2 text-cyan-300"><Activity size={23}/></div><div><div className="font-semibold tracking-wide">AZZURRO</div><div className="text-xs text-slate-400">Review Intelligence</div></div></div>
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-[.2em] text-slate-500">Workspace</div>
        <div className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-3 text-sm"><LayoutDashboard size={17}/> Overview</div>
        <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-xs text-slate-400">Data mode</div><div className="mt-1 text-sm font-medium">{mode==="supabase"?"Connected database":mode==="demo"?"Demonstration data":"Connecting..."}</div><div className="mt-2 text-[11px] leading-5 text-slate-400">Use authorised property review exports for production analysis.</div></div>
      </aside>

      <section className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 md:px-8">
          <div><div className="text-xs text-slate-500">Azzurro Hotels / Analytics</div><h1 className="mt-1 text-xl font-bold tracking-tight">Review overview</h1></div>
          <div className="flex items-center gap-2"><label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"><FileUp size={16}/> Import CSV<input type="file" accept=".csv" className="hidden" onChange={e=>{if(e.target.files?.[0]) importCSV(e.target.files[0]);e.currentTarget.value="";}}/></label><button onClick={load} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50" title="Refresh"><RefreshCw size={17}/></button></div>
        </header>

        <div className="mx-auto max-w-[1500px] space-y-6 p-5 md:p-8">
          {mode==="demo" && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><strong>Demo mode:</strong> These are fictional demonstration reviews, not actual Booking.com guest data.</div>}
          {message && <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">{message}</div>}

          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">Property performance</h2><p className="mt-1 text-sm text-slate-500">A consolidated view of guest feedback across the portfolio.</p></div><div className="flex flex-wrap gap-2"><select value={property} onChange={e=>setProperty(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option>All properties</option>{properties.map(p=><option key={p}>{p}</option>)}</select><select value={sentiment} onChange={e=>setSentiment(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option>All sentiments</option><option>Positive</option><option>Neutral</option><option>Negative</option></select></div></div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={<MessageSquareText/>} label="Total reviews" value={stats.total.toLocaleString()} note="In current selection" tint="blue"/>
            <Metric icon={<Star/>} label="Average rating" value={stats.average.toFixed(1)+"/10"} note="Mean guest score" tint="gold"/>
            <Metric icon={<CheckCircle2/>} label="Positive reviews" value={stats.positivePct+"%"} note={`${stats.positive} positive reviews`} tint="green"/>
            <Metric icon={<AlertTriangle/>} label="Negative reviews" value={stats.negativePct+"%"} note={`${stats.negative} need attention`} tint="red"/>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <div className="panel p-5 xl:col-span-2"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-semibold">Property comparison</h3><p className="text-xs text-slate-500">Average guest rating by property</p></div><Building2 className="text-slate-400"/></div><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={barData} margin={{top:5,right:10,left:-20,bottom:30}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1f6"/><XAxis dataKey="property" angle={-15} textAnchor="end" interval={0} tick={{fontSize:10}}/><YAxis domain={[0,10]} tick={{fontSize:11}}/><Tooltip/><Bar dataKey="average" name="Average rating" fill="#3986a8" radius={[7,7,0,0]} /></BarChart></ResponsiveContainer></div></div>
            <div className="panel p-5"><h3 className="font-semibold">Sentiment mix</h3><p className="text-xs text-slate-500">Distribution of classified reviews</p><div className="h-56"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sentimentData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={4}>{sentimentData.map((entry,i)=><Cell key={entry.name} fill={COLORS[i]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div><div className="space-y-2">{sentimentData.map((s,i)=><div key={s.name} className="flex justify-between text-sm"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{background:COLORS[i]}}/>{s.name}</span><strong>{s.value}</strong></div>)}</div></div>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <div className="panel p-5 xl:col-span-2"><div className="mb-4"><h3 className="font-semibold">Rating trend</h3><p className="text-xs text-slate-500">Illustrative monthly trend — replace with dated historical data when available.</p></div><div className="h-56"><ResponsiveContainer width="100%" height="100%"><LineChart data={sampleTrend}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1f6"/><XAxis dataKey="month"/><YAxis domain={[0,10]}/><Tooltip/><Line type="monotone" dataKey="rating" stroke="#3986a8" strokeWidth={3} dot={{r:4}}/></LineChart></ResponsiveContainer></div></div>
            <div className="panel p-5"><h3 className="font-semibold">Common topics</h3><p className="mb-4 text-xs text-slate-500">Categories in the selected reviews</p><div className="space-y-4">{stats.categories.map(c=><div key={c.category}><div className="mb-1 flex justify-between text-sm"><span>{c.category}</span><strong>{c.count}</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#3986a8]" style={{width:`${stats.total?c.count/stats.total*100:0}%`}}/></div></div>)}</div></div>
          </div>

          <div className="panel p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><Sparkles className="text-violet-600"/><h3 className="font-semibold">AI operations insights</h3></div><p className="mt-1 text-xs text-slate-500">Gemini analyses the currently filtered reviews and suggests practical actions.</p></div><button onClick={runAI} disabled={busy || !filtered.length} className="flex items-center gap-2 rounded-lg bg-[#172b46] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#233e62] disabled:opacity-50">{busy?"Analysing...":<><Sparkles size={15}/> Generate insights</>}</button></div>
            {insights ? <div className="mt-5 space-y-4"><div className="rounded-xl bg-violet-50 p-4 text-sm leading-6 text-violet-950">{insights.summary}</div><div className="grid gap-4 md:grid-cols-2"><div><h4 className="mb-2 text-sm font-semibold">Strengths</h4><ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">{insights.strengths?.map((s,i)=><li key={i}>{s}</li>)}</ul></div><div><h4 className="mb-2 text-sm font-semibold">Issues to monitor</h4><div className="space-y-2">{insights.issues?.map((x,i)=><div key={i} className="rounded-lg border border-slate-100 p-3"><div className="flex justify-between gap-2 text-sm font-medium">{x.topic}<span className="text-xs text-rose-600">{x.severity}</span></div><p className="mt-1 text-xs text-slate-500">{x.evidence}</p></div>)}</div></div></div><div><h4 className="mb-2 text-sm font-semibold">Recommended actions</h4><div className="grid gap-2 md:grid-cols-2">{insights.actions?.map((a,i)=><div key={i} className="rounded-lg border border-slate-100 p-3"><div className="mb-1 flex justify-between text-xs"><span className="font-semibold text-slate-500">{a.owner}</span><span className="text-amber-700">{a.priority} priority</span></div><p className="text-sm">{a.action}</p></div>)}</div></div></div> : <div className="mt-5 rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">Generate insights to identify recurring themes and operational priorities.</div>}
          </div>

          <div className="panel overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5"><div><h3 className="font-semibold">Guest reviews</h3><p className="text-xs text-slate-500">{filtered.length} reviews match your filters</p></div><div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search reviews..." className="w-56 rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-500"/></div></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Property / Guest</th><th className="px-5 py-3">Review</th><th className="px-5 py-3">Rating</th><th className="px-5 py-3">Sentiment</th><th className="px-5 py-3">Date</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(r=><tr key={r.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><div className="font-medium">{r.property}</div><div className="text-xs text-slate-500">{r.guest_name}</div></td><td className="max-w-md px-5 py-4"><div className="font-medium">{r.title}</div><div className="line-clamp-2 text-xs leading-5 text-slate-500">{r.review_text}</div><div className="mt-1 text-[11px] text-slate-400">{r.category}</div></td><td className="px-5 py-4 font-semibold">{Number(r.rating).toFixed(1)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.sentiment==="Positive"?"bg-emerald-50 text-emerald-700":r.sentiment==="Negative"?"bg-rose-50 text-rose-700":"bg-amber-50 text-amber-700"}`}>{r.sentiment}</span></td><td className="px-5 py-4 text-xs text-slate-500">{r.review_date}</td></tr>)}</tbody></table>{!filtered.length&&<div className="p-8 text-center text-sm text-slate-500">No reviews match these filters.</div>}</div></div>
          <footer className="pb-5 text-center text-xs text-slate-400">Azzurro Review Insights · Demonstration build · Verify imported data before operational decisions</footer>
        </div>
      </section>
    </div>
  </main>;
}

function Metric({icon,label,value,note,tint}:{icon:React.ReactNode;label:string;value:string;note:string;tint:string}) {
  const styles:Record<string,string>={blue:"bg-sky-50 text-sky-700",gold:"bg-amber-50 text-amber-700",green:"bg-emerald-50 text-emerald-700",red:"bg-rose-50 text-rose-700"};
  return <div className="panel p-5"><div className="flex items-center justify-between"><span className="text-sm text-slate-500">{label}</span><span className={`rounded-xl p-2 ${styles[tint]}`}>{icon}</span></div><div className="mt-3 text-3xl font-bold tracking-tight">{value}</div><div className="mt-1 text-xs text-slate-500">{note}</div></div>;
}
