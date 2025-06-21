import Joi from 'joi';

export const moodValidation = {
  logMood: {
    body: Joi.object({
      moodScore: Joi.number().min(1).max(10).required(),
      emotions: Joi.array().items(Joi.string()).max(5).optional(),
      notes: Joi.string().max(500).optional().allow(null)
    })
  },
  
  updateMood: {
    body: Joi.object({
      moodScore: Joi.number().min(1).max(10).optional(),
      emotions: Joi.array().items(Joi.string()).max(5).optional(),
      notes: Joi.string().max(500).optional().allow(null)
    }).min(1) // At least one field required
  }
};