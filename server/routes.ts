import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { getUncachableGitHubClient } from "./githubClient";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/github/create-repo", async (req, res) => {
    try {
      const { name, description, isPrivate } = req.body;
      const octokit = await getUncachableGitHubClient();
      const { data: user } = await octokit.users.getAuthenticated();
      
      let repo;
      try {
        repo = await octokit.repos.get({ owner: user.login, repo: name });
      } catch {
        const created = await octokit.repos.createForAuthenticatedUser({
          name,
          description: description || "Taqqafi - Privacy-first expense tracker",
          private: isPrivate !== false,
          auto_init: false,
        });
        repo = created;
      }

      res.json({ 
        success: true, 
        owner: user.login, 
        repo: repo.data.name,
        url: repo.data.html_url,
        clone_url: repo.data.clone_url 
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/github/user", async (_req, res) => {
    try {
      const octokit = await getUncachableGitHubClient();
      const { data: user } = await octokit.users.getAuthenticated();
      res.json({ success: true, login: user.login, name: user.name });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
