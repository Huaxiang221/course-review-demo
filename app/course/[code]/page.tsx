"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { useRouter, useParams } from "next/navigation";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

type Subject = {
  id: number;
  code: string;
  name: string;
  year: number;
  ai_summary?: string; // 🌟 新增：对应数据库里的新 Column
};

type Review = {
  id: number;
  subject_code: string;
  student_name: string;
  rating: number;
  comment: string;
};

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

function StarIcon({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#FACC15" : "#E5E7EB"} style={{ minWidth: size, transition: "fill 0.3s ease" }}>
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
  );
}

export default function CourseReviewPage() {
  const params = useParams();
  const router = useRouter();
  const subjectCode = params.code ? decodeURIComponent(params.code as string) : "";

  const [course, setCourse] = useState<Subject | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showChart, setShowChart] = useState(false);
  
  // 🌟 新增：控制 AI 生成按钮的状态
  const [isGenerating, setIsGenerating] = useState(false);

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, cur) => acc + cur.rating, 0) / reviews.length).toFixed(1) 
    : "0.0";

  const mockDescription = `This is a core module for ${subjectCode}. It covers fundamental engineering principles, practical applications, and complex problem-solving techniques essential for modern industry.`;
  
  const mockMarksDistribution = [
    { name: "Final Exam", value: 40 },
    { name: "Midterm", value: 25 },
    { name: "Assignments", value: 20 },
    { name: "Project", value: 15 }
  ];

  useEffect(() => {
    async function fetchData() {
      if (!subjectCode) return;
      const { data: courseData } = await supabase.from("subjects").select("*").eq("code", subjectCode).single();
      if (courseData) setCourse(courseData);

      const { data: reviewData } = await supabase.from("reviews").select("*").eq("subject_code", subjectCode);
      if (reviewData) setReviews(reviewData);
      
      setTimeout(() => setShowChart(true), 300);
    }
    fetchData();
  }, [subjectCode]);

  function handleMockSubmit() {
    if (rating === 0) return alert("Please give a rating! ⭐");
    alert("🚀 Demo Mode: Review submission is simulated successfully! (Database write disabled for public portfolio)");
    setRating(0);
    setComment("");
  }

  // 🌟 核心逻辑：模拟 AI 生成并真正保存到 Supabase
  async function handleGenerateSummary() {
    if (reviews.length === 0) {
      return alert("🤖 AI needs at least one review to analyze and generate a summary! Please add a review first.");
    }
    
    setIsGenerating(true); // 开启 Loading 动画

    // 1. 模拟 AI 思考的时间 (延迟 1.5 秒)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 2. 根据当前的 course 和 reviews 生成专属的动态总结
    const dynamicSummary = {
      en: `Based on ${reviews.length} student reviews, ${subjectCode} holds an average rating of ${averageRating}/5.0. Students find it challenging but rewarding. Practical application is highly emphasized.`,
      ms: `Berdasarkan ${reviews.length} ulasan pelajar, ${subjectCode} mencatatkan purata rating ${averageRating}/5.0. Pelajar mendapatinya mencabar tetapi sangat berbaloi.`,
      zh: `综合 ${reviews.length} 条学生评价，${subjectCode} 的平均得分为 ${averageRating}/5.0。同学们普遍认为这门课颇具挑战，但学有所成。`
    };

    // 把对象转换成 JSON 字符串，才能存进数据库的 TEXT 列
    const summaryJsonString = JSON.stringify(dynamicSummary);

    // 3. 真正保存到 Supabase 数据库
    const { error } = await supabase
      .from("subjects")
      .update({ ai_summary: summaryJsonString })
      .eq("code", subjectCode);

    if (error) {
      alert("Error saving summary to database.");
    } else {
      // 4. 更新本地画面，马上显示出刚刚生成的总结
      if (course) {
        setCourse({ ...course, ai_summary: summaryJsonString });
      }
    }
    
    setIsGenerating(false); // 关闭 Loading 动画
  }

  // 🌟 解析数据库里拿出来的 JSON 字符串
  let parsedAiSummary = null;
  if (course?.ai_summary) {
    try {
      parsedAiSummary = JSON.parse(course.ai_summary);
    } catch (e) {
      console.error("Failed to parse AI summary JSON");
    }
  }

  if (!course) return (
    <div className="p-10 text-center flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-400 font-medium animate-pulse">Loading course data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center text-gray-800 font-sans">
      
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-blue-600 font-bold transition-all hover:-translate-x-1">← Back</button>
        <h1 className="text-xl font-bold text-blue-900">Course Details</h1>
        <div className="w-10"></div>
      </div>

      {/* 1. 课程核心信息 */}
      <div className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100 w-full max-w-md mb-6 text-center relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-blue-500 to-indigo-500"></div>
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 font-bold shadow-sm border border-blue-100 transition-transform duration-500 hover:rotate-12">🎓</div>
        <h2 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">{course.code}</h2>
        <h3 className="text-gray-600 font-bold mb-5 text-sm uppercase tracking-wide">{course.name}</h3>
        
        <div className="bg-gray-50 rounded-2xl p-4 mb-4 inline-flex items-center gap-4 border border-gray-100 shadow-inner">
          <div className="flex items-end gap-1">
             <span className="text-4xl font-black text-gray-800">{averageRating}</span>
             <span className="text-sm text-gray-400 font-bold mb-1">/ 5.0</span>
          </div>
          <div className="h-10 w-0.5 bg-gray-200"></div>
          <div className="text-left">
            <div className="flex text-yellow-400 text-sm mb-1">
              {[1, 2, 3, 4, 5].map(s => <span key={s}>{s <= Math.round(Number(averageRating)) ? "★" : "☆"}</span>)}
            </div>
            <p className="text-xs font-bold text-gray-400">{reviews.length} Student Reviews</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed px-2">{mockDescription}</p>
      </div>

      {/* 2. 饼图 */}
      <div className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100 w-full max-w-md mb-6 transition-all duration-300 hover:shadow-lg">
        <h3 className="text-lg font-black text-gray-800 mb-1 text-center">Marks Distribution</h3>
        <p className="text-xs font-bold text-gray-400 text-center mb-4 uppercase tracking-wider">Assessment Weightage</p>
        <div className="h-60 w-full">
          {showChart ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mockMarksDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none" isAnimationActive={true} animationBegin={0} animationDuration={1500} animationEasing="ease-out">
                  {mockMarksDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity duration-300 outline-none cursor-pointer" />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} itemStyle={{ color: '#1f2937' }}/>
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div></div>
          )}
        </div>
      </div>

      {/* 3. 🌐 真实的数据库 AI Summary 渲染逻辑 */}
      <div className="w-full max-w-md mb-8">
        {parsedAiSummary ? (
          // 如果数据库里已经有 ai_summary 了，就展示出来
          <div className="bg-linear-to-br from-indigo-50 to-blue-50 p-6 rounded-4xl border border-indigo-100 shadow-sm relative transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="absolute top-5 right-5 text-[10px] font-black uppercase tracking-wider bg-white px-3 py-1 rounded-full text-indigo-500 border border-indigo-100 shadow-sm flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> AI Generated
            </div>
            <h3 className="text-indigo-800 font-black text-lg mb-4 flex items-center gap-2">
              <span className="text-2xl animate-bounce">✨</span> Course Summary
            </h3>
            <div className="space-y-4">
              <div className="bg-white/60 p-3 rounded-2xl border border-white">
                <span className="text-xs font-bold text-indigo-400 mb-1 block">🇬🇧 English</span>
                <p className="text-indigo-900/80 text-sm leading-relaxed font-medium">{parsedAiSummary.en}</p>
              </div>
              <div className="bg-white/60 p-3 rounded-2xl border border-white">
                <span className="text-xs font-bold text-indigo-400 mb-1 block">🇲🇾 Bahasa Melayu</span>
                <p className="text-indigo-900/80 text-sm leading-relaxed font-medium">{parsedAiSummary.ms}</p>
              </div>
              <div className="bg-white/60 p-3 rounded-2xl border border-white">
                <span className="text-xs font-bold text-indigo-400 mb-1 block">🇨🇳 中文</span>
                <p className="text-indigo-900/80 text-sm leading-relaxed font-medium">{parsedAiSummary.zh}</p>
              </div>
            </div>
          </div>
        ) : (
          // 数据库里没有 ai_summary 时，显示生成按钮
          <button 
            onClick={handleGenerateSummary}
            disabled={isGenerating}
            className={`w-full text-white p-4 rounded-2xl font-bold shadow-md transition-all flex items-center justify-center gap-2 ${
              isGenerating 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-linear-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 hover:-translate-y-0.5 active:translate-y-0"
            }`}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Analyzing Reviews...
              </>
            ) : (
              <>
                <span className="text-xl">✨</span> Summarize Feedback with AI
              </>
            )}
          </button>
        )}
      </div>

      {/* 4. Review Form */}
      <div className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100 w-full max-w-md mb-8 transition-all duration-300 hover:shadow-lg">
        <h3 className="font-black text-gray-800 mb-4 text-center">Share Your Experience</h3>
        <div className="flex justify-center gap-2 mb-5">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setRating(s)} type="button" className="hover:scale-125 transition-transform duration-200">
              <StarIcon filled={s <= rating} size={40} />
            </button>
          ))}
        </div>
        <textarea
          className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all mb-4 text-sm font-medium resize-none"
          rows={3}
          placeholder="What did you think of this module?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button onClick={handleMockSubmit} className="w-full py-3.5 bg-gray-900 text-white font-black rounded-2xl shadow-lg shadow-gray-200 hover:bg-blue-600 hover:shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
          Submit Review (Demo)
        </button>
      </div>

      {/* 5. Review List */}
      <div className="w-full max-w-md space-y-4">
        <h3 className="text-xl font-black text-gray-800 px-2 flex justify-between items-end mb-2">
          Feedback 
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-200 px-2 py-1 rounded-md">{reviews.length} reviews</span>
        </h3>
        
        {reviews.length === 0 ? (
           <div className="bg-white p-8 rounded-4xl text-center border border-gray-100">
             <p className="text-gray-400 font-medium">No reviews yet.</p>
           </div>
        ) : null}

        {reviews.map((review, i) => (
          <div key={i} className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-default">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-black flex items-center justify-center border border-blue-100">
                  {review.student_name.charAt(0).toUpperCase()}
                </div>
                <span className="font-bold text-gray-800">{review.student_name}</span>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => <StarIcon key={star} filled={star <= review.rating} size={16} />)}
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}