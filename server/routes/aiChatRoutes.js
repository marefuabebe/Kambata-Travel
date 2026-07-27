const express = require('express');
const router = express.Router();
const { handleChatRequest } = require('../controllers/aiChatController');
const { protect } = require('../middleware/authMiddleware');

// The route is partially protected. We allow anonymous users, 
// but if a token is present, we extract req.user
const optionalProtect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  } else {
    next();
  }
};

router.post('/', optionalProtect, handleChatRequest);

module.exports = router;
