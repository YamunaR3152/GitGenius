import { GoogleGenAI, Type, Chat } from "@google/genai";
import { RepoMetadata, GeminiAnalysis, FileData, CommitData, SummaryStyle, UserRole } from '../types';

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key is missing");
    return new GoogleGenAI({ apiKey });
};

// --- PHASE 2: RULE-BASED DETERMINISTIC AGENTS ---

/**
 * Agent 1: Code Quality Agent (Rules)
 * - Has Linters/Formatters (eslint, prettier, etc): +20
 * - Has Standard Source Folder (src, lib, app): +20
 * - Has Ignore file (.gitignore, .npmignore): +10
 * - File structure depth check (not flat): +10
 * - Base: 40
 */
const runCodeQualityAgent = (files: FileData[]) => {
    const hasLinter = files.some(f => 
        f.name.includes('eslint') || 
        f.name.includes('prettier') || 
        f.name.includes('flake8') || 
        f.name.includes('rubocop') ||
        f.name.includes('stylelint')
    );
    const hasSrc = files.some(f => f.name === 'src' || f.name === 'lib' || f.name === 'app' || f.name === 'components');
    const hasGitIgnore = files.some(f => f.name === '.gitignore');
    const isNotFlat = files.some(f => f.type === 'dir' && !f.name.startsWith('.'));
    
    let score = 40; // Base
    if (hasLinter) score += 20;
    if (hasSrc) score += 20;
    if (hasGitIgnore) score += 10;
    if (isNotFlat) score += 10;
    
    return {
        score,
        context: `Linter detected: ${hasLinter}. Standard 'src' folder: ${hasSrc}. GitIgnore: ${hasGitIgnore}. Structure depth: ${isNotFlat}.`
    };
};

/**
 * Agent 2: Documentation Agent (Rules)
 * - README exists: +30
 * - Installation section: +20
 * - Usage section: +20
 * - Description length > 100 chars: +20
 * - License detected: +10
 */
const runDocAgent = (readme: string, repoData: RepoMetadata) => {
    const readmeLower = readme.toLowerCase();
    const hasReadme = readme.length > 0 && readme !== "No README.md found.";
    
    let score = 0;
    if (hasReadme) score += 30;
    if (readmeLower.includes('installation') || readmeLower.includes('install') || readmeLower.includes('setup')) score += 20;
    if (readmeLower.includes('usage') || readmeLower.includes('getting started')) score += 20;
    if (repoData.description && repoData.description.length > 20) score += 20;
    if (repoData.license) score += 10;

    return {
        score,
        context: `README present: ${hasReadme}. Install section: ${readmeLower.includes('installation')}. Usage section: ${readmeLower.includes('usage')}. Description: ${!!repoData.description}. License: ${!!repoData.license}.`
    };
};

/**
 * Agent 3: Commit Agent (Rules)
 * - Commits exist: +20
 * - Conventional Commits ratio > 30%: +20
 * - Active in last 30 days: +20
 * - Commit count > 20: +20
 * - Commit count > 50: +20
 */
const runCommitAgent = (commits: CommitData[]) => {
    if (commits.length === 0) return { score: 0, context: "No commit history found." };

    let score = 20; // Base for having commits
    
    // Check Conventional Commits
    const conventionalRegex = /^(feat|fix|docs|style|refactor|test|chore|ci|perf)(\(.+\))?:/;
    const goodCommits = commits.filter(c => conventionalRegex.test(c.message));
    const ratio = goodCommits.length / commits.length;
    if (ratio > 0.3) score += 20;

    // Check Recency
    const lastCommitDate = new Date(commits[0].date);
    const now = new Date();
    const diffDays = Math.ceil((now.getTime() - lastCommitDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 30) score += 20;

    // Check Frequency/Volume
    if (commits.length > 5) score += 20; // Adjusted for partial fetch
    if (commits.length >= 15) score += 20; // Adjusted for partial fetch

    return {
        score,
        context: `Commit count (fetched): ${commits.length}. Conventional ratio: ${(ratio*100).toFixed(0)}%. Days since last: ${diffDays}.`
    };
};

/**
 * Agent 4: Test Coverage Agent (Rules)
 * - Test folder exists: +30
 * - CI Configuration file exists: +30
 * - Specific test files detected: +20
 * - Base: 20
 */
const runTestAgent = (files: FileData[]) => {
    const testDirs = ['test', 'tests', '__tests__', 'spec', 'specs'];
    const hasTestDir = files.some(f => testDirs.includes(f.name.toLowerCase()));
    
    const ciFiles = ['.github', '.travis.yml', 'circle.yml', 'jenkinsfile', '.gitlab-ci.yml', 'azure-pipelines.yml'];
    const hasCI = files.some(f => ciFiles.includes(f.name.toLowerCase()));

    const hasTestFiles = files.some(f => f.name.includes('.test.') || f.name.includes('.spec.') || f.name.includes('_test.'));

    let score = 20; // Base
    if (hasTestDir) score += 30;
    if (hasCI) score += 30;
    if (hasTestFiles) score += 20;

    return {
        score,
        context: `Test dir: ${hasTestDir}. CI config: ${hasCI}. Test files: ${hasTestFiles}.`
    };
};

/**
 * Agent 5: Tech Stack Agent (Rules)
 * - Package/Dependency file exists: +40
 * - File has content: +20
 * - Lock file exists (yarn.lock, package-lock.json, go.sum, etc): +20
 * - Standard structure: +20
 */
const runTechStackAgent = (files: FileData[], dependencyFile: string) => {
    const packageFiles = ['package.json', 'requirements.txt', 'go.mod', 'Cargo.toml', 'pom.xml', 'build.gradle', 'composer.json', 'Gemfile'];
    const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'go.sum', 'Cargo.lock', 'Gemfile.lock', 'composer.lock'];
    
    const hasPackageFile = files.some(f => packageFiles.includes(f.name));
    const hasLockFile = files.some(f => lockFiles.includes(f.name));
    
    let score = 20;
    if (hasPackageFile) score += 40;
    if (dependencyFile.length > 50) score += 20;
    if (hasLockFile) score += 20;
    
    return {
        score,
        context: `Dependency file: ${hasPackageFile}. Lock file: ${hasLockFile}. Content length: ${dependencyFile.length}.`
    };
}

// --- ORCHESTRATOR ---

export const analyzeRepoWithGemini = async (
    repoData: RepoMetadata, 
    readmeContent: string,
    files: FileData[],
    commits: CommitData[],
    dependencyFile: string,
    style: SummaryStyle,
    userRole: UserRole = 'Student'
): Promise<GeminiAnalysis> => {
    const ai = getClient();
    
    // 1. Run Heuristic Agents (Phase 2)
    const codeAgent = runCodeQualityAgent(files);
    const docAgent = runDocAgent(readmeContent, repoData);
    const commitAgent = runCommitAgent(commits);
    const testAgent = runTestAgent(files);
    const techAgent = runTechStackAgent(files, dependencyFile);

    // Style instructions map
    const styleInstructions = {
        'Clarity': "Focus on easy-to-understand sentences, logical flow, and no ambiguity. Use simple language.",
        'Naturalness': "Use human-like, conversational but professional language. Avoid robotic phrasing.",
        'Professional': "Use a formal, mentoring tone. Avoid slang. Be objective and authoritative.",
        'Informativeness': "Be highly actionable, specific, and detailed. Prioritize density of information over fluff."
    };

    // Role-based tailoring
    const roleInstructions: Record<string, string> = {
        'Student': "Focus on educational value. Explain *why* certain practices are important. Suggest learning resources where applicable. The roadmap should be a learning path.",
        'Mentor': "Provide evaluative and constructive feedback. Highlight potential pitfalls and best practices. Use a coaching tone.",
        'Recruiter': "Focus on employability, code standards, and project maturity. Highlight if the candidate demonstrates industry-ready skills.",
        'Developer': "Focus on technical depth, architecture, scalability, and maintainability. Be concise and technical. Roadmap should be advanced refactoring or scaling steps."
    };

    // Fallback for custom roles
    const specificRoleInstruction = roleInstructions[userRole] || `Focus on values important to a ${userRole}. Provide a balanced and comprehensive analysis suitable for this role.`;

    // 2. Prepare System Prompt (Phase 3 & 4)
    const prompt = `
    🔹 SYSTEM ROLE
    You are an AI-powered GitHub Repository Evaluation System designed for hackathon judging.
    Your behavior must be deterministic, consistent, and repeatable.
    
    🔹 TARGET AUDIENCE
    You are generating this report for a **${userRole}**.
    ${specificRoleInstruction}

    🔹 CRITICAL RULE
    If the same GitHub repository URL is analyzed multiple times, you MUST produce the same strengths, weaknesses, and roadmap items.

    🔹 INPUT DATA
    REPOSITORY: ${repoData.full_name}
    DESCRIPTION: ${repoData.description || "None"}
    LANGUAGE: ${repoData.language}
    
    --- PHASE 2: RULE-BASED SCORING (PRE-CALCULATED) ---
    The following scores have been calculated based on strict deterministic rules:
    
    [CODE QUALITY AGENT]: ${codeAgent.score}/100
    Context: ${codeAgent.context}
    
    [DOCUMENTATION AGENT]: ${docAgent.score}/100
    Context: ${docAgent.context}
    
    [COMMIT AGENT]: ${commitAgent.score}/100
    Context: ${commitAgent.context}
    Recent Msg: ${commits.slice(0, 3).map(c => c.message).join(' | ')}
    
    [TEST COVERAGE AGENT]: ${testAgent.score}/100
    Context: ${testAgent.context}
    
    [TECH STACK AGENT]: ${techAgent.score}/100
    Context: ${techAgent.context}
    Dep File Snippet: ${dependencyFile.slice(0, 500)}

    --- PHASE 3: FIXED WEIGHT FINAL SCORE ---
    Compute the FINAL OVERALL SCORE using this EXACT formula:
    
    Final Score = 
      (0.25 * Code Quality) + 
      (0.20 * Documentation) + 
      (0.15 * Commit) + 
      (0.15 * Test Coverage) + 
      (0.15 * Tech Stack) + 
      (0.10 * 80) [Base Real-world Applicability Score]
      
    *Round the final score to the nearest integer.*

    --- PHASE 4: AI SUMMARY GENERATION ---
    Generate a report based on the User's Selected Style: "${style}".
    
    Style Guide for "${style}":
    ${styleInstructions[style]}

    OUTPUT REQUIREMENTS:
    1. **overallScore**: The calculated weighted score.
    2. **summary**: A textual summary adhering to the "${style}" style and tailored for a ${userRole}.
    3. **strengths**: 3 specific strengths based on data.
    4. **weaknesses**: 3 specific weaknesses based on data.
    5. **roadmap**: 5 actionable steps to improve the repo.

    Return ONLY JSON.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    overallScore: { type: Type.NUMBER },
                    agentScores: {
                        type: Type.OBJECT,
                        properties: {
                            codeQuality: { type: Type.NUMBER },
                            documentation: { type: Type.NUMBER },
                            commitHealth: { type: Type.NUMBER },
                            testCoverage: { type: Type.NUMBER },
                            techStack: { type: Type.NUMBER }
                        },
                        required: ['codeQuality', 'documentation', 'commitHealth', 'testCoverage', 'techStack']
                    },
                    summary: { type: Type.STRING },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                    roadmap: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                difficulty: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced'] },
                                category: { type: Type.STRING, enum: ['Documentation', 'Code Quality', 'DevOps', 'Features'] }
                            },
                            required: ['title', 'description', 'difficulty', 'category']
                        }
                    }
                },
                required: ['overallScore', 'agentScores', 'summary', 'strengths', 'weaknesses', 'roadmap']
            }
        }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    try {
        const result = JSON.parse(text);
        
        // Enforce the pre-calculated agent scores to ensure consistency with the UI
        result.agentScores = {
            codeQuality: codeAgent.score,
            documentation: docAgent.score,
            commitHealth: commitAgent.score,
            testCoverage: testAgent.score,
            techStack: techAgent.score
        };

        return {
            score: result.overallScore,
            agentScores: result.agentScores,
            agentDetails: {
                codeQuality: codeAgent.context,
                documentation: docAgent.context,
                commitHealth: commitAgent.context,
                testCoverage: testAgent.context,
                techStack: techAgent.context
            },
            summary: result.summary,
            strengths: result.strengths,
            weaknesses: result.weaknesses,
            roadmap: result.roadmap,
            summaryStyle: style
        };
    } catch (e) {
        console.error("Failed to parse JSON", e);
        throw new Error("Failed to parse analysis results");
    }
};

export const initializeChatSession = (repoData: RepoMetadata, analysis: GeminiAnalysis): Chat => {
    const ai = getClient();
    
    // Construct the context object for the chat
    const context = {
        repository: repoData.full_name,
        language: repoData.language,
        description: repoData.description,
        scores: analysis.agentScores,
        finalScore: analysis.score,
        summary: analysis.summary,
        roadmap: analysis.roadmap
    };

    const systemInstruction = `
    You are an AI Mentor Chatbot integrated into a GitHub Repository Evaluation system.

    Your responsibilities:
    1. Greet users politely and professionally.
    2. Answer questions about the analyzed GitHub repository using the provided evaluation data.
    3. Explain scores, roadmap items, and recommendations clearly.
    4. Answer general programming, GitHub, and software engineering questions if the query is not repository-specific.

    Context provided to you:
    ${JSON.stringify(context, null, 2)}

    Strict Rules:
    - Do NOT change or recompute any scores.
    - Do NOT invent new issues or strengths.
    - Base repository-specific answers strictly on the given analysis.
    - Use a friendly, professional mentoring tone.
    - If the user greets you, respond with a warm greeting and explain how you can help.
    - If the user asks general technical questions, answer them clearly with examples.

    Always behave like a supportive AI mentor.
    `;

    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
        }
    });
};