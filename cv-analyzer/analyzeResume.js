const axios = require("axios");

// Function to call Gemini API with exponential backoff
async function analyzeCVWithJobs(cvText, jobs, filters = {}) {
  const apiKey = process.env.VITE_GEMINI_API_KEY || "";

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please set it in your .env file.",
    );
  }

  // Use the correct Gemini API endpoint - using gemini-2.5-flash (latest stable)
  const modelName = "gemini-2.5-flash"; // Stable version with 1M token input limit
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  console.log(`Calling Gemini API with model: ${modelName}`);
  console.log(
    `API Key present: ${
      apiKey ? "Yes (" + apiKey.substring(0, 10) + "...)" : "No"
    }`,
  );

  // Construct the system prompt
  const systemPrompt = `You are an AI-powered Career Assistant and CV Analyzer.

Your task is to take a user's CV, a list of job postings, and filters, and return a comprehensive analysis in JSON format.

You must:

1. Parse the CV to extract skills, experience, education, and job titles.

2. Compare the CV against EACH job in the provided job list.

3. For each job, calculate a 'suitabilityPercentage' (0-100) based on how well the CV matches the job's 'title', 'description', and 'requirements'.

4. Perform an in-depth analysis of the CV itself, identifying strengths, weaknesses, extracted skills, and suggesting 3-5 specific skills to learn.

5. Return a single JSON object matching the provided schema exactly.`;

  // Define the exact output schema
  const responseSchema = {
    type: "OBJECT",
    properties: {
      jobMatches: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING" },
            title: { type: "STRING" },
            company: { type: "STRING" },
            location: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                lat: { type: "NUMBER" },
                lng: { type: "NUMBER" },
              },
            },
            salary: { type: "STRING" },
            type: { type: "STRING" },
            suitabilityPercentage: { type: "NUMBER" },
          },
          required: [
            "id",
            "title",
            "company",
            "location",
            "salary",
            "type",
            "suitabilityPercentage",
          ],
        },
      },
      cvAnalysis: {
        type: "OBJECT",
        properties: {
          strengths: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
          weaknesses: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
          extractedSkills: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
          suggestedSkillsToLearn: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
        },
        required: [
          "strengths",
          "weaknesses",
          "extractedSkills",
          "suggestedSkillsToLearn",
        ],
      },
    },
    required: ["jobMatches", "cvAnalysis"],
  };

  // Construct the user prompt for the API
  const userQuery = `Please analyze the following CV and job list.

--- CV TEXT ---
${cvText}

--- JOB LIST ---
${JSON.stringify(jobs)}

--- FILTERS ---
${JSON.stringify(filters)}
`;

  // For gemini-2.5-flash (v1beta API), we can use structured output with responseSchema
  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.2,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 65536, // gemini-2.5-flash supports up to 65K tokens
    },
  };

  let response;
  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      console.log(
        `Attempt ${retries + 1}/${maxRetries}: Calling Gemini API...`,
      );
      response = await axios.post(apiUrl, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 180000, // 3 minutes timeout - Gemini 2.5 Flash can handle large requests but takes time
      });

      if (response.status === 200) {
        console.log("Gemini API call successful");
        break; // Success
      }

      if (response.status === 429 || response.status >= 500) {
        // Retryable error
        const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        retries++;
      } else {
        // Non-retryable error
        throw new Error(
          `API request failed with status ${response.status}: ${JSON.stringify(
            response.data,
          )}`,
        );
      }
    } catch (err) {
      if (retries >= maxRetries - 1) {
        console.error("API call failed after retries:", err);
        const errorMessage =
          err.response?.data?.error?.message || err.message || "Unknown error";
        const errorStatus = err.response?.status || "Unknown";
        console.error("Full error details:", {
          status: errorStatus,
          data: err.response?.data,
          message: errorMessage,
        });
        throw new Error(
          `Error analyzing CV (Status ${errorStatus}): ${errorMessage}. Please try again later.`,
        );
      }

      const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      retries++;
    }
  }

  // Process the response
  try {
    const candidate = response.data.candidates?.[0];

    if (candidate && candidate.content?.parts?.[0]?.text) {
      let jsonText = candidate.content.parts[0].text;

      // Clean up the response - remove markdown code blocks if present
      jsonText = jsonText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsedData = JSON.parse(jsonText);

      // Sort job matches by suitability, highest first
      if (parsedData.jobMatches && Array.isArray(parsedData.jobMatches)) {
        parsedData.jobMatches.sort(
          (a, b) => b.suitabilityPercentage - a.suitabilityPercentage,
        );
      }

      return parsedData;
    } else {
      console.error("Invalid API response structure:", response.data);
      throw new Error(
        "Could not parse the analysis from the AI. The response was empty or malformed.",
      );
    }
  } catch (err) {
    console.error("Error parsing API response:", err, response.data);
    throw new Error(`Error processing analysis: ${err.message}`);
  }
}

module.exports = { analyzeCVWithJobs };
