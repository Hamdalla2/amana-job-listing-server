const express = require("express");
const multer = require("multer");
const { PDFExtract } = require("pdf.js-extract");
// Using Gemini API with correct model name (gemini-2.5-flash)
const { analyzeCVWithJobs } = require("./analyzeResume");
const fs = require("fs");
const os = require("os");
const path = require("path");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/analyze-cv", upload.single("resume"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No resume file uploaded." });
  }

  const tempFilePath = path.join(os.tmpdir(), req.file.originalname);
  const { jobs, filters } = req.body;

  try {
    fs.writeFileSync(tempFilePath, req.file.buffer);

    const pdfExtract = new PDFExtract();
    const data = await pdfExtract.extract(tempFilePath, {});
    const resumeText = data.pages
      .map((page) => page.content.map((item) => item.str).join(" "))
      .join("\n");

    if (!resumeText) {
      return res
        .status(400)
        .json({ error: "Could not extract text from the PDF." });
    }

    // Parse jobs and filters from request body
    let jobsArray = [];
    let filtersObj = {};

    try {
      jobsArray = JSON.parse(jobs || "[]");
      filtersObj = JSON.parse(filters || "{}");
    } catch (parseError) {
      console.error("Error parsing jobs/filters:", parseError);
      return res.status(400).json({ error: "Invalid jobs or filters format." });
    }

    // Filter jobs based on filter criteria
    const filteredJobs = jobsArray.filter((job) => {
      if (
        filtersObj.type &&
        filtersObj.type !== "All" &&
        job.type !== filtersObj.type
      ) {
        return false;
      }
      return true;
    });

    // Limit jobs sent to API to prevent timeout (max 200 jobs)
    const MAX_JOBS_TO_ANALYZE = 200;
    const jobsToAnalyze =
      filteredJobs.length > MAX_JOBS_TO_ANALYZE
        ? filteredJobs.slice(0, MAX_JOBS_TO_ANALYZE)
        : filteredJobs;

    console.log(
      `Analyzing ${jobsToAnalyze.length} jobs (out of ${filteredJobs.length} filtered, ${jobsArray.length} total)`,
    );

    // Call Gemini API for analysis
    const analysis = await analyzeCVWithJobs(
      resumeText,
      jobsToAnalyze,
      filtersObj,
    );

    res.json({
      jobMatches: analysis.jobMatches || [],
      cvAnalysis: analysis.cvAnalysis || {
        strengths: [],
        weaknesses: [],
        extractedSkills: [],
        suggestedSkillsToLearn: [],
      },
      totalJobsAnalyzed: jobsToAnalyze.length,
      totalJobsAvailable: filteredJobs.length,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    console.error("Error stack:", error.stack);
    const errorMessage =
      error.message || "An error occurred during CV analysis.";
    res.status(500).json({
      error: errorMessage,
      details:
        process.env.VITE_NODE_ENV === "development" ? error.stack : undefined,
    });
  } finally {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
});

module.exports = router;
