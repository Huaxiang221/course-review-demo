"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import Link from "next/link";

type Subject = {
  id: number;
  code: string;
  name: string;
  year: number;
};

const years = [1, 2, 3, 4];

export default function DemoHome() {
  // 🌟 修复关键 1：初始状态设为 0，代表“还在回忆中”，避免一上来就瞎跑去拿 Year 1
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. 恢复记忆
  useEffect(() => {
    const saved = sessionStorage.getItem("demo_year");
    if (saved) {
      setSelectedYear(Number(saved));
    } else {
      setSelectedYear(1); // 如果没记忆，才去选 Year 1
    }
  }, []);

  // 2. 抓取数据
  useEffect(() => {
    if (selectedYear === 0) return; // 如果还在“回忆中”，先按兵不动！

    let ignore = false; // 🌟 修复关键 2：防鬼畜开关

    async function fetchSubjects() {
      setLoading(true);
      const { data } = await supabase
        .from("subjects")
        .select("*")
        .eq("year", selectedYear);
      
      // 只有在“没有被忽略”的情况下，才把数据放进盒子里
      if (!ignore) {
        setSubjects(data || []);
        setLoading(false);
      }
    }

    fetchSubjects();

    // 🌟 修复关键 3：清理函数。如果用户飞快点击不同年份，立刻把上一轮慢吞吞的数据作废！
    return () => {
      ignore = true; 
    };
  }, [selectedYear]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6 font-sans">
      
      {/* 炫酷渐变色标题 */}
      <div className="w-full max-w-md mt-10 mb-8 text-center animate-fade-in">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600 mb-2 tracking-tight">
          UNI COURSE REVIEW
        </h1>
        <p className="text-gray-400 font-bold text-xs tracking-widest uppercase bg-gray-200/50 inline-block px-3 py-1 rounded-full">
          Portfolio Demo
        </p>
      </div>

      {/* 高级感年份选择器 */}
      <div className="bg-white p-1.5 rounded-full shadow-sm border border-gray-100 mb-8 flex justify-between w-full max-w-md relative z-10">
        {years.map((y) => (
          <button 
            key={y}
            onClick={() => {
              setSelectedYear(y);
              sessionStorage.setItem("demo_year", y.toString());
            }}
            className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
              selectedYear === y 
                ? 'bg-gray-900 text-white shadow-md scale-100' 
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Year {y}
          </button>
        ))}
      </div>

      {/* 课程卡片列表 */}
      <div className="w-full max-w-md grid gap-4">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-400 font-medium text-sm animate-pulse">Fetching courses...</p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-4xl border border-gray-100 shadow-sm mt-4">
            <p className="text-5xl mb-4 opacity-40">📚</p>
            <p className="text-gray-500 font-bold">No courses found for Year {selectedYear}</p>
            <p className="text-xs text-gray-400 mt-2 font-medium">Add some data in Supabase!</p>
          </div>
        ) : (
          subjects.map(s => (
            <Link 
              href={`/course/${s.code}`} 
              key={s.id} 
              className="group block bg-white p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-100 hover:-translate-y-1 overflow-hidden relative"
            >
              {/* 卡片左侧悬浮亮条 */}
              <div className="absolute top-0 left-0 w-1.5 h-full bg-linear-to-b from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="flex justify-between items-center pl-2">
                <div>
                  <span className="inline-block text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-md border border-blue-100 mb-3 tracking-wide">
                    {s.code}
                  </span>
                  <h3 className="text-lg font-black text-gray-800 group-hover:text-blue-600 transition-colors uppercase leading-tight pr-4">
                    {s.name}
                  </h3>
                </div>
                {/* 悬浮出现的箭头 */}
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shrink-0">
                  <span className="font-bold">➔</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <footer className="mt-16 mb-8 text-gray-300 text-xs font-bold tracking-wider uppercase">
        © 2026 UTM FKM
      </footer>
    </div>
  );
}