import { Router } from 'express';
import multer from 'multer';
import { param, body } from 'express-validator';
import { validateRequest } from '../middleware/validate-request.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { DocumentController } from '../controllers/document.controller';
import { DatabaseService } from '../services/database.service';
import { BaseRoute } from './base.route';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, and text files are allowed.'));
    }
  },
});

export class DocumentRoutes extends BaseRoute {
  private documentController: DocumentController;

  constructor(private db: DatabaseService) {
    super();
    this.documentController = new DocumentController(db);
    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    // Apply auth middleware to all routes
    this.router.use(authMiddleware);

    // Upload document
    this.router.post(
      '/projects/:projectId/documents',
      [
        param('projectId').isUUID().withMessage('Invalid project ID'),
      ],
      validateRequest,
      upload.single('file'),
      this.asyncHandler(this.documentController.uploadDocument)
    );

    // Search documents
    this.router.post(
      '/projects/:projectId/documents/search',
      [
        param('projectId').isUUID().withMessage('Invalid project ID'),
        body('query').isString().notEmpty().withMessage('Search query is required'),
      ],
      validateRequest,
      this.asyncHandler(this.documentController.searchDocuments)
    );

    // List documents
    this.router.get(
      '/projects/:projectId/documents',
      [
        param('projectId').isUUID().withMessage('Invalid project ID'),
      ],
      validateRequest,
      this.asyncHandler(this.documentController.listDocuments)
    );

    // Delete document
    this.router.delete(
      '/documents/:documentId',
      [
        param('documentId').isUUID().withMessage('Invalid document ID'),
      ],
      validateRequest,
      this.asyncHandler(this.documentController.deleteDocument)
    );
  }
}

// Export a function that creates the router
export default (db: DatabaseService) => {
  return new DocumentRoutes(db).router;
};
