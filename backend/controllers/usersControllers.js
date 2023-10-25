const User = require('../models/User.js');
const Note = require('../models/Note.js');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

// @desc GET all users
// @route GET /users
// @access Private

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').lean();
  if (!users?.length) {
    return res.status(400).json({ message: 'No users found' });
  }
  res.json(users);
});

// @desc Create new user
// @route POST /users
// @access Private

const createNewUser = asyncHandler(async (req, res) => {
  const { username, password, roles } = req.body;

  // confirm data
  if (!username || !password || !Array.isArray(roles) || !roles.length) {
    return res.status(400).json({ message: 'All fields are required ' });
  }

  // find duplicate
  const duplicate = await User.findOne({ username }).lean().exec();

  if (duplicate) {
    return res.status(409).json({ message: 'Duplicate username' });
  }

  // hash password
  const hashed_pwd = await bcrypt.hash(password, 10); //salt round

  // create and save user object
  const user_object = { username, password: hashed_pwd, roles };
  const user = await User.create(user_object);

  if (user) {
    return res.status(200).json({ message: `New User ${username} created` });
  } else {
    return res.status(400).json({ message: 'Invalid Userdata received ' });
  }
});

// @desc Update new user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
  const { id, username, password, active, roles } = req.body;

  // confirm data
  if (
    !id ||
    !username ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== 'boolean'
  ) {
    return res.status(400).json({ message: 'All fields are required ' });
  }

  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  // check for duplicate
  const duplicate = await User.findOne({ username }).lean().exec();

  //allow updates to original user
  if (duplicate && duplicate._id.toString() !== id) {
    return res.status(409).json({ message: 'Duplicate username' });
  }

  user.username = username;
  user.active = active;
  user.roles = roles;

  if (password) {
    user.password = await bcrypt.hash(password, 10); // salt rounds
  }

  const updatedUser = await user.save();

  res.json({ message: `${updatedUser.username} updated` });
});

// @desc Delete a user
// @route DELETE /users
// @access Private

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'User ID required ' });
  }

  const note = await Note.findOne({ user: id }).lean().exec();

  if (note) {
    return res.status(400).json({ message: 'User has assigned notes' });
  }

  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  const result = await user.deleteOne();

  const reply = `username ${result.username} with id ${result._id} deleted`;

  res.json(reply);
});

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser,
};
