import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    default: "default.jpg",
  },
  backgroundPicture: {
    type: String,
    // Provide a default beautiful background banner
    default: "https://images.pexels.com/photos/906150/pexels-photo-906150.jpeg",
  },
  createAt: {
    type: Date,
    default: Date.now,
  },
  token: {
    type: String,
    default: "",
  },
});

const User = mongoose.model("User", UserSchema);

export default User;
