const Blog = require("../../models/Blog.model");
const { UserModel } = require("../../models/User.model");

const { StatusCodes } = require("http-status-codes");
const upload = require("../../middlewares/multer-config");

const createBlog = async (req, res) => {
  upload.single("thumbnail")(req, res, async (err) => {
    if (err) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Error uploading thumbnail", error: err });
    }

    try {
      const { lang, isPublished, category } = req.body;
      const thumbnail = req.file
        ? req.file.path
        : "https://placehold.co/600x400?text=Cover+Image";
      const blog = await Blog.create({
        lang,
        author: req.user._id,
        isPublished,
        thumbnail,
        category,
      });
      res.status(StatusCodes.CREATED).json({ blog });
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Error creating blog", error });
    }
  });
};

const getBlogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      startDate,
      endDate,
      sort,
      isPublished,
      category,
    } = req.query;
    const queryObject = {};

    if (search) {
      const searchTerm = search.replace(/^"|"$/g, ""); // Remove quotes
      const searchRegex = new RegExp(searchTerm, "i"); // Case-insensitive regex
      //   console.log(searchRegex, "searchRegex"); // Debug log

      // Find authors whose name or email matches the search term
      const authors = await UserModel.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select("_id");

      //   console.log(authors, "authors"); // Debug log

      // Construct the query for blogs
      queryObject.$or = [
        { title: { $regex: searchTerm, $options: "i" } }, // Match title
      ];

      // Add author condition only if matching authors are found
      if (authors.length > 0) {
        queryObject.$or.push({
          author: { $in: authors.map((author) => author._id) }, // Match author
        });
      }
    }

    if (startDate || endDate) {
      queryObject.createdAt = {};
      if (startDate) {
        queryObject.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        queryObject.createdAt.$lte = new Date(endDate);
      }
    }

    if (isPublished !== undefined) {
      queryObject.isPublished = isPublished === "true";
    }

    if (category) {
      queryObject.category = { $in: category.split(",") };
    }

    // Sorting
    let sortOption = {};
    if (sort) {
      const sortFields = sort.split(","); // Allow multiple sort fields (e.g., "createdAt,-title")
      console.log(sortFields, "sortFields");
      sortOption = sortFields.reduce((acc, field) => {
        if (field.startsWith("-")) {
          acc[field.slice(1)] = -1; // Descending order
        } else {
          acc[field] = 1; // Ascending order
        }
        return acc;
      }, {});
    } else {
      sortOption = { updated: -1 }; // Default sorting by createdAt in descending order
    }

    const blogs = await Blog.find(queryObject)
      .populate("author", "name email")
      .skip((page - 1) * limit)
      .sort(sortOption)
      .limit(parseInt(limit));
    // console.log(blogs, "blogs");

    const totalBlogs = await Blog.countDocuments(queryObject);

    res.status(StatusCodes.OK).json({
      blogs,
      totalPages: Math.ceil(totalBlogs / limit),
      currentPage: parseInt(page),
      totalBlogs: totalBlogs,
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error fetching blogs", error });
  }
};

const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate(
      "author",
      "name email"
    );
    if (!blog) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Blog not found" });
    }
    res.status(StatusCodes.OK).json({ blog });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error fetching blog", error });
  }
};

const updateBlog = async (req, res) => {
  upload.single("thumbnail")(req, res, async (err) => {
    if (err) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: err });
    }

    try {
      const { lang, isPublished, category } = req.body;
      const thumbnail = req.file ? req.file.path : null;

      const updateData = { lang, isPublished, category };

      if (thumbnail) {
        updateData.thumbnail = thumbnail;
      }

      const blog = await Blog.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      });
      if (!blog) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: "Blog not found" });
      }
      res.status(StatusCodes.OK).json({ blog });
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Error updating blog", error });
    }
  });
};

const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Blog not found" });
    }
    res.status(StatusCodes.OK).json({ message: "Blog deleted successfully" });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error deleting blog", error });
  }
};

module.exports = {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
};
