const express = require('express');
const {
  getAllChats,
  deleteChat,
  deleteAllChats,
} = require('../controllers/chatController');
const { protect } = require('../controllers/authController');
const { getUserOwn } = require('../middlewares/chatMiddleware');
const router = express.Router();

router
  .route('/')
  .get(protect, getUserOwn, getAllChats)
  .delete(protect, deleteAllChats);
router.route('/:id').delete(protect, deleteChat);

module.exports = router;
