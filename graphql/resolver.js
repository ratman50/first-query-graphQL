const User = require("../models/user");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt=require("jsonwebtoken")
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
          const [user, IsPassWordEqual] = await Promise.all([
               User.findOne({ email }),
               bcrypt.compare(password, user.password),
          ]);
          if (!user || !IsPassWordEqual) {
               const error = new Error("User does not exist.");
               error.data = error;
               error.code = 401;
               throw error;
          }
          return {userId: user._id.toString(), token: jwt.sign({ email: user.email, userId: user._id.toString() }, "somesupersecretsecret", { expiresIn: "1h" })};
     },
};
