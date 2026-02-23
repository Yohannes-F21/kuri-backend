const express = require("express");
const router = express.Router();
const {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
} = require("../../controller/dataController/blogDataController");
const { authenticateUser } = require("../../middlewares/authentication");

router.route("/").post(authenticateUser, createBlog).get(getBlogs);

router
  .route("/:id")
  .get(getBlogById)
  .put(authenticateUser, updateBlog)
  .delete(authenticateUser, deleteBlog);

module.exports = router;
