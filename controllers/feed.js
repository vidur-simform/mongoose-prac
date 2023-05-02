const Post = require('../models/post');
const User = require('../models/user');

const { validationResult } = require('express-validator/check');
const { deleteFile } = require('../utils/file');


exports.getPosts = async (req, res, next) => {
    const { page = 1, perPage = 5 } = req.query;
    try {
        const postsCount = await Post.find().countDocuments();
        const posts = await Post.find().skip((page - 1) * perPage).limit(perPage);
        res.status(200).json({
            message: 'Fetched posts successfully.',
            posts: posts,
            postsCount: postsCount
        });
    }
    catch (err) {
        if (!err.statusCode)
            err.statusCode = 500;
        next(err);
    }
};

exports.getPostsByUser = async (req, res, next) => {
    const { page = 1, perPage = 5 } = req.query;
    const userId = req.userId;
    try {
        const postsCount = await Post.find().countDocuments();
        const posts = await Post.find({creator:userId}).skip((page - 1) * perPage).limit(perPage);
        res.status(200).json({
            message: 'Fetched posts successfully.',
            posts: posts,
            postsCount: postsCount
        });
    }
    catch (err) {
        if (!err.statusCode)
            err.statusCode = 500;
        next(err);
    }
};

// exports.getPost = async (req,res,next) => {
//     const postId = req.params.postId;
//     try {
//         const post = await Post.findById(postId);
//         if (!post) {
//             const error = new Error('Could not find post.');
//             error.statusCode = 404;
//             next(error);
//             return;
//         }
//         res.status(200).json({
//             message: 'Post fetched.',
//             post: post
//         });
//     }
//     catch (err) {
//         if (!err.statusCode)
//             err.statusCode = 500;
//         next(err);
//     }
// };
exports.addPost = async (req,res,next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error("Validation failed, entered post data is incorrect.");
        error.statusCode = 422;
        error.data = errors.array();
        next(error);
        return;
    }
    if (!req.file) {
        const error = new Error('No image provided.');
        error.statusCode = 422;
        next(error);
        return;
    }
    const { title, content } = req.body;
    const { path: imageUrl } = req.file;
    try {
        const post = await Post.create({
            title,
            content,
            imageUrl,
            creator: req.userId
        });
        const user = await User.findById(req.userId);
        user.posts.push(post);
        await user.save();
        res.status(201).json({
            message: 'Post created successfully!',
            post: post,
            creator: { _id: user._id, username: user.username }
        });
    }
    catch (err) {
        if (!err.statusCode)
            err.statusCode = 500;
        next(err);
    }
};

exports.updatePost = async (req,res,next) => {
    const postId = req.params.postId;
    const errors = validationResult(req);
    const { title, content } = req.body;
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.');
        error.statusCode = 422;
        error.data = errors.array();
        next(error);
        return;
    }

    const newImageUrl = req.file?.path; //will return undefined if file isn't present
    try {
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            next(error);
            return;
        }
        if (post.creator.toString() !== req.userId) {
            const error = new Error('Not authorized!');
            error.statusCode = 403;
            next(error);
            return;
        }
        if (newImageUrl) {
            const errFile = deleteFile(post.imageUrl);
            if(errFile){
                next(errFile);
                return;
            }
            post.imageUrl = newImageUrl;
        }
        post.title = title;
        post.content = content;
        const updatedPost = await post.save();
        res.status(200).json({
            message: 'Post updated!',
            post: updatedPost
        });
    }
    catch (err) {
        if (!err.statusCode)
            err.statusCode = 500;
        next(err);
    }
};

exports.deletePost = async (req,res,next) => {
    const postId = req.params.postId;
    try {
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            next(error);
            return;
        }
        if (post.creator.toString() !== req.userId) {
            const error = new Error('Not authorized!');
            error.statusCode = 403;
            next(error);
            return;
        }
        const errFile = deleteFile(post.imageUrl);
        if(errFile){
            next(errFile);
            return;
        }
        await Post.findByIdAndRemove(postId);
        const user = await User.findById(req.userId);
        user.posts.pull(postId);
        await user.save();
        res.status(200).json({ message: 'Deleted post.' });
    }
    catch (err) {
        if (!err.statusCode)
            err.statusCode = 500;
        next(err);
    }
};