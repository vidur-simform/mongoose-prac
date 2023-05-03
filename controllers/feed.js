const Post = require('../models/post');
const User = require('../models/user');
const { ObjectId } = require("mongoose").Types;
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
    const userId = new ObjectId(req.userId);
    try {
        const postsCount = await Post.find().countDocuments();
        const posts = await Post.aggregate([
            { $match: { creator: userId } },
            { $skip: (page - 1) * perPage },
            { $limit: perPage },
            { $project: { '_id': 0, "title": 1, "imageUrl": 1, "content": 1, "posttype": 1 } }
        ]);
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
exports.sortByTitle = async (req, res, next) => {
    const userId = new ObjectId(req.userId);
    try {
        const posts = await Post.aggregate([
            { $match: { creator: userId } },
            { $sort: { title: 1 } },
            { $project: { '_id': 0, "title": 1, "imageUrl": 1, "content": 1, "posttype": 1 } }
        ]);
        res.status(200).json({
            message: 'Fetched posts successfully.',
            posts: posts
        });
    }
    catch (err) {
        if (!err.statusCode)
            err.statusCode = 500;
        next(err);
    }
};
exports.groupByType = async (req, res, next) => {
    const userId = new ObjectId(req.userId);
    try {
        const posts = await Post.aggregate([
            { $group: { _id: "$posttype", posts: { $push: "$$ROOT" } } },
            { $project: { "_id": 0,type: "$_id", "posts": 1 } },
            { $project: { "posts.creator": 0, "posts.createdAt": 0, "posts.updatedAt": 0, "posts.__v": 0 } }
        ]);
        res.status(200).json({
            message: 'Fetched posts by groupped type successfully.',
            postsbytypes: posts
        });
    }
    catch (err) {
        if (!err.statusCode)
            err.statusCode = 500;
        next(err);
    }
};
exports.searchFromContent = async (req, res, next) => {
    const userId = new ObjectId(req.userId);
    const word = req.params.word || "#";
    try {
        const posts = await Post.aggregate([
            { $match: { creator: userId, $text: { $search: word } } },
            { $project: { '_id': 0, "title": 1, "imageUrl": 1, "content": 1, "posttype": 1 } }
        ]);
        res.status(200).json({
            message: 'Fetched posts successfully.',
            posts: posts
        });
    }
    catch (err) {
        if (!err.statusCode)
            err.statusCode = 500;
        next(err);
    }
};

exports.addPost = async (req, res, next) => {
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
    const { title, content, posttype } = req.body;
    const { path: imageUrl } = req.file;
    try {
        const post = await Post.create({
            title,
            content,
            imageUrl,
            posttype,
            creator: req.userId
        });
        const user = await User.findById(req.userId);
        user.posts.push(post);
        await user.save();
        res.status(201).json({
            message: 'Post created successfully!',
            post: { title, content, posttype, imageUrl: post.imageUrl, _id: post._id},
            creator: { _id: user._id, username: user.username }
        });
    }
    catch (err) {
        console.log(err);
        if (!err.statusCode)
            err.statusCode = 500;
        next(err);
    }
};

exports.updatePost = async (req, res, next) => {
    const postId = req.params.postId;
    const errors = validationResult(req);
    const { title, content, posttype } = req.body;
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
            if (errFile) {
                next(errFile);
                return;
            }
            post.imageUrl = newImageUrl;
        }
        post.title = title;
        post.content = content;
        post.posttype = posttype;
        const updatedPost = await post.save();
        res.status(200).json({
            message: 'Post updated!',
            post: { title:updatedPost.title, content:updatedPost.content, posttype:updatedPost.posttype, imageUrl: updatedPost.imageUrl, _id: updatedPost._id},
        });
    }
    catch (err) {
        if (!err.statusCode)
            err.statusCode = 500;
        next(err);
    }
};

exports.deletePost = async (req, res, next) => {
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
        if (errFile) {
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