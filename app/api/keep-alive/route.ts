import { NextResponse } from 'next/server';
// 1. 改成直接 import supabase (注意这里的大括号，如果报错就拿掉大括号试试)
import { supabase } from '@/utils/supabase'; 

export async function GET(request: Request) {
  // 测试期间先 comment 掉验证
   const authHeader = request.headers.get('authorization');
   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
     return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. 这里不需要再去 const supabase = createClient() 了，删掉那行！
    // 直接用上面 import 进来的 supabase 去 fetch 数据
    const { data, error } = await supabase.from('reviews').select('id').limit(1);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase pinged successfully!',
      data: data 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}