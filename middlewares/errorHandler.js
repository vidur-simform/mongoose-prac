exports.errorHandler = (error, req, res, next) => {
    // console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    if(status==500){
        res.status(status).json({message:"Something went wrong!"});
        console.log(error)
    }else{
        res.status(status).json({ message: message, data: data });
    }
};
