const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review text cannot be empty'],
      trim: true,
      maxlength: [1000, 'Review cannot exceed 1000 characters'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1.0'],
      max: [5, 'Rating cannot exceed 5.0'],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Review must belong to a product'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Prevent duplicate reviews by the same user on the same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
