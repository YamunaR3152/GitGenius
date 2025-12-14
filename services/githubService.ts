import { RepoMetadata, CommitData, FileData, UserRepo } from '../types';

const GITHUB_API_BASE = 'https://api.github.com/repos';

export const parseGithubUrl = (url: string): string | null => {
  try {
    const cleanUrl = url.trim().replace(/\/$/, '');
    const regex = /github\.com\/([^\/]+\/[^\/]+)/;
    const match = cleanUrl.match(regex);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
};

export const fetchRepoMetadata = async (fullName: string): Promise<RepoMetadata> => {
  const response = await fetch(`${GITHUB_API_BASE}/${fullName}`);
  if (!response.ok) {
    if (response.status === 404) throw new Error('Repository not found. Is it private?');
    if (response.status === 403) throw new Error('GitHub API rate limit exceeded. Please try again later.');
    throw new Error('Failed to fetch repository metadata');
  }
  return response.json();
};

export const fetchUserRepositories = async (username: string): Promise<UserRepo[]> => {
  try {
    // Fetch public repos, sorted by recently updated
    const response = await fetch(`https://api.github.com/users/${username}/repos?type=public&sort=updated&per_page=10`);
    
    if (!response.ok) {
        if (response.status === 404) throw new Error('User not found');
        throw new Error('Failed to fetch user repositories');
    }
    
    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        html_url: repo.html_url,
        description: repo.description,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        updated_at: repo.updated_at
      }));
    }
    return [];
  } catch (error) {
    console.warn("Error fetching user repos", error);
    throw error;
  }
};

export const fetchReadmeContent = async (fullName: string, defaultBranch: string = 'main'): Promise<string> => {
  try {
    const branches = [defaultBranch, 'main', 'master'];
    const uniqueBranches = Array.from(new Set(branches));
    
    for (const branch of uniqueBranches) {
      const response = await fetch(`https://raw.githubusercontent.com/${fullName}/${branch}/README.md`);
      if (response.ok) {
        return await response.text();
      }
    }
    return "No README.md found.";
  } catch (error) {
    console.warn("Could not fetch README", error);
    return "Error fetching README.";
  }
};

export const fetchRepoStructure = async (fullName: string): Promise<FileData[]> => {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/${fullName}/contents`);
    if (!response.ok) return [];
    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        name: item.name,
        type: item.type,
        path: item.path
      }));
    }
    return [];
  } catch (e) {
    console.warn("Could not fetch repo structure", e);
    return [];
  }
};

export const fetchRecentCommits = async (fullName: string): Promise<CommitData[]> => {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/${fullName}/commits?per_page=15`);
    if (!response.ok) return [];
    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        sha: item.sha,
        message: item.commit.message,
        author_name: item.commit.author.name,
        date: item.commit.author.date
      }));
    }
    return [];
  } catch (e) {
    console.warn("Could not fetch commits", e);
    return [];
  }
};

export const fetchDependencyFile = async (fullName: string, files: FileData[]): Promise<string> => {
  // Try to find a package file to give the Tech Stack agent more context
  const packageFiles = ['package.json', 'requirements.txt', 'go.mod', 'Cargo.toml', 'pom.xml', 'build.gradle'];
  const foundFile = files.find(f => packageFiles.includes(f.name));
  
  if (foundFile) {
    try {
      const response = await fetch(`https://raw.githubusercontent.com/${fullName}/main/${foundFile.name}`);
      if (response.ok) return await response.text();
      // Try master if main fails
      const responseMaster = await fetch(`https://raw.githubusercontent.com/${fullName}/master/${foundFile.name}`);
      if (responseMaster.ok) return await responseMaster.text();
    } catch (e) {
      console.warn("Could not fetch dependency file", e);
    }
  }
  return "";
};