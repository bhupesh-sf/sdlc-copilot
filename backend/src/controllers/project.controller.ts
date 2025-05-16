import { Request, Response } from 'express';
import { DatabaseService } from '../services/database.service';
import { NotFoundException, UnauthorizedException } from '../middleware/error.middleware';

export class ProjectController {
  constructor(private db: DatabaseService) {}

  async createProject(req: Request, res: Response) {
    const { name, description, jiraId } = req.body;
    const userId = req.user.id;

    const project = await this.db.projects.createProject({
      name,
      description,
      jira_id: jiraId,
      created_by: userId,
    });

    return { project };
  }

  async getProjects(req: Request, res: Response) {
    const userId = req.user.id;
    
    // Get projects where the user is the creator or has access
    const projects = await this.db.projects.findByUser(userId);
    
    return { projects };
  }

  async getProjectById(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await this.db.projects.findById(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user has access to this project
    if (project.created_by !== userId) {
      throw new UnauthorizedException('Not authorized to access this project');
    }

    return { project };
  }

  async updateProject(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, description, jiraId } = req.body;

    // Check if project exists and user has access
    const project = await this.db.projects.findById(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.created_by !== userId) {
      throw new UnauthorizedException('Not authorized to update this project');
    }

    const updatedProject = await this.db.projects.updateProject(id, {
      name,
      description,
      jira_id: jiraId,
    });

    return { project: updatedProject };
  }

  async deleteProject(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if project exists and user has access
    const project = await this.db.projects.findById(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.created_by !== userId) {
      throw new UnauthorizedException('Not authorized to delete this project');
    }

    await this.db.projects.deleteProject(id);
    return { success: true };
  }
}

export default ProjectController;
