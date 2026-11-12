const { z } = require('zod');

const createProductSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Product name is required' })
      .trim()
      .min(3, 'Product name must have at least 3 characters')
      .max(120, 'Product name cannot exceed 120 characters'),
    description: z
      .string({ required_error: 'Product description is required' })
      .trim()
      .min(10, 'Description must have at least 10 characters')
      .max(2000, 'Description cannot exceed 2000 characters'),
    price: z
      .number({ required_error: 'Price is required' })
      .positive('Price must be greater than 0'),
    category: z
      .string({ required_error: 'Category is required' })
      .trim()
      .min(2, 'Category must be at least 2 characters'),
    stock: z
      .number({ required_error: 'Stock is required' })
      .int('Stock must be an integer')
      .nonnegative('Stock cannot be negative'),
  }),
});

module.exports = {
  createProductSchema,
};
