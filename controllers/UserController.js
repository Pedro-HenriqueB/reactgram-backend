import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const jwtSecret = process.env.JWT_SECRET;

const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: "7d",
  });
};

// Register user and sign in
const register = async (req, res) => {
  const { name, email, password } = req.body;
  // Check if user exists
  const user = await User.findOne({ email });
  if (user) {
    res.status(422).json({ errors: ["Por favor, utilize outro e-mail"] });
    return;
  }
  // Generate salce
  const salce = await bcrypt.genSalt();
  const passwordHash = await bcrypt.hash(password, salce);
  // Create user
  const newUser = await User.create({
    name,
    email,
    password: passwordHash, // Usar o valor de passwordHash com nome de password
  });
  // if user was created successfully, return the token
  if (!newUser) {
    res
      .status(422)
      .json({ errors: ["Houve um erro, por favor tente mais tarde."] });
    return;
  }

  return res.status(201).json({
    _id: newUser.id,
    token: generateToken(newUser.id),
  });
};
// Sign user in
const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  // check if user exists
  if (!user) {
    res.status(400).json({ errors: ["Usuario nao encontrado."] });
    return;
  }
  // check if password matches
  if (!bcrypt.compare(password, user.password)) {
    res.status(400).json({ errors: ["Senha invalida"] });
    return;
  }

  res.status(201).json({
    _id: user._id,
    profileImage: user.profileImage,
    token: generateToken(user._id),
  });
};

// Get current logged in user
const getCurrentUser = async (req, res) => {
  const user = req.user;
  res.status(200).json(user);
};

// Update an user
const update = async (req, res) => {
  const { name, password, bio } = req.body;
  let profileImage = null;
  if (req.file) {
    profileImage = req.file.filename;
  }
  const reqUser = req.user;
  const user = await User.findById(reqUser._id).select("-password");
  if (name) {
    user.name = name;
  }
  if (password) {
    // Generate salce
    const salce = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salce);
    user.password = passwordHash;
  }
  if (profileImage) {
    user.profileImage = profileImage;
  }
  if (bio) {
    user.bio = bio;
  }
  await user.save();
  res.status(200).json(user);
};

// Get user by id
const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    // check if user exists
    const user = await User.findById(new mongoose.Types.ObjectId(id)).select(
      "-password"
    );

    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ errors: ["Usuario nao encontrado!"] });
    return;
  }
};

export { register, login, getCurrentUser, update, getUserById };
