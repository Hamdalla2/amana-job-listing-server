const axios = require("axios");

// Function to call Groq API (Free, Fast, Reliable Alternative)
async function analyzeCVWithJobs(cvText, jobs, filters = {}) {
  const apiKey =
    process.env.VITE_GROQ_API_KEY || process.env.VITE_GEMINI_API_KEY || "";

  if (!apiKey) {
    throw new Error(
      "API key is not configured. Please set GROQ_API_KEY or GEMINI_API_KEY in your .env file.",
    );
  }

  // Use Groq API - it's free, fast, and reliable
  const apiUrl = "https://api.groq.com/openai/v1/chat/completions";

  console.log(`Calling Groq API with model: llama-3.1-70b-versatile`);
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

5. Return ONLY valid JSON matching this exact schema:
{
  "jobMatches": [
    {
      "id": "string",
      "title": "string",
      "company": "string",
      "location": {
        "name": "string",
        "lat": number,
        "lng": number
      },
      "salary": "string",
      "type": "string",
      "suitabilityPercentage": number
    }
  ],
  "cvAnalysis": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "extractedSkills": ["string"],
    "suggestedSkillsToLearn": ["string"]
  }
}`;

  // Construct the user prompt for the API
  const userQuery = `Please analyze the following CV and job list.

--- CV TEXT ---
${cvText}

--- JOB LIST ---
${JSON.stringify(jobs)}

--- FILTERS ---
${JSON.stringify(filters)}

Return ONLY valid JSON without any markdown formatting or code blocks.`;

  const payload = {
    model: "llama-3.1-70b-versatile",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userQuery,
      },
    ],
    temperature: 0.2,
    max_tokens: 8192,
    response_format: { type: "json_object" },
  };

  let response;
  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      console.log(`Attempt ${retries + 1}/${maxRetries}: Calling Groq API...`);
      response = await axios.post(apiUrl, payload, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 60000, // 60 second timeout
      });

      if (response.status === 200) {
        console.log("Groq API call successful");
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
    const choice = response.data.choices?.[0];

    if (choice && choice.message?.content) {
      let jsonText = choice.message.content;

      // Clean up the response - remove markdown code blocks if present
      jsonText = jsonText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // If the response starts with {, it's likely JSON
      if (!jsonText.startsWith("{")) {
        // Try to extract JSON from the response
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }
      }

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
    console.error("Error parsing API response:", err, response?.data);
    throw new Error(`Error processing analysis: ${err.message}`);
  }
}

module.exports = { analyzeCVWithJobs };
