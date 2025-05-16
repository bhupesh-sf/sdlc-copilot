import { Request } from 'express';
import { DatabaseService } from '../services/database.service';
import { BadRequestException, NotFoundException, UnauthorizedException } from '../middleware/error.middleware';
import { supabase, generateEmbedding } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth.middleware';

// Extend AuthRequest to include file
interface MulterRequest extends AuthRequest {
  file?: Express.Multer.File;
}

export class DocumentController {
  constructor(private db: DatabaseService) {}

  async uploadDocument(req: MulterRequest & AuthRequest) {
    if (!req.file) {
      throw new BadRequestException('No file uploaded');
    }

    const { projectId } = req.params;
    const userId = req.user.id;
    const { originalname: name, buffer, mimetype } = req.file;
    
    // Check if user has access to the project
    const project = await this.db.projects.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.created_by !== userId) {
      throw new UnauthorizedException('Not authorized to upload to this project');
    }

    // Upload file to Supabase Storage
    const fileExt = name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `projects/${projectId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, buffer, { contentType: mimetype });

    if (uploadError) {
      throw new BadRequestException(`Failed to upload file: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = (supabase.storage as any)
      .from('documents')
      .getPublicUrl(filePath);

    // Extract text from document (simplified for hackathon)
    let content = "";
    if (mimetype === 'text/plain') {
      content = buffer.toString('utf-8');
    } else if (mimetype === 'application/pdf') {
      // In a real app, you'd use a PDF parsing library here
      content = `[PDF content: ${name}]`;
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // In a real app, you'd parse .docx files
      content = `[Word document: ${name}]`;
    }

    // Generate embedding for the content
    const embedding = await generateEmbedding(content);

    // Store document metadata in database
    const document = await this.db.documents.createDocument({
      project_id: projectId,
      name,
      content,
      embedding,
      metadata: {
        mime_type: mimetype,
        size: buffer.length,
        storage_path: filePath,
        public_url: publicUrl
      },
      created_by: userId
    });

    return { document };
  }

  async searchDocuments(req: AuthRequest) {
    const { projectId } = req.params as { projectId: string };
    const { query } = req.body as { query: string };
    const userId = req.user.id;

    // Check if user has access to the project
    const project = await this.db.projects.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.created_by !== userId) {
      throw new UnauthorizedException('Not authorized to search documents in this project');
    }

    // Search for relevant documents using vector similarity
    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: await generateEmbedding(query),
      match_count: 5,
      filter: { project_id: projectId }
    });

    if (error) {
      throw new BadRequestException(`Search failed: ${error.message}`);
    }

    return { documents };
  }

  async listDocuments(req: AuthRequest) {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Check if user has access to the project
    const project = await this.db.projects.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.created_by !== userId) {
      throw new UnauthorizedException('Not authorized to list documents in this project');
    }

    const documents = await this.db.documents.findByProject(projectId);
    return { documents };
  }

  async deleteDocument(req: AuthRequest) {
    const { documentId } = req.params as { documentId: string };
    const userId = req.user.id;

    // Get document to check permissions
    const document = await this.db.documents.findById(documentId);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Check if user has access to the project
    const project = await this.db.projects.findById(document.project_id);
    if (!project || project.created_by !== userId) {
      throw new UnauthorizedException('Not authorized to delete this document');
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([(document.metadata as { storage_path: string }).storage_path]);

    if (storageError) {
      console.error('Failed to delete file from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    await this.db.documents.deleteDocument(documentId);
    
    return { success: true };
  }
}

export default DocumentController;
