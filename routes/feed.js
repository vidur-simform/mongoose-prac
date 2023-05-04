const express = require('express');
const { body } = require('express-validator/check');
const { isAuth } = require('../middlewares/is-auth');

const feedController = require('../controllers/feed');

const router = express.Router();

// GET /feed/posts
router.get('/posts', isAuth, feedController.getPosts);

//GET /feed/posts/123
router.get('/myposts', isAuth, feedController.getPostsByUser);
router.get('/sortByTitle', isAuth, feedController.sortByTitle);
router.get('/searchFromContent/', isAuth, feedController.searchFromContent);
router.get('/groupByType', isAuth, feedController.groupByType);


//POST /feed/post
router.post('/addpost',
    isAuth,
    [
        body('title')
            .trim()
            .isLength({ min: 2 })
            .withMessage('Title length should be atleast 2.'),
        body('content')
            .trim()
            .isLength({ min: 5 })
            .withMessage('Content length should be atleast 5.')
    ],
    feedController.addPost);

//PUT /feed/post/123
router.put('/post/:postId',
    isAuth,
    [
        body('title')
            .trim()
            .isLength({ min: 2 })
            .withMessage('Title length should be atleast 2.'),
        body('content')
            .trim()
            .isLength({ min: 5 })
            .withMessage('Content length should be atleast 5.')
    ],
    feedController.updatePost);

//DELETE /feed/post/123
router.delete('/post/:postId', isAuth, feedController.deletePost);

module.exports = router;