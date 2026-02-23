const express = require("express");
const { connection } = require("./configs/db");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

//TODO Error Messages

const userAuthRouter = require("./routes/authRoutes/UsersAuthRoute");
const blogRouter = require("./routes/dataRoutes/Blogs.Route");
const contactRouter = require("./routes/dataRoutes/Contacts.Route");

const app = express();

app.use(express.json());

app.use(cookieParser(process.env.JWT_SECRET));
app.use(
  cors({
    origin: true,
    credentials: true,
    optionSuccessStatus: 200,
  })
);
app.set("trust proxy", 1);

app.use("/user/auth", userAuthRouter);
app.use("/blogs", blogRouter);
app.use("/contact-us", contactRouter);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// const sslServer = https.createServer({
//   key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
//   cert: fs.readFileSync(path.join(__dirname, 'cert',  'cert.pem'))
// })

app.listen(process.env.port, async () => {
  try {
    await connection;
    console.log("Connected to DB");
  } catch (error) {
    console.log("Unable to connect to DB");
    console.log(error);
  }
  console.log(`Listening at port ${process.env.port}`);
});
