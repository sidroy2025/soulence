import Joi from 'joi';

export const validationSchemas = {
  // User validation schemas
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid('student', 'parent', 'therapist').required(),
    parentEmail: Joi.when('role', {
      is: 'student',
      then: Joi.string().email()
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Mood validation schemas
  moodLog: Joi.object({
    moodScore: Joi.number().integer().min(1).max(10).required(),
    emotions: Joi.array().items(Joi.string()).min(1).required(),
    notes: Joi.string().max(1000).optional()
  }),

  // Task validation schemas
  createTask: Joi.object({
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000).optional(),
    dueDate: Joi.date().greater('now').optional(),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    estimatedDuration: Joi.number().integer().min(1).max(480).optional(),
    tags: Joi.array().items(Joi.string()).optional()
  }),

  updateTask: Joi.object({
    title: Joi.string().min(1).max(255),
    description: Joi.string().max(1000),
    dueDate: Joi.date(),
    priority: Joi.string().valid('low', 'medium', 'high'),
    status: Joi.string().valid('pending', 'in_progress', 'completed'),
    estimatedDuration: Joi.number().integer().min(1).max(480),
    tags: Joi.array().items(Joi.string())
  }).min(1),

  // Document validation schemas
  documentUpload: Joi.object({
    filename: Joi.string().required(),
    fileType: Joi.string().required(),
    fileSize: Joi.number().integer().max(50 * 1024 * 1024).required() // 50MB max
  }),

  // AI interaction validation schemas
  aiChat: Joi.object({
    message: Joi.string().min(1).max(2000).required(),
    sessionId: Joi.string().uuid().optional()
  }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }
    
    req.body = value;
    next();
  };
};