import Photo from "../models/Photo.js";
import mongoose from "mongoose";
import User from "../models/User.js";

// Insert a photo, with an user related to it
const insertPhoto = async (req, res) => {
  const { title } = req.body;
  const image = req.file.filename;
  const reqUser = req.user;
  const user = await User.findById(reqUser._id);
  // Create a photo
  const newPhoto = await Photo.create({
    image,
    title,
    userId: user._id,
    userName: user.name,
  });
  // Check if photo was successfully created
  if (!newPhoto) {
    res.status(422).json({
      errors: ["Houve um problema, por favor tente novamente mais tarde!"],
    });
    return;
  }

  res.status(201).json(newPhoto);
};

const deletePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const reqUser = req.user;
    const photo = await Photo.findById(new mongoose.Types.ObjectId(id));
    // Check if photo belongs to user
    if (!photo.userId.equals(reqUser._id)) {
      res.status(422).json({
        errors: ["Ocorreu um erro, por favor tente novamente mais tarde."],
      });
    }
    // Delete photo
    await Photo.findByIdAndDelete(photo._id);
    res
      .status(200)
      .json({ id: photo._id, message: "Foto excluida com sucesso." });
    return;
  } catch (error) {
    res.status(404).json({ errors: ["Foto nao encontrada!"] });
    return;
  }
};

const getAllPhotos = async (req, res) => {
  const photos = await Photo.find({})
    .sort([["createAt", -1]])
    .exec();
  res.status(200).json(photos);
};

const getUserPhotos = async (req, res) => {
  const { id } = req.params;
  const photos = await Photo.find({ userId: id })
    .sort([["createdAt", -1]])
    .exec();
  return res.status(200).json(photos);
};

const getPhotoById = async (req, res) => {
  try {
    const { id } = req.params;
    const photo = await Photo.findById(id);
    res.status(200).json(photo);
  } catch (error) {
    res.status(404).json({ errors: ["Fotox nao encontrada!"] });
  }
};

const updatePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const reqUser = req.user;
    const photo = await Photo.findById(id);
    if (!photo.userId.equals(reqUser._id)) {
      res.status(422).json({
        errors: ["Ocorreu um erro, por favor tente novamente mais tarde."],
      });
      return;
    }
    if (title) {
      photo.title = title;
    }
    await photo.save();

    res.status(200).json({ photo, message: "Foto atualizada com sucesso." });
    return;
  } catch (error) {
    console.log(error);
    res.status(404).json({ errors: ["Foto nao encontrada!"] });
    return;
  }
};

const likePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const reqUser = req.user;
    const photo = await Photo.findById(id);
    // check if photo exists
    if (!photo) {
      res.status(404).json({ errors: ["Foto nao encontrada."] });
      return;
    }
    // Check if user alredy liked the photo
    if (photo.likes.includes(reqUser._id)) {
      res.status(422).json({ errors: ["Voce ja curtiu a foto."] });
      return;
    }
    // Put user id in likes array
    photo.likes.push(reqUser._id);
    photo.save();
    res.status(200).json({
      photoId: id,
      userId: reqUser._id,
      message: "A foto foi curtida.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: ["Internal server error."] });
  }
};

const commentPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const reqUser = req.user;
    const user = await User.findById(reqUser._id);
    const photo = await Photo.findById(id);
    // check if photo exists
    if (!photo) {
      res.status(404).json({ errors: ["Foto nao encontrada."] });
      return;
    }
    // Add comment in comments array
    const userComment = {
      comment,
      userName: user.name,
      userImage: user.profileImage,
      userId: user._id,
    };
    photo.comments.push(userComment);
    photo.save();
    res.status(200).json({
      comment: userComment,
      message: "O comentario foi adicionado com sucesso!",
    });
  } catch (error) {
    res.status(500).json({ message: ["Internal server error."] });
  }
};

const searchPhotos = async (req, res) => {
  try {
    const { q } = req.query;
    const photos = await Photo.find({ title: new RegExp(q, "i") }).exec();
    res.status(200).json(photos);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: ["Internal server error."] });
  }
};

export {
  insertPhoto,
  deletePhoto,
  getAllPhotos,
  getUserPhotos,
  getPhotoById,
  updatePhoto,
  likePhoto,
  commentPhoto,
  searchPhotos,
};
