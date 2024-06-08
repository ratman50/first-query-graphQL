const User = require("../models/user");
const Post = require("../models/post");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const user = require("../models/user");
// module.exports={
//     hello(){
//         return {
//             text: 'Hello World!',
//             views:1245
//         }
//     }
// }

module.exports = {
     createUser: async (args, req) => {
          const {
               userInput: { email, name, password },
          } = args;
          const errors = [];
          if (validator.isEmpty(email) || !validator.isEmail(email)) {
               errors.push({ message: "Email is invalid" });
          }
          if (validator.isEmpty(name)) {
               errors.push({ message: "Name is invalid" });
          }
          if (validator.isEmpty(password) || !validator.isLength(password, { min: 5 })) {
               errors.push({ message: "Password too short" });
          }

          if (errors.length > 0) {
               const error = new Error("Invalid input.");
               error.data = errors;
               error.code = 422;
               throw error;
          }
          const existingUser = await User.findOne({ email });
          if (existingUser) {
               throw new Error("User exists already.");
          }

          const hashedPassword = await bcrypt.hash(password, 12);

          const user = new User({
               email,
               name,
               password: hashedPassword,
          });

          const result = await user.save();
          return { ...result._doc, _id: result._id.toString() };
     },

     login: async (args, req) => {
          const { email, password } = args;
          const user = await User.findOne({ email });
          if (!user) {
               const error = new Error("User does not exist.");
               error.code = 401;
               throw error;
          }
          const isPasswordEqual = await bcrypt.compare(password, user.password);
          if (!isPasswordEqual) {
               const error = new Error("User does not exist.");
               error.code = 401;
               throw error;
          }

          const token = jwt.sign(
               { email: user.email, userId: user._id.toString() },
               "somesupersecretsecret",
               { expiresIn: "1h" }
          );
          return {
               userId: user._id.toString(),
               token,
          };
     },

     createPost: async (args, req) => {
          if (!req.isAuth) {
               const error = new Error("Not authenticated!");
               error.code = 401;
               throw error;
          }
          const { title, content, imageUrl } = args.postInput;
          const errors = [];
          if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
               errors.push({ message: "Title is invalid" });
          }
          if (!validator.isURL(imageUrl)) {
               errors.push({ message: "Image URL is invalid" });
          }
          if (validator.isEmpty(content) || !validator.isLength(content, { min: 5 })) {
               errors.push({ message: "Content is invalid" });
          }
          const existingUser = await User.findById(req.userId);
          if (!existingUser) {
               const error = new Error("User does not exist.");
               error.code = 401;
               throw error;
          }
          if (errors.length > 0) {
               const error = new Error("Invalid input.");
               error.data = errors;
               error.code = 422;
               throw error;
          }
          const post = new Post({
               title,
               content,
               imageUrl,
               creator: existingUser,
          });
          const result = await post.save();
          existingUser.posts.push(result);
          existingUser.save();
          return {
               ...result._doc,
               _id: result._id.toString(),
               createdAt: new Date(result._doc.createdAt).toISOString(),
               updatedAt: new Date(result._doc.updatedAt).toISOString(),
          };
     },
     getPosts: async (args, req) => {
          const {page}=args;
          if (!req.isAuth) {
               const error = new Error("Not authenticated!");
               error.code = 401;
               throw error;
          }
          const userId = req.userId;
          const posts = (await Post.find({ creator: userId }).sort({ createdAt: -1 })
               .skip((page-1)*2).limit(2).populate("creator")).map((post) => {
                    return {
                         ...post._doc,
                         _id: post.id,
                         createdAt: new Date(post._doc.createdAt).toISOString(),
                         updatedAt: new Date(post._doc.updatedAt).toISOString(),
                    };
               });
          return{
               posts,
               totalPosts:posts.length
          }
     },
};
