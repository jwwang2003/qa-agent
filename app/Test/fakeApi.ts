import { GenerateAnswerAPI } from "@/Components/Response";

// Simulated asynchronous API call (replace with your actual API call)
export async function mockGenerateAnswer(query: string): Promise<GenerateAnswerAPI> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Create a fake response data structure similar to what your frontend expects
      let answer:GenerateAnswerAPI = {
          title_summary: query ? `Summary for: ${query}` : "没有摘要",
          model_answer: query ? `This is the model's answer to: ${query}` : "没有大模型回答",
          title_related: query ? `Related titles for: ${query}` : "无",
          content_related: query ? `Related content for: ${query}` : "无",
        };
      resolve(answer);
    }, 2000);
  });
}