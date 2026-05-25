const mongoose = require("mongoose");
const Category = require("./models/Category");
require("dotenv").config();

const addCategory = async () => {
  try {
    // 1. Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("🔌 Connected to MongoDB Atlas successfully!");

    // 2. EDIT THESE TWO LINES to change the category name and description:
    const name = "DevOps";
    const description = "Learn CI/CD, Docker, Kubernetes, and Cloud Deployment.";

    // 3. Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      console.log(`⚠️ Category "${name}" already exists!`);
      process.exit(0);
    }

    // 4. Create new category
    const newCategory = await Category.create({ name, description });
    console.log("✅ Successfully created category:", newCategory);
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating category:", err);
    process.exit(1);
  }
};

addCategory();
