import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.REACT_APP_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

class RateLimiter {
  constructor(tokensPerInterval, interval) {
    this.tokensPerInterval = tokensPerInterval;
    this.interval = interval;
    this.tokenBucket = tokensPerInterval;
    this.lastRefillTimestamp = Date.now();
  }

  async getToken() {
    const now = Date.now();
    const timeSinceLastRefill = now - this.lastRefillTimestamp;
    const refillAmount = Math.floor(timeSinceLastRefill / this.interval) * this.tokensPerInterval;

    this.tokenBucket = Math.min(this.tokenBucket + refillAmount, this.tokensPerInterval);
    this.lastRefillTimestamp = now;

    if (this.tokenBucket >= 1) {
      this.tokenBucket -= 1;
      return true;
    }

    return false;
  }
}

const rateLimiter = new RateLimiter(10, 60 * 1000); // 10 tokens per minute

const aiService = {
  generateCode: async (existingCode, userPrompt, language) => {
    try {
      const hasToken = await rateLimiter.getToken();
      if (!hasToken) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `
        Given the following existing code:

        \`\`\`${language}
        ${existingCode}
        \`\`\`

        User request: ${userPrompt}

        Please provide only the code snippet that fulfills the user's request. Do not include any explanations or text outside of the code. The output should be valid ${language} code that can be directly inserted into the existing code and also remember that the code is being executed in the online code editor.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      console.log(response)
      let generatedCode = response.text().trim();

      // Remove any potential markdown code block syntax
      generatedCode = generatedCode
        .replace(/^```[\w]*\n/, "")
        .replace(/\n```$/, "");

      return generatedCode;
    } catch (error) {
      console.error("Error generating code:", error);
      throw error;
    }
  },
};

export default aiService;