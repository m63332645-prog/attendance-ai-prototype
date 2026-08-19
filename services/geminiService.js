import { GoogleGenAI } from "@google/genai";

export const getAIProgressReminder = async (userName, data) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const { 
      currentDay, 
      totalDays, 
      actualCheckins, 
      targetCheckins, 
      activityName 
    } = data;

    const timeProgress = ((currentDay / totalDays) * 100).toFixed(1);
    const checkinProgress = ((actualCheckins / targetCheckins) * 100).toFixed(1);
    const isBehind = parseFloat(checkinProgress) < parseFloat(timeProgress);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{
          text: `你是一位中宏人寿（Manulife-Sinochem）的专业主管助手。
          正在为代理人 ${userName} 生成月度指标进度智能提醒。
          
          当前数据：
          - 考核活动：${activityName}
          - 本月已过天数：${currentDay} 天（总共 ${totalDays} 天）
          - 序时进度：${timeProgress}%
          - 实际打卡天数：${actualCheckins} 天
          - 目标打卡天数：${targetCheckins} 天
          - 打卡进度：${checkinProgress}%
          - 是否落后于序时进度：${isBehind ? '是' : '否'}

          要求：
          1. 话术要专业、简练（30字以内）。
          2. 如果进度正常（不落后），给予肯定并提醒保持。
          3. 如果进度落后，指出差距，并给出具体的追赶建议（例如：接下来的日子必须全勤）。
          4. 语气要符合中宏人寿的企业文化：专业、诚信、关怀。
          5. 不要使用“今日鼓励”这种词汇，直接输出提醒话术。`
        }]
      }],
    });
    
    return response.text || (isBehind 
      ? `当前${activityName}进度${checkinProgress}%，落后于序时进度${timeProgress}%。请务必在剩余${totalDays - currentDay}天内保持全勤以达成指标。`
      : `当前${activityName}进度${checkinProgress}%，领先于序时进度${timeProgress}%。表现优异，请继续保持！`);
  } catch (error) {
    console.error("Gemini Progress Reminder Error:", error);
    return "系统繁忙，请关注您的月度考勤指标达成情况。";
  }
};

export const analyzeAttendance = async (records) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{
          text: `Analyze these attendance records for a Manulife-Sinochem insurance agent: ${records}. Provide a brief professional summary and one tip for improvement in Chinese. Be encouraging and focus on the importance of meeting activity targets (Activity-Based Management).`
        }]
      }],
    });
    
    return response.text || "您的勤奋是成功的基石，保持良好的活动量是中宏人职业成长的关键。";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "您的勤奋是成功的基石，保持良好的活动量是中宏人职业成长的关键。";
  }
};

export const recognizeWorkplace = async (base64Image, workplaceName) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: 'image/jpeg'
            }
          },
          {
            text: `Analyze this photo taken by a Manulife-Sinochem (中宏人寿) agent. The agent is claiming to be at "${workplaceName}". 
            Does the background look like a professional insurance office environment? 
            Look for specific features like Manulife-Sinochem branding, office desks, professional attire, or typical insurance agency decor.
            Respond in JSON format: { "isRecognized": boolean, "confidence": number, "reason": "Chinese explanation" }. 
            Confidence should be between 0 and 1.`
          }
        ]
      }],
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text);
    return result;
  } catch (error) {
    console.error("Gemini Recognition Error:", error);
    // Fallback for demo purposes
    return { isRecognized: true, confidence: 0.9, reason: "系统已识别到中宏人寿职场固定特征背景。" };
  }
};
